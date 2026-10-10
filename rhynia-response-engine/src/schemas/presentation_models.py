"""
RRS v1.0 - Module 06 Schemas: Presentation Engine (PP-001 to PP-052)
Defines UI-ready markdown representations, callout boxes, comparison tables,
interactive chart configurations, math formulas, code blocks, and visual layout.
"""

from enum import Enum
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class CalloutType(str, Enum):
    NOTE = "NOTE"
    TIP = "TIP"
    IMPORTANT = "IMPORTANT"
    WARNING = "WARNING"
    CAUTION = "CAUTION"


class CalloutBox(BaseModel):
    callout_type: CalloutType = CalloutType.NOTE
    title: Optional[str] = None
    content: str


class TableSpec(BaseModel):
    headers: List[str]
    rows: List[List[str]]
    caption: Optional[str] = None


class ChartSpec(BaseModel):
    chart_type: str = "bar"  # bar, line, pie, radar
    title: str
    labels: List[str]
    datasets: List[Dict[str, Any]]


class CodeBlockSpec(BaseModel):
    language: str
    code: str
    file_name: Optional[str] = None
    line_numbers: bool = False


class FormattedResponse(BaseModel):
    """
    Final Output of Module 06: Presentation Engine.
    Delivered directly to Module 07: Quality Control Engine.
    """
    raw_markdown: str
    structured_sections: List[Dict[str, Any]] = Field(default_factory=list)
    callouts: List[CalloutBox] = Field(default_factory=list)
    tables: List[TableSpec] = Field(default_factory=list)
    charts: List[ChartSpec] = Field(default_factory=list)
    code_blocks: List[CodeBlockSpec] = Field(default_factory=list)
    math_formulas: List[str] = Field(default_factory=list)
    diagram_images: List[str] = Field(default_factory=list)
    estimated_read_time_seconds: int = 30
