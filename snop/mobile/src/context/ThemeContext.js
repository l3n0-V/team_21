import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { defaultTheme } from '../styles/themes';
import { getThemeById } from '../styles/themes';

const ThemeContext = createContext();

const THEME_STORAGE_KEY = '@snop_theme_preference';

export const ThemeProvider = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState(defaultTheme);
  const [isLoading, setIsLoading] = useState(true);

  // Load saved theme preference on mount
  useEffect(() => {
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      const savedThemeId = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedThemeId) {
        const theme = getThemeById(savedThemeId);
        setCurrentTheme(theme);
      }
    } catch (error) {
      console.error('Failed to load theme preference:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const changeTheme = async (themeId) => {
    try {
      const newTheme = getThemeById(themeId);
      setCurrentTheme(newTheme);
      await AsyncStorage.setItem(THEME_STORAGE_KEY, themeId);
    } catch (error) {
      console.error('Failed to save theme preference:', error);
    }
  };

  const value = {
    theme: currentTheme,
    colors: currentTheme.colors,
    changeTheme,
    isLoading,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeContext;
