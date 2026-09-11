const CACHE_NAME = 'srijandev-mail-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Pass-through network-first strategy for dynamic webmail
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
