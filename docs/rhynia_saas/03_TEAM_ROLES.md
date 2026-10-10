# STEP 3 — Team Formation & Execution Workflow
## Rhynia Intelligence SaaS v1.0 — Roles, Ownership & Multi-Agent Architecture

> **Input:** Step 2 (PRD Approved ✅) + Step 1 (Idea Validation ✅)  
> **Output:** स्पष्ट जिम्मेदारियाँ, मॉड्यूल ओनरशिप, Git ब्रांचिंग रणनीति, और Sub-Agent एक्ज़ीक्यूशन मॉडल  
> **Status:** APPROVED BY FOUNDER (Rhynia Intelligence) ✅  
> **Standard:** Google / Microsoft / Apple Enterprise Project Architecture  
> **Brand Rule:** Strictly **Rhynia**. No identity leakage.

---

## 1️⃣ PRD पढ़कर टीम अलाइनमेंट (Team Alignment)

प्रोजेक्ट की शुरुआत से पहले पूरी टीम और Sub-Agents का एक ही लक्ष्य पर स्पष्ट होना अनिवार्य है:
* **लक्ष्य:** Rhynia Intelligence SaaS v1.0 — एक ऐसा सुरक्षित, मोबाइल-फर्स्ट वेब/PWA प्लेटफॉर्म जो भारतीय छात्रों और प्रोफेशनल्स को शुद्ध हिंदी/अंग्रेजी में सटीक, ईमानदार और त्वरित जवाब दे।
* **प्रमुख फोकस:**
  1. लॉगिन स्क्रीन फर्स्ट ऑनबोर्डिंग (Screen 07 First) + पोस्ट-लॉगिन मेन चैट स्क्रीन
  2. 3-टियर स्मार्ट कैस्केड इंजन (फ्री मॉडल पहले, फिर पेड फॉलबैक)
  3. लाइव सर्च व समरी (वेब, गूगल मैप्स, यूट्यूब, सोशल ट्रेंड्स)
  4. स्टडी टूल्स (पीडीएफ नोट्स व पीपीटी मेकर)
  5. 3-टियर सब्सक्रिप्शन व कोटा एनफोर्समेंट

---

## 2️⃣ ज़रूरी Roles और जिम्मेदारियाँ (Core Roles)

| Role | प्राथमिक जिम्मेदारी (Primary Responsibility) | Rhynia v1.0 में भूमिका |
|---|---|---|
| **Product Manager (PM)** | पूरा प्रोजेक्ट विज़न, स्कोप, पीआरडी रिफाइनमेंट और फाउंडर अलाइनमेंट | स्कोप लॉक रखना, गैर-ज़रूरी फीचर्स को v1.2+ में रोकना |
| **UI/UX Designer** | Fluent Dark Horizon डिज़ाइन सिस्टम, वायरफ्रेम्स, कलर टोकन्स और लेआउट | मोबाइल-फर्स्ट (360–430px) यूज़र इंटरफ़ेस तैयार करना |
| **Frontend Developer** | Vanilla HTML5, CSS3 और मॉडर्न ES6+ जावास्क्रिप्ट स्क्रीन बनाना | चैट स्क्रीन, साइडबार, सेटिंग्स और लाइव एक्शन कंपोनेंट्स |
| **Backend Developer** | FastAPI (Python) सर्वर, रेस्टफुल एंडपॉइंट्स, बिजनेस लॉजिक | कैस्केड राउटर, सर्च सर्विस, एक्सपोर्ट सर्विस और रेट लिमिटिंग |
| **Database Engineer** | SQLAlchemy ORM मॉडल्स, Alembic माइग्रेशन, डेटाबेस स्कीमा | यूज़र, सेशन्स, मैसेजेस, फाइल्स और कोटा टेबल्स का प्रबंधन |
| **QA / Test Engineer** | टेस्ट केसेस, एंड-टू-एंड फ्लो, एज केसेस और बग हंटिंग | थंडर क्लाइंट / ऑटोमेटेड टेस्ट्स और फॉलबैक वेरिफिकेशन |
| **DevOps Engineer** | एनवायरनमेंट वैरिएबल्स, डिप्लॉयमेंट पाइपलाइन, क्लाउड होस्टिंग | Vercel (Frontend), Render (Backend), Supabase (PostgreSQL) |
| **Security & Brand Auditor** | ज़ीरो आइडेंटिटी लीकेज, इनपुट सैनिटाइजेशन, RBAC और सीक्रेट्स ऑडिट | ब्रांड सुरक्षा, प्रतिबंधित शब्दों की जाँच और डेटा प्राइवेसी |

