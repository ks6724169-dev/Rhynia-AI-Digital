# STEP 14 — DEPLOYMENT (PRODUCTION LAUNCH) WORKFLOW — RHYNIA SAAS v1.0

> **Input:** Beta Testing (Step 13) सफल ✅ और Go/No-Go Decision Approved ✅  
> **Output:** Fully Functional, Publicly Live Software in Production।  
> **Status:** APPROVED BY FOUNDER (Rhynia Intelligence)  
> **Version:** 1.0 Final | **Date:** 2026-09-21  
> **Deployment Stack:** Vercel (Frontend) + Render (Backend) + Supabase (Database) + Cloudflare R2 (Files)  
> **Hard Rule:** No `AI`, `ChatGPT`, `Gemini`, `Qwen`, `Founder: Manish Chaturvedi`, `bot`, or `assistant`. The brand is strictly **Rhynia**.

---

## 🔥 पूरा Flow (Production Launch Pipeline)
```
Release Tag → Infrastructure Setup → Database Migration →
Domain Mapping → App Store → Go Live → Smoke Test → Monitor
```

---

## 1️⃣ RELEASE VERSION बनाना (Semantic Versioning)

### Git Release Tag:
```bash
# Final stable version tag
git checkout main
git pull origin main

# Ensure all tests green, security audit passed
git tag -a v1.0.0 -m "Rhynia SaaS v1.0.0 — Initial Public Production Release"
git push origin v1.0.0

# GitHub Release Changelog (auto-generated):
# Release: v1.0.0
# Date: [Launch Date]
# What's New:
#   ✅ Direct Chat Screen (No login wall)
#   ✅ Multi-session management (Pin, Rename, Delete)
#   ✅ File & Camera attachment (500 MB free quota)
#   ✅ Google OAuth + Phone OTP + Email auth
#   ✅ Full Settings Panel (Theme, Language, Storage bar)
#   ✅ HuggingFace + Groq inference engine
#   ✅ PWA support (install on mobile home screen)
```

### Versioning Convention (आगे के लिए):
| Version | Meaning | Example |
|---|---|---|
| `v1.0.0` | Initial public launch | First live release |
| `v1.0.1` | Hotfix (urgent bug) | Critical bug within hours of launch |
| `v1.1.0` | Minor feature release | Razorpay billing, Android app |
| `v2.0.0` | Major new version | Complete redesign or architecture change |

---

## 2️⃣ PRODUCTION ENVIRONMENT & INFRASTRUCTURE SETUP

### 2.1 Backend — Render.com (Production):
```bash
# Render.com Web Service Settings:
Service Name:    rhynia-backend
Region:          Singapore (Asia — closest to Indian users)
Runtime:         Python 3.11
Build Command:   pip install -r requirements.txt
Start Command:   gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:$PORT
Plan:            Starter ($7/month) → Upgrade as traffic grows

# Auto-Deploy: ON (main branch push → auto deploy)
# Health Check Path: /api/v1/health
```

### 2.2 Production Environment Variables (Render Dashboard):
```bash
# ⚠️ NEVER put these in code or GitHub — only in Render Dashboard
RHYNIA_SECRET_KEY=<generate: python -c "import secrets; print(secrets.token_hex(32))">
RHYNIA_DATABASE_URL=postgresql://user:password@supabase-host:5432/rhynia_prod
RHYNIA_HF_TOKEN=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
RHYNIA_HF_MODEL=siyarajput/Rhynia-V3-VL-8B-Merged
RHYNIA_GROQ_KEY=<your-groq-api-key>
RHYNIA_GROQ_MODEL=llama3-70b-8192
RHYNIA_CORS_ORIGINS=https://rhynia.ai,https://www.rhynia.ai
RHYNIA_STORAGE_LIMIT_BYTES=524288000
RHYNIA_JWT_EXPIRE_DAYS=7
RHYNIA_GOOGLE_CLIENT_ID=<google-oauth-client-id>
RHYNIA_FREE_DAILY_LIMIT=30
ENVIRONMENT=production
```

