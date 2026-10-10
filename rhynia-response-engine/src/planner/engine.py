"""
Module 03: Response Planner Engine (RP-001 to RP-020)
Designs the structural blueprint, length budget, formatting elements, and layout strategy.
"""

import uuid
from typing import List, Dict, Any, Optional

from ..schemas.intent_models import (
    UserIntentModel,
    IntentCategory,
    UserProficiencyLevel,
)
from ..schemas.plan_models import (
    ResponseLengthType,
    StructuralStyle,
    SectionPlan,
    ResponseBlueprint,
)


class ResponsePlannerEngine:
    """
    Executes rules RP-001 to RP-020.
    Transforms UserIntentModel into ResponseBlueprint.
    """

    def plan(self, intent: UserIntentModel) -> ResponseBlueprint:
        """
        Executes RP-001 to RP-020 to generate blueprint for response generation.
        """
        plan_id = f"plan_{uuid.uuid4().hex[:10]}"

        # RP-002: Length Budgeting
        length_type = self._determine_length(intent)

        # RP-001: Structural Style Selection
        structure_style = self._select_structural_style(intent)

        # RP-005 & RP-006 & RP-007: Element flags
        include_table = (
            intent.primary_intent == IntentCategory.COMPARATIVE_ANALYSIS
            or "compare" in intent.key_constraints
        )
        include_code = (
            intent.primary_intent == IntentCategory.CODE_DEVELOPMENT
            or IntentCategory.CODE_DEVELOPMENT in intent.secondary_intents
        ) and ("EXCLUDE:CODE" not in intent.key_constraints)

        include_charts = (
            intent.primary_intent in [IntentCategory.COMPARATIVE_ANALYSIS, IntentCategory.RESEARCH_INVESTIGATION]
            or intent.primary_domain in ["mathematics", "finance", "data_science"]
        )

        # RP-010: Tone Formulation
        tone = self._determine_tone(intent.target_proficiency)

        # RP-003: Planned Sections Allocation
        planned_sections = self._generate_section_plans(
            intent.primary_intent, structure_style, include_table, include_code
        )

        guidelines = [
            "RP-011: BLUF (Bottom Line Up Front) - Start with direct clear core answer",
            "RP-012: Progressive Disclosure - Move from intuitive basics to detailed breakdown",
            "RP-019: Anti-Bloat - Avoid generic filler words and unnecessary meta-introductions",
        ]

        return ResponseBlueprint(
            plan_id=plan_id,
            request_id=intent.request_id,
            length_type=length_type,
            primary_structure=structure_style,
            tone=tone,
            include_tables=include_table,
            include_code=include_code,
            include_visual_charts=include_charts,
            planned_sections=planned_sections,
            guidelines=guidelines,
        )

    def _determine_length(self, intent: UserIntentModel) -> ResponseLengthType:
        """RP-002: Length determination based on intent and constraints"""
        if "LENGTH:SHORT" in intent.key_constraints or intent.primary_intent == IntentCategory.CONVERSATIONAL_CHITCHAT:
            return ResponseLengthType.CONCISE
        if intent.primary_intent in [IntentCategory.RESEARCH_INVESTIGATION, IntentCategory.CODE_DEVELOPMENT]:
            return ResponseLengthType.COMPREHENSIVE
        return ResponseLengthType.MEDIUM

    def _select_structural_style(self, intent: UserIntentModel) -> StructuralStyle:
        """RP-001: Structural style matching"""
        if intent.primary_intent == IntentCategory.COMPARATIVE_ANALYSIS:
            return StructuralStyle.COMPARISON_TABLE
        if intent.primary_intent == IntentCategory.CODE_DEVELOPMENT:
            return StructuralStyle.CODE_FIRST
        if intent.primary_intent == IntentCategory.PROCEDURAL_GUIDE:
            return StructuralStyle.STEP_BY_STEP
        if intent.primary_intent == IntentCategory.CONVERSATIONAL_CHITCHAT:
            return StructuralStyle.DIRECT_ANSWER
        return StructuralStyle.HIERARCHICAL_DEEP_DIVE

    def _determine_tone(self, prof: UserProficiencyLevel) -> str:
        """RP-010: Tone determination"""
        if prof == UserProficiencyLevel.BEGINNER:
            return "lucid, encouraging, intuitive with real-world analogies"
        if prof == UserProficiencyLevel.EXPERT:
            return "technical, rigorous, concise and production-grade"
        return "balanced, authoritative, friendly and structured"

    def _generate_section_plans(
        self, intent_cat: IntentCategory, style: StructuralStyle, inc_table: bool, inc_code: bool
    ) -> List[SectionPlan]:
        """RP-003: Planned sections mapping"""
        sections = [
            SectionPlan(
                title="Direct Overview & Definition",
                target_content_type="text",
                estimated_word_count=50,
                mandatory_points=["Core Concept Definition", "Direct Value Proposition"],
            )
        ]

        if inc_table:
            sections.append(
                SectionPlan(
                    title="Key Differences & Comparison",
                    target_content_type="table",
                    estimated_word_count=100,
                    mandatory_points=["Feature Comparison Matrix", "Use-Case Suitability"],
                )
            )

        if inc_code:
            sections.append(
                SectionPlan(
                    title="Implementation Example",
                    target_content_type="code",
                    estimated_word_count=80,
                    mandatory_points=["Executable Code Snippet", "Key Line Explanations"],
                )
            )

        sections.append(
            SectionPlan(
                title="Core Principles & Mechanism",
                target_content_type="list",
                estimated_word_count=120,
                mandatory_points=["Key Mechanism", "Step-by-step functionality"],
            )
        )

        sections.append(
            SectionPlan(
                title="Key Takeaways & Best Practices",
                target_content_type="callout",
                estimated_word_count=40,
                mandatory_points=["Summary Note", "Pro-tip for mastery"],
            )
        )

        return sections
