# services_firestore.py
from datetime import datetime, timezone
from firebase_config import db
from firebase_admin import firestore

def now_iso():
    return datetime.now(timezone.utc).isoformat()

def add_attempt(uid, challenge_id, audio_url, result):
    attempt = {
        "challenge_id": challenge_id,
        "audio_url": audio_url,
        "result": result,
        "created_at": now_iso(),
    }
    db.collection("users").document(uid).collection("attempts").add(attempt)
    db.collection("users").document(uid).set({
        "xp_total": firestore.Increment(result.get("xp_gained", 0)),
        "last_attempt_at": now_iso(),
    }, merge=True)

def get_user_stats(uid):
    snap = db.collection("users").document(uid).get()
    data = snap.to_dict() or {}
    return {
        "xp_total": int(data.get("xp_total", 0)),
        "streak_days": int(data.get("streak_days", 0)),  # mock for now
        "last_attempt_at": data.get("last_attempt_at"),
    }

def set_weekly_verification(uid, week, badge):
    db.collection("users").document(uid)\
      .collection("weekly_verifications").document(week)\
      .set({"verified": True, "badge": badge, "verified_at": now_iso()}, merge=True)

def get_leaderboard(period):
    doc = db.collection("leaderboards").document(period).get()
    if doc.exists:
        data = doc.to_dict() or {}
        return {"period": period, "top": data.get("top", [])}
    # mock fallback
    return {
        "period": period,
        "top": [
            {"uid": "u1", "name": "Henrik", "xp": 320},
            {"uid": "u2", "name": "Eric", "xp": 300},
            {"uid": "u3", "name": "Sara", "xp": 270},
        ],
    }
