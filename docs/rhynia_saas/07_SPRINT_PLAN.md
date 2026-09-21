# SPRINT PLANNING — RHYNIA SAAS v1.0

> **Input:** PRD (`02_PRD.md`) + Architecture (`05_ARCHITECTURE.md`) + Tech Stack (`06_TECH_STACK.md`) ✅  
> **Output:** Sprint Backlog — छोटे-छोटे कामों की पूरी Task List  
> **Status:** APPROVED BY FOUNDER (Rhynia Intelligence)  
> **Version:** 1.0 Final | **Date:** 2026-09-21  
> **Execution Mode:** Solo Developer + Antigravity (AGY) AI Agent  
> **Hard Rule:** No `AI`, `ChatGPT`, `Gemini`, `Qwen`, `Founder: Manish Chaturvedi`, `bot`, or `assistant`. The brand is strictly **Rhynia**.

---

## 1️⃣ MVP चुनना (Minimum Viable Product Definition)

Rhynia v1.0 MVP में यही 5 चीज़ें पूरी होने पर Launch तैयार होगा:

| # | MVP Feature | Description |
|---|---|---|
| ✅ 1 | **Login Screen First** | App/Web खोलते ही सबसे पहले Login Screen (`07_login_screen.html`) दिखेगी (Token होने पर auto-chat) |
| ✅ 2 | **Main Chat Screen** | लॉगिन के बाद डायरेक्ट Chat Screen (Empty/Active state) + टोकन स्ट्रीमिंग रिस्पॉन्स |
| ✅ 3 | **File/Camera Attachment** | `(+)` button → Camera capture या Device File Manager |
| ✅ 4 | **Session Management** | Sidebar से Chat History, Pin, Rename, Delete |
| ✅ 5 | **Settings & Profile** | Full Settings + 500 MB/5 GB/25 GB Storage bar + Profile Avatar Edit |

**Later Sprints (v1.1+):**
- Razorpay Billing (Pro/Enterprise Plans)
- Android + iOS React Native Apps
- Desktop Electron App
- Redis Caching
- Admin Panel

---

## 2️⃣ MODULES को TASKS में तोड़ना

### Sprint 0 — Project Foundation
| Task | Layer | Owner | Time |
|---|---|---|---|
| Folder structure बनाना (`backend/`, `frontend/`, `database/`, `uploads/`) | DevOps | AGY | 0.5h |
| `backend/requirements.txt` लिखना (10 packages) | Backend | AGY | 0.5h |
| Python virtual environment activate करना (`../../ai_env/`) | DevOps | Founder | 0.5h |
| `backend/config.py` — सभी env vars + settings | Backend | AGY | 1h |
| `.env` file template बनाना (gitignored) | Backend | AGY | 0.5h |
| `README.md` — Run करने का तरीका | Docs | AGY | 1h |
| **Sprint 0 Total** | | | **4 hours** |

---

### Sprint 1 — Database + Auth Backend
| Task | Layer | Owner | Priority | Time |
|---|---|---|---|---|
| `backend/database.py` — 5 SQLAlchemy models (users, phone_otps, sessions, messages, user_files) | Database | AGY | P1 | 3h |
| Alembic migration setup + initial schema | Database | AGY | P1 | 1h |
| `backend/auth.py` — BCrypt hash/verify functions | Backend | AGY | P1 | 1h |
| `backend/auth.py` — JWT create + decode | Backend | AGY | P1 | 1h |
| `POST /api/v1/auth/register` endpoint | Backend | AGY | P1 | 1h |
| `POST /api/v1/auth/login` endpoint | Backend | AGY | P1 | 1h |
| `POST /api/v1/auth/google` — Google tokeninfo verify | Backend | AGY | P1 | 2h |
| `POST /api/v1/auth/phone/send-otp` — OTP generate | Backend | AGY | P1 | 1.5h |
| `POST /api/v1/auth/phone/verify-otp` — OTP verify + JWT | Backend | AGY | P1 | 1h |
| `POST /api/v1/auth/forgot-password` — Password reset trigger (Email/SMS) | Backend | AGY | P1 | 1h |
| `POST /api/v1/auth/reset-password` — Password update with OTP/token | Backend | AGY | P1 | 1h |
| `GET /api/v1/auth/me` — Token decode + user return | Backend | AGY | P1 | 0.5h |
| `GET /api/v1/health` — System status | Backend | AGY | P1 | 0.5h |
| Thunder Client से सभी Auth endpoints test करना | QA | Founder | P1 | 2h |
| **Sprint 1 Total** | | | | **17.5 hours** |

