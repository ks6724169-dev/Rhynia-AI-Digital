"""
Rhynia Intelligence SaaS — Educational Image Retrieval Service
Searches Wikimedia Commons and open educational scientific archives for high-res diagrams.
Provides instant visual grounding for Biology, Anatomy, Physics, Chemistry, Botany & Astronomy.
Supports Multi-Aspect Diagram Retrieval (up to 5-6 comprehensive diagrams per topic).
"""

import asyncio
import logging
import re
import urllib.parse
from typing import Dict, List, Optional
import httpx

logger = logging.getLogger("rhynia.image_search")

# Extensive mapping of educational concepts (Hinglish, Hindi, English) to high-precision diagram search terms
CONCEPT_MAP: Dict[str, str] = {
    # Botany & Plant Biology
    "photosynthesis": "photosynthesis diagram",
    "prakash sanshleshan": "photosynthesis diagram",
    "प्रकाश संश्लेषण": "photosynthesis diagram",
    "प्रकाशसंश्लेषण": "photosynthesis diagram",
    "plant cell": "plant cell structure diagram",
    "पादप कोशिका": "plant cell structure diagram",
    "chloroplast": "chloroplast diagram",
    "क्लोरोप्लास्ट": "chloroplast diagram",
    "हरित लवक": "chloroplast diagram",
    "stomata": "stoma plant diagram",
    "रंध्र": "stoma plant diagram",
    "leaf anatomy": "leaf anatomy structure diagram",
    "leaf structure": "leaf anatomy structure diagram",
    "पत्ती की संरचना": "leaf anatomy structure diagram",
    "xylem": "xylem phloem plant diagram",
    "phloem": "xylem phloem plant diagram",
    "जाइलम": "xylem phloem plant diagram",
    "फ्लोएम": "xylem phloem plant diagram",
    "flower anatomy": "flower anatomy structure diagram",
    "फूल की संरचना": "flower anatomy structure diagram",
    "root anatomy": "root plant anatomy diagram",

    # Cell Biology & Genetics
    "cell biology": "cell structure diagram",
    "animal cell": "animal cell structure diagram",
    "जंतु कोशिका": "animal cell structure diagram",
    "कोशिका": "cell structure diagram",
    "mitochondria": "mitochondrion diagram",
    "mitochondrion": "mitochondrion diagram",
    "माइटोकॉन्ड्रिया": "mitochondrion diagram",
    "dna": "DNA structure diagram",
    "डीएनए": "DNA structure diagram",
    "rna": "RNA structure diagram",
    "ribosome": "ribosome structure diagram",
    "endoplasmic reticulum": "endoplasmic reticulum diagram",
    "golgi": "golgi apparatus diagram",
    "chromosome": "chromosome structure diagram",
    "गुणसूत्र": "chromosome structure diagram",
    "mitosis": "mitosis stages diagram",
    "meiosis": "meiosis stages diagram",

    # Human Anatomy & Physiology
    "human heart": "human heart diagram",
    "heart": "human heart diagram",
    "हृदय": "human heart diagram",
    "दिल": "human heart diagram",
    "human brain": "human brain diagram",
    "brain": "human brain diagram",
    "मस्तिष्क": "human brain diagram",
    "दिमाग": "human brain diagram",
    "neuron": "neuron diagram",
    "तंत्रिका": "neuron diagram",
    "human eye": "human eye anatomy diagram",
    "eye anatomy": "human eye anatomy diagram",
    "आँख": "human eye anatomy diagram",
    "human ear": "human ear anatomy diagram",
    "कान": "human ear anatomy diagram",
    "digestive system": "human digestive system diagram",
    "पाचन तंत्र": "human digestive system diagram",
    "respiratory system": "human respiratory system diagram",
    "श्वसन तंत्र": "human respiratory system diagram",
    "lungs": "human lungs diagram",
    "फेफड़े": "human lungs diagram",
    "circulatory system": "human circulatory system diagram",
    "रक्त परिसंचरण तंत्र": "human circulatory system diagram",
    "nervous system": "human nervous system diagram",
    "तंत्रिका तंत्र": "human nervous system diagram",
    "kidney": "human kidney diagram",
    "nephron": "nephron kidney diagram",
    "गुर्दा": "human kidney diagram",
    "वृक्क": "human kidney diagram",
    "skeleton": "human skeleton diagram",
    "कंकाल": "human skeleton diagram",
    "liver": "human liver anatomy diagram",
    "यकृत": "human liver anatomy diagram",

    # Physics & Chemistry
    "atom": "atom structure diagram",
    "परमाणु": "atom structure diagram",
    "periodic table": "periodic table diagram",
    "आवर्त सारणी": "periodic table diagram",
    "electromagnetic spectrum": "electromagnetic spectrum diagram",
    "प्रकाश का अपवर्तन": "refraction light diagram",
    "refraction": "refraction diagram",
    "reflection": "reflection light diagram",
    "electric circuit": "electric circuit diagram",
    "विद्युत परिपथ": "electric circuit diagram",

    # Botany & Plant Biology (Leaf, Stoma, Xylem, Chloroplast)
    "leaf anatomy": "leaf anatomy cross section diagram",
    "leaf structure": "leaf anatomy cross section diagram",
    "leaf": "leaf anatomy cross section diagram",
    "leaves": "leaf anatomy cross section diagram",
    "patti": "leaf anatomy cross section diagram",
    "पत्ती": "leaf anatomy cross section diagram",
    "पत्ते": "leaf anatomy cross section diagram",

    # Geography & Earth Science
    "water cycle": "water cycle diagram",
    "जल चक्र": "water cycle diagram",
    "carbon cycle": "carbon cycle diagram",
    "nitrogen cycle": "nitrogen cycle diagram",
    "solar system": "solar system diagram",
    "सौर मंडल": "solar system diagram",
    "earth structure": "internal structure of earth diagram",
    "earth's internal structure": "internal structure of earth diagram",
    "internal structure of earth": "internal structure of earth diagram",
    "earrth": "internal structure of earth diagram",
    "earth": "internal structure of earth diagram",
    "पृथ्वी की आंतरिक संरचना": "internal structure of earth diagram",
    "पृथ्वी की संरचना": "internal structure of earth diagram",
    "पृथ्वी": "internal structure of earth diagram",
    "prithvi": "internal structure of earth diagram",
    "layers of earth": "internal structure of earth diagram",
    "volcano": "volcano diagram",
    "ज्वालामुखी": "volcano diagram",
    "food chain": "food chain ecosystem diagram",
    "खाद्य श्रृंखला": "food chain ecosystem diagram"
}

