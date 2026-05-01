import { db, collection, doc, setDoc, getDoc, deleteDoc, arrayUnion, arrayRemove } from "../firebase";

export async function addFavorite(userId, examId) {
  const ref = doc(db, "users", userId);
  await setDoc(ref, { favorites: arrayUnion(examId) }, { merge: true });
}

export async function removeFavorite(userId, examId) {
  const ref = doc(db, "users", userId);
  await setDoc(ref, { favorites: arrayRemove(examId) }, { merge: true });
}

export async function getFavorites(userId) {
  const snap = await getDoc(doc(db, "users", userId));
  return snap.exists() ? (snap.data().favorites || []) : [];
}

export async function isFavorite(userId, examId) {
  const favorites = await getFavorites(userId);
  return favorites.includes(examId);
}
