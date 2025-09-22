// src/firebase.js
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCVgfkbPfkef7U3t4TLvJhgArzTcNrzIZc",
  authDomain: "true-win-circle.firebaseapp.com",
  projectId: "true-win-circle",
  storageBucket: "true-win-circle.firebasestorage.app",
  messagingSenderId: "631622939115",
  appId: "1:631622939115:web:74d1900eae86a853ffe9ae",
  measurementId: "G-FXQ79HW7JP"
};

// Check if a Firebase app is already initialized
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// ✅ Auth instance export
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
