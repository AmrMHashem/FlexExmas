// pages/Checkout.jsx — FlexExams v7.0
// ✅ PayPal: Live mode, full capture flow
// ✅ Instapay: Direct deep link to Instapay app + sender name field (screenshot removed)

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../hooks/useAuth";
import { processReferralOnPurchase } from "../components/ReferralSystem";
import {
  PAYPAL_CLIENT_ID,
  INSTAPAY_ACCOUNT,
  INSTAPAY_PHONE,
  getPlatformSettings,
  DEFAULT_PLANS,
  validateCoupon,
  saveTransaction,
  grantSubscription,
  grantExamAccess,
  getUserSubscription,
  submitInstapayPayment,
} from "../services/payment";

// ─── SVG Icon Library ─────────────────────────────────────────────────────────
const Icon = ({ name, size = 18, color = "currentColor", style: s }) => {
  const icons = {
    check:     <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
    lock:      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
    shield:    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
    tag:       <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>,
    arrow:     <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>,
    star:      <svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>,
    copy:      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>,
    info:      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
    clock:     <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
    refresh:   <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>,
    zap:       <svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke="none"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
    card:      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>,
    phone:     <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>,
    spinner:   <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" style={{ animation: "spin 0.8s linear infinite" }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>,
    send:      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
    external:  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>,
    checkCircle: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="9 12 11 14 15 10"/></svg>,
  };
  return <span style={s}>{icons[name] || null}</span>;
};

const Spinner = ({ size = 16, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5"
    style={{ animation: "spin 0.8s linear infinite", display: "inline-block" }}>
    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
  </svg>
);

// ─── Auto-Renew Toggle ────────────────────────────────────────────────────────
function AutoRenewToggle({ value, onChange, planId }) {
  const isYearly = planId === "yearly";
  const card = (active, onClick, icon, label, tags, desc) => (
    <div onClick={onClick} style={{
      border: `2px solid ${active ? "var(--accent)" : "var(--border)"}`,
      borderRadius: 14, padding: "14px 16px", cursor: "pointer",
      background: active ? "rgba(99,102,241,0.07)" : "transparent",
      transition: "all 0.2s", position: "relative",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <Icon name={icon} size={16} color={active ? "var(--accent)" : "var(--text3)"} />
        <span style={{ fontSize: 13, fontWeight: 900, color: active ? "var(--accent)" : "var(--text)" }}>{label}</span>
      </div>
      <div style={{ fontSize: 11, color: "var(--text3)", lineHeight: 1.5 }}>{desc}</div>
      <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 4 }}>
        {tags.map(t => (
          <span key={t} style={{
            fontSize: 10, fontWeight: 700, padding: "2px 7px",
            background: active ? "rgba(99,102,241,0.12)" : "var(--bg)",
            color: active ? "var(--accent)" : "var(--text3)",
            borderRadius: 100, border: `1px solid ${active ? "rgba(99,102,241,0.2)" : "var(--border)"}`,
          }}>{t}</span>
        ))}
      </div>
      {active && (
        <div style={{ position: "absolute", top: 10, right: 10 }}>
          <Icon name="check" size={14} color="var(--accent)" />
        </div>
      )}
    </div>
  );

  return (
    <div style={{ background: "var(--bg2)", border: "1.5px solid var(--border)", borderRadius: 16, padding: "18px 20px", marginBottom: 20 }}>
      <div style={{ fontSize: 12, fontWeight: 800, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 14 }}>
        Billing Type
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, position: "relative" }}>
        <div style={{ position: "relative" }}>
          <div style={{
            position: "absolute", top: -10, left: "50%", transform: "translateX(-50%)", zIndex: 2,
            background: "linear-gradient(135deg,#f59e0b,#d97706)",
            color: "#fff", borderRadius: 100, padding: "2px 10px",
            fontSize: 9, fontWeight: 900, letterSpacing: "0.08em", whiteSpace: "nowrap",
            boxShadow: "0 2px 8px rgba(245,158,11,0.4)",
          }}>⭐ RECOMMENDED</div>
          {card(value, () => onChange(true), "refresh", "Auto-Renew",
            ["Never lose access", "Cancel anytime", "Best value"],
            `Renews automatically every ${isYearly ? "year" : "month"}. Cancel anytime.`
          )}
        </div>
        {card(!value, () => onChange(false), "zap", "One-Time",
          ["No auto-charge", "Full control", "Pay once"],
          `Pay once, get full access for ${isYearly ? "1 year" : "1 month"}.`
        )}
      </div>
      <div style={{ marginTop: 10, fontSize: 11, color: "var(--text3)", display: "flex", gap: 6, alignItems: "flex-start" }}>
        <Icon name="info" size={12} color="var(--text3)" />
        <span>{value ? "Cancel anytime from account settings. No charges after cancellation." : `Access valid until end of ${isYearly ? "yearly" : "monthly"} period. Renew manually when ready.`}</span>
      </div>
    </div>
  );
}

