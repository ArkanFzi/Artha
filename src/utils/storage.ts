import * as SQLite from 'expo-sqlite';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { Transaction, Category, Budget, Goal, RecurringTransaction } from '../types';

const DATABASE_NAME = 'artha.db';
const MIGRATION_KEY = '@sqlite_migration_completed';

let dbInstance: SQLite.SQLiteDatabase | null = null;

export const getDb = async (): Promise<SQLite.SQLiteDatabase> => {
  if (dbInstance) return dbInstance;
  dbInstance = await SQLite.openDatabaseAsync(DATABASE_NAME);
  return dbInstance;
};

// Default categories
const DEFAULT_CATEGORIES: Category[] = [
  { id: '1', name: 'Makanan & Minuman', icon: '🍔', color: '#FF6B6B', isDefault: true },
  { id: '2', name: 'Transport', icon: '🚗', color: '#4ECDC4', isDefault: true },
  { id: '3', name: 'Belanja', icon: '🛍️', color: '#95E1D3', isDefault: true },
  { id: '4', name: 'Tagihan', icon: '💳', color: '#F38181', isDefault: true },
  { id: '5', name: 'Hiburan', icon: '🎮', color: '#AA96DA', isDefault: true },
  { id: '6', name: 'Kesehatan', icon: '🏥', color: '#FCBAD3', isDefault: true },
  { id: '7', name: 'Pendidikan', icon: '📚', color: '#A8D8EA', isDefault: true },
  { id: '8', name: 'Lainnya', icon: '📦', color: '#FFFFD2', isDefault: true },
];

// Mock data for web platform
const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: '1',
    amount: 50000,
    categoryId: '1',
    type: 'expense',
    description: 'Makan siang',
    note: 'Nasi Padang',
    date: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    isRecurring: false,
  },
  {
    id: '2',
    amount: 1000000,
    categoryId: '7',
    type: 'income',
    description: 'Gaji bulanan',
    note: '',
    date: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    isRecurring: false,
  },
  {
    id: '3',
    amount: 25000,
    categoryId: '2',
    type: 'expense',
    description: 'Transportasi',
    note: 'Grab ke kantor',
    date: new Date(Date.now() - 86400000).toISOString(),
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    isRecurring: false,
  },
];

export const initDb = async () => {
  const db = await getDb();

  await db.execAsync(`
    PRAGMA foreign_keys = ON;
    
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      icon TEXT,
      color TEXT,
      isDefault INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      amount REAL NOT NULL,
      categoryId TEXT,
      type TEXT CHECK(type IN ('income', 'expense')),
      description TEXT,
      note TEXT,
      date TEXT,
      createdAt TEXT,
      isRecurring INTEGER DEFAULT 0,
      recurringId TEXT,
      FOREIGN KEY(categoryId) REFERENCES categories(id)
    );

    CREATE TABLE IF NOT EXISTS recurring_transactions (
      id TEXT PRIMARY KEY,
      type TEXT CHECK(type IN ('income', 'expense')),
      amount REAL NOT NULL,
      description TEXT,
      categoryId TEXT,
      frequency TEXT CHECK(frequency IN ('daily', 'weekly', 'monthly', 'yearly')),
      startDate TEXT,
      endDate TEXT,
      lastGenerated TEXT,
      isActive INTEGER DEFAULT 1,
      notes TEXT,
      createdAt TEXT,
      FOREIGN KEY(categoryId) REFERENCES categories(id)
    );

    CREATE TABLE IF NOT EXISTS budgets (
      month TEXT PRIMARY KEY,
      totalIncome REAL,
      categoryBudgets TEXT
    );

    CREATE TABLE IF NOT EXISTS goals (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      targetAmount REAL NOT NULL,
      currentAmount REAL DEFAULT 0,
      icon TEXT,
      color TEXT,
      deadline TEXT,
      createdAt TEXT
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      type TEXT CHECK(type IN ('budget_warning', 'bill_reminder', 'goal_achieved', 'recurring_transaction', 'general')),
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      isRead INTEGER DEFAULT 0,
      createdAt TEXT NOT NULL,
      relatedId TEXT,
      icon TEXT,
      priority TEXT CHECK(priority IN ('low', 'medium', 'high')) DEFAULT 'medium'
    );
  `);

  // Check if categories exist
  const categoriesCount = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM categories');
  if (categoriesCount && categoriesCount.count === 0) {
    for (const cat of DEFAULT_CATEGORIES) {
      await db.runAsync(
        'INSERT INTO categories (id, name, icon, color, isDefault) VALUES (?, ?, ?, ?, ?)',
        [cat.id, cat.name, cat.icon, cat.color, cat.isDefault ? 1 : 0]
      );
    }
  }

  // Auto migration from AsyncStorage
  try {
    const migrated = await AsyncStorage.getItem(MIGRATION_KEY);
    if (!migrated) {
      await migrateFromAsyncStorage();
    }
  } catch (error) {
    console.log('Migration check/execution error:', error);
  }
};

