import { Transaction, Category } from '../types';

// Format currency to Indonesian Rupiah
export const formatCurrency = (amount: number | string | null | undefined): string => {
  try {
    if (amount === null || amount === undefined) return 'Rp 0';
    
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(numAmount)) return 'Rp 0';
    
    // Manual formatting to avoid Intl issues
    const absAmount = Math.abs(numAmount);
    const formatted = absAmount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    const sign = numAmount < 0 ? '-' : '';
    
    return `${sign}Rp ${formatted}`;
  } catch (error) {
    console.error('Error formatting currency:', error);
    return 'Rp 0';
  }
};

// Format date to readable format
export const formatDate = (dateString: string): string => {
  try {
    if (!dateString) return '';
    
    // Parse date string manually (YYYY-MM-DD format)
    const parts = dateString.slice(0, 10).split('-');
    if (parts.length !== 3) return dateString;
    
    const year = parts[0];
    const monthIndex = parseInt(parts[1]) - 1;
    const day = parseInt(parts[2]);
    
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    
    const monthName = months[monthIndex] || parts[1];
    return `${day} ${monthName} ${year}`;
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateString;
  }
};

// Format date to short format (DD/MM/YYYY)
export const formatDateShort = (dateString: string): string => {
  try {
    if (!dateString) return '';
    
    const parts = dateString.slice(0, 10).split('-');
    if (parts.length !== 3) return dateString;
    
    const year = parts[0];
    const month = parts[1];
    const day = parts[2];
    
    return `${day}/${month}/${year}`;
  } catch (error) {
    console.error('Error formatting date short:', error);
    return dateString;
  }
};

// Get month name
export const getMonthName = (monthIndex: number): string => {
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  return months[monthIndex];
};

// Get current month in YYYY-MM format
export const getCurrentMonth = (): string => {
  try {
    return new Date(Date.now()).toISOString().slice(0, 7);
  } catch (error) {
    console.error('Error getting current month:', error);
    const now = new Date(Date.now());
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }
};

// Get current year
export const getCurrentYear = (): number => {
  try {
    return new Date(Date.now()).getFullYear();
  } catch (error) {
    console.error('Error getting current year:', error);
    return new Date().getFullYear();
  }
};

// Filter transactions by date range
export const filterTransactionsByDateRange = (transactions: Transaction[], startDate: Date | string, endDate: Date | string): Transaction[] => {
  return transactions.filter(t => {
    try {
      const transactionTimestamp = Date.parse(t.date || t.createdAt);
      const startTimestamp = startDate instanceof Date ? startDate.getTime() : Date.parse(startDate);
      const endTimestamp = endDate instanceof Date ? endDate.getTime() : Date.parse(endDate);
      return transactionTimestamp >= startTimestamp && transactionTimestamp <= endTimestamp;
    } catch (error) {
      return false;
    }
  });
};

// Filter transactions by month (YYYY-MM format)
export const filterTransactionsByMonth = (transactions: Transaction[], month: string): Transaction[] => {
  return transactions.filter(t => {
    const transactionMonth = (t.date || t.createdAt).slice(0, 7);
    return transactionMonth === month;
  });
};

// Filter transactions by year
export const filterTransactionsByYear = (transactions: Transaction[], year: number): Transaction[] => {
  return transactions.filter(t => {
    try {
      const dateStr = t.date || t.createdAt;
      const transactionYear = parseInt(dateStr.slice(0, 4));
      return transactionYear === year;
    } catch (error) {
      return false;
    }
  });
};

// Filter transactions by today
export const filterTransactionsByToday = (transactions: Transaction[]): Transaction[] => {
  try {
    const today = new Date(Date.now()).toISOString().slice(0, 10);
    return transactions.filter(t => {
      const transactionDate = (t.date || t.createdAt).slice(0, 10);
      return transactionDate === today;
    });
  } catch (error) {
    console.error('Error filtering by today:', error);
    return [];
  }
};

interface TransactionWithExchangeRate extends Transaction {
  exchangeRate?: number;
}

// Calculate total income (converted to base currency IDR)
export const calculateTotalIncome = (transactions: TransactionWithExchangeRate[]): number => {
  return transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + (parseFloat(t.amount.toString()) * (t.exchangeRate || 1)), 0);
};

