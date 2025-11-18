# services_daily_progress.py
"""
Daily challenge progress tracking service.
Tracks which challenges users complete each day and enforces daily limits.
"""
from firebase_config import db
from datetime import datetime, timezone
from services_cefr import get_cefr_config


def get_current_utc_date():
    """
    Get current UTC date as string (YYYY-MM-DD format).

    Returns:
        str - Current UTC date
    """
    return datetime.now(timezone.utc).strftime("%Y-%m-%d")


def get_daily_progress(uid, date=None):
    """
    Get user's daily progress for a specific date.

    Args:
        uid: str - Firebase user ID
        date: str - UTC date (YYYY-MM-DD). If None, uses today.

    Returns:
        dict - Daily progress data or empty structure if not exists
    """
    if date is None:
        date = get_current_utc_date()

    progress_ref = db.collection("users").document(uid).collection("daily_progress").document(date)
    progress_doc = progress_ref.get()

    if not progress_doc.exists:
        return {
            "date": date,
            "irl_completed": None,
            "listening_completed": [],
            "fill_blank_completed": [],
            "multiple_choice_completed": [],
            "pronunciation_completed": [],
            "total_xp_today": 0
        }

    return progress_doc.to_dict()


def get_completion_count(uid, challenge_type, date=None):
    """
    Get count of completed challenges for a specific type today.

    Args:
        uid: str - Firebase user ID
        challenge_type: str - "irl", "listening", "fill_blank", "multiple_choice", "pronunciation"
        date: str - UTC date. If None, uses today.

    Returns:
        int - Number of challenges completed
    """
    progress = get_daily_progress(uid, date)

    if challenge_type == "irl":
        return 1 if progress.get("irl_completed") is not None else 0
    else:
        completed_list = progress.get(f"{challenge_type}_completed", [])
        return len(completed_list)


def can_complete_challenge(uid, challenge_type, date=None):
    """
    Check if user can complete another challenge of this type today.

    Args:
        uid: str - Firebase user ID
        challenge_type: str - Challenge type
        date: str - UTC date. If None, uses today.

    Returns:
        dict - {"can_complete": bool, "completed": int, "limit": int, "reason": str}
    """
    config = get_cefr_config()
    daily_limits = config.get("daily_config", {})

    # Get limit for this challenge type
    limit_key = f"{challenge_type}_limit"
    limit = daily_limits.get(limit_key, -1)  # -1 means unlimited

    # Unlimited challenges
    if limit == -1:
        return {
            "can_complete": True,
            "completed": 0,
            "limit": -1,
            "reason": "Unlimited"
        }

    # Check current completion count
    completed = get_completion_count(uid, challenge_type, date)

    can_complete = completed < limit

    return {
        "can_complete": can_complete,
        "completed": completed,
        "limit": limit,
        "reason": f"Completed {completed}/{limit}" if can_complete else f"Daily limit reached ({limit})"
    }


def record_challenge_completion(uid, challenge_id, challenge_type, challenge_cefr_level, xp_gained, additional_data=None):
    """
    Record a challenge completion in daily progress.

    Args:
        uid: str - Firebase user ID
        challenge_id: str - Challenge ID
        challenge_type: str - Challenge type
        challenge_cefr_level: str - CEFR level of the challenge
        xp_gained: int - XP earned
        additional_data: dict - Additional data (e.g., photo_url for IRL, correct answer, etc.)

    Returns:
        dict - Updated daily progress
    """
    date = get_current_utc_date()
    progress_ref = db.collection("users").document(uid).collection("daily_progress").document(date)
    progress = get_daily_progress(uid, date)

    now = datetime.now(timezone.utc).isoformat()

    # Build completion record
    completion_record = {
        "challenge_id": challenge_id,
        "completed_at": now,
        "xp_gained": xp_gained,
        "cefr_level": challenge_cefr_level
    }

    # Add additional data if provided
    if additional_data:
        completion_record.update(additional_data)

    # Update appropriate field based on challenge type
    if challenge_type == "irl":
        progress["irl_completed"] = completion_record
    else:
        # Append to the list for this challenge type
        completed_list = progress.get(f"{challenge_type}_completed", [])
        completed_list.append(completion_record)
        progress[f"{challenge_type}_completed"] = completed_list

    # Update total XP for today
    progress["total_xp_today"] = progress.get("total_xp_today", 0) + xp_gained
    progress["date"] = date

    # Save to Firestore
    progress_ref.set(progress)

    return progress


def get_challenge_completion_status(uid, date=None):
    """
    Get comprehensive completion status for all challenge types.

    Args:
        uid: str - Firebase user ID
        date: str - UTC date. If None, uses today.

    Returns:
        dict - Completion status for each challenge type
    """
    config = get_cefr_config()
    daily_limits = config.get("daily_config", {})

    challenge_types = ["irl", "listening", "fill_blank", "multiple_choice", "pronunciation"]
    status = {}

    for challenge_type in challenge_types:
        limit_key = f"{challenge_type}_limit"
        limit = daily_limits.get(limit_key, -1)
        completed = get_completion_count(uid, challenge_type, date)

        can_complete = (limit == -1) or (completed < limit)

        status[challenge_type] = {
            "completed": completed,
            "limit": limit,
            "can_complete_more": can_complete,
            "remaining": (limit - completed) if limit != -1 else "unlimited"
        }

    return status


def get_user_recent_completions(uid, limit=10):
    """
    Get user's recent challenge completions across all days.

    Args:
        uid: str - Firebase user ID
        limit: int - Maximum number of completions to return

    Returns:
        list - Recent completions sorted by date (newest first)
    """
    progress_ref = db.collection("users").document(uid).collection("daily_progress")

    # Get all daily progress documents, ordered by date descending
    docs = progress_ref.order_by("date", direction=db.collection.DESCENDING).limit(7).stream()

    all_completions = []

    for doc in docs:
        progress = doc.to_dict()
        date = progress.get("date")

        # Add IRL completion if exists
        irl = progress.get("irl_completed")
        if irl:
            all_completions.append({
                "type": "irl",
                "date": date,
                "challenge_id": irl.get("challenge_id"),
                "completed_at": irl.get("completed_at"),
                "xp_gained": irl.get("xp_gained"),
                "cefr_level": irl.get("cefr_level")
            })

        # Add other challenge types
        for challenge_type in ["listening", "fill_blank", "multiple_choice", "pronunciation"]:
            completed_list = progress.get(f"{challenge_type}_completed", [])
            for completion in completed_list:
                all_completions.append({
                    "type": challenge_type,
                    "date": date,
                    "challenge_id": completion.get("challenge_id"),
                    "completed_at": completion.get("completed_at"),
                    "xp_gained": completion.get("xp_gained"),
                    "cefr_level": completion.get("cefr_level")
                })

    # Sort by completed_at timestamp (newest first)
    all_completions.sort(key=lambda x: x.get("completed_at", ""), reverse=True)

    return all_completions[:limit]


def clear_user_daily_progress(uid):
    """
    Clear all daily progress for a user (used during migration).

    Args:
        uid: str - Firebase user ID

    Returns:
        int - Number of documents deleted
    """
    progress_ref = db.collection("users").document(uid).collection("daily_progress")
    docs = progress_ref.stream()

    count = 0
    batch = db.batch()

    for doc in docs:
        batch.delete(doc.reference)
        count += 1

    if count > 0:
        batch.commit()

    return count
