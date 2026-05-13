"""In-memory usage stats — no DB needed for the prototype."""

from __future__ import annotations

import asyncio
from collections import Counter
from datetime import datetime, timedelta

from .models import Verdict


class StatsStore:
    def __init__(self) -> None:
        self._lock = asyncio.Lock()
        self._total = 0
        self._verdicts: Counter[str] = Counter()
        self._today_count = 0
        self._today_date = datetime.utcnow().date()
        self._started_at = datetime.utcnow()
        self._recent: list[dict] = []

    async def record(self, verdict: Verdict, claim: str, confidence: float) -> None:
        async with self._lock:
            today = datetime.utcnow().date()
            if today != self._today_date:
                self._today_date = today
                self._today_count = 0
            self._total += 1
            self._today_count += 1
            self._verdicts[verdict.value] += 1
            self._recent.insert(
                0,
                {
                    "claim": claim[:140],
                    "verdict": verdict.value,
                    "confidence": confidence,
                    "at": datetime.utcnow().isoformat() + "Z",
                },
            )
            self._recent = self._recent[:20]

    async def snapshot(self) -> dict:
        async with self._lock:
            uptime = (datetime.utcnow() - self._started_at).total_seconds()
            return {
                "total_checks": self._total,
                "today_checks": self._today_count,
                "verdicts": dict(self._verdicts),
                "recent": list(self._recent),
                "uptime_seconds": int(uptime),
            }


stats = StatsStore()
