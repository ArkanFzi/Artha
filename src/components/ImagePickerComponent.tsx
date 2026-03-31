import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS, BORDER_RADIUS } from '../styles/theme';
import { useTheme } from '../contexts/ThemeContext';

interface ImagePickerComponentProps {
  imageUri?: string | null;
  onImageSelected: (uri: string) => void;
  onImageRemoved: () => void;
}

const ImagePickerComponent: React.FC<ImagePickerComponentProps> = ({ imageUri, onImageSelected, onImageRemoved }) => {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);

  const requestPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Izinkan akses ke galeri untuk melampirkan foto struk');
      return false;
    }
    return true;
  };

  const requestCameraPermission = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Izinkan akses kamera untuk mengambil foto struk');
      return false;
    }
    return true;
  };

  const pickImageFromGallery = async () => {
    const hasPermission = await requestPermission();
    if (!hasPermission) return;

    setLoading(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
      });

      if (!result.canceled && result.assets[0]) {
        onImageSelected(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Gagal memilih gambar');
      console.error('Image picker error:', error);
    } finally {
      setLoading(false);
    }
  };

  const takePhoto = async () => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) return;

    setLoading(true);
    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
      });

      if (!result.canceled && result.assets[0]) {
        onImageSelected(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Gagal mengambil foto');
      console.error('Camera error:', error);
    } finally {
      setLoading(false);
    }
  };

  const showImageOptions = () => {
    Alert.alert(
      'Pilih Foto Struk',
      'Pilih sumber foto',
      [
        { text: '📷 Ambil Foto', onPress: takePhoto },
        { text: '🖼️ Pilih dari Galeri', onPress: pickImageFromGallery },
        { text: 'Batal', style: 'cancel' },
      ],
      { cancelable: true }
    );
  };

  const handleRemoveImage = () => {
    Alert.alert(
      'Hapus Foto',
      'Yakin ingin menghapus foto struk?',
      [
        { text: 'Batal', style: 'cancel' },
        { 
          text: 'Hapus', 
          style: 'destructive',
          onPress: onImageRemoved 
        },
      ]
    );
  };

  if (imageUri) {
    return (
      <View style={styles.imageContainer}>
        <Text style={[styles.label, { color: theme.text }]}>📸 Foto Struk</Text>
        <View style={styles.imageWrapper}>
          <Image source={{ uri: imageUri }} style={styles.image} />
          <TouchableOpacity 
            style={styles.removeButton}
            onPress={handleRemoveImage}
          >
            <Text style={styles.removeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: theme.text }]}>📸 Foto Struk (Opsional)</Text>
      <TouchableOpacity 
        style={[styles.addButton, { backgroundColor: theme.background, borderColor: theme.primary }]}
        onPress={showImageOptions}
        disabled={loading}
      >
        <Text style={styles.addButtonIcon}>📷</Text>
        <Text style={[styles.addButtonText, { color: theme.primary }]}>
          {loading ? 'Loading...' : 'Tambah Foto Struk'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
  },
  imageContainer: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: FONT_SIZES.sm as any,
    fontWeight: FONT_WEIGHTS.medium as any,
    marginBottom: SPACING.sm,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
  },
  addButtonIcon: {
    fontSize: 32,
    marginRight: SPACING.sm,
  },
  addButtonText: {
    fontSize: FONT_SIZES.md as any,
    fontWeight: FONT_WEIGHTS.semibold as any,
  },
  imageWrapper: {
    position: 'relative',
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: BORDER_RADIUS.md,
  },
  removeButton: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    backgroundColor: COLORS.danger as string,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    color: COLORS.textLight as string,
    fontSize: 18,
    fontWeight: FONT_WEIGHTS.bold as any,
  },
});

export default ImagePickerComponent;
