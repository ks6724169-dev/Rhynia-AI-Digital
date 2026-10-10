"""
Unit Tests for Module 06: Presentation Engine (PP-001 to PP-052)
"""

import unittest
from src.input.processor import InputProcessorEngine
from src.understanding.engine import UnderstandingEngine
from src.planner.engine import ResponsePlannerEngine
from src.reasoning.engine import ReasoningEngine
from src.knowledge.engine import KnowledgeToolEngine
from src.presentation.engine import PresentationEngine


class TestPresentationEngine(unittest.TestCase):

    def setUp(self):
        self.ip = InputProcessorEngine()
        self.ue = UnderstandingEngine()
        self.rp = ResponsePlannerEngine()
        self.re = ReasoningEngine()
        self.kl = KnowledgeToolEngine()
        self.pp = PresentationEngine()

    def test_pp003_markdown_headings_hierarchy(self):
        """PP-003: Builds clean markdown headers and hierarchy"""
        req = self.ip.process("Explain Microservices Architecture")
        intent = self.ue.analyze(req)
        bp = self.rp.plan(intent)
        plan = self.re.reason(intent, bp)
        ctx = self.kl.ground(intent, plan)
        res = self.pp.format(bp, plan, ctx)

        self.assertIn("### 📌", res.raw_markdown)
        self.assertIn("#### ⚙️", res.raw_markdown)

    def test_pp012_callout_box_rendering(self):
        """PP-012: Renders strategic GitHub-style callout boxes"""
        req = self.ip.process("Tips for database index optimization")
        intent = self.ue.analyze(req)
        bp = self.rp.plan(intent)
        plan = self.re.reason(intent, bp)
        ctx = self.kl.ground(intent, plan)
        res = self.pp.format(bp, plan, ctx)

        self.assertIn("> [!TIP]", res.raw_markdown)
        self.assertTrue(len(res.callouts) > 0)

    def test_pp021_table_rendering(self):
        """PP-021: Formats clean markdown table when comparative"""
        req = self.ip.process("Compare PostgreSQL vs MongoDB")
        intent = self.ue.analyze(req)
        bp = self.rp.plan(intent)
        plan = self.re.reason(intent, bp)
        ctx = self.kl.ground(intent, plan)
        res = self.pp.format(bp, plan, ctx)

        self.assertIn("|", res.raw_markdown)
        self.assertIn("---", res.raw_markdown)
        self.assertTrue(len(res.tables) > 0)

    def test_pp045_strip_clutter_urls(self):
        """PP-045: Strips clutter markdown links into readable text while preserving images"""
        raw_text = "Here is [Source Link](https://example.com/source) and ![Image](https://img.com/a.png)"
        cleaned = self.pp._strip_clutter_urls(raw_text)

        self.assertNotIn("[Source Link](https://example.com/source)", cleaned)
        self.assertIn("Source Link", cleaned)
        self.assertIn("![Image](https://img.com/a.png)", cleaned)


if __name__ == "__main__":
    unittest.main()