---

### Sprint 2 — Sessions + Chat Backend (Core Intelligence)

> **🔴 Founder Order (LOCKED):** "PAHLE FREE MODEL USE HOGA. JAB FREE QUOTA KHATAM, PAID USE TURANT."  
> Architecture: **OpenRouter Cascade Router** — Tier 1 Free → Tier 2 Paid Flash → Tier 3 Safety Reserve (HF/Groq)

#### 2A — LLM Engine (OpenRouter Cascade Router)
| Task | Layer | Owner | Priority | Time |
|---|---|---|---|---|
| `backend/llm_engine.py` — `ModelEngine` abstract base interface | Backend | AGY | P1 | 0.5h |
| `backend/llm_engine.py` — **Tier 1 Free Models** via OpenRouter: Chat (`qwen/qwen3.8-27b:free`), Vision (`google/gemini-2.5-pro-exp-03-25:free`), Code (`deepseek/deepseek-v4-flash:free`) | Backend | AGY | P1 | 2h |
| `backend/llm_engine.py` — **Tier 2 Paid Fallback** (auto-trigger on HTTP 429): Chat (`qwen/qwen-3-7-flash`), Vision (`google/gemini-2.5-flash`), Code (`deepseek/deepseek-v4-flash`) | Backend | AGY | P1 | 1.5h |
| `backend/llm_engine.py` — **Tier 3 Safety Reserve** (last resort): Groq `llama-3.3-70b-versatile` + HuggingFace `siyarajput/Rhynia-V3-VL-8B-Merged` | Backend | AGY | P1 | 1h |
| `backend/llm_engine.py` — Streaming response + SSE support | Backend | AGY | P1 | 1h |
| System Prompt injection (Zero Identity Leakage — kabhi "Rhynia" se bahar nahi) | Backend | AGY | P1 | 0.5h |

#### 2B — Session & Chat Endpoints
| Task | Layer | Owner | Priority | Time |
|---|---|---|---|---|
| `GET /api/v1/sessions` — Pinned + Recents list | Backend | AGY | P1 | 1h |
| `POST /api/v1/sessions` — New session create | Backend | AGY | P1 | 0.5h |
| `PATCH /api/v1/sessions/{pid}` — Rename + Pin toggle | Backend | AGY | P1 | 1h |
| `DELETE /api/v1/sessions/{pid}` — Single session delete | Backend | AGY | P1 | 0.5h |
| `DELETE /api/v1/sessions` — Clear all history | Backend | AGY | P2 | 0.5h |
| `GET /api/v1/sessions/{pid}/messages` — Message history | Backend | AGY | P1 | 1h |
| `POST /api/v1/chat` — Plan limit check + Last 10 context + LLM cascade call + save | Backend | AGY | P1 | 3h |
| `PATCH /api/v1/messages/{id}/rating` — Thumbs Up/Down save | Backend | AGY | P2 | 0.5h |

#### 2C — 3-Tier Plan Enforcement (Daily Limits)
| Task | Layer | Owner | Priority | Time |
|---|---|---|---|---|
| `backend/plan_limits.py` — Plan config: FREE (20 msg, 3 vision, 5 search/day), PRO (300/50/unlimited), ULTRA PRO (1000/unlimited/unlimited) | Backend | AGY | P1 | 1h |
| Daily counter reset logic (midnight IST rollover) | Backend | AGY | P1 | 0.5h |
| HTTP 429 response with plan upgrade message when limit hit | Backend | AGY | P1 | 0.5h |
| ₹10 Daily Pass — 24-hour timer logic + ULTRA PRO access grant | Backend | AGY | P1 | 1h |

#### 2D — Module 7: Live Search Service
| Task | Layer | Owner | Priority | Time |
|---|---|---|---|---|
| `backend/search_service.py` — DuckDuckGo web search → AI structured summary | Backend | AGY | P1 | 2h |
| `backend/search_service.py` — Google Places API → location/distance/nearby card | Backend | AGY | P1 | 1.5h |
| `backend/search_service.py` — YouTube Data API v3 → video search + AI summary | Backend | AGY | P1 | 1.5h |
| `backend/search_service.py` — Social Trends (Instagram/Facebook trending topics + hashtags) | Backend | AGY | P2 | 1.5h |
| `POST /api/v1/search` — Unified search endpoint (type: web/maps/youtube/social) | Backend | AGY | P1 | 1h |
| **Policy enforce:** Only Live Search + AI Summary + Direct Links. Koi video streaming nahi. | Backend | AGY | P1 | 0.25h |

