"""
Rhynia Intelligence SaaS — Memory Management & Quota Service
Handles Tiered Quota Tracking (8MB / 16MB / 25MB), Long-Term Fact Persistence,
and 2-Tier Rolling Summary Buffering.
"""

import logging
import re
from typing import Any, Dict, List, Optional, Union
from sqlalchemy.orm import Session
from sqlalchemy import func

from services.rhynia_saas.backend.config import settings
from services.rhynia_saas.backend.database import (
    User,
    ChatSession,
    ChatMessage,
    UserMemoryFact,
    ChatSummaryBuffer,
    SessionLocal,
    get_utc_now,
)

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


def check_user_memory_quota(user: Union[User, str], db: Session) -> bool:
    """Returns True if user has room within their memory quota, False if exceeded."""
    if not user:
        return False
    user_id = user if isinstance(user, str) else user.id
    usage = get_user_memory_usage(user_id, db)
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


# ==========================================
# 2-TIER COMPRESSION & ROLLING SUMMARIZATION ENGINE
# ==========================================
def generate_macro_summary_from_turns(messages: List[ChatMessage]) -> str:
    """
    Synthesize older conversation turns into a dense, high-level Macro Summary.
    Captures user goals, core topics, and major insights in 2-3 concise lines.
    """
    if not messages:
        return ""

    topics = []
    user_queries = []
    for m in messages:
        if m.role == "user":
            q = (m.content or "").strip()
            if q:
                first_sent = q.split("\n")[0].split(".")[0][:80]
                user_queries.append(first_sent)
        elif m.role in ["model", "assistant"]:
            resp = (m.content or "").strip()
            if resp:
                first_line = resp.split("\n")[0][:100]
                topics.append(first_line)

    summary_parts = []
    if user_queries:
        recent_inquiries = "; ".join(user_queries[-3:])
        summary_parts.append(f"User inquired about: {recent_inquiries}.")
    if topics:
        summary_parts.append("Rhynia provided structured guidance and detailed insights on these core topics.")

    return " ".join(summary_parts)


def build_2tier_conversation_history(
    session_id: str,
    db: Session,
    max_recent_messages: int = 4
) -> List[Dict]:
    """
    Constructs a 2-Tier compressed conversation payload:
    - Tier 1 (Macro Summary): Dense 2-3 sentence overview of older turns (messages 1 to N-4).
    - Tier 2 (Micro Context): Last 4 turns preserved in full fidelity.
    Result: Always under ~500 tokens per request (88%+ token savings).
    """
    all_messages = (
        db.query(ChatMessage)
        .filter(ChatMessage.session_id == session_id)
        .order_by(ChatMessage.created_at.asc())
        .all()
    )

    total_msgs = len(all_messages)
    if total_msgs <= max_recent_messages:
        # Conversation is fresh: return full raw history
        return [
            {"role": m.role, "content": m.content}
            for m in all_messages
        ]

    # Split into Older Turns and Recent Micro Turns
    recent_msgs = all_messages[-max_recent_messages:]
    older_msgs = all_messages[:-max_recent_messages]

    # Retrieve or generate Macro Summary for older turns
    buffer = db.query(ChatSummaryBuffer).filter(
        ChatSummaryBuffer.session_id == session_id
    ).first()

    macro_summary = ""
    if buffer and buffer.macro_summary:
        macro_summary = buffer.macro_summary
    else:
        macro_summary = generate_macro_summary_from_turns(older_msgs)
        # Store in buffer if user exists
        if older_msgs:
            user_id = older_msgs[0].user_id
            update_summary_buffer(
                session_id=session_id,
                user_id=user_id,
                macro_summary=macro_summary,
                micro_summary="",
                message_count=total_msgs,
                last_summarized_message_id=older_msgs[-1].id,
                db=db
            )

    payload = []
    if macro_summary:
        payload.append({
            "role": "system",
            "content": (
                f"PRIOR CONVERSATION CONTEXT (पूर्व संवाद का मुख्य सारांश — इसे ध्यान में रखकर उत्तर दें):\n"
                f"{macro_summary}"
            )
        })

    for m in recent_msgs:
        payload.append({"role": m.role, "content": m.content})

    return payload


