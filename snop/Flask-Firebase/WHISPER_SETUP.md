# Self-Hosted Whisper Setup Guide

## What Was Wrong

The pronunciation scoring failed during your presentation because:

1. **Missing `.env` file** - This file is `.gitignored` (intentionally not in git) because it contains environment-specific configuration. Each developer needs their own copy.

2. **Broken PyTorch installation** - Whisper requires PyTorch (the AI framework), but it was corrupted with missing library files (`libtorch_global_deps.dylib`). This happens when mixing conda and pip installations.

3. **Mobile app in mock mode** - The mobile app had `USE_MOCK = true` in `shared/config/endpoints.js`, so it never actually called the backend API.

## Complete Setup Instructions (For Eric or Any New Developer)

### Step 1: Backend Environment Configuration

Create a `.env` file in the `Flask-Firebase/` directory:

```bash
cd snop/Flask-Firebase
touch .env
```

Add this content to `.env`:

```bash
# Flask Configuration
SECRET_KEY=dev-secret-key-change-in-production
CORS_ORIGINS=http://localhost:5000,http://localhost:8081,http://localhost:19006
PORT=5000

# Pronunciation Evaluation
# Set to "false" to use real self-hosted Whisper model (FREE, no API costs)
USE_MOCK_PRONUNCIATION=false

# OpenAI API Key (DEPRECATED - only needed if using cloud Whisper API)
# Leave empty when using self-hosted Whisper (recommended)
OPENAI_API_KEY=

# Leaderboard
USE_MOCK_LEADERBOARD=true

# Firebase Admin SDK
# Service account credentials should be in firebase-auth.json
```

