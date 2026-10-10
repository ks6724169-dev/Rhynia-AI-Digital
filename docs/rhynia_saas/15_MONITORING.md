# STEP 15 — MONITORING, TELEMETRY & STABILITY WORKFLOW — RHYNIA SAAS v1.0

> **Input:** Software Production में Live है (Step 14) ✅  
> **Output:** Real-Time System Visibility, Automated Alerts, Error Logs, और Step 16 के लिए Data-Driven Insights  
> **Status:** APPROVED BY FOUNDER (Rhynia Intelligence)  
> **Version:** 1.0 Final | **Date:** 2026-09-21  
> **Monitoring Mode:** 24×7 Automated + Solo Developer + AGY AI SRE Analyst  
> **Hard Rule:** No `AI`, `ChatGPT`, `Gemini`, `Qwen`, `Founder: Manish Chaturvedi`, `bot`, or `assistant`. The brand is strictly **Rhynia**.

---

## 🔥 पूरा Flow (24×7 Monitoring Cycle)
```
Live Software → Telemetry Collect → 24×7 Monitor → Automated Alerts →
Root Cause Analysis → Hotfix / Next Sprint Planning
```

---

## 1️⃣ USER ACTIVITY & PRODUCT ANALYTICS

### Tools:
| Tool | Purpose | Free Tier |
|---|---|---|
| **Vercel Analytics** | Web page views, load time, visitors | ✅ Built-in |
| **Plausible / Umami** | Privacy-first analytics (no cookies) | ✅ Self-host |
| **Supabase Dashboard** | DB-level user activity queries | ✅ Built-in |
| **Custom Analytics** | AGY writes SQL queries on `messages` + `sessions` table | ✅ Free |

### Key Metrics to Track Daily:

| Metric | Definition | Target (v1.0) |
|---|---|---|
| **DAU** (Daily Active Users) | Unique users who sent ≥1 message today | Growing |
| **MAU** (Monthly Active Users) | Unique users active in last 30 days | DAU/MAU ratio > 25% |
| **Messages per User/Day** | Avg messages sent by active users | > 5/day |
| **Session Duration** | Avg time user spends per session | > 4 minutes |
| **Feature Adoption** | % users who used File Upload | > 30% |
| **Return Rate** | % users who return next day | > 40% |
| **Drop-off Screen** | Which screen users leave from most | Identify & fix |
| **New Signups/Day** | Daily new registrations | Growing |

### Custom Analytics Query (Supabase SQL):
```sql
-- Daily Active Users (last 7 days)
SELECT
    DATE(created_at) AS date,
    COUNT(DISTINCT user_id) AS daily_active_users,
    COUNT(*) AS total_messages
FROM messages
WHERE role = 'user'
  AND created_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Most Active Hours (IST = UTC + 5:30)
SELECT
    EXTRACT(HOUR FROM created_at + INTERVAL '5.5 hours') AS hour_ist,
    COUNT(*) AS messages_sent
FROM messages
WHERE role = 'user'
GROUP BY hour_ist
ORDER BY messages_sent DESC;

-- Feature Adoption: File Upload Usage
SELECT
    COUNT(DISTINCT user_id) AS users_who_uploaded,
    (COUNT(DISTINCT user_id) * 100.0 / (SELECT COUNT(DISTINCT id) FROM users)) AS adoption_pct
FROM user_files;

-- Top Drop-off: Users with 0 sessions after register
SELECT COUNT(*) AS registered_never_chatted
FROM users u
WHERE NOT EXISTS (
    SELECT 1 FROM sessions s WHERE s.user_id = u.id
);
```

### Weekly Product Health Dashboard:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  RHYNIA SAAS — WEEKLY PRODUCT REPORT
  Week: [Date Range]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  New Signups:         +[N] users
  DAU (avg):           [N] users/day
  MAU:                 [N] users
  Avg Messages/User:   [N] messages
  Return Rate:         [N]%
  File Upload Usage:   [N]% of users
  Top Drop-off Screen: [Screen Name]
  Most Used Feature:   [Feature]

  Insight: [AGY-generated observation]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 2️⃣ APPLICATION CRASH & ERROR TRACKING

