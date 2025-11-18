# services_ai_generation.py
"""
AI-powered challenge generation service using Ollama (self-hosted LLM).
Generates Norwegian language learning challenges with translations.
"""
import json
import ollama
from datetime import datetime, timezone
from services_challenges import add_challenge

# Topics for challenge generation
TOPICS = [
    "cafe", "restaurant", "shopping", "transportation", "social", "work",
    "school", "health", "weather", "hobbies", "travel", "family", "home"
]

# Age groups
AGE_GROUPS = ["all", "children", "teenagers", "adults"]

# Levels
LEVELS = {
    1: "beginner",
    2: "intermediate",
    3: "advanced"
}


def _get_example_challenge(difficulty, topic):
    """Get an example challenge for the AI to follow."""
    examples = {
        (1, "cafe"): '''{
  "title": "Order coffee",
  "title_no": "Bestille kaffe",
  "prompt": "I would like a coffee, please",
  "target": "Jeg vil gjerne ha en kaffe, takk"
}''',
        (2, "restaurant"): '''{
  "title": "Ask about menu items",
  "title_no": "Spørre om menyen",
  "prompt": "What do you recommend for dinner?",
  "target": "Hva anbefaler du til middag?"
}''',
        (3, "travel"): '''{
  "title": "Discuss travel plans",
  "title_no": "Diskutere reiseplaner",
  "prompt": "I'm planning to visit Bergen next summer because I've heard it's beautiful",
  "target": "Jeg planlegger å besøke Bergen neste sommer fordi jeg har hørt at det er vakkert"
}'''
    }

    # Return exact match or default to difficulty-based example
    return examples.get((difficulty, topic), examples.get((difficulty, "cafe"), examples[(1, "cafe")]))


def generate_pronunciation_challenge(difficulty=1, topic=None, frequency="daily"):
    """
    Generate a single pronunciation challenge using Ollama.

    Args:
        difficulty: int (1-3) - Challenge difficulty
        topic: str - Topic for the challenge (random if None)
        frequency: str - "daily", "weekly", or "monthly"

    Returns:
        dict - Generated challenge data
    """
    import random

    if topic is None:
        topic = random.choice(TOPICS)

    level = LEVELS.get(difficulty, "beginner")

    prompt = f"""Generate a Norwegian language pronunciation challenge in valid JSON format.

VISUAL HIERARCHY (for display):
1. Norwegian title (title_no) - Bold, primary color, most prominent
2. English title (title) - Smaller, lighter color, in parentheses (for context)
3. Target phrase - Biggest text (the exact Norwegian phrase they pronounce)

DIFFICULTY AFFECTS:
- Difficulty {difficulty}: {"1-3 word simple phrases" if difficulty == 1 else "4-6 word phrases with grammar" if difficulty == 2 else "7+ word complex phrases"}
- Word complexity: {"common everyday words" if difficulty == 1 else "mix of common and specific vocabulary" if difficulty == 2 else "advanced vocabulary and idioms"}
- Grammar: {"present tense, simple structures" if difficulty == 1 else "past/future tense, conjunctions" if difficulty == 2 else "complex grammar, subordinate clauses"}

Requirements:
- Type: pronunciation
- Topic: {topic}
- Frequency: {frequency}
- Create realistic, practical phrases Norwegians actually use
- Both languages ALWAYS included (English for context, Norwegian for pronunciation)
- target = The EXACT phrase they will pronounce (evaluated with Whisper ASR)
- Make it culturally relevant to Norway
- Use Norwegian Bokmål

IMPORTANT: Respond ONLY with valid JSON, no markdown formatting, no code blocks, no extra text.

Required JSON format:
{{
  "type": "pronunciation",
  "title": "Clear English description (what they're practicing)",
  "title_no": "Tydelig norsk beskrivelse (samme mening som engelsk)",
  "description": "English explanation of the situation/context",
  "description_no": "Norsk forklaring av situasjonen",
  "prompt": "English phrase (what it means in English)",
  "target": "Den nøyaktige norske setningen de skal uttale",
  "difficulty": {difficulty},
  "frequency": "{frequency}",
  "level": "{level}",
  "age_group": "all",
  "topic": "{topic}",
  "irl_bonus_available": true,
  "irl_bonus_xp": {10 if difficulty == 1 else 15 if difficulty == 2 else 20},
  "irl_prompt": "Forslag til praksis i virkeligheten (på norsk)"
}}

Example for difficulty {difficulty}, topic {topic}:
{_get_example_challenge(difficulty, topic)}

Generate the challenge now:"""

    try:
        # Call Ollama API
        response = ollama.chat(
            model='llama3.2',
            messages=[
                {
                    'role': 'system',
                    'content': 'You are a Norwegian language teaching expert. You create educational challenges for learners. Always respond with valid JSON only, no extra text or formatting.'
                },
                {
                    'role': 'user',
                    'content': prompt
                }
            ],
            options={
                'temperature': 0.8,  # Add creativity
            }
        )

        # Extract response content
        content = response['message']['content']

        # Remove markdown code blocks if present
        content = content.strip()
        if content.startswith('```json'):
            content = content[7:]
        if content.startswith('```'):
            content = content[3:]
        if content.endswith('```'):
            content = content[:-3]
        content = content.strip()

        # Clean up common JSON errors
        import re
        # Remove trailing commas before closing brackets/braces
        content = re.sub(r',(\s*[}\]])', r'\1', content)
        # Remove markdown bold markers that might appear
        content = content.replace('**', '')

        # Parse JSON
        challenge_data = json.loads(content)

        # Validate required fields
        required_fields = ['type', 'title', 'description', 'prompt', 'target', 'difficulty', 'frequency']
        for field in required_fields:
            if field not in challenge_data:
                raise ValueError(f"Missing required field: {field}")

        return challenge_data

    except json.JSONDecodeError as e:
        print(f"Failed to parse JSON response: {e}")
        print(f"Raw response: {content}")
        raise ValueError(f"Invalid JSON from AI: {e}")
    except Exception as e:
        print(f"Error generating challenge: {e}")
        raise