const migrateFromAsyncStorage = async () => {
  try {
    console.log('Starting migration from AsyncStorage to SQLite...');
    const db = await getDb();

    // 1. Transactions
    const transactionsJson = await AsyncStorage.getItem('@transactions');
    if (transactionsJson) {
      const transactions: Transaction[] = JSON.parse(transactionsJson);
      for (const t of transactions) {
        await db.runAsync(
          `INSERT OR REPLACE INTO transactions (
            id, amount, categoryId, type, description, note, date, createdAt, 
            isRecurring, recurringId
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            t.id, 
            t.amount, 
            t.categoryId, 
            t.type, 
            t.description, 
            t.note || '', 
            t.date, 
            t.createdAt, 
            t.isRecurring ? 1 : 0, 
            t.recurringId || null
          ]
        );
      }
    }

    // 2. Categories
    const categoriesJson = await AsyncStorage.getItem('@categories');
    if (categoriesJson) {
      const categories: Category[] = JSON.parse(categoriesJson);
      for (const cat of categories) {
        await db.runAsync(
          'INSERT OR REPLACE INTO categories (id, name, icon, color, isDefault) VALUES (?, ?, ?, ?, ?)',
          [cat.id, cat.name, cat.icon, cat.color, 0]
        );
      }
    }

    // 3. Budgets
    const budgetJson = await AsyncStorage.getItem('@budget');
    if (budgetJson) {
      const budget: Budget = JSON.parse(budgetJson);
      await db.runAsync(
        'INSERT OR REPLACE INTO budgets (month, totalIncome, categoryBudgets) VALUES (?, ?, ?)',
        [budget.month, budget.totalIncome, JSON.stringify(budget.categoryBudgets)]
      );
    }

    // 4. Goals
    const goalsJson = await AsyncStorage.getItem('@goals');
    if (goalsJson) {
      const goals: Goal[] = JSON.parse(goalsJson);
      for (const g of goals) {
        await db.runAsync(
          'INSERT OR REPLACE INTO goals (id, name, targetAmount, currentAmount, icon, color, deadline, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [g.id, g.name, g.targetAmount, g.currentAmount, g.icon, g.color, g.deadline || null, g.createdAt]
        );
      }
    }

    // 5. Recurring Transactions
    const recurringJson = await AsyncStorage.getItem('@recurring_transactions');
    if (recurringJson) {
      const recurrings: RecurringTransaction[] = JSON.parse(recurringJson);
      for (const r of recurrings) {
        await db.runAsync(
          `INSERT OR REPLACE INTO recurring_transactions (
            id, type, amount, description, categoryId, frequency, startDate, 
            endDate, lastGenerated, isActive, notes, createdAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            r.id, r.type, r.amount, r.description, r.categoryId, r.frequency, 
            r.startDate, r.endDate || null, r.lastGenerated || null, 
            r.isActive ? 1 : 0, r.notes || '', r.createdAt
          ]
        );
      }
    }

    await AsyncStorage.setItem(MIGRATION_KEY, 'true');
    console.log('Migration completed successfully.');
  } catch (error) {
    console.error('Error during migration:', error);
  }
};

