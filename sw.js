// Quant Lab service worker: offline app shell, refreshed in the background.
const CACHE = 'quantlab-afc16b9a0c1e';
const ASSETS = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './icon-maskable-512.png', './apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k.startsWith('quantlab-') && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  if (req.mode === 'navigate') {
    // the app shell: cached copy first (instant, offline), network copy refreshes the cache for next launch
    e.respondWith(caches.open(CACHE).then(async c => {
      const cached = await c.match('./index.html');
      const fresh = fetch(req).then(r => { if (r.ok) c.put('./index.html', r.clone()); return r; }).catch(() => null);
      return cached || (await fresh) || Response.error();
    }));
    return;
  }
  e.respondWith(caches.match(req).then(r => r || fetch(req)));
});
