/* Service worker: permite abrir y presentar sin internet desde el dominio.
   Generado por tools/gen-sw.py — no editar a mano. Versión: __VERSION__ */
const VERSION = '__VERSION__';
const STATIC = 'diapo-static-' + VERSION, DATA = 'diapo-nube';
const FILES = __FILES__;

self.addEventListener('install', e => {
  e.waitUntil(caches.open(STATIC).then(c => Promise.all(FILES.map(f => c.add(new Request(f, { cache: 'reload' })).catch(() => null)))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('diapo-static-') && k !== STATIC).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

const timeout = (p, ms) => Promise.race([p, new Promise((_, r) => setTimeout(() => r(new Error('timeout')), ms))]);

self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // datos de la nube (Supabase): primero la red; sin internet, la última copia guardada
  if (/\.supabase\.co$/.test(url.hostname) && url.pathname.startsWith('/rest/v1/diapo_')) {
    e.respondWith(caches.open(DATA).then(async c => {
      try { const r = await timeout(fetch(req), 6000); if (r.ok) c.put(req, r.clone()); return r; }
      catch (err) { const m = await c.match(req); if (m) return m; throw err; }
    }));
    return;
  }
  if (url.origin !== location.origin) return;
  // páginas: primero la red (para ver la última versión); sin internet, la copia guardada
  if (req.mode === 'navigate' || url.pathname.endsWith('.html') || url.pathname === '/') {
    e.respondWith((async () => {
      const c = await caches.open(STATIC);
      try { const r = await timeout(fetch(req), 4000); if (r.ok) c.put(req, r.clone()); return r; }
      catch (err) { return (await c.match(req, { ignoreSearch: true })) || (await c.match(url.pathname === '/' ? './' : 'index.html')) || Response.error(); }
    })());
    return;
  }
  // archivos (js, css, imágenes, fuentes): copia guardada al instante y se actualiza en segundo plano
  e.respondWith((async () => {
    // versión exacta (con ?v=) primero; si no está, la red; sin internet, cualquier versión guardada
    const c = await caches.open(STATIC), hit = await c.match(req);
    if (hit) { fetch(req).then(r => { if (r.ok) c.put(req, r.clone()); }).catch(() => {}); return hit; }
    try { const r = await timeout(fetch(req), 8000); if (r.ok) c.put(req, r.clone()); return r; }
    catch (err) { return (await c.match(req, { ignoreSearch: true })) || Response.error(); }
  })());
});
