import React, { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TextInput, 
  TouchableOpacity, 
  Alert, 
  RefreshControl, 
  Modal, 
  ViewStyle, 
  TextStyle 
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS, BORDER_RADIUS } from '../styles/theme';
import { globalStyles } from '../styles/globalStyles';
import BudgetProgressBar from '../components/BudgetProgressBar';
import InvestmentCard from '../components/InvestmentCard';
import { getTransactions, getCategories, getBudget, saveBudget } from '../utils/storage';
import { 
  formatCurrency,
  getCurrentMonth,
  filterTransactionsByMonth,
  groupExpensesByCategory,
  calculateBudgetRecommendations,
  calculateInvestmentRecommendation,
  getInvestmentSuggestions
} from '../utils/calculations';
import { NavigationProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Category, Budget, InvestmentRecommendation, InvestmentSuggestion } from '../types';

interface BudgetScreenProps {
  navigation: NavigationProp<RootStackParamList, 'Budget'>;
}

const BudgetScreen: React.FC<BudgetScreenProps> = ({ navigation }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [budget, setBudget] = useState<Budget | null>(null);
  const [totalIncome, setTotalIncome] = useState<string>('');
  const [categoryBudgets, setCategoryBudgets] = useState<Record<string, number>>({});
  const [categorySpending, setCategorySpending] = useState<Record<string, number>>({});
  const [refreshing, setRefreshing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showInvestmentModal, setShowInvestmentModal] = useState(false);

  const loadData = async () => {
    try {
      const [categoriesData, budgetData, transactionsData] = await Promise.all([
        getCategories(),
        getBudget(),
        getTransactions(),
      ]);

      setCategories(categoriesData);
      setBudget(budgetData);

      if (budgetData) {
        setTotalIncome(budgetData.totalIncome?.toString() || '');
        setCategoryBudgets(budgetData.categoryBudgets || {});
      }

      const currentMonth = getCurrentMonth();
      const monthlyTransactions = filterTransactionsByMonth(transactionsData, currentMonth);
      const spending = groupExpensesByCategory(monthlyTransactions, categoriesData);
      
      const spendingMap: Record<string, number> = {};
      spending.forEach(cat => {
        spendingMap[cat.categoryId] = cat.total;
      });
      setCategorySpending(spendingMap);
    } catch (error) {
      console.error('Error loading budget data:', error);
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

  const handleGenerateRecommendations = async () => {
    if (!totalIncome || parseFloat(totalIncome) <= 0) {
      Alert.alert('Error', 'Masukkan total pemasukan bulan ini terlebih dahulu');
      return;
    }

    try {
      const transactionsData = await getTransactions();
      const recommendations = calculateBudgetRecommendations(
        transactionsData,
        categories,
        parseFloat(totalIncome)
      );
      
      setCategoryBudgets(recommendations);
      Alert.alert(
        'Rekomendasi Dibuat',
        'Budget telah dihitung berdasarkan pola pengeluaran bulan lalu. Anda bisa menyesuaikan sesuai kebutuhan.'
      );
      setIsEditing(true);
    } catch (error) {
      console.error('Error generating recommendations:', error);
      Alert.alert('Error', 'Gagal membuat rekomendasi budget');
    }
  };

  const handleSaveBudget = async () => {
    if (!totalIncome || parseFloat(totalIncome) <= 0) {
      Alert.alert('Error', 'Masukkan total pemasukan bulan ini');
      return;
    }

    try {
      const budgetData: Budget = {
        totalIncome: parseFloat(totalIncome),
        categoryBudgets,
        month: getCurrentMonth(),
      };

      await saveBudget(budgetData);
      setIsEditing(false);
      Alert.alert('Berhasil', 'Budget berhasil disimpan');
      loadData();
    } catch (error) {
      console.error('Error saving budget:', error);
      Alert.alert('Error', 'Gagal menyimpan budget');
    }
  };

  const updateCategoryBudget = (categoryId: string, value: string) => {
    setCategoryBudgets(prev => ({
      ...prev,
      [categoryId]: parseFloat(value) || 0,
    }));
  };

  const totalBudgetAllocated = Object.values(categoryBudgets).reduce((sum, val) => sum + val, 0);
  const remainingBudgetValue = parseFloat(totalIncome || '0') - totalBudgetAllocated;

  const investmentData: (InvestmentRecommendation & { suggestion: InvestmentSuggestion }) | null = totalIncome && parseFloat(totalIncome) > 0 && totalBudgetAllocated > 0
    ? {
        ...calculateInvestmentRecommendation(parseFloat(totalIncome), totalBudgetAllocated),
        suggestion: getInvestmentSuggestions(calculateInvestmentRecommendation(parseFloat(totalIncome), totalBudgetAllocated).percentage)
      }
    : null;

  return (
    <View style={globalStyles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Total Income Input */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>💰 Total Pemasukan Bulan Ini</Text>
          <View style={styles.incomeInputContainer}>
            <Text style={styles.currencyPrefix}>Rp</Text>
            <TextInput
              style={styles.incomeInput}
              placeholder="0"
              keyboardType="numeric"
              value={totalIncome}
              onChangeText={(value) => {
                setTotalIncome(value);
                setIsEditing(true);
              }}
              placeholderTextColor={COLORS.textSecondary as string}
            />
          </View>
          {totalIncome && parseFloat(totalIncome) > 0 && (
            <Text style={styles.incomePreview}>
              {formatCurrency(parseFloat(totalIncome))}
            </Text>
          )}
        </View>

        {/* Budget Summary */}
        {totalIncome && parseFloat(totalIncome) > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>📊 Ringkasan Budget</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total Pemasukan:</Text>
              <Text style={styles.summaryValue}>{formatCurrency(parseFloat(totalIncome))}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total Dialokasikan:</Text>
              <Text style={styles.summaryValue}>{formatCurrency(totalBudgetAllocated)}</Text>
            </View>
            <View style={[styles.summaryRow, styles.summaryRowTotal]}>
              <Text style={styles.summaryLabelBold}>Sisa Budget:</Text>
              <Text style={[
                styles.summaryValueBold,
                { color: remainingBudgetValue >= 0 ? COLORS.success as string : COLORS.danger as string }
              ]}>
                {formatCurrency(remainingBudgetValue)}
              </Text>
            </View>
          </View>
        )}

        {/* Investment Card */}
        {investmentData && (
          <InvestmentCard
            investmentData={investmentData}
            onPress={() => setShowInvestmentModal(true)}
          />
        )}

        {/* Action Buttons */}
        {totalIncome && parseFloat(totalIncome) > 0 && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[globalStyles.buttonSecondary, { flex: 1, marginRight: SPACING.xs }]}
              onPress={handleGenerateRecommendations}
            >
              <Text style={globalStyles.buttonText}>🤖 Buat Rekomendasi</Text>
            </TouchableOpacity>
            
            {isEditing && (
              <TouchableOpacity
                style={[globalStyles.buttonPrimary, { flex: 1, marginLeft: SPACING.xs }]}
                onPress={handleSaveBudget}
              >
                <Text style={globalStyles.buttonText}>💾 Simpan</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Category Budgets */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Budget Per Kategori</Text>
          
          {categories.map((category) => {
            const budgetAmount = categoryBudgets[category.id] || 0;
            const spentAmount = categorySpending[category.id] || 0;

            return (
              <View key={category.id} style={styles.categoryBudgetCard}>
                {budgetAmount > 0 ? (
                  <BudgetProgressBar
                    category={category}
                    spent={spentAmount}
                    budget={budgetAmount}
                  />
                ) : (
                  <View style={styles.categoryHeader}>
                    <View style={styles.categoryInfo}>
                      <Text style={styles.categoryIcon}>{category.icon}</Text>
                      <Text style={styles.categoryName}>{category.name}</Text>
                    </View>
                  </View>
                )}
                
                <View style={styles.budgetInputContainer}>
                  <Text style={styles.budgetInputLabel}>Budget:</Text>
                  <View style={styles.budgetInputWrapper}>
                    <Text style={styles.budgetCurrencyPrefix}>Rp</Text>
                    <TextInput
                      style={styles.budgetInput}
                      placeholder="0"
                      keyboardType="numeric"
                      value={categoryBudgets[category.id]?.toString() || ''}
                      onChangeText={(value) => {
                        updateCategoryBudget(category.id, value);
                        setIsEditing(true);
                      }}
                      placeholderTextColor={COLORS.textSecondary as string}
                    />
                  </View>
                </View>
              </View>
            );
          })}
        </View>

        {!totalIncome && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>💼</Text>
            <Text style={styles.emptyText}>Mulai Kelola Budget</Text>
            <Text style={styles.emptySubtext}>
              Masukkan total pemasukan bulan ini untuk mulai mengatur budget
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Investment Modal */}
      {investmentData && (
        <Modal
          visible={showInvestmentModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowInvestmentModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{investmentData.suggestion.title}</Text>
                <TouchableOpacity onPress={() => setShowInvestmentModal(false)}>
                  <Text style={styles.closeButton}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalScroll}>
                <Text style={styles.modalDescription}>{investmentData.suggestion.description}</Text>

                <View style={styles.investmentStats}>
                  <View style={styles.statRow}>
                    <Text style={styles.statLabel}>Sisa Budget:</Text>
                    <Text style={styles.statValue}>{formatCurrency(investmentData.remainingBudget)}</Text>
                  </View>
                  <View style={styles.statRow}>
                    <Text style={styles.statLabel}>Rekomendasi Investasi:</Text>
                    <Text style={[styles.statValue, { color: COLORS.primary as string }]}>
                      {formatCurrency(investmentData.recommended)}
                    </Text>
                  </View>
                  <View style={styles.statRow}>
                    <Text style={styles.statLabel}>Minimal (10%):</Text>
                    <Text style={styles.statValue}>{formatCurrency(investmentData.minInvestment)}</Text>
                  </View>
                  <View style={styles.statRow}>
                    <Text style={styles.statLabel}>Ideal (20%):</Text>
                    <Text style={styles.statValue}>{formatCurrency(investmentData.idealInvestment)}</Text>
                  </View>
                </View>

                <Text style={styles.sectionTitle}>💡 Saran untuk Anda:</Text>
                {investmentData.suggestion.suggestions.map((suggestion, index) => (
                  <View key={index} style={styles.suggestionItem}>
                    <Text style={styles.bulletPoint}>•</Text>
                    <Text style={styles.suggestionText}>{suggestion}</Text>
                  </View>
                ))}

                {investmentData.suggestion.investmentTypes.length > 0 && (
                  <>
                    <Text style={styles.sectionTitle}>📊 Jenis Investasi yang Cocok:</Text>
                    {investmentData.suggestion.investmentTypes.map((type, index) => (
                      <View key={index} style={styles.investmentTypeCard}>
                        <Text style={styles.investmentIcon}>{type.icon}</Text>
                        <View style={styles.investmentTypeInfo}>
                          <Text style={styles.investmentTypeName}>{type.name}</Text>
                          <Text style={styles.investmentTypeDetail}>Risiko: {type.risk}</Text>
                          <Text style={styles.investmentTypeDetail}>Return: {type.return}</Text>
                        </View>
                      </View>
                    ))}
                  </>
                )}

                <View style={styles.disclaimer}>
                  <Text style={styles.disclaimerText}>
                    ⚠️ Disclaimer: Ini hanya saran umum. Lakukan riset sendiri sebelum investasi. 
                    Investasi memiliki risiko, pastikan Anda memahami risikonya.
                  </Text>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    padding: SPACING.md,
  },
  card: {
    backgroundColor: COLORS.surface as string,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  cardTitle: {
    fontSize: FONT_SIZES.lg as any,
    fontWeight: FONT_WEIGHTS.bold as any,
    color: COLORS.text as string,
    marginBottom: SPACING.md,
  },
  incomeInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background as string,
    borderWidth: 2,
    borderColor: COLORS.primary as string,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
  },
  currencyPrefix: {
    fontSize: FONT_SIZES.xl as any,
    fontWeight: FONT_WEIGHTS.bold as any,
    color: COLORS.text as string,
    marginRight: SPACING.sm,
  },
  incomeInput: {
    flex: 1,
    fontSize: FONT_SIZES.xxl as any,
    fontWeight: FONT_WEIGHTS.bold as any,
    color: COLORS.text as string,
    paddingVertical: SPACING.md,
  },
  incomePreview: {
    fontSize: FONT_SIZES.sm as any,
    color: COLORS.textSecondary as string,
    marginTop: SPACING.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  summaryRowTotal: {
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border as string,
  },
  summaryLabel: {
    fontSize: FONT_SIZES.md as any,
    color: COLORS.textSecondary as string,
  },
  summaryValue: {
    fontSize: FONT_SIZES.md as any,
    fontWeight: FONT_WEIGHTS.semibold as any,
    color: COLORS.text as string,
  },
  summaryLabelBold: {
    fontSize: FONT_SIZES.md as any,
    fontWeight: FONT_WEIGHTS.bold as any,
    color: COLORS.text as string,
  },
  summaryValueBold: {
    fontSize: FONT_SIZES.lg as any,
    fontWeight: FONT_WEIGHTS.bold as any,
  },
  actionButtons: {
    flexDirection: 'row',
    marginBottom: SPACING.md,
  },
  section: {
    marginTop: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg as any,
    fontWeight: FONT_WEIGHTS.bold as any,
    color: COLORS.text as string,
    marginBottom: SPACING.md,
  },
  categoryBudgetCard: {
    backgroundColor: COLORS.surface as string,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  categoryHeader: {
    marginBottom: SPACING.sm,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIcon: {
    fontSize: 24,
    marginRight: SPACING.sm,
  },
  categoryName: {
    fontSize: FONT_SIZES.md as any,
    fontWeight: FONT_WEIGHTS.semibold as any,
    color: COLORS.text as string,
  },
  budgetInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  budgetInputLabel: {
    fontSize: FONT_SIZES.sm as any,
    color: COLORS.textSecondary as string,
    marginRight: SPACING.sm,
  },
  budgetInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background as string,
    borderWidth: 1,
    borderColor: COLORS.border as string,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING.sm,
  },
  budgetCurrencyPrefix: {
    fontSize: FONT_SIZES.sm as any,
    fontWeight: FONT_WEIGHTS.medium as any,
    color: COLORS.text as string,
    marginRight: SPACING.xs,
  },
  budgetInput: {
    flex: 1,
    fontSize: FONT_SIZES.md as any,
    fontWeight: FONT_WEIGHTS.semibold as any,
    color: COLORS.text as string,
    paddingVertical: SPACING.sm,
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
    fontSize: FONT_SIZES.lg as any,
    fontWeight: FONT_WEIGHTS.semibold as any,
    color: COLORS.text as string,
    marginBottom: SPACING.xs,
  },
  emptySubtext: {
    fontSize: FONT_SIZES.sm as any,
    color: COLORS.textSecondary as string,
    textAlign: 'center',
    paddingHorizontal: SPACING.xl,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.surface as string,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    paddingTop: SPACING.lg,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  },
  modalTitle: {
    fontSize: FONT_SIZES.xl as any,
    fontWeight: FONT_WEIGHTS.bold as any,
    color: COLORS.text as string,
    flex: 1,
  },
  closeButton: {
    fontSize: 28,
    color: COLORS.textSecondary as string,
    fontWeight: FONT_WEIGHTS.bold as any,
  },
  modalScroll: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  modalDescription: {
    fontSize: FONT_SIZES.md as any,
    color: COLORS.textSecondary as string,
    marginBottom: SPACING.lg,
    lineHeight: 22,
  },
  investmentStats: {
    backgroundColor: COLORS.background as string,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  statLabel: {
    fontSize: FONT_SIZES.sm as any,
    color: COLORS.textSecondary as string,
  },
  statValue: {
    fontSize: FONT_SIZES.sm as any,
    fontWeight: FONT_WEIGHTS.bold as any,
    color: COLORS.text as string,
  },
  suggestionItem: {
    flexDirection: 'row',
    marginBottom: SPACING.sm,
    paddingRight: SPACING.md,
  },
  bulletPoint: {
    fontSize: FONT_SIZES.md as any,
    color: COLORS.primary as string,
    marginRight: SPACING.sm,
    fontWeight: FONT_WEIGHTS.bold as any,
  },
  suggestionText: {
    flex: 1,
    fontSize: FONT_SIZES.sm as any,
    color: COLORS.text as string,
    lineHeight: 20,
  },
  investmentTypeCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.background as string,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  investmentIcon: {
    fontSize: 32,
    marginRight: SPACING.md,
  },
  investmentTypeInfo: {
    flex: 1,
  },
  investmentTypeName: {
    fontSize: FONT_SIZES.md as any,
    fontWeight: FONT_WEIGHTS.bold as any,
    color: COLORS.text as string,
    marginBottom: SPACING.xs,
  },
  investmentTypeDetail: {
    fontSize: FONT_SIZES.xs as any,
    color: COLORS.textSecondary as string,
    marginBottom: 2,
  },
  disclaimer: {
    backgroundColor: '#FFF3CD',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginTop: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  disclaimerText: {
    fontSize: FONT_SIZES.xs as any,
    color: '#856404',
    lineHeight: 18,
  },
});

export default BudgetScreen;
