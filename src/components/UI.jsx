// components/UI.jsx — FlexExams v3.0 — Premium Components
import React from "react";

/* ══════════════════════════════════════════
   ICON SYSTEM — Premium SVG Icons
══════════════════════════════════════════ */
const ICON_PATHS = {
  home:         "M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25",
  book:         "M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25",
  exam:         "M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z",
  clock:        "M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z",
  chart:        "M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z",
  settings:     "M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z M15 12a3 3 0 11-6 0 3 3 0 016 0z",
  user:         "M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z",
  logout:       "M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9",
  refresh:      "M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99",
  search:       "M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0015.803 15.803z",
  plus:         "M12 4.5v15m7.5-7.5h-15",
  trash:        "M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0",
  edit:         "M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10",
  check:        "M4.5 12.75l6 6 9-13.5",
  close:        "M6 18L18 6M6 6l12 12",
  dashboard:    "M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z",
  trophy:       "M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0",
  download:     "M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3",
  upload:       "M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5",
  send:         "M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5",
  arrow_right:  "M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3",
  warning:      "M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z",
  eye:          "M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.964-7.178z M15 12a3 3 0 11-6 0 3 3 0 016 0z",
  shield:       "M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z",
  star:         "M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z",
  fire:         "M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z",
  globe:        "M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418",
  lightning:    "M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z",
  flag:         "M3 3v1.5M3 21v-6m0 0l2.77-.693a9 9 0 016.208.682l.108.054a9 9 0 006.086.71l3.114-.732a48.524 48.524 0 01-.005-10.499l-3.11.732a9 9 0 01-6.085-.711l-.108-.054a9 9 0 00-6.208-.682L3 4.5M3 15V4.5",
  menu:         "M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5",
  chevron_right:"M8.25 4.5l7.5 7.5-7.5 7.5",
  chevron_down: "M19.5 8.25l-7.5 7.5-7.5-7.5",
  info:         "M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z",
  calendar:     "M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5",
  trending:     "M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941",
  history:      "M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z",
  public:       "M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3",
  dollar:       "M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  link:         "M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244",
  "alert_circle":"M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z",
  "user-plus":  "M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z",
};

export function Icon({ n, size = 18, color, style = {} }) {
  const d = ICON_PATHS[n] || ICON_PATHS.info;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke={color || "currentColor"}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{
        width: size, height: size,
        flexShrink: 0, display: "inline-block",
        verticalAlign: "middle", ...style
      }}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
  );
}

