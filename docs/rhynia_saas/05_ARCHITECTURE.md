# SYSTEM ARCHITECTURE BLUEPRINT — RHYNIA SAAS v1.0

> **Input:** PRD (`02_PRD.md`) + UI/UX Design (`04_UI_UX.md`) ✅  
> **Output:** Frontend, Backend, Database, API और Cloud का पूरा Blueprint  
> **Status:** APPROVED BY FOUNDER (Rhynia Intelligence)  
> **Version:** 1.0 Final | **Date:** 2026-09-21  
> **Hard Rule (Banned Words):** No `AI`, `ChatGPT`, `Gemini`, `Qwen`, `Founder: Manish Chaturvedi`, `bot`, or `assistant`. The brand is strictly **Rhynia**.

---

## 1️⃣ SOFTWARE को हिस्सों में बाँटना (System Decomposition)

Rhynia SaaS 4 बड़े, पूरी तरह अलग हिस्सों में बँटा हुआ है। कोई भी हिस्सा दूसरे पर Direct Dependent नहीं है:

```
┌──────────────────────────────────────────────────────────────────────────┐
│                           RHYNIA SAAS SYSTEM                            │
│                                                                          │
│   ┌───────────────────┐           ┌───────────────────────────────────┐  │
│   │   FRONTEND LAYER  │           │         BACKEND LAYER             │  │
│   │                   │  HTTP/JSON│                                   │  │
│   │  HTML, CSS, JS    │◄─────────►│  Python + FastAPI                 │  │
│   │  (Vanilla Stack)  │  /api/v1/ │  Business Logic & Validation      │  │
│   │                   │           │                                   │  │
│   │  • Login Screen (07) First        │           │  • Auth Module                    │  │
│   │  • Sign Up / OTP (08–11)          │           │  • Session Module                 │  │
│   │  • Main Chat UI (01/02)           │           │  • Chat / LLM Module              │  │
│   │  • Sidebar & Settings (04/05)     │           │  • File Upload Module             │  │
│   └───────────────────┘           │  • Profile Module                 │  │
│                                   └──────────────┬────────────────────┘  │
│                                                  │                        │
│                               ┌──────────────────▼────────────────────┐  │
│                               │          DATABASE LAYER               │  │
│                               │                                       │  │
│                               │  SQLite (Dev) → Supabase (Production) │  │
│                               │  • users         • sessions           │  │
│                               │  • phone_otps    • messages           │  │
│                               │  • user_files                        │  │
│                               └──────────────────┬────────────────────┘  │
│                                                  │                        │
│                               ┌──────────────────▼────────────────────┐  │
│                               │     INFERENCE ENGINE LAYER            │  │
│                               │                                       │  │
│                               │  OpenRouter Cascade Router (Primary)  │  │
│                               │  • Tier 1: Free (Qwen 3.8 / Gemini)   │  │
│                               │  • Tier 2: Cheap Flash ($0.03-$0.07)  │  │
│                               │  HuggingFace / Groq (Safety Backup)   │  │
│                               └───────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────┘
```

**सुनहरा नियम:**
- **Frontend** कभी Database या Inference Engine को सीधे छू नहीं सकता।
- **Backend** कभी HTML/UI नहीं बनाएगा — सिर्फ़ JSON देगा।
- **Database** सिर्फ़ Backend के ORM queries से ही interact करेगा — कोई raw SQL नहीं।

---

## 2️⃣ MODULES तय करना (Modular Breakdown)

Rhynia का पूरा सॉफ्टवेयर 8 स्पष्ट, स्वतंत्र (Independent) Modules में बँटा है:

### MODULE 1: Authentication & Onboarding Module (पहचान, लॉगिन और सुरक्षा — FIRST SCREEN)
> **🔴 Founder Order (LOCKED):** ऐप खुलते ही सबसे पहले **Login Screen (Screen 07)** दिखेगी। यदि यूजर के पास वैध टोकन है तभी Chat Screen खुलेगी।

| Component | ज़िम्मेदारी |
|---|---|
| `auth.py` (Backend) | Google OAuth verification, BCrypt hashing, JWT create/decode, Phone OTP generate/verify, Forgot/Reset password |
| `Auth` (Frontend JS) | Route Gate: Token check → No token? Show Login Screen (07). Token valid? Auto-redirect to Chat. Token store in localStorage, auto-attach Bearer header, logout clear |
| **APIs** | `/api/v1/auth/register`, `/login`, `/google`, `/phone/send-otp`, `/phone/verify-otp`, `/forgot-password`, `/reset-password`, `/me` |

