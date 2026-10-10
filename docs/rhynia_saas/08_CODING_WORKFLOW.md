# STEP 8 — CODING (IMPLEMENTATION) WORKFLOW — RHYNIA SAAS v1.0

> **Input:** Sprint Planning (`07_SPRINT_PLAN.md`) के Tasks तैयार हैं। ✅  
> **Output:** काम करने वाला Software Feature (Production-Ready Code)।  
> **Status:** APPROVED BY FOUNDER (Rhynia Intelligence)  
> **Version:** 1.0 Final | **Date:** 2026-09-21  
> **Execution Mode:** Solo Developer + Antigravity (AGY) AI Agent  
> **Hard Rule:** No `AI`, `ChatGPT`, `Gemini`, `Qwen`, `Founder: Manish Chaturvedi`, `bot`, or `assistant`. The brand is strictly **Rhynia**.

---

## 🔥 पूरा Flow (The Golden Cycle)
```
Task → Branch → Code → Run → Fix → Commit → Pull Request
```

---

## 1️⃣ TASK चुनना (Pick a Task)
Sprint Board (`07_SPRINT_PLAN.md`) के **To Do** कॉलम से एक बार में सिर्फ़ **एक Task** उठाया जाता है:
* **उदाहरण**: Task: `backend/database.py` — SQLAlchemy 5 Models बनाना।
* टास्क का दायरा (Scope) बिल्कुल स्पष्ट होना चाहिए ताकि ओवर-इंजीनियरिंग या स्कोप-क्रीप न हो।

---

## 2️⃣ BRANCH बनाना (Create Feature Branch)
सीधे `main` ब्रांच में काम कभी नहीं होगा। हर फीचर के लिए अलग ब्रांच बनेगी:
* `feature/sprint0-foundation`
* `feature/sprint1-database-auth`
* `feature/sprint2-chat-sessions`
* `feature/sprint3-file-storage`
* `feature/sprint4-frontend-ui`
* `feature/sprint5-launch-deploy`

> **फायदा:** मुख्य स्टेबल कोड हमेशा सुरक्षित रहता है और कोई भी ब्रेक नहीं होता।

---

## 3️⃣ PROJECT STRUCTURE SETUP (3-Layer Architecture)
फाउंडर का सख्त नियम: **Frontend, Backend, Database — 3 अलग लेयर्स।**
```
services/rhynia_saas/
├── backend/                  <- सिर्फ़ API (FastAPI, Python). कभी यहाँ UI कोड नहीं।
│   ├── main.py               <- API routes only
│   ├── config.py             <- Settings & secrets
│   ├── database.py           <- SQLAlchemy models
│   ├── auth.py               <- BCrypt, JWT, Google, Phone OTP
│   ├── llm_engine.py         <- Adapter pattern for inference
│   └── requirements.txt      <- Clean 10 dependencies
├── frontend/                 <- सिर्फ़ static files. किसी भी सर्वर पर होस्ट हो सके।
│   ├── config.js             <- API_BASE = "/api/v1" (1-line swap)
│   ├── index.html            <- Semantic HTML only
│   ├── style.css             <- Design tokens, Light & Dark themes
│   └── app.js                <- State management, API calls, event handlers
├── database/                 <- Local SQLite files (gitignored)
│   └── rhynia.db
├── uploads/                  <- User files (/uploads/{user_id}/)
├── supabase_schema.sql       <- Production PostgreSQL migration
└── README.md                 <- Setup guide
```

---

## 4️⃣ FRONTEND CODE लिखना (UI & Interactions)
जो यूज़र देखेगा और जिससे इंटरैक्ट करेगा (Design System `04_UI_UX.md` के अनुसार):
* **Screen 1 (Main Chat Screen)**:
  * Empty State: `[≡]` मेनू बटन, नीचे इनपुट बॉक्स, `(+)` बटन (Camera / Device File Manager), सेंड तीर बटन `(➤)`।
  * Active State: Top-Right `[📝 New Chat]` + `[⋮ 3-Dots]` (Share, Pin, Find, Delete)।
  * AI Response के नीचे 5 बटन्स: Copy, Speaker 🔊, 👍 Good, 👎 Bad, 📤 Share।
