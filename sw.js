/**
 * FlexExams Service Worker — v4.1 (SEO Safe Edition)
 * Fixes:
 * - Facebook/LinkedIn bots 403 issue
 * - Safer SPA routing
 * - Bot bypass
 * - Stable caching
 */

const APP_VERSION   = 'v4.1.0';
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

// ───────────────────────── HELPERS ─────────────────────────
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

function isSpaRoute(url) {
  const path = new URL(url).pathname;
  if (path === '/') return true;
  if (path.startsWith('/exam/')) return true;
  return SPA_ROUTES.some(route => path === route || path.startsWith(route + '/'));
}

// ───────────────────────── FETCH ─────────────────────────
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = request.url;

  if (request.method !== 'GET') return;
  if (!url.startsWith('http')) return;

  // 🚨 BYPASS SERVICE WORKER FOR BOTS (IMPORTANT FIX)
  if (isBot(request)) {
    event.respondWith(fetch(request));
    return;
  }

  // Firebase → always network
  if (isFirebaseRequest(url)) {
    event.respondWith(fetch(request));
    return;
  }

  // Images → cache
  if (isImageRequest(url)) {
    event.respondWith(staleWhileRevalidate(request, IMAGE_CACHE));
    return;
  }

  // Static assets → cache first
  if (isStaticAsset(url) && url.includes(self.location.origin)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // SPA navigation → safe fallback
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
          if (isSpaRoute(url)) {
            const cached = await caches.match('/') || await caches.match('/index.html');
            if (cached) return cached;
          }

          return caches.match('/offline.html');
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
  const cache = await caches.open(cacheName);
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
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }

    return response;
  } catch {
    return caches.match(request) || caches.match('/offline.html');
  }
}

// ───────────────────────── PUSH ─────────────────────────
self.addEventListener('push', event => {
  if (!event.data) return;

  const data = event.data.json();

  event.waitUntil(
    self.registration.showNotification(data.title || 'FlexExams', {
      body: data.body || 'New update available',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-192x192.png',
      tag: data.tag || 'flexexams',
      data: { url: data.url || '/' }
    })
  );
});

// ───────────────────────── NOTIFICATION CLICK ─────────────────────────
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data?.url || '/'));
});
