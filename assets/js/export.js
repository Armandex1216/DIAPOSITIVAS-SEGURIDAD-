/* ==========================================================
   Descargar la presentación como UN SOLO ARCHIVO (.html) que se abre con doble clic:
   todo va adentro (animaciones, Lucho, letras, fotos y el video), sin internet, sin la nube,
   sin descomprimir nada. Se descarga, se abre y listo.
   ========================================================== */
(function () {
  'use strict';
  const D = window.DECK; if (!D || D.exportMenu) return;
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const B = D.root || '';
  const MAXV = 300 * 1048576; // videos hasta 300 MB van dentro del archivo
  const slug = s => String(s || 'presentacion').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\w]+/g, '_').replace(/^_|_$/g, '').slice(0, 70) || 'presentacion';
  const deckTitle = () => (document.title || 'Presentación').replace(/\s+/g, ' ').trim();
  const deckDate = () => { const el = $('[data-fecha]'); return el ? el.textContent.trim().replace(/\//g, '-') : ''; };
  const fileBase = () => slug(deckTitle() + (deckDate() ? '_' + deckDate() : ''));
  const blobToDataURL = b => new Promise((ok, ko) => { const r = new FileReader(); r.onload = () => ok(r.result); r.onerror = ko; r.readAsDataURL(b); });
  const save = (blob, name) => { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 6000); };
  const MIME = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', gif: 'image/gif', svg: 'image/svg+xml', woff2: 'font/woff2', ico: 'image/x-icon' };

  let ov = null;
  const prog = (t, pct) => { if (!ov) { ov = document.createElement('div'); ov.className = 'xp-ov'; ov.setAttribute('data-noedit', ''); ov.innerHTML = '<div class="xp-box"><b class="xp-t"></b><div class="xp-bar"><i></i></div><small>Preparando un solo archivo con todo adentro. No cierre esta pestaña.</small></div>'; document.body.appendChild(ov); }
    $('.xp-t', ov).textContent = t; if (pct != null) $('.xp-bar i', ov).style.width = Math.max(2, Math.min(100, pct)) + '%'; };
  const done = () => { ov && ov.remove(); ov = null; };

  D.exportMenu = () => exportFile().catch(err => { console.error(err); done(); D.toast('No se pudo preparar la descarga: ' + (err.message || err), 7000); });

  const cache = new Map();
  function dataURL(path) {
    const p = path.replace(/[?#].*$/, ''); if (cache.has(p)) return cache.get(p);
    const pr = (async () => { const r = await fetch(B + p); if (!r.ok) return null; const bl = await r.blob(); const ext = (p.split('.').pop() || '').toLowerCase();
      return blobToDataURL(MIME[ext] ? new Blob([bl], { type: MIME[ext] }) : bl); })().catch(() => null);
    cache.set(p, pr); return pr;
  }
  const IMG_RE = /assets\/[\w./-]+?\.(?:png|jpe?g|webp|gif|svg)(?:\?v=[\w.]+)?/g;
  async function inlineImages(text) {
    for (const f of [...new Set(text.match(IMG_RE) || [])]) { const u = await dataURL(f); if (u) text = text.split(f).join(u); }
    return text;
  }
  async function inlineCss(href) {
    const p = href.replace(/[?#].*$/, ''), dir = p.replace(/[^/]*$/, '');
    let css = await (await fetch(B + p)).text();
    for (const u of [...new Set(css.match(/url\((?!["']?data:)[^)]+\)/g) || [])]) { const raw = u.slice(4, -1).replace(/^["']|["']$/g, ''); const abs = new URL(raw, 'http://x/' + dir).pathname.slice(1); const d = await dataURL(abs); if (d) css = css.split(u).join(`url(${d})`); }
    return css.replace(/<\/style/gi, '<\\/style');
  }

  async function exportFile() {
    prog('Preparando la presentación…', 3);
    const page = location.pathname.split('/').pop() || 'index.html';
    const id = new URLSearchParams(location.search).get('d') || document.body.dataset.deck;
    let html = await (await fetch(B + page, { cache: 'no-cache' })).text();
    html = html.replace(/<script src="data\/nube\.js[^>]*><\/script>/, '').replace(/<script>if\(window\.NUBE[^<]*<\/script>/, '')
      .replace(/<script src="assets\/lib\/supabase\.min\.js[^>]*><\/script>\s*/, '').replace(/<script src="assets\/js\/cloud\.js[^>]*><\/script>\s*/, '')
      .replace(/<script>if\("serviceWorker"[\s\S]*?<\/script>/, '').replace(/<link rel="(?:icon|apple-touch-icon)"[^>]*>/g, '')
      .replace(/<body([^>]*?)data-deck="[^"]*"/, `<body$1data-deck="${id}"`);
    const links = html.match(/<link rel="stylesheet" href="[^"]+">/g) || []; let i = 0;
    for (const l of links) { prog('Juntando estilos y letras…', 5 + 15 * (i++ / links.length)); const css = await inlineCss(l.match(/href="([^"]+)"/)[1]); html = html.replace(l, () => `<style>${css}</style>`); }
    const scripts = html.match(/<script src="[^"]+"><\/script>/g) || []; i = 0;
    for (const s of scripts) { prog('Juntando animaciones y a Lucho…', 20 + 35 * (i++ / scripts.length)); const src = s.match(/src="([^"]+)"/)[1].replace(/[?#].*$/, '');
      const js = (await inlineImages(await (await fetch(B + src)).text())).replace(/<\/script/gi, '<\\/script');
      html = html.replace(s, () => `<script>/* ${src} */\n${js}\n</script>`); }
    prog('Juntando fotos…', 58);
    const st = JSON.parse(JSON.stringify(D.store)); const imgs = st.images || {};
    for (const k of Object.keys(imgs)) { let v = imgs[k]; if (typeof v !== 'string' || !v) { delete imgs[k]; continue; }
      if (v.startsWith('dbimg:')) { v = D.resolveImg ? await D.resolveImg(v) : null; if (v) imgs[k] = v; else delete imgs[k]; }
      else if (/^assets\//.test(v)) { const u = await dataURL(v); if (u) imgs[k] = u; } }
    st.meta = st.meta || {}; const mv = st.meta.videos = Object.assign({}, st.meta.videos || {});
    const vids = [], extra = [];
    for (const box of $$('.vslot')) { const k = box.dataset.vslot; prog('Juntando el video…', 64);
      let blob = await D.vBlob(k); const link = mv[k];
      if (!blob && link && typeof link === 'object' && link.parts) { try { const parts = []; for (const u of link.parts) parts.push(await (await fetch(u)).blob()); blob = new Blob(parts, { type: link.type || 'video/mp4' }); } catch (e) { } }
      if (!blob && typeof link === 'string' && /\.(mp4|webm|mov)(\?|$)|supabase\.co\/storage/i.test(link)) { try { const r = await fetch(link); if (r.ok) blob = await r.blob(); } catch (e) { } }
      if (blob && blob.size <= MAXV) { vids.push({ k, type: blob.type || 'video/mp4', b64: (await blobToDataURL(blob)).split(',')[1] }); delete mv[k]; }
      else if (blob) { const name = `${fileBase()}_video_${slug(k)}.${/webm/.test(blob.type) ? 'webm' : 'mp4'}`; extra.push([blob, name]); mv[k] = name; }
      else if (link) vids.push({ k, missing: true }); }
    html = await inlineImages(html);
    let voz = {}; if (D.lucho && D.lucho.bundle) { prog('Guardando la voz de Lucho…', 90); try { voz = await D.lucho.bundle(); } catch (e) { } }
    const ico = await dataURL('assets/icons/favicon.svg');
    const pre = `<link rel="icon" href="${ico || ''}"><script>document.documentElement.classList.add('offline-pkg');window.DECK_OFFLINE=true;window.DECK_EDITS={${JSON.stringify(id)}:${JSON.stringify(st).replace(/</g, '\\u003c')}};window.LUCHO_AUDIO=${JSON.stringify(voz)};</script>` +
      vids.filter(v => v.b64).map(v => `<script type="text/plain" id="vid-${v.k}">${v.b64}</script><script>(function(){try{var s=document.getElementById(${JSON.stringify('vid-' + v.k)}),b=atob(s.textContent),n=b.length,a=new Uint8Array(n);for(var i=0;i<n;i++)a[i]=b.charCodeAt(i);s.remove();var m=window.DECK_EDITS[${JSON.stringify(id)}].meta;m.videos=m.videos||{};m.videos[${JSON.stringify(v.k)}]=URL.createObjectURL(new Blob([a],{type:${JSON.stringify(v.type)}}));}catch(e){console.warn(e)}})();</script>`).join('');
    html = html.replace(/<body([^>]*)>/, m => m + pre);
    prog('Listo, descargando…', 98);
    const name = fileBase() + '.html', blob = new Blob([html], { type: 'text/html' });
    save(blob, name); extra.forEach(([b, n], j) => setTimeout(() => save(b, n), 1500 * (j + 1)));
    done();
    D.toast('✅ Descargado «' + name + '» (' + (blob.size / 1048576).toFixed(1) + ' MB). Ábralo con doble clic: funciona sin internet.' +
      (extra.length ? ' El video era muy grande y se bajó aparte: guárdelo en la MISMA carpeta que el archivo.' : '') + (vids.some(v => v.missing) ? ' El video es un enlace (YouTube/SharePoint): ese necesita internet.' : ''), 9000);
  }

  const css = document.createElement('style'); css.textContent = `
.xp-ov{position:fixed;inset:0;z-index:10000;background:rgba(14,13,11,.6);display:grid;place-items:center;font-family:Montserrat,sans-serif}
.xp-box{position:relative;width:min(520px,92vw);background:#fffdf8;border-radius:20px;padding:24px 26px;box-shadow:0 30px 80px -30px rgba(0,0,0,.7);display:flex;flex-direction:column;gap:12px}
.xp-box>b{font-size:19px;color:#1a1917}.xp-box small{color:#7d776b;font-size:12.5px;line-height:1.45}
.xp-bar{height:12px;border-radius:99px;background:#efe6d2;overflow:hidden}.xp-bar i{display:block;height:100%;width:2%;background:linear-gradient(90deg,#e2be6a,#c39531);transition:width .3s}`;
  document.head.appendChild(css);
})();