// Transaction operations
export const saveTransaction = async (transaction: Omit<Transaction, 'id' | 'createdAt'>): Promise<Transaction> => {
  const db = await getDb();
  const id = Date.now().toString();
  const createdAt = new Date().toISOString();

  await db.runAsync(
    `INSERT INTO transactions (
      id, amount, categoryId, type, description, note, date, createdAt, 
      isRecurring, recurringId
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id, 
      transaction.amount, 
      transaction.categoryId, 
      transaction.type, 
      transaction.description, 
      transaction.note || '', 
      transaction.date, 
      createdAt,
      transaction.isRecurring ? 1 : 0,
      transaction.recurringId || null
    ]
  );

  return { id, ...transaction, createdAt };
};

export const getTransactions = async (): Promise<Transaction[]> => {
  // Return mock data for web platform
  if (Platform.OS === 'web') {
    return MOCK_TRANSACTIONS;
  }
  
  const db = await getDb();
  const rows = await db.getAllAsync<any>('SELECT * FROM transactions ORDER BY date DESC, createdAt DESC');
  
  return rows.map(r => ({
    ...r,
    amount: Number(r.amount),
    isRecurring: Boolean(r.isRecurring)
  }));
};

export const deleteTransaction = async (id: string): Promise<void> => {
  const db = await getDb();
  await db.runAsync('DELETE FROM transactions WHERE id = ?', [id]);
};

// Category operations
export const getCategories = async (): Promise<Category[]> => {
  // Return default categories for web platform
  if (Platform.OS === 'web') {
    return DEFAULT_CATEGORIES;
  }
  
  const db = await getDb();
  const rows = await db.getAllAsync<any>('SELECT * FROM categories');
  return rows.map(r => ({
    ...r,
    isDefault: Boolean(r.isDefault)
  }));
};

export const saveCategory = async (category: Omit<Category, 'id' | 'isDefault'>): Promise<Category> => {
  const db = await getDb();
  const id = Date.now().toString();
  
  await db.runAsync(
    'INSERT INTO categories (id, name, icon, color, isDefault) VALUES (?, ?, ?, ?, ?)',
    [id, category.name, category.icon, category.color, 0]
  );

  return { id, ...category, isDefault: false };
};

export const deleteCategory = async (id: string): Promise<void> => {
  const db = await getDb();
  const cat = await db.getFirstAsync<any>('SELECT isDefault FROM categories WHERE id = ?', [id]);
  if (cat && cat.isDefault) {
    throw new Error('Cannot delete default category');
  }
  await db.runAsync('DELETE FROM categories WHERE id = ?', [id]);
};

// Budget operations
export const saveBudget = async (budget: Budget): Promise<Budget> => {
  const db = await getDb();
  await db.runAsync(
    'INSERT OR REPLACE INTO budgets (month, totalIncome, categoryBudgets) VALUES (?, ?, ?)',
    [budget.month, budget.totalIncome, JSON.stringify(budget.categoryBudgets)]
  );
  return budget;
};

export const getBudget = async (): Promise<Budget | null> => {
  const db = await getDb();
  const currentMonth = new Date().toISOString().slice(0, 7);
  const row = await db.getFirstAsync<any>('SELECT * FROM budgets WHERE month = ?', [currentMonth]);
  
  if (!row) return null;
  
  return {
    month: row.month,
    totalIncome: Number(row.totalIncome),
    categoryBudgets: JSON.parse(row.categoryBudgets)
  };
};

// Goal operations
export const saveGoal = async (goal: Goal): Promise<boolean> => {
  const db = await getDb();
  await db.runAsync(
    'INSERT OR REPLACE INTO goals (id, name, targetAmount, currentAmount, icon, color, deadline, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [goal.id, goal.name, goal.targetAmount, goal.currentAmount, goal.icon, goal.color, goal.deadline || null, goal.createdAt]
  );
  return true;
};

export const getGoals = async (): Promise<Goal[]> => {
  const db = await getDb();
  const rows = await db.getAllAsync<any>('SELECT * FROM goals ORDER BY createdAt DESC');
  return rows.map(r => ({
    ...r,
    targetAmount: Number(r.targetAmount),
    currentAmount: Number(r.currentAmount)
  }));
};

export const deleteGoal = async (id: string): Promise<void> => {
  const db = await getDb();
  await db.runAsync('DELETE FROM goals WHERE id = ?', [id]);
};

// Recurring Transaction operations
export const getRecurringTransactions = async (): Promise<RecurringTransaction[]> => {
  const db = await getDb();
  const rows = await db.getAllAsync<any>('SELECT * FROM recurring_transactions ORDER BY createdAt DESC');
  return rows.map(r => ({
    ...r,
    amount: Number(r.amount),
    isActive: Boolean(r.isActive)
  }));
};

export const saveRecurringTransaction = async (recurring: Omit<RecurringTransaction, 'id' | 'lastGenerated' | 'isActive' | 'createdAt'>): Promise<RecurringTransaction> => {
  const db = await getDb();
  const id = Date.now().toString();
  const createdAt = new Date().toISOString();

  await db.runAsync(
    `INSERT INTO recurring_transactions (
      id, type, amount, description, categoryId, frequency, startDate, 
      endDate, lastGenerated, isActive, notes, createdAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id, recurring.type, recurring.amount, recurring.description, 
      recurring.categoryId || null, recurring.frequency, recurring.startDate, 
      recurring.endDate || null, null, 1, recurring.notes || '', createdAt
    ]
  );

  return { 
    id, ...recurring, lastGenerated: null, isActive: true, createdAt 
  } as RecurringTransaction;
};

