import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS } from '../styles/theme';
import { useTheme } from '../contexts/ThemeContext';
import { formatCurrency } from '../utils/currency';

const screenWidth = Dimensions.get('window').width;

const TrendChart = ({ data, labels }) => {
  const { theme, isDark } = useTheme();

  if (!data || data.length === 0 || data.every(v => v === 0)) {
    return (
      <View style={[styles.container, { backgroundColor: theme.surface }]}>
        <Text style={[styles.title, { color: theme.text }]}>Tren Pengeluaran (6 Bulan)</Text>
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
            Belum ada data yang cukup
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.surface }]}>
      <Text style={[styles.title, { color: theme.text }]}>Tren Pengeluaran (6 Bulan)</Text>
      
      <LineChart
        data={{
          labels: labels,
          datasets: [{ data: data }]
        }}
        width={screenWidth - (SPACING.lg * 2) - (SPACING.md * 2)} // Adjust for padding
        height={220}
        yAxisLabel=""
        yAxisSuffix=""
        yAxisInterval={1}
        chartConfig={{
          backgroundColor: theme.surface,
          backgroundGradientFrom: theme.surface,
          backgroundGradientTo: theme.surface,
          decimalPlaces: 0,
          color: (opacity = 1) => COLORS.primary, // Chart line color
          labelColor: (opacity = 1) => isDark ? '#b0b0b0' : '#666',
          style: {
            borderRadius: 16
          },
          propsForDots: {
            r: "4",
            strokeWidth: "2",
            stroke: COLORS.primary
          },
          propsForBackgroundLines: {
            strokeWidth: 1,
            stroke: isDark ? '#333' : '#eee',
          }
        }}
        bezier
        style={{
          marginVertical: 8,
          borderRadius: 16,
          paddingRight: 40, // Space for Y axis labels usually on right or prevent clip
        }}
        formatYLabel={(y) => {
          // Compact format: 1.5jt, 500rb
          const val = parseFloat(y);
          if (val >= 1000000) return (val / 1000000).toFixed(1) + 'jt';
          if (val >= 1000) return (val / 1000).toFixed(0) + 'rb';
          return val;
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    alignItems: 'center',
    ...SHADOWS.small,
  },
  title: {
    fontSize: FONT_SIZES.md,
    fontWeight: 'bold',
    marginBottom: SPACING.md,
    width: '100%',
    textAlign: 'left',
  },
  emptyContainer: {
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: FONT_SIZES.sm,
  }
});

export default TrendChart;
