// Theme Registry
// Import and export all available themes here

import { defaultTheme } from './defaultTheme';
import { darkTheme } from './darkTheme';

// Add new themes to this array to make them available in the app
export const availableThemes = [
  defaultTheme,
  darkTheme,
  // Add more themes here:
  // oceanTheme,
  // forestTheme,
  // sunsetTheme,
];

// Get theme by ID
export const getThemeById = (themeId) => {
  return availableThemes.find(theme => theme.id === themeId) || defaultTheme;
};

// Default export
export { defaultTheme, darkTheme };
