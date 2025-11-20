# Backend Report - SNOP Application

This document tracks all backend code changes, updates, and commits for the SNOP language learning application.

---

## 2025-11-20 - Development Update

### Summary
Major updates to the challenge pool system including option randomization for multiple choice challenges and improved answer validation logic to support both legacy and new answer formats.

### Changes

- **Challenge Pool System - Option Randomization** (`services_challenge_pool.py`)
  - Files affected: `/Users/henrikdahlostrom/Desktop/team_21/snop/Flask-Firebase/services_challenge_pool.py`
  - Added option shuffling in `get_challenges_from_pool()` function (lines 62-75)
  - Options are now randomized when fetching multiple choice challenges
  - `correct_answer` index is updated to match the new shuffled position
  - Uses `random.shuffle()` to randomize option order
  - Impact: Prevents users from memorizing answer positions, improves learning effectiveness
  - Rationale: Users were able to guess answers based on position rather than knowledge

- **Answer Submission Fix - Text-Based Comparison** (`services_challenges.py`)
  - Files affected: `/Users/henrikdahlostrom/Desktop/team_21/snop/Flask-Firebase/services_challenges.py`
  - Updated `submit_challenge_answer()` function (lines 651-671)
  - Now compares answer text instead of just index for multiple choice and listening challenges
  - Supports dual answer format:
    - Legacy format: Integer index (backwards compatibility)
    - New format: Actual option text string (works with randomization)
  - Uses case-insensitive string comparison with `.strip().lower()`
  - Impact: Fixes broken answer checking when options are randomized
  - Rationale: Index-based comparison failed after option shuffling was introduced

- **Challenge Pool Integration** (`services_challenges.py`)
  - Imports `get_challenges_from_pool` and `mark_challenge_used` from `services_challenge_pool`
  - `get_todays_challenges_for_user()` now fetches from challenge_pool collection (lines 385-467)
  - `submit_challenge_answer()` marks challenges as used in pool after completion (lines 707-712)
  - Challenges are filtered by user's CEFR level and available types

- **Daily Progress Updates** (`services_daily_progress.py`)
  - Files affected: `/Users/henrikdahlostrom/Desktop/team_21/snop/Flask-Firebase/services_daily_progress.py`
  - 46 lines added to support improved tracking
  - Integrated with challenge completion flow

### Technical Details

**Option Randomization Implementation:**
```python
# In get_challenges_from_pool()
for challenge in result:
    if challenge.get("options") and challenge.get("correct_answer") is not None:
        options = challenge["options"]
        correct_index = challenge["correct_answer"]
        correct_option = options[correct_index]

        # Shuffle options
        shuffled = options.copy()
        random.shuffle(shuffled)

        # Update correct_answer to new index
        challenge["options"] = shuffled
        challenge["correct_answer"] = shuffled.index(correct_option)
```

**Answer Validation Logic:**
```python
# Support both index (legacy) and text (new) answer format
if isinstance(user_answer, int) or (isinstance(user_answer, str) and user_answer.isdigit()):
    # Legacy index comparison
    correct = (int(user_answer) == int(correct_answer_index))
else:
    # Text comparison for randomized options
    correct = (str(user_answer).strip().lower() == correct_option.strip().lower())
```

### Recent Git Commits

- `3d7b4dd` - changes to today screen
- `e1c675b` - removed daily limit
- `34bebf3` - update
- `36a11b0` - fixed try again button
- `24b9c0c` - new update
- `7309d07` - challenge generations update

### Files Modified (Recent Diff Stats)

| File | Changes |
|------|---------|
| `app.py` | 368 lines (+/-) |
| `services_cefr.py` | 54 lines (+/-) |
| `services_challenges.py` | 317 lines (+/-) |
| `services_daily_progress.py` | 46 lines (+) |

---

## Tomorrow's Plan - 2025-11-21

### Top Priority
1. **Seed B1-C2 Level Challenges**
   - Add 20 challenges per level for each challenge type
   - Target levels: B1, B2, C1, C2
   - Types: pronunciation, listening, fill_blank, multiple_choice

2. **Seed IRL Challenges**
   - Add IRL challenges for all CEFR levels (A1-C2)
   - 20 challenges minimum per level

3. **Rethink IRL Challenge Flow**
   - Implement guided prompts for better user experience
   - Design multi-step challenge structure
   - Add location hints for real-world engagement

### Medium Priority
1. **Image Verification AI**
   - Research CNN/CLIP/MobileNet for IRL photo verification
   - Implement AI-based image analysis for challenge completion
   - Ensure accuracy in verifying user-submitted photos

2. **Adaptive Difficulty System**
   - Design algorithm based on user performance metrics
   - Adjust challenge difficulty dynamically
   - Track user success rates per CEFR level and type

---

## Architecture Notes

### Challenge Pool System
- Collection: `challenge_pool`
- Statuses: `available`, `used`, `archived`
- Archive threshold: 10 uses
- Health check: Warns when < 10 challenges available per level

### Answer Validation Flow
1. Fetch challenge from pool (options randomized)
2. User submits answer (text or index)
3. System compares against correct option text
4. Records completion and awards XP
5. Marks challenge as used in pool

---

*Report generated: 2025-11-20*
*Last updated by: Scientific Reporter System*
