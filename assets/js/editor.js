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
    <button data-c="smaller" title="Achicar letra">A−</button><label class="fs-in" title="Tamaño de letra del texto seleccionado (px)"><input type="number" data-c="px" min="8" max="400" step="1" placeholder="Tam."><span>px</span></label><button data-c="bigger" title="Agrandar letra">A+</button>
    <select data-c="size" title="Tamaños rápidos"><option value="">Tamaños</option><option value="18">18 · nota</option><option value="24">24 · pequeño</option><option value="32">32 · texto</option><option value="44">44 · subtítulo</option><option value="64">64 · título</option><option value="96">96 · grande</option><option value="140">140 · enorme</option></select>
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
  document.addEventListener('selectionchange', () => { if (D.editing() && activeEd()) { lastEd = activeEd(); keepSel(); showBar(); showSize(); } });
  document.addEventListener('focusin', e => { if (D.editing() && e.target.isContentEditable) { lastEd = e.target.closest('[contenteditable="true"]'); showBar(); } });
  document.addEventListener('focusout', () => setTimeout(() => { if (!bar.contains(document.activeElement) && !activeEd()) bar.classList.remove('on'); }, 200));
  function showBar() { if (D.moving && D.moving()) return; bar.classList.add('on'); bar.classList.toggle('in-table', !!(lastEd && lastEd.closest('[data-tbl] td, [data-tbl] th'))); }
  const changed = () => { if (!lastEd) return; lastEd.dispatchEvent(new Event('input', { bubbles: true })); const t = lastEd.closest('[data-tbl]'); if (t) saveTable(t); };
  function exec(cmd, val) { restoreSel(); document.execCommand(cmd, false, val); keepSel(); changed(); }
  /* Negrita que también quita la negrita que ya traen los textos (<b>, <strong>, títulos en negrita).
     Sin selección: se aplica a todo el cuadro de texto. */
  const isBoldAt = n => { const el = n && (n.nodeType === 1 ? n : n.parentElement); return !!el && parseInt(getComputedStyle(el).fontWeight, 10) >= 600; };
  function stripBold(root) { root.querySelectorAll('b,strong').forEach(x => { const sp = document.createElement('span'); while (x.firstChild) sp.appendChild(x.firstChild); x.replaceWith(sp); }); root.querySelectorAll('[style*="font-weight"]').forEach(x => x.style.fontWeight = ''); }
  function toggleBold() {
    restoreSel(); const s = getSelection(); if (!lastEd) return;
    if (!s.rangeCount || s.isCollapsed || !lastEd.contains(s.anchorNode)) { const r = document.createRange(); r.selectNodeContents(lastEd); s.removeAllRanges(); s.addRange(r); }
    const r = s.getRangeAt(0); let first = r.startContainer;
    if (first.nodeType === 1 && first.childNodes[r.startOffset]) first = first.childNodes[r.startOffset];
    const w = document.createTreeWalker(r.commonAncestorContainer.nodeType === 1 ? r.commonAncestorContainer : r.commonAncestorContainer.parentNode, NodeFilter.SHOW_TEXT);
    let t, bold = null; while ((t = w.nextNode())) { if (r.intersectsNode(t) && t.textContent.trim()) { bold = isBoldAt(t); break; } } if (bold == null) bold = isBoldAt(first);
    const frag = r.extractContents(), box = document.createElement('div'); box.appendChild(frag); stripBold(box);
    const sp = document.createElement('span'); sp.style.fontWeight = bold ? '400' : '800'; while (box.firstChild) sp.appendChild(box.firstChild);
    r.insertNode(sp); for (let p = sp.parentElement; p && p !== lastEd && /^(B|STRONG)$/.test(p.tagName) && p.textContent === sp.textContent; p = sp.parentElement) p.replaceWith(sp);
    lastEd.querySelectorAll('span:empty,b:empty,strong:empty').forEach(x => x.remove());
    const nr = document.createRange(); nr.selectNodeContents(sp); s.removeAllRanges(); s.addRange(nr); keepSel(); changed();
  }
  document.addEventListener('keydown', e => { if ((e.ctrlKey || e.metaKey) && !e.shiftKey && (e.key === 'b' || e.key === 'B') && D.editing() && activeEd()) { e.preventDefault(); e.stopImmediatePropagation(); lastEd = activeEd(); keepSel(); toggleBold(); } }, true);
  function fontPx(px) { // tamaño exacto en píxeles para el texto seleccionado (o todo el cuadro si no hay selección)
    px = Math.max(8, Math.min(400, Math.round(+px || 0))); if (!px) return;
    restoreSel(); const s = getSelection();
    if (!s.rangeCount || s.isCollapsed) { const fr = lastEd && lastEd.closest('.free'); if (fr && D.editor && D.editor.setStyle) { D.editor.setStyle(fr.dataset.fid, { fs: px }); return; } if (lastEd) { lastEd.style.fontSize = px + 'px'; changed(); } return; }
    document.execCommand('styleWithCSS', false, false); document.execCommand('fontSize', false, '7'); document.execCommand('styleWithCSS', false, true);
    $$('font[size="7"]', lastEd).forEach(f => { const sp = document.createElement('span'); sp.style.fontSize = px + 'px'; while (f.firstChild) sp.appendChild(f.firstChild); f.replaceWith(sp); });
    changed(); showSize();
  }
  function showSize() { const inp = $('[data-c=px]', bar); if (!inp || document.activeElement === inp) return; const s = getSelection(); const n = s.anchorNode && (s.anchorNode.nodeType === 1 ? s.anchorNode : s.anchorNode.parentElement); if (n && lastEd && lastEd.contains(n)) inp.value = Math.round(parseFloat(getComputedStyle(n).fontSize)); }
  function fontSize(mult, rel) {
    restoreSel(); const s = getSelection(); if (!s.rangeCount || s.isCollapsed) { D.toast('Seleccione el texto que quiere cambiar'); return; }
    document.execCommand('styleWithCSS', false, false); document.execCommand('fontSize', false, '7'); document.execCommand('styleWithCSS', false, true);
    $$('font[size="7"]', lastEd).forEach(f => { const sp = document.createElement('span'); let m = mult;
      if (rel) { const cs = parseFloat(getComputedStyle(f.parentElement).fontSize) / parseFloat(getComputedStyle(lastEd).fontSize) || 1; m = Math.max(.4, Math.min(4, cs * rel)); }
      sp.style.fontSize = m + 'em'; while (f.firstChild) sp.appendChild(f.firstChild); f.replaceWith(sp); });
    changed();
  }
  bar.addEventListener('mousedown', e => { if (!e.target.closest('select,input,label')) e.preventDefault(); });
  bar.addEventListener('keydown', e => { if (e.target.dataset.c === 'px' && e.key === 'Enter') { e.preventDefault(); fontPx(e.target.value); } });
  bar.addEventListener('click', e => {
    const b = e.target.closest('button,[data-col]'); if (!b) return;
    if (b.dataset.dd) { const dd = b.parentElement; $$('.dd.open', bar).forEach(x => x !== dd && x.classList.remove('open')); dd.classList.toggle('open'); return; }
    if (b.dataset.col) { const cmd = b.closest('[data-pal]').dataset.pal; exec(cmd, b.dataset.col); if (cmd === 'foreColor') $('.bar-c', bar).style.background = b.dataset.col; b.closest('.dd').classList.remove('open'); return; }
    if (b.dataset.c === 'smaller') return fontSize(0, .85);
    if (b.dataset.c === 'bigger') return fontSize(0, 1.18);
    if (b.dataset.c === 'bold') return toggleBold();
    if (b.dataset.c) return exec(b.dataset.c);
    if (b.dataset.t) return tableOp(b.dataset.t);
  });
  bar.addEventListener('change', e => {
    const t = e.target;
    if (t.dataset.c === 'size' && t.value) { fontPx(+t.value); t.value = ''; }
    if (t.dataset.c === 'px' && t.value) fontPx(t.value);
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
  /* Herramienta de tabla al pasar el mouse (modo edición): agregar o quitar filas y hacerlas más bajas o más altas */
  const tt = document.createElement('div'); tt.className = 'tbl-tool'; tt.setAttribute('data-noedit', ''); tt.setAttribute('contenteditable', 'false');
  tt.innerHTML = '<button data-tt="add" title="Agregar una fila al final">+ Fila</button><button data-tt="del" title="Quitar la fila marcada (o la última)">✕ Fila</button><span></span><button data-tt="pad-" title="Filas más bajas">↕ −</button><button data-tt="pad+" title="Filas más altas">↕ +</button>';
  let ttTable = null, ttRow = null;
  const ttPlace = () => { if (!ttTable || !D.editing()) { tt.classList.remove('on'); return; } const sl = ttTable.closest('.slide'); if (tt.parentNode !== sl) sl.appendChild(tt);
    const a = sl.getBoundingClientRect(), r = ttTable.getBoundingClientRect(), k = D.scale || 1; tt.style.left = (r.right - a.left) / k + 'px'; tt.style.top = Math.max(0, (r.top - a.top) / k - 46) + 'px'; tt.classList.add('on'); };
  document.addEventListener('mouseover', e => { if (!D.editing() || (D.moving && D.moving())) return; if (e.target.closest('.tbl-tool')) return; const t = e.target.closest('[data-tbl]');
    if (t) { if (t !== ttTable) { ttTable = t; } const tr = e.target.closest('tbody tr'); if (tr && t.contains(tr)) { if (ttRow) ttRow.classList.remove('tt-row'); ttRow = tr; tr.classList.add('tt-row'); } ttPlace(); } });
  document.addEventListener('mousedown', e => { if (ttTable && !e.target.closest('[data-tbl]') && !e.target.closest('.tbl-tool')) { tt.classList.remove('on'); if (ttRow) ttRow.classList.remove('tt-row'); ttTable = ttRow = null; } });
  tt.addEventListener('mousedown', e => e.preventDefault());
  tt.addEventListener('click', e => { const b = e.target.closest('[data-tt]'); if (!b || !ttTable) return; e.stopPropagation(); const t = ttTable, tb = $('tbody', t) || t, rows = $$('tbody tr', t);
    if (b.dataset.tt === 'add') { const last = rows[rows.length - 1]; if (!last) return; const nr = last.cloneNode(true); $$('td,th', nr).forEach(c => { c.innerHTML = '&nbsp;'; c.className = c.className.replace(/\bc-\w+|\bf-\w+/g, '').trim(); c.contentEditable = 'true'; }); nr.classList.remove('tt-row'); tb.appendChild(nr); }
    if (b.dataset.tt === 'del') { if (rows.length <= 1) { D.toast('La tabla necesita al menos una fila'); return; } const r = ttRow && t.contains(ttRow) ? ttRow : rows[rows.length - 1]; r.remove(); ttRow = null; }
    if (b.dataset.tt === 'pad-' || b.dataset.tt === 'pad+') { const cells = $$('td,th', t), cur = parseFloat(getComputedStyle(cells[1] || cells[0]).paddingTop) || 10, nv = Math.max(1, Math.min(40, cur + (b.dataset.tt === 'pad+' ? 3 : -3)));
      cells.forEach(c => { c.style.paddingTop = nv + 'px'; c.style.paddingBottom = nv + 'px'; }); }
    $$('.tt-row', t).forEach(x => x.classList.remove('tt-row')); saveTable(t); paintTable(t); if (ttRow) ttRow.classList.add('tt-row'); ttPlace(); D.toast('Tabla actualizada', 1200); });
  addEventListener('resize', ttPlace);
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
        backgroundColor: donut || (d.porBarra && d.series.length === 1) ? s.values.map((_, j) => P[j % P.length]) : P[i % P.length], borderRadius: kind === 'line' || donut ? 0 : 8, tension: .3, pointRadius: 7, pointBackgroundColor: P[i % P.length],
        datalabels: { formatter: v => v == null ? '' : (Math.round(v * 100) / 100).toLocaleString('es-PE') + (d.pct ? ' %' : ''), display: c => c.dataset.data[c.dataIndex] != null && c.dataset.data[c.dataIndex] !== 0, color: donut || kind === 'stack' ? '#fff' : '#1a1917', anchor: donut || kind === 'stack' ? 'center' : 'end', align: donut || kind === 'stack' ? 'center' : (kind === 'hbar' ? 'right' : 'top'), font: { weight: '900', size: 18 } } }));
      const cfg = { type: donut ? 'doughnut' : (kind === 'line' ? 'line' : 'bar'), data: { labels: d.labels, datasets: ds },
        options: { maintainAspectRatio: false, indexAxis: kind === 'hbar' ? 'y' : 'x', cutout: donut ? '58%' : undefined, layout: { padding: { top: 26, right: 30 } },
          plugins: { legend: { display: donut || d.series.length > 1, position: donut ? 'right' : 'top', labels: { font: { size: 18, weight: '700' }, boxWidth: 18 } } } } };
      if (!donut) cfg.options.scales = { x: HC.axis({ stacked: kind === 'stack', grid: { display: kind === 'hbar' } }), y: HC.axis({ stacked: kind === 'stack', beginAtZero: true, grid: { display: kind !== 'hbar' } }) };
      // apiladas: leyenda pequeña al costado con el total de cada nivel (Bajo · 230)
      if (kind === 'stack') { const sum = i => (d.series[i].values || []).reduce((a, b) => a + (+b || 0), 0);
        cfg.options.plugins.legend = { display: true, position: d.leyenda || 'right', labels: { font: { size: 16, weight: '700' }, boxWidth: 14, padding: 14, usePointStyle: true,
          generateLabels: ch => Chart.defaults.plugins.legend.labels.generateLabels(ch).map(l => Object.assign(l, { text: `${d.series[l.datasetIndex].name} · ${sum(l.datasetIndex).toLocaleString('es-PE')}` })) } }; }
      // cantidades dentro de cada barra (ej. «7 de 10»), además del valor encima
      if (Array.isArray(d.dentro) && d.dentro.length) ds.forEach(x => { const top = x.datalabels; x.datalabels = { labels: { value: top, inner: { display: c => d.dentro[c.dataIndex] != null && d.dentro[c.dataIndex] !== '', anchor: 'center', align: 'center', color: '#fff', textAlign: 'center', font: { weight: '900', size: 22 }, formatter: (v, c) => d.dentro[c.dataIndex] == null ? '' : String(d.dentro[c.dataIndex]) } } }; });
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
    if (f.t === 'bubble') { el.innerHTML = `<div class="bub"><div class="ftx">${f.html || 'Escriba aquí'}</div></div>`; const tx = $('.ftx', el); tx.addEventListener('input', () => { f.html = tx.innerHTML; saveSoon(); }); }
    el.insertAdjacentHTML('beforeend', '<i class="fgrip" data-noedit contenteditable="false" title="Arrastre para mover">✥</i><i class="frz" data-noedit contenteditable="false" title="Arrastre para cambiar el tamaño"></i>');
    layerOf(sl).appendChild(el); applyStyle(el, f);
    D.applyLayout(el, store.layout['free:' + fid]);
    if (f.t === 'img') D.initSlot($('.slot', el));
    if (f.t === 'chart' && window.HC) { HC.bind(f.s, 'fc-' + fid, KINDS[f.kind] ? chartMake(f.kind) : HC.maker(f.kind), f.def); HC.colorable['fc-' + fid] = ['donut', 'pie', 'polar', 'split', 'waffle'].includes(f.kind) || (f.def && f.def.porBarra) ? 'label' : 'series'; }
    if (D.editing()) setEditable(el, true);
    return el;
  }
  function setEditable(root, on) { $$('.ftx, [data-tbl] td, [data-tbl] th', root).forEach(x => x.contentEditable = on && !(D.moving && D.moving()) ? 'true' : 'false'); }
  D.onFreeDelete = fid => { const f = store.free[fid]; if (!f) return; if (typeof selectFree === 'function' && selF === fid) selectFree(null); delete store.free[fid]; delete store.layout['free:' + fid]; if (f.t === 'img') delete store.images['free-' + fid]; const el = $(`.free[data-fid="${fid}"]`); if (el) el.remove(); D.persist(); D.toast('Elemento eliminado'); };

  function addFree(t, extra) {
    const sl = cur(), fid = uid();
    const L = { text: { x: 160, y: 300, w: 900, h: 0 }, bubble: { x: 640, y: 300, w: 620, h: 340 }, box: { x: 160, y: 760, w: 1600, h: 170 }, img: { x: 1100, y: 260, w: 640, h: 420 }, chart: { x: 160, y: 260, w: 1000, h: 600 }, table: { x: 120, y: 260, w: 1680, h: 0 } }[t];
    store.free[fid] = Object.assign({ s: sl.id, t }, extra || {}); store.layout['free:' + fid] = { x: L.x, y: L.y, w: L.w, h: L.h || undefined };
    const el = renderFree(fid); D.persist(); setTimeout(() => selectFree(fid), 60);
    if (t === 'chart') { D.fire(sl, 'enter'); setTimeout(() => HC.editData('fc-' + fid), 600); }
    setTimeout(() => { const tx = $('.ftx', el) || $('td', el); if (tx && D.editing()) { tx.focus(); document.execCommand('selectAll'); } }, 80);
    D.toast('Elemento agregado · arrástrelo con ✥ y cambie el tamaño con la esquina dorada', 3200);
  }


  /* ================= lienzo tipo Canva: estilos, nubes, mover y capas ================= */
  const FONTS = [['', 'Montserrat (de la plantilla)'], ['Montserrat, sans-serif', 'Montserrat'], ['Arial, Helvetica, sans-serif', 'Arial'], ['"Segoe UI", Tahoma, sans-serif', 'Segoe UI'], ['Georgia, "Times New Roman", serif', 'Georgia'], ['"Trebuchet MS", sans-serif', 'Trebuchet'], ['Impact, "Arial Black", sans-serif', 'Impact'], ['"Courier New", monospace', 'Courier'], ['"Comic Sans MS", "Comic Sans", cursive', 'Comic Sans']];
  const SHAPES = { globo: 'Globo de diálogo', ovalo: 'Globo ovalado', nube: 'Nube de pensamiento', rect: 'Rectángulo', redondo: 'Rectángulo redondeado', circulo: 'Círculo', etiqueta: 'Etiqueta (flecha)', estrella: 'Explosión' };
  const TAILS = { 'abajo-izq': 'Abajo izquierda', 'abajo-der': 'Abajo derecha', 'arriba-izq': 'Arriba izquierda', 'arriba-der': 'Arriba derecha', izq: 'Izquierda', der: 'Derecha', ninguna: 'Sin cola' };
  const cloudSvg = (fill, stroke, sw) => `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 240 150' preserveAspectRatio='none'><path d='M58 132c-30 2-50-18-44-42-18-10-12-40 12-44 0-24 28-38 50-26 12-20 46-24 62-6 18-14 50-8 56 16 26 0 42 26 30 48 16 16 4 46-22 46-8 18-36 22-50 8-16 14-44 14-58 0-12 8-28 8-36 0z' fill='${fill}' stroke='${stroke}' stroke-width='${sw}' vector-effect='non-scaling-stroke'/></svg>`)}")`;
  const burstSvg = (fill, stroke, sw) => `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200' preserveAspectRatio='none'><polygon points='100,4 118,52 168,22 150,74 198,80 156,108 190,150 138,144 140,196 104,160 70,198 66,148 14,162 46,116 2,88 52,72 30,24 82,48' fill='${fill}' stroke='${stroke}' stroke-width='${sw}' stroke-linejoin='round' vector-effect='non-scaling-stroke'/></svg>`)}")`;
  function applyStyle(el, f) {
    const st = f.st || {}, tx = $('.ftx', el) || (f.t === 'table' ? $('table', el) : null);
    if (tx) { tx.style.fontFamily = st.ff || ''; tx.style.fontSize = st.fs ? st.fs + 'px' : ''; tx.style.color = st.color || ''; tx.style.textAlign = st.al || ''; tx.style.fontWeight = st.bold ? '800' : st.bold === false ? '400' : ''; tx.style.fontStyle = st.it ? 'italic' : ''; tx.style.lineHeight = st.lh || ''; }
    el.style.opacity = st.op != null && st.op < 1 ? st.op : '';
    if (f.t === 'box') { const b = $('.fbox', el); if (b) { b.style.background = st.bg || f.bg || '#1a1917'; b.style.border = st.bw ? `${st.bw}px solid ${st.bc || '#c39531'}` : ''; } }
    if (f.t === 'text') { el.style.background = st.bg || ''; el.style.padding = st.bg || st.bw ? '18px 26px' : ''; el.style.borderRadius = st.bg || st.bw ? '18px' : ''; el.style.border = st.bw ? `${st.bw}px solid ${st.bc || '#c39531'}` : ''; }
    if (f.t === 'bubble') {
      const shape = st.shape || 'globo', bg = st.bg || '#ffffff', bc = st.bc || '#c39531', bw = st.bw == null ? 4 : st.bw, b = $('.bub', el);
      el.dataset.shape = shape; el.dataset.tail = ['globo', 'ovalo'].includes(shape) ? (st.tail || 'abajo-izq') : (shape === 'nube' ? (st.tail || 'abajo-izq') : 'ninguna');
      el.style.setProperty('--bg', bg); el.style.setProperty('--bc', bc);
      const svg = shape === 'nube' ? cloudSvg(bg, bw ? bc : 'none', bw) : shape === 'estrella' ? burstSvg(bg, bw ? bc : 'none', bw) : '';
      b.style.backgroundImage = svg; b.style.backgroundColor = svg ? 'transparent' : bg;
      // borde que también rodea la cola: varias sombras sin desenfoque
      el.style.filter = (!svg && bw ? [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([x, y]) => `drop-shadow(${x * bw}px ${y * bw}px 0 ${bc})`).join(' ') + ' ' : '') + 'drop-shadow(0 14px 22px rgba(40,30,10,.22))';
    }
  }
  let selF = null;
  const fprops = document.createElement('div'); fprops.className = 'fprops'; fprops.setAttribute('data-noedit', '');
  fprops.innerHTML = `<span class="fp-t">Elemento</span>
    <select data-p="ff" title="Fuente">${FONTS.map(([v, n]) => `<option value='${v}'>${n}</option>`).join('')}</select>
    <span class="fp-g"><button data-a="fs-" title="Letra más pequeña">A−</button><input data-p="fs" type="number" min="8" max="400" title="Tamaño de letra (px)"><button data-a="fs+" title="Letra más grande">A+</button></span>
    <button data-a="bold" title="Negrita"><b>N</b></button><button data-a="it" title="Cursiva"><i>K</i></button>
    <span class="fp-g"><button data-a="al:left" title="Izquierda">⯇</button><button data-a="al:center" title="Centrar">≡</button><button data-a="al:right" title="Derecha">⯈</button></span>
    <label class="fp-c" title="Color de letra">A<input type="color" data-p="color"></label>
    <label class="fp-c fp-bg" title="Color de fondo">▇<input type="color" data-p="bg"></label><button data-a="nobg" title="Quitar fondo">∅</button>
    <label class="fp-c fp-bc" title="Color del borde">▢<input type="color" data-p="bc"></label>
    <select data-p="bw" title="Grosor del borde"><option value="0">Sin borde</option><option value="2">Borde fino</option><option value="4">Borde medio</option><option value="8">Borde grueso</option></select>
    <select data-p="shape" class="fp-sh" title="Forma">${Object.entries(SHAPES).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select>
    <select data-p="tail" class="fp-sh" title="Cola de la nube">${Object.entries(TAILS).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select>
    <label class="fp-op" title="Transparencia">◐<input type="range" data-p="op" min="0.2" max="1" step="0.05"></label>
    <span class="sep"></span>
    <button data-a="up" title="Traer adelante">⬆</button><button data-a="down" title="Enviar atrás">⬇</button><button data-a="dup" title="Duplicar (Ctrl+D)">⧉ Duplicar</button><button data-a="del" class="fp-del" title="Eliminar (Supr)">🗑</button>`;
  document.body.appendChild(fprops);
  const fOf = fid => store.free[fid];
  function setStyle(fid, patch) { const f = fOf(fid); if (!f) return; f.st = Object.assign({}, f.st, patch); const el = $(`.free[data-fid="${fid}"]`); if (el) applyStyle(el, f); if (f.t === 'chart' && window.HC && HC.builders['fc-' + fid]) HC.builders['fc-' + fid](false); saveSoon(); if (fid === selF) paintProps(); }
  function paintProps() {
    const f = fOf(selF); if (!f) return; const st = f.st || {}, el = $(`.free[data-fid="${selF}"]`), tx = el && $('.ftx', el);
    const hasText = ['text', 'box', 'bubble', 'table'].includes(f.t);
    fprops.classList.toggle('no-text', !hasText); fprops.classList.toggle('is-bub', f.t === 'bubble'); fprops.classList.toggle('no-bg', !['text', 'box', 'bubble'].includes(f.t));
    $('.fp-t', fprops).textContent = { text: 'Texto', box: 'Recuadro', bubble: 'Nube / forma', img: 'Imagen', chart: 'Gráfico', table: 'Tabla' }[f.t] || 'Elemento';
    $('[data-p=ff]', fprops).value = st.ff || ''; $('[data-p=fs]', fprops).value = st.fs || (tx ? Math.round(parseFloat(getComputedStyle(tx).fontSize)) : '');
    $('[data-p=color]', fprops).value = st.color || (f.t === 'box' ? '#ffffff' : '#1a1917'); $('[data-p=bg]', fprops).value = st.bg || (f.t === 'box' ? (f.bg || '#1a1917') : '#ffffff'); $('[data-p=bc]', fprops).value = st.bc || '#c39531';
    $('[data-p=bw]', fprops).value = String(st.bw == null ? (f.t === 'bubble' ? 4 : 0) : st.bw); $('[data-p=shape]', fprops).value = st.shape || 'globo'; $('[data-p=tail]', fprops).value = st.tail || 'abajo-izq'; $('[data-p=op]', fprops).value = st.op == null ? 1 : st.op;
    $$('[data-a=bold],[data-a=it]', fprops).forEach(b => b.classList.toggle('on', !!st[b.dataset.a]));
  }
  function selectFree(fid) {
    $$('.free.fsel').forEach(x => x.classList.remove('fsel')); selF = fid && fOf(fid) ? fid : null;
    if (selF) { const el = $(`.free[data-fid="${selF}"]`); el && el.classList.add('fsel'); paintProps(); fprops.classList.add('on'); } else fprops.classList.remove('on');
    body.classList.toggle('fp-on', !!selF);
  }
  function duplicateFree(fid) {
    const f = fOf(fid); if (!f) return; const nf = uid(); store.free[nf] = JSON.parse(JSON.stringify(f));
    const L = Object.assign({}, store.layout['free:' + fid]); L.x = (L.x || 0) + 40; L.y = (L.y || 0) + 40; store.layout['free:' + nf] = L;
    if (store.images['free-' + fid] !== undefined) store.images['free-' + nf] = store.images['free-' + fid];
    if (f.t === 'chart' && store.charts['fc-' + fid]) store.charts['fc-' + nf] = JSON.parse(JSON.stringify(store.charts['fc-' + fid]));
    renderFree(nf); if (f.t === 'chart') D.fire(document.getElementById(f.s), 'enter'); D.persist(); selectFree(nf); D.toast('Elemento duplicado');
  }
  function layer(fid, dir) { const L = store.layout['free:' + fid] || (store.layout['free:' + fid] = {}); const zs = Object.entries(store.free).filter(([, x]) => x.s === fOf(fid).s).map(([k]) => (store.layout['free:' + k] || {}).z || 1); L.z = Math.max(1, dir > 0 ? Math.max(...zs) + 1 : Math.min(...zs) - 1); D.applyLayout($(`.free[data-fid="${fid}"]`), L); D.persist(); }
  fprops.addEventListener('mousedown', e => { if (!e.target.closest('select,input,label')) e.preventDefault(); });
  fprops.addEventListener('click', e => {
    const b = e.target.closest('[data-a]'); if (!b || !selF) return; const a = b.dataset.a, f = fOf(selF), st = f.st || {};
    if (a === 'fs-' || a === 'fs+') { const cur = +$('[data-p=fs]', fprops).value || 32; setStyle(selF, { fs: Math.max(8, Math.round(cur * (a === 'fs+' ? 1.12 : 1 / 1.12))) }); }
    else if (a === 'bold') { const el = $(`.free[data-fid="${selF}"]`), tx = el && ($('.ftx', el) || $('table', el)); const on = !(st.bold || (tx && parseInt(getComputedStyle(tx).fontWeight, 10) >= 600 && st.bold !== false));
      if (!on && tx) { stripBold(tx); if (f.html != null) f.html = f.t === 'table' ? tx.innerHTML : tx.innerHTML; } setStyle(selF, { bold: on }); }
    else if (a === 'it') setStyle(selF, { [a]: !st[a] });
    else if (a.startsWith('al:')) setStyle(selF, { al: a.slice(3) });
    else if (a === 'nobg') setStyle(selF, { bg: f.t === 'bubble' ? 'transparent' : '' });
    else if (a === 'up' || a === 'down') layer(selF, a === 'up' ? 1 : -1);
    else if (a === 'dup') duplicateFree(selF);
    else if (a === 'del') { const id = selF; selectFree(null); D.onFreeDelete(id); }
  });
  fprops.addEventListener('input', e => { const t = e.target, k = t.dataset.p; if (!k || !selF) return; if (k === 'fs' && !t.value) return; setStyle(selF, { [k]: ['fs', 'bw', 'op'].includes(k) ? +t.value : t.value }); });
  // seleccionar con un clic (modo edición); clic fuera para soltar
  document.addEventListener('pointerdown', e => {
    if (!D.editing() || (D.moving && D.moving())) return;
    if (e.target.closest('.fprops,.rt-bar,.ins-menu,.ui,.modal')) return;
    const fr = e.target.closest('.free'); selectFree(fr ? fr.dataset.fid : null);
  }, true);
  // mover y cambiar tamaño sin salir del modo edición: asa ✥ y esquina dorada
  document.addEventListener('pointerdown', e => {
    if (!D.editing() || (D.moving && D.moving())) return; const h = e.target.closest('.fgrip,.frz'); if (!h) return;
    e.preventDefault(); e.stopPropagation(); const el = h.closest('.free'), fid = el.dataset.fid, rz = h.classList.contains('frz');
    const L = store.layout['free:' + fid] || (store.layout['free:' + fid] = {}), x0 = e.clientX, y0 = e.clientY, sx = L.x || 0, sy = L.y || 0, w0 = el.offsetWidth, h0 = el.offsetHeight, sc = D.scale || 1;
    const guide = $('.snap-v', el.closest('.slide')) || el.closest('.slide').appendChild(Object.assign(document.createElement('div'), { className: 'snap-v' }));
    body.classList.add('dragging');
    const mv = ev => { const dx = (ev.clientX - x0) / sc, dy = (ev.clientY - y0) / sc;
      if (rz) { L.w = Math.max(60, Math.round(w0 + dx)); L.h = Math.max(40, Math.round(h0 + dy)); }
      else { L.x = Math.round(sx + dx); L.y = Math.round(sy + dy); const mid = L.x + el.offsetWidth / 2; const snap = Math.abs(mid - 960) < 14; if (snap) L.x = Math.round(960 - el.offsetWidth / 2); guide.classList.toggle('on', snap); }
      D.applyLayout(el, L); };
    const up = () => { removeEventListener('pointermove', mv); removeEventListener('pointerup', up); guide.classList.remove('on'); body.classList.remove('dragging'); D.persist(); if (rz) D.fire(el.closest('.slide'), 'edited'); const f = fOf(fid); if (f && f.t === 'chart' && HC.charts['fc-' + fid]) HC.charts['fc-' + fid].resize(); };
    addEventListener('pointermove', mv); addEventListener('pointerup', up);
  }, true);
  // teclado: Supr elimina, Ctrl+D duplica, flechas mueven (cuando no se está escribiendo)
  document.addEventListener('keydown', e => {
    if (!selF || !D.editing() || (D.moving && D.moving())) return; const a = document.activeElement; if (a && (a.isContentEditable || /INPUT|SELECT|TEXTAREA/.test(a.tagName))) return;
    if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); e.stopImmediatePropagation(); const id = selF; selectFree(null); D.onFreeDelete(id); }
    else if ((e.ctrlKey || e.metaKey) && (e.key === 'd' || e.key === 'D')) { e.preventDefault(); e.stopImmediatePropagation(); duplicateFree(selF); }
    else if (/^Arrow/.test(e.key)) { e.preventDefault(); e.stopImmediatePropagation(); const L = store.layout['free:' + selF] || (store.layout['free:' + selF] = {}), d = e.shiftKey ? 10 : 2; if (e.key === 'ArrowLeft') L.x = (L.x || 0) - d; if (e.key === 'ArrowRight') L.x = (L.x || 0) + d; if (e.key === 'ArrowUp') L.y = (L.y || 0) - d; if (e.key === 'ArrowDown') L.y = (L.y || 0) + d; D.applyLayout($(`.free[data-fid="${selF}"]`), L); saveSoon(); }
    else if (e.key === 'Escape') selectFree(null);
  }, true);

  Object.keys(store.free).forEach(renderFree); // dibujar los elementos guardados (después de definir estilos y formas)

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
    if (kind === 'left' || kind === 'right') { // mover la lámina actual (cualquiera) junto a la lámina visible vecina
      const vis = D.slides.map((s, i) => i).filter(i => !D.slides[i].classList.contains('is-hidden')), p = vis.indexOf(D.i), q = vis[p + (kind === 'left' ? -1 : 1)];
      if (q == null) return; D.move(D.i, q); D.toast('Lámina movida', 1200); return;
    }
  }

  /* ================= menú «＋ Insertar» ================= */
  const ui = $('.ui'); const ins = document.createElement('button'); ins.dataset.k = 'ins'; ins.className = 'ins-btn'; ins.textContent = '＋ Insertar'; ins.title = 'Agregar texto, imagen, gráfico, tabla o una lámina nueva';
  ui && ui.insertBefore(ins, $('[data-k=move]', ui) ? $('[data-k=move]', ui).nextSibling : null);
  const menu = document.createElement('div'); menu.className = 'ins-menu'; menu.setAttribute('data-noedit', '');
  menu.innerHTML = `<h5>Textos</h5>
    <div class="sub-ins"><button data-i="text" data-pre="title" class="pre-t">Título</button><button data-i="text" data-pre="sub" class="pre-s">Subtítulo</button><button data-i="text" data-pre="body">Texto normal</button><button data-i="box">▭ Recuadro oscuro</button></div>
    <h5>Nubes de texto y formas</h5>
    <div class="sub-ins shapes">${Object.entries(SHAPES).map(([k, v]) => `<button data-i="bubble" data-shape="${k}" title="${v}"><i class="sh-${k}"></i>${v}</button>`).join('')}</div>
    <h5>En esta lámina</h5>
    <button data-i="img">🖼 Imagen</button>
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
    if (k === 'text') { const pre = b.dataset.pre; if (pre === 'title') addFree('text', { html: 'Título', st: { fs: 80, bold: true } }); else if (pre === 'sub') addFree('text', { html: 'Subtítulo', st: { fs: 48, bold: true, color: '#9a7422' } }); else addFree('text', { html: 'Escriba aquí su texto', st: { fs: 32 } }); }
    else if (k === 'bubble') { const sh = b.dataset.shape; addFree('bubble', { html: sh === 'estrella' ? '<b>¡Atención!</b>' : 'Escriba aquí su mensaje', st: { shape: sh, fs: sh === 'estrella' ? 44 : 32, al: 'center', bg: sh === 'estrella' ? '#e6a316' : sh === 'etiqueta' ? '#c39531' : '#ffffff', bw: ['estrella', 'etiqueta'].includes(sh) ? 0 : 4 } }); }
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
    if (!ed || mv) { bar.classList.remove('on'); menu.classList.remove('on'); if (typeof selectFree === 'function') selectFree(null); }
    if (!ed) $$('[data-tbl]').forEach(paintTable);
  };
  new MutationObserver(sync).observe(body, { attributes: true, attributeFilter: ['class'] }); sync();
  // aparición suave de los elementos libres al entrar a la lámina
  D.slides.forEach(sl => D.on(sl.id, 'enter', () => { if (D.editing()) return; const els = $$('.free', sl); if (els.length && window.gsap) gsap.fromTo(els, { opacity: 0, marginTop: 30 }, { opacity: 1, marginTop: 0, duration: .7, delay: .35, stagger: .08, ease: 'power3.out', clearProps: 'opacity,marginTop' }); })); // sin tocar «translate», que guarda la posición del elemento
  D.editor = { addFree, newSlide, renderFree, paintTable, setStyle, selectFree };
})();
