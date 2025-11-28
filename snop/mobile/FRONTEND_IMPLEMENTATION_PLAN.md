# Frontend Implementation Plan - CEFR Challenge System

## Overview

This document outlines the frontend changes needed to integrate with the new CEFR-based challenge system. The backend is complete and provides new API endpoints for:

- Fetching today's challenges (with CEFR levels and daily limits)
- Submitting challenge answers
- Verifying IRL challenges with photo uploads
- Tracking user CEFR progression (A1→C2)

## Backend API Changes Summary

### New Endpoints

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/challenges/today` | GET | Required | Get today's available challenges by type |
| `/api/challenges/submit` | POST | Required | Submit listening/fill_blank/multiple_choice answer |
| `/api/challenges/irl/verify` | POST | Required | Submit IRL challenge with photo |
| `/api/user/progress` | GET | Required | Get CEFR progression and recent completions |

### Response Structure Changes

**Old**: Challenges grouped by frequency (daily/weekly/monthly)
**New**: Challenges grouped by type (irl/listening/fill_blank/multiple_choice) with completion limits

## Phase 1: Update API Layer

### 1.1 Update `src/services/api.js`

**File**: `mobile/src/services/api.js`

**Changes needed**:

```javascript
// Add new API methods for CEFR system

const api = {
  // EXISTING METHODS (keep these)
  getChallenges: () => { ... },

  // NEW METHODS (add these)

  /**
   * Get today's challenges with CEFR levels and completion status
   */
  getTodaysChallenges: async () => {
    if (USE_MOCK) {
      // Mock response
      return {
        date: new Date().toISOString().split('T')[0],
        user_level: 'A1',
        challenges: {
          irl: {
            available: [...],
            completed_today: 0,
            limit: 1,
            can_complete_more: true
          },
          listening: {
            available: [...],
            completed_today: 0,
            limit: 3,
            can_complete_more: true
          },
          // ... other types
        }
      };
    } else {
      const response = await axiosInstance.get('/api/challenges/today');
      return response.data;
    }
  },

  /**
   * Submit a challenge answer (listening, fill_blank, multiple_choice)
   */
  submitChallengeAnswer: async (challengeId, userAnswer) => {
    if (USE_MOCK) {
      // Mock response
      return {
        success: true,
        correct: Math.random() > 0.3, // 70% success rate
        xp_gained: 10,
        feedback: 'Great job!',
        level_progress: {
          current_level: 'A1',
          completed: 5,
          required: 20,
          percentage: 25
        }
      };
    } else {
      const response = await axiosInstance.post('/api/challenges/submit', {
        challenge_id: challengeId,
        user_answer: userAnswer
      });
      return response.data;
    }
  },

  /**
   * Submit IRL challenge with photo (base64 or file)
   */
  submitIRLChallenge: async (challengeId, photoBase64, options = {}) => {
    if (USE_MOCK) {
      // Mock response
      return {
        success: true,
        verified: true,
        xp_gained: 50,
        photo_url: 'https://example.com/photo.jpg',
        feedback: 'Great job on your IRL challenge!',
        completion_status: {
          irl_completed_today: 1,
          irl_limit: 1,
          can_complete_more: false
        }
      };
    } else {
      const body = {
        challenge_id: challengeId,
        photo_base64: photoBase64,
        ...options // gps_lat, gps_lng, text_description
      };
      const response = await axiosInstance.post('/api/challenges/irl/verify', body);
      return response.data;
    }
  },

  /**
   * Get user's CEFR progression and roadmap
   */
  getUserProgress: async () => {
    if (USE_MOCK) {
      // Mock response
      return {
        current_level: 'A1',
        progress: {
          A1: {
            name: 'Beginner',
            completed: 5,
            required: 20,
            percentage: 25,
            unlocked: true,
            is_current: true
          },
          A2: {
            name: 'Elementary',
            completed: 0,
            required: 20,
            percentage: 0,
            unlocked: false,
            unlock_message: 'Complete 15 more A1 challenges to unlock A2'
          },
          // ... other levels
        },
        recent_completions: []
      };
    } else {
      const response = await axiosInstance.get('/api/user/progress');
      return response.data;
    }
  }
};

export default api;
```

## Phase 2: Update Context Providers

### 2.1 Update `ChallengeContext`

**File**: `mobile/src/context/ChallengeContext.js`

**Changes needed**:

```javascript
const ChallengeContext = createContext();

