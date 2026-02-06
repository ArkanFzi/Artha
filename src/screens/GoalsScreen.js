import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList, 
  RefreshControl,
  Alert 
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS, BORDER_RADIUS, SHADOWS } from '../styles/theme';
import { globalStyles } from '../styles/globalStyles';
import { formatCurrency } from '../utils/currency';
import { getGoals, saveGoal, deleteGoal } from '../utils/storage';
import * as Progress from 'react-native-progress';

const GoalsScreen = ({ navigation }) => {
  const [goals, setGoals] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadGoals = async () => {
    const data = await getGoals();
    setGoals(data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
  };

  useFocusEffect(
    useCallback(() => {
      loadGoals();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadGoals();
    setRefreshing(false);
  };

  const handleDelete = (id) => {
    Alert.alert(
      'Hapus Target',
      'Yakin ingin menghapus target ini?',
      [
        { text: 'Batal', style: 'cancel' },
        { 
          text: 'Hapus', 
          style: 'destructive',
          onPress: async () => {
            await deleteGoal(id);
            loadGoals();
          }
        }
      ]
    );
  };

  const handleAddSavings = (goal) => {
    Alert.prompt(
      'Tambah Tabungan',
      `Masukkan jumlah tabungan untuk ${goal.name}`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Simpan',
          onPress: async (amount) => {
            const addedAmount = parseFloat(amount);
            if (isNaN(addedAmount) || addedAmount <= 0) {
              Alert.alert('Error', 'Jumlah tidak valid');
              return;
            }
            const newAmount = (goal.currentAmount || 0) + addedAmount;
            await saveGoal({ ...goal, currentAmount: newAmount });
            loadGoals();
          }
        }
      ],
      'plain-text',
      '',
      'numeric'
    );
  };

  const renderItem = ({ item }) => {
    const progress = Math.min((item.currentAmount || 0) / item.targetAmount, 1);
    const isCompleted = item.currentAmount >= item.targetAmount;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>{item.icon || '🎯'}</Text>
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.goalName}>{item.name}</Text>
            <Text style={styles.goalDeadline}>
              {item.deadline ? `Target: ${new Date(item.deadline).toLocaleDateString('id-ID')}` : 'Belum ada target waktu'}
            </Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('AddGoal', { goal: item })}>
            <Text style={styles.editButton}>✏️</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.amountContainer}>
          <Text style={styles.currentAmount}>{formatCurrency(item.currentAmount || 0)}</Text>
          <Text style={styles.targetAmount}> / {formatCurrency(item.targetAmount)}</Text>
        </View>

        <View style={styles.progressContainer}>
          <Progress.Bar 
            progress={progress} 
            width={null} 
            height={10} 
            color={isCompleted ? COLORS.success : item.color || COLORS.primary}
            unfilledColor="#EEE"
            borderWidth={0}
            style={{ borderRadius: 5 }}
          />
          <Text style={styles.percentage}>
            {(progress * 100).toFixed(0)}%
          </Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.deleteButton]} 
            onPress={() => handleDelete(item.id)}
          >
            <Text style={styles.deleteText}>Hapus</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.saveButton, isCompleted && styles.completedButton]}
            onPress={() => !isCompleted && handleAddSavings(item)}
            disabled={isCompleted}
          >
            <Text style={styles.saveText}>{isCompleted ? 'Tercapai 🎉' : 'Nabung 💰'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={[globalStyles.container, styles.container]}>
      <FlatList
        data={goals}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🎯</Text>
            <Text style={styles.emptyText}>Belum ada target keuangan</Text>
            <Text style={styles.emptySubtext}>Ayo buat target impianmu sekarang!</Text>
          </View>
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddGoal')}
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.background,
  },
  listContent: {
    padding: SPACING.md,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.small,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  icon: {
    fontSize: 20,
  },
  headerInfo: {
    flex: 1,
  },
  goalName: {
    fontSize: FONT_SIZES.md,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  goalDeadline: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
  editButton: {
    fontSize: 18,
    padding: 4,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: SPACING.sm,
  },
  currentAmount: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  targetAmount: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  progressContainer: {
    marginBottom: SPACING.md,
  },
  percentage: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    textAlign: 'right',
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: SPACING.sm,
  },
  actionButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: BORDER_RADIUS.md,
  },
  deleteButton: {
    backgroundColor: '#FFEBEE',
  },
  deleteText: {
    color: COLORS.danger,
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: COLORS.primary,
  },
  completedButton: {
    backgroundColor: COLORS.success,
  },
  saveText: {
    color: '#FFF',
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 100,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: SPACING.md,
  },
  emptyText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  emptySubtext: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.medium,
  },
  fabIcon: {
    fontSize: 32,
    color: '#FFF',
    fontWeight: 'bold',
    marginTop: -4,
  },
});

export default GoalsScreen;