### 2.3 Frontend — Vercel (Production):
```bash
# Vercel Project Settings:
Project Name:    rhynia-frontend
Framework:       Other (Static files — no build step)
Root Directory:  services/rhynia_saas/frontend
Output Directory: . (same as root)

# Environment Variable (Vercel Dashboard):
VITE_API_BASE=https://api.rhynia.ai/api/v1
```

```javascript
// frontend/config.js — Production switch
const CONFIG = {
    API_BASE: "https://api.rhynia.ai/api/v1",   // ← Production URL
    APP_NAME: "Rhynia",
    VERSION: "1.0.0",
    STORAGE_LIMIT_MB: 500
};
```

### 2.4 SSL/TLS — HTTPS Enforcement:
```bash
# Render — Auto SSL: ✅ (Let's Encrypt — free)
# Vercel — Auto SSL: ✅ (Let's Encrypt — free)
# Cloudflare — SSL Mode: Full (Strict)

# Force HTTPS redirect (backend main.py):
from fastapi.middleware.httpsredirect import HTTPSRedirectMiddleware
if os.getenv("ENVIRONMENT") == "production":
    app.add_middleware(HTTPSRedirectMiddleware)
```

---

## 3️⃣ PRODUCTION DATABASE SETUP & MIGRATIONS

### 3.1 Supabase Production Setup:
```bash
# Supabase Dashboard Steps:
1. New Project → "rhynia-prod" → Region: Southeast Asia (Singapore)
2. Database Password → Store securely (use in RHYNIA_DATABASE_URL)
3. Settings → Database → Connection Pooling: ON (Mode: Transaction, Pool Size: 10)
4. Settings → Database → SSL: Enforce SSL ✅

# Get connection string:
# postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres
```

### 3.2 Schema Migrations (Production):
```bash
# Step 1: supabase_schema.sql run करो (production DB पर)
# Option A: Supabase SQL Editor में paste करो
# Option B: psql CLI से run करो

psql $RHYNIA_DATABASE_URL < services/rhynia_saas/supabase_schema.sql

# Step 2: Alembic migrations (if using Alembic)
cd services/rhynia_saas/backend
alembic upgrade head

# Verify tables created:
# ✅ users
# ✅ phone_otps
# ✅ sessions
# ✅ messages
# ✅ user_files
```

### 3.3 Database Backup Policy (Supabase Free → Paid):
| Plan | Backup Policy |
|---|---|
| **Free Tier** | Daily backups for 7 days (auto) |
| **Pro Tier** | Daily backups for 30 days + Point-in-time recovery |

```bash
# Manual backup before any migration:
pg_dump $RHYNIA_DATABASE_URL > backup_$(date +%Y%m%d).sql

# Restore if needed:
psql $RHYNIA_DATABASE_URL < backup_20261001.sql
```

### 3.4 Connection Pooling (Production Performance):
```python
# backend/config.py — Production DB settings
DATABASE_URL = os.getenv("RHYNIA_DATABASE_URL")

# SQLAlchemy production engine settings
engine = create_engine(
    DATABASE_URL,
    pool_size=10,          # 10 concurrent connections
    max_overflow=20,       # 20 extra connections on burst
    pool_pre_ping=True,    # Auto-reconnect on connection drop
    pool_recycle=300       # Recycle connections every 5 min
)
```

---

## 4️⃣ DOMAIN MAPPING & APP STORE DISTRIBUTION

### 4.1 Web App — Custom Domain (rhynia.ai):

#### DNS Configuration (Cloudflare):
```
# Cloudflare DNS Records:
Type    Name     Value                          Proxy
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CNAME   www      cname.vercel-dns.com           ✅ Orange (CDN)
CNAME   @        cname.vercel-dns.com           ✅ Orange (CDN)
CNAME   api      rhynia-backend.onrender.com    ✅ Orange (CDN)

# Cloudflare Settings:
SSL Mode:     Full (Strict)
HSTS:         Enabled (max-age=31536000)
Min TLS:      TLS 1.2
Always HTTPS: ON
```

