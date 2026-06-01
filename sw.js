const CACHE_NAME = 'kasirku-v2';
const urlsToCache = [
  '/kasirku-pos/',
  '/kasirku-pos/index.html',
  '/kasirku-pos/manifest.json',
  '/kasirku-pos/icon.svg'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(urlsToCache)));
  self.skipWaiting();
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(r => r || fetch(event.request).catch(() => caches.match('/kasirku-pos/')))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(names => Promise.all(names.filter(n => n !== CACHE_NAME).map(n => caches.delete(n)))));
  self.clients.claim();
});
