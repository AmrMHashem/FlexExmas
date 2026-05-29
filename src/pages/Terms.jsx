// pages/Terms.jsx — FlexExams Terms of Service & Privacy Policy
import React, { useState } from "react";
import FloatingChat from "../components/FloatingChat";

const LAST_UPDATED = "January 1, 2026";
const CONTACT_EMAIL = "info@flexexams.com";
const WA_LINK = "https://wa.me/201111375050";

function Section({ title, icon, children }) {
  return (
    <div style={{
      background: "var(--bg2)",
      border: "1.5px solid var(--border)",
      borderRadius: 18,
      padding: "32px 36px",
      marginBottom: 20,
      transition: "border-color 0.2s",
    }}
      onMouseEnter={e => e.currentTarget.style.borderColor = "var(--accent)"}
      onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border)"}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 14,
          background: "var(--accent-soft)", border: "1px solid rgba(139,92,246,0.25)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 20, flexShrink: 0,
        }}>{icon}</div>
        <h2 style={{
          fontSize: "clamp(16px, 2vw, 20px)", fontWeight: 800,
          color: "var(--text)", fontFamily: "'Syne', sans-serif",
          margin: 0,
        }}>{title}</h2>
      </div>
      <div style={{ fontSize: 14, color: "var(--text2)", lineHeight: 1.85 }}>
        {children}
      </div>
    </div>
  );
}

function SubSection({ title, children }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 8, fontFamily: "'Syne', sans-serif" }}>
        {title}
      </h3>
      <div style={{ color: "var(--text2)", lineHeight: 1.8 }}>{children}</div>
    </div>
  );
}