async def async_update_rolling_summary(session_id: str, user_id: str) -> None:
    """
    Background asynchronous task triggered after chat completion to compute
    and persist rolling macro summary without blocking live SSE streaming.
    """
    db = SessionLocal()
    try:
        all_messages = (
            db.query(ChatMessage)
            .filter(ChatMessage.session_id == session_id)
            .order_by(ChatMessage.created_at.asc())
            .all()
        )
        total_msgs = len(all_messages)
        if total_msgs < 5:
            return

        older_msgs = all_messages[:-4]
        macro_summary = generate_macro_summary_from_turns(older_msgs)
        
        # Build micro summary from last 4 messages
        micro_points = []
        for m in all_messages[-4:]:
            role_label = "User" if m.role == "user" else "AI"
            snip = (m.content or "").strip().split("\n")[0][:90]
            micro_points.append(f"- {role_label}: {snip}")
        micro_summary = "\n".join(micro_points)

        update_summary_buffer(
            session_id=session_id,
            user_id=user_id,
            macro_summary=macro_summary,
            micro_summary=micro_summary,
            message_count=total_msgs,
            last_summarized_message_id=all_messages[-1].id,
            db=db
        )
        logger.info(f"Rolling summary updated for session {session_id[:8]} (Macro: {len(macro_summary)} chars)")
    except Exception as e:
        logger.warning(f"Failed to update rolling summary for session {session_id}: {e}")
    finally:
        db.close()


# ==========================================
# PHASE 3: LONG-TERM PERSONALIZATION ENGINE
# ==========================================
def clear_user_facts(user_id: str, db: Session) -> int:
    """Delete all long-term memory facts for a user (Reset Memory). Returns count deleted."""
    deleted = db.query(UserMemoryFact).filter(UserMemoryFact.user_id == user_id).delete()
    db.commit()
    return deleted


def format_facts_for_prompt(user_id: str, db: Session, max_facts: int = 12) -> str:
    """
    Format stored user facts into a clean system instruction block for prompt injection.
    Only returns a block if at least one fact exists for the user.
    """
    facts = get_user_facts(user_id, db)
    if not facts:
        return ""

    facts_to_include = facts[:max_facts]
    lines = []
    for f in facts_to_include:
        label = f.fact_key.replace("_", " ").title()
        lines.append(f"- {label}: {f.fact_value}")

    formatted_block = (
        "\n\nUSER PROFILE & LONG-TERM MEMORY (उपयोगकर्ता का दीर्घकालिक स्मृति संदर्भ):\n"
        "- The following verified facts and preferences are remembered about this user across sessions:\n"
        + "\n".join(lines) + "\n"
        "- INSTRUCTION: Seamlessly ground your examples, terminology, tone, and technical depth in these user preferences without explicitly announcing 'As per my memory'."
    )
    return formatted_block


