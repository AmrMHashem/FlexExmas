import React from "react";
import { useState, useRef, useEffect } from "react";
import { Icon, Btn, Input, Textarea } from "./UI";

const FAQ_DATA = [
  {
    id: "cert",
    question: "كيف أحصل على الشهادة؟",
    answer: "الشهادة يتم منحها تلقائياً عند اجتياز الاختبار بنسبة النجاح المطلوبة (عادة 70% فأكثر). يمكنك تحميلها من صفحة النتائج مباشرة بصيغة PDF احترافية.",
  },
  {
    id: "retry",
    question: "هل يمكنني إعادة الاختبار أكثر من مرة؟",
    answer: "نعم! يمكنك إعادة أي اختبار عدد مرات غير محدود. لا توجد قيود على محاولاتك، وكل محاولة ستساعدك على تحسين نتائجك.",
  },
  {
    id: "questions",
    question: "كم عدد الأسئلة في كل اختبار؟",
    answer: "يختلف عدد الأسئلة حسب الاختبار (عادة من 40 إلى 100 سؤال). في الاختبارات الكبيرة، قد يتم تقسيمها إلى أقسام يمكنك حلها على مراحل.",
  },
  {
    id: "time",
    question: "هل هناك حد زمني للاختبار؟",
    answer: "نعم، لكل اختبار وقت محدد يعتمد على عدد الأسئلة وصعوبتها. في وضع المحاكاة، تحصل على الوقت الفعلي للامتحان. في وضع الممارسة، قد تأخذ وقتك.",
  },
  {
    id: "report",
    question: "كيف أبلغ عن خطأ في سؤال؟",
    answer: "أثناء الاختبار، استخدم زر 🚨 'Report Issue' لإرسال تقرير عن المشكلة. فريقنا يراجع جميع التقارير وينتج عنها تحسينات مستمرة.",
  },
  {
    id: "privacy",
    question: "هل بياناتي آمنة على الموقع؟",
    answer: "نعم، نستخدم أعلى معايير الأمان لحماية بيانات المستخدمين. كل البيانات مشفرة وآمنة تماماً ولا تُشارك مع جهات خارجية.",
  },
  {
    id: "account",
    question: "كيف أغير كلمة المرور؟",
    answer: "يمكنك تغيير كلمة المرور من صفحة الملف الشخصي (Dashboard) في قسم الحساب. ستتلقى رسالة تأكيد على بريدك الإلكتروني.",
  },
  {
    id: "contact",
    question: "كيف أتواصل مع الدعم؟",
    answer: "يمكنك التواصل معنا عبر صفحة Contact أو استخدام هذه النافذة. نرد على جميع الاستفسارات خلال 24 ساعة.",
  },
];