#### 2E — Module 8: Study Export Service
| Task | Layer | Owner | Priority | Time |
|---|---|---|---|---|
| `backend/export_service.py` — PDF Generator via `reportlab` (PRO/ULTRA PRO only) | Backend | AGY | P1 | 2h |
| `backend/export_service.py` — PPT Slide Maker via `python-pptx` (PRO/ULTRA PRO only) | Backend | AGY | P1 | 2h |
| `POST /api/v1/export/pdf` — Chat → formatted PDF download | Backend | AGY | P1 | 1h |
| `POST /api/v1/export/ppt` — Chat → PowerPoint .pptx download | Backend | AGY | P1 | 1h |
| Plan gate: FREE users → HTTP 403 with upgrade prompt | Backend | AGY | P1 | 0.25h |

#### 2F — QA
| Task | Layer | Owner | Priority | Time |
|---|---|---|---|---|
| Thunder Client से Chat + Sessions + Search + Export endpoints test | QA | Founder | P1 | 3h |
| Verify cascade fallback: simulate 429 → check Tier 2 kicks in silently | QA | Founder | P1 | 1h |
| Verify plan limits: FREE user ko 21st message 429 mile | QA | Founder | P1 | 0.5h |

| **Sprint 2 Total** | | | | **~32 hours** |

---

### Sprint 3 — File Upload + Profile Backend
| Task | Layer | Owner | Priority | Time |
|---|---|---|---|---|
| `POST /api/v1/files/upload` — MIME check + UUID rename + save to `/uploads/{user_id}/` | Backend | AGY | P1 | 2h |
| `storage_used_bytes` update on every file upload | Backend | AGY | P1 | 0.5h |
| 500 MB quota enforcement (HTTP 413 on exceed) | Backend | AGY | P1 | 0.5h |
| `PATCH /api/v1/profile` — Name, username, theme, accent_color, language update | Backend | AGY | P1 | 1h |
| `POST /api/v1/profile/avatar` — Avatar image upload + URL save | Backend | AGY | P2 | 1.5h |
| Thunder Client से File + Profile endpoints test करना | QA | Founder | P1 | 1h |
| **Sprint 3 Total** | | | | **6.5 hours** |

---

### Sprint 4 — Frontend Web (Direct Chat Screen)
| Task | Layer | Owner | Priority | Time |
|---|---|---|---|---|
| `frontend/config.js` — `API_BASE = "/api/v1"` | Frontend | AGY | P1 | 0.25h |
| `frontend/style.css` — Design Tokens `:root` (colors, radius, shadows, fonts) | Frontend | AGY | P1 | 2h |
| `frontend/style.css` — Light + Dark Theme CSS classes | Frontend | AGY | P1 | 1.5h |
| `frontend/index.html` — Main Chat Screen HTML skeleton | Frontend | AGY | P1 | 1.5h |
| `frontend/index.html` — Sidebar Drawer HTML | Frontend | AGY | P1 | 1h |
| `frontend/index.html` — Full Settings Panel HTML | Frontend | AGY | P1 | 1.5h |
| `frontend/auth/` — 5 Auth Views (Sign In, Sign Up, SMS OTP, Email OTP, Forgot Password) from Ground Truth screens 07–11 | Frontend | AGY | P1 | 2.5h |
| `frontend/app.js` — AppState object (token, user, theme, session) | Frontend | AGY | P1 | 0.5h |
| `frontend/app.js` — API module (fetch wrapper with Bearer token) | Frontend | AGY | P1 | 1h |
| `frontend/app.js` — Auth module (login, register, Google, OTP, logout) | Frontend | AGY | P1 | 3h |
| `frontend/app.js` — Chat module (send, stream tokens, markdown render) | Frontend | AGY | P1 | 3h |
| `frontend/app.js` — Response Action Buttons (Copy, Speaker TTS, 👍, 👎, Share) | Frontend | AGY | P1 | 2h |
| `frontend/app.js` — Sidebar module (draw, search, Long-press context menu) | Frontend | AGY | P1 | 2.5h |
| `frontend/app.js` — 3-Dot Top Menu (Share, Pin, Find, Delete) | Frontend | AGY | P2 | 1h |
| `frontend/app.js` — `(+)` button → Camera + File Manager attachment | Frontend | AGY | P1 | 1.5h |
| `frontend/app.js` — Settings module (theme toggle, accent color, language, storage bar) | Frontend | AGY | P1 | 2h |
| Responsive testing: 320px, 768px, 1024px, 1440px | QA | Founder | P1 | 2h |
| Banned word audit (no AI/ChatGPT/Gemini/Founder name anywhere in code) | QA | Founder | P1 | 0.5h |
| **Sprint 4 Total** | | | | **30.25 hours** |

