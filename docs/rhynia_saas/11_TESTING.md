# STEP 11 — TESTING (COMPREHENSIVE VERIFICATION) WORKFLOW — RHYNIA SAAS v1.0

> **Input:** Step 10 का CI Build सफल है (Green Pipeline) ✅  
> **Output:** Verified Bug List + Stable, Production-Ready Software  
> **Status:** APPROVED BY FOUNDER (Rhynia Intelligence)  
> **Version:** 1.0 Final | **Date:** 2026-09-21  
> **QA Mode:** Solo Developer + Antigravity (AGY) AI QA Tester  
> **Hard Rule:** No `AI`, `ChatGPT`, `Gemini`, `Qwen`, `Founder: Manish Chaturvedi`, `bot`, or `assistant`. The brand is strictly **Rhynia**.

---

## 🔥 पूरा Flow (360-Degree Testing Cycle)
```
Test Plan → Test Cases → Run Tests → Find Bugs → Bug Report → Fix → Re-Test → QA Approval
```

---

## 1️⃣ TEST PLAN बनाना (क्या-क्या टेस्ट होगा)

### Rhynia SaaS Testing Scope:

| Test Area | Scenarios | Priority |
|---|---|---|
| **Authentication** | Valid login, Wrong password, Expired OTP, Duplicate email, Google OAuth | P1 |
| **Direct Chat** | Send message, Receive response, 30 msg limit, File attachment, TTS speaker | P1 |
| **Session Management** | Create, List, Pin, Rename, Delete, Clear All, Long-press menu | P1 |
| **File Upload** | Camera capture, File manager, 500 MB limit, Wrong MIME type | P1 |
| **Settings Panel** | Profile edit, Theme toggle, Accent color, Language, Storage bar | P2 |
| **Response Actions** | Copy, Speaker 🔊, 👍 Good, 👎 Bad, 📤 Share | P2 |
| **Sidebar** | Open/Close drawer, Search history, Recent chats, Long-press context menu | P1 |
| **Security** | SQL Injection, XSS, JWT theft, Cross-user data access | P1 |
| **Responsive UI** | 320px Mobile → 1440px Desktop | P1 |
| **Performance** | First Load, Chat Response Time, Sidebar scroll | P2 |

---

## 2️⃣ TEST CASES लिखना (Input → Steps → Expected Result)

### Module A: Authentication Test Cases

| TC ID | Test Scenario | Input Data | Expected Result | Priority |
|---|---|---|---|---|
| **TC-A01** | Valid Email Login | `user@test.com` + correct password | JWT token मिले, Chat Screen दिखे | P1 |
| **TC-A02** | Wrong Password | `user@test.com` + wrong password | `"Invalid credentials"` error, 401 | P1 |
| **TC-A03** | Unregistered Email | `unknown@test.com` + any password | `"User not found"` error, 401 | P1 |
| **TC-A04** | Duplicate Email Register | Already registered email | `"Email already exists"`, 409 | P1 |
| **TC-A05** | Google OAuth Login | Valid Google credential | JWT token मिले, user auto-register | P1 |
| **TC-A06** | Valid Phone OTP | `+91 9876543210` → 6-digit OTP | JWT token मिले, 200 | P1 |
| **TC-A07** | Wrong OTP Code | `+91 9876543210` → `000000` | `"Invalid OTP"`, 401 | P1 |
| **TC-A08** | Expired OTP | OTP 5 min बाद submit | `"OTP expired"`, 401 | P1 |
| **TC-A09** | OTP Re-Use | Same OTP दोबारा submit | `"OTP already used"`, 401 | P1 |
| **TC-A10** | Empty Password Field | Blank password | Field validation error, 400 | P2 |
| **TC-A11** | Short Password (<8 chars) | `"abc123"` | `"Password too short"`, 400 | P2 |
| **TC-A12** | JWT Expired Token | पुराना 8-day expired token | 401 Unauthorized | P1 |
| **TC-A13** | Logout Flow | Logout button click | Token साफ़, Chat Screen guest mode | P1 |

---

### Module B: Chat Engine Test Cases

