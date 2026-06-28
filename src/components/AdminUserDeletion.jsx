// components/AdminUserDeletion.jsx
// Secure User Deletion — Uses Firebase Cloud Function (deleteUserCompletely)
// ✅ extraUserActions prop support
// ✅ Last Active fix — reads lastLogin (Timestamp) or lastLoginDate (ISO string)
import React, { useState, useMemo } from "react";
import { db } from "../firebase";
import {
  doc, deleteDoc, collection, getDocs, writeBatch,
  query, where,
} from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";

const Icon = ({ name, size = 16, color = "currentColor" }) => {
  const icons = {
    trash:  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>,
    check:  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
    user:   <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>,
    warn:   <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
    search: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>,
    x:      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  };
  return icons[name] || null;
};

// ─── Country Code → Full Name Map ─────────────────────────────────
const COUNTRY_NAMES = {
  AF: "Afghanistan", AL: "Albania", DZ: "Algeria", AD: "Andorra", AO: "Angola",
  AG: "Antigua and Barbuda", AR: "Argentina", AM: "Armenia", AU: "Australia",
  AT: "Austria", AZ: "Azerbaijan", BS: "Bahamas", BH: "Bahrain", BD: "Bangladesh",
  BB: "Barbados", BY: "Belarus", BE: "Belgium", BZ: "Belize", BJ: "Benin",
  BT: "Bhutan", BO: "Bolivia", BA: "Bosnia and Herzegovina", BW: "Botswana",
  BR: "Brazil", BN: "Brunei", BG: "Bulgaria", BF: "Burkina Faso", BI: "Burundi",
  CV: "Cape Verde", KH: "Cambodia", CM: "Cameroon", CA: "Canada",
  CF: "Central African Republic", TD: "Chad", CL: "Chile", CN: "China",
  CO: "Colombia", KM: "Comoros", CG: "Congo", CD: "Congo (DRC)", CR: "Costa Rica",
  CI: "Côte d'Ivoire", HR: "Croatia", CU: "Cuba", CY: "Cyprus", CZ: "Czech Republic",
  DK: "Denmark", DJ: "Djibouti", DM: "Dominica", DO: "Dominican Republic",
  EC: "Ecuador", EG: "Egypt", SV: "El Salvador", GQ: "Equatorial Guinea",
  ER: "Eritrea", EE: "Estonia", SZ: "Eswatini", ET: "Ethiopia", FJ: "Fiji",
  FI: "Finland", FR: "France", GA: "Gabon", GM: "Gambia", GE: "Georgia",
  DE: "Germany", GH: "Ghana", GR: "Greece", GD: "Grenada", GT: "Guatemala",
  GN: "Guinea", GW: "Guinea-Bissau", GY: "Guyana", HT: "Haiti", HN: "Honduras",
  HU: "Hungary", IS: "Iceland", IN: "India", ID: "Indonesia", IR: "Iran",
  IQ: "Iraq", IE: "Ireland", IL: "Israel", IT: "Italy", JM: "Jamaica",
  JP: "Japan", JO: "Jordan", KZ: "Kazakhstan", KE: "Kenya", KI: "Kiribati",
  KW: "Kuwait", KG: "Kyrgyzstan", LA: "Laos", LV: "Latvia", LB: "Lebanon",
  LS: "Lesotho", LR: "Liberia", LY: "Libya", LI: "Liechtenstein", LT: "Lithuania",
  LU: "Luxembourg", MG: "Madagascar", MW: "Malawi", MY: "Malaysia", MV: "Maldives",
  ML: "Mali", MT: "Malta", MH: "Marshall Islands", MR: "Mauritania", MU: "Mauritius",
  MX: "Mexico", FM: "Micronesia", MD: "Moldova", MC: "Monaco", MN: "Mongolia",
  ME: "Montenegro", MA: "Morocco", MZ: "Mozambique", MM: "Myanmar", NA: "Namibia",
  NR: "Nauru", NP: "Nepal", NL: "Netherlands", NZ: "New Zealand", NI: "Nicaragua",
  NE: "Niger", NG: "Nigeria", NO: "Norway", OM: "Oman", PK: "Pakistan",
  PW: "Palau", PA: "Panama", PG: "Papua New Guinea", PY: "Paraguay", PE: "Peru",
  PH: "Philippines", PL: "Poland", PT: "Portugal", QA: "Qatar", RO: "Romania",
  RU: "Russia", RW: "Rwanda", KN: "Saint Kitts and Nevis", LC: "Saint Lucia",
  VC: "Saint Vincent and the Grenadines", WS: "Samoa", SM: "San Marino",
  ST: "Sao Tome and Principe", SA: "Saudi Arabia", SN: "Senegal", RS: "Serbia",
  SC: "Seychelles", SL: "Sierra Leone", SG: "Singapore", SK: "Slovakia",
  SI: "Slovenia", SB: "Solomon Islands", SO: "Somalia", ZA: "South Africa",
  SS: "South Sudan", ES: "Spain", LK: "Sri Lanka", SD: "Sudan", SR: "Suriname",
  SE: "Sweden", CH: "Switzerland", SY: "Syria", TW: "Taiwan", TJ: "Tajikistan",
  TZ: "Tanzania", TH: "Thailand", TL: "Timor-Leste", TG: "Togo", TO: "Tonga",
  TT: "Trinidad and Tobago", TN: "Tunisia", TR: "Turkey", TM: "Turkmenistan",
  TV: "Tuvalu", UG: "Uganda", UA: "Ukraine", AE: "United Arab Emirates",
  GB: "United Kingdom", US: "United States", UY: "Uruguay", UZ: "Uzbekistan",
  VU: "Vanuatu", VE: "Venezuela", VN: "Vietnam", YE: "Yemen", ZM: "Zambia",
  ZW: "Zimbabwe", PS: "Palestine", XK: "Kosovo", TF: "French Southern Territories",
};

