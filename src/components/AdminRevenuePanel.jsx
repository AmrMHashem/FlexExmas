// components/AdminRevenuePanel.jsx
// Revenue Dashboard: Transactions + Instapay verification + Refunds + Excel export
// ✅ FIX: Cancel transaction fully revokes subscription/exam access
// ✅ NEW: Instapay requests can be deleted individually, in bulk, or all at once
// ✅ NEW: Preview button for screenshot image in Instapay requests

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  getAllTransactions,
  getAllInstapayPayments,
  approveInstapayPayment,
  rejectInstapayPayment,
  getAllRefundRequests,
  updateRefundStatus,
} from "../services/payment";

// ─── Helper: Permanently delete a transaction from Firestore ────────────────
async function deleteTransactionDoc(txId) {
  const { db } = await import("../firebase");
  const { doc, deleteDoc } = await import("firebase/firestore");
  await deleteDoc(doc(db, "transactions", txId));
}

// ─── Helper: Permanently delete an Instapay payment from Firestore ───────────
async function deleteInstapayDoc(paymentId) {
  const { db } = await import("../firebase");
  const { doc, deleteDoc } = await import("firebase/firestore");
  await deleteDoc(doc(db, "instapay_payments", paymentId));
}

// ─── Helper: Revoke user access on cancel ───────────────────────────────────
async function revokeUserAccess(userId, txType, planId, examId) {
  try {
    const { db } = await import("../firebase");
    const { doc, updateDoc, deleteField, arrayRemove } = await import("firebase/firestore");
    const userRef = doc(db, "users", userId);

    if (txType === "subscription") {
      await updateDoc(userRef, {
        subscriptionStatus: "cancelled",
        subscriptionPlan: deleteField(),
        subscriptionExpiresAt: deleteField(),
        hasActiveSubscription: false,
        premium: false,
        premiumPlanId: deleteField(),
        premiumUntil: deleteField(),
        premiumAutoRenew: deleteField(),
      });
      const subRef = doc(db, "subscriptions", userId);
      await updateDoc(subRef, {
        status: "cancelled",
        cancelledAt: new Date().toISOString(),
      }).catch(() => {});
    } else if (txType === "exam" && examId) {
      await updateDoc(userRef, {
        purchasedExams: arrayRemove(examId),
      });
    }
  } catch (err) {
    console.warn("revokeUserAccess failed:", err);
  }
}

// ─── Helper: Cancel a transaction in Firestore ──────────────────────────────
async function cancelTransactionDoc(txId) {
  try {
    const { db } = await import("../firebase");
    const { doc, updateDoc } = await import("firebase/firestore");
    await updateDoc(doc(db, "transactions", txId), {
      status: "cancelled",
      cancelledAt: new Date(),
    });
  } catch (err) {
    console.warn("cancelTransactionDoc failed:", err);
  }
}

// ─── Helper: Send user notification using centralized service ─────────────────────────
async function sendUserNotification(userId, { type, title, body }) {
  try {
    const { sendNotification } = await import("../services/payment");
    await sendNotification(userId, { type, title, body });
  } catch (err) {
    console.warn("sendUserNotification failed:", err);
  }
}
// ─── Safe number helpers ─────────────────────────────────────────────────────
const toSafeNumber = (value, defaultValue = 0) => {
  const num = Number(value);
  return isNaN(num) ? defaultValue : num;
};

const formatMoney = (value, decimals = 2) => {
  const num = toSafeNumber(value);
  return num.toFixed(decimals);
};

// ─── Safe date helpers ───────────────────────────────────────────────────────
const getDateValue = (obj) => {
  if (!obj) return null;
  if (obj.toDate && typeof obj.toDate === "function") return obj.toDate();
  if (obj instanceof Date) return obj;
  if (typeof obj === "string" || typeof obj === "number") return new Date(obj);
  return null;
};

const safeFormatDate = (timestamp, locale = "en-GB") => {
  const date = getDateValue(timestamp);
  if (!date || isNaN(date.getTime())) return "—";
  return date.toLocaleString(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// ─── Minimal Icon ────────────────────────────────────────────────────────────
const I = ({ n, s = 14, c = "currentColor" }) => {
  const m = {
    dl:      <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
    check:   <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
    x:       <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
    filter:  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>,
    search:  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>,
    refresh: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>,
    trash:   <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>,
    alert:   <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
    eye:     <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  };
  return m[n] || null;
};

// ─── Excel/CSV Export (unchanged) ────────────────────────────────────────────
let xlsxLoadingPromise = null;
const loadXLSX = () => {
  if (window.XLSX) return Promise.resolve(window.XLSX);
  if (xlsxLoadingPromise) return xlsxLoadingPromise;
  xlsxLoadingPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://cdn.sheetjs.com/xlsx-0.20.2/package/dist/xlsx.full.min.js";
    script.async = true;
    script.onload = () => resolve(window.XLSX);
    script.onerror = reject;
    document.head.appendChild(script);
  });
  return xlsxLoadingPromise;
};

