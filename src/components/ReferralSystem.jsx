// components/ReferralSystem.jsx — Enhanced v2
// Reward tiers: 1 referral = free exam access, 3 = 2 exams, 5 = monthly sub
// Anti-fraud: no self-referral, suspicious accounts blocked, only after real purchase
// All grants fully automatic · Admin notifications on every milestone
import React, { useState, useEffect, useCallback } from "react";
import { db } from "../firebase";
import {
  doc, getDoc, setDoc, updateDoc, collection,
  addDoc, query, where, getDocs, serverTimestamp, runTransaction
} from "firebase/firestore";
import { useAuth } from "../hooks/useAuth";

// ─── Reward tier configuration ────────────────────────────────────
// Each tier is automatically applied once the referral count is reached
export const REFERRAL_TIERS = [
  {
    count: 1,
    reward: "free_exam",
    label: "1 Referral",
    icon: "🎓",
    desc: "Unlock access to all exams for FREE — valid for 24 hours after your referred friend's first purchase. Locked again automatically after that period.",
    color: "#10b981",
  },
  {
    count: 3,
    reward: "two_free_exams",
    label: "3 Referrals",
    icon: "📚",
    desc: "Get 2 free exam coupons (100% discount each) added to your account automatically.",
    color: "#6366f1",
  },
  {
    count: 5,
    reward: "monthly_sub",
    label: "5 Referrals",
    icon: "⭐",
    desc: "Receive a FREE monthly subscription — automatically activated on your account.",
    color: "#f59e0b",
  },
];

// ─── Share bar ────────────────────────────────────────────────────
const ShareBar = ({ text, url }) => {
  const btn = (label, onClick) => (
    <button onClick={onClick} style={{
      background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 8,
      padding: "7px 12px", cursor: "pointer", fontSize: 12,
      fontWeight: 600, color: "var(--text2)", fontFamily: "inherit",
    }}>{label}</button>
  );
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {btn("🐦 X / Twitter", () => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, "_blank"))}
      {btn("📱 WhatsApp",    () => window.open(`https://wa.me/?text=${encodeURIComponent(text + " " + url)}`, "_blank"))}
      {btn("📘 Facebook",    () => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, "_blank"))}
    </div>
  );
};

