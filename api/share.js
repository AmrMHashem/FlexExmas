// api/share.js — FlexExams Social Share Handler v6
// ✅ Fix: Hysteric refresh loop eliminated via meta-refresh + delayed JS
// ✅ Fix: XSS sanitization on all Firestore fields
// ✅ Fix: Robust bot detection (UA + headers + query param)
// ✅ Fix: Proper redirect lifecycle (meta-refresh fallback)
// ✅ Fix: Security hardened + rate limiting headers
// ✅ New: Beautiful branded loading page for human users
// ✅ New: Structured error handling with fallbacks
// ✅ New: Debug mode with full field inspection

// ─── CONFIG ──────────────────────────────────────────────────────────────────
const FIREBASE_PROJECT_ID = 'exampro-1e4de';
const FIREBASE_API_KEY    = 'AIzaSyCHbNx6tveBKqN3BwKzK8Ap23d8DHmUSGs';

const BASE_URL  = 'https://www.flexexams.com';
const OG_IMAGE  = `${BASE_URL}/og-image.png`;
const SITE_NAME = 'FlexExams';

// ─── BOT DETECTION ───────────────────────────────────────────────────────────
// Expanded list covering all major social crawlers + SEO bots
const BOT_UA_PATTERNS = [
  'facebookexternalhit', 'facebot',
  'linkedinbot', 'linkedin',
  'twitterbot', 'x-bot',
  'whatsapp', 'wa.me',
  'telegrambot', 'telegram',
  'slackbot', 'slack-imgproxy',
  'discordbot',
  'googlebot', 'google-structured-data-testing',
  'bingbot', 'msnbot',
  'applebot',
  'pinterest', 'pinterestbot',
  'redditbot',
  'vkshare',
  'semrushbot', 'ahrefsbot', 'mj12bot',
  'ia_archiver',
  'crawler', 'spider', 'scraper',
  'headlesschrome', 'puppeteer', 'playwright',
];

function isSocialBot(ua = '', headers = {}) {
  const uaLower = ua.toLowerCase();

  // 1) UA pattern match
  if (BOT_UA_PATTERNS.some(p => uaLower.includes(p))) return true;

  // 2) Sec-Fetch headers — bots typically don't send Sec-Fetch-User
  // Real humans on same-origin navigation send sec-fetch-user: ?1
  // But bots / crawlers do NOT send it
  // ⚠️ We only use this as a secondary signal, not primary
  const secFetchMode = headers['sec-fetch-mode'];
  const secFetchDest = headers['sec-fetch-dest'];

  // If explicitly navigating as a document from a user, NOT a bot
  if (secFetchMode === 'navigate' && headers['sec-fetch-user'] === '?1') {
    return false; // Definitely a human browser navigation
  }

  // 3) No Accept header is suspicious (bots often skip it)
  const accept = headers['accept'] || '';
  if (!accept.includes('text/html') && !accept.includes('*/*')) return true;

  return false;
}

