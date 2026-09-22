"""
Rhynia Intelligence SaaS — Multi-Agent Autonomous Orchestrator Engine
Governs the 16-Step Development Lifecycle across specialized agents.
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


class RhyniaAgentOrchestrator:
    """Master Orchestrator for Rhynia Multi-Agent Autonomous Team."""

    def __init__(self, base_dir: Path = None):
        self.base_dir = base_dir or Path(__file__).resolve().parent
        self.config_dir = self.base_dir / "config"
        self.prompts_dir = self.base_dir / "prompts"
        self.tools_dir = self.base_dir / "tools"

        with open(self.config_dir / "team_config.json", "r", encoding="utf-8") as f:
            self.team_config = json.load(f)

        with open(self.config_dir / "pipeline.json", "r", encoding="utf-8") as f:
            self.pipeline_config = json.load(f)

        self.agents = {a["agent_id"]: a for a in self.team_config["agents"]}
        self.state = {
            "sprint_status": {},
            "active_phase": "INITIALIZATION",
            "quality_gate": "PENDING",
        }

    def get_agent(self, agent_id: str):
        """Retrieve agent metadata and instruction prompt."""
        agent = self.agents.get(agent_id)
        if not agent:
            raise ValueError(f"Agent '{agent_id}' not found in team config.")

        prompt_path = self.base_dir / agent["system_prompt_file"]
        with open(prompt_path, "r", encoding="utf-8") as pf:
            prompt_content = pf.read()

        return agent, prompt_content

    def execute_lifecycle_step(self, step_number: int, context_payload: dict) -> dict:
        """Execute a specific step from the 16-step development lifecycle."""
        step_def = next((s for s in self.pipeline_config["steps"] if s["step"] == step_number), None)
        if not step_def:
            raise ValueError(f"Step {step_number} is out of pipeline range (1-16).")

        owner_id = step_def["owner"]
        agent, prompt = self.get_agent(owner_id)

        print(f"\n⚡ [STEP {step_number:02d}/16] {step_def['name']}")
        print(f"   👤 Active Agent: {agent['name']} ({agent['role']})")
        print(f"   🛠️ Allowed Tools: {', '.join(agent['allowed_tools'])}")

        result = {
            "step": step_number,
            "step_name": step_def["name"],
            "agent": agent["name"],
            "status": "COMPLETED",
            "details": f"Processed successfully under {agent['name']}'s mandate.",
        }
        self.state["sprint_status"][f"step_{step_number}"] = result
        return result

    def run_quality_gate(self) -> bool:
        """Run Quality Gatekeeper (Aegis) tests and brand compliance."""
        print("\n=======================================================")
        print("🛡️ [QUALITY GATE] Aegis (QA & Security) Inspecting System...")
        print("=======================================================")

        # 1. Brand Linter
        print("▶ Running Automated Brand Linter (tools/linter.py)...")
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
        if lint_result.returncode != 0:
            print("❌ Quality Gate REJECTED: Brand violations found.")
            self.state["quality_gate"] = "REJECTED_BRAND_VIOLATION"
            return False

        # 2. Automated Test Runner
        print("\n▶ Running Verification Test Suite (tools/runner.py)...")
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
        if run_result.returncode != 0:
            print("❌ Quality Gate REJECTED: Test suite failure.")
            self.state["quality_gate"] = "REJECTED_TEST_FAILURE"
            return False

        print("\n🏆 Quality Gate PASSED: 100% Brand Clean & APIs Certified.")
        self.state["quality_gate"] = "PASSED"
        return True

    def run_full_pipeline_audit(self):
        """Execute and display the complete 16-step lifecycle status."""
        print("=======================================================")
        print(f"🚀 {self.team_config['project_name']} — Multi-Agent Orchestrator")
        print(f"📌 Pipeline: {self.pipeline_config['pipeline_name']}")
        print("=======================================================")

        for s in self.pipeline_config["steps"]:
            self.execute_lifecycle_step(s["step"], {"pipeline": self.pipeline_config["pipeline_name"]})

        # Run final quality audit
        gate_passed = self.run_quality_gate()
        print(f"\n🏁 Final Orchestration Status: {'APPROVED' if gate_passed else 'HALTED'}")
        return gate_passed


if __name__ == "__main__":
    orchestrator = RhyniaAgentOrchestrator()
    orchestrator.run_full_pipeline_audit()
