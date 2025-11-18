from flask import Flask, redirect, render_template, request, make_response, session, abort, url_for
import secrets
from functools import wraps
import firebase_admin
from firebase_admin import credentials, firestore, auth
from datetime import timedelta
from datetime import datetime
import os
import logging
from dotenv import load_dotenv
from flask import jsonify
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from config import get_config

load_dotenv()

# Initialize Flask app with configuration
app = Flask(__name__)
app.config.from_object(get_config())

# Set up CORS
CORS(app, resources={r"/*": {"origins": app.config['CORS_ORIGINS'] or "*"}})

# Set up rate limiting
limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"],
    storage_uri="memory://",
    strategy="fixed-window"
)
logger_limiter = logging.getLogger('flask_limiter')
logger_limiter.setLevel(logging.WARNING)

# Set up logging
logging.basicConfig(
    level=getattr(logging, app.config['LOG_LEVEL']),
    format=app.config['LOG_FORMAT']
)
logger = logging.getLogger(__name__)

# Log startup configuration
logger.info(f"Starting SNOP Backend in {os.getenv('FLASK_ENV', 'development')} mode")
logger.info(f"Debug mode: {app.config['DEBUG']}")
logger.info(f"Mock pronunciation: {app.config['USE_MOCK_PRONUNCIATION']}")
logger.info(f"Mock leaderboard: {app.config['USE_MOCK_LEADERBOARD']}")

# Firebase Admin SDK setup
try:
    cred = credentials.Certificate(app.config['FIREBASE_CREDENTIALS_PATH'])
    firebase_admin.initialize_app(cred)
    db = firestore.client()
    logger.info("Firebase initialized successfully")
except Exception as e:
    logger.error(f"Failed to initialize Firebase: {e}")
    raise

########################################
""" Custom Error Classes """

class APIError(Exception):
    """Base exception for API errors."""
    status_code = 500

    def __init__(self, message, status_code=None, payload=None):
        super().__init__()
        self.message = message
        if status_code is not None:
            self.status_code = status_code
        self.payload = payload

    def to_dict(self):
        rv = dict(self.payload or ())
        rv['error'] = self.message
        return rv


class ValidationError(APIError):
    """Exception for validation errors."""
    status_code = 400


class NotFoundError(APIError):
    """Exception for resource not found errors."""
    status_code = 404


class AuthenticationError(APIError):
    """Exception for authentication errors."""
    status_code = 401


class PronunciationEvaluationError(APIError):
    """Exception for pronunciation evaluation errors."""
    status_code = 500

    def __init__(self, message, suggestion=None):
        super().__init__(message)
        self.suggestion = suggestion

    def to_dict(self):
        rv = super().to_dict()
        if self.suggestion:
            rv['suggestion'] = self.suggestion
        return rv


# Error handlers
@app.errorhandler(APIError)
def handle_api_error(error):
    """Handle custom API errors."""
    logger.warning(f"API Error: {error.message} (Status: {error.status_code})")
    response = jsonify(error.to_dict())
    response.status_code = error.status_code
    return response


@app.errorhandler(ValidationError)
def handle_validation_error(error):
    """Handle validation errors."""
    logger.warning(f"Validation Error: {error.message}")
    response = jsonify(error.to_dict())
    response.status_code = error.status_code
    return response


@app.errorhandler(404)
def handle_not_found(error):
    """Handle 404 errors."""
    logger.warning(f"404 Not Found: {request.url}")
    return jsonify({"error": "Resource not found"}), 404


@app.errorhandler(500)
def handle_internal_error(error):
    """Handle 500 errors."""
    logger.error(f"Internal Server Error: {error}", exc_info=True)
    return jsonify({"error": "Internal server error", "message": str(error)}), 500


