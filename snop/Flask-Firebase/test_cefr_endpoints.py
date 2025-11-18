#!/usr/bin/env python
"""
Simple test script for CEFR endpoints.
Run this after starting the Flask server.
"""
import requests
import json

BASE_URL = "http://localhost:5000"

def test_health():
    """Test health endpoint (no auth)"""
    print("\n" + "="*60)
    print("Testing Health Endpoint")
    print("="*60)

    response = requests.get(f"{BASE_URL}/health")
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text}")
    return response.status_code == 200


def test_register_user():
    """Register a test user"""
    print("\n" + "="*60)
    print("Registering Test User")
    print("="*60)

    data = {
        "email": "testuser@example.com",
        "password": "test123456",
        "display_name": "Test User"
    }

    response = requests.post(f"{BASE_URL}/auth/register", json=data)
    print(f"Status: {response.status_code}")

    if response.status_code == 201:
        result = response.json()
        print(f"✓ User created: {result.get('email')}")
        print(f"  UID: {result.get('uid')}")
        print(f"  Custom Token: {result.get('custom_token')[:50]}...")
        return result.get('custom_token')
    elif response.status_code == 400:
        print(f"⚠ User might already exist: {response.json()}")
        return None
    else:
        print(f"✗ Error: {response.json()}")
        return None


def test_get_todays_challenges(token=None):
    """Test GET /api/challenges/today (requires auth)"""
    print("\n" + "="*60)
    print("Testing GET /api/challenges/today")
    print("="*60)

    if not token:
        print("⚠ No token provided - this endpoint requires authentication")
        print("  Skipping test...")
        return False

    headers = {
        "Authorization": f"Bearer {token}"
    }

    response = requests.get(f"{BASE_URL}/api/challenges/today", headers=headers)
    print(f"Status: {response.status_code}")

    if response.status_code == 200:
        result = response.json()
        print(f"✓ Success!")
        print(f"  Date: {result.get('date')}")
        print(f"  User Level: {result.get('user_level')}")
        print(f"  Challenge Types Available:")
        for challenge_type, data in result.get('challenges', {}).items():
            available_count = len(data.get('available', []))
            completed = data.get('completed_today', 0)
            limit = data.get('limit', 0)
            print(f"    - {challenge_type}: {available_count} available, {completed}/{limit} completed")
        return True
    else:
        print(f"✗ Error: {response.json()}")
        return False


def test_old_challenges_endpoint():
    """Test old challenges endpoint (no auth)"""
    print("\n" + "="*60)
    print("Testing GET /challenges/daily (old system)")
    print("="*60)

    response = requests.get(f"{BASE_URL}/challenges/daily")
    print(f"Status: {response.status_code}")

    if response.status_code == 200:
        result = response.json()
        challenges = result.get('challenges', [])
        print(f"✓ Success! Found {len(challenges)} challenges")
        if challenges:
            print(f"  Sample challenge: {challenges[0].get('title', 'N/A')}")
        return True
    else:
        print(f"✗ Error: {response.text}")
        return False


def test_firestore_config():
    """Test if CEFR config exists in Firestore"""
    print("\n" + "="*60)
    print("Checking Firestore CEFR Configuration")
    print("="*60)

    try:
        # Load .env BEFORE importing firebase_config
        from dotenv import load_dotenv
        load_dotenv()

        from firebase_config import db

        config_ref = db.collection("config").document("cefr_roadmap")
        config_doc = config_ref.get()

        if config_doc.exists:
            config = config_doc.to_dict()
            print("✓ CEFR config exists in Firestore")
            print(f"  Daily limits: {config.get('daily_config', {})}")
            print(f"  Levels configured: {list(config.get('levels', {}).keys())}")
            return True
        else:
            print("⚠ CEFR config NOT found in Firestore")
            print("  Run: python migrate_to_cefr.py --skip-users")
            print("  This will initialize the CEFR configuration")
            return False

    except Exception as e:
        print(f"✗ Error checking Firestore: {e}")
        return False


def main():
    print("\n" + "="*60)
    print("CEFR SYSTEM ENDPOINT TESTS")
    print("="*60)
    print("\nMake sure Flask server is running: python app.py")
    print("Press Enter to start tests...")
    input()

    results = {}

    # Test 1: Health check
    results['health'] = test_health()

    # Test 2: Check Firestore config
    results['firestore_config'] = test_firestore_config()

    # Test 3: Old challenges endpoint (to verify server works)
    results['old_challenges'] = test_old_challenges_endpoint()

    # Test 4: Register user (may fail if already exists)
    token = test_register_user()

    # Test 5: Get today's challenges (requires auth)
    if token:
        results['todays_challenges'] = test_get_todays_challenges(token)
    else:
        print("\n⚠ Skipping authenticated endpoints - no token available")
        print("  If user already exists, you need to sign in to get a token")
        print("  Or delete the user and run this script again")

    # Summary
    print("\n" + "="*60)
    print("TEST SUMMARY")
    print("="*60)
    for test_name, passed in results.items():
        status = "✓ PASS" if passed else "✗ FAIL"
        print(f"{status}: {test_name}")

    print("\n" + "="*60)
    print("NEXT STEPS")
    print("="*60)

    if not results.get('firestore_config'):
        print("1. Initialize CEFR config:")
        print("   python migrate_to_cefr.py --skip-users")

    if not results.get('todays_challenges'):
        print("\n2. Load sample challenges:")
        print("   python migrate_to_cefr.py --load-challenges cefr_challenges.json --skip-users")

    print("\n3. Test again with a fresh user or get auth token")
    print("\nDone!")


if __name__ == "__main__":
    main()
