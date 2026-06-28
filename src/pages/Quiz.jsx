import React from "react";
import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../hooks/useAuth";
import { saveResult, saveExamProgress, getExamProgress, clearExamProgress } from "../services/firestore";
import { updateLeaderboardStats } from "./Leaderboard";
import { processReferralOnPurchase } from "../components/ReferralSystem";

import {
  Btn,
  Icon,
  ProgressBar,
  Spinner,
  Modal,
} from "../components/UI";

function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function calculateParts(totalQuestions) {
  if (totalQuestions <= 60) return 2;
  return Math.ceil(totalQuestions / 40);
}

function getQuestionsForPart(questions, partIndex, totalParts) {
  const totalQuestions = questions.length;
  if (totalParts === 2) {
    const half = Math.ceil(totalQuestions / 2);
    return partIndex === 0 ? questions.slice(0, half) : questions.slice(half);
  }
  const perPart = Math.ceil(totalQuestions / totalParts);
  const start = partIndex * perPart;
  return questions.slice(start, Math.min(start + perPart, totalQuestions));
}

// Helper: strip HTML tags for RTL detection and validation
function stripHtml(html) {
  if (!html) return "";
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export default function Quiz({ quizData, setPage, setResultData, showToast }) {
  const { user, profile } = useAuth();
  const { exam, questions, mode, duration, reviewSettings, isGuest } = quizData;

  // ====== Exam Segmentation ======
  const isSegmented = mode === "examSimulation" && questions.length > 40;
  const totalParts = isSegmented ? calculateParts(questions.length) : 1;
  const [currentPart, setCurrentPart] = useState(0);
  const currentPartQuestions = isSegmented
    ? getQuestionsForPart(questions, currentPart, totalParts)
    : questions;

  const getPartDuration = () => {
    if (!isSegmented || !duration) return duration;
    return Math.floor(duration / totalParts);
  };

  // ====== Quiz State ======
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [flagged, setFlagged] = useState({});
  const [revealed, setRevealed] = useState({});
  const [timeLeft, setTimeLeft] = useState(getPartDuration() || 0);
  const [started] = useState(Date.now());
  const [saving, setSaving] = useState(false);
  const [showNav, setShowNav] = useState(false);
  const [reportModal, setReportModal] = useState(false);
  const [reportForm, setReportForm] = useState({ feedback: "", correctAnswer: "" });
  const [fullscreen, setFullscreen] = useState(false);
  const [warningCount, setWarningCount] = useState(0);
  const [showGuestSignupModal, setShowGuestSignupModal] = useState(false);
  const [showPartComplete, setShowPartComplete] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [isFinishingGuest, setIsFinishingGuest] = useState(false);
  const [showResumeChoice, setShowResumeChoice] = useState(false);

  const timerRef = useRef();
  const containerRef = useRef();
  const debouncedSaveRef = useRef();
  const periodicSaveRef = useRef();
  const saveLocalProgressRef = useRef();
  const loadedProgressRef = useRef(null);

  const getLocalProgressKey = useCallback(() => {
    return `examProgress_${exam?.id}_${user?.uid || 'guest'}`;
  }, [exam, user]);

  // ---- Periodic & debounced local saves (timeLeft every 20s, rest on change) ----
  useEffect(() => {
    saveLocalProgressRef.current = () => {
      const progressData = {
        currentPart,
        currentQuestion: current,
        answers,
        flagged,
        revealed,
        timeLeft,
        totalParts,
        timestamp: new Date().toISOString(),
      };
      try {
        localStorage.setItem(getLocalProgressKey(), JSON.stringify(progressData));
      } catch (e) { /* silent */ }
    };
  });

  useEffect(() => {
    periodicSaveRef.current = setInterval(() => {
      saveLocalProgressRef.current?.();
    }, 20000);
    return () => clearInterval(periodicSaveRef.current);
  }, []);

  useEffect(() => {
    if (debouncedSaveRef.current) clearTimeout(debouncedSaveRef.current);
    debouncedSaveRef.current = setTimeout(() => {
      saveLocalProgressRef.current?.();
    }, 300);
    return () => {
      if (debouncedSaveRef.current) clearTimeout(debouncedSaveRef.current);
    };
  }, [answers, flagged, revealed, current, currentPart]);

  // ====== Load progress & show resume choice ======
  useEffect(() => {
    const loadProgress = async () => {
      try {
        let loadedProgress = null;

        if (quizData.resumeProgress) {
          loadedProgress = quizData.resumeProgress;
        } else if (user && exam) {
          const firestoreProgress = await getExamProgress(user.uid, exam.id);
          if (firestoreProgress) loadedProgress = firestoreProgress;
        }

        // Check local storage as fallback / comparison
        const localData = localStorage.getItem(getLocalProgressKey());
        let localProgress = null;
        if (localData) {
          try { localProgress = JSON.parse(localData); } catch (e) { /* ignore */ }
        }

        if (loadedProgress && localProgress) {
          const loadedTime = new Date(loadedProgress.timestamp || 0).getTime();
          const localTime = new Date(localProgress.timestamp || 0).getTime();
          if (localTime > loadedTime) loadedProgress = localProgress;
        } else if (!loadedProgress && localProgress) {
          loadedProgress = localProgress;
        }

        if (loadedProgress) {
          // Found existing progress – ask user for action
          loadedProgressRef.current = loadedProgress;
          setShowResumeChoice(true);
        } else {
          loadedProgressRef.current = null;
          setShowResumeChoice(false);
        }
      } catch (err) {
        console.error("Error loading progress:", err);
      }
    };

    loadProgress();
  }, [quizData.resumeProgress, user, exam, getLocalProgressKey]);

  // ====== Resume choice handlers ======
  const handleResumeContinue = () => {
    const progress = loadedProgressRef.current;
    if (progress) {
      setCurrentPart(progress.currentPart || 0);
      setCurrent(progress.currentQuestion || 0);
      setAnswers(progress.answers || {});
      setFlagged(progress.flagged || {});
      setRevealed(progress.revealed || {});
      if (progress.timeLeft != null && progress.timeLeft > 0) {
        setTimeLeft(progress.timeLeft);
      } else {
        setTimeLeft(getPartDuration()); // fallback
      }
      showToast({ msg: `📝 Resumed part ${(progress.currentPart || 0) + 1}`, type: "info" });
    }
    setShowResumeChoice(false);
  };

  const handleResumeStartOver = async () => {
    // Clear saved progress completely
    localStorage.removeItem(getLocalProgressKey());
    if (user && exam) {
      try {
        await clearExamProgress(user.uid, exam.id);
      } catch (e) {
        console.error("Error clearing progress:", e);
      }
    }
    // Reset all quiz states
    setCurrentPart(0);
    setCurrent(0);
    setAnswers({});
    setFlagged({});
    setRevealed({});
    setTimeLeft(getPartDuration());
    setShowResumeChoice(false);
    showToast({ msg: "🔄 Starting a fresh attempt", type: "info" });
  };

  // ====== Prevent copy/paste ======
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const preventCopy = (e) => {
      e.preventDefault();
      showToast({ msg: "⚠️ Copying questions is not allowed", type: "warning" });
    };

    const preventContext = (e) => {
      e.preventDefault();
      setWarningCount((p) => p + 1);
      if (warningCount >= 2) {
        showToast({
          msg: "❌ Repeated warnings - exam will be terminated",
          type: "error",
        });
        finishQuiz();
      }
    };

    container.addEventListener("copy", preventCopy);
    container.addEventListener("contextmenu", preventContext);

    return () => {
      container.removeEventListener("copy", preventCopy);
      container.removeEventListener("contextmenu", preventContext);
    };
  }, [warningCount]);

  // ====== Fullscreen ======
  const toggleFullscreen = async () => {
    try {
      if (!fullscreen) {
        if (containerRef.current.requestFullscreen) {
          await containerRef.current.requestFullscreen();
        }
      } else {
        if (document.fullscreenElement) {
          await document.exitFullscreen();
        }
      }
      setFullscreen(!fullscreen);
    } catch (err) {
      showToast({ msg: "Error toggling fullscreen", type: "error" });
    }
  };

  // ====== Firestore save (only on explicit events) ======
  const saveProgressToFirestore = useCallback(async () => {
    if (!user || isGuest || !exam || !isSegmented) return;
    try {
      const progressData = {
        currentPart,
        currentQuestion: current,
        answers,
        flagged,
        revealed,
        totalParts,
        examId: exam.id,
        userId: user.uid,
        timestamp: new Date().toISOString(),
        totalAnswered: Object.keys(answers).length,
        timeLeft,
      };
      await saveExamProgress(user.uid, exam.id, progressData);
    } catch (err) {
      console.error("Error saving progress to Firestore:", err);
    }
  }, [user, exam, currentPart, current, answers, flagged, revealed, totalParts, isGuest, isSegmented, timeLeft]);

  // ====== Timer (only starts if no resume choice pending) ======
  // ─── Security: Prevent copy/inspect during exam ──────────────────
  useEffect(() => {
    if (!started || mode === "review") return;

    const preventCopy = (e) => e.preventDefault();
    const preventContext = (e) => e.preventDefault();
    const preventKeyInspect = (e) => {
      // Block F12, Ctrl+Shift+I, Ctrl+U, Ctrl+S, PrintScreen, Ctrl+P
      if (
        e.key === "F12" ||
        e.key === "PrintScreen" ||
        (e.ctrlKey && e.shiftKey && ["I","i","J","j","C","c"].includes(e.key)) ||
        (e.ctrlKey && ["u","U","s","S","p","P"].includes(e.key))
      ) {
        e.preventDefault();
        return false;
      }
    };

    document.addEventListener("copy",        preventCopy);
    document.addEventListener("contextmenu", preventContext);
    document.addEventListener("keydown",     preventKeyInspect);
    document.addEventListener("selectstart", preventCopy);

    return () => {
      document.removeEventListener("copy",        preventCopy);
      document.removeEventListener("contextmenu", preventContext);
      document.removeEventListener("keydown",     preventKeyInspect);
      document.removeEventListener("selectstart", preventCopy);
    };
  }, [started, mode]);

  useEffect(() => {
    if ((mode !== "examSimulation" && mode !== "review") || !user || isGuest || !duration || showResumeChoice) return;
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          if (isSegmented && currentPart < totalParts - 1) {
            handleAutoEndPart();
          } else {
            finishQuiz();
          }
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [user, mode, isGuest, duration, isSegmented, currentPart, totalParts, showResumeChoice]);

  // ====== Question helpers ======
  // ✅ FIX: Normalize q.correct for any question format (old CSV / new QuestionBuilder)
  const _rawQ = currentPartQuestions[current];
  const q = _rawQ ? {
    ..._rawQ,
    // Ensure correct[] always exists and is an array of option IDs
    correct: (() => {
      if (Array.isArray(_rawQ.correct) && _rawQ.correct.length > 0) return _rawQ.correct;
      if (Array.isArray(_rawQ.answer)  && _rawQ.answer.length  > 0) return _rawQ.answer;
      // Derive from options.isCorrect (last resort)
      return (_rawQ.options || [])
        .map((o, i) => (o.isCorrect ? (o.id || String(i)) : null))
        .filter(Boolean);
    })(),
  } : null;

  const selectOption = (optId) => {
    if ((mode === "review" || isGuest) && revealed[`${currentPart}-${current}`]) return;
    const isMulti = q?.type === "multi" || q?.type === "multi-select";
    setAnswers((prev) => {
      const key = isSegmented ? `${currentPart}-${current}` : current;
      const cur = prev[key] || [];
      if (isMulti) {
        const requiredCount = q.correct?.length || 2;
        if (cur.includes(optId)) return { ...prev, [key]: cur.filter((x) => x !== optId) };
        if (cur.length >= requiredCount) return prev;
        return { ...prev, [key]: [...cur, optId] };
      }
      return { ...prev, [key]: [optId] };
    });
  };

  const revealAnswer = () => {
    const key = isSegmented ? `${currentPart}-${current}` : current;
    setRevealed((prev) => ({ ...prev, [key]: true }));
  };

  const toggleFlag = () => {
    const key = isSegmented ? `${currentPart}-${current}` : current;
    setFlagged((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleAutoEndPart = useCallback(async () => {
    await saveProgressToFirestore();
    showToast({ msg: "⏱️ Time's up! Part ended automatically.", type: "warning" });
    setShowPartComplete(true);
  }, [saveProgressToFirestore]);

  const handleGuestSignupAndFinish = async () => {
    if (isFinishingGuest) return;
    setIsFinishingGuest(true);
    setShowGuestSignupModal(false);
    setTimeout(async () => {
      try {
        await finishQuiz();
      } catch (error) {
        console.error("Error finishing quiz:", error);
        showToast({ msg: "حدث خطأ، حاول مرة أخرى", type: "error" });
        setIsFinishingGuest(false);
      }
    }, 100);
  };

  const finishQuiz = useCallback(async () => {
    clearInterval(timerRef.current);
    clearInterval(periodicSaveRef.current);
    if (debouncedSaveRef.current) clearTimeout(debouncedSaveRef.current);
    setSaving(true);

    let correct = 0;
    const details = questions.map((q, qIdx) => {
      let userAns = [];
      let flaggedStatus = false;
      if (isSegmented) {
        const partNum = Math.floor(qIdx / Math.ceil(questions.length / totalParts));
        const questionIndexInPart = qIdx % Math.ceil(questions.length / totalParts);
        const key = `${partNum}-${questionIndexInPart}`;
        userAns = answers[key] || [];
        flaggedStatus = flagged[key] || false;
      } else {
        userAns = answers[qIdx] || [];
        flaggedStatus = flagged[qIdx] || false;
      }
      // ✅ FIX: Normalize correct field before comparison (handles all question formats)
      const qCorrect = (() => {
        if (Array.isArray(q.correct) && q.correct.length > 0) return q.correct;
        if (Array.isArray(q.answer)  && q.answer.length  > 0) return q.answer;
        return (q.options || [])
          .map((o, i) => (o.isCorrect ? (o.id || String(i)) : null))
          .filter(Boolean);
      })();
      const isCorrect =
        qCorrect.length === userAns.length &&
        qCorrect.every((c) => userAns.includes(c)) &&
        userAns.every((a) => qCorrect.includes(a));
      if (isCorrect) correct++;
      return {
        question: q.text,
        userAnswer: userAns,
        correctAnswer: q.correct,
        isCorrect,
        domain: q.domain,
        options: q.options,
        explanation: q.explanation,
        flagged: flaggedStatus,
        imageUrl: q.imageUrl || null,
        questionHtml: q.text || null,
      };
    });

    const score = Math.round((correct / questions.length) * 100);
    const passingScore = mode === "review" ? reviewSettings.passingScore : (exam.passScore || 70);
    const pass = score >= passingScore;
    const timeTaken = Math.round((Date.now() - started) / 1000);

    // isLimited: came from ExamDetail when user has partial access
    const isLimited = quizData.isLimited || false;
    const fullExamTotal = quizData.fullExamTotal || quizData.exam?.totalQuestions || null;

    const result = {
      examId: exam.id,
      examTitle: exam.title,
      examColor: exam.color,
      examLogo: exam.logo,
      examSubtitle: exam.subtitle,
      userId: user?.uid || "guest",
      userName: user?.displayName || profile?.name || "Guest",
      score: isGuest ? null : score,
      pass: isGuest ? null : pass,
      correct: isGuest ? null : correct,
      guestScore: isGuest ? score : null,
      guestCorrect: isGuest ? correct : null,
      guestTotal: isGuest ? questions.length : null,
      guestTime: isGuest ? timeTaken : null,
      total: questions.length,
      totalQuestions: questions.length,
      timeTaken: isGuest ? null : timeTaken,
      mode,
      modeLabel: mode === "review" ? "Review Mode" : mode === "examSimulation" ? "Exam Simulation" : "Full Practice Set",
      details: isGuest ? null : details,
      date: new Date().toLocaleDateString(),
      passingScore: isGuest ? null : passingScore,
      isLimited,
      fullExamTotal: isLimited ? fullExamTotal : null,
    };

    if (user && user.uid !== "guest") {
      try {
        await saveResult(result);
        await clearExamProgress(user.uid, exam.id);

        // #21 Update leaderboard stats
        try {
          await updateLeaderboardStats(user.uid, {
            score:          result.score,
            totalQuestions: result.totalQuestions || questions.length,
            passed:         result.passed,
            userName:       user.displayName || profile?.name || "Anonymous",
            avatar:         user.photoURL    || "",
            country:        profile?.country || "",
          });
        } catch (le) { console.warn("Leaderboard update failed:", le); }

      } catch (e) {
        console.error("Save error:", e);
      }
    }

    localStorage.removeItem(getLocalProgressKey());
    setResultData(result);
    setSaving(false);
    setPage("result");
  }, [answers, flagged, questions, exam, user, profile, started, mode, reviewSettings, isSegmented, totalParts, setPage, setResultData, getLocalProgressKey]);

  const handleContinueNextPart = async () => {
    await saveProgressToFirestore();
    if (currentPart < totalParts - 1) {
      setCurrentPart(currentPart + 1);
      setCurrent(0);
      setShowPartComplete(false);
      setTimeLeft(getPartDuration());
      showToast({ msg: `✅ Started Part ${currentPart + 2}`, type: "success" });
    }
  };

  const handleContinueLater = async () => {
    if (!user) {
      showToast({ msg: "⚠️ Sign in to save progress", type: "warning" });
      return;
    }
    setSaving(true);
    try {
      await saveProgressToFirestore();
      localStorage.removeItem(getLocalProgressKey());
      const savedPart = showPartComplete ? currentPart + 1 : currentPart;
      const msg = showPartComplete
        ? `✅ Progress saved! Resuming from Part ${savedPart + 1}`
        : `✅ Progress saved! Part ${currentPart + 1} will restart from Q1 when you return`;
      showToast({ msg, type: "success" });
      setTimeout(() => {
        setSaving(false);
        setPage("home");
      }, 1000);
    } catch (err) {
      console.error("Error saving progress:", err);
      showToast({ msg: `❌ Failed to save: ${err.message}`, type: "error" });
      setSaving(false);
    }
  };

  const handleExitQuiz = () => setShowExitConfirm(true);
  const confirmExit = () => {
    setShowExitConfirm(false);
    setPage("exam-detail");
  };

  // ========== Resume choice modal ==========
  if (showResumeChoice) {
    return (
      <Modal title="📝 Resume Exam?" onClose={() => {}}>
        <div style={{ textAlign: "center", padding: "8px 0 20px" }}>
          <p style={{ fontSize: 15, color: "var(--text2)", marginBottom: 28, lineHeight: 1.7 }}>
            You have a previous attempt in progress.<br />
            Would you like to continue from where you left off,<br />
            or start a completely new attempt?
          </p>
          <div style={{ display: "flex", gap: 12, flexDirection: "column" }}>
            <Btn
              full
              onClick={handleResumeContinue}
              style={{
                background: "linear-gradient(135deg, var(--accent), #6366f1)",
                borderColor: "transparent",
                justifyContent: "center",
              }}
            >
              📌 Continue from where I left off
            </Btn>
            <Btn
              full
              variant="outline"
              onClick={handleResumeStartOver}
              style={{
                borderColor: "var(--red)",
                color: "var(--red)",
                justifyContent: "center",
              }}
            >
              🔄 Start a new attempt (discard previous progress)
            </Btn>
          </div>
        </div>
      </Modal>
    );
  }

  if (saving) {
    return (
      <div style={{
        position: "fixed", inset: 0, background: "var(--bg)",
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", zIndex: 999, gap: 12,
      }}>
        <Spinner size={40} color="var(--accent)" />
        <p style={{ color: "var(--text2)", fontSize: 14 }}>Processing your results...</p>
      </div>
    );
  }

  // ✅ FIX: Guard against empty/missing questions (prevents white screen)
  if (!questions || questions.length === 0) {
    return (
      <div style={{ maxWidth: 600, margin: "80px auto", textAlign: "center", padding: "0 24px" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
        <h2 style={{ color: "var(--text)", marginBottom: 12 }}>No Questions Found</h2>
        <p style={{ color: "var(--text2)", marginBottom: 24, lineHeight: 1.6 }}>
          This exam has no questions yet. Please add questions from the Admin panel first.
        </p>
        <button
          onClick={() => setPage("exam-detail")}
          style={{ padding: "12px 28px", background: "var(--accent)", border: "none", borderRadius: 12, color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: 14, fontFamily: "inherit" }}
        >
          ← Back
        </button>
      </div>
    );
  }

  // ✅ FIX: Guard against null current question (prevents white screen crash)
  if (!q) {
    return (
      <div style={{ maxWidth: 600, margin: "80px auto", textAlign: "center", padding: "0 24px" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔄</div>
        <h2 style={{ color: "var(--text)", marginBottom: 12 }}>Loading Question…</h2>
        <p style={{ color: "var(--text2)", marginBottom: 24 }}>Please wait a moment.</p>
        <Spinner size={32} color="var(--accent)" />
      </div>
    );
  }

  const userAnswerKey = isSegmented ? `${currentPart}-${current}` : current;
  const userAns = answers[userAnswerKey] || [];
  const isRevealed = (mode === "review" || isGuest) && revealed[userAnswerKey];
  const answered = Object.keys(answers).length;
  const flagCount = Object.values(flagged).filter(Boolean).length;
  const isMultiSelect = q?.type === "multi" || q?.type === "multi-select";
  const examColor = exam.color || "var(--accent)";
  const timeWarning = (mode === "examSimulation" || mode === "review") && duration > 0 && timeLeft < 300;

  if (showExitConfirm) {
    return (
      <Modal title="⚠️ Exit Exam?" onClose={() => setShowExitConfirm(false)}>
        <div style={{ textAlign: "center", paddingBottom: 20 }}>
          <p style={{ fontSize: 15, color: "var(--text2)", marginBottom: 24, lineHeight: 1.7 }}>
            Are you sure you want to exit? Your progress will {isSegmented ? "be saved and you can continue later" : "not be saved"}.
          </p>
          <div style={{ display: "flex", gap: 10, flexDirection: "column" }}>
            <Btn full onClick={confirmExit} style={{ background: "linear-gradient(135deg, var(--red), #b91c1c)", borderColor: "transparent", justifyContent: "center" }}>
              <Icon n="logout" size={16} /> Yes, Exit Exam
            </Btn>
            <Btn full variant="ghost" onClick={() => setShowExitConfirm(false)}>No, Continue Exam</Btn>
          </div>
        </div>
      </Modal>
    );
  }

  if (showPartComplete && isSegmented && currentPart < totalParts) {
    const partNum = currentPart + 1;
    const nextPartQuestions = getQuestionsForPart(questions, currentPart + 1, totalParts);
    return (
      <div style={{ maxWidth: 600, margin: "0 auto", padding: "120px clamp(20px, 4vw, 36px)" }}>
        <div style={{ background: `linear-gradient(135deg, var(--surface) 0%, ${examColor}10 100%)`, border: `1.5px solid ${examColor}32`, borderRadius: 20, padding: "40px 32px", textAlign: "center", boxShadow: `0 4px 28px ${examColor}12` }}>
          <div style={{ fontSize: 56, marginBottom: 20, animation: "float 3.5s ease-in-out infinite", display: "inline-block" }}>✅</div>
          <h2 style={{ fontSize: "clamp(24px, 3vw, 32px)", fontWeight: 900, color: "var(--text)", marginBottom: 10 }}>Part {partNum} Complete!</h2>
          <p style={{ fontSize: 15, color: "var(--text2)", marginBottom: 28, lineHeight: 1.7 }}>
            You've completed <strong style={{ color: examColor }}>{getQuestionsForPart(questions, currentPart, totalParts).length} questions</strong>
          </p>
          <div style={{ background: "var(--bg3)", borderRadius: 12, padding: "16px 20px", marginBottom: 28 }}>
            <div style={{ fontSize: 12, color: "var(--text3)", marginBottom: 8, fontWeight: 600 }}>Next: Part {partNum + 1}</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: examColor }}>{nextPartQuestions.length} questions remaining</div>
          </div>
          <div style={{ display: "flex", gap: 12, flexDirection: "column" }}>
            <Btn full onClick={handleContinueNextPart} style={{ background: `linear-gradient(135deg, ${examColor}, ${examColor}cc)`, borderColor: "transparent", justifyContent: "center" }}>
              <Icon n="arrow_right" size={16} /> Continue to Part {partNum + 1}
            </Btn>
            <Btn full variant="ghost" onClick={handleContinueLater}><Icon n="clock" size={16} /> Continue Later</Btn>
            <Btn full variant="subtle" onClick={() => finishQuiz()}><Icon n="check" size={16} /> End Exam Now</Btn>
          </div>
          <p style={{ fontSize: 12, color: "var(--text3)", marginTop: 20 }}>Your progress is saved. You can return to continue anytime.</p>
        </div>
      </div>
    );
  }

  // ==================== MAIN QUIZ UI ====================
  // Helper to safely render HTML question text (with images and basic formatting)
  const renderQuestionText = () => {
    if (!q.text) return "";
    // Basic sanitization: remove script tags and on* attributes to prevent XSS
    let sanitized = q.text.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
    sanitized = sanitized.replace(/ on\w+="[^"]*"/gi, "");
    sanitized = sanitized.replace(/ on\w+='[^']*'/gi, "");
    return { __html: sanitized };
  };

  return (
    <div ref={containerRef} data-quiz-container style={{ maxWidth: 800, margin: "0 auto", padding: "0 clamp(12px, 3vw, 28px) 40px", userSelect: "none", position: "relative" }}>
      {/* Top Bar */}
      <div className="glass" style={{ position: "sticky", top: 74, zIndex: 90, borderBottom: "1px solid var(--border)", padding: "12px 0", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <ProgressBar value={current + 1} max={currentPartQuestions.length} color={`linear-gradient(90deg, ${examColor}, ${examColor}cc)`} height={5} />
            <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 5, fontWeight: 500 }}>
              {isSegmented && <>Part {currentPart + 1} of {totalParts} · </>}
              Question <strong style={{ color: "var(--text)" }}>{current + 1}</strong> of {currentPartQuestions.length}
              {answered > 0 && ` · ${answered} answered`}
              {flagCount > 0 && ` · ${flagCount} flagged`}
            </div>
          </div>
          {(mode === "examSimulation" || mode === "review") && !isGuest && user && duration > 0 && (
            <div style={{
              fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 18,
              color: timeWarning ? "var(--red)" : "var(--text)", padding: "6px 14px",
              background: timeWarning ? "rgba(220,38,38,0.1)" : "var(--bg2)",
              border: `1.5px solid ${timeWarning ? "rgba(220,38,38,0.3)" : "var(--border)"}`,
              borderRadius: 10, transition: "all 0.3s",
            }}>
              ⏱ {formatTime(timeLeft)}
            </div>
          )}
          <Btn variant="ghost" size="sm" onClick={toggleFullscreen} title={fullscreen ? "Exit fullscreen" : "Fullscreen"}><Icon n="menu" size={13} /></Btn>
          <Btn variant="ghost" size="sm" onClick={() => setShowNav(!showNav)}><Icon n="dashboard" size={13} /> Jump to</Btn>
          <Btn variant="ghost" size="sm" onClick={handleExitQuiz} title="Exit quiz" style={{ color: "var(--text3)" }}><Icon n="close" size={13} /></Btn>
        </div>
        {showNav && (
          <div style={{ paddingTop: 12, display: "flex", flexWrap: "wrap", gap: 6 }}>
            {currentPartQuestions.map((_, i) => {
              const isCurrent = i === current;
              const answerKey = isSegmented ? `${currentPart}-${i}` : i;
              const isAnswered = !!answers[answerKey];
              const isFlagged = !!flagged[answerKey];
              return (
                <button key={i} onClick={() => { setCurrent(i); setShowNav(false); }}
                  style={{
                    width: 36, height: 36, borderRadius: 8, border: "1.5px solid", fontSize: 11, fontWeight: 700,
                    cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s",
                    background: isCurrent ? examColor : isAnswered ? "rgba(5,150,105,0.15)" : isFlagged ? "rgba(217,119,6,0.15)" : "var(--bg2)",
                    borderColor: isCurrent ? examColor : isAnswered ? "var(--green)" : isFlagged ? "var(--gold)" : "var(--border)",
                    color: isCurrent ? "#fff" : isAnswered ? "var(--green)" : isFlagged ? "var(--gold)" : "var(--text3)",
                  }}
                >{i+1}</button>
              );
            })}
          </div>
        )}
      </div>

      {/* Question Card */}
      <div style={{ background: "var(--bg2)", border: "1.5px solid var(--border)", borderRadius: 20, padding: "20px 24px", marginBottom: 12, boxShadow: "var(--card-shadow)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14, gap: 12 }}>
          <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
            <span style={{ fontSize: 10, color: "var(--text3)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>Q{current+1}</span>
            {q.domain && <span style={{ fontSize: 10, background: "var(--accent-soft)", color: "var(--accent)", padding: "2px 9px", borderRadius: 99, fontWeight: 700 }}>{q.domain}</span>}
            {q.type === "multi" && <span style={{ fontSize: 10, background: "rgba(217,119,6,0.12)", color: "var(--gold)", padding: "2px 9px", borderRadius: 99, fontWeight: 700 }}>Multiple answers</span>}
            {flagged[userAnswerKey] && <span style={{ fontSize: 10, background: "rgba(217,119,6,0.12)", color: "var(--gold)", padding: "2px 9px", borderRadius: 99 }}>🚩 Flagged</span>}
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={toggleFlag} title="Flag for review" style={{
              background: flagged[userAnswerKey] ? "rgba(217,119,6,0.12)" : "transparent",
              border: `1.5px solid ${flagged[userAnswerKey] ? "rgba(217,119,6,0.4)" : "var(--border)"}`,
              color: flagged[userAnswerKey] ? "var(--gold)" : "var(--text3)",
              cursor: "pointer", fontSize: 15, padding: "5px 8px", borderRadius: 8, fontFamily: "inherit", transition: "all 0.2s",
            }}>🚩</button>
          </div>
        </div>

        {/* === UPDATED: Render question text as HTML with images === */}
        <div
          style={{
            fontSize: "clamp(15px, 2vw, 17px)",
            fontWeight: 600,
            color: "var(--text)",
            lineHeight: 1.8,
            marginBottom: q.imageUrl ? 14 : 20,
            direction: /[\u0600-\u06FF]/.test(stripHtml(q.text || "")) ? "rtl" : "ltr",
            textAlign: /[\u0600-\u06FF]/.test(stripHtml(q.text || "")) ? "right" : "left",
          }}
        >
          {/* Images inside question text will be rendered via dangerouslySetInnerHTML */}
<div className="question-html-content" dangerouslySetInnerHTML={renderQuestionText()} />
        </div>

        {/* Legacy separate image field (if any) */}
        {q.imageUrl && (
          <div style={{ marginBottom: 20, borderRadius: 12, overflow: "hidden", border: "1.5px solid var(--border)" }}>
            <img src={q.imageUrl} alt="Question illustration" style={{ width: "100%", maxHeight: 320, objectFit: "contain", display: "block", background: "var(--bg3)" }} />
          </div>
        )}

        {isMultiSelect && (() => {
          const requiredCount = q.correct?.length || 2;
          const selectedCount = userAns.length;
          const remaining = requiredCount - selectedCount;
          const isComplete = selectedCount >= requiredCount;
          return (
            <div style={{
              background: isComplete ? "rgba(5,150,105,0.08)" : "rgba(217,119,6,0.08)",
              border: `1.5px solid ${isComplete ? "rgba(5,150,105,0.3)" : "rgba(217,119,6,0.2)"}`,
              borderRadius: 10, padding: "10px 14px", marginBottom: 16, fontSize: 12,
              color: isComplete ? "var(--green)" : "var(--gold)", fontWeight: 600,
              display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap",
            }}>
              <span>{isComplete ? `✅ Selected ${selectedCount} of ${requiredCount} — you can proceed` : `⚠️ You must select ${requiredCount} answers — select ${remaining} more`}</span>
              <div style={{ display: "flex", gap: 4 }}>
                {Array.from({ length: requiredCount }).map((_, i) => (
                  <div key={i} style={{ width: 10, height: 10, borderRadius: "50%", background: i < selectedCount ? (isComplete ? "var(--green)" : "var(--gold)") : "var(--border)", transition: "all 0.2s" }} />
                ))}
              </div>
            </div>
          );
        })()}

        {(mode === "review" || isGuest) && (
          <div style={{ marginBottom: 16 }}>
            <Btn variant="outline" size="sm" onClick={revealAnswer} style={{ justifyContent: "center", borderColor: "var(--green)", color: "var(--green)" }}>👁️ Show Correct Answer</Btn>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {q.options?.map((opt) => {
            const selected = userAns.includes(opt.id);
            const isCorrect = q.correct.includes(opt.id);
            let bg = "var(--bg3)", border = "var(--border)", textColor = "var(--text)";
            if (isRevealed) {
              if (isCorrect) { bg = "rgba(5,150,105,0.1)"; border = "var(--green)"; }
              else if (selected) { bg = "rgba(220,38,38,0.1)"; border = "var(--red)"; }
            } else if (selected) { bg = `${examColor}12`; border = examColor; }
            return (
              <div key={opt.id} onClick={() => selectOption(opt.id)}
                style={{
                  padding: "12px 16px", borderRadius: 12, border: `1.5px solid ${border}`, background: bg,
                  cursor: "pointer", transition: "all 0.15s ease", display: "flex", alignItems: "flex-start", gap: 14,
                }}
                onMouseEnter={(e) => { if (!selected && !isRevealed) { e.currentTarget.style.borderColor = `${examColor}70`; e.currentTarget.style.background = `${examColor}07`; } }}
                onMouseLeave={(e) => { if (!selected && !isRevealed) { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.background = "var(--bg3)"; } }}
              >
                <div style={{
                  width: 28, height: 28, borderRadius: (q?.type === "multi" || q?.type === "multi-select") ? 7 : "50%",
                  border: `2px solid ${isRevealed && isCorrect ? "var(--green)" : isRevealed && selected ? "var(--red)" : selected ? examColor : "var(--border)"}`,
                  background: isRevealed && isCorrect ? "var(--green)" : isRevealed && selected ? "var(--red)" : selected ? examColor : "transparent",
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.15s", color: "#fff", fontSize: 12, fontWeight: 800,
                }}>
                  {isRevealed && isCorrect ? "✓" : isRevealed && selected ? "✕" : selected ? "✓" : null}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, lineHeight: 1.65, color: textColor, direction: /[\u0600-\u06FF]/.test(opt.text || "") ? "rtl" : "ltr", textAlign: /[\u0600-\u06FF]/.test(opt.text || "") ? "right" : "left" }}>{opt.text}</div>
                  {isRevealed && opt.explanation && <div style={{ fontSize: 12, marginTop: 8, color: isCorrect ? "var(--green)" : "var(--red)", lineHeight: 1.6 }}>{opt.explanation}</div>}
                </div>
              </div>
            );
          })}
        </div>
        {isRevealed && q.explanation && (
          <div style={{ marginTop: 16, background: "var(--accent-soft)", border: "1.5px solid rgba(37,99,235,0.2)", borderRadius: 12, padding: "14px 16px" }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: "var(--accent)", marginBottom: 6, textTransform: "uppercase" }}>💡 Answer Explanation</div>
            <div style={{ fontSize: 13, color: "var(--text2)", lineHeight: 1.8, direction: /[\u0600-\u06FF]/.test(q.explanation || "") ? "rtl" : "ltr" }} dangerouslySetInnerHTML={{ __html: q.explanation }} />
          </div>
        )}
      </div>

      {/* Navigation */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", marginTop: 8 }}>
        <Btn variant="ghost" onClick={() => setCurrent((c) => c - 1)} disabled={current === 0}>← Previous</Btn>
        <div style={{ display: "flex", gap: 10 }}>
          {current < currentPartQuestions.length - 1 ? (
            <Btn onClick={() => {
              if (isMultiSelect && !isRevealed && mode !== "review") {
                const required = q.correct?.length || 2;
                if (userAns.length < required) {
                  showToast({ msg: `⚠️ You must select ${required} answers`, type: "warning" });
                  return;
                }
              }
              setCurrent((c) => c + 1);
            }} style={{
              background: isMultiSelect && !isRevealed && mode !== "review" && userAns.length < (q.correct?.length || 2) ? "var(--bg3)" : `linear-gradient(135deg, ${examColor}, ${examColor}cc)`,
              borderColor: isMultiSelect && !isRevealed && mode !== "review" && userAns.length < (q.correct?.length || 2) ? "var(--border)" : "transparent",
              color: isMultiSelect && !isRevealed && mode !== "review" && userAns.length < (q.correct?.length || 2) ? "var(--text3)" : undefined,
            }}>Next →</Btn>
          ) : isSegmented && currentPart < totalParts - 1 ? (
            <Btn onClick={() => {
              if (isMultiSelect && !isRevealed && mode !== "review") {
                const required = q.correct?.length || 2;
                if (userAns.length < required) {
                  showToast({ msg: `⚠️ You must select ${required} answers`, type: "warning" });
                  return;
                }
              }
              setShowPartComplete(true);
            }} style={{
              background: isMultiSelect && !isRevealed && mode !== "review" && userAns.length < (q.correct?.length || 2) ? "var(--bg3)" : `linear-gradient(135deg, ${examColor}, ${examColor}cc)`,
              borderColor: isMultiSelect && !isRevealed && mode !== "review" && userAns.length < (q.correct?.length || 2) ? "var(--border)" : "transparent",
              color: isMultiSelect && !isRevealed && mode !== "review" && userAns.length < (q.correct?.length || 2) ? "var(--text3)" : undefined,
            }}>✅ Complete Part {currentPart + 1}</Btn>
          ) : (
            <Btn onClick={() => {
              const unanswered = currentPartQuestions.length - Object.keys(answers).filter(k => isSegmented ? k.startsWith(`${currentPart}-`) : true).length;
              if (unanswered > 0 && !isGuest) {
                if (!window.confirm(`You have ${unanswered} unanswered question(s). Finish anyway?`)) return;
              }
              finishQuiz();
            }} style={{ background: "linear-gradient(135deg, var(--green), #047857)", borderColor: "transparent" }}>✅ Finish Exam</Btn>
          )}
        </div>
      </div>

      {/* Guest Signup Modal */}
      {showGuestSignupModal && isGuest && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(16px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", animation: "fadeIn 0.3s ease" }}>
          <div style={{ background: "var(--bg2)", borderRadius: 32, padding: "clamp(28px,5vw,48px) clamp(24px,6vw,48px)", maxWidth: 600, width: "100%", maxHeight: "90vh", overflowY: "auto", border: "1px solid rgba(255,255,255,0.12)", boxShadow: "0 40px 90px rgba(0,0,0,0.5)", textAlign: "center", animation: "scaleIn 0.35s ease" }}>
            <div style={{ width: "clamp(70px,15vw,90px)", height: "clamp(70px,15vw,90px)", margin: "0 auto 20px", background: "linear-gradient(135deg, #4f46e5, #7c3aed)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 12px 32px rgba(79,70,229,0.4)" }}>
              <span style={{ fontSize: "clamp(38px,8vw,50px)" }}>🎓</span>
            </div>
            <h2 style={{ fontSize: "clamp(24px,5vw,32px)", fontWeight: 800, color: "var(--text)", marginBottom: 12 }}>Unlock Your Full Potential!</h2>
            <p style={{ fontSize: "clamp(14px,3vw,16px)", color: "var(--text2)", marginBottom: 28, lineHeight: 1.6 }}>
              You've reached the guest preview limit. Sign up free to continue and get your <strong style={{ color: "var(--accent)" }}>verified certificate</strong>!
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, marginBottom: 28, textAlign: "left" }}>
              {[
                { icon: "🏆", text: "Earn verified certificates", color: "#fbbf24" },
                { icon: "📊", text: "Track your performance", color: "#60a5fa" },
                { icon: "💾", text: "Save progress & results", color: "#34d399" },
                { icon: "🚀", text: "Unlimited exam access", color: "#f472b6" },
                { icon: "🔄", text: "Retake & review anytime", color: "#a78bfa" },
                { icon: "🎯", text: "Personalized learning path", color: "#fb923c" },
              ].map((item) => (
                <div key={item.text} style={{ display: "flex", alignItems: "center", gap: 12, background: "rgba(255,255,255,0.03)", borderRadius: 16, padding: "12px 16px" }}>
                  <div style={{ width: 38, height: 38, borderRadius: 40, background: `linear-gradient(145deg, ${item.color}20, ${item.color}08)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>{item.icon}</div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text2)", lineHeight: 1.4 }}>{item.text}</span>
                </div>
              ))}
            </div>
            <div style={{ background: "linear-gradient(105deg, rgba(79,70,229,0.18), rgba(124,58,237,0.08))", border: "1px solid rgba(99,102,241,0.5)", borderRadius: 20, padding: "14px 20px", marginBottom: 28, fontSize: "clamp(13px,3vw,14px)", color: "var(--accent)", fontWeight: 700 }}>
              ✨ Create an account to see your full score & download your certificate!
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <button onClick={handleGuestSignupAndFinish} disabled={isFinishingGuest}
                style={{ padding: "16px 24px", borderRadius: 60, border: "none", cursor: "pointer", background: "linear-gradient(105deg, #4f46e5, #7c3aed)", color: "#fff", fontSize: 16, fontWeight: 800, fontFamily: "inherit", boxShadow: "0 12px 28px rgba(79,70,229,0.45)", opacity: isFinishingGuest ? 0.7 : 1 }}>
                {isFinishingGuest ? "Processing..." : "🚀 Sign Up & See My Results"}
              </button>
              <button onClick={() => { setShowGuestSignupModal(false); setPage("exams"); }}
                style={{ padding: "12px 24px", borderRadius: 60, cursor: "pointer", background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)", color: "var(--text2)", fontSize: 14, fontWeight: 600, fontFamily: "inherit" }}>
                Continue as Guest
              </button>
            </div>
            <p style={{ fontSize: 12, color: "var(--text3)", marginTop: 24 }}>Free forever · No credit card · 2 min setup</p>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.92); } to { opacity: 1; transform: scale(1); } }
        @media print { body { display: none !important; } }
        .quiz-no-select { -webkit-user-select: none; -moz-user-select: none; -ms-user-select: none; user-select: none; }
        /* Anti-cheat: prevent text selection and drag across entire quiz */
        [data-quiz-container] *:not(input):not(textarea):not(button) {
          -webkit-user-select: none !important;
          -moz-user-select: none !important;
          -ms-user-select: none !important;
          user-select: none !important;
        }
        [data-quiz-container] img {
          pointer-events: none;
          -webkit-user-drag: none;
          user-drag: none;
        }
        /* Ensure images inside question text are responsive and don't break layout */
        [data-quiz-container] .question-html-content img {
          max-width: 100%;
          height: auto;
          border-radius: 12px;
          margin: 12px 0;
          border: 1px solid var(--border);
          background: var(--bg3);
          display: block;
        }
      ` }} />
    </div>
  );
}
