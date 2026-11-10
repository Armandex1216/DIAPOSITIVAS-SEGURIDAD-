/* Tema de gráficos Hochschild + ayudas para crear/destruir gráficos al entrar/salir de una lámina */
(function () {
  if (!window.Chart) return;
  Chart.register(ChartDataLabels);
  Chart.defaults.font.family = 'Montserrat, system-ui, sans-serif';
  // nitidez en proyectores y pantallas grandes: el escenario 1920×1080 se escala, así que se dibuja con más resolución
  Chart.defaults.devicePixelRatio = Math.max(2, (window.devicePixelRatio || 1) * Math.max(1, Math.min(innerWidth / 1920, innerHeight / 1080)) );
  Chart.defaults.font.size = 20; Chart.defaults.color = '#4c4a46';
  Chart.defaults.plugins.legend.labels.usePointStyle = true;
  Chart.defaults.plugins.tooltip.backgroundColor = '#1a1917'; Chart.defaults.plugins.tooltip.padding = 14;
  Chart.defaults.plugins.tooltip.titleFont = { weight: '700', size: 18 }; Chart.defaults.plugins.tooltip.bodyFont = { size: 17 };
  Chart.defaults.plugins.datalabels = Object.assign(Chart.defaults.plugins.datalabels || {}, { display: false });
  /* ---------- efectos: sombra suave, total en el centro de las donas y animaciones de entrada ---------- */
  const shade = (hex, amt) => { const h = String(hex || '').replace('#', ''); if (!/^[0-9a-f]{6}$/i.test(h)) return hex; const n = parseInt(h, 16); const f = c => Math.max(0, Math.min(255, Math.round(c + (amt > 0 ? (255 - c) * amt : c * amt)))); return '#' + [f(n >> 16), f((n >> 8) & 255), f(n & 255)].map(v => v.toString(16).padStart(2, '0')).join(''); };
  Chart.register({ id: 'hcShadow',
    beforeDatasetDraw(c) { if (c.config.options.hcShadow === false) return; const x = c.ctx; x.save(); x.shadowColor = 'rgba(40,30,10,.22)'; x.shadowBlur = 18; x.shadowOffsetY = 8; },
    afterDatasetDraw(c) { if (c.config.options.hcShadow === false) return; c.ctx.restore(); } });
  Chart.register({ id: 'hcCenter', // total que sube contando en el centro de la dona
    beforeInit(c) { c.$hcT0 = performance.now(); },
    afterDraw(c) { const o = c.config.options.hcCenter; if (!o || c.config.type !== 'doughnut') return; const m = c.getDatasetMeta(0); if (!m || !m.data[0]) return;
      const { x: cx, y: cy } = m.data[0], tot = (c.data.datasets[0].data || []).reduce((a, b) => a + (+b || 0), 0);
      const t = c.config.options.animation === false ? 1 : Math.min(1, (performance.now() - c.$hcT0) / 1500), e = 1 - Math.pow(1 - t, 3), v = Math.round(tot * e);
      const x = c.ctx, r = m.data[0].innerRadius || 80; x.save(); x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = '#1a1917';
      x.font = `900 ${Math.round(r * .62)}px Montserrat, sans-serif`; x.fillText(v.toLocaleString('es-PE'), cx, cy - r * .1);
      x.font = `700 ${Math.round(r * .2)}px Montserrat, sans-serif`; x.fillStyle = '#8d8a83'; x.fillText(o.label || 'TOTAL', cx, cy + r * .36); x.restore();
      if (t < 1) requestAnimationFrame(() => { try { c.draw(); } catch (e) { } }); } });
  const lum = hex => { const h = String(hex || '').replace('#', ''); if (!/^[0-9a-f]{6}$/i.test(h)) return 0; const n = parseInt(h, 16); return (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255; };
  Chart.register({ id: 'hcStackTotal', // total encima (o a la derecha) de cada barra apilada
    afterDatasetsDraw(c) { const o = c.config.options; if (!o.hcStackTotal) return; const metas = c.data.datasets.map((_, i) => c.getDatasetMeta(i)).filter(m => !m.hidden && m.data.length); if (!metas.length) return;
      const horiz = o.indexAxis === 'y', x = c.ctx, n = c.data.labels.length, sz = o.hcStackTotal.size || 22;
      x.save(); x.font = `900 ${sz}px Montserrat, sans-serif`; x.fillStyle = '#1a1917'; x.textAlign = horiz ? 'left' : 'center'; x.textBaseline = horiz ? 'middle' : 'bottom';
      for (let i = 0; i < n; i++) { let tot = 0, edge = null, cross = null;
        metas.forEach(m => { const v = +c.data.datasets[m.index].data[i] || 0, el = m.data[i]; if (!el) return; tot += v; const p = el.getProps(['x', 'y'], false); if (v > 0) { edge = edge == null ? (horiz ? p.x : p.y) : (horiz ? Math.max(edge, p.x) : Math.min(edge, p.y)); } cross = horiz ? p.y : p.x; });
        if (!tot || edge == null) continue; const txt = tot.toLocaleString('es-PE');
        if (horiz) x.fillText(txt, edge + 10, cross); else x.fillText(txt, cross, edge - 8); }
      x.restore(); } });
  Chart.register({ id: 'hcWaffle', // cuadrícula de 100 cuadros: cada cuadro = 1 % del total; se llena cuadro por cuadro
    beforeInit(c) { c.$hcW0 = performance.now(); },
    afterDraw(c) { const o = c.config.options.hcWaffle; if (!o) return; const a = c.chartArea || { left: 0, top: 0, right: c.width, bottom: c.height }, x = c.ctx;
      const v = o.values.map(n => Math.max(0, +n || 0)), tot = v.reduce((p, q) => p + q, 0); if (!tot) return;
      const ex = v.map(n => n / tot * 100), cnt = ex.map(Math.floor); let rest = 100 - cnt.reduce((p, q) => p + q, 0);
      ex.map((e, i) => [e - Math.floor(e), i]).sort((p, q) => q[0] - p[0]).forEach(([, i]) => { if (rest > 0) { cnt[i]++; rest--; } });
      const cells = []; cnt.forEach((k, i) => { for (let j = 0; j < k; j++) cells.push(i); });
      const W = a.right - a.left, H = a.bottom - a.top, side = Math.min(H, W * .56), g = side / 10, pad = Math.max(3, g * .12), x0 = a.left + 10, y0 = a.top + (H - side) / 2;
      const t = c.config.options.animation === false ? 1 : Math.min(1, (performance.now() - c.$hcW0) / 1600), shown = Math.round(100 * (1 - Math.pow(1 - t, 2)));
      x.save();
      for (let k = 0; k < 100; k++) { const col = k % 10, row = Math.floor(k / 10), px = x0 + col * g, py = y0 + (9 - row) * g; // se llena de abajo hacia arriba
        x.fillStyle = k < shown ? o.colors[cells[k] % o.colors.length] : '#eee8dc'; const r = g * .18, w = g - pad;
        x.beginPath(); x.moveTo(px + r, py); x.arcTo(px + w, py, px + w, py + w, r); x.arcTo(px + w, py + w, px, py + w, r); x.arcTo(px, py + w, px, py, r); x.arcTo(px, py, px + w, py, r); x.fill(); }
      // leyenda grande a la derecha: color, nombre, cantidad y %
      const lx = x0 + side + 40, lw = a.right - lx, n = o.labels.length, lh = Math.min(110, side / Math.max(1, n)), ly0 = y0 + (side - lh * n) / 2;
      o.labels.forEach((lab, i) => { const y = ly0 + i * lh, fade = Math.min(1, Math.max(0, (t * 1.6) - i * .15));
        x.globalAlpha = fade; x.fillStyle = o.colors[i % o.colors.length]; x.fillRect(lx, y + 8, 14, lh * .62);
        x.fillStyle = '#1a1917'; x.textBaseline = 'top'; x.font = `900 ${Math.round(Math.min(46, lh * .42))}px Montserrat, sans-serif`;
        x.fillText((o.pct ? (Math.round(v[i] * 10) / 10).toLocaleString('es-PE') + ' %' : Math.round(ex[i] * 10) / 10 + ' %'), lx + 30, y + 4);
        x.font = `700 ${Math.round(Math.min(22, lh * .22))}px Montserrat, sans-serif`; x.fillStyle = '#4c4a46';
        const txt = String(lab) + (o.pct ? '' : ' · ' + v[i].toLocaleString('es-PE')); x.fillText(txt.length * 11 > lw ? txt.slice(0, Math.floor(lw / 11)) + '…' : txt, lx + 30, y + lh * .48); });
      x.restore(); if (t < 1) requestAnimationFrame(() => { try { c.draw(); } catch (e) { } }); } });
  // aplica las animaciones y el estilo «Hochschild» a una configuración de Chart.js
  function fx(cfg) {
    const type = cfg.type, o = cfg.options = cfg.options || {}, ds = (cfg.data && cfg.data.datasets) || [];
    const ix = c => c.type === 'data' && c.mode === 'default' ? c.dataIndex : 0, di = c => c.type === 'data' && c.mode === 'default' ? c.datasetIndex : 0;
    if (type === 'doughnut' || type === 'pie') {
      o.animation = Object.assign({ animateRotate: true, animateScale: true, duration: 1700, easing: 'easeOutQuart' }, o.animation || {});
      if (o.hcCenter === undefined) o.hcCenter = { label: 'TOTAL' };
      ds.forEach(d => { const v = (d.data || []).map(Number), max = Math.max(...v); d.offset = v.map(x => x === max && v.length > 1 ? 22 : 0); d.hoverOffset = 30; d.spacing = d.spacing == null ? 3 : d.spacing; d.borderRadius = d.borderRadius == null ? 8 : d.borderRadius; d.borderWidth = d.borderWidth == null ? 0 : d.borderWidth; });
    } else if (type === 'polarArea') {
      o.animation = Object.assign({ animateRotate: true, animateScale: true, duration: 1800, easing: 'easeOutBack' }, o.animation || {});
      ds.forEach(d => { d.borderWidth = 3; d.borderColor = '#fff'; d.hoverOffset = 18; });
    } else if (type === 'radar') {
      o.animation = Object.assign({ duration: 1600, easing: 'easeOutElastic' }, o.animation || {});
      ds.forEach(d => { const col = d.borderColor || '#c39531'; d.backgroundColor = shade(col, .55) + '88'; d.borderWidth = 4; d.pointRadius = 7; d.pointBackgroundColor = col; d.pointBorderColor = '#fff'; d.pointBorderWidth = 3; });
    } else if (type === 'line') {
      const n = Math.max(1, ...ds.map(d => (d.data || []).length)), step = Math.min(90, 1600 / n);
      o.animations = Object.assign({ x: { type: 'number', easing: 'linear', duration: step, from: NaN, delay: c => c.type === 'data' && !c.xStarted ? (c.xStarted = true, c.index * step) : 0 },
        y: { type: 'number', easing: 'easeOutQuad', duration: step, from: c => c.index === 0 ? c.chart.scales.y.getPixelForValue(0) : c.chart.getDatasetMeta(c.datasetIndex).data[c.index - 1].getProps(['y'], true).y, delay: c => c.type === 'data' && !c.yStarted ? (c.yStarted = true, c.index * step) : 0 } }, o.animations || {});
      ds.forEach(d => { const col = d.borderColor || '#c39531', v = (d.data || []).map(Number), max = Math.max(...v);
        d.borderWidth = d.borderWidth || 5; d.tension = .25; d.cubicInterpolationMode = 'monotone'; d.clip = false; d.fill = d.fill == null ? 'origin' : d.fill;
        d.backgroundColor = c => { const a = c.chart.chartArea; if (!a) return shade(col, .7); const g = c.chart.ctx.createLinearGradient(0, a.top, 0, a.bottom); g.addColorStop(0, shade(col, .45) + 'aa'); g.addColorStop(1, shade(col, .9) + '11'); return g; };
        d.pointRadius = v.map(x => x === max ? 11 : x === 0 ? 8 : 6); d.pointHoverRadius = 13; d.pointBorderWidth = 3; d.pointBorderColor = '#fff';
        d.pointBackgroundColor = v.map(x => x === max ? '#c39531' : x === 0 ? '#e11d1d' : col); });
    } else if (type === 'bar') {
      o.animation = Object.assign({ duration: 1100, easing: 'easeOutBack', delay: c => ix(c) * 110 + di(c) * 200 }, o.animation || {});
      const horiz = o.indexAxis === 'y', stacked = !!(o.scales && ((o.scales.x && o.scales.x.stacked) || (o.scales.y && o.scales.y.stacked)));
      if (stacked && !o.hcRaw) { // cantidad dentro de cada nivel y total encima de la barra
        if (o.hcStackTotal === undefined) o.hcStackTotal = {}; o.layout = o.layout || {}; o.layout.padding = Object.assign({}, o.layout.padding || {}, horiz ? { right: 70 } : { top: 46 });
        ds.forEach(d => { const col = Array.isArray(d.backgroundColor) ? d.backgroundColor[0] : d.backgroundColor;
          d.datalabels = Object.assign({}, d.datalabels || {}, { display: c => +c.dataset.data[c.dataIndex] > 0, anchor: 'center', align: 'center', clamp: true, color: lum(col) > .62 ? '#1a1917' : '#fff', font: { weight: '900', size: 22 }, formatter: v => (+v).toLocaleString('es-PE') }); });
      }
      ds.forEach(d => { const base = d.backgroundColor; if (typeof base === 'function' || Array.isArray(base)) { if (Array.isArray(base)) d.backgroundColor = c => grad(c, base[c.dataIndex % base.length], horiz); return; } d.backgroundColor = c => grad(c, base, horiz); if (d.borderRadius == null) d.borderRadius = 10; if (!stacked) d.borderSkipped = false; });
    }
    // escalas: números enteros cuando todos los datos lo son; espacio arriba para la etiqueta del máximo
    if (o.scales) { const ints = ds.every(d => (d.data || []).every(v => v == null || Number.isInteger(+v)));
      Object.values(o.scales).forEach(sc => { if (sc && ints) sc.ticks = Object.assign({ precision: 0 }, sc.ticks || {}); }); }
    if (type === 'line') { o.layout = o.layout || {}; o.layout.padding = Object.assign({}, o.layout.padding || {}, { top: 44, right: 34 }); }
    return cfg;
  }
  function grad(c, col, horiz) { const a = c.chart.chartArea; if (!a || !col) return col; const g = horiz ? c.chart.ctx.createLinearGradient(a.left, 0, a.right, 0) : c.chart.ctx.createLinearGradient(0, a.bottom, 0, a.top); g.addColorStop(0, col); g.addColorStop(1, shade(col, .28)); return g; }
  const HC = window.HC = {
    gold: '#c39531', goldD: '#9a7422', goldL: '#e8c97f', char: '#2b2a28', gray: '#b4b5b7', grid: 'rgba(60,50,30,.09)',
    ok: '#1f9d5c', warn: '#e6a316', bad: '#d23c3c', blue: '#2f6db5', violet: '#7a5bd6', lime: '#c6d800',
    zone: { Presa: '#2f6db5', Selene: '#e07b39', Pallancata: '#1f9d8a' },
    lvl: { BAJO: '#9aa7b6', MEDIO: '#e6a316', ALTO: '#d23c3c' },
    charts: {}, fx, shade,
    grad(ctx, a, b, h = 700) { const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, a); g.addColorStop(1, b); return g; },
    // crea al entrar a la lámina (para que la animación se repita) y destruye al salir.
    // def (opcional) = datos por defecto {labels:[], series:[{name, values:[]}]}; si se da, el gráfico se puede editar en modo edición.
    bind(slideId, canvasId, make, def) {
      const getData = () => def ? JSON.parse(JSON.stringify((DECK.store.charts[canvasId]) || def)) : null;
      const build = (anim = true, over) => { const cv = document.getElementById(canvasId); if (!cv) return; if (HC.charts[canvasId]) HC.charts[canvasId].destroy(); const k = HC.kindOf(canvasId), mk = k ? HC.maker(k, HC.defColors[canvasId]) : make; const cfg = fx(mk(cv.getContext('2d'), over || getData())); if (!anim) { cfg.options = cfg.options || {}; cfg.options.animation = false; cfg.options.animations = false; } HC.charts[canvasId] = new Chart(cv, cfg); };
      HC.builders[canvasId] = build; HC.defs[canvasId] = def; HC.getData[canvasId] = getData;
      DECK.on(slideId, 'enter', () => setTimeout(() => build(!DECK.editing()), DECK.editing() ? 50 : 450));
      DECK.on(slideId, 'edit', () => build(false));
      DECK.on(slideId, 'leave', () => setTimeout(() => { if (HC.charts[canvasId]) { HC.charts[canvasId].destroy(); delete HC.charts[canvasId]; } }, 900));
      DECK.on(slideId, 'print', () => build(false));
      if (def) { const cv = document.getElementById(canvasId); const box = cv && cv.closest('.chartbox'); if (box) { const b = document.createElement('button'); b.className = 'data-btn'; b.textContent = '✎ Datos del gráfico'; b.onclick = e => { e.stopPropagation(); HC.editData(canvasId); }; box.appendChild(b);
        const t = document.createElement('button'); t.className = 'data-btn kind-btn'; t.textContent = '◐ Tipo de gráfico'; t.onclick = e => { e.stopPropagation(); HC.kindMenu(canvasId, t); }; box.appendChild(t); } }
      if (document.getElementById(slideId).classList.contains('active')) setTimeout(() => build(true), 700);
    },
    builders: {}, defs: {}, getData: {}, colorable: {}, defColors: {},
    /* ---------- tipo de gráfico elegido por el usuario: la misma data en otra forma ---------- */
    KINDS: { split: ['▭', 'Barra de proporción'], waffle: ['▦', 'Cuadrícula de 100'], donut: ['◍', 'Dona'], pie: ['◕', 'Pastel'], polar: ['✺', 'Área polar'], bar: ['▮', 'Barras'], hbar: ['▬', 'Barras horizontales'], line: ['⟋', 'Líneas'], radar: ['⬡', 'Radar'], stack: ['▤', 'Barras apiladas'] },
    kindOf(id) { const t = DECK.store.meta && DECK.store.meta.tipos; return (t && t[id]) || null; },
    setKind(id, k) { const m = DECK.store.meta; m.tipos = Object.assign({}, m.tipos || {}); if (k) m.tipos[id] = k; else delete m.tipos[id]; HC.colorable[id] = ['donut', 'pie', 'polar', 'split', 'waffle'].includes(k) ? 'label' : HC.colorable0[id] || HC.colorable[id]; DECK.persist(); if (HC.builders[id]) HC.builders[id](true); },
    colorable0: {},
    kindMenu(id, btn) {
      let m = document.querySelector('.kind-pop'); if (m) { m.remove(); if (m.dataset.id === id) return; }
      const d = HC.getData[id] ? HC.getData[id]() : null, multi = d && d.series.length > 1, cur = HC.kindOf(id);
      m = document.createElement('div'); m.className = 'kind-pop'; m.dataset.id = id;
      m.innerHTML = `<b>Mostrar la misma data como</b>${Object.entries(HC.KINDS).filter(([k]) => k !== 'stack' || multi).map(([k, [ic, n]]) => `<button data-k="${k}" class="${k === cur ? 'on' : ''}"><i>${ic}</i>${n}</button>`).join('')}<button data-k="" class="${cur ? '' : 'on'}"><i>↺</i>Original</button>${multi ? '<small>Dona, pastel y área polar muestran la primera serie.</small>' : ''}`;
      btn.closest('.chartbox').appendChild(m); if (HC.colorable0[id] == null) HC.colorable0[id] = HC.colorable[id];
      m.onclick = e => { e.stopPropagation(); const b = e.target.closest('[data-k]'); if (!b) return; m.remove(); HC.setKind(id, b.dataset.k || null); DECK.toast('Tipo de gráfico: ' + (b.dataset.k ? HC.KINDS[b.dataset.k][1] : 'original'), 1500); };
      setTimeout(() => document.addEventListener('click', function off() { m.remove(); document.removeEventListener('click', off); }), 0);
    },
    maker(kind, cols0) {
      const cols = cols0 && cols0.length ? cols0 : ['#c39531', '#2f6db5', '#1f9d5c', '#d23c3c', '#e6a316', '#6b46c1', '#8d8a83'];
      const fmt = v => v == null ? '' : (Math.round(v * 100) / 100).toLocaleString('es-PE');
      return (ctx, d) => {
        const C = d.colors && d.colors.length ? d.colors : cols, one = d.series.length === 1, pc = d.pct ? ' %' : '';
        const perLabel = d.labels.map((_, i) => C[i % C.length]);
        if (kind === 'waffle') return { type: 'bar', data: { labels: [], datasets: [] }, options: { maintainAspectRatio: false, hcShadow: false, plugins: { legend: { display: false }, tooltip: { enabled: false } }, scales: { x: { display: false }, y: { display: false } },
          hcWaffle: { labels: d.labels, values: d.series[0].values, colors: perLabel, pct: !!d.pct } } };
        if (kind === 'split') { // una sola barra al 100 %: cada parte con su nombre, cantidad y %
          const v = d.series[0].values.map(n => +n || 0), tot = v.reduce((a, b) => a + b, 0), sh = v.map(n => tot ? n / tot * 100 : 0);
          return { type: 'bar', data: { labels: [''], datasets: d.labels.map((l, i) => ({ label: l, data: [sh[i]], backgroundColor: perLabel[i], borderRadius: 0, borderSkipped: false, barThickness: 160, borderColor: '#fff', borderWidth: { left: i ? 3 : 0 },
            datalabels: { display: sh[i] > 7, anchor: 'center', align: 'center', textAlign: 'center', color: '#fff',
              font: { weight: '900', size: sh[i] > 14 ? 34 : 20, lineHeight: 1.2 }, formatter: () => (Math.round(sh[i] * 10) / 10).toLocaleString('es-PE') + ' %' + (d.pct ? '' : '\n' + fmt(v[i])) } })) },
            options: { maintainAspectRatio: false, indexAxis: 'y', hcRaw: true, hcStackTotal: false, layout: { padding: { top: 10, bottom: 10, right: 20 } },
              plugins: { legend: { display: true, position: 'bottom', labels: { font: { size: 18, weight: '700' }, padding: 20, generateLabels: ch => ch.data.datasets.map((x, i) => ({ text: `${x.label}: ${fmt(v[i])}${pc}`, fillStyle: perLabel[i], strokeStyle: perLabel[i], pointStyle: 'rectRounded', datasetIndex: i })) } }, tooltip: { callbacks: { label: c => ` ${c.dataset.label}: ${fmt(v[c.datasetIndex])}${pc} (${Math.round(c.raw * 10) / 10} %)` } } },
              scales: { x: { stacked: true, max: 100, display: false }, y: { stacked: true, display: false } } } };
        }
        if (kind === 'donut' || kind === 'pie' || kind === 'polar') {
          const v = d.series[0].values, tot = v.reduce((a, b) => a + (+b || 0), 0), share = x => tot ? Math.round(x / tot * 1000) / 10 : 0;
          const lab = kind === 'donut'
            ? { display: c => +c.dataset.data[c.dataIndex] > 0, anchor: 'end', align: 'end', offset: 8, textAlign: 'center', color: '#1a1917', font: { weight: '800', size: 16 }, formatter: (x, c) => String(c.chart.data.labels[c.dataIndex]).toUpperCase() + '\n' + fmt(x) + pc }
            : { display: c => +c.dataset.data[c.dataIndex] > 0, anchor: 'center', align: 'center', textAlign: 'center', color: '#fff', textStrokeColor: 'rgba(0,0,0,.35)', textStrokeWidth: 3, font: { weight: '900', size: 20 }, formatter: x => fmt(x) + pc + (kind === 'pie' && !d.pct ? '\n' + share(x) + ' %' : '') };
          const cfg = { type: kind === 'donut' ? 'doughnut' : kind === 'pie' ? 'pie' : 'polarArea', data: { labels: d.labels, datasets: [{ label: d.series[0].name, data: v, backgroundColor: perLabel, borderColor: '#fff', borderWidth: 3 }] },
            options: { maintainAspectRatio: false, layout: { padding: kind === 'donut' ? { top: 60, bottom: 60, left: 120, right: 120 } : { top: 20, bottom: 20 } },
              plugins: { legend: { display: kind !== 'donut', position: 'right', labels: { font: { size: 18, weight: '700' }, padding: 16 } }, tooltip: { callbacks: { label: c => ` ${c.label}: ${fmt(c.raw)}${pc} (${share(c.raw)} %)` } }, datalabels: lab } } };
          if (kind === 'donut') cfg.options.cutout = '52%';
          if (kind === 'polar') cfg.options.scales = { r: { ticks: { display: false }, grid: { color: 'rgba(60,50,30,.12)' }, angleLines: { display: false } } };
          return cfg;
        }
        const horiz = kind === 'hbar', stack = kind === 'stack';
        const ds = d.series.map((s, i) => ({ label: s.name, data: s.values, borderColor: one && kind !== 'line' && kind !== 'radar' ? perLabel : C[i % C.length],
          backgroundColor: one && (kind === 'bar' || kind === 'hbar') ? perLabel : C[i % C.length],
          datalabels: { display: c => c.dataset.data[c.dataIndex] != null && (stack ? +c.dataset.data[c.dataIndex] > 0 : true), anchor: stack ? 'center' : 'end', align: stack ? 'center' : horiz ? 'right' : 'top', offset: 4, color: stack ? '#fff' : '#1a1917', font: { weight: '800', size: 18 }, formatter: x => fmt(x) + pc } }));
        if (kind === 'line' || kind === 'radar') ds.forEach((x, i) => { x.borderColor = C[i % C.length]; });
        const cfg = { type: kind === 'line' ? 'line' : kind === 'radar' ? 'radar' : 'bar', data: { labels: d.labels, datasets: ds },
          options: { maintainAspectRatio: false, indexAxis: horiz ? 'y' : 'x', layout: { padding: { top: 30, right: horiz ? 70 : 30 } },
            plugins: { legend: { display: !one || stack, position: 'top', labels: { font: { size: 17, weight: '700' } } } } } };
        if (kind === 'radar') { cfg.options.scales = { r: { beginAtZero: true, ticks: { display: false }, grid: { color: 'rgba(60,50,30,.14)' }, pointLabels: { font: { size: 18, weight: '700' }, color: '#1a1917' } } }; ds.forEach(x => x.datalabels = { display: false }); }
        else cfg.options.scales = { x: HC.axis({ stacked: stack, beginAtZero: true, grid: { display: horiz } }), y: HC.axis({ stacked: stack, beginAtZero: true, grid: { display: !horiz } }) };
        return cfg;
      };
    },
    editData(id) {
      const data = HC.getData[id](); let m = document.querySelector('.modal'); if (!m) { m = document.createElement('div'); m.className = 'modal'; document.body.appendChild(m); }
      const cm = HC.colorable[id], dc = HC.defColors[id] || ['#c39531', '#2f6db5', '#1f9d5c', '#d23c3c', '#e6a316', '#6b46c1', '#8d8a83']; const col = i => (data.colors && data.colors[i]) || dc[i % dc.length];
      const render = () => {
        m.innerHTML = `<div class="mbox"><h4 class="mdrag">Datos del gráfico <small>· arrastre aquí para mover el panel</small></h4><p>El gráfico se actualiza mientras escribe. Use punto para decimales (ej. 95.07).</p><div class="mtab"><table><thead><tr><th>Etiqueta</th>${data.series.map((s, j) => `<th><input data-sn="${j}" value="${s.name.replace(/"/g, '&quot;')}">${cm === 'series' ? `<input type="color" class="mcol" data-cs="${j}" value="${col(j)}" title="Color de la serie">` : ''}</th>`).join('')}${cm === 'label' ? '<th>Color</th>' : ''}${data.dentro ? '<th>Texto dentro</th>' : ''}<th></th></tr></thead><tbody>${data.labels.map((l, i) => `<tr><td><input data-l="${i}" value="${String(l).replace(/"/g, '&quot;')}"></td>${data.series.map((s, j) => `<td><input data-v="${i}:${j}" value="${s.values[i] ?? ''}" inputmode="decimal"></td>`).join('')}${cm === 'label' ? `<td><input type="color" class="mcol" data-cl="${i}" value="${col(i)}" title="Color"></td>` : ''}${data.dentro ? `<td><input data-in="${i}" value="${String(data.dentro[i] ?? '').replace(/"/g, '&quot;')}"></td>` : ''}<td><button data-del="${i}" title="Quitar fila">✕</button></td></tr>`).join('')}</tbody></table></div>
        <div class="macts"><button data-m="add">+ Fila</button><span style="flex:1"></span><button data-m="reset">Restablecer</button><button data-m="cancel">Cancelar</button><button data-m="ok" class="ok">Guardar</button></div></div>`;
      };
      const read = () => { m.querySelectorAll('[data-l]').forEach(i => data.labels[+i.dataset.l] = i.value); m.querySelectorAll('[data-sn]').forEach(i => data.series[+i.dataset.sn].name = i.value); m.querySelectorAll('[data-v]').forEach(i => { const [r, c] = i.dataset.v.split(':').map(Number); const t = i.value.trim().replace(',', '.'); data.series[c].values[r] = t === '' ? null : parseFloat(t); }); const cs = [...m.querySelectorAll('[data-cl],[data-cs]')]; if (cs.length) data.colors = cs.map(i => i.value); m.querySelectorAll('[data-in]').forEach(i => { data.dentro[+i.dataset.in] = i.value; }); };
      const live = () => { read(); HC.builders[id](false, JSON.parse(JSON.stringify(data))); };
      render(); m.classList.add('on'); m.oninput = live;
      m.onpointerdown = e => { const h = e.target.closest('.mdrag'); if (!h) return; const box = m.querySelector('.mbox'), r = box.getBoundingClientRect(), dx = e.clientX - r.left, dy = e.clientY - r.top;
        const mv = ev => { box.style.position = 'fixed'; box.style.left = (ev.clientX - dx) + 'px'; box.style.top = (ev.clientY - dy) + 'px'; box.style.margin = 0; }; const up = () => { removeEventListener('pointermove', mv); removeEventListener('pointerup', up); }; addEventListener('pointermove', mv); addEventListener('pointerup', up); };
      m.onclick = e => { const b = e.target.closest('button'); if (e.target === m) { m.classList.remove('on'); HC.builders[id](false); return; } if (!b) return;
        if (b.dataset.del != null) { read(); const i = +b.dataset.del; data.labels.splice(i, 1); data.series.forEach(s => s.values.splice(i, 1)); if (cm === 'label' && data.colors) data.colors.splice(i, 1); if (data.dentro) data.dentro.splice(i, 1); render(); live(); }
        else if (b.dataset.m === 'add') { read(); data.labels.push('Nuevo'); data.series.forEach(s => s.values.push(0)); render(); live(); }
        else if (b.dataset.m === 'cancel') { m.classList.remove('on'); HC.builders[id](false); }
        else if (b.dataset.m === 'reset') { delete DECK.store.charts[id]; DECK.persist(); m.classList.remove('on'); HC.builders[id](false); DECK.toast('Datos originales restablecidos'); }
        else if (b.dataset.m === 'ok') { read(); DECK.store.charts[id] = data; DECK.persist(); m.classList.remove('on'); HC.builders[id](true); DECK.toast('Gráfico actualizado'); } };
    },
    axis(o = {}) { return Object.assign({ grid: { color: HC.grid, drawTicks: false }, border: { display: false }, ticks: { padding: 10, font: { size: 19, weight: '600' } } }, o); },
    refLine(value, label, color = '#2b2a28', horizontal = false) {
      return { id: 'ref' + Math.random(), afterDatasetsDraw(c) { const s = horizontal ? c.scales.x : c.scales.y, a = c.chartArea, x = c.ctx, p = s.getPixelForValue(value);
        x.save(); x.strokeStyle = color; x.lineWidth = 3; x.setLineDash([12, 8]); x.beginPath(); if (horizontal) { x.moveTo(p, a.top - 6); x.lineTo(p, a.bottom); } else { x.moveTo(a.left, p); x.lineTo(a.right, p); } x.stroke(); x.setLineDash([]);
        x.fillStyle = color; x.font = '800 19px Montserrat'; if (horizontal) { x.textAlign = 'center'; x.fillText(label, p, a.top - 14); } else { x.textAlign = 'left'; x.textBaseline = 'middle'; const parts = String(label).split('|'); parts.forEach((t, k) => x.fillText(t, a.right + 14, p + (k - (parts.length - 1) / 2) * 24)); } x.restore(); } };
    }
  };
})();
