"""
Seed Challenge Pool Script

Populates the challenge pool with hand-crafted seed challenges for Norwegian learning.
Covers A1 and A2 CEFR levels with 4 challenge types each.

Run: python seed_challenge_pool.py

=============================================================================
CHALLENGE STRUCTURE GUIDE
=============================================================================

Each challenge type has specific fields:

PRONUNCIATION:
- description: "Read the Norwegian phrase aloud clearly"
- No hints needed (target phrase is shown)

LISTENING:
- description: "Listen to the Norwegian audio and select the correct English translation"
- No hints needed (audio provides context)

FILL_BLANK:
- description: "Complete the Norwegian sentence by filling in the missing word"
- hint: Grammar rules or word type hints (NOT the answer!)

MULTIPLE_CHOICE:
- description: "Select the correct Norwegian translation" or similar
- hint: Context clues or grammar rules (NOT the answer!)

=============================================================================
"""

import hashlib
import logging
from dotenv import load_dotenv

# Load environment variables before importing firebase_config
load_dotenv()

from firebase_config import db
from services_challenge_pool import add_to_pool

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

COLLECTION_NAME = "challenge_pool"

# =============================================================================
# A1 LEVEL CHALLENGES - Beginner
# =============================================================================

# -----------------------------------------------------------------------------
# A1 Pronunciation Challenges
# Focus: Basic greetings, introductions, and common phrases
# -----------------------------------------------------------------------------
A1_PRONUNCIATION = [
    {
        "type": "pronunciation",
        "cefr_level": "A1",
        "difficulty": 1,
        "title": "Greeting someone",
        "title_no": "Hilse pa noen",
        "description": "Read the Norwegian phrase aloud clearly",
        "prompt": "Say hello and ask how someone is doing",
        "target": "Hei, hvordan har du det?",
        "hint": "Focus on the 'hv' sound at the start of question words",
        "xp_reward": 10
    },
    {
        "type": "pronunciation",
        "cefr_level": "A1",
        "difficulty": 1,
        "title": "Introducing yourself",
        "title_no": "Presentere deg selv",
        "description": "Read the Norwegian phrase aloud clearly",
        "prompt": "Say 'My name is...' in Norwegian",
        "target": "Jeg heter Anna.",
        "hint": "The 'j' in Norwegian sounds like English 'y'",
        "xp_reward": 10
    },
    {
        "type": "pronunciation",
        "cefr_level": "A1",
        "difficulty": 1,
        "title": "Saying goodbye",
        "title_no": "Si ha det",
        "description": "Read the Norwegian phrase aloud clearly",
        "prompt": "Say goodbye and see you later",
        "target": "Ha det bra, vi ses!",
        "hint": "This is an informal farewell used with friends",
        "xp_reward": 10
    },
    {
        "type": "pronunciation",
        "cefr_level": "A1",
        "difficulty": 1,
        "title": "Ordering coffee",
        "title_no": "Bestille kaffe",
        "description": "Read the Norwegian phrase aloud clearly",
        "prompt": "Order a coffee with milk",
        "target": "Kan jeg fa en kaffe med melk?",
        "hint": "Polite requests often start with 'Kan jeg fa...'",
        "xp_reward": 10
    },
    {
        "type": "pronunciation",
        "cefr_level": "A1",
        "difficulty": 1,
        "title": "Saying thank you",
        "title_no": "Si takk",
        "description": "Read the Norwegian phrase aloud clearly",
        "prompt": "Say thank you very much",
        "target": "Tusen takk!",
        "hint": "This is a stronger form of gratitude than just 'takk'",
        "xp_reward": 10
    }
]

