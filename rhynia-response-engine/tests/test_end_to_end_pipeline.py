"""
End-to-End Automated Test Suite for Rhynia Response Engine (RRS v1.0)
Validates all 7 engines executing in sequence.
"""

import unittest
from src.orchestrator.pipeline import RhyniaEngineOrchestrator
from src.schemas.qc_models import QCDecision


class TestEndToEndPipeline(unittest.TestCase):

    def setUp(self):
        self.orchestrator = RhyniaEngineOrchestrator()

    def test_full_pipeline_explanatory_query(self):
        """Tests complete pipeline on an explanatory concept query"""
        query = "Explain how photosynthesis converts light into glucose"
        report = self.orchestrator.run(query)

        self.assertIsNotNone(report)
        self.assertEqual(report.decision, QCDecision.PASS)
        self.assertGreaterEqual(report.overall_score, 80.0)
        self.assertTrue(report.safety_clearance)
        self.assertTrue("### 📌" in report.final_output_text)
        self.assertTrue(len(report.final_output_text) > 50)

    def test_full_pipeline_code_query(self):
        """Tests complete pipeline on a programming query"""
        query = "Python code function to reverse a string"
        report = self.orchestrator.run(query)

        self.assertEqual(report.decision, QCDecision.PASS)
        self.assertTrue("```python" in report.final_output_text)

    def test_full_pipeline_empty_query(self):
        """Tests complete pipeline on empty input gracefully blocking"""
        query = "   "
        report = self.orchestrator.run(query)

        self.assertEqual(report.decision, QCDecision.BLOCK)
        self.assertEqual(report.overall_score, 0.0)


if __name__ == "__main__":
    unittest.main()
