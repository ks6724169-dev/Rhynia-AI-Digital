# 📚 राइनिया (Rhynia) — AI Training Syllabus (Official)

> AI ka naam: राइनिया (Rhynia) | Founder: Manish Chaturvedi | Base Model: Qwen3-VL-8B-Instruct | Method: QLoRA + System Prompt
> Ye file AI ke training modules ki master list hai. Har module ka status yahi update hoga.

## 🏆 MASTER ROADMAP (Adhikarik Blueprint)

> **Master document:** `RHYNIA_MASTER_ROADMAP.md` (project root me) — yahi asli master plan hai.
> **Data sources document:** `RHYNIA_DATASET_SOURCES.md` (project root me) — har Step/Topic ke verified data sources ka catalog (NASA, OpenStax, NCBI, Allen Brain, SWE-bench, The Stack v2, OSWorld adi).
> **Acquisition Protocol:** MinHash dedup + perplexity filter, JSONL harmonization (`{"messages": [...]}`), PII scrubbing, license compliance (MIT/Apache 2.0/CC).
> Purane module code (A-K) neeche reference ke liye rakhe hain; master roadmap ke Steps hi adhikarik hain.

| Step | Milestone | Focus | Dataset Volume | Status |
|---|---|---|---|---|
| **01** | Core Foundation & Identity | Identity transformation, persona, tone, zero-leakage, anti-jailbreak | 10,000 pairs (Part 1) | ⭐ **ABHI YAHIN HAIN** |
| **02** | Multimodal Creative Orchestrator | Image gen direction, video orchestration, JSON tool-calling | 5,000–10,000 | NOT STARTED |
| **03** | Deep Domain Scientist & Author | Textbook authoring, Astronomy, DNA/Genomics, Neuroscience, Law/Defence | 27,000–44,000 | NOT STARTED |
| **04** | Autonomous Agent & Robotics | Computer-use, ROS, VLA robotics | 14,000–22,000 | NOT STARTED |
| **05** | Software/Web/Mobile Engineering | Full-stack, mobile apps, SWE-bench patches | 10,000–15,000 | NOT STARTED |

**Total (poora Rhynia Frontier Model): 66,000–109,000 pairs**

### ✅ Jo ho chuka hai (is project me):
- v1.0 demo training (6 examples, Kaggle T4) ✅ — pipeline proof
- Identity files + system prompt ✅
- Starter dataset (54 pairs) ban raha hai — Step 01 ka shuruaat ✅

### 🎯 Step 01 dataset breakdown (master doc ke anusaar):
- 2,500: Origin & Architectural Grounding
- 2,000: Anti-Sycophancy & Epistemic Calibration
- 2,000: First-Principles & Scientific Epistemology
- 1,800: Character Poise & Emotional Calibration
- 1,700: Multi-Turn Contextual Persistence (5–10 turn dialogues)
- Part 2: Adversarial Hardening & Anti-Jailbreak — agli phase me size hoga

**Founder ka nirdesh:** Qwen ki Hindi pehle se achhi hai — isliye language-fluency wale slots NAHI; sirf identity, goal aur style par training (Bhasha Mirror Rule system prompt + data dono me maintain hogi).

---

## 🗂️ PURANE MODULES (Legacy reference — master roadmap me merge kiye gaye)

## 🎯 Module 5 Sabse Pehle: Response Style (Saral Aur Swabhavik Jawab)

Har jawab **saral, swabhavik aur seedha** hoga — koi fixed 5-step format NAHI
(Founder ke nirdesh par rigid response structure hataya gaya).

- Prashn chhota ho to uttar chhota; vishay bada ho to vyavasthit uttar
- Zarurat pade to heading, points ya table ka prayog (ye niyam nahi, suvidha hai)
- Koi bhar-bharkam "Introduction / Nishkarsh / Sujhav" wala thopda format nahi
- Image (Module G judne ke baad): prasangik uttar me relatable image bhi jayegi

---

## 🟢 TIER 1: Pehle Banenge (Core Product)

### Module A: Notes Master (Student Feature) ⭐⭐⭐
- PDF/PPT/photo se notes, summary, MCQ, exam questions
- Data: 3,000-10,000 examples | Status: NOT STARTED

### Module B: Response Style Training ⭐⭐
- Saral aur swabhavik jawab (rigid 5-step format NAHI)
- Data: 1,000-2,000 examples | Status: NOT STARTED

### Module C: Coding/Website/UI-UX Helper ⭐⭐
- Developers ke liye (Revenue Raasta #1)
- Data: 2,000-5,000 examples | Status: NOT STARTED

---

## 🟡 TIER 2: Text-Based Skills (Fine-tune se)

### Module D: Indian Law Knowledge
- Constitution, IPC/CrPC basics, business law
- Pehle se kuch jaanta hai — sirf India-specific depth add karni hai

### Module E: AI Ethics + Safety
- Rules, limits, safe responses | Data: 500-1,000 examples

### Module F: Science/Space/Medical Depth
- General science model pehle se jaanta hai
- Advanced depth: RAG (documents feed) se hoga, fine-tune se nahi

---

## 🔴 TIER 3: Separate Models (Ye Qwen3-VL me NAHI aate — alag models hain)

### Module G: Image Generation 🖼️
- Alag model: Flux / Stable Diffusion (T4 pe chalega)
- Qwen3-VL sirf usko instruction dega

### Module H: Video Generation 🎬
- Alag model: Wan2.1 (30-sec videos, heavy)
- Baad me add hoga

### Module I: Document/Book Generation 📄
- Ye VL model + templates se hoga (python-pptx, reportlab)
- Alag training nahi — code pipeline hai

### Module J: Computer Control 🖥️
- PyAutoGUI + agent framework (PDF ka plan)
- Command→action data: 1,000-2,000 examples

### Module K: Defence/Cyber Intelligence 🔒
- General knowledge model me hai
- Deep cyber skills: alag specialized training (baad me, legal boundaries me)

---

## 📊 Training Order (Execution Plan)

```
1. System Prompt test (bina training, ₹0, 1 din)
2. Module B (Response Style) — sabse pehle fine-tune
3. Module A (Notes Master) — main product
4. Module C (Coding Helper) — second product
5. Modules D+E (Law+Ethics) — mix me
6. Module G (Image Gen) — alag model
7. Modules H+J (Video+Computer) — baad me
```

---

## ➕ ADD-ON क्षेत्र (Founder ke nirdesh par juda gaya)

### Module L: Defence / रक्षा क्षेत्र 🛡️
- सेना की ताकत, स्मार्ट निगरानी (smart surveillance), ड्रोन और साइबर सुरक्षा में AI की ट्रेनिंग
- Status: NOT STARTED

### Module M: DNA / जेनेटिक्स 🧬
- डीएनए म्यूटेशन की पहचान, सिंथेटिक डीएनए बनाने और जीन एडिटिंग (CRISPR) में AI के उपयोग
- Status: NOT STARTED

### Module N: Space & Astronomy / अंतरिक्ष विज्ञान 🚀
- नए ग्रहों की खोज, गैलेक्सीज के वर्गीकरण, ब्लैक होल की इमेजिंग और मार्स रोवर की ऑपरेशन (navigation/operations) में AI का उपयोग
- Status: NOT STARTED

### Module O: Neurons / न्यूरोसाइंस 🧠
- दिमाग की सोच को पढ़ने, ब्रेन-कंप्यूटर इंटरफेस (BCI) और दिमागी बीमारियों के पहले से पता लगाने (early detection) में AI की ट्रेनिंग
- Status: NOT STARTED
