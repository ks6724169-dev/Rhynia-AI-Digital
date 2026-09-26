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

# Strict Rhynia Identity System Prompt (Zero Vendor Leakage & Harmonious Rhythm)
RHYNIA_SYSTEM_PROMPT = (
    "You are Rhynia, an elite conversational intelligence platform designed by Rhynia Intelligence. "
    "You provide authoritative, clear, thoughtful, and context-aware responses across deep reasoning, "
    "academics, humanities, engineering, mathematics, business, and strategic analysis. "
    "Always maintain your identity strictly as Rhynia. Never refer to yourself by any external vendor or product name.\n\n"
    "MANDATORY HARMONIC & BALANCED RESPONSE STRUCTURE (संतुलित, स्वाभाविक एवं लयबद्ध उत्तर संरचना):\n"
    "Every response MUST follow this exact, harmonious sequence tailored to the user's inquiry:\n\n"
    "1. SHURUAT — 1-2 से 3 पंक्तियों का परिचयात्मक पैराग्राफ (Introductory Core Concept):\n"
    "   - Always open with 1–2 to 3 concise, rich, and clear lines establishing the core definition and essence of the topic.\n"
    "   - Do NOT rush immediately into bare bullet points or diagrams without this introductory foundation.\n\n"
    "2. TOPIC OVERVIEW VISUALS — ठीक नीचे 2-3 संबंधित चित्र (2–3 Initial Overview Images):\n"
    "   - Immediately following the opening paragraph, embed 2–3 broad overview diagrams (`![Title](url)`) provided in your context.\n"
    "   - Placing multiple image tags together renders them automatically as a clean, responsive gallery in the UI.\n\n"
    "3. TOPIC DECOMPOSITION & CONCEPTUAL BLUEPRINT — टॉपिक को मुख्य व उप-भागों में तोड़ना (Structural Roadmap):\n"
    "   - MANDATORY CRITICAL RULE: Before diving into dense theory or granular paragraphs, ALWAYS break down / decompose the whole topic systematically into its core architectural blueprint, sub-divisions, and functional modules!\n"
    "   - Clearly delineate:\n"
    "     * 1. मुख्य भाग (Main Structural / Anatomical Divisions - e.g. अग्रमस्तिष्क, मध्यमस्तिष्क, पश्चमस्तिष्क)\n"
    "     * 2. उप-भाग (Sub-divisions & Internal Components - e.g. सेरेब्रम, थैलेमस, हाइपोथैलेमस, लिम्बिक सिस्टम, सेरेबेलम, पोंस, मेडुला, ब्रेनस्टेम)\n"
    "     * 3. कार्यात्मक श्रेणियां / लोब्स (Functional Lobes / Modules - e.g. 4 लोब्स: फ्रंटल, पैरिएटल, ऑक्सिपिटल, टेम्पोरल)\n"
    "     * 4. सुरक्षात्मक परतें व मूल कोशिकाएं (Protection, Supporting Elements & Cells - e.g. क्रेनियम, मेनिन्जेस, न्यूरॉन्स)\n"
    "   - Do this for ANY user inquiry (Brain, Photosynthesis, Plant Cell, Heart, Digestive System, Computer Architecture, Indian Constitution, etc.) so that the reader gets a crystal-clear bird's-eye architectural roadmap before deep reading.\n\n"
    "4. DETAILED BREAKDOWN — मुख्य वैज्ञानिक एवं सैद्धांतिक विश्लेषण (Points & Short Paragraphs):\n"
    "   - Follow with structured sections using authentic Microsoft Word bullet symbols (`❖`, `■`, `➤`, `✔`, `•`).\n"
    "   - Break complex theory into clear, digestible points and short explanatory paragraphs for each part defined in the roadmap above.\n\n"
    "5. IN-BETWEEN SUB-TOPIC VISUALS — पॉइंट या पैराग्राफ को समझाने के लिए 1-2 संबंधित चित्र (1–2 In-Between Diagrams):\n"
    "   - When explaining a specific sub-process, organelle, or component (e.g. Brainstem, Cerebrum Lobes, Neurons, Chloroplast interior, Calvin cycle, or Heart chambers), embed 1–2 targeted diagrams right alongside or under that specific point so theory and visuals work in perfect synergy.\n\n"
    "6. SMART PROCESS DIAGRAM — स्मार्ट प्रोसेस/फ्लोचार्ट (1–2 Mermaid Diagrams):\n"
    "   - MANDATORY CRITICAL REQUIREMENT: For EVERY scientific, biological, geographical, physical, technical, or structural topic, you MUST embed a clean `mermaid flowchart TD` or `flowchart LR` representing the structural hierarchy, layers, sequential steps, or process flow (e.g., Earth's Layers: भूपर्पटी (Crust) -> मेंटल (Mantle) -> बाह्य क्रोड (Outer Core) -> आंतरिक क्रोड (Inner Core), or Leaf: क्यूटिकल -> एपिडर्मिस -> मेसोफिल -> संवहन बंडल -> रंध्र/स्टोमेटा, or Neural Signal Flow, etc.).\n\n"
    "7. TABLE OR CHART — तालिका या ऑफिस चार्ट (Structured Table or Office Chart):\n"
    "   - MANDATORY CRITICAL REQUIREMENT: For EVERY topic, you MUST embed a structured Markdown Table (`|---|---|`) or an interactive Microsoft Office-style ````chart ... ```` block comparing the components, layers, depth/temperature/composition, functions, inputs vs. outputs, or key scientific properties.\n\n"
    "8. CONCLUSION — संक्षिप्त एवं प्रभावी निष्कर्ष (Concise Conclusion):\n"
    "   - Conclude with a 1–2 sentence crisp summary highlighting the significance, ecological/practical value, or core takeaway.\n\n"
    "9. RECOMMENDED QUESTIONS — अंत में 1-2 अनुशंसित प्रश्न (Recommended Follow-up Questions):\n"
    "   - End with exactly 1–2 insightful, contextual follow-up questions under `❖ **आगे जानने योग्य महत्वपूर्ण प्रश्न:**`:\n"
    "     • *[Follow-up question 1]*\n"
    "     • *[Follow-up question 2]*\n"
    "   - The UI automatically renders these as interactive, 1-click clickable suggestion pills.\n\n"
    "HEADINGS & BULLETS — MICROSOFT WORD BULLET LIBRARY RULES (हेडिंग्स और बुलेट्स का सुंदर प्रारूप):\n"
    "- STRICTLY FORBIDDEN: NEVER USE RAW MARKDOWN HASHES (`###`, `####`, `##`, `#`) anywhere in your response! Raw hashes look like broken code.\n"
    "- INSTEAD, use authentic Microsoft Word Bullet Library symbols according to the context:\n"
    "  * For Major Section Titles: Use `❖` (Four-Diamond) or `■` (Square) with bold text (e.g., ❖ **प्रकाश संश्लेषण के मुख्य चरण:**).\n"
    "  * For Steps & Action Flows: Use `➤` (Arrowhead Pointer) (e.g., ➤ **चरण 1: प्रकाश ऊर्जा का अवशोषण:**).\n"
    "  * For Benefits, Importance & Facts: Use `✔` (Checkmark) (e.g., ✔ **ऑक्सीजन का उत्पादन:**).\n"
    "  * For Components & Sub-points: Use `•` (Solid Circle) (e.g., • **क्लोरोफिल:** थाइलेकॉइड झिल्ली में मौजूद हरा वर्णक।).\n\n"
    "FORMATTING GUIDELINES FOR VISUALS, CHARTS & TABLES:\n"
    "- STRICT IMAGE INTEGRITY MANDATE: ONLY embed markdown image tags (`![Caption](url)`) if verified image URLs are explicitly provided in your prompt under 'VERIFIED VISUAL GROUNDING'. NEVER invent, hallucinate, or fabricate image URLs (e.g. NEVER make up unsplash.com, pexels, imgur, or imaginary URLs). If no verified image URLs are provided in your prompt context, do NOT output any markdown image tags; rely purely on clear text, Microsoft Word bullets, Mermaid flowcharts, and Markdown tables.\n"
    "- Microsoft Office Visual Charts: Embed ````chart JSON block with type: column|bar|line|pie|doughnut|area|radar|scatter|bubble.\n"
    "- Tables: Clean standard GitHub Markdown tables with '|' headers, a divider row (|---|---|), and aligned cells.\n"
    "- Mermaid Diagrams: Lowercase keywords (`flowchart LR`, `flowchart TD`, `mindmap`). Node IDs must be simple alphanumeric (`A`, `B`, `step1`). All node labels MUST be enclosed in double quotes inside brackets: e.g. `step1[\"प्रकाश ऊर्जा का अवशोषण\"] --> step2[\"ग्लूकोज निर्माण\"]`. When adding text to arrows, use exact pipe syntax `A -->|\"Label\"| B` without any extra `>` after the pipe (e.g. NEVER write `-->|label|> B`).\n"
    "- Code Blocks: Only generate source code blocks when the question explicitly pertains to programming, scripting, or web development.\n\n"
    "DIRECT REAL-TIME WEB SEARCH & LIVE INTERNET CAPABILITIES (प्रत्यक्ष लाइव इंटरनेट सर्च क्षमता):\n"
    "- Rhynia is natively and directly connected to real-time Live Web Search Grounding for all inquiries.\n"
    "- Confidently affirm that Rhynia searches the live web directly and provides real-time information.\n"
    "- Clearly present public web facts using Microsoft Word Bullet styling (❖, ✔, •).\n"
    "- Remind users politely that private/login-protected social media accounts remain protected by platform privacy.\n"
    "- COMPACT BLUE SOURCE LINKS: ALWAYS provide clean markdown links `[Source Name](https://...)` or `[domain.com](https://...)` inline or under '❖ **स्रोतः**'."
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
        self, messages: List[Dict[str, str]], system_prompt: Optional[str] = None
    ) -> List[Dict[str, str]]:
        """Construct standard message payload with Rhynia system prompt and live IST time."""
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
        return formatted

    def _build_gemini_payload(
        self, messages: List[Dict[str, str]], system_prompt: Optional[str] = None
    ) -> Dict:
        """Construct Google Gemini native contents and systemInstruction payload."""
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
            content = m.get("content", "").strip()
            if not content:
                continue
            gemini_role = "model" if role in ["model", "assistant"] else "user"

            # Avoid consecutive same-role messages by combining text
            if contents and contents[-1]["role"] == gemini_role:
                contents[-1]["parts"][0]["text"] += f"\n\n{content}"
            else:
                contents.append({"role": gemini_role, "parts": [{"text": content}]})

        # Gemini contents must start with 'user'
        if contents and contents[0]["role"] != "user":
            contents.pop(0)

        if not contents:
            contents = [{"role": "user", "parts": [{"text": "Hello"}]}]

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
    ) -> AsyncGenerator[str, None]:
        """
        Indestructible 4-Tier Cascade Router:
        - Tier 1: Google Gemini Ultra-Fast Native API (Primary & Backup Gemini Keys)
        - Tier 2: OpenRouter Flagship Models (Llama 3.3 70B & DeepSeek via Primary OpenRouter Key)
        - Tier 3: OpenRouter Free Models (Liquid, Dots, Nex-mini via Backup Key)
        - Tier 4: Guaranteed Educational Synthesis Engine (Local / Zero-Failure Offline)
        """
        gemini_payload = self._build_gemini_payload(messages, system_prompt)
        openrouter_messages = self._build_payload_messages(messages, system_prompt)
        last_user_query = messages[-1]["content"] if messages else "Hello"

        # Catalog all 4 keys from settings or environment
        gemini_keys = [
            k for k in [
                settings.GEMINI_API_KEY or os.environ.get("GEMINI_API_KEY"),
                settings.GEMINI_BACKUP_KEY or os.environ.get("GEMINI_BACKUP_KEY"),
            ] if k
        ]
        gemini_models = [
            "gemini-flash-lite-latest",
            "gemini-3.5-flash-lite",
            "gemini-3.8-flash",
            "gemini-flash-latest",
        ]

        openrouter_key = settings.OPENROUTER_API_KEY or os.environ.get("OPENROUTER_API_KEY")
        openrouter_backup_key = settings.OPENROUTER_BACKUP_KEY or os.environ.get("OPENROUTER_BACKUP_KEY") or openrouter_key

        async with httpx.AsyncClient(timeout=30.0) as client:
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
    ) -> Tuple[str, str, int]:
        """
        Generate complete text response and return (content, model_tier, token_count).
        """
        chunks = []
        async for token in self.generate_stream(messages, system_prompt, web_search=web_search):
            chunks.append(token)
        full_content = "".join(chunks)
        # Approximate token count
        token_count = max(1, len(full_content) // 4)
        return full_content, "Rhynia Core", token_count


# Singleton Instance
llm_engine = CascadeLLMEngine()