# Multi-aspect subtopics mapping for comprehensive scientific breakdowns (4 to 6 diagrams)
CONCEPT_SUBTOPICS: Dict[str, List[str]] = {
    "photosynthesis": [
        "photosynthesis diagram",
        "plant cell structure diagram",
        "chloroplast structure diagram",
        "calvin cycle diagram",
        "leaf anatomy cross section diagram",
        "stoma plant diagram"
    ],
    "prakash sanshleshan": [
        "photosynthesis diagram",
        "plant cell structure diagram",
        "chloroplast structure diagram",
        "calvin cycle diagram",
        "leaf anatomy cross section diagram",
        "stoma plant diagram"
    ],
    "प्रकाश संश्लेषण": [
        "photosynthesis diagram",
        "plant cell structure diagram",
        "chloroplast structure diagram",
        "calvin cycle diagram",
        "leaf anatomy cross section diagram",
        "stoma plant diagram"
    ],
    "प्रकाशसंश्लेषण": [
        "photosynthesis diagram",
        "plant cell structure diagram",
        "chloroplast structure diagram",
        "calvin cycle diagram",
        "leaf anatomy cross section diagram",
        "stoma plant diagram"
    ],
    "plant cell": [
        "plant cell structure diagram",
        "chloroplast structure diagram",
        "cell wall membrane plant diagram",
        "plant cell vacuole diagram",
        "photosynthesis diagram"
    ],
    "पादप कोशिका": [
        "plant cell structure diagram",
        "chloroplast structure diagram",
        "cell wall membrane plant diagram",
        "plant cell vacuole diagram"
    ],
    "animal cell": [
        "animal cell structure diagram",
        "mitochondrion diagram",
        "cell nucleus DNA diagram",
        "endoplasmic reticulum golgi diagram",
        "ribosome structure diagram"
    ],
    "जंतु कोशिका": [
        "animal cell structure diagram",
        "mitochondrion diagram",
        "cell nucleus DNA diagram",
        "endoplasmic reticulum golgi diagram"
    ],
    "cell": [
        "plant cell structure diagram",
        "animal cell structure diagram",
        "mitochondrion diagram",
        "cell nucleus DNA diagram",
        "cell membrane structure diagram"
    ],
    "कोशिका": [
        "plant cell structure diagram",
        "animal cell structure diagram",
        "mitochondrion diagram",
        "cell nucleus DNA diagram",
        "cell membrane structure diagram"
    ],
    "heart": [
        "human heart diagram",
        "heart blood flow circulation diagram",
        "cardiac conduction system diagram",
        "human circulatory system diagram",
        "heart valves diagram"
    ],
    "हृदय": [
        "human heart diagram",
        "heart blood flow circulation diagram",
        "cardiac conduction system diagram",
        "human circulatory system diagram",
        "heart valves diagram"
    ],
    "brain": [
        "human brain anatomy diagram",
        "neuron structure diagram",
        "human nervous system diagram",
        "brain lobes cerebellum diagram",
        "synapse neurotransmitter diagram"
    ],
    "मस्तिष्क": [
        "human brain anatomy diagram",
        "neuron structure diagram",
        "human nervous system diagram",
        "brain lobes cerebellum diagram",
        "synapse neurotransmitter diagram"
    ],
    "दिमाग": [
        "human brain anatomy diagram",
        "neuron structure diagram",
        "human nervous system diagram",
        "brain lobes cerebellum diagram",
        "synapse neurotransmitter diagram"
    ],
    "dimag": [
        "human brain anatomy diagram",
        "neuron structure diagram",
        "human nervous system diagram",
        "brain lobes cerebellum diagram",
        "synapse neurotransmitter diagram"
    ],
    "digestive system": [
        "human digestive system diagram",
        "stomach anatomy diagram",
        "human liver digestive diagram",
        "small intestine villi diagram",
        "digestive tract human diagram"
    ],
    "पाचन तंत्र": [
        "human digestive system diagram",
        "stomach anatomy diagram",
        "human liver digestive diagram",
        "small intestine villi diagram"
    ],
    "respiratory system": [
        "human respiratory system diagram",
        "human lungs alveoli diagram",
        "diaphragm breathing mechanism diagram",
        "trachea bronchi lungs diagram"
    ],
    "श्वसन तंत्र": [
        "human respiratory system diagram",
        "human lungs alveoli diagram",
        "diaphragm breathing mechanism diagram"
    ],
    "water cycle": [
        "water cycle diagram",
        "evaporation precipitation water cycle diagram",
        "groundwater hydrological cycle diagram"
    ],
    "जल चक्र": [
        "water cycle diagram",
        "evaporation precipitation water cycle diagram",
        "groundwater hydrological cycle diagram"
    ],
    "solar system": [
        "solar system planets diagram",
        "earth orbit seasons diagram",
        "inner and outer planets solar system diagram",
        "moon phases diagram"
    ],
    "सौर मंडल": [
        "solar system planets diagram",
        "earth orbit seasons diagram",
        "inner and outer planets solar system diagram"
    ],
    "atom": [
        "atom structure diagram",
        "bohr model atom diagram",
        "electron shell orbital diagram",
        "periodic table diagram"
    ],
    "परमाणु": [
        "atom structure diagram",
        "bohr model atom diagram",
        "electron shell orbital diagram"
    ],
    "earth": [
        "internal structure of earth diagram",
        "Earth Internal Structure diagram",
        "layers of earth crust mantle core diagram",
        "plate tectonics diagram"
    ],
    "earrth": [
        "internal structure of earth diagram",
        "Earth Internal Structure diagram",
        "layers of earth crust mantle core diagram"
    ],
    "पृथ्वी": [
        "internal structure of earth diagram",
        "Earth Internal Structure diagram",
        "layers of earth crust mantle core diagram"
    ],
    "prithvi": [
        "internal structure of earth diagram",
        "Earth Internal Structure diagram",
        "layers of earth crust mantle core diagram"
    ],
    "leaf": [
        "leaf anatomy cross section diagram",
        "leaf diagram",
        "stoma plant diagram",
        "chloroplast diagram"
    ],
    "पत्ती": [
        "leaf anatomy cross section diagram",
        "leaf diagram",
        "stoma plant diagram"
    ],
    "patti": [
        "leaf anatomy cross section diagram",
        "leaf diagram",
        "stoma plant diagram"
    ]
}


