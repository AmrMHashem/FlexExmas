// pages/Leaderboard.jsx — Enhanced v2
// Changes: Top 10 only · Anti-cheat speed check · Clear prize rules (#1=yearly,#2=monthly,tie=both monthly)
// Daily login streak points · Motivational progress tips · All requirements visible to member
import React, { useState, useEffect, useMemo } from "react";
import { db } from "../firebase";
import {
  collection, getDocs, doc, getDoc,
  query, orderBy, limit, where, setDoc, serverTimestamp, onSnapshot,
} from "firebase/firestore";
import { useAuth } from "../hooks/useAuth";

// ─── Constants ────────────────────────────────────────────────────
const LEVELS = [
  { min: 0,    max: 99,   name: "Beginner",     icon: "🌱", color: "#6b7280" },
  { min: 100,  max: 299,  name: "Explorer",     icon: "🔍", color: "#3b82f6" },
  { min: 300,  max: 599,  name: "Practitioner", icon: "⚡", color: "#8b5cf6" },
  { min: 600,  max: 999,  name: "Expert",       icon: "🎯", color: "#f59e0b" },
  { min: 1000, max: 1999, name: "Master",       icon: "🏆", color: "#10b981" },
  { min: 2000, max: Infinity, name: "Legend",   icon: "👑", color: "#ec4899" },
];

const BADGES = [
  { id: "first_exam",    icon: "🎓", name: "First Steps",    desc: "Complete your first exam",         condition: (s) => s.totalExams >= 1 },
  { id: "streak_3",      icon: "🔥", name: "On Fire",        desc: "3-day study streak",               condition: (s) => s.streak >= 3 },
  { id: "streak_7",      icon: "💎", name: "Diamond Streak", desc: "7-day study streak",               condition: (s) => s.streak >= 7 },
  { id: "streak_30",     icon: "🌟", name: "Legend Streak",  desc: "30-day study streak",              condition: (s) => s.streak >= 30 },
  { id: "pass_rate_90",  icon: "🎯", name: "Sharpshooter",   desc: "90%+ pass rate across all exams",  condition: (s) => s.passRate >= 90 },
  { id: "perfect_score", icon: "💯", name: "Perfectionist",  desc: "Score 100% on any exam",           condition: (s) => s.bestScore >= 100 },
  { id: "10_exams",      icon: "📚", name: "Bookworm",       desc: "Complete 10 exams",                condition: (s) => s.totalExams >= 10 },
  { id: "50_exams",      icon: "🚀", name: "Rocket Scholar", desc: "Complete 50 exams",                condition: (s) => s.totalExams >= 50 },
  { id: "top_10",        icon: "🏅", name: "Top 10",         desc: "Reach top 10 on leaderboard",      condition: (s, rank) => rank <= 10 },
  { id: "top_1",         icon: "👑", name: "Champion",       desc: "#1 on the monthly leaderboard",    condition: (s, rank) => rank === 1 },
  { id: "1000_pts",      icon: "💠", name: "1K Club",        desc: "Earn 1,000 points",                condition: (s) => s.points >= 1000 },
];

// Prize requirements — must meet ALL to qualify for monthly prize
const PRIZE_REQUIREMENTS = [
  { key: "points",   label: "Points (1000+)",   target: 1000, icon: "💠", suffix: " pts",   getValue: (s) => s.points || 0 },
  { key: "exams",    label: "Exams (10+)",       target: 10,   icon: "📋", suffix: " exams", getValue: (s) => s.totalExams || 0 },
  { key: "passRate", label: "Pass Rate (80%+)",  target: 80,   icon: "✅", suffix: "%",      getValue: (s) => s.passRate || 0 },
  { key: "streak",   label: "Activity (7 days)", target: 7,    icon: "🔥", suffix: " days",  getValue: (s) => s.maxStreak || 0 },
];

// Anti-cheat: minimum 5 seconds per question
const MIN_SECS_PER_QUESTION = 5;

export function getLevel(points) {
  return LEVELS.find(l => points >= l.min && points <= l.max) || LEVELS[0];
}

export function getEarnedBadges(stats, rank = 999) {
  return BADGES.filter(b => b.condition(stats, rank));
}

// ─── Points calculation ───────────────────────────────────────────
export function calcPointsForResult(score, totalQuestions, passed, streak = 0, isFirstAttempt = true, timeTakenSeconds = null) {
  // Speed anti-cheat
  if (timeTakenSeconds !== null && totalQuestions > 0) {
    if (timeTakenSeconds / totalQuestions < MIN_SECS_PER_QUESTION) return 0;
  }

  let pts = 0;
  if (isFirstAttempt) {
    pts += Math.round(score * 0.5);      // up to 50 pts
    pts += Math.min(totalQuestions, 30); // up to 30 pts
    if (passed) pts += 20;              // pass bonus
    if (score >= 90) pts += 15;         // excellence
    if (score >= 100) pts += 25;        // perfect
  } else {
    pts = Math.max(0, Math.round(score * 0.05)); // retake: 5% only
  }

  if (streak >= 3) pts += 5;
  if (streak >= 7) pts += 10;
  return pts;
}