**Why is `.env` not in git?**
- Contains sensitive configuration (API keys, secrets)
- Environment-specific (localhost on your machine, different on Eric's)
- Standard practice: each developer creates their own `.env` file
- Firebase credentials (firebase-auth.json) should also stay out of git

### Step 2: Install Python Dependencies (Including Whisper)

Make sure you have Python 3.8+ installed. Then:

```bash
cd snop/Flask-Firebase

# If using a virtual environment (recommended):
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install all dependencies including Whisper
pip install -r requirements.txt
```

**If you get PyTorch errors** (like we did), fix it with:

```bash
# Remove broken PyTorch
pip uninstall -y torch torchvision torchaudio

# Force clean reinstall
rm -rf /path/to/site-packages/torch*  # Adjust path to your Python
pip install --force-reinstall --no-cache-dir torch
```

On Apple Silicon Macs, PyTorch 2.9.1+ works best.

### Step 3: Verify Whisper Works

Test that Whisper can load:

```bash
python -c "import whisper; print('✓ Whisper loaded'); model = whisper.load_model('base'); print('✓ Model loaded')"
```

You should see:
```
✓ Whisper loaded
Loading Whisper model (this may take a moment on first run)...
Whisper model loaded!
✓ Model loaded
```

**First run takes longer** - Whisper downloads the ~140MB "base" model. Subsequent runs are instant.

### Step 4: Start the Backend

```bash
cd snop/Flask-Firebase
python app.py
```

Look for this in the logs:
```
INFO - Mock pronunciation: False  ← Real Whisper is enabled
INFO - Firebase initialized successfully
* Running on http://127.0.0.1:5000
```

If you see `Mock pronunciation: True`, check your `.env` file.

### Step 5: Configure Mobile App for Real API

Edit `snop/shared/config/endpoints.js`:

```javascript
export const USE_MOCK = false; // Must be false to use real backend
export const API_BASE_URL = 'http://localhost:5000';
```

**After changing this, you MUST restart the mobile app:**

```bash
cd snop/mobile

# Stop Metro (Ctrl+C) and restart with cache clear:
npm start -- --reset-cache

# Or in iOS Simulator, press Cmd+R to reload
```

### Step 6: Test End-to-End

1. Open mobile app in iOS Simulator or device
2. Navigate to a Daily Challenge
3. Record yourself saying the Norwegian phrase
4. Press "Upload"

**In the backend terminal**, you should see:

```
[PRONUNCIATION] Processing challenge daily_1 for user abc123...
[PRONUNCIATION] Audio URL: https://firebasestorage.googleapis.com/...
[PRONUNCIATION] Target phrase: Hei, hvordan går det?
[PRONUNCIATION] Using REAL WHISPER evaluation
Loading Whisper model (this may take a moment on first run)...
Whisper model loaded!
[PRONUNCIATION] Starting Whisper transcription...
[PRONUNCIATION] Whisper result: transcription='Hei, hvordan går det', similarity=0.95, pass=True
[PRONUNCIATION] ✓ Success! XP: 10, Pass: True
```

## How Self-Hosted Whisper Works

### Architecture

1. **Mobile app** records audio with expo-av (M4A format)
2. **Audio upload** to Firebase Storage (anonymous auth)
3. **Backend receives** Firebase Storage URL
4. **Whisper downloads** audio from Firebase Storage
5. **Whisper transcribes** audio using local AI model (Norwegian language)
6. **Similarity calculation** compares transcription to target phrase
7. **Backend returns** score, feedback, XP to mobile app

### Why Self-Hosted?

- **FREE** - No API costs, no rate limits
- **Fast** - Base model transcribes in 1-3 seconds on most hardware
- **Privacy** - Audio never leaves your infrastructure
- **Offline capable** - Works without internet (after model download)

### Model Options

The code uses the "base" model - good balance of speed and accuracy:

| Model  | Size  | Speed         | Accuracy | Norwegian Support |
|--------|-------|---------------|----------|-------------------|
| tiny   | ~39MB | Very Fast     | Lower    | Yes               |
| base   | ~74MB | Fast          | Good     | ✓ Best for us     |
| small  | ~244MB| Medium        | Better   | Yes               |
| medium | ~769MB| Slow          | Great    | Yes               |
| large  | ~1.5GB| Very Slow     | Best     | Yes               |

To change the model, edit `services_pronunciation.py:127`:

```python
_whisper_model = whisper.load_model("base")  # Change to "tiny", "small", etc.
```

### Language Configuration

Whisper is set to Norwegian ("no") in `services_pronunciation.py:153` and `:167`:

```python
result = model.transcribe(file_path, language="no")
```

This tells Whisper to expect Norwegian speech, improving accuracy.

## Troubleshooting

### "No requests appearing in backend logs"

**Problem:** Mobile app still using mock data or not connecting

**Solution:**
1. Check `shared/config/endpoints.js` has `USE_MOCK = false`
2. Restart Metro bundler: `npm start -- --reset-cache`
3. Reload app in simulator (Cmd+R)
4. Check mobile terminal for network errors

### "Network request failed"

**Problem:** Mobile app can't reach backend

**Solution:**
1. Verify backend is running: `curl http://localhost:5000/health`
2. Check iOS Simulator allows localhost connections
3. For physical device, use computer's IP: `export const API_BASE_URL = 'http://192.168.1.x:5000'`

### "OSError: dlopen ... libtorch_global_deps.dylib"

**Problem:** PyTorch installation is corrupted

**Solution:** See Step 2 above for clean reinstall

### "Model not found" or "Download failed"

**Problem:** First Whisper run needs to download model

**Solution:**
1. Ensure internet connection on first run
2. Model downloads to `~/.cache/whisper/`
3. Takes 30-60 seconds for base model
4. Subsequent runs are instant (uses cached model)

### "Error processing audio: ..."

**Problem:** Audio file format or Firebase Storage access

**Solution:**
1. Check Firebase Storage rules allow read access
2. Verify audio URL is accessible (should be Firebase Storage URL)
3. Check backend logs for specific error
4. Mobile app records in M4A format (supported by Whisper)

## Performance Tips

1. **First request is slow** - Whisper loads model into memory (~3-5 seconds)
2. **Subsequent requests are fast** - Model stays loaded (1-3 seconds)
3. **Use "tiny" model for development** - Faster iteration
4. **Use "base" or "small" for production** - Better accuracy

## Testing Without Mobile App

You can test Whisper directly with any audio file:

```bash
cd snop/Flask-Firebase
python -c "
from services_pronunciation import evaluate_pronunciation

result = evaluate_pronunciation(
    audio_url='path/to/audio.m4a',  # or Firebase Storage URL
    target_phrase='Hei, hvordan går det?',
    difficulty=1
)

print(f'Transcription: {result[\"transcription\"]}')
print(f'Similarity: {result[\"similarity\"]}')
print(f'Pass: {result[\"pass\"]}')
print(f'XP: {result[\"xp_gained\"]}')
print(f'Feedback: {result[\"feedback\"]}')
"
```

## What Eric Needs to Do

1. **Create `.env` file** in `Flask-Firebase/` directory (copy from above)
2. **Install dependencies**: `pip install -r requirements.txt`
3. **Verify Whisper works**: Run the test command from Step 3
4. **Start backend**: `python app.py`
5. **Configure mobile app**: Set `USE_MOCK = false` in `shared/config/endpoints.js`
6. **Restart mobile app**: Clear cache with `npm start -- --reset-cache`
7. **Test**: Record and submit audio, watch backend logs

That's it! No API keys needed, everything runs locally and is FREE.

## Summary

- Self-hosted Whisper = FREE pronunciation scoring
- PyTorch must be installed correctly (Whisper's AI engine)
- `.env` file configures mock vs real mode
- Mobile app must be in real API mode and reloaded after config changes
- First run downloads model (~140MB), then instant
- Check backend logs to see live transcription results