### MODULE 2: Chat & Conversation Module (मुख्य चैट इंजन)
| Component | ज़िम्मेदारी |
|---|---|
| `main.py → /chat` (Backend) | रोज़ की सीमा जाँचना, हिस्ट्री लोड करना, Inference API कॉल करना, जवाब DB में सेव करना |
| `Chat` (Frontend JS) | User message render, streaming token display, AI response markdown parse |
| **APIs** | `POST /api/v1/chat` |

### MODULE 3: Session Management Module (बातचीत का प्रबंधन)
| Component | ज़िम्मेदारी |
|---|---|
| `main.py → /sessions` (Backend) | Session create, list, pin/unpin, rename, delete, clear all |
| `Sidebar` (Frontend JS) | Recent history render, long-press context menu (Pin, Rename, Delete) |
| **APIs** | `GET/POST/PATCH/DELETE /api/v1/sessions/{pid}` |

### MODULE 4: File Upload Module (फ़ाइल और कैमरा)
| Component | ज़िम्मेदारी |
|---|---|
| `main.py → /files/upload` (Backend) | MIME verify, UUID rename, `/uploads/{user_id}/` में save, 500 MB quota enforce |
| `Chat (+)` (Frontend JS) | Camera capture (`capture=camera`), File Manager (`input type=file`), multipart form send |
| **APIs** | `POST /api/v1/files/upload` |

### MODULE 5: Profile & Settings Module (प्रोफाइल और सेटिंग्स)
| Component | ज़िम्मेदारी |
|---|---|
| `main.py → /profile` (Backend) | नाम, यूज़रनेम, थीम, Accent Color, भाषा update; avatar upload |
| `Settings` (Frontend JS) | Big circle avatar render, form pre-fill, Light/Dark toggle, Storage bar calculate |
| **APIs** | `PATCH /api/v1/profile`, `POST /api/v1/profile/avatar` |

### MODULE 6: Inference Engine Module (Rhynia का दिमाग)
| Component | ज़िम्मेदारी |
|---|---|
| `llm_engine.py` (Backend) | Smart Cascade Router: ऑटोमैटिक डिटेक्ट (Image है तो Vision, Text है तो Chat), **100% Free पहले इस्तेमाल होगा** → जैसे ही Free Quota समाप्त (HTTP 429/Busy) हो, **तुरंत उसी मिलीसेकंड में Paid Model पर साइलेंट स्विच**, Response Sanitizer (Remove banned provider names). |
| **Primary Tier (100% Free)** | **Chat:** `qwen/qwen3.8-27b:free` (सर्वश्रेष्ठ हिन्दी/हिंग्लिश) \| **Vision:** `google/gemini-2.5-pro-exp-03-25:free` (कैमरा/फ़ोटो/डॉक्यूमेंट) \| **Code/Math:** `deepseek/deepseek-v4-flash:free` |
| **Instant Paid Fallback (अल्ट्रा-सस्ता)** | **Chat:** `qwen/qwen-3-7-flash` ($0.03/1M) \| **Vision:** `google/gemini-2.5-flash` ($0.075/1M) \| **Code:** `deepseek/deepseek-v4-flash` ($0.07/1M) |
| **Safety Reserve** | HuggingFace (`siyarajput/Rhynia-V3-VL-8B-Merged`) + Groq (`llama-3.3-70b-versatile`) |

> **अटूट नियम (Founder Order):**  
> 1. हर रिक्वेस्ट सबसे पहले **100% Free मॉडल** के पास ही जाएगी।  
> 2. यदि Free मॉडल से `HTTP 429 (Rate Limit / Quota Exceeded)` या `503/500 (Service Busy)` मिलता है, तो यूज़र को कोई एरर दिखाए बिना बैकएंड **तुरंत (Realtime में) Ultra-Cheap Paid मॉडल** पर स्विच करके जवाब स्ट्रीम करेगा। यूज़र का अनुभव 100% सीमलेस (अबाध) रहेगा।

