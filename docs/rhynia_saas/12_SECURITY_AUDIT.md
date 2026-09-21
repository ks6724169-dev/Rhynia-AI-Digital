# STEP 12 — SECURITY REVIEW & AUDIT WORKFLOW — RHYNIA SAAS v1.0

> **Input:** Step 11 (Testing) पूरा हो चुका है, QA Signed-Off ✅  
> **Output:** Security Audit Passed, Hardened & Approved Software  
> **Status:** APPROVED BY FOUNDER (Rhynia Intelligence)  
> **Version:** 1.0 Final | **Date:** 2026-09-21  
> **Audit Mode:** Solo Developer + Antigravity (AGY) AI Security Analyst  
> **Standard:** OWASP Top 10 Compliance  
> **Hard Rule:** No `AI`, `ChatGPT`, `Gemini`, `Qwen`, `Founder: Manish Chaturvedi`, `bot`, or `assistant`. The brand is strictly **Rhynia**.

---

## 🔥 पूरा Flow (Security Audit Cycle)
```
Security Checklist → Code Audit → Auth Check → RBAC Verification →
Data Protection → Vulnerability Scan → Penetration Test → Fix → Recheck → Security Sign-off
```

---

## 1️⃣ SECURITY CHECKLIST बनाना (Audit Scope)

Rhynia SaaS की पूरी Security का Scope:

| # | Security Domain | जाँच का सवाल | Status |
|---|---|---|---|
| 1 | **Authentication** | JWT tokens सुरक्षित secret से बने हैं? Expiry 7 days? | [ ] |
| 2 | **Password Storage** | BCrypt cost 12 से hash हो रहा है? Plain text कहीं नहीं? | [ ] |
| 3 | **Session Management** | Logout पर client + server दोनों तरफ token clear? | [ ] |
| 4 | **API Protection** | सभी protected routes पर `Depends(get_current_user)`? | [ ] |
| 5 | **Rate Limiting** | Login, OTP, Chat — सब पर rate limiting है? | [ ] |
| 6 | **SQL Injection** | 100% ORM parameterized queries? कोई raw SQL नहीं? | [ ] |
| 7 | **XSS Prevention** | User inputs HTML-escaped होकर render हो रहे हैं? | [ ] |
| 8 | **RBAC** | User A कभी User B का data access नहीं कर सकता? | [ ] |
| 9 | **Secrets Management** | `.env` gitignored? कोई key code में hardcode नहीं? | [ ] |
| 10 | **File Upload Security** | MIME check, UUID rename, path traversal blocked? | [ ] |
| 11 | **Data Encryption** | HTTPS in production? Database at rest encryption? | [ ] |
| 12 | **Banned Words** | Response में `ChatGPT`, `Gemini`, `AI`, `bot` नहीं? | [ ] |
| 13 | **IDOR Protection** | Session/File IDs public UUIDs हैं, sequential IDs नहीं? | [ ] |
| 14 | **Security Headers** | CSP, HSTS, X-Frame-Options headers set हैं? | [ ] |

---

## 2️⃣ AUTHENTICATION CHECK (Login & Session Security)

### 2.1 Password Security Audit:
```python
# ✅ CORRECT — BCrypt cost 12, hash stored
import bcrypt
password_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt(rounds=12))

# ❌ WRONG — Plain text stored (NEVER ACCEPTABLE)
user.password = "user_plain_password"

# ✅ CORRECT — Verify with constant-time comparison
bcrypt.checkpw(input_password.encode(), stored_hash)
```

### Security Check Points:
| Check | Standard | Rhynia Status |
|---|---|---|
| Password hashing algorithm | BCrypt (rounds=12) | Must verify in `auth.py` |
| Hash stored in DB | `password_hash` column only | Never `password` column |
| Plain text password in logs | NEVER | Search logs for any password prints |
| Password minimum length | 8 characters | Pydantic validator in register endpoint |
| Password maximum length | 72 characters | BCrypt 72-byte safe limit |

### 2.2 JWT Token Security Audit:
```python
# ✅ CORRECT — Secure JWT
SECRET_KEY = os.getenv("RHYNIA_SECRET_KEY")   # env से, hardcode नहीं
if not SECRET_KEY or len(SECRET_KEY) < 32:
    raise RuntimeError("SECRET_KEY must be at least 32 characters")

token = jwt.encode(
    {"sub": user.public_id, "exp": datetime.utcnow() + timedelta(days=7)},
    SECRET_KEY,
    algorithm="HS256"
)

# ❌ WRONG — Hardcoded secret (CRITICAL vulnerability)
SECRET_KEY = "my-secret"
```