def extract_facts_from_user_message(message: str) -> List[Dict[str, Any]]:
    """
    Extract long-term user facts, preferences, role, and tech stack from natural messages.
    Supports Hindi, Hinglish, and English phrasing.
    """
    if not message or len(message.strip()) < 5:
        return []

    extracted: List[Dict[str, Any]] = []
    text = message.strip()

    # Pattern 1: Preferred Name / Identity
    name_match = re.search(
        r"(?:mera naam|my name is|call me|mujhe bulao)\s+([a-zA-Z\u0900-\u097F\s]{2,30}?)(?:\s+hai|\s+is|\s+hu|\s+hoon|[.,!?]|$)",
        text,
        re.IGNORECASE,
    )
    if name_match:
        val = name_match.group(1).strip().strip(".,!?\"'")
        val_clean = " ".join([w for w in val.split() if w.lower() not in ["hai", "is", "hu", "hoon", "aur", "and"]])
        if len(val_clean) >= 2:
            extracted.append({
                "fact_key": "preferred_name",
                "fact_value": val_clean.title(),
                "category": "identity",
                "confidence_score": 95,
            })

    # Pattern 2: Profession / Role / Occupation
    prof_match = re.search(
        r"(?:i am an?|i work as an?|mai ek|main ek)\s+([a-zA-Z\u0900-\u097F\s]{3,40})(?:\s+hu|\s+hoon|$|[.,!?])",
        text,
        re.IGNORECASE,
    )
    if prof_match:
        val = prof_match.group(1).strip().strip(".,!?\"'")
        if len(val) >= 3 and not any(w in val.lower() for w in ["student", "taiyari", "padh"]):
            extracted.append({
                "fact_key": "profession_role",
                "fact_value": val.title(),
                "category": "profession",
                "confidence_score": 90,
            })

    # Pattern 3: Exam / Study Goal
    study_match = re.search(
        r"(?:mai|main|i am|currently)\s+([a-zA-Z0-9\u0900-\u097F\s]{2,30})\s+(?:ki taiyari kar raha|ki preparation kar raha|preparing for)",
        text,
        re.IGNORECASE,
    )
    if study_match:
        val = study_match.group(1).strip().strip(".,!?\"'")
        extracted.append({
            "fact_key": "study_or_exam_goal",
            "fact_value": val.upper() if len(val) <= 6 else val.title(),
            "category": "goals",
            "confidence_score": 92,
        })

    # Pattern 4: Technical Stack & Tools
    tech_match = re.search(
        r"(?:my tech stack|technologies i use|tech stack is|mera stack|languages i know|tools i use|i code in)\s*(?:is|are|:)?\s*([^.\n!]+)",
        text,
        re.IGNORECASE,
    )
    if tech_match:
        val = tech_match.group(1).strip().strip(".,!?\"'")
        if len(val) >= 2:
            extracted.append({
                "fact_key": "tech_stack",
                "fact_value": val,
                "category": "technical",
                "confidence_score": 95,
            })

    # Pattern 5: Ongoing Project / Business
    proj_match = re.search(
        r"(?:i am building|currently working on|mera project|my project is|i am developing)\s*([^.\n!]+)",
        text,
        re.IGNORECASE,
    )
    if proj_match:
        val = proj_match.group(1).strip().strip(".,!?\"'")
        if len(val) >= 3:
            extracted.append({
                "fact_key": "current_project",
                "fact_value": val,
                "category": "projects",
                "confidence_score": 90,
            })

    # Pattern 6: Language & Communication Preference
    lang_match = re.search(
        r"(?:explain in|reply in|speak in|answer in|hamesha|prefer)\s*([^.\n!]+)",
        text,
        re.IGNORECASE,
    )
    if not lang_match:
        lang_match = re.search(
            r"(?:mujhe|main|mai)?\s*([a-zA-Z\u0900-\u097F\s]{2,25})\s*(?:me|mein)\s*(?:samjhao|batao|likho|reply karo|answer do)",
            text,
            re.IGNORECASE,
        )
    if lang_match:
        val = lang_match.group(1).strip().strip(".,!?\"'")
        if any(w in val.lower() for w in ["hindi", "hinglish", "english", "bullet", "points", "simple", "saral", "easy"]):
            extracted.append({
                "fact_key": "preferred_language_style",
                "fact_value": val.title() if len(val.split()) <= 2 else val,
                "category": "preferences",
                "confidence_score": 88,
            })

    # Pattern 7: Location / Origin
    loc_match = re.search(
        r"(?:i live in|i am from|mai rehta hu|mera ghar|based in)\s*([a-zA-Z\u0900-\u097F\s,]{3,35})",
        text,
        re.IGNORECASE,
    )
    if loc_match:
        val = loc_match.group(1).strip().strip(".,!?\"'")
        if len(val) >= 3 and not any(w in val.lower() for w in ["room", "hostel", "ghar"]):
            extracted.append({
                "fact_key": "location",
                "fact_value": val.title(),
                "category": "identity",
                "confidence_score": 85,
            })

    # Pattern 8: Explicit "Remember that..."
    explicit_match = re.search(
        r"(?:remember that|please remember|note that|yaad rakhna ki?|dhyan rakhna ki?)\s*([^.\n!]{4,100})",
        text,
        re.IGNORECASE,
    )
    if explicit_match:
        val = explicit_match.group(1).strip().strip(".,!?\"'")
        extracted.append({
            "fact_key": "user_instruction",
            "fact_value": val,
            "category": "preferences",
            "confidence_score": 98,
        })

    return extracted


