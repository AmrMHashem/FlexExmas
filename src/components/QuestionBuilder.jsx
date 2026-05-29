// components/QuestionBuilder.jsx
// ✅ FIXED: Question add/refresh, async race condition, HTML text validation
import React, { useState, useRef, useCallback, useEffect } from "react";
import { db } from "../firebase";
import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  orderBy,
  increment,
} from "firebase/firestore";

// ─── Icons ───────────────────────────────────────────────────────
const I = ({ n, s = 16, c = "currentColor" }) => {
  const m = {
    plus:   <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
    trash:  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>,
    check:  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>,
    save:   <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>,
    image:  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>,
    bold:   <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round"><path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/></svg>,
    italic: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round"><line x1="19" y1="4" x2="10" y2="4"/><line x1="14" y1="20" x2="5" y2="20"/><line x1="15" y1="4" x2="9" y2="20"/></svg>,
    code:   <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>,
    x:      <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
    drag:   <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2"><circle cx="9" cy="5" r="1" fill={c}/><circle cx="9" cy="12" r="1" fill={c}/><circle cx="9" cy="19" r="1" fill={c}/><circle cx="15" cy="5" r="1" fill={c}/><circle cx="15" cy="12" r="1" fill={c}/><circle cx="15" cy="19" r="1" fill={c}/></svg>,
    info:   <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
    refresh:<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round"><path d="M21 2v6h-6"/><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M3 22v-6h6"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/></svg>,
  };
  return m[n] || null;
};

// ─── Helpers ─────────────────────────────────────────────────────
const EMPTY_OPTION = () => ({ id: Date.now() + Math.random(), text: "", isCorrect: false, imageUrl: "" });

const EMPTY_QUESTION = () => ({
  text:        "",
  type:        "single",
  options:     [EMPTY_OPTION(), EMPTY_OPTION(), EMPTY_OPTION(), EMPTY_OPTION()],
  explanation: "",
  domain:      "",
  difficulty:  "medium",
  imageUrl:    "",
});

/**
 * ✅ FIX: Strip HTML tags and check if meaningful text exists.
 * Prevents empty rich-editor content from passing validation.
 */
const htmlToPlainText = (html) => {
  if (!html) return "";
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
};

/**
 * ✅ FIX: Direct Firestore fetch for questions by examId.
 * This bypasses any caching issues in the parent component.
 */
