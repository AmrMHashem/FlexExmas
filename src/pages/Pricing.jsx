// pages/Pricing.jsx — FlexExams Subscription Plans Page
import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../hooks/useAuth";
import { getPlatformSettings, DEFAULT_PLANS, getUserSubscription } from "../services/payment";

const Icon = ({ name, size = 18, color = "currentColor" }) => {
  const icons = {
    check: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
    star:  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>,
    zap:   <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
    shield:<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
    crown: <svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke="none"><path d="M5 16L3 6l5.5 4L12 4l3.5 6L21 6l-2 10H5zm0 2h14v2H5v-2z"/></svg>,
    arrow: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
    gift:  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>,
    lock:  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
    users: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    x:     <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  };
  return icons[name] || null;
};

const FREE_FEATURES = [
  { text: "Access to 10% of questions (guest)", included: true },
  { text: "15% access after registration", included: true },
  { text: "Basic progress tracking", included: true },
  { text: "Full exam access", included: false },
  { text: "PDF certificates", included: false },
  { text: "Detailed explanations", included: false },
];

export default function Pricing({ setPage, showToast }) {
  const { user, profile } = useAuth();
  const [plans, setPlans]       = useState(DEFAULT_PLANS);
  const [billing, setBilling]   = useState("monthly"); // "monthly" | "yearly"
  const [subscription, setSub]  = useState(null);
  const [loading, setLoading]   = useState(true);
  const [hoveredPlan, setHover] = useState(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const settings = await getPlatformSettings();
      if (settings?.plans) setPlans({ ...DEFAULT_PLANS, ...settings.plans });
      if (user?.uid) {
        const sub = await getUserSubscription(user.uid);
        setSub(sub);
      }
      setLoading(false);
    })();
  }, [user]);

  const handleChoosePlan = (planId) => {
    if (!user) {
      setPage("auth", { mode: "register" });
      showToast?.({ type: "info", msg: "Please create an account to subscribe" });
      return;
    }
    setPage("checkout", { planId, plans });
  };

  const monthly = plans.monthly || DEFAULT_PLANS.monthly;
  const yearly  = plans.yearly  || DEFAULT_PLANS.yearly;
  const currentPlan = billing === "monthly" ? monthly : yearly;

  const yearlyMonthly = (yearly.price / 12).toFixed(2);
  const savings = Math.round(100 - (yearly.price / (monthly.price * 12)) * 100);

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "clamp(40px,6vw,80px) clamp(20px,4vw,40px)" }}>

      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 56 }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          background: "linear-gradient(135deg,rgba(99,102,241,0.12),rgba(168,85,247,0.12))",
          border: "1.5px solid rgba(99,102,241,0.25)",
          borderRadius: 100, padding: "6px 18px", marginBottom: 20,
          fontSize: 12, fontWeight: 800, color: "var(--accent)",
          textTransform: "uppercase", letterSpacing: "0.1em",
        }}>
          <Icon name="crown" size={14} color="var(--accent)" />
          Simple, Transparent Pricing
        </div>
        <h1 style={{
          fontSize: "clamp(28px,4vw,48px)", fontWeight: 900,
          color: "var(--text)", letterSpacing: "-1.5px", marginBottom: 16,
          lineHeight: 1.1,
        }}>
          Invest in Your{" "}
          <span style={{ background: "var(--gradient-accent)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Career
          </span>
        </h1>
        <p style={{ fontSize: "clamp(14px,2vw,17px)", color: "var(--text2)", maxWidth: 520, margin: "0 auto 32px", lineHeight: 1.7 }}>
          Start free with limited access. Upgrade anytime to unlock all exams,
          earn certificates, and accelerate your certification journey.
        </p>

        {/* Billing toggle */}
        <div style={{
          display: "inline-flex", alignItems: "center",
          background: "var(--bg2)", border: "1.5px solid var(--border2)",
          borderRadius: 100, padding: 5, gap: 4, position: "relative",
        }}>
          {["monthly", "yearly"].map(b => (
            <button
              key={b}
              onClick={() => setBilling(b)}
              style={{
                padding: "8px 22px", borderRadius: 100, border: "none",
                cursor: "pointer", fontFamily: "inherit",
                fontSize: 13, fontWeight: 700, transition: "all 0.25s",
                background: billing === b ? "var(--gradient-accent)" : "transparent",
                color: billing === b ? "#fff" : "var(--text2)",
              }}
            >
              {b === "monthly" ? "Monthly" : "Yearly"}
              {b === "yearly" && (
                <span style={{
                  marginLeft: 8, background: "rgba(255,255,255,0.2)",
                  borderRadius: 100, padding: "2px 8px", fontSize: 10,
                  fontWeight: 800, display: "inline-block",
                }}>
                  -{savings}%
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Current subscription banner */}
      {subscription?.isActive && (
        <div style={{
          background: "linear-gradient(135deg,rgba(16,185,129,0.08),rgba(5,150,105,0.06))",
          border: "1.5px solid rgba(16,185,129,0.25)", borderRadius: 16,
          padding: "14px 20px", marginBottom: 32,
          display: "flex", alignItems: "center", gap: 12,
        }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(16,185,129,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon name="shield" size={18} color="var(--green)" />
          </div>
          <div>
            <div style={{ fontWeight: 800, color: "var(--green)", fontSize: 13 }}>Active Subscription</div>
            <div style={{ fontSize: 12, color: "var(--text2)" }}>
              {subscription.planId} plan · Expires {new Date(subscription.endDate).toLocaleDateString()}
            </div>
          </div>
        </div>
      )}

      {/* Plans Grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))",
        gap: 24, marginBottom: 56,
      }}>

        {/* Free Plan */}
        <div style={{
          background: "var(--bg2)", border: "1.5px solid var(--border2)",
          borderRadius: 24, padding: "32px 28px",
          transition: "all 0.3s cubic-bezier(0.16,1,0.3,1)",
          transform: hoveredPlan === "free" ? "translateY(-6px)" : "none",
          boxShadow: hoveredPlan === "free" ? "0 20px 40px rgba(0,0,0,0.12)" : "none",
        }}
          onMouseEnter={() => setHover("free")}
          onMouseLeave={() => setHover(null)}
        >
          <div style={{ marginBottom: 24 }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              background: "rgba(148,163,184,0.1)", border: "1px solid var(--border)",
              borderRadius: 100, padding: "4px 12px", marginBottom: 16,
              fontSize: 11, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.1em",
            }}>
              <Icon name="gift" size={12} color="var(--text3)" />
              Always Free
            </div>
            <div style={{ fontSize: "clamp(36px,4vw,48px)", fontWeight: 900, color: "var(--text)", letterSpacing: "-2px", lineHeight: 1 }}>
              $0
            </div>
            <div style={{ fontSize: 13, color: "var(--text3)", marginTop: 6, fontWeight: 600 }}>
              Limited access forever
            </div>
          </div>

          <div style={{ borderTop: "1px solid var(--border)", paddingTop: 20, marginBottom: 24 }}>
            {FREE_FEATURES.map((f, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 0" }}>
                <div style={{
                  width: 20, height: 20, borderRadius: 6, flexShrink: 0,
                  background: f.included ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.08)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {f.included
                    ? <Icon name="check" size={12} color="var(--green)" />
                    : <Icon name="x" size={12} color="var(--red)" />
                  }
                </div>
                <span style={{ fontSize: 13, color: f.included ? "var(--text2)" : "var(--text3)" }}>
                  {f.text}
                </span>
              </div>
            ))}
          </div>

          <button
            onClick={() => !user ? setPage("auth", { mode: "register" }) : null}
            style={{
              width: "100%", padding: "13px", borderRadius: 14,
              background: "transparent", border: "1.5px solid var(--border2)",
              color: "var(--text2)", fontSize: 14, fontWeight: 700,
              cursor: user ? "default" : "pointer", fontFamily: "inherit",
            }}
          >
            {user ? "Current Plan" : "Get Started Free"}
          </button>
        </div>

        {/* Monthly / Yearly Plan */}
        {[monthly, yearly].map((plan) => {
          const isYearly  = plan.id === "yearly";
          const isPopular = !isYearly;
          const price     = isYearly && billing === "yearly" ? yearlyMonthly : plan.price;
          const isActive  = subscription?.isActive && subscription?.planId === plan.id;

          return (
            <div
              key={plan.id}
              onMouseEnter={() => setHover(plan.id)}
              onMouseLeave={() => setHover(null)}
              style={{
                background: isPopular
                  ? "linear-gradient(145deg,rgba(79,70,229,0.08),rgba(168,85,247,0.05))"
                  : "var(--bg2)",
                border: isPopular
                  ? "2px solid rgba(99,102,241,0.5)"
                  : isYearly ? "2px solid rgba(236,72,153,0.4)" : "1.5px solid var(--border2)",
                borderRadius: 24, padding: "32px 28px",
                position: "relative", overflow: "hidden",
                transition: "all 0.3s cubic-bezier(0.16,1,0.3,1)",
                transform: hoveredPlan === plan.id ? "translateY(-6px)" : "none",
                boxShadow: hoveredPlan === plan.id
                  ? isPopular
                    ? "0 20px 48px rgba(99,102,241,0.2)"
                    : "0 20px 48px rgba(236,72,153,0.15)"
                  : isPopular ? "0 8px 24px rgba(99,102,241,0.12)" : "none",
              }}
            >
            {/* Popular / Best Value badge */}
{(isPopular || isYearly) && (
  <div style={{
    position: "absolute", top: 20, right: 20,
    background: isPopular
      ? "linear-gradient(135deg,#6366f1,#8b5cf6)"
      : "linear-gradient(135deg,#ec4899,#f43f5e)",
    borderRadius: 100, padding: "4px 12px",
    fontSize: 10, fontWeight: 800, color: "#fff",
    textTransform: "uppercase", letterSpacing: "0.08em",
  }}>
    {isPopular ? "Most Popular" : "Best Value"}
  </div>
)}

<div style={{ marginBottom: 24 }}>
  <div style={{
    display: "inline-flex", alignItems: "center", gap: 6,
    background: isPopular ? "rgba(99,102,241,0.12)" : "rgba(236,72,153,0.1)",
    border: `1px solid ${isPopular ? "rgba(99,102,241,0.3)" : "rgba(236,72,153,0.3)"}`,
    borderRadius: 100, padding: "4px 12px", marginBottom: 16,
    fontSize: 11, fontWeight: 700,
    color: isPopular ? "var(--accent)" : "#ec4899",
    textTransform: "uppercase", letterSpacing: "0.1em",
  }}>
    <Icon name={isYearly ? "crown" : "zap"} size={12} color={isPopular ? "var(--accent)" : "#ec4899"} />
    {plan.name}
  </div>

  <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 4 }}>
    {/* تعديل: السعر يعرض السنوي كاملاً إذا كان billing سنوي */}
    <div style={{ fontSize: "clamp(36px,4vw,48px)", fontWeight: 900, color: "var(--text)", letterSpacing: "-2px", lineHeight: 1 }}>
      ${isYearly && billing === "yearly" ? yearly.price : (isYearly ? yearlyMonthly : plan.price)}
    </div>
    {/* تعديل: الوحدة تصبح /year للسنوي مع billing سنوي */}
    <div style={{ fontSize: 13, color: "var(--text3)", fontWeight: 600 }}>
      {isYearly && billing === "yearly" ? "/year" : "/mo"}
    </div>
  </div>

  {isYearly && (
    <div style={{ fontSize: 12, color: "var(--text3)" }}>
      Billed ${yearly.price}/year · Save {savings}%
    </div>
  )}
  {!isYearly && (
    <div style={{ fontSize: 12, color: "var(--text3)" }}>
      Billed monthly · Cancel anytime
    </div>
  )}
</div>

<div style={{ borderTop: `1px solid ${isPopular ? "rgba(99,102,241,0.2)" : "var(--border)"}`, paddingTop: 20, marginBottom: 24 }}>
  {(plan.features || []).map((f, i) => (
    <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 0" }}>
      <div style={{
        width: 20, height: 20, borderRadius: 6, flexShrink: 0,
        background: "rgba(16,185,129,0.12)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Icon name="check" size={12} color="var(--green)" />
      </div>
      <span style={{ fontSize: 13, color: "var(--text2)" }}>{f}</span>
    </div>
  ))}
</div>

<button
  onClick={() => isActive ? null : handleChoosePlan(plan.id)}
  style={{
    width: "100%", padding: "14px", borderRadius: 14, border: "none",
    cursor: isActive ? "default" : "pointer", fontFamily: "inherit",
    fontSize: 14, fontWeight: 800, letterSpacing: "-0.2px",
    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
    background: isActive
      ? "rgba(16,185,129,0.12)"
      : isPopular
        ? "linear-gradient(135deg,#6366f1,#8b5cf6)"
        : "linear-gradient(135deg,#ec4899,#f43f5e)",
    color: isActive ? "var(--green)" : "#fff",
    boxShadow: isActive ? "none" : isPopular
      ? "0 8px 24px rgba(99,102,241,0.35)"
      : "0 8px 24px rgba(236,72,153,0.3)",
    transition: "all 0.2s",
  }}
  onMouseEnter={e => { if (!isActive) e.currentTarget.style.transform = "scale(1.02)"; }}
  onMouseLeave={e => { e.currentTarget.style.transform = ""; }}
>
  {isActive ? (
    <>
      <Icon name="check" size={16} color="var(--green)" />
      Active Plan
    </>
  ) : (
    <>
      Get {plan.name}
      <Icon name="arrow" size={15} color="#fff" />
    </>
  )}
</button>
            </div>
          );
        })}
      </div>

      {/* Trust badges */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))",
        gap: 16, marginBottom: 48,
      }}>
        {[
          { icon: "shield", title: "Secure Payment", desc: "256-bit SSL encryption via PayPal" },
          { icon: "users",  title: "100,000+ Students", desc: "Trusted by professionals worldwide" },
          { icon: "zap",    title: "Instant Access",   desc: "Unlock everything immediately" },
          { icon: "gift",   title: "Cancel Anytime",   desc: "No long-term commitment" },
        ].map((b, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "center", gap: 12,
            background: "var(--bg2)", border: "1px solid var(--border)",
            borderRadius: 14, padding: "14px 16px",
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10, flexShrink: 0,
              background: "rgba(99,102,241,0.1)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Icon name={b.icon} size={18} color="var(--accent)" />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: "var(--text)" }}>{b.title}</div>
              <div style={{ fontSize: 11, color: "var(--text3)" }}>{b.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* FAQ */}
      <div style={{ maxWidth: 680, margin: "0 auto" }}>
        <h2 style={{ fontSize: 22, fontWeight: 900, color: "var(--text)", textAlign: "center", marginBottom: 24, letterSpacing: "-0.5px" }}>
          Frequently Asked Questions
        </h2>
        {[
          { q: "Can I cancel my subscription?", a: "Yes, you can cancel anytime. Your access continues until the end of the billing period." },
          { q: "Is there a free trial?", a: "You can access 15% of any exam for free after registration — no credit card required." },
          { q: "Can I buy individual exams?", a: "Yes! You can purchase individual exam access from each exam's detail page." },
          { q: "What payment methods are accepted?", a: "We accept all major credit/debit cards and PayPal through our secure payment processor." },
          { q: "Will my subscription auto-renew?", a: "You choose. During checkout, you can opt into auto-renewal or pay once." },
        ].map((faq, i) => (
          <FaqItem key={i} question={faq.q} answer={faq.a} />
        ))}
      </div>
    </div>
  );
}

function FaqItem({ question, answer }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{
      borderBottom: "1px solid var(--border)",
      overflow: "hidden",
    }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: "100%", padding: "16px 0",
          background: "none", border: "none",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          cursor: "pointer", gap: 16, fontFamily: "inherit",
        }}
      >
        <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", textAlign: "left" }}>
          {question}
        </span>
        <div style={{
          width: 24, height: 24, borderRadius: 8, flexShrink: 0,
          background: "var(--accent-soft)", display: "flex", alignItems: "center", justifyContent: "center",
          transform: open ? "rotate(45deg)" : "none", transition: "transform 0.2s",
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </div>
      </button>
      {open && (
        <div style={{ padding: "0 0 16px", fontSize: 13, color: "var(--text2)", lineHeight: 1.7 }}>
          {answer}
        </div>
      )}
    </div>
  );
}
