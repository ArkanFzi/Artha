import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity, Alert } from 'react-native';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS, BORDER_RADIUS, SHADOWS } from '../styles/theme';
import { globalStyles } from '../styles/globalStyles';
import { useTheme } from '../contexts/ThemeContext';
import { usePIN } from '../contexts/PINContext';
import { isPINSet, setPINEnabled, getPINEnabled, deletePIN } from '../utils/pinStorage';
import {
  getNotificationSettings,
  saveNotificationSettings,
  requestNotificationPermissions,
  cancelAllNotifications,
} from '../utils/notificationService';

const SettingsScreen = ({ navigation }) => {
  const { theme, isDark, toggleTheme } = useTheme();
  const { updatePINStatus } = usePIN();
  
  const [settings, setSettings] = useState({
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

  const handleToggle = async (key) => {
    if (!hasPermission) {
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

    const newSettings = { ...settings, [key]: !settings[key] };
    setSettings(newSettings);
    await saveNotificationSettings(newSettings);
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
      // Navigate to PIN setup
      navigation.navigate('PINSetup', { fromSettings: true });
    } else {
      // Toggle PIN enabled/disabled
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
    navigation.navigate('PINSetup', { fromSettings: true });
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

  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    sectionTitle: {
      fontSize: FONT_SIZES.lg,
      fontWeight: FONT_WEIGHTS.bold,
      color: theme.text,
      marginBottom: SPACING.md,
    },
    settingItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: theme.surface,
      padding: SPACING.md,
      borderRadius: BORDER_RADIUS.md,
      marginBottom: SPACING.sm,
      ...SHADOWS.small,
    },
    settingLabel: {
      fontSize: FONT_SIZES.md,
      color: theme.text,
      flex: 1,
    },
    settingDescription: {
      fontSize: FONT_SIZES.sm,
      color: theme.textSecondary,
      marginTop: SPACING.xs,
    },
  });

  return (
    <View style={dynamicStyles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Appearance Section */}
        <View style={styles.section}>
          <Text style={dynamicStyles.sectionTitle}>🎨 Tampilan</Text>
          
          <View style={dynamicStyles.settingItem}>
            <View style={{ flex: 1 }}>
              <Text style={dynamicStyles.settingLabel}>Dark Mode</Text>
              <Text style={dynamicStyles.settingDescription}>
                {isDark ? 'Mode gelap aktif' : 'Mode terang aktif'}
              </Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: '#ccc', true: COLORS.primary }}
              thumbColor={isDark ? COLORS.primaryLight : '#f4f3f4'}
            />
          </View>
        </View>



        {/* Cloud Sync Section */}
        <View style={styles.section}>
          <Text style={dynamicStyles.sectionTitle}>☁️ Cloud Sync</Text>
          <TouchableOpacity
            style={dynamicStyles.settingItem}
            onPress={() => navigation.navigate('SyncAccount')}
          >
            <View style={{ flex: 1 }}>
              <Text style={dynamicStyles.settingLabel}>Backup & Restore</Text>
              <Text style={dynamicStyles.settingDescription}>
                Sinkronisasi data ke cloud agar aman
              </Text>
            </View>
            <Text style={{ color: theme.primary, fontSize: 18 }}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Security Section */}
        <View style={styles.section}>
          <Text style={dynamicStyles.sectionTitle}>🔐 Keamanan</Text>
          
          <View style={dynamicStyles.settingItem}>
            <View style={{ flex: 1 }}>
              <Text style={dynamicStyles.settingLabel}>PIN Keamanan</Text>
              <Text style={dynamicStyles.settingDescription}>
                {hasPIN ? (pinEnabled ? 'PIN aktif' : 'PIN dinonaktifkan') : 'Belum ada PIN'}
              </Text>
            </View>
            <Switch
              value={pinEnabled}
              onValueChange={handlePINToggle}
              trackColor={{ false: '#ccc', true: COLORS.primary }}
              thumbColor={pinEnabled ? COLORS.primaryLight : '#f4f3f4'}
            />
          </View>

          {hasPIN && (
            <>
              <TouchableOpacity
                style={dynamicStyles.settingItem}
                onPress={handleChangePIN}
              >
                <Text style={dynamicStyles.settingLabel}>Ubah PIN</Text>
                <Text style={{ color: theme.primary, fontSize: 18 }}>›</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={dynamicStyles.settingItem}
                onPress={handleResetPIN}
              >
                <Text style={[dynamicStyles.settingLabel, { color: theme.error }]}>Reset PIN</Text>
                <Text style={{ color: theme.error, fontSize: 18 }}>›</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Notifications Section */}
        <View style={styles.section}>
          <Text style={dynamicStyles.sectionTitle}>🔔 Notifikasi</Text>
          
          {!hasPermission && (
            <View style={styles.warningCard}>
              <Text style={styles.warningText}>
                ⚠️ Izin notifikasi belum diaktifkan. Tap untuk mengaktifkan.
              </Text>
              <TouchableOpacity
                style={styles.warningButton}
                onPress={checkPermissions}
              >
                <Text style={styles.warningButtonText}>Aktifkan Izin</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Pengingat Harian</Text>
              <Text style={styles.settingDescription}>
                Ingatkan untuk input transaksi setiap hari jam {settings.reminderTime}
              </Text>
            </View>
            <Switch
              value={settings.dailyReminder}
              onValueChange={() => handleToggle('dailyReminder')}
              trackColor={{ false: COLORS.border, true: COLORS.primary }}
              thumbColor={COLORS.surface}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Alert Budget</Text>
              <Text style={styles.settingDescription}>
                Notifikasi ketika budget kategori hampir habis ({'>'}80%)
              </Text>
            </View>
            <Switch
              value={settings.budgetAlerts}
              onValueChange={() => handleToggle('budgetAlerts')}
              trackColor={{ false: COLORS.border, true: COLORS.primary }}
              thumbColor={COLORS.surface}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Review Bulanan</Text>
              <Text style={styles.settingDescription}>
                Pengingat review keuangan setiap awal bulan
              </Text>
            </View>
            <Switch
              value={settings.monthlyReview}
              onValueChange={() => handleToggle('monthlyReview')}
              trackColor={{ false: COLORS.border, true: COLORS.primary}}
              thumbColor={COLORS.surface}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🛠️ Lainnya</Text>
          
          <TouchableOpacity
            style={styles.dangerButton}
            onPress={handleClearAllNotifications}
          >
            <Text style={styles.dangerButtonText}>🗑️ Hapus Semua Notifikasi</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>💡 Tips</Text>
          <Text style={styles.infoText}>
            • Aktifkan pengingat harian untuk konsisten mencatat keuangan{'\n'}
            • Alert budget membantu Anda tetap dalam batas pengeluaran{'\n'}
            • Review bulanan penting untuk evaluasi dan perencanaan
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    padding: SPACING.lg,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    ...SHADOWS.small,
  },
  settingInfo: {
    flex: 1,
    marginRight: SPACING.md,
  },
  settingTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  settingDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  warningCard: {
    backgroundColor: '#FFF3CD',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  warningText: {
    fontSize: FONT_SIZES.sm,
    color: '#856404',
    marginBottom: SPACING.sm,
  },
  warningButton: {
    backgroundColor: '#FFC107',
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.sm,
    alignItems: 'center',
  },
  warningButtonText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.semibold,
    color: '#856404',
  },
  dangerButton: {
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: COLORS.danger,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
    ...SHADOWS.small,
  },
  dangerButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.danger,
  },
  infoCard: {
    backgroundColor: '#E3F2FD',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
  },
  infoTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
    color: '#1976D2',
    marginBottom: SPACING.sm,
  },
  infoText: {
    fontSize: FONT_SIZES.sm,
    color: '#1565C0',
    lineHeight: 20,
  },
});

export default SettingsScreen;
