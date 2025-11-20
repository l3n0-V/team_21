#!/usr/bin/env python3
"""
Batch Challenge Pool Generation Job

This script refills the challenge pool with AI-generated challenges.
Can be run manually via CLI or triggered via the /admin/refill-pool endpoint.

Usage:
    python jobs/generate_pool_challenges.py                    # Refill all levels
    python jobs/generate_pool_challenges.py --level A1         # Refill specific level
    python jobs/generate_pool_challenges.py --min 30           # Set minimum threshold
    python jobs/generate_pool_challenges.py --dry-run          # Preview without generating
"""

import sys
import os
import argparse
import logging
from datetime import datetime
from dotenv import load_dotenv

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env'))

from services_ai_generation import (
    generate_pronunciation_challenge,
    generate_listening_challenge,
    generate_fill_blank_challenge,
    generate_multiple_choice_challenge,
    CEFR_TO_DIFFICULTY
)

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# CEFR levels
CEFR_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"]

# Challenge types
CHALLENGE_TYPES = ["pronunciation", "listening", "fill_blank", "multiple_choice"]

# Generation timeout (seconds)
GENERATION_TIMEOUT = 60


def get_pool_stats(cefr_level):
    """
    Get statistics for challenges in the pool at a specific CEFR level.

    Args:
        cefr_level: str - CEFR level (A1-C2)

    Returns:
        dict with 'available', 'used', 'total' counts
    """
    try:
        import firebase_admin
        from firebase_admin import firestore

        # Initialize Firebase if not already done
        if not firebase_admin._apps:
            from firebase_admin import credentials
            cred_path = os.path.join(
                os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                'firebase-auth.json'
            )
            cred = credentials.Certificate(cred_path)
            firebase_admin.initialize_app(cred)

        db = firestore.client()

        # Query challenges by CEFR level
        challenges_ref = db.collection("challenge_pool")

        # Get available (not used) challenges
        available_query = challenges_ref.where("cefr_level", "==", cefr_level).where("used", "==", False)
        available_docs = list(available_query.stream())

        # Get used challenges
        used_query = challenges_ref.where("cefr_level", "==", cefr_level).where("used", "==", True)
        used_docs = list(used_query.stream())

        return {
            "available": len(available_docs),
            "used": len(used_docs),
            "total": len(available_docs) + len(used_docs)
        }

    except Exception as e:
        logger.warning(f"Could not get pool stats for {cefr_level}: {e}")
        # Return zeros if pool doesn't exist yet
        return {"available": 0, "used": 0, "total": 0}


def add_to_pool(challenges):
    """
    Add generated challenges to the pool in Firestore.

    Args:
        challenges: list - List of challenge dicts

    Returns:
        list - List of document IDs of saved challenges
    """
    try:
        import firebase_admin
        from firebase_admin import firestore

        if not firebase_admin._apps:
            from firebase_admin import credentials
            cred_path = os.path.join(
                os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                'firebase-auth.json'
            )
            cred = credentials.Certificate(cred_path)
            firebase_admin.initialize_app(cred)

        db = firestore.client()
        saved_ids = []

        for challenge in challenges:
            # Add pool metadata
            challenge["used"] = False
            challenge["created_at"] = datetime.utcnow().isoformat()
            challenge["generated_by"] = "ai_batch_job"

            # Add to challenge_pool collection
            doc_ref = db.collection("challenge_pool").add(challenge)
            doc_id = doc_ref[1].id
            saved_ids.append(doc_id)
            logger.debug(f"Added challenge to pool: {doc_id}")

        return saved_ids

    except Exception as e:
        logger.error(f"Failed to add challenges to pool: {e}")
        raise


