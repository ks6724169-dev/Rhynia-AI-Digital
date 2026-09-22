"""
Rhynia Intelligence SaaS — Message Feedback (Like/Dislike) Router
Brand Compliance: 100% Rhynia Clean
"""

import json
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from services.rhynia_saas.backend.auth import get_current_user
from services.rhynia_saas.backend.database import MessageFeedback, User, get_db

router = APIRouter(prefix="/api/v1/feedback", tags=["Feedback"])


# ==========================================
# PYDANTIC SCHEMAS
# ==========================================
class FeedbackCreateRequest(BaseModel):
    rating: str = Field(..., pattern="^(like|dislike)$", description="User rating: 'like' or 'dislike'")
    message_id: Optional[str] = Field(None, description="Identifier of the message being reviewed")
    session_id: Optional[str] = Field(None, description="Session ID if available")
    tags: Optional[List[str]] = Field(default=[], description="Selected feedback tags/chips")
    comment: Optional[str] = Field(default="", description="User text feedback")
    chat_snippet: Optional[str] = Field(default="", description="Excerpt of the AI response / conversation")


class FeedbackResponse(BaseModel):
    id: str
    status: str
    rating: str
    created_at: str


# ==========================================
# ENDPOINTS
# ==========================================
@router.post("", response_model=FeedbackResponse, status_code=status.HTTP_201_CREATED)
async def submit_feedback(
    payload: FeedbackCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Submit user feedback (Like or Dislike) with chosen tags and comment.
    Data is stored in the database for continuous AI response refinement.
    """
    serialized_tags = json.dumps(payload.tags or [], ensure_ascii=False)

    fb_record = MessageFeedback(
        user_id=current_user.id,
        session_id=payload.session_id if payload.session_id else None,
        message_id=payload.message_id,
        rating=payload.rating.lower(),
        tags=serialized_tags,
        comment=(payload.comment or "").strip(),
        chat_snippet=(payload.chat_snippet or "").strip(),
        created_at=datetime.now(timezone.utc),
    )

    db.add(fb_record)
    db.commit()
    db.refresh(fb_record)

    return FeedbackResponse(
        id=fb_record.id,
        status="success",
        rating=fb_record.rating,
        created_at=fb_record.created_at.isoformat(),
    )


@router.get("", tags=["Feedback"])
async def list_feedbacks(
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    rating: Optional[str] = Query(None, pattern="^(like|dislike)$"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Retrieve feedback logs submitted by users for auditing and improvements.
    """
    query = db.query(MessageFeedback)
    if rating:
        query = query.filter(MessageFeedback.rating == rating.lower())

    feedbacks = query.order_by(MessageFeedback.created_at.desc()).offset(offset).limit(limit).all()

    results = []
    for f in feedbacks:
        parsed_tags = []
        try:
            if f.tags:
                parsed_tags = json.loads(f.tags)
        except Exception:
            parsed_tags = [f.tags]

        results.append({
            "id": f.id,
            "user_id": f.user_id,
            "session_id": f.session_id,
            "message_id": f.message_id,
            "rating": f.rating,
            "tags": parsed_tags,
            "comment": f.comment,
            "chat_snippet": f.chat_snippet,
            "created_at": f.created_at.isoformat(),
        })

    return {
        "status": "success",
        "total": len(results),
        "feedbacks": results,
    }
