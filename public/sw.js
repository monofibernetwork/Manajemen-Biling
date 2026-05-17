const CACHE_NAME = 'bnet-pwa-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Simple fetch pass-through, rely on browser cache or just network first
  event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
});