def generate_for_level(cefr_level, count, types=None):
    """
    Generate challenges for a specific CEFR level.

    Args:
        cefr_level: str - CEFR level (A1-C2)
        count: int - Number of challenges to generate
        types: list - Challenge types to generate (default: all)

    Returns:
        list - List of generated challenge dicts
    """
    if types is None:
        types = CHALLENGE_TYPES

    # Map CEFR level to difficulty
    difficulty = CEFR_TO_DIFFICULTY.get(cefr_level, 1)

    challenges = []
    type_index = 0

    for i in range(count):
        # Distribute evenly across types
        challenge_type = types[type_index % len(types)]
        type_index += 1

        logger.info(f"Generating {challenge_type} challenge {i+1}/{count} for {cefr_level}...")

        try:
            # Generate based on type
            if challenge_type == "pronunciation":
                challenge = generate_pronunciation_challenge(
                    difficulty=difficulty,
                    topic=None,
                    frequency="daily"
                )
            elif challenge_type == "listening":
                challenge = generate_listening_challenge(
                    difficulty=difficulty,
                    topic=None,
                    frequency="daily"
                )
            elif challenge_type == "fill_blank":
                challenge = generate_fill_blank_challenge(
                    difficulty=difficulty,
                    topic=None,
                    frequency="daily"
                )
            elif challenge_type == "multiple_choice":
                challenge = generate_multiple_choice_challenge(
                    difficulty=difficulty,
                    topic=None,
                    frequency="daily"
                )
            else:
                logger.warning(f"Unknown challenge type: {challenge_type}")
                continue

            # Add CEFR level to the challenge
            challenge["cefr_level"] = cefr_level

            challenges.append(challenge)
            logger.info(f"  Generated: {challenge.get('title', 'Unknown')}")

        except Exception as e:
            logger.error(f"  Failed to generate {challenge_type} for {cefr_level}: {e}")
            # Continue with next challenge (don't abort batch)
            continue

    return challenges


def refill_single_level(level, min_available=20, dry_run=False):
    """
    Refill challenges for a single CEFR level.

    Args:
        level: str - CEFR level to refill
        min_available: int - Minimum number of available challenges
        dry_run: bool - If True, only show what would be generated

    Returns:
        dict - Result summary
    """
    logger.info(f"\n{'='*60}")
    logger.info(f"Refilling pool for {level}")
    logger.info(f"{'='*60}")

    stats = get_pool_stats(level)
    available = stats.get("available", 0)

    logger.info(f"Current stats for {level}: {stats}")

    if available >= min_available:
        logger.info(f"{level} has sufficient challenges ({available} >= {min_available})")
        return {
            "level": level,
            "action": "skipped",
            "reason": f"Sufficient challenges available ({available} >= {min_available})",
            "generated": 0,
            "saved": 0
        }

    needed = min_available - available
    logger.info(f"Need to generate {needed} challenges for {level}")

    if dry_run:
        logger.info(f"[DRY RUN] Would generate {needed} challenges for {level}")
        return {
            "level": level,
            "action": "dry_run",
            "would_generate": needed,
            "generated": 0,
            "saved": 0
        }

    # Generate challenges
    challenges = generate_for_level(level, needed)

    # Add to pool
    saved_ids = []
    if challenges:
        saved_ids = add_to_pool(challenges)
        logger.info(f"Added {len(saved_ids)} challenges to pool for {level}")

    return {
        "level": level,
        "action": "refilled",
        "needed": needed,
        "generated": len(challenges),
        "saved": len(saved_ids),
        "saved_ids": saved_ids
    }


