# UI/UX DESIGN SPECIFICATION — RHYNIA SAAS v1.0

> **Design Flow Framework:**  
> **User Flow → Wireframe → Prototype → Visual Design → Design System → Responsive Check → Frontend को Handoff**  
> **Status:** APPROVED BY FOUNDER (Rhynia Intelligence)  
> **Version:** 1.0 Final  
> **Hard Rule (Banned Words):** No `AI`, `ChatGPT`, `Gemini`, `Qwen`, `Founder: Manish Chaturvedi`, `bot`, or `assistant`. The brand is strictly **Rhynia**.

---

## STEP 1: USER FLOW (यूज़र की पूरी यात्रा — LOGIN FIRST)

> **🔴 Founder Order (LOCKED):** "USER KO PAHLE CHATING SCREEN NAHI LOGIN SCREEN DIKHNA"  
> यानी ऐप या वेबसाइट खोलते ही सबसे पहले **Login / Sign In Screen (Screen 07)** दिखेगी। यदि यूज़र पहले से लॉग्ड-इन है (JWT टोकन मौजूद है), तो वह स्वतः Main Chat Screen पर चला जाएगा।

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. USER ENTERS APPLICATION (Direct URL Landing)                             │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                         [Check Token in localStorage]
                                       │
            ┌──────────────────────────┴──────────────────────────┐
            ▼ (No Token / First Visit)                            ▼ (Valid Token Exists)
