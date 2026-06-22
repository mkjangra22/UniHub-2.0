import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getFirestore } from "firebase/firestore";

const metaEnv = (import.meta as any).env || {};

const firebaseConfig = {
  apiKey: metaEnv.VITE_FIREBASE_API_KEY || "YOUR_FIREBASE_API_KEY",
  authDomain: metaEnv.VITE_FIREBASE_AUTH_DOMAIN || "your-project.firebaseapp.com",
  projectId: metaEnv.VITE_FIREBASE_PROJECT_ID || "your-project-id",
  storageBucket: metaEnv.VITE_FIREBASE_STORAGE_BUCKET || "your-project.appspot.com",
  messagingSenderId: metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID || "your-sender-id",
  appId: metaEnv.VITE_FIREBASE_APP_ID || "your-app-id"
};

const isPlaceholder = (str: string) => {
  return !str || str.includes("your-") || str.includes("YOUR_");
};

export const isFirebaseConfigured = () => {
  return (
    firebaseConfig.apiKey && 
    !isPlaceholder(firebaseConfig.apiKey) && 
    firebaseConfig.projectId && 
    !isPlaceholder(firebaseConfig.projectId)
  );
};

let app;
let auth: ReturnType<typeof getAuth> | null = null;
let storage: ReturnType<typeof getStorage> | null = null;
let db: ReturnType<typeof getFirestore> | null = null;

if (isFirebaseConfigured()) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    storage = getStorage(app);
    db = getFirestore(app);
  } catch (e) {
    console.error("Firebase initialization failed:", e);
  }
}

export { app, auth, storage, db };
