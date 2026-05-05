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

  const socials = [
{
  label: "YouTube",
  href: "https://www.youtube.com/@FlexExams",
  svg: (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22.5 7.5a3 3 0 0 0-2.1-2.1C18.6 5 12 5 12 5s-6.6 0-8.4.4A3 3 0 0 0 1.5 7.5 31 31 0 0 0 1 12a31 31 0 0 0 .5 4.5 3 3 0 0 0 2.1 2.1C5.4 19 12 19 12 19s6.6 0 8.4-.4a3 3 0 0 0 2.1-2.1A31 31 0 0 0 23 12a31 31 0 0 0-.5-4.5z"/>
      <polygon points="10,15 16,12 10,9" />
    </svg>
  ),
},
    {
      label: "Facebook",
      href: "https://facebook.com/FlexExams",
      svg: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      ),
    },
    {
      label: "LinkedIn",
      href: "https://linkedin.com/company/flexexams",
      svg: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451c.979 0 1.771-.773 1.771-1.729V1.729C24 .774 23.208 0 22.225 0z"/>
        </svg>
      ),
    },
    {
      label: "TikTok",
      href: "https://tiktok.com/@flexexams",
      svg: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.28 6.28 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.67a8.18 8.18 0 0 0 4.78 1.52V6.73a4.85 4.85 0 0 1-1.01-.04z"/>
        </svg>
      ),
    },
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
        {/* Grid columns */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: 24,
            marginBottom: 32,
          }}
        >
          {/* Column 1: Logo & info */}
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

            {/* Email */}
            <a
              href="mailto:info@flexexams.com"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 11,
                color: "var(--text3)",
                textDecoration: "none",
                marginBottom: 12,
                transition: "color 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--accent)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text3)")}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
              info@flexexams.com
            </a>

            {/* Social icons */}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {socials.map((social, i) => (
                <a
                  key={i}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={social.label}
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
                    color: "var(--text3)",
                    textDecoration: "none",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "var(--gradient-accent)";
                    e.currentTarget.style.borderColor = "transparent";
                    e.currentTarget.style.transform = "translateY(-1px)";
                    e.currentTarget.style.color = "#fff";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "var(--bg3)";
                    e.currentTarget.style.borderColor = "var(--border)";
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.color = "var(--text3)";
                  }}
                >
                  {social.svg}
                </a>
              ))}
            </div>
          </div>

          {/* Column 2: Product */}
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

          {/* Column 3: Company */}
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

          {/* Column 4: Newsletter */}
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

            {/* Connect with us section */}
            <div style={{ marginTop: 16 }}>
              <div style={{
                fontSize: 10,
                fontWeight: 800,
                color: "var(--text)",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                marginBottom: 8,
              }}>
                Connect With Us
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {[
                  { label: "youtube.com/@FlexExams", href: "https://www.youtube.com/@FlexExams" },
                  { label: "facebook.com/FlexExams", href: "https://facebook.com/FlexExams" },
                  { label: "linkedin.com/company/flexexams", href: "https://linkedin.com/company/flexexams" },
                  { label: "@flexexams (TikTok)", href: "https://tiktok.com/@flexexams" },
                ].map(({ label, href }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      fontSize: 10.5,
                      color: "var(--text3)",
                      textDecoration: "none",
                      transition: "color 0.15s",
                      padding: "2px 0",
                      display: "block",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "var(--accent)")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text3)")}
                  >
                    {label}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
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
