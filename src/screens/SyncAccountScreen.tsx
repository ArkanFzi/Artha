import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert, 
  ScrollView 
} from 'react-native';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS, BORDER_RADIUS } from '../styles/theme';
import { globalStyles } from '../styles/globalStyles';
import { useTheme } from '../contexts/ThemeContext';
import ArthaLogo from '../components/ArthaLogo';
import { login, signUp, logout, subscribeAuth } from '../services/auth';
import { backupData, restoreData, getLastBackupInfo } from '../services/sync';
import { User } from 'firebase/auth';
import { NavigationProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';

interface SyncAccountScreenProps {
  navigation: NavigationProp<RootStackParamList, 'SyncAccount'>;
}

const SyncAccountScreen: React.FC<SyncAccountScreenProps> = ({ navigation }) => {
  const { theme, isDark } = useTheme();
  
  const [user, setUser] = useState<User | null>(null);
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastBackup, setLastBackup] = useState<Date | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeAuth(currentUser => {
      setUser(currentUser);
      if (currentUser) {
        fetchLastBackup();
      }
    });
    return unsubscribe;
  }, []);

  const fetchLastBackup = async () => {
    const backupDate = await getLastBackupInfo();
    setLastBackup(backupDate);
  };

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Mohon isi email dan password');
      return;
    }

    if (!isLoginMode && !name) {
      Alert.alert('Error', 'Mohon isi nama Anda');
      return;
    }

    setIsLoading(true);
    try {
      const result = isLoginMode 
        ? await login(email, password)
        : await signUp(email, password, name);

      if (result.error) {
        Alert.alert('Gagal', result.error);
      } else {
        Alert.alert('Berhasil', isLoginMode ? 'Selamat datang kembali!' : 'Akun berhasil dibuat!');
      }
    } catch (error) {
      Alert.alert('Error', (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Keluar',
      'Apakah Anda yakin ingin keluar?',
      [
        { text: 'Batal', style: 'cancel' },
        { 
          text: 'Keluar', 
          style: 'destructive',
          onPress: async () => {
            const success = await logout();
            if (success) {
              setUser(null);
              setLastBackup(null);
            }
          }
        }
      ]
    );
  };

  const handleBackup = async () => {
    setIsSyncing(true);
    try {
      const result = await backupData();
      if (result.success) {
        setLastBackup(result.timestamp || new Date());
        Alert.alert('Berhasil', 'Data berhasil dicadangkan ke Cloud');
      } else {
        Alert.alert('Gagal', result.error || 'Terjadi kesalahan saat backup');
      }
    } catch (error) {
      Alert.alert('Error', (error as Error).message);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleRestore = async () => {
    Alert.alert(
      'Restore Data',
      'Data lokal Anda akan digantikan dengan data dari Cloud. Lanjutkan?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Ya, Restore',
          onPress: async () => {
            setIsSyncing(true);
            try {
              const result = await restoreData();
              if (result.success) {
                Alert.alert('Berhasil', 'Data berhasil dipulihkan. Aplikasi akan dimuat ulang.');
                // In real app, we might need to trigger a global state refresh or reload
              } else {
                Alert.alert('Gagal', result.error || 'Tidak ada data backup ditemukan');
              }
            } catch (error) {
              Alert.alert('Error', (error as Error).message);
            } finally {
              setIsSyncing(false);
            }
          }
        }
      ]
    );
  };

  const renderAuthForm = () => (
    <View style={styles.card}>
      <View style={styles.logoTitleContainer}>
        <ArthaLogo size={60} />
        <Text style={[styles.title, { color: theme.text }]}>Cloud Artha</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Simpan data keuangan Anda dengan aman di Cloud
        </Text>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, isLoginMode && styles.activeTab]} 
          onPress={() => setIsLoginMode(true)}
        >
          <Text style={[styles.tabText, isLoginMode && styles.activeTabText, { color: isLoginMode ? COLORS.primary as string : theme.textSecondary }]}>Login</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, !isLoginMode && styles.activeTab]} 
          onPress={() => setIsLoginMode(false)}
        >
          <Text style={[styles.tabText, !isLoginMode && styles.activeTabText, { color: !isLoginMode ? COLORS.primary as string : theme.textSecondary }]}>Daftar</Text>
        </TouchableOpacity>
      </View>

      {!isLoginMode && (
        <View style={styles.inputGroup}>
          <Text style={[globalStyles.label, { color: theme.text }]}>Nama Lengkap</Text>
          <TextInput
            style={[globalStyles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
            placeholder="John Doe"
            placeholderTextColor={theme.textSecondary}
            value={name}
            onChangeText={setName}
          />
        </View>
      )}

      <View style={styles.inputGroup}>
        <Text style={[globalStyles.label, { color: theme.text }]}>Email</Text>
        <TextInput
          style={[globalStyles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
          placeholder="email@contoh.com"
          placeholderTextColor={theme.textSecondary}
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={[globalStyles.label, { color: theme.text }]}>Password</Text>
        <TextInput
          style={[globalStyles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
          placeholder="••••••••"
          placeholderTextColor={theme.textSecondary}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
      </View>

      <TouchableOpacity 
        style={[globalStyles.buttonPrimary, styles.authButton]} 
        onPress={handleAuth}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={globalStyles.buttonText}>{isLoginMode ? 'Masuk' : 'Daftar Sekarang'}</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderUserInfo = () => (
    <View style={styles.card}>
      <View style={styles.userHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.displayName ? user.displayName.charAt(0).toUpperCase() : (user?.email ? user.email.charAt(0).toUpperCase() : 'U')}
          </Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={[styles.userName, { color: theme.text }]}>
            {user?.displayName || 'Pengguna Artha'}
          </Text>
          <Text style={[styles.userEmail, { color: theme.textSecondary }]}>
            {user?.email}
          </Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Keluar</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.syncSection}>
        <View style={styles.syncStatus}>
          <Text style={[styles.syncStatusTitle, { color: theme.text }]}>Status Sinkronisasi</Text>
          <Text style={[styles.lastSync, { color: theme.textSecondary }]}>
            Terakhir sinkron: {lastBackup ? lastBackup.toLocaleString('id-ID') : 'Belum pernah'}
          </Text>
        </View>

        <TouchableOpacity 
          style={[styles.syncButton, { backgroundColor: COLORS.primary as string }]} 
          onPress={handleBackup}
          disabled={isSyncing}
        >
          {isSyncing ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Text style={styles.syncButtonIcon}>☁️</Text>
              <Text style={styles.syncButtonText}>Backup Ke Cloud</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.syncButton, styles.restoreButton, { borderColor: COLORS.primary as string }]} 
          onPress={handleRestore}
          disabled={isSyncing}
        >
          <Text style={[styles.syncButtonIcon, { color: COLORS.primary as string }]}>🔄</Text>
          <Text style={[styles.syncButtonText, { color: COLORS.primary as string }]}>Restore Dari Cloud</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.infoText}>
          💡 Gunakan fitur ini untuk menjaga data Anda tetap aman meskipun ganti handphone atau aplikasi terhapus.
        </Text>
      </View>
    </View>
  );

  return (
    <ScrollView 
      style={[globalStyles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.container}
    >
      {!user ? renderAuthForm() : renderUserInfo()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: SPACING.md,
    flexGrow: 1,
  },
  card: {
    backgroundColor: COLORS.surface as string,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    width: '100%',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logoTitleContainer: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: FONT_SIZES.xl as any,
    fontWeight: FONT_WEIGHTS.bold as any,
    marginTop: SPACING.md,
  },
  subtitle: {
    fontSize: FONT_SIZES.sm as any,
    textAlign: 'center',
    marginTop: SPACING.xs,
    paddingHorizontal: SPACING.md,
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: SPACING.lg,
    backgroundColor: '#F0F0F0',
    borderRadius: BORDER_RADIUS.md,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.sm,
  },
  activeTab: {
    backgroundColor: '#FFF',
  },
  tabText: {
    fontSize: FONT_SIZES.md as any,
    fontWeight: FONT_WEIGHTS.semibold as any,
  },
  activeTabText: {
    color: COLORS.primary as string,
  },
  inputGroup: {
    marginBottom: SPACING.md,
  },
  authButton: {
    marginTop: SPACING.md,
    height: 50,
    justifyContent: 'center',
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.primary as string,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  userName: {
    fontSize: FONT_SIZES.md as any,
    fontWeight: FONT_WEIGHTS.bold as any,
  },
  userEmail: {
    fontSize: FONT_SIZES.sm as any,
  },
  logoutBtn: {
    padding: SPACING.xs,
  },
  logoutText: {
    color: COLORS.danger as string,
    fontWeight: '600',
  },
  syncSection: {
    marginTop: SPACING.md,
  },
  syncStatus: {
    marginBottom: SPACING.lg,
    alignItems: 'center',
  },
  syncStatusTitle: {
    fontSize: FONT_SIZES.md as any,
    fontWeight: '600',
    marginBottom: 4,
  },
  lastSync: {
    fontSize: FONT_SIZES.sm as any,
  },
  syncButton: {
    flexDirection: 'row',
    height: 55,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  restoreButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
  },
  syncButtonIcon: {
    fontSize: 20,
    marginRight: SPACING.sm,
  },
  syncButtonText: {
    color: '#FFF',
    fontSize: FONT_SIZES.md as any,
    fontWeight: 'bold',
  },
  infoBox: {
    backgroundColor: '#E1F5FE',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginTop: SPACING.lg,
  },
  infoText: {
    color: '#0288D1',
    fontSize: FONT_SIZES.xs as any,
    lineHeight: 18,
  },
});

export default SyncAccountScreen;
