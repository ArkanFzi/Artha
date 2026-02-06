import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS, BORDER_RADIUS, SHADOWS } from '../styles/theme';

const StatCard = ({ title, value, icon, gradientColors, onPress }) => {
  const content = (
    <LinearGradient
      colors={gradientColors || [COLORS.primary, COLORS.primaryDark]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    >
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>{icon}</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.value}>{value}</Text>
      </View>
    </LinearGradient>
  );

  if (onPress) {
    return (
      <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.8}>
        {content}
      </TouchableOpacity>
    );
  }

  return <View style={styles.container}>{content}</View>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginHorizontal: SPACING.xs,
    marginVertical: SPACING.xs,
    ...SHADOWS.medium,
  },
  gradient: {
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    minHeight: 120,
    justifyContent: 'space-between',
  },
  iconContainer: {
    alignSelf: 'flex-start',
  },
  icon: {
    fontSize: 32,
  },
  content: {
    marginTop: SPACING.sm,
  },
  title: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textLight,
    opacity: 0.9,
    fontWeight: FONT_WEIGHTS.medium,
  },
  value: {
    fontSize: FONT_SIZES.xl,
    color: COLORS.textLight,
    fontWeight: FONT_WEIGHTS.bold,
    marginTop: SPACING.xs,
  },
});

export default StatCard;
