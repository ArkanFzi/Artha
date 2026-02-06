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
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS, BORDER_RADIUS, SHADOWS } from '../styles/theme';
import { globalStyles } from '../styles/globalStyles';
import { useTheme } from '../contexts/ThemeContext';
import ArthaLogo from '../components/ArthaLogo';
import { login, signUp, logout, subscribeAuth } from '../services/auth';
import { backupData, restoreData, getLastBackupInfo } from '../services/sync';

const SyncAccountScreen = ({ navigation }) => {
  const { theme, isDark } = useTheme();
  
  const [user, setUser] = useState(null);
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastBackup, setLastBackup] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    // Listen to auth state changes
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

    setIsLoading(true);
    let result;
    
    if (isLoginMode) {
      result = await login(email, password);
    } else {
      result = await signUp(email, password);
    }

    setIsLoading(false);

    if (result.error) {
      Alert.alert('Gagal', result.error);
    } else {
      // Success is handled by onAuthStateChanged
      setPassword(''); // clear password
    }
  };

  const handleLogout = async () => {
    await logout();
    setEmail('');
    setPassword('');
    setLastBackup(null);
  };

  const handleBackup = async () => {
    setIsSyncing(true);
    const result = await backupData();
    setIsSyncing(false);

    if (result.success) {
      Alert.alert('Berhasil', 'Data berhasil dibackup ke cloud!');
      fetchLastBackup();
    } else {
      Alert.alert('Gagal', 'Backup gagal: ' + result.error);
    }
  };

  const handleRestore = () => {
    Alert.alert(
      'Restore Data',
      'PERINGATAN: Restore akan menimpa data lokal saat ini dengan data dari cloud. Data lokal yang belum dibackup akan hilang.',
      [
        { text: 'Batal', style: 'cancel' },
        { 
          text: 'Restore', 
          style: 'destructive',
          onPress: async () => {
            setIsSyncing(true);
            const result = await restoreData();
            setIsSyncing(false);

            if (result.success) {
              Alert.alert(
                'Berhasil', 
                'Data berhasil direstore! Aplikasi akan restart untuk memuat data baru.',
                [
                  { 
                    text: 'OK', 
                    onPress: () => {
                      // Navigate back to home or trigger a reload hint
                      // Ideally we should reload app data context here too
                      navigation.reset({
                        index: 0,
                        routes: [{ name: 'Main' }],
                      });
                    }
                  }
                ]
              );
            } else {
              Alert.alert('Gagal', 'Restore gagal: ' + result.error);
            }
          }
        }
      ]
    );
  };

  // ---------------- RENDER ----------------

  const renderAuthForm = () => (
    <View style={styles.authContainer}>
      <Text style={[styles.title, { color: theme.text }]}>
        {isLoginMode ? 'Login Akun Sync' : 'Buat Akun Sync'}
      </Text>
      <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
        {isLoginMode 
          ? 'Masuk untuk mengelola backup cloud Anda' 
          : 'Daftar untuk menyimpan data Anda dengan aman'}
      </Text>

      <View style={styles.inputContainer}>
        <Text style={[styles.label, { color: theme.text }]}>Email</Text>
        <TextInput
          style={[styles.input, { 
            color: theme.text, 
            backgroundColor: theme.surface,
            borderColor: theme.border 
          }]}
          placeholder="email@contoh.com"
          placeholderTextColor={theme.textSecondary}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={[styles.label, { color: theme.text }]}>Password</Text>
        <TextInput
          style={[styles.input, { 
            color: theme.text, 
            backgroundColor: theme.surface,
            borderColor: theme.border 
          }]}
          placeholder="Password"
          placeholderTextColor={theme.textSecondary}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
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
          <Text style={globalStyles.buttonText}>
            {isLoginMode ? 'Masuk' : 'Daftar'}
          </Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.switchModeButton}
        onPress={() => setIsLoginMode(!isLoginMode)}
      >
        <Text style={[styles.switchModeText, { color: theme.primary }]}>
          {isLoginMode 
            ? 'Belum punya akun? Daftar disini' 
            : 'Sudah punya akun? Login disini'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderDashboard = () => (
    <View style={styles.dashboardContainer}>
      <View style={[styles.card, { backgroundColor: theme.surface }]}>
        <View style={styles.userInfo}>
          <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
            <Text style={styles.avatarText}>
              {user.email.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View>
            <Text style={[styles.emailText, { color: theme.text }]}>{user.email}</Text>
            <Text style={[styles.statusText, { color: theme.success }]}>Online ●</Text>
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: theme.border }]} />

        <View style={styles.backupInfo}>
          <Text style={[styles.backupLabel, { color: theme.textSecondary }]}>
            Terakhir Backup:
          </Text>
          <Text style={[styles.backupTime, { color: theme.text }]}>
            {lastBackup 
              ? lastBackup.toLocaleString('id-ID')
              : 'Belum pernah backup'}
          </Text>
        </View>
      </View>

      <View style={styles.actionsContainer}>
        <TouchableOpacity 
          style={[styles.actionButton, { backgroundColor: theme.primary }]}
          onPress={handleBackup}
          disabled={isSyncing}
        >
          {isSyncing ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Text style={styles.actionIcon}>☁️</Text>
              <Text style={styles.actionText}>Backup Sekarang</Text>
              <Text style={styles.actionSubtext}>Upload data ke cloud</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionButton, { backgroundColor: isDark ? '#333' : '#E0E0E0' }]}
          onPress={handleRestore}
          disabled={isSyncing}
        >
          <Text style={styles.actionIcon}>📥</Text>
          <Text style={[styles.actionText, { color: theme.text }]}>Restore Data</Text>
          <Text style={[styles.actionSubtext, { color: theme.textSecondary }]}>Download dari cloud</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity 
        style={styles.logoutButton}
        onPress={handleLogout}
      >
        <Text style={[styles.logoutText, { color: theme.error }]}>Keluar Akun</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.contentContainer}
    >
      <View style={styles.logoContainer}>
        <ArthaLogo size={60} />
      </View>

      {user ? renderDashboard() : renderAuthForm()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: SPACING.lg,
    paddingBottom: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
    marginTop: SPACING.lg,
  },
  // Auth Styles
  authContainer: {
    width: '100%',
  },
  title: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: FONT_SIZES.md,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  inputContainer: {
    marginBottom: SPACING.md,
  },
  label: {
    marginBottom: SPACING.xs,
    fontWeight: '500',
  },
  input: {
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    fontSize: FONT_SIZES.md,
  },
  authButton: {
    marginTop: SPACING.md,
    height: 50,
  },
  switchModeButton: {
    marginTop: SPACING.lg,
    alignItems: 'center',
  },
  switchModeText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  // Dashboard Styles
  dashboardContainer: {
    width: '100%',
  },
  card: {
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.lg,
    ...SHADOWS.small,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  avatarText: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  emailText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
  },
  statusText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    marginTop: 2,
  },
  divider: {
    height: 1,
    marginVertical: SPACING.md,
  },
  backupInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backupLabel: {
    fontSize: FONT_SIZES.sm,
  },
  backupTime: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.xl,
    gap: SPACING.md,
  },
  actionButton: {
    flex: 1,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    height: 120,
    ...SHADOWS.small,
  },
  actionIcon: {
    fontSize: 32,
    marginBottom: SPACING.xs,
  },
  actionText: {
    fontSize: FONT_SIZES.md,
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center',
  },
  actionSubtext: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginTop: 2,
  },
  logoutButton: {
    alignItems: 'center',
    padding: SPACING.md,
  },
  logoutText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
});

export default SyncAccountScreen;
