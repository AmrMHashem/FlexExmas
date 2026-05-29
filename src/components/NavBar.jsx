// NavBar.jsx — v6.6 Mobile consolidated dropdown + theme toggle only on mobile
import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../hooks/useAuth";
import { Btn, Spinner } from "./UI";
import ThemeToggle from "./ThemeToggle";
import { db } from "../firebase";
import { collection, query, where, orderBy, onSnapshot, updateDoc, doc, limit as fbLimit } from "firebase/firestore";

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
    chevronDown: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>,
    x: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
    bell: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
    tag: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>,
    myexams: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
    diamond: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 15 10-15-10-5zM2 7l10 5 10-5M12 22V12"/></svg>,
    menu: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
  };
  return <span style={{ display: "flex", alignItems: "center" }}>{icons[n] || null}</span>;
};

const LogoMark = React.memo(({ style = {}, size = 100 }) => (
  <img
    src="https://res.cloudinary.com/duimhtfij/image/upload/f_auto,q_auto/FlexExams_nkmt1k"
    alt="Logo"
    width={90}
    height={90}
    style={{ display: "block", objectFit: "contain", ...style }}
  />
));

const PRIMARY_TABS = [
  { p: "home",       ic: "home",   lb: "Home" },
  { p: "exams",      ic: "book",   lb: "Exams" },
  { p: "topics",     ic: "fire",   lb: "Topics" },
  { p: "categories", ic: "globe",  lb: "Vendors" },
  { p: "more",       ic: "grid",   lb: "More" },
];

const MORE_ITEMS = [
  { p: "about",      ic: "info",   lb: "About" },
  { p: "contact",    ic: "send",   lb: "Contact" },
  { p: "favorites",  ic: "heart",  lb: "Favorites" },
  { p: "my-exams",   ic: "myexams",lb: "My Exams" },
];

const DESKTOP_MAIN_LINKS = [
  { p: "home",       ic: "home",   lb: "Home" },
  { p: "exams",      ic: "book",   lb: "Exams" },
  { p: "topics",     ic: "fire",   lb: "Topics" },
  { p: "categories", ic: "globe",  lb: "Vendors" },
];

const DESKTOP_DROPDOWN_ITEMS = [
  { p: "about",      ic: "info",   lb: "About" },
  { p: "contact",    ic: "send",   lb: "Contact" },
];

