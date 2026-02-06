import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence, getAuth } from 'firebase/auth'; // Authentication
import { getFirestore } from 'firebase/firestore'; // Database
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

// 🔥 FIREBASE CONFIGURATION 🔥
// Replace these values with your own from Firebase Console -> Project Settings
const firebaseConfig = {
  apiKey: "API_KEY_KAMU",
  authDomain: "artha-app.firebaseapp.com",
  projectId: "artha-app",
  storageBucket: "artha-app.appspot.com",
  messagingSenderId: "SENDER_ID",
  appId: "APP_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth with persistence
// This prevents the warning and keeps user logged in
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});

export const db = getFirestore(app);

export default app;
