"""
Rhynia Intelligence SaaS — Core Chat & Streaming Inference Router
"""

import asyncio
import base64
import json
import logging
import re
import zipfile
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
import pypdf
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from services.rhynia_saas.backend.auth import get_current_user
from services.rhynia_saas.backend.config import settings
from services.rhynia_saas.backend.database import ChatMessage, ChatSession, User, UserFile, get_db
from services.rhynia_saas.backend.llm_engine import RHYNIA_SYSTEM_PROMPT, llm_engine
from services.rhynia_saas.backend.services.educational_synthesis import educational_synthesis_engine
from services.rhynia_saas.backend.services.image_search import educational_image_service
from services.rhynia_saas.backend.services.search import search_service

logger = logging.getLogger("rhynia.chat")
router = APIRouter(prefix="/api/v1/chat", tags=["Chat"])


# ==========================================
# PYDANTIC SCHEMAS
# ==========================================
class ChatRequest(BaseModel):
    message: Optional[str] = Field(default="")
    session_id: Optional[str] = None
    stream: bool = True
    web_search: bool = True
    deep_reasoning: bool = False
    files: Optional[List[str]] = Field(default_factory=list)


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


def sanitize_response_images(text: str, verified_diagrams: Optional[List[Dict[str, str]]] = None) -> str:
    """
    Ensures 100% image integrity:
    1. Converts any malformed Wikimedia thumbnail URLs to canonical direct links.
    2. Intercepts hallucinated external image links (e.g. fake unsplash, pexels, imgur URLs).
    3. Replaces hallucinated images with verified images if available, or removes them.
    """
    if not text:
        return ""
    # 1. Sanitize standard upload.wikimedia.org thumb URLs
    text = re.sub(
        r"https?://upload\.wikimedia\.org/wikipedia/commons/thumb/([^/\s\)\"\']+)/([^/\s\)\"\']+)/([^/\s\)\"\']+)/[^\s\)\"\']+",
        r"https://upload.wikimedia.org/wikipedia/commons/\1/\2/\3",
        text
    )
    # 2. Sanitize thumb.wikimedia.org URLs
    text = re.sub(
        r"https?://thumb\.wikimedia\.org/wikipedia/commons/thumb/([^/\s\)\"\']+)/([^/\s\)\"\']+)/([^/\s\)\"\']+)/[^\s\)\"\']+",
        r"https://upload.wikimedia.org/wikipedia/commons/\1/\2/\3",
        text
    )

    # 3. Intercept hallucinated non-verified image tags
    verified_urls = {v.get("url", "") for v in (verified_diagrams or [])}

    def _clean_img_match(match):
        caption = match.group(1)
        url = match.group(2)
        if "wikimedia.org" in url or "wikipedia.org" in url or "/api/v1/proxy-image" in url or "pinimg.com" in url:
            return match.group(0)
        # Allow any verified URL from our visual search
        if url in verified_urls:
            return match.group(0)
        if verified_diagrams:
            v = verified_diagrams[0]
            return f"![{v['title']}]({v['url']})"
        return ""

    text = re.sub(r"!\[(.*?)\]\((https?://[^\s\)]+)\)", _clean_img_match, text)
    return text


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
    # 1. Validate Message Content & Attachments
    clean_message = (req.message or "").strip()
    if not clean_message and not req.files:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Message cannot be empty or contain only whitespace.",
        )
    if not clean_message and req.files:
        clean_message = "कृपया इस संलग्न फ़ोटो/फ़ाइल का गहन और विस्तार से विश्लेषण करें, इसमें क्या-क्या जानकारी व दृश्य हैं स्पष्ट बताएं।"

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

    # 4B. Educational Diagram Retrieval Grounding (Strictly only when query has genuine visual intent)
    diagrams = []
    if not req.files and educational_image_service.is_visual_worthy_query(clean_message):
        try:
            diagrams = await educational_image_service.search_smart_diagrams(clean_message, default_limit=4)
            if diagrams:
                diagram_prompt = educational_image_service.format_diagram_context(diagrams)
                system_prompt = f"{system_prompt}\n\n{diagram_prompt}"
        except Exception as e:
            # Non-blocking: If image retrieval encounters any network hiccup, normal LLM response proceeds
            pass

    # 4C. Multimodal Attachments Processing (Photos, PDFs, Documents)
    attachments = []
    file_contexts = []
    attached_file_names = []

    if req.files:
        user_files = (
            db.query(UserFile)
            .filter(UserFile.id.in_(req.files), UserFile.user_id == current_user.id)
            .all()
        )
        for uf in user_files:
            file_path = Path(uf.file_path)
            if not file_path.exists():
                continue

            attached_file_names.append(uf.original_filename)
            mime = (uf.mime_type or "").lower()
            suffix = file_path.suffix.lower()

            try:
                # 1. Images (Multimodal Vision)
                if mime.startswith("image/") or suffix in [".jpg", ".jpeg", ".png", ".webp", ".gif"]:
                    with open(file_path, "rb") as f:
                        data_b64 = base64.b64encode(f.read()).decode("utf-8")
                    image_mime = mime if mime.startswith("image/") else "image/jpeg"
                    attachments.append({
                        "type": "image",
                        "mime_type": image_mime,
                        "data": data_b64,
                        "name": uf.original_filename,
                    })
                    file_contexts.append(f"[संलग्न फ़ोटो / Image Attachment: {uf.original_filename}]")

                # 2. PDF Documents
                elif mime == "application/pdf" or suffix == ".pdf":
                    with open(file_path, "rb") as f:
                        pdf_bytes = f.read()
                        data_b64 = base64.b64encode(pdf_bytes).decode("utf-8")
                    attachments.append({
                        "type": "pdf",
                        "mime_type": "application/pdf",
                        "data": data_b64,
                        "name": uf.original_filename,
                    })

                    # Extract text via pypdf
                    extracted_text = ""
                    try:
                        reader = pypdf.PdfReader(str(file_path))
                        pages_text = []
                        for idx, page in enumerate(reader.pages[:30]):
                            t = page.extract_text() or ""
                            if t.strip():
                                pages_text.append(f"--- पृष्ठ {idx + 1} ---\n{t.strip()}")
                        extracted_text = "\n\n".join(pages_text)
                    except Exception as pe:
                        logger.warning(f"Error reading PDF {uf.original_filename}: {pe}")

                    if extracted_text:
                        file_contexts.append(
                            f"\n=== संलग्न PDF दस्तावेज़ ({uf.original_filename}) की सामग्री ===\n"
                            f"{extracted_text[:40000]}\n"
                            f"=== दस्तावेज़ समाप्ति ==="
                        )
                    else:
                        file_contexts.append(f"[संलग्न PDF दस्तावेज़: {uf.original_filename}]")

                # 3. Word Documents (.docx)
                elif suffix == ".docx" or "wordprocessingml" in mime:
                    docx_text = ""
                    try:
                        with zipfile.ZipFile(str(file_path)) as docx_zip:
                            tree = ET.fromstring(docx_zip.read("word/document.xml"))
                            ns = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}
                            paras = []
                            for p in tree.iterfind(".//w:p", ns):
                                pieces = [node.text for node in p.iterfind(".//w:t", ns) if node.text]
                                if pieces:
                                    paras.append("".join(pieces))
                            docx_text = "\n".join(paras)
                    except Exception as de:
                        logger.warning(f"Error reading docx {uf.original_filename}: {de}")

                    if docx_text:
                        file_contexts.append(
                            f"\n=== संलग्न WORD दस्तावेज़ ({uf.original_filename}) की सामग्री ===\n"
                            f"{docx_text[:40000]}\n"
                            f"=== दस्तावेज़ समाप्ति ==="
                        )
                    else:
                        file_contexts.append(f"[संलग्न Word दस्तावेज़: {uf.original_filename}]")

                # 4. Text, Code, CSV, Markdown, JSON
                elif mime.startswith("text/") or suffix in [".txt", ".md", ".csv", ".json", ".py", ".js", ".html"]:
                    try:
                        with open(file_path, "r", encoding="utf-8", errors="replace") as f:
                            raw_text = f.read(50000)
                        file_contexts.append(
                            f"\n=== संलग्न फ़ाइल ({uf.original_filename}) की सामग्री ===\n"
                            f"{raw_text}\n"
                            f"=== फ़ाइल समाप्ति ==="
                        )
                    except Exception as te:
                        logger.warning(f"Error reading text file: {te}")
            except Exception as fe:
                logger.error(f"Error processing attachment {uf.original_filename}: {fe}")

    # Inject attachment context instructions into system prompt
    if file_contexts:
        attachments_info = (
            "\n\nUSER UPLOADED ATTACHMENT CONTEXT (उपयोगकर्ता द्वारा संलग्न फ़ोटो/फ़ाइलें):\n"
            "- The user has attached photos or documents with this message.\n"
            "- CRITICAL MULTIMODAL INSTRUCTION: Deeply examine and analyze all visual details of the attached photos (objects, diagrams, text/labels, colors, people, handwriting, charts, scenes) and the extracted contents of any documents.\n"
            "- Answer the user's inquiry thoroughly and accurately grounded in the visual/textual details of these attachments.\n"
            + "\n".join(file_contexts)
        )
        system_prompt = f"{system_prompt}\n{attachments_info}"

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

    # Augment last message with extracted textual contexts if present
    if file_contexts and messages_payload:
        last_turn = messages_payload[-1]
        if last_turn.get("role") == "user":
            doc_context_text = "\n\n".join(file_contexts)
            last_turn["content"] = f"{clean_message}\n\n【संलग्न दस्तावेज़/फ़ोटो विवरण】:\n{doc_context_text}"

    # 7. Non-Streaming JSON Fallback
    if not req.stream:
        reply_content, model_used, tokens_used = await llm_engine.generate_response(
            messages_payload, system_prompt=system_prompt, web_search=use_web_search, attachments=attachments
        )

        # Fallback ONLY if reply is completely empty (zero text from online providers)
        if not reply_content.strip():
            synth = educational_synthesis_engine.synthesize_topic(clean_message) or educational_synthesis_engine.generate_generic_educational(clean_message)
            reply_content = synth

        # Clean any malformed /thumb/ URLs and sanitize images if any were included
        reply_content = sanitize_response_images(reply_content, diagrams)

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
                messages_payload, system_prompt=system_prompt, web_search=use_web_search, attachments=attachments
            ):
                collected_reply.append(token)
                token_event = json.dumps({"type": "token", "content": token})
                yield f"data: {token_event}\n\n"

            # Save completed reply
            full_reply = "".join(collected_reply)

            # Fallback ONLY if stream produced completely empty reply (offline/error)
            if not full_reply.strip():
                synth = educational_synthesis_engine.synthesize_topic(clean_message) or educational_synthesis_engine.generate_generic_educational(clean_message)
                for word in synth.split(" "):
                    token_event = json.dumps({"type": "token", "content": word + " "})
                    yield f"data: {token_event}\n\n"
                    full_reply += word + " "
                    await asyncio.sleep(0.01)

            # Clean any malformed /thumb/ URLs and sanitize images in final persisted reply
            full_reply = sanitize_response_images(full_reply, diagrams)

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
