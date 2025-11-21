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
                         gps_lat=None, gps_lng=None, text_description=None, skip_ai=False,
                         audio_base64=None, expected_phrase=None):
    """
    Verify and record IRL challenge completion with AI verification.

    Args:
        uid: str - Firebase user ID
        challenge_id: str - IRL challenge ID
        photo_url: str - URL of already-uploaded photo (if using external upload)
        photo_base64: str - Base64-encoded photo (alternative to photo_url)
        photo_file: FileStorage - Uploaded photo file (alternative to photo_url)
        gps_lat: float - User's GPS latitude (optional)
        gps_lng: float - User's GPS longitude (optional)
        text_description: str - User's text description (optional)
        skip_ai: bool - Skip AI verification (for quick submit)
        audio_base64: str - Base64-encoded audio for pronunciation check
        expected_phrase: str - Expected phrase for pronunciation scoring

    Returns:
        dict - Verification result with tier, xp_multiplier, feedback, etc.
    """
    from services_challenges import get_challenge_by_id
    import tempfile
    import os

    # Fetch challenge data
    challenge = get_challenge_by_id(challenge_id)
    if not challenge:
        return {"error": "Challenge not found", "success": False}

    if challenge.get("type") != "irl":
        return {"error": "Challenge is not an IRL challenge", "success": False}

    # Initialize result
    result = {
        "success": True,
        "tier": "bronze",
        "xp_multiplier": 0.2,
        "photo_url": None,
        "ai_verified": False,
        "feedback": "Challenge marked as complete",
        "feedback_no": "Utfordring markert som fullført"
    }

    # Upload photo if provided
    uploaded_photo_url = photo_url
    temp_photo_path = None

    if photo_file:
        # Save to temp file for AI verification
        temp_photo_path = tempfile.NamedTemporaryFile(delete=False, suffix='.jpg').name
        photo_file.save(temp_photo_path)
        photo_file.seek(0)  # Reset file pointer for upload

        uploaded_photo_url = upload_irl_photo(uid, photo_file, challenge_id)
    elif photo_base64:
        uploaded_photo_url = upload_irl_photo_base64(uid, photo_base64, challenge_id)

        # Decode base64 to temp file for AI verification
        import base64
        if "," in photo_base64:
            photo_base64 = photo_base64.split(",")[1]
        photo_data = base64.b64decode(photo_base64)
        temp_photo_path = tempfile.NamedTemporaryFile(delete=False, suffix='.jpg').name
        with open(temp_photo_path, 'wb') as f:
            f.write(photo_data)

    result["photo_url"] = uploaded_photo_url

    # Process audio for pronunciation scoring
    if audio_base64 and expected_phrase:
        try:
            from services_pronunciation import evaluate_pronunciation
            import base64

            # Decode audio to temp file
            if "," in audio_base64:
                audio_base64 = audio_base64.split(",")[1]
            audio_data = base64.b64decode(audio_base64)
            temp_audio_path = tempfile.NamedTemporaryFile(delete=False, suffix='.m4a').name
            with open(temp_audio_path, 'wb') as f:
                f.write(audio_data)

            # Evaluate pronunciation
            pronunciation_result = evaluate_pronunciation(temp_audio_path, expected_phrase)

            result["pronunciation"] = {
                "transcription": pronunciation_result.get("transcription", ""),
                "similarity": pronunciation_result.get("similarity", 0),
                "xp_gained": pronunciation_result.get("xp_gained", 0),
                "feedback": pronunciation_result.get("feedback", ""),
                "pass": pronunciation_result.get("pass", False)
            }

            # Clean up temp audio file
            if os.path.exists(temp_audio_path):
                os.remove(temp_audio_path)

            # Audio submitted = at least bronze tier
            result["ai_verified"] = True

        except Exception as e:
            print(f"Audio processing error: {e}")
            result["pronunciation"] = {
                "error": str(e),
                "feedback": "Audio processing failed"
            }

    # If no photo and no text and no audio, return bronze tier
    if not uploaded_photo_url and not text_description and not audio_base64:
        result["feedback"] = "Challenge marked as complete (no verification)"
        return result

    # AI Verification (unless skipped)
    if not skip_ai:
        try:
            from services_irl_verification import verify_irl_submission, calculate_irl_xp

            ai_result = verify_irl_submission(
                challenge=challenge,
                photo_path=temp_photo_path,
                text_response=text_description
            )

            result["tier"] = ai_result["tier"]
            result["xp_multiplier"] = ai_result["xp_multiplier"]
            result["ai_verified"] = ai_result["ai_verified"]
            result["feedback"] = ai_result["feedback"]

            # Add detailed results
            if ai_result.get("photo_result"):
                result["photo_verification"] = {
                    "verified": ai_result["photo_result"]["verified"],
                    "confidence": ai_result["photo_result"]["confidence"],
                    "message": ai_result["photo_result"]["message"]
                }

            if ai_result.get("text_result"):
                result["text_verification"] = {
                    "verified": ai_result["text_result"]["verified"],
                    "score": ai_result["text_result"]["score"],
                    "word_count": ai_result["text_result"]["word_count"],
                    "feedback_no": ai_result["text_result"].get("feedback_no", ""),
                    "suggestions": ai_result["text_result"].get("suggestions", [])
                }
                result["feedback_no"] = ai_result["text_result"].get("feedback_no", result["feedback_no"])

        except Exception as e:
            # If AI verification fails, fall back to basic verification
            print(f"AI verification failed: {e}")
            if uploaded_photo_url:
                result["tier"] = "silver"
                result["xp_multiplier"] = 0.5
                result["feedback"] = "Photo uploaded (AI verification unavailable)"
    else:
        # Skip AI - just check what was submitted
        if uploaded_photo_url and text_description:
            result["tier"] = "gold"
            result["xp_multiplier"] = 1.0
            result["feedback"] = "Full submission received"
        elif uploaded_photo_url:
            result["tier"] = "silver"
            result["xp_multiplier"] = 0.5
            result["feedback"] = "Photo submitted"

    # Clean up temp file
    if temp_photo_path and os.path.exists(temp_photo_path):
        os.remove(temp_photo_path)

    # Verify GPS if provided (bonus, doesn't affect tier)
    gps_result = None
    if gps_lat is not None and gps_lng is not None:
        challenge_lat = challenge.get("gps_lat")
        challenge_lng = challenge.get("gps_lng")
        gps_radius = challenge.get("gps_radius_meters", 5000) / 1000

        gps_result = verify_gps_location(gps_lat, gps_lng, challenge_lat, challenge_lng, gps_radius)
        result["gps_verified"] = gps_result["verified"]
        result["gps_distance_km"] = gps_result["distance_km"]

    # Build verification data for storage
    result["verification_data"] = {
        "photo_url": uploaded_photo_url,
        "tier": result["tier"],
        "xp_multiplier": result["xp_multiplier"],
        "ai_verified": result["ai_verified"],
        "verified_at": datetime.now(timezone.utc).isoformat()
    }

    if text_description:
        result["verification_data"]["text_description"] = text_description

    if gps_result:
        result["verification_data"]["gps_location"] = {
            "lat": gps_lat,
            "lng": gps_lng,
            "verified": gps_result["verified"],
            "distance_km": gps_result["distance_km"]
        }

    return result


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