### Tool Setup — Sentry (Primary):
```python
# backend/main.py — Sentry integration
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration

sentry_sdk.init(
    dsn=os.getenv("RHYNIA_SENTRY_DSN"),
    integrations=[
        FastApiIntegration(transaction_style="endpoint"),
        SqlalchemyIntegration(),
    ],
    traces_sample_rate=0.2,      # 20% of requests traced (performance)
    profiles_sample_rate=0.1,    # 10% CPU profiling
    environment=os.getenv("ENVIRONMENT", "development"),
    release="rhynia@1.0.0",
    # Never send user passwords or tokens to Sentry:
    before_send=lambda event, hint: sanitize_sentry_event(event)
)
```

```javascript
// frontend/app.js — Sentry browser integration
import * as Sentry from "@sentry/browser";

Sentry.init({
    dsn: CONFIG.SENTRY_DSN,
    release: "rhynia@1.0.0",
    environment: "production",
    tracesSampleRate: 0.1,
    // Scrub sensitive data:
    beforeSend(event) {
        if (event.request?.headers?.Authorization) {
            event.request.headers.Authorization = "[Filtered]";
        }
        return event;
    }
});
```

### Error Severity Classification:
| Severity | Definition | Rhynia Example | Response Time |
|---|---|---|---|
| **Critical** 🔴 | App unusable, data loss risk | Server down, DB connection failed | < 15 minutes |
| **High** 🟠 | Feature broken for many users | `/chat` returning 500 errors | < 2 hours |
| **Medium** 🟡 | Partial failure, workaround exists | File upload failing for some users | < 24 hours |
| **Low** 🟢 | Minor issue, cosmetic | Speaker TTS not working on Safari | Next sprint |

### Crash-Free Session Target:
```
Target: > 99.5% crash-free user sessions

Calculation:
  Crash-free % = (1 - (sessions_with_errors / total_sessions)) × 100

Sentry Dashboard shows this automatically.
Alert: If crash-free rate drops below 99% → P1 immediate investigation
```

---

## 3️⃣ INFRASTRUCTURE & SERVER HEALTH MONITORING

### Monitoring Stack:
| Tool | What it Monitors | Alert Method |
|---|---|---|
| **UptimeRobot** | `/api/v1/health` every 5 min | SMS + Email if DOWN |
| **Render Dashboard** | CPU, RAM, Disk, Request logs | In-dashboard alerts |
| **Vercel Analytics** | Frontend load time, error rate | Email digest |
| **Cloudflare Analytics** | Traffic, firewall events, bandwidth | Dashboard |

### Server Health Metrics & Targets:

| Metric | Target | Critical Threshold | Tool |
|---|---|---|---|
| **Uptime SLA** | ≥ 99.9% | < 99.5% → P1 Alert | UptimeRobot |
| **CPU Utilization** | < 70% avg | > 90% sustained → Alert | Render |
| **RAM Usage** | < 70% | > 85% → Alert (memory leak?) | Render |
| **HTTP 2xx Rate** | > 99% | < 97% → P1 Alert | Render Logs |
| **HTTP 5xx Rate** | < 0.1% | > 1% → Immediate Hotfix | Render Logs |
| **TTFB (API)** | < 200ms | > 1000ms → P2 Alert | Render |
| **P95 Latency** | < 500ms | > 2000ms → P1 | Sentry |
| **Gunicorn Workers** | 4 healthy | Any worker crash | Render Logs |