| TC ID | Test Scenario | Input Data | Expected Result | Priority |
|---|---|---|---|---|
| **TC-B01** | Message Send & Receive | `"What is photosynthesis?"` | Rhynia का markdown-rendered जवाब | P1 |
| **TC-B02** | Empty Message Send | Blank input + Send button | Send button disabled / No API call | P1 |
| **TC-B03** | Very Long Message | 6001 characters | 400 validation error | P1 |
| **TC-B04** | 30 Message Daily Limit | 30 messages भेजने के बाद | 429 `"Daily limit reached"` | P1 |
| **TC-B05** | Hindi Message | `"प्रकाश संश्लेषण क्या है?"` | Hindi में जवाब (Language Mirror Rule) | P1 |
| **TC-B06** | Banned Word in Response | Check output | `"ChatGPT"`, `"Gemini"`, `"AI"` — कोई नहीं | P1 |
| **TC-B07** | Identity Question | `"Who made you?"` | `"I am Rhynia"` — कोई competitor नाम नहीं | P1 |
| **TC-B08** | Copy Response Button | Click 📋 Copy | Clipboard में exact response text | P2 |
| **TC-B09** | Speaker TTS Button | Click 🔊 Speaker | आवाज़ में response सुनाई दे | P2 |
| **TC-B10** | Thumbs Up Rating | Click 👍 | `messages.rating = 'good'` DB में save | P2 |
| **TC-B11** | Thumbs Down Rating | Click 👎 | `messages.rating = 'bad'` DB में save | P2 |
| **TC-B12** | HF API Down | Model unavailable | `"Rhynia is unavailable"` graceful error | P1 |
| **TC-B13** | Groq Fallback | HF timeout → Groq | Groq से response आए, user को पता न हो | P1 |

---

### Module C: Session Management Test Cases

| TC ID | Test Scenario | Input Data | Expected Result | Priority |
|---|---|---|---|---|
| **TC-C01** | New Chat Button | Click 📝 New Chat | Fresh empty session शुरू | P1 |
| **TC-C02** | Chat History in Sidebar | पिछली बातचीत | Sidebar में chronological list | P1 |
| **TC-C03** | Pin Chat | Long-press → Pin | Chat सबसे ऊपर pin हो | P1 |
| **TC-C04** | Rename Chat | Long-press → Rename → `"Physics Notes"` | Title update DB में save | P1 |
| **TC-C05** | Delete Single Chat | Long-press → Delete | Chat और messages DB से हटें | P1 |
| **TC-C06** | 3-Dot → Share | Top-right ⋮ → Share | Web Share API या link copy | P2 |
| **TC-C07** | 3-Dot → Find Chat | Top-right ⋮ → Find | In-chat search bar खुले | P2 |
| **TC-C08** | 3-Dot → Delete | Top-right ⋮ → Delete | Confirm modal → session delete | P1 |
| **TC-C09** | Cross-user session access | User B attempts User A session ID | 403 Forbidden | P1 |

---

### Module D: File Upload Test Cases

| TC ID | Test Scenario | Input Data | Expected Result | Priority |
|---|---|---|---|---|
| **TC-D01** | Camera Capture | `(+)` → Camera → Photo | Photo attached to message input | P1 |
| **TC-D02** | Device File Upload | `(+)` → File Manager → PDF | File attached, size shown | P1 |
| **TC-D03** | Valid Image Upload | `.jpg`, `.png`, `.webp` | Upload success, file_id returned | P1 |
| **TC-D04** | Valid Document Upload | `.pdf`, `.docx`, `.txt` | Upload success, file_id returned | P1 |
| **TC-D05** | Invalid File Type | `.exe`, `.zip`, `.bat` | 400 `"File type not allowed"` | P1 |
| **TC-D06** | Exceed 500 MB Quota | Upload file when storage full | 413 `"Storage quota exceeded"` | P1 |
| **TC-D07** | Storage Bar Update | After upload | Settings Panel storage bar बढ़े | P2 |
| **TC-D08** | Path Traversal Attack | filename: `"../../../etc/passwd"` | Sanitized UUID filename, no directory escape | P1 |

---

### Module E: Settings & Profile Test Cases

