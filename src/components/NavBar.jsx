// components/NavBar.jsx — v5.0 Bottom Tab Bar on mobile + sticky top nav
import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../hooks/useAuth";
import { Btn, Spinner } from "./UI";
import ThemeToggle from "./ThemeToggle";

const NI = ({ n, s = 16 }) => {
  const icons = {
    home: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
    book: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>,
    fire: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>,
    globe: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
    info: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
    send: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
    heart: <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="0"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
    settings: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
    refresh: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>,
    logout: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
    sparkles: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3L13.5 8.5L19 10L13.5 11.5L12 17L10.5 11.5L5 10L10.5 8.5Z"/><path d="M19 3L19.8 5.2L22 6L19.8 6.8L19 9L18.2 6.8L16 6L18.2 5.2Z"/><path d="M5 17L5.5 18.5L7 19L5.5 19.5L5 21L4.5 19.5L3 19L4.5 18.5Z"/></svg>,
    grid: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
    chevronRight: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>,
    x: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
    myexams: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
  };
  return <span style={{ display: "flex", alignItems: "center" }}>{icons[n] || null}</span>;
};

const LogoMark = React.memo(({ style = {}, size = 100 }) => (
  <img
    src="https://i.ibb.co/DPztDcgx/Chat-GPT-Image-Apr-26-2026-09-45-41-PM.png"
    alt="Logo"
    width={90}
    height={90}
    style={{ display: "block", objectFit: "contain", ...style }}
  />
));

// ─── الروابط الأساسية في الـ Bottom Tab Bar (5 كحد أقصى) ──────────────────
const PRIMARY_TABS = [
  { p: "home",       ic: "home",   lb: "Home" },
  { p: "exams",      ic: "book",   lb: "Exams" },
  { p: "topics",     ic: "fire",   lb: "Topics" },
  { p: "categories", ic: "globe",  lb: "Vendors" },
  { p: "more",       ic: "grid",   lb: "More" },   // زر الـ More Sheet
];

// ─── الروابط الثانوية تظهر في More Sheet ──────────────────────────────────
const MORE_ITEMS = [
  { p: "about",      ic: "info",   lb: "About" },
  { p: "contact",    ic: "send",   lb: "Contact" },
  { p: "favorites",  ic: "heart",  lb: "Favorites" },
  { p: "my-exams",   ic: "myexams",lb: "My Exams" },
];

// ─── Desktop nav links (كل الروابط) ───────────────────────────────────────
const DESKTOP_LINKS = [
  { p: "home",       ic: "home",   lb: "Home" },
  { p: "exams",      ic: "book",   lb: "Exams" },
  { p: "topics",     ic: "fire",   lb: "Topics" },
  { p: "categories", ic: "globe",  lb: "Vendors" },
  { p: "about",      ic: "info",   lb: "About" },
  { p: "contact",    ic: "send",   lb: "Contact" },
];

