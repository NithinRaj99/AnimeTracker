
// src/firebase.js
import { initializeApp } from "firebase/app";
import { getDatabase, ref, push, onValue, remove } from "firebase/database";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut 
} from "firebase/auth";

// 🔁 Replace with your Firebase project config:
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};
console.log(firebaseConfig);
// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Database
const db = getDatabase(app);

// Auth
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// Google login function
export const signInWithGoogle = () => {
  return signInWithPopup(auth, provider);
};

// Logout function
export const logout = () => {
  return signOut(auth);
};

export { auth, db, ref, push, onValue, remove };
