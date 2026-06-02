// firestore.js — FlexExams v6.0 — Zero-Waste Firebase Edition
// ✅ Memory cache + sessionStorage cache with TTL
// ✅ Request deduplication (in-flight promises)
// ✅ limit() on all heavy queries
// ✅ Quota-exceeded error handler
// ✅ No onSnapshot anywhere
// ✅ Minimal reads — batch wherever possible

import {
  db,
  collection, doc, setDoc, getDoc, getDocs,
  addDoc, updateDoc, deleteDoc,
  query, where, orderBy, limit,
  serverTimestamp, increment,
  arrayUnion, arrayRemove,
  markQuotaExceeded,
} from "../firebase";

import { generateCertId } from "../utils/pdfCertificate";
import { sendNotification } from "./payment";

// ======================
// CACHE LAYER
// ======================
const _mem = new Map();         // memory cache (tab-lifetime)
const _inFlight = new Map();    // in-flight deduplication

const TTL = {
  exams:    10 * 60 * 1000,  // 10 min  — public, rarely changes
  vendors:  15 * 60 * 1000,  // 15 min
  topics:   15 * 60 * 1000,  // 15 min
  user:      5 * 60 * 1000,  // 5 min
  results:   3 * 60 * 1000,  // 3 min
  notifs:    2 * 60 * 1000,  // 2 min
  lb:        5 * 60 * 1000,  // 5 min  — leaderboard
  progress:  1 * 60 * 1000,  // 1 min
  default:   5 * 60 * 1000,
};

function getTTL(key) {
  if (key.startsWith("exams"))    return TTL.exams;
  if (key.startsWith("vendors"))  return TTL.vendors;
  if (key.startsWith("topics"))   return TTL.topics;
  if (key.startsWith("user"))     return TTL.user;
  if (key.startsWith("results"))  return TTL.results;
  if (key.startsWith("notifs"))   return TTL.notifs;
  if (key.startsWith("lb"))       return TTL.lb;
  if (key.startsWith("progress")) return TTL.progress;
  return TTL.default;
}

function memGet(key) {
  const e = _mem.get(key);
  if (!e) return null;
  if (Date.now() - e.ts > getTTL(key)) { _mem.delete(key); return null; }
  return e.data;
}
function memSet(key, data) {
  _mem.set(key, { data, ts: Date.now() });
  return data;
}
export function memInvalidate(prefix) {
  for (const k of _mem.keys()) {
    if (k.startsWith(prefix)) _mem.delete(k);
  }
}

// sessionStorage helpers (survive page refresh within same tab)
function ssGet(key) {
  try {
    const raw = sessionStorage.getItem("fx_" + key);
    if (!raw) return null;
    const { data, ts, ttl } = JSON.parse(raw);
    if (Date.now() - ts > ttl) { sessionStorage.removeItem("fx_" + key); return null; }
    return data;
  } catch { return null; }
}
function ssSet(key, data, ttlMs) {
  try {
    sessionStorage.setItem("fx_" + key, JSON.stringify({ data, ts: Date.now(), ttl: ttlMs }));
  } catch { /* storage full — ignore */ }
  return data;
}

// Deduplicated fetch — returns same Promise if identical key is in-flight
function dedupe(key, fn) {
  if (_inFlight.has(key)) return _inFlight.get(key);
  const p = fn().finally(() => _inFlight.delete(key));
  _inFlight.set(key, p);
  return p;
}

// Wrap every Firestore call to catch quota errors
async function fsCall(fn) {
  try {
    return await fn();
  } catch (err) {
    if (
      err?.code === "resource-exhausted" ||
      err?.message?.includes("Quota exceeded") ||
      err?.message?.includes("quota")
    ) {
      markQuotaExceeded();
    }
    throw err;
  }
}

