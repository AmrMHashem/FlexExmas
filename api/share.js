// api/share.js — FlexExams Social Share Handler v9
// ─────────────────────────────────────────────────────────────────────────────
// URL: /share/exam/:slug  (share links stay on /share/, exam page stays on /exam/)
//
// HUMANS → instant 302 to /exam/:slug  (zero HTML, zero flash, zero loop)
// BOTS   → static OG HTML             (no redirect, no JS)
//
// WHY /share/exam/:slug and NOT /exam/:slug:
//   If we intercept /exam/:slug in vercel.json and redirect humans to the same
//   URL, we get an infinite loop. Keeping share on its own path solves this
//   cleanly — vercel.json routes /share/exam/* to API, everything else to SPA.
//
// ✅ Zero redirect loop
// ✅ Zero MIME type errors (we never serve index.html from the API)
// ✅ Zero CSP conflicts
// ✅ Bots get full OG + structured data
// ✅ Humans get instant 302 — browser history is clean (replace, not push)
// ✅ Document GET → O(1) Firestore reads + runQuery fallback
// ✅ In-process LRU cache (10 min TTL, 500 slugs)
// ✅ Edge CDN cache for bot responses
// ✅ Retry + backoff on Firestore errors
// ✅ Full XSS + URL sanitization
// ✅ Minimal, safe security headers (no CSP that blocks React)
// ─────────────────────────────────────────────────────────────────────────────

const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'exampro-1e4de';
const API_KEY    = process.env.FIREBASE_API_KEY    || 'AIzaSyCHbNx6tveBKqN3BwKzK8Ap23d8DHmUSGs';
const BASE_URL   = 'https://www.flexexams.com';
const OG_IMAGE   = `${BASE_URL}/og-image.png`;
const SITE_NAME  = 'FlexExams';
const TWITTER_AT = '@FlexExams';
const FS_BASE    = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

// ── Memory Cache ──────────────────────────────────────────────────────────────
const CACHE_TTL = 10 * 60 * 1000; // 10 min
const CACHE_MAX = 500;
const _cache    = new Map();

function cacheGet(k) {
  const e = _cache.get(k);
  if (!e) return undefined;
  if (Date.now() - e.ts > CACHE_TTL) { _cache.delete(k); return undefined; }
  return e.v;
}
function cacheSet(k, v) {
  if (_cache.size >= CACHE_MAX) _cache.delete(_cache.keys().next().value);
  _cache.set(k, { v, ts: Date.now() });
}

// ── Bot Detection ─────────────────────────────────────────────────────────────
const BOTS = [
  'facebookexternalhit','facebot','facebook',
  'linkedinbot','twitterbot','whatsapp','telegrambot',
  'discordbot','slackbot','slack-imgproxy',
  'googlebot','google-structured-data-testing-tool','google-inspectiontool',
  'bingbot','msnbot','bingpreview','applebot',
  'pinterestbot','redditbot','vkshare','vkrobot',
  'semrushbot','ahrefsbot','mj12bot','dotbot','rogerbot',
  'yandexbot','duckduckbot','ia_archiver','archive.org_bot',
  'crawler','spider',
];
const isBot = (ua = '') => { const u = ua.toLowerCase(); return BOTS.some(s => u.includes(s)); };

