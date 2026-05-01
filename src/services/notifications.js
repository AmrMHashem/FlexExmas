// services/vendors.js
import { db } from './firebase';
import { collection, getDocs, doc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';

const VENDORS_COLLECTION = 'vendors';

export async function getVendors() {
  const snapshot = await getDocs(collection(db, VENDORS_COLLECTION));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function createVendor(data) {
  const docRef = await addDoc(collection(db, VENDORS_COLLECTION), data);
  return { id: docRef.id, ...data };
}

export async function updateVendor(id, data) {
  await updateDoc(doc(db, VENDORS_COLLECTION, id), data);
}

export async function deleteVendor(id) {
  await deleteDoc(doc(db, VENDORS_COLLECTION, id));
}