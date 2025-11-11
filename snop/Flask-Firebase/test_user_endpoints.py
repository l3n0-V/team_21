#!/usr/bin/env python3
"""
Test script for user profile endpoints.

Make sure the Flask server is running before executing this script:
    python app.py

Then run this test script in another terminal:
    python test_user_endpoints.py
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
        print(f"Response: {json.dumps(response.json(), indent=2)}")
    except:
        print(f"Response: {response.text}")
    print()

def test_user_registration():
    """Test POST /auth/register"""
    print("\n" + "="*60)
    print("TEST 1: Register a new user")
    print("="*60)

    data = {
        "email": "testuser123@snop.com",
        "password": "securepassword123",
        "display_name": "Test User"
    }

    response = requests.post(f"{BASE_URL}/auth/register", json=data)
    print_response("Register New User", response)

    if response.status_code == 201:
        return response.json().get("custom_token")
    return None

def test_get_profile(token):
    """Test GET /user/profile"""
    print("\n" + "="*60)
    print("TEST 2: Get user profile")
    print("="*60)

    # First, exchange custom token for ID token using Firebase API
    # For simplicity, we'll use a test token that already exists
    # In real usage, the mobile app handles this token exchange

    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/user/profile", headers=headers)
    print_response("Get User Profile", response)

def test_update_profile(token):
    """Test PUT /user/profile"""
    print("\n" + "="*60)
    print("TEST 3: Update user profile")
    print("="*60)

    data = {
        "display_name": "Updated Name",
        "bio": "This is my bio!"
    }

    headers = {"Authorization": f"Bearer {token}"}
    response = requests.put(f"{BASE_URL}/user/profile", json=data, headers=headers)
    print_response("Update User Profile", response)

def test_with_existing_user():
    """Test with an existing user (test@snop.com)"""
    print("\n" + "="*60)
    print("TEST 4: Using existing user (test@snop.com)")
    print("="*60)

    # Sign in with existing user to get token
    data = {
        "email": "test@snop.com",
        "password": "testpassword123",
        "returnSecureToken": True
    }

    API_KEY = "AIzaSyAKF663iLJDW4p5luNm0_avaS0Apeo-5Ow"
    response = requests.post(
        f"https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={API_KEY}",
        json=data
    )

    if response.status_code == 200:
        id_token = response.json()["idToken"]
        print(f"✅ Signed in successfully! Got ID token.")

        # Test get profile
        headers = {"Authorization": f"Bearer {id_token}"}
        response = requests.get(f"{BASE_URL}/user/profile", headers=headers)
        print_response("Get Profile (Existing User)", response)

        # Test update profile
        update_data = {"display_name": "Test User Updated"}
        response = requests.put(
            f"{BASE_URL}/user/profile",
            json=update_data,
            headers=headers
        )
        print_response("Update Profile (Existing User)", response)

    else:
        print(f"❌ Failed to sign in: {response.json()}")

def main():
    """Run all tests."""
    print("\n" + "🧪 " * 20)
    print("USER PROFILE ENDPOINT TESTS")
    print("🧪 " * 20)

    # Test 1: Register new user
    print("\n⚠️  Note: If registration fails with 'Email already exists', that's OK!")
    print("We'll test with the existing user instead.\n")

    custom_token = test_user_registration()

    # Test with existing user (more reliable)
    test_with_existing_user()

    print("\n" + "="*60)
    print("✅ All tests complete!")
    print("="*60)
    print("\nNext steps:")
    print("1. Check Firebase Console to see the user profiles")
    print("2. Try these endpoints from your mobile app")
    print("3. Integrate with your mobile authentication flow")
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
