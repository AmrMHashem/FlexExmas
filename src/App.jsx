// App.jsx — FlexExams v4.2 — Desktop/Laptop fixed + APK mobile
import React from "react";
import { useState, useCallback, useEffect } from "react";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import NavBar from "./components/NavBar";
import Footer from "./components/Footer";
import { Toast, Spinner } from "./components/UI";

import Home        from "./pages/Home";
import Exams       from "./pages/Exams";
import Topics      from "./pages/Topics";
import Categories  from "./pages/Categories";
import About       from "./pages/About";
import Contact     from "./pages/Contact";
import ExamDetail  from "./pages/ExamDetail";
import Quiz        from "./pages/Quiz";
import Result      from "./pages/Result";
import Auth        from "./pages/Auth";
import Dashboard   from "./pages/Dashboard";
import MyExams     from "./pages/MyExams";
import Admin       from "./pages/Admin";
import Favorites   from "./pages/Favorites";
import CertificateVerify from "./pages/Certificateverify";
import CareerDiagnostic  from "./pages/CareerDiagnostic";
import { getExams } from "./services/firestore";


const GLOBAL_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800;900&display=swap');

*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

:root {
  --bg: linear-gradient(135deg, #ffffff 0%, #e8dcfc 100%);
  --bg2:  linear-gradient(145deg, #ffffff 0%, #f7d1e5 100%);
  --bg3: #cee4f9;
  --bg4: #eef2ff;
  --border: #98bbe9;
  --border2: #94a3b8;
  --text: #0f172a;
  --text2: #081f42;
  --text3: #706070;
  --accent: #3c3a72;
  --accent2: #494575;
  --accent3: #c7d2fe;
  --green: #059669;
  --red: #dc2626;
  --gold: #d97706;
  --purple: #5e3b9b;
  --cyan: #0891b2;
  --gradient-accent: linear-gradient(135deg, #e5467b 0%, #7c3aed 100%);
  --gradient-hero: url('https://png.pngtree.com/background/20210711/original/pngtree-corporate-literary-minimalist-light-blue-training-background-poster-picture-image_1125432.jpg');
  --gradient-card: linear-gradient(135deg, #ffffff 0%, #fafbff 100%);
  --accent-soft: rgba(79, 70, 229, 0.08);
  --accent-glow: rgba(79, 70, 229, 0.15);
  --card-shadow: 0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.05);
  --card-hover: 0 8px 24px rgba(79,70,229,0.12), 0 4px 8px rgba(0,0,0,0.06);
  --nav-blur: blur(7px);
  --bg-glass: rgba(255, 255, 255, 0.95);
  --surface: var(--bg2);
  --navbar-height: 68px;
  --sticky-top-offset: calc(var(--navbar-height) + 16px);
}

[data-theme="dark"] {
  --bg: #0d1223;
  --bg2: linear-gradient(145deg, #1a2b69 0%, #060810 100%);
  --bg3: #131828;
  --bg4: #1a2035;
  --border: #6878ae;
  --border2: #727eb0;
  --text: #eef1fb;
  --text2: #bfc7e0;
  --text3: #9bb6f0;
  --accent: #7177ae;
  --accent2: #6c6da7;
  --accent3: #a5b4fc;
  --green: #10b981;
  --red: #f87171;
  --gold: #fbbf24;
  --purple: #5f87de;
  --cyan: #22d3ee;
  --gradient-accent: linear-gradient(135deg, #6b68c2 0%, #740060 100%);
  --gradient-hero: linear-gradient(145deg, #060810 0%, #2a45a4 100%);
  --gradient-card: linear-gradient(135deg, #0c0f1a 0%, #131828 100%);
  --accent-soft: rgba(129, 140, 248, 0.12);
  --accent-glow: rgba(129, 140, 248, 0.2);
  --card-shadow: 0 2px 12px rgba(0,0,0,0.4), 0 1px 4px rgba(0,0,0,0.3);
  --card-hover: 0 14px 32px rgba(129,140,248,0.15), 0 4px 12px rgba(0,0,0,0.4);
  --nav-blur: blur(7px);
  --bg-glass: rgba(6, 8, 16, 0.92);
  --surface: var(--bg2);
  --navbar-height: 68px;
  --sticky-top-offset: calc(var(--navbar-height) + 16px);
}

html {
  scroll-behavior: smooth;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  -webkit-text-size-adjust: 100%;
  text-size-adjust: 100%;
  overflow-x: hidden;
}

body {
  background: var(--bg);
  color: var(--text);
  font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
  min-height: 100vh;
  transition: background 0.5s cubic-bezier(0.2,0.9,0.4,1), color 0.4s ease;
  line-height: 1.6;
  font-weight: 400;
  overflow-x: hidden;
  position: relative;
}

h1, h2, h3, h4, h5, h6 {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.2;
}

::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: var(--bg2); }
::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 10px; }
::-webkit-scrollbar-thumb:hover { background: var(--accent); }

/* --- Animations (optimized) --- */
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
@keyframes fadeDown { from { opacity: 0; transform: translateY(-16px); } to { opacity: 1; transform: translateY(0); } }
@keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
@keyframes slideInRight { from { opacity: 0; transform: translateX(24px); } to { opacity: 1; transform: translateX(0); } }
@keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-8px); } }
@keyframes pulseGlow { 0%, 100% { opacity: 0.5; filter: blur(20px); } 50% { opacity: 0.9; filter: blur(12px); } }
@keyframes spin { to { transform: rotate(360deg); } }
@keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
@keyframes toastIn { from { opacity: 0; transform: translateX(40px); } to { opacity: 1; transform: translateX(0); } }
@keyframes gradientShift { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
@keyframes pulse-ring { 0% { transform: scale(0.8); opacity: 0.8; } 100% { transform: scale(2); opacity: 0; } }
@keyframes heartbeat { 0%, 100% { transform: scale(1); } 14% { transform: scale(1.3); } 28% { transform: scale(1); } 42% { transform: scale(1.2); } 70% { transform: scale(1); } }

.fade-in  { animation: fadeIn  0.35s ease both; }
.fade-up  { animation: fadeUp  0.45s cubic-bezier(0.16, 1, 0.3, 1) both; }
.fade-down{ animation: fadeDown 0.35s ease both; }
.scale-in { animation: scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) both; }
.slide-right { animation: slideInRight 0.4s ease both; }

.delay-1 { animation-delay: 0.03s; }
.delay-2 { animation-delay: 0.08s; }
.delay-3 { animation-delay: 0.14s; }
.delay-4 { animation-delay: 0.20s; }
.delay-5 { animation-delay: 0.28s; }
.delay-6 { animation-delay: 0.36s; }

.fade-up, .fade-in, .scale-in { will-change: transform, opacity; }

.gradient-text {
  background: var(--gradient-accent);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  display: inline-block;
}

.glass {
  background: var(--bg-glass);
  backdrop-filter: var(--nav-blur);
  -webkit-backdrop-filter: var(--nav-blur);
  border: 1.5px solid var(--border);
}

.card-hover {
  transition: all 0.3s cubic-bezier(0.2, 0.9, 0.4, 1.1);
}
.card-hover:hover {
  transform: translateY(-5px);
  box-shadow: var(--card-hover);
}

/* ========== Desktop Default (min-width: 1025px) ========== */
@media (min-width: 1025px) {
  .hero-grid { grid-template-columns: 1fr 1fr !important; gap: clamp(32px, 6vw, 80px) !important; }
  .hero-illustration { display: flex !important; }
  .features-grid { grid-template-columns: repeat(3, 1fr) !important; gap: 24px !important; }
  .popular-exams-grid { grid-template-columns: repeat(3, 1fr) !important; gap: 22px !important; }
  .stats-grid { grid-template-columns: repeat(4, 1fr) !important; gap: 20px !important; }
  .exam-detail-grid { grid-template-columns: 1fr 380px !important; gap: 32px !important; }
  .vendors-grid, .topics-grid { grid-template-columns: repeat(auto-fill, minmax(110px, 1fr)) !important; gap: clamp(16px, 3vw, 45px) !important; }
  .cta-grid { grid-template-columns: 1fr auto !important; gap: 40px !important; }
  .free-banner { flex-direction: row !important; }
  .hero-actions { flex-direction: row !important; }
}

/* ========== Tablet & Mobile (max-width: 1024px) ========== */
@media (max-width: 1024px) {
  .hero-grid        { grid-template-columns: 1fr !important; }
  .hero-illustration{ display: none !important; }
  .exam-detail-grid { grid-template-columns: 1fr !important; }
  .features-grid    { grid-template-columns: repeat(2, 1fr) !important; }
  .popular-exams-grid { grid-template-columns: repeat(2, 1fr) !important; }
  .stats-grid       { grid-template-columns: repeat(3, 1fr) !important; }
  .exam-detail-right-col { position: static !important; }
}

/* ========== Mobile (max-width: 768px) ========== */
@media (max-width: 768px) {
  body { font-size: 14px; }
  :root { --navbar-height: 60px; --sticky-top-offset: calc(60px + 12px); }
  
  main {
    padding-bottom: max(16px, env(safe-area-inset-bottom, 16px));
    padding-left: env(safe-area-inset-left, 0px);
    padding-right: env(safe-area-inset-right, 0px);
  }
  
  .hero-grid-wrap { padding: 40px 16px 40px !important; }
  .hero-mobile-center { text-align: center !important; }
  .hero-actions { flex-direction: column !important; gap: 12px !important; }
  .hero-actions > button { width: 100% !important; justify-content: center !important; }
  
  .popular-exams-grid,
  .exams-grid,
  .favorites-grid,
  .my-exams-grid {
    grid-template-columns: 1fr !important;
  }
  
  .vendors-grid, .topics-grid {
    grid-template-columns: repeat(4, minmax(80px, 1fr)) !important;
    gap: 10px !important;
  }
  
  .stats-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 12px !important; }
  .features-grid { grid-template-columns: 1fr !important; gap: 16px !important; }
  
  .section-pad { padding: 40px 16px !important; }
  
  .exam-day-card { flex-direction: column !important; }
  .exam-day-card-inner { flex-direction: column !important; }
  .exam-day-thumb {
    width: 100% !important;
    height: 160px !important;
    border-right: none !important;
    border-bottom: 2px solid var(--border) !important;
  }
  .exam-day-body { padding: 20px 18px !important; flex-direction: column !important; align-items: flex-start !important; gap: 16px !important; }
  .exam-day-enroll { width: 100% !important; margin-left: 0 !important; }
  
  .cta-grid { grid-template-columns: 1fr !important; gap: 24px !important; }
  .cta-actions { flex-direction: row !important; flex-wrap: wrap !important; gap: 8px !important; }
  .cta-actions > button { flex: 1; justify-content: center !important; }
  
  .dashboard-tabs {
    overflow-x: auto !important;
    flex-wrap: nowrap !important;
    scrollbar-width: none;
  }
  .dashboard-tabs::-webkit-scrollbar { display: none; }
  
  .welcome-popup { right: 12px !important; left: 12px !important; max-width: calc(100vw - 24px) !important; top: 72px !important; }
  .free-banner { flex-direction: column !important; align-items: flex-start !important; gap: 16px !important; }
  .free-banner button { width: 100% !important; justify-content: center !important; }
  
  button { min-height: 44px !important; }
}

/* ========== Small Mobile (max-width: 480px) ========== */
@media (max-width: 480px) {
  body { font-size: 13px; }
  h1 { font-size: clamp(22px, 6.5vw, 32px) !important; line-height: 1.2 !important; letter-spacing: -1px !important; }
  h2 { font-size: clamp(18px, 5.5vw, 24px) !important; letter-spacing: -0.5px !important; }
  h3 { font-size: clamp(15px, 4.5vw, 18px) !important; }
  
  .hero-grid-wrap { padding: 32px 16px 32px !important; }
  .popular-exams-grid,
  .exams-grid,
  .favorites-grid,
  .my-exams-grid { gap: 14px !important; }
  .stats-grid { gap: 8px !important; }
  .vendors-grid, .topics-grid {
    grid-template-columns: repeat(3, minmax(70px, 1fr)) !important;
    gap: 8px !important;
  }
  .features-grid { gap: 12px !important; }
  
  .stat-card { padding: 14px 12px !important; }
  .cta-wrap { padding: 28px 20px !important; border-radius: 20px !important; }
  
  .search-bar { border-radius: 12px !important; }
  .search-btn { padding: 8px 14px !important; font-size: 12px !important; }
  
  .quiz-options { gap: 8px !important; }
  .quiz-option { padding: 12px 14px !important; font-size: 14px !important; border-radius: 12px !important; }
  .result-score { font-size: clamp(48px, 14vw, 72px) !important; }
  
  .admin-table th, .admin-table td { font-size: 10px !important; padding: 6px 4px !important; }
  .dashboard-tabs button { padding: 10px 14px !important; font-size: 12px !important; }
}

/* ========== Extra Small (max-width: 360px) ========== */
@media (max-width: 360px) {
  body { font-size: 12px; }
  h1 { font-size: clamp(19px, 6vw, 24px) !important; }
  .vendors-grid, .topics-grid { grid-template-columns: repeat(2, 1fr) !important; }
  .stats-grid { gap: 6px !important; }
  .stat-card { padding: 10px 8px !important; }
  .section-pad { padding: 28px 14px !important; }
}

/* Helper class for sticky columns (used in ExamDetail) */
.sticky-col {
  position: sticky;
  top: var(--sticky-top-offset);
  align-self: start;
}
`;

function LoadingScreen() {
  return (
    <div style={{
      position: "fixed", inset: 0,
      background: "var(--bg)",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      zIndex: 9999,
    }}>
      <style>{`
        @keyframes loadGlow { 
          0%,100%{box-shadow: 0 0 20px rgba(99,102,241,0.3), 0 0 40px rgba(168,85,247,0.2)} 
          50%{box-shadow: 0 0 40px rgba(99,102,241,0.6), 0 0 80px rgba(168,85,247,0.4)} 
        }
        @keyframes loadPulse { 
          0%,100%{transform:scale(1)} 
          50%{transform:scale(1.05)} 
        }
        @keyframes loadDot { 
          0%,100%{transform:scaleY(0.5);opacity:0.4} 
          50%{transform:scaleY(1);opacity:1} 
        }
      `}</style>
      
      <div style={{
        position:"absolute",top:"30%",left:"50%",transform:"translateX(-50%)",
        width:300,height:300,
        background:"radial-gradient(circle, rgba(99,102,241,0.12) 0%, rgba(168,85,247,0.06) 40%, transparent 70%)",
        pointerEvents:"none",
        animation:"loadPulse 3s ease-in-out infinite",
      }}/>
      
      <div style={{ position:"relative", marginBottom:28 }}>
        <div style={{
          borderRadius:24,
          display:"flex",alignItems:"center",justifyContent:"center",
          boxShadow:"0 20px 56px rgba(79,70,229,0.4)",
          animation:"loadGlow 3s ease-in-out infinite",
        }}>
          <img 
            src="https://i.ibb.co/DPztDcgx/Chat-GPT-Image-Apr-26-2026-09-45-41-PM.png"
            width={70} height={70}
            style={{objectFit:"contain"}}
            alt="FlexExams"
            loading="eager"
          />
        </div>
      </div>
      
      <div style={{
        fontFamily:"'Plus Jakarta Sans',sans-serif",
        fontSize:28,fontWeight:900,
        color:"var(--text)",marginBottom:5,
        letterSpacing:"-1px",
        background:"var(--gradient-accent)",
        WebkitBackgroundClip:"text",
        WebkitTextFillColor:"transparent",
      }}>
        FlexExams
      </div>
      <div style={{
        fontSize:11,color:"var(--text3)",
        letterSpacing:"0.25em",textTransform:"uppercase",
        marginBottom:36,fontWeight:700,
      }}>
        Certification Platform
      </div>
      
      <div style={{display:"flex",gap:5,alignItems:"center"}}>
        {[0,1,2,3].map(i=>(
          <div key={i} style={{
            width:5,height:14,
            borderRadius:99,
            background:`linear-gradient(180deg,var(--accent),var(--accent2))`,
            animation:`loadDot 1s ease-in-out ${i*0.12}s infinite`,
          }}/>
        ))}
      </div>
    </div>
  );
}

function AppInner() {
  const { isLoading } = useAuth();
  const [page, setPage] = useState("home");
  const [authMode, setAuthMode] = useState("login");
  const [activeFilter, setActiveFilter] = useState({ vendor: null, topic: null });
  const [activeExam, setActiveExam] = useState(null);
  const [quizData, setQuizData] = useState(null);
  const [resultData, setResultData] = useState(null);
  const [exams, setExams] = useState([]);
  const [examsLoaded, setExamsLoaded] = useState(false);
  const [toast, setToast] = useState(null);
  const [verifyCertId, setVerifyCertId] = useState(null);

  const showToast = useCallback(t => {
    setToast(t);
    setTimeout(() => setToast(null), 4000);
  }, []);

  const nav = (p, opts) => {
    if (p === "auth" && opts?.mode) setAuthMode(opts.mode);
    else if (p === "auth") setAuthMode("login");
    if (p === "exams") {
      setActiveFilter({
        vendor: opts?.vendorFilter || null,
        topic: opts?.topicFilter || null,
      });
    }
    setPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const startQuiz = data => {
    setQuizData(data);
    nav("quiz");
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    if (id) {
      setVerifyCertId(id);
      setPage("verify");
    }
  }, []);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (page === "quiz") {
        e.preventDefault();
        e.returnValue = "You have an active exam. Are you sure you want to leave?";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [page]);

  useEffect(() => {
    if (examsLoaded) return;
    getExams()
      .then(data => {
        setExams(data.filter(ex => ex.isActive !== false));
        setExamsLoaded(true);
      })
      .catch(err => {
        console.error("Failed to load exams:", err);
        setExamsLoaded(true);
      });
  }, [examsLoaded]);

  if (isLoading) return <LoadingScreen />;

  return (
    <>
      <NavBar page={page} setPage={nav} showToast={showToast} />
      <main key={page} className="fade-in" style={{ minHeight: "calc(100vh - 72px)", overflowX: "hidden" }}>
        {page === "home"        && <Home setPage={nav} setActiveExam={setActiveExam} exams={exams} />}
        {page === "exams"       && <Exams setPage={nav} setActiveExam={setActiveExam} exams={exams} vendorFilter={activeFilter.vendor} topicFilter={activeFilter.topic} showToast={showToast} />}
        {page === "topics"      && <Topics setPage={nav} setActiveExam={setActiveExam} exams={exams} />}
        {page === "categories"  && <Categories setPage={nav} setActiveExam={setActiveExam} exams={exams} />}
        {page === "about"       && <About />}
        {page === "contact"     && <Contact showToast={showToast} />}
        {page === "exam-detail" && activeExam && (
          <ExamDetail exam={activeExam} setPage={nav} startQuiz={startQuiz} showToast={showToast} />
        )}
        {page === "quiz" && quizData && (
          <Quiz quizData={quizData} setPage={nav} setResultData={setResultData} showToast={showToast} />
        )}
        {page === "result" && resultData && (
          <Result result={resultData} setPage={nav} startQuiz={startQuiz} exams={exams} showToast={showToast} />
        )}
        {page === "auth"        && <Auth setPage={nav} showToast={showToast} initialMode={authMode} />}
        {page === "dashboard"   && <Dashboard setPage={nav} setResultData={setResultData} setActiveExam={setActiveExam} exams={exams} showToast={showToast} />}
        {page === "my-exams"    && <MyExams setPage={nav} setResultData={setResultData} setActiveExam={setActiveExam} exams={exams} showToast={showToast} />}
        {page === "admin"       && <Admin showToast={showToast} setPage={nav} />}
        {page === "favorites"   && <Favorites setPage={nav} setActiveExam={setActiveExam} exams={exams} showToast={showToast} />}
        {page === "verify"      && <CertificateVerify certId={verifyCertId} setPage={nav} />}
        {page === "career-diagnostic" && <CareerDiagnostic setPage={nav} exams={exams} />}
      </main>
      <Footer setPage={nav} />
      <Toast toast={toast} />
    </>
  );
}

export default function App() {
  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (!saved) {
      localStorage.setItem("theme", "dark");
      document.documentElement.setAttribute("data-theme", "dark");
    } else {
      document.documentElement.setAttribute("data-theme", saved);
    }

    const setMeta = (name, content, prop = false) => {
      const sel = prop ? `meta[property="${name}"]` : `meta[name="${name}"]`;
      let el = document.querySelector(sel);
      if (!el) { el = document.createElement("meta"); prop ? el.setAttribute("property", name) : el.setAttribute("name", name); document.head.appendChild(el); }
      el.setAttribute("content", content);
    };

    document.title = "FlexExams — Practice Smarter, Pass with Confidence";
    setMeta("description", "Prepare for 50+ IT certifications with real exam-style questions, timed practice tests, and instant results. Trusted by 100,000+ professionals worldwide.");
    setMeta("robots", "index, follow");
    setMeta("author", "FlexExams");
    setMeta("viewport", "width=device-width, initial-scale=1.0, viewport-fit=cover");
    setMeta("og:title", "FlexExams — Practice Smarter, Pass with Confidence", true);
    setMeta("og:description", "Real exam-style questions for 50+ certifications. Join 100,000+ professionals.", true);
    setMeta("og:type", "website", true);
    setMeta("og:url", window.location.href, true);
    setMeta("og:image", "https://i.ibb.co/DPztDcgx/Chat-GPT-Image-Apr-26-2026-09-45-41-PM.png", true);
    setMeta("twitter:card", "summary_large_image");
    setMeta("twitter:title", "FlexExams — Practice Smarter, Pass with Confidence");

    let canonical = document.querySelector("link[rel='canonical']");
    if (!canonical) { canonical = document.createElement("link"); canonical.setAttribute("rel", "canonical"); document.head.appendChild(canonical); }
    canonical.setAttribute("href", window.location.origin);

    let themeColor = document.querySelector("meta[name='theme-color']");
    if (!themeColor) { themeColor = document.createElement("meta"); themeColor.setAttribute("name", "theme-color"); document.head.appendChild(themeColor); }
    themeColor.setAttribute("content", saved === "dark" ? "#0d1223" : "#ffffff");

    ["fonts.googleapis.com", "fonts.gstatic.com", "i.ibb.co"].forEach(domain => {
      if (!document.querySelector(`link[rel="dns-prefetch"][href="//${domain}"]`)) {
        const link = document.createElement("link");
        link.rel = "dns-prefetch";
        link.href = `//${domain}`;
        document.head.appendChild(link);
      }
    });
  }, []);

  return (
    <AuthProvider>
      <style>{GLOBAL_CSS}</style>
      <AppInner />
    </AuthProvider>
  );
}