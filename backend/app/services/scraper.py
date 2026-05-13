"""Tiny URL extractor: pulls main article text from arbitrary pages."""

from __future__ import annotations

import httpx
from bs4 import BeautifulSoup


async def fetch_article(url: str, max_chars: int = 4000) -> tuple[str, str]:
    """Return (title, text) for the supplied URL.

    Falls back to empty strings on failure so the caller can still proceed
    using just the URL.
    """
    headers = {
        "User-Agent": (
            "Mozilla/5.0 (compatible; RASAD-AI/1.0; +https://github.com/kurdim12/rassad-ai)"
        )
    }
    try:
        async with httpx.AsyncClient(
            timeout=15, follow_redirects=True, headers=headers
        ) as client:
            r = await client.get(url)
            r.raise_for_status()
            html = r.text
    except Exception:
        return "", ""

    soup = BeautifulSoup(html, "html.parser")

    for tag in soup(["script", "style", "nav", "header", "footer", "aside", "form"]):
        tag.decompose()

    title = ""
    if soup.title and soup.title.string:
        title = soup.title.string.strip()

    article = soup.find("article")
    if article:
        text = article.get_text(separator=" ", strip=True)
    else:
        paragraphs = [p.get_text(strip=True) for p in soup.find_all("p")]
        text = " ".join(p for p in paragraphs if len(p) > 40)

    if not text:
        text = soup.get_text(separator=" ", strip=True)

    return title[:200], text[:max_chars]
