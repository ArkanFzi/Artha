import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TextInput, 
  TouchableOpacity,
  Alert,
  ViewStyle,
  TextStyle
} from 'react-native';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS, BORDER_RADIUS } from '../styles/theme';
import { globalStyles } from '../styles/globalStyles';
import CategoryPicker from '../components/CategoryPicker';
import ImagePickerComponent from '../components/ImagePickerComponent';
import { saveTransaction, getCategories } from '../utils/storage';
import { CURRENCIES, formatCurrency, Currency } from '../utils/currency';
import { NavigationProp, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Category, TransactionType } from '../types';

interface AddTransactionScreenProps {
  navigation: NavigationProp<RootStackParamList, 'AddTransaction'>;
  route: RouteProp<RootStackParamList, 'AddTransaction'>;
}

const AddTransactionScreen: React.FC<AddTransactionScreenProps> = ({ navigation, route }) => {
  const editTransaction = route.params?.transaction;

  const [type, setType] = useState<TransactionType>(editTransaction?.type || 'expense');
  const [amount, setAmount] = useState(editTransaction?.amount?.toString() || '');
  const [description, setDescription] = useState(editTransaction?.description || '');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [date, setDate] = useState(editTransaction?.date || new Date().toISOString().slice(0, 10));
  const [categories, setCategories] = useState<Category[]>([]);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [notes, setNotes] = useState(editTransaction?.note || '');
  const [photoUri, setPhotoUri] = useState<string | null>(editTransaction?.photoUri || null);
  
  const initialCurrency = CURRENCIES.find(c => c.code === editTransaction?.currency) || CURRENCIES[0];
  const [currency, setCurrency] = useState<Currency>(initialCurrency);
  const [exchangeRate, setExchangeRate] = useState(editTransaction?.exchangeRate?.toString() || '1');

  useEffect(() => {
    if (currency.code !== 'IDR' && !editTransaction) {
      setExchangeRate(currency.rate.toString());
    } else if (currency.code === 'IDR') {
      setExchangeRate('1');
    }
  }, [currency, editTransaction]);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    const categoriesData = await getCategories();
    setCategories(categoriesData);
    
    if (editTransaction?.categoryId) {
      const cat = categoriesData.find(c => c.id === editTransaction.categoryId);
      if (cat) setSelectedCategory(cat);
    } else if (categoriesData.length > 0 && !selectedCategory) {
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
        id: editTransaction?.id,
        type,
        amount: parseFloat(amount),
        description: description.trim(),
        categoryId: type === 'expense' ? selectedCategory?.id || '' : '',
        date,
        note: notes.trim(),
        photoUri: photoUri || undefined,
        currency: currency.code,
        exchangeRate: parseFloat(exchangeRate) || 1,
        createdAt: editTransaction?.createdAt || new Date().toISOString(),
      };

      await saveTransaction(transaction as any);
      
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
              { backgroundColor: type === 'income' ? COLORS.success : COLORS.border }
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
              { backgroundColor: type === 'expense' ? COLORS.danger : COLORS.border }
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

        {/* Amount Input Section */}
        <View style={styles.inputGroup}>
          <Text style={globalStyles.label}>Jumlah & Mata Uang</Text>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            style={styles.currencySelector}
            contentContainerStyle={styles.currencySelectorContent}
          >
            {CURRENCIES.map((c) => (
              <TouchableOpacity
                key={c.code}
                style={[
                  styles.currencyPill,
                  currency.code === c.code && styles.currencyPillActive,
                  { borderColor: currency.code === c.code ? COLORS.primary : COLORS.border }
                ]}
                onPress={() => setCurrency(c)}
              >
                <Text style={[
                  styles.currencyPillText,
                  currency.code === c.code && { color: COLORS.primary as string, fontWeight: 'bold' }
                ]}>
                  {c.code}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.amountInputContainer}>
            <Text style={styles.currencyPrefix}>{currency.symbol}</Text>
            <TextInput
              style={styles.amountInput}
              placeholder="0"
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
              placeholderTextColor={COLORS.textSecondary as string}
            />
          </View>

          {currency.code !== 'IDR' && (
            <View style={styles.exchangeRateContainer}>
              <Text style={styles.exchangeRateLabel}>Kurs (ke IDR):</Text>
              <TextInput
                style={styles.exchangeRateInput}
                value={exchangeRate}
                onChangeText={setExchangeRate}
                keyboardType="numeric"
                placeholder="Rate"
              />
            </View>
          )}

          {amount && parseFloat(amount) > 0 && (
            <View style={styles.previewContainer}>
              <Text style={styles.amountPreview}>
                Total Estimasi: {formatCurrency(parseFloat(amount) * (parseFloat(exchangeRate) || 1), 'IDR')}
              </Text>
            </View>
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
            placeholderTextColor={COLORS.textSecondary as string}
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
            placeholderTextColor={COLORS.textSecondary as string}
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
            placeholderTextColor={COLORS.textSecondary as string}
          />
        </View>

        {/* Photo Receipt */}
        <ImagePickerComponent
          imageUri={photoUri}
          onImageSelected={setPhotoUri}
          onImageRemoved={() => setPhotoUri(null)}
        />

        {/* Save Button */}
        <TouchableOpacity
          style={[globalStyles.buttonPrimary, styles.saveButton]}
          onPress={handleSave}
        >
          <Text style={globalStyles.buttonText}>💾 {editTransaction ? 'Perbarui' : 'Simpan'} Transaksi</Text>
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
  },
  typeButtonText: {
    fontSize: FONT_SIZES.md as any,
    fontWeight: FONT_WEIGHTS.semibold as any,
    color: COLORS.textLight as string,
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
  notesInput: {
    minHeight: 80,
  },
  saveButton: {
    marginTop: SPACING.md,
    marginBottom: SPACING.xl,
  },
  currencySelector: {
    marginBottom: SPACING.sm,
  },
  currencySelectorContent: {
    paddingRight: SPACING.md,
  },
  currencyPill: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: SPACING.sm,
    backgroundColor: COLORS.surface as string,
  },
  currencyPillActive: {
    backgroundColor: `${COLORS.primary}15`,
  },
  currencyPillText: {
    fontSize: FONT_SIZES.sm as any,
    color: COLORS.text as string,
  },
  exchangeRateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.sm,
    backgroundColor: COLORS.background as string,
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
  },
  exchangeRateLabel: {
    fontSize: FONT_SIZES.sm as any,
    color: COLORS.textSecondary as string,
    marginRight: SPACING.sm,
  },
  exchangeRateInput: {
    flex: 1,
    fontSize: FONT_SIZES.sm as any,
    color: COLORS.text as string,
    fontWeight: 'bold',
    padding: 0,
  },
  previewContainer: {
    marginTop: SPACING.xs,
  },
});

export default AddTransactionScreen;
