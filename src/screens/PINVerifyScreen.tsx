import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Alert } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { usePIN } from '../contexts/PINContext';
import ArthaLogo from '../components/ArthaLogo';
import PINKeypad from '../components/PINKeypad';
import { verifyPIN, deletePIN } from '../utils/pinStorage';
import { NavigationProp } from '@react-navigation/native';

interface PINVerifyScreenProps {
  navigation: NavigationProp<any>;
}

const PINVerifyScreen: React.FC<PINVerifyScreenProps> = ({ navigation }) => {
  const { theme, isDark } = useTheme();
  const { verifySuccess, updatePINStatus } = usePIN();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const shakeAnimation = useRef(new Animated.Value(0)).current;
  
  const maxLength = 6;
  const maxAttempts = 5;

  const handleKeyPress = (value: string) => {
    setError('');
    if (pin.length < maxLength) {
      setPin(pin + value);
    }
  };

  const handleDelete = () => {
    setError('');
    setPin(pin.slice(0, -1));
  };

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnimation, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  const handleVerifyPIN = async () => {
    const isValid = await verifyPIN(pin);
    
    if (isValid) {
      verifySuccess();
      (navigation as any).replace('Main');
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      
      if (newAttempts >= maxAttempts) {
        setError('Terlalu banyak percobaan. Silakan restart app.');
      } else {
        setError(`PIN salah (${newAttempts}/${maxAttempts})`);
      }
      
      shake();
      setTimeout(() => {
        setPin('');
      }, 500);
    }
  };

  useEffect(() => {
    if (pin.length === maxLength) {
      handleVerifyPIN();
    }
  }, [pin]);

  const renderPINDots = () => {
    return (
      <View style={styles.dotsContainer}>
        {Array.from({ length: maxLength }).map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              {
                backgroundColor: index < pin.length 
                  ? theme.primary 
                  : (isDark ? 'rgba(255,255,255,0.1)' : '#E5E7EB'),
              }
            ]}
          />
        ))}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <ArthaLogo size={48} />
        <Text style={[styles.title, { color: theme.text }]}>Selamat Datang Kembali</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Masukkan PIN Anda untuk melanjutkan
        </Text>
      </View>

      <Animated.View style={{ transform: [{ translateX: shakeAnimation }] }}>
        {renderPINDots()}
      </Animated.View>

      {error ? (
        <Text style={[styles.error, { color: theme.error }]}>{error}</Text>
      ) : (
        <View style={styles.errorPlaceholder} />
      )}

      <PINKeypad onPress={handleKeyPress} onDelete={handleDelete} />

      <TouchableOpacity 
        style={styles.forgotButton}
        onPress={() => {
          Alert.alert(
            'Lupa PIN?',
            'Untuk keamanan, mereset PIN akan menonaktifkan fitur keamanan ini. Anda perlu login kembali ke dashboard.',
            [
              { text: 'Batal', style: 'cancel' },
              {
                text: 'Reset PIN',
                style: 'destructive',
                onPress: async () => {
                  await deletePIN();
                  await updatePINStatus();
                  (navigation as any).replace('Main');
                }
              }
            ]
          );
        }}
      >
        <Text style={[styles.forgotText, { color: theme.textSecondary }]}>
          Lupa PIN?
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 20,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 30,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginHorizontal: 8,
  },
  error: {
    fontSize: 13,
    marginBottom: 10,
    textAlign: 'center',
    height: 20,
  },
  errorPlaceholder: {
    height: 20,
    marginBottom: 10,
  },
  forgotButton: {
    marginTop: 20,
  },
  forgotText: {
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});

export default PINVerifyScreen;