---

## 3️⃣ मॉड्यूल्स का बँटवारा (Module Division & Owners)

Rhynia SaaS v1.0 को 8 मुख्य मॉड्यूल्स में विभाजित किया गया है। प्रत्येक मॉड्यूल का एक स्पष्ट ओनर तय है:

| Module # | मॉड्यूल का नाम | विवरण | Primary Owner |
|---|---|---|---|
| **M1** | **Auth & Identity** | Email, Phone OTP, Google OAuth, JWT, प्रोफाइल | Backend + DB Lead |
| **M2** | **Chat & Session Engine** | चैट स्ट्रीम, सेशन CRUD, पिन/रीनेम, हिस्ट्री | Fullstack Lead |
| **M3** | **Cascade LLM Engine** | Tier-1 फ्री, Tier-2 पेड फॉलबैक (HTTP 429), Tier-3 रिज़र्व | Backend / AI Engine Lead |
| **M4** | **Live Search & Discovery** | DuckDuckGo, Google Maps, YouTube Summary, सोशल ट्रेंड्स | Backend Integrator |
| **M5** | **Study & Export Tools** | Notes PDF (`reportlab`) और PPT Slides (`python-pptx`) | Backend Utilities Lead |
| **M6** | **Storage & File Manager** | 500 MB / 5 GB / 25 GB कोटा एनफोर्समेंट, फाइल अपलोड | Backend + DevOps Lead |
| **M7** | **Frontend UI & Screens** | 6 ग्राउंड ट्रुथ स्क्रीन्स, थीम स्विच, PWA कैपेबिलिटी | Frontend Lead |
| **M8** | **Security & Brand Guard** | ज़ीरो लीकेज, इनपुट वैलिडेशन, बैन वर्ड सैनिटाइजर | Security Auditor |

---

## 4️⃣ जिम्मेदारी मैट्रिक्स (Ownership Matrix / RACI)

एक मॉड्यूल पर कई भूमिकाएँ मिलकर कार्य करती हैं:

| कार्य (Task) | Frontend | Backend | Database | QA / Test | Security |
|---|---|---|---|---|---|
| **User Login & OTP** | Auth Modal UI | OTP & JWT API | Users & OTP Table | Flow Test | Token Security |
| **Chat Messaging** | Stream Renderer | Cascade Orchestrator | Messages Table | Fallback Test | Zero Leakage Audit |
| **Live Search** | Search Cards UI | Search Service API | Search Cache | Latency Test | Safe Link Verify |
| **PDF/PPT Export** | Export Buttons UI | Generator Service | Usage Log Table | File Format Test | Plan Permission Gate |
| **File Storage** | Upload & Storage Bar | Upload & Quota API | UserFiles Table | 413 Quota Test | MIME Validation |

---

## 5️⃣ Git Branching रणनीति (Branch Strategy)

कोडिंग शुरू होते ही Git का अनुशासन अनिवार्य रहेगा:

```
                  [main]  (Stable Production Releases Only)
                     ▲
                     │ (Pull Request after QA Approval)
                 [develop] (Integration & Staging Branch)
               ▲     ▲     ▲
               │     │     │
    [feature/auth]   │    [feature/search]
                     │
              [feature/chat-cascade]
```

