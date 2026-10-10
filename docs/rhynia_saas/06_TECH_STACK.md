# TECH STACK SELECTION — RHYNIA SAAS v1.0

> **Input:** Architecture Blueprint (`05_ARCHITECTURE.md`) ✅  
> **Output:** पूरी Technology Stack की Final Confirmed सूची  
> **Status:** APPROVED BY FOUNDER (Rhynia Intelligence)  
> **Version:** 1.0 Final | **Date:** 2026-09-21  
> **Platforms:** Web App + Android App + iOS App + Desktop App  
> **Hard Rule:** No `AI`, `ChatGPT`, `Gemini`, `Qwen`, `Founder: Manish Chaturvedi`, `bot`, or `assistant`. The brand is strictly **Rhynia**.

---

## 1️⃣ PLATFORM तय करना

Rhynia SaaS 4 सभी प्रमुख Platforms पर चलेगा:

| Platform | Target | Technology Approach |
|---|---|---|
| 🌐 **Web App** | Browser (Chrome, Safari, Firefox, Edge) | Vanilla HTML + CSS + JS → PWA (Progressive Web App) |
| 🤖 **Android App** | Android 9.0+ (API 28+) | React Native |
| 🍎 **iOS App** | iOS 15.0+ (iPhone / iPad) | React Native |
| 🖥️ **Desktop App** | Windows 10+ / macOS 12+ | Electron (wrapping the Web App) |

> **Founder Decision — Cross-Platform Strategy:**
> React Native को Android और iOS दोनों के लिए चुना गया है ताकि एक ही codebase से दोनों platforms cover हों।
> Electron से Desktop App भी Web frontend को wrap करके बनेगा।

---

## 2️⃣ FRONTEND TECHNOLOGY (User Interface)

### 2.1 Web App (Primary)
| Technology | Version | क्यों चुना |
|---|---|---|
| **HTML5** | Latest | Semantic structure, PWA-ready |
| **CSS3** | Latest | Custom Properties (Design Tokens), Flexbox, Grid, Animations |
| **Vanilla JavaScript** | ES2022+ | Zero build step, zero framework overhead, instant load |
| **PWA (Progressive Web App)** | — | Service Worker से Offline support, Home Screen install on Mobile |

> **Framework क्यों नहीं:**
> React/Next.js जैसे frameworks में heavy build pipeline होता है।
> Rhynia का Web frontend इतना clean और minimal है कि Vanilla JS पूरी तरह काफ़ी है।
> बाद में ज़रूरत पड़े तो React में migrate करना आसान है — backend का 1 line भी नहीं बदलेगा।

---

### 2.2 Android + iOS App (Cross-Platform Mobile)
| Technology | Version | क्यों चुना |
|---|---|---|
| **React Native** | 0.74+ | एक codebase → Android + iOS दोनों। JavaScript knowledge reuse होती है। |
| **TypeScript** | 5.x | Type-safety, बेहतर IDE support, कम runtime bugs |
| **React Navigation** | 6.x | Screen navigation (Stack, Tab, Drawer) |
| **AsyncStorage** | — | JWT token local storage on mobile |
| **React Native Camera** | — | Camera capture feature (Screen 1 → `+` button → Camera) |
| **React Native Document Picker** | — | Device File Manager feature (Screen 1 → `+` button → Files) |
| **React Native TTS** | — | Text-to-Speech (Speaker button 🔊) |
| **React Native Haptics** | — | Long-press haptic feedback on chat history items |

---

### 2.3 Desktop App (Windows / macOS)
| Technology | Version | क्यों चुना |
|---|---|---|
| **Electron** | 30.x | Web App (HTML/CSS/JS) को बिना extra code के Desktop App में wrap करता है। |
| **Electron Builder** | — | Windows `.exe` installer और macOS `.dmg` bundle बनाने के लिए। |

> **Electron Strategy:** Frontend का `index.html` सीधे Electron window में load होगा।
> `config.js` में `API_BASE` = production API URL।
> कोई extra Desktop-specific code नहीं।

---

## 3️⃣ BACKEND TECHNOLOGY (Server & Business Logic)

