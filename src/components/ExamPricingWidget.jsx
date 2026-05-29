// components/ExamPricingWidget.jsx
// v2.0 — Professional icons & modern design
import React, { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { checkUserAccess, getAccessLimit } from "../services/payment";

// ─────────────────────────────────────────────────────────────────────────────
//  Professional Icons
// ─────────────────────────────────────────────────────────────────────────────
const Icon = ({ name, size = 16, color = "currentColor", strokeWidth = 2 }) => {
  const icons = {
    // Existing + new high-quality icons
    lock: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    ),
    crown: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 4L7 9L12 4L17 9L22 4L19 20H5L2 4Z" />
        <path d="M5 20H19" />
      </svg>
    ),
    check: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    ),
    arrow: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
        <line x1="5" y1="12" x2="19" y2="12" />
        <polyline points="12 5 19 12 12 19" />
      </svg>
    ),
    zap: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    ),
    tag: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
        <line x1="7" y1="7" x2="7.01" y2="7" />
      </svg>
    ),
    // New professional icons
    certificate: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4h16v16H4z" />
        <path d="M9 9h6" />
        <path d="M9 13h6" />
        <path d="M9 17h4" />
        <path d="M12 4L9 1 6 4" />
        <path d="M18 4L15 1 12 4" />
      </svg>
    ),
    analytics: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12v3a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4v-3" />
        <path d="M12 2v8" />
        <path d="M9 7l3-3 3 3" />
        <path d="M3.5 12.5L9 16l3-2 3 2 5.5-3.5" />
      </svg>
    ),
    unlock: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 9.9-1" />
      </svg>
    ),
    device: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
        <line x1="12" y1="18" x2="12.01" y2="18" />
        <line x1="8" y1="6" x2="16" y2="6" />
      </svg>
    ),
    gift: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 12 20 22 4 22 4 12" />
        <rect x="2" y="7" width="20" height="5" />
        <line x1="12" y1="22" x2="12" y2="7" />
        <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
        <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
      </svg>
    ),
    star: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
  };
  return icons[name] || null;
};

