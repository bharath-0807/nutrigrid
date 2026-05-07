// Quick script to create Firebase Auth users for NutriGrid
// Run once: node src/scripts/createUsers.mjs

import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAOokqlvstifOBhSqeqN7fMqrtqGpaHm5k",
  authDomain: "nutrigrid-d82d5.firebaseapp.com",
  projectId: "nutrigrid-d82d5",
  storageBucket: "nutrigrid-d82d5.firebasestorage.app",
  messagingSenderId: "651495439696",
  appId: "1:651495439696:web:8b84cd1c0f26cfac4cc055",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const USERS = [
  { email: "worker@nutrigrid.in", password: "nutrigrid123" },
  { email: "worker2@nutrigrid.in", password: "nutrigrid123" },
  { email: "chief@nutrigrid.in", password: "nutrigrid123" },
];

async function createAll() {
  for (const u of USERS) {
    try {
      const cred = await createUserWithEmailAndPassword(auth, u.email, u.password);
      console.log(`✅ Created: ${u.email} (uid: ${cred.user.uid})`);
    } catch (err) {
      if (err.code === "auth/email-already-in-use") {
        console.log(`⏩ Already exists: ${u.email}`);
      } else {
        console.error(`❌ Failed: ${u.email} — ${err.message}`);
      }
    }
  }
  console.log("\nDone! You can now log in with these accounts.");
  process.exit(0);
}

createAll();
