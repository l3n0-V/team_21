# migrate_to_cefr.py
"""
Migration script to update existing users and challenges to the new CEFR system.

This script:
1. Initializes CEFR roadmap configuration in Firestore
2. Updates existing user profiles with CEFR progression fields
3. Preserves XP and streak data
4. Clears old attempts (as per migration plan)
5. Optionally loads CEFR challenges from JSON

Usage:
    python migrate_to_cefr.py [--load-challenges cefr_challenges.json] [--dry-run]
"""
import argparse
import os
from datetime import datetime, timezone
import json

# Load environment variables BEFORE importing firebase_config
from dotenv import load_dotenv
load_dotenv()

# Now import Firebase modules (after .env is loaded)
from firebase_config import db
from services_cefr import initialize_user_cefr_progress, get_cefr_config, CEFR_LEVELS, DEFAULT_PROGRESSION
from services_daily_progress import clear_user_daily_progress


def initialize_cefr_config():
    """
    Initialize CEFR roadmap configuration in Firestore.
    """
    print("Initializing CEFR roadmap configuration...")

    config = {
        "levels": DEFAULT_PROGRESSION,
        "daily_config": {
            "irl_limit": 1,
            "listening_limit": 3,
            "fill_blank_limit": 3,
            "multiple_choice_limit": 3,
            "pronunciation_limit": -1  # unlimited
        },
        "xp_rewards": {
            "irl": 50,
            "listening": 10,
            "fill_blank": 10,
            "multiple_choice": 10,
            "pronunciation": 15
        },
        "updated_at": datetime.now(timezone.utc).isoformat()
    }

    db.collection("config").document("cefr_roadmap").set(config)
    print("✓ CEFR roadmap configuration initialized")

    return config


def migrate_user(uid, dry_run=False):
    """
    Migrate a single user to the CEFR system.

    Args:
        uid: str - Firebase user ID
        dry_run: bool - If True, only print what would be done

    Returns:
        dict - Migration result
    """
    user_ref = db.collection("users").document(uid)
    user_doc = user_ref.get()

    if not user_doc.exists:
        return {"uid": uid, "status": "skipped", "reason": "User not found"}

    user_data = user_doc.to_dict()

    # Collect preserved data
    xp_total = user_data.get("xp_total", 0)
    current_streak = user_data.get("current_streak", 0)
    longest_streak = user_data.get("longest_streak", 0)
    email = user_data.get("email", "unknown")

    print(f"\nMigrating user {uid} ({email}):")
    print(f"  - Current XP: {xp_total}")
    print(f"  - Current streak: {current_streak} days")
    print(f"  - Longest streak: {longest_streak} days")

    if dry_run:
        print("  [DRY RUN] Would initialize CEFR fields and clear attempts")
        return {"uid": uid, "status": "dry_run", "xp_total": xp_total}

    # Initialize CEFR progression fields
    initialize_user_cefr_progress(uid)
    print("  ✓ Initialized CEFR progression (starting at A1)")

    # Clear old attempts subcollection
    attempts_deleted = clear_old_attempts(uid)
    print(f"  ✓ Cleared {attempts_deleted} old attempts")

    # Clear daily progress (if any exists)
    progress_deleted = clear_user_daily_progress(uid)
    print(f"  ✓ Cleared {progress_deleted} daily progress records")

    return {
        "uid": uid,
        "status": "migrated",
        "xp_total": xp_total,
        "streak": current_streak,
        "attempts_deleted": attempts_deleted,
        "progress_deleted": progress_deleted
    }


def clear_old_attempts(uid):
    """
    Clear old attempts subcollection for a user.

    Args:
        uid: str - Firebase user ID

    Returns:
        int - Number of attempts deleted
    """
    attempts_ref = db.collection("users").document(uid).collection("attempts")
    docs = attempts_ref.stream()

    count = 0
    batch = db.batch()

    for doc in docs:
        batch.delete(doc.reference)
        count += 1

        # Commit in batches of 500 (Firestore limit)
        if count % 500 == 0:
            batch.commit()
            batch = db.batch()

    if count % 500 != 0:
        batch.commit()

    return count


