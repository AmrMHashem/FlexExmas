import React, { useEffect, useRef, useState } from "react";

// ── Animated counter hook ──
function useCounter(target, duration = 1800, start = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime = null;
    const num = parseFloat(target.replace(/[^0-9.]/g, ""));
    const suffix = target.replace(/[0-9.]/g, "");
    const step = (ts) => {
      if (!startTime) startTime = ts;
      const progress = Math.min((ts - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * num) + suffix);
      if (progress < 1) requestAnimationFrame(step);
      else setCount(target);
    };
    requestAnimationFrame(step);
  }, [start, target]);
  return count || "0";
}

// ── Stat card with animated counter ──
function StatCard({ num, label, delay = 0 }) {
  const [visible, setVisible] = useState(false);
  const ref = useRef();
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.4 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  const count = useCounter(num, 1800, visible);
  return (
    <div ref={ref} style={{
      textAlign: "center",
      animation: visible ? `fadeUp 0.6s ${delay}ms both` : "none",
    }}>
      <div style={{
        fontSize: "clamp(38px, 5vw, 58px)",
        fontWeight: 900, color: "#fff",
        letterSpacing: "-2px",
        fontFamily: "'Syne', sans-serif",
        lineHeight: 1,
        marginBottom: 8,
        textShadow: "0 0 40px rgba(255,255,255,0.3)",
      }}>{count}</div>
      <div style={{ fontSize: 13, color: "rgba(255,255,255,0.75)", fontWeight: 500, letterSpacing: "0.04em" }}>
        {label}
      </div>
    </div>
  );
}

