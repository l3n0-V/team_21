# services_firestore.py
from datetime import datetime, timezone, timedelta
from firebase_config import db
from firebase_admin import firestore

def now_iso():
    return datetime.now(timezone.utc).isoformat()

def get_period_start(period_type):
    """
    Get the start timestamp for a given period type.

    Args:
        period_type: str - "daily", "weekly", or "monthly"

    Returns:
        str - ISO timestamp of period start
    """
    now = datetime.now(timezone.utc)

    if period_type == "daily":
        # Start of current day (midnight UTC)
        start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    elif period_type == "weekly":
        # Start of current week (Monday midnight UTC)
        days_since_monday = now.weekday()
        start = (now - timedelta(days=days_since_monday)).replace(hour=0, minute=0, second=0, microsecond=0)
    elif period_type == "monthly":
        # Start of current month (first day midnight UTC)
        start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    else:
        raise ValueError(f"Invalid period type: {period_type}")

    return start.isoformat()

def needs_xp_reset(last_reset_str, period_type):
    """
    Check if XP for a period needs to be reset.

    Args:
        last_reset_str: str - ISO timestamp of last reset
        period_type: str - "daily", "weekly", or "monthly"

    Returns:
        bool - True if reset is needed
    """
    if not last_reset_str:
        return True

    last_reset = datetime.fromisoformat(last_reset_str.replace('Z', '+00:00'))
    period_start = datetime.fromisoformat(get_period_start(period_type).replace('Z', '+00:00'))

    return last_reset < period_start

def update_time_based_xp(uid, xp_gained):
    """
    Update time-based XP (daily, weekly, monthly) with automatic reset logic.

    Args:
        uid: str - Firebase user ID
        xp_gained: int - XP to add
    """
    user_ref = db.collection("users").document(uid)
    user_doc = user_ref.get()

    if not user_doc.exists:
        # Initialize new user with time-based XP
        user_ref.set({
            "xp_daily": xp_gained,
            "xp_weekly": xp_gained,
            "xp_monthly": xp_gained,
            "xp_daily_reset_at": get_period_start("daily"),
            "xp_weekly_reset_at": get_period_start("weekly"),
            "xp_monthly_reset_at": get_period_start("monthly")
        }, merge=True)
        return

    user_data = user_doc.to_dict()
    updates = {}

    # Check and update daily XP
    if needs_xp_reset(user_data.get("xp_daily_reset_at"), "daily"):
        updates["xp_daily"] = xp_gained
        updates["xp_daily_reset_at"] = get_period_start("daily")
    else:
        updates["xp_daily"] = firestore.Increment(xp_gained)

    # Check and update weekly XP
    if needs_xp_reset(user_data.get("xp_weekly_reset_at"), "weekly"):
        updates["xp_weekly"] = xp_gained
        updates["xp_weekly_reset_at"] = get_period_start("weekly")
    else:
        updates["xp_weekly"] = firestore.Increment(xp_gained)

    # Check and update monthly XP
    if needs_xp_reset(user_data.get("xp_monthly_reset_at"), "monthly"):
        updates["xp_monthly"] = xp_gained
        updates["xp_monthly_reset_at"] = get_period_start("monthly")
    else:
        updates["xp_monthly"] = firestore.Increment(xp_gained)

    user_ref.set(updates, merge=True)

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
    Add a pronunciation attempt and update user stats including streak and time-based XP.

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

    # Update time-based XP (daily, weekly, monthly) with automatic reset
    xp_gained = result.get("xp_gained", 0)
    update_time_based_xp(uid, xp_gained)

    # Update user stats (XP total, last attempt timestamp, and streak)
    db.collection("users").document(uid).set({
        "xp_total": firestore.Increment(xp_gained),
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
    Real leaderboard calculation from Firestore with time-based filtering.
    Queries users collection and returns top users by XP for the specified period.

    Args:
        period: str - "daily", "weekly", "monthly", or "all-time"
        limit: int - Number of top users to return (default 10)

    Returns:
        dict - {"period": str, "top": [{"uid", "name", "xp"}, ...]}
    """
    # Determine which XP field to query based on period
    if period == "daily":
        xp_field = "xp_daily"
    elif period == "weekly":
        xp_field = "xp_weekly"
    elif period == "monthly":
        xp_field = "xp_monthly"
    else:  # "all-time" or any other value
        xp_field = "xp_total"

    # Query users ordered by the appropriate XP field
    users_ref = db.collection("users")
    query = users_ref.order_by(xp_field, direction=firestore.Query.DESCENDING).limit(limit)

    top_users = []
    for doc in query.stream():
        user_data = doc.to_dict()
        top_users.append({
            "uid": doc.id,
            "name": user_data.get("display_name", "Anonymous"),
            "xp": int(user_data.get(xp_field, 0))
        })

    return {
        "period": period,
        "top": top_users
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