export const updateRecurringTransaction = async (id: string, updates: Partial<RecurringTransaction>): Promise<RecurringTransaction | null> => {
  const db = await getDb();
  
  // Build dynamic update query
  const fields = Object.keys(updates);
  if (fields.length === 0) return null;

  const setClause = fields.map(f => `${f} = ?`).join(', ');
  const values = fields.map(f => {
    const val = (updates as any)[f];
    if (typeof val === 'boolean') return val ? 1 : 0;
    return val;
  });

  await db.runAsync(
    `UPDATE recurring_transactions SET ${setClause} WHERE id = ?`,
    [...values, id]
  );

  const updated = await db.getFirstAsync<any>('SELECT * FROM recurring_transactions WHERE id = ?', [id]);
  if (!updated) return null;

  return {
    ...updated,
    amount: Number(updated.amount),
    isActive: Boolean(updated.isActive)
  };
};

export const deleteRecurringTransaction = async (id: string): Promise<void> => {
  const db = await getDb();
  await db.runAsync('DELETE FROM recurring_transactions WHERE id = ?', [id]);
};

// Clear all data
export const clearAllData = async (): Promise<void> => {
  const db = await getDb();
  await _clearAllTables(db);
  await AsyncStorage.removeItem(MIGRATION_KEY);
};

const _clearAllTables = async (db: SQLite.SQLiteDatabase) => {
  await db.execAsync(`
    DELETE FROM transactions;
    DELETE FROM budgets;
    DELETE FROM goals;
    DELETE FROM recurring_transactions;
    DELETE FROM categories WHERE isDefault = 0;
  `);
};

// Export all data as JSON
export const exportData = async (): Promise<any> => {
  const transactions = await getTransactions();
  const categories = await getCategories();
  const goals = await getGoals();
  const recurring = await getRecurringTransactions();
  
  // For budget, we might have multiple months in the future, 
  // currently getBudget only returns current month. 
  // Let's fetch all budgets.
  const db = await getDb();
  const budgets = await db.getAllAsync<any>('SELECT * FROM budgets');

  return {
    transactions,
    categories: categories.filter(c => !c.isDefault),
    budgets,
    goals,
    recurring_transactions: recurring
  };
};