def migrate_all_users(dry_run=False):
    """
    Migrate all users in the system.

    Args:
        dry_run: bool - If True, only print what would be done

    Returns:
        dict - Migration summary
    """
    print("\n" + "="*60)
    print("MIGRATING ALL USERS TO CEFR SYSTEM")
    print("="*60)

    users_ref = db.collection("users")
    users = users_ref.stream()

    results = {
        "total": 0,
        "migrated": 0,
        "skipped": 0,
        "errors": 0,
        "total_xp_preserved": 0,
        "total_attempts_deleted": 0
    }

    for user_doc in users:
        results["total"] += 1
        uid = user_doc.id

        try:
            result = migrate_user(uid, dry_run)

            if result["status"] == "migrated" or result["status"] == "dry_run":
                results["migrated"] += 1
                results["total_xp_preserved"] += result.get("xp_total", 0)
                results["total_attempts_deleted"] += result.get("attempts_deleted", 0)
            elif result["status"] == "skipped":
                results["skipped"] += 1

        except Exception as e:
            print(f"  ✗ Error migrating user {uid}: {e}")
            results["errors"] += 1

    return results


def load_challenges_from_json(json_file_path):
    """
    Load CEFR challenges from a JSON file into Firestore.

    Args:
        json_file_path: str - Path to JSON file with challenges

    Returns:
        int - Number of challenges loaded
    """
    print(f"\nLoading challenges from {json_file_path}...")

    with open(json_file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    # Check if data is array or has 'challenges' key
    if isinstance(data, list):
        challenges = data
    elif isinstance(data, dict) and 'challenges' in data:
        challenges = data['challenges']
    else:
        challenges = []

    count = 0
    for challenge in challenges:
        # Add created_at timestamp if not present
        if "created_at" not in challenge:
            challenge["created_at"] = datetime.now(timezone.utc).isoformat()

        # Add to Firestore
        db.collection("challenges").add(challenge)
        count += 1

        if count % 10 == 0:
            print(f"  Loaded {count} challenges...")

    print(f"✓ Loaded {count} challenges to Firestore")
    return count


def print_migration_summary(results):
    """
    Print migration summary report.
    """
    print("\n" + "="*60)
    print("MIGRATION SUMMARY")
    print("="*60)
    print(f"Total users processed: {results['total']}")
    print(f"Successfully migrated: {results['migrated']}")
    print(f"Skipped: {results['skipped']}")
    print(f"Errors: {results['errors']}")
    print(f"Total XP preserved: {results['total_xp_preserved']}")
    print(f"Total attempts deleted: {results['total_attempts_deleted']}")
    print("="*60)


def main():
    parser = argparse.ArgumentParser(
        description="Migrate SNOP users and challenges to CEFR system"
    )
    parser.add_argument(
        "--load-challenges",
        type=str,
        help="Path to JSON file with CEFR challenges to load"
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Preview migration without making changes"
    )
    parser.add_argument(
        "--skip-users",
        action="store_true",
        help="Skip user migration (only init config and load challenges)"
    )

    args = parser.parse_args()

    print("\n" + "="*60)
    print("SNOP CEFR MIGRATION SCRIPT")
    print("="*60)

    if args.dry_run:
        print("🔍 DRY RUN MODE - No changes will be made")
        print("="*60)

    # Step 1: Initialize CEFR configuration
    if not args.dry_run:
        initialize_cefr_config()
    else:
        print("[DRY RUN] Would initialize CEFR configuration")

    # Step 2: Load challenges if provided
    if args.load_challenges:
        if not args.dry_run:
            load_challenges_from_json(args.load_challenges)
        else:
            print(f"[DRY RUN] Would load challenges from {args.load_challenges}")

    # Step 3: Migrate users
    if not args.skip_users:
        results = migrate_all_users(dry_run=args.dry_run)
        print_migration_summary(results)
    else:
        print("\n⏭️  Skipping user migration (--skip-users flag)")

    print("\n✅ Migration complete!")

    if args.dry_run:
        print("\n💡 Run without --dry-run to apply changes")


if __name__ == "__main__":
    main()
