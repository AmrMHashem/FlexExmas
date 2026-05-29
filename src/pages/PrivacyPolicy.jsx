// pages/PrivacyPolicy.jsx — FlexExams Privacy Policy
// Professional, compliant with GDPR/CCPA, fully responsive

import React, { useEffect } from "react";
import { Icon } from "../components/UI";

const Section = ({ title, icon, children, delay = 0 }) => (
  <div
    className="fade-up"
    style={{ animationDelay: `${delay}s` }}
  >
    <div style={{
      background: "var(--bg2)",
      border: "1.5px solid var(--border)",
      borderRadius: 20,
      padding: "28px 32px",
      marginBottom: 24,
      transition: "all 0.3s ease",
      boxShadow: "var(--card-shadow)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: "rgba(99,102,241,0.12)",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "var(--accent)",
        }}>
          {icon}
        </div>
        <h2 style={{ fontSize: "clamp(18px, 3vw, 24px)", fontWeight: 800, color: "var(--text)", margin: 0 }}>
          {title}
        </h2>
      </div>
      <div style={{ fontSize: "clamp(13px, 3vw, 15px)", color: "var(--text2)", lineHeight: 1.75 }}>
        {children}
      </div>
    </div>
  </div>
);

export default function PrivacyPolicy({ setPage }) {
  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const currentDate = new Date().toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric"
  });

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "48px clamp(20px, 4vw, 60px) 80px" }}>
      {/* Hero */}
      <div className="fade-up" style={{ marginBottom: 48, textAlign: "center" }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          background: "rgba(99,102,241,0.12)", border: "1.5px solid rgba(99,102,241,0.25)",
          borderRadius: 100, padding: "6px 18px", marginBottom: 20,
          fontSize: 12, fontWeight: 800, color: "var(--accent)",
          textTransform: "uppercase", letterSpacing: "0.1em",
        }}>
          <Icon n="lock" size={14} /> Your Privacy Matters
        </div>
        <h1 style={{
          fontSize: "clamp(28px, 5vw, 48px)", fontWeight: 900,
          color: "var(--text)", letterSpacing: "-1.5px", marginBottom: 16,
        }}>
          Privacy Policy
        </h1>
        <p style={{
          fontSize: "clamp(14px, 2vw, 16px)", color: "var(--text2)",
          maxWidth: 680, margin: "0 auto", lineHeight: 1.7,
        }}>
          Last updated: <strong>{currentDate}</strong><br />
          FlexExams is committed to protecting your personal data and respecting your privacy.
          This policy explains how we collect, use, and safeguard your information.
        </p>
      </div>

      {/* Sections */}
      <Section title="1. Information We Collect" icon={<Icon n="user" size={20} />} delay={0.05}>
        <p>We collect information to provide better services to all our users. The types of information we collect include:</p>
        <ul style={{ marginTop: 12, paddingLeft: 20 }}>
          <li><strong>Account Information</strong> – name, email address, profile picture (optional), and country when you register.</li>
          <li><strong>Usage Data</strong> – exam results, scores, time spent, favorite exams, and progress data.</li>
          <li><strong>Device & Technical Data</strong> – IP address, browser type, operating system, and device identifiers to improve performance and security.</li>
          <li><strong>Payment Information</strong> – processed securely by <strong>PayPal</strong> or <strong>Stripe</strong>. We never store full credit card details on our servers.</li>
          <li><strong>Cookies & Similar Technologies</strong> – see section 4 below.</li>
        </ul>
      </Section>

      <Section title="2. How We Use Your Information" icon={<Icon n="chart" size={20} />} delay={0.1}>
        <p>We use the information we collect to:</p>
        <ul style={{ marginTop: 12, paddingLeft: 20 }}>
          <li>Create and manage your account, track your learning progress, and provide certification results.</li>
          <li>Improve our platform, fix bugs, and develop new features based on aggregated usage patterns.</li>
          <li>Send service-related emails (e.g., password reset, payment confirmation, exam reminders) – you can opt out of promotional emails.</li>
          <li>Prevent fraud, abuse, and unauthorized access.</li>
          <li>Comply with legal obligations and enforce our terms.</li>
        </ul>
        <p className="mt-3" style={{ marginTop: 12 }}>
          We never sell your personal data to third parties. Any sharing is limited to essential service providers (e.g., payment processors, hosting) under strict confidentiality.
        </p>
      </Section>

      <Section title="3. Legal Basis for Processing (GDPR)" icon={<Icon n="shield" size={20} />} delay={0.15}>
        <p>If you are located in the European Economic Area (EEA), we process your personal data based on one or more of the following legal grounds:</p>
        <ul style={{ marginTop: 12, paddingLeft: 20 }}>
          <li><strong>Contract performance</strong> – to provide you with our services (e.g., exam tracking, certificates).</li>
          <li><strong>Legitimate interests</strong> – to improve our platform, prevent fraud, and conduct analytics.</li>
          <li><strong>Consent</strong> – for optional features like email marketing (you can withdraw anytime).</li>
          <li><strong>Legal compliance</strong> – to meet tax, anti-fraud, or other legal obligations.</li>
        </ul>
      </Section>

      <Section title="4. Cookies & Tracking Technologies" icon={<Icon n="cookie" size={20} />} delay={0.2}>
        <p>We use cookies and similar tracking technologies to enhance your experience on FlexExams. These include:</p>
        <ul style={{ marginTop: 12, paddingLeft: 20 }}>
          <li><strong>Essential cookies</strong> – required for authentication, saving exam progress, and secure payments.</li>
          <li><strong>Preference cookies</strong> – remember your theme (light/dark), language, and layout choices.</li>
          <li><strong>Analytics cookies</strong> – we use first-party analytics to understand aggregate usage (no personal identifiers).</li>
        </ul>
        <p style={{ marginTop: 12 }}>
          You can manage or disable cookies in your browser settings, but some features may not work properly.
        </p>
      </Section>

      <Section title="5. Data Security & Retention" icon={<Icon n="lock" size={20} />} delay={0.25}>
        <p>
          We implement industry-standard security measures, including <strong>encryption (HTTPS/TLS)</strong>, firewalls,
          and restricted access to personal data. Your exam answers and progress are stored securely in <strong>Firebase Firestore</strong>
          with strict rules.
        </p>
        <p style={{ marginTop: 12 }}>
          We retain your account information as long as your account is active. If you delete your account, we will remove
          your personal data within 30 days, except where we are required to keep certain data for legal, tax, or fraud prevention reasons.
          Anonymized aggregate data may be kept for analytics.
        </p>
      </Section>

      <Section title="6. Your Rights (GDPR / CCPA)" icon={<Icon n="check" size={20} />} delay={0.3}>
        <p>Depending on your location, you may have the following rights regarding your personal data:</p>
        <ul style={{ marginTop: 12, paddingLeft: 20 }}>
          <li><strong>Access</strong> – request a copy of your personal data.</li>
          <li><strong>Rectification</strong> – correct inaccurate or incomplete information.</li>
          <li><strong>Erasure (“right to be forgotten”)</strong> – request deletion of your data.</li>
          <li><strong>Restriction</strong> – limit how we process your data.</li>
          <li><strong>Data portability</strong> – receive your data in a machine-readable format.</li>
          <li><strong>Objection</strong> – object to processing based on legitimate interests (e.g., direct marketing).</li>
          <li><strong>Withdraw consent</strong> – anytime for consent-based processing.</li>
        </ul>
        <p style={{ marginTop: 12 }}>
          To exercise any of these rights, please contact us at <strong>info@flexexams.com</strong>. We will respond within 30 days.
        </p>
      </Section>

      <Section title="7. Third-Party Services" icon={<Icon n="share" size={20} />} delay={0.35}>
        <p>FlexExams uses trusted third-party providers to operate and improve our platform:</p>
        <ul style={{ marginTop: 12, paddingLeft: 20 }}>
          <li><strong>Firebase (Google)</strong> – authentication, database, storage, and hosting. Read <a href="https://firebase.google.com/support/privacy" target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent)" }}>Firebase Privacy Policy</a>.</li>
          <li><strong>PayPal & Stripe</strong> – payment processing. We never store your full card details.</li>
          <li><strong>i.ibb.co</strong> – image hosting for logos and certificates (optional).</li>
          <li><strong>Brevo (Sendinblue)</strong> – transactional emails (e.g., password reset, notifications).</li>
        </ul>
        <p className="mt-2" style={{ marginTop: 12 }}>
          These providers have their own privacy policies and data processing agreements. We carefully select vendors that are GDPR/CCPA compliant.
        </p>
      </Section>

      <Section title="8. Children’s Privacy" icon={<Icon n="user" size={20} />} delay={0.4}>
        <p>
          FlexExams is intended for professionals and adult learners. We do not knowingly collect personal information from
          children under 13 years of age (or under 16 in the EEA). If you believe a child has provided us with personal data,
          please contact us, and we will delete it promptly.
        </p>
      </Section>

      <Section title="9. International Data Transfers" icon={<Icon n="globe" size={20} />} delay={0.45}>
        <p>
          Your information may be transferred to and processed in countries other than your own, including the United States
          (where Firebase servers are located). We ensure appropriate safeguards, such as Standard Contractual Clauses (SCCs),
          are in place to protect your data in accordance with applicable laws.
        </p>
      </Section>

      <Section title="10. Changes to This Privacy Policy" icon={<Icon n="edit" size={20} />} delay={0.5}>
        <p>
          We may update this policy from time to time to reflect changes in our practices or legal requirements.
          The “Last updated” date at the top of this page indicates when the policy was last revised.
          We encourage you to review this page periodically. Continued use of FlexExams after changes constitutes acceptance
          of the updated policy.
        </p>
      </Section>

      <Section title="11. Contact Us" icon={<Icon n="mail" size={20} />} delay={0.55}>
        <p>
          If you have any questions, concerns, or requests regarding this Privacy Policy or your data, please contact us:
        </p>
        <div style={{
          marginTop: 16,
          padding: "16px 20px",
          background: "rgba(99,102,241,0.06)",
          border: "1px solid rgba(99,102,241,0.2)",
          borderRadius: 14,
        }}>
          <p><strong>📧 Email:</strong> <a href="mailto:info@flexexams.com" style={{ color: "var(--accent)" }}>info@flexexams.com</a></p>
          <p><strong>🌐 Website:</strong> <a href="https://www.flexexams.com" target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent)" }}>www.flexexams.com</a></p>
          <p><strong>📍 Address:</strong> FlexExams, Digital Campus, 123 Learning Ave, Wilmington, DE 19801, USA (for GDPR correspondence)</p>
        </div>
        <p style={{ marginTop: 16, fontSize: 13, color: "var(--text3)" }}>
          For data protection inquiries, you may also contact our Data Protection Officer (DPO) at <strong>dpo@flexexams.com</strong>.
        </p>
      </Section>

      {/* Bottom confirmation */}
      <div className="fade-up" style={{ textAlign: "center", marginTop: 32, color: "var(--text3)", fontSize: 12 }}>
        <hr style={{ borderColor: "var(--border)", marginBottom: 24 }} />
        <p>FlexExams — Practice smarter, pass with confidence. Your trust is our priority.</p>
      </div>
    </div>
  );
}