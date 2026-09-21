# PRODUCT REQUIREMENTS DOCUMENT (PRD) — RHYNIA SAAS v1.0

> **Document Version:** 1.0 (Final Comprehensive)  
> **Product Name:** Rhynia SaaS Platform  
> **Status:** APPROVED BY FOUNDER (Rhynia Intelligence)  
> **Approval Date:** 2026-09-21  
> **Hard Rules (Banned Words):** No `AI`, `ChatGPT`, `Gemini`, `Qwen`, `Founder: Manish Chaturvedi`, `bot`, or `assistant`. The brand is strictly **Rhynia**.

---

## 1. Product Purpose
Rhynia is an elite, distraction-free, privacy-centric conversational intelligence SaaS platform. The product delivers direct, lightning-fast, and precise dialogue to students, creators, and professionals without clutter, intrusive marketing, or generic AI branding.

---

## 2. Users (Target Personas)
1. **Aarav (Student, High School / Competitive Exams, 17)**:
   - Needs: Quick conceptual explanations, study summaries, exam quizzes, Hinglish language comprehension.
2. **Priya (Undergraduate / Professional, 21)**:
   - Needs: Document reading, lecture notes structuring, assignment drafting, device file analysis.
3. **Power User / Researcher**:
   - Needs: Multi-session project organization, pinned chats, custom appearance (Dark mode, Accent colors), high-speed keyboard shortcuts.

---

## 3. Problems (Problem Statement)
* **Cluttered Interfaces**: Mainstream platforms are bloated with complex menus, ads, and forced onboarding flows.
* **Mandatory Login Friction**: Users are blocked behind mandatory login walls before they can even test or use the software.
* **Generic Identity Confusion**: Foreign platforms leak multiple corporate brand names, confusing vernacular users.
* **Storage & File Attachment Limitations**: Lack of clear, transparent personal storage for uploaded study materials.

---

## 4. Goals
* **Product Goal**: 100% direct-to-chat onboarding with zero login barrier on first visit.
* **User Experience Goal**: Sub-50ms UI latency and clean markdown-rendered responses.
* **Identity Goal**: Zero identity leakage (100% Rhynia branding across all screens).
* **Storage Goal**: Deliver 500 MB of transparent, real-time tracked free storage per user.

---

## 5. Features (Core Capabilities)
1. **Direct Chat Engine**: Instant single and multi-turn text conversations with Smart Cascade AI Routing (Qwen 3.8 Free, DeepSeek V4 Flash, Gemini 2.5 Pro Free).
2. **Multimodal Attachment Ingestion**: Instant device camera snapshotting and device file manager upload.
3. **Real-Time Live Discovery & Search Engine (Only Live Search + Structured AI Summary)**:
   - **Google Web Search**: लाइव इंटरनेट से ताज़ा डेटा सर्च करके मुख्य उत्तर और सटीक सोर्स लिंक्स की सारांश रिपोर्ट (Summary + Direct Links)।
   - **Google Maps Search**: नजदीकी स्थान, रेटिंग, दूरी और पता सर्च करके सीधा इंटरैक्टिव लोकेशन कार्ड और मैप लिंक देना (Summary + Location Card)।
   - **YouTube Intelligence**: वीडियो खोजकर बिना वीडियो देखे 2-3 बुलेट पॉइंट्स में उसका मुख्य निष्कर्ष/सारांश और वीडियो लिंक देना (Key Takeaway Summary + Link)।
   - **Social Trends (Insta/FB)**: ट्रेंडिंग हैशटैग्स और पब्लिक टॉपिक्स को सर्च करके ट्रेंडिंग इनसाइट्स की समरी देना (Trends Summary)।
4. **Study & Productivity Suite**:
   - **Notes & PDF Generator**: Beautiful structured study notes with one-click PDF export.
   - **PPT Slide Maker**: Instant presentation outlines and downloadable `.pptx` slides.
   - **Interactive Visuals**: Mermaid flowcharts, XY charts, and dynamic data tables.
   - **Code Blocks & Copy**: Syntax-highlighted programming code with one-click copy (interactive live sandbox deferred).
   - **Excel & Academic Guidance**: Formulas (VLOOKUP/XLOOKUP), data cleaning, and conceptual study guidance.