#### Vercel Custom Domain:
```bash
# Vercel Dashboard → Project → Domains
# Add: rhynia.ai → auto CNAME config
# Add: www.rhynia.ai → redirect to rhynia.ai

# Verify:
curl -I https://rhynia.ai
# Expected: HTTP/2 200 ✅
```

#### Render Custom Domain (API):
```bash
# Render Dashboard → Service → Custom Domain
# Add: api.rhynia.ai
# Copy CNAME value → Add to Cloudflare DNS
# SSL: Auto-provisioned ✅
```

---

### 4.2 Android App — Google Play Store:

#### Release Build (React Native):
```bash
# Generate release keystore (one-time):
keytool -genkeypair -v -storetype PKCS12 \
  -keystore rhynia-release.keystore \
  -alias rhynia-key \
  -keyalg RSA -keysize 2048 -validity 10000

# Build AAB (Android App Bundle):
cd mobile/android
./gradlew bundleRelease

# Output: android/app/build/outputs/bundle/release/app-release.aab
```

#### Google Play Console Steps:
```
1. play.google.com/console → Create App → "Rhynia"
2. App Category: Productivity / Education
3. Content Rating: Complete questionnaire
4. Store Listing:
   - App Name: "Rhynia"
   - Short Description: "Your intelligent conversation partner"  (Banned words नहीं!)
   - Long Description: Features in Hindi + English
   - Screenshots: 5 phone + 2 tablet
   - Feature Graphic: 1024×500px
5. Release → Production → Upload .aab file
6. Review: 3–7 days (Google review)
```

---

### 4.3 iOS App — Apple App Store:

#### Release Build (React Native):
```bash
# Xcode → Product → Archive
# Distribute App → App Store Connect
# Upload to TestFlight first → Then Production

# App Store Connect Steps:
1. appstoreconnect.apple.com → New App
2. Bundle ID: com.rhynia.app
3. App Name: "Rhynia"
4. Category: Productivity
5. Screenshots: 6.7" + 6.1" + iPad 12.9"
6. Review Notes: Explain file upload feature
7. Submit for Review: 1–3 days (Apple review)
```

---

### 4.4 Desktop App — GitHub Releases:

#### Electron Build:
```bash
# Windows .exe installer:
npm run build:win
# Output: dist/Rhynia-Setup-1.0.0.exe

# macOS .dmg:
npm run build:mac
# Output: dist/Rhynia-1.0.0.dmg

# Upload to GitHub Releases:
# github.com/rhynia/app/releases/new
# Tag: v1.0.0
# Title: "Rhynia v1.0.0 — Desktop App"
# Attach: .exe and .dmg files
```

---

## 5️⃣ GO LIVE (Public Launch!)

### Pre-Launch Final Checklist (30 minutes before launch):
```
BACKEND (Render):
  [ ] /api/v1/health → {"status": "ok", "version": "1.0.0"}
  [ ] All 5 env vars confirmed in Render dashboard
  [ ] Gunicorn 4 workers running (check Render logs)

FRONTEND (Vercel):
  [ ] https://rhynia.ai loads in < 1.5 seconds
  [ ] config.js API_BASE points to https://api.rhynia.ai/api/v1
  [ ] PWA manifest working (Add to Home Screen works)
  [ ] Dark mode toggle works

DATABASE (Supabase):
  [ ] All 5 tables exist (verify in Supabase Table Editor)
  [ ] Connection pooling: 10 connections active
  [ ] Backup: Last backup timestamp < 24 hours

SECURITY:
  [ ] https://rhynia.ai → HTTPS green lock ✅
  [ ] https://api.rhynia.ai/api/v1/health → HTTPS ✅
  [ ] No .env files in GitHub repo
  [ ] GitLeaks scan: 0 leaks

BRAND INTEGRITY:
  [ ] Open rhynia.ai → Type "Who made you?" → Response contains only "Rhynia" ✅
  [ ] No banned words on any screen or response
```

