// firestore.js — Full file with getExamDashboardData added

// ── In-memory cache (يمنع re-fetching نفس البيانات في نفس الجلسة) ──
const _cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 دقائق

function cacheGet(key) {
  const entry = _cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL) { _cache.delete(key); return null; }
  return entry.data;
}
function cacheSet(key, data) { _cache.set(key, { data, ts: Date.now() }); return data; }
function cacheClear(prefix) { _cache.forEach((_, k) => { if (k.startsWith(prefix)) _cache.delete(k); }); }

import {
  db,
  collection, doc, setDoc, getDoc, getDocs,
  addDoc, updateDoc, deleteDoc,
  query, where, orderBy, limit,
  serverTimestamp, increment,
  arrayUnion, arrayRemove,
} from "../firebase";

// استيراد دالة توليد ID الشهادة من ملف pdfCertificate
import { generateCertId } from "../utils/pdfCertificate";

// ========== VENDORS ==========
export const getVendors = async () => {
  const cached = cacheGet("vendors:all");
  if (cached) return cached;
  try {
    const querySnapshot = await getDocs(collection(db, "vendors"));
    const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return cacheSet("vendors:all", data);
  } catch (error) {
    console.error("Error getting vendors:", error);
    throw error;
  }
};

export const createVendor = async (vendorData) => {
  try {
    const docRef = await addDoc(collection(db, "vendors"), {
      name: vendorData.name || "",
      logo: vendorData.logo || "🏢",
      image: vendorData.image || null,
      color: vendorData.color || "#3b82f6",
      tag: vendorData.tag || "",
      description: vendorData.description || "",
      suggestion: vendorData.suggestion || "",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error creating vendor:", error);
    throw error;
  }
};

export const updateVendor = async (vendorId, vendorData) => {
  try {
    await updateDoc(doc(db, "vendors", vendorId), {
      ...vendorData,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error updating vendor:", error);
    throw error;
  }
};

export const deleteVendor = async (vendorId) => {
  try {
    await deleteDoc(doc(db, "vendors", vendorId));
  } catch (error) {
    console.error("Error deleting vendor:", error);
    throw error;
  }
};

// ========== TOPICS ==========
export const getTopics = async () => {
  const cached = cacheGet("topics:all");
  if (cached) return cached;
  try {
    const querySnapshot = await getDocs(collection(db, "topics"));
    const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return cacheSet("topics:all", data);
  } catch (error) {
    console.error("Error getting topics:", error);
    throw error;
  }
};

export const createTopic = async (topicData) => {
  try {
    const docRef = await addDoc(collection(db, "topics"), {
      name: topicData.name || "",
      icon: topicData.icon || "📚",
      color: topicData.color || "#3b82f6",
      tag: topicData.tag || "",
      description: topicData.description || "",
      suggestion: topicData.suggestion || "",
      keywords: topicData.keywords || [],
      stats: topicData.stats || {
        jobs: "",
        growth: "",
        avgSalary: "",
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error creating topic:", error);
    throw error;
  }
};

export const updateTopic = async (topicId, topicData) => {
  try {
    await updateDoc(doc(db, "topics", topicId), {
      ...topicData,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error updating topic:", error);
    throw error;
  }
};

export const deleteTopic = async (topicId) => {
  try {
    await deleteDoc(doc(db, "topics", topicId));
  } catch (error) {
    console.error("Error deleting topic:", error);
    throw error;
  }
};

// ─── USERS ───────────────────────────────────────────────────────────────────
export async function createUserProfile(uid, data) {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  
  if (snap.exists()) {
    const existing = snap.data();
    await updateDoc(ref, {
      name: data.name || existing.name,
      email: data.email || existing.email,
      updatedAt: serverTimestamp(),
    });
  } else {
    await setDoc(ref, {
      ...data,
      role: "student",
      country: data.country || "Unknown",
      countryCode: data.countryCode || null,
      createdAt: serverTimestamp(),
      favorites: [],
      enrolledExams: [],
      stats: {
        totalAttempts: 0,
        totalPassed: 0,
        averageScore: 0,
      }
    });
  }
}

export async function getUserProfile(uid) {
  const snap = await getDoc(doc(db, "users", uid));
  if (snap.exists()) {
    const data = snap.data();
    return { id: snap.id, ...data };
  }
  return null;
}

export async function refreshUserRole(uid) {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? snap.data().role : "student";
}

export async function getAllUsers() {
  const snap = await getDocs(
    query(collection(db, "users"), orderBy("createdAt", "desc"))
  );
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function updateUserRole(uid, role) {
  await updateDoc(doc(db, "users", uid), { 
    role,
    updatedAt: serverTimestamp()
  });
}

export async function updateUserProfile(uid, data) {
  await updateDoc(doc(db, "users", uid), { 
    ...data, 
    updatedAt: serverTimestamp() 
  });
}

export async function addFavorite(userId, examId) {
  await setDoc(doc(db, "users", userId), 
    { favorites: arrayUnion(examId) }, 
    { merge: true }
  );
}

export async function removeFavorite(userId, examId) {
  await setDoc(doc(db, "users", userId), 
    { favorites: arrayRemove(examId) }, 
    { merge: true }
  );
}

export async function getFavorites(userId) {
  const snap = await getDoc(doc(db, "users", userId));
  return snap.exists() ? (snap.data().favorites || []) : [];
}

// ========== MERGE GUEST FAVORITES ==========
export async function mergeGuestFavorites(userId, guestFavIds) {
  if (!userId || !guestFavIds || guestFavIds.length === 0) {
    return [];
  }
  try {
    const currentFavs = await getFavorites(userId);
    const newFavs = guestFavIds.filter(id => !currentFavs.includes(id));
    if (newFavs.length === 0) return currentFavs;
    for (const examId of newFavs) {
      await addFavorite(userId, examId);
    }
    console.log(`Merged ${newFavs.length} guest favorites for user ${userId}`);
    return [...currentFavs, ...newFavs];
  } catch (error) {
    console.error("Error merging guest favorites:", error);
    throw error;
  }
}

export async function getCountryStats() {
  const snap = await getDocs(collection(db, "users"));
  const stats = {};
  
  snap.docs.forEach(doc => {
    const data = doc.data();
    const country = data.country || "Unknown";
    stats[country] = (stats[country] || 0) + 1;
  });
  
  return Object.entries(stats)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([country, count]) => ({ country, count }));
}

// ─── ENROLLMENT ─────────────────────────────────────────────────────────────
export async function enrollUserInExam(userId, examId) {
  try {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      enrolledExams: arrayUnion(examId),
    });
    return true;
  } catch (err) {
    console.error("Enrollment error:", err);
    throw err;
  }
}

export async function getEnrolledExams(userId) {
  try {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      return userSnap.data().enrolledExams || [];
    }
    return [];
  } catch (err) {
    console.error("Error fetching enrolled exams:", err);
    return [];
  }
}

export async function checkIfEnrolled(userId, examId) {
  try {
    const enrolledExams = await getEnrolledExams(userId);
    return enrolledExams.includes(examId);
  } catch (err) {
    console.error("Error checking enrollment:", err);
    return false;
  }
}

export async function unenrollUserFromExam(userId, examId) {
  try {
    console.log("🔍 Starting unenroll process...");
    
    console.log("📝 Step 1: Clearing progress...");
    try {
      await clearFlexExamsgress(userId, examId);
      console.log("✅ Progress cleared");
    } catch (clearErr) {
      console.warn("⚠️ Progress clear warning:", clearErr.message);
    }

    console.log("🔄 Step 2: Removing from enrolledExams...");
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      enrolledExams: arrayRemove(examId),
    });
    console.log("✅ Removed from enrolledExams");

    console.log("✨ Unenroll completed successfully");
    return true;
  } catch (err) {
    console.error("❌ Unenrollment error:", err);
    throw new Error(err.message || "Failed to unenroll from exam");
  }
}

// ─── EXAM PROGRESS ─────────────────────────────────────────────────────────────
export async function saveFlexExamsgress(userId, examId, progressData) {
  try {
    console.log("💾 Saving exam progress...", {
      userId,
      examId,
      part: progressData.currentPart,
      question: progressData.currentQuestion,
      answered: Object.keys(progressData.answers || {}).length,
    });

    const progressRef = doc(db, "users", userId, "FlexExamsgress", examId);
    
    const dataToSave = {
      examId,
      userId,
      currentPart: progressData.currentPart || 0,
      currentQuestion: progressData.currentQuestion || 0,
      answers: progressData.answers || {},
      flagged: progressData.flagged || {},
      revealed: progressData.revealed || {},
      totalParts: progressData.totalParts || 1,
      totalAnswered: Object.keys(progressData.answers || {}).length,
      timeLeft: progressData.timeLeft != null ? progressData.timeLeft : null,
      timestamp: new Date().toISOString(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(progressRef, dataToSave, { merge: true });
    
    console.log("✅ Progress saved successfully");
    return true;
  } catch (err) {
    console.error("❌ Error saving exam progress:", err);
    throw new Error(err.message || "Failed to save progress");
  }
}

export async function getFlexExamsgress(userId, examId) {
  try {
    console.log("📖 Loading exam progress...", { userId, examId });
    
    const progressRef = doc(db, "users", userId, "FlexExamsgress", examId);
    const progressSnap = await getDoc(progressRef);
    
    if (progressSnap.exists()) {
      const data = progressSnap.data();
      console.log("✅ Progress loaded:", {
        part: data.currentPart,
        question: data.currentQuestion,
        answered: data.totalAnswered,
      });
      return data;
    }
    
    console.log("ℹ️ No previous progress found");
    return null;
  } catch (err) {
    console.error("❌ Error fetching exam progress:", err);
    return null;
  }
}

export async function clearFlexExamsgress(userId, examId) {
  try {
    console.log("🗑️ Clearing exam progress...", { userId, examId });
    
    const progressRef = doc(db, "users", userId, "FlexExamsgress", examId);
    await deleteDoc(progressRef);
    
    console.log("✅ Progress cleared successfully");
    return true;
  } catch (err) {
    console.error("❌ Error clearing exam progress:", err);
    throw new Error(err.message || "Failed to clear progress");
  }
}

export async function getExamCompletionPercentage(userId, examId, totalQuestions) {
  try {
    const progress = await getFlexExamsgress(userId, examId);
    if (!progress || !progress.answers) return 0;
    
    const answeredCount = Object.keys(progress.answers).length;
    const percentage = Math.round((answeredCount / totalQuestions) * 100);
    
    console.log("📊 Completion:", { answered: answeredCount, total: totalQuestions, percentage });
    return percentage;
  } catch (err) {
    console.error("❌ Error calculating completion percentage:", err);
    return 0;
  }
}

// ─── EXAMS ───────────────────────────────────────────────────────────────────
export async function getExams() {
  const cached = cacheGet("exams:all");
  if (cached) return cached;
  const snap = await getDocs(
    query(collection(db, "exams"), orderBy("createdAt", "desc"))
  );
  const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  return cacheSet("exams:all", data);
}

export async function getExam(id) {
  const snap = await getDoc(doc(db, "exams", id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function createExam(data) {
  const ref = await addDoc(collection(db, "exams"), {
    ...data,
    vendor: data.vendor || "",
    topic: data.topic || "",
    attempts: 0,
    rating: 5.0,
    totalQuestions: 0,
    isActive: true,
    image: data.image || null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateExam(id, data) {
  const { category, ...cleanData } = data;
  await updateDoc(doc(db, "exams", id), {
    ...cleanData,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteExam(id) {
  await deleteDoc(doc(db, "exams", id));
  const qSnap = await getDocs(
    query(collection(db, "questions"), where("examId", "==", id))
  );
  await Promise.all(qSnap.docs.map(d => deleteDoc(d.ref)));
}

export async function incrementExamAttempts(examId) {
  await updateDoc(doc(db, "exams", examId), {
    attempts: increment(1),
    updatedAt: serverTimestamp(),
  });
}

// ✅ جذرية 1: دالة لجلب عدد المستخدمين المسجلين في الاختبار (candidates)
export async function getEnrolledCountForExam(examId) {
  try {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("enrolledExams", "array-contains", examId));
    const snapshot = await getDocs(q);
    return snapshot.size;
  } catch (error) {
    console.error("Error getting enrolled count:", error);
    return 0;
  }
}

// ─── QUESTIONS ───────────────────────────────────────────────────────────────
export async function getQuestions(examId) {
  const snap = await getDocs(
    query(
      collection(db, "questions"),
      where("examId", "==", examId),
      orderBy("order", "asc")
    )
  );
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function addQuestions(examId, questions) {
  const existing = await getQuestions(examId);
  let order = existing.length;
  await Promise.all(
    questions.map(q =>
      addDoc(collection(db, "questions"), {
        ...q,
        examId,
        order: order++,
        createdAt: serverTimestamp(),
      })
    )
  );
  await updateDoc(doc(db, "exams", examId), {
    totalQuestions: existing.length + questions.length,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteAllExamQuestions(examId) {
  const snap = await getDocs(
    query(collection(db, "questions"), where("examId", "==", examId))
  );
  await Promise.all(snap.docs.map(d => deleteDoc(d.ref)));
  await updateDoc(doc(db, "exams", examId), { 
    totalQuestions: 0,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteQuestion(questionId) {
  const questionRef = doc(db, "questions", questionId);
  const questionSnap = await getDoc(questionRef);
  if (!questionSnap.exists()) return;
  const examId = questionSnap.data().examId;
  
  await deleteDoc(questionRef);
  
  const remainingQuestions = await getQuestions(examId);
  await updateDoc(doc(db, "exams", examId), {
    totalQuestions: remainingQuestions.length,
    updatedAt: serverTimestamp(),
  });
}

// ─── RESULTS ─────────────────────────────────────────────────────────────────
export async function saveExamScore(userId, examId, scoreData) {
  try {
    console.log("💾 Saving exam score...", { userId, examId, score: scoreData?.score });
    
    const progressRef = doc(db, "users", userId, "FlexExamsgress", examId);
    const progressSnap = await getDoc(progressRef);
    
    let updateData = {
      lastAttemptAt: serverTimestamp(),
      totalAttempts: increment(1),
    };
    
    if (scoreData?.score !== undefined && scoreData.score !== null) {
      updateData.lastScore = scoreData.score;
    }
    if (scoreData?.pass !== undefined) {
      updateData.lastPass = scoreData.pass;
    }
    
    if (progressSnap.exists()) {
      const currentBest = progressSnap.data().bestScore || 0;
      if (scoreData?.score > currentBest) {
        updateData.bestScore = scoreData.score;
        console.log("🎉 New best score!", scoreData.score);
      }
    } else {
      if (scoreData?.score !== undefined && scoreData.score !== null) {
        updateData.bestScore = scoreData.score;
      }
      updateData.currentPart = 0;
      updateData.currentQuestion = 0;
      updateData.answers = {};
    }
    
    await setDoc(progressRef, updateData, { merge: true });
    console.log("✅ Exam score saved successfully");
    return true;
  } catch (error) {
    console.error("❌ Error saving exam score:", error);
    return false;
  }
}

export async function saveResult(data) {
  const ref = await addDoc(collection(db, "results"), {
    ...data,
    createdAt: serverTimestamp(),
  });
  
  if (data.userId && data.userId !== "guest") {
    const userRef = doc(db, "users", data.userId);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const stats = userSnap.data().stats || { totalAttempts: 0, totalPassed: 0, averageScore: 0 };
      const newTotal = stats.totalAttempts + 1;
      const newPassed = stats.totalPassed + (data.pass ? 1 : 0);
      const newAvg = Math.round((stats.averageScore * stats.totalAttempts + (data.score || 0)) / newTotal);
      
      await updateDoc(userRef, {
        stats: {
          totalAttempts: newTotal,
          totalPassed: newPassed,
          averageScore: newAvg,
        }
      });
      
      const finalScore = (data.score !== undefined && data.score !== null) 
        ? data.score 
        : (data.percentage || 0);
      
      await saveExamScore(data.userId, data.examId, {
        score: finalScore,
        pass: data.pass,
        correctAnswers: data.correct,
        totalQuestions: data.totalQuestions
      });
    }
  }
  
  // ✅ حفظ الشهادة إذا كان الاختبار في وضع المحاكاة والنتيجة نجاح
  if (data.mode === "examSimulation" && data.pass === true) {
    try {
      const certId = generateCertId();
      await saveCertificate({
        certId,
        userId: data.userId,
        userName: data.userName,
        examId: data.examId,
        examTitle: data.examTitle,
        score: data.score,
        date: data.date || new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
      });
      console.log("🎓 Certificate saved automatically for user", data.userId);
    } catch (certErr) {
      console.error("❌ Failed to save certificate:", certErr);
    }
  }
  
  return ref.id;
}

export async function getUserResults(userId) {
  const snap = await getDocs(
    query(
      collection(db, "results"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    )
  );
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getAllResults(limitCount = 200) {
  const snap = await getDocs(
    query(collection(db, "results"), orderBy("createdAt", "desc"), limit(limitCount))
  );
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getExamResults(examId) {
  const snap = await getDocs(
    query(collection(db, "results"), where("examId", "==", examId))
  );
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function deleteResult(id) {
  await deleteDoc(doc(db, "results", id));
}

// ─── ADMIN STATS ─────────────────────────────────────────────────────────────
export async function getAdminStats() {
  const [examsSnap, studentsSnap, resultsSnap, questionsSnap] = await Promise.all([
    getDocs(collection(db, "exams")),
    getDocs(query(collection(db, "users"), where("role", "==", "student"))),
    getDocs(collection(db, "results")),
    getDocs(collection(db, "questions")),
  ]);
  
  const results = resultsSnap.docs.map(d => d.data());
  const passed = results.filter(r => r.pass).length;
  
  return {
    totalExams: examsSnap.size,
    totalStudents: studentsSnap.size,
    totalAttempts: resultsSnap.size,
    totalQuestions: questionsSnap.size,
    passRate: results.length ? Math.round((passed / results.length) * 100) : 0,
  };
}

// ─── REPORTS ─────────────────────────────────────────────────────────────────
export async function submitQuestionReport(examId, questionId, userId, feedback, correctAnswer, questionText, userAnswer) {
  return await addDoc(collection(db, "reports"), {
    examId,
    questionId,
    userId,
    feedback,
    correctAnswer,
    questionText,
    userAnswer,
    status: "pending",
    createdAt: serverTimestamp(),
  });
}

export async function getReports() {
  const snap = await getDocs(
    query(collection(db, "reports"), where("status", "==", "pending"), orderBy("createdAt", "desc"))
  );
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getAllReports() {
  const snap = await getDocs(
    query(collection(db, "reports"), orderBy("createdAt", "desc"))
  );
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function updateReportStatus(reportId, status) {
  await updateDoc(doc(db, "reports", reportId), {
    status,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteReport(reportId) {
  await deleteDoc(doc(db, "reports", reportId));
}

// ─── USER EXAM SCORES & BEST SCORE ─────────────────────────────────────────
export async function getUserBestScore(userId, examId) {
  try {
    console.log("📊 Fetching user best score...", { userId, examId });
    
    const progressRef = doc(db, "users", userId, "FlexExamsgress", examId);
    const progressSnap = await getDoc(progressRef);
    
    if (progressSnap.exists()) {
      const data = progressSnap.data();
      if (data.bestScore !== undefined && data.bestScore !== null) {
        console.log("✅ Found bestScore in FlexExamsgress:", data.bestScore);
        return data.bestScore;
      }
      if (data.lastScore !== undefined && data.lastScore !== null) {
        console.log("✅ Found lastScore in FlexExamsgress:", data.lastScore);
        return data.lastScore;
      }
    }
    
    const resultsRef = collection(db, "results");
    const q = query(
      resultsRef, 
      where("userId", "==", userId), 
      where("examId", "==", examId),
      orderBy("score", "desc"),
      limit(1)
    );
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const bestResult = querySnapshot.docs[0].data();
      const bestScore = bestResult.score || bestResult.percentage;
      console.log("✅ Found best score in results:", bestScore);
      return bestScore;
    }
    
    console.log("ℹ️ No previous score found for this exam");
    return null;
  } catch (error) {
    console.error("❌ Error getting user best score:", error);
    return null;
  }
}

// ✅ جذرية 2: دالة محسنة لجلب آخر سكور للمستخدم في اختبار معين
export async function getUserLastScore(userId, examId) {
  try {
    console.log("📊 Fetching user last score...", { userId, examId });
    
    // أولاً: جلب من FlexExamsgress
    const progressRef = doc(db, "users", userId, "FlexExamsgress", examId);
    const progressSnap = await getDoc(progressRef);
    
    if (progressSnap.exists()) {
      const data = progressSnap.data();
      if (data.lastScore !== undefined && data.lastScore !== null) {
        console.log("✅ Found lastScore in FlexExamsgress:", data.lastScore);
        return data.lastScore;
      }
    }
    
    // ثانياً: جلب آخر نتيجة من results
    const resultsRef = collection(db, "results");
    const q = query(
      resultsRef,
      where("userId", "==", userId),
      where("examId", "==", examId),
      orderBy("createdAt", "desc"),
      limit(1)
    );
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const lastResult = querySnapshot.docs[0].data();
      const lastScore = lastResult.score || lastResult.percentage;
      console.log("✅ Found last score in results:", lastScore);
      return lastScore;
    }
    
    console.log("ℹ️ No last score found for this exam");
    return null;
  } catch (error) {
    console.error("❌ Error getting user last score:", error);
    return null;
  }
}

// ✅ جذرية 3: دالة محسنة لجلب إحصائيات كاملة للمستخدم في اختبار
export async function getUserExamStats(userId, examId) {
  try {
    const stats = {
      bestScore: null,
      lastScore: null,
      totalAttempts: 0,
      lastAttemptAt: null,
      completionPercentage: 0
    };
    
    // من FlexExamsgress
    const progressRef = doc(db, "users", userId, "FlexExamsgress", examId);
    const progressSnap = await getDoc(progressRef);
    
    if (progressSnap.exists()) {
      const data = progressSnap.data();
      stats.bestScore = data.bestScore || null;
      stats.lastScore = data.lastScore || null;
      stats.totalAttempts = data.totalAttempts || 0;
      stats.lastAttemptAt = data.lastAttemptAt || null;
    }
    
    // إذا لم نجد lastScore في progress، نحاول من results
    if (!stats.lastScore) {
      const lastScoreFromResults = await getUserLastScore(userId, examId);
      if (lastScoreFromResults) stats.lastScore = lastScoreFromResults;
    }
    
    // نسبة الإكمال من آخر نتيجة
    const resultsRef = collection(db, "results");
    const q = query(
      resultsRef,
      where("userId", "==", userId),
      where("examId", "==", examId),
      orderBy("createdAt", "desc"),
      limit(1)
    );
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const lastResult = querySnapshot.docs[0].data();
      stats.completionPercentage = lastResult.completionPercentage || 
        (lastResult.correctAnswers / lastResult.totalQuestions) * 100 || 0;
    }
    
    console.log("📊 User exam stats:", stats);
    return stats;
  } catch (error) {
    console.error("❌ Error getting user exam stats:", error);
    return { bestScore: null, lastScore: null, totalAttempts: 0, lastAttemptAt: null, completionPercentage: 0 };
  }
}

// ─── CERTIFICATES ───────────────────────────────────────────────────────────
export async function saveCertificate({ certId, userId, userName, examId, examTitle, score, date }) {
  try {
    const certRef = doc(db, "certificates", certId);
    const snap = await getDoc(certRef);

    if (snap.exists()) return certId;

    await setDoc(certRef, {
      certId,
      userId:    userId    || "",
      userName:  userName  || "Valued Candidate",
      examId:    examId    || "",
      examTitle: examTitle || "Professional Certification Exam",
      score:     score     ?? 0,
      date:      date      || new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
      issuedAt:  serverTimestamp(),
    });

    console.log("✅ Certificate saved:", certId);
    return certId;
  } catch (err) {
    console.error("❌ Error saving certificate:", err);
    throw err;
  }
}

export async function getUserCertificates(userId) {
  try {
    const q = query(collection(db, "certificates"), where("userId", "==", userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error getting user certificates:", error);
    return [];
  }
}

export async function getUserCertificateForExam(userId, examId) {
  try {
    const q = query(
      collection(db, "certificates"),
      where("userId", "==", userId),
      where("examId", "==", examId)
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
  } catch (error) {
    console.error("Error getting certificate for exam:", error);
    return null;
  }
}

// ======================
// ✅ NEW: Merged dashboard data function (reduces reads)
// ======================
export async function getExamDashboardData(userId, examId, options = {}) {
  const { signal } = options;
  
  try {
    // Run all queries in parallel for maximum performance
    const [
      enrolledStatus,
      bestScore,
      stats,
      savedProgress,
      userCertificate,
      enrolledCount,
      examDoc
    ] = await Promise.all([
      checkIfEnrolled(userId, examId),
      getUserBestScore(userId, examId),
      getUserExamStats(userId, examId),
      getFlexExamsgress(userId, examId),
      getUserCertificateForExam(userId, examId),
      getEnrolledCountForExam(examId),
      getExam(examId)
    ]);

    return {
      isEnrolled: enrolledStatus,
      bestScore: bestScore,
      lastScore: stats?.lastScore || null,
      attemptsCount: examDoc?.attempts || 0,
      enrolledCount: enrolledCount,
      userCertificate: userCertificate,
      savedProgress: savedProgress,
      enrolling: false,
      unenrolling: false,
    };
  } catch (error) {
    if (error.name === "AbortError") {
      console.log("Dashboard data fetch aborted");
      throw error;
    }
    console.error("Error fetching exam dashboard data:", error);
    // Return default values on error
    return {
      isEnrolled: false,
      bestScore: null,
      lastScore: null,
      attemptsCount: 0,
      enrolledCount: 0,
      userCertificate: null,
      savedProgress: null,
      enrolling: false,
      unenrolling: false,
    };
  }
}