| Technology | Version | क्यों चुना |
|---|---|---|
| **Python** | 3.11+ | Simple, readable, fastest prototyping speed |
| **FastAPI** | 0.111+ | Modern async Python framework। Automatic OpenAPI docs। Zero boilerplate। |
| **Uvicorn** | 0.29+ | ASGI server — production-grade, fast async request handling |
| **Gunicorn** | 22.x | Multi-worker process manager (Production: 4 workers) |
| **Pydantic** | 2.x | Request/Response validation, auto type checking |
| **BCrypt** | 4.x | Industry-standard password hashing (72-byte safe) |
| **PyJWT** | 2.8+ | JWT HS256 token create & decode |
| **SQLAlchemy** | 2.x | ORM for SQLite/PostgreSQL — parameterized queries only, zero raw SQL |
| **Alembic** | 1.13+ | Database migration management |
| **HTTPX** | 0.27+ | Async HTTP client for calling HuggingFace/Groq APIs |
| **python-multipart** | — | File upload (`multipart/form-data`) support |
| **python-dotenv** | — | `.env` file loading for local development |

| **duckduckgo-search** | 6.x+ | Real-time live web search (₹0 API cost) |
| **reportlab** | 4.x+ | Markdown to PDF notes export generator |
| **python-pptx** | 0.6+ | Automated PowerPoint slide maker |

### `requirements.txt` (Final — 13 packages):
```
fastapi>=0.111.0
uvicorn[standard]>=0.29.0
sqlalchemy>=2.0.0
alembic>=1.13.0
bcrypt>=4.0.0
pyjwt>=2.8.0
httpx>=0.27.0
pydantic>=2.0.0
python-multipart>=0.0.9
python-dotenv>=1.0.0
duckduckgo-search>=6.0.0
reportlab>=4.0.0
python-pptx>=0.6.21
```

---

## 4️⃣ DATABASE TECHNOLOGY

| Database | Environment | क्यों चुना |
|---|---|---|
| **SQLite** | Local Development | Zero config, file-based, instant setup। Dev PC पर perfect। |
| **Supabase (PostgreSQL)** | Production | Managed PostgreSQL। Free tier 500 MB। Auto-backups। Connection pooling। |
| **Redis** | Future (Phase 2) | JWT cache, session rate-limiting। Phase 1 में ज़रूरत नहीं। |

### Migration Strategy (Zero Code Change):
```bash
# Development (.env)
RHYNIA_DATABASE_URL=sqlite:///./database/rhynia.db

# Production (.env)
RHYNIA_DATABASE_URL=postgresql://user:password@host:5432/rhynia
```
SQLAlchemy के ज़रिए एक URL बदलने से पूरा database switch हो जाता है। Backend का 1 line नहीं बदलेगा।

---

## 5️⃣ CLOUD & DEPLOYMENT TECHNOLOGY

