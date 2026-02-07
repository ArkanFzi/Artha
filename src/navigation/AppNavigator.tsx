import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { COLORS, FONT_SIZES, FONT_WEIGHTS } from '../styles/theme';
import { usePIN } from '../contexts/PINContext';
import { isPINSet, getPINEnabled } from '../utils/pinStorage';

// Import screens
import HomeScreen from '../screens/HomeScreen';
import AddTransactionScreen from '../screens/AddTransactionScreen';
import BudgetScreen from '../screens/BudgetScreen';
import ReportScreen from '../screens/ReportScreen';
import CategoryScreen from '../screens/CategoryScreen';
import SettingsScreen from '../screens/SettingsScreen';
import RecurringScreen from '../screens/RecurringScreen';
import AddRecurringScreen from '../screens/AddRecurringScreen';
import PINSetupScreen from '../screens/PINSetupScreen';
import PINVerifyScreen from '../screens/PINVerifyScreen';
import SyncAccountScreen from '../screens/SyncAccountScreen';
import GoalsScreen from '../screens/GoalsScreen';
import AddGoalScreen from '../screens/AddGoalScreen';
import TransactionsScreen from '../screens/TransactionsScreen';
import NotificationsScreen from '../screens/NotificationsScreen';

import { Transaction, Goal, RecurringTransaction } from '../types';

export type RootStackParamList = {
  PINSetup: undefined;
  PINVerify: undefined;
  Main: undefined;
  Home: undefined;
  AddTransaction: { transaction?: Transaction } | undefined;
  Budget: undefined;
  Report: undefined;
  Category: undefined;
  Settings: undefined;
  Recurring: undefined;
  AddRecurring: { recurring?: RecurringTransaction } | undefined;
  SyncAccount: undefined;
  Goals: undefined;
  AddGoal: { goal?: Goal } | undefined;
  Transactions: undefined;
  Notifications: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator = () => {
  const { isPINEnabled, isLoading } = usePIN();
  const [initialRoute, setInitialRoute] = useState<keyof RootStackParamList | null>(null);

  useEffect(() => {
    determineInitialRoute();
  }, []);

  const determineInitialRoute = async () => {
    try {
      const pinSet = await isPINSet();
      const pinEnabled = await getPINEnabled();

      if (pinSet && pinEnabled) {
        setInitialRoute('PINVerify');
      } else if (!pinSet) {
        setInitialRoute('PINSetup');
      } else {
        setInitialRoute('Main');
      }
    } catch (error) {
      console.error('Error determining initial route:', error);
      setInitialRoute('Main');
    }
  };

  if (isLoading || !initialRoute) {
    return null;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{
          headerStyle: {
            backgroundColor: COLORS.primary as string,
          },
          headerTintColor: COLORS.textLight as string,
          headerTitleStyle: {
            fontWeight: FONT_WEIGHTS.bold as any,
            fontSize: FONT_SIZES.lg,
          },
          headerShadowVisible: true,
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen 
          name="PINSetup" 
          component={PINSetupScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="PINVerify" 
          component={PINVerifyScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Main"
          component={HomeScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Home" 
          component={HomeScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="AddTransaction" 
          component={AddTransactionScreen}
          options={{ title: 'Tambah Transaksi', presentation: 'modal' }}
        />
        <Stack.Screen 
          name="Budget" 
          component={BudgetScreen}
          options={{ title: 'Kelola Budget' }}
        />
        <Stack.Screen 
          name="Report" 
          component={ReportScreen}
          options={{ title: 'Laporan Keuangan' }}
        />
        <Stack.Screen 
          name="Category" 
          component={CategoryScreen}
          options={{ title: 'Kelola Kategori' }}
        />
        <Stack.Screen 
          name="Settings" 
          component={SettingsScreen}
          options={{ title: 'Pengaturan' }}
        />
        <Stack.Screen 
          name="Recurring" 
          component={RecurringScreen}
          options={{ title: 'Transaksi Berulang' }}
        />
        <Stack.Screen 
          name="AddRecurring" 
          component={AddRecurringScreen}
          options={{ title: 'Tambah Transaksi Berulang', presentation: 'modal' }}
        />
        <Stack.Screen 
          name="SyncAccount" 
          component={SyncAccountScreen}
          options={{ title: 'Cloud Backup & Sync' }}
        />
        <Stack.Screen 
          name="Goals" 
          component={GoalsScreen}
          options={{ title: 'Target Keuangan' }}
        />
        <Stack.Screen 
          name="AddGoal" 
          component={AddGoalScreen}
          options={{ title: 'Tambah Target', presentation: 'modal' }}
        />
        <Stack.Screen 
          name="Transactions" 
          component={TransactionsScreen}
          options={{ title: 'Semua Transaksi' }}
        />
        <Stack.Screen 
          name="Notifications" 
          component={NotificationsScreen}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
