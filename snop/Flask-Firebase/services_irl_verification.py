# services_irl_verification.py
"""
IRL Challenge verification service using local AI models.
- CLIP for photo verification
- Llama 3.2 (via Ollama) for Norwegian text analysis
"""
import json
import os
import logging
from PIL import Image

logger = logging.getLogger(__name__)

# Lazy load CLIP model to avoid startup delay
_clip_model = None
_clip_processor = None

# Verification keywords for each topic
VERIFICATION_KEYWORDS = {
    "cafe": ["café", "coffee shop", "coffee cup", "receipt", "barista", "menu"],
    "food": ["breakfast", "food", "meal", "plate", "kitchen", "eating"],
    "colors": ["colorful objects", "colored items", "various colors"],
    "weather": ["sky", "outdoor", "weather", "clouds", "sun", "rain"],
    "greetings": ["person", "people", "selfie", "meeting"],
    "shopping": ["store", "shop", "supermarket", "products", "receipt", "groceries"],
    "transport": ["bus stop", "train station", "bus", "train", "platform", "ticket"],
    "hobbies": ["hobby", "sport", "activity", "leisure", "recreation"],
    "describing": ["person", "people", "portrait", "friend"],
    "daily_routine": ["morning", "routine", "home", "daily activity"],
    "travel": ["station", "airport", "travel", "journey", "ticket"],
    "work": ["office", "workplace", "desk", "work", "job"],
    "health": ["pharmacy", "medicine", "health", "apotek"],
    "ambitions": ["goal", "dream", "aspiration", "future"],
    "news": ["news", "article", "newspaper", "screen", "text"],
    "debate": ["discussion", "argument", "topic", "notes"],
    "formal": ["email", "letter", "document", "formal writing"],
    "society": ["people", "interview", "conversation", "social"],
    "technical": ["process", "steps", "technical", "diagram"],
    "academic": ["research", "article", "study", "academic"],
    "idiom": ["conversation", "speaking", "talking"],
    "professional": ["business", "proposal", "professional", "document"],
    "nuance": ["debate", "discussion", "TV", "program"],
    "register": ["writing", "text", "document", "comparison"],
    "literary": ["story", "writing", "creative", "text"],
    "dialect": ["video", "screen", "transcription"],
    "precision": ["review", "critique", "analysis"],
    "colloquial": ["casual", "informal", "conversation"],
    "irony": ["satire", "commentary", "humor"]
}

# Word count requirements by CEFR level
WORD_COUNT_REQUIREMENTS = {
    "A1": 5,
    "A2": 10,
    "B1": 15,
    "B2": 25,
    "C1": 35,
    "C2": 45
}


def _load_clip_model():
    """Lazy load CLIP model."""
    global _clip_model, _clip_processor

    if _clip_model is None:
        try:
            from transformers import CLIPProcessor, CLIPModel
            logger.info("Loading CLIP model (first time may take a while)...")
            _clip_model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
            _clip_processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")
            logger.info("CLIP model loaded successfully")
        except Exception as e:
            logger.error(f"Failed to load CLIP model: {e}")
            raise

    return _clip_model, _clip_processor


def verify_photo(image_path, topic):
    """
    Verify if a photo matches the expected topic using CLIP.

    Args:
        image_path: Path to the uploaded image file
        topic: Challenge topic (e.g., "cafe", "transport")

    Returns:
        dict: {
            verified: bool,
            confidence: float (0-1),
            best_match: str,
            message: str
        }
    """
    try:
        model, processor = _load_clip_model()

        # Get keywords for topic
        keywords = VERIFICATION_KEYWORDS.get(topic, ["photo", "image", "picture"])

        # Load and process image
        image = Image.open(image_path)

        # Convert to RGB if necessary (CLIP requires RGB)
        if image.mode != 'RGB':
            image = image.convert('RGB')

        # Process image and text descriptions
        inputs = processor(
            text=keywords,
            images=image,
            return_tensors="pt",
            padding=True
        )

        # Get similarity scores
        outputs = model(**inputs)
        probs = outputs.logits_per_image.softmax(dim=1)

        # Find best match
        best_idx = probs.argmax().item()
        confidence = float(probs[0][best_idx].item())
        best_match = keywords[best_idx]

        # Threshold for verification (0.25 is reasonable for CLIP)
        verified = confidence > 0.20

        if verified:
            message = f"Photo verified as relevant to '{topic}'"
        else:
            message = f"Photo may not match expected content for '{topic}'"

        return {
            "verified": verified,
            "confidence": round(confidence, 3),
            "best_match": best_match,
            "message": message
        }

    except Exception as e:
        logger.error(f"Photo verification error: {e}")
        return {
            "verified": False,
            "confidence": 0,
            "best_match": None,
            "message": f"Verification error: {str(e)}"
        }


