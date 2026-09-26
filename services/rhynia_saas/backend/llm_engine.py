"""
Rhynia Intelligence SaaS — 3-Tier AI Model Cascade Engine
"""

import asyncio
import json
import logging
import os
from datetime import datetime, timezone, timedelta
from typing import AsyncGenerator, Dict, List, Optional, Tuple
import httpx

from services.rhynia_saas.backend.config import settings
from services.rhynia_saas.backend.services.educational_synthesis import educational_synthesis_engine

logger = logging.getLogger("rhynia.llm_engine")

# Adaptive Cognitive Intelligence System Prompt (Frontier-grade AI like ChatGPT, Claude & Gemini)
RHYNIA_SYSTEM_PROMPT = (
    "You are Rhynia, an elite conversational intelligence platform designed by Rhynia Intelligence. "
    "You provide authoritative, clear, thoughtful, adaptive, and context-aware responses across deep reasoning, "
    "academics, humanities, engineering, coding, mathematics, business, and natural everyday conversation. "
    "Always maintain your identity strictly as Rhynia. Never refer to yourself by any external vendor or product name.\n\n"
    "COGNITIVE ADAPTABILITY & DYNAMIC RESPONSE SHAPING (सवाल के अनुसार स्वाभाविक एवं सटीक उत्तर):\n"
    "You must dynamically adapt the length, format, and tone of your response based strictly on the user's inquiry:\n\n"
    "1. CASUAL CHAT & GREETINGS (सामान्य बातचीत एवं अभिवादन):\n"
    "   - Examples: 'Hi', 'Hello', 'Kaise ho?', 'Kya haal hai?', 'Good morning', 'Who are you?'.\n"
    "   - Style: Warm, friendly, natural, and concise (1–2 sentences). NEVER generate essays, bullet lists, flowcharts, or tables for casual greetings.\n\n"
    "2. DIRECT / FACTUAL QUESTIONS (सीधे व संक्षिप्त तथ्य):\n"
    "   - Examples: 'What is the capital of India?', '2+2 kya hota hai?', 'Today's date', 'Speed of light', 'Who wrote Hamlet?'.\n"
    "   - Style: Direct, clear, and high-signal in 1–3 sentences or brief bullet points. No unnecessary preamble or padding.\n\n"
    "3. PROGRAMMING & TECHNICAL QUERIES (कोडिंग एवं तकनीकी सहायता):\n"
    "   - Provide clean, modern, idiomatic code blocks with minimal boilerplate.\n"
    "   - Follow with 2–3 concise points explaining key logic, complexities, or edge cases. Avoid verbose textbook essays.\n\n"
    "4. IN-DEPTH ACADEMIC, SCIENTIFIC & COMPLEX TOPICS (गहन शैक्षणिक एवं विश्लेषणात्मक विषय):\n"
    "   - Examples: 'Explain Photosynthesis', 'Human Brain anatomy', 'How does Blockchain work?', 'Quantum Computing'.\n"
    "   - Provide a beautifully structured, comprehensive explanation:\n"
    "     * Opening core definition in 2–3 clear lines.\n"
    "     * Structural roadmap / main architectural divisions.\n"
    "     * Detailed breakdown using authentic Microsoft Word bullet library symbols (`❖`, `■`, `➤`, `✔`, `•`).\n"
    "     * Embed a clean Mermaid flowchart (`flowchart TD` or `flowchart LR`) or comparison table (`|---|---|`) WHERE it genuinely clarifies the process, hierarchy, or differences.\n"
    "     * Crisp concluding takeaway.\n"
    "     * 1–2 contextual follow-up questions under `❖ **आगे जानने योग्य महत्वपूर्ण प्रश्न:**`.\n\n"
    "5. USER-UPLOADED PHOTOS & DOCUMENTS (फ़ोटो एवं दस्तावेज़ विश्लेषण):\n"
    "   - Deeply examine visual details (colors, objects, layout, diagrams, text/labels, people, scenes) or extracted document contents.\n"
    "   - Provide a thorough, direct analysis answering the user's specific request.\n\n"
    "6. LENGTH & TONE MODULATION (यूज़र के निर्देशानुसार आकार व टोन):\n"
    "   - If the user asks for 'short', 'brief', 'ek line me' -> Deliver an ultra-concise answer.\n"
    "   - If the user asks for 'detail me', 'step by step', 'vistar se' -> Deliver an exhaustive, step-by-step breakdown.\n"
    "   - Match the user's language and tone seamlessly: Hindi with natural Hindi, Hinglish with conversational Hinglish, English with fluent English.\n\n"
    "HEADINGS & BULLETS — MICROSOFT WORD BULLET LIBRARY RULES:\n"
    "- STRICTLY FORBIDDEN: NEVER USE RAW MARKDOWN HASHES (`###`, `####`, `##`, `#`) anywhere in your response! Raw hashes look like broken code.\n"
    "- INSTEAD, use authentic Microsoft Word Bullet Library symbols according to context:\n"
    "  * For Major Section Titles: Use `❖` or `■` with bold text (e.g., ❖ **मुख्य चरण:**).\n"
    "  * For Steps & Action Flows: Use `➤` (e.g., ➤ **चरण 1: ऊर्जा अवशोषण:**).\n"
    "  * For Benefits, Importance & Facts: Use `✔` (e.g., ✔ **महत्वपूर्ण लाभ:**).\n"
    "  * For Components & Sub-points: Use `•` (e.g., • **घटक:** विवरण।).\n\n"
    "VISUALS, CHARTS & TABLES RULES:\n"
    "- STRICT IMAGE INTEGRITY: ONLY embed markdown images (`![Caption](url)`) if verified image URLs are explicitly provided in your prompt under 'VERIFIED VISUAL GROUNDING'. NEVER invent, hallucinate, or fabricate image URLs.\n"
    "- Tables: Standard GitHub Markdown tables with '|' headers and divider row.\n"
    "- Mermaid Diagrams: Lowercase keywords (`flowchart TD`, `flowchart LR`). Node IDs alphanumeric (`A`, `B`). Labels in double quotes inside brackets: `A[\"Title\"] --> B[\"Next\"]`.\n\n"
    "DIRECT REAL-TIME WEB SEARCH & LIVE INTERNET CAPABILITIES:\n"
    "- Rhynia is connected to live real-time internet search for up-to-date facts, news, and live data.\n"
    "- COMPACT BLUE SOURCE LINKS: ALWAYS provide clean markdown links `[Source Name](url)` inline or under '❖ **स्रोतः**' so the UI renders them as compact pills."
)



