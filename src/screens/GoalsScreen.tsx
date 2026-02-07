import React, { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Alert, 
  RefreshControl,
  Modal,
  TextInput
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS, BORDER_RADIUS } from '../styles/theme';
import { globalStyles } from '../styles/globalStyles';
import StatCard from '../components/StatCard';
import { getGoals, deleteGoal, saveGoal } from '../utils/storage';
import { formatCurrency } from '../utils/calculations';
import * as Progress from 'react-native-progress';
import { Goal } from '../types';
import { NavigationProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';

interface GoalsScreenProps {
  navigation: NavigationProp<RootStackParamList, 'Goals'>;
}

const GoalsScreen: React.FC<GoalsScreenProps> = ({ navigation }) => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [addAmount, setAddAmount] = useState('');

  const loadGoals = async () => {
    const data = await getGoals();
    setGoals(data);
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

  const handleDeleteGoal = (id: string, name: string) => {
    Alert.alert(
      'Hapus Target',
      `Apakah Anda yakin ingin menghapus "${name}"?`,
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

  const handleAddSavings = async () => {
    if (!selectedGoal || !addAmount) return;

    const amountToAdd = parseFloat(addAmount);
    if (isNaN(amountToAdd) || amountToAdd <= 0) {
      Alert.alert('Error', 'Masukkan jumlah yang valid');
      return;
    }

    const updatedGoal: Goal = {
      ...selectedGoal,
      currentAmount: selectedGoal.currentAmount + amountToAdd
    };

    await saveGoal(updatedGoal);
    loadGoals();
    setIsModalVisible(false);
    setAddAmount('');
    setSelectedGoal(null);
  };

  const totalTarget = goals.reduce((sum, g) => sum + g.targetAmount, 0);
  const totalSaved = goals.reduce((sum, g) => sum + g.currentAmount, 0);

  const renderGoalItem = ({ item }: { item: Goal }) => {
    const progress = item.targetAmount > 0 ? item.currentAmount / item.targetAmount : 0;
    
    return (
      <View style={styles.goalCard}>
        <View style={styles.goalHeader}>
          <View style={[styles.iconContainer, { backgroundColor: item.color + '20' }]}>
            <Text style={styles.goalIcon}>{item.icon}</Text>
          </View>
          <View style={styles.goalInfo}>
            <Text style={styles.goalName}>{item.name}</Text>
            <Text style={styles.goalDeadline}>
              {item.deadline ? `Deadline: ${new Date(item.deadline).toLocaleDateString('id-ID')}` : 'Tanpa Deadline'}
            </Text>
          </View>
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              onPress={() => navigation.navigate('AddGoal', { goal: item })}
              style={styles.editBtn}
            >
              <Text>✏️</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => handleDeleteGoal(item.id, item.name)}
              style={styles.deleteBtn}
            >
              <Text>🗑️</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.progressContainer}>
          <View style={styles.progressLabels}>
            <Text style={styles.currentAmount}>{formatCurrency(item.currentAmount)}</Text>
            <Text style={styles.targetAmount}>dari {formatCurrency(item.targetAmount)}</Text>
          </View>
          <Progress.Bar 
            progress={progress > 1 ? 1 : progress} 
            width={null} 
            color={item.color}
            unfilledColor="#E0E0E0"
            borderWidth={0}
            height={8}
            borderRadius={4}
          />
          <Text style={styles.percentageText}>{Math.round(progress * 100)}% tercapai</Text>
        </View>

        <TouchableOpacity 
          style={[styles.addBtn, { backgroundColor: item.color }]}
          onPress={() => {
            setSelectedGoal(item);
            setIsModalVisible(true);
          }}
        >
          <Text style={styles.addBtnText}>+ Tambah Tabungan</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={globalStyles.container}>
      <View style={styles.header}>
        <StatCard 
          title="Total Target" 
          value={formatCurrency(totalTarget)} 
          icon="🎯"
          color="#2196F3"
        />
        <StatCard 
          title="Total Terkumpul" 
          value={formatCurrency(totalSaved)} 
          icon="💰"
          color="#4CAF50"
        />
      </View>

      <FlatList
        data={goals}
        renderItem={renderGoalItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Belum ada target keuangan.</Text>
            <Text style={styles.emptySubtext}>Klik tombol + untuk mulai menabung!</Text>
          </View>
        }
      />

      <TouchableOpacity 
        style={styles.fab}
        onPress={() => navigation.navigate('AddGoal')}
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>

      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Tambah Tabungan</Text>
            <Text style={styles.modalSubTitle}>{selectedGoal?.name}</Text>
            
            <TextInput
              style={styles.modalInput}
              placeholder="Jumlah Tabungan (Rp)"
              keyboardType="numeric"
              value={addAmount}
              onChangeText={setAddAmount}
              autoFocus
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalBtn, styles.cancelBtn]} 
                onPress={() => {
                  setIsModalVisible(false);
                  setAddAmount('');
                }}
              >
                <Text style={styles.cancelBtnText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalBtn, styles.confirmBtn]} 
                onPress={handleAddSavings}
              >
                <Text style={styles.confirmBtnText}>Tambah</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    padding: SPACING.md,
    gap: SPACING.md,
  },
  listContent: {
    padding: SPACING.md,
    paddingBottom: 100,
  },
  goalCard: {
    backgroundColor: COLORS.surface as string,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  goalIcon: {
    fontSize: 24,
  },
  goalInfo: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  goalName: {
    fontSize: FONT_SIZES.md as any,
    fontWeight: FONT_WEIGHTS.bold as any,
    color: COLORS.text as string,
  },
  goalDeadline: {
    fontSize: FONT_SIZES.xs as any,
    color: COLORS.textSecondary as string,
    marginTop: 2,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  editBtn: {
    padding: 8,
  },
  deleteBtn: {
    padding: 8,
  },
  progressContainer: {
    marginBottom: SPACING.md,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: SPACING.xs,
  },
  currentAmount: {
    fontSize: FONT_SIZES.md as any,
    fontWeight: FONT_WEIGHTS.bold as any,
    color: COLORS.text as string,
  },
  targetAmount: {
    fontSize: FONT_SIZES.xs as any,
    color: COLORS.textSecondary as string,
  },
  percentageText: {
    fontSize: FONT_SIZES.xs as any,
    color: COLORS.textSecondary as string,
    textAlign: 'right',
    marginTop: 4,
  },
  addBtn: {
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    alignItems: 'center',
  },
  addBtnText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: FONT_SIZES.sm as any,
  },
  fab: {
    position: 'absolute',
    right: 25,
    bottom: 25,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary as string,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  fabIcon: {
    fontSize: 30,
    color: '#FFF',
    fontWeight: 'bold',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: {
    fontSize: FONT_SIZES.md as any,
    fontWeight: 'bold',
    color: COLORS.textSecondary as string,
  },
  emptySubtext: {
    fontSize: FONT_SIZES.sm as any,
    color: COLORS.textSecondary as string,
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    width: '100%',
  },
  modalTitle: {
    fontSize: FONT_SIZES.lg as any,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  modalSubTitle: {
    fontSize: FONT_SIZES.md as any,
    color: COLORS.textSecondary as string,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    fontSize: FONT_SIZES.lg as any,
    marginBottom: SPACING.xl,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  modalBtn: {
    flex: 1,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  cancelBtn: {
    backgroundColor: '#F5F5F5',
  },
  confirmBtn: {
    backgroundColor: COLORS.primary as string,
  },
  cancelBtnText: {
    color: '#666',
    fontWeight: 'bold',
  },
  confirmBtnText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
});

export default GoalsScreen;
