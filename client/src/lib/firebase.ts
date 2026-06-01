import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// TODO: Replace with your Firebase config from the Firebase Console
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "YOUR_API_KEY",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "reelbrain-agent.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "reelbrain-agent",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "reelbrain-agent.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "19619603809",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:19619603809:web:d6d599669b5502f7f55120",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-HH3TMS48Y6"
};

// Initialize Firebase only if the apiKey is actually provided (prevents crashes before setup)
const isConfigured = firebaseConfig.apiKey !== "YOUR_API_KEY";
const app = isConfigured ? initializeApp(firebaseConfig) : null;
const auth = app ? getAuth(app) : null;
const db = app ? getFirestore(app) : null;
const provider = new GoogleAuthProvider();

export const loginWithGoogle = async () => {
  if (!auth) {
    alert("Firebase is not configured yet! Please update src/lib/firebase.ts with your config.");
    return null;
  }
  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error) {
    console.error("Login failed", error);
    throw error;
  }
};

export const registerWithEmail = async (email: string, pass: string) => {
  if (!auth) throw new Error("Firebase not configured");
  const result = await createUserWithEmailAndPassword(auth, email, pass);
  return result.user;
};

export const loginWithEmail = async (email: string, pass: string) => {
  if (!auth) throw new Error("Firebase not configured");
  const result = await signInWithEmailAndPassword(auth, email, pass);
  return result.user;
};

export const logout = async () => {
  if (auth) {
    await signOut(auth);
  }
};

export { auth, db, isConfigured };

