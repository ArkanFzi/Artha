import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
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
        await initDb();
        setIsDbReady(true);
      } catch (error) {
        console.error('Failed to initialize database:', error);
        // Still proceed but maybe with errors, or show an alert
        setIsDbReady(true);
      }
    };
    initializeApp();
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
