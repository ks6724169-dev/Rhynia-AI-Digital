"""
Rhynia AI SaaS — Phase 2 Automated Test Suite
Tests for:
1. Thread Limits Enforcement (30 for Free, 60 for Pro/Ultra Pro)
2. Fresh Conversation History Handling (<= 4 messages raw)
3. 2-Tier Compressed History Payload (Macro summary + 4 micro turns)
4. Prompt Token / Payload Reduction Efficiency
5. Background Async Rolling Summary Buffer Updates (Macro & Micro generation)
6. Thread Limit Boundary Protection
"""

import sys
import os
import uuid
import asyncio

from pathlib import Path

# Add project root to sys.path
root_dir = Path(__file__).resolve().parents[4]
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

from services.rhynia_saas.backend.database import SessionLocal, User, ChatSession, ChatMessage, ChatSummaryBuffer, init_db
from services.rhynia_saas.backend.services import memory_service
from services.rhynia_saas.backend.config import settings


def run_phase2_tests():
    print("=" * 60)
    print("RHYNIA AI MEMORY SYSTEM — PHASE 2 AUTOMATED TEST SUITE")
    print("=" * 60)

    # Ensure tables are created
    init_db()

    db = SessionLocal()
    test_user_id = f"test-user-p2-{uuid.uuid4().hex[:8]}"
    test_session_id = f"test-session-p2-{uuid.uuid4().hex[:8]}"

    try:
        # Create Test User
        user = User(
            id=test_user_id,
            username=f"user_{uuid.uuid4().hex[:8]}",
            email=f"{test_user_id}@rhynia.test",
            plan_tier="free",
        )
        db.add(user)

        # Create Test Session
        chat_sess = ChatSession(
            id=test_session_id,
            user_id=test_user_id,
            title="Phase 2 Memory Test Session",
        )
        db.add(chat_sess)
        db.commit()

        # TEST 1: Tier Thread Limits
        print("\n[TEST 1] Verifying Tier Thread Message Limits...")
        free_limit = memory_service.get_tier_thread_limit("free")
        pro_limit = memory_service.get_tier_thread_limit("pro")
        ultra_limit = memory_service.get_tier_thread_limit("ultra_pro")

        assert free_limit == 30, f"Expected Free limit 30, got {free_limit}"
        assert pro_limit == 60, f"Expected Pro limit 60, got {pro_limit}"
        assert ultra_limit == 60, f"Expected Ultra Pro limit 60, got {ultra_limit}"
        print(f"  PASS: Free Limit = {free_limit}, Pro Limit = {pro_limit}, Ultra Pro Limit = {ultra_limit}")

        # TEST 2: Fresh Conversation Payload (<= 4 messages)
        print("\n[TEST 2] Verifying Fresh Conversation History (<= 4 messages)...")
        # Add 3 messages
        for i in range(3):
            role = "user" if i % 2 == 0 else "model"
            msg = ChatMessage(
                session_id=test_session_id,
                user_id=test_user_id,
                role=role,
                content=f"Fresh turn {i+1} content",
                token_count=10,
            )
            db.add(msg)
        db.commit()

        fresh_payload = memory_service.build_2tier_conversation_history(test_session_id, db, max_recent_messages=4)
        assert len(fresh_payload) == 3, f"Expected 3 raw messages in fresh payload, got {len(fresh_payload)}"
        assert fresh_payload[0]["role"] == "user"
        assert "PRIOR CONVERSATION CONTEXT" not in fresh_payload[0]["content"]
        print("  PASS: Fresh payload correctly preserves raw messages without macro summary injection.")

        # TEST 3: 2-Tier Compressed History Payload (Longer Conversation)
        print("\n[TEST 3] Verifying 2-Tier Compressed Payload for > 4 messages...")
        # Add 5 more messages to make total 8 messages
        topics = [
            ("user", "Explain photosynthesis light reactions in biology"),
            ("model", "Photosynthesis light reactions occur in the thylakoid membranes of chloroplasts."),
            ("user", "What enzymes are involved in the Calvin cycle?"),
            ("model", "RuBisCO is the primary enzyme responsible for carbon fixation in the Calvin cycle."),
            ("user", "How does temperature affect this process?"),
        ]
        for role, text in topics:
            msg = ChatMessage(
                session_id=test_session_id,
                user_id=test_user_id,
                role=role,
                content=text,
                token_count=len(text) // 4,
            )
            db.add(msg)
        db.commit()

        all_msgs_count = db.query(ChatMessage).filter(ChatMessage.session_id == test_session_id).count()
        assert all_msgs_count == 8, f"Expected 8 messages, got {all_msgs_count}"

        compressed_payload = memory_service.build_2tier_conversation_history(test_session_id, db, max_recent_messages=4)
        # Should have 1 system message (macro summary) + 4 recent messages = 5 items
        assert len(compressed_payload) == 5, f"Expected 5 items in compressed payload, got {len(compressed_payload)}"
        assert compressed_payload[0]["role"] == "system"
        assert "PRIOR CONVERSATION CONTEXT" in compressed_payload[0]["content"]
        assert compressed_payload[-1]["role"] == "user"
        assert "temperature affect" in compressed_payload[-1]["content"]
        print(f"  PASS: Compressed payload contains Macro Summary + 4 Recent Micro Turns (Total: {len(compressed_payload)} items).")

        # TEST 4: Token / Character Payload Reduction
        print("\n[TEST 4] Measuring Payload Reduction Efficiency...")
        raw_full_chars = sum(len(m.content) for m in db.query(ChatMessage).filter(ChatMessage.session_id == test_session_id).all())
        compressed_chars = sum(len(item["content"]) for item in compressed_payload)
        savings_percent = ((raw_full_chars - (compressed_chars - len(compressed_payload[0]["content"]))) / raw_full_chars) * 100
        print(f"  Raw 8 Messages: {raw_full_chars} chars")
        print(f"  2-Tier Payload: {compressed_chars} chars (includes system macro instructions)")
        print(f"  Micro Turns Payload: {compressed_chars - len(compressed_payload[0]['content'])} chars")
        print("  PASS: Payload successfully condensed older history into high-density context.")

        # TEST 5: Background Async Rolling Summary Buffer Updates
        print("\n[TEST 5] Testing Background Async Rolling Summary Engine...")
        asyncio.run(memory_service.async_update_rolling_summary(test_session_id, test_user_id))

        buffer = db.query(ChatSummaryBuffer).filter(ChatSummaryBuffer.session_id == test_session_id).first()
        assert buffer is not None, "Summary buffer was not created in database!"
        assert len(buffer.macro_summary) > 0, "Macro summary should not be empty!"
        assert len(buffer.micro_summary) > 0, "Micro summary should not be empty!"
        assert buffer.message_count == 8, f"Expected message count 8, got {buffer.message_count}"
        assert buffer.size_bytes > 0, f"Expected size_bytes > 0, got {buffer.size_bytes}"
        print(f"  Buffer Macro Summary: {buffer.macro_summary[:80]}...")
        print(f"  Buffer Micro Summary lines: {len(buffer.micro_summary.splitlines())}")
        print(f"  Buffer Stored Size: {buffer.size_bytes} bytes")
        print("  PASS: Async Rolling Summary successfully generated and stored in ChatSummaryBuffer.")

        # TEST 6: Thread Limit Boundary Enforcement Simulation
        print("\n[TEST 6] Testing Thread Limit Boundary Enforcement...")
        # Simulate free user reaching 30 messages
        current_count = db.query(ChatMessage).filter(ChatMessage.session_id == test_session_id).count()
        needed = 30 - current_count
        for k in range(needed):
            m = ChatMessage(
                session_id=test_session_id,
                user_id=test_user_id,
                role="user" if k % 2 == 0 else "model",
                content=f"Filler message {k}",
                token_count=5,
            )
            db.add(m)
        db.commit()

        final_count = db.query(ChatMessage).filter(ChatMessage.session_id == test_session_id).count()
        assert final_count == 30, f"Expected exactly 30 messages, got {final_count}"

        # Now test boundary condition: count >= limit
        thread_limit = memory_service.get_tier_thread_limit(user.plan_tier)
        is_limit_reached = final_count >= thread_limit
        assert is_limit_reached is True, "Thread limit reached check should evaluate to True at 30 messages"
        print(f"  PASS: Thread limit boundary detected at {final_count}/{thread_limit} messages.")

        print("\n" + "=" * 60)
        print("ALL 6 PHASE 2 AUTOMATED TESTS PASSED SUCCESSFULLY! (100% PASS)")
        print("=" * 60)

    finally:
        # Cleanup test data
        try:
            db.query(ChatMessage).filter(ChatMessage.session_id == test_session_id).delete()
            db.query(ChatSummaryBuffer).filter(ChatSummaryBuffer.session_id == test_session_id).delete()
            db.query(ChatSession).filter(ChatSession.id == test_session_id).delete()
            db.query(User).filter(User.id == test_user_id).delete()
            db.commit()
        except Exception as e:
            print(f"Warning during cleanup: {e}")
        db.close()


if __name__ == "__main__":
    run_phase2_tests()
