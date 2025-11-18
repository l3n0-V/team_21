# services_irl.py
"""
IRL (In Real Life) challenge verification service.
Handles photo uploads, GPS verification, and challenge completion.
"""
from firebase_config import db
from firebase_admin import storage
from datetime import datetime, timezone
import math


def upload_irl_photo(uid, photo_file, challenge_id):
    """
    Upload IRL challenge proof photo to Firebase Storage.

    Args:
        uid: str - Firebase user ID
        photo_file: FileStorage - Uploaded photo file (from Flask request.files)
        challenge_id: str - Challenge ID for naming

    Returns:
        str - Public URL of uploaded photo
    """
    # Get Firebase Storage bucket
    bucket = storage.bucket()

    # Generate filename: user_photos/{uid}/irl_{challenge_id}_{timestamp}.jpg
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    filename = f"user_photos/{uid}/irl_{challenge_id}_{timestamp}.jpg"

    # Create blob and upload
    blob = bucket.blob(filename)
    blob.upload_from_file(photo_file, content_type=photo_file.content_type)

    # Make the blob publicly accessible
    blob.make_public()

    return blob.public_url


def upload_irl_photo_base64(uid, photo_base64, challenge_id):
    """
    Upload IRL challenge proof photo from base64 string to Firebase Storage.
    Alternative method for mobile apps that send base64-encoded images.

    Args:
        uid: str - Firebase user ID
        photo_base64: str - Base64-encoded image data
        challenge_id: str - Challenge ID for naming

    Returns:
        str - Public URL of uploaded photo
    """
    import base64
    from io import BytesIO

    # Decode base64 string
    # Remove data URL prefix if present (e.g., "data:image/jpeg;base64,")
    if "," in photo_base64:
        photo_base64 = photo_base64.split(",")[1]

    photo_data = base64.b64decode(photo_base64)

    # Get Firebase Storage bucket
    bucket = storage.bucket()

    # Generate filename
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    filename = f"user_photos/{uid}/irl_{challenge_id}_{timestamp}.jpg"

    # Create blob and upload
    blob = bucket.blob(filename)
    blob.upload_from_file(BytesIO(photo_data), content_type="image/jpeg")

    # Make the blob publicly accessible
    blob.make_public()

    return blob.public_url


def calculate_distance_km(lat1, lng1, lat2, lng2):
    """
    Calculate distance between two GPS coordinates using Haversine formula.

    Args:
        lat1, lng1: float - First coordinate
        lat2, lng2: float - Second coordinate

    Returns:
        float - Distance in kilometers
    """
    # Earth radius in km
    R = 6371.0

    # Convert to radians
    lat1_rad = math.radians(lat1)
    lng1_rad = math.radians(lng1)
    lat2_rad = math.radians(lat2)
    lng2_rad = math.radians(lng2)

    # Haversine formula
    dlat = lat2_rad - lat1_rad
    dlng = lng2_rad - lng1_rad

    a = math.sin(dlat / 2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlng / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    distance = R * c
    return distance


def verify_gps_location(user_lat, user_lng, challenge_lat, challenge_lng, radius_km=5.0):
    """
    Verify if user's GPS location is within acceptable radius of challenge location.

    Args:
        user_lat, user_lng: float - User's GPS coordinates
        challenge_lat, challenge_lng: float - Challenge's expected GPS coordinates
        radius_km: float - Acceptable radius in kilometers (default 5km)

    Returns:
        dict - {"verified": bool, "distance_km": float, "message": str}
    """
    if challenge_lat is None or challenge_lng is None:
        # Challenge doesn't have GPS requirements
        return {
            "verified": True,
            "distance_km": None,
            "message": "No GPS verification required for this challenge"
        }

    distance = calculate_distance_km(user_lat, user_lng, challenge_lat, challenge_lng)

    verified = distance <= radius_km

    return {
        "verified": verified,
        "distance_km": round(distance, 2),
        "message": f"Within {radius_km}km radius" if verified else f"Too far ({distance:.1f}km away)"
    }


def verify_irl_challenge(uid, challenge_id, photo_url=None, photo_base64=None, photo_file=None,
                         gps_lat=None, gps_lng=None, text_description=None):
    """
    Verify and record IRL challenge completion.

    Args:
        uid: str - Firebase user ID
        challenge_id: str - IRL challenge ID
        photo_url: str - URL of already-uploaded photo (if using external upload)
        photo_base64: str - Base64-encoded photo (alternative to photo_url)
        photo_file: FileStorage - Uploaded photo file (alternative to photo_url)
        gps_lat: float - User's GPS latitude (optional)
        gps_lng: float - User's GPS longitude (optional)
        text_description: str - User's text description (optional)

    Returns:
        dict - Verification result with photo_url, gps_verified, etc.
    """
    from services_challenges import get_challenge_by_id

    # Fetch challenge data
    challenge = get_challenge_by_id(challenge_id)
    if not challenge:
        return {"error": "Challenge not found", "success": False}

    if challenge.get("type") != "irl":
        return {"error": "Challenge is not an IRL challenge", "success": False}

    # Upload photo if provided
    uploaded_photo_url = photo_url

    if photo_file:
        uploaded_photo_url = upload_irl_photo(uid, photo_file, challenge_id)
    elif photo_base64:
        uploaded_photo_url = upload_irl_photo_base64(uid, photo_base64, challenge_id)

    if not uploaded_photo_url:
        return {"error": "Photo is required for IRL challenges", "success": False}

    # Verify GPS if provided
    gps_result = None
    if gps_lat is not None and gps_lng is not None:
        challenge_lat = challenge.get("gps_lat")
        challenge_lng = challenge.get("gps_lng")
        gps_radius = challenge.get("gps_radius_meters", 5000) / 1000  # Convert meters to km

        gps_result = verify_gps_location(gps_lat, gps_lng, challenge_lat, challenge_lng, gps_radius)

    # Build verification data
    verification_data = {
        "photo_url": uploaded_photo_url,
        "verified": True,
        "verified_at": datetime.now(timezone.utc).isoformat()
    }

    if gps_result:
        verification_data["gps_location"] = {
            "lat": gps_lat,
            "lng": gps_lng,
            "verified": gps_result["verified"],
            "distance_km": gps_result["distance_km"]
        }

    if text_description:
        verification_data["text_description"] = text_description

    return {
        "success": True,
        "verified": True,
        "photo_url": uploaded_photo_url,
        "gps_verified": gps_result["verified"] if gps_result else None,
        "gps_distance_km": gps_result["distance_km"] if gps_result else None,
        "verification_data": verification_data
    }


def get_irl_challenges_for_level(cefr_level):
    """
    Fetch available IRL challenges for a specific CEFR level.

    Args:
        cefr_level: str - CEFR level (e.g., "A1")

    Returns:
        list - List of IRL challenge documents
    """
    challenges_ref = db.collection("challenges")
    query = challenges_ref.where("type", "==", "irl").where("cefr_level", "==", cefr_level)

    challenges = []
    for doc in query.stream():
        challenge = doc.to_dict()
        challenge["id"] = doc.id
        challenges.append(challenge)

    return challenges
