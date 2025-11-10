# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SNOP is an HCAI (Human-Computer AI Interaction) semester project - a language learning/pronunciation practice application with gamification elements (XP, streaks, leaderboards). The system consists of a Flask backend with Firebase integration and a React Native mobile app built with Expo.

## Architecture

### Three-tier Structure
```
snop/
├── Flask-Firebase/   # Backend API (Python/Flask + Firebase)
├── mobile/           # Mobile app (React Native + Expo)
└── shared/           # Shared configuration (endpoints, types)
```

### Tech Stack
- **Backend**: Flask 3.0.3, Firebase Admin SDK, Firestore, gunicorn
- **Mobile**: React Native 0.81.5, Expo 54.0.21, React Navigation 7.x
- **State Management**: React Context API (AuthContext, ChallengeContext, AudioContext)
- **Authentication**: Firebase Authentication with Bearer token verification
- **Database**: Cloud Firestore (NoSQL document store)
- **API Communication**: Axios with switchable Mock/Real API adapters

## Development Commands

### Backend (Flask-Firebase)

**Setup:**
```bash
cd snop/Flask-Firebase
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

**Run:**
```bash
cd snop/Flask-Firebase
python app.py
# Server runs on http://localhost:5000
```

**Test Firestore Connection:**
```bash
curl http://localhost:5000/firestore-test
```

### Mobile (React Native/Expo)

**Setup:**
```bash
cd snop/mobile
npm install
```

**Run:**
```bash
cd snop/mobile
npm start          # Start Expo dev server with tunnel
npm run android    # Run on Android device/emulator
npm run ios        # Run on iOS device/simulator
npm run web        # Run in web browser
```

**Switch Between Mock and Real API:**
Edit `snop/shared/config/endpoints.js`:
```javascript
export const USE_MOCK = true;  // false to use real backend
export const API_BASE_URL = 'http://localhost:5000';
```

## Key Architecture Patterns

### Authentication Flow

1. **Mobile App → Firebase Auth**: User signs in via Firebase SDK
2. **Token Storage**: ID token stored in `expo-secure-store` (AuthContext)
3. **API Requests**: Token sent as `Authorization: Bearer <token>` header
4. **Backend Verification**: `@require_auth` decorator (auth_mw.py:175) validates token with Firebase Admin SDK
5. **Request Context**: Decoded token attached to `request.user` with `uid`, `email`, etc.

**Example Protected Endpoint:**
```python
from auth_mw import require_auth

@app.post("/scoreDaily")
@require_auth
def score_daily():
    uid = request.user["uid"]  # Extracted from verified token
    # ... handle request
```

### Mobile App State Management

**Three Main Contexts:**
- `AuthContext` (src/context/AuthContext.js): User authentication, token persistence
- `ChallengeContext`: Challenge data, current challenge state
- `AudioContext`: Audio recording/playback with expo-av

**Service Layer Pattern:**
- `src/services/api.js`: Abstraction with Mock/HTTP adapters (switchable via USE_MOCK)
- Mock adapter returns data from `src/data/challenges.json`
- HTTP adapter uses Axios to call Flask backend

### Firestore Database Schema

```
users/{uid}/
  - xp_total: number
  - streak_days: number
  - last_attempt_at: timestamp
  - attempts/{attemptId}
      - challenge_id: string
      - audio_url: string
      - result: {xp_gained, feedback, pass}
      - created_at: timestamp
  - weekly_verifications/{week}
      - verified: boolean
      - badge: string
      - verified_at: timestamp

leaderboards/{period}
  - top: [{uid, name, xp}, ...]