const NavBar = React.memo(function NavBar({ page, setPage, showToast }) {
  const { user, profile, isAdmin, isLoading, logout, refreshProfile } = useAuth();
  const [refreshing, setRefreshing]   = useState(false);
  const [scrolled, setScrolled]       = useState(false);
  const [moreOpen, setMoreOpen]       = useState(false);
  const moreRef                       = useRef(null);

  // ── scroll shadow ───────────────────────────────────────────────────────
  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        setScrolled(window.scrollY > 10);
        ticking = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // ── close More Sheet on Escape ──────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") setMoreOpen(false); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // ── close More Sheet on outside click ──────────────────────────────────
  useEffect(() => {
    if (!moreOpen) return;
    const handler = (e) => {
      if (moreRef.current && !moreRef.current.contains(e.target)) setMoreOpen(false);
    };
    // استخدم setTimeout مع cleanup لتجنب تسرب الـ event listener
    const id = setTimeout(() => document.addEventListener("pointerdown", handler), 0);
    return () => {
      clearTimeout(id);
      document.removeEventListener("pointerdown", handler);
    };
  }, [moreOpen]);

  // ── helpers ─────────────────────────────────────────────────────────────
  const nav = (p) => {
    setPage(p);
    setMoreOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goToAuth = (mode = "login") => {
    // تأكد من أن setPage يقبل وسيطين (اسم الصفحة وكائن الخيارات) ، إذا لم يفعل فمرر فقط "auth"
    setPage("auth", { mode });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleLogout = async () => {
    await logout(); // انتظر اكتمال تسجيل الخروج
    setPage("home");
    showToast({ msg: "Signed out successfully. See you soon!", type: "info" });
  };

  const handleRefreshRole = async () => {
    setRefreshing(true);
    const p = await refreshProfile();
    setRefreshing(false);
    showToast({
      msg: p?.role === "admin" ? "✅ Admin access granted" : "Profile synced",
      type: p?.role === "admin" ? "success" : "info",
    });
  };

  // استخدم الحرف الأول بعد إزالة الفراغات الزائدة
  const displayName = (profile?.name || user?.displayName || "U").trim();
  const firstChar = displayName[0] || "U";

  // ── active tab: "more" يضيء لو الصفحة الحالية من MORE_ITEMS ────────────
  const morePages   = MORE_ITEMS.map((m) => m.p);
  const activeTab   = morePages.includes(page) ? "more" : page;

  // ── shared icon-button style ─────────────────────────────────────────────
  const iconBtn = (extraActive = false, activeColors = {}) => ({
    width: 44, height: 44, borderRadius: 14,
    border: `1.5px solid ${extraActive ? (activeColors.border || "var(--border)") : "var(--border)"}`,
    background: extraActive ? (activeColors.bg || "var(--bg3)") : "var(--bg3)",
    color: extraActive ? (activeColors.color || "var(--text3)") : "var(--text3)",
    cursor: "pointer", display: "flex", alignItems: "center",
    justifyContent: "center", flexShrink: 0, transition: "all 0.2s",
  });

  return (
    <>
      {/* ══════════════════════════════════════════════════
          TOP NAV BAR — ثابت دايمًا فوق
      ══════════════════════════════════════════════════ */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 1000,
        background: scrolled ? "var(--bg-glass)" : "var(--bg2)",
        backdropFilter: "var(--nav-blur)",
        WebkitBackdropFilter: "var(--nav-blur)",
        borderBottom: `1px solid ${scrolled ? "var(--border2)" : "var(--border)"}`,
        padding: "0 clamp(16px, 4vw, 48px)",
        display: "flex", alignItems: "center",
        justifyContent: "space-between",
        height: "var(--navbar-height, 68px)",
        transition: "background 0.3s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.3s",
        boxShadow: scrolled ? "var(--card-shadow)" : "none",
      }}>

        {/* ── Logo ── */}
        <div
          onClick={() => nav("home")}
          style={{ display: "flex", alignItems: "center", gap: 0, cursor: "pointer",
            flexShrink: 0, userSelect: "none", transition: "transform 0.2s",
            overflow: "visible", marginRight: "12px" }}
          onMouseEnter={e => e.currentTarget.style.transform = "scale(1.02)"}
          onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
        >
          <LogoMark size={70} style={{ marginBottom: "-19px", overflow: "visible" }} />
          <div>
            <div style={{ fontFamily: "'Plus Jakarta Sans','Syne',sans-serif", fontWeight: 900,
              fontSize: 26, color: "var(--text-primary)", letterSpacing: "-0.02em",
              lineHeight: 1.2, display: "flex", alignItems: "center", gap: 6 }}>
              FlexExams
              <span style={{ fontSize: 8, padding: "2px 6px", borderRadius: 6,
                background: "linear-gradient(135deg,rgba(99,102,241,0.2),rgba(168,85,247,0.2))",
                color: "var(--accent)", fontWeight: 800, letterSpacing: "0.08em",
                border: "1px solid rgba(139,92,246,0.4)" }}>.Com</span>
            </div>
            <div style={{ fontSize: 9.5, color: "var(--text3)", letterSpacing: "0.14em",
              fontWeight: 600, textTransform: "uppercase" }}>Certification Hub</div>
          </div>
        </div>

        {/* ── Desktop nav links (مخفية على موبايل) ── */}
        <div className="desktop-links" style={{ display: "flex", gap: 4, alignItems: "center",
          flex: "1 1 auto", justifyContent: "center" }}>
          {DESKTOP_LINKS.map(({ p, ic, lb }) => {
            const active = page === p;
            return (
              <button key={p} onClick={() => nav(p)} style={{
                padding: "8px 12px", borderRadius: 50,
                border: "none",
                background: active
                  ? "linear-gradient(135deg,rgba(99,102,241,0.15),rgba(168,85,247,0.15))"
                  : "transparent",
                color: active ? "var(--accent)" : "var(--text2)",
                fontSize: 13, fontWeight: 600, cursor: "pointer",
                display: "inline-flex", alignItems: "center", gap: 6,
                fontFamily: "inherit", transition: "all 0.2s",
                whiteSpace: "nowrap", minHeight: 40, flexShrink: 0,
              }}
                onMouseEnter={e => { if (!active) { e.currentTarget.style.background = "rgba(139,92,246,0.1)"; e.currentTarget.style.color = "var(--accent)"; } }}
                onMouseLeave={e => { if (!active) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text2)"; } }}
              >
                <NI n={ic} s={14} /><span>{lb}</span>
              </button>
            );
          })}
          {user && (
            <>
             <button
                onClick={() => nav("my-exams")}
                style={{
                  padding: "8px 14px", borderRadius: 12,
                  border: "1.5px solid var(--border)", background: "var(--bg3)",
                  color: "var(--text2)", fontSize: 12, fontWeight: 600,
                  cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
                  transition: "all 0.2s", whiteSpace: "nowrap",
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.color = "var(--accent)"; e.currentTarget.style.background = "var(--accent-soft)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text2)"; e.currentTarget.style.background = "var(--bg3)"; }}
                className="hide-mobile"
              >
                <NI n="book" s={13} /> My Exams
              </button>
              {isAdmin && (
                 <button
                  onClick={() => nav("admin")}
                  style={{
                    padding: "8px 14px", borderRadius: 12,
                    background: "rgba(245,158,11,0.12)",
                    border: "1.5px solid rgba(245,158,11,0.3)",
                    color: "var(--gold)", fontSize: 12, fontWeight: 700,
                    cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = "rgba(245,158,11,0.2)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "rgba(245,158,11,0.12)"; e.currentTarget.style.transform = ""; }}
                  className="hide-mobile"
                >
                  <NI n="settings" s={13} /> Admin
                </button>
              )}
            </>
          )}
        </div>

        {/* ── Right side actions ── */}
        <div style={{ display: "flex", gap: 0, alignItems: "center", flexShrink: 0, marginLeft: 8 }}>

          {/* Favorites — desktop only */}
          <button
            className="desktop-only"
            onClick={() => nav("favorites")}
            title="My Favorites"
            style={{ ...iconBtn(page === "favorites", { border: "rgba(248,113,113,0.5)", bg: "rgba(248,113,113,0.12)", color: "#f87171" }) }}
            onMouseEnter={e => { if (page !== "favorites") { e.currentTarget.style.background = "rgba(248,113,113,0.15)"; e.currentTarget.style.borderColor = "rgba(248,113,113,0.5)"; e.currentTarget.style.color = "#f87171"; } e.currentTarget.style.transform = "scale(1.05)"; }}
            onMouseLeave={e => { if (page !== "favorites") { e.currentTarget.style.background = "var(--bg3)"; e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text3)"; } e.currentTarget.style.transform = ""; }}
          ><NI n="heart" s={16} /></button>

          <ThemeToggle />

          {isLoading ? (
            <div style={{ width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Spinner size={22} color="var(--accent)" />
            </div>
          ) : user ? (
            <>
              {/* Refresh role — desktop only */}
              {!isAdmin && (
                <button
                  className="desktop-only"
                  onClick={handleRefreshRole}
                  disabled={refreshing}
                  title="Sync permissions"
                  style={iconBtn()}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.color = "var(--accent)"; e.currentTarget.style.background = "var(--accent-soft)"; e.currentTarget.style.transform = "rotate(180deg)"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text3)"; e.currentTarget.style.background = "var(--bg3)"; e.currentTarget.style.transform = ""; }}
                >
                  {refreshing ? <Spinner size={15} color="var(--accent)" /> : <NI n="refresh" s={16} />}
                </button>
              )}

              {/* Account button */}
              <button
                onClick={() => nav("dashboard")}
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "6px 12px 6px 8px", borderRadius: 40,
                  border: `1.5px solid ${isAdmin ? "rgba(245,158,11,0.4)" : "var(--border)"}`,
                  background: isAdmin ? "rgba(245,158,11,0.08)" : "var(--bg3)",
                  color: "var(--text)", cursor: "pointer", fontSize: 13,
                  fontWeight: 600, fontFamily: "inherit", flexShrink: 0, minHeight: 44,
                  transition: "all 0.2s",
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "var(--card-hover)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}
              >
                <div style={{
                  width: 32, height: 32, borderRadius: "50%",
                  fontSize: 13, fontWeight: 800, color: "#fff",
                  background: isAdmin ? "linear-gradient(135deg,#F59E0B,#D97706)" : "var(--gradient-accent)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>{firstChar}</div>
                <span className="hide-small" style={{ fontSize: 13 }}>Account</span>
              </button>

              {/* Logout */}
              <button
                onClick={handleLogout}
                title="Sign out"
                style={iconBtn()}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(239,68,68,0.12)"; e.currentTarget.style.borderColor = "rgba(239,68,68,0.4)"; e.currentTarget.style.color = "var(--red)"; e.currentTarget.style.transform = "scale(1.05)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "var(--bg3)"; e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text3)"; e.currentTarget.style.transform = ""; }}
              ><NI n="logout" s={16} /></button>
            </>
          ) : (
            <>
              {/* Sign In */}
              <button
                onClick={() => goToAuth("login")}
                className="auth-signin-btn"
                style={{
                  height: 30, padding: "0 10px", borderRadius: 30,
                  border: "1px solid rgba(139,92,246,0.4)",
                  background: "rgba(88, 50, 178, 0.51)", color: "var(--accent)",
                  fontSize: 13, fontWeight: 600, cursor: "pointer",
                  whiteSpace: "nowrap", flexShrink: 0, transition: "all 0.2s",
                  display: "flex", alignItems: "center",
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(139,92,246,0.7)"; e.currentTarget.style.background = "rgba(139,92,246,0.15)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(139,92,246,0.4)"; e.currentTarget.style.background = "rgba(139,92,246,0.08)"; }}
              >
                <span className="auth-label-full">Sign In</span>
                <span className="auth-label-short">Sign</span>
              </button>
              {/* Sign Up */}
              <button
                onClick={() => goToAuth("register")}
                className="auth-signup-btn"
                style={{
                  height: 36, padding: "0 14px", borderRadius: 40, border: "none",
                  background: "linear-gradient(135deg,#6366f1,#a855f7)", color: "#fff",
                  fontSize: 13, fontWeight: 700, cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 5,
                  boxShadow: "0 4px 14px rgba(139,92,246,0.4)",
                  whiteSpace: "nowrap", flexShrink: 0, transition: "all 0.2s",
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 8px 20px rgba(139,92,246,0.5)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 4px 14px rgba(139,92,246,0.4)"; }}
              >
                <NI n="sparkles" s={13} />
                <span className="auth-label-full">Sign Up</span>
                <span className="auth-label-short">Up</span>
              </button>
            </>
          )}
        </div>
      </nav>

      {/* ══════════════════════════════════════════════════
          BOTTOM TAB BAR — موبايل فقط — ثابت فوق كل حاجة
      ══════════════════════════════════════════════════ */}
      <div className="bottom-tab-bar" aria-label="Main navigation">
        {PRIMARY_TABS.map(({ p, ic, lb }) => {
          const isMore   = p === "more";
          const isActive = isMore ? activeTab === "more" : activeTab === p;

          return (
            <button
              key={p}
              onClick={() => isMore ? setMoreOpen((v) => !v) : nav(p)}
              aria-label={lb}
              aria-current={isActive ? "page" : undefined}
              style={{
                flex: 1, display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center", gap: 4,
                background: "none", border: "none", cursor: "pointer",
                padding: "6px 0 4px", position: "relative",
                color: isActive ? "var(--accent)" : "var(--text3)",
                transition: "color 0.2s",
                WebkitTapHighlightColor: "transparent",
              }}
            >
              {/* Active pill indicator */}
              {isActive && (
                <span style={{
                  position: "absolute", top: 0, left: "50%",
                  transform: "translateX(-50%)",
                  width: 28, height: 3, borderRadius: "0 0 4px 4px",
                  background: "var(--accent)",
                }} />
              )}
              {/* Icon wrapper with soft glow when active */}
              <span style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                width: 36, height: 28, borderRadius: 10,
                background: isActive ? "var(--accent-soft)" : "transparent",
                transition: "background 0.2s",
              }}>
                <NI n={ic} s={20} />
              </span>
              <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.02em", lineHeight: 1 }}>
                {lb}
              </span>
            </button>
          );
        })}
      </div>

      {/* ══════════════════════════════════════════════════
          MORE BOTTOM SHEET — يطلع لما يضغط على "More"
      ══════════════════════════════════════════════════ */}

      {/* Backdrop */}
      {moreOpen && (
        <div
          className="more-backdrop"
          onClick={() => setMoreOpen(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 1100,
            background: "rgba(0,0,0,0.45)",
            animation: "fadeIn 0.2s ease",
          }}
        />
      )}

      {/* Sheet */}
      <div
        ref={moreRef}
        className="more-sheet"
        style={{
          position: "fixed", left: 0, right: 0, bottom: 0,
          zIndex: 1101,
          background: "var(--bg2)",
          borderTop: "1px solid var(--border)",
          borderRadius: "20px 20px 0 0",
          padding: "12px 0 calc(env(safe-area-inset-bottom, 0px) + 80px)",
          transform: moreOpen ? "translateY(0)" : "translateY(100%)",
          transition: "transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
          willChange: "transform",
          boxShadow: "0 -8px 32px rgba(0,0,0,0.15)",
        }}
      >
        {/* Handle */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
          <div style={{ width: 40, height: 4, borderRadius: 4, background: "var(--border2)" }} />
        </div>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 20px 12px" }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>More</span>
          <button
            onClick={() => setMoreOpen(false)}
            style={{ width: 32, height: 32, borderRadius: 10, border: "1px solid var(--border)",
              background: "var(--bg3)", color: "var(--text3)", display: "flex",
              alignItems: "center", justifyContent: "center", cursor: "pointer" }}
          ><NI n="x" s={15} /></button>
        </div>

        {/* Menu Items */}
        <div style={{ padding: "0 12px", display: "flex", flexDirection: "column", gap: 2 }}>
          {MORE_ITEMS.map(({ p, ic, lb }) => {
            const isActive = page === p;
            return (
              <button
                key={p}
                onClick={() => nav(p)}
                style={{
                  display: "flex", alignItems: "center", gap: 14,
                  padding: "13px 12px", borderRadius: 14, border: "none",
                  background: isActive ? "var(--accent-soft)" : "transparent",
                  color: isActive ? "var(--accent)" : "var(--text)",
                  fontSize: 15, fontWeight: isActive ? 700 : 500,
                  cursor: "pointer", textAlign: "left", fontFamily: "inherit",
                  transition: "background 0.15s",
                  WebkitTapHighlightColor: "transparent",
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "var(--bg3)"; }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
              >
                <span style={{
                  width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                  background: isActive ? "rgba(139,92,246,0.15)" : "var(--bg3)",
                  border: `1px solid ${isActive ? "rgba(139,92,246,0.25)" : "var(--border)"}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: isActive ? "var(--accent)" : "var(--text3)",
                  transition: "all 0.15s",
                }}>
                  <NI n={ic} s={18} />
                </span>
                <span style={{ flex: 1 }}>{lb}</span>
                <NI n="chevronRight" s={16} />
              </button>
            );
          })}

          {/* Admin في الـ More Sheet لو admin */}
          {isAdmin && (
            <button
              onClick={() => nav("admin")}
              style={{
                display: "flex", alignItems: "center", gap: 14,
                padding: "13px 12px", borderRadius: 14, border: "none",
                background: page === "admin" ? "rgba(245,158,11,0.12)" : "transparent",
                color: page === "admin" ? "var(--gold)" : "var(--text)",
                fontSize: 15, fontWeight: page === "admin" ? 700 : 500,
                cursor: "pointer", textAlign: "left", fontFamily: "inherit", transition: "background 0.15s",
              }}
            >
              <span style={{
                width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                background: page === "admin" ? "rgba(245,158,11,0.12)" : "var(--bg3)",
                border: `1px solid ${page === "admin" ? "rgba(245,158,11,0.3)" : "var(--border)"}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: page === "admin" ? "var(--gold)" : "var(--text3)",
              }}>
                <NI n="settings" s={18} />
              </span>
              <span style={{ flex: 1 }}>Admin Panel</span>
              <NI n="chevronRight" s={16} />
            </button>
          )}

          {/* Divider */}
          <div style={{ height: 1, background: "var(--border)", margin: "8px 0" }} />

          {/* Auth actions in sheet */}
          {user ? (
            <>
              {!isAdmin && (
                <button
                  onClick={async () => { setMoreOpen(false); await handleRefreshRole(); }}
                  disabled={refreshing}
                  style={{
                    display: "flex", alignItems: "center", gap: 14, padding: "13px 12px",
                    borderRadius: 14, border: "none", background: "transparent",
                    color: "var(--text)", fontSize: 15, fontWeight: 500,
                    cursor: "pointer", textAlign: "left", fontFamily: "inherit", transition: "background 0.15s",
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = "var(--bg3)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  <span style={{ width: 40, height: 40, borderRadius: 12, background: "var(--bg3)",
                    border: "1px solid var(--border)", display: "flex", alignItems: "center",
                    justifyContent: "center", color: "var(--text3)", flexShrink: 0 }}>
                    {refreshing ? <Spinner size={16} color="var(--accent)" /> : <NI n="refresh" s={18} />}
                  </span>
                  <span>Sync Permissions</span>
                  <NI n="chevronRight" s={16} />
                </button>
              )}
              <button
                onClick={() => { setMoreOpen(false); handleLogout(); }}
                style={{
                  display: "flex", alignItems: "center", gap: 14, padding: "13px 12px",
                  borderRadius: 14, border: "none", background: "transparent",
                  color: "var(--red)", fontSize: 15, fontWeight: 500,
                  cursor: "pointer", textAlign: "left", fontFamily: "inherit", transition: "background 0.15s",
                }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(239,68,68,0.08)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <span style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(239,68,68,0.08)",
                  border: "1px solid rgba(239,68,68,0.2)", display: "flex", alignItems: "center",
                  justifyContent: "center", color: "var(--red)", flexShrink: 0 }}>
                  <NI n="logout" s={18} />
                </span>
                <span>Sign Out</span>
              </button>
            </>
          ) : (
            <div style={{ display: "flex", gap: 10, padding: "4px 0" }}>
              <button
                onClick={() => { setMoreOpen(false); goToAuth("login"); }}
                style={{
                  flex: 1, padding: "12px", borderRadius: 14,
                  border: "1.5px solid rgba(139,92,246,0.35)",
                  background: "rgba(139,92,246,0.08)", color: "var(--accent)",
                  fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                }}
              >Sign In</button>
              <button
                onClick={() => { setMoreOpen(false); goToAuth("register"); }}
                style={{
                  flex: 1, padding: "12px", borderRadius: 14, border: "none",
                  background: "linear-gradient(135deg,#6366f1,#a855f7)", color: "#fff",
                  fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                  boxShadow: "0 4px 12px rgba(139,92,246,0.35)",
                }}
              >Sign Up</button>
            </div>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════ */}
      <style>{`
        :root {
          --navbar-height: 68px;
        }

        /* ── Desktop: offset body so content isn't hidden under fixed nav ── */
        @media (min-width: 769px) {
          body {
            padding-top: var(--navbar-height) !important;
          }
        }

        /* Auth labels default: show full, hide short */
        .auth-label-full { display: inline; }
        .auth-label-short { display: none; }

        /* ── Default hide desktop-only elements (shown only on desktop) ── */
        .desktop-only {
          display: none;
        }

        /* ── Desktop: إخفاء الـ Bottom Tab Bar ── */
        .bottom-tab-bar {
          display: none;
        }
        .more-backdrop {
          display: none;
        }
        .more-sheet {
          display: none;
        }

        /* ── Mobile: إظهار الـ Bottom Tab Bar وإخفاء روابط الـ Desktop ── */
        @media (max-width: 768px) {
          :root {
            --navbar-height: 56px;
          }

          .desktop-links {
            display: none !important;
          }

          .desktop-only {
            display: none !important;
          }

          .hide-small {
            display: none !important;
          }

          /* Auth buttons — compact on mobile */
          .auth-signin-btn,
          .auth-signup-btn {
            height: 32px !important;
            padding: 0 10px !important;
            font-size: 12px !important;
            gap: 3px !important;
          }

          /* Show short label, hide full label */
          .auth-label-full { display: none !important; }
          .auth-label-short { display: inline !important; }

          .bottom-tab-bar {
            display: flex;
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            z-index: 1000;
            height: calc(60px + env(safe-area-inset-bottom, 0px));
            padding-bottom: env(safe-area-inset-bottom, 0px);
            background: var(--bg2);
            border-top: 1px solid var(--border);
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
          }

          .more-backdrop {
            display: block;
          }

          .more-sheet {
            display: block;
          }

          /* padding للـ body: فوق للـ navbar + تحت للـ tab bar */
          body {
            padding-top: var(--navbar-height) !important;
            padding-bottom: calc(60px + env(safe-area-inset-bottom, 0px)) !important;
          }
        }

        /* ── Desktop: إظهار كل حاجة خاصة بالـ desktop ── */
        @media (min-width: 769px) {
          .desktop-links {
            display: flex !important;
          }
          .desktop-only {
            display: flex !important;
          }
          .hide-small {
            display: inline-block !important;
          }
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      `}</style>
    </>
  );
});

export default NavBar;
