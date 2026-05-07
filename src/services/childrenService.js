import { 
  collection, 
  doc, 
  setDoc, 
  getDocs,
  onSnapshot, 
  query, 
  serverTimestamp,
  where
} from "firebase/firestore";
import { db } from "./firebase";
import { INIT_CHILDREN } from "../data/clinicalConfig";

const childrenCollectionRef = collection(db, "children");

// Subscribe to real-time children updates with Role-Based Access Control
export const subscribeToChildren = (user, callback) => {
  if (!user) return () => {};

  // Use a simple unfiltered query to avoid Firestore composite index requirements.
  // We filter client-side based on the user's role and anganwadi_id.
  const q = query(childrenCollectionRef);
  
  return onSnapshot(q, (snapshot) => {
    const allChildren = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (data.records && data.records.length > 0) {
        allChildren.push({ id: docSnap.id, ...data });
      }
    });

    let filtered;
    if (user.role === "CDPO") {
      // CDPO sees ALL children across all Anganwadis
      filtered = allChildren;
    } else {
      // Worker sees ONLY their center's children
      const awId = user.anganwadi_id || "AW-COIM-101";
      filtered = allChildren.filter(c => c.anganwadi_id === awId);
    }
    
    // Sort alphabetically by name
    filtered.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    callback(filtered);
  }, (error) => {
    console.error("Firestore subscription error:", error.message);
    callback([]);
  });
};

// Add/update a child record in Firebase
export const saveChildToFirebase = async (child) => {
  const docId = child.id ? child.id.toString() : Date.now().toString();
  const docRef = doc(db, "children", docId);
  
  try {
    await setDoc(docRef, {
      ...child,
      createdAt: serverTimestamp()
    }, { merge: true });
    console.log("Child saved:", child.name || docId);
  } catch (error) {
    console.error("Error saving child:", error.message);
    throw error;
  }
};

// Seed all demo children into Firestore (checks if already seeded)
export const seedInitialData = async () => {
  try {
    // Check if data already exists
    const snapshot = await getDocs(childrenCollectionRef);
    if (snapshot.size >= INIT_CHILDREN.length) {
      console.log("Database already seeded (" + snapshot.size + " records). Skipping.");
      return;
    }
    
    console.log("Seeding " + INIT_CHILDREN.length + " children...");
    const promises = INIT_CHILDREN.map(child => saveChildToFirebase(child));
    await Promise.all(promises);
    console.log("Seed complete.");
  } catch (e) {
    console.error("Seed error:", e);
    throw e;
  }
};
