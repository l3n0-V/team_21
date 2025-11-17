// Dark Theme
// A dark mode variant for SNOP

export const darkTheme = {
  id: 'dark',
  name: 'Dark Mode',
  description: 'Easy on the eyes for night-time practice',

  colors: {
    // Primary Brand Colors
    primary: '#3B82F6',           // Brighter blue for dark backgrounds
    primaryLight: '#60A5FA',      // Lighter blue for accents
    primaryDark: '#2563EB',       // Darker blue for emphasis
    accent: '#F87171',            // Softer red for dark mode
    accentLight: '#7F1D1D',       // Dark red background

    // Backgrounds
    background: '#111827',        // Dark gray - main background
    backgroundSecondary: '#1F2937', // Lighter dark gray - secondary backgrounds
    backgroundTertiary: '#374151',  // Medium gray
    backgroundAccent: '#1E3A8A',    // Dark blue tint for emphasis

    // Text Colors
    textPrimary: '#F9FAFB',       // Almost white - primary text
    textSecondary: '#D1D5DB',     // Light gray - secondary text
    textLight: '#9CA3AF',         // Medium gray - helper text
    textWhite: '#FFFFFF',         // Pure white
    textAccent: '#60A5FA',        // Light blue for emphasis

    // Status Colors
    success: '#34D399',           // Brighter green for dark mode
    successLight: '#064E3B',      // Dark green background
    warning: '#FBBF24',           // Brighter yellow for visibility
    warningLight: '#78350F',      // Dark yellow background
    error: '#F87171',             // Softer red
    errorLight: '#7F1D1D',        // Dark red background

    // Difficulty Colors
    difficultyEasy: '#34D399',    // Brighter green
    difficultyMedium: '#FBBF24',  // Brighter yellow
    difficultyHard: '#F87171',    // Softer red

    // Frequency Badge Colors
    frequencyDaily: '#60A5FA',    // Bright blue
    frequencyWeekly: '#A78BFA',   // Bright purple
    frequencyMonthly: '#F472B6',  // Bright pink

    // UI Elements
    border: '#374151',            // Dark gray borders
    borderFocus: '#3B82F6',       // Blue border for focus states
    shadow: '#000000',            // Shadow color (use with opacity)
    overlay: 'rgba(0, 0, 0, 0.7)', // Darker overlay for modals
    divider: '#374151',           // Divider lines

    // Interactive States
    pressed: 'rgba(59, 130, 246, 0.2)', // Light blue for pressed state
    disabled: '#6B7280',          // Gray for disabled elements
    disabledBackground: '#374151', // Background for disabled elements

    // Medal Colors (for leaderboard)
    gold: '#FCD34D',
    silver: '#D1D5DB',
    bronze: '#D97706',
  }
};
