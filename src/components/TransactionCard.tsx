import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { formatCurrency } from '../utils/currency';
import { formatDateShort } from '../utils/calculations';
import { Transaction, Category } from '../types';
import { BORDER_RADIUS, FONT_SIZES, FONT_WEIGHTS, SPACING } from '../styles/theme';

interface TransactionCardProps {
  transaction: Transaction;
  category?: Category;
  onPress?: () => void;
}

const TransactionCard: React.FC<TransactionCardProps> = ({ transaction, category, onPress }) => {
  const { theme } = useTheme();
  const isIncome = transaction.type === 'income';
  
  const containerStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.divider,
  };

  const iconBackgroundColor = category?.color ? `${category.color}15` : theme.surfaceLight;

  return (
    <TouchableOpacity 
      style={containerStyle} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: iconBackgroundColor, borderColor: category?.color || theme.border, borderWidth: 1 }]}>
        <Text style={styles.icon}>{category?.icon || '📦'}</Text>
      </View>

      <View style={styles.details}>
        <View style={styles.topRow}>
          <Text style={[styles.description, { color: theme.text }]} numberOfLines={1}>
            {transaction.description || category?.name || 'Transaksi'}
          </Text>
          <Text 
            style={[
              styles.amount, 
              { color: isIncome ? theme.income : theme.text }
            ]}
          >
            {isIncome ? '+' : '-'} {formatCurrency(transaction.amount, transaction.currency)}
          </Text>
        </View>

        <View style={styles.bottomRow}>
          <Text style={[styles.category, { color: theme.textSecondary }]}>
            {category?.name || 'Umum'} • {formatDateShort(transaction.date || transaction.createdAt)}
          </Text>
          {transaction.isRecurring && (
            <Text style={[styles.recurringIcon, { color: theme.primary }]}>🔄</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 1,
  },
  icon: {
    fontSize: 24,
  },
  details: {
    flex: 1,
    justifyContent: 'center',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  description: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold as any,
    flex: 1,
    marginRight: 8,
  },
  amount: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.black as any,
  },
  category: {
    fontSize: FONT_SIZES.sm - 1,
    fontWeight: FONT_WEIGHTS.medium as any,
  },
  recurringIcon: {
    fontSize: 10,
    marginLeft: 6,
  },
});

export default TransactionCard;
