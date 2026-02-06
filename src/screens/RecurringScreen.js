import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS, BORDER_RADIUS, SHADOWS } from '../styles/theme';
import { globalStyles } from '../styles/globalStyles';
import {
  getRecurringTransactions,
  deleteRecurringTransaction,
  toggleRecurringTransaction,
  getUpcomingRecurring,
} from '../utils/recurringService';
import { getCategories } from '../utils/storage';
import { formatCurrency, formatDate } from '../utils/calculations';

const RecurringScreen = ({ navigation }) => {
  const [recurrings, setRecurrings] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [categories, setCategories] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const [recurringsData, upcomingData, categoriesData] = await Promise.all([
        getRecurringTransactions(),
        getUpcomingRecurring(),
        getCategories(),
      ]);
      setRecurrings(recurringsData);
      setUpcoming(upcomingData);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error loading recurring data:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleToggle = async (id) => {
    try {
      await toggleRecurringTransaction(id);
      loadData();
    } catch (error) {
      Alert.alert('Error', 'Gagal mengubah status');
    }
  };

  const handleDelete = (id) => {
    Alert.alert(
      'Hapus Transaksi Berulang',
      'Yakin ingin menghapus transaksi berulang ini?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteRecurringTransaction(id);
              loadData();
              Alert.alert('Berhasil', 'Transaksi berulang dihapus');
            } catch (error) {
              Alert.alert('Error', 'Gagal menghapus');
            }
          },
        },
      ]
    );
  };

  const getFrequencyText = (frequency) => {
    const map = {
      daily: 'Harian',
      weekly: 'Mingguan',
      monthly: 'Bulanan',
    };
    return map[frequency] || frequency;
  };

  const getCategoryById = (id) => {
    return categories.find(c => c.id === id);
  };

  const renderRecurringCard = (recurring) => {
    const category = getCategoryById(recurring.categoryId);
    const isIncome = recurring.type === 'income';

    return (
      <View key={recurring.id} style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            {category && (
              <View style={[styles.categoryIcon, { backgroundColor: category.color }]}>
                <Text style={styles.categoryIconText}>{category.icon}</Text>
              </View>
            )}
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle}>{recurring.description}</Text>
              <Text style={styles.cardSubtitle}>
                {getFrequencyText(recurring.frequency)} • {category?.name || 'Pemasukan'}
              </Text>
            </View>
          </View>
          <Text style={[styles.amount, { color: isIncome ? COLORS.income : COLORS.expense }]}>
            {isIncome ? '+' : '-'} {formatCurrency(recurring.amount)}
          </Text>
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.statusBadge}>
            <Text style={[styles.statusText, { color: recurring.isActive ? COLORS.success : COLORS.textSecondary }]}>
              {recurring.isActive ? '✓ Aktif' : '⏸ Nonaktif'}
            </Text>
          </View>

          <View style={styles.cardActions}>
            <TouchableOpacity
              style={[styles.actionButton, styles.toggleButton]}
              onPress={() => handleToggle(recurring.id)}
            >
              <Text style={styles.actionButtonText}>{recurring.isActive ? '⏸' : '▶'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton]}
              onPress={() => handleDelete(recurring.id)}
            >
              <Text style={styles.actionButtonText}>🗑️</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={globalStyles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Upcoming Section */}
        {upcoming.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📅 Akan Datang (7 Hari)</Text>
            {upcoming.map(item => (
              <View key={item.id} style={styles.upcomingCard}>
                <Text style={styles.upcomingTitle}>{item.description}</Text>
                <Text style={styles.upcomingDate}>
                  {formatDate(item.nextDueDate)} • {formatCurrency(item.amount)}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* All Recurring Transactions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🔄 Transaksi Berulang</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => navigation.navigate('AddRecurring')}
            >
              <Text style={styles.addButtonText}>+ Tambah</Text>
            </TouchableOpacity>
          </View>

          {recurrings.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🔄</Text>
              <Text style={styles.emptyText}>Belum Ada Transaksi Berulang</Text>
              <Text style={styles.emptySubtext}>
                Buat transaksi berulang untuk otomatis mencatat gaji, tagihan, atau langganan
              </Text>
              <TouchableOpacity
                style={globalStyles.buttonPrimary}
                onPress={() => navigation.navigate('AddRecurring')}
              >
                <Text style={globalStyles.buttonText}>+ Buat Transaksi Berulang</Text>
              </TouchableOpacity>
            </View>
          ) : (
            recurrings.map(renderRecurringCard)
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    padding: SPACING.md,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
  },
  addButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
  },
  addButtonText: {
    color: COLORS.textLight,
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.semibold,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    ...SHADOWS.medium,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  categoryIconText: {
    fontSize: 20,
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.text,
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  amount: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    marginLeft: SPACING.sm,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  statusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.background,
  },
  statusText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.semibold,
  },
  cardActions: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: BORDER_RADIUS.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleButton: {
    backgroundColor: COLORS.background,
  },
  deleteButton: {
    backgroundColor: COLORS.background,
  },
  actionButtonText: {
    fontSize: 18,
  },
  upcomingCard: {
    backgroundColor: '#E3F2FD',
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  upcomingTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.semibold,
    color: '#1976D2',
    marginBottom: 2,
  },
  upcomingDate: {
    fontSize: FONT_SIZES.xs,
    color: '#1565C0',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: SPACING.md,
  },
  emptyText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  emptySubtext: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingHorizontal: SPACING.xl,
    marginBottom: SPACING.lg,
  },
});

export default RecurringScreen;
