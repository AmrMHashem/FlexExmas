// firebase.js — FlexExams Firebase Configuration
// ✅ Offline persistence enabled
// ✅ Firestore quota-exceeded fallback handler

import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from "firebase/auth";
import {
  getFirestore,
  enableIndexedDbPersistence,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  increment,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCHbNx6tveBKqN3BwKzK8Ap23d8DHmUSGs",
  authDomain: "exampro-1e4de.firebaseapp.com",
  projectId: "exampro-1e4de",
  storageBucket: "exampro-1e4de.firebasestorage.app",
  messagingSenderId: "488051861020",
  appId: "1:488051861020:web:75dda5453ee0afa59261d9",
  measurementId: "G-EM2PEBT7RD",
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// ── Offline Persistence (reduces reads on revisit from cache) ─────────────
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === "failed-precondition") {
    // Multiple tabs open — persistence only works in one tab at a time
    console.warn("[Firestore] Persistence unavailable: multiple tabs open.");
  } else if (err.code === "unimplemented") {
    // Browser doesn't support it
    console.warn("[Firestore] Persistence not supported by this browser.");
  }
});

// ── Quota-Exceeded Global Handler ─────────────────────────────────────────
// If Firestore quota is exceeded, show a maintenance banner instead of crashing
window.__firestoreQuotaExceeded = false;

const _originalGetDocs = getDocs;
const _originalGetDoc  = getDoc;

// We patch at module level via a global flag — components check this flag
// before rendering to show a fallback UI (handled in App.jsx)
export function isFirestoreQuotaExceeded() {
  return window.__firestoreQuotaExceeded === true;
}

export function markQuotaExceeded() {
  window.__firestoreQuotaExceeded = true;
  // Dispatch global event so any component can react
  window.dispatchEvent(new CustomEvent("firestore:quota-exceeded"));
}

export {
  app,
  analytics,
  auth,
  db,
  storage,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  increment,
  arrayUnion,
  arrayRemove,
  ref,
  uploadBytes,
  getDownloadURL,
};
