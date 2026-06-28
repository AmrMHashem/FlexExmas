// services/payment.js — FlexExams Payment Service v5.0 (Client-side PayPal)
// PayPal Live Client ID فقط (لا يوجد Secret في الكود العميل)

import {
  db,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
} from "../firebase";

if (typeof process === "undefined") {
  window.process = { env: {} };
}

// ─── PayPal Config (Live Client ID) ────────────────────────────────
export const PAYPAL_CLIENT_ID = "AdvNWjFutpInZmJWWhndIJpFFDNzAD63RcbHVd18TgqBPPv_3l3iXxiyMIu__qW-InQ6L6n2alqlgP8a";

// ─── Fawaterak Config (اختياري) ───────────────────────────────────
export const FAWATERAK_API_KEY =
  import.meta.env.VITE_FAWATERAK_API_KEY ||
  "001abdcd21d4e6824906ee8fd838447f2c0b76513e83bafcc3";
export const FAWATERAK_PROVIDER_KEY =
  import.meta.env.VITE_FAWATERAK_PROVIDER_KEY || "FAWATERAK.28623";
export const FAWATERAK_BASE_URL = "https://fawaterk.com/api/v2";

// ─── Instapay Config ─────────────────────────────────────────────
export const INSTAPAY_ACCOUNT =
  import.meta.env.VITE_INSTAPAY_ACCOUNT || "amr_mhashem@instapay";
export const INSTAPAY_PHONE =
  import.meta.env.VITE_INSTAPAY_PHONE || "+20XXXXXXXXXX";

// ─── Plans Config ────────────────────────────────────────────────
export const DEFAULT_PLANS = {
  monthly: {
    id: "monthly",
    name: "Monthly",
    nameAr: "شهري",
    price: 9.99,
    currency: "USD",
    interval: "month",
    features: [
      "Unlimited access to all exams",
      "Detailed explanations",
      "Progress tracking",
      "PDF certificates",
      "Priority support",
    ],
  },
  yearly: {
    id: "yearly",
    name: "Yearly",
    nameAr: "سنوي",
    price: 79.99,
    currency: "USD",
    interval: "year",
    monthlyEquivalent: 6.67,
    savingsPercent: 33,
    features: [
      "Everything in Monthly",
      "33% savings vs monthly",
      "Career diagnostic tool",
      "Exclusive exam bundles",
      "Early access to new exams",
    ],
  },
};

// ─── Platform Settings ────────────────────────────────────────────
export async function getPlatformSettings() {
  try {
    const snap = await getDoc(doc(db, "settings", "platform"));
    if (snap.exists()) return snap.data();
    return { plans: DEFAULT_PLANS, coupons: [] };
  } catch (e) {
    console.warn("getPlatformSettings: using defaults");
    return { plans: DEFAULT_PLANS, coupons: [] };
  }
}

export async function updatePlatformSettings(data) {
  await setDoc(
    doc(db, "settings", "platform"),
    { ...data, updatedAt: serverTimestamp() },
    { merge: true }
  );
  return true;
}

// ─── Exam Pricing ─────────────────────────────────────────────────
export async function updateExamPricing(examId, pricingData) {
  await updateDoc(doc(db, "exams", examId), {
    pricing: {
      price: pricingData.price || 0,
      originalPrice: pricingData.originalPrice || null,
      discount: pricingData.discount || 0,
      couponCode: pricingData.couponCode || null,
      isFree: pricingData.isFree || false,
    },
    updatedAt: serverTimestamp(),
  });
}