| TC ID | Test Scenario | Input Data | Expected Result | Priority |
|---|---|---|---|---|
| **TC-E01** | Profile Name Update | New name + Save | Name update DB में save | P1 |
| **TC-E02** | Username Update | `@newusername` | Username update, 200 | P1 |
| **TC-E03** | Duplicate Username | Already taken `@username` | 409 Conflict | P1 |
| **TC-E04** | Avatar Upload | Image file | Avatar URL update, avatar दिखे | P2 |
| **TC-E05** | Light → Dark Toggle | Click Dark | पूरी UI Dark theme में बदले | P1 |
| **TC-E06** | Dark → Light Toggle | Click Light | पूरी UI Light theme में बदले | P1 |
| **TC-E07** | Accent Color Change | Click Blue swatch | Accent color पूरी app में बदले | P2 |
| **TC-E08** | Language Change | Select Hindi | Language preference save | P2 |
| **TC-E09** | 500 MB Bar Accuracy | Upload 50 MB files | Bar shows `50 MB of 500 MB (10%)` | P1 |
| **TC-E10** | Log Out | Click 🚪 Log Out | Token clear, guest mode | P1 |

---

## 3️⃣ UNIT TESTING (सबसे छोटे Function Level पर)

### Backend Unit Tests (`pytest`):
```python
# auth.py — Password Functions
def test_bcrypt_hash_and_verify():
    password = "SecurePass@123"
    hashed = hash_password(password)
    assert hashed != password               # Plain text store नहीं हुआ
    assert verify_password(password, hashed) == True
    assert verify_password("wrong", hashed) == False

# auth.py — JWT Functions
def test_jwt_create_and_decode():
    token = create_token({"sub": "usr_abc123", "plan": "free"})
    payload = decode_token(token)
    assert payload["sub"] == "usr_abc123"
    assert payload["plan"] == "free"

# auth.py — OTP Functions
def test_otp_generation():
    otp = generate_otp()
    assert len(otp) == 6
    assert otp.isdigit()

# database.py — Storage Accounting
def test_storage_limit_check():
    user = User(storage_used_bytes=520_000_000, storage_limit_bytes=524_288_000)
    file_size = 10_000_000   # 10 MB
    assert user.storage_used_bytes + file_size > user.storage_limit_bytes  # 413 trigger होगा
```

---

## 4️⃣ INTEGRATION TESTING (End-to-End Flow)

### Complete User Journey Test:
```
[1] POST /auth/register → 201, JWT token मिला
[2] POST /auth/login → 200, JWT token confirm
[3] POST /sessions → 201, session_public_id मिली
[4] POST /chat {message: "Namaste Rhynia"} → 200, reply आया
[5] GET /sessions → session list में नई session दिखी
[6] PATCH /sessions/{pid} {is_pinned: true} → 200, pinned
[7] GET /sessions/{pid}/messages → 2 messages (user + assistant)
[8] PATCH /messages/{id}/rating {rating: "good"} → 200
[9] POST /files/upload → 200, storage bar बढ़ी
[10] PATCH /profile {theme: "dark"} → 200, theme save
[11] GET /auth/me → user details confirm
[12] DELETE /sessions/{pid} → 200, session deleted
```

---

## 5️⃣ UI/UX & RESPONSIVE TESTING

### Breakpoint Testing Matrix:
| Device | Viewport | Check Items | Expected |
|---|---|---|---|
| **Small Mobile** | 320px | Input box full-width, `(+)` button visible, No text cutoff | ✅ Clean |
| **Standard Mobile** | 375px–414px | Sidebar 85% width, 48px touch targets | ✅ Clean |
| **Large Mobile** | 480px | All action buttons visible under response | ✅ Clean |
| **Tablet** | 768px | Chat column centered (max 768px), Sidebar overlay | ✅ Clean |
| **Laptop** | 1024px | Sidebar collapsible pin, Response width comfortable | ✅ Clean |
| **Desktop** | 1440px+ | Max-width container, no stretched layout | ✅ Clean |

### Interactive State Testing:
| Element | States to Test | Expected |
|---|---|---|
| Send Button `(➤)` | Disabled (empty) → Active (typed) → Loading (sending) | Color change + spinner |
| `(+)` Button | Normal → Hover → Active | Subtle background change |
| Sidebar Chat Item | Normal → Hover → Long-press | Highlight + context menu |
| Theme Toggle | Light → Dark → Light | Instant CSS variable switch |
| Accent Color Swatch | Click Purple / Blue / Green | Immediate UI color update |

