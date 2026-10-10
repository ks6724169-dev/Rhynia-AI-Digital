"""
RRS v1.0 - Module 04 Schemas: Reasoning Engine (RE-001 to RE-020)
Defines classification of reasoning tasks, factual core selection,
cause-and-effect validation, multi-step math/logic deduction, and edge-case testing.
"""

from enum import Enum
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class ReasoningType(str, Enum):
    FACTUAL = "factual"
    EXPLANATORY = "explanatory"
    LOGICAL_DEDUCTIVE = "logical_deductive"
    MATHEMATICAL = "mathematical"
    COMPARATIVE = "comparative"
    CAUSAL_ANALYSIS = "causal_analysis"
    ALGORITHMIC_CODE = "algorithmic_code"
    CREATIVE_SYNTHESIS = "creative_synthesis"


class FactLevel(str, Enum):
    CORE = "core"            # Must-have indispensable answer truth
    SUPPORTING = "supporting" # Contextual explanation or derivation
    OPTIONAL = "optional"    # Nice to have trivia/additional tips


class InformationUnit(BaseModel):
    statement: str
    level: FactLevel = FactLevel.CORE
    confidence: float = 1.0
    verified: bool = True
    citation_ref: Optional[str] = None


class LogicStep(BaseModel):
    step_number: int
    premise: str
    deduction: str
    validation: str


class ReasoningPlan(BaseModel):
    """
    Final Output of Module 04: Reasoning Engine.
    Delivered directly to Module 05: Knowledge Layer & Module 06: Presentation Engine.
    """
    reasoning_id: str
    plan_id: str
    primary_reasoning_type: ReasoningType = ReasoningType.EXPLANATORY
    facts: List[InformationUnit] = Field(default_factory=list)
    logic_chain: List[LogicStep] = Field(default_factory=list)
    edge_cases_considered: List[str] = Field(default_factory=list)
    raw_solution: str = ""
