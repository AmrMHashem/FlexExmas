// src/services/contactService.js
import { db } from "../firebase";
import {
  collection,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  deleteDoc,
  addDoc,
  query,
  orderBy,
  setDoc,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { sendNotification } from "./payment";

const COLLECTION = "contactMessages";

// إرسال رسالة جديدة من صفحة الاتصال
export const sendContactMessage = async (data) => {
  try {
    const docRef = await addDoc(collection(db, COLLECTION), {
      ...data,
      status: "pending", // pending, read, replied, closed
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      isFromUser: !!data.userId, // true if logged in
    });
    return { id: docRef.id, success: true };
  } catch (error) {
    console.error("Error sending contact message:", error);
    throw error;
  }
};

// جلب جميع رسائل الاتصال (للأدمن)
export const getAllContactMessages = async () => {
  try {
    const q = query(collection(db, COLLECTION), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    const messages = [];
    snapshot.forEach((doc) => {
      messages.push({ id: doc.id, ...doc.data() });
    });
    return messages;
  } catch (error) {
    console.error("Error fetching contact messages:", error);
    return [];
  }
};

// تحديث حالة الرسالة (مقروءة، تم الرد، الخ)
export const updateContactStatus = async (messageId, status, adminNote = "") => {
  try {
    const messageRef = doc(db, COLLECTION, messageId);
    await updateDoc(messageRef, {
      status: status,
      adminNote: adminNote,
      updatedAt: serverTimestamp(),
    });
    return true;
  } catch (error) {
    console.error("Error updating contact status:", error);
    throw error;
  }
};

// حذف رسالة
export const deleteContactMessage = async (messageId) => {
  try {
    await deleteDoc(doc(db, COLLECTION, messageId));
    return true;
  } catch (error) {
    console.error("Error deleting contact message:", error);
    throw error;
  }
};

// الرد على رسالة عضو (إرسال إشعار)
export const replyToContactMessage = async (messageId, userId, replyText, adminName = "Admin") => {
  try {
    // 1. تحديث حالة الرسالة إلى "replied"
    const messageRef = doc(db, COLLECTION, messageId);
    await updateDoc(messageRef, {
      status: "replied",
      adminReply: replyText,
      adminRepliedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // 2. إرسال إشعار للمستخدم (إذا كان مسجلاً)
    if (userId) {
      await sendNotification(userId, {
        type: "contact_reply",
        title: `📩 رد من فريق الدعم (${adminName})`,
        body: replyText.length > 100 ? replyText.substring(0, 100) + "..." : replyText,
        data: {
          messageId: messageId,
          replyText: replyText,
          adminName: adminName,
          timestamp: Date.now(),
        },
      });
    }
    return true;
  } catch (error) {
    console.error("Error replying to contact message:", error);
    throw error;
  }
};

// جلب رسائل التواصل الخاصة بمستخدم معين (لصفحة "My Tickets" مستقبلاً)
export const getUserContactMessages = async (userId) => {
  try {
    const q = query(collection(db, COLLECTION), where("userId", "==", userId), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    const messages = [];
    snapshot.forEach((doc) => {
      messages.push({ id: doc.id, ...doc.data() });
    });
    return messages;
  } catch (error) {
    console.error("Error fetching user contact messages:", error);
    return [];
  }
};