// Calculate total expense (converted to base currency IDR)
export const calculateTotalExpense = (transactions: TransactionWithExchangeRate[]): number => {
  return transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + (parseFloat(t.amount.toString()) * (t.exchangeRate || 1)), 0);
};

// Calculate balance
export const calculateBalance = (transactions: TransactionWithExchangeRate[]): number => {
  const income = calculateTotalIncome(transactions);
  const expense = calculateTotalExpense(transactions);
  return income - expense;
};

export interface GroupedCategory {
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  total: number;
  count: number;
}

// Group expenses by category
export const groupExpensesByCategory = (transactions: TransactionWithExchangeRate[], categories: Category[]): GroupedCategory[] => {
  const expenses = transactions.filter(t => t.type === 'expense');
  const grouped: Record<string, GroupedCategory> = {};
  
  expenses.forEach(transaction => {
    const categoryId = transaction.categoryId;
    if (!grouped[categoryId]) {
      const category = categories.find(c => c.id === categoryId);
      grouped[categoryId] = {
        categoryId,
        categoryName: category?.name || 'Unknown',
        categoryIcon: category?.icon || '📦',
        categoryColor: category?.color || '#999',
        total: 0,
        count: 0,
      };
    }
    grouped[categoryId].total += (parseFloat(transaction.amount.toString()) * (transaction.exchangeRate || 1));
    grouped[categoryId].count += 1;
  });
  
  return Object.values(grouped).sort((a, b) => b.total - a.total);
};

// Calculate budget recommendations based on previous month spending
export const calculateBudgetRecommendations = (transactions: Transaction[], categories: Category[], totalIncome: number): Record<string, number> => {
  try {
    const now = new Date(Date.now());
    now.setMonth(now.getMonth() - 1);
    const lastMonthStr = now.toISOString().slice(0, 7);
  
    const lastMonthTransactions = filterTransactionsByMonth(transactions, lastMonthStr);
    const categorySpending = groupExpensesByCategory(lastMonthTransactions as TransactionWithExchangeRate[], categories);
    
    const totalLastMonthExpense = calculateTotalExpense(lastMonthTransactions as TransactionWithExchangeRate[]);
    
    const recommendations: Record<string, number> = {};
    
    if (totalLastMonthExpense > 0) {
      categorySpending.forEach(cat => {
        const percentage = cat.total / totalLastMonthExpense;
        recommendations[cat.categoryId] = Math.round(totalIncome * percentage);
      });
    } else {
      // Default allocation if no previous data
      const perCategory = Math.round(totalIncome * 0.7 / categories.length);
      categories.forEach(cat => {
        recommendations[cat.id] = perCategory;
      });
    }
    
    return recommendations;
  } catch (error) {
    console.error('Error calculating budget recommendations:', error);
    const perCategory = Math.round(totalIncome * 0.7 / categories.length);
    const recommendations: Record<string, number> = {};
    categories.forEach(cat => {
      recommendations[cat.id] = perCategory;
    });
    return recommendations;
  }
};

// Get monthly spending trend (for charts)
export const getMonthlySpendingTrend = (transactions: TransactionWithExchangeRate[], year: number): number[] => {
  const yearTransactions = filterTransactionsByYear(transactions, year);
  const monthlyData = Array(12).fill(0);
  
  yearTransactions.forEach(t => {
    if (t.type === 'expense') {
      try {
        const dateStr = t.date || t.createdAt;
        const month = parseInt(dateStr.slice(5, 7)) - 1;
        if (month >= 0 && month < 12) {
          monthlyData[month] += (parseFloat(t.amount.toString()) * (t.exchangeRate || 1));
        }
      } catch (error) {
        console.error('Error processing transaction month:', error);
      }
    }
  });
  
  return monthlyData;
};

// Calculate budget usage percentage
export const calculateBudgetUsage = (spent: number, budget: number): number => {
  if (!budget || budget === 0) return 0;
  return Math.min((spent / budget) * 100, 100);
};

// Get budget status color
export const getBudgetStatusColor = (percentage: number): string => {
  if (percentage >= 90) return '#F44336'; // Red - danger
  if (percentage >= 70) return '#FFC107'; // Yellow - warning
  return '#4CAF50'; // Green - safe
};

export interface InvestmentRecommendation {
  remainingBudget: number;
  percentage: number;
  minInvestment: number;
  idealInvestment: number;
  maxInvestment: number;
  recommended: number;
}

