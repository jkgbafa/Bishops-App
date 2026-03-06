const CACHE_NAME = 'church-dir-v2';

// Core files to cache immediately
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/bishops_data.json',
  '/first_love.json',
  '/ud_pastors.json',
  '/udlwm.json',
  '/flow.json',
  '/first_love_councils.json',
  '/manifest.json'
];

// Install: cache core assets
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: network-first for JSON (fresh data), cache-first for images/logos (stable)
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // JSON data: try network first, fall back to cache
  if (url.pathname.endsWith('.json')) {
    e.respondWith(
      fetch(e.request).then(res => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        return res;
      }).catch(() => caches.match(e.request))
    );
    return;
  }

  // Photos & logos: cache-first (they don't change)
  if (url.pathname.startsWith('/photos/') || url.pathname.startsWith('/logos/')) {
    e.respondWith(
      caches.match(e.request).then(cached => {
        if (cached) return cached;
        return fetch(e.request).then(res => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
          return res;
        });
      })
    );
    return;
  }

  // Everything else: network-first
  e.respondWith(
    fetch(e.request).then(res => {
      if (res.ok) {
        const clone = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
      }
      return res;
    }).catch(() => caches.match(e.request))
  );
});
