import { 
  signInWithEmailAndPassword, 
  signOut,
  onAuthStateChanged 
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "./firebase";

// ── LOGIN (Firebase Auth only) ──
export const loginUser = async (email, password) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const fbUser = userCredential.user;

  // Fetch role/block info from Firestore user document
  const userDocRef = doc(db, "users", fbUser.uid);
  const isChief = fbUser.email.toLowerCase().includes("chief");
  const defaultUserData = {
    uid: fbUser.uid,
    email: fbUser.email,
    role: isChief ? "CDPO" : "Anganwadi Worker",
    name: isChief ? "Chief Officer" : fbUser.email.split("@")[0],
    block: "Coimbatore",
    anganwadi_id: isChief ? "ALL" : "AW-COIM-101"
  };

  let userDataObj = null;
  try {
    const userDoc = await getDoc(userDocRef);
    if (userDoc.exists()) {
      userDataObj = userDoc.data();
    }
  } catch (err) {
    console.warn("Could not fetch user document from Firestore (possibly insufficient permissions). Using default role.", err);
  }

  const userData = userDataObj
    ? { ...defaultUserData, ...userDataObj, uid: fbUser.uid }
    : defaultUserData;

  return userData;
};

// ── LOGOUT ──
export const logoutUser = async () => {
  await signOut(auth);
};

// ── AUTH STATE LISTENER ──
export const subscribeToAuthChanges = (callback) => {
  // Listen to Firebase auth state changes natively
  const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
    if (fbUser) {
      // Fetch role/block info from Firestore user document
      const userDocRef = doc(db, "users", fbUser.uid);
      const isChief = fbUser.email.toLowerCase().includes("chief");
      const defaultUserData = {
        uid: fbUser.uid,
        email: fbUser.email,
        role: isChief ? "CDPO" : "Anganwadi Worker",
        name: isChief ? "Chief Officer" : fbUser.email.split("@")[0],
        block: "Coimbatore",
        anganwadi_id: isChief ? "ALL" : "AW-COIM-101"
      };

      let userDataObj = null;
      try {
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          userDataObj = userDoc.data();
        }
      } catch (err) {
        console.warn("Could not fetch user document from Firestore (possibly insufficient permissions). Using default role.", err);
      }

      const userData = userDataObj
        ? { ...defaultUserData, ...userDataObj, uid: fbUser.uid }
        : defaultUserData;

      callback(userData);
    } else {
      callback(null);
    }
  });

  return unsubscribe;
};