| JWT Check | Standard | Acceptable |
|---|---|---|
| Algorithm | HS256 | ✅ |
| Expiration | 7 days (`exp` claim) | ✅ |
| Secret length | Minimum 32 characters random | ✅ |
| Secret source | `RHYNIA_SECRET_KEY` environment variable | ✅ |
| Token in logs | NEVER printed | Must verify |

### 2.3 Logout Security:
```javascript
// ✅ CORRECT Frontend logout
function logout() {
    localStorage.removeItem('rhynia_token');  // Client-side token clear
    AppState.token = null;
    AppState.user = null;
    renderEmptyChatScreen();  // Guest mode
}
```
> **Note:** Rhynia uses stateless JWT — server-side revocation not needed for v1.0.
> For v1.1, implement token blacklist (Redis) for immediate logout enforcement.

---

## 3️⃣ RBAC VERIFICATION (Role-Based Access Control)

### Access Control Matrix:
| Endpoint | Guest | Registered User | Admin | Verification Method |
|---|---|---|---|---|
| `POST /auth/register` | ✅ | ✅ | ✅ | No auth needed |
| `POST /auth/login` | ✅ | ✅ | ✅ | No auth needed |
| `GET /api/v1/health` | ✅ | ✅ | ✅ | No auth needed |
| `POST /api/v1/chat` | ❌ | ✅ (30/day) | ✅ | `Depends(get_current_user)` |
| `GET /api/v1/sessions` | ❌ | ✅ (own only) | ✅ | `user_id = current_user.id` filter |
| `DELETE /api/v1/sessions/{pid}` | ❌ | ✅ (own only) | ✅ | Ownership check before delete |
| `POST /api/v1/files/upload` | ❌ | ✅ (500MB) | ✅ | Quota check |
| `PATCH /api/v1/profile` | ❌ | ✅ (own only) | ✅ | `user_id = current_user.id` |

### IDOR (Insecure Direct Object Reference) Protection:
```python
# ✅ CORRECT — Ownership check (IDOR prevention)
session = db.query(Session).filter(
    Session.public_id == pid,
    Session.user_id == current_user.id  # ← यह line IDOR रोकती है
).first()

if not session:
    raise HTTPException(status_code=404, detail="Session not found")

# ❌ WRONG — No ownership check (IDOR vulnerable!)
session = db.query(Session).filter(Session.public_id == pid).first()
# User B किसी भी pid डालकर User A का session access कर सकता है!
```

### IDOR Penetration Test:
```bash
# Test: User A का token लेकर User B की session access करने की कोशिश
curl -X GET "http://localhost:8000/api/v1/sessions/USER_B_SESSION_ID/messages" \
  -H "Authorization: Bearer USER_A_JWT_TOKEN"

# Expected Result:
# HTTP 404 Not Found ← ✅ SECURE (session not found for this user)
# HTTP 200 OK        ← ❌ IDOR VULNERABILITY! Fix immediately.
```

---

## 4️⃣ DATA PROTECTION & ENCRYPTION

### 4.1 Data in Transit (Communication Security):
| Environment | Protocol | Status |
|---|---|---|
| **Development** | HTTP `localhost:8000` | OK (local only) |
| **Production** | HTTPS (TLS 1.3) — Render auto-provides SSL | MANDATORY |

### 4.2 Data at Rest (Storage Security):
```bash
# SQLite — Development
# File: database/rhynia.db
# Encryption: Not needed for dev (localhost, no network exposure)

# Supabase PostgreSQL — Production
# Encryption: Supabase handles at-rest encryption automatically ✅
# Row Level Security (RLS): Configure for additional protection
```

### 4.3 Secrets Management Audit:
```bash
# ✅ CORRECT — Secrets in .env (gitignored)
RHYNIA_SECRET_KEY=super-random-256bit-string-here
RHYNIA_HF_TOKEN=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
RHYNIA_GROQ_KEY=gsk_your-groq-key-here
RHYNIA_DATABASE_URL=postgresql://user:pass@host/db

# Verify .gitignore has:
echo ".env" >> .gitignore
echo "database/*.db" >> .gitignore
echo "uploads/" >> .gitignore
```

```bash
# Secrets Leak Scan — Run before every commit
grep -r "hf_" services/ --include="*.py" --include="*.js"
grep -r "gsk_" services/ --include="*.py" --include="*.js"
grep -r "SECRET" services/ --include="*.py" | grep -v "os.getenv"
# Expected: 0 results ← ✅ Clean
```

