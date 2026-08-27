// Frota Pro v3.0 — Service Worker
const CACHE_NAME = 'frota-pro-v3.1';
const FILES = [
  './',
  './index.html',
  './css/style.css',
  './js/config.js',
  './js/app.js',
  './manifest.json',
  './images/icon-72.png',
  './images/icon-96.png',
  './images/icon-128.png',
  './images/icon-144.png',
  './images/icon-152.png',
  './images/icon-192.png',
  './images/icon-384.png',
  './images/icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(c => c.addAll(FILES))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  // Ignora requisições que não sejam GET ou para APIs externas (Supabase)
  if (e.request.method !== 'GET') return;
  if (e.request.url.includes('supabase.co')) return;

  // Network First com fallback para cache local (offline)
  e.respondWith(
    fetch(e.request)
      .then(response => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(e.request))
  );
});