const NavBar = React.memo(function NavBar({ page, setPage, showToast }) {
  const { user, profile, isAdmin, isLoading, logout, refreshProfile } = useAuth();
  const [refreshing, setRefreshing]   = useState(false);
  const [scrolled, setScrolled]       = useState(false);
  const [moreOpen, setMoreOpen]       = useState(false);
  const [pricingOpen, setPricingOpen] = useState(false);
  const [bellOpen, setBellOpen]       = useState(false);
  const [infoDropdownOpen, setInfoDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notifsLoaded, setNotifsLoaded]   = useState(false);
  
  const moreRef    = useRef(null);
  const pricingRef = useRef(null);
  const bellRef    = useRef(null);
  const infoDropdownRef = useRef(null);
  const mobileMenuRef = useRef(null);

  // Detect mobile viewport
  useEffect(() => {
<<<<<<< HEAD
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (!user) { setNotifications([]); setNotifsLoaded(false); return; }
    const q = query(
      collection(db, "notifications"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc"),
      fbLimit(20)
    );
    const unsub = onSnapshot(q, snap => {
      setNotifications(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setNotifsLoaded(true);
    }, () => { setNotifsLoaded(true); });
    return () => unsub();
  }, [user?.uid]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markAllRead = async () => {
    const unread = notifications.filter(n => !n.isRead);
    await Promise.all(unread.map(n => updateDoc(doc(db, "notifications", n.id), { isRead: true }).catch(() => {})));
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const markOneRead = async (id) => {
    await updateDoc(doc(db, "notifications", id), { isRead: true }).catch(() => {});
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const NOTIF_ICONS = {
    payment_success: "✅", instapay_approved: "✅", instapay_rejected: "❌",
    refund_approved: "↩️", refund_rejected: "❌", refund_update: "📋",
    transaction_cancelled: "🚫", subscription_cancelled: "🚫",
    leaderboard_reward: "🏆", admin_message: "📣", referral_reward: "🎁",
    certificate: "🏆", default: "🔔",
  };

  useEffect(() => {
=======
>>>>>>> ef1bec4ecf58728841e3d701049dd7c1f52c5003
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

  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") setMoreOpen(false); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (!moreOpen) return;
    const handler = (e) => {
      if (moreRef.current && !moreRef.current.contains(e.target)) setMoreOpen(false);
    };
<<<<<<< HEAD
    const id = setTimeout(() => document.addEventListener("pointerdown", handler), 0);
    return () => { clearTimeout(id); document.removeEventListener("pointerdown", handler); };
=======
    // استخدم setTimeout مع cleanup لتجنب تسرب الـ event listener
    const id = setTimeout(() => document.addEventListener("pointerdown", handler), 0);
    return () => {
      clearTimeout(id);
      document.removeEventListener("pointerdown", handler);
    };
>>>>>>> ef1bec4ecf58728841e3d701049dd7c1f52c5003
  }, [moreOpen]);

  useEffect(() => {
    if (!pricingOpen) return;
    const handler = (e) => {
      if (pricingRef.current && !pricingRef.current.contains(e.target)) setPricingOpen(false);
    };
    const id = setTimeout(() => document.addEventListener("pointerdown", handler), 0);
    return () => { clearTimeout(id); document.removeEventListener("pointerdown", handler); };
  }, [pricingOpen]);

  useEffect(() => {
    if (!bellOpen) return;
    const handler = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) setBellOpen(false);
    };
    const id = setTimeout(() => document.addEventListener("pointerdown", handler), 0);
    return () => { clearTimeout(id); document.removeEventListener("pointerdown", handler); };
  }, [bellOpen]);

  useEffect(() => {
    if (!infoDropdownOpen) return;
    const handler = (e) => {
      if (infoDropdownRef.current && !infoDropdownRef.current.contains(e.target)) setInfoDropdownOpen(false);
    };
    const id = setTimeout(() => document.addEventListener("pointerdown", handler), 0);
    return () => { clearTimeout(id); document.removeEventListener("pointerdown", handler); };
  }, [infoDropdownOpen]);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const handler = (e) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target)) setMobileMenuOpen(false);
    };
    const id = setTimeout(() => document.addEventListener("pointerdown", handler), 0);
    return () => { clearTimeout(id); document.removeEventListener("pointerdown", handler); };
  }, [mobileMenuOpen]);

  const nav = (p) => {
    setPage(p);
    setMoreOpen(false);
    setInfoDropdownOpen(false);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goToAuth = (mode = "login") => {
    // تأكد من أن setPage يقبل وسيطين (اسم الصفحة وكائن الخيارات) ، إذا لم يفعل فمرر فقط "auth"
    setPage("auth", { mode });
    window.scrollTo({ top: 0, behavior: "smooth" });
    setMobileMenuOpen(false);
  };

  const handleLogout = async () => {
    await logout(); // انتظر اكتمال تسجيل الخروج
    setPage("home");
    showToast({ msg: "Signed out successfully. See you soon!", type: "info" });
    setMobileMenuOpen(false);
  };

  const handleRefreshRole = async () => {
    setRefreshing(true);
    const p = await refreshProfile();
    setRefreshing(false);
    showToast({
      msg: p?.role === "admin" ? "✅ Admin access granted" : "Profile synced",
      type: p?.role === "admin" ? "success" : "info",
    });
    setMobileMenuOpen(false);
  };

<<<<<<< HEAD
  const handleNotificationClick = async (notificationId) => {
    await markOneRead(notificationId);
    setBellOpen(false);
    sessionStorage.setItem("dashboardTab", "notifications");
    nav("dashboard");
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent("dashboard:tab", { detail: "notifications" }));
    }, 100);
  };
=======
  // استخدم الحرف الأول بعد إزالة الفراغات الزائدة
  const displayName = (profile?.name || user?.displayName || "U").trim();
  const firstChar = displayName[0] || "U";
