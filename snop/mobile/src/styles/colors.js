// SNOP Brand Colors - Norwegian Flag Inspired Theme
// Primary colors derived from Norwegian flag (red, white, blue)

export const colors = {
  // Primary Brand Colors
  primary: '#002868',           // Norwegian deep navy blue - main brand color
  primaryLight: '#1E40AF',      // Lighter blue for accents
  primaryDark: '#001A4D',       // Darker blue for emphasis
  accent: '#EF2B2D',            // Norwegian red - highlights and CTAs
  accentLight: '#FEE2E2',       // Light red background

  // Backgrounds
  background: '#FFFFFF',        // Clean white - main background
  backgroundSecondary: '#F8F9FA', // Light gray - secondary backgrounds
  backgroundTertiary: '#F3F4F6',  // Slightly darker gray
  backgroundAccent: '#EFF6FF',    // Light blue tint for emphasis

  // Text Colors
  textPrimary: '#1F2937',       // Dark gray - primary text
  textSecondary: '#6B7280',     // Medium gray - secondary text
  textLight: '#9CA3AF',         // Light gray - helper text
  textWhite: '#FFFFFF',         // White text for dark backgrounds
  textAccent: '#002868',        // Blue text for emphasis

  // Status Colors
  success: '#10B981',           // Green - pass indicators, positive feedback
  successLight: '#D1FAE5',      // Light green background
  warning: '#F59E0B',           // Yellow/Orange - streaks, caution
  warningLight: '#FEF3C7',      // Light yellow background
  error: '#EF4444',             // Red - errors
  errorLight: '#FEE2E2',        // Light red background

  // Difficulty Colors
  difficultyEasy: '#10B981',    // Green for easy
  difficultyMedium: '#F59E0B',  // Yellow/Orange for medium
  difficultyHard: '#EF4444',    // Red for hard

  // Frequency Badge Colors
  frequencyDaily: '#3B82F6',    // Blue for daily
  frequencyWeekly: '#8B5CF6',   // Purple for weekly
  frequencyMonthly: '#EC4899',  // Pink for monthly

  // UI Elements
  border: '#E5E7EB',            // Light gray borders
  borderFocus: '#002868',       // Blue border for focus states
  shadow: '#000000',            // Shadow color (use with opacity)
  overlay: 'rgba(0, 0, 0, 0.5)', // Dark overlay for modals
  divider: '#E5E7EB',           // Divider lines

  // Interactive States
  pressed: 'rgba(0, 40, 104, 0.1)', // Light blue for pressed state
  disabled: '#9CA3AF',          // Gray for disabled elements
  disabledBackground: '#F3F4F6', // Background for disabled elements

  // Medal Colors (for leaderboard)
  gold: '#FFD700',
  silver: '#C0C0C0',
  bronze: '#CD7F32',
};

// Pre-defined shadow styles for consistent elevation
export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  small: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  large: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
};

// Gradient definitions (for reference - React Native needs LinearGradient)
export const gradients = {
  primary: ['#002868', '#1E40AF'],     // Primary blue gradient
  accent: ['#EF2B2D', '#DC2626'],      // Red gradient
  success: ['#10B981', '#059669'],     // Green gradient
  warning: ['#F59E0B', '#D97706'],     // Yellow/Orange gradient
};

// Helper function to get difficulty color
export const getDifficultyColor = (difficulty) => {
  // Handle both numeric (1, 2, 3) and string ('easy', 'medium', 'hard') difficulties
  if (typeof difficulty === 'number') {
    switch (difficulty) {
      case 1:
        return colors.difficultyEasy;
      case 2:
        return colors.difficultyMedium;
      case 3:
        return colors.difficultyHard;
      default:
        return colors.textSecondary;
    }
  }
  const difficultyLower = difficulty?.toLowerCase() || 'easy';
  switch (difficultyLower) {
    case 'easy':
      return colors.difficultyEasy;
    case 'medium':
      return colors.difficultyMedium;
    case 'hard':
      return colors.difficultyHard;
    default:
      return colors.textSecondary;
  }
};

// Helper function to get difficulty label
export const getDifficultyLabel = (difficulty) => {
  // Handle both numeric (1, 2, 3) and string difficulties
  if (typeof difficulty === 'number') {
    switch (difficulty) {
      case 1:
        return 'Easy';
      case 2:
        return 'Medium';
      case 3:
        return 'Hard';
      default:
        return 'Unknown';
    }
  }
  const difficultyLower = difficulty?.toLowerCase() || 'easy';
  switch (difficultyLower) {
    case 'easy':
    case 'lett':
      return 'Easy';
    case 'medium':
    case 'middels':
      return 'Medium';
    case 'hard':
    case 'vanskelig':
      return 'Hard';
    default:
      return difficulty;
  }
};

// Helper function to get frequency color
export const getFrequencyColor = (frequency) => {
  const frequencyLower = frequency?.toLowerCase() || 'daily';
  switch (frequencyLower) {
    case 'daily':
      return colors.frequencyDaily;
    case 'weekly':
      return colors.frequencyWeekly;
    case 'monthly':
      return colors.frequencyMonthly;
    default:
      return colors.textSecondary;
  }
};
