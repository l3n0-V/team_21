# SNOP Backend - API Server Report

**Project:** SNOP - Norwegian Language Learning App
**Framework:** Flask 3.0.3 with Firebase Admin SDK
**Last Updated:** November 24, 2025

---

## Executive Summary

The Flask-Firebase backend provides a complete REST API for the SNOP language learning application. Key features include **CEFR-based challenge progression** (A1-C2 levels), **self-hosted Whisper model** for pronunciation evaluation (FREE, no API costs), AI-powered challenge generation, IRL photo verification with CLIP, and comprehensive gamification with XP, streaks, badges, and leaderboards.

**Current Status:** Production-ready with 30+ API endpoints, automatic challenge rotation, and full CEFR integration.

---

## Tech Stack

### Core Framework
- **Flask 3.0.3** - Python web framework
- **Firebase Admin SDK 6.6.0** - Authentication & Firestore database
- **Flask-CORS 4.0.1** - Cross-origin request handling
- **Flask-Limiter 3.5.0** - Rate limiting middleware
- **Gunicorn 23.0.0** - Production WSGI server

### AI Models (Self-Hosted)
- **OpenAI Whisper** - Speech-to-text for pronunciation evaluation (FREE local model)
- **OpenAI CLIP** - Image verification for IRL challenges
- **Llama 3.2** - Text generation for challenge creation (via Ollama)

### Database
- **Cloud Firestore** - NoSQL document database
- Collections: users, challenge_pool, config, diagnostics

---

## Architecture Overview

### Service Layer Pattern

| Service File | Responsibility | Key Functions |
|--------------|----------------|---------------|
| `app.py` | Main Flask app, API endpoints | 30+ endpoints, error handling |
| `firebase_config.py` | Firebase initialization | Database client export |
| `auth_mw.py` | Authentication middleware | `@require_auth` decorator |
| `config.py` | Environment configuration | Dev/staging/production configs |
| `services_cefr.py` | CEFR progression logic | Level advancement, requirements |
| `services_challenges.py` | Challenge management | Submit answers, CEFR integration |
| `services_challenge_pool.py` | Daily challenge pool | Fetch/mark challenges, limits |
| `services_ai_generation.py` | AI challenge generation | Llama 3.2 integration |
| `services_irl.py` | IRL verification | CLIP image analysis |
| `services_pronunciation.py` | Speech evaluation | Self-hosted Whisper transcription |
| `services_daily_progress.py` | Daily progress tracking | Challenge completion limits |
| `services_firestore.py` | Core database operations | CRUD, XP, streaks |
| `services_badges.py` | Badge/achievement system | 10 badges, automatic awarding |
| `services_users.py` | User profile management | Register, update, delete |

**Total Backend Code:** ~5,500 lines across 12 service files + app.py

### Authentication System

**Dual-mode authentication:**
1. **Token-based (Mobile App)**: Firebase ID token validation via `@require_auth` decorator
   - Bearer token format: `Authorization: Bearer <token>`
   - Decoded token attached to `request.user` with `uid`, `email`, etc.

2. **Session-based (Web Interface)**: For HTML templates

### Database Schema (Firestore)

```
users/{uid}
  ├── email, display_name, photo_url, bio, preferences
  ├── xp_total, xp_daily, xp_weekly, xp_monthly
  ├── current_streak, longest_streak, last_attempt_at
  ├── badges: array, badge_earned_at: map
  ├── cefr_progress: object (A1-C2 levels)
  └── daily_progress: object (challenge completion tracking)

challenge_pool/{challengeId}
  ├── type, cefr_level, difficulty, topic
  ├── title, prompt, target, options, correct_answer
  ├── status: "available" | "archived"
  ├── times_used, last_used_date
  └── created_at, updated_at

config/challenge_rotation
  ├── active_daily, active_weekly, active_monthly
  └── last_daily_rotation, last_weekly_rotation, last_monthly_rotation
```

---

## Key Features

### CEFR Progression System
**Status:** Fully implemented

- **6 CEFR Levels**: A1 (Beginner) → A2 → B1 → B2 → C1 → C2 (Mastery)
- **Automatic Advancement**: Progress based on challenge completion and accuracy
- **Level Requirements**: 20 challenges per level (configurable)
- **Daily Challenge Pool**:
  - 1 IRL challenge
  - 3 Listening challenges
  - 3 Fill-in-the-blank challenges
  - 3 Multiple choice challenges
- **Challenge Pool Management**: 1,200+ challenges generated, automatic rotation

**Key Endpoints:**
- `POST /api/challenges/today` - Get today's CEFR-appropriate challenges
- `POST /api/challenges/submit` - Submit answer with CEFR progression
- `GET /api/user/progress` - Get CEFR level and progress

### AI Challenge Generation
**Status:** Fully operational

