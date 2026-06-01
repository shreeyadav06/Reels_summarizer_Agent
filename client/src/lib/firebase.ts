import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// TODO: Replace with your Firebase config from the Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyAGR5YFSzd0jr9Df7hKSEa9vin1p_7aeno",
  authDomain: "reelbrain-agent.firebaseapp.com",
  projectId: "reelbrain-agent",
  storageBucket: "reelbrain-agent.firebasestorage.app",
  messagingSenderId: "19619603809",
  appId: "1:19619603809:web:d6d599669b5502f7f55120",
  measurementId: "G-HH3TMS48Y6"
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
    return null;
  }
};

export const logout = async () => {
  if (auth) {
    await signOut(auth);
  }
};

export { auth, db, isConfigured };
