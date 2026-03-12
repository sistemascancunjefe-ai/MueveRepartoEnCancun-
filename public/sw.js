const CACHE_VERSION = 'v4.0.0';
const CACHE_NAME = `mueve-reparto-${CACHE_VERSION}`;

// Páginas y assets críticos para offline-first
const CRITICAL_ASSETS = [
  '/',
  '/home',
  '/pedidos',
  '/reparto',
  '/enviar',
  '/metricas',
  '/offline',
  '/manifest.json',
  '/logo.png',
  '/icons/pwa-192x192.png',
  '/icons/pwa-512x512.png',
];

// Map tiles: OSM dark + Carto
const OSM_TILES_PATTERN   = /^https:\/\/[a-c]\.tile\.openstreetmap\.org\//;
const CARTO_TILES_PATTERN = /^https:\/\/[a-d]\.basemaps\.cartocdn\.com\//;

// ── Install: pre-cachear assets críticos ─────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(CRITICAL_ASSETS))
      .then(() => self.skipWaiting())
      .catch(err => {
        console.warn('[SW] Pre-cache parcial:', err);
        return self.skipWaiting();  // Continuar aunque falle algún asset
      })
  );
});

// ── Activate: limpiar caches antiguas ────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// ── Message ───────────────────────────────────────────────────────────────────
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

// ── Push Notifications ────────────────────────────────────────────────────────
self.addEventListener('push', (event) => {
  const data = event.data?.json?.() ?? {};
  event.waitUntil(
    self.registration.showNotification(data.title ?? 'Mueve Reparto', {
      body:     data.body ?? '',
      icon:     '/icons/pwa-192x192.png',
      badge:    '/icons/pwa-192x192.png',
      tag:      data.tag ?? 'mr-push',
      renotify: true,
      data:     { url: data.url ?? '/reparto' },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? '/reparto';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      const existing = list.find(c => c.url.includes(url));
      if (existing) return existing.focus();
      return clients.openWindow(url);
    })
  );
});

// ── Fetch ─────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') return;
  if (!url.protocol.startsWith('http')) return;

  // API calls y Nominatim → siempre red (no cachear datos de usuario)
  if (
    url.pathname.startsWith('/api/') ||
    url.hostname === 'nominatim.openstreetmap.org'
  ) return;

  // Stripe → siempre red
  if (url.hostname.includes('stripe.com')) return;

  // Map tiles → Cache-First (no cambian)
  if (OSM_TILES_PATTERN.test(request.url) || CARTO_TILES_PATTERN.test(request.url)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Assets estáticos (JS, CSS, fonts, icons) → Cache-First
  if (
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.woff2') ||
    url.pathname.endsWith('.woff') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname.startsWith('/fonts/')
  ) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Páginas HTML → Network-First con fallback offline
  event.respondWith(networkFirst(request));
});

// ── Estrategias de caché ──────────────────────────────────────────────────────

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/plain' } });
  }
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    if (request.mode === 'navigate') {
      const cache = await caches.open(CACHE_NAME);
      return (await cache.match('/offline')) ??
        new Response('<h1>Sin conexión</h1>', { status: 503, headers: { 'Content-Type': 'text/html' } });
    }
    return new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/plain' } });
  }
}
