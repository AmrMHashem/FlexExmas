// Auth.jsx — FlexExams v6.0 — with Forgot Password + Reset Flow
import React, { useState, useEffect, useRef, useCallback, memo } from "react";
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail,
} from "firebase/auth";
import { useAuth } from "../hooks/useAuth";

import countries from "i18n-iso-countries";
import en from "i18n-iso-countries/langs/en.json";

countries.registerLocale(en);

const COUNTRIES = Object.entries(countries.getNames("en")).map(([code, name]) => ({
  code,
  name,
  flag: code.toUpperCase().replace(/./g, char =>
    String.fromCodePoint(127397 + char.charCodeAt())
  ),
}));

const getCountryFromIP = async () => {
  try {
    const response = await fetch("https://ipapi.co/json/");
    const data = await response.json();
    return data.country_code || "SA";
  } catch {
    return "SA";
  }
};

// ─── Icons ────────────────────────────────────────────────────────
const Icons = {
  user:        (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>),
  mail:        (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="4" width="20" height="16" rx="3"/><path d="m2 7 10 7 10-7"/></svg>),
  lock:        (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="11" width="18" height="11" rx="3"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>),
  eye:         (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>),
  eyeOff:      (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>),
  globe:       (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>),
  browse:      (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>),
  star:        (<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>),
  chart:       (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>),
  certificate: (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>),
  infinite:    (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 12c-2-2.5-4-4-6-4a4 4 0 0 0 0 8c2 0 4-1.5 6-4z"/><path d="M12 12c2 2.5 4 4 6 4a4 4 0 0 0 0-8c-2 0-4 1.5-6 4z"/></svg>),
  mobile:      (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="2" width="14" height="20" rx="2"/><circle cx="12" cy="17" r="1"/></svg>),
  back:        (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>),
  checkCircle: (<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><path d="M8 12l3 3 5-5"/></svg>),
  send:        (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>),
};

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

const benefits = [
  { icon: "star",        text: "500,000+ Questions — Master Every Topic",      color: "#F59E0B" },
  { icon: "chart",       text: "AI-Powered Analytics — Find Your Weak Spots",  color: "#6366F1" },
  { icon: "certificate", text: "Shareable Certificates — Show The World",       color: "#10B981" },
  { icon: "infinite",    text: "Unlimited Practice — No Caps, No Limits",       color: "#EC4899" },
  { icon: "mobile",      text: "Study Anywhere — Mobile-First Experience",      color: "#3B82F6" },
];

const benefitIcons = {
  star: Icons.star,
  chart: Icons.chart,
  certificate: Icons.certificate,
  infinite: Icons.infinite,
  mobile: Icons.mobile,
};

// Stable styles outside component
const INPUT_BASE_STYLE = {
  width: "100%",
  borderRadius: 12,
  fontSize: 14,
  outline: "none",
  fontFamily: "inherit",
  transition: "all 0.2s ease",
  boxSizing: "border-box",
  cursor: "text",
  pointerEvents: "auto",
};

const getInputStyle = (hasError, hasIcon = true, hasRight = false) => ({
  ...INPUT_BASE_STYLE,
  background: "var(--bg2)",
  border: `1.5px solid ${hasError ? "var(--red)" : "var(--border)"}`,
  color: "var(--text)",
  padding: `13px ${hasRight ? "46px" : "16px"} 13px ${hasIcon ? "46px" : "16px"}`,
});

const TOGGLE_BTN_STYLE = {
  position: "absolute",
  right: 14,
  top: "50%",
  transform: "translateY(-50%)",
  background: "none",
  border: "none",
  color: "var(--text3)",
  cursor: "pointer",
  padding: 4,
  display: "flex",
  alignItems: "center",
  zIndex: 2,
};

// Memoized FieldWrapper
const FieldWrapper = memo(({ icon, label, error, children, subLabel, htmlFor, onSubLabelClick }) => (
  <div style={{ marginBottom: 20 }}>
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
      <label htmlFor={htmlFor} style={{ fontSize: 12, fontWeight: 700, color: "var(--text2)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
        {label}
      </label>
      {subLabel && (
        <button
          type="button"
          onClick={onSubLabelClick}
          style={{
            fontSize: 11, color: "var(--accent)", fontWeight: 700,
            background: "none", border: "none", cursor: "pointer",
            padding: 0, fontFamily: "inherit",
            textDecoration: "underline", textUnderlineOffset: 2,
          }}
        >
          {subLabel}
        </button>
      )}
    </div>
    <div style={{ position: "relative" }}>
      {icon && (
        <div style={{
          position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)",
          color: error ? "var(--red)" : "var(--text3)",
          pointerEvents: "none", display: "flex", alignItems: "center", zIndex: 1,
        }}>
          {icon}
        </div>
      )}
      {children}
    </div>
    {error && (
      <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 6, fontSize: 12, color: "var(--red)" }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        {error}
      </div>
    )}
  </div>
));

// ParticleDots (stable)
const ParticleDots = memo(() => {
  const particles = [
    { left: "15%", top: "10%", dur: "12s", size: "6px" },
    { left: "85%", top: "20%", dur: "10s", size: "4px" },
    { left: "45%", top: "75%", dur: "14s", size: "5px" },
    { left: "10%", top: "85%", dur: "9s",  size: "3px" },
    { left: "70%", top: "45%", dur: "11s", size: "8px" },
    { left: "30%", top: "30%", dur: "13s", size: "4px" },
    { left: "90%", top: "70%", dur: "8s",  size: "5px" },
    { left: "5%",  top: "50%", dur: "15s", size: "6px" },
    { left: "60%", top: "15%", dur: "10s", size: "3px" },
    { left: "40%", top: "90%", dur: "12s", size: "7px" },
    { left: "75%", top: "60%", dur: "9s",  size: "4px" },
    { left: "20%", top: "40%", dur: "11s", size: "5px" },
  ];
  return (
    <div aria-hidden="true" style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
      {particles.map((p, i) => (
        <div key={i} style={{
          position: "absolute", left: p.left, top: p.top,
          width: p.size, height: p.size, borderRadius: "50%",
          background: "var(--accent)", opacity: 0,
          animation: `particleDrift ${p.dur} 0s ease-in-out infinite`,
          willChange: "transform, opacity",
        }} />
      ))}
    </div>
  );
});

// ─── Forgot Password Panel ────────────────────────────────────────
function ForgotPasswordPanel({ onBack, showToast }) {
  const [email, setEmail]         = useState("");
  const [sending, setSending]     = useState(false);
  const [sent, setSent]           = useState(false);
  const [error, setError]         = useState("");
  const inputRef                  = useRef(null);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 80);
  }, []);

  const handleSend = async () => {
    if (!email.trim()) { setError("Please enter your email address"); return; }
    if (!/\S+@\S+\.\S+/.test(email)) { setError("Invalid email address"); return; }

    setSending(true);
    setError("");
    try {
      const auth = getAuth();
      await sendPasswordResetEmail(auth, email.trim());
      setSent(true);
      showToast({ msg: "✉️ Password reset email sent!", type: "success" });
    } catch (err) {
      let msg = "Failed to send reset email";
      if (err.code === "auth/user-not-found")    msg = "No account found with this email";
      if (err.code === "auth/invalid-email")     msg = "Invalid email address";
      if (err.code === "auth/too-many-requests") msg = "Too many attempts. Please try again later";
      setError(msg);
      showToast({ msg: `❌ ${msg}`, type: "error" });
    }
    setSending(false);
  };

  return (
    <div className="form-animated" style={{ width: "100%", maxWidth: 448, position: "relative", zIndex: 1 }}>
      {/* Back button */}
      <button
        onClick={onBack}
        style={{
          display: "flex", alignItems: "center", gap: 6, marginBottom: 28,
          background: "none", border: "none", color: "var(--text2)",
          cursor: "pointer", fontSize: 13, fontWeight: 700, fontFamily: "inherit",
          padding: 0, transition: "color 0.2s",
        }}
        onMouseEnter={e => e.currentTarget.style.color = "var(--accent)"}
        onMouseLeave={e => e.currentTarget.style.color = "var(--text2)"}
      >
        {Icons.back} Back to Sign In
      </button>

      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <div style={{
          width: 72, height: 72, borderRadius: 20, margin: "0 auto 20px",
          background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 8px 32px rgba(99,102,241,0.35)",
        }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8">
            <rect x="3" y="11" width="18" height="11" rx="3"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </div>
        <h1 style={{ fontSize: "clamp(22px, 3vw, 28px)", fontWeight: 900, marginBottom: 8 }}>
          Reset Your <span style={{ color: "var(--accent)" }}>Password</span>
        </h1>
        <p style={{ color: "var(--text2)", fontSize: 14 }}>
          Enter your email and we'll send you a link to reset your password.
        </p>
      </div>

      {!sent ? (
        <div style={{ background: "var(--surface)", border: "1.5px solid var(--border)", borderRadius: 20, padding: 28 }}>
          {error && (
            <div style={{
              background: "rgba(239,68,68,0.08)", border: "1.5px solid rgba(239,68,68,0.3)",
              borderRadius: 12, padding: "12px 14px", fontSize: 13, color: "#EF4444",
              marginBottom: 18, display: "flex", alignItems: "center", gap: 8,
            }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </div>
          )}

          <FieldWrapper icon={Icons.mail} label="Email Address" error={""} htmlFor="reset-email">
            <input
              id="reset-email"
              ref={inputRef}
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); setError(""); }}
              onKeyDown={e => e.key === "Enter" && !sending && handleSend()}
              placeholder="you@example.com"
              style={getInputStyle(!!error)}
              autoComplete="email"
            />
          </FieldWrapper>

          <button
            onClick={handleSend}
            disabled={sending}
            style={{
              width: "100%", padding: "14px 24px",
              background: "var(--gradient-accent, var(--accent))",
              border: "none", borderRadius: 12, color: "#fff",
              fontSize: 15, fontWeight: 800, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              transition: "all 0.25s ease",
              boxShadow: "0 4px 20px var(--accent-glow, rgba(99,102,241,0.35))",
              opacity: sending ? 0.6 : 1,
            }}
          >
            {sending ? (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                  style={{ animation: "spin 0.8s linear infinite" }}>
                  <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                </svg>
                Sending…
              </>
            ) : (
              <>{Icons.send} Send Reset Link</>
            )}
          </button>

          <p style={{ textAlign: "center", fontSize: 12, color: "var(--text3)", marginTop: 16 }}>
            Check your spam folder if you don't see the email within a few minutes.
          </p>
        </div>
      ) : (
        /* ─── Success State ─── */
        <div style={{
          background: "var(--surface)", border: "1.5px solid rgba(16,185,129,0.35)",
          borderRadius: 20, padding: 36, textAlign: "center",
        }}>
          <div style={{ marginBottom: 20, display: "flex", justifyContent: "center" }}>
            <div style={{
              width: 80, height: 80, borderRadius: "50%",
              background: "rgba(16,185,129,0.1)",
              display: "flex", alignItems: "center", justifyContent: "center",
              animation: "scaleIn 0.4s cubic-bezier(0.16,1,0.3,1)",
            }}>
              {Icons.checkCircle}
            </div>
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 900, color: "var(--text)", marginBottom: 10 }}>
            Check Your Inbox!
          </h2>
          <p style={{ fontSize: 14, color: "var(--text2)", marginBottom: 6 }}>
            We've sent a password reset link to:
          </p>
          <div style={{
            background: "rgba(99,102,241,0.08)", border: "1.5px solid rgba(99,102,241,0.2)",
            borderRadius: 10, padding: "10px 16px", marginBottom: 24,
            fontSize: 14, fontWeight: 700, color: "var(--accent)",
          }}>
            {email}
          </div>
          <p style={{ fontSize: 12, color: "var(--text3)", marginBottom: 20, lineHeight: 1.7 }}>
            The link will expire in 1 hour. If you don't see it, check your spam folder or try again.
          </p>
          <div style={{ display: "flex", gap: 10, flexDirection: "column" }}>
            <button
              onClick={() => { setSent(false); setEmail(""); }}
              style={{
                padding: "12px 20px", background: "transparent",
                border: "1.5px solid var(--border)", borderRadius: 12,
                color: "var(--text2)", fontSize: 13, fontWeight: 700,
                cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s",
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.color = "var(--accent)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text2)"; }}
            >
              Try a Different Email
            </button>
            <button
              onClick={onBack}
              style={{
                padding: "12px 20px",
                background: "var(--gradient-accent, var(--accent))",
                border: "none", borderRadius: 12, color: "#fff",
                fontSize: 13, fontWeight: 800, cursor: "pointer",
                fontFamily: "inherit", transition: "all 0.2s",
                boxShadow: "0 4px 16px rgba(99,102,241,0.3)",
              }}
            >
              Back to Sign In
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Auth Component ───────────────────────────────────────────
export default function Auth({ setPage, showToast, initialMode, onAuthSuccess }) {
  const { login, register } = useAuth();
  const [mode, setMode]         = useState(initialMode === "register" ? "register" : "login");
  const [showForgot, setShowForgot] = useState(false);
  const [form, setForm]         = useState({ name: "", email: "", password: "", confirmPassword: "", country: "" });
  const [showPassword, setShowPassword]             = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors]     = useState({});
  const [loading, setLoading]   = useState(false);
  const [detectingCountry, setDetectingCountry] = useState(false);
  const [googleLoading, setGoogleLoading]       = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  const firstInputRef = useRef(null);
  const nameRef       = useRef(null);
  const emailRef      = useRef(null);

  // Detect country once
  useEffect(() => {
    let mounted = true;
    const detect = async () => {
      setDetectingCountry(true);
      const country = await getCountryFromIP();
      if (mounted) {
        const found = COUNTRIES.find(c => c.code === country);
        if (found) setForm(p => ({ ...p, country }));
        setDetectingCountry(false);
      }
    };
    detect();
    return () => { mounted = false; };
  }, []);

  // Password strength
  useEffect(() => {
    const pwd = form.password;
    let strength = 0;
    if (pwd.length >= 6)          strength++;
    if (pwd.length >= 10)         strength++;
    if (/[A-Z]/.test(pwd))        strength++;
    if (/[0-9]/.test(pwd))        strength++;
    if (/[^A-Za-z0-9]/.test(pwd)) strength++;
    setPasswordStrength(Math.min(4, strength));
  }, [form.password]);

  // Focus on mode change
  useEffect(() => {
    setTimeout(() => {
      if (mode === "register") nameRef.current?.focus();
      else emailRef.current?.focus();
    }, 50);
  }, [mode]);

  const upd = useCallback((field) => (e) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
    setErrors(prev => ({ ...prev, [field]: "" }));
  }, []);

  const handleKey = useCallback((e) => {
    if (e.key === "Enter" && !loading) submit();
  }, [loading]);

  const validate = useCallback(() => {
    const errs = {};
    if (mode === "register" && !form.name.trim()) errs.name = "Full name is required";
    if (!form.email.trim())                        errs.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email))    errs.email = "Invalid email address";
    if (!form.password)                            errs.password = "Password is required";
    else if (form.password.length < 6)             errs.password = "Minimum 6 characters";
    if (mode === "register" && form.password !== form.confirmPassword)
      errs.confirmPassword = "Passwords do not match";
    return errs;
  }, [mode, form.name, form.email, form.password, form.confirmPassword]);

  const submit = useCallback(async () => {
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    try {
      if (mode === "login") {
        const loggedUser = await login(form.email, form.password);
        const userName = loggedUser?.displayName || "Champion";
        showToast({ msg: `🎉 Welcome back, ${userName}!`, type: "success" });
        if (onAuthSuccess) onAuthSuccess(); else setPage("home");
      } else {
await register(form.email, form.password, form.name, form.country, null);
        showToast({ msg: `✨ Welcome aboard, ${form.name}!`, type: "success" });
        if (onAuthSuccess) onAuthSuccess(); else setPage("home");
      }
    } catch (err) {
      const code = err.code || "";
      let msg = "Something went wrong";
      if (code === "auth/user-not-found")      msg = "No account found with this email";
      else if (code === "auth/wrong-password") msg = "Incorrect password";
      else if (code === "auth/email-already-in-use") msg = "Email already registered";
      else if (code === "auth/weak-password")  msg = "Choose a stronger password";
      else if (code === "auth/invalid-credential") msg = "Invalid email or password";
      setErrors({ general: msg });
      showToast({ msg: `❌ ${msg}`, type: "error" });
    }
    setLoading(false);
  }, [mode, form, validate, login, register, showToast, setPage]);

