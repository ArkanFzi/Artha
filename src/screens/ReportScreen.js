import React, { useState, useEffect, useCallback } from 'react';
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
import { LineChart, PieChart, BarChart } from 'react-native-chart-kit';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS, BORDER_RADIUS, SHADOWS } from '../styles/theme';
import { globalStyles } from '../styles/globalStyles';
import TransactionCard from '../components/TransactionCard';
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

const screenWidth = Dimensions.get('window').width;

const ReportScreen = ({ navigation }) => {
  const [viewMode, setViewMode] = useState('summary'); // 'summary', 'analytics'
  const [activeTab, setActiveTab] = useState('monthly'); // 'daily', 'monthly', 'yearly'
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
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

  const handleExportCSV = async () => {
    await exportToCSV(transactions, categories);
  };

  const handleExportReport = async () => {
    await exportToTextReport(transactions, categories);
  };

  const handleExportSummary = async () => {
    await exportSummaryReport(transactions, categories);
  };

  const getCategoryById = (id) => categories.find(c => c.id === id);

  // Daily Report Data
  const todayTransactions = filterTransactionsByToday(transactions);
  const todayIncome = calculateTotalIncome(todayTransactions);
  const todayExpense = calculateTotalExpense(todayTransactions);

  // Monthly Report Data
  const currentMonth = getCurrentMonth();
  const monthlyTransactions = filterTransactionsByMonth(transactions, currentMonth);
  const monthlyIncome = calculateTotalIncome(monthlyTransactions);
  const monthlyExpense = calculateTotalExpense(monthlyTransactions);
  const categorySpending = groupExpensesByCategory(monthlyTransactions, categories);

  // Yearly Report Data
  const currentYear = getCurrentYear();
  const yearlyTransactions = filterTransactionsByYear(transactions, currentYear);
  const yearlyIncome = calculateTotalIncome(yearlyTransactions);
  const yearlyExpense = calculateTotalExpense(yearlyTransactions);
  const monthlyTrend = getMonthlySpendingTrend(transactions, currentYear);

  // Chart configurations
  const chartConfig = {
    backgroundColor: COLORS.surface,
    backgroundGradientFrom: COLORS.surface,
    backgroundGradientTo: COLORS.surface,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(0, 191, 166, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(33, 33, 33, ${opacity})`,
    style: {
      borderRadius: BORDER_RADIUS.md,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: COLORS.primary,
    },
  };

  const renderDailyReport = () => (
    <View>
      <View style={styles.statsCard}>
        <View style={styles.statRow}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>💰 Pemasukan</Text>
            <Text style={[styles.statValue, { color: COLORS.income }]}>
              {formatCurrency(todayIncome)}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>💸 Pengeluaran</Text>
            <Text style={[styles.statValue, { color: COLORS.expense }]}>
              {formatCurrency(todayExpense)}
            </Text>
          </View>
        </View>
        <View style={styles.divider} />
        <View style={styles.statRow}>
          <Text style={styles.balanceLabel}>Saldo Hari Ini:</Text>
          <Text style={[
            styles.balanceValue,
            { color: (todayIncome - todayExpense) >= 0 ? COLORS.success : COLORS.danger }
          ]}>
            {formatCurrency(todayIncome - todayExpense)}
          </Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Transaksi Hari Ini</Text>
      {todayTransactions.length > 0 ? (
        todayTransactions
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .map((transaction) => (
            <TransactionCard
              key={transaction.id}
              transaction={transaction}
              category={getCategoryById(transaction.categoryId)}
            />
          ))
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📝</Text>
          <Text style={styles.emptyText}>Belum ada transaksi hari ini</Text>
        </View>
      )}
    </View>
  );

  const renderMonthlyReport = () => {
    const pieChartData = categorySpending.slice(0, 5).map((cat, index) => ({
      name: cat.categoryName,
      population: cat.total,
      color: cat.categoryColor,
      legendFontColor: COLORS.text,
      legendFontSize: 12,
    }));

    return (
      <View>
        <View style={styles.statsCard}>
          <View style={styles.statRow}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>💰 Pemasukan</Text>
              <Text style={[styles.statValue, { color: COLORS.income }]}>
                {formatCurrency(monthlyIncome)}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>💸 Pengeluaran</Text>
              <Text style={[styles.statValue, { color: COLORS.expense }]}>
                {formatCurrency(monthlyExpense)}
              </Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.statRow}>
            <Text style={styles.balanceLabel}>Saldo Bulan Ini:</Text>
            <Text style={[
              styles.balanceValue,
              { color: (monthlyIncome - monthlyExpense) >= 0 ? COLORS.success : COLORS.danger }
            ]}>
              {formatCurrency(monthlyIncome - monthlyExpense)}
            </Text>
          </View>
        </View>

        {pieChartData.length > 0 && (
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Pengeluaran Per Kategori</Text>
            <PieChart
              data={pieChartData}
              width={screenWidth - SPACING.md * 4}
              height={220}
              chartConfig={chartConfig}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="15"
              absolute
            />
          </View>
        )}

        <Text style={styles.sectionTitle}>Detail Kategori</Text>
        {categorySpending.map((cat) => (
          <View key={cat.categoryId} style={styles.categoryCard}>
            <View style={styles.categoryHeader}>
              <View style={styles.categoryInfo}>
                <Text style={styles.categoryIcon}>{cat.categoryIcon}</Text>
                <View>
                  <Text style={styles.categoryName}>{cat.categoryName}</Text>
                  <Text style={styles.categoryCount}>{cat.count} transaksi</Text>
                </View>
              </View>
              <Text style={styles.categoryAmount}>{formatCurrency(cat.total)}</Text>
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderYearlyReport = () => {
    const barChartData = {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'],
      datasets: [{
        data: monthlyTrend.length > 0 ? monthlyTrend : [0],
      }],
    };

    return (
      <View>
        <View style={styles.statsCard}>
          <View style={styles.statRow}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>💰 Pemasukan {currentYear}</Text>
              <Text style={[styles.statValue, { color: COLORS.income }]}>
                {formatCurrency(yearlyIncome)}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>💸 Pengeluaran {currentYear}</Text>
              <Text style={[styles.statValue, { color: COLORS.expense }]}>
                {formatCurrency(yearlyExpense)}
              </Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.statRow}>
            <Text style={styles.balanceLabel}>Saldo Tahun Ini:</Text>
            <Text style={[
              styles.balanceValue,
              { color: (yearlyIncome - yearlyExpense) >= 0 ? COLORS.success : COLORS.danger }
            ]}>
              {formatCurrency(yearlyIncome - yearlyExpense)}
            </Text>
          </View>
        </View>

        {monthlyTrend.some(val => val > 0) && (
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Trend Pengeluaran {currentYear}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <BarChart
                data={barChartData}
                width={Math.max(screenWidth - SPACING.md * 4, 600)}
                height={220}
                chartConfig={chartConfig}
                verticalLabelRotation={0}
                fromZero
                showValuesOnTopOfBars
                yAxisSuffix=""
                style={styles.chart}
              />
            </ScrollView>
          </View>
        )}

        <Text style={styles.sectionTitle}>Ringkasan Bulanan</Text>
        {monthlyTrend.map((amount, index) => {
          if (amount === 0) return null;
          return (
            <View key={index} style={styles.monthCard}>
              <Text style={styles.monthName}>{getMonthName(index)} {currentYear}</Text>
              <Text style={styles.monthAmount}>{formatCurrency(amount)}</Text>
            </View>
          );
        })}
      </View>
    );
  };

  const renderAnalytics = () => {
    // Analytics Data
    const trendData = getLast6MonthsTrend(transactions);
    const categoryDistMonth = getCategoryDistribution(transactions, categories, getCurrentMonth());

    return (
      <View>
        <Text style={styles.sectionTitle}>Analisis Pengeluaran</Text>
        
        {/* Trend Chart */}
        <TrendChart data={trendData.data} labels={trendData.labels} />

        {/* Distribution Chart */}
        <CategoryPieChart data={categoryDistMonth.data} />

        {/* Insights Card */}
        <View style={styles.insightCard}>
          <Text style={styles.insightTitle}>💡 Insight Keuangan</Text>
          <Text style={styles.insightText}>
            • Pengeluaran rata-rata 3 bulan terakhir: {formatCurrency(
                (trendData.data.slice(3).reduce((a, b) => a + b, 0) / 3) || 0
              )}
          </Text>
          {categoryDistMonth.data.length > 0 && (
            <Text style={styles.insightText}>
              • Kategori terboros bulan ini: <Text style={{fontWeight: 'bold'}}>{categoryDistMonth.data[0].name}</Text>
            </Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={globalStyles.container}>
      {/* View Mode Selector (Summary vs Analytics) */}
      <View style={styles.viewModeContainer}>
        <TouchableOpacity
          style={[styles.modeButton, viewMode === 'summary' && styles.modeButtonActive]}
          onPress={() => setViewMode('summary')}
        >
          <Text style={[styles.modeText, viewMode === 'summary' && styles.modeTextActive]}>Ringkasan</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeButton, viewMode === 'analytics' && styles.modeButtonActive]}
          onPress={() => setViewMode('analytics')}
        >
          <Text style={[styles.modeText, viewMode === 'analytics' && styles.modeTextActive]}>Analisis</Text>
        </TouchableOpacity>
      </View>

      {/* Show Tabs only if in Summary mode */}
      {viewMode === 'summary' && (
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'daily' && styles.tabActive]}
            onPress={() => setActiveTab('daily')}
          >
            <Text style={[styles.tabText, activeTab === 'daily' && styles.tabTextActive]}>
              Harian
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'monthly' && styles.tabActive]}
            onPress={() => setActiveTab('monthly')}
          >
            <Text style={[styles.tabText, activeTab === 'monthly' && styles.tabTextActive]}>
              Bulanan
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'yearly' && styles.tabActive]}
            onPress={() => setActiveTab('yearly')}
          >
            <Text style={[styles.tabText, activeTab === 'yearly' && styles.tabTextActive]}>
              Tahunan
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Export Buttons (Only in Summary) */}
      {viewMode === 'summary' && (
        <View style={styles.exportContainer}>
          <Text style={styles.exportTitle}>📤 Export Data</Text>
          <View style={styles.exportButtons}>
            <TouchableOpacity
              style={[styles.exportButton, { backgroundColor: '#4CAF50' }]}
              onPress={handleExportCSV}
            >
              <Text style={styles.exportButtonText}>📊 CSV</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.exportButton, { backgroundColor: '#2196F3' }]}
              onPress={handleExportReport}
            >
              <Text style={styles.exportButtonText}>📄 Laporan</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.exportButton, { backgroundColor: '#FF9800' }]}
              onPress={handleExportSummary}
            >
              <Text style={styles.exportButtonText}>📈 Ringkasan</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {viewMode === 'summary' ? (
          <>
            {activeTab === 'daily' && renderDailyReport()}
            {activeTab === 'monthly' && renderMonthlyReport()}
            {activeTab === 'yearly' && renderYearlyReport()}
          </>
        ) : (
          renderAnalytics()
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    ...SHADOWS.small,
  },
  tab: {
    flex: 1,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.medium,
    color: COLORS.textSecondary,
  },
  tabTextActive: {
    color: COLORS.primary,
    fontWeight: FONT_WEIGHTS.bold,
  },
  scrollContent: {
    padding: SPACING.md,
  },
  statsCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.medium,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
  },
  statLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  statValue: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.md,
  },
  balanceLabel: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.text,
  },
  balanceValue: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
  },
  chartCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.small,
  },
  chartTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  chart: {
    borderRadius: BORDER_RADIUS.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    marginTop: SPACING.md,
    marginBottom: SPACING.md,
  },
  categoryCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    ...SHADOWS.small,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIcon: {
    fontSize: 28,
    marginRight: SPACING.md,
  },
  categoryName: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.text,
  },
  categoryCount: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  categoryAmount: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.expense,
  },
  monthCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...SHADOWS.small,
  },
  monthName: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.text,
  },
  monthAmount: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.expense,
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
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  exportContainer: {
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    ...SHADOWS.small,
  },
  exportTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  exportButtons: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  exportButton: {
    flex: 1,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    alignItems: 'center',
  },
  exportButtonText: {
    color: COLORS.textLight,
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.semibold,
  },
  viewModeContainer: {
    flexDirection: 'row',
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
  },
  modeButton: {
    flex: 1,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.pill,
    backgroundColor: COLORS.background,
    marginHorizontal: 4,
  },
  modeButtonActive: {
    backgroundColor: COLORS.primary,
  },
  modeText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  modeTextActive: {
    color: COLORS.textLight,
  },
  insightCard: {
    backgroundColor: '#E3F2FD',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  insightTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: 'bold',
    color: '#1565C0',
    marginBottom: SPACING.sm,
  },
  insightText: {
    fontSize: FONT_SIZES.sm,
    color: '#0D47A1',
    lineHeight: 20,
    marginBottom: 4,
  },
});

export default ReportScreen;