// ─── Coupon Validation ────────────────────────────────────────────
export async function validateCoupon(
  code,
  examId = null,
  planId = null,
  userId = null
) {
  try {
    const settings = await getPlatformSettings();
    const coupons = settings.coupons || [];
    const coupon = coupons.find(
      (c) => c.code?.toUpperCase() === code?.toUpperCase() && c.isActive
    );

    if (!coupon) return { valid: false, error: "Invalid coupon code" };
    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date())
      return { valid: false, error: "Coupon has expired" };
    if (coupon.maxUses && coupon.usedCount >= coupon.maxUses)
      return { valid: false, error: "Coupon has reached its usage limit" };
    if (examId && coupon.examIds?.length && !coupon.examIds.includes(examId))
      return { valid: false, error: "Coupon not valid for this exam" };
    if (planId && coupon.planIds?.length && !coupon.planIds.includes(planId))
      return { valid: false, error: "Coupon not valid for this plan" };

    if (coupon.onePerUser && userId) {
      const used = Array.isArray(coupon.usedByUsers) ? coupon.usedByUsers : [];
      if (used.includes(userId))
        return { valid: false, error: "You have already used this coupon" };
    }

    return {
      valid: true,
      discount: coupon.discountPercent || 0,
      discountAmount: coupon.discountAmount || 0,
      coupon,
    };
  } catch (e) {
    console.error("validateCoupon error:", e);
    return { valid: false, error: "Failed to validate coupon" };
  }
}

// ─── Fawaterak: Create Invoice ───────────────────────────────────
export async function createFawaterakInvoice({
  amount,
  amountUSD = 0,
  currency = "EGP",
  description,
  customer,
  cartItems,
  userId,
  planId = null,
  examId = null,
  successUrl,
  failUrl,
  pendingUrl,
}) {
  try {
    const response = await fetch(`${FAWATERAK_BASE_URL}/invoiceInitPay`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${FAWATERAK_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        cartTotal: String(parseFloat(amount).toFixed(2)),
        currency,
        customer: {
          first_name: customer.first_name || "Customer",
          last_name: customer.last_name || ".",
          email: customer.email || "noreply@flexexams.com",
          phone: customer.phone || "01000000000",
          address: customer.address || "Egypt",
        },
        cartItems: cartItems || [
          {
            name: description || "FlexExams Payment",
            price: String(parseFloat(amount).toFixed(2)),
            quantity: "1",
          },
        ],
        redirectionUrls: {
          successUrl:
            successUrl ||
            `${window.location.origin}/?fawaterak=success&userId=${userId}&planId=${planId || ""}&examId=${examId || ""}`,
          failUrl: failUrl || `${window.location.origin}/?fawaterak=fail`,
          pendingUrl:
            pendingUrl ||
            `${window.location.origin}/?fawaterak=pending&userId=${userId}&planId=${planId || ""}&examId=${examId || ""}`,
        },
        providerKey: FAWATERAK_PROVIDER_KEY,
      }),
    });

    const data = await response.json();

    if (data.status === "success" && data.data?.url) {
      return {
        success: true,
        paymentUrl: data.data.url,
        invoiceId: data.data.invoiceId || data.data.id || null,
        invoiceKey: data.data.invoiceKey || null,
      };
    }

    return {
      success: false,
      error: data.message || data.msg || "Failed to create payment invoice",
    };
  } catch (e) {
    console.error("createFawaterakInvoice error:", e);
    return { success: false, error: e.message || "Network error — please try again" };
  }
}

export async function verifyFawaterakInvoice(invoiceId) {
  try {
    const response = await fetch(`${FAWATERAK_BASE_URL}/invoices/${invoiceId}`, {
      headers: {
        Authorization: `Bearer ${FAWATERAK_API_KEY}`,
        "Content-Type": "application/json",
      },
    });
    const data = await response.json();
    return data;
  } catch (e) {
    console.error("verifyFawaterakInvoice error:", e);
    return null;
  }
}

// ─── Instapay: Submit Manual Payment ─────────────────────────────
export async function submitInstapayPayment(userId, data) {
  const ref = await addDoc(collection(db, "instapay_payments"), {
    userId,
    referenceId: data.referenceId,
    amount: data.amount,
    amountUSD: data.amountUSD || 0,
    currency: data.currency || "EGP",
    planId: data.planId || null,
    examId: data.examId || null,
    description: data.description || "",
    status: "pending",
    screenshotUrl: data.screenshotUrl || null,
    submittedAt: serverTimestamp(),
    reviewedAt: null,
    reviewedBy: null,
    note: "",
  });
  return ref.id;
}