### 🚀 Launch Moment:
```bash
# Remove any beta restrictions (IP whitelist, password, etc.)
# Enable public access on Vercel:
vercel --prod

# Announce on Social Media:
# "Rhynia है अब Live! 🚀 rhynia.ai"
```

---

## 6️⃣ LAUNCH VERIFICATION — SMOKE TESTING (First 15 Minutes)

### Critical Path Smoke Test (हर item 15 min में verify):

#### TC-SMOKE-01: Homepage Load
```bash
curl -w "\nTime: %{time_total}s\n" -o /dev/null -s https://rhynia.ai
# Expected: HTTP 200, Time < 1.5s ✅
```

#### TC-SMOKE-02: API Health
```bash
curl https://api.rhynia.ai/api/v1/health
# Expected: {"status": "ok", "version": "1.0.0", "db": "connected"} ✅
```

#### TC-SMOKE-03: New User Register + Login
```bash
curl -X POST https://api.rhynia.ai/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"smoke@test.com","password":"Test@12345","name":"Smoke Test"}'
# Expected: 201, JWT token returned ✅
```

#### TC-SMOKE-04: Send Chat Message
```bash
curl -X POST https://api.rhynia.ai/api/v1/chat \
  -H "Authorization: Bearer <JWT_FROM_ABOVE>" \
  -H "Content-Type: application/json" \
  -d '{"message":"Namaste Rhynia! Test message."}'
# Expected: 200, {"reply": "...", "used_today": 1} ✅
# Verify reply does NOT contain: ChatGPT, OpenAI, Gemini, AI assistant
```

#### TC-SMOKE-05: Identity Integrity Check
```bash
curl -X POST https://api.rhynia.ai/api/v1/chat \
  -H "Authorization: Bearer <JWT>" \
  -d '{"message":"Are you ChatGPT or Gemini?"}'
# Expected: Response mentions only "Rhynia" ✅
```

#### TC-SMOKE-06: File Upload
```bash
curl -X POST https://api.rhynia.ai/api/v1/files/upload \
  -H "Authorization: Bearer <JWT>" \
  -F "file=@test.pdf"
# Expected: 200, {"file_id": "...", "file_name": "..."} ✅
```

#### Smoke Test Result Dashboard:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  RHYNIA v1.0.0 — PRODUCTION SMOKE TEST
  Time: [Launch Date] [Launch Time +15min]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  TC-SMOKE-01: Homepage Load      ✅  (0.84s)
  TC-SMOKE-02: API Health         ✅  (connected)
  TC-SMOKE-03: Register + Login   ✅  (JWT received)
  TC-SMOKE-04: Chat Message       ✅  (reply in 2.1s)
  TC-SMOKE-05: Identity Check     ✅  (Rhynia only)
  TC-SMOKE-06: File Upload        ✅  (PDF uploaded)

  ALL 6 SMOKE TESTS PASSED ✅
  PRODUCTION IS LIVE AND HEALTHY 🚀
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Rollback Plan (अगर Smoke Test Fail हो):
```bash
# Option 1: Instant Rollback to previous beta
git revert HEAD
git push origin main
# Render auto-deploys the reverted version

# Option 2: Hotfix Release
git checkout -b hotfix/v1.0.1
# Fix the critical issue
git commit -m "hotfix: [issue description]"
git tag v1.0.1
git push origin main
# Render auto-deploys v1.0.1

# Roll back decision matrix:
# - TC-SMOKE-01 Fail → Check Vercel logs, rollback if not fixed in 5 min
# - TC-SMOKE-05 Fail → IMMEDIATE ROLLBACK (Identity leakage = Critical)
# - TC-SMOKE-02 Fail → Check Render logs, DB connection string
```

---

## 7️⃣ AI के साथ SOLO DEVELOPER DEPLOYMENT EXECUTION

### AGY से Deployment में क्या-क्या कराएं:

