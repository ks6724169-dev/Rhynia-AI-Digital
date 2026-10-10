"""
Unit Tests for Module 03: Response Planner (RP-001 to RP-020)
"""

import unittest
from src.input.processor import InputProcessorEngine
from src.understanding.engine import UnderstandingEngine
from src.planner.engine import ResponsePlannerEngine
from src.schemas.plan_models import ResponseLengthType, StructuralStyle


class TestResponsePlanner(unittest.TestCase):

    def setUp(self):
        self.ip = InputProcessorEngine()
        self.ue = UnderstandingEngine()
        self.rp = ResponsePlannerEngine()

    def test_rp001_code_structure(self):
        """RP-001 & RP-006: Plans code-first structure with code blocks"""
        req = self.ip.process("Python code for binary search")
        intent = self.ue.analyze(req)
        blueprint = self.rp.plan(intent)
        self.assertEqual(blueprint.primary_structure, StructuralStyle.CODE_FIRST)
        self.assertTrue(blueprint.include_code)

    def test_rp005_comparison_table_plan(self):
        """RP-005: Plans comparison table when intent is comparative"""
        req = self.ip.process("Compare SQL vs NoSQL")
        intent = self.ue.analyze(req)
        blueprint = self.rp.plan(intent)
        self.assertTrue(blueprint.include_tables)
        self.assertEqual(blueprint.primary_structure, StructuralStyle.COMPARISON_TABLE)

    def test_rp002_length_budgeting(self):
        """RP-002: Budgets concise length on short constraint"""
        req = self.ip.process("What is RAM in short?")
        intent = self.ue.analyze(req)
        blueprint = self.rp.plan(intent)
        self.assertEqual(blueprint.length_type, ResponseLengthType.CONCISE)

    def test_rp003_section_plans(self):
        """RP-003: Creates modular planned sections"""
        req = self.ip.process("Explain Machine Learning")
        intent = self.ue.analyze(req)
        blueprint = self.rp.plan(intent)
        self.assertGreaterEqual(len(blueprint.planned_sections), 3)

    def test_rp016_honor_exclude_code_constraint(self):
        """RP-016: Does NOT plan code block if EXCLUDE:CODE constraint exists"""
        req = self.ip.process("Explain programming concepts without code")
        intent = self.ue.analyze(req)
        blueprint = self.rp.plan(intent)
        self.assertFalse(blueprint.include_code)


if __name__ == "__main__":
    unittest.main()