function Bullet({ items }) {
  return (
    <ul style={{ margin: "10px 0 10px 4px", padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
      {items.map((item, i) => (
        <li key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
          <div style={{
            width: 18, height: 18, borderRadius: "50%",
            background: "var(--gradient-accent)", flexShrink: 0, marginTop: 2,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
          </div>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export default function Terms() {
  const [activeTab, setActiveTab] = useState("terms");

  const tabs = [
    { id: "terms", label: "Terms of Service", icon: "📋" },
    { id: "privacy", label: "Privacy Policy", icon: "🔐" },
    { id: "cookies", label: "Cookie Policy", icon: "🍪" },
  ];

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh" }}>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {/* Hero */}
      <div style={{
        background: "var(--bg2)", padding: "64px 24px 48px",
        textAlign: "center", position: "relative", overflow: "hidden",
        borderBottom: "1px solid var(--border)",
      }}>
        <div style={{
          position: "absolute", inset: 0, opacity: 0.03,
          backgroundImage: "linear-gradient(var(--text) 1px, transparent 1px), linear-gradient(90deg, var(--text) 1px, transparent 1px)",
          backgroundSize: "40px 40px", pointerEvents: "none",
        }} />
        <div style={{ position: "absolute", top: -60, left: "50%", transform: "translateX(-50%)", width: 500, height: 300, background: "radial-gradient(circle, var(--accent-glow) 0%, transparent 70%)", pointerEvents: "none", opacity: 0.3 }} />

        <div style={{ maxWidth: 700, margin: "0 auto", position: "relative" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "var(--accent-soft)", border: "1px solid rgba(139,92,246,0.3)",
            borderRadius: 99, padding: "6px 16px", marginBottom: 20,
            fontSize: 12, fontWeight: 700, color: "var(--accent)", letterSpacing: "0.06em",
            textTransform: "uppercase", animation: "fadeUp 0.4s both",
          }}>
            ⚖️ Legal & Privacy
          </div>
          <h1 style={{
            fontSize: "clamp(28px, 4vw, 50px)", fontWeight: 900, marginBottom: 16,
            color: "var(--text)", letterSpacing: "-1.5px",
            fontFamily: "'Syne', sans-serif", lineHeight: 1.1,
            animation: "fadeUp 0.4s 80ms both",
          }}>
            Terms, Privacy &<br />
            <span style={{ background: "var(--gradient-accent)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Your Rights
            </span>
          </h1>
          <p style={{
            fontSize: 15, color: "var(--text2)", lineHeight: 1.75,
            animation: "fadeUp 0.4s 160ms both",
          }}>
            We believe in full transparency about how FlexExams works, what data we collect,
            and how we protect your information. Please read these carefully.
          </p>
          <div style={{
            fontSize: 12, color: "var(--text3)", marginTop: 16,
            animation: "fadeUp 0.4s 200ms both",
          }}>
            Last updated: <strong style={{ color: "var(--text2)" }}>{LAST_UPDATED}</strong>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{
        position: "sticky", top: 70, zIndex: 100,
        background: "var(--bg)", borderBottom: "1px solid var(--border)",
        padding: "12px 24px",
      }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", gap: 8 }}>
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              style={{
                padding: "8px 20px", borderRadius: 10,
                border: "1.5px solid",
                borderColor: activeTab === t.id ? "transparent" : "var(--border)",
                background: activeTab === t.id ? "var(--gradient-accent)" : "var(--bg2)",
                color: activeTab === t.id ? "#fff" : "var(--text2)",
                cursor: "pointer", fontSize: 13, fontWeight: 700,
                fontFamily: "inherit", transition: "all 0.2s",
                display: "flex", alignItems: "center", gap: 6,
              }}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px 24px 80px" }}>

        {/* ── TERMS OF SERVICE ── */}
        {activeTab === "terms" && (
          <>
            <Section title="1. Acceptance of Terms" icon="✅">
              <p>By accessing or using FlexExams ("the Platform", "we", "us"), you agree to be bound by these Terms of Service. If you do not agree to these terms, you may not use the platform.</p>
              <p style={{ marginTop: 10 }}>These Terms apply to all users — guests, registered members, and administrators. We reserve the right to update these Terms at any time, with notice provided via the platform.</p>
            </Section>

            <Section title="2. Platform Description" icon="🎓">
              <p>FlexExams is an online certification exam preparation platform that provides:</p>
              <Bullet items={[
                "Practice exams based on real certification syllabi (AWS, CompTIA, Cisco, PMP, Microsoft, and others)",
                "Timed exam simulation with question randomization per attempt",
                "Domain-level performance analytics accessible from your Dashboard",
                "Verifiable digital certificates with unique IDs and QR codes for passing scores",
                "A leaderboard and points system for competitive learning",
                "Career Diagnostic tool for personalized certification recommendations",
                "Question reporting system for content quality assurance",
              ]} />
            </Section>

            <Section title="3. Account Registration & Guest Access" icon="👤">
              <SubSection title="3.1 Guest Access">
                <p>Guests can access the first 10% of any exam without registering. Guest scores are temporary and not saved to a profile. Certificates require a registered account.</p>
              </SubSection>
              <SubSection title="3.2 Account Requirements">
                <p>To create an account you must provide a valid email address. You are responsible for maintaining the security of your account credentials. Accounts may not be shared or transferred.</p>
              </SubSection>
              <SubSection title="3.3 Prohibited Accounts">
                <Bullet items={[
                  "Creating multiple accounts to abuse free trial access",
                  "Using false identity information during registration",
                  "Sharing account credentials with others",
                ]} />
              </SubSection>
            </Section>

            <Section title="4. Subscriptions & Payments" icon="💳">
              <SubSection title="4.1 Subscription Plans">
                <p>FlexExams offers monthly and yearly subscription plans. Yearly subscribers receive a complimentary premium exam as a bonus at no additional cost.</p>
              </SubSection>
              <SubSection title="4.2 Payment Methods">
                <p>We accept payments via:</p>
                <Bullet items={[
                  "Stripe — credit and debit cards (Visa, Mastercard, AMEX) worldwide",
                  "PayPal — linked PayPal accounts worldwide",
                  "Instapay — Egyptian bank transfer with manual admin approval",
                ]} />
              </SubSection>
              <SubSection title="4.3 Instapay Process">
                <p>Instapay payments require manual review. After transferring, submit your receipt through the platform. Admin reviews and approves within 24 hours. You will receive a notification once approved or if additional information is needed.</p>
              </SubSection>
              <SubSection title="4.4 Refund Policy">
                <p>Refund requests can be submitted via your Dashboard. Refunds are evaluated on a case-by-case basis by our admin team. Approved refunds are processed to the original payment method. Digital products (completed exam access) are generally non-refundable once accessed.</p>
              </SubSection>
              <SubSection title="4.5 Auto-Renewal">
                <p>Auto-renewal is disabled by default. You can enable it from your Dashboard subscription settings. You will receive a notification before any renewal charge.</p>
              </SubSection>
              <SubSection title="4.6 Cancellation">
                <p>Cancel any time from your Dashboard. Access continues until the end of the current billing period. No partial refunds for unused days on non-expired subscriptions.</p>
              </SubSection>
            </Section>

            <Section title="5. Exam Access & Content" icon="📝">
              <SubSection title="5.1 Question Bank">
                <p>All exam content is sourced from official certification syllabi and reviewed by certified subject-matter experts. Content is updated quarterly to reflect current exam versions.</p>
              </SubSection>
              <SubSection title="5.2 Exam Structure">
                <p>Exams with up to 60 questions are split into 2 equal parts. Exams with more than 60 questions are split into batches of maximum 40 questions each. Time limits are distributed proportionally across batches.</p>
              </SubSection>
              <SubSection title="5.3 Retakes">
                <p>Enrolled members may retake exams unlimited times. Each attempt randomizes question order for a fresh experience. All attempt scores are saved to your Dashboard history.</p>
              </SubSection>
              <SubSection title="5.4 Reporting Errors">
                <p>During any exam, use the flag icon to report inaccurate or outdated questions. Our team reviews all reports and notifies you via Dashboard notification upon resolution.</p>
              </SubSection>
            </Section>

            <Section title="6. Certificates" icon="🏆">
              <p>Certificates are issued upon passing an exam (achieving the minimum passing score defined per exam). Each certificate contains:</p>
              <Bullet items={[
                "A unique Certificate ID for verification",
                "Your registered name and the exam title",
                "Your final score and date of issuance",
                "A QR code linking to the verification page at flexexams.com/verify",
              ]} />
              <p style={{ marginTop: 12 }}>Certificates are saved to your Dashboard and can be downloaded as PDF or SVG. FlexExams certificates are proprietary credentials and do not replace vendor-issued certifications from AWS, Cisco, Microsoft, or other bodies.</p>
            </Section>

            <Section title="7. Referral System" icon="🔗">
              <p>Members can share a unique referral code. Both the referrer and the new subscriber earn rewards upon a successful paid subscription. Referral abuse (self-referrals, fake accounts) will result in account suspension and forfeiture of earned rewards.</p>
            </Section>

            <Section title="8. Prohibited Conduct" icon="🚫">
              <Bullet items={[
                "Reproducing, distributing, or selling exam questions outside the platform",
                "Using automated tools, bots, or scripts to access exams",
                "Attempting to reverse-engineer the platform or question database",
                "Submitting false or abusive contact messages to the admin team",
                "Creating fake accounts to exploit guest access or free trial limits",
                "Sharing subscription access with third parties",
                "Any action that disrupts other users' experience on the platform",
              ]} />
              <p style={{ marginTop: 12 }}>Violations may result in immediate account suspension without refund.</p>
            </Section>

            <Section title="9. Intellectual Property" icon="⚖️">
              <p>All content on FlexExams — including exam questions, platform design, branding, and software — is the intellectual property of FlexExams or its licensed partners. You may not copy, reproduce, or distribute any platform content without explicit written permission.</p>
              <p style={{ marginTop: 10 }}>Your account data, exam history, and certificates remain yours. We do not sell your personal data to third parties.</p>
            </Section>

            <Section title="10. Limitation of Liability" icon="⚠️">
              <p>FlexExams provides exam preparation materials for educational purposes. We do not guarantee that use of the platform will result in passing a vendor certification exam. All certifications are administered and awarded by their respective certification bodies (AWS, Cisco, CompTIA, PMI, etc.).</p>
              <p style={{ marginTop: 10 }}>To the maximum extent permitted by law, FlexExams is not liable for any indirect, incidental, or consequential damages arising from platform use.</p>
            </Section>

            <Section title="11. Governing Law" icon="🌍">
              <p>These Terms are governed by the laws of the Arab Republic of Egypt. Any disputes shall be resolved through amicable negotiation. For unresolved disputes, parties agree to Egyptian jurisdiction.</p>
            </Section>
          </>
        )}

        {/* ── PRIVACY POLICY ── */}
        {activeTab === "privacy" && (
          <>
            <Section title="1. Information We Collect" icon="📊">
              <SubSection title="1.1 Account Information">
                <Bullet items={[
                  "Email address (used for login, notifications, and support)",
                  "Display name (shown on leaderboard and certificates)",
                  "Profile photo (optional, from Google OAuth if used)",
                  "Role: student or admin (assigned upon registration)",
                ]} />
              </SubSection>
              <SubSection title="1.2 Exam & Performance Data">
                <Bullet items={[
                  "Exam attempt records: exam ID, score, pass/fail, time taken, date",
                  "Per-question response data (for analytics only, not shared externally)",
                  "Streak data and leaderboard points",
                  "Earned certificates including certificate IDs",
                ]} />
              </SubSection>
              <SubSection title="1.3 Payment Information">
                <p>We do not store full payment card details on our servers. Payments are processed through Stripe, PayPal, or Instapay. We store only transaction metadata: amount, currency, payment method type, transaction ID, and status.</p>
              </SubSection>
              <SubSection title="1.4 Usage Data">
                <Bullet items={[
                  "Pages visited and time spent on the platform",
                  "Device type and browser (for PWA optimization)",
                  "Contact messages submitted through the platform",
                  "Question reports you submit during exams",
                ]} />
              </SubSection>
            </Section>

            <Section title="2. How We Use Your Data" icon="🎯">
              <Bullet items={[
                "To authenticate your account and maintain your session securely",
                "To provide exam results, analytics, and certificate generation",
                "To send notifications about payment status, admin replies, and leaderboard activity",
                "To process and validate subscription payments",
                "To improve platform content and user experience",
                "To respond to contact messages and support requests",
                "To enforce our Terms of Service and prevent fraud",
              ]} />
            </Section>

            <Section title="3. Data Storage & Security" icon="🔒">
              <SubSection title="3.1 Storage Platform">
                <p>All user data is stored in Google Firebase (Firestore), a cloud database with enterprise-grade security hosted in secure Google data centers with industry-standard encryption at rest and in transit.</p>
              </SubSection>
              <SubSection title="3.2 Firestore Security Rules">
                <p>We use Firestore Security Rules to enforce access control. Users can only read and write their own data. Admin-only collections are restricted to verified admin accounts.</p>
              </SubSection>
              <SubSection title="3.3 Payment Security">
                <p>Payment processing is handled by Stripe and PayPal — both PCI-DSS Level 1 compliant providers. We never transmit or store raw card data.</p>
              </SubSection>
              <SubSection title="3.4 Data Retention">
                <p>We retain your account data for as long as your account is active. You may request account deletion at any time by contacting us at <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: "var(--accent)", textDecoration: "none", fontWeight: 600 }}>{CONTACT_EMAIL}</a>. Upon deletion, your personal data is removed within 30 days. Anonymized aggregate statistics may be retained for platform improvement.</p>
              </SubSection>
            </Section>

            <Section title="4. Data Sharing" icon="🤝">
              <p><strong style={{ color: "var(--text)" }}>We do not sell your personal data.</strong> We share data only in these limited circumstances:</p>
              <Bullet items={[
                "Payment processors (Stripe, PayPal) — transaction data required for payment processing",
                "Google Firebase — data storage and authentication (governed by Google's privacy policy)",
                "Legal compliance — if required by law, court order, or to protect platform integrity",
                "Leaderboard — your display name and rank are publicly visible on the leaderboard",
              ]} />
            </Section>

            <Section title="5. Your Rights" icon="⚖️">
              <SubSection title="5.1 Access & Export">
                <p>You can view all your exam history, scores, and certificates from your Dashboard at any time.</p>
              </SubSection>
              <SubSection title="5.2 Correction">
                <p>You can update your display name and account details from your profile settings.</p>
              </SubSection>
              <SubSection title="5.3 Deletion">
                <p>You can request full account deletion by contacting us. We process deletion requests within 30 days.</p>
              </SubSection>
              <SubSection title="5.4 Notifications">
                <p>You control notification preferences from your Dashboard. You can disable specific notification types at any time.</p>
              </SubSection>
              <SubSection title="5.5 Data Portability">
                <p>Contact us to request an export of your exam history and performance data in a structured format.</p>
              </SubSection>
            </Section>

            <Section title="6. Third-Party Services" icon="🌐">
              <p>FlexExams uses the following third-party services. Each has its own privacy policy:</p>
              <Bullet items={[
                "Google Firebase (Authentication & Firestore) — firebase.google.com/support/privacy",
                "Stripe (Payment Processing) — stripe.com/privacy",
                "PayPal (Payment Processing) — paypal.com/privacy",
                "QR Server (Certificate QR codes) — goqr.me — only exam title and certificate ID are sent",
              ]} />
            </Section>

            <Section title="7. Children's Privacy" icon="👶">
              <p>FlexExams is designed for professional and adult learners. We do not knowingly collect personal data from individuals under 16 years of age. If we become aware of such collection, we will promptly delete the data. If you believe a minor has created an account, please contact us immediately.</p>
            </Section>

            <Section title="8. International Users" icon="🌍">
              <p>FlexExams is based in Egypt and serves users globally. By using the platform, you consent to your data being processed and stored in accordance with these policies and applicable Egyptian law. For users in the European Union, we apply GDPR principles including data minimization, purpose limitation, and your right to erasure.</p>
            </Section>

            <Section title="9. Contact for Privacy Requests" icon="📬">
              <p>For any privacy-related requests, questions, or concerns:</p>
              <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
                <a href={`mailto:${CONTACT_EMAIL}`} style={{
                  display: "inline-flex", alignItems: "center", gap: 10,
                  background: "var(--bg3)", border: "1.5px solid var(--border)",
                  borderRadius: 12, padding: "12px 18px",
                  color: "var(--text)", textDecoration: "none", fontWeight: 600, fontSize: 14,
                }}>
                  📧 {CONTACT_EMAIL}
                </a>
                <a href={WA_LINK} target="_blank" rel="noopener noreferrer" style={{
                  display: "inline-flex", alignItems: "center", gap: 10,
                  background: "linear-gradient(135deg,#25D366,#128C7E)",
                  borderRadius: 12, padding: "12px 18px",
                  color: "#fff", textDecoration: "none", fontWeight: 600, fontSize: 14,
                  width: "fit-content",
                }}>
                  💬 WhatsApp: +20 111 137 5050
                </a>
              </div>
            </Section>
          </>
        )}

        {/* ── COOKIE POLICY ── */}
        {activeTab === "cookies" && (
          <>
            <Section title="What Are Cookies?" icon="🍪">
              <p>Cookies are small text files stored on your device by your browser when you visit a website. FlexExams uses browser storage mechanisms including cookies and localStorage to provide core functionality and improve your experience.</p>
            </Section>

            <Section title="How We Use Storage" icon="💾">
              <SubSection title="Essential / Functional Storage">
                <p>These are required for the platform to function correctly:</p>
                <Bullet items={[
                  "Firebase Authentication session token — keeps you logged in securely",
                  "Guest favorites (localStorage) — saves your favorited exams without an account",
                  "Quiz progress (localStorage) — saves your position and answers mid-exam so you can resume",
                  "Theme preference — dark/light mode selection",
                  "Welcome popup state (sessionStorage) — prevents repeated welcome popups per session",
                ]} />
              </SubSection>
              <SubSection title="Performance Storage">
                <Bullet items={[
                  "Exam timer state — preserves countdown timers if you switch tabs or return to an exam",
                  "Batch completion data — tracks which exam batches you have completed",
                ]} />
              </SubSection>
              <SubSection title="No Advertising Cookies">
                <p>FlexExams does not use advertising or tracking cookies. We do not integrate with ad networks, social media pixel trackers, or behavioral advertising systems. <strong style={{ color: "var(--text)" }}>Your browsing activity is not shared with advertisers.</strong></p>
              </SubSection>
            </Section>

            <Section title="Third-Party Scripts" icon="🔌">
              <Bullet items={[
                "Google Fonts — loads Syne and Outfit font families from Google servers",
                "Firebase SDK — authenticates your session and syncs your data with Firestore",
                "QR Server API — generates QR code images for certificates (certificate ID only, no personal data)",
              ]} />
            </Section>

            <Section title="Managing Your Storage" icon="⚙️">
              <p>You can clear browser cookies and localStorage at any time through your browser settings. Note that clearing these will:</p>
              <Bullet items={[
                "Log you out of your FlexExams account",
                "Remove saved guest exam progress",
                "Reset your theme and UI preferences",
              ]} />
              <p style={{ marginTop: 12 }}>Disabling all cookies may prevent some features from working correctly, including staying logged in.</p>
            </Section>

            <Section title="Updates to This Policy" icon="🔄">
              <p>We may update this Cookie Policy when we add new features or storage uses. Changes are noted with an updated "Last Updated" date at the top of the Legal & Privacy page. Continued use of FlexExams after changes constitutes acceptance of the updated policy.</p>
            </Section>
          </>
        )}

        {/* Contact CTA */}
        <div style={{
          background: "var(--bg2)", border: "1.5px solid var(--border)",
          borderRadius: 18, padding: "28px 32px",
          display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap",
          marginTop: 32,
        }}>
          <div style={{
            width: 52, height: 52, borderRadius: 16,
            background: "var(--gradient-accent)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 24, flexShrink: 0,
          }}>❓</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: "var(--text)", marginBottom: 5 }}>
              Questions about our policies?
            </div>
            <div style={{ fontSize: 13, color: "var(--text2)", lineHeight: 1.6 }}>
              Our team is happy to clarify anything. Reach us via email or WhatsApp.
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <a href={`mailto:${CONTACT_EMAIL}`} style={{
              padding: "10px 20px", borderRadius: 12,
              background: "var(--gradient-accent)", border: "none",
              color: "#fff", fontSize: 13, fontWeight: 700,
              cursor: "pointer", textDecoration: "none",
              display: "flex", alignItems: "center", gap: 6,
            }}>
              ✉️ Email Us
            </a>
            <a href={WA_LINK} target="_blank" rel="noopener noreferrer" style={{
              padding: "10px 20px", borderRadius: 12,
              background: "linear-gradient(135deg,#25D366,#128C7E)", border: "none",
              color: "#fff", fontSize: 13, fontWeight: 700,
              cursor: "pointer", textDecoration: "none",
              display: "flex", alignItems: "center", gap: 6,
            }}>
              💬 WhatsApp
            </a>
          </div>
        </div>
      </div>

      <FloatingChat />
    </div>
  );
}
