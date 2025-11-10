# Flask-Firebase Backend Status Report
**Project:** SNOP - Language Learning App
**Date:** November 10, 2025
**Backend Location:** `snop/Flask-Firebase/`

---

## Executive Summary

The Flask-Firebase backend has a solid foundation with Firebase authentication and Firestore integration. However, several **critical features** are currently mocked or missing that are required for the mobile app to function properly. This report outlines implemented features, missing functionality, and a prioritized implementation roadmap.

---

## Current Architecture

### Tech Stack
- **Flask 3.0** - Python web framework
- **Firebase Admin SDK 6.6** - Authentication & Firestore
- **Flask-CORS** - Cross-origin request handling
- **Gunicorn** - Production server (installed, not configured)

### Authentication
- **Dual-mode authentication:**
  - Session-based (for web interface)
  - Token-based (for mobile app via `@require_auth` decorator)
- Firebase ID token validation with clock skew tolerance

### Data Storage
- **Firestore** for all data persistence
- Collections: `users`, `attempts`, `weekly_verifications`, `leaderboards`, `diagnostics`

---

## ✅ Implemented Features

### 1. Mobile API Endpoints
| Endpoint | Method | Auth | Description | Status |
|----------|--------|------|-------------|--------|
| `/health` | GET | No | Health check | ✅ Working |
| `/firestore-test` | GET | No | Firestore connectivity test | ✅ Working |
| `/scoreDaily` | POST | Yes | Submit pronunciation attempt | ⚠️ Mocked evaluation |
| `/verifyWeekly` | POST | Yes | Verify weekly challenge | ⚠️ Mocked badge |
| `/userStats` | GET | Yes | Fetch user XP/streak/progress | ⚠️ Streak mocked |
| `/leaderboard` | GET | No | Fetch leaderboard data | ⚠️ Returns hardcoded data |

### 2. Web Interface (Separate from Mobile App)
- Login/signup pages with Firebase Auth
- Google Sign-In integration
- Dashboard, password reset, terms, privacy pages
- **Note:** This is a standalone web interface, not used by the mobile app

### 3. Firestore Integration
- User stats tracking (XP total, last attempt timestamp)
- Attempt history stored in subcollections
- Weekly verification tracking
- Admin SDK initialized with service account credentials

### 4. Security Features
- CORS configuration via environment variables
- Secure session cookies (HTTPS, HttpOnly, SameSite)
- Token validation with revocation check
- Firestore rules example (denies all client access)

---

## ❌ Missing Critical Features

### 🚨 **HIGH PRIORITY - Blocking Mobile Functionality**

#### 1. Audio Upload & Storage
**Current State:** None
**Impact:** Mobile app cannot upload audio recordings

**What's Needed:**
- Firebase Storage integration
- `POST /upload-audio` endpoint to receive audio files
- Return storage URL for Firestore reference
- Handle audio formats from expo-av (likely `.m4a` or `.wav`)
- Consider file size limits (Flask default: 16MB)

**Technical Details:**
```python
# Missing implementation
@app.post("/upload-audio")
@require_auth
def upload_audio():
    # 1. Receive audio file from multipart/form-data
    # 2. Upload to Firebase Storage: gs://snop-b76ac.appspot.com/audio/{uid}/{timestamp}.m4a
    # 3. Get public URL or signed URL
    # 4. Return URL to client
    pass
```

---

#### 2. Whisper API Integration
**Current State:** Hardcoded mock response
**Impact:** No real pronunciation evaluation - all attempts auto-succeed

**Location:** `app.py:149-150`
```python
# Currently returns fake data
result = {"xp_gained": 10, "feedback": "Great pronunciation!", "pass": True}
```

**What's Needed:**
- OpenAI Whisper API integration (or alternative speech-to-text)
- Audio transcription from uploaded files
- Pronunciation accuracy scoring algorithm
- Phonetic comparison with target phrase
- Feedback generation based on errors

**Suggested Flow:**
1. Receive audio URL from upload endpoint
2. Download audio from Firebase Storage
3. Send to Whisper API for transcription
4. Compare transcription with challenge target phrase
5. Calculate accuracy score (word-level, phoneme-level)
6. Determine XP based on accuracy
7. Generate helpful feedback
8. Return result to mobile app

