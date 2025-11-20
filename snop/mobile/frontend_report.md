# Frontend Report - 2025-11-20

## Recent Changes Summary

Today's changes focused on three main areas:
1. **Full theme support** for challenge screens using the `useTheme` hook
2. **TodayScreen improvements** with pull-to-refresh and cleaned up UI
3. **New FeedbackModal component** replacing iOS alerts for better UX
4. **StatsScreen enhancements** with real data integration and improved visualizations

---

## Component Inventory

### Screens (src/screens/)

| Component | Description | Recent Changes |
|-----------|-------------|----------------|
| `TodayScreen.js` | Main daily challenges hub with swipeable featured cards | Added RefreshControl, removed generate button and swipe hints |
| `FillBlankChallengeScreen.js` | Fill-in-the-blank language challenges | Full theme support, FeedbackModal integration, fixed text input color |
| `ListeningChallengeScreen.js` | Audio-based listening comprehension | Full theme support, FeedbackModal integration, sends option text vs index |
| `MultipleChoiceChallengeScreen.js` | Multiple choice translation challenges | Full theme support, FeedbackModal integration, sends option text vs index |
| `StatsScreen.js` | User progress dashboard with charts | Fixed lock icons, real data for charts, dark mode support |
| `DailyScreen.js` | Daily challenges list view | Tracking progress updates |
| `DailyChallengesScreen.js` | Alternative daily challenges view | No recent changes |

### Components (src/components/)

| Component | Description | Recent Changes |
|-----------|-------------|----------------|
| `FeedbackModal.js` | **NEW** - In-app modal for challenge results | Created to replace iOS alerts; shows correct/incorrect status, XP gained, Norwegian text |
| `SwipeableCard.js` | Swipeable challenge card with gestures | Added numberOfLines limits, displays title_no and description_no |

### Context Providers (src/context/)

| Context | Purpose |
|---------|---------|
| `AuthContext.js` | Authentication state and token management |
| `ChallengeContext.js` | Challenge data, progress tracking, API calls |
| `ThemeContext.js` | Dark/light theme colors and preferences |
| `PerformanceContext.js` | Local performance tracking |
| `AudioContext.js` | Audio recording/playback with expo-av |

---

## Architecture Overview

### State Management
- **React Context API** for global state (Auth, Theme, Challenges, Performance, Audio)
- No external state management library (Redux/Zustand)

### Theme System
All screens now use the `useTheme` hook from `ThemeContext`:
```javascript
const { colors } = useTheme();
// colors.background, colors.textPrimary, colors.primary, etc.
```

### Navigation Pattern
- React Navigation 7.x with bottom tabs
- Stack navigators for challenge flows
- Navigation pattern: `navigation.navigate("Tabs", { screen: "Today" })`

### API Communication
- Axios-based with mock/real adapter pattern
- Challenge submission sends actual option text (not index) for proper backend comparison

---

## Styling & Theming

### Theme-aware Styling Pattern
Challenge screens now consistently apply theme colors:
```javascript
<SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
<Text style={[styles.title, { color: colors.primary }]}>{title}</Text>
```

### Submit Button Disabled State
Changed from color modification to opacity:
```javascript
style={[
  styles.submitButton,
  { backgroundColor: colors.primary },
  (!userAnswer.trim() || loading) && { opacity: 0.5 },
]}
```

### Text Input Color Fix
Added explicit text color for inputs:
```javascript
{ color: colors.textPrimary }
```

---

## Key Component Details

### FeedbackModal (New Component)
**Location:** `/Users/henrikdahlostrom/Desktop/team_21/snop/mobile/src/components/FeedbackModal.js`

**Props:**
- `visible`: boolean - Modal visibility
- `isCorrect`: boolean - Whether answer was correct
- `xpGained`: number - XP earned
- `message`: string - Custom feedback message
- `onTryAnother`: function - Navigate to next challenge
- `onGoBack`: function - Return to Today screen
- `showTryAnother`: boolean - Show Try Another button

**Features:**
- Norwegian localization ("Riktig!", "Feil", "Prove en annen", "Ga tilbake")
- Visual feedback with icons and colors
- XP display badge
- Theme-aware styling

### TodayScreen Updates
**Location:** `/Users/henrikdahlostrom/Desktop/team_21/snop/mobile/src/screens/TodayScreen.js`

**Changes:**
1. Added `RefreshControl` for pull-to-refresh:
```javascript
<RefreshControl
  refreshing={refreshing}
  onRefresh={onRefresh}
  colors={[colors.primary]}
  tintColor={colors.primary}
/>
```

