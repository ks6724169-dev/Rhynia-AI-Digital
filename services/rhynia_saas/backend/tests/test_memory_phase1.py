import sys
import os
import io
import uuid
from pathlib import Path

# Set UTF-8 encoding for Windows console
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

# Add project root to sys.path
root_dir = Path(__file__).resolve().parents[4]
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from services.rhynia_saas.backend.config import settings
from services.rhynia_saas.backend.database import Base, User, ChatSession, UserMemoryFact, ChatSummaryBuffer
from services.rhynia_saas.backend.services import memory_service


def run_phase1_tests():
    print("=" * 60)
    print("[*] RHYNIA MEMORY SYSTEM - PHASE 1 VALIDATION TEST SUITE")
    print("=" * 60)

    # 1. Test In-Memory SQLite Database Setup
    print("\n[TEST 1] Setting up Database and creating tables...")
    test_engine = create_engine("sqlite:///:memory:", echo=False)
    TestingSessionLocal = sessionmaker(bind=test_engine)
    Base.metadata.create_all(bind=test_engine)
    db = TestingSessionLocal()
    print("  -> Tables created successfully in database!")

    # 2. Test Configuration Quotas
    print("\n[TEST 2] Verifying Master Memory Quotas...")
    assert settings.FREE_MEMORY_QUOTA_BYTES == 8 * 1024 * 1024, "Free quota must be 8MB"
    assert settings.PRO_MEMORY_QUOTA_BYTES == 16 * 1024 * 1024, "Pro quota must be 16MB"
    assert settings.ULTRA_PRO_MEMORY_QUOTA_BYTES == 25 * 1024 * 1024, "Ultra Pro quota must be 25MB"
    assert settings.FREE_TIER_THREAD_MESSAGE_LIMIT == 30, "Free thread limit must be 30"
    assert settings.PRO_TIER_THREAD_MESSAGE_LIMIT == 60, "Pro thread limit must be 60"
    print(f"  -> Free Tier Quota: {settings.FREE_MEMORY_QUOTA_BYTES / (1024*1024)} MB (Limit: {settings.FREE_TIER_THREAD_MESSAGE_LIMIT} msgs)")
    print(f"  -> Pro Tier Quota: {settings.PRO_MEMORY_QUOTA_BYTES / (1024*1024)} MB (Limit: {settings.PRO_TIER_THREAD_MESSAGE_LIMIT} msgs)")
    print(f"  -> Ultra Pro Quota: {settings.ULTRA_PRO_MEMORY_QUOTA_BYTES / (1024*1024)} MB (Limit: {settings.ULTRA_PRO_THREAD_MESSAGE_LIMIT} msgs)")
    print("  -> All quota configurations verified!")

    # 3. Create Mock Users
    print("\n[TEST 3] Creating Mock Users (Free & Pro)...")
    free_user = User(
        id=str(uuid.uuid4()),
        username="manish_free",
        email="free@rhynia.ai",
        plan_tier="free"
    )
    pro_user = User(
        id=str(uuid.uuid4()),
        username="manish_pro",
        email="pro@rhynia.ai",
        plan_tier="pro"
    )
    db.add_all([free_user, pro_user])
    db.commit()
    print(f"  -> Free user created: {free_user.id}")
    print(f"  -> Pro user created: {pro_user.id}")

    # 4. Test Long-Term Facts Persistence & Byte Counting
    print("\n[TEST 4] Testing Long-Term User Fact Persistence...")
    fact1 = memory_service.save_or_update_fact(
        user_id=free_user.id,
        fact_key="profession",
        fact_value="Software Developer & AI Researcher",
        category="profile",
        db=db
    )
    fact2 = memory_service.save_or_update_fact(
        user_id=free_user.id,
        fact_key="preferred_language",
        fact_value="Hindi and English mixed (Hinglish)",
        category="preference",
        db=db
    )
    assert fact1.size_bytes > 0, "Fact size must be computed"
    print(f"  -> Saved Fact 1: '{fact1.fact_key}' = '{fact1.fact_value}' ({fact1.size_bytes} bytes)")
    print(f"  -> Saved Fact 2: '{fact2.fact_key}' = '{fact2.fact_value}' ({fact2.size_bytes} bytes)")

    # Test update existing fact
    fact1_updated = memory_service.save_or_update_fact(
        user_id=free_user.id,
        fact_key="profession",
        fact_value="Lead AI Architect",
        category="profile",
        db=db
    )
    assert fact1_updated.fact_value == "Lead AI Architect"
    print(f"  -> Updated Fact 1 to: '{fact1_updated.fact_value}' ({fact1_updated.size_bytes} bytes)")

    # 5. Test 2-Tier Summary Buffer Creation & Updates
    print("\n[TEST 5] Testing Chat Summary Buffer Persistence...")
    chat_session = ChatSession(
        id=str(uuid.uuid4()),
        user_id=free_user.id,
        title="UPSC History Discussion"
    )
    db.add(chat_session)
    db.commit()

    buffer = memory_service.update_summary_buffer(
        session_id=chat_session.id,
        user_id=free_user.id,
        macro_summary="User is preparing a timeline for modern Indian history focusing on 1857 revolt.",
        micro_summary="- Discussed NCERT books.\n- Planned 2-3 hours daily study schedule.",
        message_count=12,
        last_summarized_message_id="msg_12345",
        db=db
    )
    assert buffer.size_bytes > 0, "Buffer size bytes must be computed"
    assert buffer.message_count == 12
    print(f"  -> Summary Buffer saved ({buffer.size_bytes} bytes for session {chat_session.id[:8]}...)")
    print(f"     Macro: '{buffer.macro_summary[:45]}...'")
    print(f"     Micro: '{buffer.micro_summary[:45]}...'")

    # 6. Test Memory Quota Calculation & Enforcement
    print("\n[TEST 6] Testing Live Memory Usage Calculation...")
    usage = memory_service.get_user_memory_usage(free_user.id, db)
    print("  -> Live Memory Telemetry:")
    print(f"     User Plan: {usage['plan_tier'].upper()}")
    print(f"     Quota: {usage['quota_mb']} MB ({usage['quota_bytes']} bytes)")
    print(f"     Used: {usage['total_used_bytes']} bytes ({usage['total_used_mb']} MB)")
    print(f"     Usage %: {usage['used_percentage']}%")
    print(f"     Facts Stored: {usage['facts_count']} ({usage['facts_bytes']} bytes)")
    print(f"     Summaries Stored: {usage['summaries_count']} ({usage['summaries_bytes']} bytes)")
    print(f"     Is Quota Exceeded: {usage['is_exceeded']}")

    assert usage["total_used_bytes"] == fact1_updated.size_bytes + fact2.size_bytes + buffer.size_bytes
    assert usage["is_exceeded"] is False
    assert memory_service.check_user_memory_quota(free_user, db) is True
    print("  -> Live memory calculation is 100% accurate!")

    # 7. Test Fact Deletion
    print("\n[TEST 7] Testing Memory Fact Deletion...")
    del_result = memory_service.delete_user_fact(free_user.id, fact2.id, db)
    assert del_result is True, "Fact deletion must succeed"
    remaining_facts = memory_service.get_user_facts(free_user.id, db)
    assert len(remaining_facts) == 1, "Only 1 fact should remain"
    print("  -> Fact successfully deleted! Remaining facts count: 1")

    # 8. Test Session Cascade Deletion
    print("\n[TEST 8] Testing Cascade Clean-up on Chat Deletion...")
    db.delete(chat_session)
    db.commit()
    remaining_buffers = db.query(ChatSummaryBuffer).filter(ChatSummaryBuffer.session_id == chat_session.id).first()
    assert remaining_buffers is None, "Summary buffer must be deleted with session cascade"
    print("  -> Cascade delete verified: deleting chat session cleanly deleted its summary buffer!")

    print("\n" + "=" * 60)
    print("[SUCCESS] ALL PHASE 1 TESTS PASSED WITH 100% SUCCESS!")
    print("=" * 60)


if __name__ == "__main__":
    run_phase1_tests()
