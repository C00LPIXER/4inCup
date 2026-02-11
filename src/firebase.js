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

let app, db;
if (enabled) {
  if (!getApps().length) app = initializeApp(firebaseConfig);
  db = getFirestore();
}

// Get current dataset from environment variable (default: 'production')
function getCurrentDataset() {
  return import.meta.env.VITE_DATASET || 'production';
}

// Get collection name based on dataset
function getCollectionName() {
  const dataset = getCurrentDataset();
  return dataset === 'test' ? 'test_tournaments' : 'tournaments';
}

// Get document reference based on current dataset
function getDocRef() {
  if (!enabled) throw new Error('Firebase not configured');
  const collectionName = getCollectionName();
  return doc(db, collectionName, 'default');
}

export async function getTournament() {
  const docRef = getDocRef();
  const snap = await getDoc(docRef);
  return snap.exists() ? snap.data() : null;
}

export function subscribeTournament(cb) {
  const docRef = getDocRef();
  return onSnapshot(docRef, (snap) => {
    cb(snap.exists() ? snap.data() : null);
  }, (error) => {
    console.error('Firebase subscription error:', error);
    throw error;
  });
}

export async function saveTournament(data) {
  const docRef = getDocRef();
  await setDoc(docRef, data);
}

export { enabled };
