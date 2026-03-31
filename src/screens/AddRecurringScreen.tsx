import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS, BORDER_RADIUS } from '../styles/theme';
import { globalStyles } from '../styles/globalStyles';
import { useTheme } from '../contexts/ThemeContext';
import CategoryPicker from '../components/CategoryPicker';
import { saveRecurringTransaction } from '../utils/recurringService';
import { getCategories } from '../utils/storage';
import { formatCurrency } from '../utils/calculations';
import { Category, RecurringFrequency, TransactionType } from '../types';
import { NavigationProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';

interface AddRecurringScreenProps {
  navigation: NavigationProp<RootStackParamList, 'AddRecurring'>;
}

const AddRecurringScreen: React.FC<AddRecurringScreenProps> = ({ navigation }) => {
  const { theme, isDark } = useTheme();
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [frequency, setFrequency] = useState<RecurringFrequency>('monthly');
  const [startDateObj, setStartDateObj] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [notes, setNotes] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  const formatDateDisplay = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${day}/${month}/${year}`;
  };

  const dateISOString = () => {
    const year = startDateObj.getFullYear();
    const month = String(startDateObj.getMonth() + 1).padStart(2, '0');
    const day = String(startDateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    const categoriesData = await getCategories();
    setCategories(categoriesData);
    if (categoriesData.length > 0 && !selectedCategory) {
      setSelectedCategory(categoriesData[0]);
    }
  };

  const handleSave = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Masukkan jumlah yang valid');
      return;
    }

    if (!description.trim()) {
      Alert.alert('Error', 'Masukkan deskripsi transaksi');
      return;
    }

    if (type === 'expense' && !selectedCategory) {
      Alert.alert('Error', 'Pilih kategori pengeluaran');
      return;
    }

    try {
      const recurring = {
        type,
        amount: parseFloat(amount),
        description: description.trim(),
        categoryId: type === 'expense' ? selectedCategory?.id || null : null,
        frequency,
        startDate: dateISOString(),
        endDate: null,
        notes: notes.trim(),
      };

      await saveRecurringTransaction(recurring);
      
      Alert.alert(
        'Berhasil',
        'Transaksi berulang berhasil dibuat',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      Alert.alert('Error', 'Gagal menyimpan transaksi berulang');
      console.error(error);
    }
  };

  const frequencies: { value: RecurringFrequency; label: string; description: string }[] = [
    { value: 'daily', label: '📅 Harian', description: 'Setiap hari' },
    { value: 'weekly', label: '📆 Mingguan', description: 'Setiap minggu' },
    { value: 'monthly', label: '🗓️ Bulanan', description: 'Setiap bulan' },
  ];

  return (
    <View style={[globalStyles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Type Toggle */}
        <View style={styles.typeToggle}>
          <TouchableOpacity
            style={[
              styles.typeButton,
              { backgroundColor: type === 'income' ? (COLORS.success as string) : theme.surfaceLight }
            ]}
            onPress={() => setType('income')}
          >
            <Text style={[styles.typeButtonText, { color: type === 'income' ? '#FFF' : theme.textSecondary }]}>
              💰 Pemasukan
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.typeButton,
              { backgroundColor: type === 'expense' ? (COLORS.danger as string) : theme.surfaceLight }
            ]}
            onPress={() => setType('expense')}
          >
            <Text style={[styles.typeButtonText, { color: type === 'expense' ? '#FFF' : theme.textSecondary }]}>
              💸 Pengeluaran
            </Text>
          </TouchableOpacity>
        </View>

        {/* Amount Input */}
        <View style={styles.inputGroup}>
          <Text style={[globalStyles.label, { color: theme.text }]}>Jumlah</Text>
          <View style={[styles.amountInputContainer, { backgroundColor: theme.surface, borderColor: theme.primary }]}>
            <Text style={[styles.currencyPrefix, { color: theme.text }]}>Rp</Text>
            <TextInput
              style={[styles.amountInput, { color: theme.text }]}
              placeholder="0"
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
              placeholderTextColor={theme.textMuted as string}
            />
          </View>
          {amount && parseFloat(amount) > 0 && (
            <Text style={[styles.amountPreview, { color: theme.textSecondary }]}>
              {formatCurrency(parseFloat(amount))}
            </Text>
          )}
        </View>

        {/* Description Input */}
        <View style={styles.inputGroup}>
          <Text style={[globalStyles.label, { color: theme.text }]}>Deskripsi</Text>
          <TextInput
            style={[globalStyles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.surface }]}
            placeholder="Contoh: Gaji Bulanan, Tagihan Listrik"
            value={description}
            onChangeText={setDescription}
            placeholderTextColor={theme.textMuted as string}
          />
        </View>

        {/* Category Picker (only for expenses) */}
        {type === 'expense' && (
          <View style={styles.inputGroup}>
            <Text style={globalStyles.label}>Kategori</Text>
            <TouchableOpacity
              style={styles.categoryButton}
              onPress={() => setShowCategoryPicker(true)}
            >
              {selectedCategory ? (
                <>
                  <View style={[styles.categoryIcon, { backgroundColor: selectedCategory.color }]}>
                    <Text style={styles.categoryIconText}>{selectedCategory.icon}</Text>
                  </View>
                  <Text style={styles.categoryButtonText}>{selectedCategory.name}</Text>
                </>
              ) : (
                <Text style={styles.categoryButtonPlaceholder}>Pilih Kategori</Text>
              )}
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Frequency Selection */}
        <View style={styles.inputGroup}>
          <Text style={globalStyles.label}>Frekuensi</Text>
          {frequencies.map(freq => (
            <TouchableOpacity
              key={freq.value}
              style={[
                styles.frequencyButton,
                frequency === freq.value && styles.frequencyButtonActive
              ]}
              onPress={() => setFrequency(freq.value)}
            >
              <View style={styles.frequencyInfo}>
                <Text style={[
                  styles.frequencyLabel,
                  frequency === freq.value && styles.frequencyLabelActive
                ]}>
                  {freq.label}
                </Text>
                <Text style={styles.frequencyDescription}>{freq.description}</Text>
              </View>
              <View style={[
                styles.radio,
                frequency === freq.value && styles.radioActive
              ]}>
                {frequency === freq.value && <View style={styles.radioDot} />}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Start Date */}
        <View style={styles.inputGroup}>
          <Text style={[globalStyles.label, { color: theme.text }]}>Mulai Tanggal</Text>
          <TouchableOpacity
            style={[globalStyles.input, { backgroundColor: theme.surface, borderColor: theme.border, justifyContent: 'center' }]}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={{ color: theme.text, fontSize: 16 }}>{formatDateDisplay(startDateObj)}</Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={startDateObj}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(_event, selectedDate) => {
                setShowDatePicker(Platform.OS === 'ios');
                if (selectedDate) setStartDateObj(selectedDate);
              }}
            />
          )}
        </View>

        {/* Notes Input */}
        <View style={styles.inputGroup}>
          <Text style={[globalStyles.label, { color: theme.text }]}>Catatan (Opsional)</Text>
          <TextInput
            style={[globalStyles.input, styles.notesInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.surface }]}
            placeholder="Tambahkan catatan..."
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            placeholderTextColor={theme.textMuted as string}
          />
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Text style={styles.infoText}>
            💡 Transaksi berulang akan otomatis dibuat sesuai frekuensi yang dipilih
          </Text>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[globalStyles.buttonPrimary, styles.saveButton]}
          onPress={handleSave}
        >
          <Text style={globalStyles.buttonText}>💾 Simpan Transaksi Berulang</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Category Picker Modal */}
      <CategoryPicker
        visible={showCategoryPicker}
        categories={categories}
        selectedCategoryId={selectedCategory?.id}
        onSelect={setSelectedCategory}
        onClose={() => setShowCategoryPicker(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    padding: SPACING.lg,
  },
  typeToggle: {
    flexDirection: 'row',
    marginBottom: SPACING.xl,
    gap: SPACING.sm,
  },
  typeButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  typeButtonActive: {
    // shadow logic handled by shadow style in theme if needed
  },
  typeButtonText: {
    fontSize: FONT_SIZES.md as any,
    fontWeight: FONT_WEIGHTS.semibold as any,
    color: COLORS.textSecondary as string,
  },
  typeButtonTextActive: {
    color: COLORS.textLight as string,
  },
  inputGroup: {
    marginBottom: SPACING.lg,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface as string,
    borderWidth: 2,
    borderColor: COLORS.primary as string,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
  },
  currencyPrefix: {
    fontSize: FONT_SIZES.xl as any,
    fontWeight: FONT_WEIGHTS.bold as any,
    color: COLORS.text as string,
    marginRight: SPACING.sm,
  },
  amountInput: {
    flex: 1,
    fontSize: FONT_SIZES.xxl as any,
    fontWeight: FONT_WEIGHTS.bold as any,
    color: COLORS.text as string,
    paddingVertical: SPACING.md,
  },
  amountPreview: {
    fontSize: FONT_SIZES.sm as any,
    color: COLORS.textSecondary as string,
    marginTop: SPACING.xs,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface as string,
    borderWidth: 1,
    borderColor: COLORS.border as string,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  categoryIconText: {
    fontSize: 20,
  },
  categoryButtonText: {
    flex: 1,
    fontSize: FONT_SIZES.md as any,
    color: COLORS.text as string,
    fontWeight: FONT_WEIGHTS.medium as any,
  },
  categoryButtonPlaceholder: {
    flex: 1,
    fontSize: FONT_SIZES.md as any,
    color: COLORS.textSecondary as string,
  },
  chevron: {
    fontSize: 24,
    color: COLORS.textSecondary as string,
  },
  frequencyButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.surface as string,
    borderWidth: 2,
    borderColor: COLORS.border as string,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  frequencyButtonActive: {
    borderColor: COLORS.primary as string,
    backgroundColor: '#E0F7FA', // Soft primary light
  },
  frequencyInfo: {
    flex: 1,
  },
  frequencyLabel: {
    fontSize: FONT_SIZES.md as any,
    fontWeight: FONT_WEIGHTS.semibold as any,
    color: COLORS.text as string,
    marginBottom: 2,
  },
  frequencyLabelActive: {
    color: COLORS.primary as string,
  },
  frequencyDescription: {
    fontSize: FONT_SIZES.sm as any,
    color: COLORS.textSecondary as string,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.border as string,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioActive: {
    borderColor: COLORS.primary as string,
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.primary as string,
  },
  notesInput: {
    minHeight: 80,
  },
  infoCard: {
    backgroundColor: '#E3F2FD',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  infoText: {
    fontSize: FONT_SIZES.sm as any,
    color: '#1565C0',
  },
  saveButton: {
    marginTop: SPACING.md,
    marginBottom: SPACING.xl,
  },
});

export default AddRecurringScreen;