```

**Access Pattern:**
All Firestore operations are centralized in `snop/Flask-Firebase/services_firestore.py`. Use these functions:
- `add_attempt(uid, challenge_id, audio_url, result)`
- `get_user_stats(uid)`
- `set_weekly_verification(uid, week, badge)`
- `get_leaderboard(period)`

## API Endpoints

### Public Routes
- `GET /` - Home page
- `GET /login`, `/signup`, `/reset-password` - Auth pages
- `GET /health` - Health check
- `POST /auth` - Token verification (sets session)

### Challenge Routes (Public)
- `GET /challenges/daily` - Get all daily challenges from Firestore
- `GET /challenges/weekly` - Get all weekly challenges from Firestore
- `GET /challenges/monthly` - Get all monthly challenges from Firestore
- `GET /challenges/<id>` - Get specific challenge by ID
- `POST /challenges` - Create new challenge (requires auth)

### Protected Routes (Require Bearer Token)
- `POST /scoreDaily` - Submit pronunciation attempt with Whisper evaluation
  - Body: `{challenge_id, audio_url}`
  - Returns: `{transcription, xp_gained, feedback, pass, similarity}`
  - Uses OpenAI Whisper API for speech-to-text (or mock mode)
- `POST /verifyWeekly` - Mark weekly challenge completed
  - Body: `{week}` (e.g., "2025-W44")
  - Returns: `{verified, badge}`
- `GET /userStats` - Get user XP, streak, attempts
- `GET /leaderboard?period=weekly` - Get leaderboard (public)

## Important Implementation Notes

### Recently Implemented
1. **Challenge Delivery API**: Challenges are now stored in Firestore and served via REST API endpoints
   - Use `migrate_challenges.py` to populate Firestore from JSON
   - Mobile app can fetch fresh challenges from backend
2. **Whisper API Integration**: Real pronunciation evaluation implemented in `services_pronunciation.py`
   - Supports both real Whisper API and mock mode (set via `USE_MOCK_PRONUNCIATION` env var)
   - Calculates similarity score, XP, and provides feedback
   - See `snop/Flask-Firebase/SETUP.md` for testing instructions

### Current Limitations
1. **Audio Upload**: Mobile app does not yet upload actual audio files to backend. The `audio_url` field needs Firebase Storage integration (being worked on by teammate).
2. **Testing**: No formal test framework configured (no pytest, jest, or test files present).
3. **Leaderboard**: Still returns hardcoded mock data - real calculation not yet implemented.
4. **Streak Calculation**: Still returns 0 - real daily activity tracking not yet implemented.

### Environment Configuration

**Backend (.env in Flask-Firebase/):**
```
SECRET_KEY=<flask-secret-key>
CORS_ORIGINS=http://localhost:5000,http://localhost:8081
PORT=8000
OPENAI_API_KEY=<your-openai-api-key>  # For Whisper API
USE_MOCK_PRONUNCIATION=true  # Set to false to use real Whisper API
```

**Firebase Credentials:**
- `snop/Flask-Firebase/firebase-auth.json` contains service account credentials
- **Do not commit this file** (contains sensitive keys)

**OpenAI API Key:**
- Get from https://platform.openai.com/api-keys
- Required only if `USE_MOCK_PRONUNCIATION=false`
- Keep mock mode enabled during development to avoid API costs

### Mobile Navigation Structure

Bottom tab navigation with 5 screens:
1. HomeScreen - Main feed/dashboard
2. DailyScreen - Daily pronunciation challenges
3. WeeklyScreen - Weekly challenges
4. MonthlyScreen - Monthly challenges
5. StatsScreen - User stats & leaderboard

Navigation setup: `src/navigation/TabNavigator.js` → `src/navigation/AppNavigator.js`

## Code Style Notes

- Backend uses Flask blueprints pattern with decorators for auth
- Mobile uses functional components with React Hooks
- Shared types defined in `snop/shared/types/challengeType.js`
- Mobile styles centralized in `src/styles/` (colors, typography, layout)

## Common Development Workflows

### Adding a New Protected API Endpoint
1. Add route in `snop/Flask-Firebase/app.py`
2. Apply `@require_auth` decorator
3. Access user via `request.user["uid"]`
4. Use functions from `services_firestore.py` for database operations

### Adding New Challenges
1. **Option A - Via Migration Script:**
   - Add challenges to `snop/mobile/src/data/challenges.json`
   - Run `python migrate_challenges.py` from Flask-Firebase directory
2. **Option B - Via API:**
   - POST to `/challenges` endpoint with valid auth token
   - Include: title, difficulty, frequency, description, (optional: prompt, target)

### Testing Pronunciation Evaluation
1. Keep `USE_MOCK_PRONUNCIATION=true` in `.env` for development
2. Call `/scoreDaily` with any `audio_url` (mock ignores the actual file)
3. Mock will simulate random accuracy scores for testing
4. Switch to `false` and add `OPENAI_API_KEY` for production testing

### Adding a New Mobile Screen
1. Create component in `src/screens/`
2. Add to navigator in `src/navigation/AppNavigator.js` or `TabNavigator.js`
3. Use `useContext(AuthContext)` for user data
4. Use `src/services/api.js` for backend calls

### Working with Mock Data During Development
1. **Mobile Mock Mode:** Set `USE_MOCK = true` in `snop/shared/config/endpoints.js`
   - Mobile app uses local `challenges.json`
   - No backend required
2. **Backend Mock Mode:** Set `USE_MOCK_PRONUNCIATION=true` in `snop/Flask-Firebase/.env`
   - Backend simulates pronunciation evaluation
   - No OpenAI API costs

### Running the Full Stack
1. Start backend: `cd snop/Flask-Firebase && python app.py`
2. Start mobile: `cd snop/mobile && npm start`
3. Update mobile config: Set `USE_MOCK = false` in `shared/config/endpoints.js`
4. Ensure challenges are migrated to Firestore
