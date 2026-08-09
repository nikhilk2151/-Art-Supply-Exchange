import { initializeApp, getApps } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyB3qSETjsWMEfyEih1k9m4H1d-u-q6hgPE',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'swap-279ed.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'swap-279ed',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'swap-279ed.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '405739911990',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:405739911990:web:cf8b773312585102385197'
};

let app = null;
let auth = null;

try {
  if (firebaseConfig.apiKey) {
    app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
    auth = getAuth(app);
    // Explicitly set persistence to browserLocalPersistence (localStorage)
    // to prevent mobile browser IndexedDB "Database is closing/hidden" errors.
    setPersistence(auth, browserLocalPersistence).catch(() => {});
  }
} catch (err) {
  console.warn('Firebase initialization notice:', err?.message || err);
}

export { auth };
export default app;
