import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  Alert 
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS, BORDER_RADIUS } from '../styles/theme';
import { globalStyles } from '../styles/globalStyles';
import { saveGoal } from '../utils/storage';

const ICONS = ['🎯', '🏠', '✈️', '💻', '📱', '💊', '🎓', '🛍️', '💍', '🚗'];
const COLORS_LIST = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#96CEB4', '#FFEEAD'];

const AddGoalScreen = ({ navigation, route }) => {
  const editingGoal = route.params?.goal;

  const [name, setName] = useState(editingGoal?.name || '');
  const [amount, setAmount] = useState(editingGoal?.targetAmount?.toString() || '');
  const [selectedIcon, setSelectedIcon] = useState(editingGoal?.icon || ICONS[0]);
  const [selectedColor, setSelectedColor] = useState(editingGoal?.color || COLORS_LIST[0]);
  const [deadline, setDeadline] = useState(editingGoal?.deadline ? new Date(editingGoal.deadline) : new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleSave = async () => {
    if (!name || !amount) {
      Alert.alert('Error', 'Nama dan Target Dana harus diisi');
      return;
    }

    try {
      const goalData = {
        name,
        targetAmount: parseFloat(amount),
        icon: selectedIcon,
        color: selectedColor,
        deadline: deadline.toISOString(),
      };

      if (editingGoal) goalData.id = editingGoal.id;
      if (editingGoal) goalData.currentAmount = editingGoal.currentAmount;

      await saveGoal(goalData);
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Gagal menyimpan target');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Nama Target</Text>
        <TextInput
          style={styles.input}
          placeholder="Contoh: Beli Laptop Baru"
          value={name}
          onChangeText={setName}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Target Dana (Rp)</Text>
        <TextInput
          style={styles.input}
          placeholder="0"
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Target Waktu</Text>
        <TouchableOpacity 
          style={styles.dateButton} 
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={styles.dateText}>{deadline.toLocaleDateString('id-ID')}</Text>
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker
            value={deadline}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              setShowDatePicker(false);
              if (selectedDate) setDeadline(selectedDate);
            }}
          />
        )}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Pilih Ikon</Text>
        <View style={styles.grid}>
          {ICONS.map((icon) => (
            <TouchableOpacity
              key={icon}
              style={[styles.optionItem, selectedIcon === icon && styles.selectedOption]}
              onPress={() => setSelectedIcon(icon)}
            >
              <Text style={styles.optionText}>{icon}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Pilih Warna</Text>
        <View style={styles.grid}>
          {COLORS_LIST.map((color) => (
            <TouchableOpacity
              key={color}
              style={[
                styles.colorOption, 
                { backgroundColor: color },
                selectedColor === color && styles.selectedColorOption
              ]}
              onPress={() => setSelectedColor(color)}
            />
          ))}
        </View>
      </View>

      <TouchableOpacity style={globalStyles.buttonPrimary} onPress={handleSave}>
        <Text style={globalStyles.buttonText}>
          {editingGoal ? 'Simpan Perubahan' : 'Buat Target'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: SPACING.lg,
  },
  inputGroup: {
    marginBottom: SPACING.lg,
  },
  label: {
    fontSize: FONT_SIZES.sm,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  input: {
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    fontSize: FONT_SIZES.md,
    borderWidth: 1,
    borderColor: '#DDD',
  },
  dateButton: {
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: '#DDD',
  },
  dateText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  optionItem: {
    width: 45,
    height: 45,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: '#DDD',
  },
  selectedOption: {
    borderColor: COLORS.primary,
    backgroundColor: '#E3F2FD',
  },
  optionText: {
    fontSize: 24,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedColorOption: {
    borderColor: '#333',
    transform: [{ scale: 1.1 }],
  },
});

export default AddGoalScreen;
