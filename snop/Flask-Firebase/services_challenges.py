# services_challenges.py
"""
Challenge management service for Firestore.
Handles challenge retrieval, creation, and rotation logic.
"""
from firebase_config import db
from datetime import datetime, timezone, timedelta
import random

def get_challenges_by_frequency(frequency):
    """
    Fetch all challenges with the specified frequency (daily, weekly, monthly).

    Args:
        frequency: str - "daily", "weekly", or "monthly"

    Returns:
        list of challenge dicts
    """
    challenges_ref = db.collection("challenges")
    query = challenges_ref.where("frequency", "==", frequency)
    docs = query.stream()

    challenges = []
    for doc in docs:
        challenge = doc.to_dict()
        challenge["id"] = doc.id  # Include document ID
        challenges.append(challenge)

    return challenges


def get_challenge_by_id(challenge_id):
    """
    Fetch a specific challenge by ID.

    Args:
        challenge_id: str - Document ID of the challenge

    Returns:
        dict - Challenge data or None if not found
    """
    doc = db.collection("challenges").document(challenge_id).get()
    if doc.exists:
        challenge = doc.to_dict()
        challenge["id"] = doc.id
        return challenge
    return None


def add_challenge(challenge_data):
    """
    Add a new challenge to Firestore.

    Args:
        challenge_data: dict - Challenge data with fields:
            - title: str
            - prompt: str (optional for weekly/monthly)
            - target: str (optional for weekly/monthly)
            - difficulty: int (1-3)
            - frequency: str ("daily", "weekly", "monthly")
            - description: str

    Returns:
        str - Document ID of the created challenge
    """
    challenge_data["created_at"] = datetime.now(timezone.utc).isoformat()
    doc_ref = db.collection("challenges").add(challenge_data)
    return doc_ref[1].id  # Return the document ID


def get_all_challenges():
    """
    Fetch all challenges from Firestore.

    Returns:
        dict with keys: daily, weekly, monthly (each containing a list of challenges)
    """
    all_challenges = {
        "daily": get_challenges_by_frequency("daily"),
        "weekly": get_challenges_by_frequency("weekly"),
        "monthly": get_challenges_by_frequency("monthly")
    }
    return all_challenges


# Challenge Rotation Functions

def get_rotation_config():
    """
    Get or initialize the challenge rotation configuration.

    Returns:
        dict - Rotation configuration
    """
    config_ref = db.collection("config").document("challenge_rotation")
    config_doc = config_ref.get()

    if not config_doc.exists:
        # Initialize rotation config
        initial_config = {
            "active_daily": [],
            "active_weekly": [],
            "active_monthly": [],
            "last_daily_rotation": None,
            "last_weekly_rotation": None,
            "last_monthly_rotation": None
        }
        config_ref.set(initial_config)
        return initial_config

    return config_doc.to_dict()


def get_rotation_period_start(frequency):
    """
    Get the start timestamp for the current rotation period.

    Args:
        frequency: str - "daily", "weekly", or "monthly"

    Returns:
        str - ISO timestamp
    """
    now = datetime.now(timezone.utc)

    if frequency == "daily":
        start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    elif frequency == "weekly":
        days_since_monday = now.weekday()
        start = (now - timedelta(days=days_since_monday)).replace(hour=0, minute=0, second=0, microsecond=0)
    elif frequency == "monthly":
        start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    else:
        raise ValueError(f"Invalid frequency: {frequency}")

    return start.isoformat()


def needs_rotation(last_rotation_str, frequency):
    """
    Check if challenges need to be rotated.

    Args:
        last_rotation_str: str - ISO timestamp of last rotation
        frequency: str - "daily", "weekly", or "monthly"

    Returns:
        bool - True if rotation is needed
    """
    if not last_rotation_str:
        return True

    last_rotation = datetime.fromisoformat(last_rotation_str.replace('Z', '+00:00'))
    period_start = datetime.fromisoformat(get_rotation_period_start(frequency).replace('Z', '+00:00'))

    return last_rotation < period_start


def rotate_challenges(frequency, num_active=3):
    """
    Rotate challenges by randomly selecting active ones.

    Args:
        frequency: str - "daily", "weekly", or "monthly"
        num_active: int - Number of challenges to make active (default 3)

    Returns:
        list - List of active challenge IDs
    """
    # Get all challenges of this frequency
    all_challenges = get_challenges_by_frequency(frequency)

    if not all_challenges:
        return []

    # Randomly select num_active challenges
    num_to_select = min(num_active, len(all_challenges))
    selected = random.sample(all_challenges, num_to_select)

    # Extract challenge IDs
    active_ids = [c["id"] for c in selected]

    # Update config in Firestore
    config_ref = db.collection("config").document("challenge_rotation")
    update_data = {
        f"active_{frequency}": active_ids,
        f"last_{frequency}_rotation": datetime.now(timezone.utc).isoformat()
    }
    config_ref.set(update_data, merge=True)

    return active_ids