function getCountryName(value) {
  if (!value) return "—";
  const upper = value.trim().toUpperCase();
  // If it's a 2-letter code, look it up
  if (upper.length === 2 && COUNTRY_NAMES[upper]) return COUNTRY_NAMES[upper];
  // If it's a 3-letter code or already a full name, return as-is
  return value;
}

// ✅ FIX: parse any lastLogin format correctly
function parseLastLogin(u) {
  // Priority 1: Firestore Timestamp
  if (u.lastLogin?.toDate) return u.lastLogin.toDate();
  // Priority 2: ISO string or number stored as lastLogin
  if (u.lastLogin) {
    const d = new Date(u.lastLogin);
    if (!isNaN(d.getTime())) return d;
  }
  // Priority 3: lastLoginDate field
  if (u.lastLoginDate?.toDate) return u.lastLoginDate.toDate();
  if (u.lastLoginDate) {
    const d = new Date(u.lastLoginDate);
    if (!isNaN(d.getTime())) return d;
  }
  return null;
}

function LastActiveCell({ u }) {
  const d = parseLastLogin(u);
  if (!d) return <span style={{ color: "var(--text3)", opacity: 0.5 }}>Never</span>;

  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  const hrs  = Math.floor(mins / 60);
  const days = Math.floor(hrs / 24);

  const fullDateTime = d.toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

  if (mins < 1)  return <span title={fullDateTime} style={{ color: "var(--green)", fontWeight: 700 }}>Just now</span>;
  if (mins < 60) return <span title={fullDateTime} style={{ color: "var(--green)", fontWeight: 600 }}>{mins}m ago</span>;
  if (hrs  < 24) return <span title={fullDateTime} style={{ color: "#f59e0b", fontWeight: 600 }}>{hrs}h ago</span>;
  if (days < 7)  return <span title={fullDateTime} style={{ color: "var(--text2)" }}>{days}d ago</span>;
  return <span title={fullDateTime}>{fullDateTime}</span>;
}

