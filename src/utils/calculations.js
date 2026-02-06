// Format currency to Indonesian Rupiah
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Format date to readable format
export const formatDate = (dateString) => {
  const date = new Date(dateString);
  return new Intl.DateFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
};

// Format date to short format (DD/MM/YYYY)
export const formatDateShort = (dateString) => {
  const date = new Date(dateString);
  return new Intl.DateFormat('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
};

// Get month name
export const getMonthName = (monthIndex) => {
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  return months[monthIndex];
};

// Get current month in YYYY-MM format
export const getCurrentMonth = () => {
  return new Date().toISOString().slice(0, 7);
};

// Get current year
export const getCurrentYear = () => {
  return new Date().getFullYear();
};

// Filter transactions by date range
export const filterTransactionsByDateRange = (transactions, startDate, endDate) => {
  return transactions.filter(t => {
    const transactionDate = new Date(t.date || t.createdAt);
    return transactionDate >= startDate && transactionDate <= endDate;
  });
};

// Filter transactions by month (YYYY-MM format)
export const filterTransactionsByMonth = (transactions, month) => {
  return transactions.filter(t => {
    const transactionMonth = (t.date || t.createdAt).slice(0, 7);
    return transactionMonth === month;
  });
};

// Filter transactions by year
export const filterTransactionsByYear = (transactions, year) => {
  return transactions.filter(t => {
    const transactionYear = new Date(t.date || t.createdAt).getFullYear();
    return transactionYear === year;
  });
};

// Filter transactions by today
export const filterTransactionsByToday = (transactions) => {
  const today = new Date().toISOString().slice(0, 10);
  return transactions.filter(t => {
    const transactionDate = (t.date || t.createdAt).slice(0, 10);
    return transactionDate === today;
  });
};

// Calculate total income
export const calculateTotalIncome = (transactions) => {
  return transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);
};

// Calculate total expense
export const calculateTotalExpense = (transactions) => {
  return transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);
};

// Calculate balance
export const calculateBalance = (transactions) => {
  const income = calculateTotalIncome(transactions);
  const expense = calculateTotalExpense(transactions);
  return income - expense;
};

// Group expenses by category
export const groupExpensesByCategory = (transactions, categories) => {
  const expenses = transactions.filter(t => t.type === 'expense');
  const grouped = {};
  
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
    grouped[categoryId].total += parseFloat(transaction.amount);
    grouped[categoryId].count += 1;
  });
  
  return Object.values(grouped).sort((a, b) => b.total - a.total);
};

// Calculate budget recommendations based on previous month spending
export const calculateBudgetRecommendations = (transactions, categories, totalIncome) => {
  const lastMonth = new Date();
  lastMonth.setMonth(lastMonth.getMonth() - 1);
  const lastMonthStr = lastMonth.toISOString().slice(0, 7);
  
  const lastMonthTransactions = filterTransactionsByMonth(transactions, lastMonthStr);
  const categorySpending = groupExpensesByCategory(lastMonthTransactions, categories);
  
  const totalLastMonthExpense = calculateTotalExpense(lastMonthTransactions);
  
  const recommendations = {};
  
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
};

// Get monthly spending trend (for charts)
export const getMonthlySpendingTrend = (transactions, year) => {
  const yearTransactions = filterTransactionsByYear(transactions, year);
  const monthlyData = Array(12).fill(0);
  
  yearTransactions.forEach(t => {
    if (t.type === 'expense') {
      const month = new Date(t.date || t.createdAt).getMonth();
      monthlyData[month] += parseFloat(t.amount);
    }
  });
  
  return monthlyData;
};

// Calculate budget usage percentage
export const calculateBudgetUsage = (spent, budget) => {
  if (!budget || budget === 0) return 0;
  return Math.min((spent / budget) * 100, 100);
};

// Get budget status color
export const getBudgetStatusColor = (percentage) => {
  if (percentage >= 90) return '#F44336'; // Red - danger
  if (percentage >= 70) return '#FFC107'; // Yellow - warning
  return '#4CAF50'; // Green - safe
};
