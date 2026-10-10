"""
Unit Tests for Module 02: Understanding Engine (UE-001 to UE-025)
"""

import unittest
from src.input.processor import InputProcessorEngine
from src.understanding.engine import UnderstandingEngine
from src.schemas.intent_models import IntentCategory, AmbiguityStatus, UserProficiencyLevel


class TestUnderstandingEngine(unittest.TestCase):

    def setUp(self):
        self.ip = InputProcessorEngine()
        self.ue = UnderstandingEngine()

    def test_ue001_code_intent(self):
        """UE-001: Classifies code queries accurately"""
        req = self.ip.process("def bubble_sort(arr): write python code")
        intent = self.ue.analyze(req)
        self.assertEqual(intent.primary_intent, IntentCategory.CODE_DEVELOPMENT)
        self.assertEqual(intent.primary_domain, "computer_science")

    def test_ue001_math_intent(self):
        """UE-001: Classifies math calculation intent"""
        req = self.ip.process("solve equation x^2 + 5x + 6 = 0")
        intent = self.ue.analyze(req)
        self.assertEqual(intent.primary_intent, IntentCategory.MATHEMATICAL_CALCULATION)
        self.assertEqual(intent.primary_domain, "mathematics")

    def test_ue001_comparative_intent(self):
        """UE-001: Classifies comparative intent"""
        req = self.ip.process("Compare React vs Vue difference")
        intent = self.ue.analyze(req)
        self.assertEqual(intent.primary_intent, IntentCategory.COMPARATIVE_ANALYSIS)

    def test_ue004_biology_domain(self):
        """UE-004: Classifies biology domain"""
        req = self.ip.process("Cell division mitosis kya hai?")
        intent = self.ue.analyze(req)
        self.assertEqual(intent.primary_domain, "biology")

    def test_ue005_ambiguity_detection(self):
        """UE-005 & UE-012: Detects one-word ambiguous queries and generates clarification"""
        req = self.ip.process("Mitochondria")
        intent = self.ue.analyze(req)
        self.assertEqual(intent.ambiguity, AmbiguityStatus.AMBIGUOUS)
        self.assertTrue(len(intent.clarification_questions) > 0)

    def test_ue006_beginner_proficiency(self):
        """UE-006: Inters beginner proficiency from trigger keywords"""
        req = self.ip.process("Quantum physics explain for kids in simple terms")
        intent = self.ue.analyze(req)
        self.assertEqual(intent.target_proficiency, UserProficiencyLevel.BEGINNER)

    def test_ue008_constraints_extraction(self):
        """UE-008 & UE-009: Extracts negative and formatting constraints"""
        req = self.ip.process("Explain API without code in short bullets")
        intent = self.ue.analyze(req)
        self.assertIn("EXCLUDE:CODE", intent.key_constraints)
        self.assertIn("LENGTH:SHORT", intent.key_constraints)
        self.assertIn("FORMAT:BULLETS", intent.key_constraints)


if __name__ == "__main__":
    unittest.main()
