"""
Rhynia Intelligence SaaS — Core Chat & Streaming Inference Router
"""

import asyncio
import json
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from services.rhynia_saas.backend.auth import get_current_user
from services.rhynia_saas.backend.config import settings
from services.rhynia_saas.backend.database import ChatMessage, ChatSession, User, get_db
from services.rhynia_saas.backend.llm_engine import RHYNIA_SYSTEM_PROMPT, llm_engine
from services.rhynia_saas.backend.services.educational_synthesis import educational_synthesis_engine
from services.rhynia_saas.backend.services.image_search import educational_image_service
from services.rhynia_saas.backend.services.search import search_service

router = APIRouter(prefix="/api/v1/chat", tags=["Chat"])


# ==========================================
# PYDANTIC SCHEMAS
# ==========================================
class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1)
    session_id: Optional[str] = None
    stream: bool = True
    web_search: bool = True
    deep_reasoning: bool = False


class ChatResponseJSON(BaseModel):
    session_id: str
    message_id: str
    reply: str
    model_used: str
    tokens_used: int
    daily_messages_used: int
    daily_messages_remaining: int


# ==========================================
# QUOTA & RESET ENFORCEMENT
# ==========================================
def enforce_daily_quota(user: User, db: Session) -> int:
    """Check and enforce 3-Tier Daily Message Limits with auto-reset on new UTC day."""
    now = datetime.now(timezone.utc)
    last_date = user.last_active_date

    # Reset counter if last active was on a prior date
    if last_date and last_date.date() < now.date():
        user.daily_messages_used = 0
        user.last_active_date = now
        db.commit()

    # Determine daily limit based on plan
    if user.plan_tier == "ultra_pro":
        limit = settings.ULTRA_PRO_DAILY_MESSAGE_LIMIT
    elif user.plan_tier == "pro":
        limit = settings.PRO_TIER_DAILY_MESSAGE_LIMIT
    else:
        limit = settings.FREE_TIER_DAILY_MESSAGE_LIMIT

    if user.daily_messages_used >= limit:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=(
                f"Daily limit of {limit} messages reached for your {user.plan_tier.upper()} plan. "
                "Upgrade your plan or activate a 24-hr Pass to continue uninterrupted."
            ),
        )

    return limit