class CascadeLLMEngine:
    """
    Indestructible 4-Tier AI Model Cascade Router:
    - Tier 1: Google Gemini Ultra-Fast Native API (via GEMINI_API_KEY and GEMINI_BACKUP_KEY)
    - Tier 2: OpenRouter Flagship Models (Llama 3.3 70B & DeepSeek via OPENROUTER_API_KEY)
    - Tier 3: OpenRouter Free Models (Liquid, Dots, Nex-mini via OPENROUTER_BACKUP_KEY)
    - Tier 4: Educational Synthesis Engine (Local / Zero-Failure Offline Fallback)
    """

    def __init__(self):
        self.openrouter_url = "https://openrouter.ai/api/v1/chat/completions"
        self.gemini_url_template = "https://generativelanguage.googleapis.com/v1beta/models/{model}:streamGenerateContent?alt=sse&key={key}"

    def _build_payload_messages(
        self,
        messages: List[Dict[str, str]],
        system_prompt: Optional[str] = None,
        attachments: Optional[List[Dict]] = None,
    ) -> List[Dict]:
        """Construct standard message payload with Rhynia system prompt, live IST time, and optional vision content."""
        base_prompt = system_prompt or RHYNIA_SYSTEM_PROMPT

        # Inject real-time Indian Standard Time (IST - UTC+05:30)
        try:
            ist_tz = timezone(timedelta(hours=5, minutes=30))
            now_ist = datetime.now(ist_tz)
            formatted_datetime = now_ist.strftime("%A, %d %B %Y, %I:%M:%S %p IST")
            time_context = (
                f"\n\nREAL-TIME TEMPORAL CONTEXT (सटीक वर्तमान समय और दिनांक):\n"
                f"- Current Date & Time: {formatted_datetime}\n"
                f"- Day of the Week: {now_ist.strftime('%A')}\n"
                f"- Current Date: {now_ist.day} {now_ist.strftime('%B')} {now_ist.year}\n"
                f"- Timezone: Indian Standard Time (IST, UTC+05:30)\n"
                f"- CRITICAL INSTRUCTION: Always use this exact real-time system clock whenever the user asks for the current date, time, year, month, or day."
            )
        except Exception:
            time_context = ""

        sys_content = base_prompt + time_context
        formatted = [{"role": "system", "content": sys_content}]
        for m in messages:
            role = m.get("role", "user")
            if role not in ["user", "system", "model"]:
                role = "user"
            formatted.append({"role": role, "content": m.get("content", "")})

        # Inject vision attachments into the last user message for vision-capable models
        if attachments:
            last_user_idx = None
            for i in range(len(formatted) - 1, -1, -1):
                if formatted[i]["role"] == "user":
                    last_user_idx = i
                    break
            if last_user_idx is not None:
                orig_text = formatted[last_user_idx]["content"]
                multi_content = [{"type": "text", "text": orig_text}]
                for att in attachments:
                    if att.get("type") == "image" and att.get("data"):
                        mime = att.get("mime_type", "image/jpeg")
                        multi_content.append({
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:{mime};base64,{att['data']}"
                            }
                        })
                formatted[last_user_idx]["content"] = multi_content

        return formatted

    def _build_gemini_payload(
        self,
        messages: List[Dict[str, str]],
        system_prompt: Optional[str] = None,
        attachments: Optional[List[Dict]] = None,
    ) -> Dict:
        """Construct Google Gemini native contents and systemInstruction payload with inlineData support."""
        base_prompt = system_prompt or RHYNIA_SYSTEM_PROMPT

        try:
            ist_tz = timezone(timedelta(hours=5, minutes=30))
            now_ist = datetime.now(ist_tz)
            formatted_datetime = now_ist.strftime("%A, %d %B %Y, %I:%M:%S %p IST")
            time_context = (
                f"\n\nREAL-TIME TEMPORAL CONTEXT (सटीक वर्तमान समय और दिनांक):\n"
                f"- Current Date & Time: {formatted_datetime}\n"
                f"- Day of the Week: {now_ist.strftime('%A')}\n"
                f"- Current Date: {now_ist.day} {now_ist.strftime('%B')} {now_ist.year}\n"
                f"- Timezone: Indian Standard Time (IST, UTC+05:30)\n"
                f"- CRITICAL INSTRUCTION: Always use this exact real-time system clock whenever the user asks for the current date, time, year, month, or day."
            )
        except Exception:
            time_context = ""

        sys_instruction = base_prompt + time_context

        # Build Gemini contents: role must be 'user' or 'model'
        contents = []
        for m in messages:
            role = m.get("role", "user")
            content = m.get("content", "")
            if isinstance(content, str):
                content_str = content.strip()
            else:
                content_str = str(content)
            if not content_str:
                continue
            gemini_role = "model" if role in ["model", "assistant"] else "user"

            # Avoid consecutive same-role messages by combining text
            if contents and contents[-1]["role"] == gemini_role:
                contents[-1]["parts"][0]["text"] += f"\n\n{content_str}"
            else:
                contents.append({"role": gemini_role, "parts": [{"text": content_str}]})

        # Gemini contents must start with 'user'
        if contents and contents[0]["role"] != "user":
            contents.pop(0)

        if not contents:
            contents = [{"role": "user", "parts": [{"text": "कृपया इस फ़ोटो या फ़ाइल का विस्तृत विश्लेषण करें।"}]}]

        # Inject attachments (images / PDF) into the last user message
        if attachments:
            last_user = None
            for item in reversed(contents):
                if item["role"] == "user":
                    last_user = item
                    break
            if not last_user:
                last_user = {"role": "user", "parts": [{"text": "कृपया इस फ़ोटो या फ़ाइल का विश्लेषण करें।"}]}
                contents.append(last_user)

            for att in attachments:
                if att.get("data") and att.get("mime_type"):
                    last_user["parts"].append({
                        "inlineData": {
                            "mimeType": att["mime_type"],
                            "data": att["data"]
                        }
                    })

        return {
            "contents": contents,
            "systemInstruction": {"parts": [{"text": sys_instruction}]},
            "generationConfig": {
                "temperature": 0.7,
                "maxOutputTokens": 4096,
            },
        }

    async def _stream_gemini(
        self, client: httpx.AsyncClient, key: str, model_id: str, payload: Dict
    ) -> AsyncGenerator[str, None]:
        """Stream tokens directly from Google Generative Language API SSE."""
        url = self.gemini_url_template.format(model=model_id, key=key)
        async with client.stream("POST", url, json=payload, timeout=25.0) as resp:
            if resp.status_code != 200:
                logger.warning(f"Gemini {model_id} returned status {resp.status_code}. Cascading...")
                return

            async for line in resp.aiter_lines():
                if line.startswith("data: "):
                    data_str = line[6:].strip()
                    if not data_str:
                        continue
                    try:
                        data_json = json.loads(data_str)
                        candidates = data_json.get("candidates", [])
                        if candidates:
                            parts = candidates[0].get("content", {}).get("parts", [])
                            for part in parts:
                                token = part.get("text", "")
                                if token:
                                    yield token
                    except Exception:
                        continue

    async def _stream_openrouter(
        self, client: httpx.AsyncClient, key: str, model_id: str, full_messages: List[Dict]
    ) -> AsyncGenerator[str, None]:
        """Stream tokens from OpenRouter API SSE."""
        headers = {
            "Authorization": f"Bearer {key}",
            "HTTP-Referer": "https://rhynia.com",
            "X-Title": "Rhynia Intelligence",
            "Content-Type": "application/json",
        }
        payload = {
            "model": model_id,
            "messages": full_messages,
            "stream": True,
            "temperature": 0.7,
        }
        async with client.stream("POST", self.openrouter_url, headers=headers, json=payload, timeout=25.0) as resp:
            if resp.status_code != 200:
                logger.warning(f"OpenRouter {model_id} returned status {resp.status_code}. Cascading...")
                return

            async for line in resp.aiter_lines():
                if line.startswith("data: "):
                    data_str = line[6:].strip()
                    if data_str == "[DONE]":
                        break
                    try:
                        data_json = json.loads(data_str)
                        delta = data_json["choices"][0]["delta"].get("content", "")
                        if delta:
                            yield delta
                    except Exception:
                        continue

    async def generate_stream(
        self,
        messages: List[Dict[str, str]],
        system_prompt: Optional[str] = None,
        tier: int = 1,
        web_search: bool = True,
        attachments: Optional[List[Dict]] = None,
    ) -> AsyncGenerator[str, None]:
        """
        Indestructible 4-Tier Cascade Router:
        - Tier 1: Google Gemini Ultra-Fast Native API with Multimodal Vision (Primary & Backup Gemini Keys)
        - Tier 2: OpenRouter Flagship Models (Llama 3.3 70B & DeepSeek via Primary OpenRouter Key)
        - Tier 3: OpenRouter Free Models (Liquid, Dots, Nex-mini via Backup Key)
        - Tier 4: Guaranteed Educational Synthesis Engine (Local / Zero-Failure Offline)
        """
        gemini_payload = self._build_gemini_payload(messages, system_prompt, attachments=attachments)
        openrouter_messages = self._build_payload_messages(messages, system_prompt, attachments=attachments)
        last_user_query = messages[-1]["content"] if messages else "Hello"
        if not isinstance(last_user_query, str):
            last_user_query = str(last_user_query)

        # Catalog all 4 keys from settings or environment
        gemini_keys = [
            k for k in [
                settings.GEMINI_API_KEY or os.environ.get("GEMINI_API_KEY"),
                settings.GEMINI_BACKUP_KEY or os.environ.get("GEMINI_BACKUP_KEY"),
            ] if k
        ]
        gemini_models = [
            "gemini-2.5-flash",
            "gemini-flash-latest",
            "gemini-flash-lite-latest",
        ]

        openrouter_key = settings.OPENROUTER_API_KEY or os.environ.get("OPENROUTER_API_KEY")
        openrouter_backup_key = settings.OPENROUTER_BACKUP_KEY or os.environ.get("OPENROUTER_BACKUP_KEY") or openrouter_key

        async with httpx.AsyncClient(timeout=45.0) as client:
            # ====================================================
            # TIER 1: Google Gemini Ultra-Fast Native API (Keys 1 & 2)
            # ====================================================
            for g_key in gemini_keys:
                for g_model in gemini_models:
                    streamed_any = False
                    try:
                        async for token in self._stream_gemini(client, g_key, g_model, gemini_payload):
                            streamed_any = True
                            yield token
                        if streamed_any:
                            logger.info(f"Successfully answered via Gemini ({g_model})")
                            return
                    except Exception as e:
                        logger.warning(f"Gemini {g_model} exception: {e}. Cascading...")
                        continue

            # ====================================================
            # TIER 2: OpenRouter Flagship Models (Llama 3.3 70B & DeepSeek)
            # ====================================================
            if openrouter_key:
                tier2_models = ["meta-llama/llama-3.3-70b-instruct", "deepseek/deepseek-chat"]
                for or_model in tier2_models:
                    streamed_any = False
                    try:
                        async for token in self._stream_openrouter(client, openrouter_key, or_model, openrouter_messages):
                            streamed_any = True
                            yield token
                        if streamed_any:
                            logger.info(f"Successfully answered via OpenRouter ({or_model})")
                            return
                    except Exception as e:
                        logger.warning(f"OpenRouter {or_model} exception: {e}. Cascading...")
                        continue

            # ====================================================
            # TIER 3: OpenRouter Free Models (Backup Key)
            # ====================================================
            if openrouter_backup_key:
                tier3_models = [
                    "liquid/lfm-2.5-2.6b:free",
                    "dots-studio/dots-3-note-preview:free",
                    "nex-agi/nex-n2.5-mini:free",
                ]
                for or_free in tier3_models:
                    streamed_any = False
                    try:
                        async for token in self._stream_openrouter(client, openrouter_backup_key, or_free, openrouter_messages):
                            streamed_any = True
                            yield token
                        if streamed_any:
                            logger.info(f"Successfully answered via OpenRouter Free ({or_free})")
                            return
                    except Exception as e:
                        logger.warning(f"OpenRouter Free {or_free} exception: {e}. Cascading...")
                        continue

        # ====================================================
        # TIER 4: Guaranteed Offline Educational Synthesis (100% Zero-Failure)
        # ====================================================
        logger.info(f"All online APIs exhausted or timed out. Falling back to Tier 4 Educational Synthesis Engine.")
        synth_text = educational_synthesis_engine.synthesize_topic(last_user_query) or educational_synthesis_engine.generate_generic_educational(last_user_query)
        for word in synth_text.split(" "):
            yield word + " "
            await asyncio.sleep(0.015)

    async def generate_response(
        self,
        messages: List[Dict[str, str]],
        system_prompt: Optional[str] = None,
        web_search: bool = True,
        attachments: Optional[List[Dict]] = None,
    ) -> Tuple[str, str, int]:
        """
        Generate complete text response and return (content, model_tier, token_count).
        """
        chunks = []
        async for token in self.generate_stream(
            messages, system_prompt, web_search=web_search, attachments=attachments
        ):
            chunks.append(token)
        full_content = "".join(chunks)
        # Approximate token count
        token_count = max(1, len(full_content) // 4)
        return full_content, "Rhynia Core", token_count


# Singleton Instance
llm_engine = CascadeLLMEngine()
