"""
Rhynia AI SaaS — Phase 5 Automated Test Suite
Tests for:
1. Memory Profile / Telemetry API (GET /api/v1/memory/profile)
2. Manual Fact Creation API (POST /api/v1/memory/facts)
3. Stored Facts Listing API (GET /api/v1/memory/facts)
4. Cross-Session Memory Search API (GET /api/v1/memory/search)
5. Individual Fact Deletion API (DELETE /api/v1/memory/facts/{id})
6. Full Memory Reset API (DELETE /api/v1/memory/facts)
"""

import sys
import os
import uuid
from pathlib import Path

# Add project root to sys.path
root_dir = Path(__file__).resolve().parents[4]
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

from fastapi.testclient import TestClient
from services.rhynia_saas.backend.main import app
from services.rhynia_saas.backend.database import (
    SessionLocal,
    User,
    ChatSession,
    ChatMessage,
    ChatSummaryBuffer,
    UserMemoryFact,
    init_db,
)
from services.rhynia_saas.backend.auth import create_access_token


def run_phase5_tests():
    print("=" * 60)
    print("RHYNIA AI MEMORY SYSTEM — PHASE 5 AUTOMATED TEST SUITE")
    print("=" * 60)

    init_db()
    db = SessionLocal()

    test_user_id = f"test-user-p5-{uuid.uuid4().hex[:8]}"
    test_session_id = f"test-sess-p5-{uuid.uuid4().hex[:8]}"

    try:
        # Create Test User
        user = User(
            id=test_user_id,
            username=f"user_{uuid.uuid4().hex[:8]}",
            email=f"{test_user_id}@rhynia.test",
            plan_tier="pro",
        )
        db.add(user)

        # Create Test Session and Summary Buffer
        sess = ChatSession(
            id=test_session_id,
            user_id=test_user_id,
            title="FastAPI Microservices Architecture",
        )
        db.add(sess)

        buf = ChatSummaryBuffer(
            session_id=test_session_id,
            user_id=test_user_id,
            macro_summary="Configured OAuth2 JWT authentication and asynchronous background tasks in FastAPI.",
            micro_summary="- Built token auth.\n- Designed summary worker.",
            message_count=6,
            size_bytes=180,
        )
        db.add(buf)
        db.commit()

        # Generate Test Auth Token
        token = create_access_token(data={"sub": test_user_id})
        headers = {"Authorization": f"Bearer {token}"}
        client = TestClient(app)

        # TEST 1: Memory Profile / Telemetry Endpoint
        print("\n[TEST 1] Testing Memory Profile Telemetry (GET /api/v1/memory/profile)...")
        res_profile = client.get("/api/v1/memory/profile", headers=headers)
        assert res_profile.status_code == 200, f"Expected 200, got {res_profile.status_code}: {res_profile.text}"
        profile_data = res_profile.json()
        assert profile_data["plan_tier"] == "pro"
        assert profile_data["quota_mb"] == 16.0
        assert profile_data["summary_buffers_count"] == 1
        assert profile_data["is_quota_exceeded"] is False
        print(f"  PASS: Telemetry retrieved: Quota={profile_data['quota_mb']}MB, Used={profile_data['total_used_bytes']} bytes, Buffers={profile_data['summary_buffers_count']}")

        # TEST 2: Manual Fact Creation Endpoint
        print("\n[TEST 2] Testing Fact Creation (POST /api/v1/memory/facts)...")
        fact_payload = {
            "fact_key": "preferred_language_style",
            "fact_value": "Clean Hindi and English mixed with bullet points",
            "category": "preferences"
        }
        res_create = client.post("/api/v1/memory/facts", headers=headers, json=fact_payload)
        assert res_create.status_code == 200, f"Expected 200, got {res_create.status_code}: {res_create.text}"
        created_fact = res_create.json()
        assert created_fact["fact_key"] == "preferred_language_style"
        assert created_fact["size_bytes"] > 0
        fact_id = created_fact["id"]
        print(f"  PASS: Created fact id={fact_id} ({created_fact['size_bytes']} bytes).")

        # TEST 3: Facts Listing Endpoint
        print("\n[TEST 3] Testing Facts Listing (GET /api/v1/memory/facts)...")
        res_list = client.get("/api/v1/memory/facts", headers=headers)
        assert res_list.status_code == 200
        facts = res_list.json()
        assert len(facts) >= 1
        assert any(f["id"] == fact_id for f in facts)
        print(f"  PASS: Retrieved {len(facts)} memory facts.")

        # TEST 4: Cross-Session Search Endpoint
        print("\n[TEST 4] Testing Cross-Session Memory Search (GET /api/v1/memory/search)...")
        res_search = client.get("/api/v1/memory/search?q=FastAPI+authentication", headers=headers)
        assert res_search.status_code == 200
        search_results = res_search.json()
        assert len(search_results) > 0, "Expected at least 1 search match for 'FastAPI authentication'"
        assert search_results[0]["session_id"] == test_session_id
        assert "FastAPI" in search_results[0]["session_title"]
        print(f"  PASS: Memory search matched session '{search_results[0]['session_title']}' with score {search_results[0]['score']}.")

        # TEST 5: Single Fact Deletion Endpoint
        print("\n[TEST 5] Testing Fact Deletion (DELETE /api/v1/memory/facts/{id})...")
        res_del = client.delete(f"/api/v1/memory/facts/{fact_id}", headers=headers)
        assert res_del.status_code == 200
        assert res_del.json()["status"] == "success"

        # Verify fact is gone
        res_list_after = client.get("/api/v1/memory/facts", headers=headers)
        assert not any(f["id"] == fact_id for f in res_list_after.json())
        print("  PASS: Single fact successfully deleted via REST API.")

        # TEST 6: Memory Reset (Clear All Facts) Endpoint
        print("\n[TEST 6] Testing Full Memory Reset (DELETE /api/v1/memory/facts)...")
        # Add 2 facts first
        client.post("/api/v1/memory/facts", headers=headers, json={"fact_key": "role", "fact_value": "AI Developer"})
        client.post("/api/v1/memory/facts", headers=headers, json={"fact_key": "stack", "fact_value": "Python, Flutter"})

        res_clear = client.delete("/api/v1/memory/facts", headers=headers)
        assert res_clear.status_code == 200
        assert res_clear.json()["status"] == "success"

        # Verify 0 facts remaining
        res_empty = client.get("/api/v1/memory/facts", headers=headers)
        assert len(res_empty.json()) == 0
        print("  PASS: Reset memory endpoint cleared all facts successfully.")

        print("\n" + "=" * 60)
        print("ALL 6 PHASE 5 AUTOMATED TESTS PASSED SUCCESSFULLY! (100% PASS)")
        print("=" * 60)

    finally:
        # Cleanup
        try:
            db.query(ChatMessage).filter(ChatMessage.user_id == test_user_id).delete()
            db.query(ChatSummaryBuffer).filter(ChatSummaryBuffer.user_id == test_user_id).delete()
            db.query(ChatSession).filter(ChatSession.user_id == test_user_id).delete()
            db.query(UserMemoryFact).filter(UserMemoryFact.user_id == test_user_id).delete()
            db.query(User).filter(User.id == test_user_id).delete()
            db.commit()
        except Exception as e:
            print(f"Cleanup error: {e}")
        db.close()


if __name__ == "__main__":
    run_phase5_tests()