---

#### 3. Challenge Delivery API
**Current State:** None - mobile app uses local `challenges.json`
**Impact:** Cannot update challenges without app release

**What's Needed:**
```python
GET /challenges/daily          # Return array of daily challenges
GET /challenges/weekly         # Return array of weekly challenges
GET /challenges/monthly        # Return array of monthly challenges
GET /challenges/{id}           # Return specific challenge details
POST /challenges (admin only)  # Add new challenges
```

**Migration Required:**
- Move challenges from `mobile/src/data/challenges.json` to Firestore
- Implement challenge rotation logic (daily refresh)
- Add difficulty progression
- Support challenge scheduling

---

### ⚠️ **MEDIUM PRIORITY - Reduced Functionality**

#### 4. User Registration for Mobile
**Current State:** Web-only registration
**Impact:** Mobile users cannot create accounts via API

**What's Needed:**
```python
POST /auth/register  # Create account with email/password from mobile
POST /auth/login     # Return Firebase token (or rely on client-side Firebase Auth)
GET /user/profile    # Fetch user profile (name, avatar, stats)
PUT /user/profile    # Update display name, preferences, avatar
```

**Note:** Mobile app can use Firebase Auth client SDK for registration, but backend needs profile management.

---

#### 5. Real Leaderboard Calculation
**Current State:** Returns hardcoded fake data
**Location:** `services_firestore.py:36-49`

```python
# Current implementation
return {
    "period": period,
    "top": [
        {"uid": "u1", "name": "Henrik", "xp": 320},  # Fake data!
        {"uid": "u2", "name": "Eric", "xp": 300},
        {"uid": "u3", "name": "Sara", "xp": 270},
    ],
}
```

**What's Needed:**
- Query Firestore for top users by XP
- Time-based filtering:
  - Daily: XP gained today
  - Weekly: XP gained this week
  - Monthly: XP gained this month
  - All-time: Total XP
- Include user display names
- Implement pagination (top 10, top 50, etc.)
- Consider scheduled updates (cache leaderboard, refresh hourly)

---

#### 6. Streak Calculation Logic
**Current State:** Always returns 0
**Location:** `services_firestore.py:27`

```python
"streak_days": int(data.get("streak_days", 0)),  # mock for now
```

**What's Needed:**
- Track consecutive days of activity
- Logic:
  - Increment streak if user completes challenge today
  - Maintain streak if already completed today
  - Reset to 0 if last activity was >1 day ago
- Store `current_streak` and `longest_streak` in user document
- Update on every challenge completion

**Algorithm:**
```python
def update_streak(uid):
    user_doc = db.collection("users").document(uid).get().to_dict()
    last_attempt = parse_iso(user_doc.get("last_attempt_at"))
    today = datetime.now(timezone.utc).date()
    last_date = last_attempt.date()

    if last_date == today:
        # Already completed today, no change
        return user_doc.get("current_streak", 0)
    elif (today - last_date).days == 1:
        # Consecutive day, increment
        new_streak = user_doc.get("current_streak", 0) + 1
    else:
        # Missed day(s), reset
        new_streak = 1

    db.collection("users").document(uid).set({
        "current_streak": new_streak,
        "longest_streak": max(new_streak, user_doc.get("longest_streak", 0))
    }, merge=True)

    return new_streak
```

---

#### 7. Badge & Achievement System
**Current State:** Hardcoded badge name
**Location:** `app.py:160`

```python
badge = "Week Streak x3"  # mock
```

**What's Needed:**
- Define badge types and unlock conditions
- Track earned badges in user profile
- Award logic triggered by milestones:
  - First challenge completed
  - 3-day streak
  - 7-day streak
  - 30-day streak
  - 100 total challenges
  - Perfect pronunciation (100% accuracy)
- Return new badges in API responses

---

### 📝 **LOW PRIORITY - Polish & Production**

