import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeColors, ThemeContextType } from '../types';

const THEME_KEY = '@theme_preference';

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Light Theme (Premium)
export const lightTheme: ThemeColors = {
  background: '#F8F9FE',
  surface: '#FFFFFF',
  surfaceVariant: '#F0F2F5',
  primary: '#00D9A6',
  primaryDark: '#00A67E',
  primaryLight: '#E0F7FA',
  text: '#1A1F36',
  textSecondary: '#6B7280',
  textLight: '#FFFFFF',
  textDisabled: '#9CA3AF',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  border: '#E5E7EB',
  divider: '#F3F4F6',
  shadow: 'rgba(17, 12, 46, 0.08)',
  overlay: 'rgba(26, 31, 54, 0.5)',
  chartIncome: '#10B981',
  chartExpense: '#EF4444',
  chartBalance: '#3B82F6',
  income: '#10B981',
  expense: '#EF4444',
};

// Dark Theme (Premium Midnight)
export const darkTheme: ThemeColors = {
  background: '#0A0E27',
  surface: '#121836',
  surfaceVariant: '#1D2445',
  surfaceElevated: '#252B4E',
  primary: '#00E5FF',
  primaryDark: '#00B8D4',
  primaryLight: 'rgba(0, 229, 255, 0.1)',
  text: '#F3F4F6',
  textSecondary: '#94A3B8',
  textLight: '#FFFFFF',
  textDisabled: '#475569',
  success: '#34D399',
  warning: '#FBBF24',
  error: '#F87171',
  info: '#60A5FA',
  border: '#1D2445',
  borderStrong: '#2D3766',
  divider: '#161C3B',
  shadow: 'rgba(0, 0, 0, 0.5)',
  overlay: 'rgba(5, 7, 20, 0.8)',
  chartIncome: '#34D399',
  chartExpense: '#F87171',
  chartBalance: '#60A5FA',
  cardBackground: '#121836',
  cardBackgroundElevated: '#1D2445',
  income: '#34D399',
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
