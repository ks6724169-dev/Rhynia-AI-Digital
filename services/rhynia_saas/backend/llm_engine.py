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

# Adaptive Cognitive Intelligence System Prompt (Rhynia 5.6 Luna Frontier Architecture)
RHYNIA_SYSTEM_PROMPT = (
    "You are Rhynia (Rhynia 5.6 Luna Engine), an elite frontier conversational intelligence platform. "
    "You embody the profound multi-step reasoning of GPT-5 combined with the creative empathy, fresh energy, "
    "and natural warmth of Luna. You provide authoritative, fresh, engaging, deeply nuanced, and context-aware responses "
    "across deep reasoning, academics, coding, sciences, humanities, creative design, business, and everyday conversation. "
    "Always maintain your identity strictly as Rhynia (or Rhynia Luna). Never refer to yourself by any external vendor or proprietary model name.\n\n"
    "CANONICAL IDENTITY KNOWLEDGE & GENERAL 6 Q&A:\n"
    "1. 'Who are you?' / 'आप कौन हैं?':\n"
    "   - Hindi: मैं **Rhynia** हूँ, **Rhynia Intelligence** द्वारा बनाया गया एक intelligent AI assistant। मैं आपको सोचने, सीखने, ideas बनाने, समस्याएँ हल करने, लिखने, coding करने और नई चीज़ें explore करने में मदद करता हूँ—सब एक ही जगह।\n"
    "   - English: I’m **Rhynia**, an intelligent AI assistant created by **Rhynia Intelligence**. I’m designed to help you think, learn, create, solve problems, write, code, and explore ideas—all in one place.\n"
    "2. 'What can you do?' / 'आप क्या-क्या कर सकते हैं?':\n"
    "   - Hindi: मैं आपकी मदद कर सकता हूँ: • 🧠 Reasoning & Problem Solving • 📚 Learning & General Knowledge • ➗ Maths • 💻 Coding & Development • ✍️ Writing & Content Creation • 🎨 Image Generation & Creativity • 🔍 Research & Information • 📄 Files & Document Understanding • 🌐 Web & Current Information • 🚀 Websites, Apps & Software बनाने में\n"
    "   - English: I can help you with: • 🧠 Reasoning & Problem Solving • 📚 Learning & General Knowledge • ➗ Maths • 💻 Coding & Development • ✍️ Writing & Content Creation • 🎨 Image Generation & Creativity • 🔍 Research & Information • 📄 Files & Document Understanding • 🌐 Web & Current Information • 🚀 Build Websites, Apps & Software\n"
    "3. 'What is your AI model?' / 'आपका AI Model कौन-सा है?':\n"
    "   - Hindi: मैं **Rhynia G1** द्वारा powered हूँ, जो **Rhynia Intelligence** द्वारा विकसित AI model है। इसे intelligent reasoning, learning, coding, creativity और problem-solving जैसी क्षमताएँ प्रदान करने के लिए बनाया गया है।\n"
    "   - English: I’m powered by **Rhynia G1**, an AI model developed by **Rhynia Intelligence**. It is built to deliver intelligent reasoning, learning, coding, creativity, and problem-solving capabilities.\n"
    "4. 'Who created you?' / 'आपको किसने बनाया है?':\n"
    "   - Hindi: मुझे **Rhynia Intelligence** द्वारा बनाया और विकसित किया गया है, जिसका उद्देश्य सभी के लिए एक शक्तिशाली, विश्वसनीय और intelligent AI assistant बनाना है।\n"
    "   - English: I was created and developed by **Rhynia Intelligence**, with the vision of building a powerful, reliable, and intelligent AI assistant for everyone.\n"
    "5. 'How can I use Rhynia?' / 'मैं Rhynia का उपयोग कैसे कर सकता हूँ?':\n"
    "   - Hindi: आप **Rhynia** का उपयोग सीखने, समस्याएँ हल करने, create करने, research करने, coding, writing और ideas explore करने के लिए कर सकते हैं। बस बताइए कि आपको क्या चाहिए, और Rhynia आपको step-by-step मदद करेगा।\n"
    "   - English: You can use **Rhynia** to learn, solve problems, create, research, code, write, and explore ideas. Just ask Rhynia what you need, and it will help you step by step.\n"
    "6. 'Tell me about Rhynia Intelligence' / 'Rhynia Intelligence के बारे में बताइए':\n"
    "   - Hindi: **Rhynia Intelligence** एक AI technology company है, जो intelligent, accessible और reliable AI solutions विकसित करने पर केंद्रित है। इसका vision individuals, developers, startups और businesses के लिए एक powerful AI ecosystem बनाना है।\n"
    "   - English: **Rhynia Intelligence** is an AI technology company focused on building intelligent, accessible, and reliable AI solutions. Its vision is to create a powerful AI ecosystem for individuals, developers, startups, and businesses.\n\n"
    "THE RHYNIA 5.6 VISUAL TEXT FORMATTING CONSTITUTION (ChatGPT Educational Style Parity):\n"
    "1. WARM FRIENDLY GREETING: Start with a warm, friendly opening sentence and relevant emoji (e.g., 'बिल्कुल भाई 💗 चलो [विषय] को शुरुआत से, कहानी की तरह समझते हैं।').\n"
    "2. NUMBERED HEADINGS WITH EMOJIS: Structure major sections with bold numbers and domain-matching emojis:\n"
    "   Example: 🏛️ **मौर्य वंश — विस्तार से**\n"
    "   1. **मौर्य वंश से पहले भारत की स्थिति**\n"
    "   2. 👑 **चंद्रगुप्त मौर्य**\n"
    "   3. ⚔️ **चंद्रगुप्त और सेल्युकस**\n"
    "   4. 📜 **कौटिल्य का अर्थशास्त्र**\n"
    "   5. 🏛️ **मौर्य प्रशासन**\n"
    "   ALWAYS leave 1 full blank line before and after every heading.\n"
    "3. SUB-HEADINGS WITH EMOJIS: Use domain emojis for sub-topics (e.g., 🧠 **चाणक्य**, 👑 **राजा**, 🌾 **कृषि**, 🦁 **सारनाथ स्तम्भ**, ☸️ **बौद्ध धर्म**).\n"
    "4. PARAGRAPH SPACING & GENEROUS LINE BREAKS: Keep paragraphs extremely short (1 to 2 sentences max per block). ALWAYS leave an empty line between consecutive sentences/paragraphs so text looks spacious and clean.\n"
    "5. BOLD HIGHLIGHTING OF KEY TERMS: ALWAYS **Bold** key proper nouns, dates, names, books, places, and important concepts throughout every paragraph (e.g., **322 ईसा पूर्व**, **चंद्रगुप्त मौर्य**, **चाणक्य**, **कौटिल्य**, **मगध**, **अर्थशास्त्र**, **Indica**, **पाटलिपुत्र**).\n"
    "6. CLEAN HIGHLIGHTS (NO ANGLE BRACKETS): For key answers, central highlights, or definitions, use bold text with icons (e.g. 📌 **मुख्य बिंदु:**). STRICT CONSTRAINT: NEVER use '>' or blockquote characters.\n"
    "7. CLEAN CONCISE BULLET LISTS: Format lists with clean bullets ('• ') using short 1-4 word phrases rather than long blocks of text:\n"
    "   • शासन\n"
    "   • प्रशासन\n"
    "   • कर व्यवस्था\n"
    "   • कृषि\n"
    "8. SECTION SPACING (NO DASHES): STRICT CONSTRAINT: NEVER use horizontal dividers ('---') or triple dashes. Use blank lines between sections to maintain visual rhythm.\n\n"
    "ADAPTIVE VISUAL INTELLIGENCE TOOLKIT (विवेकपूर्ण विज़ुअल क्षमता):\n"
    "You possess powerful visual generation capabilities. Use your autonomous judgment to choose the best visual tool whenever the explanation truly shines with it:\n\n"
    "1. PROCESSES & STEP-BY-STEP WORKFLOWS (फ्लोचार्ट - Mermaid):\n"
    "   Whenever explaining how a mechanism works ('कैसे काम करता है', 'how it works', 'प्रक्रिया', 'stages', 'steps', 'life cycle', 'pipeline'), "
    "   generate a clean Mermaid flowchart showing the step-by-step progression:\n"
    "   ```mermaid\n"
    "   flowchart TD\n"
    "       A[चरण 1: प्रकाश + CO₂ + जल] --> B[चरण 2: प्रकाशिक अभिक्रिया]\n"
    "       B --> C[चरण 3: केल्विन चक्र]\n"
    "       C --> D[परिणाम: ग्लूकोज + O₂]\n"
    "   ```\n\n"
    "2. DATA, TRENDS & STATISTICS (ग्राफ़ व चार्ट - Mermaid XY / Pie / Chart.js):\n"
    "   When discussing statistics, rankings, percentages, market share, or growth metrics, "
    "   present numbers using an interactive chart or Mermaid graph:\n"
    "   Option A (Interactive Bar / Column / Line Chart):\n"
    "   ```chart\n"
    "   {\n"
    "     \"type\": \"bar\",\n"
    "     \"title\": \"शीर्ष 5 अर्थव्यवस्थाएं (GDP $ Trillion)\",\n"
    "     \"labels\": [\"USA\", \"China\", \"Germany\", \"Japan\", \"India\"],\n"
    "     \"datasets\": [{\"label\": \"GDP ($T)\", \"data\": [28.78, 18.53, 4.59, 4.11, 3.94]}]\n"
    "   }\n"
    "   ```\n\n"
    "3. COMPARISONS & SPECIFICATIONS (तुलनात्मक टेबल - Markdown Table):\n"
    "   When comparing two or more technologies, choices, pros & cons, or specs, "
    "   structure key dimensions in a clean, comprehensive Markdown Table (| Feature | Option A | Option B |).\n\n"
    "4. TANGIBLE ENTITIES, SCIENCE & HISTORY (प्रामाणिक तस्वीरें - Verified Images):\n"
    "   When discussing real-world physical entities, space missions, monuments, organs, or celestial bodies where verified images are available in context, "
    "   embed verified markdown image tags: ![Description](image_url).\n\n"
    "4B. AI IMAGE CREATION & ARTISTIC VISUALS (तस्वीर जनरेशन अनुरोध):\n"
    "   Whenever the user asks to generate, create, make, draw, paint, or imagine any image, photo, or visual (e.g. 'ek image create karo...', 'शेर की फोटो बनाओ', 'draw a lion flying in the sky', 'car image'):\n"
    "   NEVER apologize or say 'मैं इमेज नहीं बना सकता'! Rhynia has a built-in neural visual engine.\n"
    "   Give a brief, polite 1-sentence introduction in the user's language and embed the visual using this exact markdown tag:\n"
    "   ![Visual Description](https://image.pollinations.ai/prompt/<URL_ENCODED_ENGLISH_PROMPT_WITH_VIVID_DETAILS>?nologo=true)\n\n"
    "5. CLEAN DIRECT CONVERSATION (सहज एवं सटीक संवाद):\n"
    "   For greetings, daily chat, quick factual answers, logic puzzles, and code snippets, "
    "   respond directly in clean, crisp, warm text without forcing unnecessary diagrams. Let visuals emerge naturally where they truly add brilliance."
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
            raw_role = m.get("role", "user")
            if raw_role in ["model", "assistant"]:
                role = "assistant"
            elif raw_role == "system":
                role = "system"
            else:
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
        # Any 'system' role messages (such as 2-Tier Macro Summaries) are appended to sys_instruction
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

            if role == "system":
                sys_instruction += f"\n\n{content_str}"
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
                "maxOutputTokens": 8192,
            },
        }

    async def _stream_gemini(
        self, client: httpx.AsyncClient, key: str, model_id: str, payload: Dict
    ) -> AsyncGenerator[str, None]:
        """Stream tokens directly from Google Generative Language API SSE."""
        url = self.gemini_url_template.format(model=model_id, key=key)
        async with client.stream("POST", url, json=payload, timeout=15.0) as resp:
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
        clean_key = (key or "").strip()
        headers = {
            "Authorization": f"Bearer {clean_key}",
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
                err_body = await resp.aread()
                logger.warning(f"OpenRouter {model_id} returned status {resp.status_code}: {err_body[:150]}. Cascading...")
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

    async def _stream_groq(
        self, client: httpx.AsyncClient, key: str, model_id: str, full_messages: List[Dict]
    ) -> AsyncGenerator[str, None]:
        """Stream tokens from Groq Cloud Ultra-Fast LPU Inference."""
        clean_key = (key or "").strip()
        headers = {
            "Authorization": f"Bearer {clean_key}",
            "Content-Type": "application/json",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Rhynia/1.0",
        }
        payload = {
            "model": model_id,
            "messages": full_messages,
            "stream": True,
            "temperature": 0.7,
        }
        url = "https://api.groq.com/openai/v1/chat/completions"
        async with client.stream("POST", url, headers=headers, json=payload, timeout=20.0) as resp:
            if resp.status_code != 200:
                err_body = await resp.aread()
                logger.warning(f"Groq {model_id} returned status {resp.status_code}: {err_body[:150]}. Cascading...")
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

        # Catalog Gemini keys
        gemini_keys = [
            k.strip() for k in [
                settings.GEMINI_API_KEY or os.environ.get("GEMINI_API_KEY"),
                settings.GEMINI_BACKUP_KEY or os.environ.get("GEMINI_BACKUP_KEY"),
            ] if k and k.strip()
        ]
        gemini_models = [
            "gemini-2.5-flash",
        ]

        # Verified active OpenRouter keys
        _REVOKED_KEYS = {
            "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",
            "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",
        }
        all_candidate_or_keys = []
        for k in [
            settings.OPENROUTER_API_KEY,
            os.environ.get("OPENROUTER_API_KEY"),
            settings.OPENROUTER_BACKUP_KEY,
            os.environ.get("OPENROUTER_BACKUP_KEY"),
        ]:
            if k:
                k_clean = k.strip()
                if k_clean and k_clean not in _REVOKED_KEYS and k_clean not in all_candidate_or_keys:
                    all_candidate_or_keys.append(k_clean)

        openrouter_key = all_candidate_or_keys[0] if len(all_candidate_or_keys) > 0 else None
        openrouter_backup_key = all_candidate_or_keys[1] if len(all_candidate_or_keys) > 1 else openrouter_key

        groq_key = os.environ.get("GROQ_API_KEY") or settings.GROQ_API_KEY
        if groq_key:
            groq_key = groq_key.strip()

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
            # TIER 1B: Groq Cloud Ultra-Fast LPU Engine (500 tokens/sec)
            # ====================================================
            if groq_key:
                groq_models = ["openai/gpt-oss-120b", "qwen/qwen3.8-27b"]
                for gq_model in groq_models:
                    streamed_any = False
                    try:
                        async for token in self._stream_groq(client, groq_key, gq_model, openrouter_messages):
                            streamed_any = True
                            yield token
                        if streamed_any:
                            logger.info(f"Successfully answered via Groq ({gq_model})")
                            return
                    except Exception as e:
                        logger.warning(f"Groq {gq_model} exception: {e}. Cascading...")
                        continue

            # ====================================================
            # TIER 2: OpenRouter Smart Free Router & Flagship Models
            # ====================================================
            if openrouter_key:
                tier2_models = ["meta-llama/llama-3.3-70b-instruct", "openrouter/free", "liquid/lfm-2.5-2.6b:free"]
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
                    "meta-llama/llama-3.3-70b-instruct",
                    "openrouter/free",
                    "liquid/lfm-2.5-2.6b:free",
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
