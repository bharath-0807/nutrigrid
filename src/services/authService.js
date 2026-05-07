import { 
  signInWithEmailAndPassword, 
  signOut,
  onAuthStateChanged 
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "./firebase";

// ── SESSION MANAGEMENT ──
// sessionStorage keeps session within the tab; closing browser clears it.
const SESSION_KEY = "nutrigrid_user";

function saveSession(user) {
  if (user) {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
  } else {
    sessionStorage.removeItem(SESSION_KEY);
  }
}

function getSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// ── LOGIN (Firebase Auth only) ──
export const loginUser = async (email, password) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const fbUser = userCredential.user;

  // Fetch role/block info from Firestore user document
  const userDocRef = doc(db, "users", fbUser.uid);
  const userDoc = await getDoc(userDocRef);

  const isChief = fbUser.email.toLowerCase().includes("chief");
  const defaultUserData = {
    uid: fbUser.uid,
    email: fbUser.email,
    role: isChief ? "CDPO" : "Anganwadi Worker",
    name: isChief ? "Chief Officer" : fbUser.email.split("@")[0],
    block: "Coimbatore",
    anganwadi_id: isChief ? "ALL" : "AW-COIM-101"
  };

  const userData = userDoc.exists()
    ? { ...defaultUserData, ...userDoc.data(), uid: fbUser.uid }
    : defaultUserData;

  saveSession(userData);
  return userData;
};

// ── LOGOUT ──
export const logoutUser = async () => {
  saveSession(null);
  await signOut(auth);
};

// ── AUTH STATE LISTENER ──
export const subscribeToAuthChanges = (callback) => {
  // Check sessionStorage first for existing session
  const cached = getSession();
  if (cached) {
    callback(cached);
  }

  // Listen to Firebase auth state changes
  const unsubscribe = onAuthStateChanged(auth, async (user) => {
    if (user) {
      const existing = getSession();
      if (existing) return; // Already restored above

      // Firebase has a cached user but no session — don't auto-login
    } else {
      const existing = getSession();
      if (existing) {
        saveSession(null);
        callback(null);
      }
    }
  });

  return unsubscribe;
};
