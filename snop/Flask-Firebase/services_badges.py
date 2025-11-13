# services_badges.py
"""
Badge and achievement system for gamification.
Handles badge definitions, unlock conditions, and awarding logic.
"""
from firebase_config import db
from firebase_admin import firestore
from datetime import datetime, timezone

# Badge Definitions
BADGES = {
    "first_challenge": {
        "id": "first_challenge",
        "name": "First Steps",
        "description": "Completed your first pronunciation challenge",
        "icon": "🎯",
        "xp_bonus": 5,
        "condition_type": "attempt_count",
        "condition_value": 1
    },
    "streak_3": {
        "id": "streak_3",
        "name": "3-Day Streak",
        "description": "Maintained a 3-day learning streak",
        "icon": "🔥",
        "xp_bonus": 10,
        "condition_type": "streak",
        "condition_value": 3
    },
    "streak_7": {
        "id": "streak_7",
        "name": "Week Warrior",
        "description": "Maintained a 7-day learning streak",
        "icon": "⚡",
        "xp_bonus": 25,
        "condition_type": "streak",
        "condition_value": 7
    },
    "streak_30": {
        "id": "streak_30",
        "name": "Month Master",
        "description": "Maintained a 30-day learning streak",
        "icon": "👑",
        "xp_bonus": 100,
        "condition_type": "streak",
        "condition_value": 30
    },
    "perfect_pronunciation": {
        "id": "perfect_pronunciation",
        "name": "Perfect Accent",
        "description": "Achieved 95%+ pronunciation accuracy",
        "icon": "🌟",
        "xp_bonus": 15,
        "condition_type": "accuracy",
        "condition_value": 0.95
    },
    "xp_100": {
        "id": "xp_100",
        "name": "Rising Star",
        "description": "Earned 100 total XP",
        "icon": "⭐",
        "xp_bonus": 20,
        "condition_type": "xp_total",
        "condition_value": 100
    },
    "xp_500": {
        "id": "xp_500",
        "name": "Language Enthusiast",
        "description": "Earned 500 total XP",
        "icon": "💫",
        "xp_bonus": 50,
        "condition_type": "xp_total",
        "condition_value": 500
    },
    "xp_1000": {
        "id": "xp_1000",
        "name": "Pronunciation Pro",
        "description": "Earned 1000 total XP",
        "icon": "🏆",
        "xp_bonus": 100,
        "condition_type": "xp_total",
        "condition_value": 1000
    },
    "challenge_master": {
        "id": "challenge_master",
        "name": "Challenge Master",
        "description": "Completed 50 pronunciation challenges",
        "icon": "🎓",
        "xp_bonus": 75,
        "condition_type": "attempt_count",
        "condition_value": 50
    },
    "perfectionist": {
        "id": "perfectionist",
        "name": "Perfectionist",
        "description": "Achieved 100% accuracy on 5 challenges",
        "icon": "💎",
        "xp_bonus": 50,
        "condition_type": "perfect_count",
        "condition_value": 5
    }
}


def get_user_attempt_count(uid):
    """
    Get the total number of attempts for a user.

    Args:
        uid: str - Firebase user ID

    Returns:
        int - Total number of attempts
    """
    attempts = db.collection("users").document(uid).collection("attempts").stream()
    return sum(1 for _ in attempts)


def get_perfect_attempt_count(uid):
    """
    Get the number of perfect (100% accuracy) attempts for a user.

    Args:
        uid: str - Firebase user ID

    Returns:
        int - Number of perfect attempts
    """
    attempts = db.collection("users").document(uid).collection("attempts").stream()
    perfect_count = 0
    for attempt in attempts:
        attempt_data = attempt.to_dict()
        result = attempt_data.get("result", {})
        similarity = result.get("similarity", 0)
        if similarity >= 1.0:
            perfect_count += 1
    return perfect_count


