# services_firestore.py
from datetime import datetime, timezone
from firebase_config import db
from firebase_admin import firestore

def now_iso():
    return datetime.now(timezone.utc).isoformat()

def update_streak(uid):
    """
    Update user's daily streak based on last activity.

    Logic:
    - First attempt ever: streak = 1
    - Already completed today: keep current streak
    - Consecutive day: increment streak
    - Missed day(s): reset to 1

    Args:
        uid: str - Firebase user ID

    Returns:
        int - New streak value
    """
    user_ref = db.collection("users").document(uid)
    user_doc = user_ref.get()

    if not user_doc.exists:
        # First time user - initialize with streak 1
        new_streak = 1
        user_ref.set({
            "current_streak": new_streak,
            "longest_streak": new_streak
        }, merge=True)
        return new_streak

    user_data = user_doc.to_dict()
    last_attempt = user_data.get("last_attempt_at")
    current_streak = user_data.get("current_streak", 0)
    longest_streak = user_data.get("longest_streak", 0)

    if not last_attempt:
        # First attempt for this user
        new_streak = 1
    else:
        # Parse the last attempt timestamp
        last_date = datetime.fromisoformat(last_attempt.replace('Z', '+00:00')).date()
        today = datetime.now(timezone.utc).date()

        if last_date == today:
            # Already completed today - maintain current streak
            return current_streak
        elif (today - last_date).days == 1:
            # Consecutive day - increment streak
            new_streak = current_streak + 1
        else:
            # Missed day(s) - reset streak
            new_streak = 1

    # Update Firestore with new streak values
    user_ref.set({
        "current_streak": new_streak,
        "longest_streak": max(new_streak, longest_streak)
    }, merge=True)

    return new_streak

def add_attempt(uid, challenge_id, audio_url, result):
    """
    Add a pronunciation attempt and update user stats including streak.

    Args:
        uid: str - Firebase user ID
        challenge_id: str - Challenge ID
        audio_url: str - URL to audio recording
        result: dict - Pronunciation evaluation result
    """
    # Add attempt to subcollection
    attempt = {
        "challenge_id": challenge_id,
        "audio_url": audio_url,
        "result": result,
        "created_at": now_iso(),
    }
    db.collection("users").document(uid).collection("attempts").add(attempt)

    # Update streak before updating other stats
    new_streak = update_streak(uid)

    # Update user stats (XP, last attempt timestamp, and streak)
    db.collection("users").document(uid).set({
        "xp_total": firestore.Increment(result.get("xp_gained", 0)),
        "last_attempt_at": now_iso(),
        "streak_days": new_streak  # Update with real streak value
    }, merge=True)

def get_user_stats(uid):
    """
    Get user statistics including XP and streak information.

    Args:
        uid: str - Firebase user ID

    Returns:
        dict - User statistics with xp_total, current_streak, longest_streak, last_attempt_at
    """
    snap = db.collection("users").document(uid).get()
    data = snap.to_dict() or {}
    return {
        "xp_total": int(data.get("xp_total", 0)),
        "current_streak": int(data.get("current_streak", 0)),
        "longest_streak": int(data.get("longest_streak", 0)),
        "streak_days": int(data.get("streak_days", 0)),  # Alias for current_streak (backward compatibility)
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
