import { ViewStyle } from 'react-native';

/**
 * Modern Fintech Design System
 * Palette: Deep Navy, Emerald Teal, and vibrant functional colors
 */
export const COLORS = {
  // Primary - Emerald Fintech
  primary: '#00D9A6',
  primaryDark: '#00897B',
  primaryLight: '#B2F5E5',
  
  // Neutral - Deep Navy
  navy: '#0A0E27',
  navyLight: '#1A1F3A',
  navyLighter: '#2A3052',

  // Secondary & Accents
  secondary: '#6366F1', // Indigo
  accent: '#F59E0B',    // Amber
  
  // Functional
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#3B82F6',

  // UI Surfaces
  background: '#0A0E27', // Deep Navy Background by default
  surface: '#1A1F3A',    // Lighter Navy Surface
  surfaceLight: '#2A3052',
  
  // Text
  text: '#FFFFFF',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  textLight: '#FFFFFF',
  
  // Borders
  border: 'rgba(255, 255, 255, 0.1)',
  borderLight: 'rgba(255, 255, 255, 0.05)',
  
  // Specific
  income: '#10B981',
  expense: '#EF4444',
  headerBackground: '#0D5D56', // Forest Green for the new header

  // Absolute
  white: '#FFFFFF',
  black: '#000000',
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const FONT_SIZES = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 24,
  xxl: 32,
  xxxl: 40,
} as const;

export type FontWeight = '400' | '500' | '600' | '700' | '800';

export const FONT_WEIGHTS: Record<string, FontWeight> = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  black: '800',
};

export const SHADOWS: Record<'small' | 'medium' | 'large' | 'premium', ViewStyle> = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 12,
  },
  premium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 30,
    elevation: 15,
  }
};

export const BORDER_RADIUS = {
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  round: 999,
} as const;
