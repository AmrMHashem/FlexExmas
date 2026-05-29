/**
<<<<<<< HEAD
 * FlexExams Service Worker — v4.0 (History API Edition)
 * ✅ Full support for clean URL routing (/exams, /topics, /exam/slug)
 * ✅ SPA navigation fallback → always serves index.html for page routes
 * ✅ Cache size limiting
 * ✅ Safer Firebase detection
 * ✅ Strong offline UX
 * ✅ Performance-safe caching rules
 */

const APP_VERSION   = 'v4.0.0';
=======
 * FlexExams Service Worker — v4.1 (SEO Safe Edition)
 * Fixes:
 * - Facebook/LinkedIn bots 403 issue
 * - Safer SPA routing
 * - Bot bypass
 * - Stable caching
 */

const APP_VERSION   = 'v4.1.0';
>>>>>>> ef1bec4ecf58728841e3d701049dd7c1f52c5003
const STATIC_CACHE  = `flexexams-static-${APP_VERSION}`;
const DYNAMIC_CACHE = `flexexams-dynamic-${APP_VERSION}`;
const IMAGE_CACHE   = `flexexams-images-${APP_VERSION}`;

const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/site.webmanifest',
  '/offline.html',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

<<<<<<< HEAD
// All SPA routes — serve index.html for these paths
=======
>>>>>>> ef1bec4ecf58728841e3d701049dd7c1f52c5003
const SPA_ROUTES = [
  '/exams',
  '/topics',
  '/categories',
  '/about',
  '/contact',
  '/quiz',
  '/result',
  '/auth',
  '/dashboard',
  '/my-exams',
  '/admin',
  '/favorites',
  '/verify',
  '/career-diagnostic',
];

// ───────────────────────── INSTALL ─────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// ───────────────────────── ACTIVATE ─────────────────────────
self.addEventListener('activate', event => {
  const allowed = [STATIC_CACHE, DYNAMIC_CACHE, IMAGE_CACHE];

  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => !allowed.includes(k)).map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// ───────────────────────── BOT DETECTION ─────────────────────────
function isBot(request) {
  const ua = request.headers.get('user-agent') || "";
  return (
    ua.includes('facebookexternalhit') ||
    ua.includes('Facebot') ||
    ua.includes('Twitterbot') ||
    ua.includes('LinkedInBot') ||
    ua.includes('Slackbot') ||
    ua.includes('Discordbot')
  );
}

<<<<<<< HEAD
=======
// ───────────────────────── HELPERS ─────────────────────────
>>>>>>> ef1bec4ecf58728841e3d701049dd7c1f52c5003
function isFirebaseRequest(url) {
  return (
    url.includes('firestore.googleapis.com') ||
    url.includes('identitytoolkit.googleapis.com') ||
    url.includes('firebaseio.com')
  );
}

function isStaticAsset(url) {
  return /\.(js|css|woff2?|ttf|eot)(\?.*)?$/.test(url);
}

function isImageRequest(url) {
  return /\.(png|jpg|jpeg|gif|svg|webp|avif|ico)(\?.*)?$/.test(url);
}

function isNavigationRequest(request) {
  return request.mode === 'navigate';
}

<<<<<<< HEAD
/**
 * isSpaRoute — checks if this navigation should be served index.html
 * Covers all clean URLs: /exams, /exam/any-slug, /topics etc.
 */
=======
>>>>>>> ef1bec4ecf58728841e3d701049dd7c1f52c5003
function isSpaRoute(url) {
  const path = new URL(url).pathname;
  if (path === '/') return true;
  if (path.startsWith('/exam/')) return true;
  return SPA_ROUTES.some(route => path === route || path.startsWith(route + '/'));
<<<<<<< HEAD
}

// ───────────────────────── FETCH WITH TIMEOUT ─────────────────────────
function fetchWithTimeout(request, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timeout')), timeout);
    fetch(request)
      .then(res => { clearTimeout(timer); resolve(res); })
      .catch(err => { clearTimeout(timer); reject(err); });
  });
}

// ───────────────────────── CACHE LIMITER ─────────────────────────
async function limitCacheSize(cacheName, maxItems = 80) {
  const cache = await caches.open(cacheName);
  const keys  = await cache.keys();
  if (keys.length > maxItems) {
    await cache.delete(keys[0]);
    limitCacheSize(cacheName, maxItems);
  }
}

// ───────────────────────── FETCH ROUTING ─────────────────────────
=======
}

// ───────────────────────── FETCH ─────────────────────────
>>>>>>> ef1bec4ecf58728841e3d701049dd7c1f52c5003
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = request.url;

  if (request.method !== 'GET') return;
  if (!url.startsWith('http')) return;

<<<<<<< HEAD
  // ── Firebase / API → Network only (never cache)
