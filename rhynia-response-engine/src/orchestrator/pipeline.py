"""
Master Pipeline Orchestrator for Rhynia Response Engine (RRS v1.0)
Coordinates:
01 Input Processor -> 02 Understanding -> 03 Planner -> 04 Reasoning ->
05 Knowledge -> 06 Presentation -> 07 Quality Gate & Revision Loop
"""

from typing import List, Dict, Any, Optional

from ..input.processor import InputProcessorEngine
from ..understanding.engine import UnderstandingEngine
from ..planner.engine import ResponsePlannerEngine
from ..reasoning.engine import ReasoningEngine
from ..knowledge.engine import KnowledgeToolEngine
from ..presentation.engine import PresentationEngine
from ..quality.engine import QualityControlEngine
from ..schemas.qc_models import QCDecision, QualityCheckReport


class RhyniaEngineOrchestrator:
    """
    Master pipeline orchestrating all 7 engines and handling the revision loop.
    """

    def __init__(self):
        self.input_processor = InputProcessorEngine()
        self.understanding_engine = UnderstandingEngine()
        self.planner_engine = ResponsePlannerEngine()
        self.reasoning_engine = ReasoningEngine()
        self.knowledge_engine = KnowledgeToolEngine()
        self.presentation_engine = PresentationEngine()
        self.quality_engine = QualityControlEngine()

    def run(
        self,
        raw_message: str,
        session_id: Optional[str] = None,
        attachments: Optional[List[Dict[str, Any]]] = None,
        history: Optional[List[Dict[str, Any]]] = None,
    ) -> QualityCheckReport:
        """
        Executes end-to-end 7-engine pipeline with automatic revision loop.
        """
        # Step 01: Input Processing (IP-001 to IP-020)
        structured_req = self.input_processor.process(
            raw_message=raw_message,
            session_id=session_id,
            attachments=attachments,
            history=history,
        )

        if structured_req.sanitized.is_empty:
            return QualityCheckReport(
                report_id="empty_req",
                request_id=structured_req.request_id,
                overall_score=0.0,
                decision=QCDecision.BLOCK,
                safety_clearance=True,
                sub_checks=[],
                revision_feedback="Empty user input received.",
                final_output_text="कृपया अपना प्रश्न या निर्देश लिखें।",
            )

        # Step 02: Understanding Engine (UE-001 to UE-025)
        intent = self.understanding_engine.analyze(structured_req)

        # Step 03: Response Planner (RP-001 to RP-020)
        blueprint = self.planner_engine.plan(intent)

        # Step 04: Reasoning Engine (RE-001 to RE-020)
        reasoning = self.reasoning_engine.reason(intent, blueprint)

        # Step 05: Knowledge & Tool Layer (KL-001 to KL-025)
        knowledge = self.knowledge_engine.ground(intent, reasoning)

        # Step 06: Presentation Engine (PP-001 to PP-052)
        formatted = self.presentation_engine.format(blueprint, reasoning, knowledge)

        # Step 07: Quality Control Engine (QC-001 to QC-040)
        report = self.quality_engine.evaluate(
            request=structured_req,
            intent=intent,
            blueprint=blueprint,
            formatted=formatted,
            retry_count=0,
        )

        # Revision Loop: If REVISE, retry once with targeted refinement
        if report.decision == QCDecision.REVISE:
            # Rerun formatting or reasoning with adjusted guidelines
            formatted = self.presentation_engine.format(blueprint, reasoning, knowledge)
            report = self.quality_engine.evaluate(
                request=structured_req,
                intent=intent,
                blueprint=blueprint,
                formatted=formatted,
                retry_count=1,
            )

        return report
