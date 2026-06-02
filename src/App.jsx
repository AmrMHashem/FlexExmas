// App.jsx — FlexExams v5.0 — History Router Edition (SEO-Optimized)
// ✅ History API routing — clean URLs /topics /exams /exam/slug
// ✅ No more # in URLs → better SEO & social sharing
// ✅ Per-page canonical + og:url updates
// ✅ Structured data per page (BreadcrumbList + WebPage)
// ✅ Lazy loading + code splitting
// ✅ useTransition for non-blocking navigation
// ✅ Firebase/getExams loads after Auth check

import React, {
  useState,
  useCallback,
  useEffect,
  Suspense,
  lazy,
  useTransition,
} from "react";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import NavBar from "./components/NavBar";
import Footer from "./components/Footer";
import { Toast, Spinner } from "./components/UI";

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
const Terms             = lazy(() => import("./pages/Terms"));   // ✅ إضافة Terms

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
// slugify — توليد slug احترافي من اسم الاختبار
// ─────────────────────────────────────────────────────────────────
const slugify = (text) =>
  (text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06FF\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 70) || "exam";

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
  "/terms":              "terms",          // ✅ إضافة Terms
};

// ─────────────────────────────────────────────────────────────────
// getStateFromPath — يقرأ الـ pathname ويحدد الصفحة والـ slug
// ─────────────────────────────────────────────────────────────────
const getStateFromPath = (pathname = window.location.pathname) => {
  const clean = pathname.replace(/\/$/, "") || "/";

  // /exam/aws-solutions-architect-saa-c03
  if (clean.startsWith("/exam/")) {
    const slug = clean.replace("/exam/", "").trim();
    return { page: "exam-detail", slug };
  }

  const page = ROUTE_MAP[clean] || "home";
  return { page, slug: null };
};

// ─────────────────────────────────────────────────────────────────
// PAGE META — title + description + canonical per page
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
  terms: {   // ✅ إضافة Terms
    title: "Terms of Service & Privacy Policy — FlexExams",
    description: "Read FlexExams terms of service, privacy policy, and cookie policy. Learn how we protect your data and what rights you have.",
    path: "/terms",
  },
};

// ─────────────────────────────────────────────────────────────────
// SEO helpers
// ─────────────────────────────────────────────────────────────────
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
    const examSlug  = slugify(examTitle);
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

// ─────────────────────────────────────────────────────────────────
// usePageSEO hook
// ─────────────────────────────────────────────────────────────────
function usePageSEO(page, activeExam) {
  useEffect(() => {
    updatePageSEO(page, activeExam);
  }, [page, activeExam]);
}

// ─────────────────────────────────────────────────────────────────
// History navigation helper — pushes clean URL, no #
// ─────────────────────────────────────────────────────────────────
function pushPath(path) {
  if (window.location.pathname !== path) {
    window.history.pushState(null, "", path);
  }
}

