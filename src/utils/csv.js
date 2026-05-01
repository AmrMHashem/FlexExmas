// utils/csv.js - CSV parsing utilities

export const SAMPLE_CSV = `Question,Question Type,Answer Option 1,Explanation 1,Answer Option 2,Explanation 2,Answer Option 3,Explanation 3,Answer Option 4,Explanation 4,Answer Option 5,Explanation 5,Answer Option 6,Explanation 6,Correct Answers,Overall Explanation,Domain
"Which AWS service provides managed relational databases?","multiple-choice","Amazon DynamoDB","DynamoDB is a NoSQL database, not relational.","Amazon RDS","Correct! RDS manages relational DBs like MySQL and PostgreSQL.","Amazon S3","S3 is object storage, not a database.","Amazon EC2","EC2 is a compute service, not a database.","","","","","2","Amazon RDS (Relational Database Service) provides managed relational databases including MySQL, PostgreSQL, Oracle, and SQL Server.","Database"
"What does S3 stand for in Amazon S3?","multiple-choice","Simple Storage Solution","","Simple Scalable Storage","","Simple Storage Service","Correct! S3 = Simple Storage Service.","Secure Storage Service","","","","","","3","Amazon S3 stands for Simple Storage Service.","Storage"
"Which AWS services can be used for compute? (Select all that apply)","multi-select","Amazon EC2","Correct! EC2 is a compute service.","AWS Lambda","Correct! Lambda is serverless compute.","Amazon S3","","Amazon RDS","","AWS Elastic Beanstalk","Correct! Elastic Beanstalk is compute.","","","1,2,5","Multiple AWS services provide compute capabilities.","Compute"`;

/**
 * Parse full CSV text into array of raw field arrays (rows).
 * Handles: quoted fields with embedded newlines/commas, escaped quotes (""),
 * BOM prefix, CRLF and LF line endings.
 */
function parseCSVToRows(text) {
  // Strip BOM if present
  const src = text.replace(/^\uFEFF/, '');

  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  let i = 0;

  while (i < src.length) {
    const ch = src[i];
    const next = src[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        // escaped quote inside quoted field
        field += '"';
        i += 2;
      } else if (ch === '"') {
        // end of quoted field
        inQuotes = false;
        i++;
      } else {
        // any character (including \n) inside quotes is part of the field
        field += ch;
        i++;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
        i++;
      } else if (ch === ',') {
        row.push(field.trim());
        field = '';
        i++;
      } else if (ch === '\r' && next === '\n') {
        // CRLF line ending
        row.push(field.trim());
        if (row.some(f => f !== '')) rows.push(row);
        row = [];
        field = '';
        i += 2;
      } else if (ch === '\n' || ch === '\r') {
        // LF or CR line ending
        row.push(field.trim());
        if (row.some(f => f !== '')) rows.push(row);
        row = [];
        field = '';
        i++;
      } else {
        field += ch;
        i++;
      }
    }
  }

  // Last field/row
  if (field.trim() || row.length > 0) {
    row.push(field.trim());
    if (row.some(f => f !== '')) rows.push(row);
  }

  return rows;
}

/**
 * Parse CSV text into array of objects keyed by header row
 */
export function parseCSV(text) {
  const rows = parseCSVToRows(text);
  if (rows.length < 2) return [];

  const headers = rows[0];
  const result = [];

  for (let i = 1; i < rows.length; i++) {
    const values = rows[i];
    const row = {};
    headers.forEach((header, idx) => {
      // Strip BOM from header just in case
      const key = header.replace(/^\uFEFF/, '').trim();
      row[key] = values[idx] != null ? values[idx] : '';
    });
    result.push(row);
  }

  return result;
}

/**
 * Convert CSV row to question object.
 * Returns null (with a reason string) for invalid rows so the UI can show why.
 */
export function rowToQuestion(row, index) {
  const label = `Row ${index + 2}`; // +2: 1-based + header row

  const rawText          = row['Question'];
  const questionType     = row['Question Type'];
  const opt1  = row['Answer Option 1'];
  const exp1  = row['Explanation 1'];
  const opt2  = row['Answer Option 2'];
  const exp2  = row['Explanation 2'];
  const opt3  = row['Answer Option 3'];
  const exp3  = row['Explanation 3'];
  const opt4  = row['Answer Option 4'];
  const exp4  = row['Explanation 4'];
  const opt5  = row['Answer Option 5'];
  const exp5  = row['Explanation 5'];
  const opt6  = row['Answer Option 6'];
  const exp6  = row['Explanation 6'];
  const correctRaw    = row['Correct Answers'];
  const explanation   = row['Overall Explanation'];
  const domain        = row['Domain'];

  // ── 1. Question text ───────────────────────────────────────────────
  if (rawText == null || String(rawText).trim() === '') {
    return { error: `${label}: السؤال فارغ — تم تخطيه` };
  }

  // Clean: remove leading "NEW QUESTION X" prefix and stray newlines
  const text = String(rawText)
    .replace(/^NEW\s+QUESTION\s+\d+[\r\n\s]*/i, '')
    .replace(/^[\r\n]+/, '')
    .trim();

  if (text.length < 2) {
    return { error: `${label}: نص السؤال قصير جداً بعد التنظيف — تم تخطيه` };
  }

  // ── 2. Question type ───────────────────────────────────────────────
  const typeStr = String(questionType || 'multiple-choice').toLowerCase().trim();
  const qType = ['multiple-choice', 'multi-select'].includes(typeStr)
    ? typeStr
    : 'multiple-choice';

  // ── 3. Options ─────────────────────────────────────────────────────
  const options = [];
  const pairs = [
    [opt1, exp1], [opt2, exp2], [opt3, exp3],
    [opt4, exp4], [opt5, exp5], [opt6, exp6],
  ];
  pairs.forEach(([optText, exp], i) => {
    const t = optText != null ? String(optText).trim() : '';
    if (t) {
      options.push({
        id: String(i + 1),
        text: t,
        explanation: exp != null ? String(exp).trim() : '',
      });
    }
  });

  if (options.length < 1) {
    return { error: `${label}: "${text.slice(0, 60)}..." — لا توجد إجابات — تم تخطيه` };
  }

  // ── 4. Correct answers ─────────────────────────────────────────────
  // Works whether correctRaw is a number (e.g. 4) or string (e.g. "1,2,5")
  const correct = [];
  if (correctRaw != null && String(correctRaw).trim() !== '') {
    String(correctRaw).split(',').forEach(p => {
      const n = parseInt(p.trim(), 10);
      if (!isNaN(n) && n > 0 && n <= options.length && !correct.includes(String(n))) {
        correct.push(String(n));
      }
    });
  }

  if (correct.length === 0) {
    return { error: `${label}: "${text.slice(0, 60)}..." — الإجابة الصحيحة غير محددة (القيمة: "${correctRaw}") — تم تخطيه` };
  }

  // ── 5. Coerce multi-select with 1 answer → multiple-choice ─────────
  const finalType = (qType === 'multi-select' && correct.length === 1)
    ? 'multiple-choice'
    : qType;

  return {
    text,
    type: finalType,
    options,
    correct,
    explanation: explanation != null ? String(explanation).trim() : '',
    domain: domain != null && String(domain).trim() ? String(domain).trim() : 'Other',
    order: index,
  };
}