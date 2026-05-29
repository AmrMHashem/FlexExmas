// pages/Favorites.jsx
import React, { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { getFavorites, removeFavorite } from "../services/favorites";
import { Spinner } from "../components/UI";

// ─── Guest Favorites via localStorage ─────────────────────────
const GUEST_FAV_KEY = "exampro_guest_favorites";
function getGuestFavorites() {
  try { return JSON.parse(localStorage.getItem(GUEST_FAV_KEY) || "[]"); } catch { return []; }
}
function setGuestFavorites(ids) {
  try { localStorage.setItem(GUEST_FAV_KEY, JSON.stringify(ids)); } catch {}
}

const ProIcon = ({ type, size = 20, color = "currentColor" }) => {
  const icons = {
    heart: <svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke={color} strokeWidth="0"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
    heartOutline: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
    trash: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>,
    certificate: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M8 14H4l-1 7h18l-1-7h-4"/><path d="M12 12v9"/><path d="M9 18l3 3 3-3"/></svg>,
    arrow: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
    question: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
    clock: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
    users: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    info: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
  };
  return icons[type] || null;
};

export default function Favorites({ setPage, setActiveExam, exams: allExams, showToast }) {
  const { user } = useAuth();
  const [favoriteIds, setFavoriteIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const isGuest = !user;

  useEffect(() => {
    if (isGuest) {
      setFavoriteIds(getGuestFavorites());
      setLoading(false);
      return;
    }
    getFavorites(user.uid)
      .then(ids => { setFavoriteIds(ids); setLoading(false); })
      .catch(() => setLoading(false));
  }, [user, isGuest]);

  const favoriteExams = (allExams || []).filter(e => favoriteIds.includes(e.id));

  const handleRemove = async (examId) => {
    if (isGuest) {
      const updated = favoriteIds.filter(id => id !== examId);
      setGuestFavorites(updated);
      setFavoriteIds(updated);
      showToast?.({ msg: "Removed from favorites", type: "info" });
      return;
    }
    try {
      await removeFavorite(user.uid, examId);
      setFavoriteIds(ids => ids.filter(id => id !== examId));
      showToast?.({ msg: "Removed from favorites", type: "info" });
    } catch {}
  };

  const handleExamClick = (exam) => { setPage("exam-detail", { exam }); };

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "48px clamp(20px,4vw,40px)" }}>
      {/* Header */}
      <div style={{ marginBottom: 40 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 12 }}>
          <div style={{
            width: 50, height: 50, borderRadius: 14,
            background: "rgba(248,113,113,0.12)",
            border: "1.5px solid rgba(248,113,113,0.3)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <ProIcon type="heart" size={24} color="#F87171" />
          </div>
          <div>
            <h1 style={{ fontSize: "clamp(22px,3vw,30px)", fontWeight: 900, color: "var(--text)", fontFamily: "'Space Grotesk',sans-serif", letterSpacing: "-1px" }}>
              My Favorites
            </h1>
            <p style={{ fontSize: 13, color: "var(--text3)" }}>
              {favoriteExams.length} saved exam{favoriteExams.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {/* Guest notice */}
        {isGuest && (
          <div style={{
            display: "flex", alignItems: "flex-start", gap: 10,
            background: "rgba(79,70,229,0.08)", border: "1.5px solid rgba(79,70,229,0.25)",
            borderRadius: 12, padding: "12px 16px", marginTop: 16,
          }}>
            <ProIcon type="info" size={16} color="var(--accent)" />
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--accent)", marginBottom: 3 }}>
                Browsing as Guest
              </div>
              <div style={{ fontSize: 12, color: "var(--text2)", lineHeight: 1.5 }}>
                Your favorites are saved locally on this device.{" "}
                <button
                  onClick={() => setPage("auth", { mode: "register" })}
                  style={{ background: "none", border: "none", color: "var(--accent)", fontWeight: 700, cursor: "pointer", fontSize: 12, fontFamily: "inherit", padding: 0 }}
                >
                  Sign up
                </button>{" "}to sync across devices.
              </div>
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 80 }}>
          <Spinner size={40} color="var(--accent)" />
        </div>
      ) : favoriteExams.length === 0 ? (
        <div style={{
          textAlign: "center", padding: "80px 20px",
          background: "var(--bg2)", border: "1.5px solid var(--border2)",
          borderRadius: 22,
        }}>
          <div style={{
            width: 80, height: 80, borderRadius: 22,
            background: "rgba(248,113,113,0.08)",
            border: "1.5px solid rgba(248,113,113,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 20px",
          }}>
            <ProIcon type="heartOutline" size={36} color="#F87171" />
          </div>
          <h3 style={{ fontSize: 20, fontWeight: 800, color: "var(--text)", marginBottom: 8, fontFamily: "'Space Grotesk',sans-serif" }}>
            No favorites yet
          </h3>
          <p style={{ color: "var(--text2)", fontSize: 14, marginBottom: 24, maxWidth: 340, margin: "0 auto 24px" }}>
            Click the ❤️ heart icon on any exam card to save it here — no sign-in required.
          </p>
          <button onClick={() => setPage("exams")} style={{
            padding: "12px 28px", borderRadius: 12,
            background: "var(--gradient-accent)", border: "none",
            color: "#fff", fontSize: 14, fontWeight: 700,
            cursor: "pointer", fontFamily: "inherit",
          }}>
            Browse Exams
          </button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 20 }}>
          {favoriteExams.map((exam, idx) => {
            const color = exam.color || "#6366F1";
            return (
              <div
                key={exam.id}
                className={`fade-up delay-${Math.min(idx + 1, 6)}`}
                style={{
                  background: "var(--bg2)", border: "1.5px solid var(--border2)",
                  borderRadius: 18, overflow: "hidden",
                  transition: "all 0.3s cubic-bezier(0.16,1,0.3,1)",
                  position: "relative",
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-5px)"; e.currentTarget.style.boxShadow = `0 18px 36px ${color}20`; e.currentTarget.style.borderColor = `${color}50`; }}
                onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; e.currentTarget.style.borderColor = "var(--border2)"; }}
              >
                {/* Thumbnail */}
                <div style={{
                  height: 170, background: `linear-gradient(145deg,${color}22,${color}08)`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  position: "relative", overflow: "hidden", cursor: "pointer",
                  borderBottom: "1px solid var(--border)",
                }} onClick={() => handleExamClick(exam)}>
                  {exam.image ? (
                    <img src={exam.image} alt={exam.title} style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", inset: 0 }} />
                  ) : (
                    <div style={{ width: 72, height: 72, borderRadius: 20, background: `${color}22`, border: `2px solid ${color}35`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <ProIcon type="certificate" size={34} color={color} />
                    </div>
                  )}
                  {/* Remove button */}
                  <button
                    onClick={(e) => { e.stopPropagation(); handleRemove(exam.id); }}
                    title="Remove from favorites"
                    style={{
                      position: "absolute", top: 10, right: 10,
                      width: 34, height: 34, borderRadius: 10,
                      background: "rgba(248,113,113,0.25)",
                      border: "1.5px solid rgba(248,113,113,0.5)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      cursor: "pointer", backdropFilter: "blur(8px)",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = "rgba(248,113,113,0.5)"; e.currentTarget.style.transform = "scale(1.1)"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "rgba(248,113,113,0.25)"; e.currentTarget.style.transform = ""; }}
                  >
                    <ProIcon type="trash" size={15} color="#F87171" />
                  </button>
                </div>

                {/* Body */}
                <div style={{ padding: "14px 16px", cursor: "pointer" }} onClick={() => handleExamClick(exam)}>
                  <div style={{ display: "flex", gap: 5, marginBottom: 7, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 99, background: `${color}15`, color, border: `1px solid ${color}25` }}>{exam.category || exam.vendor || "Exam"}</span>
                    <span style={{
                      fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 99,
                      background: exam.difficulty === "Easy" ? "rgba(16,185,129,0.1)" : exam.difficulty === "Hard" ? "rgba(239,68,68,0.1)" : "rgba(245,158,11,0.1)",
                      color: exam.difficulty === "Easy" ? "var(--green)" : exam.difficulty === "Hard" ? "var(--red)" : "var(--gold)",
                    }}>{exam.difficulty || "Medium"}</span>
                  </div>
                  <h4 style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 10, fontFamily: "'Space Grotesk',sans-serif", lineHeight: 1.3 }}>{exam.title}</h4>
                  <div style={{ display: "flex", gap: 12, fontSize: 11, color: "var(--text3)", paddingTop: 10, borderTop: "1px solid var(--border)", alignItems: "center" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 3 }}><ProIcon type="question" size={11} color="var(--text3)" />{exam.totalQuestions || 0} Q</span>
                    <span style={{ display: "flex", alignItems: "center", gap: 3 }}><ProIcon type="clock" size={11} color="var(--text3)" />{exam.duration || 60}m</span>
                    <span style={{ display: "flex", alignItems: "center", gap: 3 }}><ProIcon type="users" size={11} color="var(--text3)" />{(exam.attempts || 0).toLocaleString()}</span>
                  </div>
                </div>
                <div style={{ padding: "0 14px 14px" }}>
                  <button onClick={() => handleExamClick(exam)} style={{
                    width: "100%", padding: "9px 0", borderRadius: 10,
                    background: color, border: "none",
                    color: "#fff", fontSize: 12, fontWeight: 700,
                    cursor: "pointer", fontFamily: "inherit",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    boxShadow: `0 4px 14px ${color}40`,
                    transition: "all 0.2s",
                  }}>
                    Start Practice <ProIcon type="arrow" size={13} color="#fff" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