### MODULE 7: Live Discovery & Real-Time Search Module
| Component | ज़िम्मेदारी |
|---|---|
| `search_service.py` (Backend) | • **Google Web Search:** DuckDuckGo / Google Custom Search (ताज़ा लाइव डेटा)।<br>• **Google Maps:** Google Places API ($200 फ्री क्रेडिट) - लोकेशन कार्ड्स, दूरी, रूट्स।<br>• **YouTube Intelligence:** YouTube Data API v3 (10,000 यूनिट फ्री/दिन) - वीडियो सर्च व सारांश।<br>• **Social Trends:** Meta/Web Scraping (`site:instagram.com`, `site:facebook.com`) - ट्रेंडिंग रील्स, हैशटैग्स। |
| `SearchCard` (Frontend JS) | लाइव वेब सोर्स लिंक्स, गूगल मैप्स का इंटरैक्टिव नेविगेशन कार्ड, यूट्यूब वीडियो कार्ड व टाइमस्टैम्प्स रेंडर करना। |
| **APIs** | `POST /api/v1/search/query`, `GET /api/v1/search/maps`, `GET /api/v1/search/youtube` |

> **नियम (Live Search & Summary Only — Founder Order):**  
> यह इंजन केवल **लाइव सर्च करके सटीक AI सारांश (Summary) + डायरेक्ट लिंक्स/कार्ड्स** देगा। कोई वीडियो स्ट्रीमिंग या भारी मीडिया डाउनलोड नहीं होगा। इसका उद्देश्य यूज़र को 2 सेकंड में मुख्य जानकारी देना है।

### MODULE 8: Study & Productivity Export Module
| Component | ज़िम्मेदारी |
|---|---|
| `export_service.py` (Backend) | • **Notes & PDF Generator:** `reportlab` से मार्कडाउन को सुंदर फॉर्मैट किए गए PDF में बदलना (₹0 खर्च)।<br>• **PPT Slide Maker:** `python-pptx` से ऑटोमैटिक PowerPoint स्लाइड्स जनरेट करके `.pptx` डाउनलोड देना (₹0 खर्च)। |
| `Viewer` (Frontend JS) | PDF डाउनलोड बटन, PPT डाउनलोड बटन, Mermaid चार्ट रेंडरर (`mermaid.min.js`), कोड सिंटैक्स हाइलाइटिंग व वन-क्लिक कॉपी बटन। |
| **APIs** | `POST /api/v1/export/pdf`, `POST /api/v1/export/ppt` |

> **दायरा सीमा (Scope Boundary — Founder Order):**  
> v1.0 में वेब-आधारित PDF नोट्स व PPT स्लाइड मेकर रहेगा। कोड के लिए सुंदर सिंटैक्स हाइलाइटिंग और कॉपी बटन रहेगा।  
> **Live UI / Code Sandbox (Codex जैसा लाइव प्रिव्यू)**, **Calling (गुप्त कॉलिंग / VoIP)**, **Tally डायरेक्ट डेस्कटॉप अटैचमेंट**, और **MS Office डेस्कटॉप प्लगइन** v1.0 के बाद (v1.2+ में) आएँगे। अभी v1.0 में ये शामिल नहीं हैं।

---

## 3️⃣ DATABASE DESIGN (डेटाबेस का पूरा ढाँचा)

