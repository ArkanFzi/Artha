import React, { useState, useCallback, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  TextInput,
  RefreshControl,
  Animated,
} from 'react-native';
import { useFocusEffect, NavigationProp } from '@react-navigation/native';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS, BORDER_RADIUS, SHADOWS } from '../styles/theme';
import { useTheme } from '../contexts/ThemeContext';
import TransactionCard from '../components/TransactionCard';
import { getTransactions, getCategories } from '../utils/storage';
import { Transaction, Category } from '../types';
import { formatCurrency } from '../utils/currency';

interface TransactionsScreenProps {
  navigation: NavigationProp<any>;
}

const TransactionsScreen: React.FC<TransactionsScreenProps> = ({ navigation }) => {
  const { theme } = useTheme();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const [tData, cData] = await Promise.all([
        getTransactions(),
        getCategories()
      ]);
      const sortedData = [...tData].sort((a, b) => 
        new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime()
      );
      setTransactions(sortedData);
      setCategories(cData);
      setFilteredTransactions(sortedData);
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredTransactions(transactions);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = transactions.filter(t => 
        (t.description || '').toLowerCase().includes(query) || 
        (getCategoryById(t.categoryId)?.name || '').toLowerCase().includes(query)
      );
      setFilteredTransactions(filtered);
    }
  }, [searchQuery, transactions]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getCategoryById = (id: string) => categories.find(c => c.id === id);

  const renderItem = ({ item }: { item: Transaction }) => (
    <View style={styles.cardWrapper}>
      <TransactionCard
        transaction={item}
        category={getCategoryById(item.categoryId)}
        onPress={() => navigation.navigate('AddTransaction', { transaction: item })}
      />
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.surface }]}>
        <View style={[styles.searchContainer, { backgroundColor: theme.surfaceLight }]}>
          <Text style={{ fontSize: 18, marginRight: 8 }}>🔍</Text>
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Cari transaksi atau kategori..."
            placeholderTextColor={theme.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery !== '' && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={{ color: theme.textSecondary }}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <FlatList
        data={filteredTransactions}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={{ fontSize: 40, marginBottom: 16 }}>🔎</Text>
            <Text style={{ color: theme.textSecondary, textAlign: 'center' }}>
              {searchQuery ? 'Tidak ada transaksi yang cocok' : 'Belum ada transaksi'}
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 10,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    ...SHADOWS.small,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    padding: 0,
  },
  listContent: {
    padding: 20,
    paddingBottom: 100,
  },
  cardWrapper: {
    marginBottom: 8,
  },
  emptyContainer: {
    marginTop: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default TransactionsScreen;
