# STEP 10 — CI BUILD (CONTINUOUS INTEGRATION) WORKFLOW — RHYNIA SAAS v1.0

> **Input:** Step 9 में Code `main` Branch में Merge हो गया। ✅  
> **Output:** पुष्टि कि नया Code build हो रहा है और core sanity tests पास हैं।  
> **Status:** APPROVED BY FOUNDER (Rhynia Intelligence)  
> **Version:** 1.0 Final | **Date:** 2026-09-21  
> **CI Tool:** GitHub Actions (Primary) + AGY Verification Tools  
> **Hard Rule:** No `AI`, `ChatGPT`, `Gemini`, `Qwen`, `Founder: Manish Chaturvedi`, `bot`, or `assistant`. The brand is strictly **Rhynia**.

---

## 🔥 पूरा Flow (Automated CI Pipeline)
```
Code Merge → Pipeline Trigger → Build → Dependencies → Tests → Security Scan → Pass ✅ / Fail ❌
```

---

## 1️⃣ PIPELINE अपने-आप शुरू होती है

GitHub Actions Pipeline **तुरंत और अपने-आप** trigger होती है जब:
* **`main` branch में कोई नया commit** आए (Sprint Merge के बाद)।
* **कोई Pull Request** खुले या उसमें नया commit आए।

### GitHub Actions Workflow File:
**फ़ाइल पाथ:** `.github/workflows/ci.yml`
```yaml
name: Rhynia SaaS — CI Build Pipeline

on:
  push:
    branches: [ "main" ]
  pull_request:
    branches: [ "main" ]

jobs:

  # ─────────────────────────────────────────────
  # JOB 1: Backend Build & Verification
  # ─────────────────────────────────────────────
  backend-ci:
    name: Backend CI (Python + FastAPI)
    runs-on: ubuntu-latest

    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Setup Python 3.11
        uses: actions/setup-python@v5
        with:
          python-version: "3.11"

      - name: Install Dependencies
        run: |
          cd services/rhynia_saas/backend
          pip install -r requirements.txt

      - name: Syntax & Lint Check (Flake8)
        run: |
          pip install flake8
          flake8 services/rhynia_saas/backend/ --max-line-length=100

      - name: Import Verification (No Broken Imports)
        run: |
          cd services/rhynia_saas/backend
          python -c "import main; import auth; import database; import config; import llm_engine"

      - name: Run Backend Tests (Pytest)
        run: |
          pip install pytest httpx
          cd services/rhynia_saas/backend
          pytest tests/ -v
        env:
          RHYNIA_SECRET_KEY: "ci-test-secret-key-32chars-minimum"
          RHYNIA_DATABASE_URL: "sqlite:///./test_rhynia.db"
          RHYNIA_HF_TOKEN: ${{ secrets.RHYNIA_HF_TOKEN }}

  # ─────────────────────────────────────────────
  # JOB 2: Frontend Build & Verification
  # ─────────────────────────────────────────────
  frontend-ci:
    name: Frontend CI (Vanilla HTML/CSS/JS)
    runs-on: ubuntu-latest

    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: HTML Validation (htmlhint)
        run: |
          npm install -g htmlhint
          htmlhint services/rhynia_saas/frontend/index.html

      - name: CSS Validation (stylelint)
        run: |
          npm install -g stylelint stylelint-config-standard
          stylelint "services/rhynia_saas/frontend/style.css"

      - name: JS Syntax Check (eslint)
        run: |
          npm install -g eslint
          eslint services/rhynia_saas/frontend/app.js services/rhynia_saas/frontend/config.js

      - name: Banned Words Audit
        run: |
          echo "Scanning for banned words..."
          BANNED_WORDS=("ChatGPT" "OpenAI" "Gemini" "Qwen" "bot" "assistant" "Manish Chaturvedi")
          for word in "${BANNED_WORDS[@]}"; do
            count=$(grep -r "$word" services/rhynia_saas/ --include="*.html" --include="*.js" --include="*.css" --include="*.py" | wc -l)
            if [ "$count" -gt "0" ]; then
              echo "❌ BANNED WORD FOUND: '$word'"
              grep -r "$word" services/rhynia_saas/ --include="*.html" --include="*.js" --include="*.css" --include="*.py"
              exit 1
            fi
          done
          echo "✅ No banned words found."

  # ─────────────────────────────────────────────
  # JOB 3: Security & Secret Leak Scan
  # ─────────────────────────────────────────────
  security-scan:
    name: Security & Secret Leak Scan
    runs-on: ubuntu-latest

    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Secret Leak Detection (TruffleHog / GitLeaks)
        uses: gitleaks/gitleaks-action@v2
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

      - name: Python Dependency Vulnerability Scan (Safety)
        run: |
          pip install safety
          safety check -r services/rhynia_saas/backend/requirements.txt
```

