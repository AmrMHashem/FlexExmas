// App.jsx — FlexExams v5.0 with React Router (Professional Routing)
// ✅ Full React Router DOM integration
// ✅ Deep linking & page refresh support
// ✅ Lazy loading + Suspense + useTransition
// ✅ Firebase + Auth + Toast + All features preserved

import React, { useState, useCallback, useEffect, Suspense, lazy, useTransition } from "react";
import { BrowserRouter, Routes, Route, useNavigate, useLocation, Navigate, useParams, useSearchParams } from "react-router-dom";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import NavBar from "./components/NavBar";
import Footer from "./components/Footer";
import { Toast, Spinner } from "./components/UI";

// ── Lazy pages ────────────────────────────────────────────────────
const Home             = lazy(() => import("./pages/Home"));
const Exams            = lazy(() => import("./pages/Exams"));
const Topics           = lazy(() => import("./pages/Topics"));
const Categories       = lazy(() => import("./pages/Categories"));
const About            = lazy(() => import("./pages/About"));
const Contact          = lazy(() => import("./pages/Contact"));
const ExamDetail       = lazy(() => import("./pages/ExamDetail"));
const Quiz             = lazy(() => import("./pages/Quiz"));
const Result           = lazy(() => import("./pages/Result"));
const Auth             = lazy(() => import("./pages/Auth"));
const Dashboard        = lazy(() => import("./pages/Dashboard"));
const MyExams          = lazy(() => import("./pages/MyExams"));
const Admin            = lazy(() => import("./pages/Admin"));
const Favorites        = lazy(() => import("./pages/Favorites"));
const CertificateVerify = lazy(() => import("./pages/Certificateverify"));
const CareerDiagnostic  = lazy(() => import("./pages/CareerDiagnostic"));

const PageFallback = () => (
  <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
    <Spinner size={32} color="var(--accent)" />
  </div>
);

// ── GLOBAL CSS (full version from your original code) ─────────────
const GLOBAL_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800;900&display=swap');

