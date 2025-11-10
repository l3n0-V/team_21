# services_challenges.py
"""
Challenge management service for Firestore.
Handles challenge retrieval, creation, and rotation logic.
"""
from firebase_config import db
from datetime import datetime, timezone

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
