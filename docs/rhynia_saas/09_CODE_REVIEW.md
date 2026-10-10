# STEP 9 — CODE REVIEW WORKFLOW — RHYNIA SAAS v1.0

> **Input:** Step 8 का Code + Pull Request (PR) ✅  
> **Output:** Approved Code जो `main` Branch में Merge होने के लिए तैयार हो।  
> **Status:** APPROVED BY FOUNDER (Rhynia Intelligence)  
> **Version:** 1.0 Final | **Date:** 2026-09-21  
> **Review Mode:** Solo Developer + Antigravity (AGY) AI Reviewer  
> **Hard Rule:** No `AI`, `ChatGPT`, `Gemini`, `Qwen`, `Founder: Manish Chaturvedi`, `bot`, or `assistant`. The brand is strictly **Rhynia**.

---

## 🔥 पूरा Flow (The Review Cycle)
```
Pull Request → Review → Comments → Fix → Re-Review → Approval → Merge
```

---

## 1️⃣ PULL REQUEST (PR) खुलती है

Developer Step 8 में लिखे गए Feature को PR के रूप में सबमिट करता है:

### PR Template (हर PR में यह ज़रूर होगा):
```markdown
## 🔖 PR Title
feat(sprint1): Add 5 SQLAlchemy DB Models + 5 Auth Endpoints

## 📋 क्या बदला गया? (Changelog)
- [ ] `backend/database.py` — 5 SQLAlchemy Models (users, phone_otps, sessions, messages, user_files)
- [ ] `backend/auth.py` — BCrypt hash/verify + JWT create/decode functions
- [ ] `backend/main.py` — POST /auth/register, /auth/login, /auth/google, /auth/phone/send-otp, /auth/phone/verify-otp, GET /auth/me

## 📁 कौन-कौन सी फ़ाइलें बदलीं? (Files Changed)
- `backend/database.py` (NEW)
- `backend/auth.py` (NEW)
- `backend/main.py` (MODIFIED)
- `backend/config.py` (MODIFIED)

## 🎯 यह बदलाव क्यों किया गया? (Task Goal)
Sprint 1 का Goal: "User Email/Google/Phone OTP से Register और Login कर सके। JWT Token मिले।"

## ✅ Local Testing Done?
- [ ] Thunder Client से सभी 5 Auth endpoints test किए
- [ ] Edge cases: duplicate email, wrong password, expired OTP
- [ ] Banned words audit (grep) पास
```

---

## 2️⃣ REVIEWER को Assign करना

| Scenario | Reviewer | Role |
|---|---|---|
| **Solo Dev (अभी)** | Antigravity (AGY) AI Agent | Full Code Review — Bugs, Security, Performance, Clean Code |
| **Team में होने पर** | Senior Backend Engineer | Architecture + Security focus |
| **Frontend PR** | Senior UI/UX Engineer | Design System compliance + Responsiveness |

### AI Reviewer को Exact Prompt:
```
"इस Module का Code Review करो।
Bugs, Security Issues, Performance Problems और Clean Code standards के
हिसाब से सभी कमियाँ बताओ और fixes suggest करो।
Rhynia SaaS के नियम:
1. कोई banned word नहीं (AI, ChatGPT, Gemini, Qwen, bot, assistant)
2. Backend में कभी UI code नहीं
3. Zero Raw SQL — सिर्फ़ SQLAlchemy ORM
4. JWT 7 days, BCrypt cost 12
5. 500 MB quota enforce होनी चाहिए
6. सभी 18 API endpoints /api/v1/ prefix से"
```

---

## 3️⃣ CODE की जाँच होती है (Review Checklist)

### 3.1 Bug & Logic Review
| चेक | Rhynia-specific जाँच |
|---|---|
| **Null / None Handling** | क्या `user` object None होने पर crash होता है? |
| **OTP Expiry Logic** | क्या `expires_at < datetime.utcnow()` सही तरीके से जाँचा जा रहा है? |
| **Daily Limit Count** | क्या `used_today` UTC Day के अनुसार count हो रहा है, न कि कुल messages? |
| **Storage Accounting** | क्या हर file upload पर `storage_used_bytes` सही तरह से increment होता है? |
| **Concurrent Requests** | क्या एक साथ 2 OTP requests का race condition handle हो रहा है? |
| **Session Ownership** | क्या दूसरे user की session को delete करना रोका गया है? |

---

