// pages/Exams.jsx — v5.0 SEO + optimized FilterPanel + structured data
import React from "react";
import { useState, useEffect, useMemo, useCallback } from "react";
import FloatingChat from "../components/FloatingChat";
import { useAuth } from "../hooks/useAuth";
import {
  addFavorite, removeFavorite, getFavorites,
} from "../services/firestore";
import { getUserEnrollments } from "../services/enrollments";
import { Spinner, Empty } from "../components/UI";

const GUEST_FAV_KEY = "exampro_guest_favorites";
function getGuestFavorites() {
  try { return JSON.parse(localStorage.getItem(GUEST_FAV_KEY) || "[]"); } catch { return []; }
}
function setGuestFavorites(ids) {
  try { localStorage.setItem(GUEST_FAV_KEY, JSON.stringify(ids)); } catch {}
}
function addGuestFavorite(examId) {
  const current = getGuestFavorites();
  if (!current.includes(examId)) setGuestFavorites([...current, examId]);
}
function removeGuestFavorite(examId) {
  setGuestFavorites(getGuestFavorites().filter(id => id !== examId));
}

const PI = ({ type, size = 24, color = "var(--accent)" }) => {
  const icons = {
    heart: <svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
    heartOutline: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
    clock: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
    question: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
    users: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    arrow: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
    trending: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
    certificate: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}><circle cx="12" cy="8" r="4"/><path d="M8 14H4l-1 7h18l-1-7h-4"/><path d="M12 12v9"/><path d="M9 18l3 3 3-3"/></svg>,
    filter: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>,
    search: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
    x: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  };
  return icons[type] || icons.certificate;
};

const SORT_OPTIONS = [
  { value: "newest",  label: "Newest First" },
  { value: "popular", label: "Most Popular" },
  { value: "rating",  label: "Highest Rated" },
  { value: "name",    label: "Name A-Z" },
];

