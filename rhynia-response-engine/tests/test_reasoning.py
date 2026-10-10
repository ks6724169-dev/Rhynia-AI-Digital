"""
Unit Tests for Module 04: Reasoning Engine (RE-001 to RE-020)
"""

import unittest
from src.input.processor import InputProcessorEngine
from src.understanding.engine import UnderstandingEngine
from src.planner.engine import ResponsePlannerEngine
from src.reasoning.engine import ReasoningEngine
from src.schemas.reasoning_models import ReasoningType, FactLevel


class TestReasoningEngine(unittest.TestCase):

    def setUp(self):
        self.ip = InputProcessorEngine()
        self.ue = UnderstandingEngine()
        self.rp = ResponsePlannerEngine()
        self.re = ReasoningEngine()

    def test_re001_reasoning_type(self):
        """RE-001: Identifies algorithmic vs mathematical vs explanatory reasoning"""
        req_code = self.ip.process("Write a Python loop")
        intent_code = self.ue.analyze(req_code)
        bp_code = self.rp.plan(intent_code)
        plan_code = self.re.reason(intent_code, bp_code)
        self.assertEqual(plan_code.primary_reasoning_type, ReasoningType.ALGORITHMIC_CODE)

        req_math = self.ip.process("Solve 2x + 10 = 20")
        intent_math = self.ue.analyze(req_math)
        bp_math = self.rp.plan(intent_math)
        plan_math = self.re.reason(intent_math, bp_math)
        self.assertEqual(plan_math.primary_reasoning_type, ReasoningType.MATHEMATICAL)

    def test_re002_core_vs_supporting_facts(self):
        """RE-002: Classifies facts into CORE and SUPPORTING levels"""
        req = self.ip.process("Explain photosynthesis")
        intent = self.ue.analyze(req)
        bp = self.rp.plan(intent)
        plan = self.re.reason(intent, bp)

        levels = [f.level for f in plan.facts]
        self.assertIn(FactLevel.CORE, levels)
        self.assertIn(FactLevel.SUPPORTING, levels)

    def test_re005_deductive_logic_chain(self):
        """RE-005: Produces multi-step verified logic chain"""
        req = self.ip.process("Why is sky blue?")
        intent = self.ue.analyze(req)
        bp = self.rp.plan(intent)
        plan = self.re.reason(intent, bp)

        self.assertGreaterEqual(len(plan.logic_chain), 2)
        self.assertEqual(plan.logic_chain[0].step_number, 1)

    def test_re006_edge_cases_identified(self):
        """RE-006: Identifies edge cases for code and math problems"""
        req = self.ip.process("Write a division function in Python")
        intent = self.ue.analyze(req)
        bp = self.rp.plan(intent)
        plan = self.re.reason(intent, bp)

        self.assertTrue(len(plan.edge_cases_considered) > 0)


if __name__ == "__main__":
    unittest.main()
