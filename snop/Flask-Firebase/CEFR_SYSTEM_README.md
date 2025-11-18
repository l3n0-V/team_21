# CEFR Challenge System - Implementation Guide

## Overview

The SNOP app has been restructured to use a CEFR-based (Common European Framework of Reference) progression system. This document explains the new system, how to deploy it, and how to use it.

## What Changed

### Old System
- Challenges organized by frequency (daily, weekly, monthly)
- Simple rotation system
- No structured progression
- Limited challenge types

### New System
- **CEFR Levels**: A1 → A2 → B1 → B2 → C1 → C2
- **Challenge Types**: listening, fill_blank, multiple_choice, pronunciation, **IRL** (In Real Life)
- **Daily Limits**: 1 IRL, 3 listening, 3 fill_blank, 3 multiple_choice per day (UTC)
- **Progression**: Users unlock new levels by completing challenges
- **IRL Verification**: Photo uploads, optional GPS and text descriptions

## New File Structure

```
Flask-Firebase/
├── services_cefr.py              # CEFR progression logic
├── services_daily_progress.py    # Daily challenge tracking
├── services_irl.py                # IRL challenge verification
├── services_challenges.py         # Updated with CEFR functions
├── services_users.py              # Updated with CEFR initialization
├── migrate_to_cefr.py             # Migration script
├── cefr_challenges.json           # Sample CEFR challenges
└── CEFR_SYSTEM_README.md          # This file
```

## New API Endpoints

### 1. Get Today's Challenges
```
GET /api/challenges/today
Authorization: Bearer <token>
```

**Response**:
```json
{
  "date": "2025-01-18",
  "user_level": "A1",
  "challenges": {
    "irl": {
      "available": [...],
      "completed_today": 0,
      "limit": 1,
      "can_complete_more": true
    },
    "listening": {
      "available": [...],
      "completed_today": 2,
      "limit": 3,
      "can_complete_more": true
    },
    ...
  }
}
```

### 2. Submit Challenge Answer
```
POST /api/challenges/submit
Authorization: Bearer <token>
Content-Type: application/json

{
  "challenge_id": "a1_listening_001",
  "user_answer": 0
}
```

**Response**:
```json
{
  "success": true,
  "correct": true,
  "xp_gained": 10,
  "feedback": "Correct! Well done!",
  "level_up": false,
  "level_progress": {
    "current_level": "A1",
    "completed": 6,
    "required": 20,
    "percentage": 30
  }
}
```

### 3. Verify IRL Challenge (Photo Upload)
```
POST /api/challenges/irl/verify
Authorization: Bearer <token>
Content-Type: multipart/form-data

challenge_id: a1_irl_001
photo: [file]
gps_lat: 59.9139 (optional)
gps_lng: 10.7522 (optional)
text_description: "I ordered coffee!" (optional)
```

**Alternative - Base64 Image**:
```
POST /api/challenges/irl/verify
Authorization: Bearer <token>
Content-Type: application/json

{
  "challenge_id": "a1_irl_001",
  "photo_base64": "data:image/jpeg;base64,/9j/4AAQ...",
  "gps_lat": 59.9139,
  "gps_lng": 10.7522,
  "text_description": "I ordered coffee in Norwegian!"
}
```

**Response**:
```json
{
  "success": true,
  "verified": true,
  "xp_gained": 50,
  "photo_url": "https://storage.googleapis.com/.../photo.jpg",
  "gps_verified": true,
  "feedback": "Great job! You completed your IRL challenge.",
  "completion_status": {
    "irl_completed_today": 1,
    "irl_limit": 1,
    "can_complete_more": false
  }
}
```

### 4. Get User Progress
```
GET /api/user/progress
Authorization: Bearer <token>
```

**Response**:
```json
{
  "current_level": "A1",
  "progress": {
    "A1": {
      "name": "Beginner",
      "completed": 6,
      "required": 20,
      "percentage": 30,
      "unlocked": true,
      "is_current": true
    },
    "A2": {
      "name": "Elementary",
      "completed": 0,
      "required": 20,
      "percentage": 0,
      "unlocked": false,
      "unlock_message": "Complete 14 more A1 challenges to unlock A2"
    },
    ...
  },
  "recent_completions": [...]
}
```

