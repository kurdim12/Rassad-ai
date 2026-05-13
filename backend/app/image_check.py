"""AI-image detection: heuristic + optional Gemini vision verdict.

For a hackathon prototype this is intentionally lightweight: we extract
EXIF data and compute a few simple image statistics, then optionally ask
Gemini to look at the picture and flag obvious AI markers. The result is
*indicative* and labelled as such.
"""

from __future__ import annotations

import asyncio
import base64
import hashlib
import io
import logging
from typing import Tuple

from PIL import ExifTags, Image

from .models import ImageCheckResult, Verdict
from .services.gemini import GeminiClient, get_gemini

logger = logging.getLogger(__name__)

GEMINI_VISION_PROMPT = (
    "أنت خبير في كشف الصور المولّدة بالذكاء الاصطناعي. افحص الصورة المرفقة "
    "وأجب بصيغة JSON فقط:\n"
    "{\n"
    '  "ai_probability": 0.0,\n'
    '  "verdict": "AI_GENERATED" | "LIKELY_REAL" | "UNCERTAIN",\n'
    '  "indicators": ["مؤشرات بصرية ملموسة"],\n'
    '  "summary_ar": "ملخص قصير بالعربية"\n'
    "}"
)


def _extract_exif(image: Image.Image) -> dict:
    exif: dict = {}
    raw = getattr(image, "_getexif", lambda: None)()
    if not raw:
        return exif
    for tag, value in raw.items():
        name = ExifTags.TAGS.get(tag, str(tag))
        try:
            exif[name] = str(value)[:200]
        except Exception:
            continue
    return exif


def _heuristic_score(image: Image.Image, exif: dict) -> Tuple[float, list[str]]:
    indicators: list[str] = []
    score = 0.3  # baseline suspicion

    if not exif:
        indicators.append("لا توجد بيانات EXIF (شائع في الصور المولّدة)")
        score += 0.2
    else:
        software = (exif.get("Software") or "").lower()
        for marker in ["midjourney", "stable diffusion", "dall", "firefly", "leonardo"]:
            if marker in software:
                indicators.append(f"حقل Software يحتوي على: {software}")
                score += 0.55
                break
        if "Make" not in exif and "Model" not in exif:
            indicators.append("لا يوجد طراز/صانع للكاميرا في البيانات الوصفية")
            score += 0.1

    width, height = image.size
    if width % 64 == 0 and height % 64 == 0 and width >= 512:
        indicators.append(
            f"الأبعاد ({width}x{height}) من مضاعفات 64 — أنماط شائعة لمولّدات الصور"
        )
        score += 0.1

    return min(score, 0.99), indicators


async def analyse_image(
    image_bytes: bytes,
    use_gemini: bool = True,
    api_key: str | None = None,
) -> ImageCheckResult:
    image_id = hashlib.sha256(image_bytes).hexdigest()[:12]
    image = Image.open(io.BytesIO(image_bytes))
    image.load()

    exif = _extract_exif(image)
    heuristic, indicators = _heuristic_score(image, exif)

    verdict = Verdict.AI_GENERATED if heuristic > 0.65 else Verdict.UNVERIFIED
    summary = (
        "بناءً على التحليل الأولي، الصورة قد تكون مولّدة بالذكاء الاصطناعي."
        if heuristic > 0.65
        else "التحليل الأولي غير حاسم. مطلوب فحص بصري إضافي."
    )

    gemini = GeminiClient.for_request(api_key)
    if use_gemini and gemini.available:
        try:
            verdict_data = await asyncio.to_thread(_gemini_vision, gemini, image_bytes)
            ai_prob = float(verdict_data.get("ai_probability", heuristic))
            heuristic = max(heuristic, ai_prob)
            for ind in verdict_data.get("indicators", [])[:5]:
                if isinstance(ind, str) and ind not in indicators:
                    indicators.append(ind)
            if verdict_data.get("verdict") == "AI_GENERATED":
                verdict = Verdict.AI_GENERATED
            elif verdict_data.get("verdict") == "LIKELY_REAL":
                verdict = Verdict.VERIFIED
            summary = verdict_data.get("summary_ar") or summary
        except Exception as exc:
            logger.warning("Gemini vision failed: %s", exc)

    return ImageCheckResult(
        id=image_id,
        verdict=verdict,
        confidence=heuristic,
        explanation_ar=summary,
        indicators=indicators,
        metadata={
            "size": list(image.size),
            "format": image.format,
            "exif": exif,
        },
        demo_mode=not gemini.available,
    )


async def extract_text_from_image(
    image_bytes: bytes,
    api_key: str | None = None,
) -> str:
    """Use Gemini Vision to pull out any Arabic / English text from an image.

    In demo mode (no key) returns empty string and the caller can use the
    image bytes elsewhere.
    """
    gemini = GeminiClient.for_request(api_key)
    if not gemini.available:
        return ""

    def _call() -> str:
        image_part = {
            "mime_type": "image/jpeg",
            "data": base64.b64encode(image_bytes).decode("utf-8"),
        }
        response = gemini._model.generate_content(
            [
                "استخرج النص الرئيسي من الصورة كما هو (عربي أو إنجليزي). "
                "أعد النص فقط، دون أي تعليق أو شرح.",
                image_part,
            ],
            generation_config={"temperature": 0.0, "max_output_tokens": 1024},
        )
        return (response.text or "").strip()

    return await asyncio.to_thread(_call)


def _gemini_vision(client, image_bytes: bytes) -> dict:
    import google.generativeai as genai

    image_part = {
        "mime_type": "image/jpeg",
        "data": base64.b64encode(image_bytes).decode("utf-8"),
    }
    response = client._model.generate_content(
        [GEMINI_VISION_PROMPT, image_part],
        generation_config={
            "temperature": 0.1,
            "response_mime_type": "application/json",
        },
    )
    import json
    import re

    text = response.text.strip()
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*", "", text)
        text = re.sub(r"\s*```$", "", text)
    return json.loads(text)
