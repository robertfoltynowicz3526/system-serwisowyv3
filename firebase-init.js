import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Ten kod odczyta klucze bezpiecznie ze zmiennych środowiskowych w Vercel
// Zmienne te dodamy na samym końcu w panelu Vercel
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Inicjalizuj Firebase
const app = initializeApp(firebaseConfig);

// Eksportuj 'db' do użycia w main.js
export const db = getFirestore(app);