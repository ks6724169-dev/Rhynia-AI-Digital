"""
RRS v1.0 - Module 02 Schemas: Understanding Engine (UE-001 to UE-025)
Defines structured intent classification, entity detection, ambiguity detection,
knowledge domain categorization, user experience level, and expected outcome.
"""

from enum import Enum
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class IntentCategory(str, Enum):
    INFORMATIONAL = "informational"
    EXPLANATORY = "explanatory"
    PROBLEM_SOLVING = "problem_solving"
    CODE_DEVELOPMENT = "code_development"
    CREATIVE_WRITING = "creative_writing"
    COMPARATIVE_ANALYSIS = "comparative_analysis"
    MATHEMATICAL_CALCULATION = "mathematical_calculation"
    CONVERSATIONAL_CHITCHAT = "conversational_chitchat"
    PROCEDURAL_GUIDE = "procedural_guide"
    RESEARCH_INVESTIGATION = "research_investigation"


class UserProficiencyLevel(str, Enum):
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    EXPERT = "expert"
    STUDENT = "student"
    PROFESSIONAL = "professional"


class AmbiguityStatus(str, Enum):
    CLEAR = "clear"
    PARTIAL = "partially_ambiguous"
    AMBIGUOUS = "highly_ambiguous"


class ExtractedEntity(BaseModel):
    name: str
    entity_type: str
    confidence: float = 1.0


class UserIntentModel(BaseModel):
    """
    Final Output of Module 02: Understanding Engine.
    Delivered directly to Module 03: Response Planner.
    """
    request_id: str
    primary_intent: IntentCategory
    secondary_intents: List[IntentCategory] = Field(default_factory=list)
    primary_domain: str = "general"
    detected_language: str = "hi-IN"
    target_proficiency: UserProficiencyLevel = UserProficiencyLevel.INTERMEDIATE
    ambiguity: AmbiguityStatus = AmbiguityStatus.CLEAR
    clarification_questions: List[str] = Field(default_factory=list)
    extracted_entities: List[ExtractedEntity] = Field(default_factory=list)
    key_constraints: List[str] = Field(default_factory=list)
    expected_outcome: str = "Direct, accurate, and actionable explanation"
