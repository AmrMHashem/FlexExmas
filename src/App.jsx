// App.jsx — FlexExams v5.1 — Fixed routing & slug consistency
// ✅ History API routing — clean URLs
// ✅ Fixed infinite refresh loop (removed key={page}, unified slug generation)
// ✅ Added guards to prevent duplicate navigation

import React, {
  useState,
  useCallback,
  useEffect,
  Suspense,
  lazy,
  useTransition,
} from "react";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import { isFirestoreQuotaExceeded } from "./firebase";
import NavBar from "./components/NavBar";
import Footer from "./components/Footer";
import { Toast, Spinner } from "./components/UI";
import { generateSlug } from "./services/firestore"; // ✅ استيراد الدالة الموحدة

// ── Lazy pages ────────────────────────────────────────────────────
const Home              = lazy(() => import("./pages/Home"));
const Exams             = lazy(() => import("./pages/Exams"));
const Topics            = lazy(() => import("./pages/Topics"));
const Categories        = lazy(() => import("./pages/Categories"));
const About             = lazy(() => import("./pages/About"));
const Contact           = lazy(() => import("./pages/Contact"));
const ExamDetail        = lazy(() => import("./pages/ExamDetail"));
const Quiz              = lazy(() => import("./pages/Quiz"));
const Result            = lazy(() => import("./pages/Result"));
const Auth              = lazy(() => import("./pages/Auth"));
const Dashboard         = lazy(() => import("./pages/Dashboard"));
const MyExams           = lazy(() => import("./pages/MyExams"));
const Admin             = lazy(() => import("./pages/Admin"));
const Favorites         = lazy(() => import("./pages/Favorites"));
const CertificateVerify = lazy(() => import("./pages/Certificateverify"));
const CareerDiagnostic  = lazy(() => import("./pages/CareerDiagnostic"));
const Pricing           = lazy(() => import("./pages/Pricing"));
const Leaderboard       = lazy(() => import("./pages/Leaderboard"));
const Checkout          = lazy(() => import("./pages/Checkout"));
const Terms             = lazy(() => import("./pages/Terms"));

