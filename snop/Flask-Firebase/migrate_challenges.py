#!/usr/bin/env python3
"""
Migration script to populate Firestore with challenges from the mobile app's JSON file.

Usage:
    python migrate_challenges.py

This script reads challenges from ../mobile/src/data/challenges.json
and creates them in the Firestore "challenges" collection.
"""
import json
import sys
from pathlib import Path
from datetime import datetime, timezone
from dotenv import load_dotenv

# Load environment variables from .env BEFORE importing firebase_config
load_dotenv()

from firebase_config import db

def migrate_challenges():
    """Read challenges from JSON and upload to Firestore."""

    # Path to the challenges JSON file
    json_path = Path(__file__).parent.parent / "mobile" / "src" / "data" / "challenges.json"

    if not json_path.exists():
        print(f"❌ Error: challenges.json not found at {json_path}")
        sys.exit(1)

    # Read the JSON file
    with open(json_path, 'r', encoding='utf-8') as f:
        challenges_data = json.load(f)

    print(f"📖 Loaded challenges from {json_path}")
    print(f"   - Daily: {len(challenges_data.get('daily', []))} challenges")
    print(f"   - Weekly: {len(challenges_data.get('weekly', []))} challenges")
    print(f"   - Monthly: {len(challenges_data.get('monthly', []))} challenges")
    print()

    # Check if challenges already exist in Firestore
    existing_docs = db.collection("challenges").limit(1).stream()
    existing_count = sum(1 for _ in existing_docs)

    if existing_count > 0:
        print("⚠️  Warning: Challenges collection already contains data.")
        response = input("Do you want to continue and add more challenges? (y/N): ")
        if response.lower() != 'y':
            print("❌ Migration cancelled.")
            sys.exit(0)

    # Migrate each category
    total_added = 0
    timestamp = datetime.now(timezone.utc).isoformat()

    for frequency in ["daily", "weekly", "monthly"]:
        challenges = challenges_data.get(frequency, [])

        for challenge in challenges:
            # Add metadata
            challenge["created_at"] = timestamp
            challenge["active"] = True  # Flag to enable/disable challenges

            # Use the existing ID from JSON as the document ID
            challenge_id = challenge.get("id")
            if not challenge_id:
                print(f"⚠️  Skipping challenge without ID: {challenge.get('title')}")
                continue

            # Remove 'id' from data (will be the document ID instead)
            challenge_data = {k: v for k, v in challenge.items() if k != 'id'}

            # Add to Firestore
            db.collection("challenges").document(challenge_id).set(challenge_data)
            print(f"✅ Added {frequency} challenge: {challenge_id} - {challenge.get('title')}")
            total_added += 1

    print()
    print(f"🎉 Migration complete! Added {total_added} challenges to Firestore.")
    print()
    print("Next steps:")
    print("1. Verify challenges in Firebase Console: https://console.firebase.google.com")
    print("2. Test the API endpoints:")
    print("   curl http://localhost:5000/challenges/daily")
    print("   curl http://localhost:5000/challenges/weekly")
    print("   curl http://localhost:5000/challenges/monthly")


if __name__ == "__main__":
    try:
        migrate_challenges()
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