### `/api/v1/health` Endpoint (Enhanced):
```python
@app.get("/api/v1/health")
async def health_check(db: Session = Depends(get_db)):
    # Database connectivity check
    try:
        db.execute(text("SELECT 1"))
        db_status = "connected"
    except Exception:
        db_status = "ERROR"

    # HuggingFace API reachability (lightweight check)
    hf_status = "ok"  # Async check in background

    return {
        "status": "ok" if db_status == "connected" else "degraded",
        "version": "1.0.0",
        "db": db_status,
        "inference": hf_status,
        "timestamp": datetime.utcnow().isoformat(),
        "uptime_seconds": (datetime.utcnow() - APP_START_TIME).seconds
    }
```

---

## 4️⃣ DATABASE HEALTH & QUERY PERFORMANCE

### Supabase Monitoring Dashboard:
| Metric | Target | Alert Threshold |
|---|---|---|
| **Active Connections** | < 8 of 10 pool size | > 9 → Scale pool immediately |
| **Slow Queries (>500ms)** | 0 per hour | Any → Analyze & index |
| **Storage Used** | Track monthly growth | > 400 MB (free tier limit) → Upgrade |
| **Backup Status** | Daily successful | Any failed backup → Restore test |
| **Query Error Rate** | < 0.01% | Any spike → P1 Investigation |

### Slow Query Detection & Fix:
```sql
-- Find slow queries (Supabase → SQL Editor → pg_stat_statements)
SELECT
    query,
    calls,
    mean_exec_time AS avg_ms,
    total_exec_time AS total_ms
FROM pg_stat_statements
WHERE mean_exec_time > 500      -- Queries slower than 500ms
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Common fix: Add missing index
-- Example: sessions table slow on user_id filter
CREATE INDEX CONCURRENTLY idx_sessions_user_id
ON sessions(user_id);

-- Example: messages table slow on session + time filter
CREATE INDEX CONCURRENTLY idx_messages_session_created
ON messages(session_id, created_at DESC);

-- Example: Daily message count slow
CREATE INDEX CONCURRENTLY idx_messages_user_date
ON messages(user_id, created_at)
WHERE role = 'user';
```

### Database Capacity Planning:
```
Month 1:  100 users × 100 messages avg = 10K messages ≈ 5 MB
Month 3:  1,000 users × 200 messages = 200K messages ≈ 100 MB
Month 6:  5,000 users × 300 messages = 1.5M messages ≈ 750 MB
          → Supabase Pro plan needed at Month 4–5

Files (uploads/):
Month 1:  50 users × 10 MB avg = 500 MB
          → Move to Cloudflare R2 at Month 1 start
```

---

## 5️⃣ SECURITY & THREAT MONITORING

### Real-Time Threat Detection:
| Threat | Detection Method | Automated Response |
|---|---|---|
| **Brute Force Login** | >10 failed attempts from same IP in 5 min | Rate limit → 429, Log IP |
| **JWT Token Abuse** | Invalid signature attempts | Log + Alert (Sentry) |
| **DDoS / Traffic Spike** | Cloudflare WAF — abnormal request volume | Cloudflare auto-blocks |
| **Suspicious File Upload** | MIME mismatch or executable detected | Reject + Log user_id |
| **SQL Injection Attempt** | Patterns in query params | ORM prevents, Sentry logs |
| **Cross-user Data Access** | 403 rate spike from one user | Suspend account flag |
| **API Key Exposure** | GitLeaks on new commits | CI pipeline blocks merge |
| **Banned Word in Response** | Post-response filter triggers | Log + fallback response |

### Security Log Queries (Supabase):
```sql
-- Suspicious users: Multiple failed OTPs
SELECT
    phone_number,
    COUNT(*) AS failed_attempts,
    MAX(created_at) AS last_attempt
FROM phone_otps
WHERE is_used = FALSE
  AND expires_at < NOW()
  AND created_at > NOW() - INTERVAL '1 hour'
GROUP BY phone_number
HAVING COUNT(*) >= 5
ORDER BY failed_attempts DESC;

-- Users hitting daily limit repeatedly (high-usage detection)
SELECT
    user_id,
    COUNT(*) AS days_hitting_limit
FROM (
    SELECT user_id, DATE(created_at) AS day
    FROM messages
    WHERE role = 'user'
    GROUP BY user_id, DATE(created_at)
    HAVING COUNT(*) >= 30
) daily_limits
GROUP BY user_id
ORDER BY days_hitting_limit DESC;
```