5. **Session Management**: Session auto-naming, pinning, renaming, and soft/hard deletion.
6. **Interactive Response Controls**: One-click Markdown copy, text-to-speech speaker, thumbs-up/down feedback, and web sharing.
7. **Sidebar Workspace**: Chronological chat history with right-click / long-press management menus.
8. **Full Profile & Settings Hub**: Full avatar editing, credential overview, theme toggling, accent color tuning, language selection, and plan storage tracking (500 MB Free, 5 GB Pro, 25 GB Ultra Pro).
9. **Multi-Channel Authentication**: Google OAuth, SMS Phone OTP, and BCrypt Email/Password accounts.
10. **3-Tier Subscription & Micro-Pass Engine**:
    - **RHYNIA FREE (₹0/mo)**: 20 chats/day, 3 vision/day, 5 searches/day, 500 MB storage.
    - **RHYNIA PRO (₹99/mo)**: Unlimited chats, 50 vision/day, unlimited search/maps/YouTube, PPT maker, 5 GB storage.
    - **RHYNIA ULTRA PRO (₹249/mo)**: Unlimited all, 25 GB storage, 100 AI images/mo, deep textbook reasoning, VIP support.
    - **₹10 DAILY EXAM PASS**: 24-hour instant unlimited pass for emergency study bursts.

---

## 6. User Flow (Login-First Experience)

```
[User Arrives at URL]
       │
       ▼
[Check Valid Token in LocalStorage?]
       ├── No ──► [Sign In / Login Screen — Screen 07] FIRST
       │               ├── [Sign In with Email & Password] ──────────┐
       │               ├── [Continue with Google] ───────────────────┤
       │               ├── [Continue with Mobile Number] ➔ SMS OTP ──┤
       │               ├── [Sign Up / Create Account] ➔ Screen 08 ───┤
       │               └── [Forgot Password] ➔ Screen 11 ────────────┤
       │                                                             ▼
       └── Yes (or post-login) ────────────► [Main Chat Screen — Screen 01]
                                                   │
                                                   ├──► Tap (+) ──► [📷 Camera] or [📁 File Manager]
                                                   ├──► Type Query & Send (➤) ──► [Active Conversation]
                                                   └──► Tap [ ≡ ] ──► [Sidebar Drawer] ──► [Profile/Settings]
```

---

## 7. UI Requirements (Screen Specifications)

### 7.1 Screen 1: Main Chat Screen
* **Empty State**:
  * Top-Left: `[ ≡ ]` 48px round menu button.
  * Center: Clean, open white space.
  * Bottom: Floating input capsule containing:
    * Left: `(+)` Plus button (Camera & Device File Manager).
    * Center: Multiline input box with placeholder `"Ask Rhynia…"`.
    * Right: Circular send button with Arrow icon `(➤)` / `(↑)`.
* **Active State**:
  * Top-Right: `[ 📝 ]` New Chat icon immediately to the left of `[ ⋮ ]` 3-Dot menu.
  * 3-Dot Dropdown Options: `Share`, `Pin`, `Find chat`, `Delete`.
  * Message Bubble: User (right-aligned neutral grey bubble), Rhynia (left-aligned full-width).
  * Response Action Row: `Copy`, `Speaker (TTS)`, `Thumbs Up`, `Thumbs Down`, `Share`.

### 7.2 Screen 2: Sidebar (Drawer)
* Header: Left: **Rhynia** | Right: 🔍 Search icon.
* Body: Chronological recent conversations list.
  * Interaction: Long-press (mobile) or Right-click (desktop) shows context popover: `Pin`, `Rename`, `Delete`.
* Footer:
  * Bottom-Left Corner: `[ 💬 Chat ]` button.
  * Bottom-Right Corner: `[ 👤 Profile ]` button.

### 7.3 Screen 3: Full Settings & Profile Panel
* Header: `[ ← Back ]` navigation + Title.
* Profile Card:
  * Big Circular Avatar.
  * Edit Fields: Full Name, Username (`@handle`), `[ 📷 Upload Photo ]`, `[ 💾 Save Changes ]`.
* Account Details: Email address and Mobile number display.
* Preferences:
  * Appearance: Light / Dark theme toggles.
  * Accent Color: Swatches (Purple `#7c5cff`, Blue `#1a73e8`, Green, Amber, Red).
  * General: Language dropdown.
  * Notifications: Push permission toggle.
* Storage Section: 500 MB Free Storage display bar (Used MB vs 500 MB).
* Footer: `[ 🚪 Log Out ]` in distinct red text.

### 7.4 Authentication & Onboarding Flow (5 Dedicated Screens — Ground Truth)
* **Screen 4A: Sign In (`07_login_screen`)**:
  * Glowing Rhynia Logo, Email input, Password input with eye visibility toggle, "Sign In →" primary button, Google OAuth button, "Continue with Mobile Number" button, "Forgot Password?" & "Sign Up" links.
