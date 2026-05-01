import React, { useState, useRef } from "react";
import { Input, Textarea, Btn, Icon } from "../components/UI";

// ── Contact method card ──
function ContactCard({ icon, label, value, sub, href, index }) {
  const [hovered, setHovered] = useState(false);
  return (
    <a
      href={href || "#"}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? "var(--bg3)" : "var(--bg2)",
        border: `1.5px solid ${hovered ? "var(--accent)" : "var(--border)"}`,
        borderRadius: 20,
        padding: "28px 24px",
        transition: "all 0.3s cubic-bezier(0.16,1,0.3,1)",
        transform: hovered ? "translateY(-4px)" : "none",
        boxShadow: hovered ? "0 20px 48px var(--accent-glow)" : "none",
        textDecoration: "none",
        display: "flex", flexDirection: "column", alignItems: "center",
        textAlign: "center",
        cursor: href ? "pointer" : "default",
        animation: `fadeUp 0.5s ${index * 100}ms both`,
      }}
    >
      <div style={{
        width: 56, height: 56, borderRadius: 18,
        background: hovered ? "var(--gradient-accent)" : "var(--bg3)",
        border: `1.5px solid ${hovered ? "transparent" : "var(--border)"}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        marginBottom: 16, transition: "all 0.3s",
        boxShadow: hovered ? "0 8px 24px var(--accent-glow)" : "none",
        color: hovered ? "#fff" : "var(--accent)",
      }}>
        {icon}
      </div>
      <div style={{ fontSize: 11, color: "var(--text3)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>
        {label}
      </div>
      <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 5 }}>
        {value}
      </div>
      <div style={{ fontSize: 12, color: "var(--text3)", lineHeight: 1.5 }}>{sub}</div>
    </a>
  );
}

// ── FAQ Accordion ──
function FAQItem({ q, a, index }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{
      border: `1.5px solid ${open ? "var(--accent)" : "var(--border)"}`,
      borderRadius: 16, overflow: "hidden",
      transition: "border-color 0.25s",
      animation: `fadeUp 0.5s ${index * 80}ms both`,
    }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: "100%", padding: "18px 24px",
          background: open ? "var(--accent-soft)" : "var(--bg2)",
          border: "none", cursor: "pointer",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          gap: 16, fontFamily: "inherit",
          transition: "background 0.25s",
        }}
      >
        <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", textAlign: "left" }}>{q}</span>
        <div style={{
          width: 28, height: 28, borderRadius: "50%",
          background: open ? "var(--gradient-accent)" : "var(--bg3)",
          border: `1px solid ${open ? "transparent" : "var(--border)"}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0, transition: "all 0.3s",
          transform: open ? "rotate(45deg)" : "none",
        }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={open ? "#fff" : "var(--text3)"} strokeWidth="3" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        </div>
      </button>
      {open && (
        <div style={{
          padding: "16px 24px 20px",
          background: "var(--bg2)",
          fontSize: 13.5, color: "var(--text2)", lineHeight: 1.8,
          borderTop: "1px solid var(--border)",
          animation: "expandIn 0.25s ease",
        }}>
          {a}
        </div>
      )}
    </div>
  );
}

