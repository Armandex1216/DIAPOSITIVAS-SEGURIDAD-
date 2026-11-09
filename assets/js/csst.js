/* Interacciones y gráficos de la presentación CSST.
   Los medidores, barras y anillos leen los valores escritos en la lámina,
   así que al editar un número (tecla E) el gráfico se ajusta solo. */
(function () {
  const $ = s => document.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const val = el => !el ? 0 : el.hasAttribute('data-count') ? parseFloat(el.dataset.count) || 0 : DECK.num(el).v;
  const ED = () => DECK.editing();
  const onAll = (id, fn) => { ['enter', 'edit', 'edited', 'print'].forEach(ev => DECK.on(id, ev, sl => fn(ev === 'enter' && !ED(), ev))); };

  /* ---------- portada: efecto Ken Burns ---------- */
  let kb; const kenburns = () => { kb && kb.kill(); gsap.set('#kb', { scale: 1.12, x: 30 }); kb = gsap.to('#kb', { scale: 1, x: -20, duration: 14, ease: 'sine.inOut', yoyo: true, repeat: -1 }); };
  DECK.on('s-portada', 'enter', kenburns); if ($('#s-portada').classList.contains('active')) kenburns();

  /* ---------- medidores semicirculares (6) ---------- */
  const pol = (a, r) => [200 + r * Math.cos(a), 210 + r * Math.sin(a)];
  const arc = (v0, v1, max, r) => { const a0 = Math.PI + Math.PI * v0 / max, a1 = Math.PI + Math.PI * v1 / max; const [x0, y0] = pol(a0, r), [x1, y1] = pol(a1, r); return `M${x0} ${y0} A${r} ${r} 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${x1} ${y1}`; };
  const fmtT = v => (v % 1 ? v.toFixed(2) : String(v));
  $$('#s-indices .gauge').forEach(g => {
    const max = +g.dataset.max, ex = +g.dataset.ex, ac = g.dataset.ac ? +g.dataset.ac : null;
    const segs = [[0, ex, '#1f9d5c'], [ex, ac || max, ac ? '#e6a316' : '#d23c3c']]; if (ac) segs.push([ac, max, '#d23c3c']);
    g.querySelector('svg').innerHTML = segs.map(([a, b, c]) => `<path d="${arc(a, b, max, 160)}" stroke="${c}" stroke-width="34" fill="none" opacity=".9"/>`).join('') +
      `<path d="${arc(0, max, max, 128)}" stroke="#efe7d6" stroke-width="4" fill="none"/>` +
      [ex, ac].filter(v => v != null).map(v => { const [x, y] = pol(Math.PI + Math.PI * v / max, 198); return `<text x="${x}" y="${y}" font-size="22" font-weight="800" fill="#4c4a46" text-anchor="middle">${fmtT(v)}</text>`; }).join('') +
      `<g class="needle"><path d="M200 199 L345 210 L200 221z" fill="#2b2a28"/></g><circle cx="200" cy="210" r="22" fill="#2b2a28"/><circle cx="200" cy="210" r="9" fill="#c39531"/>`;
    gsap.set(g.querySelector('.needle'), { svgOrigin: '200 210', rotation: 180 });
  });
  const gaugeColor = (v, ex, ac) => v <= ex ? '#1f9d5c' : (ac && v <= ac ? '#e6a316' : '#d23c3c');
  onAll('s-indices', anim => $$('#s-indices .gauge').forEach((g, i) => {
    const max = +g.dataset.max, ex = +g.dataset.ex, ac = g.dataset.ac ? +g.dataset.ac : null, vEl = g.querySelector('.val'), v = val(vEl);
    const rot = 180 + 180 * Math.min(Math.max(v, 0), max) / max, n = g.querySelector('.needle');
    vEl.style.color = gaugeColor(v, ex, ac); gsap.killTweensOf(n);
    if (anim) gsap.fromTo(n, { rotation: 180 }, { rotation: rot, duration: 1.6, delay: .7 + i * .12, ease: 'elastic.out(1,.55)' });
    else gsap.set(n, { rotation: rot });
  }));

  /* ---------- índices mes a mes ---------- */
  const MES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Set', 'Oct', 'Nov', 'Dic'];
  const line = (target, dec) => (ctx, d) => {
    const vals = d.series[0].values, top = Math.max(target * 1.45, ...vals.filter(v => v != null).map(v => v * 1.3));
    return { type: 'line', data: { labels: d.labels, datasets: [{ label: d.series[0].name, data: vals, borderColor: HC.gold, backgroundColor: HC.gold, borderWidth: 4, pointRadius: 7, pointBorderColor: '#fff', pointBorderWidth: 3, tension: .3,
      pointBackgroundColor: c => (c.raw > target ? HC.bad : HC.gold),
      datalabels: { display: c => { const v = c.dataset.data[c.dataIndex]; return v != null && (v > 0 || c.dataIndex === c.dataset.data.reduce((k, x, j) => x != null ? j : k, 0)); }, align: 'top', offset: 8, color: c => (c.dataset.data[c.dataIndex] > target ? '#b02a2a' : '#1f9d5c'), font: { weight: '800', size: 19 }, formatter: v => v == null ? '' : v.toFixed(dec) } }] },
      options: { maintainAspectRatio: false, layout: { padding: { top: 34, right: 120 } }, plugins: { legend: { display: false } }, animation: { duration: 1400, easing: 'easeOutQuart' },
        scales: { x: HC.axis({ grid: { display: false } }), y: HC.axis({ min: 0, suggestedMax: Math.ceil(top) }) } }, plugins: [HC.refLine(target, 'Objetivo|' + target, HC.ok)] };
  };
  const yr = v10 => MES.map((m, i) => i < 9 ? 0 : (i === 9 ? v10 : null));
  HC.bind('s-indices-mes', 'c-if-p', line(1.35, 2), { labels: MES, series: [{ name: 'IF Pallancata', values: yr(0.86) }] });
  HC.bind('s-indices-mes', 'c-is-p', line(150, 2), { labels: MES, series: [{ name: 'IS Pallancata', values: yr(8.60) }] });
  HC.bind('s-indices-mes', 'c-if-s', line(1.35, 2), { labels: MES, series: [{ name: 'IF Selene', values: yr(0) }] });
  HC.bind('s-indices-mes', 'c-is-s', line(150, 2), { labels: MES, series: [{ name: 'IS Selene', values: yr(0) }] });

  /* ---------- CPI por área ---------- */
  const AREA = [['Salud e Higiene', 97.90], ['Gestión Humana', 96.81], ['Seguridad Civil', 96.50], ['Logística', 96.10], ['Medio Ambiente', 95.64], ['Tecnología', 95.00], ['Proyectos', 94.70], ['Planeamiento / Infraestructura', 94.50], ['Mantenimiento', 94.27], ['Gestión Social', 94.00]];
  HC.bind('s-cpi-area', 'c-cpi-area', (ctx, d) => { const v = d.series[0].values; return { type: 'bar', data: { labels: d.labels, datasets: [{ label: d.series[0].name, data: v,
    backgroundColor: v.map(x => x >= 95 ? HC.grad(ctx, '#2fb36c', '#1f9d5c', 600) : HC.bad), borderRadius: 10, barPercentage: .78,
    datalabels: { display: true, anchor: 'end', align: 'end', offset: 6, color: c => v[c.dataIndex] >= 95 ? '#126b3c' : '#9e1f1f', font: { weight: '900', size: 21 }, formatter: x => x == null ? '' : x.toFixed(2) + '%' } }] },
    options: { indexAxis: 'y', maintainAspectRatio: false, layout: { padding: { right: 110, top: 30 } }, plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => ' ' + c.raw.toFixed(2) + ' %' } } },
      animation: { duration: 1200, delay: c => c.type === 'data' ? c.dataIndex * 90 : 0, easing: 'easeOutQuart' },
      scales: { x: HC.axis({ min: 90, max: 100, ticks: { callback: x => x + '%', font: { size: 18 } } }), y: HC.axis({ grid: { display: false }, ticks: { font: { size: 21, weight: '700' }, color: '#1a1917' } }) } },
    plugins: [HC.refLine(95, 'Objetivo 95 %', HC.char, true)] }; },
  { labels: AREA.map(a => a[0]), series: [{ name: 'CPI octubre (%)', values: AREA.map(a => a[1]) }] });

  /* ---------- CPI mensual ---------- */
  const CPI = [95.15, 95.21, 96.20, 95.09, 95.21, 95.01, 95.02, 95.04, 95.07, 95.00];
  HC.bind('s-cpi-mes', 'c-cpi-mes', (ctx, d) => { const v = d.series[0].values; return { type: 'bar', data: { labels: d.labels, datasets: [{ label: d.series[0].name, data: v,
    backgroundColor: v.map(x => x >= 95 ? HC.grad(ctx, '#d9ad4b', '#9a7422', 640) : HC.bad), borderRadius: 12, barPercentage: .72,
    datalabels: { display: true, anchor: 'end', align: 'end', offset: 4, color: '#1a1917', font: { weight: '900', size: 20 }, formatter: x => x == null ? '' : x.toFixed(2) } }] },
    options: { maintainAspectRatio: false, layout: { padding: { top: 46, right: 140 } }, plugins: { legend: { display: false } }, animation: { duration: 1100, delay: c => c.type === 'data' ? c.dataIndex * 110 : 0 },
      scales: { x: HC.axis({ grid: { display: false } }), y: HC.axis({ min: 93, max: 97, ticks: { callback: x => x + '%' } }) } }, plugins: [HC.refLine(95, 'Objetivo|95 %', HC.ok)] }; },
  { labels: MES.slice(0, 10), series: [{ name: 'CPI (%)', values: CPI }] });

  /* ---------- barras de avance (leen el % escrito) ---------- */
  const pctColor = p => p >= 100 ? 'linear-gradient(90deg,#1f9d5c,#4cc483)' : p > 0 ? 'linear-gradient(90deg,#e6a316,#f2c14e)' : '#d23c3c';
  const bars = (sel, txtSel, barSel, delay) => anim => $$(sel).forEach((row, i) => {
    const t = row.querySelector(txtSel), b = row.querySelector(barSel); if (!t || !b) return; const p = Math.max(0, Math.min(100, val(t)));
    b.style.background = pctColor(p); t.style.color = p >= 100 ? '#1f9d5c' : p > 0 ? '#b07800' : '#d23c3c'; gsap.killTweensOf(b);
    const w = (p || 3) + '%';
    anim ? gsap.fromTo(b, { width: 0 }, { width: w, duration: 1.2, delay: delay + i * .12, ease: 'power3.out' }) : gsap.set(b, { width: w });
  });
  onAll('s-acuerdos', bars('#acuerdos .ac:not(.h)', '.pct', '.bar i', 1));

  /* ---------- nivel de riesgo: color según el texto ---------- */
  const riskPaint = () => $$('#acuerdos .risk').forEach(r => { const t = r.textContent.trim().toUpperCase(); r.className = 'risk edit ' + (/ALTO/.test(t) ? 'ALTO' : /MEDIO/.test(t) ? 'MEDIO' : 'BAJO'); });
  DECK.on('s-acuerdos', 'edited', riskPaint); riskPaint();

  /* ---------- inspección: anillos calculados con levantadas / observaciones ---------- */
  const C = 2 * Math.PI * 50;
  onAll('s-inspeccion', anim => $$('#s-inspeccion .ins .card').forEach((card, i) => {
    const obs = val(card.querySelector('.obs')), lev = val(card.querySelector('.lev')), p = obs ? Math.round(lev / obs * 100) : 0;
    const a = card.querySelector('.arc'), t = card.querySelector('.pctv'), o = { v: 0 };
    a.setAttribute('stroke', p >= 100 ? '#1f9d5c' : p >= 70 ? '#e6a316' : '#d23c3c'); gsap.killTweensOf(a);
    if (anim) { gsap.fromTo(a, { attr: { 'stroke-dasharray': `0 ${C}` } }, { attr: { 'stroke-dasharray': `${C * p / 100} ${C}` }, duration: 1.6, delay: .7 + i * .2, ease: 'power3.out' });
      gsap.to(o, { v: p, duration: 1.6, delay: .7 + i * .2, ease: 'power3.out', onUpdate: () => t.textContent = Math.round(o.v) + '%' }); }
    else { a.setAttribute('stroke-dasharray', `${C * p / 100} ${C}`); t.textContent = p + '%'; }
  }));
})();
