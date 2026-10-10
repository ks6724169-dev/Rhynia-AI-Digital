"""
RRS v1.0 - Module 07 Schemas: Quality Control Engine (QC-001 to QC-040)
Defines 17 QC Checkers, 100-Point Conceptual Quality Score Engine,
and PASS / REVISE / BLOCK Decision Gate Controller.
"""

from enum import Enum
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class QCDecision(str, Enum):
    PASS = "PASS"        # Score >= 80, safe to deliver to user
    REVISE = "REVISE"    # Score 50-79, triggers Revision Loop (max 2 retries)
    BLOCK = "BLOCK"      # Score < 50 or Critical Safety Violation


class QCSubCheck(BaseModel):
    check_id: str         # e.g., "07.1_COVERAGE", "07.2_ACCURACY", "07.12_SAFETY"
    name: str
    passed: bool
    score_earned: float   # Points earned
    max_score: float      # Maximum possible points for this check
    notes: Optional[str] = None
    violation_level: Optional[str] = None  # None, WARNING, CRITICAL


class QualityCheckReport(BaseModel):
    """
    Final Output of Module 07: Quality Control Engine.
    Delivered directly to Master Orchestrator Pipeline.
    """
    report_id: str
    request_id: str
    overall_score: float = Field(..., ge=0.0, le=100.0, description="100-Point Scale")
    decision: QCDecision
    safety_clearance: bool = True
    sub_checks: List[QCSubCheck] = Field(default_factory=list)
    revision_feedback: Optional[str] = None
    target_engine_for_revision: Optional[str] = None  # e.g., "reasoning", "planner", "presentation"
    retry_count: int = 0
    final_output_text: str = ""
