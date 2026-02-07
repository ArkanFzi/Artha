import React, { useState, useCallback, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  RefreshControl,
  TextInput,
  Animated,
  Dimensions,
  StatusBar,
  Platform,
  Modal,
  FlatList
} from 'react-native';
import { useFocusEffect, NavigationProp } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS, SHADOWS, BORDER_RADIUS } from '../styles/theme';
import { useTheme } from '../contexts/ThemeContext';
import TransactionCard from '../components/TransactionCard';
import { getTransactions, getCategories, getUnreadNotificationsCount } from '../utils/storage';
import { initializeRecurringService } from '../utils/recurringService';
import { 
  formatCurrency, 
  getCurrentMonth,
  filterTransactionsByMonth,
  calculateTotalIncome,
  calculateTotalExpense,
  calculateBalance
} from '../utils/calculations';
import { Transaction, Category } from '../types';

const { width, height } = Dimensions.get('window');
const HEADER_HEIGHT = Platform.OS === 'ios' ? 370 : 350;

interface HomeScreenProps {
  navigation: NavigationProp<any>;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { theme, isDark } = useTheme();
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [monthlyStats, setMonthlyStats] = useState({
    income: 0,
    expense: 0,
    balance: 0,
  });
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedLocation, setSelectedLocation] = useState('Malang, Indonesia');
  const [showLocationModal, setShowLocationModal] = useState(false);

  const scrollY = useRef(new Animated.Value(0)).current;

  const CITIES = [
    { id: '1', name: 'Jakarta, Indonesia' },
    { id: '2', name: 'Surabaya, Indonesia' },
    { id: '3', name: 'Bandung, Indonesia' },
    { id: '4', name: 'Malang, Indonesia' },
    { id: '5', name: 'Yogyakarta, Indonesia' },
    { id: '6', name: 'Bali, Indonesia' },
    { id: '7', name: 'Semarang, Indonesia' },
    { id: '8', name: 'Medan, Indonesia' },
  ];

  const loadData = async () => {
    try {
      const [transactionsData, categoriesData] = await Promise.all([
        getTransactions(),
        getCategories(),
      ]);
      
      setTransactions(transactionsData);
      setCategories(categoriesData);
      
      const currentMonth = getCurrentMonth();
      const monthlyTransactions = filterTransactionsByMonth(transactionsData, currentMonth);
      
      const income = calculateTotalIncome(monthlyTransactions);
      const expense = calculateTotalExpense(monthlyTransactions);
      const balance = calculateBalance(monthlyTransactions);
      
      setMonthlyStats({ income, expense, balance });
      setFilteredTransactions(
        [...transactionsData].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5)
      );
      
      try {
        await (initializeRecurringService as any)();
      } catch (recurringError) {
        console.error('Error initializing recurring service:', recurringError);
      }
      
      // Load notification count
      try {
        const count = await getUnreadNotificationsCount();
        setUnreadCount(count);
      } catch (error) {
        console.error('Error loading notification count:', error);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  useEffect(() => {
    // Load saved location
    const loadLocation = async () => {
      try {
        const saved = await AsyncStorage.getItem('@user_location');
        if (saved) {
          setSelectedLocation(saved);
        }
      } catch (error) {
        console.error('Error loading location:', error);
      }
    };
    loadLocation();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredTransactions([...transactions]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5));
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = transactions.filter(t => 
        (t.description || '').toLowerCase().includes(query)
      ).slice(0, 5);
      setFilteredTransactions(filtered);
    }
  }, [searchQuery, transactions]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getCategoryById = (id: string) => categories.find(c => c.id === id);

  const handleSelectLocation = async (location: string) => {
    setSelectedLocation(location);
    setShowLocationModal(false);
    try {
      await AsyncStorage.setItem('@user_location', location);
    } catch (error) {
      console.error('Error saving location:', error);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar 
        barStyle="light-content" 
        backgroundColor={COLORS.headerBackground} 
      />
      
      {/* Fixed Header with Gradient */}
      <LinearGradient
        colors={['#0D5D56', '#0A4A44']}
        style={[styles.headerContainer, { height: HEADER_HEIGHT }]}
      >
        {/* Top Bar */}
        <View style={styles.topBar}>
          <View>
            <Text style={styles.greetingText}>Halo, Arkan</Text>
            <TouchableOpacity 
              style={styles.locationRow}
              onPress={() => setShowLocationModal(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.locationText}>{selectedLocation}</Text>
              <Text style={styles.chevron}> ⌵</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={styles.notificationBtn}
              onPress={() => (navigation.navigate as any)('Notifications')}
            >
              <Text style={{ fontSize: 22 }}>🔔</Text>
              {unreadCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.profileBtn}
              onPress={() => navigation.navigate('Settings')}
            >
              <Text style={{ fontSize: 24 }}>🧔</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar */}
        <View style={[styles.searchContainer, { backgroundColor: isDark ? theme.surface : '#FFF' }]}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Cari transaksi..."
            placeholderTextColor={theme.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Balance Card */}
        <View style={[styles.balanceCard, { backgroundColor: isDark ? theme.surface : '#FFF' }]}>
          <View style={styles.balanceContent}>
            <View style={styles.balanceLeft}>
              <Text style={[styles.balanceTitle, { color: theme.text }]}>SOLUSI FINANSIAL,{'\n'}DALAM GENGGAMAN!</Text>
              <Text style={[styles.balanceSubtitle, { color: theme.textSecondary }]}>Kelola uangmu dengan cerdas{'\n'}dan efisien setiap hari.</Text>
              <TouchableOpacity 
                style={styles.reportBtn}
                onPress={() => navigation.navigate('Report')}
              >
                <Text style={styles.reportBtnText}>Laporan</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.balanceRight}>
              <Text style={{ fontSize: 48 }}>💰</Text>
              <View style={styles.amountBadge}>
                <Text style={styles.amountText}>{formatCurrency(monthlyStats.balance)}</Text>
              </View>
            </View>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            tintColor={COLORS.primary}
          />
        }
      >
        {/* Service Categories */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Kategori Layanan</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Category')}>
              <Text style={styles.seeAllText}>Lihat semua ›</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.serviceGrid}>
            {[
              { label: 'Transaksi', icon: '📝', screen: 'AddTransaction' },
              { label: 'Anggaran', icon: '📅', screen: 'Budget' },
              { label: 'Kategori', icon: '🏷️', screen: 'Category' },
              { label: 'Tabungan', icon: '🎯', screen: 'Goals' },
            ].map((item, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.serviceCard, { backgroundColor: isDark ? theme.surface : '#FFF' }]}
                onPress={() => (navigation.navigate as any)(item.screen)}
                activeOpacity={0.7}
              >
                <Text style={styles.serviceIcon}>{item.icon}</Text>
                <Text style={[styles.serviceLabel, { color: theme.text }]}>{item.label}</Text>
                <Text style={styles.serviceChevron}>›</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recent Transactions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Transaksi Terpopuler</Text>
            <TouchableOpacity onPress={() => (navigation.navigate as any)('Transactions')}>
              <Text style={styles.seeAllText}>Lihat semua ›</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.transactionList, { backgroundColor: isDark ? theme.surface : '#FFF' }]}>
            {filteredTransactions.length > 0 ? (
              filteredTransactions.map((transaction) => (
                <TransactionCard
                  key={transaction.id}
                  transaction={transaction}
                  category={getCategoryById(transaction.categoryId)}
                  onPress={() => (navigation.navigate as any)('AddTransaction', { transaction })}
                />
              ))
            ) : (
              <View style={styles.emptyState}>
                <Text style={{ fontSize: 48, marginBottom: 12 }}>🍃</Text>
                <Text style={[styles.emptyText, { color: theme.textSecondary }]}>Belum ada transaksi ditemukan.</Text>
              </View>
            )}
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity 
        style={styles.fab}
        onPress={() => navigation.navigate('AddTransaction')}
        activeOpacity={0.85}
      >
        <Text style={{ fontSize: 36, color: '#FFF', fontWeight: '300' }}>+</Text>
      </TouchableOpacity>


      {/* Location Selector Modal */}
      <Modal
        visible={showLocationModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowLocationModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: isDark ? theme.surface : '#FFF' }]}>
            {/* Modal Header */}
            <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Pilih Lokasi</Text>
              <TouchableOpacity onPress={() => setShowLocationModal(false)}>
                <Text style={[styles.modalClose, { color: theme.textSecondary }]}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* City List */}
            <FlatList
              data={CITIES}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.cityItem,
                    selectedLocation === item.name && {
                      backgroundColor: isDark ? 'rgba(0,191,166,0.15)' : 'rgba(0,191,166,0.1)',
                    },
                  ]}
                  onPress={() => handleSelectLocation(item.name)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.cityText, { color: theme.text }]}>📍 {item.name}</Text>
                  {selectedLocation === item.name && (
                    <Text style={{ color: COLORS.primary, fontSize: 20 }}>✓</Text>
                  )}
                </TouchableOpacity>
              )}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  headerContainer: {
    paddingTop: Platform.OS === 'ios' ? 50 : 35,
    paddingHorizontal: 20,
    paddingBottom: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  greetingText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: '800',
  },
  chevron: {
    color: '#FFF',
    fontSize: 16,
    opacity: 0.7,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  notificationBtn: {
    width: 48,
    height: 48,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: 10,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FF4444',
    borderWidth: 2,
    borderColor: '#0D5D56',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '800',
  },
  profileBtn: {
    width: 48,
    height: 48,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    height: 54,
    borderRadius: 20,
    paddingHorizontal: 18,
    marginBottom: 18,
    ...SHADOWS.medium,
  },
  searchIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  balanceCard: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 20,
    ...SHADOWS.large,
  },
  balanceContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceLeft: {
    flex: 1,
    paddingRight: 12,
  },
  balanceTitle: {
    color: '#1A1A1A',
    fontSize: 17,
    fontWeight: '900',
    lineHeight: 21,
    marginBottom: 6,
  },
  balanceSubtitle: {
    color: '#666',
    fontSize: 10,
    fontWeight: '600',
    lineHeight: 14,
    marginBottom: 12,
  },
  reportBtn: {
    backgroundColor: COLORS.headerBackground,
    alignSelf: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 14,
  },
  reportBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '800',
  },
  balanceRight: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  amountBadge: {
    backgroundColor: COLORS.headerBackground,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: 8,
  },
  amountText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '800',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 28,
  },
  section: {
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#1A1A1A',
    letterSpacing: -0.5,
  },
  seeAllText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  serviceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  serviceCard: {
    width: (width - 56) / 2,
    height: 72,
    backgroundColor: '#FFF',
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    marginBottom: 12,
    ...SHADOWS.small,
  },
  serviceIcon: {
    fontSize: 24,
  },
  serviceLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A1A',
    marginLeft: 12,
  },
  serviceChevron: {
    fontSize: 22,
    color: '#DDD',
    fontWeight: '300',
  },
  transactionList: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 8,
    ...SHADOWS.small,
  },
  emptyState: {
    padding: 48,
    alignItems: 'center',
  },
  emptyText: {
    color: '#999',
    fontSize: 15,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 24,
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: COLORS.headerBackground,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.premium,
    shadowColor: COLORS.headerBackground,
    elevation: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '70%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  modalClose: {
    fontSize: 28,
    fontWeight: '300',
  },
  cityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 4,
  },
  cityText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default HomeScreen;
