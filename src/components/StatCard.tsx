import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

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
  const { theme, isDark } = useTheme();

  const backgroundColor = isDark ? theme.surfaceVariant : theme.surface;
  const borderColor = isDark ? theme.border : '#F3F4F6';
  const textColor = theme.text;
  const subTextColor = theme.textSecondary;

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return { iconSize: 18, valueSize: 18, titleSize: 11, padding: 12, fullWidth: false };
      case 'large':
        return { iconSize: 28, valueSize: 28, titleSize: 14, padding: 18, fullWidth: false };
      case 'full':
        return { iconSize: 24, valueSize: 24, titleSize: 13, padding: 16, fullWidth: true };
      default: // medium
        return { iconSize: 20, valueSize: 22, titleSize: 12, padding: 14, fullWidth: false };
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
            <View style={[styles.iconContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F0F2F5' }]}>
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
            <Text style={[styles.title, { fontSize: sizeStyles.titleSize, color: subTextColor }]} numberOfLines={1}>{title}</Text>
            {subtitle && (
              <View style={[styles.subtitleBadge, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F9FAFB' }]}>
                <Text style={[styles.subtitle, { color: theme.success }]} numberOfLines={1}>{subtitle}</Text>
              </View>
            )}
          </View>
        </>
      ) : (
        <View style={styles.horizontalLayout}>
          <View style={[styles.iconContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F0F2F5', marginRight: 16 }]}>
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
              <View style={[styles.miniBadge, { backgroundColor: isDark ? 'rgba(52, 211, 153, 0.1)' : '#ECFDF5' }]}>
                <Text style={[styles.miniBadgeText, { color: theme.success }]}>{subtitle}</Text>
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
      <TouchableOpacity style={containerStyle} onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }

  return <View style={containerStyle}>{content}</View>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    margin: 4,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  containerFull: {
    flex: undefined,
    width: '100%',
    marginHorizontal: 0,
    marginBottom: 8,
  },
  card: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
  },
  cardHorizontal: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    padding: 16,
    minHeight: 85,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    textAlign: 'center',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    opacity: 0.7,
  },
  content: {
  },
  value: {
    fontWeight: '700',
    marginBottom: 2,
    letterSpacing: -0.5,
  },
  title: {
    fontWeight: '500',
    opacity: 0.8,
  },
  subtitleBadge: {
    marginTop: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  subtitle: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  horizontalLayout: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  miniBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 100,
  },
  miniBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
});

export default StatCard;
