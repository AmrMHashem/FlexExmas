// components/SharingSystem.jsx
// Share website + certificates on social media (WhatsApp, Twitter/X, LinkedIn, Facebook, copy link)
import React, { useState, useCallback } from "react";

// ─── Icons ───────────────────────────────────────────────────────
const TwitterIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const LinkedInIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
);

const FacebookIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const WhatsAppIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
  </svg>
);

const CopyIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
  </svg>
);

// ─── Share Button ─────────────────────────────────────────────────
function ShareBtn({ platform, icon, label, color, onClick, small = false }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      title={`Share on ${label}`}
      style={{
        display: "flex", alignItems: "center", gap: small ? 6 : 8,
        padding: small ? "7px 12px" : "10px 16px",
        background: hover ? color : `${color}18`,
        border: `1.5px solid ${color}40`,
        borderRadius: 10, cursor: "pointer",
        color: hover ? "#fff" : color,
        fontWeight: 700, fontSize: small ? 12 : 13,
        fontFamily: "inherit", transition: "all 0.2s",
        flexShrink: 0,
      }}
    >
      {icon}
      {!small && <span>{label}</span>}
    </button>
  );
}

// ─── Share Modal ──────────────────────────────────────────────────
export function ShareModal({ onClose, title, text, url, imageUrl, type = "site" }) {
  const [copied, setCopied] = useState(false);

  const shareUrl = url || window.location.href;
  const shareText = text || "Check out FlexExams — the best platform for certification practice! 🎯";

  const copyLink = useCallback(() => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }, [shareUrl]);

  const platforms = [
    {
      id: "twitter",
      label: "X (Twitter)",
      color: "#000",
      icon: <TwitterIcon />,
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
    },
    {
      id: "linkedin",
      label: "LinkedIn",
      color: "#0077B5",
      icon: <LinkedInIcon />,
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}&summary=${encodeURIComponent(shareText)}`,
    },
    {
      id: "facebook",
      label: "Facebook",
      color: "#1877F2",
      icon: <FacebookIcon />,
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`,
    },
    {
      id: "whatsapp",
      label: "WhatsApp",
      color: "#25D366",
      icon: <WhatsAppIcon />,
      href: `https://wa.me/?text=${encodeURIComponent(shareText + " " + shareUrl)}`,
    },
  ];

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: 20 }}
      onClick={e => e.target === e.currentTarget && onClose?.()}>
      <div style={{
        background: "var(--bg2)", border: "1.5px solid var(--border)",
        borderRadius: 20, padding: "28px 28px 24px", maxWidth: 420, width: "100%",
        boxShadow: "0 24px 80px rgba(0,0,0,0.4)",
        animation: "scaleIn 0.25s cubic-bezier(0.16,1,0.3,1)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div>
            <h3 style={{ fontSize: 17, fontWeight: 900, color: "var(--text)", marginBottom: 3 }}>
              {type === "certificate" ? "🏆 Share Your Certificate" : "🚀 Share FlexExams"}
            </h3>
            <p style={{ fontSize: 12, color: "var(--text3)" }}>
              {type === "certificate" ? "Show the world your achievement!" : "Help your friends discover FlexExams"}
            </p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text3)", padding: 4, display: "flex" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* Preview */}
        {type === "certificate" && imageUrl && (
          <div style={{ marginBottom: 16, borderRadius: 12, overflow: "hidden", border: "1px solid var(--border)", maxHeight: 140 }}>
            <img src={imageUrl} alt="Certificate" style={{ width: "100%", objectFit: "cover" }} />
          </div>
        )}

        {/* Share text preview */}
        <div style={{
          background: "var(--bg3)", border: "1px solid var(--border)",
          borderRadius: 10, padding: "12px 14px", marginBottom: 16,
          fontSize: 13, color: "var(--text2)", lineHeight: 1.5,
        }}>
          {shareText}
        </div>

        {/* Platform buttons */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
          {platforms.map(p => (
            <ShareBtn
              key={p.id}
              platform={p.id}
              icon={p.icon}
              label={p.label}
              color={p.color}
              onClick={() => window.open(p.href, "_blank", "width=600,height=500")}
            />
          ))}
        </div>

        {/* Copy link */}
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div style={{
            flex: 1, padding: "10px 14px", background: "var(--bg3)",
            border: "1.5px solid var(--border)", borderRadius: 10,
            fontSize: 12, color: "var(--text3)", overflow: "hidden",
            textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {shareUrl}
          </div>
          <button
            onClick={copyLink}
            style={{
              padding: "10px 14px", background: copied ? "var(--green)" : "var(--accent-soft)",
              border: `1.5px solid ${copied ? "var(--green)" : "var(--border)"}`,
              borderRadius: 10, cursor: "pointer", color: copied ? "#fff" : "var(--accent)",
              fontWeight: 700, fontSize: 12, fontFamily: "inherit",
              display: "flex", alignItems: "center", gap: 5, transition: "all 0.2s",
              whiteSpace: "nowrap",
            }}
          >
            {copied ? (
              <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg> Copied!</>
            ) : (
              <><CopyIcon /> Copy Link</>
            )}
          </button>
        </div>
      </div>
      <style>{`@keyframes scaleIn{from{opacity:0;transform:scale(0.92)}to{opacity:1;transform:scale(1)}}`}</style>
    </div>
  );
}

// ─── Inline Share Bar (compact, for use in Result/Certificate pages) ──────────
export function ShareBar({ text, url, type = "site", small = false }) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        style={{
          display: "inline-flex", alignItems: "center", gap: 7,
          padding: small ? "7px 14px" : "10px 18px",
          background: "linear-gradient(135deg,rgba(99,102,241,0.1),rgba(168,85,247,0.08))",
          border: "1.5px solid rgba(99,102,241,0.3)",
          borderRadius: 100, cursor: "pointer",
          color: "var(--accent)", fontWeight: 800,
          fontSize: small ? 11 : 13, fontFamily: "inherit",
          transition: "all 0.2s",
        }}
        onMouseEnter={e => { e.currentTarget.style.background = "rgba(99,102,241,0.2)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
        onMouseLeave={e => { e.currentTarget.style.background = "linear-gradient(135deg,rgba(99,102,241,0.1),rgba(168,85,247,0.08))"; e.currentTarget.style.transform = ""; }}
      >
        <svg width={small ? 13 : 15} height={small ? 13 : 15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
        {type === "certificate" ? "Share Certificate" : "Share"}
      </button>
      {showModal && (
        <ShareModal
          onClose={() => setShowModal(false)}
          text={text}
          url={url}
          type={type}
        />
      )}
    </>
  );
}

export default { ShareModal, ShareBar };
