"""
Rhynia Intelligence SaaS — Memory Management Router (Phase 3 & Phase 5)
Provides full control for user personalization memory, facts inspection,
manual editing, reset memory, and storage telemetry.
"""

from typing import Any, Dict, List, Optional, Union
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from services.rhynia_saas.backend.auth import get_current_user
from services.rhynia_saas.backend.database import User, get_db
from services.rhynia_saas.backend.services import memory_service

router = APIRouter(prefix="/api/v1/memory", tags=["Memory"])


# ==========================================
# PYDANTIC SCHEMAS
# ==========================================
class MemoryFactResponse(BaseModel):
    id: str
    fact_key: str
    fact_value: str
    category: str
    confidence_score: int
    size_bytes: int
    created_at: str
    updated_at: str


class MemoryFactCreateRequest(BaseModel):
    fact_key: str = Field(..., min_length=2, max_length=100)
    fact_value: str = Field(..., min_length=1, max_length=1000)
    category: Optional[str] = Field(default="general", max_length=50)


class MemoryTelemetryResponse(BaseModel):
    plan_tier: str
    quota_bytes: int
    quota_mb: float
    total_used_bytes: int
    total_used_mb: float
    usage_percent: float
    is_quota_exceeded: bool
    facts_count: int
    facts_bytes: int
    summary_buffers_count: int
    summary_bytes: int


class MemorySearchResult(BaseModel):
    session_id: str
    session_title: str
    date: str
    score: int
    recalled_snippet: str


class PersonalizationRequest(BaseModel):
    nickname: Optional[str] = None
    occupation: Optional[str] = None
    more_about_you: Optional[str] = None
    overview: Optional[str] = None
    sections: Optional[Union[List, str]] = None
    memory_enabled: Optional[bool] = None


class MemoryToggleRequest(BaseModel):
    enabled: bool


class MemoryAskUpdateRequest(BaseModel):
    message: str


# ==========================================
# ENDPOINTS
# ==========================================

