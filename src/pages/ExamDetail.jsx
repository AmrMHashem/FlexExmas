// pages/ExamDetail.jsx — v6.3 Full code with vanilla SEO, sticky panel, resume modal
import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useAuth } from "../hooks/useAuth";
import {
  getQuestions,
  incrementExamAttempts,
  enrollUserInExam,
  checkIfEnrolled,
  getExamProgress,
  unenrollUserFromExam,
  clearExamProgress,
  getUserBestScore,
  getUserCertificateForExam,
  getUserExamStats,
  getEnrolledCountForExam,
  getExamDashboardData,
} from "../services/firestore";
import { Btn, Spinner, Icon, Tag, ProgressBar, Empty, Modal } from "../components/UI";
import { generatePDFCertificate } from "../utils/pdfCertificate";

// ------------------------------
//  Memoized Stars Component
// ------------------------------
const Stars = React.memo(function Stars({ rating = 5 }) {
  return (
    <span style={{ display: "inline-flex", gap: 2 }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <svg
          key={s}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill={s <= Math.round(rating) ? "#fbbf24" : "none"}
          stroke={s <= Math.round(rating) ? "#fbbf24" : "var(--bg4)"}
          strokeWidth={1.5}
          style={{ width: 16, height: 16 }}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
          />
        </svg>
      ))}
    </span>
  );
});

// ------------------------------
//  Vendor Logo Mapping
// ------------------------------
const vendorLogos = {
  AWS: "https://upload.wikimedia.org/wikipedia/commons/9/93/Amazon_Web_Services_Logo.svg",
  Microsoft: "https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg",
  Google: "https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg",
  Cisco: "https://upload.wikimedia.org/wikipedia/commons/0/08/Cisco_logo.svg",
  CompTIA: "https://upload.wikimedia.org/wikipedia/commons/4/48/Comptia_logo.svg",
};
const defaultLogo = "https://via.placeholder.com/32?text=Logo";

const detectVendorFromExamName = (name) => {
  if (!name) return null;
  const n = name.toLowerCase();
  if (n.includes("aws")) return "AWS";
  if (n.includes("azure") || n.includes("microsoft")) return "Microsoft";
  if (n.includes("google") || n.includes("gcp")) return "Google";
  if (n.includes("cisco")) return "Cisco";
  if (n.includes("comptia")) return "CompTIA";
  return null;
};

const getVendorLogo = (examName) => {
  const vendor = detectVendorFromExamName(examName);
  return vendor ? vendorLogos[vendor] : null;
};

const getMotivationalMessage = (score) => {
  if (!score) return "🚀 Take the exam to see your first score!";
  if (score >= 90) return "🏆 Outstanding! You're a true expert!";
  if (score >= 80) return "⭐ Great job! Very close to mastery!";
  if (score >= 70) return "🎯 Good work! You passed! Keep practicing!";
  if (score >= 60) return "💪 Solid attempt! Review weak areas.";
  return "🌱 Every expert was once a beginner. Keep learning!";
};

// ------------------------------
//  Memoized ScoreCard
// ------------------------------
const ScoreCard = React.memo(function ScoreCard({ score, examTitle }) {
  const percentage = Math.round(score);
  const message = getMotivationalMessage(score);
  return (
    <div style={{ background: "linear-gradient(135deg, rgba(16,185,129,0.12) 0%, rgba(5,150,105,0.08) 100%)", borderRadius: 20, padding: "20px", border: "1.5px solid rgba(16,185,129,0.25)", marginBottom: 24, position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: -30, right: -30, width: 120, height: 120, borderRadius: "50%", background: "radial-gradient(circle, rgba(16,185,129,0.15), transparent 70%)", pointerEvents: "none" }} />
      <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
        <div style={{ position: "relative", width: 100, height: 100 }}>
          <svg style={{ width: "100%", height: "100%", transform: "rotate(-90deg)" }}>
            <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(16,185,129,0.15)" strokeWidth="8" />
            <circle cx="50" cy="50" r="42" fill="none" stroke="#10b981" strokeWidth="8" strokeDasharray={`${percentage * 2.64} 264`} strokeLinecap="round" style={{ transition: "stroke-dasharray 0.8s ease-out" }} />
          </svg>
          <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", textAlign: "center" }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: "#10b981" }}>{percentage}%</div>
            <div style={{ fontSize: 9, color: "var(--text3)", marginTop: -2 }}>BEST</div>
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#10b981", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Your Best Score</div>
          <div style={{ fontSize: 14, fontWeight: 500, color: "var(--text)", lineHeight: 1.4 }}>{message}</div>
          <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 8 }}>{examTitle}</div>
        </div>
      </div>
    </div>
  );
});

