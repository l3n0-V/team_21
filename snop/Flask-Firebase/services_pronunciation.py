# services_pronunciation.py
"""
Pronunciation evaluation service using OpenAI Whisper API.
Handles speech-to-text transcription and accuracy scoring.
"""
import os
import requests
from difflib import SequenceMatcher
import re


def normalize_text(text):
    """
    Normalize text for comparison by removing punctuation and converting to lowercase.

    Args:
        text: str - Original text

    Returns:
        str - Normalized text
    """
    # Remove punctuation and extra whitespace
    text = re.sub(r'[^\w\s]', '', text)
    text = re.sub(r'\s+', ' ', text)
    return text.lower().strip()


def calculate_similarity(transcription, target):
    """
    Calculate similarity between transcription and target text.

    Args:
        transcription: str - What the user said
        target: str - What they should have said

    Returns:
        float - Similarity score between 0 and 1
    """
    normalized_transcription = normalize_text(transcription)
    normalized_target = normalize_text(target)

    # Use SequenceMatcher for similarity calculation
    similarity = SequenceMatcher(None, normalized_transcription, normalized_target).ratio()
    return similarity


def generate_feedback(similarity, transcription, target):
    """
    Generate helpful feedback based on pronunciation accuracy.

    Args:
        similarity: float - Similarity score (0-1)
        transcription: str - What the user said
        target: str - What they should have said

    Returns:
        str - Feedback message
    """
    if similarity >= 0.95:
        return "Perfect pronunciation! Excellent job! 🎉"
    elif similarity >= 0.85:
        return "Great pronunciation! Just minor differences."
    elif similarity >= 0.70:
        return "Good effort! Keep practicing for better clarity."
    elif similarity >= 0.50:
        return "You're getting there. Focus on pronouncing each word clearly."
    else:
        # Provide specific feedback
        normalized_transcription = normalize_text(transcription)
        normalized_target = normalize_text(target)

        if normalized_transcription == "":
            return "We couldn't detect clear speech. Try speaking louder and more clearly."

        return f"Try again. We heard: '{transcription}'. Target: '{target}'"


def calculate_xp(similarity, difficulty=1):
    """
    Calculate XP gained based on pronunciation accuracy and difficulty.

    Args:
        similarity: float - Similarity score (0-1)
        difficulty: int - Challenge difficulty (1-3)

    Returns:
        int - XP points earned
    """
    base_xp = {
        1: 10,   # Easy challenges
        2: 15,   # Medium challenges
        3: 20    # Hard challenges
    }

    xp = base_xp.get(difficulty, 10)

    # Reduce XP based on accuracy
    if similarity >= 0.95:
        multiplier = 1.0
    elif similarity >= 0.85:
        multiplier = 0.9
    elif similarity >= 0.70:
        multiplier = 0.7
    elif similarity >= 0.50:
        multiplier = 0.5
    else:
        multiplier = 0.2

    return int(xp * multiplier)


def transcribe_audio_whisper(audio_url):
    """
    Transcribe audio using OpenAI Whisper API.

    Args:
        audio_url: str - URL or file path to audio file

    Returns:
        str - Transcribed text

    Raises:
        Exception if transcription fails
    """
    api_key = os.getenv("OPENAI_API_KEY")

    if not api_key:
        raise ValueError("OPENAI_API_KEY not set in environment variables")

    # If audio_url is a local file path
    if audio_url.startswith("file://") or not audio_url.startswith("http"):
        # Remove file:// prefix if present
        file_path = audio_url.replace("file://", "")

        with open(file_path, "rb") as audio_file:
            response = requests.post(
                "https://api.openai.com/v1/audio/transcriptions",
                headers={"Authorization": f"Bearer {api_key}"},
                files={"file": audio_file},
                data={"model": "whisper-1"}
            )
    else:
        # If it's a URL, download the file first
        audio_response = requests.get(audio_url)
        audio_response.raise_for_status()

        # Send to Whisper API
        response = requests.post(
            "https://api.openai.com/v1/audio/transcriptions",
            headers={"Authorization": f"Bearer {api_key}"},
            files={"file": ("audio.m4a", audio_response.content, "audio/m4a")},
            data={"model": "whisper-1"}
        )

    if response.status_code != 200:
        raise Exception(f"Whisper API error: {response.status_code} - {response.text}")

    result = response.json()
    return result.get("text", "")


def evaluate_pronunciation(audio_url, target_phrase, difficulty=1):
    """
    Main function to evaluate pronunciation from audio.

    Args:
        audio_url: str - URL to the audio file (from Firebase Storage)
        target_phrase: str - The correct phrase the user should say
        difficulty: int - Challenge difficulty level (1-3)

    Returns:
        dict with keys:
            - transcription: str - What was said
            - xp_gained: int - XP points earned
            - feedback: str - Helpful feedback message
            - pass: bool - Whether the attempt passed (>= 70% similarity)
            - similarity: float - Accuracy score (0-1)
    """
    try:
        # Transcribe the audio
        transcription = transcribe_audio_whisper(audio_url)

        # Calculate accuracy
        similarity = calculate_similarity(transcription, target_phrase)

        # Determine if passed (70% threshold)
        passed = similarity >= 0.70

        # Calculate XP
        xp_gained = calculate_xp(similarity, difficulty)

        # Generate feedback
        feedback = generate_feedback(similarity, transcription, target_phrase)

        return {
            "transcription": transcription,
            "xp_gained": xp_gained,
            "feedback": feedback,
            "pass": passed,
            "similarity": round(similarity, 2)
        }

    except Exception as e:
        # If transcription fails, return error result
        return {
            "transcription": "",
            "xp_gained": 0,
            "feedback": f"Error processing audio: {str(e)}",
            "pass": False,
            "similarity": 0.0
        }


def mock_evaluate_pronunciation(target_phrase, difficulty=1):
    """
    Mock evaluation for testing without Whisper API.
    Simulates a successful pronunciation attempt.

    Args:
        target_phrase: str - The target phrase
        difficulty: int - Challenge difficulty

    Returns:
        dict - Mock evaluation result
    """
    import random

    # Simulate random accuracy
    similarity = random.uniform(0.6, 1.0)
    passed = similarity >= 0.70
    xp_gained = calculate_xp(similarity, difficulty)
    feedback = generate_feedback(similarity, target_phrase, target_phrase)

    return {
        "transcription": target_phrase,  # Mock: assume they said it correctly
        "xp_gained": xp_gained,
        "feedback": feedback,
        "pass": passed,
        "similarity": round(similarity, 2)
    }