// ─── Update leaderboard after exam ───────────────────────────────
export async function updateLeaderboardStats(userId, resultData) {
  try {
    const now      = new Date();
    const todayStr = now.toISOString().split("T")[0];
    const ref      = doc(db, "leaderboard", userId);
    const snap     = await getDoc(ref);
    const existing = snap.exists() ? snap.data() : {};

    const lastDate  = existing.lastActiveDate || "";
    const yesterday = new Date(now - 86400000).toISOString().split("T")[0];
    let streak = existing.streak || 0;
    if (lastDate === todayStr) { /* keep */ }
    else if (lastDate === yesterday) streak += 1;
    else streak = 1;

    const totalExams  = (existing.totalExams || 0) + 1;
    const totalPassed = (existing.totalPassed || 0) + (resultData.passed ? 1 : 0);
    const passRate    = Math.round((totalPassed / totalExams) * 100);
    const bestScore   = Math.max(existing.bestScore || 0, resultData.score || 0);
    const pts         = calcPointsForResult(
      resultData.score, resultData.totalQuestions, resultData.passed,
      streak, resultData.isFirstAttempt !== false, resultData.timeTakenSeconds || null
    );
    const totalPts  = (existing.points || 0) + pts;
    const stats     = { totalExams, totalPassed, passRate, bestScore, streak, points: totalPts };
    const oldBadges = existing.badges || [];
    const newEarned = getEarnedBadges(stats, 999).map(b => b.id);

    await setDoc(ref, {
      userId,
      name:           resultData.userName || existing.name || "Anonymous",
      avatar:         resultData.avatar   || existing.avatar || "",
      country:        resultData.country  || existing.country || "",
      points:         totalPts,
      totalExams,
      totalPassed,
      passRate,
      bestScore,
      streak,
      maxStreak:      Math.max(existing.maxStreak || 0, streak),
      badges:         [...new Set([...oldBadges, ...newEarned])],
      lastActiveDate: todayStr,
      monthKey:       `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}`,
      updatedAt:      serverTimestamp(),
    }, { merge: true });

    return { pts, totalPts, streak };
  } catch (e) {
    console.error("updateLeaderboardStats error:", e);
    return null;
  }
}

// ─── Record daily login (adds 1–5 pts for showing up) ────────────
export async function recordDailyLogin(userId, userName = "") {
  try {
    const now      = new Date();
    const todayStr = now.toISOString().split("T")[0];
    const ref      = doc(db, "leaderboard", userId);
    const snap     = await getDoc(ref);
    const existing = snap.exists() ? snap.data() : {};
    if (existing.lastActiveDate === todayStr) return; // already done today

    const yesterday  = new Date(now - 86400000).toISOString().split("T")[0];
    const streak     = existing.lastActiveDate === yesterday ? (existing.streak || 0) + 1 : 1;
    const loginBonus = Math.min(streak, 5); // 1–5 pts

    await setDoc(ref, {
      userId,
      name:           userName || existing.name || "Anonymous",
      points:         (existing.points || 0) + loginBonus,
      streak,
      maxStreak:      Math.max(existing.maxStreak || 0, streak),
      lastActiveDate: todayStr,
      monthKey:       `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}`,
      updatedAt:      serverTimestamp(),
    }, { merge: true });
  } catch (e) {
    console.error("recordDailyLogin error:", e);
  }
}

// ─── Fetch leaderboard (top 10) ───────────────────────────────────
async function fetchLeaderboard(monthKey = null) {
  try {
    if (monthKey) {
      try {
        const q    = query(collection(db, "leaderboard"), where("monthKey", "==", monthKey), orderBy("points", "desc"), limit(10));
        const snap = await getDocs(q);
        if (!snap.empty) return snap.docs.map((d, i) => ({ id: d.id, rank: i + 1, ...d.data() }));
      } catch { /* no index, fall through */ }
    }
    const q    = query(collection(db, "leaderboard"), orderBy("points", "desc"), limit(50));
    const snap = await getDocs(q);
    const all  = snap.docs.map((d, i) => ({ id: d.id, rank: i + 1, ...d.data() }));
    if (monthKey) {
      const filtered = all.filter(r => !r.monthKey || r.monthKey === monthKey);
      return (filtered.length > 0 ? filtered : all).slice(0, 10).map((r, i) => ({ ...r, rank: i + 1 }));
    }
    return all.slice(0, 10);
  } catch (e) {
    console.error("Leaderboard fetch:", e);
    return [];
  }
}

