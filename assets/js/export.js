/* ==========================================================
   Descargas de respaldo:
   1) Paquete sin internet (.zip): la presentación completa (animaciones, Lucho, video, fotos)
      en una carpeta que se abre con doble clic en Edge/Chrome, sin internet y sin la nube.
   2) PowerPoint (.pptx): una lámina por diapositiva (imagen en alta), con el video incrustado,
      transiciones y el guion de Lucho en las notas.
   ========================================================== */
(function () {
  'use strict';
  const D = window.DECK; if (!D || D.exportMenu) return;
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const B = D.root || '';
  const slug = s => String(s || 'presentacion').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\w]+/g, '_').replace(/^_|_$/g, '').slice(0, 70) || 'presentacion';
  const deckTitle = () => (document.title || 'Presentación').replace(/\s+/g, ' ').trim();
  const deckDate = () => { const el = $('[data-fecha]'); return el ? el.textContent.trim().replace(/\//g, '-') : ''; };
  const fileBase = () => slug(deckTitle() + (deckDate() ? '_' + deckDate() : ''));
  const blobToDataURL = b => new Promise((ok, ko) => { const r = new FileReader(); r.onload = () => ok(r.result); r.onerror = ko; r.readAsDataURL(b); });
  const dataURLToBlob = u => { const [h, d] = u.split(','); const bin = atob(d); const a = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i); return new Blob([a], { type: (h.match(/data:([^;]+)/) || [])[1] || 'application/octet-stream' }); };
  const extOf = type => ({ 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif', 'image/svg+xml': 'svg', 'video/webm': 'webm', 'video/quicktime': 'mov' }[type] || (/^video/.test(type) ? 'mp4' : 'jpg'));
  const save = (blob, name) => { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 4000); };

  /* ---------- ventana de progreso ---------- */
  let ov = null;
  const prog = (t, pct) => { if (!ov) { ov = document.createElement('div'); ov.className = 'xp-ov'; ov.setAttribute('data-noedit', ''); ov.innerHTML = '<div class="xp-box"><b class="xp-t"></b><div class="xp-bar"><i></i></div><small>No cierre esta pestaña mientras se prepara la descarga.</small></div>'; document.body.appendChild(ov); }
    $('.xp-t', ov).textContent = t; if (pct != null) $('.xp-bar i', ov).style.width = Math.max(2, Math.min(100, pct)) + '%'; };
  const done = () => { ov && ov.remove(); ov = null; };

  /* ---------- menú ---------- */
  D.exportMenu = () => {
    const m = document.createElement('div'); m.className = 'xp-ov'; m.setAttribute('data-noedit', '');
    m.innerHTML = `<div class="xp-box xp-menu"><button class="xp-x" title="Cerrar">✕</button><b>⬇ Descargar respaldo</b>
      <button class="xp-op" data-x="zip"><span>📦</span><div><strong>Paquete sin internet (.zip)</strong><small>Igualito a como se ve aquí: animaciones, Lucho, fotos y video. Se descomprime y se abre con doble clic en Edge o Chrome. No necesita internet ni la nube.</small></div></button>
      <button class="xp-op" data-x="pptx"><span>📊</span><div><strong>PowerPoint (.pptx)</strong><small>Una lámina por diapositiva en alta calidad, con el video incrustado, transiciones y el guion de Lucho en las notas. Ideal como respaldo para abrir en PowerPoint.</small></div></button>
      <p class="xp-note">Consejo: si la presentación tiene un video, ábralo primero en esta PC (o elíjalo del equipo) para que se incluya en la descarga.</p></div>`;
    document.body.appendChild(m);
    m.addEventListener('click', async e => { if (e.target === m || e.target.closest('.xp-x')) return m.remove(); const b = e.target.closest('[data-x]'); if (!b) return; m.remove();
      try { if (b.dataset.x === 'zip') await exportZip(); else await exportPptx(); } catch (err) { console.error(err); done(); D.toast('No se pudo preparar la descarga: ' + (err.message || err), 7000); } });
  };

  /* ---------- datos comunes: fotos y videos de la presentación ---------- */
  async function snapshotStore() {
    const st = JSON.parse(JSON.stringify(D.store)); const files = []; let n = 0;
    const imgs = st.images || {};
    for (const k of Object.keys(imgs)) { let v = imgs[k]; if (typeof v !== 'string' || !v) continue;
      if (v.startsWith('dbimg:')) v = D.resolveImg ? await D.resolveImg(v) : null;
      if (v && v.startsWith('data:')) { const bl = dataURLToBlob(v), name = `fotos/${String(++n).padStart(3, '0')}_${slug(k)}.${extOf(bl.type)}`; files.push([name, bl]); imgs[k] = name; }
      else if (!v) delete imgs[k]; }
    // videos: la copia de este equipo, o se descarga del enlace directo si es posible
    const vids = []; st.meta = st.meta || {}; const mv = st.meta.videos = Object.assign({}, st.meta.videos || {});
    for (const box of $$('.vslot')) { const k = box.dataset.vslot; let blob = await D.vBlob(k);
      const link = mv[k];
      if (!blob && link && typeof link === 'object' && link.parts) { try { const parts = []; for (const u of link.parts) { const r = await fetch(u); parts.push(await r.blob()); } blob = new Blob(parts, { type: link.type || 'video/mp4' }); } catch (e) { } }
      if (!blob && typeof link === 'string' && /\.(mp4|webm|mov)(\?|$)|supabase\.co\/storage/i.test(link)) { try { const r = await fetch(link); if (r.ok) blob = await r.blob(); } catch (e) { } }
      if (blob) { const name = `video/${slug(k)}.${extOf(blob.type || 'video/mp4')}`; files.push([name, blob]); mv[k] = name; vids.push({ k, name, blob }); }
      else if (link) vids.push({ k, link, missing: true }); }
    return { st, files, vids };
  }

  /* ---------- 1) paquete sin internet ---------- */
  async function exportZip() {
    prog('Preparando el paquete…', 3);
    await D.loadScript('assets/lib/jszip.min.js');
    const zip = new JSZip(), base = fileBase(), root = zip.folder(base);
    // archivos de la aplicación (los mismos que guarda el modo sin internet)
    const sw = await (await fetch(B + 'sw.js', { cache: 'no-cache' })).text();
    const list = [...new Set((sw.match(/"assets\/[^"]+"/g) || []).map(x => x.slice(1, -1)))].filter(f => !/supabase|cloud\.js|pptxgen|jszip|html-to-image|export\.js/.test(f));
    let i = 0;
    for (const f of list) { prog('Copiando archivos de la presentación…', 5 + 45 * (i++ / list.length)); try { const r = await fetch(B + f); if (r.ok) root.file(f, await r.blob()); } catch (e) { } }
    try { const r = await fetch(B + 'favicon.ico'); if (r.ok) root.file('favicon.ico', await r.blob()); } catch (e) { }
    prog('Juntando fotos y videos…', 52);
    const { st, files, vids } = await snapshotStore();
    files.forEach(([n, b]) => root.file(n, b, { compression: 'STORE' }));
    // la página: sin nube ni service worker, con los datos incluidos
    const page = location.pathname.split('/').pop() || 'index.html';
    let html = await (await fetch(B + page, { cache: 'no-cache' })).text();
    const id = new URLSearchParams(location.search).get('d') || document.body.dataset.deck;
    html = html.replace(/<script src="data\/nube\.js[^>]*><\/script>/, '').replace(/<script>if\(window\.NUBE[^<]*<\/script>/, '')
      .replace(/<script src="assets\/lib\/supabase\.min\.js[^>]*><\/script>\s*/, '').replace(/<script src="assets\/js\/cloud\.js[^>]*><\/script>\s*/, '')
      .replace(/<script>if\("serviceWorker"[\s\S]*?<\/script>/, '').replace(/(\.(?:css|js))\?v=[\w.]+/g, '$1')
      .replace(/<body([^>]*?)data-deck="[^"]*"/, `<body$1data-deck="${id}"`)
      .replace('<script src="assets/lib/gsap.min.js"></script>', `<script>window.DECK_EDITS={${JSON.stringify(id)}:${JSON.stringify(st).replace(/</g, '\\u003c')}};window.DECK_OFFLINE=true;</script>\n<script src="assets/lib/gsap.min.js"></script>`);
    root.file('ABRIR_PRESENTACION.html', html);
    root.file('LEEME_como_abrir.txt', [
      'PRESENTACIÓN SIN INTERNET — ' + deckTitle(), '',
      '1. Haga clic derecho en el archivo .zip y elija «Extraer todo…» (no la abra desde dentro del .zip).',
      '2. Entre a la carpeta y abra «ABRIR_PRESENTACION.html» con doble clic (mejor en Microsoft Edge o Google Chrome).',
      '3. Presione F para pantalla completa. Flechas o clic para avanzar. L = modo proyector.', '',
      'Funciona sin internet: animaciones, Lucho, fotos' + (vids.some(v => !v.missing) ? ' y video' : '') + '.',
      'Si edita algo aquí, se guarda solo en esta PC (no se sube a la nube).',
      vids.some(v => v.missing) ? '\nOJO: un video es un enlace (YouTube/Drive/OneDrive) y no se pudo incluir; para verlo hace falta internet.' : ''].join('\r\n'));
    prog('Comprimiendo…', 60);
    const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } }, m => prog('Comprimiendo…', 60 + m.percent * .38));
    save(blob, base + '.zip'); done();
    D.toast('📦 Paquete listo (' + (blob.size / 1048576).toFixed(1) + ' MB). Extráigalo y abra «ABRIR_PRESENTACION.html».' + (vids.some(v => v.missing) ? ' El video de enlace no se pudo incluir.' : ''), 8000);
  }

  /* ---------- 2) PowerPoint ---------- */
  async function exportPptx() {
    prog('Preparando el PowerPoint…', 2);
    await D.loadScript('assets/lib/pptxgen.bundle.js'); await D.loadScript('assets/lib/html-to-image.min.js');
    const { vids } = await snapshotStore().catch(() => ({ vids: [] }));
    const slides = D.slides.filter(s => !s.hasAttribute('data-hidden') && !(D.store.hidden || {})[s.id] && getComputedStyle(s).display !== 'none' || s.classList.contains('active'));
    D.print(true); await new Promise(r => setTimeout(r, 1500)); // todas las láminas quietas, como en el PDF
    const pptx = new PptxGenJS(); pptx.layout = 'LAYOUT_WIDE'; pptx.title = deckTitle(); pptx.company = 'Hochschild Mining';
    const W = 13.333, H = 7.5, K = W / 1920;
    const vis = D.slides.filter(s => getComputedStyle(s).display !== 'none');
    const fontCss = await htmlToImage.getFontEmbedCSS(document.querySelector(".stage")).catch(() => undefined);
    for (let i = 0; i < vis.length; i++) { const sl = vis[i]; prog(`Lámina ${i + 1} de ${vis.length}…`, 5 + 85 * i / vis.length);
      const boxes = $$('.vslot', sl).map(b => ({ b, r: rectIn(b, sl) }));
      boxes.forEach(o => o.b.style.visibility = 'hidden');
      let png; try { png = await htmlToImage.toJpeg(sl, { width: 1920, height: 1080, pixelRatio: 1.5, quality: .92, fontEmbedCSS: fontCss, cacheBust: false, imagePlaceholder: 'data:image/gif;base64,R0lGODlhAQABAAAAACw=', style: { transform: 'none', left: '0', top: '0', margin: '0' }, filter: n => !(n.classList && (n.classList.contains('ui') || n.classList.contains('vs-print') || n.classList.contains('lv-ctrl') || n.classList.contains('lv-edit') || n.classList.contains('paste-hint'))) && !(n.tagName === 'IMG' && !n.getAttribute('src')) }); }
      finally { boxes.forEach(o => o.b.style.visibility = ''); }
      const s = pptx.addSlide(); s.background = { color: 'FFFFFF' }; s.addImage({ data: png, x: 0, y: 0, w: W, h: H });
      for (const o of boxes) { const v = vids.find(x => x.k === o.b.dataset.vslot && x.blob);
        if (v && v.blob.size < 400 * 1048576) { const data = await blobToDataURL(v.blob); s.addMedia({ type: 'video', data, x: o.r.x * K, y: o.r.y * K, w: o.r.w * K, h: o.r.h * K, extn: v.name.split('.').pop() }); }
        else { const l = (D.store.meta.videos || {})[o.b.dataset.vslot]; if (typeof l === 'string' && /^https?:/.test(l)) s.addText('▶ Ver video', { x: o.r.x * K, y: (o.r.y + o.r.h / 2) * K - .3, w: o.r.w * K, h: .6, align: 'center', fontSize: 24, bold: true, color: 'FFFFFF', fill: { color: '1A1917' }, hyperlink: { url: l } }); } }
      const lucho = sl.matches('#d-aprendamos,[data-base="d-aprendamos"]') && ((D.store.meta || {}).lucho || {}).esc;
      const notes = [sl.dataset.title || '', lucho && lucho.length ? 'Guion de Lucho:\n' + lucho.map((e, j) => `${j + 1}. ${e.t || ''}`).join('\n') : ''].filter(Boolean).join('\n\n');
      if (notes) s.addNotes(notes);
    }
    prog('Armando el archivo…', 92);
    let ab = await pptx.write({ outputType: 'arraybuffer' });
    // transición suave entre láminas
    try { const z = await JSZip.loadAsync(ab); const names = Object.keys(z.files).filter(n => /^ppt\/slides\/slide\d+\.xml$/.test(n));
      for (const n of names) { let x = await z.file(n).async('string'); if (!/<p:transition/.test(x)) { const tr = '<p:transition spd="med"><p:fade/></p:transition>'; x = /<\/p:clrMapOvr>/.test(x) ? x.replace('</p:clrMapOvr>', '</p:clrMapOvr>' + tr) : x.replace(/<p:timing|<\/p:sld>/, m => tr + m); z.file(n, x); } }
      ab = await z.generateAsync({ type: 'arraybuffer', compression: 'DEFLATE' }); } catch (e) { console.warn('transiciones', e); }
    const blob = new Blob([ab], { type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' });
    save(blob, fileBase() + '.pptx'); done();
    D.toast('📊 PowerPoint listo (' + (blob.size / 1048576).toFixed(1) + ' MB).' + (vids.some(v => v.missing) ? ' El video es un enlace: en el PowerPoint va un botón «Ver video».' : ''), 7000);
    setTimeout(() => location.reload(), 1200);
  }
  function rectIn(el, sl) { let x = 0, y = 0, e = el; while (e && e !== sl) { x += e.offsetLeft; y += e.offsetTop; e = e.offsetParent; } return { x, y, w: el.offsetWidth, h: el.offsetHeight }; }

  const css = document.createElement('style'); css.textContent = `
.xp-ov{position:fixed;inset:0;z-index:10000;background:rgba(14,13,11,.6);display:grid;place-items:center;font-family:Montserrat,sans-serif}
.xp-box{position:relative;width:min(560px,92vw);background:#fffdf8;border-radius:20px;padding:24px 26px;box-shadow:0 30px 80px -30px rgba(0,0,0,.7);display:flex;flex-direction:column;gap:12px}
.xp-box>b{font-size:20px;color:#1a1917}.xp-box small{color:#7d776b;font-size:12.5px;line-height:1.45}
.xp-bar{height:12px;border-radius:99px;background:#efe6d2;overflow:hidden}.xp-bar i{display:block;height:100%;width:2%;background:linear-gradient(90deg,#e2be6a,#c39531);transition:width .3s}
.xp-op{display:flex;gap:14px;align-items:flex-start;text-align:left;border:1px solid #eee3cc;background:#fff;border-radius:14px;padding:14px;cursor:pointer;font-family:inherit;transition:transform .15s,box-shadow .2s}
.xp-op:hover{transform:translateY(-2px);box-shadow:0 12px 24px -16px rgba(120,90,20,.6)}.xp-op>span{font-size:30px}.xp-op strong{display:block;font-size:16px;color:#1a1917;margin-bottom:3px}
.xp-note{margin:0;font-size:12px;color:#8d8a83}.xp-x{position:absolute;right:14px;top:14px;border:0;background:#efe6d2;border-radius:9px;width:30px;height:30px;cursor:pointer}`;
  document.head.appendChild(css);
})();
