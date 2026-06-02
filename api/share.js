// api/share.js — v8 (clean, no loops, lightweight)

const FIREBASE_PROJECT_ID = 'exampro-1e4de';
const FIREBASE_API_KEY = 'AIzaSyCHbNx6tveBKqN3BwKzK8Ap23d8DHmUSGs';

const SOCIAL_BOTS = [
  'facebookexternalhit','facebot','linkedinbot','twitterbot',
  'whatsapp','telegrambot','slackbot','discordbot',
  'googlebot','bingbot','applebot','pinterest'
];

function isSocialBot(ua = '') {
  ua = ua.toLowerCase();
  return SOCIAL_BOTS.some(b => ua.includes(b));
}

function fv(f) {
  if (!f) return '';
  return f.stringValue ?? String(f.integerValue ?? f.doubleValue ?? '');
}

// slugify
function titleToSlug(title = '') {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

// safe fetch helper
async function safeFetch(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  const slug = req.query.slug;

  // ❌ no redirect loop anymore
  if (!slug) {
    return res.status(400).send('Missing slug');
  }

  const ua = req.headers['user-agent'] || '';
  const bot = isSocialBot(ua);

  const BASE = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents`;

  let exam = null;

  // ─────────────────────────────
  // 1) Direct document lookup (FAST)
  // ─────────────────────────────
  const doc = await safeFetch(
    `${BASE}/exams/${slug}?key=${FIREBASE_API_KEY}`
  );

  if (doc?.fields) {
    const f = doc.fields;
    exam = {
      title: fv(f.title) || fv(f.name) || 'Certification Exam',
      description: fv(f.description) || fv(f.subtitle) || '',
      image: fv(f.image) || fv(f.imageUrl) || fv(f.thumbnail) || ''
    };
  }

  // ─────────────────────────────
  // 2) fallback ONLY if needed (limited + safe)
  // ─────────────────────────────
  if (!exam) {
    const list = await safeFetch(
      `${BASE}/exams?key=${FIREBASE_API_KEY}&pageSize=50`
    );

    const docs = list?.documents || [];

    const matched = docs.find(d => {
      const t = fv(d.fields?.title) || fv(d.fields?.name) || '';
      return titleToSlug(t) === slug;
    });

    if (matched?.fields) {
      const f = matched.fields;
      exam = {
        title: fv(f.title) || fv(f.name) || 'Certification Exam',
        description: fv(f.description) || fv(f.subtitle) || '',
        image: fv(f.image) || fv(f.imageUrl) || fv(f.thumbnail) || ''
      };
    }
  }

  // ─────────────────────────────
  // safe defaults
  // ─────────────────────────────
  const title = exam?.title || 'Certification Exam Practice';
  const desc =
    (exam?.description ||
      `Practice ${title} with real exam-style questions on FlexExams.`)
      .slice(0, 180);

  const image =
    exam?.image || 'https://www.flexexams.com/og-image.png';

  const shareUrl = `https://www.flexexams.com/exam/${slug}`;
  const examUrl   = shareUrl;

  // ❌ IMPORTANT: no auto redirect (this caused loop)
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>

  <title>${title}</title>

  <meta name="description" content="${desc}"/>

  <meta property="og:type" content="website"/>
  <meta property="og:title" content="${title}"/>
  <meta property="og:description" content="${desc}"/>
  <meta property="og:image" content="${image}"/>
  <meta property="og:url" content="${shareUrl}"/>

  <meta name="twitter:card" content="summary_large_image"/>
  <meta name="twitter:title" content="${title}"/>
  <meta name="twitter:description" content="${desc}"/>
  <meta name="twitter:image" content="${image}"/>

  <link rel="canonical" href="${shareUrl}"/>

</head>

<body style="margin:0;font-family:Arial;text-align:center;background:#0d1223;color:#fff;padding:60px">

  <h1 style="color:#a5b4fc">${title}</h1>

  <p style="max-width:600px;margin:20px auto;color:#9bb6f0">
    ${desc}
  </p>

  <a href="${examUrl}"
     style="display:inline-block;margin-top:20px;padding:12px 24px;background:#4f46e5;color:#fff;border-radius:10px;text-decoration:none">
     Start Exam
  </a>

</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');

  // caching safe for SEO
  res.setHeader(
    'Cache-Control',
    'public, s-maxage=3600, stale-while-revalidate=86400'
  );

  return res.status(200).send(html);
}