// ─── Prize Progress Card ──────────────────────────────────────────
function PrizeProgressCard({ stats, rank, data }) {
  const reqs       = PRIZE_REQUIREMENTS.map(r => {
    const val = r.getValue(stats);
    const pct = Math.min(100, Math.round((val / r.target) * 100));
    return { ...r, val, pct, done: val >= r.target };
  });
  const overallPct = Math.round(reqs.reduce((s, r) => s + r.pct, 0) / reqs.length);
  const allDone    = reqs.every(r => r.done);
  const inTop2     = rank > 0 && rank <= 2;
  const prize      = rank === 1 ? "🏆 FREE Yearly Subscription" : rank === 2 ? "🎁 FREE Monthly Subscription" : null;

  // Build motivational hints
  const hints = [];
  if (data.length > 0 && rank !== 1) {
    const leader = data[0];
    const gap    = (leader.points || 0) - (stats.points || 0);
    if (gap > 0) hints.push(`Only ${gap.toLocaleString()} pts away from #1 (Yearly Sub 🏆)`);
  }
  if (data.length > 1 && rank > 2) {
    const second = data[1];
    const gap2   = (second.points || 0) - (stats.points || 0);
    if (gap2 > 0) hints.push(`${gap2.toLocaleString()} pts away from #2 (Monthly Sub 🎁)`);
  }
  reqs.forEach(r => {
    if (!r.done) hints.push(`${r.target - r.val}${r.suffix} more for "${r.label}" ✓`);
  });

  return (
    <div style={{
      background: allDone && inTop2
        ? "linear-gradient(135deg,rgba(245,158,11,0.12),rgba(217,119,6,0.06))"
        : "var(--bg2)",
      border: `1.5px solid ${allDone && inTop2 ? "rgba(245,158,11,0.4)" : "var(--border)"}`,
      borderRadius: 18, padding: "20px 22px",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 900, color: "var(--text)" }}>🏅 Monthly Prize Progress</div>
          <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 3 }}>
            #1 → Yearly Sub · #2 → Monthly Sub · Tie → Both get Monthly
          </div>
        </div>
        <div style={{ fontSize: 26, fontWeight: 900, color: overallPct >= 100 ? "#f59e0b" : "var(--accent)" }}>
          {overallPct}%
        </div>
      </div>

      {/* Overall bar */}
      <div style={{ height: 10, background: "var(--bg3)", borderRadius: 99, overflow: "hidden", marginBottom: 14 }}>
        <div style={{
          height: "100%", width: `${overallPct}%`,
          background: overallPct >= 100 ? "linear-gradient(90deg,#10b981,#059669)" : "linear-gradient(90deg,#6366f1,#8b5cf6)",
          borderRadius: 99, transition: "width 0.8s ease",
          boxShadow: overallPct >= 100 ? "0 0 12px rgba(16,185,129,0.5)" : "none",
        }} />
      </div>

      {/* Individual requirements */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
        {reqs.map((r, i) => (
          <div key={i}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
              <span style={{ color: r.done ? "var(--green)" : "var(--text2)", fontWeight: 600, display: "flex", alignItems: "center", gap: 5 }}>
                {r.icon} {r.done ? "✅" : "⬜"} {r.label}
              </span>
              <span style={{ fontWeight: 700, color: r.done ? "var(--green)" : "var(--accent)" }}>
                {r.val}{r.suffix} / {r.target}{r.suffix}
              </span>
            </div>
            <div style={{ height: 5, background: "var(--bg3)", borderRadius: 99, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${r.pct}%`, background: r.done ? "#10b981" : "linear-gradient(90deg,#6366f1,#8b5cf6)", borderRadius: 99, transition: "width 0.6s ease" }} />
            </div>
          </div>
        ))}
      </div>

      {/* Motivational hints */}
      {hints.length > 0 && (
        <div style={{ background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.15)", borderRadius: 10, padding: "10px 14px", marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: "var(--accent)", marginBottom: 6 }}>🚀 Your next steps:</div>
          {hints.slice(0, 3).map((h, i) => (
            <div key={i} style={{ fontSize: 11, color: "var(--text2)", marginBottom: 3, display: "flex", gap: 6 }}>
              <span style={{ color: "var(--accent)" }}>→</span> {h}
            </div>
          ))}
        </div>
      )}

      {/* Winner banner */}
      {allDone && inTop2 && prize ? (
        <div style={{ padding: "12px 16px", background: "rgba(245,158,11,0.12)", border: "1.5px solid rgba(245,158,11,0.4)", borderRadius: 10, textAlign: "center" }}>
          <div style={{ fontSize: 22, marginBottom: 4 }}>🎉</div>
          <div style={{ fontSize: 13, fontWeight: 900, color: "#d97706" }}>You qualify for {prize}!</div>
          <div style={{ fontSize: 11, color: "var(--text2)", marginTop: 4 }}>
            Rewards are granted automatically when conditions are met at month end.
          </div>
        </div>
      ) : (
        <div style={{ fontSize: 11, color: "var(--text3)", textAlign: "center" }}>
          {rank === 0
            ? "Complete exams to appear on the leaderboard and qualify for prizes 🏆"
            : `Rank #${rank} — every exam brings you closer to the prize!`}
        </div>
      )}
    </div>
  );
}

// ─── Level Progress Bar ───────────────────────────────────────────
function LevelBar({ points }) {
  const level     = getLevel(points);
  const nextLevel = LEVELS[LEVELS.indexOf(level) + 1];
  const pct       = nextLevel
    ? Math.round(((points - level.min) / (nextLevel.min - level.min)) * 100)
    : 100;
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontWeight: 700, color: "var(--text3)", marginBottom: 5 }}>
        <span style={{ color: level.color }}>{level.icon} {level.name}</span>
        {nextLevel && <span>{nextLevel.icon} {nextLevel.name} in {nextLevel.min - points} pts</span>}
      </div>
      <div style={{ height: 6, background: "var(--border)", borderRadius: 100, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: level.color, borderRadius: 100, transition: "width 0.5s ease" }} />
      </div>
    </div>
  );
}