// ======================
// VENDORS
// ======================
export const getVendors = () =>
  dedupe("vendors:all", async () => {
    const cached = memGet("vendors:all") || ssGet("vendors:all");
    if (cached) return cached;
    const snap = await fsCall(() => getDocs(collection(db, "vendors")));
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    ssSet("vendors:all", data, TTL.vendors);
    return memSet("vendors:all", data);
  });

export const createVendor = async (vendorData) => {
  const ref = await fsCall(() => addDoc(collection(db, "vendors"), {
    name: vendorData.name || "",
    logo: vendorData.logo || "🏢",
    image: vendorData.image || null,
    color: vendorData.color || "#3b82f6",
    tag: vendorData.tag || "",
    description: vendorData.description || "",
    suggestion: vendorData.suggestion || "",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }));
  memInvalidate("vendors");
  return ref.id;
};

export const updateVendor = async (vendorId, vendorData) => {
  await fsCall(() => updateDoc(doc(db, "vendors", vendorId), { ...vendorData, updatedAt: serverTimestamp() }));
  memInvalidate("vendors");
};

export const deleteVendor = async (vendorId) => {
  await fsCall(() => deleteDoc(doc(db, "vendors", vendorId)));
  memInvalidate("vendors");
};

// ======================
// TOPICS
// ======================
export const getTopics = () =>
  dedupe("topics:all", async () => {
    const cached = memGet("topics:all") || ssGet("topics:all");
    if (cached) return cached;
    const snap = await fsCall(() => getDocs(collection(db, "topics")));
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    ssSet("topics:all", data, TTL.topics);
    return memSet("topics:all", data);
  });

export const createTopic = async (topicData) => {
  const ref = await fsCall(() => addDoc(collection(db, "topics"), {
    name: topicData.name || "",
    icon: topicData.icon || "📚",
    color: topicData.color || "#3b82f6",
    tag: topicData.tag || "",
    description: topicData.description || "",
    suggestion: topicData.suggestion || "",
    keywords: topicData.keywords || [],
    stats: topicData.stats || { jobs: "", growth: "", avgSalary: "" },
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }));
  memInvalidate("topics");
  return ref.id;
};

export const updateTopic = async (topicId, topicData) => {
  await fsCall(() => updateDoc(doc(db, "topics", topicId), { ...topicData, updatedAt: serverTimestamp() }));
  memInvalidate("topics");
};

export const deleteTopic = async (topicId) => {
  await fsCall(() => deleteDoc(doc(db, "topics", topicId)));
  memInvalidate("topics");
};

// ======================
// USERS
// ======================
export async function createUserProfile(uid, data) {
  const ref = doc(db, "users", uid);
  const snap = await fsCall(() => getDoc(ref));
  if (snap.exists()) {
    const existing = snap.data();
    await fsCall(() => updateDoc(ref, {
      name: data.name || existing.name,
      email: data.email || existing.email,
      updatedAt: serverTimestamp(),
    }));
  } else {
    await fsCall(() => setDoc(ref, {
      ...data,
      role: "student",
      country: data.country || "Unknown",
      countryCode: data.countryCode || null,
      createdAt: serverTimestamp(),
      favorites: [],
      enrolledExams: [],
      stats: { totalAttempts: 0, totalPassed: 0, averageScore: 0 },
    }));
  }
  memInvalidate(`user:${uid}`);
}

export async function getUserProfile(uid) {
  const cKey = `user:${uid}:profile`;
  const cached = memGet(cKey);
  if (cached) return cached;
  const snap = await fsCall(() => getDoc(doc(db, "users", uid)));
  if (snap.exists()) return memSet(cKey, { id: snap.id, ...snap.data() });
  return null;
}

export async function refreshUserRole(uid) {
  memInvalidate(`user:${uid}`);
  const snap = await fsCall(() => getDoc(doc(db, "users", uid)));
  return snap.exists() ? snap.data().role : "student";
}