- **Llama 3.2 Integration**: Self-hosted via Ollama
- **Challenge Types**: IRL, listening, fill_blank, multiple_choice, pronunciation
- **CEFR-Aware**: Generates appropriate difficulty for each level
- **Topic Variety**: Café, travel, social, shopping, work, weather, navigation, greetings
- **Output**: Structured JSON with Norwegian + English text

**Endpoint:**
- `POST /api/challenges/ai/generate` - Generate batch of challenges

### IRL Photo Verification
**Status:** Working with CLIP model

- **CLIP Model**: Self-hosted image-text similarity analysis
- **Verification Process**: User submits photo + challenge context
- **Score Calculation**: Similarity threshold (0-1 scale)
- **Location Context**: Optional location data for verification

**Endpoints:**
- `POST /api/challenges/irl/verify/multipart` - With file upload
- `POST /api/challenges/irl/verify` - With URL

### Self-Hosted Whisper (Pronunciation)
**Status:** Production-ready, FREE

- **Model**: Whisper 'base' (good balance of speed/accuracy)
- **Language**: Norwegian (nb-NO)
- **Cost**: $0.00 (runs locally vs ~$0.006/min for OpenAI API)
- **Performance**: First load ~30s, subsequent calls instant
- **Similarity Scoring**: Levenshtein distance between transcription and target
- **XP Calculation**: Based on accuracy and challenge difficulty

**Endpoints:**
- `POST /scoreDaily` - Daily pronunciation (1x XP)
- `POST /scoreWeekly` - Weekly pronunciation (1.5x XP)
- `POST /scoreMonthly` - Monthly pronunciation (2x XP)

### Gamification System

**XP System:**
- Time-based XP tracking (daily/weekly/monthly/all-time)
- Automatic reset at period boundaries
- XP multipliers for challenge frequency
- Leaderboards by period

**Streaks:**
- Consecutive day tracking
- UTC timezone consistency
- Automatic longest streak recording
- Break handling (reset to 1)

**Badges (10 total):**
1. First Steps (5 XP) - First challenge
2. 3-Day Streak (10 XP)
3. Week Warrior (25 XP) - 7 days
4. Month Master (100 XP) - 30 days
5. Perfect Accent (15 XP) - 95%+ accuracy
6. Rising Star (20 XP) - 100 total XP
7. Language Enthusiast (50 XP) - 500 XP
8. Pronunciation Pro (100 XP) - 1000 XP
9. Challenge Master (75 XP) - 50 challenges
10. Perfectionist (50 XP) - 100% accuracy 5x

### Challenge Pool Features

- **Option Randomization**: Multiple choice options shuffled to prevent memorization
- **Text-Based Validation**: Compares actual answer text (not just index)
- **Daily Limits**: Enforces challenge type limits per day
- **Status Tracking**: Marks challenges as used, archives after 10 uses
- **Health Monitoring**: Warns when pool is low (<10 available per level)

---

## API Endpoints

### Health & Diagnostics
- `GET /health` - Health check
- `GET /firestore-test` - Test Firestore connectivity

### CEFR Challenge System (Primary)
- `POST /api/challenges/today` - Get today's challenges for user's CEFR level
- `POST /api/challenges/submit` - Submit answer with CEFR progression
- `GET /api/user/progress` - Get CEFR progress and current level
- `POST /api/challenges/irl/verify` - Verify IRL photo challenge
- `POST /api/challenges/ai/generate` - Generate AI challenges (admin)

### Pronunciation Evaluation
- `POST /scoreDaily` - Daily pronunciation (1x XP)
- `POST /scoreWeekly` - Weekly pronunciation (1.5x XP)
- `POST /scoreMonthly` - Monthly pronunciation (2x XP)

### User Management
- `POST /auth/register` - Register new user (rate limited: 5/hour)
- `GET /user/profile` - Get user profile (requires auth)
- `PUT /user/profile` - Update profile (requires auth)
- `DELETE /user/account` - Delete account (requires auth)
- `GET /userStats` - Get XP and streak stats (requires auth)

### Badges & Achievements
- `GET /badges` - Get all badge definitions (public)
- `GET /user/badges` - Get user's earned badges (requires auth)

### Leaderboards
- `GET /leaderboard?period=daily|weekly|monthly|all-time` - Get rankings

### Legacy Challenge System (Still Supported)
- `GET /challenges/daily` - Get daily challenges
- `GET /challenges/weekly` - Get weekly challenges
- `GET /challenges/monthly` - Get monthly challenges
- `GET /challenges/<id>` - Get specific challenge
- `POST /challenges` - Create challenge (requires auth)

**Note:** Legacy frequency-based endpoints coexist with CEFR system for backward compatibility.

---

## Production Features

### Environment-Based Configuration
**File:** `config.py`

- **Development**: Debug mode, HTTP cookies, DEBUG logging
- **Staging**: No debug, HTTPS cookies, INFO logging
- **Production**: Security hardened, WARNING logging, mock services disabled

### Error Handling

