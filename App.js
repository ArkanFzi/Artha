import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import AppNavigator from './src/navigation/AppNavigator';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import { PINProvider } from './src/contexts/PINContext';
import SplashScreen from './src/components/SplashScreen';

function AppContent() {
  const { isDark } = useTheme();
  const [isLoading, setIsLoading] = useState(true);

  if (isLoading) {
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
