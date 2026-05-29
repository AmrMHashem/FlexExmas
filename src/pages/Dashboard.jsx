// Dashboard.jsx — v6.1 Notifications: dedup + full details + no double-mark
// Overview only: subscription, recent activity, leaderboard preview, notifications, referral stats
import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../hooks/useAuth";
import {
  getUserResults,
  updateUserProfile,
  getUserExamStats,
} from "../services/firestore";
import { getUserSubscription } from "../services/payment";
import { db } from "../firebase";
import {
  collection, query, where, orderBy, getDocs,
  doc, getDoc, updateDoc, limit as fbLimit,
} from "firebase/firestore";
import {
  Card, StatCard, Btn, Spinner,
  Empty, ProgressBar, Modal, Icon, Input,
} from "../components/UI";

export default function Dashboard({ setPage, setResultData, exams, showToast }) {
  const { user, profile, refreshProfile } = useAuth();
  const [results, setResults]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [editMode, setEditMode]     = useState(false);
  const [editForm, setEditForm]     = useState({ name: "", email: "" });
  const [tab, setTab]               = useState("overview");
  const [examStats, setExamStats]   = useState({});
  const [subscription, setSubscription] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [referralData, setReferralData]   = useState(null);
  const [leaderboardPreview, setLeaderboardPreview] = useState([]);

  // Check sessionStorage for initial tab (from NavBar notification click)
  useEffect(() => {
    const savedTab = sessionStorage.getItem("dashboardTab");
    if (savedTab && ["overview", "notifications", "topics"].includes(savedTab)) {
      setTab(savedTab);
      sessionStorage.removeItem("dashboardTab");
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    const loadAll = async () => {
      try {
        setLoading(true);

        const [userResults, sub] = await Promise.all([
          getUserResults(user.uid).catch(() => []),
          getUserSubscription(user.uid).catch(() => null),
        ]);

        const recentResults = userResults
          .slice(0, 30)
          .sort((a, b) => new Date(b.date) - new Date(a.date));

        if (!cancelled) {
          setResults(recentResults);
          setSubscription(sub);
          if (profile) setEditForm({ name: profile.name || "", email: user.email || "" });
        }

        // Parallel: stats + notifications + referral + leaderboard preview
        const [notifSnap, referralSnap, lbSnap, statsArr] = await Promise.all([
          getDocs(query(
            collection(db, "notifications"),
            where("userId", "==", user.uid),
            orderBy("createdAt", "desc"),
            fbLimit(10)
          )).catch(() => ({ docs: [] })),
          getDoc(doc(db, "referrals", user.uid)).catch(() => null),
          getDocs(query(
            collection(db, "leaderboard"),
            orderBy("points", "desc"),
            fbLimit(5)
          )).catch(() => ({ docs: [] })),
          Promise.all(
            [...new Set(userResults.map(r => r.examId))].slice(0, 10).map(examId =>
              getUserExamStats(user.uid, examId)
                .then(s => s ? { examId, stat: s } : null)
                .catch(() => null)
            )
          ),
        ]);

        if (!cancelled) {
          setNotifications(notifSnap.docs.map(d => ({ id: d.id, ...d.data() })));
          setReferralData(referralSnap?.exists?.() ? referralSnap.data() : null);
          setLeaderboardPreview(lbSnap.docs.map((d, i) => ({ id: d.id, rank: i + 1, ...d.data() })));
          const statsMap = {};
          statsArr.forEach(item => { if (item) statsMap[item.examId] = item.stat; });
          setExamStats(statsMap);
          setLoading(false);
        }
      } catch (err) {
        console.error("Dashboard load error:", err);
        if (!cancelled) setLoading(false);
      }
    };

    loadAll();
    return () => { cancelled = true; };
  }, [user?.uid]);

  // Listen for tab-switch events from NavBar notification clicks (fallback)
  useEffect(() => {
    const handler = (e) => { if (e.detail) setTab(e.detail); };
    window.addEventListener("dashboard:tab", handler);
    return () => window.removeEventListener("dashboard:tab", handler);
  }, []);

  const markReadInFlight = React.useRef(new Set());
  const markRead = async (id) => {
    if (markReadInFlight.current.has(id)) return; // منع الطلب المكرر
    markReadInFlight.current.add(id);
    try {
      await updateDoc(doc(db, "notifications", id), { isRead: true });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch { /* best-effort */ } finally {
      markReadInFlight.current.delete(id);
    }
  };

  const handleSaveProfile = async () => {
    try {
      await updateUserProfile(user.uid, { name: editForm.name });
      await refreshProfile();
      setEditMode(false);
      showToast({ msg: "✅ Profile updated successfully", type: "success" });
    } catch (err) {
      showToast({ msg: `Error: ${err.message}`, type: "error" });
    }
  };

  const displayName = profile?.name || user?.displayName || "User";
  const initial = displayName[0].toUpperCase();

  const { passed, failed, avg, totalTime, passRate, scoredResults, certificatesCount, domainStats } = useMemo(() => {
    const passed = results.filter(r => r.pass).length;
    const failed = results.length - passed;
    const scored = results.filter(r => typeof r.score === "number");
    const avg = scored.length ? Math.round(scored.reduce((s, r) => s + r.score, 0) / scored.length) : 0;
    const totalTime = results.reduce((s, r) => s + (r.timeTaken || 0), 0);
    const passRate = results.length ? Math.round((passed / results.length) * 100) : 0;
    const certCount = results.filter(r => r.pass && r.certificateId).length;
    const domain = {};
    results.forEach(r => {
      if (!r.domainResults) return;
      Object.entries(r.domainResults).forEach(([d, v]) => {
        if (!domain[d]) domain[d] = { correct: 0, total: 0 };
        domain[d].correct += v.correct || 0;
        domain[d].total   += v.total   || 0;
      });
    });
    return { passed, failed, avg, totalTime, passRate, scoredResults: scored, certificatesCount: certCount, domainStats: domain };
  }, [results]);

  const TABS = [
    { id: "overview",      label: "📊 Overview" },
    { id: "notifications", label: `🔔 Notifications${notifications.filter(n => !n.isRead).length > 0 ? ` (${notifications.filter(n => !n.isRead).length})` : ""}` },
    { id: "topics",        label: "📚 Topics" },
  ];

  const STATS = [
    { label: "Total Attempts", value: results.length,      icon: "📋", color: "var(--accent)" },
    { label: "Passed",         value: passed,              icon: "✅", color: "var(--green)" },
    { label: "Avg Score",      value: `${avg}%`,           icon: "📊", color: "var(--gold)" },
    { label: "Pass Rate",      value: `${passRate}%`,      icon: "🎯", color: passRate >= 70 ? "var(--green)" : "var(--red)" },
    { label: "Study Time",     value: `${Math.round(totalTime / 3600)}h`, icon: "⏱️", color: "var(--purple)" },
    { label: "Certificates",   value: certificatesCount,   icon: "🎓", color: "var(--cyan)" },
  ];

  if (!user) {
    return (
      <div style={{ textAlign: "center", padding: "140px 24px", minHeight: "60vh" }}>
        <div style={{ fontSize: 80, marginBottom: 28 }}>🔐</div>
        <h2 style={{ fontSize: 32, fontWeight: 800, marginBottom: 16 }}>Your Dashboard Awaits</h2>
        <p style={{ fontSize: 16, color: "var(--text2)", marginBottom: 36, maxWidth: 500, margin: "0 auto 36px" }}>
          Sign in to see your progress, certificates, and full exam history.
        </p>
        <Btn size="lg" onClick={() => setPage("auth")} style={{ justifyContent: "center" }}>
          <Icon n="user" size={18} /> Sign In to Continue
        </Btn>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1300, margin: "0 auto", padding: "48px clamp(20px,4vw,48px) 80px" }}>
      <style>{`
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
        @media(max-width:768px){
          .dash-profile{flex-direction:column!important;align-items:flex-start!important;padding:24px 20px!important}
          .dash-stats{grid-template-columns:repeat(2,1fr)!important}
          .dash-cards{grid-template-columns:1fr!important}
          .dash-tabs{overflow-x:auto!important;flex-wrap:nowrap!important;scrollbar-width:none}
          .dash-tabs::-webkit-scrollbar{display:none}
        }
      `}</style>

      {/* ── Profile Header ─────────────────────────────────────────── */}
      <div className="dash-profile" style={{ display: "flex", alignItems: "center", gap: 24, marginBottom: 32, flexWrap: "wrap", background: "linear-gradient(135deg,var(--bg2) 0%,var(--accent-soft,rgba(99,102,241,0.06)) 100%)", border: "1.5px solid rgba(99,102,241,0.2)", borderRadius: 24, padding: "32px 40px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -60, right: -60, width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle,rgba(99,102,241,0.12),transparent 70%)", pointerEvents: "none" }} />
        <div style={{ width: 80, height: 80, borderRadius: 20, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, fontWeight: 900, color: "#fff", flexShrink: 0, boxShadow: "0 12px 32px rgba(99,102,241,0.3)", position: "relative", zIndex: 1 }}>
          {initial}
        </div>
        <div style={{ flex: 1, position: "relative", zIndex: 1 }}>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: "var(--text)", marginBottom: 6 }}>Welcome back, {displayName}! 👋</h2>
          <p style={{ color: "var(--text3)", fontSize: 13, marginBottom: 12 }}>{user?.email}</p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <span style={{ padding: "4px 14px", borderRadius: 99, background: "rgba(99,102,241,0.1)", color: "var(--accent)", fontSize: 11, fontWeight: 700, border: "1px solid rgba(99,102,241,0.2)" }}>👨‍🎓 Student</span>
            {certificatesCount > 0 && <span style={{ padding: "4px 14px", borderRadius: 99, background: "rgba(217,119,6,0.1)", color: "#d97706", fontSize: 11, fontWeight: 700, border: "1px solid rgba(217,119,6,0.2)" }}>🏆 {certificatesCount} Certificate{certificatesCount > 1 ? "s" : ""}</span>}
            <span style={{ padding: "4px 14px", borderRadius: 99, background: "rgba(5,150,105,0.1)", color: "var(--green,#10b981)", fontSize: 11, fontWeight: 700, border: "1px solid rgba(5,150,105,0.2)" }}>✅ {passRate}% Pass Rate</span>
            {subscription?.isActive && (
              <span style={{ padding: "4px 14px", borderRadius: 99, background: "rgba(99,102,241,0.1)", color: "var(--accent)", fontSize: 11, fontWeight: 700, border: "1px solid rgba(99,102,241,0.2)" }}>
                ✨ {subscription.planId === "monthly" ? "Monthly" : "Yearly"} Plan
              </span>
            )}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, position: "relative", zIndex: 1, flexShrink: 0 }}>
          <Btn variant="ghost" onClick={() => setEditMode(true)}><Icon n="edit" size={14} /> Edit Profile</Btn>
        </div>
      </div>

      {/* ── Subscription Status ─────────────────────────────────────── */}
      {subscription && (
        <div style={{ marginBottom: 24, background: subscription.isActive ? "rgba(16,185,129,0.05)" : "rgba(239,68,68,0.05)", border: `1.5px solid ${subscription.isActive ? "rgba(16,185,129,0.25)" : "rgba(239,68,68,0.2)"}`, borderRadius: 18, padding: "18px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 800, color: subscription.isActive ? "var(--green,#10b981)" : "#ef4444", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>
              {subscription.isActive ? "✅ Active Subscription" : "❌ Subscription Expired"}
            </div>
            <div style={{ fontSize: 16, fontWeight: 900, color: "var(--text)", marginBottom: 2 }}>
              {subscription.planId === "monthly" ? "Monthly Plan" : subscription.planId === "yearly" ? "Yearly Plan" : subscription.planId}
            </div>
            <div style={{ fontSize: 12, color: "var(--text3)" }}>
              {subscription.isActive
                ? `Expires ${new Date(subscription.endDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`
                : `Expired ${new Date(subscription.endDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`}
            </div>
          </div>
          {!subscription.isActive && <Btn onClick={() => setPage("pricing")} style={{ whiteSpace: "nowrap" }}>Renew Plan →</Btn>}
        </div>
      )}

      {/* ── Quick Actions ──────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(150px,1fr))", gap: 10, marginBottom: 28 }}>
        {[
          { label: "📋 My Exams",     page: "my-exams",    color: "#6366f1", desc: "Progress & scores" },
          { label: "🏆 Leaderboard",  page: "leaderboard", color: "#f59e0b", desc: "See your rank" },
          { label: "🎁 Refer & Earn", page: "referral",    color: "#10b981", desc: "Get free exams" },
          { label: "💳 Billing",      page: "my-exams",   color: "#8b5cf6", desc: "Invoices & refunds", action: () => { window.dispatchEvent(new CustomEvent("myexams:tab", { detail: "billing" })); setPage("my-exams"); } },
          { label: "🔔 Notifications", page: "notifications", color: "#ec4899", desc: `${notifications.filter(n => !n.isRead).length} unread`, action: () => setTab("notifications") },
        ].map((btn, i) => (
          <button key={i}
            onClick={() => btn.action ? btn.action() : setPage(btn.page)}
            style={{ padding: "14px 16px", background: `${btn.color}10`, border: `1.5px solid ${btn.color}28`, borderRadius: 14, cursor: "pointer", textAlign: "left", fontFamily: "inherit", transition: "all 0.2s" }}
            onMouseEnter={e => { e.currentTarget.style.background = `${btn.color}20`; e.currentTarget.style.transform = "translateY(-2px)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = `${btn.color}10`; e.currentTarget.style.transform = ""; }}
          >
            <div style={{ fontSize: 13, fontWeight: 800, color: btn.color, marginBottom: 2 }}>{btn.label}</div>
            <div style={{ fontSize: 11, color: "var(--text3)" }}>{btn.desc}</div>
          </button>
        ))}
      </div>

      {/* ── Tabs ───────────────────────────────────────────────────── */}
      <div className="dash-tabs" style={{ display: "flex", gap: 4, marginBottom: 28, borderBottom: "2px solid var(--border)" }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ padding: "13px 20px", borderRadius: "12px 12px 0 0", border: "none", background: tab === t.id ? "var(--bg2)" : "transparent", borderBottom: tab === t.id ? "3px solid var(--accent)" : "3px solid transparent", color: tab === t.id ? "var(--accent)" : "var(--text2)", cursor: "pointer", fontWeight: 700, fontFamily: "inherit", fontSize: 13, transition: "all 0.2s", whiteSpace: "nowrap" }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Content ────────────────────────────────────────────────── */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 80 }}><Spinner size={44} color="var(--accent)" /></div>
      ) : tab === "overview" ? (
        <div>
          {/* Stats */}
          <div className="dash-stats" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 16, marginBottom: 28 }}>
            {STATS.map((s, i) => (
              <div key={i} style={{ background: "var(--bg2)", border: `1.5px solid ${s.color}22`, borderRadius: 18, padding: "20px 22px", display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: `${s.color}18`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>{s.icon}</div>
                <div>
                  <div style={{ fontSize: 24, fontWeight: 900, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: 11, color: "var(--text3)", fontWeight: 600, marginTop: 2 }}>{s.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Cards grid */}
          <div className="dash-cards" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(360px,1fr))", gap: 20 }}>

            {/* Recent Activity */}
            <Card>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <h3 style={{ fontWeight: 800, fontSize: 15, color: "var(--text)", display: "flex", alignItems: "center", gap: 7 }}><Icon n="history" size={16} /> Recent Activity</h3>
                <button onClick={() => setPage("my-exams")} style={{ background: "none", border: "none", fontSize: 11, color: "var(--accent)", fontWeight: 700, cursor: "pointer" }}>See all →</button>
              </div>
              {results.slice(0, 5).length === 0 ? (
                <p style={{ color: "var(--text3)", fontSize: 13 }}>No activity yet. Start an exam!</p>
              ) : results.slice(0, 5).map((r, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 0", borderBottom: i < 4 ? "1px solid var(--border)" : "none", gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: "var(--text)", marginBottom: 2 }}>{r.examTitle}</div>
                    <div style={{ fontSize: 11, color: "var(--text3)" }}>{r.date}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 99, background: r.pass ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)", color: r.pass ? "#10b981" : "#ef4444", fontWeight: 700 }}>{r.pass ? "PASS" : "FAIL"}</span>
                    <div style={{ fontWeight: 800, fontSize: 14, color: r.pass ? "var(--green,#10b981)" : "var(--red,#ef4444)" }}>{r.score}%</div>
                  </div>
                </div>
              ))}
            </Card>

            {/* Leaderboard Preview */}
            <Card>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <h3 style={{ fontWeight: 800, fontSize: 15, color: "var(--text)", display: "flex", alignItems: "center", gap: 7 }}>🏆 Leaderboard</h3>
                <button onClick={() => setPage("leaderboard")} style={{ background: "none", border: "none", fontSize: 11, color: "var(--accent)", fontWeight: 700, cursor: "pointer" }}>Full board →</button>
              </div>
              {leaderboardPreview.length === 0 ? (
                <p style={{ color: "var(--text3)", fontSize: 13 }}>Complete exams to earn points and appear here!</p>
              ) : leaderboardPreview.map((entry, i) => {
                const medals = ["🥇", "🥈", "🥉", "4️⃣", "5️⃣"];
                const isMe = entry.id === user?.uid;
                return (
                  <div key={entry.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderBottom: i < leaderboardPreview.length - 1 ? "1px solid var(--border)" : "none" }}>
                    <span style={{ fontSize: 18, width: 24, textAlign: "center" }}>{medals[i]}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: isMe ? 900 : 700, color: isMe ? "var(--accent)" : "var(--text)" }}>
                        {entry.name || "Anonymous"}{isMe && " (you)"}
                      </div>
                      {entry.country && <div style={{ fontSize: 10, color: "var(--text3)" }}>🌍 {entry.country}</div>}
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 900, color: "var(--accent)" }}>{(entry.points || 0).toLocaleString()} <span style={{ fontSize: 9, color: "var(--text3)", fontWeight: 600 }}>pts</span></div>
                  </div>
                );
              })}
            </Card>

            {/* Referral Stats */}
            <Card>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <h3 style={{ fontWeight: 800, fontSize: 15, color: "var(--text)", display: "flex", alignItems: "center", gap: 7 }}>🎁 Referral Stats</h3>
                <button onClick={() => setPage("referral")} style={{ background: "none", border: "none", fontSize: 11, color: "var(--accent)", fontWeight: 700, cursor: "pointer" }}>Manage →</button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {[
                  { label: "Friends Invited", value: referralData?.referredUsers?.length || 0, icon: "👥", color: "#6366f1" },
                  { label: "Coupons Earned", value: referralData?.earnedCoupons?.length || 0, icon: "🎟️", color: "#10b981" },
                ].map((s, i) => (
                  <div key={i} style={{ background: `${s.color}08`, border: `1.5px solid ${s.color}20`, borderRadius: 12, padding: "14px 16px", textAlign: "center" }}>
                    <div style={{ fontSize: 22, marginBottom: 4 }}>{s.icon}</div>
                    <div style={{ fontSize: 22, fontWeight: 900, color: s.color }}>{s.value}</div>
                    <div style={{ fontSize: 10, color: "var(--text3)", fontWeight: 600, marginTop: 2 }}>{s.label}</div>
                  </div>
                ))}
              </div>
              {referralData?.code && (
                <div style={{ marginTop: 12, padding: "10px 14px", background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.15)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                  <div>
                    <div style={{ fontSize: 10, color: "var(--text3)", fontWeight: 700, textTransform: "uppercase" }}>Your Code</div>
                    <code style={{ fontSize: 15, fontWeight: 900, color: "var(--accent)", letterSpacing: "0.1em" }}>{referralData.code}</code>
                  </div>
                  <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}?ref=${referralData.code}`); showToast({ msg: "🔗 Referral link copied!", type: "success" }); }} style={{ padding: "6px 12px", background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.3)", borderRadius: 8, color: "var(--accent)", fontWeight: 700, cursor: "pointer", fontSize: 11, fontFamily: "inherit" }}>
                    Copy Link
                  </button>
                </div>
              )}
            </Card>
          </div>
        </div>

      ) : tab === "notifications" ? (
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
            <div>
              <h3 style={{ fontWeight: 800, fontSize: 15, color: "var(--text)", marginBottom: 2 }}>🔔 Notifications</h3>
              <p style={{ fontSize: 11, color: "var(--text3)" }}>Showing last 10 — history kept for 1 month</p>
            </div>
            {notifications.some(n => !n.isRead) && (
              <button onClick={async () => {
                const unread = notifications.filter(n => !n.isRead);
                if (!unread.length) return;
                // تحديث UI فوري لمنع الضغط المزدوج
                setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
                await Promise.all(unread.map(n => updateDoc(doc(db, "notifications", n.id), { isRead: true }).catch(() => {})));
              }} style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.25)", borderRadius: 8, padding: "5px 12px", fontSize: 11, color: "var(--accent)", fontWeight: 700, cursor: "pointer" }}>
                Mark all read
              </button>
            )}
          </div>
          {notifications.length === 0 ? (
            <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--text3)" }}>
              <div style={{ fontSize: 40, marginBottom: 10, opacity: 0.5 }}>🔔</div>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>No notifications yet</div>
              <div style={{ fontSize: 12 }}>Payments, refunds and updates will appear here</div>
            </div>
          ) : notifications.map((n, idx) => {
            const NOTIF_META = {
              payment_success:        { icon: "✅", color: "#10b981", bg: "rgba(16,185,129,0.1)" },
              instapay_approved:      { icon: "✅", color: "#10b981", bg: "rgba(16,185,129,0.1)" },
              instapay_rejected:      { icon: "❌", color: "#ef4444", bg: "rgba(239,68,68,0.08)" },
              refund_pending:         { icon: "⏳", color: "#d97706", bg: "rgba(245,158,11,0.08)" },
              refund_approved:        { icon: "↩️", color: "#818cf8", bg: "rgba(99,102,241,0.1)" },
              refund_rejected:        { icon: "❌", color: "#ef4444", bg: "rgba(239,68,68,0.08)" },
              refund_update:          { icon: "📋", color: "#d97706", bg: "rgba(245,158,11,0.08)" },
              transaction_cancelled:  { icon: "🚫", color: "#6b7280", bg: "rgba(107,114,128,0.08)" },
              subscription_cancelled: { icon: "🚫", color: "#ef4444", bg: "rgba(239,68,68,0.08)" },
              leaderboard_reward:     { icon: "🏆", color: "#d97706", bg: "rgba(245,158,11,0.1)" },
              admin_message:          { icon: "📣", color: "#6366f1", bg: "rgba(99,102,241,0.1)" },
              referral_reward:        { icon: "🎁", color: "#10b981", bg: "rgba(16,185,129,0.1)" },
              certificate:            { icon: "🏆", color: "#d97706", bg: "rgba(245,158,11,0.1)" },
              default:                { icon: "🔔", color: "var(--accent)", bg: "rgba(99,102,241,0.08)" },
            };
            const meta = NOTIF_META[n.type] || NOTIF_META.default;
            const nDate = n.createdAt?.toDate ? n.createdAt.toDate() : null;
            const timeStr = nDate ? nDate.toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "";
            
            // Determine operation type chip
            const isSubscriptionPurchase = n.data?.planId && (n.type === "payment_success" || n.type === "instapay_approved");
            const isExamPurchase = n.data?.examTitle && !n.data?.planId && (n.type === "payment_success" || n.type === "instapay_approved");
            
            return (
              <div key={n.id}
                onClick={() => markRead(n.id)}
                style={{
                  display: "flex", gap: 14, padding: "14px 12px",
                  borderBottom: idx < notifications.length - 1 ? "1px solid var(--border)" : "none",
                  cursor: "pointer", borderRadius: 12,
                  background: n.isRead ? "transparent" : meta.bg,
                  border: n.isRead ? "none" : `1px solid ${meta.color}22`,
                  marginBottom: 6, transition: "all 0.2s",
                }}
                onMouseEnter={e => e.currentTarget.style.background = meta.bg}
                onMouseLeave={e => e.currentTarget.style.background = n.isRead ? "transparent" : meta.bg}
              >
                {/* Icon */}
                <div style={{ width: 44, height: 44, borderRadius: 14, background: meta.bg, border: `1.5px solid ${meta.color}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
                  {meta.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 3, gap: 8 }}>
                    <div style={{ fontWeight: n.isRead ? 600 : 800, fontSize: 13, color: "var(--text)", lineHeight: 1.3 }}>{n.title}</div>
                    {timeStr && <div style={{ fontSize: 10, color: "var(--text3)", whiteSpace: "nowrap", flexShrink: 0 }}>{timeStr}</div>}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text2)", lineHeight: 1.5, marginBottom: 4 }}>{n.body}</div>
                  {/* Extra detail chips */}
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                    {/* Operation Type Chip */}
                    {isSubscriptionPurchase && (
                      <span style={{ fontSize: 10, fontWeight: 800, padding: "2px 8px", borderRadius: 99, background: "rgba(99,102,241,0.12)", color: "var(--accent)", border: "1px solid rgba(99,102,241,0.25)" }}>
                        🔄 Subscription · {n.data.planId === "monthly" ? "Monthly Plan" : n.data.planId === "yearly" ? "Yearly Plan" : n.data.planId}
                      </span>
                    )}
                    {isExamPurchase && (
                      <span style={{ fontSize: 10, fontWeight: 800, padding: "2px 8px", borderRadius: 99, background: "rgba(6,182,212,0.12)", color: "#0891b2", border: "1px solid rgba(6,182,212,0.25)" }}>
                        🛒 Exam Purchase
                      </span>
                    )}
                    {/* Exam name chip (only for exam purchases) */}
                    {n.data?.examTitle && !n.data?.planId && (
                      <span style={{ fontSize: 10, fontWeight: 800, padding: "2px 8px", borderRadius: 99, background: "rgba(6,182,212,0.08)", color: "#0891b2", border: "1px solid rgba(6,182,212,0.2)" }}>
                        📋 {n.data.examTitle}
                      </span>
                    )}
                    {/* Plan name for subscriptions (if not already shown) */}
                    {n.data?.planId && !isSubscriptionPurchase && (
                      <span style={{ fontSize: 10, fontWeight: 800, padding: "2px 8px", borderRadius: 99, background: "rgba(99,102,241,0.1)", color: "var(--accent)", border: "1px solid rgba(99,102,241,0.2)" }}>
                        ✨ {n.data.planId === "monthly" ? "Monthly Plan" : n.data.planId === "yearly" ? "Yearly Plan" : n.data.planId}
                      </span>
                    )}
                    {n.data?.amount && (
                      <span style={{ fontSize: 10, fontWeight: 800, padding: "2px 8px", borderRadius: 99, background: "rgba(16,185,129,0.1)", color: "#10b981", border: "1px solid rgba(16,185,129,0.2)" }}>
                        💰 ${Number(n.data.amount).toFixed(2)}
                      </span>
                    )}
                    {n.data?.score != null && (
                      <span style={{ fontSize: 10, fontWeight: 800, padding: "2px 8px", borderRadius: 99, background: n.data.score >= 70 ? "rgba(16,185,129,0.1)" : "rgba(245,158,11,0.1)", color: n.data.score >= 70 ? "#10b981" : "#d97706", border: `1px solid ${n.data.score >= 70 ? "rgba(16,185,129,0.2)" : "rgba(245,158,11,0.2)"}` }}>
                        🎯 Score: {n.data.score}%
                      </span>
                    )}
                    {n.coupon && (
                      <code style={{ fontSize: 11, fontWeight: 900, color: "#10b981", background: "rgba(16,185,129,0.08)", padding: "2px 8px", borderRadius: 6, letterSpacing: "0.08em", border: "1px solid rgba(16,185,129,0.2)" }}>{n.coupon}</code>
                    )}
                    {n.data?.transactionId && (
                      <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 99, background: "rgba(100,116,139,0.1)", color: "var(--text3)", border: "1px solid rgba(100,116,139,0.2)", fontFamily: "monospace" }}>
                        #{String(n.data.transactionId).slice(-10)}
                      </span>
                    )}
                    {/* Invoice button — shown for payment-related notifications, links to Billing tab in My Exams */}
                    {["payment_success","instapay_approved","refund_pending","refund_approved","refund_rejected","refund_update"].includes(n.type) && (n.data?.transactionId || n.data?.examTitle || n.data?.planId) && (
                      <button
                        onClick={(e) => { e.stopPropagation(); window.dispatchEvent(new CustomEvent("myexams:tab", { detail: "billing" })); setPage("my-exams"); }}
                        style={{ fontSize: 10, fontWeight: 800, padding: "3px 10px", borderRadius: 8, background: "rgba(99,102,241,0.1)", color: "var(--accent)", border: "1px solid rgba(99,102,241,0.3)", cursor: "pointer", fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 4, transition: "all 0.15s" }}
                        onMouseEnter={e => { e.currentTarget.style.background = "rgba(99,102,241,0.2)"; }}
                        onMouseLeave={e => { e.currentTarget.style.background = "rgba(99,102,241,0.1)"; }}
                      >
                        🧾 View Invoice
                      </button>
                    )}
                  </div>
                </div>
                {!n.isRead && (
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: meta.color, flexShrink: 0, marginTop: 6 }} />
                )}
              </div>
            );
          })}
        </Card>

      ) : tab === "topics" ? (
        <Card>
          <h3 style={{ fontWeight: 800, marginBottom: 20, fontSize: 15, color: "var(--text)", display: "flex", alignItems: "center", gap: 8 }}><Icon n="book" size={16} /> Performance by Topic</h3>
          {Object.keys(domainStats).length === 0 ? (
            <Empty icon="📚" title="No topic data yet" subtitle="Complete exams to see your performance by topic" />
          ) : (
            Object.entries(domainStats)
              .sort((a, b) => (b[1].correct / b[1].total) - (a[1].correct / a[1].total))
              .slice(0, 10)
              .map(([domain, { correct, total }]) => {
                const pct = Math.round((correct / total) * 100);
                return (
                  <div key={domain} style={{ marginBottom: 18 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 7 }}>
                      <span style={{ fontWeight: 600, fontSize: 13 }}>{domain}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: pct >= 70 ? "#10b981" : pct >= 50 ? "#f59e0b" : "#ef4444" }}>{correct}/{total} ({pct}%)</span>
                    </div>
                    <ProgressBar value={correct} max={total} height={7}
                      color={pct >= 70 ? "linear-gradient(90deg,#10b981,#047857)" : pct >= 50 ? "linear-gradient(90deg,#f59e0b,#d97706)" : "linear-gradient(90deg,#ef4444,#b91c1c)"} />
                  </div>
                );
              })
          )}
        </Card>
      ) : null}

      {/* Edit Modal */}
      {editMode && (
        <Modal title="✏️ Edit Your Profile" onClose={() => setEditMode(false)} maxWidth={500}>
          <Input label="Display Name" value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} placeholder="Your full name" />
          <Input label="Email Address (cannot be changed)" type="email" value={editForm.email} disabled />
          <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
            <Btn onClick={handleSaveProfile} full>Save Changes</Btn>
            <Btn variant="ghost" onClick={() => setEditMode(false)}>Cancel</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}