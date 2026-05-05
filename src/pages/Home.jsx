// pages/Home.jsx — v4.0 Performance Edition (معدل للهواتف)
// ✅ لا استدعاء getEnrolledCountForExam — يستخدم propExams مباشرة
// ✅ vendors/topics من propExams (لا Firestore إضافي)
// ✅ انيميشن تدريجي خفيف مع Intersection Observer
// ✅ تحسين كرت Exam of the Day للهواتف (عرض عمودي بدل الأفقي)

import React from "react";
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useAuth } from "../hooks/useAuth";
import { getVendors, getTopics } from "../services/firestore";
import { addFavorite, removeFavorite, getFavorites, mergeGuestFavorites } from "../services/firestore";
import { getUserEnrollments } from "../services/enrollments";
import { Spinner } from "../components/UI";
import DiagnosticCard from "./DiagnosticCard";

const GUEST_FAV_KEY = "FlexExams_guest_favorites";
function getGuestFavorites() {
  try { return JSON.parse(localStorage.getItem(GUEST_FAV_KEY) || "[]"); } catch { return []; }
}
function setGuestFavorites(ids) {
  try { localStorage.setItem(GUEST_FAV_KEY, JSON.stringify(ids)); } catch {}
}

const WELCOME_KEY = "FlexExams_welcome_shown";
function WelcomePopup({ user, profile }) {
  const [visible, setVisible] = React.useState(false);
  React.useEffect(() => {
    if (!user) return;
    if (!sessionStorage.getItem(WELCOME_KEY)) {
      const t = setTimeout(() => { setVisible(true); sessionStorage.setItem(WELCOME_KEY, "1"); }, 700);
      return () => clearTimeout(t);
    }
  }, [user]);
  if (!user || !visible) return null;
  const name = profile?.name || user?.displayName || "Champion";
  return (
    <div className="welcome-popup" style={{ position:"fixed", top:88, right:24, zIndex:9999, maxWidth:340, animation:"welcomeIn 0.5s cubic-bezier(0.16,1,0.3,1) both" }}>
      <style>{`@keyframes welcomeIn{from{opacity:0;transform:translateX(60px) scale(0.9)}to{opacity:1;transform:translateX(0) scale(1)}}`}</style>
      <div style={{ background:"rgba(255,255,255,0.1)", backdropFilter:"blur(28px)", border:"1.5px solid rgba(255,255,255,0.22)", borderRadius:22, padding:"18px 20px", boxShadow:"0 20px 60px rgba(79,70,229,0.28)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:14, position:"relative" }}>
          <div style={{ width:50, height:50, borderRadius:16, background:"linear-gradient(135deg,#7c3aed,#4f46e5)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, fontWeight:900, color:"#fff" }}>{name[0]?.toUpperCase()}</div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:15, fontWeight:800, color:"var(--text)", marginBottom:3 }}>Welcome back, {name}! 👋</div>
            <div style={{ fontSize:12, color:"var(--text2)", fontWeight:500 }}>Ready to ace your next certification?</div>
          </div>
          <button onClick={() => setVisible(false)} style={{ position:"absolute", top:-6, right:-6, width:22, height:22, borderRadius:"50%", background:"rgba(0,0,0,0.2)", border:"1px solid rgba(255,255,255,0.2)", color:"var(--text)", cursor:"pointer", fontSize:13, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"inherit" }}>×</button>
        </div>
        <div style={{ marginTop:14, height:3, borderRadius:99, background:"linear-gradient(90deg,#7c3aed,#4f46e5,#2563eb)" }} />
      </div>
    </div>
  );
}

function useCounter(target, duration = 1400) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      let start = 0;
      const step = target / (duration / 16);
      const timer = setInterval(() => {
        start = Math.min(start + step, target);
        setCount(Math.floor(start));
        if (start >= target) clearInterval(timer);
      }, 16);
    }, { threshold: 0.4 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration]);
  return [count, ref];
}

const PI = ({ type, size = 24, color = "var(--accent)" }) => {
  const M = {
    shield: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.25C17.25 22.15 21 17.25 21 12V7L12 2z"/><path d="M9 12l2 2 4-4"/></svg>,
    chart: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
    certificate: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M8 14H4l-1 7h18l-1-7h-4"/><path d="M12 12v9"/><path d="M9 18l3 3 3-3"/></svg>,
    target: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>,
    users: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    infinity: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 12c-2-2.5-4-4-6-4a4 4 0 0 0 0 8c2 0 4-1.5 6-4z"/><path d="M12 12c2 2.5 4 4 6 4a4 4 0 0 0 0-8c-2 0-4 1.5-6 4z"/></svg>,
    rocket: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg>,
    star: <svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke={color} strokeWidth="1.2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
    check: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
    clock: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
    question: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
    trending: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
    award: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>,
    zap: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
    globe: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
    arrow: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
    sparkle: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3L13.5 8.5L19 10L13.5 11.5L12 17L10.5 11.5L5 10L10.5 8.5Z"/></svg>,
    heart: <svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke={color} strokeWidth="0"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
    heartOutline: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
  };
  return M[type] || M.sparkle;
};

// HeroIllustration (معزول)
const HeroIllustration = React.memo(function HeroIllustration() {
  const [loaded, setLoaded] = React.useState(false);
  return (
    <div 
      style={{ 
        position: "relative", 
        width: "100%", 
        maxWidth: 560, 
        margin: "0 auto",
        isolation: "isolate",           
        transform: "translateZ(0)",        
        willChange: "transform",        
      }}
    >
      <style>{`
        @keyframes heroFloatCard1{0%,100%{transform:translateY(0) rotate(-2deg)}50%{transform:translateY(-10px) rotate(-2deg)}}
        @keyframes heroFloatCard2{0%,100%{transform:translateY(0) rotate(2deg)}50%{transform:translateY(-7px) rotate(2deg)}}
        @keyframes heroFloatCard3{0%,100%{transform:translateY(-3px) rotate(-1deg)}50%{transform:translateY(7px) rotate(-1deg)}}
        @keyframes heroFloatCard4{0%,100%{transform:translateY(0) rotate(1deg)}50%{transform:translateY(-8px) rotate(1deg)}}
        @keyframes heroProgressFill{from{width:0}to{width:var(--w)}}
        @keyframes heroCertGlow{0%,100%{box-shadow:0 0 20px rgba(99,102,241,0.4)}50%{box-shadow:0 0 40px rgba(168,85,247,0.7)}}
        @keyframes heroLaptopReveal{from{opacity:0;transform:scale(0.93) translateY(18px)}to{opacity:1;transform:scale(1) translateY(0)}}
        @keyframes heroPulseGlow{0%,100%{opacity:0.5}50%{opacity:0.9}}
      `}</style>

      <div style={{ 
        position:"absolute", 
        top:"30%", left:"15%", width:"70%", height:"50%", 
        background:"radial-gradient(ellipse, rgba(139,92,246,0.3) 0%, rgba(99,102,241,0.15) 40%, transparent 70%)", 
        filter:"blur(40px)", pointerEvents:"none", zIndex:0, 
        animation:"heroPulseGlow 4s ease-in-out infinite" 
      }} />
      
      <div style={{ 
        position:"relative", zIndex:2, 
        animation:loaded?"heroLaptopReveal 0.8s cubic-bezier(0.16,1,0.3,1) both":"none", 
        transform:"translateX(-55%)", marginLeft:"-10%", left:"22",
        willChange: "transform, opacity"
      }}>
        <img 
          src="https://i.postimg.cc/sgb27Ppt/b3b3f655-e2cc-42ec-a187-5992b394f90c.png" 
          alt="FlexExams Platform" 
          onLoad={()=>setLoaded(true)} 
          loading="eager" 
          style={{ 
            width:"130%", height:"auto", 
            filter:"drop-shadow(0 30px 60px rgba(99,102,241,0.4)) drop-shadow(0 10px 20px rgba(0,0,0,0.3))",
            willChange: "filter"
          }} 
        />
      </div>
      
      <div style={{ 
        position:"absolute", top:0, left:0, right:0, bottom:0, 
        perspective:"1200px", pointerEvents:"none", zIndex:10,
        isolation: "isolate" 
      }}>
        <div style={{ 
          position:"relative", width:"100%", height:"100%", 
          transform:"rotateY(-18deg) rotateX(4deg) rotateZ(5deg)", 
          transformStyle:"preserve-3d", transformOrigin:"center center",
          willChange: "transform"
        }}>
          <div style={{ 
            position:"absolute", top:"19%", left:"29%", 
            background:"linear-gradient(135deg, rgba(15,12,50,0.57), rgba(30,20,80,0.9))", 
            backdropFilter:"blur(2px)", border:"1.5px solid rgba(139,92,246,0.5)", borderRadius:"16px", 
            padding:"12px 14px", minWidth:"219px", boxShadow:"rgba(0,0,0,0.4) 0px 20px 40px", 
            animation:"heroFloatCard1 5s ease-in-out infinite 0.3s",
            willChange: "transform"
          }}>
            <div style={{ fontSize:14, color:"rgba(196,181,253,0.9)", fontWeight:700, marginBottom:8, letterSpacing:"0.08em", textTransform:"uppercase" }}>Certifications Progress</div>
            {[{ name:"AWS Solutions Architect", pct:75, color:"#f97316" },{ name:"CCNA Networking", pct:85, color:"#10b981" },{ name:"CompTIA Security+", pct:60, color:"#a855f7" }].map((item,i)=>(
              <div key={i} style={{ marginBottom:i<2?8:0 }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
                  <span style={{ fontSize:9, color:"rgba(255,255,255,0.75)", fontWeight:500 }}>{item.name}</span>
                  <span style={{ fontSize:9, color:item.color, fontWeight:700 }}>{item.pct}%</span>
                </div>
                <div style={{ height:4, borderRadius:99, background:"rgba(255,255,255,0.1)", overflow:"hidden" }}>
                  <div style={{ 
                    height:"100%", borderRadius:99, background:`linear-gradient(90deg, ${item.color}, ${item.color}aa)`, 
                    width:`${item.pct}%`, animation:`heroProgressFill 1.5s ${0.5+i*0.3}s cubic-bezier(0.16,1,0.3,1) both` 
                  }} />
                </div>
              </div>
            ))}
          </div>
          
          <div style={{ 
            position:"absolute", top:"0%", right:"15%", 
            background:"linear-gradient(135deg, #2f2b6d, #edab3a)", borderRadius:16, padding:"12px 16px", 
            minWidth:110, textAlign:"center", boxShadow:"0 20px 40px rgba(79,70,229,0.5)", 
            animation:"heroFloatCard2 4s ease-in-out infinite 0.6s, heroCertGlow 3s ease-in-out infinite", 
            border:"1.5px solid rgba(255,255,255,0.2)",
            willChange: "transform, box-shadow"
          }}>
            <div style={{ width:38, height:38, borderRadius:"50%", background:"rgba(255,255,255,0.2)", margin:"0 auto 6px", display:"flex", alignItems:"center", justifyContent:"center", border:"2px solid rgba(255,255,255,0.4)" }}><svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="5"><polyline points="20 6 9 17 4 12"/></svg></div>
            <div style={{ fontSize:11, fontWeight:800, color:"#fff", letterSpacing:"0.05em" }}>CERTIFIED</div>
            <div style={{ fontSize:8, color:"rgba(255,255,255,0.75)", marginTop:2, fontWeight:600 }}>Professional</div>
          </div>
          
          <div style={{ 
            position:"absolute", bottom:"30%", left:"33%", 
            background:"linear-gradient(135deg, rgba(5,15,40,0.96), rgba(15,10,60,0.92))", 
            border:"1.5px solid rgba(16,185,129,0.5)", backdropFilter:"blur(20px)", borderRadius:14, 
            padding:"10px 14px", minWidth:110, textAlign:"center", boxShadow:"0 20px 40px rgba(0,0,0,0.4)", 
            animation:"heroFloatCard3 5.5s ease-in-out infinite 1s",
            willChange: "transform"
          }}>
            <div style={{ fontSize:28, fontWeight:900, color:"#10b981", fontFamily:"'Plus Jakarta Sans',sans-serif", lineHeight:1 }}>98%</div>
            <div style={{ fontSize:9, color:"rgba(255,255,255,0.6)", marginTop:2, fontWeight:600 }}>Pass Rate</div>
            <div style={{ marginTop:6, fontSize:8, fontWeight:700, padding:"2px 6px", borderRadius:99, background:"rgba(16,185,129,0.15)", color:"#10b981", border:"1px solid rgba(16,185,129,0.4)" }}>Top Performer</div>
          </div>
          
          <div style={{ 
            position:"absolute", bottom:"31%", right:"-8%", 
            background:"linear-gradient(135deg, rgba(10,8,40,0.96), rgba(25,15,70,0.92))", 
            border:"1.5px solid rgba(139,92,246,0.4)", backdropFilter:"blur(2px)", borderRadius:12, 
            padding:"10px 12px", minWidth:170, boxShadow:"0 20px 40px rgba(0,0,0,0.4)", 
            animation:"heroFloatCard4 4.8s ease-in-out infinite 0.8s",
            willChange: "transform"
          }}>
            <div style={{ fontSize:9, color:"rgba(255,255,255,0.65)", marginBottom:6, fontWeight:500 }}>Which service provides auto-scaling?</div>
            <div style={{ display:"flex", gap:5 }}>
              <div style={{ padding:"4px 8px", borderRadius:99, fontSize:8.5, fontWeight:700, background:"rgba(99,102,241,0.2)", color:"#818cf8", border:"1px solid rgba(99,102,241,0.5)" }}>EC2 Auto Scaling ✓</div>
              <div style={{ padding:"4px 8px", borderRadius:99, fontSize:8.5, fontWeight:600, background:"rgba(255,255,255,0.06)", color:"rgba(255,255,255,0.45)", border:"1px solid rgba(255,255,255,0.12)" }}>Lambda</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

const TESTIMONIALS = [
  {
    name: "Michael Chen",
    role: "Senior Cloud Architect",
    company: "Google",
    country: "USA",
    flag: "🇺🇸",
    text: "FlexExams adaptive algorithm pinpointed my weak areas across AWS and GCP. Scored 92% on the Professional Cloud Architect exam after just 14 days of focused practice.",
    rating: 5,
    color: "#4285f4",
    avatar: "MC",
    metric: "+42% score improvement",
    achievement: "Promoted to Lead Architect",
  },
  {
    name: "Aisha Al-Mansouri",
    role: "Cybersecurity Manager",
    company: "ADNOC",
    country: "UAE",
    flag: "🇦🇪",
    text: "The CISSP question bank is unmatched. Realistic scenarios and detailed explanations helped me clear the exam on first attempt. My team now uses FlexExams as our standard prep tool.",
    rating: 5,
    color: "#00a86b",
    avatar: "AA",
    metric: "100% first-time pass rate",
    achievement: "Team adoption across 12 members",
  },
  {
    name: "Elena Petrova",
    role: "DevOps Lead",
    company: "Spotify",
    country: "Sweden",
    flag: "🇸🇪",
    text: "FlexExams helped me bridge the gap between theory and real-world Kubernetes challenges. The exam simulator felt harder than the actual CKA — which is exactly what I needed.",
    rating: 5,
    color: "#1ed760",
    avatar: "EP",
    metric: "CKA certified in 4 weeks",
    achievement: "Cut cluster downtime by 30%",
  },
  {
    name: "Rahul Mehta",
    role: "Senior Data Engineer",
    company: "Microsoft",
    country: "India",
    flag: "🇮🇳",
    text: "The DP-203 practice exams were ridiculously accurate. I saw nearly identical questions on the real test. FlexExams turned my weak subject into a strength — scored 880/1000.",
    rating: 5,
    color: "#f25022",
    avatar: "RM",
    metric: "880/1000 score",
    achievement: "Azure Data Engineer Certified",
  },
  {
    name: "Carlos Mendez",
    role: "Network Security Specialist",
    company: "Cisco",
    country: "Mexico",
    flag: "🇲🇽",
    text: "CCNA and CCNP Security questions are updated monthly. The lab simulations and detailed answer breakdowns saved me dozens of hours. Highly recommended for serious network pros.",
    rating: 5,
    color: "#1ba0d7",
    avatar: "CM",
    metric: "CCNP certified in 8 weeks",
    achievement: "Top 5% in global practice scores",
  },
  {
    name: "Sophie Dubois",
    role: "IT Program Manager",
    company: "L'Oréal",
    country: "France",
    flag: "🇫🇷",
    text: "FlexExams analytics dashboard gave me the confidence to delegate study areas. The progress tracking and readiness score are incredibly precise — passed PMP with AT/AT/AT.",
    rating: 5,
    color: "#e3007e",
    avatar: "SD",
    metric: "PMP: Above Target in all domains",
    achievement: "Team productivity +25% post-certification",
  },
  {
    name: "James Okafor",
    role: "Solutions Architect",
    company: "AWS",
    country: "Nigeria",
    flag: "🇳🇬",
    text: "The AWS Solutions Architect Pro practice tests are brutal — exactly how the real exam feels. I failed twice before FlexExams, then passed with 89%. Worth every minute.",
    rating: 5,
    color: "#ff9900",
    avatar: "JO",
    metric: "89% passing score",
    achievement: "AWS Pro certified",
  },
  {
    name: "Yuki Nakamura",
    role: "Lead SRE",
    company: "Rakuten",
    country: "Japan",
    flag: "🇯🇵",
    text: "FlexExams is the only platform where the questions evolve with the exam blueprints. The Linux Foundation certifications are notoriously tough, but their KCNA and CKA tracks got me through.",
    rating: 5,
    color: "#bf0000",
    avatar: "YN",
    metric: "KCNA & CKA in 6 weeks",
    achievement: "Team lead promotion",
  },
  {
    name: "Emma Watson",
    role: "Security Compliance Officer",
    company: "J.P. Morgan",
    country: "UK",
    flag: "🇬🇧",
    text: "The CISM and CRISC content is enterprise-grade. FlexExams helped our entire compliance team prepare in half the usual time. Now a mandatory tool in our learning budget.",
    rating: 5,
    color: "#0a2540",
    avatar: "EW",
    metric: "Team pass rate: 94%",
    achievement: "Budget approved for entire org",
  },
];

function HorizontalTestimonialsStrip() {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [animating, setAnimating] = useState(false);
  const stripRef = useRef(null);
  const intervalRef = useRef(null);

  const goNext = useCallback(() => {
    if (animating) return;

    const strip = stripRef.current;
    if (!strip || !strip.children[0]) return;

    const cardWidth = strip.children[0].offsetWidth;
    const gap = 14;
    const shift = cardWidth + gap;

    setAnimating(true);
    strip.style.transition = 'transform 0.55s cubic-bezier(0.25, 0.1, 0.25, 1)';
    strip.style.transform = `translateX(${shift}px)`;

    const handleTransitionEnd = () => {
      strip.removeEventListener('transitionend', handleTransitionEnd);
      strip.style.transition = 'none';
      strip.style.transform = 'translateX(0)';
      setCurrentIdx(prev => (prev + 1) % TESTIMONIALS.length);
      setAnimating(false);
    };

    strip.addEventListener('transitionend', handleTransitionEnd);
  }, [animating]);

  useEffect(() => {
    intervalRef.current = setInterval(goNext, 4500);
    return () => clearInterval(intervalRef.current);
  }, [goNext]);

  const getCard = (offset) => {
    const idx = (currentIdx + offset + TESTIMONIALS.length) % TESTIMONIALS.length;
    return TESTIMONIALS[idx];
  };

  const positions = ['left', 'center', 'right'];
  const offsets = [1, 0, -1];

  return (
    <div style={{ width: "100%", overflow: "hidden" }}>
      <div
        ref={stripRef}
        style={{
          display: "flex",
          gap: 14,
          alignItems: "stretch",
          width: "100%",
          willChange: "transform",
        }}
      >
        {positions.map((pos, i) => {
          const offset = offsets[i];
          const t = getCard(offset);
          const isCenter = offset === 0;
          return (
            <div
              key={pos}
              style={{
                flex: 1,
                minWidth: 0,
                background: isCenter
                  ? "linear-gradient(135deg, rgba(20,14,60,0.95), rgba(40,20,90,0.88))"
                  : "rgba(12,9,35,0.55)",
                border: isCenter
                  ? "1.5px solid rgba(139,92,246,0.55)"
                  : "1px solid rgba(139,92,246,0.18)",
                borderRadius: 16,
                padding: "18px 22px",
                backdropFilter: "blur(16px)",
                opacity: isCenter ? 1 : 0.55,
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: "50%",
                    flexShrink: 0,
                    background: `linear-gradient(135deg, ${t.color}cc, ${t.color}55)`,
                    border: `1.5px solid ${t.color}66`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 13,
                    fontWeight: 800,
                    color: "#fff",
                  }}
                >
                  {t.avatar}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: "#fff",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {t.name}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ fontSize: 11 }}>{t.flag}</span>
                    <span style={{ fontSize: 9, color: "rgba(196,181,253,0.65)", fontWeight: 600 }}>
                      {t.country}
                    </span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 1 }}>
                  {Array(5)
                    .fill(0)
                    .map((_, si) => (
                      <svg
                        key={si}
                        width={11}
                        height={11}
                        viewBox="0 0 24 24"
                        fill={si < t.rating ? "#fbbf24" : "rgba(255,255,255,0.12)"}
                      >
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                    ))}
                </div>
              </div>

              <p
                style={{
                  fontSize: 12,
                  color: isCenter ? "rgba(255,255,255,0.88)" : "rgba(255,255,255,0.5)",
                  lineHeight: 1.65,
                  fontStyle: "italic",
                  flex: 1,
                  display: "-webkit-box",
                  WebkitLineClamp: 4,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                "{t.text}"
              </p>

              {isCenter && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    paddingTop: 8,
                    borderTop: "1px solid rgba(139,92,246,0.2)",
                  }}
                >
                  <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#10b981" }} />
                  <span style={{ fontSize: 9, color: "rgba(196,181,253,0.6)", fontWeight: 600 }}>
                    Verified Review • {t.role}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatCard({ num, suffix, label, iconType, accentColor }) {
  const numeric = parseInt(num.replace(/\D/g, ""), 10);
  const [count, ref] = useCounter(numeric, 1400);
  return (
    <div ref={ref} style={{ background:"var(--bg2)", border:"2px solid var(--border)", borderRadius:16, padding:"28px 24px", textAlign:"center", transition:"all 0.3s", cursor:"default", boxShadow:"var(--card-shadow)" }}
      onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-4px)";e.currentTarget.style.boxShadow=`0 16px 36px ${accentColor}20`;e.currentTarget.style.borderColor=accentColor;}}
      onMouseLeave={e=>{e.currentTarget.style.transform="";e.currentTarget.style.boxShadow="var(--card-shadow)";e.currentTarget.style.borderColor="var(--border)";}}>
      <div style={{ width:52, height:52, borderRadius:14, background:`${accentColor}10`, border:`2px solid ${accentColor}30`, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px" }}><PI type={iconType} size={24} color={accentColor} /></div>
      <div style={{ fontSize:"clamp(28px,4vw,40px)", fontWeight:800, color:accentColor, letterSpacing:"-1px", lineHeight:1, marginBottom:8 }}>{count.toLocaleString()}{suffix}</div>
      <div style={{ fontSize:12, color:"var(--text2)", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.07em" }}>{label}</div>
    </div>
  );
}

const ExamCard = React.memo(function ExamCard({ exam, onClick, isFeatured, isFavorite, onToggleFavorite, user, isEnrolled }) {
  const color = exam.color || "#4f46e5";
  const [hovered, setHovered] = useState(false);
  const [favLoading, setFavLoading] = useState(false);
  const [visible, setVisible] = useState(false);
  const cardRef = useRef(null);
  useEffect(() => {
    const el = cardRef.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.06 });
    obs.observe(el); return () => obs.disconnect();
  }, []);
  const handleFav = useCallback(async (e) => {
    e.stopPropagation(); if (favLoading) return;
    setFavLoading(true);
    try { await onToggleFavorite(exam.id, isFavorite); } catch {} finally { setFavLoading(false); }
  }, [favLoading, onToggleFavorite, exam.id, isFavorite]);
  const btnColor = isEnrolled ? "#059669" : color;
  const btnLabel = isEnrolled ? "Continue Learning" : "Enroll Now";
  return (
    <div ref={cardRef} onClick={onClick} onMouseEnter={()=>setHovered(true)} onMouseLeave={()=>setHovered(false)}
      style={{ background:"var(--bg2)", border:isFeatured?`2.5px solid ${color}`:"2px solid var(--border)", borderRadius:16, overflow:"hidden", cursor:"pointer", display:"flex", flexDirection:"column", position:"relative",
        boxShadow:hovered?`0 20px 44px ${color}15`:isFeatured?`0 8px 28px ${color}10`:"var(--card-shadow)",
        transform:hovered?"translateY(-5px)":"translateY(0)",
        borderColor:hovered?color:isFeatured?color:"var(--border)",
        height:"100%",
        opacity:visible?1:0,
        transition:visible?`opacity 0.4s ease, transform 0.28s cubic-bezier(0.16,1,0.3,1), box-shadow 0.28s, border-color 0.28s`:"none",
      }}>
      {isFeatured&&<div style={{ position:"absolute", top:12, left:12, zIndex:2, background:color, color:"#fff", fontSize:9, fontWeight:800, padding:"4px 10px", borderRadius:99, textTransform:"uppercase" }}>Featured</div>}
      <button onClick={handleFav} style={{ position:"absolute", top:10, right:10, zIndex:3, width:34, height:34, borderRadius:10, background:isFavorite?"rgba(220,38,38,0.15)":"var(--bg2)", border:isFavorite?"2px solid rgba(207,8,8,0.4)":"2px solid var(--border)", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", backdropFilter:"blur(8px)", transition:"all 0.2s", opacity:hovered||isFavorite?1:0 }}>
        {favLoading?<div style={{ width:14, height:14, borderRadius:"50%", border:"2px solid #dc2626", borderTopColor:"transparent", animation:"spin 0.6s linear infinite" }}/>:<PI type={isFavorite?"heart":"heartOutline"} size={15} color={isFavorite?"#dc2626":"var(--text3)"} />}
      </button>
      <div style={{ height:190, background:`linear-gradient(145deg, ${color}10, ${color}05)`, display:"flex", alignItems:"center", justifyContent:"center", position:"relative", overflow:"hidden", borderBottom:"2px solid var(--border)" }}>
        {exam.image?<img src={exam.image} alt={exam.title} loading="lazy" style={{ width:"100%", height:"100%", objectFit:"cover", position:"absolute", inset:0 }}/>:<div style={{ width:64, height:64, borderRadius:16, background:`${color}10`, border:`2.5px solid ${color}40`, display:"flex", alignItems:"center", justifyContent:"center" }}><PI type="certificate" size={32} color={color} /></div>}
        {exam.vendor&&<span style={{ position:"absolute", top:10, right:10, zIndex:2, fontSize:8, fontWeight:700, padding:"3px 7px", borderRadius:6, background:"rgba(0,0,0,0.4)", color:"#fff", backdropFilter:"blur(6px)", textTransform:"uppercase" }}>{exam.vendor}</span>}
        {exam.topic&&<span style={{ position:"absolute", bottom:10, left:10, zIndex:2, fontSize:9, fontWeight:700, padding:"3px 9px", borderRadius:99, background:`${color}DD`, color:"#fff", backdropFilter:"blur(6px)", textTransform:"uppercase" }}>{exam.topic}</span>}
      </div>
      <div style={{ padding:"14px 13px 8px", flex:1, display:"flex", flexDirection:"column" }}>
        <h4 style={{ fontSize:15, fontWeight:800, marginBottom:5, color:"var(--text)", lineHeight:1.3 }}>{exam.title}</h4>
        <p style={{ fontSize:12, color:"var(--text3)", lineHeight:1.5, marginBottom:10, flex:1 }}>{exam.subtitle||exam.description||"Practice with real exam questions"}</p>
        <div style={{ display:"flex", gap:10, fontSize:11, color:"var(--text3)", paddingTop:10, borderTop:"2px solid var(--border)", flexWrap:"wrap" }}>
          <span style={{ display:"flex", alignItems:"center", gap:3 }}><PI type="question" size={10} color="var(--text3)" />{exam.totalQuestions||0} Q</span>
          <span style={{ display:"flex", alignItems:"center", gap:3 }}><PI type="clock" size={10} color="var(--text3)" />{exam.duration||60}m</span>
          <span style={{ display:"flex", alignItems:"center", gap:3 }}><PI type="trending" size={10} color="var(--text3)" />{(exam.attempts||0).toLocaleString()}</span>
        </div>
      </div>
      <div style={{ padding:"0 12px 12px" }}>
        <div style={{ width:"100%", padding:"10px 0", borderRadius:12, background:btnColor, color:"#fff", fontSize:13, fontWeight:700, textAlign:"center", display:"flex", alignItems:"center", justifyContent:"center", gap:8, boxShadow:`0 6px 12px ${btnColor}40`, transition:"all 0.2s", cursor:"pointer" }}>
          {btnLabel} <PI type="arrow" size={12} color="#fff" />
        </div>
      </div>
    </div>
  );
});

function ExamSearch({ exams, onSelect, setPage, setActiveExam }) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [focused, setFocused] = useState(false);
  const inputRef = useRef(null);
  useEffect(() => {
    if (query.trim().length < 2) { setSuggestions([]); return; }
    const q = query.toLowerCase();
    setSuggestions(exams.filter(e=>e.title?.toLowerCase().includes(q)||e.vendor?.toLowerCase().includes(q)||e.topic?.toLowerCase().includes(q)).slice(0,6));
  }, [query, exams]);
  const handleSelect = (exam) => { setQuery(""); setSuggestions([]); setFocused(false); onSelect(exam); };
  const handleSearch = () => { if (suggestions.length > 0) handleSelect(suggestions[0]); else setPage("exams"); };
  return (
    <div style={{ position:"relative", width:"100%", maxWidth:580, zIndex:100 }}>
      <div style={{ display:"flex", alignItems:"center", background:"var(--bg2)", border:`2px solid ${focused?"var(--accent)":"var(--border)"}`, borderRadius:14, overflow:"visible", boxShadow:focused?"0 0 0 4px var(--accent-soft)":"var(--card-shadow)", transition:"all 0.25s", position:"relative", zIndex:101 }}>
        <div style={{ padding:"0 14px", display:"flex", alignItems:"center" }}><PI type="target" size={18} color={focused?"var(--accent)":"var(--text3)"} /></div>
        <input ref={inputRef} type="text" value={query} onChange={e=>setQuery(e.target.value)} onFocus={()=>setFocused(true)} onBlur={()=>setTimeout(()=>setFocused(false),200)} onKeyDown={e=>e.key==="Enter"&&handleSearch()} placeholder="Search any exam or certification code…" style={{ flex:1, border:"none", outline:"none", background:"transparent", fontSize:14, color:"var(--text)", fontFamily:"inherit", padding:"15px 4px" }} />
        <button onClick={handleSearch} style={{ margin:5, padding:"10px 22px", borderRadius:10, background:"var(--gradient-accent)", border:"2px solid var(--accent)", color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit", transition:"all 0.2s", whiteSpace:"nowrap" }}>Search</button>
      </div>
      {focused && suggestions.length > 0 && (
        <div style={{ position:"absolute", top:"calc(100% + 8px)", left:0, right:0, background:"var(--bg2)", border:"2px solid var(--border)", borderRadius:14, zIndex:9999, overflow:"hidden", boxShadow:"var(--card-hover)", maxHeight:"360px", overflowY:"auto" }}>
          {suggestions.map((exam,i)=>(
            <div key={exam.id} onMouseDown={()=>handleSelect(exam)} style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 14px", cursor:"pointer", borderBottom:i<suggestions.length-1?"2px solid var(--border)":"none", transition:"background 0.15s" }} onMouseEnter={e=>e.currentTarget.style.background="var(--bg4)"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
              <div style={{ width:36, height:36, borderRadius:10, flexShrink:0, background:`${exam.color||"var(--accent)"}10`, border:`2px solid ${exam.color||"var(--accent)"}30`, display:"flex", alignItems:"center", justifyContent:"center" }}><PI type="certificate" size={16} color={exam.color||"var(--accent)"} /></div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:13, fontWeight:600, color:"var(--text)", marginBottom:2 }}>{exam.title}</div>
                <div style={{ fontSize:11, color:"var(--text3)" }}>{exam.topic} · {exam.totalQuestions||0} Questions</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function VendorCard({ vendor, examCount, onViewAll }) {
  return (
    <div onClick={onViewAll} style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:10, borderRadius:18, border:`1.5px solid rgba(139,92,246,0.2)`, cursor:"pointer", transition:"all 0.3s cubic-bezier(0.16,1,0.3,1)", textAlign:"center", aspectRatio:"1/1", minHeight:140, backdropFilter:"blur(12px)", boxShadow:"0 4px 20px rgba(0,0,0,0.25)", position:"relative", overflow:"hidden" }}
      onMouseEnter={e=>{e.currentTarget.style.borderColor=vendor.color;e.currentTarget.style.transform="translateY(-5px) scale(1.04)";e.currentTarget.style.boxShadow=`0 16px 40px ${vendor.color}30`;}}
      onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(139,92,246,0.2)";e.currentTarget.style.transform="";e.currentTarget.style.boxShadow="0 4px 20px rgba(0,0,0,0.25)";}}>
      <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:`linear-gradient(90deg, transparent, ${vendor.color}80, transparent)`, borderRadius:"18px 18px 0 0" }} />
      <div style={{ display:"flex", borderRadius:12, alignItems:"center", justifyContent:"center", width:80, height:56, marginBottom:2, filter:"drop-shadow(0 4px 12px rgba(0,0,0,0.3))" }}>
        {vendor.image?<img src={vendor.image} alt={vendor.name} loading="lazy" style={{ height:"100%", objectFit:"contain", borderRadius:10 }} />:<div style={{ fontSize:30 }}>{vendor.logo}</div>}
      </div>
      <div style={{ fontSize:12, fontWeight:800, color:"var(--text)", lineHeight:1.2 }}>{vendor.name}</div>
      <div style={{ fontSize:9, fontWeight:700, padding:"3px 9px", borderRadius:99, background:`${vendor.color}18`, color:vendor.color, border:`1px solid ${vendor.color}40` }}>{examCount||"—"} Exams</div>
    </div>
  );
}

function TopicCardHome({ topic, examCount, onViewAll }) {
  return (
    <div onClick={onViewAll} style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:8, borderRadius:18, border:"1.5px solid rgba(139,92,246,0.2)", cursor:"pointer", transition:"all 0.3s cubic-bezier(0.16,1,0.3,1)", textAlign:"center", aspectRatio:"1/1", minHeight:130, backdropFilter:"blur(12px)", boxShadow:"0 4px 20px rgba(0,0,0,0.25)", position:"relative", overflow:"hidden" }}
      onMouseEnter={e=>{e.currentTarget.style.borderColor=topic.color;e.currentTarget.style.transform="translateY(-5px) scale(1.04)";e.currentTarget.style.boxShadow=`0 16px 40px ${topic.color}30`;}}
      onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(139,92,246,0.2)";e.currentTarget.style.transform="";e.currentTarget.style.boxShadow="0 4px 20px rgba(0,0,0,0.25)";}}>
      <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:`linear-gradient(90deg, transparent, ${topic.color}80, transparent)`, borderRadius:"18px 18px 0 0" }} />
      <div style={{ width:54, height:54, borderRadius:14, marginBottom:2, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, background:`${topic.color}12`, border:`1.5px solid ${topic.color}30` }}>
        {topic.image?<img src={topic.image} alt={topic.name} loading="lazy" style={{ width:"100%", height:"100%", objectFit:"contain", borderRadius:10 }} />:<span>{topic.icon}</span>}
      </div>
      <div style={{ fontSize:11, fontWeight:800, color:"var(--text)", lineHeight:1.2 }}>{topic.name}</div>
      <div style={{ fontSize:9, fontWeight:700, padding:"3px 9px", borderRadius:99, background:`${topic.color}18`, color:topic.color, border:`1px solid ${topic.color}40` }}>{examCount||"—"} Exams</div>
    </div>
  );
}

export default function Home({ setPage, setActiveExam, exams: propExams = [], showToast }) {
  const { user, profile } = useAuth();
  const exams = useMemo(() => propExams.filter(e => e.isActive !== false), [propExams]);

  const [vendors, setVendors] = useState([]);
  const [topics, setTopics] = useState([]);
  const [metaLoading, setMetaLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(6);
  const [favorites, setFavorites] = useState([]);
  const [enrolledExamIds, setEnrolledExamIds] = useState([]);
  const hasMergedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      getVendors().catch(() => []),
      getTopics().catch(() => []),
    ]).then(([v, t]) => {
      if (!cancelled) { setVendors(v); setTopics(t); setMetaLoading(false); }
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (user) {
        const guestFavs = getGuestFavorites();
        const [ids, favIds] = await Promise.all([
          getUserEnrollments(user.uid).catch(()=>[]),
          (guestFavs.length > 0 && !hasMergedRef.current)
            ? mergeGuestFavorites(user.uid, guestFavs).then(merged => { localStorage.removeItem(GUEST_FAV_KEY); hasMergedRef.current = true; return merged; }).catch(()=>getFavorites(user.uid).catch(()=>[]))
            : getFavorites(user.uid).catch(()=>[]),
        ]);
        if (!cancelled) { setEnrolledExamIds(ids); setFavorites(favIds); }
      } else {
        if (!cancelled) setFavorites(getGuestFavorites());
      }
    };
    load();
    return () => { cancelled = true; };
  }, [user]);

  const handleExamClick = useCallback((exam) => { setPage("exam-detail", { exam }); }, [setPage]);

  const handleToggleFavorite = useCallback(async (examId, isCurrentlyFav) => {
    if (!user) {
      const cur = getGuestFavorites();
      const next = isCurrentlyFav ? cur.filter(id=>id!==examId) : [...cur, examId];
      setGuestFavorites(next); setFavorites(next);
      showToast?.({ msg:isCurrentlyFav?"Removed from favorites":"Added to favorites", type:"info" });
      return;
    }
    try {
      if (isCurrentlyFav) { await removeFavorite(user.uid, examId); setFavorites(p=>p.filter(id=>id!==examId)); showToast?.({ msg:"Removed from favorites", type:"info" }); }
      else { await addFavorite(user.uid, examId); setFavorites(p=>[...p, examId]); showToast?.({ msg:"Added to favorites", type:"success" }); }
    } catch { showToast?.({ msg:"Could not update favorites", type:"error" }); }
  }, [user, showToast]);

  const sortedExams = useMemo(() => [...exams].sort((a,b)=>(b.attempts||0)-(a.attempts||0)), [exams]);
  const examOfTheDay = sortedExams[0] || null;

  const popularExams = useMemo(() => {
    if (!examOfTheDay) return sortedExams.slice(0, visibleCount);
    const filtered = sortedExams.filter(exam => exam.id !== examOfTheDay.id);
    return filtered.slice(0, visibleCount);
  }, [sortedExams, examOfTheDay, visibleCount]);

  const safePopularExams = useMemo(() => {
    return popularExams.filter(exam => examOfTheDay ? exam.id !== examOfTheDay.id : true);
  }, [popularExams, examOfTheDay]);

  const vendorsWithCounts = useMemo(() => vendors.map(v=>({...v, count:exams.filter(e=>(e.vendor||"").toLowerCase()===v.name.toLowerCase()).length})).filter(v=>v.count>0), [vendors, exams]);
  const topicsWithCounts = useMemo(() => topics.map(t=>({...t, count:exams.filter(e=>(e.topic||"").toLowerCase()===t.name.toLowerCase()).length})).filter(t=>t.count>0), [topics, exams]);

  const features = [
    { iconType:"shield", color:"#4f46e5", title:"Verified Exam Questions", desc:"Every question sourced from certified professionals and validated against real exam objectives." },
    { iconType:"chart", color:"#059669", title:"Adaptive Analytics", desc:"Your dashboard tracks weak spots and predicts your readiness score before exam day." },
    { iconType:"certificate", color:"#d97706", title:"Shareable Certificates", desc:"Pass practice exams and earn certificates you can add directly to LinkedIn and your resume." },
    { iconType:"target", color:"#dc2626", title:"Exam Simulation Mode", desc:"Full timed exam simulation mirrors the real test environment — zero surprises on the day." },
    { iconType:"users", color:"#7c3aed", title:"Global Learner Community", desc:"Study alongside 100,000+ professionals. Discuss, share tips, and keep each other accountable." },
    { iconType:"infinity", color:"#0891b2", title:"Unlimited Practice, Forever", desc:"No daily caps, no paywalled retakes. Practice as many times as needed until you feel bulletproof." },
  ];

  return (
    <div style={{ background:"var(--bg)", minHeight:"100vh", overflowX:"hidden", }}>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes gridMove{0%{background-position:0 0}100%{background-position:60px 60px}}
        @keyframes bgOrb1{0%,100%{transform:translate(0,0) scale(1)}33%{transform:translate(60px,-40px) scale(1.1)}66%{transform:translate(-30px,50px) scale(0.92)}}
        @keyframes bgOrb2{0%,100%{transform:translate(0,0) scale(1)}40%{transform:translate(-80px,30px) scale(1.06)}70%{transform:translate(40px,-60px) scale(0.94)}}
        @keyframes bgOrb3{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(50px,70px) scale(1.12)}}
        @keyframes iconFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
        @media(prefers-reduced-motion:reduce){*,*::before,*::after{animation-duration:0.01ms !important;transition-duration:0.01ms !important}}

        @media(max-width:768px){
          .tstrip-outer{padding:0 16px!important}
          .hero-grid-wrap{padding:48px 16px 44px!important}
          .popular-exams-grid{grid-template-columns:1fr!important;gap:14px!important}
          .stats-grid{grid-template-columns:repeat(2,1fr)!important}
          .features-grid{grid-template-columns:repeat(2,1fr)!important}
          .vendors-grid, .topics-grid {
            grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)) !important;
            gap: 16px !important;
            overflow-x: hidden !important;
          }
          /* تعديل كرت Exam of the Day للهواتف */
          .exam-day-card {
            flex-direction: column !important;
          }
          .exam-day-thumb {
            width: 100% !important;
            min-width: unset !important;
            height: 160px !important;
            border-right: none !important;
            border-bottom: 2px solid rgba(139,92,246,0.3) !important;
          }
          .exam-day-body {
            padding: 24px 20px !important;
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 20px !important;
          }
          .exam-day-enroll {
            align-self: stretch !important;
            margin-left: 0 !important;
          }
          .exam-day-enroll > div {
            width: 100% !important;
            justify-content: center !important;
          }
        }
        @media(max-width:480px){
          .tstrip-outer{display:none!important}
          .hero-grid-wrap{padding:36px 16px 32px!important}
          .features-grid{grid-template-columns:1fr!important}
          .vendors-grid, .topics-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 12px !important;
            overflow-x: hidden !important;
          }
        }
        @media(max-width:360px){
          .vendors-grid, .topics-grid {
            grid-template-columns: 1fr !important;
            gap: 12px !important;
          }
        }
      `}</style>

      {/* HERO SECTION */}
      <section className="hero-grid-wrap" style={{ borderBottom:"1px solid var(--border)", padding:"80px clamp(20px,6vw,60px) 80px", position:"relative", overflow:"hidden", background:"var(--gradient-hero)" }}>
        <div style={{ position:"absolute", inset:0, pointerEvents:"none", overflow:"hidden", zIndex:0 }}>
          <div style={{ position:"absolute", inset:0, backgroundImage:"linear-gradient(rgba(99,102,241,0.09) 1px, transparent 1px),linear-gradient(90deg, rgba(99,102,241,0.09) 1px, transparent 1px)", backgroundSize:"60px 60px", animation:"gridMove 8s linear infinite" }} />
          <div style={{ position:"absolute", top:"-10%", left:"-5%", width:800, height:800, borderRadius:"50%", background:"radial-gradient(ellipse, rgba(88,28,220,0.2) 0%, transparent 65%)", animation:"bgOrb1 18s ease-in-out infinite", filter:"blur(2px)" }} />
          <div style={{ position:"absolute", bottom:"-5%", right:"-8%", width:700, height:700, borderRadius:"50%", background:"radial-gradient(ellipse, rgba(99,102,241,0.16) 0%, transparent 65%)", animation:"bgOrb2 22s ease-in-out infinite 3s" }} />
          <div style={{ position:"absolute", top:"30%", left:"35%", width:400, height:400, borderRadius:"50%", background:"radial-gradient(circle, rgba(168,85,247,0.1) 0%, transparent 65%)", animation:"bgOrb3 15s ease-in-out infinite 6s" }} />
        </div>
        <div style={{ maxWidth:1280, margin:"0 auto", position:"relative", zIndex:2 }}>
          <div className="hero-grid" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"clamp(32px,6vw,80px)", alignItems:"start", overflow:"visible" }}>
            <div className="hero-mobile-center" style={{ position:"relative", zIndex:10 }}>
              <div className="fade-up" style={{ display:"inline-flex", alignItems:"center", gap:8, background:"var(--accent-soft)", border:"2px solid var(--accent)", borderRadius:100, padding:"7px 18px", marginBottom:28, fontSize:12.5, color:"var(--accent)", fontWeight:600 }}>
                <PI type="sparkle" size={13} color="var(--accent)" /> The Sharpest Exam Simulator on the Web
              </div>
              <WelcomePopup user={user} profile={profile} />
             <h1
  className="fade-up delay-1"
  style={{
    fontSize: "clamp(38px,5.5vw,58px)",
    fontWeight: 900,
    lineHeight: 1.05,
    marginBottom: 22,
    color: "var(--text)",
    letterSpacing: "-2.5px"
  }}
>
  Master Any Certification Exam<br />
  <span
    style={{
      background: "linear-gradient(135deg,#8681dc,#8c69ca)",
      WebkitBackgroundClip: "text",
      backgroundClip: "text",
      color: "transparent"
    }}
  >
    With Real Practice Questions.
  </span>
</h1>

<p
  className="fade-up delay-2"
  style={{
    fontSize: "clamp(15px,1.8vw,17px)",
    color: "var(--text2)",
    maxWidth: 520,
    lineHeight: 1.8,
    marginBottom: 32
  }}
>
  The most advanced <strong style={{ color: "var(--text)", fontWeight: 700 }}>
  certification exam practice platform</strong> built for IT, cloud, security, and professional exams.  
  Train with <strong style={{ color: "var(--text)", fontWeight: 700 }}>real exam-style questions, timed simulations, and adaptive practice tests</strong> so you pass faster and with confidence.
</p>
              <div className="fade-up delay-3" style={{ marginBottom:26, position:"relative", zIndex:100 }}>
                <ExamSearch exams={exams} onSelect={handleExamClick} setPage={setPage} setActiveExam={setActiveExam} />
              </div>
              <div className="hero-actions fade-up delay-4" style={{ display:"flex", gap:12, flexWrap:"wrap", marginBottom:36, position:"relative", zIndex:1 }}>
                <button onClick={()=>setPage(user?"exams":"exams")} style={{ padding:"14px 34px", borderRadius:50, border:"none", background:"linear-gradient(135deg,#6366f1,#a855f7,#ec4899)", color:"#fff", fontSize:15, fontWeight:700, cursor:"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", gap:8, boxShadow:"0 12px 40px rgba(139,92,246,0.45)", transition:"all 0.3s" }}
                  onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-3px) scale(1.03)";e.currentTarget.style.boxShadow="0 20px 50px rgba(139,92,246,0.6)";}}
                  onMouseLeave={e=>{e.currentTarget.style.transform="";e.currentTarget.style.boxShadow="0 12px 40px rgba(139,92,246,0.45)";}}>
                  <PI type="rocket" size={17} color="#fff" /> {user?"Explore Exams":"Explore Topics"}
                </button>
                <button onClick={()=>setPage("topics")} style={{ padding:"14px 26px", borderRadius:50, border:"2px solid rgba(139,92,246,0.5)", background:"rgba(139,92,246,0.1)", color:"var(--text)", fontSize:15, fontWeight:600, cursor:"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", gap:8, transition:"all 0.25s", backdropFilter:"blur(8px)" }}
                  onMouseEnter={e=>{e.currentTarget.style.background="rgba(139,92,246,0.2)";e.currentTarget.style.transform="translateY(-2px)";}}
                  onMouseLeave={e=>{e.currentTarget.style.background="rgba(139,92,246,0.1)";e.currentTarget.style.transform="";}}>
                  Browse Exams <PI type="arrow" size={15} color="currentColor" />
                </button>
              </div>
            </div>
            <div className="hero-illustration fade-up delay-2" style={{ display:"flex", flexDirection:"column", gap:24, position:"relative", zIndex:1, marginLeft:"-60px", width:"calc(100% + 60px)" }}>
              <HeroIllustration />
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS STRIP */}
      <div className="tstrip-outer" style={{ width: "100%", overflow: "hidden", padding: "0 clamp(20px,6vw,60px)", marginTop: "-1px", boxSizing: "border-box", isolation: "isolate", contain: "layout style" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", paddingTop: 32, paddingBottom: 32 }}>
          <HorizontalTestimonialsStrip />
        </div>
      </div>

      {/* STATS */}
      <section style={{ borderBottom:"2px solid var(--border)", padding:"64px clamp(20px,5vw,60px)" }}>
        <div style={{ maxWidth:1200, margin:"0 auto" }}>
          <div className="stats-grid" style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))", gap:20 }}>
            <StatCard num="50" suffix="+" label="Certifications" iconType="certificate" accentColor="var(--accent)" />
            <StatCard num="100" suffix="K+" label="Active Learners" iconType="users" accentColor="var(--green)" />
            <StatCard num="500" suffix="K+" label="Tests Completed" iconType="check" accentColor="var(--purple)" />
            <StatCard num="98" suffix="%" label="Exam Pass Rate" iconType="target" accentColor="var(--gold)" />
          </div>
        </div>
      </section>

      {/* FREE PREVIEW BANNER */}
      {!user && (
        <div style={{ padding:"36px clamp(20px,5vw,60px) 0" }}>
          <div className="free-banner" style={{ maxWidth:1200, margin:"0 auto", background:"var(--accent-soft)", border:"2px solid var(--accent)", borderRadius:16, padding:"28px 36px", display:"flex", alignItems:"center", gap:24, flexWrap:"wrap" }}>
            <div style={{ width:54, height:54, borderRadius:14, flexShrink:0, background:"var(--gradient-accent)", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 8px 20px var(--accent-glow)", border:"2px solid rgba(255,255,255,0.2)" }}><PI type="zap" size={24} color="#fff" /></div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:15, fontWeight:800, color:"var(--text)", marginBottom:4 }}>Try before you commit — no account needed</div>
              <div style={{ fontSize:13.5, color:"var(--text2)", lineHeight:1.6 }}>Unlock the first 10% of any exam instantly. No credit card, no expiry.</div>
            </div>
            <button onClick={()=>setPage("exams")} style={{ padding:"12px 26px", borderRadius:12, background:"var(--gradient-accent)", border:"2px solid var(--accent)", color:"#fff", fontSize:13.5, fontWeight:700, cursor:"pointer", fontFamily:"inherit", whiteSpace:"nowrap", boxShadow:"0 8px 20px var(--accent-glow)", display:"flex", alignItems:"center", gap:8, transition:"all 0.2s" }}>
              <PI type="rocket" size={15} color="#fff" /> Try Free Now
            </button>
          </div>
        </div>
      )}

      {/* CAREER DIAGNOSTIC BANNER */}
      <div style={{ padding: "48px clamp(20px,5vw,60px) 0" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <DiagnosticCard setPage={setPage} />
        </div>
      </div>

      {/* EXAM OF THE DAY (معدل) */}
      {examOfTheDay && (
        <div style={{ padding:"64px clamp(20px,5vw,60px) 0" }}>
          <div style={{ maxWidth:1200, margin:"0 auto" }}>
            <div style={{ marginBottom:24 }}>
              <div style={{ fontSize:10.5, fontWeight:800, color:"var(--accent)", textTransform:"uppercase", letterSpacing:"0.14em", marginBottom:8 }}>Exam of the Day</div>
              <h2 style={{ fontSize:"clamp(22px,3vw,34px)", fontWeight:900, color:"var(--text)", letterSpacing:"-1px" }}>Today's Most Active Certification</h2>
            </div>
            {(() => {
              const exam = examOfTheDay; const color = exam.color||"#4f46e5";
              const isEnrolled = enrolledExamIds.includes(exam.id);
              const btnColor = isEnrolled?"#059669":color;
              return (
                <div onClick={()=>handleExamClick(exam)} className="exam-day-card" style={{ background:`linear-gradient(145deg, ${color}08, var(--bg2))`, border:`2.5px solid ${color}40`, borderRadius:20, cursor:"pointer", display:"flex", transition:"all 0.3s", position:"relative", overflow:"hidden", minHeight:200, boxShadow:"var(--card-shadow)" }}
                  onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-4px)";e.currentTarget.style.borderColor=color;e.currentTarget.style.boxShadow=`0 24px 56px ${color}20`;}}
                  onMouseLeave={e=>{e.currentTarget.style.transform="";e.currentTarget.style.borderColor=`${color}40`;e.currentTarget.style.boxShadow="var(--card-shadow)";}}>
                  <div className="exam-day-thumb" style={{ width:"35%", minWidth:180, background:`${color}10`, display:"flex", alignItems:"center", justifyContent:"center", borderRight:`2.5px solid ${color}30`, position:"relative", overflow:"hidden", flexShrink:0 }}>
                    {exam.image?<img src={exam.image} alt={exam.title} loading="lazy" style={{ width:"100%", height:"100%", objectFit:"cover", position:"absolute", inset:0 }} />:<div style={{ width:100, height:100, borderRadius:24, background:`${color}10`, border:`2.5px solid ${color}40`, display:"flex", alignItems:"center", justifyContent:"center" }}><PI type="award" size={52} color={color} /></div>}
                  </div>
                  <div className="exam-day-body" style={{ flex:1, padding:"36px 40px", display:"flex", alignItems:"center", justifyContent:"space-between", gap:"30px" }}>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:10, fontWeight:800, color, textTransform:"uppercase", letterSpacing:"0.14em", marginBottom:10 }}>⚡ Exam of the Day — Most Active</div>
                      <h3 style={{ fontSize:"clamp(20px,2.5vw,28px)", fontWeight:800, color:"var(--text)", marginBottom:8, lineHeight:1.15 }}>{exam.title}</h3>
                      <p style={{ fontSize:13.5, color:"var(--text2)", lineHeight:1.7, marginBottom:20, maxWidth:540 }}>{exam.description||"The most-registered exam this week. Don't fall behind — your peers are already preparing."}</p>
                      <div style={{ display:"flex", gap:20, fontSize:13, color:"var(--text2)", flexWrap:"wrap" }}>
                        <span style={{ display:"flex", alignItems:"center", gap:5, fontWeight:600 }}><PI type="question" size={14} color={color} />{exam.totalQuestions||0} Questions</span>
                        <span style={{ display:"flex", alignItems:"center", gap:5, fontWeight:600 }}><PI type="clock" size={14} color={color} />{exam.duration||60} min</span>
                        <span style={{ display:"flex", alignItems:"center", gap:5, fontWeight:600 }}><PI type="trending" size={14} color={color} />{(exam.attempts||0).toLocaleString()} attempts</span>
                      </div>
                    </div>
                    <div className="exam-day-enroll" style={{ marginLeft:"auto", alignSelf:"center" }}>
                      <div style={{ padding:"12px 28px", borderRadius:12, background:btnColor, color:"#fff", fontSize:14, fontWeight:700, boxShadow:`0 8px 20px ${btnColor}30`, display:"flex", alignItems:"center", gap:8, border:"2px solid rgba(255,255,255,0.1)", whiteSpace:"nowrap" }}>
                        {isEnrolled?"Continue Learning":"Enroll Now"} <PI type="arrow" size={15} color="#fff" />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* MOST POPULAR EXAMS */}
      <div id="exams-sec" className="section-pad" style={{ padding:"64px clamp(20px,5vw,60px)" }}>
        <div style={{ maxWidth:1200, margin:"0 auto" }}>
          <div style={{ marginBottom:40, display:"flex", justifyContent:"space-between", alignItems:"flex-end", flexWrap:"wrap", gap:16 }}>
            <div>
              <div style={{ fontSize:10.5, fontWeight:800, color:"var(--accent)", textTransform:"uppercase", letterSpacing:"0.14em", marginBottom:8 }}>Most Popular</div>
              <h2 style={{ fontSize:"clamp(22px,3vw,34px)", fontWeight:900, color:"var(--text)", letterSpacing:"-1px", marginBottom:8 }}>Top-Enrolled Certifications This Month</h2>
              <p style={{ fontSize:14, color:"var(--text2)", maxWidth:520 }}>See what thousands of professionals are practicing right now.</p>
            </div>
            <button onClick={()=>setPage("exams")} style={{ padding:"10px 20px", borderRadius:12, border:"2px solid var(--border)", background:"var(--bg2)", color:"var(--text2)", fontSize:13.5, fontWeight:600, cursor:"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", gap:7, transition:"all 0.2s", boxShadow:"var(--card-shadow)" }}
              onMouseEnter={e=>{e.currentTarget.style.borderColor="var(--accent)";e.currentTarget.style.color="var(--accent)";}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--border)";e.currentTarget.style.color="var(--text2)";}}>
              View All <PI type="arrow" size={14} color="currentColor" />
            </button>
          </div>
          {exams.length === 0 ? (
            <div style={{ textAlign:"center", padding:60, color:"var(--text3)" }}>
              <Spinner size={36} color="var(--accent)" />
              <div style={{ marginTop:16, fontSize:14 }}>Loading exams...</div>
            </div>
          ) : (
            <>
              <div className="popular-exams-grid" style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:22, marginBottom:40 }}>
                {popularExams.map((exam,idx)=>(
                  <ExamCard key={exam.id} exam={exam} onClick={()=>handleExamClick(exam)} isFeatured={idx===0} isFavorite={favorites.includes(exam.id)} onToggleFavorite={handleToggleFavorite} user={user} isEnrolled={enrolledExamIds.includes(exam.id)} />
                ))}
              </div>
              {visibleCount < exams.length && (
                <div style={{ textAlign:"center" }}>
                  <button onClick={()=>setVisibleCount(v=>v+6)} style={{ padding:"13px 38px", borderRadius:12, border:"2px solid var(--border)", background:"var(--bg2)", color:"var(--text)", fontSize:14.5, fontWeight:700, cursor:"pointer", fontFamily:"inherit", display:"inline-flex", alignItems:"center", gap:8, transition:"all 0.25s", boxShadow:"var(--card-shadow)" }}
                    onMouseEnter={e=>{e.currentTarget.style.borderColor="var(--accent)";e.currentTarget.style.color="var(--accent)";e.currentTarget.style.background="var(--accent-soft)";}}
                    onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--border)";e.currentTarget.style.color="var(--text)";e.currentTarget.style.background="var(--bg2)";}}>
                    <PI type="trending" size={16} color="currentColor" /> Load More ({exams.length - visibleCount} remaining)
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* VENDORS */}
      {vendorsWithCounts.length > 0 && (
        <section style={{ borderTop:"2px solid var(--border)", borderBottom:"2px solid var(--border)", padding:"72px clamp(20px,5vw,60px)" }}>
          <div style={{ maxWidth:1200, margin:"0 auto" }}>
            <div style={{ textAlign:"center", marginBottom:52 }}>
              <div style={{ fontSize:11, fontWeight:800, color:"var(--accent)", textTransform:"uppercase", letterSpacing:"0.14em", marginBottom:10, display:"flex", alignItems:"center", gap:6, justifyContent:"center" }}><PI type="globe" size={14} color="var(--accent)" /> Popular Vendors</div>
              <h2 style={{ fontSize:"clamp(24px,3.5vw,38px)", fontWeight:900, color:"var(--text)", letterSpacing:"-1.5px", marginBottom:12 }}>The World's Most In-Demand Providers</h2>
              <p style={{ fontSize:15, color:"var(--text2)", maxWidth:500, margin:"0 auto" }}>Filter by your target vendor and go straight to what matters.</p>
            </div>
            <div className="vendors-grid" style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(110px,1fr))", gap:"clamp(16px,3vw,45px)", justifyContent:"center"}}>
              {vendorsWithCounts.map((vendor,i)=>(
                <div key={vendor.id} className={`fade-up delay-${Math.min(i+1,6)}`}>
                  <VendorCard vendor={vendor} examCount={vendor.count} onViewAll={()=>setPage("exams",{vendorFilter:vendor.name})} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* TOPICS */}
      {topicsWithCounts.length > 0 && (
        <section style={{ borderBottom:"2px solid var(--border)", padding:"72px clamp(20px,5vw,60px)" }}>
          <div style={{ maxWidth:1200, margin:"0 auto" }}>
            <div style={{ textAlign:"center", marginBottom:52 }}>
              <div style={{ fontSize:11, fontWeight:800, color:"var(--accent)", textTransform:"uppercase", letterSpacing:"0.14em", marginBottom:10, display:"flex", alignItems:"center", gap:6, justifyContent:"center" }}><PI type="award" size={14} color="var(--accent)" /> Popular Topics</div>
              <h2 style={{ fontSize:"clamp(24px,3.5vw,38px)", fontWeight:900, color:"var(--text)", letterSpacing:"-1.5px", marginBottom:12 }}>Explore Learning Specializations</h2>
              <p style={{ fontSize:15, color:"var(--text2)", maxWidth:500, margin:"0 auto" }}>Choose a specialty area and dive deep into practice exams from top experts.</p>
            </div>
            <div className="topics-grid" style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(110px,1fr))", gap:"clamp(16px,3vw,45px)", justifyContent:"center" }}>
              {topicsWithCounts.map((topic,i)=>(
                <div key={topic.id} className={`fade-up delay-${Math.min(i+1,6)}`}>
                  <TopicCardHome topic={topic} examCount={topic.count} onViewAll={()=>setPage("exams",{topicFilter:topic.name})} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* WHY CHOOSE US */}
      <div style={{ padding:"80px clamp(20px,5vw,60px)", position:"relative" }}>
        <div style={{ maxWidth:1200, margin:"0 auto" }}>
          <div style={{ textAlign:"center", marginBottom:64 }}>
            <div style={{ display:"inline-flex", alignItems:"center", gap:8, background:"rgba(99,102,241,0.1)", border:"1.5px solid rgba(99,102,241,0.3)", borderRadius:100, padding:"6px 18px", marginBottom:18, fontSize:11, color:"var(--accent)", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em" }}><PI type="sparkle" size={11} color="var(--accent)" /> Why Choose FlexExams</div>
            <h2 style={{ fontSize:"clamp(26px,3.5vw,40px)", fontWeight:900, color:"var(--text)", letterSpacing:"-1.5px" }}>Built for the Exam. Not Just the Theory.</h2>
          </div>
          <div className="features-grid" style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:24 }}>
            {features.map((f,i)=>(
              <div key={i} className={`fade-up delay-${Math.min(i+1,6)}`} style={{ border:"1.5px solid rgba(255,255,255,0.08)", borderRadius:22, padding:"36px 28px", transition:"all 0.35s cubic-bezier(0.16,1,0.3,1)", textAlign:"center", backdropFilter:"blur(20px)", boxShadow:"0 8px 32px rgba(0,0,0,0.3)", position:"relative", overflow:"hidden" }}
                onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-8px) scale(1.01)";e.currentTarget.style.boxShadow=`0 24px 60px ${f.color}25`;e.currentTarget.style.borderColor=`${f.color}55`;}}
                onMouseLeave={e=>{e.currentTarget.style.transform="";e.currentTarget.style.boxShadow="0 8px 32px rgba(0,0,0,0.3)";e.currentTarget.style.borderColor="rgba(255,255,255,0.08)";}}>
                <div style={{ position:"absolute", top:0, left:0, right:0, height:1, background:`linear-gradient(90deg, transparent, ${f.color}80, transparent)`, borderRadius:"22px 22px 0 0" }} />
                <div style={{ width:76, height:76, borderRadius:20, background:`linear-gradient(135deg, ${f.color}18, ${f.color}08)`, border:`1.5px solid ${f.color}35`, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 24px", boxShadow:`0 0 24px ${f.color}20`, animation:`iconFloat ${4+i*0.5}s ease-in-out infinite ${i*0.3}s` }}><PI type={f.iconType} size={36} color={f.color} /></div>
                <h4 style={{ fontSize:17, fontWeight:800, marginBottom:14, color:"var(--text)", letterSpacing:"-0.4px" }}>{f.title}</h4>
                <p style={{ fontSize:14, color:"var(--text2)", lineHeight:1.85 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div style={{ padding:"0 clamp(20px,5vw,60px) 80px" }}>
        <div style={{ maxWidth:1100, margin:"0 auto" }}>
          <div className="cta-wrap" style={{ background:"var(--gradient-accent)", borderRadius:24, padding:"72px clamp(28px,5vw,72px)", position:"relative", overflow:"hidden", border:"2px solid var(--accent)" }}>
            <div style={{ position:"absolute", top:-60, right:-60, width:240, height:240, borderRadius:"50%", background:"rgba(255,255,255,0.08)", pointerEvents:"none" }} />
            <div className="cta-grid" style={{ display:"grid", gridTemplateColumns:"1fr auto", gap:40, alignItems:"center", position:"relative" }}>
              <div>
                <div style={{ fontSize:11, fontWeight:800, color:"rgba(255,255,255,0.8)", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:14 }}>Your Journey Starts Now</div>
                <h2 style={{ fontSize:"clamp(24px,4vw,42px)", fontWeight:900, color:"#fff", letterSpacing:"-1.5px", marginBottom:16, lineHeight:1.15 }}>One exam stands between you and the career you're building.</h2>
                <p style={{ fontSize:15, color:"rgba(255,255,255,0.9)", lineHeight:1.7, maxWidth:560 }}>While others practice, you decide where you’ll stand on exam day.</p>
              </div>
              <div className="cta-actions" style={{ display:"flex", flexDirection:"column", gap:12, flexShrink:0 }}>
                {user ? (
                  <button onClick={()=>setPage("exams")} style={{ padding:"15px 34px", borderRadius:12, border:"2px solid rgba(255,255,255,0.3)", background:"#fff", color:"var(--accent2)", fontSize:15, fontWeight:800, cursor:"pointer", fontFamily:"inherit", boxShadow:"0 10px 28px rgba(0,0,0,0.15)", display:"flex", alignItems:"center", gap:8, transition:"all 0.2s" }}
                    onMouseEnter={e=>e.currentTarget.style.transform="translateY(-3px)"} onMouseLeave={e=>e.currentTarget.style.transform=""}>
                    <PI type="rocket" size={17} color="var(--accent2)" /> Start Practicing
                  </button>
                ) : (
                  <>
                    <button onClick={()=>setPage("auth",{mode:"register"})} style={{ padding:"15px 34px", borderRadius:12, border:"2px solid rgba(255,255,255,0.3)", background:"#fff", color:"var(--accent2)", fontSize:15, fontWeight:800, cursor:"pointer", fontFamily:"inherit", boxShadow:"0 10px 28px rgba(0,0,0,0.15)", display:"flex", alignItems:"center", gap:8, transition:"all 0.2s" }}>
                      <PI type="rocket" size={17} color="var(--accent2)" /> Sign Up Free
                    </button>
                    <button onClick={()=>setPage("exams")} style={{ padding:"13px 26px", borderRadius:12, border:"2px solid rgba(255,255,255,0.4)", background:"rgba(255,255,255,0.1)", color:"#fff", fontSize:14, fontWeight:600, cursor:"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", gap:8, transition:"all 0.2s" }}>
                      Explore Exams <PI type="arrow" size={15} color="#fff" />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
