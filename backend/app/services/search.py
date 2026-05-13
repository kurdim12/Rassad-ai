"""Multi-provider web search with graceful fallbacks.

Search priority:
    1. Tavily (AI-optimised search, best snippets)
    2. Serper (Google results, fast)
    3. DuckDuckGo Instant Answer (no key required)
    4. Wikipedia REST API (always free)
"""

from __future__ import annotations

import asyncio
import logging
import urllib.parse
from typing import List
from urllib.parse import urlparse

import httpx

from ..config import get_settings
from ..models import Source

logger = logging.getLogger(__name__)

# Curated Arabic / international fact-checking and news domains.
TRUSTED_DOMAINS = {
    "aljazeera.net": 0.85,
    "bbc.com": 0.92,
    "bbc.co.uk": 0.92,
    "reuters.com": 0.95,
    "apnews.com": 0.95,
    "afp.com": 0.94,
    "factcheck.org": 0.95,
    "snopes.com": 0.92,
    "fatabyyano.net": 0.90,
    "verify-sy.com": 0.88,
    "misbar.com": 0.88,
    "wikipedia.org": 0.80,
    "wikidata.org": 0.78,
    "alarabiya.net": 0.78,
    "skynewsarabia.com": 0.78,
    "dw.com": 0.85,
    "france24.com": 0.83,
    "alhurra.com": 0.78,
    "petra.gov.jo": 0.80,
    "wam.ae": 0.80,
    "spa.gov.sa": 0.80,
    "who.int": 0.95,
    "un.org": 0.93,
    "nature.com": 0.95,
    "sciencemag.org": 0.95,
}


def _credibility_for(url: str) -> float:
    try:
        host = urlparse(url).netloc.lower().lstrip("www.")
        for domain, score in TRUSTED_DOMAINS.items():
            if host == domain or host.endswith("." + domain):
                return score
    except Exception:
        pass
    return 0.45


def _domain(url: str) -> str:
    try:
        return urlparse(url).netloc.lower().lstrip("www.")
    except Exception:
        return ""


class SearchService:
    def __init__(self) -> None:
        self.settings = get_settings()

    async def search(self, query: str, limit: int = 6) -> List[Source]:
        if not query.strip():
            return []

        providers = []
        if self.settings.tavily_api_key:
            providers.append(self._tavily)
        if self.settings.serper_api_key:
            providers.append(self._serper)
        providers.append(self._duckduckgo)
        providers.append(self._wikipedia)

        for provider in providers:
            try:
                results = await provider(query, limit)
                if results:
                    return results[:limit]
            except Exception as exc:  # pragma: no cover - network
                logger.warning("Search provider %s failed: %s", provider.__name__, exc)
                continue
        return []

    async def _tavily(self, query: str, limit: int) -> List[Source]:
        async with httpx.AsyncClient(timeout=15) as client:
            r = await client.post(
                "https://api.tavily.com/search",
                json={
                    "api_key": self.settings.tavily_api_key,
                    "query": query,
                    "search_depth": "advanced",
                    "max_results": limit,
                    "include_answer": False,
                },
            )
            r.raise_for_status()
            data = r.json()

        results = []
        for item in data.get("results", []):
            url = item.get("url", "")
            results.append(
                Source(
                    title=item.get("title", "")[:200] or url,
                    url=url,
                    snippet=item.get("content", "")[:400],
                    domain=_domain(url),
                    credibility=_credibility_for(url),
                )
            )
        return results

    async def _serper(self, query: str, limit: int) -> List[Source]:
        async with httpx.AsyncClient(timeout=15) as client:
            r = await client.post(
                "https://google.serper.dev/search",
                headers={"X-API-KEY": self.settings.serper_api_key},
                json={"q": query, "num": limit, "hl": "ar"},
            )
            r.raise_for_status()
            data = r.json()

        results = []
        for item in data.get("organic", [])[:limit]:
            url = item.get("link", "")
            results.append(
                Source(
                    title=item.get("title", "")[:200] or url,
                    url=url,
                    snippet=item.get("snippet", "")[:400],
                    domain=_domain(url),
                    credibility=_credibility_for(url),
                )
            )
        return results

    async def _duckduckgo(self, query: str, limit: int) -> List[Source]:
        async with httpx.AsyncClient(timeout=15, follow_redirects=True) as client:
            r = await client.get(
                "https://api.duckduckgo.com/",
                params={
                    "q": query,
                    "format": "json",
                    "no_html": "1",
                    "skip_disambig": "1",
                },
                headers={"User-Agent": "RASAD-AI/1.0"},
            )
            r.raise_for_status()
            data = r.json()

        results: List[Source] = []
        for item in data.get("RelatedTopics", [])[:limit]:
            if "Text" not in item or "FirstURL" not in item:
                continue
            url = item["FirstURL"]
            results.append(
                Source(
                    title=item["Text"][:200],
                    url=url,
                    snippet=item.get("Text", "")[:400],
                    domain=_domain(url),
                    credibility=_credibility_for(url),
                )
            )

        if data.get("AbstractURL") and data.get("AbstractText"):
            results.insert(
                0,
                Source(
                    title=data.get("Heading", query)[:200],
                    url=data["AbstractURL"],
                    snippet=data["AbstractText"][:400],
                    domain=_domain(data["AbstractURL"]),
                    credibility=_credibility_for(data["AbstractURL"]),
                ),
            )
        return results

    async def _wikipedia(self, query: str, limit: int) -> List[Source]:
        results: List[Source] = []
        for lang in ("ar", "en"):
            try:
                async with httpx.AsyncClient(timeout=10, follow_redirects=True) as client:
                    search = await client.get(
                        f"https://{lang}.wikipedia.org/w/rest.php/v1/search/page",
                        params={"q": query, "limit": limit},
                        headers={"User-Agent": "RASAD-AI/1.0"},
                    )
                    if search.status_code != 200:
                        continue
                    for page in search.json().get("pages", []):
                        title = page.get("title", "")
                        snippet = (page.get("excerpt") or "").replace(
                            "<span class=\"searchmatch\">", ""
                        ).replace("</span>", "")
                        url = (
                            f"https://{lang}.wikipedia.org/wiki/"
                            + urllib.parse.quote(title.replace(" ", "_"))
                        )
                        results.append(
                            Source(
                                title=title,
                                url=url,
                                snippet=snippet[:400],
                                domain=f"{lang}.wikipedia.org",
                                credibility=_credibility_for(url),
                            )
                        )
                if results:
                    break
            except Exception:
                continue
        return results


_service: SearchService | None = None


def get_search() -> SearchService:
    global _service
    if _service is None:
        _service = SearchService()
    return _service
