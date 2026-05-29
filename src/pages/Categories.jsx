// pages/Categories.jsx — v4.0 Performance Edition
// ✅ لا getExams() — يستخدم exams من App.jsx مباشرة
// ✅ getVendors() فقط (خفيف) — بدون N+1
// ✅ انيميشن تدريجي بـ Intersection Observer
// ✅ Bottom Sheet على الهاتف

import React, { useState, useEffect, useMemo, useRef } from "react";
import { getVendors } from "../services/firestore";
import { Spinner, Empty } from "../components/UI";

const PI = ({ type, size = 20, color = "var(--accent)" }) => {
  const M = {
    arrow: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
    search: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
    question: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
    clock: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
    users: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    cert: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M8 14H4l-1 7h18l-1-7h-4"/><path d="M12 12v9"/><path d="M9 18l3 3 3-3"/></svg>,
    globe: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
    trending: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
    star: <svg width={size} height={size} viewBox="0 0 24 24" fill={color}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
    x: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
    filter: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>,
  };
  return M[type] || M.cert;
};

const DIFF_COLOR = { Easy:"var(--green)", Medium:"var(--gold)", Hard:"var(--red)" };

// ─── ExamRow ────────────────────────────────────────────────────
function ExamRow({ exam, vendorColor, onClick }) {
  const c = exam.color || vendorColor;
  return (
    <div onClick={onClick}
      style={{ display:"flex", alignItems:"center", gap:12, padding:"11px 14px", background:"var(--bg)", border:"1.5px solid var(--border)", borderRadius:13, cursor:"pointer", transition:"all 0.18s" }}
      onMouseEnter={e => { e.currentTarget.style.borderColor=`${c}55`; e.currentTarget.style.background=`${c}08`; e.currentTarget.style.transform="translateX(4px)"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor="var(--border)"; e.currentTarget.style.background="var(--bg)"; e.currentTarget.style.transform=""; }}>
      {exam.image ? (
        <img src={exam.image} alt={exam.title} loading="lazy" style={{ width:40, height:32, objectFit:"cover", borderRadius:8, flexShrink:0 }} />
      ) : (
        <div style={{ width:40, height:40, borderRadius:10, background:`${c}15`, border:`1.5px solid ${c}30`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
          <PI type="cert" size={18} color={c} />
        </div>
      )}
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:13, fontWeight:700, color:"var(--text)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{exam.title}</div>
        <div style={{ display:"flex", gap:8, marginTop:3, flexWrap:"wrap" }}>
          <span style={{ fontSize:10, color:"var(--text3)" }}>{exam.totalQuestions||0} Q · {exam.duration||60}m</span>
          {exam.difficulty && (
            <span style={{ fontSize:10, fontWeight:700, color:DIFF_COLOR[exam.difficulty]||"var(--text3)" }}>{exam.difficulty}</span>
          )}
        </div>
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:6, flexShrink:0 }}>
        {exam.attempts > 0 && (
          <span style={{ fontSize:10, color:"var(--text3)" }}>{(exam.attempts||0).toLocaleString()} <PI type="users" size={9} color="var(--text3)" /></span>
        )}
        <div style={{ width:28, height:28, borderRadius:8, background:`${c}12`, border:`1.5px solid ${c}30`, display:"flex", alignItems:"center", justifyContent:"center" }}>
          <PI type="arrow" size={12} color={c} />
        </div>
      </div>
    </div>
  );
}

