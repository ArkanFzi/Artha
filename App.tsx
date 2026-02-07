import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import { PINProvider } from './src/contexts/PINContext';
import SplashScreen from './src/components/SplashScreen';
import { initDb } from './src/utils/storage';

function AppContent() {
  const { isDark } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [isDbReady, setIsDbReady] = useState(false);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Skip SQLite initialization on web (expo-sqlite doesn't support web)
        if (Platform.OS !== 'web') {
          await initDb();
          
          // Create sample notifications for testing
          try {
            const { createWelcomeNotification, notifyBudgetWarning, notifyGoalAchieved } = await import('./src/utils/notificationService');
            
            // Uncomment untuk create sample notifications
            await createWelcomeNotification();
            await notifyBudgetWarning('Makanan & Minuman', 85);
            await notifyGoalAchieved('Liburan Bali', 5000000);
          } catch (error) {
            console.log('Sample notification creation skipped:', error);
          }
        }
        setIsDbReady(true);
      } catch (error) {
        console.error('Failed to initialize database:', error);
        // Still proceed but maybe with errors, or show an alert
        setIsDbReady(true);
      }
    };
    initializeApp();

    // Fallback for web: auto-hide splash after 2 seconds
    if (Platform.OS === 'web') {
      const webTimeout = setTimeout(() => {
        setIsLoading(false);
      }, 2000);
      return () => clearTimeout(webTimeout);
    }
  }, []);

  if (isLoading || !isDbReady) {
    return <SplashScreen onFinish={() => setIsLoading(false)} />;
  }

  return (
    <>
      <AppNavigator />
      <StatusBar style={isDark ? 'light' : 'dark'} />
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <PINProvider>
        <AppContent />
      </PINProvider>
    </ThemeProvider>
  );
}