# -----------------------------------------------------------------------------
# A1 Listening Challenges
# Focus: Numbers, days, colors, family, basic sentences
# -----------------------------------------------------------------------------
A1_LISTENING = [
    {
        "type": "listening",
        "cefr_level": "A1",
        "difficulty": 1,
        "title": "Numbers 1-10",
        "title_no": "Tall 1-10",
        "description": "Listen to the Norwegian audio and select the correct English translation",
        "audio_text": "Jeg har tre epler.",
        "options": ["I have three apples", "I have two apples", "I have four apples", "I have five apples"],
        "correct_answer": 0,
        "hint": "Listen carefully for the number word in the sentence",
        "xp_reward": 10
    },
    {
        "type": "listening",
        "cefr_level": "A1",
        "difficulty": 1,
        "title": "Days of the week",
        "title_no": "Ukedager",
        "description": "Listen to the Norwegian audio and select the correct English translation",
        "audio_text": "I dag er det mandag.",
        "options": ["Today is Monday", "Today is Tuesday", "Today is Wednesday", "Today is Sunday"],
        "correct_answer": 0,
        "hint": "Norwegian days end in '-dag' just like English days end in '-day'",
        "xp_reward": 10
    },
    {
        "type": "listening",
        "cefr_level": "A1",
        "difficulty": 1,
        "title": "Colors",
        "title_no": "Farger",
        "description": "Listen to the Norwegian audio and select the correct English translation",
        "audio_text": "Bilen er rod.",
        "options": ["The car is red", "The car is blue", "The car is green", "The car is black"],
        "correct_answer": 0,
        "hint": "Focus on the color adjective at the end of the sentence",
        "xp_reward": 10
    },
    {
        "type": "listening",
        "cefr_level": "A1",
        "difficulty": 1,
        "title": "Family members",
        "title_no": "Familiemedlemmer",
        "description": "Listen to the Norwegian audio and select the correct English translation",
        "audio_text": "Dette er min mor.",
        "options": ["This is my mother", "This is my father", "This is my sister", "This is my brother"],
        "correct_answer": 0,
        "hint": "Listen for the family relationship word after 'min'",
        "xp_reward": 10
    },
    {
        "type": "listening",
        "cefr_level": "A1",
        "difficulty": 1,
        "title": "Where are you from?",
        "title_no": "Hvor er du fra?",
        "description": "Listen to the Norwegian audio and select the correct English translation",
        "audio_text": "Jeg kommer fra Norge.",
        "options": ["I come from Norway", "I come from Sweden", "I come from Denmark", "I come from Finland"],
        "correct_answer": 0,
        "hint": "Listen for the country name at the end of the sentence",
        "xp_reward": 10
    }
]

# -----------------------------------------------------------------------------
# A1 Fill in the Blank Challenges
# Focus: Articles, pronouns, basic verb forms, possessives
# -----------------------------------------------------------------------------
A1_FILL_BLANK = [
    {
        "type": "fill_blank",
        "cefr_level": "A1",
        "difficulty": 1,
        "title": "Indefinite articles",
        "title_no": "Ubestemte artikler",
        "description": "Complete the Norwegian sentence by filling in the missing word",
        "prompt": "Fill in the indefinite article (a/an)",
        "sentence": "Jeg vil ha ___ kaffe.",
        "missing_word": "en",
        "hint": "Masculine/feminine nouns use one article, neuter nouns use another",
        "xp_reward": 10
    },
    {
        "type": "fill_blank",
        "cefr_level": "A1",
        "difficulty": 1,
        "title": "Personal pronouns",
        "title_no": "Personlige pronomen",
        "description": "Complete the Norwegian sentence by filling in the missing word",
        "prompt": "Fill in: 'I' (first person pronoun)",
        "sentence": "___ er fra Norge.",
        "missing_word": "Jeg",
        "hint": "This is the first person singular subject pronoun",
        "xp_reward": 10
    },
    {
        "type": "fill_blank",
        "cefr_level": "A1",
        "difficulty": 1,
        "title": "To be verb",
        "title_no": "A vaere",
        "description": "Complete the Norwegian sentence by filling in the missing word",
        "prompt": "Fill in: 'is' (verb to be)",
        "sentence": "Hun ___ glad.",
        "missing_word": "er",
        "hint": "This is the present tense form of the verb 'to be' - same for all persons",
        "xp_reward": 10
    },
    {
        "type": "fill_blank",
        "cefr_level": "A1",
        "difficulty": 1,
        "title": "Possessive pronouns",
        "title_no": "Eiendomspronomen",
        "description": "Complete the Norwegian sentence by filling in the missing word",
        "prompt": "Fill in: 'my' (possessive)",
        "sentence": "Dette er ___ bok.",
        "missing_word": "min",
        "hint": "First person possessive - must agree with the noun's gender",
        "xp_reward": 10
    },
    {
        "type": "fill_blank",
        "cefr_level": "A1",
        "difficulty": 1,
        "title": "Definite form",
        "title_no": "Bestemt form",
        "description": "Complete the Norwegian sentence by filling in the missing word",
        "prompt": "Fill in: 'the cat' (definite form)",
        "sentence": "Jeg liker ___.",
        "missing_word": "katten",
        "hint": "Norwegian adds a suffix to make nouns definite instead of using 'the'",
        "xp_reward": 10
    }
]

