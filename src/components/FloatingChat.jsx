// components/FloatingChat.jsx — FlexExams Floating Support Widget
// ✅ استخدام React Portal لتثبيت position: fixed بغض النظر عن أي transform في الصفحة
// ✅ تم دمج التحسينات من add.jsx (classNames، تحسينات الشكل، توافق Firebase rules)
// ✅ إصلاح خطأ "Missing or insufficient permissions" عن طريق إزالة حقل source وإضافة type و userName

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "../hooks/useAuth";

const WA_NUMBER = "201111375050";
const WA_LINK = `https://wa.me/${WA_NUMBER}`;

const FAQS = [
  { q: "How do I enroll in an exam?", a: "Go to Exams page, find your exam, and click 'Enroll Now'. Some exams are free, others require a subscription." },
  { q: "Is there a free trial?", a: "Yes! You can access the first 10% of any exam without an account. No credit card required." },
  { q: "How are subscriptions priced?", a: "We offer monthly and yearly plans. Yearly subscribers get a free premium exam. Check the Exams page for pricing." },
  { q: "How does the certificate work?", a: "Once you pass an exam (score ≥ passing threshold), you instantly receive a verifiable digital certificate with a unique QR code." },
  { q: "Can I retake exams?", a: "Yes! Unlimited retakes are included. Each attempt randomizes questions for a fresh experience." },
  { q: "What certifications do you cover?", a: "We cover AWS, CompTIA, Cisco (CCNA/CCNP), PMP, Microsoft, and 50+ other IT and professional certifications." },
  { q: "How does the leaderboard work?", a: "Points are earned by completing exams and maintaining streaks. Top performers get featured and can win yearly subscriptions." },
  { q: "Can I use FlexExams on mobile?", a: "Yes! FlexExams is fully responsive and works great on any device. You can also install it as a PWA from your browser." },
  { q: "How do I reset my password?", a: "On the login page, click 'Forgot Password?' and enter your email. You'll receive a reset link within minutes." },
  { q: "Is my payment information secure?", a: "Yes. We use Stripe and PayPal — your payment data is never stored on our servers." },
  { q: "What is Instapay?", a: "Instapay is a local Egyptian payment option. After transferring, send your receipt to admin for manual approval." },
  { q: "How do I report a wrong question?", a: "During any exam, click the flag icon next to a question to submit a report. Our team reviews all reports promptly." },
  { q: "Does my subscription auto-renew?", a: "Auto-renew is off by default. You can enable it from your Dashboard → subscription settings." },
  { q: "How do I cancel my subscription?", a: "Go to Dashboard, find your active subscription, and click Cancel. Access continues until the end of the billing period." },
  { q: "What is the Career Diagnostic?", a: "It's a free assessment that analyzes your skill gaps and recommends the best certifications for your career goals." },
];