// ─── Send Notification to User ────────────────────────────────────
export async function sendNotification(userId, { type, title, body, data = {} }) {
  try {
    const { limit: fbLimitFn, deleteDoc: fbDeleteDoc } = await import("firebase/firestore");

    const recentSnap = await getDocs(
      query(
        collection(db, "notifications"),
        where("userId", "==", userId),
        orderBy("createdAt", "desc"),
        fbLimitFn(20)
      )
    );
    const recentNotifs = recentSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;

    const isDuplicate = recentNotifs.some((n) => {
      const nDate = n.createdAt?.toDate
        ? n.createdAt.toDate().getTime()
        : n.data?.sentAt || 0;

      if (nDate <= fiveMinutesAgo) return false;
      if (n.type !== type) return false;

      if (type === "admin_message" || type === "contact_reply") {
        return n.title === title && n.body === body;
      }

      const sameExam = (n.data?.examId || null) === (data.examId || null);
      const samePlan = (n.data?.planId || null) === (data.planId || null);
      return sameExam && samePlan;
    });

    if (isDuplicate) {
      console.warn("sendNotification: duplicate blocked", { type, title, userId });
      return;
    }

    await addDoc(collection(db, "notifications"), {
      userId,
      type: type || "info",
      title,
      body,
      data: { ...data, sentAt: Date.now() },
      isRead: false,
      createdAt: serverTimestamp(),
    });

    const capSnap = await getDocs(
      query(
        collection(db, "notifications"),
        where("userId", "==", userId),
        orderBy("createdAt", "desc"),
        fbLimitFn(25)
      )
    ).catch(() => null);

    if (capSnap && capSnap.docs.length > 20) {
      const toDelete = capSnap.docs.slice(20);
      await Promise.all(toDelete.map((d) => fbDeleteDoc(d.ref).catch(() => {})));
    }
  } catch (e) {
    console.error("sendNotification error:", e);
  }
}

// ─── Report Status with Notification ──────────────────────────────
export async function updateReportStatusWithNotification(
  reportId,
  status,
  adminUid,
  note = ""
) {
  const rSnap = await getDoc(doc(db, "reports", reportId));
  await updateDoc(doc(db, "reports", reportId), {
    status,
    reviewNote: note,
    reviewedAt: serverTimestamp(),
    reviewedBy: adminUid,
    updatedAt: serverTimestamp(),
  });

  if (rSnap.exists() && rSnap.data().userId) {
    const { userId, questionText } = rSnap.data();
    await sendNotification(userId, {
      type: `report_${status}`,
      title:
        status === "resolved"
          ? "⚠️ Report Reviewed"
          : status === "dismissed"
            ? "📋 Report Dismissed"
            : "📋 Report Update",
      body: note,
      data: {
        reportId,
        status,
        questionText: questionText?.slice(0, 80) || "",
      },
    });
  }
}

