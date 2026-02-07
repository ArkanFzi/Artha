import { ViewStyle } from 'react-native';

export const COLORS = {
  primary: '#00BFA6',
  primaryDark: '#00897B',
  primaryLight: '#64FFDA',
  secondary: '#2196F3',
  secondaryDark: '#1976D2',
  accent: '#FF9800',
  success: '#4CAF50',
  warning: '#FFC107',
  danger: '#F44336',
  background: '#F5F5F5',
  surface: '#FFFFFF',
  text: '#212121',
  textSecondary: '#757575',
  textLight: '#FFFFFF',
  border: '#E0E0E0',
  income: '#4CAF50',
  expense: '#F44336',
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
} as const;

export type FontWeight = '400' | '500' | '600' | '700';

export const FONT_WEIGHTS: Record<string, FontWeight> = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
};

export const SHADOWS: Record<'small' | 'medium' | 'large', ViewStyle> = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
};

export const BORDER_RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  round: 999,
} as const;
