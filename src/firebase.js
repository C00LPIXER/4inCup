import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const enabled = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

if (!enabled) {
  console.error('❌ Firebase configuration missing! Check your .env file.');
}

let docRef;
if (enabled) {
  if (!getApps().length) initializeApp(firebaseConfig);
  const db = getFirestore();
  docRef = doc(db, 'tournaments', 'default');
}

export async function getTournament() {
  if (!enabled) throw new Error('Firebase not configured');
  const snap = await getDoc(docRef);
  return snap.exists() ? snap.data() : null;
}

export function subscribeTournament(cb) {
  if (!enabled) throw new Error('Firebase not configured');
  return onSnapshot(docRef, (snap) => {
    cb(snap.exists() ? snap.data() : null);
  }, (error) => {
    console.error('Firebase subscription error:', error);
    throw error;
  });
}

export async function saveTournament(data) {
  if (!enabled) throw new Error('Firebase not configured');
  await setDoc(docRef, data);
}

export { enabled };
