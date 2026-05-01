import React from "react";

export default function Footer({ setPage }) {
  const productLinks = [
    { label: "Browse Exams", page: "exams" },
    { label: "Explore Topics", page: "topics" },
    { label: "Certification Vendors", page: "categories" },
    { label: "My Exam History", page: "my-exams" },
  ];

  const companyLinks = [
    { label: "About Us", page: "about" },
    { label: "Contact", page: "contact" },
    { label: "Blog", page: "blog" },
    { label: "Privacy Policy", page: "privacy" },
  ];

  return (
    <footer
      style={{
        background: "var(--bg2)",
        borderTop: "1px solid var(--border)",
        marginTop: 0,
        width: "100%",
        overflowX: "hidden",
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "32px clamp(16px, 4vw, 32px) 24px",
          overflowX: "hidden",
        }}
      >
        {/* شبكة الأعمدة - مسافات قليلة جدًا */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: 24,
            marginBottom: 32,
          }}
        >
          {/* العمود الأول: الشعار والمعلومات */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <div
                style={{
                  width: 40,
                  borderRadius: 10,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                  flexShrink: 0,
                }}
              >
                <img
                  src="https://i.ibb.co/DPztDcgx/Chat-GPT-Image-Apr-26-2026-09-45-41-PM.png"
                  alt="FlexExams Logo"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>
              <div>
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 800,
                    color: "var(--text)",
                    letterSpacing: "-0.5px",
                  }}
                >
                  FlexExams
                </div>
                <div
                  style={{
                    fontSize: 8,
                    color: "var(--text3)",
                    letterSpacing: "0.08em",
                    fontWeight: 600,
                    textTransform: "uppercase",
                  }}
                >
                  Certification Platform
                </div>
              </div>
            </div>
            <p
              style={{
                fontSize: 12,
                color: "var(--text3)",
                lineHeight: 1.5,
                maxWidth: 220,
                marginBottom: 12,
              }}
            >
              Your certification success is our mission.
            </p>

            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {[
                {
                  svg: (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
                        fill="currentColor"
                      />
                    </svg>
                  ),
                },
                {
                  svg: (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C0.792 0 0 0.774 0 1.729v20.542C0 23.227 0.792 24 1.771 24h20.451c0.979 0 1.771-0.773 1.771-1.729V1.729C24 0.774 23.208 0 22.225 0z"
                        fill="currentColor"
                      />
                    </svg>
                  ),
                },
                {
                  svg: (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
                        fill="currentColor"
                      />
                    </svg>
                  ),
                },
                {
                  svg: (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zM12 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"
                        fill="currentColor"
                      />
                    </svg>
                  ),
                },
              ].map((social, i) => (
                <a
                  key={i}
                  href="#"
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 10,
                    background: "var(--bg3)",
                    border: "1px solid var(--border)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.2s",
                    cursor: "pointer",
                    minWidth: 34,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "var(--gradient-accent)";
                    e.currentTarget.style.borderColor = "transparent";
                    e.currentTarget.style.transform = "translateY(-1px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "var(--bg3)";
                    e.currentTarget.style.borderColor = "var(--border)";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  {social.svg}
                </a>
              ))}
            </div>
          </div>

          {/* العمود الثاني: Product */}
          <div>
            <h4
              style={{
                fontSize: 10,
                fontWeight: 800,
                marginBottom: 10,
                color: "var(--text)",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              Product
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {productLinks.map(({ label, page }) => (
                <button
                  key={label}
                  onClick={() => setPage(page)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--text3)",
                    cursor: "pointer",
                    fontSize: 12,
                    textAlign: "left",
                    fontFamily: "inherit",
                    padding: "3px 0",
                    transition: "all 0.15s",
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    minHeight: 28,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "var(--accent)";
                    e.currentTarget.style.paddingLeft = "3px";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "var(--text3)";
                    e.currentTarget.style.paddingLeft = "0";
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* العمود الثالث: Company */}
          <div>
            <h4
              style={{
                fontSize: 10,
                fontWeight: 800,
                marginBottom: 10,
                color: "var(--text)",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              Company
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {companyLinks.map(({ label, page }) => (
                <button
                  key={label}
                  onClick={() => setPage(page)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--text3)",
                    cursor: "pointer",
                    fontSize: 12,
                    textAlign: "left",
                    fontFamily: "inherit",
                    padding: "3px 0",
                    transition: "all 0.15s",
                    minHeight: 28,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "var(--accent)";
                    e.currentTarget.style.paddingLeft = "3px";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "var(--text3)";
                    e.currentTarget.style.paddingLeft = "0";
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* العمود الرابع: Newsletter */}
          <div>
            <h4
              style={{
                fontSize: 10,
                fontWeight: 800,
                marginBottom: 10,
                color: "var(--text)",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              Stay in the Loop
            </h4>
            <p
              style={{
                fontSize: 11,
                color: "var(--text3)",
                marginBottom: 8,
                lineHeight: 1.4,
              }}
            >
              New exams, tips, and guides.
            </p>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <input
                type="email"
                placeholder="your@email.com"
                style={{
                  flex: 1,
                  padding: "7px 10px",
                  background: "var(--bg3)",
                  border: "1px solid var(--border)",
                  borderRadius: 10,
                  color: "var(--text)",
                  fontSize: 12,
                  outline: "none",
                  fontFamily: "inherit",
                  minWidth: 120,
                }}
              />
              <button
                style={{
                  padding: "7px 12px",
                  borderRadius: 10,
                  background: "var(--gradient-accent)",
                  border: "none",
                  color: "#fff",
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: 700,
                  fontFamily: "inherit",
                  whiteSpace: "nowrap",
                  minHeight: 36,
                }}
              >
                Subscribe
              </button>
            </div>
          </div>
        </div>

        {/* الشريط السفلي */}
        <div
          style={{
            borderTop: "1px solid var(--border)",
            paddingTop: 16,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 10,
          }}
        >
          <div style={{ fontSize: 10, color: "var(--text3)", textAlign: "center", flex: 1 }}>
            © {new Date().getFullYear()} FlexExams. All rights reserved.
          </div>
          <div
            style={{
              display: "flex",
              gap: 12,
              fontSize: 10,
              flexWrap: "wrap",
              justifyContent: "center",
            }}
          >
            {["Terms", "Privacy", "Cookies"].map((link) => (
              <a
                key={link}
                href="#"
                style={{
                  color: "var(--text3)",
                  textDecoration: "none",
                  transition: "color 0.2s",
                  padding: "2px 0",
                  minHeight: 28,
                  display: "inline-block",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--accent)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text3)")}
              >
                {link}
              </a>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          footer .grid {
            grid-template-columns: 1fr !important;
            gap: 20px !important;
          }
          footer button, footer a {
            min-height: 40px;
          }
          footer input {
            font-size: 16px !important;
          }
        }
      `}</style>
    </footer>
  );
}