"""
Unit Tests for Module 05: Knowledge & Tool Layer (KL-001 to KL-025)
"""

import unittest
from src.input.processor import InputProcessorEngine
from src.understanding.engine import UnderstandingEngine
from src.planner.engine import ResponsePlannerEngine
from src.reasoning.engine import ReasoningEngine
from src.knowledge.engine import KnowledgeToolEngine
from src.schemas.knowledge_models import KnowledgeSourceType


class TestKnowledgeToolEngine(unittest.TestCase):

    def setUp(self):
        self.ip = InputProcessorEngine()
        self.ue = UnderstandingEngine()
        self.rp = ResponsePlannerEngine()
        self.re = ReasoningEngine()
        self.kl = KnowledgeToolEngine()

    def test_kl001_internal_knowledge_priority(self):
        """KL-001 & KL-002: Prefers parametric memory for standard foundational knowledge"""
        req = self.ip.process("What is Newton's second law?")
        intent = self.ue.analyze(req)
        bp = self.rp.plan(intent)
        plan = self.re.reason(intent, bp)
        ctx = self.kl.ground(intent, plan)

        self.assertEqual(ctx.source_used, KnowledgeSourceType.PARAMETRIC_MEMORY)
        self.assertTrue(ctx.is_grounded)

    def test_kl004_visual_diagram_worthy(self):
        """KL-004: Triggers diagram grounding on visual biology/physics topics"""
        req = self.ip.process("Explain human heart structure and valves")
        intent = self.ue.analyze(req)
        bp = self.rp.plan(intent)
        plan = self.re.reason(intent, bp)
        ctx = self.kl.ground(intent, plan)

        self.assertTrue(len(ctx.diagram_urls) > 0)

    def test_kl008_grounding_facts_transferred(self):
        """KL-008: Properly transfers verified facts into knowledge context"""
        req = self.ip.process("What is gravity?")
        intent = self.ue.analyze(req)
        bp = self.rp.plan(intent)
        plan = self.re.reason(intent, bp)
        ctx = self.kl.ground(intent, plan)

        self.assertGreaterEqual(len(ctx.grounding_data), len(plan.facts))


if __name__ == "__main__":
    unittest.main()
