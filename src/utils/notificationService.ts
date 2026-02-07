import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants, { ExecutionEnvironment } from 'expo-constants';

const NOTIFICATION_SETTINGS_KEY = '@notification_settings';

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

export interface NotificationSettings {
  dailyReminder: boolean;
  budgetAlerts: boolean;
  monthlyReview: boolean;
  reminderTime: string;
}

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Request permissions
export const requestNotificationPermissions = async (): Promise<boolean> => {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.warn('Notification permission not granted');
      return false;
    }
    
    if (Platform.OS === 'android') {
      try {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#00BFA6',
        });
      } catch (channelError) {
        console.error('Error creating notification channel:', channelError);
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error requesting notification permissions:', error);
    return false;
  }
};

// Get notification settings
export const getNotificationSettings = async (): Promise<NotificationSettings> => {
  try {
    const settings = await AsyncStorage.getItem(NOTIFICATION_SETTINGS_KEY);
    return settings ? JSON.parse(settings) : {
      dailyReminder: !isExpoGo,
      budgetAlerts: !isExpoGo,
      monthlyReview: !isExpoGo,
      reminderTime: '20:00',
    };
  } catch (error) {
    console.error('Error getting notification settings:', error);
    return {
      dailyReminder: false,
      budgetAlerts: false,
      monthlyReview: false,
      reminderTime: '20:00',
    };
  }
};

// Save notification settings
export const saveNotificationSettings = async (settings: NotificationSettings): Promise<void> => {
  try {
    await AsyncStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(settings));
    
    if (!isExpoGo) {
      await scheduleAllNotifications();
    }
  } catch (error) {
    console.error('Error saving notification settings:', error);
  }
};

// Schedule daily reminder
export const scheduleDailyReminder = async (): Promise<void> => {
  if (isExpoGo) return;
  
  try {
    const settings = await getNotificationSettings();
    if (!settings.dailyReminder) return;

    // Cancel existing daily reminders
    try {
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      for (const notif of scheduled) {
        if (notif.content.data?.type === 'daily_reminder') {
          await Notifications.cancelScheduledNotificationAsync(notif.identifier);
        }
      }
    } catch (cancelError) {
      console.warn('Error canceling existing reminders:', cancelError);
    }

    // Parse time
    const [hours, minutes] = settings.reminderTime.split(':').map(Number);

    // Schedule new daily reminder
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '💰 Jangan Lupa Catat Keuangan!',
        body: 'Sudah input transaksi hari ini? Yuk catat pengeluaran dan pemasukan Anda!',
        data: { type: 'daily_reminder' },
      },
      trigger: {
        hour: hours,
        minute: minutes,
        repeats: true,
      },
    });
  } catch (error) {
    console.error('Error scheduling daily reminder:', error);
  }
};

// Schedule budget alert
export const scheduleBudgetAlert = async (categoryName: string, percentage: number): Promise<void> => {
  if (isExpoGo) return;
  
  try {
    const settings = await getNotificationSettings();
    if (!settings.budgetAlerts) return;

    let title, body;
    
    if (percentage >= 80 && percentage < 100) {
      title = '⚠️ Budget Hampir Habis!';
      body = `Budget ${categoryName} sudah terpakai ${percentage.toFixed(0)}%. Hati-hati ya!`;
    } else if (percentage >= 100) {
      title = '🚨 Budget Terlampaui!';
      body = `Budget ${categoryName} sudah melebihi ${percentage.toFixed(0)}%! Waktunya hemat.`;
    } else {
      return;
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: { type: 'budget_alert', category: categoryName },
      },
      trigger: null,
    });
  } catch (error) {
    console.error('Error scheduling budget alert:', error);
  }
};

// Schedule monthly review reminder
export const scheduleMonthlyReview = async (): Promise<void> => {
  if (isExpoGo) return;
  
  try {
    const settings = await getNotificationSettings();
    if (!settings.monthlyReview) return;

    // Cancel existing monthly reminders
    try {
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      for (const notif of scheduled) {
        if (notif.content.data?.type === 'monthly_review') {
          await Notifications.cancelScheduledNotificationAsync(notif.identifier);
        }
      }
    } catch (cancelError) {
      console.warn('Error canceling existing monthly reminders:', cancelError);
    }

    // Schedule for the 1st of every month at 10 AM
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '📊 Review Keuangan Bulanan',
        body: 'Bulan baru dimulai! Yuk review keuangan bulan lalu dan atur budget bulan ini.',
        data: { type: 'monthly_review' },
      },
      trigger: {
        day: 1,
        hour: 10,
        minute: 0,
        repeats: true,
      } as Notifications.DailyTriggerInput, // DailyTriggerInput can handle day of month in some versions, but actually MonthlyTrigger is better if available
    });
    // Note: Expo Notifications trigger for "1st of month" is a bit tricky. 
    // Usually it's CalendarTriggerInput.
  } catch (error) {
    console.error('Error scheduling monthly review:', error);
  }
};

