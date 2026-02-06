import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  TRANSACTIONS: '@transactions',
  CATEGORIES: '@categories',
  BUDGET: '@budget',
  GOALS: '@goals',
};

// Transaction operations
export const saveTransaction = async (transaction) => {
  try {
    const transactions = await getTransactions();
    const newTransaction = {
      id: Date.now().toString(),
      ...transaction,
      createdAt: new Date().toISOString(),
    };
    transactions.push(newTransaction);
    await AsyncStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(transactions));
    return newTransaction;
  } catch (error) {
    console.error('Error saving transaction:', error);
    throw error;
  }
};

export const getTransactions = async () => {
  try {
    const data = await AsyncStorage.getItem(KEYS.TRANSACTIONS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting transactions:', error);
    return [];
  }
};

export const deleteTransaction = async (id) => {
  try {
    const transactions = await getTransactions();
    const filtered = transactions.filter(t => t.id !== id);
    await AsyncStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error deleting transaction:', error);
    throw error;
  }
};

// Category operations
export const getCategories = async () => {
  try {
    const data = await AsyncStorage.getItem(KEYS.CATEGORIES);
    if (data) {
      return JSON.parse(data);
    }
    // Default categories
    const defaultCategories = [
      { id: '1', name: 'Makanan & Minuman', icon: '🍔', color: '#FF6B6B', isDefault: true },
      { id: '2', name: 'Transport', icon: '🚗', color: '#4ECDC4', isDefault: true },
      { id: '3', name: 'Belanja', icon: '🛍️', color: '#95E1D3', isDefault: true },
      { id: '4', name: 'Tagihan', icon: '💳', color: '#F38181', isDefault: true },
      { id: '5', name: 'Hiburan', icon: '🎮', color: '#AA96DA', isDefault: true },
      { id: '6', name: 'Kesehatan', icon: '🏥', color: '#FCBAD3', isDefault: true },
      { id: '7', name: 'Pendidikan', icon: '📚', color: '#A8D8EA', isDefault: true },
      { id: '8', name: 'Lainnya', icon: '📦', color: '#FFFFD2', isDefault: true },
    ];
    await AsyncStorage.setItem(KEYS.CATEGORIES, JSON.stringify(defaultCategories));
    return defaultCategories;
  } catch (error) {
    console.error('Error getting categories:', error);
    return [];
  }
};

export const saveCategory = async (category) => {
  try {
    const categories = await getCategories();
    const newCategory = {
      id: Date.now().toString(),
      ...category,
      isDefault: false,
    };
    categories.push(newCategory);
    await AsyncStorage.setItem(KEYS.CATEGORIES, JSON.stringify(categories));
    return newCategory;
  } catch (error) {
    console.error('Error saving category:', error);
    throw error;
  }
};

export const deleteCategory = async (id) => {
  try {
    const categories = await getCategories();
    const category = categories.find(c => c.id === id);
    if (category?.isDefault) {
      throw new Error('Cannot delete default category');
    }
    const filtered = categories.filter(c => c.id !== id);
    await AsyncStorage.setItem(KEYS.CATEGORIES, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error deleting category:', error);
    throw error;
  }
};

// Budget operations
export const saveBudget = async (budget) => {
  try {
    const budgetData = {
      ...budget,
      month: budget.month || new Date().toISOString().slice(0, 7), // YYYY-MM format
      updatedAt: new Date().toISOString(),
    };
    await AsyncStorage.setItem(KEYS.BUDGET, JSON.stringify(budgetData));
    return budgetData;
  } catch (error) {
    console.error('Error saving budget:', error);
    throw error;
  }
};

export const getBudget = async () => {
  try {
    const data = await AsyncStorage.getItem(KEYS.BUDGET);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error getting budget:', error);
    return null;
  }
};

// Goal operations
export const saveGoal = async (goal) => {
  try {
    const goals = await getGoals();
    let updatedGoals;
    
    if (goal.id) {
      // Update existing
      updatedGoals = goals.map(g => g.id === goal.id ? { ...g, ...goal } : g);
    } else {
      // Create new
      const newGoal = {
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        currentAmount: 0,
        ...goal,
      };
      updatedGoals = [...goals, newGoal];
    }
    
    await AsyncStorage.setItem(KEYS.GOALS, JSON.stringify(updatedGoals));
    return true;
  } catch (error) {
    console.error('Error saving goal:', error);
    throw error;
  }
};

export const getGoals = async () => {
  try {
    const data = await AsyncStorage.getItem(KEYS.GOALS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting goals:', error);
    return [];
  }
};

export const deleteGoal = async (id) => {
  try {
    const goals = await getGoals();
    const filtered = goals.filter(g => g.id !== id);
    await AsyncStorage.setItem(KEYS.GOALS, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error deleting goal:', error);
    throw error;
  }
};

// Clear all data (for testing/reset)
export const clearAllData = async () => {
  try {
    await AsyncStorage.multiRemove([KEYS.TRANSACTIONS, KEYS.CATEGORIES, KEYS.BUDGET]);
  } catch (error) {
    console.error('Error clearing data:', error);
    throw error;
  }
};
