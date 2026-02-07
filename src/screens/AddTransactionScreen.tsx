import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TextInput, 
  TouchableOpacity,
  Alert,
  Dimensions
} from 'react-native';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS, BORDER_RADIUS, SHADOWS } from '../styles/theme';
import CategoryPicker from '../components/CategoryPicker';
import ImagePickerComponent from '../components/ImagePickerComponent';
import { saveTransaction, getCategories } from '../utils/storage';
import { CURRENCIES, formatCurrency, Currency } from '../utils/currency';
import { NavigationProp, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Category, TransactionType } from '../types';
import { useTheme } from '../contexts/ThemeContext';

const { width } = Dimensions.get('window');

interface AddTransactionScreenProps {
  navigation: NavigationProp<RootStackParamList, 'AddTransaction'>;
  route: RouteProp<RootStackParamList, 'AddTransaction'>;
}

const AddTransactionScreen: React.FC<AddTransactionScreenProps> = ({ navigation, route }) => {
  const { theme, isDark } = useTheme();
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
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={[styles.screenTitle, { color: theme.text }]}>
            {editTransaction ? 'Edit Transaksi' : 'Transaksi Baru'}
          </Text>
        </View>

        {/* Type Toggle Segmented Control */}
        <View style={[styles.typeToggleContainer, { backgroundColor: theme.surface }]}>
          <TouchableOpacity
            style={[
              styles.typeTab,
              type === 'expense' && { backgroundColor: COLORS.danger + '15' }
            ]}
            onPress={() => setType('expense')}
          >
            <Text style={[
              styles.typeTabText,
              { color: type === 'expense' ? COLORS.danger : theme.textSecondary }
            ]}>
              Pengeluaran
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.typeTab,
              type === 'income' && { backgroundColor: theme.primary + '15' }
            ]}
            onPress={() => setType('income')}
          >
            <Text style={[
              styles.typeTabText,
              { color: type === 'income' ? theme.primary : theme.textSecondary }
            ]}>
              Pemasukan
            </Text>
          </TouchableOpacity>
        </View>

        {/* Amount Section */}
        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          <Text style={[styles.label, { color: theme.textMuted }]}>JUMLAH</Text>
          
          <View style={styles.amountInputContainer}>
            <TouchableOpacity 
              style={[styles.currencySelect, { backgroundColor: theme.surfaceLight }]}
              onPress={() => { /* Potential to show a picker but keeping the pills for now */ }}
            >
              <Text style={[styles.currencyText, { color: theme.primary }]}>{currency.code}</Text>
            </TouchableOpacity>
            
            <TextInput
              style={[styles.amountInput, { color: theme.text }]}
              placeholder="0"
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
              placeholderTextColor={theme.textMuted}
              autoFocus={!editTransaction}
            />
          </View>

          {currency.code !== 'IDR' && (
            <View style={[styles.rateBox, { backgroundColor: theme.surfaceLight }]}>
              <Text style={[styles.rateLabel, { color: theme.textSecondary }]}>Kurs ke IDR</Text>
              <TextInput
                style={[styles.rateInput, { color: theme.text }]}
                value={exchangeRate}
                onChangeText={setExchangeRate}
                keyboardType="numeric"
              />
            </View>
          )}

          {amount && parseFloat(amount) > 0 && currency.code !== 'IDR' && (
             <Text style={styles.previewText}>
               Sekitar {formatCurrency(parseFloat(amount) * (parseFloat(exchangeRate) || 1), 'IDR')}
             </Text>
          )}
        </View>

        {/* Meta Info Section */}
        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          <Text style={[styles.label, { color: theme.textMuted }]}>INFORMASI</Text>
          
          <View style={styles.inputRow}>
            <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Deskripsi</Text>
            <TextInput
              style={[styles.inputField, { color: theme.text }]}
              placeholder="Apa untuk apa?"
              value={description}
              onChangeText={setDescription}
              placeholderTextColor={theme.textMuted}
            />
          </View>

          <View style={styles.divider} />

          {type === 'expense' && (
            <>
              <TouchableOpacity 
                style={styles.inputRow}
                onPress={() => setShowCategoryPicker(true)}
              >
                <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Kategori</Text>
                <View style={styles.categoryBadge}>
                  {selectedCategory && (
                    <Text style={{ marginRight: 8 }}>{selectedCategory.icon}</Text>
                  )}
                  <Text style={[styles.inputField, { color: theme.text }]}>
                    {selectedCategory?.name || 'Pilih Kategori'}
                  </Text>
                  <Text style={[styles.chevron, { color: theme.textMuted }]}>›</Text>
                </View>
              </TouchableOpacity>
              <View style={styles.divider} />
            </>
          )}

          <View style={styles.inputRow}>
            <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Tanggal</Text>
            <TextInput
              style={[styles.inputField, { color: theme.text }]}
              value={date}
              onChangeText={setDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={theme.textMuted}
            />
          </View>
        </View>

        {/* Notes Section */}
        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          <Text style={[styles.label, { color: theme.textMuted }]}>CATATAN TAMBAHAN</Text>
          <TextInput
            style={[styles.notesArea, { color: theme.text }]}
            placeholder="Ada yang perlu diingat?"
            value={notes}
            onChangeText={setNotes}
            multiline
            placeholderTextColor={theme.textMuted}
          />
        </View>

        {/* Photo Section */}
        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          <Text style={[styles.label, { color: theme.textMuted }]}>LAMPIRAN</Text>
          <ImagePickerComponent
            imageUri={photoUri}
            onImageSelected={setPhotoUri}
            onImageRemoved={() => setPhotoUri(null)}
          />
        </View>

        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: theme.primary }]}
          onPress={handleSave}
        >
          <Text style={styles.saveBtnText}>
            {editTransaction ? 'Perbarui Transaksi' : 'Simpan Transaksi'}
          </Text>
        </TouchableOpacity>
        
        <View style={{ height: 40 }} />
      </ScrollView>

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
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingTop: 60,
  },
  header: {
    marginBottom: 24,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -1,
  },
  typeToggleContainer: {
    flexDirection: 'row',
    padding: 6,
    borderRadius: 20,
    marginBottom: 24,
    ...SHADOWS.small,
  },
  typeTab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: 'center',
  },
  typeTabText: {
    fontSize: 14,
    fontWeight: '800',
  },
  card: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    ...SHADOWS.small,
  },
  label: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 16,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currencySelect: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    marginRight: 16,
  },
  currencyText: {
    fontSize: 16,
    fontWeight: '800',
  },
  amountInput: {
    flex: 1,
    fontSize: 40,
    fontWeight: '900',
    letterSpacing: -1,
    padding: 0,
  },
  rateBox: {
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rateLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  rateInput: {
    fontSize: 14,
    fontWeight: '800',
    padding: 0,
    textAlign: 'right',
    minWidth: 80,
  },
  previewText: {
    marginTop: 8,
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  inputLabel: {
    width: 90,
    fontSize: 14,
    fontWeight: '700',
  },
  inputField: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    padding: 0,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginVertical: 4,
  },
  categoryBadge: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  chevron: {
    fontSize: 20,
    marginLeft: 8,
  },
  notesArea: {
    fontSize: 15,
    fontWeight: '600',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  saveBtn: {
    paddingVertical: 18,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.medium,
    marginTop: 12,
  },
  saveBtnText: {
    color: COLORS.navy,
    fontSize: 16,
    fontWeight: '900',
  },
});

export default AddTransactionScreen;
