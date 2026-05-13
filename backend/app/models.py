"""Pydantic models shared across the API."""

from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, Field, HttpUrl


class Verdict(str, Enum):
    VERIFIED = "VERIFIED"
    FALSE = "FALSE"
    MISLEADING = "MISLEADING"
    UNVERIFIED = "UNVERIFIED"
    AI_GENERATED = "AI_GENERATED"
    SATIRE = "SATIRE"


class ClaimType(str, Enum):
    TEXT = "text"
    URL = "url"
    IMAGE = "image"


class CheckRequest(BaseModel):
    text: Optional[str] = Field(default=None, max_length=4000)
    url: Optional[HttpUrl] = None
    language: str = Field(default="ar", pattern="^(ar|en)$")


class Source(BaseModel):
    title: str
    url: str
    snippet: str = ""
    domain: str = ""
    credibility: float = Field(default=0.5, ge=0.0, le=1.0)


class AgentTrace(BaseModel):
    agent: str
    role: str
    summary: str
    duration_ms: int = 0


class CheckResult(BaseModel):
    id: str
    claim: str
    claim_type: ClaimType
    language: str
    verdict: Verdict
    confidence: float = Field(ge=0.0, le=1.0)
    explanation_ar: str
    explanation_en: str = ""
    key_points: List[str] = Field(default_factory=list)
    sources: List[Source] = Field(default_factory=list)
    agents: List[AgentTrace] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    processing_time_ms: int = 0
    demo_mode: bool = False


class ImageCheckResult(BaseModel):
    id: str
    verdict: Verdict
    confidence: float
    explanation_ar: str
    indicators: List[str] = Field(default_factory=list)
    metadata: dict = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    demo_mode: bool = False


class TrendingClaim(BaseModel):
    title: str
    summary: str
    verdict: Verdict
    confidence: float
    source: str
    url: str
    detected_at: datetime