// ----------------------------------------------
//  MobileFilterSheet (unchanged)
// ----------------------------------------------
function MobileFilterSheet({ open, onClose, children }) {
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.6)",
          backdropFilter: "blur(4px)",
          zIndex: 1000,
          animation: "fadeIn 0.2s ease",
        }}
      />
      <div
        style={{
          position: "fixed",
          top: "70px",
          left: "50%",
          transform: "translateX(-50%)",
          width: "calc(100% - 32px)",
          maxWidth: "500px",
          maxHeight: "calc(100vh - 100px)",
          overflowY: "auto",
          background: "var(--bg2)",
          border: "2px solid var(--border)",
          borderRadius: 20,
          padding: "20px",
          zIndex: 1001,
          boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
          animation: "fadeInDown 0.3s cubic-bezier(0.16,1,0.3,1)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <h3 style={{ fontSize: 18, fontWeight: 800, color: "var(--text)" }}>Filters</h3>
          <button
            onClick={onClose}
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "var(--bg3)",
              border: "1.5px solid var(--border)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <PI type="x" size={18} color="var(--text2)" />
          </button>
        </div>
        {children}
        <button
          onClick={onClose}
          style={{
            marginTop: 20,
            width: "100%",
            padding: "12px",
            borderRadius: 12,
            background: "var(--gradient-accent)",
            border: "none",
            color: "#fff",
            fontSize: 14,
            fontWeight: 700,
            cursor: "pointer",
            minHeight: 44,
          }}
        >
          Apply Filters
        </button>
      </div>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fadeInDown {
          from {
            opacity: 0;
            transform: translate(-50%, -20px);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0);
          }
        }
      `}</style>
    </>
  );
}

// ----------------------------------------------
//  ExamCard (unchanged)
// ----------------------------------------------
const ExamCard = React.memo(function ExamCard({ exam, onClick, isFeatured, isFavorite, onToggleFavorite, user, isEnrolled, animDelay = 0 }) {
  const color = exam.color || "#4f46e5";
  const [hovered, setHovered] = useState(false);
  const [favLoading, setFavLoading] = useState(false);
  const [visible, setVisible] = useState(false);
  const cardRef = React.useRef(null);

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.08 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const handleFav = useCallback(async (e) => {
    e.stopPropagation();
    if (favLoading) return;
    setFavLoading(true);
    try { await onToggleFavorite(exam.id, isFavorite); } catch (err) { console.error(err); }
    finally { setFavLoading(false); }
  }, [favLoading, onToggleFavorite, exam.id, isFavorite]);

  const btnLabel = isEnrolled ? "Continue Learning" : "Enroll Now";
  const btnColor = isEnrolled ? "#059669" : color;

  return (
    <div ref={cardRef} onClick={onClick} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{ background: "var(--bg2)", border: isFeatured ? `2.5px solid ${color}` : "2px solid var(--border)", borderRadius: 16, overflow: "hidden", cursor: "pointer", display: "flex", flexDirection: "column", position: "relative", transition: "all 0.28s cubic-bezier(0.16,1,0.3,1)", boxShadow: hovered ? `0 18px 40px ${color}15` : isFeatured ? `0 6px 24px ${color}10` : "var(--card-shadow)", transform: hovered ? "translateY(-5px)" : "translateY(0)", borderColor: hovered ? color : isFeatured ? color : "var(--border)", height: "100%", opacity: visible ? 1 : 0, transition: visible ? `opacity 0.4s ease ${animDelay}ms, transform 0.28s cubic-bezier(0.16,1,0.3,1), box-shadow 0.28s, border-color 0.28s` : "none" }}>
      {isFeatured && <div style={{ position: "absolute", top: 12, left: 12, zIndex: 2, background: color, color: "#fff", fontSize: 9, fontWeight: 800, padding: "4px 10px", borderRadius: 99, letterSpacing: "0.07em", textTransform: "uppercase", border: "1.5px solid rgba(255,255,255,0.2)" }}>Featured</div>}
      <button onClick={handleFav} style={{ position: "absolute", top: 10, right: 10, zIndex: 3, width: 34, height: 34, borderRadius: 10, background: isFavorite ? "rgba(220,38,38,0.15)" : "var(--bg2)", border: isFavorite ? "2px solid rgba(207,8,8,0.4)" : "2px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", backdropFilter: "blur(8px)", transition: "all 0.2s cubic-bezier(0.34,1.2,0.64,1)", opacity: hovered || isFavorite ? 1 : 0 }} onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.15)"; e.currentTarget.style.background = "rgba(220,38,38,0.2)"; }} onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.background = isFavorite ? "rgba(220,38,38,0.15)" : "var(--bg2)"; }}>
        {favLoading ? <div style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid #dc2626", borderTopColor: "transparent", animation: "spin 0.6s linear infinite" }} /> : <PI type={isFavorite ? "heart" : "heartOutline"} size={15} color={isFavorite ? "#dc2626" : "var(--text3)"} />}
      </button>
      <div style={{ height: 170, background: `linear-gradient(145deg, ${color}10, ${color}05)`, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden", borderBottom: "2px solid var(--border)" }}>
        <div style={{ position: "absolute", top: -12, right: -12, width: 80, height: 80, borderRadius: "50%", background: `${color}12`, pointerEvents: "none" }} />
        {exam.image ? <img src={exam.image} alt={exam.title} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", inset: 0 }} /> : <div style={{ width: 60, height: 60, borderRadius: 14, background: `${color}10`, border: `2px solid ${color}35`, display: "flex", alignItems: "center", justifyContent: "center" }}><PI type="certificate" size={28} color={color} /></div>}
        {exam.topic && <span style={{ position: "absolute", bottom: 10, left: 10, zIndex: 2, fontSize: 9, fontWeight: 700, padding: "3px 9px", borderRadius: 99, background: `${color}DD`, color: "#fff", backdropFilter: "blur(6px)", border: "1px solid rgba(255,255,255,0.2)", textTransform: "uppercase" }}>{exam.topic}</span>}
        {exam.vendor && <span style={{ position: "absolute", top: 10, right: 10, zIndex: 2, fontSize: 8, fontWeight: 700, padding: "3px 7px", borderRadius: 6, background: "rgba(0,0,0,0.4)", color: "#fff", backdropFilter: "blur(6px)", textTransform: "uppercase" }}>{exam.vendor}</span>}
      </div>
      <div style={{ padding: "14px 13px 8px", flex: 1, display: "flex", flexDirection: "column" }}>
        <h4 style={{ fontSize: 15, fontWeight: 800, marginBottom: 5, color: "var(--text)", lineHeight: 1.3 }}>{exam.title}</h4>
        <p style={{ fontSize: 12, color: "var(--text3)", lineHeight: 1.5, marginBottom: 10, flex: 1, fontWeight: 500 }}>{exam.subtitle || exam.description || "Practice with real exam questions"}</p>
        <div style={{ display: "flex", gap: 10, fontSize: 11, color: "var(--text3)", paddingTop: 10, borderTop: "2px solid var(--border)", alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 3 }}><PI type="question" size={10} color="var(--text3)" />{exam.totalQuestions || exam.questionsCount || 0} Q</span>
          <span style={{ display: "flex", alignItems: "center", gap: 3 }}><PI type="clock" size={10} color="var(--text3)" />{exam.duration || 60}m</span>
          <span style={{ display: "flex", alignItems: "center", gap: 3 }}><PI type="users" size={10} color="var(--text3)" />{(exam.enrolledCount || exam.attempts || 0).toLocaleString()}</span>
        </div>
      </div>
      <div style={{ padding: "0 12px 12px" }}>
        <div style={{ width: "100%", padding: "10px 0", borderRadius: 10, background: hovered ? btnColor : `${btnColor}10`, border: `2px solid ${btnColor}40`, color: hovered ? "#fff" : btnColor, fontSize: 12.5, fontWeight: 700, textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, boxShadow: hovered ? `0 5px 16px ${btnColor}30` : "none", transition: "all 0.22s" }}>
          {btnLabel} <PI type="arrow" size={12} color={hovered ? "#fff" : btnColor} />
        </div>
      </div>
    </div>
  );
});

// ----------------------------------------------
//  FilterPanel - EXTRACTED as separate component with React.memo
// ----------------------------------------------
const FilterPanel = React.memo(function FilterPanel({
  search,
  setSearch,
  sortBy,
  setSortBy,
  selectedVendor,
  setSelectedVendor,
  selectedTopic,
  setSelectedTopic,
  vendorOptions,
  topicOptions,
  isFilterActive,
  clearFilters,
}) {
  return (
    <>
      <div style={{ marginBottom: 20 }}>
        <label style={{ fontSize: 11, fontWeight: 700, color: "var(--text2)", marginBottom: 6, display: "block", textTransform: "uppercase", letterSpacing: "0.06em" }}>Search</label>
        <div style={{ position: "relative" }}>
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); }}
            placeholder="Exam name or vendor..."
            style={{ width: "100%", padding: "9px 12px 9px 34px", borderRadius: 11, background: "var(--bg3)", border: "1.5px solid var(--border)", color: "var(--text)", fontSize: 13, outline: "none", fontFamily: "inherit" }}
            onFocus={e => e.target.style.borderColor = "var(--accent)"}
            onBlur={e => e.target.style.borderColor = "var(--border)"}
          />
          <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}><PI type="search" size={13} color="var(--text3)" /></span>
        </div>
      </div>
      <div style={{ marginBottom: 20 }}>
        <label style={{ fontSize: 11, fontWeight: 700, color: "var(--text2)", marginBottom: 6, display: "block", textTransform: "uppercase", letterSpacing: "0.06em" }}>Sort by</label>
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value)}
          style={{ width: "100%", padding: "9px 12px", borderRadius: 11, background: "var(--bg3)", border: "1.5px solid var(--border)", color: "var(--text)", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}
        >
          {SORT_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
      </div>
      <div style={{ marginBottom: 20 }}>
        <label style={{ fontSize: 11, fontWeight: 700, color: "var(--text2)", marginBottom: 8, display: "block", textTransform: "uppercase", letterSpacing: "0.06em" }}>Vendor</label>
        <div style={{ display: "flex", flexDirection: "column", gap: 7, maxHeight: 220, overflowY: "auto" }}>
          {vendorOptions.slice(0, 15).map(v => (
            <label key={v} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13 }}>
              <input
                type="radio"
                name="vendor"
                value={v}
                checked={selectedVendor === v}
                onChange={() => { setSelectedVendor(v); }}
                style={{ accentColor: "var(--accent)" }}
              />
              <span style={{ color: selectedVendor === v ? "var(--accent)" : "var(--text2)", fontWeight: selectedVendor === v ? 700 : 400 }}>{v}</span>
            </label>
          ))}
        </div>
      </div>
      <div>
        <label style={{ fontSize: 11, fontWeight: 700, color: "var(--text2)", marginBottom: 8, display: "block", textTransform: "uppercase", letterSpacing: "0.06em" }}>Topic</label>
        <div style={{ display: "flex", flexDirection: "column", gap: 7, maxHeight: 180, overflowY: "auto" }}>
          {topicOptions.slice(0, 15).map(t => (
            <label key={t} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13 }}>
              <input
                type="radio"
                name="topic"
                value={t}
                checked={selectedTopic === t}
                onChange={() => { setSelectedTopic(t); }}
                style={{ accentColor: "var(--accent)" }}
              />
              <span style={{ color: selectedTopic === t ? "var(--accent)" : "var(--text2)", fontWeight: selectedTopic === t ? 700 : 400 }}>{t}</span>
            </label>
          ))}
        </div>
      </div>
      {isFilterActive && (
        <button
          onClick={clearFilters}
          style={{ marginTop: 16, width: "100%", padding: "10px 0", borderRadius: 10, background: "var(--bg3)", border: "1.5px solid var(--border)", color: "var(--accent)", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s" }}
        >
          Clear all filters
        </button>
      )}
    </>
  );
});

// ----------------------------------------------
//  Main Exams Component with SEO
// ----------------------------------------------
export default function Exams({ setPage, setActiveExam, exams: allExams = [], vendorFilter, topicFilter, showToast, topic }) {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState([]);
  const [enrolledExamIds, setEnrolledExamIds] = useState([]);
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedVendor, setSelectedVendor] = useState(vendorFilter || "All");
  const [selectedTopic, setSelectedTopic] = useState(topicFilter || "All");
  const [sortBy, setSortBy] = useState("popular");
  const [visibleCount, setVisibleCount] = useState(12);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const vendorOptions = useMemo(() => ["All", ...new Set(allExams.map(e => e.vendor).filter(Boolean))], [allExams]);
  const topicOptions = useMemo(() => ["All", ...new Set(allExams.map(e => e.topic).filter(Boolean))], [allExams]);

  // SEO: Update meta tags dynamically
  useEffect(() => {
    const examCount = allExams.length;
    document.title = `All Certification Exams (${examCount}) | FlexExams`;
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', `Browse ${examCount} professional certification exams including AWS, Microsoft, Google, Cisco and more. Find the right exam for your career.`);
    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (!ogTitle) {
      ogTitle = document.createElement('meta');
      ogTitle.setAttribute('property', 'og:title');
      document.head.appendChild(ogTitle);
    }
    ogTitle.setAttribute('content', `All Certification Exams (${examCount})`);
    let ogDesc = document.querySelector('meta[property="og:description"]');
    if (!ogDesc) {
      ogDesc = document.createElement('meta');
      ogDesc.setAttribute('property', 'og:description');
      document.head.appendChild(ogDesc);
    }
    ogDesc.setAttribute('content', `Explore our complete library of ${examCount} certification practice exams. Start your journey today.`);
    let ogUrl = document.querySelector('meta[property="og:url"]');
    if (!ogUrl) {
      ogUrl = document.createElement('meta');
      ogUrl.setAttribute('property', 'og:url');
      document.head.appendChild(ogUrl);
    }
    ogUrl.setAttribute('content', window.location.href);
    // Twitter Card
    let twitterCard = document.querySelector('meta[name="twitter:card"]');
    if (!twitterCard) {
      twitterCard = document.createElement('meta');
      twitterCard.setAttribute('name', 'twitter:card');
      document.head.appendChild(twitterCard);
    }
    twitterCard.setAttribute('content', 'summary_large_image');
  }, [allExams.length]);

  // Structured data (Schema.org ItemList)
  useEffect(() => {
    if (allExams.length === 0) return;
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "ItemList",
      "name": "Certification Exams",
      "description": `A list of ${allExams.length} certification practice exams.`,
      "numberOfItems": allExams.length,
      "itemListElement": allExams.slice(0, 10).map((exam, idx) => ({
        "@type": "ListItem",
        "position": idx + 1,
        "item": {
          "@type": "Course",
          "name": exam.title,
          "description": exam.subtitle || exam.description,
          "url": `${window.location.origin}/exam/${exam.id}`,
          "provider": {
            "@type": "Organization",
            "name": exam.vendor || "FlexExams"
          }
        }
      }))
    };
    let script = document.querySelector('script[type="application/ld+json"][data-exams]');
    if (!script) {
      script = document.createElement('script');
      script.setAttribute('type', 'application/ld+json');
      script.setAttribute('data-exams', 'true');
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(structuredData);
  }, [allExams]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (user) {
        try {
          const [ids, favIds] = await Promise.all([getUserEnrollments(user.uid).catch(() => []), getFavorites(user.uid).catch(() => [])]);
          if (!cancelled) { setEnrolledExamIds(ids); setFavorites(favIds); }
        } catch {}
      } else {
        if (!cancelled) setFavorites(getGuestFavorites());
      }
      if (!cancelled) setLoadingMeta(false);
    };
    load();
    return () => { cancelled = true; };
  }, [user]);

  useEffect(() => {
    if (vendorFilter && vendorFilter !== "All") { setSelectedVendor(vendorFilter); setVisibleCount(12); }
  }, [vendorFilter]);
  useEffect(() => {
  // دعم كل من topic (من الـ URL) و topicFilter (للتوافق)
  const topicValue = topic || topicFilter;
  if (topicValue && topicValue !== "All") { 
    setSelectedTopic(topicValue); 
    setVisibleCount(12); 
  }
}, [topic, topicFilter]);

  const toggleFavorite = useCallback(async (examId, isCurrentlyFav) => {
    if (!user) {
      if (isCurrentlyFav) { removeGuestFavorite(examId); setFavorites(prev => prev.filter(id => id !== examId)); showToast?.({ msg: "Removed from favorites", type: "info" }); }
      else { addGuestFavorite(examId); setFavorites(prev => [...prev, examId]); showToast?.({ msg: "Added to favorites", type: "success" }); }
      return;
    }
    try {
      if (isCurrentlyFav) { await removeFavorite(user.uid, examId); setFavorites(prev => prev.filter(id => id !== examId)); showToast?.({ msg: "Removed from favorites", type: "info" }); }
      else { await addFavorite(user.uid, examId); setFavorites(prev => [...prev, examId]); showToast?.({ msg: "Added to favorites", type: "success" }); }
    } catch { showToast?.({ msg: "Could not update favorites", type: "error" }); }
  }, [user, showToast]);

  const filtered = useMemo(() => {
    let f = allExams.filter(e => {
      const matchQ = !search || e.title?.toLowerCase().includes(search.toLowerCase()) || e.vendor?.toLowerCase().includes(search.toLowerCase());
      const matchV = selectedVendor === "All" || e.vendor === selectedVendor;
      const matchT = selectedTopic === "All" || e.topic === selectedTopic;
      return matchQ && matchV && matchT;
    });
    switch (sortBy) {
      case "popular": return f.sort((a,b) => (b.attempts||0) - (a.attempts||0));
      case "rating":  return f.sort((a,b) => (b.rating||0) - (a.rating||0));
      case "name":    return f.sort((a,b) => (a.title||"").localeCompare(b.title||""));
      default:        return f.sort((a,b) => new Date(b.createdAt||0) - new Date(a.createdAt||0));
    }
  }, [allExams, search, selectedVendor, selectedTopic, sortBy]);

  const visibleExams = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;
  const isFilterActive = search !== "" || selectedVendor !== "All" || selectedTopic !== "All";

  const handleExamClick = useCallback((exam) => { setPage("exam-detail", { exam }); }, [setPage]);
  const clearFilters = useCallback(() => { setSearch(""); setSelectedVendor("All"); setSelectedTopic("All"); setSortBy("popular"); setVisibleCount(12); }, []);
  const handleLoadMore = useCallback(() => setVisibleCount(v => v + 12), []);

  const showLoading = allExams.length === 0 && loadingMeta;

  return (
    <div style={{ maxWidth: 1400, margin: "0 auto", padding: "40px clamp(14px, 3.5vw, 32px) 64px", overflowX: "hidden" }}>
      <div className="fade-up" style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Exam Library</div>
        <h1 style={{ fontSize: "clamp(24px, 4vw, 42px)", fontWeight: 900, marginBottom: 10, color: "var(--text)", letterSpacing: "-1px" }}>All Certification Exams</h1>
        <p style={{ fontSize: 14, color: "var(--text2)", lineHeight: 1.6 }}>{allExams.length > 0 ? `${allExams.length} professional exams to boost your career` : "Loading exams..."}</p>
      </div>

      {/* Mobile filter button */}
      <div className="mobile-filter-button">
        <button
          onClick={() => setMobileFiltersOpen(true)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 16px",
            borderRadius: 12,
            background: isFilterActive ? "var(--accent-soft)" : "var(--bg2)",
            border: `1.5px solid ${isFilterActive ? "var(--accent)" : "var(--border)"}`,
            color: isFilterActive ? "var(--accent)" : "var(--text2)",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            marginBottom: 20,
            minHeight: 44,
            width: "100%",
            justifyContent: "center",
          }}
        >
          <PI type="filter" size={14} color={isFilterActive ? "var(--accent)" : "var(--text2)"} />
          Filters {isFilterActive ? `(active)` : ""}
        </button>
      </div>

      {/* Desktop / Tablet layout */}
      <div style={{ display: "flex", gap: 28, alignItems: "flex-start" }}>
        <aside className="desktop-sidebar" style={{ width: "260px", flexShrink: 0 }}>
          <div style={{ background: "var(--bg2)", border: "2px solid var(--border)", borderRadius: 18, padding: "18px 16px", position: "sticky", top: "88px", boxShadow: "var(--card-shadow)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <h3 style={{ fontSize: 15, fontWeight: 800, color: "var(--text)" }}>Filters</h3>
              {isFilterActive && <button onClick={clearFilters} style={{ fontSize: 11, color: "var(--accent)", background: "none", border: "none", cursor: "pointer", fontWeight: 700 }}>Clear all</button>}
            </div>
            <FilterPanel
              search={search}
              setSearch={setSearch}
              sortBy={sortBy}
              setSortBy={setSortBy}
              selectedVendor={selectedVendor}
              setSelectedVendor={setSelectedVendor}
              selectedTopic={selectedTopic}
              setSelectedTopic={setSelectedTopic}
              vendorOptions={vendorOptions}
              topicOptions={topicOptions}
              isFilterActive={isFilterActive}
              clearFilters={clearFilters}
            />
          </div>
        </aside>

        <main style={{ flex: 1, minWidth: 0 }}>
          {showLoading ? (
            <div style={{ textAlign: "center", padding: 60 }}><Spinner size={36} color="var(--accent)" /></div>
          ) : filtered.length === 0 ? (
            <Empty icon="🔍" title="No exams match" subtitle="Try different filters or search terms" />
          ) : (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
                <span style={{ fontSize: 13, color: "var(--text3)" }}>Showing <strong style={{ color: "var(--accent)" }}>{visibleExams.length}</strong> of {filtered.length} exams</span>
                {isFilterActive && <span style={{ fontSize: 11, background: "var(--accent-soft)", padding: "4px 12px", borderRadius: 20, color: "var(--accent)", fontWeight: 600 }}>Filters applied</span>}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
                {visibleExams.map((exam, idx) => (
                  <ExamCard key={exam.id} exam={exam} onClick={() => handleExamClick(exam)} isFeatured={idx === 0 && !isFilterActive} isFavorite={favorites.includes(exam.id)} onToggleFavorite={toggleFavorite} user={user} isEnrolled={enrolledExamIds.includes(exam.id)} animDelay={Math.min(idx, 6) * 50} />
                ))}
              </div>
              {hasMore && (
                <div style={{ textAlign: "center", marginTop: 40 }}>
                  <button onClick={handleLoadMore} style={{ padding: "12px 32px", borderRadius: 40, border: "2px solid var(--border)", background: "var(--bg2)", color: "var(--text)", fontSize: 14, fontWeight: 600, cursor: "pointer", minHeight: 48, display: "inline-flex", alignItems: "center", gap: 8, transition: "all 0.2s" }} onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.color = "var(--accent)"; }} onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text)"; }}>Load More <PI type="trending" size={14} color="currentColor" /></button>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      <MobileFilterSheet open={mobileFiltersOpen} onClose={() => setMobileFiltersOpen(false)}>
        <FilterPanel
          search={search}
          setSearch={setSearch}
          sortBy={sortBy}
          setSortBy={setSortBy}
          selectedVendor={selectedVendor}
          setSelectedVendor={setSelectedVendor}
          selectedTopic={selectedTopic}
          setSelectedTopic={setSelectedTopic}
          vendorOptions={vendorOptions}
          topicOptions={topicOptions}
          isFilterActive={isFilterActive}
          clearFilters={clearFilters}
        />
      </MobileFilterSheet>

      <style>{`
        @media (max-width: 768px) {
          .desktop-sidebar { display: none !important; }
          .mobile-filter-button { display: block !important; }
          button { min-height: 44px; }
        }
        @media (min-width: 769px) {
          .mobile-filter-button { display: none !important; }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
      <FloatingChat />
    </div>
  );
}