---

### Sprint 5 — Integration + Testing + Launch
| Task | Layer | Owner | Priority | Time |
|---|---|---|---|---|
| End-to-end test: Landing on Login Screen → Auth (Email/Google/Phone OTP) → Chat → History → Sidebar Long-press → Settings → Logout (Redirects to Login) | QA | Founder | P1 | 3h |
| End-to-end test: Register via Email → Login → Chat → File Upload → Profile Update | QA | Founder | P1 | 2h |
| End-to-end test: Google OAuth flow | QA | Founder | P1 | 1h |
| End-to-end test: Phone OTP flow | QA | Founder | P1 | 1h |
| 500 MB storage limit test (upload files till limit hit → expect 413) | QA | Founder | P1 | 1h |
| PWA Manifest + Service Worker (Offline support) | Frontend | AGY | P2 | 2h |
| `supabase_schema.sql` — PostgreSQL migration script | Database | AGY | P1 | 1.5h |
| Deploy Backend → Render.com | DevOps | Founder | P1 | 2h |
| Deploy Frontend → Vercel | DevOps | Founder | P1 | 1h |
| Connect Supabase PostgreSQL to deployed backend | DevOps | Founder | P1 | 1h |
| Domain setup (`rhynia.ai`) → SSL certificate verify | DevOps | Founder | P1 | 1h |
| Final Security Audit (CORS origins, .env not exposed, RBAC checks) | Security | AGY | P1 | 1.5h |
| **Sprint 5 Total** | | | | **18 hours** |

---

## 3️⃣ SPRINT CYCLES (Timeline Overview)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ SPRINT 0 ─ Foundation                    │ ~4 hours  │ Day 1 (Morning)      │
│   Folder structure, config, requirements │           │                      │
├─────────────────────────────────────────────────────────────────────────────┤
│ SPRINT 1 ─ Database + Auth Backend       │ ~17.5 hrs │ Day 1-3              │
│   5 DB models, 7 auth endpoints (incl.   │           │                      │
│   forgot-password + reset-password)      │           │                      │
├─────────────────────────────────────────────────────────────────────────────┤
│ SPRINT 2 ─ Core Intelligence Backend     │ ~32 hours │ Day 3-8              │
│   OpenRouter Cascade (3-tier), Sessions, │           │                      │
│   Chat, Plan Limits, Search, PDF/PPT     │           │                      │
├─────────────────────────────────────────────────────────────────────────────┤
│ SPRINT 3 ─ File Upload + Profile         │ ~6.5 hours│ Day 8-9              │
│   500 MB/5 GB/25 GB quota, profile APIs  │           │                      │
├─────────────────────────────────────────────────────────────────────────────┤
│ SPRINT 4 ─ Frontend Web (All 11 Screens) │ ~30.25 hrs│ Day 9-13             │
│   HTML, CSS, JS — 11 screens incl. 5     │           │                      │
│   auth views (07–11) complete             │           │                      │
├─────────────────────────────────────────────────────────────────────────────┤
│ SPRINT 5 ─ Integration + Testing + Launch│ ~18 hours │ Day 13-15            │
│   E2E tests, deploy to Render + Vercel   │           │                      │
└─────────────────────────────────────────────────────────────────────────────┘
TOTAL ESTIMATED EFFORT: ~108 hours  |  TARGET: Web App Live in ~15 Working Days
```

---

## 4️⃣ PRIORITY तय करना

| Priority | Label | Description | Sprints |
|---|---|---|---|
| **P1 (Highest)** | 🔴 Critical | बिना इसके MVP काम नहीं करेगा | Sprint 0,1,2,3,4,5 |
| **P2 (High)** | 🟠 Important | MVP में होना चाहिए, लेकिन workaround संभव | Sprint 2,3,4 |
| **P3 (Medium)** | 🟡 Later | v1.1 में जाएगा (Razorpay, Export PDF/PPT) | Future |
| **P4 (Low)** | 🟢 Backlog | Android/iOS/Desktop Apps, Admin Panel | Phase 2+ |

---

## 5️⃣ जिम्मेदारी देना (Ownership Assignment)

| Layer | Owner | Tools Used |
|---|---|---|
| **Backend** | AGY (Antigravity AI) | Python, FastAPI, SQLAlchemy |
| **Frontend** | AGY (Antigravity AI) | HTML, CSS, Vanilla JS |
| **Database Schema** | AGY (Antigravity AI) | SQLAlchemy ORM, Alembic |
| **API Testing & QA** | Founder (Rhynia Intelligence) | Thunder Client, Browser |
| **Deployment** | Founder (Rhynia Intelligence) | Render, Vercel, Supabase |
| **Final Security Audit** | AGY + Founder | Manual code review |

---

## 6️⃣ TIME ESTIMATION (Realistic Estimates)

| Sprint | Tasks Count | Estimated Time | Realistic Completion |
|---|---|---|---|
| Sprint 0 | 6 tasks | 4 hours | Day 1 (half day) |
| Sprint 1 | 14 tasks | 17.5 hours | Day 1–3 |
| Sprint 2 | 35+ tasks | ~32 hours | Day 3–8 |
| Sprint 3 | 6 tasks | 6.5 hours | Day 8–9 |
| Sprint 4 | 18 tasks | 30.25 hours | Day 9–13 |
| Sprint 5 | 12 tasks | 18 hours | Day 13–15 |
| **TOTAL** | **91+ tasks** | **~108 hours** | **~15 working days** |

---

## 7️⃣ SPRINT BOARD (Kanban Tracker)

| Status | Meaning | Symbol |
|---|---|---|
| **To Do** | अभी शुरू नहीं हुआ | `[ ]` |
| **In Progress** | काम चल रहा है | `[/]` |
| **Review** | Test / Code Review चल रही है | `[?]` |
| **Done** | पूरी तरह complete और verified | `[x]` |

### Current Board Status:
```
SPRINT 0 — Foundation
  [x] Folder structure बनाना
  [x] requirements.txt
  [x] config.py
  [x] .env template
  [x] README.md