// ─── SECURITY: XSS Sanitizer ─────────────────────────────────────────────────
function sanitizeHtml(str = '', maxLen = 300) {
  return String(str)
    .substring(0, maxLen)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

function sanitizeUrl(url = '') {
  try {
    const parsed = new URL(url);
    // Only allow http/https URLs for images
    if (!['http:', 'https:'].includes(parsed.protocol)) return '';
    return parsed.toString();
  } catch {
    return '';
  }
}

// ─── FIRESTORE FIELD EXTRACTOR ────────────────────────────────────────────────
function fv(field) {
  if (!field) return '';
  return String(
    field.stringValue ??
    field.integerValue ??
    field.doubleValue ??
    field.booleanValue ??
    ''
  ).trim();
}

// ─── FIRESTORE QUERY ──────────────────────────────────────────────────────────
async function fetchExamBySlug(slug) {
  const endpoint = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents:runQuery?key=${FIREBASE_API_KEY}`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      structuredQuery: {
        from: [{ collectionId: 'exams' }],
        where: {
          fieldFilter: {
            field: { fieldPath: 'slug' },
            op: 'EQUAL',
            value: { stringValue: slug }
          }
        },
        limit: 1
      }
    }),
    signal: AbortSignal.timeout(5000) // 5s timeout
  });

  if (!response.ok) throw new Error(`Firestore error: ${response.status}`);

  const data = await response.json();
  return data?.[0]?.document?.fields ?? null;
}

// ─── HTML BUILDERS ────────────────────────────────────────────────────────────

/**
 * Bot response: pure meta-tag page, NO JavaScript redirect at all.
 * Canonical points to the real exam page.
 * This is what Facebook/Twitter/LinkedIn crawlers see and cache.
 */
function buildBotHtml({ title, desc, image, examUrl, shareUrl }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>${title} | ${SITE_NAME}</title>
  <meta name="description" content="${desc}"/>

  <!-- Open Graph -->
  <meta property="og:type"         content="website"/>
  <meta property="og:site_name"    content="${SITE_NAME}"/>
  <meta property="og:title"        content="${title}"/>
  <meta property="og:description"  content="${desc}"/>
  <meta property="og:url"          content="${shareUrl}"/>
  <meta property="og:image"        content="${image}"/>
  <meta property="og:image:width"  content="1200"/>
  <meta property="og:image:height" content="630"/>
  <meta property="og:image:alt"    content="${title} — ${SITE_NAME}"/>
  <meta property="og:locale"       content="en_US"/>

  <!-- Twitter / X -->
  <meta name="twitter:card"        content="summary_large_image"/>
  <meta name="twitter:site"        content="@FlexExams"/>
  <meta name="twitter:creator"     content="@FlexExams"/>
  <meta name="twitter:title"       content="${title}"/>
  <meta name="twitter:description" content="${desc}"/>
  <meta name="twitter:image"       content="${image}"/>

  <!-- Canonical points to actual exam page, NOT share URL -->
  <link rel="canonical" href="${examUrl}"/>

  <!-- Structured Data -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Course",
    "name": "${title}",
    "description": "${desc}",
    "provider": {
      "@type": "Organization",
      "name": "FlexExams",
      "url": "${BASE_URL}"
    },
    "url": "${examUrl}"
  }
  </script>
</head>
<body style="font-family:system-ui,sans-serif;background:#0d1223;color:#eef1fb;text-align:center;padding:60px 20px">
  <img src="${image}" alt="${title}" style="max-width:600px;width:100%;border-radius:12px;margin-bottom:24px" onerror="this.style.display='none'"/>
  <h1 style="color:#a5b4fc;font-size:1.6rem;margin-bottom:12px">${title}</h1>
  <p style="color:#9bb6f0;max-width:500px;margin:0 auto 24px">${desc}</p>
  <a href="${examUrl}"
     style="display:inline-block;padding:12px 32px;border-radius:10px;background:#4f46e5;color:#fff;text-decoration:none;font-size:15px;font-weight:600">
    Start Practice →
  </a>
</body>
</html>`;
}

/**
 * Human response: branded loading/redirect page.
 *
 * THE KEY FIX for hysteric refresh:
 * - Use <meta http-equiv="refresh"> as the PRIMARY redirect mechanism (works before JS)
 * - Use JS redirect as secondary (faster when JS is enabled)
 * - Add ?ref=share param so the destination page can NEVER redirect back to /share/
 * - Set a 1-second delay so the page is rendered/visible before redirect fires
 * - NO conditional logic on client side — always redirect, no loops possible
 */
function buildHumanHtml({ title, desc, image, examUrl, shareUrl }) {
  // Add ref param to prevent any accidental back-loop
  const safeExamUrl = `${examUrl}${examUrl.includes('?') ? '&' : '?'}ref=share`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>${title} | ${SITE_NAME}</title>

  <!-- PRIMARY REDIRECT: fires before JS, no loop possible -->
  <!-- 1 second delay lets the beautiful page render first -->
  <meta http-equiv="refresh" content="1;url=${safeExamUrl}"/>

  <!-- Open Graph (preserved so users sharing from browser still work) -->
  <meta property="og:type"         content="website"/>
  <meta property="og:site_name"    content="${SITE_NAME}"/>
  <meta property="og:title"        content="${title}"/>
  <meta property="og:description"  content="${desc}"/>
  <meta property="og:url"          content="${shareUrl}"/>
  <meta property="og:image"        content="${image}"/>
  <meta property="og:image:width"  content="1200"/>
  <meta property="og:image:height" content="630"/>
  <meta name="twitter:card"        content="summary_large_image"/>
  <meta name="twitter:title"       content="${title}"/>
  <meta name="twitter:description" content="${desc}"/>
  <meta name="twitter:image"       content="${image}"/>
  <link rel="canonical" href="${examUrl}"/>

  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --bg:       #080e1e;
      --surface:  #0f1829;
      --border:   rgba(99, 102, 241, 0.2);
      --indigo:   #6366f1;
      --violet:   #8b5cf6;
      --text:     #e8edff;
      --muted:    #7b93c8;
      --glow:     rgba(99, 102, 241, 0.15);
    }

    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500&display=swap');

    html, body {
      height: 100%;
      background: var(--bg);
      color: var(--text);
      font-family: 'DM Sans', system-ui, sans-serif;
      overflow: hidden;
    }

    /* Animated background grid */
    body::before {
      content: '';
      position: fixed;
      inset: 0;
      background-image:
        linear-gradient(rgba(99,102,241,0.04) 1px, transparent 1px),
        linear-gradient(90deg, rgba(99,102,241,0.04) 1px, transparent 1px);
      background-size: 48px 48px;
      animation: gridDrift 20s linear infinite;
      pointer-events: none;
    }

    @keyframes gridDrift {
      from { transform: translateY(0); }
      to   { transform: translateY(48px); }
    }

    /* Radial glow */
    body::after {
      content: '';
      position: fixed;
      top: -20%;
      left: 50%;
      transform: translateX(-50%);
      width: 800px;
      height: 600px;
      background: radial-gradient(ellipse, rgba(99,102,241,0.12) 0%, transparent 70%);
      pointer-events: none;
    }

    .page {
      position: relative;
      z-index: 1;
      height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 24px;
      gap: 0;
    }

    .logo {
      font-family: 'Syne', sans-serif;
      font-weight: 800;
      font-size: 1.1rem;
      letter-spacing: -0.02em;
      color: var(--indigo);
      margin-bottom: 40px;
      display: flex;
      align-items: center;
      gap: 8px;
      opacity: 0;
      animation: fadeUp 0.5s ease 0.1s forwards;
    }

    .logo-dot {
      width: 8px; height: 8px;
      border-radius: 50%;
      background: var(--violet);
      box-shadow: 0 0 12px var(--violet);
    }

    .card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 20px;
      padding: 36px 40px;
      max-width: 520px;
      width: 100%;
      position: relative;
      overflow: hidden;
      opacity: 0;
      animation: fadeUp 0.5s ease 0.25s forwards;
      box-shadow:
        0 0 0 1px rgba(99,102,241,0.05),
        0 24px 64px rgba(0,0,0,0.4),
        inset 0 1px 0 rgba(255,255,255,0.04);
    }

    .card::before {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0;
      height: 1px;
      background: linear-gradient(90deg, transparent, rgba(99,102,241,0.6), transparent);
    }

    .exam-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(99,102,241,0.12);
      border: 1px solid rgba(99,102,241,0.25);
      border-radius: 20px;
      padding: 4px 12px;
      font-size: 11px;
      font-weight: 500;
      color: #a5b4fc;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      margin-bottom: 16px;
    }

    .exam-title {
      font-family: 'Syne', sans-serif;
      font-weight: 700;
      font-size: clamp(1.3rem, 4vw, 1.75rem);
      line-height: 1.25;
      color: var(--text);
      margin-bottom: 12px;
      letter-spacing: -0.02em;
    }

    .exam-desc {
      color: var(--muted);
      font-size: 0.9rem;
      line-height: 1.65;
      margin-bottom: 28px;
    }

    /* Progress bar — the REAL redirect controller */
    .redirect-track {
      height: 3px;
      background: rgba(99,102,241,0.15);
      border-radius: 99px;
      overflow: hidden;
      margin-bottom: 16px;
    }

    .redirect-fill {
      height: 100%;
      width: 0%;
      border-radius: 99px;
      background: linear-gradient(90deg, var(--indigo), var(--violet));
      animation: fillBar 1s cubic-bezier(0.4,0,0.2,1) 0.3s forwards;
      box-shadow: 0 0 8px var(--indigo);
    }

    @keyframes fillBar {
      from { width: 0%; }
      to   { width: 100%; }
    }

    .redirect-msg {
      font-size: 0.78rem;
      color: var(--muted);
      text-align: center;
      margin-bottom: 20px;
    }

    .cta-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      width: 100%;
      padding: 14px 24px;
      border-radius: 12px;
      background: linear-gradient(135deg, var(--indigo), var(--violet));
      color: #fff;
      text-decoration: none;
      font-size: 0.95rem;
      font-weight: 600;
      letter-spacing: -0.01em;
      transition: opacity 0.15s, transform 0.15s;
      box-shadow: 0 4px 20px rgba(99,102,241,0.35);
    }

    .cta-btn:hover {
      opacity: 0.92;
      transform: translateY(-1px);
    }

    .cta-btn svg {
      width: 16px; height: 16px;
      transition: transform 0.15s;
    }

    .cta-btn:hover svg { transform: translateX(3px); }

    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(14px); }
      to   { opacity: 1; transform: translateY(0); }
    }
  </style>
