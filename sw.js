/* Service Worker: macht die Karte nach dem ersten Besuch offline nutzbar. */
const CACHE = 'sternenkarte-v2';
const SHELL = ['./', './index.html', './css/style.css', './manifest.webmanifest', './icons/icon.svg', './icons/icon-192.png'];
const CDN = ['cdn.jsdelivr.net', 'fonts.googleapis.com', 'fonts.gstatic.com'];
const TIMEOUT_MS = 4000;

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

/** Netz zuerst (damit Updates ankommen), bei Fehler oder Zeitüberschreitung aus dem Cache. */
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin && !CDN.includes(url.hostname)) return;
  const key = url.origin === location.origin ? url.origin + url.pathname : req.url; // Query-Varianten zusammenfassen

  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const network = fetch(req).then(res => {
      if (res.ok && res.type !== 'opaque') e.waitUntil(cache.put(key, res.clone()));
      return res;
    });
    const timeout = new Promise(r => setTimeout(r, TIMEOUT_MS, null));
    try {
      const res = await Promise.race([network, timeout]);
      if (res) return res;
      return (await cache.match(key)) || (await network);
    } catch {
      const hit = await cache.match(key);
      if (hit) return hit;
      if (req.mode === 'navigate') return (await cache.match('./index.html')) || Response.error();
      return Response.error();
    }
  })());
});
