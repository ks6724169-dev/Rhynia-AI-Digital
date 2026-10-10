"""
Rhynia Response Engine (RRE) Integration Service
Connects the 202-rule RRS v1.0 Pipeline to the FastAPI Backend.
"""

import sys
import logging
from pathlib import Path
from typing import Dict, Any, List, Optional

# Add rhynia-response-engine to sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent.parent.parent
RRE_PATH = PROJECT_ROOT / "rhynia-response-engine"
if str(RRE_PATH) not in sys.path:
    sys.path.insert(0, str(RRE_PATH))

try:
    from src.orchestrator.pipeline import RhyniaEngineOrchestrator
    from src.schemas.qc_models import QualityCheckReport, QCDecision
    RRE_AVAILABLE = True
except Exception as e:
    logging.getLogger("rhynia.rre").warning(f"Could not load Rhynia Response Engine: {e}")
    RRE_AVAILABLE = False


logger = logging.getLogger("rhynia.rre")


class RREService:
    """
    Service wrapper for Rhynia Engine Orchestrator.
    """

    def __init__(self):
        if RRE_AVAILABLE:
            self.orchestrator = RhyniaEngineOrchestrator()
            logger.info("Rhynia Response Engine (RRE v1.0 - 202 Rules) Initialized successfully.")
        else:
            self.orchestrator = None

    def is_active(self) -> bool:
        return self.orchestrator is not None

    def process_query(
        self,
        message: str,
        session_id: Optional[str] = None,
        attachments: Optional[List[Dict[str, Any]]] = None,
        history: Optional[List[Dict[str, Any]]] = None,
    ) -> Optional[Dict[str, Any]]:
        """
        Executes the 7-engine pipeline on user query and returns structured report.
        """
        if not self.orchestrator:
            return None

        try:
            report: QualityCheckReport = self.orchestrator.run(
                raw_message=message,
                session_id=session_id,
                attachments=attachments,
                history=history,
            )
            return {
                "report_id": report.report_id,
                "overall_score": report.overall_score,
                "decision": report.decision.value,
                "safety_clearance": report.safety_clearance,
                "sub_checks": [c.model_dump() for c in report.sub_checks],
                "revision_feedback": report.revision_feedback,
                "final_output_text": report.final_output_text,
                "retry_count": report.retry_count,
            }
        except Exception as e:
            logger.error(f"Error in RRE processing: {e}")
            return None

    def generate_rre_system_prompt_enhancement(self, message: str) -> str:
        """
        Extracts understanding, blueprint, and guidelines from RRE to enrich LLM prompt.
        """
        if not self.orchestrator:
            return ""

        try:
            req = self.orchestrator.input_processor.process(message)
            intent = self.orchestrator.understanding_engine.analyze(req)
            blueprint = self.orchestrator.planner_engine.plan(intent)

            guideline_str = "\n".join(f"- {g}" for g in blueprint.guidelines)
            sections_str = ", ".join(s.title for s in blueprint.planned_sections)

            return (
                f"\n\n[RRS v1.0 RESPONSE SPECIFICATION ENFORCEMENT]\n"
                f"- Primary Intent: {intent.primary_intent.value} (Domain: {intent.primary_domain})\n"
                f"- Target Structure Style: {blueprint.primary_structure.value}\n"
                f"- Target Length: {blueprint.length_type.value}\n"
                f"- Planned Sections: {sections_str}\n"
                f"- Essential Guidelines:\n{guideline_str}\n"
            )
        except Exception as e:
            logger.warning(f"RRE prompt enhancement skipped: {e}")
            return ""


rre_service = RREService()
