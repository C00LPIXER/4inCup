import fs from 'fs';
import path from 'path';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

// Load .env file manually (same as uploadToFirestore.js)
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

const authData = {
    username: '4inDegree',
    password: '9778574627'
};

async function uploadAuth() {
    try {
        console.log('🔥 Connecting to Firebase...');
        console.log('📤 Uploading authentication credentials...');
        console.log(`   - Username: ${authData.username}`);
        console.log(`   - Password: ${authData.password}`);

        await setDoc(doc(db, 'settings', 'auth'), authData);

        console.log('✅ SUCCESS! Authentication credentials uploaded to Firestore!');
        console.log('🌐 You can now view it at:');
        console.log(`   https://console.firebase.google.com/project/${firebaseConfig.projectId}/firestore`);
        console.log('\n🔐 Login credentials:');
        console.log(`   Username: ${authData.username}`);
        console.log(`   Password: ${authData.password}`);
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error uploading:', error);
        process.exit(1);
    }
}

uploadAuth();