@app.errorhandler(Exception)
def handle_unexpected_error(error):
    """Handle unexpected errors."""
    logger.error(f"Unexpected error: {error}", exc_info=True)
    return jsonify({"error": "An unexpected error occurred", "message": str(error)}), 500


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
    """Authenticate user with Firebase ID token and create session."""
    token = request.headers.get('Authorization')

    if not token or not token.startswith('Bearer '):
        logger.warning("Missing or invalid Authorization header")
        return jsonify({"error": "Missing or invalid Authorization header"}), 401

    token = token[7:]  # Strip off 'Bearer ' to get the actual token

    try:
        decoded_token = auth.verify_id_token(token, check_revoked=True, clock_skew_seconds=60)
        session['user'] = decoded_token

        logger.info(f"User authenticated: {decoded_token.get('uid')}")

        # If it's an AJAX request, return JSON
        if request.headers.get('Content-Type') == 'application/json':
            return jsonify({"success": True, "redirect": url_for('dashboard')}), 200

        # Otherwise redirect
        return redirect(url_for('dashboard'))

    except auth.InvalidIdTokenError as e:
        logger.error(f"Invalid ID token: {e}")
        return jsonify({"error": "Invalid or expired token"}), 401
    except auth.ExpiredIdTokenError as e:
        logger.error(f"Expired ID token: {e}")
        return jsonify({"error": "Token has expired"}), 401
    except auth.RevokedIdTokenError as e:
        logger.error(f"Revoked ID token: {e}")
        return jsonify({"error": "Token has been revoked"}), 401
    except auth.CertificateFetchError as e:
        logger.error(f"Certificate fetch error: {e}")
        return jsonify({"error": "Authentication service unavailable"}), 503
    except Exception as e:
        logger.error(f"Unexpected error during authentication: {e}", exc_info=True)
        return jsonify({"error": "Authentication failed", "details": str(e)}), 500


#####################
""" Public Routes """


@app.route('/')
def home():
    return render_template('home.html')

@app.route('/about')
def about():
    return render_template('about.html')

@app.route('/contact')
def contact():
    return render_template('contact.html')


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

@app.route('/profile')
@auth_required
def profile():
    return render_template('profile.html')


@app.route('/settings')
@auth_required
def settings():
    return render_template('settings.html')


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
from services_challenges import get_challenges_by_frequency, get_challenge_by_id, add_challenge, get_active_challenges, get_rotation_status
from services_pronunciation import evaluate_pronunciation, mock_evaluate_pronunciation
from services_users import register_user, get_user_profile, update_user_profile, delete_user_account
from services_badges import check_and_award_badges, get_user_badges, get_all_badges, BADGES

@app.post("/scoreDaily")
@limiter.limit("20 per hour")
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
        print(f"[PRONUNCIATION] Processing challenge {challenge_id} for user {uid}")
        print(f"[PRONUNCIATION] Audio URL: {audio_url[:100]}...")
        print(f"[PRONUNCIATION] Target phrase: {target_phrase}")
        print(f"[PRONUNCIATION] Using {'MOCK' if use_mock else 'REAL WHISPER'} evaluation")

        if use_mock:
            # Use mock evaluation for testing
            result = mock_evaluate_pronunciation(target_phrase, difficulty)
            print(f"[PRONUNCIATION] Mock result: {result}")
        else:
            # Use real Whisper evaluation
            print(f"[PRONUNCIATION] Starting Whisper transcription...")
            result = evaluate_pronunciation(audio_url, target_phrase, difficulty)
            print(f"[PRONUNCIATION] Whisper result: transcription='{result.get('transcription')}', similarity={result.get('similarity')}, pass={result.get('pass')}")

        # Store the attempt in Firestore
        print(f"[PRONUNCIATION] Storing attempt in Firestore...")
        add_attempt(uid, challenge_id, audio_url, result)
        print(f"[PRONUNCIATION] Attempt stored successfully")

        # Check and award badges
        new_badges = check_and_award_badges(uid, result)
        if new_badges:
            result["new_badges"] = [BADGES[badge_id] for badge_id in new_badges]
            print(f"[PRONUNCIATION] New badges awarded: {new_badges}")

        print(f"[PRONUNCIATION] ✓ Success! XP: {result.get('xp_gained')}, Pass: {result.get('pass')}")
        return jsonify(result), 200

    except Exception as e:
        # Detailed error logging
        import traceback
        error_details = traceback.format_exc()
        print(f"[PRONUNCIATION] ✗ ERROR in score_daily:")
        print(f"[PRONUNCIATION] Error type: {type(e).__name__}")
        print(f"[PRONUNCIATION] Error message: {str(e)}")
        print(f"[PRONUNCIATION] Full traceback:\n{error_details}")

        return jsonify({
            "error": "Failed to evaluate pronunciation",
            "details": str(e),
            "type": type(e).__name__
        }), 500

