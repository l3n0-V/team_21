from flask import Flask, redirect, render_template, request, make_response, session, abort, url_for
import secrets
from functools import wraps
import firebase_admin
from firebase_admin import credentials, firestore, auth
from datetime import timedelta
from datetime import datetime
import os
from dotenv import load_dotenv
from flask import jsonify
from flask_cors import CORS

load_dotenv()

app = Flask(__name__)
app.secret_key = os.getenv('SECRET_KEY')

cors_origins = [o.strip() for o in os.getenv("CORS_ORIGINS", "").split(",") if o.strip()]
CORS(app, resources={r"/*": {"origins": cors_origins or "*"}})

# Configure session cookie settings
app.config['SESSION_COOKIE_SECURE'] = True  # Ensure cookies are sent over HTTPS
app.config['SESSION_COOKIE_HTTPONLY'] = True  # Prevent JavaScript access to cookies
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(days=1)  # Adjust session expiration as needed
app.config['SESSION_REFRESH_EACH_REQUEST'] = True
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'  # Can be 'Strict', 'Lax', or 'None'

# Firebase Admin SDK setup
cred = credentials.Certificate("firebase-auth.json")
firebase_admin.initialize_app(cred)
db = firestore.client()

########################################
""" Authentication and Authorization """


# Decorator for routes that require authentication
def auth_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Check if user is authenticated
        if 'user' not in session:
            return redirect(url_for('login'))

        else:
            return f(*args, **kwargs)

    return decorated_function


@app.route('/auth', methods=['POST'])
def authorize():
    token = request.headers.get('Authorization')
    if not token or not token.startswith('Bearer '):
        return "Unauthorized", 401

    token = token[7:]  # Strip off 'Bearer ' to get the actual token

    try:
        decoded_token = auth.verify_id_token(token, check_revoked=True, clock_skew_seconds=60)  # Validate token here
        session['user'] = decoded_token  # Add user to session
        return redirect(url_for('dashboard'))

    except:
        return "Unauthorized", 401


#####################
""" Public Routes """


@app.route('/')
def home():
    return render_template('home.html')


@app.route('/login')
def login():
    if 'user' in session:
        return redirect(url_for('dashboard'))
    else:
        return render_template('login.html')


@app.route('/signup')
def signup():
    if 'user' in session:
        return redirect(url_for('dashboard'))
    else:
        return render_template('signup.html')


@app.route('/reset-password')
def reset_password():
    if 'user' in session:
        return redirect(url_for('dashboard'))
    else:
        return render_template('forgot_password.html')


@app.route('/terms')
def terms():
    return render_template('terms.html')


@app.route('/privacy')
def privacy():
    return render_template('privacy.html')


@app.route('/logout')
def logout():
    session.pop('user', None)  # Remove the user from session
    response = make_response(redirect(url_for('login')))
    response.set_cookie('session', '', expires=0)  # Optionally clear the session cookie
    return response


##############################################
""" Private Routes (Require authorization) """


@app.route('/dashboard')
@auth_required
def dashboard():
    return render_template('dashboard.html')


@app.get("/health")
def health():
    return jsonify({"status": "ok"}), 200

@app.get("/firestore-test")
def firestore_test():
    doc = db.collection("diagnostics").document("ping")
    doc.set({"ok": True, "ts": datetime.utcnow().isoformat()})
    snap = doc.get()
    return jsonify({"exists": snap.exists, "data": snap.to_dict()}), 200

from flask import request, jsonify
from auth_mw import require_auth
from services_firestore import add_attempt, get_user_stats, set_weekly_verification, get_leaderboard
from services_challenges import get_challenges_by_frequency, get_challenge_by_id, add_challenge
from services_pronunciation import evaluate_pronunciation, mock_evaluate_pronunciation
from services_users import register_user, get_user_profile, update_user_profile, delete_user_account

@app.post("/scoreDaily")
@require_auth
def score_daily():
    uid = request.user["uid"]
    body = request.get_json(force=True)

    # Validate required fields
    challenge_id = body.get("challenge_id")
    audio_url = body.get("audio_url")

    if not challenge_id:
        return jsonify({"error": "challenge_id is required"}), 400
    if not audio_url:
        return jsonify({"error": "audio_url is required"}), 400

    # Get the challenge to know the target phrase
    challenge = get_challenge_by_id(challenge_id)
    if not challenge:
        return jsonify({"error": "Challenge not found"}), 404

    # Check if it's a daily challenge with a target phrase
    target_phrase = challenge.get("target")
    if not target_phrase:
        return jsonify({"error": "This challenge doesn't have a target phrase for pronunciation"}), 400

    difficulty = challenge.get("difficulty", 1)

    # Check if we should use mock or real evaluation
    use_mock = os.getenv("USE_MOCK_PRONUNCIATION", "false").lower() == "true"

    try:
        if use_mock:
            # Use mock evaluation for testing
            result = mock_evaluate_pronunciation(target_phrase, difficulty)
        else:
            # Use real Whisper API evaluation
            result = evaluate_pronunciation(audio_url, target_phrase, difficulty)

        # Store the attempt in Firestore
        add_attempt(uid, challenge_id, audio_url, result)

        return jsonify(result), 200

    except Exception as e:
        # Log the error and return a generic error response
        print(f"Error in score_daily: {e}")
        return jsonify({
            "error": "Failed to evaluate pronunciation",
            "details": str(e)
        }), 500

