import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  onAuthStateChanged,
  updateProfile,
  User,
  NextOrObserver
} from 'firebase/auth';
import { auth } from '../config/firebase';

// Current User Listener
export const subscribeAuth = (callback: NextOrObserver<User>) => {
  return onAuthStateChanged(auth, callback);
};

// Get Current User
export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};

// Sign Up
export const signUp = async (email: string, password: string, name?: string) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    if (name) {
      await updateProfile(userCredential.user, { displayName: name });
    }
    return { user: userCredential.user, error: null };
  } catch (error) {
    return { user: null, error: (error as Error).message };
  }
};

// Sign In
export const login = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { user: userCredential.user, error: null };
  } catch (error) {
    return { user: null, error: (error as Error).message };
  }
};

// Logout
export const logout = async (): Promise<boolean> => {
  try {
    await signOut(auth);
    return true;
  } catch (error) {
    console.error("Logout Error:", error);
    return false;
  }
};
