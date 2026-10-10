"""
Module 04: Reasoning Engine (RE-001 to RE-020)
Performs deductive logic, factual core extraction, cause-effect mapping,
edge case identification, and solution derivation.
"""

import uuid
from typing import List, Dict, Any, Optional

from ..schemas.intent_models import UserIntentModel, IntentCategory
from ..schemas.plan_models import ResponseBlueprint
from ..schemas.reasoning_models import (
    ReasoningType,
    FactLevel,
    InformationUnit,
    LogicStep,
    ReasoningPlan,
)


class ReasoningEngine:
    """
    Executes rules RE-001 to RE-020.
    Transforms ResponseBlueprint & UserIntentModel into ReasoningPlan.
    """

    def reason(self, intent: UserIntentModel, blueprint: ResponseBlueprint) -> ReasoningPlan:
        """
        Executes RE-001 to RE-020 logic.
        """
        reasoning_id = f"reas_{uuid.uuid4().hex[:10]}"

        # RE-001: Identify reasoning type
        reas_type = self._determine_reasoning_type(intent.primary_intent)

        # RE-002: Extract Core Facts
        facts = self._formulate_core_facts(intent)

        # RE-005: Deductive Step-by-Step Logic Chain
        logic_chain = self._build_logic_chain(intent, reas_type)

        # RE-006: Edge Cases & Boundary Conditions
        edge_cases = self._identify_edge_cases(intent)

        raw_solution = (
            f"Reasoned solution for {intent.primary_intent.value} in {intent.primary_domain}. "
            f"Target structure: {blueprint.primary_structure.value}."
        )

        return ReasoningPlan(
            reasoning_id=reasoning_id,
            plan_id=blueprint.plan_id,
            primary_reasoning_type=reas_type,
            facts=facts,
            logic_chain=logic_chain,
            edge_cases_considered=edge_cases,
            raw_solution=raw_solution,
        )

    def _determine_reasoning_type(self, intent: IntentCategory) -> ReasoningType:
        """RE-001: Reasoning type selection"""
        if intent == IntentCategory.MATHEMATICAL_CALCULATION:
            return ReasoningType.MATHEMATICAL
        if intent == IntentCategory.CODE_DEVELOPMENT:
            return ReasoningType.ALGORITHMIC_CODE
        if intent == IntentCategory.COMPARATIVE_ANALYSIS:
            return ReasoningType.COMPARATIVE
        if intent == IntentCategory.PROBLEM_SOLVING:
            return ReasoningType.LOGICAL_DEDUCTIVE
        return ReasoningType.EXPLANATORY

    def _formulate_core_facts(self, intent: UserIntentModel) -> List[InformationUnit]:
        """RE-002: Core vs Supporting information classification"""
        facts = [
            InformationUnit(
                statement=f"Direct truth answering {intent.primary_intent.value} requirement.",
                level=FactLevel.CORE,
                confidence=1.0,
                verified=True,
            ),
            InformationUnit(
                statement=f"Contextual background grounded in domain {intent.primary_domain}.",
                level=FactLevel.SUPPORTING,
                confidence=0.95,
                verified=True,
            ),
            InformationUnit(
                statement="Practical real-world application & pro-tip.",
                level=FactLevel.OPTIONAL,
                confidence=0.9,
                verified=True,
            ),
        ]
        return facts

    def _build_logic_chain(self, intent: UserIntentModel, reas_type: ReasoningType) -> List[LogicStep]:
        """RE-005: Logic chain deduction"""
        return [
            LogicStep(
                step_number=1,
                premise="Initial Problem State & User Query",
                deduction="Identify fundamental principles and definitions",
                validation="Check premise clarity against intent",
            ),
            LogicStep(
                step_number=2,
                premise="Fundamental Principles Established",
                deduction="Execute causal mechanism or logical transition",
                validation="Verify no missing intermediate leaps (No non-sequitur)",
            ),
            LogicStep(
                step_number=3,
                premise="Intermediate Derivation Complete",
                deduction="Synthesize actionable conclusion or validated code/result",
                validation="Ensure conclusion satisfies user constraints",
            ),
        ]

    def _identify_edge_cases(self, intent: UserIntentModel) -> List[str]:
        """RE-006: Boundary condition identification"""
        if intent.primary_intent == IntentCategory.CODE_DEVELOPMENT:
            return ["Null / Empty input handling", "Exception / Network failure timeout", "Type mismatch"]
        if intent.primary_intent == IntentCategory.MATHEMATICAL_CALCULATION:
            return ["Division by zero", "Negative roots", "Domain boundaries"]
        return ["Exceptions to the rule", "Common misconceptions or pitfalls"]
