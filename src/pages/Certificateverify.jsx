/**
 * CertificateVerify.jsx — Professional verification page
 * Fixes: Firestore read, error handling, visual polish
 */
import React, { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

const STATUS = { LOADING: "loading", VALID: "valid", INVALID: "invalid", ERROR: "error" };

// ── Animated check/cross ──
function ResultIcon({ success }) {
  return (
    <div style={{
      width: 80, height: 80, borderRadius: "50%",
      background: success ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
      border: `2px solid ${success ? "rgba(16,185,129,0.4)" : "rgba(239,68,68,0.35)"}`,
      display: "flex", alignItems: "center", justifyContent: "center",
      animation: "popIn 0.5s cubic-bezier(0.34,1.56,0.64,1) both",
    }}>
      {success ? (
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
          <path d="M5 12 L10 17 L19 8" stroke="#10b981" strokeWidth="2.5"
                strokeLinecap="round" strokeLinejoin="round"
                strokeDasharray="30" strokeDashoffset="0"
                style={{ animation: "drawCheck 0.5s 0.3s ease both" }}/>
        </svg>
      ) : (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
          <line x1="6" y1="6" x2="18" y2="18" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round"
                style={{ animation: "drawCheck 0.4s 0.2s ease both" }}/>
          <line x1="18" y1="6" x2="6" y2="18" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round"
                style={{ animation: "drawCheck 0.4s 0.35s ease both" }}/>
        </svg>
      )}
    </div>
  );
}

// ── Field row in cert details ──
function CertField({ label, value, mono, green, accent }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", gap: 4,
      background: "var(--bg3, #f8fafc)",
      borderRadius: 12, padding: "12px 16px",
      border: "1px solid var(--border, #e2e8f0)",
    }}>
      <span style={{
        fontSize: 10.5, color: "var(--text3, #94a3b8)",
        fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em",
      }}>{label}</span>
      <span style={{
        fontSize: mono ? 13 : 15, fontWeight: 700,
        color: green ? "#10b981" : accent ? "#4f46e5" : "var(--text, #1e293b)",
        fontFamily: mono ? "'JetBrains Mono', 'Courier New', monospace" : "inherit",
        wordBreak: "break-all",
      }}>{value}</span>
    </div>
  );
}

