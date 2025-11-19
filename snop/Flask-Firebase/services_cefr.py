# services_cefr.py
"""
CEFR (Common European Framework of Reference) progression service.
Handles user level progression, roadmap logic, and level unlocking.
"""
from firebase_config import db
from datetime import datetime, timezone

# CEFR Level definitions
CEFR_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"]

# Default progression requirements
DEFAULT_PROGRESSION = {
    "A1": {"name": "Beginner", "required_completions": 20, "unlocked_by_default": True},
    "A2": {"name": "Elementary", "required_completions": 20, "unlocked_by_default": False},
    "B1": {"name": "Intermediate", "required_completions": 25, "unlocked_by_default": False},
    "B2": {"name": "Upper Intermediate", "required_completions": 25, "unlocked_by_default": False},
    "C1": {"name": "Advanced", "required_completions": 30, "unlocked_by_default": False},
    "C2": {"name": "Mastery", "required_completions": 30, "unlocked_by_default": False}
}


def get_cefr_config():
    """
    Get CEFR roadmap configuration from Firestore.
    If not exists, initialize with defaults.

    Returns:
        dict - CEFR configuration with levels and daily_config
    """
    config_ref = db.collection("config").document("cefr_roadmap")

    # Always set unlimited limits
    default_config = {
        "levels": DEFAULT_PROGRESSION,
        "daily_config": {
            "irl_limit": -1,  # unlimited
            "listening_limit": -1,  # unlimited
            "fill_blank_limit": -1,  # unlimited
            "multiple_choice_limit": -1,  # unlimited
            "pronunciation_limit": -1  # unlimited
        }
    }

    # Force update to ensure unlimited limits are set
    config_ref.set(default_config, merge=True)

    return default_config


def initialize_user_cefr_progress(uid):
    """
    Initialize CEFR progression fields for a new user.

    Args:
        uid: str - Firebase user ID

    Returns:
        dict - Initialized CEFR progress structure
    """
    now = datetime.now(timezone.utc).isoformat()

    cefr_progress = {}
    for level in CEFR_LEVELS:
        config = DEFAULT_PROGRESSION.get(level, {})
        required = config.get("required_completions", 20)
        unlocked_by_default = config.get("unlocked_by_default", False)

        cefr_progress[level] = {
            "completed": 0,
            "required": required,
            "unlocked_at": now if unlocked_by_default else None
        }

    # Update user document
    user_ref = db.collection("users").document(uid)
    user_ref.set({
        "cefr_level": "A1",
        "cefr_progress": cefr_progress,
        "timezone": "UTC"
    }, merge=True)

    return cefr_progress


def get_user_cefr_progress(uid):
    """
    Get user's CEFR progression status.

    Args:
        uid: str - Firebase user ID

    Returns:
        dict - User's CEFR progress with current level and progress per level
    """
    user_ref = db.collection("users").document(uid)
    user_doc = user_ref.get()

    if not user_doc.exists:
        return None

    user_data = user_doc.to_dict()

    # Initialize CEFR fields if they don't exist
    if "cefr_level" not in user_data or "cefr_progress" not in user_data:
        initialize_user_cefr_progress(uid)
        user_doc = user_ref.get()
        user_data = user_doc.to_dict()

    return {
        "current_level": user_data.get("cefr_level", "A1"),
        "progress": user_data.get("cefr_progress", {})
    }


def increment_challenge_completion(uid, challenge_cefr_level):
    """
    Increment the completion count for a specific CEFR level.
    Check if user should level up.

    Args:
        uid: str - Firebase user ID
        challenge_cefr_level: str - CEFR level of completed challenge (e.g., "A1")

    Returns:
        dict - Updated progress with level_up flag if applicable
    """
    user_ref = db.collection("users").document(uid)
    user_doc = user_ref.get()

    if not user_doc.exists:
        return {"error": "User not found"}

    user_data = user_doc.to_dict()
    current_level = user_data.get("cefr_level", "A1")
    cefr_progress = user_data.get("cefr_progress", {})

    # Increment completed count for the challenge's level
    if challenge_cefr_level not in cefr_progress:
        cefr_progress[challenge_cefr_level] = {
            "completed": 0,
            "required": DEFAULT_PROGRESSION.get(challenge_cefr_level, {}).get("required_completions", 20),
            "unlocked_at": None
        }

    cefr_progress[challenge_cefr_level]["completed"] += 1

    # Check if user should level up
    level_up = False
    new_level = current_level

    if challenge_cefr_level == current_level:
        completed = cefr_progress[current_level]["completed"]
        required = cefr_progress[current_level]["required"]

        if completed >= required:
            # User completed enough challenges for current level, unlock next level
            current_index = CEFR_LEVELS.index(current_level)
            if current_index < len(CEFR_LEVELS) - 1:
                new_level = CEFR_LEVELS[current_index + 1]
                level_up = True

                # Unlock the next level
                now = datetime.now(timezone.utc).isoformat()
                cefr_progress[new_level]["unlocked_at"] = now

    # Update Firestore
    updates = {
        "cefr_progress": cefr_progress
    }

    if level_up:
        updates["cefr_level"] = new_level

    user_ref.set(updates, merge=True)

    return {
        "level_up": level_up,
        "new_level": new_level,
        "previous_level": current_level,
        "progress": cefr_progress
    }


def get_available_levels_for_user(uid):
    """
    Get list of CEFR levels available to the user (unlocked levels).

    Args:
        uid: str - Firebase user ID

    Returns:
        list - List of unlocked CEFR level strings (e.g., ["A1", "A2"])
    """
    progress_data = get_user_cefr_progress(uid)
    if not progress_data:
        return ["A1"]  # Default for new users

    progress = progress_data.get("progress", {})
    available_levels = []

    for level in CEFR_LEVELS:
        level_data = progress.get(level, {})
        if level_data.get("unlocked_at") is not None:
            available_levels.append(level)

    return available_levels if available_levels else ["A1"]


def get_roadmap_status(uid):
    """
    Get comprehensive roadmap status for user showing all levels and progress.

    Args:
        uid: str - Firebase user ID

    Returns:
        dict - Roadmap status with detailed progress per level
    """
    progress_data = get_user_cefr_progress(uid)
    if not progress_data:
        return None

    current_level = progress_data["current_level"]
    progress = progress_data["progress"]

    roadmap = {
        "current_level": current_level,
        "levels": {}
    }

    for level in CEFR_LEVELS:
        level_data = progress.get(level, {})
        completed = level_data.get("completed", 0)
        required = level_data.get("required", 20)
        unlocked_at = level_data.get("unlocked_at")

        roadmap["levels"][level] = {
            "name": DEFAULT_PROGRESSION.get(level, {}).get("name", level),
            "completed": completed,
            "required": required,
            "percentage": int((completed / required) * 100) if required > 0 else 0,
            "unlocked": unlocked_at is not None,
            "is_current": level == current_level
        }

        # Add unlock message for locked next level
        if not unlocked_at and level != "A1":
            current_index = CEFR_LEVELS.index(current_level)
            level_index = CEFR_LEVELS.index(level)

            if level_index == current_index + 1:
                remaining = required - progress.get(current_level, {}).get("completed", 0)
                if remaining > 0:
                    roadmap["levels"][level]["unlock_message"] = f"Complete {remaining} more {current_level} challenges to unlock {level}"

    return roadmap