// ------------------------------
//  Memoized LastScoreCard
// ------------------------------
const LastScoreCard = React.memo(function LastScoreCard({ lastScore, examTitle }) {
  if (!lastScore || lastScore === 0) return null;
  const percentage = Math.min(100, Math.max(0, Math.round(lastScore)));
  const isPassed = percentage >= 70;
  const remaining = 100 - percentage;
  const scoreColor = isPassed ? "#10b981" : "#f59e0b";
  const gradientFrom = isPassed ? "rgba(16,185,129,0.06)" : "rgba(245,158,11,0.06)";
  const gradientTo   = isPassed ? "rgba(16,185,129,0.02)" : "rgba(245,158,11,0.02)";
  const borderColor  = isPassed ? "rgba(16,185,129,0.25)" : "rgba(245,158,11,0.25)";

  return (
    <div style={{ background: `linear-gradient(135deg, ${gradientFrom} 0%, ${gradientTo} 100%)`, borderRadius: "20px", padding: "14px 16px", border: `1px solid ${borderColor}`, marginBottom: "20px", boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", flexWrap: "wrap", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: "36px", height: "36px", borderRadius: "12px", background: `linear-gradient(135deg,${scoreColor}20,${scoreColor}08)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M9 12H15M12 9V15M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke={scoreColor} strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <div style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: scoreColor, opacity: 0.8 }}>Last Score</div>
            {examTitle && <div style={{ fontSize: "11px", fontWeight: 500, color: "var(--text2)", marginTop: "2px" }}>{examTitle}</div>}
          </div>
        </div>
        <div style={{ background: isPassed ? "rgba(16,185,129,0.12)" : "rgba(245,158,11,0.12)", borderRadius: "30px", padding: "3px 8px", fontSize: "10px", fontWeight: 600, color: scoreColor }}>
          {isPassed ? "✓ Passed" : "⚡ Practice more"}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "8px", marginBottom: "12px" }}>
        <div>
          <div style={{ fontSize: "clamp(26px, 6vw, 32px)", fontWeight: 800, lineHeight: 1, color: scoreColor, letterSpacing: "-0.02em" }}>{percentage}%</div>
          <div style={{ fontSize: "10px", color: "var(--text3)", marginTop: "4px" }}>out of 100</div>
        </div>
        <div style={{ position: "relative", width: "44px", height: "44px", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="44" height="44" viewBox="0 0 44 44">
            <circle cx="22" cy="22" r="18" fill="none" stroke="rgba(0,0,0,0.05)" strokeWidth="3.5" />
            <circle cx="22" cy="22" r="18" fill="none" stroke={scoreColor} strokeWidth="3.5" strokeDasharray={`${(percentage / 100) * 113.1} 113.1`} strokeLinecap="round" transform="rotate(-90 22 22)" style={{ transition: "stroke-dasharray 0.3s ease" }} />
          </svg>
          <span style={{ position: "absolute", fontSize: "11px", fontWeight: 700, color: scoreColor }}>{percentage}%</span>
        </div>
      </div>
      <div style={{ background: "rgba(0,0,0,0.05)", borderRadius: "100px", height: "4px", overflow: "hidden", marginBottom: "8px" }}>
        <div style={{ width: `${percentage}%`, height: "100%", background: `linear-gradient(90deg,${scoreColor}cc,${scoreColor})`, borderRadius: "100px", transition: "width 0.3s ease" }} />
      </div>
      <div style={{ fontSize: "10px", color: "var(--text3)", display: "flex", alignItems: "center", gap: "6px" }}>
        <span>{isPassed ? "🏆" : "📚"}</span>
        <span>{isPassed ? "Great! Keep it up" : `${remaining}% more to pass`}</span>
      </div>
    </div>
  );
});

// ------------------------------
//  TopicDistributionBar
// ------------------------------
const TopicDistributionBar = React.memo(function TopicDistributionBar({ domain, count, total, color }) {
  const percentage = ((count / total) * 100).toFixed(1);
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
        <span style={{ color: "var(--text2)" }}>{domain}</span>
        <span style={{ fontWeight: 600, color: "var(--text)" }}>{percentage}% <span style={{ color: "var(--text3)", marginLeft: 4 }}>({count} q)</span></span>
      </div>
      <ProgressBar value={count} max={total} color={color} height={6} />
    </div>
  );
});

// =====================================================================
//  ✅ StickyPanel (JavaScript version) – يتحرك مع السكرول
// =====================================================================
function StickyPanel({ children, topOffset = 24 }) {
  const [isMobile, setIsMobile] = React.useState(window.innerWidth < 768);
  const wrapperRef = React.useRef(null);
  const rafRef     = React.useRef(null);
  const dataRef    = React.useRef({ initialTop: 0, ready: false });

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  React.useEffect(() => {
    if (isMobile) return;
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const init = () => {
      const rect = wrapper.getBoundingClientRect();
      dataRef.current.initialTop = rect.top + window.scrollY;
      dataRef.current.ready = true;
      handleScroll();
    };

    const handleScroll = () => {
      if (!dataRef.current.ready) return;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        const { initialTop } = dataRef.current;
        const scrollY = window.scrollY;
        const desiredY = scrollY + topOffset;
        if (desiredY > initialTop) {
          wrapper.style.transform = `translateY(${desiredY - initialTop}px)`;
        } else {
          wrapper.style.transform = "translateY(0px)";
        }
      });
    };

    requestAnimationFrame(() => requestAnimationFrame(init));
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", init);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", init);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [topOffset, isMobile]);

  return (
    <div
      ref={wrapperRef}
      style={{
        alignSelf: "start",
        willChange: isMobile ? "auto" : "transform",
      }}
    >
      {children}
    </div>
  );
}