// ─── Cancel Transaction (Admin) ───────────────────────────────────
export async function cancelTransaction(txId, adminUid, note = "") {
  const txRef = doc(db, "transactions", txId);
  const txSnap = await getDoc(txRef);
  await updateDoc(txRef, {
    status: "cancelled",
    cancelledAt: serverTimestamp(),
    cancelledBy: adminUid,
    cancelNote: note,
  });

  if (!txSnap.exists()) return;
  const tx = txSnap.data();

  if (tx.type === "subscription" || tx.planId) {
    await setDoc(
      doc(db, "subscriptions", tx.userId),
      {
        status: "cancelled",
        cancelledAt: new Date().toISOString(),
        cancelledBy: adminUid,
        cancelNote: note,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } else if (tx.type === "exam" && tx.examId) {
    const userSnap = await getDoc(doc(db, "users", tx.userId));
    if (userSnap.exists()) {
      const purchasedExams = { ...(userSnap.data().purchasedExams || {}) };
      delete purchasedExams[tx.examId];
      await setDoc(
        doc(db, "users", tx.userId),
        { purchasedExams },
        { merge: true }
      );
    }
  }

  await sendNotification(tx.userId, {
    type: "transaction_cancelled",
    title:
      tx.type === "subscription"
        ? "🚫 Subscription Cancelled"
        : tx.examTitle
          ? `🚫 Exam Access Revoked — ${tx.examTitle}`
          : "🚫 Transaction Cancelled",
    body:
      note ||
      (tx.type === "subscription"
        ? "Your subscription has been cancelled by the admin. Access has been revoked."
        : "Your exam purchase has been cancelled. Access has been revoked. Contact support if this is a mistake."),
    data: {
      txId,
      type: tx.type,
      planId: tx.planId || null,
      examId: tx.examId || null,
      examTitle: tx.examTitle || null,
    },
  });
}

export async function cancelSubscription(userId, adminUid, note = "") {
  await setDoc(
    doc(db, "subscriptions", userId),
    {
      status: "cancelled",
      cancelledAt: new Date().toISOString(),
      cancelledBy: adminUid,
      cancelNote: note,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  await sendNotification(userId, {
    type: "subscription_cancelled",
    title: "❌ Subscription Cancelled",
    body:
      note ||
      "Your subscription has been cancelled. You will lose access at the end of your billing period.",
    data: { adminUid },
  });
}

// ─── Instapay: Admin Actions ──────────────────────────────────────
export async function approveInstapayPayment(paymentId, adminUid, note = "") {
  const payRef = doc(db, "instapay_payments", paymentId);
  const paySnap = await getDoc(payRef);
  if (!paySnap.exists()) throw new Error("Payment not found");

  const payment = paySnap.data();
  await updateDoc(payRef, {
    status: "approved",
    reviewedAt: serverTimestamp(),
    reviewedBy: adminUid,
    note,
  });

  const usdAmount = payment.amountUSD ?? payment.amount;

  const txId = await saveTransaction(payment.userId, {
    type: payment.planId ? "subscription" : "exam",
    planId: payment.planId,
    examId: payment.examId,
    amount: usdAmount,
    currency: "USD",
    paymentMethod: "instapay",
    referenceId: payment.referenceId,
    status: "completed",
    autoRenew: false,
  });

  if (payment.planId) {
    await grantSubscription(payment.userId, payment.planId, txId, false);
  } else if (payment.examId) {
    await grantExamAccess(payment.userId, payment.examId, txId);
  }

  await sendNotification(payment.userId, {
    type: "instapay_approved",
    title: payment.examId
      ? `✅ Instapay Approved — Exam Access Granted`
      : `✅ Instapay Subscription Approved`,
    body:
      note ||
      (payment.examId
        ? `Your Instapay payment of $${Number(usdAmount).toFixed(2)} was approved. You now have full access to your exam.`
        : `Your Instapay payment of $${Number(usdAmount).toFixed(2)} was approved. Your subscription is now active!`),
    data: {
      txId,
      paymentId,
      amount: usdAmount,
      examTitle: payment.examTitle || null,
      examId: payment.examId || null,
      planId: payment.planId || null,
    },
  });

  return txId;
}

export async function rejectInstapayPayment(paymentId, adminUid, note = "") {
  const payRef = doc(db, "instapay_payments", paymentId);
  const paySnap = await getDoc(payRef);
  await updateDoc(payRef, {
    status: "rejected",
    reviewedAt: serverTimestamp(),
    reviewedBy: adminUid,
    note,
  });

  if (paySnap.exists()) {
    const payment = paySnap.data();
    await sendNotification(payment.userId, {
      type: "instapay_rejected",
      title: "❌ Payment Rejected",
      body: note || "Your Instapay payment could not be verified. Please contact support.",
      data: { paymentId },
    });
  }
}

export async function getAllInstapayPayments() {
  try {
    const snap = await getDocs(
      query(collection(db, "instapay_payments"), orderBy("submittedAt", "desc"))
    );
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (e) {
    return [];
  }
}

// ─── Save Transaction ─────────────────────────────────────────────
export async function saveTransaction(userId, data) {
  const dedupId =
    data.paypalOrderId || data.fawaterakInvoiceId || data.referenceId || null;
  if (dedupId) {
    try {
      const existing = await getDocs(
        query(
          collection(db, "transactions"),
          where("userId", "==", userId),
          ...(data.paypalOrderId
            ? [where("paypalOrderId", "==", data.paypalOrderId)]
            : data.fawaterakInvoiceId
              ? [where("fawaterakInvoiceId", "==", data.fawaterakInvoiceId)]
              : [where("referenceId", "==", data.referenceId)])
        )
      );
      if (!existing.empty) {
        console.warn("⚠️ saveTransaction: duplicate detected, returning existing txId");
        return existing.docs[0].id;
      }
    } catch (_) {}
  }

  const txData = {
    userId,
    type: data.type,
    planId: data.planId || null,
    examId: data.examId || null,
    amount: data.amount,
    originalAmount: data.originalAmount ?? data.amount,
    currency: data.currency || "USD",
    paymentMethod: data.paymentMethod || "paypal",
    paypalOrderId: data.paypalOrderId || null,
    paypalPayerId: data.paypalPayerId || null,
    fawaterakInvoiceId: data.fawaterakInvoiceId || null,
    referenceId: data.referenceId || data.fawaterakInvoiceId || null,
    status: data.status || "completed",
    couponCode: data.couponCode || null,
    discount: data.discount || 0,
    autoRenew: data.autoRenew ?? false,
    createdAt: serverTimestamp(),
  };

  try {
    const txRef = await addDoc(collection(db, "transactions"), txData);
    const isSubscription = data.type === "subscription";
    const examLabel = data.examTitle ? ` for "${data.examTitle}"` : "";
    const planLabel =
      data.planId === "monthly" ? "Monthly" : data.planId === "yearly" ? "Yearly" : data.planId || "";
    await sendNotification(userId, {
      type: "payment_success",
      title: isSubscription
        ? `✅ ${planLabel} Subscription Activated`
        : `✅ Exam Access Granted${examLabel}`,
      body: isSubscription
        ? `Your ${planLabel} plan is now active. Enjoy unlimited access to all exams!`
        : `Payment of $${Number(data.amount).toFixed(2)} confirmed${examLabel}. You now have full access.`,
      data: {
        transactionId: txRef.id,
        txId: txRef.id,
        amount: data.amount,
        type: data.type,
        examTitle: data.examTitle || null,
        planId: data.planId || null,
      },
    }).catch(() => {});
    return txRef.id;
  } catch (e) {
    const txId = `tx_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    await setDoc(
      doc(db, "users", userId),
      {
        transactions: {
          [txId]: { ...txData, createdAt: new Date().toISOString() },
        },
      },
      { merge: true }
    );
    return txId;
  }
}

// ─── Grant Subscription ───────────────────────────────────────────
export async function grantSubscription(userId, planId, txId, autoRenew = false) {
  const existing = await getUserSubscription(userId).catch(() => null);
  let startBase = new Date();
  if (existing?.isActive && existing?.planId === planId) {
    startBase = new Date(existing.endDate);
  }
  const now = new Date();
  const endDate = new Date(startBase);
  if (planId === "monthly") endDate.setMonth(endDate.getMonth() + 1);
  else if (planId === "yearly") endDate.setFullYear(endDate.getFullYear() + 1);
  else if (planId === "one_time") endDate.setFullYear(endDate.getFullYear() + 100);

  const subData = {
    userId,
    planId,
    status: "active",
    startDate: now.toISOString(),
    endDate: endDate.toISOString(),
    autoRenew,
    transactionId: txId,
    updatedAt: serverTimestamp(),
    grantedAt: serverTimestamp(),
  };

  await setDoc(doc(db, "subscriptions", userId), subData, { merge: true });

  try {
    await setDoc(
      doc(db, "users", userId),
      {
        premium: true,
        premiumPlanId: planId,
        premiumUntil: endDate.toISOString(),
        premiumAutoRenew: autoRenew,
        premiumTxId: txId,
      },
      { merge: true }
    );
  } catch (userWriteErr) {
    console.warn(
      "grantSubscription: /users update skipped (rules), /subscriptions is the source of truth",
      userWriteErr?.code
    );
  }

  return { startDate: now, endDate };
}

// ─── Grant Exam Access ────────────────────────────────────────────
export async function grantExamAccess(userId, examId, txId) {
  const access = await checkUserAccess(userId, examId).catch(() => null);
  if (access?.accessType === "subscription") {
    console.warn(
      "grantExamAccess: user already has subscription access, skipping exam grant"
    );
    return;
  }
  await setDoc(
    doc(db, "users", userId),
    {
      purchasedExams: {
        [examId]: {
          purchasedAt: new Date().toISOString(),
          transactionId: txId,
        },
      },
    },
    { merge: true }
  );
}

// ─── Check User Access ────────────────────────────────────────────
// FIX: اشتراك منتهي التاريخ يُعامل معاملة الاشتراك الملغي تماماً —
//      لا يُمنح الوصول حتى لو status لا يزال "active" في Firestore
export async function checkUserAccess(userId, examId) {
  if (!userId) return { hasAccess: false, accessType: "guest" };
  try {
    const subSnap = await getDoc(doc(db, "subscriptions", userId));
    const subData = subSnap.exists() ? subSnap.data() : null;

    // ── FIX: اعتبر الاشتراك المنتهي بالتاريخ مسدوداً تماماً ──
    // سواء كان status "active" أو "cancelled" أو "refunded"
    // لو endDate فات → مسدود من الوصول عبر الاشتراك
    const subExpired = subData
      ? new Date(subData.endDate) <= new Date()
      : false;

    const subBlocked = subData
      ? (["cancelled", "refunded"].includes(subData.status) || subExpired)
      : false;

    const snap = await getDoc(doc(db, "users", userId));
    const userData = snap.exists() ? snap.data() : null;

    const refundedExams = userData?.refundedExams || [];
    if (examId && refundedExams.includes(examId)) {
      return { hasAccess: false, accessType: "refunded" };
    }

    const subRefunded = userData?.subscriptionRefunded === true;

    // ── لو الاشتراك مسدود أو منتهي أو مسترد — لا وصول عبر الاشتراك ──
    if (!subBlocked && !subRefunded) {
      if (subData?.status === "active" && new Date(subData.endDate) > new Date()) {
        return { hasAccess: true, accessType: "subscription", subscription: subData };
      }

      if (!userData) return { hasAccess: false, accessType: "free" };

      const embeddedSub = userData.subscription;
      if (
        embeddedSub?.status === "active" &&
        new Date(embeddedSub.endDate) > new Date()
      ) {
        return { hasAccess: true, accessType: "subscription", subscription: embeddedSub };
      }

      if (
        userData.premium === true &&
        userData.premiumUntil &&
        new Date(userData.premiumUntil) > new Date()
      ) {
        return {
          hasAccess: true,
          accessType: "subscription",
          subscription: {
            planId: userData.premiumPlanId,
            endDate: userData.premiumUntil,
            autoRenew: userData.premiumAutoRenew,
          },
        };
      }
    }

    if (!userData) return { hasAccess: false, accessType: "free" };

    // ── الاختبارات المشتراة بشكل منفرد لا تتأثر بانتهاء الاشتراك ──
    if (examId && userData.purchasedExams) {
      const purchased = userData.purchasedExams;
      const hasPurchased = Array.isArray(purchased)
        ? purchased.includes(examId)
        : !!purchased[examId];
      if (hasPurchased) {
        return { hasAccess: true, accessType: "purchased" };
      }
    }

    return { hasAccess: false, accessType: "free" };
  } catch (e) {
    console.error("checkUserAccess error:", e);
    return { hasAccess: false, accessType: "free" };
  }
}

// ─── Get User Subscription ────────────────────────────────────────
export async function getUserSubscription(userId) {
  try {
    const subSnap = await getDoc(doc(db, "subscriptions", userId));
    if (subSnap.exists()) {
      const sub = subSnap.data();
      const isActive = sub.status === "active" && new Date(sub.endDate) > new Date();
      return { ...sub, isActive };
    }

    const snap = await getDoc(doc(db, "users", userId));
    if (!snap.exists()) return null;
    const data = snap.data();
    const sub = data.subscription;
    if (!sub) return null;
    const isActive = sub.status === "active" && new Date(sub.endDate) > new Date();
    return { ...sub, isActive };
  } catch (e) {
    return null;
  }
}

// ─── Get All Transactions (Admin) ─────────────────────────────────
export async function getAllTransactions() {
  try {
    const snap = await getDocs(query(collection(db, "transactions"), orderBy("createdAt", "desc")));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (e) {
    return [];
  }
}

// ─── Get User Transactions ────────────────────────────────────────
export async function getUserTransactions(userId) {
  try {
    const snap = await getDocs(
      query(collection(db, "transactions"), where("userId", "==", userId), orderBy("createdAt", "desc"))
    );
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (e) {
    return [];
  }
}

// ─── Refund Request ───────────────────────────────────────────────
export async function submitRefundRequest(userId, data) {
  const ref = await addDoc(collection(db, "refund_requests"), {
    userId,
    transactionId: data.transactionId,
    examId: data.examId || null,
    planId: data.planId || null,
    reason: data.reason || "",
    paypalAccount: data.paypalAccount || null,
    refundAccount: data.refundAccount || null,
    bankDetails: data.bankDetails || null,
    amount: data.amount,
    status: "pending",
    submittedAt: serverTimestamp(),
    createdAt: serverTimestamp(),
    reviewedAt: null,
    reviewNote: "",
  });

  if (data.transactionId) {
    await updateDoc(doc(db, "transactions", data.transactionId), {
      status: "refund_pending",
      refundRequestId: ref.id,
      refundRequestedAt: serverTimestamp(),
    }).catch(() => {});
  }

  await sendNotification(userId, {
    type: "refund_pending",
    title: "⏳ Refund Request Submitted",
    body: `Your refund request of $${Number(data.amount || 0).toFixed(2)} has been submitted and is under admin review. You will be notified once a decision is made.`,
    data: {
      refundId: ref.id,
      transactionId: data.transactionId,
      amount: data.amount,
      examId: data.examId || null,
      planId: data.planId || null,
    },
  }).catch(() => {});

  return ref.id;
}

export async function getAllRefundRequests() {
  try {
    const snap = await getDocs(query(collection(db, "refund_requests"), orderBy("submittedAt", "desc")));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (e) {
    return [];
  }
}

export async function updateRefundStatus(refundId, status, adminUid, note = "") {
  const refSnap = await getDoc(doc(db, "refund_requests", refundId));
  if (!refSnap.exists()) throw new Error("Refund request not found");
  const refData = refSnap.data();
  const isApproved = status === "approved";
  const isRejected = status === "rejected";

  await updateDoc(doc(db, "refund_requests", refundId), {
    status,
    reviewedAt: serverTimestamp(),
    reviewedBy: adminUid,
    reviewNote: note,
    adminNote: note,
  });

  const txStatus = isApproved ? "refunded" : isRejected ? "refund_rejected" : "refund_pending";
  if (refData.transactionId) {
    await updateDoc(doc(db, "transactions", refData.transactionId), {
      status: txStatus,
      adminNote: note || null,
      refundResolvedAt: serverTimestamp(),
      refundResolvedBy: adminUid,
    }).catch(() => {});
  }

  if (isApproved && refData.userId) {
    try {
      if (refData.planId) {
        await setDoc(
          doc(db, "subscriptions", refData.userId),
          {
            status: "refunded",
            cancelledAt: new Date().toISOString(),
            cancelledBy: adminUid,
            cancelNote: note || "Refund approved",
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );

        await setDoc(
          doc(db, "users", refData.userId),
          {
            subscriptionRefunded: true,
            premium: false,
            premiumPlanId: null,
            premiumUntil: null,
            hasActiveSubscription: false,
            subscriptionStatus: "refunded",
          },
          { merge: true }
        ).catch(() => {
          updateDoc(doc(db, "users", refData.userId), {
            subscriptionRefunded: true,
            subscriptionStatus: "refunded",
          }).catch(() => {});
        });
      } else if (refData.examId) {
        const userSnap = await getDoc(doc(db, "users", refData.userId));
        const userData = userSnap.exists() ? userSnap.data() : {};
        const purchased = userData.purchasedExams || {};

        if (Array.isArray(purchased)) {
          const { arrayRemove, arrayUnion } = await import("firebase/firestore");
          await updateDoc(doc(db, "users", refData.userId), {
            purchasedExams: arrayRemove(refData.examId),
            refundedExams: arrayUnion(refData.examId),
          });
        } else {
          const updated = { ...purchased };
          delete updated[refData.examId];
          const refundedExams = [...(userData.refundedExams || [])];
          if (!refundedExams.includes(refData.examId)) refundedExams.push(refData.examId);
          await setDoc(
            doc(db, "users", refData.userId),
            {
              purchasedExams: updated,
              refundedExams,
            },
            { merge: true }
          );
        }
      }
    } catch (accessErr) {
      console.error("updateRefundStatus: access revoke error", accessErr);
      try {
        if (refData.planId) {
          await updateDoc(doc(db, "users", refData.userId), { subscriptionRefunded: true }).catch(() => {});
        } else if (refData.examId) {
          const { arrayUnion } = await import("firebase/firestore");
          await updateDoc(doc(db, "users", refData.userId), {
            refundedExams: arrayUnion(refData.examId),
          }).catch(() => {});
        }
      } catch {}
    }
  }

  const notifType = isApproved ? "refund_approved" : isRejected ? "refund_rejected" : "refund_update";
  const notifTitle = isApproved
    ? "✅ Refund Approved"
    : isRejected
      ? "❌ Refund Request Rejected"
      : "📋 Refund Update";
  const notifBody = isApproved
    ? note
      ? `Your refund has been approved. ${note} Amount will be credited in 3–5 business days.`
      : "Your refund has been approved and access has been revoked. Amount will be credited in 3–5 business days."
    : isRejected
      ? note
        ? `Your refund request was rejected. ${note}`
        : "Your refund request was reviewed and rejected."
      : note || "Your refund request has been updated.";

  await sendNotification(refData.userId, {
    type: notifType,
    title: notifTitle,
    body: notifBody,
    data: {
      refundId,
      transactionId: refData.transactionId || null,
      examId: null,
      planId: null,
      adminNote: note || null,
      refundStatus: status,
      amount: refData.amount || null,
    },
  }).catch(() => {});
}

// ─── Grant Leaderboard Reward (Admin) ─────────────────────────────
export async function grantLeaderboardReward(userId, adminUid, planId = "yearly", note = "") {
  const txId = await saveTransaction(userId, {
    type: "subscription",
    planId,
    amount: 0,
    currency: "USD",
    paymentMethod: "reward",
    referenceId: `leaderboard_reward_${Date.now()}`,
    status: "completed",
    autoRenew: false,
  }).catch(() => `reward_${Date.now()}`);

  await grantSubscription(userId, planId, txId, false);

  await sendNotification(userId, {
    type: "leaderboard_reward",
    title: "🏆 Leaderboard Reward!",
    body: note || `Congratulations! You've been awarded a free ${planId} subscription as a leaderboard reward.`,
    data: { adminUid, planId, txId },
  });

  return txId;
}

// ─── Send Admin Message to User ────────────────────────────────────
export async function sendAdminMessage(userId, adminUid, title, body, data = {}) {
  await sendNotification(userId, {
    type: "admin_message",
    title: title || "📣 Message from Admin",
    body: body || "",
    data: { adminUid, ...data },
  });
}

// ─── Access Limits ────────────────────────────────────────────────
export function getAccessLimit(accessType) {
  switch (accessType) {
    case "subscription":
    case "purchased":
      return 1.0;
    case "free":
      return 0.15;
    case "guest":
    default:
      return 0.1;
  }
}

// ─── Check Refund Eligibility ─────────────────────────────────────
export function checkRefundEligibility(transaction, usagePercent = 0) {
  if (!transaction) return { eligible: false, reason: "Transaction not found" };

  const purchaseDate = transaction.createdAt?.toDate
    ? transaction.createdAt.toDate()
    : new Date(transaction.createdAt);
  const daysSince = (Date.now() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24);

  if (daysSince > 7) return { eligible: false, reason: "Refund window has expired (7 days)" };
  if (usagePercent > 15)
    return {
      eligible: false,
      reason: `You've used ${usagePercent.toFixed(0)}% of the exam (limit: 15%)`,
    };

  return { eligible: true };
}

export async function revokeExamAccess(userId, examId) {
  const userSnap = await getDoc(doc(db, "users", userId));
  if (!userSnap.exists()) return;
  const userData = userSnap.data();
  const purchased = userData.purchasedExams || {};
  const refundedExams = [...(userData.refundedExams || [])];
  if (!refundedExams.includes(examId)) refundedExams.push(examId);

  if (Array.isArray(purchased)) {
    const { arrayRemove, arrayUnion } = await import("firebase/firestore");
    await updateDoc(doc(db, "users", userId), {
      purchasedExams: arrayRemove(examId),
      refundedExams: arrayUnion(examId),
    });
  } else {
    const updated = { ...purchased };
    delete updated[examId];
    await setDoc(doc(db, "users", userId), { purchasedExams: updated, refundedExams }, { merge: true });
  }
}
