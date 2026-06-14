import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";

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
const db = getFirestore(app);

const testDoc = doc(db, 'test/123');

async function test() {
  await setDoc(testDoc, { hello: 'world' });
  console.log("Created doc");
  
  const res = await fetch(`https://firestore.googleapis.com/v1/projects/fictio-7fcc4/databases/(default)/documents/test/123`, {
    method: 'DELETE'
  });
  console.log("Delete status:", res.status);
  
  const snap = await getDoc(testDoc);
  console.log("Exists?", snap.exists());
  process.exit(0);
}
test();