@app.post("/scoreWeekly")
@require_auth
def score_weekly():
    """Score a weekly pronunciation challenge with 1.5x XP multiplier."""
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

    # Check if it's a challenge with a target phrase
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

        # Apply 1.5x XP multiplier for weekly challenges
        result["xp_gained"] = int(result["xp_gained"] * 1.5)

        # Store the attempt in Firestore
        add_attempt(uid, challenge_id, audio_url, result)

        # Check and award badges
        new_badges = check_and_award_badges(uid, result)

        # Include new badges in response if any were earned
        if new_badges:
            result["new_badges"] = [BADGES[badge_id] for badge_id in new_badges]

        return jsonify(result), 200

    except Exception as e:
        # Log the error and return a generic error response
        print(f"Error in score_weekly: {e}")
        return jsonify({
            "error": "Failed to evaluate pronunciation",
            "details": str(e)
        }), 500

@app.post("/scoreMonthly")
@require_auth
def score_monthly():
    """Score a monthly pronunciation challenge with 2x XP multiplier."""
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

    # Check if it's a challenge with a target phrase
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

        # Apply 2x XP multiplier for monthly challenges
        result["xp_gained"] = int(result["xp_gained"] * 2.0)

        # Store the attempt in Firestore
        add_attempt(uid, challenge_id, audio_url, result)

        # Check and award badges
        new_badges = check_and_award_badges(uid, result)

        # Include new badges in response if any were earned
        if new_badges:
            result["new_badges"] = [BADGES[badge_id] for badge_id in new_badges]

        return jsonify(result), 200

    except Exception as e:
        # Log the error and return a generic error response
        print(f"Error in score_monthly: {e}")
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

# Challenge Rotation Endpoints
@app.get("/challenges/active/daily")
def active_challenges_daily():
    """Get currently active daily challenges (with automatic rotation)."""
    challenges = get_active_challenges("daily")
    return jsonify({"challenges": challenges, "frequency": "daily"}), 200

@app.get("/challenges/active/weekly")
def active_challenges_weekly():
    """Get currently active weekly challenges (with automatic rotation)."""
    challenges = get_active_challenges("weekly")
    return jsonify({"challenges": challenges, "frequency": "weekly"}), 200

@app.get("/challenges/active/monthly")
def active_challenges_monthly():
    """Get currently active monthly challenges (with automatic rotation)."""
    challenges = get_active_challenges("monthly")
    return jsonify({"challenges": challenges, "frequency": "monthly"}), 200

@app.get("/challenges/rotation/status")
def rotation_status():
    """Get the current challenge rotation status for all frequencies."""
    status = get_rotation_status()
    return jsonify(status), 200


# ============================================================================
# CEFR-Based Challenge System Endpoints (New)
# ============================================================================

@app.get("/api/challenges/today")
@require_auth
def get_todays_challenges():
    """
    Get today's available challenges for the authenticated user.
    Returns challenges based on user's CEFR level with completion status.
    """
    from services_challenges import get_todays_challenges_for_user

    uid = request.user["uid"]

    try:
        challenges_data = get_todays_challenges_for_user(uid)
        return jsonify(challenges_data), 200
    except Exception as e:
        logger.error(f"Error fetching today's challenges for user {uid}: {e}")
        return jsonify({"error": "Failed to fetch challenges"}), 500