# ==========================================
# POST /api/v1/chat (STREAMING & JSON)
# ==========================================
@router.post("")
async def send_chat_message(
    req: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Send a message to Rhynia Intelligence with streaming token response (SSE).
    Enforces Plan limits, persists message history, and grounds with search if requested.
    """
    # 1. Validate Message Content
    clean_message = req.message.strip()
    if not clean_message:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Message cannot be empty or contain only whitespace.",
        )

    # 2. Enforce Plan Limits
    limit = enforce_daily_quota(current_user, db)

    # 2. Check Deep Reasoning Plan Gate
    if req.deep_reasoning and current_user.plan_tier == "free":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Deep Reasoning mode is available on Rhynia Pro and Ultra Pro plans.",
        )

    # 3. Resolve or Create Session
    session_id = req.session_id
    if session_id:
        session = (
            db.query(ChatSession)
            .filter(ChatSession.id == session_id, ChatSession.user_id == current_user.id)
            .first()
        )
        if not session:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found.")
    else:
        title_snippet = clean_message[:35] + ("..." if len(clean_message) > 35 else "")
        session = ChatSession(user_id=current_user.id, title=title_snippet)
        db.add(session)
        db.commit()
        db.refresh(session)
        session_id = session.id

    # 4. Direct Real-Time Live Web Search Grounding (Directly Active By Default)
    use_web_search = True

    system_prompt = (
        f"{RHYNIA_SYSTEM_PROMPT}\n\n"
        f"DIRECT REAL-TIME LIVE INTERNET SEARCH ACTIVE (प्रत्यक्ष लाइव इंटरनेट सर्च सक्रिय):\n"
        f"- Direct real-time live internet web search is permanently enabled by default for all user queries.\n"
        f"- Directly search and ground responses using the latest internet facts, real-time news, official websites, and live data.\n"
        f"- COMPACT SOURCE LINKS: ALWAYS provide clean markdown links `[Source Name](url)` or `[domain.com](url)` (e.g. `[timesofindia.com](https://...)`, `[NDTV](https://...)`, `[Wikipedia](https://...)`). Embed them inline or list them cleanly under '❖ **स्रोतः**' with `✔ [Source Name](url)` so the UI renders them as compact blue source pills.\n"
        f"- Keep link labels short and concise.\n"
        f"- You CAN search the public web, live news, public YouTube videos/channels, and public Twitter/X trends.\n"
        f"- Remind users politely that private/login-protected social media accounts (personal Instagram DMs, private Facebook profiles) cannot be accessed due to platform privacy barriers."
    )

    # 4B. Educational Diagram Retrieval Grounding (Automatic visual enrichment up to 5-6 diagrams)
    diagrams = []
    try:
        diagrams = await educational_image_service.search_smart_diagrams(clean_message, default_limit=5)
        if diagrams:
            diagram_prompt = educational_image_service.format_diagram_context(diagrams)
            system_prompt = f"{system_prompt}\n\n{diagram_prompt}"
    except Exception as e:
        # Non-blocking: If image retrieval encounters any network hiccup, normal LLM response proceeds
        pass

    # 5. Persist User Message
    user_msg = ChatMessage(
        session_id=session_id,
        user_id=current_user.id,
        role="user",
        content=clean_message,
        token_count=max(1, len(clean_message) // 4),
    )
    db.add(user_msg)
    db.commit()

    # 6. Load Conversation History (Last 10 turns)
    history_records = (
        db.query(ChatMessage)
        .filter(ChatMessage.session_id == session_id)
        .order_by(ChatMessage.created_at.asc())
        .limit(20)
        .all()
    )
    messages_payload = [{"role": m.role, "content": m.content} for m in history_records]

    # 7. Non-Streaming JSON Fallback
    if not req.stream:
        reply_content, model_used, tokens_used = await llm_engine.generate_response(
            messages_payload, system_prompt=system_prompt, web_search=use_web_search
        )

        # Double Guarantee: If reply_content has almost no text (< 50 chars), synthesize educational text!
        if len(reply_content.strip()) < 50:
            synth = educational_synthesis_engine.synthesize_topic(clean_message) or educational_synthesis_engine.generate_generic_educational(clean_message)
            reply_content = synth

        # Seamless Visual Guarantee: Ensure verified educational diagrams appear in answer
        if diagrams and "![" not in reply_content:
            img_block = "\n\n" + "\n".join([f"![{d['title']}]({d['url']})" for d in diagrams]) + "\n\n"
            if "\n\n" in reply_content:
                parts = reply_content.split("\n\n", 1)
                reply_content = parts[0] + img_block + parts[1]
            else:
                reply_content = reply_content + img_block

        # Persist Rhynia reply
        rhynia_msg = ChatMessage(
            session_id=session_id,
            user_id=current_user.id,
            role="model",
            content=reply_content,
            model_used=model_used,
            token_count=tokens_used,
        )
        db.add(rhynia_msg)
        current_user.daily_messages_used += 1
        current_user.last_active_date = datetime.now(timezone.utc)
        session.updated_at = datetime.now(timezone.utc)
        db.commit()

        remaining = max(0, limit - current_user.daily_messages_used)
        return ChatResponseJSON(
            session_id=session_id,
            message_id=rhynia_msg.id,
            reply=reply_content,
            model_used=model_used,
            tokens_used=tokens_used,
            daily_messages_used=current_user.daily_messages_used,
            daily_messages_remaining=remaining,
        )

    # 8. Streaming Response (Server-Sent Events)
    async def event_generator():
        collected_reply = []
        try:
            # First event: session metadata
            init_event = json.dumps({"type": "init", "session_id": session_id})
            yield f"data: {init_event}\n\n"

            # Stream tokens
            async for token in llm_engine.generate_stream(
                messages_payload, system_prompt=system_prompt, web_search=use_web_search
            ):
                collected_reply.append(token)
                token_event = json.dumps({"type": "token", "content": token})
                yield f"data: {token_event}\n\n"

            # Save completed reply
            full_reply = "".join(collected_reply)

            # Double Guarantee: If full_reply has almost no text (< 50 chars), stream rich educational text first!
            if len(full_reply.strip()) < 50:
                synth = educational_synthesis_engine.synthesize_topic(clean_message) or educational_synthesis_engine.generate_generic_educational(clean_message)
                for word in synth.split(" "):
                    token_event = json.dumps({"type": "token", "content": word + " "})
                    yield f"data: {token_event}\n\n"
                    full_reply += word + " "
                    await asyncio.sleep(0.01)

            # Seamless Visual Guarantee: If diagrams found but LLM omitted image tags, stream them cleanly
            if diagrams and "![" not in full_reply:
                img_block = "\n\n" + "\n".join([f"![{d['title']}]({d['url']})" for d in diagrams]) + "\n\n"
                token_event = json.dumps({"type": "token", "content": img_block})
                yield f"data: {token_event}\n\n"
                full_reply += img_block

            rhynia_msg = ChatMessage(
                session_id=session_id,
                user_id=current_user.id,
                role="model",
                content=full_reply,
                model_used="Rhynia Core",
                token_count=max(1, len(full_reply) // 4),
            )
            db.add(rhynia_msg)
            current_user.daily_messages_used += 1
            current_user.last_active_date = datetime.now(timezone.utc)
            session.updated_at = datetime.now(timezone.utc)
            db.commit()

            # Final event: completion metadata
            remaining = max(0, limit - current_user.daily_messages_used)
            done_event = json.dumps({
                "type": "done",
                "message_id": rhynia_msg.id,
                "daily_messages_used": current_user.daily_messages_used,
                "daily_messages_remaining": remaining,
            })
            yield f"data: {done_event}\n\n"

        except Exception as err:
            err_event = json.dumps({"type": "error", "message": "An error occurred during inference."})
            yield f"data: {err_event}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")