#### 8. Error Handling & Validation
**Issues:**
- Minimal request validation (missing required fields not checked)
- Generic error messages (`"Unauthorized"` without details)
- No input sanitization for text fields
- Try-except blocks too broad

**Improvements:**
```python
# Example: Better error handling
@app.post("/scoreDaily")
@require_auth
def score_daily():
    uid = request.user["uid"]
    body = request.get_json(force=True)

    # Validate required fields
    if not body.get("challenge_id"):
        return jsonify({"error": "challenge_id is required"}), 400
    if not body.get("audio_url"):
        return jsonify({"error": "audio_url is required"}), 400

    try:
        result = evaluate_pronunciation(body)
        add_attempt(uid, body["challenge_id"], body["audio_url"], result)
        return jsonify(result), 200
    except WhisperAPIError as e:
        return jsonify({"error": "Speech recognition failed", "details": str(e)}), 500
    except Exception as e:
        logger.error(f"Unexpected error in score_daily: {e}")
        return jsonify({"error": "Internal server error"}), 500
```

---

#### 9. Production Configuration
**Issues:**
- `debug=True` in production (security risk)
- `SESSION_COOKIE_SECURE = True` breaks local development (requires HTTPS)
- No environment-based config (dev/staging/prod)
- Gunicorn installed but not configured

**Improvements:**
```python
# Use environment variables
ENV = os.getenv("FLASK_ENV", "development")

if ENV == "production":
    app.config['SESSION_COOKIE_SECURE'] = True
    app.config['DEBUG'] = False
else:
    app.config['SESSION_COOKIE_SECURE'] = False
    app.config['DEBUG'] = True

# Gunicorn startup command
# gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

---

#### 10. Additional Endpoints (Nice to Have)
```python
GET /challenges/random          # Get random challenge for practice
POST /challenges/{id}/report    # Report inappropriate content
GET /user/history               # Paginated attempt history
DELETE /user/account            # Account deletion
GET /stats/global               # Global app statistics
```

---

## 🌍 Cross-Platform Considerations

Since the app runs on **iOS, Android, Mac, Windows**:

### 1. CORS Configuration
**Current:** Allows all origins if `CORS_ORIGINS` not set
```python
CORS(app, resources={r"/*": {"origins": cors_origins or "*"}})
```

**Recommendation:**
- Set specific origins in production
- Allow localhost variants for development: `http://localhost:*`, `http://127.0.0.1:*`
- Allow Expo tunnel URLs: `https://*.ngrok.io`, `https://*.expo.dev`

### 2. Session Cookies (Not for Mobile)
Mobile app should **only use token-based auth** (`@require_auth`). Session-based auth is for the web interface only.

Consider:
- Separate session config for web routes
- Ensure mobile endpoints don't rely on cookies

### 3. Audio Format Compatibility
Expo's `expo-av` uses `HIGH_QUALITY` preset, likely outputs:
- iOS: `.m4a` (AAC)
- Android: `.mp4` (AAC) or `.3gp`

Whisper API accepts: `.mp3`, `.mp4`, `.mpeg`, `.mpga`, `.m4a`, `.wav`, `.webm`

**Action:** Test actual format from expo-av and verify Whisper compatibility.

### 4. Network Connectivity
**Development:**
- Simulators/emulators: Use computer's IP address (e.g., `http://192.168.1.100:5000`)
- Physical devices: Use Expo tunnel or ngrok

**Production:**
- Deploy to cloud (Google Cloud Run, Heroku, AWS)
- Use HTTPS with valid SSL certificate
- Update `shared/config/endpoints.js` with production URL

---

## 📋 Recommended Implementation Roadmap

### Phase 1: Core Functionality (Week 1-2)
1. ✅ **Audio Upload Endpoint** - Blocking mobile recording feature
   - Firebase Storage setup
   - Multipart file upload handling
   - Return storage URLs

2. ✅ **Challenge Delivery API** - Move from local JSON to backend
   - Migrate challenges to Firestore
   - Implement fetch endpoints
   - Basic challenge rotation

3. ✅ **User Profile API** - Display names for leaderboard
   - Registration endpoint
   - Profile fetch/update
   - Link to Firestore