* **Screen 2 (Sidebar Drawer)**:
  * Top: Rhynia + 🔍 Search।
  * Middle: Recent Chat History (Long-press / Right-click → Pin, Rename, Delete)।
  * Footer: Left `[💬 Chat]` + Right `[👤 Profile]`।
* **Screen 3 (Full Settings Panel)**:
  * Big Circle Avatar (Name, Username, Photo Upload, Save)।
  * Email & Mobile Number display।
  * Appearance (Light/Dark), Accent Color, Language, Notifications।
  * 500 MB Free Storage Bar (Used vs Available)।
  * Log Out button।
* **Screens 07–11 (Auth Screens — Login First):**
  * Screen 07 (Login): Google OAuth, Phone OTP, Email/Password sign-in form.
  * Screen 08 (Sign Up): Registration form with same 3 methods.
  * Screen 09 (SMS OTP): 4-box OTP verification, resend timer.
  * Screen 10 (Email OTP): Email verification code entry.
  * Screen 11 (Forgot Password): Email input → reset link flow.
  * **Route Gate**: On app load → check localStorage for JWT → No token? Force to Screen 07. Valid token? Auto-redirect to Screen 01 (Main Chat).

---

## 5️⃣ BACKEND CODE लिखना (Server Logic & Rules)
सर्वर साइड बिज़नेस लॉजिक और वैलिडेशन (`05_ARCHITECTURE.md` API Contract के अनुसार):
* **REST / JSON Endpoints**: सभी रूट्स `/api/v1/` प्रिफिक्स के साथ।
* **Pydantic Validation**: इनपुट की सख्त जांच (लंबाई, ईमेल फॉर्मेट, फोन नंबर)।
* **Daily Message Limit**: Free प्लान के लिए रोज़ाना 30 मैसेज की सीमा (HTTP 429)।
* **Inference Engine Adapter (3-Tier Cascade)**: Tier 1 Free (OpenRouter) → on HTTP 429 auto-switch to Tier 2 Paid (OpenRouter) → Tier 3 Safety (Groq/HuggingFace). User never sees the switch — it's silent.
* **Identity Zero-Leakage**: हर कॉल पर सिस्टम प्रॉम्प्ट हार्ड-एनफोर्स + आउटपुट सैनिटाइज़ेशन।

---

## 6️⃣ DATABASE CODE लिखना (Models & Storage)
डेटा का सुरक्षित और स्ट्रक्चर्ड स्टोरेज:
* **5 Core Tables**: `users`, `phone_otps`, `sessions`, `messages`, `user_files`।
* **Relationships**: Users 1:N Sessions, Sessions 1:N Messages, Users 1:N Files।
* **Indexes**: तेज़ सर्च और हाई परफॉरमेंस के लिए Foreign Keys और Timestamps पर इंडेक्स।
* **Zero Raw SQL**: 100% SQLAlchemy ORM पैरामीटराइज़्ड क्वेरीज़ (SQL Injection असंभव)।

---

## 7️⃣ API जोड़ना (INTEGRATION)
Frontend और Backend को आपस में जोड़ना:
1. Frontend में बटन क्लिक या फॉर्म सबमिट से `app.js` का API फ़ंक्शन ट्रिगर होता है।
2. `fetch()` के ज़रिए `Authorization: Bearer <token>` अपने आप हेडर में जुड़ता है।
3. Backend डेटा को वैलिडेट करके Database से प्रोसेस करता है।
4. JSON पेलोड और सही HTTP स्टेटस कोड (`200`, `201`, `400`, `401`, `413`, `429`) वापस मिलता है।
5. Frontend UI तुरंत बिना पेज रीलोड किए रिस्पॉन्सिव तरीके से अपडेट होता है।

---

