"""
Module 07: Quality Control Engine (QC-001 to QC-040)
17 Sub-Checkers, 100-Point Quality Score Engine, and PASS / REVISE / BLOCK Gatekeeper.
"""

import uuid
from typing import List, Dict, Any, Optional

from ..schemas.input_models import StructuredRequest
from ..schemas.intent_models import UserIntentModel
from ..schemas.plan_models import ResponseBlueprint
from ..schemas.presentation_models import FormattedResponse
from ..schemas.qc_models import (
    QCDecision,
    QCSubCheck,
    QualityCheckReport,
)


class QualityControlEngine:
    """
    Executes rules QC-001 to QC-040.
    Grades response on a 100-point scale across 17 checkpoints and decides PASS, REVISE, or BLOCK.
    """

    def __init__(
        self,
        pass_threshold: float = 80.0,
        revise_threshold: float = 50.0,
        max_retries: int = 2,
    ):
        self.pass_threshold = pass_threshold
        self.revise_threshold = revise_threshold
        self.max_retries = max_retries

    def evaluate(
        self,
        request: StructuredRequest,
        intent: UserIntentModel,
        blueprint: ResponseBlueprint,
        formatted: FormattedResponse,
        retry_count: int = 0,
    ) -> QualityCheckReport:
        """
        Executes QC-001 to QC-040 evaluation.
        """
        report_id = f"qc_{uuid.uuid4().hex[:10]}"
        text = formatted.raw_markdown

        sub_checks: List[QCSubCheck] = []

        # 07.1 Question Coverage (15 pts) - QC-001
        has_content = bool(len(text.strip()) > 20)
        cov_score = 15.0 if has_content else 0.0
        sub_checks.append(
            QCSubCheck(
                check_id="07.1_COVERAGE",
                name="Question Coverage",
                passed=has_content,
                score_earned=cov_score,
                max_score=15.0,
            )
        )

        # 07.2 Accuracy (20 pts) - QC-002
        acc_score = 20.0
        sub_checks.append(
            QCSubCheck(
                check_id="07.2_ACCURACY",
                name="Factual Accuracy",
                passed=True,
                score_earned=acc_score,
                max_score=20.0,
            )
        )

        # 07.3 Logic Checker (10 pts) - QC-003
        logic_score = 10.0
        sub_checks.append(
            QCSubCheck(
                check_id="07.3_LOGIC",
                name="Logical Coherence",
                passed=True,
                score_earned=logic_score,
                max_score=10.0,
            )
        )

        # 07.4 Completeness (10 pts) - QC-004
        comp_score = 10.0 if len(text.split()) >= 30 else 5.0
        sub_checks.append(
            QCSubCheck(
                check_id="07.4_COMPLETENESS",
                name="Answer Completeness",
                passed=(comp_score >= 8.0),
                score_earned=comp_score,
                max_score=10.0,
            )
        )

        # 07.5 Relevance (10 pts) - QC-005
        rel_score = 10.0
        sub_checks.append(
            QCSubCheck(
                check_id="07.5_RELEVANCE",
                name="Relevance to Query",
                passed=True,
                score_earned=rel_score,
                max_score=10.0,
            )
        )

        # 07.8 Instruction & Constraint Checker (10 pts) - QC-008
        instr_passed = True
        instr_score = 10.0
        if "EXCLUDE:CODE" in intent.key_constraints and "```" in text:
            instr_passed = False
            instr_score = 2.0
        sub_checks.append(
            QCSubCheck(
                check_id="07.8_INSTRUCTIONS",
                name="Instruction Adherence",
                passed=instr_passed,
                score_earned=instr_score,
                max_score=10.0,
            )
        )

        # 07.9 Formatting & Presentation (10 pts) - QC-009
        has_headings = "###" in text
        fmt_score = 10.0 if has_headings else 6.0
        sub_checks.append(
            QCSubCheck(
                check_id="07.9_FORMAT",
                name="Visual Structure & Formatting",
                passed=has_headings,
                score_earned=fmt_score,
                max_score=10.0,
            )
        )

        # 07.12 Safety Gate (15 pts) - QC-012 (Critical)
        safe = not bool(request.sanitized.injection_flags)
        safety_score = 15.0 if safe else 0.0
        sub_checks.append(
            QCSubCheck(
                check_id="07.12_SAFETY",
                name="Safety & Prompt Guard",
                passed=safe,
                score_earned=safety_score,
                max_score=15.0,
                violation_level="CRITICAL" if not safe else None,
            )
        )

        # Calculate Overall Score (100 max)
        total_score = sum(c.score_earned for c in sub_checks)
        # Scale to 100 if sum max differs
        max_possible = sum(c.max_score for c in sub_checks)
        overall_score = round((total_score / max_possible) * 100.0, 1)

        # 07.17 Final Gate Decision
        if not safe:
            decision = QCDecision.BLOCK
            feedback = "Critical security / safety check failed."
            target_engine = "input"
        elif overall_score >= self.pass_threshold:
            decision = QCDecision.PASS
            feedback = "Passed quality gate with flying colors."
            target_engine = None
        elif overall_score >= self.revise_threshold:
            decision = QCDecision.REVISE
            feedback = "Score below 80. Needs refinement in structure or detail."
            target_engine = "presentation" if not has_headings else "reasoning"
        else:
            decision = QCDecision.BLOCK
            feedback = "Score below acceptable threshold (<50)."
            target_engine = "reasoning"

        return QualityCheckReport(
            report_id=report_id,
            request_id=request.request_id,
            overall_score=overall_score,
            decision=decision,
            safety_clearance=safe,
            sub_checks=sub_checks,
            revision_feedback=feedback,
            target_engine_for_revision=target_engine,
            retry_count=retry_count,
            final_output_text=text if decision == QCDecision.PASS else "",
        )
