import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const THEME_KEY = '@theme_preference';

const ThemeContext = createContext();

// Light Theme (Premium)
export const lightTheme = {
  // Background colors
  background: '#F8F9FE',         // Cool light gray, almost white
  surface: '#FFFFFF',
  surfaceVariant: '#F0F2F5',     // Subtle contrast for cards
  
  // Primary colors
  primary: '#00D9A6',            // Vibrant Teal
  primaryDark: '#00A67E',
  primaryLight: '#E0F7FA',       // Very light teal for backgrounds
  
  // Text colors
  text: '#1A1F36',               // Deep Navy for text (softer than black)
  textSecondary: '#6B7280',      // Cool Gray
  textLight: '#FFFFFF',
  textDisabled: '#9CA3AF',
  
  // Status colors
  success: '#10B981',            // Emerald
  warning: '#F59E0B',            // Amber
  error: '#EF4444',              // Red
  info: '#3B82F6',               // Blue
  
  // UI colors
  border: '#E5E7EB',
  divider: '#F3F4F6',
  shadow: 'rgba(17, 12, 46, 0.08)', // Premium soft shadow
  overlay: 'rgba(26, 31, 54, 0.5)',
  
  // Chart colors
  chartIncome: '#10B981',
  chartExpense: '#EF4444',
  chartBalance: '#3B82F6',
};

// Dark Theme (Premium Midnight)
export const darkTheme = {
  // Background colors
  background: '#0A0E27',        // Deep Midnight Blue
  surface: '#121836',           // Slightly lighter blue-black
  surfaceVariant: '#1D2445',    // For elevated cards
  surfaceElevated: '#252B4E',   // For modals
  
  // Primary colors
  primary: '#00E5FF',           // Cyan-Teal (Neon glow effect)
  primaryDark: '#00B8D4',
  primaryLight: 'rgba(0, 229, 255, 0.1)',
  
  // Text colors
  text: '#F3F4F6',              // Cool White
  textSecondary: '#94A3B8',     // Blue-Gray
  textLight: '#FFFFFF',
  textDisabled: '#475569',
  
  // Status colors (Neon/Bright for dark mode)
  success: '#34D399',
  warning: '#FBBF24',
  error: '#F87171',
  info: '#60A5FA',
  
  // UI colors
  border: '#1D2445',
  borderStrong: '#2D3766',
  divider: '#161C3B',
  shadow: 'rgba(0, 0, 0, 0.5)',
  overlay: 'rgba(5, 7, 20, 0.8)',
  
  // Chart colors
  chartIncome: '#34D399',
  chartExpense: '#F87171',
  chartBalance: '#60A5FA',
  
  // Card specific
  cardBackground: '#121836',
  cardBackgroundElevated: '#1D2445',
};

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load theme preference on mount
  useEffect(() => {
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_KEY);
      if (savedTheme !== null) {
        setIsDark(savedTheme === 'dark');
      }
    } catch (error) {
      console.error('Error loading theme preference:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTheme = async () => {
    try {
      const newTheme = !isDark;
      setIsDark(newTheme);
      await AsyncStorage.setItem(THEME_KEY, newTheme ? 'dark' : 'light');
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  const theme = isDark ? darkTheme : lightTheme;

  const value = {
    theme,
    isDark,
    toggleTheme,
    isLoading,
  };

  // Don't block rendering - just use default theme while loading
  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

export default ThemeContext;
