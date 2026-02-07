import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import { SPACING, FONT_SIZES, BORDER_RADIUS } from '../styles/theme';
import { useTheme } from '../contexts/ThemeContext';

const screenWidth = Dimensions.get('window').width;

interface PieChartData {
  name: string;
  population: number;
  color: string;
  legendFontColor: string;
  legendFontSize: number;
  id?: string;
}

interface CategoryPieChartProps {
  data: PieChartData[];
}

const CategoryPieChart: React.FC<CategoryPieChartProps> = ({ data }) => {
  const { theme } = useTheme();

  const processedData = data.filter(item => item.population > 0);

  if (!processedData || processedData.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: theme.surface }]}>
        <Text style={[styles.title, { color: theme.text }]}>Distribusi Pengeluaran</Text>
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
            Belum ada data pengeluaran bulan ini
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.surface }]}>
      <Text style={[styles.title, { color: theme.text }]}>Distribusi Pengeluaran</Text>
      
      <PieChart
        data={processedData}
        width={screenWidth - (SPACING.lg * 2)}
        height={220}
        chartConfig={{
          backgroundColor: theme.surface,
          backgroundGradientFrom: theme.surface,
          backgroundGradientTo: theme.surface,
          color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
          labelColor: () => theme.text,
        }}
        accessor={"population"}
        backgroundColor={"transparent"}
        paddingLeft={"15"}
        absolute={false}
        hasLegend={true}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: FONT_SIZES.md as any,
    fontWeight: 'bold',
    marginBottom: SPACING.xs,
  },
  emptyContainer: {
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: FONT_SIZES.sm as any,
  }
});

export default CategoryPieChart;