def generate_listening_challenge(difficulty=1, topic=None, frequency="daily"):
    """
    Generate a single listening challenge using Ollama.

    Args:
        difficulty: int (1-3) - Challenge difficulty
        topic: str - Topic for the challenge (random if None)
        frequency: str - "daily", "weekly", or "monthly"

    Returns:
        dict - Generated challenge data
    """
    import random

    if topic is None:
        topic = random.choice(TOPICS)

    level = LEVELS.get(difficulty, "beginner")

    prompt = f"""Generate a Norwegian listening comprehension challenge in valid JSON format.

VISUAL HIERARCHY (for display):
1. Norwegian title (title_no) - Bold, primary color, most prominent
2. English title (title) - Smaller, lighter color, in parentheses (for context)
3. Audio text (audio_text) - What they hear in Norwegian
4. Options - 4 English translations to choose from

DIFFICULTY AFFECTS:
- Difficulty {difficulty}: {"Short 1-3 word phrases" if difficulty == 1 else "4-6 word sentences" if difficulty == 2 else "7+ word complex sentences"}
- Vocabulary: {"common everyday words" if difficulty == 1 else "mix of common and specific terms" if difficulty == 2 else "advanced vocabulary"}
- Similar-sounding wrong options: {"very different meanings" if difficulty == 1 else "somewhat related meanings" if difficulty == 2 else "subtle differences requiring careful listening"}

Requirements:
- Type: listening
- Topic: {topic}
- Frequency: {frequency}
- audio_text = Norwegian phrase (what they hear - will use text-to-speech)
- Create 4 English translation options (only 1 correct)
- Make wrong options plausible but distinguishable
- Both languages ALWAYS included
- Culturally relevant to Norway
- Use Norwegian Bokmål

IMPORTANT: Respond ONLY with valid JSON, no markdown formatting, no code blocks, no extra text.

Required JSON format:
{{
  "type": "listening",
  "title": "English description of what they're listening for",
  "title_no": "Norsk beskrivelse (samme mening)",
  "description": "Listen and select the correct translation",
  "description_no": "Lytt og velg riktig oversettelse",
  "audio_text": "Norsk setning som blir uttalt",
  "options": ["Correct English translation", "Plausible wrong answer 1", "Plausible wrong answer 2", "Plausible wrong answer 3"],
  "correct_answer": 0,
  "difficulty": {difficulty},
  "frequency": "{frequency}",
  "level": "{level}",
  "age_group": "all",
  "topic": "{topic}"
}}

IMPORTANT: Shuffle the options array so correct answer is not always at index 0, and update correct_answer index accordingly.

Generate the challenge now:"""

    try:
        # Call Ollama API
        response = ollama.chat(
            model='llama3.2',
            messages=[
                {
                    'role': 'system',
                    'content': 'You are a Norwegian language teaching expert. You create listening comprehension challenges. Always respond with valid JSON only, no extra text or formatting.'
                },
                {
                    'role': 'user',
                    'content': prompt
                }
            ],
            options={
                'temperature': 0.8,
            }
        )

        # Extract and clean response
        content = response['message']['content'].strip()
        if content.startswith('```json'):
            content = content[7:]
        if content.startswith('```'):
            content = content[3:]
        if content.endswith('```'):
            content = content[:-3]
        content = content.strip()

        # Clean up common JSON errors
        import re
        # Remove trailing commas before closing brackets/braces
        content = re.sub(r',(\s*[}\]])', r'\1', content)
        # Remove markdown bold markers that might appear
        content = content.replace('**', '')

        # Parse JSON
        challenge_data = json.loads(content)

        # Validate required fields
        required_fields = ['type', 'title', 'description', 'audio_text', 'options', 'correct_answer']
        for field in required_fields:
            if field not in challenge_data:
                raise ValueError(f"Missing required field: {field}")

        # Validate options
        if len(challenge_data['options']) != 4:
            raise ValueError("Must have exactly 4 options")

        if not (0 <= challenge_data['correct_answer'] <= 3):
            raise ValueError("correct_answer must be 0-3")

        return challenge_data

    except json.JSONDecodeError as e:
        print(f"Failed to parse JSON response: {e}")
        print(f"Raw response: {content}")
        raise ValueError(f"Invalid JSON from AI: {e}")
    except Exception as e:
        print(f"Error generating challenge: {e}")
        raise