export default function CertificateVerify({ certId, setPage }) {
  const [status, setStatus] = useState(STATUS.LOADING);
  const [certData, setCertData] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [mounted, setMounted] = useState(false);

  // Support both prop and URL param
  const id = certId || (typeof window !== "undefined"
    ? new URLSearchParams(window.location.search).get("id")
    : null);

  useEffect(() => { setTimeout(() => setMounted(true), 80); }, []);

  useEffect(() => {
    if (!id) {
      setStatus(STATUS.INVALID);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const ref = doc(db, "certificates", id);
        const snap = await getDoc(ref);

        if (cancelled) return;

        if (snap.exists()) {
          setCertData(snap.data());
          setStatus(STATUS.VALID);
        } else {
          setStatus(STATUS.INVALID);
        }
      } catch (err) {
        if (cancelled) return;
        console.error("Certificate verification error:", err);
        const code = err?.code || "";
        if (code === "permission-denied") {
          setErrorMsg("Access denied. The verification service could not read this certificate. Please check Firebase security rules.");
        } else if (code === "unavailable" || code === "deadline-exceeded") {
          setErrorMsg("Network error. Could not connect to the verification server. Please check your connection and try again.");
        } else if (err?.message?.includes("client is offline")) {
          setErrorMsg("You appear to be offline. Please reconnect and try again.");
        } else {
          setErrorMsg(`Verification failed: ${err?.message || "An unexpected error occurred."}`);
        }
        setStatus(STATUS.ERROR);
      }
    })();

    return () => { cancelled = true; };
  }, [id]);

  const formatDate = ts => {
    if (!ts) return "—";
    try {
      if (ts?.toDate) return ts.toDate().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
      return new Date(ts).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    } catch { return "—"; }
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "40px 20px",
      background: "var(--bg, #f1f5f9)",
      opacity: mounted ? 1 : 0,
      transition: "opacity 0.5s ease",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

        @keyframes fadeUp { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
        @keyframes spin { to { transform:rotate(360deg); } }
        @keyframes popIn { from { transform:scale(0.4); opacity:0; } to { transform:scale(1); opacity:1; } }
        @keyframes drawCheck { from { stroke-dashoffset:30; } to { stroke-dashoffset:0; } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.5; } }
        @keyframes shimmer { 0% { background-position:-400px 0; } 100% { background-position:400px 0; } }

        .verify-wrap { animation: fadeUp 0.5s cubic-bezier(0.16,1,0.3,1) both; max-width: 540px; width: 100%; }

        .verify-card {
          background: var(--bg2, white);
          border: 1.5px solid var(--border, #e2e8f0);
          border-radius: 24px;
          padding: 40px 36px;
          box-shadow: 0 4px 32px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04);
        }

        .status-badge-valid {
          display: inline-flex; align-items: center; gap: 8px;
          background: rgba(16,185,129,0.1); border: 1.5px solid rgba(16,185,129,0.3);
          color: #059669; border-radius: 99px; padding: 6px 18px;
          font-size: 13px; font-weight: 800; letter-spacing: 0.02em;
        }
        .status-badge-invalid {
          display: inline-flex; align-items: center; gap: 8px;
          background: rgba(239,68,68,0.1); border: 1.5px solid rgba(239,68,68,0.3);
          color: #dc2626; border-radius: 99px; padding: 6px 18px;
          font-size: 13px; font-weight: 800;
        }

        .action-btn {
          padding: 9px 20px; border-radius: 10px;
          font-size: 13px; font-weight: 700;
          cursor: pointer; font-family: 'Inter', inherit;
          transition: all 0.2s;
        }
        .action-btn:hover { transform: translateY(-1px); }
      `}</style>

      <div className="verify-wrap">

       {/* ── Brand header ── */}
<div style={{ textAlign: "center", marginBottom: 28 }}>
  {/* Logo */}
  <div style={{ display: "inline-flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
    {/* الصورة المستبدلة بدلاً من SVG */}
    <img 
      src="https://i.ibb.co/DPztDcgx/Chat-GPT-Image-Apr-26-2026-09-45-41-PM.png" 
      width="10%" 
      height="10%" 
      alt="FlexExams Logo" 
      style={{ display: "block", borderRadius: "8px" }} // إضافة borderRadius اختياري لتناسب شكل الدرع
    />
    <div>
      <div style={{ fontSize: 20, fontWeight: 900, letterSpacing: "-0.5px", background: "linear-gradient(135deg, #4f46e5, #7c3aed)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", lineHeight: 1.1 }}>FlexExams</div>
      <div style={{ fontSize: 9, color: "var(--text3, #94a3b8)", letterSpacing: "3px", textTransform: "uppercase", fontWeight: 700 }}>Certification Platform</div>
    </div>
  </div>
  <div style={{ fontSize: 12, color: "var(--text3, #94a3b8)", letterSpacing: "2px", textTransform: "uppercase", fontWeight: 600, marginTop: 4 }}>
    Certificate Verification
  </div>
</div>

        {/* ── Main card ── */}
        <div className="verify-card">

          {/* ── LOADING ── */}
          {status === STATUS.LOADING && (
            <div style={{ textAlign: "center", padding: "28px 0" }}>
              <div style={{
                width: 52, height: 52, margin: "0 auto 20px",
                border: "3px solid var(--border, #e2e8f0)",
                borderTopColor: "#6366f1",
                borderRadius: "50%",
                animation: "spin 0.9s linear infinite",
              }}/>
              <div style={{ color: "var(--text, #1e293b)", fontSize: 16, fontWeight: 700, marginBottom: 8 }}>
                Verifying Certificate
              </div>
              <div style={{ color: "var(--text3, #94a3b8)", fontSize: 13, marginBottom: 6 }}>
                Connecting to secure verification server…
              </div>
              {id && (
                <div style={{
                  display: "inline-block",
                  background: "var(--bg3, #f8fafc)", border: "1px solid var(--border, #e2e8f0)",
                  borderRadius: 8, padding: "4px 12px",
                  fontSize: 11.5, color: "var(--text3, #94a3b8)",
                  fontFamily: "monospace", marginTop: 4,
                }}>ID: {id}</div>
              )}
            </div>
          )}

          {/* ── VALID ── */}
          {status === STATUS.VALID && certData && (
            <div style={{ display: "flex", flexDirection: "column", gap: 24, alignItems: "center" }}>
              <ResultIcon success />
              <div>
                <span className="status-badge-valid">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                  Verified Certificate
                </span>
              </div>

              <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 10 }}>
                <CertField label="Certified Holder" value={certData.userName || "—"} />
                <CertField label="Examination" value={certData.examTitle || "—"} />
                <CertField label="Score Achieved" value={certData.score != null ? `${certData.score}%` : "—"} />
                <CertField label="Result" value="PASSED ✓" green />
                <CertField label="Issue Date" value={formatDate(certData.issuedAt || certData.date)} />
                <CertField label="Certificate ID" value={id} mono accent />
              </div>

              <div style={{
                width: "100%",
                background: "rgba(16,185,129,0.06)",
                border: "1px solid rgba(16,185,129,0.2)",
                borderRadius: 14,
                padding: "16px 20px",
                fontSize: 13,
                color: "var(--text2, #475569)",
                lineHeight: 1.7,
                textAlign: "center",
              }}>
                <strong style={{ color: "#059669" }}>🎓 Official Verification</strong>
                <br/>
                This certificate was digitally issued and authenticated by <strong>FlexExams</strong>. The holder named above successfully passed the certification examination on the date indicated above. This record is tamper-proof and permanently stored.
              </div>

              {/* QR visual */}
              <div style={{ textAlign: "center" }}>
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(window.location.href)}&color=1e1b4b&bgcolor=ffffff&qzone=1&ecc=H`}
                  alt="Verification QR"
                  style={{ width: 72, height: 72, borderRadius: 8, border: "1px solid var(--border, #e2e8f0)", padding: 2, background: "#fff" }}
                />
                <div style={{ fontSize: 10, color: "var(--text3, #94a3b8)", marginTop: 6, letterSpacing: "1px" }}>SCAN TO SHARE</div>
              </div>
            </div>
          )}

          {/* ── INVALID ── */}
          {status === STATUS.INVALID && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20, alignItems: "center", padding: "8px 0", textAlign: "center" }}>
              <ResultIcon success={false} />
              <span className="status-badge-invalid">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                Certificate Not Found
              </span>
              <div style={{ color: "var(--text2, #475569)", fontSize: 15, lineHeight: 1.8, maxWidth: 380 }}>
                No certificate was found matching the ID:
                <br/>
                <code style={{
                  display: "inline-block", marginTop: 8,
                  background: "var(--bg3, #f8fafc)", padding: "4px 12px",
                  borderRadius: 8, fontSize: 12.5,
                  fontFamily: "'JetBrains Mono', monospace",
                  border: "1px solid var(--border, #e2e8f0)",
                  wordBreak: "break-all",
                }}>{id || "—"}</code>
              </div>
              <div style={{ fontSize: 13.5, color: "var(--text3, #94a3b8)", lineHeight: 1.7, maxWidth: 360 }}>
                Please double-check the ID from the certificate or QR code. If you believe this is an error, contact our support team at <strong>support@FlexExams.com</strong>.
              </div>
            </div>
          )}

          {/* ── ERROR ── */}
          {status === STATUS.ERROR && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20, alignItems: "center", padding: "8px 0", textAlign: "center" }}>
              <div style={{
                width: 72, height: 72, borderRadius: "50%",
                background: "rgba(245,158,11,0.1)",
                border: "2px solid rgba(245,158,11,0.3)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 32,
                animation: "popIn 0.5s cubic-bezier(0.34,1.56,0.64,1) both",
              }}>⚠️</div>
              <div style={{ fontSize: 17, fontWeight: 800, color: "var(--text, #1e293b)" }}>
                Verification Unavailable
              </div>
              <div style={{
                background: "rgba(245,158,11,0.08)",
                border: "1px solid rgba(245,158,11,0.25)",
                borderRadius: 14, padding: "14px 18px",
                fontSize: 13.5, color: "var(--text2, #475569)",
                lineHeight: 1.7, maxWidth: 380, textAlign: "left",
              }}>
                {errorMsg || "Unable to verify at this time. Please check your internet connection and try again."}
              </div>
              <button
                className="action-btn"
                onClick={() => window.location.reload()}
                style={{
                  background: "var(--gradient-accent, linear-gradient(135deg,#4f46e5,#7c3aed))",
                  border: "none", color: "#fff",
                  boxShadow: "0 4px 16px rgba(79,70,229,0.35)",
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline", marginRight: 6, verticalAlign: "middle" }}><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
                Try Again
              </button>
            </div>
          )}
        </div>

        {/* ── Navigation buttons ── */}
        <div style={{ textAlign: "center", marginTop: 20, display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          <button
            className="action-btn"
            onClick={() => setPage?.("home")}
            style={{
              background: "var(--bg2, white)",
              border: "1.5px solid var(--border, #e2e8f0)",
              color: "var(--text2, #475569)",
            }}
          >
            ← Back to FlexExams
          </button>
          <button
            className="action-btn"
            onClick={() => setPage?.("exams")}
            style={{
              background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
              border: "none", color: "#fff",
              boxShadow: "0 4px 16px rgba(79,70,229,0.3)",
            }}
          >
            Browse Exams →
          </button>
        </div>

        <div style={{ textAlign: "center", marginTop: 18, fontSize: 11.5, color: "var(--text3, #94a3b8)", letterSpacing: "0.03em" }}>
          Powered by FlexExams · Certificate Verification System
          <br/>
          <span style={{ fontSize: 10.5, opacity: 0.7 }}>FlexExams.com</span>
        </div>
      </div>
    </div>
  );
}