export async function getAllUsers() {
  // Admin only — no cache (needs fresh data), but limit 500
  const snap = await fsCall(() => getDocs(
    query(collection(db, "users"), orderBy("createdAt", "desc"), limit(500))
  ));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function updateUserRole(uid, role) {
  await fsCall(() => updateDoc(doc(db, "users", uid), { role, updatedAt: serverTimestamp() }));
  memInvalidate(`user:${uid}`);
}

export async function updateUserProfile(uid, data) {
  await fsCall(() => updateDoc(doc(db, "users", uid), { ...data, updatedAt: serverTimestamp() }));
  memInvalidate(`user:${uid}`);
}

export async function addFavorite(userId, examId) {
  await fsCall(() => setDoc(doc(db, "users", userId), { favorites: arrayUnion(examId) }, { merge: true }));
  memInvalidate(`user:${userId}`);
}

export async function removeFavorite(userId, examId) {
  await fsCall(() => setDoc(doc(db, "users", userId), { favorites: arrayRemove(examId) }, { merge: true }));
  memInvalidate(`user:${userId}`);
}

export async function getFavorites(userId) {
  const cKey = `user:${userId}:favs`;
  const cached = memGet(cKey);
  if (cached) return cached;
  const snap = await fsCall(() => getDoc(doc(db, "users", userId)));
  return memSet(cKey, snap.exists() ? (snap.data().favorites || []) : []);
}

export async function mergeGuestFavorites(userId, guestFavIds) {
  if (!userId || !guestFavIds?.length) return [];
  const currentFavs = await getFavorites(userId);
  const newFavs = guestFavIds.filter(id => !currentFavs.includes(id));
  if (newFavs.length === 0) return currentFavs;
  await fsCall(() => setDoc(doc(db, "users", userId), { favorites: arrayUnion(...newFavs) }, { merge: true }));
  memInvalidate(`user:${userId}`);
  return [...currentFavs, ...newFavs];
}

export async function getCountryStats() {
  // Limit to avoid reading entire users collection — use cached exam count instead
  const snap = await fsCall(() => getDocs(
    query(collection(db, "users"), limit(300))
  ));
  const stats = {};
  snap.docs.forEach(d => {
    const country = d.data().country || "Unknown";
    stats[country] = (stats[country] || 0) + 1;
  });
  return Object.entries(stats)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([country, count]) => ({ country, count }));
}

// ======================
// ENROLLMENT
// ======================
export async function enrollUserInExam(userId, examId) {
  await fsCall(() => updateDoc(doc(db, "users", userId), { enrolledExams: arrayUnion(examId) }));
  memInvalidate(`user:${userId}`);
}

export async function getEnrolledExams(userId) {
  const cKey = `user:${userId}:enrolled`;
  const cached = memGet(cKey);
  if (cached) return cached;
  const snap = await fsCall(() => getDoc(doc(db, "users", userId)));
  return memSet(cKey, snap.exists() ? (snap.data().enrolledExams || []) : []);
}

export async function checkIfEnrolled(userId, examId) {
  const enrolled = await getEnrolledExams(userId);
  return enrolled.includes(examId);
}

export async function unenrollUserFromExam(userId, examId) {
  try { await clearExamProgress(userId, examId); } catch { /* best-effort */ }
  await fsCall(() => updateDoc(doc(db, "users", userId), { enrolledExams: arrayRemove(examId) }));
  memInvalidate(`user:${userId}`);
  return true;
}

// ======================
// EXAM PROGRESS
// ======================
export async function saveExamProgress(userId, examId, progressData) {
  const progressRef = doc(db, "users", userId, "examProgress", examId);
  const dataToSave = {
    examId, userId,
    currentPart: progressData.currentPart || 0,
    currentQuestion: progressData.currentQuestion || 0,
    answers: progressData.answers || {},
    flagged: progressData.flagged || {},
    revealed: progressData.revealed || {},
    totalParts: progressData.totalParts || 1,
    totalAnswered: Object.keys(progressData.answers || {}).length,
    timeLeft: progressData.timeLeft ?? null,
    timestamp: new Date().toISOString(),
    updatedAt: serverTimestamp(),
  };
  await fsCall(() => setDoc(progressRef, dataToSave, { merge: true }));
  memInvalidate(`progress:${userId}:${examId}`);
  return true;
}