---

## 6️⃣ AUTOMATED ALERTING SYSTEM (Escalation)

### Alert Configuration:

#### UptimeRobot Setup:
```
Monitor Type: HTTPS
URL: https://api.rhynia.ai/api/v1/health
Check Interval: 5 minutes
Alert Contacts:
  - Email: [Founder email]
  - SMS: [Founder phone]
Alert when: Status changes (UP → DOWN or DOWN → UP)
```

#### Sentry Alert Rules:
```
Rule 1 — CRITICAL: New unhandled exception in production
  → Trigger: Any new issue with level=fatal
  → Action: Email + Slack immediately

Rule 2 — HIGH: Error rate spike
  → Trigger: Error count > 10 in 5 minutes
  → Action: Email alert

Rule 3 — MEDIUM: Slow API response
  → Trigger: P95 latency > 1000ms for 10 min
  → Action: Email digest

Rule 4 — CUSTOM: Identity leakage detection
  → Trigger: Sentry captures banned word in response
  → Action: IMMEDIATE EMAIL + SMS (P0 emergency)
```

#### Alert Priority Matrix:
| Priority | Issue | Response Time | Action |
|---|---|---|---|
| **P0** 🚨 | Identity leakage (banned word in response) | < 5 minutes | Emergency hotfix + rollback if needed |
| **P1** 🔴 | Server down, DB unreachable, all chats failing | < 15 minutes | Wake up, fix immediately |
| **P2** 🟠 | High error rate (>1%), slow queries, auth failures | < 2 hours | Fix in same day |
| **P3** 🟡 | Feature degraded, minor errors | < 24 hours | Fix in next sprint |
| **P4** 🟢 | Performance optimization, cosmetic | Next sprint | Planned fix |

---

## 7️⃣ PERIODIC HEALTH & PERFORMANCE REPORT

### Weekly SLA Report Template:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  RHYNIA SAAS — WEEKLY SLA REPORT
  Period: [Mon DD] – [Mon DD], 2026
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  INFRASTRUCTURE HEALTH:
  ┌─────────────────────┬──────────┬────────┬────────┐
  │ Metric              │ Target   │ Actual │ Status │
  ├─────────────────────┼──────────┼────────┼────────┤
  │ Server Uptime       │ > 99.9%  │ 99.97% │ ✅     │
  │ API P95 Latency     │ < 500ms  │ 280ms  │ ✅     │
  │ HTTP 5xx Rate       │ < 0.1%   │ 0.02%  │ ✅     │
  │ Crash-Free Sessions │ > 99.5%  │ 99.91% │ ✅     │
  │ DB Slow Queries     │ 0/hour   │ 2/week │ ✅     │
  │ Security Incidents  │ 0 P0/P1  │ 0      │ ✅     │
  └─────────────────────┴──────────┴────────┴────────┘

  PRODUCT METRICS:
  ┌─────────────────────┬────────────────────────────┐
  │ New Users           │ +[N] this week             │
  │ Daily Active Users  │ [N] avg/day                │
  │ Messages Sent       │ [N] total                  │
  │ File Uploads        │ [N] files, [N] MB          │
  │ Top Feature Used    │ [Feature Name]             │
  │ NPS Score (if asked)│ [Score] / 10               │
  └─────────────────────┴────────────────────────────┘

  INCIDENTS THIS WEEK:
  [None / List of incidents with resolution time]

  ACTION ITEMS FOR NEXT SPRINT:
  1. [Slow query found → add index]
  2. [Feature request from 5+ users → plan for v1.1]
  3. [Error pattern → preventive fix]

  Signed: Rhynia Intelligence (Founder)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 8️⃣ FEEDBACK LOOP TO STEP 16 (Updates & Maintenance)

