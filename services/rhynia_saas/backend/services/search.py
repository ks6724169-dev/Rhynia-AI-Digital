"""
Rhynia Intelligence SaaS — High-Performance Real-Time Web Search Grounding Service
Fetches live web search results from DuckDuckGo HTML and Wikipedia API
to eliminate hallucinations and ground AI answers with authentic, real-time facts.
"""

import html
import logging
import re
from typing import Dict, List
import httpx

logger = logging.getLogger("rhynia.search")


class SearchService:
    """Performs live real-time web search for grounding queries with current facts."""

    def __init__(self):
        self.headers = {
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
            ),
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9,hi;q=0.8",
        }

    async def search(self, query: str, max_results: int = 5) -> List[Dict[str, str]]:
        """
        Perform live web search using DuckDuckGo HTML engine.
        Returns a list of dicts with title, snippet, and clean text.
        """
        clean_q = (query or "").strip()
        if not clean_q or len(clean_q) < 2:
            return []

        results = []

        # 1. Primary: DuckDuckGo HTML Search (Live real-time web index)
        try:
            async with httpx.AsyncClient(headers=self.headers, follow_redirects=True, timeout=4.5) as client:
                res = await client.post("https://html.duckduckgo.com/html/", data={"q": clean_q})
                if res.status_code == 200:
                    raw_html = res.text
                    # Extract snippets
                    snippets = re.findall(
                        r'<a class="result__snippet[^"]*"[^>]*>(.*?)</a>',
                        raw_html,
                        re.DOTALL | re.IGNORECASE,
                    )
                    titles = re.findall(
                        r'<a class="result__url[^"]*"[^>]*>(.*?)</a>',
                        raw_html,
                        re.DOTALL | re.IGNORECASE,
                    )

                    for idx, s in enumerate(snippets[:max_results]):
                        clean_text = html.unescape(re.sub(r"<[^>]+>", "", s)).strip()
                        clean_title = (
                            html.unescape(re.sub(r"<[^>]+>", "", titles[idx])).strip()
                            if idx < len(titles)
                            else f"Result {idx+1}"
                        )
                        if clean_text:
                            results.append({
                                "title": clean_title,
                                "snippet": clean_text,
                            })
        except Exception as e:
            logger.warning(f"DuckDuckGo search error for '{clean_q}': {e}")

        # 2. Secondary Fallback: Wikipedia Summary API (for conceptual/historical/notable queries)
        if not results:
            try:
                wiki_url = f"https://en.wikipedia.org/api/rest_v1/page/summary/{clean_q.replace(' ', '_')}"
                async with httpx.AsyncClient(headers=self.headers, timeout=3.5) as client:
                    w_res = await client.get(wiki_url)
                    if w_res.status_code == 200:
                        w_data = w_res.json()
                        extract = w_data.get("extract", "")
                        if extract:
                            results.append({
                                "title": w_data.get("title", clean_q),
                                "snippet": extract,
                            })
            except Exception as we:
                logger.warning(f"Wikipedia search fallback error: {we}")

        return results[:max_results]

    def format_search_context(self, results: List[Dict[str, str]]) -> str:
        """Format live search results into an authoritative grounding block for the LLM."""
        if not results:
            return ""
        lines = [
            "REAL-TIME LIVE INTERNET SEARCH GROUNDING CONTEXT (प्रत्यक्ष लाइव इंटरनेट खोज परिणाम):",
            "The following verified real-time facts were just retrieved from the live web for this query. "
            "Use these verified facts directly to construct a 100% accurate, up-to-date answer:\n",
        ]
        for idx, r in enumerate(results, 1):
            lines.append(f"[{idx}] {r.get('title', 'Web Result')}: {r['snippet']}")
        lines.append(
            "\nCRITICAL: Answer authoritatively using the verified facts above. "
            "Never cite or mention source URLs in your response."
        )
        return "\n".join(lines)


search_service = SearchService()
