"""Realistic, deterministic responses when no AI key is configured.

The demo path lets judges click around and see the full UX even without
provisioning a Gemini API key. Each preset is hand-written; for arbitrary
input the pipeline matches keywords and falls back to a generic UNVERIFIED
result with real web search evidence (DuckDuckGo + Wikipedia work without
keys).
"""

from __future__ import annotations

import re
import time
from typing import List

from ..models import AgentTrace, CheckResult, ClaimType, Source, Verdict

# Keyword-keyed demo cases — each is a fully-formed example so judges can
# experience the UI even with zero API keys.
DEMO_CASES = {
    "vitamin_c_corona": {
        "match": ["فيتامين", "كورونا", "vitamin", "covid", "كوفيد"],
        "verdict": Verdict.FALSE,
        "confidence": 0.92,
        "explanation_ar": (
            "تشير المصادر الطبية الرسمية بما فيها منظمة الصحة العالمية إلى أنه لا يوجد دليل علمي "
            "على أن فيتامين C يعالج أو يمنع الإصابة بفيروس كورونا. الادعاء يعتمد على دراسات قديمة "
            "خارج السياق وتم تفنيده مراراً من قِبل وكالات تدقيق الحقائق."
        ),
        "explanation_en": (
            "Major health authorities, including the WHO, state there is no evidence vitamin C "
            "treats or prevents COVID-19. The claim recycles out-of-context studies."
        ),
        "key_points": [
            "منظمة الصحة العالمية لم تثبت أي علاقة وقائية بين فيتامين C وكوفيد-19",
            "الدراسات المستشهد بها تخص الزكام العادي وليس فيروس كورونا",
            "تم تفنيد الادعاء من قِبل مسبار وفتبيّنوا منذ 2020",
        ],
        "sources": [
            Source(
                title="WHO – Coronavirus disease (COVID-19) advice for the public: Mythbusters",
                url="https://www.who.int/emergencies/diseases/novel-coronavirus-2019/advice-for-public/myth-busters",
                snippet="There is no evidence that vitamin C prevents or treats COVID-19.",
                domain="who.int",
                credibility=0.95,
            ),
            Source(
                title="مسبار: لا دليل علمي على أن فيتامين سي يعالج كورونا",
                url="https://misbar.com/factcheck/2020/04/15/vitamin-c-corona",
                snippet="تحقّق مسبار من الادعاء ووجد أنه لا أساس علمي له.",
                domain="misbar.com",
                credibility=0.88,
            ),
            Source(
                title="Reuters Fact Check: No evidence vitamin C cures coronavirus",
                url="https://www.reuters.com/article/uk-factcheck-vitamin-c-idUSKBN21M2WO",
                snippet="High doses of vitamin C are not a proven cure for COVID-19.",
                domain="reuters.com",
                credibility=0.95,
            ),
        ],
    },
    "5g_corona": {
        "match": ["5g", "الجيل الخامس", "أبراج", "covid", "كورونا"],
        "verdict": Verdict.FALSE,
        "confidence": 0.95,
        "explanation_ar": (
            "لا يوجد أي رابط علمي بين تقنية الجيل الخامس وانتشار فيروس كورونا. الفيروسات "
            "لا تنتقل عبر موجات الراديو، وقد أكدت منظمة الصحة العالمية وهيئات الاتصالات حول "
            "العالم أن الادعاء عار تماماً عن الصحة."
        ),
        "explanation_en": (
            "There is no scientific link between 5G and COVID-19. Viruses cannot travel on "
            "radio waves and global health authorities have repeatedly debunked the claim."
        ),
        "key_points": [
            "الفيروسات تنتقل عبر الرذاذ التنفسي وليس الموجات الكهرومغناطيسية",
            "منظمة الصحة العالمية صنّفت الادعاء كمعلومة مضللة",
            "كوفيد انتشر في دول لا تمتلك شبكات 5G أصلاً",
        ],
        "sources": [
            Source(
                title="WHO: 5G mobile networks DO NOT spread COVID-19",
                url="https://www.who.int/emergencies/diseases/novel-coronavirus-2019/advice-for-public/myth-busters",
                snippet="5G mobile networks do not spread COVID-19. Viruses cannot travel on radio waves.",
                domain="who.int",
                credibility=0.95,
            ),
            Source(
                title="BBC Reality Check: The 5G coronavirus conspiracy theory",
                url="https://www.bbc.com/news/52168096",
                snippet="The theory has been comprehensively debunked by scientists.",
                domain="bbc.com",
                credibility=0.92,
            ),
        ],
    },
    "earth_flat": {
        "match": ["مسطحة", "كروية", "flat earth", "الأرض"],
        "verdict": Verdict.FALSE,
        "confidence": 0.99,
        "explanation_ar": (
            "الأرض كروية الشكل (بيضاوية تقريباً)، وهذه حقيقة علمية مثبتة منذ قرون بالأدلة "
            "الفلكية والقياسات الجيوديسية وصور الأقمار الاصطناعية."
        ),
        "explanation_en": "The Earth is an oblate spheroid, established by centuries of evidence.",
        "key_points": [
            "صور الأقمار الاصطناعية تُظهر شكل الأرض الكروي بوضوح",
            "ظاهرة خسوف القمر تُظهر ظل الأرض الكروي",
            "تجارب القرن الثالث قبل الميلاد لإراتوستينس قاست محيط الأرض",
        ],
        "sources": [
            Source(
                title="NASA: Earth Facts",
                url="https://solarsystem.nasa.gov/planets/earth/in-depth/",
                snippet="Earth is the third planet from the Sun and an oblate spheroid.",
                domain="solarsystem.nasa.gov",
                credibility=0.95,
            ),
        ],
    },
    "default": {
        "verdict": Verdict.UNVERIFIED,
        "confidence": 0.45,
        "explanation_ar": (
            "في الوضع التجريبي الحالي، يعمل النظام دون مفتاح Gemini API. تم تشغيل البحث "
            "المباشر عبر ويكيبيديا و DuckDuckGo لجلب أدلة أولية. لتفعيل التحقق الكامل، يُرجى "
            "إضافة GEMINI_API_KEY في ملف .env."
        ),
        "explanation_en": (
            "Demo mode is active without a Gemini API key. Live web evidence has been "
            "retrieved via DuckDuckGo and Wikipedia. Add GEMINI_API_KEY to enable full verification."
        ),
        "key_points": [
            "تم استرجاع أدلة أولية من مصادر مفتوحة",
            "لإصدار حكم نهائي، فعّل التكامل مع Gemini AI",
            "النظام جاهز للتحقق الكامل بمجرد تكوين المفاتيح",
        ],
        "sources": [],
    },
}


