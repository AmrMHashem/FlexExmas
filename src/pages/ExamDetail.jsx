// pages/MyExams.jsx — v6.4 Notifications: cancel sends notif + no double-submit
// ✅ إصلاح: عدم حذف العملية بعد الكنسل، فقط تغيير الحالة مع رسالة حذف بعد أسبوع
// ✅ إصلاح: زر الـ Refund يستخدم لمرة واحدة فقط (حتى بعد الرفض أو القبول)
// ✅ الكنسل يؤثر فقط على الاختبار المحدد (يدعم array أو object)
// ✅ فاتورة احترافية باسم FlexExams
// ✅ حقل استرداد ديناميكي حسب طريقة الدفع
// ✅ إصلاح: بقاء الزر معطلاً بعد الريفرش باستخدام localStorage

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "../hooks/useAuth";
import {
  getUserResults,
  getEnrolledExams,
  unenrollUserFromExam,
  getExamCompletionPercentage,
  clearExamProgress,
  getUserCertificates,
  getQuestions,
} from "../services/firestore";
import { Card, Btn, Spinner, Empty, Icon } from "../components/UI";
import {
  getUserTransactions,
  submitRefundRequest,
  checkRefundEligibility,
  getUserSubscription,
} from "../services/payment";
import { generatePDFCertificate, getVerifyURL } from "../utils/pdfCertificate";

// ─── helpers ────────────────────────────────────────────────────────────────
const fmtDate = (d, opts = {}) => {
  if (!d) return "—";
  const date = d?.toDate ? d.toDate() : new Date(d);
  return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", ...opts });
};
const fmtTime = (d) => {
  if (!d) return "";
  const date = d?.toDate ? d.toDate() : new Date(d);
  return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
};
const payLabel = (m) => ({
  paypal:   "PayPal",
  stripe:   "Stripe",
  instapay: "Instapay",
  free:     "Free Access",
  reward:   "Reward / Admin Grant",
  coupon:   "Coupon (Free)",
  admin:    "Admin Grant",
}[m] || m || "Unknown");

const STATUS_MAP = {
  completed:      { bg: "rgba(16,185,129,0.12)",  color: "#10b981", label: "✅ Completed" },
  refund_pending: { bg: "rgba(245,158,11,0.12)",  color: "#f59e0b", label: "⏳ Refund Pending" },
  refunded:       { bg: "rgba(99,102,241,0.12)",  color: "#818cf8", label: "↩ Refunded" },
  refund_rejected:{ bg: "rgba(239,68,68,0.12)",   color: "#ef4444", label: "❌ Refund Rejected" },
  pending:        { bg: "rgba(245,158,11,0.12)",  color: "#f59e0b", label: "⏳ Pending" },
  failed:         { bg: "rgba(239,68,68,0.12)",   color: "#ef4444", label: "❌ Failed" },
  cancelled:      { bg: "rgba(100,116,139,0.12)", color: "#64748b", label: "❌ Cancelled" },
};

const REASONS = [
  "Changed my mind",
  "Didn't meet expectations",
  "Technical issues",
  "Purchased by mistake",
  "Found a better alternative",
  "Other",
];

// ─── Effective Transaction ID (matches admin Revenue panel) ─────────────────
function getTxId(tx) {
  return tx.id || tx.paypalOrderId || tx.stripePaymentId || tx.referenceId || "—";
}

// ─── Derive effective payment method label ───────────────────────────────────
function getPayMethodLabel(tx) {
  const m = tx.paymentMethod;
  if (!m || m === "") {
    if (tx.paypalOrderId) return "PayPal";
    if (tx.stripePaymentId) return "Stripe";
    if (tx.referenceId && tx.referenceId.toLowerCase().includes("instapay")) return "Instapay";
    return "PayPal";
  }
  if (m === "free" || (tx.amount === 0 && !tx.couponCode)) return "Free Access";
  if (m === "reward" || m === "admin") return "Admin Grant";
  if (m === "coupon" || (tx.couponCode && tx.amount === 0)) return `Free Coupon (${tx.couponCode})`;
  return payLabel(m);
}

// ─── Get refund account field label & placeholder based on payment method ───
function getRefundAccountConfig(tx) {
  const method = tx.paymentMethod || (tx.paypalOrderId ? "paypal" : tx.stripePaymentId ? "stripe" : tx.referenceId?.includes("instapay") ? "instapay" : "paypal");
  switch (method) {
    case "paypal":
      return { label: "Refund to PayPal", placeholder: "your-email@paypal.com", type: "email" };
    case "stripe":
      return { label: "Refund to Stripe Account", placeholder: "account@stripe.com or stripe account ID", type: "text" };
    case "instapay":
      return { label: "Instapay Details", placeholder: "Instapay account name or phone number", type: "text" };
    default:
      return { label: "Refund Account (optional)", placeholder: "account identifier", type: "text" };
  }
}

// ─── Cancel Subscription Modal ───────────────────────────────────────────────
function CancelSubscriptionModal({ tx, onClose, onConfirm, confirming }) {
  const [understood, setUnderstood] = useState(false);
  const title = tx?.type === "subscription"
    ? `${tx.planId === "monthly" ? "Monthly" : "Yearly"} Subscription`
    : "Purchase";

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
      }}
    >
      <div style={{
        background: "var(--bg2)", border: "2px solid rgba(220,38,38,0.4)",
        borderRadius: 24, padding: 32, maxWidth: 460, width: "100%",
        boxShadow: "0 32px 100px rgba(0,0,0,0.5)",
      }}>
        <div style={{ textAlign: "center", marginBottom: 18 }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(220,38,38,0.1)", border: "2px solid rgba(220,38,38,0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto", fontSize: 28 }}>
            🚫
          </div>
        </div>
        <h3 style={{ textAlign: "center", fontSize: 20, fontWeight: 900, color: "var(--red,#dc2626)", marginBottom: 8 }}>
          Cancel {tx?.type === "subscription" ? "Subscription" : "Purchase"}
        </h3>
        <p style={{ textAlign: "center", fontSize: 13, color: "var(--text2)", marginBottom: 22, lineHeight: 1.7 }}>
          You are about to cancel your <strong style={{ color: "var(--text)" }}>{title}</strong>.<br />
          Your access will be <strong style={{ color: "var(--red,#dc2626)" }}>revoked immediately</strong>.
        </p>
        <div style={{ background: "rgba(220,38,38,0.07)", border: "1.5px solid rgba(220,38,38,0.25)", borderRadius: 14, padding: "14px 18px", marginBottom: 20, fontSize: 13, lineHeight: 1.8 }}>
          <div style={{ fontWeight: 800, color: "var(--red,#dc2626)", marginBottom: 6 }}>⚠️ By cancelling:</div>
          <ul style={{ margin: 0, padding: "0 0 0 18px", color: "var(--text2)" }}>
            <li>You <strong>forfeit any remaining access period</strong></li>
            <li>Access will be <strong>immediately revoked</strong></li>
            <li>No automatic refund — submit a refund request separately if eligible</li>
          </ul>
        </div>
        <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer", marginBottom: 22, fontSize: 13, color: "var(--text2)", lineHeight: 1.6 }}>
          <input
            type="checkbox"
            checked={understood}
            onChange={(e) => setUnderstood(e.target.checked)}
            style={{ marginTop: 3, width: 16, height: 16, cursor: "pointer", accentColor: "var(--red,#dc2626)", flexShrink: 0 }}
          />
          I understand that I will <strong>lose access immediately</strong> and I am forfeiting any remaining paid period.
        </label>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={onClose}
            style={{ flex: 1, padding: "13px", borderRadius: 12, border: "1.5px solid var(--border)", background: "transparent", color: "var(--text2)", fontWeight: 700, cursor: "pointer", fontSize: 13, fontFamily: "inherit" }}
            onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg3)"}
            onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
          >Keep Access</button>
          <button
            onClick={onConfirm}
            disabled={!understood || confirming}
            style={{
              flex: 1, padding: "13px", borderRadius: 12, fontWeight: 800, fontSize: 13,
              fontFamily: "inherit", border: "none", transition: "all 0.2s",
              cursor: (!understood || confirming) ? "not-allowed" : "pointer",
              background: understood ? "linear-gradient(135deg,#dc2626,#b91c1c)" : "var(--bg3)",
              color: understood ? "#fff" : "var(--text3)",
              opacity: confirming ? 0.7 : 1,
              boxShadow: understood ? "0 4px 16px rgba(220,38,38,0.35)" : "none",
            }}
          >
            {confirming ? "Cancelling…" : "🚫 Yes, Cancel Now"}
          </button>
        </div>
      </div>
    </div>
  );
}

function checkRefundEligibilityExtended(tx, usagePercent = 0) {
  if (!tx) return { eligible: false, reason: "Transaction not found" };
  // If transaction already has a refund request (any status other than completed/pending initial) → not eligible
  if (tx.status && !["completed", "pending"].includes(tx.status))
    return { eligible: false, reason: "Refund already requested or processed for this transaction" };
  if (tx.amount === 0 || tx.paymentMethod === "reward" || tx.paymentMethod === "free")
    return { eligible: false, reason: "Free or gifted access — not eligible for refund" };
  if (tx.couponCode && (tx.discount >= tx.originalAmount || tx.amount === 0))
    return { eligible: false, reason: "100% coupon applied — no refund available" };
  if (tx._adminGranted || tx.isAdminGranted)
    return { eligible: false, reason: "Admin-granted access — not eligible for refund" };

  const purchaseDate = tx.createdAt?.toDate ? tx.createdAt.toDate() : new Date(tx.createdAt);
  const daysSince = (Date.now() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24);
  if (daysSince > 7)
    return { eligible: false, reason: "Refund window has expired (7 days)" };
  if (usagePercent >= 15)
    return { eligible: false, reason: `You've used ${usagePercent.toFixed(0)}% of the exam (limit: 15%)` };
  
  return { eligible: true, reason: "" };
}