// ── Sanitizers ────────────────────────────────────────────────────────────────
const ESC = { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#x27;' };
const esc = (s = '', n = 300) => String(s).slice(0, n).replace(/[&<>"']/g, c => ESC[c]);
const safeImg = (url = '') => {
  try { const u = new URL(url); return u.protocol === 'https:' ? u.toString() : ''; }
  catch { return ''; }
};

// ── Firestore ─────────────────────────────────────────────────────────────────
const fv = f => f ? String(f.stringValue ?? f.integerValue ?? f.doubleValue ?? '').trim() : '';

async function fetchExam(slug) {
  const hit = cacheGet(slug);
  if (hit !== undefined) return hit;

  let fields = null;

  // 1. Document GET (slug = doc ID) — O(1), cheapest
  for (let i = 0; i < 2; i++) {
    try {
      const r = await fetch(
        `${FS_BASE}/exams/${encodeURIComponent(slug)}?key=${API_KEY}`,
        { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(3000) }
      );
      if (r.status === 404) break;
      if (!r.ok) throw new Error(`GET ${r.status}`);
      fields = (await r.json()).fields ?? null;
      break;
    } catch (e) {
      if (i === 0) await new Promise(r => setTimeout(r, 200));
      else console.error('[share] GET failed:', e.message);
    }
  }

  // 2. runQuery fallback (slug stored as field)
  if (!fields) {
    for (let i = 0; i < 2; i++) {
      try {
        const r = await fetch(`${FS_BASE}:runQuery?key=${API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ structuredQuery: {
            from: [{ collectionId: 'exams' }],
            where: { fieldFilter: { field: { fieldPath: 'slug' }, op: 'EQUAL', value: { stringValue: slug } } },
            limit: 1,
          }}),
          signal: AbortSignal.timeout(3000),
        });
        if (!r.ok) throw new Error(`Query ${r.status}`);
        fields = (await r.json())?.[0]?.document?.fields ?? null;
        break;
      } catch (e) {
        if (i === 0) await new Promise(r => setTimeout(r, 200));
        else console.error('[share] Query failed:', e.message);
      }
    }
  }

  if (!fields) { cacheSet(slug, null); return null; }

  const exam = {
    title:       esc(fv(fields.title) || fv(fields.name) || fv(fields.examName), 120),
    description: esc(fv(fields.description) || fv(fields.shortDescription), 200),
    image:       safeImg(fv(fields.image) || fv(fields.imageUrl) || fv(fields.thumbnail) || fv(fields.coverImage)) || OG_IMAGE,
  };
  cacheSet(slug, exam);
  return exam;
}

// ── OG HTML (bots only) ───────────────────────────────────────────────────────
function botHtml({ title, desc, image, examUrl, shareUrl }) {
  const ld = JSON.stringify({ '@context':'https://schema.org', '@graph': [
    { '@type':'WebSite', '@id':`${BASE_URL}/#website`, name:SITE_NAME, url:BASE_URL },
    { '@type':'Organization', '@id':`${BASE_URL}/#organization`, name:SITE_NAME, url:BASE_URL,
      logo:{ '@type':'ImageObject', url:`${BASE_URL}/logo.png` } },
    { '@type':'EducationalOccupationalCredential', '@id':`${examUrl}#credential`,
      name:title, description:desc, url:examUrl, credentialCategory:'certification',
      recognizedBy:{ '@type':'Organization', '@id':`${BASE_URL}/#organization` },
      image:{ '@type':'ImageObject', url:image, width:1200, height:630 } },
    { '@type':'BreadcrumbList', itemListElement:[
      { '@type':'ListItem', position:1, name:'Home',  item:BASE_URL },
      { '@type':'ListItem', position:2, name:'Exams', item:`${BASE_URL}/exams` },
      { '@type':'ListItem', position:3, name:title,   item:examUrl },
    ]},
  ]});

  return `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${title} | ${SITE_NAME}</title>
<meta name="description"              content="${desc}"/>
<meta name="robots"                   content="noindex,nofollow"/>
<link rel="canonical"                 href="${examUrl}"/>
<meta property="og:type"              content="website"/>
<meta property="og:site_name"         content="${SITE_NAME}"/>
<meta property="og:title"             content="${title}"/>
<meta property="og:description"       content="${desc}"/>
<meta property="og:url"               content="${shareUrl}"/>
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
<script type="application/ld+json">${ld}</script>
</head>
<body style="margin:0;font-family:system-ui,sans-serif;background:#080e1e;color:#e8edff;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;padding:40px 20px;text-align:center">
<img src="${image}" alt="${title}" width="600" height="315" style="max-width:100%;border-radius:12px;margin-bottom:24px" loading="eager"/>
<h1 style="font-size:1.6rem;margin:0 0 12px;color:#a5b4fc">${title}</h1>
<p style="max-width:480px;color:#7b93c8;line-height:1.6;margin:0 0 28px">${desc}</p>
<a href="${examUrl}" style="padding:13px 32px;border-radius:10px;background:#6366f1;color:#fff;text-decoration:none;font-size:15px;font-weight:600">Start Practice →</a>
</body></html>`;
}

// ── Main Handler ──────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  const raw  = (req.query.slug || '').trim();
  const slug = raw.toLowerCase();

  if (!slug || !/^[a-z0-9][a-z0-9_-]{0,79}$/i.test(slug)) {
    return res.redirect(302, BASE_URL);
  }

  const examUrl  = `${BASE_URL}/exam/${slug}`;
  const shareUrl = `${BASE_URL}/share/exam/${slug}`;
  const ua       = req.headers['user-agent'] || '';
  const bot      = isBot(ua);

  // Minimal safe headers — NO CSP that would break React or Google Fonts
  res.setHeader('X-Content-Type-Options',  'nosniff');
  res.setHeader('X-Frame-Options',         'SAMEORIGIN');
  res.setHeader('Referrer-Policy',         'strict-origin-when-cross-origin');
  res.setHeader('X-Robots-Tag',            'noindex, nofollow');

  // ── Debug ──────────────────────────────────────────────────────────────────
  if (req.query.debug === '1') {
    let rawFields = null;
    try {
      const r  = await fetch(`${FS_BASE}/exams/${encodeURIComponent(slug)}?key=${API_KEY}`, { signal: AbortSignal.timeout(3000) });
      rawFields = (await r.json()).fields ?? null;
    } catch {}
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json({ slug, isBot: bot, ua, examUrl, shareUrl,
      cacheHit: cacheGet(slug) !== undefined, examFound: !!rawFields,
      fieldKeys: rawFields ? Object.keys(rawFields) : [],
      rawSample: rawFields ? JSON.stringify(rawFields).slice(0, 1500) : null });
  }

  // ── HUMAN → instant 302 to /exam/:slug ────────────────────────────────────
  // /exam/:slug is handled by React (via SPA fallback in vercel.json),
  // NOT by this API — so there is zero loop risk.
  if (!bot) {
    res.setHeader('Cache-Control', 'no-store');
    return res.redirect(302, examUrl);
  }

  // ── BOT → OG HTML ─────────────────────────────────────────────────────────
  let exam = null;
  try { exam = await fetchExam(slug); }
  catch (e) { console.error('[share] fetchExam:', e.message); }

  const title = exam?.title || 'Certification Exam Practice';
  const desc  = exam?.description || `Practice real ${title} questions on ${SITE_NAME}. Timed tests, instant feedback, and detailed explanations.`;
  const image = exam?.image || OG_IMAGE;

  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
  res.setHeader('Vary', 'User-Agent');
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  return res.status(200).send(botHtml({ title, desc, image, examUrl, shareUrl }));
}
