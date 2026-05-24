const CACHE = 'lixue-v3-static-v3';

const STATIC = [
  '/store-schedule-v3/css/common.css',
  '/store-schedule-v3/js/firebase-config.js',
  '/store-schedule-v3/js/auth.js',
  '/store-schedule-v3/js/db.js',
  '/store-schedule-v3/js/utils.js',
  '/store-schedule-v3/js/schedule-utils.js',
  '/store-schedule-v3/js/salary-utils.js',
  '/store-schedule-v3/manifest.json',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(STATIC).catch(() => {}))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (url.hostname.includes('firebase') || url.hostname.includes('gstatic') || url.hostname.includes('google')) return;
  if (e.request.destination === 'document' || url.pathname.endsWith('.html')) {
    e.respondWith(fetch(e.request, { cache: 'no-cache' }).catch(() => caches.match(e.request)));
    return;
  }
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (res.ok) caches.open(CACHE).then(c => c.put(e.request, res.clone()));
        return res;
      });
    })
  );
});

self.addEventListener('message', e => { if (e.data === 'SKIP_WAITING') self.skipWaiting(); });