def analyze_norwegian_text(text, cefr_level, topic):
    """
    Analyze Norwegian text quality using Llama 3.2 via Ollama.

    Args:
        text: User's Norwegian text response
        cefr_level: Expected CEFR level (A1-C2)
        topic: Challenge topic

    Returns:
        dict: {
            verified: bool,
            score: int (0-100),
            is_norwegian: bool,
            grammar_feedback: str,
            suggestions: list,
            word_count: int
        }
    """
    try:
        import ollama

        word_count = len(text.split())
        required_words = WORD_COUNT_REQUIREMENTS.get(cefr_level, 10)

        prompt = f"""Analyze this Norwegian text from a {cefr_level} language learner.

Text: "{text}"
Expected topic: {topic}
Expected CEFR level: {cefr_level}
Word count: {word_count} (required: {required_words}+)

Evaluate and respond ONLY with valid JSON:
{{
    "is_norwegian": true/false,
    "grammar_score": 0-100,
    "vocabulary_appropriate": true/false,
    "topic_relevant": true/false,
    "feedback_no": "Kort tilbakemelding på norsk (1-2 setninger)",
    "feedback_en": "Short feedback in English (1-2 sentences)",
    "suggestions": ["suggestion 1", "suggestion 2"]
}}

Scoring guide:
- is_norwegian: Is the text actually Norwegian (not English/other)?
- grammar_score: 0-100 based on grammar correctness for this level
- vocabulary_appropriate: Does vocabulary match {cefr_level} level?
- topic_relevant: Is the content related to {topic}?

Be encouraging but honest. This is for learning."""

        response = ollama.chat(
            model='llama3.2',
            messages=[
                {
                    'role': 'system',
                    'content': 'You are a Norwegian language teacher. Analyze student text and output only valid JSON. Be encouraging but accurate.'
                },
                {
                    'role': 'user',
                    'content': prompt
                }
            ],
            options={'temperature': 0.2}
        )

        # Parse response
        content = response['message']['content'].strip()

        # Clean JSON
        if content.startswith('```'):
            content = content.split('```')[1]
            if content.startswith('json'):
                content = content[4:]
        content = content.strip()

        # Extract JSON
        first_brace = content.find('{')
        last_brace = content.rfind('}')
        if first_brace != -1 and last_brace != -1:
            content = content[first_brace:last_brace + 1]

        result = json.loads(content)

        # Calculate overall score
        score = 0

        # Word count check (20 points)
        if word_count >= required_words:
            score += 20
        elif word_count >= required_words * 0.5:
            score += 10

        # Is Norwegian (20 points)
        if result.get('is_norwegian', False):
            score += 20

        # Grammar (30 points)
        grammar = result.get('grammar_score', 0)
        score += int(grammar * 0.3)

        # Vocabulary (15 points)
        if result.get('vocabulary_appropriate', False):
            score += 15

        # Topic relevance (15 points)
        if result.get('topic_relevant', False):
            score += 15

        # Determine if verified (60+ is passing)
        verified = score >= 60

        return {
            "verified": verified,
            "score": score,
            "is_norwegian": result.get('is_norwegian', False),
            "grammar_score": result.get('grammar_score', 0),
            "vocabulary_appropriate": result.get('vocabulary_appropriate', False),
            "topic_relevant": result.get('topic_relevant', False),
            "word_count": word_count,
            "required_words": required_words,
            "feedback_no": result.get('feedback_no', ''),
            "feedback_en": result.get('feedback_en', ''),
            "suggestions": result.get('suggestions', [])
        }

    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse Llama response: {e}")
        # Fallback to basic analysis
        return _basic_text_analysis(text, cefr_level, topic)
    except Exception as e:
        logger.error(f"Text analysis error: {e}")
        return _basic_text_analysis(text, cefr_level, topic)