// Calculate investment recommendation
export const calculateInvestmentRecommendation = (totalIncome: number, totalExpenseBudget: number): InvestmentRecommendation => {
  const remainingBudget = totalIncome - totalExpenseBudget;
  const percentage = (remainingBudget / totalIncome) * 100;
  
  const minInvestment = totalIncome * 0.10;
  const idealInvestment = totalIncome * 0.20;
  const maxInvestment = totalIncome * 0.30;
  
  return {
    remainingBudget,
    percentage,
    minInvestment,
    idealInvestment,
    maxInvestment,
    recommended: Math.min(Math.max(remainingBudget * 0.7, minInvestment), maxInvestment),
  };
};

export interface InvestmentSuggestion {
  level: 'minimal' | 'conservative' | 'moderate' | 'aggressive';
  title: string;
  description: string;
  suggestions: string[];
  investmentTypes: { name: string; risk: string; return: string; icon: string }[];
}

// Get investment suggestions based on remaining budget percentage
export const getInvestmentSuggestions = (remainingPercentage: number): InvestmentSuggestion => {
  if (remainingPercentage < 10) {
    return {
      level: 'minimal',
      title: '⚠️ Fokus Hemat Dulu',
      description: 'Sisa budget Anda kurang dari 10%. Prioritaskan untuk mengurangi pengeluaran sebelum investasi.',
      suggestions: [
        'Review kembali pengeluaran bulanan',
        'Cari cara untuk menghemat (misal: masak sendiri)',
        'Mulai dengan menabung emergency fund minimal',
      ],
      investmentTypes: [],
    };
  } else if (remainingPercentage < 20) {
    return {
      level: 'conservative',
      title: '🛡️ Investasi Konservatif',
      description: 'Sisa budget 10-20%. Mulai dengan investasi yang aman dan stabil.',
      suggestions: [
        'Sisihkan 3-6 bulan pengeluaran untuk emergency fund',
        'Mulai investasi dengan risiko rendah',
        'Konsisten lebih penting dari jumlah',
      ],
      investmentTypes: [
        { name: 'Deposito', risk: 'Rendah', return: '3-5% per tahun', icon: '🏦' },
        { name: 'Emas', risk: 'Rendah', return: '5-10% per tahun', icon: '🪙' },
        { name: 'Reksadana Pasar Uang', risk: 'Rendah', return: '4-7% per tahun', icon: '💰' },
      ],
    };
  } else if (remainingPercentage < 30) {
    return {
      level: 'moderate',
      title: '📈 Investasi Moderat',
      description: 'Sisa budget 20-30%. Anda bisa mulai diversifikasi investasi.',
      suggestions: [
        'Alokasikan 70% untuk investasi aman, 30% untuk moderat',
        'Mulai belajar tentang reksadana dan obligasi',
        'Pertimbangkan investasi jangka menengah (3-5 tahun)',
      ],
      investmentTypes: [
        { name: 'Reksadana Campuran', risk: 'Menengah', return: '8-12% per tahun', icon: '📊' },
        { name: 'Obligasi', risk: 'Menengah', return: '6-10% per tahun', icon: '📜' },
        { name: 'Emas + Reksadana', risk: 'Menengah', return: '7-12% per tahun', icon: '💎' },
      ],
    };
  } else {
    return {
      level: 'aggressive',
      title: '🚀 Investasi Agresif',
      description: 'Sisa budget >30%. Anda punya ruang untuk investasi dengan return lebih tinggi.',
      suggestions: [
        'Diversifikasi: 50% aman, 30% moderat, 20% agresif',
        'Pelajari analisis fundamental dan teknikal',
        'Investasi jangka panjang (>5 tahun) untuk hasil maksimal',
        'JANGAN investasi uang yang Anda butuhkan dalam 1-2 tahun',
      ],
      investmentTypes: [
        { name: 'Reksadana Saham', risk: 'Tinggi', return: '12-20% per tahun', icon: '📈' },
        { name: 'Saham Blue Chip', risk: 'Tinggi', return: '15-25% per tahun', icon: '💹' },
        { name: 'P2P Lending', risk: 'Tinggi', return: '12-18% per tahun', icon: '🤝' },
      ],
    };
  }
};

// Format percentage
export const formatPercentage = (value: number): string => {
  return `${value.toFixed(1)}%`;
};