@app.post("/api/challenges/submit")
@require_auth
def submit_challenge():
    """
    Submit a challenge answer for scoring.
    Handles listening, fill_blank, and multiple_choice challenges.
    """
    from services_challenges import submit_challenge_answer

    uid = request.user["uid"]
    body = request.get_json(force=True)

    challenge_id = body.get("challenge_id")
    user_answer = body.get("user_answer")

    if not challenge_id:
        return jsonify({"error": "challenge_id is required"}), 400
    if user_answer is None:
        return jsonify({"error": "user_answer is required"}), 400

    try:
        result = submit_challenge_answer(uid, challenge_id, user_answer)

        if not result.get("success"):
            return jsonify(result), 400

        return jsonify(result), 200
    except Exception as e:
        logger.error(f"Error submitting challenge {challenge_id} for user {uid}: {e}")
        return jsonify({"error": "Failed to submit challenge"}), 500


@app.post("/api/challenges/irl/verify")
@require_auth
def verify_irl():
    """
    Verify IRL challenge completion with photo upload.
    Supports multipart/form-data for file upload or JSON with base64 image.
    """
    from services_irl import verify_irl_challenge
    from services_daily_progress import can_complete_challenge, record_challenge_completion
    from services_challenges import get_challenge_by_id
    from services_cefr import increment_challenge_completion
    from services_firestore import update_time_based_xp
    from firebase_admin import firestore

    uid = request.user["uid"]

    # Check if it's multipart (file upload) or JSON (base64)
    if request.content_type and 'multipart/form-data' in request.content_type:
        challenge_id = request.form.get("challenge_id")
        photo_file = request.files.get("photo")
        gps_lat = request.form.get("gps_lat")
        gps_lng = request.form.get("gps_lng")
        text_description = request.form.get("text_description")

        if not challenge_id:
            return jsonify({"error": "challenge_id is required"}), 400
        if not photo_file:
            return jsonify({"error": "photo is required"}), 400

        # Convert GPS to float if provided
        if gps_lat:
            gps_lat = float(gps_lat)
        if gps_lng:
            gps_lng = float(gps_lng)

        try:
            # Check if user can complete IRL challenge today
            can_complete = can_complete_challenge(uid, "irl")
            if not can_complete["can_complete"]:
                return jsonify({"error": can_complete["reason"]}), 400

            # Verify challenge
            verification = verify_irl_challenge(
                uid=uid,
                challenge_id=challenge_id,
                photo_file=photo_file,
                gps_lat=gps_lat,
                gps_lng=gps_lng,
                text_description=text_description
            )

            if not verification.get("success"):
                return jsonify(verification), 400

            # Fetch challenge for XP and CEFR level
            challenge = get_challenge_by_id(challenge_id)
            xp_gained = challenge.get("xp_reward", 50)
            cefr_level = challenge.get("cefr_level", "A1")

            # Record completion
            record_challenge_completion(
                uid=uid,
                challenge_id=challenge_id,
                challenge_type="irl",
                challenge_cefr_level=cefr_level,
                xp_gained=xp_gained,
                additional_data=verification.get("verification_data")
            )

            # Update CEFR progression
            progression_result = increment_challenge_completion(uid, cefr_level)

            # Update user XP
            update_time_based_xp(uid, xp_gained)
            user_ref = db.collection("users").document(uid)
            user_ref.set({
                "xp_total": firestore.Increment(xp_gained),
                "last_attempt_at": datetime.now().isoformat()
            }, merge=True)

            # Build response
            from services_daily_progress import get_challenge_completion_status
            completion_status = get_challenge_completion_status(uid)
            irl_status = completion_status.get("irl", {})

            response = {
                "success": True,
                "verified": True,
                "xp_gained": xp_gained,
                "photo_url": verification.get("photo_url"),
                "gps_verified": verification.get("gps_verified"),
                "feedback": "Great job! You completed your IRL challenge.",
                "completion_status": {
                    "irl_completed_today": irl_status.get("completed", 1),
                    "irl_limit": irl_status.get("limit", 1),
                    "can_complete_more": irl_status.get("can_complete_more", False)
                }
            }

            if progression_result.get("level_up"):
                response["level_up"] = True
                response["new_level"] = progression_result.get("new_level")

            return jsonify(response), 200

        except Exception as e:
            logger.error(f"Error verifying IRL challenge for user {uid}: {e}")
            return jsonify({"error": "Failed to verify IRL challenge"}), 500

    else:
        # JSON request with base64 image
        body = request.get_json(force=True)
        challenge_id = body.get("challenge_id")
        photo_base64 = body.get("photo_base64")
        gps_lat = body.get("gps_lat")
        gps_lng = body.get("gps_lng")
        text_description = body.get("text_description")

        if not challenge_id:
            return jsonify({"error": "challenge_id is required"}), 400
        if not photo_base64:
            return jsonify({"error": "photo_base64 is required"}), 400

        try:
            # Similar verification logic as above
            can_complete = can_complete_challenge(uid, "irl")
            if not can_complete["can_complete"]:
                return jsonify({"error": can_complete["reason"]}), 400

            verification = verify_irl_challenge(
                uid=uid,
                challenge_id=challenge_id,
                photo_base64=photo_base64,
                gps_lat=gps_lat,
                gps_lng=gps_lng,
                text_description=text_description
            )

            if not verification.get("success"):
                return jsonify(verification), 400

            # Same completion logic as multipart version above
            challenge = get_challenge_by_id(challenge_id)
            xp_gained = challenge.get("xp_reward", 50)
            cefr_level = challenge.get("cefr_level", "A1")

            record_challenge_completion(
                uid=uid,
                challenge_id=challenge_id,
                challenge_type="irl",
                challenge_cefr_level=cefr_level,
                xp_gained=xp_gained,
                additional_data=verification.get("verification_data")
            )

            progression_result = increment_challenge_completion(uid, cefr_level)

            update_time_based_xp(uid, xp_gained)
            user_ref = db.collection("users").document(uid)
            user_ref.set({
                "xp_total": firestore.Increment(xp_gained),
                "last_attempt_at": datetime.now().isoformat()
            }, merge=True)

            from services_daily_progress import get_challenge_completion_status
            completion_status = get_challenge_completion_status(uid)
            irl_status = completion_status.get("irl", {})

            response = {
                "success": True,
                "verified": True,
                "xp_gained": xp_gained,
                "photo_url": verification.get("photo_url"),
                "gps_verified": verification.get("gps_verified"),
                "feedback": "Great job! You completed your IRL challenge.",
                "completion_status": {
                    "irl_completed_today": irl_status.get("completed", 1),
                    "irl_limit": irl_status.get("limit", 1),
                    "can_complete_more": irl_status.get("can_complete_more", False)
                }
            }

            if progression_result.get("level_up"):
                response["level_up"] = True
                response["new_level"] = progression_result.get("new_level")

            return jsonify(response), 200

        except Exception as e:
            logger.error(f"Error verifying IRL challenge for user {uid}: {e}")
            return jsonify({"error": "Failed to verify IRL challenge"}), 500