def refill_pool(min_available=20, batch_size=10, dry_run=False):
    """
    Check each CEFR level and refill if below minimum.

    Args:
        min_available: int - Minimum number of available challenges per level
        batch_size: int - Maximum challenges to generate per level in one run
        dry_run: bool - If True, only show what would be generated

    Returns:
        dict - Summary of all operations
    """
    logger.info(f"\n{'='*60}")
    logger.info(f"Challenge Pool Refill Job Started")
    logger.info(f"{'='*60}")
    logger.info(f"Minimum available per level: {min_available}")
    logger.info(f"Batch size: {batch_size}")
    logger.info(f"Dry run: {dry_run}")
    logger.info(f"{'='*60}\n")

    results = {
        "timestamp": datetime.utcnow().isoformat(),
        "min_available": min_available,
        "batch_size": batch_size,
        "dry_run": dry_run,
        "levels": {},
        "total_generated": 0,
        "total_saved": 0,
        "errors": []
    }

    for level in CEFR_LEVELS:
        try:
            stats = get_pool_stats(level)
            available = stats.get("available", 0)

            logger.info(f"\n{level}: {available} available challenges")

            if available < min_available:
                needed = min(min_available - available, batch_size)
                logger.info(f"  Need to generate {needed} challenges")

                if dry_run:
                    results["levels"][level] = {
                        "status": "would_generate",
                        "available": available,
                        "needed": needed
                    }
                    continue

                # Generate challenges
                challenges = generate_for_level(level, needed)

                if challenges:
                    saved_ids = add_to_pool(challenges)
                    results["levels"][level] = {
                        "status": "refilled",
                        "available_before": available,
                        "generated": len(challenges),
                        "saved": len(saved_ids)
                    }
                    results["total_generated"] += len(challenges)
                    results["total_saved"] += len(saved_ids)
                    logger.info(f"  Added {len(saved_ids)} challenges")
                else:
                    results["levels"][level] = {
                        "status": "generation_failed",
                        "available": available
                    }
            else:
                logger.info(f"  Sufficient challenges available")
                results["levels"][level] = {
                    "status": "sufficient",
                    "available": available
                }

        except Exception as e:
            logger.error(f"Error processing {level}: {e}")
            results["errors"].append({
                "level": level,
                "error": str(e)
            })
            results["levels"][level] = {
                "status": "error",
                "error": str(e)
            }

    # Summary
    logger.info(f"\n{'='*60}")
    logger.info(f"Refill Job Complete")
    logger.info(f"{'='*60}")
    logger.info(f"Total generated: {results['total_generated']}")
    logger.info(f"Total saved: {results['total_saved']}")
    logger.info(f"Errors: {len(results['errors'])}")
    logger.info(f"{'='*60}\n")

    return results


def check_ollama_available():
    """
    Check if Ollama is available and the model is loaded.

    Returns:
        bool - True if Ollama is available
    """
    try:
        import ollama
        # Try to list models
        models = ollama.list()
        model_names = [m.get('name', '') for m in models.get('models', [])]

        if any('llama3.2' in name for name in model_names):
            logger.info("Ollama is available with llama3.2 model")
            return True
        else:
            logger.warning(f"Ollama available but llama3.2 not found. Models: {model_names}")
            return False

    except Exception as e:
        logger.error(f"Ollama not available: {e}")
        return False


def main():
    """Main entry point for CLI usage."""
    parser = argparse.ArgumentParser(
        description="Refill the challenge pool with AI-generated challenges"
    )
    parser.add_argument(
        "--level",
        choices=CEFR_LEVELS,
        help="Specific CEFR level to refill (default: all levels)"
    )
    parser.add_argument(
        "--min",
        type=int,
        default=20,
        help="Minimum number of available challenges per level (default: 20)"
    )
    parser.add_argument(
        "--batch-size",
        type=int,
        default=10,
        help="Maximum challenges to generate per level (default: 10)"
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Show what would be generated without actually generating"
    )
    parser.add_argument(
        "--check-ollama",
        action="store_true",
        help="Only check if Ollama is available"
    )
    parser.add_argument(
        "--verbose",
        action="store_true",
        help="Enable verbose logging"
    )

    args = parser.parse_args()

    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)

    # Check Ollama availability
    if args.check_ollama:
        available = check_ollama_available()
        sys.exit(0 if available else 1)

    # Verify Ollama is available before proceeding
    if not args.dry_run:
        if not check_ollama_available():
            logger.error("Ollama is not available. Please ensure Ollama is running with llama3.2 model.")
            logger.error("Install: https://ollama.ai/download")
            logger.error("Run: ollama pull llama3.2 && ollama serve")
            sys.exit(1)

    # Run refill job
    if args.level:
        result = refill_single_level(
            level=args.level,
            min_available=args.min,
            dry_run=args.dry_run
        )
    else:
        result = refill_pool(
            min_available=args.min,
            batch_size=args.batch_size,
            dry_run=args.dry_run
        )

    # Print result summary
    import json
    print("\nResult:")
    print(json.dumps(result, indent=2))

    # Exit with error code if there were failures
    if isinstance(result, dict):
        if result.get("errors"):
            sys.exit(1)
        if result.get("action") == "error":
            sys.exit(1)

    sys.exit(0)


if __name__ == "__main__":
    main()