# -----------------------------------------------------------------------------
# A1 Multiple Choice Challenges
# Focus: Common phrases, question words, numbers, colors, days
# -----------------------------------------------------------------------------
A1_MULTIPLE_CHOICE = [
    {
        "type": "multiple_choice",
        "cefr_level": "A1",
        "difficulty": 1,
        "title": "Common phrases - Thank you",
        "title_no": "Vanlige fraser",
        "description": "Select the correct Norwegian translation for the English phrase",
        "prompt": "How do you say 'Thank you' in Norwegian?",
        "options": ["Takk", "Hei", "Ha det", "Unnskyld"],
        "correct_answer": 0,
        "hint": "This is one of the most basic courtesy words",
        "xp_reward": 10
    },
    {
        "type": "multiple_choice",
        "cefr_level": "A1",
        "difficulty": 1,
        "title": "Question words - What",
        "title_no": "Sporreord",
        "description": "Select the correct Norwegian question word",
        "prompt": "Which word means 'What'?",
        "options": ["Hva", "Hvor", "Hvem", "Hvorfor"],
        "correct_answer": 0,
        "hint": "All Norwegian question words start with 'hv-' - focus on the ending",
        "xp_reward": 10
    },
    {
        "type": "multiple_choice",
        "cefr_level": "A1",
        "difficulty": 1,
        "title": "Numbers - Seven",
        "title_no": "Tall",
        "description": "Select the correct English translation for the Norwegian number",
        "prompt": "What is 'syv' in English?",
        "options": ["Seven", "Six", "Eight", "Nine"],
        "correct_answer": 0,
        "hint": "This number is between 6 and 8",
        "xp_reward": 10
    },
    {
        "type": "multiple_choice",
        "cefr_level": "A1",
        "difficulty": 1,
        "title": "Colors - Blue",
        "title_no": "Farger",
        "description": "Select the correct English translation for the Norwegian color",
        "prompt": "What color is 'bla'?",
        "options": ["Blue", "Red", "Green", "Yellow"],
        "correct_answer": 0,
        "hint": "Think of the color of the sky or ocean",
        "xp_reward": 10
    },
    {
        "type": "multiple_choice",
        "cefr_level": "A1",
        "difficulty": 1,
        "title": "Days - Friday",
        "title_no": "Dager",
        "description": "Select the correct English translation for the Norwegian day",
        "prompt": "What is 'fredag' in English?",
        "options": ["Friday", "Thursday", "Saturday", "Wednesday"],
        "correct_answer": 0,
        "hint": "Named after the Norse goddess Freya",
        "xp_reward": 10
    }
]

# =============================================================================
# A2 LEVEL CHALLENGES - Elementary
# =============================================================================

