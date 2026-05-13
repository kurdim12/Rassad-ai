"""Wrapper around Google Gemini for JSON-structured Arabic responses."""

from __future__ import annotations

import asyncio
import json
import logging
import re
from typing import Any, Dict, Optional

import google.generativeai as genai
from tenacity import retry, stop_after_attempt, wait_exponential

from ..config import get_settings

logger = logging.getLogger(__name__)

_MODEL_NAME = "gemini-2.0-flash-exp"
_FALLBACK_MODEL = "gemini-1.5-flash"


class GeminiClient:
    def __init__(self) -> None:
        self.settings = get_settings()
        self._configured = False
        self._model = None
        if self.settings.gemini_api_key:
            try:
                genai.configure(api_key=self.settings.gemini_api_key)
                self._model = genai.GenerativeModel(_MODEL_NAME)
                self._configured = True
            except Exception as exc:  # pragma: no cover - defensive
                logger.warning("Failed to init Gemini, falling back: %s", exc)
                try:
                    self._model = genai.GenerativeModel(_FALLBACK_MODEL)
                    self._configured = True
                except Exception:
                    self._configured = False

    @property
    def available(self) -> bool:
        return self._configured

    @retry(
        stop=stop_after_attempt(2),
        wait=wait_exponential(multiplier=0.5, min=0.5, max=4),
        reraise=True,
    )
    async def generate_json(
        self,
        prompt: str,
        system: Optional[str] = None,
        temperature: float = 0.2,
    ) -> Dict[str, Any]:
        if not self._configured or self._model is None:
            raise RuntimeError("Gemini is not configured")

        full_prompt = f"{system}\n\n{prompt}" if system else prompt

        def _call() -> str:
            response = self._model.generate_content(
                full_prompt,
                generation_config={
                    "temperature": temperature,
                    "top_p": 0.9,
                    "max_output_tokens": 2048,
                    "response_mime_type": "application/json",
                },
            )
            return response.text

        text = await asyncio.to_thread(_call)
        return self._parse_json(text)

    async def generate_text(
        self,
        prompt: str,
        system: Optional[str] = None,
        temperature: float = 0.3,
    ) -> str:
        if not self._configured or self._model is None:
            raise RuntimeError("Gemini is not configured")

        full_prompt = f"{system}\n\n{prompt}" if system else prompt

        def _call() -> str:
            response = self._model.generate_content(
                full_prompt,
                generation_config={
                    "temperature": temperature,
                    "max_output_tokens": 1024,
                },
            )
            return response.text

        return await asyncio.to_thread(_call)

    @staticmethod
    def _parse_json(text: str) -> Dict[str, Any]:
        text = text.strip()
        if text.startswith("```"):
            text = re.sub(r"^```(?:json)?\s*", "", text)
            text = re.sub(r"\s*```$", "", text)
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            match = re.search(r"\{[\s\S]*\}", text)
            if match:
                return json.loads(match.group(0))
            raise


_client: Optional[GeminiClient] = None


def get_gemini() -> GeminiClient:
    global _client
    if _client is None:
        _client = GeminiClient()
    return _client