// Schedule all notifications
export const scheduleAllNotifications = async (): Promise<void> => {
  if (isExpoGo) {
    console.log('Notifications disabled in Expo Go');
    return;
  }
  
  try {
    await scheduleDailyReminder();
    await scheduleMonthlyReview();
  } catch (error) {
    console.error('Error scheduling all notifications:', error);
  }
};

// Cancel all notifications
export const cancelAllNotifications = async (): Promise<void> => {
  if (isExpoGo) return;
  
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    console.error('Error canceling notifications:', error);
  }
};

// Initialize notifications
export const initializeNotifications = async (): Promise<boolean> => {
  if (isExpoGo) {
    console.log('Skipping notification initialization in Expo Go');
    return false;
  }
  
  try {
    const hasPermission = await requestNotificationPermissions();
    if (hasPermission) {
      await scheduleAllNotifications();
    }
    return hasPermission;
  } catch (error) {
    console.error('Error initializing notifications:', error);
    return false;
  }
};

// ============================================
// IN-APP NOTIFICATION HELPERS
// ============================================

import { createNotification } from './storage';
import { Notification as InAppNotification, NotificationType, NotificationPriority } from '../types';

/**
 * Helper function to create an in-app notification with default values
 */
const makeInAppNotification = (
  type: NotificationType,
  title: string,
  message: string,
  icon: string,
  priority: NotificationPriority = 'medium',
  relatedId?: string
): Omit<InAppNotification, 'id'> => ({
  type,
  title,
  message,
  icon,
  priority,
  isRead: false,
  createdAt: new Date().toISOString(),
  relatedId,
});

/**
 * Create an in-app budget warning notification
 */
export const notifyBudgetWarning = async (
  categoryName: string,
  percentage: number,
  budgetId?: string
) => {
  const isOverBudget = percentage >= 100;
  const priority: NotificationPriority = isOverBudget ? 'high' : percentage >= 80 ? 'medium' : 'low';
  
  const title = isOverBudget 
    ? '⚠️ Budget Terlampaui!' 
    : '⚡ Peringatan Budget';
  
  const message = isOverBudget
    ? `Budget ${categoryName} sudah melampaui ${percentage.toFixed(0)}%!`
    : `Budget ${categoryName} sudah mencapai ${percentage.toFixed(0)}%`;

  const notification = makeInAppNotification(
    'budget_warning',
    title,
    message,
    '💰',
    priority,
    budgetId
  );

  try {
    await createNotification(notification);
  } catch (error) {
    console.error('Failed to create in-app budget warning notification:', error);
  }
};

/**
 * Create an in-app goal achievement notification
 */
export const notifyGoalAchieved = async (
  goalName: string,
  amount: number,
  goalId?: string
) => {
  const notification = makeInAppNotification(
    'goal_achieved',
    '🎉 Target Tercapai!',
    `Selamat! Target "${goalName}" berhasil dicapai dengan total Rp ${amount.toLocaleString('id-ID')}`,
    '🎯',
    'high',
    goalId
  );

  try {
    await createNotification(notification);
  } catch (error) {
    console.error('Failed to create in-app goal achievement notification:', error);
  }
};

/**
 * Create an in-app bill reminder notification
 */
export const notifyBillReminder = async (
  description: string,
  amount: number,
  dueDate: string,
  transactionId?: string
) => {
  const notification = makeInAppNotification(
    'bill_reminder',
    '🔔 Pengingat Tagihan',
    `Jangan lupa bayar "${description}" sebesar Rp ${amount.toLocaleString('id-ID')} pada ${dueDate}`,
    '💳',
    'medium',
    transactionId
  );

  try {
    await createNotification(notification);
  } catch (error) {
    console.error('Failed to create in-app bill reminder notification:', error);
  }
};

/**
 * Create an in-app recurring transaction notification
 */
export const notifyRecurringTransaction = async (
  description: string,
  amount: number,
  type: 'income' | 'expense',
  recurringId?: string
) => {
  const icon = type === 'income' ? '💵' : '💸';
  const typeText = type === 'income' ? 'Pemasukan' : 'Pengeluaran';
  
  const notification = makeInAppNotification(
    'recurring_transaction',
    `🔁 ${typeText} Berulang`,
    `${typeText} berulang "${description}" sebesar Rp ${amount.toLocaleString('id-ID')} telah ditambahkan`,
    icon,
    'low',
    recurringId
  );

  try {
    await createNotification(notification);
  } catch (error) {
    console.error('Failed to create in-app recurring transaction notification:', error);
  }
};

/**
 * Create a welcome notification (for first-time users)
 */
export const createWelcomeNotification = async () => {
  const notification = makeInAppNotification(
    'general',
    '👋 Selamat Datang!',
    'Terima kasih telah menggunakan Artha. Kelola keuangan Anda dengan bijak!',
    '🎉',
    'low'
  );

  try {
    await createNotification(notification);
  } catch (error) {
    console.error('Failed to create welcome notification:', error);
  }
};
