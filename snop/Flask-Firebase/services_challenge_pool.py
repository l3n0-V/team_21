"""
Challenge Pool Management Service

Manages the challenge pool for the SNOP app, replacing the old rotation system
with a pre-generated pool approach.
"""

import logging
import random
from datetime import datetime, timedelta
from firebase_admin import firestore
from firebase_config import db

# Configure logging
logger = logging.getLogger(__name__)

# Constants
ARCHIVE_THRESHOLD = 10  # Archive after this many uses
COLLECTION_NAME = "challenge_pool"


def get_challenges_from_pool(cefr_levels, types=None, count=5):
    """
    Fetch challenges from pool matching criteria.

    Args:
        cefr_levels: List of CEFR levels to filter by (e.g., ["A1", "A2"])
        types: Optional list of challenge types to filter by
        count: Number of challenges to return (default 5)

    Returns:
        List of challenge documents with their IDs
    """
    try:
        # Fetch all available challenges and filter in memory
        # This avoids Firestore composite index requirements
        query = db.collection(COLLECTION_NAME).where("status", "==", "available")

        docs = query.stream()
        challenges = []

        for doc in docs:
            challenge = doc.to_dict()
            challenge["id"] = doc.id

            # Filter by CEFR level
            if cefr_levels and challenge.get("cefr_level") not in cefr_levels:
                continue

            # Filter by type if specified
            if types and challenge.get("type") not in types:
                continue

            challenges.append(challenge)

        # Sort by used_count to prioritize less-used challenges
        challenges.sort(key=lambda x: x.get("used_count", 0))

        # Return requested count
        result = challenges[:count]

        # Randomize options for multiple choice challenges
        for challenge in result:
            if challenge.get("options") and challenge.get("correct_answer") is not None:
                options = challenge["options"]
                correct_index = challenge["correct_answer"]
                correct_option = options[correct_index]

                # Shuffle options
                shuffled = options.copy()
                random.shuffle(shuffled)

                # Update correct_answer to new index
                challenge["options"] = shuffled
                challenge["correct_answer"] = shuffled.index(correct_option)

        logger.info(f"Retrieved {len(result)} challenges from pool (requested {count}, found {len(challenges)} matching)")
        return result

    except Exception as e:
        logger.error(f"Error fetching challenges from pool: {e}")
        raise


def add_to_pool(challenges):
    """
    Add list of challenges to pool.

    Args:
        challenges: List of challenge dictionaries

    Returns:
        List of added challenge IDs
    """
    try:
        added_ids = []
        batch = db.batch()
        batch_count = 0

        for challenge in challenges:
            # Prepare challenge document
            doc_data = {
                **challenge,
                "status": "available",
                "used_count": 0,
                "created_at": firestore.SERVER_TIMESTAMP,
                "last_used_at": None
            }

            # Create new document reference
            doc_ref = db.collection(COLLECTION_NAME).document()
            batch.set(doc_ref, doc_data)
            added_ids.append(doc_ref.id)
            batch_count += 1

            # Firestore batches are limited to 500 operations
            if batch_count >= 500:
                batch.commit()
                batch = db.batch()
                batch_count = 0

        # Commit remaining
        if batch_count > 0:
            batch.commit()

        logger.info(f"Added {len(added_ids)} challenges to pool")
        return added_ids

    except Exception as e:
        logger.error(f"Error adding challenges to pool: {e}")
        raise


def mark_challenge_used(challenge_id):
    """
    Mark a challenge as used.

    Args:
        challenge_id: The ID of the challenge to mark

    Returns:
        Updated challenge data
    """
    try:
        doc_ref = db.collection(COLLECTION_NAME).document(challenge_id)
        doc = doc_ref.get()

        if not doc.exists:
            logger.warning(f"Challenge {challenge_id} not found in pool")
            return None

        challenge_data = doc.to_dict()
        new_used_count = challenge_data.get("used_count", 0) + 1

        update_data = {
            "used_count": new_used_count,
            "last_used_at": firestore.SERVER_TIMESTAMP
        }

        # Archive if over threshold
        if new_used_count >= ARCHIVE_THRESHOLD:
            update_data["status"] = "archived"
            logger.info(f"Challenge {challenge_id} archived after {new_used_count} uses")

        doc_ref.update(update_data)

        # Return updated data
        updated_doc = doc_ref.get()
        result = updated_doc.to_dict()
        result["id"] = challenge_id

        logger.info(f"Marked challenge {challenge_id} as used (count: {new_used_count})")
        return result

    except Exception as e:
        logger.error(f"Error marking challenge {challenge_id} as used: {e}")
        raise