// Import all data from JSON
export const importData = async (data: any): Promise<void> => {
  const db = await getDb();
  
  // Use a transaction for atomic import if possible (db.withTransactionAsync if available)
  // For now, let's just clear and insert
  await _clearAllTables(db);

  if (data.categories) {
    for (const cat of data.categories) {
      await db.runAsync(
        'INSERT OR REPLACE INTO categories (id, name, icon, color, isDefault) VALUES (?, ?, ?, ?, ?)',
        [cat.id, cat.name, cat.icon, cat.color, 0]
      );
    }
  }

  if (data.transactions) {
    for (const t of data.transactions) {
      await db.runAsync(
        `INSERT OR REPLACE INTO transactions (
          id, amount, categoryId, type, description, note, date, createdAt, 
          isRecurring, recurringId
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          t.id, t.amount, t.categoryId, t.type, t.description || '', t.note || '', 
          t.date, t.createdAt, t.isRecurring ? 1 : 0, t.recurringId || null
        ]
      );
    }
  }

  if (data.budgets) {
    for (const b of data.budgets) {
      await db.runAsync(
        'INSERT OR REPLACE INTO budgets (month, totalIncome, categoryBudgets) VALUES (?, ?, ?)',
        [b.month, b.totalIncome, typeof b.categoryBudgets === 'string' ? b.categoryBudgets : JSON.stringify(b.categoryBudgets)]
      );
    }
  }

  if (data.goals) {
    for (const g of data.goals) {
      await db.runAsync(
        'INSERT OR REPLACE INTO goals (id, name, targetAmount, currentAmount, icon, color, deadline, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [g.id, g.name, g.targetAmount, g.currentAmount, g.icon, g.color, g.deadline || null, g.createdAt]
      );
    }
  }

  if (data.recurring_transactions) {
    for (const r of data.recurring_transactions) {
      await db.runAsync(
        `INSERT OR REPLACE INTO recurring_transactions (
          id, type, amount, description, categoryId, frequency, startDate, 
          endDate, lastGenerated, isActive, notes, createdAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          r.id, r.type, r.amount, r.description, r.categoryId, r.frequency, 
          r.startDate, r.endDate || null, r.lastGenerated || null, 
          r.isActive ? 1 : 0, r.notes || '', r.createdAt
        ]
      );
    }
  }
};

// Notification operations
export const createNotification = async (notification: Omit<import('../types').Notification, 'id'>): Promise<import('../types').Notification> => {
  // Skip for web
  if (Platform.OS === 'web') {
    return { id: Date.now().toString(), ...notification };
  }
  
  const db = await getDb();
  const id = Date.now().toString();
  
  await db.runAsync(
    `INSERT INTO notifications (
      id, type, title, message, isRead, createdAt, relatedId, icon, priority
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      notification.type,
      notification.title,
      notification.message,
      notification.isRead ? 1 : 0,
      notification.createdAt,
      notification.relatedId || null,
      notification.icon,
      notification.priority
    ]
  );
  
  return { id, ...notification };
};

export const getNotifications = async (): Promise<import('../types').Notification[]> => {
  // Return empty for web
  if (Platform.OS === 'web') {
    return [];
  }
  
  const db = await getDb();
  const rows = await db.getAllAsync<any>('SELECT * FROM notifications ORDER BY createdAt DESC');
  
  return rows.map(r => ({
    ...r,
    isRead: Boolean(r.isRead)
  }));
};

export const getUnreadNotificationsCount = async (): Promise<number> => {
  // Return 0 for web
  if (Platform.OS === 'web') {
    return 0;
  }
  
  const db = await getDb();
  const result = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM notifications WHERE isRead = 0');
  return result?.count || 0;
};

export const markNotificationAsRead = async (id: string): Promise<void> => {
  if (Platform.OS === 'web') return;
  
  const db = await getDb();
  await db.runAsync('UPDATE notifications SET isRead = 1 WHERE id = ?', [id]);
};

export const markAllNotificationsAsRead = async (): Promise<void> => {
  if (Platform.OS === 'web') return;
  
  const db = await getDb();
  await db.runAsync('UPDATE notifications SET isRead = 1');
};

export const deleteNotification = async (id: string): Promise<void> => {
  if (Platform.OS === 'web') return;
  
  const db = await getDb();
  await db.runAsync('DELETE FROM notifications WHERE id = ?', [id]);
};
