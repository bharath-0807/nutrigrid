import { 
  signInWithEmailAndPassword, 
  signOut,
  onAuthStateChanged 
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "./firebase";

// We'll map email addresses to our demo users. 
// e.g. "worker1@nutrigrid.in" -> "icds123"
// Wait, we need to quickly bootstrap the user's Firestore with these roles if they don't exist yet!

export const loginUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Fetch user role stats from Firestore
    const userDocRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      return { ...userDoc.data(), uid: user.uid };
    } else {
      // Temporary fallback for demo purposes if the document isn't created yet
      console.warn("User document not found in Firestore. Using fallback.");
      return { 
        uid: user.uid,
        email: user.email,
        role: "Anganwadi Worker",
        name: user.email.split('@')[0],
        block: "Demo Block"
      };
    }
  } catch (error) {
    throw error;
  }
};

export const logoutUser = () => {
  return signOut(auth);
};

export const subscribeToAuthChanges = (callback) => {
  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        callback({ ...userDoc.data(), uid: user.uid });
      } else {
        callback({ 
          uid: user.uid,
          email: user.email,
          role: "Anganwadi Worker",
          name: user.email.split('@')[0],
          block: "Demo Block"
        });
      }
    } else {
      callback(null);
    }
  });
};
