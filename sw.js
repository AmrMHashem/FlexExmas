/**
 * FlexExams Service Worker — v3.1 (Optimized)
 * Improvements:
 * - Fixed AbortSignal compatibility
 * - Cache size limiting
 * - Better navigation handling (SPA SEO)
 * - Safer Firebase detection
 * - Stronger offline UX
 * - Performance-safe caching rules
 */

const APP_VERSION  = 'v3.1.0';
const STATIC_CACHE = `flexexams-static-${APP_VERSION}`;
const DYNAMIC_CACHE = `flexexams-dynamic-${APP_VERSION}`;
const IMAGE_CACHE  = `flexexams-images-${APP_VERSION}`;

const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/site.webmanifest',
  '/offline.html',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// ───────────────────────── INSTALL ─────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
      .catch(err => console.warn('[SW] Install failed:', err))
  );
});

// ───────────────────────── ACTIVATE ─────────────────────────
self.addEventListener('activate', event => {
  const allowed = [STATIC_CACHE, DYNAMIC_CACHE, IMAGE_CACHE];

  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => !allowed.includes(k))
          .map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// ───────────────────────── HELPERS ─────────────────────────

// safer firebase detection
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

// ───────────────────────── FETCH WITH TIMEOUT ─────────────────────────
function fetchWithTimeout(request, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timeout')), timeout);

    fetch(request)
      .then(res => {
        clearTimeout(timer);
        resolve(res);
      })
      .catch(err => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

// ───────────────────────── CACHE LIMITER ─────────────────────────
async function limitCacheSize(cacheName, maxItems = 80) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();

  if (keys.length > maxItems) {
    await cache.delete(keys[0]);
    limitCacheSize(cacheName, maxItems);
  }
}

// ───────────────────────── FETCH ROUTING ─────────────────────────
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = request.url;

  if (request.method !== 'GET') return;
  if (!url.startsWith('http')) return;

  // ── Firebase / API → Network only
  if (isFirebaseRequest(url)) {
    event.respondWith(fetch(request));
    return;
  }

  // ── Images → Stale While Revalidate
  if (isImageRequest(url)) {
    event.respondWith(staleWhileRevalidate(request, IMAGE_CACHE));
    return;
  }

  // ── Static assets → Cache first
  if (isStaticAsset(url) && url.includes(self.location.origin)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // ── Navigation (IMPORTANT for React SEO)
  if (isNavigationRequest(request)) {
    event.respondWith(
      fetch(request)
        .then(res => {
          return caches.open(DYNAMIC_CACHE).then(cache => {
            cache.put('/', res.clone());
            return res;
          });
        })
        .catch(() => caches.match('/') || caches.match('/offline.html'))
    );
    return;
  }

  // ── Default → Network first
  event.respondWith(networkFirst(request, DYNAMIC_CACHE));
});

// ───────────────────────── STRATEGIES ─────────────────────────

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('', { status: 408 });
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request)
    .then(res => {
      if (res.ok) {
        cache.put(request, res.clone());
        limitCacheSize(cacheName);
      }
      return res;
    })
    .catch(() => null);

  return cached || fetchPromise;
}

async function networkFirst(request, cacheName) {
  try {
    const response = await fetchWithTimeout(request, 5000);

    if (response.ok) {
      const type = response.headers.get('content-type') || '';

      if (
        request.url.startsWith(self.location.origin) &&
        type.includes('text/html')
      ) {
        const cache = await caches.open(cacheName);
        cache.put(request, response.clone());
      }
    }

    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;

    const fallback = await caches.match('/offline.html');
    if (fallback) return fallback;

    return new Response(
      `<html>
        <body style="font-family:sans-serif;text-align:center;padding:40px">
          <h2>You're offline</h2>
          <p>Please check your internet connection.</p>
        </body>
      </html>`,
      { status: 503, headers: { 'Content-Type': 'text/html' } }
    );
  }
}

// ───────────────────────── SYNC ─────────────────────────
self.addEventListener('sync', event => {
  if (event.tag === 'sync-exam-progress') {
    event.waitUntil(syncExamProgress());
  }
});

async function syncExamProgress() {
  console.log('[SW] Syncing exam progress...');
}

// ───────────────────────── PUSH NOTIFICATIONS ─────────────────────────
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

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data?.url || '/'));
});