## 8️⃣ AUTHENTICATION & SECURITY जोड़ना
* **Passwords**: BCrypt हैशिंग (Cost 12), डेटाबेस में कभी प्लेन टेक्स्ट नहीं।
* **Sessions**: Stateless JWT HS256 टोकन, 7 दिन की एक्सपायरी।
* **Phone OTP**: 6 अंकों का सुरक्षित कोड, 300 सेकंड एक्सपायरी, सिंगल-यूज़ एनफोर्समेंट।
* **File Quotas**: 500 MB प्रति फ्री यूज़र लिमिट। लिमिट पार होने पर तुरंत HTTP 413 एरर।
* **Banned Words Compliance**: कोड और रिस्पॉन्स में कहीं भी प्रतिबंधित शब्द नहीं।

---

## 9️⃣ LOCAL VERIFICATION & EXECUTION (स्थानीय स्तर पर टेस्ट)
कोड लिखते ही तुरंत स्थानीय स्तर पर चलाकर देखना:
1. **Backend Tests**: Thunder Client / curl से सभी 18 API Endpoints टेस्ट करना।
2. **Runtime Errors**: कंसोल और टर्मिनल में एरर/वार्निंग्स तुरंत पकड़ना और फिक्स करना।
3. **Edge Cases**: खाली इनपुट, गलत पासवर्ड, एक्सपायर्ड टोकन, 500MB से बड़ी फ़ाइल सबमिट करके टेस्ट करना।
4. **Banned Words Audit**: कोडबेस में `grep` चलाकर पुष्टि करना कि कोई बैन शब्द नहीं है।

---

## 🔟 COMMIT करना (Clean Commits)
जब फ़ीचर पूरी तरह टेस्ट होकर सही चलने लगे:
```bash
git add .
git commit -m "feat(auth): add phone OTP generation and verification endpoints"
```
* **कन्वेंशन**: `feat(...)`, `fix(...)`, `docs(...)`, `style(...)`, `refactor(...)`।

---

## 1️⃣1️⃣ PULL REQUEST (PR) भेजना
* फ़ीचर ब्रांच को GitHub पर पुश करना।
* Main ब्रांच में मर्ज करने से पहले रिव्यू (Step 9: Code Review) के लिए PR तैयार करना।

---

## 1️⃣2️⃣ AI के साथ SOLO DEVELOPER MULTI-ROLE EXECUTION

| काम | AI (Antigravity Agent) क्या करेगा | Founder (Rhynia Intelligence) क्या करेंगे |
|---|---|---|
| **Frontend** | HTML, CSS Design Tokens, JS State Management | UI लुक, फील और एनिमेशन ब्राउज़र में चेक करेंगे |
| **Backend** | FastAPI Endpoints, Controllers, Adapters | बिज़नेस लॉजिक और एपीआई फ्लो अप्रूव करेंगे |
| **Database** | SQLAlchemy Models, Foreign Keys, Indexes | डेटाबेस स्कीमा और फील्ड्स की पुष्टि करेंगे |
| **API Integration**| `fetch()` wrappers, Error handling, Bearer tokens | Thunder Client / Browser में एंड-टू-एंड टेस्ट करेंगे |
| **Authentication** | BCrypt, JWT, Google OAuth, Phone OTP logic | अपने मोबाइल / ईमेल से लॉगिन टेस्ट करेंगे |
| **Bug Fix** | टर्मिनल लॉग्स देखकर बग्स को तुरंत फिक्स करना | समस्या रिपोर्ट करेंगे |
| **Refactor** | कोड को 3-लेयर्स में क्लीन और मॉड्युलर रखना | आर्किटेक्चर अनुशासन बनाए रखेंगे |

---

## 🔥 Step 8 का Final Output
* **एक 100% वर्किंग, टेस्टेड और क्लीन सॉफ़्टवेयर फ़ीचर** तैयार हो जाता है, जो Step 9 (Code Review) में जाने के लिए पूरी तरह रेडी होता है।

> **WORKFLOW LOCKED 🔒 — जब फाउंडर "START" बोलेंगे, तब इसी 12-स्टेप अनुशासन से कोडिंग शुरू होगी!**
