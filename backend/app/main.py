"""RASAD AI — FastAPI entry point."""

from __future__ import annotations

import asyncio
import json
import logging
from datetime import datetime, timedelta
from typing import List, Optional

from fastapi import FastAPI, File, Header, HTTPException, Query, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import ORJSONResponse, StreamingResponse

from .agents import FactCheckPipeline
from .config import get_settings
from .image_check import analyse_image, extract_text_from_image
from .models import (
    CheckRequest,
    CheckResult,
    ImageCheckResult,
    TrendingClaim,
    Verdict,
)
from .services.gemini import GeminiClient
from .stats import stats

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s :: %(message)s",
)
logger = logging.getLogger("rasad")

settings = get_settings()

app = FastAPI(
    title="RASAD AI",
    description=(
        "🇯🇴 منصة عربية مفتوحة للتحقق الفوري من الأخبار والصور باستخدام الذكاء الاصطناعي. "
        "Real-time Arabic AI fact-checking platform."
    ),
    version="1.1.0",
    default_response_class=ORJSONResponse,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*", "x-gemini-key"],
)


def _pipeline_for(api_key: Optional[str]) -> FactCheckPipeline:
    return FactCheckPipeline(api_key=api_key)


# ----- meta -----------------------------------------------------------------


@app.get("/")
async def root():
    return {
        "service": "RASAD AI",
        "version": "1.1.0",
        "demo_mode": settings.demo_mode,
        "docs": "/docs",
        "tagline": "رصد الحقيقة بالذكاء الاصطناعي",
    }


@app.get("/api/health")
async def health(x_gemini_key: Optional[str] = Header(default=None)):
    # If a request-scoped key is supplied, validate it lazily.
    has_user_key = bool(x_gemini_key and x_gemini_key.strip())
    return {
        "status": "ok",
        "demo_mode": settings.demo_mode and not has_user_key,
        "user_key_present": has_user_key,
        "timestamp": datetime.utcnow().isoformat() + "Z",
    }


@app.post("/api/validate-key")
async def validate_key(payload: dict):
    """Quick check that a Gemini API key actually works."""
    key = (payload or {}).get("api_key", "").strip()
    if not key:
        raise HTTPException(status_code=400, detail="Missing api_key")
    client = GeminiClient(api_key=key)
    if not client.available:
        raise HTTPException(status_code=400, detail="Invalid or unsupported key")
    try:
        await client.generate_text("اكتب OK", temperature=0.0)
        return {"valid": True}
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Key rejected: {exc}")


@app.get("/api/agents")
async def list_agents():
    return {
        "agents": [
            {"name": "ArabicNLPAgent", "role_ar": "تحليل لغوي عربي للادعاء", "role_en": "Arabic linguistic analysis", "icon": "language"},
            {"name": "EvidenceAgent", "role_ar": "استرجاع أدلة من محركات البحث", "role_en": "Live web evidence retrieval", "icon": "search"},
            {"name": "CredibilityAgent", "role_ar": "تقييم موثوقية المصادر", "role_en": "Source credibility scoring", "icon": "shield"},
            {"name": "FakeNewsAgent", "role_ar": "رصد مؤشرات الأخبار الكاذبة", "role_en": "Manipulation signal detection", "icon": "alert"},
            {"name": "ClaimTracerAgent", "role_ar": "تتبع أصل الادعاء وانتشاره", "role_en": "Claim origin tracing", "icon": "history"},
            {"name": "VerdictAgent", "role_ar": "تركيب الحكم النهائي", "role_en": "Final verdict synthesis", "icon": "gavel"},
        ]
    }


@app.get("/api/stats")
async def get_stats():
    return await stats.snapshot()


# ----- core fact-checking ---------------------------------------------------


@app.post("/api/check", response_model=CheckResult)
async def check_claim(
    req: CheckRequest,
    x_gemini_key: Optional[str] = Header(default=None),
):
    if not req.text and not req.url:
        raise HTTPException(status_code=400, detail="Provide either `text` or `url`.")
    try:
        result = await _pipeline_for(x_gemini_key).run(
            text=req.text,
            url=str(req.url) if req.url else None,
            language=req.language,
        )
        await stats.record(result.verdict, result.claim, result.confidence)
        return result
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception as exc:
        logger.exception("check failed")
        raise HTTPException(status_code=500, detail=str(exc))


