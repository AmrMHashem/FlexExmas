// DiagnosticCard.jsx — Standalone card to embed in Home before "Exam of the Day"
// Drop this into the Home page JSX where indicated
// Usage: <DiagnosticCard setPage={setPage} />

import React, { useState, useEffect } from "react";

function DiagnosticCardInner({ setPage }) {
  const [hovered, setHovered] = useState(false);
  const [savedProgress, setSavedProgress] = useState(false);
  const [pct, setPct] = useState(0);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("flexexams_diagnostic");
      if (saved) {
        const { answers, phase } = JSON.parse(saved);
        if (phase === "quiz" && answers) {
          const count = Object.keys(answers).length;
          setSavedProgress(true);
          setPct(Math.round((count / 50) * 100));
        }
      }
    } catch {}
  }, []);

  return (
    <>
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(300%); }
        }
        @keyframes floatBadge {
          0%, 100% { transform: translateY(0px) rotate(-2deg); }
          50% { transform: translateY(-6px) rotate(-2deg); }
        }
        @keyframes pulseGlow {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        .diag-hero-card {
          transition: transform 0.3s cubic-bezier(0.16,1,0.3,1), box-shadow 0.3s ease, border-color 0.3s ease;
        }
        .diag-cta-btn {
          transition: all 0.22s cubic-bezier(0.16,1,0.3,1);
        }
        .diag-cta-btn:hover {
          transform: scale(1.04) translateY(-1px);
        }
        .diag-domain-dot { animation: pulseGlow 2s ease-in-out infinite; }
      `}</style>

      <div
        className="diag-hero-card"
        onClick={() => setPage("career-diagnostic")}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          cursor: "pointer",
          background: hovered
            ? "linear-gradient(135deg, #484496 0%, #ae941f 45%, #db2777 100%)"
            : "linear-gradient(135deg, #46478b 0%, #8b5cf6 50%, #ec4899 100%)",
          borderRadius: 22,
          padding: "clamp(24px,4vw,40px)",
          position: "relative",
          overflow: "hidden",
          boxShadow: hovered
            ? "0 28px 64px rgba(99,102,241,0.40), 0 8px 24px rgba(139,92,246,0.25)"
            : "0 12px 36px rgba(99,102,241,0.25), 0 4px 12px rgba(0,0,0,0.08)",
          border: "2px solid rgba(255,255,255,0.1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "clamp(20px,4vw,48px)",
          flexWrap: "wrap",
        }}
      >
        {/* Background decoration */}
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 75% 50%, rgba(255,255,255,0.08) 0%, transparent 65%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: -40, right: -40, width: 200, height: 200, borderRadius: "50%", background: "rgba(255,255,255,0.04)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -30, left: 100, width: 140, height: 140, borderRadius: "50%", background: "rgba(255,255,255,0.03)", pointerEvents: "none" }} />

        {/* Shimmer on hover */}
        {hovered && (
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, overflow: "hidden", pointerEvents: "none" }}>
            <div style={{ position: "absolute", top: 0, bottom: 0, width: "40%", background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.07), transparent)", animation: "shimmer 1s ease-in-out" }} />
          </div>
        )}

        {/* Left: text */}
        <div style={{ position: "relative", zIndex: 1, flex: 1, minWidth: 240 }}>
          {/* Label */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "rgba(255,255,255,0.15)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.25)", borderRadius: 100, padding: "5px 14px", marginBottom: 14, fontSize: 11, fontWeight: 800, color: "#fff", textTransform: "uppercase", letterSpacing: "0.12em" }}>
            ✦ New Feature
          </div>

          <h2 style={{ fontSize: "clamp(20px,3vw,30px)", fontWeight: 900, color: "#fff", letterSpacing: "-0.8px", lineHeight: 1.15, marginBottom: 10 }}>
            Discover Your Tech Career Path
          </h2>

          <p style={{ fontSize: "clamp(13px,1.5vw,15px)", color: "rgba(255,255,255,0.82)", lineHeight: 1.65, marginBottom: 18, maxWidth: 480 }}>
            Take our 70-question multi-domain assessment. Get a personalized skill map, career matches with salary data, and a curated study roadmap.
          </p>

          {/* Domain chips */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 20 }}>
            {[
              { label: "💻 Programming", c: "#a5b4fc" },
              { label: "🌐 Networking",  c: "#7dd3fc" },
              { label: "📊 Data Analysis", c: "#6ee7b7" },
              { label: "🗄️ Databases",   c: "#fcd34d" },
              { label: "🎨 UI/UX",       c: "#f9a8d4" },
              { label: "📝 Tech English", c: "#c4b5fd" },
              { label: "🧠 Logic",        c: "#fca5a5" },
            ].map(d => (
              <div key={d.label} style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 100, padding: "4px 11px", fontSize: 12, fontWeight: 700, color: d.c, whiteSpace: "nowrap" }}>
                {d.label}
              </div>
            ))}
          </div>

          {/* Stats row */}
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
            {[
              { v: "70", l: "Questions" },
              { v: "7", l: "Domains" },
              { v: "8+", l: "Career Paths" },
              { v: "No timer", l: "Relaxed" },
            ].map(s => (
              <div key={s.l}>
                <div style={{ fontSize: 18, fontWeight: 900, color: "#fff", letterSpacing: "-0.5px" }}>{s.v}</div>
                <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.65)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: CTA + floating badge */}
        <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 14, flexShrink: 0 }}>
          {/* Floating skill card illustration */}
          <div style={{ animation: "floatBadge 4s ease-in-out infinite", background: "rgba(255,255,255,0.14)", backdropFilter: "blur(12px)", border: "1.5px solid rgba(255,255,255,0.25)", borderRadius: 18, padding: "16px 20px", textAlign: "center", minWidth: 140, marginBottom: 4 }}>
            <div style={{ fontSize: 30, marginBottom: 8 }}>🧠</div>
            <div style={{ fontSize: 12, fontWeight: 800, color: "#fff", marginBottom: 4 }}>Career Intelligence</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              {[["Programming", 82], ["Data Analysis", 71], ["Networking", 58]].map(([d, v]) => (
                <div key={d}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "rgba(255,255,255,0.75)", marginBottom: 2 }}>
                    <span>{d}</span><span>{v}%</span>
                  </div>
                  <div style={{ height: 4, background: "rgba(255,255,255,0.15)", borderRadius: 100 }}>
                    <div style={{ width: `${v}%`, height: "100%", background: "rgba(255,255,255,0.7)", borderRadius: 100 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CTA button */}
          <button
            className="diag-cta-btn"
            onClick={e => { e.stopPropagation(); setPage("career-diagnostic"); }}
            style={{
              padding: "13px 28px",
              borderRadius: 14,
              background: "#fff",
              color: "#4f46e5",
              border: "none",
              fontSize: 14.5,
              fontWeight: 800,
              cursor: "pointer",
              fontFamily: "inherit",
              letterSpacing: "-0.2px",
              boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
              display: "flex",
              alignItems: "center",
              gap: 8,
              whiteSpace: "nowrap",
            }}
          >
            {savedProgress ? `Continue (${pct}%)` : "Start Free Assessment"}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
            </svg>
          </button>
          <div style={{ fontSize: 11.5, color: "rgba(255,255,255,0.65)", fontWeight: 600 }}>
            No sign-up required
          </div>
        </div>
      </div>
    </>
  );
}

export default DiagnosticCardInner;