/* ══════════════════════════════════════════
   INPUT
══════════════════════════════════════════ */
export function Input({ label, type = "text", value, onChange, placeholder, error, disabled = false, prefix, ...props }) {
  return (
    <div style={{ marginBottom: 18 }}>
      {label && (
        <label style={{
          fontSize: 12, fontWeight: 700, color: "var(--text2)",
          marginBottom: 7, display: "block", letterSpacing: "0.02em",
        }}>
          {label}
        </label>
      )}
      <div style={{ position: "relative" }}>
        {prefix && (
          <span style={{
            position: "absolute", left: 12, top: "50%",
            transform: "translateY(-50%)", color: "var(--text3)",
            pointerEvents: "none", display: "flex", alignItems: "center",
          }}>{prefix}</span>
        )}
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          style={{
            width: "100%",
            padding: prefix ? "11px 14px 11px 40px" : "11px 14px",
            background: disabled ? "var(--bg3)" : "var(--input-bg)",
            border: `1.5px solid ${error ? "var(--red)" : "var(--input-border)"}`,
            borderRadius: 12,
            color: "var(--text)",
            fontSize: 14,
            outline: "none",
            fontFamily: "inherit",
            transition: "border-color 0.2s, box-shadow 0.2s",
            opacity: disabled ? 0.55 : 1,
            cursor: disabled ? "not-allowed" : "text",
          }}
          {...props}
        />
      </div>
      {error && (
        <div style={{ fontSize: 12, color: "var(--red)", marginTop: 5, display: "flex", alignItems: "center", gap: 4 }}>
          <Icon n="warning" size={12} color="var(--red)" /> {error}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════
   SELECT
══════════════════════════════════════════ */
export function Select({ label, value, onChange, children, style = {}, ...props }) {
  return (
    <div style={{ marginBottom: 18, ...style }}>
      {label && (
        <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text2)", marginBottom: 7, display: "block" }}>
          {label}
        </label>
      )}
      <select
        value={value}
        onChange={onChange}
        style={{
          width: "100%", padding: "11px 14px",
          background: "var(--input-bg)",
          border: "1.5px solid var(--input-border)",
          borderRadius: 12, color: "var(--text)",
          fontSize: 14, outline: "none",
          fontFamily: "inherit", cursor: "pointer",
          transition: "border-color 0.2s",
          appearance: "auto",
        }}
        {...props}
      >
        {children}
      </select>
    </div>
  );
}

/* ══════════════════════════════════════════
   TEXTAREA
══════════════════════════════════════════ */
export function Textarea({ label, value, onChange, placeholder, error, rows = 4, ...props }) {
  return (
    <div style={{ marginBottom: 18 }}>
      {label && (
        <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text2)", marginBottom: 7, display: "block" }}>
          {label}
        </label>
      )}
      <textarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        style={{
          width: "100%", padding: "11px 14px",
          background: "var(--input-bg)",
          border: `1.5px solid ${error ? "var(--red)" : "var(--input-border)"}`,
          borderRadius: 12, color: "var(--text)",
          fontSize: 14, outline: "none",
          fontFamily: "inherit", resize: "vertical",
          lineHeight: 1.65, transition: "border-color 0.2s",
        }}
        {...props}
      />
      {error && <div style={{ fontSize: 12, color: "var(--red)", marginTop: 5 }}>{error}</div>}
    </div>
  );
}

/* ══════════════════════════════════════════
   BUTTON
══════════════════════════════════════════ */
export function Btn({ children, onClick, variant = "primary", size = "md", loading = false, disabled = false, full = false, style = {}, type, ...props }) {
  const sizeMap = {
    xs: { p: "5px 10px", fs: 11, gap: 4, r: 8 },
    sm: { p: "7px 13px", fs: 12, gap: 5, r: 10 },
    md: { p: "10px 18px", fs: 13, gap: 6, r: 11 },
    lg: { p: "13px 26px", fs: 14, gap: 8, r: 13 },
  };
  const sz = sizeMap[size] || sizeMap.md;

  const variantMap = {
    primary: {
      bg: "var(--gradient-accent)", c: "#fff",
      br: "transparent", sh: "0 4px 14px var(--accent-glow)",
      hoverSh: "0 8px 24px var(--accent-glow)",
    },
    ghost: {
      bg: "transparent", c: "var(--text2)",
      br: "var(--border2)", sh: "none",
      hoverSh: "none",
    },
    danger: {
      bg: "linear-gradient(135deg,#dc2626,#b91c1c)", c: "#fff",
      br: "transparent", sh: "0 3px 12px rgba(220,38,38,0.28)",
      hoverSh: "0 6px 20px rgba(220,38,38,0.35)",
    },
    success: {
      bg: "linear-gradient(135deg,var(--green),#047857)", c: "#fff",
      br: "transparent", sh: "0 3px 12px var(--green-soft)",
      hoverSh: "0 6px 20px var(--green-soft)",
    },
    subtle: {
      bg: "var(--bg3)", c: "var(--text2)",
      br: "var(--border)", sh: "none",
      hoverSh: "none",
    },
    outline: {
      bg: "transparent", c: "var(--accent)",
      br: "var(--accent)", sh: "none",
      hoverSh: "0 4px 14px var(--accent-glow)",
    },
  };
  const vr = variantMap[variant] || variantMap.primary;
  const off = disabled || loading;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={off}
      style={{
        padding: sz.p,
        fontSize: sz.fs,
        background: vr.bg,
        color: vr.c,
        border: `1.5px solid ${vr.br}`,
        borderRadius: sz.r,
        cursor: off ? "not-allowed" : "pointer",
        fontWeight: 600,
        display: "inline-flex",
        alignItems: "center",
        gap: sz.gap,
        fontFamily: "inherit",
        transition: "all 0.2s cubic-bezier(0.25,0.46,0.45,0.94)",
        opacity: off ? 0.55 : 1,
        width: full ? "100%" : "auto",
        justifyContent: full ? "center" : "flex-start",
        boxShadow: vr.sh,
        lineHeight: 1,
        whiteSpace: "nowrap",
        ...style,
      }}
      onMouseEnter={e => {
        if (!off) {
          e.currentTarget.style.transform = "translateY(-2px)";
          e.currentTarget.style.filter = "brightness(1.06)";
          e.currentTarget.style.boxShadow = vr.hoverSh;
        }
      }}
      onMouseLeave={e => {
        if (!off) {
          e.currentTarget.style.transform = "";
          e.currentTarget.style.filter = "";
          e.currentTarget.style.boxShadow = vr.sh;
        }
      }}
      onMouseDown={e => { if (!off) e.currentTarget.style.transform = "scale(0.97)"; }}
      onMouseUp={e => { if (!off) e.currentTarget.style.transform = "translateY(-2px)"; }}
      {...props}
    >
      {children}
      {loading && <Spinner size={sz.fs + 2} color={vr.c} />}
    </button>
  );
}

/* ══════════════════════════════════════════
   SPINNER
══════════════════════════════════════════ */
export function Spinner({ size = 20, color = "var(--accent)" }) {
  return (
    <div style={{
      width: size, height: size,
      border: `2px solid ${color}30`,
      borderTop: `2px solid ${color}`,
      borderRadius: "50%",
      animation: "spin 0.7s linear infinite",
      flexShrink: 0,
    }} />
  );
}

/* ══════════════════════════════════════════
   TAG
══════════════════════════════════════════ */
export function Tag({ children, color = "var(--accent)" }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      padding: "3px 10px", borderRadius: 99,
      background: `${color}14`, color,
      fontSize: 11, fontWeight: 700,
      whiteSpace: "nowrap",
      border: `1px solid ${color}28`,
    }}>
      {children}
    </span>
  );
}