### Schema Diagram (Entity Relationship)
```
┌────────────────────────────────────┐
│              users                 │
├────────────────────────────────────┤
│ id (PK, INTEGER)                   │
│ public_id (UQ, TEXT)               │
│ name (TEXT)                        │
│ username (UQ, TEXT)                │
│ email (UQ, NULLABLE TEXT)          │
│ phone (UQ, NULLABLE TEXT)          │
│ password_hash (NULLABLE TEXT)      │
│ auth_provider (TEXT)               │  ← 'email' / 'google' / 'phone'
│ google_id (UQ, NULLABLE TEXT)      │
│ avatar_url (NULLABLE TEXT)         │
│ theme (TEXT DEFAULT 'dark')        │  ← Fluent Dark Horizon Default
│ accent_color (TEXT DEFAULT #0078d4)│  ← Electric Azure Blue Accent
│ language (TEXT DEFAULT 'en')       │
│ plan (TEXT DEFAULT 'free')         │  ← 'free' (₹0) | 'pro' (₹99) | 'ultra_pro' (₹249)
│ storage_used_bytes (INTEGER, 0)    │
│ storage_limit_bytes (INTEGER)      │  ← 500MB (Free) | 5GB (Pro) | 25GB (Ultra Pro)
│ is_active (BOOLEAN, TRUE)          │
│ is_admin (BOOLEAN, FALSE)          │
│ created_at (DATETIME)              │
└──────┬──────────────────────┬──────┘
       │ 1:N                  │ 1:N
       ▼                      ▼
┌────────────────┐   ┌─────────────────────────┐
│  phone_otps    │   │        sessions         │
├────────────────┤   ├─────────────────────────┤
│ id (PK)        │   │ id (PK)                 │
│ phone (TEXT)   │   │ public_id (UQ TEXT)     │
│ otp_code (TEXT)│   │ user_id (FK → users.id) │
│ expires_at     │   │ title (TEXT)            │
│ is_used (BOOL) │   │ is_pinned (BOOL, FALSE) │
│ created_at     │   │ is_archived (BOOL,FALSE)│
└────────────────┘   │ created_at (DATETIME)   │
                     │ updated_at (DATETIME)   │
                     └────────────┬────────────┘
                                  │ 1:N
                      ┌───────────▼────────────┐
                      │        messages        │
                      ├────────────────────────┤
                      │ id (PK)                │
                      │ session_id (FK)        │
                      │ user_id (FK)           │
                      │ role (TEXT)            │  ← 'user' / 'assistant'
                      │ content (TEXT)         │
                      │ rating (NULLABLE TEXT) │  ← 'good' / 'bad'
                      │ created_at (DATETIME)  │
                      └────────────────────────┘

┌─────────────────────────────────────────────┐
│                 user_files                  │
├─────────────────────────────────────────────┤
│ id (PK)                                     │
│ public_id (UQ TEXT)                         │
│ user_id (FK → users.id)                     │
│ session_id (FK → sessions.id, NULLABLE)     │
│ file_name (TEXT)                            │
│ file_size_bytes (INTEGER)                   │
│ file_type (TEXT)                            │  ← MIME type
│ file_path (TEXT)                            │
│ created_at (DATETIME)                       │
└─────────────────────────────────────────────┘
```

### Relationships:
| Type | Between | Detail |
|---|---|---|
| **One-to-Many** | `users` → `sessions` | 1 User के कई Conversations |
| **One-to-Many** | `sessions` → `messages` | 1 Session के कई Messages |
| **One-to-Many** | `users` → `messages` | User के पूरे message audit trail |
| **One-to-Many** | `users` → `phone_otps` | 1 Phone पर कई OTP requests (time-limited) |
| **One-to-Many** | `users` → `user_files` | 1 User की कई Files (500 MB cap) |

### Indexes (Fast Search & Performance):
```sql
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_messages_session_id ON messages(session_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
CREATE INDEX idx_user_files_user_id ON user_files(user_id);
CREATE INDEX idx_phone_otps_phone ON phone_otps(phone);
```

---

## 4️⃣ API ARCHITECTURE (Frontend–Backend Bridge)

**Base URL:** `/api/v1/`  
**Auth Header:** `Authorization: Bearer <JWT_TOKEN>`  
**Content-Type:** `application/json` (files: `multipart/form-data`)

