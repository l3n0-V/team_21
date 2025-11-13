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