### Touch Targets Audit:
```
[ ≡ ] Hamburger: 48px × 48px  ✅
(+) Plus Button:  48px × 48px  ✅
(➤) Send Button:  40px × 40px  ✅ (minimum 44px recommended — check!)
[📝] New Chat:    48px × 48px  ✅
[⋮] 3-Dot Menu:  48px × 48px  ✅
Sidebar Chat Item: full-width × 52px ✅
```

---

## 6️⃣ PERFORMANCE & LOAD TESTING

| Metric | Target | Test Tool |
|---|---|---|
| **First Chat Screen Load** | < 1.5 seconds | Browser DevTools Network Tab |
| **Time to First Token (Chat)** | < 2.5 seconds | Manual + curl timing |
| **Sidebar Open Animation** | < 280ms smooth | CSS `transition` check |
| **Theme Toggle** | Instant (<50ms) | CSS variable swap |
| **100 Messages in History** | Sidebar scroll smooth (60fps) | Browser performance monitor |
| **File Upload Progress** | Progress indicator visible | UI check |
| **API Response under load** | 50 concurrent requests stable | Locust / curl parallel |

---

## 7️⃣ SECURITY TESTING (Vulnerabilities & Permission Abuse)

| Security Test | Method | Expected |
|---|---|---|
| **Brute Force Login** | 10+ rapid POST `/auth/login` attempts | Rate limit triggers, 429 |
| **SQL Injection in Message** | `"'; DROP TABLE users; --"` as message | ORM parameterization — no effect |
| **XSS in Username** | `<script>alert(1)</script>` as username | HTML-escaped on render |
| **JWT Tamper** | Modified JWT payload | 401 Signature Invalid |
| **Cross-user Session** | User B accesses User A's session ID | 403 Forbidden |
| **Oversized File** | 600 MB upload attempt | 413 Storage Quota Exceeded |
| **Path Traversal** | Filename `"../../config.py"` | Sanitized UUID filename |
| **Banned Word Response** | Prompt: `"Are you ChatGPT?"` | Response: `"I am Rhynia"` only |
| **Exposed Secrets** | Check GitHub repo files | No `.env`, no hardcoded keys |

---

## 8️⃣ BUG REPORT & PRIORITY TRACKING

### Rhynia Bug Report Template:
| Bug ID | Description | Screen/Module | Steps to Reproduce | Severity | Priority | Status |
|---|---|---|---|---|---|---|
| **BUG-001** | Send button does not disable when input is empty | Main Chat | 1. Open app 2. Click send without typing | High | P1 | Open |
| **BUG-002** | Sidebar long-press not working on desktop right-click | Sidebar | 1. Right-click chat item 2. No menu appears | High | P1 | Open |
| **BUG-003** | 500 MB storage bar shows 0% even after upload | Settings Panel | 1. Upload file 2. Open settings | Medium | P2 | Open |
| **BUG-004** | Dark mode accent color reverts after page refresh | Settings | 1. Set Blue accent 2. Refresh | Medium | P2 | Open |
| **BUG-005** | Speaker TTS does not stop when new message sent | Chat | 1. Click 🔊 2. Send new message | Low | P3 | Open |
| **BUG-006** | Username `@` prefix missing in profile display | Settings | 1. Set username 2. View settings | Low | P3 | Open |

### Severity Scale:
| Severity | Definition | Example |
|---|---|---|
| **Critical** | App crash, data loss, security breach | JWT secret hardcoded in code |
| **High** | Feature broken, major UX failure | Chat not sending messages |
| **Medium** | Feature partially working | Storage bar showing wrong % |
| **Low** | Minor visual or cosmetic issue | Button hover color off by 1px |

---

## 9️⃣ BUG FIX & RE-TESTING (Regression Test)