### Full API Contract Table:
| Method | Endpoint | Auth? | Request Body | Success Response | Error Codes |
|---|---|---|---|---|---|
| `POST` | `/auth/register` | ❌ | `{email, password, name?}` | `{token, user}` | 409, 400 |
| `POST` | `/auth/login` | ❌ | `{email, password}` | `{token, user}` | 401, 400 |
| `POST` | `/auth/google` | ❌ | `{credential}` | `{token, user}` | 400, 502 |
| `POST` | `/auth/phone/send-otp` | ❌ | `{phone}` | `{status, message}` | 400 |
| `POST` | `/auth/phone/verify-otp` | ❌ | `{phone, otp}` | `{token, user}` | 400, 401 |
| `POST` | `/auth/forgot-password` | ❌ | `{email_or_phone, channel: "email"|"sms"}` | `{status, message}` | 400, 404 |
| `POST` | `/auth/reset-password` | ❌ | `{token_or_otp, new_password}` | `{status, message}` | 400, 401 |
| `GET` | `/auth/me` | ✅ | — | `{user, storage: {total, used, threads, media, free}}` | 401 |
| `GET` | `/sessions` | ✅ | — | `{pinned: [...], recents: [...]}` | 401 |
| `POST` | `/sessions` | ✅ | `{title?}` | `{session}` | 401 |
| `PATCH` | `/sessions/{pid}` | ✅ | `{title?, is_pinned?}` | `{session}` | 401, 404 |
| `DELETE` | `/sessions/{pid}` | ✅ | — | `{status}` | 401, 404 |
| `DELETE` | `/sessions` | ✅ | — | `{status}` (Clear All) | 401 |
| `POST` | `/sessions/{pid}/share` | ✅ | — | `{share_url, public_id}` (3-Dots Share) | 401, 404 |
| `GET` | `/sessions/{pid}/messages` | ✅ | — | `[{role, content, rating, created_at}]` | 401, 404 |
| `POST` | `/chat` | ✅ | `{message, session_public_id?}` | `{reply, session_public_id, used_today, limit_daily}` | 401, 429, 502 |
| `PATCH` | `/messages/{id}/rating` | ✅ | `{rating: "good"/"bad"}` | `{status}` | 401, 404 |
| `PATCH` | `/profile` | ✅ | `{name?, username?, theme?, accent_color?, language?}` | `{user}` | 401, 409 |
| `POST` | `/profile/avatar` | ✅ | `multipart/form-data` | `{avatar_url}` | 401, 413 |
| `POST` | `/files/upload` | ✅ | `multipart/form-data` | `{file_id, file_name, file_size}` | 401, 413 |
| `GET` | `/health` | ❌ | — | `{status, database, model}` | — |

### Standard Error Response Format:
```json
{
  "detail": "Human-readable error message here",
  "code": "ERROR_CODE_STRING",
  "status": 401
}
```

### HTTP Error Codes:
| Code | Meaning |
|---|---|
| `400` | Validation error / bad input |
| `401` | Token missing, expired or invalid |
| `403` | Account disabled |
| `404` | Resource not found |
| `409` | Duplicate (email / username already exists) |
| `413` | File exceeds 500 MB free storage quota |
| `429` | Daily message limit reached |
| `502` | Inference engine unavailable |

---

## 5️⃣ AUTHENTICATION FLOW (पहचान का सुरक्षित रास्ता)

### Flow 1: Email / Password Login
```
[User] ──► POST /auth/login {email, password}
              │
              ▼
[Backend] ── Find user by email in DB
              ├── Not found → 401 "Invalid credentials"
              ├── Found → bcrypt.verify(password, hash)
              │     ├── Mismatch → 401 "Invalid credentials"
              │     └── Match ──► JWT.sign({user_id, plan}, secret, expires: 7d)
              │                         │
              ▼                         ▼
[Frontend] ◄── {token, user}  localStorage.setItem('rhynia_token', token)
```

### Flow 2: Google OAuth Login
```
[Frontend] ── Google Identity SDK loaded → User clicks "Continue with Google"
                    │
                    ▼ Google returns credential (ID token)
[Frontend] ──► POST /auth/google {credential}
                    │
                    ▼
[Backend] ── Google tokeninfo API verify → extract {email, name, google_id}
              ├── New user → auto-register → issue JWT
              └── Existing user → issue JWT
```

### Flow 3: Phone OTP Login
```
[User] ──► Types phone number (+91XXXXXXXXXX)
              │
              ▼
[Frontend] ──► POST /auth/phone/send-otp {phone}
                    │
                    ▼
[Backend] ── Generate 6-digit OTP → store in phone_otps with 300s expiry → Send via SMS Gateway
                    │
                    ▼
[User] ── Receives SMS → Types 6-digit code
              │
              ▼
[Frontend] ──► POST /auth/phone/verify-otp {phone, otp}
                    │
                    ▼
[Backend] ── Find OTP in DB → Check expiry & is_used → Mark used=true → Issue JWT
```

### JWT Payload Structure:
```json
{
  "sub": "usr_abc123xyz",
  "plan": "free",
  "is_admin": false,
  "iat": 1700000000,
  "exp": 1700604800
}
```

---

## 6️⃣ CLOUD ARCHITECTURE (1 लाख Users तक Scale करने का Plan)

