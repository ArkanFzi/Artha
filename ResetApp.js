import React, { useState } from 'react';
import { View, Text, StyleSheet, Button, Alert } from 'react-native';
import { clearAllData } from './src/utils/storage';

export default function ResetApp() {
  const [isReset, setIsReset] = useState(false);

  const handleReset = async () => {
    try {
      await clearAllData();
      Alert.alert('Berhasil', 'Data telah direset. Silakan reload aplikasi.');
      setIsReset(true);
    } catch (error) {
      Alert.alert('Error', 'Gagal reset data: ' + error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Reset Data Aplikasi</Text>
      <Text style={styles.subtitle}>
        Tekan tombol di bawah untuk menghapus semua data dan memulai dari awal
      </Text>
      <Button title="Reset Data" onPress={handleReset} color="#F44336" />
      {isReset && (
        <Text style={styles.success}>
          ✅ Data berhasil direset! Silakan reload aplikasi (shake HP dan tap Reload)
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#666',
  },
  success: {
    marginTop: 20,
    fontSize: 16,
    color: '#4CAF50',
    textAlign: 'center',
  },
});
