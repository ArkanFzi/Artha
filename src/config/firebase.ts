import { initializeApp, FirebaseApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
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
const app: FirebaseApp = initializeApp(firebaseConfig);

// Initialize Auth with persistence
export const auth: Auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});

export const db: Firestore = getFirestore(app);

export default app;
