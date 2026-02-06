import { filterTransactionsByMonth, calculateTotalExpense, getMonthName } from './calculations';
import { COLORS } from '../styles/theme';

export const getLast6MonthsTrend = (transactions) => {
  const labels = [];
  const data = [];
  const now = new Date();

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthStr = d.toISOString().slice(0, 7); // YYYY-MM
    
    // Get month name short (e.g., "Feb")
    const monthName = d.toLocaleDateString('id-ID', { month: 'short' });
    labels.push(monthName);

    const monthlyTransactions = filterTransactionsByMonth(transactions, monthStr);
    const totalExpense = calculateTotalExpense(monthlyTransactions);
    
    // Convert to millions or thousands for cleaner chart if large
    // For now, keep as raw value, but we might scale it in the component
    data.push(totalExpense);
  }

  return { labels, data };
};

export const getCategoryDistribution = (transactions, categories, monthStr) => {
  const monthlyTransactions = filterTransactionsByMonth(transactions, monthStr);
  const expenses = monthlyTransactions.filter(t => t.type === 'expense');
  
  const categoryMap = {};
  let total = 0;

  expenses.forEach(t => {
    const amount = parseFloat(t.amount) * (parseFloat(t.exchangeRate) || 1);
    if (!categoryMap[t.categoryId]) {
      categoryMap[t.categoryId] = 0;
    }
    categoryMap[t.categoryId] += amount;
    total += amount;
  });

  // Convert to array for Pie Chart
  const data = Object.keys(categoryMap).map(catId => {
    const category = categories.find(c => c.id === catId);
    return {
      name: category ? category.name : 'Lainnya',
      population: categoryMap[catId],
      color: category ? category.color : '#bdc3c7',
      legendFontColor: '#7F7F7F',
      legendFontSize: 12,
      id: catId
    };
  }).sort((a, b) => b.population - a.population);

  return { data, total };
};

export const getIncomeVsExpense = (transactions, monthStr) => {
  const monthlyTransactions = filterTransactionsByMonth(transactions, monthStr);
  
  let income = 0;
  let expense = 0;

  monthlyTransactions.forEach(t => {
    const amount = parseFloat(t.amount) * (parseFloat(t.exchangeRate) || 1);
    if (t.type === 'income') income += amount;
    else if (t.type === 'expense') expense += amount;
  });

  return {
    data: [
      {
        name: 'Pemasukan',
        amount: income,
        color: COLORS.income,
        legendFontColor: '#7F7F7F',
        legendFontSize: 12
      },
      {
        name: 'Pengeluaran',
        amount: expense,
        color: COLORS.expense,
        legendFontColor: '#7F7F7F',
        legendFontSize: 12
      }
    ],
    income,
    expense
  };
};