def get_pool_stats(cefr_level=None):
    """
    Get statistics about the challenge pool.

    Args:
        cefr_level: Optional CEFR level to filter by

    Returns:
        Dict with counts by status, type, and cefr_level
    """
    try:
        query = db.collection(COLLECTION_NAME)

        if cefr_level:
            query = query.where("cefr_level", "==", cefr_level)

        docs = query.stream()

        stats = {
            "total": 0,
            "by_status": {
                "available": 0,
                "used": 0,
                "archived": 0
            },
            "by_type": {},
            "by_cefr_level": {}
        }

        for doc in docs:
            data = doc.to_dict()
            stats["total"] += 1

            # Count by status
            status = data.get("status", "available")
            if status in stats["by_status"]:
                stats["by_status"][status] += 1

            # Count by type
            challenge_type = data.get("type", "unknown")
            if challenge_type not in stats["by_type"]:
                stats["by_type"][challenge_type] = 0
            stats["by_type"][challenge_type] += 1

            # Count by CEFR level
            level = data.get("cefr_level", "unknown")
            if level not in stats["by_cefr_level"]:
                stats["by_cefr_level"][level] = 0
            stats["by_cefr_level"][level] += 1

        logger.info(f"Retrieved pool stats: {stats['total']} total challenges")
        return stats

    except Exception as e:
        logger.error(f"Error getting pool stats: {e}")
        raise


def get_pool_health():
    """
    Check pool health and identify low challenge counts.

    Returns:
        Dict with warnings for CEFR levels with < 10 available challenges
    """
    try:
        # Get all available challenges grouped by CEFR level
        query = db.collection(COLLECTION_NAME).where("status", "==", "available")
        docs = query.stream()

        cefr_counts = {}
        all_cefr_levels = ["A1", "A2", "B1", "B2", "C1", "C2"]

        # Initialize all levels
        for level in all_cefr_levels:
            cefr_counts[level] = 0

        for doc in docs:
            data = doc.to_dict()
            level = data.get("cefr_level")
            if level in cefr_counts:
                cefr_counts[level] += 1

        # Check for low pools
        warnings = []
        healthy = True

        for level, count in cefr_counts.items():
            if count < 10:
                healthy = False
                warnings.append({
                    "cefr_level": level,
                    "available_count": count,
                    "message": f"{level} has only {count} available challenges (minimum 10 recommended)"
                })

        result = {
            "healthy": healthy,
            "warnings": warnings,
            "available_by_level": cefr_counts
        }

        if not healthy:
            logger.warning(f"Pool health check: {len(warnings)} warnings")
        else:
            logger.info("Pool health check: OK")

        return result

    except Exception as e:
        logger.error(f"Error checking pool health: {e}")
        raise


def archive_old_challenges(days=30):
    """
    Archive challenges not used in X days.

    Args:
        days: Number of days of inactivity before archiving

    Returns:
        Count of archived challenges
    """
    try:
        cutoff_date = datetime.utcnow() - timedelta(days=days)

        # Query for available challenges last used before cutoff
        query = db.collection(COLLECTION_NAME).where("status", "==", "available")
        docs = query.stream()

        archived_count = 0
        batch = db.batch()
        batch_count = 0

        for doc in docs:
            data = doc.to_dict()
            last_used = data.get("last_used_at")
            created_at = data.get("created_at")

            # Check if challenge should be archived
            should_archive = False

            if last_used:
                # Convert Firestore timestamp to datetime if needed
                if hasattr(last_used, 'timestamp'):
                    last_used_dt = datetime.fromtimestamp(last_used.timestamp())
                else:
                    last_used_dt = last_used

                if last_used_dt < cutoff_date:
                    should_archive = True
            elif created_at:
                # If never used, check created_at
                if hasattr(created_at, 'timestamp'):
                    created_dt = datetime.fromtimestamp(created_at.timestamp())
                else:
                    created_dt = created_at

                if created_dt < cutoff_date:
                    should_archive = True

            if should_archive:
                batch.update(doc.reference, {"status": "archived"})
                archived_count += 1
                batch_count += 1

                # Commit batch if reaching limit
                if batch_count >= 500:
                    batch.commit()
                    batch = db.batch()
                    batch_count = 0

        # Commit remaining
        if batch_count > 0:
            batch.commit()

        logger.info(f"Archived {archived_count} old challenges (inactive > {days} days)")
        return archived_count

    except Exception as e:
        logger.error(f"Error archiving old challenges: {e}")
        raise


def reset_challenge_status(challenge_id):
    """
    Reset a challenge to available status (utility function).

    Args:
        challenge_id: The ID of the challenge to reset

    Returns:
        Updated challenge data
    """
    try:
        doc_ref = db.collection(COLLECTION_NAME).document(challenge_id)
        doc = doc_ref.get()

        if not doc.exists:
            logger.warning(f"Challenge {challenge_id} not found in pool")
            return None

        doc_ref.update({
            "status": "available",
            "used_count": 0,
            "last_used_at": None
        })

        updated_doc = doc_ref.get()
        result = updated_doc.to_dict()
        result["id"] = challenge_id

        logger.info(f"Reset challenge {challenge_id} to available")
        return result

    except Exception as e:
        logger.error(f"Error resetting challenge {challenge_id}: {e}")
        raise
