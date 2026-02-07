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
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS, BORDER_RADIUS } from '../styles/theme';
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
import { NavigationProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Transaction, Category } from '../types';

const screenWidth = Dimensions.get('window').width;

interface ReportScreenProps {
  navigation: NavigationProp<RootStackParamList, 'Report'>;
}

const ReportScreen: React.FC<ReportScreenProps> = ({ navigation }) => {
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

  const handleExportCSV = async () => {
    await exportToCSV(transactions, categories);
  };

  const handleExportReport = async () => {
    await exportToTextReport(transactions, categories);
  };

  const handleExportSummary = async () => {
    await exportSummaryReport(transactions, categories);
  };

  const getCategoryById = (id: string) => categories.find(c => c.id === id);

  const todayTransactions = filterTransactionsByToday(transactions);
  const todayIncome = calculateTotalIncome(todayTransactions);
  const todayExpense = calculateTotalExpense(todayTransactions);

  const currentMonth = getCurrentMonth();
  const monthlyTransactions = filterTransactionsByMonth(transactions, currentMonth);
  const monthlyIncome = calculateTotalIncome(monthlyTransactions);
  const monthlyExpense = calculateTotalExpense(monthlyTransactions);
  const categorySpending = groupExpensesByCategory(monthlyTransactions, categories);

  const currentYear = getCurrentYear();
  const yearlyTransactions = filterTransactionsByYear(transactions, currentYear);
  const yearlyIncome = calculateTotalIncome(yearlyTransactions);
  const yearlyExpense = calculateTotalExpense(yearlyTransactions);
  const monthlyTrend = getMonthlySpendingTrend(transactions, currentYear);

  const chartConfig = {
    backgroundColor: COLORS.surface as string,
    backgroundGradientFrom: COLORS.surface as string,
    backgroundGradientTo: COLORS.surface as string,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(0, 191, 166, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(33, 33, 33, ${opacity})`,
    style: {
      borderRadius: BORDER_RADIUS.md,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: COLORS.primary as string,
    },
  };

  const renderDailyReport = () => (
    <View>
      <View style={styles.statsCard}>
        <View style={styles.statRow}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>💰 Pemasukan</Text>
            <Text style={[styles.statValue, { color: COLORS.success as string }]}>
              {formatCurrency(todayIncome)}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>💸 Pengeluaran</Text>
            <Text style={[styles.statValue, { color: COLORS.danger as string }]}>
              {formatCurrency(todayExpense)}
            </Text>
          </View>
        </View>
        <View style={styles.divider} />
        <View style={styles.statRow}>
          <Text style={styles.balanceLabel}>Saldo Hari Ini:</Text>
          <Text style={[
            styles.balanceValue,
            { color: (todayIncome - todayExpense) >= 0 ? COLORS.success as string : COLORS.danger as string }
          ]}>
            {formatCurrency(todayIncome - todayExpense)}
          </Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Transaksi Hari Ini</Text>
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
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📝</Text>
          <Text style={styles.emptyText}>Belum ada transaksi hari ini</Text>
        </View>
      )}
    </View>
  );

  const renderMonthlyReport = () => {
    const pieChartData = categorySpending.slice(0, 5).map((cat) => ({
      name: cat.categoryName,
      population: cat.total,
      color: cat.categoryColor,
      legendFontColor: COLORS.text as string,
      legendFontSize: 12,
    }));

    return (
      <View>
        <View style={styles.statsCard}>
          <View style={styles.statRow}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>💰 Pemasukan</Text>
              <Text style={[styles.statValue, { color: COLORS.success as string }]}>
                {formatCurrency(monthlyIncome)}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>💸 Pengeluaran</Text>
              <Text style={[styles.statValue, { color: COLORS.danger as string }]}>
                {formatCurrency(monthlyExpense)}
              </Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.statRow}>
            <Text style={styles.balanceLabel}>Saldo Bulan Ini:</Text>
            <Text style={[
              styles.balanceValue,
              { color: (monthlyIncome - monthlyExpense) >= 0 ? COLORS.success as string : COLORS.danger as string }
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
              <Text style={[styles.statValue, { color: COLORS.success as string }]}>
                {formatCurrency(yearlyIncome)}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>💸 Pengeluaran {currentYear}</Text>
              <Text style={[styles.statValue, { color: COLORS.danger as string }]}>
                {formatCurrency(yearlyExpense)}
              </Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.statRow}>
            <Text style={styles.balanceLabel}>Saldo Tahun Ini:</Text>
            <Text style={[
              styles.balanceValue,
              { color: (yearlyIncome - yearlyExpense) >= 0 ? COLORS.success as string : COLORS.danger as string }
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
    const trendData = getLast6MonthsTrend(transactions);
    const categoryDistMonth = getCategoryDistribution(transactions, categories, getCurrentMonth());

    return (
      <View>
        <Text style={styles.sectionTitle}>Analisis Pengeluaran</Text>
        
        <TrendChart data={trendData.data} labels={trendData.labels} />

        <CategoryPieChart data={categoryDistMonth.data} />

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
    backgroundColor: COLORS.surface as string,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
  },
  tab: {
    flex: 1,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: COLORS.primary as string,
  },
  tabText: {
    fontSize: FONT_SIZES.md as any,
    fontWeight: FONT_WEIGHTS.medium as any,
    color: COLORS.textSecondary as string,
  },
  tabTextActive: {
    color: COLORS.primary as string,
    fontWeight: FONT_WEIGHTS.bold as any,
  },
  scrollContent: {
    padding: SPACING.md,
  },
  statsCard: {
    backgroundColor: COLORS.surface as string,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
  },
  statLabel: {
    fontSize: FONT_SIZES.sm as any,
    color: COLORS.textSecondary as string,
    marginBottom: SPACING.xs,
  },
  statValue: {
    fontSize: FONT_SIZES.lg as any,
    fontWeight: FONT_WEIGHTS.bold as any,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border as string,
    marginVertical: SPACING.md,
  },
  balanceLabel: {
    fontSize: FONT_SIZES.md as any,
    fontWeight: FONT_WEIGHTS.semibold as any,
    color: COLORS.text as string,
  },
  balanceValue: {
    fontSize: FONT_SIZES.xl as any,
    fontWeight: FONT_WEIGHTS.bold as any,
  },
  chartCard: {
    backgroundColor: COLORS.surface as string,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  chartTitle: {
    fontSize: FONT_SIZES.md as any,
    fontWeight: FONT_WEIGHTS.bold as any,
    color: COLORS.text as string,
    marginBottom: SPACING.md,
  },
  chart: {
    borderRadius: BORDER_RADIUS.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg as any,
    fontWeight: FONT_WEIGHTS.bold as any,
    color: COLORS.text as string,
    marginTop: SPACING.md,
    marginBottom: SPACING.md,
  },
  categoryCard: {
    backgroundColor: COLORS.surface as string,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
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
    fontSize: FONT_SIZES.md as any,
    fontWeight: FONT_WEIGHTS.semibold as any,
    color: COLORS.text as string,
  },
  categoryCount: {
    fontSize: FONT_SIZES.xs as any,
    color: COLORS.textSecondary as string,
    marginTop: 2,
  },
  categoryAmount: {
    fontSize: FONT_SIZES.lg as any,
    fontWeight: FONT_WEIGHTS.bold as any,
    color: COLORS.danger as string,
  },
  monthCard: {
    backgroundColor: COLORS.surface as string,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  monthName: {
    fontSize: FONT_SIZES.md as any,
    fontWeight: FONT_WEIGHTS.semibold as any,
    color: COLORS.text as string,
  },
  monthAmount: {
    fontSize: FONT_SIZES.md as any,
    fontWeight: FONT_WEIGHTS.bold as any,
    color: COLORS.danger as string,
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
    fontSize: FONT_SIZES.md as any,
    color: COLORS.textSecondary as string,
  },
  exportContainer: {
    backgroundColor: COLORS.surface as string,
    padding: SPACING.md,
  },
  exportTitle: {
    fontSize: FONT_SIZES.md as any,
    fontWeight: FONT_WEIGHTS.semibold as any,
    color: COLORS.text as string,
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
    color: COLORS.textLight as string,
    fontSize: FONT_SIZES.sm as any,
    fontWeight: FONT_WEIGHTS.semibold as any,
  },
  viewModeContainer: {
    flexDirection: 'row',
    padding: SPACING.md,
    backgroundColor: COLORS.surface as string,
  },
  modeButton: {
    flex: 1,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.pill,
    backgroundColor: COLORS.background as string,
    marginHorizontal: 4,
  },
  modeButtonActive: {
    backgroundColor: COLORS.primary as string,
  },
  modeText: {
    fontSize: FONT_SIZES.md as any,
    color: COLORS.textSecondary as string,
    fontWeight: '600',
  },
  modeTextActive: {
    color: COLORS.textLight as string,
  },
  insightCard: {
    backgroundColor: '#E3F2FD',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  insightTitle: {
    fontSize: FONT_SIZES.md as any,
    fontWeight: 'bold',
    color: '#1565C0',
    marginBottom: SPACING.sm,
  },
  insightText: {
    fontSize: FONT_SIZES.sm as any,
    color: '#0D47A1',
    lineHeight: 20,
    marginBottom: 4,
  },
});

export default ReportScreen;
