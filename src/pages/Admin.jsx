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
import { parseCSV, rowToQuestion, SAMPLE_CSV } from "../utils/csv";
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
  { key: "overview", icon: "chart", label: "Overview", emoji: "📊" },
  { key: "analytics", icon: "chart", label: "Analytics", emoji: "📈" },
  { key: "exams", icon: "exam", label: "Exams", emoji: "📋" },
  { key: "vendors", icon: "public", label: "Vendors", emoji: "🏢" },
  { key: "topics", icon: "book", label: "Topics", emoji: "🎓" },
  { key: "import", icon: "upload", label: "Import", emoji: "📤" },
  { key: "questions", icon: "book", label: "Questions", emoji: "❓" },
  { key: "reports", icon: "warning", label: "Reports", emoji: "⚠️" },
  { key: "users", icon: "user", label: "Users", emoji: "👥" },
  { key: "results", icon: "trophy", label: "Results", emoji: "🏆" },
  { key: "revenue", icon: "dollar", label: "Revenue", emoji: "💰" },
  { key: "settings", icon: "settings", label: "Settings", emoji: "⚙️" },
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

export default function Admin({ showToast, setPage }) {
  const { user, isAdmin } = useAuth();
  const [tab, setTab] = useState("overview");

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

  const upd = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  // ── Load only on mount (no auto-refresh to protect Firebase limits) ──────────
  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!selectedExamId || tab !== "questions") return;
    setLoadingQ(true);
    getQuestions(selectedExamId).then(qs => { setExamQuestions(qs); setLoadingQ(false); }).catch(() => setLoadingQ(false));
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
      if (editTarget) {
        await updateExam(editTarget.id, form);
        showToast({ msg: "✅ Exam updated successfully", type: "success" });
      } else {
        await createExam(form);
        showToast({ msg: "🎉 Exam created successfully", type: "success" });
      }
      await load();
      setShowForm(false);
    } catch (e) {
      showToast({ msg: `Error saving exam: ${e.message}`, type: "error" });
    }
    setSaving(false);
  };

  const openCreate = () => {
    setEditTarget(null);
    setForm({ title: "", subtitle: "", vendor: "", topic: "", logo: "📋", color: "#3b82f6", description: "", longDescription: "", duration: 90, passScore: 70, maxQuestionsPerExam: 40, image: null, imageUrl: "", isActive: true });
    setFormErr({});
    setImagePreview(null);
    setShowForm(true);
  };

  const openEdit = (exam) => {
    setEditTarget(exam);
    setForm({ title: exam.title || "", subtitle: exam.subtitle || "", vendor: exam.vendor || "", topic: exam.topic || "", logo: exam.logo || "📋", color: exam.color || "#3b82f6", description: exam.description || "", longDescription: exam.longDescription || "", duration: exam.duration || 90, passScore: exam.passScore || 70, maxQuestionsPerExam: exam.maxQuestionsPerExam || 40, image: exam.image || null, imageUrl: exam.image?.startsWith?.("http") ? exam.image : "", isActive: exam.isActive !== false });
    setFormErr({});
    setImagePreview(exam.image);
    setShowForm(true);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
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

  const delQuestion = async (q) => {
    if (!window.confirm("Delete this question?")) return;
    try {
      await deleteQuestion(q.id);
      setExamQuestions(prev => prev.filter(x => x.id !== q.id));
      showToast({ msg: "✅ Question deleted", type: "info" });
    } catch (e) { showToast({ msg: `Error: ${e.message}`, type: "error" }); }
  };

  // ======= REPORTS =======
  const handleReportAction = async (reportId, status) => {
    try {
      await updateReportStatus(reportId, status);
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
          <Btn variant="ghost" size="sm" onClick={resetAnalytics}>↺ Reset Analytics</Btn>
          <Btn size="sm" onClick={load} loading={loading}>🔄 Refresh Data</Btn>
          {tab === "exams" && <Btn size="sm" onClick={openCreate}><Icon n="plus" size={14} /> New Exam</Btn>}
          {tab === "vendors" && <Btn size="sm" onClick={openCreateVendor}><Icon n="plus" size={14} /> New Vendor</Btn>}
          {tab === "topics" && <Btn size="sm" onClick={openCreateTopic}><Icon n="plus" size={14} /> New Topic</Btn>}
        </div>
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: "flex", gap: 3, marginBottom: 28, background: "var(--bg2)", borderRadius: 16, padding: 6, boxShadow: "0 2px 8px rgba(0,0,0,0.04)", overflowX: "auto" }}>
        {TABS.map(({ key, emoji, label }) => (
          <button key={key} onClick={() => setTab(key)} style={{
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
              {/* KPI Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: 14, marginBottom: 28 }}>
                <KPICard icon="📋" label="Total Exams" value={stats?.totalExams || exams.length} sub={`${exams.filter(e => e.isActive !== false).length} active`} color="#4f46e5" sparkData={[3,5,4,6,5,8,exams.length]} />
                <KPICard icon="👥" label="Total Students" value={(stats?.totalStudents || users.length).toLocaleString()} sub="Registered" color="#059669" sparkData={userGrowth.slice(-7).map(d => d.value)} />
                <KPICard icon="📝" label="Total Attempts" value={(stats?.totalAttempts || results.length).toLocaleString()} sub="All time" color="#d97706" sparkData={activityData.slice(-7).map(d => d.value)} />
                <KPICard icon="✅" label="Pass Rate" value={`${stats?.passRate || passRate}%`} sub="Global average" color="#7c3aed" trend={prevPassRate !== null ? passRate - prevPassRate : undefined} />
                <KPICard icon="📊" label="Avg Score" value={`${avgScore}%`} sub="All exams" color="#0891b2" trend={prevAvgScore !== null ? avgScore - prevAvgScore : undefined} />
                <KPICard icon="🏆" label="Certificates" value={results.filter(r => r.mode === "examSimulation" && r.pass).length} sub="Issued total" color="#f59e0b" />
                <KPICard icon="⚠️" label="Pending Reports" value={reports.filter(r => r.status === "pending").length} sub="Need review" color="#dc2626" />
                <KPICard icon="🌍" label="Countries" value={countryStats.length} sub="User locations" color="#6366f1" />
              </div>

              {/* Charts Row 1 */}
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
                  <Btn size="sm" variant="ghost" onClick={resetAnalytics}>↺ Reset</Btn>
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
                        {ins.action && <Btn size="sm" variant="ghost" onClick={() => setTab(ins.tab)} style={{ fontSize: 10, padding: "3px 8px", flexShrink: 0, color: ins.color }}>{ins.action}</Btn>}
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
                            {exam.vendor} · {exam.topic} · {exam.totalQuestions || 0} questions · {(exam.attempts || 0).toLocaleString()} attempts
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
              <div style={{ display: "flex", gap: 12, marginBottom: 18 }}>
                <Select value={selectedExamId} onChange={e => setSelectedExamId(e.target.value)} style={{ flex: 1 }}>
                  {exams.map(e => <option key={e.id} value={e.id}>{e.title} ({e.totalQuestions || 0} questions)</option>)}
                </Select>
                <Input placeholder="Search questions..." value={searchQ} onChange={e => setSearchQ(e.target.value)} prefix="🔍" style={{ flex: 1 }} />
              </div>
              {loadingQ ? (
                <div style={{ textAlign: "center", padding: 48 }}><Spinner size={32} color="var(--accent)" /></div>
              ) : filteredQ.length === 0 ? (
                <Empty icon="❓" title="No questions found" subtitle="Import questions using the Import tab" />
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {filteredQ.slice(0, 20).map((q, i) => (
                    <Card key={q.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, padding: "14px" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8, lineHeight: 1.5 }}>{i + 1}. {q.text}</div>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                          {q.domain && <Tag color="var(--accent)">{q.domain}</Tag>}
                          {q.type === "multi-select" && <Tag color="var(--gold)">Multi-select</Tag>}
                          <Tag color="var(--text3)">{q.options?.length || 0} options</Tag>
                        </div>
                      </div>
                      <Btn variant="danger" size="sm" onClick={() => delQuestion(q)}><Icon n="trash" size={13} /></Btn>
                    </Card>
                  ))}
                  {filteredQ.length > 20 && <div style={{ textAlign: "center", padding: 16, color: "var(--text3)", fontSize: 12 }}>Showing 20 of {filteredQ.length} questions</div>}
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
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
                <div style={{ position: "relative", flex: 1, minWidth: 220, maxWidth: 400 }}>
                  <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }}>🔍</span>
                  <input type="text" placeholder="Search users..." value={userSearch} onChange={e => setUserSearch(e.target.value)}
                    style={{ width: "100%", padding: "9px 14px 9px 36px", background: "var(--bg3)", border: "1.5px solid var(--border)", borderRadius: 11, color: "var(--text)", fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }}
                    onFocus={e => e.target.style.borderColor = "var(--accent)"} onBlur={e => e.target.style.borderColor = "var(--border)"} />
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <span style={{ fontSize: 12, color: "var(--text3)", background: "var(--bg3)", padding: "8px 14px", borderRadius: 99 }}>{users.length} total users</span>
                  <Btn variant="ghost" size="sm" onClick={exportUsersToExcel}><Icon n="download" size={14} /> Export</Btn>
                </div>
              </div>
              <Card>
                <div style={{ overflowX: "auto", border: "1.5px solid var(--border)", borderRadius: 12 }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: "var(--bg3)", borderBottom: "1.5px solid var(--border)" }}>
                        {["Name", "Email", "Role", "Country", "Joined", "Last Login", "Attempts", "Action"].map(h => (
                          <th key={h} style={{ padding: "12px 14px", textAlign: "left", color: "var(--text2)", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {users.filter(u => {
                        if (!userSearch.trim()) return true;
                        const q = userSearch.toLowerCase();
                        return (u.name || "").toLowerCase().includes(q) || (u.email || "").toLowerCase().includes(q);
                      }).slice(0, 20).map(u => {
                        const userAttempts = results.filter(r => r.userId === u.id).length;
                        return (
                          <tr key={u.id} style={{ borderBottom: "1px solid var(--border)", background: u.role === "admin" ? "rgba(217,119,6,0.04)" : "transparent", transition: "background 0.15s" }}
                            onMouseEnter={e => e.currentTarget.style.background = "var(--bg3)"}
                            onMouseLeave={e => e.currentTarget.style.background = u.role === "admin" ? "rgba(217,119,6,0.04)" : "transparent"}>
                            <td style={{ padding: "11px 14px" }}><div style={{ fontWeight: 600 }}>{u.name}</div></td>
                            <td style={{ padding: "11px 14px", color: "var(--text2)", fontSize: 12 }}>{u.email}</td>
                            <td style={{ padding: "11px 14px" }}><Tag color={u.role === "admin" ? "var(--gold)" : "var(--accent)"}>{u.role === "admin" ? "👑 Admin" : "Student"}</Tag></td>
                            <td style={{ padding: "11px 14px", fontSize: 11, color: "var(--text3)" }}>{u.country || "—"}</td>
                            <td style={{ padding: "11px 14px", fontSize: 11 }}>{new Date(u.createdAt?.toDate?.() || u.createdAt || Date.now()).toLocaleDateString()}</td>
                            <td style={{ padding: "11px 14px", fontSize: 11 }}>
                              {u.lastLogin || u.lastLoginDate ? (
                                <span style={{ color: "var(--green)", fontWeight: 600 }}>
                                  {new Date(u.lastLogin?.toDate?.() || u.lastLogin || u.lastLoginDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                </span>
                              ) : <span style={{ color: "var(--text3)" }}>Never</span>}
                            </td>
                            <td style={{ padding: "11px 14px" }}>
                              <span style={{ fontWeight: 700, color: userAttempts > 0 ? "var(--accent)" : "var(--text3)" }}>{userAttempts}</span>
                            </td>
                            <td style={{ padding: "11px 14px" }}>
                              <Btn variant="ghost" size="sm" onClick={() => toggleUserRole(u)}>{u.role === "admin" ? "Remove" : "Make"} Admin</Btn>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {users.length > 20 && <div style={{ textAlign: "center", padding: 12, fontSize: 12, color: "var(--text3)" }}>Showing 20 of {users.length} users</div>}
              </Card>
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
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 14, marginBottom: 24 }}>
                {[
                  { icon: "💰", label: "Total Revenue", value: "$0.00", color: "#059669", note: "PayPal not yet connected" },
                  { icon: "📅", label: "This Month", value: "$0.00", color: "#4f46e5", note: "Monthly earnings" },
                  { icon: "⏳", label: "Pending Payout", value: "$0.00", color: "#d97706", note: "Awaiting transfer" },
                  { icon: "🔄", label: "Transactions", value: "0", color: "#0891b2", note: "All time" },
                  { icon: "💳", label: "Subscriptions", value: "0", color: "#7c3aed", note: "Active plans" },
                  { icon: "📊", label: "ARPU", value: "$0.00", color: "#ef4444", note: "Avg revenue per user" },
                ].map((s, i) => (
                  <div key={i} style={{ background: "var(--bg2)", border: `1.5px solid ${s.color}22`, borderRadius: 16, padding: "20px 16px", position: "relative", overflow: "hidden" }}>
                    <div style={{ position: "absolute", top: 0, right: 0, width: 60, height: 60, borderRadius: "0 0 0 60px", background: `${s.color}08` }} />
                    <div style={{ fontSize: 24, marginBottom: 10 }}>{s.icon}</div>
                    <div style={{ fontSize: 26, fontWeight: 900, color: s.color, marginBottom: 4 }}>{s.value}</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text)", marginBottom: 2 }}>{s.label}</div>
                    <div style={{ fontSize: 10, color: "var(--text3)" }}>{s.note}</div>
                  </div>
                ))}
              </div>

              {/* PayPal integration banner */}
              <div style={{ background: "linear-gradient(135deg, rgba(0,112,240,0.08), rgba(0,168,255,0.04))", border: "1.5px solid rgba(0,112,240,0.25)", borderRadius: 20, padding: "28px 32px", marginBottom: 24, display: "flex", alignItems: "center", gap: 28, flexWrap: "wrap" }}>
                <div style={{ fontSize: 52 }}>🅿️</div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: "var(--text)", marginBottom: 8 }}>PayPal Integration — Ready to Connect</h3>
                  <p style={{ color: "var(--text2)", fontSize: 13, lineHeight: 1.7, marginBottom: 16, maxWidth: 560 }}>
                    The revenue system is fully architected. Once PayPal is activated, you will see real-time earnings, transaction history, payout schedules, and detailed financial analytics automatically.
                  </p>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {["💳 Accept Payments", "📊 Revenue Analytics", "💸 Auto Payouts", "🧾 Invoice Generation", "📱 Mobile Checkout", "🔒 Secure Processing"].map(f => (
                      <span key={f} style={{ fontSize: 11, fontWeight: 700, padding: "5px 12px", borderRadius: 99, background: "rgba(0,112,240,0.1)", color: "#0070F0", border: "1px solid rgba(0,112,240,0.25)" }}>{f}</span>
                    ))}
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10, minWidth: 180 }}>
                  <Btn style={{ background: "#0070F0", borderColor: "#0070F0" }}>🔗 Connect PayPal</Btn>
                  <Btn variant="ghost">📖 View Docs</Btn>
                </div>
              </div>

              {/* Revenue readiness checklist */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <AnalyticsPanel icon="✅" title="Payment Readiness Checklist">
                  {[
                    { done: true, label: "Revenue tab structure built" },
                    { done: true, label: "KPI cards configured" },
                    { done: true, label: "Transaction schema designed" },
                    { done: true, label: "Subscription tracking ready" },
                    { done: false, label: "PayPal SDK integration" },
                    { done: false, label: "Webhook handlers" },
                    { done: false, label: "Invoice generation" },
                    { done: false, label: "Payout automation" },
                  ].map((item, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: i < 7 ? "1px solid var(--border)" : "none" }}>
                      <span style={{ fontSize: 14 }}>{item.done ? "✅" : "⭕"}</span>
                      <span style={{ fontSize: 12, color: item.done ? "var(--text)" : "var(--text3)", fontWeight: item.done ? 600 : 400 }}>{item.label}</span>
                    </div>
                  ))}
                </AnalyticsPanel>

                <AnalyticsPanel icon="📈" title="Revenue Trend (Placeholder)">
                  <div style={{ height: 160, display: "flex", alignItems: "flex-end", gap: 5, marginBottom: 12 }}>
                    {["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].map((m, i) => (
                      <div key={m} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                        <div style={{ width: "100%", borderRadius: "3px 3px 0 0", background: "linear-gradient(to top, rgba(0,112,240,0.15), rgba(0,112,240,0.05))", border: "1px solid rgba(0,112,240,0.15)", height: `${20 + Math.sin(i) * 10 + 10}px` }} />
                        <span style={{ fontSize: 8, color: "var(--text3)", fontWeight: 600 }}>{m.substring(0,1)}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ textAlign: "center", fontSize: 12, color: "var(--text3)", background: "var(--bg3)", padding: "10px", borderRadius: 8 }}>
                    📡 Live revenue data will populate after PayPal connection
                  </div>
                </AnalyticsPanel>
              </div>
            </div>
          )}

          {/* ═══════════════ SETTINGS TAB ═══════════════ */}
          {tab === "settings" && (
            
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Platform Info */}
              <AnalyticsPanel icon="⚙️" title="Platform Settings" sub="Configure your ExamPro platform">
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  {[
                    { label: "Platform Name", value: "ExamPro", editable: true },
                    { label: "Admin Email", value: user?.email || "—", editable: false },
                    { label: "Total Exams", value: exams.length, editable: false },
                    { label: "Total Users", value: users.length, editable: false },
                    { label: "Database", value: "Firebase Firestore", editable: false },
                    { label: "Auth Provider", value: "Firebase Auth", editable: false },
                  ].map((s, i) => (
                    <div key={i} style={{ padding: "12px 14px", background: "var(--bg3)", borderRadius: 10 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>{s.label}</div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{s.value}</div>
                    </div>
                  ))}
                </div>
              </AnalyticsPanel>
<button onClick={deleteAllAnalyticsData} style={{
  background: "#dc2626",
  color: "white",
  border: "none",
  padding: "12px 20px",
  borderRadius: "12px",
  fontWeight: "bold",
  fontSize: "14px",
  cursor: "pointer",
  width: "100%",
  marginTop: "16px"
}}>
  🗑️ حذف كل النتائج والتقارير (Reset Analytics)
</button>
              {/* Firebase Usage Warning */}
              <div style={{ background: "linear-gradient(135deg, rgba(245,158,11,0.08), rgba(217,119,6,0.04))", border: "1.5px solid rgba(245,158,11,0.3)", borderRadius: 16, padding: "20px 24px" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                  <div style={{ fontSize: 28, flexShrink: 0 }}>🔥</div>
                  <div>
                    <h4 style={{ fontWeight: 800, marginBottom: 8, color: "var(--gold)" }}>Firebase Limit Protection Active</h4>
                    <p style={{ fontSize: 13, color: "var(--text2)", lineHeight: 1.6, marginBottom: 12 }}>
                      Data is loaded once on page mount and only refreshes when you click the <strong>"Refresh Data"</strong> button. This protects your Firebase free-tier read quota. The page does not auto-refresh.
                    </p>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {["✅ No auto-refresh", "✅ Manual refresh only", "✅ Batch loading", "✅ Error catching"].map(f => (
                        <span key={f} style={{ fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 99, background: "rgba(245,158,11,0.12)", color: "var(--gold)", border: "1px solid rgba(245,158,11,0.2)" }}>{f}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Data management */}
              <AnalyticsPanel icon="📦" title="Data Management">
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  <Btn variant="ghost" onClick={exportUsersToExcel}><Icon n="download" size={14} /> Export Users CSV</Btn>
                  <Btn variant="ghost" onClick={exportResultsToExcel}><Icon n="download" size={14} /> Export Results CSV</Btn>
                  <Btn variant="ghost" onClick={exportCountriesToExcel}><Icon n="download" size={14} /> Export Countries CSV</Btn>
                </div>
              </AnalyticsPanel>
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
      {showReportModal && selectedReport && (
        <Modal title="📋 Report Details" onClose={() => setShowReportModal(false)} maxWidth={700}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ background: "var(--bg3)", borderRadius: 10, padding: "14px" }}>
              <div style={{ fontSize: 12, color: "var(--text2)", marginBottom: 8 }}><strong>Exam:</strong> {exams.find(e => e.id === selectedReport.examId)?.title || "Deleted"}</div>
              <div style={{ fontSize: 12, color: "var(--text2)", marginBottom: 8 }}><strong>Student:</strong> {users.find(u => u.id === selectedReport.userId)?.name || "Deleted"}</div>
              <div style={{ fontSize: 12, color: "var(--text2)", marginBottom: 8 }}><strong>Email:</strong> {users.find(u => u.id === selectedReport.userId)?.email || "N/A"}</div>
              <div style={{ fontSize: 12, color: "var(--text3)" }}><strong>Date:</strong> {new Date(selectedReport.createdAt).toLocaleDateString()}</div>
            </div>
            <div style={{ background: "var(--bg3)", borderRadius: 10, padding: "14px" }}>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>❓ Question</div>
              <div style={{ fontSize: 13, color: "var(--text2)", lineHeight: 1.6 }}>{selectedReport.questionText}</div>
            </div>
            <div style={{ background: "var(--bg3)", borderRadius: 10, padding: "14px" }}>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>💬 Reported Issue</div>
              <div style={{ fontSize: 13, color: "var(--text2)", lineHeight: 1.6 }}>{selectedReport.feedback}</div>
            </div>
            {selectedReport.correctAnswer && (
              <div style={{ background: "rgba(34,197,94,0.08)", borderRadius: 10, padding: "14px" }}>
                <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8, color: "var(--green)" }}>✅ Correct Answer</div>
                <div style={{ fontSize: 13, color: "var(--text2)", lineHeight: 1.6 }}>{selectedReport.correctAnswer}</div>
              </div>
            )}
            {selectedReport.userAnswer && (
              <div style={{ background: "rgba(239,68,68,0.08)", borderRadius: 10, padding: "14px" }}>
                <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8, color: "var(--red)" }}>❌ Student's Answer</div>
                <div style={{ fontSize: 13, color: "var(--text2)", lineHeight: 1.6 }}>{selectedReport.userAnswer}</div>
              </div>
            )}
            <div style={{ display: "flex", gap: 10, flexDirection: "column" }}>
              {selectedReport.status === "pending" && (
                <>
                  <Btn full onClick={() => handleReportAction(selectedReport.id, "resolved")} style={{ background: "linear-gradient(135deg, var(--green), #047857)", borderColor: "transparent" }}>
                    <Icon n="check" size={14} /> Mark as Resolved
                  </Btn>
                  <Btn full variant="ghost" onClick={() => handleReportAction(selectedReport.id, "rejected")} style={{ color: "var(--red)" }}>
                    <Icon n="close" size={14} /> Reject Report
                  </Btn>
                </>
              )}
              <Btn full variant="danger" onClick={() => { deleteReportRecord(selectedReport.id); setShowReportModal(false); }}>
                <Icon n="trash" size={14} /> Delete Report
              </Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}