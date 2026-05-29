import React, { useState, useEffect, useRef, useMemo } from "react";
import { useAuth } from "../hooks/useAuth";
import { collection, getDocs, writeBatch } from "firebase/firestore";
import { db } from "../firebase";  // <-- أضف هذا السطر في أعلى الملف مع باقي imports
import {
  getExams,
  createExam,
  updateExam,
  deleteExam,
  addQuestions,
  deleteAllExamQuestions,
  deleteQuestion,
  getQuestions,
  getAllUsers,
  getAllResults,
  getAdminStats,
  updateUserRole,
  deleteResult,
  getAllReports,
  updateReportStatus,
  deleteReport,
  getCountryStats,
  getVendors,
  createVendor,
  updateVendor,
  deleteVendor,
  getTopics,
  createTopic,
  updateTopic,
  deleteTopic,
} from "../services/firestore";
import { generateSlug } from "../services/firestore";
import { parseCSV, rowToQuestion, SAMPLE_CSV } from "../utils/csv";
import {
  getPlatformSettings,
  updatePlatformSettings,
  getAllTransactions,
  DEFAULT_PLANS,
  updateExamPricing,
  getAllInstapayPayments,
  getAllRefundRequests,
  updateRefundStatus,
  approveInstapayPayment,
  rejectInstapayPayment,
  cancelTransaction,
  cancelSubscription,
  sendNotification,
} from "../services/payment";
import AdminRevenuePanel from "../components/AdminRevenuePanel";
import ReferralSystem from "../components/ReferralSystem";
import { smartOptimize, formatBytes, PROFILES } from "../services/imageOptimizer";
import UserManagementPanel from "../components/AdminUserDeletion";
import QuestionBuilder from "../components/QuestionBuilder";
import {
  Card,
  StatCard,
  Btn,
  Input,
  Select,
  Textarea,
  Modal,
  Icon,
  Spinner,
  Empty,
  ProgressBar,
  Tag,
} from "../components/UI";

// ─── Rich Text Editor ─────────────────────────────────────────────────────────
function RichTextEditor({ value, onChange, placeholder = "Write here..." }) {
  const editorRef = React.useRef(null);
  const isComposing = React.useRef(false);

  React.useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    if (el.innerHTML === "" && value) el.innerHTML = value;
    if (!value && el.innerHTML !== "") el.innerHTML = "";
  }, [value]);

  const handleInput = () => {
    if (!isComposing.current && editorRef.current) onChange(editorRef.current.innerHTML);
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const html = e.clipboardData.getData("text/html");
    const text = e.clipboardData.getData("text/plain");
    let content = "";
    if (html) {
      const tmp = document.createElement("div");
      tmp.innerHTML = html;
      tmp.querySelectorAll("script,style,meta,link").forEach(el => el.remove());
      tmp.querySelectorAll("*").forEach(el => {
        [...el.attributes].forEach(attr => {
          if (!(el.tagName === "A" && attr.name === "href")) el.removeAttribute(attr.name);
        });
        if (["div","section","article","header","footer","aside","nav"].includes(el.tagName.toLowerCase())) {
          const p = document.createElement("p");
          p.innerHTML = el.innerHTML;
          el.replaceWith(p);
        }
      });
      content = tmp.innerHTML;
    } else {
      content = text.split("\n").map(line => {
        line = line.trim();
        if (!line) return "<br>";
        if (/^\d+\.\s/.test(line)) return `<li>${line.replace(/^\d+\.\s/, "")}</li>`;
        if (/^[-•*]\s/.test(line)) return `<li>${line.replace(/^[-•*]\s/, "")}</li>`;
        if (/^###\s/.test(line)) return `<h3>${line.replace(/^###\s/, "")}</h3>`;
        if (/^##\s/.test(line)) return `<h2>${line.replace(/^##\s/, "")}</h2>`;
        if (/^#\s/.test(line)) return `<h2>${line.replace(/^#\s/, "")}</h2>`;
        line = line.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
        line = line.replace(/\*(.+?)\*/g, "<em>$1</em>");
        return `<p>${line}</p>`;
      }).join("");
    }
    document.execCommand("insertHTML", false, content);
    onChange(editorRef.current.innerHTML);
  };

  const exec = (cmd, val = null) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, val);
    onChange(editorRef.current.innerHTML);
  };

  const toolbarBtn = (label, action, title) => (
    <button type="button" title={title} onMouseDown={e => { e.preventDefault(); action(); }}
      style={{ padding: "4px 9px", borderRadius: 6, border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text)", cursor: "pointer", fontSize: 12, fontFamily: "inherit", fontWeight: 600, lineHeight: 1.4, transition: "background 0.15s" }}
      onMouseEnter={e => e.currentTarget.style.background = "var(--accent-soft)"}
      onMouseLeave={e => e.currentTarget.style.background = "var(--bg)"}
    >{label}</button>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, padding: "8px 10px", background: "var(--bg3)", border: "1.5px solid var(--border)", borderBottom: "none", borderRadius: "10px 10px 0 0" }}>
        {toolbarBtn("B", () => exec("bold"), "Bold")}
        {toolbarBtn("I", () => exec("italic"), "Italic")}
        {toolbarBtn("U", () => exec("underline"), "Underline")}
        <div style={{ width: 1, background: "var(--border)", margin: "0 2px", alignSelf: "stretch" }} />
        {toolbarBtn("H2", () => exec("formatBlock", "h2"), "Heading 2")}
        {toolbarBtn("H3", () => exec("formatBlock", "h3"), "Heading 3")}
        {toolbarBtn("¶", () => exec("formatBlock", "p"), "Paragraph")}
        <div style={{ width: 1, background: "var(--border)", margin: "0 2px", alignSelf: "stretch" }} />
        {toolbarBtn("• List", () => exec("insertUnorderedList"), "Bullet List")}
        {toolbarBtn("1. List", () => exec("insertOrderedList"), "Numbered List")}
        <div style={{ width: 1, background: "var(--border)", margin: "0 2px", alignSelf: "stretch" }} />
        {toolbarBtn("↩ Clear", () => { if(editorRef.current){ editorRef.current.innerHTML=""; onChange(""); }}, "Clear all")}
      </div>
      <div ref={editorRef} contentEditable suppressContentEditableWarning onInput={handleInput} onPaste={handlePaste}
        onCompositionStart={() => { isComposing.current = true; }}
        onCompositionEnd={() => { isComposing.current = false; handleInput(); }}
        data-placeholder={placeholder}
        style={{ minHeight: 160, padding: "12px 14px", border: "1.5px solid var(--border)", borderTop: "none", borderRadius: "0 0 10px 10px", background: "var(--bg2)", color: "var(--text)", fontSize: 13, lineHeight: 1.75, outline: "none", overflowY: "auto", cursor: "text", position: "relative" }}
        onFocus={e => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.boxShadow = "0 0 0 3px var(--accent-soft)"; e.currentTarget.previousSibling.style.borderColor = "var(--accent)"; }}
        onBlur={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.boxShadow = "none"; e.currentTarget.previousSibling.style.borderColor = "var(--border)"; }}
      />
      <style>{`
        [contenteditable][data-placeholder]:empty:before { content: attr(data-placeholder); color: var(--text3); pointer-events: none; position: absolute; }
        [contenteditable] h2 { font-size: 17px; font-weight: 800; margin: 10px 0 6px; color: var(--text); }
        [contenteditable] h3 { font-size: 14px; font-weight: 700; margin: 8px 0 4px; color: var(--text); }
        [contenteditable] p  { margin: 4px 0; }
        [contenteditable] ul, [contenteditable] ol { padding-left: 22px; margin: 6px 0; }
        [contenteditable] li { margin: 3px 0; }
        [contenteditable] strong { font-weight: 800; color: var(--text); }
        [contenteditable] em { font-style: italic; }
        [contenteditable] u  { text-decoration: underline; }
        [contenteditable] a  { color: var(--accent); }
        [contenteditable] br { display: block; margin: 2px 0; }
        /* Fix 9: dark-mode dropdown option text always readable */
        select, select option { color: #111 !important; background: #fff !important; }
        [data-theme="light"] select, [data-theme="light"] select option { color: #111 !important; background: #fff !important; }
      `}</style>
    </div>
  );
}

// ─── Mini Bar Chart ────────────────────────────────────────────────────────────
function MiniBarChart({ data, color = "var(--accent)", height = 60 }) {
  if (!data || !data.length) return null;
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
          <div title={`${d.label}: ${d.value}`} style={{
            width: "100%", borderRadius: "3px 3px 0 0",
            background: color, opacity: 0.7 + (d.value / max) * 0.3,
            height: `${Math.max(4, (d.value / max) * (height - 16))}px`,
            transition: "height 0.5s ease",
          }} />
          {d.label && <span style={{ fontSize: 8, color: "var(--text3)", whiteSpace: "nowrap", overflow: "hidden", maxWidth: "100%", textOverflow: "ellipsis" }}>{d.label}</span>}
        </div>
      ))}
    </div>
  );
}

// ─── Donut Chart ────────────────────────────────────────────────────────────────
function DonutChart({ segments, size = 100, thickness = 16 }) {
  const total = segments.reduce((s, seg) => s + seg.value, 0) || 1;
  let cumulative = 0;
  const r = (size - thickness) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;

  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      {segments.map((seg, i) => {
        const pct = seg.value / total;
        const dash = pct * circumference;
        const gap = circumference - dash;
        const offset = cumulative * circumference;
        cumulative += pct;
        return (
          <circle key={i} cx={cx} cy={cy} r={r}
            fill="none" stroke={seg.color} strokeWidth={thickness}
            strokeDasharray={`${dash} ${gap}`}
            strokeDashoffset={-offset}
            style={{ transition: "all 0.5s ease" }}
          />
        );
      })}
    </svg>
  );
}

// ─── Trend Sparkline ───────────────────────────────────────────────────────────
function Sparkline({ data, color = "var(--accent)", width = 80, height = 32 }) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * height;
    return `${x},${y}`;
  }).join(" ");
  const trend = data[data.length - 1] >= data[0];
  return (
    <svg width={width} height={height} style={{ overflow: "visible" }}>
      <polyline points={pts} fill="none" stroke={trend ? "#10b981" : "#ef4444"} strokeWidth={2} strokeLinejoin="round" />
    </svg>
  );
}

// ─── Period Filter ─────────────────────────────────────────────────────────────
const PERIODS = [
  { key: "7d", label: "7D" },
  { key: "30d", label: "30D" },
  { key: "90d", label: "90D" },
  { key: "1y", label: "1Y" },
  { key: "all", label: "All" },
];

function PeriodFilter({ value, onChange }) {
  return (
    <div style={{ display: "flex", gap: 4, background: "var(--bg3)", borderRadius: 10, padding: 4 }}>
      {PERIODS.map(p => (
        <button key={p.key} onClick={() => onChange(p.key)} style={{
          padding: "5px 12px", borderRadius: 7, border: "none", cursor: "pointer", fontFamily: "inherit",
          fontWeight: 700, fontSize: 11, transition: "all 0.2s",
          background: value === p.key ? "var(--accent)" : "transparent",
          color: value === p.key ? "#fff" : "var(--text3)",
        }}>{p.label}</button>
      ))}
    </div>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KPICard({ icon, label, value, sub, color, trend, sparkData, onClick }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div onClick={onClick} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{
        background: "var(--bg2)", border: `1.5px solid ${hovered ? color + "55" : color + "22"}`,
        borderRadius: 18, padding: "18px 16px", boxShadow: hovered ? `0 8px 28px ${color}18` : "var(--card-shadow)",
        transition: "all 0.25s", cursor: onClick ? "pointer" : "default",
        transform: hovered ? "translateY(-3px)" : "",
        position: "relative", overflow: "hidden",
      }}>
      <div style={{ position: "absolute", top: 0, right: 0, width: 80, height: 80, borderRadius: "0 0 0 80px", background: `${color}08` }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>{icon}</div>
        {sparkData && <Sparkline data={sparkData} color={color} />}
      </div>
      <div style={{ fontSize: 28, fontWeight: 900, color, fontVariantNumeric: "tabular-nums", lineHeight: 1, marginBottom: 4 }}>{value}</div>
      <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text)", marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 10, color: "var(--text3)", display: "flex", alignItems: "center", gap: 4 }}>
        {trend !== undefined && (
          <span style={{ color: trend >= 0 ? "#10b981" : "#ef4444", fontWeight: 700 }}>
            {trend >= 0 ? "↑" : "↓"} {Math.abs(trend)}%
          </span>
        )}
        {sub}
      </div>
    </div>
  );
}

// ─── Section Header ────────────────────────────────────────────────────────────
function SectionHeader({ icon, title, sub, actions }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
      <div style={{ width: 34, height: 34, borderRadius: 10, background: "var(--accent-soft)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>{icon}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 800, fontSize: 14, color: "var(--text)" }}>{title}</div>
        {sub && <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 1 }}>{sub}</div>}
      </div>
      {actions && <div style={{ display: "flex", gap: 8, alignItems: "center" }}>{actions}</div>}
    </div>
  );
}

// ─── Analytics Panel ───────────────────────────────────────────────────────────
function AnalyticsPanel({ children, title, icon, sub, actions, minH }) {
  return (
    <div style={{ background: "var(--bg2)", border: "1.5px solid var(--border)", borderRadius: 18, padding: "20px 22px", minHeight: minH }}>
      <SectionHeader icon={icon} title={title} sub={sub} actions={actions} />
      {children}
    </div>
  );
}

// ─── Horizontal Bar ────────────────────────────────────────────────────────────
function HBar({ label, value, total, color, suffix = "", rank }) {
  const pct = total ? Math.round((value / total) * 100) : 0;
  return (
    <div style={{ marginBottom: 11 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 5 }}>
        <span style={{ color: "var(--text2)", fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
          {rank !== undefined && <span style={{ fontSize: 10, fontWeight: 900, color, background: `${color}18`, padding: "1px 6px", borderRadius: 99 }}>{rank}</span>}
          {label}
        </span>
        <span style={{ color, fontWeight: 700 }}>{value.toLocaleString()}{suffix} {total && <span style={{ color: "var(--text3)", fontWeight: 400 }}>· {pct}%</span>}</span>
      </div>
      <div style={{ height: 6, background: "var(--bg3)", borderRadius: 99, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: `linear-gradient(90deg, ${color}99, ${color})`, borderRadius: 99, transition: "width 0.8s ease" }} />
      </div>
    </div>
  );
}

// ─── Comparison Badge ──────────────────────────────────────────────────────────
function CompBadge({ value, prev }) {
  if (prev === undefined || prev === null) return null;
  const diff = value - prev;
  const pct = prev ? Math.round((diff / prev) * 100) : 0;
  if (diff === 0) return <span style={{ fontSize: 10, color: "var(--text3)", fontWeight: 600 }}>— No change</span>;
  return (
    <span style={{ fontSize: 10, fontWeight: 700, color: diff > 0 ? "#10b981" : "#ef4444" }}>
      {diff > 0 ? "↑" : "↓"} {Math.abs(pct)}% vs prev
    </span>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
const EMOJIS = ["📋","☁️","🌐","🔒","📊","💻","🛡️","🏗️","📱","⚡","🎯","🔧","📡","🗄️","🖥️","🔐","🌍","🏆"];

const TABS = [
  { key: "overview",     icon: "chart",   label: "Overview",    emoji: "📊" },
  { key: "analytics",   icon: "chart",   label: "Analytics",   emoji: "📈" },
  { key: "exams",       icon: "exam",    label: "Exams",       emoji: "📋" },
  { key: "vendors",     icon: "public",  label: "Vendors",     emoji: "🏢" },
  { key: "topics",      icon: "book",    label: "Topics",      emoji: "🎓" },
  { key: "import",      icon: "upload",  label: "Import",      emoji: "📤" },
  { key: "questions",   icon: "book",    label: "Questions",   emoji: "❓" },
  { key: "reports",     icon: "warning", label: "Reports",     emoji: "⚠️" },
  { key: "contacts",    icon: "email",   label: "Contacts",    emoji: "📩" },
  { key: "users",       icon: "user",    label: "Users",       emoji: "👥" },
  { key: "results",     icon: "trophy",  label: "Results",     emoji: "🏆" },
  { key: "revenue",     icon: "dollar",  label: "Revenue",     emoji: "💰" },
  { key: "refunds",     icon: "dollar",  label: "Refunds",     emoji: "↩️" },
  { key: "pricing",     icon: "dollar",  label: "Pricing",     emoji: "🏷️" },
  { key: "referral",    icon: "gift",    label: "Referral",    emoji: "🎁" },
  { key: "leaderboard", icon: "trophy",  label: "Leaderboard", emoji: "🥇" },
  { key: "settings",    icon: "settings",label: "Settings",    emoji: "⚙️" },
];

// ─── Helper: filter results by period ─────────────────────────────────────────
function filterByPeriod(results, period) {
  if (period === "all") return results;
  const now = Date.now();
  const days = period === "7d" ? 7 : period === "30d" ? 30 : period === "90d" ? 90 : 365;
  const cutoff = now - days * 24 * 60 * 60 * 1000;
  return results.filter(r => {
    const d = r.date ? new Date(r.date).getTime() : (r.createdAt?.toDate?.()?.getTime?.() || 0);
    return d >= cutoff;
  });
}

// ─── Helper: group results by day for chart ────────────────────────────────────
function groupByDay(results, days = 7) {
  const map = {};
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    map[key] = 0;
  }
  results.forEach(r => {
    const d = r.date ? new Date(r.date) : r.createdAt?.toDate?.();
    if (!d) return;
    const key = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    if (key in map) map[key]++;
  });
  return Object.entries(map).map(([label, value]) => ({ label, value }));
}

// ─── ExamPricingPanel (search + generalize) ───────────────────────────────────
function ExamPricingPanel({ exams, showToast }) {
  const [search, setSearch]         = useState("");
  const [examList, setExamList]     = useState(exams);
  const [globalPrice, setGlobalP]   = useState("");
  const [globalFree, setGlobalFree] = useState(false);
  const [generalizing, setGen]      = useState(false);

  // Keep in sync if parent exams change
  React.useEffect(() => { setExamList(exams); }, [exams]);

  const filtered = examList.filter(e =>
    !search.trim() || (e.title || "").toLowerCase().includes(search.toLowerCase()) ||
    (e.vendor || "").toLowerCase().includes(search.toLowerCase())
  );

  const handleUpdated = (examId, pricingData) => {
    setExamList(prev => prev.map(e => e.id === examId ? { ...e, pricing: pricingData } : e));
    // #6 Auto-refresh to sync Firestore state
    load().catch(() => {});
  };

  const applyToAll = async () => {
    if (!globalFree && (!globalPrice || isNaN(parseFloat(globalPrice)))) {
      return;
    }
    setGen(true);
    const pricingData = globalFree
      ? { price: 0, originalPrice: null, discount: 0, isFree: true }
      : { price: parseFloat(globalPrice), originalPrice: null, discount: 0, isFree: false };
    try {
      await Promise.all(filtered.map(e => updateExamPricing(e.id, pricingData)));
      setExamList(prev => prev.map(e =>
        filtered.find(f => f.id === e.id) ? { ...e, pricing: pricingData } : e
      ));
      showToast({ msg: `✅ Applied to ${filtered.length} exams`, type: "success" });
    } catch (err) { showToast({ msg: `Error: ${err.message}`, type: "error" }); }
    setGen(false);
  };

  return (
    <div>
      <div style={{ fontSize: 12, color: "var(--text2)", marginBottom: 14, padding: "10px 14px", background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 10 }}>
        💡 السعر 0 = مجاني · الضيف 10% · المسجل 15% · المشترك 100%
      </div>

      {/* Search + Generalize bar */}
      <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
          <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 13 }}>🔍</span>
          <input placeholder="Search exam..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ width: "100%", padding: "9px 12px 9px 32px", borderRadius: 10, border: "1.5px solid var(--border2)", background: "var(--bg)", color: "var(--text)", fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--bg2)", border: "1.5px solid var(--border2)", borderRadius: 10, padding: "6px 12px", flexShrink: 0 }}>
          <span style={{ fontSize: 11, color: "var(--text3)", fontWeight: 700 }}>Generalize:</span>
          <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
            <input type="checkbox" checked={globalFree} onChange={e => setGlobalFree(e.target.checked)} style={{ accentColor: "var(--green)" }} />
            Free
          </label>
          {!globalFree && (
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ fontSize: 11, color: "var(--text3)" }}>$</span>
              <input type="number" step="0.01" min="0.01" value={globalPrice} onChange={e => setGlobalP(e.target.value)} placeholder="price"
                style={{ width: 70, padding: "5px 8px", borderRadius: 7, border: "1.5px solid var(--border2)", background: "var(--bg)", color: "var(--text)", fontSize: 12, fontFamily: "inherit", outline: "none" }} />
            </div>
          )}
          <Btn size="sm" onClick={applyToAll} loading={generalizing} style={{ padding: "5px 12px", fontSize: 11 }}>
            Apply to {filtered.length}
          </Btn>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: 30, color: "var(--text3)", fontSize: 13 }}>No exams found</div>
        ) : (
          filtered.map(exam => (
            <ExamPriceRow key={exam.id} exam={exam} showToast={showToast} onUpdated={handleUpdated} />
          ))
        )}
      </div>
    </div>
  );
}

// ─── ExamPriceRow Component ────────────────────────────────────────────────────
function ExamPriceRow({ exam, showToast, onUpdated }) {
  const [price, setPrice]     = useState(exam.pricing?.price ?? 0);
  const [origPrice, setOrig]  = useState(exam.pricing?.originalPrice ?? "");
  const [discount, setDisc]   = useState(exam.pricing?.discount ?? 0);
  const [isFree, setIsFree]   = useState(
    exam.pricing?.isFree === true || (!exam.pricing?.price && exam.pricing?.price !== 0)
      ? true
      : (exam.pricing?.price === 0 ? true : false)
  );
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);

  // FIX #10: sync when parent exam prop changes (prevents stale state)
  React.useEffect(() => {
    setPrice(exam.pricing?.price ?? 0);
    setOrig(exam.pricing?.originalPrice ?? "");
    setDisc(exam.pricing?.discount ?? 0);
    setIsFree(exam.pricing?.isFree === true || exam.pricing?.price === 0);
  }, [exam.id, exam.pricing?.price, exam.pricing?.isFree]);

  const save = async () => {
    setSaving(true);
    try {
      const pricingData = { price: isFree ? 0 : price, originalPrice: origPrice ? parseFloat(origPrice) : null, discount: isFree ? 0 : discount, isFree };
      await updateExamPricing(exam.id, pricingData);
      showToast({ msg: `✅ "${exam.title}" — pricing saved`, type: "success" });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      onUpdated?.(exam.id, pricingData);
    } catch (e) { showToast({ msg: `Error: ${e.message}`, type: "error" }); }
    setSaving(false);
  };

  return (
    <Card style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", padding: "14px 18px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 200 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: `${exam.color || "var(--accent)"}18`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>{exam.logo || "📋"}</div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 13 }}>{exam.title}</div>
          <div style={{ fontSize: 10, color: "var(--text3)" }}>{exam.totalQuestions || 0} questions</div>
        </div>
      </div>
      <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700, color: "var(--text2)", cursor: "pointer", flexShrink: 0 }}>
        <input type="checkbox" checked={isFree} onChange={e => { setIsFree(e.target.checked); if (e.target.checked) setPrice(0); }} style={{ accentColor: "var(--green)" }} />
        Free
      </label>
      {!isFree && (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 12, color: "var(--text3)", fontWeight: 600 }}>$</span>
            <input type="number" step="0.01" min="0.01" value={price} onChange={e => setPrice(parseFloat(e.target.value) || 0)} placeholder="Price"
              style={{ width: 80, padding: "7px 10px", borderRadius: 8, border: "1.5px solid var(--border2)", background: "var(--bg)", color: "var(--text)", fontSize: 12, fontFamily: "inherit", outline: "none" }} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 11, color: "var(--text3)" }}>Orig:</span>
            <input type="number" step="0.01" min="0" value={origPrice} onChange={e => setOrig(e.target.value)} placeholder="—"
              style={{ width: 70, padding: "7px 10px", borderRadius: 8, border: "1.5px solid var(--border2)", background: "var(--bg)", color: "var(--text)", fontSize: 12, fontFamily: "inherit", outline: "none" }} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 11, color: "var(--text3)" }}>Off:</span>
            <input type="number" min="0" max="100" value={discount} onChange={e => setDisc(parseInt(e.target.value) || 0)} placeholder="0%"
              style={{ width: 60, padding: "7px 10px", borderRadius: 8, border: "1.5px solid var(--border2)", background: "var(--bg)", color: "var(--text)", fontSize: 12, fontFamily: "inherit", outline: "none" }} />
            <span style={{ fontSize: 11, color: "var(--text3)" }}>%</span>
          </div>
        </>
      )}
      {isFree && <Tag color="var(--green)">Free</Tag>}
      {!isFree && price > 0 && <Tag color="var(--accent)">${price.toFixed(2)}{discount > 0 ? ` -${discount}%` : ""}</Tag>}
      {saved && <Tag color="var(--green)">✓ Saved</Tag>}
      <Btn size="sm" onClick={save} loading={saving} style={{ flexShrink: 0 }}>💾</Btn>
    </Card>
  );
}

// ─── Report Modal with Feedback ──────────────────────────────────────────────
function ReportModal({ report, exams, users, onAction, onDelete, onClose }) {
  const [feedback, setFeedback] = React.useState("");
  const [acting, setActing] = React.useState(false);

  const exam = exams.find(e => e.id === report.examId);
  const reportUser = users.find(u => u.id === report.userId);

  const handleAction = async (status) => {
    setActing(true);
    await onAction(report.id, status, feedback.trim());
    setActing(false);
  };

  return (
    <Modal title="📋 Report Details" onClose={onClose} maxWidth={700}>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ background: "var(--bg3)", borderRadius: 10, padding: "14px" }}>
          <div style={{ fontSize: 12, color: "var(--text2)", marginBottom: 8 }}><strong>Exam:</strong> {exam?.title || "Deleted"}</div>
          <div style={{ fontSize: 12, color: "var(--text2)", marginBottom: 8 }}><strong>Student:</strong> {reportUser?.name || "Deleted"}</div>
          <div style={{ fontSize: 12, color: "var(--text2)", marginBottom: 8 }}><strong>Email:</strong> {reportUser?.email || "N/A"}</div>
          <div style={{ fontSize: 12, color: "var(--text3)" }}><strong>Date:</strong> {report.createdAt ? new Date(report.createdAt?.toDate?.() || report.createdAt).toLocaleDateString() : "—"}</div>
        </div>
        <div style={{ background: "var(--bg3)", borderRadius: 10, padding: "14px" }}>
          <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>❓ Question</div>
          <div style={{ fontSize: 13, color: "var(--text2)", lineHeight: 1.6 }}>{report.questionText}</div>
        </div>
        <div style={{ background: "var(--bg3)", borderRadius: 10, padding: "14px" }}>
          <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>💬 Reported Issue</div>
          <div style={{ fontSize: 13, color: "var(--text2)", lineHeight: 1.6 }}>{report.feedback}</div>
        </div>
        {report.correctAnswer && (
          <div style={{ background: "rgba(34,197,94,0.08)", borderRadius: 10, padding: "14px" }}>
            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8, color: "var(--green)" }}>✅ Correct Answer</div>
            <div style={{ fontSize: 13, color: "var(--text2)", lineHeight: 1.6 }}>{report.correctAnswer}</div>
          </div>
        )}
        {report.userAnswer && (
          <div style={{ background: "rgba(239,68,68,0.08)", borderRadius: 10, padding: "14px" }}>
            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8, color: "var(--red)" }}>❌ Student's Answer</div>
            <div style={{ fontSize: 13, color: "var(--text2)", lineHeight: 1.6 }}>{report.userAnswer}</div>
          </div>
        )}

        {/* ✅ NEW: Feedback field — يظهر كـ notification للعضو */}
        <div>
          <label style={{ display: "block", fontSize: 11, fontWeight: 800, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 7 }}>
            📢 Feedback to Student <span style={{ fontWeight: 400, textTransform: "none", fontSize: 10 }}>(will be sent as notification)</span>
          </label>
          <textarea
            value={feedback}
            onChange={e => setFeedback(e.target.value)}
            rows={3}
            maxLength={500}
            placeholder="e.g. We've reviewed your report and corrected the answer. Thank you for your feedback!"
            style={{ width: "100%", padding: "11px 14px", borderRadius: 11, border: "1.5px solid var(--border)", background: "var(--bg3)", color: "var(--text)", fontSize: 13, fontFamily: "inherit", outline: "none", resize: "vertical", boxSizing: "border-box" }}
            onFocus={e => e.target.style.borderColor = "var(--accent)"}
            onBlur={e => e.target.style.borderColor = "var(--border)"}
          />
          <div style={{ textAlign: "right", fontSize: 10, color: "var(--text3)", marginTop: 2 }}>{feedback.length}/500</div>
        </div>

        <div style={{ display: "flex", gap: 10, flexDirection: "column" }}>
          {report.status === "pending" && (
            <>
              <Btn full loading={acting} onClick={() => handleAction("resolved")} style={{ background: "linear-gradient(135deg, var(--green), #047857)", borderColor: "transparent" }}>
                <Icon n="check" size={14} /> Mark as Resolved
              </Btn>
              <Btn full variant="ghost" loading={acting} onClick={() => handleAction("rejected")} style={{ color: "var(--red)" }}>
                <Icon n="close" size={14} /> Reject Report
              </Btn>
            </>
          )}
          <Btn full variant="danger" onClick={() => onDelete(report.id)}>
            <Icon n="trash" size={14} /> Delete Report
          </Btn>
        </div>
      </div>
    </Modal>
  );
}