// ─── PayPal Button ────────────────────────────────────────────────────────────
function PayPalButton({ amount, description, currency = "USD", onSuccess, onError, disabled }) {
  const containerRef = useRef(null);
  const rendered     = useRef(false);
  const [sdkReady, setSDKReady]     = useState(false);
  const [sdkError, setSDKError]     = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const existing = document.getElementById("paypal-sdk");
    if (existing) {
      if (existing.getAttribute("data-env") === "sandbox") {
        existing.remove();
        delete window.paypal;
      } else if (window.paypal) {
        setSDKReady(true);
        return;
      }
    } else if (window.paypal) {
      setSDKReady(true);
      return;
    }

    const script      = document.createElement("script");
    script.id         = "paypal-sdk";
    script.setAttribute("data-env", "live");
    script.src        = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&currency=${currency}&intent=capture&enable-funding=card,venmo`;
    script.async      = true;
    script.onload     = () => setSDKReady(true);
    script.onerror    = () => setSDKError(true);
    document.head.appendChild(script);
  }, [currency]);

  useEffect(() => { rendered.current = false; }, [amount, currency, disabled]);

  useEffect(() => {
    if (!sdkReady || !window.paypal || !containerRef.current || rendered.current || disabled) return;
    containerRef.current.innerHTML = "";
    rendered.current = false;

    try {
      window.paypal.Buttons({
        style: { layout: "vertical", color: "gold", shape: "rect", label: "pay", height: 48, tagline: false },
        createOrder: (data, actions) => actions.order.create({
          intent: "CAPTURE",
          purchase_units: [{
            amount: { currency_code: currency, value: String(parseFloat(amount).toFixed(2)) },
            description,
          }],
        }),
        onApprove: async (data, actions) => {
          setProcessing(true);
          try {
            let details = null;
            try { details = await actions.order.capture(); } catch {}
            onSuccess({
              orderID:    data.orderID,
              payerID:    data.payerID,
              payerEmail: details?.payer?.email_address || "",
              details,
            });
          } catch (err) {
            onError(err);
          }
          setProcessing(false);
        },
        onError:  (err) => { onError(err); },
        onCancel: () => {},
      }).render(containerRef.current).then(() => { rendered.current = true; });
    } catch (err) { onError(err); }
  }, [sdkReady, disabled, amount, currency, description, onSuccess, onError]);

  if (sdkError) return (
    <div style={{ padding: "14px 16px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 12, display: "flex", gap: 10, alignItems: "center" }}>
      <Icon name="x" size={16} color="var(--red)" />
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--red)" }}>PayPal failed to load</div>
        <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 2 }}>Please refresh the page and try again.</div>
      </div>
    </div>
  );

  if (!sdkReady) return (
    <div style={{ padding: 20, display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
      <Spinner size={24} color="var(--accent)" />
      <div style={{ fontSize: 13, color: "var(--text3)", fontWeight: 600 }}>Loading PayPal...</div>
    </div>
  );

  return (
    <div style={{ position: "relative" }}>
      <div ref={containerRef} style={{ opacity: disabled ? 0.45 : 1, pointerEvents: disabled ? "none" : "auto" }} />
      {processing && (
        <div style={{
          position: "absolute", inset: 0,
          background: "rgba(0,0,0,0.12)",
          display: "flex", alignItems: "center", justifyContent: "center",
          borderRadius: 8, gap: 10,
        }}>
          <Spinner size={18} color="var(--accent)" />
          <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>Processing payment...</span>
        </div>
      )}
    </div>
  );
}

// ─── Instapay Form (screenshot removed) ──────────────────────────────────────
function InstapayForm({ amount, description, userId, planId, examId, onSuccess, onError }) {
  const [step, setStep] = useState(1);
  const [refId, setRefId] = useState("");
  const [senderName, setSenderName] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedAmt, setCopiedAmt] = useState(false);

  const amountUSD = parseFloat(amount) || 0;
  const amountEGP = (amountUSD * 50).toFixed(2);
  const instapayDeepLink = `instapay://pay?receiver=${encodeURIComponent(INSTAPAY_ACCOUNT)}&amount=${amountEGP}`;

  const copyText = (text, setCopiedFn) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedFn(true);
      setTimeout(() => setCopiedFn(false), 2000);
    });
  };

  const handleSubmit = async () => {
    if (!refId.trim() || refId.trim().length < 4) {
      onError(new Error("Please enter a valid Transaction Reference ID (min 4 characters)."));
      return;
    }
    if (!senderName.trim()) {
      onError(new Error("Please enter the sender's name as it appears in the transfer."));
      return;
    }
    setSubmitting(true);
    try {
      const id = await submitInstapayPayment(userId, {
        referenceId:   refId.trim(),
        senderName:    senderName.trim(),
        amount:        amountEGP,
        amountUSD,
        currency:      "EGP",
        planId,
        examId,
        description,
        notes:         notes.trim() || "",
        examTitle:     description || "",
      });
      onSuccess({ paymentId: id, method: "instapay", referenceId: refId.trim() });
    } catch (err) {
      if (err?.message?.includes("already been used")) {
        onError(new Error("❌ This reference ID has already been used. Each payment must have a unique reference ID."));
      } else {
        onError(err);
      }
    }
    setSubmitting(false);
  };

  const infoBox = (bg, border, color) => ({
    background: bg, border: `1.5px solid ${border}`,
    borderRadius: 14, padding: "14px 16px", marginBottom: 14,
    fontSize: 12, color, lineHeight: 1.6,
  });

  const copyRow = (label, value, copied, onCopy) => (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--bg2)", borderRadius: 10, padding: "10px 14px", border: "1px solid var(--border)", marginBottom: 8 }}>
      <div>
        <div style={{ fontSize: 10, color: "var(--text3)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</div>
        <div style={{ fontSize: 14, fontWeight: 800, color: "var(--text)", marginTop: 3 }}>{value}</div>
      </div>
      <button onClick={onCopy} style={{
        background: copied ? "rgba(16,185,129,0.12)" : "var(--accent-soft, rgba(99,102,241,0.1))",
        border: `1px solid ${copied ? "rgba(16,185,129,0.3)" : "var(--border)"}`,
        borderRadius: 8, padding: "6px 12px", cursor: "pointer",
        color: copied ? "var(--green)" : "var(--accent)",
        fontSize: 12, fontWeight: 700, fontFamily: "inherit",
        display: "flex", gap: 5, alignItems: "center", transition: "all 0.15s",
      }}>
        {copied ? <><Icon name="checkCircle" size={13} color="currentColor" /> Copied!</> : <><Icon name="copy" size={13} color="currentColor" /> Copy</>}
      </button>
    </div>
  );

  return (
    <div>
      <div style={{ display: "flex", gap: 0, marginBottom: 20, position: "relative" }}>
        {[
          { n: 1, label: "Send Payment" },
          { n: 2, label: "Submit Reference" },
        ].map((s, i) => (
          <React.Fragment key={s.n}>
            <div style={{ flex: 1, textAlign: "center" }}>
              <div style={{
                width: 32, height: 32, borderRadius: "50%", margin: "0 auto 6px",
                display: "flex", alignItems: "center", justifyContent: "center",
                background: step >= s.n ? "var(--accent)" : "var(--bg2)",
                border: `2px solid ${step >= s.n ? "var(--accent)" : "var(--border)"}`,
                fontSize: 13, fontWeight: 900,
                color: step >= s.n ? "#fff" : "var(--text3)",
                transition: "all 0.2s",
              }}>
                {step > s.n ? <Icon name="check" size={14} color="#fff" /> : s.n}
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, color: step >= s.n ? "var(--accent)" : "var(--text3)" }}>{s.label}</div>
            </div>
            {i === 0 && (
              <div style={{ position: "absolute", top: 15, left: "50%", width: "30%", height: 2, background: step >= 2 ? "var(--accent)" : "var(--border)", transform: "translateX(-50%)", transition: "background 0.3s" }} />
            )}
          </React.Fragment>
        ))}
      </div>

      <div style={{ ...infoBox("rgba(99,102,241,0.06)", "rgba(99,102,241,0.2)", "var(--text2)"), display: "flex", gap: 10 }}>
        <Icon name="info" size={14} color="var(--accent)" style={{ flexShrink: 0, marginTop: 1 }} />
        <span>Instapay payments are reviewed manually. Access will be granted within <strong>1–24 hours</strong> after admin verification.</span>
      </div>

      <div style={{ ...infoBox("rgba(16,185,129,0.05)", "rgba(16,185,129,0.2)", "var(--text2)") }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: "var(--green)", marginBottom: 12, display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ width: 22, height: 22, background: "var(--green)", color: "#fff", borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 900 }}>1</span>
          Send Payment via Instapay
        </div>

        <a
          href={instapayDeepLink}
          onClick={(e) => {
            setTimeout(() => {
              if (!document.hasFocus()) return;
              alert("📱 Instapay app not installed?\n\nUse the account details below to send payment manually.");
            }, 800);
          }}
          style={{
            display: "block",
            background: "linear-gradient(135deg,#009639,#007a2f)",
            textAlign: "center",
            padding: "14px",
            borderRadius: 12,
            color: "#fff",
            fontWeight: 800,
            fontSize: 15,
            textDecoration: "none",
            marginBottom: 16,
            transition: "all 0.3s",
            border: "none",
            cursor: "pointer",
            boxShadow: "0 6px 20px rgba(0,150,57,0.3)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "linear-gradient(135deg,#007a2f,#005a24)";
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,150,57,0.4)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "linear-gradient(135deg,#009639,#007a2f)";
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,150,57,0.3)";
          }}
        >
          <Icon name="external" size={16} color="#fff" style={{ marginRight: 8, verticalAlign: "middle" }} />
          Pay {Number(amountEGP).toLocaleString()} EGP via Instapay App
        </a>

        {copyRow("Instapay Account / Receiver", INSTAPAY_ACCOUNT, copied, () => copyText(INSTAPAY_ACCOUNT, setCopied))}

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--bg2)", borderRadius: 10, padding: "10px 14px", border: "1px solid var(--border)" }}>
          <div>
            <div style={{ fontSize: 10, color: "var(--text3)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>Amount to Transfer</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: "var(--accent)", marginTop: 3 }}>
              {Number(amountEGP).toLocaleString()} EGP
              <span style={{ fontSize: 12, color: "var(--text3)", fontWeight: 600, marginLeft: 8 }}>≈ ${amountUSD.toFixed(2)} USD</span>
            </div>
          </div>
          <button onClick={() => copyText(amountEGP, setCopiedAmt)} style={{
            background: copiedAmt ? "rgba(16,185,129,0.12)" : "var(--accent-soft, rgba(99,102,241,0.1))",
            border: `1px solid ${copiedAmt ? "rgba(16,185,129,0.3)" : "var(--border)"}`,
            borderRadius: 8, padding: "6px 12px", cursor: "pointer",
            color: copiedAmt ? "var(--green)" : "var(--accent)",
            fontSize: 12, fontWeight: 700, fontFamily: "inherit",
            display: "flex", gap: 5, alignItems: "center", transition: "all 0.15s",
          }}>
            {copiedAmt ? <><Icon name="checkCircle" size={13} color="currentColor" /> Copied!</> : <><Icon name="copy" size={13} color="currentColor" /> Copy</>}
          </button>
        </div>

        {INSTAPAY_PHONE && INSTAPAY_PHONE !== "+20XXXXXXXXXX" && (
          <div style={{ marginTop: 8, fontSize: 11, color: "var(--text3)", display: "flex", gap: 6 }}>
            <Icon name="phone" size={12} color="var(--text3)" />
            Also available at phone number: <strong style={{ color: "var(--text)" }}>{INSTAPAY_PHONE}</strong>
          </div>
        )}
      </div>

      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: "var(--text)", marginBottom: 10, display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ width: 22, height: 22, background: "var(--accent)", color: "#fff", borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 900 }}>2</span>
          Enter Your Transfer Details
        </div>

        <div style={{ fontSize: 12, color: "var(--text3)", marginBottom: 8, lineHeight: 1.5 }}>
          After sending the payment, fill in the reference ID and the sender's name as shown in your Instapay confirmation.
        </div>

        <input
          type="text"
          value={refId}
          onChange={e => setRefId(e.target.value)}
          placeholder="Transaction Reference ID (e.g. TRX2026051234567)"
          style={{
            width: "100%", padding: "13px 16px", borderRadius: 12,
            border: "1.5px solid var(--border)", background: "var(--bg2)",
            color: "var(--text)", fontSize: 14, fontFamily: "inherit",
            outline: "none", boxSizing: "border-box", marginBottom: 10,
          }}
          onFocus={e => (e.target.style.borderColor = "var(--accent)")}
          onBlur={e  => (e.target.style.borderColor = "var(--border)")}
        />

        <input
          type="text"
          value={senderName}
          onChange={e => setSenderName(e.target.value)}
          placeholder="Sender's Full Name (as it appears in Instapay)"
          style={{
            width: "100%", padding: "13px 16px", borderRadius: 12,
            border: "1.5px solid var(--border)", background: "var(--bg2)",
            color: "var(--text)", fontSize: 14, fontFamily: "inherit",
            outline: "none", boxSizing: "border-box", marginBottom: 10,
          }}
          onFocus={e => (e.target.style.borderColor = "var(--accent)")}
          onBlur={e  => (e.target.style.borderColor = "var(--border)")}
        />

        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Optional: Any additional notes for verification..."
          rows={2}
          style={{
            width: "100%", padding: "12px 16px", borderRadius: 12,
            border: "1.5px solid var(--border)", background: "var(--bg2)",
            color: "var(--text)", fontSize: 13, fontFamily: "inherit",
            outline: "none", boxSizing: "border-box", resize: "none",
            marginBottom: 10,
          }}
          onFocus={e => (e.target.style.borderColor = "var(--accent)")}
          onBlur={e  => (e.target.style.borderColor = "var(--border)")}
        />
      </div>

      <div style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.3)", borderRadius: 10, padding: "10px 14px", marginBottom: 16, fontSize: 12, color: "var(--gold, #d97706)", display: "flex", gap: 8, alignItems: "flex-start" }}>
        <Icon name="clock" size={14} color="currentColor" style={{ flexShrink: 0, marginTop: 1 }} />
        <span>Verification takes <strong>1–24 hours</strong>. You will be notified by email once approved.</span>
      </div>

      <button
        onClick={handleSubmit}
        disabled={submitting || !refId.trim() || !senderName.trim()}
        style={{
          width: "100%", padding: "14px", borderRadius: 12, border: "none",
          background: (submitting || !refId.trim() || !senderName.trim()) ? "rgba(16,185,129,0.3)" : "linear-gradient(135deg,#10b981,#059669)",
          color: "#fff", fontSize: 15, fontWeight: 800,
          cursor: (submitting || !refId.trim() || !senderName.trim()) ? "not-allowed" : "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
          transition: "all 0.2s",
          boxShadow: (submitting || !refId.trim() || !senderName.trim()) ? "none" : "0 4px 16px rgba(16,185,129,0.3)",
        }}
      >
        {submitting ? <><Spinner size={16} color="#fff" /> Submitting for Verification...</> : <><Icon name="send" size={16} color="#fff" /> Submit Payment for Verification</>}
      </button>
    </div>
  );
}

