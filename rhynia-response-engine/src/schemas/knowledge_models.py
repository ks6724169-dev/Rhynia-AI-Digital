"""
RRS v1.0 - Module 05 Schemas: Knowledge & Tool Layer (KL-001 to KL-025)
Defines tool dispatch criteria, search triggers, RAG retrieval schemas,
code execution sandbox request/response, and grounding facts.
"""

from enum import Enum
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class KnowledgeSourceType(str, Enum):
    PARAMETRIC_MEMORY = "parametric_memory"
    CONVERSATION_HISTORY = "conversation_history"
    LOCAL_DOCUMENT = "local_document"
    WEB_SEARCH = "web_search"
    CODE_SANDBOX = "code_sandbox"
    DIAGRAM_SERVICE = "diagram_service"
    CALCULATOR = "calculator"


class ToolCallSpec(BaseModel):
    tool_name: str
    arguments: Dict[str, Any] = Field(default_factory=dict)
    timeout_seconds: float = 5.0
    is_required: bool = False


class ToolExecutionResult(BaseModel):
    tool_name: str
    success: bool
    data: Any = None
    error_message: Optional[str] = None
    execution_time_ms: float = 0.0


class KnowledgeContext(BaseModel):
    """
    Final Output of Module 05: Knowledge & Tool Layer.
    Delivered directly to Module 06: Presentation Engine.
    """
    source_used: KnowledgeSourceType = KnowledgeSourceType.PARAMETRIC_MEMORY
    grounding_data: List[str] = Field(default_factory=list)
    tool_results: List[ToolExecutionResult] = Field(default_factory=list)
    diagram_urls: List[str] = Field(default_factory=list)
    is_grounded: bool = True