async function exportToExcel(rows, filename, headers, notify) {
  try {
    await loadXLSX();
    const ws = window.XLSX.utils.json_to_sheet(
      rows.map(r => {
        const obj = {};
        headers.forEach(h => { obj[h] = r[h] ?? ""; });
        return obj;
      })
    );
    const wb = window.XLSX.utils.book_new();
    window.XLSX.utils.book_append_sheet(wb, ws, "Data");
    window.XLSX.writeFile(wb, filename.replace(".csv", ".xlsx"));
    if (notify) notify("✅ Exported successfully", "success");
  } catch (err) {
    console.warn("XLSX failed, CSV fallback", err);
    const csv = [
      headers.join(","),
      ...rows.map(r =>
        headers.map(h => `"${(r[h] ?? "").toString().replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
    if (notify) notify("⚠️ Exported as CSV (XLSX unavailable)", "warning");
  }
}

// ─── Status Badge (unchanged) ────────────────────────────────────────────────
function StatusBadge({ status }) {
  const colors = {
    completed:  { bg: "rgba(16,185,129,0.12)",  color: "#059669", label: "Completed"  },
    pending:    { bg: "rgba(245,158,11,0.12)",  color: "#d97706", label: "Pending"    },
    approved:   { bg: "rgba(16,185,129,0.12)",  color: "#059669", label: "Approved"   },
    rejected:   { bg: "rgba(239,68,68,0.12)",   color: "#dc2626", label: "Rejected"   },
    failed:     { bg: "rgba(239,68,68,0.12)",   color: "#dc2626", label: "Failed"     },
    cancelled:  { bg: "rgba(107,114,128,0.12)", color: "#6b7280", label: "Cancelled"  },
    refunded:   { bg: "rgba(99,102,241,0.12)",  color: "#818cf8", label: "↩ Refunded" },
  };
  const s = colors[status] || colors.pending;
  return (
    <span style={{
      background: s.bg, color: s.color, borderRadius: 100,
      padding: "3px 10px", fontSize: 10, fontWeight: 800,
      textTransform: "uppercase", letterSpacing: "0.06em",
    }}>
      {s.label}
    </span>
  );
}

// ─── Confirm Modal (reusable) ────────────────────────────────────────────────
function ConfirmModal({ title, description, icon = "⚠️", confirmLabel, confirmColor = "#dc2626", onConfirm, onCancel, loading = false }) {
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 9999, padding: 20,
    }}>
      <div style={{
        background: "var(--bg2)", border: `1.5px solid ${confirmColor}44`,
        borderRadius: 20, padding: 28, maxWidth: 400, width: "100%",
      }}>
        <div style={{ fontSize: 36, textAlign: "center", marginBottom: 12 }}>{icon}</div>
        <h3 style={{ fontSize: 16, fontWeight: 900, textAlign: "center", color: confirmColor, marginBottom: 10 }}>{title}</h3>
        <div style={{ fontSize: 13, color: "var(--text2)", textAlign: "center", lineHeight: 1.65, marginBottom: 22 }}>
          {description}
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={onCancel}
            disabled={loading}
            style={{
              flex: 1, padding: "10px", borderRadius: 10,
              border: "1.5px solid var(--border)", background: "var(--bg3)",
              color: "var(--text2)", fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            style={{
              flex: 1, padding: "10px", borderRadius: 10, border: "none",
              background: `linear-gradient(135deg,${confirmColor},${confirmColor}cc)`,
              color: "#fff", fontWeight: 800, cursor: loading ? "not-allowed" : "pointer",
              fontFamily: "inherit", opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Processing…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT (added screenshot preview modal)
// ═══════════════════════════════════════════════════════════════════════════════
export default function AdminRevenuePanel({
  users = [],
  exams = [],
  showToast,
  adminUid = "",
  hideRefunds = false,
  initialSection = "transactions",
  refundsOnly = false,
  onCancelTransaction,
  onCancelSubscription,
}) {
  const [section, setSection] = useState(
    initialSection || (refundsOnly ? "refunds" : "transactions")
  );
  const [transactions, setTxs]   = useState([]);
  const [instapays, setInstapays] = useState([]);
  const [refunds, setRefunds]     = useState([]);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);

  // Filters
  const [txSearch, setTxSearch]           = useState("");
  const [txExamFilter, setTxExamFilter]   = useState("all");
  const [txMethodFilter, setTxMethodFilter] = useState("all");
  const [txPeriodFilter, setTxPeriodFilter] = useState("all");

  // Instapay bulk delete
  const [selectedInstapayIds, setSelectedInstapayIds] = useState([]);
  const [selectAllInstapay, setSelectAllInstapay] = useState(false);

  // Action states
  const [actionLoading, setActionLoading] = useState({});
  const [noteModal, setNoteModal]         = useState(null);
  const [noteText, setNoteText]           = useState("");

  // Screenshot preview modal
  const [previewImage, setPreviewImage]   = useState(null);

  // Cancel confirm
  const [cancelConfirm, setCancelConfirm] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(false);

  // Delete confirm for single tx
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Clear entire transactions table confirm
  const [clearConfirm, setClearConfirm]   = useState(false);
  const [clearLoading, setClearLoading]   = useState(false);

  // Instapay delete confirm modals
  const [instapayDeleteConfirm, setInstapayDeleteConfirm] = useState(null);
  const [instapayBulkDeleteConfirm, setInstapayBulkDeleteConfirm] = useState(false);
  const [instapayClearAllConfirm, setInstapayClearAllConfirm] = useState(false);
  const [instapayDeleteLoading, setInstapayDeleteLoading] = useState(false);

  const cancelHandler = onCancelTransaction || onCancelSubscription;

  const notify = useCallback((msg, type = "info") => {
    if (showToast && typeof showToast === "function") {
      showToast({ msg, type });
    } else {
      console.log(`[${type.toUpperCase()}] ${msg}`);
    }
  }, [showToast]);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async (retryCount = 0) => {
    setLoading(true);
    setError(null);
    try {
      const [txs, ips, refs] = await Promise.all([
        getAllTransactions().catch(() => []),
        getAllInstapayPayments().catch(() => []),
        getAllRefundRequests().catch(() => []),
      ]);
      setTxs(Array.isArray(txs) ? txs : []);
      setInstapays(Array.isArray(ips) ? ips : []);
      setRefunds(Array.isArray(refs) ? refs : []);
      setSelectedInstapayIds([]);
      setSelectAllInstapay(false);
    } catch (e) {
      console.error("LoadAll error:", e);
      setError(`Failed to load data: ${e.message}`);
      notify(`Load error: ${e.message}`, "error");
      if (retryCount < 2) setTimeout(() => loadAll(retryCount + 1), 2000);
    } finally {
      setLoading(false);
    }
  };

  // ── KPI calculations (unchanged) ───────────────────────────────────────────
  const totalRevenue = useMemo(() =>
    transactions
      .filter(t => t.status !== "refunded" && t.status !== "cancelled")
      .reduce((s, t) => s + toSafeNumber(t.amount), 0),
    [transactions]
  );

  const totalRefunded = useMemo(() => {
    const fromRefundDocs = refunds
      .filter(r => r.status === "approved")
      .reduce((s, r) => s + toSafeNumber(r.amount), 0);
    const fromTxRefunded = transactions
      .filter(t => t.status === "refunded")
      .reduce((s, t) => s + toSafeNumber(t.amount), 0);
    return Math.max(fromRefundDocs, fromTxRefunded);
  }, [refunds, transactions]);

  const subCount       = useMemo(() => transactions.filter(t => t.type === "subscription").length, [transactions]);
  const examPurchCount = useMemo(() => transactions.filter(t => t.type === "exam").length, [transactions]);
  const pendingInstapay = useMemo(() => instapays.filter(i => i.status === "pending").length, [instapays]);
  const pendingRefunds  = useMemo(() => refunds.filter(r => r.status === "pending").length, [refunds]);

  const revenueByMethod = useMemo(() => {
    const map = { paypal: 0, stripe: 0, instapay: 0 };
    transactions
      .filter(t => t.status !== "refunded" && t.status !== "cancelled")
      .forEach(t => {
        const m = t.paymentMethod || "paypal";
        if (m !== "instapay") {
          map[m] = toSafeNumber(map[m]) + toSafeNumber(t.amount);
        }
      });
    instapays
      .filter(i => i.status === "approved")
      .forEach(i => {
        map["instapay"] = toSafeNumber(map["instapay"]) + toSafeNumber(i.amountUSD);
      });
    return map;
  }, [transactions, instapays]);

  const monthRevenue = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    return transactions
      .filter(t => {
        const d = getDateValue(t.createdAt)?.getTime() || 0;
        return d >= monthStart && t.status !== "refunded" && t.status !== "cancelled";
      })
      .reduce((s, t) => s + toSafeNumber(t.amount), 0);
  }, [transactions]);

  const sortedTxs = useMemo(() =>
    [...transactions].sort((a, b) => {
      const da = getDateValue(a.createdAt) || new Date(0);
      const db2 = getDateValue(b.createdAt) || new Date(0);
      return db2 - da;
    }),
    [transactions]
  );

  const filteredTxs = useMemo(() => {
    const now = new Date();
    return sortedTxs.filter(t => {
      const q = txSearch.toLowerCase();
      const matchSearch = !q ||
        (t.userId        || "").toLowerCase().includes(q) ||
        (t.examId        || "").toLowerCase().includes(q) ||
        (t.planId        || "").toLowerCase().includes(q) ||
        (t.referenceId   || "").toLowerCase().includes(q) ||
        (t.couponCode    || "").toLowerCase().includes(q) ||
        (t.id            || "").toLowerCase().includes(q);
      const matchExam = txExamFilter === "all" ||
        t.examId === txExamFilter || t.planId === txExamFilter;
      const matchMethod = txMethodFilter === "all" ||
        (t.paymentMethod || "paypal") === txMethodFilter;
      let matchPeriod = true;
      if (txPeriodFilter !== "all") {
        const d = getDateValue(t.createdAt);
        if (d) {
          if (txPeriodFilter === "monthly")
            matchPeriod = d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
          else if (txPeriodFilter === "yearly")
            matchPeriod = d.getFullYear() === now.getFullYear();
        } else matchPeriod = false;
      }
      return matchSearch && matchExam && matchMethod && matchPeriod;
    });
  }, [sortedTxs, txSearch, txExamFilter, txMethodFilter, txPeriodFilter]);

  const filteredRevenue = useMemo(() =>
    filteredTxs
      .filter(t => t.status !== "refunded" && t.status !== "cancelled")
      .reduce((s, t) => s + toSafeNumber(t.amount), 0),
    [filteredTxs]
  );

  // ── Instapay selection handlers (unchanged) ─────────────────────────────────
  const handleSelectInstapay = (id, checked) => {
    setSelectedInstapayIds(prev =>
      checked ? [...prev, id] : prev.filter(i => i !== id)
    );
  };

  const handleSelectAllInstapay = (checked) => {
    if (checked) {
      setSelectedInstapayIds(instapays.map(i => i.id));
    } else {
      setSelectedInstapayIds([]);
    }
    setSelectAllInstapay(checked);
  };

  useEffect(() => {
    setSelectedInstapayIds([]);
    setSelectAllInstapay(false);
  }, [instapays]);

  // ── Instapay delete functions (unchanged) ───────────────────────────────────
  const handleDeleteSingleInstapay = (id) => {
    setInstapayDeleteConfirm(id);
  };

  const confirmDeleteSingleInstapay = async () => {
    if (!instapayDeleteConfirm) return;
    setInstapayDeleteLoading(true);
    try {
      await deleteInstapayDoc(instapayDeleteConfirm);
      setInstapays(prev => prev.filter(i => i.id !== instapayDeleteConfirm));
      notify("🗑️ Instapay request deleted", "success");
    } catch (e) {
      notify(`❌ Delete failed: ${e.message}`, "error");
    }
    setInstapayDeleteLoading(false);
    setInstapayDeleteConfirm(null);
  };

  const handleDeleteSelectedInstapay = () => {
    if (selectedInstapayIds.length === 0) {
      notify("No items selected", "warning");
      return;
    }
    setInstapayBulkDeleteConfirm(true);
  };

  const confirmDeleteSelectedInstapay = async () => {
    setInstapayDeleteLoading(true);
    try {
      await Promise.all(selectedInstapayIds.map(id => deleteInstapayDoc(id).catch(e => console.warn(e))));
      setInstapays(prev => prev.filter(i => !selectedInstapayIds.includes(i.id)));
      setSelectedInstapayIds([]);
      setSelectAllInstapay(false);
      notify(`🗑️ Deleted ${selectedInstapayIds.length} Instapay request(s)`, "success");
    } catch (e) {
      notify(`❌ Bulk delete failed: ${e.message}`, "error");
    }
    setInstapayDeleteLoading(false);
    setInstapayBulkDeleteConfirm(false);
  };

  const handleDeleteAllInstapay = () => {
    if (instapays.length === 0) return;
    setInstapayClearAllConfirm(true);
  };

  const confirmDeleteAllInstapay = async () => {
    setInstapayDeleteLoading(true);
    try {
      await Promise.all(instapays.map(i => deleteInstapayDoc(i.id).catch(e => console.warn(e))));
      setInstapays([]);
      setSelectedInstapayIds([]);
      setSelectAllInstapay(false);
      notify("🗑️ All Instapay requests deleted", "success");
    } catch (e) {
      notify(`❌ Delete all failed: ${e.message}`, "error");
    }
    setInstapayDeleteLoading(false);
    setInstapayClearAllConfirm(false);
  };

  // ── Action handlers for approve/reject (unchanged) ─────────────────────────
  const handleInstapay = (id, action) => setNoteModal({ type: "instapay", id, action });
  const handleRefund   = (id, action) => setNoteModal({ type: "refund",   id, action });

  const confirmAction = async () => {
    if (!noteModal) return;
    const { type, id, action } = noteModal;

    const defaultNotes = {
      instapay_approve: "🏦 Your Instapay payment has been verified and approved. You now have full access!",
      instapay_reject:  "❌ Your Instapay payment could not be verified. Please check your reference ID or contact support.",
      refund_approve:   "✅ Your refund has been approved. The amount will be returned within 3-7 business days.",
      refund_reject:    "❌ Your refund request could not be approved at this time. Please contact support.",
    };
    const effectiveNote = noteText.trim() || defaultNotes[`${type}_${action}`] || "";

    setActionLoading(p => ({ ...p, [id]: true }));
    try {
      if (type === "instapay") {
        const ipDoc = instapays.find(i => i.id === id);
        if (action === "approve") {
          await approveInstapayPayment(id, adminUid, effectiveNote);
          if (ipDoc?.userId) {
            const itemLabel = ipDoc.planId
              ? `${ipDoc.planId === "monthly" ? "Monthly" : "Yearly"} Subscription`
              : "Exam Purchase";
            await sendUserNotification(ipDoc.userId, {
              type: "instapay_approved",
              title: "✅ Instapay Payment Approved",
              body: effectiveNote || `Your Instapay payment for ${itemLabel} ($${Number(ipDoc.amountUSD || 0).toFixed(2)}) has been verified. You now have full access!`,
            });
          }
        } else {
          await rejectInstapayPayment(id, adminUid, effectiveNote);
          if (ipDoc?.userId) {
            await sendUserNotification(ipDoc.userId, {
              type: "instapay_rejected",
              title: "❌ Instapay Payment Rejected",
              body: effectiveNote || "Your Instapay payment could not be verified. Please check the reference ID or contact support.",
            });
          }
        }
        notify(`✅ Instapay payment ${action}d`, "success");
        await loadAll();
      } else {
        const newStatus = action === "approve" ? "approved" : "rejected";
        await updateRefundStatus(id, newStatus, adminUid, effectiveNote);
        const refundDoc = refunds.find(r => r.id === id);
        if (action === "approve") {
          if (refundDoc?.transactionId) {
            try {
              const { db } = await import("../firebase");
              const { doc, updateDoc } = await import("firebase/firestore");
              await updateDoc(doc(db, "transactions", refundDoc.transactionId), {
                status: "refunded",
                refundedAt: new Date(),
              });
              setTxs(prev =>
                prev.map(tx =>
                  tx.id === refundDoc.transactionId ? { ...tx, status: "refunded" } : tx
                )
              );
            } catch (txErr) {
              console.warn("Could not update transaction status to refunded:", txErr);
            }
          }

          if (refundDoc?.userId) {
            const origTx = transactions.find(t => t.id === refundDoc.transactionId);
            if (origTx) {
              await revokeUserAccess(
                refundDoc.userId,
                origTx.type,
                origTx.planId || refundDoc.planId,
                origTx.examId || refundDoc.examId
              );
            }
          }

          setRefunds(prev => prev.map(r => r.id === id ? { ...r, status: "approved" } : r));
          if (refundDoc?.userId) {
            await sendUserNotification(refundDoc.userId, {
              type: "refund_approved",
              title: "✅ Refund Approved",
              body: effectiveNote || `Your refund of $${Number(refundDoc.amount || 0).toFixed(2)} has been approved. Amount will be returned in 3–7 business days. Your access has been revoked.`,
            });
          }
        } else {
          setRefunds(prev => prev.map(r => r.id === id ? { ...r, status: "rejected" } : r));
          if (refundDoc?.userId) {
            await sendUserNotification(refundDoc.userId, {
              type: "refund_rejected",
              title: "❌ Refund Request Rejected",
              body: effectiveNote || "Your refund request could not be approved. Please contact support.",
            });
          }
        }
        notify(`✅ Refund ${action}d`, "success");
        await loadAll();
      }
    } catch (e) {
      notify(`❌ Error: ${e.message}`, "error");
    }
    setActionLoading(p => ({ ...p, [id]: false }));
    setNoteModal(null);
    setNoteText("");
  };

  // ── Cancel transaction handler (unchanged) ─────────────────────────────────
  const handleCancelConfirm = async () => {
    if (!cancelConfirm) return;
    setCancelLoading(true);
    try {
      const { userId, txId, txType, examId, planId, amount, userName } = cancelConfirm;

      await revokeUserAccess(userId, txType, planId, examId);
      await cancelTransactionDoc(txId);
      if (cancelHandler && typeof cancelHandler === "function") {
        try {
          await cancelHandler(userId, txId, txType, adminUid);
        } catch (handlerErr) {
          console.warn("Parent cancelHandler threw:", handlerErr);
        }
      }
      await sendUserNotification(userId, {
        type: "transaction_cancelled",
        title: "🚫 Transaction Cancelled",
        body: `Your ${txType} transaction of $${Number(amount || 0).toFixed(2)} has been cancelled. Access has been revoked. If you believe this is a mistake, please contact support.`,
      });
      setTxs(prev =>
        prev.map(tx => tx.id === txId ? { ...tx, status: "cancelled" } : tx)
      );
      notify(`✅ Transaction cancelled and access revoked for ${userName}`, "success");
    } catch (e) {
      notify(`❌ Cancel failed: ${e.message}`, "error");
    }
    setCancelLoading(false);
    setCancelConfirm(null);
  };

  // ── Delete single transaction permanently (unchanged) ──────────────────────
  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return;
    setDeleteLoading(true);
    try {
      await deleteTransactionDoc(deleteConfirm.txId);
      setTxs(prev => prev.filter(tx => tx.id !== deleteConfirm.txId));
      notify(`🗑️ Transaction ${deleteConfirm.txRef} permanently deleted`, "success");
    } catch (e) {
      notify(`❌ Delete failed: ${e.message}`, "error");
    }
    setDeleteLoading(false);
    setDeleteConfirm(null);
  };

  // ── Clear entire transactions table (unchanged) ────────────────────────────
  const handleClearTable = async () => {
    setClearLoading(true);
    try {
      await Promise.all(transactions.map(tx => deleteTransactionDoc(tx.id).catch(() => {})));
      setTxs([]);
      notify("🗑️ All transactions permanently deleted", "success");
    } catch (e) {
      notify(`❌ Clear failed: ${e.message}`, "error");
    }
    setClearLoading(false);
    setClearConfirm(false);
  };

  // ── Export helpers (unchanged) ─────────────────────────────────────────────
  const exportTransactions = () => {
    const rows = filteredTxs.map(t => ({
      "Transaction ID": t.id || "-",
      Date:             safeFormatDate(t.createdAt),
      UserID:           t.userId || "-",
      Type:             t.type || "-",
      Item:             t.planId || t.examId || "-",
      Amount:           `$${formatMoney(t.amount)}`,
      Method:           t.paymentMethod || "paypal",
      Coupon:           (t.couponCode && t.couponCode.trim()) ? t.couponCode : "-",
      Discount:         `$${formatMoney(t.discount)}`,
      Status:           t.status || "completed",
      Reference:        t.paypalOrderId || t.stripePaymentId || t.referenceId || "-",
    }));
    exportToExcel(
      rows,
      `Transactions_${new Date().toISOString().split("T")[0]}.xlsx`,
      ["Transaction ID","Date","UserID","Type","Item","Amount","Method","Coupon","Discount","Status","Reference"],
      notify
    );
  };

  const exportInstapays = () => {
    const rows = instapays.map(i => ({
      Date:        safeFormatDate(i.submittedAt),
      UserID:      i.userId || "-",
      SenderName:  i.senderName || "-",
      ReferenceID: i.referenceId || "-",
      Amount:      `$${toSafeNumber(i.amountUSD)} USD`,
      Type:        i.planId ? `Plan: ${i.planId}` : `Exam: ${i.examId || "-"}`,
      Status:      i.status || "pending",
      Note:        i.note || "-",
    }));
    exportToExcel(
      rows,
      `Instapay_${new Date().toISOString().split("T")[0]}.xlsx`,
      ["Date","UserID","SenderName","ReferenceID","Amount","Type","Status","Note"],
      notify
    );
  };

  const exportRefunds = () => {
    const rows = refunds.map(r => ({
      Date:    safeFormatDate(r.submittedAt),
      UserID:  r.userId || "-",
      TxID:    r.transactionId || "-",
      Amount:  `$${formatMoney(r.amount)}`,
      Reason:  r.reason || "-",
      PayPal:  r.paypalAccount || "-",
      Status:  r.status || "pending",
      Note:    r.reviewNote || "-",
    }));
    exportToExcel(
      rows,
      `Refunds_${new Date().toISOString().split("T")[0]}.xlsx`,
      ["Date","UserID","TxID","Amount","Reason","PayPal","Status","Note"],
      notify
    );
  };

  // ── Style helpers (unchanged) ──────────────────────────────────────────────
  const inputStyle = {
    padding: "9px 12px", borderRadius: 10,
    border: "1.5px solid var(--border, #ddd)",
    background: "var(--bg2, #fff)", color: "var(--text, #000)",
    fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box",
  };
  const selectStyle = { ...inputStyle, appearance: "auto" };
  const btnStyle = (color = "var(--accent, #3b82f6)") => ({
    padding: "8px 16px", borderRadius: 10,
    border: `1.5px solid ${color}40`, background: `${color}10`,
    color, fontWeight: 800, cursor: "pointer",
    fontSize: 12, fontFamily: "inherit",
    display: "flex", gap: 6, alignItems: "center", transition: "all 0.2s",
  });

  // ── Error state (unchanged) ────────────────────────────────────────────────
  if (error && !loading && !transactions.length && !instapays.length && !refunds.length) {
    return (
      <div style={{ textAlign: "center", padding: 40, background: "var(--bg2)", borderRadius: 20, border: "1px solid var(--border)" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
        <div style={{ color: "var(--text)", fontWeight: 700, marginBottom: 8 }}>Failed to load revenue data</div>
        <div style={{ color: "var(--text3)", marginBottom: 16 }}>{error}</div>
        <button onClick={() => loadAll()} style={{ ...btnStyle("#059669"), margin: "0 auto" }}>
          <I n="refresh" s={14} /> Retry
        </button>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  return (
    <div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* ── Screenshot Preview Modal (new) ─────────────────────────────────── */}
      {previewImage && (
        <div
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 10000, cursor: "pointer", padding: 20,
          }}
          onClick={() => setPreviewImage(null)}
        >
          <img
            src={previewImage}
            alt="Screenshot preview"
            style={{ maxWidth: "90vw", maxHeight: "90vh", borderRadius: 12, boxShadow: "0 20px 40px rgba(0,0,0,0.4)" }}
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={() => setPreviewImage(null)}
            style={{
              position: "absolute", top: 20, right: 30,
              background: "rgba(0,0,0,0.6)", border: "none", borderRadius: "50%",
              width: 40, height: 40, cursor: "pointer", color: "#fff",
              fontSize: 24, display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* ── Note/Action Modal (unchanged) ──────────────────────────────────── */}
      {noteModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: 20 }}>
          <div style={{ background: "var(--bg2)", border: "1.5px solid var(--border)", borderRadius: 20, padding: 28, maxWidth: 420, width: "100%" }}>
            <h3 style={{ fontSize: 16, fontWeight: 900, marginBottom: 6, color: "var(--text)" }}>
              {noteModal.action === "approve"
                ? (noteModal.type === "instapay" ? "🏦 Approve Instapay Payment" : "✅ Approve Refund")
                : (noteModal.type === "instapay" ? "❌ Reject Instapay Payment"  : "❌ Reject Refund")}
            </h3>
            <p style={{ fontSize: 12, color: "var(--text3)", marginBottom: 14 }}>
              Add a note for the user (optional — a default message will be sent if left blank).
            </p>
            <textarea
              value={noteText}
              onChange={e => setNoteText(e.target.value)}
              placeholder={
                noteModal.action === "approve"
                  ? noteModal.type === "instapay" ? "e.g. Payment verified. Access granted!" : "e.g. Refund approved."
                  : noteModal.type === "instapay" ? "e.g. Reference ID not found." : "e.g. Refund window expired."
              }
              rows={3}
              style={{ ...inputStyle, width: "100%", resize: "none", marginBottom: 16 }}
            />
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => { setNoteModal(null); setNoteText(""); }}
                style={{ ...btnStyle("var(--text3)"), flex: 1, justifyContent: "center" }}
              >
                Cancel
              </button>
              <button
                onClick={confirmAction}
                disabled={actionLoading[noteModal.id]}
                style={{
                  flex: 1, padding: "10px", borderRadius: 10, border: "none",
                  background: noteModal.action === "approve"
                    ? "linear-gradient(135deg,#10b981,#059669)"
                    : "linear-gradient(135deg,#dc2626,#b91c1c)",
                  color: "#fff", fontWeight: 800, cursor: "pointer", fontSize: 13, fontFamily: "inherit",
                }}
              >
                Confirm {noteModal.action === "approve" ? "Approval" : "Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Cancel Confirm Modal (unchanged) ───────────────────────────────── */}
      {cancelConfirm && (
        <ConfirmModal
          title="Cancel Transaction"
          icon="⛔"
          description={
            <>
              Cancel the <strong>{cancelConfirm.txType}</strong> transaction of{" "}
              <strong>${formatMoney(cancelConfirm.amount)}</strong> for{" "}
              <strong>{cancelConfirm.userName}</strong>?
              <br />
              <span style={{ fontSize: 11 }}>
                This will <strong>revoke access</strong> (
                {cancelConfirm.txType === "subscription"
                  ? "subscription cancelled"
                  : `exam "${cancelConfirm.examId || cancelConfirm.planId || "—"}" removed`}
                ) and mark the transaction as cancelled.
              </span>
            </>
          }
          confirmLabel="Yes, Cancel & Revoke"
          confirmColor="#dc2626"
          loading={cancelLoading}
          onConfirm={handleCancelConfirm}
          onCancel={() => setCancelConfirm(null)}
        />
      )}

      {/* ── Delete Single TX Confirm (unchanged) ───────────────────────────── */}
      {deleteConfirm && (
        <ConfirmModal
          title="Delete Transaction"
          icon="🗑️"
          description={
            <>
              Permanently delete transaction <code style={{ fontSize: 11 }}>{deleteConfirm.txRef}</code>?
              <br />
              <span style={{ fontSize: 11, color: "#dc2626" }}>This action cannot be undone.</span>
            </>
          }
          confirmLabel="Delete Permanently"
          confirmColor="#dc2626"
          loading={deleteLoading}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}

      {/* ── Clear All TX Confirm (unchanged) ───────────────────────────────── */}
      {clearConfirm && (
        <ConfirmModal
          title="Clear Entire Table"
          icon="☢️"
          description={
            <>
              This will <strong>permanently delete all {transactions.length} transactions</strong> from Firestore.
              <br />
              <span style={{ fontSize: 11, color: "#dc2626" }}>This cannot be undone. KPI cards will reset to zero.</span>
            </>
          }
          confirmLabel={`Delete All ${transactions.length} Transactions`}
          confirmColor="#dc2626"
          loading={clearLoading}
          onConfirm={handleClearTable}
          onCancel={() => setClearConfirm(false)}
        />
      )}

      {/* ── Instapay Delete Single Confirm (unchanged) ─────────────────────── */}
      {instapayDeleteConfirm && (
        <ConfirmModal
          title="Delete Instapay Request"
          icon="🗑️"
          description="Permanently delete this Instapay payment request? This action cannot be undone."
          confirmLabel="Delete Permanently"
          confirmColor="#dc2626"
          loading={instapayDeleteLoading}
          onConfirm={confirmDeleteSingleInstapay}
          onCancel={() => setInstapayDeleteConfirm(null)}
        />
      )}

      {/* ── Instapay Bulk Delete Confirm (unchanged) ───────────────────────── */}
      {instapayBulkDeleteConfirm && (
        <ConfirmModal
          title="Delete Selected Instapay Requests"
          icon="🗑️"
          description={`Delete ${selectedInstapayIds.length} selected Instapay request(s) permanently? This cannot be undone.`}
          confirmLabel={`Delete ${selectedInstapayIds.length} Item(s)`}
          confirmColor="#dc2626"
          loading={instapayDeleteLoading}
          onConfirm={confirmDeleteSelectedInstapay}
          onCancel={() => setInstapayBulkDeleteConfirm(false)}
        />
      )}

      {/* ── Instapay Delete All Confirm (unchanged) ────────────────────────── */}
      {instapayClearAllConfirm && (
        <ConfirmModal
          title="Delete ALL Instapay Requests"
          icon="⚠️"
          description={`Permanently delete ALL ${instapays.length} Instapay payment requests? This action cannot be undone and will clear the entire list.`}
          confirmLabel="Yes, Delete All"
          confirmColor="#dc2626"
          loading={instapayDeleteLoading}
          onConfirm={confirmDeleteAllInstapay}
          onCancel={() => setInstapayClearAllConfirm(false)}
        />
      )}

      {/* ── KPI Cards (unchanged) ──────────────────────────────────────────── */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 14, marginBottom: 14 }}>
          <div style={{ background: "linear-gradient(135deg,#059669,#047857)", borderRadius: 18, padding: "20px 22px", position: "relative", overflow: "hidden", boxShadow: "0 8px 24px rgba(5,150,105,0.25)" }}>
            <div style={{ position: "absolute", top: -20, right: -20, width: 90, height: 90, borderRadius: "50%", background: "rgba(255,255,255,0.08)" }} />
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(255,255,255,0.18)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
              </div>
              <span style={{ fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,0.8)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Net Revenue</span>
            </div>
            <div style={{ fontSize: 32, fontWeight: 900, color: "#fff", marginBottom: 4 }}>${formatMoney(totalRevenue - totalRefunded)}</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", display: "flex", gap: 10 }}>
              <span>Gross: ${formatMoney(totalRevenue)}</span>
              <span>− Refunds: ${formatMoney(totalRefunded)}</span>
            </div>
          </div>
          <div style={{ background: "var(--bg2)", border: "1.5px solid rgba(99,102,241,0.25)", borderRadius: 18, padding: "20px 22px", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: -16, right: -16, width: 70, height: 70, borderRadius: "50%", background: "rgba(99,102,241,0.06)" }} />
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(99,102,241,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              </div>
              <span style={{ fontSize: 11, fontWeight: 800, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.08em" }}>This Month</span>
            </div>
            <div style={{ fontSize: 28, fontWeight: 900, color: "#6366f1" }}>${formatMoney(monthRevenue)}</div>
            <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 4 }}>{new Date().toLocaleString("en",{month:"long",year:"numeric"})}</div>
          </div>
          <div style={{ background: "var(--bg2)", border: "1.5px solid rgba(220,38,38,0.2)", borderRadius: 18, padding: "20px 22px", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: -16, right: -16, width: 70, height: 70, borderRadius: "50%", background: "rgba(220,38,38,0.05)" }} />
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(220,38,38,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.51"/></svg>
              </div>
              <span style={{ fontSize: 11, fontWeight: 800, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Refunds</span>
            </div>
            <div style={{ fontSize: 28, fontWeight: 900, color: "#dc2626" }}>−${formatMoney(totalRefunded)}</div>
            <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 4 }}>{refunds.filter(r=>r.status==="approved").length} approved · {pendingRefunds} pending</div>
          </div>
          <div style={{ background: "var(--bg2)", border: "1.5px solid rgba(245,158,11,0.2)", borderRadius: 18, padding: "20px 22px", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: -16, right: -16, width: 70, height: 70, borderRadius: "50%", background: "rgba(245,158,11,0.05)" }} />
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(245,158,11,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
              </div>
              <span style={{ fontSize: 11, fontWeight: 800, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Filtered</span>
            </div>
            <div style={{ fontSize: 28, fontWeight: 900, color: "#d97706" }}>${formatMoney(filteredRevenue)}</div>
            <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 4 }}>{filteredTxs.length} transactions in view</div>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(155px,1fr))", gap: 10 }}>
          {[
            {
              icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
              label: "Subscriptions", value: subCount, color: "#7c3aed", note: "Plan purchases"
            },
            {
              icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
              label: "Exam Purchases", value: examPurchCount, color: "#0891b2", note: "Individual"
            },
            {
              icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>,
              label: "PayPal Revenue", value: `$${formatMoney(revenueByMethod.paypal)}`, color: "#0070ba", note: ""
            },
            {
              icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
              label: "Stripe Revenue", value: `$${formatMoney(revenueByMethod.stripe)}`, color: "#635bff", note: ""
            },
            {
              icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>,
              label: "Instapay Revenue", value: `$${formatMoney(revenueByMethod.instapay)}`, color: "#10b981", note: "Approved only"
            },
            {
              icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
              label: "Instapay Pending", value: pendingInstapay, color: "#d97706", note: "Needs review",
              onClick: () => setSection("instapay")
            },
            {
              icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>,
              label: "Pending Refunds", value: pendingRefunds, color: "#dc2626", note: "Awaiting review",
              onClick: () => setSection("refunds")
            },
          ].map((s, i) => (
            <div key={i}
              onClick={s.onClick}
              style={{
                background: "var(--bg2)", border: `1.5px solid ${s.color}20`,
                borderRadius: 14, padding: "14px 16px",
                position: "relative", overflow: "hidden",
                cursor: s.onClick ? "pointer" : "default",
                transition: "all 0.2s",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, color: s.color }}>{s.icon}</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: s.color, marginBottom: 3 }}>{s.value}</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text)" }}>{s.label}</div>
              {s.note && <div style={{ fontSize: 10, color: "var(--text3)", marginTop: 2 }}>{s.note}</div>}
              {s.onClick && <div style={{ position: "absolute", top: 12, right: 12, fontSize: 10, color: s.color, fontWeight: 700 }}>→</div>}
            </div>
          ))}
        </div>
      </div>

      {/* ── Section Tabs (unchanged) ───────────────────────────────────────── */}
      {!refundsOnly && (
        <div style={{ display: "flex", gap: 6, marginBottom: 20, background: "var(--bg2)", border: "1.5px solid var(--border)", borderRadius: 14, padding: 5, width: "fit-content", overflowX: "auto" }}>
          {[
            { id: "transactions", label: "💳 Transactions" },
            { id: "instapay",     label: "🏦 Instapay"     },
            ...(!hideRefunds ? [{ id: "refunds", label: "↩️ Refunds" }] : []),
          ].map(s => (
            <button
              key={s.id}
              onClick={() => setSection(s.id)}
              style={{
                padding: "8px 16px", borderRadius: 10, border: "none",
                background: section === s.id ? "var(--gradient-accent,var(--accent,#3b82f6))" : "transparent",
                color: section === s.id ? "#fff" : "var(--text2,#666)",
                fontSize: 12, fontWeight: 700, cursor: "pointer",
                fontFamily: "inherit", transition: "all 0.2s", whiteSpace: "nowrap",
              }}
            >
              {s.label}
              {s.id === "instapay" && pendingInstapay > 0 && (
                <span style={{ marginLeft: 6, background: "#d97706", color: "#fff", borderRadius: 100, padding: "1px 6px", fontSize: 9 }}>{pendingInstapay}</span>
              )}
              {s.id === "refunds" && pendingRefunds > 0 && (
                <span style={{ marginLeft: 6, background: "#dc2626", color: "#fff", borderRadius: 100, padding: "1px 6px", fontSize: 9 }}>{pendingRefunds}</span>
              )}
            </button>
          ))}
          <button onClick={() => loadAll()} disabled={loading} style={{ ...btnStyle("var(--text3)"), marginLeft: "auto" }}>
            <I n="refresh" s={13} />
          </button>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TRANSACTIONS SECTION (unchanged)
      ══════════════════════════════════════════════════════════════════════ */}
      {section === "transactions" && (
        <div>
          {/* Filters row */}
          <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
              <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }}>
                <I n="search" s={14} c="var(--text3)" />
              </span>
              <input
                value={txSearch}
                onChange={e => setTxSearch(e.target.value)}
                placeholder="Search user, exam, TX ID, coupon…"
                style={{ ...inputStyle, paddingLeft: 32, width: "100%" }}
              />
            </div>
            <select value={txPeriodFilter} onChange={e => setTxPeriodFilter(e.target.value)} style={selectStyle}>
              <option value="all">All Time</option>
              <option value="monthly">This Month</option>
              <option value="yearly">This Year</option>
            </select>
            <select value={txExamFilter} onChange={e => setTxExamFilter(e.target.value)} style={{ ...selectStyle, minWidth: 160 }}>
              <option value="all">All Items</option>
              <option value="monthly">Monthly Plan</option>
              <option value="yearly">Yearly Plan</option>
              {exams.map(ex => <option key={ex.id} value={ex.id}>{ex.title || ex.name}</option>)}
            </select>
            <select value={txMethodFilter} onChange={e => setTxMethodFilter(e.target.value)} style={selectStyle}>
              <option value="all">All Methods</option>
              <option value="paypal">PayPal</option>
              <option value="stripe">Stripe</option>
              <option value="instapay">Instapay</option>
            </select>
            <button onClick={exportTransactions} style={btnStyle("#059669")}>
              <I n="dl" s={13} c="#059669" /> Export Excel
            </button>
            <button
              onClick={() => setClearConfirm(true)}
              style={{ ...btnStyle("#dc2626"), marginLeft: "auto" }}
              title="Permanently delete all transactions"
            >
              <I n="trash" s={13} c="#dc2626" /> Clear All
            </button>
          </div>

          <div style={{ marginBottom: 10, fontSize: 12, color: "var(--text3)", display: "flex", gap: 16, flexWrap: "wrap" }}>
            <span>Showing <strong style={{ color: "var(--accent)" }}>{filteredTxs.length}</strong> of {sortedTxs.length} transactions</span>
            <span>Filtered Revenue: <strong style={{ color: "#059669" }}>${formatMoney(filteredRevenue)}</strong></span>
          </div>

          <div style={{ overflowX: "auto", background: "var(--bg2)", border: "1.5px solid var(--border)", borderRadius: 14 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ background: "var(--bg3)" }}>
                  {["TX ID","Date","Student","Type","Item","Amount","Method","Transaction ID","Coupon","Status","Actions"].map(h => (
                    <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontSize: 10, fontWeight: 800, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.07em", borderBottom: "1.5px solid var(--border)", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={11} style={{ padding: 32, textAlign: "center", color: "var(--text3)" }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5" style={{ animation: "spin 0.8s linear infinite" }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg></td></tr>
                ) : filteredTxs.length === 0 ? (
                  <tr><td colSpan={11} style={{ padding: 32, textAlign: "center", color: "var(--text3)", fontSize: 13 }}>No transactions found</td></tr>
                ) : filteredTxs.map((tx, i) => {
                  const user = users?.find(u => u.id === tx.userId);
                  const hasCoupon = tx.couponCode && typeof tx.couponCode === "string" && tx.couponCode.trim().length > 0;
                  return (
                    <tr key={tx.id} style={{ borderBottom: "1px solid var(--border)", background: i % 2 ? "rgba(0,0,0,0.015)" : "transparent" }}>
                      <td style={{ padding: "10px 12px", fontFamily: "monospace", fontSize: 10, color: "var(--text3)", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", userSelect: "all", cursor: "text" }} title={tx.id}>{tx.id}</td>
                      <td style={{ padding: "10px 12px", color: "var(--text3)", whiteSpace: "nowrap", fontSize: 11 }}>{safeFormatDate(tx.createdAt)}</td>
                      <td style={{ padding: "10px 12px" }}><div style={{ fontWeight: 700, fontSize: 11 }}>{user?.name || "—"}</div><div style={{ color: "var(--text3)", fontSize: 10 }}>{user?.email || tx.userId?.slice(0, 10)}</div></td>
                      <td style={{ padding: "10px 12px" }}><span style={{ background: tx.type === "subscription" ? "rgba(99,102,241,0.1)" : "rgba(8,145,178,0.1)", color: tx.type === "subscription" ? "var(--accent)" : "#0891b2", borderRadius: 100, padding: "2px 8px", fontSize: 10, fontWeight: 800 }}>{tx.type}</span></td>
                      <td style={{ padding: "10px 12px", color: "var(--text2)", maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{tx.planId || exams?.find(e => e.id === tx.examId)?.title || tx.examId?.slice(0, 14) || "—"}</td>
                      <td style={{ padding: "10px 12px", fontWeight: 900, color: "var(--green,#10b981)" }}>${formatMoney(tx.amount)}{toSafeNumber(tx.discount) > 0 && <div style={{ fontSize: 9, color: "var(--text3)", fontWeight: 500 }}>-{formatMoney(tx.discount)} off</div>}</td>
                      <td style={{ padding: "10px 12px", fontSize: 11, fontWeight: 700 }}>{({ paypal:"🅿️ PayPal", stripe:"💳 Stripe", instapay:"🏦 Instapay", free:"🆓 Free", reward:"🏆 Reward", coupon:"🏷️ Coupon", admin:"👑 Admin" })[tx.paymentMethod] || (tx.paymentMethod ? `💳 ${tx.paymentMethod}` : (tx.amount === 0 ? "🆓 Free" : "🅿️ PayPal"))}</td>
                      <td style={{ padding: "10px 12px", fontFamily: "monospace", fontSize: 10, color: tx.paypalOrderId || tx.instapayTransactionId || tx.fawaterakInvoiceId ? "var(--accent)" : "var(--text3)" }}>
                        {tx.paypalOrderId ? (
                          <span title={tx.paypalOrderId} style={{ display: "block", maxWidth: 100, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {tx.paypalOrderId.slice(0, 12)}…
                          </span>
                        ) : tx.instapayTransactionId ? (
                          <span title={tx.instapayTransactionId} style={{ display: "block", maxWidth: 100, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "#059669" }}>
                            {tx.instapayTransactionId.slice(0, 12)}…
                          </span>
                        ) : tx.fawaterakInvoiceId ? (
                          <span title={tx.fawaterakInvoiceId} style={{ display: "block", maxWidth: 100, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {tx.fawaterakInvoiceId.slice(0, 12)}…
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td style={{ padding: "10px 12px", fontFamily: "monospace", fontSize: 10, color: hasCoupon ? "var(--accent)" : "var(--text3)" }}>{hasCoupon ? <>{tx.couponCode}<span style={{ marginLeft: 4, fontSize: 9, color: "#059669", fontFamily: "inherit" }}>Applied ✓</span></> : "—"}</td>
                      <td style={{ padding: "10px 12px" }}><StatusBadge status={tx.status || "completed"} /></td>
                      <td style={{ padding: "10px 12px", whiteSpace: "nowrap", display: "flex", gap: 6, alignItems: "center" }}>
                        {tx.userId && tx.status !== "cancelled" && (
                          <button onClick={() => setCancelConfirm({ userId: tx.userId, txId: tx.id, txType: tx.type, examId: tx.examId, planId: tx.planId, amount: tx.amount, userName: user?.name || tx.userId })} style={{ padding: "5px 9px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 7, color: "#dc2626", fontWeight: 700, cursor: "pointer", fontSize: 10, fontFamily: "inherit" }}>✕ Cancel</button>
                        )}
                        <button onClick={() => setDeleteConfirm({ txId: tx.id, txRef: tx.id?.slice(0, 10) + "…" })} title="Delete permanently" style={{ padding: "5px 7px", background: "rgba(107,114,128,0.08)", border: "1px solid rgba(107,114,128,0.25)", borderRadius: 7, color: "#6b7280", cursor: "pointer", display: "flex", alignItems: "center" }}><I n="trash" s={12} c="#6b7280" /></button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{ fontSize: 11, color: "var(--text3)", padding: "8px 0", display: "flex", gap: 16, flexWrap: "wrap" }}>
            <span>{filteredTxs.length} transactions shown</span>
            <span>Filtered total: <strong style={{ color: "#059669" }}>${formatMoney(filteredRevenue)}</strong></span>
            <span>Refunded: <strong style={{ color: "#dc2626" }}>-${formatMoney(totalRefunded)}</strong></span>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          INSTAPAY SECTION (with screenshot preview button)
      ══════════════════════════════════════════════════════════════════════ */}
      {section === "instapay" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <button onClick={exportInstapays} style={btnStyle("#059669")}>
                <I n="dl" s={13} c="#059669" /> Export Excel
              </button>
              {selectedInstapayIds.length > 0 && (
                <button onClick={handleDeleteSelectedInstapay} style={{ ...btnStyle("#dc2626") }} disabled={instapayDeleteLoading}>
                  <I n="trash" s={13} c="#dc2626" /> Delete Selected ({selectedInstapayIds.length})
                </button>
              )}
              {instapays.length > 0 && (
                <button onClick={handleDeleteAllInstapay} style={{ ...btnStyle("#6b7280") }} disabled={instapayDeleteLoading}>
                  <I n="trash" s={13} c="#6b7280" /> Delete All
                </button>
              )}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {loading ? (
              <div style={{ padding: 32, textAlign: "center", color: "var(--text3)" }}>Loading…</div>
            ) : instapays.length === 0 ? (
              <div style={{ padding: 32, textAlign: "center", color: "var(--text3)", background: "var(--bg2)", borderRadius: 14, border: "1.5px solid var(--border)" }}>
                🏦 No Instapay payments yet
              </div>
            ) : (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "0 8px" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text2)" }}>
                    <input type="checkbox" checked={selectAllInstapay} onChange={(e) => handleSelectAllInstapay(e.target.checked)} style={{ width: 16, height: 16, cursor: "pointer" }} />
                    Select All
                  </label>
                  <span style={{ fontSize: 11, color: "var(--text3)" }}>{selectedInstapayIds.length} selected</span>
                </div>

                {instapays.map(ip => {
                  const user = users?.find(u => u.id === ip.userId);
                  const hasScreenshot = !!ip.screenshotUrl;
                  return (
                    <div
                      key={ip.id}
                      style={{
                        background: "var(--bg2)",
                        border: `1.5px solid ${ip.status === "pending" ? "rgba(245,158,11,0.35)" : ip.status === "approved" ? "rgba(16,185,129,0.25)" : "rgba(239,68,68,0.25)"}`,
                        borderRadius: 14, padding: "16px 18px",
                        position: "relative",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                        <div style={{ paddingTop: 4 }}>
                          <input
                            type="checkbox"
                            checked={selectedInstapayIds.includes(ip.id)}
                            onChange={(e) => handleSelectInstapay(ip.id, e.target.checked)}
                            style={{ width: 18, height: 18, cursor: "pointer" }}
                          />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10 }}>
                            <div>
                              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                                <StatusBadge status={ip.status} />
                                <span style={{ fontSize: 12, color: "var(--text3)" }}>{safeFormatDate(ip.submittedAt)}</span>
                              </div>
                              <div style={{ fontSize: 14, fontWeight: 800, color: "var(--text)", marginBottom: 4 }}>
                                {user?.name || "Unknown User"}
                                {user?.country && <span style={{ fontSize: 11, color: "var(--text3)", fontWeight: 600, marginLeft: 8 }}>🌍 {user.country}</span>}
                              </div>
                              {ip.senderName && (
                                <div style={{ fontSize: 12, color: "var(--accent)", marginBottom: 4 }}>
                                  👤 Sender: {ip.senderName}
                                </div>
                              )}
                              <div style={{ fontSize: 12, color: "var(--text2)", marginBottom: 4 }}>
                                {ip.planId
                                  ? `📦 Plan: ${ip.planId}`
                                  : ip.examId
                                    ? `📋 Exam: ${exams?.find(e => e.id === ip.examId)?.title || ip.examId}`
                                    : "—"}
                              </div>
                              <div style={{ display: "flex", gap: 14, flexWrap: "wrap", fontSize: 12 }}>
                                <span><strong style={{ color: "var(--green)" }}>${toSafeNumber(ip.amountUSD).toFixed(2)} USD</strong></span>
                                <span>Ref: <code style={{ background: "var(--bg3)", padding: "1px 6px", borderRadius: 4, fontSize: 11, color: "var(--accent)" }}>{ip.referenceId}</code></span>
                                <span style={{ color: "var(--text3)" }}>User: {ip.userId?.slice(0, 10)}…</span>
                              </div>
                              {ip.note && (
                                <div style={{ marginTop: 6, fontSize: 11, color: "var(--text3)", fontStyle: "italic" }}>
                                  Note: {ip.note}
                                </div>
                              )}
                            </div>
                            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                              {hasScreenshot && (
                                <button
                                  onClick={() => setPreviewImage(ip.screenshotUrl)}
                                  title="Preview screenshot"
                                  style={{ ...btnStyle("#6366f1"), padding: "8px 10px" }}
                                >
                                  <I n="eye" s={14} c="#6366f1" /> Preview
                                </button>
                              )}
                              {ip.status === "pending" && (
                                <>
                                  <button
                                    onClick={() => handleInstapay(ip.id, "approve")}
                                    disabled={actionLoading[ip.id]}
                                    style={{ padding: "8px 16px", background: "linear-gradient(135deg,#10b981,#059669)", border: "none", borderRadius: 10, color: "#fff", fontWeight: 800, cursor: "pointer", fontSize: 12, fontFamily: "inherit", display: "flex", gap: 5, alignItems: "center" }}
                                  >
                                    <I n="check" s={12} c="#fff" /> Approve
                                  </button>
                                  <button
                                    onClick={() => handleInstapay(ip.id, "reject")}
                                    disabled={actionLoading[ip.id]}
                                    style={{ padding: "8px 16px", background: "rgba(239,68,68,0.1)", border: "1.5px solid rgba(239,68,68,0.3)", borderRadius: 10, color: "var(--red,#dc2626)", fontWeight: 800, cursor: "pointer", fontSize: 12, fontFamily: "inherit", display: "flex", gap: 5, alignItems: "center" }}
                                  >
                                    <I n="x" s={12} c="var(--red)" /> Reject
                                  </button>
                                </>
                              )}
                              <button
                                onClick={() => handleDeleteSingleInstapay(ip.id)}
                                title="Delete permanently"
                                style={{ padding: "6px 10px", background: "rgba(107,114,128,0.1)", border: "1px solid rgba(107,114,128,0.3)", borderRadius: 8, color: "#6b7280", cursor: "pointer" }}
                              >
                                <I n="trash" s={14} c="#6b7280" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          REFUNDS SECTION (unchanged)
      ══════════════════════════════════════════════════════════════════════ */}
      {section === "refunds" && (
        <div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
            <button onClick={exportRefunds} style={btnStyle("#059669")}>
              <I n="dl" s={13} c="#059669" /> Export Excel
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {loading ? (
              <div style={{ padding: 32, textAlign: "center", color: "var(--text3)" }}>Loading…</div>
            ) : refunds.length === 0 ? (
              <div style={{ padding: 32, textAlign: "center", color: "var(--text3)", background: "var(--bg2)", borderRadius: 14, border: "1.5px solid var(--border)" }}>
                ↩️ No refund requests yet
              </div>
            ) : refunds.map(r => {
              const user = users?.find(u => u.id === r.userId);
              const origTx = transactions?.find(t => t.id === r.transactionId);
              const payMethod = origTx?.paymentMethod || r.paymentMethod || "paypal";
              const payMethodLabels = { paypal: "PayPal", stripe: "Stripe", instapay: "Instapay", free: "Free", reward: "Reward" };
              const progressPct = r.usagePercent ?? r.examProgress ?? null;
              const examTitle = origTx?.examId ? (exams?.find(e => e.id === origTx.examId)?.title || origTx.examId) : origTx?.planId ? `${origTx.planId === "monthly" ? "Monthly" : "Yearly"} Subscription` : r.examId ? (exams?.find(e => e.id === r.examId)?.title || r.examId) : null;

              return (
                <div key={r.id} style={{ background: "var(--bg2)", border: `1.5px solid ${r.status === "pending" ? "rgba(239,68,68,0.3)" : r.status === "approved" ? "rgba(16,185,129,0.25)" : "rgba(100,116,139,0.2)"}`, borderRadius: 16, overflow: "hidden" }}>
                  <div style={{ padding: "16px 18px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                        <StatusBadge status={r.status} />
                        <span style={{ fontSize: 12, color: "var(--text3)" }}>{safeFormatDate(r.submittedAt)}</span>
                      </div>
                      <div style={{ fontSize: 15, fontWeight: 900, color: "var(--text)", marginBottom: 6 }}>
                        {user?.name || r.userId?.slice(0, 12) + "…"}
                        {user?.email && <span style={{ fontSize: 11, fontWeight: 500, color: "var(--text3)", marginLeft: 8 }}>{user.email}</span>}
                      </div>
                      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", fontSize: 12, color: "var(--text2)" }}>
                        <span>💰 <strong style={{ color: "#059669" }}>${formatMoney(r.amount)}</strong></span>
                        <span>💳 {payMethodLabels[payMethod] || payMethod}</span>
                        {examTitle && <span>📋 {examTitle}</span>}
                        {r.transactionId && <span style={{ fontFamily: "monospace", fontSize: 11, color: "var(--text3)" }}>TX: {r.transactionId.slice(0,14)}…</span>}
                      </div>
                    </div>
                    {r.status === "pending" && (
                      <div style={{ display: "flex", gap: 8 }}>
                        <button onClick={() => handleRefund(r.id, "approve")} disabled={actionLoading[r.id]} style={{ padding: "8px 16px", background: "linear-gradient(135deg,#10b981,#059669)", border: "none", borderRadius: 10, color: "#fff", fontWeight: 800, cursor: "pointer", fontSize: 12, fontFamily: "inherit", display: "flex", gap: 5, alignItems: "center" }}><I n="check" s={12} c="#fff" /> Approve</button>
                        <button onClick={() => handleRefund(r.id, "reject")} disabled={actionLoading[r.id]} style={{ padding: "8px 16px", background: "rgba(239,68,68,0.1)", border: "1.5px solid rgba(239,68,68,0.3)", borderRadius: 10, color: "var(--red,#dc2626)", fontWeight: 800, cursor: "pointer", fontSize: 12, fontFamily: "inherit", display: "flex", gap: 5, alignItems: "center" }}><I n="x" s={12} c="var(--red)" /> Reject</button>
                      </div>
                    )}
                  </div>
                  <div style={{ padding: "12px 18px 16px", borderTop: "1px solid var(--border)", background: "var(--bg3)", display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: 10 }}>
                    {progressPct !== null && (
                      <div style={{ background: "var(--bg2)", borderRadius: 10, padding: "10px 12px" }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Exam Progress</div>
                        <div style={{ height: 6, background: "var(--bg3)", borderRadius: 99, overflow: "hidden", marginBottom: 4 }}><div style={{ height: "100%", width: `${Math.min(100, progressPct)}%`, background: progressPct > 15 ? "#ef4444" : "#10b981", borderRadius: 99 }} /></div>
                        <div style={{ fontSize: 12, fontWeight: 800, color: progressPct > 15 ? "#ef4444" : "#10b981" }}>{progressPct.toFixed(0)}% used {progressPct > 15 && "⚠️ Over limit"}</div>
                      </div>
                    )}
                    <div style={{ background: "var(--bg2)", borderRadius: 10, padding: "10px 12px" }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Reason</div>
                      <div style={{ fontSize: 12, color: "var(--text)", lineHeight: 1.4 }}>{r.reason || "No reason provided"}</div>
                    </div>
                    <div style={{ background: "var(--bg2)", borderRadius: 10, padding: "10px 12px" }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Refund Via</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text)" }}>{payMethodLabels[payMethod] || payMethod}</div>
                      {r.paypalAccount && <div style={{ fontSize: 11, color: "var(--accent)", marginTop: 2 }}>{r.paypalAccount}</div>}
                      {r.bankDetails && <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 2 }}>{r.bankDetails}</div>}
                    </div>
                    <div style={{ background: "var(--bg2)", borderRadius: 10, padding: "10px 12px" }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>User Info</div>
                      <div style={{ fontSize: 12, color: "var(--text)", fontWeight: 700 }}>{user?.name || "Unknown"}</div>
                      {user?.country && <div style={{ fontSize: 11, color: "var(--text3)" }}>🌍 {user.country}</div>}
                      {user?.email && <div style={{ fontSize: 10, color: "var(--text3)", marginTop: 2, wordBreak: "break-all" }}>{user.email}</div>}
                    </div>
                    {origTx?.createdAt && (() => {
                      const purchaseDate = origTx.createdAt?.toDate ? origTx.createdAt.toDate() : new Date(origTx.createdAt);
                      const days = Math.floor((Date.now() - purchaseDate.getTime()) / 86400000);
                      return (
                        <div style={{ background: "var(--bg2)", borderRadius: 10, padding: "10px 12px" }}>
                          <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Purchase Age</div>
                          <div style={{ fontSize: 14, fontWeight: 800, color: days > 7 ? "#ef4444" : "#10b981" }}>{days} day{days !== 1 ? "s" : ""} ago</div>
                          {days > 7 && <div style={{ fontSize: 10, color: "#ef4444", marginTop: 2 }}>⚠️ Past 7-day window</div>}
                        </div>
                      );
                    })()}
                    {r.reviewNote && (
                      <div style={{ background: "var(--bg2)", borderRadius: 10, padding: "10px 12px", gridColumn: "1/-1" }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Admin Note</div>
                        <div style={{ fontSize: 12, color: "var(--text2)", fontStyle: "italic" }}>{r.reviewNote}</div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}