const handleGoogleSignIn = useCallback(async () => {
  setGoogleLoading(true);
  try {
    const auth = getAuth();
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    const result = await signInWithPopup(auth, provider);
    const firebaseUser = result.user;
    
    // ✅ FIX: تحقق من وجود المستخدم في Firestore وأنشئه لو مش موجود
    try {
      const { doc, getDoc, setDoc, serverTimestamp } = await import("firebase/firestore");
      const { db } = await import("../firebase");
      const userRef = doc(db, "users", firebaseUser.uid);
      const snap = await getDoc(userRef);
      if (!snap.exists()) {
        // يوزر جديد سجل أول مرة بـ Google — أنشئ الـ profile
        const countryCode = await getCountryFromIP().catch(() => null);
        const found = countryCode ? COUNTRIES.find(c => c.code === countryCode) : null;
        await setDoc(userRef, {
          uid:          firebaseUser.uid,
          name:         firebaseUser.displayName || "User",
          email:        firebaseUser.email || "",
          role:         "student",
          country:      found ? found.name : "Unknown",
          countryCode:  countryCode || null,
          photoURL:     firebaseUser.photoURL || null,
          createdAt:    serverTimestamp(),
          favorites:    [],
          enrolledExams:[],
          stats:        { totalAttempts: 0, totalPassed: 0, averageScore: 0 },
        });
      }
    } catch (firestoreErr) {
      console.warn("[Auth] Could not create Firestore profile for Google user:", firestoreErr);
    }

    const userName = firebaseUser.displayName || "Champion";
    showToast({ msg: `🎉 Welcome, ${userName}!`, type: "success" });
    if (onAuthSuccess) onAuthSuccess(); else setPage("home");
  } catch (error) {
    const msg = error.code === "auth/popup-closed-by-user"
      ? "Sign-in popup was closed. Please try again."
      : "Google sign-in failed. Please try again.";
    setErrors({ general: msg });
    showToast({ msg: `❌ ${msg}`, type: "error" });
  }
  setGoogleLoading(false);
}, [showToast, setPage]);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
        .auth-root * { font-family: 'Plus Jakarta Sans', sans-serif; box-sizing: border-box; }
        @keyframes particleDrift {
          0%   { transform: translate(0, 0) scale(1); opacity: 0; }
          20%, 80% { opacity: 0.15; }
          50%  { transform: translate(25px, -35px) scale(1.3); }
          100% { transform: translate(0, 0) scale(1); opacity: 0; }
        }
        @keyframes orb-drift {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -20px) scale(1.1); }
          66% { transform: translate(-20px, 15px) scale(0.95); }
        }
        @keyframes formReveal {
          from { opacity: 0; transform: translateY(16px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes scaleIn { from { opacity:0; transform:scale(0.8); } to { opacity:1; transform:scale(1); } }

        .mode-tabs { display:flex; background:var(--bg2); border:1.5px solid var(--border); border-radius:14px; padding:4px; margin-bottom:28px; gap:4px; }
        .mode-tab { flex:1; padding:10px; border:none; border-radius:10px; font-size:13px; font-weight:700; cursor:pointer; transition:all 0.25s ease; background:transparent; color:var(--text2); }
        .mode-tab.active { background:var(--gradient-accent,var(--accent)); color:#fff; box-shadow:0 2px 12px var(--accent-glow,rgba(99,102,241,0.3)); }
        .mode-tab.inactive:hover { background:var(--bg3); color:var(--text); }

        .submit-btn { width:100%; padding:14px 24px; background:var(--gradient-accent,var(--accent)); border:none; border-radius:12px; color:#fff; font-size:15px; font-weight:800; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px; transition:all 0.25s ease; box-shadow:0 4px 20px var(--accent-glow,rgba(99,102,241,0.35)); margin-top:8px; }
        .submit-btn:hover:not(:disabled) { transform:translateY(-2px); box-shadow:0 8px 30px var(--accent-glow,rgba(99,102,241,0.5)); }
        .submit-btn:disabled { opacity:0.6; cursor:not-allowed; }

        .google-btn { width:100%; padding:13px 20px; background:var(--bg); border:1.5px solid var(--border); border-radius:12px; color:var(--text); font-size:14px; font-weight:700; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:10px; transition:all 0.25s ease; }
        .google-btn:hover:not(:disabled) { border-color:#4285F4; background:rgba(66,133,244,0.05); transform:translateY(-1px); }
        .google-btn:disabled { opacity:0.6; cursor:not-allowed; }

        .ghost-btn { width:100%; padding:11px 20px; background:transparent; border:1.5px solid var(--border); border-radius:12px; color:var(--text2); font-size:13px; font-weight:600; cursor:pointer; transition:all 0.2s ease; }
        .ghost-btn:hover { border-color:var(--accent); color:var(--accent); background:var(--accent-soft); }

        .benefit-item { display:flex; align-items:center; gap:14px; background:var(--bg); border:1.5px solid var(--border); border-radius:14px; padding:14px 16px; margin-bottom:10px; transition:all 0.25s ease; }
        .benefit-item:hover { border-color:var(--accent); background:var(--accent-soft); transform:translateX(-4px); }

        .stat-box { flex:1; text-align:center; background:var(--bg); border:1.5px solid var(--border); border-radius:14px; padding:16px 10px; }
        .or-divider { display:flex; align-items:center; gap:12px; margin:20px 0; color:var(--text3); font-size:12px; font-weight:600; text-transform:uppercase; }
        .or-divider::before,.or-divider::after { content:''; flex:1; height:1px; background:var(--border); }

        input:focus, select:focus { border-color:var(--accent) !important; box-shadow:0 0 0 3px var(--accent-glow,rgba(99,102,241,0.2)) !important; outline:none; }
        .form-animated { animation:formReveal 0.5s cubic-bezier(0.16,1,0.3,1) both; }
        .error-banner { background:rgba(239,68,68,0.08); border:1.5px solid rgba(239,68,68,0.3); border-radius:12px; padding:12px 14px; font-size:13px; color:#EF4444; margin-bottom:18px; display:flex; align-items:center; gap:8px; }

        @media (max-width:968px) { .auth-right-panel { display:none !important; } }
        .country-select { width:100%; padding:13px 16px 13px 46px; background:var(--bg2); border:1.5px solid var(--border); border-radius:12px; color:var(--text); font-size:14px; opacity:0.75; cursor:not-allowed; }
        .strength-bar { height:4px; border-radius:4px; background:#e5e7eb; }
      `}</style>

      <div className="auth-root" style={{ display: "flex", minHeight: "calc(100vh - 74px)", alignItems: "stretch" }}>

        {/* ── Left: Form ── */}
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "32px clamp(16px,5vw,48px)", position: "relative" }}>

          {showForgot ? (
            <ForgotPasswordPanel onBack={() => setShowForgot(false)} showToast={showToast} />
          ) : (
            <div className="form-animated" style={{ width: "100%", maxWidth: 448, position: "relative", zIndex: 1 }}>
              {/* Logo */}
              <div style={{ textAlign: "center", marginBottom: 32 }}>
                <img src="https://i.ibb.co/8gdkTHSp/login.png" alt="FlexExams Logo"
                  style={{ width: 80, height: 80, borderRadius: 22, marginBottom: 20, display: "inline" }} />
                <h1 style={{ fontSize: "clamp(24px,3.5vw,30px)", fontWeight: 900, marginBottom: 8 }}>
                  {mode === "login"
                    ? <>Welcome Back, <span style={{ color: "var(--accent)" }}>Champion</span></>
                    : <>Start Your <span style={{ color: "var(--accent)" }}>Journey</span> Today</>
                  }
                </h1>
                <p style={{ color: "var(--text2)", fontSize: 14 }}>
                  {mode === "login"
                    ? "Your goals are waiting — sign in and conquer them."
                    : "Join 100,000+ achievers on the path to certification success."}
                </p>
              </div>

              {/* Tabs */}
              <div className="mode-tabs">
                <button className={`mode-tab ${mode === "login" ? "active" : "inactive"}`}
                  onClick={() => { setMode("login"); setErrors({}); }}>Sign In</button>
                <button className={`mode-tab ${mode === "register" ? "active" : "inactive"}`}
                  onClick={() => { setMode("register"); setErrors({}); }}>Create Account</button>
              </div>

              {/* Form Card */}
              <div style={{ background: "var(--surface)", border: "1.5px solid var(--border)", borderRadius: 20, padding: 28, marginBottom: 12 }}>
                {errors.general && (
                  <div className="error-banner">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/>
                      <line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    {errors.general}
                  </div>
                )}

                {mode === "register" && (
                  <FieldWrapper icon={Icons.user} label="Full Name" error={errors.name} htmlFor="fullname">
                    <input
                      id="fullname" ref={nameRef} type="text"
                      value={form.name} onChange={upd("name")} onKeyDown={handleKey}
                      placeholder="Adam Smith" style={getInputStyle(!!errors.name)} autoComplete="name"
                    />
                  </FieldWrapper>
                )}

                <FieldWrapper icon={Icons.mail} label="Email Address" error={errors.email} htmlFor="email">
                  <input
                    id="email" ref={mode === "login" ? firstInputRef : emailRef}
                    type="email" value={form.email} onChange={upd("email")} onKeyDown={handleKey}
                    placeholder="you@example.com" style={getInputStyle(!!errors.email)} autoComplete="email"
                  />
                </FieldWrapper>

                <FieldWrapper
                  icon={Icons.lock} label="Password" error={errors.password} htmlFor="password"
                  subLabel={mode === "login" ? "Forgot Password?" : null}
                  onSubLabelClick={() => { setShowForgot(true); setErrors({}); }}
                >
                  <>
                    <input
                      id="password" type={showPassword ? "text" : "password"}
                      value={form.password} onChange={upd("password")} onKeyDown={handleKey}
                      placeholder="••••••••" style={getInputStyle(!!errors.password, true, true)}
                      autoComplete={mode === "login" ? "current-password" : "new-password"}
                    />
                    <button type="button" onClick={() => setShowPassword(v => !v)} style={TOGGLE_BTN_STYLE}>
                      {showPassword ? Icons.eyeOff : Icons.eye}
                    </button>
                    {mode === "register" && form.password && (
                      <div style={{ marginTop: 8 }}>
                        <div className="strength-bar">
                          <div style={{
                            width: `${(passwordStrength / 4) * 100}%`,
                            background: passwordStrength < 2 ? "#EF4444" : passwordStrength < 3 ? "#F59E0B" : "#10B981",
                            height: 4, borderRadius: 4, transition: "width 0.3s ease",
                          }} />
                        </div>
                        <p style={{ fontSize: 10, color: "var(--text2)", marginTop: 4 }}>
                          Password strength: {["Very weak", "Weak", "Medium", "Strong", "Very strong"][passwordStrength]}
                        </p>
                      </div>
                    )}
                  </>
                </FieldWrapper>

                {mode === "register" && (
                  <>
                    <FieldWrapper icon={Icons.lock} label="Confirm Password" error={errors.confirmPassword} htmlFor="confirmPassword">
                      <input
                        id="confirmPassword" type={showConfirmPassword ? "text" : "password"}
                        value={form.confirmPassword} onChange={upd("confirmPassword")} onKeyDown={handleKey}
                        placeholder="••••••••" style={getInputStyle(!!errors.confirmPassword, true, true)}
                        autoComplete="new-password"
                      />
                      <button type="button" onClick={() => setShowConfirmPassword(v => !v)} style={TOGGLE_BTN_STYLE}>
                        {showConfirmPassword ? Icons.eyeOff : Icons.eye}
                      </button>
                    </FieldWrapper>

                    <FieldWrapper icon={Icons.globe} label={`Country ${detectingCountry ? "(detecting…)" : ""}`} htmlFor="country">
                      <select id="country" value={form.country} disabled className="country-select">
                        {COUNTRIES.map(c => (
                          <option key={c.code} value={c.code}>{c.flag} {c.name}</option>
                        ))}
                      </select>
                    </FieldWrapper>
                  </>
                )}

                <button className="submit-btn" onClick={submit} disabled={loading}>
                  {loading ? (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                        style={{ animation: "spin 0.8s linear infinite" }}>
                        <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                      </svg>
                      Processing…
                    </>
                  ) : (
                    <>
                      {mode === "login" ? "Sign In & Dominate" : "Create My Free Account"}
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="m5 12 14 0M13 6l6 6-6 6"/>
                      </svg>
                    </>
                  )}
                </button>
              </div>

              <div className="or-divider"><span>or continue with</span></div>
              <button className="google-btn" onClick={handleGoogleSignIn} disabled={googleLoading} style={{ marginBottom: 10 }}>
                {googleLoading ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                    style={{ animation: "spin 0.8s linear infinite" }}>
                    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                  </svg>
                ) : <GoogleIcon />}
                Continue with Google — One Click
              </button>
              <button className="ghost-btn" onClick={() => setPage("exams")}>
                {Icons.browse} Explore Without Signing In
              </button>
            </div>
          )}
        </div>

        {/* ── Right: Benefits Panel ── */}
        <div className="auth-right-panel" style={{
          flex: 1, background: "var(--bg2)",
          borderLeft: "1.5px solid var(--border)",
          padding: "40px 36px", position: "relative", overflow: "hidden",
        }}>
          <div style={{ position: "absolute", top: "-80px", right: "-80px", width: 360, height: 360, borderRadius: "50%", background: "radial-gradient(circle, var(--accent-soft), transparent 70%)", animation: "orb-drift 14s ease-in-out infinite", pointerEvents: "none" }} />
          <div style={{ position: "absolute", bottom: "-60px", left: "-60px", width: 260, height: 260, borderRadius: "50%", background: "radial-gradient(circle, rgba(124,58,237,0.12), transparent 70%)", animation: "orb-drift 10s ease-in-out infinite reverse", pointerEvents: "none" }} />
          <ParticleDots />
          <div style={{ textAlign: "center", position: "relative", zIndex: 1 }}>
            <div style={{ marginBottom: 24 }}>
              <img src="https://i.ibb.co/DPztDcgx/Chat-GPT-Image-Apr-26-2026-09-45-41-PM.png" alt="FlexExams"
                style={{ height: 100, objectFit: "cover", display: "inline" }} />
            </div>
            <h3 style={{ fontSize: 28, fontWeight: 900, marginBottom: 10 }}>
              Study Smarter.<br /><span style={{ color: "var(--accent)" }}>Achieve Faster.</span>
            </h3>
            <p style={{ marginBottom: 28, fontSize: 14 }}>
              FlexExams is engineered around your ambitions — adaptive practice, real-world certifications, and a community of 100K+ driven professionals.
            </p>
            {benefits.map((b, i) => (
              <div key={i} className="benefit-item">
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: `${b.color}18`, border: `1.5px solid ${b.color}40`,
                  display: "flex", alignItems: "center", justifyContent: "center", color: b.color,
                }}>
                  {benefitIcons[b.icon]}
                </div>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{b.text}</span>
              </div>
            ))}
            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              {[
                { value: "500K+", label: "Questions" },
                { value: "100K+", label: "Learners"  },
                { value: "4.9★",  label: "Rating"    },
              ].map((s, i) => (
                <div key={i} className="stat-box">
                  <div style={{ fontSize: 20, fontWeight: 900, color: "var(--accent)" }}>{s.value}</div>
                  <div style={{ fontSize: 11, color: "var(--text2)", fontWeight: 600, marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
