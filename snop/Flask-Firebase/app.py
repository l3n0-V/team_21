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

@app.post("/scoreDaily")
@require_auth
def score_daily():
    uid = request.user["uid"]
    body = request.get_json(force=True)
    # MOCK result for now (Whisper later)
    result = {"xp_gained": 10, "feedback": "Great pronunciation!", "pass": True}
    add_attempt(uid, body.get("challenge_id"), body.get("audio_url"), result)
    return jsonify(result), 200

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
    period = request.args.get("period", "weekly")
    return jsonify(get_leaderboard(period)), 200

if __name__ == '__main__':
    app.run(debug=True)