import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CURRENCIES } from '../utils/currency';

// Keys to backup
const BACKUP_KEYS = [
  'transactions',
  'categories',
  'budget',
  '@theme_preference',
  '@pin_enabled',
  // We DO NOT backup PIN hash for security (user must set PIN on new device)
];

/**
 * Backup local data to Firestore
 */
export const backupData = async () => {
  const user = auth.currentUser;
  if (!user) return { success: false, error: 'User not logged in' };

  try {
    // 1. Read all local data
    const backupPayload = {};
    
    // Read keys in parallel
    const reads = BACKUP_KEYS.map(key => AsyncStorage.getItem(key));
    const results = await Promise.all(reads);
    
    BACKUP_KEYS.forEach((key, index) => {
      if (results[index]) {
        try {
          // Parse JSON if possible to store cleanly, or keep as string
          backupPayload[key] = JSON.parse(results[index]);
        } catch (e) {
          backupPayload[key] = results[index];
        }
      }
    });

    // 2. Add Metadata
    const finalPayload = {
      backupData: JSON.stringify(backupPayload), // Store as string to ensure easy restore
      updatedAt: serverTimestamp(),
      device: 'ReactNative App',
      email: user.email,
      version: '1.0.0'
    };

    // 3. Write to Firestore
    // Document: users/{uid}/backups/latest
    // OR just users/{uid} if simpler. Let's use users/{uid} for simplicity.
    await setDoc(doc(db, 'users', user.uid), finalPayload);

    return { success: true, timestamp: new Date() };

  } catch (error) {
    console.error('Backup Error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Restore data from Firestore to local
 */
export const restoreData = async () => {
  const user = auth.currentUser;
  if (!user) return { success: false, error: 'User not logged in' };

  try {
    // 1. Get doc from Firestore
    const docRef = doc(db, 'users', user.uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      const backupDataString = data.backupData;
      
      if (!backupDataString) return { success: false, error: 'No backup data found' };

      const backupPayload = JSON.parse(backupDataString);

      // 2. Restore keys
      const writes = Object.keys(backupPayload).map((key) => {
        const value = typeof backupPayload[key] === 'string' 
          ? backupPayload[key] 
          : JSON.stringify(backupPayload[key]);
        return AsyncStorage.setItem(key, value);
      });

      await Promise.all(writes);

      return { success: true, timestamp: data.updatedAt?.toDate() || new Date() };
    } else {
      return { success: false, error: 'No backup found for this account' };
    }

  } catch (error) {
    console.error('Restore Error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get last backup info
 */
export const getLastBackupInfo = async () => {
  const user = auth.currentUser;
  if (!user) return null;

  try {
    const docRef = doc(db, 'users', user.uid);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data().updatedAt?.toDate();
    }
    return null;
  } catch (error) {
    console.error('Get Info Error:', error);
    return null;
  }
};
