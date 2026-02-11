import fs from 'fs';
import path from 'path';

import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

async function main() {
  // Load .env file if present (simple parser) so local env values are available when running via node
  const envFile = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(envFile)) {
    const raw = fs.readFileSync(envFile, 'utf8');
    raw.split(/\r?\n/).forEach(line => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const idx = trimmed.indexOf('=');
      if (idx === -1) return;
      const key = trimmed.slice(0, idx).trim();
      let val = trimmed.slice(idx + 1).trim();
      if ((val.startsWith('\"') && val.endsWith('\"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = val;
    });
  }

  const env = process.env;
  const config = {
    apiKey: env.VITE_FIREBASE_API_KEY,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: env.VITE_FIREBASE_APP_ID,
  };

  if (!config.apiKey) {
    console.error('Missing VITE_FIREBASE_API_KEY in environment. Aborting.');
    process.exit(1);
  }

  try {
    if (!getApps().length) initializeApp(config);
    const db = getFirestore();

    const filePath = path.resolve(process.cwd(), 'tournament-data.json');
    if (!fs.existsSync(filePath)) {
      console.error('tournament-data.json not found at', filePath);
      process.exit(1);
    }

    const file = fs.readFileSync(filePath, 'utf8');
    const payload = JSON.parse(file);

    const docRef = doc(db, 'tournaments', 'default');
    await setDoc(docRef, payload);
    console.log('Migration complete: tournament-data.json uploaded to tournaments/default');
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

main();
