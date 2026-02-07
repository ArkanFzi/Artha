import { filterTransactionsByMonth, calculateTotalExpense } from './calculations';
import { COLORS } from '../styles/theme';
import { Transaction, Category } from '../types';

export const getLast6MonthsTrend = (transactions: Transaction[]) => {
  const labels: string[] = [];
  const data: number[] = [];
  const now = new Date();

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthStr = d.toISOString().slice(0, 7); // YYYY-MM
    
    // Get month name short (e.g., "Feb")
    const monthName = d.toLocaleDateString('id-ID', { month: 'short' });
    labels.push(monthName);

    const monthlyTransactions = filterTransactionsByMonth(transactions, monthStr);
    const totalExpense = calculateTotalExpense(monthlyTransactions);
    
    data.push(totalExpense);
  }

  return { labels, data };
};

export const getCategoryDistribution = (transactions: Transaction[], categories: Category[], monthStr: string) => {
  const monthlyTransactions = filterTransactionsByMonth(transactions, monthStr);
  const expenses = monthlyTransactions.filter(t => t.type === 'expense');
  
  const categoryMap: Record<string, number> = {};
  let total = 0;

  expenses.forEach(t => {
    const amount = t.amount * (t.exchangeRate || 1);
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

export const getIncomeVsExpense = (transactions: Transaction[], monthStr: string) => {
  const monthlyTransactions = filterTransactionsByMonth(transactions, monthStr);
  
  let income = 0;
  let expense = 0;

  monthlyTransactions.forEach(t => {
    const amount = t.amount * (t.exchangeRate || 1);
    if (t.type === 'income') income += amount;
    else if (t.type === 'expense') expense += amount;
  });

  return {
    data: [
      {
        name: 'Pemasukan',
        amount: income,
        color: COLORS.success as string,
        legendFontColor: '#7F7F7F',
        legendFontSize: 12
      },
      {
        name: 'Pengeluaran',
        amount: expense,
        color: COLORS.danger as string,
        legendFontColor: '#7F7F7F',
        legendFontSize: 12
      }
    ],
    income,
    expense
  };
};
