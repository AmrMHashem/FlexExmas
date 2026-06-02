// api/share.js — FlexExams Social Share Handler v8
// ─────────────────────────────────────────────────────────────────────────────
// URL pattern: /exam/:slug  (same URL for both the share link and the exam page)
//
// HUMANS → serve index.html directly (React Router handles /exam/:slug normally)
// BOTS   → serve OG/Twitter meta HTML (static, no redirect, no JS, no loop)
//
// ✅ Zero redirect loop — humans get index.html, NOT a redirect to /exam/
// ✅ Zero flash / landing page
// ✅ Bots get full OG tags, structured data, canonical, robots:noindex
// ✅ Document GET (not runQuery) → O(1) Firestore reads
// ✅ In-process LRU memory cache
// ✅ Edge cache for bot responses via Vercel CDN
// ✅ Retry + backoff on Firestore errors
// ✅ Full XSS + URL sanitization
// ✅ Complete security headers
// ─────────────────────────────────────────────────────────────────────────────

// ══════════════════════════════════════════════════════════════════════════════
// CONFIG
// ══════════════════════════════════════════════════════════════════════════════
const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'exampro-1e4de';
const API_KEY    = process.env.FIREBASE_API_KEY    || 'AIzaSyCHbNx6tveBKqN3BwKzK8Ap23d8DHmUSGs';

const BASE_URL   = 'https://www.flexexams.com';
const OG_IMAGE   = `${BASE_URL}/og-image.png`;
const SITE_NAME  = 'FlexExams';
const TWITTER_AT = '@FlexExams';

const FS_BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

// ══════════════════════════════════════════════════════════════════════════════
// IN-PROCESS MEMORY CACHE
// ══════════════════════════════════════════════════════════════════════════════
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 min
const CACHE_MAX    = 500;

const _cache = new Map();

function cacheGet(slug) {
  const entry = _cache.get(slug);
  if (!entry) return undefined;
  if (Date.now() - entry.ts > CACHE_TTL_MS) { _cache.delete(slug); return undefined; }
  return entry.exam; // may be null (= "not found")
}

function cacheSet(slug, exam) {
  if (_cache.size >= CACHE_MAX) _cache.delete(_cache.keys().next().value);
  _cache.set(slug, { exam, ts: Date.now() });
}

// ══════════════════════════════════════════════════════════════════════════════
// BOT DETECTION
// ══════════════════════════════════════════════════════════════════════════════
const BOT_SIGNATURES = [
  'facebookexternalhit','facebot','facebook',
  'linkedinbot',
  'twitterbot',
  'whatsapp',
  'telegrambot',
  'discordbot',
  'slackbot','slack-imgproxy',
  'googlebot','google-structured-data-testing-tool','google-inspectiontool',
  'bingbot','msnbot','bingpreview',
  'applebot',
  'pinterestbot',
  'redditbot',
  'vkshare','vkrobot',
  'semrushbot','ahrefsbot','mj12bot','dotbot','rogerbot',
  'yandexbot','duckduckbot',
  'ia_archiver','archive.org_bot',
  'crawler','spider',
];

function isBot(ua = '') {
  if (!ua) return false;
  const u = ua.toLowerCase();
  return BOT_SIGNATURES.some(sig => u.includes(sig));
}