@app.post("/api/check/stream")
async def check_claim_stream(
    req: CheckRequest,
    x_gemini_key: Optional[str] = Header(default=None),
):
    """Stream the agent pipeline as SSE so the client sees live progress."""
    if not req.text and not req.url:
        raise HTTPException(status_code=400, detail="Provide either `text` or `url`.")

    queue: asyncio.Queue = asyncio.Queue()
    pipeline = _pipeline_for(x_gemini_key)

    async def on_event(event: str, payload: dict) -> None:
        await queue.put((event, payload))

    async def runner() -> None:
        try:
            result = await pipeline.run(
                text=req.text,
                url=str(req.url) if req.url else None,
                language=req.language,
                on_event=on_event,
            )
            await stats.record(result.verdict, result.claim, result.confidence)
        except Exception as exc:
            logger.exception("stream check failed")
            await queue.put(("error", {"message": str(exc)}))
        finally:
            await queue.put(("__end__", {}))

    async def event_stream():
        task = asyncio.create_task(runner())
        try:
            while True:
                event, payload = await queue.get()
                if event == "__end__":
                    break
                data = json.dumps({"event": event, "payload": payload}, ensure_ascii=False)
                yield f"data: {data}\n\n"
        finally:
            await task

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )


@app.post("/api/check/image", response_model=ImageCheckResult)
async def check_image(
    file: UploadFile = File(...),
    x_gemini_key: Optional[str] = Header(default=None),
):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image.")
    data = await file.read()
    if len(data) > 10 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Image must be < 10 MB.")
    try:
        return await analyse_image(data, api_key=x_gemini_key)
    except Exception as exc:
        logger.exception("image check failed")
        raise HTTPException(status_code=500, detail=str(exc))


@app.post("/api/ocr")
async def ocr_image(
    file: UploadFile = File(...),
    x_gemini_key: Optional[str] = Header(default=None),
):
    """Extract Arabic text from a screenshot using Gemini Vision."""
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image.")
    data = await file.read()
    if len(data) > 10 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Image must be < 10 MB.")
    try:
        text = await extract_text_from_image(data, api_key=x_gemini_key)
        return {"text": text}
    except Exception as exc:
        logger.exception("OCR failed")
        raise HTTPException(status_code=500, detail=str(exc))


@app.get("/api/trending", response_model=List[TrendingClaim])
async def trending():
    now = datetime.utcnow()
    return [
        TrendingClaim(
            title="ادعاء: شرب الماء الساخن مع الليمون يقي من كورونا",
            summary="ادعاء متكرر منذ 2020 لا يستند إلى أي دليل علمي.",
            verdict=Verdict.FALSE, confidence=0.93, source="مسبار",
            url="https://misbar.com", detected_at=now - timedelta(hours=2),
        ),
        TrendingClaim(
            title="ادعاء: زلزال متوقع في الأردن خلال أيام",
            summary="لا يمكن التنبؤ بالزلازل بدقة، والادعاء يستند لمصادر مجهولة.",
            verdict=Verdict.MISLEADING, confidence=0.82, source="مرصد رصد",
            url="https://example.org", detected_at=now - timedelta(hours=5),
        ),
        TrendingClaim(
            title="ادعاء: صورة لقاء رؤساء تم تركيبها بالذكاء الاصطناعي",
            summary="تحليل البكسلات يكشف أنماط مولّدات الصور.",
            verdict=Verdict.AI_GENERATED, confidence=0.88, source="RASAD ImageAgent",
            url="https://example.org", detected_at=now - timedelta(hours=8),
        ),
        TrendingClaim(
            title="بيان: وزارة الصحة تطلق حملة تطعيم جديدة",
            summary="مؤكد عبر الموقع الرسمي للوزارة ووكالة الأنباء.",
            verdict=Verdict.VERIFIED, confidence=0.96, source="بترا",
            url="https://petra.gov.jo", detected_at=now - timedelta(hours=12),
        ),
    ]


if __name__ == "__main__":  # pragma: no cover
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.environment == "development",
    )
