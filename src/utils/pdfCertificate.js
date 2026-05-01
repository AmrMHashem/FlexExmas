/**
 * pdfCertificate.js — FlexExams Certificate Engine v4
 *
 * ✅ الخلفية الأصلية مُحمَّلة مسبقاً وتُرسم على Canvas مباشرةً
 * ✅ fallback تلقائي لو فشل التحميل (تدرج كريمي + إطارات)
 * ✅ رسم مباشر على Canvas API — لا SVG، لا مشاكل خطوط، لا CORS
 * ✅ ظل نصي خفيف لوضوح القراءة فوق الخلفية
 * ✅ PDF بجودة 2x مباشر من Canvas
 * ✅ تصدير PNG إضافي
 */

import { jsPDF } from "jspdf";
import QRCode    from "qrcode";

// ─── ثوابت ───────────────────────────────────────────────────────
const CW      = 1056;
const CH      = 748;
const SCALE   = 2;
const BG_URL  = "https://i.ibb.co/1fhK9ZzX/s-l1600-copy.jpg";

// ─── cache للخلفية (تُحمَّل مرة واحدة طوال عمر الصفحة) ──────────
let _bgCache = null;

async function loadBackground() {
  if (_bgCache) return _bgCache;

  return new Promise((resolve) => {
    // محاولة أولى: مع CORS (تتيح التصدير)
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload  = () => { _bgCache = img; resolve(img); };
    img.onerror = () => {
      // محاولة ثانية: بدون CORS (معاينة فقط، تصدير قد يُفشل تaint-check)
      const img2 = new Image();
      img2.onload  = () => { _bgCache = img2; resolve(img2); };
      img2.onerror = () => resolve(null);
      img2.src = BG_URL;
    };
    img.src = BG_URL;
  });
}

// ─── دوال مساعدة ─────────────────────────────────────────────────

export function generateCertId() {
  const ts   = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `FX-${ts}-${rand}`;
}

export function getVerifyURL(certId) {
  const base = typeof window !== "undefined" ? window.location.origin : "https://flexexams.app";
  return `${base}/verify?id=${certId}`;
}

export function canDownloadCertificate(mode, passed) {
  return mode === "examSimulation" && passed === true;
}

export function getCertificateMessage(mode, passed) {
  if (mode === "examSimulation") {
    return passed
      ? "🎉 Congratulations! Your verified certificate is ready to download."
      : "You need to pass this exam to receive your certificate.";
  }
  if (mode === "fullPractice") return "Certificates are only available in Exam Simulation mode.";
  if (mode === "review")       return "Review Mode results don't qualify for certificates.";
  return "Certificate not available for this exam type.";
}

function getGradeInfo(s) {
  if (s >= 95) return { phrase: "with Distinction & Outstanding Performance", color: "#b8860b", badge: "OUTSTANDING" };
  if (s >= 85) return { phrase: "with High Merit & Excellence",               color: "#5048c8", badge: "TOP ACHIEVER" };
  if (s >= 75) return { phrase: "with Credit & Proficiency",                  color: "#0891b2", badge: "PROFICIENT"  };
  if (s >= 60) return { phrase: "with Satisfactory Achievement",              color: "#16a34a", badge: "QUALIFIED"   };
  return              { phrase: "achieving a passing score",                  color: "#16a34a", badge: "PASSED"      };
}

