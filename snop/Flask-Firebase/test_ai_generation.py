"""
Test script for AI challenge generation.
Run this to test the Ollama integration without using the API.
"""

# IMPORTANT: Load .env BEFORE importing any Firebase-dependent modules
from dotenv import load_dotenv
load_dotenv()

from services_ai_generation import (
    generate_pronunciation_challenge,
    generate_listening_challenge,
    generate_and_save_challenges
)

def test_single_pronunciation():
    """Test generating a single pronunciation challenge."""
    print("\n" + "="*60)
    print("TEST 1: Single Pronunciation Challenge")
    print("="*60)

    try:
        challenge = generate_pronunciation_challenge(
            difficulty=1,
            topic="cafe",
            frequency="daily"
        )

        print("\n✓ Successfully generated pronunciation challenge!")
        print(f"\nTitle: {challenge['title']}")
        print(f"Title (NO): {challenge['title_no']}")
        print(f"Prompt: {challenge['prompt']}")
        print(f"Target: {challenge['target']}")
        print(f"Description: {challenge['description']}")
        print(f"Difficulty: {challenge['difficulty']}")
        print(f"Topic: {challenge['topic']}")

        return True
    except Exception as e:
        print(f"\n✗ Failed: {e}")
        return False


def test_single_listening():
    """Test generating a single listening challenge."""
    print("\n" + "="*60)
    print("TEST 2: Single Listening Challenge")
    print("="*60)

    try:
        challenge = generate_listening_challenge(
            difficulty=2,
            topic="restaurant",
            frequency="daily"
        )

        print("\n✓ Successfully generated listening challenge!")
        print(f"\nTitle: {challenge['title']}")
        print(f"Audio Text (NO): {challenge['audio_text']}")
        print(f"Options:")
        for i, option in enumerate(challenge['options']):
            marker = "✓" if i == challenge['correct_answer'] else " "
            print(f"  [{marker}] {i+1}. {option}")
        print(f"Difficulty: {challenge['difficulty']}")
        print(f"Topic: {challenge['topic']}")

        return True
    except Exception as e:
        print(f"\n✗ Failed: {e}")
        return False


def test_batch_generation():
    """Test generating a batch of challenges (without saving)."""
    print("\n" + "="*60)
    print("TEST 3: Batch Generation (3 challenges, not saved)")
    print("="*60)

    try:
        result = generate_and_save_challenges(
            frequency="daily",
            count=3,
            difficulty_mix={1: 2, 2: 1},  # 2 easy, 1 medium
            save_to_db=False  # Don't save to Firestore for this test
        )

        print(f"\n✓ Generated {result['success_count']} challenges")
        print(f"✗ Failed: {result['failure_count']}")

        print("\nGenerated challenges:")
        for i, challenge in enumerate(result['challenges'], 1):
            print(f"\n{i}. {challenge['title']} ({challenge['type']}, difficulty {challenge['difficulty']})")
            if challenge['type'] == 'pronunciation':
                print(f"   Prompt: {challenge['prompt']}")
                print(f"   Target: {challenge['target']}")
            else:
                print(f"   Audio: {challenge['audio_text']}")
                print(f"   Correct: {challenge['options'][challenge['correct_answer']]}")

        return result['success_count'] == 3
    except Exception as e:
        print(f"\n✗ Failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def main():
    """Run all tests."""
    print("\n" + "🤖 " + "="*58 + " 🤖")
    print(" "*15 + "AI CHALLENGE GENERATION TESTS")
    print("🤖 " + "="*58 + " 🤖")

    print("\nPrerequisites:")
    print("  ✓ Ollama installed and running")
    print("  ✓ llama3.2 model downloaded (ollama pull llama3.2)")
    print("  ✓ Flask-Firebase virtual environment activated")

    input("\nPress Enter to start tests...")

    results = []

    # Test 1: Single pronunciation
    results.append(("Pronunciation Challenge", test_single_pronunciation()))

    # Test 2: Single listening
    results.append(("Listening Challenge", test_single_listening()))

    # Test 3: Batch generation
    results.append(("Batch Generation", test_batch_generation()))

    # Summary
    print("\n" + "="*60)
    print("TEST SUMMARY")
    print("="*60)

    passed = sum(1 for _, result in results if result)
    total = len(results)

    for test_name, result in results:
        status = "✓ PASS" if result else "✗ FAIL"
        print(f"{status} - {test_name}")

    print(f"\nTotal: {passed}/{total} tests passed")

    if passed == total:
        print("\n🎉 All tests passed! Your AI challenge generation is working!")
        print("\nNext steps:")
        print("  1. Install ollama in requirements: pip install ollama")
        print("  2. Restart your Flask server")
        print("  3. Use the API endpoints:")
        print("     - POST /admin/generate-single - Generate one challenge")
        print("     - POST /admin/generate-challenges - Generate multiple challenges")
    else:
        print("\n⚠️  Some tests failed. Check the errors above.")
        print("\nTroubleshooting:")
        print("  - Make sure Ollama is running: ollama serve")
        print("  - Make sure llama3.2 is installed: ollama pull llama3.2")
        print("  - Check that the Ollama Python library is installed: pip install ollama")

    print("="*60 + "\n")


if __name__ == "__main__":
    main()