*,*::before,*::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --bg: linear-gradient(135deg, #ffffff 0%, #e8dcfc 100%);
  --bg2: linear-gradient(145deg, #ffffff 0%, #f7d1e5 100%);
  --bg3: #cee4f9; --bg4: #eef2ff;
  --border: #98bbe9; --border2: #94a3b8;
  --text: #0f172a; --text2: #081f42; --text3: #706070;
  --accent: #423eacbf; --accent2: #494575; --accent3: #c7d2fe;
  --green: #059669; --red: #dc2626; --gold: #d97706;
  --purple: #5e3b9b; --cyan: #0891b2;
  --gradient-accent: linear-gradient(135deg, #e5467b 0%, #7c3aed 100%);
  --gradient-hero: url('https://png.pngtree.com/background/20210711/original/pngtree-corporate-literary-minimalist-light-blue-training-background-poster-picture-image_1125432.jpg');
  --gradient-card: linear-gradient(135deg, #ffffff 0%, #fafbff 100%);
  --accent-soft: rgba(79,70,229,0.08); --accent-glow: rgba(79,70,229,0.15);
  --card-shadow: 0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.05);
  --card-hover: 0 8px 24px rgba(79,70,229,0.12), 0 4px 8px rgba(0,0,0,0.06);
  --nav-blur: blur(7px); --bg-glass: rgba(255,255,255,0.95);
  --surface: var(--bg2); --navbar-height: 68px;
  --sticky-top-offset: calc(var(--navbar-height) + 16px);
}

[data-theme="dark"] {
  --bg: #0d1223; --bg2: linear-gradient(145deg, #1a2b69 0%, #060810 100%);
  --bg3: #131828; --bg4: #1a2035;
  --border: #6878ae; --border2: #727eb0;
  --text: #eef1fb; --text2: #bfc7e0; --text3: #9bb6f0;
  --accent: #7177ae; --accent2: #6c6da7; --accent3: #a5b4fc;
  --green: #10b981; --red: #f87171; --gold: #fbbf24;
  --purple: #5f87de; --cyan: #22d3ee;
  --gradient-accent: linear-gradient(135deg, #6b68c2 0%, #740060 100%);
  --gradient-hero: linear-gradient(145deg, #060810 0%, #2a45a4 100%);
  --gradient-card: linear-gradient(135deg, #0c0f1a 0%, #131828 100%);
  --accent-soft: rgba(129,140,248,0.12); --accent-glow: rgba(129,140,248,0.2);
  --card-shadow: 0 2px 12px rgba(0,0,0,0.4), 0 1px 4px rgba(0,0,0,0.3);
  --card-hover: 0 14px 32px rgba(129,140,248,0.15), 0 4px 12px rgba(0,0,0,0.4);
  --bg-glass: rgba(6,8,16,0.92); --navbar-height: 68px;
}

html { scroll-behavior: smooth; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; overflow-x: hidden; }
body { background: var(--bg); color: var(--text); font-family: 'Plus Jakarta Sans',-apple-system,BlinkMacSystemFont,sans-serif; min-height: 100vh; transition: background 0.5s, color 0.4s; line-height: 1.6; overflow-x: hidden; }
h1,h2,h3,h4,h5,h6 { font-family: 'Plus Jakarta Sans',sans-serif; font-weight: 700; letter-spacing: -0.02em; line-height: 1.2; }
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: var(--bg2); }
::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 10px; }
::-webkit-scrollbar-thumb:hover { background: var(--accent); }

@keyframes fadeIn   { from{opacity:0} to{opacity:1} }
@keyframes fadeUp   { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
@keyframes fadeDown { from{opacity:0;transform:translateY(-16px)} to{opacity:1;transform:translateY(0)} }
@keyframes scaleIn  { from{opacity:0;transform:scale(0.95)} to{opacity:1;transform:scale(1)} }
@keyframes slideInRight { from{opacity:0;transform:translateX(24px)} to{opacity:1;transform:translateX(0)} }
@keyframes float    { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
@keyframes spin     { to{transform:rotate(360deg)} }
@keyframes shimmer  { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
@keyframes toastIn  { from{opacity:0;transform:translateX(40px)} to{opacity:1;transform:translateX(0)} }
@keyframes pulse-ring { 0%{transform:scale(0.8);opacity:0.8} 100%{transform:scale(2);opacity:0} }
@keyframes heartbeat { 0%,100%{transform:scale(1)} 14%{transform:scale(1.3)} 28%{transform:scale(1)} 42%{transform:scale(1.2)} }

.fade-in    { animation: fadeIn   0.35s ease both; }
.fade-up    { animation: fadeUp   0.45s cubic-bezier(0.16,1,0.3,1) both; }
.fade-down  { animation: fadeDown 0.35s ease both; }
.scale-in   { animation: scaleIn  0.3s  cubic-bezier(0.16,1,0.3,1) both; }
.slide-right{ animation: slideInRight 0.4s ease both; }

.delay-1{animation-delay:0.03s} .delay-2{animation-delay:0.08s} .delay-3{animation-delay:0.14s}
.delay-4{animation-delay:0.20s} .delay-5{animation-delay:0.28s} .delay-6{animation-delay:0.36s}
.fade-up,.fade-in,.scale-in { will-change: transform,opacity; }

.gradient-text { background: var(--gradient-accent); -webkit-background-clip: text; background-clip: text; color: transparent; display: inline-block; }
.glass { background: var(--bg-glass); backdrop-filter: var(--nav-blur); -webkit-backdrop-filter: var(--nav-blur); border: 1.5px solid var(--border); }
.card-hover { transition: all 0.3s cubic-bezier(0.2,0.9,0.4,1.1); }
.card-hover:hover { transform: translateY(-5px); box-shadow: var(--card-hover); }

@media (min-width:1025px) {
  .hero-grid { grid-template-columns:1fr 1fr !important; gap:clamp(32px,6vw,80px) !important; }
  .hero-illustration { display:flex !important; }
  .features-grid { grid-template-columns:repeat(3,1fr) !important; gap:24px !important; }
  .popular-exams-grid { grid-template-columns:repeat(3,1fr) !important; gap:22px !important; }
  .stats-grid { grid-template-columns:repeat(4,1fr) !important; gap:20px !important; }
  .exam-detail-grid { grid-template-columns:1fr 380px !important; gap:32px !important; }
  .vendors-grid,.topics-grid { grid-template-columns:repeat(auto-fill,minmax(110px,1fr)) !important; gap:clamp(16px,3vw,45px) !important; }
  .cta-grid { grid-template-columns:1fr auto !important; gap:40px !important; }
  .free-banner { flex-direction:row !important; }
  .hero-actions { flex-direction:row !important; }
}
@media (max-width:1024px) {
  .hero-grid { grid-template-columns:1fr !important; }
  .hero-illustration { display:none !important; }
  .exam-detail-grid { grid-template-columns:1fr !important; }
  .features-grid { grid-template-columns:repeat(2,1fr) !important; }
  .popular-exams-grid { grid-template-columns:repeat(2,1fr) !important; }
  .stats-grid { grid-template-columns:repeat(3,1fr) !important; }
  .exam-detail-right-col { position:static !important; }
}
@media (max-width:768px) {
  body { font-size:14px; }
  :root { --navbar-height:60px; --sticky-top-offset:calc(60px + 12px); }
  main { padding-bottom:max(16px,env(safe-area-inset-bottom,16px)); }
  .hero-grid-wrap { padding:40px 16px !important; }
  .hero-mobile-center { text-align:center !important; }
  .hero-actions { flex-direction:column !important; gap:12px !important; }
  .hero-actions>button { width:100% !important; justify-content:center !important; }
  .popular-exams-grid,.exams-grid,.favorites-grid,.my-exams-grid { grid-template-columns:1fr !important; }
  .vendors-grid,.topics-grid { grid-template-columns:repeat(4,minmax(80px,1fr)) !important; gap:10px !important; }
  .stats-grid { grid-template-columns:repeat(2,1fr) !important; gap:12px !important; }
  .features-grid { grid-template-columns:1fr !important; gap:16px !important; }
  .section-pad { padding:40px 16px !important; }
  .exam-day-card,.exam-day-card-inner { flex-direction:column !important; }
  .exam-day-thumb { width:100% !important; height:160px !important; border-right:none !important; border-bottom:2px solid var(--border) !important; }
  .exam-day-body { padding:20px 18px !important; flex-direction:column !important; align-items:flex-start !important; gap:16px !important; }
  .exam-day-enroll { width:100% !important; margin-left:0 !important; }
  .cta-grid { grid-template-columns:1fr !important; gap:24px !important; }
  .cta-actions { flex-direction:row !important; flex-wrap:wrap !important; gap:8px !important; }
  .cta-actions>button { flex:1; justify-content:center !important; }
  .dashboard-tabs { overflow-x:auto !important; flex-wrap:nowrap !important; scrollbar-width:none; }
  .dashboard-tabs::-webkit-scrollbar { display:none; }
  .welcome-popup { right:12px !important; left:12px !important; max-width:calc(100vw - 24px) !important; top:72px !important; }
  .free-banner { flex-direction:column !important; align-items:flex-start !important; gap:16px !important; }
  .free-banner button { width:100% !important; justify-content:center !important; }
  button { min-height:44px !important; }
}
@media (max-width:480px) {
  body { font-size:13px; }
  h1 { font-size:clamp(22px,6.5vw,32px) !important; line-height:1.2 !important; letter-spacing:-1px !important; }
  h2 { font-size:clamp(18px,5.5vw,24px) !important; }
  h3 { font-size:clamp(15px,4.5vw,18px) !important; }
  .hero-grid-wrap { padding:32px 16px !important; }
  .popular-exams-grid,.exams-grid,.favorites-grid,.my-exams-grid { gap:14px !important; }
  .stats-grid { gap:8px !important; }
  .vendors-grid,.topics-grid { grid-template-columns:repeat(3,minmax(70px,1fr)) !important; gap:8px !important; }
  .features-grid { gap:12px !important; }
  .stat-card { padding:14px 12px !important; }
  .cta-wrap { padding:28px 20px !important; border-radius:20px !important; }
  .quiz-options { gap:8px !important; }
  .quiz-option { padding:12px 14px !important; font-size:14px !important; border-radius:12px !important; }
  .result-score { font-size:clamp(48px,14vw,72px) !important; }
  .admin-table th,.admin-table td { font-size:10px !important; padding:6px 4px !important; }
  .dashboard-tabs button { padding:10px 14px !important; font-size:12px !important; }
}
@media (max-width:360px) {
  body { font-size:12px; }
  h1 { font-size:clamp(19px,6vw,24px) !important; }
  .vendors-grid,.topics-grid { grid-template-columns:repeat(2,1fr) !important; }
  .stats-grid { gap:6px !important; }
  .stat-card { padding:10px 8px !important; }
  .section-pad { padding:28px 14px !important; }
}
.sticky-col { position:sticky; top:var(--sticky-top-offset); align-self:start; }
`;

function LoadingScreen() {
  return (
    <div style={{ position:"fixed",inset:0,background:"var(--bg)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",zIndex:9999 }}>
      <style>{`@keyframes loadGlow{0%,100%{box-shadow:0 0 20px rgba(99,102,241,0.3)}50%{box-shadow:0 0 40px rgba(99,102,241,0.6)}} @keyframes loadDot{0%,100%{transform:scaleY(0.5);opacity:0.4}50%{transform:scaleY(1);opacity:1}}`}</style>
      <div style={{ marginBottom:28 }}>
        <img src="https://i.ibb.co/DPztDcgx/Chat-GPT-Image-Apr-26-2026-09-45-41-PM.png" width={70} height={70} style={{objectFit:"contain",animation:"loadGlow 3s ease-in-out infinite",borderRadius:24}} alt="FlexExams" loading="eager" fetchpriority="high" />
      </div>
      <div style={{ fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:28,fontWeight:900,marginBottom:5,letterSpacing:"-1px",background:"var(--gradient-accent)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent" }}>FlexExams</div>
      <div style={{ fontSize:11,color:"var(--text3)",letterSpacing:"0.25em",textTransform:"uppercase",marginBottom:36,fontWeight:700 }}>Certification Platform</div>
      <div style={{ display:"flex",gap:5,alignItems:"center" }}>
        {[0,1,2,3].map(i=><div key={i} style={{width:5,height:14,borderRadius:99,background:"linear-gradient(180deg,var(--accent),var(--accent2))",animation:`loadDot 1s ease-in-out ${i*0.12}s infinite`}}/>)}
      </div>
    </div>
  );
}

// ── Protected Route Wrapper ──────────────────────────────────────
function ProtectedRoute({ children }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return <LoadingScreen />;
  return user ? children : <Navigate to="/auth" replace />;
}

// ── Admin Route Wrapper ──────────────────────────────────────────
function AdminRoute({ children }) {
  const { user, isAdmin, isLoading } = useAuth();
  if (isLoading) return <LoadingScreen />;
  return user && isAdmin ? children : <Navigate to="/" replace />;
}

// ── Main App Router Component ────────────────────────────────────
function AppRouter() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoading } = useAuth();
  const [exams, setExams] = useState([]);
  const [examsLoaded, setExamsLoaded] = useState(false);
  const [toast, setToast] = useState(null);
  const [activeFilter, setActiveFilter] = useState({ vendor: null, topic: null });
  const [, startTransition] = useTransition();

  // Shared state for quiz & results (passed via navigation state)
  const [quizData, setQuizData] = useState(null);
  const [resultData, setResultData] = useState(null);
  const [activeExam, setActiveExam] = useState(null);

  const showToast = useCallback(t => {
    setToast(t);
    setTimeout(() => setToast(null), 4000);
  }, []);

  // Navigation helper with transition (non-blocking)
  const nav = useCallback((path, options = {}) => {
    startTransition(() => {
      navigate(path, options);
    });
    requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "smooth" }));
  }, [navigate, startTransition]);

  // Load exams after auth (unchanged)
  useEffect(() => {
    if (examsLoaded || isLoading) return;
    let cancelled = false;
    const load = async () => {
      try {
        const { getExams } = await import("./services/firestore");
        const data = await getExams();
        if (!cancelled) { setExams(data.filter(ex => ex.isActive !== false)); setExamsLoaded(true); }
      } catch { if (!cancelled) setExamsLoaded(true); }
    };
    const t = setTimeout(load, 200);
    return () => { cancelled = true; clearTimeout(t); };
  }, [examsLoaded, isLoading]);

  // Restore filter from URL query params (for /exams)
  useEffect(() => {
    if (location.pathname === "/exams") {
      const params = new URLSearchParams(location.search);
      const vendor = params.get("vendor");
      const topic = params.get("topic");
      setActiveFilter({ vendor, topic });
    }
  }, [location]);

  // Beforeunload protection for quiz
  useEffect(() => {
    if (location.pathname !== "/quiz") return;
    const h = e => { e.preventDefault(); e.returnValue = "You have an active exam. Are you sure?"; };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [location.pathname]);

  if (isLoading) return <LoadingScreen />;

  return (
    <>
      <NavBar setPage={nav} showToast={showToast} />
      <main className="fade-in" style={{ minHeight: "calc(100vh - 72px)", overflowX: "hidden" }}>
        <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route path="/" element={<Home setPage={nav} setActiveExam={setActiveExam} exams={exams} />} />
            <Route path="/exams" element={
              <Exams setPage={nav} setActiveExam={setActiveExam} exams={exams}
                vendorFilter={activeFilter.vendor} topicFilter={activeFilter.topic}
                showToast={showToast} />
            } />
            <Route path="/topics" element={<Topics setPage={nav} setActiveExam={setActiveExam} exams={exams} />} />
            <Route path="/categories" element={<Categories setPage={nav} setActiveExam={setActiveExam} exams={exams} />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact showToast={showToast} />} />
            <Route path="/exam-detail/:examId" element={
              <ExamDetailWrapper exams={exams} setPage={nav} setActiveExam={setActiveExam} startQuiz={(data) => { setQuizData(data); nav("/quiz", { state: { quizData: data } }); }} showToast={showToast} />
            } />
            <Route path="/quiz" element={
              <QuizWrapper quizData={quizData} setQuizData={setQuizData} setPage={nav} setResultData={(data) => { setResultData(data); nav("/result", { state: { resultData: data } }); }} showToast={showToast} />
            } />
            <Route path="/result" element={
              <ResultWrapper resultData={resultData} setResultData={setResultData} setPage={nav} startQuiz={(data) => { setQuizData(data); nav("/quiz", { state: { quizData: data } }); }} exams={exams} showToast={showToast} />
            } />
            <Route path="/auth" element={<Auth setPage={nav} showToast={showToast} initialMode="login" />} />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard setPage={nav} setResultData={(data) => { setResultData(data); nav("/result", { state: { resultData: data } }); }} setActiveExam={setActiveExam} exams={exams} showToast={showToast} />
              </ProtectedRoute>
            } />
            <Route path="/my-exams" element={
              <ProtectedRoute>
                <MyExams setPage={nav} setResultData={(data) => { setResultData(data); nav("/result", { state: { resultData: data } }); }} setActiveExam={setActiveExam} exams={exams} showToast={showToast} />
              </ProtectedRoute>
            } />
            <Route path="/admin" element={
              <AdminRoute>
                <Admin showToast={showToast} setPage={nav} />
              </AdminRoute>
            } />
            <Route path="/favorites" element={
              <ProtectedRoute>
                <Favorites setPage={nav} setActiveExam={setActiveExam} exams={exams} showToast={showToast} />
              </ProtectedRoute>
            } />
            <Route path="/verify" element={<CertificateVerifyWrapper setPage={nav} />} />
            <Route path="/career-diagnostic" element={<CareerDiagnostic setPage={nav} exams={exams} />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </main>
      <Footer setPage={nav} />
      <Toast toast={toast} />
    </>
  );
}

// ── Wrappers to extract navigation state from location ───────────
function ExamDetailWrapper({ exams, setPage, setActiveExam, startQuiz, showToast }) {
  const { examId } = useParams();
  const exam = exams.find(e => e.id === examId);
  useEffect(() => {
    if (exam) setActiveExam(exam);
  }, [exam, setActiveExam]);
  if (!exam) return <div>Exam not found</div>;
  return <ExamDetail exam={exam} setPage={setPage} startQuiz={startQuiz} showToast={showToast} />;
}

function QuizWrapper({ quizData, setQuizData, setPage, setResultData, showToast }) {
  const location = useLocation();
  const data = location.state?.quizData || quizData;
  useEffect(() => {
    if (!data && !quizData) {
      setPage("/");
    }
  }, [data, quizData, setPage]);
  if (!data && !quizData) return null;
  return <Quiz quizData={data} setPage={setPage} setResultData={setResultData} showToast={showToast} />;
}

function ResultWrapper({ resultData, setResultData, setPage, startQuiz, exams, showToast }) {
  const location = useLocation();
  const data = location.state?.resultData || resultData;
  useEffect(() => {
    if (!data && !resultData) {
      setPage("/");
    }
  }, [data, resultData, setPage]);
  if (!data && !resultData) return null;
  return <Result result={data} setPage={setPage} startQuiz={startQuiz} exams={exams} showToast={showToast} />;
}

function CertificateVerifyWrapper({ setPage }) {
  const [searchParams] = useSearchParams();
  const certId = searchParams.get("id");
  return <CertificateVerify certId={certId} setPage={setPage} />;
}

// ── Root App with Router Provider ─────────────────────────────────
export default function App() {
  useEffect(() => {
    const saved = localStorage.getItem("theme") || "dark";
    if (!localStorage.getItem("theme")) localStorage.setItem("theme", saved);
    document.documentElement.setAttribute("data-theme", saved);

    const setMeta = (name, content, prop = false) => {
      const sel = prop ? `meta[property="${name}"]` : `meta[name="${name}"]`;
      let el = document.querySelector(sel);
      if (!el) { el = document.createElement("meta"); prop ? el.setAttribute("property", name) : el.setAttribute("name", name); document.head.appendChild(el); }
      el.setAttribute("content", content);
    };
    document.title = "FlexExams — Practice Smarter, Pass with Confidence";
    setMeta("description","Prepare for 50+ IT certifications with real exam-style questions, timed practice tests, and instant results. Trusted by 100,000+ professionals worldwide.");
    setMeta("robots","index, follow");
    setMeta("og:title","FlexExams — Practice Smarter, Pass with Confidence",true);
    setMeta("og:description","Real exam-style questions for 50+ certifications.",true);
    setMeta("og:type","website",true);
    setMeta("og:image","https://i.ibb.co/DPztDcgx/Chat-GPT-Image-Apr-26-2026-09-45-41-PM.png",true);
    setMeta("twitter:card","summary_large_image");

    let canonical = document.querySelector("link[rel='canonical']");
    if (!canonical) { canonical = document.createElement("link"); canonical.rel = "canonical"; document.head.appendChild(canonical); }
    canonical.href = window.location.origin;

    let tc = document.querySelector("meta[name='theme-color']");
    if (!tc) { tc = document.createElement("meta"); tc.name = "theme-color"; document.head.appendChild(tc); }
    tc.content = saved === "dark" ? "#0d1223" : "#ffffff";

    // Resource hints
    [
      { rel:"preconnect", href:"https://fonts.googleapis.com" },
      { rel:"preconnect", href:"https://fonts.gstatic.com", crossOrigin:"anonymous" },
      { rel:"dns-prefetch", href:"//i.ibb.co" },
      { rel:"dns-prefetch", href:"//firestore.googleapis.com" },
      { rel:"dns-prefetch", href:"//firebase.googleapis.com" },
    ].forEach(({ rel, href, crossOrigin }) => {
      if (document.querySelector(`link[rel="${rel}"][href="${href}"]`)) return;
      const l = document.createElement("link"); l.rel = rel; l.href = href;
      if (crossOrigin) l.crossOrigin = crossOrigin;
      document.head.appendChild(l);
    });

    // Preload logo (LCP)
    if (!document.querySelector("link[rel='preload'][as='image']")) {
      const pl = document.createElement("link"); pl.rel = "preload"; pl.as = "image";
      pl.href = "https://i.ibb.co/DPztDcgx/Chat-GPT-Image-Apr-26-2026-09-45-41-PM.png";
      document.head.appendChild(pl);
    }
  }, []);

  return (
    <BrowserRouter>
      <AuthProvider>
        <style>{GLOBAL_CSS}</style>
        <AppRouter />
      </AuthProvider>
    </BrowserRouter>
  );
}
