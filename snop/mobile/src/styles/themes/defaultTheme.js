// Default Theme - Norwegian Flag Inspired
// Primary colors derived from Norwegian flag (red, white, blue)

export const defaultTheme = {
  id: 'default',
  name: 'Norwegian Blue',
  description: 'Classic SNOP theme inspired by Norwegian colors',

  colors: {
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
  }
};
