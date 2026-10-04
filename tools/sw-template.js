/* Alicorn Adventures service worker (generated at build time from tools/sw-template.js).
 *
 * Code (the built JS/CSS/HTML) is versioned per deploy, so a new version
 * takes over the next time the app opens. Art and sound live in a separate
 * cache that survives updates: served instantly from the cache, refreshed in
 * the background. After the first launch everything is downloaded once, so
 * the whole game works with no internet.
 */
const VERSION = '__VERSION__';
const CODE = `aa-code-${VERSION}`;
const MEDIA = 'aa-media';
const PRECACHE = __PRECACHE__;

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CODE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    (async () => {
      for (const key of await caches.keys()) if (key.startsWith('aa-code-') && key !== CODE) await caches.delete(key);
      await self.clients.claim();
      // Fetch every picture and sound in the background, for offline play.
      try {
        const index = await (await fetch('assets/assets.json', { cache: 'no-cache' })).json();
        const media = await caches.open(MEDIA);
        for (const { url } of [...index.images, ...index.audio]) if (!(await media.match(url, { ignoreVary: true }))) await media.add(url).catch(() => {});
      } catch {
        /* offline right now: they'll be cached as they're used */
      }
    })(),
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const isMedia = url.pathname.includes('/assets/images/') || url.pathname.includes('/assets/audio/') || url.hostname.includes('fonts.g');
  if (isMedia) {
    // Instant from the cache; refresh it in the background.
    e.respondWith(
      caches.open(MEDIA).then(async (c) => {
        const hit = await c.match(req, { ignoreVary: true });
        const fresh = fetch(req).then((r) => (r.ok || r.type === 'opaque' ? (c.put(req, r.clone()), r) : r)).catch(() => hit);
        return hit ?? fresh;
      }),
    );
    return;
  }
  if (url.origin !== location.origin) return;
  // Pages and the asset list: try the network first (for updates), fall back to the cache offline.
  if (req.mode === 'navigate' || url.pathname.endsWith('assets.json')) {
    e.respondWith(
      fetch(req)
        .then((r) => {
          const copy = r.clone();
          caches.open(CODE).then((c) => c.put(req.mode === 'navigate' ? 'index.html' : req, copy));
          return r;
        })
        .catch(async () => (await caches.match(req.mode === 'navigate' ? 'index.html' : req, { ignoreVary: true })) ?? Response.error()),
    );
    return;
  }
  // Built code (hashed file names): cache first.
  e.respondWith(caches.match(req, { ignoreVary: true }).then((hit) => hit ?? fetch(req).then((r) => (r.ok && caches.open(CODE).then((c) => c.put(req, r.clone())), r))));
});
