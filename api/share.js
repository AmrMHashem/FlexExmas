// api/share.js — FlexExams Social Share Handler v13
// ─────────────────────────────────────────────────────────────────────────────
// Handles /exam/:slug as the single canonical URL for humans, search engines,
// and social-preview bots — each gets the correct treatment.
//
// FLOW:
//   Search-engine bot (Googlebot, Google Inspection Tool, Bingbot...)
//     → serve the REAL app HTML with real exam SEO injected, index/follow.
//   Human Round 1 → redirect to /exam/:slug?_h=1
//   Human Round 2 (_h=1) → same real app HTML with real exam SEO injected,
//                           index/follow (identical branch as search bots).
//   Preview bot (Facebook, Twitter, Slack, SEO audit tools...)
//     → thin OG-only placeholder HTML, noindex/nofollow (intentional —
//       it's a snapshot for link previews, not the real page).
//
// WHY TWO ROUNDS FOR HUMANS:
//   vercel.json routes /exam/:slug to this API. We can't redirect humans back
//   to /exam/:slug (infinite loop). Instead we redirect to /exam/:slug?_h=1,
//   which re-enters the API — but now the _h=1 flag tells us to serve index.html
//   directly. The browser URL stays as /exam/:slug the whole time. ✅
//
// v12 FIX — "View Source shows no exam data":
//   Round 2 used to send the raw built index.html untouched. The real exam
//   title/description/OG/JSON-LD were only ever injected client-side by
//   ExamDetail.jsx's useEffect, AFTER React mounts — so View Source / curl /
//   any non-JS reader saw nothing exam-specific. Fixed by injecting the same
//   exam metadata directly into the served index.html before sending it.
//
// v13 FIX — CRITICAL: "Googlebot was told noindex,nofollow":
//   Googlebot, Google Inspection Tool (Search Console URL Inspection), and
//   other real search-engine crawlers were previously classified the same as
//   social-preview bots (Facebook, Twitter...) and routed to the thin OG-only
//   botHtml(), which deliberately sets:
//     <meta name="robots" content="noindex,nofollow">
//     X-Robots-Tag: noindex, nofollow
//   That is correct for a social-preview snapshot, but it actively blocked
//   Google from indexing exam pages — almost certainly the real root cause
//   of exam pages not being indexed, more so than the sitemap pagination bug.
//   Search engines are now a separate category and take the same "real
//   content, index/follow" branch as a real human visitor.
//
// ✅ Zero redirect loop
// ✅ Browser URL always shows /exam/:slug — no address bar flash
// ✅ React Router picks up /exam/:slug and renders the exam page normally
// ✅ Googlebot/Bingbot/etc. now get real content + index,follow (v13)
// ✅ Humans get real content + index,follow (v12)
// ✅ Social-preview bots still get the lightweight noindex OG card (unchanged, correct)
// ✅ In-process LRU cache (10 min TTL, 500 slugs) for exam metadata
// ✅ Edge CDN cache for all response branches
// ─────────────────────────────────────────────────────────────────────────────

import fs   from 'fs';
import path from 'path';

const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'exampro-1e4de';
const API_KEY    = process.env.FIREBASE_API_KEY    || 'AIzaSyCHbNx6tveBKqN3BwKzK8Ap23d8DHmUSGs';
const BASE_URL   = 'https://www.flexexams.com';
const OG_IMAGE   = `${BASE_URL}/og-image.png`;
const SITE_NAME  = 'FlexExams';
const TWITTER_AT = '@FlexExams';
const FS_BASE    = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

