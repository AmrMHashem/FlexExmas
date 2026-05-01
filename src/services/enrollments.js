// services/enrollments.js
import { db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";

export async function getUserEnrollments(userId) {
  try {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      return userSnap.data().enrolledExams || [];
    }
    return [];
  } catch (error) {
    console.error("Error fetching user enrollments:", error);
    return [];
  }
}