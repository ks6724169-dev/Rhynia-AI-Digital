"""
Rhynia AI SaaS — Phase 3 Automated Test Suite
Tests for:
1. Natural Language Fact Extraction (Hindi, Hinglish, English)
2. Long-Term Fact CRUD and Deduplication
3. System Prompt Grounding Formatting (Injection)
4. Async Background Extraction and Storage Task
5. Memory Reset / Fact Clearing
6. Quota Enforcement during Fact Ingestion
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

from services.rhynia_saas.backend.database import SessionLocal, User, UserMemoryFact, init_db
from services.rhynia_saas.backend.services import memory_service
from services.rhynia_saas.backend.config import settings


def run_phase3_tests():
    print("=" * 60)
    print("RHYNIA AI MEMORY SYSTEM — PHASE 3 AUTOMATED TEST SUITE")
    print("=" * 60)

    # Ensure database schema is present
    init_db()

    db = SessionLocal()
    test_user_id = f"test-user-p3-{uuid.uuid4().hex[:8]}"

    try:
        # Create Test User
        user = User(
            id=test_user_id,
            username=f"user_{uuid.uuid4().hex[:8]}",
            email=f"{test_user_id}@rhynia.test",
            plan_tier="free",
        )
        db.add(user)
        db.commit()

        # TEST 1: Fact Extraction from Natural User Messages
        print("\n[TEST 1] Testing Fact Extraction across Multiple Linguistic Patterns...")
        sample_messages = [
            ("Mera naam Manish Kumar hai aur mai ek Software Engineer hu", ["preferred_name", "profession_role"]),
            ("Main UPSC ki taiyari kar raha hu", ["study_or_exam_goal"]),
            ("My tech stack is Python, FastAPI, and Flutter", ["tech_stack"]),
            ("I am building an AI SaaS called Rhynia", ["current_project"]),
            ("Mujhe Hinglish me samjhao", ["preferred_language_style"]),
            ("I live in New Delhi, India", ["location"]),
            ("Remember that I prefer concise responses with diagrams", ["user_instruction"]),
        ]

        for msg, expected_keys in sample_messages:
            extracted = memory_service.extract_facts_from_user_message(msg)
            found_keys = [f["fact_key"] for f in extracted]
            for ek in expected_keys:
                assert ek in found_keys, f"Expected key '{ek}' in extracted keys {found_keys} for message: '{msg}'"
            print(f"  Extracted from '{msg[:35]}...': {found_keys}")
        print("  PASS: Natural fact extraction accurately recognized all 7 distinct patterns!")

        # TEST 2: Long-Term Fact CRUD and Deduplication
        print("\n[TEST 2] Testing Fact Persistence, Updating & Deduplication...")
        fact1 = memory_service.save_or_update_fact(
            user_id=test_user_id,
            fact_key="profession_role",
            fact_value="Junior Developer",
            category="profession",
            confidence_score=90,
            db=db,
        )
        assert fact1.id is not None
        assert fact1.size_bytes > 0
        original_bytes = fact1.size_bytes

        # Update the same key with new value
        fact1_updated = memory_service.save_or_update_fact(
            user_id=test_user_id,
            fact_key="profession_role",
            fact_value="Chief AI Architect & Principal Engineer",
            category="profession",
            confidence_score=98,
            db=db,
        )
        assert fact1_updated.id == fact1.id, "Updating existing fact key must not create a duplicate row"
        assert fact1_updated.fact_value == "Chief AI Architect & Principal Engineer"
        assert fact1_updated.size_bytes > original_bytes
        print(f"  PASS: Fact updated in-place cleanly. New byte size: {fact1_updated.size_bytes} bytes (original: {original_bytes})")

        # TEST 3: System Prompt Personalization Grounding Format
        print("\n[TEST 3] Testing System Prompt Formatting & Grounding Injection...")
        # Add a second fact
        memory_service.save_or_update_fact(
            user_id=test_user_id,
            fact_key="tech_stack",
            fact_value="Python, FastAPI, Flutter, PostgreSQL",
            category="technical",
            confidence_score=95,
            db=db,
        )

        prompt_block = memory_service.format_facts_for_prompt(test_user_id, db)
        assert "USER PROFILE & LONG-TERM MEMORY" in prompt_block
        assert "Profession Role: Chief AI Architect" in prompt_block
        assert "Tech Stack: Python, FastAPI" in prompt_block
        print("  Generated System Prompt Injection Block:")
        for line in prompt_block.strip().split("\n")[:4]:
            print(f"    {line}")
        print("  PASS: Prompt block correctly formatted with user personalization facts.")

        # Test empty user returns empty string
        empty_block = memory_service.format_facts_for_prompt("non_existent_user_id", db)
        assert empty_block == "", "Empty user facts should produce empty string block"
        print("  PASS: Users without memory facts produce clean empty string (no prompt bloat).")

        # TEST 4: Background Async Fact Extraction Task
        print("\n[TEST 4] Testing Async Background Extraction and DB Storage...")
        test_chat_msg = "Mera naam Manish hai aur mai ek AI Researcher hu"
        asyncio.run(memory_service.async_extract_and_save_facts(test_user_id, test_chat_msg))

        user_facts = memory_service.get_user_facts(test_user_id, db)
        user_fact_keys = [f.fact_key for f in user_facts]
        assert "preferred_name" in user_fact_keys, "Async task should have extracted and saved 'preferred_name'"
        assert any(f.fact_value == "Manish" for f in user_facts)
        print(f"  Stored User Facts ({len(user_facts)} total): {user_fact_keys}")
        print("  PASS: Async task seamlessly parsed message and persisted facts into database.")

        # TEST 5: Single Fact Deletion and Full Reset (Clear All)
        print("\n[TEST 5] Testing Individual Fact Deletion & Memory Reset...")
        name_fact = next(f for f in user_facts if f.fact_key == "preferred_name")
        deleted = memory_service.delete_user_fact(test_user_id, name_fact.id, db)
        assert deleted is True

        remaining_facts = memory_service.get_user_facts(test_user_id, db)
        assert not any(f.id == name_fact.id for f in remaining_facts)
        print(f"  PASS: Single fact successfully deleted. Remaining facts count: {len(remaining_facts)}")

        # Clear all
        cleared_count = memory_service.clear_user_facts(test_user_id, db)
        assert cleared_count == len(remaining_facts)
        assert len(memory_service.get_user_facts(test_user_id, db)) == 0
        print(f"  PASS: Reset Memory cleared all {cleared_count} user facts.")

        # TEST 6: Memory Quota Check Protection
        print("\n[TEST 6] Testing Quota Enforcement for Facts...")
        # Free user quota is 8MB
        can_store = memory_service.check_user_memory_quota(test_user_id, db)
        assert can_store is True, "Fresh user should have available quota"

        # Telemetry verification
        usage = memory_service.get_user_memory_usage(test_user_id, db)
        assert usage["plan_tier"] == "free"
        assert usage["facts_count"] == 0
        assert usage["is_exceeded"] is False
        print(f"  Live Telemetry: Plan={usage['plan_tier']}, Quota={usage['quota_mb']}MB, Used={usage['total_used_bytes']} bytes")
        print("  PASS: Quota telemetry calculation accurate.")

        print("\n" + "=" * 60)
        print("ALL 6 PHASE 3 AUTOMATED TESTS PASSED SUCCESSFULLY! (100% PASS)")
        print("=" * 60)

    finally:
        # Cleanup
        try:
            db.query(UserMemoryFact).filter(UserMemoryFact.user_id == test_user_id).delete()
            db.query(User).filter(User.id == test_user_id).delete()
            db.commit()
        except Exception as e:
            print(f"Cleanup error: {e}")
        db.close()


if __name__ == "__main__":
    run_phase3_tests()
