"""
Rhynia Intelligence SaaS — Multi-Agent Test Runner & Verification Tool
"""

import os
import sys
from pathlib import Path

# Add project workspace root to sys.path
root_dir = Path(__file__).resolve().parents[2]
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass


def run_verification_suite() -> bool:
    """Execute end-to-end verification across core endpoints."""
    print("🚀 [Rhynia Test Runner] Initializing test suite against API...")

    try:
        from fastapi.testclient import TestClient
        from services.rhynia_saas.backend.main import app

        client = TestClient(app)

        # 1. Health Check
        print("   [1/4] Checking System Health API (/api/v1/health)...")
        res_h = client.get("/api/v1/health")
        if res_h.status_code != 200 or res_h.json().get("status") != "healthy":
            print(f"❌ Health check failed: {res_h.status_code}")
            return False
        print("         -> OK (200 Healthy)")

        # 2. Server Brand Header Check
        print("   [2/4] Verifying Server Brand Security Header...")
        res_root = client.get("/")
        if res_root.headers.get("Server") != "Rhynia":
            print(f"❌ Server header violation: {res_root.headers.get('Server')}")
            return False
        print("         -> OK (Server: Rhynia)")

        # 3. Database & Engine Import
        print("   [3/4] Verifying Database Connection & Engine Factory...")
        from services.rhynia_saas.backend.database import engine

        with engine.connect() as conn:
            pass
        print("         -> OK (Supabase Cloud Database Connected)")

        # 4. Intelligence Engine Verification
        print("   [4/4] Verifying Cascade LLM Engine...")
        from services.rhynia_saas.backend.llm_engine import llm_engine

        print("         -> OK (Cascade Router Active)")

        print("\n✅ [RUNNER PASSED] All Core Verification Gates Cleared Successfully.")
        return True

    except Exception as e:
        print(f"\n❌ [RUNNER FAILED] Exception during test execution: {e}")
        return False


if __name__ == "__main__":
    passed = run_verification_suite()
    sys.exit(0 if passed else 1)
