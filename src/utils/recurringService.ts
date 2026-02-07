import { 
  saveTransaction, 
  getRecurringTransactions, 
  saveRecurringTransaction, 
  updateRecurringTransaction, 
  deleteRecurringTransaction 
} from './storage';
import { RecurringTransaction, Transaction, RecurringFrequency } from '../types';

const createSafeDate = (dateString: string | null): number => {
  if (!dateString) return Date.now();
  try {
    const timestamp = Date.parse(dateString);
    return isNaN(timestamp) ? Date.now() : timestamp;
  } catch (error) {
    console.error('Error parsing date:', dateString, error);
    return Date.now();
  }
};

export { getRecurringTransactions, saveRecurringTransaction, updateRecurringTransaction, deleteRecurringTransaction };

export const toggleRecurringTransaction = async (id: string): Promise<RecurringTransaction | null> => {
  try {
    const recurrings = await getRecurringTransactions();
    const recurring = recurrings.find(r => r.id === id);
    if (recurring) {
      return await updateRecurringTransaction(id, { isActive: !recurring.isActive });
    }
    return null;
  } catch (error) {
    console.error('Error toggling recurring transaction:', error);
    throw error;
  }
};

const getNextDueTimestamp = (lastGenerated: string | null, frequency: RecurringFrequency, startDate: string): number => {
  try {
    const baseTimestamp = lastGenerated 
      ? createSafeDate(lastGenerated)
      : createSafeDate(startDate);
    
    const baseDate = new Date(baseTimestamp);
    
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

const isDue = (recurring: RecurringTransaction): boolean => {
  try {
    const now = Date.now();
    const startTimestamp = createSafeDate(recurring.startDate);
    
    if (now < startTimestamp) return false;
    
    if (recurring.endDate) {
      const endTimestamp = createSafeDate(recurring.endDate);
      if (now > endTimestamp) return false;
    }
    
    if (!recurring.lastGenerated) return now >= startTimestamp;
    
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

export const generateDueRecurringTransactions = async (): Promise<number> => {
  try {
    const recurrings = await getRecurringTransactions();
    const activeRecurrings = recurrings.filter(r => r.isActive);
    
    let generatedCount = 0;
    
    for (const recurring of activeRecurrings) {
      try {
        if (isDue(recurring)) {
          const now = new Date();
          
          const transaction: Omit<Transaction, 'id' | 'createdAt'> = {
            type: recurring.type,
            amount: recurring.amount,
            description: recurring.description,
            categoryId: recurring.categoryId || '8', // Default to 'Lainnya' if null
            date: now.toISOString().slice(0, 10),
            note: `${recurring.notes || ''} (Auto-generated from recurring)`.trim(),
            isRecurring: true,
            recurringId: recurring.id,
          };
          
          await saveTransaction(transaction);
          
          await updateRecurringTransaction(recurring.id, {
            lastGenerated: now.toISOString(),
          });
          
          generatedCount++;
        }
      } catch (itemError) {
        console.error('Error generating recurring transaction:', recurring.id, itemError);
      }
    }
    
    return generatedCount;
  } catch (error) {
    console.error('Error generating recurring transactions:', error);
    return 0;
  }
};

export const getUpcomingRecurring = async () => {
  try {
    const recurrings = await getRecurringTransactions();
    const activeRecurrings = recurrings.filter(r => r.isActive);
    
    const upcoming: (RecurringTransaction & { nextDueDate: string })[] = [];
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
        
        if (nextDueTimestamp >= now && nextDueTimestamp <= sevenDaysLater) {
          const nextDueDate = new Date(nextDueTimestamp);
          upcoming.push({
            ...recurring,
            nextDueDate: nextDueDate.toISOString(),
          });
        }
      } catch (itemError) {
        console.error('Error processing recurring item:', recurring.id, itemError);
      }
    }
    
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

export const initializeRecurringService = async (): Promise<number> => {
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
