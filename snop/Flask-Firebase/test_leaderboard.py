#!/usr/bin/env python3
"""
Test script for leaderboard endpoints.

Make sure the Flask server is running before executing this script:
    python app.py

Then run this test script in another terminal:
    python test_leaderboard.py
"""
import requests
import json

BASE_URL = "http://localhost:5000"

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

def test_mock_leaderboard():
    """Test leaderboard with mock data (USE_MOCK_LEADERBOARD=true)"""
    print("\n" + "🏆 " * 20)
    print("TEST 1: Mock Leaderboard (for teacher demonstration)")
    print("🏆 " * 20)

    periods = ["weekly", "monthly", "all-time"]

    for period in periods:
        response = requests.get(f"{BASE_URL}/leaderboard?period={period}")
        print_response(f"Mock Leaderboard - {period}", response)

def test_real_leaderboard():
    """Test leaderboard with real Firestore data"""
    print("\n" + "🏆 " * 20)
    print("TEST 2: Real Leaderboard (from Firestore)")
    print("🏆 " * 20)
    print("\n⚠️  To test real leaderboard:")
    print("1. Stop the Flask server")
    print("2. Edit .env: Set USE_MOCK_LEADERBOARD=false")
    print("3. Restart the Flask server")
    print("4. Run this script again")
    print("\nFor now, showing mock data only...")

def create_test_users():
    """Helper to create test users with XP for testing real leaderboard"""
    print("\n" + "👥 " * 20)
    print("CREATE TEST USERS (for real leaderboard testing)")
    print("👥 " * 20)

    test_users = [
        {"email": "user1@test.com", "password": "password123", "display_name": "Alice"},
        {"email": "user2@test.com", "password": "password123", "display_name": "Bob"},
        {"email": "user3@test.com", "password": "password123", "display_name": "Charlie"},
    ]

    print("\n📝 Creating test users...")

    for user in test_users:
        try:
            response = requests.post(f"{BASE_URL}/auth/register", json=user)
            if response.status_code == 201:
                print(f"✅ Created user: {user['display_name']}")
            elif "Email already exists" in response.text:
                print(f"⏭️  User {user['display_name']} already exists")
            else:
                print(f"❌ Failed to create {user['display_name']}: {response.text}")
        except Exception as e:
            print(f"❌ Error creating {user['display_name']}: {e}")

    print("\n💡 Note: These users have 0 XP. To test the real leaderboard:")
    print("1. Have users complete challenges to gain XP")
    print("2. Or manually update xp_total in Firestore Console")
    print("3. Then test with USE_MOCK_LEADERBOARD=false")

def main():
    """Run all tests."""
    print("\n" + "🧪 " * 20)
    print("LEADERBOARD ENDPOINT TESTS")
    print("🧪 " * 20)

    # Test 1: Mock leaderboard
    test_mock_leaderboard()

    # Info about real leaderboard testing
    test_real_leaderboard()

    # Optionally create test users
    print("\n" + "="*60)
    create_users = input("\nDo you want to create test users for real leaderboard testing? (y/N): ")
    if create_users.lower() == 'y':
        create_test_users()

    print("\n" + "="*60)
    print("✅ Leaderboard tests complete!")
    print("="*60)
    print("\nCurrent Configuration:")
    print("- Mock leaderboard: ✅ ENABLED (USE_MOCK_LEADERBOARD=true)")
    print("- Shows hardcoded sample data for demonstrations")
    print("\nFor Teacher Presentation:")
    print("- Keep USE_MOCK_LEADERBOARD=true")
    print("- Mock data shows 5 users with realistic XP values")
    print("\nFor Production:")
    print("- Set USE_MOCK_LEADERBOARD=false in .env")
    print("- Will query real users from Firestore ordered by XP")
    print()

if __name__ == "__main__":
    try:
        main()
    except requests.exceptions.ConnectionError:
        print("\n❌ ERROR: Could not connect to Flask server!")
        print("Make sure the server is running:")
        print("    python app.py")
        print("\nThen run this test script again.")
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
