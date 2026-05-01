// pages/MyExams.jsx — v4.0 Performance Edition
// ✅ إصلاح: Promise.all بدل forEach للـ completion percentages
// ✅ انيميشن تدريجي + APK style
import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../hooks/useAuth";
import {
  getUserResults, getFavorites,
  getEnrolledExams, unenrollUserFromExam,
  getExamCompletionPercentage, clearExamProgress,
  getUserCertificates,
} from "../services/firestore";
import { Card, Btn, Spinner, Empty, ProgressBar, Icon, Modal } from "../components/UI";
import { generatePDFCertificate, getVerifyURL } from "../utils/pdfCertificate";

export default function MyExams({ setPage, setResultData, setActiveExam, exams, showToast }) {
  const { user } = useAuth();
  const [results, setResults]       = useState([]);
  const [enrolledExams, setEnrolledExams] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [tab, setTab]               = useState("enrolled");
  const [filter, setFilter]         = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy]         = useState("recent");
  const [completionPcts, setCompletionPcts] = useState({});
  const [unenrolling, setUnenrolling] = useState(null);
  const [certificates, setCertificates] = useState([]);
  const [loadingCerts, setLoadingCerts] = useState(false);

  // ✅ Promise.all لكل شيء معاً
  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    const load = async () => {
      try {
        const [r, enrolled] = await Promise.all([
          getUserResults(user.uid).catch(() => []),
          getEnrolledExams(user.uid).catch(() => []),
        ]);
        if (cancelled) return;

        setResults(r.slice(0,10).sort((a,b) => new Date(b.date)-new Date(a.date)));
        setEnrolledExams(enrolled || []);

        // ✅ كل طلبات completion في Promise.all واحد — لا forEach
        if (enrolled.length > 0 && exams.length > 0) {
          const pctResults = await Promise.all(
            enrolled.map(examId => {
              const exam = exams.find(e => e.id === examId);
              if (!exam) return Promise.resolve({ examId, pct: 0 });
              return getExamCompletionPercentage(user.uid, examId, exam.totalQuestions || 0)
                .then(pct => ({ examId, pct: pct || 0 }))
                .catch(() => ({ examId, pct: 0 }));
            })
          );
          if (!cancelled) {
            const map = {};
            pctResults.forEach(({ examId, pct }) => { map[examId] = pct; });
            setCompletionPcts(map);
          }
        }
        if (!cancelled) setLoading(false);
      } catch { if (!cancelled) setLoading(false); }
    };

    load();
    return () => { cancelled = true; };
  }, [user?.uid, exams.length]);

  // ✅ Certificates بشكل منفصل وخفيف
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setLoadingCerts(true);
    getUserCertificates(user.uid)
      .then(certs => { if (!cancelled) setCertificates(certs || []); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoadingCerts(false); });
    return () => { cancelled = true; };
  }, [user?.uid]);

  const uniqueLatestCertificates = useMemo(() => {
    const map = new Map();
    certificates.forEach(cert => {
      const d = cert.issuedAt?.toDate ? cert.issuedAt.toDate() : new Date(cert.date || 0);
      const ex = map.get(cert.examId);
      if (!ex || d > ex.dateObj) map.set(cert.examId, { cert, dateObj: d });
    });
    return [...map.values()]
      .map(v => v.cert)
      .sort((a,b) => {
        const da = a.issuedAt?.toDate ? a.issuedAt.toDate() : new Date(a.date||0);
        const db = b.issuedAt?.toDate ? b.issuedAt.toDate() : new Date(b.date||0);
        return db - da;
      });
  }, [certificates]);

  const uniqueEnrolledExams = useMemo(
    () => exams.filter(e => enrolledExams.includes(e.id)),
    [exams, enrolledExams]
  );

  const filteredEnrolled = useMemo(() => {
    let f = uniqueEnrolledExams;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      f = f.filter(e => e.title?.toLowerCase().includes(q) || e.vendor?.toLowerCase().includes(q));
    }
    if (sortBy === "recent") f = [...f].sort((a,b) => new Date(b.lastAccessDate||0)-new Date(a.lastAccessDate||0));
    else if (sortBy === "popular") f = [...f].sort((a,b) => (b.attempts||0)-(a.attempts||0));
    else if (sortBy === "title") f = [...f].sort((a,b) => (a.title||"").localeCompare(b.title||""));
    return f;
  }, [uniqueEnrolledExams, searchQuery, sortBy]);

  const filteredAttempts = useMemo(() => {
    let f = results;
    if (searchQuery.trim()) { const q = searchQuery.toLowerCase(); f = f.filter(r => r.examTitle?.toLowerCase().includes(q)); }
    if (filter === "passed") f = f.filter(r => r.pass);
    else if (filter === "failed") f = f.filter(r => !r.pass);
    if (sortBy === "score") f = [...f].sort((a,b) => b.score-a.score);
    else f = [...f].sort((a,b) => new Date(b.date)-new Date(a.date));
    return f;
  }, [results, searchQuery, filter, sortBy]);

  if (!user) {
    return (
      <div style={{ textAlign:"center", padding:"140px 24px", minHeight:"60vh" }}>
        <div style={{ fontSize:80, marginBottom:28, animation:"float 3s ease-in-out infinite", display:"inline-block" }}>🔐</div>
        <h2 style={{ fontSize:32, fontWeight:800, color:"var(--text)", marginBottom:16, letterSpacing:"-1.5px" }}>Your Exam Vault Awaits</h2>
        <p style={{ fontSize:16, color:"var(--text2)", marginBottom:36, lineHeight:1.7, maxWidth:500, margin:"0 auto 36px" }}>Sign in to access your attempts, progress, and certificates.</p>
        <Btn size="lg" onClick={() => setPage("auth")} style={{ justifyContent:"center" }}><Icon n="user" size={18} /> Sign In Now</Btn>
      </div>
    );
  }

  const passed           = results.filter(r => r.pass).length;
  const failed           = results.filter(r => !r.pass).length;
  const scoredResults    = results.filter(r => r.score);
  const avg              = scoredResults.length ? Math.round(scoredResults.reduce((s,r)=>s+r.score,0)/scoredResults.length) : 0;
  const certificatesCount = uniqueLatestCertificates.length;

  const handleViewResult  = r  => { setResultData(r); setPage("result"); };
  const handleStartExam   = ex => { setActiveExam(ex); setPage("exam-detail"); };
  const handleRetakeExam  = id => { const ex = exams.find(e=>e.id===id); if(ex){setActiveExam(ex);setPage("exam-detail");} };

  const handleUnenroll = async (examId) => {
    if (!window.confirm("Unenroll? Your progress will be deleted.")) return;
    setUnenrolling(examId);
    try {
      try { await clearExamProgress(user.uid, examId); } catch {}
      await unenrollUserFromExam(user.uid, examId);
      setEnrolledExams(p => p.filter(id=>id!==examId));
      setCompletionPcts(p => { const n={...p}; delete n[examId]; return n; });
      showToast({ msg:"✅ Successfully unenrolled", type:"success" });
    } catch (err) { showToast({ msg:`❌ Error: ${err.message}`, type:"error" }); }
    finally { setUnenrolling(null); }
  };

  const MODE_LABELS = {
    examSimulation: { label:"Exam Simulation", icon:"🎓", color:"#4f46e5" },
    fullPractice:   { label:"Full Practice",   icon:"📚", color:"#059669" },
    review:         { label:"Review Mode",     icon:"👁️", color:"#d97706" },
  };

  const STATS = [
    { label:"Total Attempts", value:results.length, sub:"Last 10 shown", icon:"📋", color:"var(--accent)" },
    { label:"Passed Exams", value:passed, sub:`${results.length?Math.round((passed/results.length)*100):0}% pass rate`, icon:"✅", color:"var(--green)" },
    { label:"Failed Exams", value:failed, sub:"Keep practicing!", icon:"⚠️", color:"var(--red)" },
    { label:"Average Score", value:`${avg}%`, sub:avg>=70?"Above threshold":"Below threshold", icon:"📊", color:avg>=70?"var(--green)":"var(--gold)" },
    { label:"Certificates", value:certificatesCount, sub:"Latest per exam", icon:"🎓", color:"var(--cyan)" },
    { label:"Enrolled", value:uniqueEnrolledExams.length, sub:"Active", icon:"📚", color:"var(--purple)" },
  ];

  return (
    <div style={{ maxWidth:1400, margin:"0 auto", padding:"48px clamp(20px,4vw,48px) 80px" }}>
      <style>{`
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
        @media(max-width:768px){
          .my-exams-stats{grid-template-columns:repeat(2,1fr)!important}
          .my-exams-grid{grid-template-columns:1fr!important}
          .my-exams-tabs{overflow-x:auto!important;flex-wrap:nowrap!important;scrollbar-width:none}
          .my-exams-tabs::-webkit-scrollbar{display:none}
          .my-exams-filters{flex-direction:column!important;align-items:flex-start!important}
          .attempt-row{flex-direction:column!important;gap:12px!important}
          .attempt-actions{flex-direction:row!important}
        }
        @media(max-width:480px){
          .my-exams-stats{grid-template-columns:repeat(2,1fr)!important;gap:10px!important}
        }
      `}</style>

      {/* Header */}
      <div className="fade-up" style={{ marginBottom:40 }}>
        <div style={{ fontSize:12, fontWeight:700, color:"var(--accent)", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:10 }}>Learning Dashboard</div>
        <h1 style={{ fontSize:"clamp(28px,5vw,48px)", fontWeight:900, marginBottom:14, color:"var(--text)", letterSpacing:"-2px" }}>Track Your Journey</h1>
        <p style={{ fontSize:15, color:"var(--text2)", lineHeight:1.7 }}>Monitor your progress, review past exams, and plan your next milestone.</p>
      </div>

      {/* Stats */}
      <div className="my-exams-stats fade-up delay-1" style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(190px,1fr))", gap:16, marginBottom:40 }}>
        {STATS.map((s,i) => (
          <Card key={i} hover={false} style={{ borderRadius:18, background:"var(--gradient-card)", border:`1.5px solid ${s.color}22`, padding:"20px 22px" }}>
            <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between" }}>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:10, color:"var(--text3)", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:8 }}>{s.label}</div>
                <div style={{ fontSize:26, fontWeight:800, color:s.color, lineHeight:1, marginBottom:5 }}>{s.value}</div>
                <div style={{ fontSize:10, color:"var(--text3)", fontWeight:600 }}>{s.sub}</div>
              </div>
              <div style={{ width:48, height:48, borderRadius:14, background:`${s.color}15`, border:`1.5px solid ${s.color}25`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:24, flexShrink:0 }}>{s.icon}</div>
            </div>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <div className="my-exams-tabs" style={{ display:"flex", gap:6, marginBottom:32, borderBottom:"2px solid var(--border)" }}>
        {[
          { id:"enrolled",     label:"Enrolled Exams", icon:"📝", count:uniqueEnrolledExams.length },
          { id:"attempts",     label:"My Attempts",    icon:"📋", count:results.length },
          { id:"certificates", label:"Certificates",   icon:"🎓", count:certificatesCount },
        ].map(t => (
          <button key={t.id} onClick={() => { setTab(t.id); setFilter("all"); }}
            style={{ padding:"13px 20px", borderRadius:"13px 13px 0 0", border:"none", background:tab===t.id?"var(--bg2)":"transparent", borderBottom:tab===t.id?"3px solid var(--accent)":"3px solid transparent", color:tab===t.id?"var(--accent)":"var(--text2)", cursor:"pointer", fontWeight:700, fontFamily:"inherit", fontSize:13, transition:"all 0.25s", display:"flex", alignItems:"center", gap:8, whiteSpace:"nowrap" }}>
            <span style={{ fontSize:16 }}>{t.icon}</span>
            {t.label}
            <span style={{ padding:"2px 8px", borderRadius:99, background:tab===t.id?"var(--accent-soft)":"var(--bg3)", color:tab===t.id?"var(--accent)":"var(--text3)", fontSize:11, fontWeight:800 }}>{t.count}</span>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="my-exams-filters" style={{ background:"var(--bg2)", border:"1.5px solid var(--border)", borderRadius:16, padding:"14px 18px", marginBottom:24, boxShadow:"var(--card-shadow)", display:"flex", gap:12, flexWrap:"wrap", alignItems:"center" }}>
        <div style={{ position:"relative", flex:1, minWidth:200 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth="2" style={{ position:"absolute", left:11, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} placeholder={tab==="enrolled"?"Search enrolled…":tab==="attempts"?"Search attempts…":"Search certificates…"} style={{ width:"100%", padding:"10px 12px 10px 34px", background:"var(--bg3)", border:"1.5px solid var(--border)", borderRadius:11, color:"var(--text)", fontSize:13, fontFamily:"inherit", outline:"none", transition:"border-color 0.2s" }} onFocus={e=>e.target.style.borderColor="var(--accent)"} onBlur={e=>e.target.style.borderColor="var(--border)"} />
          {searchQuery && <button onClick={()=>setSearchQuery("")} style={{ position:"absolute", right:9, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", color:"var(--text3)", cursor:"pointer", fontSize:16, lineHeight:1 }}>×</button>}
        </div>
        <select value={sortBy} onChange={e=>setSortBy(e.target.value)} style={{ padding:"9px 12px", borderRadius:10, border:"1.5px solid var(--border)", background:"var(--bg3)", color:"var(--text)", fontSize:12, cursor:"pointer", fontFamily:"inherit", fontWeight:600, outline:"none" }}>
          {tab==="enrolled"?<><option value="recent">Recent</option><option value="popular">Popular</option><option value="title">A-Z</option></>:<><option value="recent">Newest</option><option value="score">Highest Score</option></>}
        </select>
        {tab==="attempts" && (
          <div style={{ display:"flex", gap:4 }}>
            {[["all","All"],["passed","✅ Passed"],["failed","❌ Failed"]].map(([v,l])=>(
              <button key={v} onClick={()=>setFilter(v)} style={{ padding:"7px 11px", borderRadius:9, fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:"inherit", border:`1.5px solid ${filter===v?"var(--accent)":"var(--border)"}`, background:filter===v?"var(--accent-soft)":"var(--bg3)", color:filter===v?"var(--accent)":"var(--text2)", transition:"all 0.15s" }}>{l}</button>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ textAlign:"center", padding:80 }}><Spinner size={44} color="var(--accent)" /></div>
      ) : tab === "enrolled" ? (
        filteredEnrolled.length === 0 ? (
          <Empty icon="📝" title={searchQuery?"No exams match":"No enrolled exams yet"} subtitle={searchQuery?"Try different keywords":"Register for exams to start your journey."} action={<Btn onClick={()=>setPage("exams")}><Icon n="search" size={16}/> Browse Exams</Btn>} />
        ) : (
          <div className="my-exams-grid" style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(340px,1fr))", gap:22 }}>
            {filteredEnrolled.map((exam,idx) => {
              const lastAttempt = results.find(r=>r.examId===exam.id);
              const ec = exam.color || "var(--accent)";
              const pct = completionPcts[exam.id] || 0;
              return (
                <div key={exam.id} className="fade-up" style={{ animationDelay:`${Math.min(idx,5)*0.05}s` }}>
                  <Card glow style={{ borderRadius:22, border:`1.5px solid ${ec}22`, cursor:"pointer", overflow:"hidden", transition:"all 0.28s" }}
                    onClick={()=>handleStartExam(exam)}
                    onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-4px)";e.currentTarget.style.borderColor=`${ec}50`;}}
                    onMouseLeave={e=>{e.currentTarget.style.transform="";e.currentTarget.style.borderColor=`${ec}22`;}}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:18 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:12, flex:1 }}>
                        {exam.image ? (
                          <div style={{ width:60, height:60, borderRadius:16, overflow:"hidden", flexShrink:0 }}><img src={exam.image} alt={exam.title} loading="lazy" style={{ width:"100%", height:"100%", objectFit:"cover" }}/></div>
                        ) : (
                          <div style={{ width:60, height:60, borderRadius:16, background:`${ec}15`, border:`1.5px solid ${ec}25`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:26, flexShrink:0 }}>{exam.logo||"📋"}</div>
                        )}
                        <div style={{ flex:1, minWidth:0 }}>
                          <h4 style={{ fontSize:15, fontWeight:800, marginBottom:5, color:"var(--text)" }}>{exam.title}</h4>
                          <div style={{ fontSize:12, color:"var(--text3)" }}>{exam.vendor&&<span>{exam.vendor} · </span>}{exam.totalQuestions||0} Q</div>
                        </div>
                      </div>
                    </div>
                    <div style={{ marginBottom:16 }}>
                      <div style={{ fontSize:11, fontWeight:700, color:"var(--text3)", marginBottom:6, textTransform:"uppercase" }}>Progress: {pct}%</div>
                      <ProgressBar value={pct} max={100} color={ec} height={7} />
                    </div>
                    {lastAttempt && (
                      <div style={{ background:"var(--bg3)", borderRadius:12, padding:"12px 14px", marginBottom:16, fontSize:13 }}>
                        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                          <span style={{ color:"var(--text2)", fontWeight:600 }}>Last Attempt:</span>
                          <span style={{ color:lastAttempt.pass?"var(--green)":"var(--red)", fontWeight:700 }}>{lastAttempt.score}% {lastAttempt.pass?"✅":"❌"}</span>
                        </div>
                        <div style={{ fontSize:11, color:"var(--text3)" }}>{lastAttempt.date}</div>
                      </div>
                    )}
                    <div style={{ display:"flex", gap:9 }}>
                      <Btn full onClick={e=>{e.stopPropagation();handleStartExam(exam);}} style={{ background:`linear-gradient(135deg,${ec},${ec}cc)`, borderColor:"transparent", justifyContent:"center", flex:1 }}><Icon n="lightning" size={15}/> Start</Btn>
                      <Btn variant="ghost" loading={unenrolling===exam.id} onClick={e=>{e.stopPropagation();handleUnenroll(exam.id);}} style={{ color:"var(--red)", borderColor:"var(--red)", padding:"12px 16px" }} title="Unenroll"><Icon n="close" size={15}/></Btn>
                    </div>
                  </Card>
                </div>
              );
            })}
          </div>
        )
      ) : tab === "attempts" ? (
        filteredAttempts.length === 0 ? (
          <Empty icon="🎯" title={searchQuery?"No results":"No attempts yet"} subtitle="Start practicing to see your results here." action={<Btn onClick={()=>setPage("exams")}><Icon n="search" size={16}/> Browse Exams</Btn>} />
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {filteredAttempts.map((result, idx) => {
              const exam  = exams.find(e=>e.id===result.examId);
              const color = exam?.color || "#6366F1";
              const modeInfo = MODE_LABELS[result.mode] || { label:"Exam", icon:"📝", color:"var(--text3)" };
              return (
                <div key={result.id||idx} className="attempt-row"
                  style={{ background:"var(--bg2)", border:`1.5px solid ${result.pass?"rgba(5,150,105,0.22)":"rgba(220,38,38,0.18)"}`, borderRadius:15, padding:"15px 18px", display:"flex", alignItems:"center", gap:14, flexWrap:"wrap", transition:"all 0.22s" }}
                  onMouseEnter={e=>{e.currentTarget.style.transform="translateX(4px)";e.currentTarget.style.boxShadow=`0 8px 24px ${color}15`;}}
                  onMouseLeave={e=>{e.currentTarget.style.transform="";e.currentTarget.style.boxShadow="";}}>
                  <div style={{ width:60, height:60, borderRadius:"50%", flexShrink:0, background:result.pass?"rgba(5,150,105,0.12)":"rgba(220,38,38,0.1)", border:`2.5px solid ${result.pass?"rgba(5,150,105,0.4)":"rgba(220,38,38,0.35)"}`, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
                    <div style={{ fontSize:16, fontWeight:900, color:result.pass?"var(--green)":"var(--red)", lineHeight:1 }}>{result.score}%</div>
                    <div style={{ fontSize:8, fontWeight:800, color:result.pass?"var(--green)":"var(--red)", textTransform:"uppercase", marginTop:2 }}>{result.pass?"PASS":"FAIL"}</div>
                  </div>
                  <div style={{ flex:1, minWidth:160 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:5, marginBottom:4, flexWrap:"wrap" }}>
                      <span style={{ fontSize:9, fontWeight:700, padding:"2px 7px", borderRadius:99, background:`${modeInfo.color}15`, color:modeInfo.color, border:`1px solid ${modeInfo.color}28` }}>{modeInfo.icon} {modeInfo.label}</span>
                      <span style={{ fontSize:9, fontWeight:700, padding:"2px 7px", borderRadius:99, background:`${color}12`, color, border:`1px solid ${color}22` }}>{exam?.vendor||"Exam"}</span>
                    </div>
                    <div style={{ fontSize:14, fontWeight:700, color:"var(--text)", marginBottom:3, lineHeight:1.3 }}>{exam?.title||result.examTitle||"Exam"}</div>
                    <div style={{ display:"flex", gap:12, fontSize:11, color:"var(--text3)" }}>
                      <span>🕐 {result.date}</span>
                      <span>✅ {result.correct}/{result.total}</span>
                      <span>⏱️ {Math.round((result.timeTaken||0)/60)}m</span>
                    </div>
                    <div style={{ marginTop:7, height:3, background:"var(--bg3)", borderRadius:99, overflow:"hidden" }}>
                      <div style={{ height:"100%", width:`${result.score||0}%`, background:result.pass?"var(--green)":"var(--red)", borderRadius:99 }} />
                    </div>
                  </div>
                  <div className="attempt-actions" style={{ display:"flex", flexDirection:"column", gap:7, flexShrink:0 }}>
                    <button onClick={()=>handleViewResult(result)} style={{ padding:"8px 13px", borderRadius:9, border:`1.5px solid ${color}`, background:"transparent", color, fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:"inherit", transition:"all 0.18s", whiteSpace:"nowrap" }} onMouseEnter={e=>e.currentTarget.style.background=`${color}12`} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>View Results</button>
                    <button onClick={()=>handleRetakeExam(result.examId)} style={{ padding:"8px 13px", borderRadius:9, border:"none", background:color, color:"#fff", fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:"inherit", boxShadow:`0 3px 10px ${color}35`, whiteSpace:"nowrap" }}>Retake</button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        // Certificates
        loadingCerts ? (
          <div style={{ textAlign:"center", padding:80 }}><Spinner size={44} color="var(--accent)" /></div>
        ) : uniqueLatestCertificates.length === 0 ? (
          <Empty icon="🎓" title="No certificates yet" subtitle="Pass an Exam Simulation to earn a verified certificate." action={<Btn onClick={()=>setPage("exams")}>Browse Exams</Btn>} />
        ) : (
          <div style={{ display:"grid", gap:14 }}>
            {uniqueLatestCertificates
              .filter(c => searchQuery ? c.examTitle?.toLowerCase().includes(searchQuery.toLowerCase()) : true)
              .map(cert => {
                const exam = exams.find(e=>e.id===cert.examId);
                const color = exam?.color||"var(--accent)";
                return (
                  <div key={cert.certId} style={{ background:"var(--bg2)", border:`1.5px solid ${color}22`, borderRadius:18, padding:"18px 22px", display:"flex", alignItems:"center", flexWrap:"wrap", gap:14, transition:"all 0.2s" }} onMouseEnter={e=>e.currentTarget.style.borderColor=`${color}50`} onMouseLeave={e=>e.currentTarget.style.borderColor=`${color}22`}>
                    <div style={{ width:48, height:48, borderRadius:12, background:`${color}15`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:26 }}>🎓</div>
                    <div style={{ flex:1, minWidth:160 }}>
                      <h4 style={{ fontSize:15, fontWeight:700, marginBottom:4, color:"var(--text)" }}>{cert.examTitle}</h4>
                      <div style={{ display:"flex", gap:14, fontSize:12, color:"var(--text3)" }}>
                        <span>Score: <strong style={{ color }}>{cert.score}%</strong></span>
                        <span>Issued: {cert.date||new Date(cert.issuedAt?.toDate()).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div style={{ display:"flex", gap:9 }}>
                      <Btn size="sm" onClick={async()=>{
                        await generatePDFCertificate({ examTitle:cert.examTitle, userName:cert.userName, score:cert.score, date:cert.date, certId:cert.certId, examMode:"examSimulation", passed:true, filename:`${cert.examTitle.replace(/\s/g,"_")}_Certificate` });
                        showToast({ msg:"✅ Certificate downloaded", type:"success" });
                      }}><Icon n="download" size={13}/> PDF</Btn>
                      <Btn size="sm" variant="outline" onClick={()=>window.open(getVerifyURL(cert.certId),"_blank")}><Icon n="link" size={13}/> Verify</Btn>
                    </div>
                  </div>
                );
              })}
          </div>
        )
      )}
    </div>
  );
}