// ── Feature card ──
function FeatureCard({ icon, title, desc, index }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? "var(--bg3)" : "var(--bg2)",
        border: `1.5px solid ${hovered ? "var(--accent)" : "var(--border)"}`,
        borderRadius: 20,
        padding: "28px 24px",
        transition: "all 0.3s cubic-bezier(0.16,1,0.3,1)",
        transform: hovered ? "translateY(-4px)" : "none",
        boxShadow: hovered ? "0 20px 48px var(--accent-glow)" : "none",
        cursor: "default",
        animation: `fadeUp 0.5s ${index * 80}ms both`,
      }}
    >
      <div style={{
        width: 52, height: 52, borderRadius: 16,
        background: hovered ? "var(--gradient-accent)" : "var(--bg3)",
        border: `1.5px solid ${hovered ? "transparent" : "var(--border)"}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        marginBottom: 18,
        transition: "all 0.3s",
        boxShadow: hovered ? "0 8px 24px var(--accent-glow)" : "none",
      }}>
        {icon}
      </div>
      <h4 style={{
        fontSize: 15, fontWeight: 700, marginBottom: 10,
        color: hovered ? "var(--accent)" : "var(--text)",
        fontFamily: "'Syne', sans-serif",
        transition: "color 0.3s",
      }}>{title}</h4>
      <p style={{ fontSize: 13.5, color: "var(--text2)", lineHeight: 1.8 }}>{desc}</p>
    </div>
  );
}

// ── Timeline step ──
function TimelineStep({ year, title, desc, index }) {
  const [visible, setVisible] = useState(false);
  const ref = useRef();
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.3 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} style={{
      display: "flex", gap: 24, alignItems: "flex-start",
      opacity: visible ? 1 : 0,
      transform: visible ? "none" : "translateX(-20px)",
      transition: `all 0.6s ${index * 150}ms cubic-bezier(0.16,1,0.3,1)`,
    }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0, flexShrink: 0 }}>
        <div style={{
          width: 48, height: 48, borderRadius: "50%",
          background: "var(--gradient-accent)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 12, fontWeight: 800, color: "#fff",
          boxShadow: "0 6px 20px var(--accent-glow)",
          flexShrink: 0,
        }}>{year}</div>
        {index < 3 && <div style={{ width: 2, height: 48, background: "var(--border)", marginTop: 4 }}/>}
      </div>
      <div style={{ paddingTop: 10 }}>
        <h4 style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", marginBottom: 6, fontFamily: "'Syne', sans-serif" }}>{title}</h4>
        <p style={{ fontSize: 13.5, color: "var(--text2)", lineHeight: 1.75 }}>{desc}</p>
      </div>
    </div>
  );
}

export default function About() {
  const features = [
    {
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>,
      title: "Verified Exam Questions",
      desc: "Every question is sourced from real certification exams and reviewed by certified professionals. No filler content — only what matters for your exam day.",
    },
    {
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
      title: "Precision Analytics",
      desc: "Domain-level performance tracking pinpoints your exact weak spots. Know which topics to revisit, track score trends, and receive a readiness score before exam day.",
    },
    {
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>,
      title: "Verifiable Certificates",
      desc: "Pass an exam and instantly receive a digitally-signed certificate with a unique QR code. Share it on LinkedIn or your resume — employers can verify its authenticity.",
    },
    {
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
      title: "Timed Simulation Mode",
      desc: "Replicate the exact pressure of your certification exam with our timed simulation. Real time limits, randomized questions, and instant scoring — just like the real thing.",
    },
    {
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
      title: "Expert Community",
      desc: "Join a growing network of certified professionals. Discuss questions, share strategies, and get mentored by those who've already passed your target certification.",
    },
    {
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>,
      title: "Unlimited Retakes",
      desc: "No daily caps. No subscriptions. Retake any exam as many times as you need. Each attempt provides fresh question randomization and detailed performance breakdown.",
    },
  ];

  const stats = [
    { num: "50+", label: "Certifications Covered" },
    { num: "100K+", label: "Professionals Passed" },
    { num: "500K+", label: "Exams Completed" },
    { num: "98%", label: "Pass Rate" },
  ];

  const timeline = [
    { year: "2020", title: "The Problem Was Real", desc: "Our founders spent months scouring the internet for quality AWS exam prep materials. Fragmented resources, outdated questions, zero structure. They knew there had to be a better way." },
    { year: "2021", title: "FlexExams Launched", desc: "We launched with 5 certification tracks and 3,000 curated questions. Within 90 days, 5,000 professionals had joined and our pass rate data began to tell an undeniable story." },
    { year: "2022", title: "Scale & Depth", desc: "Expanded to 30+ certifications, introduced domain analytics, and rolled out our verified certificate system with tamper-proof QR verification trusted by Fortune 500 HR teams." },
    { year: "2024", title: "Community & AI Features", desc: "Today, 100,000+ professionals use FlexExams. We've added AI-powered study recommendations, peer discussion boards, and mobile-first exam simulation — all free to use." },
  ];

  const values = [
    { title: "Radical Transparency", desc: "We show you every score, every wrong answer, and exactly what to fix. No sugar-coating — just honest data that leads to real growth." },
    { title: "Accessibility First", desc: "Certification shouldn't be a privilege. FlexExams is free for learners worldwide — no paywalls on the questions that matter most." },
    { title: "Relentless Quality", desc: "Our question team reviews every item quarterly. Outdated or inaccurate questions are removed or updated. You only practice what's actually on the exam." },
  ];

  return (
    <div style={{ background: "var(--bg2)" }}>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
        @keyframes float { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-10px); } }
        @keyframes shimmer { 0% { background-position:-600px 0; } 100% { background-position:600px 0; } }
      `}</style>

      {/* ── Hero ── */}
      <div style={{
        background: "var(--bg2)",
        padding: "80px 24px 56px",
        textAlign: "center",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Background grid */}
        <div style={{
          position: "absolute", inset: 0, opacity: 0.03,
          backgroundImage: "linear-gradient(var(--text) 1px, transparent 1px), linear-gradient(90deg, var(--text) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          pointerEvents: "none",
        }}/>
        {/* Glow blobs */}
        <div style={{ position: "absolute", top: -80, left: "50%", transform: "translateX(-50%)", width: 600, height: 400, background: "radial-gradient(circle, var(--accent-glow) 0%, transparent 70%)", pointerEvents: "none", opacity: 0.4 }}/>

        <div style={{ maxWidth: 800, margin: "0 auto", position: "relative" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "var(--accent-soft)", border: "1px solid rgba(139,92,246,0.3)",
            borderRadius: 99, padding: "6px 16px", marginBottom: 24,
            fontSize: 12, fontWeight: 700, color: "var(--accent)", letterSpacing: "0.06em",
            textTransform: "uppercase",
            animation: "fadeUp 0.5s both",
          }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5Z"/></svg>
            Our Story
          </div>

          <h1 style={{
            fontSize: "clamp(34px, 5vw, 60px)",
            fontWeight: 900, marginBottom: 20,
            color: "var(--text)", letterSpacing: "-2px",
            fontFamily: "'Syne', sans-serif",
            lineHeight: 1.1,
            animation: "fadeUp 0.5s 100ms both",
          }}>
            Built by Professionals,<br/>
            <span style={{
              background: "var(--gradient-accent)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>For Professionals</span>
          </h1>

          <p style={{
            fontSize: 17, color: "var(--text2)",
            maxWidth: 620, margin: "0 auto", lineHeight: 1.85,
            animation: "fadeUp 0.5s 200ms both",
          }}>
            We built the certification prep platform we wished existed — no bloated courses, 
            no guesswork, no wasted time. Just targeted practice, honest feedback, and a 
            community that celebrates every milestone with you.
          </p>

          <div style={{
            display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap",
            marginTop: 32,
            animation: "fadeUp 0.5s 300ms both",
          }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              background: "var(--bg3)", border: "1px solid var(--border)",
              borderRadius: 10, padding: "10px 18px",
              fontSize: 13, color: "var(--text2)", fontWeight: 500,
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              Trusted by 100,000+ professionals
            </div>
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              background: "var(--bg3)", border: "1px solid var(--border)",
              borderRadius: 10, padding: "10px 18px",
              fontSize: 13, color: "var(--text2)", fontWeight: 500,
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              Founded in 2020 · Fully bootstrapped
            </div>
          </div>
        </div>
      </div>

      {/* ── Stats Banner ── */}
      <div style={{
        background: "var(--gradient-accent)",
        padding: "60px 24px",
        position: "relative",
        overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "radial-gradient(circle at 20% 50%, rgba(255,255,255,0.06) 0%, transparent 50%), radial-gradient(circle at 80% 50%, rgba(255,255,255,0.06) 0%, transparent 50%)",
          pointerEvents: "none",
        }}/>
        <div style={{
          maxWidth: 900, margin: "0 auto",
          display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: 40, position: "relative",
        }}>
          {stats.map((s, i) => <StatCard key={i} {...s} delay={i * 100} />)}
        </div>
      </div>

      {/* ── Mission ── */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "80px 24px" }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: 60, alignItems: "center",
        }}>
          <div>
            <div style={{
              fontSize: 11, fontWeight: 800, color: "var(--accent)",
              textTransform: "uppercase", letterSpacing: "0.12em",
              marginBottom: 14,
              display: "flex", alignItems: "center", gap: 8,
            }}>
              <div style={{ width: 20, height: 2, background: "var(--accent)", borderRadius: 2 }}/>
              Our Mission
            </div>
            <h2 style={{
              fontSize: "clamp(26px, 3.5vw, 40px)",
              fontWeight: 900, marginBottom: 24,
              color: "var(--text)", fontFamily: "'Syne', sans-serif",
              letterSpacing: "-1px", lineHeight: 1.2,
            }}>
              Your Certification.<br/>Your Timeline.<br/>Your Terms.
            </h2>
            <p style={{ fontSize: 15, color: "var(--text2)", lineHeight: 1.9, marginBottom: 20 }}>
              FlexExams was built because passing a certification exam is life-changing — it opens doors 
              to higher salaries, better roles, and greater professional respect. Yet most prep resources 
              fail the people who need them most.
            </p>
            <p style={{ fontSize: 15, color: "var(--text2)", lineHeight: 1.9, marginBottom: 28 }}>
              We obsess over question accuracy, analytics depth, and user experience so that you can 
              focus entirely on what matters: becoming certified.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {["Questions reviewed by certified experts quarterly", "Score analytics down to the individual domain", "Free to start — no credit card required"].map((item, i) => (
                <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start", fontSize: 14, color: "var(--text2)" }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: "50%",
                    background: "var(--gradient-accent)", flexShrink: 0, marginTop: 1,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div style={{ position: "relative" }}>
            {/* Values cards */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {values.map((v, i) => (
                <div key={i} style={{
                  background: "var(--bg2)",
                  border: "1.5px solid var(--border)",
                  borderRadius: 16,
                  padding: "20px 24px",
                  display: "flex", gap: 16, alignItems: "flex-start",
                  boxShadow: "var(--card-shadow)",
                  transition: "all 0.25s",
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: `rgba(99,102,241,${0.1 + i * 0.05})`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0, fontSize: 16,
                    border: "1px solid rgba(99,102,241,0.2)",
                  }}>
                    {["⚖️", "🌍", "🔬"][i]}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 5, fontFamily: "'Syne', sans-serif" }}>{v.title}</div>
                    <div style={{ fontSize: 13, color: "var(--text2)", lineHeight: 1.7 }}>{v.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Features ── */}
      <div style={{ background: "var(--bg)", padding: "80px 24px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 14 }}>
              Platform Features
            </div>
            <h2 style={{
              fontSize: "clamp(26px, 3.5vw, 44px)",
              fontWeight: 900, color: "var(--text)",
              fontFamily: "'Syne', sans-serif", letterSpacing: "-1.5px",
              marginBottom: 16,
            }}>
              Why 100,000+ Professionals<br/>Choose FlexExams
            </h2>
            <p style={{ fontSize: 16, color: "var(--text2)", maxWidth: 560, margin: "0 auto", lineHeight: 1.7 }}>
              Every feature was designed around a single question: what would actually help someone pass their next certification exam?
            </p>
          </div>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: 20,
          }}>
            {features.map((f, i) => <FeatureCard key={i} {...f} index={i} />)}
          </div>
        </div>
      </div>

      {/* ── Journey / Timeline ── */}
      <div style={{ maxWidth: 780, margin: "0 auto", padding: "80px 24px" }}>
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 14 }}>
            Our Journey
          </div>
          <h2 style={{
            fontSize: "clamp(26px, 3vw, 40px)",
            fontWeight: 900, color: "var(--text)",
            fontFamily: "'Syne', sans-serif", letterSpacing: "-1px",
          }}>
            How We Got Here
          </h2>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
          {timeline.map((t, i) => <TimelineStep key={i} {...t} index={i} />)}
        </div>
      </div>

      {/* ── CTA ── */}
      <div style={{
        background: "var(--gradient-accent)",
        padding: "80px 24px", textAlign: "center",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", inset: 0,
          background: "radial-gradient(ellipse at center, rgba(255,255,255,0.07) 0%, transparent 60%)",
          pointerEvents: "none",
        }}/>
        <div style={{ maxWidth: 620, margin: "0 auto", position: "relative" }}>
          <div style={{
            width: 72, height: 72, borderRadius: "50%",
            background: "rgba(255,255,255,0.15)",
            border: "2px solid rgba(255,255,255,0.25)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 24px",
            fontSize: 32,
            animation: "float 4s ease-in-out infinite",
          }}>🚀</div>
          <h2 style={{
            fontSize: "clamp(24px, 3.5vw, 42px)",
            fontWeight: 900, marginBottom: 16,
            color: "#fff", fontFamily: "'Syne', sans-serif",
            letterSpacing: "-1px",
          }}>
            Ready to Get Certified?
          </h2>
          <p style={{ fontSize: 16, color: "rgba(255,255,255,0.85)", marginBottom: 32, lineHeight: 1.7 }}>
            Join 100,000+ professionals who trust FlexExams to prepare them for the exams that change careers.
            Your first practice exam is free — no account required.
          </p>
          <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
            <button style={{
              padding: "14px 32px", borderRadius: 50,
              background: "#fff", border: "none",
              color: "#4f46e5", fontSize: 15, fontWeight: 800,
              cursor: "pointer", fontFamily: "inherit",
              boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
              transition: "all 0.25s",
              display: "flex", alignItems: "center", gap: 8,
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 16px 40px rgba(0,0,0,0.25)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 8px 32px rgba(0,0,0,0.2)"; }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
              Browse Exams
            </button>
            <button style={{
              padding: "14px 28px", borderRadius: 50,
              background: "rgba(255,255,255,0.15)", border: "2px solid rgba(255,255,255,0.4)",
              color: "#fff", fontSize: 15, fontWeight: 700,
              cursor: "pointer", fontFamily: "inherit",
              backdropFilter: "blur(8px)",
              transition: "all 0.25s",
            }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.25)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.15)"; e.currentTarget.style.transform = ""; }}
            >
              View Certifications
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}