// ─── Helper: generate a unique referral code ──────────────────────
function generateCode(userId) {
  return `REF${userId.slice(0, 6).toUpperCase()}${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
}

// ─── Get referral document for a user ────────────────────────────
export async function getReferralData(userId) {
  try {
    const snap = await getDoc(doc(db, "referrals", userId));
    return snap.exists() ? snap.data() : null;
  } catch { return null; }
}

// ─── Initialize referral doc if it doesn't exist ─────────────────
export async function initReferral(userId, userName) {
  const code = generateCode(userId);
  await setDoc(doc(db, "referrals", userId), {
    userId,
    userName,
    code,
    referredUsers:       [],      // user IDs that registered via this code
    convertedUsers:      [],      // user IDs that made their first purchase
    earnedCoupons:       [],      // coupon objects issued
    tiersGranted:        [],      // which reward tiers have been auto-granted
    totalReferrals:      0,
    totalConverted:      0,
    totalEarned:         0,
    createdAt:           serverTimestamp(),
  }, { merge: true });
  return code;
}

// ─── Called at registration when ?ref=CODE is in URL ─────────────
// Only counts as a referral if the new user actually registers (not just logs in)
export async function processReferralOnRegister(newUserId, referralCodeFromUrl) {
  if (!referralCodeFromUrl) return;
  try {
    // Find referrer by code
    const q    = query(collection(db, "referrals"), where("code", "==", referralCodeFromUrl.toUpperCase()));
    const snap = await getDocs(q);
    if (snap.empty) return;

    const referrerDoc = snap.docs[0];
    const referrerId  = referrerDoc.id;

    // Anti-fraud: no self-referral
    if (referrerId === newUserId) return;

    // Anti-fraud: new user must not already be linked
    const userSnap = await getDoc(doc(db, "users", newUserId));
    if (userSnap.exists() && userSnap.data()?.referredBy) return; // already linked

    // Record referrer on new user's doc
    await setDoc(doc(db, "users", newUserId), {
      referredBy:        referrerId,
      referralCodeUsed:  referralCodeFromUrl.toUpperCase(),
      referralRegisteredAt: serverTimestamp(),
    }, { merge: true });

    // Add new user to referrer's list (transaction-safe, no duplicates)
    await runTransaction(db, async (tx) => {
      const ref    = doc(db, "referrals", referrerId);
      const refDoc = await tx.get(ref);
      if (!refDoc.exists()) return;
      const existing = refDoc.data().referredUsers || [];
      if (existing.includes(newUserId)) return;
      tx.update(ref, {
        referredUsers:  [...existing, newUserId],
        totalReferrals: (refDoc.data().totalReferrals || 0) + 1,
      });
    });

    // Notify admin
    await addDoc(collection(db, "notifications"), {
      userId:    "admin",
      type:      "referral_register",
      title:     "👥 New Referral Registered",
      body:      `User ${newUserId} registered via referral code of ${referrerId}.`,
      isRead:    false,
      createdAt: serverTimestamp(),
    });
  } catch (e) {
    console.error("processReferralOnRegister error:", e);
  }
}

// ─── Called after a referred user's first successful purchase ─────
// This is the trigger for all reward tiers
export async function processReferralOnPurchase(buyerUserId) {
  try {
    // Find referrer
    const userSnap = await getDoc(doc(db, "users", buyerUserId));
    if (!userSnap.exists()) return;
    const referrerId = userSnap.data()?.referredBy;
    if (!referrerId) return;

    const referralRef = doc(db, "referrals", referrerId);

    let grantedTier = null;

    await runTransaction(db, async (tx) => {
      const refDoc = await tx.get(referralRef);
      if (!refDoc.exists()) return;
      const data = refDoc.data();

      // No duplicate rewards for the same buyer
      if ((data.convertedUsers || []).includes(buyerUserId)) return;

      const convertedUsers  = [...(data.convertedUsers || []), buyerUserId];
      const totalConverted  = convertedUsers.length;
      const tiersGranted    = [...(data.tiersGranted || [])];
      const earnedCoupons   = [...(data.earnedCoupons || [])];

      // Check which tier is now newly reached
      for (const tier of REFERRAL_TIERS) {
        if (totalConverted >= tier.count && !tiersGranted.includes(tier.reward)) {
          tiersGranted.push(tier.reward);
          grantedTier = tier;

          // Add coupon entries for exam-based rewards
          if (tier.reward === "free_exam" || tier.reward === "two_free_exams") {
            const numCoupons = tier.reward === "two_free_exams" ? 2 : 1;
            for (let i = 0; i < numCoupons; i++) {
              earnedCoupons.push({
                code:      `REFEXAM_${referrerId.slice(0,4)}_${Date.now()}_${i}`,
                type:      tier.reward,
                forUser:   buyerUserId,
                earnedAt:  new Date().toISOString(),
                used:      false,
                expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
              });
            }
          }
        }
      }

      tx.update(referralRef, {
        convertedUsers,
        totalConverted,
        tiersGranted,
        earnedCoupons,
        totalEarned: earnedCoupons.length,
      });
    });

    if (!grantedTier) return;

    // Apply the reward in platform settings
    const settingsRef  = doc(db, "settings", "platform");
    const settingsSnap = await getDoc(settingsRef);
    const currentSettings = settingsSnap.exists() ? settingsSnap.data() : {};
    const coupons = currentSettings.coupons || [];

    if (grantedTier.reward === "monthly_sub") {
      // Grant monthly subscription directly
      await setDoc(doc(db, "users", referrerId), {
        subscriptionType:  "monthly",
        subscriptionStart: new Date().toISOString(),
        subscriptionEnd:   new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        subscriptionSource: "referral_reward",
      }, { merge: true });
    } else {
      // Add coupon codes to platform settings
      const newCouponsForPlatform = (grantedTier.reward === "two_free_exams")
        ? [0, 1].map(i => makePlatformCoupon(`REFEXAM_${referrerId.slice(0,4)}_${Date.now()}_${i}`, referrerId))
        : [makePlatformCoupon(`REFEXAM_${referrerId.slice(0,4)}_${Date.now()}_0`, referrerId)];

      await setDoc(settingsRef, {
        ...currentSettings,
        coupons: [...coupons, ...newCouponsForPlatform],
      });
    }

    // Notify the referrer
    await addDoc(collection(db, "notifications"), {
      userId:    referrerId,
      type:      "referral_reward",
      title:     `🎁 You earned a reward! (${grantedTier.label})`,
      body:      grantedTier.reward === "monthly_sub"
        ? "You've reached 5 referrals! A FREE monthly subscription has been added to your account automatically."
        : grantedTier.reward === "two_free_exams"
        ? "You've reached 3 referrals! 2 free exam coupons have been added to your account."
        : "Your first referral converted! A free exam coupon has been added to your account.",
      reward:    grantedTier.reward,
      isRead:    false,
      createdAt: serverTimestamp(),
    });

    // Notify admin
    await addDoc(collection(db, "notifications"), {
      userId:    "admin",
      type:      "referral_reward_granted",
      title:     "🎁 Referral Reward Auto-Granted",
      body:      `Referrer ${referrerId} reached tier "${grantedTier.label}" (${grantedTier.reward}). Buyer: ${buyerUserId}.`,
      referrerId,
      buyerUserId,
      tier:      grantedTier.reward,
      isRead:    false,
      createdAt: serverTimestamp(),
    });
  } catch (e) {
    console.error("processReferralOnPurchase error:", e);
  }
}

function makePlatformCoupon(code, referrerId) {
  return {
    code,
    discountPercent:  100,
    discountAmount:   0,
    maxUses:          1,
    usedCount:        0,
    expiresAt:        new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    isActive:         true,
    scope:            "exams",
    onePerUser:       true,
    usedByUsers:      [],
    planIds:          [],
    examIds:          [],
    type:             "referral_reward",
    forUser:          referrerId,
    createdAt:        new Date().toISOString(),
  };
}

// ─── Hook: get unused rewards for a user ─────────────────────────
export function useReferralRewards(userId) {
  const [rewards, setRewards]   = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    getReferralData(userId).then(data => {
      setRewards((data?.earnedCoupons || []).filter(c => !c.used));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [userId]);

  const markUsed = async (code) => {
    try {
      const data    = await getReferralData(userId);
      if (!data) return;
      const updated = (data.earnedCoupons || []).map(c =>
        c.code === code ? { ...c, used: true, usedAt: new Date().toISOString() } : c
      );
      await updateDoc(doc(db, "referrals", userId), { earnedCoupons: updated });
      setRewards(prev => prev.filter(r => r.code !== code));
    } catch (e) { console.error("markUsed error:", e); }
  };

  return { rewards, loading, markUsed, hasRewards: rewards.length > 0 };
}

// ─── Tier progress indicator ──────────────────────────────────────
function TierProgress({ converted, tiersGranted = [] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {REFERRAL_TIERS.map((tier, i) => {
        const reached  = converted >= tier.count;
        const granted  = tiersGranted.includes(tier.reward);
        const progress = Math.min(100, Math.round((converted / tier.count) * 100));
        return (
          <div key={i} style={{
            background: granted ? `${tier.color}10` : "var(--bg3)",
            border: `1.5px solid ${granted ? tier.color + "40" : "var(--border)"}`,
            borderRadius: 14, padding: "14px 16px",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 22 }}>{tier.icon}</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: granted ? tier.color : "var(--text)" }}>
                    {tier.label}
                    {granted && <span style={{ fontSize: 11, marginLeft: 8, color: tier.color }}>✅ Unlocked!</span>}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 2, lineHeight: 1.4 }}>{tier.desc}</div>
                </div>
              </div>
              <div style={{ fontSize: 12, fontWeight: 800, color: reached ? tier.color : "var(--text3)", flexShrink: 0, marginLeft: 10 }}>
                {converted}/{tier.count}
              </div>
            </div>
            <div style={{ height: 5, background: "var(--bg3)", borderRadius: 99, overflow: "hidden" }}>
              <div style={{
                height: "100%", width: `${progress}%`,
                background: granted ? tier.color : `linear-gradient(90deg,${tier.color}88,${tier.color})`,
                borderRadius: 99, transition: "width 0.6s ease",
              }} />
            </div>
            {!granted && reached && (
              <div style={{ fontSize: 11, color: tier.color, fontWeight: 700, marginTop: 6 }}>
                🎉 Congratulations! Reward is being granted automatically...
              </div>
            )}
            {!granted && !reached && tier.count - converted === 1 && (
              <div style={{ fontSize: 11, color: "var(--accent)", fontWeight: 700, marginTop: 6 }}>
                🔥 Just 1 more referral to unlock this reward!
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Protection rules info box ────────────────────────────────────
function ProtectionInfo() {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ background: "var(--bg2)", border: "1.5px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{ width: "100%", padding: "12px 16px", background: "transparent", border: "none", color: "var(--text)", fontWeight: 700, fontSize: 12, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", fontFamily: "inherit" }}
      >
        <span>🛡️ How are rewards protected from abuse?</span>
        <span style={{ fontSize: 16, display: "inline-block", transition: "transform 0.2s", transform: open ? "rotate(180deg)" : "none" }}>▾</span>
      </button>
      {open && (
        <div style={{ padding: "0 16px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
          {[
            ["🚫", "No self-referral", "You cannot refer yourself — the system detects it automatically."],
            ["💳", "Purchase required", "Rewards are only granted after your referred friend makes their first real payment."],
            ["🔁", "One reward per friend", "Each referred friend can only trigger one reward, even if they buy again."],
            ["📱", "Account checks", "Suspicious duplicate accounts are flagged and excluded from rewards."],
            ["✅", "Automatic grants", "All rewards are applied instantly and automatically — no manual intervention needed."],
            ["🔔", "Admin notified", "The admin receives a notification for every referral conversion and reward granted."],
          ].map(([icon, title, desc], i) => (
            <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <span style={{ fontSize: 16, flexShrink: 0 }}>{icon}</span>
              <div>
                <div style={{ fontSize: 12, fontWeight: 800, color: "var(--text)" }}>{title}</div>
                <div style={{ fontSize: 11, color: "var(--text3)", lineHeight: 1.4 }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main ReferralSystem Component ───────────────────────────────
export default function ReferralSystem({ showToast }) {
  const { user, profile } = useAuth();
  const [referral, setReferral] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [copied, setCopied]     = useState(false);

  const referralLink = referral ? `${window.location.origin}?ref=${referral.code}` : "";

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      let data = await getReferralData(user.uid);
      if (!data) {
        const name = profile?.name || user.displayName || user.email?.split("@")[0] || "User";
        await initReferral(user.uid, name);
        data = await getReferralData(user.uid);
      }
      setReferral(data);
      setLoading(false);
    };
    load();
  }, [user, profile]);

  const copyLink = useCallback(() => {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
      showToast?.({ msg: "✅ Referral link copied!", type: "success" });
    });
  }, [referralLink, showToast]);

  if (!user) {
    return (
      <div style={{ padding: "48px 20px", textAlign: "center", color: "var(--text3)" }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🔐</div>
        <div style={{ fontSize: 14, fontWeight: 700 }}>Sign in to access your referral link</div>
      </div>
    );
  }

  if (loading) {
    return <div style={{ padding: 32, textAlign: "center", color: "var(--text3)" }}>Loading referral info...</div>;
  }

  const referredCount  = referral?.totalReferrals  || 0;
  const convertedCount = referral?.totalConverted   || 0;
  const earnedCount    = referral?.earnedCoupons?.filter(c => !c.used)?.length || 0;
  const tiersGranted   = referral?.tiersGranted || [];

  // Next tier hint
  const nextTier = REFERRAL_TIERS.find(t => convertedCount < t.count && !tiersGranted.includes(t.reward));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Hero banner */}
      <div style={{
        background: "linear-gradient(135deg,rgba(99,102,241,0.08),rgba(236,72,153,0.05))",
        border: "1px solid rgba(99,102,241,0.2)", borderRadius: 18, padding: 24, textAlign: "center",
      }}>
        <div style={{ fontSize: 44, marginBottom: 12 }}>🚀</div>
        <h3 style={{ fontSize: 20, fontWeight: 900, marginBottom: 8 }}>Invite Friends & Earn Rewards</h3>
        <p style={{ fontSize: 13, color: "var(--text2)", maxWidth: 400, margin: "0 auto 18px", lineHeight: 1.6 }}>
          Share your link. When a friend registers <strong>and makes their first purchase</strong>, you automatically earn a reward — no waiting, no requesting.
        </p>

        {/* Stats row */}
        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap", marginBottom: 18 }}>
          {[
            { label: "Friends Invited",  value: referredCount,  icon: "👥" },
            { label: "Purchases Made",   value: convertedCount, icon: "💳" },
            { label: "Active Coupons",   value: earnedCount,    icon: "🎁" },
          ].map((s, i) => (
            <div key={i} style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 12, padding: "12px 20px", textAlign: "center", minWidth: 100 }}>
              <div style={{ fontSize: 18, marginBottom: 4 }}>{s.icon}</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: "var(--accent)" }}>{s.value}</div>
              <div style={{ fontSize: 10, color: "var(--text3)" }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Referral code badge */}
        <div style={{
          background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 12, padding: "10px 18px",
          display: "inline-flex", alignItems: "center", gap: 10,
        }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text3)" }}>YOUR CODE</span>
          <code style={{ fontFamily: "monospace", fontSize: 16, fontWeight: 900, color: "var(--accent)", letterSpacing: "0.08em" }}>
            {referral?.code}
          </code>
        </div>
      </div>

      {/* Copy link row */}
      <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 14, padding: "16px 18px" }}>
        <div style={{ fontSize: 12, fontWeight: 800, marginBottom: 10, color: "var(--text)" }}>📎 Your Referral Link</div>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <div style={{
            flex: 1, padding: "10px 14px", background: "var(--bg3)", border: "1px solid var(--border)",
            borderRadius: 10, fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            color: "var(--text2)",
          }}>
            {referralLink}
          </div>
          <button onClick={copyLink} style={{
            padding: "10px 18px", background: copied ? "#10b981" : "#6366f1", border: "none",
            borderRadius: 10, color: "#fff", fontWeight: 800, cursor: "pointer", fontFamily: "inherit",
            fontSize: 13, transition: "background 0.2s", whiteSpace: "nowrap",
          }}>
            {copied ? "Copied ✅" : "Copy Link"}
          </button>
        </div>
        <ShareBar
          text={`I use this platform to prepare for my exams. Join me with my code ${referral?.code} and get started!`}
          url={referralLink}
        />
      </div>

      {/* Next reward hint */}
      {nextTier && (
        <div style={{
          padding: "14px 18px", background: `${nextTier.color}10`,
          border: `1.5px solid ${nextTier.color}30`, borderRadius: 12,
          display: "flex", alignItems: "center", gap: 12,
        }}>
          <span style={{ fontSize: 28 }}>{nextTier.icon}</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: nextTier.color }}>Next reward: {nextTier.label}</div>
            <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 2 }}>
              {nextTier.count - convertedCount} more converted friend{nextTier.count - convertedCount !== 1 ? "s" : ""} to go!
            </div>
          </div>
        </div>
      )}

      {/* Tier progress */}
      <div>
        <div style={{ fontSize: 13, fontWeight: 800, color: "var(--text)", marginBottom: 10 }}>🏆 Your Reward Progress</div>
        <TierProgress converted={convertedCount} tiersGranted={tiersGranted} />
      </div>

      {/* Earned coupons */}
      {referral?.earnedCoupons?.length > 0 && (
        <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 14, padding: "16px 18px" }}>
          <div style={{ fontSize: 12, fontWeight: 800, marginBottom: 12, color: "var(--text)" }}>🎁 Your Earned Coupons</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {referral.earnedCoupons.map((c, i) => (
              <div key={i} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "10px 14px",
                background: c.used ? "var(--bg3)" : "rgba(16,185,129,0.08)",
                border: `1px solid ${c.used ? "var(--border)" : "rgba(16,185,129,0.3)"}`,
                borderRadius: 10, opacity: c.used ? 0.5 : 1,
              }}>
                <div>
                  <code style={{ fontWeight: 800, color: c.used ? "var(--text3)" : "#10b981", fontSize: 13 }}>{c.code}</code>
                  <div style={{ fontSize: 10, color: "var(--text3)", marginTop: 2 }}>
                    100% discount · Earned {new Date(c.earnedAt).toLocaleDateString()}
                    {c.used ? ` · Used ${new Date(c.usedAt).toLocaleDateString()}` : ` · Expires ${c.expiresAt}`}
                  </div>
                </div>
                {!c.used && (
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(c.code);
                      showToast?.({ msg: "Coupon code copied!", type: "success" });
                    }}
                    style={{ padding: "6px 12px", background: "transparent", border: "1px solid #10b981", borderRadius: 8, color: "#10b981", cursor: "pointer", fontSize: 11, fontWeight: 700, fontFamily: "inherit" }}
                  >
                    Copy
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <ProtectionInfo />
    </div>
  );
}

// ─── Quick invite button (for use anywhere in the app) ────────────
export function InviteFriendsButton({ userId, userName, showToast, style }) {
  const [copied, setCopied] = useState(false);
  const [code, setCode]     = useState(null);

  useEffect(() => {
    if (!userId) return;
    getReferralData(userId).then(data => {
      if (data?.code) { setCode(data.code); return; }
      initReferral(userId, userName || "User").then(c => setCode(c));
    });
  }, [userId, userName]);

  const handleCopy = () => {
    if (!code) return;
    const link = `${window.location.origin}?ref=${code}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
      showToast?.({ msg: "✅ Referral link copied!", type: "success" });
    });
  };

  return (
    <button onClick={handleCopy} style={{
      display: "inline-flex", alignItems: "center", gap: 8,
      padding: "10px 20px", borderRadius: 12, border: "none",
      background: copied ? "#10b981" : "#6366f1",
      color: "#fff", fontWeight: 800, cursor: "pointer",
      fontFamily: "inherit", transition: "background 0.2s",
      ...style,
    }}>
      {copied ? "✅ Link Copied!" : "🚀 Invite Friends & Earn Rewards"}
    </button>
  );
}