def _match_case(claim: str) -> str:
    lowered = claim.lower()
    for key, case in DEMO_CASES.items():
        if key == "default":
            continue
        if any(token.lower() in lowered for token in case.get("match", [])):
            return key
    return "default"


def demo_result(
    *,
    claim_id: str,
    claim: str,
    claim_type: ClaimType,
    language: str,
    processing_started: float,
    extra_sources: List[Source] | None = None,
) -> CheckResult:
    case_key = _match_case(claim)
    case = DEMO_CASES[case_key]

    sources = list(case.get("sources", []))
    if extra_sources:
        seen = {s.url for s in sources}
        for s in extra_sources:
            if s.url not in seen:
                sources.append(s)
                seen.add(s.url)

    traces = [
        AgentTrace(
            agent="ArabicNLPAgent",
            role="تحليل لغوي للادعاء (وضع تجريبي)",
            summary=re.sub(r"\s+", " ", claim)[:160],
            duration_ms=12,
        ),
        AgentTrace(
            agent="EvidenceAgent",
            role="استرجاع أدلة من مصادر موثوقة",
            summary=f"تم استرجاع {len(sources)} مصدر",
            duration_ms=180,
        ),
        AgentTrace(
            agent="CredibilityAgent",
            role="تقييم موثوقية المصادر",
            summary=(
                f"متوسط {sum(s.credibility for s in sources) / len(sources):.2f}"
                if sources
                else "لا توجد مصادر للتقييم"
            ),
            duration_ms=8,
        ),
        AgentTrace(
            agent="FakeNewsAgent",
            role="رصد مؤشرات التلاعب",
            summary="تم الفحص في الوضع التجريبي",
            duration_ms=10,
        ),
        AgentTrace(
            agent="VerdictAgent",
            role="تركيب الحكم النهائي",
            summary=str(case["verdict"].value),
            duration_ms=22,
        ),
    ]

    return CheckResult(
        id=claim_id,
        claim=claim[:500],
        claim_type=claim_type,
        language=language,
        verdict=case["verdict"],
        confidence=case["confidence"],
        explanation_ar=case["explanation_ar"],
        explanation_en=case.get("explanation_en", ""),
        key_points=case.get("key_points", []),
        sources=sources[:8],
        agents=traces,
        processing_time_ms=int((time.time() - processing_started) * 1000),
        demo_mode=True,
    )