# -----------------------------------------------------------------------------
# A2 Pronunciation Challenges
# Focus: Making plans, weather, restaurant, directions, hobbies
# -----------------------------------------------------------------------------
A2_PRONUNCIATION = [
    {
        "type": "pronunciation",
        "cefr_level": "A2",
        "difficulty": 2,
        "title": "Making plans",
        "title_no": "Lage planer",
        "description": "Read the Norwegian phrase aloud clearly",
        "prompt": "Ask if someone wants to go to the cinema",
        "target": "Har du lyst til a ga pa kino i kveld?",
        "hint": "'Har du lyst til' is a common way to invite someone to do something",
        "xp_reward": 15
    },
    {
        "type": "pronunciation",
        "cefr_level": "A2",
        "difficulty": 2,
        "title": "Describing weather",
        "title_no": "Beskrive vaer",
        "description": "Read the Norwegian phrase aloud clearly",
        "prompt": "Say it's raining and cold today",
        "target": "Det regner og er kaldt i dag.",
        "hint": "Weather expressions often start with 'Det' as the subject",
        "xp_reward": 15
    },
    {
        "type": "pronunciation",
        "cefr_level": "A2",
        "difficulty": 2,
        "title": "At the restaurant",
        "title_no": "Pa restauranten",
        "description": "Read the Norwegian phrase aloud clearly",
        "prompt": "Order fish and potatoes",
        "target": "Jeg vil gjerne ha fisk med poteter.",
        "hint": "'Jeg vil gjerne ha' is a polite way to order food",
        "xp_reward": 15
    },
    {
        "type": "pronunciation",
        "cefr_level": "A2",
        "difficulty": 2,
        "title": "Asking for directions",
        "title_no": "Sporre om veien",
        "description": "Read the Norwegian phrase aloud clearly",
        "prompt": "Ask where the train station is",
        "target": "Unnskyld, hvor er togstasjonen?",
        "hint": "Start with 'Unnskyld' to be polite when approaching strangers",
        "xp_reward": 15
    },
    {
        "type": "pronunciation",
        "cefr_level": "A2",
        "difficulty": 2,
        "title": "Talking about hobbies",
        "title_no": "Snakke om hobbyer",
        "description": "Read the Norwegian phrase aloud clearly",
        "prompt": "Say you like to read books",
        "target": "Jeg liker a lese boker.",
        "hint": "Use 'a + infinitive' after 'liker' to express what you enjoy doing",
        "xp_reward": 15
    }
]

# -----------------------------------------------------------------------------
# A2 Listening Challenges
# Focus: Time, weather, shopping, daily routines, transportation
# -----------------------------------------------------------------------------
A2_LISTENING = [
    {
        "type": "listening",
        "cefr_level": "A2",
        "difficulty": 2,
        "title": "Time expressions",
        "title_no": "Tidsuttrykk",
        "description": "Listen to the Norwegian audio and select the correct English translation",
        "audio_text": "Mote starter klokken halv ti.",
        "options": ["The meeting starts at half past nine", "The meeting starts at ten", "The meeting starts at nine", "The meeting starts at half past ten"],
        "correct_answer": 0,
        "hint": "Norwegian tells time differently - 'halv ti' means half TO ten, not half past",
        "xp_reward": 15
    },
    {
        "type": "listening",
        "cefr_level": "A2",
        "difficulty": 2,
        "title": "Weather forecast",
        "title_no": "Vaermelding",
        "description": "Listen to the Norwegian audio and select the correct English translation",
        "audio_text": "I morgen blir det sol og varmt.",
        "options": ["Tomorrow will be sunny and warm", "Tomorrow will be cloudy", "Tomorrow will rain", "Tomorrow will be cold"],
        "correct_answer": 0,
        "hint": "Listen for weather adjectives and 'i morgen' which means tomorrow",
        "xp_reward": 15
    },
    {
        "type": "listening",
        "cefr_level": "A2",
        "difficulty": 2,
        "title": "Shopping",
        "title_no": "Handle",
        "description": "Listen to the Norwegian audio and select the correct English translation",
        "audio_text": "Det koster hundre og femti kroner.",
        "options": ["It costs 150 kroner", "It costs 100 kroner", "It costs 50 kroner", "It costs 200 kroner"],
        "correct_answer": 0,
        "hint": "Listen for 'og' (and) which connects compound numbers",
        "xp_reward": 15
    },
    {
        "type": "listening",
        "cefr_level": "A2",
        "difficulty": 2,
        "title": "Daily routines",
        "title_no": "Daglige rutiner",
        "description": "Listen to the Norwegian audio and select the correct English translation",
        "audio_text": "Jeg star opp klokken sju hver dag.",
        "options": ["I get up at seven every day", "I go to bed at seven", "I eat at seven", "I work at seven"],
        "correct_answer": 0,
        "hint": "Focus on the phrasal verb that describes the morning action",
        "xp_reward": 15
    },
    {
        "type": "listening",
        "cefr_level": "A2",
        "difficulty": 2,
        "title": "Transportation",
        "title_no": "Transport",
        "description": "Listen to the Norwegian audio and select the correct English translation",
        "audio_text": "Jeg tar bussen til jobb.",
        "options": ["I take the bus to work", "I drive to work", "I walk to work", "I cycle to work"],
        "correct_answer": 0,
        "hint": "Listen for the mode of transport - it appears with a definite ending",
        "xp_reward": 15
    }
]

