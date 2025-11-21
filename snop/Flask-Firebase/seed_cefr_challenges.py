#!/usr/bin/env python3
"""
Seed CEFR challenges to Firestore challenge_pool collection.

Usage:
    python seed_cefr_challenges.py [--clear]

Options:
    --clear     Clear existing challenges before seeding (recommended for fresh start)
"""
import argparse
import json
from datetime import datetime, timezone
from dotenv import load_dotenv

load_dotenv()

from firebase_config import db

COLLECTION_NAME = "challenge_pool"

def clear_challenge_pool():
    """Clear all documents from challenge_pool collection."""
    print("Clearing existing challenge_pool...")

    docs = db.collection(COLLECTION_NAME).stream()
    count = 0
    batch = db.batch()

    for doc in docs:
        batch.delete(doc.reference)
        count += 1

        if count % 500 == 0:
            batch.commit()
            batch = db.batch()
            print(f"  Deleted {count} documents...")

    if count % 500 != 0:
        batch.commit()

    print(f"Cleared {count} existing challenges from pool")
    return count


def seed_challenges(json_path="cefr_challenges.json"):
    """Seed challenges from JSON file to Firestore."""
    print(f"\nLoading challenges from {json_path}...")

    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    challenges = data.get('challenges', [])
    print(f"Found {len(challenges)} challenges to seed")

    # Group by level for reporting
    by_level = {}
    for c in challenges:
        level = c.get('cefr_level', 'Unknown')
        by_level[level] = by_level.get(level, 0) + 1

    print("\nChallenges by level:")
    for level in ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']:
        print(f"  {level}: {by_level.get(level, 0)}")

    # Seed to Firestore
    print("\nSeeding to Firestore...")
    timestamp = datetime.now(timezone.utc).isoformat()
    count = 0

    for challenge in challenges:
        # Add pool metadata
        challenge_data = {
            **challenge,
            "status": "available",
            "used_count": 0,
            "created_at": timestamp
        }

        # Use challenge ID as document ID
        challenge_id = challenge.get('id')
        if challenge_id:
            db.collection(COLLECTION_NAME).document(challenge_id).set(challenge_data)
        else:
            db.collection(COLLECTION_NAME).add(challenge_data)

        count += 1

        if count % 20 == 0:
            print(f"  Seeded {count} challenges...")

    print(f"\nSuccessfully seeded {count} challenges to {COLLECTION_NAME}")
    return count


def main():
    parser = argparse.ArgumentParser(description="Seed CEFR challenges to Firestore")
    parser.add_argument(
        "--clear",
        action="store_true",
        help="Clear existing challenges before seeding"
    )
    parser.add_argument(
        "--json",
        type=str,
        default="cefr_challenges.json",
        help="Path to challenges JSON file"
    )

    args = parser.parse_args()

    print("="*60)
    print("SNOP CEFR Challenge Seeder")
    print("="*60)

    if args.clear:
        clear_challenge_pool()

    seed_challenges(args.json)

    print("\nDone! Verify in Firebase Console or test with:")
    print("  curl http://localhost:5000/challenges/pool/stats")


if __name__ == "__main__":
    main()
