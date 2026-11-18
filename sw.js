/* Service Worker: macht die Karte nach dem ersten Besuch offline nutzbar. */
const CACHE = 'sternenkarte-v1';
const SHELL = [
  './', './index.html', './css/style.css', './manifest.webmanifest', './icons/icon.svg', './icons/icon-192.png',
  './js/main.js', './js/data/factions.js', './js/data/places.js', './js/data/shapes.js',
  './js/core/coords.js', './js/core/blob.js', './js/core/search.js', './js/core/labels.js', './js/core/camera.js',
  './js/render/scene.js', './js/render/galaxy.js', './js/render/overlays.js', './js/render/markers.js', './js/render/planet-art.js',
  './js/ui/frame.js', './js/ui/labels-dom.js', './js/ui/info.js', './js/ui/search-ui.js', './js/ui/minimap.js', './js/ui/intro.js',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const cdn = url.hostname === 'cdn.jsdelivr.net' || url.hostname.endsWith('gstatic.com') || url.hostname === 'fonts.googleapis.com';
  if (url.origin !== location.origin && !cdn) return;
  // Netz zuerst (aktuell bleiben), bei Offline aus dem Cache
  e.respondWith(
    fetch(req).then(res => {
      if (res.ok || res.type === 'opaque') { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return res;
    }).catch(() => caches.match(req).then(r => r || caches.match('./index.html')))
  );
});