### Development (अभी — Local PC):
```
┌────────────────────────────────────────────┐
│  Local PC (Windows — Intel i3, ~3GB RAM)   │
│                                            │
│  ┌──────────────────┐  ┌────────────────┐  │
│  │  Backend Server  │  │   SQLite DB    │  │
│  │  FastAPI :8000   │  │  rhynia.db     │  │
│  └──────────────────┘  └────────────────┘  │
│  ┌──────────────────────────────────────┐  │
│  │  Frontend — Open index.html directly │  │
│  │  or: python -m http.server 3000      │  │
│  └──────────────────────────────────────┘  │
└────────────────────────────────────────────┘
               │ Inference Calls
               ▼
  HuggingFace Inference API (Cloud GPU)
  (Model: siyarajput/Rhynia-V3-VL-8B-Merged)
```

### Production v1.0 (लॉन्च पर):
```
┌─────────────────────────────────────────────────────────────────────┐
│                     PRODUCTION CLOUD SETUP                         │
│                                                                     │
│  ┌────────────────────────┐      ┌────────────────────────────────┐ │
│  │   Vercel / Netlify     │      │   Render / Railway             │ │
│  │   (Frontend CDN)       │ ────►│   (Backend FastAPI)            │ │
│  │   index.html           │ HTTP │   Python App Server            │ │
│  │   style.css, app.js    │      │   Port 8000, Gunicorn/Uvicorn  │ │
│  └────────────────────────┘      └──────────────────┬─────────────┘ │
│                                                     │               │
│                                     ┌───────────────▼────────────┐ │
│                                     │       Supabase             │ │
│                                     │  (PostgreSQL Database)     │ │
│                                     │  • Free tier: 500 MB       │ │
│                                     │  • Auto backups            │ │
│                                     └────────────────────────────┘ │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Media Files:  /uploads/{user_id}/   (Render Disk / R2)    │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
               │
               ▼ Inference Calls
  OpenRouter API (Cascade Router) / HuggingFace / Groq
```

### Deployment Config (Production `.env`):
```bash
# Database & Core
RHYNIA_DATABASE_URL=postgresql://supabase-connection-string
RHYNIA_CORS_ORIGINS=https://rhynia.ai
RHYNIA_SECRET_KEY=super-long-random-256bit-secret
STORAGE_LIMIT_BYTES=524288000

# OpenRouter Inference Engine (Smart Cascade Router)
RHYNIA_OPENROUTER_KEY=sk-or-v1-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
RHYNIA_MODEL_CHAT_FREE=qwen/qwen3.8-27b:free
RHYNIA_MODEL_VISION_FREE=google/gemini-2.5-pro-exp-03-25:free
RHYNIA_MODEL_CODE_FREE=deepseek/deepseek-v4-flash:free
RHYNIA_MODEL_CHAT_FALLBACK=qwen/qwen-3-7-flash
RHYNIA_MODEL_VISION_FALLBACK=google/gemini-2.5-flash

# Safety Backup APIs
RHYNIA_HF_TOKEN=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
RHYNIA_GROQ_KEY=your-groq-api-key
```

---

## 7️⃣ SECURITY ARCHITECTURE (सिस्टम की सुरक्षा)

| Security Layer | Implementation | Standard |
|---|---|---|
| **Data in Transit** | HTTPS/TLS enforced on all production routes (Render/Vercel auto-provide SSL) | TLS 1.2+ |
| **Password Encryption** | BCrypt hashing with cost factor 12 — kabhi plain text store/log nahi | OWASP |
| **Token Security** | JWT HS256, 7-day expiry, server-side secret rotation | RFC 7519 |
| **Phone OTP** | 6-digit, 300-second expiry, `is_used = true` after first use | —  |
| **SQL Injection** | 100% SQLAlchemy ORM parameterized queries — raw SQL prohibited | OWASP |
| **File Upload** | MIME type whitelist (image/\*, application/pdf, .docx, .txt), UUID rename, 500MB quota | — |
| **CORS** | Dev: `*` (open) \| Production: `RHYNIA_CORS_ORIGINS` env से (sirf rhynia.ai) | — |
| **Input Validation** | Pydantic models enforce max lengths (message: 6000 chars, password: 8–72 chars) | — |
| **RBAC** | `is_admin` flag for admin-only routes, `plan` field for quota enforcement | — |
| **Identity Zero-Leakage** | System prompt hard-enforced; response output filtered for banned words | — |
| **Secrets** | Never committed to Git — `.env` file gitignored, env vars in host dashboard | — |

