/**
 * Result.jsx — ExamPro Result Page
 * ✅ مع إضافة شاشة منبثقة تحفيزية للزائر بعد إتمام الاختبار (بالإنجليزية وتحسينات للأجهزة المحمولة)
 */

import React, { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { Btn, Tag, ProgressBar } from "../components/UI";
import { submitQuestionReport } from "../services/firestore";
import Certificate from "../components/Certificate";

/* ─── Animated SVG Icons (نفس الكود السابق) ─────────────────────────────── */
const AnimIcon = ({ type, size = 24, color = "var(--accent)", animate = false }) => {
  const base = { width: size, height: size, display: "inline-block", verticalAlign: "middle" };
  const icons = {
    trophy: (
      <svg style={base} viewBox="0 0 24 24" fill="none">
        <style>{`@keyframes trophy-bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}`}</style>
        <g style={animate ? { animation: "trophy-bounce 1.6s ease-in-out infinite" } : {}}>
          <path d="M7 3h10v8a5 5 0 0 1-10 0V3z" fill={color} opacity=".9"/>
          <path d="M17 5h4v2a4 4 0 0 1-4 4M7 5H3v2a4 4 0 0 0 4 4" stroke={color} strokeWidth="1.5" fill="none"/>
          <path d="M12 16v3M8 22h8M10 19h4" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M10 7l.5 1.5L12 9l-1.5.5L10 11l-.5-1.5L8 9l1.5-.5z" fill="#fff" opacity=".8"/>
        </g>
      </svg>
    ),
    book: (
      <svg style={base} viewBox="0 0 24 24" fill="none">
        <path d="M4 19V6a2 2 0 0 1 2-2h13a1 1 0 0 1 1 1v13" stroke={color} strokeWidth="1.5"/>
        <path d="M4 19a2 2 0 0 0 2 2h13a1 1 0 0 0 1-1v-1" stroke={color} strokeWidth="1.5"/>
        <path d="M8 10h8M8 14h5" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    checkCircle: (
      <svg style={base} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" fill={color} opacity=".12"/>
        <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="1.8"/>
        <path d="M7.5 12l3 3 6-6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      </svg>
    ),
    xCircle: (
      <svg style={base} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" fill={color} opacity=".12"/>
        <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="1.8"/>
        <path d="M15 9l-6 6M9 9l6 6" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
    download: (
      <svg style={base} viewBox="0 0 24 24" fill="none">
        <path d="M12 3v12M8 11l4 4 4-4" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M5 20h14" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
    ),
    chart: (
      <svg style={base} viewBox="0 0 24 24" fill="none">
        <rect x="3" y="12" width="4" height="9" rx="1" fill={color} opacity=".5"/>
        <rect x="10" y="7" width="4" height="14" rx="1" fill={color} opacity=".75"/>
        <rect x="17" y="3" width="4" height="18" rx="1" fill={color}/>
      </svg>
    ),
    clock: (
      <svg style={base} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="1.8"/>
        <path d="M12 7v5l3 2" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    target: (
      <svg style={base} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="1.5" opacity=".4"/>
        <circle cx="12" cy="12" r="6"  stroke={color} strokeWidth="1.5" opacity=".65"/>
        <circle cx="12" cy="12" r="2"  fill={color}/>
      </svg>
    ),
    flag: (
      <svg style={base} viewBox="0 0 24 24" fill="none">
        <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" fill={color} opacity=".2" stroke={color} strokeWidth="1.5"/>
        <path d="M4 22v-7" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
    ),
    refresh: (
      <svg style={base} viewBox="0 0 24 24" fill="none">
        <path d="M23 4v6h-6" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    grid: (
      <svg style={base} viewBox="0 0 24 24" fill="none">
        <rect x="3"  y="3"  width="7" height="7" rx="1.5" fill={color} opacity=".6"/>
        <rect x="14" y="3"  width="7" height="7" rx="1.5" fill={color} opacity=".6"/>
        <rect x="3"  y="14" width="7" height="7" rx="1.5" fill={color} opacity=".6"/>
        <rect x="14" y="14" width="7" height="7" rx="1.5" fill={color} opacity=".6"/>
      </svg>
    ),
    star: (
      <svg style={base} viewBox="0 0 24 24">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" fill={color}/>
      </svg>
    ),
    userPlus: (
      <svg style={base} viewBox="0 0 24 24" fill="none">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
        <circle cx="12" cy="7" r="4" stroke={color} strokeWidth="1.8"/>
        <line x1="19" y1="8"  x2="19" y2="14" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
        <line x1="16" y1="11" x2="22" y2="11" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
    ),
    lightbulb: (
      <svg style={base} viewBox="0 0 24 24" fill="none">
        <path d="M9 21h6M12 3a6 6 0 0 1 6 6c0 2.22-1.21 4.16-3 5.2V18H9v-3.8A6.003 6.003 0 0 1 6 9a6 6 0 0 1 6-6z"
              fill={color} opacity=".2" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M10 18h4" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    lock: (
      <svg style={base} viewBox="0 0 24 24" fill="none">
        <rect x="5" y="11" width="14" height="10" rx="2" fill={color} opacity=".2" stroke={color} strokeWidth="1.5"/>
        <path d="M8 11V7a4 4 0 0 1 8 0v4" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
        <circle cx="12" cy="16" r="1.5" fill={color}/>
      </svg>
    ),
    shield: (
      <svg style={base} viewBox="0 0 24 24" fill="none">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill={color} opacity=".15" stroke={color} strokeWidth="1.5"/>
        <path d="M9 12l2 2 4-4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    zap: (
      <svg style={base} viewBox="0 0 24 24" fill="none">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" fill={color} opacity=".2" stroke={color} strokeWidth="1.5" strokeLinejoin="round"/>
      </svg>
    ),
    infinity: (
      <svg style={base} viewBox="0 0 24 24" fill="none">
        <path d="M12 12c-2-2.5-4-4-6-4a4 4 0 0 0 0 8c2 0 4-1.5 6-4zm0 0c2 2.5 4 4 6 4a4 4 0 0 0 0-8c-2 0-4 1.5-6 4z"
              stroke={color} strokeWidth="1.8" fill={color} opacity=".15"/>
      </svg>
    ),
    gift: (
      <svg style={base} viewBox="0 0 24 24" fill="none">
        <polyline points="20 12 20 22 4 22 4 12" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <rect x="2" y="7" width="20" height="5" rx="1" fill={color} opacity=".15" stroke={color} strokeWidth="1.5"/>
        <path d="M12 22V7M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  };
  return icons[type] || icons.flag;
};

/* ─── Score Circle (نفس السابق) ─────────────────────────────────────────── */
const SimpleScoreCircle = ({ value, size = 120, strokeWidth = 9, color }) => {
  const radius        = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset        = circumference - (value / 100) * circumference;
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={strokeWidth}/>
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round" transform={`rotate(-90 ${size/2} ${size/2})`}
          style={{ transition: "stroke-dashoffset 0.8s cubic-bezier(0.16,1,0.3,1)" }}
        />
      </svg>
      <div style={{
        position: "absolute", top: 0, left: 0, width: "100%", height: "100%",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      }}>
        <span style={{ fontSize: 28, fontWeight: 800 }}>{value}%</span>
        <span style={{ fontSize: 11, opacity: 0.65, marginTop: 2 }}>Score</span>
      </div>
    </div>
  );
};

/* ─── Guest Signup CTA (نفس السابق) ─────────────────────────────────────── */
function GuestSignupCTA({ displayPass, displayScore, displayTotal, color, setPage }) {
  const [hovered, setHovered] = useState(null);

  const perks = [
    {
      icon: "shield",
      color: "#6366f1",
      bg: "rgba(99,102,241,0.1)",
      border: "rgba(99,102,241,0.2)",
      title: "Verifiable Certificates",
      desc: "Get official PDF certificates with QR code for every exam you pass",
    },
    {
      icon: "chart",
      color: "#0891b2",
      bg: "rgba(8,145,178,0.1)",
      border: "rgba(8,145,178,0.2)",
      title: "Track Progress Over Time",
      desc: "Personal dashboard showing your results and improvement in each domain",
    },
    {
      icon: "infinity",
      color: "#059669",
      bg: "rgba(5,150,105,0.1)",
      border: "rgba(5,150,105,0.2)",
      title: "Unlimited Access to All Exams",
      desc: "1000+ up-to-date questions across all tracks",
    },
    {
      icon: "zap",
      color: "#d97706",
      bg: "rgba(217,119,6,0.1)",
      border: "rgba(217,119,6,0.2)",
      title: "Resume Where You Left Off",
      desc: "Save your progress and continue from any device anytime",
    },
  ];

  return (
    <div style={{
      background: "var(--bg2)",
      border: "1.5px solid var(--border)",
      borderRadius: 28,
      overflow: "hidden",
      marginBottom: 28,
      animation: "fadeSlideIn .5s .15s ease both",
    }}>
      <div style={{
        background: displayPass
          ? "linear-gradient(135deg, #059669 0%, #047857 100%)"
          : "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
        padding: "32px 28px 28px",
        textAlign: "center",
        position: "relative",
        overflow: "hidden",
      }}>
        <div style={{ position:"absolute", top:-40, right:-40, width:150, height:150, borderRadius:"50%", background:"rgba(255,255,255,0.06)", pointerEvents:"none" }}/>
        <div style={{ position:"absolute", bottom:-30, left:-30, width:120, height:120, borderRadius:"50%", background:"rgba(255,255,255,0.05)", pointerEvents:"none" }}/>

        <div style={{ fontSize: 48, marginBottom: 12 }}>
          {displayPass ? "🎓" : "🚀"}
        </div>
        <h2 style={{
          fontSize: "clamp(20px,3.5vw,26px)",
          fontWeight: 900,
          color: "#ffffff",
          margin: "0 0 10px",
          lineHeight: 1.2,
        }}>
          {displayPass
            ? "You passed the exam! Get your certificate now"
            : "You're on the right track — don't stop here!"}
        </h2>
        <p style={{
          fontSize: 14, color: "rgba(255,255,255,0.85)",
          maxWidth: 480, margin: "0 auto 20px", lineHeight: 1.7,
        }}>
          {displayPass
            ? `You scored ${displayScore}% on ${displayTotal} questions as a guest. Sign up now to download your official certificate and save your progress forever.`
            : `You scored ${displayScore}% on ${displayTotal} questions as a guest. Creating a free account gives you full access and a personalized study plan.`}
        </p>

        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          background: "rgba(255,255,255,0.15)",
          borderRadius: 99, padding: "6px 16px",
          fontSize: 12, color: "#ffffff", fontWeight: 600,
        }}>
          <span>⭐⭐⭐⭐⭐</span>
          <span>Join 50,000+ learners</span>
        </div>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: 16,
        padding: "24px 24px 0",
      }}>
        {perks.map((perk, i) => (
          <div
            key={i}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
            style={{
              background: hovered === i ? perk.bg : "var(--bg3, rgba(0,0,0,0.03))",
              border: `1.5px solid ${hovered === i ? perk.border : "var(--border)"}`,
              borderRadius: 16,
              padding: "16px",
              transition: "all 0.2s ease",
              cursor: "default",
            }}
          >
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: perk.bg,
              border: `1px solid ${perk.border}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              marginBottom: 12,
            }}>
              <AnimIcon type={perk.icon} size={20} color={perk.color} />
            </div>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6, color: "var(--text)" }}>
              {perk.title}
            </div>
            <div style={{ fontSize: 12, color: "var(--text3)", lineHeight: 1.6 }}>
              {perk.desc}
            </div>
          </div>
        ))}
      </div>

      <div style={{ padding: "24px" }}>
        <button
          onClick={() => setPage("auth", { mode: "register" })}
          style={{
            width: "100%",
            padding: "16px 24px",
            background: "linear-gradient(135deg, #3a368d, #5b28b3)",
            color: "#fff",
            border: "none",
            borderRadius: 16,
            fontSize: 16,
            fontWeight: 800,
            cursor: "pointer",
            fontFamily: "inherit",
            letterSpacing: "0.3px",
            boxShadow: "0 8px 28px rgba(79,70,229,0.35)",
            transition: "transform .2s, box-shadow .2s",
            marginBottom: 12,
            position: "relative",
            overflow: "hidden",
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 12px 36px rgba(79,70,229,0.45)"; }}
          onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 8px 28px rgba(79,70,229,0.35)"; }}
        >
          <style>{`.cta-shimmer::after{content:'';position:absolute;inset:0;background:linear-gradient(90deg,transparent,rgba(255,255,255,.15),transparent);background-size:600px 100%;animation:cert-shimmer 2.5s linear infinite}`}</style>
          <span style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:10 }}>
            <AnimIcon type="userPlus" size={20} color="#fff" />
            Create free account — Start now
            <span style={{ fontSize: 18 }}>→</span>
          </span>
        </button>

        <button
          onClick={() => setPage("auth", { mode: "login" })}
          style={{
            width: "100%",
            padding: "12px 24px",
            background: "transparent",
            color: "var(--text2)",
            border: "1.5px solid var(--border)",
            borderRadius: 14,
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "inherit",
            transition: "all .2s",
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = "#4243ac"; e.currentTarget.style.color = "#3c3fce"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text2)"; }}
        >
          Already have an account — Sign in
        </button>

        <div style={{
          display: "flex", justifyContent: "center", gap: 20,
          marginTop: 16, flexWrap: "wrap",
        }}>
          {[
            { icon: "🔒", text: "100% Secure" },
            { icon: "🎁", text: "Completely Free" },
            { icon: "⚡", text: "Under 2 minutes" },
            { icon: "🚫", text: "No credit card" },
          ].map((b, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 5,
              fontSize: 11, color: "var(--text3)", fontWeight: 600,
            }}>
              <span>{b.icon}</span>
              <span>{b.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── المكون الرئيسي مع إضافة المنبثقة التحفيزية ─────────────────────────── */
export default function Result({ result, setPage, exams, showToast, setActiveExam }) {
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [showCert, setShowCert] = useState(false);
  const [reportState, setReportState] = useState({});
  const [reportFeedback, setReportFeedback] = useState({});
  const [submittingReport, setSubmittingReport] = useState({});
  const [showFlaggedOnly, setShowFlaggedOnly] = useState(false);
  
  // حالة المنبثقة التحفيزية للزائر
  const [showGuestPopup, setShowGuestPopup] = useState(true);

  useEffect(() => { 
    const t = setTimeout(() => setMounted(true), 50); 
    return () => clearTimeout(t); 
  }, []);

  // منع التمرير خلف المنبثقة عندما تكون ظاهرة
  useEffect(() => {
    if (showGuestPopup && !user) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [showGuestPopup, user]);

  if (!result) {
    return (
      <div style={{ textAlign: "center", padding: 80 }}>
        <Btn size="lg" onClick={() => setPage("home")}>Back to Home</Btn>
      </div>
    );
  }

  const {
    examTitle, examColor, examId,
    score, correct, total, timeTaken,
    details = [], mode, passingScore,
    guestScore, guestCorrect, guestTotal,
  } = result;

  const color = examColor || "var(--accent)";
  const isExamSim = mode === "examSimulation";
  const isGuest = !user;

  const displayScore = isGuest ? (guestScore ?? score ?? 0) : (score ?? 0);
  const displayCorrect = isGuest ? (guestCorrect ?? correct ?? 0) : (correct ?? 0);
  const displayTotal = isGuest ? (guestTotal ?? total ?? 0) : (total ?? 0);
  const effectivePassing = passingScore || 70;
  const displayPass = displayScore >= effectivePassing;
  const canShowCert = displayPass && isExamSim && user;

  const safeDetails = details || [];
  const flaggedIndices = safeDetails.reduce((arr, d, idx) => {
    if (d.flagged) arr.push(idx);
    return arr;
  }, []);

  const filteredDetails = showFlaggedOnly
    ? flaggedIndices.map(idx => ({ ...safeDetails[idx], originalIndex: idx }))
    : safeDetails.map((d, idx) => ({ ...d, originalIndex: idx }));

  const domainMap = {};
  (details || []).forEach(d => {
    if (!d.domain) return;
    if (!domainMap[d.domain]) domainMap[d.domain] = { correct: 0, total: 0 };
    domainMap[d.domain].total++;
    if (d.isCorrect) domainMap[d.domain].correct++;
  });

  const handleReportToggle = i => setReportState(p => ({ ...p, [i]: !p[i] }));

  const handleReportSubmit = async (d, i) => {
    const feedback = reportFeedback[i] || "";
    if (!feedback.trim()) return;
    setSubmittingReport(p => ({ ...p, [i]: true }));
    try {
      await submitQuestionReport(
        examId || result.examId, `q-${i}`,
        user?.uid || "guest", feedback, "", d.question || "", (d.userAnswer || []).join(", ")
      );
      showToast?.({ msg: `✅ Report for Q${i + 1} submitted!`, type: "success" });
      setReportState(p => ({ ...p, [i]: false }));
      setReportFeedback(p => ({ ...p, [i]: "" }));
    } catch {
      showToast?.({ msg: "✅ Report submitted, thank you!", type: "success" });
      setReportState(p => ({ ...p, [i]: false }));
    }
    setSubmittingReport(p => ({ ...p, [i]: false }));
  };

  const formatTime = s => {
    if (!s) return "—";
    return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
  };

  const examObj = exams?.find(e => e.id === examId);

  const handleRetake = () => {
    if (typeof setActiveExam !== "function") {
      console.error("setActiveExam is not a function");
      showToast?.({ msg: "Technical error: setActiveExam missing", type: "error" });
      return;
    }
    if (typeof setPage !== "function") {
      console.error("setPage is not a function");
      showToast?.({ msg: "Technical error: setPage missing", type: "error" });
      return;
    }

    const examData = {
      id: examId,
      title: examTitle,
      color: examColor,
      duration: 60,
      passScore: passingScore || 70,
      isActive: true,
      updatedAt: { toDate: () => new Date() },
    };
    setActiveExam(examData);
    setPage("exam-detail");
  };

  // إغلاق المنبثقة
  const closePopup = () => setShowGuestPopup(false);

  return (
    <div style={{
      maxWidth: 900,
      margin: "0 auto",
      padding: "36px clamp(16px,4vw,36px) 80px",
      opacity: mounted ? 1 : 0,
      transform: mounted ? "translateY(0)" : "translateY(20px)",
      transition: "all 0.5s cubic-bezier(0.16,1,0.3,1)",
      position: "relative",
    }}>
      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.9); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes cert-shimmer {
          0%   { background-position: -600% 0; }
          100% { background-position:  600% 0; }
        }
        @keyframes modalFadeIn {
          from { opacity: 0; backdrop-filter: blur(0); }
          to   { opacity: 1; backdrop-filter: blur(4px); }
        }
        @keyframes modalSlideUp {
          from { opacity: 0; transform: translateY(40px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .result-card { animation: scaleIn 0.45s cubic-bezier(0.16,1,0.3,1) forwards; }
        .q-card { animation: fadeSlideIn 0.35s ease both; }
        .q-card:hover { transform: translateY(-2px); box-shadow: 0 8px 32px rgba(0,0,0,.15); }
        .result-stat { transition: transform 0.2s; }
        .result-stat:hover { transform: scale(1.04); }
      `}</style>

      {/* المنبثقة التحفيزية للزائر - تظهر فقط للمستخدم غير المسجل وأول مرة - تحسينات للأجهزة المحمولة */}
      {isGuest && showGuestPopup && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0,0,0,0.75)",
          backdropFilter: "blur(4px)",
          zIndex: 1000,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          animation: "modalFadeIn 0.3s ease-out",
          padding: "16px", // حشوة أصغر على المحمول
        }}>
          <div style={{
            maxWidth: 520,
            width: "100%",
            maxHeight: "90vh", // منع تجاوز الشاشة
            overflowY: "auto", // تمرير إذا كان المحتوى طويلاً جداً
            background: "var(--bg2)",
            borderRadius: 32,
            boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)",
            position: "relative",
                        top: -540,

            animation: "modalSlideUp 0.4s cubic-bezier(0.16,1,0.3,1)",
            border: "1px solid var(--border)",
          }}>
            {/* زر الإغلاق */}
            <button
              onClick={closePopup}
              style={{
                position: "absolute",
                top: 12,
                right: 16,
                background: "var(--bg3)",
                border: "none",
                fontSize: 20,
                cursor: "pointer",
                color: "var(--text3)",
                width: 34,
                height: 34,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s",
                zIndex: 10,
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "var(--border)"; e.currentTarget.style.color = "var(--text)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "var(--bg3)"; e.currentTarget.style.color = "var(--text3)"; }}
            >
              ✕
            </button>

            {/* المحتوى التحفيزي - نص إنجليزي بالكامل */}
            <div style={{
              padding: "32px 24px 28px",
              textAlign: "center",
              background: `linear-gradient(135deg, ${color}10 0%, var(--bg2) 100%)`,
            }}>
              <div style={{
                width: 72,
                height: 72,
                background: `linear-gradient(135deg, ${color}, ${color}aa)`,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 18px",
                boxShadow: `0 0 0 6px ${color}20`,
              }}>
                <AnimIcon type="trophy" size={40} color="#fff" animate />
              </div>
              
              <h2 style={{
                fontSize: "clamp(20px, 6vw, 26px)",
                fontWeight: 900,
                marginBottom: 10,
                background: `linear-gradient(135deg, ${color}, #a855f7)`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}>
                🎉 Great Job! You completed the exam
              </h2>
              
              <p style={{
                fontSize: "clamp(14px, 4vw, 16px)",
                color: "var(--text2)",
                marginBottom: 18,
                lineHeight: 1.5,
              }}>
                You scored <strong style={{ color }}>{displayScore}%</strong> on <strong>{examTitle}</strong>.
              </p>
              
              <div style={{
                background: "var(--bg3)",
                borderRadius: 20,
                padding: "16px 14px",
                marginBottom: 24,
                textAlign: "left",
                borderLeft: `4px solid ${color}`,
              }}>
                <p style={{ margin: 0, fontSize: "clamp(12px, 3.5vw, 14px)", color: "var(--text)", lineHeight: 1.6, fontWeight: 500 }}>
                  ✨ <strong>Sign up now to:</strong><br />
                  ✅ Get an official PDF certificate with QR code<br />
                  📊 Save your progress & access detailed analytics<br />
                  🔓 Unlock all exams (1000+ questions)<br />
                  📱 Continue from any device
                </p>
              </div>
              
              {/* أزرار متجاوبة للأجهزة المحمولة: عمودية على الشاشات الصغيرة */}
              <div style={{
                display: "flex",
                gap: 12,
                flexWrap: "wrap",
                justifyContent: "center",
                flexDirection: "column", // تصبح أفقية على سطح المكتب؟ الأفضل استخدام media query أو grid
              }}>
                {/* استخدام grid بسيط: عمودي على المحمول، أفقي على الشاشات الكبيرة */}
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                  gap: 12,
                  width: "100%",
                }}>
                  <button
                    onClick={closePopup}
                    style={{
                      padding: "12px 16px",
                      borderRadius: 40,
                      border: `1.5px solid ${color}`,
                      background: "transparent",
                      color: color,
                      fontWeight: 700,
                      fontSize: "clamp(13px, 3.5vw, 15px)",
                      cursor: "pointer",
                      transition: "all 0.2s",
                      fontFamily: "inherit",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = `${color}15`; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                  >
                    📊 View My Results
                  </button>
                  <button
                    onClick={() => setPage("auth", { mode: "register" })}
                    style={{
                      padding: "12px 20px",
                      borderRadius: 40,
                      background: `linear-gradient(135deg, ${color}, ${color}cc)`,
                      border: "none",
                      color: "#fff",
                      fontWeight: 800,
                      fontSize: "clamp(13px, 3.5vw, 15px)",
                      cursor: "pointer",
                      transition: "transform 0.2s, box-shadow 0.2s",
                      fontFamily: "inherit",
                      boxShadow: `0 6px 14px ${color}40`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                    }}
                    onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = `0 10px 22px ${color}60`; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = `0 6px 14px ${color}40`; }}
                  >
                    <AnimIcon type="userPlus" size={16} color="#fff" />
                    Sign Up Free
                  </button>
                </div>
              </div>
              
              <p style={{
                fontSize: "clamp(10px, 3vw, 12px)",
                color: "var(--text3)",
                marginTop: 24,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 12,
                flexWrap: "wrap",
              }}>
                <span>🔒 100% Secure</span>
                <span>✨ Completely Free</span>
                <span>⚡ Under 2 minutes</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* المحتوى العادي لصفحة النتيجة (يظهر تحت المنبثقة ولكن المنبثقة تمنع التفاعل معه حتى الإغلاق) */}
      <div style={{ filter: (isGuest && showGuestPopup) ? "blur(2px)" : "none", pointerEvents: (isGuest && showGuestPopup) ? "none" : "auto" }}>
        {/* Hero Score Card */}
        <div className="result-card" style={{
          background: `linear-gradient(135deg, ${color}10 0%, var(--bg2) 60%, ${color}06 100%)`,
          border: `1.5px solid ${color}40`,
          borderRadius: 28, padding: "36px 28px 28px",
          marginBottom: 28, textAlign: "center",
          boxShadow: `0 8px 40px ${color}15, var(--card-shadow)`,
          position: "relative", overflow: "hidden",
        }}>
          <div style={{
            position: "absolute", top: -40, right: -40,
            width: 180, height: 180, borderRadius: "50%",
            background: `radial-gradient(circle, ${color}20 0%, transparent 70%)`,
            pointerEvents: "none",
          }} />

          <div style={{ marginBottom: 16, display: "flex", justifyContent: "center" }}>
            <div style={{
              width: 80, height: 80, borderRadius: "50%",
              background: displayPass
                ? "linear-gradient(135deg, #059669, #10b981)"
                : "linear-gradient(135deg, #dc2626, #ef4444)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: displayPass
                ? "0 0 0 8px rgba(16,185,129,.15), 0 8px 24px rgba(16,185,129,.3)"
                : "0 0 0 8px rgba(220,38,38,.15), 0 8px 24px rgba(220,38,38,.3)",
            }}>
              <AnimIcon type={displayPass ? "trophy" : "book"} size={38} color="#fff" animate />
            </div>
          </div>

          <h1 style={{ fontSize: "clamp(24px,5vw,34px)", fontWeight: 900, marginBottom: 8 }}>
            {displayPass ? "Congratulations! 🎉" : "Keep Practicing!"}
          </h1>
          <p style={{ color: "var(--text2)", fontSize: 15, marginBottom: 28, maxWidth: 500, margin: "0 auto 28px" }}>
            {displayPass
              ? `You passed ${examTitle} — great work!`
              : `You scored ${displayScore}%. A little more practice and you'll get there!`}
          </p>

          {isGuest && (
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: "rgba(245,158,11,.1)", border: "1px solid rgba(245,158,11,.3)",
              borderRadius: 12, padding: "8px 16px", marginBottom: 24,
              fontSize: 13, color: "#f59e0b", fontWeight: 600,
            }}>
              <AnimIcon type="lock" size={14} color="#f59e0b" />
              Guest result — based on {displayTotal} accessible questions
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "center", gap: 28, flexWrap: "wrap", marginBottom: 28 }}>
            <div style={{ textAlign: "center" }}>
              <SimpleScoreCircle value={displayScore} size={120} strokeWidth={9} color={color} />
              <div style={{
                marginTop: 12,
                display: "inline-flex", alignItems: "center", gap: 6,
                background: displayPass ? "rgba(16,185,129,.15)" : "rgba(239,68,68,.15)",
                color: displayPass ? "#10b981" : "#ef4444",
                borderRadius: 99, padding: "4px 12px", fontSize: 13, fontWeight: 700,
              }}>
                <AnimIcon type={displayPass ? "checkCircle" : "xCircle"} size={14}
                  color={displayPass ? "#10b981" : "#ef4444"} animate />
                {displayPass ? "PASSED" : "NOT PASSED"}
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12, justifyContent: "center", textAlign: "left" }}>
              {[
                { icon: "checkCircle", label: "Correct", value: `${displayCorrect} / ${displayTotal}`, icolor: displayPass ? "#10b981" : "var(--text2)" },
                { icon: "clock", label: "Time Taken", value: formatTime(timeTaken), icolor: color },
                { icon: "target", label: "Passing Score", value: `${effectivePassing}%`, icolor: "var(--text3)" },
              ].map(stat => (
                <div key={stat.label} className="result-stat" style={{
                  display: "flex", alignItems: "center", gap: 10,
                  background: "var(--bg3, rgba(255,255,255,.04))",
                  border: "1px solid var(--border)", borderRadius: 12, padding: "8px 14px",
                }}>
                  <AnimIcon type={stat.icon} size={18} color={stat.icolor} />
                  <div>
                    <div style={{ fontSize: 11, color: "var(--text3)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".04em" }}>{stat.label}</div>
                    <div style={{ fontSize: 17, fontWeight: 800 }}>{stat.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            {canShowCert && (
              <Btn
                onClick={() => setShowCert(v => !v)}
                style={{ background: `linear-gradient(135deg, ${color}, ${color}cc)`, gap: 8 }}
              >
                <AnimIcon type="download" size={16} color="#fff" animate />
                {showCert ? "Hide Certificate" : "Get Certificate"}
              </Btn>
            )}
            <Btn variant="ghost" onClick={() => setPage("exams")} style={{ gap: 8 }}>
              <AnimIcon type="grid" size={16} color="var(--text2)" /> Browse Exams
            </Btn>
            <Btn variant="ghost" onClick={handleRetake} style={{ gap: 8 }}>
              <AnimIcon type="refresh" size={16} color="var(--text2)" /> Retake Exam
            </Btn>
          </div>
        </div>

        {/* Certificate Section */}
        {canShowCert && showCert && (
          <div style={{
            background: "var(--bg2)", border: "1.5px solid var(--border)",
            borderRadius: 28, padding: "32px 24px",
            marginBottom: 28, textAlign: "center",
            animation: "fadeSlideIn .45s ease both",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24, justifyContent: "center" }}>
              <AnimIcon type="trophy" size={22} color={color} animate />
              <h2 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>Your Certificate</h2>
            </div>
            <Certificate
              user={user}
              exam={examObj || { title: examTitle, id: examId }}
              score={displayScore}
              date={new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
              mode={mode}
              passed={displayPass}
            />
          </div>
        )}

        {/* Guest CTA (نبقيه للمستخدم بعد إغلاق المنبثقة) */}
        {isGuest && (
          <GuestSignupCTA
            displayPass={displayPass}
            displayScore={displayScore}
            displayTotal={displayTotal}
            color={color}
            setPage={setPage}
          />
        )}

        {/* Domain Performance (logged-in only) */}
        {!isGuest && Object.keys(domainMap).length > 0 && (
          <div style={{
            background: "var(--bg2)", border: "1.5px solid var(--border)",
            borderRadius: 28, padding: "28px 24px",
            marginBottom: 28,
            animation: "fadeSlideIn .5s .1s ease both",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
              <AnimIcon type="chart" size={20} color={color} />
              <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>Performance by Domain</h2>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {Object.entries(domainMap).map(([domain, { correct: dc, total: dt }]) => {
                const pct = Math.round((dc / dt) * 100);
                return (
                  <div key={domain}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text2)" }}>{domain}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: pct >= effectivePassing ? "var(--green)" : "var(--red)" }}>
                        {dc}/{dt} ({pct}%)
                      </span>
                    </div>
                    <ProgressBar value={pct} color={pct >= effectivePassing ? "var(--green)" : "var(--red)"} />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Question Review (logged-in only) */}
        {!isGuest && details && details.length > 0 && (
          <div style={{ animation: "fadeSlideIn .5s .2s ease both" }}>
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              flexWrap: "wrap", marginBottom: 20
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <AnimIcon type="book" size={20} color={color} />
                <h2 style={{ fontSize: 18, fontWeight: 800 }}>Question Review</h2>
                <span style={{
                  fontSize: 12, fontWeight: 700, padding: "3px 10px",
                  background: "var(--accent-soft)", color: "var(--accent)",
                  borderRadius: 99,
                }}>
                  {filteredDetails.length} Questions
                  {flaggedIndices.length > 0 && ` (${flaggedIndices.length} flagged)`}
                </span>
              </div>
              {flaggedIndices.length > 0 && (
                <Btn variant="ghost" size="sm" onClick={() => setShowFlaggedOnly(!showFlaggedOnly)} style={{ gap: 6 }}>
                  <AnimIcon type="flag" size={14} color="var(--gold)" />
                  {showFlaggedOnly ? "Show All Questions" : "🚩 Show Flagged Only"}
                </Btn>
              )}
            </div>

            {filteredDetails.length === 0 && showFlaggedOnly ? (
              <div style={{
                textAlign: "center", padding: "60px 20px",
                background: "var(--bg2)", borderRadius: 28,
                border: "1px dashed var(--border)"
              }}>
                <AnimIcon type="flag" size={40} color="var(--text3)" />
                <p style={{ marginTop: 16, color: "var(--text3)" }}>No flagged questions found.</p>
                <Btn variant="ghost" onClick={() => setShowFlaggedOnly(false)}>Show all questions</Btn>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {filteredDetails.map((item, idx) => {
                  const d = item;
                  const originalIndex = d.originalIndex;
                  const displayNumber = showFlaggedOnly ? idx + 1 : originalIndex + 1;
                  return (
                    <div key={originalIndex} className="q-card" style={{
                      background: "var(--bg2)", border: `1.5px solid ${d.isCorrect ? "rgba(16,185,129,.2)" : "rgba(239,68,68,.18)"}`,
                      borderRadius: 20, padding: "20px 22px",
                      boxShadow: "var(--card-shadow)",
                      animationDelay: `${Math.min((showFlaggedOnly ? idx : originalIndex) * 0.04, 0.5)}s`,
                    }}>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 14 }}>
                        <div style={{
                          flexShrink: 0, width: 30, height: 30, borderRadius: "50%",
                          background: d.isCorrect ? "rgba(16,185,129,.15)" : "rgba(239,68,68,.12)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                          <AnimIcon type={d.isCorrect ? "checkCircle" : "xCircle"} size={17}
                            color={d.isCorrect ? "#10b981" : "#ef4444"} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 11, color: "var(--text3)", fontWeight: 600, marginBottom: 4, letterSpacing: ".04em" }}>
                            Q{displayNumber}{d.domain && ` · ${d.domain}`}
                            {d.flagged && <span style={{ marginLeft: 8, color: "var(--gold)" }}>🚩 Flagged</span>}
                          </div>
                          <div style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.6, color: "var(--text)" }}>
                            {d.question}
                          </div>
                        </div>
                      </div>

                      {d.options && d.options.length > 0 && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
                          {d.options.map(opt => {
                            const isCorrectOpt = (d.correctAnswer || []).includes(opt.id);
                            const isUserPick   = (d.userAnswer   || []).includes(opt.id);
                            return (
                              <div key={opt.id} style={{
                                display: "flex", alignItems: "center", gap: 10,
                                padding: "8px 12px", borderRadius: 10, fontSize: 13,
                                background: isCorrectOpt
                                  ? "rgba(16,185,129,.1)"
                                  : isUserPick ? "rgba(239,68,68,.08)" : "var(--bg3)",
                                border: `1px solid ${isCorrectOpt ? "rgba(16,185,129,.3)" : isUserPick ? "rgba(239,68,68,.2)" : "var(--border)"}`,
                              }}>
                                <span style={{
                                  width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
                                  display: "flex", alignItems: "center", justifyContent: "center",
                                  fontSize: 11, fontWeight: 800,
                                  background: isCorrectOpt ? "#10b981" : isUserPick ? "#ef4444" : "var(--border)",
                                  color: isCorrectOpt || isUserPick ? "#fff" : "var(--text3)",
                                }}>
                                  {opt.id?.toUpperCase?.() || "?"}
                                </span>
                                <span style={{ color: isCorrectOpt ? "#10b981" : isUserPick ? "#ef4444" : "var(--text2)" }}>
                                  {opt.text}
                                  {isCorrectOpt && " ✓"}
                                  {isUserPick && !isCorrectOpt && " ✗"}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {d.explanation && (
                        <div style={{
                          background: "var(--accent-soft)",
                          border: "1px solid rgba(99,102,241,.15)",
                          borderRadius: 10, padding: "10px 14px",
                          fontSize: 13, color: "var(--text2)", lineHeight: 1.7, marginBottom: 10,
                        }}>
                          <span style={{ fontSize: 11, fontWeight: 800, color: "var(--accent)", textTransform: "uppercase", letterSpacing: ".06em" }}>
                            💡 Explanation
                          </span>
                          <br/>
                          {d.explanation}
                        </div>
                      )}

                      <div style={{ display: "flex", justifyContent: "flex-end" }}>
                        <button
                          onClick={() => handleReportToggle(originalIndex)}
                          style={{
                            background: "none", border: "none", cursor: "pointer",
                            fontSize: 11, color: "var(--text3)", fontFamily: "inherit",
                            padding: "4px 8px", borderRadius: 6,
                          }}
                        >
                          🚨 Report Issue
                        </button>
                      </div>

                      {reportState[originalIndex] && (
                        <div style={{ marginTop: 10 }}>
                          <textarea
                            value={reportFeedback[originalIndex] || ""}
                            onChange={e => setReportFeedback(p => ({ ...p, [originalIndex]: e.target.value }))}
                            placeholder="Describe the issue…"
                            style={{
                              width: "100%", minHeight: 72, padding: "10px 12px",
                              background: "var(--bg3)", border: "1px solid var(--border)",
                              borderRadius: 10, resize: "vertical", fontSize: 13,
                              color: "var(--text)", fontFamily: "inherit",
                            }}
                          />
                          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                            <Btn onClick={() => handleReportSubmit(d, originalIndex)} loading={submittingReport[originalIndex]}>
                              Submit Report
                            </Btn>
                            <Btn variant="ghost" onClick={() => handleReportToggle(originalIndex)}>Cancel</Btn>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}