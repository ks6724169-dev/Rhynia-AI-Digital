"""
RRS v1.0 - Module 01 Schemas: Input Processor (IP-001 to IP-020)
Defines clean data contracts for raw input capture, sanitization,
attachment parsing, context merging, and structured request formulation.
"""

from enum import Enum
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class InputModality(str, Enum):
    TEXT = "text"
    VOICE_TRANSCRIPT = "voice_transcript"
    FILE_ATTACHMENT = "file_attachment"
    MULTIMODAL = "multimodal"


class AttachmentType(str, Enum):
    IMAGE = "image"
    PDF = "pdf"
    CODE = "code"
    DATA_SHEET = "data_sheet"
    AUDIO = "audio"
    OTHER = "other"


class AttachmentMetadata(BaseModel):
    file_id: str
    file_name: str
    file_type: AttachmentType
    mime_type: str
    size_bytes: int = 0
    extracted_text: Optional[str] = None
    structured_data: Optional[Dict[str, Any]] = None


class ConversationTurn(BaseModel):
    role: str = Field(..., description="user or assistant")
    content: str
    timestamp: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)


class SanitizedInput(BaseModel):
    raw_text: str
    cleaned_text: str
    is_empty: bool = False
    detected_modality: InputModality = InputModality.TEXT
    language_hint: Optional[str] = None
    character_count: int = 0
    word_count: int = 0
    injection_flags: List[str] = Field(default_factory=list)


class StructuredRequest(BaseModel):
    """
    Final Output of Module 01: Input Processor.
    Delivered directly to Module 02: Understanding Engine.
    """
    request_id: str
    session_id: str
    sanitized: SanitizedInput
    attachments: List[AttachmentMetadata] = Field(default_factory=list)
    recent_history: List[ConversationTurn] = Field(default_factory=list)
    system_constraints: Dict[str, Any] = Field(default_factory=dict)
    timestamp: str
