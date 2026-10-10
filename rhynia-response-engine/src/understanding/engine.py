"""
Module 02: Understanding Engine (UE-001 to UE-025)
Extracts true user intent, proficiency level, domain, ambiguity, and constraints.
"""

import re
from typing import List, Dict, Any, Optional

from ..schemas.input_models import StructuredRequest
from ..schemas.intent_models import (
    IntentCategory,
    UserProficiencyLevel,
    AmbiguityStatus,
    ExtractedEntity,
    UserIntentModel,
)


class UnderstandingEngine:
    """
    Executes rules UE-001 to UE-025.
    Transforms StructuredRequest into UserIntentModel.
    """

    def __init__(self):
        # Heuristics for intent classification (UE-001)
        self.code_keywords = {
            "def ", "class ", "function", "code", "bug", "error", "traceback",
            "python", "javascript", "react", "fastapi", "sql", "api", "compile", "syntax"
        }
        self.math_keywords = {
            "calculate", "solve", "equation", "formula", "integral", "derivative",
            "x^2", "x²", "probability", "algebra", "गणित", "हल करो", "मान निकालो"
        }
        self.comparative_keywords = {
            "difference between", "compare", "vs", "versus", "अंतर", "तुलना", "better than"
        }
        self.explanatory_keywords = {
            "explain", "what is", "kya hai", "kaise hota", "samjhao", "kaise kaam karta",
            "meaning", "definition", "concept", "महत्व", "कार्यप्रणाली"
        }

    def analyze(self, request: StructuredRequest) -> UserIntentModel:
        """
        Executes UE-001 to UE-025 on incoming StructuredRequest.
        """
        text = request.sanitized.cleaned_text.lower()

        # UE-001 & UE-002: Intent & Multi-Intent Detection
        primary_intent = self._classify_intent(text)
        secondary_intents = self._detect_secondary_intents(text, primary_intent)

        # UE-004: Domain Classification
        domain = self._classify_domain(text, primary_intent)

        # UE-005: Ambiguity Detection
        ambiguity, clarification_questions = self._check_ambiguity(request.sanitized.cleaned_text)

        # UE-006: User Proficiency Level Inference
        proficiency = self._infer_proficiency(text)

        # UE-003: Entity Extraction
        entities = self._extract_entities(request.sanitized.cleaned_text)

        # UE-008 & UE-009: Constraints Extraction
        constraints = self._extract_constraints(text)

        # Expected Outcome Formulation
        expected_outcome = self._synthesize_expected_outcome(primary_intent, domain)

        return UserIntentModel(
            request_id=request.request_id,
            primary_intent=primary_intent,
            secondary_intents=secondary_intents,
            primary_domain=domain,
            detected_language=request.sanitized.language_hint or "hi-IN",
            target_proficiency=proficiency,
            ambiguity=ambiguity,
            clarification_questions=clarification_questions,
            extracted_entities=entities,
            key_constraints=constraints,
            expected_outcome=expected_outcome,
        )

    def _classify_intent(self, text: str) -> IntentCategory:
        """UE-001: Intent classification heuristic"""
        if any(kw in text for kw in self.comparative_keywords):
            return IntentCategory.COMPARATIVE_ANALYSIS
        if any(kw in text for kw in self.code_keywords):
            return IntentCategory.CODE_DEVELOPMENT
        if any(kw in text for kw in self.math_keywords):
            return IntentCategory.MATHEMATICAL_CALCULATION
        if any(kw in text for kw in self.explanatory_keywords):
            return IntentCategory.EXPLANATORY
        if "step" in text or "process" in text or "guide" in text or "tarika" in text:
            return IntentCategory.PROCEDURAL_GUIDE
        if len(text.split()) <= 2 and any(w in text for w in ["hi", "hello", "hey", "namaste", "pranam"]):
            return IntentCategory.CONVERSATIONAL_CHITCHAT
        return IntentCategory.INFORMATIONAL

    def _detect_secondary_intents(self, text: str, primary: IntentCategory) -> List[IntentCategory]:
        """UE-002: Multi-intent identification"""
        secondary = []
        if primary != IntentCategory.EXPLANATORY and any(kw in text for kw in self.explanatory_keywords):
            secondary.append(IntentCategory.EXPLANATORY)
        if primary != IntentCategory.CODE_DEVELOPMENT and ("example" in text or "code" in text):
            secondary.append(IntentCategory.CODE_DEVELOPMENT)
        return secondary

    def _classify_domain(self, text: str, intent: IntentCategory) -> str:
        """UE-004: Domain categorization"""
        if intent == IntentCategory.CODE_DEVELOPMENT or "python" in text or "software" in text:
            return "computer_science"
        if intent == IntentCategory.MATHEMATICAL_CALCULATION:
            return "mathematics"
        if any(w in text for w in ["mitosis", "cell", "dna", "photosynthesis", "heart", "biology", "जीवविज्ञान"]):
            return "biology"
        if any(w in text for w in ["physics", "gravity", "force", "quantum", "न्यूटन", "भौतिक"]):
            return "physics"
        return "general_knowledge"

    def _check_ambiguity(self, raw_text: str) -> tuple[AmbiguityStatus, List[str]]:
        """UE-005 & UE-012: Ambiguity check and clarification generator"""
        words = raw_text.strip().split()
        if len(words) == 1 and words[0].lower() not in ["hi", "hello", "help"]:
            return AmbiguityStatus.AMBIGUOUS, [
                f"क्या आप '{words[0]}' की परिभाषा जानना चाहते हैं, या इसका कोई विशेष उपयोग/उदाहरण समझना चाहते हैं?"
            ]
        return AmbiguityStatus.CLEAR, []

    def _infer_proficiency(self, text: str) -> UserProficiencyLevel:
        """UE-006: User proficiency level"""
        if any(w in text for w in ["for kids", "simple terms", "aasan bhasha", "bachho ki tarah", "beginner"]):
            return UserProficiencyLevel.BEGINNER
        if any(w in text for w in ["advanced", "deep dive", "kernel", "optimization", "asymptotic", "internals"]):
            return UserProficiencyLevel.EXPERT
        return UserProficiencyLevel.INTERMEDIATE

    def _extract_entities(self, text: str) -> List[ExtractedEntity]:
        """UE-003: Simple capitalized tokens and domain terms"""
        entities = []
        matches = re.findall(r"\b[A-Z][a-zA-Z0-9_]+\b", text)
        for m in set(matches):
            entities.append(ExtractedEntity(name=m, entity_type="NAMED_ENTITY", confidence=0.9))
        return entities

    def _extract_constraints(self, text: str) -> List[str]:
        """UE-008 & UE-009: Negative and positive constraints"""
        constraints = []
        if "short" in text or "chhota" in text or "brief" in text:
            constraints.append("LENGTH:SHORT")
        if "in hindi" in text or "hindi mein" in text:
            constraints.append("LANG:HINDI")
        if "without code" in text or "bina code" in text:
            constraints.append("EXCLUDE:CODE")
        if "in points" in text or "bullets" in text:
            constraints.append("FORMAT:BULLETS")
        return constraints

    def _synthesize_expected_outcome(self, intent: IntentCategory, domain: str) -> str:
        """Expected outcome synthesis"""
        return f"Deliver structured {intent.value} response tailored for domain {domain} with conceptual clarity."
