# CEFR Mobile App Testing Guide

This guide walks you through testing all the new CEFR features in the mobile app.

## Prerequisites

1. ✅ Backend running: `cd Flask-Firebase && python app.py`
2. ✅ Mobile app running: `cd mobile && npm start`
3. ✅ USE_MOCK set to `false` in `shared/config/endpoints.js`
4. ✅ Logged in with a valid Firebase account

## Test 1: Today Screen - View Daily Challenges

**Objective:** Verify the new Today tab shows challenges grouped by type with daily limits

### Steps:
1. Open the mobile app
2. Tap on the **Today** tab (calendar icon) in the bottom navigation
3. Wait for challenges to load

### Expected Results:
- ✅ Header shows "📅 Today's Challenges" with current date
- ✅ User progress card displays:
  - Your current CEFR level (e.g., "🏆 Your Level: A1 Beginner")
  - Progress bar showing completion (e.g., "Progress: 0/20 (0%)")
  - Next level indicator
- ✅ Four challenge sections visible:
  - **🎯 IRL Challenge** (1 available)
  - **🎧 Listening** (3 available)
  - **✏️ Fill the Blank** (3 available)
  - **📝 Multiple Choice** (3 available)
- ✅ Each section shows "X/Y today" completion count
- ✅ Tapping a challenge navigates to appropriate screen

### What to Check:
- Challenge cards show Norwegian title (title_no) with English subtitle
- Progress bars update correctly
- "✓ Complete! Come back tomorrow" appears when daily limit reached

---

## Test 2: Challenge Submission - Listening

**Objective:** Submit a listening challenge and verify XP gain + completion tracking

### Steps:
1. From **Today** tab, tap on a **Listening** challenge
2. Listen to the audio prompt
3. Type your answer in the input field
4. Tap **Submit**

### Expected Results:
- ✅ Loading indicator appears during submission
- ✅ Alert shows result:
  - **If correct:** "Correct! Well done!" + XP gained (e.g., "10 XP")
  - **If incorrect:** "Not quite. Try again!" + XP gained (e.g., "5 XP")
- ✅ After dismissing alert, you're returned to Today screen
- ✅ **Listening** section now shows updated completion:
  - "1/3 today" (instead of "0/3 today")
  - Progress bar fills accordingly
- ✅ Challenge counter updates immediately

### What to Check:
- XP gain shows in alert message
- Completion count increments
- Progress bar updates visually
- Can complete up to 3 listening challenges per day

---

## Test 3: Challenge Submission - Fill the Blank

**Objective:** Test fill-in-the-blank challenge type

### Steps:
1. From **Today** tab, tap on a **Fill the Blank** challenge
2. Read the sentence with the blank
3. Type the missing word
4. Tap **Submit**

### Expected Results:
- ✅ Similar alert behavior as listening challenge
- ✅ Completion count updates: "X/3 today"
- ✅ Progress bar updates
- ✅ Can complete up to 3 fill_blank challenges per day

---

## Test 4: Challenge Submission - Multiple Choice

**Objective:** Test multiple choice challenge type

### Steps:
1. From **Today** tab, tap on a **Multiple Choice** challenge
2. Read the question
3. Select one of the answer options
4. Tap **Submit**

### Expected Results:
- ✅ Alert shows correct/incorrect feedback
- ✅ XP gain displayed
- ✅ Completion count updates: "X/3 today"
- ✅ Can complete up to 3 multiple_choice challenges per day

---

## Test 5: Daily Limit Enforcement

**Objective:** Verify that daily limits are enforced and UI updates correctly

### Steps:
1. Complete 3 listening challenges (one at a time)
2. Return to Today screen after each completion

### Expected Results:
- ✅ After 1st completion: "1/3 today" - more challenges available
- ✅ After 2nd completion: "2/3 today" - more challenges available
- ✅ After 3rd completion: "3/3 today" - **limit reached**
- ✅ Listening section now shows:
  - "✓ Complete! Come back tomorrow" message
  - No more challenge cards displayed
  - Green/yellow background indicating completion