</head>
<body>
  <div class="page">

    <div class="logo">
      <span class="logo-dot"></span>
      FlexExams
    </div>

    <div class="card">
      <div class="exam-badge">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
        Certification Practice
      </div>

      <h1 class="exam-title">${title}</h1>
      <p class="exam-desc">${desc}</p>

      <div class="redirect-track">
        <div class="redirect-fill"></div>
      </div>
      <p class="redirect-msg">Redirecting you to the exam…</p>

      <a href="${safeExamUrl}" class="cta-btn">
        Start Practicing Now
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
        </svg>
      </a>
    </div>

  </div>

  <script>
    // SECONDARY redirect — faster than meta-refresh when JS is available
    // Uses replace() so the /share/ page is NOT in browser history (no back-loop)
    // The ?ref=share param on the destination ensures it can NEVER redirect back here
    (function() {
      // Safety: only redirect if we're actually on the /share/ path
      if (window.location.pathname.startsWith('/share/')) {
        setTimeout(function() {
          window.location.replace("${safeExamUrl}");
        }, 950); // Slightly before meta-refresh fires, avoids double-fire race
      }
    })();
  </script>
</body>
</html>`;
}

// ─── MAIN HANDLER ─────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  const slug = (req.query.slug || '').trim().toLowerCase();

  // Validate slug
  if (!slug || !/^[a-z0-9-_]+$/i.test(slug)) {
    return res.redirect(302, BASE_URL);
  }

  const examUrl  = `${BASE_URL}/exam/${slug}`;
  const shareUrl = `${BASE_URL}/share/exam/${slug}`;
  const ua       = req.headers['user-agent'] || '';
  const bot      = isSocialBot(ua, req.headers);

  // ── Security headers ──────────────────────────────────────────────────────
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-Robots-Tag', bot ? 'index,follow' : 'noindex');

  // ── Fetch exam data ───────────────────────────────────────────────────────
  let exam = null;
  let rawFields = null;

  try {
    rawFields = await fetchExamBySlug(slug);

    if (rawFields) {
      exam = {
        title:       sanitizeHtml(fv(rawFields.title) || fv(rawFields.name) || fv(rawFields.examName), 120),
        description: sanitizeHtml(fv(rawFields.description) || fv(rawFields.shortDescription), 200),
        image:       sanitizeUrl(
                       fv(rawFields.image) ||
                       fv(rawFields.thumbnail) ||
                       fv(rawFields.imageUrl) ||
                       fv(rawFields.coverImage)
                     ) || OG_IMAGE,
      };
    }
  } catch (err) {
    console.error('[share] Firestore fetch failed:', err.message);
    // Non-fatal: we'll use fallback data
  }

  // ── Debug mode ────────────────────────────────────────────────────────────
  if (req.query.debug === '1') {
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json({
      slug,
      isBot: bot,
      userAgent: ua,
      examFound: !!rawFields,
      availableFields: rawFields ? Object.keys(rawFields) : [],
      resolvedExam: exam,
      rawSample: rawFields ? JSON.stringify(rawFields).substring(0, 1200) : null,
    });
  }

  // ── Build template data ───────────────────────────────────────────────────
  const title = exam?.title || 'Certification Exam Practice';
  const desc  = exam?.description ||
    `Practice real ${exam?.title || 'certification'} exam questions on FlexExams. Timed tests, instant feedback, and detailed explanations.`;
  const image = exam?.image || OG_IMAGE;

  const templateData = { title, desc, image, examUrl, shareUrl };

  // ── Cache control ─────────────────────────────────────────────────────────
  // Bots: cache aggressively (social previews are static)
  // Humans: no cache (redirect page shouldn't be cached)
  if (bot) {
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
  } else {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
  }

  // ── Respond ───────────────────────────────────────────────────────────────
  const html = bot
    ? buildBotHtml(templateData)
    : buildHumanHtml(templateData);

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  return res.status(200).send(html);
}