export async function getExamProgress(userId, examId) {
  const cKey = `progress:${userId}:${examId}`;
  const cached = memGet(cKey);
  if (cached) return cached;
  const snap = await fsCall(() => getDoc(doc(db, "users", userId, "examProgress", examId)));
  return snap.exists() ? memSet(cKey, snap.data()) : null;
}

export async function clearExamProgress(userId, examId) {
  await fsCall(() => deleteDoc(doc(db, "users", userId, "examProgress", examId)));
  memInvalidate(`progress:${userId}:${examId}`);
  return true;
}

export async function getExamCompletionPercentage(userId, examId, totalQuestions) {
  const progress = await getExamProgress(userId, examId);
  if (!progress?.answers) return 0;
  return Math.round((Object.keys(progress.answers).length / totalQuestions) * 100);
}

// ======================
// SLUG
// ======================
export function generateSlug(title = "") {
  return title.toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ======================
// EXAMS
// ======================
export async function getExams() {
  return dedupe("exams:all", async () => {
    const memCached = memGet("exams:all");
    if (memCached) return memCached;
    const ssCached = ssGet("exams:all");
    if (ssCached) return memSet("exams:all", ssCached);

    const snap = await fsCall(() => getDocs(
      query(collection(db, "exams"), orderBy("createdAt", "desc"))
    ));
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    ssSet("exams:all", data, TTL.exams);
    return memSet("exams:all", data);
  });
}

export async function getExam(id) {
  const cKey = `exams:${id}`;
  const cached = memGet(cKey);
  if (cached) return cached;
  const snap = await fsCall(() => getDoc(doc(db, "exams", id)));
  return snap.exists() ? memSet(cKey, { id: snap.id, ...snap.data() }) : null;
}

export async function createExam(data) {
  const slug = data.slug || generateSlug(data.title || "");
  const ref = await fsCall(() => addDoc(collection(db, "exams"), {
    ...data, slug,
    vendor: data.vendor || "",
    topic: data.topic || "",
    attempts: 0, rating: 5.0, totalQuestions: 0, isActive: true,
    image: data.image || null,
    createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
  }));
  memInvalidate("exams");
  return ref.id;
}

export async function updateExam(id, data) {
  const { category, ...cleanData } = data;
  if (cleanData.title && !cleanData.slug) cleanData.slug = generateSlug(cleanData.title);
  await fsCall(() => updateDoc(doc(db, "exams", id), { ...cleanData, updatedAt: serverTimestamp() }));
  memInvalidate("exams");
}

export async function deleteExam(id) {
  await fsCall(() => deleteDoc(doc(db, "exams", id)));
  const qSnap = await fsCall(() => getDocs(query(collection(db, "questions"), where("examId", "==", id))));
  await Promise.all(qSnap.docs.map(d => deleteDoc(d.ref)));
  memInvalidate("exams");
}

export async function incrementExamAttempts(examId) {
  await fsCall(() => updateDoc(doc(db, "exams", examId), {
    attempts: increment(1), updatedAt: serverTimestamp(),
  }));
  memInvalidate(`exams:${examId}`);
}

export async function getEnrolledCountForExam(examId) {
  // Use stored counter from exam doc — avoids full users scan
  const exam = await getExam(examId);
  return exam?.enrolledCount ?? 0;
}

// ======================
// QUESTIONS
// ======================
export const getQuestions = async (examId) => {
  const cKey = `questions:${examId}`;
  const cached = memGet(cKey);
  if (cached) return cached;
  const ssCached = ssGet(cKey);
  if (ssCached) return memSet(cKey, ssCached);

  const snap = await fsCall(() => getDocs(
    query(collection(db, "questions"), where("examId", "==", examId))
  ));
  const data = snap.docs.map(d => {
    const q = d.data();
    let correct = q.correct;
    if (!correct || !Array.isArray(correct) || correct.length === 0) {
      if (Array.isArray(q.answer) && q.answer.length > 0) correct = q.answer;
      else correct = (q.options || []).map((o, i) => o.isCorrect ? (o.id || String(i)) : null).filter(Boolean);
    }
    return { id: d.id, ...q, correct };
  });

  ssSet(cKey, data, TTL.exams);
  return memSet(cKey, data);
};

export async function addQuestions(examId, questions) {
  const existing = await getQuestions(examId);
  let order = existing.length;
  await Promise.all(questions.map(q =>
    fsCall(() => addDoc(collection(db, "questions"), {
      ...q, examId, order: order++, createdAt: serverTimestamp(),
    }))
  ));
  await fsCall(() => updateDoc(doc(db, "exams", examId), {
    totalQuestions: existing.length + questions.length, updatedAt: serverTimestamp(),
  }));
  memInvalidate(`questions:${examId}`);
  memInvalidate("exams");
}

export async function deleteAllExamQuestions(examId) {
  const snap = await fsCall(() => getDocs(
    query(collection(db, "questions"), where("examId", "==", examId))
  ));
  await Promise.all(snap.docs.map(d => deleteDoc(d.ref)));
  await fsCall(() => updateDoc(doc(db, "exams", examId), {
    totalQuestions: 0, updatedAt: serverTimestamp(),
  }));
  memInvalidate(`questions:${examId}`);
  memInvalidate("exams");
}

export async function deleteQuestion(questionId) {
  const questionRef = doc(db, "questions", questionId);
  const snap = await fsCall(() => getDoc(questionRef));
  if (!snap.exists()) return;
  const examId = snap.data().examId;
  await fsCall(() => deleteDoc(questionRef));
  if (examId) {
    await fsCall(() => updateDoc(doc(db, "exams", examId), {
      totalQuestions: increment(-1), updatedAt: serverTimestamp(),
    })).catch(() => {});
    memInvalidate(`questions:${examId}`);
    memInvalidate("exams");
  }
}

// ======================
// RESULTS
// ======================
export async function saveExamScore(userId, examId, scoreData) {
  try {
    const progressRef = doc(db, "users", userId, "examProgress", examId);
    const progressSnap = await fsCall(() => getDoc(progressRef));
    let updateData = {
      lastAttemptAt: serverTimestamp(),
      totalAttempts: increment(1),
    };
    if (scoreData?.score !== undefined && scoreData.score !== null) updateData.lastScore = scoreData.score;
    if (scoreData?.pass !== undefined) updateData.lastPass = scoreData.pass;
    if (progressSnap.exists()) {
      const currentBest = progressSnap.data().bestScore || 0;
      if (scoreData?.score > currentBest) updateData.bestScore = scoreData.score;
    } else {
      if (scoreData?.score !== undefined && scoreData.score !== null) updateData.bestScore = scoreData.score;
      updateData.currentPart = 0; updateData.currentQuestion = 0; updateData.answers = {};
    }
    await fsCall(() => setDoc(progressRef, updateData, { merge: true }));
    memInvalidate(`progress:${userId}:${examId}`);
    return true;
  } catch { return false; }
}

export async function saveResult(data) {
  const ref = await fsCall(() => addDoc(collection(db, "results"), {
    ...data, createdAt: serverTimestamp(),
  }));

  if (data.userId && data.userId !== "guest") {
    const userRef = doc(db, "users", data.userId);
    const userSnap = await fsCall(() => getDoc(userRef));
    if (userSnap.exists()) {
      const stats = userSnap.data().stats || { totalAttempts: 0, totalPassed: 0, averageScore: 0 };
      const newTotal  = stats.totalAttempts + 1;
      const newPassed = stats.totalPassed + (data.pass ? 1 : 0);
      const newAvg    = Math.round((stats.averageScore * stats.totalAttempts + (data.score || 0)) / newTotal);
      await fsCall(() => updateDoc(userRef, {
        stats: { totalAttempts: newTotal, totalPassed: newPassed, averageScore: newAvg },
      }));
      const finalScore = data.score ?? data.percentage ?? 0;
      await saveExamScore(data.userId, data.examId, {
        score: finalScore, pass: data.pass,
        correctAnswers: data.correct, totalQuestions: data.totalQuestions,
      });
      memInvalidate(`user:${data.userId}`);
    }

    if (data.mode === "examSimulation" && data.pass === true) {
      try {
        const certId = generateCertId();
        await saveCertificate({
          certId, userId: data.userId, userName: data.userName || "Valued Candidate",
          examId: data.examId, examTitle: data.examTitle, score: data.score,
          date: data.date || new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
        });
      } catch (certErr) {
        console.error("❌ Failed to save certificate:", certErr);
      }
    }
  }

  memInvalidate(`results:${data.userId}`);
  return ref.id;
}

export async function getUserResults(userId) {
  const cKey = `results:${userId}`;
  const cached = memGet(cKey);
  if (cached) return cached;
  const snap = await fsCall(() => getDocs(
    query(collection(db, "results"), where("userId", "==", userId), orderBy("createdAt", "desc"), limit(50))
  ));
  return memSet(cKey, snap.docs.map(d => ({ id: d.id, ...d.data() })));
}

export async function getAllResults(limitCount = 100) {
  const snap = await fsCall(() => getDocs(
    query(collection(db, "results"), orderBy("createdAt", "desc"), limit(limitCount))
  ));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getExamResults(examId) {
  const snap = await fsCall(() => getDocs(
    query(collection(db, "results"), where("examId", "==", examId), limit(200))
  ));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function deleteResult(id) {
  await fsCall(() => deleteDoc(doc(db, "results", id)));
}

// ======================
// ADMIN STATS
// ======================
export async function getAdminStats() {
  const cKey = "admin:stats";
  const cached = memGet(cKey);
  if (cached) return cached;

  const [examsSnap, studentsSnap, resultsSnap, questionsSnap] = await Promise.all([
    fsCall(() => getDocs(query(collection(db, "exams"), limit(500)))),
    fsCall(() => getDocs(query(collection(db, "users"), where("role", "==", "student"), limit(500)))),
    fsCall(() => getDocs(query(collection(db, "results"), limit(500)))),
    fsCall(() => getDocs(query(collection(db, "questions"), limit(1000)))),
  ]);
  const results = resultsSnap.docs.map(d => d.data());
  const passed  = results.filter(r => r.pass).length;
  const stats   = {
    totalExams: examsSnap.size,
    totalStudents: studentsSnap.size,
    totalAttempts: resultsSnap.size,
    totalQuestions: questionsSnap.size,
    passRate: results.length ? Math.round((passed / results.length) * 100) : 0,
  };
  return memSet(cKey, stats);
}

// ======================
// REPORTS
// ======================
export async function submitQuestionReport(examId, questionId, userId, feedback, correctAnswer, questionText, userAnswer) {
  return fsCall(() => addDoc(collection(db, "reports"), {
    examId, questionId, userId, feedback, correctAnswer,
    questionText, userAnswer, status: "pending", createdAt: serverTimestamp(),
  }));
}

export async function getReports() {
  const snap = await fsCall(() => getDocs(
    query(collection(db, "reports"), where("status", "==", "pending"), orderBy("createdAt", "desc"), limit(100))
  ));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getAllReports() {
  const snap = await fsCall(() => getDocs(
    query(collection(db, "reports"), orderBy("createdAt", "desc"), limit(200))
  ));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function updateReportStatus(reportId, status, adminUid = null, note = "") {
  const rRef  = doc(db, "reports", reportId);
  const rSnap = await fsCall(() => getDoc(rRef));
  await fsCall(() => updateDoc(rRef, {
    status, reviewNote: note, reviewedBy: adminUid || null,
    reviewedAt: serverTimestamp(), updatedAt: serverTimestamp(),
  }));
  if (rSnap.exists() && rSnap.data().userId) {
    const { userId, questionText } = rSnap.data();
    await sendNotification(userId, {
      type:  `report_${status}`,
      title: status === "resolved" ? "✅ Report Resolved" : status === "dismissed" ? "📋 Report Dismissed" : "📋 Report Update",
      body:  note || (status === "resolved" ? "Your report has been resolved." : "Your report status was updated."),
      data:  { reportId, status, questionText: (questionText || "").slice(0, 80) },
    });
  }
}

export async function deleteReport(reportId) {
  await fsCall(() => deleteDoc(doc(db, "reports", reportId)));
}

// ======================
// SCORES — use progress subcollection (single read)
// ======================
export async function getUserBestScore(userId, examId) {
  const progress = await getExamProgress(userId, examId);
  if (progress?.bestScore != null) return progress.bestScore;
  if (progress?.lastScore != null) return progress.lastScore;
  // Fallback: 1 read from results
  const snap = await fsCall(() => getDocs(
    query(collection(db, "results"), where("userId", "==", userId), where("examId", "==", examId), orderBy("score", "desc"), limit(1))
  ));
  return snap.empty ? null : (snap.docs[0].data().score || snap.docs[0].data().percentage);
}

export async function getUserLastScore(userId, examId) {
  const progress = await getExamProgress(userId, examId);
  if (progress?.lastScore != null) return progress.lastScore;
  const snap = await fsCall(() => getDocs(
    query(collection(db, "results"), where("userId", "==", userId), where("examId", "==", examId), orderBy("createdAt", "desc"), limit(1))
  ));
  return snap.empty ? null : (snap.docs[0].data().score || snap.docs[0].data().percentage);
}

export async function getUserExamStats(userId, examId) {
  const progress = await getExamProgress(userId, examId);
  return {
    bestScore: progress?.bestScore || null,
    lastScore: progress?.lastScore || null,
    totalAttempts: progress?.totalAttempts || 0,
    lastAttemptAt: progress?.lastAttemptAt || null,
    completionPercentage: 0,
  };
}

// ======================
// CERTIFICATES
// ======================
export async function saveCertificate({ certId, userId, userName, examId, examTitle, score, date }) {
  if (!userId || userId === "guest" || !userId.trim()) return null;
  if (!certId?.trim()) throw new Error("certId is required");
  const certRef = doc(db, "certificates", certId);
  const snap = await fsCall(() => getDoc(certRef));
  if (snap.exists()) return certId;
  await fsCall(() => setDoc(certRef, {
    certId, userId, userName: userName || "Valued Candidate",
    examId: examId || "", examTitle: examTitle || "Professional Certification Exam",
    score: score ?? 0,
    date: date || new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
    issuedAt: serverTimestamp(),
  }));
  return certId;
}

export async function getUserCertificates(userId) {
  if (!userId || userId === "guest") return [];
  const snap = await fsCall(() => getDocs(
    query(collection(db, "certificates"), where("userId", "==", userId), limit(50))
  ));
  return snap.docs.map(d => ({ id: d.id, ...d.data(), certId: d.data().certId || d.id }));
}

export async function getUserCertificateForExam(userId, examId) {
  const snap = await fsCall(() => getDocs(
    query(collection(db, "certificates"), where("userId", "==", userId), where("examId", "==", examId), limit(1))
  ));
  return snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() };
}

// ======================
// MERGED DASHBOARD DATA — single batched fetch
// ======================
export async function getExamDashboardData(userId, examId) {
  try {
    // Single progress read covers: enrollment, bestScore, lastScore, attempts
    const [progress, userCert] = await Promise.all([
      getExamProgress(userId, examId),
      getUserCertificateForExam(userId, examId),
    ]);

    // Enrollment check from already-cached user profile (no extra read)
    const enrolled = await getEnrolledExams(userId);
    const isEnrolled = enrolled.includes(examId);

    // Exam attempts/enrolled count from cached exam doc
    const examDoc = await getExam(examId);

    return {
      isEnrolled,
      bestScore: progress?.bestScore || null,
      lastScore: progress?.lastScore || null,
      attemptsCount: examDoc?.attempts || 0,
      enrolledCount: examDoc?.enrolledCount || 0,
      userCertificate: userCert,
      savedProgress: progress,
      enrolling: false,
      unenrolling: false,
    };
  } catch {
    return {
      isEnrolled: false, bestScore: null, lastScore: null,
      attemptsCount: 0, enrolledCount: 0, userCertificate: null,
      savedProgress: null, enrolling: false, unenrolling: false,
    };
  }
}

// ======================
// WEEKLY COUNTERS — unchanged (runs once/week)
// ======================
const WEEKLY_UPDATE_KEY = "flexexams_last_weekly_update";

export async function runWeeklyCountersUpdate() {
  try {
    const lastRun = localStorage.getItem(WEEKLY_UPDATE_KEY);
    if (lastRun && Date.now() - parseInt(lastRun) < 7 * 24 * 60 * 60 * 1000) return false;

    const examsSnap = await fsCall(() => getDocs(query(collection(db, "exams"), limit(200))));
    const examIds   = examsSnap.docs.map(d => d.id);

    await Promise.allSettled(examIds.map(async (examId) => {
      try {
        const [enrolledSnap, attemptsSnap] = await Promise.all([
          fsCall(() => getDocs(query(collection(db, "users"), where("enrolledExams", "array-contains", examId), limit(500)))),
          fsCall(() => getDocs(query(collection(db, "results"), where("examId", "==", examId), limit(500)))),
        ]);
        await fsCall(() => updateDoc(doc(db, "exams", examId), {
          enrolledCount: enrolledSnap.size,
          attempts: attemptsSnap.size,
          countersUpdatedAt: serverTimestamp(),
        }));
      } catch { /* ignore per-exam errors */ }
    }));

    localStorage.setItem(WEEKLY_UPDATE_KEY, String(Date.now()));
    memInvalidate("exams");
    return true;
  } catch { return false; }
}

// ======================
// EXAM STATISTICS
// ======================
export async function getExamStatistics(examId) {
  const cKey = `examStats:${examId}`;
  const cached = memGet(cKey);
  if (cached) return cached;
  const snap = await fsCall(() => getDoc(doc(db, "examStats", examId)));
  return snap.exists() ? memSet(cKey, snap.data()) : null;
}

export async function updateExamStatistics(examId) {
  const questionsSnap = await fsCall(() => getDocs(
    query(collection(db, "questions"), where("examId", "==", examId))
  ));
  const questions = questionsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  const topicsDist = {};
  questions.forEach(q => {
    const domain = q.domain || "Uncategorized";
    topicsDist[domain] = (topicsDist[domain] || 0) + 1;
  });
  const examDoc  = await getExam(examId);
  await fsCall(() => setDoc(doc(db, "examStats", examId), {
    totalQuestions: questions.length,
    topicsDistribution: topicsDist,
    duration: examDoc?.duration || 0,
    passScore: examDoc?.passScore || 70,
    updatedAt: serverTimestamp(),
  }, { merge: true }));
  memInvalidate(`examStats:${examId}`);
  return true;
}
