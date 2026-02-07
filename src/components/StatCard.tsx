import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { BORDER_RADIUS, COLORS, FONT_SIZES, FONT_WEIGHTS, SHADOWS, SPACING } from '../styles/theme';

const screenWidth = Dimensions.get('window').width;

export type StatCardSize = 'small' | 'medium' | 'large' | 'full';
export type StatCardLayout = 'vertical' | 'horizontal';

interface StatCardProps {
  title: string;
  value: string;
  icon: string | React.ReactNode;
  color?: string;
  gradientColors?: string[];
  onPress?: () => void;
  subtitle?: string;
  size?: StatCardSize;
  layout?: StatCardLayout;
}

const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  icon, 
  color,
  gradientColors,
  onPress,
  subtitle,
  size = 'medium',
  layout = 'vertical'
}) => {
  const { theme } = useTheme();

  const backgroundColor = theme.surface;
  const borderColor = theme.border;
  const textColor = theme.text;
  const subTextColor = theme.textSecondary;

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return { iconSize: 18, valueSize: 18, titleSize: 11, padding: 12, fullWidth: false };
      case 'large':
        return { iconSize: 28, valueSize: 28, titleSize: 14, padding: 20, fullWidth: false };
      case 'full':
        return { iconSize: 24, valueSize: 24, titleSize: 13, padding: 18, fullWidth: true };
      default: // medium
        return { iconSize: 20, valueSize: 22, titleSize: 12, padding: 16, fullWidth: false };
    }
  };

  const sizeStyles = getSizeStyles();

  const content = (
    <View style={[
      styles.card, 
      { 
        backgroundColor, 
        borderColor,
      },
      layout === 'horizontal' && styles.cardHorizontal
    ]}>
      {layout === 'vertical' ? (
        <>
          <View style={styles.header}>
            <View style={[styles.iconContainer, { backgroundColor: theme.surfaceLight }]}>
              {typeof icon === 'string' ? (
                <Text style={[styles.icon, { fontSize: sizeStyles.iconSize }]}>{icon}</Text>
              ) : (
                icon
              )}
            </View>
            <View style={[styles.dot, { backgroundColor: color || gradientColors?.[0] || theme.primary }]} />
          </View>
          
          <View style={styles.content}>
            <Text style={[styles.value, { fontSize: sizeStyles.valueSize, color: textColor }]} numberOfLines={1}>
              {value}
            </Text>
            <Text style={[styles.title, { fontSize: sizeStyles.titleSize, color: subTextColor }]} numberOfLines={1}>
              {title}
            </Text>
            {subtitle && (
              <View style={[styles.subtitleBadge, { backgroundColor: theme.surfaceLight }]}>
                <Text style={[styles.subtitle, { color: theme.primary }]} numberOfLines={1}>{subtitle}</Text>
              </View>
            )}
          </View>
        </>
      ) : (
        <View style={styles.horizontalLayout}>
          <View style={[styles.iconContainer, { backgroundColor: theme.surfaceLight, marginRight: 16 }]}>
            {typeof icon === 'string' ? (
              <Text style={[styles.icon, { fontSize: sizeStyles.iconSize }]}>{icon}</Text>
            ) : (
              icon
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: subTextColor, marginBottom: 4 }]} numberOfLines={1}>{title}</Text>
            <Text style={[styles.value, { fontSize: sizeStyles.valueSize, color: textColor }]} numberOfLines={1}>
              {value}
            </Text>
          </View>
           {subtitle && (
              <View style={[styles.miniBadge, { backgroundColor: theme.primaryLight }]}>
                <Text style={[styles.miniBadgeText, { color: theme.primaryDark }]}>{subtitle}</Text>
              </View>
            )}
        </View>
      )}
    </View>
  );

  const containerStyle = [
    styles.container,
    sizeStyles.fullWidth && styles.containerFull
  ];

  if (onPress) {
    return (
      <TouchableOpacity style={containerStyle} onPress={onPress} activeOpacity={0.8}>
        {content}
      </TouchableOpacity>
    );
  }

  return <View style={containerStyle}>{content}</View>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    margin: 6,
    borderRadius: BORDER_RADIUS.lg,
    ...SHADOWS.medium,
  },
  containerFull: {
    flex: undefined,
    width: '100%',
    marginHorizontal: 0,
    marginBottom: 12,
  },
  card: {
    borderRadius: BORDER_RADIUS.lg,
    padding: 16,
    borderWidth: 1,
  },
  cardHorizontal: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    padding: 16,
    minHeight: 90,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    textAlign: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    opacity: 0.8,
  },
  content: {
  },
  value: {
    fontWeight: FONT_WEIGHTS.black as any,
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  title: {
    fontWeight: FONT_WEIGHTS.semibold as any,
    opacity: 0.9,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontSize: 10,
  },
  subtitleBadge: {
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  subtitle: {
    fontSize: 11,
    fontWeight: FONT_WEIGHTS.bold as any,
  },
  horizontalLayout: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  miniBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 100,
  },
  miniBadgeText: {
    fontSize: 11,
    fontWeight: FONT_WEIGHTS.bold as any,
  },
});

export default StatCard;
