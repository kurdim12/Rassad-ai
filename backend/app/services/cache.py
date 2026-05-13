"""In-memory TTL cache (no Redis dependency for hackathon simplicity)."""

from __future__ import annotations

import time
from typing import Any, Optional


class TTLCache:
    def __init__(self, default_ttl: int = 3600) -> None:
        self._store: dict[str, tuple[float, Any]] = {}
        self._default_ttl = default_ttl

    def get(self, key: str) -> Optional[Any]:
        item = self._store.get(key)
        if not item:
            return None
        expires_at, value = item
        if time.time() > expires_at:
            self._store.pop(key, None)
            return None
        return value

    def set(self, key: str, value: Any, ttl: Optional[int] = None) -> None:
        ttl = ttl or self._default_ttl
        self._store[key] = (time.time() + ttl, value)

    def clear(self) -> None:
        self._store.clear()


cache = TTLCache()
