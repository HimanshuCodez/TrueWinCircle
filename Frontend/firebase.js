
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyCVgfkbPfkef7U3t4TLvJhgArzTcNrzIZc",
  authDomain: "true-win-circle.firebaseapp.com",
  projectId: "true-win-circle",
  storageBucket: "true-win-circle.firebasestorage.app",
  messagingSenderId: "631622939115",
  appId: "1:631622939115:web:74d1900eae86a853ffe9ae",
  measurementId: "G-FXQ79HW7JP"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);