=======
  // 🚨 BYPASS SERVICE WORKER FOR BOTS (IMPORTANT FIX)
  if (isBot(request)) {
    event.respondWith(fetch(request));
    return;
  }

  // Firebase → always network
>>>>>>> ef1bec4ecf58728841e3d701049dd7c1f52c5003
  if (isFirebaseRequest(url)) {
    event.respondWith(fetch(request));
    return;
  }

  // Images → cache
  if (isImageRequest(url)) {
    event.respondWith(staleWhileRevalidate(request, IMAGE_CACHE));
    return;
  }

<<<<<<< HEAD
  // ── Static JS/CSS assets → Cache first
=======
  // Static assets → cache first
>>>>>>> ef1bec4ecf58728841e3d701049dd7c1f52c5003
  if (isStaticAsset(url) && url.includes(self.location.origin)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

<<<<<<< HEAD
  // ── SPA Navigation (History API) → Network first, fallback to cached /index.html
  // This is the KEY change: all clean URL page navigations serve index.html
=======
  // SPA navigation → safe fallback
>>>>>>> ef1bec4ecf58728841e3d701049dd7c1f52c5003
  if (isNavigationRequest(request)) {
    event.respondWith(
      fetch(request)
        .then(res => {
          if (res.ok) {
            const cache = caches.open(DYNAMIC_CACHE);
            cache.then(c => c.put('/', res.clone()));
          }
          return res;
        })
        .catch(async () => {
<<<<<<< HEAD
          // Offline: if it's a SPA route, serve cached index.html
=======
>>>>>>> ef1bec4ecf58728841e3d701049dd7c1f52c5003
          if (isSpaRoute(url)) {
            const cached = await caches.match('/') || await caches.match('/index.html');
            if (cached) return cached;
          }
<<<<<<< HEAD
          return caches.match('/offline.html') || new Response(
            `<html>
              <body style="font-family:sans-serif;text-align:center;padding:40px;background:#0d1223;color:#eef1fb">
                <img src="/icons/icon-192x192.png" width="80" style="border-radius:20px;margin-bottom:20px" alt="FlexExams" />
                <h2 style="color:#a5b4fc">You're offline</h2>
                <p style="color:#9bb6f0">Please check your internet connection.</p>
                <button onclick="location.reload()" style="margin-top:20px;padding:12px 28px;border-radius:10px;border:none;background:#4f46e5;color:#fff;font-size:15px;cursor:pointer">Try Again</button>
              </body>
            </html>`,
            { status: 503, headers: { 'Content-Type': 'text/html' } }
          );
=======

          return caches.match('/offline.html');
>>>>>>> ef1bec4ecf58728841e3d701049dd7c1f52c5003
        })
    );
    return;
  }

  // default
  event.respondWith(networkFirst(request, DYNAMIC_CACHE));
});

// ───────────────────────── STRATEGIES ─────────────────────────
async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(cacheName);
    cache.put(request, response.clone());
  }
  return response;
}

async function staleWhileRevalidate(request, cacheName) {
  const cache  = await caches.open(cacheName);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request).then(res => {
    if (res.ok) cache.put(request, res.clone());
    return res;
  });

  return cached || fetchPromise;
}

async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);

    if (response.ok) {
<<<<<<< HEAD
      const type = response.headers.get('content-type') || '';
      if (
        request.url.startsWith(self.location.origin) &&
        type.includes('text/html')
      ) {
        const cache = await caches.open(cacheName);
        cache.put(request, response.clone());
      }
=======
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
>>>>>>> ef1bec4ecf58728841e3d701049dd7c1f52c5003
    }

    return response;
  } catch {
<<<<<<< HEAD
    const cached = await caches.match(request);
    if (cached) return cached;

    const fallback = await caches.match('/offline.html');
    if (fallback) return fallback;

    return new Response(
      `<html>
        <body style="font-family:sans-serif;text-align:center;padding:40px;background:#0d1223;color:#eef1fb">
          <h2 style="color:#a5b4fc">You're offline</h2>
          <p style="color:#9bb6f0">Please check your internet connection.</p>
        </body>
      </html>`,
      { status: 503, headers: { 'Content-Type': 'text/html' } }
    );
=======
    return caches.match(request) || caches.match('/offline.html');
>>>>>>> ef1bec4ecf58728841e3d701049dd7c1f52c5003
  }
}

// ───────────────────────── PUSH ─────────────────────────
self.addEventListener('push', event => {
  if (!event.data) return;

  const data = event.data.json();

  event.waitUntil(
    self.registration.showNotification(data.title || 'FlexExams', {
      body:  data.body  || 'New update available',
      icon:  '/icons/icon-192x192.png',
      badge: '/icons/icon-192x192.png',
      tag:   data.tag   || 'flexexams',
      data:  { url: data.url || '/' }
    })
  );
});

// ───────────────────────── NOTIFICATION CLICK ─────────────────────────
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data?.url || '/'));
});