---

## 2️⃣ BUILD VERIFICATION (सब सही बना?)

### Backend Build Checklist:
```
✅ Python 3.11 environment setup
✅ pip install requirements.txt — सभी 10 packages install हुए
✅ कोई import error नहीं (main, auth, database, config, llm_engine)
✅ FastAPI app initialize होती है बिना crash के
```

### Frontend Build Checklist:
```
✅ index.html — valid semantic HTML5
✅ style.css — valid CSS3 (no broken properties)
✅ app.js — no syntax errors (ESLint pass)
✅ config.js — API_BASE defined
```

---

## 3️⃣ DEPENDENCIES & PACKAGE AUDIT

### Backend (Python):
```bash
# Requirements audit — सभी 10 packages verify होंगे:
fastapi>=0.111.0          ✅ / ❌
uvicorn[standard]>=0.29.0 ✅ / ❌
sqlalchemy>=2.0.0         ✅ / ❌
alembic>=1.13.0           ✅ / ❌
bcrypt>=4.0.0             ✅ / ❌
pyjwt>=2.8.0              ✅ / ❌
httpx>=0.27.0             ✅ / ❌
pydantic>=2.0.0           ✅ / ❌
python-multipart>=0.0.9   ✅ / ❌
python-dotenv>=1.0.0      ✅ / ❌
```

### Security Vulnerability Check:
```bash
# Safety scan output example:
+===========================================================================+
|                                                                           |
|                          /$$$$$$            /$$                           |
|                         /$$__  $$          | $$                           |
|                        | $$  \__/  /$$$$$$ | $$  /$$$$$$  /$$  /$$$$$$   |
|   No known security    |  $$$$$$  /$$__  $$| $$ /$$__  $$| $$ /$$__  $$  |
|   vulnerabilities      | $$  \ $$| $$  \ $$| $$| $$  \ $$| $$| $$  \__/  |
|   found! ✅            |  $$$$$$/| $$$$$$$/| $$| $$$$$$$/| $$| $$        |
|                         \______/ | $$____/ |__/|_______/ |__/|__/        |
+===========================================================================+
```

---

## 4️⃣ AUTOMATED TESTS (CI में चलने वाले Tests)

### 4.1 Backend — Pytest Test Suite (`backend/tests/`)

#### `test_auth.py` — Authentication Tests:
```python
def test_register_success():
    """नया user register हो सके"""
    # POST /api/v1/auth/register {email, password, name}
    # Expected: 201, {token, user}

def test_register_duplicate_email():
    """Duplicate email 409 दे"""
    # Expected: 409 Conflict

def test_login_success():
    """Valid credentials से login हो सके"""
    # Expected: 200, {token, user}

def test_login_wrong_password():
    """गलत password 401 दे"""
    # Expected: 401 Unauthorized

def test_phone_otp_flow():
    """OTP send → verify → JWT मिले"""
    # Expected: 200 on verify, valid JWT

def test_otp_expired():
    """Expired OTP reject हो"""
    # Expected: 401

def test_get_me_with_valid_token():
    """Valid JWT से /me endpoint काम करे"""
    # Expected: 200, {user}

def test_get_me_without_token():
    """बिना token /me endpoint 401 दे"""
    # Expected: 401
```

#### `test_chat.py` — Chat Tests:
```python
def test_chat_success():
    """Message send होकर reply आए"""
    # POST /api/v1/chat {message}
    # Expected: 200, {reply, session_public_id, used_today}

def test_chat_daily_limit():
    """30 messages के बाद 429 मिले"""
    # Expected: 429 Too Many Requests

def test_chat_without_auth():
    """बिना JWT /chat 401 दे"""
    # Expected: 401
```

#### `test_storage.py` — File Storage Tests:
```python
def test_file_upload_success():
    """Valid file upload हो"""
    # POST /api/v1/files/upload (multipart)
    # Expected: 200, {file_id, file_name}

def test_file_upload_quota_exceeded():
    """500 MB से बड़ी file 413 दे"""
    # Expected: 413 Request Entity Too Large

def test_storage_accounting():
    """Upload के बाद storage_used_bytes बढ़े"""
    # Expected: user.storage_used_bytes > 0
```

