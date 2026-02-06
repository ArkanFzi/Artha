import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS, BORDER_RADIUS, SHADOWS } from '../styles/theme';
import { formatCurrency, formatPercentage } from '../utils/calculations';

const InvestmentCard = ({ investmentData, onPress }) => {
  const { remainingBudget, percentage, recommended, suggestion } = investmentData;

  const getGradientColors = () => {
    if (suggestion.level === 'minimal') return ['#F44336', '#D32F2F'];
    if (suggestion.level === 'conservative') return ['#FF9800', '#F57C00'];
    if (suggestion.level === 'moderate') return ['#2196F3', '#1976D2'];
    return ['#4CAF50', '#388E3C'];
  };

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.9}>
      <LinearGradient
        colors={getGradientColors()}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.header}>
          <Text style={styles.title}>💼 Investasi</Text>
          <Text style={styles.percentage}>{formatPercentage(percentage)}</Text>
        </View>

        <View style={styles.content}>
          <Text style={styles.label}>Sisa Budget</Text>
          <Text style={styles.amount}>{formatCurrency(remainingBudget)}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.footer}>
          <Text style={styles.recommendLabel}>Rekomendasi Investasi:</Text>
          <Text style={styles.recommendAmount}>{formatCurrency(recommended)}</Text>
        </View>

        <View style={styles.suggestionBadge}>
          <Text style={styles.suggestionText}>{suggestion.title}</Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: SPACING.md,
    ...SHADOWS.large,
  },
  gradient: {
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    minHeight: 180,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textLight,
  },
  percentage: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textLight,
  },
  content: {
    marginBottom: SPACING.sm,
  },
  label: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textLight,
    opacity: 0.9,
    marginBottom: SPACING.xs,
  },
  amount: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textLight,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.textLight,
    opacity: 0.3,
    marginVertical: SPACING.md,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recommendLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textLight,
    opacity: 0.9,
  },
  recommendAmount: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textLight,
  },
  suggestionBadge: {
    marginTop: SPACING.md,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    alignSelf: 'flex-start',
  },
  suggestionText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.textLight,
  },
});

export default InvestmentCard;