export default function Contact({ showToast }) {
  const [form, setForm] = useState({ name: "", email: "", subject: "", type: "general", message: "" });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const upd = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.name || !form.email || !form.subject || !form.message) {
      showToast({ msg: "Please fill in all fields before sending", type: "warning" });
      return;
    }
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 900));
      showToast({ msg: "✅ Message sent! We'll get back to you within 24 hours.", type: "success" });
      setForm({ name: "", email: "", subject: "", type: "general", message: "" });
      setSent(true);
      setTimeout(() => setSent(false), 5000);
    } catch {
      showToast({ msg: "Something went wrong. Please try again.", type: "error" });
    }
    setLoading(false);
  };

  const contacts = [
    {
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
      label: "Email Support",
      value: "support@exampro.com",
      sub: "We reply within 24 hours on business days",
      href: "mailto:support@exampro.com",
    },
    {
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
      label: "Support Hours",
      value: "Mon – Fri, 9am – 6pm",
      sub: "GMT +0 · Typical response: under 12 hours",
    },
    {
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
      label: "Global Reach",
      value: "Serving 150+ Countries",
      sub: "Multi-language support coming in Q3 2025",
    },
    {
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
      label: "Live Chat",
      value: "Available In-App",
      sub: "Use the chat icon in the bottom right corner",
    },
  ];

  const faqs = [
    { q: "Are the practice questions up to date?", a: "Yes. Our question bank is reviewed every quarter by a team of certified professionals. Questions that no longer appear on official exams are removed and replaced. We update for every major exam version change within 30 days of official release." },
    { q: "Is FlexExams completely free to use?", a: "You can access a large selection of questions and take full practice exams for free without creating an account. Premium features like advanced analytics, certificate downloads, and unlimited exam history are available with a free account registration." },
    { q: "How does certificate verification work?", a: "Every certificate issued by FlexExams contains a unique ID and QR code. Anyone can scan the QR code or visit our verification page to confirm the certificate's authenticity, the holder's name, the exam passed, and the date of issue. Employers and hiring managers use this feature regularly." },
    { q: "Can I study on my phone or tablet?", a: "Absolutely. FlexExams is fully responsive and works on all modern devices. We're currently developing dedicated iOS and Android apps with offline exam support, launching later this year." },
    { q: "I found an error in a question — how do I report it?", a: "We take accuracy seriously. Use the flag icon next to any question during a practice session, or send us a message through this contact form with the question text and your concern. Our team reviews all flags within 48 hours." },
  ];

  const types = ["General Inquiry", "Technical Support", "Report an Error", "Partnership", "Feedback"];

  return (
    <div style={{ background: "var(--bg2)" }}>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        @keyframes expandIn { from { opacity:0; transform:scaleY(0.8); } to { opacity:1; transform:scaleY(1); } }
        @keyframes checkDraw { from { stroke-dashoffset: 100; } to { stroke-dashoffset: 0; } }

        /* Responsive fixes */
        @media (max-width: 768px) {
          .responsive-form-grid {
            grid-template-columns: 1fr !important;
            gap: 16px !important;
          }
          .contact-sidebar {
            margin-top: 24px;
          }
          .faq-container {
            padding: 0 16px;
          }
        }
        @media (max-width: 640px) {
          .hero-badge {
            font-size: 10px;
            padding: 4px 12px;
          }
          .contact-cards-grid {
            grid-template-columns: 1fr !important;
            gap: 12px !important;
          }
          .form-container {
            padding: 24px 20px !important;
          }
          .topic-buttons {
            gap: 6px;
          }
          .topic-buttons button {
            font-size: 11px;
            padding: 5px 10px;
          }
          .btn-send {
            width: 100%;
          }
          .send-status {
            width: 100%;
            justify-content: center;
          }
        }
        @media (max-width: 480px) {
          .hero-title {
            font-size: 28px !important;
          }
          .hero-sub {
            font-size: 14px;
          }
          .response-badge {
            flex-wrap: wrap;
            justify-content: center;
          }
          .quick-answers {
            padding: 20px 16px !important;
          }
        }
      `}</style>

      {/* ── Hero ── */}
      <div style={{
        background: "var(--gradient-accent)",
        padding: "72px 24px 56px",
        textAlign: "center",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", top: -100, right: "5%", width: 400, height: 400, borderRadius: "50%", background: "rgba(255,255,255,0.05)", pointerEvents: "none" }}/>
        <div style={{ position: "absolute", bottom: -80, left: "3%", width: 250, height: 250, borderRadius: "50%", background: "rgba(255,255,255,0.04)", pointerEvents: "none" }}/>

        <div style={{ maxWidth: 680, margin: "0 auto", position: "relative" }}>
          <div className="hero-badge" style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)",
            borderRadius: 99, padding: "6px 16px", marginBottom: 24,
            fontSize: 12, fontWeight: 700, color: "#fff", letterSpacing: "0.06em",
            textTransform: "uppercase",
            animation: "fadeUp 0.5s both",
          }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            We're Listening
          </div>

          <h1 className="hero-title" style={{
            fontSize: "clamp(32px, 5vw, 56px)",
            fontWeight: 900, marginBottom: 18,
            color: "#fff", letterSpacing: "-2px",
            fontFamily: "'Syne', sans-serif",
            lineHeight: 1.1,
            animation: "fadeUp 0.5s 100ms both",
          }}>
            Get in Touch<br/>
            <span style={{ opacity: 0.85 }}>with Our Team</span>
          </h1>

          <p className="hero-sub" style={{
            fontSize: 16, color: "rgba(255,255,255,0.88)", lineHeight: 1.8,
            maxWidth: 520, margin: "0 auto",
            animation: "fadeUp 0.5s 200ms both",
          }}>
            A question about an exam, a bug you found, an idea you want to share, or just saying 
            hi — every message reaches a real human who genuinely cares.
          </p>

          <div className="response-badge" style={{
            display: "inline-flex", alignItems: "center", gap: 10,
            background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)",
            borderRadius: 12, padding: "10px 20px", marginTop: 28,
            animation: "fadeUp 0.5s 300ms both",
          }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#4ade80", boxShadow: "0 0 8px #4ade80" }}/>
            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.9)", fontWeight: 600 }}>
              Average response time: <strong style={{ color: "#fff" }}>under 12 hours</strong>
            </span>
          </div>
        </div>
      </div>

      {/* ── Contact Cards ── */}
      <div style={{ maxWidth: 1100, margin: "-24px auto 0", padding: "0 24px" }}>
        <div className="contact-cards-grid" style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 16,
        }}>
          {contacts.map((c, i) => <ContactCard key={i} {...c} index={i} />)}
        </div>
      </div>

      {/* ── Main Section: Form + Sidebar ── */}
      <div style={{ maxWidth: 1100, margin: "48px auto 0", padding: "0 24px 80px" }}>
        <div className="responsive-form-grid" style={{
          display: "grid",
          gridTemplateColumns: "1fr 380px",
          gap: 32, alignItems: "flex-start",
        }}>

          {/* ── Form ── */}
          <div className="form-container" style={{
            background: "var(--bg2)",
            border: "1.5px solid var(--border)",
            borderRadius: 24, padding: "40px 36px",
            boxShadow: "var(--card-shadow)",
          }}>
            <div style={{ marginBottom: 28 }}>
              <h2 style={{
                fontSize: 22, fontWeight: 800,
                color: "var(--text)", marginBottom: 8,
                fontFamily: "'Syne', sans-serif",
              }}>
                Send Us a Message
              </h2>
              <p style={{ fontSize: 13.5, color: "var(--text3)", lineHeight: 1.6 }}>
                All fields are required. We read every single message personally.
              </p>
            </div>

            {/* Inquiry type selector */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text2)", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Topic
              </div>
              <div className="topic-buttons" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {types.map(t => (
                  <button
                    key={t}
                    onClick={() => setForm(p => ({ ...p, type: t }))}
                    style={{
                      padding: "7px 14px", borderRadius: 8,
                      border: `1.5px solid ${form.type === t ? "var(--accent)" : "var(--border)"}`,
                      background: form.type === t ? "var(--accent-soft)" : "var(--bg3)",
                      color: form.type === t ? "var(--accent)" : "var(--text3)",
                      fontSize: 12, fontWeight: 600, cursor: "pointer",
                      fontFamily: "inherit",
                      transition: "all 0.2s",
                    }}
                  >{t}</button>
                ))}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <Input label="Your Name" type="text" value={form.name} onChange={upd("name")} placeholder="Jane Smith" />
              <Input label="Email Address" type="email" value={form.email} onChange={upd("email")} placeholder="you@example.com" />
            </div>
            <Input label="Subject" type="text" value={form.subject} onChange={upd("subject")} placeholder="How can we help you?" />
            <Textarea label="Your Message" value={form.message} onChange={upd("message")} placeholder="Share as much detail as you'd like. The more context, the faster we can help." rows={6} />

            <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 8, flexWrap: "wrap" }}>
              <Btn className="btn-send" full size="lg" loading={loading} onClick={handleSubmit} style={{ justifyContent: "center", flex: 1 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                {loading ? "Sending…" : "Send Message"}
              </Btn>
              {sent && (
                <div className="send-status" style={{
                  display: "flex", alignItems: "center", gap: 8,
                  fontSize: 13, color: "#10b981", fontWeight: 600,
                  animation: "fadeUp 0.4s both",
                }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="30" strokeDashoffset="0" style={{ animation: "checkDraw 0.5s ease" }}>
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  Sent!
                </div>
              )}
            </div>

            <div style={{
              marginTop: 20, padding: "14px 16px",
              background: "var(--bg3)", borderRadius: 12,
              fontSize: 12.5, color: "var(--text3)", lineHeight: 1.6,
              display: "flex", gap: 10, alignItems: "flex-start",
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              Your information is kept private and never shared with third parties. We only use it to respond to your inquiry.
            </div>
          </div>

          {/* ── Sidebar ── */}
          <div className="contact-sidebar" style={{ display: "flex", flexDirection: "column", gap: 20 }}>

            {/* Quick answers */}
            <div className="quick-answers" style={{
              background: "var(--bg2)",
              border: "1.5px solid var(--border)",
              borderRadius: 20, padding: "28px 24px",
              boxShadow: "var(--card-shadow)",
            }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--text)", marginBottom: 6, fontFamily: "'Syne', sans-serif" }}>
                Quick Answers
              </h3>
              <p style={{ fontSize: 12.5, color: "var(--text3)", marginBottom: 18, lineHeight: 1.6 }}>
                Most questions are answered here before reaching our inbox.
              </p>
              {[
                { q: "Forgot password?", a: "Use 'Forgot Password' on the login page." },
                { q: "Download certificate?", a: "Go to My Exams → find your passed exam → Download Certificate." },
                { q: "Wrong score shown?", a: "Refresh your browser and check again. If persists, contact us." },
                { q: "Partnership inquiry?", a: "Email us directly at partnerships@exampro.com" },
              ].map(({ q, a }, i) => (
                <div key={i} style={{
                  padding: "12px 0",
                  borderBottom: i < 3 ? "1px solid var(--border)" : "none",
                }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 4 }}>{q}</div>
                  <div style={{ fontSize: 12.5, color: "var(--text3)" }}>{a}</div>
                </div>
              ))}
            </div>

            {/* Social links */}
            <div style={{
              background: "var(--bg2)",
              border: "1.5px solid var(--border)",
              borderRadius: 20, padding: "24px",
              boxShadow: "var(--card-shadow)",
            }}>
              <h3 style={{ fontSize: 14, fontWeight: 800, color: "var(--text)", marginBottom: 16, fontFamily: "'Syne', sans-serif" }}>
                Follow Us
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  { label: "Twitter / X", handle: "@ExamPro", icon: "𝕏" },
                  { label: "LinkedIn", handle: "ExamPro Official", icon: "in" },
                  { label: "YouTube", handle: "ExamPro Tutorials", icon: "▶" },
                ].map(({ label, handle, icon }) => (
                  <a key={label} href="#" style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "10px 14px", borderRadius: 10,
                    border: "1px solid var(--border)",
                    background: "var(--bg3)",
                    textDecoration: "none",
                    transition: "all 0.2s",
                  }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.background = "var(--accent-soft)"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.background = "var(--bg3)"; }}
                  >
                    <div style={{
                      width: 32, height: 32, borderRadius: 8,
                      background: "var(--gradient-accent)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 13, fontWeight: 700, color: "#fff", flexShrink: 0,
                    }}>{icon}</div>
                    <div>
                      <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text)" }}>{label}</div>
                      <div style={{ fontSize: 11.5, color: "var(--text3)" }}>{handle}</div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── FAQ Section ── */}
      <div style={{ background: "var(--bg)", padding: "80px 24px" }}>
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 52 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 14 }}>
              FAQ
            </div>
            <h2 style={{
              fontSize: "clamp(24px, 3vw, 38px)",
              fontWeight: 900, color: "var(--text)",
              fontFamily: "'Syne', sans-serif", letterSpacing: "-1px",
              marginBottom: 14,
            }}>
              Frequently Asked Questions
            </h2>
            <p style={{ fontSize: 15, color: "var(--text2)", lineHeight: 1.7 }}>
              Can't find what you're looking for? Send us a message above and we'll get back to you within 24 hours.
            </p>
          </div>
          <div className="faq-container" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {faqs.map((faq, i) => <FAQItem key={i} {...faq} index={i} />)}
          </div>
        </div>
      </div>
    </div>
  );
}