// ─── Vendor Card مع IntersectionObserver ─────────────────────────
function VendorCard({ vendor, vendorExams, onViewAll, onExamClick, animIdx }) {
  const [expanded, setExpanded]   = useState(false);
  const [visible, setVisible]     = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.04 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const totalAttempts = vendorExams.reduce((s, e) => s + (e.attempts || 0), 0);
  const avgDuration   = vendorExams.length
    ? Math.round(vendorExams.reduce((s, e) => s + (e.duration || 60), 0) / vendorExams.length)
    : 0;

  return (
    <div
      ref={ref}
      style={{
        background: "var(--bg2)",
        border: `1.5px solid ${vendor.color}25`,
        borderRadius: 22, overflow: "hidden",
        boxShadow: "var(--card-shadow)",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(18px)",
        transition: visible
          ? `opacity 0.42s ease ${Math.min(animIdx, 5) * 70}ms, transform 0.32s cubic-bezier(0.16,1,0.3,1) ${Math.min(animIdx, 5) * 70}ms, box-shadow 0.28s, border-color 0.28s`
          : "none",
        position: "relative",
      }}
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow = `0 20px 56px ${vendor.color}20`;
        e.currentTarget.style.borderColor = `${vendor.color}50`;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = "var(--card-shadow)";
        e.currentTarget.style.borderColor = `${vendor.color}25`;
      }}
    >
      {/* Top bar */}
      <div style={{ height: 4, background: `linear-gradient(90deg, ${vendor.color}, ${vendor.color}66)` }} />

      {/* BG decoration */}
      <div style={{ position:"absolute", top:20, right:20, width:140, height:140, borderRadius:"50%", background:`radial-gradient(circle, ${vendor.color}10, transparent 70%)`, pointerEvents:"none" }} />

      <div style={{ padding:"26px 26px 0", position:"relative" }}>
        {/* Header */}
        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:14, marginBottom:20 }}>
          <div style={{ display:"flex", alignItems:"center", gap:16 }}>
            <div style={{ width:72, height:56, borderRadius:14, background:`${vendor.color}12`, border:`1.5px solid ${vendor.color}30`, display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden", flexShrink:0 }}>
              {vendor.image
                ? <img src={vendor.image} alt={vendor.name} loading="lazy" style={{ width:"100%", height:"100%", objectFit:"contain", padding:6 }} onError={e => { e.target.style.display="none"; }} />
                : <span style={{ fontSize:28 }}>{vendor.logo || "🏢"}</span>
              }
            </div>
            <div>
              <h3 style={{ fontSize:20, fontWeight:900, color:"var(--text)", lineHeight:1.2, marginBottom:4 }}>{vendor.name}</h3>
              {vendor.fullName && (
                <div style={{ fontSize:11, color:"var(--text3)", fontWeight:500 }}>{vendor.fullName}</div>
              )}
              <div style={{ display:"flex", gap:6, marginTop:6, flexWrap:"wrap" }}>
                <span style={{ fontSize:10, fontWeight:700, padding:"3px 9px", borderRadius:99, background:`${vendor.color}15`, color:vendor.color, border:`1px solid ${vendor.color}30` }}>
                  {vendorExams.length} Exam{vendorExams.length !== 1 ? "s" : ""}
                </span>
                {vendor.founded && (
                  <span style={{ fontSize:10, fontWeight:600, padding:"3px 9px", borderRadius:99, background:"var(--bg3)", color:"var(--text3)", border:"1px solid var(--border)" }}>
                    Est. {vendor.founded}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button onClick={() => setExpanded(!expanded)}
            style={{ background:`${vendor.color}12`, border:`1.5px solid ${vendor.color}40`, borderRadius:10, width:34, height:34, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", transition:"all 0.2s", color:vendor.color, fontSize:16, fontWeight:"bold", flexShrink:0 }}
            onMouseEnter={e => e.currentTarget.style.background=`${vendor.color}25`}
            onMouseLeave={e => e.currentTarget.style.background=`${vendor.color}12`}>
            {expanded ? "▲" : "▼"}
          </button>
        </div>

        {/* Stats row */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, marginBottom:20 }}>
          {[
            { icon:"📋", label:"Exams", value:vendorExams.length },
            { icon:"⏱️", label:"Avg Duration", value:`${avgDuration}m` },
            { icon:"👥", label:"Attempts", value:totalAttempts > 999 ? `${(totalAttempts/1000).toFixed(1)}K` : totalAttempts },
          ].map((s,si) => (
            <div key={si} style={{ background:"var(--bg3)", border:"1px solid var(--border)", borderRadius:12, padding:"12px 10px", textAlign:"center" }}>
              <div style={{ fontSize:18, marginBottom:4 }}>{s.icon}</div>
              <div style={{ fontSize:16, fontWeight:900, color:vendor.color }}>{s.value}</div>
              <div style={{ fontSize:10, color:"var(--text3)", fontWeight:600 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Expanded details */}
        {expanded && vendor.description && (
          <p style={{ fontSize:13, color:"var(--text2)", lineHeight:1.7, marginBottom:18, padding:"14px", background:"var(--bg3)", border:"1px solid var(--border)", borderRadius:12 }}>
            {vendor.description}
          </p>
        )}

        {/* Exams list */}
        {vendorExams.length > 0 ? (
          <div style={{ marginBottom:20 }}>
            <div style={{ fontSize:11, fontWeight:800, color:"var(--text3)", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:10 }}>
              {expanded ? "All Exams" : "Top Exams"}
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
              {(expanded ? vendorExams : vendorExams.slice(0, 4)).map(exam => (
                <ExamRow key={exam.id} exam={exam} vendorColor={vendor.color} onClick={() => onExamClick(exam)} />
              ))}
            </div>
            {!expanded && vendorExams.length > 4 && (
              <button onClick={() => setExpanded(true)}
                style={{ width:"100%", marginTop:8, padding:"9px", borderRadius:10, border:`1.5px dashed ${vendor.color}40`, background:"transparent", color:vendor.color, fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit", transition:"all 0.2s" }}
                onMouseEnter={e => e.currentTarget.style.background=`${vendor.color}08`}
                onMouseLeave={e => e.currentTarget.style.background="transparent"}>
                +{vendorExams.length - 4} more exams
              </button>
            )}
          </div>
        ) : (
          <div style={{ textAlign:"center", padding:"20px 0", fontSize:13, color:"var(--text3)", marginBottom:20 }}>
            📭 No exams available from this vendor yet
          </div>
        )}

        {/* View All */}
        <div style={{ marginBottom:24 }}>
          <button onClick={onViewAll}
            style={{ width:"100%", padding:"12px", borderRadius:12, border:`1.5px solid ${vendor.color}40`, background:`linear-gradient(135deg, ${vendor.color}18, ${vendor.color}08)`, color:vendor.color, fontSize:13, fontWeight:800, cursor:"pointer", fontFamily:"inherit", transition:"all 0.2s", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}
            onMouseEnter={e => e.currentTarget.style.background=`linear-gradient(135deg, ${vendor.color}30, ${vendor.color}18)`}
            onMouseLeave={e => e.currentTarget.style.background=`linear-gradient(135deg, ${vendor.color}18, ${vendor.color}08)`}>
            <PI type="globe" size={15} color={vendor.color} />
            Browse All {vendor.name} Exams ({vendorExams.length})
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Skeleton loader ─────────────────────────────────────────────
function Skeleton() {
  return (
    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(500px,1fr))", gap:28 }}>
      <style>{`@keyframes skPulse{0%,100%{opacity:0.5}50%{opacity:1}}`}</style>
      {[1,2,3,4].map(i => (
        <div key={i} style={{ background:"var(--bg2)", border:"1.5px solid var(--border)", borderRadius:22, height:220, animation:`skPulse 1.4s ease-in-out ${i*0.15}s infinite` }} />
      ))}
    </div>
  );
}

// ════════════════════════════════════════════
export default function Categories({ setPage, setActiveExam, exams: propExams = [] }) {
  const exams = useMemo(() => propExams.filter(e => e.isActive !== false), [propExams]);

  const [vendors, setVendors]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");

  // ✅ getVendors فقط — لا getExams()
  useEffect(() => {
    let cancelled = false;
    getVendors()
      .then(data => { if (!cancelled) { setVendors(data || []); setLoading(false); } })
      .catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const handleExamClick = (exam) => { setPage("exam-detail", { exam }); };

  // ✅ حسابات من propExams (لا Firestore)
  const vendorsWithExams = useMemo(() => {
    const q = search.toLowerCase();
    return vendors
      .map(vendor => ({
        ...vendor,
        vendorExams: exams.filter(e => (e.vendor || "").toLowerCase() === vendor.name.toLowerCase()),
      }))
      .filter(v => v.vendorExams.length > 0)
      .filter(v => !search || v.name.toLowerCase().includes(q))
      .sort((a, b) => b.vendorExams.length - a.vendorExams.length);
  }, [vendors, exams, search]);

  const totalExams    = exams.length;
  const totalVendors  = vendorsWithExams.length;
  const totalAttempts = exams.reduce((s, e) => s + (e.attempts || 0), 0);

  return (
    <div style={{ maxWidth:1280, margin:"0 auto", padding:"48px clamp(20px,4vw,36px) 80px" }}>
      <style>{`
        @media(max-width:768px){
          .cat-header-stats{flex-direction:column!important;align-items:flex-start!important}
          .cat-grid{grid-template-columns:1fr!important}
        }
        @media(max-width:480px){
          .cat-search-row{flex-direction:column!important;gap:10px!important}
        }
      `}</style>

      {/* Header */}
      <div className="fade-up" style={{ marginBottom:52 }}>
        <div style={{ fontSize:11, fontWeight:700, color:"var(--accent)", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:10 }}>
          Certification Vendors
        </div>
        <h1 style={{ fontSize:"clamp(28px,4vw,48px)", fontWeight:900, marginBottom:14, color:"var(--text)", letterSpacing:"-1.5px" }}>
          Browse by Certification Body
        </h1>
        <p style={{ fontSize:15, color:"var(--text2)", maxWidth:580, lineHeight:1.7 }}>
          Explore exams organized by the world's leading certification vendors — from AWS and Cisco to CompTIA and beyond.
        </p>

        {/* Stats bar */}
        <div className="cat-header-stats" style={{ display:"flex", gap:16, marginTop:28, flexWrap:"wrap" }}>
          {[
            { icon:"🏢", label:"Active Vendors",   value: totalVendors },
            { icon:"📋", label:"Total Exams",       value: totalExams },
            { icon:"👥", label:"Total Attempts",    value: totalAttempts > 999 ? `${Math.round(totalAttempts/1000)}K+` : totalAttempts },
          ].map((s,i) => (
            <div key={i} style={{ display:"flex", alignItems:"center", gap:10, background:"var(--bg2)", border:"1.5px solid var(--border)", borderRadius:12, padding:"10px 18px" }}>
              <span style={{ fontSize:20 }}>{s.icon}</span>
              <div>
                <div style={{ fontSize:18, fontWeight:900, color:"var(--text)" }}>{s.value}</div>
                <div style={{ fontSize:11, color:"var(--text3)", fontWeight:600 }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Search */}
      <div className="cat-search-row fade-up delay-1" style={{ display:"flex", gap:12, marginBottom:36, alignItems:"center" }}>
        <div style={{ position:"relative", flex:1, maxWidth:460 }}>
          <span style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }}>
            <PI type="search" size={15} color="var(--text3)" />
          </span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search vendor name…"
            style={{ width:"100%", padding:"12px 14px 12px 42px", borderRadius:13, background:"var(--bg2)", border:"1.5px solid var(--border)", color:"var(--text)", fontSize:14, outline:"none", fontFamily:"inherit", transition:"border-color 0.2s" }}
            onFocus={e => e.target.style.borderColor="var(--accent)"}
            onBlur={e => e.target.style.borderColor="var(--border)"}
          />
        </div>
        {search && (
          <button onClick={() => setSearch("")}
            style={{ padding:"12px 18px", borderRadius:13, border:"1.5px solid var(--border)", background:"var(--bg2)", color:"var(--text2)", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", gap:6, transition:"all 0.2s" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor="var(--red)"; e.currentTarget.style.color="var(--red)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor="var(--border)"; e.currentTarget.style.color="var(--text2)"; }}>
            <PI type="x" size={14} color="currentColor" /> Clear
          </button>
        )}
        <div style={{ fontSize:13, color:"var(--text3)", fontWeight:600, flexShrink:0 }}>
          {vendorsWithExams.length} vendor{vendorsWithExams.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <Skeleton />
      ) : vendorsWithExams.length === 0 ? (
        <div style={{ textAlign:"center", padding:"80px 20px", background:"var(--bg2)", border:"1.5px solid var(--border)", borderRadius:22 }}>
          <div style={{ fontSize:48, marginBottom:16 }}>🔍</div>
          <h3 style={{ fontSize:20, fontWeight:800, color:"var(--text)", marginBottom:8 }}>No vendors found</h3>
          <p style={{ color:"var(--text2)", fontSize:14, marginBottom:24 }}>
            {search ? `No results for "${search}"` : "Vendors will appear once exams are added"}
          </p>
          {search && (
            <button onClick={() => setSearch("")}
              style={{ padding:"11px 26px", borderRadius:11, background:"var(--gradient-accent)", border:"none", color:"#fff", fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
              Clear Search
            </button>
          )}
        </div>
      ) : (
        <div className="cat-grid" style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(500px,1fr))", gap:28 }}>
          {vendorsWithExams.map((vendor, idx) => (
            <VendorCard
              key={vendor.id}
              vendor={vendor}
              vendorExams={vendor.vendorExams}
              onViewAll={() => setPage("exams", { vendorFilter: vendor.name })}
              onExamClick={handleExamClick}
              animIdx={idx}
            />
          ))}
        </div>
      )}
    </div>
  );
}