def get_active_challenges(frequency):
    """
    Get currently active challenges for a frequency with automatic rotation.

    Args:
        frequency: str - "daily", "weekly", or "monthly"

    Returns:
        list - List of active challenge dicts
    """
    config = get_rotation_config()
    last_rotation_key = f"last_{frequency}_rotation"
    active_key = f"active_{frequency}"

    # Check if rotation is needed
    if needs_rotation(config.get(last_rotation_key), frequency):
        # Rotate challenges
        active_ids = rotate_challenges(frequency)
    else:
        # Use existing active challenges
        active_ids = config.get(active_key, [])

    # If no active challenges, rotate now
    if not active_ids:
        active_ids = rotate_challenges(frequency)

    # Fetch full challenge data
    active_challenges = []
    for challenge_id in active_ids:
        challenge = get_challenge_by_id(challenge_id)
        if challenge:
            active_challenges.append(challenge)

    return active_challenges


def get_rotation_status():
    """
    Get the current rotation status for all frequencies.

    Returns:
        dict - Status for daily, weekly, and monthly rotations
    """
    config = get_rotation_config()

    status = {}
    for frequency in ["daily", "weekly", "monthly"]:
        last_rotation = config.get(f"last_{frequency}_rotation")
        active_challenges = config.get(f"active_{frequency}", [])

        # Calculate next rotation time
        if last_rotation:
            last_dt = datetime.fromisoformat(last_rotation.replace('Z', '+00:00'))
            if frequency == "daily":
                next_rotation = (last_dt + timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0)
            elif frequency == "weekly":
                # Next Monday
                days_until_monday = (7 - last_dt.weekday()) % 7
                if days_until_monday == 0:
                    days_until_monday = 7
                next_rotation = (last_dt + timedelta(days=days_until_monday)).replace(hour=0, minute=0, second=0, microsecond=0)
            else:  # monthly
                # First day of next month
                if last_dt.month == 12:
                    next_rotation = last_dt.replace(year=last_dt.year + 1, month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
                else:
                    next_rotation = last_dt.replace(month=last_dt.month + 1, day=1, hour=0, minute=0, second=0, microsecond=0)

            next_rotation_str = next_rotation.isoformat()
        else:
            next_rotation_str = "Not yet rotated"

        status[frequency] = {
            "active_challenges": active_challenges,
            "last_rotation": last_rotation or "Never",
            "next_rotation": next_rotation_str
        }

    return status


# ============================================================================
# CEFR-Based Challenge Functions (New System)
# ============================================================================

def get_challenges_by_cefr_level(cefr_level, challenge_type=None):
    """
    Fetch challenges for a specific CEFR level and optionally filter by type.

    Args:
        cefr_level: str - CEFR level (e.g., "A1", "A2")
        challenge_type: str - Optional challenge type filter ("listening", "irl", etc.)

    Returns:
        list - List of challenges matching criteria
    """
    challenges_ref = db.collection("challenges")
    query = challenges_ref.where("cefr_level", "==", cefr_level)

    if challenge_type:
        query = query.where("type", "==", challenge_type)

    challenges = []
    for doc in query.stream():
        challenge = doc.to_dict()
        challenge["id"] = doc.id
        challenges.append(challenge)

    return challenges


def get_challenges_for_user_level(uid):
    """
    Fetch all challenges available to user based on their CEFR progression.
    Returns challenges at or below user's current level.

    Args:
        uid: str - Firebase user ID

    Returns:
        dict - Challenges grouped by type
    """
    from services_cefr import get_user_cefr_progress, get_available_levels_for_user

    # Get user's available levels (unlocked levels)
    available_levels = get_available_levels_for_user(uid)

    # Fetch challenges for all available levels
    all_challenges = {
        "irl": [],
        "listening": [],
        "fill_blank": [],
        "multiple_choice": [],
        "pronunciation": []
    }

    # Track challenge IDs to prevent duplicates
    seen_ids = {
        "irl": set(),
        "listening": set(),
        "fill_blank": set(),
        "multiple_choice": set(),
        "pronunciation": set()
    }

    for level in available_levels:
        level_challenges = get_challenges_by_cefr_level(level)

        for challenge in level_challenges:
            challenge_type = challenge.get("type", "")
            challenge_id = challenge.get("id", "")

            # Only add if we haven't seen this challenge ID before
            if challenge_type in all_challenges and challenge_id not in seen_ids[challenge_type]:
                all_challenges[challenge_type].append(challenge)
                seen_ids[challenge_type].add(challenge_id)

    return all_challenges


def get_todays_challenges_for_user(uid):
    """
    Get today's available challenges for a user with completion status.
    This is the main endpoint for the new CEFR-based daily challenge system.

    Args:
        uid: str - Firebase user ID

    Returns:
        dict - Available challenges by type with completion status
    """
    from services_daily_progress import (
        get_challenge_completion_status,
        get_completed_challenge_ids,
        get_current_utc_date
    )
    from services_cefr import get_user_cefr_progress

    # Get user's CEFR level and progress
    cefr_data = get_user_cefr_progress(uid)
    if not cefr_data:
        # Initialize CEFR for new users
        from services_cefr import initialize_user_cefr_progress
        initialize_user_cefr_progress(uid)
        cefr_data = get_user_cefr_progress(uid)

    current_level = cefr_data.get("current_level", "A1")

    # Get all available challenges for user's level(s)
    challenges_by_type = get_challenges_for_user_level(uid)

    # Get completion status for today
    completion_status = get_challenge_completion_status(uid)

    # Get completed challenge IDs for today
    completed_ids = get_completed_challenge_ids(uid)

    # Build response
    response = {
        "date": get_current_utc_date(),
        "user_level": current_level,
        "challenges": {}
    }

    for challenge_type, challenges in challenges_by_type.items():
        status = completion_status.get(challenge_type, {})
        completed_challenge_ids = set(completed_ids.get(challenge_type, []))

        # Filter out already completed challenges
        available_challenges = [
            challenge for challenge in challenges
            if challenge.get("id") not in completed_challenge_ids
        ]

        response["challenges"][challenge_type] = {
            "available": available_challenges,
            "completed_today": status.get("completed", 0),
            "limit": status.get("limit", -1),
            "can_complete_more": status.get("can_complete_more", True)
        }

    return response


def generate_challenges_for_user(uid, count=5, challenge_types=None):
    """
    Generate new AI-powered challenges for a user based on their CEFR level.
    Automatically saves generated challenges to Firestore with proper CEFR level tagging.

    Args:
        uid: str - Firebase user ID
        count: int - Number of challenges to generate
        challenge_types: list - Specific challenge types to generate (None = all types)

    Returns:
        dict - Result with generated challenge IDs and stats
    """
    from services_cefr import get_user_cefr_progress
    from services_ai_generation import (
        generate_pronunciation_challenge,
        generate_listening_challenge,
        generate_fill_blank_challenge,
        generate_multiple_choice_challenge,
        CEFR_TO_DIFFICULTY,
        save_challenges_to_firestore
    )
    import random

    # Get user's current CEFR level
    cefr_data = get_user_cefr_progress(uid)
    if not cefr_data:
        from services_cefr import initialize_user_cefr_progress
        initialize_user_cefr_progress(uid)
        cefr_data = get_user_cefr_progress(uid)

    current_level = cefr_data.get("current_level", "A1")
    difficulty = CEFR_TO_DIFFICULTY.get(current_level, 1)

    # Default challenge types
    if challenge_types is None:
        challenge_types = ["pronunciation", "listening", "fill_blank", "multiple_choice"]

    print(f"\n{'='*60}")
    print(f"Generating challenges for user {uid}")
    print(f"Current CEFR level: {current_level}")
    print(f"Difficulty: {difficulty}")
    print(f"Challenge types: {challenge_types}")
    print(f"Count: {count}")
    print(f"{'='*60}\n")

    # Generate challenges
    challenges = []
    for i in range(count):
        challenge_type = random.choice(challenge_types)
        topic = None  # Random topic

        print(f"Generating challenge {i+1}/{count}: {challenge_type}, difficulty {difficulty}...")

        try:
            if challenge_type == "pronunciation":
                challenge = generate_pronunciation_challenge(difficulty, topic, "daily")
            elif challenge_type == "listening":
                challenge = generate_listening_challenge(difficulty, topic, "daily")
            elif challenge_type == "fill_blank":
                challenge = generate_fill_blank_challenge(difficulty, topic, "daily")
            elif challenge_type == "multiple_choice":
                challenge = generate_multiple_choice_challenge(difficulty, topic, "daily")
            else:
                print(f"  ✗ Unknown challenge type: {challenge_type}")
                continue

            # Add CEFR level to challenge
            challenge["cefr_level"] = current_level
            challenges.append(challenge)
            print(f"  ✓ Generated: {challenge.get('title', 'Unknown')}")

        except Exception as e:
            print(f"  ✗ Failed to generate challenge {i+1}: {e}")
            continue

    # Save to Firestore
    saved_ids = []
    if challenges:
        print(f"\nSaving {len(challenges)} challenges to Firestore...")
        saved_ids = save_challenges_to_firestore(challenges)

    print(f"\n{'='*60}")
    print(f"Generation Complete")
    print(f"{'='*60}")
    print(f"✓ Successfully generated: {len(challenges)}/{count}")
    print(f"✗ Failed: {count - len(challenges)}")
    print(f"💾 Saved to Firestore: {len(saved_ids)}")
    print(f"{'='*60}\n")

    return {
        "success": True,
        "generated_count": len(challenges),
        "saved_count": len(saved_ids),
        "challenge_ids": saved_ids,
        "cefr_level": current_level,
        "difficulty": difficulty
    }


def submit_challenge_answer(uid, challenge_id, user_answer):
    """
    Submit an answer for a challenge (listening, fill_blank, multiple_choice).

    Args:
        uid: str - Firebase user ID
        challenge_id: str - Challenge ID
        user_answer: int or str - User's answer (index for MC, text for fill_blank)

    Returns:
        dict - Result with correctness, XP, and feedback
    """
    from services_daily_progress import can_complete_challenge, record_challenge_completion
    from services_cefr import increment_challenge_completion
    from services_firestore import update_time_based_xp
    from firebase_admin import firestore

    # Fetch challenge
    challenge = get_challenge_by_id(challenge_id)
    if not challenge:
        return {"success": False, "error": "Challenge not found"}

    challenge_type = challenge.get("type")
    cefr_level = challenge.get("cefr_level", "A1")

    # Check if user can complete this challenge type today
    can_complete = can_complete_challenge(uid, challenge_type)
    if not can_complete["can_complete"]:
        return {
            "success": False,
            "error": can_complete["reason"]
        }

    # Check answer correctness
    correct = False
    if challenge_type in ["listening", "multiple_choice"]:
        correct_answer = challenge.get("correct_answer")
        correct = (int(user_answer) == int(correct_answer))
    elif challenge_type == "fill_blank":
        correct_answer = challenge.get("missing_word", "").lower().strip()
        user_answer_normalized = str(user_answer).lower().strip()
        correct = (user_answer_normalized == correct_answer)

    # Calculate XP
    base_xp = challenge.get("xp_reward", 10)
    xp_gained = base_xp if correct else int(base_xp * 0.5)  # Half XP for incorrect

    # Record completion in daily progress
    record_challenge_completion(
        uid=uid,
        challenge_id=challenge_id,
        challenge_type=challenge_type,
        challenge_cefr_level=cefr_level,
        xp_gained=xp_gained,
        additional_data={"correct": correct, "user_answer": user_answer}
    )

    # Update CEFR progression
    if correct:
        progression_result = increment_challenge_completion(uid, cefr_level)
    else:
        progression_result = {"level_up": False}

    # Update user XP totals and time-based XP
    update_time_based_xp(uid, xp_gained)
    user_ref = db.collection("users").document(uid)
    user_ref.set({
        "xp_total": firestore.Increment(xp_gained),
        "last_attempt_at": datetime.now(timezone.utc).isoformat()
    }, merge=True)

    # Build response
    feedback = "Correct! Well done!" if correct else "Not quite right. Try again!"

    # Get updated completion status
    from services_daily_progress import get_challenge_completion_status
    updated_status = get_challenge_completion_status(uid)
    type_status = updated_status.get(challenge_type, {})

    response = {
        "success": True,
        "correct": correct,
        "xp_gained": xp_gained,
        "feedback": feedback,
        "completion_status": {
            f"{challenge_type}_completed_today": type_status.get("completed", 0),
            f"{challenge_type}_limit": type_status.get("limit", -1),
            "can_complete_more": type_status.get("can_complete_more", True)
        }
    }

    # Add level up info if applicable
    if progression_result.get("level_up"):
        response["level_up"] = True
        response["new_level"] = progression_result.get("new_level")
        response["message"] = f"Congratulations! You've advanced to {progression_result.get('new_level')}!"

    # Get updated level progress
    from services_cefr import get_user_cefr_progress
    cefr_data = get_user_cefr_progress(uid)
    current_level = cefr_data.get("current_level", "A1")
    level_progress = cefr_data.get("progress", {}).get(current_level, {})

    response["level_progress"] = {
        "current_level": current_level,
        "completed": level_progress.get("completed", 0),
        "required": level_progress.get("required", 20),
        "percentage": int((level_progress.get("completed", 0) / level_progress.get("required", 20)) * 100)
    }

    return response