function IcoChat({ size = 22, color = "#fff" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}
function IcoWA({ size = 20, color = "#fff" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
    </svg>
  );
}
function IcoMail({ size = 18, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  );
}
function IcoX({ size = 16, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
function IcoSearch({ size = 14, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}
function IcoChevron({ size = 14, color = "currentColor", open }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round"
      style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function FAQItem({ item, index }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{
      border: "1px solid var(--border)",
      borderRadius: 12,
      overflow: "hidden",
      marginBottom: 6,
      transition: "all 0.2s",
      background: open ? "var(--bg3)" : "var(--bg2)",
    }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: "100%", border: "none", background: "none",
          padding: "12px 14px", display: "flex", alignItems: "center",
          justifyContent: "space-between", gap: 10, cursor: "pointer",
          fontFamily: "inherit",
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", textAlign: "left", lineHeight: 1.4 }}>
          {item.q}
        </span>
        <IcoChevron color="var(--text3)" open={open} />
      </button>
      {open && (
        <div style={{
          padding: "0 14px 12px",
          fontSize: 12.5, color: "var(--text2)", lineHeight: 1.7,
          borderTop: "1px solid var(--border)",
          paddingTop: 10,
        }}>
          {item.a}
        </div>
      )}
    </div>
  );
}

export default function FloatingChat() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState("faq");
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [toast, setToast] = useState(null);
  const [pulse, setPulse] = useState(false);
  const panelRef = useRef(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (user) {
      setForm(f => ({
        ...f,
        name: f.name || user?.displayName || "",
        email: f.email || user?.email || "",
      }));
    }
  }, [user]);

  useEffect(() => {
    const id = setInterval(() => {
      setPulse(true);
      setTimeout(() => setPulse(false), 1200);
    }, 30000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target) &&
        !e.target.closest("[data-floating-btn]")) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const filteredFAQs = search
    ? FAQS.filter(f => f.q.toLowerCase().includes(search.toLowerCase()) || f.a.toLowerCase().includes(search.toLowerCase()))
    : FAQS;

  const handleSend = async () => {
    if (!form.name || !form.email || !form.message) {
      showToast("Please fill in all required fields", "error");
      return;
    }
    setSending(true);
    try {
      const { collection, addDoc, serverTimestamp } = await import("firebase/firestore");
      const { db: fdb } = await import("../firebase");
      
      // ✅ التوافق مع قواعد Firebase للأمان (إزالة source، إضافة type و userName)
      await addDoc(collection(fdb, "contactMessages"), {
        name: form.name,
        email: form.email,
        subject: form.subject || "Support Request",
        type: "support",               // مطلوب في القاعدة
        message: form.message,
        userId: user?.uid || null,
        userName: user?.displayName || null, // مطلوب في القاعدة
        senderType: user?.uid ? "member" : "visitor",
        status: "unread",
        adminReply: null,
        repliedAt: null,
        createdAt: serverTimestamp(),
      });
      
      setSent(true);
      setForm(f => ({ ...f, subject: "", message: "" }));
      showToast("✅ Message sent! We'll reply soon.");
      setTimeout(() => setSent(false), 5000);
    } catch (e) {
      console.error("Firestore error:", e);
      showToast("❌ Failed to send: " + e.message, "error");
    } finally {
      setSending(false);
    }
  };

  const TABS = [
    { id: "faq", label: "FAQ", icon: "❓" },
    { id: "whatsapp", label: "WhatsApp", icon: "💬" },
    { id: "contact", label: "Contact", icon: "✉️" },
  ];

  const widgetContent = (
    <>
      {/* Floating Button */}
      <button
        data-floating-btn
        onClick={() => setOpen(o => !o)}
        title="Chat Support"
        style={{
          position: "fixed", bottom: 55, right: 28, zIndex: 9999,
          width: 58, height: 58, borderRadius: "50%",
          background: "var(--gradient-accent)",
          border: "none", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 8px 32px rgba(99,102,241,0.5)",
          transition: "all 0.3s cubic-bezier(0.16,1,0.3,1)",
          animation: pulse ? "fchat-ring 0.6s ease" : undefined,
        }}
      >
        {open ? <IcoX size={22} color="#fff" /> : <IcoChat size={24} color="#fff" />}
        {!open && (
          <span style={{
            position: "absolute", top: -4, right: -4,
            width: 18, height: 18, borderRadius: "50%",
            background: "#22c55e", border: "2px solid var(--bg)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 10, fontWeight: 800, color: "#fff",
          }}>?</span>
        )}
      </button>

      {/* Panel */}
      {open && (
        <div
          ref={panelRef}
          style={{
            position: "fixed", bottom: 98, right: 28, zIndex: 9998,
            width: 360, maxHeight: "min(520px, calc(100vh - 120px))",
            background: "var(--bg2)",
            border: "1.5px solid var(--border)",
            borderRadius: 20,
            boxShadow: "0 24px 64px rgba(0,0,0,0.3)",
            display: "flex", flexDirection: "column",
            overflow: "hidden",
            animation: "fchat-in 0.3s cubic-bezier(0.16,1,0.3,1) both",
          }}
        >
          {/* Header */}
          <div style={{
            padding: "16px 18px 12px",
            background: "var(--gradient-accent)",
            flexShrink: 0,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 12,
                background: "rgba(255,255,255,0.2)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <IcoChat size={20} color="#fff" />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#fff" }}>FlexExams Support</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.8)", display: "flex", alignItems: "center", gap: 5 }}>
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#4ade80", display: "inline-block" }} />
                  We're online — usually reply in minutes
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: 6, padding: "10px 14px", background: "var(--bg)", flexShrink: 0, borderBottom: "1px solid var(--border)" }}>
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={tab === t.id ? "fchat-tab-active" : ""}
                style={{
                  flex: 1, padding: "7px 4px", borderRadius: 10,
                  border: "1.5px solid var(--border)",
                  background: "var(--bg2)", color: "var(--text2)",
                  cursor: "pointer", fontSize: 11.5, fontWeight: 700,
                  fontFamily: "inherit", transition: "all 0.2s",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
                }}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="fchat-panel" style={{ flex: 1, overflowY: "auto", padding: 14 }}>

            {/* FAQ Tab */}
            {tab === "faq" && (
              <div>
                <div style={{ position: "relative", marginBottom: 12 }}>
                  <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }}>
                    <IcoSearch color="var(--text3)" />
                  </span>
                  <input
                    className="fchat-input"
                    style={{ paddingLeft: 30, width: "100%", boxSizing: "border-box", padding: "9px 12px", background: "var(--bg3)", border: "1.5px solid var(--border)", borderRadius: 10, color: "var(--text)", fontSize: 13, fontFamily: "inherit", outline: "none" }}
                    placeholder="Search questions…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>
                {filteredFAQs.length === 0 && (
                  <div style={{ textAlign: "center", padding: "24px 0", color: "var(--text3)", fontSize: 13 }}>
                    No results found. Try WhatsApp or Contact tab.
                  </div>
                )}
                {filteredFAQs.map((item, i) => (
                  <FAQItem key={i} item={item} index={i} />
                ))}
                <div style={{ textAlign: "center", padding: "12px 0 4px", fontSize: 12, color: "var(--text3)" }}>
                  Can't find your answer?{" "}
                  <button onClick={() => setTab("contact")} style={{ background: "none", border: "none", color: "var(--accent)", cursor: "pointer", fontWeight: 700, fontFamily: "inherit", fontSize: 12 }}>Contact us →</button>
                </div>
              </div>
            )}

            {/* WhatsApp Tab */}
            {tab === "whatsapp" && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "10px 0 6px", gap: 16 }}>
                <div style={{ width: 72, height: 72, borderRadius: 24, background: "linear-gradient(135deg,#25D366,#128C7E)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 12px 32px rgba(37,211,102,0.4)" }}>
                  <IcoWA size={38} color="#fff" />
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: "var(--text)", marginBottom: 6 }}>Chat on WhatsApp</div>
                  <div style={{ fontSize: 13, color: "var(--text2)", lineHeight: 1.6, maxWidth: 260, margin: "0 auto" }}>Get instant support from our team. We speak Arabic and English 🇪🇬🇬🇧</div>
                </div>
                <div style={{ background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 14, padding: "12px 20px", display: "flex", alignItems: "center", gap: 12, width: "100%", boxSizing: "border-box" }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: "linear-gradient(135deg,#25D366,#128C7E)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <IcoWA size={20} color="#fff" />
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: "var(--text3)", fontWeight: 600, marginBottom: 2 }}>FlexExams Support</div>
                    <div style={{ fontSize: 13.5, fontWeight: 800, color: "var(--text)" }}>+20 111 137 5050</div>
                  </div>
                </div>
                <div style={{ background: "rgba(37,211,102,0.08)", border: "1px solid rgba(37,211,102,0.3)", borderRadius: 10, padding: "10px 14px", fontSize: 12, color: "var(--text2)", lineHeight: 1.6, width: "100%", boxSizing: "border-box" }}>
                  <span style={{ fontWeight: 700, color: "#22c55e" }}>⏱ Response time:</span> Usually within 30 minutes during business hours (9AM–11PM Cairo)
                </div>
                <a href={WA_LINK} target="_blank" rel="noopener noreferrer" style={{ width: "100%", boxSizing: "border-box", padding: "13px 20px", background: "linear-gradient(135deg,#25D366,#128C7E)", border: "none", borderRadius: 14, color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, textDecoration: "none", boxShadow: "0 8px 24px rgba(37,211,102,0.4)", transition: "all 0.2s" }}>
                  <IcoWA size={20} color="#fff" />
                  Start WhatsApp Chat
                </a>
                <div style={{ fontSize: 11, color: "var(--text3)", textAlign: "center" }}>
                  Or send an email to{" "}
                  <a href="mailto:info@flexexams.com" style={{ color: "var(--accent)", textDecoration: "none", fontWeight: 600 }}>info@flexexams.com</a>
                </div>
              </div>
            )}

            {/* Contact Tab */}
            {tab === "contact" && (
              <div>
                {sent ? (
                  <div style={{ textAlign: "center", padding: "28px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
                    <div style={{ width: 64, height: 64, borderRadius: 20, background: "rgba(34,197,94,0.15)", border: "2px solid rgba(34,197,94,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>✅</div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: "var(--text)" }}>Message Sent!</div>
                    <div style={{ fontSize: 13, color: "var(--text2)", lineHeight: 1.6 }}>We'll get back to you soon. Check your notifications for our reply.</div>
                    <button onClick={() => setSent(false)} style={{ padding: "9px 20px", borderRadius: 10, background: "var(--bg3)", border: "1.5px solid var(--border)", color: "var(--text)", cursor: "pointer", fontSize: 13, fontFamily: "inherit", fontWeight: 600 }}>Send Another</button>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 2 }}>Send us a message</div>
                    <input className="fchat-input" placeholder="Your name *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={{ width: "100%", boxSizing: "border-box", padding: "9px 12px", background: "var(--bg3)", border: "1.5px solid var(--border)", borderRadius: 10, color: "var(--text)", fontSize: 13, fontFamily: "inherit", outline: "none" }} />
                    <input className="fchat-input" type="email" placeholder="Email address *" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} style={{ width: "100%", boxSizing: "border-box", padding: "9px 12px", background: "var(--bg3)", border: "1.5px solid var(--border)", borderRadius: 10, color: "var(--text)", fontSize: 13, fontFamily: "inherit", outline: "none" }} />
                    <input className="fchat-input" placeholder="Subject" value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} style={{ width: "100%", boxSizing: "border-box", padding: "9px 12px", background: "var(--bg3)", border: "1.5px solid var(--border)", borderRadius: 10, color: "var(--text)", fontSize: 13, fontFamily: "inherit", outline: "none" }} />
                    <textarea className="fchat-input" placeholder="Your message *" value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} rows={4} style={{ resize: "vertical", minHeight: 80, width: "100%", boxSizing: "border-box", padding: "9px 12px", background: "var(--bg3)", border: "1.5px solid var(--border)", borderRadius: 10, color: "var(--text)", fontSize: 13, fontFamily: "inherit", outline: "none" }} />
                    <button 
                      onClick={handleSend} 
                      disabled={sending} 
                      className="fchat-send-btn"
                      style={{ 
                        padding: "11px 20px", background: "var(--gradient-accent)", 
                        border: "none", borderRadius: 12, color: "#fff", fontSize: 13.5, 
                        fontWeight: 700, cursor: "pointer", fontFamily: "inherit", 
                        display: "flex", alignItems: "center", justifyContent: "center", 
                        gap: 8, transition: "all 0.2s", opacity: sending ? 0.6 : 1 
                      }}
                    >
                      <IcoMail size={16} color="#fff" />
                      {sending ? "Sending…" : "Send Message"}
                    </button>
                    <div style={{ fontSize: 11, color: "var(--text3)", textAlign: "center", lineHeight: 1.5 }}>Our team replies within 24 hours. Members get priority support.</div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", bottom: 100, right: 28, zIndex: 10000,
          background: toast.type === "error" ? "#ef4444" : "#22c55e",
          color: "#fff", borderRadius: 12,
          padding: "10px 16px", fontSize: 13, fontWeight: 600,
          boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
          animation: "fchat-in 0.3s ease both",
        }}>
          {toast.msg}
        </div>
      )}

      <style>{`
        @keyframes fchat-pulse { 0%,100% { box-shadow: 0 8px 32px rgba(99,102,241,0.5); } 50% { box-shadow: 0 8px 48px rgba(99,102,241,0.9), 0 0 0 8px rgba(99,102,241,0.15); } }
        @keyframes fchat-in { from { opacity:0; transform: scale(0.92) translateY(16px); } to { opacity:1; transform: scale(1) translateY(0); } }
        @keyframes fchat-ring { 0%,100% { transform: scale(1); } 40% { transform: scale(1.12); } 60% { transform: scale(0.97); } }
        .fchat-tab-active { background: var(--gradient-accent) !important; color: #fff !important; border-color: transparent !important; }
        .fchat-input:focus { border-color: var(--accent) !important; outline: none; }
        .fchat-send-btn:hover:not(:disabled) { opacity: 0.88; transform: translateY(-1px); }
        .fchat-send-btn:disabled { opacity: 0.6; cursor: wait; }
        .fchat-panel::-webkit-scrollbar { width: 4px; }
        .fchat-panel::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }
      `}</style>
    </>
  );

  if (!mounted) return null;
  return createPortal(widgetContent, document.body);
}