### What to Check:
- Cannot see or tap more challenges after limit reached
- Other challenge types (IRL, fill_blank, multiple_choice) still available
- Limit enforcement is per-type (completing 3 listening doesn't affect IRL limit)

---

## Test 6: IRL Challenge - Photo Capture

**Objective:** Test IRL challenge with camera photo upload

### Steps:
1. From **Today** tab, tap on an **IRL Challenge**
2. Read the challenge details:
   - Norwegian title (e.g., "Kjøp noe i en butikk")
   - English subtitle
   - Mission description
   - Target phrase to say
3. Tap **Take Photo** button
4. Grant camera permission if prompted
5. Take a photo with your camera
6. Review the photo preview
7. Optionally tap **Retake Photo** to take a new one
8. Tap **Submit Challenge**

### Expected Results:
- ✅ Camera permission dialog appears (first time only)
- ✅ Camera interface opens
- ✅ Photo editing screen appears (crop to 4:3 aspect ratio)
- ✅ Photo preview shows after capture
- ✅ Submit button is disabled until photo is taken
- ✅ Loading indicator during submission
- ✅ Success alert shows:
  - "Success! 🎉"
  - "You earned 50 XP!"
  - Feedback message from backend
- ✅ After dismissing alert, returned to Today screen
- ✅ IRL section shows "1/1 today"
- ✅ "✓ Complete! Come back tomorrow" appears for IRL section

### What to Check:
- Photo is compressed (quality: 0.7) before upload
- Submit button shows "Submit Challenge" when photo ready
- Submit button shows "Take Photo First" when no photo
- Base64 conversion happens successfully (no errors in console)
- IRL completion count updates to 1/1

---

## Test 7: Level Progression - A1 to A2

**Objective:** Complete 20 A1 challenges and verify level-up to A2

### Steps:
1. Note your current level (should be A1 initially)
2. Complete challenges across different types:
   - 1 IRL challenge (50 XP)
   - 3 listening challenges (10 XP each = 30 XP)
   - 3 fill_blank challenges (10 XP each = 30 XP)
   - 3 multiple_choice challenges (10 XP each = 30 XP)
   - Total per day: 1 + 3 + 3 + 3 = 10 challenges
3. **Come back the next day** (or reset daily limits in backend/Firestore)
4. Complete another 10 challenges
5. After the 20th A1 challenge completion:

### Expected Results:
- ✅ On the 20th challenge, after tapping Submit, you see:
  - **"Level Up! 🎉"** alert
  - **"Congratulations! You've advanced to A2!"**
  - Tap "Awesome!" to dismiss
- ✅ Go to **Today** screen, progress card now shows:
  - "🏆 Your Level: A2 Elementary"
  - "Progress: 0/20 (0%)" for A2
  - "→ Next: B1 Intermediate"
- ✅ Go to **Stats** tab to see CEFR roadmap:
  - A1 shows **✓** (completed)
  - A2 shows **→** (current, unlocked)
  - B1-C2 show **🔒** (locked)

### What to Check:
- Level-up alert appears exactly on 20th completion (not before)
- A1 progress shows 100% before level-up
- A2 starts at 0% after level-up
- Stats screen roadmap updates with checkmark for A1
- Can now see A2-level challenges (if available)

---

## Test 8: Stats Screen - CEFR Roadmap

**Objective:** Verify the new CEFR progression roadmap in Stats screen

### Steps:
1. Tap on the **Stats** tab (chart icon)
2. Scroll to see the learning roadmap section

### Expected Results:
- ✅ Header shows "📊 Your Stats"
- ✅ **"🗺️ Learning Roadmap"** section visible
- ✅ Subtitle: "Your progress through CEFR levels"
- ✅ Six level cards displayed (A1, A2, B1, B2, C1, C2):

  **For A1 (current level):**
  - Icon: **→** (arrow pointing right)
  - Border: **Bold, colored** (primary color)
  - Title: **"A1 - Beginner"** (bold, colored)
  - Progress text: "Progress: X/20 (Y%)"
  - Progress bar showing percentage

  **For A2 (next level, locked):**
  - Icon: **🔒** (locked)
  - Border: Regular gray
  - Title: "A2 - Elementary" (normal weight, gray)
  - Unlock message: "Complete 14 more A1 challenges to unlock A2"

  **For completed levels (after level-up):**
  - Icon: **✓** (checkmark)
  - Border: Regular
  - Title: "A1 - Beginner"
  - Progress: "Progress: 20/20 (100%)"
  - Green progress bar

- ✅ Weekly activity chart below roadmap

### What to Check:
- Current level has distinct visual styling (bold border, colored text)
- Progress bars accurately reflect completion
- Unlock messages show how many more challenges needed
- Roadmap scrolls smoothly
- Theme colors apply correctly (light/dark mode)

---

## Test 9: Navigation Flow

**Objective:** Verify all navigation routes work correctly

### Steps:
1. Start from **Today** tab
2. Tap on a **Listening** challenge → ListeningChallengeScreen opens
3. Tap back → returns to Today
4. Tap on a **Fill the Blank** challenge → FillBlankChallengeScreen opens
5. Tap back → returns to Today
6. Tap on a **Multiple Choice** challenge → MultipleChoiceChallengeScreen opens
7. Tap back → returns to Today
8. Tap on an **IRL** challenge → IRLChallengeScreen opens
9. Complete and submit → alert appears, then auto-navigates back to Today
10. Switch to **Stats** tab
11. Switch to **Leaderboard** tab
12. Switch to **Settings** tab
13. Switch back to **Today** tab

### Expected Results:
- ✅ All challenge screens open correctly
- ✅ Back buttons work (← arrow or native back)
- ✅ After IRL submission, auto-navigates to Today
- ✅ Tab switching preserves state (challenges still loaded)
- ✅ No navigation errors in console

---

## Test 10: Error Handling

**Objective:** Test error scenarios and graceful degradation

### Scenario A: No Internet Connection
1. Turn off Wi-Fi/cellular
2. Open Today tab
3. Try to load challenges

**Expected:**
- Loading indicator appears
- After timeout, error alert: "Failed to load today's challenges"
- Screen shows empty state or error message

### Scenario B: Invalid Challenge Submission
1. Submit a challenge with empty answer
2. Submit a challenge with invalid data

**Expected:**
- Validation prevents submission OR
- Backend returns error, alert shows "Failed to submit challenge"

### Scenario C: Camera Permission Denied
1. Open IRL challenge
2. Tap "Take Photo"
3. Deny camera permission

**Expected:**
- Alert: "Permission needed - Camera access is required to take photos for IRL challenges."
- Submit button remains disabled
- Can retry permission request

---

## Test 11: Backend Integration

**Objective:** Verify real backend connection (USE_MOCK=false)

### Steps:
1. Ensure `shared/config/endpoints.js` has `USE_MOCK = false`
2. Ensure backend is running on `http://localhost:5000`
3. Complete a challenge

### Expected Results:
- ✅ Console logs show API requests to `http://localhost:5000`
- ✅ Backend terminal shows incoming requests:
  - `GET /api/challenges/today`
  - `POST /api/challenges/submit`
  - `GET /api/user/progress`
- ✅ Responses come from real backend (not mock data)
- ✅ Data persists in Firestore database

### What to Check:
- Network tab in React Native Debugger shows real HTTP requests
- Backend logs confirm requests received
- User progress saves to Firestore (check Firebase Console)

---

## Common Issues & Troubleshooting

### Issue: "Failed to load today's challenges"
**Cause:** Backend not running or wrong endpoint
**Fix:**
- Start backend: `cd Flask-Firebase && python app.py`
- Check `API_BASE_URL` in `shared/config/endpoints.js`
- Ensure `USE_MOCK = false`

### Issue: "Authentication required" error
**Cause:** No valid Firebase token
**Fix:**
- Log out and log back in
- Check AuthContext has `token` value
- Verify token in AsyncStorage

### Issue: Camera not opening
**Cause:** Permission denied or expo-image-picker not installed
**Fix:**
- Grant camera permission in device settings
- Run `npm install expo-image-picker`

### Issue: Photo upload fails
**Cause:** Photo too large or base64 conversion error
**Fix:**
- Check console for errors
- Verify FileSystem.readAsStringAsync call
- Ensure photo quality is 0.7 (compressed)

### Issue: Challenges not updating after submission
**Cause:** loadTodaysChallenges not called after submit
**Fix:**
- Check submitChallenge and submitIRLChallenge call `loadTodaysChallenges(token)` after submission
- Verify ChallengeContext is working

---

## Performance Checks

### Loading Times
- Today screen should load in < 2 seconds
- Challenge submission should complete in < 3 seconds
- Photo upload (IRL) should complete in < 5 seconds

### Photo Size
- Original photo: ~2-5 MB
- Compressed photo (quality 0.7): ~300-800 KB
- Base64 string: ~400-1000 KB

### API Response Times (Backend Logs)
- `GET /api/challenges/today`: < 500ms
- `POST /api/challenges/submit`: < 800ms
- `POST /api/challenges/irl/verify`: < 2s (AI processing)
- `GET /api/user/progress`: < 300ms

---

## Test Completion Checklist

Use this checklist to track your testing progress:

- [ ] Test 1: Today Screen - View Daily Challenges
- [ ] Test 2: Challenge Submission - Listening
- [ ] Test 3: Challenge Submission - Fill the Blank
- [ ] Test 4: Challenge Submission - Multiple Choice
- [ ] Test 5: Daily Limit Enforcement
- [ ] Test 6: IRL Challenge - Photo Capture
- [ ] Test 7: Level Progression - A1 to A2
- [ ] Test 8: Stats Screen - CEFR Roadmap
- [ ] Test 9: Navigation Flow
- [ ] Test 10: Error Handling
- [ ] Test 11: Backend Integration

---

## Next Steps After Testing

1. **If all tests pass:**
   - Document any UX improvements needed
   - Add more challenges to Firestore for variety
   - Test on both iOS and Android devices
   - Test with multiple users for leaderboard

2. **If tests fail:**
   - Check console logs for errors
   - Verify backend is running and accessible
   - Check Firestore rules and data
   - Review API endpoint implementations

3. **Production readiness:**
   - Update `API_BASE_URL` to production URL
   - Enable analytics tracking
   - Test on real devices (not just simulator)
   - Perform load testing with multiple users

---

## Getting Help

If you encounter issues:
1. Check console logs (mobile app and backend)
2. Review backend logs in terminal
3. Check Firestore data in Firebase Console
4. Verify all dependencies are installed
5. Ensure you're using the latest code from both repos

**Backend Test Script:**
Run `/Users/henrikdahlostrom/Desktop/team_21/snop/Flask-Firebase/test_cefr_endpoints.sh` to test backend endpoints directly.