/* ══════════════════════════════════════════
   CARD
══════════════════════════════════════════ */
export function Card({ children, glass = false, style = {}, hover = true, glow = false, ...props }) {
  const base = {
    background: glass ? "var(--bg-glass)" : "var(--bg2)",
    backdropFilter: glass ? "var(--nav-blur)" : "none",
    WebkitBackdropFilter: glass ? "var(--nav-blur)" : "none",
    border: glass ? "1px solid var(--glass-border)" : "1.5px solid var(--border)",
    borderRadius: 18,
    padding: "20px 22px",
    boxShadow: glow ? "var(--card-glow)" : glass ? "var(--glass-shadow)" : "var(--card-shadow)",
    transition: "var(--transition-spring)",
  };
  return (
    <div
      className={hover ? "card-lift" : ""}
      style={{ ...base, ...style }}
      {...props}
    >
      {children}
    </div>
  );
}

/* ══════════════════════════════════════════
   STAT CARD
══════════════════════════════════════════ */
export function StatCard({ icon, label, value, color = "var(--accent)", trend }) {
  return (
    <div
      className="card-lift"
      style={{
        background: "var(--bg2)",
        border: "1.5px solid var(--border)",
        borderRadius: 18, padding: "18px 20px",
        boxShadow: "var(--card-shadow)",
        position: "relative", overflow: "hidden",
      }}
    >
      <div style={{ position: "absolute", top: -16, right: -16, width: 72, height: 72, borderRadius: "50%", background: `radial-gradient(circle,${color}15,transparent 70%)`, pointerEvents: "none" }} />
      <div style={{
        width: 40, height: 40, borderRadius: 12,
        background: `${color}12`, border: `1.5px solid ${color}22`,
        display: "flex", alignItems: "center", justifyContent: "center",
        marginBottom: 12, color,
      }}>
        {typeof icon === "string" && ICON_PATHS[icon]
          ? <Icon n={icon} size={18} color={color} />
          : <span style={{ fontSize: 18 }}>{icon}</span>
        }
      </div>
      <div style={{ fontSize: 11, color: "var(--text3)", marginBottom: 4, fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 800, color, lineHeight: 1.2 }}>{value}</div>
      {trend && <div style={{ fontSize: 11, color: "var(--green)", marginTop: 5, fontWeight: 600 }}>↑ {trend}</div>}
    </div>
  );
}

