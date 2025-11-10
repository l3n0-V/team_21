# Backend Setup & Testing Guide

This guide walks you through setting up and testing the new Challenge Delivery API and Whisper pronunciation evaluation features.

## Prerequisites

- Python 3.x installed
- Firebase project set up with Firestore enabled
- `firebase-auth.json` service account key in the `Flask-Firebase/` directory

## Step 1: Install Dependencies

The `requirements.txt` already includes all necessary packages. If you need to reinstall:

```bash
cd snop/Flask-Firebase
pip install -r requirements.txt
```

## Step 2: Configure Environment Variables

The `.env` file should already be configured. Verify it contains:

```env
SECRET_KEY=<your-secret-key>
GOOGLE_APPLICATION_CREDENTIALS=./firebase-auth.json
CORS_ORIGINS=http://127.0.0.1:5000,http://localhost:5000
PORT=8000

# OpenAI Whisper API (optional - for production)
OPENAI_API_KEY=your_openai_api_key_here

# Set to "true" for testing without API costs
USE_MOCK_PRONUNCIATION=true
```

### Getting an OpenAI API Key (Optional)

1. Go to https://platform.openai.com/api-keys
2. Sign up or log in
3. Create a new API key
4. Copy it to the `OPENAI_API_KEY` in `.env`
5. Set `USE_MOCK_PRONUNCIATION=false` to use real Whisper API

**Note:** For development, keep `USE_MOCK_PRONUNCIATION=true` to avoid API costs.

## Step 3: Migrate Challenges to Firestore

Run the migration script to upload challenges from the mobile app's JSON to Firestore:

```bash
cd snop/Flask-Firebase
python migrate_challenges.py
```

You should see output like:

```
📖 Loaded challenges from ...
   - Daily: 2 challenges
   - Weekly: 1 challenges
   - Monthly: 2 challenges

✅ Added daily challenge: d1 - How to order coffee
✅ Added daily challenge: d2 - Introduce yourself
✅ Added weekly challenge: w1 - Order a coffee IRL
✅ Added monthly challenge: m1 - Talk about the weather
✅ Added monthly challenge: m2 - Introduce yourself to a new person

🎉 Migration complete! Added 5 challenges to Firestore.
```

## Step 4: Start the Flask Server

```bash
cd snop/Flask-Firebase
python app.py
```

The server will start at `http://localhost:5000`

## Step 5: Test the New Endpoints

### Test Challenge Endpoints

**Get Daily Challenges:**
```bash
curl http://localhost:5000/challenges/daily
```

Expected response:
```json
{
  "challenges": [
    {
      "id": "d1",
      "title": "How to order coffee",
      "prompt": "Order a coffee politely",
      "target": "Hi! I would like a coffee, please.",
      "difficulty": 1,
      "frequency": "daily",
      "description": "Practice ordering a coffee..."
    },
    ...
  ]
}
```

**Get Weekly Challenges:**
```bash
curl http://localhost:5000/challenges/weekly
```

**Get Monthly Challenges:**
```bash
curl http://localhost:5000/challenges/monthly
```

**Get Specific Challenge:**
```bash
curl http://localhost:5000/challenges/d1
```

### Test Pronunciation Evaluation (with Mock)

**Important:** You need a valid Firebase authentication token to test `/scoreDaily`.

#### Option 1: Using Mock Evaluation (Recommended for Testing)

With `USE_MOCK_PRONUNCIATION=true` in `.env`, the endpoint will simulate pronunciation scoring without calling Whisper API:

```bash
curl -X POST http://localhost:5000/scoreDaily \
  -H "Authorization: Bearer <YOUR_FIREBASE_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "challenge_id": "d1",
    "audio_url": "https://example.com/audio.m4a"
  }'
```

Expected response:
```json
{
  "transcription": "Hi! I would like a coffee, please.",
  "xp_gained": 9,
  "feedback": "Great pronunciation! Just minor differences.",
  "pass": true,
  "similarity": 0.87
}
```

The mock will randomly simulate different accuracy levels each time.

#### Option 2: Using Real Whisper API

