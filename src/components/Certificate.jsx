/**
 * Certificate.jsx — FlexExams Professional Certificate
 * نسخة منقحة وخالية من أخطاء التحليل (parsing errors)
 */

import React, { useMemo, useState, useEffect } from "react";
import {
  generateCertId,
  getVerifyURL,
  generatePDFCertificate,
  downloadCertificateSVG,
} from "../utils/pdfCertificate";
import { saveCertificate } from "../services/firestore";

export default function Certificate({ user, exam, score, date, mode, passed, userName: propUserName }) {
  const certId = useMemo(() => generateCertId(), []);
  const [downloading, setDownloading] = useState(false);
  const [dlType, setDlType] = useState(null);
  const [saved, setSaved] = useState(false);

  const userName = propUserName || user?.name || user?.displayName || user?.email?.split("@")[0] || "Valued Candidate";
  const examTitle = exam?.title || "Professional Certification Exam";
  const displayDate = date || new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const displayScore = score ?? 0;
  const examFilename = examTitle.replace(/[^a-zA-Z0-9]/g, "_");
  const verifyURL = getVerifyURL(certId);

  const shortName = userName.length > 32 ? userName.substring(0, 32) + "…" : userName;
  const shortTitle = examTitle.length > 80 ? examTitle.substring(0, 80) + "…" : examTitle;

  const getGradeInfo = (s) => {
    if (s >= 95) return { phrase: "with Distinction & Outstanding Performance", color: "#b8860b", badge: "OUTSTANDING" };
    if (s >= 85) return { phrase: "with High Merit & Excellence", color: "#5048c8", badge: "TOP ACHIEVER" };
    if (s >= 75) return { phrase: "with Credit & Proficiency", color: "#0891b2", badge: "PROFICIENT" };
    if (s >= 60) return { phrase: "with Satisfactory Achievement", color: "#16a34a", badge: "QUALIFIED" };
    return { phrase: "achieving a passing score", color: "#16a34a", badge: "PASSED" };
  };
  const grade = getGradeInfo(displayScore);

  useEffect(() => {
    if (!user?.uid || saved) return;
    const doSave = async () => {
      try {
        await saveCertificate({ certId, userId: user.uid, userName, examId: exam?.id || "", examTitle, score: displayScore, date: displayDate });
        setSaved(true);
      } catch (e) { console.warn("Certificate save failed:", e.message); }
    };
    doSave();
  }, [certId, user, saved]);

  const handleDownloadPDF = async () => {
    setDownloading(true); setDlType("pdf");
    try {
      await generatePDFCertificate({ examTitle, userName, score: displayScore, date: displayDate, certId, examMode: mode || "examSimulation", passed: passed !== false, filename: `ExamPro_Certificate_${examFilename}` });
    } catch (e) { console.error(e); }
    setDownloading(false); setDlType(null);
  };

  const handleDownloadSVG = async () => {
    setDownloading(true); setDlType("svg");
    try {
      await downloadCertificateSVG({ examTitle, userName, score: displayScore, date: displayDate, certId });
    } catch (e) { console.error(e); }
    setDownloading(false); setDlType(null);
  };

  // ✅ تم استبدال & بـ &amp; في رابط QR
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=110x110&amp;data=${encodeURIComponent(verifyURL)}&amp;color=0f172a&amp;bgcolor=ffffff&amp;qzone=1&amp;ecc=H`;
  
  const width = 1056;
  const height = 748;

  return (
    <div style={{ fontFamily: "inherit", textAlign: "center", width: "100%" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700;800&family=EB+Garamond:ital@0;1&family=Inter:wght@400;500;600;700;800&display=swap');
        @keyframes cert-fadein {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .certificate-container {
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 2rem 1rem;
          background: linear-gradient(135deg, #f5f3ef 0%, #e8e6e1 100%);
          min-height: 100vh;
          width: 100%;
        }
        .certificate-wrapper {
          overflow-x: auto;
          overflow-y: visible;
          display: flex;
          justify-content: center;
          border-radius: 20px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          transition: all 0.3s ease;
        }
        .certificate-wrapper:hover {
          box-shadow: 0 30px 60px -15px rgba(0, 0, 0, 0.35);
        }
        .cert-canvas {
          animation: cert-fadein 0.6s cubic-bezier(0.2, 0.9, 0.4, 1.1) both;
          display: inline-block;
          max-width: 100%;
          height: auto;
          background: white;
          border-radius: 16px;
        }
        .cert-btn-group {
          display: flex;
          gap: 1rem;
          justify-content: center;
          flex-wrap: wrap;
          margin-top: 2rem;
          margin-bottom: 1rem;
        }
        .cert-btn {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 12px 28px;
          border: none;
          border-radius: 60px;
          font-size: 0.95rem;
          font-weight: 600;
          font-family: 'Inter', sans-serif;
          cursor: pointer;
          transition: all 0.2s ease;
          background: white;
          color: #1e293b;
          box-shadow: 0 2px 6px rgba(0,0,0,0.05);
          border: 1px solid #e2e8f0;
        }
        .cert-btn-primary {
          background: linear-gradient(135deg, #1e293b, #0f172a);
          color: white;
          border: none;
          box-shadow: 0 8px 20px rgba(15, 23, 42, 0.3);
        }
        .cert-btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          background: linear-gradient(135deg, #334155, #1e293b);
        }
        .cert-btn-secondary {
          background: white;
          border: 1px solid #cbd5e1;
        }
        .cert-btn-secondary:hover:not(:disabled) {
          background: #f8fafc;
          transform: translateY(-2px);
        }
        .cert-btn:disabled { opacity: 0.7; cursor: wait; }
        .spinner {
          display: inline-block;
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255,255,255,0.3);
          border-radius: 50%;
          border-top-color: white;
          animation: spin 0.8s linear infinite;
        }
        .spinner-dark {
          border: 2px solid rgba(0,0,0,0.1);
          border-top-color: #1e293b;
        }
        .cert-verify-link {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          color: #16a34a;
          border-radius: 99px;
          padding: 8px 20px;
          font-size: 0.85rem;
          font-weight: 600;
          text-decoration: none;
          transition: all 0.2s;
        }
        .cert-verify-link:hover {
          background: #dcfce7;
          transform: translateY(-1px);
        }
      `}</style>

      <div className="certificate-container">
        <div className="certificate-wrapper">
          <div className="cert-canvas">
            <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} xmlns="http://www.w3.org/2000/svg" style={{ display: "block", borderRadius: "16px", maxWidth: "100%", height: "auto" }}>
              <defs>
                <pattern id="dots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                  <circle cx="10" cy="10" r="1.2" fill="#c9a03d" opacity="0.12" />
                </pattern>
                <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#b8860b" />
                  <stop offset="50%" stopColor="#eab308" />
                  <stop offset="100%" stopColor="#b8860b" />
                </linearGradient>
                <filter id="shadow" x="-5%" y="-5%" width="110%" height="110%">
                  <feDropShadow dx="2" dy="4" stdDeviation="5" floodColor="#000" floodOpacity="0.12" />
                </filter>
                <clipPath id="clip">
                  <rect width={width} height={height} rx="16" />
                </clipPath>
              </defs>

              <image href="https://i.ibb.co/1fhK9ZzX/s-l1600-copy.jpg" width={width} height={height} preserveAspectRatio="xMidYMid slice" clipPath="url(#clip)" />
              <rect width={width} height={height} fill="url(#dots)" clipPath="url(#clip)" />
              <rect width={width} height={height} fill="rgba(255,255,255,0.08)" clipPath="url(#clip)" />

              <rect x="16" y="16" width={width - 32} height={height - 32} fill="none" stroke="#c9a03d" strokeWidth="2.5" />
              <rect x="25" y="25" width={width - 50} height={height - 50} fill="none" stroke="#c9a03d" strokeWidth="1" strokeDasharray="6 4" />

              <text x={width / 2} y="54" textAnchor="middle" fontFamily="'Courier New', monospace" fontSize="13" fontWeight="bold" fill="#c9a03d" letterSpacing="5">✦  F L E X E X A M S  ✦</text>

              <text x={width / 2 + 75} y="270" textAnchor="middle" fontFamily="Georgia, 'Times New Roman', serif" fontSize="52" fontWeight="bold" fill="#1a2635" filter="url(#shadow)">{shortName}</text>
              <line x1={width / 2 - 70} y1="292" x2={width / 2 + 220} y2="292" stroke="rgba(201,160,61,0.65)" strokeWidth="1.2" />

              <text x={width / 2 + 75} y="330" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="15" fill="#1e2b3a" fontWeight="500">has successfully completed all requirements and demonstrated exceptional competence {grade.phrase} in the</text>

              <text x={width / 2 + 75} y="375" textAnchor="middle" fontFamily="Georgia, serif" fontSize="20" fontWeight="bold" fill="#1e3a6e">{shortTitle}</text>

              <line x1="80" y1="400" x2={width - 80} y2="400" stroke="rgba(201,160,61,0.45)" strokeWidth="1" />

              <text x={width / 2 + 75} y="460" textAnchor="middle" fontFamily="Georgia, serif" fontSize="54" fontWeight="bold" fill={grade.color}>{displayScore.toFixed(1)}%</text>
              <text x={width / 2 + 75} y="488" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="14" fontWeight="600" fill="#1a2635">FINAL SCORE</text>

              <line x1="80" y1="530" x2={width - 80} y2="530" stroke="rgba(201,160,61,0.38)" strokeWidth="1" />

              <text x="195" y="558" textAnchor="middle" fontFamily="Arial" fontSize="14" fill="#1e2b3a">{displayDate}</text>
              <text x="195" y="575" textAnchor="middle" fontFamily="Arial" fontSize="9" fill="#7a6535" fontWeight="bold">DATE ISSUED</text>

              <text x={width / 2} y="558" textAnchor="middle" fontFamily="'Courier New', monospace" fontSize="13" fontWeight="bold" fill="#1e3a6e">{certId}</text>
              <text x={width / 2} y="575" textAnchor="middle" fontFamily="Arial" fontSize="9" fill="#7a6535" fontWeight="bold">CERTIFICATE ID</text>

              <rect x={width - 168} y="530" width="108" height="108" rx="8" fill="white" stroke="#c9a03d" strokeWidth="1.2" />
              <image href={qrSrc} x={width - 165} y="533" width="102" height="102" />
              <text x={width - 114} y="650" textAnchor="middle" fontFamily="Arial" fontSize="8" fill="#7a6535" fontWeight="bold">SCAN TO VERIFY</text>

              <rect x="0" y={height - 22} width={width} height="2.5" fill="url(#goldGrad)" opacity="0.7" />
              <text x={width / 2} y={height - 8} textAnchor="middle" fontFamily="Arial" fontSize="9.5" fill="#b8860b" fontWeight="bold" letterSpacing="1">FLEXEXAMS  ·  GLOBAL  CERTIFICATION  AUTHORITY</text>
            </svg>
          </div>
        </div>
      </div>

      <div className="cert-btn-group">
        <button className="cert-btn cert-btn-primary" onClick={handleDownloadPDF} disabled={downloading}>
          {downloading && dlType === "pdf" ? <span className="spinner" /> : <>📄 Download PDF </>}
        </button>
        <button className="cert-btn cert-btn-secondary" onClick={handleDownloadSVG} disabled={downloading}>
          {downloading && dlType === "svg" ? <span className="spinner spinner-dark" /> : <>⬇️ Download SVG</>}
        </button>
      </div>

      <div>
        <a href={verifyURL} target="_blank" rel="noopener noreferrer" className="cert-verify-link">
          ✅ Verify this certificate· {certId}
        </a>
      </div>
    </div>
  );
}