┌──────────────────────────────────────────────┐                  │
│ 2. SIGN IN / LOGIN SCREEN (Screen 07) FIRST  │                  │
│    • Rhynia Glowing Logo & Title             │                  │
│    • Email & Password Input                  │                  │
│    • [Sign In ➔] (Azure Blue #0078D4)        │                  │
│    • [Continue with Google]                  │                  │
│    • [Continue with Mobile Number] ➔ SMS OTP │                  │
│    • [Don't have an account? Sign Up] (08)   │                  │
│    • [Forgot password?] (11)                 │                  │
└──────────────────────┬───────────────────────┘                  │
                       │ [Successful Authentication]              │
                       └──────────────────────────┬───────────────┘
                                                  │
                                                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 3. MAIN CHAT SCREEN (Empty State — Screen 01)                               │
│    • Clean space, Personalized Greeting                                     │
│    • Bottom Input Box with (+) Attachment and (➤) Send arrow                │
└──────────────────┬──────────────────────────────────────┬───────────────────┘
                   │                                      │
       [Taps (+) Button]                     [Types query & taps (➤)]
                   │                                      │
                   ▼                                      ▼
┌──────────────────────────────────────┐  ┌───────────────────────────────────┐
│ 3A. ATTACHMENT MODAL SHEET           │  │ 4. ACTIVE CONVERSATION VIEW       │
│     • 📷 Camera Capture              │  │    • User message bubble (Right)  │
│     • 📁 Device File Manager         │  │    • Rhynia response (Left)       │
└──────────────────┬───────────────────┘  │    • Response action bar (5 icons)│
                   │                      │    • Top-Right shows:             │
                   ▼                      │      [📝 New Chat] & [⋮ 3-Dots]   │
        [File Selected/Attached]          └─────────────────┬─────────────────┘
                   │                                        │
                   └────────────────────────────────────────┘
                                       │
                                       │ [Taps [ ≡ ] Top-Left Menu]
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 5. SIDEBAR DRAWER (Slides in from Left — Screen 04)                         │
│    • Top: Rhynia brand title & [🔍 Search History]                          │
│    • Middle: Recent Chat History (Chronological)                            │
│              └── Long-Press / Right-Click ──► [📌 Pin | ✏️ Rename | 🗑️ Delete] │
│    • Footer:                                                                │
│        ├── Left Bottom: [💬 Chat] (Starts Fresh Chat)                       │
│        └── Right Bottom: [👤 Profile]                                       │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       │ [Taps 👤 Profile Button]
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 6. FULL SETTINGS & PROFILE PANEL (Screen 05 / 06)                           │
│    • Big Circle Avatar: Full Name, Username, [📷 Upload Photo], [💾 Save]   │
│    • Account Details: Email & Mobile Number display                         │
│    • Preferences: Light/Dark Theme, Accent Color, Language, Notifications   │
│    • Storage: 500 MB / 5 GB / 25 GB Quota Progress Bar (Used vs Total)      │
│    • Exit: [🚪 Log Out] Button ──► Redirects Back to Screen 07 (Login)      │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 📸 वास्तविक सेव्ड स्क्रीन्स व कोड इंडेक्स (Single Source of Truth for Engineers)

> **फ़ोल्डर पाथ:** [`docs/rhynia_saas/ui_screens/`](file:///C:/Users/MANISH%20KUMAR/Desktop/DIGITAL%20AI/docs/rhynia_saas/ui_screens/)  
> **महत्वपूर्ण निर्देश:** फ़्रंटएंड इंजीनियर ठीक इन्हीं 6 स्क्रीन्स की इमेज देखकर सेम-टू-सेम UI कोड लिखेगा। बैकएंड और डेटाबेस के सारे मॉडल्स, एंडपॉइंट्स और फील्ड्स भी इन्हीं 6 स्क्रीन्स के अनुसार काम करेंगे।

| # | स्क्रीन का नाम | इमेज पाथ (Visual PNG) | सोर्स कोड (Reference HTML) |
|---|---|---|---|
| **01** | **Main Chat (Empty State)** | [`01_main_chat_empty_state.png`](file:///C:/Users/MANISH%20KUMAR/Desktop/DIGITAL%20AI/docs/rhynia_saas/ui_screens/01_main_chat_empty_state.png) | [`01_main_chat_empty_state.html`](file:///C:/Users/MANISH%20KUMAR/Desktop/DIGITAL%20AI/docs/rhynia_saas/ui_screens/01_main_chat_empty_state.html) |
| **02** | **Active Chat State** | [`02_active_chat_state.png`](file:///C:/Users/MANISH%20KUMAR/Desktop/DIGITAL%20AI/docs/rhynia_saas/ui_screens/02_active_chat_state.png) | [`02_active_chat_state.html`](file:///C:/Users/MANISH%20KUMAR/Desktop/DIGITAL%20AI/docs/rhynia_saas/ui_screens/02_active_chat_state.html) |
| **03** | **3-Dots Options Menu** | [`03_3dots_more_options_menu.png`](file:///C:/Users/MANISH%20KUMAR/Desktop/DIGITAL%20AI/docs/rhynia_saas/ui_screens/03_3dots_more_options_menu.png) | [`03_3dots_more_options_menu.html`](file:///C:/Users/MANISH%20KUMAR/Desktop/DIGITAL%20AI/docs/rhynia_saas/ui_screens/03_3dots_more_options_menu.html) |
| **04** | **Sidebar Drawer** | [`04_sidebar_drawer.png`](file:///C:/Users/MANISH%20KUMAR/Desktop/DIGITAL%20AI/docs/rhynia_saas/ui_screens/04_sidebar_drawer.png) | [`04_sidebar_drawer.html`](file:///C:/Users/MANISH%20KUMAR/Desktop/DIGITAL%20AI/docs/rhynia_saas/ui_screens/04_sidebar_drawer.html) |
| **05** | **Full Settings & Profile Panel** | [`05_full_settings_profile_panel.png`](file:///C:/Users/MANISH%20KUMAR/Desktop/DIGITAL%20AI/docs/rhynia_saas/ui_screens/05_full_settings_profile_panel.png) | [`05_full_settings_profile_panel.html`](file:///C:/Users/MANISH%20KUMAR/Desktop/DIGITAL%20AI/docs/rhynia_saas/ui_screens/05_full_settings_profile_panel.html) |
| **06** | **Edit Profile Modal** | [`06_edit_profile_modal.png`](file:///C:/Users/MANISH%20KUMAR/Desktop/DIGITAL%20AI/docs/rhynia_saas/ui_screens/06_edit_profile_modal.png) | [`06_edit_profile_modal.html`](file:///C:/Users/MANISH%20KUMAR/Desktop/DIGITAL%20AI/docs/rhynia_saas/ui_screens/06_edit_profile_modal.html) |

---

## STEP 2: WIREFRAME (ब्लूप्रिंट और लेआउट्स के संपूर्ण डायग्राम्स)

### 2.1 Screen 1: Main Chat Screen (Empty State)
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ [ ≡ ]                                                                       │
│ (48px)                                                                      │
│                                                                             │
│                                                                             │
│                                                                             │
│                        ( Clean, Open Space )                                │
│                                                                             │
│                                                                             │
│                                                                             │
│                                                                             │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │  (+)   Ask Rhynia…                                                 (➤)  │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### 2.2 Screen 1: Active Chat State (पूर्ण डायग्राम + 3-Dot Dropdown & Action Bar)
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ [ ≡ ]                                                    [ 📝 ]     [ ⋮ ]   │
│                                                                       │     │
│                                                       ┌───────────────┴───┐ │
│                                                       │ 📤 Share Chat     │ │
│                                                       │ 📌 Pin to Top     │ │
│                                                       │ 🔍 Find in Chat   │ │
│                                                       │ 🗑️ Delete Chat    │ │
│                                                       └───────────────────┘ │
│                                                                             │
│                                          ┌────────────────────────────────┐ │
│                                          │ User prompt message text bubble│ │
│                                          │ (Right-aligned, soft surface)  │ │
│                                          └────────────────────────────────┘ │
│                                                                             │
│ Rhynia response formatted markdown text...                                  │
│ Detailed explanation, code blocks, lists or points                          │
│ rendered cleanly on the left side with perfect line-height.                 │
│                                                                             │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ [ 📋 Copy ]  [ 🔊 Speaker ]  [ 👍 Good ]  [ 👎 Bad ]  [ 📤 Share ]      │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │  (+)   Ask Rhynia…                                                 (➤)  │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### 2.3 Screen 1 (Sub-view): (+) Attachment Bottom Sheet Modal
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│                           ( Background Overlay )                            │
│                                                                             │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │                             Attach to Chat                              │ │
│ │ ─────────────────────────────────────────────────────────────────────── │ │
│ │  [ 📷 Camera ]                — Live photo capture from camera          │ │
│ │  [ 📁 Device File Manager ]   — Pick PDF, Docs, Images from device      │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │  (+)   Ask Rhynia…                                                 (➤)  │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### 2.4 Screen 2: Sidebar Drawer (पूर्ण डायग्राम + Long-Press Context Menu)
```
┌──────────────────────────────────────────────┬──────────────────────────────┐
│  Rhynia                              [ 🔍 ]  │                              │
│  (Brand Title)                (Search Chats) │                              │
│ ──────────────────────────────────────────── │                              │
│  RECENT CHATS                                │                              │
│                                              │                              │
│  📌 Quantum Physics Notes                    │                              │
│  💬 Essay Outline Draft                      │                              │
│  💬 Math Equation Solver                     │                              │
│  ┌─────────────────────────────────────────┐ │                              │
│  │ 📌 Pin Chat                             │ │      ( Main Chat Screen      │
│  │ ✏️ Rename Chat                          │ │        Dimmed Overlay )      │
│  │ 🗑️ Delete Chat                         │ │                              │
│  └─────────────────────────────────────────┘ │                              │
│  💬 Marketing Strategy Plan                  │                              │
│  💬 Python Code Debugger                     │                              │
│                                              │                              │
│                                              │                              │
│                                              │                              │
│ ──────────────────────────────────────────── │                              │
│  [ 💬 Chat ]                  [ 👤 Profile ] │                              │
│  (Start New Chat)             (Open Settings)│                              │
└──────────────────────────────────────────────┴──────────────────────────────┘
```

---

### 2.5 Screen 3: Full Settings & Profile Panel (विस्तृत डायग्राम)
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ [ ← Back ]                             Settings                             │
│ ─────────────────────────────────────────────────────────────────────────── │
│                                                                             │
│                                [ ( 👤 ) ]                                   │
│                            [ 📷 Upload Photo ]                              │
│                                                                             │
│      Full Name:      [ Aarav Sharma                                   ]     │
│      Username:       [ @aarav                                         ]     │
│                                                                             │
│                             [ 💾 Save Changes ]                             │
│                                                                             │
│ ─────────────────────────────────────────────────────────────────────────── │
│ Account Details:                                                            │
│   ✉️ Email:           aarav@example.com          (Read-only verified)       │
│   📱 Mobile Number:   +91 9876543210             (Read-only verified)       │
│                                                                             │
│ ─────────────────────────────────────────────────────────────────────────── │
│ Preferences:                                                                │
│   🌓 Appearance:             [ Light Mode ]      [ Dark Mode ]              │
│   🎨 Accent Color:           🟣 Purple  🔵 Blue  🟢 Green  🟡 Yellow 🔴 Red │
│   🌐 Language:               [ English (US)                              ▼] │
│   🔔 Notifications:          [ ON / OFF Toggle                            ] │
│                                                                             │
│ ─────────────────────────────────────────────────────────────────────────── │
│ Storage Details (Free User Quota):                                          │
│   💾 Free Storage: 38 MB of 500 MB used (7.6%)                              │
│   ┌───────────────────────────────────────────────────────────────────────┐ │
│   │ [████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░] │ │
│   └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│ ─────────────────────────────────────────────────────────────────────────── │
│ [ 🚪 Log Out ]                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## STEP 3: PROTOTYPE (इंटरैक्शन स्टेट्स और व्यवहार)

| ट्रिगर (Action) | इंटरैक्शन व एनिमेशन | रिज़ल्ट (Result) |
|---|---|---|
| **Tap `[ ≡ ]`** | CSS `transform: translateX(0)` (280ms cubic-bezier) | साइडबार स्मूथली बाईं तरफ से स्क्रीन पर आ जाता है। |
| **Tap `(+)`** | बॉटम शीट पॉपओवर फेड-इन (`fade-in 150ms`) | 📷 Camera और 📁 Device File Manager के ऑप्शन्स दिखते हैं। |
| **Input Text Typed** | Send बटन की ओपेसिटी 0.4 से 1.0 हो जाती है, कलर `#7c5cff` | सेंड बटन एक्टिव हो जाता है। |
| **Send `(➤)` Clicked** | इनपुट साफ़, टाइपिंग इंडिकेटर फेड-इन, टोकन स्ट्रीमिंग | यूज़र बबल राइट-अलाइन होता है, फिर AI जवाब टाइप होता है। |
| **AI Reply Finished** | फ़ेड-इन एक्शन बार | जवाब के नीचे 5 बटन्स (Copy, Speaker, 👍, 👎, Share) प्रकट होते हैं। |
| **Tap Speaker `[ 🔊 ]`** | आइकन पर पल्स एनिमेशन (`pulse 1s infinite`) | Web Speech Synthesis API आवाज़ में जवाब पढ़ता है। |
| **Long-Press on Chat** | 500ms होल्ड पर हैप्टिक वाइब्रेशन + कॉन्टेक्स्ट मेनू | 📌 Pin, ✏️ Rename, 🗑️ Delete का पॉपओवर खुलता है। |
| **Tap 👤 Profile** | साइडबार बंद + सेटिंग्स पैनल स्लाइड-अप | फुल सेटिंग्स व 500 MB स्टोरेज बार खुलता है। |

---

## STEP 4: VISUAL DESIGN (FLUENT DARK HORIZON — आधिकारिक डिज़ाइन सिस्टम)

> **Official Design System:** **Fluent Dark Horizon** (लॉक्ड और फ़ाइनल)  
> **डिज़ाइन एसेट्स पाथ:** `docs/rhynia_saas/design_reference/`

### 4.1 Color System (Fluent Dark Horizon Palette)
* **Background Primary**: `#131313` (डीप कार्बन वॉइड)
* **Surface Container Lowest**: `#0e0e0e` (सख्त डार्क बेस)
* **Surface Container Low**: `#1b1c1c`
* **Surface Container (Cards / Input)**: `#202020`
* **Surface Container High (Dialogs / Modals)**: `#2a2a2a`
* **Surface Container Highest**: `#353535`
* **Accent Primary (Electric Azure Blue)**: `#0078d4` (सेंड बटन, एक्टिव टॉगल, न्यू चैट पिल)
* **Accent Tint / Glow**: `#a3c9ff` / `#00a4ef`
* **Text Primary (On-Surface)**: `#e5e2e1` (हाई-कंट्रास्ट क्लीन व्हाइट-ग्रे)
* **Text Muted (Outline)**: `#8a919e` / `#c0c7d4`
* **Danger / Error**: `#ffb4ab` / `#d93025`

### 4.2 Light Mode Palette (वैकल्पिक लाइट थीम)
* **Background Primary**: `#ffffff`
* **Surface Container**: `#f5f5f5`
* **Text Primary**: `#0d0d0d`
* **Accent Primary**: `#0078d4`

### 4.3 Typography (फ़ॉन्ट्स)
* **Headlines / Display**: `Plus Jakarta Sans` (600 semi-bold / 700 bold)
* **Body / Controls / Buttons**: `Inter` (400 regular / 500 medium / 600 semi-bold)
* **Line Height**: कम से कम `1.55x` (हिंदी और देवनागरी मात्राओं के लिए ऑप्टिमाइज़्ड)

---

## STEP 5: DESIGN SYSTEM (एटम्स, मॉलिक्यूल्स और टोकन्स)

### 5.1 CSS Design Tokens (:root)
```css
:root {
  /* Fluent Dark Horizon — Core Colors */
  --bg-primary: #131313;
  --bg-surface: #202020;
  --bg-surface-high: #2a2a2a;
  --bg-sidebar: #1b1c1c;
  --border-subtle: #404752;
  --text-main: #e5e2e1;
  --text-muted: #8a919e;

  /* Accent (Electric Azure Blue) */
  --accent: #0078d4;
  --accent-hover: #0060ab;
  --accent-tint: #a3c9ff;
  --accent-secondary: #00a4ef;
  --danger-red: #d93025;

  /* Typography */
  --font-display: 'Plus Jakarta Sans', sans-serif;
  --font-body: 'Inter', sans-serif;

  /* Dimensions & Radii */
  --btn-round-size: 48px;
  --input-radius: 9999px; /* Continuous Pill */
  --card-radius: 16px;
  --modal-radius: 24px;

  /* Shadows & Glow */
  --shadow-capsule: 0 4px 20px rgba(0, 0, 0, 0.5);
  --shadow-popup: 0 8px 30px rgba(0, 0, 0, 0.7);
  --ambient-glow: 0 0 24px -4px rgba(0, 120, 212, 0.25);
  --transition-smooth: 0.28s cubic-bezier(0.32, 0.72, 0, 1);
}
```

### 5.2 Component Atoms & Molecules
* **Floating Capsule Composer**: `min-height: 54px; border-radius: 9999px; background: rgba(32, 32, 32, 0.85); backdrop-filter: blur(20px);`
* **Send Button `(➤)`**: `width: 40px; height: 40px; border-radius: 50%; background: #0078d4; color: white;`
* **New Chat Pill Button (Sidebar)**: `height: 44px; border-radius: 9999px; background: #0078d4; color: white; font-weight: 600; padding: 0 18px;`
* **Storage Bar (500 MB Multi-Segment)**:
  * **डिज़ाइन रेफ़रेंस (Mockup Only)**: `24 MB (Threads) + 14 MB (Media) + 462 MB (Free)` — यह सिर्फ़ UI डिज़ाइन का सैंपल/डमी डेटा है।
  * **वास्तविक डायनामिक लॉजिक (Real Storage)**: असली सिस्टम में यह `users.storage_used_bytes` से लाइव कैलकुलेट होगा। नया यूज़र 0 MB पर शुरू करेगा और यूज़र द्वारा अपलोड की गई असली फाइल्स/मैसेजेस के आधार पर बार डायनामिक रूप से भरेगा (कुल फ़्री कोटा = 500 MB = 524,288,000 bytes)।
  * Track: `height: 8px; border-radius: 4px; background: #2a2a2a;`
  * Used Segment: `background: #0078d4;` (डायनामिक प्रोग्रेस विड्थ)
  * Free Space: `background: transparent;` (शेष उपलब्ध स्पेस)
* **Action Buttons Bar (5 Icons)**:
  * `[📋 Copy] [👍 Like] [👎 Dislike] [🔊 Speaker] [📤 Share]` — Rounded pills with subtle 1px border.

---

## STEP 6: RESPONSIVE CHECK (सभी स्क्रीन्स पर टेस्ट)

| डिवाइस (Viewport) | चौड़ाई (Width) | लेआउट व्यवहार (Layout Adaptation) |
|---|---|---|
| **Mobile (Small)** | 320px – 480px | इनपुट बार 94% चौड़ा, साइडबार 85% चौड़ा, 48px टच टारगेट उंगली के लिए एकदम परफेक्ट। |
| **Mobile (Large) / Phablet**| 481px – 767px | फुल रिस्पॉन्सिव, इनपुट बार मैक्स 700px, साइडबार 320px पर लॉक। |
| **Tablet** | 768px – 1024px | चैट एरिया सेंटर-अलाइन्ड (768px max-width), साइडबार ओवरले के साथ स्लाइड। |
| **Desktop / Laptop** | 1025px + | सेंटर कॉलम 768px (पढ़ने में सबसे आरामदायक), साइडबार पिन/कोलैप्स टॉगल। |

* **Touch Targets**: सभी क्लिकेबल आइकन्स का न्यूनतम साइज **48px × 48px** रखा गया है (Google Material और Apple HIG स्टैंडर्ड)।

---

## STEP 7: FRONTEND को HANDOFF (डेवलपर के लिए निर्देश)

### 7.1 फाइल्स स्ट्रक्चर:
* **HTML**: `frontend/index.html` (सिर्फ़ सिमेंटिक HTML, कोई इनलाइन स्टाइल नहीं)।
* **CSS**: `frontend/style.css` (ऊपर दिए गए डिज़ाइन टोकन्स `:root` का इस्तेमाल)।
* **JS**: `frontend/app.js` (DOM इवेंट्स, स्टेट मैनेजमेंट, और API कॉल्स)।
* **Config**: `frontend/config.js` (`API_BASE: "/api/v1"`).

### 7.2 डेवलपर चेकलिस्ट (Hand-off Checklist):
1. [x] सभी बैन शब्द (`ChatGPT`, `AI`, `Gemini`, `Founder: Manish Chaturvedi`, `bot`) कोड में कहीं न हों।
2. [x] इनपुट बॉक्स में `(+)` दबाने पर 📷 Camera और 📁 Device File Manager दोनों इवेंट्स बाइंड हों।
3. [x] साइडबार में रीसेंट चैट्स पर `contextmenu` (डेस्कटॉप) और `touchstart/touchend` (500ms टाइमर) से Pin, Rename, Delete मेनू खुले।
4. [x] AI रिस्पॉन्स के नीचे 5 बटन्स (Copy, Speaker, 👍, 👎, Share) तुरंत डायनामिकली रेंडर हों।
5. [x] 👤 Profile बटन पर क्लिक करने पर Full Settings खुले और 500 MB स्टोरेज बार यूजर के बाइट्स से कैलकुलेट होकर भरे।
6. [x] Auth Modal / Screens (Sign In, Sign Up, Phone/Email OTP, Forgot Password) पूरी तरह Fluent Dark Horizon थीम में तैयार हों।

---

## STEP 8: AUTHENTICATION & LOGIN FLOW SCREENS (ग्राउंड ट्रुथ स्क्रीन्स) ✅

`C:\Users\MANISH KUMAR\Downloads\RHYNIA LOGIN.zip` से एक्सट्रैक्ट की गई आधिकारिक ऑथेंटिकेशन स्क्रीन्स:

| # | स्क्रीन का नाम | फ़ाइल (HTML / PNG) | प्रमुख विशेषताएँ (Key UI Features) |
|---|---|---|---|
| **07** | **Sign In (Login)** | `07_login_screen.html` / `.png` | Rhynia Glowing Badge Logo, Email input, Password input (Eye toggle), "Sign In ->" Azure Button, Google Sign-in, Mobile OTP option, "Sign Up" link |
| **08** | **Sign Up (Register)** | `08_sign_up_screen.html` / `.png` | Full Name, Email, Password, Security Strength Meter (8+ chars, Letter & Number), "Create Account ->" Button, Google/Phone Login |
| **09** | **Verify SMS OTP** | `09_verify_sms_otp.html` / `.png` | 6-Digit OTP Boxes, Paste from clipboard, Resend timer countdown (00:48), "Verify & Proceed ->" Button, End-to-end encrypted badge |
| **10** | **Verify Email OTP** | `10_verify_email_otp.html` / `.png` | 6-Digit OTP Boxes, Sent email tag with edit pencil, Resend timer (00:48), "Verify & Continue ->" Button, Switch to SMS option |
| **11** | **Forgot Password** | `11_forgot_password.html` / `.png` | Email vs SMS OTP tab toggle, Registered input box, "Send Reset Link ->", Magic link explanation card, "Sign In" back link |

> **थीम एकरूपता (Theme Consistency):** सभी 5 स्क्रीन्स 100% **Fluent Dark Horizon** (`#131313` Carbon Black, `#0078D4` Electric Azure, Inter + Plus Jakarta Sans) में डिज़ाइन की गई हैं।