// ─────────────────────────────────────────────────────────────────
// GLOBAL CSS
// ─────────────────────────────────────────────────────────────────
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
  --bg: #0d1223;
  --bg2: linear-gradient(145deg, #1a2b69 0%, #060810 100%);
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

.delay-1{animation-delay:0.03s} .delay-2{animation-delay:0.08s}
.delay-3{animation-delay:0.14s} .delay-4{animation-delay:0.20s}
.delay-5{animation-delay:0.28s} .delay-6{animation-delay:0.36s}
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

// ─────────────────────────────────────────────────────────────────
// Loading Screen
// ─────────────────────────────────────────────────────────────────
function LoadingScreen() {
  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "var(--bg)",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", zIndex: 9999,
      }}
    >
      <style>{`
        @keyframes loadGlow {
          0%,100% { box-shadow: 0 0 20px rgba(99,102,241,0.3); }
          50%      { box-shadow: 0 0 40px rgba(99,102,241,0.6); }
        }
        @keyframes loadDot {
          0%,100% { transform: scaleY(0.5); opacity: 0.4; }
          50%      { transform: scaleY(1);   opacity: 1;   }
        }
      `}</style>

      <div style={{ marginBottom: 28 }}>
        <img
          src="https://i.ibb.co/DPztDcgx/Chat-GPT-Image-Apr-26-2026-09-45-41-PM.png"
          width={70} height={70}
          style={{ objectFit: "contain", animation: "loadGlow 3s ease-in-out infinite", borderRadius: 24 }}
          alt="FlexExams" loading="eager" fetchpriority="high"
        />
      </div>

      <div style={{
        fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 28, fontWeight: 900,
        marginBottom: 5, letterSpacing: "-1px",
        background: "var(--gradient-accent)",
        WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
      }}>
        FlexExams
      </div>

      <div style={{
        fontSize: 11, color: "var(--text3)", letterSpacing: "0.25em",
        textTransform: "uppercase", marginBottom: 36, fontWeight: 700,
      }}>
        Certification Platform
      </div>

      <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} style={{
            width: 5, height: 14, borderRadius: 99,
            background: "linear-gradient(180deg,var(--accent),var(--accent2))",
            animation: `loadDot 1s ease-in-out ${i * 0.12}s infinite`,
          }} />
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// AppInner — النواة الرئيسية
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

  // Weekly counters auto-update function
  const runWeeklyCountersUpdate = useCallback(async () => {
    try {
      const { runWeeklyCountersUpdate: update } = await import("./services/firestore");
      await update();
      console.log('[Info] Weekly counters updated successfully.');
    } catch (err) {
      console.warn('Weekly counters update failed:', err);
    }
  }, []);

  // ── nav — دالة التنقل المركزية (History API) ─────────────────
  const nav = useCallback(
    (p, opts) => {
      startTransition(() => {
        if (p === "auth") {
          setAuthMode(opts?.mode || "login");
          // ── حفظ الصفحة الحالية قبل الانتقال لـ auth ─────────────
          try {
            const returnState = {
              page        : page,
              examId      : activeExam?.id   || null,
              examSlug    : activeExam
                ? slugify(activeExam.title || activeExam.name || String(activeExam.id))
                : null,
              checkoutData: checkoutData     || null,
              couponCode  : opts?.couponCode || null,
              scrollY     : window.scrollY,
            };
            sessionStorage.setItem("flexexams_return_to", JSON.stringify(returnState));
          } catch (_) {}
          pushPath("/auth");
          setPage("auth");
          return;
        }

        if (p === "exams") {
          setActiveFilter({
            vendor: opts?.vendorFilter || null,
            topic:  opts?.topicFilter  || null,
          });
          pushPath("/exams");
          setPage("exams");
          return;
        }

        if (p === "exam-detail") {
          const exam = opts?.exam || opts;
          if (exam && (exam.title || exam.name || exam.id)) {
            const slug = slugify(exam.title || exam.name || String(exam.id));
            setActiveExam(exam);
            pushPath(`/exam/${slug}`);
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

        // باقي الصفحات
        const meta = PAGE_META[p];
        const path = meta ? meta.path : `/${p}`;
        pushPath(path);
        setPage(p);
      });

      requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "smooth" }));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [startTransition, page, activeExam, checkoutData]
  );

  // ── handleReturnAfterAuth — يُستدعى من Auth بعد نجاح الـ login/register ──
  const handleReturnAfterAuth = useCallback(() => {
    try {
      const raw = sessionStorage.getItem("flexexams_return_to");
      if (!raw) { nav("home"); return; }
      sessionStorage.removeItem("flexexams_return_to");
      const state = JSON.parse(raw);

      if (state.page === "exam-detail" && state.examSlug && exams.length > 0) {
        const found = exams.find(
          (ex) => slugify(ex.title || ex.name || String(ex.id)) === state.examSlug
        );
        if (found) {
          setActiveExam(found);
          pushPath(`/exam/${state.examSlug}`);
          startTransition(() => setPage("exam-detail"));
          if (state.scrollY) {
            setTimeout(() => window.scrollTo({ top: state.scrollY, behavior: "smooth" }), 300);
          }
          return;
        }
      }

      if (state.page === "checkout" && state.checkoutData) {
        setCheckoutData(state.checkoutData);
        pushPath("/checkout");
        startTransition(() => setPage("checkout"));
        return;
      }

      // صفحة أخرى — نرجع لها
      const validPages = ["exams", "dashboard", "pricing", "my-exams", "favorites"];
      if (validPages.includes(state.page)) {
        nav(state.page);
      } else {
        nav("home");
      }
    } catch (_) {
      nav("home");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exams, startTransition]);

  const startQuiz = useCallback(
    (data) => {
      setQuizData(data);
      nav("quiz");
    },
    [nav]
  );

  // ── مستمع لـ Back / Forward في المتصفح ──────────────────────
  useEffect(() => {
    const handlePopState = () => {
      const { page: newPage, slug } = getStateFromPath();

      startTransition(() => {
        if (newPage === "exam-detail" && slug) {
          if (exams.length > 0) {
            const found = exams.find(
              (ex) => slugify(ex.title || ex.name || String(ex.id)) === slug
            );
            if (found) {
              setActiveExam(found);
              setPage("exam-detail");
            } else {
              window.history.replaceState(null, "", "/exams");
              setPage("exams");
            }
          } else {
            setPendingSlug(slug);
            setPage("exam-detail");
          }
          return;
        }
        setPage(newPage);
      });
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [exams, startTransition]);

  // ── Certificate verify من query param (?id=...) ──────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    if (id) {
      setVerifyCertId(id);
      setPage("verify");
    }
  }, []);

  // ── Quiz beforeunload guard ───────────────────────────────────
  useEffect(() => {
    if (page !== "quiz") return;
    const h = (e) => {
      e.preventDefault();
      e.returnValue = "You have an active exam. Are you sure?";
    };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [page]);

  // ── تحميل الـ Exams ──────────────────────────────────────────
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
              (ex) => slugify(ex.title || ex.name || String(ex.id)) === pendingSlug
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
        if (!cancelled) {
          setExamsLoaded(true);
          setPendingSlug(null);
        }
      }
    };

    const t = setTimeout(load, 200);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [examsLoaded, isLoading, pendingSlug, showToast]);

  // ── refreshExams — يُعاد استدعاؤه بعد أي تعديل على الأسئلة ──
  const refreshExams = useCallback(async () => {
    try {
      const { getExams } = await import("./services/firestore");
      const data = await getExams();
      const active = data.filter((ex) => ex.isActive !== false);
      setExams(active);
      // إذا كان الاختبار الحالي مفتوحًا، نحدّث بياناته أيضًا
      if (activeExam) {
        const updated = active.find((ex) => ex.id === activeExam.id);
        if (updated) setActiveExam(updated);
      }
    } catch (err) {
      console.warn("refreshExams failed:", err);
    }
  }, [activeExam]);

  if (isLoading) return <LoadingScreen />;

  return (
    <>
      <NavBar page={page} setPage={nav} showToast={showToast} extraLinks={[{page:"leaderboard",label:"🏆 Leaderboard"},{page:"referral",label:"🎁 Referral"}]} />

      {/* Pricing button is now inside NavBar right actions */}

      <main
        key={page}
        className="fade-in"
        style={{ minHeight: "calc(100vh - 72px)", overflowX: "hidden" }}
      >
        <Suspense fallback={<PageFallback />}>

          {page === "home" && (
            <Home setPage={nav} setActiveExam={setActiveExam} exams={exams} />
          )}

          {page === "exams" && (
            <Exams
              setPage={nav}
              setActiveExam={setActiveExam}
              exams={exams}
              vendorFilter={activeFilter.vendor}
              topicFilter={activeFilter.topic}
              showToast={showToast}
            />
          )}

          {page === "topics" && (
            <Topics setPage={nav} setActiveExam={setActiveExam} exams={exams} />
          )}

          {page === "categories" && (
            <Categories setPage={nav} setActiveExam={setActiveExam} exams={exams} />
          )}

          {page === "about" && <About />}

          {page === "contact" && <Contact showToast={showToast} />}

          {page === "terms" && <Terms />}   {/* ✅ إضافة صفحة Terms */}

          {page === "exam-detail" && activeExam && (
            <ExamDetail
              exam={activeExam}
              setPage={nav}
              startQuiz={startQuiz}
              showToast={showToast}
            />
          )}

          {page === "exam-detail" && !activeExam && <PageFallback />}

          {page === "quiz" && quizData && (
            <Quiz
              quizData={quizData}
              setPage={nav}
              setResultData={setResultData}
              showToast={showToast}
            />
          )}

          {page === "result" && resultData && (
            <Result
              result={resultData}
              setPage={nav}
              startQuiz={startQuiz}
              exams={exams}
              showToast={showToast}
            />
          )}

          {page === "auth" && (
            <Auth setPage={nav} showToast={showToast} initialMode={authMode} onAuthSuccess={handleReturnAfterAuth} />
          )}

          {page === "dashboard" && (
            <Dashboard
              setPage={nav}
              setResultData={setResultData}
              setActiveExam={setActiveExam}
              exams={exams}
              showToast={showToast}
            />
          )}

          {page === "my-exams" && (
            <MyExams
              setPage={nav}
              setResultData={setResultData}
              setActiveExam={setActiveExam}
              exams={exams}
              showToast={showToast}
            />
          )}

          {page === "admin" && (
            <Admin showToast={showToast} setPage={nav} onQuestionsChange={refreshExams} />
          )}

          {page === "favorites" && (
            <Favorites
              setPage={nav}
              setActiveExam={setActiveExam}
              exams={exams}
              showToast={showToast}
            />
          )}

          {page === "verify" && (
            <CertificateVerify certId={verifyCertId} setPage={nav} />
          )}

          {page === "career-diagnostic" && (
            <CareerDiagnostic setPage={nav} exams={exams} />
          )}

          {page === "pricing" && (
            <Pricing setPage={nav} showToast={showToast} />
          )}
          {page === "leaderboard" && (
            <Suspense fallback={<div style={{padding:48,textAlign:"center"}}><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5" style={{animation:"spin .8s linear infinite"}}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg></div>}>
              <Leaderboard setPage={nav} showToast={showToast} />
            </Suspense>
          )}
          {page === "referral" && (
            <Suspense fallback={null}>
              {React.createElement(lazy(() => import("./components/ReferralSystem")), { showToast })}
            </Suspense>
          )}

          {page === "checkout" && (
            <Checkout
              setPage={nav}
              showToast={showToast}
              checkoutData={checkoutData}
            />
          )}

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

    // Theme color meta
    let tc = document.querySelector("meta[name='theme-color']");
    if (!tc) {
      tc = document.createElement("meta");
      tc.name = "theme-color";
      document.head.appendChild(tc);
    }
    tc.content = saved === "dark" ? "#0d1223" : "#ffffff";

    // Twitter card base
    setMeta("twitter:card", "summary_large_image");
    setMeta("twitter:site", "@FlexExams");

    // Resource hints
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

    // Preload logo (LCP)
    if (!document.querySelector("link[rel='preload'][as='image']")) {
      const pl = document.createElement("link");
      pl.rel = "preload";
      pl.as  = "image";
      pl.href = "https://i.ibb.co/DPztDcgx/Chat-GPT-Image-Apr-26-2026-09-45-41-PM.png";
      document.head.appendChild(pl);
    }

    // Organization JSON-LD (persistent)
    injectJsonLd("ld-org", {
      "@context": "https://schema.org",
      "@type": "Organization",
      "@id": "https://www.flexexams.com/#organization",
      "name": "FlexExams",
      "url": "https://www.flexexams.com",
      "logo": "https://www.flexexams.com/icons/icon-512x512.png",
      "image": "https://www.flexexams.com/og-image.png",
      "description": "IT certification practice platform with real exam questions, timed tests, and instant explanations for 50+ certifications.",
      "sameAs": [
        "https://twitter.com/FlexExams",
        "https://linkedin.com/company/flexexams"
      ]
    });
  }, []);

  return (
    <AuthProvider>
      <style>{GLOBAL_CSS}</style>
      <AppInner />
    </AuthProvider>
  );
}
