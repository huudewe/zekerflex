const CACHE_NAME = 'zekerflex-worker-v1';
const APP_SHELL = [
  './',
  './index.html',
  './werknemer-dashboard.html',
  './manifest.webmanifest',
  './zekerflex-logo.jpeg',
  './app-icon-192.svg',
  './app-icon-512.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => cachedResponse || fetch(event.request).then((networkResponse) => {
      if (new URL(event.request.url).origin === self.location.origin) {
        const responseCopy = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseCopy));
      }
      return networkResponse;
    }))
  );
});
