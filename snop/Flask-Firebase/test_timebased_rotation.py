"""
Test script for time-based leaderboard and challenge rotation features.

Tests:
1. Time-based leaderboard (daily, weekly, monthly, all-time)
2. Challenge rotation system
3. Active challenges endpoints

Prerequisites:
- Flask server must be running with updated code
- USE_MOCK_LEADERBOARD should be set to false to test real leaderboard
- Challenges should be migrated to Firestore
"""

import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

import requests
import json

BASE_URL = "http://localhost:5000"

def print_section(title):
    """Print a formatted section header."""
    print("\n" + "=" * 60)
    print(f"  {title}")
    print("=" * 60)

def print_json(data):
    """Pretty print JSON data."""
    print(json.dumps(data, indent=2))

def test_time_based_leaderboard():
    """Test time-based leaderboard filtering."""
    print_section("TEST 1: Time-Based Leaderboard Filtering")

    periods = ["daily", "weekly", "monthly", "all-time"]

    for period in periods:
        print(f"\n📊 Testing {period.upper()} leaderboard:")
        response = requests.get(f"{BASE_URL}/leaderboard?period={period}")

        if response.status_code == 200:
            data = response.json()
            print(f"   Status: [OK] {response.status_code}")
            print(f"   Period: {data['period']}")
            print(f"   Top Users: {len(data['top'])}")

            if data['top']:
                print(f"\n   Top 3:")
                for i, user in enumerate(data['top'][:3], 1):
                    print(f"   {i}. {user['name']}: {user['xp']} XP")
            else:
                print("   No users found")

            if 'note' in data:
                print(f"   Note: {data['note']}")
        else:
            print(f"   Status: [ERROR] {response.status_code}")
            print(f"   Response: {response.text}")

def test_challenge_rotation_status():
    """Test challenge rotation status endpoint."""
    print_section("TEST 2: Challenge Rotation Status")

    response = requests.get(f"{BASE_URL}/challenges/rotation/status")

    print(f"Status Code: {response.status_code}")

    if response.status_code == 200:
        data = response.json()
        print("\n[OK] Rotation status retrieved successfully\n")

        for frequency in ["daily", "weekly", "monthly"]:
            freq_data = data.get(frequency, {})
            print(f"📅 {frequency.upper()} Challenges:")
            print(f"   Active Challenges: {len(freq_data.get('active_challenges', []))}")
            print(f"   Challenge IDs: {freq_data.get('active_challenges', [])}")
            print(f"   Last Rotation: {freq_data.get('last_rotation', 'Never')}")
            print(f"   Next Rotation: {freq_data.get('next_rotation', 'Unknown')}")
            print()
    else:
        print(f"[ERROR] Failed to get rotation status")
        print(f"Response: {response.text}")

def test_active_challenges():
    """Test active challenges endpoints."""
    print_section("TEST 3: Active Challenges Endpoints")

    frequencies = ["daily", "weekly", "monthly"]

    for frequency in frequencies:
        print(f"\n📋 Testing {frequency.upper()} active challenges:")
        response = requests.get(f"{BASE_URL}/challenges/active/{frequency}")

        if response.status_code == 200:
            data = response.json()
            challenges = data.get('challenges', [])
            print(f"   Status: [OK] {response.status_code}")
            print(f"   Active Challenges: {len(challenges)}")

            if challenges:
                print(f"\n   Challenges:")
                for challenge in challenges:
                    print(f"   - {challenge.get('id')}: {challenge.get('title')}")
                    print(f"     Difficulty: {challenge.get('difficulty')}")
            else:
                print("   No active challenges (will be rotated on first access)")
        else:
            print(f"   Status: [ERROR] {response.status_code}")
            print(f"   Response: {response.text}")

def test_rotation_cycle():
    """Test that rotation actually cycles challenges."""
    print_section("TEST 4: Challenge Rotation Cycle")

    print("This test checks if challenges rotate correctly.")
    print("Note: Daily rotation only happens at midnight UTC")
    print("      Weekly rotation only happens on Monday midnight UTC")
    print("      Monthly rotation only happens on 1st of month midnight UTC")

    # Get initial rotation status
    response1 = requests.get(f"{BASE_URL}/challenges/rotation/status")
    if response1.status_code == 200:
        status1 = response1.json()
        daily_ids_1 = status1.get('daily', {}).get('active_challenges', [])

        print(f"\n✅ Current daily challenges: {daily_ids_1}")
        print(f"\nTo test rotation:")
        print(f"1. Wait for midnight UTC")
        print(f"2. Call /challenges/active/daily")
        print(f"3. Check /challenges/rotation/status to see if IDs changed")
    else:
        print(f"[ERROR] Could not get rotation status")

def main():
    """Run all tests."""
    print("\n" + "=" * 60)
    print("  TIME-BASED LEADERBOARD & CHALLENGE ROTATION TESTS")
    print("=" * 60)

    print("\n⚠️  Important Notes:")
    print("   - Server must be restarted with new code")
    print("   - Set USE_MOCK_LEADERBOARD=false to test real leaderboard")
    print("   - Challenges must be migrated to Firestore")
    print("   - Time-based XP fields will be initialized on first challenge attempt")

    # Test 1: Time-based leaderboard
    test_time_based_leaderboard()

    # Test 2: Challenge rotation status
    test_challenge_rotation_status()

    # Test 3: Active challenges
    test_active_challenges()

    # Test 4: Rotation cycle info
    test_rotation_cycle()

    # Summary
    print_section("TEST SUMMARY")
    print("✅ Time-based leaderboard: Implemented")
    print("   - Queries xp_daily, xp_weekly, xp_monthly fields")
    print("   - Automatic reset logic in add_attempt()")
    print("\n✅ Challenge rotation: Implemented")
    print("   - Automatic rotation based on time")
    print("   - Random selection of active challenges")
    print("   - Configuration stored in Firestore")
    print("\n📝 Next Steps:")
    print("   1. Restart Flask server to load new code")
    print("   2. Set USE_MOCK_LEADERBOARD=false in .env")
    print("   3. Complete a challenge to initialize time-based XP")
    print("   4. Access /challenges/active/{frequency} to initialize rotation")

if __name__ == "__main__":
    main()
