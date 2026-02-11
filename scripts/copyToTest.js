import fs from 'fs';
import path from 'path';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';

// Load .env file manually
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

const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID,
};

// Validate config
const missingVars = Object.entries(firebaseConfig)
    .filter(([, value]) => !value)
    .map(([key]) => key);

if (missingVars.length > 0) {
    console.error('❌ Missing Firebase environment variables:', missingVars.join(', '));
    console.error('Please check your .env file');
    process.exit(1);
}

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function copyToTest() {
    try {
        console.log('🔥 Connecting to Firebase...');
        
        // Read production data
        console.log('📖 Reading production data...');
        const prodDoc = await getDoc(doc(db, 'tournaments', 'default'));
        
        if (!prodDoc.exists()) {
            console.error('❌ No production data found!');
            process.exit(1);
        }

        const prodData = prodDoc.data();
        console.log('✅ Production data loaded');
        console.log(`   - Teams: ${prodData.teams?.length || 0}`);
        console.log(`   - Matches: ${prodData.matches?.length || 0}`);

        // Write to test collection
        console.log('\n📤 Copying to test dataset (test_tournaments/default)...');
        await setDoc(doc(db, 'test_tournaments', 'default'), prodData);

        console.log('✅ SUCCESS! Data copied to test dataset!');
        console.log('🌐 View at:');
        console.log(`   https://console.firebase.google.com/project/${firebaseConfig.projectId}/firestore`);
        console.log('\n💡 Switch to test dataset using the Dataset Switcher in the app.');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

copyToTest();
