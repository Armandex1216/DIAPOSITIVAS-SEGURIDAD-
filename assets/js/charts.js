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
  const HC = window.HC = {
    gold: '#c39531', goldD: '#9a7422', goldL: '#e8c97f', char: '#2b2a28', gray: '#b4b5b7', grid: 'rgba(60,50,30,.09)',
    ok: '#1f9d5c', warn: '#e6a316', bad: '#d23c3c', blue: '#2f6db5', violet: '#7a5bd6', lime: '#c6d800',
    zone: { Presa: '#2f6db5', Selene: '#e07b39', Pallancata: '#1f9d8a' },
    lvl: { BAJO: '#9aa7b6', MEDIO: '#e6a316', ALTO: '#d23c3c' },
    charts: {},
    grad(ctx, a, b, h = 700) { const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, a); g.addColorStop(1, b); return g; },
    // crea al entrar a la lámina (para que la animación se repita) y destruye al salir.
    // def (opcional) = datos por defecto {labels:[], series:[{name, values:[]}]}; si se da, el gráfico se puede editar en modo edición.
    bind(slideId, canvasId, make, def) {
      const getData = () => def ? JSON.parse(JSON.stringify((DECK.store.charts[canvasId]) || def)) : null;
      const build = (anim = true, over) => { const cv = document.getElementById(canvasId); if (!cv) return; if (HC.charts[canvasId]) HC.charts[canvasId].destroy(); const cfg = make(cv.getContext('2d'), over || getData()); if (!anim) { cfg.options = cfg.options || {}; cfg.options.animation = false; } HC.charts[canvasId] = new Chart(cv, cfg); };
      HC.builders[canvasId] = build; HC.defs[canvasId] = def; HC.getData[canvasId] = getData;
      DECK.on(slideId, 'enter', () => setTimeout(() => build(!DECK.editing()), DECK.editing() ? 50 : 450));
      DECK.on(slideId, 'edit', () => build(false));
      DECK.on(slideId, 'leave', () => setTimeout(() => { if (HC.charts[canvasId]) { HC.charts[canvasId].destroy(); delete HC.charts[canvasId]; } }, 900));
      DECK.on(slideId, 'print', () => build(false));
      if (def) { const cv = document.getElementById(canvasId); const box = cv && cv.closest('.chartbox'); if (box) { const b = document.createElement('button'); b.className = 'data-btn'; b.textContent = '✎ Datos del gráfico'; b.onclick = e => { e.stopPropagation(); HC.editData(canvasId); }; box.appendChild(b); } }
      if (document.getElementById(slideId).classList.contains('active')) setTimeout(() => build(true), 700);
    },
    builders: {}, defs: {}, getData: {}, colorable: {}, defColors: {},
    editData(id) {
      const data = HC.getData[id](); let m = document.querySelector('.modal'); if (!m) { m = document.createElement('div'); m.className = 'modal'; document.body.appendChild(m); }
      const cm = HC.colorable[id], dc = HC.defColors[id] || ['#c39531', '#2f6db5', '#1f9d5c', '#d23c3c', '#e6a316', '#6b46c1', '#8d8a83']; const col = i => (data.colors && data.colors[i]) || dc[i % dc.length];
      const render = () => {
        m.innerHTML = `<div class="mbox"><h4 class="mdrag">Datos del gráfico <small>· arrastre aquí para mover el panel</small></h4><p>El gráfico se actualiza mientras escribe. Use punto para decimales (ej. 95.07).</p><div class="mtab"><table><thead><tr><th>Etiqueta</th>${data.series.map((s, j) => `<th><input data-sn="${j}" value="${s.name.replace(/"/g, '&quot;')}">${cm === 'series' ? `<input type="color" class="mcol" data-cs="${j}" value="${col(j)}" title="Color de la serie">` : ''}</th>`).join('')}${cm === 'label' ? '<th>Color</th>' : ''}<th></th></tr></thead><tbody>${data.labels.map((l, i) => `<tr><td><input data-l="${i}" value="${String(l).replace(/"/g, '&quot;')}"></td>${data.series.map((s, j) => `<td><input data-v="${i}:${j}" value="${s.values[i] ?? ''}" inputmode="decimal"></td>`).join('')}${cm === 'label' ? `<td><input type="color" class="mcol" data-cl="${i}" value="${col(i)}" title="Color"></td>` : ''}<td><button data-del="${i}" title="Quitar fila">✕</button></td></tr>`).join('')}</tbody></table></div>
        <div class="macts"><button data-m="add">+ Fila</button><span style="flex:1"></span><button data-m="reset">Restablecer</button><button data-m="cancel">Cancelar</button><button data-m="ok" class="ok">Guardar</button></div></div>`;
      };
      const read = () => { m.querySelectorAll('[data-l]').forEach(i => data.labels[+i.dataset.l] = i.value); m.querySelectorAll('[data-sn]').forEach(i => data.series[+i.dataset.sn].name = i.value); m.querySelectorAll('[data-v]').forEach(i => { const [r, c] = i.dataset.v.split(':').map(Number); const t = i.value.trim().replace(',', '.'); data.series[c].values[r] = t === '' ? null : parseFloat(t); }); const cs = [...m.querySelectorAll('[data-cl],[data-cs]')]; if (cs.length) data.colors = cs.map(i => i.value); };
      const live = () => { read(); HC.builders[id](false, JSON.parse(JSON.stringify(data))); };
      render(); m.classList.add('on'); m.oninput = live;
      m.onpointerdown = e => { const h = e.target.closest('.mdrag'); if (!h) return; const box = m.querySelector('.mbox'), r = box.getBoundingClientRect(), dx = e.clientX - r.left, dy = e.clientY - r.top;
        const mv = ev => { box.style.position = 'fixed'; box.style.left = (ev.clientX - dx) + 'px'; box.style.top = (ev.clientY - dy) + 'px'; box.style.margin = 0; }; const up = () => { removeEventListener('pointermove', mv); removeEventListener('pointerup', up); }; addEventListener('pointermove', mv); addEventListener('pointerup', up); };
      m.onclick = e => { const b = e.target.closest('button'); if (e.target === m) { m.classList.remove('on'); HC.builders[id](false); return; } if (!b) return;
        if (b.dataset.del != null) { read(); const i = +b.dataset.del; data.labels.splice(i, 1); data.series.forEach(s => s.values.splice(i, 1)); if (cm === 'label' && data.colors) data.colors.splice(i, 1); render(); live(); }
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
