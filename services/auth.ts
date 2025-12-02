import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { auth, migrateReadingsToUser } from './firebase';
import { UserInfo, ADMIN_EMAILS } from '../types';

export const signIn = async (email: string, password: string): Promise<User> => {
  if (!auth) throw new Error('Firebase Auth not configured');
  const result = await signInWithEmailAndPassword(auth, email, password);
  return result.user;
};

export const signUp = async (email: string, password: string): Promise<User> => {
  if (!auth) throw new Error('Firebase Auth not configured');
  const result = await createUserWithEmailAndPassword(auth, email, password);
  return result.user;
};

export const signOut = async (): Promise<void> => {
  if (!auth) throw new Error('Firebase Auth not configured');
  await firebaseSignOut(auth);
};

export const subscribeToAuth = (callback: (user: User | null) => void): (() => void) => {
  if (!auth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
};

export const getUserInfo = (user: User): UserInfo => {
  const email = user.email || '';
  return {
    uid: user.uid,
    email,
    displayName: user.displayName || email.split('@')[0] || 'Unknown',
    isAdmin: ADMIN_EMAILS.includes(email.toLowerCase())
  };
};

// Migrate all existing readings to the specified user
export const claimExistingReadings = async (user: User): Promise<number> => {
  const userInfo = getUserInfo(user);
  return migrateReadingsToUser(userInfo);
};