* **Screen 4B: Sign Up (`08_sign_up_screen`)**:
  * Full Name, Email, Password, interactive Security Strength Meter (8+ chars, Letter & Number), "Create Account →" button, Google & Mobile registration.
* **Screen 4C: Verify Phone SMS OTP (`09_verify_sms_otp`)**:
  * 6-digit pin entry with auto-focus, "Paste code from clipboard" button, 48s countdown timer, "Verify & Proceed →" button, end-to-end encrypted security badge.
* **Screen 4D: Verify Email OTP (`10_verify_email_otp`)**:
  * 6-digit email confirmation code input, recipient email tag with edit button, resend countdown, "Verify & Continue →" button, SMS switch option.
* **Screen 4E: Forgot / Reset Password (`11_forgot_password`)**:
  * Email vs SMS OTP tab selector, registered credential input box, "Send Reset Link →" button, magic link confirmation card.

---

## 8. Functional Requirements
* **FR-01 (Login-First Authentication Flow)**: यूज़र को ऐप खोलने पर सबसे पहले Login Screen (`07_login_screen.html`) दिखेगी। यूज़र Email/Password, Google OAuth, या Phone OTP से लॉगिन या साइनअप करेगा। लोकल स्टोरेज में वैध JWT टोकन होने पर ही वह सीधे Main Chat Screen (`01_main_chat_empty_state.html`) में प्रवेश करेगा।
* **FR-02 (Message Streaming)**: Real-time chunked response rendering.
* **FR-03 (Text-to-Speech)**: Web Speech API synthesis on clicking the Speaker icon.
* **FR-04 (File Attachment Storage)**: Camera captures and File Manager uploads are validated and stored in `/uploads/{user_id}/`.
* **FR-05 (Storage Accounting)**: Every file upload increments `users.storage_used_bytes`. If upload exceeds 500 MB, reject with HTTP 413.
* **FR-06 (Phone OTP)**: SMS gateway generates 6-digit numeric OTP with 300-second expiration.
* **FR-07 (Session Context)**: Chat requests supply the last 10 messages for conversational continuity.

---

## 9. Non-Functional Requirements
* **NFR-01 (Performance)**: UI interactive response < 50ms; Time-to-First-Token < 2.5s.
* **NFR-02 (Security)**: Passwords hashed with BCrypt (cost 12); JWT token expiration 7 days.
* **NFR-03 (Reliability)**: Database SQLite for local development; seamless transition to Supabase (PostgreSQL) via connection string.
* **NFR-04 (Responsiveness)**: Fluid layouts down to 320px mobile viewports up to 4K desktop screens.
* **NFR-05 (Accessibility)**: WCAG 2.1 AA compliant contrast ratio (minimum 4.5:1 on text).

---

## 10. Roles & Permissions
* **Guest User**: Can chat, upload up to 500 MB files, toggle theme and settings locally. History persisted in local session.
* **Registered Free User**: All guest features plus cloud sync across devices, verified email/phone, permanent history.
* **Admin User**: Access to user management metrics, database backups, and system status health endpoints.

---

## 11. Data (Schema & Models)
* `users`: `id`, `public_id`, `name`, `username`, `email`, `phone`, `password_hash`, `auth_provider`, `theme`, `accent_color`, `language`, `storage_used_bytes`, `storage_limit_bytes` (500MB), `created_at`.
* `phone_otps`: `id`, `phone`, `otp_code`, `expires_at`, `is_used`, `created_at`.
* `sessions`: `id`, `public_id`, `user_id`, `title`, `is_pinned`, `is_archived`, `created_at`, `updated_at`.
* `messages`: `id`, `session_id`, `user_id`, `role`, `content`, `rating`, `created_at`.
* `user_files`: `id`, `public_id`, `user_id`, `session_id`, `file_name`, `file_size_bytes`, `file_type`, `file_path`, `created_at`.

---

## 12. API (Endpoints & Contracts)
All routes prefixed with `/api/v1/`:
* `POST /auth/register` — Create account.
* `POST /auth/login` — Email login.
* `POST /auth/google` — Google OAuth validation.
* `POST /auth/phone/send-otp` — Generate and dispatch SMS OTP.
* `POST /auth/phone/verify-otp` — Verify code and issue JWT.
* `GET /auth/me` — Retrieve active user session.
* `GET /sessions` — List conversations (pinned & recents).
* `POST /sessions` — Create fresh conversation.
* `PATCH /sessions/{pid}` — Update title or pinned status.
* `DELETE /sessions/{pid}` — Delete specific session.
* `DELETE /sessions` — Clear all chat history.
* `GET /sessions/{pid}/messages` — Fetch message history.
* `POST /chat` — Post prompt & get streamed/generated answer.
* `PATCH /messages/{id}/rating` — Submit thumbs-up / thumbs-down.
* `PATCH /profile` — Update name, username, theme, accent color, language.
* `POST /profile/avatar` — Upload avatar image.
* `POST /files/upload` — Upload camera snapshot or device file.
* `GET /health` — System status check.

