import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';

const PIN_HASH_KEY = '@pin_hash';
const PIN_SALT_KEY = '@pin_salt';
const PIN_ENABLED_KEY = '@pin_enabled';

/**
 * Generate a random salt for PIN hashing
 */
const generateSalt = async () => {
  const randomBytes = await Crypto.getRandomBytesAsync(16);
  return Array.from(randomBytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
};

/**
 * Hash PIN with salt using SHA-256
 */
const hashPIN = async (pin, salt) => {
  const combined = pin + salt;
  const hash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    combined
  );
  return hash;
};

/**
 * Save PIN (hashed with salt)
 */
export const savePIN = async (pin) => {
  try {
    // Generate new salt
    const salt = await generateSalt();
    
    // Hash PIN with salt
    const hashedPIN = await hashPIN(pin, salt);
    
    // Save both hash and salt
    await AsyncStorage.multiSet([
      [PIN_HASH_KEY, hashedPIN],
      [PIN_SALT_KEY, salt],
      [PIN_ENABLED_KEY, 'true']
    ]);
    
    return true;
  } catch (error) {
    console.error('Error saving PIN:', error);
    return false;
  }
};

/**
 * Verify PIN against stored hash
 */
export const verifyPIN = async (pin) => {
  try {
    const [[, storedHash], [, salt]] = await AsyncStorage.multiGet([
      PIN_HASH_KEY,
      PIN_SALT_KEY
    ]);
    
    if (!storedHash || !salt) {
      return false;
    }
    
    // Hash input PIN with stored salt
    const hashedInput = await hashPIN(pin, salt);
    
    // Compare hashes
    return hashedInput === storedHash;
  } catch (error) {
    console.error('Error verifying PIN:', error);
    return false;
  }
};

/**
 * Check if PIN is set
 */
export const isPINSet = async () => {
  try {
    const hash = await AsyncStorage.getItem(PIN_HASH_KEY);
    return hash !== null;
  } catch (error) {
    console.error('Error checking PIN:', error);
    return false;
  }
};

/**
 * Get PIN enabled status
 */
export const getPINEnabled = async () => {
  try {
    const enabled = await AsyncStorage.getItem(PIN_ENABLED_KEY);
    return enabled === 'true';
  } catch (error) {
    console.error('Error getting PIN enabled status:', error);
    return false;
  }
};

/**
 * Set PIN enabled status
 */
export const setPINEnabled = async (enabled) => {
  try {
    await AsyncStorage.setItem(PIN_ENABLED_KEY, enabled ? 'true' : 'false');
    return true;
  } catch (error) {
    console.error('Error setting PIN enabled status:', error);
    return false;
  }
};

/**
 * Delete PIN (remove all PIN-related data)
 */
export const deletePIN = async () => {
  try {
    await AsyncStorage.multiRemove([
      PIN_HASH_KEY,
      PIN_SALT_KEY,
      PIN_ENABLED_KEY
    ]);
    return true;
  } catch (error) {
    console.error('Error deleting PIN:', error);
    return false;
  }
};

/**
 * Validate PIN format (exactly 6 digits)
 */
export const validatePINFormat = (pin) => {
  if (!pin || typeof pin !== 'string') {
    return { valid: false, error: 'PIN harus berupa angka' };
  }
  
  if (!/^\d+$/.test(pin)) {
    return { valid: false, error: 'PIN hanya boleh berisi angka' };
  }
  
  if (pin.length < 6) {
    return { valid: false, error: 'PIN harus 6 digit' };
  }
  
  if (pin.length > 6) {
    return { valid: false, error: 'PIN harus 6 digit' };
  }
  
  return { valid: true };
};
