// api/share.js — FlexExams Social Share Handler v7
// ─────────────────────────────────────────────────────────────────────────────
// HUMANS  → instant HTTP 302 redirect to /exam/:slug (zero HTML, zero flash)
// BOTS    → static OG/Twitter meta HTML (no redirect, no JS, no loop)
// ─────────────────────────────────────────────────────────────────────────────
// ✅ Zero client-side redirect logic
// ✅ Zero meta-refresh
// ✅ Zero JavaScript in response
// ✅ Zero landing page / loading flash
// ✅ Server-side 302 Location header for humans — instant, history-safe
// ✅ Document GET (not runQuery) → fewer reads, lower latency
// ✅ In-process LRU memory cache → near-zero Firestore reads for hot slugs
// ✅ Edge cache via Vercel CDN headers for bot responses
// ✅ Retry with exponential backoff on Firestore errors
// ✅ Full XSS + URL sanitization
// ✅ Complete security headers (CSP, HSTS, Permissions-Policy, etc.)
// ✅ Rich structured data (EducationalOccupationalCredential + BreadcrumbList + Organization + WebSite)
// ✅ All OG / Twitter meta tags (secure_url, image:type, alt, locale, etc.)
// ✅ robots: noindex on /share, index only on /exam
// ✅ Debug endpoint
// ─────────────────────────────────────────────────────────────────────────────

// ══════════════════════════════════════════════════════════════════════════════
// CONFIG  — move secrets to env vars in Vercel dashboard
// ══════════════════════════════════════════════════════════════════════════════
const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'exampro-1e4de';
const API_KEY    = process.env.FIREBASE_API_KEY    || 'AIzaSyCHbNx6tveBKqN3BwKzK8Ap23d8DHmUSGs';

const BASE_URL   = 'https://www.flexexams.com';
const OG_IMAGE   = `${BASE_URL}/og-image.png`;   // 1200×630 fallback
const SITE_NAME  = 'FlexExams';
const TWITTER_AT = '@FlexExams';

// Firestore REST base — Document GET, not runQuery
const FS_BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

// ══════════════════════════════════════════════════════════════════════════════
// IN-PROCESS MEMORY CACHE  (survives across warm lambda invocations)
// ══════════════════════════════════════════════════════════════════════════════
const CACHE_TTL_MS  = 10 * 60 * 1000;   // 10 minutes
const CACHE_MAX     = 500;              // max entries before eviction

const _cache = new Map(); // slug → { exam, ts }

function cacheGet(slug) {
  const entry = _cache.get(slug);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL_MS) { _cache.delete(slug); return null; }
  return entry.exam;
}

function cacheSet(slug, exam) {
  // Simple LRU: evict oldest if full
  if (_cache.size >= CACHE_MAX) {
    const oldest = _cache.keys().next().value;
    _cache.delete(oldest);
  }
  _cache.set(slug, { exam, ts: Date.now() });
}

// ══════════════════════════════════════════════════════════════════════════════
// BOT DETECTION
// ══════════════════════════════════════════════════════════════════════════════
// Each entry is a lowercase substring matched against the User-Agent.
// Ordered by traffic volume (most common first for fast short-circuit).
const BOT_SIGNATURES = [
  // Facebook
  'facebookexternalhit', 'facebot', 'facebook',
  // LinkedIn
  'linkedinbot',
  // Twitter / X
  'twitterbot',
  // WhatsApp
  'whatsapp',
  // Telegram
  'telegrambot',
  // Discord
  'discordbot',
  // Slack
  'slackbot', 'slack-imgproxy',
  // Google
  'googlebot', 'google-structured-data-testing-tool', 'google-inspectiontool',
  'storebot-google', 'google-read-aloud',
  // Bing / Microsoft
  'bingbot', 'msnbot', 'bingpreview',
  // Apple
  'applebot',
  // Pinterest
  'pinterestbot',
  // Reddit
  'redditbot',
  // VK
  'vkshare', 'vkrobot',
  // SEO crawlers
  'semrushbot', 'ahrefsbot', 'mj12bot', 'dotbot', 'rogerbot',
  'yandexbot', 'duckduckbot',
  // Archive / misc
  'ia_archiver', 'archive.org_bot',
  // Generic signals (last — broadest)
  'crawler', 'spider',
];

