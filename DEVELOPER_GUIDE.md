# Norwegian Language Learning App - Developer Guide

## Project Overview

This is a React Native mobile application built with Expo to help students learn Norwegian through real-world conversation challenges. The app encourages users to practice Norwegian by talking to strangers through daily, weekly, and monthly challenges.

## Architecture

### Tech Stack
- **Framework**: React Native with Expo
- **Navigation**: React Navigation (Bottom Tabs)
- **Storage**: AsyncStorage for persistence
- **Language**: JavaScript/JSX

### Project Structure

```
team_21/
├── App.js                      # Main app component with navigation setup
├── app.json                    # Expo configuration
├── package.json                # Dependencies and scripts
├── index.js                    # Entry point
│
├── screens/                    # Main app screens
│   ├── HomeScreen.js          # Today's challenges
│   ├── ChallengesScreen.js    # Browse all challenges
│   └── ProgressScreen.js      # User progress and stats
│
├── components/                 # Reusable UI components
│   └── ChallengeCard.js       # Challenge display card
│
├── data/                       # Data and constants
│   └── challenges.js          # Norwegian challenge definitions
│
├── utils/                      # Utility functions
│   └── storage.js             # AsyncStorage helpers
│
└── assets/                     # Images and icons
```

## Key Features

### 1. Challenge System
- **Daily Challenges**: Quick, easy tasks (e.g., "Say good morning to a stranger")
- **Weekly Challenges**: More involved tasks (e.g., "Have a 5-minute conversation")
- **Monthly Challenges**: Comprehensive goals (e.g., "Make a Norwegian friend")

### 2. Progress Tracking
- Total points earned
- Number of challenges completed by type
- Recent completion history
- Ability to reset progress

### 3. Challenge Data
Each challenge includes:
- Title and description
- Norwegian phrase with English translation
- Difficulty level (easy, medium, hard, very_hard)
- Points value
- Unique ID

### 4. Storage
- Completed challenges with timestamps
- Current active challenges
- Total points
- All data persists using AsyncStorage

## Components

### ChallengeCard
Displays a challenge with:
- Title and difficulty badge
- Description
- Norwegian phrase with translation
- Points value
- Completion status

### HomeScreen
- Displays current daily, weekly, and monthly challenges
- Allows users to mark challenges as complete
- Refresh button to get new random challenges

### ChallengesScreen
- Tabbed interface (Daily/Weekly/Monthly)
- Shows all available challenges
- Marks completed challenges

### ProgressScreen
- Statistics dashboard
- Points display
- Recent completions
- Reset functionality

## Data Flow

1. **Initial Load**: App checks AsyncStorage for current challenges
2. **No Challenges**: Randomly selects one from each category
3. **Display**: Shows challenges with completion status
4. **Complete**: User marks challenge complete → saves to storage → updates points
5. **Refresh**: User requests new challenge → randomly selects → saves to storage

## Running the App

### Development
```bash
# Install dependencies
npm install

# Start development server
npm start

# Run on specific platforms
npm run web      # Web browser
npm run android  # Android device/emulator
npm run ios      # iOS device/simulator (macOS only)
```

### Testing on Device
1. Install Expo Go app on your phone
2. Run `npm start`
3. Scan QR code with Expo Go (Android) or Camera (iOS)

## Customization

### Adding New Challenges
Edit `data/challenges.js`:

```javascript
{
  id: 'daily_6',
  type: CHALLENGE_TYPES.DAILY,
  title: 'Your Title',
  description: 'What the user should do',
  norwegianPhrase: 'Norsk setning',
  englishTranslation: 'English translation',
  difficulty: 'easy',
  points: 10
}
```

### Modifying Points
Update the `points` value in challenge objects in `data/challenges.js`.

### Changing Colors
Update styles in individual screen/component files. Main color scheme:
- Primary: `#2196F3` (blue)
- Secondary: `#FF9800` (orange)
- Success: `#4CAF50` (green)
- Error: `#F44336` (red)

## Storage Keys
```javascript
@norwegian_app:completed_challenges  // Array of completed challenges
@norwegian_app:current_challenges    // Current active challenges
@norwegian_app:total_points         // User's total points
@norwegian_app:streak               // (Reserved for future use)
```

## Future Enhancements

Potential features to add:
- Streak tracking (consecutive days)
- Social features (share achievements)
- More challenge categories
- Audio pronunciation guides
- Challenge verification (photo/video proof)
- Leaderboards
- Push notifications for daily challenges
- Difficulty levels selection
- User profiles

## PyCharm Setup

While this project uses Expo (JavaScript/React Native), you can use PyCharm for editing:

1. Open the project folder in PyCharm
2. PyCharm will recognize JavaScript files
3. Install JavaScript plugins if prompted
4. Use the built-in terminal to run npm commands

## Troubleshooting

### Dependencies Issues
```bash
npm install
```

### Clear Metro Cache
```bash
npx expo start -c
```

### Reset AsyncStorage Data
Use the "Reset All Progress" button in the Progress screen, or manually clear app data.

## License

This is a student project for HCAI course.