function wrapLines(ctx, text, maxWidth) {
  const words = text.split(" ");
  const lines = [];
  let line = "";
  for (const word of words) {
    const test = line ? line + " " + word : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function fadeGradient(ctx, y, h, colorStop) {
  const g = ctx.createLinearGradient(0, y, CW, y);
  g.addColorStop(0,    "rgba(0,0,0,0)");
  g.addColorStop(0.15, colorStop);
  g.addColorStop(0.5,  colorStop);
  g.addColorStop(0.85, colorStop);
  g.addColorStop(1,    "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, y, CW, h);
}

// ظل نصي أبيض للوضوح فوق أي خلفية
function textShadow(ctx, blur = 7) {
  ctx.shadowColor = "rgba(255,255,255,0.65)";
  ctx.shadowBlur  = blur;
}

async function makeQRImage(text, size = 110) {
  try {
    const dataURL = await QRCode.toDataURL(text, {
      width: size, margin: 1,
      color: { dark: "#0f172a", light: "#ffffff" },
      errorCorrectionLevel: "H",
    });
    return await new Promise((resolve) => {
      const img = new Image();
      img.onload  = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src     = dataURL;
    });
  } catch {
    return null;
  }
}

// ─── الدالة الرئيسية للرسم على Canvas ────────────────────────────
export async function drawCertificateOnCanvas(canvas, {
  examTitle, userName, score, date, certId,
}) {
  const s = parseFloat(score) || 0;
  const g = getGradeInfo(s);

  canvas.width  = CW * SCALE;
  canvas.height = CH * SCALE;

  const ctx = canvas.getContext("2d");
  ctx.scale(SCALE, SCALE);
  ctx.textAlign = "center";

  // ── 1. الخلفية ───────────────────────────────────────────────
  const bgImg = await loadBackground();

  if (bgImg) {
    ctx.drawImage(bgImg, 0, 0, CW, CH);
    // طبقة بيضاء شفافة خفيفة لتحسين قراءة النص
    ctx.fillStyle = "rgba(255,255,255,0.07)";
    ctx.fillRect(0, 0, CW, CH);
  } else {
    // fallback كريمي
    const grd = ctx.createLinearGradient(0, 0, CW, CH);
    grd.addColorStop(0, "#fdfaf2");
    grd.addColorStop(1, "#f5efe0");
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, CW, CH);
    ctx.strokeStyle = "#c9a03d"; ctx.lineWidth = 3;
    ctx.strokeRect(16, 16, CW - 32, CH - 32);
    ctx.setLineDash([6, 4]); ctx.lineWidth = 1;
    ctx.strokeRect(25, 25, CW - 50, CH - 50);
    ctx.setLineDash([]);
  }

  // ── 2. FlexExams header ───────────────────────────────────────
  ctx.font = "bold 11px 'Courier New', monospace";
  ctx.fillStyle = "#c9a03d";
  ctx.fillText("✦  F L E X E X A M S  ✦", CW / 2, 45);

// ── 5. الاسم (في المنتصف) ───────────────────────────────────

const shortName = userName?.length > 32
  ? userName.substring(0, 32) + "…"
  : (userName || "Valued Candidate");

ctx.font = "bold 52px Georgia, 'Times New Roman', serif";
ctx.fillStyle = "#1a2635";
textShadow(ctx, 12);
ctx.fillText(shortName, CW / 2 + 75, 330);
ctx.shadowBlur = 0;

const nameW = ctx.measureText(shortName).width;
// خط زخرفي سفلي متمركز مع الاسم
const lineY = 370;
ctx.strokeStyle = "rgba(201,160,61,0.65)";
ctx.lineWidth = 1;
ctx.beginPath();
ctx.moveTo(CW / 2 - nameW / 2 - 12, lineY);
ctx.lineTo(CW / 2 + nameW / 2 + 12, lineY);
ctx.stroke();

// ── 6. جملة الاجتياز (في المنتصف) ──────────────────────────
const competenceText = `has successfully completed all requirements and demonstrated exceptional competence ${g.phrase} in the`;
ctx.font = "500 15px Arial, Helvetica, sans-serif";
ctx.fillStyle = "rgba(30,42,55,0.92)";
textShadow(ctx, 5);

const compLines = wrapLines(ctx, competenceText, 720);
let compY = lineY + 22;
compLines.forEach(line => {
  ctx.fillText(line, CW / 2 + 75, compY);   // المنتصف بالضبط
  compY += 18;
});
ctx.shadowBlur = 0;

// ── 7. عنوان الاختبار (في المنتصف) ─────────────────────────
const shortTitle = examTitle?.length > 80
  ? examTitle.substring(0, 80) + "…"
  : (examTitle || "Professional Certification Exam");

ctx.font = "bold 20px Georgia, 'Times New Roman', serif";
ctx.fillStyle = "#1e3a6e";
textShadow(ctx, 8);

const titleY = compY + 6;
const tLines = wrapLines(ctx, shortTitle, 720);
tLines.forEach((line, i) => {
  ctx.fillText(line, CW / 2 + 75, titleY + i * 28);   // المنتصف بالضبط
});
ctx.shadowBlur = 0;

// ── 8. خط فاصل ─────────────────────────────────────────────
const yDiv = titleY + (tLines.length - 1) * 28 + 30;
ctx.strokeStyle = "rgba(201,160,61,0.45)";
ctx.lineWidth = 0.8;
ctx.beginPath();
ctx.moveTo(80, yDiv);
ctx.lineTo(CW - 80, yDiv);
ctx.stroke();

// ── 9. الدرجة بتصميم متمركز ومثالي ────────────────────────
const yInfo = yDiv + 55;   // مسافة مناسبة بعد الفاصل

// النسبة المئوية بحجم كبير ومتمركزة
ctx.font = "bold 52px Georgia, serif";
ctx.fillStyle = g.color;
textShadow(ctx, 8);
ctx.fillText(`${s.toFixed(1)}%`, CW / 2 + 75, yInfo);   // المنتصف بالضبط
ctx.shadowBlur = 0;

// نص FINAL SCORE أسفل النسبة مباشرة
ctx.font = "600 13px Arial, Helvetica, sans-serif";
ctx.fillStyle = "#1a2635";
ctx.fillText("FINAL SCORE", CW / 2 + 75, yInfo + 28);   // المنتصف بالضبط

  // ── 10. التذييل: تاريخ + معرف + QR ──────────────────────────
  const yFoot = yDiv + 122;
  ctx.strokeStyle = "rgba(201,160,61,0.38)"; ctx.lineWidth = 0.7;
  ctx.beginPath(); ctx.moveTo(80, yFoot); ctx.lineTo(CW - 80, yFoot); ctx.stroke();

  textShadow(ctx, 5);

  const displayDate = date || new Date().toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });

  ctx.font = "500 14px Arial"; ctx.fillStyle = "#1e2b3a";
  ctx.fillText(displayDate, 195, yFoot + 28);
  ctx.font = "bold 9px Arial"; ctx.fillStyle = "#7a6535";
  ctx.fillText("DATE  ISSUED", 195, yFoot + 44);

  ctx.font = "bold 13px 'Courier New', monospace"; ctx.fillStyle = "#1e3a6e";
  ctx.fillText(certId, CW / 2, yFoot + 28);
  ctx.font = "bold 9px Arial"; ctx.fillStyle = "#7a6535";
  ctx.fillText("CERTIFICATE  ID", CW / 2, yFoot + 44);

  ctx.shadowBlur = 0;

  // QR Code
  const qrImg = await makeQRImage(getVerifyURL(certId), 110);
  if (qrImg) {
    ctx.fillStyle = "rgba(255,255,255,0.92)";
    roundRect(ctx, CW - 168, yFoot + 2, 108, 108, 7); ctx.fill();
    ctx.strokeStyle = "#c9a03d"; ctx.lineWidth = 1.2;
    roundRect(ctx, CW - 168, yFoot + 2, 108, 108, 7); ctx.stroke();
    ctx.drawImage(qrImg, CW - 165, yFoot + 5, 102, 102);
  }
  ctx.font = "bold 8px Arial"; ctx.fillStyle = "#7a6535";
  textShadow(ctx, 4);
  ctx.fillText("SCAN  TO  VERIFY", CW - 114, yFoot + 122);
  ctx.shadowBlur = 0;

  // ── 11. شريط تذييل ────────────────────────────────────────────
  const yBot = CH - 22;
  fadeGradient(ctx, yBot - 1, 1.5, "rgba(201,160,61,0.8)");
  ctx.font = "bold 9px Arial"; ctx.fillStyle = "#b8860b";
  textShadow(ctx, 4);
  ctx.fillText("FLEXEXAMS  ·  GLOBAL  CERTIFICATION  AUTHORITY", CW / 2, yBot + 9);
  ctx.shadowBlur = 0;
}

