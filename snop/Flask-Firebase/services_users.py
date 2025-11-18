# services_users.py
"""
User profile management service for Firestore.
Handles user profile creation, retrieval, and updates.
"""
from firebase_config import db
from firebase_admin import auth
from datetime import datetime, timezone


def create_user_profile(uid, email, display_name=None, photo_url=None):
    """
    Create a user profile in Firestore when a new user registers.

    Args:
        uid: str - Firebase user ID
        email: str - User's email address
        display_name: str - User's display name (optional)
        photo_url: str - URL to user's profile picture (optional)

    Returns:
        dict - The created user profile
    """
    # Extract default display name from email if not provided
    if not display_name:
        display_name = email.split('@')[0]

    profile_data = {
        "email": email,
        "display_name": display_name,
        "photo_url": photo_url or "",
        "xp_total": 0,
        "streak_days": 0,
        "current_streak": 0,
        "longest_streak": 0,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "last_login": datetime.now(timezone.utc).isoformat(),
    }

    # Create the user document in Firestore
    db.collection("users").document(uid).set(profile_data, merge=True)

    # Initialize CEFR progression fields for new user
    from services_cefr import initialize_user_cefr_progress
    initialize_user_cefr_progress(uid)

    return profile_data


def get_user_profile(uid):
    """
    Fetch a user's profile from Firestore.

    Args:
        uid: str - Firebase user ID

    Returns:
        dict - User profile data or None if not found
    """
    doc = db.collection("users").document(uid).get()

    if not doc.exists:
        return None

    profile = doc.to_dict()
    profile["uid"] = uid  # Include the UID in the response
    return profile


def update_user_profile(uid, updates):
    """
    Update a user's profile in Firestore.

    Args:
        uid: str - Firebase user ID
        updates: dict - Fields to update (display_name, photo_url, etc.)

    Returns:
        dict - Updated user profile
    """
    # Validate allowed fields
    allowed_fields = ["display_name", "photo_url", "bio", "preferences"]
    filtered_updates = {k: v for k, v in updates.items() if k in allowed_fields}

    if not filtered_updates:
        raise ValueError("No valid fields to update")

    # Add update timestamp
    filtered_updates["updated_at"] = datetime.now(timezone.utc).isoformat()

    # Update Firestore
    db.collection("users").document(uid).set(filtered_updates, merge=True)

    # Return the updated profile
    return get_user_profile(uid)


def update_last_login(uid):
    """
    Update the user's last login timestamp.

    Args:
        uid: str - Firebase user ID
    """
    db.collection("users").document(uid).set({
        "last_login": datetime.now(timezone.utc).isoformat()
    }, merge=True)


def register_user(email, password, display_name=None):
    """
    Register a new user with Firebase Authentication and create their profile.

    Args:
        email: str - User's email address
        password: str - User's password
        display_name: str - User's display name (optional)

    Returns:
        dict - Contains uid, email, and idToken for the new user

    Raises:
        Exception if registration fails
    """
    try:
        # Create user in Firebase Authentication
        user = auth.create_user(
            email=email,
            password=password,
            display_name=display_name
        )

        # Create user profile in Firestore
        create_user_profile(
            uid=user.uid,
            email=email,
            display_name=display_name
        )

        # Generate a custom token for the user to sign in
        custom_token = auth.create_custom_token(user.uid)

        return {
            "uid": user.uid,
            "email": email,
            "display_name": display_name or email.split('@')[0],
            "custom_token": custom_token.decode('utf-8'),
            "message": "User registered successfully"
        }

    except auth.EmailAlreadyExistsError:
        raise ValueError("Email already exists")
    except Exception as e:
        raise Exception(f"Registration failed: {str(e)}")


def delete_user_account(uid):
    """
    Delete a user's account from Firebase Authentication and Firestore.

    Args:
        uid: str - Firebase user ID

    Returns:
        dict - Success message
    """
    try:
        # Delete from Firebase Authentication
        auth.delete_user(uid)

        # Delete user document from Firestore
        db.collection("users").document(uid).delete()

        # Optionally: Delete all user's subcollections (attempts, etc.)
        # This would require recursive deletion

        return {"message": "User account deleted successfully"}

    except Exception as e:
        raise Exception(f"Account deletion failed: {str(e)}")