@app.post("/verifyWeekly")
@require_auth
def verify_weekly():
    uid = request.user["uid"]
    body = request.get_json(force=True)
    week = body.get("week")  # e.g., "2025-W44"
    badge = "Week Streak x3"  # mock
    set_weekly_verification(uid, week, badge)
    return jsonify({"verified": True, "badge": badge}), 200

@app.get("/userStats")
@require_auth
def user_stats():
    uid = request.user["uid"]
    return jsonify(get_user_stats(uid)), 200

@app.get("/leaderboard")
def leaderboard():
    """
    Get leaderboard data.
    Uses mock data by default (for demonstrations).
    Set USE_MOCK_LEADERBOARD=false in .env to use real data.
    """
    period = request.args.get("period", "weekly")
    use_mock = os.getenv("USE_MOCK_LEADERBOARD", "true").lower() == "true"

    return jsonify(get_leaderboard(period, use_mock=use_mock)), 200

# Challenge API Endpoints
@app.get("/challenges/daily")
def challenges_daily():
    """Get all daily challenges."""
    challenges = get_challenges_by_frequency("daily")
    return jsonify({"challenges": challenges}), 200

@app.get("/challenges/weekly")
def challenges_weekly():
    """Get all weekly challenges."""
    challenges = get_challenges_by_frequency("weekly")
    return jsonify({"challenges": challenges}), 200

@app.get("/challenges/monthly")
def challenges_monthly():
    """Get all monthly challenges."""
    challenges = get_challenges_by_frequency("monthly")
    return jsonify({"challenges": challenges}), 200

@app.get("/challenges/<challenge_id>")
def get_challenge(challenge_id):
    """Get a specific challenge by ID."""
    challenge = get_challenge_by_id(challenge_id)
    if challenge:
        return jsonify(challenge), 200
    return jsonify({"error": "Challenge not found"}), 404

@app.post("/challenges")
@require_auth
def create_challenge():
    """Create a new challenge (admin only for now)."""
    body = request.get_json(force=True)

    # Validate required fields
    required_fields = ["title", "difficulty", "frequency", "description"]
    for field in required_fields:
        if field not in body:
            return jsonify({"error": f"Missing required field: {field}"}), 400

    # Validate frequency
    if body["frequency"] not in ["daily", "weekly", "monthly"]:
        return jsonify({"error": "Frequency must be 'daily', 'weekly', or 'monthly'"}), 400

    # Add the challenge
    challenge_id = add_challenge(body)
    return jsonify({"id": challenge_id, "message": "Challenge created successfully"}), 201

# User Profile Management Endpoints
@app.post("/auth/register")
def auth_register():
    """Register a new user with email and password."""
    body = request.get_json(force=True)

    # Validate required fields
    email = body.get("email")
    password = body.get("password")
    display_name = body.get("display_name")

    if not email:
        return jsonify({"error": "email is required"}), 400
    if not password:
        return jsonify({"error": "password is required"}), 400

    # Validate password strength (minimum 6 characters)
    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters"}), 400

    try:
        result = register_user(email, password, display_name)
        return jsonify(result), 201
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.get("/user/profile")
@require_auth
def get_profile():
    """Get the authenticated user's profile."""
    uid = request.user["uid"]

    profile = get_user_profile(uid)
    if not profile:
        # Create profile if it doesn't exist (for existing users)
        from services_users import create_user_profile
        email = request.user.get("email", "")
        profile = create_user_profile(uid, email)

    return jsonify(profile), 200

@app.put("/user/profile")
@require_auth
def update_profile():
    """Update the authenticated user's profile."""
    uid = request.user["uid"]
    body = request.get_json(force=True)

    # Allowed fields to update
    allowed_fields = ["display_name", "photo_url", "bio", "preferences"]
    updates = {k: v for k, v in body.items() if k in allowed_fields}

    if not updates:
        return jsonify({"error": "No valid fields to update"}), 400

    try:
        updated_profile = update_user_profile(uid, updates)
        return jsonify(updated_profile), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.delete("/user/account")
@require_auth
def delete_account():
    """Delete the authenticated user's account."""
    uid = request.user["uid"]

    try:
        result = delete_user_account(uid)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)