---

## 5️⃣ API SECURITY & INPUT SANITIZATION

### 5.1 Protected Route Guard:
```python
# ✅ CORRECT — Every protected route uses dependency injection
from fastapi import Depends

@app.post("/api/v1/chat")
async def chat(
    request: ChatRequest,
    current_user: User = Depends(get_current_user)  # ← auth guard
):
    ...

# ❌ WRONG — No auth guard
@app.post("/api/v1/chat")
async def chat(request: ChatRequest):
    # Anyone can call this without token!
    ...
```

### 5.2 Input Sanitization (Pydantic):
```python
# ✅ CORRECT — Strict Pydantic validation
class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=6000)
    session_public_id: Optional[str] = None

class RegisterRequest(BaseModel):
    email: EmailStr                              # Auto email format check
    password: str = Field(..., min_length=8, max_length=72)
    name: Optional[str] = Field(None, max_length=100)

class ProfileUpdateRequest(BaseModel):
    name: Optional[str] = Field(None, max_length=100)
    username: Optional[str] = Field(None, max_length=30, pattern=r"^[a-zA-Z0-9_]+$")
```

### 5.3 Rate Limiting Implementation:
```python
# Simple rate limiting (v1.0 — plan-based daily count)

# Login rate limiting (prevent brute-force)
MAX_LOGIN_ATTEMPTS = 10      # 10 attempts per hour per IP
OTP_RATE_LIMIT = 3           # 3 OTP requests per 10 minutes per phone

# Chat daily limit
FREE_DAILY_LIMIT = 30        # messages per UTC day
PRO_DAILY_LIMIT = 500

# Check in /chat endpoint
used_today = db.query(Message).filter(
    Message.user_id == current_user.id,
    Message.role == "user",
    Message.created_at >= today_utc_start
).count()

if used_today >= daily_limit:
    raise HTTPException(status_code=429, detail="Daily message limit reached")
```

### 5.4 XSS Prevention (Frontend):
```javascript
// ✅ CORRECT — Safe text rendering (no HTML injection)
function renderMessage(content) {
    const div = document.createElement('div');
    div.textContent = content;  // ← textContent, NOT innerHTML
    return div;
}

// ❌ WRONG — XSS vulnerable
function renderMessage(content) {
    return `<div>${content}</div>`;  // User can inject <script> tags!
}

// ✅ CORRECT — For markdown rendering, use DOMPurify to sanitize
import DOMPurify from 'dompurify';
div.innerHTML = DOMPurify.sanitize(markdownToHTML(content));
```

---

## 6️⃣ AUTOMATED VULNERABILITY SCANNING (SAST)

### 6.1 Static Code Analysis:
```bash
# Python Security Scan (Bandit — SAST tool)
pip install bandit
bandit -r services/rhynia_saas/backend/ -ll

# Expected output:
# No issues identified. ✅
# OR:
# >> Issue: [B105:hardcoded_password_string] Possible hardcoded password: 'secret123'
#    Fix: Move to environment variable
```

### 6.2 Dependency Vulnerability Scan:
```bash
# Python packages vulnerability check
pip install safety
safety check -r services/rhynia_saas/backend/requirements.txt

# Expected:
# 0 known security vulnerabilities found ✅
```

### 6.3 Secret Leak Detection (GitLeaks):
```bash
# GitLeaks scan (run locally before push)
gitleaks detect --source . --verbose

# Expected:
# WARN[0000] No leaks found. ✅
```

### 6.4 Banned Words Compliance Scan:
```bash
# Rhynia-specific mandatory scan
python scripts/banned_words_audit.py

# Script checks for:
BANNED = ["ChatGPT", "OpenAI", "Gemini", "Qwen", "bot", "assistant",
          "Manish Chaturvedi", "GPT-4", "Claude", "Llama"]

# Expected:
# ✅ AUDIT PASSED — 0 banned words found across 847 lines scanned.
```

---

## 7️⃣ PENETRATION TESTING (Ethical Hacking Simulations)

### Rhynia SaaS Pen Test Scenarios:

#### PEN-001: Brute Force Login
```bash
# Attack: 50 rapid login attempts with wrong passwords
for i in {1..50}; do
  curl -X POST localhost:8000/api/v1/auth/login \
    -d '{"email":"user@test.com","password":"wrong"}' \
    -H "Content-Type: application/json"
done
# Expected: After 10 attempts → 429 Too Many Requests ✅
# Vulnerable: All 50 return 401 with no rate limit ❌
```

