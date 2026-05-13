"""Orchestrates the six-agent fact-checking pipeline."""

from __future__ import annotations

import asyncio
import hashlib
import json
import logging
import time
from typing import Any, Dict, List

from ..config import get_settings
from ..models import (
    AgentTrace,
    CheckResult,
    ClaimType,
    Source,
    Verdict,
)
from ..services.cache import cache
from ..services.gemini import get_gemini
from ..services.scraper import fetch_article
from ..services.search import get_search
from .prompts import (
    FAKE_NEWS_PROMPT,
    NLP_PROMPT,
    SYSTEM_BASE,
    VERDICT_PROMPT,
)
from .demo import demo_result

logger = logging.getLogger(__name__)


class FactCheckPipeline:
    """End-to-end fact-checking orchestrator."""

    def __init__(self) -> None:
        self.settings = get_settings()
        self.gemini = get_gemini()
        self.search = get_search()

    async def run(
        self,
        *,
        text: str | None = None,
        url: str | None = None,
        language: str = "ar",
    ) -> CheckResult:
        started = time.time()

        claim_type = ClaimType.URL if url else ClaimType.TEXT
        claim_text = (text or "").strip()
        article_title = ""

        if url and not claim_text:
            article_title, article_body = await fetch_article(url)
            claim_text = f"{article_title}\n\n{article_body}".strip() or url

        if not claim_text:
            raise ValueError("Empty claim. Provide text or URL.")

        claim_id = hashlib.sha256(claim_text.encode("utf-8")).hexdigest()[:12]
        cache_key = f"check:{claim_id}:{language}"
        if cached := cache.get(cache_key):
            return cached

        # Demo mode: deterministic preset + live free-tier web search.
        if not self.gemini.available:
            try:
                extras = await self.search.search(claim_text[:120], limit=5)
            except Exception:
                extras = []
            result = demo_result(
                claim_id=claim_id,
                claim=claim_text,
                claim_type=claim_type,
                language=language,
                processing_started=started,
                extra_sources=extras,
            )
            cache.set(cache_key, result)
            return result

        traces: List[AgentTrace] = []

        # 1. Linguistic analysis
        nlp_started = time.time()
        try:
            nlp_data = await self.gemini.generate_json(
                NLP_PROMPT.format(claim=claim_text[:2000]),
                system=SYSTEM_BASE,
                temperature=0.1,
            )
        except Exception as exc:
            logger.warning("NLP agent failed: %s", exc)
            nlp_data = {
                "main_claim": claim_text[:160],
                "search_queries": [claim_text[:120]],
                "claim_type": "factual",
            }
        traces.append(
            AgentTrace(
                agent="ArabicNLPAgent",
                role="تحليل لغوي للادعاء وتوليد استعلامات بحث",
                summary=str(nlp_data.get("main_claim", ""))[:200],
                duration_ms=int((time.time() - nlp_started) * 1000),
            )
        )

        # 2. Fake-news markers (runs in parallel with evidence retrieval)
        fake_task = asyncio.create_task(
            self._safe_json(
                FAKE_NEWS_PROMPT.format(claim=claim_text[:2000]),
                fallback={
                    "manipulation_score": 0.2,
                    "indicators": [],
                    "is_clickbait": False,
                    "is_satire": False,
                    "notes": "",
                },
                temperature=0.1,
            )
        )

        # 3. Evidence retrieval — search the web with each AI-generated query.
        evidence_started = time.time()
        queries = list(
            dict.fromkeys(
                q for q in nlp_data.get("search_queries", []) if isinstance(q, str) and q.strip()
            )
        )[:3]
        if not queries:
            queries = [claim_text[:120]]

        search_tasks = [self.search.search(q, limit=4) for q in queries]
        results_per_query = await asyncio.gather(*search_tasks, return_exceptions=True)

        sources: List[Source] = []
        seen_urls = set()
        for results in results_per_query:
            if isinstance(results, Exception):
                continue
            for s in results:
                if s.url in seen_urls:
                    continue
                seen_urls.add(s.url)
                sources.append(s)

        sources.sort(key=lambda s: s.credibility, reverse=True)
        sources = sources[:8]

        traces.append(
            AgentTrace(
                agent="EvidenceAgent",
                role="بحث متعدد المحركات عن مصادر داعمة",
                summary=f"تم العثور على {len(sources)} مصدر عبر {len(queries)} استعلام",
                duration_ms=int((time.time() - evidence_started) * 1000),
            )
        )

        # 4. Credibility — already computed per source.
        traces.append(
            AgentTrace(
                agent="CredibilityAgent",
                role="تقييم موثوقية المصادر",
                summary=f"متوسط الموثوقية {self._avg_credibility(sources):.2f}",
            )
        )

        # 5. Fake-news signals
        fake_signals = await fake_task
        traces.append(
            AgentTrace(
                agent="FakeNewsAgent",
                role="رصد مؤشرات التلاعب والتهييج",
                summary=(
                    f"درجة التلاعب {fake_signals.get('manipulation_score', 0):.2f}"
                    + (
                        f" | {len(fake_signals.get('indicators', []))} مؤشر"
                        if fake_signals.get("indicators")
                        else ""
                    )
                ),
            )
        )

        # 6. Final verdict synthesis
        verdict_started = time.time()
        evidence_block = self._format_evidence(sources)
        try:
            verdict_data = await self.gemini.generate_json(
                VERDICT_PROMPT.format(
                    claim=claim_text[:2000],
                    nlp_analysis=json.dumps(nlp_data, ensure_ascii=False, indent=2)[:1500],
                    fake_signals=json.dumps(fake_signals, ensure_ascii=False, indent=2)[:1000],
                    evidence=evidence_block,
                ),
                system=SYSTEM_BASE,
                temperature=0.2,
            )
        except Exception as exc:
            logger.error("VerdictAgent failed: %s", exc)
            verdict_data = {
                "verdict": "UNVERIFIED",
                "confidence": 0.3,
                "explanation_ar": (
                    "تعذّر إنتاج حكم نهائي بسبب خطأ تقني، ولكن تم جمع المصادر أدناه للمراجعة اليدوية."
                ),
                "explanation_en": "Could not produce a final verdict due to a technical error.",
                "key_points": [],
                "used_sources": [s.url for s in sources[:3]],
            }
        traces.append(
            AgentTrace(
                agent="VerdictAgent",
                role="تركيب الحكم النهائي وكتابة الشرح",
                summary=str(verdict_data.get("verdict", "UNVERIFIED")),
                duration_ms=int((time.time() - verdict_started) * 1000),
            )
        )

        verdict_value = self._normalise_verdict(verdict_data.get("verdict"))
        confidence = self._clamp(verdict_data.get("confidence", 0.5))

        # Reorder sources so the ones cited in `used_sources` come first.
        used = set(verdict_data.get("used_sources") or [])
        if used:
            sources.sort(key=lambda s: (0 if s.url in used else 1, -s.credibility))

        result = CheckResult(
            id=claim_id,
            claim=claim_text[:500],
            claim_type=claim_type,
            language=language,
            verdict=verdict_value,
            confidence=confidence,
            explanation_ar=str(verdict_data.get("explanation_ar", ""))[:1500],
            explanation_en=str(verdict_data.get("explanation_en", ""))[:1000],
            key_points=[str(p)[:200] for p in (verdict_data.get("key_points") or [])][:6],
            sources=sources,
            agents=traces,
            processing_time_ms=int((time.time() - started) * 1000),
            demo_mode=False,
        )
        cache.set(cache_key, result)
        return result

    # ----- helpers --------------------------------------------------------

    async def _safe_json(
        self, prompt: str, fallback: Dict[str, Any], temperature: float = 0.2
    ) -> Dict[str, Any]:
        try:
            return await self.gemini.generate_json(
                prompt, system=SYSTEM_BASE, temperature=temperature
            )
        except Exception as exc:
            logger.warning("Agent fallback: %s", exc)
            return fallback

    @staticmethod
    def _format_evidence(sources: List[Source]) -> str:
        if not sources:
            return "(لا توجد أدلة مسترجعة من البحث)"
        lines = []
        for idx, s in enumerate(sources, 1):
            lines.append(
                f"[{idx}] {s.title}\n    الرابط: {s.url}\n"
                f"    الموثوقية: {s.credibility:.2f}\n"
                f"    المقتطف: {s.snippet[:300]}"
            )
        return "\n".join(lines)

    @staticmethod
    def _avg_credibility(sources: List[Source]) -> float:
        if not sources:
            return 0.0
        return sum(s.credibility for s in sources) / len(sources)

    @staticmethod
    def _normalise_verdict(v: Any) -> Verdict:
        if not isinstance(v, str):
            return Verdict.UNVERIFIED
        key = v.strip().upper().replace(" ", "_")
        try:
            return Verdict(key)
        except ValueError:
            mapping = {
                "TRUE": Verdict.VERIFIED,
                "CORRECT": Verdict.VERIFIED,
                "FAKE": Verdict.FALSE,
                "INCORRECT": Verdict.FALSE,
                "PARTIALLY_TRUE": Verdict.MISLEADING,
                "MIXED": Verdict.MISLEADING,
                "UNKNOWN": Verdict.UNVERIFIED,
            }
            return mapping.get(key, Verdict.UNVERIFIED)

    @staticmethod
    def _clamp(value: Any) -> float:
        try:
            return max(0.0, min(1.0, float(value)))
        except (TypeError, ValueError):
            return 0.5
