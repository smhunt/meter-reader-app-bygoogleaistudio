import { initializeApp, FirebaseApp } from 'firebase/app';
import { getFirestore, collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy, enableIndexedDbPersistence, Firestore, writeBatch, getDocs, where } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { MeterReading } from '../types';

const STORAGE_KEY = 'flowcheck_readings';

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
};

// Check if Firebase is configured
const isFirebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;

if (isFirebaseConfigured) {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);

  // Enable offline persistence
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn('Offline persistence failed: multiple tabs open');
    } else if (err.code === 'unimplemented') {
      console.warn('Offline persistence not supported by browser');
    }
  });
} else {
  console.warn('Firebase not configured. Using localStorage fallback. Add Firebase credentials to .env.local for multi-device sync.');
}

// localStorage helpers for fallback mode
const getLocalReadings = (): MeterReading[] => {
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved ? JSON.parse(saved) : [];
};

const saveLocalReadings = (readings: MeterReading[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(readings));
};

export const subscribeToReadings = (callback: (readings: MeterReading[]) => void) => {
  if (db) {
    const readingsCollection = collection(db, 'readings');
    const q = query(readingsCollection, orderBy('timestamp', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const readings: MeterReading[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as MeterReading[];
      callback(readings);
    });
  } else {
    // Fallback: localStorage
    callback(getLocalReadings());
    // Return a no-op unsubscribe
    return () => {};
  }
};

export const addReading = async (reading: Omit<MeterReading, 'id'>): Promise<string> => {
  if (db) {
    const readingsCollection = collection(db, 'readings');
    const docRef = await addDoc(readingsCollection, reading);
    return docRef.id;
  } else {
    // Fallback: localStorage
    const readings = getLocalReadings();
    const id = Date.now().toString();
    readings.unshift({ id, ...reading } as MeterReading);
    saveLocalReadings(readings);
    // Trigger re-render by dispatching storage event
    window.dispatchEvent(new Event('storage'));
    return id;
  }
};

export const updateReading = async (id: string, updates: Partial<MeterReading>): Promise<void> => {
  if (db) {
    const docRef = doc(db, 'readings', id);
    await updateDoc(docRef, updates);
  } else {
    // Fallback: localStorage
    const readings = getLocalReadings();
    const index = readings.findIndex(r => r.id === id);
    if (index !== -1) {
      readings[index] = { ...readings[index], ...updates };
      saveLocalReadings(readings);
      window.dispatchEvent(new Event('storage'));
    }
  }
};

export const deleteReading = async (id: string): Promise<void> => {
  if (db) {
    const docRef = doc(db, 'readings', id);
    await deleteDoc(docRef);
  } else {
    // Fallback: localStorage
    const readings = getLocalReadings().filter(r => r.id !== id);
    saveLocalReadings(readings);
    window.dispatchEvent(new Event('storage'));
  }
};

// Migrate existing readings to assign them to a user
export const migrateReadingsToUser = async (userInfo: { uid: string; email: string; displayName?: string }): Promise<number> => {
  if (!db) return 0;

  const readingsCollection = collection(db, 'readings');
  const q = query(readingsCollection, where('recordedBy', '==', null));

  try {
    const snapshot = await getDocs(readingsCollection);
    const batch = writeBatch(db);
    let count = 0;

    snapshot.docs.forEach((docSnapshot) => {
      const data = docSnapshot.data();
      if (!data.recordedBy) {
        batch.update(docSnapshot.ref, { recordedBy: userInfo });
        count++;
      }
    });

    if (count > 0) {
      await batch.commit();
    }
    return count;
  } catch (error) {
    console.error('Migration failed:', error);
    return 0;
  }
};

export { isFirebaseConfigured, auth };
