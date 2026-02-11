import fs from 'fs';
import path from 'path';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

async function uploadData() {
  // Load .env file if present
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
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = val;
    });
  }

  const config = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID,
  };

  if (!config.apiKey) {
    console.error('❌ Missing VITE_FIREBASE_API_KEY in .env file');
    process.exit(1);
  }

  try {
    console.log('🔥 Connecting to Firebase...');
    if (!getApps().length) initializeApp(config);
    const db = getFirestore();

    // Read the firestore-data.json file
    const dataPath = path.resolve(process.cwd(), 'firestore-data.json');
    if (!fs.existsSync(dataPath)) {
      console.error('❌ firestore-data.json not found');
      process.exit(1);
    }

    const fileContent = fs.readFileSync(dataPath, 'utf8');
    const tournamentData = JSON.parse(fileContent);

    console.log('📤 Uploading tournament data...');
    console.log(`   - ${tournamentData.teams.length} teams`);
    console.log(`   - ${tournamentData.matches.length} matches`);
    console.log(`   - Stage: ${tournamentData.stage}`);

    // Upload to Firestore
    const docRef = doc(db, 'tournaments', 'default');
    await setDoc(docRef, tournamentData);

    console.log('✅ SUCCESS! Tournament data uploaded to Firestore!');
    console.log('🌐 You can now view it at:');
    console.log(`   https://console.firebase.google.com/project/${config.projectId}/firestore`);
    
  } catch (err) {
    console.error('❌ Upload failed:', err.message);
    if (err.code === 'permission-denied') {
      console.log('\n⚠️  Permission denied! Please update Firestore rules:');
      console.log('   Go to Firebase Console → Firestore → Rules');
      console.log('   Copy rules from: firestore.rules file');
    }
    process.exit(1);
  }
}

uploadData();