/* ══════════════════════════════════════════
   PROGRESS BAR
══════════════════════════════════════════ */
export function ProgressBar({ label, value, max = 100, color = "var(--accent)", height = 7 }) {
  const pct = Math.min(100, Math.max(0, Math.round((value / max) * 100)));
  return (
    <div style={{ marginBottom: label ? 13 : 0 }}>
      {label && (
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 600, color: "var(--text2)", marginBottom: 6 }}>
          <span>{label}</span>
          <span style={{ fontWeight: 700, color }}>{pct}%</span>
        </div>
      )}
      <div style={{ width: "100%", height, background: "var(--bg4)", borderRadius: 99, overflow: "hidden" }}>
        <div style={{
          width: `${pct}%`, height: "100%",
          background: color, borderRadius: 99,
          transition: "width 0.85s cubic-bezier(0.16,1,0.3,1)",
        }} />
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   TOAST
══════════════════════════════════════════ */
export function Toast({ toast }) {
  if (!toast) return null;
  const configs = {
    success: { col: "var(--green)", ic: "check", bg: "var(--green-soft)", border: "rgba(5,150,105,0.25)" },
    error:   { col: "var(--red)",   ic: "close", bg: "var(--red-soft)",   border: "rgba(220,38,38,0.25)" },
    warning: { col: "var(--gold)",  ic: "warning",bg: "var(--gold-soft)",  border: "rgba(217,119,6,0.25)" },
    info:    { col: "var(--accent)",ic: "info",   bg: "var(--accent-soft)",border: "var(--accent-border)" },
  };
  const c = configs[toast.type] || configs.info;
  return (
    <div style={{
      position: "fixed", bottom: 24, right: 24,
      background: "var(--bg2)",
      backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
      border: `1.5px solid ${c.border}`,
      borderLeft: `4px solid ${c.col}`,
      borderRadius: 16, padding: "14px 18px",
      display: "flex", alignItems: "center", gap: 12,
      fontSize: 13, fontWeight: 500,
      animation: "toastIn 0.35s cubic-bezier(0.16,1,0.3,1) both",
      zIndex: 10000,
      boxShadow: "0 16px 40px rgba(0,0,0,0.15)",
      maxWidth: 380,
    }}>
      <div style={{
        width: 34, height: 34, borderRadius: 10,
        background: c.bg,
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0, color: c.col,
      }}>
        <Icon n={c.ic} size={16} color={c.col} />
      </div>
      <span style={{ color: "var(--text)", lineHeight: 1.5, flex: 1 }}>{toast.msg}</span>
    </div>
  );
}

/* ══════════════════════════════════════════
   MODAL
══════════════════════════════════════════ */
export function Modal({ title, children, onClose, maxWidth = 580 }) {
  React.useEffect(() => {
    const h = e => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", h);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", h);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 9000,
        background: "rgba(0,0,0,0.5)",
        backdropFilter: "blur(16px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        animation: "fadeIn 0.2s ease",
        padding: 20,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="scale-in"
        style={{
          background: "var(--bg2)",
          border: "1.5px solid var(--border2)",
          borderRadius: 22, padding: "28px 30px",
          maxWidth, width: "100%",
          maxHeight: "90vh", overflow: "auto",
          boxShadow: "0 32px 80px rgba(0,0,0,0.2)",
        }}
      >
        <div style={{
          display: "flex", justifyContent: "space-between",
          alignItems: "center", marginBottom: 22,
          paddingBottom: 18, borderBottom: "1.5px solid var(--border)",
        }}>
          <h2 style={{
            fontSize: 17, fontWeight: 800, color: "var(--text)",
            fontFamily: "'Syne','Plus Jakarta Sans',sans-serif",
          }}>{title}</h2>
          <button
            onClick={onClose}
            style={{
              width: 34, height: 34, borderRadius: 10,
              background: "var(--bg3)", border: "1.5px solid var(--border)",
              color: "var(--text3)", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.2s",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "var(--red-soft)"; e.currentTarget.style.color = "var(--red)"; e.currentTarget.style.borderColor = "var(--red)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "var(--bg3)"; e.currentTarget.style.color = "var(--text3)"; e.currentTarget.style.borderColor = "var(--border)"; }}
          >
            <Icon n="close" size={15} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   EMPTY STATE
══════════════════════════════════════════ */
export function Empty({ icon = "search", title = "Nothing here yet", subtitle = "", action = null, emoji = false }) {
  return (
    <div style={{ textAlign: "center", padding: "56px 24px" }}>
      <div style={{
        width: 72, height: 72, borderRadius: 20,
        background: "var(--bg3)", border: "1.5px solid var(--border)",
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        marginBottom: 18, color: "var(--text3)",
        animation: "float 3s ease-in-out infinite",
      }}>
        {emoji
          ? <span style={{ fontSize: 32 }}>{icon}</span>
          : typeof icon === "string" && ICON_PATHS[icon]
            ? <Icon n={icon} size={28} color="var(--text3)" />
            : <span style={{ fontSize: 30 }}>{icon}</span>
        }
      </div>
      <h3 style={{
        fontSize: 18, fontWeight: 800, color: "var(--text)",
        marginBottom: 8, fontFamily: "'Syne',sans-serif",
      }}>{title}</h3>
      {subtitle && (
        <p style={{ fontSize: 13, color: "var(--text3)", lineHeight: 1.7, maxWidth: 320, margin: "0 auto 16px" }}>
          {subtitle}
        </p>
      )}
      {action && <div style={{ marginTop: 20 }}>{action}</div>}
    </div>
  );
}

/* ══════════════════════════════════════════
   DIVIDER
══════════════════════════════════════════ */
export function Divider({ label }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12,
      margin: "20px 0", color: "var(--text4)", fontSize: 12, fontWeight: 500,
    }}>
      <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
      {label && <span>{label}</span>}
      <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
    </div>
  );
}

