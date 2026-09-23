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

    # Geography & Earth Science
    "water cycle": "water cycle diagram",
    "जल चक्र": "water cycle diagram",
    "carbon cycle": "carbon cycle diagram",
    "nitrogen cycle": "nitrogen cycle diagram",
    "solar system": "solar system diagram",
    "सौर मंडल": "solar system diagram",
    "earth structure": "internal structure of earth diagram",
    "पृथ्वी की आंतरिक संरचना": "internal structure of earth diagram",
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
    ]
}


class EducationalImageService:
    """Retrieves verified open-access educational diagrams (biology, physics, chemistry, anatomy, astronomy)."""

    def __init__(self):
        self.api_url = "https://commons.wikimedia.org/w/api.php"
        self.headers = {"User-Agent": "RhyniaIntelligence/1.0 (https://rhynia.com; contact@rhynia.com)"}

    def extract_subject(self, query: str) -> Optional[str]:
        """Extract the core educational topic from user prompt (supporting English, Hindi, Hinglish)."""
        low = query.lower().strip()

        # 1. Direct concept mapping check
        for concept_key, search_term in CONCEPT_MAP.items():
            if concept_key in low:
                return search_term

        # 2. Check if the user is asking for a diagram or explanation of a scientific noun
        visual_triggers = [
            "diagram", "structure", "anatomy", "illustration", "figure", "drawing",
            "image", "photo", "picture", "chart", "चित्र", "डायग्राम", "संरचना", "फोटो", "नक्शा"
        ]
        has_visual_trigger = any(t in low for t in visual_triggers)

        # 3. Clean query by stripping conversational filler words
        cleaned = re.sub(
            r"(?i)\b(ko|ka|ki|ke|kya|hai|karo|samjhao|explain|in|detail|batao|please|dikhao|draw|give|me|about|what|is|how|does|work|the|a|an|with|diagram|chitra|chitr|picture|image)\b",
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

                        clean_path = img_url.split("?")[0].lower()
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
                                    "url": img_url,
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

        return results[:limit]

    async def search_smart_diagrams(self, query: str, default_limit: int = 5) -> List[Dict[str, str]]:
        """
        Dynamically retrieves 1 to 6 diagrams depending on user requirement and topic depth.
        For detailed or multi-image requests, concurrently queries specific sub-aspects.
        """
        low = query.lower()

        # Check if user specifically asks for multiple or detailed diagrams
        wants_multiple = any(k in low for k in [
            "5-6", "5", "6", "multiple", "all", "sabhi", "saare", "images", "photos",
            "diagrams", "तस्वीर", "चित्र", "डायग्राम", "detail", "detailed", "acche se",
            "pura", "step by step", "विस्तार", "गहराई"
        ])

        # Check if query matches a rich concept subtopics mapping
        for concept_key, subtopics in CONCEPT_SUBTOPICS.items():
            if concept_key in low:
                target_count = default_limit if wants_multiple else 3
                # Fetch subtopics concurrently
                tasks = [self.search_diagrams(sub, limit=1) for sub in subtopics[:target_count + 1]]
                results = await asyncio.gather(*tasks)
                flat = [img for r in results for img in r]

                # Deduplicate by clean url
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

        # Fallback: single concept extract and search
        extracted = self.extract_subject(query)
        if extracted:
            limit = default_limit if wants_multiple else 2
            return await self.search_diagrams(extracted, limit=limit)

        return []

    def format_diagram_context(self, diagrams: List[Dict[str, str]]) -> str:
        """Format retrieved diagram URLs into balanced 2-group placement instructions."""
        if not diagrams:
            return ""

        # Divide into Group 1 (Top Overview, 2-3 images) and Group 2 (In-between detailed points, 1-2 images)
        if len(diagrams) >= 4:
            g1 = diagrams[:3]
            g2 = diagrams[3:]
        elif len(diagrams) >= 2:
            g1 = diagrams[:2]
            g2 = diagrams[2:]
        else:
            g1 = diagrams
            g2 = []

        g1_tags = "\n".join([f"![{d['title']}]({d['url']})" for d in g1])
        g2_tags = "\n".join([f"![{d['title']}]({d['url']})" for d in g2]) if g2 else ""

        lines = [
            f"\nVERIFIED EDUCATIONAL SCIENTIFIC DIAGRAMS RETRIEVED ({len(diagrams)} सत्यापित शैक्षणिक चित्र - अनिवार्य संतुलित लेआउट):",
            "Embed these verified diagrams following the rhythmic, balanced structure requested by the user:",
            "\n➤ GROUP 1: शुरुआती 1-2/3 लाइन पैराग्राफ के ठीक नीचे (Top Overview Gallery - 2-3 Diagrams):",
            g1_tags,
            "Instruction: Place these Group 1 diagrams right after your opening 1-2/3 line introductory paragraph.",
        ]

        if g2_tags:
            lines.extend([
                "\n➤ GROUP 2: मुख्य पॉइंट्स या पैराग्राफ के बीच में (In-Between Sub-Topic Diagrams - 1-2 Diagrams):",
                g2_tags,
                "Instruction: Place these Group 2 diagrams inside your detailed breakdown section alongside the relevant sub-process or organelle (e.g. Chloroplast interior, Calvin cycle, Heart valves) so theory and visuals work in perfect synergy.",
            ])

        lines.extend([
            "\nCRITICAL EMBEDDING RULES (अनिवार्य नियम):",
            "1. DO NOT dump all diagrams at the very end in a single clump. Follow the balanced rhythm (Intro -> 2-3 Images -> Points -> 1-2 Images -> Smart Diagram -> Table -> Conclusion -> Recommended Questions).",
            "2. DO NOT modify, shorten, or invent image URLs. Use the exact markdown tags provided above.",
            "3. Multiple image tags placed consecutively automatically render into a clean, responsive gallery in the UI."
        ])
        return "\n".join(lines)


# Singleton Instance
educational_image_service = EducationalImageService()
