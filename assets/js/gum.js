/* Gráficos e interacciones de la presentación GUM */
(function () {
  const G = window.GUM, $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const Z = ['Presa', 'Selene', 'Pallancata'], ZL = ['Presa de relaves', 'Selene', 'Pallancata'], NV = ['BAJO', 'MEDIO', 'ALTO'], NL = ['Bajo', 'Medio', 'Alto'];
  const sum = a => a.reduce((s, x) => s + x, 0);
  const lab = (min = 4, color = '#fff') => ({ display: c => c.dataset.data[c.dataIndex] >= min, color, font: { weight: '800', size: 19 }, formatter: v => v });
  const stagger = (step = 90) => ({ duration: 1100, easing: 'easeOutQuart', delay: c => c.type === 'data' ? c.dataIndex * step + c.datasetIndex * 140 : 0 });
  const legend = { display: true, position: 'top', align: 'start', labels: { font: { size: 19, weight: '700' }, padding: 22, boxWidth: 14, boxHeight: 14 } };
  const totals = (hz) => ({ id: 'tot', afterDatasetsDraw(c) { const x = c.ctx, ds = c.data.datasets; x.save(); x.font = '900 21px Montserrat'; x.fillStyle = '#1a1917';
    c.data.labels.forEach((_, i) => { let t = 0, p = null; ds.forEach((d, k) => { const m = c.getDatasetMeta(k); if (m.hidden) return; t += d.data[i] || 0; const el = m.data[i]; p = p == null ? (hz ? el.x : el.y) : (hz ? Math.max(p, el.x) : Math.min(p, el.y)); });
      const el = c.getDatasetMeta(0).data[i]; if (hz) { x.textAlign = 'left'; x.textBaseline = 'middle'; x.fillText(t, p + 12, el.y); } else { x.textAlign = 'center'; x.textBaseline = 'bottom'; x.fillText(t, el.x, p - 8); } }); x.restore(); } });

  let kb; const kbGo = () => { kb && kb.kill(); gsap.set('#gkb', { scale: 1.14, x: -30 }); kb = gsap.to('#gkb', { scale: 1, x: 20, duration: 16, ease: 'sine.out' }); };
  DECK.on('g-portada', 'enter', kbGo); if (document.getElementById('g-portada').classList.contains('active')) kbGo();

  HC.bind('g-tendencia', 'c-tend', () => ({ type: 'bar', data: { labels: G.tendencia.labels, datasets: Z.map((z, k) => ({ label: ZL[k], data: G.tendencia.series[z], backgroundColor: HC.zone[z], borderRadius: 6, borderColor: '#fbf8f2', borderWidth: 2, datalabels: lab(30) })) },
    options: { maintainAspectRatio: false, layout: { padding: { top: 30 } }, plugins: { legend }, animation: stagger(80), scales: { x: HC.axis({ stacked: true, grid: { display: false } }), y: HC.axis({ stacked: true }) } }, plugins: [totals(false)] }));

  const S = ['Frente', 'Vias', 'Campamento'], SL = ['Frente operativo', 'Vías y accesos', 'Campamento y servicios'], SC = ['#2f6db5', '#e6a316', '#e07ba4'];
  HC.bind('g-donde', 'c-donde', () => ({ type: 'bar', data: { labels: ZL, datasets: S.map((s, k) => ({ label: SL[k], data: Z.map(z => G.zonaSitio[z][s]), backgroundColor: SC[k], borderRadius: 8, borderColor: '#fff', borderWidth: 2, datalabels: lab(4, k === 1 ? '#1a1917' : '#fff') })) },
    options: { indexAxis: 'y', maintainAspectRatio: false, layout: { padding: { right: 70 } }, plugins: { legend }, animation: stagger(160), scales: { x: HC.axis({ stacked: true }), y: HC.axis({ stacked: true, grid: { display: false }, ticks: { font: { size: 23, weight: '800' }, color: '#1a1917' } }) } }, plugins: [totals(true)] }));

  HC.bind('g-riesgo', 'c-riesgo', () => { const tot = Z.map(z => sum(NV.map(v => G.zonaNivel[z][v])));
    return { type: 'bar', data: { labels: ZL, datasets: NV.map((v, k) => ({ label: NL[k], data: Z.map((z, i) => G.zonaNivel[z][v] / tot[i] * 100), raw: Z.map(z => G.zonaNivel[z][v]), backgroundColor: HC.lvl[v], borderRadius: 8, borderColor: '#fff', borderWidth: 2,
      datalabels: { display: c => c.dataset.data[c.dataIndex] > 5, color: k === 1 ? '#1a1917' : '#fff', font: { weight: '800', size: 19 }, formatter: (v, c) => `${c.dataset.raw[c.dataIndex]} · ${Math.round(v)}%` } })) },
      options: { indexAxis: 'y', maintainAspectRatio: false, plugins: { legend, tooltip: { callbacks: { label: c => ` ${c.dataset.label}: ${c.dataset.raw[c.dataIndex]} (${c.raw.toFixed(0)} %)` } } }, animation: stagger(160),
        scales: { x: HC.axis({ stacked: true, max: 100, ticks: { callback: v => v + '%' } }), y: HC.axis({ stacked: true, grid: { display: false }, ticks: { font: { size: 23, weight: '800' }, color: '#1a1917' } }) } } }; });

  HC.bind('g-abiertos', 'c-ab-zona', () => ({ type: 'bar', data: { labels: ['Presa', 'Selene', 'Pallancata'], datasets: NV.map((v, k) => ({ label: NL[k], data: Z.map(z => G.abiertos.zonaNivel[z][v]), backgroundColor: HC.lvl[v], borderRadius: 6, borderColor: '#fff', borderWidth: 2, datalabels: lab(1, k === 1 ? '#1a1917' : '#fff') })) },
    options: { maintainAspectRatio: false, layout: { padding: { top: 34 } }, plugins: { legend }, animation: stagger(160), scales: { x: HC.axis({ stacked: true, grid: { display: false } }), y: HC.axis({ stacked: true }) } }, plugins: [totals(false)] }));
  const E = Object.keys(G.abiertos.edad);
  HC.bind('g-abiertos', 'c-ab-edad', () => ({ type: 'bar', data: { labels: E.map(e => e + ' d'), datasets: NV.map((v, k) => ({ label: NL[k], data: E.map(e => G.abiertos.edad[e][v]), backgroundColor: HC.lvl[v], borderRadius: 6, borderColor: '#fff', borderWidth: 2, datalabels: lab(1, k === 1 ? '#1a1917' : '#fff') })) },
    options: { maintainAspectRatio: false, layout: { padding: { top: 34 } }, plugins: { legend }, animation: stagger(160), scales: { x: HC.axis({ stacked: true, grid: { display: false } }), y: HC.axis({ stacked: true }) } }, plugins: [totals(false)] }));

  const RL = Object.keys(G.retraso), RV = RL.map(k => G.retraso[k]);
  HC.bind('g-retraso', 'c-ret', () => ({ type: 'bar', data: { labels: RL, datasets: [{ data: RV, backgroundColor: ['#1f9d5c', '#8fb7e8', '#e6a316', '#ee7448', '#d23c3c'], borderRadius: 14, barPercentage: .7,
    datalabels: { display: true, anchor: 'end', align: 'end', color: '#1a1917', font: { weight: '900', size: 24 }, formatter: v => `${v} (${Math.round(v / G.total * 100)}%)` } }] },
    options: { maintainAspectRatio: false, layout: { padding: { top: 50 } }, plugins: { legend: { display: false } }, animation: stagger(150), scales: { x: HC.axis({ grid: { display: false }, ticks: { font: { size: 22, weight: '800' }, color: '#1a1917' } }), y: HC.axis() } } }));

  HC.bind('g-diario', 'c-dia', () => ({ type: 'bar', data: { labels: G.diario.map((_, i) => i + 1), datasets: [
    { type: 'line', label: 'Promedio ' + G.calc.mean.toFixed(1), data: G.diario.map(() => G.calc.mean), borderColor: '#2b2a28', borderDash: [10, 8], borderWidth: 3, pointRadius: 0 },
    { label: 'Hallazgos', data: G.diario, backgroundColor: G.diario.map(v => v ? HC.gold : HC.bad), borderRadius: 6, barPercentage: .78,
      datalabels: { display: true, anchor: 'end', align: 'end', color: '#4c4a46', font: { weight: '800', size: 16 }, formatter: v => v } }] },
    options: { maintainAspectRatio: false, layout: { padding: { top: 30 } }, plugins: { legend }, animation: stagger(35), scales: { x: HC.axis({ grid: { display: false }, ticks: { font: { size: 16 } } }), y: HC.axis() } } }));

  HC.bind('g-meta', 'c-meta', () => { const M = G.metaIAH; return { type: 'bar', data: { labels: M.map(m => m[0]), datasets: [{ data: M.map(m => m[1]), backgroundColor: M.map(m => m[1] >= 4 ? HC.ok : m[1] ? HC.warn : HC.bad), borderRadius: 5, barPercentage: .82,
    datalabels: { display: true, anchor: 'end', align: 'end', color: '#1a1917', font: { weight: '800', size: 14 }, formatter: v => v } }] },
    options: { indexAxis: 'y', maintainAspectRatio: false, layout: { padding: { right: 30, top: 26 } }, plugins: { legend: { display: false } }, animation: stagger(25),
      scales: { x: HC.axis({ ticks: { font: { size: 15 } } }), y: HC.axis({ grid: { display: false }, ticks: { autoSkip: false, font: { size: 14, weight: '600' }, color: '#1a1917', padding: 4 } }) } }, plugins: [HC.refLine(4, 'Meta 4', HC.char, true)] }; });

  HC.bind('g-otozona', 'c-oto-zona', () => ({ type: 'bar', data: { labels: ['Presa', 'Selene', 'Pallancata'], datasets: [['seguro', 'Seguro', HC.ok], ['desvio', 'Desvío', HC.bad]].map(([k, l, c]) => ({ label: l, data: Z.map(z => G.oto.zona[z][k]), backgroundColor: c, borderRadius: 6, borderColor: '#fff', borderWidth: 2, datalabels: lab(1) })) },
    options: { maintainAspectRatio: false, layout: { padding: { top: 34 } }, plugins: { legend }, animation: stagger(160), scales: { x: HC.axis({ stacked: true, grid: { display: false } }), y: HC.axis({ stacked: true }) } }, plugins: [totals(false)] }));
  HC.bind('g-otozona', 'c-oto-mes', ctx => ({ type: 'line', data: { labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Set', 'Oct'], datasets: [{ label: 'OTO', data: G.oto.mensual, borderColor: HC.violet, backgroundColor: HC.grad(ctx, 'rgba(122,91,214,.35)', 'rgba(122,91,214,0)', 600), fill: true, tension: .35, borderWidth: 5, pointRadius: 8, pointBackgroundColor: HC.violet, pointBorderColor: '#fff', pointBorderWidth: 3,
    datalabels: { display: true, align: 'top', offset: 8, color: '#1a1917', font: { weight: '800', size: 17 } } }] },
    options: { maintainAspectRatio: false, layout: { padding: { top: 34 } }, plugins: { legend: { display: false } }, animation: { duration: 1600 }, scales: { x: HC.axis({ grid: { display: false }, ticks: { font: { size: 17 } } }), y: HC.axis({ beginAtZero: true }) } } }));

  const C = 2 * Math.PI * 50;
  DECK.on('g-otoprog', 'enter', () => $$('#g-otoprog .arc').forEach((a, i) => gsap.fromTo(a, { attr: { 'stroke-dasharray': `0 ${C}` } }, { attr: { 'stroke-dasharray': `${C * a.dataset.p / 100} ${C}` }, duration: 1.6, delay: .7 + i * .2, ease: 'power3.out' })));
  DECK.on('g-otoprog', 'print', () => $$('#g-otoprog .arc').forEach(a => a.setAttribute('stroke-dasharray', `${C * a.dataset.p / 100} ${C}`)));
  DECK.on('g-cierre', 'enter', () => { const m = document.querySelector('#g-cierre .miner')._miner; m && setTimeout(() => m.wave(), 900); });
})();
