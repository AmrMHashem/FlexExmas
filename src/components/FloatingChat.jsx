import React, { useState, useRef, useEffect } from "react";

const KNOWLEDGE_BASE = [
  { q: ["certificate","cert","certification","diploma"], a: "🏆 **Earn a certificate** after passing the **Exam Simulation** mode with your target score (usually 70%+). The certificate is generated as a PDF with your name, exam title, score, and date. You can download and share it on LinkedIn. Only Exam Simulation mode earns certificates." },
  { q: ["price","cost","free","paid","subscription","premium"], a: "✅ **ExamPro is completely free!** All exams, all features, unlimited attempts. No hidden costs, no premium tier. Create a free account to get instant access." },
  { q: ["register","sign up","account","signup","create account"], a: "📝 **Create an account in 30 seconds**: Click **Sign Up Free**, enter your name/email/password, verify your email. You'll instantly get full access to all exams, progress tracking, and certificates." },
  { q: ["exam","quiz","test","questions","practice"], a: "📚 **3 study modes**: (1) **Exam Simulation** — timed, randomized, realistic, earns certificate; (2) **Full Practice Set** — all questions in order with timer; (3) **Review Mode** — set your own passing score & time, see answers instantly." },
  { q: ["pass","score","grade","passing","fail","failed"], a: "🎯 **Default passing score is 70%** for most exams. In Review Mode you can customize this. Only Exam Simulation mode triggers certificate eligibility." },
  { q: ["time","timer","duration","minutes"], a: "⏱️ **Each exam has a time limit** shown on the exam detail page (typically 60–120 min). Exam Simulation and Full Practice are timed. In Review Mode, you set your own time limit." },
  { q: ["favorite","bookmark","save","star","favourite"], a: "⭐ **Add exams to favorites**: Click the **☆ star button** on any exam card. Access them anytime from **My Exams > Favorites** tab. Your favorites sync across all devices." },
  { q: ["dashboard","my exams","profile","history","progress"], a: "📊 **Your Dashboard shows**: All attempts, scores, pass/fail status, topic breakdown, study time, certificates earned, and performance trends. Access it after signing in from the navbar." },
  { q: ["vendor","provider","aws","azure","google","cisco","oracle"], a: "🌐 **We cover all major certification vendors**: AWS, Microsoft Azure, Google Cloud, Cisco, Oracle, CompTIA, PMI, Linux Foundation, and more. Browse by vendor in the navbar." },
  { q: ["contact","support","help","email","question","issue"], a: "📬 **Need help?** Check our FAQ or contact us at **support@exampro.pro**. Our team responds within 24 hours. You can also reach us through the **Contact** page in the navbar." },
  { q: ["retake","attempt again","redo","restart"], a: "🔄 **Retake any exam unlimited times!** Each attempt creates a new result entry. Your best score is tracked automatically. Perfect for improving weak areas." },
  { q: ["progress","save","resume"], a: "💾 **Your progress auto-saves** every question. If you leave an exam, you can resume from where you left off. Once you finish, results are permanent." },
];

function getAnswer(msg) {
  const lower = msg.toLowerCase();
  for (const item of KNOWLEDGE_BASE) {
    if (item.q.some(k => lower.includes(k))) return item.a;
  }
  return null;
}

function renderText(text) {
  return text.split(/\*\*(.*?)\*\*/g).map((part, i) =>
    i % 2 === 1
      ? <strong key={i} style={{ color: "var(--accent)", fontWeight: 800 }}>{part}</strong>
      : part
  );
}

