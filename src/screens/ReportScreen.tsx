import React, { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  RefreshControl, 
  Dimensions 
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { PieChart, BarChart } from 'react-native-chart-kit';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS, BORDER_RADIUS, SHADOWS } from '../styles/theme';
import TransactionCard from '../components/TransactionCard';
import StatCard from '../components/StatCard';
import { getTransactions, getCategories } from '../utils/storage';
import { exportToCSV, exportToTextReport, exportSummaryReport } from '../utils/exportService';
import { 
  formatCurrency,
  getCurrentMonth,
  getCurrentYear,
  filterTransactionsByToday,
  filterTransactionsByMonth,
  filterTransactionsByYear,
  calculateTotalIncome,
  calculateTotalExpense,
  groupExpensesByCategory,
  getMonthlySpendingTrend,
  getMonthName
} from '../utils/calculations';
import { getLast6MonthsTrend, getCategoryDistribution } from '../utils/aggregators';
import TrendChart from '../components/TrendChart';
import CategoryPieChart from '../components/CategoryPieChart';
import { NavigationProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Transaction, Category } from '../types';
import { useTheme } from '../contexts/ThemeContext';

const screenWidth = Dimensions.get('window').width;

interface ReportScreenProps {
  navigation: NavigationProp<RootStackParamList, 'Report'>;
}

