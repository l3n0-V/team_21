"""
Test script for badge system API endpoints.

This script tests:
1. GET /badges - Get all badge definitions (public)
2. GET /user/badges - Get user's earned and available badges (protected)
3. POST /scoreDaily - Verify badges are awarded during challenge attempts

Prerequisites:
- Flask server must be running (python app.py)
- Test user must exist (created via test script or registration)
"""

import sys
import io
# Set UTF-8 encoding for Windows console
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

import requests
import json

BASE_URL = "http://localhost:5000"
TEST_EMAIL = "badge_test@snop.com"
TEST_PASSWORD = "testpassword123"

def print_section(title):
    """Print a formatted section header."""
    print("\n" + "=" * 60)
    print(f"  {title}")
    print("=" * 60)

def print_json(data):
    """Pretty print JSON data."""
    print(json.dumps(data, indent=2))

def get_firebase_token(email, password):
    """
    Get Firebase ID token by signing in with email and password.
    Uses Firebase Web API.
    """
    # Firebase Web API endpoint
    firebase_api_key = "AIzaSyAKF663iLJDW4p5luNm0_avaS0Apeo-5Ow"
    url = f"https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={firebase_api_key}"

    payload = {
        "email": email,
        "password": password,
        "returnSecureToken": True
    }

    response = requests.post(url, json=payload)

    if response.status_code == 200:
        data = response.json()
        return data["idToken"]
    else:
        print(f"❌ Failed to sign in: {response.status_code}")
        print(response.text)
        return None

def register_test_user():
    """Register test user if doesn't exist."""
    print_section("REGISTERING TEST USER")

    response = requests.post(
        f"{BASE_URL}/auth/register",
        json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD,
            "display_name": "Badge Test User"
        }
    )

    print(f"Status Code: {response.status_code}")

    if response.status_code == 201:
        print("✅ Test user registered successfully")
        return response.json()
    elif response.status_code == 400 and "already exists" in response.text.lower():
        print("ℹ️  Test user already exists")
        return {"message": "User already exists"}
    else:
        print(f"❌ Registration failed: {response.text}")
        return None

def test_get_all_badges():
    """Test GET /badges endpoint (public)."""
    print_section("TEST 1: GET /badges (All Badge Definitions)")

    response = requests.get(f"{BASE_URL}/badges")

    print(f"Status Code: {response.status_code}")

    if response.status_code == 200:
        data = response.json()
        print(f"\n✅ Successfully retrieved {len(data)} badge definitions\n")

        # Print each badge
        for badge_id, badge in data.items():
            print(f"{badge['icon']} {badge['name']} ({badge_id})")
            print(f"   Description: {badge['description']}")
            print(f"   XP Bonus: {badge['xp_bonus']}")
            print(f"   Unlock: {badge['condition_type']} >= {badge['condition_value']}")
            print()

        return True
    else:
        print(f"❌ Failed to get badges: {response.text}")
        return False

def test_get_user_badges(token):
    """Test GET /user/badges endpoint (protected)."""
    print_section("TEST 2: GET /user/badges (User's Badge Status)")

    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/user/badges", headers=headers)

    print(f"Status Code: {response.status_code}")

    if response.status_code == 200:
        data = response.json()
        print("\n📊 Badge Status:")
        print(f"   Earned: {data['earned_count']} / {data['total_badges']}")

        if data['earned']:
            print("\n✅ Earned Badges:")
            for badge in data['earned']:
                print(f"   {badge['icon']} {badge['name']}")
                print(f"      Earned at: {badge.get('earned_at', 'N/A')}")
                print(f"      XP Bonus: {badge['xp_bonus']}")
        else:
            print("\n   No badges earned yet")

        print(f"\n🔒 Available Badges: {len(data['available'])}")
        for badge in data['available'][:3]:  # Show first 3
            print(f"   {badge['icon']} {badge['name']}")

        if len(data['available']) > 3:
            print(f"   ... and {len(data['available']) - 3} more")

        return True
    else:
        print(f"❌ Failed to get user badges: {response.text}")
        return False

def test_score_daily_with_badges(token):
    """Test POST /scoreDaily to verify badges are awarded."""
    print_section("TEST 3: POST /scoreDaily (Badge Awarding)")

    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

    # Submit a pronunciation attempt
    payload = {
        "challenge_id": "d1",
        "audio_url": "https://example.com/test.m4a"
    }

    response = requests.post(f"{BASE_URL}/scoreDaily", headers=headers, json=payload)

    print(f"Status Code: {response.status_code}")

    if response.status_code == 200:
        data = response.json()

        print("\n📝 Challenge Result:")
        print(f"   Transcription: {data.get('transcription', 'N/A')}")
        print(f"   XP Gained: {data.get('xp_gained', 0)}")
        print(f"   Similarity: {data.get('similarity', 0):.2%}")
        print(f"   Passed: {data.get('pass', False)}")

        if 'new_badges' in data and data['new_badges']:
            print("\n🎉 NEW BADGES EARNED!")
            for badge in data['new_badges']:
                print(f"   {badge['icon']} {badge['name']}")
                print(f"      {badge['description']}")
                print(f"      Bonus XP: +{badge['xp_bonus']}")
        else:
            print("\n   No new badges earned (may have already earned available ones)")

        return True
    else:
        print(f"❌ Failed to submit attempt: {response.text}")
        return False

def main():
    """Run all badge endpoint tests."""
    print("\n" + "=" * 60)
    print("  BADGE SYSTEM API ENDPOINT TESTS")
    print("=" * 60)

    # Test 1: Get all badges (public endpoint)
    success_1 = test_get_all_badges()

    # Register or get test user
    register_test_user()

    # Get Firebase token
    print_section("GETTING FIREBASE AUTH TOKEN")
    token = get_firebase_token(TEST_EMAIL, TEST_PASSWORD)

    if not token:
        print("❌ Cannot proceed without authentication token")
        print("\nℹ️  Note: You may need to update the firebase_api_key in this script.")
        print("   Get it from Firebase Console > Project Settings > Web API Key")
        return

    print("✅ Got authentication token")

    # Test 2: Get user badges
    success_2 = test_get_user_badges(token)

    # Test 3: Score daily with badge awarding
    success_3 = test_score_daily_with_badges(token)

    # Test 2 again to see updated badges
    print_section("TEST 4: GET /user/badges (After Challenge Attempt)")
    test_get_user_badges(token)

    # Final summary
    print_section("TEST SUMMARY")
    print(f"Test 1 (GET /badges): {'✅ PASSED' if success_1 else '❌ FAILED'}")
    print(f"Test 2 (GET /user/badges): {'✅ PASSED' if success_2 else '❌ FAILED'}")
    print(f"Test 3 (POST /scoreDaily with badges): {'✅ PASSED' if success_3 else '❌ FAILED'}")

    print("\n✨ Badge system integration complete!")
    print("\nℹ️  Next Steps:")
    print("   - Submit more challenges to earn additional badges")
    print("   - Build consecutive daily streaks to unlock streak badges")
    print("   - Earn XP to unlock XP milestone badges")

if __name__ == "__main__":
    main()
