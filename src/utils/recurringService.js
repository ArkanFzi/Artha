import AsyncStorage from '@react-native-async-storage/async-storage';
import { saveTransaction } from './storage';

const RECURRING_KEY = '@recurring_transactions';

/**
 * Recurring Transaction Model:
 * {
 *   id: string,
 *   description: string,
 *   amount: number,
 *   type: 'income' | 'expense',
 *   categoryId: string | null,
 *   frequency: 'daily' | 'weekly' | 'monthly',
 *   startDate: string (ISO),
 *   endDate: string | null (ISO),
 *   lastGenerated: string | null (ISO),
 *   isActive: boolean,
 *   notes: string,
 * }
 */

// Safe date creation helper
const createSafeDate = (dateString) => {
  if (!dateString) return Date.now();
  try {
    const timestamp = Date.parse(dateString);
    return isNaN(timestamp) ? Date.now() : timestamp;
  } catch (error) {
    console.error('Error parsing date:', dateString, error);
    return Date.now();
  }
};

// Get all recurring transactions
export const getRecurringTransactions = async () => {
  try {
    const data = await AsyncStorage.getItem(RECURRING_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting recurring transactions:', error);
    return [];
  }
};

// Save recurring transaction
export const saveRecurringTransaction = async (recurring) => {
  try {
    const recurrings = await getRecurringTransactions();
    const newRecurring = {
      id: Date.now().toString(),
      ...recurring,
      lastGenerated: null,
      isActive: true,
      createdAt: new Date(Date.now()).toISOString(),
    };
    recurrings.push(newRecurring);
    await AsyncStorage.setItem(RECURRING_KEY, JSON.stringify(recurrings));
    return newRecurring;
  } catch (error) {
    console.error('Error saving recurring transaction:', error);
    throw error;
  }
};

// Update recurring transaction
export const updateRecurringTransaction = async (id, updates) => {
  try {
    const recurrings = await getRecurringTransactions();
    const index = recurrings.findIndex(r => r.id === id);
    if (index !== -1) {
      recurrings[index] = { ...recurrings[index], ...updates };
      await AsyncStorage.setItem(RECURRING_KEY, JSON.stringify(recurrings));
      return recurrings[index];
    }
    return null;
  } catch (error) {
    console.error('Error updating recurring transaction:', error);
    throw error;
  }
};

// Delete recurring transaction
export const deleteRecurringTransaction = async (id) => {
  try {
    const recurrings = await getRecurringTransactions();
    const filtered = recurrings.filter(r => r.id !== id);
    await AsyncStorage.setItem(RECURRING_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error deleting recurring transaction:', error);
    throw error;
  }
};

// Toggle recurring transaction active status
export const toggleRecurringTransaction = async (id) => {
  try {
    const recurrings = await getRecurringTransactions();
    const recurring = recurrings.find(r => r.id === id);
    if (recurring) {
      recurring.isActive = !recurring.isActive;
      await AsyncStorage.setItem(RECURRING_KEY, JSON.stringify(recurrings));
      return recurring;
    }
    return null;
  } catch (error) {
    console.error('Error toggling recurring transaction:', error);
    throw error;
  }
};

// Calculate next due date based on frequency (returns timestamp)
const getNextDueTimestamp = (lastGenerated, frequency, startDate) => {
  try {
    const baseTimestamp = lastGenerated 
      ? createSafeDate(lastGenerated)
      : createSafeDate(startDate);
    
    const baseDate = new Date(baseTimestamp);
    
    // Validate date
    if (isNaN(baseDate.getTime())) {
      console.error('Invalid date in getNextDueTimestamp:', { lastGenerated, startDate });
      return Date.now();
    }

    switch (frequency) {
      case 'daily':
        baseDate.setDate(baseDate.getDate() + 1);
        break;
      case 'weekly':
        baseDate.setDate(baseDate.getDate() + 7);
        break;
      case 'monthly':
        baseDate.setMonth(baseDate.getMonth() + 1);
        break;
      default:
        console.warn('Unknown frequency:', frequency);
    }

    return baseDate.getTime();
  } catch (error) {
    console.error('Error in getNextDueTimestamp:', error);
    return Date.now();
  }
};

// Check if recurring transaction is due
const isDue = (recurring) => {
  try {
    const now = Date.now();
    const startTimestamp = createSafeDate(recurring.startDate);
    
    // Not started yet
    if (now < startTimestamp) return false;
    
    // Ended
    if (recurring.endDate) {
      const endTimestamp = createSafeDate(recurring.endDate);
      if (now > endTimestamp) return false;
    }
    
    // Never generated before
    if (!recurring.lastGenerated) return now >= startTimestamp;
    
    // Check if next due date has passed
    const nextDueTimestamp = getNextDueTimestamp(
      recurring.lastGenerated, 
      recurring.frequency, 
      recurring.startDate
    );
    return now >= nextDueTimestamp;
  } catch (error) {
    console.error('Error in isDue:', error);
    return false;
  }
};

// Generate transactions from recurring
export const generateDueRecurringTransactions = async () => {
  try {
    const recurrings = await getRecurringTransactions();
    const activeRecurrings = recurrings.filter(r => r.isActive);
    
    let generatedCount = 0;
    
    for (const recurring of activeRecurrings) {
      try {
        if (isDue(recurring)) {
          const now = new Date(Date.now());
          
          // Create transaction
          const transaction = {
            type: recurring.type,
            amount: recurring.amount,
            description: recurring.description,
            categoryId: recurring.categoryId,
            date: now.toISOString().slice(0, 10),
            notes: `${recurring.notes || ''} (Auto-generated from recurring)`.trim(),
            isRecurring: true,
            recurringId: recurring.id,
          };
          
          await saveTransaction(transaction);
          
          // Update last generated date
          await updateRecurringTransaction(recurring.id, {
            lastGenerated: now.toISOString(),
          });
          
          generatedCount++;
        }
      } catch (itemError) {
        console.error('Error generating recurring transaction:', recurring.id, itemError);
        // Continue with next recurring transaction
      }
    }
    
    return generatedCount;
  } catch (error) {
    console.error('Error generating recurring transactions:', error);
    return 0;
  }
};

// Get upcoming recurring transactions (next 7 days)
export const getUpcomingRecurring = async () => {
  try {
    const recurrings = await getRecurringTransactions();
    const activeRecurrings = recurrings.filter(r => r.isActive);
    
    const upcoming = [];
    const now = Date.now();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    const sevenDaysLater = now + sevenDaysMs;
    
    for (const recurring of activeRecurrings) {
      try {
        const nextDueTimestamp = getNextDueTimestamp(
          recurring.lastGenerated,
          recurring.frequency,
          recurring.startDate
        );
        
        // Check if within next 7 days
        if (nextDueTimestamp >= now && nextDueTimestamp <= sevenDaysLater) {
          const nextDueDate = new Date(nextDueTimestamp);
          upcoming.push({
            ...recurring,
            nextDueDate: nextDueDate.toISOString(),
          });
        }
      } catch (itemError) {
        console.error('Error processing recurring item:', recurring.id, itemError);
        // Continue with next item
      }
    }
    
    // Sort by next due date
    upcoming.sort((a, b) => {
      try {
        const aTime = createSafeDate(a.nextDueDate);
        const bTime = createSafeDate(b.nextDueDate);
        return aTime - bTime;
      } catch (sortError) {
        console.error('Error sorting upcoming:', sortError);
        return 0;
      }
    });
    
    return upcoming;
  } catch (error) {
    console.error('Error getting upcoming recurring:', error);
    return [];
  }
};

// Initialize recurring service (call on app startup)
export const initializeRecurringService = async () => {
  try {
    const generated = await generateDueRecurringTransactions();
    if (generated > 0) {
      console.log(`Generated ${generated} recurring transactions`);
    }
    return generated;
  } catch (error) {
    console.error('Error initializing recurring service:', error);
    return 0;
  }
};