/* ══════════════════════════════════════════
   BADGE
══════════════════════════════════════════ */
export function Badge({ children, color = "var(--accent)" }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      padding: "2px 8px", borderRadius: 99,
      background: `${color}14`, color,
      fontSize: 10, fontWeight: 800,
      textTransform: "uppercase", letterSpacing: "0.06em",
      border: `1px solid ${color}28`,
    }}>
      {children}
    </span>
  );
}

/* ══════════════════════════════════════════
   ALERT BANNER
══════════════════════════════════════════ */
export function AlertBanner({ type = "info", children }) {
  const map = {
    info:    { c: "var(--accent)", bg: "var(--accent-soft)", br: "var(--accent-border)", ic: "info" },
    success: { c: "var(--green)", bg: "var(--green-soft)", br: "rgba(5,150,105,0.2)", ic: "check" },
    warning: { c: "var(--gold)",  bg: "var(--gold-soft)",  br: "rgba(217,119,6,0.2)",  ic: "warning" },
    error:   { c: "var(--red)",   bg: "var(--red-soft)",   br: "rgba(220,38,38,0.2)",  ic: "close" },
  };
  const t = map[type] || map.info;
  return (
    <div style={{
      background: t.bg, border: `1.5px solid ${t.br}`,
      borderRadius: 12, padding: "12px 16px",
      display: "flex", alignItems: "flex-start", gap: 10,
      fontSize: 13, color: "var(--text2)", lineHeight: 1.6, marginBottom: 16,
    }}>
      <Icon n={t.ic} size={15} color={t.c} style={{ flexShrink: 0, marginTop: 1 }} />
      <span>{children}</span>
    </div>
  );
}

/* ══════════════════════════════════════════
   SCORE RING
══════════════════════════════════════════ */
export function ScoreRing({ score, pass, size = 130 }) {
  const r = size * 0.38;
  const c2 = 2 * Math.PI * r;
  const off = c2 - (score / 100) * c2;
  const col = pass ? "var(--green)" : "var(--red)";
  const cx = size / 2, cy = size / 2;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--bg4)" strokeWidth={size * 0.07} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={col}
        strokeWidth={size * 0.07} strokeDasharray={c2} strokeDashoffset={off}
        strokeLinecap="round" transform={`rotate(-90 ${cx} ${cy})`}
        style={{ transition: "stroke-dashoffset 1.1s cubic-bezier(0.16,1,0.3,1)" }} />
      <text x={cx} y={cy - size * 0.04} textAnchor="middle"
        fill="var(--text)" fontSize={size * 0.2} fontWeight={800}
        fontFamily="'Syne','Plus Jakarta Sans',sans-serif">
        {score}%
      </text>
      <text x={cx} y={cy + size * 0.14} textAnchor="middle"
        fill={col} fontSize={size * 0.09} fontWeight={700}>
        {pass ? "PASSED ✓" : "FAILED ✗"}
      </text>
    </svg>
  );
}

/* ══════════════════════════════════════════
   SKELETON
══════════════════════════════════════════ */
export function Skeleton({ width = "100%", height = 16, borderRadius = 8, style = {} }) {
  return (
    <div
      className="skeleton"
      style={{ width, height, borderRadius, ...style }}
    />
  );
}