### 3.2 Business Logic Review (PRD `02_PRD.md` के अनुसार)
| PRD Rule | Code में कहाँ? | Status |
|---|---|---|
| Direct Chat — बिना Login के भी Chat हो | Guest token mechanism | ✅/❌ |
| Free Plan: 30 messages/day limit | `/chat` daily count check | ✅/❌ |
| 500 MB free storage per user | `/files/upload` quota check | ✅/❌ |
| `(+)` button → Camera + File Manager | Frontend `app.js` attachment handler | ✅/❌ |
| Long-press → Pin, Rename, Delete | Sidebar `contextmenu` + `touchstart` event | ✅/❌ |
| Speaker 🔊 → TTS | `SpeechSynthesisUtterance` usage | ✅/❌ |
| 👍👎 rating → DB save | `PATCH /messages/{id}/rating` | ✅/❌ |
| Settings Panel — 500 MB bar | `storage_used_bytes / storage_limit_bytes` calculation | ✅/❌ |

---

### 3.3 Security Review
| Security Check | Rhynia-specific Standards |
|---|---|
| **BCrypt Cost** | `bcrypt.hashpw(pwd, bcrypt.gensalt(rounds=12))` — cost 12 confirmed? |
| **JWT Secret** | `SECRET_KEY` env से आ रहा है, `config.py` में hardcode नहीं? |
| **SQL Injection** | कोई `f"SELECT ... {user_input}"` तो नहीं? सिर्फ ORM? |
| **File MIME Check** | Upload पर `file.content_type` whitelist check हो रहा है? |
| **Path Traversal** | filename में `../` या `..\\` को sanitize किया गया? UUID rename? |
| **CORS** | Dev में `*` OK, Production में `RHYNIA_CORS_ORIGINS` env से? |
| **Secrets in Code** | `.env` से लोड, GitHub में committed नहीं? |
| **Banned Words** | Response output में कोई `ChatGPT`, `Gemini`, `AI` नहीं? |
| **Auth on Protected Routes** | `Depends(get_current_user)` हर protected route पर? |
| **OTP Single-Use** | `is_used = True` verify होते ही set होता है? |

---

### 3.4 Performance Review
| Performance Check | Standard |
|---|---|
| **N+1 Query Problem** | क्या Session list लाते वक्त हर session के लिए separate query तो नहीं? |
| **Unnecessary DB Calls** | एक API request में ज़रूरत से ज़्यादा queries तो नहीं? |
| **Expensive Loops** | Frontend में बार-बार DOM query (`document.querySelectorAll`) loop में? |
| **LLM Timeout** | HuggingFace API call पर timeout (300s) set है? |
| **Image Optimization** | Avatar upload — size limit (5 MB max) और compression? |
| **Indexes Used** | `session_id`, `user_id`, `created_at` पर indexes हैं? |

---

### 3.5 Readability & Clean Code Review
| Clean Code Check | Standard |
|---|---|
| **Function Names** | `get_current_user()`, `verify_otp()` — सेल्फ-एक्सप्लेनेटरी? |
| **Magic Numbers** | `500 * 1024 * 1024` की जगह `config.STORAGE_LIMIT_BYTES`? |
| **Comments** | Complex business logic पर meaningful comments? |
| **Inline JS in HTML** | `index.html` में कोई `<script>` block? — सब `app.js` में होना चाहिए |
| **Inline CSS in HTML** | `style=""` attribute? — सब `style.css` में होना चाहिए |
| **DRY Principle** | Repeated code blocks को function में extract किया? |

---

### 3.6 Architecture Standards Review
| Architecture Check | Rhynia Rule |
|---|---|
| **UI code in backend?** | `main.py` में कोई HTML return? — 🚫 Strictly banned |
| **API call in CSS?** | Frontend `style.css` में JS logic? — 🚫 Banned |
| **Hardcoded API URL** | `app.js` में `http://localhost:8000` hardcode? — 🚫 सिर्फ `config.js` में |
| **3-Layer separation** | `frontend/` → `backend/` → `database/` — कोई cross-layer mixing? |
| **Model in routes?** | DB query सीधे route में? — बेहतर: separate helper function |
| **Raw SQL** | `db.execute("SELECT ...")` — 🚫 Banned, सिर्फ ORM |

---

## 4️⃣ COMMENTS & FEEDBACK (Line-by-Line Review)

### Comment Examples (Rhynia SaaS के लिए):

**❌ Bug Example:**
```python
# auth.py — Line 45
# ❌ PROBLEM: timezone-naive comparison crash कर सकती है
if otp.expires_at < datetime.utcnow():
```
**✅ Fix:**
```python
# ✅ FIX: timezone-aware comparison
from datetime import timezone
if otp.expires_at.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
```

---

**❌ Security Example:**
```python
# main.py — Line 23
# ❌ PROBLEM: SECRET_KEY hardcoded है!
SECRET_KEY = "my-secret-123"
```
**✅ Fix:**
```python
# ✅ FIX: env से लो
SECRET_KEY = os.getenv("RHYNIA_SECRET_KEY")
if not SECRET_KEY:
    raise RuntimeError("RHYNIA_SECRET_KEY environment variable not set!")
```

