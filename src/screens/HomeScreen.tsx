import React, { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  RefreshControl,
  TextStyle,
  ViewStyle
} from 'react-native';
import { useFocusEffect, NavigationProp } from '@react-navigation/native';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS } from '../styles/theme';
import { useTheme } from '../contexts/ThemeContext';
import ArthaLogo from '../components/ArthaLogo';
import StatCard from '../components/StatCard';
import TransactionCard from '../components/TransactionCard';
import { getTransactions, getCategories } from '../utils/storage';
import { initializeRecurringService } from '../utils/recurringService';
import { 
  formatCurrency, 
  getCurrentMonth,
  filterTransactionsByMonth,
  calculateTotalIncome,
  calculateTotalExpense,
  calculateBalance,
  groupExpensesByCategory,
  GroupedCategory
} from '../utils/calculations';
import { Transaction, Category } from '../types';

interface HomeScreenProps {
  navigation: NavigationProp<any>;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { theme, isDark } = useTheme();
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [monthlyStats, setMonthlyStats] = useState({
    income: 0,
    expense: 0,
    balance: 0,
  });
  const [topCategory, setTopCategory] = useState<GroupedCategory | null>(null);

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
      
      // Initialize recurring transactions
      try {
        await (initializeRecurringService as any)();
      } catch (recurringError) {
        console.error('Error initializing recurring service:', recurringError);
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

  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const getCategoryById = (id: string) => categories.find(c => c.id === id);

  const dynamicStyles = {
    container: {
      flex: 1,
      backgroundColor: theme.background,
    } as ViewStyle,
    sectionTitle: {
      fontSize: FONT_SIZES.lg,
      fontWeight: FONT_WEIGHTS.bold,
      color: theme.text,
    } as TextStyle,
    seeAllText: {
      fontSize: FONT_SIZES.sm,
      color: theme.primary,
      fontWeight: FONT_WEIGHTS.semibold,
    } as TextStyle,
    emptyText: {
      fontSize: FONT_SIZES.lg,
      fontWeight: FONT_WEIGHTS.semibold,
      color: theme.text,
      marginBottom: SPACING.xs,
    } as TextStyle,
    emptySubtext: {
      fontSize: FONT_SIZES.sm,
      color: theme.textSecondary,
      textAlign: 'center',
    } as TextStyle,
  };

  return (
    <View style={dynamicStyles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.primary]} />
        }
      >
      <View style={styles.sectionHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ marginRight: 10 }}>
            <ArthaLogo size={28} />
          </View>
          <View>
            <Text style={[styles.appTitle, { color: theme.text }]}>Artha</Text>
            <Text style={[styles.appTagline, { color: theme.textSecondary }]}>Kelola Kekayaan dengan Bijak</Text>
          </View>
        </View>
      </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <StatCard
            title="Total Pemasukan"
            value={formatCurrency(monthlyStats.income)}
            subtitle={`Bulan ${new Date().toLocaleDateString('id-ID', { month: 'long' })}`}
            icon="💰"
            size="medium"
          />
          <StatCard
            title="Pengeluaran"
            value={formatCurrency(monthlyStats.expense)}
            subtitle={`${transactions.filter(t => t.type === 'expense').length} transaksi`}
            icon="💸"
            size="medium"
          />
        </View>
        
        <View style={styles.statsContainer}>
          <StatCard
            title="Saldo Bulan Ini"
            value={formatCurrency(monthlyStats.balance)}
            subtitle={monthlyStats.balance >= 0 ? 'Surplus ✓' : 'Defisit ⚠️'}
            icon="💵"
            size="medium"
            gradientColors={
              monthlyStats.balance >= 0 
                ? ['#2196F3', '#1976D2'] 
                : ['#FF9800', '#F57C00']
            }
          />
          {topCategory && (
            <StatCard
              title="Terbanyak"
              value={topCategory.categoryName}
              subtitle={formatCurrency(topCategory.total)}
              icon={topCategory.categoryIcon}
              size="medium"
            />
          )}
        </View>

        {/* Quick Actions - Action Pills Strip */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Aksi Cepat</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            style={{ marginHorizontal: -16, paddingHorizontal: 16 }}
            contentContainerStyle={{ paddingBottom: 4 }}
          >
            {[
              { label: 'Tambah', icon: '➕', color: theme.primary, action: () => navigation.navigate('AddTransaction') },
              { label: 'Budget', icon: '💼', color: '#8B5CF6', action: () => navigation.navigate('Budget') },
              { label: 'Laporan', icon: '📈', color: '#F59E0B', action: () => navigation.navigate('Report') },
              { label: 'Kategori', icon: '🏷️', color: '#EC4899', action: () => navigation.navigate('Category') },
              { label: 'Rutin', icon: '🔄', color: '#10B981', action: () => (navigation.navigate as any)('Recurring') },
              { label: 'Goals', icon: '🎯', color: '#EF4444', action: () => (navigation.navigate as any)('Goals') },
              { label: 'Settings', icon: '⚙️', color: '#6B7280', action: () => navigation.navigate('Settings') },
            ].map((item, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.actionPill, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#FFFFFF', borderColor: isDark ? theme.border : '#F3F4F6' }]}
                onPress={item.action}
              >
                <View style={[styles.actionIconContainer, { backgroundColor: `${item.color}15` }]}>
                  <Text style={{ fontSize: 18, color: item.color }}>{item.icon}</Text>
                </View>
                <Text style={[styles.actionPillText, { color: theme.text }]}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Recent Transactions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Transaksi Terbaru</Text>
            {transactions.length > 5 && (
              <TouchableOpacity onPress={() => (navigation.navigate as any)('Transactions')}>
                <Text style={dynamicStyles.seeAllText}>Lihat Semua</Text>
              </TouchableOpacity>
            )}
          </View>
          
          {recentTransactions.length > 0 ? (
            recentTransactions.map((transaction) => (
              <TransactionCard
                key={transaction.id}
                transaction={transaction}
                category={getCategoryById(transaction.categoryId)}
                onPress={() => (navigation.navigate as any)('AddTransaction', { transaction })}
              />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📝</Text>
              <Text style={dynamicStyles.emptyText}>Belum ada transaksi</Text>
              <Text style={dynamicStyles.emptySubtext}>
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
    padding: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  section: {
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  appTitle: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  appTagline: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.text as string,
    letterSpacing: -0.3,
  },
  seeAllText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary as string,
    fontWeight: FONT_WEIGHTS.semibold,
  },
  actionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 30,
    borderWidth: 1,
    marginRight: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    height: 50,
  },
  actionIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  actionPillText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.semibold,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.text as string,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary as string,
    textAlign: 'center',
  },
});

export default HomeScreen;