## Migration Guide

### Prerequisites

1. **Backup Firestore**: Export your current Firestore database
2. **Prepare Challenges**: Review `cefr_challenges.json` and customize if needed
3. **Test Environment**: Run migration in test environment first

### Running Migration

#### 1. Dry Run (Preview)
```bash
cd snop/Flask-Firebase
python migrate_to_cefr.py --dry-run
```

This shows what will happen without making changes.

#### 2. Initialize Config Only
```bash
python migrate_to_cefr.py --skip-users
```

This initializes CEFR configuration without migrating users.

#### 3. Full Migration
```bash
python migrate_to_cefr.py --load-challenges cefr_challenges.json
```

This will:
- Initialize CEFR roadmap configuration
- Load challenges from JSON file
- Migrate all users:
  - Preserve XP and streaks
  - Initialize CEFR fields (start at A1)
  - Clear old attempts (as per migration plan)
  - Clear daily progress

#### 4. Migration with Custom Challenges
```bash
python migrate_to_cefr.py --load-challenges path/to/your/challenges.json
```

### What Gets Preserved

✅ **Preserved**:
- `xp_total`
- `current_streak`
- `longest_streak`
- `email`, `display_name`, `photo_url`

❌ **Cleared**:
- Old attempts (`users/{uid}/attempts`)
- Old daily progress (`users/{uid}/daily_progress`)

✨ **Added**:
- `cefr_level: "A1"`
- `cefr_progress: {...}` (A1-C2 progression tracking)
- `timezone: "UTC"`

## Configuration

### CEFR Roadmap Config (Firestore `config/cefr_roadmap`)

```json
{
  "levels": {
    "A1": {
      "name": "Beginner",
      "required_completions": 20,
      "unlocked_by_default": true
    },
    "A2": {
      "name": "Elementary",
      "required_completions": 20,
      "unlocked_by_default": false
    },
    ...
  },
  "daily_config": {
    "irl_limit": 1,
    "listening_limit": 3,
    "fill_blank_limit": 3,
    "multiple_choice_limit": 3,
    "pronunciation_limit": -1
  }
}
```

### Customizing Daily Limits

Edit in Firestore Console or via script:

```python
from firebase_config import db

db.collection("config").document("cefr_roadmap").set({
    "daily_config": {
        "irl_limit": 2,  # Allow 2 IRL challenges per day
        "listening_limit": 5,  # Allow 5 listening challenges
        ...
    }
}, merge=True)
```

## Adding New Challenges

### Option 1: Via JSON File

1. Add challenges to a JSON file:

```json
{
  "challenges": [
    {
      "id": "a1_listening_003",
      "type": "listening",
      "cefr_level": "A1",
      "topic": "numbers",
      "title": "Count to five",
      "description": "Listen and identify the number",
      "xp_reward": 10,
      "audio_text": "en, to, tre, fire, fem",
      "options": ["1 to 5", "5 to 10", "10 to 15", "15 to 20"],
      "correct_answer": 0
    }
  ]
}
```

2. Load into Firestore:

```bash
python migrate_to_cefr.py --load-challenges new_challenges.json --skip-users
```

### Option 2: Via AI Generation

Use the existing `/admin/generate-challenges` endpoint:

```bash
curl -X POST http://localhost:5000/admin/generate-challenges \
  -H "Content-Type: application/json" \
  -d '{
    "cefr_level": "A1",
    "challenge_type": "listening",
    "topic": "greetings",
    "count": 5
  }'
```

### Option 3: Via Python Script

