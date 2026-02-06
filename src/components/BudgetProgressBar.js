import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS, BORDER_RADIUS } from '../styles/theme';
import { calculateBudgetUsage, getBudgetStatusColor, formatCurrency } from '../utils/calculations';

const BudgetProgressBar = ({ category, spent, budget }) => {
  const percentage = calculateBudgetUsage(spent, budget);
  const statusColor = getBudgetStatusColor(percentage);
  const remaining = Math.max(budget - spent, 0);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.categoryInfo}>
          <Text style={styles.icon}>{category.icon}</Text>
          <Text style={styles.categoryName}>{category.name}</Text>
        </View>
        <Text style={styles.amount}>{formatCurrency(spent)} / {formatCurrency(budget)}</Text>
      </View>
      
      <View style={styles.progressBarContainer}>
        <View 
          style={[
            styles.progressBar, 
            { 
              width: `${Math.min(percentage, 100)}%`,
              backgroundColor: statusColor 
            }
          ]} 
        />
      </View>
      
      <View style={styles.footer}>
        <Text style={[styles.percentage, { color: statusColor }]}>
          {percentage.toFixed(0)}%
        </Text>
        <Text style={styles.remaining}>
          Sisa: {formatCurrency(remaining)}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    fontSize: 24,
    marginRight: SPACING.sm,
  },
  categoryName: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.text,
    flex: 1,
  },
  amount: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    fontWeight: FONT_WEIGHTS.medium,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: COLORS.border,
    borderRadius: BORDER_RADIUS.sm,
    overflow: 'hidden',
    marginBottom: SPACING.sm,
  },
  progressBar: {
    height: '100%',
    borderRadius: BORDER_RADIUS.sm,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  percentage: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.bold,
  },
  remaining: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
});

export default BudgetProgressBar;
