"""
RRS v1.0 - Module 03 Schemas: Response Planner (RP-001 to RP-020)
Defines response length budgeting, structural layout, tone selection,
section division, table/chart necessity, and interactive element blueprinting.
"""

from enum import Enum
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class ResponseLengthType(str, Enum):
    CONCISE = "concise"          # 1-3 sentences
    MEDIUM = "medium"            # 2-4 structured paragraphs / lists
    COMPREHENSIVE = "comprehensive"  # Detailed multi-section breakdown
    EXHAUSTIVE = "exhaustive"    # Deep-dive with implementation & edge cases


class StructuralStyle(str, Enum):
    DIRECT_ANSWER = "direct_answer"
    STEP_BY_STEP = "step_by_step"
    COMPARISON_TABLE = "comparison_table"
    HIERARCHICAL_DEEP_DIVE = "hierarchical_deep_dive"
    CODE_FIRST = "code_first"
    Q_AND_A = "q_and_a"


class SectionPlan(BaseModel):
    title: str
    target_content_type: str = "text"  # text, code, table, list, chart
    estimated_word_count: int = 100
    mandatory_points: List[str] = Field(default_factory=list)


class ResponseBlueprint(BaseModel):
    """
    Final Output of Module 03: Response Planner.
    Delivered directly to Module 04: Reasoning Engine.
    """
    plan_id: str
    request_id: str
    length_type: ResponseLengthType = ResponseLengthType.MEDIUM
    primary_structure: StructuralStyle = StructuralStyle.STEP_BY_STEP
    tone: str = "professional, direct, empowering"
    include_tables: bool = False
    include_code: bool = False
    include_visual_charts: bool = False
    planned_sections: List[SectionPlan] = Field(default_factory=list)
    guidelines: List[str] = Field(default_factory=list)