def check_badge_condition(badge_id, user_stats, recent_result=None):
    """
    Check if a badge's unlock condition is met.

    Args:
        badge_id: str - Badge ID to check
        user_stats: dict - User statistics
        recent_result: dict - Recent pronunciation result (optional)

    Returns:
        bool - True if condition is met
    """
    if badge_id not in BADGES:
        return False

    badge = BADGES[badge_id]
    condition_type = badge["condition_type"]
    condition_value = badge["condition_value"]

    if condition_type == "streak":
        current_streak = user_stats.get("current_streak", 0)
        return current_streak >= condition_value

    elif condition_type == "xp_total":
        xp_total = user_stats.get("xp_total", 0)
        return xp_total >= condition_value

    elif condition_type == "attempt_count":
        attempt_count = user_stats.get("attempt_count", 0)
        return attempt_count >= condition_value

    elif condition_type == "accuracy":
        # Check recent result for accuracy-based badges
        if recent_result:
            similarity = recent_result.get("similarity", 0)
            return similarity >= condition_value
        return False

    elif condition_type == "perfect_count":
        perfect_count = user_stats.get("perfect_count", 0)
        return perfect_count >= condition_value

    return False


def check_and_award_badges(uid, recent_result=None):
    """
    Check user stats and award any newly-earned badges.

    Args:
        uid: str - Firebase user ID
        recent_result: dict - Recent pronunciation result (optional)

    Returns:
        list - List of newly awarded badge IDs
    """
    # Get user profile to see which badges they already have
    user_ref = db.collection("users").document(uid)
    user_doc = user_ref.get()

    if not user_doc.exists:
        return []

    user_data = user_doc.to_dict()
    earned_badges = user_data.get("badges", [])

    # Get user stats
    user_stats = {
        "xp_total": user_data.get("xp_total", 0),
        "current_streak": user_data.get("current_streak", 0),
        "longest_streak": user_data.get("longest_streak", 0),
        "attempt_count": get_user_attempt_count(uid),
        "perfect_count": get_perfect_attempt_count(uid)
    }

    new_badges = []
    total_xp_bonus = 0

    # Check each badge
    for badge_id, badge in BADGES.items():
        # Skip if already earned
        if badge_id in earned_badges:
            continue

        # Check if condition is met
        if check_badge_condition(badge_id, user_stats, recent_result):
            new_badges.append(badge_id)
            total_xp_bonus += badge.get("xp_bonus", 0)

    # Award new badges
    if new_badges:
        # Create badge earned timestamps
        badge_timestamps = user_data.get("badge_earned_at", {})
        now = datetime.now(timezone.utc).isoformat()

        for badge_id in new_badges:
            badge_timestamps[badge_id] = now

        # Update user profile with new badges and XP bonus
        user_ref.set({
            "badges": firestore.ArrayUnion(new_badges),
            "badge_earned_at": badge_timestamps,
            "xp_total": firestore.Increment(total_xp_bonus)
        }, merge=True)

    return new_badges


def get_user_badges(uid):
    """
    Get all badges earned by a user with full details.

    Args:
        uid: str - Firebase user ID

    Returns:
        dict - Badge information with earned and available badges
    """
    user_ref = db.collection("users").document(uid)
    user_doc = user_ref.get()

    if not user_doc.exists:
        return {
            "earned": [],
            "available": list(BADGES.values()),
            "total_badges": len(BADGES),
            "earned_count": 0
        }

    user_data = user_doc.to_dict()
    earned_badge_ids = user_data.get("badges", [])
    badge_timestamps = user_data.get("badge_earned_at", {})

    # Build earned badges list with timestamps
    earned = []
    for badge_id in earned_badge_ids:
        if badge_id in BADGES:
            badge_info = BADGES[badge_id].copy()
            badge_info["earned_at"] = badge_timestamps.get(badge_id)
            earned.append(badge_info)

    # Build available (not yet earned) badges list
    available = []
    for badge_id, badge in BADGES.items():
        if badge_id not in earned_badge_ids:
            available.append(badge)

    return {
        "earned": earned,
        "available": available,
        "total_badges": len(BADGES),
        "earned_count": len(earned)
    }


def get_all_badges():
    """
    Get all badge definitions.

    Returns:
        dict - All badge definitions
    """
    return BADGES
