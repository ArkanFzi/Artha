import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TextInput, 
  TouchableOpacity,
  Alert,
  Platform
} from 'react-native';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS, BORDER_RADIUS, SHADOWS } from '../styles/theme';
import { globalStyles } from '../styles/globalStyles';
import CategoryPicker from '../components/CategoryPicker';
import { saveTransaction, getCategories } from '../utils/storage';
import { formatCurrency } from '../utils/calculations';

const AddTransactionScreen = ({ navigation }) => {
  const [type, setType] = useState('expense'); // 'income' or 'expense'
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [categories, setCategories] = useState([]);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [notes, setNotes] = useState('');

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
      const transaction = {
        type,
        amount: parseFloat(amount),
        description: description.trim(),
        categoryId: type === 'expense' ? selectedCategory?.id : null,
        date,
        notes: notes.trim(),
      };

      await saveTransaction(transaction);
      
      Alert.alert(
        'Berhasil',
        'Transaksi berhasil disimpan',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      Alert.alert('Error', 'Gagal menyimpan transaksi');
      console.error(error);
    }
  };

  return (
    <View style={globalStyles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Type Toggle */}
        <View style={styles.typeToggle}>
          <TouchableOpacity
            style={[
              styles.typeButton,
              type === 'income' && styles.typeButtonActive,
              { backgroundColor: type === 'income' ? COLORS.income : COLORS.border }
            ]}
            onPress={() => setType('income')}
          >
            <Text style={[
              styles.typeButtonText,
              type === 'income' && styles.typeButtonTextActive
            ]}>
              💰 Pemasukan
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.typeButton,
              type === 'expense' && styles.typeButtonActive,
              { backgroundColor: type === 'expense' ? COLORS.expense : COLORS.border }
            ]}
            onPress={() => setType('expense')}
          >
            <Text style={[
              styles.typeButtonText,
              type === 'expense' && styles.typeButtonTextActive
            ]}>
              💸 Pengeluaran
            </Text>
          </TouchableOpacity>
        </View>

        {/* Amount Input */}
        <View style={styles.inputGroup}>
          <Text style={globalStyles.label}>Jumlah</Text>
          <View style={styles.amountInputContainer}>
            <Text style={styles.currencyPrefix}>Rp</Text>
            <TextInput
              style={styles.amountInput}
              placeholder="0"
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
              placeholderTextColor={COLORS.textSecondary}
            />
          </View>
          {amount && parseFloat(amount) > 0 && (
            <Text style={styles.amountPreview}>
              {formatCurrency(parseFloat(amount))}
            </Text>
          )}
        </View>

        {/* Description Input */}
        <View style={styles.inputGroup}>
          <Text style={globalStyles.label}>Deskripsi</Text>
          <TextInput
            style={globalStyles.input}
            placeholder="Contoh: Makan siang di restoran"
            value={description}
            onChangeText={setDescription}
            placeholderTextColor={COLORS.textSecondary}
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

        {/* Date Input */}
        <View style={styles.inputGroup}>
          <Text style={globalStyles.label}>Tanggal</Text>
          <TextInput
            style={globalStyles.input}
            value={date}
            onChangeText={setDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={COLORS.textSecondary}
          />
        </View>

        {/* Notes Input */}
        <View style={styles.inputGroup}>
          <Text style={globalStyles.label}>Catatan (Opsional)</Text>
          <TextInput
            style={[globalStyles.input, styles.notesInput]}
            placeholder="Tambahkan catatan..."
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            placeholderTextColor={COLORS.textSecondary}
          />
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[globalStyles.buttonPrimary, styles.saveButton]}
          onPress={handleSave}
        >
          <Text style={globalStyles.buttonText}>💾 Simpan Transaksi</Text>
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
    ...SHADOWS.small,
  },
  typeButtonActive: {
    ...SHADOWS.medium,
  },
  typeButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.textSecondary,
  },
  typeButtonTextActive: {
    color: COLORS.textLight,
  },
  inputGroup: {
    marginBottom: SPACING.lg,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
  },
  currencyPrefix: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    marginRight: SPACING.sm,
  },
  amountInput: {
    flex: 1,
    fontSize: FONT_SIZES.xxl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    paddingVertical: SPACING.md,
  },
  amountPreview: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
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
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    fontWeight: FONT_WEIGHTS.medium,
  },
  categoryButtonPlaceholder: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  chevron: {
    fontSize: 24,
    color: COLORS.textSecondary,
  },
  notesInput: {
    minHeight: 80,
  },
  saveButton: {
    marginTop: SPACING.md,
    marginBottom: SPACING.xl,
  },
});

export default AddTransactionScreen;
