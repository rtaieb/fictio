import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, deleteDoc } from "firebase/firestore";

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

async function deleteAllRooms() {
  console.log("Fetching rooms...");
  const roomsSnapshot = await getDocs(collection(db, "rooms"));
  console.log(`Found ${roomsSnapshot.size} rooms to delete.`);

  for (const roomDoc of roomsSnapshot.docs) {
    const roomId = roomDoc.id;
    console.log(`Deleting players for room ${roomId}...`);
    
    // Fetch and delete all players in this room
    const playersSnapshot = await getDocs(collection(db, `rooms/${roomId}/players`));
    for (const playerDoc of playersSnapshot.docs) {
        await deleteDoc(doc(db, `rooms/${roomId}/players`, playerDoc.id));
    }
    
    // Delete the room document
    await deleteDoc(doc(db, "rooms", roomId));
    console.log(`Room ${roomId} deleted.`);
  }

  console.log("All rooms have been deleted.");
  process.exit(0);
}

deleteAllRooms().catch(console.error);