export const ChallengeProvider = ({ children }) => {
  const [todaysChallenges, setTodaysChallenges] = useState(null);
  const [userProgress, setUserProgress] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load today's challenges on mount
  useEffect(() => {
    loadTodaysChallenges();
  }, []);

  const loadTodaysChallenges = async () => {
    setLoading(true);
    try {
      const data = await api.getTodaysChallenges();
      setTodaysChallenges(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const submitChallenge = async (challengeId, userAnswer) => {
    try {
      const result = await api.submitChallengeAnswer(challengeId, userAnswer);

      // Reload today's challenges to update completion status
      await loadTodaysChallenges();

      // Show level-up notification if applicable
      if (result.level_up) {
        Alert.alert(
          'Level Up! 🎉',
          `Congratulations! You've advanced to ${result.new_level}!`,
          [{ text: 'Awesome!', onPress: () => {} }]
        );
      }

      return result;
    } catch (err) {
      throw err;
    }
  };

  const submitIRLChallenge = async (challengeId, photoUri, options = {}) => {
    try {
      // Convert photo URI to base64
      const base64 = await FileSystem.readAsStringAsync(photoUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const photoBase64 = `data:image/jpeg;base64,${base64}`;

      const result = await api.submitIRLChallenge(challengeId, photoBase64, options);

      // Reload challenges
      await loadTodaysChallenges();

      // Show level-up notification if applicable
      if (result.level_up) {
        Alert.alert(
          'Level Up! 🎉',
          `Congratulations! You've advanced to ${result.new_level}!`,
          [{ text: 'Awesome!', onPress: () => {} }]
        );
      }

      return result;
    } catch (err) {
      throw err;
    }
  };

  const loadUserProgress = async () => {
    try {
      const progress = await api.getUserProgress();
      setUserProgress(progress);
    } catch (err) {
      setError(err.message);
    }
  };

  const value = {
    todaysChallenges,
    userProgress,
    loading,
    error,
    loadTodaysChallenges,
    submitChallenge,
    submitIRLChallenge,
    loadUserProgress
  };

  return (
    <ChallengeContext.Provider value={value}>
      {children}
    </ChallengeContext.Provider>
  );
};

export const useChallenges = () => useContext(ChallengeContext);
```

## Phase 3: Create New Screens and Components

### 3.1 Create `TodayScreen.js` (Main Challenge Screen)

**File**: `mobile/src/screens/TodayScreen.js`

**Purpose**: Display all of today's available challenges grouped by type

**Layout**:
```
┌─────────────────────────────────────┐
│  📅 Today's Challenges              │
│  January 18, 2025                    │
├─────────────────────────────────────┤
│  🏆 Your Level: A1 Beginner         │
│  Progress: 6/20 (30%)                │
│  [████▒▒▒▒▒▒] → A2                  │
├─────────────────────────────────────┤
│  🎯 IRL Challenge (0/1 today)       │
│  [Available: 2 challenges] →         │
│  • Order coffee at café              │
│  • Greet someone in Norwegian        │
├─────────────────────────────────────┤
│  🎧 Listening (2/3 today)           │
│  [Available: 8 challenges] →         │
│  • Listen: Greeting                  │
│  • Listen: Coffee order              │
├─────────────────────────────────────┤
│  ✏️ Fill the Blank (3/3 today)     │
│  [✓ Complete!] Come back tomorrow    │
└─────────────────────────────────────┘
```

**Key Components**:
- ChallengeTypeSection (reusable for each challenge type)
- ProgressBar (shows completion out of total)
- ChallengeCard (shows individual challenge in list)

### 3.2 Create `IRLChallengeScreen.js`

**File**: `mobile/src/screens/IRLChallengeScreen.js`

**Purpose**: Display IRL challenge details and photo upload flow

**Screens**:

**Screen 1: Challenge Details**
```
┌─────────────────────────────────────┐
│  🎯 IRL Challenge                   │
│  Order coffee at a real café         │
├─────────────────────────────────────┤
│  Mission:                            │
│  Visit a café and say:               │
│  "Kan jeg få en kaffe, takk?"       │
│                                      │
│  Verification:                       │
│  📸 Photo required                   │
│  📍 Location (optional)              │
│  ✍️ Description (optional)           │
│                                      │
│  Reward: 50 XP                       │
│  Difficulty: ⭐⭐                    │
│                                      │
│  [Start Challenge]                   │
└─────────────────────────────────────┘
```

**Screen 2: Photo Upload**
```
┌─────────────────────────────────────┐
│  📸 Upload Proof Photo              │
│                                      │
│  ┌───────────────────────────┐      │
│  │                           │      │
│  │   [Photo Preview]         │      │
│  │                           │      │
│  └───────────────────────────┘      │
│                                      │
│  [📷 Take Photo] [🖼️ Choose Photo] │
│                                      │
│  ☐ Enable Location (Optional)       │
│  ☐ Add Description (Optional)       │
│                                      │
│  Description (optional):             │
│  ┌───────────────────────────┐      │
│  │ I ordered coffee at...    │      │
│  └───────────────────────────┘      │
│                                      │
│  [Submit Challenge]                  │
└─────────────────────────────────────┘
```

**Required Dependencies**:
```bash
expo install expo-image-picker expo-file-system expo-location
```

**Sample Code**:
```javascript
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import * as Location from 'expo-location';

const handleTakePhoto = async () => {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();

  if (status !== 'granted') {
    Alert.alert('Permission needed', 'Camera access is required');
    return;
  }

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.7,
    base64: false
  });

  if (!result.canceled) {
    setPhotoUri(result.assets[0].uri);
  }
};

const handleSubmit = async () => {
  if (!photoUri) {
    Alert.alert('Photo required', 'Please take or select a photo');
    return;
  }

  setLoading(true);
  try {
    const options = {};

    if (locationEnabled) {
      const location = await Location.getCurrentPositionAsync({});
      options.gps_lat = location.coords.latitude;
      options.gps_lng = location.coords.longitude;
    }

    if (description) {
      options.text_description = description;
    }

    const result = await submitIRLChallenge(challenge.id, photoUri, options);

    Alert.alert(
      'Success!',
      `You earned ${result.xp_gained} XP!`,
      [{ text: 'OK', onPress: () => navigation.goBack() }]
    );
  } catch (error) {
    Alert.alert('Error', error.message);
  } finally {
    setLoading(false);
  }
};
```

### 3.3 Update `StatsScreen.js`

**File**: `mobile/src/screens/StatsScreen.js`

**New Section**: CEFR Progression Roadmap

**Layout**:
```
┌─────────────────────────────────────┐
│  📊 Your Stats                      │
├─────────────────────────────────────┤
│  Total XP: 350                       │
│  Current Streak: 5 days 🔥          │
│  Longest Streak: 12 days             │
├─────────────────────────────────────┤
│  🗺️ Learning Roadmap                │
├─────────────────────────────────────┤
│  ✓ A1 Beginner                      │
│  Progress: 20/20 (100%) ✓            │
│  [████████████]                      │
├─────────────────────────────────────┤
│  → A2 Elementary (Current)          │
│  Progress: 6/20 (30%)                │
│  [████▒▒▒▒▒▒▒▒]                      │
├─────────────────────────────────────┤
│  🔒 B1 Intermediate                 │
│  Complete 14 more A2 challenges      │
│  [▒▒▒▒▒▒▒▒▒▒▒▒]                      │
└─────────────────────────────────────┘
```

**Code Sample**:
```javascript
const { userProgress, loadUserProgress } = useChallenges();

useEffect(() => {
  loadUserProgress();
}, []);

const renderLevelCard = (levelKey, levelData) => {
  const Icon = levelData.unlocked ? '✓' : '🔒';
  const isCurrentLevel = levelData.is_current;

  return (
    <View style={[styles.levelCard, isCurrentLevel && styles.currentLevelCard]}>
      <View style={styles.levelHeader}>
        <Text style={styles.levelIcon}>{Icon}</Text>
        <Text style={styles.levelName}>{levelKey} {levelData.name}</Text>
      </View>

      <Text style={styles.levelProgress}>
        Progress: {levelData.completed}/{levelData.required} ({levelData.percentage}%)
      </Text>

      <ProgressBar
        progress={levelData.percentage / 100}
        color={isCurrentLevel ? '#4CAF50' : '#9E9E9E'}
      />

      {levelData.unlock_message && (
        <Text style={styles.unlockMessage}>{levelData.unlock_message}</Text>
      )}
    </View>
  );
};
```

## Phase 4: Update Navigation

### 4.1 Update `TabNavigator.js`

**File**: `mobile/src/navigation/TabNavigator.js`

**Changes**:

```javascript
// Replace DailyScreen/WeeklyScreen/MonthlyScreen with:
// - TodayScreen (main challenge screen)
// - ProgressScreen (CEFR roadmap)

import TodayScreen from '../screens/TodayScreen';
import ProgressScreen from '../screens/ProgressScreen';

const Tab = createBottomTabNavigator();

function TabNavigator() {
  return (
    <Tab.Navigator>
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ tabBarIcon: () => <Icon name="home" /> }}
      />
      <Tab.Screen
        name="Today"
        component={TodayScreen}
        options={{ tabBarIcon: () => <Icon name="today" /> }}
      />
      <Tab.Screen
        name="Progress"
        component={ProgressScreen}
        options={{ tabBarIcon: () => <Icon name="trending-up" /> }}
      />
      <Tab.Screen
        name="Stats"
        component={StatsScreen}
        options={{ tabBarIcon: () => <Icon name="bar-chart" /> }}
      />
    </Tab.Navigator>
  );
}
```

## Phase 5: Update Shared Types

### 5.1 Update `challengeType.js`

**File**: `mobile/src/shared/types/challengeType.js`

**Add new fields**:

```javascript
// Add CEFR-related fields to challenge type
export const ChallengeType = {
  // Existing fields
  id: String,
  title: String,
  description: String,

  // NEW FIELDS
  type: String, // "listening", "fill_blank", "multiple_choice", "irl", "pronunciation"
  cefr_level: String, // "A1", "A2", "B1", "B2", "C1", "C2"
  topic: String,
  xp_reward: Number,

  // Type-specific fields
  // For listening/multiple_choice:
  audio_text: String,
  audio_url: String,
  options: Array,
  correct_answer: Number,

  // For fill_blank:
  sentence: String,
  missing_word: String,
  hint: String,

  // For IRL:
  mission_description: String,
  verification_type: String,
  verification_prompts: Object,
  optional_verifications: Array
};
```

## Phase 6: Testing Checklist

### Frontend Testing

- [ ] Mock mode works: Set `USE_MOCK = true` in `endpoints.js`
- [ ] Fetch today's challenges displays correctly
- [ ] Submit listening challenge shows result and updates completion count
- [ ] Submit 3 listening challenges → 4th shows "limit reached" message
- [ ] IRL challenge photo picker works (camera + gallery)
- [ ] IRL challenge submission uploads photo and shows success
- [ ] Level progress bar shows correct percentage
- [ ] Level-up alert appears when user completes enough challenges
- [ ] CEFR roadmap shows locked/unlocked levels correctly
- [ ] Recent completions list displays in stats screen

### Integration Testing (with Backend)

- [ ] Set `USE_MOCK = false` in `endpoints.js`
- [ ] Run backend: `cd Flask-Firebase && python app.py`
- [ ] Register new user → user starts at A1
- [ ] Fetch today's challenges → shows challenges at user's level
- [ ] Submit correct answer → XP increases
- [ ] Submit IRL challenge with photo → photo URL returned
- [ ] Complete 20 A1 challenges → level up to A2
- [ ] A2 challenges now appear in today's challenges

## Implementation Order

1. **Phase 1** (API layer): Update `api.js` with new methods
2. **Phase 2** (Context): Update `ChallengeContext` with new state and methods
3. **Phase 3.1** (UI): Create `TodayScreen` (main challenge screen)
4. **Phase 3.3** (UI): Update `StatsScreen` with CEFR roadmap
5. **Phase 3.2** (UI): Create `IRLChallengeScreen` with photo upload
6. **Phase 4** (Navigation): Update tab navigator
7. **Phase 5** (Types): Update shared types
8. **Phase 6** (Testing): Test all features

## Dependencies to Install

```bash
cd mobile
expo install expo-image-picker expo-file-system expo-location
```

## Files to Create

- [ ] `mobile/src/screens/TodayScreen.js`
- [ ] `mobile/src/screens/IRLChallengeScreen.js`
- [ ] `mobile/src/screens/ProgressScreen.js`
- [ ] `mobile/src/components/ChallengeTypeSection.js`
- [ ] `mobile/src/components/LevelProgressCard.js`
- [ ] `mobile/src/components/IRLPhotoUpload.js`

## Files to Update

- [ ] `mobile/src/services/api.js`
- [ ] `mobile/src/context/ChallengeContext.js`
- [ ] `mobile/src/screens/StatsScreen.js`
- [ ] `mobile/src/navigation/TabNavigator.js`
- [ ] `mobile/src/shared/types/challengeType.js`

## Summary

**Backend Status**: ✅ Complete
**Frontend Status**: 📋 Planned (this document)

The backend provides:
- CEFR-based challenge system (A1-C2)
- Daily challenge limits (1 IRL, 3 listening, 3 fill_blank, 3 multiple_choice)
- Photo upload for IRL challenges
- Automatic level progression
- User progress tracking

Frontend needs to:
- Fetch and display challenges by type (not frequency)
- Implement photo upload for IRL challenges
- Show CEFR progression in stats
- Handle level-up notifications
- Enforce daily limits client-side (for UX)

Once frontend is complete, the full CEFR system will be operational!
