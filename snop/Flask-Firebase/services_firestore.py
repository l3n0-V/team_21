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

def get_leaderboard_mock(period):
    """
    Mock leaderboard for demonstrations/testing.
    Returns hardcoded sample data.
    """
    return {
        "period": period,
        "top": [
            {"uid": "u1", "name": "Henrik", "xp": 320},
            {"uid": "u2", "name": "Eric", "xp": 300},
            {"uid": "u3", "name": "Sara", "xp": 270},
            {"uid": "u4", "name": "Anna", "xp": 250},
            {"uid": "u5", "name": "Lars", "xp": 220},
        ],
    }


def get_leaderboard_real(period, limit=10):
    """
    Real leaderboard calculation from Firestore.
    Queries users collection and returns top users by XP.

    Args:
        period: str - "daily", "weekly", "monthly", or "all-time"
        limit: int - Number of top users to return (default 10)

    Returns:
        dict - {"period": str, "top": [{"uid", "name", "xp"}, ...]}
    """
    from datetime import datetime, timedelta, timezone

    # For time-based filtering, we'd need to track XP gains with timestamps
    # For now, we'll implement all-time leaderboard
    # Future enhancement: Add xp_daily, xp_weekly, xp_monthly fields

    # Query users ordered by xp_total
    users_ref = db.collection("users")
    query = users_ref.order_by("xp_total", direction=firestore.Query.DESCENDING).limit(limit)

    top_users = []
    for doc in query.stream():
        user_data = doc.to_dict()
        top_users.append({
            "uid": doc.id,
            "name": user_data.get("display_name", "Anonymous"),
            "xp": int(user_data.get("xp_total", 0))
        })

    return {
        "period": period,
        "top": top_users,
        "note": "Currently showing all-time leaderboard. Time-based filtering coming soon."
    }


def get_leaderboard(period, use_mock=True):
    """
    Get leaderboard data (mock or real based on configuration).

    Args:
        period: str - "daily", "weekly", "monthly", or "all-time"
        use_mock: bool - If True, return mock data for demonstrations

    Returns:
        dict - {"period": str, "top": [{"uid", "name", "xp"}, ...]}
    """
    if use_mock:
        return get_leaderboard_mock(period)
    else:
        return get_leaderboard_real(period)
