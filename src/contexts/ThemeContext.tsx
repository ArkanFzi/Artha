import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeColors, ThemeContextType } from '../types';

const THEME_KEY = '@theme_preference';

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Light Theme (Premium Clean)
export const lightTheme: ThemeColors = {
  background: '#F8F9FE',
  surface: '#FFFFFF',
  surfaceLight: '#F3F4F9',
  surfaceVariant: '#E2E8F0',
  primary: '#00D9A6',
  primaryDark: '#00897B',
  primaryLight: '#B2F5E5',
  secondary: '#6366F1',
  accent: '#F59E0B',
  text: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  textLight: '#FFFFFF',
  textDisabled: '#CBD5E1',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  border: 'rgba(15, 23, 42, 0.08)',
  divider: 'rgba(15, 23, 42, 0.05)',
  shadow: 'rgba(15, 23, 42, 0.08)',
  overlay: 'rgba(15, 23, 42, 0.4)',
  chartIncome: '#10B981',
  chartExpense: '#EF4444',
  chartBalance: '#6366F1',
  income: '#10B981',
  expense: '#EF4444',
};

// Dark Theme (Premium Midnight)
export const darkTheme: ThemeColors = {
  background: '#0A0E27',
  surface: '#1A1F3A',
  surfaceLight: '#2A3052',
  surfaceVariant: '#313963',
  primary: '#00D9A6',
  primaryDark: '#00897B',
  primaryLight: 'rgba(0, 217, 166, 0.15)',
  secondary: '#818CF8',
  accent: '#FBBF24',
  text: '#FFFFFF',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  textLight: '#FFFFFF',
  textDisabled: '#334155',
  success: '#10B981',
  warning: '#FBBF24',
  error: '#F87171',
  info: '#60A5FA',
  border: 'rgba(255, 255, 255, 0.1)',
  divider: 'rgba(255, 255, 255, 0.05)',
  shadow: 'rgba(0, 0, 0, 0.5)',
  overlay: 'rgba(0, 0, 0, 0.7)',
  chartIncome: '#10B981',
  chartExpense: '#F87171',
  chartBalance: '#818CF8',
  income: '#10B981',
  expense: '#F87171',
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [isDark, setIsDark] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

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

  const value: ThemeContextType = {
    theme,
    isDark,
    toggleTheme,
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
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

export default ThemeContext;