### RBAC Matrix (Role-Based Access Control):
| Route | Guest | Free User | Admin |
|---|---|---|---|
| `/api/v1/chat` | ❌ (Sign-in needed) | ✅ (30/day) | ✅ (Unlimited) |
| `/api/v1/sessions` | ❌ | ✅ | ✅ |
| `/api/v1/profile` | ❌ | ✅ (own only) | ✅ (any user) |
| `/api/v1/files/upload` | ❌ | ✅ (500MB) | ✅ |
| `/api/v1/health` | ✅ | ✅ | ✅ |

---

## 8️⃣ SCALABILITY PLAN (भविष्य में 10 लाख Users तक)

### Phase 1 — Launch (0–1,000 Users):
* Single Render backend instance + Supabase free tier PostgreSQL।
* HuggingFace Inference API (no GPU needed locally)।
* Static files on Vercel CDN।

### Phase 2 — Growth (1,000–50,000 Users):
* Gunicorn + multiple Uvicorn workers (`--workers 4`)।
* Supabase paid plan (connection pooling with PgBouncer)।
* Redis cache for session token validation (reduce DB reads)।
* Groq API as primary (faster LLM inference, lower latency)।

### Phase 3 — Scale (50,000–10,00,000 Users):
* Horizontal Backend Scaling: Load balancer (Render/Railway auto-scale)।
* Database Read Replicas: Supabase read replicas for message history।
* CDN-level File Storage: Cloudflare R2 / AWS S3 for `/uploads/`।
* Queue System: Celery + Redis for async LLM inference jobs।
* Observability: Sentry (errors) + Prometheus (metrics) + Grafana (dashboards)।

---

## 9️⃣ ARCHITECTURE REVIEW (ब्लूप्रिंट की जाँच)

### Review Checklist:
| Review Area | Status | Notes |
|---|---|---|
| **3-Layer Separation** | ✅ APPROVED | Frontend, Backend, Database — बिल्कुल अलग। कोई monolithic mixing नहीं। |
| **API Contract** | ✅ FROZEN | सभी `/api/v1/` routes defined। Frontend इसी पर बनेगा। कोई change नहीं। |
| **Database Schema** | ✅ APPROVED | 5 tables, सही relationships, indexes defined। |
| **Auth Flow** | ✅ APPROVED | 3 login methods (Email, Google, Phone OTP) — सब documented। |
| **File Quota** | ✅ APPROVED | 500 MB per free user — backend पर enforce, DB tracking, HTTP 413 on exceed। |
| **Security** | ✅ APPROVED | BCrypt, JWT, ORM-only, MIME check, CORS, RBAC — सब defined। |
| **Identity** | ✅ APPROVED | Zero leakage — System prompt hard-enforce। कोई banned word नहीं। |
| **Scalability** | ✅ PLANNED | 3-phase scale plan ready। SQLite→Supabase: sirf 1 env var। |
| **Bottlenecks** | ✅ ADDRESSED | LLM latency mitigated via Groq fallback। DB hits mitigated via indexing। |

### Potential Risks & Mitigations:
| Risk | Mitigation |
|---|---|
| HF Inference API slow/down | Groq API automatic fallback in `llm_engine.py` |
| 500 MB storage quota abuse | `storage_used_bytes` counter updated on every upload; HTTP 413 hard-block |
| JWT token theft | Short-lived tokens (7d), HTTPS only in production |
| SMS OTP cost spike | Rate-limit OTP send: max 3 requests per phone per 10 minutes |
| SQLite concurrency (dev) | Only 1 writer at a time — acceptable in dev; Supabase solves in production |

---

## Final Sign-Off

| Role | Status | Date |
|---|---|---|
| **Founder (Rhynia Intelligence)** | APPROVED ✅ | 2026-09-21 |
| **Architecture Core** | APPROVED ✅ | 2026-09-21 |
| **Security Review** | APPROVED ✅ | 2026-09-21 |

> **BLUEPRINT LOCKED 🔒 — Step 8 (Coding) शुरू करने के लिए तैयार।**
