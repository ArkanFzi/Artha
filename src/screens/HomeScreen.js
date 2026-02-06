import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  RefreshControl,
  FlatList 
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS, BORDER_RADIUS } from '../styles/theme';
import { globalStyles } from '../styles/globalStyles';
import StatCard from '../components/StatCard';
import TransactionCard from '../components/TransactionCard';
import { getTransactions, getCategories } from '../utils/storage';
import { 
  formatCurrency, 
  getCurrentMonth,
  filterTransactionsByMonth,
  calculateTotalIncome,
  calculateTotalExpense,
  calculateBalance,
  groupExpensesByCategory
} from '../utils/calculations';

const HomeScreen = ({ navigation }) => {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [monthlyStats, setMonthlyStats] = useState({
    income: 0,
    expense: 0,
    balance: 0,
  });
  const [topCategory, setTopCategory] = useState(null);

  const loadData = async () => {
    try {
      const [transactionsData, categoriesData] = await Promise.all([
        getTransactions(),
        getCategories(),
      ]);
      
      setTransactions(transactionsData);
      setCategories(categoriesData);
      
      // Calculate monthly stats
      const currentMonth = getCurrentMonth();
      const monthlyTransactions = filterTransactionsByMonth(transactionsData, currentMonth);
      
      const income = calculateTotalIncome(monthlyTransactions);
      const expense = calculateTotalExpense(monthlyTransactions);
      const balance = calculateBalance(monthlyTransactions);
      
      setMonthlyStats({ income, expense, balance });
      
      // Get top spending category
      const categorySpending = groupExpensesByCategory(monthlyTransactions, categoriesData);
      if (categorySpending.length > 0) {
        setTopCategory(categorySpending[0]);
      }
    } catch (error) {
      console.error('Error loading data:', error);
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

  const recentTransactions = transactions
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  const getCategoryById = (id) => categories.find(c => c.id === id);

  return (
    <View style={globalStyles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <StatCard
            title="Pemasukan"
            value={formatCurrency(monthlyStats.income)}
            icon="💰"
            gradientColors={['#4CAF50', '#388E3C']}
          />
          <StatCard
            title="Pengeluaran"
            value={formatCurrency(monthlyStats.expense)}
            icon="💸"
            gradientColors={['#F44336', '#D32F2F']}
          />
        </View>
        
        <View style={styles.statsContainer}>
          <StatCard
            title="Saldo Bulan Ini"
            value={formatCurrency(monthlyStats.balance)}
            icon="💵"
            gradientColors={['#2196F3', '#1976D2']}
          />
          {topCategory && (
            <StatCard
              title="Terbanyak"
              value={`${topCategory.categoryIcon} ${topCategory.categoryName}`}
              icon="📊"
              gradientColors={['#FF9800', '#F57C00']}
            />
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Aksi Cepat</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: COLORS.primary }]}
              onPress={() => navigation.navigate('AddTransaction')}
            >
              <Text style={styles.actionIcon}>➕</Text>
              <Text style={styles.actionText}>Tambah Transaksi</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: COLORS.secondary }]}
              onPress={() => navigation.navigate('Budget')}
            >
              <Text style={styles.actionIcon}>💼</Text>
              <Text style={styles.actionText}>Kelola Budget</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: COLORS.accent }]}
              onPress={() => navigation.navigate('Report')}
            >
              <Text style={styles.actionIcon}>📈</Text>
              <Text style={styles.actionText}>Lihat Laporan</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: '#9C27B0' }]}
              onPress={() => navigation.navigate('Category')}
            >
              <Text style={styles.actionIcon}>🏷️</Text>
              <Text style={styles.actionText}>Kategori</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Transactions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Transaksi Terbaru</Text>
            {transactions.length > 5 && (
              <TouchableOpacity onPress={() => navigation.navigate('Report')}>
                <Text style={styles.seeAllText}>Lihat Semua</Text>
              </TouchableOpacity>
            )}
          </View>
          
          {recentTransactions.length > 0 ? (
            recentTransactions.map((transaction) => (
              <TransactionCard
                key={transaction.id}
                transaction={transaction}
                category={getCategoryById(transaction.categoryId)}
              />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📝</Text>
              <Text style={styles.emptyText}>Belum ada transaksi</Text>
              <Text style={styles.emptySubtext}>
                Mulai catat pemasukan dan pengeluaran Anda
              </Text>
            </View>
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
  statsContainer: {
    flexDirection: 'row',
    marginBottom: SPACING.sm,
  },
  section: {
    marginTop: SPACING.md,
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
  seeAllText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    fontWeight: FONT_WEIGHTS.semibold,
  },
  quickActions: {
    flexDirection: 'row',
    marginBottom: SPACING.sm,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: SPACING.xs,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 80,
  },
  actionIcon: {
    fontSize: 28,
    marginBottom: SPACING.xs,
  },
  actionText: {
    color: COLORS.textLight,
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.semibold,
    textAlign: 'center',
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
  },
});

export default HomeScreen;