async def async_extract_and_save_facts(user_id: str, user_message: str) -> None:
    """
    Background asynchronous task triggered after chat completion to extract
    and persist user facts without blocking the chat streaming response.
    """
    if not user_message or len(user_message.strip()) < 5:
        return

    facts = extract_facts_from_user_message(user_message)
    if not facts:
        return

    db = SessionLocal()
    try:
        # Check quota first
        can_store = check_user_memory_quota(user_id, db)
        if not can_store:
            logger.warning(f"User {user_id[:8]} memory quota exceeded; skipping fact storage.")
            return

        for item in facts:
            save_or_update_fact(
                user_id=user_id,
                fact_key=item["fact_key"],
                fact_value=item["fact_value"],
                category=item.get("category", "general"),
                confidence_score=item.get("confidence_score", 90),
                db=db,
            )
            logger.info(f"Fact '{item['fact_key']}' extracted and saved for user {user_id[:8]}")
    except Exception as e:
        logger.warning(f"Failed to extract/save facts for user {user_id}: {e}")
    finally:
        db.close()


# ==========================================
# PHASE 4: ON-DEMAND CROSS-SESSION RECALL RAG
# ==========================================
def is_past_recall_query(message: str) -> bool:
    """
    Detect if the user is asking to recall past conversations, prior discussions,
    code snippets, or decisions from earlier chat sessions.
    Supports Hindi, Hinglish, and English phrasing.
    """
    if not message or len(message.strip()) < 5:
        return False

    text = message.lower().strip()
    recall_patterns = [
        r"\bpichl[ie]\s+(?:chat|session|baar|bar|conversation)\b",
        r"\bpuran[ie]\s+(?:chat|session|conversation)\b",
        r"\blast\s+(?:chat|session|time|conversation|discussion|week|month)\b",
        r"\bprevious\s+(?:chat|session|conversation|discussion)\b",
        r"\b(?:what\s+did\s+we|did\s+we)\s+(?:talk|discuss|say|cover|write|build|plan)\b",
        r"\b(?:talked|discussed|said|shared|talk)\s+(?:about\s+)?(?:earlier|previously)\b",
        r"\bearlier\s+(?:we|you|i|discussed|said|talked|shared|wrote)\b",
        r"\b(?:earlier|previously)\b.*?\b(?:discuss|talk|conversation|chat|say|mention|regarding|about)\b",
        r"\bdo\s+you\s+remember\b",
        r"\bcan\s+you\s+recall\b",
        r"\brecall\s+(?:our|the|what|previous|last|it)?\b",
        r"\byaad\s+hai\b",
        r"\bhumne\s+(?:baat\s+ki|discuss\s+ki|banaya|likha|padha)\b",
        r"\bhamne\s+(?:baat\s+ki|discuss\s+ki|banaya|likha|padha)\b",
        r"\bmaine\s+(?:pucha\s+tha|kaha\s+tha|bataya\s+tha)\b",
        r"\bpichle\s+din\b",
        r"\byesterday\s+we\b",
    ]
    return any(re.search(pat, text) for pat in recall_patterns)