export default function FloatingChat({ setPage, showToast }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "bot", text: "👋 **Hi there!** I'm ExamPro's AI assistant. Ask me anything about exams, certificates, pricing, or how the platform works. I'm here to help!" }
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 200);
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [open, messages]);

  const send = async () => {
    const msg = input.trim();
    if (!msg) return;
    setInput("");
    setMessages(m => [...m, { role: "user", text: msg }]);
    setTyping(true);

    await new Promise(r => setTimeout(r, 900 + Math.random() * 500));

    const answer = getAnswer(msg);
    setTyping(false);

    if (answer) {
      setMessages(m => [...m, { role: "bot", text: answer }]);
    } else {
      setMessages(m => [...m, {
        role: "bot",
        text: "🤔 **I'm not sure about that one!** Here's how to reach our team:\n\n📧 **support@exampro.pro**\n📝 **Contact page** in the navbar\n\nWould you like me to open the Contact page?",
        action: { label: "Open Contact Page", page: "contact" }
      }]);
    }
  };

  const handleKey = e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setOpen(o => !o)}
        title="Chat with ExamPro Assistant"
        style={{
          position: "fixed", bottom: 28, right: 28, zIndex: 200,
          width: 60, height: 60, borderRadius: "50%",
          background: "var(--gradient-accent)",
          border: "none", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 26,
          boxShadow: "0 8px 32px var(--accent-glow)",
          transition: "all 0.3s cubic-bezier(0.16,1,0.3,1)",
          animation: open ? "none" : "chatBounce 4s ease-in-out infinite 3s",
        }}
        onMouseEnter={e => e.currentTarget.style.transform = "scale(1.12) translateY(-2px)"}
        onMouseLeave={e => e.currentTarget.style.transform = ""}
      >
        {open ? "✕" : "💬"}
      </button>

      {/* Chat Window */}
      {open && (
        <div style={{
          position: "fixed", bottom: 100, right: 28, zIndex: 199,
          width: "clamp(320px, 90vw, 400px)",
          background: "var(--surface)",
          border: "1.5px solid var(--border)",
          borderRadius: 20,
          boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
          display: "flex", flexDirection: "column",
          maxHeight: "70vh",
          animation: "scale-in 0.3s cubic-bezier(0.16,1,0.3,1)",
          overflow: "hidden",
        }}>
          {/* Header */}
          <div style={{
            padding: "16px 20px",
            background: "var(--gradient-accent)",
            display: "flex", alignItems: "center", gap: 12,
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: "50%",
              background: "rgba(255,255,255,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 20,
            }}>🎓</div>
            <div>
              <div style={{ fontWeight: 800, color: "#fff", fontSize: 14 }}>ExamPro Assistant</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.8)", display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#10b981", display: "inline-block" }}></span>
                Online & Ready
              </div>
            </div>
          </div>

          {/* Messages */}
          <div style={{
            flex: 1, overflowY: "auto", padding: "16px",
            display: "flex", flexDirection: "column", gap: 12,
          }}>
            {messages.map((m, i) => (
              <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", animation: "messageIn 0.3s ease-out" }}>
                <div style={{
                  maxWidth: "82%",
                  padding: "10px 14px",
                  borderRadius: m.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                  background: m.role === "user" ? "var(--gradient-accent)" : "var(--bg3)",
                  color: m.role === "user" ? "#fff" : "var(--text)",
                  fontSize: 13, lineHeight: 1.65, fontWeight: 400,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}>
                  {renderText(m.text)}
                  {m.action && (
                    <button
                      onClick={() => { setPage(m.action.page); setOpen(false); }}
                      style={{
                        display: "block", marginTop: 10,
                        padding: "7px 14px", borderRadius: 8,
                        background: "var(--accent)", border: "none",
                        color: "#fff", fontSize: 12, fontWeight: 700,
                        cursor: "pointer", fontFamily: "inherit",
                        transition: "all 0.2s",
                      }}
                      onMouseEnter={e => e.currentTarget.style.opacity = "0.8"}
                      onMouseLeave={e => e.currentTarget.style.opacity = "1"}
                    >
                      {m.action.label} →
                    </button>
                  )}
                </div>
              </div>
            ))}
            {typing && (
              <div style={{ display: "flex", gap: 5, padding: "10px 14px", background: "var(--bg3)", borderRadius: "16px 16px 16px 4px", width: "fit-content" }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{
                    width: 7, height: 7, borderRadius: "50%",
                    background: "var(--text3)",
                    animation: `float 1.2s ease-in-out infinite`,
                    animationDelay: `${i * 0.2}s`,
                  }} />
                ))}
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{
            padding: "12px 14px",
            borderTop: "1px solid var(--border)",
            display: "flex", gap: 8, alignItems: "flex-end",
            background: "var(--surface)",
          }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask anything..."
              rows={1}
              style={{
                flex: 1, padding: "10px 14px",
                background: "var(--bg2)",
                border: "1.5px solid var(--border)",
                borderRadius: 12, color: "var(--text)",
                fontSize: 13, outline: "none",
                resize: "none", fontFamily: "inherit",
                lineHeight: 1.5, maxHeight: 100,
                transition: "border-color 0.2s",
              }}
              onFocus={e => e.target.style.borderColor = "var(--accent)"}
              onBlur={e => e.target.style.borderColor = "var(--border)"}
            />
            <button onClick={send} disabled={!input.trim()} style={{
              width: 40, height: 40, borderRadius: 11, flexShrink: 0,
              background: input.trim() ? "var(--gradient-accent)" : "var(--bg3)",
              border: "none", cursor: input.trim() ? "pointer" : "default",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 16, transition: "all 0.2s",
              boxShadow: input.trim() ? "0 4px 14px var(--accent-glow)" : "none",
            }}>
              ➤
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes chatBounce {
          0%,100%{transform:scale(1)}
          50%{transform:scale(1.08) translateY(-3px)}
        }
        @keyframes messageIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}