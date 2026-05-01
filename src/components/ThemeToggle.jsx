// components/ThemeToggle.jsx — v3.0
import React from "react";

export default function ThemeToggle() {
  const [theme, setTheme] = React.useState(() => {
    return localStorage.getItem("theme") || "dark";
  });

  React.useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const isDark = theme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      title={`Switch to ${isDark ? "light" : "dark"} mode`}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      style={{
        width: 44,
        height: 44,
        borderRadius: 14,
        border: "1.5px solid var(--border2)",
        background: "var(--bg3)",
        color: "var(--text2)",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "all 0.3s cubic-bezier(0.34,1.2,0.64,1)",
        position: "relative",
        overflow: "hidden",
        flexShrink: 0,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "var(--accent-soft)";
        e.currentTarget.style.borderColor = "var(--accent)";
        e.currentTarget.style.color = "var(--accent)";
        e.currentTarget.style.transform = "scale(1.08)";
        e.currentTarget.style.boxShadow = "0 0 16px var(--accent-glow)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "var(--bg3)";
        e.currentTarget.style.borderColor = "var(--border2)";
        e.currentTarget.style.color = "var(--text2)";
        e.currentTarget.style.transform = "";
        e.currentTarget.style.boxShadow = "";
      }}
    >
      <span
        key={theme}
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          animation: "themeIconPop 0.35s cubic-bezier(0.34,1.56,0.64,1) both",
        }}
      >
        <style>{`
          @keyframes themeIconPop {
            from { opacity:0; transform:scale(0.4) rotate(-30deg); }
            to   { opacity:1; transform:scale(1) rotate(0deg); }
          }
        `}</style>
        {isDark ? (
          /* Sun icon */
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="5"/>
            <line x1="12" y1="1" x2="12" y2="3"/>
            <line x1="12" y1="21" x2="12" y2="23"/>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
            <line x1="1" y1="12" x2="3" y2="12"/>
            <line x1="21" y1="12" x2="23" y2="12"/>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
          </svg>
        ) : (
          /* Moon icon */
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
          </svg>
        )}
      </span>
    </button>
  );
}