// ─── Payment Methods Config ──────────────────────────────────────────────────
const PAYMENT_METHODS = [
  {
    id: "paypal",
    label: "PayPal",
    desc: "Card / PayPal balance",
    icon: (
      <svg viewBox="0 0 24 24" width="28" height="28" fill="none">
        <path d="M19.5 8.5C19.5 11.5 17.5 14 14.5 14H13L12 19H9L10.5 11H13.5C15.5 11 17 10 17 8C17 6.5 15.5 5.5 14 5.5H9.5L8 14H5L7 5H14C17 5 19.5 6.5 19.5 8.5Z" fill="#003087"/>
        <path d="M8 10.5C8 13.5 6 16 3 16H2L1 21H-2L-0.5 13H2.5C4.5 13 6 12 6 10C6 8.5 4.5 7.5 3 7.5H-1.5L-3 16H-6L-4 7H3C6 7 8 8.5 8 10.5Z" fill="#009cde" transform="translate(9 -3)"/>
      </svg>
    ),
  },
  {
    id: "instapay",
    label: "Instapay",
    desc: "Instant bank transfer (EGP)",
    icon: (
      <svg viewBox="0 0 36 36" width="28" height="28" fill="none">
        <rect width="36" height="36" rx="8" fill="#009639"/>
        <path d="M10 18h16M20 12l6 6-6 6" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
];

// ─── Main Checkout Page ──────────────────────────────────────────────────────
export default function Checkout({ setPage, showToast, checkoutData }) {
  const { user, profile } = useAuth();
  const [plans, setPlans]               = useState(DEFAULT_PLANS);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [couponCode, setCouponCode]     = useState("");
  const [couponResult, setCouponResult] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("paypal");
  const [paymentDone, setPaymentDone]   = useState(false);
  const [existingSub, setExistingSub]   = useState(null);
  const [loading, setLoading]           = useState(true);
  const [instapayPending, setInstapayPending] = useState(false);
  const [autoRenew, setAutoRenew]       = useState(true);
  const [grantError, setGrantError]     = useState(null);
  const [grantRetrying, setGrantRetrying] = useState(false);
  const lastPaymentDataRef = useRef(null);

  const couponAppliedRef = useRef(false);
  const appliedCouponKey = useRef(null);
  const [couponAppliedState, setCouponAppliedState] = useState(false);

  const isExamPurchase = !!checkoutData?.examId;
  const examId    = checkoutData?.examId    || null;
  const examTitle = checkoutData?.examTitle || "Exam";
  const examPrice = checkoutData?.examPrice || 0;
  const incomingCoupon = checkoutData?.couponCode || null;
  const autoAppliedRef = useRef(false);

  useEffect(() => {
    const storedKey = sessionStorage.getItem("applied_coupon_for_checkout");
    if (storedKey) {
      couponAppliedRef.current = true;
      appliedCouponKey.current = storedKey;
      setCouponAppliedState(true);
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      const [settings, sub] = await Promise.all([
        getPlatformSettings(),
        user ? getUserSubscription(user.uid) : null,
      ]);
      setPlans(settings.plans || DEFAULT_PLANS);
      setExistingSub(sub);
      if (!isExamPurchase) setSelectedPlan(settings.plans?.monthly || DEFAULT_PLANS.monthly);

      if (incomingCoupon && examId && !autoAppliedRef.current && !couponAppliedRef.current) {
        autoAppliedRef.current = true;
        setCouponCode(incomingCoupon);
        try {
          const result = await validateCoupon(incomingCoupon, examId, null);
          if (result.valid) {
            setCouponResult(result);
            couponAppliedRef.current = true;
            appliedCouponKey.current = incomingCoupon;
            setCouponAppliedState(true);
            sessionStorage.setItem("applied_coupon_for_checkout", incomingCoupon);
            showToast({ msg: `🎉 Coupon "${incomingCoupon}" applied!`, type: "success" });
          }
        } catch (_) {}
      }
      setLoading(false);
    };
    load();
  }, [user, isExamPurchase, examId, incomingCoupon, showToast]);

  if (!user) {
    return (
      <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16, padding: 24, textAlign: "center" }}>
        <div style={{ fontSize: 40 }}>🔐</div>
        <h2 style={{ fontWeight: 900, fontSize: 22, margin: 0 }}>Sign In Required</h2>
        <p style={{ color: "var(--text2)", fontSize: 14, margin: 0 }}>Please sign in to complete your purchase.</p>
        <button onClick={() => setPage("auth", { mode: "login" })} style={{ padding: "12px 28px", background: "var(--gradient-accent, var(--accent))", border: "none", borderRadius: 12, color: "#fff", fontWeight: 800, cursor: "pointer", fontSize: 14, fontFamily: "inherit" }}>
          Sign In
        </button>
      </div>
    );
  }

  const basePrice   = isExamPurchase ? examPrice : (selectedPlan?.price || 0);
  const discountAmt = couponResult?.valid ? (couponResult.discountAmount || ((couponResult.discount / 100) * basePrice)) : 0;
  const finalPrice  = Math.max(0, basePrice - discountAmt);
  const description = isExamPurchase ? `FlexExams — ${examTitle}` : `FlexExams ${selectedPlan?.name || ""} Subscription`;

  const applyCoupon = async () => {
    if (!couponCode.trim()) {
      showToast({ msg: "⚠️ Please enter a coupon code first", type: "warning" });
      return;
    }
    if (couponAppliedState) return;
    setCouponLoading(true);
    const result = await validateCoupon(
      couponCode.trim(),
      isExamPurchase ? examId : null,
      isExamPurchase ? null : selectedPlan?.id,
      user.uid
    );
    setCouponResult(result);
    if (result.valid) {
      couponAppliedRef.current = true;
      appliedCouponKey.current = couponCode.trim();
      setCouponAppliedState(true);
      sessionStorage.setItem("applied_coupon_for_checkout", couponCode.trim());
      showToast({ msg: `🎉 Coupon applied! You save $${(result.discountAmount || (result.discount / 100 * basePrice)).toFixed(2)}`, type: "success" });
    } else {
      showToast({ msg: `❌ ${result.error}`, type: "error" });
    }
    setCouponLoading(false);
  };

  const handlePaymentSuccess = useCallback(async (data) => {
    lastPaymentDataRef.current = data;
    setGrantError(null);

    try {
      const txId = await saveTransaction(user.uid, {
        type:          isExamPurchase ? "exam" : "subscription",
        planId:        isExamPurchase ? null : selectedPlan?.id,
        examId:        isExamPurchase ? examId : null,
        examTitle:     isExamPurchase ? examTitle : null,
        amount:        finalPrice,
        originalAmount: basePrice,
        currency:      "USD",
        paymentMethod: data.method || "paypal",
        paypalOrderId: data.orderID || null,
        paypalPayerId: data.payerID || null,
        referenceId:   data.orderID || data.referenceId || null,
        status:        "completed",
        couponCode:    couponAppliedState ? couponCode : null,
        discount:      couponResult?.discount || 0,
        autoRenew:     isExamPurchase ? false : autoRenew,
      });

      if (isExamPurchase) {
        await grantExamAccess(user.uid, examId, txId);
      } else {
        await grantSubscription(user.uid, selectedPlan?.id, txId, autoRenew);
      }

      processReferralOnPurchase(user.uid, finalPrice).catch(() => {});
      sessionStorage.removeItem("applied_coupon_for_checkout");

      showToast({ msg: "✅ Payment successful! Access granted.", type: "success" });
      setPaymentDone(true);

    } catch (err) {
      console.error("handlePaymentSuccess error:", err);
      setGrantError(err?.message || "Access grant failed. Please contact support.");
      showToast({ msg: "⚠️ Payment received but access grant failed. Please contact support.", type: "error" });
    }
  }, [user, isExamPurchase, selectedPlan, examId, examTitle, finalPrice, basePrice, autoRenew, couponAppliedState, couponCode, couponResult, showToast]);

  const handlePaymentError = useCallback((err) => {
    console.error("Payment error:", err);
    showToast({ msg: `❌ Payment failed: ${err?.message || "Please try again."}`, type: "error" });
  }, [showToast]);

  const handleInstapaySuccess = useCallback((data) => {
    setInstapayPending(true);
    showToast({ msg: "✅ Payment submitted for verification. You'll be notified once approved.", type: "success" });
    sessionStorage.removeItem("applied_coupon_for_checkout");
  }, [showToast]);

  if (paymentDone) {
    return (
      <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16, padding: 24, textAlign: "center" }}>
        <div style={{ fontSize: 64 }}>🎉</div>
        <h2 style={{ fontWeight: 900, fontSize: 24, margin: 0 }}>Payment Successful!</h2>
        <p style={{ color: "var(--text2)", fontSize: 15, maxWidth: 340, margin: 0, lineHeight: 1.6 }}>
          {isExamPurchase ? `You now have full access to "${examTitle}".` : `Your ${selectedPlan?.name} subscription is now active.`}
        </p>
        <button onClick={() => setPage("dashboard")} style={{ padding: "14px 32px", background: "linear-gradient(135deg,#6366f1,#4f46e5)", border: "none", borderRadius: 14, color: "#fff", fontWeight: 800, cursor: "pointer", fontSize: 15, fontFamily: "inherit", boxShadow: "0 4px 16px rgba(99,102,241,0.4)" }}>
          Go to Dashboard
        </button>
      </div>
    );
  }

  if (instapayPending) {
    return (
      <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16, padding: 24, textAlign: "center" }}>
        <div style={{ fontSize: 64 }}>⏳</div>
        <h2 style={{ fontWeight: 900, fontSize: 24, margin: 0 }}>Payment Submitted</h2>
        <p style={{ color: "var(--text2)", fontSize: 15, maxWidth: 360, margin: 0, lineHeight: 1.6 }}>
          Your Instapay payment has been submitted for manual verification. Our team will review it within <strong>1–24 hours</strong> and you will receive a notification once approved.
        </p>
        <button onClick={() => setPage("dashboard")} style={{ padding: "14px 32px", background: "linear-gradient(135deg,#10b981,#059669)", border: "none", borderRadius: 14, color: "#fff", fontWeight: 800, cursor: "pointer", fontSize: 15, fontFamily: "inherit" }}>
          Back to Dashboard
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 14 }}>
        <Spinner size={32} color="var(--accent)" />
        <div style={{ color: "var(--text3)", fontSize: 14 }}>Loading checkout...</div>
      </div>
    );
  }

  return (
    <>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 16px" }}>
        <div style={{ marginBottom: 28 }}>
          <button onClick={() => window.history.back()} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text3)", display: "flex", gap: 6, alignItems: "center", fontSize: 14, fontFamily: "inherit", padding: 0, marginBottom: 16 }}>
            <Icon name="arrow" size={16} color="currentColor" />
            Back
          </button>
          <h1 style={{ fontWeight: 900, fontSize: 26, margin: 0, letterSpacing: "-0.02em" }}>
            {isExamPurchase ? "Purchase Exam Access" : "Subscribe to FlexExams"}
          </h1>
          <p style={{ color: "var(--text3)", fontSize: 14, marginTop: 6 }}>
            {isExamPurchase ? examTitle : "Choose your plan and preferred payment method"}
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 24, alignItems: "start" }}>
          {/* Left: checkout form */}
          <div>
            {!isExamPurchase && existingSub?.isActive && (
              <div style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.3)", borderRadius: 14, padding: "14px 18px", marginBottom: 20, display: "flex", gap: 10 }}>
                <Icon name="info" size={16} color="var(--gold, #d97706)" style={{ flexShrink: 0, marginTop: 1 }} />
                <div>
                  <div style={{ fontWeight: 800, fontSize: 13, color: "var(--gold, #d97706)" }}>Active Subscription</div>
                  <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 3 }}>
                    You already have an active {existingSub.planId} plan (expires {new Date(existingSub.endDate).toLocaleDateString()}). Purchasing again will extend your access.
                  </div>
                </div>
              </div>
            )}

            {grantError && (
              <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 14, padding: "14px 18px", marginBottom: 20 }}>
                <div style={{ fontWeight: 800, color: "var(--red)", fontSize: 13, marginBottom: 6 }}>⚠️ Access Grant Failed</div>
                <div style={{ fontSize: 12, color: "var(--text2)", marginBottom: 10 }}>{grantError}</div>
                <button
                  onClick={async () => {
                    if (!lastPaymentDataRef.current) return;
                    setGrantRetrying(true);
                    await handlePaymentSuccess(lastPaymentDataRef.current);
                    setGrantRetrying(false);
                  }}
                  disabled={grantRetrying}
                  style={{ padding: "8px 18px", background: "var(--red)", border: "none", borderRadius: 8, color: "#fff", fontWeight: 800, cursor: "pointer", fontSize: 13, fontFamily: "inherit", display: "flex", gap: 6, alignItems: "center" }}
                >
                  {grantRetrying ? <><Spinner size={14} color="#fff" /> Retrying...</> : "Retry Access Grant"}
                </button>
              </div>
            )}

            {!isExamPurchase && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>Select Plan</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {Object.values(plans).map(plan => (
                    <div
                      key={plan.id}
                      onClick={() => setSelectedPlan(plan)}
                      style={{
                        border: `2px solid ${selectedPlan?.id === plan.id ? "var(--accent)" : "var(--border)"}`,
                        borderRadius: 14, padding: "16px", cursor: "pointer",
                        background: selectedPlan?.id === plan.id ? "rgba(99,102,241,0.07)" : "var(--bg2)",
                        transition: "all 0.2s", position: "relative",
                      }}
                    >
                      {plan.savingsPercent && (
                        <div style={{ position: "absolute", top: -10, right: 12, background: "linear-gradient(135deg,#10b981,#059669)", color: "#fff", borderRadius: 100, padding: "2px 8px", fontSize: 9, fontWeight: 900 }}>
                          SAVE {plan.savingsPercent}%
                        </div>
                      )}
                      <div style={{ fontWeight: 900, fontSize: 15, color: "var(--text)", marginBottom: 4 }}>{plan.name}</div>
                      <div style={{ fontSize: 22, fontWeight: 900, color: "var(--accent)" }}>
                        ${plan.price}<span style={{ fontSize: 13, fontWeight: 600, color: "var(--text3)" }}>/{plan.interval}</span>
                      </div>
                      {plan.monthlyEquivalent && (
                        <div style={{ fontSize: 11, color: "var(--green)", fontWeight: 700, marginTop: 2 }}>${plan.monthlyEquivalent}/month billed annually</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!isExamPurchase && paymentMethod !== "instapay" && (
              <AutoRenewToggle value={autoRenew} onChange={setAutoRenew} planId={selectedPlan?.id} />
            )}

            <div style={{ background: "var(--bg2)", border: "1.5px solid var(--border)", borderRadius: 16, padding: "16px 18px", marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10, display: "flex", gap: 7, alignItems: "center" }}>
                <Icon name="tag" size={14} color="var(--text3)" /> Coupon Code
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  type="text"
                  value={couponCode}
                  onChange={e => { if (!couponAppliedState) setCouponCode(e.target.value.toUpperCase()); }}
                  placeholder="Enter coupon code"
                  disabled={couponAppliedState}
                  style={{
                    flex: 1, padding: "11px 14px", borderRadius: 10,
                    border: "1.5px solid var(--border)", background: "var(--bg)",
                    color: "var(--text)", fontSize: 14, fontFamily: "inherit",
                    outline: "none", opacity: couponAppliedState ? 0.7 : 1,
                    textTransform: "uppercase",
                  }}
                  onKeyDown={e => e.key === "Enter" && applyCoupon()}
                  onFocus={e => (e.target.style.borderColor = "var(--accent)")}
                  onBlur={e  => (e.target.style.borderColor = "var(--border)")}
                />
                <button
                  onClick={applyCoupon}
                  disabled={couponAppliedState || couponLoading || !couponCode.trim()}
                  style={{
                    padding: "11px 18px", borderRadius: 10, border: "1.5px solid var(--accent)",
                    background: couponAppliedState ? "rgba(16,185,129,0.12)" : "transparent",
                    color: couponAppliedState ? "var(--green)" : "var(--accent)",
                    fontWeight: 800, cursor: (couponAppliedState || !couponCode.trim()) ? "default" : "pointer",
                    fontSize: 13, fontFamily: "inherit", display: "flex", gap: 6, alignItems: "center",
                    opacity: (couponAppliedState || !couponCode.trim()) ? 0.6 : 1,
                    transition: "all 0.15s",
                  }}
                >
                  {couponLoading ? <Spinner size={14} color="currentColor" /> : couponAppliedState ? <><Icon name="checkCircle" size={14} color="var(--green)" /> Applied</> : "Apply"}
                </button>
              </div>
              {couponResult?.valid && (
                <div style={{ marginTop: 8, fontSize: 12, color: "var(--green)", display: "flex", gap: 6, alignItems: "center" }}>
                  <Icon name="check" size={13} color="var(--green)" />
                  Coupon applied — you save ${discountAmt.toFixed(2)}!
                </div>
              )}
              {couponResult?.error && (
                <div style={{ marginTop: 8, fontSize: 12, color: "var(--red)", display: "flex", gap: 6 }}>
                  <Icon name="x" size={13} color="var(--red)" />{couponResult.error}
                </div>
              )}
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>Payment Method</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 8 }}>
                {PAYMENT_METHODS.map(m => (
                  <div
                    key={m.id}
                    onClick={() => setPaymentMethod(m.id)}
                    style={{
                      border: `2px solid ${paymentMethod === m.id ? "var(--accent)" : "var(--border)"}`,
                      borderRadius: 14, padding: "14px 10px", cursor: "pointer",
                      background: paymentMethod === m.id ? "rgba(99,102,241,0.06)" : "var(--bg2)",
                      textAlign: "center", transition: "all 0.2s", position: "relative",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "center", marginBottom: 6 }}>{m.icon}</div>
                    <div style={{ fontSize: 12, fontWeight: 800, color: "var(--text)" }}>{m.label}</div>
                    <div style={{ fontSize: 10, color: "var(--text3)", marginTop: 2 }}>{m.desc}</div>
                    {paymentMethod === m.id && (
                      <div style={{ position: "absolute", top: 6, right: 6 }}>
                        <Icon name="checkCircle" size={14} color="var(--accent)" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: "var(--bg2)", border: "1.5px solid var(--border)", borderRadius: 18, padding: 22 }}>
              {finalPrice === 0 ? (
                <button
                  onClick={() => handlePaymentSuccess({ method: "free", orderID: "free_" + Date.now() })}
                  style={{ width: "100%", padding: "14px", background: "linear-gradient(135deg,#10b981,#059669)", border: "none", borderRadius: 12, color: "#fff", fontWeight: 800, cursor: "pointer", fontSize: 15, fontFamily: "inherit", boxShadow: "0 4px 16px rgba(16,185,129,0.3)" }}
                >
                  🎉 Claim Free Access
                </button>
              ) : paymentMethod === "paypal" ? (
                <PayPalButton
                  amount={finalPrice}
                  description={description}
                  onSuccess={(data) => handlePaymentSuccess({ ...data, method: "paypal" })}
                  onError={handlePaymentError}
                  disabled={!isExamPurchase && existingSub?.isActive}
                />
              ) : (
                <InstapayForm
                  amount={finalPrice}
                  description={description}
                  userId={user.uid}
                  planId={!isExamPurchase ? selectedPlan?.id : null}
                  examId={examId}
                  onSuccess={handleInstapaySuccess}
                  onError={handlePaymentError}
                />
              )}
            </div>
          </div>

          {/* Right: Order summary */}
          <div style={{ background: "var(--bg2)", border: "1.5px solid var(--border)", borderRadius: 20, padding: 24, position: "sticky", top: "var(--sticky-top-offset, 84px)" }}>
            <div style={{ fontSize: 15, fontWeight: 900, marginBottom: 20, color: "var(--text)" }}>Order Summary</div>

            <div style={{ borderBottom: "1px solid var(--border)", paddingBottom: 16, marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 14 }}>
                <span style={{ color: "var(--text2)" }}>{isExamPurchase ? examTitle : `${selectedPlan?.name} Plan`}</span>
                <span style={{ fontWeight: 700 }}>${basePrice.toFixed(2)}</span>
              </div>
              {discountAmt > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "var(--green)" }}>
                  <span>Coupon ({couponCode})</span>
                  <span>-${discountAmt.toFixed(2)}</span>
                </div>
              )}
              {!isExamPurchase && paymentMethod !== "instapay" && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--text3)", marginTop: 6 }}>
                  <span>Billing</span>
                  <span style={{ fontWeight: 700 }}>{autoRenew ? `Auto-renew / ${selectedPlan?.interval}` : "One-time"}</span>
                </div>
              )}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 20, fontWeight: 900, marginBottom: 22 }}>
              <span>Total</span>
              <span style={{ color: "var(--accent)" }}>${finalPrice.toFixed(2)}</span>
            </div>

            <div style={{ fontSize: 11, fontWeight: 800, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>What's Included</div>
            {(isExamPurchase ? [
              "Full access to all exam questions",
              "Detailed answer explanations",
              "Timed & Practice modes",
              "Official PDF certificate",
            ] : (selectedPlan?.features || [])).map((f, i) => (
              <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 8, fontSize: 12, color: "var(--text2)" }}>
                <Icon name="check" size={13} color="var(--green)" style={{ flexShrink: 0, marginTop: 1 }} />
                <span>{f}</span>
              </div>
            ))}

            <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
              {[
                { icon: "shield", text: "Secure & encrypted payment" },
                { icon: "lock",   text: autoRenew && !isExamPurchase ? "Cancel anytime — no fees" : "One-time charge only" },
                { icon: "star",   text: "Trusted by 100K+ learners" },
              ].map((b, i) => (
                <div key={i} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8, fontSize: 12, color: "var(--text3)" }}>
                  <Icon name={b.icon} size={14} color="var(--accent)" />
                  <span>{b.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}