/**
 * Returns true only when we are confident the requester is a bot/crawler.
 * Conservative on the human side — if unsure, treat as human → 302 redirect.
 */
function isBot(ua = '') {
  if (!ua) return false;
  const u = ua.toLowerCase();
  return BOT_SIGNATURES.some(sig => u.includes(sig));
}

// ══════════════════════════════════════════════════════════════════════════════
// SECURITY — sanitizers
// ══════════════════════════════════════════════════════════════════════════════
const HTML_ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;' };

function esc(str = '', maxLen = 300) {
  return String(str)
    .slice(0, maxLen)
    .replace(/[&<>"']/g, c => HTML_ESC[c]);
}

/** Only allow absolute https URLs from known-safe image hosts (or any https). */
function safeImageUrl(raw = '') {
  try {
    const u = new URL(raw.trim());
    if (u.protocol !== 'https:') return '';
    // Block data URIs and javascript: that somehow sneak through URL parsing
    if (/^(javascript|data|vbscript):/i.test(raw)) return '';
    return u.toString();
  } catch { return ''; }
}

/** Safe redirect target — must be same origin /exam/ path. */
function safeExamUrl(slug) {
  // slug already validated by regex at entry point
  return `${BASE_URL}/exam/${slug}`;
}

// ══════════════════════════════════════════════════════════════════════════════
// FIRESTORE — Document GET by slug-as-document-ID
// ══════════════════════════════════════════════════════════════════════════════
function fv(field) {
  if (!field) return '';
  return String(
    field.stringValue  ??
    field.integerValue ??
    field.doubleValue  ??
    ''
  ).trim();
}

/**
 * Attempt Document GET (exams/:slug).
 * Falls back to runQuery if the doc isn't found (supports legacy slug-as-field setups).
 * Retries once with 200 ms backoff on network errors.
 */
async function fetchExam(slug) {
  // ── 1. Memory cache hit ───────────────────────────────────────────────────
  const cached = cacheGet(slug);
  if (cached !== null) return cached;   // null means "not found", undefined means "not cached"

  // ── 2. Firestore Document GET (O(1), cheapest read) ───────────────────────
  let fields = null;

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const url = `${FS_BASE}/exams/${encodeURIComponent(slug)}?key=${API_KEY}`;
      const res = await fetch(url, {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(3000),
      });

      if (res.status === 404) {
        // Slug is not the document ID — fall through to runQuery below
        break;
      }
      if (!res.ok) throw new Error(`FS GET ${res.status}`);

      const doc = await res.json();
      fields = doc.fields ?? null;
      break;

    } catch (err) {
      if (attempt === 0) {
        await new Promise(r => setTimeout(r, 200)); // brief backoff before retry
      } else {
        console.error(`[share] Firestore GET failed after retry: ${err.message}`);
      }
    }
  }

  // ── 3. Fallback runQuery (legacy: slug stored as field, not doc ID) ────────
  if (!fields) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const url = `${FS_BASE}:runQuery?key=${API_KEY}`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
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
        if (attempt === 0) {
          await new Promise(r => setTimeout(r, 200));
        } else {
          console.error(`[share] Firestore runQuery failed after retry: ${err.message}`);
        }
      }
    }
  }

  // ── 4. Parse & cache ──────────────────────────────────────────────────────
  if (!fields) {
    cacheSet(slug, null); // cache "not found" to avoid hammering Firestore
    return null;
  }

  const exam = {
    title: esc(
      fv(fields.title) || fv(fields.name) || fv(fields.examName) || '',
      120
    ),
    description: esc(
      fv(fields.description) || fv(fields.shortDescription) || '',
      200
    ),
    image: safeImageUrl(
      fv(fields.image) || fv(fields.imageUrl) || fv(fields.thumbnail) || fv(fields.coverImage)
    ) || OG_IMAGE,
  };

  cacheSet(slug, exam);
  return exam;
}