---

## 13. Integrations
1. **Google Identity Services**: OAuth2 sign-in via tokeninfo verification.
2. **SMS Gateway**: Twilio / Fast2SMS / Mock Gateway for 6-digit OTP delivery.
3. **Inference Pipeline**: Hugging Face Inference API (`siyarajput/Rhynia-V3-VL-8B-Merged`) / Groq fallback / Ollama.
4. **Supabase Database**: PostgreSQL backend hosting for production rollout.

---

## 14. Security
* **Zero Banned Words**: Sanitization pipeline preventing exposure of banned model names.
* **SQL Injection Prevention**: Exclusive usage of SQLAlchemy ORM parameterized queries.
* **Cross-Origin Resource Sharing (CORS)**: Restricted in production to official domain.
* **File Upload Hardening**: MIME type verification, file renaming using UUIDs, strict storage limits.

---

## 15. Out of Scope (For v1.0 — बाद में आएँगे)
* **Live UI / Code Sandbox**: चैट के अंदर HTML/CSS/JS कोड को लाइव चलाकर देखना (Codex-like sandbox — v1.2+ में)।
* **Secret Calling / Telephony VoIP Gateway**: यूज़र-टू-यूज़र सीक्रेट कॉलिंग ब्रिजिंग (v1.2+ में)।
* **Tally Accounting Direct Connector**: टैली सॉफ़्टवेयर का डायरेक्ट डेस्कटॉप अटैचमेंट (v1.2+ में)।
* **MS Office Native Desktop Add-in**: एक्सेल/वर्ड का डायरेक्ट डेस्कटॉप सॉफ्टवेयर प्लगइन (v1.2+ में)।
* **Autonomous PC/Mobile Controller Agent**: कंप्यूटर व मोबाइल का ऑटोमैटिक कंट्रोल (Roadmap Step 04 में)।
* Multi-user collaborative enterprise team workspaces.
* Native mobile app compilation (Google Play Store / Apple App Store — Phase 2/4)।

---

## 16. MVP (Minimum Viable Product Definition)
The v1.0 launch is complete when:
1. User can open browser and immediately chat on the Empty Chat Screen.
2. User can attach images/files via Camera and File Manager under the 500 MB limit.
3. User can review history, pin, rename, and delete chats from the Sidebar.
4. User can access Full Settings to customize Profile, Theme, and Accent Color.
5. User can authenticate seamlessly via Google, Phone OTP, or Email.

---

## 17. Success Metrics (KPIs)
* **Onboarding Conversion**: > 80% of first-time visitors send at least 1 message within 30 seconds.
* **Daily Active User (DAU) Engagement**: Average session length >= 4 message turns.
* **Zero Leakage Score**: 100% pass rate on brand identity audits.
* **Crash & Error Rate**: < 0.1% server 500 errors.

---

## 18. Acceptance Criteria
* [x] UI pixel-matches the specification in `04_UI_UX.md`.
* [x] Architecture adheres strictly to the 3-layer decoupled design in `05_ARCHITECTURE.md`.
* [x] 500 MB file quota is enforced at the API layer.
* [x] Long-press and right-click menus function consistently across mobile and desktop.
* [x] Text-to-speech speaker outputs audible voice responses without errors.

---

## 19. Review (Stakeholder Sign-Off)

| Role | Name | Status | Date |
|---|---|---|---|
| **Founder & Product Lead** | Rhynia Intelligence | APPROVED ✅ | 2026-09-21 |
| **Lead Solution Architect** | Rhynia Architecture Core | APPROVED ✅ | 2026-09-21 |
| **Lead UI/UX Designer** | Rhynia Design Core | APPROVED ✅ | 2026-09-21 |

---

## 20. Final PRD (Document Control)
* **Document ID**: `RHYNIA-PRD-V1.0-FINAL`
* **File Path**: `docs/rhynia_saas/02_PRD.md`
* **Sign-Off State**: **LOCKED & READY FOR EXECUTION** 🚀
