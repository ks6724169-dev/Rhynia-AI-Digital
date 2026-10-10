"""
Rhynia AI SaaS — Phase 4 Automated Test Suite
Tests for:
1. Past Recall Intent Detection (Hindi, Hinglish, English, Negative cases)
2. Cross-Session Semantic Search & Retrieval (Excluding active session)
3. Prompt Grounding Injection Block Formation (Zero overhead when not recalled)
4. Message Excerpt Fallback Search
5. Relevance Scoring and Ranking
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

from services.rhynia_saas.backend.database import (
    SessionLocal,
    User,
    ChatSession,
    ChatMessage,
    ChatSummaryBuffer,
    init_db,
)
from services.rhynia_saas.backend.services import memory_service


def run_phase4_tests():
    print("=" * 60)
    print("RHYNIA AI MEMORY SYSTEM — PHASE 4 AUTOMATED TEST SUITE")
    print("=" * 60)

    init_db()
    db = SessionLocal()

    test_user_id = f"test-user-p4-{uuid.uuid4().hex[:8]}"
    session_a_id = f"sess-docker-{uuid.uuid4().hex[:8]}"
    session_b_id = f"sess-history-{uuid.uuid4().hex[:8]}"
    active_session_id = f"sess-active-{uuid.uuid4().hex[:8]}"

    try:
        # Create Test User
        user = User(
            id=test_user_id,
            username=f"user_{uuid.uuid4().hex[:8]}",
            email=f"{test_user_id}@rhynia.test",
            plan_tier="free",
        )
        db.add(user)

        # Create Past Session A (Docker)
        sess_a = ChatSession(
            id=session_a_id,
            user_id=test_user_id,
            title="Docker & Kubernetes Architecture",
        )
        db.add(sess_a)

        buf_a = ChatSummaryBuffer(
            session_id=session_a_id,
            user_id=test_user_id,
            macro_summary="User and Rhynia designed multi-stage Dockerfiles for FastAPI and configured Kubernetes Pod manifests with resource limits.",
            micro_summary="- Discussed Docker multi-stage builds.\n- Configured k8s replica sets.",
            message_count=12,
            size_bytes=220,
        )
        db.add(buf_a)

        # Create Past Session B (UPSC History)
        sess_b = ChatSession(
            id=session_b_id,
            user_id=test_user_id,
            title="UPSC Ancient History Study Plan",
        )
        db.add(sess_b)

        buf_b = ChatSummaryBuffer(
            session_id=session_b_id,
            user_id=test_user_id,
            macro_summary="Reviewed Indus Valley Civilization trade routes, Harappan drainage system, and Vedic period literature for UPSC Prelims.",
            micro_summary="- Examined Mohenjo-daro archaeological findings.\n- Structured 30-day revision strategy.",
            message_count=10,
            size_bytes=210,
        )
        db.add(buf_b)

        # Create Active Current Session
        sess_active = ChatSession(
            id=active_session_id,
            user_id=test_user_id,
            title="Current Working Session",
        )
        db.add(sess_active)
        db.commit()

        # TEST 1: Recall Intent Detection
        print("\n[TEST 1] Testing Past Recall Intent Detection across Languages...")
        positive_queries = [
            "Pichli chat me humne kya discuss kiya tha?",
            "Last session me humne Docker deploy kiya tha, yaad hai?",
            "What did we talk about earlier regarding Kubernetes?",
            "Do you remember the Harappan trade routes we talked about?",
            "Earlier you shared a formula with me, can you recall it?",
            "Humne pichle baar ancient history me kya padha tha?",
        ]
        for q in positive_queries:
            is_recall = memory_service.is_past_recall_query(q)
            assert is_recall is True, f"Failed to classify recall intent for: '{q}'"
            print(f"  Classified positive: '{q[:40]}...' -> True")

        negative_queries = [
            "What is the capital of France?",
            "Write a quick python script to sort a list",
            "Explain how black holes work",
            "Mera naam Manish hai",
            "Hello, good morning!",
        ]
        for nq in negative_queries:
            is_recall = memory_service.is_past_recall_query(nq)
            assert is_recall is False, f"Falsely classified as recall: '{nq}'"
            print(f"  Classified negative: '{nq[:40]}...' -> False")
        print("  PASS: Recall intent classifier has 100% precision on test cases.")

        # TEST 2: Cross-Session Semantic Search & Retrieval
        print("\n[TEST 2] Testing Cross-Session Retrieval and Active Session Exclusion...")
        docker_results = memory_service.search_past_conversations(
            user_id=test_user_id,
            query="pichli chat me humne Docker ke baare me kya discuss kiya tha?",
            exclude_session_id=active_session_id,
            db=db,
            limit=3,
        )
        assert len(docker_results) > 0, "Expected at least 1 result for Docker query"
        top_match = docker_results[0]
        assert top_match["session_id"] == session_a_id, f"Expected Session A ({session_a_id}), got {top_match['session_id']}"
        assert "Docker & Kubernetes" in top_match["session_title"]
        assert "multi-stage Dockerfiles" in top_match["recalled_snippet"]
        assert top_match["session_id"] != active_session_id, "Current active session must be excluded from prior recall"
        print(f"  PASS: Retrieved '{top_match['session_title']}' with score {top_match['score']}.")

        history_results = memory_service.search_past_conversations(
            user_id=test_user_id,
            query="Do you remember what we talked about Harappan drainage and Indus Valley?",
            exclude_session_id=active_session_id,
            db=db,
            limit=3,
        )
        assert len(history_results) > 0
        assert history_results[0]["session_id"] == session_b_id
        assert "Indus Valley" in history_results[0]["recalled_snippet"]
        print(f"  PASS: Retrieved '{history_results[0]['session_title']}' for ancient history query.")

        # TEST 3: System Prompt Injection Formatting
        print("\n[TEST 3] Testing On-Demand Grounding Injection Block Formation...")
        recall_prompt_block = memory_service.retrieve_relevant_prior_context(
            user_id=test_user_id,
            current_session_id=active_session_id,
            query="Pichli chat me humne Docker architecture ke bare me kya plan kiya tha?",
            db=db,
        )
        assert "CROSS-SESSION RECALLED MEMORY" in recall_prompt_block
        assert "Docker & Kubernetes Architecture" in recall_prompt_block
        assert "multi-stage Dockerfiles" in recall_prompt_block
        print("  Sample Injected Recall Prompt Block:")
        for line in recall_prompt_block.strip().split("\n")[:5]:
            print(f"    {line}")
        print("  PASS: Formatted grounding block constructed accurately.")

        # Non-recall query should have ZERO prompt overhead
        no_overhead = memory_service.retrieve_relevant_prior_context(
            user_id=test_user_id,
            current_session_id=active_session_id,
            query="Write a bubble sort algorithm in C++",
            db=db,
        )
        assert no_overhead == "", "Non-recall queries must yield empty string (0 token overhead)"
        print("  PASS: Normal queries experience 0 token overhead (on-demand gating verified).")

        # TEST 4: Fallback to Raw Message Search
        print("\n[TEST 4] Testing Fallback to Raw ChatMessage Excerpts...")
        # Create a session WITHOUT summary buffer but with detailed messages
        session_c_id = f"sess-raw-{uuid.uuid4().hex[:8]}"
        sess_c = ChatSession(
            id=session_c_id,
            user_id=test_user_id,
            title="Unsummarized Session",
        )
        db.add(sess_c)
        msg_c = ChatMessage(
            session_id=session_c_id,
            user_id=test_user_id,
            role="model",
            content="Here is your unique registration token: RHYNIA-AUTH-SECURE-998811",
            token_count=15,
        )
        db.add(msg_c)
        db.commit()

        raw_match = memory_service.search_past_conversations(
            user_id=test_user_id,
            query="What was my registration token earlier?",
            exclude_session_id=active_session_id,
            db=db,
            limit=2,
        )
        assert len(raw_match) > 0, "Should have retrieved message from unsummarized session"
        assert "RHYNIA-AUTH-SECURE-998811" in raw_match[0]["recalled_snippet"]
        print(f"  PASS: Successfully recalled from raw message: '{raw_match[0]['recalled_snippet']}'")

        print("\n" + "=" * 60)
        print("ALL 4 PHASE 4 AUTOMATED TESTS PASSED SUCCESSFULLY! (100% PASS)")
        print("=" * 60)

    finally:
        # Cleanup
        try:
            db.query(ChatMessage).filter(ChatMessage.user_id == test_user_id).delete()
            db.query(ChatSummaryBuffer).filter(ChatSummaryBuffer.user_id == test_user_id).delete()
            db.query(ChatSession).filter(ChatSession.user_id == test_user_id).delete()
            db.query(User).filter(User.id == test_user_id).delete()
            db.commit()
        except Exception as e:
            print(f"Cleanup error: {e}")
        db.close()


if __name__ == "__main__":
    run_phase4_tests()
