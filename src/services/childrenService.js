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
    // CDPO (Chief) sees ALL children across all Anganwadis
    q = query(childrenCollectionRef);
  } else {
    // Anganwadi Worker sees ONLY their specific center's children
    const awId = user.anganwadi_id || "AW-COIM-101";
    q = query(childrenCollectionRef, where("anganwadi_id", "==", awId));
  }
  
  return onSnapshot(q, (snapshot) => {
    const childrenList = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      // Only include docs that have valid records
      if (data.records && data.records.length > 0) {
        childrenList.push({ id: docSnap.id, ...data });
      }
    });
    
    // Sort by name client-side to avoid needing a composite Firestore index
    childrenList.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    callback(childrenList);
  }, (error) => {
    console.error("Error subscribing to children:", error.message);
    // If index error, fall back to unfiltered query
    if (error.message.includes("index")) {
      console.warn("Firestore index missing. Falling back to local filter.");
      const fallbackQ = query(childrenCollectionRef);
      return onSnapshot(fallbackQ, (snapshot) => {
        const list = [];
        const awId = user.anganwadi_id || "AW-COIM-101";
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          if (data.records && data.records.length > 0) {
            if (user.role === "CDPO" || data.anganwadi_id === awId) {
              list.push({ id: docSnap.id, ...data });
            }
          }
        });
        list.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
        callback(list);
      });
    }
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
    console.log("Child saved to Firebase:", child.name || docId);
  } catch (error) {
    console.error("Error saving child to Firebase:", error.message);
    throw error;
  }
};

// Seed all demo children into Firestore
export const seedInitialData = async () => {
  try {
    console.log("Seeding initial data (" + INIT_CHILDREN.length + " children)...");
    const promises = INIT_CHILDREN.map(child => saveChildToFirebase(child));
    await Promise.all(promises);
    console.log("Successfully seeded " + INIT_CHILDREN.length + " children");
  } catch (e) {
    console.error("Error seeding initial data:", e);
    throw e;
  }
};
