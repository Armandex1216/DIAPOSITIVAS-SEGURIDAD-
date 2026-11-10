/* ==========================================================
   Editor tipo Canva: formato de texto, insertar elementos,
   tablas con filas/columnas, láminas nuevas y duplicadas.
   Requiere deck.js y charts.js. Todo se guarda en DECK.store
   (y con cloud.js, en la nube).
   ========================================================== */
(function () {
  'use strict';
  const D = window.DECK; if (!D) return;
  const $ = D.$, $$ = D.$$, store = D.store, body = document.body;
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  let tSave = null; const saveSoon = () => { clearTimeout(tSave); tSave = setTimeout(() => D.persist(), 500); };
  const cur = () => D.slides[D.i];
  const goReload = n => { D.persist(); setTimeout(() => { location.hash = '#' + (n + 1); location.reload(); }, 250); };
  try { document.execCommand('styleWithCSS', false, true); } catch (e) { }

  /* ================= barra de formato ================= */
  const COLORS = ['#1a1917', '#ffffff', '#c39531', '#9a7422', '#1f9d5c', '#d23c3c', '#e6a316', '#2f6db5', '#6b46c1', '#8d8a83'];
  const bar = document.createElement('div'); bar.className = 'rt-bar'; bar.setAttribute('data-noedit', '');
  bar.innerHTML = `
    <button data-c="bold" title="Negrita (Ctrl+B)"><b>N</b></button><button data-c="italic" title="Cursiva (Ctrl+I)"><i>K</i></button><button data-c="underline" title="Subrayado (Ctrl+U)"><u>S</u></button><button data-c="strikeThrough" title="Tachado"><s>ab</s></button>
    <span class="sep"></span>
    <select data-c="size" title="Tamaño de letra"><option value="">Tamaño</option><option value=".6">Muy pequeño</option><option value=".8">Pequeño</option><option value="1">Normal</option><option value="1.25">Grande</option><option value="1.6">Muy grande</option><option value="2.2">Enorme</option></select>
    <button data-c="smaller" title="Achicar letra">A−</button><button data-c="bigger" title="Agrandar letra">A+</button>
    <span class="sep"></span>
    <div class="dd"><button data-dd="fc" title="Color de letra"><span class="ic-a">A</span><i class="bar-c" style="background:#d23c3c"></i></button><div class="pal" data-pal="foreColor">${COLORS.map(c => `<i style="background:${c}" data-col="${c}"></i>`).join('')}<label title="Otro color"><input type="color" data-colin="foreColor" value="#c39531">+</label></div></div>
    <div class="dd"><button data-dd="hl" title="Resaltar"><span class="ic-hl">ab</span></button><div class="pal" data-pal="hiliteColor"><i style="background:transparent" data-col="transparent" class="none" title="Sin resaltado">×</i>${['#fff3b8', '#d5f2e0', '#fbe1e1', '#dbe8fa', '#f2e6c8', '#c39531', '#1a1917'].map(c => `<i style="background:${c}" data-col="${c}"></i>`).join('')}</div></div>
    <span class="sep"></span>
    <button data-c="justifyLeft" title="Alinear a la izquierda">⯇</button><button data-c="justifyCenter" title="Centrar">≡</button><button data-c="justifyRight" title="Alinear a la derecha">⯈</button>
    <button data-c="insertUnorderedList" title="Viñetas">•≡</button>
    <button data-c="removeFormat" title="Quitar formato">⌫ Formato</button>
    <span class="sep tb-only"></span>
    <span class="tb-only tb-g"><button data-t="row+" title="Agregar fila debajo">+ Fila</button><button data-t="row-" title="Quitar esta fila">− Fila</button><button data-t="col+" title="Agregar columna a la derecha">+ Col</button><button data-t="col-" title="Quitar esta columna">− Col</button><select data-t="fill" title="Color de la celda"><option value="">Color celda</option><option value="none">Sin color</option><option value="ok">Verde</option><option value="warn">Amarillo</option><option value="bad">Rojo</option><option value="gold">Dorado</option><option value="dark">Oscuro</option></select></span>`;
  document.body.appendChild(bar);
  let lastEd = null, savedRange = null;
  const activeEd = () => { const a = document.activeElement; return a && a.isContentEditable ? a.closest('[contenteditable="true"]') : null; };
  const keepSel = () => { const s = getSelection(); if (s.rangeCount && lastEd && lastEd.contains(s.anchorNode)) savedRange = s.getRangeAt(0).cloneRange(); };
  const restoreSel = () => { if (!savedRange || !lastEd) return; lastEd.focus(); const s = getSelection(); s.removeAllRanges(); s.addRange(savedRange); };
  document.addEventListener('selectionchange', () => { if (D.editing() && activeEd()) { lastEd = activeEd(); keepSel(); showBar(); } });
  document.addEventListener('focusin', e => { if (D.editing() && e.target.isContentEditable) { lastEd = e.target.closest('[contenteditable="true"]'); showBar(); } });
  document.addEventListener('focusout', () => setTimeout(() => { if (!bar.contains(document.activeElement) && !activeEd()) bar.classList.remove('on'); }, 200));
  function showBar() { if (D.moving && D.moving()) return; bar.classList.add('on'); bar.classList.toggle('in-table', !!(lastEd && lastEd.closest('[data-tbl] td, [data-tbl] th'))); }
  const changed = () => { if (!lastEd) return; lastEd.dispatchEvent(new Event('input', { bubbles: true })); const t = lastEd.closest('[data-tbl]'); if (t) saveTable(t); };
  function exec(cmd, val) { restoreSel(); document.execCommand(cmd, false, val); keepSel(); changed(); }
  function fontSize(mult, rel) {
    restoreSel(); const s = getSelection(); if (!s.rangeCount || s.isCollapsed) { D.toast('Seleccione el texto que quiere cambiar'); return; }
    document.execCommand('styleWithCSS', false, false); document.execCommand('fontSize', false, '7'); document.execCommand('styleWithCSS', false, true);
    $$('font[size="7"]', lastEd).forEach(f => { const sp = document.createElement('span'); let m = mult;
      if (rel) { const cs = parseFloat(getComputedStyle(f.parentElement).fontSize) / parseFloat(getComputedStyle(lastEd).fontSize) || 1; m = Math.max(.4, Math.min(4, cs * rel)); }
      sp.style.fontSize = m + 'em'; while (f.firstChild) sp.appendChild(f.firstChild); f.replaceWith(sp); });
    changed();
  }
  bar.addEventListener('mousedown', e => { if (!e.target.closest('select,input')) e.preventDefault(); });
  bar.addEventListener('click', e => {
    const b = e.target.closest('button,[data-col]'); if (!b) return;
    if (b.dataset.dd) { const dd = b.parentElement; $$('.dd.open', bar).forEach(x => x !== dd && x.classList.remove('open')); dd.classList.toggle('open'); return; }
    if (b.dataset.col) { const cmd = b.closest('[data-pal]').dataset.pal; exec(cmd, b.dataset.col); if (cmd === 'foreColor') $('.bar-c', bar).style.background = b.dataset.col; b.closest('.dd').classList.remove('open'); return; }
    if (b.dataset.c === 'smaller') return fontSize(0, .85);
    if (b.dataset.c === 'bigger') return fontSize(0, 1.18);
    if (b.dataset.c) return exec(b.dataset.c);
    if (b.dataset.t) return tableOp(b.dataset.t);
  });
  bar.addEventListener('change', e => {
    const t = e.target;
    if (t.dataset.c === 'size' && t.value) { fontSize(+t.value); t.value = ''; }
    if (t.dataset.colin) { exec(t.dataset.colin, t.value); $('.bar-c', bar).style.background = t.value; }
    if (t.dataset.t === 'fill') { cellFill(t.value); t.value = ''; }
  });

  /* ================= tablas: filas, columnas y color de celda ================= */
  const tblKey = t => { if (t.closest('.free')) return null; const sl = t.closest('.slide'); return sl.id + ':' + $$('[data-tbl]', sl).filter(x => !x.closest('.free')).indexOf(t); };
  function saveTable(t) {
    const fr = t.closest('.free'); const html = t.innerHTML.replace(/ contenteditable="(true|false)"/g, '');
    if (fr) { store.free[fr.dataset.fid].html = html; } else { store.tables[tblKey(t)] = html; }
    paintTable(t); saveSoon();
  }
  function paintTable(t) { // colores automáticos de avance: 100% verde, intermedio amarillo, 0% rojo (si la tabla lo pide)
    if (!t.hasAttribute('data-auto')) return;
    $$('td.pc', t).forEach(td => { const v = parseFloat(td.textContent.replace(',', '.')); td.classList.remove('c-ok', 'c-warn', 'c-bad', 'c-na');
      if (/^\s*N\/?A\s*$/i.test(td.textContent)) td.classList.add('c-na'); else if (!isNaN(v)) td.classList.add(t.dataset.auto === 'lt100-red' ? (v >= 100 ? 'c-ok' : 'c-bad') : v >= 100 ? 'c-ok' : v > 0 ? 'c-warn' : (t.dataset.auto === 'zero-red' ? 'c-bad' : 'c-none')); });
    $$('td.due', t).forEach(td => { const m = td.textContent.match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/); td.classList.remove('c-bad'); if (!m) return;
      const y = +m[3] < 100 ? 2000 + +m[3] : +m[3], d = new Date(y, +m[2] - 1, +m[1]); const row = td.closest('tr'), pc = row && $('td.pc', row);
      if (d < new Date(new Date().toDateString()) && (!pc || parseFloat(pc.textContent) < 100)) td.classList.add('c-bad'); });
  }
  function cellOf() { const s = getSelection(); const n = s.anchorNode && (s.anchorNode.nodeType === 1 ? s.anchorNode : s.anchorNode.parentElement); return (n && n.closest('[data-tbl] td, [data-tbl] th')) || (lastEd && lastEd.closest('[data-tbl] td, [data-tbl] th')); }
  function tableOp(op) {
    const cell = cellOf(); if (!cell) { D.toast('Haga clic dentro de una celda de la tabla'); return; }
    const t = cell.closest('[data-tbl]'), row = cell.parentElement, ci = [...row.children].indexOf(cell);
    if (op === 'row+') { const nr = row.cloneNode(true); $$('td,th', nr).forEach(c => { c.innerHTML = '&nbsp;'; c.className = c.className.replace(/\bc-\w+/g, '').trim(); c.contentEditable = 'true'; }); if (row.parentElement.tagName === 'THEAD') { const tb = $('tbody', t) || t; tb.prepend(nr); } else row.after(nr); }
    if (op === 'row-') { const rows = $$('tbody tr', t); if (row.parentElement.tagName === 'THEAD' || rows.length <= 1) { D.toast('La tabla necesita al menos una fila'); return; } row.remove(); }
    if (op === 'col+') { $$('tr', t).forEach(r => { const c = r.children[ci]; if (!c) return; const n = c.cloneNode(false); n.innerHTML = c.tagName === 'TH' ? 'Columna' : '&nbsp;'; n.contentEditable = 'true'; c.after(n); }); }
    if (op === 'col-') { if (row.children.length <= 1) return; $$('tr', t).forEach(r => r.children[ci] && r.children[ci].remove()); }
    saveTable(t); D.toast('Tabla actualizada');
  }
  function cellFill(v) { const cell = cellOf(); if (!cell) { D.toast('Haga clic dentro de una celda'); return; } cell.className = cell.className.replace(/\bf-\w+/g, '').trim(); if (v && v !== 'none') cell.classList.add('f-' + v); saveTable(cell.closest('[data-tbl]')); }
  // tablas de las plantillas: restaurar lo guardado
  D.slides.forEach(sl => $$('[data-tbl]', sl).filter(t => !t.closest('.free')).forEach(t => { const k = tblKey(t); if (store.tables[k] != null) t.innerHTML = store.tables[k]; paintTable(t); }));
  body.addEventListener('input', e => { const t = e.target.closest && e.target.closest('[data-tbl]'); if (t) { clearTimeout(t._s); t._s = setTimeout(() => saveTable(t), 400); } });

  /* ================= elementos libres (texto, imagen, gráfico, tabla) ================= */
  const layerOf = sl => $('.free-layer', sl) || sl.appendChild(Object.assign(document.createElement('div'), { className: 'free-layer' }));
  const KINDS = { bar: 'Barras', hbar: 'Barras horizontales', line: 'Líneas', donut: 'Dona', stack: 'Barras apiladas' };
  function chartMake(kind) {
    const pal = ['#c39531', '#2f6db5', '#1f9d5c', '#d23c3c', '#e6a316', '#6b46c1', '#8d8a83'];
    return (ctx, d) => {
      const donut = kind === 'donut', P = d.colors && d.colors.length ? d.colors : pal, ds = d.series.map((s, i) => ({ label: s.name, data: s.values, borderWidth: donut ? 4 : (kind === 'line' ? 4 : 0), borderColor: donut ? '#fff' : P[i % P.length],
        backgroundColor: donut ? s.values.map((_, j) => P[j % P.length]) : P[i % P.length], borderRadius: kind === 'line' || donut ? 0 : 8, tension: .3, pointRadius: 7, pointBackgroundColor: P[i % P.length],
        datalabels: { display: c => c.dataset.data[c.dataIndex] != null && c.dataset.data[c.dataIndex] !== 0, color: donut || kind === 'stack' ? '#fff' : '#1a1917', anchor: donut || kind === 'stack' ? 'center' : 'end', align: donut || kind === 'stack' ? 'center' : (kind === 'hbar' ? 'right' : 'top'), font: { weight: '900', size: 18 } } }));
      const cfg = { type: donut ? 'doughnut' : (kind === 'line' ? 'line' : 'bar'), data: { labels: d.labels, datasets: ds },
        options: { maintainAspectRatio: false, indexAxis: kind === 'hbar' ? 'y' : 'x', cutout: donut ? '58%' : undefined, layout: { padding: { top: 26, right: 30 } },
          plugins: { legend: { display: donut || d.series.length > 1, position: donut ? 'right' : 'top', labels: { font: { size: 18, weight: '700' }, boxWidth: 18 } } } } };
      if (!donut) cfg.options.scales = { x: HC.axis({ stacked: kind === 'stack', grid: { display: kind === 'hbar' } }), y: HC.axis({ stacked: kind === 'stack', beginAtZero: true, grid: { display: kind !== 'hbar' } }) };
      return cfg;
    };
  }
  function renderFree(fid) {
    const f = store.free[fid]; if (!f) return; const sl = document.getElementById(f.s); if (!sl) return;
    let el = $(`.free[data-fid="${fid}"]`, sl); if (el) el.remove();
    el = document.createElement('div'); el.className = 'free f' + f.t; el.dataset.fid = fid;
    if (f.t === 'text') { el.innerHTML = `<div class="ftx">${f.html || 'Escriba aquí'}</div>`; const tx = $('.ftx', el); tx.addEventListener('input', () => { f.html = tx.innerHTML; saveSoon(); }); }
    if (f.t === 'img') { el.innerHTML = `<div class="slot cover" data-slot="free-${fid}" data-ph="Pegue o elija una imagen"></div>`; }
    if (f.t === 'chart') { el.innerHTML = `<div class="chartbox"><canvas id="fc-${fid}"></canvas></div>`; }
    if (f.t === 'table') { el.innerHTML = `<table class="t tt" data-tbl ${f.auto ? 'data-auto' : ''}>${f.html}</table>`; }
    if (f.t === 'box') { el.innerHTML = `<div class="fbox" style="background:${f.bg || '#1a1917'}"><div class="ftx">${f.html || 'Comentario'}</div></div>`; const tx = $('.ftx', el); tx.addEventListener('input', () => { f.html = tx.innerHTML; saveSoon(); }); }
    layerOf(sl).appendChild(el);
    D.applyLayout(el, store.layout['free:' + fid]);
    if (f.t === 'img') D.initSlot($('.slot', el));
    if (f.t === 'chart' && window.HC) { HC.bind(f.s, 'fc-' + fid, chartMake(f.kind), f.def); HC.colorable['fc-' + fid] = f.kind === 'donut' ? 'label' : 'series'; }
    if (D.editing()) setEditable(el, true);
    return el;
  }
  function setEditable(root, on) { $$('.ftx, [data-tbl] td, [data-tbl] th', root).forEach(x => x.contentEditable = on && !(D.moving && D.moving()) ? 'true' : 'false'); }
  Object.keys(store.free).forEach(renderFree);
  D.onFreeDelete = fid => { const f = store.free[fid]; if (!f) return; delete store.free[fid]; delete store.layout['free:' + fid]; if (f.t === 'img') delete store.images['free-' + fid]; const el = $(`.free[data-fid="${fid}"]`); if (el) el.remove(); D.persist(); D.toast('Elemento eliminado'); };

  function addFree(t, extra) {
    const sl = cur(), fid = uid();
    const L = { text: { x: 160, y: 300, w: 900, h: 0 }, box: { x: 160, y: 760, w: 1600, h: 170 }, img: { x: 1100, y: 260, w: 640, h: 420 }, chart: { x: 160, y: 260, w: 1000, h: 600 }, table: { x: 120, y: 260, w: 1680, h: 0 } }[t];
    store.free[fid] = Object.assign({ s: sl.id, t }, extra || {}); store.layout['free:' + fid] = { x: L.x, y: L.y, w: L.w, h: L.h || undefined };
    const el = renderFree(fid); D.persist();
    if (t === 'chart') { D.fire(sl, 'enter'); setTimeout(() => HC.editData('fc-' + fid), 600); }
    setTimeout(() => { const tx = $('.ftx', el) || $('td', el); if (tx && D.editing()) { tx.focus(); document.execCommand('selectAll'); } }, 80);
    D.toast('Elemento agregado · use «✥ Mover» para ubicarlo y cambiar su tamaño', 3200);
  }

  /* ================= láminas ================= */
  const hasCharts = sl => !!$('canvas, .needle', sl) && !sl.dataset.extra;
  function newSlide(kind) {
    const sl = cur(), id = 'x' + uid(), n = Date.now();
    if (kind === 'blank' || kind === 'dark') { store.slides[id] = { n, after: sl.id, title: 'Título de la lámina', dark: kind === 'dark' }; return goReload(D.i + 1); }
    if (kind === 'dup') {
      if ($('canvas, .needle', sl) && !$$('canvas', sl).every(c => c.id && c.id.startsWith('fc-'))) { D.toast('Esta lámina tiene gráficos propios de la plantilla: cree una lámina en blanco e inserte un gráfico', 4200); return; }
      const baseId = store.slides[sl.id] && store.slides[sl.id].base ? store.slides[sl.id].base : (sl.dataset.extra ? null : sl.id);
      store.slides[id] = { n, after: sl.id, base: baseId, title: (sl.dataset.title || 'Lámina') + ' (copia)', dark: sl.classList.contains('dark') };
      const pre = sl.id + ':';
      for (const k of Object.keys(store.text)) if (k.startsWith(pre)) store.text[id + ':' + k.slice(pre.length)] = store.text[k];
      for (const k of Object.keys(store.layout)) if (k.startsWith(pre)) store.layout[id + ':' + k.slice(pre.length)] = store.layout[k];
      for (const k of Object.keys(store.tables)) if (k.startsWith(pre)) store.tables[id + ':' + k.slice(pre.length)] = store.tables[k];
      $$('[data-slot]', sl).forEach(s => { const base = s.dataset.slot.split('@')[0]; if (s.closest('.free')) return; if (store.images[s.dataset.slot] !== undefined) store.images[base + '@' + id] = store.images[s.dataset.slot]; else if (s.dataset.src) store.images[base + '@' + id] = s.dataset.src; });
      for (const [fid, f] of Object.entries(store.free)) if (f.s === sl.id) { const nf = uid(); store.free[nf] = JSON.parse(JSON.stringify(Object.assign({}, f, { s: id }))); if (store.layout['free:' + fid]) store.layout['free:' + nf] = store.layout['free:' + fid]; if (store.images['free-' + fid] !== undefined) store.images['free-' + nf] = store.images['free-' + fid]; if (f.t === 'chart' && store.charts['fc-' + fid]) store.charts['fc-' + nf] = store.charts['fc-' + fid]; }
      return goReload(D.i + 1);
    }
    if (kind === 'del') {
      if (!sl.dataset.extra) { store.hidden[sl.id] = true; D.persist(); D.toast('Lámina de la plantilla ocultada (se puede volver a mostrar en «Láminas»)', 3600); return goReload(Math.max(0, D.i - 1)); }
      store.slides[sl.id].removed = true; for (const [fid, f] of Object.entries(store.free)) if (f.s === sl.id) delete store.free[fid];
      return goReload(Math.max(0, D.i - 1));
    }
    if (kind === 'left' || kind === 'right') { // mover lámina creada
      if (!sl.dataset.extra) { D.toast('Solo se pueden mover las láminas creadas por usted'); return; }
      const ids = D.slides.map(s => s.id), i = D.i, j = kind === 'left' ? i - 1 : i + 1; if (j < 0 || j >= ids.length) return;
      const target = kind === 'left' ? ids[j - 1] : ids[j]; store.slides[sl.id].after = target || null; store.slides[sl.id].n = Date.now();
      if (!target) store.slides[sl.id].after = null; return goReload(j);
    }
  }

  /* ================= menú «＋ Insertar» ================= */
  const ui = $('.ui'); const ins = document.createElement('button'); ins.dataset.k = 'ins'; ins.className = 'ins-btn'; ins.textContent = '＋ Insertar'; ins.title = 'Agregar texto, imagen, gráfico, tabla o una lámina nueva';
  ui && ui.insertBefore(ins, $('[data-k=move]', ui) ? $('[data-k=move]', ui).nextSibling : null);
  const menu = document.createElement('div'); menu.className = 'ins-menu'; menu.setAttribute('data-noedit', '');
  menu.innerHTML = `<h5>En esta lámina</h5>
    <button data-i="text">🅃 Cuadro de texto</button><button data-i="box">▭ Recuadro de comentario</button><button data-i="img">🖼 Imagen</button>
    <div class="sub-ins"><span>📊 Gráfico:</span>${Object.entries(KINDS).map(([k, v]) => `<button data-i="chart" data-kind="${k}">${v}</button>`).join('')}</div>
    <button data-i="table">▦ Tabla</button>
    <h5>Láminas</h5>
    <button data-i="blank">＋ Lámina en blanco (clara)</button><button data-i="dark">＋ Lámina en blanco (oscura)</button><button data-i="dup">⧉ Duplicar esta lámina</button>
    <div class="row2"><button data-i="left" title="Mover la lámina a la izquierda">◀ Mover</button><button data-i="right" title="Mover la lámina a la derecha">Mover ▶</button></div>
    <button data-i="del" class="danger">🗑 Eliminar / ocultar esta lámina</button>`;
  document.body.appendChild(menu);
  ins.addEventListener('click', e => { e.stopPropagation(); if (!D.editing()) { $('[data-k=edit]', ui).click(); } menu.classList.toggle('on'); });
  document.addEventListener('click', e => { if (!menu.contains(e.target) && e.target !== ins) menu.classList.remove('on'); if (!e.target.closest('.dd')) $$('.dd.open', bar).forEach(x => x.classList.remove('open')); });
  menu.addEventListener('click', e => {
    const b = e.target.closest('[data-i]'); if (!b) return; e.stopPropagation(); menu.classList.remove('on'); const k = b.dataset.i;
    if (k === 'text') addFree('text', { html: '<b>Título</b><br>Escriba aquí su texto' });
    else if (k === 'box') addFree('box', { html: 'Escriba aquí el comentario o conclusión.' });
    else if (k === 'img') addFree('img');
    else if (k === 'chart') { const kind = b.dataset.kind; addFree('chart', { kind, def: kind === 'donut' ? { labels: ['Opción A', 'Opción B', 'Opción C'], series: [{ name: 'Valores', values: [50, 30, 20] }] } : { labels: ['Pallancata', 'Selene', 'Presa'], series: [{ name: 'Serie 1', values: [12, 8, 15] }].concat(kind === 'stack' ? [{ name: 'Serie 2', values: [4, 6, 3] }] : []) } }); }
    else if (k === 'table') addFree('table', { auto: true, html: '<thead><tr><th>Columna 1</th><th>Columna 2</th><th>Columna 3</th><th>Avance</th></tr></thead><tbody><tr><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td class="pc">0%</td></tr><tr><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td class="pc">0%</td></tr></tbody>' });
    else newSlide(k);
  });

  /* ================= activar / desactivar según el modo ================= */
  const sync = () => { const ed = D.editing(), mv = D.moving && D.moving();
    $$('.free-layer').forEach(l => setEditable(l, ed));
    $$('[data-tbl]').filter(t => !t.closest('.free')).forEach(t => $$('td,th', t).forEach(c => c.contentEditable = ed && !mv ? 'true' : 'false'));
    if (!ed || mv) { bar.classList.remove('on'); menu.classList.remove('on'); }
    if (!ed) $$('[data-tbl]').forEach(paintTable);
  };
  new MutationObserver(sync).observe(body, { attributes: true, attributeFilter: ['class'] }); sync();
  // aparición suave de los elementos libres al entrar a la lámina
  D.slides.forEach(sl => D.on(sl.id, 'enter', () => { if (D.editing()) return; const els = $$('.free', sl); if (els.length && window.gsap) gsap.fromTo(els, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: .7, delay: .35, stagger: .08, ease: 'power3.out', clearProps: 'opacity,transform' }); }));
  D.editor = { addFree, newSlide, renderFree, paintTable };
})();
