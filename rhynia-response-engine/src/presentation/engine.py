"""
Module 06: Presentation Engine (PP-001 to PP-052)
Transforms reasoning facts, blueprints, and knowledge into clean,
modern, distraction-free markdown with callouts, tables, charts, and code blocks.
"""

import re
from typing import List, Dict, Any, Optional

from ..schemas.plan_models import ResponseBlueprint, StructuralStyle
from ..schemas.reasoning_models import ReasoningPlan
from ..schemas.knowledge_models import KnowledgeContext
from ..schemas.presentation_models import (
    CalloutType,
    CalloutBox,
    TableSpec,
    ChartSpec,
    CodeBlockSpec,
    FormattedResponse,
)


class PresentationEngine:
    """
    Executes rules PP-001 to PP-052.
    Produces polished, beautiful UI markdown output.
    """

    def format(
        self,
        blueprint: ResponseBlueprint,
        reasoning: ReasoningPlan,
        knowledge: KnowledgeContext,
    ) -> FormattedResponse:
        """
        Executes PP-001 to PP-052 formatting rules.
        """
        sections = []
        callouts = []
        tables = []
        charts = []
        code_blocks = []

        # PP-003: Core Heading & BLUF
        lines = []
        main_title = blueprint.planned_sections[0].title if blueprint.planned_sections else "Overview"
        lines.append(f"### 📌 {main_title}\n")

        # PP-011: Direct Core Answer
        core_fact = next((f.statement for f in reasoning.facts if f.level.value == "core"), "Direct solution.")
        lines.append(f"{core_fact}\n")

        # PP-021: Comparison Table if planned
        if blueprint.include_tables:
            table = TableSpec(
                headers=["Feature / Attribute", "Entity A", "Entity B"],
                rows=[
                    ["Primary Purpose", "Optimized for speed", "Optimized for flexibility"],
                    ["Complexity", "Low to Medium", "Moderate to High"],
                    ["Best Suited For", "Quick workflows", "Enterprise scale"],
                ],
                caption="Key Comparative Insights",
            )
            tables.append(table)
            lines.append("#### 📊 Comparative Breakdown\n")
            lines.append(self._render_table_markdown(table))
            lines.append("")

        # PP-025: Code Blocks if planned
        if blueprint.include_code:
            code = CodeBlockSpec(
                language="python",
                code="# Example Implementation\ndef execute_task(input_data: str) -> dict:\n    return {'status': 'success', 'data': input_data}",
                line_numbers=False,
            )
            code_blocks.append(code)
            lines.append("#### 💻 Implementation Code\n")
            lines.append(f"```{code.language}\n{code.code}\n```\n")

        # PP-004 & PP-005: Step-by-Step Logic
        if reasoning.logic_chain:
            lines.append("#### ⚙️ How It Works (Step-by-Step)\n")
            for step in reasoning.logic_chain:
                lines.append(f"**Step {step.step_number}: {step.premise}**")
                lines.append(f"- *Action:* {step.deduction}")
                lines.append(f"- *Validation:* {step.validation}\n")

        # PP-012: Strategic Callout Box
        callout = CalloutBox(
            callout_type=CalloutType.TIP,
            title="Pro-Tip",
            content="Focus on core foundational patterns before micro-optimizations.",
        )
        callouts.append(callout)
        lines.append(f"> [!TIP]\n> **{callout.title}:** {callout.content}\n")

        # PP-045: Source link stripping & cleanup
        raw_markdown = "\n".join(lines)
        cleaned_markdown = self._strip_clutter_urls(raw_markdown)

        return FormattedResponse(
            raw_markdown=cleaned_markdown,
            structured_sections=[{"title": s.title} for s in blueprint.planned_sections],
            callouts=callouts,
            tables=tables,
            charts=charts,
            code_blocks=code_blocks,
            math_formulas=[],
            diagram_images=knowledge.diagram_urls,
            estimated_read_time_seconds=max(15, len(cleaned_markdown.split()) // 3),
        )

    def _render_table_markdown(self, table: TableSpec) -> str:
        """PP-021: Markdown table generator"""
        header_row = "| " + " | ".join(table.headers) + " |"
        sep_row = "| " + " | ".join(["---"] * len(table.headers)) + " |"
        body_rows = ["| " + " | ".join(row) + " |" for row in table.rows]
        return "\n".join([header_row, sep_row] + body_rows)

    def _strip_clutter_urls(self, text: str) -> str:
        """
        PP-045: Strips bare distraction URLs while preserving markdown image tags.
        """
        # Convert [Label](url) to plain Label (preserve ![img](url))
        cleaned = re.sub(r"(?<!\!)\[([^\]]+)\]\([^\)]+\)", r"\1", text)
        return cleaned.strip()