@app.get("/api/user/progress")
@require_auth
def get_user_progress():
    """
    Get user's CEFR progression and roadmap status.
    """
    from services_cefr import get_roadmap_status
    from services_daily_progress import get_user_recent_completions

    uid = request.user["uid"]

    try:
        roadmap = get_roadmap_status(uid)
        recent_completions = get_user_recent_completions(uid, limit=10)

        response = {
            "current_level": roadmap.get("current_level"),
            "progress": roadmap.get("levels"),
            "recent_completions": recent_completions
        }

        return jsonify(response), 200
    except Exception as e:
        logger.error(f"Error fetching progress for user {uid}: {e}")
        return jsonify({"error": "Failed to fetch user progress"}), 500


# User Profile Management Endpoints
@app.post("/auth/register")
@limiter.limit("5 per hour")
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

# Badge Endpoints
@app.get("/user/badges")
@require_auth
def get_badges():
    """Get user's earned and available badges."""
    uid = request.user["uid"]
    return jsonify(get_user_badges(uid)), 200

@app.get("/badges")
def get_all_badge_definitions():
    """Get all badge definitions."""
    return jsonify(get_all_badges()), 200


########################################
""" AI Challenge Generation Endpoints """

from services_ai_generation import (
    generate_and_save_challenges,
    generate_pronunciation_challenge,
    generate_listening_challenge
)