// ─── Refund Modal with dynamic account field based on payment method ────────
function RefundModal({ tx, exams, onClose, onSubmit, submitting }) {
  const [reason, setReason]       = useState("");
  const [comment, setComment]     = useState("");
  const [refundAccount, setRefundAccount] = useState("");

  const getTxDate = () => {
    if (tx.createdAt?.toDate) return tx.createdAt.toDate();
    if (tx.createdAt) return new Date(tx.createdAt);
    return new Date();
  };
  const txDate = getTxDate();
  const daysSince = Math.floor((Date.now() - txDate.getTime()) / 86400000);
  const daysLeft  = Math.max(0, 7 - daysSince);
  const elig = checkRefundEligibilityExtended(tx, 0);
  const accountConfig = getRefundAccountConfig(tx);
  const canSubmit = elig.eligible && reason.length > 0 && !submitting;

  const examTitle =
    tx.type === "subscription"
      ? `${tx.planId === "monthly" ? "Monthly" : "Yearly"} Subscription`
      : (exams.find((e) => e.id === tx.examId)?.title || "Exam Purchase");

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(0,0,0,0.72)", backdropFilter: "blur(6px)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
      }}
    >
      <div style={{
        background: "var(--bg2)", border: "1.5px solid var(--border)",
        borderRadius: 24, padding: 32, maxWidth: 500, width: "100%",
        boxShadow: "0 32px 100px rgba(0,0,0,0.5)",
        maxHeight: "90vh", overflowY: "auto",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 22 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--red)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>↩ Refund Request</div>
            <h3 style={{ fontSize: 19, fontWeight: 900, color: "var(--text)", margin: 0, marginBottom: 4 }}>{examTitle}</h3>
            <div style={{ fontSize: 26, fontWeight: 900, color: "var(--green)" }}>${(tx.amount || 0).toFixed(2)}</div>
          </div>
          <button onClick={onClose} style={{ width: 34, height: 34, borderRadius: "50%", border: "1.5px solid var(--border)", background: "var(--bg3)", color: "var(--text2)", cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>×</button>
        </div>
        
        <div style={{
          padding: "12px 16px", borderRadius: 12, marginBottom: 20,
          background: elig.eligible ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.08)",
          border: `1.5px solid ${elig.eligible ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}`,
        }}>
          {elig.eligible
            ? <div style={{ fontSize: 13, color: "#10b981", fontWeight: 700 }}>✅ Eligible · {daysLeft} day{daysLeft !== 1 ? "s" : ""} left in refund window</div>
            : <div style={{ fontSize: 13, color: "var(--red)", fontWeight: 700 }}>⛔ {elig.reason}</div>}
        </div>

        <div style={{ background: "var(--bg3)", borderRadius: 12, padding: "12px 16px", marginBottom: 20, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 16px", fontSize: 12 }}>
          {[
            ["Date",    fmtDate(tx.createdAt)],
            ["Method",  getPayMethodLabel(tx)],
            ["Type",    tx.type === "subscription" ? "Subscription" : "Exam"],
            ["Status",  STATUS_MAP[tx.status]?.label || "Completed"],
          ].map(([label, val]) => (
            <div key={label}>
              <div style={{ color: "var(--text3)", marginBottom: 2 }}>{label}</div>
              <strong style={{ color: "var(--text)" }}>{val}</strong>
            </div>
          ))}
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 11, fontWeight: 800, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 10 }}>
            Reason <span style={{ color: "var(--red)" }}>*</span>
          </label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
            {REASONS.map((r) => (
              <button
                key={r} onClick={() => setReason(r)} disabled={!elig.eligible}
                style={{
                  padding: "7px 13px", borderRadius: 99, fontSize: 12, fontWeight: 600,
                  cursor: elig.eligible ? "pointer" : "not-allowed", fontFamily: "inherit",
                  transition: "all 0.15s", opacity: elig.eligible ? 1 : 0.45,
                  border: `1.5px solid ${reason === r ? "var(--accent)" : "var(--border)"}`,
                  background: reason === r ? "var(--accent-soft,rgba(99,102,241,0.1))" : "var(--bg3)",
                  color: reason === r ? "var(--accent)" : "var(--text2)",
                }}
              >{r}</button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 11, fontWeight: 800, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 6 }}>
            Additional Comments <span style={{ color: "var(--text3)", fontWeight: 400, fontSize: 10, textTransform: "none" }}>(optional)</span>
          </label>
          <textarea
            value={comment} onChange={(e) => setComment(e.target.value)}
            disabled={!elig.eligible} rows={3} maxLength={500}
            placeholder="Any additional details about your request…"
            style={{ width: "100%", padding: "11px 14px", borderRadius: 11, border: "1.5px solid var(--border)", background: "var(--bg3)", color: "var(--text)", fontSize: 13, fontFamily: "inherit", outline: "none", resize: "vertical", boxSizing: "border-box", opacity: elig.eligible ? 1 : 0.45 }}
            onFocus={(e) => { if (elig.eligible) e.target.style.borderColor = "var(--accent)"; }}
            onBlur={(e) => e.target.style.borderColor = "var(--border)"}
          />
          <div style={{ textAlign: "right", fontSize: 10, color: "var(--text3)", marginTop: 3 }}>{comment.length}/500</div>
        </div>

        {/* Dynamic refund account field based on payment method */}
        <div style={{ marginBottom: 22 }}>
          <label style={{ fontSize: 11, fontWeight: 800, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 6 }}>
            {accountConfig.label} <span style={{ color: "var(--text3)", fontWeight: 400, fontSize: 10, textTransform: "none" }}>(optional)</span>
          </label>
          <input
            value={refundAccount} onChange={(e) => setRefundAccount(e.target.value)}
            disabled={!elig.eligible} type={accountConfig.type} placeholder={accountConfig.placeholder}
            style={{ width: "100%", padding: "11px 14px", borderRadius: 11, border: "1.5px solid var(--border)", background: "var(--bg3)", color: "var(--text)", fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box", opacity: elig.eligible ? 1 : 0.45 }}
            onFocus={(e) => { if (elig.eligible) e.target.style.borderColor = "var(--accent)"; }}
            onBlur={(e) => e.target.style.borderColor = "var(--border)"}
          />
        </div>

        <div style={{ fontSize: 11, color: "var(--text3)", lineHeight: 1.7, background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 10, padding: "10px 14px", marginBottom: 20 }}>
          ⚠️ Window: <strong>7 days</strong> · Max usage: <strong>15%</strong> · Processing: <strong>3–5 business days</strong>. Goes to admin for review.
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onClose}
            style={{ flex: 1, padding: "13px", borderRadius: 12, border: "1.5px solid var(--border)", background: "transparent", color: "var(--text2)", fontWeight: 700, cursor: "pointer", fontSize: 13, fontFamily: "inherit" }}
            onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg3)"}
            onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
          >Cancel</button>
          <button
            onClick={() => onSubmit({ reason: reason + (comment ? `\n\nDetails: ${comment}` : ""), refundAccount })}
            disabled={!canSubmit}
            title={!reason ? "Select a reason" : !elig.eligible ? elig.reason : "Submit refund request"}
            style={{
              flex: 2, padding: "13px", borderRadius: 12, fontWeight: 800, fontSize: 13,
              fontFamily: "inherit", border: "none", transition: "all 0.2s",
              cursor: canSubmit ? "pointer" : "not-allowed",
              background: canSubmit ? "linear-gradient(135deg,#dc2626,#b91c1c)" : "var(--bg3)",
              color: canSubmit ? "#fff" : "var(--text3)",
              opacity: submitting ? 0.7 : 1,
              boxShadow: canSubmit ? "0 4px 16px rgba(220,38,38,0.35)" : "none",
            }}
          >
            {submitting ? "⏳ Submitting…" : canSubmit ? "↩ Submit Refund Request" : !reason ? "Select a reason first" : elig.reason}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Professional Invoice Generator with "FlexExams" brand ─────────────────────────
function generateInvoiceHTML(tx, examTitle, txDate, getPayMethodLabel, getTxId) {
  const siteName = "FlexExams";
  const invNumber = (tx.id || "").slice(0, 12).toUpperCase();
  return `<!DOCTYPE html>
<html>
<head>
  <title>Invoice #${invNumber}</title>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background: #f1f5f9;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      padding: 40px 20px;
    }
    .invoice {
      max-width: 800px;
      width: 100%;
      background: white;
      border-radius: 32px;
      box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
      overflow: hidden;
    }
    .invoice-header {
      background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
      padding: 32px 40px;
      color: white;
    }
    .logo-area {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      flex-wrap: wrap;
      gap: 16px;
      margin-bottom: 24px;
    }
    .site-name {
      font-size: 28px;
      font-weight: 800;
      letter-spacing: -0.5px;
      background: linear-gradient(135deg, #c084fc, #818cf8);
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
    }
    .invoice-title {
      font-size: 14px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1px;
      opacity: 0.7;
    }
    .inv-number {
      font-size: 20px;
      font-weight: 700;
      margin-top: 4px;
    }
    .bill-info {
      display: flex;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 24px;
      margin-top: 24px;
      padding-top: 24px;
      border-top: 1px solid rgba(255,255,255,0.2);
    }
    .bill-section h4 {
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1px;
      opacity: 0.6;
      margin-bottom: 8px;
    }
    .bill-section p {
      font-size: 15px;
      font-weight: 500;
      line-height: 1.4;
    }
    .invoice-body {
      padding: 32px 40px;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 32px;
    }
    .items-table th {
      text-align: left;
      padding: 12px 0;
      border-bottom: 2px solid #e2e8f0;
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #64748b;
    }
    .items-table td {
      padding: 16px 0;
      border-bottom: 1px solid #e2e8f0;
      font-size: 15px;
      color: #1e293b;
    }
    .items-table tr:last-child td {
      border-bottom: none;
    }
    .total-row {
      background: #f8fafc;
      border-radius: 16px;
      padding: 20px;
      margin-top: 16px;
    }
    .total-line {
      display: flex;
      justify-content: space-between;
      font-size: 16px;
      padding: 8px 0;
    }
    .grand-total {
      font-size: 22px;
      font-weight: 800;
      color: #0f172a;
      border-top: 2px solid #e2e8f0;
      margin-top: 8px;
      padding-top: 16px;
    }
    .badge {
      display: inline-block;
      background: #dcfce7;
      color: #15803d;
      padding: 4px 12px;
      border-radius: 99px;
      font-size: 12px;
      font-weight: 700;
    }
    .footer {
      background: #f8fafc;
      padding: 20px 40px;
      text-align: center;
      font-size: 12px;
      color: #64748b;
      border-top: 1px solid #e2e8f0;
    }
    @media print {
      body { background: white; padding: 0; }
      .invoice { box-shadow: none; border-radius: 0; }
      button { display: none; }
    }
  </style>
</head>
<body>
<div class="invoice">
  <div class="invoice-header">
    <div class="logo-area">
      <div>
        <div class="site-name">${siteName}</div>
        <div style="font-size:13px; opacity:0.7; margin-top:4px;">Professional Certification Platform</div>
      </div>
      <div style="text-align:right;">
        <div class="invoice-title">INVOICE</div>
        <div class="inv-number">#${invNumber}</div>
      </div>
    </div>
    <div class="bill-info">
      <div class="bill-section">
        <h4>Billed To</h4>
        <p>${tx.userName || "Valued Customer"}<br>${tx.userEmail || ""}</p>
      </div>
      <div class="bill-section">
        <h4>Invoice Date</h4>
        <p>${txDate.toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}</p>
        <h4 style="margin-top:12px;">Transaction ID</h4>
        <p>${getTxId(tx)}</p>
      </div>
    </div>
  </div>
  <div class="invoice-body">
    <table class="items-table">
      <thead>
        <tr><th>Item</th><th>Type</th><th style="text-align:right;">Amount</th></tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>${examTitle}</strong><br><span style="font-size:12px; color:#64748b;">${tx.type === "subscription" ? "Recurring Subscription" : "One-time Exam Purchase"}</span></td>
          <td>${tx.type === "subscription" ? "Subscription" : "Exam"}</td>
          <td style="text-align:right;">$${Number(tx.amount || 0).toFixed(2)} USD</td>
        </tr>
        ${tx.couponCode ? `<tr><td colspan="2">🏷️ Coupon Applied: ${tx.couponCode}</td><td style="text-align:right; color:#059669;">-$${Number(tx.discount || 0).toFixed(2)} USD</td>` : ""}
      </tbody>
    </table>
    <div class="total-row">
      <div class="total-line"><span>Subtotal</span><span>$${Number(tx.originalAmount || tx.amount || 0).toFixed(2)} USD</span></div>
      ${tx.discount > 0 ? `<div class="total-line"><span>Discount</span><span style="color:#059669;">-$${Number(tx.discount).toFixed(2)} USD</span></div>` : ""}
      <div class="total-line grand-total"><span>Total Paid</span><span>$${Number(tx.amount || 0).toFixed(2)} USD</span></div>
    </div>
    <div style="margin-top: 24px; display: flex; justify-content: space-between; align-items: center;">
      <span class="badge">✅ ${tx.status || "Completed"}</span>
      <span style="font-size:12px; color:#64748b;">Payment Method: ${getPayMethodLabel(tx)}</span>
    </div>
  </div>
  <div class="footer">
    <p>Thank you for choosing ${siteName} — your trust is our priority.</p>
    <p style="margin-top:8px;">This is an official receipt. For support, contact support@flexexams.com</p>
    <button onclick="window.print()" style="margin-top:16px; padding:8px 20px; background:#1e293b; color:white; border:none; border-radius:99px; cursor:pointer; font-size:12px; font-weight:600;">🖨️ Print / Save PDF</button>
  </div>
</div>
</body>
</html>`;
}

// ─── Billing Tab ───────────────────────────────────────────────────────────
function BillingTab({ transactions, subscription, exams, setPage, showToast, user, loadingTransactions, refreshTransactions }) {
  const [showRefundModal, setShowRefundModal] = useState(null);
  const [submittingRefund, setSubmittingRefund] = useState(false);
  const [expandedTx, setExpandedTx] = useState(null);
  const [pendingInstapay, setPendingInstapay] = useState([]);
  const [cancelModal, setCancelModal] = useState(null);
  const [cancellingTx, setCancellingTx] = useState(false);
  
  // ✅ التعديل: استخدام localStorage للحفاظ على حالة طلبات الاسترداد بعد الريفرش
  const [localRefundedIds, setLocalRefundedIds] = useState(() => {
    const stored = localStorage.getItem("refunded_transactions");
    if (stored) {
      try {
        const arr = JSON.parse(stored);
        return new Set(arr);
      } catch(e) {}
    }
    return new Set();
  });

  React.useEffect(() => {
    if (!user?.uid) return;
    import("../services/payment").then(({ getAllInstapayPayments }) => {
      getAllInstapayPayments().then(payments => {
        const myPending = (payments || []).filter(p => p.userId === user.uid && p.status === "pending");
        setPendingInstapay(myPending);
      }).catch(() => {});
    });
  }, [user]);

  const totalSpent    = transactions.reduce((s, t) => s + (t.amount || 0), 0);
  const refundable    = transactions.filter((t) => {
    const isRefunded = ["refunded","refund_pending","refund_rejected"].includes(t.status) || localRefundedIds.has(t.id);
    return !isRefunded && checkRefundEligibilityExtended(t, 0).eligible;
  }).length;

  if (loadingTransactions) {
    return (
      <div style={{ textAlign: "center", padding: 60 }}>
        <Spinner size={44} color="var(--accent)" />
        <p style={{ marginTop: 16, color: "var(--text2)" }}>Loading your transactions...</p>
      </div>
    );
  }

  const handleRefundSubmit = async ({ reason, refundAccount }) => {
    if (submittingRefund) return; // منع الضغط المزدوج
    setSubmittingRefund(true);
    try {
      const elig = checkRefundEligibilityExtended(showRefundModal, 0);
      if (!elig.eligible) { showToast({ msg: `❌ ${elig.reason}`, type: "error" }); return; }
      const refundedTxId = showRefundModal.id;
      await submitRefundRequest(user.uid, {
        transactionId: showRefundModal.id,
        examId:  showRefundModal.examId  || null,
        planId:  showRefundModal.planId  || null,
        reason, refundAccount,
        amount:  showRefundModal.amount,
      });
      showToast({ msg: "✅ Refund request sent to admin for review!", type: "success" });
      // Note: submitRefundRequest() in payment.js already sends the refund_pending notification
      // and updates the transaction status — no need to duplicate here.
      
      // ✅ التعديل: تحديث الحالة محلياً وتخزينها في localStorage
      setLocalRefundedIds(prev => {
        const newSet = new Set([...prev, refundedTxId]);
        localStorage.setItem("refunded_transactions", JSON.stringify([...newSet]));
        return newSet;
      });
      
      setShowRefundModal(null);
      await refreshTransactions();
      setExpandedTx(null);
    } catch (e) {
      showToast({ msg: `❌ ${e.message}`, type: "error" });
    } finally {
      setSubmittingRefund(false);
    }
  };

  const handleCancelPurchase = async () => {
    if (!cancelModal) return;
    setCancellingTx(true);
    try {
      const { db } = await import("../firebase");
      const { doc, updateDoc, deleteField, arrayRemove, getDoc } = await import("firebase/firestore");

      if (cancelModal.type === "subscription") {
        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, {
          subscriptionStatus: "cancelled",
          hasActiveSubscription: false,
          premium: false,
          premiumPlanId: deleteField(),
          premiumUntil: deleteField(),
        });
        const subRef = doc(db, "subscriptions", user.uid);
        await updateDoc(subRef, {
          status: "cancelled",
          cancelledAt: new Date().toISOString(),
        }).catch(() => {});
      } else if (cancelModal.type === "exam" && cancelModal.examId) {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const userData = userSnap.data();
          const purchasedExams = userData.purchasedExams;
          
          if (Array.isArray(purchasedExams)) {
            await updateDoc(userRef, { purchasedExams: arrayRemove(cancelModal.examId) });
          } else if (purchasedExams && typeof purchasedExams === "object") {
            const updated = { ...purchasedExams };
            delete updated[cancelModal.examId];
            await updateDoc(userRef, { purchasedExams: updated });
          } else {
            await updateDoc(userRef, { purchasedExams: [] });
          }
        }
      }

      // ✅ لا نحذف المعاملة، فقط نغير حالتها إلى cancelled
      if (cancelModal.id && !cancelModal._synthesized) {
        const txRef = doc(db, "transactions", cancelModal.id);
        await updateDoc(txRef, { 
          status: "cancelled", 
          cancelledAt: new Date(),
        });
      }

      // ✅ إشعار تأكيد الإلغاء للعضو بتفاصيل كاملة
      try {
        const { sendNotification } = await import("../services/payment");
        const itemLabel = cancelModal.type === "subscription"
          ? `${cancelModal.planId === "monthly" ? "Monthly" : "Yearly"} Subscription`
          : (cancelModal.examTitle || "Exam Purchase");
        await sendNotification(user.uid, {
          type: "subscription_cancelled",
          title: "🚫 Purchase Cancelled",
          body: `Your ${itemLabel} has been cancelled. Access has been revoked immediately. The transaction record will be removed after 7 days. If you'd like a refund, please submit a refund request.`,
          data: {
            transactionId: cancelModal.id || "",
            planId: cancelModal.planId || null,
            examId: cancelModal.examId || null,
            cancelledAt: new Date().toISOString(),
          },
        });
      } catch { /* إشعار best-effort — لا نوقف العملية */ }

      showToast({ msg: "✅ Cancelled. Access revoked. Transaction will be auto-deleted after 7 days.", type: "success" });
      setCancelModal(null);
      await refreshTransactions();
    } catch (e) {
      showToast({ msg: `❌ ${e.message}`, type: "error" });
    } finally {
      setCancellingTx(false);
    }
  };

  const SubCard = () => {
    if (!subscription) return (
      <div style={{ borderRadius: 20, padding: "20px 24px", marginBottom: 28, background: "var(--bg2)", border: "1.5px dashed var(--border)", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
        <div style={{ fontSize: 36 }}>⭐</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: "var(--text)", marginBottom: 4 }}>No Active Subscription</div>
          <div style={{ fontSize: 13, color: "var(--text3)" }}>Upgrade to unlock all exams and earn certificates.</div>
        </div>
        <button onClick={() => setPage("pricing")} style={{ padding: "11px 22px", background: "var(--gradient-accent,var(--accent))", border: "none", borderRadius: 11, color: "#fff", fontWeight: 800, cursor: "pointer", fontSize: 13, fontFamily: "inherit" }}>View Plans →</button>
      </div>
    );

    const start   = new Date(subscription.startDate);
    const end     = new Date(subscription.endDate);
    const total   = end - start;
    const elapsed = Date.now() - start;
    const pct     = Math.max(0, Math.min(100, Math.round((elapsed / total) * 100)));
    const remaining = 100 - pct;
    const daysLeft  = Math.max(0, Math.round((end - Date.now()) / 86400000));
    const barColor  = remaining > 40 ? "#10b981" : remaining > 15 ? "#f59e0b" : "#ef4444";

    return (
      <div style={{ borderRadius: 20, padding: "24px 28px", marginBottom: 28, background: subscription.isActive ? "linear-gradient(135deg,rgba(16,185,129,0.07),rgba(16,185,129,0.02))" : "rgba(239,68,68,0.05)", border: `2px solid ${subscription.isActive ? "rgba(16,185,129,0.28)" : "rgba(239,68,68,0.28)"}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>{subscription.isActive ? "✅ Active Subscription" : "❌ Expired Subscription"}</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: "var(--text)", marginBottom: 10 }}>
              {subscription.planId === "monthly" ? "🗓️ Monthly Plan" : subscription.planId === "yearly" ? "📅 Yearly Plan" : subscription.planId}
            </div>
            <div style={{ display: "flex", gap: 20, flexWrap: "wrap", fontSize: 13, color: "var(--text3)" }}>
              <span>Started <strong style={{ color: "var(--text2)" }}>{fmtDate(subscription.startDate)}</strong></span>
              <span>Expires <strong style={{ color: subscription.isActive ? "#10b981" : "var(--red)" }}>{fmtDate(subscription.endDate)}</strong></span>
            </div>
          </div>
          {subscription.isActive && (
            <div style={{ minWidth: 200, textAlign: "right" }}>
              <div style={{ fontSize: 11, color: "var(--text3)", fontWeight: 700, marginBottom: 8 }}>Subscription Progress</div>
              <div style={{ height: 10, background: "var(--bg3)", borderRadius: 99, overflow: "hidden", marginBottom: 6 }}>
                <div style={{ height: "100%", width: `${pct}%`, background: barColor, borderRadius: 99, transition: "width 0.6s" }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                <span style={{ color: "var(--text3)" }}>{pct}% used</span>
                <span style={{ color: barColor, fontWeight: 800 }}>{daysLeft} days left</span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div style={{ maxWidth: 780 }}>
      <style>{`
        .tx-card { transition: border-color 0.2s, box-shadow 0.2s; }
        .tx-card:hover { border-color: rgba(99,102,241,0.4) !important; box-shadow: 0 8px 28px rgba(99,102,241,0.1); }
        .refund-active:hover { background: rgba(239,68,68,0.18) !important; transform: translateY(-1px); box-shadow: 0 4px 14px rgba(239,68,68,0.2); }
      `}</style>

      <SubCard />

      {transactions.length > 0 && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, flex: 1 }}>
            {[
              { icon: "💰", label: "Total Spent",     value: `$${totalSpent.toFixed(2)}`, color: "#10b981" },
              { icon: "🧾", label: "Transactions",    value: transactions.length,          color: "var(--accent)" },
              { icon: "↩",  label: "Refund Eligible", value: refundable,                  color: "#f59e0b" },
            ].map((s, i) => (
              <div key={i} style={{ background: "var(--bg2)", border: `1.5px solid ${s.color}20`, borderRadius: 16, padding: "16px 20px", display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: `${s.color}15`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>{s.icon}</div>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 3 }}>{s.label}</div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.value}</div>
                </div>
              </div>
            ))}
          </div>
          <button onClick={refreshTransactions} style={{ marginLeft: 16, padding: "8px 14px", borderRadius: 10, border: "1.5px solid var(--border)", background: "var(--bg3)", color: "var(--text2)", cursor: "pointer", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
            ⟳ Refresh
          </button>
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: "var(--text)" }}>💳 Transaction History</div>
        {transactions.length > 0 && <div style={{ fontSize: 12, color: "var(--text3)", fontWeight: 600 }}>{transactions.length} record{transactions.length !== 1 ? "s" : ""}</div>}
      </div>

      {pendingInstapay.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          {pendingInstapay.map((p) => (
            <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: "rgba(245,158,11,0.08)", border: "1.5px solid rgba(245,158,11,0.3)", borderRadius: 12, marginBottom: 8 }}>
              <div style={{ fontSize: 22 }}>🏦</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#d97706" }}>⏳ Instapay Pending Review</div>
                <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 2 }}>
                  Ref: {p.referenceId} · ${p.amountUSD ?? (parseFloat(p.amount) / 50).toFixed(2)} USD · Submitted {p.submittedAt?.toDate ? p.submittedAt.toDate().toLocaleDateString() : "recently"}
                </div>
              </div>
              <span style={{ fontSize: 11, fontWeight: 800, padding: "4px 10px", borderRadius: 99, background: "rgba(245,158,11,0.15)", color: "#d97706", border: "1px solid rgba(245,158,11,0.3)" }}>Pending</span>
            </div>
          ))}
        </div>
      )}

      {transactions.length === 0 ? (
        <div style={{ padding: "60px 24px", textAlign: "center", background: "var(--bg2)", border: "1.5px solid var(--border)", borderRadius: 20 }}>
          <div style={{ fontSize: 52, marginBottom: 16 }}>💳</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: "var(--text2)", marginBottom: 8 }}>No transactions yet</div>
          <div style={{ fontSize: 13, color: "var(--text3)", marginBottom: 22 }}>Your purchase history will appear here after your first payment.</div>
          <button onClick={() => setPage("pricing")} style={{ padding: "12px 24px", background: "var(--gradient-accent,var(--accent))", border: "none", borderRadius: 11, color: "#fff", fontWeight: 800, cursor: "pointer", fontSize: 14, fontFamily: "inherit" }}>Browse Plans →</button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {transactions.map((tx) => {
            const getTxDate = () => {
              if (tx.createdAt?.toDate) return tx.createdAt.toDate();
              if (tx.createdAt) return new Date(tx.createdAt);
              return new Date();
            };
            const txDate    = getTxDate();
            const daysSince = Math.floor((Date.now() - txDate.getTime()) / 86400000);
            const daysLeft  = Math.max(0, 7 - daysSince);
            const elig      = checkRefundEligibilityExtended(tx, 0);
            // isRefunded = any state where refund button should be disabled
            const isRefunded = ["refunded","refund_pending","refund_rejected"].includes(tx.status) || localRefundedIds.has(tx.id);
            const statusInfo = STATUS_MAP[tx.status] || STATUS_MAP.completed;
            const isExpanded = expandedTx === tx.id;

            const txTitle =
              tx.type === "subscription"
                ? `${tx.planId === "monthly" ? "Monthly" : tx.planId === "yearly" ? "Yearly" : tx.planId} Subscription`
                : (exams.find((e) => e.id === tx.examId)?.title || "Exam Purchase");

            return (
              <div key={tx.id} className="tx-card" style={{ background: "var(--bg2)", border: "1.5px solid var(--border)", borderRadius: 18, overflow: "hidden" }}>
                <div onClick={() => setExpandedTx(isExpanded ? null : tx.id)}
                  style={{ padding: "18px 22px", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap", cursor: "pointer" }}>
                  <div style={{ width: 50, height: 50, borderRadius: 14, background: tx.type === "subscription" ? "rgba(99,102,241,0.1)" : "rgba(6,182,212,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>
                    {tx.type === "subscription" ? "⭐" : "📋"}
                  </div>
                  <div style={{ flex: 1, minWidth: 180 }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: "var(--text)", marginBottom: 5 }}>{txTitle}</div>
                    <div style={{ display: "flex", gap: 14, flexWrap: "wrap", fontSize: 12, color: "var(--text3)" }}>
                      <span>📅 {fmtDate(tx.createdAt)}</span>
                      <span>🕐 {fmtTime(tx.createdAt)}</span>
                      <span>💳 {getPayMethodLabel(tx)}</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 7, flexShrink: 0 }}>
                    <div style={{ fontSize: 22, fontWeight: 900, color: isRefunded ? "var(--text3)" : "#10b981", textDecoration: isRefunded ? "line-through" : "none" }}>
                      ${(tx.amount || 0).toFixed(2)}
                    </div>
                    <div style={{ padding: "3px 10px", borderRadius: 99, background: statusInfo.bg, fontSize: 11, fontWeight: 700, color: statusInfo.color }}>
                      {statusInfo.label}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const w = window.open("", "_blank");
                        w.document.write(generateInvoiceHTML(tx, txTitle, txDate, getPayMethodLabel, getTxId));
                        w.document.close();
                      }}
                      style={{ padding: "5px 12px", borderRadius: 8, border: "1.5px solid rgba(99,102,241,0.3)", background: "rgba(99,102,241,0.08)", color: "var(--accent)", fontWeight: 700, cursor: "pointer", fontSize: 11, fontFamily: "inherit", display: "flex", alignItems: "center", gap: 4 }}
                    >🧾 Invoice</button>
                  </div>
                  <div style={{ fontSize: 14, color: "var(--text3)", transform: isExpanded ? "rotate(180deg)" : "none", transition: "transform 0.22s", flexShrink: 0 }}>▾</div>
                </div>

                {isExpanded && (
                  <div style={{ borderTop: "1px solid var(--border)", padding: "18px 22px", background: "var(--bg3)" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(155px,1fr))", gap: 10, marginBottom: 18 }}>
                      {[
                        { label: "Transaction ID",  value: getTxId(tx) },
                        { label: "Payment Method",  value: getPayMethodLabel(tx) },
                        { label: "Currency",        value: tx.currency || "USD" },
                        { label: "Type",            value: tx.type === "subscription" ? "Subscription" : "Exam" },
                        tx.couponCode  && { label: "🏷️ Coupon",   value: tx.couponCode },
                        tx.discount > 0 && { label: "Discount",    value: `-$${Number(tx.discount).toFixed(2)} USD` },
                        tx.originalAmount && Number(tx.originalAmount) !== Number(tx.amount) && { label: "Original Price", value: `$${Number(tx.originalAmount).toFixed(2)} USD` },
                        tx.paypalOrderId && { label: "PayPal Order", value: tx.paypalOrderId.slice(0, 20) + "…" },
                        tx.stripePaymentId && { label: "Stripe ID", value: tx.stripePaymentId.slice(0, 20) + "…" },
                        tx.referenceId && { label: "Reference ID", value: tx.referenceId },
                      ].filter(Boolean).map((d, i) => (
                        <div key={i} style={{ background: "var(--bg2)", borderRadius: 10, padding: "10px 14px" }}>
                          <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>{d.label}</div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text)", wordBreak: "break-all" }}>{d.value}</div>
                        </div>
                      ))}
                    </div>

                    <div style={{ marginBottom: 14 }}>
                      <button
                        onClick={() => {
                          const w = window.open("", "_blank");
                          w.document.write(generateInvoiceHTML(tx, txTitle, txDate, getPayMethodLabel, getTxId));
                          w.document.close();
                        }}
                        style={{ padding: "9px 18px", borderRadius: 10, border: "1.5px solid rgba(99,102,241,0.3)", background: "rgba(99,102,241,0.08)", color: "var(--accent)", fontWeight: 700, cursor: "pointer", fontSize: 12, fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6 }}
                      >
                        🧾 Download Invoice
                      </button>
                    </div>

                    {(tx.type === "subscription" || tx.type === "exam") &&
                     !["cancelled","refunded","refund_pending","refund_rejected"].includes(tx.status) && (
                      <div style={{ marginBottom: 14, padding: "14px 16px", background: "var(--bg2)", borderRadius: 12, border: "1.5px solid rgba(220,38,38,0.2)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 2 }}>
                            {tx.type === "subscription" ? "Cancel Subscription" : "Cancel Purchase"}
                          </div>
                          <div style={{ fontSize: 11, color: "var(--text3)" }}>
                            Access will be revoked immediately. Transaction kept for 7 days then auto-deleted.
                          </div>
                        </div>
                        <button
                          onClick={() => setCancelModal(tx)}
                          style={{ padding: "9px 18px", borderRadius: 10, fontWeight: 800, cursor: "pointer", fontSize: 12, fontFamily: "inherit", border: "1.5px solid rgba(220,38,38,0.4)", background: "rgba(220,38,38,0.08)", color: "var(--red,#dc2626)", transition: "all 0.18s", whiteSpace: "nowrap" }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(220,38,38,0.15)"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(220,38,38,0.08)"; }}
                        >🚫 Cancel</button>
                      </div>
                    )}

                    {tx.status === "cancelled" ? (
                      <div style={{ padding: "12px 16px", borderRadius: 12, background: "rgba(100,116,139,0.08)", border: "1.5px solid rgba(100,116,139,0.2)", fontSize: 13, color: "#64748b", fontWeight: 700 }}>
                        ❌ This transaction has been cancelled. It will be automatically deleted after 7 days.
                      </div>
                    ) : tx.status === "refund_pending" || (isRefunded && tx.status !== "refunded" && tx.status !== "refund_rejected") ? (
                      /* ── Refund Pending (under review) ── */
                      <div style={{ padding: "14px 16px", borderRadius: 12, background: "rgba(245,158,11,0.08)", border: "1.5px solid rgba(245,158,11,0.3)", display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ width: 38, height: 38, borderRadius: 10, background: "rgba(245,158,11,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>⏳</div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 800, color: "#d97706", marginBottom: 2 }}>Refund Request Under Review</div>
                          <div style={{ fontSize: 12, color: "var(--text3)" }}>Your refund request has been submitted and is being reviewed by the admin team. You will be notified once a decision is made.</div>
                        </div>
                      </div>
                    ) : tx.status === "refund_rejected" ? (
                      /* ── Refund Rejected ── */
                      <div style={{ padding: "14px 16px", borderRadius: 12, background: "rgba(239,68,68,0.08)", border: "1.5px solid rgba(239,68,68,0.25)", display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ width: 38, height: 38, borderRadius: 10, background: "rgba(239,68,68,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>❌</div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 800, color: "var(--red,#ef4444)", marginBottom: 2 }}>Refund Request Was Rejected</div>
                          <div style={{ fontSize: 12, color: "var(--text3)" }}>
                            Your refund request was reviewed and rejected by the admin.
                            {tx.adminNote && <span style={{ display: "block", marginTop: 4, color: "var(--text2)", fontStyle: "italic" }}>Admin note: "{tx.adminNote}"</span>}
                          </div>
                        </div>
                      </div>
                    ) : tx.status === "refunded" ? (
                      /* ── Refund Approved ── */
                      <div style={{ padding: "14px 16px", borderRadius: 12, background: "rgba(99,102,241,0.08)", border: "1.5px solid rgba(99,102,241,0.25)", display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ width: 38, height: 38, borderRadius: 10, background: "rgba(99,102,241,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>✅</div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 800, color: "#818cf8", marginBottom: 2 }}>Refund Approved — Access Revoked</div>
                          <div style={{ fontSize: 12, color: "var(--text3)" }}>
                            Your refund has been approved and exam access has been revoked. The amount will be credited to your account within 3–5 business days.
                            {tx.adminNote && <span style={{ display: "block", marginTop: 4, color: "var(--text2)", fontStyle: "italic" }}>Admin note: "{tx.adminNote}"</span>}
                          </div>
                        </div>
                      </div>
                    ) : !isRefunded ? (
                      /* ── Refund Not Requested Yet ── */
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, padding: "14px 16px", background: "var(--bg2)", borderRadius: 12, border: `1.5px solid ${elig.eligible ? "rgba(239,68,68,0.22)" : "var(--border)"}` }}>
                        <div>
                          {elig.eligible ? (
                            <>
                              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 3 }}>Refund Available</div>
                              <div style={{ fontSize: 12, color: "var(--text3)" }}>{daysLeft} day{daysLeft !== 1 ? "s" : ""} left in refund window</div>
                            </>
                          ) : (
                            <>
                              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text3)", marginBottom: 3 }}>Refund Not Available</div>
                              <div style={{ fontSize: 12, color: "var(--red)" }}>⛔ {elig.reason}</div>
                            </>
                          )}
                        </div>
                        {elig.eligible ? (
                          <button className="refund-active"
                            onClick={() => setShowRefundModal(tx)}
                            style={{ padding: "10px 20px", borderRadius: 10, fontWeight: 800, cursor: "pointer", fontSize: 13, fontFamily: "inherit", border: "1.5px solid rgba(239,68,68,0.5)", background: "rgba(239,68,68,0.1)", color: "var(--red)", transition: "all 0.18s", whiteSpace: "nowrap" }}
                          >↩ Request Refund</button>
                        ) : (
                          <button disabled title={elig.reason}
                            style={{ padding: "10px 20px", borderRadius: 10, fontWeight: 700, cursor: "not-allowed", fontSize: 13, fontFamily: "inherit", border: "1.5px solid var(--border)", background: "var(--bg3)", color: "var(--text3)", opacity: 0.6, whiteSpace: "nowrap" }}
                          >↩ Refund Unavailable</button>
                        )}
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {transactions.length > 0 && (
        <div style={{ marginTop: 24, padding: "14px 18px", background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.18)", borderRadius: 12, fontSize: 12, color: "var(--text3)", lineHeight: 1.8 }}>
          <strong style={{ color: "#f59e0b" }}>📋 Refund Policy:</strong> Requests accepted within <strong style={{ color: "var(--text2)" }}>7 days</strong> of purchase and less than <strong style={{ color: "var(--text2)" }}>15% exam usage</strong>. All requests go to the admin panel for review and are processed within <strong style={{ color: "var(--text2)" }}>3–5 business days</strong>. Once a refund is requested, the button is permanently disabled regardless of admin decision.
        </div>
      )}

      {cancelModal && (
        <CancelSubscriptionModal
          tx={cancelModal}
          onClose={() => setCancelModal(null)}
          onConfirm={handleCancelPurchase}
          confirming={cancellingTx}
        />
      )}

      {showRefundModal && (
        <RefundModal tx={showRefundModal} exams={exams} onClose={() => setShowRefundModal(null)} onSubmit={handleRefundSubmit} submitting={submittingRefund} />
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function MyExams({ setPage, setResultData, setActiveExam, exams, showToast }) {
  const { user } = useAuth();
  const [results, setResults]             = useState([]);
  const [enrolledExams, setEnrolledExams] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [tab, setTab]                     = useState("enrolled");
  const [filter, setFilter]               = useState("all");
  const [searchQuery, setSearchQuery]     = useState("");
  const [sortBy, setSortBy]               = useState("recent");
  const [unenrolling, setUnenrolling]     = useState(null);
  const [certificates, setCertificates]   = useState([]);
  const [loadingCerts, setLoadingCerts]   = useState(false);
  const [transactions, setTransactions]   = useState([]);
  const [subscription, setSubscription]   = useState(null);
  const [loadingTransactions, setLoadingTransactions] = useState(true);
  const [questionCounts, setQuestionCounts] = useState({});

  const loadTransactions = useCallback(async () => {
    if (!user) return;
    setLoadingTransactions(true);
    try {
      const txs = await getUserTransactions(user.uid);
      if (txs && txs.length > 0) {
        setTransactions(txs);
        setLoadingTransactions(false);
        return;
      }

      const { getDoc, doc } = await import("firebase/firestore");
      const { db } = await import("../firebase");

      const snap = await getDoc(doc(db, "users", user.uid));
      if (!snap.exists()) { setTransactions([]); return; }

      const profileData = snap.data();
      const txIdsToFetch = new Set();

      const purchased = profileData.purchasedExams || {};
      Object.values(purchased).forEach(info => {
        if (info?.transactionId) txIdsToFetch.add(info.transactionId);
      });

      const subSnap = await getDoc(doc(db, "subscriptions", user.uid));
      const subData = subSnap.exists() ? subSnap.data() : null;
      if (subData?.transactionId) txIdsToFetch.add(subData.transactionId);
      if (profileData.subscription?.transactionId) txIdsToFetch.add(profileData.subscription.transactionId);
      if (profileData.premiumTxId) txIdsToFetch.add(profileData.premiumTxId);

      const fetched = [];
      for (const txId of txIdsToFetch) {
        if (!txId || txId.startsWith("synth_")) continue;
        try {
          const txDoc = await getDoc(doc(db, "transactions", txId));
          if (txDoc.exists()) {
            fetched.push({ id: txDoc.id, ...txDoc.data() });
          }
        } catch (_) { /* skip */ }
      }

      fetched.sort((a, b) => {
        const da = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
        const db2 = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
        return db2 - da;
      });

      setTransactions(fetched);
    } catch (err) {
      console.error("Failed to load transactions:", err);
      setTransactions([]);
    } finally {
      setLoadingTransactions(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const [r, enrolled] = await Promise.all([
          getUserResults(user.uid).catch(() => []),
          getEnrolledExams(user.uid).catch(() => []),
        ]);
        if (cancelled) return;
        setResults(r.slice(0, 10).sort((a, b) => new Date(b.date) - new Date(a.date)));
        setEnrolledExams(enrolled || []);

        loadTransactions();
        getUserSubscription(user.uid).catch(() => null).then((sub) => {
          if (!cancelled) setSubscription(sub);
        });

        if ((enrolled || []).length > 0) {
          Promise.allSettled(
            enrolled.map((examId) =>
              getQuestions(examId)
                .then((qs) => ({ examId, count: (qs || []).length }))
                .catch(() => ({ examId, count: null }))
            )
          ).then((settled) => {
            if (cancelled) return;
            const map = {};
            settled.forEach((r) => {
              if (r.status === "fulfilled") map[r.value.examId] = r.value.count;
            });
            setQuestionCounts(map);
          });
        }

        if (!cancelled) setLoading(false);
      } catch {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [user, loadTransactions]);

  useEffect(() => {
    const handler = (e) => { if (e.detail) setTab(e.detail); };
    window.addEventListener("myexams:tab", handler);
    return () => window.removeEventListener("myexams:tab", handler);
  }, []);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setLoadingCerts(true);
    getUserCertificates(user.uid)
      .then((certs) => { if (!cancelled) setCertificates(certs || []); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoadingCerts(false); });
    return () => { cancelled = true; };
  }, [user]);

  const uniqueLatestCertificates = useMemo(() => {
    const map = new Map();
    certificates.forEach((cert) => {
      const d = cert.issuedAt?.toDate ? cert.issuedAt.toDate() : new Date(cert.date || 0);
      const ex = map.get(cert.examId);
      if (!ex || d > ex.dateObj) map.set(cert.examId, { cert, dateObj: d });
    });
    return [...map.values()]
      .map((v) => v.cert)
      .sort((a, b) => {
        const da = a.issuedAt?.toDate ? a.issuedAt.toDate() : new Date(a.date || 0);
        const db = b.issuedAt?.toDate ? b.issuedAt.toDate() : new Date(b.date || 0);
        return db - da;
      });
  }, [certificates]);

  const uniqueEnrolledExams = useMemo(
    () => exams.filter((e) => enrolledExams.includes(e.id)),
    [exams, enrolledExams]
  );

  const filteredEnrolled = useMemo(() => {
    let f = uniqueEnrolledExams;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      f = f.filter((e) => e.title?.toLowerCase().includes(q) || e.vendor?.toLowerCase().includes(q));
    }
    if (sortBy === "recent")  f = [...f].sort((a, b) => new Date(b.lastAccessDate || 0) - new Date(a.lastAccessDate || 0));
    if (sortBy === "popular") f = [...f].sort((a, b) => (b.attempts || 0) - (a.attempts || 0));
    if (sortBy === "title")   f = [...f].sort((a, b) => (a.title || "").localeCompare(b.title || ""));
    return f;
  }, [uniqueEnrolledExams, searchQuery, sortBy]);

  const filteredAttempts = useMemo(() => {
    let f = results;
    if (searchQuery.trim()) { const q = searchQuery.toLowerCase(); f = f.filter((r) => r.examTitle?.toLowerCase().includes(q)); }
    if (filter === "passed") f = f.filter((r) => r.pass);
    if (filter === "failed") f = f.filter((r) => !r.pass);
    if (sortBy === "score") f = [...f].sort((a, b) => b.score - a.score);
    else f = [...f].sort((a, b) => new Date(b.date) - new Date(a.date));
    return f;
  }, [results, searchQuery, filter, sortBy]);

  if (!user) return (
    <div style={{ textAlign: "center", padding: "140px 24px", minHeight: "60vh" }}>
      <div style={{ fontSize: 80, marginBottom: 28, animation: "float 3s ease-in-out infinite", display: "inline-block" }}>🔐</div>
      <h2 style={{ fontSize: 32, fontWeight: 800, color: "var(--text)", marginBottom: 16 }}>Your Exam Vault Awaits</h2>
      <p style={{ fontSize: 16, color: "var(--text2)", marginBottom: 36, maxWidth: 500, margin: "0 auto 36px" }}>Sign in to access your attempts, progress, and certificates.</p>
      <Btn size="lg" onClick={() => setPage("auth")} style={{ justifyContent: "center" }}><Icon n="user" size={18} /> Sign In Now</Btn>
    </div>
  );

  const passed            = results.filter((r) => r.pass).length;
  const failed            = results.filter((r) => !r.pass).length;
  const scoredResults     = results.filter((r) => r.score);
  const avg               = scoredResults.length ? Math.round(scoredResults.reduce((s, r) => s + r.score, 0) / scoredResults.length) : 0;
  const certificatesCount = uniqueLatestCertificates.length;

  const handleViewResult = (r)  => { setResultData(r); setPage("result"); };
  const handleStartExam  = (ex) => { setPage("exam-detail", { exam: ex }); };
  const handleRetakeExam = (id) => { const ex = exams.find((e) => e.id === id); if (ex) setPage("exam-detail", { exam: ex }); };

  const handleUnenroll = async (examId) => {
    if (!window.confirm("Unenroll? Your progress will be deleted.")) return;
    setUnenrolling(examId);
    try {
      try { await clearExamProgress(user.uid, examId); } catch {}
      await unenrollUserFromExam(user.uid, examId);
      setEnrolledExams((p) => p.filter((id) => id !== examId));
      setQuestionCounts((p) => { const n = { ...p }; delete n[examId]; return n; });
      showToast({ msg: "✅ Successfully unenrolled", type: "success" });
    } catch (err) {
      showToast({ msg: `❌ Error: ${err.message}`, type: "error" });
    } finally {
      setUnenrolling(null);
    }
  };

  const MODE_LABELS = {
    examSimulation: { label: "Exam Simulation", icon: "🎓", color: "#4f46e5" },
    fullPractice:   { label: "Full Practice",   icon: "📚", color: "#059669" },
    review:         { label: "Review Mode",     icon: "👁️", color: "#d97706" },
  };

  const STATS = [
    { label: "Total Attempts", value: results.length,              sub: "Last 10 shown",   icon: "📋", color: "var(--accent)" },
    { label: "Passed Exams",   value: passed,                      sub: `${results.length ? Math.round((passed / results.length) * 100) : 0}% pass rate`, icon: "✅", color: "var(--green)" },
    { label: "Failed Exams",   value: failed,                      sub: "Keep practicing!", icon: "⚠️", color: "var(--red)" },
    { label: "Average Score",  value: `${avg}%`,                   sub: avg >= 70 ? "Above threshold" : "Below threshold", icon: "📊", color: avg >= 70 ? "var(--green)" : "var(--gold)" },
    { label: "Certificates",   value: certificatesCount,           sub: "Latest per exam",  icon: "🎓", color: "var(--cyan)" },
    { label: "Enrolled",       value: uniqueEnrolledExams.length,  sub: "Active",           icon: "📚", color: "var(--purple)" },
  ];

  const TABS = [
    { id: "enrolled",     label: "Enrolled Exams", icon: "📝", count: uniqueEnrolledExams.length },
    { id: "attempts",     label: "My Attempts",    icon: "📋", count: results.length },
    { id: "certificates", label: "Certificates",   icon: "🎓", count: certificatesCount },
    { id: "billing",      label: "Billing",        icon: "💳", count: transactions.length },
  ];

  return (
    <div style={{ maxWidth: 1400, margin: "0 auto", padding: "48px clamp(20px,4vw,48px) 80px" }}>
      <style>{`
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @media(max-width:768px) {
          .mex-stats   { grid-template-columns:repeat(2,1fr)!important }
          .mex-grid    { grid-template-columns:1fr!important }
          .mex-tabs    { overflow-x:auto!important;flex-wrap:nowrap!important;scrollbar-width:none }
          .mex-tabs::-webkit-scrollbar { display:none }
          .mex-filters { flex-direction:column!important;align-items:flex-start!important }
          .att-row     { flex-direction:column!important;gap:12px!important }
          .att-actions { flex-direction:row!important }
        }
      `}</style>

      <div className="fade-up" style={{ marginBottom: 40 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>Learning Dashboard</div>
        <h1 style={{ fontSize: "clamp(28px,5vw,48px)", fontWeight: 900, marginBottom: 14, color: "var(--text)", letterSpacing: "-2px" }}>Track Your Journey</h1>
        <p style={{ fontSize: 15, color: "var(--text2)", lineHeight: 1.7 }}>Monitor your progress, review past exams, and plan your next milestone.</p>
      </div>

      <div className="mex-stats fade-up delay-1" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 16, marginBottom: 40 }}>
        {STATS.map((s, i) => (
          <Card key={i} hover={false} style={{ borderRadius: 18, background: "var(--gradient-card)", border: `1.5px solid ${s.color}22`, padding: "20px 22px" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10, color: "var(--text3)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>{s.label}</div>
                <div style={{ fontSize: 26, fontWeight: 800, color: s.color, lineHeight: 1, marginBottom: 5 }}>{s.value}</div>
                <div style={{ fontSize: 10, color: "var(--text3)", fontWeight: 600 }}>{s.sub}</div>
              </div>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: `${s.color}15`, border: `1.5px solid ${s.color}25`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>{s.icon}</div>
            </div>
          </Card>
        ))}
      </div>

      <div className="mex-tabs" style={{ display: "flex", gap: 6, marginBottom: 32, borderBottom: "2px solid var(--border)" }}>
        {TABS.map((t) => (
          <button key={t.id}
            onClick={() => { setTab(t.id); setFilter("all"); setSearchQuery(""); }}
            style={{ padding: "13px 20px", borderRadius: "13px 13px 0 0", border: "none", background: tab === t.id ? "var(--bg2)" : "transparent", borderBottom: tab === t.id ? "3px solid var(--accent)" : "3px solid transparent", color: tab === t.id ? "var(--accent)" : "var(--text2)", cursor: "pointer", fontWeight: 700, fontFamily: "inherit", fontSize: 13, transition: "all 0.25s", display: "flex", alignItems: "center", gap: 8, whiteSpace: "nowrap" }}>
            <span style={{ fontSize: 16 }}>{t.icon}</span>{t.label}
            <span style={{ padding: "2px 8px", borderRadius: 99, background: tab === t.id ? "var(--accent-soft)" : "var(--bg3)", color: tab === t.id ? "var(--accent)" : "var(--text3)", fontSize: 11, fontWeight: 800 }}>{t.count}</span>
          </button>
        ))}
      </div>

      {tab !== "billing" && (
        <div className="mex-filters" style={{ background: "var(--bg2)", border: "1.5px solid var(--border)", borderRadius: 16, padding: "14px 18px", marginBottom: 24, display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth="2" style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={tab === "enrolled" ? "Search enrolled…" : tab === "attempts" ? "Search attempts…" : "Search certificates…"}
              style={{ width: "100%", padding: "10px 12px 10px 34px", background: "var(--bg3)", border: "1.5px solid var(--border)", borderRadius: 11, color: "var(--text)", fontSize: 13, fontFamily: "inherit", outline: "none", transition: "border-color 0.2s" }}
              onFocus={(e) => e.target.style.borderColor = "var(--accent)"}
              onBlur={(e) => e.target.style.borderColor = "var(--border)"}
            />
            {searchQuery && <button onClick={() => setSearchQuery("")} style={{ position: "absolute", right: 9, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--text3)", cursor: "pointer", fontSize: 16 }}>×</button>}
          </div>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={{ padding: "9px 12px", borderRadius: 10, border: "1.5px solid var(--border)", background: "var(--bg3)", color: "var(--text)", fontSize: 12, cursor: "pointer", fontFamily: "inherit", fontWeight: 600, outline: "none" }}>
            {tab === "enrolled"
              ? <><option value="recent">Recent</option><option value="popular">Popular</option><option value="title">A-Z</option></>
              : <><option value="recent">Newest</option><option value="score">Highest Score</option></>}
          </select>
          {tab === "attempts" && (
            <div style={{ display: "flex", gap: 4 }}>
              {[["all","All"],["passed","✅ Passed"],["failed","❌ Failed"]].map(([v,l]) => (
                <button key={v} onClick={() => setFilter(v)} style={{ padding: "7px 11px", borderRadius: 9, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", border: `1.5px solid ${filter === v ? "var(--accent)" : "var(--border)"}`, background: filter === v ? "var(--accent-soft)" : "var(--bg3)", color: filter === v ? "var(--accent)" : "var(--text2)", transition: "all 0.15s" }}>{l}</button>
              ))}
            </div>
          )}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: "center", padding: 80 }}><Spinner size={44} color="var(--accent)" /></div>

      ) : tab === "enrolled" ? (
        filteredEnrolled.length === 0 ? (
          <Empty icon="📝" title={searchQuery ? "No exams match" : "No enrolled exams yet"} subtitle={searchQuery ? "Try different keywords" : "Register for exams to start your journey."} action={<Btn onClick={() => setPage("exams")}><Icon n="search" size={16}/> Browse Exams</Btn>} />
        ) : (
          <div className="mex-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(340px,1fr))", gap: 22 }}>
            {filteredEnrolled.map((exam, idx) => {
              const lastAttempt = results.find((r) => r.examId === exam.id);
              const ec = exam.color || "var(--accent)";
              const qCount   = questionCounts[exam.id] !== undefined ? questionCounts[exam.id] : (exam.totalQuestions || 0);
              const qLoading = questionCounts[exam.id] === undefined;

              return (
                <div key={exam.id} className="fade-up" style={{ animationDelay: `${Math.min(idx,5)*0.05}s` }}>
                  <Card glow style={{ borderRadius: 22, border: `1.5px solid ${ec}22`, cursor: "pointer", overflow: "hidden", transition: "all 0.28s" }}
                    onClick={() => handleStartExam(exam)}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.borderColor = `${ec}50`; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = ""; e.currentTarget.style.borderColor = `${ec}22`; }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                      {exam.image
                        ? <div style={{ width: 60, height: 60, borderRadius: 16, overflow: "hidden", flexShrink: 0 }}><img src={exam.image} alt={exam.title} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover" }}/></div>
                        : <div style={{ width: 60, height: 60, borderRadius: 16, background: `${ec}15`, border: `1.5px solid ${ec}25`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, flexShrink: 0 }}>{exam.logo || "📋"}</div>
                      }
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h4 style={{ fontSize: 15, fontWeight: 800, marginBottom: 6, color: "var(--text)" }}>{exam.title}</h4>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                          {exam.vendor && <><span style={{ fontSize: 11, color: "var(--text3)", fontWeight: 600 }}>{exam.vendor}</span><span style={{ color: "var(--border)" }}>·</span></>}
                          <span style={{ fontSize: 11, fontWeight: 800, padding: "2px 10px", borderRadius: 99, background: `${ec}15`, color: ec, border: `1px solid ${ec}25` }}>
                            {qLoading ? "… Q" : `${qCount} Question${qCount !== 1 ? "s" : ""}`}
                          </span>
                        </div>
                      </div>
                    </div>

                    {lastAttempt && (
                      <div style={{ background: "var(--bg3)", borderRadius: 12, padding: "11px 14px", marginBottom: 14, fontSize: 13 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                          <span style={{ color: "var(--text2)", fontWeight: 600 }}>Last Attempt:</span>
                          <span style={{ color: lastAttempt.pass ? "var(--green)" : "var(--red)", fontWeight: 700 }}>{lastAttempt.score}% {lastAttempt.pass ? "✅" : "❌"}</span>
                        </div>
                        <div style={{ fontSize: 11, color: "var(--text3)" }}>{lastAttempt.date}</div>
                      </div>
                    )}

                    <div style={{ display: "flex", gap: 9 }}>
                      <Btn full onClick={(e) => { e.stopPropagation(); handleStartExam(exam); }} style={{ background: `linear-gradient(135deg,${ec},${ec}cc)`, borderColor: "transparent", justifyContent: "center", flex: 1 }}>
                        <Icon n="lightning" size={15}/> Start
                      </Btn>
                      <Btn variant="ghost" loading={unenrolling === exam.id} onClick={(e) => { e.stopPropagation(); handleUnenroll(exam.id); }} style={{ color: "var(--red)", borderColor: "var(--red)", padding: "12px 16px" }} title="Unenroll">
                        <Icon n="close" size={15}/>
                      </Btn>
                    </div>
                  </Card>
                </div>
              );
            })}
          </div>
        )

      ) : tab === "attempts" ? (
        filteredAttempts.length === 0 ? (
          <Empty icon="🎯" title={searchQuery ? "No results" : "No attempts yet"} subtitle="Start practicing to see your results here." action={<Btn onClick={() => setPage("exams")}><Icon n="search" size={16}/> Browse Exams</Btn>} />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {filteredAttempts.map((result, idx) => {
              const exam = exams.find((e) => e.id === result.examId);
              const color = exam?.color || "#6366F1";
              const modeInfo = MODE_LABELS[result.mode] || { label: "Exam", icon: "📝", color: "var(--text3)" };
              return (
                <div key={result.id || idx} className="att-row"
                  style={{ background: "var(--bg2)", border: `1.5px solid ${result.pass ? "rgba(5,150,105,0.22)" : "rgba(220,38,38,0.18)"}`, borderRadius: 15, padding: "15px 18px", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", transition: "all 0.22s" }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = "translateX(4px)"; e.currentTarget.style.boxShadow = `0 8px 24px ${color}15`; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}
                >
                  <div style={{ width: 60, height: 60, borderRadius: "50%", flexShrink: 0, background: result.pass ? "rgba(5,150,105,0.12)" : "rgba(220,38,38,0.1)", border: `2.5px solid ${result.pass ? "rgba(5,150,105,0.4)" : "rgba(220,38,38,0.35)"}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ fontSize: 16, fontWeight: 900, color: result.pass ? "var(--green)" : "var(--red)", lineHeight: 1 }}>{result.score}%</div>
                    <div style={{ fontSize: 8, fontWeight: 800, color: result.pass ? "var(--green)" : "var(--red)", textTransform: "uppercase", marginTop: 2 }}>{result.pass ? "PASS" : "FAIL"}</div>
                  </div>
                  <div style={{ flex: 1, minWidth: 160 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 4, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 99, background: `${modeInfo.color}15`, color: modeInfo.color, border: `1px solid ${modeInfo.color}28` }}>{modeInfo.icon} {modeInfo.label}</span>
                      <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 99, background: `${color}12`, color, border: `1px solid ${color}22` }}>{exam?.vendor || "Exam"}</span>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 3 }}>{exam?.title || result.examTitle || "Exam"}</div>
                    <div style={{ display: "flex", gap: 12, fontSize: 11, color: "var(--text3)" }}>
                      <span>🕐 {result.date}</span>
                      <span>✅ {result.correct}/{result.total}</span>
                      <span>⏱️ {Math.round((result.timeTaken || 0) / 60)}m</span>
                    </div>
                    <div style={{ marginTop: 7, height: 3, background: "var(--bg3)", borderRadius: 99, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${result.score || 0}%`, background: result.pass ? "var(--green)" : "var(--red)", borderRadius: 99 }} />
                    </div>
                  </div>
                  <div className="att-actions" style={{ display: "flex", flexDirection: "column", gap: 7, flexShrink: 0 }}>
                    <button onClick={() => handleViewResult(result)} style={{ padding: "8px 13px", borderRadius: 9, border: `1.5px solid ${color}`, background: "transparent", color, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", transition: "all 0.18s", whiteSpace: "nowrap" }} onMouseEnter={(e) => e.currentTarget.style.background = `${color}12`} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>View Results</button>
                    <button onClick={() => handleRetakeExam(result.examId)} style={{ padding: "8px 13px", borderRadius: 9, border: "none", background: color, color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", boxShadow: `0 3px 10px ${color}35`, whiteSpace: "nowrap" }}>Retake</button>
                  </div>
                </div>
              );
            })}
          </div>
        )

      ) : tab === "certificates" ? (
        loadingCerts ? (
          <div style={{ textAlign: "center", padding: 80 }}><Spinner size={44} color="var(--accent)" /></div>
        ) : uniqueLatestCertificates.length === 0 ? (
          <Empty icon="🎓" title="No certificates yet" subtitle="Pass an Exam Simulation to earn a verified certificate." action={<Btn onClick={() => setPage("exams")}>Browse Exams</Btn>} />
        ) : (
          <div style={{ display: "grid", gap: 14 }}>
            {uniqueLatestCertificates
              .filter((c) => searchQuery ? c.examTitle?.toLowerCase().includes(searchQuery.toLowerCase()) : true)
              .map((cert) => {
                const exam = exams.find((e) => e.id === cert.examId);
                const color = exam?.color || "var(--accent)";
                const safeCertId = cert.certId || cert.id || "";
                return (
                  <div key={safeCertId || cert.examId}
                    style={{ background: "var(--bg2)", border: `1.5px solid ${color}22`, borderRadius: 18, padding: "18px 22px", display: "flex", alignItems: "center", flexWrap: "wrap", gap: 14, transition: "all 0.2s" }}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = `${color}50`}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = `${color}22`}
                  >
                    <div style={{ width: 48, height: 48, borderRadius: 12, background: `${color}15`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26 }}>🎓</div>
                    <div style={{ flex: 1, minWidth: 160 }}>
                      <h4 style={{ fontSize: 15, fontWeight: 700, marginBottom: 4, color: "var(--text)" }}>{cert.examTitle}</h4>
                      <div style={{ display: "flex", gap: 14, fontSize: 12, color: "var(--text3)" }}>
                        <span>Score: <strong style={{ color }}>{cert.score}%</strong></span>
                        <span>Issued: {cert.date || (cert.issuedAt?.toDate ? cert.issuedAt.toDate().toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric"}) : cert.issuedAt ? new Date(cert.issuedAt).toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric"}) : "—")}</span>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 9 }}>
                      <Btn size="sm" onClick={async () => {
                        await generatePDFCertificate({ examTitle: cert.examTitle, userName: cert.userName, score: cert.score, date: cert.date, certId: safeCertId, examMode: "examSimulation", passed: true, filename: `${cert.examTitle.replace(/\s/g,"_")}_Certificate` });
                        showToast({ msg: "✅ Certificate downloaded", type: "success" });
                      }}><Icon n="download" size={13}/> PDF</Btn>
                      <Btn size="sm" variant="outline" onClick={() => window.open(getVerifyURL(safeCertId),"_blank")}><Icon n="link" size={13}/> Verify</Btn>
                    </div>
                  </div>
                );
              })}
          </div>
        )

      ) : tab === "billing" ? (
        <BillingTab
          transactions={transactions}
          subscription={subscription}
          exams={exams}
          setPage={setPage}
          showToast={showToast}
          user={user}
          loadingTransactions={loadingTransactions}
          refreshTransactions={loadTransactions}
        />
      ) : null}
    </div>
  );
}
