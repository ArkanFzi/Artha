import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Alert } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { usePIN } from '../contexts/PINContext';
import ArthaLogo from '../components/ArthaLogo';
import PINKeypad from '../components/PINKeypad';
import { savePIN, validatePINFormat } from '../utils/pinStorage';

const PINSetupScreen = ({ navigation, route }) => {
  const { theme, isDark } = useTheme();
  const { updatePINStatus } = usePIN();
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState('setup'); // 'setup' or 'confirm'
  const [error, setError] = useState('');
  const shakeAnimation = useRef(new Animated.Value(0)).current;
  
  const isFromSettings = route?.params?.fromSettings;
  const maxLength = 6;
  const minLength = 6; // Exactly 6 digits

  const handleKeyPress = (value) => {
    setError('');
    
    if (step === 'setup') {
      if (pin.length < maxLength) {
        setPin(pin + value);
      }
    } else {
      if (confirmPin.length < maxLength) {
        setConfirmPin(confirmPin + value);
      }
    }
  };

  const handleDelete = () => {
    setError('');
    
    if (step === 'setup') {
      setPin(pin.slice(0, -1));
    } else {
      setConfirmPin(confirmPin.slice(0, -1));
    }
  };

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnimation, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  useEffect(() => {
    if (step === 'setup' && pin.length === 6) {
      // Auto-proceed to confirm step when exactly 6 digits
      const validation = validatePINFormat(pin);
      if (validation.valid) {
        setTimeout(() => {
          setStep('confirm');
        }, 200);
      } else {
        setError(validation.error);
        shake();
        setPin('');
      }
    }
  }, [pin]);

  useEffect(() => {
    if (step === 'confirm' && confirmPin.length === 6) {
      // Auto-verify when confirm PIN is exactly 6 digits
      if (confirmPin === pin) {
        handleSavePIN();
      } else {
        setError('PIN tidak cocok');
        shake();
        setTimeout(() => {
          setConfirmPin('');
          setError('');
        }, 1000);
      }
    }
  }, [confirmPin]);

  const handleSavePIN = async () => {
    const success = await savePIN(pin);
    
    if (success) {
      await updatePINStatus();
      
      if (isFromSettings) {
        Alert.alert(
          'Berhasil',
          'PIN berhasil diatur',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        navigation.replace('Main');
      }
    } else {
      setError('Gagal menyimpan PIN');
      shake();
    }
  };

  const renderPINDots = (currentPin, length = maxLength) => {
    return (
      <View style={styles.dotsContainer}>
        {Array.from({ length }).map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              {
                backgroundColor: index < currentPin.length 
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
        <Text style={[styles.title, { color: theme.text }]}>
          {step === 'setup' ? 'Buat PIN Baru' : 'Konfirmasi PIN'}
        </Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          {step === 'setup' 
            ? 'Masukkan 6 digit PIN untuk keamanan' 
            : 'Masukkan kembali PIN Anda'}
        </Text>
      </View>

      <Animated.View style={{ transform: [{ translateX: shakeAnimation }] }}>
        {renderPINDots(step === 'setup' ? pin : confirmPin)}
      </Animated.View>

      {error ? (
        <Text style={[styles.error, { color: theme.error }]}>{error}</Text>
      ) : (
        <View style={styles.errorPlaceholder} />
      )}

      <PINKeypad onPress={handleKeyPress} onDelete={handleDelete} />

      {!isFromSettings && (
        <Text 
          style={[styles.skipText, { color: theme.textSecondary }]}
          onPress={() => navigation.replace('Main')}
        >
          Lewati untuk sekarang
        </Text>
      )}
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
  skipText: {
    fontSize: 14,
    marginTop: 20,
    textDecorationLine: 'underline',
  },
});

export default PINSetupScreen;