>>>>>>> ef1bec4ecf58728841e3d701049dd7c1f52c5003

  const displayName = (profile?.name || user?.displayName || "U").trim();
  const firstChar = displayName[0] || "U";
  const morePages = MORE_ITEMS.map((m) => m.p);
  const activeTab = morePages.includes(page) ? "more" : page;

  const iconBtn = (extraActive = false, activeColors = {}) => ({
    width: 44, height: 44, borderRadius: 14,
    border: `1.5px solid ${extraActive ? (activeColors.border || "var(--border)") : "var(--border)"}`,
    background: extraActive ? (activeColors.bg || "var(--bg3)") : "var(--bg3)",
    color: extraActive ? (activeColors.color || "var(--text3)") : "var(--text3)",
    cursor: "pointer", display: "flex", alignItems: "center",
    justifyContent: "center", flexShrink: 0, transition: "all 0.2s",
  });

  const renderNotifBadge = (count, size = "small") => {
    if (count === 0) return null;
    const display = count > 99 ? "99+" : count;
    const badgeStyle = size === "small" ? {
      position: "absolute", top: 2, right: 2, minWidth: 16, height: 16,
      borderRadius: 20, background: "#ef4444", color: "#fff",
      fontSize: 9, fontWeight: 800, display: "flex", alignItems: "center",
      justifyContent: "center", padding: "0 4px", border: "1.5px solid var(--bg2)",
      lineHeight: 1, letterSpacing: "-0.01em",
    } : {
      marginLeft: 8, background: "rgba(239,68,68,0.15)", color: "#ef4444",
      padding: "2px 8px", borderRadius: 30, fontSize: 12, fontWeight: 700,
    };
    return <span style={badgeStyle}>{display}</span>;
  };

  // Mobile dropdown menu items
  const renderMobileMenu = () => (
    <div ref={mobileMenuRef} style={{ position: "relative" }}>
      <button
        onClick={() => setMobileMenuOpen(prev => !prev)}
        style={{
          width: 44, height: 44, borderRadius: 14,
          border: "1.5px solid var(--border)",
          background: mobileMenuOpen ? "var(--accent-soft)" : "var(--bg3)",
          color: mobileMenuOpen ? "var(--accent)" : "var(--text3)",
          cursor: "pointer", display: "flex", alignItems: "center",
          justifyContent: "center", flexShrink: 0, transition: "all 0.2s",
          position: "relative",
        }}
      >
        <NI n="menu" s={20} />
        {unreadCount > 0 && renderNotifBadge(unreadCount, "small")}
      </button>
      {mobileMenuOpen && (
        <div style={{
          position: "absolute", top: "calc(100% + 8px)", right: 0,
          width: 260, maxHeight: "calc(100vh - 80px)", overflowY: "auto",
          background: "var(--bg2)", border: "1.5px solid var(--border)",
          borderRadius: 18, boxShadow: "0 16px 48px rgba(0,0,0,0.22)",
          zIndex: 2000, animation: "fadeIn 0.15s ease",
        }}>
          <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", fontWeight: 700, fontSize: 14, color: "var(--text)" }}>
            Menu
          </div>
          <div style={{ padding: "8px 0" }}>
            {!user ? (
              <>
                <MenuItem icon="login" label="Sign In" onClick={() => goToAuth("login")} />
                <MenuItem icon="sparkles" label="Sign Up" onClick={() => goToAuth("register")} highlight />
                <MenuItem icon="diamond" label="Go Pro" onClick={() => nav("pricing")} />
              </>
            ) : (
              <>
                <MenuItem icon="user" label="Dashboard" onClick={() => nav("dashboard")} />
                <MenuItem icon="bell" label="Notifications" onClick={() => {
                  setMobileMenuOpen(false);
                  sessionStorage.setItem("dashboardTab", "notifications");
                  nav("dashboard");
                  setTimeout(() => window.dispatchEvent(new CustomEvent("dashboard:tab", { detail: "notifications" })), 100);
                }} badge={unreadCount > 0 ? unreadCount : null} />
                <MenuItem icon="heart" label="Favorites" onClick={() => nav("favorites")} />
                <MenuItem icon="myexams" label="My Exams" onClick={() => nav("my-exams")} />
                <MenuItem icon="diamond" label="Upgrade Plan" onClick={() => nav("pricing")} />
                {!isAdmin && <MenuItem icon="refresh" label="Sync Permissions" onClick={handleRefreshRole} loading={refreshing} />}
                {isAdmin && <MenuItem icon="settings" label="Admin Panel" onClick={() => nav("admin")} highlight />}
                <div style={{ height: 1, background: "var(--border)", margin: "8px 12px" }} />
                <MenuItem icon="logout" label="Sign Out" onClick={handleLogout} danger />
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );

  const MenuItem = ({ icon, label, onClick, badge, highlight, danger, loading }) => (
    <button
      onClick={onClick}
      disabled={loading}
      style={{
        display: "flex", alignItems: "center", gap: 14, width: "100%",
        padding: "12px 16px", border: "none", background: "transparent",
        color: danger ? "var(--red)" : (highlight ? "var(--accent)" : "var(--text)"),
        fontSize: 14, fontWeight: highlight ? 700 : 500,
        cursor: "pointer", transition: "background 0.15s", fontFamily: "inherit",
      }}
      onMouseEnter={e => e.currentTarget.style.background = "var(--bg3)"}
      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
    >
      <span style={{ width: 24, display: "flex", justifyContent: "center" }}>
        {loading ? <Spinner size={16} color="var(--accent)" /> : <NI n={icon} s={18} />}
      </span>
      <span style={{ flex: 1, textAlign: "left" }}>{label}</span>
      {badge && <span style={{ background: "#ef4444", color: "#fff", fontSize: 10, fontWeight: 800, padding: "2px 6px", borderRadius: 20 }}>{badge}</span>}
    </button>
  );

  return (
    <>
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
        {/* Logo */}
        <div
          onClick={() => nav("home")}
          style={{ display: "flex", alignItems: "center", gap: 0, cursor: "pointer",
            flexShrink: 0, userSelect: "none", transition: "none",
            overflow: "visible", marginRight: "12px" }}
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

        {/* Desktop nav links (unchanged) */}
        {!isMobile && (
          <div className="desktop-links" style={{
            display: "flex", gap: 4, alignItems: "center",
            flex: "1 1 auto", justifyContent: "center",
            flexWrap: "wrap", overflow: "visible", minWidth: 0,
          }}>
            {DESKTOP_MAIN_LINKS.map(({ p, ic, lb }) => {
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
            <div ref={infoDropdownRef} style={{ position: "relative", overflow: "visible" }}>
              <button
                onClick={() => setInfoDropdownOpen(prev => !prev)}
                style={{
                  padding: "8px 12px", borderRadius: 50,
                  border: "none",
                  background: infoDropdownOpen ? "rgba(139,92,246,0.1)" : "transparent",
                  color: infoDropdownOpen ? "var(--accent)" : "var(--text2)",
                  fontSize: 13, fontWeight: 600, cursor: "pointer",
                  display: "inline-flex", alignItems: "center", gap: 6,
                  fontFamily: "inherit", transition: "all 0.2s",
                  whiteSpace: "nowrap", minHeight: 40, flexShrink: 0,
                }}
                onMouseEnter={e => { if (!infoDropdownOpen) { e.currentTarget.style.background = "rgba(139,92,246,0.1)"; e.currentTarget.style.color = "var(--accent)"; } }}
                onMouseLeave={e => { if (!infoDropdownOpen) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text2)"; } }}
              >
                <NI n="info" s={14} /><span>Info</span><NI n="chevronDown" s={12} />
              </button>
              {infoDropdownOpen && (
                <div style={{
                  position: "absolute", top: "calc(100% + 6px)", left: 0,
                  minWidth: 180, background: "var(--bg2)", border: "1px solid var(--border)",
                  borderRadius: 16, boxShadow: "0 12px 32px rgba(0,0,0,0.12)",
                  zIndex: 1100, padding: "6px 0", backdropFilter: "var(--nav-blur)",
                }}>
                  {DESKTOP_DROPDOWN_ITEMS.map(({ p, ic, lb }) => (
                    <button
                      key={p}
                      onClick={() => nav(p)}
                      style={{
                        display: "flex", alignItems: "center", gap: 12, width: "100%",
                        padding: "10px 16px", border: "none", background: "transparent",
                        color: page === p ? "var(--accent)" : "var(--text)",
                        fontSize: 13, fontWeight: page === p ? 600 : 500,
                        cursor: "pointer", transition: "background 0.15s", fontFamily: "inherit",
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = "var(--bg3)"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                    >
                      <NI n={ic} s={14} /><span>{lb}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {user && (
              <>
                <button
                  onClick={() => nav("my-exams")}
                  style={{
                    padding: "8px 14px", borderRadius: 12,
                    border: "1.5px solid var(--border)", background: "var(--bg3)",
                    color: "var(--text2)", fontSize: 12, fontWeight: 600,
                    cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
                    transition: "all 0.2s", whiteSpace: "nowrap", flexShrink: 0,
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
                      transition: "all 0.2s", whiteSpace: "nowrap", flexShrink: 0,
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = "rgba(245,158,11,0.2)"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "rgba(245,158,11,0.12)"; }}
                    className="hide-mobile"
                  >
                    <NI n="settings" s={13} /> Admin
                  </button>
                )}
              </>
            )}
          </div>
        )}

        {/* Right side actions */}
        <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0, marginLeft: 8 }}>
          {!isMobile ? (
            // Desktop: keep original buttons
            <>
              <button
                className="desktop-only"
                onClick={() => nav("favorites")}
                title="My Favorites"
                style={{ ...iconBtn(page === "favorites", { border: "rgba(248,113,113,0.5)", bg: "rgba(248,113,113,0.12)", color: "#f87171" }) }}
                onMouseEnter={e => { if (page !== "favorites") { e.currentTarget.style.background = "rgba(248,113,113,0.15)"; e.currentTarget.style.borderColor = "rgba(248,113,113,0.5)"; e.currentTarget.style.color = "#f87171"; } }}
                onMouseLeave={e => { if (page !== "favorites") { e.currentTarget.style.background = "var(--bg3)"; e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text3)"; } }}
              ><NI n="heart" s={16} /></button>

              {user && (
                <div ref={bellRef} style={{ position: "relative" }}>
                  <button
                    onClick={() => { setBellOpen(v => !v); if (!bellOpen && unreadCount > 0) markAllRead(); }}
                    title="Notifications"
                    style={{
                      ...iconBtn(bellOpen || unreadCount > 0, {
                        border: unreadCount > 0 ? "rgba(99,102,241,0.5)" : "var(--border)",
                        bg:     unreadCount > 0 ? "rgba(99,102,241,0.1)" : "var(--bg3)",
                        color:  unreadCount > 0 ? "var(--accent)" : "var(--text3)",
                      }),
                      position: "relative",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.color = "var(--accent)"; e.currentTarget.style.background = "var(--accent-soft)"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = unreadCount > 0 ? "rgba(99,102,241,0.5)" : "var(--border)"; e.currentTarget.style.color = unreadCount > 0 ? "var(--accent)" : "var(--text3)"; e.currentTarget.style.background = unreadCount > 0 ? "rgba(99,102,241,0.1)" : "var(--bg3)"; }}
                  >
                    <NI n="bell" s={16} />
                    {renderNotifBadge(unreadCount, "small")}
                  </button>
                  {bellOpen && (
                    <div style={{
                      position: "absolute", top: "calc(100% + 8px)", right: 0,
                      width: 340, maxHeight: 440, overflowY: "auto",
                      background: "var(--bg2)", border: "1.5px solid var(--border)",
                      borderRadius: 18, boxShadow: "0 16px 48px rgba(0,0,0,0.22)",
                      zIndex: 2000, animation: "fadeIn 0.15s ease",
                    }}>
                      <div style={{ padding: "16px 18px 10px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontWeight: 900, fontSize: 14, color: "var(--text)" }}>Notifications</span>
                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                          {unreadCount > 0 && <button onClick={markAllRead} style={{ fontSize: 11, color: "var(--accent)", fontWeight: 700, background: "none", border: "none", cursor: "pointer", padding: "2px 6px" }}>Mark all read</button>}
                          <button onClick={() => { setBellOpen(false); nav("dashboard"); sessionStorage.setItem("dashboardTab", "notifications"); setTimeout(() => window.dispatchEvent(new CustomEvent("dashboard:tab", { detail: "notifications" })), 100); }} style={{ fontSize: 11, color: "var(--text3)", fontWeight: 600, background: "none", border: "none", cursor: "pointer", padding: "2px 6px" }}>See all →</button>
                        </div>
                      </div>
                      {notifications.length === 0 ? (
                        <div style={{ padding: "32px 20px", textAlign: "center", color: "var(--text3)" }}>
                          <div style={{ fontSize: 28, marginBottom: 8 }}>🔔</div>
                          <div style={{ fontSize: 13, fontWeight: 600 }}>No notifications yet</div>
                        </div>
                      ) : notifications.slice(0, 10).map(n => {
                        const NOTIF_COLORS = {
                          payment_success: "#10b981", instapay_approved: "#10b981", instapay_rejected: "#ef4444",
                          refund_approved: "#818cf8", refund_rejected: "#ef4444", refund_update: "#d97706",
                          transaction_cancelled: "#6b7280", subscription_cancelled: "#ef4444",
                          leaderboard_reward: "#d97706", admin_message: "#6366f1",
                          referral_reward: "#10b981", certificate: "#d97706", default: "var(--accent)",
                        };
                        const nColor = NOTIF_COLORS[n.type] || NOTIF_COLORS.default;
                        return (
                          <div key={n.id} onClick={() => handleNotificationClick(n.id)} style={{ display: "flex", gap: 10, padding: "12px 16px", borderBottom: "1px solid var(--border)", cursor: "pointer", opacity: n.isRead ? 0.65 : 1, background: n.isRead ? "transparent" : `${nColor}08`, transition: "background 0.15s" }} onMouseEnter={e => e.currentTarget.style.background = `${nColor}12`} onMouseLeave={e => e.currentTarget.style.background = n.isRead ? "transparent" : `${nColor}08`}>
                            <div style={{ width: 34, height: 34, borderRadius: 10, background: n.isRead ? "var(--bg3)" : `${nColor}18`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, flexShrink: 0, border: `1px solid ${nColor}22` }}>{NOTIF_ICONS[n.type] || NOTIF_ICONS.default}</div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontWeight: n.isRead ? 600 : 800, fontSize: 12, color: "var(--text)", marginBottom: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{n.title}</div>
                              <div style={{ fontSize: 11, color: "var(--text2)", lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{n.body}</div>
                              <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 3 }}>
                                {n.data?.examTitle && <span style={{ fontSize: 9, fontWeight: 700, padding: "1px 6px", borderRadius: 99, background: "rgba(6,182,212,0.1)", color: "#0891b2" }}>📋 {n.data.examTitle.slice(0,18)}</span>}
                                {n.data?.planId && <span style={{ fontSize: 9, fontWeight: 700, padding: "1px 6px", borderRadius: 99, background: "rgba(99,102,241,0.1)", color: "var(--accent)" }}>✨ {n.data.planId}</span>}
                                {n.data?.amount && <span style={{ fontSize: 9, fontWeight: 700, padding: "1px 6px", borderRadius: 99, background: "rgba(16,185,129,0.1)", color: "#10b981" }}>${Number(n.data.amount).toFixed(2)}</span>}
                              </div>
                              <div style={{ fontSize: 10, color: "var(--text3)", marginTop: 3 }}>{n.createdAt?.toDate ? n.createdAt.toDate().toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : ""}</div>
                            </div>
                            {!n.isRead && <div style={{ width: 7, height: 7, borderRadius: "50%", background: nColor, flexShrink: 0, marginTop: 4 }} />}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {!user ? (
                <button
                  onClick={() => nav("pricing")}
                  title="Unlock full potential"
                  style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "0 16px", height: 40, borderRadius: 40,
                    border: "none",
                    background: "linear-gradient(135deg, #6366f1, #a855f7)",
                    color: "#fff",
                    fontWeight: 700, fontSize: 13, letterSpacing: "0.01em",
                    cursor: "pointer", flexShrink: 0,
                    transition: "opacity 0.2s ease, box-shadow 0.2s ease",
                    fontFamily: "inherit",
                    boxShadow: "0 2px 6px rgba(139, 92, 246, 0.3)",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.opacity = "0.9"; e.currentTarget.style.boxShadow = "0 4px 12px rgba(139, 92, 246, 0.4)"; }}
                  onMouseLeave={e => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.boxShadow = "0 2px 6px rgba(139, 92, 246, 0.3)"; }}
                >
                  <NI n="sparkles" s={14} />
                  <span className="hide-small" style={{ fontWeight: 800 }}>Go Pro</span>
                  <span className="auth-label-short" style={{ fontWeight: 800 }}>Pro</span>
                </button>
              ) : (
                <button
                  onClick={() => nav("pricing")}
                  title="Upgrade plan"
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "0 14px", height: 38, borderRadius: 38,
                    border: "1.5px solid rgba(168,85,247,0.5)",
                    background: "rgba(168,85,247,0.08)",
                    color: "#a855f7",
                    fontWeight: 700, fontSize: 12.5,
                    cursor: "pointer", flexShrink: 0,
                    transition: "all 0.2s ease",
                    fontFamily: "inherit",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = "rgba(168,85,247,0.18)"; e.currentTarget.style.borderColor = "rgba(168,85,247,0.8)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "rgba(168,85,247,0.08)"; e.currentTarget.style.borderColor = "rgba(168,85,247,0.5)"; }}
                >
                  <NI n="diamond" s={13} />
                  <span className="hide-small" style={{ fontWeight: 700 }}>Upgrade</span>
                  <span className="auth-label-short" style={{ fontWeight: 700 }}>💎</span>
                </button>
              )}

<<<<<<< HEAD
              <ThemeToggle />
=======
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
>>>>>>> ef1bec4ecf58728841e3d701049dd7c1f52c5003

              {isLoading ? (
                <div style={{ width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Spinner size={22} color="var(--accent)" />
                </div>
              ) : user ? (
                <>
                  {!isAdmin && (
                    <button
                      className="desktop-only"
                      onClick={handleRefreshRole}
                      disabled={refreshing}
                      title="Sync permissions"
                      style={iconBtn()}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.color = "var(--accent)"; e.currentTarget.style.background = "var(--accent-soft)"; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text3)"; e.currentTarget.style.background = "var(--bg3)"; }}
                    >
                      {refreshing ? <Spinner size={15} color="var(--accent)" /> : <NI n="refresh" s={16} />}
                    </button>
                  )}
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
                    onMouseEnter={e => { e.currentTarget.style.background = isAdmin ? "rgba(245,158,11,0.15)" : "var(--accent-soft)"; e.currentTarget.style.borderColor = "var(--accent)"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = isAdmin ? "rgba(245,158,11,0.08)" : "var(--bg3)"; e.currentTarget.style.borderColor = isAdmin ? "rgba(245,158,11,0.4)" : "var(--border)"; }}
                  >
                    <div style={{ width: 32, height: 32, borderRadius: "50%", fontSize: 13, fontWeight: 800, color: "#fff", background: isAdmin ? "linear-gradient(135deg,#F59E0B,#D97706)" : "var(--gradient-accent)", display: "flex", alignItems: "center", justifyContent: "center" }}>{firstChar}</div>
                    <span className="hide-small" style={{ fontSize: 13 }}>Account</span>
                  </button>
                  <button
                    onClick={handleLogout}
                    title="Sign out"
                    style={iconBtn()}
                    onMouseEnter={e => { e.currentTarget.style.background = "rgba(239,68,68,0.12)"; e.currentTarget.style.borderColor = "rgba(239,68,68,0.4)"; e.currentTarget.style.color = "var(--red)"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "var(--bg3)"; e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text3)"; }}
                  ><NI n="logout" s={16} /></button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => goToAuth("login")}
                    className="auth-signin-btn"
                    style={{
                      height: 36, padding: "0 16px", borderRadius: 20,
                      border: "1.5px solid var(--border)",
                      background: "var(--bg3)", color: "var(--text2)",
                      fontSize: 13, fontWeight: 600, cursor: "pointer",
                      whiteSpace: "nowrap", flexShrink: 0, transition: "all 0.2s",
                      display: "flex", alignItems: "center", gap: 6, fontFamily: "inherit",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.color = "var(--accent)"; e.currentTarget.style.background = "var(--accent-soft)"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text2)"; e.currentTarget.style.background = "var(--bg3)"; }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
                    <span className="auth-label-full">Sign In</span>
                    <span className="auth-label-short">In</span>
                  </button>
                  <button
                    onClick={() => goToAuth("register")}
                    className="auth-signup-btn"
                    style={{
                      height: 36, padding: "0 16px", borderRadius: 20, border: "none",
                      background: "linear-gradient(135deg,#6366f1,#a855f7)", color: "#fff",
                      fontSize: 13, fontWeight: 700, cursor: "pointer",
                      display: "flex", alignItems: "center", gap: 6,
                      boxShadow: "0 2px 6px rgba(139,92,246,0.35)",
                      whiteSpace: "nowrap", flexShrink: 0, transition: "all 0.2s",
                      fontFamily: "inherit",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.opacity = "0.9"; e.currentTarget.style.boxShadow = "0 4px 12px rgba(139,92,246,0.5)"; }}
                    onMouseLeave={e => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.boxShadow = "0 2px 6px rgba(139,92,246,0.35)"; }}
                  >
                    <NI n="sparkles" s={13} />
                    <span className="auth-label-full">Sign Up</span>
                    <span className="auth-label-short">Up</span>
                  </button>
                </>
              )}
            </>
          ) : (
            // Mobile: show theme toggle + menu dropdown
            <>
              <ThemeToggle />
              {renderMobileMenu()}
            </>
          )}
        </div>
      </nav>

      {/* Bottom Tab Bar (mobile) - unchanged */}
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
                minWidth: 0, flexShrink: 1, overflow: "hidden",
              }}
            >
              {isActive && (
                <span style={{
                  position: "absolute", top: 0, left: "50%",
                  transform: "translateX(-50%)",
                  width: 28, height: 3, borderRadius: "0 0 4px 4px",
                  background: "var(--accent)",
                }} />
              )}
              <span style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                width: 36, height: 28, borderRadius: 10,
                background: isActive ? "var(--accent-soft)" : "transparent",
                transition: "background 0.2s",
              }}>
                <NI n={ic} s={20} />
              </span>
              <span style={{
                fontSize: 10, fontWeight: 600, letterSpacing: "0.02em", lineHeight: 1,
                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                maxWidth: "100%", padding: "0 2px",
              }}>
                {lb}
              </span>
            </button>
          );
        })}
      </div>

      {/* More bottom sheet - unchanged */}
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
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
          <div style={{ width: 40, height: 4, borderRadius: 4, background: "var(--border2)" }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px 12px" }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>More</span>
          <button onClick={() => setMoreOpen(false)} style={{ width: 32, height: 32, borderRadius: 10, border: "1px solid var(--border)", background: "var(--bg3)", color: "var(--text3)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><NI n="x" s={15} /></button>
        </div>
        <div style={{ padding: "0 12px", display: "flex", flexDirection: "column", gap: 2 }}>
          {user && (
            <button onClick={() => { nav("dashboard"); sessionStorage.setItem("dashboardTab", "notifications"); setTimeout(() => window.dispatchEvent(new CustomEvent("dashboard:tab", { detail: "notifications" })), 100); }} style={{ display: "flex", alignItems: "center", gap: 14, padding: "13px 12px", borderRadius: 14, border: "none", background: page === "dashboard" ? "var(--accent-soft)" : "transparent", color: page === "dashboard" ? "var(--accent)" : "var(--text)", fontSize: 15, fontWeight: page === "dashboard" ? 700 : 500, cursor: "pointer", textAlign: "left", fontFamily: "inherit", transition: "background 0.15s", WebkitTapHighlightColor: "transparent" }}>
              <span style={{ width: 40, height: 40, borderRadius: 12, flexShrink: 0, position: "relative", background: unreadCount > 0 ? "rgba(99,102,241,0.1)" : "var(--bg3)", border: `1px solid ${unreadCount > 0 ? "rgba(99,102,241,0.25)" : "var(--border)"}`, display: "flex", alignItems: "center", justifyContent: "center", color: unreadCount > 0 ? "var(--accent)" : "var(--text3)" }}>
                <NI n="bell" s={18} />
                {renderNotifBadge(unreadCount, "small")}
              </span>
              <span style={{ flex: 1 }}>Notifications</span>
              {unreadCount > 0 && <span style={{ fontSize: 11, fontWeight: 700, color: "var(--accent)", background: "rgba(99,102,241,0.1)", padding: "2px 8px", borderRadius: 99 }}>{unreadCount} new</span>}
            </button>
          )}
          {MORE_ITEMS.map(({ p, ic, lb }) => {
            const isActive = page === p;
            return (
              <button key={p} onClick={() => nav(p)} style={{ display: "flex", alignItems: "center", gap: 14, padding: "13px 12px", borderRadius: 14, border: "none", background: isActive ? "var(--accent-soft)" : "transparent", color: isActive ? "var(--accent)" : "var(--text)", fontSize: 15, fontWeight: isActive ? 700 : 500, cursor: "pointer", textAlign: "left", fontFamily: "inherit", transition: "background 0.15s", WebkitTapHighlightColor: "transparent" }} onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "var(--bg3)"; }} onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}>
                <span style={{ width: 40, height: 40, borderRadius: 12, flexShrink: 0, background: isActive ? "rgba(139,92,246,0.15)" : "var(--bg3)", border: `1px solid ${isActive ? "rgba(139,92,246,0.25)" : "var(--border)"}`, display: "flex", alignItems: "center", justifyContent: "center", color: isActive ? "var(--accent)" : "var(--text3)", transition: "all 0.15s" }}><NI n={ic} s={18} /></span>
                <span style={{ flex: 1 }}>{lb}</span>
                <NI n="chevronRight" s={16} />
              </button>
            );
          })}
          {isAdmin && (
            <button onClick={() => nav("admin")} style={{ display: "flex", alignItems: "center", gap: 14, padding: "13px 12px", borderRadius: 14, border: "none", background: page === "admin" ? "rgba(245,158,11,0.12)" : "transparent", color: page === "admin" ? "var(--gold)" : "var(--text)", fontSize: 15, fontWeight: page === "admin" ? 700 : 500, cursor: "pointer", textAlign: "left", fontFamily: "inherit", transition: "background 0.15s" }}>
              <span style={{ width: 40, height: 40, borderRadius: 12, flexShrink: 0, background: page === "admin" ? "rgba(245,158,11,0.12)" : "var(--bg3)", border: `1px solid ${page === "admin" ? "rgba(245,158,11,0.3)" : "var(--border)"}`, display: "flex", alignItems: "center", justifyContent: "center", color: page === "admin" ? "var(--gold)" : "var(--text3)" }}><NI n="settings" s={18} /></span>
              <span style={{ flex: 1 }}>Admin Panel</span>
              <NI n="chevronRight" s={16} />
            </button>
          )}
          <div style={{ height: 1, background: "var(--border)", margin: "8px 0" }} />
          {user ? (
            <>
              {!isAdmin && (
                <button onClick={async () => { setMoreOpen(false); await handleRefreshRole(); }} disabled={refreshing} style={{ display: "flex", alignItems: "center", gap: 14, padding: "13px 12px", borderRadius: 14, border: "none", background: "transparent", color: "var(--text)", fontSize: 15, fontWeight: 500, cursor: "pointer", textAlign: "left", fontFamily: "inherit", transition: "background 0.15s" }} onMouseEnter={e => e.currentTarget.style.background = "var(--bg3)"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <span style={{ width: 40, height: 40, borderRadius: 12, background: "var(--bg3)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text3)", flexShrink: 0 }}>{refreshing ? <Spinner size={16} color="var(--accent)" /> : <NI n="refresh" s={18} />}</span>
                  <span>Sync Permissions</span>
                  <NI n="chevronRight" s={16} />
                </button>
              )}
              <button onClick={() => { setMoreOpen(false); handleLogout(); }} style={{ display: "flex", alignItems: "center", gap: 14, padding: "13px 12px", borderRadius: 14, border: "none", background: "transparent", color: "var(--red)", fontSize: 15, fontWeight: 500, cursor: "pointer", textAlign: "left", fontFamily: "inherit", transition: "background 0.15s" }} onMouseEnter={e => e.currentTarget.style.background = "rgba(239,68,68,0.08)"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                <span style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--red)", flexShrink: 0 }}><NI n="logout" s={18} /></span>
                <span>Sign Out</span>
              </button>
            </>
          ) : (
            <div style={{ display: "flex", gap: 10, padding: "4px 0" }}>
              <button onClick={() => { setMoreOpen(false); goToAuth("login"); }} style={{ flex: 1, padding: "12px", borderRadius: 14, border: "1.5px solid rgba(139,92,246,0.35)", background: "rgba(139,92,246,0.08)", color: "var(--accent)", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Sign In</button>
              <button onClick={() => { setMoreOpen(false); goToAuth("register"); }} style={{ flex: 1, padding: "12px", borderRadius: 14, border: "none", background: "linear-gradient(135deg,#6366f1,#a855f7)", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 2px 8px rgba(139,92,246,0.35)" }}>Sign Up</button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        :root { --navbar-height: 68px; }
        @media (min-width: 769px) { body { padding-top: var(--navbar-height) !important; } }
        .auth-label-full { display: inline; }
        .auth-label-short { display: none; }
<<<<<<< HEAD
        .desktop-only { display: none; }
        .bottom-tab-bar, .more-backdrop, .more-sheet { display: none; }
=======

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
>>>>>>> ef1bec4ecf58728841e3d701049dd7c1f52c5003
        @media (max-width: 768px) {
          :root { --navbar-height: 56px; }
          .desktop-links, .desktop-only, .hide-small { display: none !important; }
          .auth-signin-btn, .auth-signup-btn { height: 32px !important; padding: 0 10px !important; font-size: 12px !important; gap: 3px !important; }
          .auth-label-full { display: none !important; }
          .auth-label-short { display: inline !important; }
          .bottom-tab-bar {
            display: flex; position: fixed; bottom: 0; left: 0; right: 0; z-index: 1000;
            height: calc(60px + env(safe-area-inset-bottom, 0px)); padding-bottom: env(safe-area-inset-bottom, 0px);
            background: var(--bg2); border-top: 1px solid var(--border);
            backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
          }
          .more-backdrop { display: block; }
          .more-sheet { display: block; }
          body { padding-top: var(--navbar-height) !important; padding-bottom: calc(60px + env(safe-area-inset-bottom, 0px)) !important; }
        }
<<<<<<< HEAD
=======

        /* ── Desktop: إظهار كل حاجة خاصة بالـ desktop ── */
>>>>>>> ef1bec4ecf58728841e3d701049dd7c1f52c5003
        @media (min-width: 769px) {
          .desktop-links { display: flex !important; flex-wrap: wrap; justify-content: center; gap: 2px; }
          .desktop-only { display: flex !important; }
          .hide-small { display: inline-block !important; }
          .desktop-links button { padding: 6px 10px; font-size: 12px; }
        }
        @media (min-width: 1024px) {
          .desktop-links { gap: 4px; }
          .desktop-links button { padding: 8px 12px; font-size: 13px; }
        }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        select option { background: var(--bg2, #fff) !important; color: var(--text, #111) !important; }
      `}</style>
    </>
  );
});

<<<<<<< HEAD
export default NavBar;
=======
export default NavBar;
>>>>>>> ef1bec4ecf58728841e3d701049dd7c1f52c5003