class EducationalImageService:
    """Retrieves verified open-access educational diagrams (biology, physics, chemistry, anatomy, astronomy)."""

    def __init__(self):
        self.api_url = "https://commons.wikimedia.org/w/api.php"
        self.headers = {"User-Agent": "RhyniaIntelligence/1.0 (https://rhynia.com; contact@rhynia.com)"}

    @staticmethod
    def clean_wikimedia_url(url: str) -> str:
        """Sanitize any hallucinated or malformed Wikimedia thumb URLs into canonical direct links."""
        if not url:
            return ""
        if "/wikipedia/commons/thumb/" in url:
            parts = url.split("/wikipedia/commons/thumb/")[1].split("/")
            if len(parts) >= 3:
                return f"https://upload.wikimedia.org/wikipedia/commons/{parts[0]}/{parts[1]}/{parts[2]}"
        return url

    @staticmethod
    def _matches_concept(concept_key: str, text: str) -> bool:
        """Check if concept matches as a whole word (for Latin) or substring (for Devanagari)."""
        if re.search(r"[a-zA-Z]", concept_key):
            return bool(re.search(rf"\b{re.escape(concept_key)}\b", text))
        return concept_key in text

    def extract_subject(self, query: str) -> Optional[str]:
        """Extract the core educational topic from user prompt (supporting English, Hindi, Hinglish)."""
        low = query.lower().strip()
        # Automatic spelling normalization for common typos
        low = re.sub(r"\bearrth\b", "earth", low)
        low = re.sub(r"\bstructur\b", "structure", low)

        # 1. Direct concept mapping check (sorted by key length descending)
        for concept_key in sorted(CONCEPT_MAP.keys(), key=len, reverse=True):
            if self._matches_concept(concept_key, low):
                return CONCEPT_MAP[concept_key]

        # 2. Check if the user is asking for a diagram or explanation of a scientific noun
        visual_triggers = [
            "diagram", "structure", "anatomy", "illustration", "figure", "drawing",
            "image", "photo", "picture", "chart", "चित्र", "डायग्राम", "संरचना", "फोटो", "नक्शा"
        ]
        has_visual_trigger = any(t in low for t in visual_triggers)

        # 3. Clean query by stripping conversational filler words
        cleaned = re.sub(
            r"(?i)\b(ko|ka|ki|ke|kya|hai|karo|samjhao|explain|in|detail|batao|please|dikhao|draw|give|me|about|what|is|how|does|work|the|a|an|with|diagram|chitra|chitr|picture|image|o)\b",
            " ",
            query
        )
        cleaned = re.sub(r"[^\w\s]", " ", cleaned).strip()

        # If a visual trigger was explicitly requested, or cleaned query has a substantial educational keyword
        if has_visual_trigger and len(cleaned) > 2:
            return f"{cleaned} diagram"
        elif len(cleaned) > 3 and any(w in low for w in ["cycle", "system", "cell", "organ", "structure", "तंत्र"]):
            return f"{cleaned} diagram"

        return None

    async def search_diagrams(self, query: str, limit: int = 2) -> List[Dict[str, str]]:
        """Search Wikimedia Commons for high-quality educational diagrams and illustrations."""
        clean_q = query.strip()
        if not clean_q:
            return []

        search_query = clean_q
        if "diagram" not in search_query.lower():
            search_query = f"{search_query} diagram"

        params = {
            "action": "query",
            "generator": "search",
            "gsrsearch": search_query,
            "gsrnamespace": 6,  # File: namespace only
            "gsrlimit": limit * 4,
            "prop": "imageinfo",
            "iiprop": "url|mime",
            "format": "json",
        }

        results: List[Dict[str, str]] = []
        try:
            async with httpx.AsyncClient(timeout=4.5) as client:
                res = await client.get(self.api_url, params=params, headers=self.headers)
                if res.status_code == 200:
                    data = res.json()
                    pages = data.get("query", {}).get("pages", {})
                    candidates = []

                    for pid, p in pages.items():
                        info = p.get("imageinfo", [{}])[0]
                        img_url = info.get("url", "")
                        if not img_url:
                            continue

                        clean_url = self.clean_wikimedia_url(img_url)
                        clean_path = clean_url.split("?")[0].lower()
                        # Only accept high-quality graphic formats
                        if any(clean_path.endswith(ext) for ext in [".svg", ".png", ".jpg", ".jpeg", ".webp"]):
                            raw_title = p.get("title", "").replace("File:", "")
                            title = raw_title.replace("_", " ").rsplit(".", 1)[0]

                            # Prioritize English/Neutral diagrams, deprioritize other languages if possible
                            title_lower = title.lower()
                            score = 0
                            if "-en" in title_lower or "_en" in title_lower or "english" in title_lower:
                                score += 10
                            if any(lang in title_lower for lang in ["-fa", "-fr", "-de", "-ar", "-es", "-zh", "-ru"]):
                                score -= 5
                            if "diagram" in title_lower or "structure" in title_lower:
                                score += 5

                            if len(title) > 3:
                                candidates.append({
                                    "title": title,
                                    "url": clean_url,
                                    "score": score
                                })

                    # Sort by relevance score descending
                    candidates.sort(key=lambda x: x["score"], reverse=True)

                    for c in candidates:
                        results.append({
                            "title": c["title"],
                            "url": c["url"],
                        })
                        if len(results) >= limit:
                            break

        except Exception as e:
            logger.warning(f"Wikimedia educational image search error for '{query}': {e}")

        # Smart fallback if multi-word query returned 0 results
        if not results:
            tokens = [w for w in clean_q.lower().split() if len(w) > 3 and w not in ["diagram", "structure", "internal", "external", "system", "about"]]
            for t in tokens:
                fallback_q = f"{t} diagram"
                if fallback_q != search_query:
                    try:
                        fallback_res = await self.search_diagrams(fallback_q, limit=limit)
                        if fallback_res:
                            return fallback_res
                    except Exception:
                        pass

        return results[:limit]

    async def search_universal_images(self, query: str, limit: int = 3) -> List[Dict[str, str]]:
        """
        Universal Visual Grounding:
        Searches English and Hindi Wikipedia + Wikimedia Commons for authentic, high-res images
        of entities: People, Historical Figures, Deities, Characters, TV Shows, Movies,
        Products, Technology, Monuments, and Places.
        """
        # Remove conversational filler words (Latin and Devanagari)
        clean_q = re.sub(
            r"(?i)\b(ko|ka|ki|ke|kya|hai|hain|karo|samjhao|explain|in|detail|batao|bataiye|please|dikhao|dikhaiye|draw|give|me|about|what|is|how|does|work|the|a|an|with|diagram|chitra|chitr|picture|photo|photos|image|images|art|wallpapers?)\b|(?:\b|\s)(?:के\s+बारे\s+में|बताओ|बताइए|दिखाओ|दिखाइए|समझाओ|और|भी|का|की|के|को|क्या|है|हैं|चित्र|तस्वीर|फोटो|डायग्राम|सचित्र|विस्तार\s+से|जी)(?:\b|\s)",
            " ",
            f" {query} "
        )
        clean_q = re.sub(r"[^\w\s]", " ", clean_q).strip()
        clean_q = re.sub(r"\s+", " ", clean_q)
        if not clean_q:
            clean_q = query.strip()

        search_terms = [clean_q]
        low = f"{clean_q} {query}".lower()
        if any(c in low for c in ["chandrayaan", "चंद्रयान", "चन्द्रयान"]):
            search_terms = ["Chandrayaan-3", "Chandrayaan-2", "ISRO"]
        elif any(t in low for t in ["taj mahal", "ताजमहल", "ताज महल"]):
            search_terms = ["Taj Mahal", "Agra Taj Mahal"]
        elif any(r in low for r in ["red fort", "लाल किला", "लालकिला"]):
            search_terms = ["Red Fort", "Lal Qila Delhi"]
        elif any(q in low for q in ["qutub minar", "कुतुब मीनार", "कुतुबमीनार"]):
            search_terms = ["Qutb Minar", "Qutub Minar"]
        elif any(e in low for e in ["eiffel", "एफिल", "एफिल टॉवर", "एफिल टावर"]):
            search_terms = ["Eiffel Tower"]
        elif any(s in low for s in ["solar system", "सौर मंडल", "सौरमंडल"]):
            search_terms = ["Solar System"]
        elif any(b in low for b in ["black hole", "ब्लैक होल", "ब्लैकहोल"]):
            search_terms = ["Black hole"]
        elif any(r in low for r in ["lord ram", "ram ji", "shri ram", "rama", "bhagwan ram", "श्री राम", "राम जी", "भगवान राम", "श्रीराम", "राम"]):
            search_terms = ["Rama", "Lord Rama", "Ram Mandir", "Ayodhya Ram"]
        elif any(s in low for s in ["shaktimaan", "shaktiman", "शक्तिमान"]):
            search_terms = ["Shaktimaan", "Mukesh Khanna"]
        elif any(m in low for m in ["modi", "मोदी"]):
            search_terms = ["Narendra Modi"]
        elif any(g in low for g in ["gandhi", "गांधी"]):
            search_terms = ["Mahatma Gandhi"]
        elif any(k in low for k in ["krishna", "कृष्ण"]):
            search_terms = ["Krishna", "Lord Krishna"]
        elif any(s in low for s in ["shiva", "shiv", "शिव", "भोलेनाथ"]):
            search_terms = ["Shiva", "Lord Shiva"]

        results: List[Dict[str, str]] = []
        seen_urls = set()

        domains = ["en.wikipedia.org", "hi.wikipedia.org"]

        async with httpx.AsyncClient(timeout=4.5) as client:
            for term in search_terms:
                if len(results) >= limit:
                    break
                for dom in domains:
                    if len(results) >= limit:
                        break
                    url = f"https://{dom}/w/api.php"
                    params = {
                        "action": "query",
                        "generator": "search",
                        "gsrsearch": term,
                        "gsrlimit": limit * 2,
                        "prop": "pageimages",
                        "pithumbsize": 1000,
                        "format": "json"
                    }
                    try:
                        res = await client.get(url, params=params, headers=self.headers)
                        if res.status_code == 200:
                            data = res.json()
                            pages = data.get("query", {}).get("pages", {})
                            for pid, p in pages.items():
                                title = p.get("title", "")
                                title_l = title.lower()
                                # Filter out obvious unrelated collisions
                                if any(x in title_l for x in ["edi rama", "rama duwaji", "gurmeet ram", "devanagari", "देवनागरी", "bengali", "संयुक्ताक्षर", "वर्णमाला"]):
                                    continue
                                thumb = p.get("thumbnail", {}).get("source", "")
                                if thumb:
                                    cu = self.clean_wikimedia_url(thumb)
                                    u_base = cu.split("?")[0].lower()
                                    if u_base not in seen_urls and any(u_base.endswith(ext) for ext in [".jpg", ".jpeg", ".png", ".svg", ".webp"]):
                                        seen_urls.add(u_base)
                                        results.append({
                                            "title": title or term,
                                            "url": cu
                                        })
                                        if len(results) >= limit:
                                            break
                    except Exception as e:
                        logger.warning(f"Universal image search error for '{term}' on {dom}: {e}")

        # Fallback to direct Wikimedia Commons image search (without forcing 'diagram')
        if not results:
            try:
                async with httpx.AsyncClient(timeout=4.5) as client:
                    params = {
                        "action": "query",
                        "generator": "search",
                        "gsrsearch": clean_q,
                        "gsrnamespace": 6,
                        "gsrlimit": limit * 2,
                        "prop": "imageinfo",
                        "iiprop": "url|mime",
                        "format": "json",
                    }
                    res = await client.get(self.api_url, params=params, headers=self.headers)
                    if res.status_code == 200:
                        pages = res.json().get("query", {}).get("pages", {})
                        for pid, p in pages.items():
                            info = p.get("imageinfo", [{}])[0]
                            img_url = info.get("url", "")
                            if img_url:
                                clean_u = self.clean_wikimedia_url(img_url)
                                u_base = clean_u.split("?")[0].lower()
                                if u_base not in seen_urls and any(u_base.endswith(ext) for ext in [".jpg", ".jpeg", ".png", ".svg", ".webp"]):
                                    seen_urls.add(u_base)
                                    raw_title = p.get("title", "").replace("File:", "").replace("_", " ").rsplit(".", 1)[0]
                                    results.append({"title": raw_title, "url": clean_u})
                                    if len(results) >= limit:
                                        break
            except Exception as e:
                logger.warning(f"Wikimedia general fallback search error for '{clean_q}': {e}")

        return results[:limit]

    def is_visual_worthy_query(self, query: str) -> bool:
        """
        Gatekeeper: Determines if a user query actually calls for images or diagrams.
        Strictly blocks image retrieval on exam preparation, advice, coding, math, greetings, or text-first topics.
        """
        if not query or not query.strip():
            return False

        low = query.lower().strip()

        # 1. Non-visual intent blockers: Questions about study, exams, prep, advice, coding, recipes, tips
        non_visual_blockers = [
            "taiyaari", "tayari", "prepare", "preparation", "upsc", "ias", "ips", "ssc", "exam", "exams",
            "syllabus", "notes", "strategy", "kaise kare", "kaise karein", "kaise padhe", "kaise padhein",
            "kaise sikhe", "kaise sikhein", "study plan", "tips", "how to", "guide", "routine",
            "time table", "interview", "resume", "python", "javascript", "code", "coding", "program",
            "function", "syntax", "debug", "error", "meaning", "arth", "paribhasha", "definition",
            "essay", "nibandh", "letter", "patra", "poem", "kavita", "shayari", "story", "kahani",
            "joke", "chutkula", "solve", "math", "hisab", "calculate"
        ]

        # Explicit visual requests (e.g. "photo", "diagram", "chitra", "tasveer")
        explicit_visual_words = [
            "photo", "photos", "image", "images", "pic", "pics", "picture", "pictures",
            "diagram", "diagrams", "flowchart", "chitra", "chitr", "tasveer", "tasveerein",
            "naksha", "map", "चित्र", "तस्वीर", "तस्वीरें", "फोटो", "डायग्राम", "नक्शा",
            "दिखाओ", "दिखाइए", "बनाओ", "draw", "look like", "kaisa dikhta", "kaisi dikhti"
        ]
        has_explicit_visual = any(re.search(rf"\b{re.escape(w)}\b", low) for w in explicit_visual_words)

        # If user explicitly asked for a photo/diagram, allow it!
        if has_explicit_visual:
            return True

        # If user did NOT ask for a visual, but query contains study/exam/prep/code blockers, strictly block!
        if any(re.search(rf"\b{re.escape(b)}\b", low) for b in non_visual_blockers):
            return False

        # 2. Check if query matches a known STEM concept where visual diagram is standard (e.g. Photosynthesis, Heart, Brain, Cell)
        for concept_key in CONCEPT_MAP.keys():
            if re.search(r"[a-zA-Z]", concept_key):
                if re.search(rf"\b{re.escape(concept_key)}\b", low):
                    return True
            elif concept_key in low:
                return True

        for concept_key in CONCEPT_SUBTOPICS.keys():
            if re.search(r"[a-zA-Z]", concept_key):
                if re.search(rf"\b{re.escape(concept_key)}\b", low):
                    return True
            elif concept_key in low:
                return True

        # 3. Recognizable real-world entities, space missions, monuments, geography & astronomy
        entity_visual_topics = [
            "chandrayaan", "mangalyaan", "isro", "nasa", "apollo", "james webb", "hubble",
            "चंद्रयान", "मंगलयान", "इसरो", "नासा", "सौर मंडल", "solar system", "black hole", "ब्लैक होल",
            "taj mahal", "ताजमहल", "red fort", "लाल किला", "qutub minar", "कुतुब मीनार",
            "eiffel tower", "एफिल टॉवर", "pyramid", "पिरामिड", "hawa mahal", "हवा महल",
            "india gate", "इंडिया गेट", "statue of unity", "स्टैच्यू ऑफ यूनिटी",
            "mount everest", "everest", "एवरेस्ट", "himalaya", "himalayas", "हिमालय",
            "volcano", "ज्वालामुखी", "water cycle", "जल चक्र", "carbon cycle", "nitrogen cycle",
            "solar eclipse", "सूर्य ग्रहण", "lunar eclipse", "चंद्र ग्रहण", "rainbow", "इंद्रधनुष",
            "telescope", "दूरबीन", "satellite", "उपग्रह", "rover", "रोवर", "vikram lander", "प्रज्ञान", "pragyan"
        ]
        low_compact = re.sub(r"\s+", "", low)
        for topic in entity_visual_topics:
            topic_compact = re.sub(r"\s+", "", topic)
            if re.search(r"[a-zA-Z]", topic):
                if re.search(rf"\b{re.escape(topic)}\b", low) or topic_compact in low_compact:
                    return True
            elif topic in low or topic_compact in low_compact:
                return True

        # By default, do NOT pollute answers with random images
        return False

    async def search_smart_diagrams(self, query: str, default_limit: int = 5) -> List[Dict[str, str]]:
        """
        Dynamically retrieves 1 to 6 diagrams or verified entity images.
        Strictly activates ONLY when query has genuine visual intent.
        """
        if not self.is_visual_worthy_query(query):
            return []

        low = query.lower()
        low = re.sub(r"\bearrth\b", "earth", low)
        low = re.sub(r"\bstructur\b", "structure", low)

        # Check if user specifically asks for multiple or detailed diagrams
        wants_multiple = any(k in low for k in [
            "5-6", "5", "6", "multiple", "all", "sabhi", "saare", "images", "photos",
            "diagrams", "तस्वीर", "चित्र", "डायग्राम", "फोटो", "detail", "detailed", "acche se",
            "pura", "step by step", "विस्तार", "गहराई"
        ])

        # Check if user explicitly asked for Pinterest
        prefer_pinterest = any(w in low for w in ["pinterest", "पिनट्रेस्ट", "पिनटेरेस्ट"])
        if prefer_pinterest:
            p_images = await self.search_web_and_pinterest_images(query, limit=default_limit if wants_multiple else 3)
            if p_images:
                return p_images

        # 1. Check if query matches a rich concept subtopics mapping (STEM)
        for concept_key in sorted(CONCEPT_SUBTOPICS.keys(), key=len, reverse=True):
            if self._matches_concept(concept_key, low):
                target_count = default_limit if wants_multiple else 3
                tasks = [self.search_diagrams(sub, limit=1) for sub in CONCEPT_SUBTOPICS[concept_key][:target_count + 1]]
                results = await asyncio.gather(*tasks)
                flat = [img for r in results for img in r]

                seen_urls = set()
                unique: List[Dict[str, str]] = []
                for item in flat:
                    clean_u = item["url"].split("?")[0].lower()
                    if clean_u not in seen_urls:
                        seen_urls.add(clean_u)
                        unique.append(item)
                    if len(unique) >= target_count:
                        break
                if unique:
                    return unique

        # 2. Check single concept extract (STEM diagrams)
        extracted = self.extract_subject(query)
        if extracted:
            limit = default_limit if wants_multiple else 2
            diagrams = await self.search_diagrams(extracted, limit=limit)
            if diagrams:
                return diagrams

        # 3. Universal Visual Search (Persons, TV Shows, Deities, Products, Monuments, Places via Wikipedia)
        limit = default_limit if wants_multiple else 3
        universal_images = await self.search_universal_images(query, limit=limit)
        if universal_images:
            return universal_images

        # 4. Open Web & Pinterest Image Grounding (ONLY if user explicitly requested a photo or image)
        explicit_visual_words = [
            "photo", "photos", "image", "images", "pic", "pics", "picture", "pictures",
            "diagram", "diagrams", "chitra", "chitr", "tasveer", "चित्र", "तस्वीर", "फोटो", "डायग्राम"
        ]
        if any(w in low for w in explicit_visual_words) or prefer_pinterest:
            web_images = await self.search_web_and_pinterest_images(query, limit=limit)
            if web_images:
                return web_images

        return []

    async def search_web_and_pinterest_images(self, query: str, limit: int = 3) -> List[Dict[str, str]]:
        """
        Tier 3 Open Web & Pinterest Grounding:
        Searches Pinterest, Google indexed images, and open web visual sources via Bing Image Index
        when Wikipedia doesn't have images for the requested topic.
        """
        clean_q = re.sub(
            r"(?i)\b(ko|ka|ki|ke|kya|hai|hain|karo|samjhao|explain|in|detail|batao|bataiye|please|dikhao|dikhaiye|draw|give|me|about|what|is|how|does|work|the|a|an|with|diagram|chitra|chitr|picture|photo|photos|image|images|art|wallpapers?|pinterest|google|search)\b|(?:\b|\s)(?:के\s+बारे\s+में|बताओ|बताइए|दिखाओ|दिखाइए|समझाओ|और|भी|का|की|के|को|क्या|है|हैं|चित्र|तस्वीर|फोटो|डायग्राम|सचित्र|विस्तार\s+से|जी|पिनट्रेस्ट|पिनटेरेस्ट|गूगल|सर्च)(?:\b|\s)",
            " ",
            f" {query} "
        )
        clean_q = re.sub(r"[^\w\s]", " ", clean_q).strip()
        clean_q = re.sub(r"\s+", " ", clean_q)
        if not clean_q:
            clean_q = query.strip()

        low = query.lower()
        prefer_pinterest = any(w in low for w in ["pinterest", "पिनट्रेस्ट", "पिनटेरेस्ट"])
        if prefer_pinterest:
            search_query = f"{clean_q} site:pinterest.com/pin/"
        else:
            search_query = f"{clean_q} hd image"

        url = f"https://www.bing.com/images/search?q={urllib.parse.quote(search_query)}&first=1"
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        }

        results: List[Dict[str, str]] = []
        seen = set()
        try:
            async with httpx.AsyncClient(headers=headers, timeout=6.0, follow_redirects=True) as client:
                res = await client.get(url)
                if res.status_code == 200:
                    html = res.text
                    matches = re.findall(r'murl&quot;:&quot;(https?://[^&"]+)&quot;', html)
                    if not matches:
                        matches = re.findall(r'"murl":"(https?://[^"]+)"', html)
                    titles = re.findall(r't1&quot;:&quot;([^&"]+)&quot;', html)

                    for i, u in enumerate(matches):
                        clean_u = u.split("?")[0].lower()
                        if clean_u not in seen and any(clean_u.endswith(ext) for ext in [".jpg", ".jpeg", ".png", ".webp"]):
                            seen.add(clean_u)
                            t = titles[i] if i < len(titles) else clean_q
                            results.append({"title": t, "url": u})
                            if len(results) >= limit:
                                break
        except Exception as e:
            logger.warning(f"Open Web & Pinterest image search error for '{query}': {e}")

        return results[:limit]

    def format_diagram_context(self, diagrams: List[Dict[str, str]]) -> str:
        """Format retrieved diagram and entity image URLs for natural, contextual placement."""
        if not diagrams:
            return ""

        tags = "\n".join([f"![{d['title']}]({d['url']})" for d in diagrams])

        lines = [
            f"\nVERIFIED VISUAL GROUNDING ({len(diagrams)} Verified Images Available):",
            "Embed these verified markdown images naturally into your response where they directly illustrate the concept:",
            tags,
            "\nCRITICAL IMAGE RULES:",
            "1. ONLY embed the verified markdown image tags provided above.",
            "2. Place them contextually alongside the relevant section or topic.",
            "3. If these images do not directly match what the user is asking, do NOT embed them.",
            "4. NEVER invent or hallucinate unverified external image links."
        ]
        return "\n".join(lines)


# Singleton Instance
educational_image_service = EducationalImageService()
