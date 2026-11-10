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
  // Espera a tener la última versión de la nube para no perder los gráficos recibidos.
  const imp = qs.get('importar'); const cfg = window.NUBE || {};
  if (imp && cfg.url && cfg.key && D.store.meta.importado !== imp) {
    D.toast('Recibiendo los gráficos de Safety HOC…', 6000);
    (D.nubeLista || Promise.resolve()).then(() => fetch(`${cfg.url}/rest/v1/diapo_importaciones?id=eq.${encodeURIComponent(imp)}&select=data,periodo`, { headers: { apikey: cfg.key, Authorization: 'Bearer ' + cfg.key } }))
      .then(r => r.json()).then(rows => {
        if (!rows || !rows[0]) { D.toast('No se encontró el envío de Safety HOC'); return; }
        const first = applyImport(rows[0].data || {}); D.store.meta.importado = imp; D.persist();
        const n = ((rows[0].data || {}).graficos || []).length;
        D.toast(n ? `${n} gráfico${n > 1 ? 's' : ''} de Safety HOC agregado${n > 1 ? 's' : ''} como láminas nuevas` : 'Estadísticas de Safety HOC cargadas en la presentación', 4000);
        const u = new URL(location.href); u.searchParams.delete('importar'); if (first) u.hash = '#' + first; history.replaceState(null, '', u); setTimeout(() => location.reload(), 1200); })
      .catch(() => D.toast('No se pudo leer el envío (¿sin internet?)'));
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
      if (!cv || cv.tagName !== 'CANVAS') return true;
      C[g.lugar] = { labels: g.labels || [], series: (g.series || []).map(x => ({ name: x.name, values: x.values })), colors: g.colores && g.colores.length ? g.colores : undefined };
      return false;
    });
    return list.length ? addChartSlides(list) : 0;
  }
  /* Cada gráfico elegido en Safety HOC llega como una lámina nueva: título, gráfico editable y recuadro de conclusiones.
     Se insertan antes de la lámina de cierre (o al final). Devuelve el número de la primera lámina nueva. */
  function addChartSlides(list) {
    const S = D.store, sl = D.slides, uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    const KINDS = ['bar', 'hbar', 'line', 'donut', 'stack'];
    let at = sl.length - 1; const last = sl[at];
    if (!(last && (/cierre/i.test(last.id) || /cierre|gracias/i.test(last.dataset.title || '')))) at = sl.length;
    let after = at > 0 ? sl[at - 1].id : null; const n0 = Date.now();
    const esc = t => String(t == null ? '' : t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
    let k = 0; const slide = (title, kick) => { const id = 'x' + uid(); S.slides[id] = { n: n0 + (k++), after, title, kick, dark: false }; after = id; return id; };
    list.forEach(g => {
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
    return at + 1;
  }
  D.applyImport = applyImport;
})();