// ─── Confirmation Modal ───────────────────────────────────────────
function DeleteConfirmModal({ count, onConfirm, onCancel, deleting }) {
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 9999, padding: 20,
    }}>
      <div style={{
        background: "var(--bg2)", border: "1.5px solid rgba(239,68,68,0.4)",
        borderRadius: 20, padding: 32, maxWidth: 440, width: "100%",
        boxShadow: "0 24px 80px rgba(0,0,0,0.5)",
        animation: "scaleIn 0.25s cubic-bezier(0.16,1,0.3,1)",
      }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{
            width: 64, height: 64, borderRadius: "50%",
            background: "rgba(239,68,68,0.1)", border: "2px solid rgba(239,68,68,0.3)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 16px",
          }}>
            <Icon name="warn" size={28} color="#ef4444" />
          </div>
          <h3 style={{ fontSize: 20, fontWeight: 900, color: "var(--text)", marginBottom: 8 }}>
            Permanently Delete {count} User{count !== 1 ? "s" : ""}?
          </h3>
          <p style={{ fontSize: 14, color: "var(--text2)", lineHeight: 1.6 }}>
            This action is <strong style={{ color: "var(--red)" }}>irreversible</strong>.
            All user data including exam results, subscriptions, and purchase history will be permanently removed from the system.
          </p>
        </div>

        <div style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 12, padding: "12px 16px", marginBottom: 20, fontSize: 12, color: "var(--red)" }}>
          ⚠️ Deleted users will lose access to all purchased exams and subscriptions.
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={onCancel}
            disabled={deleting}
            style={{
              flex: 1, padding: "12px", background: "transparent",
              border: "1.5px solid var(--border)", borderRadius: 12,
              color: "var(--text2)", fontWeight: 700, cursor: "pointer",
              fontSize: 14, fontFamily: "inherit",
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            style={{
              flex: 1, padding: "12px",
              background: "linear-gradient(135deg,#dc2626,#b91c1c)",
              border: "none", borderRadius: 12, color: "#fff",
              fontWeight: 800, cursor: deleting ? "not-allowed" : "pointer",
              fontSize: 14, fontFamily: "inherit",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              opacity: deleting ? 0.7 : 1,
              boxShadow: "0 4px 16px rgba(220,38,38,0.4)",
            }}
          >
            {deleting ? (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: "spin 0.8s linear infinite" }}>
                  <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                </svg>
                Deleting…
              </>
            ) : (
              <><Icon name="trash" size={14} color="#fff" /> Delete Permanently</>
            )}
          </button>
        </div>
      </div>
      <style>{`@keyframes scaleIn{from{opacity:0;transform:scale(0.9)}to{opacity:1;transform:scale(1)}} @keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

// ─── Main User Management Panel ───────────────────────────────────
// ✅ Added: extraUserActions prop — renders extra UI below each user row
export default function UserManagementPanel({ users, onRefresh, showToast, extraUserActions }) {
  const [search, setSearch]           = useState("");
  const [selected, setSelected]       = useState(new Set());
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleting, setDeleting]       = useState(false);
  // ✅ Track expanded rows (for extraUserActions)
  const [expanded, setExpanded]       = useState(new Set());

  const filtered = useMemo(() =>
    users.filter(u =>
      !search.trim() ||
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.country?.toLowerCase().includes(search.toLowerCase()) ||
      getCountryName(u.country)?.toLowerCase().includes(search.toLowerCase())
    ),
    [users, search]
  );

  const allSelected = filtered.length > 0 && filtered.every(u => selected.has(u.id));

  const toggleAll = () => {
    if (allSelected) {
      setSelected(prev => {
        const next = new Set(prev);
        filtered.forEach(u => next.delete(u.id));
        return next;
      });
    } else {
      setSelected(prev => {
        const next = new Set(prev);
        filtered.forEach(u => next.add(u.id));
        return next;
      });
    }
  };

  const toggleOne = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleExpand = (id) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // ─── Secure deletion via Cloud Function ──────────────────────
  const deleteSelected = async () => {
    if (selected.size === 0) return;
    setDeleting(true);

    try {
      const ids = [...selected];

      let usedCloudFn = false;
      try {
        const functions = getFunctions();
        const deleteUserFn = httpsCallable(functions, "deleteUserCompletely");
        const result = await deleteUserFn({ userIds: ids });
        const data = result.data;
        usedCloudFn = true;

        if (data.failed?.length > 0) {
          console.warn("Some users failed:", data.failed);
        }
        showToast({
          msg: `✅ ${data.deleted?.length || ids.length} user(s) permanently deleted from Auth + Firestore.`,
          type: "success",
        });
      } catch (fnErr) {
        console.warn("Cloud function not available, falling back to Firestore deletion:", fnErr.message);

        const BATCH_SIZE = 400;
        for (let i = 0; i < ids.length; i += BATCH_SIZE) {
          const batch = writeBatch(db);
          const chunk = ids.slice(i, i + BATCH_SIZE);
          for (const uid of chunk) {
            batch.delete(doc(db, "users", uid));
          }
          await batch.commit();
        }

        for (const uid of ids) {
          try {
            const resultsSnap = await getDocs(query(collection(db, "results"), where("userId", "==", uid)));
            const resBatch = writeBatch(db);
            resultsSnap.docs.forEach(d => resBatch.delete(d.ref));
            if (!resultsSnap.empty) await resBatch.commit();

            const txSnap = await getDocs(query(collection(db, "transactions"), where("userId", "==", uid)));
            const txBatch = writeBatch(db);
            txSnap.docs.forEach(d => txBatch.delete(d.ref));
            if (!txSnap.empty) await txBatch.commit();
          } catch { /* best-effort */ }
        }

        showToast({
          msg: `✅ ${ids.length} user(s) removed from Firestore. Note: Deploy Cloud Function to also remove from Firebase Auth.`,
          type: "success",
        });
      }

      setSelected(new Set());
      setShowConfirm(false);
      onRefresh?.();
    } catch (err) {
      console.error("Delete error:", err);
      showToast({ msg: `❌ Delete failed: ${err.message}`, type: "error" });
    }
    setDeleting(false);
  };

  const selectedCount = selected.size;
  const hasExtraActions = typeof extraUserActions === "function";

  return (
    <div>
      {showConfirm && (
        <DeleteConfirmModal
          count={selectedCount}
          onConfirm={deleteSelected}
          onCancel={() => setShowConfirm(false)}
          deleting={deleting}
        />
      )}

      {/* Toolbar */}
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16, flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
          <div style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text3)" }}>
            <Icon name="search" size={15} />
          </div>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, email, country…"
            style={{
              width: "100%", padding: "10px 12px 10px 36px", borderRadius: 10,
              border: "1.5px solid var(--border)", background: "var(--bg2)",
              color: "var(--text)", fontSize: 13, fontFamily: "inherit", outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>

        {selectedCount > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, animation: "fadeIn 0.2s ease" }}>
            <div style={{
              padding: "8px 14px", background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.25)", borderRadius: 10,
              fontSize: 12, fontWeight: 700, color: "var(--red)",
            }}>
              {selectedCount} selected
            </div>
            <button
              onClick={() => setShowConfirm(true)}
              style={{
                padding: "8px 16px", background: "rgba(239,68,68,0.1)",
                border: "1.5px solid rgba(239,68,68,0.4)", borderRadius: 10,
                color: "var(--red)", fontWeight: 800, cursor: "pointer",
                fontSize: 12, fontFamily: "inherit",
                display: "flex", alignItems: "center", gap: 6,
                transition: "all 0.2s",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(239,68,68,0.2)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(239,68,68,0.1)"; }}
            >
              <Icon name="trash" size={13} color="var(--red)" />
              Delete Permanently
            </button>
            <button
              onClick={() => setSelected(new Set())}
              style={{
                background: "none", border: "none", color: "var(--text3)",
                cursor: "pointer", padding: 4, display: "flex",
              }}
            >
              <Icon name="x" size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div style={{ background: "var(--bg2)", borderRadius: 14, border: "1.5px solid var(--border)", overflow: "hidden" }}>
        {/* Header */}
        <div style={{
          display: "grid",
          gridTemplateColumns: hasExtraActions
            ? "44px 1fr 1fr 160px 100px 140px 80px 44px"
            : "44px 1fr 1fr 160px 100px 140px 80px",
          padding: "10px 16px", borderBottom: "1px solid var(--border)",
          background: "var(--bg3)", fontSize: 11, fontWeight: 800,
          color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.06em",
          gap: 8,
        }}>
          <div
            onClick={toggleAll}
            style={{
              width: 20, height: 20, borderRadius: 6, cursor: "pointer",
              border: "2px solid " + (allSelected ? "var(--accent)" : "var(--border)"),
              background: allSelected ? "var(--accent)" : "transparent",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.2s", flexShrink: 0,
            }}
          >
            {allSelected && <Icon name="check" size={11} color="#fff" />}
          </div>
          <span>User</span>
          <span>Email</span>
          <span>Country</span>
          <span>Joined</span>
          <span>Last Active</span>
          <span>Role</span>
          {hasExtraActions && <span></span>}
        </div>

        {/* Rows */}
        {filtered.length === 0 ? (
          <div style={{ padding: "32px 16px", textAlign: "center", color: "var(--text3)", fontSize: 13 }}>
            {search ? "No users match your search." : "No users found."}
          </div>
        ) : (
          filtered.map((u, i) => {
            const isChecked  = selected.has(u.id);
            const isExpanded = expanded.has(u.id);
            return (
              <div key={u.id} style={{ borderBottom: i < filtered.length - 1 ? "1px solid var(--border)" : "none" }}>
                {/* Main row */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: hasExtraActions
                      ? "44px 1fr 1fr 160px 100px 140px 80px 44px"
                      : "44px 1fr 1fr 160px 100px 140px 80px",
                    padding: "12px 16px", gap: 8,
                    background: isChecked ? "rgba(99,102,241,0.06)" : "transparent",
                    alignItems: "center", transition: "background 0.15s",
                  }}
                >
                  {/* Checkbox */}
                  <div
                    onClick={() => toggleOne(u.id)}
                    style={{
                      width: 20, height: 20, borderRadius: 6, cursor: "pointer",
                      border: "2px solid " + (isChecked ? "var(--accent)" : "var(--border)"),
                      background: isChecked ? "var(--accent)" : "transparent",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      transition: "all 0.2s", flexShrink: 0,
                    }}
                  >
                    {isChecked && <Icon name="check" size={11} color="#fff" />}
                  </div>

                  {/* Name */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                      background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 13, fontWeight: 900, color: "#fff",
                    }}>
                      {(u.name || u.email || "?")[0].toUpperCase()}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {u.name || "—"}
                      </div>
                      {u.role === "admin" && (
                        <div style={{ fontSize: 10, color: "var(--accent)", fontWeight: 800 }}>ADMIN</div>
                      )}
                    </div>
                  </div>

                  {/* Email */}
                  <div style={{ fontSize: 12, color: "var(--text2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {u.email || "—"}
                  </div>

                  {/* Country — full name */}
                  <div style={{ fontSize: 12, color: "var(--text3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={getCountryName(u.country)}>
                    {getCountryName(u.country)}
                  </div>

                  {/* Join date */}
                  <div style={{ fontSize: 11, color: "var(--text3)" }}>
                    {u.createdAt
                      ? new Date(u.createdAt?.toDate?.() || u.createdAt).toLocaleDateString()
                      : "—"
                    }
                  </div>

                  {/* ✅ Last Active — fixed component */}
                  <div style={{ fontSize: 11, color: "var(--text3)" }}>
                    <LastActiveCell u={u} />
                  </div>

                  {/* Role badge */}
                  <div>
                    <span style={{
                      fontSize: 10, fontWeight: 800, padding: "3px 8px", borderRadius: 100,
                      background: u.role === "admin" ? "rgba(99,102,241,0.12)" : "rgba(100,116,139,0.1)",
                      color: u.role === "admin" ? "var(--accent)" : "var(--text3)",
                      textTransform: "uppercase", letterSpacing: "0.05em",
                    }}>
                      {u.role || "user"}
                    </span>
                  </div>

                  {/* ✅ Expand toggle (only if extraUserActions provided) */}
                  {hasExtraActions && (
                    <button
                      onClick={() => toggleExpand(u.id)}
                      title={isExpanded ? "Collapse" : "Manage access & actions"}
                      style={{
                        width: 28, height: 28, borderRadius: 7,
                        border: `1.5px solid ${isExpanded ? "var(--accent)" : "var(--border)"}`,
                        background: isExpanded ? "rgba(99,102,241,0.1)" : "transparent",
                        color: isExpanded ? "var(--accent)" : "var(--text3)",
                        cursor: "pointer", fontSize: 12,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        transition: "all 0.18s", flexShrink: 0,
                      }}
                    >
                      {isExpanded ? "▲" : "▼"}
                    </button>
                  )}
                </div>

                {/* ✅ Expanded extra actions panel */}
                {hasExtraActions && isExpanded && (
                  <div style={{
                    padding: "14px 16px 18px 72px",
                    background: "rgba(99,102,241,0.03)",
                    borderTop: "1px solid var(--border)",
                  }}>
                    {extraUserActions(u)}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer stats */}
      <div style={{ padding: "10px 0", display: "flex", gap: 16, fontSize: 12, color: "var(--text3)", alignItems: "center" }}>
        <span>{filtered.length} of {users.length} users shown</span>
        {selectedCount > 0 && (
          <span style={{ color: "var(--red)", fontWeight: 700 }}>{selectedCount} selected for deletion</span>
        )}
      </div>
    </div>
  );
}
