import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

const NOTIFICATION_SETTINGS_KEY = '@notification_settings';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Request permissions
export const requestNotificationPermissions = async () => {
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
export const getNotificationSettings = async () => {
  try {
    const settings = await AsyncStorage.getItem(NOTIFICATION_SETTINGS_KEY);
    return settings ? JSON.parse(settings) : {
      dailyReminder: !isExpoGo, // Disabled in Expo Go
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
export const saveNotificationSettings = async (settings) => {
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
export const scheduleDailyReminder = async () => {
  if (isExpoGo) return; // Skip in Expo Go
  
  try {
    const NotificationsModule = await getNotifications();
    if (!NotificationsModule) return;
    
    const settings = await getNotificationSettings();
    if (!settings.dailyReminder) return;

    // Cancel existing daily reminders
    try {
      const scheduled = await NotificationsModule.getAllScheduledNotificationsAsync();
      for (const notif of scheduled) {
        if (notif.content.data?.type === 'daily_reminder') {
          await NotificationsModule.cancelScheduledNotificationAsync(notif.identifier);
        }
      }
    } catch (cancelError) {
      console.warn('Error canceling existing reminders:', cancelError);
    }

    // Parse time
    const [hours, minutes] = settings.reminderTime.split(':').map(Number);

    // Schedule new daily reminder
    await NotificationsModule.scheduleNotificationAsync({
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
export const scheduleBudgetAlert = async (categoryName, percentage) => {
  if (isExpoGo) return; // Skip in Expo Go
  
  try {
    const NotificationsModule = await getNotifications();
    if (!NotificationsModule) return;
    
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

    await NotificationsModule.scheduleNotificationAsync({
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
export const scheduleMonthlyReview = async () => {
  if (isExpoGo) return; // Skip in Expo Go
  
  try {
    const NotificationsModule = await getNotifications();
    if (!NotificationsModule) return;
    
    const settings = await getNotificationSettings();
    if (!settings.monthlyReview) return;

    // Cancel existing monthly reminders
    try {
      const scheduled = await NotificationsModule.getAllScheduledNotificationsAsync();
      for (const notif of scheduled) {
        if (notif.content.data?.type === 'monthly_review') {
          await NotificationsModule.cancelScheduledNotificationAsync(notif.identifier);
        }
      }
    } catch (cancelError) {
      console.warn('Error canceling existing monthly reminders:', cancelError);
    }

    // Schedule for the 1st of every month at 10 AM
    await NotificationsModule.scheduleNotificationAsync({
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
      },
    });
  } catch (error) {
    console.error('Error scheduling monthly review:', error);
  }
};

// Schedule all notifications
export const scheduleAllNotifications = async () => {
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
export const cancelAllNotifications = async () => {
  if (isExpoGo) return;
  
  try {
    const NotificationsModule = await getNotifications();
    if (!NotificationsModule) return;
    
    await NotificationsModule.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    console.error('Error canceling notifications:', error);
  }
};

// Initialize notifications
export const initializeNotifications = async () => {
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

