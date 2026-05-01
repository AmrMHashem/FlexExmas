// scripts/makeAdmin.js
// Run ONCE after registering your account:
// node scripts/makeAdmin.js your@email.com

import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

// ⚠️  Replace with your service account key path
// Download from: Firebase Console → Project Settings → Service accounts
const serviceAccount = require("../service-account.json");

initializeApp({ credential: cert(serviceAccount) });

const db  = getFirestore();
const auth = getAuth();

const email = process.argv[2];
if (!email) { console.error("Usage: node makeAdmin.js <email>"); process.exit(1); }

async function run() {
  try {
    const user = await auth.getUserByEmail(email);
    await db.collection("users").doc(user.uid).update({ role: "admin" });
    console.log(`✅ ${email} is now Admin (uid: ${user.uid})`);
  } catch (e) {
    console.error("❌ Error:", e.message);
  }
  process.exit(0);
}

run();