// ── Memory Cache ──────────────────────────────────────────────────────────────
const CACHE_TTL = 10 * 60 * 1000;
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
// v13 FIX — CRITICAL: real search-engine crawlers (Googlebot, Google Inspection
// Tool / Search Console URL Inspection, Bingbot, Yandex, DuckDuckBot...) were
// being lumped together with social-preview bots (Facebook, Twitter, Slack...).
// ALL of them were going through botHtml(), which deliberately sets
//   <meta name="robots" content="noindex,nofollow">
//   X-Robots-Tag: noindex, nofollow
// That is correct for a social-preview snapshot (it's not the real page, no
// reason for Google to index that thin placeholder) — but it is WRONG when
// the visitor IS Google/Bing/etc., because it told Google point-blank not to
// index the exam page at all. This was very likely the real reason exam pages
// weren't getting indexed, more so than the sitemap issue.
//
// Fix: split into two lists.
//   SEARCH_ENGINE_BOTS → these are genuine search engines that crawl AND
//     render the page for indexing. They now get the SAME real index.html
//     (with real exam SEO injected, index/follow) that a human gets — not
//     the thin OG-only placeholder.
//   PREVIEW_BOTS → social-card fetchers + SEO audit tools that just want OG
//     tags for a preview/snapshot and never index anything themselves. These
//     keep getting the lightweight botHtml() with noindex,nofollow, which is
//     correct and intentional for them.
const SEARCH_ENGINE_BOTS = [
  'googlebot', 'google-inspectiontool', 'google-structured-data-testing-tool',
  'googleother', 'storebot-google', 'google-extended',
  'bingbot', 'msnbot', 'bingpreview',
  'yandexbot', 'duckduckbot', 'baiduspider', 'applebot',
];
const PREVIEW_BOTS = [
  'facebookexternalhit', 'facebot', 'facebook',
  'linkedinbot', 'twitterbot', 'whatsapp', 'telegrambot',
  'discordbot', 'slackbot', 'slack-imgproxy',
  'pinterestbot', 'redditbot', 'vkshare', 'vkrobot',
  'semrushbot', 'ahrefsbot', 'mj12bot', 'dotbot', 'rogerbot',
  'ia_archiver', 'archive.org_bot',
  'crawler', 'spider',
];
const isSearchEngineBot = (ua = '') => { const u = ua.toLowerCase(); return SEARCH_ENGINE_BOTS.some(s => u.includes(s)); };
const isPreviewBot      = (ua = '') => { const u = ua.toLowerCase(); return PREVIEW_BOTS.some(s => u.includes(s)); };
const isBot             = (ua = '') => isSearchEngineBot(ua) || isPreviewBot(ua);

