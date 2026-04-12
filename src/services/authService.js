import { 
  signInWithEmailAndPassword, 
  signOut,
  onAuthStateChanged 
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "./firebase";
import { AUTH_USERS } from "../data/authUsers";

// ── SESSION MANAGEMENT ──
// We use sessionStorage so that refreshing keeps the user logged in,
// but closing the tab/browser clears the session.
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

// ── LOGIN ──
// Tries Firebase Auth first. If the Firebase API key is invalid or
// the user hasn't been created in Firebase Auth, falls back to the
// local AUTH_USERS demo credentials.
export const loginUser = async (email, password) => {
  // Extract username from email (e.g. "worker1@nutrigrid.in" → "worker1")
  const username = email.includes("@") ? email.split("@")[0] : email;

  // 1. Try Firebase Auth first
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const fbUser = userCredential.user;

    const userDocRef = doc(db, "users", fbUser.uid);
    const userDoc = await getDoc(userDocRef);

    const userData = userDoc.exists()
      ? { ...userDoc.data(), uid: fbUser.uid }
      : {
          uid: fbUser.uid,
          email: fbUser.email,
          role: "Anganwadi Worker",
          name: fbUser.email.split("@")[0],
          block: "Demo Block",
        };

    saveSession(userData);
    return userData;
  } catch (firebaseErr) {
    console.warn("Firebase Auth failed, falling back to local credentials:", firebaseErr.code);
  }

  // 2. Fallback — match against local AUTH_USERS
  const match = AUTH_USERS.find(
    (u) => (u.username === username || u.username === email) && u.password === password
  );

  if (match) {
    const userData = {
      uid: match.id,
      email: `${match.username}@nutrigrid.in`,
      role: match.role,
      name: match.name,
      block: match.block,
    };
    saveSession(userData);
    return userData;
  }

  throw new Error("Invalid credentials. Check your username and password.");
};

// ── LOGOUT ──
export const logoutUser = async () => {
  saveSession(null);
  try {
    await signOut(auth);
  } catch {
    // Firebase sign-out may fail if API key is bad — that's fine,
    // we already cleared the local session above.
  }
};

// ── AUTH STATE LISTENER ──
// On mount this checks for an existing session.
// Firebase's onAuthStateChanged also fires, but we gate on sessionStorage
// so that users who explicitly signed out don't get auto-logged-in.
export const subscribeToAuthChanges = (callback) => {
  // Immediately check sessionStorage for an existing session
  const cached = getSession();
  if (cached) {
    callback(cached);
  }

  // Also listen to Firebase auth changes (for real Firebase users)
  const unsubscribe = onAuthStateChanged(auth, async (user) => {
    if (user) {
      // Only auto-login from Firebase if we already have a session
      // (prevents the "reload → skips login" problem)
      const existing = getSession();
      if (existing) {
        // Session already restored above, no need to callback again
        return;
      }
      // If there's a Firebase user but no session, it means the user
      // previously signed out but Firebase still has a cached token.
      // Don't auto-login — force them through the login page.
    } else {
      // Firebase says no user — clear session if any
      const existing = getSession();
      if (existing) {
        saveSession(null);
        callback(null);
      }
    }
  });

  return unsubscribe;
};
