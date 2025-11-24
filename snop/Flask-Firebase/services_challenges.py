# services_challenges.py
"""
Challenge management service for Firestore.
Handles challenge retrieval, creation, and rotation logic.
"""
from firebase_config import db
from datetime import datetime, timezone, timedelta
import random
import logging

# Import pool service functions
from services_challenge_pool import get_challenges_from_pool, mark_challenge_used

logger = logging.getLogger(__name__)

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
    Checks challenge_pool first, then falls back to legacy challenges collection.

    Args:
        challenge_id: str - Document ID of the challenge

    Returns:
        dict - Challenge data or None if not found
    """
    # Check challenge_pool first (new system)
    doc = db.collection("challenge_pool").document(challenge_id).get()
    if doc.exists:
        challenge = doc.to_dict()
        challenge["id"] = doc.id
        return challenge

    # Fallback to legacy challenges collection
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


# ============================================================================
# DEPRECATED: Legacy Challenge Rotation Functions
# ============================================================================
# These functions are deprecated and will be removed in a future release.
# Please use the CEFR-based challenge system instead:
#   - get_todays_challenges_for_user(uid)
#   - get_challenges_for_user_level(uid)
#   - get_challenges_by_cefr_level(cefr_level)
# ============================================================================

def get_rotation_config():
    """
    DEPRECATED: Use CEFR-based challenge system instead.

    Get or initialize the challenge rotation configuration.

    Note: This function uses the config/challenge_rotation Firestore document
    which is no longer the recommended approach.

    Returns:
        dict - Rotation configuration
    """
    import warnings
    warnings.warn(
        "get_rotation_config() is deprecated. Use CEFR-based challenge system instead.",
        DeprecationWarning,
        stacklevel=2
    )

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
    DEPRECATED: Use CEFR-based challenge system instead.

    Rotate challenges by randomly selecting active ones.

    Note: This function uses the legacy config/challenge_rotation Firestore document.
    New code should use get_todays_challenges_for_user(uid) instead.

    Args:
        frequency: str - "daily", "weekly", or "monthly"
        num_active: int - Number of challenges to make active (default 3)

    Returns:
        list - List of active challenge IDs
    """
    import warnings
    warnings.warn(
        "rotate_challenges() is deprecated. Use CEFR-based challenge system instead.",
        DeprecationWarning,
        stacklevel=2
    )

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
    DEPRECATED: Use get_todays_challenges_for_user(uid) or get_challenges_by_frequency() instead.

    Get currently active challenges for a frequency with automatic rotation.

    Note: For backwards compatibility, this now returns all challenges of the given
    frequency instead of using the deprecated rotation system.

    Args:
        frequency: str - "daily", "weekly", or "monthly"

    Returns:
        list - List of active challenge dicts
    """
    import warnings
    warnings.warn(
        "get_active_challenges() is deprecated. Use get_todays_challenges_for_user(uid) for CEFR-based challenges "
        "or get_challenges_by_frequency() for all challenges of a frequency.",
        DeprecationWarning,
        stacklevel=2
    )

    # For backwards compatibility, return all challenges of the given frequency
    # instead of using the deprecated rotation system
    return get_challenges_by_frequency(frequency)


def get_rotation_status():
    """
    DEPRECATED: The rotation system is no longer used. Use CEFR-based challenge system instead.

    Get the current rotation status for all frequencies.

    Note: This returns a simplified status that doesn't rely on the deprecated
    config/challenge_rotation Firestore document.

    Returns:
        dict - Status for daily, weekly, and monthly rotations (deprecated format)
    """
    import warnings
    warnings.warn(
        "get_rotation_status() is deprecated. The rotation system has been replaced by the CEFR-based challenge system. "
        "Use /api/challenges/today endpoint instead.",
        DeprecationWarning,
        stacklevel=2
    )

    # Return a simplified status that doesn't rely on config/challenge_rotation
    status = {}
    for frequency in ["daily", "weekly", "monthly"]:
        challenges = get_challenges_by_frequency(frequency)
        status[frequency] = {
            "active_challenges": [c["id"] for c in challenges],
            "last_rotation": "N/A - Rotation system deprecated",
            "next_rotation": "N/A - Use CEFR-based system",
            "total_available": len(challenges),
            "deprecation_notice": "This endpoint is deprecated. Use /api/challenges/today for CEFR-based challenges."
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

    Now fetches from the challenge_pool collection instead of the old challenges collection.

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
    from services_cefr import get_user_cefr_progress, get_available_levels_for_user

    # Get user's CEFR level and progress
    cefr_data = get_user_cefr_progress(uid)
    if not cefr_data:
        # Initialize CEFR for new users
        from services_cefr import initialize_user_cefr_progress
        initialize_user_cefr_progress(uid)
        cefr_data = get_user_cefr_progress(uid)

    current_level = cefr_data.get("current_level", "A1")

    # Get user's available levels (unlocked levels)
    available_levels = get_available_levels_for_user(uid)

    # Get completion status for today
    completion_status = get_challenge_completion_status(uid)

    # Get completed challenge IDs for today
    completed_ids = get_completed_challenge_ids(uid)

    # Define challenge types
    challenge_types = ["irl", "listening", "fill_blank", "multiple_choice", "pronunciation"]

    # Build response
    response = {
        "date": get_current_utc_date(),
        "user_level": current_level,
        "challenges": {}
    }

    # Fetch challenges from pool for each type
    for challenge_type in challenge_types:
        status = completion_status.get(challenge_type, {})
        completed_challenge_ids = set(completed_ids.get(challenge_type, []))

        try:
            # Fetch from pool - get 5 challenges per type
            pool_challenges = get_challenges_from_pool(
                cefr_levels=available_levels,
                types=[challenge_type],
                count=5
            )

            # Filter out already completed challenges
            available_challenges = [
                challenge for challenge in pool_challenges
                if challenge.get("id") not in completed_challenge_ids
            ]

            if not pool_challenges:
                logger.warning(f"Pool empty for type '{challenge_type}' and levels {available_levels}")

        except Exception as e:
            logger.error(f"Error fetching from pool for type '{challenge_type}': {e}")
            available_challenges = []

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


def submit_challenge_answer(uid, challenge_id, user_answer, audio_url=None, xp_multiplier=1.0):
    """
    Submit an answer for ANY challenge type (listening, fill_blank, multiple_choice, pronunciation).
    Unified endpoint that handles all challenge types with consistent response format.

    Args:
        uid: str - Firebase user ID
        challenge_id: str - Challenge ID
        user_answer: int or str or None - User's answer (index for MC, text for fill_blank, None for pronunciation)
        audio_url: str or None - Audio URL for pronunciation challenges
        xp_multiplier: float - XP multiplier (1.0 for daily, 1.5 for weekly, 2.0 for monthly)

    Returns:
        dict - Result with correctness, XP, feedback, and level progress
    """
    from services_daily_progress import can_complete_challenge, record_challenge_completion
    from services_cefr import increment_challenge_completion
    from services_firestore import update_time_based_xp, add_attempt, update_streak
    from firebase_admin import firestore
    import os

    # Fetch challenge
    challenge = get_challenge_by_id(challenge_id)
    if not challenge:
        return {"success": False, "error": "Challenge not found"}

    challenge_type = challenge.get("type")
    cefr_level = challenge.get("cefr_level", "A1")
    difficulty = challenge.get("difficulty", 1)

    # Check if user can complete this challenge type today
    can_complete = can_complete_challenge(uid, challenge_type)
    if not can_complete["can_complete"]:
        return {
            "success": False,
            "error": can_complete["reason"]
        }

    # Handle different challenge types
    correct = False
    xp_gained = 0
    feedback = ""
    similarity = None
    transcription = None

    if challenge_type == "pronunciation":
        # Pronunciation challenge - requires audio_url
        if not audio_url:
            return {"success": False, "error": "audio_url is required for pronunciation challenges"}

        target_phrase = challenge.get("target")
        if not target_phrase:
            return {"success": False, "error": "This challenge doesn't have a target phrase for pronunciation"}

        # Import pronunciation services
        from services_pronunciation import evaluate_pronunciation, mock_evaluate_pronunciation

        # Check if we should use mock or real evaluation
        use_mock = os.getenv("USE_MOCK_PRONUNCIATION", "false").lower() == "true"

        try:
            if use_mock:
                result = mock_evaluate_pronunciation(target_phrase, difficulty)
            else:
                result = evaluate_pronunciation(audio_url, target_phrase, difficulty)

            transcription = result.get("transcription")
            similarity = result.get("similarity")
            correct = result.get("pass", False)
            xp_gained = int(result.get("xp_gained", 0) * xp_multiplier)
            feedback = result.get("feedback", "")

            # Store the attempt in Firestore for pronunciation
            add_attempt(uid, challenge_id, audio_url, result)

        except Exception as e:
            return {
                "success": False,
                "error": f"Failed to evaluate pronunciation: {str(e)}"
            }

    elif challenge_type in ["listening", "multiple_choice"]:
        # Multiple choice type challenges
        if user_answer is None:
            return {"success": False, "error": "user_answer is required for this challenge type"}

        options = challenge.get("options", [])
        correct_answer_index = challenge.get("correct_answer", 0)
        correct_option = options[correct_answer_index] if correct_answer_index < len(options) else ""

        # Support both index (legacy) and text (new) answer format
        if isinstance(user_answer, int) or (isinstance(user_answer, str) and user_answer.isdigit()):
            # User sent an index - this is the old format, compare directly
            # This won't work with randomization, but kept for backwards compatibility
            correct = (int(user_answer) == int(correct_answer_index))
        else:
            # User sent the actual option text - compare text values
            correct = (str(user_answer).strip().lower() == correct_option.strip().lower())

        base_xp = challenge.get("xp_reward", 10)
        xp_gained = int((base_xp if correct else int(base_xp * 0.5)) * xp_multiplier)
        feedback = "Correct! Well done!" if correct else "Not quite right. Try again!"

    elif challenge_type == "fill_blank":
        # Fill in the blank challenge
        if user_answer is None:
            return {"success": False, "error": "user_answer is required for this challenge type"}

        correct_answer = challenge.get("missing_word", "").lower().strip()
        user_answer_normalized = str(user_answer).lower().strip()
        correct = (user_answer_normalized == correct_answer)

        base_xp = challenge.get("xp_reward", 10)
        xp_gained = int((base_xp if correct else int(base_xp * 0.5)) * xp_multiplier)
        feedback = "Correct! Well done!" if correct else f"Not quite right. The answer was: {challenge.get('missing_word', '')}"

    else:
        return {"success": False, "error": f"Unknown challenge type: {challenge_type}"}

    # Record completion in daily progress
    additional_data = {"correct": correct}
    if user_answer is not None:
        additional_data["user_answer"] = user_answer
    if similarity is not None:
        additional_data["similarity"] = similarity
    if transcription is not None:
        additional_data["transcription"] = transcription

    record_challenge_completion(
        uid=uid,
        challenge_id=challenge_id,
        challenge_type=challenge_type,
        challenge_cefr_level=cefr_level,
        xp_gained=xp_gained,
        additional_data=additional_data
    )

    # Mark challenge as used in the pool for rotation tracking
    try:
        mark_challenge_used(challenge_id)
    except Exception as e:
        # Log but don't fail the submission if marking fails
        logger.warning(f"Failed to mark challenge {challenge_id} as used: {e}")

    # Update CEFR progression
    if correct:
        progression_result = increment_challenge_completion(uid, cefr_level)
    else:
        progression_result = {"level_up": False}

    # Update user XP totals, time-based XP, and streak
    update_time_based_xp(uid, xp_gained)
    new_streak = update_streak(uid)
    user_ref = db.collection("users").document(uid)
    user_ref.set({
        "xp_total": firestore.Increment(xp_gained),
        "last_attempt_at": datetime.now(timezone.utc).isoformat(),
        "streak_days": new_streak
    }, merge=True)

    # Get updated completion status
    from services_daily_progress import get_challenge_completion_status
    updated_status = get_challenge_completion_status(uid)
    type_status = updated_status.get(challenge_type, {})

    # Build consistent response format
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

    # Add pronunciation-specific fields
    if similarity is not None:
        response["similarity"] = similarity
    if transcription is not None:
        response["transcription"] = transcription

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

    # Check and award badges
    from services_badges import check_and_award_badges, BADGES
    badge_result = {"pass": correct, "xp_gained": xp_gained}
    if similarity is not None:
        badge_result["similarity"] = similarity
    new_badges = check_and_award_badges(uid, badge_result)
    if new_badges:
        response["new_badges"] = [BADGES[badge_id] for badge_id in new_badges]

    return response
