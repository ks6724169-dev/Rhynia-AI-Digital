"""
Rhynia Intelligence SaaS — Memory Management & Quota Service
Handles Tiered Quota Tracking (8MB / 16MB / 25MB), Long-Term Fact Persistence,
and 2-Tier Rolling Summary Buffering.
"""

import logging
from typing import Dict, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func

from services.rhynia_saas.backend.config import settings
from services.rhynia_saas.backend.database import User, UserMemoryFact, ChatSummaryBuffer, get_utc_now

logger = logging.getLogger("rhynia.memory_service")


def get_tier_quota_bytes(plan_tier: str) -> int:
    """Return maximum memory quota in bytes based on plan tier."""
    tier = (plan_tier or "free").lower()
    if tier == "ultra_pro":
        return settings.ULTRA_PRO_MEMORY_QUOTA_BYTES
    elif tier == "pro":
        return settings.PRO_MEMORY_QUOTA_BYTES
    return settings.FREE_MEMORY_QUOTA_BYTES


def get_tier_thread_limit(plan_tier: str) -> int:
    """Return maximum messages per single thread."""
    tier = (plan_tier or "free").lower()
    if tier in ["pro", "ultra_pro"]:
        return settings.PRO_TIER_THREAD_MESSAGE_LIMIT
    return settings.FREE_TIER_THREAD_MESSAGE_LIMIT


def calculate_string_bytes(text: str) -> int:
    """Compute UTF-8 byte length of a string."""
    if not text:
        return 0
    return len(text.encode("utf-8"))


def get_user_memory_usage(user_id: str, db: Session) -> Dict:
    """
    Calculate real-time memory storage usage for a given user across:
    - UserMemoryFact records
    - ChatSummaryBuffer records
    """
    user = db.query(User).filter(User.id == user_id).first()
    plan_tier = user.plan_tier if user else "free"
    quota_bytes = get_tier_quota_bytes(plan_tier)

    # 1. Facts bytes
    facts_query = db.query(
        func.count(UserMemoryFact.id).label("count"),
        func.coalesce(func.sum(UserMemoryFact.size_bytes), 0).label("bytes")
    ).filter(UserMemoryFact.user_id == user_id).first()

    facts_count = facts_query.count if facts_query else 0
    facts_bytes = int(facts_query.bytes) if facts_query else 0

    # 2. Summaries bytes
    summaries_query = db.query(
        func.count(ChatSummaryBuffer.id).label("count"),
        func.coalesce(func.sum(ChatSummaryBuffer.size_bytes), 0).label("bytes")
    ).filter(ChatSummaryBuffer.user_id == user_id).first()

    summaries_count = summaries_query.count if summaries_query else 0
    summaries_bytes = int(summaries_query.bytes) if summaries_query else 0

    total_used_bytes = facts_bytes + summaries_bytes
    used_percentage = round((total_used_bytes / quota_bytes) * 100, 2) if quota_bytes > 0 else 0.0

    return {
        "user_id": user_id,
        "plan_tier": plan_tier,
        "quota_bytes": quota_bytes,
        "quota_mb": round(quota_bytes / (1024 * 1024), 1),
        "total_used_bytes": total_used_bytes,
        "total_used_mb": round(total_used_bytes / (1024 * 1024), 4),
        "used_percentage": min(used_percentage, 100.0),
        "is_exceeded": total_used_bytes >= quota_bytes,
        "facts_count": facts_count,
        "facts_bytes": facts_bytes,
        "summaries_count": summaries_count,
        "summaries_bytes": summaries_bytes,
    }


def check_user_memory_quota(user: User, db: Session) -> bool:
    """Returns True if user has room within their memory quota, False if exceeded."""
    if not user:
        return False
    usage = get_user_memory_usage(user.id, db)
    return not usage["is_exceeded"]


# ==========================================
# LONG-TERM USER MEMORY FACTS CRUD
# ==========================================
def save_or_update_fact(
    user_id: str,
    fact_key: str,
    fact_value: str,
    category: str = "general",
    confidence_score: int = 100,
    db: Session = None,
) -> UserMemoryFact:
    """Save or update a personal user fact with automatic byte calculation."""
    clean_key = fact_key.strip().lower()
    clean_value = fact_value.strip()
    size_bytes = calculate_string_bytes(clean_key) + calculate_string_bytes(clean_value)

    fact = db.query(UserMemoryFact).filter(
        UserMemoryFact.user_id == user_id,
        UserMemoryFact.fact_key == clean_key
    ).first()

    if fact:
        fact.fact_value = clean_value
        fact.category = category
        fact.confidence_score = confidence_score
        fact.size_bytes = size_bytes
        fact.updated_at = get_utc_now()
    else:
        fact = UserMemoryFact(
            user_id=user_id,
            fact_key=clean_key,
            fact_value=clean_value,
            category=category,
            confidence_score=confidence_score,
            size_bytes=size_bytes,
            created_at=get_utc_now(),
            updated_at=get_utc_now()
        )
        db.add(fact)

    db.commit()
    db.refresh(fact)
    return fact


def get_user_facts(user_id: str, db: Session) -> List[UserMemoryFact]:
    """Retrieve all stored memory facts for a user ordered by category and recency."""
    return db.query(UserMemoryFact).filter(
        UserMemoryFact.user_id == user_id
    ).order_by(UserMemoryFact.category, UserMemoryFact.updated_at.desc()).all()


def delete_user_fact(user_id: str, fact_id: str, db: Session) -> bool:
    """Delete a specific memory fact by id belonging to user."""
    fact = db.query(UserMemoryFact).filter(
        UserMemoryFact.id == fact_id,
        UserMemoryFact.user_id == user_id
    ).first()
    if fact:
        db.delete(fact)
        db.commit()
        return True
    return False


# ==========================================
# 2-TIER SUMMARY BUFFER CRUD
# ==========================================
def get_or_create_summary_buffer(
    session_id: str,
    user_id: str,
    db: Session
) -> ChatSummaryBuffer:
    """Retrieve existing summary buffer or initialize an empty buffer for the session."""
    buffer = db.query(ChatSummaryBuffer).filter(
        ChatSummaryBuffer.session_id == session_id
    ).first()

    if not buffer:
        buffer = ChatSummaryBuffer(
            session_id=session_id,
            user_id=user_id,
            macro_summary="",
            micro_summary="",
            message_count=0,
            size_bytes=0,
            created_at=get_utc_now(),
            updated_at=get_utc_now(),
        )
        db.add(buffer)
        db.commit()
        db.refresh(buffer)

    return buffer


def update_summary_buffer(
    session_id: str,
    user_id: str,
    macro_summary: str,
    micro_summary: str,
    message_count: int,
    last_summarized_message_id: Optional[str],
    db: Session,
) -> ChatSummaryBuffer:
    """Update rolling macro and micro summaries with recalculation of storage bytes."""
    buffer = get_or_create_summary_buffer(session_id, user_id, db)

    buffer.macro_summary = macro_summary or ""
    buffer.micro_summary = micro_summary or ""
    buffer.message_count = message_count
    buffer.last_summarized_message_id = last_summarized_message_id
    buffer.size_bytes = calculate_string_bytes(buffer.macro_summary) + calculate_string_bytes(buffer.micro_summary)
    buffer.updated_at = get_utc_now()

    db.commit()
    db.refresh(buffer)
    return buffer