SPRINT 1 — Database + Auth Backend
  [ ] database.py — 5 models
  [ ] auth.py — BCrypt functions
  [ ] auth.py — JWT functions
  [ ] POST /auth/register
  [ ] POST /auth/login
  [ ] POST /auth/google
  [ ] POST /auth/phone/send-otp
  [ ] POST /auth/phone/verify-otp
  [ ] POST /auth/forgot-password
  [ ] POST /auth/reset-password
  [ ] GET /auth/me
  [ ] GET /health
  [ ] Thunder Client tests ✓

SPRINT 2 — Core Intelligence Backend (OpenRouter Cascade + Search + Export)
  --- 2A: LLM Engine ---
  [ ] llm_engine.py — ModelEngine abstract interface
  [ ] llm_engine.py — Tier 1: Free models (Chat/Vision/Code via OpenRouter)
  [ ] llm_engine.py — Tier 2: Paid fallback on HTTP 429 (Chat/Vision/Code)
  [ ] llm_engine.py — Tier 3: Safety reserve (Groq + HuggingFace)
  [ ] llm_engine.py — Streaming SSE support
  [ ] System Prompt injection (Zero Identity Leakage)
  --- 2B: Session & Chat ---
  [ ] GET /sessions
  [ ] POST /sessions
  [ ] PATCH /sessions/{pid}
  [ ] DELETE /sessions/{pid}
  [ ] DELETE /sessions (all)
  [ ] GET /sessions/{pid}/messages
  [ ] POST /chat (cascade + plan limit check)
  [ ] PATCH /messages/{id}/rating
  --- 2C: Plan Limits ---
  [ ] plan_limits.py — FREE/PRO/ULTRA PRO config
  [ ] Daily counter reset (midnight IST)
  [ ] HTTP 429 on limit exceeded
  [ ] ₹10 Daily Pass 24hr timer logic
  --- 2D: Search Service ---
  [ ] search_service.py — DuckDuckGo web search
  [ ] search_service.py — Google Maps/Places
  [ ] search_service.py — YouTube AI summary
  [ ] search_service.py — Social trends (Insta/FB)
  [ ] POST /search endpoint
  --- 2E: Export Service ---
  [ ] export_service.py — PDF (reportlab)
  [ ] export_service.py — PPT (python-pptx)
  [ ] POST /export/pdf
  [ ] POST /export/ppt
  [ ] FREE user gate (HTTP 403)
  --- 2F: QA ---
  [ ] Thunder Client full endpoint tests
  [ ] Cascade fallback simulation test
  [ ] Plan limit enforcement test

