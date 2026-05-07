import { 
  collection, 
  doc, 
  setDoc, 
  onSnapshot, 
  query, 
  orderBy,
  serverTimestamp,
  where
} from "firebase/firestore";
import { db } from "./firebase";
import { INIT_CHILDREN } from "../data/clinicalConfig";

const childrenCollectionRef = collection(db, "children");

// Subscribe to real-time children updates with Role-Based Access Control
export const subscribeToChildren = (user, callback) => {
  if (!user) return () => {};

  let q;
  if (user.role === "CDPO") {
    // CDPO (Chief) sees all children in the block
    q = query(childrenCollectionRef, orderBy("createdAt", "desc"));
  } else {
    // Anganwadi Worker sees only their specific center
    const awId = user.anganwadi_id || "AW-COIM-101"; // Fallback to demo ID
    q = query(childrenCollectionRef, where("anganwadi_id", "==", awId), orderBy("createdAt", "desc"));
  }
  
  return onSnapshot(q, (snapshot) => {
    const childrenList = [];
    snapshot.forEach((docSnap) => {
      childrenList.push({ id: docSnap.id, ...docSnap.data() });
    });
    
    // Optional fallback message
    if (childrenList.length === 0) {
      console.log("No children found for this Anganwadi. Fallback to Init Data manually if needed.");
      callback([]); 
    } else {
      callback(childrenList);
    }
  }, (error) => {
    console.error("Error subscribing to children:", error.message);
  });
};

// Add a new child record
export const saveChildToFirebase = async (child) => {
  // Use the child's ID as the document ID or let Firebase generate one
  const docId = child.id ? child.id.toString() : Date.now().toString();
  const docRef = doc(db, "children", docId);
  
  try {
    await setDoc(docRef, {
      ...child,
      createdAt: serverTimestamp()
    }, { merge: true }); // Merge true allows updating existing children nicely
    console.log("Child saved to Firebase successfully");
  } catch (error) {
    console.error("Error saving child to Firebase:", error.message);
    throw error;
  }
};

// Bulk upload initial data (Utility function for the first run)
export const seedInitialData = async () => {
  try {
    console.log("Seeding initial data...");
    for (const child of INIT_CHILDREN) {
      await saveChildToFirebase(child);
    }
    console.log("Successfully seeded initial data");
  } catch (e) {
    console.error("Error seeding initial data:", e);
    throw e;
  }
};