# -----------------------------------------------------------------------------
# A2 Fill in the Blank Challenges
# Focus: Past tense, modal verbs, prepositions, adjectives, reflexives
# -----------------------------------------------------------------------------
A2_FILL_BLANK = [
    {
        "type": "fill_blank",
        "cefr_level": "A2",
        "difficulty": 2,
        "title": "Past tense",
        "title_no": "Fortid",
        "description": "Complete the Norwegian sentence by filling in the missing word",
        "prompt": "Fill in: 'went' (past tense of to go)",
        "sentence": "I gar ___ jeg pa kino.",
        "missing_word": "gikk",
        "hint": "This is an irregular past tense verb - one of the most common motion verbs",
        "xp_reward": 15
    },
    {
        "type": "fill_blank",
        "cefr_level": "A2",
        "difficulty": 2,
        "title": "Modal verbs",
        "title_no": "Modale verb",
        "description": "Complete the Norwegian sentence by filling in the missing word",
        "prompt": "Fill in: 'can' (modal verb for ability)",
        "sentence": "Jeg ___ snakke norsk.",
        "missing_word": "kan",
        "hint": "This modal verb expresses ability or possibility",
        "xp_reward": 15
    },
    {
        "type": "fill_blank",
        "cefr_level": "A2",
        "difficulty": 2,
        "title": "Prepositions",
        "title_no": "Preposisjoner",
        "description": "Complete the Norwegian sentence by filling in the missing word",
        "prompt": "Fill in: 'on' (preposition for surface)",
        "sentence": "Boken ligger ___ bordet.",
        "missing_word": "pa",
        "hint": "This preposition indicates position on a surface",
        "xp_reward": 15
    },
    {
        "type": "fill_blank",
        "cefr_level": "A2",
        "difficulty": 2,
        "title": "Adjective agreement",
        "title_no": "Adjektivboyning",
        "description": "Complete the Norwegian sentence by filling in the missing word",
        "prompt": "Fill in: 'big' (neuter adjective form)",
        "sentence": "Huset er ___.",
        "missing_word": "stort",
        "hint": "Adjectives must match noun gender - 'huset' is neuter (et-word)",
        "xp_reward": 15
    },
    {
        "type": "fill_blank",
        "cefr_level": "A2",
        "difficulty": 2,
        "title": "Reflexive pronouns",
        "title_no": "Refleksive pronomen",
        "description": "Complete the Norwegian sentence by filling in the missing word",
        "prompt": "Fill in: 'himself' (reflexive pronoun)",
        "sentence": "Han vasker ___.",
        "missing_word": "seg",
        "hint": "Third person reflexive - used when the subject acts on itself",
        "xp_reward": 15
    }
]

# -----------------------------------------------------------------------------
# A2 Multiple Choice Challenges
# Focus: Seasons, comparatives, food, professions, time of day
# -----------------------------------------------------------------------------
A2_MULTIPLE_CHOICE = [
    {
        "type": "multiple_choice",
        "cefr_level": "A2",
        "difficulty": 2,
        "title": "Seasons",
        "title_no": "Arstider",
        "description": "Select the correct answer about Norwegian culture",
        "prompt": "When do we celebrate Christmas in Norway?",
        "options": ["Winter (vinter)", "Summer (sommer)", "Spring (var)", "Autumn (host)"],
        "correct_answer": 0,
        "hint": "Christmas is celebrated in December",
        "xp_reward": 15
    },
    {
        "type": "multiple_choice",
        "cefr_level": "A2",
        "difficulty": 2,
        "title": "Comparatives",
        "title_no": "Komparativ",
        "description": "Select the correct Norwegian comparative form",
        "prompt": "How do you say 'bigger' in Norwegian?",
        "options": ["Storre", "Stor", "Storst", "Storest"],
        "correct_answer": 0,
        "hint": "Comparatives typically add '-ere' but this adjective is irregular",
        "xp_reward": 15
    },
    {
        "type": "multiple_choice",
        "cefr_level": "A2",
        "difficulty": 2,
        "title": "Food vocabulary",
        "title_no": "Matvokabular",
        "description": "Select the correct English translation for the Norwegian food word",
        "prompt": "What is 'brod' in English?",
        "options": ["Bread", "Butter", "Cheese", "Milk"],
        "correct_answer": 0,
        "hint": "This is a staple food made from flour and baked",
        "xp_reward": 15
    },
    {
        "type": "multiple_choice",
        "cefr_level": "A2",
        "difficulty": 2,
        "title": "Professions",
        "title_no": "Yrker",
        "description": "Select what someone with this profession does",
        "prompt": "What does a 'laerer' do?",
        "options": ["Teaches", "Cooks", "Drives", "Builds"],
        "correct_answer": 0,
        "hint": "This profession works in schools with students",
        "xp_reward": 15
    },
    {
        "type": "multiple_choice",
        "cefr_level": "A2",
        "difficulty": 2,
        "title": "Time of day",
        "title_no": "Tid pa dagen",
        "description": "Select the correct English translation for the Norwegian time expression",
        "prompt": "What time of day is 'ettermiddag'?",
        "options": ["Afternoon", "Morning", "Evening", "Night"],
        "correct_answer": 0,
        "hint": "'Etter' means 'after' and 'middag' means 'midday/lunch'",
        "xp_reward": 15
    }
]