// ------------------------------
//  Main ExamDetail Component
// ------------------------------
export default function ExamDetail({ exam, setPage, startQuiz, showToast }) {
  const { user, profile } = useAuth();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState("examSimulation");
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewSettings, setReviewSettings] = useState({ passingScore: 70, duration: 60 });
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [downloadingCert, setDownloadingCert] = useState(false);
  
  // Merged dashboard data state
  const [dashboard, setDashboard] = useState({
    isEnrolled: false,
    bestScore: null,
    lastScore: null,
    enrolledCount: 0,
    attemptsCount: 0,
    userCertificate: null,
    savedProgress: null,
  });
  
  // Refs for caching and abort
  const abortControllerRef = useRef(null);
  const cacheRef = useRef({});

  // ================== SEO: تحديث العنوان والوصف ديناميكياً ==================
  useEffect(() => {
    if (!exam) return;
    // Update title
    document.title = `${exam.title} | FlexExams Certification Practice`;
    
    // Update meta description
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', exam.description || exam.subtitle || `Prepare for ${exam.title} certification with real exam questions and timed simulations.`);
    
    // Update Open Graph title
    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (!ogTitle) {
      ogTitle = document.createElement('meta');
      ogTitle.setAttribute('property', 'og:title');
      document.head.appendChild(ogTitle);
    }
    ogTitle.setAttribute('content', `${exam.title} - FlexExams`);
    
    // Update Open Graph description
    let ogDesc = document.querySelector('meta[property="og:description"]');
    if (!ogDesc) {
      ogDesc = document.createElement('meta');
      ogDesc.setAttribute('property', 'og:description');
      document.head.appendChild(ogDesc);
    }
    ogDesc.setAttribute('content', exam.description || `Test your knowledge with ${questions.length} questions.`);
    
    // Optional: Set Open Graph image if exam has image
    let ogImage = document.querySelector('meta[property="og:image"]');
    if (!ogImage) {
      ogImage = document.createElement('meta');
      ogImage.setAttribute('property', 'og:image');
      document.head.appendChild(ogImage);
    }
    if (exam.image) ogImage.setAttribute('content', exam.image);
  }, [exam, questions.length]);

  // Vendor detection (memoized)
  const vendorName = useMemo(() => exam?.vendor || exam?.category || "", [exam]);
  const vendorLogo = useMemo(() => getVendorLogo(vendorName), [vendorName]);
  
  // Domain stats (memoized)
  const domainStats = useMemo(() => {
    return questions.reduce((acc, q) => {
      acc[q.domain] = (acc[q.domain] || 0) + 1;
      return acc;
    }, {});
  }, [questions]);
  
  // Last updated date (memoized)
  const lastUpdated = useMemo(() => {
    if (exam?.updatedAt?.toDate) return exam.updatedAt.toDate();
    if (exam?.lastUpdated) return new Date(exam.lastUpdated);
    if (exam?.publishedDate) return new Date(exam.publishedDate);
    return new Date();
  }, [exam]);
  
  const formattedDate = lastUpdated
    ? lastUpdated.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : "Recently updated";
  
  // Study modes constant
  const studyModes = useMemo(() => [
    { id: "examSimulation", icon: "clock", label: "Exam Simulation",  desc: "Timed Exam, Score, Certificate, Parts", official: true },
    { id: "fullPractice",   icon: "exam",  label: "Full Practice Set", desc: `All ${questions.length} Questions without Time`, official: false },
    { id: "review",         icon: "eye",   label: "Review Mode",       desc: "See correct answers, Set Score and Time", official: false },
  ], [questions.length]);
  
  // Load questions
  useEffect(() => {
    if (!exam) return;
    if (exam.isActive === false) showToast({ msg: "🔒 This exam is under maintenance.", type: "warning" });
    let isMounted = true;
    getQuestions(exam.id)
      .then((qs) => { if (isMounted) { setQuestions(qs); setLoading(false); } })
      .catch(() => { if (isMounted) setLoading(false); });
    return () => { isMounted = false; };
  }, [exam, showToast]);
  
  // Load all dashboard data using merged function + caching
  useEffect(() => {
    if (!exam || !user?.uid) return;
    
    const cacheKey = `exam_dashboard_${user.uid}_${exam.id}`;
    const cached = cacheRef.current[cacheKey];
    const now = Date.now();
    if (cached && (now - cached.timestamp) < 5 * 60 * 1000) { // 5 min cache
      setDashboard(cached.data);
      return;
    }
    
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();
    
    const loadDashboard = async () => {
      try {
        const data = await getExamDashboardData(user.uid, exam.id, { signal: abortControllerRef.current.signal });
        setDashboard(data);
        cacheRef.current[cacheKey] = { data, timestamp: Date.now() };
      } catch (err) {
        if (err.name !== "AbortError") console.error("Error loading dashboard:", err);
      }
    };
    loadDashboard();
    
    return () => abortControllerRef.current?.abort();
  }, [user?.uid, exam?.id]);
  
  // Increment attempts only when exam starts
  const incrementAttempts = useCallback(async () => {
    try {
      await incrementExamAttempts(exam.id);
      setDashboard(prev => ({ ...prev, attemptsCount: prev.attemptsCount + 1 }));
    } catch (err) {
      console.error("Failed to increment attempts:", err);
    }
  }, [exam?.id]);
  
  // Handlers (memoized)
  const handleEnroll = useCallback(async () => {
    if (!user) return;
    setDashboard(prev => ({ ...prev, enrolling: true }));
    try {
      await enrollUserInExam(user.uid, exam.id);
      setDashboard(prev => ({
        ...prev,
        isEnrolled: true,
        enrolledCount: prev.enrolledCount + 1,
        enrolling: false,
      }));
      showToast({ msg: "✅ Successfully enrolled! Ready to start.", type: "success" });
    } catch {
      showToast({ msg: "❌ Enrollment failed", type: "error" });
      setDashboard(prev => ({ ...prev, enrolling: false }));
    }
  }, [user, exam?.id, showToast]);
  
  const handleUnenroll = useCallback(async () => {
    if (!window.confirm("Are you sure? Your progress will be permanently deleted.")) return;
    setDashboard(prev => ({ ...prev, unenrolling: true }));
    try {
      await clearExamProgress(user.uid, exam.id);
      await unenrollUserFromExam(user.uid, exam.id);
      setDashboard(prev => ({
        ...prev,
        isEnrolled: false,
        savedProgress: null,
        enrolledCount: Math.max(0, prev.enrolledCount - 1),
        unenrolling: false,
      }));
      showToast({ msg: "✅ Successfully unenrolled", type: "success" });
    } catch {
      showToast({ msg: "❌ Unenroll failed", type: "error" });
      setDashboard(prev => ({ ...prev, unenrolling: false }));
    }
  }, [user, exam?.id, showToast]);
  
  const handleStart = useCallback(async (resumeProgress = false) => {
    if (exam.isActive === false) { showToast({ msg: "🔒 This exam is currently unavailable", type: "error" }); return; }
    if (!questions.length) { showToast({ msg: "No questions available.", type: "warning" }); return; }
    
    let pool = [...questions];
    if (!user) {
      const pc = Math.max(3, Math.ceil(pool.length * 0.1));
      pool = pool.slice(0, pc);
    }
    
    await incrementAttempts();
    
    let timeDuration = null;
    if (mode === "examSimulation") timeDuration = exam.duration * 60;
    else if (mode === "review") timeDuration = reviewSettings.duration * 60;
    
    startQuiz({
      exam, questions: pool, mode, duration: timeDuration,
      reviewSettings: mode === "review" ? reviewSettings : null,
      isGuest: !user,
      resumeProgress: resumeProgress && dashboard.savedProgress ? dashboard.savedProgress : null,
    });
  }, [exam, questions, user, mode, reviewSettings, dashboard.savedProgress, startQuiz, showToast, incrementAttempts]);
  
  const handleResumeExam = useCallback(async () => {
    setShowResumeModal(false);
    await handleStart(true);
  }, [handleStart]);
  
  const handleStartFresh = useCallback(async () => {
    setShowResumeModal(false);
    try {
      await clearExamProgress(user.uid, exam.id);
      setDashboard(prev => ({ ...prev, savedProgress: null }));
      await handleStart(false);
    } catch (err) {
      console.error(err);
      showToast({ msg: "❌ Failed to clear progress, try again", type: "error" });
    }
  }, [user, exam?.id, handleStart, showToast]);
  
  const handleDownloadCertificate = useCallback(async () => {
    setDownloadingCert(true);
    try {
      await generatePDFCertificate({
        examTitle: exam.title,
        userName: user.displayName || profile?.name || user.email || "Candidate",
        score: dashboard.userCertificate?.score,
        date: dashboard.userCertificate?.date,
        certId: dashboard.userCertificate?.certId,
        examMode: "examSimulation",
        passed: true,
        filename: `${exam.title.replace(/\s/g, "_")}_Certificate`,
      });
      showToast({ msg: "✅ Certificate downloaded!", type: "success" });
    } catch (err) {
      console.error(err);
      showToast({ msg: "❌ Failed to download certificate", type: "error" });
    }
    setDownloadingCert(false);
  }, [exam, user, profile, dashboard.userCertificate, showToast]);
  
  if (!exam) {
    return (
      <div style={{ textAlign: "center", padding: 80 }}>
        <Empty icon="exam" title="No exam selected" action={<Btn onClick={() => setPage("home")}>Go Back</Btn>} />
      </div>
    );
  }
  
  const ec = exam.color || "var(--accent)";
  const successRate = exam.successRate || 93;
  const numberOfParts = exam.numberOfParts || 1;
  
  // Right panel content (reusable)
  const RightPanelContent = useMemo(() => (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 24, padding: "clamp(20px, 4vw, 28px)" }}>
      <h3 style={{ fontWeight: 700, marginBottom: 20, fontSize: "clamp(18px, 4vw, 20px)" }}>Prepare and Pass</h3>
      
      {user && dashboard.bestScore !== null && dashboard.bestScore > 0 && <ScoreCard score={dashboard.bestScore} examTitle={exam.title} />}
      {user && dashboard.lastScore !== null && dashboard.lastScore > 0 && <LastScoreCard lastScore={dashboard.lastScore} examTitle={exam.title} />}
      
      {!user && (
        <div style={{ background: `${ec}08`, border: `1px solid ${ec}20`, borderRadius: 16, padding: "16px", marginBottom: 24 }}>
          <div style={{ fontWeight: 700, color: ec, marginBottom: 6 }}><Icon n="eye" size={14} /> Free Preview</div>
          <div style={{ color: "var(--text2)", fontSize: 13 }}>
            Get the first 10% free.{" "}
            <button onClick={() => setPage("auth")} style={{ background: "none", border: "none", color: ec, cursor: "pointer", textDecoration: "underline" }}>Create account</button>
            {" "}for full access.
          </div>
        </div>
      )}
      
      {user && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text3)", marginBottom: 12, textTransform: "uppercase" }}>Study Mode</div>
          {studyModes.map((m) => (
            <React.Fragment key={m.id}>
              <div
                onClick={() => { setMode(m.id); if (m.id === "review") setShowReviewModal(true); else setShowReviewModal(false); }}
                style={{ padding: "clamp(12px, 3vw, 14px) 16px", borderRadius: 16, marginBottom: showReviewModal && mode === "review" && m.id === "review" ? 0 : 10, cursor: "pointer", border: `1.5px solid ${mode === m.id ? ec : "var(--border)"}`, background: mode === m.id ? `${ec}06` : "transparent", borderBottomLeftRadius: showReviewModal && mode === "review" && m.id === "review" ? 0 : 16, borderBottomRightRadius: showReviewModal && mode === "review" && m.id === "review" ? 0 : 16 }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: mode === m.id ? `${ec}12` : "var(--bg3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon n={m.icon} size={18} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: "clamp(13px, 3vw, 14px)" }}>
                      {m.label}
                      {m.official && <span style={{ fontSize: 9, background: `${ec}12`, padding: "2px 8px", borderRadius: 20, marginLeft: 8 }}>Official</span>}
                    </div>
                    <div style={{ fontSize: "clamp(11px, 2.5vw, 12px)", color: "var(--text3)" }}>{m.desc}</div>
                  </div>
                  {mode === m.id && <Icon n="check" size={16} color={ec} />}
                </div>
              </div>
              {m.id === "review" && showReviewModal && mode === "review" && (
                <div style={{
                  background: `${ec}06`,
                  border: `1.5px solid ${ec}`,
                  borderTop: "none",
                  borderRadius: "0 0 16px 16px",
                  padding: "16px",
                  animation: "slideDown 0.2s ease-out"
                }}>
                  <style>{`@keyframes slideDown { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }`}</style>
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    <div>
                      <label style={{ fontSize: "clamp(11px, 3vw, 12px)", fontWeight: 600, display: "block", marginBottom: 6 }}>
                        Passing Score: <span style={{ color: ec }}>{reviewSettings.passingScore}%</span>
                      </label>
                      <input type="range" min={30} max={100} value={reviewSettings.passingScore}
                        onChange={(e) => setReviewSettings((p) => ({ ...p, passingScore: Number(e.target.value) }))}
                        style={{ width: "100%", accentColor: ec }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "clamp(11px, 3vw, 12px)", fontWeight: 600, display: "block", marginBottom: 6 }}>
                        Duration: <span style={{ color: ec }}>{reviewSettings.duration} min</span>
                      </label>
                      <input type="range" min={15} max={180} value={reviewSettings.duration}
                        onChange={(e) => setReviewSettings((p) => ({ ...p, duration: Number(e.target.value) }))}
                        style={{ width: "100%", accentColor: ec }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      )}
      
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {user ? (
          <>
            {!dashboard.isEnrolled ? (
              <Btn full size="lg" onClick={handleEnroll} loading={dashboard.enrolling} style={{ background: `linear-gradient(135deg,var(--green),#059669)`, borderColor: "transparent", minHeight: 48 }}>
                <Icon n="user-plus" size={16} /> Enroll in Exam
              </Btn>
            ) : (
              <>
                {dashboard.savedProgress && (
                  <div style={{ background: `${ec}08`, border: `1px solid ${ec}20`, borderRadius: 14, padding: "12px 16px", marginBottom: 8, fontSize: 12, color: ec, wordBreak: "break-word" }}>
                    📝 Saved progress in Part {dashboard.savedProgress.currentPart + 1}, Question {dashboard.savedProgress.currentQuestion + 1}
                  </div>
                )}
                <Btn
                  full size="lg"
                  onClick={() => { if (dashboard.savedProgress) setShowResumeModal(true); else handleStart(false); }}
                  disabled={exam.isActive === false}
                  style={{ background: `linear-gradient(135deg,${ec},${ec}cc)`, borderColor: "transparent", boxShadow: `0 4px 14px ${ec}40`, opacity: exam.isActive === false ? 0.6 : 1, minHeight: 48 }}
                >
                  <Icon n="lightning" size={16} /> Start Exam
                </Btn>
                <Btn full variant="ghost" loading={dashboard.unenrolling} onClick={handleUnenroll} style={{ color: "var(--red)", minHeight: 48 }}>
                  <Icon n="close" size={16} /> Unenroll
                </Btn>
                {dashboard.userCertificate && (
                  <Btn
                    full variant="outline" loading={downloadingCert}
                    onClick={handleDownloadCertificate}
                    style={{ justifyContent: "center", marginTop: 8, minHeight: 48 }}
                  >
                    <Icon n="download" size={16} /> Download Certificate
                  </Btn>
                )}
              </>
            )}
          </>
        ) : (
          <Btn full size="lg" onClick={() => handleStart(false)} loading={loading} style={{ background: `linear-gradient(135deg,${ec},${ec}cc)`, borderColor: "transparent", minHeight: 48 }}>
            <Icon n="lightning" size={16} /> Start Free Preview
          </Btn>
        )}
      </div>
      
      <div style={{ textAlign: "center", marginTop: 16, fontSize: 11, color: "var(--text3)" }}>
        <Icon n="shield" size={12} /> Your progress auto-saves
      </div>
    </div>
  ), [user, dashboard, exam, ec, studyModes, mode, showReviewModal, reviewSettings, loading, downloadingCert, handleEnroll, handleUnenroll, handleStart, handleDownloadCertificate, setPage]);
  
  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "36px clamp(16px, 4vw, 48px) 72px", overflowX: "hidden" }}>
      {/* Back Button */}
      <button onClick={() => setPage("home")} style={{ background: "none", border: "none", color: "var(--text3)", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 13, marginBottom: 28, minHeight: 40 }}>
        <Icon n="arrow_right" size={14} style={{ transform: "rotate(180deg)" }} /> Back to Exams
      </button>
      
      {/* Hero Section */}
      <div style={{ background: `linear-gradient(145deg,var(--surface) 0%,${ec}08 100%)`, border: `1px solid var(--border)`, borderRadius: 28, padding: "clamp(20px, 4vw, 28px)", marginBottom: 32, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -80, right: -80, width: 200, height: 200, borderRadius: "50%", background: `radial-gradient(circle,${ec}12,transparent 70%)`, pointerEvents: "none" }} />
        <div style={{ display: "flex", gap: 28, flexWrap: "wrap" }}>
          {exam.image && (
            <div style={{ flex: "0 0 clamp(200px, 30vw, 280px)", borderRadius: 20, overflow: "hidden", background: `${ec}08`, border: `1px solid ${ec}20` }}>
              <img src={exam.image} alt={exam.title} style={{ width: "100%", height: "auto", objectFit: "cover" }} loading="lazy" />
            </div>
          )}
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
              <Tag color={ec}>{exam.category}</Tag>
              <Tag color={exam.difficulty === "Easy" ? "var(--green)" : exam.difficulty === "Hard" ? "var(--red)" : "var(--gold)"}>{exam.difficulty}</Tag>
              {exam.isActive === false && <Tag color="var(--red)" style={{ background: "rgba(239,68,68,0.12)" }}>🔒 Maintenance</Tag>}
            </div>
            <h1 style={{ fontSize: "clamp(24px, 5vw, 32px)", fontWeight: 800, color: "var(--text)", marginBottom: 8, wordBreak: "break-word" }}>{exam.title}</h1>
            <div style={{ fontSize: "clamp(13px, 3vw, 14px)", color: "var(--text3)", marginBottom: 12 }}>{exam.subtitle}</div>
            {vendorName && (
              <div style={{ display: "inline-flex", alignItems: "center", gap: 10, background: "var(--bg2)", border: "1.5px solid var(--border)", borderRadius: 12, padding: "8px 14px", marginBottom: 16 }}>
                <img src={exam.vendorImage || vendorLogo} alt={vendorName} style={{ width: 32, height: 22, objectFit: "contain" }} loading="lazy" onError={e => { e.target.src = defaultLogo; }} />
                <div>
                  <div style={{ fontSize: 9, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase" }}>Vendor</div>
                  <div style={{ fontSize: "clamp(12px, 3vw, 13px)", fontWeight: 700, color: "var(--text)" }}>{vendorName}</div>
                </div>
              </div>
            )}
            {exam.description && <p style={{ fontSize: "clamp(13px, 3vw, 14px)", color: "var(--text2)", lineHeight: 1.6, marginBottom: 20 }}>{exam.description}</p>}
            <div style={{ display: "flex", alignItems: "center", gap: "clamp(12px, 3vw, 20px)", flexWrap: "wrap" }}>
              <span style={{ fontSize: "clamp(12px, 3vw, 13px)", color: "var(--text3)", display: "flex", alignItems: "center", gap: 6 }}><Icon n="user" size={14} /> {dashboard.enrolledCount.toLocaleString()} enrolled</span>
              <span style={{ fontSize: "clamp(12px, 3vw, 13px)", color: "var(--text3)", display: "flex", alignItems: "center", gap: 6 }}><Icon n="refresh" size={14} /> {dashboard.attemptsCount.toLocaleString()} attempts</span>
              <span style={{ fontSize: "clamp(12px, 3vw, 13px)", color: "var(--text3)", display: "flex", alignItems: "center", gap: 6 }}><Icon n="calendar" size={14} /> Updated: {formattedDate}</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content Grid - with JS StickyPanel */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 32, alignItems: "start" }} className="exam-detail-grid">
        {/* Left Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 24, padding: "clamp(20px, 4vw, 28px)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
              <h2 style={{ fontSize: "clamp(16px, 4vw, 18px)", fontWeight: 700 }}>Global Exam Specification</h2>
              <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--bg3)", padding: "6px 12px", borderRadius: 40 }}>
                <img src={vendorLogo} alt={vendorName} style={{ width: 24, height: 24, objectFit: "contain" }} loading="lazy" onError={(e) => { e.target.src = defaultLogo; }} />
                <span style={{ fontSize: "clamp(11px, 3vw, 12px)", fontWeight: 600 }}>{vendorName}</span>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16, marginBottom: 28 }}>
              <div>
                <div style={{ fontSize: "clamp(11px, 3vw, 12px)", color: "var(--text3)" }}>Total Questions</div>
                <div style={{ fontSize: "clamp(18px, 4vw, 20px)", fontWeight: 700 }}>{loading ? "..." : `${questions.length} items`}</div>
              </div>
              <div>
                <div style={{ fontSize: "clamp(11px, 3vw, 12px)", color: "var(--text3)" }}>Duration</div>
                <div style={{ fontSize: "clamp(18px, 4vw, 20px)", fontWeight: 700 }}>{exam.duration} min</div>
              </div>
              <div>
                <div style={{ fontSize: "clamp(11px, 3vw, 12px)", color: "var(--text3)" }}>Passing Score</div>
                <div style={{ fontSize: "clamp(18px, 4vw, 20px)", fontWeight: 700 }}>{exam.passScore}%</div>
              </div>
              <div>
                <div style={{ fontSize: "clamp(11px, 3vw, 12px)", color: "var(--text3)" }}>Topics</div>
                <div style={{ fontSize: "clamp(18px, 4vw, 20px)", fontWeight: 700 }}>{Object.keys(domainStats).length}</div>
              </div>
              {numberOfParts > 1 && (
                <div style={{ gridColumn: "1 / -1" }}>
                  <div style={{ fontSize: "clamp(11px, 3vw, 12px)", color: "var(--text3)" }}>Exam Structure</div>
                  <div style={{ fontSize: "clamp(18px, 4vw, 20px)", fontWeight: 700 }}>{numberOfParts} parts</div>
                </div>
              )}
            </div>
            {!loading && Object.keys(domainStats).length > 0 && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 6 }}>
                  <div style={{ fontSize: "clamp(11px, 3vw, 12px)", fontWeight: 600 }}>Topic Distribution</div>
                  <div style={{ fontSize: "clamp(11px, 3vw, 12px)", fontWeight: 700, color: ec }}>{successRate}% Success Rate</div>
                </div>
                {Object.entries(domainStats).map(([domain, cnt]) => (
                  <TopicDistributionBar key={domain} domain={domain} count={cnt} total={questions.length} color={ec} />
                ))}
              </div>
            )}
          </div>
          
          {exam.longDescription && (
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 24, padding: "clamp(20px, 4vw, 28px)" }}>
              <h2 style={{ fontSize: "clamp(16px, 4vw, 18px)", fontWeight: 700, marginBottom: 16 }}>About This Exam</h2>
              <div className="exam-long-desc" dangerouslySetInnerHTML={{ __html: exam.longDescription }} />
            </div>
          )}
        </div>
        
        {/* Right Panel - Sticky (JS version) */}
        <StickyPanel topOffset={24}>
          {RightPanelContent}
        </StickyPanel>
      </div>
      
      {/* Resume Modal - Centered */}
      {showResumeModal && dashboard.savedProgress && (
        <Modal title="Resume Your Exam" onClose={() => setShowResumeModal(false)}>
          <div style={{ textAlign: "center", padding: "8px 0", }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⏸️</div>
            <p style={{ fontSize: "clamp(13px, 4vw, 14px)", color: "var(--text2)", marginBottom: 24 }}>
              You were in <strong style={{ color: ec }}>Part {dashboard.savedProgress.currentPart + 1}</strong>{" "}
              at <strong style={{ color: ec }}>Question {dashboard.savedProgress.currentQuestion + 1}</strong>
            </p>
            <div style={{ display: "flex", gap: 12, flexDirection: "column",  }}>
              <Btn full onClick={handleResumeExam} style={{ background: `linear-gradient(135deg,${ec},${ec}cc)`, minHeight: 48 }}>
                Resume from Part {dashboard.savedProgress.currentPart + 1}
              </Btn>
              <Btn full variant="subtle" onClick={handleStartFresh} style={{ minHeight: 48 }}>Start Over</Btn>
              <Btn full variant="ghost" onClick={() => setShowResumeModal(false)} style={{ minHeight: 48 }}>Cancel</Btn>
            </div>
          </div>
        </Modal>
      )}
      
      <style>{`
        @media (max-width: 768px) {
          .exam-detail-grid {
            grid-template-columns: 1fr !important;
            gap: 24px !important;
          }
          .exam-detail-grid > div:first-child {
            order: 2;
          }
          .exam-detail-grid > div:last-child {
            order: 1;
          }
          button, .btn, [role="button"] {
            min-height: 44px;
          }
          input, select, textarea {
            font-size: 16px !important;
          }
        }
        @media (max-width: 480px) {
          .exam-detail-grid {
            gap: 16px !important;
          }
        }
        .exam-long-desc {
          font-size: clamp(13px, 3vw, 14px);
          color: var(--text2);
          line-height: 1.75;
          word-break: break-word;
        }
        .exam-long-desc h2 {
          font-size: clamp(15px, 4vw, 17px);
          font-weight: 800;
          color: var(--text);
          margin: 18px 0 8px;
        }
        .exam-long-desc h3 {
          font-size: clamp(13px, 3.5vw, 15px);
          font-weight: 700;
          color: var(--text);
          margin: 14px 0 6px;
        }
        .exam-long-desc p {
          margin: 6px 0;
        }
        .exam-long-desc strong {
          font-weight: 700;
          color: var(--text);
        }
        .exam-long-desc ul {
          list-style: disc;
          padding-left: 22px;
          margin: 8px 0;
        }
        .exam-long-desc ol {
          list-style: decimal;
          padding-left: 22px;
          margin: 8px 0;
        }
        .exam-long-desc li {
          margin: 4px 0;
        }
        .exam-long-desc a {
          color: var(--accent);
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
}