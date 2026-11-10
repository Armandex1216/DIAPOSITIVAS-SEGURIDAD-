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
      return { type: 'doughnut', data: { labels: d.labels, datasets: [{ data: v, backgroundColor: d.labels.map((_, i) => cols[i % cols.length]), borderColor: '#fff', borderWidth: 3 }] },
        options: { maintainAspectRatio: false, cutout: '52%', layout: { padding: { top: 60, bottom: 60, left: 120, right: 120 } }, animation: { animateRotate: true, duration: 1400 },
          plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => ` ${c.label}: ${c.raw} (${tot ? Math.round(c.raw / tot * 1000) / 10 : 0} %)` } },
            datalabels: { display: c => +c.dataset.data[c.dataIndex] > 0, anchor: 'end', align: 'end', offset: 8, textAlign: 'center', color: '#1a1917', font: { weight: '800', size: 16 }, formatter: (val, c) => c.chart.data.labels[c.dataIndex].toUpperCase() + '\n' + fmt(val) } } } }; },
    stack: cols => (ctx, d) => ({ type: 'bar', data: { labels: d.labels, datasets: d.series.map((s, i) => ({ label: s.name, data: s.values, backgroundColor: cols[i % cols.length], borderRadius: 4, barPercentage: .8,
        datalabels: { display: c => +c.dataset.data[c.dataIndex] > 0, color: i === 1 ? '#1a1917' : '#fff', font: { weight: '900', size: 22 } } })) },
      options: { maintainAspectRatio: false, plugins: { legend: { position: 'top', labels: { font: { size: 17, weight: '700' }, usePointStyle: true } } }, animation: { duration: 1200, delay: c => c.type === 'data' ? c.dataIndex * 150 + c.datasetIndex * 250 : 0 },
        scales: { x: HC.axis({ stacked: true, grid: { display: false } }), y: HC.axis({ stacked: true, beginAtZero: true }) } } }),
    hbar2: cols => (ctx, d) => ({ type: 'bar', data: { labels: d.labels, datasets: d.series.map((s, i) => ({ label: s.name, data: s.values, backgroundColor: cols[i % cols.length], borderRadius: 10, barPercentage: .85, categoryPercentage: .78,
        datalabels: { display: true, anchor: 'end', align: 'right', offset: 6, color: '#1a1917', font: { weight: '800', size: 18 }, formatter: v => fmt(v) } })) },
      options: { indexAxis: 'y', maintainAspectRatio: false, layout: { padding: { right: 70 } }, plugins: { legend: { position: 'top', labels: { font: { size: 17, weight: '700' }, usePointStyle: true } } }, animation: { duration: 1300, delay: c => c.type === 'data' ? c.dataIndex * 160 : 0 },
        scales: { x: HC.axis({ beginAtZero: true }), y: HC.axis({ grid: { display: false }, ticks: { font: { size: 20, weight: '800' }, color: '#1a1917' } }) } } }),
    bar: cols => (ctx, d) => ({ type: 'bar', data: { labels: d.labels, datasets: d.series.map((s, i) => ({ label: s.name, data: s.values, backgroundColor: cols[i % cols.length], borderRadius: 10,
        datalabels: { display: true, anchor: 'end', align: 'top', color: '#1a1917', font: { weight: '800', size: 18 }, formatter: v => fmt(v) } })) },
      options: { maintainAspectRatio: false, layout: { padding: { top: 30 } }, plugins: { legend: { display: d.series.length > 1 } }, scales: { x: HC.axis({ grid: { display: false } }), y: HC.axis({ beginAtZero: true }) } } })
  };
  D.T = T;

  // vincular todos los gráficos declarados
  $$('canvas[data-chart]').forEach(cv => {
    const sl = cv.closest('.slide'); if (!sl || !cv.id) return;
    let def = null; try { def = JSON.parse(cv.dataset.def); } catch (e) { console.warn('def inválido', cv.id); }
    const cols = (cv.dataset.colors || '#c39531,#2f6db5,#1f9d5c,#d23c3c,#e6a316').split(',');
    HC.bind(sl.id, cv.id, (T[cv.dataset.chart] || T.bar)(cols), def);
    D.on(sl.id, 'edited', () => {}); // reservado
  });

  // índices con color según el objetivo (data-exc): verde si cumple, rojo si no
  const paintIdx = () => $$('[data-exc]').forEach(el => { const v = el.dataset.count != null ? parseFloat(el.dataset.count) : D.num(el).v, ex = parseFloat(el.dataset.exc); el.closest('.idx') && el.closest('.idx').classList.toggle('bad', v > ex); });
  paintIdx(); D.slides.forEach(sl => D.on(sl.id, 'edited', paintIdx));

  // medidores de cumplimiento calculados con un gráfico (data-from="canvasId:serieEjecutado/seriePrograma")
  const gauges = () => $$('.gpct[data-from]').forEach(g => {
    const [cid, i] = g.dataset.from.split(':'); const d = HC.getData[cid] && HC.getData[cid](); if (!d) return;
    const prog = +d.series[0].values[+i] || 0, ej = +d.series[1].values[+i] || 0, p = prog ? Math.round(ej / prog * 100) : 0;
    const arc = $('.g-arc', g), C = Math.PI * 80; arc.setAttribute('stroke-dasharray', `${C * Math.min(p, 100) / 100} ${C}`); arc.setAttribute('stroke', p >= 100 ? '#16a34a' : p >= 80 ? '#e6a316' : '#e11d1d'); $('.g-val', g).textContent = p + ' %';
  });
  setTimeout(gauges, 50); D.slides.forEach(sl => { D.on(sl.id, 'enter', gauges); D.on(sl.id, 'edited', gauges); });
  document.addEventListener('click', e => { if (e.target.closest('.modal')) setTimeout(gauges, 60); });

  // fecha de la reunión: texto con data-fecha (al crear la presentación se completa desde ?fecha=)
  const qs = new URLSearchParams(location.search);
  if (qs.get('fecha') && !D.store.meta.fechaPuesta) {
    const [y, m, d2] = qs.get('fecha').split('-'); const txt = `${d2}/${m}/${y}`;
    $$('[data-fecha]').forEach(el => { el.innerHTML = txt; keep(el); });
    const mes = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'][+m - 1];
    $$('[data-mes]').forEach(el => { const t = el.dataset.mes === 'upper' ? mes.toUpperCase() : mes[0].toUpperCase() + mes.slice(1); el.innerHTML = t; keep(el); });
    D.store.meta.fechaPuesta = qs.get('fecha'); D.persist();
  }

  /* ---------- importación desde Safety HOC Intelligence ---------- */
  const imp = qs.get('importar'); const cfg = window.NUBE || {};
  if (imp && cfg.url && cfg.key && D.store.meta.importado !== imp) {
    fetch(`${cfg.url}/rest/v1/diapo_importaciones?id=eq.${encodeURIComponent(imp)}&select=data,periodo`, { headers: { apikey: cfg.key, Authorization: 'Bearer ' + cfg.key } })
      .then(r => r.json()).then(rows => { if (!rows || !rows[0]) { D.toast('No se encontró la importación de Safety HOC'); return; } applyImport(rows[0].data || {}); D.store.meta.importado = imp; D.persist(); D.toast('Estadísticas de Safety HOC cargadas en la presentación', 4000);
        const u = new URL(location.href); u.searchParams.delete('importar'); history.replaceState(null, '', u); setTimeout(() => location.reload(), 900); })
      .catch(() => D.toast('No se pudo leer la importación (¿sin internet?)'));
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
  }
  D.applyImport = applyImport;
})();