# Combine all challenges
SEED_CHALLENGES = (
    A1_PRONUNCIATION + A1_LISTENING + A1_FILL_BLANK + A1_MULTIPLE_CHOICE +
    A2_PRONUNCIATION + A2_LISTENING + A2_FILL_BLANK + A2_MULTIPLE_CHOICE
)


def generate_challenge_hash(challenge):
    """Generate a hash for a challenge based on its content."""
    # Create a unique identifier based on key fields
    key_fields = [
        challenge.get("type", ""),
        challenge.get("cefr_level", ""),
        challenge.get("title", ""),
        challenge.get("target", challenge.get("sentence", challenge.get("prompt", "")))
    ]
    content = "|".join(str(f) for f in key_fields)
    return hashlib.md5(content.encode()).hexdigest()


def get_existing_hashes():
    """Get hashes of existing challenges in the pool."""
    try:
        docs = db.collection(COLLECTION_NAME).stream()
        existing_hashes = set()

        for doc in docs:
            data = doc.to_dict()
            # Generate hash for existing challenge
            challenge_hash = generate_challenge_hash(data)
            existing_hashes.add(challenge_hash)

            # Also check by title as backup
            title = data.get("title", "")
            if title:
                existing_hashes.add(title.lower())

        return existing_hashes
    except Exception as e:
        logger.error(f"Error getting existing hashes: {e}")
        return set()


def seed_pool():
    """
    Seed the challenge pool with initial challenges.
    Idempotent - won't add duplicates.
    """
    logger.info("Starting challenge pool seeding...")

    # Get existing challenge identifiers
    existing_hashes = get_existing_hashes()
    logger.info(f"Found {len(existing_hashes)} existing challenge identifiers")

    # Filter out challenges that already exist
    new_challenges = []
    skipped = 0

    for challenge in SEED_CHALLENGES:
        challenge_hash = generate_challenge_hash(challenge)
        title_lower = challenge.get("title", "").lower()

        if challenge_hash in existing_hashes or title_lower in existing_hashes:
            skipped += 1
            continue

        new_challenges.append(challenge)

    if not new_challenges:
        logger.info("No new challenges to add - pool already seeded")
        print(f"Pool already contains all {len(SEED_CHALLENGES)} seed challenges")
        return []

    logger.info(f"Adding {len(new_challenges)} new challenges (skipping {skipped} duplicates)")

    # Add new challenges to pool
    result = add_to_pool(new_challenges)

    # Print summary
    print(f"\nChallenge Pool Seeding Complete")
    print(f"================================")
    print(f"Total seed challenges: {len(SEED_CHALLENGES)}")
    print(f"Already existed: {skipped}")
    print(f"Newly added: {len(result)}")
    print(f"\nBreakdown by level and type:")

    # Count by level and type
    counts = {}
    for challenge in new_challenges:
        level = challenge.get("cefr_level", "Unknown")
        ctype = challenge.get("type", "Unknown")
        key = f"{level} - {ctype}"
        counts[key] = counts.get(key, 0) + 1

    for key in sorted(counts.keys()):
        print(f"  {key}: {counts[key]}")

    return result


if __name__ == "__main__":
    seed_pool()