SPRINT 3 — File Upload + Profile
  [ ] POST /files/upload (500MB quota)
  [ ] storage_used_bytes update
  [ ] HTTP 413 enforcement
  [ ] PATCH /profile
  [ ] POST /profile/avatar

SPRINT 4 — Frontend Web
  [ ] config.js
  [ ] style.css (Design Tokens)
  [ ] style.css (Light/Dark themes)
  [ ] index.html (Chat Screen)
  [ ] index.html (Sidebar)
  [ ] index.html (Settings Panel)
  [ ] Auth Flow Screens (07_Sign In, 08_Sign Up, 09_SMS OTP, 10_Email OTP, 11_Forgot Password)
  [ ] app.js (AppState)
  [ ] app.js (API module)
  [ ] app.js (Auth module)
  [ ] app.js (Chat module)
  [ ] app.js (Action Buttons)
  [ ] app.js (Sidebar module)
  [ ] app.js (3-Dot Menu)
  [ ] app.js ((+) Attachments)
  [ ] app.js (Settings module)
  [ ] Responsive tests
  [ ] Banned word audit

SPRINT 5 — Integration + Launch
  [ ] E2E: Landing on Login Screen → Auth → Chat
  [ ] E2E: Email Register + Chat
  [ ] E2E: Google OAuth
  [ ] E2E: Phone OTP
  [ ] 500MB limit test
  [ ] PWA Manifest + Service Worker
  [ ] supabase_schema.sql
  [ ] Deploy → Render (Backend)
  [ ] Deploy → Vercel (Frontend)
  [ ] Connect Supabase DB
  [ ] Domain + SSL
  [ ] Security Audit
```

---

## 8️⃣ SPRINT GOALS (हर Sprint का लक्ष्य)

| Sprint | Goal Statement |
|---|---|
| **Sprint 0** | "Folder structure ready, Python environment active, config और requirements file तैयार। Backend server `python main.py` से start हो सके।" |
| **Sprint 1** | "इस Sprint के अंत तक User Email/Google/Phone OTP से Register और Login कर सके। JWT token मिले। `/health` endpoint green दिखे।" |
| **Sprint 2** | "इस Sprint के अंत तक User Rhynia से Chat कर सके। OpenRouter Cascade 3-tier काम करे (Free→Paid→Reserve)। Sessions बनें/list/delete हों। Plan limits enforce हों (FREE=20, PRO=300, ULTRA=1000 msg/day)। Live Search (Web+Maps+YouTube+Social) काम करे। PRO users PDF+PPT download कर सकें।" |
| **Sprint 3** | "इस Sprint के अंत तक User Camera से photo या Device File Manager से document upload कर सके। 500 MB limit enforce हो।" |
| **Sprint 4** | "इस Sprint के अंत तक Browser में Rhynia का पूरा UI — Chat Screen, Sidebar, Settings Panel — बिल्कुल Design System के अनुसार, सभी 4 screens working हों।" |
| **Sprint 5** | "इस Sprint के अंत तक Rhynia Web App live हो — Render पर Backend, Vercel पर Frontend, Supabase पर Database। कोई भी real user chat कर सके।" |

---

## 9️⃣ AI के साथ SOLO DEVELOPER EXECUTION

**Working Style (AGY + Founder Workflow):**

```
Step 1: Founder → Sprint Task select करो
Step 2: AGY → उस task का complete, production-ready code लिखेगा
Step 3: Founder → Thunder Client / Browser में test करेगा
Step 4: AGY → कोई bug मिला तो तुरंत fix करेगा
Step 5: Founder → Board में Task [x] Done mark करेगा
Step 6: Repeat — अगला Task
```

**Execution Rules (No Exceptions):**
1. **Database पहले, Backend दूसरा, Frontend तीसरा।** यह sequence कभी नहीं टूटेगा।
2. हर Sprint complete होने पर Thunder Client / Browser से verify ज़रूर होगा।
3. **Banned words की जाँच** हर Sprint के अंत में होगी।
4. `main.py` में कभी UI code नहीं जाएगा — सिर्फ़ API routes।
5. `index.html` में कभी inline JavaScript नहीं जाएगी — सब `app.js` में।

---

> **SPRINT PLAN LOCKED 🔒 — Step 8 (Coding) के लिए तैयार।**  
> **अगला कदम: Sprint 0 शुरू — Folder Structure + Config + Requirements**