### 4.2 Frontend — Basic Sanity Tests:
```bash
# HTMLHint output example:
services/rhynia_saas/frontend/index.html: 0 warnings, 0 errors ✅

# ESLint output example:
services/rhynia_saas/frontend/app.js
  0 problems (0 errors, 0 warnings) ✅
```

---

## 5️⃣ SECURITY & SECRET LEAK CHECK

### Banned Words Scan (Rhynia-specific — MANDATORY):
```bash
# CI में यह scan हर बार चलेगा — ZERO TOLERANCE
Scanning for banned words in codebase...

Checking: "ChatGPT"     → 0 occurrences ✅
Checking: "OpenAI"      → 0 occurrences ✅
Checking: "Gemini"      → 0 occurrences ✅
Checking: "Qwen"        → 0 occurrences ✅
Checking: "bot"         → 0 occurrences ✅
Checking: "assistant"   → 0 occurrences ✅

✅ AUDIT PASSED — Brand identity 100% secure.
```

### Secret Leak Detection (GitLeaks):
```bash
# GitLeaks scan — कोई accidental secret commit नहीं
Checking for:
  - API Keys (HF_TOKEN, GROQ_KEY)       → Not found in code ✅
  - Database connection strings           → Not found in code ✅
  - JWT secret keys                      → Not found in code ✅
  - Google OAuth credentials             → Not found in code ✅

✅ No secrets leaked in codebase.
```

---

## 6️⃣ RESULTS: PASS ✅ या FAIL ❌

### PASS — Green Build ✅:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  RHYNIA SAAS — CI PIPELINE RESULTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  JOB 1: Backend CI         ✅ PASSED (2m 14s)
  JOB 2: Frontend CI        ✅ PASSED (0m 45s)
  JOB 3: Security Scan      ✅ PASSED (1m 02s)

  All Tests:   12/12 passed ✅
  Banned Words: 0 found     ✅
  Secrets:      0 leaked    ✅
  Lint Errors:  0           ✅

  ✅ BUILD GREEN — Ready for Step 11 (Testing)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### FAIL — Red Build ❌:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  RHYNIA SAAS — CI PIPELINE RESULTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  JOB 1: Backend CI         ❌ FAILED
    └── test_chat.py::test_daily_limit FAILED
         Expected 429, got 200
         → FIX: Daily count query check karo

  JOB 3: Security Scan      ❌ FAILED
    └── BANNED WORD FOUND: "assistant" in app.js:Line 67
         → FIX: "Rhynia is thinking…" se replace karo

  ❌ BUILD RED — Fix required before Step 11
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Fail होने पर:**
1. Developer को GitHub पर तुरंत **email alert** मिलती है।
2. Sprint Board में Task **वापस `[/] In Progress`** में जाता है।
3. Developer AGY के साथ **तुरंत bug fix** करता है।
4. Fix commit → CI Pipeline **फिर से trigger** होती है।

---

## 7️⃣ VERIFICATION TOOLS (AGY Environment में)

### Tool 1: `lint_applet` — Fast Syntax & Lint Check
```bash
# Backend lint
flake8 services/rhynia_saas/backend/ --max-line-length=100 --statistics

# Frontend lint
eslint services/rhynia_saas/frontend/app.js --format=stylish
htmlhint services/rhynia_saas/frontend/index.html
```

### Tool 2: `compile_applet` — Full Build Verification
```bash
# Backend compile check
python -c "
import sys
sys.path.insert(0, 'services/rhynia_saas/backend')
import main
import auth
import database
import config
import llm_engine
print('✅ All backend modules compiled successfully')
"

# Banned Words Full Scan
grep -r "ChatGPT\|OpenAI\|Gemini\|Qwen\|bot\|assistant" \
  services/rhynia_saas/ \
  --include="*.py" --include="*.html" --include="*.js" --include="*.css"
echo "Exit code: $? (0=clean ✅, 1=found ❌)"
```

---

## 🔥 Step 10 का Final Output

```
CI Pipeline Complete:
✅ Backend — Compiled, Linted, Tests Passed
✅ Frontend — HTML/CSS/JS Validated
✅ Dependencies — No vulnerabilities
✅ Secrets — Zero leaked
✅ Banned Words — Zero found
✅ All 12+ automated tests passed

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
→ BUILD GREEN ✅
→ NEXT: Step 11 (Comprehensive Testing)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

> **CI BUILD WORKFLOW LOCKED 🔒**  
> हर `main` merge और हर Pull Request पर यह pipeline 100% automated चलेगी।
