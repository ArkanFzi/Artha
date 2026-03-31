import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS, BORDER_RADIUS } from '../styles/theme';
import { useTheme } from '../contexts/ThemeContext';
import { calculateBudgetUsage, getBudgetStatusColor, formatCurrency } from '../utils/calculations';
import { Category } from '../types';

interface BudgetProgressBarProps {
  category: Category;
  spent: number;
  budget: number;
}

const BudgetProgressBar: React.FC<BudgetProgressBarProps> = ({ category, spent, budget }) => {
  const { theme } = useTheme();
  const percentage = calculateBudgetUsage(spent, budget);
  const statusColor = getBudgetStatusColor(percentage);
  const remaining = Math.max(budget - spent, 0);

  return (
    <View style={[styles.container, { backgroundColor: theme.surface }]}>
      <View style={styles.header}>
        <View style={styles.categoryInfo}>
          <Text style={styles.icon}>{category.icon}</Text>
          <Text style={[styles.categoryName, { color: theme.text }]}>{category.name}</Text>
        </View>
        <Text style={[styles.amount, { color: theme.textSecondary }]}>{formatCurrency(spent)} / {formatCurrency(budget)}</Text>
      </View>
      
      <View style={[styles.progressBarContainer, { backgroundColor: theme.border }]}>
        <View 
          style={[
            styles.progressBar, 
            { 
              width: `${Math.min(percentage, 100)}%` as any,
              backgroundColor: statusColor 
            }
          ]} 
        />
      </View>
      
      <View style={styles.footer}>
        <Text style={[styles.percentage, { color: statusColor }]}>
          {percentage.toFixed(0)}%
        </Text>
        <Text style={[styles.remaining, { color: theme.textSecondary }]}>
          Sisa: {formatCurrency(remaining)}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
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
    flex: 1,
  },
  amount: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.medium,
  },
  progressBarContainer: {
    height: 8,
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
  },
});

export default BudgetProgressBar;