// ─── تصدير PDF ────────────────────────────────────────────────────
export async function generatePDFCertificate(opts) {
  const { examTitle, userName, score, date, certId, examMode, passed, filename } = opts;

  if (examMode !== "examSimulation" || !passed) {
    console.warn("Certificate not allowed: mode or result mismatch.");
    return false;
  }

  try {
    const canvas = document.createElement("canvas");
    await drawCertificateOnCanvas(canvas, { examTitle, userName, score, date, certId });

    const imgData = canvas.toDataURL("image/png", 1.0);

    const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const W   = pdf.internal.pageSize.getWidth();
    const H   = pdf.internal.pageSize.getHeight();
    pdf.addImage(imgData, "PNG", 0, 0, W, H, undefined, "NONE");
    pdf.setProperties({
      title:    `FlexExams Certificate – ${userName}`,
      subject:  `${examTitle} – Score: ${score}%`,
      author:   "FlexExams Certification Authority",
      creator:  "FlexExams Platform v4",
      keywords: `certificate, ${certId}, flexexams`,
    });

    const safeName = (filename || "FlexExams_Certificate")
      .replace(/[^\w\u0600-\u06FF\-]/g, "_");
    pdf.save(`${safeName}_${certId}.pdf`);
    return true;
  } catch (err) {
    console.error("PDF generation error:", err);
    return false;
  }
}

// ─── تصدير PNG ────────────────────────────────────────────────────
export async function downloadCertificatePNG({ examTitle, userName, score, date, certId }) {
  try {
    const canvas = document.createElement("canvas");
    await drawCertificateOnCanvas(canvas, { examTitle, userName, score, date, certId });
    const a    = document.createElement("a");
    a.href     = canvas.toDataURL("image/png", 1.0);
    a.download = `FlexExams_Certificate_${certId}.png`;
    a.click();
    return true;
  } catch (err) {
    console.error("PNG export error:", err);
    return false;
  }
}

// ─── توافق مع الكود القديم (Certificate.jsx يستورد هذا الاسم) ────
// downloadCertificateSVG → يُصدِّر الآن PNG بجودة عالية بدلاً من SVG
export const downloadCertificateSVG = downloadCertificatePNG;