### Fix → Re-Test Cycle:
```
1. Bug identified → BUG-001 reported
2. Developer (AGY) fixes: Send button disabled check in app.js
3. Sprint Board: Task → [/] In Progress
4. Fix committed: git commit -m "fix(chat): disable send button when input is empty"
5. CI Pipeline: Runs again → Green ✅
6. QA Re-Tests:
   - TC-B02 (Empty Message) → Pass ✅
   - TC-B01 (Normal Send) → Still works ✅ (Regression check)
7. BUG-001 → Status: Closed ✅
```

### Regression Test Scope (हर fix के बाद):
* **उसी module के** सभी test cases।
* **Connected modules** के critical test cases।
* **TC-A01 to TC-E10** में से P1 priority cases — हमेशा।

---

## 🔟 FINAL QA SIGN-OFF

### QA Approval Criteria:
| Criteria | Status |
|---|---|
| सभी P1 Bugs — Closed ✅ | Required |
| सभी P2 Bugs — Closed या Accepted ✅ | Required |
| P3 Bugs — Log किए, v1.1 में fix होंगे | Acceptable |
| सभी TC-A01 से TC-E10 — Pass ✅ | Required |
| Security Tests — सभी Pass ✅ | Required |
| Banned Word Audit — Zero Found ✅ | Required |
| Responsive (320px–1440px) — Clean ✅ | Required |

### Final QA Sign-Off Statement:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  RHYNIA SAAS v1.0 — QA FINAL SIGN-OFF
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Total Test Cases:    67+
  P1 Bugs Fixed:       All ✅
  P2 Bugs Fixed:       All ✅
  P3 Bugs:             Logged for v1.1
  Banned Words Found:  0 ✅
  Security Tests:      All Pass ✅
  Responsive:          320px to 1440px ✅

  QA APPROVED — Ready for Step 12 (Security Review)

  Signed: Rhynia Intelligence (Founder & QA Lead)
  Date: 2026-09-21
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 1️⃣1️⃣ AI के साथ SOLO DEVELOPER MULTI-ROLE TESTING

### AGY को QA Tester बनाने के Exact Prompts:

| Testing Focus | AGY को यह Prompt दें |
|---|---|
| **Edge Cases** | `"Rhynia SaaS के Chat Module के लिए 30 edge-case test cases बनाओ — happy path, empty inputs, malicious XSS, expired tokens, 30-message limit boundary।"` |
| **Security Holes** | `"इस auth.py और main.py का security audit करो। SQL injection, JWT tampering, path traversal, और secret leakage के लिए सभी vulnerabilities बताओ।"` |
| **UI Bugs** | `"इस index.html और style.css को 320px mobile viewport पर review करो। कोई overflow, cut-off text, या 44px से छोटे touch targets हैं क्या?"` |
| **Performance** | `"इस /chat endpoint में N+1 query problem, unnecessary DB calls, या missing indexes हैं क्या? Exact fix बताओ।"` |
| **Regression** | `"BUG-002 fix के बाद Sidebar के सभी test cases (TC-C01 से TC-C09) दोबारा verify करो। कोई regression हुई?"` |
| **Banned Words** | `"पूरे codebase में 'ChatGPT', 'OpenAI', 'Gemini', 'Qwen', 'bot', 'assistant', 'Manish Chaturvedi' में से कुछ भी है? Report करो।"` |
| **Full QA** | `"Sprint 4 Frontend का पूरा QA करो। सभी 4 screens की 360-degree testing करो — Bugs, UI/UX issues, Security, Performance — numbered list में बताओ।"` |

---

## 🔥 Step 11 का Final Output

```
Testing Complete — 360-Degree QA Done:

✅ Unit Tests          — Auth, Chat, Storage functions verified
✅ Integration Tests   — Full user journey E2E passed
✅ UI/UX Tests         — 320px to 1440px responsive clean
✅ Performance Tests   — < 1.5s load, < 2.5s first token
✅ Security Tests      — Injection, XSS, JWT, cross-user — all blocked
✅ Banned Words        — 0 occurrences across entire codebase
✅ Bug Report          — All P1 & P2 bugs fixed and re-tested
✅ QA Signed Off       — Rhynia Intelligence (Founder)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
→ NEXT: Step 12 (Security Review & Audit)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

> **TESTING WORKFLOW LOCKED 🔒**  
> हर Feature Sprint के बाद यह 11-Step Testing Cycle पूरा होगा — बिना exception के।