#### PEN-002: JWT Token Tampering
```bash
# Attack: Modify JWT payload to elevate privileges
# Original: {"sub": "usr_abc", "plan": "free", "is_admin": false}
# Tampered: {"sub": "usr_abc", "plan": "enterprise", "is_admin": true}
curl -X GET localhost:8000/api/v1/auth/me \
  -H "Authorization: Bearer TAMPERED_JWT_TOKEN"
# Expected: 401 Signature verification failed ✅
```

#### PEN-003: IDOR — Cross-user Session Access
```bash
# Attack: User B tries to read User A's messages
curl -X GET "localhost:8000/api/v1/sessions/USER_A_SESSION_ID/messages" \
  -H "Authorization: Bearer USER_B_JWT_TOKEN"
# Expected: 404 Not Found ✅
# Vulnerable: 200 with User A's messages ❌ (Critical IDOR!)
```

#### PEN-004: SQL Injection
```bash
# Attack: SQL injection in message content
curl -X POST localhost:8000/api/v1/chat \
  -d '{"message": "hello''; DROP TABLE users; --"}' \
  -H "Authorization: Bearer VALID_JWT"
# Expected: 200 normal response (ORM prevents injection) ✅
```

#### PEN-005: File Path Traversal
```bash
# Attack: Upload file with malicious name
curl -X POST localhost:8000/api/v1/files/upload \
  -F "file=@test.jpg;filename=../../../backend/config.py" \
  -H "Authorization: Bearer VALID_JWT"
# Expected: File saved as UUID name in uploads/ dir ✅
# Vulnerable: config.py overwritten ❌ (Critical!)
```

#### PEN-006: Storage Quota Bypass
```bash
# Attack: Upload files exceeding 500 MB quota
# After storage_used_bytes >= 524288000:
curl -X POST localhost:8000/api/v1/files/upload \
  -F "file=@largefile.pdf" \
  -H "Authorization: Bearer VALID_JWT"
# Expected: 413 Request Entity Too Large ✅
```

#### PEN-007: Unauthorized Admin Access
```bash
# Attack: Non-admin accessing admin-only routes (future v1.1)
curl -X GET localhost:8000/api/v1/admin/users \
  -H "Authorization: Bearer FREE_USER_JWT"
# Expected: 403 Forbidden ✅
```

---

## 8️⃣ SECURITY ISSUE SEVERITY MATRIX

### Found Issues Log:
| Issue ID | Description | Severity | Priority | Status |
|---|---|---|---|---|
| **SEC-001** | JWT secret hardcoded in config.py | Critical 🔴 | P1 | Must Fix Before Launch |
| **SEC-002** | Missing rate limiting on `/auth/login` | High 🟠 | P1 | Must Fix Before Launch |
| **SEC-003** | IDOR — session ownership check missing | Critical 🔴 | P1 | Must Fix Before Launch |
| **SEC-004** | File upload — no MIME type validation | High 🟠 | P1 | Must Fix Before Launch |
| **SEC-005** | Path traversal — filename not sanitized | Critical 🔴 | P1 | Must Fix Before Launch |
| **SEC-006** | Verbose error — stack trace in 500 response | Medium 🟡 | P2 | Fix Before Launch |
| **SEC-007** | Missing security headers (CSP, HSTS) | Low 🟢 | P3 | Fix in v1.1 |
| **SEC-008** | Banned word found: "assistant" in app.js | Critical 🔴 | P1 | Must Fix Before Launch |

### Severity Definitions:
| Severity | Response Time | Definition |
|---|---|---|
| **Critical 🔴** | Immediate — Block Launch | Data breach, identity leakage, admin bypass, IDOR |
| **High 🟠** | Before Launch | Missing rate limit, broken auth, exposed keys |
| **Medium 🟡** | Before Launch (preferred) | Verbose errors, weak headers |
| **Low 🟢** | v1.1 acceptable | Minor security improvements, best practices |

---

## 9️⃣ REMEDIATION & RE-VERIFICATION

### Fix Workflow:
```
Security Issue Found
      │
      ▼
Developer (AGY) इसे तुरंत fix करता है
      │
      ▼
git commit -m "security: fix IDOR by adding user_id ownership check"
      │
      ▼
CI Pipeline (Step 10) — Re-run automatically
      │
      ▼
Pen Test फिर से चलता है (same scenario)
      │
      ├── ✅ Fixed → Issue closed
      └── ❌ Still vulnerable → Back to fix
```

