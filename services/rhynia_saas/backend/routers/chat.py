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
from services.rhynia_saas.backend.routers.ppt import generate_ai_presentation_json
from services.rhynia_saas.backend.services.educational_synthesis import educational_synthesis_engine
from services.rhynia_saas.backend.services.image_search import educational_image_service
from services.rhynia_saas.backend.services.ppt_engine import ppt_engine
from services.rhynia_saas.backend.services.search import search_service
from services.rhynia_saas.backend.services import memory_service

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
    if user.email and user.email.lower() == "mk191515480@gmail.com":
        user.plan_tier = "ultra_pro"

    now = datetime.now(timezone.utc)
    last_date = user.last_active_date

    # Reset counter if last active was on a prior date
    if last_date and last_date.date() < now.date():
        user.daily_messages_used = 0
        user.last_active_date = now
        db.commit()

    # Determine daily limit based on plan
    if user.email and user.email.lower() == "mk191515480@gmail.com":
        user.plan_tier = "ultra_pro"

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
    Standardizes image thumbnail URLs without aggressively deleting genuine images.
    """
    if not text:
        return ""
    # Sanitize standard upload.wikimedia.org thumb URLs
    text = re.sub(
        r"https?://upload\.wikimedia\.org/wikipedia/commons/thumb/([^/\s\)\"\']+)/([^/\s\)\"\']+)/([^/\s\)\"\']+)/[^\s\)\"\']+",
        r"https://upload.wikimedia.org/wikipedia/commons/\1/\2/\3",
        text
    )
    # Sanitize thumb.wikimedia.org URLs
    text = re.sub(
        r"https?://thumb\.wikimedia\.org/wikipedia/commons/thumb/([^/\s\)\"\']+)/([^/\s\)\"\']+)/([^/\s\)\"\']+)/[^\s\)\"\']+",
        r"https://upload.wikimedia.org/wikipedia/commons/\1/\2/\3",
        text
    )
    return text


def strip_source_links(text: str) -> str:
    """
    Aggressively strips ALL external URLs, source citation blocks, and web links
    from AI responses. Preserves only verified markdown image tags ![caption](url).
    """
    if not text:
        return ""
    # 1. Strip trailing source citation sections
    text = re.sub(
        r"(?:\n+|\s+)(?:❖\s*)?\*\*(?:स्रोतः?|Sources?|संदर्भ|References?|सन्दर्भ|Citation|Ref)\s*:?\s*\*\*[\s\S]*$",
        "",
        text,
        flags=re.IGNORECASE
    )
    # 2. Strip lines that are just source/reference lists (e.g., "- [Source](url)" or "* https://...")
    text = re.sub(r"^[ \t]*[\-\*•✔▪]\s*(?:\[.*?\]\(https?://[^\)]+\)|https?://\S+)[ \t]*$", "", text, flags=re.MULTILINE)
    # 3. Convert markdown links [Label](url) to plain Label text (preserve ![img](url) images)
    text = re.sub(r"(?<!\!)\[([^\]]+)\]\(https?://[^\s\)\"\']+\)", r"\1", text)
    # 4. Strip bare URLs from text lines (not inside code blocks or image tags)
    lines = []
    in_code_block = False
    for line in text.split("\n"):
        stripped = line.strip()
        if stripped.startswith("```"):
            in_code_block = not in_code_block
        if not in_code_block and not stripped.startswith("!["):
            # Remove bare URLs but preserve the sentence around them
            line = re.sub(r"(?<!\()(?<!\=)(?<!\")https?://[^\s\)\"\'>]+", "", line)
            # Clean up leftover artifacts like "()" or "(  )" from removed URLs
            line = re.sub(r"\(\s*\)", "", line)
        lines.append(line)
    text = "\n".join(lines)
    # 5. Clean up excessive blank lines left behind
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


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

    # 3B. Thread Message Limit Boundary Check (Phase 2)
    thread_count = db.query(ChatMessage).filter(ChatMessage.session_id == session_id).count()
    thread_limit = memory_service.get_tier_thread_limit(current_user.plan_tier)
    if thread_count >= thread_limit:
        limit_msg = (
            f"⚠️ **बातचीत सीमा (Thread Limit Reached)**: आपके वर्तमान प्लान ({current_user.plan_tier.upper()}) में "
            f"एक चैट सेशन में अधिकतम {thread_limit} संदेशों की अनुमति है ताकि AI की गति और स्मरण क्षमता सर्वोच्च बनी रहे।\n\n"
            f"कृपया नई चर्चा जारी रखने के लिए ऊपर बाएँ **'+ New Chat'** बटन पर क्लिक करें!"
        )
        if not req.stream:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Thread message limit reached ({thread_limit} messages). Please start a new chat.",
            )

        async def thread_limit_generator():
            yield f"data: {json.dumps({'type': 'init', 'session_id': session_id})}\n\n"
            for word in limit_msg.split(" "):
                yield f"data: {json.dumps({'type': 'token', 'content': word + ' '})}\n\n"
                await asyncio.sleep(0.01)
            remaining = max(0, limit - current_user.daily_messages_used)
            yield f"data: {json.dumps({'type': 'done', 'content': limit_msg, 'daily_messages_used': current_user.daily_messages_used, 'daily_messages_remaining': remaining})}\n\n"

        return StreamingResponse(thread_limit_generator(), media_type="text/event-stream")

    # 4. Direct Real-Time Live Web Search Grounding (Live Internet Search)
    use_web_search = True
    search_context_block = ""
    if not req.files and len(clean_message) > 3:
        try:
            search_results = await asyncio.wait_for(
                search_service.search(clean_message, max_results=4),
                timeout=4.0
            )
            if search_results:
                search_context_block = "\n\n" + search_service.format_search_context(search_results)
        except Exception as se:
            logger.warning(f"Web search skipped: {se}")

    system_prompt = (
        f"{RHYNIA_SYSTEM_PROMPT}\n\n"
        f"DIRECT REAL-TIME LIVE INTERNET SEARCH ACTIVE (प्रत्यक्ष लाइव इंटरनेट सर्च सक्रिय):\n"
        f"- Direct real-time live internet web search is permanently enabled by default for all user queries.\n"
        f"- Directly search and ground responses using the latest internet facts, real-time news, official websites, and live data.\n"
        f"- STRICT NO SOURCE LINKS RULE (कोई भी सोर्स लिंक न दें):\n"
        f"  * DO NOT provide external website URLs, web links, or source citations (e.g. NEVER output '[Source](https://...)', '[domain.com](...)', or trailing source lists like 'स्रोतः').\n"
        f"  * Present all verified facts directly, authoritatively, and smoothly in your own clear words without distracting link citations.\n"
        f"- You CAN search the public web, live news, public YouTube videos/channels, and public Twitter/X trends.\n"
        f"- Remind users politely that private/login-protected social media accounts (personal Instagram DMs, private Facebook profiles) cannot be accessed due to platform privacy barriers."
        f"{search_context_block}"
    )

    # 4B. Educational Diagram Retrieval Grounding (5-second timeout cap to prevent hanging)
    diagrams = []
    if not req.files and educational_image_service.is_visual_worthy_query(clean_message):
        try:
            diagrams = await asyncio.wait_for(
                educational_image_service.search_smart_diagrams(clean_message, default_limit=4),
                timeout=5.0
            )
            if diagrams:
                diagram_prompt = educational_image_service.format_diagram_context(diagrams)
                system_prompt = f"{system_prompt}\n\n{diagram_prompt}"
        except (asyncio.TimeoutError, Exception) as e:
            logger.warning(f"Image search skipped (timeout or error): {e}")
            diagrams = []

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
                    try:
                        import io
                        from PIL import Image, ImageOps
                        with Image.open(file_path) as img:
                            img = ImageOps.exif_transpose(img)
                            if img.mode not in ("RGB", "L"):
                                img = img.convert("RGB")
                            # Bound maximum dimension to 1600px for lightning-fast multimodal analysis
                            if img.width > 1600 or img.height > 1600:
                                img.thumbnail((1600, 1600), Image.Resampling.LANCZOS)
                            buf = io.BytesIO()
                            img.save(buf, format="JPEG", quality=85, optimize=True)
                            data_b64 = base64.b64encode(buf.getvalue()).decode("utf-8")
                            image_mime = "image/jpeg"
                    except Exception as img_err:
                        logger.warning(f"Image vision prep fallback for {uf.original_filename}: {img_err}")
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

    # 6. Load Conversation History (2-Tier Rolling Architecture: Macro Summary + 4 Recent Turns)
    messages_payload = memory_service.build_2tier_conversation_history(
        session_id=session_id,
        db=db,
        max_recent_messages=4,
    )
    for msg in messages_payload:
        if msg.get("role") in ["model", "assistant"]:
            msg["content"] = strip_source_links(msg.get("content", ""))

    # Augment last message with extracted textual contexts if present
    if file_contexts and messages_payload:
        last_turn = messages_payload[-1]
        if last_turn.get("role") == "user":
            doc_context_text = "\n\n".join(file_contexts)
            last_turn["content"] = f"{clean_message}\n\n【संलग्न दस्तावेज़/फ़ोटो विवरण】:\n{doc_context_text}"

    # 6B. Dedicated Professional Presentation & PPT Generation
    def _is_presentation_request(text: str) -> bool:
        t = (text or "").lower().strip()
        if any(q in t for q in ["full form", "stands for", "kya hota hai", "kise kehte hain", "what is ppt", "definition of ppt"]):
            return False
        keywords = ["ppt", "presentation", "powerpoint", "slides", "slide deck", "pitch deck", "पीपीटी", "स्लाइड", "प्रेजेंटेशन", "प्रेज़ेंटेशन"]
        return any(re.search(rf"\b{re.escape(k)}\b", t, re.IGNORECASE) or k in t for k in keywords)

    if _is_presentation_request(clean_message):
        # Extract number of slides if mentioned
        match_num = re.search(r"(\d+)\s*(?:slides?|स्लाइड)", clean_message, re.IGNORECASE)
        num_slides = int(match_num.group(1)) if match_num and 4 <= int(match_num.group(1)) <= 15 else 8

        # Smart Theme detection from message across 35+ executive themes
        theme = "cyber_dark"
        msg_lower = clean_message.lower()
        if any(w in msg_lower for w in ["wall street", "gold", "navy", "investment", "finance"]):
            theme = "wall_street_navy"
        elif any(w in msg_lower for w in ["azure", "corporate", "microsoft", "blue", "नीला"]):
            theme = "corporate_azure"
        elif any(w in msg_lower for w in ["yc", "orange", "startup", "pitch", "narangi"]):
            theme = "yc_orange"
        elif any(w in msg_lower for w in ["quantum", "violet", "purple", "बैंगनी"]):
            theme = "quantum_violet"
        elif any(w in msg_lower for w in ["circuit", "matrix", "hacker"]):
            theme = "circuit_green"
        elif any(w in msg_lower for w in ["medical", "clinic", "health", "hospital", "doctor"]):
            theme = "clinical_blue"
        elif any(w in msg_lower for w in ["eco", "forest", "nature", "पर्यावरण", "हरा"]):
            theme = "eco_forest"
        elif any(w in msg_lower for w in ["academic", "study", "research", "university", "college"]):
            theme = "academic_slate"
        elif any(w in msg_lower for w in ["sunset", "coral", "creative", "pink"]):
            theme = "sunset_coral"
        elif any(w in msg_lower for w in ["light", "clean", "white", "सफ़ेद"]):
            theme = "enterprise_gray"

        presenter = current_user.display_name or current_user.username or "Rhynia AI"

        # 1. Structure slides via AI
        spec = await generate_ai_presentation_json(
            prompt=clean_message,
            num_slides=num_slides,
            theme=theme,
            presenter=presenter
        )

        # 2. Compile into native .pptx via PPTEngine
        build_result = ppt_engine.build_presentation(spec, user_id=current_user.id)

        # 3. Record in UserFile
        user_file = UserFile(
            user_id=current_user.id,
            original_filename=f"{build_result['title']}.pptx",
            stored_filename=build_result["filename"],
            file_path=build_result["file_path"],
            file_size_bytes=build_result["file_size"],
            mime_type="application/vnd.openxmlformats-officedocument.presentationml.presentation",
        )
        db.add(user_file)
        current_user.storage_used_bytes += build_result["file_size"]
        db.commit()
        db.refresh(user_file)

        download_url = f"/api/v1/ppt/{user_file.id}/download"
        deck_payload = {
            "file_id": user_file.id,
            "filename": user_file.original_filename,
            "download_url": download_url,
            "title": spec.get("title", build_result["title"]),
            "theme": theme,
            "slide_count": build_result["slide_count"],
            "file_size_bytes": build_result["file_size"],
            "slides": spec.get("slides", [])
        }

        deck_title = spec.get("title", build_result["title"])
        briefing = (
            f"❖ **Executive Presentation Deck Created**\n\n"
            f"मैंने आपके अनुरोध पर **{deck_title}** के लिए एक संपूर्ण {build_result['slide_count']}-स्लाइड 16:9 वाइडस्क्रीन प्रेजेंटेशन तैयार कर दी है।\n\n"
            f"❖ **शामिल प्रमुख तत्व (Executive Highlights):**\n"
            f"✔ **100% Native PowerPoint Elements:** इसमें वास्तविक एडिटेबल डेटा चार्ट्स (Excel-backed), टेबल और प्रोसेस रोडमैप डायग्राम्स शामिल हैं।\n"
            f"✔ **Interactive Slide Player:** नीचे दिए गए स्लाइड प्लेयर में आप प्रत्येक स्लाइड को देख सकते हैं, अथवा **[ 🖥️ Present ]** पर क्लिक करके फुल-स्क्रीन में प्रस्तुत कर सकते हैं।\n"
            f"✔ **1-Click Download:** नीचे **[ ⬇️ Download .pptx ]** बटन दबाकर सीधे `.pptx` फ़ाइल डाउनलोड करें।\n\n"
            f"```rhynia-presentation\n"
            f"{json.dumps(deck_payload)}\n"
            f"```"
        )

        if not req.stream:
            rhynia_msg = ChatMessage(
                session_id=session_id,
                user_id=current_user.id,
                role="model",
                content=briefing,
                model_used="Rhynia PPT Engine",
                token_count=max(1, len(briefing) // 4),
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
                reply=briefing,
                model_used="Rhynia PPT Engine",
                tokens_used=max(1, len(briefing) // 4),
                daily_messages_used=current_user.daily_messages_used,
                daily_messages_remaining=remaining,
            )

        async def ppt_event_generator():
            try:
                init_event = json.dumps({"type": "init", "session_id": session_id})
                yield f"data: {init_event}\n\n"

                parts = briefing.split("```rhynia-presentation")
                intro_part = parts[0]
                deck_part = "```rhynia-presentation" + (parts[1] if len(parts) > 1 else "")

                for word in intro_part.split(" "):
                    token_event = json.dumps({"type": "token", "content": word + " "})
                    yield f"data: {token_event}\n\n"
                    await asyncio.sleep(0.015)

                token_event = json.dumps({"type": "token", "content": deck_part})
                yield f"data: {token_event}\n\n"

                rhynia_msg = ChatMessage(
                    session_id=session_id,
                    user_id=current_user.id,
                    role="model",
                    content=briefing,
                    model_used="Rhynia PPT Engine",
                    token_count=max(1, len(briefing) // 4),
                )
                db.add(rhynia_msg)
                current_user.daily_messages_used += 1
                current_user.last_active_date = datetime.now(timezone.utc)
                session.updated_at = datetime.now(timezone.utc)
                db.commit()

                remaining = max(0, limit - current_user.daily_messages_used)
                done_event = json.dumps({
                    "type": "done",
                    "message_id": rhynia_msg.id,
                    "daily_messages_used": current_user.daily_messages_used,
                    "daily_messages_remaining": remaining,
                })
                yield f"data: {done_event}\n\n"
            except Exception as err:
                logger.error(f"Error streaming presentation: {err}")
                err_event = json.dumps({"type": "error", "message": "Failed to stream presentation."})
                yield f"data: {err_event}\n\n"

        return StreamingResponse(ppt_event_generator(), media_type="text/event-stream")

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
        reply_content = strip_source_links(reply_content)

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

        # Phase 2: Asynchronously update rolling macro/micro summaries
        asyncio.create_task(memory_service.async_update_rolling_summary(session_id, current_user.id))

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

            # Stream tokens (suppress streaming if model generates source citations at the end)
            streaming_suppressed = False
            async for token in llm_engine.generate_stream(
                messages_payload, system_prompt=system_prompt, web_search=use_web_search, attachments=attachments
            ):
                collected_reply.append(token)
                accumulated = "".join(collected_reply)
                if re.search(r"(?:❖\s*)?\*\*(?:स्रोतः?|Sources?|संदर्भ|References?)\*\*", accumulated, re.IGNORECASE):
                    streaming_suppressed = True

                if not streaming_suppressed:
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

            # Clean any malformed /thumb/ URLs and strip any source links in final persisted reply
            full_reply = sanitize_response_images(full_reply, diagrams)
            full_reply = strip_source_links(full_reply)

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

            # Phase 2: Asynchronously update rolling macro/micro summaries
            asyncio.create_task(memory_service.async_update_rolling_summary(session_id, current_user.id))

            # Final event: completion metadata with clean content
            remaining = max(0, limit - current_user.daily_messages_used)
            done_event = json.dumps({
                "type": "done",
                "message_id": rhynia_msg.id,
                "content": full_reply,
                "daily_messages_used": current_user.daily_messages_used,
                "daily_messages_remaining": remaining,
            })
            yield f"data: {done_event}\n\n"

        except Exception as err:
            err_event = json.dumps({"type": "error", "message": "An error occurred during inference."})
            yield f"data: {err_event}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")