@router.get("/search", response_model=List[MemorySearchResult])
def search_memory(
    q: str,
    exclude_session_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Search prior chat conversations, summaries, and topics for cross-session recall."""
    results = memory_service.search_past_conversations(
        user_id=current_user.id,
        query=q,
        exclude_session_id=exclude_session_id,
        db=db,
        limit=5,
    )
    return results
@router.get("/profile", response_model=MemoryTelemetryResponse)
def get_memory_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve user memory storage telemetry, quota limits, and usage analytics."""
    telemetry = memory_service.get_user_memory_usage(current_user.id, db)
    return MemoryTelemetryResponse(
        plan_tier=telemetry["plan_tier"],
        quota_bytes=telemetry["quota_bytes"],
        quota_mb=telemetry["quota_mb"],
        total_used_bytes=telemetry["total_used_bytes"],
        total_used_mb=telemetry["total_used_mb"],
        usage_percent=telemetry.get("used_percentage", 0.0),
        is_quota_exceeded=telemetry["is_exceeded"],
        facts_count=telemetry.get("facts_count", 0),
        facts_bytes=telemetry.get("facts_bytes", 0),
        summary_buffers_count=telemetry.get("summary_buffers_count", telemetry.get("summaries_count", 0)),
        summary_bytes=telemetry.get("summary_bytes", telemetry.get("summaries_bytes", 0)),
    )


@router.get("/facts", response_model=List[MemoryFactResponse])
def list_memory_facts(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List all long-term memory facts stored for the authenticated user."""
    facts = memory_service.get_user_facts(current_user.id, db)
    return [
        MemoryFactResponse(
            id=f.id,
            fact_key=f.fact_key,
            fact_value=f.fact_value,
            category=f.category,
            confidence_score=f.confidence_score,
            size_bytes=f.size_bytes,
            created_at=f.created_at.isoformat() if f.created_at else "",
            updated_at=f.updated_at.isoformat() if f.updated_at else "",
        )
        for f in facts
    ]


@router.post("/facts", response_model=MemoryFactResponse)
def create_or_update_memory_fact(
    req: MemoryFactCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Manually create or update a personalization memory fact."""
    # Verify quota before adding
    can_store = memory_service.check_user_memory_quota(current_user.id, db)
    if not can_store:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail="Memory storage quota exceeded. Upgrade to Pro or delete older facts.",
        )

    fact = memory_service.save_or_update_fact(
        user_id=current_user.id,
        fact_key=req.fact_key,
        fact_value=req.fact_value,
        category=req.category or "general",
        confidence_score=100,
        db=db,
    )

    return MemoryFactResponse(
        id=fact.id,
        fact_key=fact.fact_key,
        fact_value=fact.fact_value,
        category=fact.category,
        confidence_score=fact.confidence_score,
        size_bytes=fact.size_bytes,
        created_at=fact.created_at.isoformat() if fact.created_at else "",
        updated_at=fact.updated_at.isoformat() if fact.updated_at else "",
    )


@router.delete("/facts/{fact_id}")
def delete_memory_fact(
    fact_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a specific long-term memory fact."""
    deleted = memory_service.delete_user_fact(current_user.id, fact_id, db)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Fact not found.")
    return {"status": "success", "message": "Fact deleted successfully."}


@router.delete("/facts")
def clear_all_memory_facts(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Reset and clear all personalization memory facts for the authenticated user."""
    count = memory_service.clear_user_facts(current_user.id, db)
    return {"status": "success", "message": f"Cleared {count} memory facts."}


# ==========================================
# CHATGPT-STYLE MEMORY SUMMARY ENDPOINTS
# ==========================================
@router.get("/summary")
def get_memory_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve user memory profile summary, personalized details, and ChatGPT-style sections."""
    profile = memory_service.get_or_create_user_memory_profile(current_user.id, db)
    return memory_service.serialize_memory_profile(profile)


@router.put("/personalization")
@router.post("/personalization")
def update_memory_personalization(
    req: PersonalizationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update personalization inputs (nickname, occupation, background, sections, memory enabled)."""
    profile = memory_service.update_user_memory_profile(
        user_id=current_user.id,
        db=db,
        nickname=req.nickname,
        occupation=req.occupation,
        more_about_you=req.more_about_you,
        overview=req.overview,
        sections=req.sections,
        memory_enabled=req.memory_enabled,
    )
    return memory_service.serialize_memory_profile(profile)


@router.post("/summary/toggle")
def toggle_memory_summary(
    req: MemoryToggleRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Toggle master memory setting on or off."""
    profile = memory_service.toggle_user_memory_enabled(current_user.id, req.enabled, db)
    return {
        "status": "success",
        "memory_enabled": profile.memory_enabled,
        "profile": memory_service.serialize_memory_profile(profile)
    }


@router.post("/summary/refresh")
def refresh_memory_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Re-synthesize memory sections from stored facts and recent conversations."""
    profile = memory_service.refresh_user_memory_summary(current_user.id, db)
    return memory_service.serialize_memory_profile(profile)


@router.post("/summary/clear")
def clear_memory_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Clear all stored facts and reset memory profile sections."""
    profile = memory_service.clear_user_memory_summary(current_user.id, db)
    return memory_service.serialize_memory_profile(profile)


@router.post("/summary/ask-update")
async def ask_update_memory(
    req: MemoryAskUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Directly teach Rhynia a new detail or preference in natural language."""
    if not req.message or len(req.message.strip()) < 2:
        raise HTTPException(status_code=400, detail="Message cannot be empty.")

    facts = memory_service.extract_facts_from_user_message(req.message)
    if facts:
        for f in facts:
            memory_service.save_or_update_fact(
                user_id=current_user.id,
                fact_key=f["fact_key"],
                fact_value=f["fact_value"],
                category=f.get("category", "general"),
                confidence_score=f.get("confidence_score", 95),
                db=db,
            )
    else:
        memory_service.save_or_update_fact(
            user_id=current_user.id,
            fact_key="user_instruction",
            fact_value=req.message.strip(),
            category="preferences",
            confidence_score=95,
            db=db,
        )

    profile = memory_service.refresh_user_memory_summary(current_user.id, db)
    return {
        "status": "success",
        "reply": f"Rhynia remembered: \"{req.message.strip()}\"",
        "profile": memory_service.serialize_memory_profile(profile)
    }

