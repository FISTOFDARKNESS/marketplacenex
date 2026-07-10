const CACHE = 'nexblox-v1';
const OFFLINE_URL = '/offline';

// Install: pre-cache the offline fallback
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.add(OFFLINE_URL).catch(() => {}))
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: network-first for navigations with offline fallback,
// cache-first for static assets.
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(OFFLINE_URL, copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match(OFFLINE_URL).then((r) => r || new Response('Offline', { status: 503 })))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) =>
      cached ||
      fetch(request)
        .then((res) => {
          if (res.ok && res.type === 'basic') {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(request, copy)).catch(() => {});
          }
          return res;
        })
        .catch(() => cached)
    )
  );
});

// Push: show a notification when the server sends a price/RAP alert
self.addEventListener('push', (event) => {
  let payload = { title: 'NexBlox', body: 'Price update', data: {} };
  try {
    if (event.data) payload = Object.assign(payload, event.data.json());
  } catch (e) { /* ignore parse errors */ }

  const options = {
    body: payload.body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: payload.data && payload.data.itemId ? 'alert-' + payload.data.itemId : 'nexblox-alert',
    data: payload.data || {},
    vibrate: [120, 60, 120],
  };

  event.waitUntil(
    self.registration.showNotification(payload.title || 'NexBlox', options)
  );
});

// Notification click: open the item in the site's browse/catalog
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const data = event.notification.data || {};
  const url = data.itemId ? '/?item=' + data.itemId + '#catalog' : '/#catalog';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});