1. Set `USE_MOCK_PRONUNCIATION=false` in `.env`
2. Add your `OPENAI_API_KEY` to `.env`
3. Restart the Flask server
4. Upload a real audio file to Firebase Storage (or use a public audio URL)
5. Call the endpoint with the real audio URL

**Note:** This will incur costs from OpenAI API usage.

## Step 6: Verify Data in Firestore

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Navigate to **Firestore Database**
4. You should see:
   - `challenges` collection with your migrated challenges
   - `users/{uid}/attempts` collection (after testing `/scoreDaily`)

## Testing Checklist

- [ ] Migration script ran successfully
- [ ] Flask server starts without errors
- [ ] `GET /challenges/daily` returns challenges
- [ ] `GET /challenges/weekly` returns challenges
- [ ] `GET /challenges/monthly` returns challenges
- [ ] `GET /challenges/d1` returns a specific challenge
- [ ] `POST /scoreDaily` with valid token returns pronunciation results
- [ ] Firestore shows challenges in the database
- [ ] Firestore shows user attempts after calling `/scoreDaily`

## Common Issues

### Issue: "OPENAI_API_KEY not set"

**Solution:** If using mock mode, this error shouldn't appear. Verify `.env` has `USE_MOCK_PRONUNCIATION=true`

### Issue: "Challenge not found"

**Solution:** Run the migration script again: `python migrate_challenges.py`

### Issue: "Invalid token" when calling `/scoreDaily`

**Solution:** You need a valid Firebase ID token from the mobile app. To get one:
1. Run the mobile app
2. Log in with a test user
3. The app stores the token in `expo-secure-store`
4. Add logging to the mobile app to print the token for testing

### Issue: Migration script says "challenges.json not found"

**Solution:** Verify the path is correct. The script expects:
```
team_21/
├── snop/
│   ├── Flask-Firebase/
│   │   └── migrate_challenges.py  (you are here)
│   └── mobile/
│       └── src/
│           └── data/
│               └── challenges.json  (script looks here)
```

## Next Steps

### For Mobile App Integration

Update the mobile app to use the new API:

1. Set `USE_MOCK = false` in `snop/shared/config/endpoints.js`
2. Update `src/services/api.js` to call the new challenge endpoints
3. Test the full flow: fetch challenges → record audio → upload audio (when ready) → submit for evaluation

### For Production Deployment

1. Set `USE_MOCK_PRONUNCIATION=false` in production `.env`
2. Add your OpenAI API key
3. Configure proper CORS origins
4. Use a production WSGI server (gunicorn is already in requirements.txt):
   ```bash
   gunicorn -w 4 -b 0.0.0.0:5000 app:app
   ```
5. Set up HTTPS with SSL certificate
6. Deploy to cloud platform (Google Cloud Run, Heroku, AWS, etc.)

## API Reference

### Challenge Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/challenges/daily` | GET | No | Get all daily challenges |
| `/challenges/weekly` | GET | No | Get all weekly challenges |
| `/challenges/monthly` | GET | No | Get all monthly challenges |
| `/challenges/<id>` | GET | No | Get specific challenge by ID |
| `/challenges` | POST | Yes | Create new challenge (admin) |

### Pronunciation Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/scoreDaily` | POST | Yes | Evaluate pronunciation attempt |

**Request Body for `/scoreDaily`:**
```json
{
  "challenge_id": "d1",
  "audio_url": "https://storage.googleapis.com/..."
}
```

**Response:**
```json
{
  "transcription": "what the user said",
  "xp_gained": 10,
  "feedback": "helpful feedback message",
  "pass": true,
  "similarity": 0.95
}
```

## Files Created/Modified

### New Files
- `services_challenges.py` - Challenge database operations
- `services_pronunciation.py` - Whisper API integration and scoring
- `migrate_challenges.py` - One-time migration script
- `SETUP.md` - This file

### Modified Files
- `app.py` - Added new endpoints
- `.env` - Added Whisper API configuration

## Questions?

Refer to:
- `CLAUDE.md` in the repo root for full architecture
- `BACKEND_REPORT.md` for the implementation roadmap
- Firebase Console for database verification
