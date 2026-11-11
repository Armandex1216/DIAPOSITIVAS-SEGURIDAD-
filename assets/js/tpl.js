/* ==========================================================
   Plantillas (GUM, Riesgos Críticos OPT, Riesgos Críticos Corporativo, en blanco)
   - Gráficos declarados en el HTML:  <canvas id=".." data-chart="donut|stack|hbar2|bar" data-colors="#..,#.." data-def='{"labels":[..],"series":[{"name":"..","values":[..]}]}'>
   - Importación de Safety HOC:  ?importar=<id>  (tabla diapo_importaciones)
   ========================================================== */
(function () {
  'use strict';
  const D = window.DECK; if (!D || !window.HC) return;
  const $ = D.$, $$ = D.$$;
  const keep = el => { const h = el.closest('.rich') || el; D.store.text[D.textKey(h)] = h.innerHTML; };
  const fmt = v => v == null ? '' : (Math.round(v * 100) / 100).toLocaleString('es-PE');

  const T = {
    donut: cols => (ctx, d) => { const v = d.series[0].values, tot = v.reduce((a, b) => a + (+b || 0), 0);
      return { type: 'doughnut', data: { labels: d.labels, datasets: [{ data: v, backgroundColor: d.labels.map((_, i) => (d.colors || cols)[i % (d.colors || cols).length]), borderColor: '#fff', borderWidth: 3 }] },
        options: { maintainAspectRatio: false, cutout: '52%', layout: { padding: { top: 60, bottom: 60, left: 120, right: 120 } }, animation: { animateRotate: true, duration: 1400 },
          plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => ` ${c.label}: ${c.raw} (${tot ? Math.round(c.raw / tot * 1000) / 10 : 0} %)` } },
            datalabels: { display: c => +c.dataset.data[c.dataIndex] > 0, anchor: 'end', align: 'end', offset: 8, textAlign: 'center', color: '#1a1917', font: { weight: '800', size: 16 }, formatter: (val, c) => c.chart.data.labels[c.dataIndex].toUpperCase() + '\n' + fmt(val) } } } }; },
    stack: cols => (ctx, d) => ({ type: 'bar', data: { labels: d.labels, datasets: d.series.map((s, i) => ({ label: s.name, data: s.values, backgroundColor: (d.colors || cols)[i % (d.colors || cols).length], borderRadius: 4, barPercentage: .8,
        datalabels: { display: c => +c.dataset.data[c.dataIndex] > 0, color: i === 1 ? '#1a1917' : '#fff', font: { weight: '900', size: 22 } } })) },
      options: { maintainAspectRatio: false, plugins: { legend: { position: 'top', labels: { font: { size: 17, weight: '700' }, usePointStyle: true } } }, animation: { duration: 1200, delay: c => c.type === 'data' ? c.dataIndex * 150 + c.datasetIndex * 250 : 0 },
        scales: { x: HC.axis({ stacked: true, grid: { display: false } }), y: HC.axis({ stacked: true, beginAtZero: true }) } } }),
    hbar2: cols => (ctx, d) => ({ type: 'bar', data: { labels: d.labels, datasets: d.series.map((s, i) => ({ label: s.name, data: s.values, backgroundColor: (d.colors || cols)[i % (d.colors || cols).length], borderRadius: 10, barPercentage: .85, categoryPercentage: .78,
        datalabels: { display: true, anchor: 'end', align: 'right', offset: 6, color: '#1a1917', font: { weight: '800', size: 18 }, formatter: v => fmt(v) } })) },
      options: { indexAxis: 'y', maintainAspectRatio: false, layout: { padding: { right: 70 } }, plugins: { legend: { position: 'top', labels: { font: { size: 17, weight: '700' }, usePointStyle: true } } }, animation: { duration: 1300, delay: c => c.type === 'data' ? c.dataIndex * 160 : 0 },
        scales: { x: HC.axis({ beginAtZero: true }), y: HC.axis({ grid: { display: false }, ticks: { font: { size: 20, weight: '800' }, color: '#1a1917' } }) } } }),
    bar: cols => (ctx, d) => ({ type: 'bar', data: { labels: d.labels, datasets: d.series.map((s, i) => ({ label: s.name, data: s.values, backgroundColor: (d.colors || cols)[i % (d.colors || cols).length], borderRadius: 10,
        datalabels: { display: true, anchor: 'end', align: 'top', color: '#1a1917', font: { weight: '800', size: 18 }, formatter: v => fmt(v) } })) },
      options: { maintainAspectRatio: false, layout: { padding: { top: 30 } }, plugins: { legend: { display: d.series.length > 1 } }, scales: { x: HC.axis({ grid: { display: false } }), y: HC.axis({ beginAtZero: true }) } } })
  };
  D.T = T;

  // vincular todos los gráficos declarados
  $$('canvas[data-chart]').forEach(cv => {
    const sl = cv.closest('.slide'); if (!sl || !cv.id) return;
    let def = null; try { def = JSON.parse(cv.dataset.def); } catch (e) { console.warn('def inválido', cv.id); }
    const cols = (cv.dataset.colors || '#c39531,#2f6db5,#1f9d5c,#d23c3c,#e6a316').split(',');
    HC.bind(sl.id, cv.id, (T[cv.dataset.chart] || T.bar)(cols), def); HC.colorable[cv.id] = cv.dataset.chart === 'donut' ? 'label' : 'series'; HC.defColors[cv.id] = cols;
    D.on(sl.id, 'edited', () => {}); // reservado
  });

  // índices con color según el objetivo (data-exc): verde si cumple, rojo si no
  const paintIdx = () => $$('[data-exc]').forEach(el => { const v = el.dataset.count != null ? parseFloat(el.dataset.count) : D.num(el).v, ex = parseFloat(el.dataset.exc); el.closest('.idx') && el.closest('.idx').classList.toggle('bad', v > ex); });
  paintIdx(); D.slides.forEach(sl => D.on(sl.id, 'edited', paintIdx));

  // medidores de cumplimiento calculados con un gráfico (data-from="canvasId:serieEjecutado/seriePrograma")
  const gauges = anim => $$('.gpct[data-from]').forEach(g => {
    const [cid, i] = g.dataset.from.split(':'); const d = HC.getData[cid] && HC.getData[cid](); if (!d) return;
    const prog = +d.series[0].values[+i] || 0, ej = +d.series[1].values[+i] || 0, p = prog ? Math.round(ej / prog * 100) : 0;
    const arc = $('.g-arc', g), C = Math.PI * 80, to = C * Math.min(p, 100) / 100, val = $('.g-val', g); arc.setAttribute('stroke', p >= 100 ? '#16a34a' : p >= 80 ? '#e6a316' : '#e11d1d');
    if (anim && window.gsap && !D.editing()) { const o = { v: 0 }; gsap.fromTo(arc, { attr: { 'stroke-dasharray': `0 ${C}` } }, { attr: { 'stroke-dasharray': `${to} ${C}` }, duration: 1.5, delay: .6, ease: 'power3.out' }); gsap.to(o, { v: p, duration: 1.5, delay: .6, ease: 'power3.out', onUpdate: () => val.textContent = Math.round(o.v) + ' %' }); }
    else { arc.setAttribute('stroke-dasharray', `${to} ${C}`); val.textContent = p + ' %'; }
  });
  setTimeout(() => gauges(false), 50); D.slides.forEach(sl => { D.on(sl.id, 'enter', () => gauges(true)); D.on(sl.id, 'edited', () => gauges(false)); });
  document.addEventListener('click', e => { if (e.target.closest('.modal')) setTimeout(() => gauges(false), 60); });

  // animaciones automáticas: filas de tablas, viñetas, anillos y medidores aparecen uno tras otro
  const AUTO = '[data-tbl] tbody tr, .rich li, ul.cmb li, .rings .r, .gpct, .cm, .side-txt, .fl';
  D.slides.forEach(sl => D.on(sl.id, 'enter', () => { if (D.editing() || !window.gsap || document.body.classList.contains('printing')) return; const els = $$(AUTO, sl).filter(e => !e.closest('.free')); if (!els.length) return;
    gsap.fromTo(els, { opacity: 0, x: i => D.base(els[i]).x - 36, y: i => D.base(els[i]).y }, { opacity: 1, x: i => D.base(els[i]).x, duration: .55, delay: .55, stagger: Math.min(.09, 1.2 / els.length), ease: 'power3.out', clearProps: 'opacity' }); }));

  // portada: efecto Ken Burns sobre la foto (como en la presentación del comité)
  document.querySelectorAll('.g-kb').forEach(kbEl => { if (!window.gsap) return; { let kb; const go = () => { kb && kb.kill(); gsap.set(kbEl, { scale: 1.12, x: 30 }); kb = gsap.to(kbEl, { scale: 1, x: -20, duration: 14, ease: 'sine.inOut', yoyo: true, repeat: -1 }); };
    const sl = kbEl.closest('.slide'); D.on(sl.id, 'enter', go); if (sl.classList.contains('active')) go(); } });
  /* tarjetas por unidad: los anillos, barras y porcentajes se calculan de las cifras escritas (editables) y se animan al entrar */
  const num = el => { if (!el) return 0; const v = el.textContent.replace(/[^\d.,:-]/g, ''); if (v.includes(':')) { const [h, m] = v.split(':'); return (+h || 0) + (+m || 0) / 60; } return parseFloat(v.replace(/,/g, '')) || 0; };
  const fmtN = (v, d = 0) => (Math.round(v * 10 ** d) / 10 ** d).toLocaleString('es-PE', { minimumFractionDigits: d, maximumFractionDigits: d });
  function paintCards(sl, anim) { $$('.ucard', sl).forEach((c, i) => { const g = k => $(`[data-k="${k}"]`, c), arc = $('.uring .arc', c), pctEl = $('.uc-pct', c), fill = $('.uc-bar .fill', c);
      let p = 0, bar = 0;
      if (c.dataset.u === 'fat') { const ap = num(g('ap')), na = num(g('na')); p = ap + na ? ap / (ap + na) * 100 : 0; bar = Math.min(100, num(g('sl')) / 9 * 100); const mn = $('.uc-bar .min', c); if (mn) mn.style.left = (5.75 / 9 * 100) + '%'; c.classList.toggle('warn', p < 95); const sb = g('sl') && g('sl').closest('b'); if (sb) sb.classList.toggle('low', num(g('sl')) < 7); }
      else { const pr = num(g('pr')), ej = num(g('ej')); p = pr ? Math.min(100, ej / pr * 100) : 0; bar = g('oto') ? Math.min(100, num(g('oto'))) : 0; const pe = $('.uc-pend', c); if (pe) pe.textContent = fmtN(Math.max(0, pr - ej)); c.classList.toggle('warn', p < 50); }
      const dec = c.dataset.u === 'fat' ? 1 : 0, d = anim ? .6 + i * .2 : 0;
      if (window.gsap && anim) { const o = { v: 0 }; gsap.fromTo(arc, { attr: { 'stroke-dasharray': '0 100' } }, { attr: { 'stroke-dasharray': `${p} ${100 - p}` }, duration: 1.8, delay: d, ease: 'power3.out' });
        gsap.to(o, { v: p, duration: 1.8, delay: d, ease: 'power3.out', onUpdate: () => { pctEl.textContent = fmtN(o.v, o.v >= 99.95 ? 0 : dec) + ' %'; } });
        if (fill) gsap.fromTo(fill, { width: '0%' }, { width: bar + '%', duration: 1.4, delay: d + .5, ease: 'power2.out' });
        $$('.uc-n,.uc-foot b', c).forEach(n => gsap.fromTo(n, { scale: .4, opacity: 0 }, { scale: 1, opacity: 1, duration: .6, delay: d + .3, ease: 'back.out(2)' })); }
      else { arc.setAttribute('stroke-dasharray', `${p} ${100 - p}`); pctEl.textContent = fmtN(p, p >= 99.95 ? 0 : dec) + ' %'; if (fill) fill.style.width = bar + '%'; } }); }
  $$('.slide').filter(sl => $('.ucard', sl)).forEach(sl => { D.on(sl.id, 'enter', () => paintCards(sl, !D.editing())); D.on(sl.id, 'edit', () => paintCards(sl, false)); paintCards(sl, false); sl.addEventListener('input', () => paintCards(sl, false)); });
  // fecha de la reunión: texto con data-fecha (al crear la presentación se completa desde ?fecha=)
  const qs = new URLSearchParams(location.search);
  if (qs.get('fecha') && !D.store.meta.fechaPuesta) {
    const [y, m, d2] = qs.get('fecha').split('-'); const txt = `${d2}/${m}/${y}`;
    $$('[data-fecha]').forEach(el => { el.innerHTML = txt; keep(el); });
    const mes = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'][+m - 1];
    $$('[data-mes]').forEach(el => { const t = el.dataset.mes === 'upper' ? mes.toUpperCase() : mes[0].toUpperCase() + mes.slice(1); el.innerHTML = t; keep(el); });
    D.store.meta.fechaPuesta = qs.get('fecha'); D.persist();
  }

  /* ---------- importación desde Safety HOC (análisis estadístico) ---------- */
  // «Deshacer envío»: copia de la presentación antes de colocar los gráficos (dura 2 horas)
  const UNDO = 'deck-undo:' + (document.body.dataset.deck || '') + ':' + (qs.get('d') || '');
  try { const u = JSON.parse(localStorage.getItem(UNDO) || 'null');
    if (u && Date.now() - u.t < 72e5 && D.store.meta.importado === u.imp) {
      const b = document.createElement('button'); b.className = 'undo-imp'; b.textContent = '↶ Deshacer el último envío de Safety HOC';
      b.onclick = () => { if (!confirm('¿Quitar los gráficos del último envío y dejar la presentación como estaba antes?')) return;
        Object.keys(D.store).forEach(k => delete D.store[k]); Object.assign(D.store, u.store); localStorage.removeItem(UNDO); D.persist(); D.toast('Presentación restaurada'); setTimeout(() => location.reload(), 900); };
      document.body.appendChild(b); setTimeout(() => b.remove(), 6e5);
    } } catch (e) { }

  // Espera a tener la última versión de la nube para no perder los gráficos recibidos.
  const imp = qs.get('importar'); const cfg = window.NUBE || {};
  if (imp && cfg.url && cfg.key && D.store.meta.importado !== imp) {
    D.toast('Recibiendo los gráficos de Safety HOC…', 6000);
    (D.nubeLista || Promise.resolve()).then(() => fetch(`${cfg.url}/rest/v1/diapo_importaciones?id=eq.${encodeURIComponent(imp)}&select=data,periodo`, { headers: { apikey: cfg.key, Authorization: 'Bearer ' + cfg.key } }))
      .then(r => r.json()).then(rows => {
        if (!rows || !rows[0]) { D.toast('No se encontró el envío de Safety HOC'); return; }
        const data = rows[0].data || {}, n = (data.graficos || []).length;
        const done = () => { try { localStorage.setItem(UNDO, JSON.stringify({ imp, t: Date.now(), store: D.store })); } catch (e) { } const first = applyImport(data); D.store.meta.importado = imp; D.persist();
          D.toast(n ? `${n} gráfico${n > 1 ? 's' : ''} de Safety HOC colocado${n > 1 ? 's' : ''} en la presentación` : 'Estadísticas de Safety HOC cargadas en la presentación', 4000);
          const u = new URL(location.href); u.searchParams.delete('importar'); if (first) u.hash = '#' + first; history.replaceState(null, '', u); setTimeout(() => location.reload(), 1200); };
        if (n) chooseDest(data).then(ok => { if (ok) done(); else { const u = new URL(location.href); u.searchParams.delete('importar'); history.replaceState(null, '', u); D.toast('Envío cancelado: no se cambió nada'); } }); else done(); })
      .catch(() => D.toast('No se pudo leer el envío (¿sin internet?)'));
  }

  /* ---------- elegir dónde va cada gráfico recibido ---------- */
  function chooseDest(data) {
    return new Promise(res => {
      const esc = t => String(t == null ? '' : t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
      const vis = D.slides.filter(sl => !sl.classList.contains('is-hidden')), title = sl => (sl.dataset.title || ($('h2,h1', sl) || {}).textContent || 'Lámina').trim();
      const repl = vis.filter((sl, i) => i > 0 && !sl.hasAttribute('data-fija') && !/cierre/i.test(sl.id + ' ' + (sl.dataset.title || ''))); // índices, acta, campaña y cierre no se reemplazan
      const ac = vis.find(sl => /acuerdo|pedido|campa/i.test(sl.id + ' ' + (sl.dataset.title || ''))), end = vis.find(sl => /cierre/i.test(sl.id + ' ' + (sl.dataset.title || '')));
      const def = (ac || end || {}).id || '';
      const slotSlide = g => { const cv = g.lugar && document.getElementById(g.lugar); return cv && cv.tagName === 'CANVAS' ? cv.closest('.slide') : null; };
      let m = $('.modal.dest'); if (!m) { m = document.createElement('div'); m.className = 'modal dest'; document.body.appendChild(m); }
      m.innerHTML = `<div class="mbox dest-box"><h4>¿Dónde va cada gráfico?</h4><p>${esc(data.paquete || 'Envío de Safety HOC')} · ${esc(data.periodo || '')}. Elija «Lámina nueva» o la lámina que reemplaza (la reemplazada queda oculta y se puede volver a mostrar en «Láminas»).</p>
        <label class="dest-at">Las láminas nuevas van antes de: <select data-at>${vis.slice(1).map(sl => `<option value="${sl.id}" ${sl.id === def ? 'selected' : ''}>${esc(title(sl))}</option>`).join('')}<option value="">Al final</option></select></label>
        <div class="dest-list">${data.graficos.map((g, i) => { const ss = slotSlide(g); return `<div class="dest-row"><span class="dest-n">${i + 1}</span><div><b>${esc(g.titulo)}</b><small>${esc(g.subtitulo || '')}</small></div>
          <select data-i="${i}"><option value="new">Lámina nueva</option>${ss ? `<option value="slot">Usar la lámina de la plantilla «${esc(title(ss))}»</option>` : ''}${repl.map(sl => `<option value="rep:${sl.id}">Reemplazar «${esc(title(sl))}»</option>`).join('')}</select></div>`; }).join('')}</div>
        <div class="macts"><button data-x="all">Todo como láminas nuevas</button><span style="flex:1"></span><button data-x="no">Cancelar</button><button data-x="ok" class="ok">Colocar gráficos</button></div></div>`;
      m.classList.add('on');
      m.onclick = e => { const b = e.target.closest('[data-x]'); if (!b) return; e.stopPropagation();
        if (b.dataset.x === 'all') { $$('select[data-i]', m).forEach(x => x.value = 'new'); return; }
        m.classList.remove('on');
        if (b.dataset.x === 'no') return res(false);
        data._antes = $('[data-at]', m).value;
        $$('select[data-i]', m).forEach(x => { const v = x.value, g = data.graficos[+x.dataset.i]; g._dest = v === 'new' ? { mode: 'new' } : v === 'slot' ? { mode: 'slot' } : { mode: 'rep', id: v.slice(4) }; });
        res(true); };
    });
  }
  function setBind(name, val) { $$(`[data-bind="${name}"]`).forEach(el => { el.innerHTML = String(val); if (el.hasAttribute('data-count')) { el.dataset.count = String(val).replace(/[^\d.\-]/g, ''); } keep(el); }); }
  const ser = (rows, name) => ({ labels: rows.map(r => r.name), series: [{ name: name || 'Reportes', values: rows.map(r => r.value) }] });
  function applyImport(p) {
    const C = D.store.charts;
    if (p.periodo) setBind('periodo', p.periodo.split(' ')[0]);
    if (p.hallazgos) { if (p.hallazgos.por_observacion) C['g-obs'] = ser(p.hallazgos.por_observacion); if (p.hallazgos.por_zona) C['g-zona'] = ser(p.hallazgos.por_zona); if (p.hallazgos.total != null) setBind('hall_total', p.hallazgos.total); }
    if (p.abiertos) { const z = p.abiertos.por_zona || []; if (z.length) C['g-abz'] = { labels: z.map(r => r.name), series: [{ name: 'Bajos', values: z.map(r => r.bajo || 0) }, { name: 'Medio', values: z.map(r => r.medio || 0) }, { name: 'Alto', values: z.map(r => r.alto || 0) }] };
      if (p.abiertos.estado) C['g-estado'] = { labels: ['Abierto', 'Cerrado'], series: [{ name: 'Reportes', values: [p.abiertos.estado.abierto || 0, p.abiertos.estado.cerrado || 0] }] };
      if (p.abiertos.total != null) setBind('abiertos_total', p.abiertos.total); }
    if (p.retraso) { if (p.retraso.filas) C['g-retraso'] = ser(p.retraso.filas); if (p.retraso.total != null) setBind('retraso_total', p.retraso.total); if (p.retraso.texto) setBind('retraso_texto', p.retraso.texto); }
    if (p.oto) { if (p.oto.por_zona) C['g-oto-zona'] = ser(p.oto.por_zona); if (p.oto.tipo) C['g-oto-tipo'] = ser(p.oto.tipo); if (p.oto.total != null) setBind('oto_total', p.oto.total); }
    // lecturas automáticas: comentarios de cada lámina de la GUM
    if (p.lecturas) Object.entries(p.lecturas).forEach(([k, v]) => { if (v) setBind(k, v); });
    // un gráfico con «lugar» que existe en esta plantilla reemplaza ese gráfico; los demás llegan como láminas nuevas
    const list = (Array.isArray(p.graficos) ? p.graficos : []).filter(g => {
      const cv = g.lugar && document.getElementById(g.lugar);
      if (!cv || cv.tagName !== 'CANVAS' || (g._dest && g._dest.mode !== 'slot')) return true;
      C[g.lugar] = { labels: g.labels || [], series: (g.series || []).map(x => ({ name: x.name, values: x.values })), colors: g.colores && g.colores.length ? g.colores : undefined };
      // el tipo elegido en Safety HOC (barras, barra de proporción, cuadrícula…) reemplaza al de la plantilla
      const tipos = D.store.meta.tipos = Object.assign({}, D.store.meta.tipos || {}); if (g.tipo && HC.KINDS[g.tipo] && g.tipo !== cv.dataset.chart) tipos[g.lugar] = g.tipo; else delete tipos[g.lugar];
      const sl = cv.closest('.slide'); if (sl && g._dest) D.store.hidden[sl.id] = false; // la lámina de la plantilla vuelve a mostrarse
      return false;
    });
    return list.length ? addChartSlides(list, p._antes) : 0;
  }
  /* Cada gráfico elegido en Safety HOC llega como una lámina nueva: título, gráfico editable y recuadro de conclusiones.
     Se insertan antes de la lámina de cierre (o al final). Devuelve el número de la primera lámina nueva. */
  function addChartSlides(list, antes) {
    const S = D.store, sl = D.slides, uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    const KINDS = ['bar', 'hbar', 'line', 'donut', 'stack', 'split', 'waffle', 'pie', 'polar', 'radar'];
    let at = sl.length - 1; const last = sl[at];
    if (!(last && (/cierre/i.test(last.id) || /cierre|gracias/i.test(last.dataset.title || '')))) at = sl.length;
    if (antes !== undefined) { const j = antes ? sl.findIndex(x => x.id === antes) : -1; at = j > 0 ? j : sl.length; } // «antes de»: elegido al recibir
    else { const ac = sl.findIndex(x => /acuerdo|pedido|campa/i.test(x.id) && !x.classList.contains('is-hidden')); if (ac > 0 && ac < at) at = ac; }
    let after = at > 0 ? sl[at - 1].id : null; const n0 = Date.now();
    const esc = t => String(t == null ? '' : t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
    let k = 0, firstIdx = 0; const main = { after };
    const slide = (title, kick) => { const id = 'x' + uid(); S.slides[id] = { n: n0 + (k++), after: cur.after, title, kick, dark: false }; cur.after = id; return id; };
    let cur = main;
    list.forEach(g => {
      // reemplazar: la lámina nueva va justo después de la elegida y esa se oculta
      if (g._dest && g._dest.mode === 'rep' && document.getElementById(g._dest.id)) { cur = { after: g._dest.id }; S.hidden[g._dest.id] = true; if (!firstIdx) firstIdx = sl.findIndex(x => x.id === g._dest.id) + 2; }
      else { cur = main; if (!firstIdx) firstIdx = at + 1; }
      // tabla de seguimiento: 10 filas por lámina
      if (g.tipo === 'tabla') {
        const cols = g.columnas || [], rows = g.filas || [], pages = Math.max(1, Math.ceil(rows.length / 10));
        for (let pg = 0; pg < pages; pg++) {
          const id = slide(g.titulo + (pages > 1 ? ` (${pg + 1}/${pages})` : ''), g.subtitulo || 'Safety HOC'), tid = uid();
          const body = rows.slice(pg * 10, pg * 10 + 10).map(r => `<tr>${r.map((v, j) => `<td${/d[ií]as/i.test(cols[j] || '') && +v > 20 ? ' class="f-bad"' : ''}>${esc(v)}</td>`).join('')}</tr>`).join('');
          S.free[tid] = { s: id, t: 'table', html: `<thead><tr>${cols.map(c => `<th>${esc(c)}</th>`).join('')}</tr></thead><tbody>${body}</tbody>`, st: { fs: 20 } };
          S.layout['free:' + tid] = { x: 90, y: 250, w: 1740 };
          if (pg === 0 && (g.conclusiones || []).length) { const bid = uid(); S.free[bid] = { s: id, t: 'box', bg: '#1a1917', html: (g.conclusiones || []).map(t => esc(t)).join('<br>'), st: { fs: 22 } }; S.layout['free:' + bid] = { x: 90, y: 905, w: 1740, h: 110 }; }
        }
        return;
      }
      // conclusiones: lámina de texto
      if (g.tipo === 'texto') {
        const id = slide(g.titulo || 'Conclusiones', g.subtitulo || 'Safety HOC'), bid = uid();
        S.free[bid] = { s: id, t: 'text', html: `<ol class="concl-list">${(g.conclusiones || []).map(t => `<li>${esc(t)}</li>`).join('')}</ol>`, st: { fs: 30 } };
        S.layout['free:' + bid] = { x: 110, y: 250, w: 1700 };
        return;
      }
      const id = slide(g.titulo || 'Gráfico', g.subtitulo || 'Safety HOC'), fid = uid();
      const notes = (g.conclusiones || []).filter(Boolean);
      S.free[fid] = { s: id, t: 'chart', kind: KINDS.includes(g.tipo) ? g.tipo : 'bar', def: { labels: g.labels || [], series: (g.series || []).map(x => ({ name: x.name, values: x.values })), colors: g.colores && g.colores.length ? g.colores : undefined, pct: !!g.porcentaje, porBarra: !!g.porBarra } };
      S.layout['free:' + fid] = notes.length ? { x: 110, y: 255, w: 1150, h: 700 } : { x: 160, y: 255, w: 1600, h: 700 };
      if (notes.length || g.nota) {
        const bid = uid();
        S.free[bid] = { s: id, t: 'box', bg: '#1a1917', html: `<b style="color:#e8c97f">Lectura del gráfico</b><ul>${notes.map(t => `<li>${esc(t)}</li>`).join('')}</ul>${g.nota ? `<small>${esc(g.nota)}</small>` : ''}`, st: { fs: 24 } };
        S.layout['free:' + bid] = { x: 1300, y: 255, w: 510, h: 700 };
      }
    });
    return firstIdx || at + 1;
  }
  D.applyImport = applyImport;
})();