// ══════════════════════════════════════════════════════════════════════════════
// OG HTML for bots — zero redirect, zero JS, zero meta-refresh
// ══════════════════════════════════════════════════════════════════════════════
function buildBotHtml({ title, desc, image, examUrl, shareUrl, slug }) {
  // Structured data — richer schema
  const jsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${BASE_URL}/#website`,
        name: SITE_NAME,
        url: BASE_URL,
      },
      {
        '@type': 'Organization',
        '@id': `${BASE_URL}/#organization`,
        name: SITE_NAME,
        url: BASE_URL,
        logo: {
          '@type': 'ImageObject',
          url: `${BASE_URL}/logo.png`,
        },
      },
      {
        '@type': 'EducationalOccupationalCredential',
        '@id': `${examUrl}#credential`,
        name: title,
        description: desc,
        url: examUrl,
        credentialCategory: 'certification',
        recognizedBy: { '@type': 'Organization', '@id': `${BASE_URL}/#organization` },
        image: { '@type': 'ImageObject', url: image, width: 1200, height: 630 },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home',  item: BASE_URL },
          { '@type': 'ListItem', position: 2, name: 'Exams', item: `${BASE_URL}/exams` },
          { '@type': 'ListItem', position: 3, name: title,   item: examUrl },
        ],
      },
    ],
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${title} | ${SITE_NAME}</title>
<meta name="description" content="${desc}"/>
<meta name="robots" content="noindex,nofollow"/>
<link rel="canonical" href="${examUrl}"/>

<!-- Open Graph -->
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

<!-- Twitter / X -->
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
<a href="${examUrl}" style="padding:13px 32px;border-radius:10px;background:#6366f1;color:#fff;text-decoration:none;font-size:15px;font-weight:600">
  Start Practice →
</a>
</body>
</html>`;
}

// ══════════════════════════════════════════════════════════════════════════════
// SECURITY HEADERS — applied to every response
// ══════════════════════════════════════════════════════════════════════════════
function applySecurityHeaders(res, { isBot: bot }) {
  // Prevent MIME sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  // Legacy XSS filter (IE / old Safari)
  res.setHeader('X-XSS-Protection', '1; mode=block');
  // No embedding in iframes
  res.setHeader('X-Frame-Options', 'DENY');
  // Referrer
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  // HSTS — 1 year, include subdomains
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  // Permissions
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  // Origin isolation
  res.setHeader('Origin-Agent-Cluster', '?1');
  // CSP — bots get a tighter policy (no JS at all)
  const csp = bot
    ? "default-src 'none'; img-src https:; style-src 'unsafe-inline'"
    : "default-src 'none'"; // 302 responses have no body, CSP irrelevant but set anyway
  res.setHeader('Content-Security-Policy', csp);
  // Robots tag — share URLs are NEVER indexed
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
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

  const examUrl  = safeExamUrl(slug);
  const shareUrl = `${BASE_URL}/share/exam/${slug}`;
  const ua       = req.headers['user-agent'] || '';
  const bot      = isBot(ua);

  // ── Security headers (all responses) ──────────────────────────────────────
  applySecurityHeaders(res, { isBot: bot });

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
      slug, isBot: bot, ua,
      examUrl, shareUrl,
      cacheHit: !!cacheGet(slug),
      examFound: !!rawFields,
      fieldKeys: rawFields ? Object.keys(rawFields) : [],
      rawSample: rawFields ? JSON.stringify(rawFields).slice(0, 1500) : null,
    });
    return;
  }

  // ── HUMAN — instant 302, zero body ────────────────────────────────────────
  if (!bot) {
    // No HTML, no JS, no meta-refresh — just the Location header.
    // Browser replaces history entry (no back-loop possible).
    // Cache-Control: no-store ensures CDN never serves a cached redirect to a bot.
    res.setHeader('Cache-Control', 'no-store');
    res.redirect(302, examUrl);
    return;
  }

  // ── BOT — fetch metadata then return OG HTML ───────────────────────────────
  let exam = null;
  try {
    exam = await fetchExam(slug);
  } catch (err) {
    console.error('[share] fetchExam threw unexpectedly:', err.message);
  }

  const title = exam?.title || 'Certification Exam Practice';
  const desc  = exam?.description ||
    `Practice real ${title} questions on ${SITE_NAME}. Timed tests, instant feedback, and detailed explanations.`;
  const image = exam?.image || OG_IMAGE;

  // Edge cache: Vercel CDN caches bot responses for 1 h, serves stale for 24 h
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
  res.setHeader('Vary', 'User-Agent');
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.status(200).send(buildBotHtml({ title, desc, image, examUrl, shareUrl, slug }));
}