2. Removed generate challenges button
3. Removed swipe hint text from Featured Challenge section
4. Simplified UI focus on challenge categories

### SwipeableCard Updates
**Location:** `/Users/henrikdahlostrom/Desktop/team_21/snop/mobile/src/components/SwipeableCard.js`

**Changes:**
1. Text overflow prevention with `numberOfLines`:
```javascript
<Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={3}>
  {challenge.title_no || challenge.title}
</Text>
<Text style={[styles.prompt, { color: colors.textSecondary }]} numberOfLines={4}>
  {challenge.description_no || challenge.description}
</Text>
```

2. Norwegian content prioritization (title_no, description_no)

### StatsScreen Updates
**Location:** `/Users/henrikdahlostrom/Desktop/team_21/snop/mobile/src/screens/StatsScreen.js`

**Changes:**
1. Fixed lock icon logic for CEFR levels:
```javascript
let icon = '🔒';
if (isCompleted) {
  icon = '✓';
} else if (isUnlocked || isCurrentLevel) {
  icon = '📍';
}
```

2. Real data integration for weekly activity chart:
```javascript
const getWeeklyData = () => {
  const weekData = [0, 0, 0, 0, 0, 0, 0];
  const completions = userProgress?.recent_completions || [];
  completions.forEach(completion => {
    if (completion.completed_at) {
      const date = new Date(completion.completed_at);
      const dayIndex = (date.getDay() + 6) % 7;
      weekData[dayIndex]++;
    }
  });
  return weekData;
};
```

3. Chart configuration improvements:
- Legend added: `legend: ["Challenges completed"]`
- Theme-aware colors
- Proper labels with `propsForLabels`

---

## Build & Tooling

- **Framework:** React Native 0.81.5 with Expo 54.0.21
- **Dependencies:** expo-speech (TTS), react-native-chart-kit, expo-secure-store
- **Build:** Expo managed workflow

---

## Testing

No formal test framework is currently configured. Testing is done manually through:
- Expo development server
- Physical device testing
- Simulator/emulator testing

---

## Issues & Recommendations

### Current Issues
1. **Hardcoded colors in some places:** Some styles still use hardcoded hex values instead of theme colors (e.g., `#003580` in `playButtonActive`)
2. **Missing theme support:** Some components may still need `useTheme` integration
3. **No error boundaries:** Challenge screens could benefit from error boundary components

### Recommendations

1. **Complete theme migration:**
   - Audit remaining screens for hardcoded colors
   - Update `hintBox` and `hintText` styles to use theme colors

2. **IRL Challenge screen improvements:**
   - Implement camera/photo upload flow
   - Add location verification if needed

3. **Adaptive difficulty indicators:**
   - Add visual cues for AI-adjusted difficulty
   - Show user performance trends

4. **Performance optimizations:**
   - Consider memoization for challenge card rendering
   - Lazy load chart component in StatsScreen

---

## Tomorrow's Plan

1. Connect remaining screens to theme system
2. Implement IRL challenge screen flow improvements
3. Add adaptive difficulty UI indicators
4. Address any hardcoded color values

---

## Recent Git History

```
3d7b4dd changes to today screen
e1c675b removed daily limit
34bebf3 update
36a11b0 fixed try again button
24b9c0c new update
7309d07 challenge generations update
db5a2ec stat track bar
daa0bba stat track bar
f0f2991 tracking progress update
d2ae5de tracking progress
```

---

## File Paths Reference

### Modified Today
- `/Users/henrikdahlostrom/Desktop/team_21/snop/mobile/src/screens/TodayScreen.js`
- `/Users/henrikdahlostrom/Desktop/team_21/snop/mobile/src/screens/FillBlankChallengeScreen.js`
- `/Users/henrikdahlostrom/Desktop/team_21/snop/mobile/src/screens/ListeningChallengeScreen.js`
- `/Users/henrikdahlostrom/Desktop/team_21/snop/mobile/src/screens/MultipleChoiceChallengeScreen.js`
- `/Users/henrikdahlostrom/Desktop/team_21/snop/mobile/src/screens/StatsScreen.js`
- `/Users/henrikdahlostrom/Desktop/team_21/snop/mobile/src/components/FeedbackModal.js`
- `/Users/henrikdahlostrom/Desktop/team_21/snop/mobile/src/components/SwipeableCard.js`
