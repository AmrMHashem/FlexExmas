// pages/ExamDetail.jsx — v8.2 — Fixed: 100% coupon now shows "Claim Free Access" button
// ✅ When applied coupon makes exam free, show a direct claim button instead of hiding the purchase UI

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
  getExams,
  getVendors,
} from "../services/firestore";
import { Btn, Spinner, Icon, Tag, ProgressBar, Empty, Modal } from "../components/UI";
import { generatePDFCertificate } from "../utils/pdfCertificate";
import { ExamPriceBadge, ExamAccessGate } from "../components/ExamPricingWidget";
import {
  checkUserAccess,
  getAccessLimit,
  validateCoupon,
  saveTransaction,
  grantExamAccess,
} from "../services/payment";

// ─────────────────────────────────────────────────────────────────────────────
//  Stars
// ─────────────────────────────────────────────────────────────────────────────
const Stars = React.memo(function Stars({ rating = 5 }) {
  return (
    <span style={{ display: "inline-flex", gap: 2 }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <svg key={s} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
          fill={s <= Math.round(rating) ? "#fbbf24" : "none"}
          stroke={s <= Math.round(rating) ? "#fbbf24" : "var(--bg4)"}
          strokeWidth={1.5} style={{ width: 16, height: 16 }}>
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
        </svg>
      ))}
    </span>
  );
});

// ─────────────────────────────────────────────────────────────────────────────
//  Vendor Logo Map (unchanged)
// ─────────────────────────────────────────────────────────────────────────────
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

