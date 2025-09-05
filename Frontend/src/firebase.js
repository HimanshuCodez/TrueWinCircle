// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCVgfkbPfkef7U3t4TLvJhgArzTcNrzIZc",
  authDomain: "true-win-circle.firebaseapp.com",
  projectId: "true-win-circle",
  storageBucket: "true-win-circle.firebasestorage.app",
  messagingSenderId: "631622939115",
  appId: "1:631622939115:web:74d1900eae86a853ffe9ae",
  measurementId: "G-FXQ79HW7JP"
};

const app = initializeApp(firebaseConfig);

// ✅ Auth instance export
const auth = getAuth(app);

export { app, auth };
