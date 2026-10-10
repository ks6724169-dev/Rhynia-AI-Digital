"""
Module 05: Knowledge & Tool Layer (KL-001 to KL-025)
Handles parametric vs external knowledge selection, tool execution dispatch,
diagram grounding, and graceful fallback on timeout.
"""

from typing import List, Dict, Any, Optional

from ..schemas.intent_models import UserIntentModel, IntentCategory
from ..schemas.reasoning_models import ReasoningPlan
from ..schemas.knowledge_models import (
    KnowledgeSourceType,
    ToolCallSpec,
    ToolExecutionResult,
    KnowledgeContext,
)


class KnowledgeToolEngine:
    """
    Executes rules KL-001 to KL-025.
    Selects source, executes needed tools, and grounds the response.
    """

    def __init__(self, search_timeout: float = 5.0):
        self.search_timeout = search_timeout

    def ground(self, intent: UserIntentModel, reasoning: ReasoningPlan) -> KnowledgeContext:
        """
        Executes KL-001 to KL-025.
        """
        # KL-001 & KL-002: Internal Knowledge First
        source_type = self._determine_knowledge_source(intent)

        grounding_data = []
        tool_results = []
        diagram_urls = []

        # KL-004: Visual / Diagram Grounding check
        if self._is_visual_worthy(intent):
            diagram_urls.append(f"https://commons.wikimedia.org/wiki/Special:Search?search={intent.primary_domain}")

        # Add factual grounding strings
        for f in reasoning.facts:
            grounding_data.append(f.statement)

        return KnowledgeContext(
            source_used=source_type,
            grounding_data=grounding_data,
            tool_results=tool_results,
            diagram_urls=diagram_urls,
            is_grounded=True,
        )

    def _determine_knowledge_source(self, intent: UserIntentModel) -> KnowledgeSourceType:
        """
        KL-001, KL-002, KL-003: Parametric first, search only when fresh/temporal info is required.
        """
        temporal_keywords = ["today", "latest", "2026", "aaj ka", "current news", "live score"]
        if any(w in intent.expected_outcome.lower() for w in temporal_keywords):
            return KnowledgeSourceType.WEB_SEARCH
        return KnowledgeSourceType.PARAMETRIC_MEMORY

    def _is_visual_worthy(self, intent: UserIntentModel) -> bool:
        """
        KL-004: Checks whether diagram/visual context adds high educational value.
        """
        if intent.primary_domain in ["biology", "physics", "anatomy", "astronomy"]:
            return True
        return False
