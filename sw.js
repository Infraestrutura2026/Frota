// Frota Pro v3.2 — Service Worker Atualizado
// Limpa caches antigos e garante execução da versão mais recente
const CACHE_NAME = 'frota-pro-v3.2';

self.addEventListener('install', e => {
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  // Ignora requisições de API ou métodos não-GET
  if (e.request.method !== 'GET') return;
  // Sempre busca na rede primeiro
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  );
});