// ─────────────────────────────────────────────────────────────────────────────
//  ExamPriceBadge (for exam cards) — improved design
// ─────────────────────────────────────────────────────────────────────────────
export function ExamPriceBadge({ exam }) {
  const pricing = exam?.pricing;

  if (!pricing || pricing.isFree) {
    return (
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          background: "linear-gradient(135deg, rgba(16,185,129,0.12), rgba(5,150,105,0.06))",
          border: "1px solid rgba(16,185,129,0.4)",
          borderRadius: 100,
          padding: "4px 12px",
          fontSize: 10,
          fontWeight: 800,
          color: "#10b981",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          backdropFilter: "blur(2px)",
        }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="20 6 9 17 4 12" />
        </svg>
        Free Preview
      </div>
    );
  }

  const hasDiscount = pricing.discount > 0 || (pricing.originalPrice && pricing.originalPrice > pricing.price);
  const originalPrice = pricing.originalPrice || (pricing.price / (1 - pricing.discount / 100));

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
      {hasDiscount && (
        <span
          style={{
            fontSize: 11,
            color: "var(--text3)",
            textDecoration: "line-through",
            fontWeight: 600,
          }}
        >
          ${originalPrice.toFixed(2)}
        </span>
      )}
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          background: "linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.1))",
          border: "1px solid rgba(99,102,241,0.4)",
          borderRadius: 100,
          padding: "4px 12px",
          fontSize: 12,
          fontWeight: 900,
          color: "var(--accent)",
          boxShadow: "0 2px 6px rgba(99,102,241,0.2)",
        }}
      >
        <Icon name="tag" size={12} color="var(--accent)" strokeWidth={2.5} />
        ${pricing.price?.toFixed(2)}
      </div>
      {hasDiscount && (
        <span
          style={{
            background: "linear-gradient(135deg, rgba(239,68,68,0.12), rgba(220,38,38,0.08))",
            color: "#ef4444",
            borderRadius: 100,
            padding: "3px 8px",
            fontSize: 10,
            fontWeight: 800,
            border: "1px solid rgba(239,68,68,0.3)",
          }}
        >
          -{pricing.discount || Math.round(100 - (pricing.price / originalPrice) * 100)}%
        </span>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  ExamAccessGate — modern paywall with premium feel
// ─────────────────────────────────────────────────────────────────────────────
export function ExamAccessGate({ exam, onStartFree, onPurchase, onSubscribe, setPage, showToast }) {
  const { user } = useAuth();
  const [access, setAccess] = useState(null);
  const [loading, setLoading] = useState(true);

  const pricing = exam?.pricing;
  const isFree = !pricing || pricing.isFree;
  const examPrice = pricing?.price || 0;

  useEffect(() => {
    (async () => {
      setLoading(true);
      const result = await checkUserAccess(user?.uid, exam?.id);
      setAccess(result);
      setLoading(false);
    })();
  }, [user, exam?.id]);

  if (loading)
    return (
      <div
        style={{
          padding: 32,
          textAlign: "center",
          color: "var(--text3)",
          fontSize: 13,
          background: "var(--surface)",
          borderRadius: 20,
          border: "1px solid var(--border)",
        }}
      >
        <Icon name="lock" size={24} color="var(--text3)" />
        <div style={{ marginTop: 8 }}>Checking access...</div>
      </div>
    );

  const limit = getAccessLimit(access?.accessType || "guest");
  const limitPct = Math.round(limit * 100);
  const hasFullAccess = access?.hasAccess || isFree;

  if (hasFullAccess) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "14px 20px",
          borderRadius: 16,
          background: "linear-gradient(135deg, rgba(16,185,129,0.08), rgba(5,150,105,0.04))",
          border: "1px solid rgba(16,185,129,0.3)",
          marginBottom: 20,
          backdropFilter: "blur(2px)",
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 12,
            background: "linear-gradient(135deg, #10b981, #059669)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon name="check" size={20} color="#fff" strokeWidth={2.5} />
        </div>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#10b981" }}>
          {access?.accessType === "subscription"
            ? "⭐ Full access via subscription"
            : "✅ Full access to this exam"}
        </span>
      </div>
    );
  }

  return (
    <div
      style={{
        background: "linear-gradient(145deg, var(--surface), rgba(99,102,241,0.02))",
        border: "1px solid rgba(99,102,241,0.25)",
        borderRadius: 24,
        overflow: "hidden",
        marginBottom: 24,
        boxShadow: "0 12px 30px rgba(0,0,0,0.08)",
      }}
    >
      {/* Header with gradient */}
      <div
        style={{
          padding: "24px 24px 20px",
          background: "linear-gradient(135deg, rgba(99,102,241,0.1), rgba(168,85,247,0.06))",
          borderBottom: "1px solid rgba(99,102,241,0.15)",
          display: "flex",
          alignItems: "center",
          gap: 16,
        }}
      >
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: 16,
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 8px 16px rgba(99,102,241,0.3)",
          }}
        >
          <Icon name="lock" size={24} color="#fff" strokeWidth={2} />
        </div>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, color: "var(--text)" }}>
            {user ? `${limitPct}% free preview used` : "Guest preview mode"}
          </div>
          <div style={{ fontSize: 13, color: "var(--text2)", marginTop: 4, lineHeight: 1.4 }}>
            {user
              ? "Unlock the full exam to continue practicing"
              : "Create a free account to get 15% access or subscribe for full"}
          </div>
        </div>
      </div>

      {/* Access level bar */}
      <div style={{ padding: "15px 20px", borderBottom: "1px solid rgba(99,102,241,0.1)" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 12,
            fontWeight: 700,
            color: "var(--text3)",
            marginBottom: 8,
          }}
        >
          <span>Your current access</span>
          <span>
            {limitPct}% of {exam?.totalQuestions || 0} questions
          </span>
        </div>
        <div
          style={{
            height: 8,
            background: "rgba(99,102,241,0.12)",
            borderRadius: 100,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              borderRadius: 100,
              background: "linear-gradient(90deg, #6366f1, #8b5cf6)",
              width: `${limitPct}%`,
              transition: "width 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          />
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 11,
            color: "var(--text3)",
            marginTop: 8,
          }}
        >
          <span>
            {Math.round(limit * (exam?.totalQuestions || 0))} questions available
          </span>
          <span>{exam?.totalQuestions || 0} total</span>
        </div>
      </div>

      {/* Options and CTAs */}
      <div style={{ padding: "20px 24px 24px", display: "flex", flexDirection: "column", gap: 12 }}>
        {/* Motivational banner for guests */}
        {!user && (
          <div
            style={{
              background: "linear-gradient(135deg, rgba(99,102,241,0.08), rgba(236,72,153,0.04))",
              border: "1px solid rgba(99,102,241,0.2)",
              borderRadius: 18,
              padding: "18px 20px",
              marginBottom: 8,
            }}
          >
            
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {[
                { icon: "certificate", text: "Get official Certificate", color: "#10b981" },
                { icon: "analytics", text: "Progress & Analytics", color: "#3b82f6" },
                { icon: "unlock", text: "Get Unlimited Exam Access", color: "#f59e0b" },
                { icon: "device", text: "Study Anytime, Anywhere", color: "#ec4899" },
              ].map((item, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 7,
                    fontSize: 14,
                    fontWeight: 700,
                    color: "var(--text2)",
                  }}
                >
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 10,
                      background: `${item.color}10`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Icon name={item.icon} size={16} color={item.color} strokeWidth={2} />
                  </div>
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        )}


        {/* Buy this exam */}
        {!isFree && examPrice > 0 && (
          <button
            onClick={() => onPurchase({ examId: exam.id, examTitle: exam.title || exam.name, examPrice })}
            style={{
              padding: "14px 20px",
              borderRadius: 16,
              border: "none",
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              color: "#fff",
              fontSize: 14,
              fontWeight: 800,
              cursor: "pointer",
              fontFamily: "inherit",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              boxShadow: "0 6px 14px rgba(99,102,241,0.4)",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 10px 20px rgba(99,102,241,0.5)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 6px 14px rgba(99,102,241,0.4)";
            }}
          >
            <div style={{ textAlign: "left" }}>
              <div>Unlock This Exam</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.8)", marginTop: 4 }}>
                Full access · All {exam?.totalQuestions || 0} Q · PDF certificate
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 18, fontWeight: 900 }}>${examPrice.toFixed(2)}</span>
              <Icon name="arrow" size={16} color="#fff" />
            </div>
          </button>
        )}

        {/* Subscribe */}
        <button
          onClick={() => (onSubscribe ? onSubscribe() : setPage?.("pricing"))}
          style={{
            padding: "14px 20px",
            borderRadius: 16,
            border: "none",
            background: "linear-gradient(135deg, #ec4899, #f43f5e)",
            color: "#fff",
            fontSize: 14,
            fontWeight: 800,
            cursor: "pointer",
            fontFamily: "inherit",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            boxShadow: "0 6px 14px rgba(236,72,153,0.4)",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 10px 20px rgba(236,72,153,0.5)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 6px 14px rgba(236,72,153,0.4)";
          }}
        >
          <div style={{ textAlign: "left" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Icon name="crown" size={16} color="#fff" strokeWidth={1.5} />
              <span>Subscribe — Access All Exams</span>
            </div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.8)", marginTop: 4 }}>
              From $9.99/mo · Unlimited exams · Cancel anytime
            </div>
          </div>
          <Icon name="arrow" size={16} color="#fff" />
        </button>

        {/* Sign up CTA for guests */}
        {!user && (
          <div
            style={{
              padding: "12px 16px",
              borderRadius: 14,
              background: "rgba(99,102,241,0.06)",
              border: "1px solid rgba(99,102,241,0.15)",
              fontSize: 12,
              color: "var(--text3)",
              textAlign: "center",
            }}
          >
            Already have an account?{" "}
            <button
              onClick={() => setPage?.("auth", { mode: "login" })}
              style={{
                background: "none",
                border: "none",
                color: "var(--accent)",
                fontWeight: 800,
                cursor: "pointer",
                fontSize: 12,
                fontFamily: "inherit",
                padding: 0,
                textDecoration: "underline",
              }}
            >
              Sign in
            </button>{" "}
            to restore your access level.
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Quiz Access Enforcer (unchanged, but kept for compatibility)
// ─────────────────────────────────────────────────────────────────────────────
export async function getQuizQuestionLimit(userId, examId, totalQuestions) {
  const access = await checkUserAccess(userId, examId);
  const limit = getAccessLimit(access?.accessType || "guest");
  return {
    allowedCount: Math.max(1, Math.ceil(totalQuestions * limit)),
    limit,
    accessType: access?.accessType || "guest",
    hasFullAccess: access?.hasAccess,
  };
}

export default { ExamPriceBadge, ExamAccessGate, getQuizQuestionLimit };