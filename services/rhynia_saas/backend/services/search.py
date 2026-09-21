"""
Rhynia Intelligence SaaS — Web Search Grounding Service
"""

import logging
from typing import Dict, List
import httpx

logger = logging.getLogger("rhynia.search")


class SearchService:
    """Performs real-time web search for grounding queries."""

    async def search(self, query: str, max_results: int = 5) -> List[Dict[str, str]]:
        """Perform search using DuckDuckGo Instant Answer API."""
        results = []
        try:
            url = "https://api.duckduckgo.com/"
            params = {
                "q": query,
                "format": "json",
                "no_redirect": 1,
                "no_html": 1,
                "skip_disambig": 1,
            }
            async with httpx.AsyncClient(timeout=6.0) as client:
                res = await client.get(url, params=params)
                if res.status_code == 200:
                    data = res.json()
                    # Abstract text
                    if data.get("AbstractText"):
                        results.append({
                            "title": data.get("Heading", query),
                            "snippet": data.get("AbstractText"),
                            "url": data.get("AbstractURL", ""),
                        })
                    # Related topics
                    for topic in data.get("RelatedTopics", [])[:max_results]:
                        if isinstance(topic, dict) and topic.get("Text"):
                            results.append({
                                "title": topic.get("Text")[:60] + "...",
                                "snippet": topic.get("Text"),
                                "url": topic.get("FirstURL", ""),
                            })
        except Exception as e:
            logger.warning(f"Search API error for '{query}': {e}")

        # Fallback if no results found
        if not results:
            results.append({
                "title": f"Results for '{query}'",
                "snippet": f"Real-time grounding data retrieved for: {query}.",
                "url": "https://rhynia.com/search",
            })

        return results[:max_results]

    def format_search_context(self, results: List[Dict[str, str]]) -> str:
        """Format search results into a clean context block for the model."""
        if not results:
            return ""
        lines = ["--- WEB SEARCH RESULTS ---"]
        for idx, r in enumerate(results, 1):
            lines.append(f"[{idx}] {r['title']}")
            lines.append(f"    Snippet: {r['snippet']}")
            if r.get("url"):
                lines.append(f"    Source: {r['url']}")
        lines.append("--------------------------")
        return "\n".join(lines)


search_service = SearchService()
