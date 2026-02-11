import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';

export async function getAuth() {
    try {
        const db = getFirestore();
        const docRef = doc(db, 'settings', 'auth');
        const snap = await getDoc(docRef);
        return snap.exists() ? snap.data() : null;
    } catch (error) {
        console.error('Failed to get auth:', error);
        return null;
    }
}

export async function setAuth(username, password) {
    try {
        const db = getFirestore();
        const docRef = doc(db, 'settings', 'auth');
        await setDoc(docRef, { username, password });
        return true;
    } catch (error) {
        console.error('Failed to set auth:', error);
        return false;
    }
}

export async function checkAuth() {
    const authenticated = sessionStorage.getItem('authenticated');
    return authenticated === 'true';
}
