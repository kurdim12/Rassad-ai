"""RASAD AI — FastAPI entry point.

Endpoints
---------
GET  /                       → service banner
GET  /api/health             → liveness probe
POST /api/check              → fact-check text or URL
POST /api/check/image        → AI-generated image detection
GET  /api/trending           → curated trending fact-checks (demo)
GET  /api/agents             → list of agents in the pipeline
"""

from __future__ import annotations

import logging
from datetime import datetime, timedelta
from typing import List

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import ORJSONResponse

from .agents import FactCheckPipeline
from .config import get_settings
from .image_check import analyse_image
from .models import (
    CheckRequest,
    CheckResult,
    ImageCheckResult,
    TrendingClaim,
    Verdict,
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s :: %(message)s",
)
logger = logging.getLogger("rasad")

settings = get_settings()
pipeline = FactCheckPipeline()

app = FastAPI(
    title="RASAD AI",
    description=(
        "🇯🇴 منصة عربية مفتوحة للتحقق الفوري من الأخبار والصور باستخدام الذكاء الاصطناعي. "
        "Real-time Arabic AI fact-checking platform."
    ),
    version="1.0.0",
    default_response_class=ORJSONResponse,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {
        "service": "RASAD AI",
        "version": "1.0.0",
        "demo_mode": settings.demo_mode,
        "docs": "/docs",
        "tagline": "رصد الحقيقة بالذكاء الاصطناعي",
    }


@app.get("/api/health")
async def health():
    return {
        "status": "ok",
        "demo_mode": settings.demo_mode,
        "timestamp": datetime.utcnow().isoformat() + "Z",
    }


@app.get("/api/agents")
async def list_agents():
    return {
        "agents": [
            {
                "name": "ArabicNLPAgent",
                "role_ar": "تحليل لغوي عربي للادعاء",
                "role_en": "Arabic linguistic analysis",
                "icon": "language",
            },
            {
                "name": "EvidenceAgent",
                "role_ar": "استرجاع أدلة من محركات البحث",
                "role_en": "Live web evidence retrieval",
                "icon": "search",
            },
            {
                "name": "CredibilityAgent",
                "role_ar": "تقييم موثوقية المصادر",
                "role_en": "Source credibility scoring",
                "icon": "shield",
            },
            {
                "name": "FakeNewsAgent",
                "role_ar": "رصد مؤشرات الأخبار الكاذبة",
                "role_en": "Manipulation signal detection",
                "icon": "alert",
            },
            {
                "name": "ClaimTracerAgent",
                "role_ar": "تتبع أصل الادعاء وانتشاره",
                "role_en": "Claim origin tracing",
                "icon": "history",
            },
            {
                "name": "VerdictAgent",
                "role_ar": "تركيب الحكم النهائي",
                "role_en": "Final verdict synthesis",
                "icon": "gavel",
            },
        ]
    }


@app.post("/api/check", response_model=CheckResult)
async def check_claim(req: CheckRequest):
    if not req.text and not req.url:
        raise HTTPException(
            status_code=400, detail="Provide either `text` or `url`."
        )
    try:
        return await pipeline.run(
            text=req.text,
            url=str(req.url) if req.url else None,
            language=req.language,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception as exc:
        logger.exception("check failed")
        raise HTTPException(status_code=500, detail=str(exc))


@app.post("/api/check/image", response_model=ImageCheckResult)
async def check_image(file: UploadFile = File(...)):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image.")
    data = await file.read()
    if len(data) > 10 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Image must be < 10 MB.")
    try:
        return await analyse_image(data)
    except Exception as exc:
        logger.exception("image check failed")
        raise HTTPException(status_code=500, detail=str(exc))


@app.get("/api/trending", response_model=List[TrendingClaim])
async def trending():
    now = datetime.utcnow()
    return [
        TrendingClaim(
            title="ادعاء: شرب الماء الساخن مع الليمون يقي من كورونا",
            summary="ادعاء متكرر منذ 2020 لا يستند إلى أي دليل علمي.",
            verdict=Verdict.FALSE,
            confidence=0.93,
            source="مسبار",
            url="https://misbar.com",
            detected_at=now - timedelta(hours=2),
        ),
        TrendingClaim(
            title="ادعاء: زلزال متوقع في الأردن خلال أيام",
            summary="لا يمكن التنبؤ بالزلازل بدقة، والادعاء يستند لمصادر مجهولة.",
            verdict=Verdict.MISLEADING,
            confidence=0.82,
            source="مرصد رصد",
            url="https://example.org",
            detected_at=now - timedelta(hours=5),
        ),
        TrendingClaim(
            title="ادعاء: صورة لقاء رؤساء تم تركيبها بالذكاء الاصطناعي",
            summary="تحليل البكسلات يكشف أنماط مولّدات الصور.",
            verdict=Verdict.AI_GENERATED,
            confidence=0.88,
            source="RASAD ImageAgent",
            url="https://example.org",
            detected_at=now - timedelta(hours=8),
        ),
        TrendingClaim(
            title="بيان: وزارة الصحة تطلق حملة تطعيم جديدة",
            summary="مؤكد عبر الموقع الرسمي للوزارة ووكالة الأنباء.",
            verdict=Verdict.VERIFIED,
            confidence=0.96,
            source="بترا",
            url="https://petra.gov.jo",
            detected_at=now - timedelta(hours=12),
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
