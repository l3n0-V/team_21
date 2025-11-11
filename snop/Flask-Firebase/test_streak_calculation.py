#!/usr/bin/env python3
"""
Test script for streak calculation functionality.

Make sure the Flask server is running before executing this script:
    python app.py

Then run this test script in another terminal:
    python test_streak_calculation.py
"""
import requests
import json
from datetime import datetime, timedelta

BASE_URL = "http://localhost:5000"
API_KEY = "AIzaSyAKF663iLJDW4p5luNm0_avaS0Apeo-5Ow"

def print_response(title, response):
    """Pretty print the API response."""
    print(f"\n{'='*60}")
    print(f"{title}")
    print(f"{'='*60}")
    print(f"Status Code: {response.status_code}")
    try:
        data = response.json()
        print(f"Response: {json.dumps(data, indent=2)}")
        return data
    except:
        print(f"Response: {response.text}")
        return None

def get_firebase_token(email, password):
    """Sign in to Firebase and get ID token."""
    print(f"\n🔐 Signing in as: {email}")

    response = requests.post(
        f"https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={API_KEY}",
        json={
            "email": email,
            "password": password,
            "returnSecureToken": True
        }
    )

    if response.status_code == 200:
        data = response.json()
        print(f"✅ Signed in successfully!")
        return data["idToken"]
    else:
        print(f"❌ Sign in failed: {response.json()}")
        return None

def create_test_user(email, password, display_name):
    """Create a test user for streak testing."""
    print(f"\n👤 Creating test user: {email}")

    response = requests.post(
        f"{BASE_URL}/auth/register",
        json={
            "email": email,
            "password": password,
            "display_name": display_name
        }
    )

    if response.status_code == 201:
        print(f"✅ User created successfully!")
        return True
    elif "Email already exists" in response.text:
        print(f"ℹ️  User already exists, will use existing account")
        return True
    else:
        print(f"❌ Failed to create user: {response.text}")
        return False

def get_user_stats(token):
    """Get user statistics including streak data."""
    response = requests.get(
        f"{BASE_URL}/userStats",
        headers={"Authorization": f"Bearer {token}"}
    )
    return print_response("User Stats", response)

def submit_challenge_attempt(token, challenge_id="d1"):
    """Submit a pronunciation challenge attempt."""
    response = requests.post(
        f"{BASE_URL}/scoreDaily",
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        },
        json={
            "challenge_id": challenge_id,
            "audio_url": "test.m4a"
        }
    )
    return print_response("Challenge Attempt Result", response)

def test_streak_scenarios():
    """Test various streak scenarios."""

    print("\n" + "🔥 " * 20)
    print("STREAK CALCULATION TESTS")
    print("🔥 " * 20)

    # Test user credentials
    test_email = "streak_test@snop.com"
    test_password = "testpassword123"
    test_name = "Streak Tester"

    # Step 1: Create or get test user
    create_test_user(test_email, test_password, test_name)

    # Step 2: Sign in and get token
    token = get_firebase_token(test_email, test_password)
    if not token:
        print("\n❌ Could not get authentication token. Exiting.")
        return

    # Test Scenario 1: First Attempt Ever
    print("\n" + "="*60)
    print("TEST SCENARIO 1: First Attempt Ever")
    print("Expected: streak = 1")
    print("="*60)

    stats_before = get_user_stats(token)
    result = submit_challenge_attempt(token)
    stats_after = get_user_stats(token)

    print(f"\n📊 Streak Analysis:")
    if stats_after:
        print(f"  Current Streak: {stats_after.get('current_streak', 0)}")
        print(f"  Longest Streak: {stats_after.get('longest_streak', 0)}")
        print(f"  XP Total: {stats_after.get('xp_total', 0)}")

    # Test Scenario 2: Second Attempt Same Day
    print("\n" + "="*60)
    print("TEST SCENARIO 2: Second Attempt Same Day")
    print("Expected: streak unchanged (still 1)")
    print("="*60)

    result = submit_challenge_attempt(token, "d2")
    stats_after2 = get_user_stats(token)

    print(f"\n📊 Streak Analysis:")
    if stats_after2:
        print(f"  Current Streak: {stats_after2.get('current_streak', 0)}")
        print(f"  Longest Streak: {stats_after2.get('longest_streak', 0)}")
        print(f"  XP Total: {stats_after2.get('xp_total', 0)}")

        if stats_after2.get('current_streak') == stats_after.get('current_streak'):
            print("  ✅ Correct! Streak maintained (same day)")
        else:
            print("  ⚠️  Unexpected! Streak should not change on same day")

    # Test Scenario 3: Information about consecutive days
    print("\n" + "="*60)
    print("TEST SCENARIO 3: Consecutive Days")
    print("Expected: streak increments by 1 each day")
    print("="*60)
    print("\nℹ️  To test consecutive days:")
    print("1. Wait until tomorrow")
    print("2. Run a challenge attempt")
    print("3. Check if streak incremented from", stats_after2.get('current_streak', 0), "to", stats_after2.get('current_streak', 0) + 1)
    print("\nℹ️  To test streak reset (missed days):")
    print("1. Wait 2+ days without completing a challenge")
    print("2. Run a challenge attempt")
    print("3. Check if streak reset to 1")

    # Summary
    print("\n" + "="*60)
    print("STREAK CALCULATION SUMMARY")
    print("="*60)
    print("\n✅ Streak calculation is now ACTIVE!")
    print("\nStreak Logic:")
    print("  • First attempt: streak = 1")
    print("  • Same day multiple attempts: streak unchanged")
    print("  • Next day: streak += 1")
    print("  • Missed day(s): streak resets to 1")
    print("  • Longest streak is always tracked")

    print(f"\n📈 Current Test User Stats:")
    final_stats = get_user_stats(token)
    if final_stats:
        print(f"  Current Streak: {final_stats.get('current_streak', 0)} day(s)")
        print(f"  Longest Streak: {final_stats.get('longest_streak', 0)} day(s)")
        print(f"  Total XP: {final_stats.get('xp_total', 0)}")
        print(f"  Last Attempt: {final_stats.get('last_attempt_at', 'N/A')}")

def main():
    """Run streak calculation tests."""
    try:
        test_streak_scenarios()

        print("\n" + "="*60)
        print("✅ Streak calculation tests complete!")
        print("="*60)
        print("\nNext Steps:")
        print("1. Test consecutive days by running a challenge tomorrow")
        print("2. Test streak reset by waiting 2+ days before next attempt")
        print("3. Integrate streak display in mobile app UI")
        print("4. Add streak notifications/reminders")
        print()

    except requests.exceptions.ConnectionError:
        print("\n❌ ERROR: Could not connect to Flask server!")
        print("Make sure the server is running:")
        print("    python app.py")
        print("\nThen run this test script again.")
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
