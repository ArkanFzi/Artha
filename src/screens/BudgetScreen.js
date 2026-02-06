import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TextInput, 
  TouchableOpacity,
  Alert,
  RefreshControl,
  Modal
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS, BORDER_RADIUS, SHADOWS } from '../styles/theme';
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

const BudgetScreen = ({ navigation }) => {
  const [categories, setCategories] = useState([]);
  const [budget, setBudget] = useState(null);
  const [totalIncome, setTotalIncome] = useState('');
  const [categoryBudgets, setCategoryBudgets] = useState({});
  const [categorySpending, setCategorySpending] = useState({});
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

      // Calculate current spending
      const currentMonth = getCurrentMonth();
      const monthlyTransactions = filterTransactionsByMonth(transactionsData, currentMonth);
      const spending = groupExpensesByCategory(monthlyTransactions, categoriesData);
      
      const spendingMap = {};
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
      const budgetData = {
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

  const updateCategoryBudget = (categoryId, value) => {
    setCategoryBudgets(prev => ({
      ...prev,
      [categoryId]: parseFloat(value) || 0,
    }));
  };

  const totalBudgetAllocated = Object.values(categoryBudgets).reduce((sum, val) => sum + val, 0);
  const remainingBudget = parseFloat(totalIncome || 0) - totalBudgetAllocated;

  // Calculate investment recommendation
  const investmentData = totalIncome && parseFloat(totalIncome) > 0 && totalBudgetAllocated > 0
    ? calculateInvestmentRecommendation(parseFloat(totalIncome), totalBudgetAllocated)
    : null;
  
  const investmentSuggestion = investmentData 
    ? getInvestmentSuggestions(investmentData.percentage)
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
              placeholderTextColor={COLORS.textSecondary}
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
                { color: remainingBudget >= 0 ? COLORS.success : COLORS.danger }
              ]}>
                {formatCurrency(remainingBudget)}
              </Text>
            </View>
          </View>
        )}

        {/* Investment Card */}
        {investmentData && investmentSuggestion && (
          <InvestmentCard
            investmentData={{ ...investmentData, suggestion: investmentSuggestion }}
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
                      placeholderTextColor={COLORS.textSecondary}
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
      {investmentSuggestion && (
        <Modal
          visible={showInvestmentModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowInvestmentModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{investmentSuggestion.title}</Text>
                <TouchableOpacity onPress={() => setShowInvestmentModal(false)}>
                  <Text style={styles.closeButton}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalScroll}>
                <Text style={styles.modalDescription}>{investmentSuggestion.description}</Text>

                {investmentData && (
                  <View style={styles.investmentStats}>
                    <View style={styles.statRow}>
                      <Text style={styles.statLabel}>Sisa Budget:</Text>
                      <Text style={styles.statValue}>{formatCurrency(investmentData.remainingBudget)}</Text>
                    </View>
                    <View style={styles.statRow}>
                      <Text style={styles.statLabel}>Rekomendasi Investasi:</Text>
                      <Text style={[styles.statValue, { color: COLORS.primary }]}>
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
                )}

                <Text style={styles.sectionTitle}>💡 Saran untuk Anda:</Text>
                {investmentSuggestion.suggestions.map((suggestion, index) => (
                  <View key={index} style={styles.suggestionItem}>
                    <Text style={styles.bulletPoint}>•</Text>
                    <Text style={styles.suggestionText}>{suggestion}</Text>
                  </View>
                ))}

                {investmentSuggestion.investmentTypes.length > 0 && (
                  <>
                    <Text style={styles.sectionTitle}>📊 Jenis Investasi yang Cocok:</Text>
                    {investmentSuggestion.investmentTypes.map((type, index) => (
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
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.medium,
  },
  cardTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  incomeInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
  },
  currencyPrefix: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    marginRight: SPACING.sm,
  },
  incomeInput: {
    flex: 1,
    fontSize: FONT_SIZES.xxl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    paddingVertical: SPACING.md,
  },
  incomePreview: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
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
    borderTopColor: COLORS.border,
  },
  summaryLabel: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  summaryValue: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.text,
  },
  summaryLabelBold: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
  },
  summaryValueBold: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
  },
  actionButtons: {
    flexDirection: 'row',
    marginBottom: SPACING.md,
  },
  section: {
    marginTop: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  categoryBudgetCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.small,
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
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.text,
  },
  budgetInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  budgetInputLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginRight: SPACING.sm,
  },
  budgetInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING.sm,
  },
  budgetCurrencyPrefix: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.medium,
    color: COLORS.text,
    marginRight: SPACING.xs,
  },
  budgetInput: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.text,
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
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
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
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    flex: 1,
  },
  closeButton: {
    fontSize: 28,
    color: COLORS.textSecondary,
    fontWeight: FONT_WEIGHTS.bold,
  },
  modalScroll: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  modalDescription: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
    lineHeight: 22,
  },
  investmentStats: {
    backgroundColor: COLORS.background,
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
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  statValue: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
  },
  suggestionItem: {
    flexDirection: 'row',
    marginBottom: SPACING.sm,
    paddingRight: SPACING.md,
  },
  bulletPoint: {
    fontSize: FONT_SIZES.md,
    color: COLORS.primary,
    marginRight: SPACING.sm,
    fontWeight: FONT_WEIGHTS.bold,
  },
  suggestionText: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    lineHeight: 20,
  },
  investmentTypeCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    ...SHADOWS.small,
  },
  investmentIcon: {
    fontSize: 32,
    marginRight: SPACING.md,
  },
  investmentTypeInfo: {
    flex: 1,
  },
  investmentTypeName: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  investmentTypeDetail: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
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
    fontSize: FONT_SIZES.xs,
    color: '#856404',
    lineHeight: 18,
  },
});

export default BudgetScreen;