// ══════════════════════════════════════════════════════════════════════════════
// SANITIZERS
// ══════════════════════════════════════════════════════════════════════════════
const HTML_ESC = { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#x27;' };

function esc(str = '', maxLen = 300) {
  return String(str).slice(0, maxLen).replace(/[&<>"']/g, c => HTML_ESC[c]);
}

function safeImageUrl(raw = '') {
  try {
    const u = new URL(raw.trim());
    if (u.protocol !== 'https:') return '';
    if (/^(javascript|data|vbscript):/i.test(raw)) return '';
    return u.toString();
  } catch { return ''; }
}

function safeExamUrl(slug) {
  return `${BASE_URL}/exam/${slug}`;
}

// ══════════════════════════════════════════════════════════════════════════════
// FIRESTORE — Document GET with runQuery fallback
// ══════════════════════════════════════════════════════════════════════════════
function fv(field) {
  if (!field) return '';
  return String(field.stringValue ?? field.integerValue ?? field.doubleValue ?? '').trim();
}

async function fetchExam(slug) {
  const cached = cacheGet(slug);
  if (cached !== undefined) return cached;

  let fields = null;

  // 1. Document GET (slug = doc ID)
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const url = `${FS_BASE}/exams/${encodeURIComponent(slug)}?key=${API_KEY}`;
      const res = await fetch(url, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(3000) });
      if (res.status === 404) break;
      if (!res.ok) throw new Error(`FS GET ${res.status}`);
      const doc = await res.json();
      fields = doc.fields ?? null;
      break;
    } catch (err) {
      if (attempt === 0) await new Promise(r => setTimeout(r, 200));
      else console.error(`[share] GET retry failed: ${err.message}`);
    }
  }

  // 2. runQuery fallback (slug = field value)
  if (!fields) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const res = await fetch(`${FS_BASE}:runQuery?key=${API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({
            structuredQuery: {
              from: [{ collectionId: 'exams' }],
              where: { fieldFilter: { field: { fieldPath: 'slug' }, op: 'EQUAL', value: { stringValue: slug } } },
              limit: 1,
            },
          }),
          signal: AbortSignal.timeout(3000),
        });
        if (!res.ok) throw new Error(`FS Query ${res.status}`);
        const data = await res.json();
        fields = data?.[0]?.document?.fields ?? null;
        break;
      } catch (err) {
        if (attempt === 0) await new Promise(r => setTimeout(r, 200));
        else console.error(`[share] Query retry failed: ${err.message}`);
      }
    }
  }

  if (!fields) { cacheSet(slug, null); return null; }

  const exam = {
    title:       esc(fv(fields.title) || fv(fields.name) || fv(fields.examName), 120),
    description: esc(fv(fields.description) || fv(fields.shortDescription), 200),
    image:       safeImageUrl(fv(fields.image) || fv(fields.imageUrl) || fv(fields.thumbnail) || fv(fields.coverImage)) || OG_IMAGE,
  };
  cacheSet(slug, exam);
  return exam;
}

// ══════════════════════════════════════════════════════════════════════════════
// OG HTML — for bots only
// ══════════════════════════════════════════════════════════════════════════════
function buildBotHtml({ title, desc, image, examUrl }) {
  const jsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'WebSite', '@id': `${BASE_URL}/#website`, name: SITE_NAME, url: BASE_URL },
      { '@type': 'Organization', '@id': `${BASE_URL}/#organization`, name: SITE_NAME, url: BASE_URL,
        logo: { '@type': 'ImageObject', url: `${BASE_URL}/logo.png` } },
      { '@type': 'EducationalOccupationalCredential', '@id': `${examUrl}#credential`,
        name: title, description: desc, url: examUrl, credentialCategory: 'certification',
        recognizedBy: { '@type': 'Organization', '@id': `${BASE_URL}/#organization` },
        image: { '@type': 'ImageObject', url: image, width: 1200, height: 630 } },
      { '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home',  item: BASE_URL },
        { '@type': 'ListItem', position: 2, name: 'Exams', item: `${BASE_URL}/exams` },
        { '@type': 'ListItem', position: 3, name: title,   item: examUrl },
      ]},
    ],
  });

  // canonical = examUrl (the real exam page — NOT a /share/ URL)
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${title} | ${SITE_NAME}</title>
<meta name="description" content="${desc}"/>
<meta name="robots" content="noindex,nofollow"/>
<link rel="canonical" href="${examUrl}"/>
<meta property="og:type"              content="website"/>
<meta property="og:site_name"         content="${SITE_NAME}"/>
<meta property="og:title"             content="${title}"/>
<meta property="og:description"       content="${desc}"/>
<meta property="og:url"               content="${examUrl}"/>
<meta property="og:locale"            content="en_US"/>
<meta property="og:image"             content="${image}"/>
<meta property="og:image:secure_url"  content="${image}"/>
<meta property="og:image:type"        content="image/png"/>
<meta property="og:image:width"       content="1200"/>
<meta property="og:image:height"      content="630"/>
<meta property="og:image:alt"         content="${title} — ${SITE_NAME}"/>
<meta name="twitter:card"             content="summary_large_image"/>
<meta name="twitter:site"             content="${TWITTER_AT}"/>
<meta name="twitter:creator"          content="${TWITTER_AT}"/>
<meta name="twitter:title"            content="${title}"/>
<meta name="twitter:description"      content="${desc}"/>
<meta name="twitter:image"            content="${image}"/>
<meta name="twitter:image:alt"        content="${title} — ${SITE_NAME}"/>
<script type="application/ld+json">${jsonLd}</script>
</head>
<body style="margin:0;font-family:system-ui,sans-serif;background:#080e1e;color:#e8edff;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;padding:40px 20px;text-align:center">
<img src="${image}" alt="${title}" width="600" height="315" style="max-width:100%;border-radius:12px;margin-bottom:24px" loading="eager"/>
<h1 style="font-size:1.6rem;margin:0 0 12px;color:#a5b4fc">${title}</h1>
<p style="max-width:480px;color:#7b93c8;line-height:1.6;margin:0 0 28px">${desc}</p>
<a href="${examUrl}" style="padding:13px 32px;border-radius:10px;background:#6366f1;color:#fff;text-decoration:none;font-size:15px;font-weight:600">Start Practice →</a>
</body>
</html>`;
}

// ══════════════════════════════════════════════════════════════════════════════
// SECURITY HEADERS
// ══════════════════════════════════════════════════════════════════════════════
function applySecurityHeaders(res, { bot }) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('Origin-Agent-Cluster', '?1');
  res.setHeader('Content-Security-Policy',
    bot ? "default-src 'none'; img-src https:; style-src 'unsafe-inline'"
        : "default-src 'none'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src * data:; connect-src *; font-src *"
  );
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
}

// ══════════════════════════════════════════════════════════════════════════════
// INDEX.HTML READER — serves the React SPA for human visitors
// ══════════════════════════════════════════════════════════════════════════════
let _indexHtmlCache = null; // module-level cache — read once per cold start

async function serveIndexHtml(res) {
  if (!_indexHtmlCache) {
    const { readFileSync, existsSync } = await import('fs');
    const { join }                     = await import('path');
    const candidates = [
      join(process.cwd(), 'dist', 'index.html'),
      join(process.cwd(), 'public', 'index.html'),
      join(process.cwd(), 'index.html'),
      '/var/task/dist/index.html',
      '/var/task/public/index.html',
      '/var/task/index.html',
    ];
    for (const p of candidates) {
      if (existsSync(p)) { _indexHtmlCache = readFileSync(p, 'utf8'); break; }
    }
  }

  if (_indexHtmlCache) {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(200).send(_indexHtmlCache);
  } else {
    // index.html not found on filesystem — shouldn't happen on Vercel
    // Safe fallback: minimal shell that loads the React bundle
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(200).send(`<!DOCTYPE html><html><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>FlexExams</title></head><body><div id="root"></div><script type="module" src="/src/main.jsx"></script></body></html>`);
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN HANDLER
// ══════════════════════════════════════════════════════════════════════════════
export default async function handler(req, res) {

  // ── Slug validation ────────────────────────────────────────────────────────
  const raw  = (req.query.slug || '').trim();
  const slug = raw.toLowerCase();

  if (!slug || !/^[a-z0-9][a-z0-9_-]{0,79}$/i.test(slug)) {
    res.redirect(302, BASE_URL);
    return;
  }

  const examUrl = safeExamUrl(slug);
  const ua      = req.headers['user-agent'] || '';
  const bot     = isBot(ua);

  applySecurityHeaders(res, { bot });

  // ── Debug mode ─────────────────────────────────────────────────────────────
  if (req.query.debug === '1') {
    let rawFields = null;
    try {
      const url = `${FS_BASE}/exams/${encodeURIComponent(slug)}?key=${API_KEY}`;
      const r   = await fetch(url, { signal: AbortSignal.timeout(3000) });
      const doc = await r.json();
      rawFields  = doc.fields ?? null;
    } catch {}
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json({
      slug, isBot: bot, ua, examUrl,
      cacheHit: cacheGet(slug) !== undefined,
      examFound: !!rawFields,
      fieldKeys: rawFields ? Object.keys(rawFields) : [],
      rawSample: rawFields ? JSON.stringify(rawFields).slice(0, 1500) : null,
    });
    return;
  }

  // ── HUMAN → serve index.html (React Router handles /exam/:slug) ────────────
  // We MUST NOT redirect humans to /exam/:slug — that would loop back here.
  // Instead we serve index.html directly; React loads and renders ExamDetail.
  if (!bot) {
    await serveIndexHtml(res);
    return;
  }

  // ── BOT → fetch OG metadata, return static HTML ───────────────────────────
  let exam = null;
  try { exam = await fetchExam(slug); }
  catch (err) { console.error('[share] fetchExam error:', err.message); }

  const title = exam?.title || 'Certification Exam Practice';
  const desc  = exam?.description ||
    `Practice real ${title} questions on ${SITE_NAME}. Timed tests, instant feedback, and detailed explanations.`;
  const image = exam?.image || OG_IMAGE;

  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
  res.setHeader('Vary', 'User-Agent');
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.status(200).send(buildBotHtml({ title, desc, image, examUrl }));
}
