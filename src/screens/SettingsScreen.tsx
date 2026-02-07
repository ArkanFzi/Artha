import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Switch, 
  TouchableOpacity, 
  Alert, 
  Dimensions 
} from 'react-native';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS, BORDER_RADIUS, SHADOWS } from '../styles/theme';
import { useTheme } from '../contexts/ThemeContext';
import { usePIN } from '../contexts/PINContext';
import { isPINSet, setPINEnabled, getPINEnabled, deletePIN } from '../utils/pinStorage';
import {
  getNotificationSettings,
  saveNotificationSettings,
  requestNotificationPermissions,
  cancelAllNotifications,
  NotificationSettings,
} from '../utils/notificationService';
import { NavigationProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';

const { width } = Dimensions.get('window');

interface SettingsScreenProps {
  navigation: NavigationProp<RootStackParamList, 'Settings'>;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ navigation }) => {
  const { theme, isDark, toggleTheme } = useTheme();
  const { updatePINStatus } = usePIN();
  
  const [settings, setSettings] = useState<NotificationSettings>({
    dailyReminder: true,
    budgetAlerts: true,
    monthlyReview: true,
    reminderTime: '20:00',
  });
  const [hasPermission, setHasPermission] = useState(false);
  const [pinEnabled, setPinEnabled] = useState(false);
  const [hasPIN, setHasPIN] = useState(false);

  useEffect(() => {
    loadSettings();
    checkPermissions();
    checkPINStatus();
  }, []);

  const loadSettings = async () => {
    const savedSettings = await getNotificationSettings();
    if (savedSettings) {
      setSettings(savedSettings);
    }
  };

  const checkPermissions = async () => {
    const permission = await requestNotificationPermissions();
    setHasPermission(permission);
  };

  const handleToggle = async (key: keyof NotificationSettings) => {
    if (!hasPermission && key !== 'reminderTime') {
      Alert.alert(
        'Izin Diperlukan',
        'Aktifkan izin notifikasi untuk menggunakan fitur ini',
        [
          { text: 'Batal', style: 'cancel' },
          { text: 'Aktifkan', onPress: checkPermissions },
        ]
      );
      return;
    }

    if (typeof settings[key] === 'boolean') {
      const newSettings = { ...settings, [key]: !settings[key] };
      setSettings(newSettings);
      await saveNotificationSettings(newSettings);
    }
  };

  const handleClearAllNotifications = () => {
    Alert.alert(
      'Hapus Semua Notifikasi',
      'Yakin ingin menghapus semua notifikasi yang dijadwalkan?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            await cancelAllNotifications();
            Alert.alert('Berhasil', 'Semua notifikasi telah dihapus');
          },
        },
      ]
    );
  };

  const checkPINStatus = async () => {
    const pinSet = await isPINSet();
    const enabled = await getPINEnabled();
    setHasPIN(pinSet);
    setPinEnabled(enabled);
  };

  const handlePINToggle = async () => {
    if (!hasPIN) {
      (navigation as any).navigate('PINSetup', { fromSettings: true });
    } else {
      const newValue = !pinEnabled;
      await setPINEnabled(newValue);
      setPinEnabled(newValue);
      await updatePINStatus();
      
      Alert.alert(
        'Berhasil',
        newValue ? 'PIN telah diaktifkan' : 'PIN telah dinonaktifkan'
      );
    }
  };

  const handleChangePIN = () => {
    (navigation as any).navigate('PINSetup', { fromSettings: true });
  };

  const handleResetPIN = () => {
    Alert.alert(
      'Reset PIN',
      'Yakin ingin menghapus PIN? Anda perlu membuat PIN baru setelah ini.',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await deletePIN();
            setHasPIN(false);
            setPinEnabled(false);
            await updatePINStatus();
            Alert.alert('Berhasil', 'PIN telah dihapus');
          },
        },
      ]
    );
  };

  const renderSettingItem = (
    label: string, 
    subLabel: string, 
    icon: string, 
    value?: boolean, 
    onToggle?: () => void, 
    onPress?: () => void,
    isDestructive?: boolean
  ) => (
    <TouchableOpacity 
      style={styles.settingItem} 
      onPress={onPress} 
      activeOpacity={onPress ? 0.7 : 1}
      disabled={onToggle !== undefined}
    >
      <View style={[styles.iconBox, { backgroundColor: theme.surfaceLight }]}>
        <Text style={{ fontSize: 20 }}>{icon}</Text>
      </View>
      <View style={styles.settingInfo}>
        <Text style={[styles.settingLabel, { color: isDestructive ? COLORS.danger : theme.text }]}>{label}</Text>
        <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>{subLabel}</Text>
      </View>
      {onToggle !== undefined ? (
        <Switch
          value={value}
          onValueChange={onToggle}
          trackColor={{ false: theme.border, true: theme.primary }}
          thumbColor={COLORS.white}
          ios_backgroundColor={theme.border}
        />
      ) : onPress ? (
        <Text style={[styles.chevron, { color: theme.textMuted }]}>›</Text>
      ) : null}
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={[styles.screenTitle, { color: theme.text }]}>Pengaturan</Text>
          <Text style={[styles.screenSubTitle, { color: theme.textSecondary }]}>Kustomisasi pengalaman Anda</Text>
        </View>

        {/* Appearance Card */}
        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>TAMPILAN</Text>
          {renderSettingItem(
            'Mode Gelap',
            isDark ? 'Gunakan tema gelap premium' : 'Gunakan tema terang bersih',
            '🌙',
            isDark,
            toggleTheme
          )}
        </View>

        {/* Security Card */}
        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>KEAMANAN</Text>
          {renderSettingItem(
            'PIN Keamanan',
            pinEnabled ? 'Akses aplikasi dilindungi PIN' : 'Aktifkan PIN untuk keamanan',
            '🔐',
            pinEnabled,
            handlePINToggle
          )}
          {hasPIN && (
            <>
              <View style={styles.divider} />
              {renderSettingItem('Ubah PIN', 'Ganti PIN keamanan Anda', '🔑', undefined, undefined, handleChangePIN)}
              <View style={styles.divider} />
              {renderSettingItem('Reset PIN', 'Hapus PIN yang ada', '🗑️', undefined, undefined, handleResetPIN, true)}
            </>
          )}
        </View>

        {/* Notifications Card */}
        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>NOTIFIKASI</Text>
          {renderSettingItem(
            'Pengingat Harian',
            `Setiap jam ${settings.reminderTime}`,
            '⏰',
            settings.dailyReminder,
            () => handleToggle('dailyReminder')
          )}
          <View style={styles.divider} />
          {renderSettingItem(
            'Alert Anggaran',
            'Peringatan saat budget >80%',
            '📉',
            settings.budgetAlerts,
            () => handleToggle('budgetAlerts')
          )}
          <View style={styles.divider} />
          {renderSettingItem(
            'Review Bulanan',
            'Ringkasan setiap awal bulan',
            '📅',
            settings.monthlyReview,
            () => handleToggle('monthlyReview')
          )}
        </View>

        {/* Data Card */}
        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>DATA & CLOUD</Text>
          {renderSettingItem(
            'Sinkronisasi Cloud',
            'Backup & restore data Anda',
            '☁️',
            undefined,
            undefined,
            () => (navigation as any).navigate('SyncAccount')
          )}
          <View style={styles.divider} />
          {renderSettingItem(
            'Hapus Notifikasi',
            'Bersihkan jadwal pengingat',
            '🧹',
            undefined,
            undefined,
            handleClearAllNotifications,
            true
          )}
        </View>

        <View style={styles.footer}>
          <Text style={[styles.versionText, { color: theme.textMuted }]}>Artha Premium v2.4.0</Text>
          <Text style={[styles.footerText, { color: theme.textMuted }]}>Dibuat dengan ❤️ untuk finansial Anda</Text>
        </View>
        
        <View style={{ height: 40 }} />
      </ScrollView>
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
    marginBottom: 32,
  },
  screenTitle: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -1,
  },
  screenSubTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  card: {
    borderRadius: 28,
    padding: 12,
    marginBottom: 24,
    ...SHADOWS.small,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginVertical: 12,
    marginLeft: 12,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 20,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
  settingDescription: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  chevron: {
    fontSize: 24,
    marginLeft: 8,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
    marginHorizontal: 12,
  },
  footer: {
    alignItems: 'center',
    marginTop: 16,
  },
  versionText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 4,
  },
  footerText: {
    fontSize: 11,
    fontWeight: '500',
  },
});

export default SettingsScreen;
