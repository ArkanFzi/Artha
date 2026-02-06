import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS, BORDER_RADIUS, SHADOWS } from '../styles/theme';
import { formatCurrency, formatDateShort } from '../utils/calculations';

const TransactionCard = ({ transaction, category, onPress }) => {
  const isIncome = transaction.type === 'income';
  const amountColor = isIncome ? COLORS.income : COLORS.expense;
  const amountPrefix = isIncome ? '+' : '-';

  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.leftSection}>
        <View style={[styles.iconContainer, { backgroundColor: category?.color || COLORS.border }]}>
          <Text style={styles.icon}>{category?.icon || '📦'}</Text>
        </View>
        <View style={styles.details}>
          <Text style={styles.description} numberOfLines={1}>
            {transaction.description || 'No description'}
          </Text>
          <Text style={styles.category}>{category?.name || 'Unknown'}</Text>
          <Text style={styles.date}>{formatDateShort(transaction.date || transaction.createdAt)}</Text>
        </View>
      </View>
      <View style={styles.rightSection}>
        <Text style={[styles.amount, { color: amountColor }]}>
          {amountPrefix} {formatCurrency(transaction.amount)}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    ...SHADOWS.small,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  icon: {
    fontSize: 24,
  },
  details: {
    flex: 1,
  },
  description: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.text,
    marginBottom: 2,
  },
  category: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  date: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
  rightSection: {
    alignItems: 'flex-end',
    marginLeft: SPACING.sm,
  },
  amount: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
  },
});

export default TransactionCard;