### शाखा नियम (Branch Rules):
1. **`main`:** सिर्फ़ शत-प्रतिशत टेस्टेड और स्टेबल प्रोडक्शन कोड (कभी सीधा पुश नहीं)।
2. **`develop`:** सभी अप्रूव्ड फीचर्स का मुख्य इंटीग्रेशन पॉइंट।
3. **`feature/<name>`:** अलग-अलग काम के लिए अलग ब्रांच (उदा. `feature/cascade-engine`, `feature/fluent-ui`).
4. **Pull Request (PR) Policy:** कोई भी कोड बिना Code Review और QA पास किए मर्ज नहीं होगा।

---

## 6️⃣ कम्युनिकेशन और रिव्यू नियम (Communication & Review Protocol)

* **Code Reviews:** हर मॉड्यूल पूरा होने पर स्ट्रक्चर, सुरक्षा और परफॉर्मेंस का ऑडिट होगा।
* **Zero Identity Leakage Check:** किसी भी रिस्पॉन्स या कोडबेस में अनधिकृत ब्रांड्स का नाम नहीं होना चाहिए।
* **Founder Approval Gate:** हर प्रमुख माइलस्टोन (Sprint Completion) पर फाउंडर (Rhynia Intelligence) का रिव्यू और अप्रूवल अनिवार्य है।

---

## 7️⃣ डेली स्टैंड-अप फॉर्मेट (Daily Stand-Up / Execution Check)

हर कार्य दिवस या कोडिंग सेशन की शुरुआत में 3 प्रश्नों का स्पष्ट उत्तर होना चाहिए:
1. **कल क्या पूरा किया?** (Previous Tasks Completed)
2. **आज क्या डिलीवर करना है?** (Current Target Tasks)
3. **कहाँ कोई रुकावट या ब्लॉकर है?** (Blockers & Dependencies)

---

## 8️⃣ AI & Sub-Agents के साथ Solo Developer Execution Model

जब अकेला डेवलपर आधुनिक AI एजेंट आर्किटेक्चर के साथ काम करता है, तो विभिन्न **Sub-Agents** को विशिष्ट रोल दिए जाते हैं:

| Sub-Agent Role | Sub-Agent क्या काम करेगा | इस्तेमाल किए जाने वाले टूल्स / दायरा |
|---|---|---|
| 📋 **Product Manager Agent** | टास्क स्प्लिटिंग, प्रायोरिटी तय करना, PRD वेरिफिकेशन | `view_file`, Planning Docs, Backlog |
| 🎨 **UI/UX Designer Agent** | Fluent Dark Horizon CSS टोकन्स, HTML लेआउट स्ट्रक्चर | CSS, HTML5, Viewport 360-430px Audit |
| ⚡ **Backend Engine Agent** | FastAPI रूट्स, कैस्केड फॉलबैक लॉजिक, सर्च व एक्सपोर्ट सर्विसेज | Python, FastAPI, Async HTTP, Pydantic |
| 🗄️ **Database Specialist Agent** | SQLAlchemy टेबल्स, स्कीमा रिलेशंस, इंडेक्सिंग और कोटा क्वैरी | ORM Models, SQLite / Supabase PostgreSQL |
| 🧪 **QA & Test Agent** | एंडपॉइंट्स टेस्ट करना, HTTP 429 फॉलबैक सिमुलेशन, एज केस चेक्स | API Testing, Automated Assertions |
| 🛡️ **Security & Brand Guard Agent** | ज़ीरो लीकेज ऑडिट, टोकन सुरक्षा, सैनिटाइजेशन और बैन वर्ड चेक | Static Code Analysis, Regex Filter |

---

## 9️⃣ स्टेप 3 का निष्कर्ष (Step 3 Verdict)

> **Step 3 APPROVED & LOCKED ✅**  
> अब प्रोजेक्ट में हर मॉड्यूल, उसकी ओनरशिप, रिस्क मैनेजमेंट, ब्रांचिंग मॉडल और Sub-Agents का कार्य-विभाजन स्पष्ट है।  
> **अगला चरण:** Step 4 (UI/UX - संपूर्ण 6 स्क्रीन्स लॉक्ड) → Step 5 (Architecture) → Step 8 (Coding - Founder "START" आदेश पर)।