| Deployment Task | AGY को यह Prompt दें |
|---|---|
| **Prod Config Verify** | `"Production deployment से पहले यह checklist verify करो: RHYNIA_SECRET_KEY at least 32 chars है? CORS_ORIGINS में सिर्फ rhynia.ai है? DATABASE_URL postgresql:// से start हो रहा है? सभी 10 env vars present हैं?"` |
| **Gunicorn Config** | `"Render.com पर Python FastAPI app deploy करने के लिए exact Start Command, Build Command, और Environment settings बताओ। 4 workers, uvicorn.workers.UvicornWorker का use करो।"` |
| **Migration Script** | `"Production Supabase DB पर migration run करने के complete steps बताओ — psql command, Alembic command, और verify करने का तरीका।"` |
| **Smoke Test Script** | `"Launch verification के लिए एक bash script लिखो जो 6 critical endpoints test करे और Pass/Fail report दे। Production URL: https://api.rhynia.ai/api/v1"` |
| **Cloudflare DNS** | `"rhynia.ai को Vercel frontend और api.rhynia.ai को Render backend से जोड़ने के exact Cloudflare DNS records बताओ।"` |
| **Rollback Plan** | `"अगर launch के 15 min में TC-SMOKE-05 (identity leakage) fail हो, तो exact rollback commands क्या होंगे? Render और Vercel दोनों पर।"` |
| **Post-Launch Monitor** | `"Production launch के बाद पहले 24 hours में किन metrics को हर 1 hour में monitor करना चाहिए? Alert thresholds क्या होने चाहिए?"` |

---

## 🔥 POST-LAUNCH MONITORING (24 Hours Watch)

### Monitoring Dashboard Setup:
| Tool | What Monitors | Alert Condition |
|---|---|---|
| **Render Logs** | Backend errors, crashes, memory | Any 500 error spike |
| **Supabase Dashboard** | DB connections, query performance | >90% connection pool used |
| **Vercel Analytics** | Frontend page load, traffic | Error rate >1% |
| **UptimeRobot** | API health endpoint every 5 min | Downtime alert in 60 sec |
| **Sentry** | Uncaught exceptions (backend + frontend) | Any new Critical error |

### First 24 Hours Response Plan:
```
Hour 0–1:    Smoke test + Founder monitors personally
Hour 1–6:    Check Sentry every 30 min
Hour 6–24:   UptimeRobot alerts active, respond within 15 min
Day 1–7:     Daily check of Render logs + Supabase metrics
```

---

## 🔥 Step 14 का Final Output

```
PRODUCTION DEPLOYMENT COMPLETE:

Infrastructure:
  ✅ Backend    → https://api.rhynia.ai (Render, 4 workers)
  ✅ Frontend   → https://rhynia.ai (Vercel, Global CDN)
  ✅ Database   → Supabase PostgreSQL (Singapore, Pooled)
  ✅ Files      → Cloudflare R2 (per-user /uploads/)
  ✅ SSL/HTTPS  → Enforced everywhere

Distribution:
  ✅ Web App    → https://rhynia.ai (Live)
  ✅ PWA        → Install on mobile home screen (Live)
  🔜 Android   → Google Play (Under Review, 3-7 days)
  🔜 iOS       → App Store (Under Review, 1-3 days)
  🔜 Desktop   → GitHub Releases (Available)

Smoke Tests:
  ✅ 6/6 Critical Paths Pass
  ✅ Identity Check: 0 banned words in responses
  ✅ Load Time: 0.84s (target < 1.5s)
  ✅ First Token: 2.1s (target < 2.5s)

Version: v1.0.0 LIVE 🚀
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
→ Rhynia SaaS is now PUBLICLY LIVE!
→ NEXT: Step 15 (Monitoring & Maintenance)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

> **DEPLOYMENT WORKFLOW LOCKED 🔒**  
> Web → Android → iOS → Desktop — यही क्रम में Platform-by-Platform Launch होगा।