// ─── Badge Grid ───────────────────────────────────────────────────
function BadgeGrid({ earned = [], all = BADGES, compact = false }) {
  if (compact) {
    return (
      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
        {earned.slice(0, 5).map(bId => {
          const b = all.find(x => x.id === bId);
          if (!b) return null;
          return <span key={bId} title={`${b.name}: ${b.desc}`} style={{ fontSize: 16, cursor: "help" }}>{b.icon}</span>;
        })}
        {earned.length > 5 && <span style={{ fontSize: 11, color: "var(--text3)", alignSelf: "center" }}>+{earned.length - 5}</span>}
      </div>
    );
  }
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(120px,1fr))", gap: 10 }}>
      {all.map(b => {
        const isEarned = earned.includes(b.id);
        return (
          <div key={b.id} title={b.desc} style={{
            background: isEarned ? "rgba(99,102,241,0.08)" : "var(--bg3)",
            border: `1.5px solid ${isEarned ? "rgba(99,102,241,0.3)" : "var(--border)"}`,
            borderRadius: 12, padding: "12px 10px", textAlign: "center",
            opacity: isEarned ? 1 : 0.4, transition: "all 0.2s",
          }}>
            <div style={{ fontSize: 28, marginBottom: 6 }}>{b.icon}</div>
            <div style={{ fontSize: 11, fontWeight: 800, color: isEarned ? "var(--text)" : "var(--text3)" }}>{b.name}</div>
            <div style={{ fontSize: 10, color: "var(--text3)", marginTop: 2, lineHeight: 1.3 }}>{b.desc}</div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Streak Widget ────────────────────────────────────────────────
function StreakWidget({ streak, maxStreak }) {
  const flames = Math.min(streak, 7);
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12,
      background: streak >= 3 ? "rgba(251,146,60,0.08)" : "var(--bg3)",
      border: `1.5px solid ${streak >= 3 ? "rgba(251,146,60,0.3)" : "var(--border)"}`,
      borderRadius: 12, padding: "14px 18px",
    }}>
      <div style={{ fontSize: 36 }}>{streak >= 7 ? "💎" : streak >= 3 ? "🔥" : "📅"}</div>
      <div>
        <div style={{ fontSize: 22, fontWeight: 900, color: streak >= 3 ? "#fb923c" : "var(--text)" }}>
          {streak} day{streak !== 1 ? "s" : ""}
        </div>
        <div style={{ fontSize: 11, color: "var(--text3)", fontWeight: 600 }}>
          Current streak · Best: {maxStreak} days
        </div>
        {streak >= 3 && (
          <div style={{ fontSize: 10, color: "#fb923c", fontWeight: 700, marginTop: 3 }}>
            {streak >= 7 ? "🌟 +10 pts bonus per exam!" : "🔥 +5 pts bonus per exam!"}
          </div>
        )}
      </div>
      <div style={{ marginLeft: "auto", display: "flex", gap: 3 }}>
        {[...Array(7)].map((_, i) => (
          <div key={i} style={{
            width: 8, height: 8, borderRadius: "50%",
            background: i < flames ? "#fb923c" : "var(--border)",
            transition: "background 0.3s",
          }} />
        ))}
      </div>
    </div>
  );
}

// ─── Collapsible How Points Work ──────────────────────────────────
function HowPointsWork() {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ background: "var(--bg2)", border: "1.5px solid var(--border)", borderRadius: 14, overflow: "hidden" }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{ width: "100%", padding: "14px 18px", background: "transparent", border: "none", color: "var(--text)", fontWeight: 800, fontSize: 13, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", fontFamily: "inherit" }}
      >
        <span>📖 How are points earned?</span>
        <span style={{ fontSize: 18, transition: "transform 0.2s", display: "inline-block", transform: open ? "rotate(180deg)" : "none" }}>▾</span>
      </button>
      {open && (
        <div style={{ padding: "0 18px 18px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {[
            { icon: "🎯", title: "Exam score", desc: "Up to 50 pts (first attempt)" },
            { icon: "📋", title: "Questions", desc: "Up to 30 pts by volume" },
            { icon: "✅", title: "Passing bonus", desc: "+20 pts for passing" },
            { icon: "⭐", title: "Excellence", desc: "+15 pts at 90%, +25 at 100%" },
            { icon: "🔥", title: "Streak bonus", desc: "+5 pts (3-day), +10 pts (7-day)" },
            { icon: "📅", title: "Daily login", desc: "+1 to +5 pts every day you visit" },
            { icon: "♻️", title: "Retakes", desc: "5% of score only — first attempt is full" },
            { icon: "⚡", title: "Anti-cheat", desc: "Too-fast answers give 0 pts" },
          ].map((item, i) => (
            <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "10px 12px", background: "var(--bg3)", borderRadius: 10 }}>
              <span style={{ fontSize: 18, flexShrink: 0 }}>{item.icon}</span>
              <div>
                <div style={{ fontSize: 12, fontWeight: 800, color: "var(--text)" }}>{item.title}</div>
                <div style={{ fontSize: 11, color: "var(--text3)", lineHeight: 1.4 }}>{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Leaderboard Page ────────────────────────────────────────
export default function Leaderboard({ setPage, showToast }) {
  const { user } = useAuth();
  const [data, setData]       = useState([]);
  const [myData, setMyData]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView]       = useState("leaderboard");
  const [period, setPeriod]   = useState("monthly");

  const currentMonthKey = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}`;
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const CACHE_TTL = 5 * 60 * 1000;
    const SESSION_KEY = `fx_lb_${period}_${currentMonthKey}`;

    const loadAll = async () => {
      try {
        const loadMyData = user
          ? getDoc(doc(db, "leaderboard", user.uid))
              .then(s => s.exists() ? { id: s.id, ...s.data() } : null)
              .catch(() => null)
          : Promise.resolve(null);

        // Check session cache first — avoids re-read on tab switch
        let results = null;
        try {
          const raw = sessionStorage.getItem(SESSION_KEY);
          if (raw) {
            const { data: d, ts } = JSON.parse(raw);
            if (Date.now() - ts < CACHE_TTL) results = d;
          }
        } catch { /* ignore */ }

        if (!results) {
          // getDocs only — NO onSnapshot (saves continuous billing)
          const q = query(collection(db, "leaderboard"), orderBy("points", "desc"), limit(50));
          const snap = await getDocs(q);
          let fetched = snap.docs.map((d, i) => ({ id: d.id, rank: i + 1, ...d.data() }));
          if (period === "monthly") {
            const filtered = fetched.filter(r => !r.monthKey || r.monthKey === currentMonthKey);
            fetched = (filtered.length > 0 ? filtered : fetched).map((r, i) => ({ ...r, rank: i + 1 }));
          }
          results = fetched.slice(0, 10);
          try {
            sessionStorage.setItem(SESSION_KEY, JSON.stringify({ data: results, ts: Date.now() }));
          } catch { /* storage full */ }
        }

        const myData = await loadMyData;
        if (!cancelled) { setMyData(myData); setData(results); setLoading(false); }
      } catch {
        if (!cancelled) {
          fetchLeaderboard(period === "monthly" ? currentMonthKey : null)
            .then(d => { if (!cancelled) { setData(d.slice(0, 10)); setLoading(false); } });
        }
      }
    };

    loadAll();
    return () => { cancelled = true; };
  }, [user, period, currentMonthKey]);

  const myRankIndex = data.findIndex(d => d.id === user?.uid);
  const myRank      = myRankIndex >= 0 ? myRankIndex + 1 : 0;
  const myLevel     = myData ? getLevel(myData.points || 0) : LEVELS[0];
  const myBadges    = myData ? getEarnedBadges({ ...myData }, myRank || 999) : [];
  const hasTie      = data.length >= 2 && data[0]?.points === data[1]?.points;

  const rankStyle = (rank) => {
    if (rank === 1) return { color: "#f59e0b", icon: "🥇", prize: hasTie ? "Monthly Sub 🎁" : "Yearly Sub 🏆" };
    if (rank === 2) return { color: "#94a3b8", icon: "🥈", prize: "Monthly Sub 🎁" };
    if (rank === 3) return { color: "#b45309", icon: "🥉", prize: null };
    return { color: "var(--text3)", icon: `#${rank}`, prize: null };
  };

  const tabs = [
    { id: "leaderboard", label: "🏆 Rankings" },
    { id: "my-stats",    label: "📊 My Stats"  },
    { id: "badges",      label: "🏅 Badges"    },
  ];

  const monthName = new Date().toLocaleString("en-US", { month: "long", year: "numeric" });

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "32px 20px" }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes slideIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
      `}</style>

      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <div style={{ fontSize: 48, marginBottom: 10 }}>🏆</div>
        <h1 style={{ fontSize: "clamp(22px,4vw,30px)", fontWeight: 900, marginBottom: 8 }}>Monthly Challenge</h1>
        <p style={{ color: "var(--text2)", fontSize: 14, marginBottom: 14 }}>
          {monthName} · Top 10 most active students compete for real prizes
        </p>
        <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "linear-gradient(135deg,rgba(245,158,11,0.12),rgba(217,119,6,0.08))",
            border: "1.5px solid rgba(245,158,11,0.35)",
            borderRadius: 100, padding: "8px 18px",
            fontSize: 12, fontWeight: 800, color: "#d97706",
          }}>🏆 #1 → FREE Yearly Subscription</div>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "rgba(99,102,241,0.08)",
            border: "1.5px solid rgba(99,102,241,0.25)",
            borderRadius: 100, padding: "8px 18px",
            fontSize: 12, fontWeight: 800, color: "var(--accent)",
          }}>🎁 #2 → FREE Monthly Subscription</div>
        </div>
        {hasTie && (
          <div style={{ marginTop: 8, fontSize: 11, color: "var(--text3)" }}>
            ⚖️ Current tie: both #1 and #2 receive monthly subscription
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 20, background: "var(--bg2)", border: "1.5px solid var(--border)", borderRadius: 14, padding: 5, width: "fit-content", margin: "0 auto 20px" }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setView(t.id)} style={{
            padding: "9px 18px", borderRadius: 10, border: "none",
            background: view === t.id ? "linear-gradient(135deg,#6366f1,#8b5cf6)" : "transparent",
            color: view === t.id ? "#fff" : "var(--text2)",
            fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
            transition: "all 0.2s",
          }}>{t.label}</button>
        ))}
      </div>

      {/* ── RANKINGS TAB ── */}
      {view === "leaderboard" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14, animation: "slideIn 0.3s ease" }}>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            {["monthly","alltime"].map(p => (
              <button key={p} onClick={() => setPeriod(p)} style={{
                padding: "7px 14px", borderRadius: 8,
                border: `1.5px solid ${period === p ? "var(--accent)" : "var(--border)"}`,
                background: period === p ? "rgba(99,102,241,0.1)" : "transparent",
                color: period === p ? "var(--accent)" : "var(--text3)",
                fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
              }}>
                {p === "monthly" ? "📅 This Month" : "🌍 All Time"}
              </button>
            ))}
          </div>

          {loading ? (
            <div style={{ padding: 48, textAlign: "center" }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5" style={{ animation: "spin 0.8s linear infinite" }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
            </div>
          ) : data.length === 0 ? (
            <div style={{ padding: "48px 20px", textAlign: "center", color: "var(--text3)", background: "var(--bg2)", border: "1.5px dashed var(--border)", borderRadius: 14 }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🏁</div>
              <div style={{ fontSize: 15, fontWeight: 700 }}>No rankings yet this month</div>
              <div style={{ fontSize: 13, marginTop: 6 }}>Complete exams to earn points and appear here!</div>
            </div>
          ) : (
            <>
              {/* Podium (top 3) */}
              {data.length >= 3 && (
                <div style={{ display: "flex", gap: 10, marginBottom: 8, justifyContent: "center", alignItems: "flex-end" }}>
                  {[data[1], data[0], data[2]].map((entry, i) => {
                    const isFirst = i === 1;
                    const rank    = i === 0 ? 2 : i === 1 ? 1 : 3;
                    const medals  = ["🥈","🥇","🥉"];
                    const rs      = rankStyle(rank);
                    return (
                      <div key={entry.id} style={{
                        flex: 1, maxWidth: 180, textAlign: "center",
                        background: isFirst ? "linear-gradient(135deg,rgba(245,158,11,0.1),rgba(217,119,6,0.06))" : "var(--bg2)",
                        border: `1.5px solid ${isFirst ? "rgba(245,158,11,0.4)" : "var(--border)"}`,
                        borderRadius: 16, padding: "16px 10px",
                        transform: isFirst ? "scale(1.05)" : "scale(1)",
                        boxShadow: isFirst ? "0 8px 24px rgba(245,158,11,0.2)" : "none",
                      }}>
                        <div style={{ fontSize: 28, marginBottom: 4 }}>{medals[i]}</div>
                        <div style={{ fontSize: 13, fontWeight: 900, color: "var(--text)", marginBottom: 2 }}>{entry.name || "Anonymous"}</div>
                        {entry.country && <div style={{ fontSize: 10, color: "var(--text3)" }}>🌍 {entry.country}</div>}
                        <div style={{ fontSize: 18, fontWeight: 900, color: "#f59e0b", marginTop: 6 }}>
                          {(entry.points || 0).toLocaleString()} pts
                        </div>
                        {rs.prize && (
                          <div style={{ fontSize: 9, fontWeight: 800, color: rank === 1 ? "#d97706" : "var(--accent)", padding: "3px 8px", background: rank === 1 ? "rgba(245,158,11,0.12)" : "rgba(99,102,241,0.1)", borderRadius: 20, marginTop: 6, display: "inline-block" }}>
                            {rs.prize}
                          </div>
                        )}
                        <BadgeGrid earned={entry.badges || []} compact={true} />
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Full top-10 table */}
              <div style={{ background: "var(--bg2)", border: "1.5px solid var(--border)", borderRadius: 14, overflow: "hidden" }}>
                <div style={{ padding: "10px 16px", background: "var(--bg3)", borderBottom: "1px solid var(--border)", fontSize: 11, fontWeight: 800, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Top 10 · {monthName}
                </div>
                {data.map((entry, i) => {
                  const rs   = rankStyle(entry.rank);
                  const isMe = entry.id === user?.uid;
                  const lvl  = getLevel(entry.points || 0);
                  return (
                    <div key={entry.id} style={{
                      display: "grid", gridTemplateColumns: "52px 1fr auto auto auto",
                      padding: "12px 16px", alignItems: "center", gap: 10,
                      borderBottom: i < data.length - 1 ? "1px solid var(--border)" : "none",
                      background: isMe ? "rgba(99,102,241,0.05)" : i % 2 ? "rgba(0,0,0,0.01)" : "transparent",
                    }}>
                      <div style={{ fontSize: entry.rank <= 3 ? 20 : 14, fontWeight: 900, color: rs.color, textAlign: "center" }}>
                        {rs.icon}
                      </div>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                          <span style={{ fontSize: 13, fontWeight: 800, color: isMe ? "var(--accent)" : "var(--text)" }}>
                            {entry.name || "Anonymous"}
                            {isMe && <span style={{ fontSize: 10, color: "var(--accent)", marginLeft: 4, fontWeight: 700 }}>(you)</span>}
                          </span>
                          <span title={lvl.name} style={{ fontSize: 11 }}>{lvl.icon}</span>
                          {rs.prize && (
                            <span style={{ fontSize: 9, fontWeight: 800, color: entry.rank === 1 ? "#d97706" : "var(--accent)", padding: "2px 6px", background: entry.rank === 1 ? "rgba(245,158,11,0.1)" : "rgba(99,102,241,0.08)", borderRadius: 20 }}>
                              {rs.prize}
                            </span>
                          )}
                        </div>
                        <div style={{ display: "flex", gap: 8, marginTop: 3 }}>
                          {entry.country && <span style={{ fontSize: 10, color: "var(--text3)" }}>🌍 {entry.country}</span>}
                          <span style={{ fontSize: 10, color: "var(--text3)" }}>📋 {entry.totalExams || 0} exams</span>
                          {(entry.streak || 0) > 0 && <span style={{ fontSize: 10, color: "#fb923c" }}>🔥 {entry.streak}d</span>}
                        </div>
                      </div>
                      <BadgeGrid earned={entry.badges || []} compact={true} />
                      <div style={{ fontSize: 11, color: "var(--green)", fontWeight: 800 }}>
                        {entry.passRate || 0}%
                      </div>
                      <div style={{ fontSize: 16, fontWeight: 900, color: "var(--accent)", minWidth: 70, textAlign: "right" }}>
                        {(entry.points || 0).toLocaleString()}
                        <div style={{ fontSize: 9, color: "var(--text3)", fontWeight: 600 }}>pts</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {user && myRank === 0 && (
                <div style={{ padding: "14px 18px", background: "rgba(99,102,241,0.06)", border: "1.5px solid rgba(99,102,241,0.2)", borderRadius: 12, textAlign: "center", fontSize: 13, color: "var(--text2)" }}>
                  You're not in the top 10 yet.
                  {myData && ` You have ${(myData.points || 0).toLocaleString()} pts. `}
                  <strong style={{ color: "var(--accent)" }}>Keep studying daily to rank up!</strong>
                </div>
              )}

              <HowPointsWork />
            </>
          )}
        </div>
      )}

      {/* ── MY STATS TAB ── */}
      {view === "my-stats" && (
        <div style={{ animation: "slideIn 0.3s ease" }}>
          {!user ? (
            <div style={{ padding: "48px 20px", textAlign: "center" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🔐</div>
              <button onClick={() => setPage("auth")} style={{ padding: "12px 24px", background: "var(--gradient-accent,var(--accent))", border: "none", borderRadius: 12, color: "#fff", fontWeight: 800, cursor: "pointer", fontSize: 14, fontFamily: "inherit" }}>
                Sign In to See Your Stats →
              </button>
            </div>
          ) : !myData ? (
            <div style={{ padding: "48px 20px", textAlign: "center", color: "var(--text3)" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📊</div>
              <div style={{ fontSize: 15, fontWeight: 700 }}>No stats yet</div>
              <div style={{ fontSize: 13, marginTop: 6 }}>Complete your first exam to start earning points!</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {/* Level card */}
              <div style={{
                background: `linear-gradient(135deg,${myLevel.color}18,${myLevel.color}08)`,
                border: `1.5px solid ${myLevel.color}40`,
                borderRadius: 18, padding: "22px 24px",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <div>
                    <div style={{ fontSize: 30, marginBottom: 4 }}>{myLevel.icon}</div>
                    <div style={{ fontSize: 22, fontWeight: 900, color: myLevel.color }}>{myLevel.name}</div>
                    <div style={{ fontSize: 13, color: "var(--text2)", marginTop: 2 }}>
                      {myRank > 0 ? `Rank #${myRank} in Top 10 🏆` : "Not in Top 10 yet"} · {(myData.points || 0).toLocaleString()} points
                    </div>
                  </div>
                  <div style={{ fontSize: 48, opacity: 0.6 }}>{myLevel.icon}</div>
                </div>
                <LevelBar points={myData.points || 0} />
              </div>

              {/* Stats grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(140px,1fr))", gap: 10 }}>
                {[
                  { label: "Total Exams",  value: myData.totalExams || 0,                  icon: "📋", color: "var(--accent)"  },
                  { label: "Pass Rate",     value: `${myData.passRate || 0}%`,              icon: "✅", color: "var(--green)"  },
                  { label: "Best Score",    value: `${myData.bestScore || 0}%`,             icon: "🎯", color: "#f59e0b"       },
                  { label: "Total Points",  value: (myData.points||0).toLocaleString(),     icon: "💠", color: "var(--accent)" },
                  { label: "Badges Earned", value: myBadges.length,                         icon: "🏅", color: "#ec4899"       },
                  { label: "Best Streak",   value: `${myData.maxStreak || 0}d`,             icon: "🔥", color: "#fb923c"       },
                ].map((s, i) => (
                  <div key={i} style={{ background: "var(--bg2)", border: "1.5px solid var(--border)", borderRadius: 12, padding: "14px 12px", textAlign: "center" }}>
                    <div style={{ fontSize: 22, marginBottom: 4 }}>{s.icon}</div>
                    <div style={{ fontSize: 20, fontWeight: 900, color: s.color }}>{s.value}</div>
                    <div style={{ fontSize: 10, color: "var(--text3)", fontWeight: 600, marginTop: 2 }}>{s.label}</div>
                  </div>
                ))}
              </div>

              <StreakWidget streak={myData.streak || 0} maxStreak={myData.maxStreak || 0} />
              <PrizeProgressCard stats={myData} rank={myRank} data={data} />
            </div>
          )}
        </div>
      )}

      {/* ── BADGES TAB ── */}
      {view === "badges" && (
        <div style={{ animation: "slideIn 0.3s ease" }}>
          <div style={{ fontSize: 13, color: "var(--text2)", marginBottom: 16 }}>
            {myBadges.length > 0
              ? `You've earned ${myBadges.length} of ${BADGES.length} badges. Keep going!`
              : "Complete exams and build streaks to earn badges!"}
          </div>
          <BadgeGrid earned={myBadges.map(b => b.id)} />
        </div>
      )}
    </div>
  );
}