**Custom Exception Classes:**
- `APIError` - Base exception (500)
- `ValidationError` - Bad request (400)
- `NotFoundError` - Not found (404)
- `AuthenticationError` - Unauthorized (401)
- `PronunciationEvaluationError` - Whisper processing errors (500)

**CORS Configuration:**
- After-request handler ensures all responses include CORS headers
- Supports development (`*`) and production (specific origins)
- Proper OPTIONS preflight handling

### Rate Limiting

**Global Limits:**
- 200 requests/day per IP
- 50 requests/hour per IP

**Endpoint-Specific:**
- `/scoreDaily` - 20/hour (prevents abuse)
- `/auth/register` - 5/hour (spam protection)

### Structured Logging

- Environment-based log levels (DEBUG/INFO/WARNING)
- Timestamped with module name
- Configurable via `LOG_LEVEL` environment variable

### Production Server (Gunicorn)
**File:** `gunicorn_config.py`

- Workers: `(CPU cores * 2) + 1`
- Timeout: 120 seconds (for Whisper/CLIP processing)
- Keepalive: 5 seconds
- Backlog: 2048 connections

---

## Environment Configuration

### Required Environment Variables (.env)

```env
# Flask Configuration
SECRET_KEY=<flask-secret-key>
CORS_ORIGINS=http://localhost:5000,http://localhost:8081
PORT=5000
FLASK_ENV=development  # "development", "staging", or "production"

# Firebase Configuration
FIREBASE_CREDENTIALS_PATH=./firebase-auth.json

# Feature Toggles
USE_MOCK_PRONUNCIATION=true   # true for mock, false for real Whisper
USE_MOCK_LEADERBOARD=false    # true for demo data

# Logging (Optional)
LOG_LEVEL=INFO

# Server (Optional)
HOST=0.0.0.0
```

---

## Project Statistics

### Team Contributions

#### Eric
**Primary Areas:** Backend Services, Challenge Generation, Authentication

**Key Contributions:**
- Complete challenge generation backend system with Llama 3.2
- Firebase Authentication (login, registration, Google auth)
- Firebase Storage configuration and integration
- Backend services for pronunciation scoring and challenge delivery
- CEFR progression system implementation
- Challenge pool management
- IRL verification with CLIP
- Initial frontend and backend project skeleton

**Assessment:** Eric fulfilled his backend responsibilities comprehensively, building the core server infrastructure and challenge generation system. His work establishing the Firebase authentication and storage services provided the foundation for user data management.

#### Henrik
**Primary Areas:** Frontend UI/UX, API Integration, Testing

**Key Contributions:**
- Frontend-backend coordination and API integration
- Network error handling and debugging
- Whisper AI integration and testing
- API endpoint testing and validation
- CORS configuration fixes

**Assessment:** Henrik contributed significantly to backend testing and integration work, ensuring the mobile app could communicate reliably with the backend.

---

## Development Setup

### Installation

```bash
cd snop/Flask-Firebase
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

### Running the Server

**Development:**
```bash
python app.py
# Server runs on http://localhost:5000
```

**Production:**
```bash
export FLASK_ENV=production
export USE_MOCK_PRONUNCIATION=false
export USE_MOCK_LEADERBOARD=false
gunicorn -c gunicorn_config.py app:app
```

### Testing Firestore Connection
```bash
curl http://localhost:5000/firestore-test
```

### First-Time Whisper Setup

On first request to `/scoreDaily` with `USE_MOCK_PRONUNCIATION=false`:
- Whisper model downloads and loads (~30 seconds)
- Subsequent requests are instant
- Model stays in memory until server restart

---

## Documentation Files

Located in `/snop/Flask-Firebase/`:

- `CEFR_SYSTEM_README.md` (505 lines) - CEFR progression system documentation
- `PRODUCTION.md` (459 lines) - Production deployment guide
- `SETUP.md` (294 lines) - Initial setup instructions
- `WHISPER_SETUP.md` (299 lines) - Whisper model installation guide
- `README.md` - Project overview

---

## Summary

**Implementation Status:** 100% production-ready

**Core Features:**
- ✅ CEFR progression system (A1-C2)
- ✅ 30+ API endpoints
- ✅ Self-hosted AI models (Whisper, CLIP, Llama)
- ✅ Challenge pool management with 1,200+ challenges
- ✅ Gamification (XP, streaks, badges, leaderboards)
- ✅ Production infrastructure (rate limiting, error handling, logging)
- ✅ Environment-based configuration
- ✅ Dual authentication (token + session)

**Deployment Ready:**
- ✅ Gunicorn production server configured
- ✅ Environment-based configuration
- ✅ CORS properly configured
- ✅ Rate limiting enabled
- ✅ Comprehensive error handling
- ✅ Structured logging

**For Production Use:** Set `USE_MOCK_PRONUNCIATION=false` and `USE_MOCK_LEADERBOARD=false` in environment variables.

---

**Report Maintained By:** Claude Code
**Last Updated:** November 24, 2025
