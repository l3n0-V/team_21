"""
Demo User Creation Script for SNOP
Creates a Firebase user with realistic sample data for video demonstrations.
"""

import firebase_admin
from firebase_admin import auth, firestore, credentials
from datetime import datetime, timedelta
import random
import os

# Initialize Firebase with service account
cred_path = os.path.join(os.path.dirname(__file__), 'firebase-auth.json')

try:
    firebase_admin.get_app()
except ValueError:
    cred = credentials.Certificate(cred_path)
    firebase_admin.initialize_app(cred)

db = firestore.client()

def create_demo_user():
    """Create demo user with email: demo@snop.no, password: Demo123!"""

    email = "demo@snop.no"
    password = "Demo123!"
    display_name = "Demo Bruker"

    try:
        # Try to create user
        user = auth.create_user(
            email=email,
            password=password,
            display_name=display_name
        )
        print(f"✓ Created Firebase Auth user: {email}")
        uid = user.uid
    except auth.EmailAlreadyExistsError:
        # User exists, get UID
        user = auth.get_user_by_email(email)
        uid = user.uid
        print(f"✓ User already exists: {email} (UID: {uid})")

    return uid, email, display_name

def populate_demo_data(uid):
    """Populate Firestore with realistic demo data"""

    user_ref = db.collection('users').document(uid)

    # Demo user stats - A2 level with moderate progress
    current_time = datetime.now()

    user_data = {
        'email': 'demo@snop.no',
        'display_name': 'Demo Bruker',
        'cefr_level': 'A2',
        'xp_total': 320,
        'xp_a1': 150,  # Completed A1
        'xp_a2': 170,  # In progress
        'streak_days': 6,
        'last_attempt_at': current_time,
        'created_at': current_time - timedelta(days=14),
        'badges': ['first_challenge', 'streak_3', 'rising_star', 'perfect_accent'],
        'bio': 'Lærer norsk for å snakke med mine norske venner! 🇳🇴',
        'photo_url': None,
        'preferences': {
            'notifications_enabled': True,
            'sound_enabled': True
        }
    }

    user_ref.set(user_data)
    print(f"✓ Created user profile with {user_data['xp_total']} XP at {user_data['cefr_level']} level")

    # Create realistic attempt history (10 attempts over past 7 days)
    attempts_data = [
        # Day 1 - 2 attempts
        {
            'challenge_id': 'a2_pronunciation_1',
            'challenge_type': 'pronunciation',
            'audio_url': 'demo_audio_1.wav',
            'result': {
                'xp_gained': 25,
                'feedback': 'Bra uttale! Stem-tempo er naturlig.',
                'pass': True,
                'similarity': 0.87
            },
            'created_at': current_time - timedelta(days=6, hours=10)
        },
        {
            'challenge_id': 'a2_listening_1',
            'challenge_type': 'listening',
            'result': {
                'xp_gained': 20,
                'feedback': 'Riktig svar!',
                'pass': True
            },
            'created_at': current_time - timedelta(days=6, hours=9)
        },

        # Day 2 - 1 attempt
        {
            'challenge_id': 'a2_irl_coffee',
            'challenge_type': 'irl',
            'image_url': 'demo_coffee.jpg',
            'result': {
                'xp_gained': 40,
                'feedback': 'Flott jobbet! Bildet bekreftet.',
                'pass': True,
                'verification_confidence': 0.92
            },
            'created_at': current_time - timedelta(days=5, hours=14)
        },

        # Day 3 - 2 attempts
        {
            'challenge_id': 'a2_fill_blank_1',
            'challenge_type': 'fill_blank',
            'result': {
                'xp_gained': 15,
                'feedback': 'Riktig!',
                'pass': True
            },
            'created_at': current_time - timedelta(days=4, hours=11)
        },
        {
            'challenge_id': 'a2_pronunciation_2',
            'challenge_type': 'pronunciation',
            'audio_url': 'demo_audio_2.wav',
            'result': {
                'xp_gained': 20,
                'feedback': 'God uttale, men prøv å uttale "skj" litt skarpere.',
                'pass': True,
                'similarity': 0.79
            },
            'created_at': current_time - timedelta(days=4, hours=10)
        },

        # Day 4 - 1 failed attempt + retry success
        {
            'challenge_id': 'a2_multiple_choice_1',
            'challenge_type': 'multiple_choice',
            'result': {
                'xp_gained': 0,
                'feedback': 'Feil svar. Prøv igjen!',
                'pass': False
            },
            'created_at': current_time - timedelta(days=3, hours=15)
        },
        {
            'challenge_id': 'a2_multiple_choice_1',
            'challenge_type': 'multiple_choice',
            'result': {
                'xp_gained': 15,
                'feedback': 'Riktig! Flott jobbet.',
                'pass': True
            },
            'created_at': current_time - timedelta(days=3, hours=14, minutes=30)
        },

        # Day 5 - 1 attempt
        {
            'challenge_id': 'a2_listening_2',
            'challenge_type': 'listening',
            'result': {
                'xp_gained': 25,
                'feedback': 'Perfekt! Du hørte alle detaljene.',
                'pass': True
            },
            'created_at': current_time - timedelta(days=2, hours=13)
        },

        # Day 6 - 2 attempts
        {
            'challenge_id': 'a2_pronunciation_3',
            'challenge_type': 'pronunciation',
            'audio_url': 'demo_audio_3.wav',
            'result': {
                'xp_gained': 30,
                'feedback': 'Utmerket uttale! Nesten perfekt.',
                'pass': True,
                'similarity': 0.91
            },
            'created_at': current_time - timedelta(days=1, hours=16)
        },
        {
            'challenge_id': 'a2_fill_blank_2',
            'challenge_type': 'fill_blank',
            'result': {
                'xp_gained': 20,
                'feedback': 'Helt riktig!',
                'pass': True
            },
            'created_at': current_time - timedelta(days=1, hours=15, minutes=30)
        },

        # Today - 1 attempt
        {
            'challenge_id': 'a2_irl_grocery',
            'challenge_type': 'irl',
            'image_url': 'demo_grocery.jpg',
            'result': {
                'xp_gained': 40,
                'feedback': 'Fantastisk! Bildet bekreftet.',
                'pass': True,
                'verification_confidence': 0.88
            },
            'created_at': current_time - timedelta(hours=2)
        }
    ]

    # Add attempts to Firestore
    attempts_ref = user_ref.collection('attempts')
    for i, attempt in enumerate(attempts_data):
        attempts_ref.add(attempt)

    print(f"✓ Added {len(attempts_data)} challenge attempts (spread over 7 days)")

    # Weekly verifications
    current_week = current_time.strftime("%Y-W%U")
    last_week = (current_time - timedelta(days=7)).strftime("%Y-W%U")

    weekly_ref = user_ref.collection('weekly_verifications')
    weekly_ref.document(last_week).set({
        'verified': True,
        'badge': 'weekly_warrior',
        'verified_at': current_time - timedelta(days=7),
        'week': last_week
    })

    weekly_ref.document(current_week).set({
        'verified': False,
        'verified_at': None,
        'week': current_week
    })

    print(f"✓ Added weekly verification (completed last week)")

    # CEFR progression history
    cefr_ref = user_ref.collection('cefr_progression')
    cefr_ref.add({
        'from_level': 'A1',
        'to_level': 'A2',
        'promoted_at': current_time - timedelta(days=7),
        'xp_at_promotion': 150
    })

    print(f"✓ Added CEFR progression history (A1→A2)")

def main():
    print("\n=== SNOP Demo User Creation ===\n")

    # Create user
    uid, email, display_name = create_demo_user()

    # Populate data
    populate_demo_data(uid)

    print("\n=== Demo User Ready! ===")
    print(f"\nLogin credentials:")
    print(f"  Email: {email}")
    print(f"  Password: Demo123!")
    print(f"\nUser stats:")
    print(f"  CEFR Level: A2")
    print(f"  Total XP: 320")
    print(f"  Current Streak: 6 days")
    print(f"  Badges: 4")
    print(f"  Attempts: 11 (over past 7 days)")
    print(f"\nYou can now log in with these credentials in the mobile app.")
    print()

if __name__ == "__main__":
    main()