### Phase 2: AI Integration (Week 3-4)
4. ✅ **Whisper API Integration** - Core pronunciation feature
   - OpenAI API setup
   - Audio transcription
   - Accuracy scoring algorithm
   - Feedback generation

### Phase 3: Gamification (Week 5)
5. ✅ **Real Leaderboard Calculation** - Competitive element
   - Firestore queries for top users
   - Time-based filtering
   - Caching strategy

6. ✅ **Streak Calculation** - User retention
   - Daily activity tracking
   - Streak increment/reset logic
   - Historical tracking

7. ✅ **Badge System** - Achievements
   - Badge definitions
   - Unlock conditions
   - Award logic

### Phase 4: Production Readiness (Week 6)
8. ✅ **Error Handling & Validation** - Stability
9. ✅ **Production Configuration** - Security
10. ✅ **Logging & Monitoring** - Observability
11. ✅ **Rate Limiting** - Abuse prevention
12. ✅ **Deployment Setup** - Go live

---

## Environment Setup Checklist

Ensure these are configured:

- [ ] `.env` file created with:
  - `SECRET_KEY` - Flask session secret
  - `CORS_ORIGINS` - Allowed origins (comma-separated)
  - `GOOGLE_APPLICATION_CREDENTIALS` - Path to `firebase-auth.json`
  - `OPENAI_API_KEY` - For Whisper API (when implemented)
  - `FLASK_ENV` - `development` or `production`

- [ ] `firebase-auth.json` - Service account key placed in `Flask-Firebase/`
- [ ] Firebase project settings verified:
  - Firestore enabled
  - Firebase Storage enabled
  - Authentication providers enabled (Email/Password, Google)

---

## Testing Recommendations

### Manual Testing
```bash
# Health check
curl http://localhost:5000/health

# Firestore test
curl http://localhost:5000/firestore-test

# Leaderboard (no auth)
curl http://localhost:5000/leaderboard?period=weekly

# User stats (requires Firebase token)
curl http://localhost:5000/userStats \
  -H "Authorization: Bearer <FIREBASE_ID_TOKEN>"
```

### Automated Testing
Currently **no tests** exist. Recommend:
- Unit tests for `services_firestore.py` functions
- Integration tests for API endpoints
- Mock Firebase Admin SDK for testing
- Use `pytest` framework

---

## File Structure Reference

```
Flask-Firebase/
├── app.py                          # Main Flask application
├── auth_mw.py                      # @require_auth decorator
├── services_firestore.py           # Firestore CRUD operations
├── firebase_config.py              # Firebase initialization
├── requirements.txt                # Python dependencies
├── .env                            # Environment variables (not committed)
├── firebase-auth.json              # Service account key (not committed)
├── static/                         # Web interface assets
│   ├── firebase-config.js          # Client-side Firebase config
│   ├── login-auth.js               # Authentication logic
│   └── styles.css
└── templates/                      # HTML templates for web interface
    ├── login.html
    ├── signup.html
    └── dashboard.html
```

---

## Questions for Backend Developer

1. **Whisper Integration:** Do you prefer OpenAI's hosted Whisper API or self-hosted Whisper model?
2. **Audio Storage:** Should audio files be kept permanently or auto-deleted after processing?
3. **Leaderboard:** How many users should be returned? Should we paginate?
4. **Challenge Rotation:** Daily reset at midnight (which timezone)? Or rolling 24-hour windows?
5. **Deployment:** Any preference for hosting platform (Google Cloud, AWS, Heroku)?
6. **Rate Limiting:** Should we implement per-user rate limits for uploads?

---

## Contact & Resources

- **Mobile App Config:** `snop/shared/config/endpoints.js` (set `USE_MOCK = false` to connect)
- **Firebase Console:** [https://console.firebase.google.com/project/snop-b76ac](https://console.firebase.google.com/project/snop-b76ac)
- **Current API Base URL:** `http://localhost:5000` (development)
- **Documentation:** See `CLAUDE.md` in repo root for full architecture overview

---

**Report Generated:** November 10, 2025
**Status:** Backend functional for testing, critical features pending for production
