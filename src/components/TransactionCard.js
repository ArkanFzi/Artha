import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS, BORDER_RADIUS, SHADOWS } from '../styles/theme';
import { useTheme } from '../contexts/ThemeContext';
import { formatCurrency } from '../utils/currency';
import { formatDateShort } from '../utils/calculations';

const TransactionCard = ({ transaction, category, onPress }) => {
  const { theme, isDark } = useTheme();
  const isIncome = transaction.type === 'income';
  
  // Minimalist, no heavy borders
  // Background is transparent or very subtle to blend with list
  
  const containerStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    marginHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: theme.divider,
  };

  const iconBackgroundColor = category?.color ? 
    (isDark ? `${category.color}20` : `${category.color}15`) : 
    (isDark ? 'rgba(255,255,255,0.05)' : '#F3F4F6');

  return (
    <TouchableOpacity 
      style={containerStyle} 
      onPress={onPress}
      activeOpacity={0.6}
    >
      {/* Icon with soft background */}
      <View style={[styles.iconContainer, { backgroundColor: iconBackgroundColor }]}>
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
              { color: isIncome ? theme.success : theme.text }
            ]}
          >
            {isIncome ? '+' : ''} {formatCurrency(transaction.amount, transaction.currency)}
          </Text>
        </View>

        <View style={styles.bottomRow}>
          <Text style={[styles.category, { color: theme.textSecondary }]}>
            {category?.name || 'Umum'} • {formatDateShort(transaction.date || transaction.createdAt)}
          </Text>
          {transaction.photoUri && (
             <Text style={{ fontSize: 10, marginLeft: 4 }}>📸</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16, // Softer radius
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  icon: {
    fontSize: 22,
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
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  amount: {
    fontSize: 16,
    fontWeight: '700',
  },
  category: {
    fontSize: 13,
    fontWeight: '500',
  },
});

export default TransactionCard;
