import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS, BORDER_RADIUS } from '../styles/theme';
import { formatCurrency, formatPercentage } from '../utils/calculations';
import { InvestmentRecommendation, InvestmentSuggestion } from '../types';

interface InvestmentCardProps {
  investmentData: InvestmentRecommendation & { suggestion: InvestmentSuggestion };
  onPress: () => void;
}

const InvestmentCard: React.FC<InvestmentCardProps> = ({ investmentData, onPress }) => {
  const { remainingBudget, percentage, recommended, suggestion } = investmentData;

  const getGradientColors = (): [string, string, ...string[]] => {
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
    fontSize: FONT_SIZES.lg as any,
    fontWeight: FONT_WEIGHTS.bold as any,
    color: COLORS.textLight as string,
  },
  percentage: {
    fontSize: FONT_SIZES.xl as any,
    fontWeight: FONT_WEIGHTS.bold as any,
    color: COLORS.textLight as string,
  },
  content: {
    marginBottom: SPACING.sm,
  },
  label: {
    fontSize: FONT_SIZES.sm as any,
    color: COLORS.textLight as string,
    opacity: 0.9,
    marginBottom: SPACING.xs,
  },
  amount: {
    fontSize: FONT_SIZES.xxl as any,
    fontWeight: FONT_WEIGHTS.bold as any,
    color: COLORS.textLight as string,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.textLight as string,
    opacity: 0.3,
    marginVertical: SPACING.md,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recommendLabel: {
    fontSize: FONT_SIZES.sm as any,
    color: COLORS.textLight as string,
    opacity: 0.9,
  },
  recommendAmount: {
    fontSize: FONT_SIZES.lg as any,
    fontWeight: FONT_WEIGHTS.bold as any,
    color: COLORS.textLight as string,
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
    fontSize: FONT_SIZES.xs as any,
    fontWeight: FONT_WEIGHTS.semibold as any,
    color: COLORS.textLight as string,
  },
});

export default InvestmentCard;