| Component | Development | Production |
|---|---|---|
| **Backend Hosting** | Local `uvicorn main:app --port 8000` | **Render.com** (Free tier → Paid as traffic grows) |
| **Frontend Hosting** | Local `python -m http.server 3000` | **Vercel** (Static → CDN globally distributed) |
| **Database** | SQLite file (`.db`) | **Supabase** (Managed PostgreSQL) |
| **File Storage** | Local `/uploads/` folder | **Cloudflare R2** (S3-compatible, cheap, fast) |
| **Android App** | Android Studio Emulator | **Google Play Store** |
| **iOS App** | Xcode Simulator | **Apple App Store** |
| **Desktop App** | Local Electron run | **GitHub Releases** (`.exe` / `.dmg` download links) |
| **Domain** | `localhost` | `rhynia.ai` (या Founder's chosen domain) |
| **SSL/HTTPS** | Self-signed (dev) | Auto-provided by Render + Vercel |
| **CI/CD** | Manual | **GitHub Actions** (Auto-deploy on `git push main`) |

---

## 6️⃣ DEVELOPMENT & ENGINEERING TOOLS

| Category | Tool | Purpose |
|---|---|---|
| **Code Editor** | **VS Code** | Primary development environment |
| **VS Code Extensions** | Python, Pylance, Prettier, ES Lint, REST Client | Code quality & developer experience |
| **Version Control** | **Git** | Source code history and branching |
| **Remote Repository** | **GitHub** | Code hosting, collaboration, CI/CD |
| **API Testing** | **Thunder Client** (VS Code Extension) | REST API endpoint testing during development |
| **Database Viewer** | **DB Browser for SQLite** | Visual inspection of SQLite database during development |
| **Design Reference** | **Stitch Fluent UI Screens** (`docs/rhynia_saas/ui_screens/`) | UI/UX visual PNGs & HTML reference for frontend developers |
| **Environment Vars** | **`.env` file** + **dotenv** | Secret management in development |
| **Python Virtual Env** | `../../ai_env/` (relative path) | Isolated Python dependency environment |
| **Linting** | **Flake8** | Python code style enforcement |
| **Dependency Management** | `pip` + `requirements.txt` | Backend package management |

### VS Code Settings (Recommended `.vscode/settings.json`):
```json
{
  "editor.formatOnSave": true,
  "editor.tabSize": 4,
  "python.defaultInterpreterPath": "../../ai_env/Scripts/python.exe",
  "editor.rulers": [88]
}
```

---

## 7️⃣ AI TOOLS (Development Accelerators)

| Tool | Role in Building Rhynia |
|---|---|
| **Antigravity (AGY)** | Primary Coding Agent — Documentation, Code Generation, Debugging |
| **OpenRouter API (Primary Engine)** | Multi-tier AI Routing Engine (Qwen 3.8 27B, DeepSeek V4 Flash, Gemini 2.5 Pro Free + Flash Fallback) |
| **HuggingFace Inference API** | Custom Finetuned Engine — `siyarajput/Rhynia-V3-VL-8B-Merged` |
| **Groq API** | Backup Ultra-fast LLM inference (`llama-3.3-70b-versatile`) |
| **GitHub Copilot** | Optional inline code suggestions in VS Code |
| **Postman AI** | API documentation generation |

### Inference Engine Credentials & Tier Strategy (Production-Ready):
```bash
# OpenRouter API (Primary Smart Cascade Router)
RHYNIA_OPENROUTER_KEY=sk-or-v1-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
# Free Models Tier (Priority 1 — $0.00 Cost):
RHYNIA_MODEL_CHAT_FREE=qwen/qwen3.8-27b:free
RHYNIA_MODEL_VISION_FREE=google/gemini-2.5-pro-exp-03-25:free
RHYNIA_MODEL_CODE_FREE=deepseek/deepseek-v4-flash:free

# Ultra-Cheap Paid Fallback Tier (Priority 2 — Auto-failover on 429/Rate Limit):
RHYNIA_MODEL_CHAT_FALLBACK=qwen/qwen-3-7-flash          # $0.03 / 1M tokens
RHYNIA_MODEL_VISION_FALLBACK=google/gemini-2.5-flash    # $0.075 / 1M tokens
RHYNIA_MODEL_CODE_FALLBACK=deepseek/deepseek-v4-flash   # $0.07 / 1M tokens

# HuggingFace & Groq (Safety Valve Backup)
RHYNIA_HF_TOKEN=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
RHYNIA_HF_MODEL=siyarajput/Rhynia-V3-VL-8B-Merged
RHYNIA_GROQ_KEY=your-groq-api-key-here
RHYNIA_GROQ_MODEL=llama-3.3-70b-versatile
```

> **फाउंडर का अटूट नियम (Instant Free-to-Paid Switch):**  
> पहली प्राथमिकता हमेशा **100% Free मॉडल्स** (`:free`) की रहेगी। जैसे ही OpenRouter पर मुफ़्त कोटा समाप्त (HTTP 429 Rate Limit) या सर्वर व्यस्त (503) होगा, Rhynia बैकएंड उसी मिलीसेकंड में बिना यूज़र को कोई एरर दिखाए **Ultra-Cheap Paid मॉडल्स** पर तुरंत स्विच कर लेगा। यूज़र के लिए यह प्रोसेस 100% सीमलेस रहेगा।

---

## 8️⃣ FINAL TECH STACK DOCUMENT (सम्पूर्ण सूची)

### Master Stack Table:

| भाग | चुनी गई Technology | Version |
|---|---|---|
| **Web Frontend** | Vanilla HTML5 + CSS3 + JavaScript (ES2022) | Latest |
| **PWA (Web Mobile)** | Service Worker + Web App Manifest | — |
| **Android App** | React Native + TypeScript | 0.74+ |
| **iOS App** | React Native + TypeScript | 0.74+ |
| **Desktop App** | Electron (wrapping Web App) | 30.x |
| **Backend Language** | Python | 3.11+ |
| **Backend Framework** | FastAPI + Uvicorn + Gunicorn | 0.111+ |
| **Validation** | Pydantic v2 | 2.x |
| **ORM** | SQLAlchemy | 2.x |
| **DB Migration** | Alembic | 1.13+ |
| **Auth** | BCrypt + PyJWT (HS256) | 4.x / 2.8+ |
| **HTTP Client** | HTTPX (Async) | 0.27+ |
| **Database (Dev)** | SQLite | Built-in |
| **Database (Prod)** | Supabase (PostgreSQL) | — |
| **Cache (Future)** | Redis | — |
| **File Storage (Dev)** | Local `/uploads/` folder | — |
| **File Storage (Prod)** | Cloudflare R2 | — |
| **Frontend Host** | Vercel (CDN) | — |
| **Backend Host** | Render.com | — |
| **CI/CD** | GitHub Actions | — |
| **Android Distribution** | Google Play Store | — |
| **iOS Distribution** | Apple App Store | — |
| **Desktop Distribution** | GitHub Releases | — |
| **API Style** | RESTful JSON (`/api/v1/`) | — |
| **Inference Engine** | OpenRouter (Smart Cascade Router) + HuggingFace + Groq | — |
| **Primary Free Models** | `qwen/qwen3.8-27b:free` (Chat/Hindi) + `google/gemini-2.5-pro-exp-03-25:free` (Vision) | — |
| **Paid Fallback Models** | `qwen/qwen-3-7-flash` ($0.03/M) + `google/gemini-2.5-flash` ($0.075/M) | — |
| **Code Editor** | VS Code | — |
| **Version Control** | Git + GitHub | — |
| **API Testing** | Thunder Client (VS Code) | — |
| **DB Viewer** | DB Browser for SQLite | — |
| **Python Environment** | `../../ai_env/` (Virtual Env) | — |

---

### Platform Launch Sequence (आधिकारिक क्रम — Founder Approved):

| क्रम (Phase) | प्लेटफ़ॉर्म | फॉर्म-फैक्टर / डिवाइस | डिलीवरी माध्यम | प्राथमिकता |
|:---:|---|---|---|---|
| **Phase 1 (अभी)** 🥇 | **Mobile Web App + PWA** | **Mobile (स्मार्टफ़ोन 360–430px)** | सीधा URL + PWA (Add to Home Screen) | **सर्वोच्च (सबसे पहले यही बनेगा)** |
| **Phase 2** 🥈 | **Android App** | Mobile (Android Phones) | Google Play Store (`.aab` / `.apk`) | Web stable होने के तुरंत बाद |
| **Phase 3** 🥉 | **Desktop Software** | PC / Laptop (Windows / macOS) | `.exe` व `.dmg` इंस्टॉलर (Electron) | Web कोड को wrap करके |
| **Phase 4** 🏅 | **iOS App** | iPhone / iPad | Apple App Store / TestFlight | Android के साथ/बाद |

> **मोबाइल-फर्स्ट रणनीति के 3 अटूट नियम:**  
> 1. **स्मार्टफ़ोन डिज़ाइन सबसे पहले**: फ़्रंटएंड UI ठीक उन 6 सेव्ड स्क्रीन्स (`docs/rhynia_saas/ui_screens/`) के मोबाइल लेआउट पर बनेगा।  
> 2. **तुरंत मोबाइल टेस्टिंग**: PWA के माध्यम से बिना ऐप स्टोर डिले के सीधे मोबाइल फ़ोन में असली ऐप की तरह चलेगा।  
> 3. **यूनिवर्सल बैकएंड**: बैकएंड API (FastAPI) ऐसी बनेगी जो भविष्य में चारों प्लेटफ़ॉर्म्स पर बिना 1 लाइन बदले सीधे कनेक्ट होगी।

---

> **TECH STACK LOCKED 🔒**  
> Input (Architecture) → Tech Stack Selection → Output (Final Stack)  
> अगला Step 7: Sprint Planning → फिर Step 8: Coding शुरू!