def generate_challenges_batch(
    frequency="daily",
    count=5,
    difficulty_mix=None,
    topic_mix=None,
    challenge_types=None
):
    """
    Generate a batch of challenges.

    Args:
        frequency: str - "daily", "weekly", or "monthly"
        count: int - Number of challenges to generate
        difficulty_mix: dict - e.g., {1: 3, 2: 1, 3: 1} means 3 easy, 1 medium, 1 hard
        topic_mix: list - List of topics to use (random if None)
        challenge_types: list - ["pronunciation", "listening"] (both if None)

    Returns:
        list - List of generated challenge dicts
    """
    import random

    # Default difficulty distribution
    if difficulty_mix is None:
        if frequency == "daily":
            difficulty_mix = {1: 3, 2: 1, 3: 1}  # Mostly easy
        elif frequency == "weekly":
            difficulty_mix = {1: 2, 2: 2, 3: 1}  # Balanced
        else:  # monthly
            difficulty_mix = {1: 1, 2: 2, 3: 2}  # Mostly hard

    # Default challenge types
    if challenge_types is None:
        challenge_types = ["pronunciation", "listening"]

    # Build list of difficulties to generate
    difficulties = []
    for diff, num in difficulty_mix.items():
        difficulties.extend([diff] * num)

    # Pad or trim to match count
    while len(difficulties) < count:
        difficulties.append(random.choice(list(difficulty_mix.keys())))
    difficulties = difficulties[:count]

    # Generate challenges
    challenges = []
    for i, difficulty in enumerate(difficulties):
        challenge_type = random.choice(challenge_types)
        topic = random.choice(topic_mix) if topic_mix else None

        print(f"Generating challenge {i+1}/{count}: {challenge_type}, difficulty {difficulty}, topic {topic}...")

        try:
            if challenge_type == "pronunciation":
                challenge = generate_pronunciation_challenge(difficulty, topic, frequency)
            else:
                challenge = generate_listening_challenge(difficulty, topic, frequency)

            challenges.append(challenge)
            print(f"  ✓ Generated: {challenge.get('title', 'Unknown')}")

        except Exception as e:
            print(f"  ✗ Failed to generate challenge {i+1}: {e}")
            continue

    return challenges


def save_challenges_to_firestore(challenges):
    """
    Save generated challenges to Firestore.

    Args:
        challenges: list - List of challenge dicts

    Returns:
        list - List of document IDs of saved challenges
    """
    saved_ids = []

    for challenge in challenges:
        try:
            doc_id = add_challenge(challenge)
            saved_ids.append(doc_id)
            print(f"  ✓ Saved to Firestore: {challenge['title']} (ID: {doc_id})")
        except Exception as e:
            print(f"  ✗ Failed to save challenge '{challenge.get('title', 'Unknown')}': {e}")
            continue

    return saved_ids


def generate_and_save_challenges(
    frequency="daily",
    count=5,
    difficulty_mix=None,
    topic_mix=None,
    save_to_db=True
):
    """
    Generate challenges and optionally save them to Firestore.

    Args:
        frequency: str - "daily", "weekly", or "monthly"
        count: int - Number of challenges to generate
        difficulty_mix: dict - Distribution of difficulties
        topic_mix: list - Topics to focus on
        save_to_db: bool - Whether to save to Firestore

    Returns:
        dict with keys:
            - challenges: list of generated challenges
            - saved_ids: list of Firestore doc IDs (if save_to_db=True)
            - success_count: int
            - failure_count: int
    """
    print(f"\n{'='*60}")
    print(f"AI Challenge Generation Started")
    print(f"{'='*60}")
    print(f"Frequency: {frequency}")
    print(f"Count: {count}")
    print(f"Difficulty mix: {difficulty_mix}")
    print(f"Topics: {topic_mix or 'Random'}")
    print(f"{'='*60}\n")

    # Generate challenges
    challenges = generate_challenges_batch(
        frequency=frequency,
        count=count,
        difficulty_mix=difficulty_mix,
        topic_mix=topic_mix
    )

    success_count = len(challenges)
    failure_count = count - success_count

    saved_ids = []
    if save_to_db and challenges:
        print(f"\nSaving {len(challenges)} challenges to Firestore...")
        saved_ids = save_challenges_to_firestore(challenges)

    print(f"\n{'='*60}")
    print(f"Generation Complete")
    print(f"{'='*60}")
    print(f"✓ Successfully generated: {success_count}/{count}")
    print(f"✗ Failed: {failure_count}")
    if save_to_db:
        print(f"💾 Saved to Firestore: {len(saved_ids)}")
    print(f"{'='*60}\n")

    return {
        "challenges": challenges,
        "saved_ids": saved_ids,
        "success_count": success_count,
        "failure_count": failure_count
    }