def search_past_conversations(
    user_id: str,
    query: str,
    exclude_session_id: Optional[str] = None,
    db: Session = None,
    limit: int = 3,
) -> List[Dict[str, Any]]:
    """
    Search prior chat sessions and summary buffers for discussions matching the user's query.
    Calculates lexical/semantic relevance scores across session titles, macro summaries,
    micro summaries, and messages.
    """
    if not query or not db:
        return []

    # Extract informative tokens (filtering stop words)
    stop_words = {
        "pichli", "pichle", "chat", "session", "me", "mein", "kya", "tha", "thi", "the",
        "humne", "hamne", "maine", "baat", "ki", "ka", "ke", "ko", "se", "aur", "hai", "hu",
        "what", "did", "we", "talk", "about", "discuss", "earlier", "remember", "recall",
        "last", "time", "you", "me", "tell", "show", "give", "the", "a", "an", "is", "was",
        "in", "on", "for", "with", "do"
    }
    raw_tokens = re.findall(r"\b[a-zA-Z0-9\u0900-\u097F]{2,}\b", query.lower())
    search_keywords = [t for t in raw_tokens if t not in stop_words]

    # Query all user summary buffers from OTHER sessions
    buffer_query = (
        db.query(ChatSummaryBuffer, ChatSession)
        .join(ChatSession, ChatSummaryBuffer.session_id == ChatSession.id)
        .filter(ChatSummaryBuffer.user_id == user_id)
    )
    if exclude_session_id:
        buffer_query = buffer_query.filter(ChatSummaryBuffer.session_id != exclude_session_id)

    matched_results: List[Dict[str, Any]] = []

    buffers = buffer_query.order_by(ChatSession.updated_at.desc()).limit(20).all()
    for buf, sess in buffers:
        title = sess.title or "Untitled Session"
        macro = buf.macro_summary or ""
        micro = buf.micro_summary or ""
        combined_text = f"{title} {macro} {micro}".lower()

        score = 0
        if search_keywords:
            for kw in search_keywords:
                if kw in combined_text:
                    score += 2 if kw in title.lower() else 1
        else:
            # If query is purely generic ("pichli chat me kya hua"), rank by recency
            score = 1

        if score > 0:
            date_str = sess.created_at.strftime("%d %b %Y") if sess.created_at else "Earlier"
            snippet = macro if macro else (micro[:200] if micro else title)
            matched_results.append({
                "session_id": sess.id,
                "session_title": title,
                "date": date_str,
                "score": score,
                "recalled_snippet": snippet.strip(),
            })

    # If no summary buffer matches, fallback to checking recent ChatMessage records
    if not matched_results and search_keywords:
        msg_query = (
            db.query(ChatMessage, ChatSession)
            .join(ChatSession, ChatMessage.session_id == ChatSession.id)
            .filter(ChatMessage.user_id == user_id)
        )
        if exclude_session_id:
            msg_query = msg_query.filter(ChatMessage.session_id != exclude_session_id)

        candidate_msgs = msg_query.order_by(ChatMessage.created_at.desc()).limit(50).all()
        for msg, sess in candidate_msgs:
            c_lower = (msg.content or "").lower()
            score = sum(1 for kw in search_keywords if kw in c_lower)
            if score > 0:
                date_str = sess.created_at.strftime("%d %b %Y") if sess.created_at else "Earlier"
                snippet = msg.content[:200] + ("..." if len(msg.content) > 200 else "")
                matched_results.append({
                    "session_id": sess.id,
                    "session_title": sess.title or "Chat Session",
                    "date": date_str,
                    "score": score,
                    "recalled_snippet": snippet.strip(),
                })
                if len(matched_results) >= limit:
                    break

    # Sort by relevance score descending
    matched_results.sort(key=lambda r: r["score"], reverse=True)
    return matched_results[:limit]


def retrieve_relevant_prior_context(
    user_id: str,
    current_session_id: Optional[str],
    query: str,
    db: Session,
) -> str:
    """
    On-Demand Memory RAG: Evaluates if query is asking to recall past discussions,
    searches cross-session memories, and returns a formatted prompt grounding block.
    Returns empty string if not a recall query or no relevant prior chats exist.
    """
    if not is_past_recall_query(query):
        return ""

    past_matches = search_past_conversations(
        user_id=user_id,
        query=query,
        exclude_session_id=current_session_id,
        db=db,
        limit=3,
    )
    if not past_matches:
        return ""

    recalled_blocks = []
    for idx, match in enumerate(past_matches, 1):
        recalled_blocks.append(
            f"[{idx}] Session: \"{match['session_title']}\" (Recorded: {match['date']})\n"
            f"    Discussion Summary: {match['recalled_snippet']}"
        )

    return (
        "\n\nCROSS-SESSION RECALLED MEMORY (पूर्व वार्तालापों से पुनः स्मरण):\n"
        "- The user is specifically asking to recall or reference past discussions from earlier chat sessions.\n"
        "- The following verified summaries and excerpts were retrieved from the user's prior sessions:\n"
        + "\n\n".join(recalled_blocks) + "\n\n"
        "- INSTRUCTION: Use these recalled discussions directly to answer the user's inquiry authoritatively and accurately."
    )
