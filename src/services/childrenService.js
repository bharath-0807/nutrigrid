import { 
  collection, 
  doc, 
  setDoc, 
  onSnapshot, 
  query, 
  orderBy,
  serverTimestamp 
} from "firebase/firestore";
import { db } from "./firebase";
import { INIT_CHILDREN } from "../data/clinicalConfig";

const childrenCollectionRef = collection(db, "children");

// Subscribe to real-time children updates
export const subscribeToChildren = (callback) => {
  const q = query(childrenCollectionRef, orderBy("createdAt", "desc"));
  
  return onSnapshot(q, (snapshot) => {
    const childrenList = [];
    snapshot.forEach((docSnap) => {
      childrenList.push({ id: docSnap.id, ...docSnap.data() });
    });
    
    // If no children in Firebase, we can optionally return the INIT_CHILDREN for demo purposes
    if (childrenList.length === 0) {
      console.log("No children in Firestore yet. Fallback to Init Data manually if needed.");
      callback([]); // Returning empty list so we can see when it truly syncs
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
  }
};