def _basic_text_analysis(text, cefr_level, topic):
    """
    Fallback basic text analysis when Llama is unavailable.
    """
    word_count = len(text.split())
    required_words = WORD_COUNT_REQUIREMENTS.get(cefr_level, 10)

    # Simple checks
    has_norwegian_chars = any(c in text for c in 'æøåÆØÅ')
    meets_length = word_count >= required_words

    score = 0
    if meets_length:
        score += 40
    if has_norwegian_chars:
        score += 30
    if len(text) > 20:
        score += 30

    return {
        "verified": score >= 60,
        "score": score,
        "is_norwegian": has_norwegian_chars,
        "grammar_score": 50,  # Unknown
        "vocabulary_appropriate": True,
        "topic_relevant": True,
        "word_count": word_count,
        "required_words": required_words,
        "feedback_no": "Takk for besvarelsen!",
        "feedback_en": "Thank you for your response!",
        "suggestions": []
    }


def verify_irl_submission(challenge, photo_path=None, text_response=None):
    """
    Complete verification of an IRL challenge submission.

    Args:
        challenge: Challenge dict with topic, cefr_level, etc.
        photo_path: Path to uploaded photo (optional)
        text_response: User's Norwegian text (optional)

    Returns:
        dict: {
            tier: "bronze" | "silver" | "gold",
            xp_multiplier: 0.2 | 0.5 | 1.0,
            photo_result: {...} | None,
            text_result: {...} | None,
            feedback: str,
            ai_verified: bool
        }
    """
    topic = challenge.get('topic', 'general')
    cefr_level = challenge.get('cefr_level', 'A1')

    result = {
        "tier": "bronze",
        "xp_multiplier": 0.2,
        "photo_result": None,
        "text_result": None,
        "feedback": "Challenge marked as complete",
        "ai_verified": False
    }

    # Step 1: Photo verification
    if photo_path and os.path.exists(photo_path):
        photo_result = verify_photo(photo_path, topic)
        result["photo_result"] = photo_result

        if photo_result["verified"]:
            result["tier"] = "silver"
            result["xp_multiplier"] = 0.5
            result["feedback"] = f"Photo verified! {photo_result['message']}"
            result["ai_verified"] = True

    # Step 2: Text verification
    if text_response and len(text_response.strip()) > 0:
        text_result = analyze_norwegian_text(text_response, cefr_level, topic)
        result["text_result"] = text_result

        # Gold tier requires both photo and text verified
        if result["tier"] == "silver" and text_result["verified"]:
            result["tier"] = "gold"
            result["xp_multiplier"] = 1.0
            result["feedback"] = f"Full verification! {text_result['feedback_en']}"
        elif text_result["verified"]:
            # Text only (no photo or photo failed)
            if result["tier"] == "bronze":
                result["tier"] = "silver"
                result["xp_multiplier"] = 0.5
            result["feedback"] = text_result["feedback_en"]
            result["ai_verified"] = True
        else:
            # Text submitted but didn't pass
            result["feedback"] = f"Text needs improvement: {text_result['feedback_en']}"

    return result


def calculate_irl_xp(base_xp, verification_result):
    """
    Calculate final XP based on verification tier.

    Args:
        base_xp: Challenge base XP reward
        verification_result: Result from verify_irl_submission()

    Returns:
        int: Final XP to award
    """
    multiplier = verification_result.get("xp_multiplier", 0.2)
    return int(base_xp * multiplier)