---

**❌ Architecture Example:**
```javascript
// app.js — Line 112
// ❌ PROBLEM: API URL hardcoded है
const res = await fetch("http://localhost:8000/api/v1/chat", {...})
```
**✅ Fix:**
```javascript
// ✅ FIX: config.js से लो
const res = await fetch(`${CONFIG.API_BASE}/chat`, {...})
```

---

**❌ Banned Word Example:**
```javascript
// index.html — Line 67
// ❌ PROBLEM: Banned word मिला!
<p class="typing">AI is thinking...</p>
```
**✅ Fix:**
```html
<!-- ✅ FIX: Brand name use karo -->
<p class="typing">Rhynia is thinking…</p>
```

---

## 5️⃣ DEVELOPER FIX करता है
* Reviewer के comments पर उसी Branch में सुधार करता है।
* हर fix के बाद एक नया clean commit:
```bash
git commit -m "fix(auth): use timezone-aware OTP expiry comparison"
git commit -m "fix(config): move SECRET_KEY to env variable"
git commit -m "fix(frontend): use CONFIG.API_BASE instead of hardcoded URL"
```

---

## 6️⃣ RE-REVIEW (दोबारा जाँच)
* Reviewer (AGY) verify करता है कि सभी comments resolve हो गए।
* अगर नए issues मिले → Step 4 पर वापस।
* अगर सब ठीक → Step 7 Approval।

---

## 7️⃣ APPROVAL (PR Approve)
* सभी checklist items ✅ होने पर PR **Officially Approved**।
* **Approval Criteria (Rhynia SaaS):**
  - [x] कोई Security issue नहीं।
  - [x] कोई banned word नहीं (ChatGPT, AI, Gemini, bot, Founder name)।
  - [x] 3-Layer Architecture maintain है।
  - [x] Thunder Client tests pass।
  - [x] Edge cases handled।
  - [x] Business Logic PRD के अनुसार।

---

## 8️⃣ MERGE to MAIN (Production Code में)
```bash
git checkout main
git merge feature/sprint1-database-auth
git push origin main
```
> **यहीं से Step 10 (CI/CD Build & Deployment) automatically trigger होता है।**

### Merge Strategy:
| Sprint | Merge होने पर क्या होगा |
|---|---|
| Sprint 1 | Auth system live (local) |
| Sprint 2 | Chat system live (local) |
| Sprint 3 | File upload system live (local) |
| Sprint 4 | Full UI live (browser) |
| Sprint 5 | Production deployment (Render + Vercel) |

---

## 9️⃣ AI के साथ SOLO DEVELOPER MULTI-ROLE REVIEW

### AGY को Review कराने का तरीका:

| Review Focus | AGY से क्या पूछें |
|---|---|
| **Bugs** | "इस `auth.py` फ़ाइल में कोई logic bug, null handling issue, या edge case failure है क्या?" |
| **Security** | "इस code में कोई exposed secret, SQL injection hole, या CORS misconfiguration है क्या?" |
| **Performance** | "इस `/chat` endpoint में कोई N+1 query problem या unnecessary DB call है क्या?" |
| **Clean Code** | "इस `app.js` में कोई magic number, repeated code block, या unclear function name है क्या?" |
| **Architecture** | "क्या frontend में कोई hardcoded API URL है? Backend में कोई UI code है?" |
| **Banned Words** | "पूरे codebase में grep करो — `ChatGPT`, `Gemini`, `AI assistant`, `bot` में से कुछ है क्या?" |
| **Full Review** | "Sprint 2 का पूरा code review करो। सभी issues की numbered list बनाओ और हर एक का fix बताओ।" |

---

## 🔥 Step 9 का Final Output

**PR Approved + Merged** — यह feature अब `main` branch का हिस्सा है और:
1. **Step 10 (CI/CD)**: Automated build और deployment trigger होती है।
2. **Sprint Board**: Task `[x] Done` में move होता है।
3. **Next Task**: Sprint Board से अगला Task उठाया जाता है।

```
Review Cycle Complete:
✅ Bugs Fixed
✅ Security Verified
✅ Performance OK
✅ Architecture Standards Met
✅ Banned Words — Zero Found
✅ PR Merged to Main
━━━━━━━━━━━━━━━━━━━━━━━━━━
→ NEXT: Step 10 (CI/CD Build) Triggers Automatically
```

> **CODE REVIEW WORKFLOW LOCKED 🔒**  
> हर PR इसी 9-Step cycle से गुज़रेगा — बिना exception के।
