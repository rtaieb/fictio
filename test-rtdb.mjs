import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, remove } from "firebase/database";

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
const db = getDatabase(app);
const testRef = ref(db, 'test');
set(testRef, "test-value").then(() => {
  console.log("RTDB WORKS!");
  remove(testRef).then(() => process.exit(0));
}).catch(e => {
  console.error("RTDB FAILED", e.message);
  process.exit(1);
});
