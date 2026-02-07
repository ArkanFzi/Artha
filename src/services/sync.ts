import { doc, getDoc, setDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { exportData, importData } from '../utils/storage';

const ASYNC_KEYS = [
  '@theme_preference',
  '@pin_enabled',
];

/**
 * Backup local data to Firestore
 */
export const backupData = async (): Promise<{ success: boolean; timestamp?: Date; error?: string }> => {
  const user = auth.currentUser;
  if (!user) return { success: false, error: 'User not logged in' };

  try {
    // 1. Get SQLite Data
    const sqliteData = await exportData();
    
    // 2. Get AsyncStorage Data
    const asyncPayload: Record<string, any> = {};
    const reads = ASYNC_KEYS.map(key => AsyncStorage.getItem(key));
    const results = await Promise.all(reads);
    
    ASYNC_KEYS.forEach((key, index) => {
      const result = results[index];
      if (result) {
        try {
          asyncPayload[key] = JSON.parse(result);
        } catch (e) {
          asyncPayload[key] = result;
        }
      }
    });

    const finalPayload = {
      backupData: JSON.stringify(sqliteData),
      settingsData: JSON.stringify(asyncPayload),
      updatedAt: serverTimestamp(),
      device: 'ReactNative App',
      email: user.email,
      version: '2.0.0 (SQLite)'
    };

    await setDoc(doc(db, 'users', user.uid), finalPayload);

    return { success: true, timestamp: new Date() };

  } catch (error) {
    console.error('Backup Error:', error);
    return { success: false, error: (error as Error).message };
  }
};

/**
 * Restore data from Firestore to local
 */
export const restoreData = async (): Promise<{ success: boolean; timestamp?: Date; error?: string }> => {
  const user = auth.currentUser;
  if (!user) return { success: false, error: 'User not logged in' };

  try {
    const docRef = doc(db, 'users', user.uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      
      // 1. Restore SQLite Data
      if (data.backupData) {
        const sqliteData = JSON.parse(data.backupData);
        await importData(sqliteData);
      }

      // 2. Restore Settings (AsyncStorage)
      if (data.settingsData) {
        const settings = JSON.parse(data.settingsData);
        const writes = Object.keys(settings).map((key) => {
          const value = typeof settings[key] === 'string' 
            ? settings[key] 
            : JSON.stringify(settings[key]);
          return AsyncStorage.setItem(key, value);
        });
        await Promise.all(writes);
      }
      
      const updatedAt = data.updatedAt as Timestamp | undefined;
      return { success: true, timestamp: updatedAt ? updatedAt.toDate() : new Date() };
    } else {
      return { success: false, error: 'No backup found for this account' };
    }

  } catch (error) {
    console.error('Restore Error:', error);
    return { success: false, error: (error as Error).message };
  }
};

/**
 * Get last backup info
 */
export const getLastBackupInfo = async (): Promise<Date | null> => {
  const user = auth.currentUser;
  if (!user) return null;

  try {
    const docRef = doc(db, 'users', user.uid);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      const updatedAt = data.updatedAt as Timestamp | undefined;
      return updatedAt ? updatedAt.toDate() : null;
    }
    return null;
  } catch (error) {
    console.error('Get Info Error:', error);
    return null;
  }
};
