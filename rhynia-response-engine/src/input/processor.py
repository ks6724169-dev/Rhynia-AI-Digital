"""
Module 01: Input Processor Engine (IP-001 to IP-020)
Transforms raw user input into a validated StructuredRequest.
"""

import re
import uuid
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional

from ..schemas.input_models import (
    InputModality,
    AttachmentType,
    AttachmentMetadata,
    ConversationTurn,
    SanitizedInput,
    StructuredRequest,
)


class InputProcessorEngine:
    """
    Executes rules IP-001 to IP-020 for complete input capture,
    normalization, injection-check, and StructuredRequest formulation.
    """

    def __init__(self, max_length: int = 50000):
        self.max_length = max_length
        # Injection detection patterns (IP-006 & IP-018)
        self.injection_patterns = [
            re.compile(r"ignore\s+(all\s+)?previous\s+instructions", re.IGNORECASE),
            re.compile(r"disregard\s+(all\s+)?prior\s+prompts", re.IGNORECASE),
            re.compile(r"system\s*prompt\s*reveal", re.IGNORECASE),
            re.compile(r"you\s+are\s+now\s+in\s+DAN\s+mode", re.IGNORECASE),
            re.compile(r"<system>.*?</system>", re.IGNORECASE | re.DOTALL),
        ]

    def process(
        self,
        raw_message: str,
        session_id: Optional[str] = None,
        attachments: Optional[List[Dict[str, Any]]] = None,
        history: Optional[List[Dict[str, Any]]] = None,
        system_constraints: Optional[Dict[str, Any]] = None,
    ) -> StructuredRequest:
        """
        Main entrypoint executing IP-001 through IP-020.
        """
        req_id = f"req_{uuid.uuid4().hex[:12]}"
        sess_id = session_id or f"sess_{uuid.uuid4().hex[:8]}"
        now_ts = datetime.now(timezone.utc).isoformat()

        # IP-001: Capture raw message
        raw_text = raw_message or ""

        # IP-008: Check empty / whitespace input
        if not raw_text.strip():
            sanitized = SanitizedInput(
                raw_text="",
                cleaned_text="",
                is_empty=True,
                detected_modality=InputModality.TEXT,
                language_hint="unknown",
                character_count=0,
                word_count=0,
                injection_flags=[],
            )
            return StructuredRequest(
                request_id=req_id,
                session_id=sess_id,
                sanitized=sanitized,
                attachments=[],
                recent_history=[],
                system_constraints=system_constraints or {},
                timestamp=now_ts,
            )

        # IP-009: Budget / length truncation if excessive
        if len(raw_text) > self.max_length:
            raw_text = raw_text[: self.max_length]

        # IP-002: Normalization (strip zero-width characters, normalize whitespace)
        cleaned = re.sub(r"[\u200B-\u200D\uFEFF]", "", raw_text)
        cleaned = re.sub(r"[ \t]+", " ", cleaned).strip()

        # IP-006 & IP-018: Injection & Malicious Pattern Flagging
        injection_flags = []
        for pat in self.injection_patterns:
            if pat.search(cleaned):
                injection_flags.append(pat.pattern)

        # IP-003: Language & Script Detection
        lang_hint = self._detect_language(cleaned)

        # IP-004: Modality Detection
        has_attachments = bool(attachments and len(attachments) > 0)
        modality = InputModality.MULTIMODAL if has_attachments else InputModality.TEXT

        # Word count calculation
        words = len(cleaned.split())

        sanitized = SanitizedInput(
            raw_text=raw_message,
            cleaned_text=cleaned,
            is_empty=False,
            detected_modality=modality,
            language_hint=lang_hint,
            character_count=len(cleaned),
            word_count=words,
            injection_flags=injection_flags,
        )

        # IP-007: Attachment Content Ingestion
        parsed_attachments = self._parse_attachments(attachments or [])

        # IP-005 & IP-010: Context Windowing (retain last 10 turns max)
        parsed_history = self._parse_history(history or [])

        # IP-019 & IP-020: Output Structured Request Handshake
        return StructuredRequest(
            request_id=req_id,
            session_id=sess_id,
            sanitized=sanitized,
            attachments=parsed_attachments,
            recent_history=parsed_history,
            system_constraints=system_constraints or {},
            timestamp=now_ts,
        )

    def _detect_language(self, text: str) -> str:
        """
        IP-003: Fast heuristic language detection (Devanagari Hindi, Hinglish, English).
        """
        devanagari_chars = sum(1 for c in text if "\u0900" <= c <= "\u097F")
        total_alpha = sum(1 for c in text if c.isalpha())

        if total_alpha == 0:
            return "neutral"
        if devanagari_chars / total_alpha > 0.35:
            return "hi-IN"  # Hindi in Devanagari script

        # Check for Hinglish markers
        hinglish_markers = {
            "kya", "hai", "kaise", "batao", "bhai", "karo", "kyun", "kab", "kahan", "nahi", "accha", "samjhao"
        }
        tokens = {t.lower() for t in re.findall(r"\b\w+\b", text)}
        if tokens & hinglish_markers:
            return "hi-Latn"  # Hinglish (Hindi written in Latin script)

        return "en-US"

    def _parse_attachments(self, raw_attachments: List[Dict[str, Any]]) -> List[AttachmentMetadata]:
        """
        IP-007: Parse and standardize attachment metadata.
        """
        results = []
        for i, att in enumerate(raw_attachments):
            f_type = att.get("file_type", "other")
            try:
                att_type = AttachmentType(f_type)
            except ValueError:
                att_type = AttachmentType.OTHER

            results.append(
                AttachmentMetadata(
                    file_id=att.get("file_id", f"att_{i}_{uuid.uuid4().hex[:6]}"),
                    file_name=att.get("file_name", f"attachment_{i}"),
                    file_type=att_type,
                    mime_type=att.get("mime_type", "application/octet-stream"),
                    size_bytes=att.get("size_bytes", 0),
                    extracted_text=att.get("extracted_text"),
                    structured_data=att.get("structured_data"),
                )
            )
        return results

    def _parse_history(self, raw_history: List[Dict[str, Any]]) -> List[ConversationTurn]:
        """
        IP-005 & IP-010: Windowing history to last 10 turns.
        """
        trimmed = raw_history[-10:] if len(raw_history) > 10 else raw_history
        turns = []
        for t in trimmed:
            turns.append(
                ConversationTurn(
                    role=t.get("role", "user"),
                    content=t.get("content", ""),
                    timestamp=t.get("timestamp"),
                    metadata=t.get("metadata", {}),
                )
            )
        return turns
