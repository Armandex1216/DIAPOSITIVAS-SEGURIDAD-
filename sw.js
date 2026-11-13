/* Service worker: permite abrir y presentar sin internet desde el dominio.
   Generado por tools/gen-sw.py — no editar a mano. Versión: 04ba0641b2 */
const VERSION = '04ba0641b2';
const STATIC = 'diapo-static-' + VERSION, DATA = 'diapo-nube';
const FILES = [
"./",
"blanco.html",
"csst-noviembre-2026.html",
"diario.html",
"favicon.ico",
"gum-octubre-2026.html",
"gum.html",
"index.html",
"riesgos-corp.html",
"riesgos-opt.html",
"assets/css/deck.css",
"assets/css/tpl.css",
"assets/fonts/montserrat-latin-400-normal.woff2",
"assets/fonts/montserrat-latin-500-normal.woff2",
"assets/fonts/montserrat-latin-600-normal.woff2",
"assets/fonts/montserrat-latin-700-normal.woff2",
"assets/fonts/montserrat-latin-800-normal.woff2",
"assets/fonts/montserrat-latin-900-normal.woff2",
"assets/fonts/montserrat-latin-ext-400-normal.woff2",
"assets/fonts/oswald-latin-600-normal.woff2",
"assets/fonts/oswald-latin-700-normal.woff2",
"assets/fonts/oswald-latin-ext-600-normal.woff2",
"assets/fonts/oswald-latin-ext-700-normal.woff2",
"assets/icons/favicon.svg",
"assets/icons/icon-180.png",
"assets/icons/icon-192.png",
"assets/icons/icon-32.png",
"assets/icons/icon-512.png",
"assets/img/ev-atp01-antes.jpg",
"assets/img/ev-atp01-durante.jpg",
"assets/img/ev-inc09-durante.jpg",
"assets/img/ev-inc09-impacto.jpg",
"assets/img/ev-inc10-antes.jpg",
"assets/img/ev-inc10-durante.jpg",
"assets/img/logo-hochschild-blanco.png",
"assets/img/logo-hochschild.png",
"assets/img/logo-mark.png",
"assets/img/mascota.png",
"assets/img/portada.jpg",
"assets/img/diario/fondo-momento.jpg",
"assets/img/diario/minero-ref.png",
"assets/img/diario/portada-diario.jpg",
"assets/img/diario/2026-11-12/decreto-articulo.jpg",
"assets/img/diario/2026-11-12/decreto.jpg",
"assets/img/diario/2026-11-12/evento-antes.jpg",
"assets/img/diario/2026-11-12/evento-despues.jpg",
"assets/img/diario/2026-11-12/evento-durante.jpg",
"assets/img/diario/2026-11-12/hallazgo-1.jpg",
"assets/img/diario/2026-11-12/hallazgo-2.jpg",
"assets/img/diario/2026-11-12/hallazgo-3.jpg",
"assets/img/diario/2026-11-12/hallazgo-4.jpg",
"assets/img/diario/2026-11-12/hallazgo-5.jpg",
"assets/img/diario/2026-11-12/momento-1.jpg",
"assets/img/diario/2026-11-12/momento-2.jpg",
"assets/img/diario/2026-11-13/hallazgo-1.jpg",
"assets/img/diario/2026-11-13/hallazgo-2.jpg",
"assets/js/charts.js",
"assets/js/cloud.js",
"assets/js/csst-build.js",
"assets/js/csst.js",
"assets/js/deck.js",
"assets/js/editor.js",
"assets/js/gum-build.js",
"assets/js/gum.js",
"assets/js/miner-ref.js",
"assets/js/miner3d.js",
"assets/js/tpl.js",
"assets/lib/MotionPathPlugin.min.js",
"assets/lib/chart.umd.min.js",
"assets/lib/chartjs-plugin-datalabels.min.js",
"assets/lib/gsap.min.js",
"assets/lib/supabase.min.js",
"assets/lib/three.min.js",
"data/catalogo.js",
"data/csst-2026-11-cambios.js",
"data/gum-2026-10-cambios.js",
"data/gum-data.js",
"data/nube.js"
];

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
