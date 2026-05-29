// functions/src/index.ts — FlexExams Cloud Functions v2.1
import * as functions from "firebase-functions/v2";
import {onCall, onRequest} from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import axios from "axios";

admin.initializeApp();
const db = admin.firestore();

const FAWATERAK_API_KEY = "001abdcd21d4e6824906ee8fd838447f2c0b76513e83bafcc3";
const FAWATERAK_PROVIDER_KEY = "FAWATERAK.28623";
const FAWATERAK_BASE_URL = "https://fawaterk.com/api/v2";

function computeEndDate(planId: string): Date {
  const end = new Date();
  if (planId === "monthly") end.setMonth(end.getMonth() + 1);
  else if (planId === "yearly") end.setFullYear(end.getFullYear() + 1);
  else end.setFullYear(end.getFullYear() + 100);
  return end;
}

async function grantAccessForSession(
  userId: string,
  planId: string | null,
  examId: string | null,
  amountUSD: number,
  txRef: FirebaseFirestore.DocumentReference,
  paymentMethod: string,
  fawaterakInvoiceId?: string | null,
) {
  if (planId) {
    const endDate = computeEndDate(planId);
    const now = new Date();
    await db.collection("subscriptions").doc(userId).set({
      userId,
      planId,
      status: "active",
      startDate: now.toISOString(),
      endDate: endDate.toISOString(),
      autoRenew: false,
      transactionId: txRef.id,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, {merge: true});

    await db.collection("users").doc(userId).set({
      premium: true,
      premiumPlanId: planId,
      premiumUntil: endDate.toISOString(),
      premiumAutoRenew: false,
      premiumTxId: txRef.id,
    }, {merge: true}).catch((e: Error) => {
      console.warn("grantAccess: /users update skipped —", e.message);
    });
  } else if (examId) {
    await db.collection("users").doc(userId).set({
      purchasedExams: {
        [examId]: {
          purchasedAt: new Date().toISOString(),
          transactionId: txRef.id,
        },
      },
    }, {merge: true});
  }

  await db.collection("notifications").add({
    userId,
    type: "payment_success",
    title: planId ?
      `${planId.charAt(0).toUpperCase() + planId.slice(1)} Subscription Activated` :
      "Exam Access Granted",
    body: planId ?
      `Your ${planId} plan is now active. Enjoy unlimited access to all exams!` :
      `Payment of $${amountUSD.toFixed(2)} confirmed. You now have full access.`,
    data: {transactionId: txRef.id, paymentMethod, planId, examId},
    isRead: false,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  }).catch(() => {});
}

export const createFawaterakInvoice = onCall(
  {region: "us-central1"},
  async (request) => {
    if (!request.auth) {
      throw new functions.https.HttpsError("unauthenticated", "You must be signed in to make a payment.");
    }

    const userId = request.auth.uid;
    const data = request.data as {
      amount: number;
      amountUSD: number;
      description: string;
      customer: {
        first_name: string;
        last_name: string;
        email: string;
        phone: string;
        address: string;
      };
      planId?: string;
      examId?: string;
    };

    const {amount, amountUSD, description, customer, planId, examId} = data;

    if (!amount || Number(amount) <= 0) {
      throw new functions.https.HttpsError("invalid-argument", "Invalid payment amount.");
    }

    const sessionId = `fwk_${Date.now()}_${userId.slice(0, 8)}`;

    await db.collection("fawaterak_sessions").doc(sessionId).set({
      userId,
      planId: planId || null,
      examId: examId || null,
      amountUSD: Number(amountUSD) || 0,
      amountEGP: Number(amount),
      status: "pending",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // ✅ استخدام متغير البيئة فقط (تجنب functions.config)
    const appUrl = process.env.APP_URL || "https://flexexams.com";

    const successUrl = `${appUrl}/payment-return?session=${sessionId}&status=success`;
    const failUrl = `${appUrl}/payment-return?session=${sessionId}&status=fail`;
    const pendingUrl = `${appUrl}/payment-return?session=${sessionId}&status=pending`;

    const payload = {
      cartTotal: String(parseFloat(String(amount)).toFixed(2)),
      currency: "EGP",
      customer: {
        first_name: customer?.first_name || "Customer",
        last_name: customer?.last_name || ".",
        email: customer?.email || "noreply@flexexams.com",
        phone: customer?.phone || "01000000000",
        address: customer?.address || "Egypt",
      },
      cartItems: [{
        name: description || "FlexExams Payment",
        price: String(parseFloat(String(amount)).toFixed(2)),
        quantity: "1",
      }],
      redirectionUrls: {successUrl, failUrl, pendingUrl},
      providerKey: FAWATERAK_PROVIDER_KEY,
    };

    try {
      const response = await axios.post(`${FAWATERAK_BASE_URL}/invoiceInitPay`, payload, {
        headers: {
          Authorization: `Bearer ${FAWATERAK_API_KEY}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        timeout: 15000,
      });

      const result = response.data;
      console.log("Fawaterak response:", JSON.stringify(result));

      if (result.status === "success" && result.data?.url) {
        const invoiceId = result.data.invoiceId || result.data.id || null;
        if (invoiceId) {
          await db.collection("fawaterak_sessions").doc(sessionId).update({fawaterakInvoiceId: invoiceId});
        }
        return {success: true, paymentUrl: result.data.url, sessionId, invoiceId: invoiceId || null};
      }

      const errMsg = result.message || result.msg || "Fawaterak did not return a payment URL.";
      console.error("Fawaterak API error response:", errMsg, JSON.stringify(result));
      await db.collection("fawaterak_sessions").doc(sessionId).update({status: "api_error", apiError: errMsg});
      throw new functions.https.HttpsError("internal", `Payment gateway error: ${errMsg}`);
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const body = JSON.stringify(error.response?.data || {});
        console.error(`Fawaterak HTTP ${status}:`, body);
        await db.collection("fawaterak_sessions").doc(sessionId).update({
          status: "api_error",
          apiError: `HTTP ${status}: ${body}`,
        }).catch(() => {});
        throw new functions.https.HttpsError("internal", `Payment gateway returned HTTP ${status}. Please try again or contact support.`);
      }
      if (error instanceof functions.https.HttpsError) throw error;
      console.error("Unexpected Fawaterak error:", error);
      throw new functions.https.HttpsError("internal", "An unexpected error occurred while connecting to the payment gateway.");
    }
  }
);

export const paymentReturn = onRequest(
  {region: "us-central1"},
  async (req, res) => {
    const {session, status} = req.query as Record<string, string>;
    const appUrl = process.env.APP_URL || "https://flexexams.com";

    if (!session) {
      res.redirect(`${appUrl}/?payment=error&message=missing_session`);
      return;
    }

    const sessionRef = db.collection("fawaterak_sessions").doc(session);
    const sessionDoc = await sessionRef.get();

    if (!sessionDoc.exists) {
      res.redirect(`${appUrl}/?payment=error&message=invalid_session`);
      return;
    }

    const sessionData = sessionDoc.data()!;
    const {userId, planId, examId, amountUSD, fawaterakInvoiceId} = sessionData;

    if (sessionData.status === "completed") {
      res.redirect(`${appUrl}/?payment=success&type=${planId ? "subscription" : "exam"}&already=1`);
      return;
    }

    if (status === "success") {
      try {
        const refId = fawaterakInvoiceId || session;
        const dupCheck = await db.collection("transactions")
          .where("userId", "==", userId)
          .where("referenceId", "==", refId)
          .limit(1)
          .get();

        let txRef: FirebaseFirestore.DocumentReference;
        if (!dupCheck.empty) {
          txRef = dupCheck.docs[0].ref;
          console.warn("Duplicate Fawaterak transaction detected, reusing:", txRef.id);
        } else {
          txRef = await db.collection("transactions").add({
            userId,
            type: planId ? "subscription" : "exam",
            planId: planId || null,
            examId: examId || null,
            amount: amountUSD || 0,
            currency: "USD",
            paymentMethod: "fawaterak",
            fawaterakInvoiceId: fawaterakInvoiceId || null,
            referenceId: refId,
            status: "completed",
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        }

        await grantAccessForSession(
          userId, planId || null, examId || null,
          Number(amountUSD) || 0, txRef, "fawaterak", fawaterakInvoiceId
        );

        await sessionRef.update({status: "completed", completedAt: admin.firestore.FieldValue.serverTimestamp()});
        res.redirect(`${appUrl}/?payment=success&type=${planId ? "subscription" : "exam"}`);
      } catch (err: any) {
        console.error("Error granting access after Fawaterak payment:", err);
        await sessionRef.update({status: "grant_failed", grantError: err?.message || "unknown"}).catch(() => {});
        res.redirect(`${appUrl}/?payment=error&message=access_grant_failed`);
      }
    } else {
      await sessionRef.update({status: status || "unknown"});
      res.redirect(`${appUrl}/?payment=${status || "fail"}`);
    }
  }
);

export const healthCheck = onRequest({region: "us-central1"}, (req, res) => {
  res.json({status: "ok", version: "2.1.0", timestamp: new Date().toISOString()});
});