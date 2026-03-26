import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAOokqlvstif0BhSgeqn7fMqrtqGpaHm5k",
  authDomain: "nutrigrid-d82d5.firebaseapp.com",
  projectId: "nutrigrid-d82d5",
  storageBucket: "nutrigrid-d82d5.firebasestorage.app",
  messagingSenderId: "651495439696",
  appId: "1:651495439696:web:8b84cd1c0f26cfac4cc055",
  measurementId: "G-H0JG4FCY4K"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth
export const auth = getAuth(app);

// Initialize Firestore
export const db = getFirestore(app);

// Enable offline persistence (crucial for PWA)
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    // Multiple tabs open, persistence can only be enabled in one tab at a a time.
    console.warn("Firebase persistence offline mode: multiple tabs open.");
  } else if (err.code === 'unimplemented') {
    // The current browser does not support all of the features required to enable persistence
    console.warn("Firebase persistence offline mode: browser not supported.");
  }
});
