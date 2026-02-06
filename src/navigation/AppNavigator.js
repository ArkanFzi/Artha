import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { COLORS, FONT_SIZES, FONT_WEIGHTS } from '../styles/theme';

// Import screens
import HomeScreen from '../screens/HomeScreen';
import AddTransactionScreen from '../screens/AddTransactionScreen';
import BudgetScreen from '../screens/BudgetScreen';
import ReportScreen from '../screens/ReportScreen';
import CategoryScreen from '../screens/CategoryScreen';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerStyle: {
            backgroundColor: COLORS.primary,
          },
          headerTintColor: COLORS.textLight,
          headerTitleStyle: {
            fontWeight: FONT_WEIGHTS.bold,
            fontSize: FONT_SIZES.lg,
          },
          headerShadowVisible: true,
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen 
          name="Home" 
          component={HomeScreen}
          options={{ 
            title: 'Keuangan Saya',
            headerShown: true,
          }}
        />
        <Stack.Screen 
          name="AddTransaction" 
          component={AddTransactionScreen}
          options={{ 
            title: 'Tambah Transaksi',
            presentation: 'modal',
          }}
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
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
