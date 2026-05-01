// pages/Dashboard.jsx — v4.0 Performance Edition
// ✅ إصلاح جذري: Promise.all بدل for loop متسلسل لـ getUserExamStats
// ✅ انيميشن تدريجي + APK style
import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../hooks/useAuth";
import {
  getUserResults,
  updateUserProfile,
  getUserExamStats,
} from "../services/firestore";
import {
  Card, StatCard, Btn, Spinner,
  Empty, ProgressBar, Modal, Icon, Input,
} from "../components/UI";
import Certificate from "../components/Certificate";

export default function Dashboard({ setPage, setResultData, exams, showToast }) {
  const { user, profile, refreshProfile } = useAuth();
  const [results, setResults]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showCert, setShowCert]   = useState(null);
  const [editMode, setEditMode]   = useState(false);
  const [editForm, setEditForm]   = useState({ name: "", email: "" });
  const [tab, setTab]             = useState("overview");
  const [examStats, setExamStats] = useState({});

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    const loadDashboard = async () => {
      try {
        setLoading(true);
        const userResults = await getUserResults(user.uid);
        const recentResults = userResults
          .slice(0, 30)
          .sort((a, b) => new Date(b.date) - new Date(a.date));

        if (!cancelled) {
          setResults(recentResults);
          if (profile) setEditForm({ name: profile.name || "", email: user.email || "" });
        }

        // ✅ Promise.all بدل for loop — كل الطلبات تذهب معاً
        const uniqueExamIds = [...new Set(userResults.map(r => r.examId))];
        const statsArr = await Promise.all(
          uniqueExamIds.map(examId =>
            getUserExamStats(user.uid, examId)
              .then(s => s ? { examId, stat: s } : null)
              .catch(() => null)
          )
        );
        const statsMap = {};
        statsArr.forEach(item => { if (item) statsMap[item.examId] = item.stat; });

        if (!cancelled) { setExamStats(statsMap); setLoading(false); }
      } catch (err) {
        console.error("Dashboard load error:", err);
        if (!cancelled) setLoading(false);
      }
    };

    loadDashboard();
    return () => { cancelled = true; };
  }, [user?.uid]);

  if (!user) {
    return (
      <div style={{ textAlign:"center", padding:"140px 24px", background:"var(--gradient-hero)", minHeight:"60vh" }}>
        <div style={{ fontSize:80, marginBottom:28, animation:"float 3s ease-in-out infinite", display:"inline-block", filter:"drop-shadow(0 12px 24px var(--accent-glow))" }}>🔐</div>
        <h2 style={{ fontSize:32, fontWeight:800, color:"var(--text)", marginBottom:16, letterSpacing:"-1.5px" }}>Your Dashboard Awaits</h2>
        <p style={{ fontSize:16, color:"var(--text2)", marginBottom:36, lineHeight:1.7, maxWidth:500, margin:"0 auto 36px" }}>Sign in to see your progress, certificates, and full exam history.</p>
        <Btn size="lg" onClick={() => setPage("auth")} style={{ justifyContent:"center" }}>
          <Icon n="user" size={18} /> Sign In to Continue
        </Btn>
      </div>
    );
  }

  // ─── Stats ─────────────────────────────────────────────────────
  const passed           = results.filter(r => r.pass).length;
  const failed           = results.filter(r => !r.pass).length;
  const passRate         = results.length ? Math.round((passed / results.length) * 100) : 0;
  const scoredResults    = results.filter(r => r.score);
  const avg              = scoredResults.length ? Math.round(scoredResults.reduce((s,r) => s+r.score, 0) / scoredResults.length) : 0;
  const totalTime        = results.reduce((s,r) => s+(r.timeTaken||0), 0);
  const certificatesCount= results.filter(r => r.mode === "examSimulation" && r.pass).length;

  const domainStats = useMemo(() => {
    const map = {};
    results.forEach(r => {
      (r.details || []).forEach(q => {
        if (!map[q.domain]) map[q.domain] = { correct:0, total:0 };
        map[q.domain].total++;
        if (q.isCorrect) map[q.domain].correct++;
      });
    });
    return map;
  }, [results]);

  const handleSaveProfile = async () => {
    try {
      await updateUserProfile(user.uid, { name: editForm.name });
      await refreshProfile();
      setEditMode(false);
      showToast({ msg:"✅ Profile updated successfully", type:"success" });
    } catch (err) {
      showToast({ msg:`Error: ${err.message}`, type:"error" });
    }
  };

  const displayName = profile?.name || user?.displayName || "User";
  const initial = displayName[0].toUpperCase();

  const TABS = [
    { id:"overview", label:"📊 Overview" },
    { id:"topics",   label:"📚 Topics" },
    { id:"my-exams-link", label:"📋 My Exams" },
  ];

  const STATS = [
    { label:"Total Attempts", value:results.length,          icon:"📋", color:"var(--accent)" },
    { label:"Passed",         value:passed,                  icon:"✅", color:"var(--green)" },
    { label:"Failed",         value:failed,                  icon:"⚠️", color:"var(--red)" },
    { label:"Average Score",  value:`${avg}%`,               icon:"📊", color:"var(--gold)" },
    { label:"Study Time",     value:`${Math.round(totalTime/3600)}h`, icon:"⏱️", color:"var(--purple)" },
    { label:"Certificates",   value:certificatesCount,       icon:"🎓", color:"var(--cyan)" },
  ];

  const ADVANCED = [
    { label:"Avg. Time/Exam",  value:`${results.length>0?Math.round(totalTime/results.length/60):0} min`, color:"var(--accent)", icon:"⏱️" },
    { label:"Best Score",      value:`${results.length>0?Math.max(...results.map(r=>r.score||0)):0}%`,    color:"var(--green)", icon:"🏆" },
    { label:"Unique Exams",    value:[...new Set(results.map(r=>r.examId))].length,                        color:"var(--cyan)", icon:"📋" },
    { label:"Pass Rate",       value:`${passRate}%`,         color:passRate>=70?"var(--green)":"var(--red)", icon:"🎯" },
    { label:"Total Study",     value:`${Math.round(totalTime/3600)}h ${Math.round((totalTime%3600)/60)}m`, color:"var(--purple)", icon:"📚" },
    { label:"Certificates",    value:certificatesCount,      color:"var(--gold)", icon:"🎓" },
    { label:"Worst Score",     value:`${scoredResults.length>0?Math.min(...scoredResults.map(r=>r.score)):0}%`, color:"var(--red)", icon:"📉" },
    { label:"Score Trend",     value:results.length>=2?((results[0]?.score||0)>(results[results.length-1]?.score||0)?"📈 Improving":"📊 Stable"):"—", color:"var(--accent)", icon:"📈" },
  ];

  return (
    <div style={{ maxWidth:1300, margin:"0 auto", padding:"48px clamp(20px,4vw,48px) 80px" }}>
      <style>{`
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
        @media(max-width:768px){
          .dash-profile{flex-direction:column!important;align-items:flex-start!important;padding:24px 20px!important}
          .dash-stats{grid-template-columns:repeat(2,1fr)!important}
          .dash-cards{grid-template-columns:1fr!important}
          .dash-tabs{overflow-x:auto!important;flex-wrap:nowrap!important;scrollbar-width:none}
          .dash-tabs::-webkit-scrollbar{display:none}
        }
        @media(max-width:480px){
          .dash-stats{grid-template-columns:repeat(2,1fr)!important;gap:10px!important}
        }
      `}</style>

      {/* Profile Header */}
      <div className="dash-profile fade-up" style={{ display:"flex", alignItems:"center", gap:24, marginBottom:40, flexWrap:"wrap", background:"linear-gradient(135deg, var(--bg2) 0%, var(--accent-soft) 100%)", border:"1.5px solid rgba(99,102,241,0.2)", borderRadius:24, padding:"32px 40px", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", top:-60, right:-60, width:200, height:200, borderRadius:"50%", background:"radial-gradient(circle, var(--accent-glow), transparent 70%)", pointerEvents:"none" }} />
        <div style={{ width:80, height:80, borderRadius:20, background:"var(--gradient-accent)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:32, fontWeight:900, color:"#fff", flexShrink:0, boxShadow:"0 12px 32px var(--accent-glow)", position:"relative", zIndex:1 }}>
          {initial}
        </div>
        <div style={{ flex:1, position:"relative", zIndex:1 }}>
          <h2 style={{ fontSize:24, fontWeight:800, color:"var(--text)", marginBottom:6 }}>Welcome back, {displayName}! 👋</h2>
          <p style={{ color:"var(--text3)", fontSize:13, marginBottom:12 }}>{user?.email}</p>
          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
            <span style={{ padding:"4px 14px", borderRadius:99, background:"var(--accent-soft)", color:"var(--accent)", fontSize:11, fontWeight:700, border:"1px solid rgba(99,102,241,0.2)" }}>👨‍🎓 Student</span>
            {certificatesCount > 0 && (
              <span style={{ padding:"4px 14px", borderRadius:99, background:"rgba(217,119,6,0.12)", color:"var(--gold)", fontSize:11, fontWeight:700, border:"1px solid rgba(217,119,6,0.25)" }}>🏆 {certificatesCount} Certificate{certificatesCount>1?"s":""}</span>
            )}
            <span style={{ padding:"4px 14px", borderRadius:99, background:"rgba(5,150,105,0.12)", color:"var(--green)", fontSize:11, fontWeight:700, border:"1px solid rgba(5,150,105,0.25)" }}>✅ {passRate}% Pass Rate</span>
          </div>
        </div>
        <Btn variant="ghost" onClick={() => setEditMode(true)} style={{ position:"relative", zIndex:1, whiteSpace:"nowrap" }}>
          <Icon n="edit" size={14} /> Edit Profile
        </Btn>
      </div>

      {/* Tabs */}
      <div className="dash-tabs" style={{ display:"flex", gap:8, marginBottom:36, borderBottom:"2px solid var(--border)" }}>
        {TABS.map(t => (
          <button key={t.id}
            onClick={() => { if (t.id==="my-exams-link") { setPage("my-exams"); return; } setTab(t.id); }}
            style={{ padding:"14px 22px", borderRadius:"14px 14px 0 0", border:"none", background:tab===t.id?"var(--bg2)":"transparent", borderBottom:tab===t.id?"3px solid var(--accent)":"3px solid transparent", color:tab===t.id?"var(--accent)":"var(--text2)", cursor:"pointer", fontWeight:700, fontFamily:"inherit", fontSize:13, transition:"all 0.25s", whiteSpace:"nowrap" }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ textAlign:"center", padding:80 }}><Spinner size={44} color="var(--accent)" /></div>
      ) : tab === "overview" ? (
        <div>
          {/* Stats */}
          <div className="dash-stats" style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:18, marginBottom:32 }}>
            {STATS.map((s,i) => (
              <div key={i} className="fade-up" style={{ animationDelay:`${i*0.04}s` }}>
                <Card hover={false} style={{ borderRadius:20, background:"linear-gradient(135deg, var(--bg2) 0%, var(--bg3) 100%)", border:`1.5px solid ${s.color}22`, padding:"20px 24px" }}>
                  <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between" }}>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:11, color:"var(--text3)", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:10 }}>{s.label}</div>
                      <div style={{ fontSize:32, fontWeight:800, color:s.color }}>{s.value}</div>
                    </div>
                    <div style={{ width:56, height:56, borderRadius:16, background:`${s.color}18`, border:`2px solid ${s.color}28`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:26, flexShrink:0 }}>{s.icon}</div>
                  </div>
                </Card>
              </div>
            ))}
          </div>

          {/* Cards */}
          <div className="dash-cards" style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(400px,1fr))", gap:24 }}>
            <Card>
              <h3 style={{ fontWeight:800, marginBottom:20, fontSize:16, color:"var(--text)", display:"flex", alignItems:"center", gap:8 }}><Icon n="history" size={18} /> Recent Activity</h3>
              {results.slice(0,5).length === 0 ? (
                <p style={{ color:"var(--text3)", fontSize:13 }}>No recent activity</p>
              ) : results.slice(0,5).map((r,i) => (
                <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 0", borderBottom:i<4?"1px solid var(--border)":"none", gap:10 }}>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:700, fontSize:13, color:"var(--text)", marginBottom:2 }}>{r.examTitle}</div>
                    <div style={{ fontSize:11, color:"var(--text3)" }}>{r.date}</div>
                  </div>
                  <div style={{ fontWeight:800, fontSize:14, color:r.pass?"var(--green)":"var(--red)" }}>{r.score}%</div>
                </div>
              ))}
            </Card>

            <Card>
              <h3 style={{ fontWeight:800, marginBottom:20, fontSize:16, color:"var(--text)", display:"flex", alignItems:"center", gap:8 }}><Icon n="trending" size={18} /> Advanced Stats</h3>
              <div style={{ display:"flex", flexDirection:"column", gap:0 }}>
                {ADVANCED.map((s,i) => (
                  <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"11px 0", borderBottom:i<ADVANCED.length-1?"1px solid var(--border)":"none", gap:10 }}>
                    <span style={{ fontSize:13, color:"var(--text2)", display:"flex", alignItems:"center", gap:7 }}><span>{s.icon}</span>{s.label}</span>
                    <strong style={{ color:s.color, fontSize:13 }}>{s.value}</strong>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      ) : tab === "topics" ? (
        <Card>
          <h3 style={{ fontWeight:800, marginBottom:24, fontSize:16, color:"var(--text)", display:"flex", alignItems:"center", gap:8 }}><Icon n="book" size={18} /> Performance by Topic</h3>
          {Object.keys(domainStats).length === 0 ? (
            <Empty icon="📚" title="No topic data yet" subtitle="Complete exams to see your performance by topic" />
          ) : (
            Object.entries(domainStats)
              .sort((a,b) => (b[1].correct/b[1].total)-(a[1].correct/a[1].total))
              .slice(0,10)
              .map(([domain,{correct,total}]) => {
                const pct = Math.round((correct/total)*100);
                return (
                  <div key={domain} style={{ marginBottom:20 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
                      <span style={{ fontWeight:600, fontSize:13, color:"var(--text)" }}>{domain}</span>
                      <span style={{ fontSize:12, fontWeight:700, color:pct>=70?"var(--green)":pct>=50?"var(--gold)":"var(--red)" }}>{correct}/{total} ({pct}%)</span>
                    </div>
                    <ProgressBar value={correct} max={total} color={pct>=70?"linear-gradient(90deg,var(--green),#047857)":pct>=50?"linear-gradient(90deg,var(--gold),#d97706)":"linear-gradient(90deg,var(--red),#b91c1c)"} height={8} />
                  </div>
                );
              })
          )}
        </Card>
      ) : null}

      {/* Edit Modal */}
      {editMode && (
        <Modal title="✏️ Edit Your Profile" onClose={() => setEditMode(false)} maxWidth={500}>
          <Input label="Display Name" value={editForm.name} onChange={e => setEditForm(p=>({...p,name:e.target.value}))} placeholder="Your full name" />
          <Input label="Email Address (cannot be changed)" type="email" value={editForm.email} disabled />
          <div style={{ display:"flex", gap:10, marginTop:20 }}>
            <Btn onClick={handleSaveProfile} full>Save Changes</Btn>
            <Btn variant="ghost" onClick={() => setEditMode(false)}>Cancel</Btn>
          </div>
        </Modal>
      )}

      {/* Certificate Modal */}
      {showCert && (
        <Modal title="🏅 Your Certificate of Achievement" onClose={() => setShowCert(null)} maxWidth={900}>
          <Certificate
            key={`${showCert.examId}-${profile?.name||user?.displayName}-${Date.now()}`}
            userName={profile?.name || user?.displayName || showCert.userName}
            exam={exams?.find(e => e.id===showCert.examId) || { title:showCert.examTitle }}
            score={showCert.score}
            date={showCert.date}
          />
        </Modal>
      )}
    </div>
  );
}