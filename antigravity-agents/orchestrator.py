"""
Rhynia Intelligence SaaS — Full 10-Agent Autonomous Lifecycle Orchestrator
Governs the complete 16-Step Enterprise Development Workflow across all 10 specialized agents.
"""

import json
import os
import subprocess
import sys
from pathlib import Path

# Ensure UTF-8 output on Windows consoles
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass


class FullLifecycleOrchestrator:
    """Master Multi-Agent Orchestrator governing the 10-Agent Enterprise Team."""

    def __init__(self, config_file: str = "config/team_config.json"):
        self.base_dir = Path(__file__).resolve().parent
        config_path = self.base_dir / config_file
        with open(config_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            self.project_name = data.get("project_name", "Rhynia Intelligence")
            self.agents = {a["agent_id"]: a for a in data["agents"]}

        self.artifacts = {}
        self.tools_dir = self.base_dir / "tools"

    def run_agent(self, agent_id: str, input_payload: dict) -> str:
        """Execute a specific agent's lifecycle mandate."""
        agent = self.agents.get(agent_id)
        if not agent:
            raise ValueError(f"Agent '{agent_id}' not found in team configuration.")

        prompt_file = self.base_dir / agent["system_prompt_file"]
        prompt_preview = ""
        if prompt_file.exists():
            with open(prompt_file, "r", encoding="utf-8") as pf:
                first_line = pf.readline().strip()
                prompt_preview = f" ({first_line})"

        steps_str = ", ".join(agent.get("steps_handled", []))
        print(f"\n⚡ [AGENT ACTIVE] {agent['name']}{prompt_preview}")
        print(f"   📌 Steps: {steps_str}")
        print(f"   🛠️ Allowed Tools: {', '.join(agent.get('allowed_tools', []))}")
        print(f"   📥 Input Artifacts: {list(input_payload.keys())}")

        output = f"Processed by {agent['name']} for payload: {list(input_payload.keys())}"
        return output

    def run_brand_linter(self) -> bool:
        """Run Aegis Automated Brand Linter (tools/linter.py)."""
        print("\n▶ [Aegis] Running Automated Brand Linter (tools/linter.py)...")
        linter_script = self.tools_dir / "linter.py"
        lint_result = subprocess.run(
            [sys.executable, str(linter_script), "services/rhynia_saas"],
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
        )
        if lint_result.stdout:
            print(lint_result.stdout.strip())
        return lint_result.returncode == 0

    def run_verification_runner(self) -> bool:
        """Run Tracker Automated Test Runner (tools/runner.py)."""
        print("\n▶ [Tracker] Running Automated Test Suite (tools/runner.py)...")
        runner_script = self.tools_dir / "runner.py"
        run_result = subprocess.run(
            [sys.executable, str(runner_script)],
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
        )
        if run_result.stdout:
            print(run_result.stdout.strip())
        return run_result.returncode == 0

    def start_pipeline(self, initial_idea: str = "RHYNIA"):
        """Execute the complete 16-step development lifecycle across all 10 agents."""
        print("================================================================================")
        print(f"🚀 {self.project_name.upper()} — 10-AGENT ENTERPRISE ORCHESTRATOR")
        print("================================================================================")

        # ----------------------------------------------------------------------
        # PHASE 1: PLANNING & DESIGN (Steps 1, 2, 4, 5, 6, 7)
        # ----------------------------------------------------------------------
        print("\n" + "=" * 60)
        print("📁 PHASE 1: PLANNING & DESIGN (Nova, Pixel, Apex)")
        print("=" * 60)
        self.artifacts["prd"] = self.run_agent("agent_lead_pm", {"idea": initial_idea})
        self.artifacts["ui_design"] = self.run_agent("agent_ui_ux", {"prd": self.artifacts["prd"]})
        self.artifacts["architecture"] = self.run_agent("agent_architect", {
            "prd": self.artifacts["prd"],
            "design": self.artifacts["ui_design"],
        })
        self.artifacts["sprint_plan"] = self.run_agent("agent_lead_pm", {"arch": self.artifacts["architecture"]})

        # ----------------------------------------------------------------------
        # PHASE 2: IMPLEMENTATION (Step 8)
        # ----------------------------------------------------------------------
        print("\n" + "=" * 60)
        print("💻 PHASE 2: IMPLEMENTATION & CODING (Aura, Cipher)")
        print("=" * 60)
        self.artifacts["frontend_code"] = self.run_agent("agent_frontend", {"sprint": self.artifacts["sprint_plan"]})
        self.artifacts["backend_code"] = self.run_agent("agent_backend", {"sprint": self.artifacts["sprint_plan"]})

        # ----------------------------------------------------------------------
        # PHASE 3: REVIEW, CI & VERIFICATION (Steps 9, 10, 11, 12)
        # ----------------------------------------------------------------------
        print("\n" + "=" * 60)
        print("🛡️ PHASE 3: REVIEW, CI & QUALITY GATES (Vigil, Pulse, Tracker, Aegis)")
        print("=" * 60)
        self.artifacts["code_review"] = self.run_agent("agent_code_reviewer", {
            "frontend": self.artifacts["frontend_code"],
            "backend": self.artifacts["backend_code"],
        })
        self.artifacts["ci_build"] = self.run_agent("agent_ci_devops", {"review": self.artifacts["code_review"]})
        self.artifacts["test_results"] = self.run_agent("agent_qa_tester", {"build": self.artifacts["ci_build"]})
        self.artifacts["security_audit"] = self.run_agent("agent_security", {"build": self.artifacts["ci_build"]})

        # Quality Gate Executions
        brand_clean = self.run_brand_linter()
        tests_passed = self.run_verification_runner()

        if not brand_clean or not tests_passed:
            print("\n❌ [PIPELINE HALTED] Quality Gate failed! Halting before release.")
            return False

        # ----------------------------------------------------------------------
        # PHASE 4: DELIVERY, TELEMETRY & LIFECYCLE (Steps 13, 14, 15, 16)
        # ----------------------------------------------------------------------
        print("\n" + "=" * 60)
        print("🌐 PHASE 4: DELIVERY, TELEMETRY & SRE (Chronos, Pulse, Nova)")
        print("=" * 60)
        self.artifacts["beta_release"] = self.run_agent("agent_sre_telemetry", {"security": self.artifacts["security_audit"]})
        self.artifacts["deployment"] = self.run_agent("agent_ci_devops", {"beta": self.artifacts["beta_release"]})
        self.artifacts["monitoring_updates"] = self.run_agent("agent_sre_telemetry", {"deploy": self.artifacts["deployment"]})

        print("\n================================================================================")
        print("🏆 16-STEP DEVELOPMENT CYCLE SUCCESSFULLY COMPLETED ACROSS ALL 10 AGENTS!")
        print("================================================================================")
        return True


if __name__ == "__main__":
    orchestrator = FullLifecycleOrchestrator()
    orchestrator.start_pipeline("RHYNIA")
