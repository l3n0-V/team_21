#!/bin/bash

# CEFR API Testing Script
# This script tests all the CEFR endpoints with a valid Firebase token
#
# Usage:
# 1. Get a valid Firebase ID token from the mobile app or Firebase Auth
# 2. Set TOKEN environment variable: export TOKEN="your-firebase-id-token"
# 3. Run this script: ./test_cefr_endpoints.sh

# Configuration
BASE_URL="http://localhost:5000"
TOKEN="${TOKEN:-}"

if [ -z "$TOKEN" ]; then
  echo "❌ ERROR: No token provided"
  echo "Please set the TOKEN environment variable with a valid Firebase ID token:"
  echo "export TOKEN='your-firebase-id-token'"
  echo ""
  echo "To get a token, you can:"
  echo "1. Use the mobile app and log the token from AuthContext"
  echo "2. Use Firebase Auth REST API to sign in"
  exit 1
fi

echo "🧪 CEFR API Testing Script"
echo "=========================="
echo "Base URL: $BASE_URL"
echo "Token: ${TOKEN:0:20}..."
echo ""

# Test 1: Health Check (no auth required)
echo "📍 Test 1: Health Check"
echo "GET /health"
curl -s -w "\nHTTP Status: %{http_code}\n" "$BASE_URL/health"
echo ""
echo "---"

# Test 2: Get Today's Challenges
echo ""
echo "📍 Test 2: Get Today's Challenges"
echo "GET /api/challenges/today"
echo "Expected: List of challenges grouped by type with daily limits"
curl -s -w "\nHTTP Status: %{http_code}\n" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  "$BASE_URL/api/challenges/today" | python3 -m json.tool
echo ""
echo "---"

# Test 3: Get User Progress
echo ""
echo "📍 Test 3: Get User Progress"
echo "GET /api/user/progress"
echo "Expected: CEFR levels A1-C2 with completion progress"
curl -s -w "\nHTTP Status: %{http_code}\n" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  "$BASE_URL/api/user/progress" | python3 -m json.tool
echo ""
echo "---"

# Test 4: Submit Challenge Answer (Listening)
echo ""
echo "📍 Test 4: Submit Challenge Answer"
echo "POST /api/challenges/submit"
echo "Body: {challenge_id: 'test-001', user_answer: 'hei'}"
curl -s -w "\nHTTP Status: %{http_code}\n" \
  -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "challenge_id": "test-001",
    "user_answer": "hei"
  }' \
  "$BASE_URL/api/challenges/submit" | python3 -m json.tool
echo ""
echo "---"

# Test 5: Submit IRL Challenge
echo ""
echo "📍 Test 5: Submit IRL Challenge (Mock Photo)"
echo "POST /api/challenges/irl/verify"
echo "Note: Using a small mock base64 image for testing"
MOCK_PHOTO="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAn/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAB//2Q=="

curl -s -w "\nHTTP Status: %{http_code}\n" \
  -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"challenge_id\": \"irl-001\",
    \"photo_base64\": \"$MOCK_PHOTO\",
    \"text_description\": \"Testing IRL challenge submission\"
  }" \
  "$BASE_URL/api/challenges/irl/verify" | python3 -m json.tool
echo ""
echo "---"

echo ""
echo "✅ All tests completed!"
echo ""
echo "📝 What to verify:"
echo "1. Test 2 should return challenges grouped by type (irl, listening, fill_blank, multiple_choice)"
echo "2. Test 3 should show A1 as current level with progress (e.g., 0/20 = 0%)"
echo "3. Test 4 should return correct/incorrect with xp_gained"
echo "4. Test 5 should return verified=true with xp_gained=50"
echo ""
echo "🔄 To test level progression:"
echo "1. Complete 20 A1 challenges (run Test 4 twenty times)"
echo "2. Run Test 3 again - should show level_up to A2"
echo ""