// ─── Admin Leaderboard Panel ────────────────────────────────────────────────
function AdminLeaderboardPanel({ showToast, users }) {
  const [lbData, setLbData]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [period, setPeriod]     = useState("all");
  const [grantingId, setGrantingId] = useState(null);

  const { db: _db } = { db: null }; // we import db directly from firebase
  const { db: firestoreDb } = React.useMemo(() => {
    try { return { db: window.__flexexams_db }; } catch { return { db: null }; }
  }, []);

  // import db directly
  useEffect(() => {
    setLoading(true);
    import("../firebase").then(({ db: fdb }) => {
      import("firebase/firestore").then(({ getDocs, collection, query, orderBy, limit, where }) => {
        const q = query(collection(fdb, "leaderboard"), orderBy("points", "desc"), limit(200));
        getDocs(q).then(snap => {
          let data = snap.docs.map((d, i) => ({ id: d.id, rank: i + 1, ...d.data() }));
          if (period !== "all") {
            const now = new Date();
            const mk = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
            data = data.filter(d => d.monthKey === mk).map((d, i) => ({ ...d, rank: i + 1 }));
          }
          setLbData(data);
          setLoading(false);
        }).catch(() => setLoading(false));
      });
    });
  }, [period]);

// داخل AdminLeaderboardPanel component
const grantYearlySub = async (entry) => {
  if (!window.confirm(`Grant FREE yearly subscription to ${entry.name}?`)) return;
  setGrantingId(entry.id);
  try {
    const { grantSubscription, sendNotification } = await import("../services/payment");
    const txId = `lb_reward_${entry.id}_${Date.now()}`;
    await grantSubscription(entry.id, "yearly", txId);
    await sendNotification(entry.id, {
      type:  "leaderboard_reward",
      title: "🏆 You won a FREE Yearly Subscription!",
      body:  `Congratulations ${entry.name}! You reached #1 on the monthly leaderboard and earned a free yearly subscription. Enjoy full access to all exams for a full year!`,
      data:  { txId, planId: "yearly", rank: 1, rewardType: "leaderboard_monthly_winner" },
    });
    showToast({ msg: `🎉 Yearly subscription granted to ${entry.name}!`, type: "success" });
  } catch (e) {
    showToast({ msg: `Error: ${e.message}`, type: "error" });
  }
  setGrantingId(null);
};

  const totalPts = lbData.reduce((s, d) => s + (d.points || 0), 0);
  const avgPts   = lbData.length ? Math.round(totalPts / lbData.length) : 0;
  const topStreak = lbData.reduce((m, d) => Math.max(m, d.streak || 0), 0);

  return (
    <div>
      {/* Stats Summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px,1fr))", gap: 14, marginBottom: 24 }}>
        {[
          { icon: "👥", label: "Total Players", value: lbData.length, color: "#4f46e5" },
          { icon: "💠", label: "Total Points", value: totalPts.toLocaleString(), color: "#059669" },
          { icon: "📊", label: "Avg Points", value: avgPts.toLocaleString(), color: "#d97706" },
          { icon: "🔥", label: "Top Streak", value: `${topStreak}d`, color: "#fb923c" },
          { icon: "🥇", label: "#1 Player", value: lbData[0]?.name || "—", color: "#f59e0b" },
        ].map((s, i) => (
          <div key={i} style={{ background: "var(--bg2)", border: `1.5px solid ${s.color}22`, borderRadius: 14, padding: "16px" }}>
            <div style={{ fontSize: 22, marginBottom: 6 }}>{s.icon}</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 11, color: "var(--text3)", fontWeight: 600, marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Period Filter */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, alignItems: "center" }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text2)" }}>Period:</span>
        {[["all", "All Time"], ["monthly", "This Month"]].map(([v, l]) => (
          <button key={v} onClick={() => setPeriod(v)} style={{ padding: "6px 14px", borderRadius: 8, border: `1.5px solid ${period === v ? "var(--accent)" : "var(--border)"}`, background: period === v ? "rgba(99,102,241,0.1)" : "transparent", color: period === v ? "var(--accent)" : "var(--text3)", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>{l}</button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 48 }}><Spinner size={32} color="var(--accent)" /></div>
      ) : lbData.length === 0 ? (
        <Empty icon="🏆" title="No leaderboard data" subtitle="Users will appear here after completing exams" />
      ) : (
        <div style={{ background: "var(--bg2)", border: "1.5px solid var(--border)", borderRadius: 14, overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "44px 1fr 80px 80px 80px 80px 120px", padding: "10px 16px", background: "var(--bg3)", borderBottom: "1.5px solid var(--border)", fontSize: 10, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            <span>#</span><span>Player</span><span>Points</span><span>Exams</span><span>Pass%</span><span>Streak</span><span>Actions</span>
          </div>
          {lbData.slice(0, 50).map((entry, i) => {
            const user = users.find(u => u.id === entry.id);
            const isTop = entry.rank === 1;
            return (
              <div key={entry.id} style={{ display: "grid", gridTemplateColumns: "44px 1fr 80px 80px 80px 80px 120px", padding: "12px 16px", alignItems: "center", borderBottom: i < lbData.length - 1 ? "1px solid var(--border)" : "none", background: isTop ? "rgba(245,158,11,0.04)" : "transparent", transition: "background 0.15s" }}
                onMouseEnter={e => e.currentTarget.style.background = isTop ? "rgba(245,158,11,0.08)" : "var(--bg3)"}
                onMouseLeave={e => e.currentTarget.style.background = isTop ? "rgba(245,158,11,0.04)" : "transparent"}
              >
                <span style={{ fontWeight: 900, color: entry.rank <= 3 ? "#f59e0b" : "var(--text3)", fontSize: entry.rank <= 3 ? 18 : 13 }}>
                  {entry.rank === 1 ? "🥇" : entry.rank === 2 ? "🥈" : entry.rank === 3 ? "🥉" : `#${entry.rank}`}
                </span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{entry.name || "Anonymous"}</div>
                  <div style={{ fontSize: 10, color: "var(--text3)" }}>{user?.email || entry.country || ""}</div>
                  <div style={{ display: "flex", gap: 4, marginTop: 2, flexWrap: "wrap" }}>
                    {(entry.badges || []).slice(0, 4).map(bid => {
                      const BADGE_ICONS = { first_exam: "🎓", streak_3: "🔥", streak_7: "💎", streak_30: "🌟", pass_rate_90: "🎯", perfect_score: "💯", "10_exams": "📚", "50_exams": "🚀", top_10: "🏅", top_1: "👑", "1000_pts": "💠" };
                      return <span key={bid} title={bid} style={{ fontSize: 12 }}>{BADGE_ICONS[bid] || "🏅"}</span>;
                    })}
                  </div>
                </div>
                <span style={{ fontWeight: 900, color: "var(--accent)", fontSize: 13 }}>{(entry.points || 0).toLocaleString()}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text2)" }}>{entry.totalExams || 0}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#10b981" }}>{entry.passRate || 0}%</span>
                <span style={{ fontSize: 13, color: "#fb923c", fontWeight: (entry.streak || 0) >= 3 ? 800 : 600 }}>🔥 {entry.streak || 0}d</span>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {isTop && (
                    <button
                      onClick={() => grantYearlySub(entry)}
                      disabled={grantingId === entry.id}
                      style={{ padding: "5px 10px", borderRadius: 7, border: "none", background: "linear-gradient(135deg,#f59e0b,#d97706)", color: "#fff", fontSize: 10, fontWeight: 800, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}
                    >
                      {grantingId === entry.id ? "…" : "🎁 Grant Sub"}
                    </button>
                  )}
                  <button
                    onClick={() => {
                      const msg = window.prompt(`Send notification to ${entry.name}:`);
                      if (!msg?.trim()) return;
                      import("../services/payment").then(({ sendNotification }) => {
                        sendNotification(entry.id, { type: "admin_message", title: "📢 Message from Admin", body: msg.trim(), data: { sentAt: Date.now() } })
                          .then(() => showToast({ msg: "✅ Notification sent!", type: "success" }))
                          .catch(e => showToast({ msg: `❌ Failed: ${e.message}`, type: "error" }));
                      });
                    }}
                    style={{ padding: "5px 10px", borderRadius: 7, border: "1.5px solid var(--border)", background: "transparent", color: "var(--text2)", fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
                  >
                    📢
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Info box about yearly reward */}
      <div style={{ marginTop: 16, padding: "14px 18px", background: "rgba(245,158,11,0.06)", border: "1.5px solid rgba(245,158,11,0.25)", borderRadius: 12 }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: "#d97706", marginBottom: 6 }}>🏆 Monthly Reward Policy</div>
        <div style={{ fontSize: 12, color: "var(--text2)", lineHeight: 1.6 }}>
          The monthly #1 ranked player wins a FREE yearly subscription. Use the <strong>🎁 Grant Sub</strong> button to instantly grant access and send a notification to the winner. Switch to "This Month" view to see the current monthly rankings.
        </div>
      </div>
    </div>
  );
}

// ─── Bulk Notify Bar ─────────────────────────────────────────────────────────
function BulkNotifyBar({ users, showToast, onExport, user: adminUser }) {
  const [notifAllOpen, setNotifAllOpen] = React.useState(false);
  const [notifOneOpen, setNotifOneOpen] = React.useState(false);
  const [notifAllForm, setNotifAllForm] = React.useState({ title: "", body: "" });
  const [notifOneForm, setNotifOneForm] = React.useState({ title: "", body: "", userId: "" });
  const [userSearch, setUserSearch] = React.useState("");
  const [sendingAll, setSendingAll] = React.useState(false);
  const [sendingOne, setSendingOne] = React.useState(false);

  const filteredUsers = React.useMemo(() => {
    const q = userSearch.toLowerCase().trim();
    if (!q) return users.slice(0, 20);
    return users.filter(u =>
      (u.name || "").toLowerCase().includes(q) ||
      (u.email || "").toLowerCase().includes(q) ||
      (u.id || "").toLowerCase().includes(q)
    ).slice(0, 20);
  }, [users, userSearch]);

  const selectedUser = users.find(u => u.id === notifOneForm.userId);

  const handleSendAll = async () => {
    if (!notifAllForm.title.trim()) return;
    setSendingAll(true);
    // مفتاح فريد لمنع الإرسال المكرر عند الضغط أكثر من مرة
    const broadcastKey = `broadcast_${Date.now()}`;
    let count = 0;
    for (const u of users) {
      try {
        await sendNotification(u.id, {
          type: "admin_message",
          title: notifAllForm.title,
          body: notifAllForm.body,
          data: { adminUid: adminUser?.uid, broadcastKey },
        });
        count++;
      } catch { /* continue */ }
    }
    setSendingAll(false);
    setNotifAllOpen(false);
    setNotifAllForm({ title: "", body: "" });
    showToast({ msg: `✅ Notification sent to ${count} users`, type: "success" });
  };

  const handleSendOne = async () => {
    if (!notifOneForm.title.trim() || !notifOneForm.userId) return;
    if (sendingOne) return; // منع الضغط المزدوج
    setSendingOne(true);
    try {
      await sendNotification(notifOneForm.userId, {
        type: "admin_message",
        title: notifOneForm.title,
        body: notifOneForm.body,
        data: { adminUid: adminUser?.uid, sentAt: Date.now() },
      });
      showToast({ msg: `✅ Notification sent to ${selectedUser?.name || selectedUser?.email || notifOneForm.userId}`, type: "success" });
      setNotifOneOpen(false);
      setNotifOneForm({ title: "", body: "", userId: "" });
      setUserSearch("");
    } catch (e) {
      showToast({ msg: `❌ Failed: ${e.message}`, type: "error" });
    }
    setSendingOne(false);
  };

  return (
    <div style={{ marginBottom: 16, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
      <button
        onClick={() => setNotifAllOpen(v => !v)}
        style={{ padding: "9px 18px", background: "rgba(99,102,241,0.1)", border: "1.5px solid rgba(99,102,241,0.3)", borderRadius: 10, color: "var(--accent)", fontWeight: 800, cursor: "pointer", fontSize: 12, fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6 }}
      >
        📣 Broadcast to ALL ({users.length})
      </button>
      <button
        onClick={() => setNotifOneOpen(v => !v)}
        style={{ padding: "9px 18px", background: "rgba(16,185,129,0.08)", border: "1.5px solid rgba(16,185,129,0.3)", borderRadius: 10, color: "#10b981", fontWeight: 800, cursor: "pointer", fontSize: 12, fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6 }}
      >
        👤 Notify Individual
      </button>
      <Btn variant="ghost" size="sm" onClick={onExport}><Icon n="download" size={14} /> Export CSV</Btn>

      {/* Broadcast Modal */}
      {notifAllOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: 20 }}>
          <div style={{ background: "var(--bg2)", border: "1.5px solid var(--border)", borderRadius: 20, padding: 28, maxWidth: 440, width: "100%" }}>
            <h3 style={{ fontWeight: 900, marginBottom: 6, color: "var(--text)", fontSize: 16 }}>📣 Broadcast Notification</h3>
            <p style={{ fontSize: 12, color: "var(--text3)", marginBottom: 16 }}>Will be sent to all <strong>{users.length}</strong> registered users.</p>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: "var(--text2)", marginBottom: 6, display: "block" }}>Title *</label>
              <input value={notifAllForm.title} onChange={e => setNotifAllForm(p => ({ ...p, title: e.target.value }))} placeholder="Notification title…"
                style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1.5px solid var(--border)", background: "var(--bg)", color: "var(--text)", fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
            </div>
            <div style={{ marginBottom: 18 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: "var(--text2)", marginBottom: 6, display: "block" }}>Message</label>
              <textarea value={notifAllForm.body} onChange={e => setNotifAllForm(p => ({ ...p, body: e.target.value }))} placeholder="Optional message body…" rows={3}
                style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1.5px solid var(--border)", background: "var(--bg)", color: "var(--text)", fontSize: 13, fontFamily: "inherit", outline: "none", resize: "none", boxSizing: "border-box" }} />
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setNotifAllOpen(false)} style={{ flex: 1, padding: 10, borderRadius: 10, border: "1.5px solid var(--border)", background: "var(--bg3)", color: "var(--text2)", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
              <button onClick={handleSendAll} disabled={sendingAll || !notifAllForm.title.trim()} style={{ flex: 1, padding: 10, borderRadius: 10, border: "none", background: "linear-gradient(135deg,#6366f1,#a855f7)", color: "#fff", fontWeight: 800, cursor: "pointer", fontFamily: "inherit", opacity: sendingAll ? 0.7 : 1 }}>
                {sendingAll ? "Sending…" : "📣 Send to All"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Individual Notification Modal */}
      {notifOneOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: 20 }}>
          <div style={{ background: "var(--bg2)", border: "1.5px solid var(--border)", borderRadius: 20, padding: 28, maxWidth: 480, width: "100%", maxHeight: "90vh", overflowY: "auto" }}>
            <h3 style={{ fontWeight: 900, marginBottom: 6, color: "var(--text)", fontSize: 16 }}>👤 Notify Individual User</h3>
            <p style={{ fontSize: 12, color: "var(--text3)", marginBottom: 16 }}>Search and select a user to send a targeted notification.</p>

            {/* User search */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: "var(--text2)", marginBottom: 6, display: "block" }}>Search User *</label>
              <input
                value={userSearch}
                onChange={e => { setUserSearch(e.target.value); setNotifOneForm(p => ({ ...p, userId: "" })); }}
                placeholder="Name, email or user ID…"
                style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1.5px solid var(--border)", background: "var(--bg)", color: "var(--text)", fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box", marginBottom: 8 }}
              />
              {/* User list */}
              {userSearch.trim() && (
                <div style={{ maxHeight: 180, overflowY: "auto", border: "1.5px solid var(--border)", borderRadius: 10, background: "var(--bg3)" }}>
                  {filteredUsers.length === 0 ? (
                    <div style={{ padding: "12px 14px", fontSize: 12, color: "var(--text3)" }}>No users found</div>
                  ) : filteredUsers.map(u => (
                    <div
                      key={u.id}
                      onClick={() => { setNotifOneForm(p => ({ ...p, userId: u.id })); setUserSearch(u.name || u.email || u.id); }}
                      style={{
                        padding: "10px 14px", cursor: "pointer", borderBottom: "1px solid var(--border)",
                        background: notifOneForm.userId === u.id ? "var(--accent-soft,rgba(99,102,241,0.1))" : "transparent",
                        transition: "background 0.15s",
                      }}
                      onMouseEnter={e => { if (notifOneForm.userId !== u.id) e.currentTarget.style.background = "rgba(99,102,241,0.06)"; }}
                      onMouseLeave={e => { if (notifOneForm.userId !== u.id) e.currentTarget.style.background = "transparent"; }}
                    >
                      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{u.name || "—"}</div>
                      <div style={{ fontSize: 11, color: "var(--text3)" }}>{u.email} · {u.id?.slice(0, 10)}…</div>
                    </div>
                  ))}
                </div>
              )}
              {selectedUser && (
                <div style={{ marginTop: 8, padding: "8px 12px", borderRadius: 8, background: "rgba(16,185,129,0.08)", border: "1.5px solid rgba(16,185,129,0.25)", fontSize: 12, color: "#10b981", fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
                  ✅ Selected: <span style={{ color: "var(--text)" }}>{selectedUser.name || selectedUser.email}</span>
                </div>
              )}
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: "var(--text2)", marginBottom: 6, display: "block" }}>Title *</label>
              <input value={notifOneForm.title} onChange={e => setNotifOneForm(p => ({ ...p, title: e.target.value }))} placeholder="Notification title…"
                style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1.5px solid var(--border)", background: "var(--bg)", color: "var(--text)", fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
            </div>
            <div style={{ marginBottom: 18 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: "var(--text2)", marginBottom: 6, display: "block" }}>Message</label>
              <textarea value={notifOneForm.body} onChange={e => setNotifOneForm(p => ({ ...p, body: e.target.value }))} placeholder="Optional message body…" rows={3}
                style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1.5px solid var(--border)", background: "var(--bg)", color: "var(--text)", fontSize: 13, fontFamily: "inherit", outline: "none", resize: "none", boxSizing: "border-box" }} />
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => { setNotifOneOpen(false); setNotifOneForm({ title: "", body: "", userId: "" }); setUserSearch(""); }}
                style={{ flex: 1, padding: 10, borderRadius: 10, border: "1.5px solid var(--border)", background: "var(--bg3)", color: "var(--text2)", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
              <button
                onClick={handleSendOne}
                disabled={sendingOne || !notifOneForm.title.trim() || !notifOneForm.userId}
                style={{ flex: 1, padding: 10, borderRadius: 10, border: "none", background: "linear-gradient(135deg,#10b981,#059669)", color: "#fff", fontWeight: 800, cursor: "pointer", fontFamily: "inherit", opacity: (sendingOne || !notifOneForm.userId || !notifOneForm.title.trim()) ? 0.6 : 1 }}
              >
                {sendingOne ? "Sending…" : "👤 Send to User"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── User Extra Actions ───────────────────────────────────────────────────────
function UserExtraActions({ u, showToast, adminUser }) {
  const [open, setOpen] = React.useState(false);
  const [form, setFormState] = React.useState({ title: "", body: "" });
  const [subOpen, setSubOpen] = React.useState(false);
  const [subPlan, setSubPlan] = React.useState("monthly");
  const [sending, setSending] = React.useState(false);

  const handleSendOne = async () => {
    if (!form.title.trim()) return;
    if (sending) return; // منع الضغط المزدوج
    setSending(true);
    try {
      await sendNotification(u.id, { type: "admin_message", title: form.title, body: form.body, data: { adminUid: adminUser?.uid, sentAt: Date.now() } });
      showToast({ msg: `✅ Notification sent to ${u.name || u.email}`, type: "success" });
      setOpen(false);
      setFormState({ title: "", body: "" });
    } catch { showToast({ msg: "Failed to send", type: "error" }); }
    setSending(false);
  };

  const handleGrantSub = async () => {
    setSending(true);
    try {
      const { grantLeaderboardReward } = await import("../services/payment");
      await grantLeaderboardReward(u.id, adminUser?.uid, subPlan, `Admin granted ${subPlan} subscription`);
      showToast({ msg: `✅ ${subPlan} subscription granted to ${u.name || u.email}`, type: "success" });
      setSubOpen(false);
    } catch(e) { showToast({ msg: `Failed: ${e.message}`, type: "error" }); }
    setSending(false);
  };

  return (
    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
      <button onClick={() => setOpen(true)} title="Send Notification"
        style={{ padding: "5px 10px", borderRadius: 8, border: "1.5px solid rgba(99,102,241,0.3)", background: "rgba(99,102,241,0.08)", color: "var(--accent)", fontWeight: 700, cursor: "pointer", fontSize: 11, fontFamily: "inherit", display: "flex", alignItems: "center", gap: 4 }}>
        📣 Notify
      </button>
      <button onClick={() => setSubOpen(true)} title="Grant Subscription"
        style={{ padding: "5px 10px", borderRadius: 8, border: "1.5px solid rgba(245,158,11,0.3)", background: "rgba(245,158,11,0.08)", color: "#d97706", fontWeight: 700, cursor: "pointer", fontSize: 11, fontFamily: "inherit", display: "flex", alignItems: "center", gap: 4 }}>
        ⭐ Sub
      </button>

      {/* Send Notification Modal */}
      {open && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: 20 }}>
          <div style={{ background: "var(--bg2)", border: "1.5px solid var(--border)", borderRadius: 20, padding: 28, maxWidth: 420, width: "100%" }}>
            <h3 style={{ fontWeight: 900, marginBottom: 4, color: "var(--text)", fontSize: 15 }}>📣 Send Notification</h3>
            <p style={{ fontSize: 12, color: "var(--text3)", marginBottom: 16 }}>To: <strong>{u.name || u.email}</strong></p>
            <input value={form.title} onChange={e => setFormState(p => ({ ...p, title: e.target.value }))} placeholder="Title *"
              style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1.5px solid var(--border)", background: "var(--bg)", color: "var(--text)", fontSize: 13, fontFamily: "inherit", outline: "none", marginBottom: 10, boxSizing: "border-box" }} />
            <textarea value={form.body} onChange={e => setFormState(p => ({ ...p, body: e.target.value }))} placeholder="Message body…" rows={3}
              style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1.5px solid var(--border)", background: "var(--bg)", color: "var(--text)", fontSize: 13, fontFamily: "inherit", outline: "none", resize: "none", marginBottom: 16, boxSizing: "border-box" }} />
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setOpen(false)} style={{ flex: 1, padding: 10, borderRadius: 10, border: "1.5px solid var(--border)", background: "var(--bg3)", color: "var(--text2)", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
              <button onClick={handleSendOne} disabled={sending || !form.title.trim()} style={{ flex: 1, padding: 10, borderRadius: 10, border: "none", background: "linear-gradient(135deg,#6366f1,#a855f7)", color: "#fff", fontWeight: 800, cursor: "pointer", fontFamily: "inherit", opacity: sending ? 0.7 : 1 }}>
                {sending ? "Sending…" : "Send"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Grant Subscription Modal */}
      {subOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: 20 }}>
          <div style={{ background: "var(--bg2)", border: "1.5px solid var(--border)", borderRadius: 20, padding: 28, maxWidth: 380, width: "100%" }}>
            <h3 style={{ fontWeight: 900, marginBottom: 4, color: "var(--text)", fontSize: 15 }}>⭐ Grant Subscription</h3>
            <p style={{ fontSize: 12, color: "var(--text3)", marginBottom: 16 }}>Grant free access to: <strong>{u.name || u.email}</strong><br/><span style={{ color: "#10b981", fontSize: 11 }}>Recorded in Revenue as $0 transaction</span></p>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: "var(--text2)", marginBottom: 8, display: "block" }}>Plan Type</label>
              <div style={{ display: "flex", gap: 10 }}>
                {["monthly","yearly"].map(p => (
                  <button key={p} onClick={() => setSubPlan(p)} style={{ flex: 1, padding: "10px", borderRadius: 10, border: `1.5px solid ${subPlan === p ? "var(--accent)" : "var(--border)"}`, background: subPlan === p ? "var(--accent-soft)" : "var(--bg3)", color: subPlan === p ? "var(--accent)" : "var(--text2)", fontWeight: 700, cursor: "pointer", fontFamily: "inherit", fontSize: 13, textTransform: "capitalize" }}>
                    {p === "monthly" ? "💙 Monthly" : "👑 Yearly"}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setSubOpen(false)} style={{ flex: 1, padding: 10, borderRadius: 10, border: "1.5px solid var(--border)", background: "var(--bg3)", color: "var(--text2)", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
              <button onClick={handleGrantSub} disabled={sending} style={{ flex: 1, padding: 10, borderRadius: 10, border: "none", background: "linear-gradient(135deg,#f59e0b,#d97706)", color: "#fff", fontWeight: 800, cursor: "pointer", fontFamily: "inherit", opacity: sending ? 0.7 : 1 }}>
                {sending ? "Granting…" : "⭐ Grant Free"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Refunds Panel (تصميم جديد مع حذف متعدد وإلغاء الوصول) ──────────────────
function RefundsPanel({ users, exams, transactions = [], showToast, adminUid, onRefundAction }) {
  const [refunds, setRefunds]         = useState([]);
  const [loading, setLoading]         = useState(true);
  const [selected, setSelected]       = useState(new Set());
  const [deleting, setDeleting]       = useState(false);
  const [expandedId, setExpandedId]   = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [noteModal, setNoteModal]     = useState(null); // { refund, action }
  const [note, setNote]               = useState("");
  const [filter, setFilter]           = useState("all"); // all | pending | approved | rejected

  const loadRefunds = async () => {
    setLoading(true);
    try {
      const data = await getAllRefundRequests();
      // أحدث أولاً
      setRefunds((data || []).sort((a, b) => {
        const da = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
        const db_ = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
        return db_ - da;
      }));
    } catch (e) { showToast({ msg: `Error loading refunds: ${e.message}`, type: "error" }); }
    setLoading(false);
  };

  useEffect(() => { loadRefunds(); }, []);

  const fmtDate = (d) => {
    if (!d) return "—";
    const date = d?.toDate ? d.toDate() : new Date(d);
    return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  const getUser = (uid) => users.find(u => u.id === uid);
  const getExam = (eid) => exams.find(e => e.id === eid);

  const STATUS_STYLES = {
    pending:  { bg: "rgba(245,158,11,0.1)",  border: "rgba(245,158,11,0.35)", color: "#d97706",  label: "⏳ Pending",  dot: "#f59e0b" },
    approved: { bg: "rgba(16,185,129,0.08)", border: "rgba(16,185,129,0.3)",  color: "#059669",  label: "✅ Approved", dot: "#10b981" },
    rejected: { bg: "rgba(100,116,139,0.08)",border: "rgba(100,116,139,0.3)", color: "#64748b",  label: "❌ Rejected", dot: "#94a3b8" },
  };

  const filtered = refunds.filter(r => filter === "all" || r.status === filter);

  const toggleSelect = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map(r => r.id)));
  };

  const handleDeleteSelected = async () => {
    if (!selected.size) return;
    if (!window.confirm(`Delete ${selected.size} refund request${selected.size > 1 ? "s" : ""}? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      const { deleteRefundRequest } = await import("../services/payment").catch(() => ({}));
      if (typeof deleteRefundRequest === "function") {
        await Promise.all([...selected].map(id => deleteRefundRequest(id).catch(() => {})));
      } else {
        // Fallback: delete via firestore directly
        const { doc, deleteDoc } = await import("firebase/firestore");
        const { db: fdb } = await import("../firebase");
        await Promise.all([...selected].map(id => deleteDoc(doc(fdb, "refund_requests", id)).catch(() => {})));
      }
      showToast({ msg: `✅ Deleted ${selected.size} refund request${selected.size > 1 ? "s" : ""}`, type: "success" });
      setSelected(new Set());
      await loadRefunds();
    } catch (e) { showToast({ msg: `Error: ${e.message}`, type: "error" }); }
    setDeleting(false);
  };

  const handleAction = async (refund, action) => {
    setNoteModal({ refund, action });
    setNote("");
  };

  const confirmAction = async () => {
    if (!noteModal) return;
    const { refund, action } = noteModal;
    setActionLoading(refund.id + action);
    try {
      await onRefundAction(refund.id, action, note.trim(), {
        type: refund.type || (refund.planId ? "subscription" : "exam"),
        userId: refund.userId,
        examId: refund.examId,
        planId: refund.planId,
      });
      setNoteModal(null);
      await loadRefunds();
    } catch (e) { showToast({ msg: `Error: ${e.message}`, type: "error" }); }
    setActionLoading(null);
  };

  const counts = {
    all: refunds.length,
    pending: refunds.filter(r => r.status === "pending").length,
    approved: refunds.filter(r => r.status === "approved").length,
    rejected: refunds.filter(r => r.status === "rejected").length,
  };

  return (
    <div>
      <style>{`
        .rfd-row { transition: all 0.2s; }
        .rfd-row:hover { background: var(--bg3) !important; }
        .rfd-check { accent-color: var(--accent); }
      `}</style>

      {/* Header Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: 14, marginBottom: 24 }}>
        {[
          { key: "all",      icon: "📋", label: "Total Requests",  color: "#6366f1" },
          { key: "pending",  icon: "⏳", label: "Pending Review",  color: "#d97706" },
          { key: "approved", icon: "✅", label: "Approved",        color: "#059669" },
          { key: "rejected", icon: "❌", label: "Rejected",        color: "#64748b" },
        ].map(s => (
          <button key={s.key} onClick={() => setFilter(s.key)} style={{
            background: filter === s.key ? `${s.color}12` : "var(--bg2)",
            border: `1.5px solid ${filter === s.key ? s.color : "var(--border)"}`,
            borderRadius: 16, padding: "16px 18px", textAlign: "left", cursor: "pointer",
            transition: "all 0.2s", fontFamily: "inherit",
            boxShadow: filter === s.key ? `0 4px 16px ${s.color}20` : "none",
          }}>
            <div style={{ fontSize: 22, marginBottom: 6 }}>{s.icon}</div>
            <div style={{ fontSize: 26, fontWeight: 900, color: s.color, lineHeight: 1 }}>{counts[s.key]}</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: filter === s.key ? s.color : "var(--text3)", marginTop: 4 }}>{s.label}</div>
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, gap: 12, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {selected.size > 0 && (
            <button onClick={handleDeleteSelected} disabled={deleting} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 10, border: "1.5px solid rgba(239,68,68,0.4)", background: "rgba(239,68,68,0.08)", color: "var(--red)", fontWeight: 700, cursor: deleting ? "not-allowed" : "pointer", fontSize: 12, fontFamily: "inherit", transition: "all 0.18s" }}
              onMouseEnter={e => !deleting && (e.currentTarget.style.background = "rgba(239,68,68,0.15)")}
              onMouseLeave={e => (e.currentTarget.style.background = "rgba(239,68,68,0.08)")}>
              🗑️ Delete Selected ({selected.size})
            </button>
          )}
          <span style={{ fontSize: 12, color: "var(--text3)", fontWeight: 600 }}>{filtered.length} request{filtered.length !== 1 ? "s" : ""}</span>
        </div>
        <button onClick={loadRefunds} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 9, border: "1.5px solid var(--border)", background: "var(--bg3)", color: "var(--text2)", fontWeight: 600, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
          🔄 Refresh
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 80 }}>
          <Spinner size={36} color="var(--accent)" />
          <p style={{ marginTop: 12, color: "var(--text3)", fontSize: 13 }}>Loading refund requests…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: "60px 24px", textAlign: "center", background: "var(--bg2)", border: "1.5px dashed var(--border)", borderRadius: 20 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>↩️</div>
          <div style={{ fontSize: 15, fontWeight: 800, color: "var(--text2)", marginBottom: 6 }}>
            {filter === "all" ? "No refund requests yet" : `No ${filter} requests`}
          </div>
          <div style={{ fontSize: 12, color: "var(--text3)" }}>Refund requests from members will appear here.</div>
        </div>
      ) : (
        <div style={{ background: "var(--bg2)", border: "1.5px solid var(--border)", borderRadius: 18, overflow: "hidden" }}>
          {/* Select All Header */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 20px", background: "var(--bg3)", borderBottom: "1.5px solid var(--border)", fontSize: 11, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            <input type="checkbox" className="rfd-check" checked={selected.size === filtered.length && filtered.length > 0} onChange={toggleSelectAll} style={{ width: 16, height: 16 }} />
            <span style={{ flex: 2 }}>Member / Item</span>
            <span style={{ flex: 1, textAlign: "center" }}>Amount</span>
            <span style={{ flex: 1, textAlign: "center" }}>Method</span>
            <span style={{ flex: 1, textAlign: "center" }}>Date</span>
            <span style={{ flex: 1, textAlign: "center" }}>Status</span>
            <span style={{ width: 200, textAlign: "right" }}>Actions</span>
          </div>

          {filtered.map((refund, idx) => {
            const u = getUser(refund.userId);
            const exam = getExam(refund.examId);
            const st = STATUS_STYLES[refund.status] || STATUS_STYLES.pending;
            const isExpanded = expandedId === refund.id;
            const isChecked = selected.has(refund.id);
            const refDate = refund.createdAt?.toDate ? refund.createdAt.toDate() : new Date(refund.createdAt || 0);
            const itemName = refund.planId
              ? `${refund.planId === "monthly" ? "Monthly" : "Yearly"} Subscription`
              : (exam?.title || "Exam Purchase");

            return (
              <div key={refund.id} style={{ borderBottom: idx < filtered.length - 1 ? "1px solid var(--border)" : "none" }}>
                {/* Main Row */}
                <div className="rfd-row" style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 20px", background: isChecked ? "rgba(99,102,241,0.04)" : "transparent", cursor: "pointer" }}>
                  <input type="checkbox" className="rfd-check" checked={isChecked} onChange={(e) => { e.stopPropagation(); toggleSelect(refund.id); }} onClick={e => e.stopPropagation()} style={{ width: 16, height: 16, flexShrink: 0 }} />

                  {/* Member + Item */}
                  <div style={{ flex: 2, minWidth: 0, display: "flex", alignItems: "center", gap: 10 }} onClick={() => setExpandedId(isExpanded ? null : refund.id)}>
                    <div style={{ width: 38, height: 38, borderRadius: 10, background: `${st.dot}15`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0, border: `1.5px solid ${st.dot}30` }}>
                      {refund.planId ? "⭐" : "📋"}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{itemName}</div>
                      <div style={{ fontSize: 11, color: "var(--text3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u?.name || "Unknown"} · {u?.email || refund.userId?.slice(0,16)}</div>
                    </div>
                  </div>

                  {/* Amount */}
                  <div style={{ flex: 1, textAlign: "center" }} onClick={() => setExpandedId(isExpanded ? null : refund.id)}>
                    <span style={{ fontSize: 15, fontWeight: 900, color: "#10b981" }}>${Number(refund.amount || 0).toFixed(2)}</span>
                  </div>

                  {/* Method */}
                 <div style={{ flex: 1, textAlign: "center", fontSize: 11, color: "var(--text3)", fontWeight: 600 }} onClick={() => setExpandedId(isExpanded ? null : refund.id)}>
  {(() => {
                    // Look up the original transaction to get correct payment method
                    const linkedTx = transactions.find(t => t.id === refund.transactionId);
                    const method = linkedTx?.paymentMethod || refund.paymentMethod || "";
                    if (method === "instapay" || refund.instapayNumber || linkedTx?.referenceId?.toLowerCase?.().includes("instapay")) return "🏦 Instapay";
                    if (method === "paypal" || refund.paypalAccount || linkedTx?.paypalOrderId) return "💳 PayPal";
                    if (method === "stripe" || linkedTx?.stripePaymentId) return "💳 Stripe";
                    if (method === "free" || method === "reward" || method === "admin") return "🎁 Free / Admin";
                    if (method === "coupon") return "🏷️ Coupon";
                    if (method) return method;
                    return "💳 Card / Other";
                  })()}
</div>

                  {/* Date */}
                  <div style={{ flex: 1, textAlign: "center", fontSize: 11, color: "var(--text3)" }} onClick={() => setExpandedId(isExpanded ? null : refund.id)}>
                    {refDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </div>

                  {/* Status Badge */}
                  <div style={{ flex: 1, textAlign: "center" }} onClick={() => setExpandedId(isExpanded ? null : refund.id)}>
                    <span style={{ padding: "4px 10px", borderRadius: 99, background: st.bg, border: `1px solid ${st.border}`, color: st.color, fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" }}>
                      {st.label}
                    </span>
                  </div>

                  {/* Actions */}
                  <div style={{ width: 200, display: "flex", gap: 6, justifyContent: "flex-end", flexShrink: 0 }}>
                    {refund.status === "pending" ? (
                      <>
                        <button onClick={(e) => { e.stopPropagation(); handleAction(refund, "approved"); }}
                          disabled={actionLoading === refund.id + "approved"}
                          style={{ padding: "6px 12px", borderRadius: 8, border: "1.5px solid rgba(16,185,129,0.4)", background: "rgba(16,185,129,0.08)", color: "#059669", fontWeight: 700, cursor: "pointer", fontSize: 11, fontFamily: "inherit", transition: "all 0.15s", whiteSpace: "nowrap" }}
                          onMouseEnter={e => e.currentTarget.style.background = "rgba(16,185,129,0.16)"}
                          onMouseLeave={e => e.currentTarget.style.background = "rgba(16,185,129,0.08)"}>
                          {actionLoading === refund.id + "approved" ? "…" : "✅ Approve"}
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); handleAction(refund, "rejected"); }}
                          disabled={actionLoading === refund.id + "rejected"}
                          style={{ padding: "6px 12px", borderRadius: 8, border: "1.5px solid rgba(100,116,139,0.3)", background: "rgba(100,116,139,0.07)", color: "var(--text3)", fontWeight: 700, cursor: "pointer", fontSize: 11, fontFamily: "inherit", transition: "all 0.15s", whiteSpace: "nowrap" }}
                          onMouseEnter={e => e.currentTarget.style.background = "rgba(100,116,139,0.14)"}
                          onMouseLeave={e => e.currentTarget.style.background = "rgba(100,116,139,0.07)"}>
                          {actionLoading === refund.id + "rejected" ? "…" : "❌ Reject"}
                        </button>
                      </>
                    ) : (
                      <span style={{ fontSize: 11, color: "var(--text3)", padding: "6px 10px", background: "var(--bg3)", borderRadius: 8, fontWeight: 600 }}>
                        {refund.status === "approved" ? "✅ Processed" : "❌ Declined"}
                      </span>
                    )}
                    <button onClick={(e) => { e.stopPropagation(); toggleSelect(refund.id); setExpandedId(isExpanded ? null : refund.id); }}
                      style={{ width: 28, height: 28, borderRadius: 7, border: "1.5px solid var(--border)", background: "var(--bg3)", color: "var(--text3)", cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s", flexShrink: 0 }}>
                      {isExpanded ? "▲" : "▼"}
                    </button>
                  </div>
                </div>

                {/* Expanded Detail */}
                {isExpanded && (
                  <div style={{ padding: "16px 20px 20px 70px", background: "rgba(99,102,241,0.03)", borderTop: "1px solid var(--border)" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 10, marginBottom: 14 }}>
                      {[
                        { label: "Transaction ID", value: refund.transactionId?.slice(0, 24) || "—" },
                        { label: "User ID", value: refund.userId?.slice(0, 20) || "—" },
                        { label: "Reason", value: refund.reason?.split("\n")[0] || "—" },
                        refund.paypalAccount && { label: "Refund to PayPal", value: refund.paypalAccount },
                        refund.adminNote && { label: "Admin Note", value: refund.adminNote },
                        { label: "Submitted", value: fmtDate(refund.createdAt) },
                        refund.resolvedAt && { label: "Resolved", value: fmtDate(refund.resolvedAt) },
                      ].filter(Boolean).map((d, i) => (
                        <div key={i} style={{ background: "var(--bg2)", borderRadius: 10, padding: "10px 14px" }}>
                          <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>{d.label}</div>
                          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text)", wordBreak: "break-all" }}>{d.value}</div>
                        </div>
                      ))}
                    </div>
                    {refund.reason && refund.reason.includes("\n") && (
                      <div style={{ background: "var(--bg2)", borderRadius: 10, padding: "10px 14px", marginBottom: 10 }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Full Reason</div>
                        <div style={{ fontSize: 12, color: "var(--text2)", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{refund.reason}</div>
                      </div>
                    )}
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => { setSelected(new Set([refund.id])); handleDeleteSelected(); }}
                        style={{ padding: "7px 14px", borderRadius: 9, border: "1.5px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.07)", color: "var(--red)", fontWeight: 700, cursor: "pointer", fontSize: 11, fontFamily: "inherit" }}>
                        🗑️ Delete Request
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Action Note Modal */}
      {noteModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(5px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "var(--bg2)", border: `1.5px solid ${noteModal.action === "approved" ? "rgba(16,185,129,0.4)" : "rgba(100,116,139,0.4)"}`, borderRadius: 22, padding: 28, maxWidth: 460, width: "100%", boxShadow: "0 24px 80px rgba(0,0,0,0.45)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: noteModal.action === "approved" ? "rgba(16,185,129,0.12)" : "rgba(100,116,139,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>
                {noteModal.action === "approved" ? "✅" : "❌"}
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 900, color: "var(--text)" }}>
                  {noteModal.action === "approved" ? "Approve Refund" : "Reject Refund"}
                </div>
                <div style={{ fontSize: 12, color: "var(--text3)" }}>
                  {noteModal.action === "approved"
                    ? "⚠️ This will revoke user access immediately."
                    : "The user will be notified of the rejection."}
                </div>
              </div>
            </div>

            <div style={{ background: "var(--bg3)", borderRadius: 12, padding: "12px 14px", marginBottom: 16, fontSize: 12 }}>
              <div style={{ color: "var(--text3)", marginBottom: 2 }}>Request by</div>
              <div style={{ fontWeight: 700, color: "var(--text)" }}>
                {getUser(noteModal.refund.userId)?.name || "Unknown"} · ${Number(noteModal.refund.amount || 0).toFixed(2)} USD
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 800, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 7 }}>
                Admin Note <span style={{ fontWeight: 400, textTransform: "none", fontSize: 10 }}>(optional — sent to user)</span>
              </label>
              <textarea value={note} onChange={e => setNote(e.target.value)} rows={3} maxLength={400}
                placeholder={noteModal.action === "approved" ? "e.g. Refund approved. Amount will be credited in 3–5 business days." : "e.g. Request rejected — exam usage exceeds 15% limit."}
                style={{ width: "100%", padding: "11px 14px", borderRadius: 11, border: "1.5px solid var(--border)", background: "var(--bg3)", color: "var(--text)", fontSize: 13, fontFamily: "inherit", outline: "none", resize: "vertical", boxSizing: "border-box" }}
                onFocus={e => e.target.style.borderColor = "var(--accent)"}
                onBlur={e => e.target.style.borderColor = "var(--border)"} />
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setNoteModal(null)} style={{ flex: 1, padding: "12px", borderRadius: 11, border: "1.5px solid var(--border)", background: "transparent", color: "var(--text2)", fontWeight: 700, cursor: "pointer", fontFamily: "inherit", fontSize: 13 }}
                onMouseEnter={e => e.currentTarget.style.background = "var(--bg3)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>Cancel</button>
              <button onClick={confirmAction} disabled={!!actionLoading} style={{
                flex: 2, padding: "12px", borderRadius: 11, border: "none", fontWeight: 800, cursor: actionLoading ? "not-allowed" : "pointer", fontFamily: "inherit", fontSize: 13,
                background: actionLoading ? "var(--bg3)" : noteModal.action === "approved"
                  ? "linear-gradient(135deg,#059669,#047857)"
                  : "linear-gradient(135deg,#64748b,#475569)",
                color: actionLoading ? "var(--text3)" : "#fff",
                opacity: actionLoading ? 0.7 : 1,
                boxShadow: actionLoading ? "none" : noteModal.action === "approved" ? "0 4px 14px rgba(5,150,105,0.35)" : "none",
              }}>
                {actionLoading ? "⏳ Processing…" : noteModal.action === "approved" ? "✅ Confirm Approval" : "❌ Confirm Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
// داخل Admin.jsx، بعد تعريف الدوال المساعدة (مثل RefundsPanel)، وقبل export default

// ========== ADMIN REFERRAL DASHBOARD ==========
function AdminReferralDashboard({ showToast, adminUid }) {
  const [referrals, setReferrals] = useState([]); // قائمة وثائق الـ referrals
  const [usersMap, setUsersMap] = useState({}); // خريطة user id => user data
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expandedUserId, setExpandedUserId] = useState(null);
  const [stats, setStats] = useState({
    totalReferrers: 0,
    totalReferredUsers: 0,
    totalConverted: 0,
    totalCouponsGranted: 0,
    totalSubscriptionsGranted: 0,
  });
  const [actionLoading, setActionLoading] = useState(null);

  // جلب البيانات
  const loadReferralData = async () => {
    setLoading(true);
    try {
      // 1. جلب جميع وثائق الـ referrals
      const referralsSnap = await getDocs(collection(db, "referrals"));
      const referralsData = referralsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setReferrals(referralsData);

      // 2. جلب جميع المستخدمين (لأسماء وأسامي المحيلين والمحالين)
      const usersSnap = await getDocs(collection(db, "users"));
      const usersObj = {};
      usersSnap.docs.forEach(doc => {
        usersObj[doc.id] = { id: doc.id, ...doc.data() };
      });
      setUsersMap(usersObj);

      // 3. حساب الإحصائيات
      let totalReferred = 0;
      let totalConverted = 0;
      let totalCoupons = 0;
      let totalSubs = 0;

      referralsData.forEach(ref => {
        const referredArr = ref.referredUsers || [];
        const convertedArr = ref.convertedUsers || [];
        totalReferred += referredArr.length;
        totalConverted += convertedArr.length;
        const coupons = ref.earnedCoupons || [];
        totalCoupons += coupons.length;
        const tiers = ref.tiersGranted || [];
        if (tiers.includes("monthly_sub")) totalSubs++;
      });

      setStats({
        totalReferrers: referralsData.length,
        totalReferredUsers: totalReferred,
        totalConverted,
        totalCouponsGranted: totalCoupons,
        totalSubscriptionsGranted: totalSubs,
      });
    } catch (err) {
      console.error("Error loading referral data:", err);
      showToast({ msg: "Failed to load referral data", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  // التحميل عند أول مرة يدخل فيها التبويب
  useEffect(() => {
    loadReferralData();
  }, []);

  // تصفية المحيلين حسب البحث
  const filteredReferrers = referrals.filter(ref => {
    const user = usersMap[ref.userId];
    const name = user?.name || user?.email || ref.userId;
    if (!search.trim()) return true;
    return name.toLowerCase().includes(search.toLowerCase()) ||
           (ref.code || "").toLowerCase().includes(search.toLowerCase());
  });

  // دالة لعرض التفاصيل الموسعة لمحيل معين
  const toggleExpand = (userId) => {
    setExpandedUserId(expandedUserId === userId ? null : userId);
  };

  // دالة منح مكافأة يدوية (للاستثناءات)
  const grantManualReward = async (referrerId, rewardType) => {
    if (!window.confirm(`Are you sure you want to grant ${rewardType === "monthly_sub" ? "Monthly Subscription" : "Free Exam Coupon"} to this user?`)) return;
    setActionLoading(referrerId);
    try {
      const referrerRef = doc(db, "referrals", referrerId);
      const refSnap = await getDoc(referrerRef);
      if (!refSnap.exists()) throw new Error("Referral document not found");
      const data = refSnap.data();
      const tiersGranted = data.tiersGranted || [];
      const earnedCoupons = data.earnedCoupons || [];

      if (rewardType === "monthly_sub") {
        if (tiersGranted.includes("monthly_sub")) {
          showToast({ msg: "User already has monthly subscription reward", type: "warning" });
          return;
        }
        // منح الاشتراك
        const { grantLeaderboardReward } = await import("../services/payment");
        await grantLeaderboardReward(referrerId, adminUid, "monthly", "Manual reward by admin");
        // تحديث tiersGranted في referral doc
        await updateDoc(referrerRef, {
          tiersGranted: [...tiersGranted, "monthly_sub"],
        });
        showToast({ msg: "Monthly subscription granted successfully", type: "success" });
      } else if (rewardType === "free_exam") {
        // منح كوبون واحد
        const newCoupon = {
          code: `ADMIN_${referrerId.slice(0,4)}_${Date.now()}`,
          type: "free_exam",
          forUser: referrerId,
          earnedAt: new Date().toISOString(),
          used: false,
          expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        };
        await updateDoc(referrerRef, {
          earnedCoupons: [...earnedCoupons, newCoupon],
        });
        // إضافة الكوبون إلى إعدادات المنصة
        const settingsRef = doc(db, "settings", "platform");
        const settingsSnap = await getDoc(settingsRef);
        const currentSettings = settingsSnap.exists() ? settingsSnap.data() : {};
        const coupons = currentSettings.coupons || [];
        const platformCoupon = {
          code: newCoupon.code,
          discountPercent: 100,
          discountAmount: 0,
          maxUses: 1,
          usedCount: 0,
          expiresAt: newCoupon.expiresAt,
          isActive: true,
          scope: "exams",
          onePerUser: true,
          usedByUsers: [],
          type: "referral_reward",
          forUser: referrerId,
          createdAt: new Date().toISOString(),
        };
        await setDoc(settingsRef, { ...currentSettings, coupons: [...coupons, platformCoupon] }, { merge: true });
        showToast({ msg: "Free exam coupon granted", type: "success" });
      }
      await loadReferralData(); // تحديث البيانات
    } catch (err) {
      console.error(err);
      showToast({ msg: `Error: ${err.message}`, type: "error" });
    } finally {
      setActionLoading(null);
    }
  };

  // دالة إرسال إشعار لمستخدم معين
  const sendMessageToUser = async (userId) => {
    const msg = prompt("Enter notification message:", "Your referral reward has been reviewed by admin.");
    if (!msg) return;
    try {
      await sendNotification(userId, {
        type: "admin_message",
        title: "📢 Referral Program Update",
        body: msg,
        data: { adminUid },
      });
      showToast({ msg: "Notification sent", type: "success" });
    } catch (err) {
      showToast({ msg: `Error: ${err.message}`, type: "error" });
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: 60 }}>
        <Spinner size={40} color="var(--accent)" />
        <p style={{ marginTop: 12, color: "var(--text3)" }}>Loading referral data...</p>
      </div>
    );
  }

  return (
    <div>
      {/* إحصائيات سريعة */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px,1fr))", gap: 14, marginBottom: 24 }}>
        {[
          { icon: "👥", label: "Referrers", value: stats.totalReferrers, color: "#4f46e5" },
          { icon: "📎", label: "Total Referrals", value: stats.totalReferredUsers, color: "#0891b2" },
          { icon: "🔄", label: "Converted", value: stats.totalConverted, color: "#10b981" },
          { icon: "🎫", label: "Coupons Given", value: stats.totalCouponsGranted, color: "#f59e0b" },
          { icon: "⭐", label: "Subscriptions Given", value: stats.totalSubscriptionsGranted, color: "#d97706" },
        ].map((s, i) => (
          <div key={i} style={{ background: "var(--bg2)", border: `1.5px solid ${s.color}22`, borderRadius: 14, padding: "16px" }}>
            <div style={{ fontSize: 22, marginBottom: 6 }}>{s.icon}</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 11, color: "var(--text3)", fontWeight: 600, marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* شريط التحكم */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, gap: 12, flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
          <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 13 }}>🔍</span>
          <input
            type="text"
            placeholder="Search by referrer name or code..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: "100%", padding: "9px 12px 9px 34px", borderRadius: 10, border: "1.5px solid var(--border)", background: "var(--bg)", color: "var(--text)", fontSize: 13, fontFamily: "inherit", outline: "none" }}
          />
        </div>
        <button onClick={loadReferralData} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 10, border: "1.5px solid var(--border)", background: "var(--bg3)", color: "var(--text2)", fontWeight: 600, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
          🔄 Refresh Data
        </button>
      </div>

      {/* جدول المحيلين */}
      <div style={{ background: "var(--bg2)", border: "1.5px solid var(--border)", borderRadius: 18, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "30px 1.5fr 1fr 80px 80px 100px 100px", padding: "12px 16px", background: "var(--bg3)", borderBottom: "1.5px solid var(--border)", fontSize: 10, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          <span></span>
          <span>Referrer</span>
          <span>Referral Code</span>
          <span>Referred</span>
          <span>Converted</span>
          <span>Coupons</span>
          <span>Actions</span>
        </div>
        {filteredReferrers.length === 0 ? (
          <div style={{ padding: "48px 24px", textAlign: "center", color: "var(--text3)" }}>
            No referrers found.
          </div>
        ) : (
          filteredReferrers.map((ref, idx) => {
            const user = usersMap[ref.userId];
            const name = user?.name || user?.email || ref.userId;
            const referredCount = (ref.referredUsers || []).length;
            const convertedCount = (ref.convertedUsers || []).length;
            const couponsCount = (ref.earnedCoupons || []).filter(c => !c.used).length;
            const isExpanded = expandedUserId === ref.userId;
            return (
              <div key={ref.userId} style={{ borderBottom: idx < filteredReferrers.length - 1 ? "1px solid var(--border)" : "none" }}>
                <div style={{ display: "grid", gridTemplateColumns: "30px 1.5fr 1fr 80px 80px 100px 100px", padding: "12px 16px", alignItems: "center", background: isExpanded ? "var(--bg3)" : "transparent" }}>
                  <button onClick={() => toggleExpand(ref.userId)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "var(--text2)" }}>
                    {isExpanded ? "▼" : "▶"}
                  </button>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{name}</div>
                    <div style={{ fontSize: 10, color: "var(--text3)" }}>{user?.email || "—"}</div>
                  </div>
                  <code style={{ fontFamily: "monospace", fontSize: 12, background: "var(--bg)", padding: "4px 8px", borderRadius: 6, display: "inline-block", width: "fit-content" }}>{ref.code}</code>
                  <span style={{ fontWeight: 700, color: "#4f46e5" }}>{referredCount}</span>
                  <span style={{ fontWeight: 700, color: "#10b981" }}>{convertedCount}</span>
                  <span style={{ fontWeight: 700, color: "#f59e0b" }}>{couponsCount}</span>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => sendMessageToUser(ref.userId)} title="Send notification" style={{ padding: "4px 8px", borderRadius: 6, border: "1px solid var(--border)", background: "var(--bg)", cursor: "pointer", fontSize: 11 }}>
                      📣
                    </button>
                    {!ref.tiersGranted?.includes("free_exam") && (
                      <button onClick={() => grantManualReward(ref.userId, "free_exam")} disabled={actionLoading === ref.userId} style={{ padding: "4px 8px", borderRadius: 6, border: "1px solid #10b981", background: "#10b98110", color: "#10b981", cursor: "pointer", fontSize: 11 }}>
                        🎫
                      </button>
                    )}
                    {!ref.tiersGranted?.includes("monthly_sub") && (
                      <button onClick={() => grantManualReward(ref.userId, "monthly_sub")} disabled={actionLoading === ref.userId} style={{ padding: "4px 8px", borderRadius: 6, border: "1px solid #f59e0b", background: "#f59e0b10", color: "#f59e0b", cursor: "pointer", fontSize: 11 }}>
                        ⭐
                      </button>
                    )}
                  </div>
                </div>
                {isExpanded && (
                  <div style={{ padding: "12px 20px 20px 46px", background: "rgba(99,102,241,0.02)", borderTop: "1px solid var(--border)" }}>
                    <div style={{ fontSize: 12, fontWeight: 800, marginBottom: 10 }}>📋 Referred Users</div>
                    {ref.referredUsers && ref.referredUsers.length > 0 ? (
                      <table style={{ width: "100%", fontSize: 11, borderCollapse: "collapse" }}>
                        <thead>
                          <tr style={{ borderBottom: "1px solid var(--border)", color: "var(--text3)" }}>
                            <th style={{ textAlign: "left", padding: "6px 0" }}>User</th>
                            <th style={{ textAlign: "left", padding: "6px 12px" }}>Registered</th>
                            <th style={{ textAlign: "left", padding: "6px 12px" }}>Purchased</th>
                          </tr>
                        </thead>
                        <tbody>
                          {ref.referredUsers.map(uid => {
                            const referredUser = usersMap[uid];
                            const isConverted = ref.convertedUsers?.includes(uid);
                            return (
                              <tr key={uid} style={{ borderBottom: "1px solid var(--border-light)" }}>
                                <td style={{ padding: "6px 0" }}>{referredUser?.name || referredUser?.email || uid.slice(0,8)}</td>
                                <td style={{ padding: "6px 12px" }}>{referredUser?.createdAt ? new Date(referredUser.createdAt.seconds * 1000).toLocaleDateString() : "—"}</td>
                                <td style={{ padding: "6px 12px" }}>{isConverted ? <Tag color="#10b981">✅ Yes</Tag> : <Tag color="#64748b">⏳ No</Tag>}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    ) : (
                      <div style={{ fontSize: 11, color: "var(--text3)", padding: "12px 0" }}>No referred users yet.</div>
                    )}
                    {/* عرض الكوبونات الممنوحة */}
                    {ref.earnedCoupons && ref.earnedCoupons.length > 0 && (
                      <div style={{ marginTop: 16 }}>
                        <div style={{ fontSize: 12, fontWeight: 800, marginBottom: 8 }}>🎁 Earned Coupons</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                          {ref.earnedCoupons.map((c, i) => (
                            <div key={i} style={{ background: "var(--bg)", padding: "6px 10px", borderRadius: 8, fontSize: 11, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <code>{c.code}</code>
                              <span style={{ color: c.used ? "#64748b" : "#10b981" }}>{c.used ? "Used" : "Active"}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
// ─── Contacts Panel ───────────────────────────────────────────────────────────
function ContactsPanel({ showToast, adminUid }) {
  const [messages, setMessages]         = React.useState([]);
  const [loading, setLoading]           = React.useState(true);
  const [filter, setFilter]             = React.useState("all");   // all | unread | member | visitor
  const [search, setSearch]             = React.useState("");
  const [selected, setSelected]         = React.useState(null);    // opened message
  const [replyModal, setReplyModal]     = React.useState(null);    // { msg, mode: "notify"|"email" }
  const [replyText, setReplyText]       = React.useState("");
  const [sending, setSending]           = React.useState(false);
  const [deletingId, setDeletingId]     = React.useState(null);
  
  // --- Batch delete states ---
  const [batchDeleteMode, setBatchDeleteMode] = React.useState(false);
  const [selectedMessages, setSelectedMessages] = React.useState(new Set());
  const [deletingBatch, setDeletingBatch] = React.useState(false);

  const loadMessages = async () => {
    setLoading(true);
    try {
      const { collection: col, getDocs: gDocs, query, orderBy, getFirestore } = await import("firebase/firestore");
      const { db: fdb } = await import("../firebase");
      const q = query(col(fdb, "contactMessages"), orderBy("createdAt", "desc"));
      const snap = await gDocs(q);
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) {
      showToast({ msg: `Error loading messages: ${e.message}`, type: "error" });
    }
    setLoading(false);
  };

  React.useEffect(() => { loadMessages(); }, []);

  const markRead = async (id) => {
    try {
      const { doc, updateDoc } = await import("firebase/firestore");
      const { db: fdb } = await import("../firebase");
      await updateDoc(doc(fdb, "contactMessages", id), { status: "read" });
      setMessages(prev => prev.map(m => m.id === id ? { ...m, status: "read" } : m));
    } catch { /* silent */ }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this message?")) return;
    setDeletingId(id);
    try {
      const { doc, deleteDoc } = await import("firebase/firestore");
      const { db: fdb } = await import("../firebase");
      await deleteDoc(doc(fdb, "contactMessages", id));
      setMessages(prev => prev.filter(m => m.id !== id));
      if (selected?.id === id) setSelected(null);
      // Remove from batch selection if present
      setSelectedMessages(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
      showToast({ msg: "Message deleted", type: "success" });
    } catch (e) {
      showToast({ msg: `Error: ${e.message}`, type: "error" });
    }
    setDeletingId(null);
  };

  // --- Batch delete functions ---
  const toggleBatchSelection = (id) => {
    setSelectedMessages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const selectAllFiltered = () => {
    const filteredIds = filtered.map(m => m.id);
    setSelectedMessages(new Set(filteredIds));
  };

  const clearBatchSelection = () => {
    setSelectedMessages(new Set());
    setBatchDeleteMode(false);
  };

  const handleBatchDelete = async () => {
    if (selectedMessages.size === 0) {
      showToast({ msg: "No messages selected", type: "error" });
      return;
    }
    
    if (!window.confirm(`Delete ${selectedMessages.size} selected message${selectedMessages.size > 1 ? 's' : ''}? This action cannot be undone.`)) return;
    
    setDeletingBatch(true);
    let successCount = 0;
    let errorCount = 0;
    
    try {
      const { doc, deleteDoc, writeBatch } = await import("firebase/firestore");
      const { db: fdb } = await import("../firebase");
      
      // Use batch write for better performance
      const batch = writeBatch(fdb);
      const idsToDelete = Array.from(selectedMessages);
      
      for (const id of idsToDelete) {
        const messageRef = doc(fdb, "contactMessages", id);
        batch.delete(messageRef);
      }
      
      await batch.commit();
      successCount = idsToDelete.length;
      
      // Update local state
      setMessages(prev => prev.filter(m => !selectedMessages.has(m.id)));
      if (selected && selectedMessages.has(selected.id)) {
        setSelected(null);
      }
      
      showToast({ msg: `✅ ${successCount} message${successCount > 1 ? 's' : ''} deleted successfully`, type: "success" });
      
      // Exit batch mode
      setBatchDeleteMode(false);
      setSelectedMessages(new Set());
      
    } catch (e) {
      errorCount = 1;
      showToast({ msg: `Error deleting messages: ${e.message}`, type: "error" });
    }
    
    setDeletingBatch(false);
  };

  const openMessage = async (msg) => {
    // Don't open if in batch delete mode
    if (batchDeleteMode) return;
    setSelected(msg);
    if (msg.status === "unread") await markRead(msg.id);
  };

  const handleReply = (msg) => {
    setReplyModal({ msg, mode: msg.senderType === "member" ? "notify" : "email" });
    setReplyText("");
  };

  const sendReply = async () => {
    if (!replyText.trim() || !replyModal) return;
    setSending(true);
    const { msg, mode } = replyModal;
    try {
      if (mode === "notify" && msg.userId) {
        // Send in-app notification to member
        await sendNotification(msg.userId, {
          type:  "contact_reply",
          title: `📬 Reply to your message: "${msg.subject}"`,
          body:  replyText.trim(),
          data:  { adminUid, originalMsgId: msg.id, sentAt: Date.now() },
        });
      }
      // Save reply on the message doc regardless
      const { doc, updateDoc, serverTimestamp } = await import("firebase/firestore");
      const { db: fdb } = await import("../firebase");
      await updateDoc(doc(fdb, "contactMessages", msg.id), {
        status:     "replied",
        adminReply: replyText.trim(),
        repliedAt:  serverTimestamp(),
      });
      setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, status: "replied", adminReply: replyText.trim() } : m));
      if (selected?.id === msg.id) setSelected(p => ({ ...p, status: "replied", adminReply: replyText.trim() }));
      showToast({ msg: mode === "notify" ? "✅ Notification sent to member!" : "✅ Reply saved — contact them via email.", type: "success" });
      setReplyModal(null);
      setReplyText("");
    } catch (e) {
      showToast({ msg: `Error: ${e.message}`, type: "error" });
    }
    setSending(false);
  };

  const fmtDate = (ts) => {
    if (!ts) return "—";
    const d = ts?.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  const STATUS_CFG = {
    unread:  { label: "Unread",  color: "#ef4444",  bg: "rgba(239,68,68,0.1)"   },
    read:    { label: "Read",    color: "#64748b",  bg: "rgba(100,116,139,0.1)" },
    replied: { label: "Replied", color: "#10b981",  bg: "rgba(16,185,129,0.1)"  },
  };

  const TYPE_COLORS = {
    "General Inquiry":   "#6366f1",
    "Technical Support": "#f59e0b",
    "Report an Error":   "#ef4444",
    "Partnership":       "#10b981",
    "Feedback":          "#a855f7",
  };

  // FIXED: Proper unread filter - status should be exactly "unread"
  const filtered = messages.filter(m => {
    if (filter === "unread"  && m.status !== "unread")     return false;
    if (filter === "member"  && m.senderType !== "member") return false;
    if (filter === "visitor" && m.senderType !== "visitor") return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (m.name || "").toLowerCase().includes(q) ||
             (m.email || "").toLowerCase().includes(q) ||
             (m.subject || "").toLowerCase().includes(q) ||
             (m.message || "").toLowerCase().includes(q);
    }
    return true;
  });

  const counts = {
    all:     messages.length,
    unread:  messages.filter(m => m.status === "unread").length,
    member:  messages.filter(m => m.senderType === "member").length,
    visitor: messages.filter(m => m.senderType === "visitor").length,
  };

  return (
    <div>
      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px,1fr))", gap: 12, marginBottom: 22 }}>
        {[
          { icon: "📩", label: "Total",   value: counts.all,     color: "#6366f1" },
          { icon: "🔴", label: "Unread",  value: counts.unread,  color: "#ef4444" },
          { icon: "👤", label: "Members", value: counts.member,  color: "#059669" },
          { icon: "👁️", label: "Visitors", value: counts.visitor, color: "#d97706" },
        ].map((s, i) => (
          <div key={i} style={{ background: "var(--bg2)", border: `1.5px solid ${s.color}22`, borderRadius: 14, padding: "14px 16px" }}>
            <div style={{ fontSize: 20, marginBottom: 6 }}>{s.icon}</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 11, color: "var(--text3)", fontWeight: 600 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        {[["all","All"],["unread","🔴 Unread"],["member","👤 Members"],["visitor","👁️ Visitors"]].map(([v, l]) => (
          <button key={v} onClick={() => {
            setFilter(v);
            if (batchDeleteMode) clearBatchSelection();
          }} style={{ padding: "6px 14px", borderRadius: 8, border: `1.5px solid ${filter === v ? "var(--accent)" : "var(--border)"}`, background: filter === v ? "var(--accent-soft)" : "transparent", color: filter === v ? "var(--accent)" : "var(--text3)", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
            {l} {counts[v] > 0 && <span style={{ background: filter === v ? "var(--accent)" : "var(--bg3)", color: filter === v ? "#fff" : "var(--text3)", borderRadius: 99, fontSize: 9, fontWeight: 900, padding: "1px 5px", marginLeft: 3 }}>{counts[v]}</span>}
          </button>
        ))}
        
        <div style={{ flex: 1, minWidth: 180, position: "relative" }}>
          <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 13 }}>🔍</span>
          <input placeholder="Search messages…" value={search} onChange={e => setSearch(e.target.value)}
            style={{ width: "100%", padding: "8px 12px 8px 32px", borderRadius: 10, border: "1.5px solid var(--border)", background: "var(--bg)", color: "var(--text)", fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
        </div>
        
        <button onClick={loadMessages} style={{ padding: "7px 14px", borderRadius: 9, border: "1.5px solid var(--border)", background: "var(--bg3)", color: "var(--text2)", fontWeight: 600, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>🔄 Refresh</button>
        
        {/* Batch Delete Toggle Button */}
        {!batchDeleteMode ? (
          <button onClick={() => {
            setBatchDeleteMode(true);
            setSelected(null);
          }} style={{ padding: "7px 14px", borderRadius: 9, border: "1.5px solid #dc2626", background: "rgba(220,38,38,0.1)", color: "#dc2626", fontWeight: 600, fontSize: 12, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 4 }}>
            🗑️ Batch Delete
          </button>
        ) : (
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={selectAllFiltered} style={{ padding: "7px 12px", borderRadius: 9, border: "1.5px solid var(--border)", background: "var(--bg3)", color: "var(--accent)", fontWeight: 600, fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>
              Select All ({filtered.length})
            </button>
            <button onClick={handleBatchDelete} disabled={deletingBatch || selectedMessages.size === 0}
              style={{ padding: "7px 14px", borderRadius: 9, border: "none", background: "#dc2626", color: "#fff", fontWeight: 600, fontSize: 12, cursor: "pointer", fontFamily: "inherit", opacity: (deletingBatch || selectedMessages.size === 0) ? 0.6 : 1, display: "flex", alignItems: "center", gap: 4 }}>
              {deletingBatch ? "..." : `🗑️ Delete (${selectedMessages.size})`}
            </button>
            <button onClick={clearBatchSelection} style={{ padding: "7px 12px", borderRadius: 9, border: "1.5px solid var(--border)", background: "var(--bg3)", color: "var(--text2)", fontWeight: 600, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Messages list + detail side-by-side */}
      <div style={{ display: "grid", gridTemplateColumns: selected ? "1fr 1.2fr" : "1fr", gap: 16, alignItems: "start" }}>

        {/* List */}
        <div style={{ background: "var(--bg2)", border: "1.5px solid var(--border)", borderRadius: 16, overflow: "hidden" }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: 48 }}><Spinner size={30} color="var(--accent)" /></div>
          ) : filtered.length === 0 ? (
            <Empty icon="📩" title="No messages" subtitle="Contact messages will appear here" />
          ) : (
            filtered.map((msg, i) => {
              const st = STATUS_CFG[msg.status] || STATUS_CFG.read;
              const isActive = selected?.id === msg.id;
              const isSelected = selectedMessages.has(msg.id);
              
              return (
                <div key={msg.id} onClick={() => !batchDeleteMode && openMessage(msg)}
                  style={{ 
                    padding: "14px 16px", 
                    borderBottom: i < filtered.length - 1 ? "1px solid var(--border)" : "none", 
                    cursor: batchDeleteMode ? "default" : "pointer", 
                    background: isSelected ? "rgba(220,38,38,0.1)" : (isActive ? "var(--accent-soft)" : (msg.status === "unread" ? "rgba(239,68,68,0.03)" : "transparent")), 
                    transition: "background 0.15s",
                    borderLeft: `3px solid ${msg.status === "unread" && !batchDeleteMode ? "#ef4444" : "transparent"}`
                  }}
                  onMouseEnter={e => { 
                    if (!batchDeleteMode && !isActive) e.currentTarget.style.background = "var(--bg3)"; 
                  }}
                  onMouseLeave={e => { 
                    if (!batchDeleteMode) e.currentTarget.style.background = isActive ? "var(--accent-soft)" : (msg.status === "unread" ? "rgba(239,68,68,0.03)" : "transparent"); 
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 5 }}>
                    {/* Batch delete checkbox */}
                    {batchDeleteMode && (
                      <div style={{ flexShrink: 0 }} onClick={(e) => { e.stopPropagation(); toggleBatchSelection(msg.id); }}>
                        <input type="checkbox" checked={isSelected} onChange={() => {}} style={{ width: 18, height: 18, cursor: "pointer" }} />
                      </div>
                    )}
                    
                    <div style={{ display: "flex", alignItems: "center", gap: 7, flex: 1, minWidth: 0 }}>
                      <div style={{ width: 28, height: 28, borderRadius: "50%", background: msg.senderType === "member" ? "rgba(5,150,105,0.12)" : "rgba(245,158,11,0.12)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>
                        {msg.senderType === "member" ? "👤" : "👁️"}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 13, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{msg.name}</div>
                        <div style={{ fontSize: 10, color: "var(--text3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{msg.email}</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3, flexShrink: 0 }}>
                      <span style={{ fontSize: 9, fontWeight: 800, padding: "2px 7px", borderRadius: 99, background: st.bg, color: st.color }}>{st.label}</span>
                      <span style={{ fontSize: 9, color: "var(--text3)" }}>{fmtDate(msg.createdAt)}</span>
                    </div>
                  </div>
                  <div style={{ fontWeight: (!batchDeleteMode && msg.status === "unread") ? 700 : 600, fontSize: 12, color: "var(--text)", marginBottom: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginLeft: batchDeleteMode ? 26 : 0 }}>
                    {msg.subject}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginLeft: batchDeleteMode ? 26 : 0 }}>
                    {msg.message}
                  </div>
                  <div style={{ display: "flex", gap: 5, marginTop: 6, marginLeft: batchDeleteMode ? 26 : 0 }}>
                    <span style={{ fontSize: 9, fontWeight: 700, padding: "1px 7px", borderRadius: 99, background: `${TYPE_COLORS[msg.type] || "#6366f1"}15`, color: TYPE_COLORS[msg.type] || "#6366f1" }}>{msg.type}</span>
                    <span style={{ fontSize: 9, fontWeight: 700, padding: "1px 7px", borderRadius: 99, background: msg.senderType === "member" ? "rgba(5,150,105,0.1)" : "rgba(245,158,11,0.1)", color: msg.senderType === "member" ? "#059669" : "#d97706" }}>
                      {msg.senderType === "member" ? "👤 Member" : "👁️ Visitor"}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Detail panel (only shown when not in batch mode) */}
        {!batchDeleteMode && selected && (
          <div style={{ background: "var(--bg2)", border: "1.5px solid var(--border)", borderRadius: 16, padding: 22, position: "sticky", top: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 900, color: "var(--text)", marginBottom: 2 }}>{selected.subject}</div>
                <div style={{ fontSize: 11, color: "var(--text3)" }}>{fmtDate(selected.createdAt)}</div>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "var(--text3)", lineHeight: 1 }}>✕</button>
            </div>

            {/* Sender info */}
            <div style={{ background: "var(--bg3)", borderRadius: 12, padding: "12px 14px", marginBottom: 14, display: "flex", gap: 14, alignItems: "center" }}>
              <div style={{ width: 42, height: 42, borderRadius: "50%", background: selected.senderType === "member" ? "rgba(5,150,105,0.15)" : "rgba(245,158,11,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
                {selected.senderType === "member" ? "👤" : "👁️"}
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 14, color: "var(--text)" }}>{selected.name}</div>
                <div style={{ fontSize: 12, color: "var(--text3)" }}>{selected.email}</div>
                <div style={{ marginTop: 4, display: "flex", gap: 6 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 99, background: selected.senderType === "member" ? "rgba(5,150,105,0.12)" : "rgba(245,158,11,0.12)", color: selected.senderType === "member" ? "#059669" : "#d97706" }}>
                    {selected.senderType === "member" ? "👤 Registered Member" : "👁️ Visitor"}
                  </span>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 99, background: `${TYPE_COLORS[selected.type] || "#6366f1"}15`, color: TYPE_COLORS[selected.type] || "#6366f1" }}>{selected.type}</span>
                </div>
              </div>
            </div>

            {/* Message body */}
            <div style={{ background: "var(--bg3)", borderRadius: 12, padding: "14px 16px", marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>Message</div>
              <div style={{ fontSize: 13, color: "var(--text2)", lineHeight: 1.75, whiteSpace: "pre-wrap" }}>{selected.message}</div>
            </div>

            {/* Previous reply */}
            {selected.adminReply && (
              <div style={{ background: "rgba(16,185,129,0.07)", border: "1.5px solid rgba(16,185,129,0.25)", borderRadius: 12, padding: "14px 16px", marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: "#059669", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>✅ Your Previous Reply</div>
                <div style={{ fontSize: 13, color: "var(--text2)", lineHeight: 1.75, whiteSpace: "pre-wrap" }}>{selected.adminReply}</div>
                {selected.repliedAt && <div style={{ fontSize: 10, color: "var(--text3)", marginTop: 6 }}>{fmtDate(selected.repliedAt)}</div>}
              </div>
            )}

            {/* Info box about reply method */}
            {selected.senderType === "member" ? (
              <div style={{ display: "flex", gap: 8, alignItems: "flex-start", padding: "10px 12px", background: "rgba(99,102,241,0.07)", borderRadius: 10, marginBottom: 14, fontSize: 12, color: "var(--accent)", fontWeight: 600 }}>
                <span>📣</span>
                <span>This sender is a registered member. Your reply will be sent as an in-app notification.</span>
              </div>
            ) : (
              <div style={{ display: "flex", gap: 8, alignItems: "flex-start", padding: "10px 12px", background: "rgba(245,158,11,0.07)", borderRadius: 10, marginBottom: 14, fontSize: 12, color: "#d97706", fontWeight: 600 }}>
                <span>📧</span>
                <span>This sender is a visitor. Copy their email <strong>{selected.email}</strong> to reply via your email client.</span>
              </div>
            )}

            {/* Action buttons */}
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => handleReply(selected)}
                style={{ flex: 1, padding: "10px 14px", borderRadius: 10, border: "none", background: selected.senderType === "member" ? "linear-gradient(135deg,#6366f1,#a855f7)" : "linear-gradient(135deg,#f59e0b,#d97706)", color: "#fff", fontWeight: 800, cursor: "pointer", fontSize: 13, fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                {selected.senderType === "member" ? "📣 Send Notification" : "📧 Reply via Email"}
              </button>
              <button onClick={() => handleDelete(selected.id)} disabled={deletingId === selected.id}
                style={{ padding: "10px 14px", borderRadius: 10, border: "1.5px solid rgba(220,38,38,0.35)", background: "rgba(220,38,38,0.06)", color: "#dc2626", fontWeight: 700, cursor: "pointer", fontSize: 13, fontFamily: "inherit" }}>
                {deletingId === selected.id ? "…" : "🗑️"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Reply Modal */}
      {replyModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: 20 }}>
          <div style={{ background: "var(--bg2)", border: "1.5px solid var(--border)", borderRadius: 20, padding: 28, maxWidth: 480, width: "100%" }}>
            <h3 style={{ fontWeight: 900, marginBottom: 4, color: "var(--text)", fontSize: 15 }}>
              {replyModal.mode === "notify" ? "📣 Send Notification Reply" : "📧 Reply via Email"}
            </h3>
            <p style={{ fontSize: 12, color: "var(--text3)", marginBottom: 6 }}>
              To: <strong>{replyModal.msg.name}</strong> &lt;{replyModal.msg.email}&gt;
            </p>
            <p style={{ fontSize: 11, color: "var(--text3)", marginBottom: 16, padding: "8px 10px", background: "var(--bg3)", borderRadius: 8 }}>
              Re: <em>{replyModal.msg.subject}</em>
            </p>

            {replyModal.mode === "notify" ? (
              <>
                <textarea value={replyText} onChange={e => setReplyText(e.target.value)} rows={5} placeholder="Write your reply — the member will receive it as an in-app notification…" maxLength={600}
                  style={{ width: "100%", padding: "11px 14px", borderRadius: 11, border: "1.5px solid var(--border)", background: "var(--bg3)", color: "var(--text)", fontSize: 13, fontFamily: "inherit", outline: "none", resize: "vertical", boxSizing: "border-box", marginBottom: 6 }}
                  onFocus={e => e.target.style.borderColor = "var(--accent)"} onBlur={e => e.target.style.borderColor = "var(--border)"} />
                <div style={{ textAlign: "right", fontSize: 10, color: "var(--text3)", marginBottom: 16 }}>{replyText.length}/600</div>
              </>
            ) : (
              <div style={{ marginBottom: 16 }}>
                <div style={{ padding: "14px", background: "var(--bg3)", borderRadius: 10, marginBottom: 10 }}>
                  <div style={{ fontSize: 12, color: "var(--text2)", marginBottom: 6 }}>Since this is a visitor, you'll reply via email. Write your reply below to keep a record, then click the email button to open your mail client.</div>
                  <textarea value={replyText} onChange={e => setReplyText(e.target.value)} rows={4} placeholder="Write your reply (for record-keeping)…" maxLength={600}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1.5px solid var(--border)", background: "var(--bg)", color: "var(--text)", fontSize: 13, fontFamily: "inherit", outline: "none", resize: "vertical", boxSizing: "border-box" }}
                    onFocus={e => e.target.style.borderColor = "var(--accent)"} onBlur={e => e.target.style.borderColor = "var(--border)"} />
                </div>
                <a href={`mailto:${replyModal.msg.email}?subject=Re: ${encodeURIComponent(replyModal.msg.subject)}&body=${encodeURIComponent(replyText || "")}`}
                  style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "10px", borderRadius: 10, background: "rgba(245,158,11,0.1)", border: "1.5px solid rgba(245,158,11,0.3)", color: "#d97706", fontWeight: 800, fontSize: 13, textDecoration: "none" }}>
                  📧 Open Email Client
                </a>
              </div>
            )}

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setReplyModal(null)} style={{ flex: 1, padding: 10, borderRadius: 10, border: "1.5px solid var(--border)", background: "var(--bg3)", color: "var(--text2)", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
              <button onClick={sendReply} disabled={sending || !replyText.trim()}
                style={{ flex: 1, padding: 10, borderRadius: 10, border: "none", background: replyModal.mode === "notify" ? "linear-gradient(135deg,#6366f1,#a855f7)" : "linear-gradient(135deg,#f59e0b,#d97706)", color: "#fff", fontWeight: 800, cursor: "pointer", fontFamily: "inherit", opacity: (sending || !replyText.trim()) ? 0.6 : 1 }}>
                {sending ? "Sending…" : replyModal.mode === "notify" ? "📣 Send Notification" : "💾 Save Reply"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Admin({ showToast, setPage }) {
  const { user, isAdmin } = useAuth();
  const [tab, setTab] = useState(() => {
    const hash = window.location.hash.replace("#", "");
    const valid = ["overview","exams","vendors","topics","import","questions","users","analytics","revenue","referral","reports","payments","refunds","notifications","settings"];
    return valid.includes(hash) ? hash : "overview";
  });

  const handleSetTab = (t) => {
    setTab(t);
    window.location.hash = t;
  };

  // Data state
  const [exams, setExams] = useState([]);
  const [users, setUsers] = useState([]);
  const [results, setResults] = useState([]);
  const [reports, setReports] = useState([]);
  const [countryStats, setCountryStats] = useState([]);
  const [stats, setStats] = useState(null);
  const [vendors, setVendors] = useState([]);
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastLoaded, setLastLoaded] = useState(null);
  const [pendingInstapayCount, setPendingInstapayCount] = useState(0);
  const [pendingRefundsCount, setPendingRefundsCount] = useState(0);
  const [pendingContactsCount, setPendingContactsCount] = useState(0);

  // Analytics filter state
  const [analyticsPeriod, setAnalyticsPeriod] = useState("30d");
  const [comparePeriod, setComparePeriod] = useState(false);

  // Exam form states
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState({
    title: "", subtitle: "", vendor: "", topic: "", logo: "📋", color: "#3b82f6",
    description: "", longDescription: "", duration: 90, passScore: 70,
    maxQuestionsPerExam: 40, image: null, imageUrl: "", isActive: true,
  });
  const [formErr, setFormErr] = useState({});
  const [saving, setSaving] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);

  // Questions states
  const [selectedExamId, setSelectedExamId] = useState("");
  const [examQuestions, setExamQuestions] = useState([]);
  const [loadingQ, setLoadingQ] = useState(false);
  const [searchQ, setSearchQ] = useState("");
  const [examsSearch, setExamsSearch] = useState("");
  // Real question counts fetched from subcollection
  const [realQuestionCounts, setRealQuestionCounts] = useState({});

  // CSV Import states
  const [csvExamId, setCsvExamId] = useState("");
  const [csvFile, setCsvFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [replaceQ, setReplaceQ] = useState(false);
  const [importLog, setImportLog] = useState("");
  const fileRef = useRef();

  // Report states
  const [selectedReport, setSelectedReport] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);

  // Vendors states
  const [showVendorForm, setShowVendorForm] = useState(false);
  const [editVendor, setEditVendor] = useState(null);
  const [vendorForm, setVendorForm] = useState({ name: "", logo: "🏢", image: null, imagePreview: null, imageUrl: "", color: "#3b82f6", tag: "", description: "", suggestion: "" });
  const [savingVendor, setSavingVendor] = useState(false);

  // Topics states
  const [showTopicForm, setShowTopicForm] = useState(false);
  const [editTopic, setEditTopic] = useState(null);
  const [topicForm, setTopicForm] = useState({ name: "", icon: "📚", color: "#3b82f6", tag: "", description: "", suggestion: "", statsJobs: "", statsGrowth: "", statsSalary: "", image: null, imagePreview: null, imageUrl: "" });
  const [savingTopic, setSavingTopic] = useState(false);
  const topicImageRef = useRef();

  // Users filter
  const [userSearch, setUserSearch] = useState("");
  const [resultsSearch, setResultsSearch] = useState("");

  // ── Pricing state ────────────────────────────────────────────────
  const [plans, setPlans]         = useState(DEFAULT_PLANS);
  const [coupons, setCoupons]     = useState([]);
  const [transactions, setTxs]    = useState([]);
  const [txLoading, setTxLoading] = useState(false);
  const [pricingSection, setPricingSection] = useState("plans"); // plans | coupons | exam-pricing
  const [savingPricing, setSavingPricing]   = useState(false);
  const [newCoupon, setNewCoupon] = useState({
    code: "", discountPercent: 10, discountAmount: 0,
    maxUses: 0, expiresAt: "", isActive: true, scope: "all",
  });

  const upd = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  // ── Load only on mount (no auto-refresh to protect Firebase limits) ──────────
useEffect(() => {
  if (isAdmin) {
    load();
  }
}, [isAdmin]);
useEffect(() => {
  if (!selectedExamId || tab !== "questions") return;
  setLoadingQ(true);
  getQuestions(selectedExamId)
    .then(qs => {
      setExamQuestions(qs || []);
      setLoadingQ(false);
    })
    .catch((err) => {
      console.error("❌ getQuestions error:", err);
      setLoadingQ(false);
    });
}, [selectedExamId, tab]);

  const load = async () => {
    setLoading(true);
    try {
      const [e, u, r, s, reps, countries, vends, tops] = await Promise.all([
        getExams().catch(() => []),
        getAllUsers().catch(() => []),
        getAllResults(300).catch(() => []),
        getAdminStats().catch(() => null),
        getAllReports().catch(() => []),
        getCountryStats().catch(() => []),
        getVendors().catch(() => []),
        getTopics().catch(() => []),
      ]);
      setExams(e || []);
      setUsers(u || []);
      setResults(r || []);
      setStats(s);
      setReports(reps || []);
      setCountryStats(countries || []);
      setVendors(vends || []);
      setTopics(tops || []);
      setLastLoaded(new Date());
      if (e?.length && !csvExamId) setCsvExamId(e[0].id);
      if (e?.length && !selectedExamId) setSelectedExamId(e[0].id);
      // Fetch real question counts from subcollection for all exams
      if (e?.length) {
        Promise.allSettled(e.map(ex =>
          getQuestions(ex.id).then(qs => ({ id: ex.id, count: (qs || []).length })).catch(() => ({ id: ex.id, count: ex.totalQuestions || 0 }))
        )).then(results => {
          const map = {};
          results.forEach(r => { if (r.status === "fulfilled") map[r.value.id] = r.value.count; });
          setRealQuestionCounts(map);
        });
      }
      // Load pricing settings + transactions
      getPlatformSettings().then(s => {
        if (s?.plans)   setPlans({ ...DEFAULT_PLANS, ...s.plans });
        if (s?.coupons) setCoupons(s.coupons || []);
      }).catch(() => {});
      getAllTransactions().then(txs => setTxs(txs || [])).catch(() => {});
      // Load pending counts for alerts
      import("../services/payment").then(({ getAllInstapayPayments, getAllRefundRequests }) => {
        getAllInstapayPayments().then(ips => setPendingInstapayCount((ips || []).filter(i => i.status === "pending").length)).catch(() => {});
        getAllRefundRequests().then(refs => setPendingRefundsCount((refs || []).filter(r => r.status === "pending").length)).catch(() => {});
      }).catch(() => {});
      // Load pending contacts count
      import("firebase/firestore").then(({ collection: col, getDocs: gd, query, where, orderBy }) => {
        import("../firebase").then(({ db: fdb }) => {
          gd(query(col(fdb, "contactMessages"), where("status", "==", "unread"))).then(snap => setPendingContactsCount(snap.size)).catch(() => {});
        });
      }).catch(() => {});
    } catch (err) {
      showToast({ msg: `Error loading data: ${err.message}`, type: "error" });
    }
    setLoading(false);
  };

  // ── Derived analytics ──────────────────────────────────────────────────────
  const filteredResults = useMemo(() => filterByPeriod(results, analyticsPeriod), [results, analyticsPeriod]);
  const prevResults = useMemo(() => {
    if (!comparePeriod) return null;
    const days = analyticsPeriod === "7d" ? 7 : analyticsPeriod === "30d" ? 30 : analyticsPeriod === "90d" ? 90 : 365;
    const now = Date.now();
    const end = now - days * 24 * 60 * 60 * 1000;
    const start = end - days * 24 * 60 * 60 * 1000;
    return results.filter(r => {
      const d = r.date ? new Date(r.date).getTime() : 0;
      return d >= start && d < end;
    });
  }, [results, analyticsPeriod, comparePeriod]);

  const avgScore = useMemo(() => filteredResults.length ? Math.round(filteredResults.reduce((s, r) => s + (r.score || 0), 0) / filteredResults.length) : 0, [filteredResults]);
  const passRate = useMemo(() => filteredResults.length ? Math.round((filteredResults.filter(r => r.pass).length / filteredResults.length) * 100) : 0, [filteredResults]);
  const prevPassRate = useMemo(() => prevResults?.length ? Math.round((prevResults.filter(r => r.pass).length / prevResults.length) * 100) : null, [prevResults]);
  const prevAvgScore = useMemo(() => prevResults?.length ? Math.round(prevResults.reduce((s, r) => s + (r.score || 0), 0) / prevResults.length) : null, [prevResults]);

  const topExams = useMemo(() => {
    const map = {};
    filteredResults.forEach(r => {
      if (!map[r.examId]) map[r.examId] = { title: r.examTitle, attempts: 0, pass: 0, totalScore: 0 };
      map[r.examId].attempts++;
      if (r.pass) map[r.examId].pass++;
      map[r.examId].totalScore += (r.score || 0);
    });
    return Object.entries(map).map(([id, d]) => ({ id, ...d, passRate: Math.round((d.pass / d.attempts) * 100), avgScore: Math.round(d.totalScore / d.attempts) })).sort((a, b) => b.attempts - a.attempts);
  }, [filteredResults]);

  const activityData = useMemo(() => {
    const days = analyticsPeriod === "7d" ? 7 : analyticsPeriod === "30d" ? 30 : analyticsPeriod === "90d" ? 90 : 30;
    return groupByDay(filteredResults, Math.min(days, 30));
  }, [filteredResults, analyticsPeriod]);

  const scoreDistribution = useMemo(() => {
    const buckets = [
      { label: "0–49", min: 0, max: 49, color: "#ef4444" },
      { label: "50–59", min: 50, max: 59, color: "#f97316" },
      { label: "60–69", min: 60, max: 69, color: "#f59e0b" },
      { label: "70–79", min: 70, max: 79, color: "#84cc16" },
      { label: "80–89", min: 80, max: 89, color: "#22c55e" },
      { label: "90–100", min: 90, max: 100, color: "#10b981" },
    ];
    return buckets.map(b => ({ ...b, count: filteredResults.filter(r => r.score >= b.min && r.score <= b.max).length }));
  }, [filteredResults]);

  const userGrowth = useMemo(() => {
    const days = 30;
    const now = new Date();
    const map = {};
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      map[d.toLocaleDateString("en-US", { month: "short", day: "numeric" })] = 0;
    }
    users.forEach(u => {
      const d = u.createdAt?.toDate?.() || (u.createdAt ? new Date(u.createdAt) : null);
      if (!d) return;
      const key = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      if (key in map) map[key]++;
    });
    return Object.entries(map).map(([label, value]) => ({ label, value }));
  }, [users]);

  const examPerformance = useMemo(() => {
    return [...exams].map(ex => {
      const examResults = filteredResults.filter(r => r.examId === ex.id);
      const pass = examResults.filter(r => r.pass).length;
      return {
        ...ex,
        filteredAttempts: examResults.length,
        filteredPassRate: examResults.length ? Math.round((pass / examResults.length) * 100) : 0,
        filteredAvgScore: examResults.length ? Math.round(examResults.reduce((s, r) => s + (r.score || 0), 0) / examResults.length) : 0,
      };
    }).sort((a, b) => b.filteredAttempts - a.filteredAttempts);
  }, [exams, filteredResults]);

  const retentionRate = useMemo(() => {
    const repeaters = users.filter(u => results.filter(r => r.userId === u.id).length > 1).length;
    return users.length ? Math.round((repeaters / users.length) * 100) : 0;
  }, [users, results]);

  const certificatesIssued = useMemo(() => filteredResults.filter(r => r.mode === "examSimulation" && r.pass).length, [filteredResults]);
  const failedExams = useMemo(() => filteredResults.filter(r => !r.pass).length, [filteredResults]);

  if (!isAdmin) {
    return (
      <div style={{ textAlign: "center", padding: "80px 24px" }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🚫</div>
        <h2 style={{ color: "#ef4444", marginBottom: 12 }}>Access Denied</h2>
        <p style={{ color: "var(--text2)", marginBottom: 24 }}>You do not have admin privileges.</p>
        <Btn onClick={() => setPage("home")}>Back to Home</Btn>
      </div>
    );
  }

  // ======= EXAM MANAGEMENT =======
  const saveExam = async () => {
    const errs = {};
    if (!form.title.trim()) errs.title = "Title is required";
    if (!form.vendor.trim()) errs.vendor = "Vendor is required";
    if (!form.topic.trim()) errs.topic = "Topic is required";
    if (form.duration < 10) errs.duration = "Duration must be at least 10 minutes";
    if (form.passScore < 0 || form.passScore > 100) errs.passScore = "Pass score must be between 0 and 100";
    if (Object.keys(errs).length) { setFormErr(errs); return; }
    setSaving(true);
    try {
      const examData = { ...form, slug: generateSlug(form.title) };
      if (editTarget) {
        await updateExam(editTarget.id, examData);
        showToast({ msg: "✅ Exam updated successfully", type: "success" });
      } else {
        await createExam(examData);
        showToast({ msg: "🎉 Exam created successfully", type: "success" });
      }
      await load();
      setShowForm(false);
      // Auto-refresh #6: ensure state is consistent
      setTimeout(() => load(), 500);
    } catch (e) {
      showToast({ msg: `Error saving exam: ${e.message}`, type: "error" });
    }
    setSaving(false);
  };

  const openCreate = () => {
    setEditTarget(null);
    setForm({ title: "", subtitle: "", vendor: "", topic: "", logo: "📋", color: "#3b82f6", description: "", longDescription: "", duration: 90, passScore: 70, maxQuestionsPerExam: 40, image: null, imageUrl: "", isActive: true, pricing: { price: 0, originalPrice: null, discount: 0, isFree: true } });
    setFormErr({});
    setImagePreview(null);
    setShowForm(true);
  };

  const openEdit = (exam) => {
    setEditTarget(exam);
    setForm({ title: exam.title || "", subtitle: exam.subtitle || "", vendor: exam.vendor || "", topic: exam.topic || "", logo: exam.logo || "📋", color: exam.color || "#3b82f6", description: exam.description || "", longDescription: exam.longDescription || "", duration: exam.duration || 90, passScore: exam.passScore || 70, maxQuestionsPerExam: exam.maxQuestionsPerExam || 40, image: exam.image || null, imageUrl: exam.image?.startsWith?.("http") ? exam.image : "", isActive: exam.isActive !== false, pricing: exam.pricing || { price: 0, originalPrice: null, discount: 0, isFree: true } });
    setFormErr({});
    setImagePreview(exam.image);
    setShowForm(true);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      // #12 Auto-optimize image before storing
      const result = await smartOptimize(file, PROFILES.examCover);
      setForm(p => ({ ...p, image: result.dataUrl, imageUrl: "" }));
      setImagePreview(result.dataUrl);
      if (result.saving > 5) {
        showToast({
          msg: `🖼 Image optimized: ${formatBytes(result.originalSize)} → ${formatBytes(result.newSize)} (${result.saving}% saved)`,
          type: "info",
        });
      }
    } catch (err) {
      // Fallback to raw read
      const reader = new FileReader();
      reader.onloadend = () => { setForm(p => ({ ...p, image: reader.result, imageUrl: "" })); setImagePreview(reader.result); };
      reader.readAsDataURL(file);
    }
  };

  const handleExamImageUrl = (url) => { setForm(p => ({ ...p, imageUrl: url, image: url })); setImagePreview(url); };

  const toggleExamStatus = async (exam) => {
    try {
      await updateExam(exam.id, { isActive: !exam.isActive });
      showToast({ msg: exam.isActive ? "🔒 Exam disabled" : "✅ Exam enabled", type: "info" });
      await load();
    } catch (e) { showToast({ msg: `Error: ${e.message}`, type: "error" }); }
  };

  const confirmDeleteExam = async (exam) => {
    if (!window.confirm(`Delete "${exam.title}" and all its questions?`)) return;
    try {
      await deleteExam(exam.id);
      showToast({ msg: "✅ Exam deleted", type: "info" });
      await load();
    } catch (e) { showToast({ msg: `Error: ${e.message}`, type: "error" }); }
  };

  // ======= CSV IMPORT =======
  const handleImport = async (fileArg) => {
    const file = fileArg || csvFile;
    if (!file) { showToast({ msg: "Please select a CSV file", type: "warning" }); return; }
    if (!csvExamId) { showToast({ msg: "Please select an exam first", type: "warning" }); return; }
    setImporting(true);
    setImportLog("📖 Reading file...");
    try {
      const text = await file.text();
      setImportLog("🔍 Parsing questions...");
      const rows = parseCSV(text);
      if (!rows.length) { showToast({ msg: "❌ Failed to parse CSV", type: "error" }); setImportLog("❌ Failed to parse CSV"); setImporting(false); return; }
      const parsed = rows.map((r, i) => rowToQuestion(r, i));
      const questions = parsed.filter(q => q && !q.error);
      const skipped = parsed.filter(q => q && q.error);
      const logLines = [`📊 Total rows: ${rows.length}`, `✅ Valid questions: ${questions.length}`];
      if (skipped.length > 0) { logLines.push(`⚠️ Skipped ${skipped.length} questions:`); skipped.forEach(q => logLines.push(`   • ${q.error}`)); }
      if (!questions.length) { showToast({ msg: "❌ No valid questions found", type: "error" }); setImportLog(logLines.join("\n")); setImporting(false); return; }
      if (replaceQ) { setImportLog("🗑️ Deleting old questions..."); await deleteAllExamQuestions(csvExamId); }
      setImportLog(`📤 Uploading ${questions.length} questions...`);
      await addQuestions(csvExamId, questions);
      logLines.push(`\n✅ Import completed successfully!`);
      setImportLog(logLines.join("\n"));
      showToast({ msg: `✅ Imported ${questions.length} questions!${skipped.length ? ` (${skipped.length} skipped)` : ""}`, type: "success" });
      setCsvFile(null);
      if (fileRef.current) fileRef.current.value = "";
      await load();
    } catch (e) { showToast({ msg: `❌ Import error: ${e.message}`, type: "error" }); setImportLog(`❌ Error: ${e.message}`); }
    setImporting(false);
  };

  const downloadSample = () => {
    const blob = new Blob([SAMPLE_CSV], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "sample_questions.csv"; a.click();
    URL.revokeObjectURL(url);
    showToast({ msg: "✅ Sample CSV downloaded", type: "success" });
  };

  // ======= USER MANAGEMENT =======
  const toggleUserRole = async (u) => {
    const newRole = u.role === "admin" ? "student" : "admin";
    if (!window.confirm(`Change ${u.name}'s role to "${newRole}"?`)) return;
    try {
      await updateUserRole(u.id, newRole);
      showToast({ msg: `✅ Role changed to ${newRole}`, type: "success" });
      await load();
    } catch (e) { showToast({ msg: `Error: ${e.message}`, type: "error" }); }
  };

  const filteredQ = examQuestions.filter(q => !searchQ || q.text?.toLowerCase().includes(searchQ.toLowerCase()) || q.domain?.toLowerCase().includes(searchQ.toLowerCase()));

  // ── Pricing Helpers ──────────────────────────────────────────────
  const savePlans = async () => {
    setSavingPricing(true);
    try {
      await updatePlatformSettings({ plans });
      showToast({ msg: "✅ Pricing plans saved!", type: "success" });
      load().catch(() => {}); // #6 Auto-refresh
    } catch (e) { showToast({ msg: `Error: ${e.message}`, type: "error" }); }
    setSavingPricing(false);
  };

  const saveCoupons = async () => {
    setSavingPricing(true);
    try {
      await updatePlatformSettings({ coupons });
      showToast({ msg: "✅ Coupons saved!", type: "success" });
      await load(); // Auto-refresh after save
    } catch (e) { showToast({ msg: `Error: ${e.message}`, type: "error" }); }
    setSavingPricing(false);
  };

  const addCoupon = () => {
    if (!newCoupon.code.trim()) { showToast({ msg: "Coupon code required", type: "warning" }); return; }
    if (coupons.find(c => c.code === newCoupon.code.toUpperCase())) { showToast({ msg: "Code already exists", type: "warning" }); return; }
    if (newCoupon.discountPercent <= 0 && newCoupon.discountAmount <= 0) {
      showToast({ msg: "Set discount % or fixed amount", type: "warning" }); return;
    }
    setCoupons(prev => [...prev, {
      ...newCoupon,
      code: newCoupon.code.toUpperCase(),
      usedCount: 0,
      usedByUsers: [],   // track which users used it
      createdAt: new Date().toISOString(),
    }]);
    setNewCoupon({ code: "", discountPercent: 10, discountAmount: 0, maxUses: 0, expiresAt: "", isActive: true, scope: "all", examIds: [], planIds: [], onePerUser: false });
  };

  const loadTransactions = async () => {
    setTxLoading(true);
    try {
      const txs = await getAllTransactions();
      setTxs(txs);
    } catch (e) { console.error(e); }
    setTxLoading(false);
  };

  const totalRevenue   = transactions.reduce((acc, tx) => acc + (tx.amount || 0), 0);
  const subCount       = transactions.filter(tx => tx.type === "subscription").length;
  const examPurchCount = transactions.filter(tx => tx.type === "exam").length;

  const delQuestion = async (q) => {
    if (!window.confirm("Delete this question?")) return;
    try {
      await deleteQuestion(q.id);
      setExamQuestions(prev => prev.filter(x => x.id !== q.id));
      showToast({ msg: "✅ Question deleted", type: "info" });
    } catch (e) { showToast({ msg: `Error: ${e.message}`, type: "error" }); }
  };
const refreshCoupons = async () => {
  const settings = await getPlatformSettings();
  if (settings?.coupons) setCoupons(settings.coupons);
  showToast({ msg: "✅ Coupons refreshed", type: "success" });
};
  // ======= REPORTS =======
  const handleReportAction = async (reportId, status, feedbackMsg = "") => {
    try {
      // ✅ Pass adminUid + note to updateReportStatus — it will send notification internally
      await updateReportStatus(reportId, status, user?.uid, feedbackMsg);
      showToast({ msg: "✅ Report status updated", type: "success" });
      await load();
      setShowReportModal(false);
    } catch (e) { showToast({ msg: `Error: ${e.message}`, type: "error" }); }
  };

  const deleteReportRecord = async (reportId) => {
    if (!window.confirm("Delete this report?")) return;
    try {
      await deleteReport(reportId);
      showToast({ msg: "✅ Report deleted", type: "info" });
      await load();
    } catch (e) { showToast({ msg: `Error: ${e.message}`, type: "error" }); }
  };

  // ======= VENDORS =======
  const handleVendorImageUrl = (url) => setVendorForm(prev => ({ ...prev, imageUrl: url, image: url, imagePreview: url }));

  const saveVendorHandler = async () => {
    if (!vendorForm.name.trim()) { showToast({ msg: "Vendor name is required", type: "warning" }); return; }
    setSavingVendor(true);
    try {
      const dataToSave = { name: vendorForm.name, logo: vendorForm.logo, image: vendorForm.image, color: vendorForm.color, tag: vendorForm.tag, description: vendorForm.description, suggestion: vendorForm.suggestion };
      if (editVendor) { await updateVendor(editVendor.id, dataToSave); showToast({ msg: "✅ Vendor updated", type: "success" }); }
      else { await createVendor(dataToSave); showToast({ msg: "🎉 Vendor created", type: "success" }); }
      await load();
      setShowVendorForm(false);
      setEditVendor(null);
      setVendorForm({ name: "", logo: "🏢", image: null, imagePreview: null, imageUrl: "", color: "#3b82f6", tag: "", description: "", suggestion: "" });
    } catch (e) { showToast({ msg: `Error: ${e.message}`, type: "error" }); }
    setSavingVendor(false);
  };

  const openCreateVendor = () => { setEditVendor(null); setVendorForm({ name: "", logo: "🏢", image: null, imagePreview: null, imageUrl: "", color: "#3b82f6", tag: "", description: "", suggestion: "" }); setShowVendorForm(true); };
  const openEditVendor = (v) => { setEditVendor(v); setVendorForm({ name: v.name || "", logo: v.logo || "🏢", image: v.image || null, imagePreview: v.image || null, imageUrl: "", color: v.color || "#3b82f6", tag: v.tag || "", description: v.description || "", suggestion: v.suggestion || "" }); setShowVendorForm(true); };
  const deleteVendorHandler = async (v) => {
    if (!window.confirm(`Delete vendor "${v.name}"?`)) return;
    try { await deleteVendor(v.id); showToast({ msg: "✅ Vendor deleted", type: "info" }); await load(); }
    catch (e) { showToast({ msg: `Error: ${e.message}`, type: "error" }); }
  };
  const handleVendorImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) { const reader = new FileReader(); reader.onloadend = () => setVendorForm(p => ({ ...p, image: reader.result, imagePreview: reader.result, imageUrl: "" })); reader.readAsDataURL(file); }
  };

  // ======= TOPICS =======
  const handleTopicImageUrl = (url) => setTopicForm(prev => ({ ...prev, imageUrl: url, image: url, imagePreview: url }));
  const saveTopicHandler = async () => {
    if (!topicForm.name.trim()) { showToast({ msg: "Topic name is required", type: "warning" }); return; }
    setSavingTopic(true);
    try {
      const { statsJobs, statsGrowth, statsSalary, imagePreview, imageUrl, ...rest } = topicForm;
      const topicData = { ...rest, stats: { jobs: statsJobs || "", growth: statsGrowth || "", avgSalary: statsSalary || "" } };
      if (editTopic) { await updateTopic(editTopic.id, topicData); showToast({ msg: "✅ Topic updated", type: "success" }); }
      else { await createTopic(topicData); showToast({ msg: "🎉 Topic created", type: "success" }); }
      await load();
      setShowTopicForm(false);
      setEditTopic(null);
      setTopicForm({ name: "", icon: "📚", color: "#3b82f6", tag: "", description: "", suggestion: "", statsJobs: "", statsGrowth: "", statsSalary: "", image: null, imagePreview: null, imageUrl: "" });
    } catch (e) { showToast({ msg: `Error saving topic: ${e.message}`, type: "error" }); }
    setSavingTopic(false);
  };
  const handleTopicImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setTopicForm(p => ({ ...p, image: ev.target.result, imagePreview: ev.target.result, imageUrl: "" }));
    reader.readAsDataURL(file);
  };
  const openCreateTopic = () => { setEditTopic(null); setTopicForm({ name: "", icon: "📚", color: "#3b82f6", tag: "", description: "", suggestion: "", statsJobs: "", statsGrowth: "", statsSalary: "", image: null, imagePreview: null, imageUrl: "" }); setShowTopicForm(true); };
  const openEditTopic = (t) => { setEditTopic(t); setTopicForm({ name: t.name || "", icon: t.icon || "📚", color: t.color || "#3b82f6", tag: t.tag || "", description: t.description || "", suggestion: t.suggestion || "", statsJobs: t.stats?.jobs || "", statsGrowth: t.stats?.growth || "", statsSalary: t.stats?.avgSalary || "", image: t.image || null, imagePreview: t.image || null, imageUrl: "" }); setShowTopicForm(true); };
  const deleteTopicHandler = async (t) => {
    if (!window.confirm(`Delete topic "${t.name}"?`)) return;
    try { await deleteTopic(t.id); showToast({ msg: "✅ Topic deleted", type: "info" }); await load(); }
    catch (e) { showToast({ msg: `Error: ${e.message}`, type: "error" }); }
  };

  // ======= EXPORT =======
  const exportUsersToExcel = () => {
    try {
      let csv = "Name,Email,Role,Country,Created At,Exam Attempts\n";
      users.forEach(u => { const attempts = results.filter(r => r.userId === u.id).length; csv += `"${u.name}","${u.email}","${u.role}","${u.country || "N/A"}","${u.createdAt || "N/A"}",${attempts}\n`; });
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url; link.download = `Users_${new Date().toISOString().split("T")[0]}.csv`; link.click();
      URL.revokeObjectURL(url);
      showToast({ msg: "✅ Users exported", type: "success" });
    } catch (e) { showToast({ msg: `Export error: ${e.message}`, type: "error" }); }
  };

  const exportResultsToExcel = () => {
    try {
      let csv = "Student,Email,Exam,Score,Status,Date,Duration(min)\n";
      results.forEach(r => { csv += `"${r.userName}","${r.userId || "Guest"}","${r.examTitle}",${r.score},${r.pass ? "Pass" : "Fail"},"${r.date}",${Math.round((r.timeTaken || 0) / 60)}\n`; });
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url; link.download = `Results_${new Date().toISOString().split("T")[0]}.csv`; link.click();
      URL.revokeObjectURL(url);
      showToast({ msg: "✅ Results exported", type: "success" });
    } catch (e) { showToast({ msg: `Export error: ${e.message}`, type: "error" }); }
  };

  const exportCountriesToExcel = () => {
    try {
      let csv = "Country,Users,Percentage\n";
      const total = countryStats.reduce((s, c) => s + c.count, 0);
      countryStats.forEach(c => { csv += `"${c.country}",${c.count},${Math.round((c.count / total) * 100)}%\n`; });
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url; link.download = `Countries_${new Date().toISOString().split("T")[0]}.csv`; link.click();
      URL.revokeObjectURL(url);
    } catch (e) { showToast({ msg: `Export error: ${e.message}`, type: "error" }); }
  };

  // ======= RESET ANALYTICS (local state only) =======
  const resetAnalytics = () => {
    if (!window.confirm("Reset analytics filters and comparisons?")) return;
    setAnalyticsPeriod("30d");
    setComparePeriod(false);
    showToast({ msg: "✅ Analytics reset to defaults", type: "info" });
  };
  
// أسهل دالة لمسح التحليلات - بدون أي تعقيدات
const deleteAllAnalyticsData = async () => {
  if (!window.confirm("⚠️ تحذير: هذا سيحذف كل النتائج والتقارير نهائياً. لا يمكن التراجع. هل أنت متأكد؟")) return;
  
  setLoading(true);
  try {
    // جلب جميع النتائج
    const resultsSnap = await import("firebase/firestore").then(({ getDocs, collection }) => 
      getDocs(collection(db, "results"))
    );
    // جلب جميع التقارير
    const reportsSnap = await import("firebase/firestore").then(({ getDocs, collection }) => 
      getDocs(collection(db, "reports"))
    );
    
    const { writeBatch } = await import("firebase/firestore");
    const batch = writeBatch(db);
    
    resultsSnap.forEach(doc => batch.delete(doc.ref));
    reportsSnap.forEach(doc => batch.delete(doc.ref));
    
    await batch.commit();
    showToast({ msg: `✅ تم حذف ${resultsSnap.size} نتيجة و ${reportsSnap.size} تقرير`, type: "success" });
    await load(); // إعادة تحميل البيانات
  } catch (err) {
    showToast({ msg: `❌ خطأ: ${err.message}`, type: "error" });
  }
  setLoading(false);
};
  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: 1400, margin: "0 auto", padding: "32px 6px 40px" }}>
      <style>{`
        select option { background: #fff !important; color: #111 !important; }
        select { color: #111 !important; background: #fff !important; color-scheme: light; }
        input[type="text"], input[type="number"], input[type="date"], input[type="email"], textarea {
          border: 1.5px solid var(--border) !important;
        }
        input[type="text"]:focus, input[type="number"]:focus, input[type="date"]:focus,
        input[type="email"]:focus, textarea:focus, select:focus {
          border-color: var(--accent) !important;
          box-shadow: 0 0 0 3px var(--accent-soft) !important;
        }
      `}</style>

      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 12, paddingBottom: 20, borderBottom: "1.5px solid var(--border)" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
            <div style={{ width: 44, height: 44, borderRadius: 14, background: "linear-gradient(135deg, var(--accent), #7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, boxShadow: "0 4px 16px rgba(79,70,229,0.3)" }}>🎯</div>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 900, margin: 0, letterSpacing: "-0.02em" }}>Command Center</h1>
              <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 1 }}>ExamPro Admin Dashboard</div>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          {lastLoaded && <span style={{ fontSize: 11, color: "var(--text3)", background: "var(--bg3)", padding: "5px 12px", borderRadius: 99 }}>Last sync: {lastLoaded.toLocaleTimeString()}</span>}
          <Btn size="sm" onClick={load} loading={loading}>🔄 Refresh Data</Btn>
          {tab === "exams" && <Btn size="sm" onClick={openCreate}><Icon n="plus" size={14} /> New Exam</Btn>}
          {tab === "vendors" && <Btn size="sm" onClick={openCreateVendor}><Icon n="plus" size={14} /> New Vendor</Btn>}
          {tab === "topics" && <Btn size="sm" onClick={openCreateTopic}><Icon n="plus" size={14} /> New Topic</Btn>}
        </div>
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: "flex", gap: 3, marginBottom: 28, background: "var(--bg2)", borderRadius: 16, padding: 6, boxShadow: "0 2px 8px rgba(0,0,0,0.04)", overflowX: "auto" }}>
        {TABS.map(({ key, emoji, label }) => (
          <button key={key} onClick={() => handleSetTab(key)} style={{
            flex: "1 0 auto", padding: "9px 14px", borderRadius: 11, border: "none",
            background: tab === key ? "var(--accent)" : "transparent",
            color: tab === key ? "#fff" : "var(--text2)", fontWeight: 700, cursor: "pointer",
            fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center",
            gap: 5, fontFamily: "inherit", transition: "all 0.2s", whiteSpace: "nowrap",
            boxShadow: tab === key ? "0 2px 8px rgba(79,70,229,0.3)" : "none",
          }}>
            <span>{emoji}</span> {label}
            {key === "reports" && reports.filter(r => r.status === "pending").length > 0 && (
              <span style={{ background: "#ef4444", color: "#fff", borderRadius: 99, fontSize: 9, fontWeight: 900, padding: "1px 5px", marginLeft: 2 }}>{reports.filter(r => r.status === "pending").length}</span>
            )}
            {key === "contacts" && pendingContactsCount > 0 && (
              <span style={{ background: "#ef4444", color: "#fff", borderRadius: 99, fontSize: 9, fontWeight: 900, padding: "1px 5px", marginLeft: 2 }}>{pendingContactsCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── Content ── */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 80 }}><Spinner size={36} color="var(--accent)" /></div>
      ) : (
        <>
          {/* ═══════════════ OVERVIEW TAB ═══════════════ */}
          {tab === "overview" && (
            <div>
              {/* ── Alert Banner ── */}
              {(() => {
                const alerts = [];
                if (pendingInstapayCount > 0)
                  alerts.push({ icon: "🏦", color: "#d97706", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.3)", text: `${pendingInstapayCount} Instapay payment${pendingInstapayCount > 1 ? "s" : ""} pending verification`, action: "revenue" });
                if (pendingRefundsCount > 0)
                  alerts.push({ icon: "↩️", color: "#dc2626", bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.3)", text: `${pendingRefundsCount} refund request${pendingRefundsCount > 1 ? "s" : ""} awaiting review`, action: "refunds" });
                if (pendingContactsCount > 0)
                  alerts.push({ icon: "📩", color: "#6366f1", bg: "rgba(99,102,241,0.07)", border: "rgba(99,102,241,0.3)", text: `${pendingContactsCount} unread contact message${pendingContactsCount > 1 ? "s" : ""} waiting for your reply`, action: "contacts" });
                const pendingReportsCount = reports.filter(r => r.status === "pending").length;
                if (pendingReportsCount > 0)
                  alerts.push({ icon: "⚠️", color: "#d97706", bg: "rgba(245,158,11,0.06)", border: "rgba(245,158,11,0.25)", text: `${pendingReportsCount} pending report${pendingReportsCount > 1 ? "s" : ""} require your attention`, action: "reports" });
                if (alerts.length === 0) return null;
                return (
                  <div style={{ marginBottom: 20, display: "flex", flexDirection: "column", gap: 8 }}>
                    {alerts.map((a, i) => (
                      <div key={i} onClick={() => handleSetTab(a.action)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 18px", background: a.bg, border: `1.5px solid ${a.border}`, borderRadius: 14, cursor: "pointer", transition: "all 0.2s" }}
                        onMouseEnter={e => e.currentTarget.style.opacity = "0.85"} onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
                        <span style={{ fontSize: 20 }}>{a.icon}</span>
                        <span style={{ flex: 1, fontSize: 13, fontWeight: 700, color: a.color }}>{a.text}</span>
                        <span style={{ fontSize: 11, color: a.color, fontWeight: 600 }}>View →</span>
                      </div>
                    ))}
                  </div>
                );
              })()}

              {/* KPI Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: 14, marginBottom: 28 }}>
                <KPICard icon="📋" label="Total Exams" value={stats?.totalExams || exams.length} sub={`${exams.filter(e => e.isActive !== false).length} active`} color="#4f46e5" sparkData={[3,5,4,6,5,8,exams.length]} />
                <KPICard icon="👥" label="Total Students" value={(stats?.totalStudents || users.length).toLocaleString()} sub="Registered" color="#059669" sparkData={userGrowth.slice(-7).map(d => d.value)} />
                <KPICard icon="📝" label="Total Attempts" value={(stats?.totalAttempts || results.length).toLocaleString()} sub="All time" color="#d97706" sparkData={activityData.slice(-7).map(d => d.value)} />
                <KPICard icon="✅" label="Pass Rate" value={`${stats?.passRate || passRate}%`} sub="Global average" color="#7c3aed" trend={prevPassRate !== null ? passRate - prevPassRate : undefined} />
                <KPICard icon="📊" label="Avg Score" value={`${avgScore}%`} sub="All exams" color="#0891b2" trend={prevAvgScore !== null ? avgScore - prevAvgScore : undefined} />
                <KPICard icon="🏆" label="Certificates" value={results.filter(r => r.mode === "examSimulation" && r.pass).length} sub="Issued total" color="#f59e0b" />
                <KPICard icon="⚠️" label="Pending Reports" value={reports.filter(r => r.status === "pending").length} sub="Need review" color="#dc2626" onClick={() => handleSetTab("reports")} />
                <KPICard icon="🌍" label="Countries" value={countryStats.length} sub="User locations" color="#6366f1" />
              </div>

              {/* Revenue Summary Cards */}
              {(() => {
                const now = new Date();
                const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
                // نحسب من transactions المحلية لو موجودة
                const allTxRevenue = transactions?.reduce((s, t) => s + (Number(t.amount) || 0), 0) || 0;
const monthTxRevenue = transactions?.filter(t => {
  const d = t.createdAt?.toDate ? t.createdAt.toDate().getTime() : 0;
  return d >= monthStart;
}).reduce((s, t) => s + (Number(t.amount) || 0), 0) || 0;
                if (!transactions?.length) return null;
                return (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }}>
                    <div style={{ background: "var(--bg2)", border: "1.5px solid rgba(5,150,105,0.3)", borderRadius: 16, padding: "18px 20px" }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text3)", marginBottom: 6 }}>💰 TOTAL REVENUE (ALL TIME)</div>
                      <div style={{ fontSize: 32, fontWeight: 900, color: "#059669" }}>${allTxRevenue.toFixed(2)}</div>
                      <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 4 }}>{transactions.length} transactions</div>
                    </div>
                    <div style={{ background: "var(--bg2)", border: "1.5px solid rgba(99,102,241,0.3)", borderRadius: 16, padding: "18px 20px" }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text3)", marginBottom: 6 }}>📅 THIS MONTH'S REVENUE</div>
                      <div style={{ fontSize: 32, fontWeight: 900, color: "var(--accent)" }}>${monthTxRevenue.toFixed(2)}</div>
                      <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 4 }}>{now.toLocaleString("en", { month: "long", year: "numeric" })}</div>
                    </div>
                  </div>
                );
              })()}
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 16, marginBottom: 16 }}>
                {/* Activity Timeline */}
                <AnalyticsPanel icon="📈" title="Exam Attempts Activity" sub={`Last ${analyticsPeriod === "all" ? "all time" : analyticsPeriod}`}>
                  <MiniBarChart data={activityData.slice(-14)} color="var(--accent)" height={100} />
                </AnalyticsPanel>

                {/* Pass/Fail Donut */}
                <AnalyticsPanel icon="🎯" title="Pass vs Fail">
                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <DonutChart segments={[
                      { value: filteredResults.filter(r => r.pass).length, color: "#10b981" },
                      { value: filteredResults.filter(r => !r.pass).length, color: "#ef4444" },
                    ]} size={90} thickness={18} />
                    <div style={{ flex: 1 }}>
                      {[
                        { label: "Passed", value: filteredResults.filter(r => r.pass).length, color: "#10b981" },
                        { label: "Failed", value: filteredResults.filter(r => !r.pass).length, color: "#ef4444" },
                      ].map(s => (
                        <div key={s.label} style={{ marginBottom: 8 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 3 }}>
                            <span style={{ color: "var(--text2)", display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 8, height: 8, borderRadius: "50%", background: s.color, display: "inline-block" }} />{s.label}</span>
                            <strong style={{ color: s.color }}>{s.value}</strong>
                          </div>
                        </div>
                      ))}
                      <div style={{ fontSize: 22, fontWeight: 900, color: "#10b981", marginTop: 8 }}>{passRate}%</div>
                      <div style={{ fontSize: 10, color: "var(--text3)" }}>Pass rate</div>
                    </div>
                  </div>
                </AnalyticsPanel>

                {/* Quick KPIs */}
                <AnalyticsPanel icon="⚡" title="Quick Health">
                  {[
                    { label: "Active Exams", value: exams.filter(e => e.isActive !== false).length, total: exams.length, color: "#4f46e5" },
                    { label: "Pass Rate", value: passRate, total: 100, suffix: "%", color: "#059669" },
                    { label: "Retention", value: retentionRate, total: 100, suffix: "%", color: "#d97706" },
                  ].map((s, i) => (
                    <div key={i} style={{ paddingBottom: 12, marginBottom: 12, borderBottom: i < 2 ? "1px solid var(--border)" : "none" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 6 }}>
                        <span style={{ color: "var(--text2)", fontWeight: 600 }}>{s.label}</span>
                        <span style={{ fontWeight: 900, color: s.color }}>{s.value}{s.suffix || `/${s.total}`}</span>
                      </div>
                      <div style={{ height: 5, background: "var(--bg3)", borderRadius: 99, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${Math.min(100, Math.round((s.value / s.total) * 100))}%`, background: s.color, borderRadius: 99 }} />
                      </div>
                    </div>
                  ))}
                </AnalyticsPanel>
              </div>

              {/* Charts Row 2 */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 16 }}>
                {/* Top Countries */}
                <AnalyticsPanel icon="🌍" title="Top Countries" actions={<Btn size="sm" variant="ghost" onClick={exportCountriesToExcel} style={{ padding: "3px 10px", fontSize: 11 }}>↓ Export</Btn>}>
                  {countryStats.slice(0, 6).map((c, i) => {
                    const total = countryStats.reduce((s, x) => s + x.count, 0);
                    return <HBar key={i} label={c.country} value={c.count} total={total} color={`hsl(${220 + i * 25}, 70%, 55%)`} rank={i + 1} />;
                  })}
                </AnalyticsPanel>

                {/* Recent Activity */}
                <AnalyticsPanel icon="🕐" title="Recent Activity" sub="Latest 8 attempts">
                  {results.slice(0, 8).map((r, i) => (
                    <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: i < 7 ? "1px solid var(--border)" : "none" }}>
                      <div style={{ width: 7, height: 7, borderRadius: "50%", background: r.pass ? "#10b981" : "#ef4444", flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 11, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.userName}</div>
                        <div style={{ fontSize: 10, color: "var(--text3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.examTitle}</div>
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 800, color: r.pass ? "#10b981" : "#ef4444", flexShrink: 0 }}>{r.score}%</div>
                    </div>
                  ))}
                </AnalyticsPanel>

                {/* Popular Exams */}
                <AnalyticsPanel icon="🔥" title="Most Popular Exams">
                  {[...exams].sort((a, b) => (b.attempts || 0) - (a.attempts || 0)).slice(0, 6).map((e, i) => {
                    const maxA = exams.reduce((m, x) => Math.max(m, x.attempts || 0), 1);
                    return (
                      <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 0", borderBottom: i < 5 ? "1px solid var(--border)" : "none" }}>
                        <div style={{ width: 22, height: 22, borderRadius: 7, background: `${e.color || "var(--accent)"}18`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 900, color: e.color || "var(--accent)", flexShrink: 0 }}>{i + 1}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 11, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 3 }}>{e.title}</div>
                          <div style={{ height: 3, background: "var(--bg3)", borderRadius: 99, overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${Math.round(((e.attempts || 0) / maxA) * 100)}%`, background: e.color || "var(--accent)", borderRadius: 99 }} />
                          </div>
                        </div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text3)", flexShrink: 0 }}>{(e.attempts || 0).toLocaleString()}</div>
                      </div>
                    );
                  })}
                </AnalyticsPanel>
              </div>

              {/* Score Distribution */}
              <AnalyticsPanel icon="📊" title="Score Distribution" sub="All-time results breakdown">
                <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 8 }}>
                  {scoreDistribution.map((b, i) => (
                    <div key={i} style={{ textAlign: "center" }}>
                      <div style={{ height: 80, display: "flex", alignItems: "flex-end", justifyContent: "center", marginBottom: 6 }}>
                        <div style={{
                          width: "70%", borderRadius: "4px 4px 0 0", background: b.color,
                          height: `${Math.max(4, (b.count / (Math.max(...scoreDistribution.map(x => x.count), 1))) * 76)}px`,
                          opacity: 0.85, transition: "height 0.5s ease",
                        }} />
                      </div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: b.color }}>{b.count}</div>
                      <div style={{ fontSize: 9, color: "var(--text3)" }}>{b.label}</div>
                    </div>
                  ))}
                </div>
              </AnalyticsPanel>
            </div>
          )}

          {/* ═══════════════ ANALYTICS TAB ═══════════════ */}
          {tab === "analytics" && (
            <div>
              {/* Filter Bar */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 10, background: "var(--bg2)", border: "1.5px solid var(--border)", borderRadius: 16, padding: "14px 18px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text2)" }}>📅 Period:</span>
                  <PeriodFilter value={analyticsPeriod} onChange={setAnalyticsPeriod} />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                    <input type="checkbox" checked={comparePeriod} onChange={e => setComparePeriod(e.target.checked)} style={{ accentColor: "var(--accent)" }} />
                    Compare to previous period
                  </label>
                  <span style={{ fontSize: 11, color: "var(--text3)", background: "var(--bg3)", padding: "4px 10px", borderRadius: 99 }}>
                    {filteredResults.length} results in period
                  </span>
                </div>
              </div>

              {/* Primary KPIs with comparisons */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 14, marginBottom: 24 }}>
                {[
                  { icon: "📝", label: "Attempts", value: filteredResults.length, prev: prevResults?.length, color: "#4f46e5" },
                  { icon: "✅", label: "Pass Rate", value: `${passRate}%`, prev: prevPassRate !== null ? prevPassRate : undefined, color: "#059669", rawVal: passRate, prevRaw: prevPassRate },
                  { icon: "📊", label: "Avg Score", value: `${avgScore}%`, prev: prevAvgScore !== null ? prevAvgScore : undefined, color: "#d97706", rawVal: avgScore, prevRaw: prevAvgScore },
                  { icon: "🏆", label: "Certificates", value: certificatesIssued, prev: prevResults?.filter(r => r.mode === "examSimulation" && r.pass).length, color: "#7c3aed" },
                  { icon: "❌", label: "Failed Attempts", value: failedExams, prev: prevResults?.filter(r => !r.pass).length, color: "#ef4444" },
                  { icon: "👥", label: "Unique Students", value: new Set(filteredResults.map(r => r.userId)).size, color: "#0891b2" },
                ].map((s, i) => (
                  <div key={i} style={{ background: "var(--bg2)", border: `1.5px solid ${s.color}22`, borderRadius: 16, padding: "18px 16px", boxShadow: "var(--card-shadow)" }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: `${s.color}18`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, marginBottom: 10 }}>{s.icon}</div>
                    <div style={{ fontSize: 26, fontWeight: 900, color: s.color, marginBottom: 2 }}>{typeof s.value === "number" ? s.value.toLocaleString() : s.value}</div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text)", marginBottom: 4 }}>{s.label}</div>
                    {comparePeriod && s.prev !== undefined && <CompBadge value={s.rawVal ?? (typeof s.value === "number" ? s.value : 0)} prev={s.prevRaw ?? s.prev} />}
                  </div>
                ))}
              </div>

              {/* Activity + User Growth */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                <AnalyticsPanel icon="📈" title="Exam Attempt Trend" sub={`Activity in selected period`}>
                  <MiniBarChart data={activityData} color="#4f46e5" height={120} />
                </AnalyticsPanel>
                <AnalyticsPanel icon="👥" title="New User Registrations" sub="Last 30 days">
                  <MiniBarChart data={userGrowth} color="#059669" height={120} />
                </AnalyticsPanel>
              </div>

              {/* Exam Performance Table */}
              <AnalyticsPanel icon="🏅" title="Exam Performance Breakdown" sub={`Period: ${analyticsPeriod}`} actions={<Btn size="sm" variant="ghost" onClick={exportResultsToExcel} style={{ fontSize: 11, padding: "4px 12px" }}>↓ Export</Btn>}>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                    <thead>
                      <tr style={{ background: "var(--bg3)", borderBottom: "2px solid var(--border)" }}>
                        {["Exam", "Attempts", "Pass Rate", "Avg Score", "Certificates", "Performance"].map(h => (
                          <th key={h} style={{ padding: "10px 12px", textAlign: "left", color: "var(--text2)", fontWeight: 700, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {examPerformance.slice(0, 15).map((ex, i) => {
                        const certs = filteredResults.filter(r => r.examId === ex.id && r.mode === "examSimulation" && r.pass).length;
                        return (
                          <tr key={ex.id} style={{ borderBottom: "1px solid var(--border)", transition: "background 0.15s" }}
                            onMouseEnter={e => e.currentTarget.style.background = "var(--bg3)"}
                            onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                            <td style={{ padding: "11px 12px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <div style={{ width: 8, height: 8, borderRadius: "50%", background: ex.color || "var(--accent)", flexShrink: 0 }} />
                                <div>
                                  <div style={{ fontWeight: 700, fontSize: 12 }}>{ex.title?.substring(0, 30)}{ex.title?.length > 30 ? "…" : ""}</div>
                                  <div style={{ fontSize: 10, color: "var(--text3)" }}>{ex.vendor}</div>
                                </div>
                              </div>
                            </td>
                            <td style={{ padding: "11px 12px", fontWeight: 700, color: "#4f46e5" }}>{ex.filteredAttempts}</td>
                            <td style={{ padding: "11px 12px" }}>
                              <span style={{ fontWeight: 700, color: ex.filteredPassRate >= 70 ? "#10b981" : ex.filteredPassRate >= 50 ? "#f59e0b" : "#ef4444" }}>{ex.filteredPassRate}%</span>
                            </td>
                            <td style={{ padding: "11px 12px", fontWeight: 600 }}>{ex.filteredAvgScore}%</td>
                            <td style={{ padding: "11px 12px" }}><span style={{ fontWeight: 700, color: "#7c3aed" }}>{certs}</span></td>
                            <td style={{ padding: "11px 12px", width: 100 }}>
                              <div style={{ height: 5, background: "var(--bg3)", borderRadius: 99, overflow: "hidden" }}>
                                <div style={{ height: "100%", width: `${ex.filteredPassRate}%`, background: ex.filteredPassRate >= 70 ? "#10b981" : "#f59e0b", borderRadius: 99 }} />
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </AnalyticsPanel>

              {/* Score Distribution + Mode Breakdown */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginTop: 16 }}>
                {/* Score Distribution */}
                <AnalyticsPanel icon="📊" title="Score Distribution">
                  {scoreDistribution.map((b, i) => (
                    <HBar key={i} label={b.label} value={b.count} total={filteredResults.length} color={b.color} />
                  ))}
                </AnalyticsPanel>

                {/* Mode Distribution */}
                <AnalyticsPanel icon="🎮" title="Exam Mode Usage">
                  {[
                    { label: "Exam Simulation", mode: "examSimulation", color: "#4f46e5", icon: "🎓" },
                    { label: "Full Practice", mode: "fullPractice", color: "#059669", icon: "📚" },
                    { label: "Review Mode", mode: "review", color: "#d97706", icon: "👁️" },
                  ].map(m => {
                    const count = filteredResults.filter(r => r.mode === m.mode).length;
                    return <HBar key={m.mode} label={`${m.icon} ${m.label}`} value={count} total={filteredResults.length} color={m.color} />;
                  })}
                  <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid var(--border)" }}>
                    <div style={{ fontSize: 11, color: "var(--text3)", marginBottom: 4 }}>Overall Conversion Rate</div>
                    <div style={{ fontSize: 30, fontWeight: 900, color: "#10b981" }}>{passRate}%</div>
                  </div>
                </AnalyticsPanel>

                {/* Top Countries */}
                <AnalyticsPanel icon="🌍" title="Geographic Distribution" actions={<Btn size="sm" variant="ghost" onClick={exportCountriesToExcel} style={{ fontSize: 11, padding: "3px 10px" }}>↓</Btn>}>
                  {countryStats.slice(0, 7).map((c, i) => {
                    const total = countryStats.reduce((s, x) => s + x.count, 0);
                    return <HBar key={i} label={c.country} value={c.count} total={total} color={`hsl(${200 + i * 22}, 65%, 52%)`} rank={i + 1} />;
                  })}
                </AnalyticsPanel>
              </div>

              {/* Business Insights */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16 }}>
                <AnalyticsPanel icon="💡" title="Business Insights" sub="AI-powered recommendations">
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {[
                      { icon: "🔥", color: "#ef4444", text: `${reports.filter(r => r.status === "pending").length} pending reports need attention — resolve to maintain quality`, action: "View Reports", tab: "reports" },
                      { icon: "📈", color: "#059669", text: `Pass rate is ${passRate}% — ${passRate < 60 ? "consider reviewing exam difficulty" : passRate > 85 ? "excellent performance!" : "on track"}`, action: null },
                      { icon: "🎯", color: "#4f46e5", text: `${exams.filter(e => e.isActive === false).length} exams disabled — ${exams.filter(e => e.isActive === false).length > 0 ? "review and re-enable if ready" : "all exams are live"}`, action: null },
                      { icon: "👥", color: "#7c3aed", text: `${retentionRate}% user retention rate — ${retentionRate < 30 ? "focus on re-engagement strategies" : "good retention!"}`, action: null },
                      { icon: "🌍", color: "#0891b2", text: `Users from ${countryStats.length} countries — ${countryStats.length > 10 ? "strong global presence" : "opportunity to expand globally"}`, action: null },
                    ].map((ins, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 12px", background: `${ins.color}08`, border: `1px solid ${ins.color}20`, borderRadius: 10 }}>
                        <span style={{ fontSize: 16, flexShrink: 0 }}>{ins.icon}</span>
                        <div style={{ flex: 1, fontSize: 12, color: "var(--text2)", lineHeight: 1.5 }}>{ins.text}</div>
                        {ins.action && <Btn size="sm" variant="ghost" onClick={() => handleSetTab(ins.tab)} style={{ fontSize: 10, padding: "3px 8px", flexShrink: 0, color: ins.color }}>{ins.action}</Btn>}
                      </div>
                    ))}
                  </div>
                </AnalyticsPanel>

                <AnalyticsPanel icon="🏆" title="Top Pass Rate Exams">
                  {(() => {
                    const examPassMap = {};
                    results.forEach(r => {
                      if (!examPassMap[r.examId]) examPassMap[r.examId] = { title: r.examTitle, pass: 0, total: 0 };
                      examPassMap[r.examId].total++;
                      if (r.pass) examPassMap[r.examId].pass++;
                    });
                    return Object.values(examPassMap)
                      .filter(e => e.total >= 2)
                      .map(e => ({ ...e, rate: Math.round((e.pass / e.total) * 100) }))
                      .sort((a, b) => b.rate - a.rate)
                      .slice(0, 7)
                      .map((e, i) => <HBar key={i} label={e.title?.substring(0, 28)} value={e.rate} total={100} color={e.rate >= 70 ? "#10b981" : "#f59e0b"} suffix="%" rank={i + 1} />);
                  })()}
                </AnalyticsPanel>
              </div>
            </div>
          )}

          {/* ═══════════════ EXAMS TAB ═══════════════ */}
          {tab === "exams" && (
            <div>
              <div style={{ display: "flex", gap: 12, marginBottom: 20, alignItems: "center", flexWrap: "wrap" }}>
                <div style={{ position: "relative", flex: 1, minWidth: 220 }}>
                  <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 14 }}>🔍</span>
                  <input type="text" placeholder="Search exams by name, vendor, topic..." value={examsSearch} onChange={e => setExamsSearch(e.target.value)}
                    style={{ width: "100%", padding: "10px 14px 10px 36px", background: "var(--bg3)", border: "1.5px solid var(--border)", borderRadius: 12, color: "var(--text)", fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }}
                    onFocus={e => e.target.style.borderColor = "var(--accent)"} onBlur={e => e.target.style.borderColor = "var(--border)"} />
                </div>
                <span style={{ fontSize: 12, color: "var(--text3)", background: "var(--bg3)", padding: "8px 14px", borderRadius: 99 }}>{exams.length} exams total</span>
              </div>
              {exams.length === 0 ? (
                <Empty icon="📋" title="No exams found" subtitle="Create your first exam to get started" action={<Btn onClick={openCreate}>Create Exam</Btn>} />
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {exams.filter(exam => {
                    if (!examsSearch.trim()) return true;
                    const q = examsSearch.toLowerCase();
                    return (exam.title || "").toLowerCase().includes(q) || (exam.vendor || "").toLowerCase().includes(q) || (exam.topic || "").toLowerCase().includes(q);
                  }).map(exam => (
                    <Card key={exam.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap", padding: "16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 14, flex: 1, minWidth: 250 }}>
                        {exam.image ? (
                          <div style={{ width: 52, height: 52, borderRadius: 14, overflow: "hidden", background: "var(--bg3)", flexShrink: 0 }}>
                            <img src={exam.image} alt={exam.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          </div>
                        ) : (
                          <div style={{ width: 52, height: 52, borderRadius: 14, background: `${exam.color || "var(--accent)"}18`, border: `1.5px solid ${exam.color || "var(--accent)"}28`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, flexShrink: 0 }}>
                            {exam.logo || "📋"}
                          </div>
                        )}
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 3 }}>{exam.title}</div>
                          <div style={{ fontSize: 11, color: "var(--text3)" }}>
                            {exam.vendor} · {exam.topic} ·{" "}
                            <span style={{ color: realQuestionCounts[exam.id] !== undefined && realQuestionCounts[exam.id] !== (exam.totalQuestions || 0) ? "#f59e0b" : "var(--text3)", fontWeight: realQuestionCounts[exam.id] !== undefined ? 800 : 400 }}>
                              {realQuestionCounts[exam.id] !== undefined ? realQuestionCounts[exam.id] : (exam.totalQuestions || 0)} questions
                            </span>
                            {realQuestionCounts[exam.id] !== undefined && realQuestionCounts[exam.id] !== (exam.totalQuestions || 0) && (
                              <span style={{ color: "#f59e0b", fontSize: 10, marginLeft: 4 }}>(stored: {exam.totalQuestions || 0})</span>
                            )}
                            {" "}· {(exam.attempts || 0).toLocaleString()} attempts
                          </div>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                        <Tag color={exam.color || "var(--accent)"}>{exam.topic}</Tag>
                        {exam.isActive === false && <Tag color="var(--red)">🔒 Offline</Tag>}
                        <Btn variant="ghost" size="sm" onClick={() => toggleExamStatus(exam)}>{exam.isActive === false ? "▶ Enable" : "⏸ Disable"}</Btn>
                        <Btn variant="ghost" size="sm" onClick={() => openEdit(exam)}><Icon n="edit" size={13} /></Btn>
                        <Btn variant="danger" size="sm" onClick={() => confirmDeleteExam(exam)}><Icon n="trash" size={13} /></Btn>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ═══════════════ VENDORS TAB ═══════════════ */}
          {tab === "vendors" && (
            <div>
              {vendors.length === 0 ? (
                <Empty icon="🏢" title="No vendors yet" subtitle="Add your first vendor" action={<Btn onClick={openCreateVendor}>Add Vendor</Btn>} />
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
                  {vendors.map(v => (
                    <Card key={v.id} style={{ padding: "18px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                        {v.image ? (
                          <img src={v.image} alt={v.name} style={{ width: 48, height: 48, borderRadius: 12, objectFit: "cover" }} />
                        ) : (
                          <div style={{ width: 48, height: 48, borderRadius: 12, background: `${v.color || "var(--accent)"}18`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>{v.logo || "🏢"}</div>
                        )}
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, fontSize: 14 }}>{v.name}</div>
                          {v.tag && <Tag color={v.color || "var(--accent)"} style={{ fontSize: 10 }}>{v.tag}</Tag>}
                        </div>
                      </div>
                      {v.description && <div style={{ fontSize: 12, color: "var(--text3)", marginBottom: 12, lineHeight: 1.5 }}>{v.description.substring(0, 80)}{v.description.length > 80 ? "…" : ""}</div>}
                      <div style={{ display: "flex", gap: 8 }}>
                        <Btn variant="ghost" size="sm" onClick={() => openEditVendor(v)} style={{ flex: 1 }}><Icon n="edit" size={13} /> Edit</Btn>
                        <Btn variant="danger" size="sm" onClick={() => deleteVendorHandler(v)}><Icon n="trash" size={13} /></Btn>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ═══════════════ TOPICS TAB ═══════════════ */}
          {tab === "topics" && (
            <div>
              {topics.length === 0 ? (
                <Empty icon="🎓" title="No topics yet" subtitle="Add your first topic" action={<Btn onClick={openCreateTopic}>Add Topic</Btn>} />
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
                  {topics.map(t => (
                    <Card key={t.id} style={{ padding: "18px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                        {t.image ? (
                          <img src={t.image} alt={t.name} style={{ width: 48, height: 48, borderRadius: 12, objectFit: "cover" }} />
                        ) : (
                          <div style={{ width: 48, height: 48, borderRadius: 12, background: `${t.color || "var(--accent)"}18`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>{t.icon || "📚"}</div>
                        )}
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, fontSize: 14 }}>{t.name}</div>
                          {t.tag && <Tag color={t.color || "var(--accent)"} style={{ fontSize: 10 }}>{t.tag}</Tag>}
                        </div>
                      </div>
                      {t.stats && (
                        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                          {[{ v: t.stats.jobs, l: "Jobs" }, { v: t.stats.growth, l: "Growth" }, { v: t.stats.avgSalary, l: "Salary" }].filter(s => s.v).map(s => (
                            <div key={s.l} style={{ flex: 1, textAlign: "center", background: "var(--bg3)", borderRadius: 8, padding: "6px 4px" }}>
                              <div style={{ fontWeight: 700, fontSize: 11, color: t.color || "var(--accent)" }}>{s.v}</div>
                              <div style={{ fontSize: 9, color: "var(--text3)" }}>{s.l}</div>
                            </div>
                          ))}
                        </div>
                      )}
                      <div style={{ display: "flex", gap: 8 }}>
                        <Btn variant="ghost" size="sm" onClick={() => openEditTopic(t)} style={{ flex: 1 }}><Icon n="edit" size={13} /> Edit</Btn>
                        <Btn variant="danger" size="sm" onClick={() => deleteTopicHandler(t)}><Icon n="trash" size={13} /></Btn>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ═══════════════ IMPORT TAB ═══════════════ */}
          {tab === "import" && (
            <Card>
              <h3 style={{ fontWeight: 800, marginBottom: 20 }}>📤 Import Questions from CSV</h3>
              <Select label="Select target exam" value={csvExamId} onChange={e => setCsvExamId(e.target.value)} style={{ marginBottom: 16 }}>
                <option value="">-- Select exam --</option>
                {exams.map(e => <option key={e.id} value={e.id}>{e.title} ({e.totalQuestions || 0} questions)</option>)}
              </Select>
              <div onClick={() => setReplaceQ(!replaceQ)} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18, cursor: "pointer", padding: "12px 14px", background: "var(--bg3)", borderRadius: 10 }}>
                <div style={{ width: 20, height: 20, borderRadius: 5, border: "2px solid", borderColor: replaceQ ? "#ef4444" : "var(--border)", background: replaceQ ? "#ef4444" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {replaceQ && <Icon n="check" size={12} color="#fff" />}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>Replace existing questions</div>
                  <div style={{ fontSize: 11, color: "var(--text3)" }}>Delete old questions before importing new ones</div>
                </div>
              </div>
              <div onClick={() => fileRef.current?.click()}
                onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.background = "var(--accent-soft)"; }}
                onDragLeave={e => { e.currentTarget.style.borderColor = "var(--border2)"; e.currentTarget.style.background = "transparent"; }}
                onDrop={e => { e.preventDefault(); e.currentTarget.style.borderColor = "var(--border2)"; e.currentTarget.style.background = "transparent"; const file = e.dataTransfer.files[0]; setCsvFile(file); if (file) handleImport(file); }}
                style={{ border: "2px dashed var(--border2)", borderRadius: 12, padding: "36px 24px", textAlign: "center", cursor: "pointer", transition: "all 0.2s", marginBottom: 18 }}>
                <input ref={fileRef} type="file" accept=".csv,.txt" style={{ display: "none" }} onChange={e => { const file = e.target.files?.[0] || null; setCsvFile(file); if (file) handleImport(file); }} />
                <div style={{ fontSize: 40, marginBottom: 12 }}>📁</div>
                {csvFile ? (
                  <div><div style={{ fontWeight: 700, color: "var(--green)", fontSize: 15, marginBottom: 6 }}>✅ {csvFile.name}</div><div style={{ fontSize: 12, color: "var(--text3)" }}>Ready to import</div></div>
                ) : (
                  <div><div style={{ fontWeight: 600, color: "var(--text2)", marginBottom: 6 }}>Drop CSV file here or click to browse</div><div style={{ fontSize: 12, color: "var(--text3)" }}>.csv or .txt only</div></div>
                )}
              </div>
              {importLog && (
                <div style={{ background: "var(--bg4)", borderRadius: 10, padding: "12px 14px", marginBottom: 16, fontSize: 12, fontFamily: "monospace", border: "1.5px solid var(--border)", whiteSpace: "pre-wrap", lineHeight: 1.8, maxHeight: 220, overflowY: "auto" }}>
                  {importLog.split("\n").map((line, i) => (
                    <div key={i} style={{ color: line.startsWith("✅") ? "var(--green)" : line.startsWith("❌") ? "var(--red)" : line.startsWith("⚠️") ? "var(--gold)" : "var(--text2)" }}>{line || " "}</div>
                  ))}
                </div>
              )}
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <Btn onClick={handleImport} loading={importing} disabled={!csvFile || !csvExamId}><Icon n="upload" size={15} /> {importing ? "Importing..." : "Import"}</Btn>
                <Btn variant="ghost" onClick={downloadSample}><Icon n="download" size={15} /> Download Sample CSV</Btn>
              </div>
            </Card>
          )}

          {/* ═══════════════ QUESTIONS TAB ═══════════════ */}
          {tab === "questions" && (
            <div>
              {/* Exam selector */}
              <div style={{ marginBottom: 16 }}>
                <Select value={selectedExamId} onChange={e => setSelectedExamId(e.target.value)} style={{ maxWidth: 400 }}>
                  <option value="">— Select an Exam —</option>
                  {exams.map(e => {
                    const qCount = e.id === selectedExamId
                      ? examQuestions.length
                      : (realQuestionCounts[e.id] !== undefined ? realQuestionCounts[e.id] : (e.totalQuestions ?? 0));
                    return <option key={e.id} value={e.id}>{e.title || e.name} ({qCount} Q)</option>;
                  })}
                </Select>
              </div>
              {selectedExamId ? (
                loadingQ ? (
                  <div style={{ textAlign: "center", padding: 48 }}><Spinner size={32} color="var(--accent)" /></div>
                ) : (
<QuestionBuilder
  examId={selectedExamId}
  examTitle={exams.find(e => e.id === selectedExamId)?.title || ""}
  existingQuestions={examQuestions}
  onRefresh={async () => {
    try {
      // 1. جلب الأسئلة الجديدة من Firestore
      const qs = await getQuestions(selectedExamId);
      setExamQuestions(qs || []);

      // 2. تحديث عدد الأسئلة للامتحان الحالي في قائمة الامتحانات
      setExams(prevExams =>
        prevExams.map(exam =>
          exam.id === selectedExamId
            ? { ...exam, totalQuestions: (qs || []).length }
            : exam
        )
      );
    } catch (err) {
      console.error("onRefresh error:", err);
      showToast({ msg: `Error refreshing: ${err.message}`, type: "error" });
    }
  }}
  showToast={showToast}
/>
                )
              ) : (
                <div style={{ padding: "48px 20px", textAlign: "center", background: "var(--bg2)", border: "1.5px dashed var(--border)", borderRadius: 14 }}>
                  <div style={{ fontSize: 36, marginBottom: 12 }}>❓</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text2)" }}>Select an exam to manage its questions</div>
                </div>
              )}
            </div>
          )}

          {/* ═══════════════ REPORTS TAB ═══════════════ */}
          {tab === "reports" && (
            <div>
              {/* Reports Summary */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 24 }}>
                {[
                  { label: "Pending", value: reports.filter(r => r.status === "pending").length, color: "#ef4444", icon: "⏳" },
                  { label: "Resolved", value: reports.filter(r => r.status === "resolved").length, color: "#10b981", icon: "✅" },
                  { label: "Rejected", value: reports.filter(r => r.status === "rejected").length, color: "var(--text3)", icon: "❌" },
                ].map((s, i) => (
                  <div key={i} style={{ background: "var(--bg2)", border: `1.5px solid ${s.color}22`, borderRadius: 14, padding: "16px 18px" }}>
                    <div style={{ fontSize: 22, marginBottom: 6 }}>{s.icon}</div>
                    <div style={{ fontSize: 24, fontWeight: 900, color: s.color }}>{s.value}</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text2)" }}>{s.label}</div>
                  </div>
                ))}
              </div>

              <Card>
                <div style={{ marginBottom: 18 }}>
                  <h3 style={{ fontWeight: 800, marginBottom: 4, display: "flex", alignItems: "center", gap: 8 }}>
                    <Icon n="alert_circle" size={18} color="var(--red)" /> Issue Reports
                  </h3>
                  <p style={{ color: "var(--text2)", fontSize: 12 }}>{reports.length} total reports</p>
                </div>
                {reports.length === 0 ? (
                  <Empty icon="✅" title="No pending reports" subtitle="All issues have been resolved" />
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {reports.map(report => {
                      const exam = exams.find(e => e.id === report.examId);
                      const reportUser = users.find(u => u.id === report.userId);
                      const isPending = report.status === "pending";
                      return (
                        <Card key={report.id}
                          style={{ background: isPending ? "rgba(220, 38, 38, 0.05)" : "var(--bg3)", border: `1.5px solid ${isPending ? "rgba(220, 38, 38, 0.2)" : "var(--border)"}`, cursor: "pointer", transition: "all 0.2s", padding: "16px" }}
                          onClick={() => { setSelectedReport(report); setShowReportModal(true); }}
                          onMouseEnter={e => { e.currentTarget.style.background = isPending ? "rgba(220, 38, 38, 0.08)" : "var(--bg4)"; }}
                          onMouseLeave={e => { e.currentTarget.style.background = isPending ? "rgba(220, 38, 38, 0.05)" : "var(--bg3)"; }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 14 }}>
                            <div style={{ flex: 1 }}>
                              <h4 style={{ fontWeight: 800, marginBottom: 6 }}>{exam?.title || "Deleted Exam"}</h4>
                              <div style={{ fontSize: 12, color: "var(--text2)", marginBottom: 4 }}><strong>Student:</strong> {reportUser?.name || "Deleted User"} · {reportUser?.email || "N/A"}</div>
                              <div style={{ fontSize: 12, color: "var(--text2)", marginBottom: 4 }}><strong>Issue:</strong> {report.feedback}</div>
                              <div style={{ fontSize: 11, color: "var(--text3)" }}>{new Date(report.createdAt).toLocaleDateString()}</div>
                            </div>
                            <Tag color={report.status === "pending" ? "var(--red)" : report.status === "resolved" ? "var(--green)" : "var(--text3)"}>
                              {report.status === "pending" ? "⏳ Pending" : report.status === "resolved" ? "✅ Resolved" : "❌ Rejected"}
                            </Tag>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </Card>
            </div>
          )}

          {/* ═══════════════ USERS TAB ═══════════════ */}
          {tab === "users" && (
            <div>
              {/* ── Bulk Actions Bar ── */}
              <BulkNotifyBar users={users} showToast={showToast} onExport={exportUsersToExcel} user={user} />

              <UserManagementPanel
                users={users}
                onRefresh={async () => {
                  setLoadingQ(true);
                  const qs = await getQuestions(selectedExamId);
                  setExamQuestions(qs);
                  setLoadingQ(false);
                }}
                showToast={showToast}
                extraUserActions={(u) => (
                  <UserExtraActions u={u} showToast={showToast} adminUser={user} />
                )}
              />
            </div>
          )}


          {/* ═══════════════ RESULTS TAB ═══════════════ */}
          {tab === "results" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
                <div style={{ position: "relative", flex: 1, minWidth: 220, maxWidth: 400 }}>
                  <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }}>🔍</span>
                  <input type="text" placeholder="Search by student, exam..." value={resultsSearch} onChange={e => setResultsSearch(e.target.value)}
                    style={{ width: "100%", padding: "9px 14px 9px 36px", background: "var(--bg3)", border: "1.5px solid var(--border)", borderRadius: 11, color: "var(--text)", fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }}
                    onFocus={e => e.target.style.borderColor = "var(--accent)"} onBlur={e => e.target.style.borderColor = "var(--border)"} />
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <span style={{ fontSize: 12, color: "var(--text3)", background: "var(--bg3)", padding: "8px 14px", borderRadius: 99 }}>{results.length} total results</span>
                  <Btn variant="ghost" size="sm" onClick={exportResultsToExcel}><Icon n="download" size={14} /> Export</Btn>
                </div>
              </div>
              <Card>
                <div style={{ overflowX: "auto", border: "1.5px solid var(--border)", borderRadius: 12 }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                    <thead>
                      <tr style={{ background: "var(--bg3)", borderBottom: "1.5px solid var(--border)" }}>
                        {["Student", "Exam", "Score", "Status", "Mode", "Date", "Duration"].map(h => (
                          <th key={h} style={{ padding: "12px 14px", textAlign: "left", color: "var(--text2)", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {results.filter(r => {
                        if (!resultsSearch.trim()) return true;
                        const q = resultsSearch.toLowerCase();
                        return (r.userName || "").toLowerCase().includes(q) || (r.examTitle || "").toLowerCase().includes(q);
                      }).slice(0, 20).map(r => (
                        <tr key={r.id} style={{ borderBottom: "1px solid var(--border)", transition: "background 0.15s" }}
                          onMouseEnter={e => e.currentTarget.style.background = "var(--bg3)"}
                          onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                          <td style={{ padding: "11px 14px" }}><div style={{ fontWeight: 600 }}>{r.userName}</div></td>
                          <td style={{ padding: "11px 14px", color: "var(--text2)" }}>{r.examTitle?.substring(0, 25)}{r.examTitle?.length > 25 ? "…" : ""}</td>
                          <td style={{ padding: "11px 14px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <div style={{ width: 32, height: 32, borderRadius: "50%", background: r.pass ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 900, color: r.pass ? "#10b981" : "#ef4444" }}>{r.score}%</div>
                            </div>
                          </td>
                          <td style={{ padding: "11px 14px" }}><Tag color={r.pass ? "var(--green)" : "var(--red)"}>{r.pass ? "✅ Pass" : "❌ Fail"}</Tag></td>
                          <td style={{ padding: "11px 14px", fontSize: 11, color: "var(--text3)" }}>{r.mode === "examSimulation" ? "🎓 Exam" : r.mode === "fullPractice" ? "📚 Practice" : "👁️ Review"}</td>
                          <td style={{ padding: "11px 14px", fontSize: 11, color: "var(--text3)" }}>{r.date}</td>
                          <td style={{ padding: "11px 14px", fontSize: 11 }}>{Math.round((r.timeTaken || 0) / 60)}m</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {results.length > 20 && <div style={{ textAlign: "center", padding: 12, fontSize: 12, color: "var(--text3)" }}>Showing 20 of {results.length} results</div>}
              </Card>
            </div>
          )}

          {/* ═══════════════ REVENUE TAB ═══════════════ */}
          {tab === "revenue" && (
            <AdminRevenuePanel
              users={users}
              exams={exams}
              showToast={showToast}
              adminUid={user?.uid}
              hideRefunds={true}
              onCancelTransaction={async (userId, txId, txType, adminUidArg) => {
                try {
                  await cancelTransaction(txId, adminUidArg || user.uid, "Cancelled by admin");
                  if (txType === "subscription") {
                    await cancelSubscription(userId, adminUidArg || user.uid, "Subscription cancelled by admin");
                  }
                  showToast({ msg: "✅ Transaction cancelled", type: "success" });
                  await load();
                } catch (e) { showToast({ msg: `Error: ${e.message}`, type: "error" }); }
              }}
              onApproveInstapay={async (paymentId, note) => {
                try {
                  await approveInstapayPayment(paymentId, user.uid, note);
                  showToast({ msg: "✅ Instapay approved & access granted", type: "success" });
                  await load();
                } catch (e) { showToast({ msg: `Error: ${e.message}`, type: "error" }); }
              }}
              onRejectInstapay={async (paymentId, note) => {
                try {
                  await rejectInstapayPayment(paymentId, user.uid, note);
                  showToast({ msg: "✅ Instapay rejected", type: "info" });
                  await load();
                } catch (e) { showToast({ msg: `Error: ${e.message}`, type: "error" }); }
              }}
              onRefundAction={async (refundId, status, note) => {
                try {
                  await updateRefundStatus(refundId, status, user.uid, note);
                  showToast({ msg: `✅ Refund ${status}`, type: "success" });
                  await load();
                } catch (e) { showToast({ msg: `Error: ${e.message}`, type: "error" }); }
              }}
            />
          )}

          {/* ═══════════════ REFUNDS TAB ═══════════════ */}
          {tab === "refunds" && (
            <RefundsPanel
              users={users}
              exams={exams}
              transactions={transactions}
              showToast={showToast}
              adminUid={user?.uid}
              onRefundAction={async (refundId, status, note, refundData) => {
                try {
                  await updateRefundStatus(refundId, status, user.uid, note);
                  // إلغاء الوصول عند قبول الـ refund
                  if (status === "approved" && refundData) {
                    const { revokeExamAccess } = await import("../services/payment").catch(() => ({}));
                    if (refundData.type === "subscription" && refundData.userId) {
                      await cancelSubscription(refundData.userId, user.uid, "Refund approved — subscription revoked");
                    } else if (refundData.type === "exam" && refundData.userId && refundData.examId) {
                      if (typeof revokeExamAccess === "function") {
                        await revokeExamAccess(refundData.userId, refundData.examId).catch(() => {});
                      }
                    }
                  }
                  showToast({ msg: `✅ Refund ${status}${status === "approved" ? " — access revoked" : ""}`, type: "success" });
                  await load();
                } catch (e) { showToast({ msg: `Error: ${e.message}`, type: "error" }); }
              }}
            />
          )}

    {/* ═══════════════ REFERRAL TAB (Admin Dashboard) ═══════════════ */}
{tab === "referral" && (
  <AdminReferralDashboard showToast={showToast} adminUid={user?.uid} />
)}


          {tab === "pricing" && (
            <div>
              {/* Section tabs */}
              <div style={{ display: "flex", gap: 6, marginBottom: 24, background: "var(--bg2)", border: "1.5px solid var(--border2)", borderRadius: 14, padding: 5, width: "fit-content", overflowX: "auto" }}>
                {[
                  { id: "plans", label: "💰 Subscription Plans" },
                  { id: "coupons", label: "🏷️ Coupons" },
                  { id: "exam-pricing", label: "📋 Exam Prices" },
                ].map(s => (
                  <button key={s.id} onClick={() => setPricingSection(s.id)} style={{ padding: "8px 16px", borderRadius: 10, border: "none", background: pricingSection === s.id ? "var(--gradient-accent)" : "transparent", color: pricingSection === s.id ? "#fff" : "var(--text2)", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s", whiteSpace: "nowrap" }}>
                    {s.label}
                  </button>
                ))}
              </div>

              {/* Plans */}
              {pricingSection === "plans" && (
                <div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
                    {Object.entries(plans).map(([key, plan]) => (
                      <div key={key} style={{ background: "var(--bg2)", border: "1.5px solid var(--border2)", borderRadius: 16, padding: "20px" }}>
                        <div style={{ fontSize: 14, fontWeight: 900, color: "var(--text)", marginBottom: 16, textTransform: "capitalize" }}>
                          {key === "monthly" ? "💙" : "👑"} {plan.name || key} Plan
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
                          <div>
                            <label style={{ display: "block", fontSize: 11, fontWeight: 800, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>Price ($)</label>
                            <input type="number" step="0.01" min="0" value={plan.price || 0}
                              onChange={e => setPlans(p => ({ ...p, [key]: { ...p[key], price: parseFloat(e.target.value) || 0 } }))}
                              style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1.5px solid var(--border2)", background: "var(--bg)", color: "var(--text)", fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: 11, fontWeight: 800, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>Original ($)</label>
                            <input type="number" step="0.01" min="0" value={plan.originalPrice || ""} placeholder="Optional"
                              onChange={e => setPlans(p => ({ ...p, [key]: { ...p[key], originalPrice: parseFloat(e.target.value) || null } }))}
                              style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1.5px solid var(--border2)", background: "var(--bg)", color: "var(--text)", fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
                          </div>
                        </div>
                        <div style={{ marginBottom: 14 }}>
                          <label style={{ display: "block", fontSize: 11, fontWeight: 800, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>Display Name</label>
                          <input value={plan.name || ""}
                            onChange={e => setPlans(p => ({ ...p, [key]: { ...p[key], name: e.target.value } }))}
                            style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1.5px solid var(--border2)", background: "var(--bg)", color: "var(--text)", fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: 11, fontWeight: 800, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>Features (سطر لكل ميزة)</label>
                          <textarea rows={5} value={(plan.features || []).join("\n")}
                            onChange={e => setPlans(p => ({ ...p, [key]: { ...p[key], features: e.target.value.split("\n").filter(Boolean) } }))}
                            style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1.5px solid var(--border2)", background: "var(--bg)", color: "var(--text)", fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box", resize: "vertical" }} />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <Btn onClick={savePlans} loading={savingPricing}>💾 Save Plans</Btn>
                  </div>
                </div>
              )}

              {/* Coupons */}
              {pricingSection === "coupons" && (
                <div>
                 <div style={{ background: "var(--bg2)", border: "1.5px solid var(--border2)", borderRadius: 16, padding: "20px", marginBottom: 20 }}>
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
    <div style={{ fontSize: 13, fontWeight: 800, color: "var(--text)" }}>➕ Add New Coupon</div>
    <button onClick={refreshCoupons} style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg3)", cursor: "pointer", fontSize: 12 }}>
      🔄 Refresh Coupons
    </button>
  </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginBottom: 14 }}>
                      <div>
                        <label style={{ display: "block", fontSize: 11, fontWeight: 800, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>Code *</label>
                        <input value={newCoupon.code} onChange={e => setNewCoupon(c => ({ ...c, code: e.target.value.toUpperCase() }))} placeholder="e.g. SAVE20"
                          style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1.5px solid var(--border2)", background: "var(--bg)", color: "var(--text)", fontSize: 13, fontFamily: "monospace", letterSpacing: "0.05em", outline: "none", boxSizing: "border-box" }} />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: 11, fontWeight: 800, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>Discount %</label>
                        <input type="number" min="0" max="100" value={newCoupon.discountPercent} onChange={e => setNewCoupon(c => ({ ...c, discountPercent: parseInt(e.target.value) || 0 }))}
                          style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1.5px solid var(--border2)", background: "var(--bg)", color: "var(--text)", fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: 11, fontWeight: 800, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>Fixed Amount ($)</label>
                        <input type="number" min="0" step="0.01" value={newCoupon.discountAmount} onChange={e => setNewCoupon(c => ({ ...c, discountAmount: parseFloat(e.target.value) || 0 }))} placeholder="0 = use %"
                          style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1.5px solid var(--border2)", background: "var(--bg)", color: "var(--text)", fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: 11, fontWeight: 800, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>Max Uses (0=∞)</label>
                        <input type="number" min="0" value={newCoupon.maxUses} onChange={e => setNewCoupon(c => ({ ...c, maxUses: parseInt(e.target.value) || 0 }))}
                          style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1.5px solid var(--border2)", background: "var(--bg)", color: "var(--text)", fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: 11, fontWeight: 800, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>Expires</label>
                        <input type="date" value={newCoupon.expiresAt} onChange={e => setNewCoupon(c => ({ ...c, expiresAt: e.target.value }))}
                          style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1.5px solid var(--border2)", background: "var(--bg)", color: "var(--text)", fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: 11, fontWeight: 800, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>Scope</label>
                        <select value={newCoupon.scope} onChange={e => setNewCoupon(c => ({ ...c, scope: e.target.value }))}
                          style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1.5px solid var(--border2)", background: "var(--bg)", color: "var(--text)", fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }}>
                          <option value="all">All (Plans + Exams)</option>
                          <option value="plans">Plans only</option>
                          <option value="exams">Exams only</option>
                          <option value="single_exam">Single Exam only</option>
                        </select>
                      </div>
                      {newCoupon.scope === "single_exam" && (
                        <div>
                          <label style={{ display: "block", fontSize: 11, fontWeight: 800, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>Target Exam</label>
                          <select value={newCoupon.examIds?.[0] || ""} onChange={e => setNewCoupon(c => ({ ...c, examIds: e.target.value ? [e.target.value] : [] }))}
                            style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1.5px solid var(--border2)", background: "var(--bg)", color: "var(--text)", fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }}>
                            <option value="">— Select Exam —</option>
                            {exams.map(ex => <option key={ex.id} value={ex.id}>{ex.title}</option>)}
                          </select>
                        </div>
                      )}
                      <div>
                        <label style={{ display: "block", fontSize: 11, fontWeight: 800, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>Restrictions</label>
                        <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 12, fontWeight: 700, padding: "8px 10px", background: "var(--bg)", borderRadius: 8, border: "1.5px solid var(--border2)" }}>
                          <input type="checkbox" checked={newCoupon.onePerUser} onChange={e => setNewCoupon(c => ({ ...c, onePerUser: e.target.checked }))} style={{ accentColor: "var(--accent)" }} />
                          One-time per user
                        </label>
                      </div>
                    </div>
                    <Btn onClick={addCoupon}><Icon n="plus" size={14} /> Add Coupon</Btn>
                  </div>

                  {coupons.length === 0 ? (
                    <Empty icon="🏷️" title="No coupons yet" subtitle="Add your first discount coupon above" />
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {coupons.map((coupon) => (
                        <Card key={coupon.code} style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", padding: "14px 18px", opacity: coupon.isActive ? 1 : 0.5 }}>
                          <div style={{ fontFamily: "monospace", fontSize: 15, fontWeight: 900, color: "var(--accent)", letterSpacing: "0.05em", minWidth: 110 }}>{coupon.code}</div>
                          <div style={{ flex: 1, minWidth: 200 }}>
                            <div style={{ fontSize: 13, color: "var(--text)", fontWeight: 700 }}>
                              {coupon.discountAmount ? `-$${coupon.discountAmount}` : `-${coupon.discountPercent}%`}
                              {" · "}{coupon.maxUses ? `${coupon.usedCount || 0}/${coupon.maxUses} uses` : "Unlimited"}
                              {coupon.expiresAt ? ` · Expires ${coupon.expiresAt}` : ""}
                            </div>
                            <div style={{ fontSize: 11, color: "var(--text3)", display: "flex", gap: 10, marginTop: 2, flexWrap: "wrap" }}>
                              <span>Scope: {coupon.scope || "all"}{coupon.examIds?.length === 1 && exams.find(e => e.id === coupon.examIds[0]) ? ` → ${exams.find(e => e.id === coupon.examIds[0]).title}` : ""}</span>
                              <span style={{ color: "var(--accent)", fontWeight: 700 }}>👤 {
                                (() => {
                                  // Most accurate: count from live transactions
                                  const fromTx = transactions.filter(t => t.couponCode && t.couponCode.toUpperCase() === coupon.code.toUpperCase()).length;
                                  // Fallback: usedByUsers array
                                  const usedByArr = Array.isArray(coupon.usedByUsers) ? coupon.usedByUsers.length : 0;
                                  // Fallback: stored usedCount
                                  const usedCount = coupon.usedCount || 0;
                                  return Math.max(fromTx, usedByArr, usedCount);
                                })()
                              } registered via coupon</span>
                            </div>
                          </div>
                          <Tag color={coupon.isActive ? "var(--green)" : "var(--red)"}>{coupon.isActive ? "Active" : "Off"}</Tag>
                          <Btn variant="ghost" size="sm" onClick={() => setCoupons(p => p.map(c => c.code === coupon.code ? { ...c, isActive: !c.isActive } : c))}>
                            {coupon.isActive ? "Disable" : "Enable"}
                          </Btn>
                          <Btn variant="danger" size="sm" onClick={() => setCoupons(p => p.filter(c => c.code !== coupon.code))}><Icon n="trash" size={13} /></Btn>
                        </Card>
                      ))}
                    </div>
                  )}

                  {coupons.length > 0 && (
                    <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
                      <Btn onClick={saveCoupons} loading={savingPricing}>💾 Save Coupons</Btn>
                    </div>
                  )}
                </div>
              )}

              {/* Exam Pricing */}
              {pricingSection === "exam-pricing" && (
                <ExamPricingPanel exams={exams} showToast={showToast} />
              )}
            </div>
          )}

          {/* ═══════════════ CONTACTS TAB ═══════════════ */}
          {tab === "contacts" && (
            <ContactsPanel showToast={showToast} adminUid={user?.uid} />
          )}

          {/* ═══════════════ LEADERBOARD TAB ═══════════════ */}
          {tab === "leaderboard" && (
            <AdminLeaderboardPanel showToast={showToast} users={users} />
          )}

          {/* ═══════════════ SETTINGS TAB ═══════════════ */}
          {tab === "settings" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {/* Platform Info */}
              <AnalyticsPanel icon="⚙️" title="Platform Settings" sub="Configure your FlexExams platform">
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  {[
                    { label: "Platform Name",   value: "FlexExams",              editable: false },
                    { label: "Admin Email",      value: user?.email || "—",       editable: false },
                    { label: "Total Exams",      value: exams.length,             editable: false },
                    { label: "Total Users",      value: users.length,             editable: false },
                    { label: "Total Results",    value: results.length,           editable: false },
                    { label: "Active Reports",   value: reports.filter(r => r.status === "pending").length, editable: false },
                    { label: "Database",         value: "Firebase Firestore",     editable: false },
                    { label: "Auth Provider",    value: "Firebase Auth",          editable: false },
                  ].map((s, i) => (
                    <div key={i} style={{ padding: "12px 14px", background: "var(--bg3)", borderRadius: 10, border: "1.5px solid var(--border)" }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>{s.label}</div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text)" }}>{s.value}</div>
                    </div>
                  ))}
                </div>
              </AnalyticsPanel>

              {/* Firebase Usage Warning */}
              <div style={{ background: "linear-gradient(135deg, rgba(245,158,11,0.08), rgba(217,119,6,0.04))", border: "1.5px solid rgba(245,158,11,0.3)", borderRadius: 16, padding: "20px 24px" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                  <div style={{ fontSize: 28, flexShrink: 0 }}>🔥</div>
                  <div>
                    <h4 style={{ fontWeight: 800, marginBottom: 8, color: "var(--gold)" }}>Firebase Limit Protection Active</h4>
                    <p style={{ fontSize: 13, color: "var(--text2)", lineHeight: 1.6, marginBottom: 12 }}>
                      Data is loaded once on page mount and only refreshes when you click the <strong>"🔄 Refresh Data"</strong> button. This protects your Firebase free-tier read quota.
                    </p>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {["✅ No auto-refresh", "✅ Manual refresh only", "✅ Batch loading", "✅ Error catching"].map(f => (
                        <span key={f} style={{ fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 99, background: "rgba(245,158,11,0.12)", color: "var(--gold)", border: "1px solid rgba(245,158,11,0.2)" }}>{f}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Data Export */}
              <AnalyticsPanel icon="📦" title="Data Export" sub="Download your platform data as CSV">
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  <Btn variant="ghost" onClick={exportUsersToExcel}><Icon n="download" size={14} /> Export Users CSV</Btn>
                  <Btn variant="ghost" onClick={exportResultsToExcel}><Icon n="download" size={14} /> Export Results CSV</Btn>
                  <Btn variant="ghost" onClick={exportCountriesToExcel}><Icon n="download" size={14} /> Export Countries CSV</Btn>
                </div>
              </AnalyticsPanel>

              {/* Danger Zone */}
              <div style={{ background: "rgba(220,38,38,0.04)", border: "1.5px solid rgba(220,38,38,0.25)", borderRadius: 16, padding: "20px 24px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                  <span style={{ fontSize: 20 }}>🚨</span>
                  <div>
                    <div style={{ fontWeight: 900, fontSize: 14, color: "#dc2626" }}>Danger Zone</div>
                    <div style={{ fontSize: 11, color: "var(--text3)" }}>Irreversible actions — proceed with caution</div>
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {/* Delete Analytics */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", background: "var(--bg2)", border: "1.5px solid rgba(220,38,38,0.2)", borderRadius: 12, gap: 14, flexWrap: "wrap" }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 2 }}>🗑️ Delete All Analytics Data</div>
                      <div style={{ fontSize: 11, color: "var(--text3)" }}>Permanently deletes all results and reports. Cannot be undone.</div>
                    </div>
                    <button onClick={deleteAllAnalyticsData} style={{ padding: "9px 18px", background: "#dc2626", color: "#fff", border: "none", borderRadius: 10, fontWeight: 800, fontSize: 12, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap", flexShrink: 0 }}>
                      Delete Analytics
                    </button>
                  </div>
                  {/* Delete All Users (placeholder - needs backend) */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", background: "var(--bg2)", border: "1.5px solid rgba(220,38,38,0.2)", borderRadius: 12, gap: 14, flexWrap: "wrap" }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 2 }}>👥 Bulk User Management</div>
                      <div style={{ fontSize: 11, color: "var(--text3)" }}>Advanced user deletion and management available in the Users tab.</div>
                    </div>
                    <button onClick={() => handleSetTab("users")} style={{ padding: "9px 18px", background: "var(--bg3)", color: "var(--text2)", border: "1.5px solid var(--border)", borderRadius: 10, fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap", flexShrink: 0 }}>
                      Go to Users
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ═══════════ MODALS ═══════════════════════════════════════════ */}

      {/* Create/Edit Exam Modal */}
      {showForm && (
        <Modal title={editTarget ? "✏️ Edit Exam" : "➕ Create New Exam"} onClose={() => setShowForm(false)} maxWidth={700}>
          <div style={{ maxHeight: "75vh", overflowY: "auto" }}>
            <Input label="Exam Title" value={form.title} onChange={upd("title")} error={formErr.title} placeholder="e.g., AWS Solutions Architect" />
            <Input label="Subtitle" value={form.subtitle} onChange={upd("subtitle")} placeholder="e.g., SAA-C03" />
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text2)", marginBottom: 8, display: "block" }}>Exam Image</label>
              <div style={{ border: "2px dashed var(--border2)", borderRadius: 12, padding: "24px", textAlign: "center", cursor: "pointer", marginBottom: 12, background: imagePreview ? "var(--bg3)" : "transparent" }} onClick={() => document.getElementById("image-input")?.click()}>
                {imagePreview ? <img src={imagePreview} alt="Preview" style={{ maxWidth: "100%", maxHeight: 200, borderRadius: 8 }} /> : (
                  <div><div style={{ fontSize: 32, marginBottom: 8 }}>📸</div><div style={{ fontWeight: 600, color: "var(--text2)", marginBottom: 4 }}>Click to upload image</div><div style={{ fontSize: 11, color: "var(--text3)" }}>JPG, PNG or WebP</div></div>
                )}
              </div>
              <input id="image-input" type="file" accept="image/*" onChange={handleImageUpload} style={{ display: "none" }} />
              <Input label="Or Image URL" value={form.imageUrl} onChange={e => handleExamImageUrl(e.target.value)} placeholder="https://example.com/exam-cover.png" />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <Select label="Vendor" value={form.vendor} onChange={upd("vendor")} error={formErr.vendor}>
                <option value="">-- Select vendor --</option>
                {vendors.map(v => <option key={v.id} value={v.name}>{v.name}</option>)}
              </Select>
              <Select label="Topic" value={form.topic} onChange={upd("topic")} error={formErr.topic}>
                <option value="">-- Select topic --</option>
                {topics.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
              </Select>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text2)", marginBottom: 7, display: "block" }}>Emoji</label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 6 }}>
                  {EMOJIS.map(emoji => (
                    <button key={emoji} onClick={() => setForm(p => ({ ...p, logo: emoji }))} style={{ padding: 10, borderRadius: 8, border: form.logo === emoji ? "2px solid var(--accent)" : "1.5px solid var(--border)", background: form.logo === emoji ? "var(--accent-soft)" : "var(--bg)", fontSize: 20, cursor: "pointer" }}>{emoji}</button>
                  ))}
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text2)", marginBottom: 7, display: "block" }}>Brand Color</label>
                <input type="color" value={form.color} onChange={e => setForm(p => ({ ...p, color: e.target.value }))} style={{ width: "100%", height: 40, borderRadius: 8, border: "1.5px solid var(--border)", cursor: "pointer" }} />
              </div>
            </div>
            <Textarea label="Short Description" value={form.description} onChange={upd("description")} rows={2} placeholder="Brief overview of the exam" />
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text2)", marginBottom: 8, display: "block" }}>Long Description</label>
              <RichTextEditor value={form.longDescription} onChange={val => setForm(p => ({ ...p, longDescription: val }))} placeholder="Detailed information about the exam..." />
              <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 6 }}>✨ Supports bold, italic, headings, bullet & numbered lists</div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <Input label="Duration (minutes)" type="number" value={form.duration} onChange={upd("duration")} error={formErr.duration} />
              <Input label="Pass Score (%)" type="number" value={form.passScore} onChange={upd("passScore")} error={formErr.passScore} />
            </div>
            <Input label="Max Questions per Exam" type="number" value={form.maxQuestionsPerExam} onChange={upd("maxQuestionsPerExam")} />

            {/* ── Pricing Section ── */}
            <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1.5px dashed var(--border2)" }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 14 }}>💰 Pricing</div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, padding: "10px 14px", background: form.pricing?.price === 0 || form.pricing?.isFree ? "rgba(16,185,129,0.06)" : "rgba(99,102,241,0.06)", borderRadius: 10, border: `1px solid ${form.pricing?.price === 0 || form.pricing?.isFree ? "rgba(16,185,129,0.2)" : "rgba(99,102,241,0.2)"}` }}>
                <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, fontWeight: 700, color: "var(--text)" }}>
                  <input type="checkbox" checked={form.pricing?.isFree || form.pricing?.price === 0}
                    onChange={e => setForm(p => ({ ...p, pricing: { ...p.pricing, isFree: e.target.checked, price: e.target.checked ? 0 : p.pricing?.price || 9.99 } }))}
                    style={{ width: 16, height: 16, accentColor: "var(--green)" }} />
                  Free Exam (with preview limit for guests/registered)
                </label>
              </div>
              {!(form.pricing?.isFree || form.pricing?.price === 0) && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 800, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>Price ($)</label>
                    <input type="number" step="0.01" min="0.01" value={form.pricing?.price || ""}
                      onChange={e => setForm(p => ({ ...p, pricing: { ...p.pricing, price: parseFloat(e.target.value) || 0 } }))}
                      placeholder="e.g. 9.99"
                      style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1.5px solid var(--border2)", background: "var(--bg)", color: "var(--text)", fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 800, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>Original ($)</label>
                    <input type="number" step="0.01" min="0" value={form.pricing?.originalPrice || ""} placeholder="Optional"
                      onChange={e => setForm(p => ({ ...p, pricing: { ...p.pricing, originalPrice: parseFloat(e.target.value) || null } }))}
                      style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1.5px solid var(--border2)", background: "var(--bg)", color: "var(--text)", fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 800, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>Discount %</label>
                    <input type="number" min="0" max="100" value={form.pricing?.discount || 0}
                      onChange={e => setForm(p => ({ ...p, pricing: { ...p.pricing, discount: parseInt(e.target.value) || 0 } }))}
                      style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1.5px solid var(--border2)", background: "var(--bg)", color: "var(--text)", fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
                  </div>
                </div>
              )}
              {form.pricing && !form.pricing.isFree && form.pricing.price > 0 && (
                <div style={{ marginTop: 10, padding: "8px 12px", background: "rgba(99,102,241,0.08)", borderRadius: 8, fontSize: 12, color: "var(--accent)", fontWeight: 700 }}>
                  💡 سعر الاختبار: ${form.pricing.price.toFixed(2)}
                  {form.pricing.originalPrice && ` (خصم من $${form.pricing.originalPrice.toFixed(2)})`}
                </div>
              )}
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <Btn onClick={saveExam} loading={saving} full>{editTarget ? "Update Exam" : "Create Exam"}</Btn>
              <Btn variant="ghost" onClick={() => setShowForm(false)}>Cancel</Btn>
            </div>
          </div>
        </Modal>
      )}

      {/* Vendor Modal */}
      {showVendorForm && (
        <Modal title={editVendor ? "✏️ Edit Vendor" : "➕ Add Vendor"} onClose={() => setShowVendorForm(false)} maxWidth={560}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14, maxHeight: "75vh", overflowY: "auto" }}>
            <Input label="Vendor Name *" value={vendorForm.name} onChange={e => setVendorForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g., Amazon AWS" />
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text2)", marginBottom: 8, display: "block" }}>Vendor Logo/Image</label>
              <div style={{ border: "2px dashed var(--border2)", borderRadius: 12, padding: "24px", textAlign: "center", cursor: "pointer", background: vendorForm.imagePreview ? "var(--bg3)" : "transparent", marginBottom: 10 }} onClick={() => document.getElementById("vendor-image-input")?.click()}>
                {vendorForm.imagePreview ? <img src={vendorForm.imagePreview} alt="Preview" style={{ maxWidth: "100%", maxHeight: 150, borderRadius: 8 }} /> : (
                  <div><div style={{ fontSize: 32, marginBottom: 8 }}>📸</div><div style={{ fontWeight: 600, color: "var(--text2)", marginBottom: 4 }}>Click to upload vendor logo</div><div style={{ fontSize: 11, color: "var(--text3)" }}>PNG, JPG or WebP</div></div>
                )}
              </div>
              <input id="vendor-image-input" type="file" accept="image/*" style={{ display: "none" }} onChange={handleVendorImageUpload} />
              <Input label="Or Image URL" value={vendorForm.imageUrl} onChange={e => handleVendorImageUrl(e.target.value)} placeholder="https://example.com/vendor-logo.png" />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text2)", marginBottom: 7, display: "block" }}>Emoji Logo</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {["🏢","🌐","☁️","🔒","💻","📡","🛡️","🔧","📊","⚡"].map(e => (
                  <button key={e} onClick={() => setVendorForm(p => ({ ...p, logo: e }))} style={{ padding: "8px 10px", borderRadius: 8, border: vendorForm.logo === e ? "2px solid var(--accent)" : "1.5px solid var(--border)", background: vendorForm.logo === e ? "var(--accent-soft)" : "var(--bg)", fontSize: 18, cursor: "pointer" }}>{e}</button>
                ))}
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Input label="Tag" value={vendorForm.tag} onChange={e => setVendorForm(p => ({ ...p, tag: e.target.value }))} placeholder="e.g., Cloud" />
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text2)", marginBottom: 7, display: "block" }}>Brand Color</label>
                <input type="color" value={vendorForm.color} onChange={e => setVendorForm(p => ({ ...p, color: e.target.value }))} style={{ width: "100%", height: 40, borderRadius: 8, border: "1.5px solid var(--border)", cursor: "pointer" }} />
              </div>
            </div>
            <Textarea label="Description" value={vendorForm.description} onChange={e => setVendorForm(p => ({ ...p, description: e.target.value }))} rows={2} placeholder="Brief description of this vendor" />
            <Input label="Smart Suggestion" value={vendorForm.suggestion} onChange={e => setVendorForm(p => ({ ...p, suggestion: e.target.value }))} placeholder="e.g., Start with AWS Cloud Practitioner" />
            <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
              <Btn onClick={saveVendorHandler} loading={savingVendor} full>{editVendor ? "Update Vendor" : "Create Vendor"}</Btn>
              <Btn variant="ghost" onClick={() => setShowVendorForm(false)}>Cancel</Btn>
            </div>
          </div>
        </Modal>
      )}

      {/* Topic Modal */}
      {showTopicForm && (
        <Modal title={editTopic ? "✏️ Edit Topic" : "➕ Add Topic"} onClose={() => setShowTopicForm(false)} maxWidth={560}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14, maxHeight: "75vh", overflowY: "auto" }}>
            <Input label="Topic Name *" value={topicForm.name} onChange={e => setTopicForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g., Cloud Computing" />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text2)", marginBottom: 7, display: "block" }}>Icon Emoji</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                  {["📚","☁️","🔒","💻","🌐","📊","🛡️","🏗️","📱","⚡","🎯","🔧"].map(e => (
                    <button key={e} onClick={() => setTopicForm(p => ({ ...p, icon: e }))} style={{ padding: "6px 8px", borderRadius: 7, border: topicForm.icon === e ? "2px solid var(--accent)" : "1.5px solid var(--border)", background: topicForm.icon === e ? "var(--accent-soft)" : "var(--bg)", fontSize: 16, cursor: "pointer" }}>{e}</button>
                  ))}
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text2)", marginBottom: 7, display: "block" }}>Color</label>
                <input type="color" value={topicForm.color} onChange={e => setTopicForm(p => ({ ...p, color: e.target.value }))} style={{ width: "100%", height: 40, borderRadius: 8, border: "1.5px solid var(--border)", cursor: "pointer" }} />
              </div>
            </div>
            <Textarea label="Description" value={topicForm.description} onChange={e => setTopicForm(p => ({ ...p, description: e.target.value }))} rows={2} placeholder="Brief description of this topic" />
            <Input label="Smart Suggestion" value={topicForm.suggestion} onChange={e => setTopicForm(p => ({ ...p, suggestion: e.target.value }))} placeholder="e.g., Start with AWS Cloud Practitioner" />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
              <Input label="Job Market" value={topicForm.statsJobs} onChange={e => setTopicForm(p => ({ ...p, statsJobs: e.target.value }))} placeholder="e.g., 2.4M+" />
              <Input label="Growth Rate" value={topicForm.statsGrowth} onChange={e => setTopicForm(p => ({ ...p, statsGrowth: e.target.value }))} placeholder="e.g., +35%" />
              <Input label="Avg Salary" value={topicForm.statsSalary} onChange={e => setTopicForm(p => ({ ...p, statsSalary: e.target.value }))} placeholder="e.g., $120K" />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text2)", marginBottom: 8, display: "block" }}>📸 Topic Image / Logo</label>
              <div style={{ border: "2px dashed var(--border2)", borderRadius: 12, padding: "20px 16px", textAlign: "center", cursor: "pointer", background: topicForm.imagePreview ? "var(--bg3)" : "transparent", transition: "all 0.2s" }} onClick={() => topicImageRef.current?.click()}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.background = "var(--accent-soft)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border2)"; e.currentTarget.style.background = topicForm.imagePreview ? "var(--bg3)" : "transparent"; }}>
                {topicForm.imagePreview ? (
                  <div><img src={topicForm.imagePreview} alt="Preview" style={{ maxWidth: "100%", maxHeight: 140, borderRadius: 8, marginBottom: 8 }} /><div style={{ fontSize: 11, color: "var(--text3)" }}>Click to change</div></div>
                ) : (
                  <div><div style={{ fontSize: 28, marginBottom: 8 }}>📸</div><div style={{ fontWeight: 600, color: "var(--text2)", fontSize: 13 }}>Click to upload topic image</div><div style={{ fontSize: 11, color: "var(--text3)" }}>JPG, PNG or WebP</div></div>
                )}
              </div>
              <input ref={topicImageRef} type="file" accept="image/*" onChange={handleTopicImageUpload} style={{ display: "none" }} />
              {topicForm.imagePreview && !topicForm.imageUrl && (
                <button onClick={() => setTopicForm(p => ({ ...p, image: null, imagePreview: null, imageUrl: "" }))} style={{ marginTop: 6, background: "none", border: "none", color: "var(--red)", fontSize: 11, cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}>🗑️ Remove image</button>
              )}
            </div>
            <Input label="Or Image URL" value={topicForm.imageUrl} onChange={e => handleTopicImageUrl(e.target.value)} placeholder="https://example.com/topic-cover.png" />
            <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
              <Btn onClick={saveTopicHandler} loading={savingTopic} full>{editTopic ? "Update Topic" : "Create Topic"}</Btn>
              <Btn variant="ghost" onClick={() => setShowTopicForm(false)}>Cancel</Btn>
            </div>
          </div>
        </Modal>
      )}

      {/* Report Details Modal */}
      {showReportModal && selectedReport && (() => {
        // Local feedback state inside IIFE — use a wrapper component approach
        return <ReportModal
          report={selectedReport}
          exams={exams}
          users={users}
          onAction={handleReportAction}
          onDelete={(id) => { deleteReportRecord(id); setShowReportModal(false); }}
          onClose={() => setShowReportModal(false)}
        />;
      })()}
    </div>
  );
}