```python
from services_challenges import add_challenge

challenge_data = {
    "type": "listening",
    "cefr_level": "A1",
    "topic": "greetings",
    "title": "Listen: Hello",
    "description": "Listen to a greeting",
    "xp_reward": 10,
    "audio_text": "Hei!",
    "options": ["Hello!", "Goodbye!", "Thank you!", "Sorry!"],
    "correct_answer": 0
}

challenge_id = add_challenge(challenge_data)
print(f"Added challenge: {challenge_id}")
```

## Testing the System

### 1. Test User Registration

```bash
curl -X POST http://localhost:5000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123",
    "display_name": "Test User"
  }'
```

Expected: User created with CEFR fields initialized.

### 2. Test Fetching Today's Challenges

```bash
curl -X GET http://localhost:5000/api/challenges/today \
  -H "Authorization: Bearer <token>"
```

Expected: Returns challenges grouped by type with completion status.

### 3. Test Submitting a Challenge

```bash
curl -X POST http://localhost:5000/api/challenges/submit \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "challenge_id": "a1_listening_001",
    "user_answer": 0
  }'
```

Expected: Returns result with XP gained and level progress.

### 4. Test IRL Challenge (Base64)

```bash
curl -X POST http://localhost:5000/api/challenges/irl/verify \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "challenge_id": "a1_irl_001",
    "photo_base64": "data:image/jpeg;base64,<base64-string>",
    "text_description": "I ordered coffee in Norwegian!"
  }'
```

Expected: Photo uploaded to Firebase Storage, completion recorded.

### 5. Test Daily Limit Enforcement

Submit 4 listening challenges in one day. The 4th should return:

```json
{
  "success": false,
  "error": "Daily limit reached (3)"
}
```

### 6. Test Level Up

Complete 20 A1 challenges. The 20th should return:

```json
{
  "success": true,
  "level_up": true,
  "new_level": "A2",
  "message": "Congratulations! You've advanced to A2!"
}
```

## Troubleshooting

### Issue: Firebase Storage errors for photo uploads

**Solution**: Ensure Firebase Storage is initialized and has correct permissions:

```python
from firebase_admin import storage

# In app.py or firebase_config.py
bucket = storage.bucket("your-project-id.appspot.com")
```

Update Firebase Storage Rules:
```
service firebase.storage {
  match /b/{bucket}/o {
    match /user_photos/{userId}/{filename} {
      allow write: if request.auth != null && request.auth.uid == userId;
      allow read: if true;
    }
  }
}
```

### Issue: Challenges not showing for user

**Check**:
1. User has CEFR fields initialized: `GET /user/profile`
2. Challenges exist in Firestore with correct `cefr_level` field
3. User's `cefr_level` matches challenge levels (A1 user only sees A1)

**Fix**: Re-run migration or manually initialize CEFR fields:

```python
from services_cefr import initialize_user_cefr_progress
initialize_user_cefr_progress(uid)
```

### Issue: Daily limits not resetting

**Check**: Server timezone is UTC, challenges reset at midnight UTC.

**Verify**:
```python
from services_daily_progress import get_current_utc_date
print(get_current_utc_date())  # Should show current UTC date
```

## Frontend Integration (Next Steps)

The backend is now ready. Frontend changes needed:

1. **Update API calls** to use new endpoints (`/api/challenges/today`, etc.)
2. **Add IRL challenge UI** with photo upload (use `expo-image-picker`)
3. **Show CEFR progression** in user profile/stats screen
4. **Update ChallengeContext** to handle new data structure
5. **Add level-up notifications** when user advances CEFR levels

See `FRONTEND_IMPLEMENTATION_PLAN.md` for detailed frontend tasks.

## Summary

The CEFR system provides:
- ✅ Structured progression (A1 → C2)
- ✅ Daily challenge limits with UTC reset
- ✅ IRL challenges with photo verification
- ✅ Flexible challenge pools
- ✅ Automatic level unlocking
- ✅ Preserved user XP and streaks during migration

**Next Actions**:
1. Run migration in test environment
2. Load sample challenges
3. Test all API endpoints
4. Update mobile app frontend
5. Deploy to production

---

For questions or issues, refer to this README or check the service module docstrings.