export default function ChatWidget({ open, setOpen, setPage }) {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: "bot",
      text: "أهلاً وسهلاً! 👋 أنا مساعد ExamPro. كيف يمكنني مساعدتك؟",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [showFAQ, setShowFAQ] = useState(true);
  const [showContact, setShowContact] = useState(false);
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = {
      id: messages.length + 1,
      type: "user",
      text: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    // محاكاة البحث في FAQ
    setTimeout(() => {
      const matchedFAQ = FAQ_DATA.find(
        (faq) =>
          faq.question.toLowerCase().includes(input.toLowerCase()) ||
          faq.answer.toLowerCase().includes(input.toLowerCase())
      );

      const botResponse = {
        id: messages.length + 2,
        type: "bot",
        text: matchedFAQ
          ? matchedFAQ.answer
          : "عذراً، لم أجد إجابة مباشرة لسؤالك. هل تود التواصل مع فريق الدعم؟",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botResponse]);
      setLoading(false);
    }, 600);
  };

  const handleContactSubmit = async () => {
    if (!contactForm.name || !contactForm.email || !contactForm.message) {
      alert("يرجى ملء جميع الحقول");
      return;
    }

    setLoading(true);
    // هنا يمكن إضافة الاتصال بـ API
    setTimeout(() => {
      const botMessage = {
        id: messages.length + 1,
        type: "bot",
        text: "✅ تم استقبال رسالتك! سنرد عليك خلال 24 ساعة على البريد المسجل.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMessage]);
      setContactForm({ name: "", email: "", subject: "", message: "" });
      setShowContact(false);
      setLoading(false);
    }, 800);
  };

  return (
    <>
      {/* Floating Button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: "var(--gradient-accent)",
            border: "none",
            color: "#fff",
            fontSize: 24,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 20px var(--accent-glow)",
            zIndex: 1000,
            animation: "float 3s ease-in-out infinite",
            transition: "all 0.3s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "scale(1.15)";
            e.currentTarget.style.boxShadow = "0 8px 32px var(--accent-glow)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1)";
            e.currentTarget.style.boxShadow = "0 4px 20px var(--accent-glow)";
          }}
          title="فتح الدردشة"
        >
          💬
        </button>
      )}

      {/* Chat Window */}
      {open && (
        <div
          className="scale-in"
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            width: "min(100vw - 32px, 420px)",
            height: "80vh",
            maxHeight: 700,
            background: "var(--surface)",
            border: "1.5px solid var(--border)",
            borderRadius: 18,
            display: "flex",
            flexDirection: "column",
            zIndex: 1000,
            boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "16px 18px",
              background: "var(--gradient-accent)",
              color: "#fff",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderBottom: "1px solid var(--accent)",
            }}
          >
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>
                ExamPro Support 🤖
              </div>
              <div style={{ fontSize: 11, opacity: 0.8 }}>
                نحن هنا للمساعدة 24/7
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              style={{
                width: 28,
                height: 28,
                borderRadius: 7,
                background: "rgba(255,255,255,0.15)",
                border: "none",
                color: "#fff",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.3)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.15)")}
            >
              <Icon n="close" size={16} color="#fff" />
            </button>
          </div>

          {/* Messages Area */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "14px",
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            {showFAQ && !showContact && (
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text3)", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  ❓ أسئلة متكررة
                </div>
                {FAQ_DATA.map((faq) => (
                  <button
                    key={faq.id}
                    onClick={() => {
                      setMessages((prev) => [
                        ...prev,
                        {
                          id: prev.length + 1,
                          type: "user",
                          text: faq.question,
                          timestamp: new Date(),
                        },
                        {
                          id: prev.length + 2,
                          type: "bot",
                          text: faq.answer,
                          timestamp: new Date(),
                        },
                      ]);
                      setShowFAQ(false);
                    }}
                    style={{
                      width: "100%",
                      textAlign: "right",
                      padding: "10px 12px",
                      borderRadius: 10,
                      border: "1px solid var(--border)",
                      background: "var(--bg2)",
                      color: "var(--text)",
                      cursor: "pointer",
                      marginBottom: 8,
                      fontSize: 12,
                      fontWeight: 500,
                      transition: "all 0.2s",
                      fontFamily: "inherit",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "var(--accent-soft)";
                      e.currentTarget.style.borderColor = "var(--accent)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "var(--bg2)";
                      e.currentTarget.style.borderColor = "var(--border)";
                    }}
                  >
                    {faq.question}
                  </button>
                ))}
              </div>
            )}

            {!showFAQ && messages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  display: "flex",
                  justifyContent: msg.type === "user" ? "flex-end" : "flex-start",
                  animation: "fadeIn 0.3s ease",
                }}
              >
                <div
                  style={{
                    maxWidth: "75%",
                    padding: "10px 12px",
                    borderRadius: 10,
                    fontSize: 13,
                    lineHeight: 1.5,
                    background:
                      msg.type === "user" ? "var(--accent)" : "var(--bg3)",
                    color: msg.type === "user" ? "#fff" : "var(--text)",
                    wordWrap: "break-word",
                  }}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: "flex", gap: 6, padding: "8px 0" }}>
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: "var(--accent)",
                    animation: "float 0.6s ease-in-out infinite",
                  }}
                />
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: "var(--accent)",
                    animation: "float 0.6s ease-in-out infinite 0.2s",
                  }}
                />
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: "var(--accent)",
                    animation: "float 0.6s ease-in-out infinite 0.4s",
                  }}
                />
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          {!showContact && (
            <div
              style={{
                padding: "12px 14px",
                borderTop: "1px solid var(--border)",
                display: "flex",
                gap: 8,
              }}
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="اكتب سؤالك..."
                style={{
                  flex: 1,
                  padding: "8px 12px",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  fontSize: 12,
                  outline: "none",
                  background: "var(--bg)",
                  color: "var(--text)",
                  fontFamily: "inherit",
                }}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || loading}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  border: "none",
                  background: "var(--accent)",
                  color: "#fff",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: input.trim() && !loading ? 1 : 0.5,
                  transition: "all 0.2s",
                }}
              >
                <Icon n="send" size={14} color="#fff" />
              </button>
            </div>
          )}

          {/* Contact Form */}
          {showContact && (
            <div style={{ padding: "12px 14px", borderTop: "1px solid var(--border)", overflowY: "auto" }}>
              <input
                type="text"
                placeholder="اسمك"
                value={contactForm.name}
                onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  marginBottom: 8,
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  fontSize: 12,
                  fontFamily: "inherit",
                }}
              />
              <input
                type="email"
                placeholder="بريدك الإلكتروني"
                value={contactForm.email}
                onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  marginBottom: 8,
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  fontSize: 12,
                  fontFamily: "inherit",
                }}
              />
              <textarea
                placeholder="رسالتك..."
                value={contactForm.message}
                onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                rows={3}
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  marginBottom: 8,
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  fontSize: 12,
                  fontFamily: "inherit",
                  resize: "none",
                }}
              />
              <button
                onClick={handleContactSubmit}
                disabled={loading}
                style={{
                  width: "100%",
                  padding: "8px",
                  background: "var(--accent)",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                {loading ? "جاري الإرسال..." : "إرسال"}
              </button>
            </div>
          )}

          {/* Footer Buttons */}
          {!showContact && (
            <div
              style={{
                padding: "8px 14px",
                borderTop: "1px solid var(--border)",
                display: "flex",
                gap: 8,
              }}
            >
              <button
                onClick={() => setShowFAQ(!showFAQ)}
                style={{
                  flex: 1,
                  padding: "6px 10px",
                  fontSize: 11,
                  borderRadius: 6,
                  border: `1px solid ${showFAQ ? "var(--accent)" : "var(--border)"}`,
                  background: showFAQ ? "var(--accent-soft)" : "transparent",
                  color: showFAQ ? "var(--accent)" : "var(--text2)",
                  cursor: "pointer",
                  fontWeight: 600,
                  fontFamily: "inherit",
                }}
              >
                ❓ الأسئلة
              </button>
              <button
                onClick={() => setShowContact(true)}
                style={{
                  flex: 1,
                  padding: "6px 10px",
                  fontSize: 11,
                  borderRadius: 6,
                  border: "1px solid var(--border)",
                  background: "transparent",
                  color: "var(--text2)",
                  cursor: "pointer",
                  fontWeight: 600,
                  fontFamily: "inherit",
                }}
              >
                📞 تواصل معنا
              </button>
              <button
                onClick={() => {
                  setPage("contact");
                  setOpen(false);
                }}
                style={{
                  flex: 1,
                  padding: "6px 10px",
                  fontSize: 11,
                  borderRadius: 6,
                  border: "1px solid var(--border)",
                  background: "transparent",
                  color: "var(--text2)",
                  cursor: "pointer",
                  fontWeight: 600,
                  fontFamily: "inherit",
                }}
              >
                📧 الدعم
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}