@app.post("/admin/generate-challenges")
@require_auth
def admin_generate_challenges():
    """
    Generate challenges using AI (Ollama).
    Requires authentication.

    Body:
        {
            "frequency": "daily|weekly|monthly",
            "count": 5,
            "difficulty_mix": {"1": 3, "2": 1, "3": 1},  // optional
            "topic_mix": ["cafe", "restaurant"],          // optional
            "save_to_db": true                            // optional, default true
        }

    Returns:
        {
            "challenges": [...],
            "saved_ids": [...],
            "success_count": 5,
            "failure_count": 0
        }
    """
    try:
        data = request.get_json()

        # Validate required fields
        if not data or 'frequency' not in data:
            raise ValidationError("Missing required field: frequency")

        frequency = data['frequency']
        if frequency not in ['daily', 'weekly', 'monthly']:
            raise ValidationError("frequency must be 'daily', 'weekly', or 'monthly'")

        count = data.get('count', 5)
        if not isinstance(count, int) or count < 1 or count > 20:
            raise ValidationError("count must be an integer between 1 and 20")

        # Parse difficulty_mix (convert string keys to int)
        difficulty_mix = data.get('difficulty_mix')
        if difficulty_mix:
            difficulty_mix = {int(k): v for k, v in difficulty_mix.items()}

        topic_mix = data.get('topic_mix')
        save_to_db = data.get('save_to_db', True)

        logger.info(f"Generating {count} {frequency} challenges...")

        # Generate challenges
        result = generate_and_save_challenges(
            frequency=frequency,
            count=count,
            difficulty_mix=difficulty_mix,
            topic_mix=topic_mix,
            save_to_db=save_to_db
        )

        logger.info(f"Generated {result['success_count']} challenges, saved {len(result['saved_ids'])}")

        return jsonify(result), 200

    except ValidationError as e:
        logger.warning(f"Validation error: {e.message}")
        return jsonify({"error": e.message}), e.status_code
    except Exception as e:
        logger.error(f"Error generating challenges: {e}")
        return jsonify({"error": str(e)}), 500


@app.post("/admin/generate-single")
@require_auth
def admin_generate_single_challenge():
    """
    Generate a single challenge for testing/preview.

    Body:
        {
            "type": "pronunciation|listening",
            "difficulty": 1-3,
            "topic": "cafe",                    // optional
            "frequency": "daily|weekly|monthly",
            "save_to_db": false                 // optional, default false
        }

    Returns:
        Generated challenge object
    """
    try:
        data = request.get_json()

        if not data:
            raise ValidationError("Request body is required")

        challenge_type = data.get('type', 'pronunciation')
        if challenge_type not in ['pronunciation', 'listening']:
            raise ValidationError("type must be 'pronunciation' or 'listening'")

        difficulty = data.get('difficulty', 1)
        if difficulty not in [1, 2, 3]:
            raise ValidationError("difficulty must be 1, 2, or 3")

        topic = data.get('topic')
        frequency = data.get('frequency', 'daily')
        save_to_db = data.get('save_to_db', False)

        logger.info(f"Generating single {challenge_type} challenge (difficulty {difficulty})...")

        # Generate challenge
        if challenge_type == 'pronunciation':
            challenge = generate_pronunciation_challenge(difficulty, topic, frequency)
        else:
            challenge = generate_listening_challenge(difficulty, topic, frequency)

        # Optionally save to database
        saved_id = None
        if save_to_db:
            from services_challenges import add_challenge
            saved_id = add_challenge(challenge)
            logger.info(f"Saved challenge to Firestore with ID: {saved_id}")

        result = {
            "challenge": challenge,
            "saved": save_to_db,
            "saved_id": saved_id
        }

        return jsonify(result), 200

    except ValidationError as e:
        logger.warning(f"Validation error: {e.message}")
        return jsonify({"error": e.message}), e.status_code
    except Exception as e:
        logger.error(f"Error generating single challenge: {e}")
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True)