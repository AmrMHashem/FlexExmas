// firebase.js — FlexExams Firebase Configuration
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