### Example Fix Commits:
```bash
git commit -m "security: move JWT secret to RHYNIA_SECRET_KEY env variable"
git commit -m "security: add user_id ownership check to prevent IDOR on sessions"
git commit -m "security: add MIME type whitelist for file uploads"
git commit -m "security: sanitize filename with UUID to prevent path traversal"
git commit -m "security: add rate limiting to login and OTP endpoints"
git commit -m "fix(frontend): replace 'assistant' with 'Rhynia' brand name"
```

---

## 🔟 FINAL SECURITY APPROVAL (Security Sign-Off)

### Approval Criteria:
| Category | Criteria | Status |
|---|---|---|
| **Critical Issues** | 0 open Critical issues | Required ✅ |
| **High Issues** | 0 open High issues | Required ✅ |
| **Medium Issues** | Resolved or risk-accepted | Required ✅ |
| **Pen Tests** | All 7 pen tests pass | Required ✅ |
| **Secret Scan** | GitLeaks — 0 leaks | Required ✅ |
| **Banned Words** | 0 occurrences | Required ✅ (Zero-Tolerance) |
| **SAST** | Bandit — no HIGH/CRITICAL issues | Required ✅ |
| **RBAC** | All access control matrix verified | Required ✅ |

### Final Security Sign-Off Statement:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  RHYNIA SAAS v1.0 — SECURITY AUDIT SIGN-OFF
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  OWASP Top 10:         All Addressed ✅
  Critical Issues:      0 open ✅
  High Issues:          0 open ✅
  Penetration Tests:    7/7 Pass ✅
  Secret Leak:          0 detected ✅
  Banned Words:         0 found ✅
  RBAC:                 Fully enforced ✅
  HTTPS (Production):   Enabled ✅
  IDOR Protection:      Verified ✅

  SECURITY APPROVED ✅
  Ready for Step 13 — Beta Release

  Signed: Rhynia Intelligence (Founder & Security Lead)
  Date: 2026-09-21
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 1️⃣1️⃣ AI के साथ SOLO DEVELOPER SECURITY AUDIT

### AGY को Security Analyst बनाने के Exact Prompts:

| Audit Focus | AGY को यह Prompt दें |
|---|---|
| **OWASP Top 10** | `"इस auth.py और main.py का OWASP Top 10 vulnerabilities के हिसाब से security review करो। हर vulnerability के लिए: Found/Not Found और fix बताओ।"` |
| **IDOR Check** | `"इस codebase में सभी API endpoints scan करो जहाँ user-specific resources access होती हैं। क्या हर जगह user_id ownership check है? IDOR vulnerability list करो।"` |
| **Secret Scan** | `"पूरे codebase में grep करो — कोई API key, JWT secret, DB password hardcoded है? .env में होना चाहिए।"` |
| **SQL Injection** | `"database.py और main.py में कोई raw SQL string concatenation है? सिर्फ ORM parameterized queries होनी चाहिए।"` |
| **Banned Words** | `"पूरे codebase में 'ChatGPT', 'OpenAI', 'Gemini', 'Qwen', 'bot', 'assistant', 'Manish Chaturvedi' में से कुछ है? Line numbers के साथ report करो।"` |
| **File Security** | `"file upload endpoint में MIME check, filename sanitization, path traversal protection, और 500MB quota enforcement verify करो।"` |
| **Full Audit** | `"Rhynia SaaS का पूरा OWASP Top 10 security audit करो। हर issue को: Severity (Critical/High/Medium/Low), Description, और Exact Fix के साथ numbered list में दो।"` |

---

## 🔥 Step 12 का Final Output

```
Security Audit Complete:

✅ Authentication    — BCrypt + JWT + OTP secure
✅ RBAC              — All endpoints ownership-checked
✅ IDOR              — User_id filter on all user-specific routes
✅ SQL Injection      — 100% ORM, zero raw SQL
✅ XSS               — textContent + DOMPurify used
✅ File Security      — MIME check + UUID rename + Path traversal blocked
✅ Rate Limiting      — Login, OTP, Chat daily limits enforced
✅ Secrets           — All in .env, zero hardcoded, GitLeaks clean
✅ HTTPS             — Enforced on Production (Render + Vercel)
✅ Banned Words      — 0 found across entire codebase
✅ Pen Tests         — 7/7 scenarios hardened

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
→ SECURITY APPROVED ✅
→ NEXT: Step 13 (Beta Release)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

> **SECURITY REVIEW WORKFLOW LOCKED 🔒**  
> हर Production Release से पहले यह complete Security Audit ज़रूर होगा।
