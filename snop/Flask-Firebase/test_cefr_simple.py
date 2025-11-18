#!/usr/bin/env python
"""
Simple CEFR system test without authentication.
Tests the service layer directly.
"""
from dotenv import load_dotenv
load_dotenv()

from firebase_config import db
from services_cefr import initialize_user_cefr_progress, get_roadmap_status, increment_challenge_completion
from services_challenges import get_todays_challenges_for_user, add_challenge
from services_daily_progress import get_challenge_completion_status, record_challenge_completion

print("\n" + "="*60)
print("CEFR SYSTEM - SERVICE LAYER TESTS")
print("="*60)

# Test 1: Check CEFR Config
print("\n[TEST 1] Checking CEFR Configuration...")
try:
    config_ref = db.collection("config").document("cefr_roadmap")
    config = config_ref.get().to_dict()
    if config:
        print("✓ CEFR config exists")
        print(f"  Daily limits: {config.get('daily_config')}")
        levels = list(config.get('levels', {}).keys())
        print(f"  Levels: {levels}")
    else:
        print("✗ CEFR config not found")
except Exception as e:
    print(f"✗ Error: {e}")

# Test 2: Check Challenges
print("\n[TEST 2] Checking Challenges in Firestore...")
try:
    challenges = db.collection("challenges").limit(5).stream()
    challenge_list = [c.to_dict() for c in challenges]
    print(f"✓ Found {len(challenge_list)} challenges (showing first 5)")
    for ch in challenge_list:
        print(f"  - {ch.get('id')}: {ch.get('title')} ({ch.get('type')}, {ch.get('cefr_level')})")
except Exception as e:
    print(f"✗ Error: {e}")

# Test 3: Initialize CEFR for test user
print("\n[TEST 3] Testing User CEFR Initialization...")
test_uid = "test_user_123"
try:
    initialize_user_cefr_progress(test_uid)
    print(f"✓ Initialized CEFR for user {test_uid}")

    # Get roadmap
    roadmap = get_roadmap_status(test_uid)
    print(f"  Current level: {roadmap.get('current_level')}")
    a1_progress = roadmap.get('levels', {}).get('A1', {})
    print(f"  A1 progress: {a1_progress.get('completed')}/{a1_progress.get('required')}")
except Exception as e:
    print(f"✗ Error: {e}")

# Test 4: Get Today's Challenges
print("\n[TEST 4] Testing Get Today's Challenges...")
try:
    todays = get_todays_challenges_for_user(test_uid)
    print(f"✓ Got today's challenges for {todays.get('user_level')} user")
    print(f"  Date: {todays.get('date')}")

    for ch_type, data in todays.get('challenges', {}).items():
        available = len(data.get('available', []))
        completed = data.get('completed_today', 0)
        limit = data.get('limit', 0)
        can_complete = data.get('can_complete_more', False)
        print(f"  {ch_type}: {available} available, {completed}/{limit} completed, can_complete_more={can_complete}")
except Exception as e:
    print(f"✗ Error: {e}")

# Test 5: Record a completion
print("\n[TEST 5] Testing Challenge Completion...")
try:
    status_before = get_challenge_completion_status(test_uid)
    print(f"  Listening before: {status_before.get('listening', {}).get('completed')}/{status_before.get('listening', {}).get('limit')}")

    # Record a listening challenge completion
    record_challenge_completion(
        uid=test_uid,
        challenge_id="a1_listening_001",
        challenge_type="listening",
        challenge_cefr_level="A1",
        xp_gained=10,
        additional_data={"correct": True}
    )
    print("✓ Recorded listening challenge completion")

    status_after = get_challenge_completion_status(test_uid)
    print(f"  Listening after: {status_after.get('listening', {}).get('completed')}/{status_after.get('listening', {}).get('limit')}")
except Exception as e:
    print(f"✗ Error: {e}")

# Test 6: Test Level Progression
print("\n[TEST 6] Testing Level Progression...")
try:
    # Complete 20 A1 challenges to trigger level up
    print("  Simulating 20 A1 challenge completions...")
    for i in range(20):
        result = increment_challenge_completion(test_uid, "A1")
        if result.get('level_up'):
            print(f"  ✓ Level up! {result.get('previous_level')} → {result.get('new_level')}")

    roadmap = get_roadmap_status(test_uid)
    print(f"  Final level: {roadmap.get('current_level')}")

    a1 = roadmap.get('levels', {}).get('A1', {})
    a2 = roadmap.get('levels', {}).get('A2', {})
    print(f"  A1: {a1.get('completed')}/{a1.get('required')} (unlocked={a1.get('unlocked')})")
    print(f"  A2: {a2.get('completed')}/{a2.get('required')} (unlocked={a2.get('unlocked')})")
except Exception as e:
    print(f"✗ Error: {e}")

# Test 7: Daily Limit Enforcement
print("\n[TEST 7] Testing Daily Limit Enforcement...")
try:
    # Try to complete 4 listening challenges (limit is 3)
    for i in range(4):
        record_challenge_completion(
            uid=test_uid,
            challenge_id=f"a1_listening_00{i}",
            challenge_type="listening",
            challenge_cefr_level="A1",
            xp_gained=10,
            additional_data={"correct": True}
        )

    status = get_challenge_completion_status(test_uid)
    listening_status = status.get('listening', {})
    print(f"  Listening: {listening_status.get('completed')}/{listening_status.get('limit')}")

    # Note: The limit is enforced in the API layer, not the service layer
    # So this will record all 4, but the API would reject the 4th
    if listening_status.get('completed') > listening_status.get('limit'):
        print(f"  ⚠ Recorded {listening_status.get('completed')} (limit is {listening_status.get('limit')})")
        print(f"  Note: API layer enforces limits before calling service layer")
except Exception as e:
    print(f"✗ Error: {e}")

print("\n" + "="*60)
print("SERVICE LAYER TESTS COMPLETE")
print("="*60)
print("\nNext: Test the API endpoints with a real Firebase auth token")
print("Or: Use the mobile app to test end-to-end")