const fetchQuestionsByExamId = async (examId) => {
  const q = query(
    collection(db, "questions"),
    where("examId", "==", examId),
    orderBy("createdAt", "asc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

// ─── Rich Text Toolbar ────────────────────────────────────────────
function RichToolbar({ onFormat, onImagePaste }) {
  return (
    <div style={{ display: "flex", gap: 4, padding: "6px 10px", background: "var(--bg3)", borderBottom: "1px solid var(--border)", borderRadius: "10px 10px 0 0", flexWrap: "wrap" }}>
      {[
        { cmd: "bold",                icon: "bold",   title: "Bold (Ctrl+B)"   },
        { cmd: "italic",              icon: "italic", title: "Italic (Ctrl+I)" },
        { cmd: "insertUnorderedList", icon: null,     title: "Bullet List", label: "•≡" },
        { cmd: "insertOrderedList",   icon: null,     title: "Numbered List", label: "1≡" },
        { cmd: "formatBlock_code",    icon: "code",   title: "Code block" },
      ].map(({ cmd, icon, title, label }) => (
        <button
          key={cmd}
          onMouseDown={(e) => { e.preventDefault(); onFormat(cmd); }}
          title={title}
          style={{ padding: "4px 8px", borderRadius: 6, border: "none", background: "transparent", color: "var(--text2)", cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", gap: 3, transition: "background 0.15s" }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "var(--border)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          {icon ? <I n={icon} s={13} /> : label}
        </button>
      ))}
      <button
        onMouseDown={(e) => { e.preventDefault(); onImagePaste(); }}
        title="Insert Image"
        style={{ padding: "4px 8px", borderRadius: 6, border: "none", background: "transparent", color: "var(--accent)", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 12, transition: "background 0.15s" }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "var(--accent-soft)")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
      >
        <I n="image" s={13} /> Add Image
      </button>
    </div>
  );
}

// ─── Rich Textarea ────────────────────────────────────────────────
function RichEditor({ value, onChange, placeholder, minHeight = 80 }) {
  const editorRef = useRef(null);
  const fileRef   = useRef(null);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || "";
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleInput = () => {
    if (editorRef.current) onChange(editorRef.current.innerHTML);
  };

  const handleFormat = (cmd) => {
    if (cmd === "formatBlock_code") {
      document.execCommand("formatBlock", false, "pre");
    } else {
      document.execCommand(cmd, false, null);
    }
    editorRef.current?.focus();
    onChange(editorRef.current?.innerHTML || "");
  };

  const handlePaste = (e) => {
    const items = e.clipboardData?.items || [];
    for (const item of items) {
      if (item.type.startsWith("image/")) {
        e.preventDefault();
        const file   = item.getAsFile();
        const reader = new FileReader();
        reader.onload = (ev) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement("canvas");
            const MAX    = 900;
            const ratio  = Math.min(MAX / img.width, MAX / img.height, 1);
            canvas.width  = Math.round(img.width  * ratio);
            canvas.height = Math.round(img.height * ratio);
            canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
            const compressed = canvas.toDataURL("image/jpeg", 0.82);
            document.execCommand("insertImage", false, compressed);
            onChange(editorRef.current?.innerHTML || "");
          };
          img.src = ev.target.result;
        };
        reader.readAsDataURL(file);
        return;
      }
    }
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain");
    document.execCommand("insertText", false, text);
  };

  const triggerImageUpload = () => fileRef.current?.click();

  const handleImageFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      editorRef.current?.focus();
      document.execCommand("insertImage", false, ev.target.result);
      onChange(editorRef.current?.innerHTML || "");
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  return (
    <div
      style={{ border: "1.5px solid var(--border)", borderRadius: 10, background: "var(--bg2)", overflow: "hidden", transition: "border-color 0.2s" }}
      onFocusCapture={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
      onBlurCapture={(e)  => (e.currentTarget.style.borderColor = "var(--border)")}
    >
      <RichToolbar onFormat={handleFormat} onImagePaste={triggerImageUpload} />
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onPaste={handlePaste}
        data-placeholder={placeholder}
        style={{
          minHeight,
          padding: "12px 14px",
          outline: "none",
          fontSize: 14,
          lineHeight: 1.6,
          color: "var(--text)",
          overflowY: "auto",
        }}
      />
      <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleImageFile} />
      <style>{`[contenteditable]:empty:before{content:attr(data-placeholder);color:var(--text3);pointer-events:none}`}</style>
    </div>
  );
}

// ─── Single Option Row ────────────────────────────────────────────
function OptionRow({ opt, idx, type, onChange, onDelete, onToggleCorrect, totalOptions }) {
  return (
    <div style={{
      display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 12px",
      borderRadius: 10, border: `1.5px solid ${opt.isCorrect ? "rgba(16,185,129,0.5)" : "var(--border)"}`,
      background: opt.isCorrect ? "rgba(16,185,129,0.05)" : "var(--bg2)",
      transition: "all 0.2s", marginBottom: 8,
    }}>
      <div style={{ color: "var(--text3)", cursor: "grab", paddingTop: 3, flexShrink: 0 }}>
        <I n="drag" s={14} />
      </div>

      <button
        onClick={() => onToggleCorrect(opt.id)}
        title={type === "multi" ? "Toggle correct answer" : "Set as correct answer"}
        style={{
          width: 20, height: 20,
          borderRadius: type === "multi" ? 6 : "50%",
          border: `2px solid ${opt.isCorrect ? "#10b981" : "var(--border)"}`,
          background: opt.isCorrect ? "#10b981" : "transparent",
          cursor: "pointer", flexShrink: 0, marginTop: 2,
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "all 0.2s",
        }}
      >
        {opt.isCorrect && <I n="check" s={11} c="#fff" />}
      </button>

      <div style={{ fontSize: 12, fontWeight: 800, color: opt.isCorrect ? "var(--green)" : "var(--text3)", flexShrink: 0, paddingTop: 3, minWidth: 16 }}>
        {String.fromCharCode(65 + idx)}
      </div>

      <div style={{ flex: 1 }}>
        <RichEditor
          value={opt.text}
          onChange={(html) => onChange(opt.id, "text", html)}
          placeholder={`Option ${String.fromCharCode(65 + idx)}…`}
          minHeight={36}
        />
        {opt.imageUrl && (
          <div style={{ marginTop: 6 }}>
            <img src={opt.imageUrl} alt="" style={{ maxWidth: "100%", maxHeight: 120, borderRadius: 6, border: "1px solid var(--border)" }} />
          </div>
        )}
      </div>

      {totalOptions > 2 && (
        <button
          onClick={() => onDelete(opt.id)}
          style={{ background: "none", border: "none", color: "var(--text3)", cursor: "pointer", padding: 4, display: "flex", flexShrink: 0, transition: "color 0.2s" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--red)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text3)")}
        >
          <I n="x" s={14} />
        </button>
      )}
    </div>
  );
}

// ─── Question Form ────────────────────────────────────────────────
function QuestionForm({ question, onChange, onSave, onCancel, saving }) {
  const updateOption = useCallback((optId, field, value) => {
    onChange({
      ...question,
      options: question.options.map((o) => (o.id === optId ? { ...o, [field]: value } : o)),
    });
  }, [question, onChange]);

  const toggleCorrect = useCallback((optId) => {
    if (question.type === "single") {
      onChange({
        ...question,
        options: question.options.map((o) => ({ ...o, isCorrect: o.id === optId })),
      });
    } else {
      onChange({
        ...question,
        options: question.options.map((o) =>
          o.id === optId ? { ...o, isCorrect: !o.isCorrect } : o
        ),
      });
    }
  }, [question, onChange]);

  const addOption = useCallback(() => {
    onChange({ ...question, options: [...question.options, EMPTY_OPTION()] });
  }, [question, onChange]);

  const deleteOption = useCallback((optId) => {
    onChange({ ...question, options: question.options.filter((o) => o.id !== optId) });
  }, [question, onChange]);

  const correctCount = question.options.filter((o) => o.isCorrect).length;

  // ✅ FIX: Use htmlToPlainText to correctly validate rich editor content
  const isValid = htmlToPlainText(question.text).length > 0 && correctCount > 0;

  const inputStyle = {
    width: "100%", padding: "10px 14px", borderRadius: 10,
    border: "1.5px solid var(--border)", background: "var(--bg2)",
    color: "var(--text)", fontSize: 13, fontFamily: "inherit",
    outline: "none", boxSizing: "border-box", transition: "border-color 0.2s",
  };

  return (
    <div style={{ background: "var(--bg2)", border: "1.5px solid var(--border)", borderRadius: 16, padding: "20px 22px", marginBottom: 14 }}>

      {/* Type + Domain + Difficulty */}
      <div style={{ display: "grid", gridTemplateColumns: "auto 1fr 1fr", gap: 12, marginBottom: 16 }}>
        <div>
          <label style={{ fontSize: 10, fontWeight: 800, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.07em", display: "block", marginBottom: 6 }}>Type</label>
          <div style={{ display: "flex", gap: 6 }}>
            {[{ id: "single", label: "Single", icon: "○" }, { id: "multi", label: "Multi", icon: "☑" }].map((t) => (
              <button
                key={t.id}
                onClick={() => onChange({ ...question, type: t.id })}
                style={{ padding: "7px 14px", borderRadius: 8, border: `1.5px solid ${question.type === t.id ? "var(--accent)" : "var(--border)"}`, background: question.type === t.id ? "rgba(99,102,241,0.1)" : "transparent", color: question.type === t.id ? "var(--accent)" : "var(--text2)", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s" }}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label style={{ fontSize: 10, fontWeight: 800, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.07em", display: "block", marginBottom: 6 }}>Domain / Topic</label>
          <input value={question.domain} onChange={(e) => onChange({ ...question, domain: e.target.value })} placeholder="e.g. Networking, Security…" style={inputStyle} />
        </div>

        <div>
          <label style={{ fontSize: 10, fontWeight: 800, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.07em", display: "block", marginBottom: 6 }}>Difficulty</label>
          <select value={question.difficulty} onChange={(e) => onChange({ ...question, difficulty: e.target.value })} style={{ ...inputStyle }}>
            <option value="easy">🟢 Easy</option>
            <option value="medium">🟡 Medium</option>
            <option value="hard">🔴 Hard</option>
          </select>
        </div>
      </div>

      {/* Question Text */}
      <div style={{ marginBottom: 14 }}>
        <label style={{ fontSize: 10, fontWeight: 800, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.07em", display: "block", marginBottom: 6 }}>
          Question Text *
          {question.type === "multi" && (
            <span style={{ marginLeft: 8, color: "var(--gold)", fontSize: 10, fontWeight: 700, textTransform: "none" }}>
              ☑ Multi-select — mark all correct answers
            </span>
          )}
        </label>
        <RichEditor
          value={question.text}
          onChange={(html) => onChange({ ...question, text: html })}
          placeholder="Enter your question here… You can paste images directly (Ctrl+V)"
          minHeight={80}
        />
      </div>

      {/* Options */}
      <div style={{ marginBottom: 14 }}>
        <label style={{ fontSize: 10, fontWeight: 800, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.07em", display: "block", marginBottom: 8 }}>
          Answer Options
          <span style={{ marginLeft: 8, color: correctCount > 0 ? "var(--green)" : "var(--red)", fontWeight: 700, textTransform: "none" }}>
            {correctCount === 0 ? "⚠ Mark at least one correct answer" : `✔ ${correctCount} correct`}
          </span>
        </label>

        {question.options.map((opt, idx) => (
          <OptionRow
            key={opt.id}
            opt={opt}
            idx={idx}
            type={question.type}
            onChange={updateOption}
            onDelete={deleteOption}
            onToggleCorrect={toggleCorrect}
            totalOptions={question.options.length}
          />
        ))}

        {question.options.length < 8 && (
          <button
            onClick={addOption}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", background: "transparent", border: "1.5px dashed var(--border)", borderRadius: 10, color: "var(--text3)", cursor: "pointer", fontSize: 12, fontWeight: 700, fontFamily: "inherit", transition: "all 0.2s", width: "100%", justifyContent: "center" }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.color = "var(--accent)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text3)"; }}
          >
            <I n="plus" s={14} /> Add Option
          </button>
        )}
      </div>

      {/* Explanation */}
      <div style={{ marginBottom: 18 }}>
        <label style={{ fontSize: 10, fontWeight: 800, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.07em", display: "block", marginBottom: 6 }}>
          Explanation (shown after answering)
        </label>
        <RichEditor
          value={question.explanation}
          onChange={(html) => onChange({ ...question, explanation: html })}
          placeholder="Explain why the correct answer(s) are correct… (optional)"
          minHeight={60}
        />
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <button
          onClick={onCancel}
          style={{ padding: "10px 20px", background: "transparent", border: "1.5px solid var(--border)", borderRadius: 10, color: "var(--text2)", fontWeight: 700, cursor: "pointer", fontSize: 13, fontFamily: "inherit" }}
        >
          Cancel
        </button>
        <button
          onClick={onSave}
          disabled={!isValid || saving}
          style={{
            padding: "10px 24px",
            background: isValid ? "linear-gradient(135deg,#6366f1,#8b5cf6)" : "rgba(99,102,241,0.3)",
            border: "none", borderRadius: 10, color: "#fff", fontWeight: 800,
            cursor: isValid ? "pointer" : "not-allowed", fontSize: 13, fontFamily: "inherit",
            display: "flex", gap: 7, alignItems: "center",
            boxShadow: isValid ? "0 4px 14px rgba(99,102,241,0.4)" : "none",
            transition: "all 0.2s",
          }}
        >
          {saving ? (
            <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: "spin 0.8s linear infinite" }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg> Saving…</>
          ) : (
            <><I n="save" s={14} c="#fff" /> Save Question</>
          )}
        </button>
      </div>
    </div>
  );
}

// ─── Main Question Builder Panel ──────────────────────────────────
export default function QuestionBuilder({ examId, examTitle, existingQuestions = [], onRefresh, onQuestionsChange, showToast }) {
  const [questions, setQuestions] = useState(existingQuestions);
  const [showForm,  setShowForm]  = useState(false);
  const [editingQ,  setEditingQ]  = useState(null);
  const [formData,  setFormData]  = useState(EMPTY_QUESTION());
  const [saving,    setSaving]    = useState(false);
  const [searchQ,   setSearchQ]   = useState("");
  const [deleting,  setDeleting]  = useState({});
  const [refreshing, setRefreshing] = useState(false);

  // ✅ FIX: Sync from parent prop changes (e.g. exam switcher)
  useEffect(() => {
    setQuestions(existingQuestions);
  }, [existingQuestions]);

  // ✅ FIX: Internal refresh — fetches directly from Firestore,
  // bypassing any stale parent state, then also notifies parent.
  const refreshQuestions = useCallback(async (silent = false) => {
    if (!examId) return;
    if (!silent) setRefreshing(true);
    try {
      const qs = await fetchQuestionsByExamId(examId);
      setQuestions(qs);
      // Also update parent so its count/state stays in sync
      onRefresh?.();
      // ✅ NEW: notify App to re-fetch exams so cards show updated totalQuestions
      onQuestionsChange?.();
    } catch (err) {
      if (!silent) showToast({ msg: `❌ Failed to refresh: ${err.message}`, type: "error" });
    } finally {
      if (!silent) setRefreshing(false);
    }
  }, [examId, onRefresh, onQuestionsChange, showToast]);

  const filteredQ = questions.filter((q) => {
    if (!searchQ.trim()) return true;
    const qs = searchQ.toLowerCase();
    return (q.text || "").toLowerCase().includes(qs) || (q.domain || "").toLowerCase().includes(qs);
  });

  const openNew = () => {
    setEditingQ(null);
    setFormData(EMPTY_QUESTION());
    setShowForm(true);
    setTimeout(() => document.getElementById("qbuilder-top")?.scrollIntoView({ behavior: "smooth" }), 50);
  };

  const openEdit = (q) => {
    setEditingQ(q);
    setFormData({
      text:        q.text        || "",
      type:        q.type        || "single",
      options:     (q.options    || []).map((o) => ({ ...o, id: o.id || Date.now() + Math.random() })),
      explanation: q.explanation || "",
      domain:      q.domain      || "",
      difficulty:  q.difficulty  || "medium",
      imageUrl:    q.imageUrl    || "",
    });
    setShowForm(true);
  };

  // ✅ FIX: Fully awaited save, then local refresh from Firestore
  const handleSave = async () => {
    if (!examId) {
      showToast({ msg: "❌ No exam selected", type: "error" });
      return;
    }

    // ✅ FIX: Validate using plain-text extraction (not raw HTML)
    const plainText     = htmlToPlainText(formData.text);
    const correctOptions = formData.options.filter((o) => o.isCorrect);

    if (plainText.length === 0 || correctOptions.length === 0) {
      showToast({ msg: "❌ Question text and at least one correct answer are required", type: "error" });
      return;
    }

    setSaving(true);
    try {
      // ✅ Build correct[] array — IDs of correct options (used by Quiz.jsx)
      const correctIds = formData.options
        .map((o, i) => (o.isCorrect ? String(i) : null))
        .filter(Boolean);

      const qData = {
        text: formData.text,
        type: formData.type,
        options: formData.options.map((o, i) => ({
          id:        String(i),
          text:      o.text,
          isCorrect: o.isCorrect,
          imageUrl:  o.imageUrl || "",
        })),
        // ✅ FIX: Save as BOTH "answer" AND "correct" so Quiz.jsx works correctly
        answer:  correctIds,
        correct: correctIds,
        explanation: formData.explanation,
        domain:      formData.domain,
        difficulty:  formData.difficulty,
        examId,
        updatedAt: serverTimestamp(),
      };

      if (editingQ?.id) {
        // ── UPDATE existing question ──
        await updateDoc(doc(db, "questions", editingQ.id), qData);
        showToast({ msg: "✅ Question updated", type: "success" });
      } else {
        // ── CREATE new question ──
        qData.createdAt = serverTimestamp();
        const docRef = await addDoc(collection(db, "questions"), qData);
        console.log("✅ New question created with ID:", docRef.id);

        // ✅ FIX: Update totalQuestions counter on the exam document
        try {
          await updateDoc(doc(db, "exams", examId), {
            totalQuestions: increment(1),
            updatedAt: serverTimestamp(),
          });
        } catch (counterErr) {
          console.warn("⚠️ Could not update totalQuestions counter:", counterErr.message);
        }

        showToast({ msg: "✅ Question added", type: "success" });
      }

      // ✅ FIX: Close form first, then refresh — avoids race condition
      setShowForm(false);
      setFormData(EMPTY_QUESTION());
      setEditingQ(null);

      // ✅ FIX: Refresh directly from Firestore (not relying on parent re-render)
      await refreshQuestions(true);

    } catch (e) {
      console.error("❌ Save question error:", e);
      showToast({ msg: `❌ ${e.message}`, type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (q) => {
    if (!window.confirm("Delete this question? This cannot be undone.")) return;
    setDeleting((p) => ({ ...p, [q.id]: true }));
    try {
      await deleteDoc(doc(db, "questions", q.id));
      // ✅ FIX: Also decrement totalQuestions on the exam document
      try {
        await updateDoc(doc(db, "exams", q.examId || examId), {
          totalQuestions: increment(-1),
          updatedAt: serverTimestamp(),
        });
      } catch (counterErr) {
        console.warn("⚠️ Could not update totalQuestions counter on delete:", counterErr.message);
      }
      // Optimistic UI update + background parent sync
      setQuestions((prev) => prev.filter((x) => x.id !== q.id));
      showToast({ msg: "✅ Question deleted", type: "success" });
      onRefresh?.();
      // ✅ NEW: notify App to re-fetch exams so cards show updated totalQuestions
      onQuestionsChange?.();
    } catch (e) {
      showToast({ msg: `❌ ${e.message}`, type: "error" });
    } finally {
      setDeleting((p) => ({ ...p, [q.id]: false }));
    }
  };

  return (
    <div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div id="qbuilder-top" />

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 900, color: "var(--text)" }}>{examTitle || "Question Bank"}</div>
          <div style={{ fontSize: 12, color: "var(--text3)" }}>{questions.length} questions total</div>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {/* Search */}
          <input
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            placeholder="Search questions…"
            style={{ padding: "9px 14px", borderRadius: 10, border: "1.5px solid var(--border)", background: "var(--bg2)", color: "var(--text)", fontSize: 13, fontFamily: "inherit", outline: "none", width: 200 }}
          />
          {/* ✅ Manual refresh button */}
          <button
            onClick={() => refreshQuestions(false)}
            disabled={refreshing}
            title="Refresh questions"
            style={{ padding: "9px 12px", background: "var(--bg2)", border: "1.5px solid var(--border)", borderRadius: 10, color: "var(--text2)", cursor: "pointer", display: "flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 700, fontFamily: "inherit", opacity: refreshing ? 0.6 : 1 }}
          >
            <I n="refresh" s={14} c={refreshing ? "var(--accent)" : "currentColor"} style={refreshing ? { animation: "spin 1s linear infinite" } : {}} />
            {refreshing ? "…" : "Refresh"}
          </button>
          <button
            onClick={openNew}
            style={{ padding: "9px 18px", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", border: "none", borderRadius: 10, color: "#fff", fontWeight: 800, cursor: "pointer", fontSize: 13, fontFamily: "inherit", display: "flex", gap: 6, alignItems: "center", boxShadow: "0 4px 14px rgba(99,102,241,0.35)" }}
          >
            <I n="plus" s={14} c="#fff" /> Add Question
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap" }}>
        {[
          { label: "Total",        value: questions.length,                                         color: "var(--accent)" },
          { label: "Single",       value: questions.filter((q) => q.type !== "multi").length,       color: "var(--text2)"  },
          { label: "Multi-Select", value: questions.filter((q) => q.type === "multi").length,       color: "var(--gold)"   },
          { label: "Easy",         value: questions.filter((q) => q.difficulty === "easy").length,  color: "var(--green)"  },
          { label: "Hard",         value: questions.filter((q) => q.difficulty === "hard").length,  color: "var(--red)"    },
        ].map((s, i) => (
          <div key={i} style={{ background: "var(--bg2)", border: "1.5px solid var(--border)", borderRadius: 10, padding: "8px 14px", display: "flex", gap: 6, alignItems: "center" }}>
            <span style={{ fontSize: 16, fontWeight: 900, color: s.color }}>{s.value}</span>
            <span style={{ fontSize: 11, color: "var(--text3)", fontWeight: 600 }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Question Form */}
      {showForm && (
        <div style={{ marginBottom: 20, border: "2px solid rgba(99,102,241,0.3)", borderRadius: 18, padding: 20, background: "rgba(99,102,241,0.02)" }}>
          <div style={{ fontSize: 14, fontWeight: 900, color: "var(--accent)", marginBottom: 14 }}>
            {editingQ ? "✏️ Edit Question" : "➕ New Question"}
          </div>
          <QuestionForm
            question={formData}
            onChange={setFormData}
            onSave={handleSave}
            onCancel={() => { setShowForm(false); setEditingQ(null); setFormData(EMPTY_QUESTION()); }}
            saving={saving}
          />
        </div>
      )}

      {/* Question List */}
      {filteredQ.length === 0 ? (
        <div style={{ padding: "48px 20px", textAlign: "center", background: "var(--bg2)", border: "1.5px dashed var(--border)", borderRadius: 14 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>❓</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text2)", marginBottom: 8 }}>
            {searchQ ? "No questions match your search" : "No questions yet"}
          </div>
          {!searchQ && (
            <button
              onClick={openNew}
              style={{ padding: "10px 22px", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", border: "none", borderRadius: 10, color: "#fff", fontWeight: 800, cursor: "pointer", fontSize: 13, fontFamily: "inherit" }}
            >
              Add First Question →
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filteredQ.map((q, i) => {
            const plainText   = htmlToPlainText(q.text || "").slice(0, 120);
            const correctOpts = (q.options || []).filter((o) => o.isCorrect);
            return (
              <div
                key={q.id}
                style={{ background: "var(--bg2)", border: "1.5px solid var(--border)", borderRadius: 12, padding: "14px 16px", display: "flex", gap: 12, alignItems: "flex-start" }}
              >
                <div style={{ fontSize: 12, fontWeight: 900, color: "var(--text3)", minWidth: 28, paddingTop: 2, textAlign: "center" }}>{i + 1}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 6, lineHeight: 1.5 }}>
                    {plainText}{plainText.length >= 120 ? "…" : ""}
                  </div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 100, background: q.type === "multi" ? "rgba(245,158,11,0.12)" : "rgba(99,102,241,0.1)", color: q.type === "multi" ? "var(--gold)" : "var(--accent)" }}>
                      {q.type === "multi" ? "☑ Multi-Select" : "○ Single"}
                    </span>
                    {q.domain && (
                      <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 100, background: "var(--bg3)", color: "var(--text3)" }}>{q.domain}</span>
                    )}
                    {q.difficulty && (
                      <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 100, background: q.difficulty === "hard" ? "rgba(239,68,68,0.1)" : q.difficulty === "easy" ? "rgba(16,185,129,0.1)" : "rgba(245,158,11,0.1)", color: q.difficulty === "hard" ? "var(--red)" : q.difficulty === "easy" ? "var(--green)" : "var(--gold)" }}>
                        {q.difficulty}
                      </span>
                    )}
                    <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 100, background: "rgba(16,185,129,0.08)", color: "var(--green)" }}>
                      ✔ {correctOpts.length} correct
                    </span>
                    {q.explanation && (
                      <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 100, background: "rgba(100,116,139,0.08)", color: "var(--text3)" }}>📝 Explanation</span>
                    )}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                  <button
                    onClick={() => openEdit(q)}
                    style={{ padding: "6px 12px", background: "var(--accent-soft)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--accent)", cursor: "pointer", fontSize: 11, fontWeight: 700, fontFamily: "inherit" }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(q)}
                    disabled={deleting[q.id]}
                    style={{ padding: "6px 10px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, color: "var(--red)", cursor: "pointer", display: "flex", alignItems: "center" }}
                  >
                    {deleting[q.id] ? "…" : <I n="trash" s={13} c="var(--red)" />}
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