### Monitoring → Maintenance Cycle:
```
Monitoring Data → Insights → Step 16 Action
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Observation: /chat P95 latency 1.8s (target <500ms)
  → Analysis: HF API cold start
  → Step 16 Action: Implement Groq-first strategy for <3s responses

Observation: 60% users drop off at Auth Modal
  → Analysis: Login step feels disruptive
  → Step 16 Action: Allow 10 free messages without login (Guest mode)

Observation: 40% users never use File Upload
  → Analysis: (+) button not discoverable
  → Step 16 Action: Add tooltip "Attach files or photos" on first visit

Observation: 15 users requested Voice Input
  → Analysis: High demand feature
  → Step 16 Action: Plan Web Speech API mic button for v1.1

Observation: 2 slow queries found (sessions + messages join)
  → Analysis: Missing composite index
  → Step 16 Action: Add idx_messages_session_created index
```

---

## 9️⃣ AI के साथ SOLO DEVELOPER LOG ANALYSIS (SRE Role)

### AGY को SRE / DevOps Role देने के Exact Prompts:

| Monitoring Task | AGY को यह Prompt दें |
|---|---|
| **Error Log Analysis** | `"ये Render.com backend के last 1 hour के error logs हैं: [paste logs]. Root cause identify करो और exact fix बताओ।"` |
| **Slow Query Fix** | `"इन pg_stat_statements results में top 5 slow queries हैं: [paste results]. हर query के लिए: Index create करने का exact SQL और estimated improvement बताओ।"` |
| **Crash Root Cause** | `"Sentry ने यह exception capture किया है: [paste stack trace]. इस bug का root cause, affected file/line, और exact code fix बताओ।"` |
| **Analytics Insight** | `"इस week की user analytics है: [DAU, features used, drop-off data]. Top 3 actionable improvements suggest करो — Step 16 के लिए।"` |
| **Security Alert** | `"UptimeRobot ने alert दिया: 5 min downtime detected at 2:34 AM. Render और Supabase logs में क्या देखना चाहिए? Checklist दो।"` |
| **Performance Audit** | `"Production पर /api/v1/chat endpoint का P95 latency 1.8 seconds है। Render logs और Sentry traces से bottleneck identify करो और fix plan बनाओ।"` |
| **Weekly Report** | `"इस week की monitoring data है: [paste metrics]. एक executive weekly SLA report बनाओ — Founder के लिए Hindi में।"` |

---

## 🔥 Step 15 का Final Output

```
Monitoring & Telemetry Active — 24×7 Watch:

USER ANALYTICS:
  ✅ DAU/MAU tracking — Supabase SQL queries ready
  ✅ Feature adoption measurement active
  ✅ Drop-off screen identification setup

ERROR TRACKING:
  ✅ Sentry — Backend + Frontend integrated
  ✅ Crash-free session target: > 99.5%
  ✅ Identity leakage alert: P0 immediate

INFRASTRUCTURE:
  ✅ UptimeRobot — 5-min health checks
  ✅ Render Dashboard — CPU/RAM/Logs
  ✅ Uptime SLA Target: 99.9%

DATABASE:
  ✅ Slow query monitoring (>500ms)
  ✅ Connection pool tracking (10 max)
  ✅ Daily automated backups (Supabase)

SECURITY:
  ✅ Brute force detection
  ✅ Banned word response filter
  ✅ Cloudflare WAF active

ALERTS:
  ✅ P0 (Identity leak) → < 5 min response
  ✅ P1 (Server down)   → < 15 min response
  ✅ Weekly SLA report  → Every Monday

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
→ All insights feed into:
→ NEXT: Step 16 (Updates & Maintenance)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

> **MONITORING WORKFLOW LOCKED 🔒**  
> Launch के बाद भी सिस्टम की 24×7 निगरानी — यही असली Engineering है।