const getFallbackVendorLogo = (examName) => {
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

// ─────────────────────────────────────────────────────────────────────────────
//  ScoreCard (best score) — unchanged
// ─────────────────────────────────────────────────────────────────────────────
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
            <circle cx="50" cy="50" r="42" fill="none" stroke="#10b981" strokeWidth="8"
              strokeDasharray={`${percentage * 2.64} 264`} strokeLinecap="round"
              style={{ transition: "stroke-dasharray 0.8s ease-out" }} />
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

// ─────────────────────────────────────────────────────────────────────────────
//  LastScoreCard — unchanged
// ─────────────────────────────────────────────────────────────────────────────
const LastScoreCard = React.memo(function LastScoreCard({ lastScore, examTitle }) {
  if (!lastScore || lastScore === 0) return null;
  const percentage = Math.min(100, Math.max(0, Math.round(lastScore)));
  const isPassed   = percentage >= 70;
  const remaining  = 100 - percentage;
  const scoreColor  = isPassed ? "#10b981" : "#f59e0b";
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
            <circle cx="22" cy="22" r="18" fill="none" stroke={scoreColor} strokeWidth="3.5"
              strokeDasharray={`${(percentage / 100) * 113.1} 113.1`} strokeLinecap="round"
              transform="rotate(-90 22 22)" style={{ transition: "stroke-dasharray 0.3s ease" }} />
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

// ─────────────────────────────────────────────────────────────────────────────
//  TopicDistributionBar — unchanged
// ─────────────────────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────────────────────
//  SmartStickyPanel — unchanged
// ─────────────────────────────────────────────────────────────────────────────
function SmartStickyPanel({ children, topOffset = 24 }) {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < 768 : false
  );

  const wrapperRef = useRef(null);
  const rafRef = useRef(null);

  const S = useRef({
    initialized: false,
    mode: "simple",
    initialTop: 0,
    panelH: 0,
    currentY: 0,
  });

  const applyTransform = useCallback((y) => {
    const el = wrapperRef.current;
    if (!el) return;
    const rounded = Math.round(y);
    if (el._lastRenderedY === rounded) return;
    el._lastRenderedY = rounded;
    el.style.transform = `translateY(${rounded}px)`;
  }, []);

  const init = useCallback(() => {
    const el = wrapperRef.current;
    if (!el || isMobile) return;

    el.style.transform = "translateY(0px)";
    el.style.position = "relative";
    el.style.top = "auto";
    el.style.willChange = "transform";
    el.style.transition = "none";
    el._lastRenderedY = null;

    const rect = el.getBoundingClientRect();
    const viewH = window.innerHeight;
    const panelH = el.offsetHeight;

    S.current.initialTop = rect.top + window.scrollY;
    S.current.panelH = panelH;
    S.current.currentY = 0;
    S.current.initialized = true;

    const fits = panelH <= viewH - topOffset * 2;

    if (fits) {
      S.current.mode = "simple";
      el.style.position = "sticky";
      el.style.top = `${topOffset}px`;
      el.style.transform = "none";
      el.style.willChange = "auto";
    } else {
      S.current.mode = "smart";
      el.style.position = "relative";
      el.style.top = "auto";
      el.style.willChange = "transform";
      applyTransform(0);
    }
  }, [isMobile, topOffset, applyTransform]);

  const handleScroll = useCallback(() => {
    const s = S.current;
    if (!s.initialized || s.mode === "simple") return;

    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    rafRef.current = requestAnimationFrame(() => {
      const el = wrapperRef.current;
      if (!el) return;

      const scrollY = window.scrollY;
      const viewH = window.innerHeight;

      const container = el.parentElement;
      if (!container) return;

      const containerTop = container.getBoundingClientRect().top + window.scrollY;
      const containerHeight = container.offsetHeight;
      const containerBottom = containerTop + containerHeight;
      const desiredBottom = viewH - topOffset;

      let targetY = desiredBottom + scrollY - s.initialTop - s.panelH;

      const maxY = Math.max(0, containerBottom - s.initialTop - s.panelH - topOffset);
      targetY = Math.max(0, Math.min(targetY, maxY));

      if (Math.abs(targetY - s.currentY) > 0.5) {
        s.currentY = targetY;
        applyTransform(s.currentY);
      }
    });
  }, [topOffset, applyTransform]);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", onResize, { passive: true });
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (isMobile) {
      const el = wrapperRef.current;
      if (el) {
        el.style.position = "";
        el.style.top = "";
        el.style.transform = "";
        el.style.willChange = "";
      }
      return;
    }

    let r1 = requestAnimationFrame(() => {
      let r2 = requestAnimationFrame(() => {
        init();
        handleScroll();
      });
    });

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", init, { passive: true });

    return () => {
      cancelAnimationFrame(r1);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", init);
    };
  }, [isMobile, init, handleScroll]);

  useEffect(() => {
    if (isMobile) return;
    const el = wrapperRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;

    const ro = new ResizeObserver(() => {
      requestAnimationFrame(init);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [isMobile, init]);

  if (isMobile) {
    return <div style={{ alignSelf: "start" }}>{children}</div>;
  }

  return <div ref={wrapperRef} style={{ alignSelf: "start" }}>{children}</div>;
}

// ─────────────────────────────────────────────────────────────────────────────
//  CouponInput — unchanged
// ─────────────────────────────────────────────────────────────────────────────
function CouponInput({ examId, originalPrice, onApply, userId }) {
  const [code, setCode]       = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState(null);

  const handleApply = async () => {
    if (!code.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await validateCoupon(code.trim(), examId, null, userId || null);
      setResult(res);
      if (res.valid) {
        const discountPercent = res.discount || 0;
        const discountAmount  = res.discountAmount || (originalPrice * discountPercent / 100);
        const newPrice        = Math.max(0, originalPrice - discountAmount);
        onApply({ code: code.trim(), discountPercent, discountAmount, newPrice });
        const url = new URL(window.location.href);
        url.searchParams.set("couponCode", code.trim());
        window.history.replaceState({}, "", url.toString());
      }
    } catch (e) {
      setResult({ valid: false, error: "Failed to validate coupon" });
    }
    setLoading(false);
  };

  const handleRemove = () => {
    setCode("");
    setResult(null);
    onApply(null);
    const url = new URL(window.location.href);
    url.searchParams.delete("couponCode");
    window.history.replaceState({}, "", url.toString());
  };

  return (
    <div style={{ marginBottom: 18 }}>
      {result?.valid ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "linear-gradient(135deg,rgba(16,185,129,0.1),rgba(5,150,105,0.06))", border: "1.5px solid rgba(16,185,129,0.35)", borderRadius: 12, padding: "10px 14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#10b981" }}>Coupon applied: <span style={{ fontFamily: "monospace" }}>{code.toUpperCase()}</span></div>
              <div style={{ fontSize: 11, color: "var(--text3)" }}>
                {result.discount > 0 ? `-${result.discount}%` : ""}{result.discountAmount > 0 ? ` (-$${result.discountAmount.toFixed(2)})` : ""} discount applied
              </div>
            </div>
          </div>
          <button onClick={handleRemove} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text3)", fontSize: 18, lineHeight: 1, padding: 2 }}>×</button>
        </div>
      ) : (
        <div>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              type="text" value={code}
              onChange={e => setCode(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleApply()}
              placeholder="Enter coupon code"
              style={{ flex: 1, padding: "9px 14px", fontSize: 13, borderRadius: 10, border: result?.error ? "1.5px solid var(--red)" : "1.5px solid var(--border)", background: "var(--bg2)", color: "var(--text)", outline: "none" }}
            />
            <button onClick={handleApply} disabled={loading || !code.trim()}
              style={{ padding: "9px 16px", borderRadius: 10, fontSize: 12, fontWeight: 700, background: "var(--accent)", color: "#fff", border: "none", cursor: "pointer", opacity: loading || !code.trim() ? 0.6 : 1, whiteSpace: "nowrap" }}>
              {loading ? "..." : "Apply"}
            </button>
          </div>
          {result?.error && (
            <div style={{ fontSize: 11, color: "var(--red)", marginTop: 6, display: "flex", alignItems: "center", gap: 4 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
              {result.error}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  SuggestedExams — unchanged
// ─────────────────────────────────────────────────────────────────────────────
const SuggestedExams = React.memo(function SuggestedExams({ currentExam, setPage }) {
  const [suggested, setSuggested] = useState([]);
  const [loading, setLoading]     = useState(true);
 
  const goToExam = useCallback((examObj) => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setTimeout(() => setPage("exam-detail", { exam: examObj }), 60);
  }, [setPage]);
 
  useEffect(() => {
    if (!currentExam) return;
    let mounted = true;
    getExams()
      .then(all => {
        if (!mounted) return;
        const filtered = all.filter(e =>
          e.id !== currentExam.id &&
          e.isActive !== false &&
          (
            (e.vendor && currentExam.vendor && e.vendor === currentExam.vendor) ||
            (e.category && currentExam.category && e.category === currentExam.category) ||
            (e.topic && currentExam.topic && e.topic === currentExam.topic)
          )
        ).slice(0, 4);
        setSuggested(filtered);
        setLoading(false);
      })
      .catch(() => setLoading(false));
    return () => { mounted = false; };
  }, [currentExam?.id]);
 
  if (loading || !suggested.length) return null;
 
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 24, padding: "clamp(20px,4vw,28px)" }}>
      <h2 style={{ fontSize: "clamp(16px,4vw,18px)", fontWeight: 700, marginBottom: 20 }}>Related Exams</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {suggested.map(relExam => (
          <div
            key={relExam.id}
            role="button"
            tabIndex={0}
            onClick={() => goToExam(relExam)}
            onKeyDown={e => (e.key === "Enter" || e.key === " ") && goToExam(relExam)}
            style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 14px", borderRadius: 16, border: "1.5px solid var(--border)", cursor: "pointer", background: "var(--bg2)", transition: "border-color 0.2s, background 0.2s" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = relExam.color || "var(--accent)"; e.currentTarget.style.background = "var(--surface)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.background = "var(--bg2)"; }}>
            {relExam.image ? (
              <img src={relExam.image} alt={relExam.title} style={{ width: 44, height: 44, borderRadius: 10, objectFit: "cover", flexShrink: 0 }} loading="lazy" />
            ) : (
              <div style={{ width: 44, height: 44, borderRadius: 10, flexShrink: 0, background: `${relExam.color || "var(--accent)"}18`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>📋</div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{relExam.title}</div>
              <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 2, display: "flex", gap: 8 }}>
                <span>{relExam.category || relExam.vendor || ""}</span>
                {relExam.difficulty && <span>· {relExam.difficulty}</span>}
              </div>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </div>
        ))}
      </div>
    </div>
  );
});

// ─────────────────────────────────────────────────────────────────────────────
//  Main ExamDetail Component
// ─────────────────────────────────────────────────────────────────────────────
export default function ExamDetail({ exam, setPage, startQuiz, showToast }) {
  const { user, profile } = useAuth();
  const [questions, setQuestions]           = useState([]);
  const [fullQuestions, setFullQuestions]   = useState([]);
  const [loading, setLoading]               = useState(true);
  const [mode, setMode]                     = useState("examSimulation");
  const [showReviewModal, setShowReviewModal]   = useState(false);
  const [reviewSettings, setReviewSettings]     = useState({ passingScore: 70, duration: 60 });
  const [showResumeModal, setShowResumeModal]   = useState(false);
  const [downloadingCert, setDownloadingCert]   = useState(false);
  const [appliedCoupon, setAppliedCoupon]       = useState(null);
  const [vendors, setVendors]               = useState([]);
  const [dashboard, setDashboard]           = useState({
    isEnrolled: false, bestScore: null, lastScore: null,
    enrolledCount: 0, attemptsCount: 0, userCertificate: null, savedProgress: null,
  });
  const [userAccess, setUserAccess]         = useState(null);
  const [accessLoading, setAccessLoading]   = useState(true);
  const [autoApplyCoupon, setAutoApplyCoupon] = useState(null);
  const [claimingFree, setClaimingFree]     = useState(false); // for 100% coupon claim

  const abortControllerRef = useRef(null);
  const cacheRef           = useRef({});

  // ── SEO ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!exam) return;
    document.title = `${exam.title} | FlexExams Certification Practice`;
    const setMeta = (sel, attr, val, content) => {
      let el = document.querySelector(sel);
      if (!el) { el = document.createElement("meta"); el.setAttribute(attr, val); document.head.appendChild(el); }
      el.setAttribute("content", content);
    };
    setMeta('meta[name="description"]', "name", "description", exam.description || exam.subtitle || `Prepare for ${exam.title} certification.`);
    setMeta('meta[property="og:title"]', "property", "og:title", `${exam.title} - FlexExams`);
    setMeta('meta[property="og:description"]', "property", "og:description", exam.description || `Test your knowledge with exam questions.`);
    if (exam.image) setMeta('meta[property="og:image"]', "property", "og:image", exam.image);
    const url = new URL(window.location.href);
    const cpCode = url.searchParams.get("couponCode");
    if (cpCode) setAutoApplyCoupon(cpCode);
  }, [exam]);

  // ── Auto-apply coupon from URL ────────────────────────────────────
  useEffect(() => {
    if (!autoApplyCoupon || !exam?.pricing?.price) return;
    let mounted = true;
    validateCoupon(autoApplyCoupon, exam.id, null, user?.uid || null).then(res => {
      if (!mounted) return;
      if (res.valid) {
        const discountPercent = res.discount || 0;
        const discountAmount  = res.discountAmount || (exam.pricing.price * discountPercent / 100);
        const newPrice        = Math.max(0, exam.pricing.price - discountAmount);
        setAppliedCoupon({ code: autoApplyCoupon, discountPercent, discountAmount, newPrice });
      }
      setAutoApplyCoupon(null);
    }).catch(() => { if (mounted) setAutoApplyCoupon(null); });
    return () => { mounted = false; };
  }, [autoApplyCoupon, exam?.id, exam?.pricing?.price, user?.uid]);

  // ── Vendors ───────────────────────────────────────────────────────
  useEffect(() => { getVendors().then(setVendors).catch(() => {}); }, []);

  const vendorName = useMemo(() => exam?.vendor || exam?.category || "", [exam]);
  const vendorLogo = useMemo(() => {
    const found = vendors.find(v =>
      v.name?.toLowerCase() === vendorName?.toLowerCase() ||
      v.tag?.toLowerCase()  === vendorName?.toLowerCase()
    );
    if (found?.image) return found.image;
    if (found?.logo && found.logo.startsWith("http")) return found.logo;
    return exam?.vendorImage || getFallbackVendorLogo(vendorName) || null;
  }, [vendors, vendorName, exam?.vendorImage]);

  // ── FULL domain stats ─────────────────────────────────────────────
  const fullDomainStats = useMemo(() => {
    return fullQuestions.reduce((acc, q) => {
      acc[q.domain] = (acc[q.domain] || 0) + 1;
      return acc;
    }, {});
  }, [fullQuestions]);

  const limitedDomainStats = useMemo(() => {
    return questions.reduce((acc, q) => {
      acc[q.domain] = (acc[q.domain] || 0) + 1;
      return acc;
    }, {});
  }, [questions]);

  const lastUpdated = useMemo(() => {
    if (exam?.updatedAt?.toDate) return exam.updatedAt.toDate();
    if (exam?.lastUpdated)       return new Date(exam.lastUpdated);
    if (exam?.publishedDate)     return new Date(exam.publishedDate);
    return new Date();
  }, [exam]);

  const formattedDate = lastUpdated
    ? lastUpdated.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : "Recently updated";

  const studyModes = useMemo(() => [
    { id: "examSimulation", icon: "clock", label: "⏱ Timed Exam",    desc: `Time = Questions ratio × ${exam?.duration || 0} min — Score + Certificate`, official: true },
    { id: "fullPractice",   icon: "exam",  label: "📖 Practice Mode", desc: `No timer — All ${fullQuestions.length} questions at your own pace`, official: false },
    { id: "review",         icon: "eye",   label: "Review Mode",      desc: "See correct answers, Set Score and Time", official: false },
  ], [fullQuestions.length, exam?.duration]);

  // ── Load ALL questions first ──────────────────────────────────────
  useEffect(() => {
    if (!exam) return;
    if (exam.isActive === false) showToast({ msg: "🔒 This exam is under maintenance.", type: "warning" });
    let isMounted = true;

    const loadQuestions = async () => {
      try {
        const allQs = await getQuestions(exam.id);
        if (!isMounted) return;
        setFullQuestions(allQs);
        setQuestions(allQs);
        setLoading(false);
      } catch (err) {
        if (isMounted) setLoading(false);
      }
    };
    loadQuestions();
    return () => { isMounted = false; };
  }, [exam, showToast]);

  // ── Payment access ────────────────────────────────────────────────
  useEffect(() => {
    if (!exam?.id) return;
    setAccessLoading(true);
    checkUserAccess(user?.uid, exam.id)
      .then(access => { setUserAccess(access); setAccessLoading(false); })
      .catch(() => { setUserAccess({ hasAccess: false, accessType: user ? "free" : "guest" }); setAccessLoading(false); });
  }, [user?.uid, exam?.id]);

  // ── Dashboard data ────────────────────────────────────────────────
  useEffect(() => {
    if (!exam || !user?.uid) return;
    const cacheKey = `exam_dashboard_${user.uid}_${exam.id}`;
    const cached   = cacheRef.current[cacheKey];
    if (cached && (Date.now() - cached.timestamp) < 5 * 60 * 1000) {
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

  const incrementAttempts = useCallback(async () => {
    try {
      await incrementExamAttempts(exam.id);
      setDashboard(prev => ({ ...prev, attemptsCount: prev.attemptsCount + 1 }));
    } catch (err) { console.error("Failed to increment attempts:", err); }
  }, [exam?.id]);

  const handleEnroll = useCallback(async () => {
    if (!user) return;
    setDashboard(prev => ({ ...prev, enrolling: true }));
    try {
      await enrollUserInExam(user.uid, exam.id);
      setDashboard(prev => ({ ...prev, isEnrolled: true, enrolledCount: prev.enrolledCount + 1, enrolling: false }));
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
      setDashboard(prev => ({ ...prev, isEnrolled: false, savedProgress: null, enrolledCount: Math.max(0, prev.enrolledCount - 1), unenrolling: false }));
      showToast({ msg: "✅ Successfully unenrolled", type: "success" });
    } catch {
      showToast({ msg: "❌ Unenroll failed", type: "error" });
      setDashboard(prev => ({ ...prev, unenrolling: false }));
    }
  }, [user, exam?.id, showToast]);

  const handleStart = useCallback(async (resumeProgress = false) => {
    if (exam.isActive === false) { showToast({ msg: "🔒 This exam is currently unavailable", type: "error" }); return; }
    let pool = fullQuestions.length > 0 ? [...fullQuestions] : [];
    if (pool.length === 0) {
      showToast({ msg: "⏳ Loading questions, please wait...", type: "info" });
      try {
        const qs = await getQuestions(exam.id);
        if (!qs || qs.length === 0) { showToast({ msg: "No questions available.", type: "warning" }); return; }
        pool = [...qs];
        setFullQuestions(qs);
        setQuestions(qs);
      } catch {
        showToast({ msg: "Failed to load questions.", type: "error" });
        return;
      }
    }
    const access        = userAccess;
    const limit         = getAccessLimit(access?.accessType || (user ? "free" : "guest"));
    const isFreeExam    = !exam.pricing?.price || exam.pricing?.isFree;
    const hasFullAccess = access?.hasAccess || isFreeExam;
    if (!hasFullAccess) {
      const allowedCount = Math.max(3, Math.ceil(pool.length * limit));
      pool = pool.slice(0, allowedCount);
    }
    await incrementAttempts();
    let timeDuration = null;
    if (mode === "examSimulation") {
      const ratio  = pool.length / Math.max(1, fullQuestions.length);
      timeDuration = Math.round(exam.duration * ratio) * 60;
      if (timeDuration < 60) timeDuration = 60;
    } else if (mode === "review") {
      timeDuration = reviewSettings.duration * 60;
    }
    startQuiz({
      exam, questions: pool, mode, duration: timeDuration,
      reviewSettings: mode === "review" ? reviewSettings : null,
      isGuest: !user,
      resumeProgress: resumeProgress && dashboard.savedProgress ? dashboard.savedProgress : null,
      isLimited: !hasFullAccess,
      limitPercent: Math.round(limit * 100),
      fullExamTotal: fullQuestions.length,
    });
  }, [exam, fullQuestions, user, userAccess, mode, reviewSettings, dashboard.savedProgress, startQuiz, showToast, incrementAttempts]);

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
        userName:  user.displayName || profile?.name || user.email || "Candidate",
        score:     dashboard.userCertificate?.score,
        date:      dashboard.userCertificate?.date,
        certId:    dashboard.userCertificate?.certId,
        examMode:  "examSimulation",
        passed:    true,
        filename:  `${exam.title.replace(/\s/g, "_")}_Certificate`,
      });
      showToast({ msg: "✅ Certificate downloaded!", type: "success" });
    } catch (err) {
      console.error(err);
      showToast({ msg: "❌ Failed to download certificate", type: "error" });
    }
    setDownloadingCert(false);
  }, [exam, user, profile, dashboard.userCertificate, showToast]);

  // ── NEW: Handle claiming free exam when 100% coupon applied ───────
  const handleClaimFreeAccess = useCallback(async () => {
    if (!user) {
      showToast({ msg: "Please sign in to claim free access.", type: "warning" });
      setPage("auth", { mode: "login" });
      return;
    }
    if (claimingFree) return;
    setClaimingFree(true);
    try {
      // Create a free transaction record
      const txId = await saveTransaction(user.uid, {
        type: "exam",
        examId: exam.id,
        examTitle: exam.title,
        amount: 0,
        originalAmount: exam.pricing?.price || 0,
        paymentMethod: "free_coupon",
        couponCode: appliedCoupon?.code,
        discount: exam.pricing?.price || 0,
        discountPercent: 100,
        currency: "USD",
        autoRenew: false,
      });
      // Grant access
      await grantExamAccess(user.uid, exam.id, txId);
      // Refresh access & dashboard state
      const newAccess = await checkUserAccess(user.uid, exam.id);
      setUserAccess(newAccess);
      // Optionally enroll the user automatically
      await enrollUserInExam(user.uid, exam.id);
      // Update dashboard enrolled status
      setDashboard(prev => ({ ...prev, isEnrolled: true, enrolledCount: prev.enrolledCount + 1 }));
      showToast({ msg: "🎉 Coupon applied! You now have full access to this exam for free.", type: "success" });
      // Clear the coupon from UI (optional)
      setAppliedCoupon(null);
      // Remove coupon param from URL
      const url = new URL(window.location.href);
      url.searchParams.delete("couponCode");
      window.history.replaceState({}, "", url.toString());
    } catch (err) {
      console.error("Free claim error:", err);
      showToast({ msg: "❌ Failed to claim free access. Please try again or contact support.", type: "error" });
    } finally {
      setClaimingFree(false);
    }
  }, [user, exam, appliedCoupon, setPage, showToast, claimingFree]);

  if (!exam) {
    return (
      <div style={{ textAlign: "center", padding: 80 }}>
        <Empty icon="exam" title="No exam selected" action={<Btn onClick={() => setPage("home")}>Go Back</Btn>} />
      </div>
    );
  }

  const ec             = exam.color || "var(--accent)";
  const successRate    = exam.successRate || 93;
  const numberOfParts  = exam.numberOfParts || 1;
  const isFreeExam     = !exam.pricing?.price || exam.pricing?.isFree;
  const hasFullAccess  = userAccess?.hasAccess || isFreeExam;
  const basePrice      = exam.pricing?.price || 0;
  const displayPrice   = appliedCoupon ? appliedCoupon.newPrice : basePrice;
  const hasDiscount    = appliedCoupon ? true : (exam.pricing?.discount > 0);
  const discountLabel  = appliedCoupon
    ? `-${appliedCoupon.discountPercent}%`
    : exam.pricing?.discount > 0 ? `-${exam.pricing.discount}%` : null;

  const totalFullQuestions = fullQuestions.length;
  const totalTopics = Object.keys(fullDomainStats).length;

  // Determine if we should show the direct "Claim Free Access" button
  const shouldShowFreeClaim = !hasFullAccess && !accessLoading && displayPrice === 0 && appliedCoupon !== null;

  // ─────────────────────────────────────────────────────────────────
  //  Right Panel Content
  // ─────────────────────────────────────────────────────────────────
  const RightPanelContent = (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 24, padding: "clamp(20px, 4vw, 28px)" }}>

      {/* Price Badge */}
      {exam.pricing && !hasFullAccess && (
        <div style={{ marginBottom: 18 }}>
          {isFreeExam ? (
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "linear-gradient(135deg,rgba(16,185,129,0.12),rgba(5,150,105,0.08))", border: "1.5px solid rgba(16,185,129,0.35)", borderRadius: 100, padding: "5px 14px", fontSize: 11, fontWeight: 800, color: "var(--green)", boxShadow: "0 2px 8px rgba(16,185,129,0.12)" }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
              Free Full Access
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "linear-gradient(135deg,rgba(99,102,241,0.14),rgba(139,92,246,0.1))", border: "1.5px solid rgba(99,102,241,0.4)", borderRadius: 10, padding: "6px 14px", boxShadow: "0 2px 10px rgba(99,102,241,0.15)" }}>
                {(appliedCoupon || (exam.pricing.originalPrice && exam.pricing.originalPrice > basePrice)) && (
                  <span style={{ fontSize: 11, color: "var(--text3)", textDecoration: "line-through", fontWeight: 600 }}>
                    ${(appliedCoupon ? basePrice : exam.pricing.originalPrice).toFixed(2)}
                  </span>
                )}
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2">
                  <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                  <line x1="7" y1="7" x2="7.01" y2="7" />
                </svg>
                <span style={{ fontSize: 15, fontWeight: 900, color: "var(--accent)", letterSpacing: "-0.02em", transition: "all 0.3s" }}>
                  ${displayPrice.toFixed(2)}
                </span>
                <span style={{ fontSize: 10, color: "var(--text3)", fontWeight: 600 }}>one-time</span>
              </div>
              {discountLabel && (
                <div style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "linear-gradient(135deg,rgba(239,68,68,0.12),rgba(220,38,38,0.08))", border: "1.5px solid rgba(239,68,68,0.3)", borderRadius: 100, padding: "4px 10px", fontSize: 10, fontWeight: 900, color: "var(--red)" }}>
                  🔥 {discountLabel} OFF
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <h3 style={{ fontWeight: 700, marginBottom: 20, fontSize: "clamp(18px, 4vw, 20px)" }}>Prepare and Pass</h3>

      {user && dashboard.bestScore !== null && dashboard.bestScore > 0 && (
        <ScoreCard score={dashboard.bestScore} examTitle={exam.title} />
      )}
      {user && dashboard.lastScore !== null && dashboard.lastScore > 0 && (
        <LastScoreCard lastScore={dashboard.lastScore} examTitle={exam.title} />
      )}

      {/* Coupon Input */}
      {!hasFullAccess && !isFreeExam && !accessLoading && basePrice > 0 && (
        <CouponInput
          examId={exam.id}
          originalPrice={basePrice}
          userId={user?.uid}
          onApply={data => setAppliedCoupon(data)}
        />
      )}

      {/* ✅ FIX: If 100% coupon applied -> show direct Claim Free Access button */}
      {shouldShowFreeClaim ? (
        <div style={{ marginBottom: 20 }}>
          <Btn
            full
            size="lg"
            onClick={handleClaimFreeAccess}
            loading={claimingFree}
            style={{
              background: "linear-gradient(135deg,#10b981,#059669)",
              borderColor: "transparent",
              minHeight: 48,
              boxShadow: "0 4px 14px rgba(16,185,129,0.4)",
            }}
          >
            <Icon n="gift" size={16} /> Claim Free Access 🎉
          </Btn>
          <div style={{ marginTop: 8, fontSize: 11, color: "var(--text3)", textAlign: "center" }}>
            Your coupon makes this exam 100% free — click to unlock now.
          </div>
        </div>
      ) : (
        !hasFullAccess && !accessLoading && (
          <ExamAccessGate
            exam={{ ...exam, pricing: exam.pricing ? { ...exam.pricing, price: displayPrice } : exam.pricing }}
            onStartFree={() => { if (dashboard.savedProgress) setShowResumeModal(true); else handleStart(false); }}
            onPurchase={(data) => setPage("checkout", { ...data, couponCode: appliedCoupon?.code, discountedPrice: displayPrice })}
            onSubscribe={() => setPage("pricing")}
            setPage={setPage}
            showToast={showToast}
            couponApplied={!!appliedCoupon}
            discountedPrice={displayPrice}
          />
        )
      )}

      {/* Study Mode */}
      {user && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text3)", marginBottom: 12, textTransform: "uppercase" }}>Study Mode</div>
          {!hasFullAccess && !shouldShowFreeClaim && (
            <div style={{ fontSize: 11, color: "var(--text3)", marginBottom: 10, padding: "6px 10px", background: "rgba(245,158,11,0.08)", borderRadius: 8 }}>
              ⚡ Limited preview — choose mode then continue with {Math.round(getAccessLimit(userAccess?.accessType || "free") * 100)}%
            </div>
          )}
          {studyModes.map((m) => (
            <React.Fragment key={m.id}>
              <div
                onClick={() => { setMode(m.id); if (m.id === "review") setShowReviewModal(true); else setShowReviewModal(false); }}
                style={{
                  padding: "clamp(12px, 3vw, 14px) 16px", borderRadius: 16,
                  marginBottom: showReviewModal && mode === "review" && m.id === "review" ? 0 : 10,
                  cursor: "pointer",
                  border: `1.5px solid ${mode === m.id ? ec : "var(--border)"}`,
                  background: mode === m.id ? `${ec}06` : "transparent",
                  borderBottomLeftRadius:  showReviewModal && mode === "review" && m.id === "review" ? 0 : 16,
                  borderBottomRightRadius: showReviewModal && mode === "review" && m.id === "review" ? 0 : 16,
                }}
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
                <div style={{ background: `${ec}06`, border: `1.5px solid ${ec}`, borderTop: "none", borderRadius: "0 0 16px 16px", padding: "16px", animation: "slideDown 0.2s ease-out" }}>
                  <style>{`@keyframes slideDown{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}`}</style>
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    <div>
                      <label style={{ fontSize: "clamp(11px,3vw,12px)", fontWeight: 600, display: "block", marginBottom: 6 }}>
                        Passing Score: <span style={{ color: ec }}>{reviewSettings.passingScore}%</span>
                      </label>
                      <input type="range" min={30} max={100} value={reviewSettings.passingScore}
                        onChange={e => setReviewSettings(p => ({ ...p, passingScore: Number(e.target.value) }))}
                        style={{ width: "100%", accentColor: ec }} />
                    </div>
                    <div>
                      <label style={{ fontSize: "clamp(11px,3vw,12px)", fontWeight: 600, display: "block", marginBottom: 6 }}>
                        Duration: <span style={{ color: ec }}>{reviewSettings.duration} min</span>
                      </label>
                      <input type="range" min={15} max={180} value={reviewSettings.duration}
                        onChange={e => setReviewSettings(p => ({ ...p, duration: Number(e.target.value) }))}
                        style={{ width: "100%", accentColor: ec }} />
                    </div>
                  </div>
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      )}

      {/* Action Buttons (for enrolled users / start exam) */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {user ? (
          <>
            {!dashboard.isEnrolled ? (
              <Btn full size="lg" onClick={handleEnroll} loading={dashboard.enrolling}
                style={{ background: "linear-gradient(135deg,var(--green),#059669)", borderColor: "transparent", minHeight: 48 }}>
                <Icon n="user-plus" size={16} /> Enroll in Exam
              </Btn>
            ) : (
              <>
                {dashboard.savedProgress && (
                  <div style={{ background: `${ec}08`, border: `1px solid ${ec}20`, borderRadius: 14, padding: "12px 16px", marginBottom: 8, fontSize: 12, color: ec, wordBreak: "break-word" }}>
                    📝 Saved progress in Part {dashboard.savedProgress.currentPart + 1}, Question {dashboard.savedProgress.currentQuestion + 1}
                  </div>
                )}
                <Btn full size="lg"
                  onClick={() => { if (dashboard.savedProgress) setShowResumeModal(true); else handleStart(false); }}
                  disabled={exam.isActive === false}
                  style={{ background: `linear-gradient(135deg,${ec},${ec}cc)`, borderColor: "transparent", boxShadow: `0 4px 14px ${ec}40`, opacity: exam.isActive === false ? 0.6 : 1, minHeight: 48 }}>
                  <Icon n="lightning" size={16} /> Start Exam
                </Btn>
                <Btn full variant="ghost" loading={dashboard.unenrolling} onClick={handleUnenroll} style={{ color: "var(--red)", minHeight: 48 }}>
                  <Icon n="close" size={16} /> Unenroll
                </Btn>
                {dashboard.userCertificate && (
                  <Btn full variant="outline" loading={downloadingCert} onClick={handleDownloadCertificate}
                    style={{ justifyContent: "center", marginTop: 8, minHeight: 48 }}>
                    <Icon n="download" size={16} /> Download Certificate
                  </Btn>
                )}
              </>
            )}
          </>
        ) : (
          <div>
            <Btn full size="lg"
              onClick={() => handleStart(false)}
              loading={loading}
              style={{ background: `linear-gradient(135deg,${ec},${ec}cc)`, borderColor: "transparent", minHeight: 48 }}>
              <Icon n="lightning" size={16} /> Start{" "}
              {isFreeExam
                ? "Full Exam"
                : userAccess?.hasAccess
                ? "Exam"
                : `Free Preview (${Math.round(getAccessLimit(userAccess?.accessType || "guest") * 100)}%)`
              }
            </Btn>
            {!isFreeExam && !userAccess?.hasAccess && totalFullQuestions > 0 && (
              <div style={{ marginTop: 8, padding: "6px 10px", background: "rgba(245,158,11,0.08)", borderRadius: 8, fontSize: 11, color: "var(--text3)", textAlign: "center" }}>
                {Math.ceil(totalFullQuestions * getAccessLimit(userAccess?.accessType || "guest"))} / {totalFullQuestions} questions available
              </div>
            )}
            {isFreeExam && !user && (
              <div style={{ marginTop: 8, padding: "10px 10px", background: "rgba(16,185,129,0.08)", borderRadius: 8, fontSize: 11, color: "var(--green)", textAlign: "center" }}>
                Full Exam Access — No payment required
              </div>
            )}
          </div>
        )}
      </div>

      <div style={{ textAlign: "center", marginTop: 16, fontSize: 11, color: "var(--text3)" }}>
        <Icon n="shield" size={12} /> Your progress auto-saves
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────────────────
  //  Render
  // ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "36px clamp(16px, 4vw, 48px) 72px", overflowX: "hidden" }}>

      {/* Back */}
      <button onClick={() => setPage("home")}
        style={{ background: "none", border: "none", color: "var(--text3)", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 13, marginBottom: 28, minHeight: 40 }}>
        <Icon n="arrow_right" size={14} style={{ transform: "rotate(180deg)" }} /> Back to Exams
      </button>

      {/* Hero */}
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
                {vendorLogo ? (
                  <img src={vendorLogo} alt={vendorName} style={{ width: 32, height: 22, objectFit: "contain" }} loading="lazy" onError={e => { e.target.src = defaultLogo; }} />
                ) : (
                  <span style={{ fontSize: 22 }}>🏢</span>
                )}
                <div>
                  <div style={{ fontSize: 9, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase" }}>Vendor</div>
                  <div style={{ fontSize: "clamp(12px, 3vw, 13px)", fontWeight: 700, color: "var(--text)" }}>{vendorName}</div>
                </div>
              </div>
            )}
            {exam.description && <p style={{ fontSize: "clamp(13px, 3vw, 14px)", color: "var(--text2)", lineHeight: 1.6, marginBottom: 20 }}>{exam.description}</p>}
            <div style={{ display: "flex", alignItems: "center", gap: "clamp(12px, 3vw, 20px)", flexWrap: "wrap" }}>
              <span style={{ fontSize: "clamp(12px,3vw,13px)", color: "var(--text3)", display: "flex", alignItems: "center", gap: 6 }}><Icon n="user" size={14} /> {dashboard.enrolledCount.toLocaleString()} enrolled</span>
              <span style={{ fontSize: "clamp(12px,3vw,13px)", color: "var(--text3)", display: "flex", alignItems: "center", gap: 6 }}><Icon n="refresh" size={14} /> {dashboard.attemptsCount.toLocaleString()} attempts</span>
              <span style={{ fontSize: "clamp(12px,3vw,13px)", color: "var(--text3)", display: "flex", alignItems: "center", gap: 6 }}><Icon n="calendar" size={14} /> Updated: {formattedDate}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 32, alignItems: "start" }} className="exam-detail-grid">

        {/* Left Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>

          {/* Exam Specification */}
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 24, padding: "clamp(20px, 4vw, 28px)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
              <h2 style={{ fontSize: "clamp(16px, 4vw, 18px)", fontWeight: 700 }}>Global Exam Specification</h2>
              {vendorLogo && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--bg3)", padding: "6px 12px", borderRadius: 40 }}>
                  <img src={vendorLogo} alt={vendorName} style={{ width: 24, height: 24, objectFit: "contain" }} loading="lazy" onError={e => { e.target.src = defaultLogo; }} />
                  <span style={{ fontSize: "clamp(11px, 3vw, 12px)", fontWeight: 600 }}>{vendorName}</span>
                </div>
              )}
            </div>
            
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16, marginBottom: 28 }}>
              <div>
                <div style={{ fontSize: "clamp(11px, 3vw, 12px)", color: "var(--text3)" }}>Total Questions</div>
                <div style={{ fontSize: "clamp(18px, 4vw, 20px)", fontWeight: 700 }}>{loading ? "..." : `${totalFullQuestions} items`}</div>
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
                <div style={{ fontSize: "clamp(18px, 4vw, 20px)", fontWeight: 700 }}>{loading ? "..." : totalTopics}</div>
              </div>
              {numberOfParts > 1 && (
                <div style={{ gridColumn: "1 / -1" }}>
                  <div style={{ fontSize: "clamp(11px, 3vw, 12px)", color: "var(--text3)" }}>Exam Structure</div>
                  <div style={{ fontSize: "clamp(18px, 4vw, 20px)", fontWeight: 700 }}>{numberOfParts} parts</div>
                </div>
              )}
            </div>
            {!loading && Object.keys(fullDomainStats).length > 0 && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 6 }}>
                  <div style={{ fontSize: "clamp(11px, 3vw, 12px)", fontWeight: 600 }}>Topic Distribution</div>
                  <div style={{ fontSize: "clamp(11px, 3vw, 12px)", fontWeight: 700, color: ec }}>{successRate}% Success Rate</div>
                </div>
                {Object.entries(fullDomainStats).map(([domain, cnt]) => (
                  <TopicDistributionBar key={domain} domain={domain} count={cnt} total={totalFullQuestions} color={ec} />
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

          <SuggestedExams currentExam={exam} setPage={setPage} />
        </div>

        {/* Right Panel — SmartStickyPanel */}
        <SmartStickyPanel topOffset={24}>
          {RightPanelContent}
        </SmartStickyPanel>
      </div>

      {/* Resume Modal */}
      {showResumeModal && dashboard.savedProgress && (
        <Modal title="Resume Your Exam" onClose={() => setShowResumeModal(false)}>
          <div style={{ textAlign: "center", padding: "8px 0" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⏸️</div>
            <p style={{ fontSize: "clamp(13px, 4vw, 14px)", color: "var(--text2)", marginBottom: 24 }}>
              You were in <strong style={{ color: ec }}>Part {dashboard.savedProgress.currentPart + 1}</strong>{" "}
              at <strong style={{ color: ec }}>Question {dashboard.savedProgress.currentQuestion + 1}</strong>
            </p>
            <div style={{ display: "flex", gap: 12, flexDirection: "column" }}>
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
          .exam-detail-grid > div:first-child { order: 2; }
          .exam-detail-grid > div:last-child  { order: 1; }
          button, .btn, [role="button"] { min-height: 44px; }
          input, select, textarea { font-size: 16px !important; }
        }
        @media (max-width: 480px) {
          .exam-detail-grid { gap: 16px !important; }
        }
        .exam-long-desc {
          font-size: clamp(13px, 3vw, 14px);
          color: var(--text2);
          line-height: 1.75;
          word-break: break-word;
        }
        .exam-long-desc h2 { font-size: clamp(15px,4vw,17px); font-weight: 800; color: var(--text); margin: 18px 0 8px; }
        .exam-long-desc h3 { font-size: clamp(13px,3.5vw,15px); font-weight: 700; color: var(--text); margin: 14px 0 6px; }
        .exam-long-desc p  { margin: 6px 0; }
        .exam-long-desc strong { font-weight: 700; color: var(--text); }
        .exam-long-desc ul { list-style: disc; padding-left: 22px; margin: 8px 0; }
        .exam-long-desc ol { list-style: decimal; padding-left: 22px; margin: 8px 0; }
        .exam-long-desc li { margin: 4px 0; }
        .exam-long-desc a  { color: var(--accent); text-decoration: underline; }
      `}</style>
    </div>
  );
}
