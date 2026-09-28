/**
 * ConstruApp Field — Service Worker
 * Estrategia: Cache-first para assets estáticos, Network-first para API.
 * Permite uso offline básico del Field App.
 */

const CACHE_NAME     = 'construapp-field-v1';
const API_PREFIX     = '/api/';

// Assets críticos para el funcionamiento offline del Field App
const PRECACHE_URLS = [
  '/',
  '/campo',
  '/index.html',
];

// ── Install: pre-cache assets ─────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(PRECACHE_URLS).catch(() => {});
    })
  );
  self.skipWaiting();
});

// ── Activate: limpiar caches viejos ──────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// ── Fetch: estrategia híbrida ─────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // API calls → Network-first (sin caché, datos siempre frescos)
  if (url.pathname.startsWith(API_PREFIX) || url.hostname !== location.hostname) {
    return; // dejar pasar sin interceptar
  }

  // Assets estáticos → Cache-first con fallback a red
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        // Cachear solo respuestas exitosas de assets
        if (response.ok && event.request.method === 'GET') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        // Offline fallback: devolver index.html para rutas SPA
        if (event.request.destination === 'document') {
          return caches.match('/index.html');
        }
      });
    })
  );
});
