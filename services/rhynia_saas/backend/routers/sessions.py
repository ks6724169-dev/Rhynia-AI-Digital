"""
Rhynia Intelligence SaaS — Chat Sessions & History Management API
"""

from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Response, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from services.rhynia_saas.backend.auth import get_current_user
from services.rhynia_saas.backend.database import ChatMessage, ChatSession, User, get_db
from services.rhynia_saas.backend.services.export import export_service

router = APIRouter(prefix="/api/v1/sessions", tags=["Sessions"])


# ==========================================
# PYDANTIC SCHEMAS
# ==========================================
class CreateSessionRequest(BaseModel):
    title: Optional[str] = Field("New Chat", max_length=255)


class RenameSessionRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)


class MessageItem(BaseModel):
    id: str
    role: str
    content: str
    model_used: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class SessionSummary(BaseModel):
    id: str
    title: str
    is_pinned: bool
    created_at: datetime
    updated_at: datetime
    message_count: int = 0

    class Config:
        from_attributes = True


class SessionDetail(BaseModel):
    id: str
    title: str
    is_pinned: bool
    created_at: datetime
    updated_at: datetime
    messages: List[MessageItem]

    class Config:
        from_attributes = True


# ==========================================
# 1. LIST SESSIONS (PINNED FIRST, CHRONOLOGICAL)
# ==========================================
@router.get("", response_model=List[SessionSummary])
def list_sessions(
    skip: int = 0,
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve all conversations for current user, pinned threads first."""
    sessions = (
        db.query(ChatSession)
        .filter(ChatSession.user_id == current_user.id)
        .order_by(ChatSession.is_pinned.desc(), ChatSession.updated_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

    summaries = []
    for s in sessions:
        count = db.query(ChatMessage).filter(ChatMessage.session_id == s.id).count()
        summaries.append(
            SessionSummary(
                id=s.id,
                title=s.title,
                is_pinned=s.is_pinned,
                created_at=s.created_at,
                updated_at=s.updated_at,
                message_count=count,
            )
        )
    return summaries


# ==========================================
# 2. CREATE NEW SESSION
# ==========================================
@router.post("", response_model=SessionSummary, status_code=status.HTTP_201_CREATED)
def create_session(
    req: CreateSessionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Start a new clean chat session."""
    session = ChatSession(
        user_id=current_user.id,
        title=req.title or "New Chat",
        is_pinned=False,
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return SessionSummary(
        id=session.id,
        title=session.title,
        is_pinned=session.is_pinned,
        created_at=session.created_at,
        updated_at=session.updated_at,
        message_count=0,
    )


# ==========================================
# 3. GET SESSION DETAIL & MESSAGES
# ==========================================
@router.get("/{session_id}", response_model=SessionDetail)
def get_session(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Load full conversation history for a specific session."""
    session = (
        db.query(ChatSession)
        .filter(ChatSession.id == session_id, ChatSession.user_id == current_user.id)
        .first()
    )
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found.",
        )

    messages = (
        db.query(ChatMessage)
        .filter(ChatMessage.session_id == session_id)
        .order_by(ChatMessage.created_at.asc())
        .all()
    )

    return SessionDetail(
        id=session.id,
        title=session.title,
        is_pinned=session.is_pinned,
        created_at=session.created_at,
        updated_at=session.updated_at,
        messages=messages,
    )


# ==========================================
# 4. PIN / UNPIN SESSION
# ==========================================
@router.patch("/{session_id}/pin", response_model=SessionSummary)
def toggle_pin_session(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Toggle pinned status of a conversation."""
    session = (
        db.query(ChatSession)
        .filter(ChatSession.id == session_id, ChatSession.user_id == current_user.id)
        .first()
    )
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found.",
        )

    session.is_pinned = not session.is_pinned
    session.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(session)

    count = db.query(ChatMessage).filter(ChatMessage.session_id == session.id).count()
    return SessionSummary(
        id=session.id,
        title=session.title,
        is_pinned=session.is_pinned,
        created_at=session.created_at,
        updated_at=session.updated_at,
        message_count=count,
    )


# ==========================================
# 5. RENAME SESSION TITLE
# ==========================================
@router.patch("/{session_id}/title", response_model=SessionSummary)
def rename_session(
    session_id: str,
    req: RenameSessionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update title of an existing conversation."""
    session = (
        db.query(ChatSession)
        .filter(ChatSession.id == session_id, ChatSession.user_id == current_user.id)
        .first()
    )
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found.",
        )

    session.title = req.title.strip()
    session.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(session)

    count = db.query(ChatMessage).filter(ChatMessage.session_id == session.id).count()
    return SessionSummary(
        id=session.id,
        title=session.title,
        is_pinned=session.is_pinned,
        created_at=session.created_at,
        updated_at=session.updated_at,
        message_count=count,
    )


# ==========================================
# 6. DELETE SESSION
# ==========================================
@router.delete("/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_session(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a conversation and all its associated messages."""
    session = (
        db.query(ChatSession)
        .filter(ChatSession.id == session_id, ChatSession.user_id == current_user.id)
        .first()
    )
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found.",
        )

    db.delete(session)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# ==========================================
# 7. EXPORT SESSION (PDF / TEXT DOCUMENT)
# ==========================================
@router.get("/{session_id}/export")
def export_session(
    session_id: str,
    format: str = "text",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Export conversation history as downloadable document or presentation structure."""
    session = (
        db.query(ChatSession)
        .filter(ChatSession.id == session_id, ChatSession.user_id == current_user.id)
        .first()
    )
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found.")

    messages = (
        db.query(ChatMessage)
        .filter(ChatMessage.session_id == session_id)
        .order_by(ChatMessage.created_at.asc())
        .all()
    )

    msg_dicts = [{"role": m.role, "content": m.content} for m in messages]

    if format == "slides":
        # Check plan limit for slides / PPT (Pro or Ultra Pro required)
        if current_user.plan_tier == "free":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Presentation export is available exclusively on Rhynia Pro and Ultra Pro plans.",
            )
        full_text = "\n\n".join([m.content for m in messages if m.role != "user"])
        return export_service.generate_presentation_outline(session.title, full_text)

    # Default text / document download
    doc_bytes = export_service.generate_text_document(session.title, msg_dicts)
    return Response(
        content=doc_bytes,
        media_type="text/markdown",
        headers={"Content-Disposition": f'attachment; filename="Rhynia_{session.id[:8]}.md"'},
    )
