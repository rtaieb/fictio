import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAUu3CpQ4zIkD41fFrtHDntLYtgU6OnoSQ",
  authDomain: "fictio-7fcc4.firebaseapp.com",
  projectId: "fictio-7fcc4",
  storageBucket: "fictio-7fcc4.firebasestorage.app",
  messagingSenderId: "333675027745",
  appId: "1:333675027745:web:9a263aaf6066cd34f33260",
  measurementId: "G-WP8X1YZS55"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