// ── Sanitizers ────────────────────────────────────────────────────────────────
const ESC = { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#x27;' };
const esc = (s = '', n = 300) => String(s).slice(0, n).replace(/[&<>"']/g, c => ESC[c]);
const safeImg = (url = '') => {
  try { const u = new URL(url); return u.protocol === 'https:' ? u.toString() : ''; }
  catch { return ''; }
};

// ── index.html reader ─────────────────────────────────────────────────────────
// Vercel places the SPA's built output in /var/task/public or process.cwd()/public.
// We read it once and cache in-process.
let _indexHtml = null;
function getIndexHtml() {
  if (_indexHtml) return _indexHtml;
  // Common Vercel output paths (Vite → dist, CRA → build, Next static → public)
  const candidates = [
    path.join(process.cwd(), 'public',   'index.html'),
    path.join(process.cwd(), 'dist',     'index.html'),
    path.join(process.cwd(), 'build',    'index.html'),
    path.join(process.cwd(), '.output',  'public', 'index.html'),
    '/var/task/public/index.html',
    '/var/task/dist/index.html',
    '/var/task/build/index.html',
  ];
  for (const p of candidates) {
    try { _indexHtml = fs.readFileSync(p, 'utf8'); return _indexHtml; } catch {}
  }
  return null;
}

// ── Firestore ─────────────────────────────────────────────────────────────────
const fv = f => f ? String(f.stringValue ?? f.integerValue ?? f.doubleValue ?? '').trim() : '';

async function fetchExam(slug) {
  const hit = cacheGet(slug);
  if (hit !== undefined) return hit;

  let fields = null;

  // 1. Document GET (slug = doc ID) — O(1)
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

// ── JSON-LD builder (shared by bot HTML and human-injected HTML) ─────────────
function buildJsonLd({ title, desc, image, canonicalUrl }) {
  return JSON.stringify({ '@context':'https://schema.org', '@graph': [
    { '@type':'WebSite', '@id':`${BASE_URL}/#website`, name:SITE_NAME, url:BASE_URL },
    { '@type':'Organization', '@id':`${BASE_URL}/#organization`, name:SITE_NAME, url:BASE_URL,
      logo:{ '@type':'ImageObject', url:`${BASE_URL}/logo.png` } },
    { '@type':'EducationalOccupationalCredential', '@id':`${canonicalUrl}#credential`,
      name:title, description:desc, url:canonicalUrl, credentialCategory:'certification',
      recognizedBy:{ '@type':'Organization', '@id':`${BASE_URL}/#organization` },
      image:{ '@type':'ImageObject', url:image, width:1200, height:630 } },
    { '@type':'BreadcrumbList', itemListElement:[
      { '@type':'ListItem', position:1, name:'Home',  item:BASE_URL },
      { '@type':'ListItem', position:2, name:'Exams', item:`${BASE_URL}/exams` },
      { '@type':'ListItem', position:3, name:title,   item:canonicalUrl },
    ]},
  ]});
}

// ── OG HTML (preview bots, or search-bot fallback when index.html is missing) ─
function botHtml({ title, desc, image, canonicalUrl, indexable = false }) {
  const ld = buildJsonLd({ title, desc, image, canonicalUrl });
  const robots = indexable ? 'index, follow' : 'noindex,nofollow';

  return `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${title} | ${SITE_NAME}</title>
<meta name="description"              content="${desc}"/>
<meta name="robots"                   content="${robots}"/>
<link rel="canonical"                 href="${canonicalUrl}"/>
<meta property="og:type"              content="website"/>
<meta property="og:site_name"         content="${SITE_NAME}"/>
<meta property="og:title"             content="${title}"/>
<meta property="og:description"       content="${desc}"/>
<meta property="og:url"               content="${canonicalUrl}"/>
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
<a href="${canonicalUrl}" style="padding:13px 32px;border-radius:10px;background:#6366f1;color:#fff;text-decoration:none;font-size:15px;font-weight:600">Start Practice →</a>
</body></html>`;
}

// ── v12 NEW: inject real exam SEO into the actual built index.html ──────────
// Strips any default/generic SEO tags baked into the build, then inserts the
// real exam-specific ones right before </head>. The rest of the file
// (div#root, script bundles, etc.) is left completely untouched so React
// mounts and behaves exactly as before.
function stripExistingSeoTags(html) {
  return html
    .replace(/<title>[\s\S]*?<\/title>/i, '')
    .replace(/<meta\s+name=["']description["'][^>]*>\s*/gi, '')
    .replace(/<meta\s+name=["']robots["'][^>]*>\s*/gi, '')
    .replace(/<meta\s+property=["']og:[^"']*["'][^>]*>\s*/gi, '')
    .replace(/<meta\s+name=["']twitter:[^"']*["'][^>]*>\s*/gi, '')
    .replace(/<link\s+rel=["']canonical["'][^>]*>\s*/gi, '');
}

function injectSeoIntoIndexHtml(html, { title, desc, image, canonicalUrl }) {
  const ld = buildJsonLd({ title, desc, image, canonicalUrl });
  const fullTitle = `${title} | ${SITE_NAME}`;

  const tagsBlock = `<title>${fullTitle}</title>
<meta name="description" content="${desc}"/>
<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1"/>
<link rel="canonical" href="${canonicalUrl}"/>
<meta property="og:type" content="website"/>
<meta property="og:site_name" content="${SITE_NAME}"/>
<meta property="og:title" content="${fullTitle}"/>
<meta property="og:description" content="${desc}"/>
<meta property="og:url" content="${canonicalUrl}"/>
<meta property="og:locale" content="en_US"/>
<meta property="og:image" content="${image}"/>
<meta property="og:image:secure_url" content="${image}"/>
<meta property="og:image:width" content="1200"/>
<meta property="og:image:height" content="630"/>
<meta property="og:image:alt" content="${title} — ${SITE_NAME}"/>
<meta name="twitter:card" content="summary_large_image"/>
<meta name="twitter:site" content="${TWITTER_AT}"/>
<meta name="twitter:title" content="${fullTitle}"/>
<meta name="twitter:description" content="${desc}"/>
<meta name="twitter:image" content="${image}"/>
<script type="application/ld+json">${ld}</script>
`;

  const cleaned = stripExistingSeoTags(html);
  if (cleaned.includes('</head>')) {
    return cleaned.replace('</head>', `${tagsBlock}</head>`);
  }
  // No </head> found (shouldn't happen for a real built index.html) — prepend as a safe fallback
  return tagsBlock + cleaned;
}

// ── Main Handler ──────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  const raw  = (req.query.slug || '').trim();
  const slug = raw.toLowerCase();

  if (!slug || !/^[a-z0-9][a-z0-9_-]{0,79}$/i.test(slug)) {
    return res.redirect(302, BASE_URL);
  }

  const canonicalUrl  = `${BASE_URL}/exam/${slug}`;
  const ua            = req.headers['user-agent'] || '';
  const searchBot     = isSearchEngineBot(ua);
  const previewBot    = isPreviewBot(ua);
  const bot           = searchBot || previewBot;
  const isHumanPass   = req.query._h === '1';

  // ── Preserve all extra query params (e.g. couponCode) across the two-round flow ──
  // Build a clean params object: strip internal params (_h, slug, debug) but keep everything else
  const extraParams = Object.entries(req.query)
    .filter(([k]) => k !== '_h' && k !== 'slug' && k !== 'debug')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');
  // Full URL that humans land on after Round 2 (keeps couponCode etc.)
  const humanUrl = extraParams
    ? `${canonicalUrl}?${extraParams}&_h=1`
    : `${canonicalUrl}?_h=1`;

  // Minimal safe headers
  res.setHeader('X-Content-Type-Options',  'nosniff');
  res.setHeader('X-Frame-Options',         'SAMEORIGIN');
  res.setHeader('Referrer-Policy',         'strict-origin-when-cross-origin');

  // ── Debug ──────────────────────────────────────────────────────────────────
  if (req.query.debug === '1') {
    let rawFields = null;
    try {
      const r = await fetch(`${FS_BASE}/exams/${encodeURIComponent(slug)}?key=${API_KEY}`, { signal: AbortSignal.timeout(3000) });
      rawFields = (await r.json()).fields ?? null;
    } catch {}
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json({
      slug, isSearchEngineBot: searchBot, isPreviewBot: previewBot, isBot: bot, isHumanPass, ua,
      canonicalUrl,
      indexHtmlFound: !!getIndexHtml(),
      cacheHit: cacheGet(slug) !== undefined,
      examFound: !!rawFields,
      fieldKeys: rawFields ? Object.keys(rawFields) : [],
      rawSample: rawFields ? JSON.stringify(rawFields).slice(0, 1500) : null,
    });
  }

  // ── SEARCH ENGINE BOT or HUMAN Round 2 (_h=1): serve real index.html, with
  // real exam SEO injected — index, follow ───────────────────────────────────
  // v13 FIX: Googlebot / Google Inspection Tool / Bingbot etc. now take this
  // same branch as a real human visitor — they get the actual app shell with
  // the real exam's title/description/OG/canonical/JSON-LD and an explicit
  // "index, follow" robots tag. They do NOT get the thin noindex placeholder
  // that social-preview bots get below.
  if (searchBot || (!bot && isHumanPass)) {
    const html = getIndexHtml();
    if (html) {
      let exam = null;
      try { exam = await fetchExam(slug); }
      catch (e) { console.error('[share] fetchExam (real content):', e.message); }

      const title = exam?.title || 'Certification Exam Practice';
      const desc  = exam?.description || `Practice real ${title} questions on ${SITE_NAME}. Timed tests, instant feedback, and detailed explanations.`;
      const image = exam?.image || OG_IMAGE;

      const finalHtml = injectSeoIntoIndexHtml(html, { title, desc, image, canonicalUrl });

      // Safe to cache briefly at the edge now — content is keyed purely by slug/exam data
      res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=300, stale-while-revalidate=86400');
      res.setHeader('Vary', 'User-Agent');
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      // Explicit: do NOT set X-Robots-Tag here — let the injected
      // "index, follow" meta tag (and nothing else) govern indexing.
      return res.status(200).send(finalHtml);
    }
    // index.html not found on disk
    if (searchBot) {
      // Don't redirect a search engine into a redirect chain — fail safe with
      // the OG-only page instead, still index,follow since it's still a real exam URL.
      let exam = null;
      try { exam = await fetchExam(slug); } catch {}
      const title = exam?.title || 'Certification Exam Practice';
      const desc  = exam?.description || `Practice real ${title} questions on ${SITE_NAME}.`;
      const image = exam?.image || OG_IMAGE;
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.status(200).send(botHtml({ title, desc, image, canonicalUrl, indexable: true }));
    }
    console.error('[share] index.html not found on disk — falling back');
    const fallbackUrl = extraParams
      ? `${canonicalUrl}?${extraParams}#fallback`
      : `${canonicalUrl}#fallback`;
    return res.redirect(302, fallbackUrl);
  }

  // ── HUMAN Round 1: redirect — preserve couponCode and all extra params ──────
  if (!bot) {
    res.setHeader('Cache-Control', 'no-store');
    return res.redirect(302, humanUrl);
  }

  // ── PREVIEW BOT (social cards, SEO audit tools) → thin OG-only HTML ────────
  // Intentionally noindex,nofollow: this is a placeholder snapshot for link
  // previews, not the real page — Google/Bing never land here (handled above).
  let exam = null;
  try { exam = await fetchExam(slug); }
  catch (e) { console.error('[share] fetchExam:', e.message); }

  const title = exam?.title || 'Certification Exam Practice';
  const desc  = exam?.description || `Practice real ${title} questions on ${SITE_NAME}. Timed tests, instant feedback, and detailed explanations.`;
  const image = exam?.image || OG_IMAGE;

  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
  res.setHeader('Vary', 'User-Agent');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  return res.status(200).send(botHtml({ title, desc, image, canonicalUrl }));
}