const ReportScreen: React.FC<ReportScreenProps> = ({ navigation }) => {
  const { theme, isDark } = useTheme();
  const [viewMode, setViewMode] = useState<'summary' | 'analytics'>('summary');
  const [activeTab, setActiveTab] = useState<'daily' | 'monthly' | 'yearly'>('monthly');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const [transactionsData, categoriesData] = await Promise.all([
        getTransactions(),
        getCategories(),
      ]);
      setTransactions(transactionsData);
      setCategories(categoriesData);
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

  const getCategoryById = (id: string) => categories.find(c => c.id === id);

  const currentMonth = getCurrentMonth();
  const monthlyTransactions = filterTransactionsByMonth(transactions, currentMonth);
  const monthlyIncome = calculateTotalIncome(monthlyTransactions);
  const monthlyExpense = calculateTotalExpense(monthlyTransactions);
  const categorySpending = groupExpensesByCategory(monthlyTransactions, categories);

  const currentYear = getCurrentYear();
  const yearlyIncome = calculateTotalIncome(filterTransactionsByYear(transactions, currentYear));
  const yearlyExpense = calculateTotalExpense(filterTransactionsByYear(transactions, currentYear));
  
  const todayTransactions = filterTransactionsByToday(transactions);
  const todayIncome = calculateTotalIncome(todayTransactions);
  const todayExpense = calculateTotalExpense(todayTransactions);

  const chartConfig = {
    backgroundColor: theme.surface,
    backgroundGradientFrom: theme.surface,
    backgroundGradientTo: theme.surface,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(0, 217, 166, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(148, 163, 184, ${opacity})`,
    style: {
      borderRadius: BORDER_RADIUS.lg,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: theme.primary,
    },
  };

  const renderDailyReport = () => (
    <View>
      <View style={styles.statsGrid}>
        <StatCard title="Pemasukan" value={formatCurrency(todayIncome)} icon="💰" size="medium" />
        <StatCard title="Pengeluaran" value={formatCurrency(todayExpense)} icon="💸" size="medium" />
      </View>
      
      <View style={[styles.balanceBar, { backgroundColor: theme.surface }]}>
        <Text style={[styles.balanceLabel, { color: theme.textSecondary }]}>Saldo Hari Ini</Text>
        <Text style={[styles.balanceValue, { color: theme.primary }]}>
          {formatCurrency(todayIncome - todayExpense)}
        </Text>
      </View>

      <Text style={[styles.sectionTitle, { color: theme.text }]}>Transaksi Hari Ini</Text>
      <View style={[styles.transactionBox, { backgroundColor: theme.surface }]}>
        {todayTransactions.length > 0 ? (
          todayTransactions
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .map((transaction) => (
              <TransactionCard
                key={transaction.id}
                transaction={transaction}
                category={getCategoryById(transaction.categoryId)}
              />
            ))
        ) : (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyIcon}>📝</Text>
            <Text style={{ color: theme.textSecondary }}>Belum ada transaksi hari ini</Text>
          </View>
        )}
      </View>
    </View>
  );

  const renderMonthlyReport = () => {
    const pieChartData = categorySpending.slice(0, 5).map((cat) => ({
      name: cat.categoryName,
      population: cat.total,
      color: cat.categoryColor,
      legendFontColor: theme.textSecondary,
      legendFontSize: 12,
    }));

    return (
      <View>
        <View style={styles.statsGrid}>
          <StatCard title="Pemasukan" value={formatCurrency(monthlyIncome)} icon="💰" size="medium" />
          <StatCard title="Pengeluaran" value={formatCurrency(monthlyExpense)} icon="💸" size="medium" />
        </View>

        {pieChartData.length > 0 && (
          <View style={[styles.chartCard, { backgroundColor: theme.surface }]}>
            <Text style={[styles.chartTitle, { color: theme.text }]}>Distribusi Pengeluaran</Text>
            <PieChart
              data={pieChartData}
              width={screenWidth - 64}
              height={220}
              chartConfig={chartConfig}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="15"
              absolute
            />
          </View>
        )}

        <Text style={[styles.sectionTitle, { color: theme.text }]}>Detail Kategori</Text>
        <View style={[styles.transactionBox, { backgroundColor: theme.surface }]}>
          {categorySpending.map((cat) => (
            <View key={cat.categoryId} style={styles.categoryItem}>
              <View style={[styles.categoryIconWrap, { backgroundColor: `${cat.categoryColor}15` }]}>
                <Text style={{ fontSize: 24 }}>{cat.categoryIcon}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.categoryName, { color: theme.text }]}>{cat.categoryName}</Text>
                <Text style={{ color: theme.textSecondary, fontSize: 12 }}>{cat.count} transaksi</Text>
              </View>
              <Text style={[styles.categoryValue, { color: theme.text }]}>{formatCurrency(cat.total)}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderYearlyReport = () => {
    const monthlyTrend = getMonthlySpendingTrend(transactions, currentYear);
    const barChartData = {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'],
      datasets: [{ data: monthlyTrend }],
    };

    return (
      <View>
        <View style={styles.statsGrid}>
          <StatCard title="Income" value={formatCurrency(yearlyIncome)} icon="💰" size="medium" />
          <StatCard title="Expense" value={formatCurrency(yearlyExpense)} icon="💸" size="medium" />
        </View>

        {monthlyTrend.some(v => v > 0) && (
          <View style={[styles.chartCard, { backgroundColor: theme.surface }]}>
            <Text style={[styles.chartTitle, { color: theme.text }]}>Trend Pengeluaran {currentYear}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <BarChart
                data={barChartData}
                width={Math.max(screenWidth - 64, 800)}
                height={220}
                chartConfig={chartConfig}
                verticalLabelRotation={0}
                fromZero
                style={{ borderRadius: 16 }}
              />
            </ScrollView>
          </View>
        )}

        <Text style={[styles.sectionTitle, { color: theme.text }]}>Ringkasan Bulanan</Text>
        <View style={[styles.transactionBox, { backgroundColor: theme.surface }]}>
          {monthlyTrend.map((amount, index) => amount > 0 && (
            <View key={index} style={styles.monthRow}>
              <Text style={[styles.monthName, { color: theme.text }]}>{getMonthName(index)}</Text>
              <Text style={[styles.monthValue, { color: theme.text }]}>{formatCurrency(amount)}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* View Mode Header */}
      <View style={[styles.modeHeader, { backgroundColor: theme.surface }]}>
        <View style={[styles.modePill, { backgroundColor: theme.surfaceLight }]}>
          <TouchableOpacity 
            style={[styles.modeTab, viewMode === 'summary' && { backgroundColor: theme.primary }]}
            onPress={() => setViewMode('summary')}
          >
            <Text style={[styles.modeTabText, { color: viewMode === 'summary' ? COLORS.navy : theme.textSecondary }]}>Ringkasan</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.modeTab, viewMode === 'analytics' && { backgroundColor: theme.primary }]}
            onPress={() => setViewMode('analytics')}
          >
            <Text style={[styles.modeTabText, { color: viewMode === 'analytics' ? COLORS.navy : theme.textSecondary }]}>Analisis</Text>
          </TouchableOpacity>
        </View>
      </View>

      {viewMode === 'summary' && (
        <View style={[styles.activeTabContainer, { backgroundColor: theme.surface }]}>
          {['daily', 'monthly', 'yearly'].map((tab) => (
            <TouchableOpacity 
              key={tab}
              style={[styles.tabItem, activeTab === tab && { borderBottomColor: theme.primary }]}
              onPress={() => setActiveTab(tab as any)}
            >
              <Text style={[styles.tabItemText, { color: activeTab === tab ? theme.primary : theme.textSecondary }]}>
                {tab === 'daily' ? 'Harian' : tab === 'monthly' ? 'Bulanan' : 'Tahunan'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
      >
        {viewMode === 'summary' ? (
          <>
            <View style={styles.exportSection}>
              <Text style={[styles.exportTitle, { color: theme.textMuted }]}>EXPORT LAPORAN</Text>
              <View style={styles.exportGrid}>
                 {[
                   { label: 'CSV', icon: '📊', color: '#10B981', action: () => exportToCSV(transactions, categories) },
                   { label: 'PDF', icon: '📄', color: '#6366F1', action: () => exportToTextReport(transactions, categories) },
                   { label: 'SMRY', icon: '📈', color: '#F59E0B', action: () => exportSummaryReport(transactions, categories) },
                 ].map((btn, i) => (
                   <TouchableOpacity 
                    key={i} 
                    style={[styles.exportBtn, { backgroundColor: theme.surfaceLight }]}
                    onPress={btn.action}
                   >
                     <Text style={{ fontSize: 18, marginBottom: 4 }}>{btn.icon}</Text>
                     <Text style={[styles.exportBtnText, { color: theme.text }]}>{btn.label}</Text>
                   </TouchableOpacity>
                 ))}
              </View>
            </View>

            {activeTab === 'daily' && renderDailyReport()}
            {activeTab === 'monthly' && renderMonthlyReport()}
            {activeTab === 'yearly' && renderYearlyReport()}
          </>
        ) : (
          <View>
             {/* Analytics implementation using TrendChart and CategoryPieChart */}
             <TrendChart data={getLast6MonthsTrend(transactions).data} labels={getLast6MonthsTrend(transactions).labels} />
             <View style={{ height: 20 }} />
             <CategoryPieChart data={getCategoryDistribution(transactions, categories, getCurrentMonth()).data} />
             
             <View style={[styles.insightCard, { backgroundColor: theme.surfaceLight }]}>
               <Text style={[styles.insightTitle, { color: theme.primary }]}>💡 Insight Hari Ini</Text>
               <Text style={[styles.insightText, { color: theme.textSecondary }]}>
                 • Pengeluaran terbesar Anda bulan ini ada di kategori <Text style={{ fontWeight: '800', color: theme.text }}>{categorySpending[0]?.categoryName || 'N/A'}</Text>.
               </Text>
               <Text style={[styles.insightText, { color: theme.textSecondary, marginTop: 8 }]}>
                 • Rata-rata harian bulan ini: <Text style={{ fontWeight: '800', color: theme.text }}>{formatCurrency(monthlyExpense / 30)}</Text>.
               </Text>
             </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  modeHeader: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  modePill: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 100,
  },
  modeTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 100,
    alignItems: 'center',
  },
  modeTabText: {
    fontSize: 14,
    fontWeight: '700',
  },
  activeTabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  tabItem: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemText: {
    fontSize: 13,
    fontWeight: '700',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 100,
  },
  statsGrid: {
    flexDirection: 'row',
    marginHorizontal: -6,
    marginBottom: 20,
  },
  balanceBar: {
    padding: 20,
    borderRadius: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
    ...SHADOWS.small,
  },
  balanceLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  balanceValue: {
    fontSize: 20,
    fontWeight: '800',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  transactionBox: {
    borderRadius: 24,
    padding: 16,
    ...SHADOWS.small,
  },
  emptyWrap: {
    padding: 40,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  chartCard: {
    padding: 16,
    borderRadius: 24,
    marginBottom: 32,
    ...SHADOWS.small,
  },
  chartTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 16,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  categoryIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  categoryName: {
    fontSize: 15,
    fontWeight: '700',
  },
  categoryValue: {
    fontSize: 14,
    fontWeight: '800',
  },
  monthRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  monthName: {
    fontSize: 15,
    fontWeight: '600',
  },
  monthValue: {
    fontSize: 15,
    fontWeight: '800',
  },
  exportSection: {
    marginBottom: 32,
  },
  exportTitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  exportGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  exportBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 20,
    alignItems: 'center',
    ...SHADOWS.small,
  },
  exportBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  insightCard: {
    marginTop: 24,
    padding: 20,
    borderRadius: 24,
  },
  insightTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 12,
  },
  insightText: {
    fontSize: 13,
    lineHeight: 20,
  },
});

export default ReportScreen;