// ── Page fallback spinner ─────────────────────────────────────────
const PageFallback = () => (
  <div
    style={{
      minHeight: "60vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    <Spinner size={32} color="var(--accent)" />
  </div>
);

// ─────────────────────────────────────────────────────────────────
// slugify — تم إزالته واستبداله بـ generateSlug المستورد
// ─────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────
// ROUTE MAP — pathname → page key
// ─────────────────────────────────────────────────────────────────
const ROUTE_MAP = {
  "/":                   "home",
  "/exams":              "exams",
  "/topics":             "topics",
  "/categories":         "categories",
  "/about":              "about",
  "/contact":            "contact",
  "/quiz":               "quiz",
  "/result":             "result",
  "/auth":               "auth",
  "/dashboard":          "dashboard",
  "/my-exams":           "my-exams",
  "/admin":              "admin",
  "/favorites":          "favorites",
  "/verify":             "verify",
  "/career-diagnostic":  "career-diagnostic",
  "/pricing":            "pricing",
  "/leaderboard":        "leaderboard",
  "/referral":           "referral",
  "/checkout":           "checkout",
  "/terms":              "terms",
};

// ─────────────────────────────────────────────────────────────────
// getStateFromPath — يقرأ الـ pathname ويحدد الصفحة والـ slug
// ─────────────────────────────────────────────────────────────────
const getStateFromPath = (pathname = window.location.pathname) => {
  const clean = pathname.replace(/\/$/, "") || "/";

  if (clean.startsWith("/exam/")) {
    const slug = clean.replace("/exam/", "").trim();
    return { page: "exam-detail", slug };
  }

  const page = ROUTE_MAP[clean] || "home";
  return { page, slug: null };
};

// ─────────────────────────────────────────────────────────────────
// PAGE META — title + description + canonical per page (بدون تغيير)
// ─────────────────────────────────────────────────────────────────
const PAGE_META = {
  home: {
    title: "FlexExams — Practice Smarter, Pass with Confidence",
    description: "Prepare for 50+ IT certifications with real exam-style questions, timed practice tests, and instant results. Trusted by 100,000+ professionals worldwide.",
    path: "/",
  },
  exams: {
    title: "All Certification Exams — FlexExams",
    description: "Browse 50+ IT certification practice exams. AWS, Azure, CCNA, Security+, PMP and more. Start your free practice test today.",
    path: "/exams",
  },
  topics: {
    title: "Browse by Topic — FlexExams",
    description: "Explore IT certification exams by topic. Cloud, Security, Networking, DevOps, Project Management and more.",
    path: "/topics",
  },
  categories: {
    title: "Exam Categories — FlexExams",
    description: "Find certification practice tests by category. Filter by vendor, difficulty, or specialty area.",
    path: "/categories",
  },
  about: {
    title: "About FlexExams — Our Mission",
    description: "FlexExams is built by IT professionals for IT professionals. Learn about our mission to make certification prep accessible worldwide.",
    path: "/about",
  },
  contact: {
    title: "Contact FlexExams — Get in Touch",
    description: "Have a question or feedback? Contact the FlexExams team. We're here to help you succeed.",
    path: "/contact",
  },
  quiz: {
    title: "Active Exam — FlexExams",
    description: "You're in an active practice exam on FlexExams. Good luck!",
    path: "/quiz",
  },
  result: {
    title: "Exam Result — FlexExams",
    description: "View your exam result and detailed answer explanations on FlexExams.",
    path: "/result",
  },
  auth: {
    title: "Sign In — FlexExams",
    description: "Sign in or create a free FlexExams account to track your progress and unlock all features.",
    path: "/auth",
  },
  dashboard: {
    title: "My Dashboard — FlexExams",
    description: "Track your certification exam progress, scores, and analytics on FlexExams.",
    path: "/dashboard",
  },
  "my-exams": {
    title: "My Exams — FlexExams",
    description: "View all your enrolled and completed certification practice exams on FlexExams.",
    path: "/my-exams",
  },
  admin: {
    title: "Admin Panel — FlexExams",
    description: "FlexExams administration panel.",
    path: "/admin",
  },
  favorites: {
    title: "My Favorites — FlexExams",
    description: "Your saved favorite certification practice exams on FlexExams.",
    path: "/favorites",
  },
  verify: {
    title: "Verify Certificate — FlexExams",
    description: "Verify the authenticity of a FlexExams digital certificate using the certificate ID.",
    path: "/verify",
  },
  "career-diagnostic": {
    title: "Career Diagnostic — FlexExams",
    description: "Discover the best IT certification path for your career goals with our free Career Diagnostic tool.",
    path: "/career-diagnostic",
  },
  leaderboard: { title: "Leaderboard — FlexExams", path: "/leaderboard" },
  referral:    { title: "Referral Program — FlexExams", path: "/referral" },
  pricing: {
    title: "Pricing — FlexExams",
    description: "Affordable certification prep plans. Start free, upgrade anytime for full access to all exams.",
    path: "/pricing",
  },
  checkout: {
    title: "Checkout — FlexExams",
    description: "Complete your FlexExams purchase securely via PayPal.",
    path: "/checkout",
  },
  terms: {
    title: "Terms of Service & Privacy Policy — FlexExams",
    description: "Read FlexExams terms of service, privacy policy, and cookie policy. Learn how we protect your data and what rights you have.",
    path: "/terms",
  },
};

// ── SEO helpers (نفس السابق) ─────────────────────────────────────
function setMeta(nameOrProp, content, isProp = false) {
  const sel = isProp
    ? `meta[property="${nameOrProp}"]`
    : `meta[name="${nameOrProp}"]`;
  let el = document.querySelector(sel);
  if (!el) {
    el = document.createElement("meta");
    isProp
      ? el.setAttribute("property", nameOrProp)
      : el.setAttribute("name", nameOrProp);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setCanonical(path) {
  const href = `https://www.flexexams.com${path}`;
  let el = document.querySelector("link[rel='canonical']");
  if (!el) {
    el = document.createElement("link");
    el.rel = "canonical";
    document.head.appendChild(el);
  }
  el.href = href;
  setMeta("og:url", href, true);
}

function injectJsonLd(id, data) {
  let el = document.getElementById(id);
  if (!el) {
    el = document.createElement("script");
    el.id = id;
    el.type = "application/ld+json";
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
}

function updatePageSEO(page, activeExam) {
  const OG_IMAGE = "https://www.flexexams.com/og-image.png";

  if (page === "exam-detail" && activeExam) {
    const examTitle = activeExam.title || activeExam.name || "Practice Exam";
    const examSlug  = generateSlug(examTitle); // ✅ استخدم الدالة الموحدة
    const path      = `/exam/${examSlug}`;
    const title     = `${examTitle} — Practice Exam | FlexExams`;
    const desc      = `Practice for ${examTitle} with real exam-style questions on FlexExams. Timed tests, instant feedback, and detailed explanations.`;

    document.title = title;
    setMeta("description", desc);
    setCanonical(path);
    setMeta("og:title",       title,    true);
    setMeta("og:description", desc,     true);
    setMeta("og:image",       OG_IMAGE, true);
    setMeta("twitter:title",  title);
    setMeta("twitter:description", desc);

    injectJsonLd("ld-breadcrumb", {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home",  "item": "https://www.flexexams.com/" },
        { "@type": "ListItem", "position": 2, "name": "Exams", "item": "https://www.flexexams.com/exams" },
        { "@type": "ListItem", "position": 3, "name": examTitle, "item": `https://www.flexexams.com${path}` },
      ],
    });
    return;
  }

  const meta  = PAGE_META[page] || PAGE_META.home;
  document.title = meta.title;
  setMeta("description",    meta.description);
  setCanonical(meta.path);
  setMeta("og:title",       meta.title,       true);
  setMeta("og:description", meta.description, true);
  setMeta("og:image",       OG_IMAGE,         true);
  setMeta("twitter:title",  meta.title);
  setMeta("twitter:description", meta.description);

  if (page === "home") {
    injectJsonLd("ld-breadcrumb", {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "FlexExams",
      "url": "https://www.flexexams.com",
      "potentialAction": {
        "@type": "SearchAction",
        "target": { "@type": "EntryPoint", "urlTemplate": "https://www.flexexams.com/exams?q={search_term_string}" },
        "query-input": "required name=search_term_string"
      }
    });
  } else {
    injectJsonLd("ld-breadcrumb", {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.flexexams.com/" },
        { "@type": "ListItem", "position": 2, "name": meta.title.split(" —")[0], "item": `https://www.flexexams.com${meta.path}` },
      ],
    });
  }
}

function usePageSEO(page, activeExam) {
  useEffect(() => {
    updatePageSEO(page, activeExam);
  }, [page, activeExam]);
}

function pushPath(path) {
  if (window.location.pathname !== path) {
    window.history.pushState(null, "", path);
  }
}

// GLOBAL CSS (نفس السابق، مختصر للاختصار لكنه موجود في الملف الأصلي)
const GLOBAL_CSS = `...`; // احتفظ بما لديك، لم يتغير

function QuotaBanner() { /* كما هو */ }
function LoadingScreen() { /* كما هو */ }

// ─────────────────────────────────────────────────────────────────
// AppInner — النواة الرئيسية (مع التعديلات)
// ─────────────────────────────────────────────────────────────────
function AppInner() {
  const { isLoading } = useAuth();
  const initialState = getStateFromPath();
  const [page, setPage]               = useState(initialState.page);
  const [pendingSlug, setPendingSlug]  = useState(initialState.slug);
  const [authMode, setAuthMode]        = useState("login");
  const [activeFilter, setActiveFilter] = useState({ vendor: null, topic: null });
  const [activeExam, setActiveExam]    = useState(null);
  const [quizData, setQuizData]        = useState(null);
  const [resultData, setResultData]    = useState(null);
  const [exams, setExams]              = useState([]);
  const [examsLoaded, setExamsLoaded]  = useState(false);
  const [toast, setToast]              = useState(null);
  const [verifyCertId, setVerifyCertId] = useState(null);
  const [checkoutData, setCheckoutData] = useState(null);
  const [, startTransition]            = useTransition();

  const showToast = useCallback((t) => {
    setToast(t);
    setTimeout(() => setToast(null), 4000);
  }, []);

  const runWeeklyCountersUpdate = useCallback(async () => {
    try {
      const { runWeeklyCountersUpdate: update } = await import("./services/firestore");
      await update();
      console.log('[Info] Weekly counters updated successfully.');
    } catch (err) {
      console.warn('Weekly counters update failed:', err);
    }
  }, []);

  // ── nav — دالة التنقل المركزية (مع تعديل منع التكرار) ─────────
  const nav = useCallback(
    (p, opts) => {
      startTransition(() => {
        if (p === "auth") {
          setAuthMode(opts?.mode || "login");
          try {
            const returnState = {
              page, examId: activeExam?.id || null,
              examSlug: activeExam ? generateSlug(activeExam.title || activeExam.name || String(activeExam.id)) : null,
              checkoutData: checkoutData || null, couponCode: opts?.couponCode || null, scrollY: window.scrollY,
            };
            sessionStorage.setItem("flexexams_return_to", JSON.stringify(returnState));
          } catch (_) {}
          pushPath("/auth");
          setPage("auth");
          return;
        }

        if (p === "exams") {
          setActiveFilter({ vendor: opts?.vendorFilter || null, topic: opts?.topicFilter || null });
          pushPath("/exams");
          setPage("exams");
          return;
        }

        if (p === "exam-detail") {
          const exam = opts?.exam || opts;
          if (exam && (exam.title || exam.name || exam.id)) {
            const slug = generateSlug(exam.title || exam.name || String(exam.id));
            const newPath = `/exam/${slug}`;
            // ✅ منع إعادة التوجيه إذا كنا بالفعل على نفس الصفحة
            if (window.location.pathname === newPath && page === "exam-detail") {
              console.log("[Nav] Already on exam detail, skipping push");
              setActiveExam(exam);
              setPage("exam-detail");
              return;
            }
            setActiveExam(exam);
            pushPath(newPath);
            setPage("exam-detail");
            requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "smooth" }));
            return;
          }
        }

        if (p === "checkout") {
          setCheckoutData(opts || null);
          pushPath("/checkout");
          setPage("checkout");
          requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "smooth" }));
          return;
        }

        const meta = PAGE_META[p];
        const path = meta ? meta.path : `/${p}`;
        pushPath(path);
        setPage(p);
      });
      requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "smooth" }));
    },
    [startTransition, page, activeExam, checkoutData]
  );

  // ── handleReturnAfterAuth (تم التحديث لاستخدام generateSlug) ──
  const handleReturnAfterAuth = useCallback(() => {
    try {
      const raw = sessionStorage.getItem("flexexams_return_to");
      if (!raw) { nav("home"); return; }
      sessionStorage.removeItem("flexexams_return_to");
      const state = JSON.parse(raw);

      if (state.page === "exam-detail" && state.examSlug && exams.length > 0) {
        const found = exams.find(
          (ex) => generateSlug(ex.title || ex.name || String(ex.id)) === state.examSlug
        );
        if (found) {
          setActiveExam(found);
          pushPath(`/exam/${state.examSlug}`);
          startTransition(() => setPage("exam-detail"));
          if (state.scrollY) setTimeout(() => window.scrollTo({ top: state.scrollY, behavior: "smooth" }), 300);
          return;
        }
      }

      if (state.page === "checkout" && state.checkoutData) {
        setCheckoutData(state.checkoutData);
        pushPath("/checkout");
        startTransition(() => setPage("checkout"));
        return;
      }

      const validPages = ["exams", "dashboard", "pricing", "my-exams", "favorites"];
      if (validPages.includes(state.page)) nav(state.page);
      else nav("home");
    } catch (_) { nav("home"); }
  }, [exams, startTransition, nav]);

  const startQuiz = useCallback((data) => {
    setQuizData(data);
    nav("quiz");
  }, [nav]);

  // ── مستمع لـ Back / Forward (مع إضافة showToast) ──────────────
  useEffect(() => {
    const handlePopState = () => {
      const { page: newPage, slug } = getStateFromPath();

      startTransition(() => {
        if (newPage === "exam-detail" && slug) {
          if (exams.length > 0) {
            const found = exams.find(
              (ex) => generateSlug(ex.title || ex.name || String(ex.id)) === slug
            );
            if (found) {
              setActiveExam(found);
              if (page !== "exam-detail") setPage("exam-detail");
            } else {
              console.warn(`[Router] Exam not found for slug: ${slug}`);
              window.history.replaceState(null, "", "/exams");
              setPage("exams");
              showToast({ type: "warning", message: `Exam not found. Showing all exams.` });
            }
          } else {
            setPendingSlug(slug);
            if (page !== "exam-detail") setPage("exam-detail");
          }
          return;
        }
        if (page !== newPage) setPage(newPage);
      });
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [exams, startTransition, page, showToast]);

  // باقي الـ effects كما هي دون تغيير (verify, beforeunload, تحميل exams, refreshExams, quota)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    if (id) { setVerifyCertId(id); setPage("verify"); }
  }, []);

  useEffect(() => {
    if (page !== "quiz") return;
    const h = (e) => { e.preventDefault(); e.returnValue = "You have an active exam. Are you sure?"; };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [page]);

  useEffect(() => {
    if (examsLoaded || isLoading) return;
    let cancelled = false;
    const load = async () => {
      try {
        const { getExams } = await import("./services/firestore");
        const data = await getExams();
        if (!cancelled) {
          const active = data.filter((ex) => ex.isActive !== false);
          setExams(active);
          setExamsLoaded(true);
          if (pendingSlug) {
            const found = active.find(
              (ex) => generateSlug(ex.title || ex.name || String(ex.id)) === pendingSlug
            );
            if (found) {
              setActiveExam(found);
              setPage("exam-detail");
            } else {
              window.history.replaceState(null, "", "/exams");
              setPage("exams");
              showToast({ type: "error", message: "Exam not found." });
            }
            setPendingSlug(null);
          }
        }
      } catch (err) {
        console.error("Failed to load exams:", err);
        if (!cancelled) { setExamsLoaded(true); setPendingSlug(null); }
      }
    };
    const t = setTimeout(load, 200);
    return () => { cancelled = true; clearTimeout(t); };
  }, [examsLoaded, isLoading, pendingSlug, showToast]);

  const refreshExams = useCallback(async () => {
    try {
      const { getExams } = await import("./services/firestore");
      const data = await getExams();
      const active = data.filter((ex) => ex.isActive !== false);
      setExams(active);
      if (activeExam) {
        const updated = active.find((ex) => ex.id === activeExam.id);
        if (updated) setActiveExam(updated);
      }
    } catch (err) { console.warn("refreshExams failed:", err); }
  }, [activeExam]);

  const [quotaExceeded, setQuotaExceeded] = React.useState(() => isFirestoreQuotaExceeded());
  React.useEffect(() => {
    const handler = () => setQuotaExceeded(true);
    window.addEventListener("firestore:quota-exceeded", handler);
    return () => window.removeEventListener("firestore:quota-exceeded", handler);
  }, []);

  if (quotaExceeded) return <QuotaBanner />;
  if (isLoading) return <LoadingScreen />;

  return (
    <>
      <NavBar page={page} setPage={nav} showToast={showToast} extraLinks={[{page:"leaderboard",label:"🏆 Leaderboard"},{page:"referral",label:"🎁 Referral"}]} />
      {/* ✅ إزالة key={page} لمنع إعادة التركيب عند نفس الصفحة */}
      <main className="fade-in" style={{ minHeight: "calc(100vh - 72px)", overflowX: "hidden" }}>
        <Suspense fallback={<PageFallback />}>
          {page === "home" && <Home setPage={nav} setActiveExam={setActiveExam} exams={exams} />}
          {page === "exams" && <Exams setPage={nav} setActiveExam={setActiveExam} exams={exams} vendorFilter={activeFilter.vendor} topicFilter={activeFilter.topic} showToast={showToast} />}
          {page === "topics" && <Topics setPage={nav} setActiveExam={setActiveExam} exams={exams} />}
          {page === "categories" && <Categories setPage={nav} setActiveExam={setActiveExam} exams={exams} />}
          {page === "about" && <About />}
          {page === "contact" && <Contact showToast={showToast} />}
          {page === "terms" && <Terms />}
          {page === "exam-detail" && activeExam && <ExamDetail exam={activeExam} setPage={nav} startQuiz={startQuiz} showToast={showToast} />}
          {page === "exam-detail" && !activeExam && <PageFallback />}
          {page === "quiz" && quizData && <Quiz quizData={quizData} setPage={nav} setResultData={setResultData} showToast={showToast} />}
          {page === "result" && resultData && <Result result={resultData} setPage={nav} startQuiz={startQuiz} exams={exams} showToast={showToast} />}
          {page === "auth" && <Auth setPage={nav} showToast={showToast} initialMode={authMode} onAuthSuccess={handleReturnAfterAuth} />}
          {page === "dashboard" && <Dashboard setPage={nav} setResultData={setResultData} setActiveExam={setActiveExam} exams={exams} showToast={showToast} />}
          {page === "my-exams" && <MyExams setPage={nav} setResultData={setResultData} setActiveExam={setActiveExam} exams={exams} showToast={showToast} />}
          {page === "admin" && <Admin showToast={showToast} setPage={nav} onQuestionsChange={refreshExams} />}
          {page === "favorites" && <Favorites setPage={nav} setActiveExam={setActiveExam} exams={exams} showToast={showToast} />}
          {page === "verify" && <CertificateVerify certId={verifyCertId} setPage={nav} />}
          {page === "career-diagnostic" && <CareerDiagnostic setPage={nav} exams={exams} />}
          {page === "pricing" && <Pricing setPage={nav} showToast={showToast} />}
          {page === "leaderboard" && <Suspense fallback={<div style={{padding:48,textAlign:"center"}}><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5" style={{animation:"spin .8s linear infinite"}}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg></div>}><Leaderboard setPage={nav} showToast={showToast} /></Suspense>}
          {page === "referral" && <Suspense fallback={null}>{React.createElement(lazy(() => import("./components/ReferralSystem")), { showToast })}</Suspense>}
          {page === "checkout" && <Checkout setPage={nav} showToast={showToast} checkoutData={checkoutData} />}
        </Suspense>
      </main>
      <Footer setPage={nav} />
      <Toast toast={toast} />
    </>
  );
}

// ─────────────────────────────────────────────────────────────────
// App — Root
// ─────────────────────────────────────────────────────────────────
export default function App() {
  useEffect(() => {
    const saved = localStorage.getItem("theme") || "dark";
    if (!localStorage.getItem("theme")) localStorage.setItem("theme", saved);
    document.documentElement.setAttribute("data-theme", saved);

    let tc = document.querySelector("meta[name='theme-color']");
    if (!tc) { tc = document.createElement("meta"); tc.name = "theme-color"; document.head.appendChild(tc); }
    tc.content = saved === "dark" ? "#0d1223" : "#ffffff";

    setMeta("twitter:card", "summary_large_image");
    setMeta("twitter:site", "@FlexExams");

    [
      { rel: "preconnect",   href: "https://fonts.googleapis.com" },
      { rel: "preconnect",   href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "dns-prefetch", href: "//i.ibb.co" },
      { rel: "dns-prefetch", href: "//firestore.googleapis.com" },
      { rel: "dns-prefetch", href: "//firebase.googleapis.com" },
    ].forEach(({ rel, href, crossOrigin }) => {
      if (document.querySelector(`link[rel="${rel}"][href="${href}"]`)) return;
      const l = document.createElement("link");
      l.rel = rel;
      l.href = href;
      if (crossOrigin) l.crossOrigin = crossOrigin;
      document.head.appendChild(l);
    });

    if (!document.querySelector("link[rel='preload'][as='image']")) {
      const pl = document.createElement("link");
      pl.rel = "preload";
      pl.as  = "image";
      pl.href = "https://i.ibb.co/DPztDcgx/Chat-GPT-Image-Apr-26-2026-09-45-41-PM.png";
      document.head.appendChild(pl);
    }

    injectJsonLd("ld-org", {
      "@context": "https://schema.org",
      "@type": "Organization",
      "@id": "https://www.flexexams.com/#organization",
      "name": "FlexExams",
      "url": "https://www.flexexams.com",
      "logo": "https://www.flexexams.com/icons/icon-512x512.png",
      "image": "https://www.flexexams.com/og-image.png",
      "description": "IT certification practice platform with real exam questions, timed tests, and instant explanations for 50+ certifications.",
      "sameAs": ["https://twitter.com/FlexExams", "https://linkedin.com/company/flexexams"]
    });
  }, []);

  return (
    <AuthProvider>
      <style>{GLOBAL_CSS}</style>
      <AppInner />
    </AuthProvider>
  );
}
