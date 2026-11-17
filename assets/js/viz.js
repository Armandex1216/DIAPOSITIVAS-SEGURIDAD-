/* Gráficos animados especiales (SVG + GSAP) para elementos libres de tipo «viz».
   Cada gráfico se dibuja con los datos de f.def y se anima al entrar a la lámina.
   Tipos: kpis, race, score, heat, sankey, bubble, treemap, dots, picto, dumbbell */
(function () {
  const esc = t => String(t == null ? '' : t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const nf = (v, d = 0) => Number(v).toLocaleString('es-PE', { minimumFractionDigits: d, maximumFractionDigits: d });
  const C = { ink: '#1a1917', mute: '#6f6b63', line: '#e6dfd1', soft: '#f4efe5', gold: '#c39531', red: '#d23c3c', green: '#1f9d5c', amber: '#e6a316', blue: '#2f6db5' };
  const css = `
.fviz{overflow:visible}.vizbox{position:absolute;inset:0}.vizbox svg{display:block;width:100%;height:100%;overflow:visible;font-family:Montserrat,sans-serif}
.vz-kpis{display:grid;grid-auto-flow:column;grid-auto-columns:1fr;gap:22px;height:100%}
.vz-k{position:relative;background:#fff;border-radius:22px;padding:22px 24px 18px;box-shadow:0 10px 30px rgba(40,30,10,.10);border-top:7px solid var(--c);display:flex;flex-direction:column;overflow:hidden}
.vz-kv{display:flex;align-items:baseline;gap:4px;color:var(--c);font:900 68px/1 Montserrat,sans-serif;letter-spacing:-1px}.vz-kv i{font-style:normal;font-size:38px}
.vz-kl{font:800 22px/1.2 Montserrat,sans-serif;color:${C.ink};margin-top:10px}.vz-ks{font:600 18px/1.3 Montserrat,sans-serif;color:${C.mute};margin-top:6px}
.vz-kbar{margin-top:auto;height:8px;border-radius:8px;background:${C.soft};overflow:hidden}.vz-kbar span{display:block;height:100%;width:0;background:var(--c);border-radius:8px}
.vz-k .vz-tag{position:absolute;right:16px;top:14px;font:800 15px Montserrat,sans-serif;padding:5px 10px;border-radius:20px;background:var(--tb,#eef7f1);color:var(--tc,${C.green})}
.viz-ed{right:auto!important;left:0}
.vz-halo{transform-box:fill-box;transform-origin:center;animation:vzHalo 1.8s ease-out infinite}
@keyframes vzHalo{0%{transform:scale(1);opacity:.55}100%{transform:scale(2.4);opacity:0}}
.vz-pulse{transform-box:fill-box;transform-origin:center;animation:vzPulse 1.6s ease-in-out infinite}
@keyframes vzPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.06)}}
.vz-march{animation:vzMarch 1.2s linear infinite}@keyframes vzMarch{to{stroke-dashoffset:-32}}
.vz-glow{animation:vzGlow 2s ease-in-out infinite}@keyframes vzGlow{0%,100%{opacity:.25}50%{opacity:.75}}
.vz-k::after{content:"";position:absolute;inset:0;background:linear-gradient(105deg,transparent 35%,rgba(255,255,255,.75) 50%,transparent 65%);transform:translateX(-120%);animation:vzShine 5s ease-in-out 2.4s infinite;pointer-events:none}
@keyframes vzShine{0%{transform:translateX(-120%)}25%,100%{transform:translateX(120%)}}.viz-modal{place-items:center!important;padding:0!important;background:rgba(10,9,8,.45)!important;z-index:200!important}.viz-modal .nbox{background:#fff;padding:24px;border-radius:18px;box-shadow:0 20px 60px rgba(0,0,0,.3);font-family:Montserrat,sans-serif}.solo-ver .viz-ed{display:none!important}`;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  const svg = (W, H, inner) => `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;
  const T = (x, y, s, o = {}) => `<text x="${x}" y="${y}" font-size="${o.fs || 20}" font-weight="${o.fw || 700}" fill="${o.c || C.ink}" text-anchor="${o.a || 'start'}" ${o.db ? `dominant-baseline="${o.db}"` : ''} ${o.cls ? `class="${o.cls}"` : ''} ${o.at || ''}>${esc(s)}</text>`;
  const counter = (tl, el, to, dec, at, dur = 1.4) => { const o = { v: 0 }; tl.to(o, { v: to, duration: dur, ease: 'power2.out', onUpdate: () => { el.textContent = nf(o.v, dec); } }, at); };
  const counters = (tl, root, at, step = .1) => [...root.querySelectorAll('[data-to]')].forEach((el, i) => counter(tl, el, +el.dataset.to, +(el.dataset.dec || 0), at + i * step));


  // brillo que recorre cada barra al terminar de crecer
  const shine = (tl, host, sel, ax, at) => { const sv = host.querySelector('svg'); if (!sv) return; let defs = sv.querySelector('defs'); if (!defs) { defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs'); sv.prepend(defs); }
    const gid = 'vzsh-' + host.id; defs.insertAdjacentHTML('beforeend', `<linearGradient id="${gid}" x1="0" y1="0" x2="${ax === 'x' ? 1 : 0}" y2="${ax === 'x' ? 0 : 1}"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>`);
    host.querySelectorAll(sel).forEach((r, i) => { const x = +r.getAttribute('x'), y = +r.getAttribute('y'), w = +r.getAttribute('width'), hh = +r.getAttribute('height'); if (w < 6 || hh < 6) return;
      const cid = `${gid}-c${i}`; defs.insertAdjacentHTML('beforeend', `<clipPath id="${cid}"><rect x="${x}" y="${y}" width="${w}" height="${hh}" rx="${r.getAttribute('rx') || 0}"/></clipPath>`);
      const sh = document.createElementNS('http://www.w3.org/2000/svg', 'rect'); const sw = ax === 'x' ? Math.max(60, w * .35) : w, shh = ax === 'x' ? hh : Math.max(60, hh * .35);
      sh.setAttribute('x', ax === 'x' ? x - sw : x); sh.setAttribute('y', ax === 'x' ? y : y + hh); sh.setAttribute('width', sw); sh.setAttribute('height', shh); sh.setAttribute('fill', `url(#${gid})`); sh.setAttribute('clip-path', `url(#${cid})`); sh.setAttribute('pointer-events', 'none');
      r.parentNode.appendChild(sh);
      tl.fromTo(sh, { attr: ax === 'x' ? { x: x - sw } : { y: y + hh } }, { attr: ax === 'x' ? { x: x + w } : { y: y - shh }, duration: .9, ease: 'power2.inOut' }, at + i * .07); }); };
  const K = {};
  /* ---------- tarjetas con cifra grande ---------- */
  K.kpis = (host, d) => {
    host.innerHTML = `<div class="vz-kpis">${d.items.map(k => `<div class="vz-k" style="--c:${k.c || C.gold}${k.tag ? `;--tb:${k.tagBg || '#eef7f1'};--tc:${k.tagC || C.green}` : ''}">${k.tag ? `<span class="vz-tag">${esc(k.tag)}</span>` : ''}<div class="vz-kv"><b data-to="${k.v}" data-dec="${k.dec || 0}">${nf(k.v, k.dec || 0)}</b><i>${esc(k.suf || '')}</i></div><div class="vz-kl">${esc(k.label)}</div><div class="vz-ks">${esc(k.sub || '')}</div><div class="vz-kbar"><span data-w="${Math.max(0, Math.min(100, k.bar == null ? 100 : k.bar))}"></span></div></div>`).join('')}</div>`;
    const tl = gsap.timeline({ paused: true }), cards = host.querySelectorAll('.vz-k');
    tl.from(cards, { y: 50, opacity: 0, scale: .92, duration: .7, stagger: .12, ease: 'back.out(1.6)' }, .15);
    counters(tl, host, .35, .12);
    host.querySelectorAll('.vz-kbar span').forEach((s, i) => tl.fromTo(s, { width: '0%' }, { width: s.dataset.w + '%', duration: 1.2, ease: 'power3.out' }, .5 + i * .12));
    return tl;
  };
  /* ---------- carrera acumulada (mes actual contra mes anterior) ---------- */
  K.race = (host, d, W, H) => {
    const L = 80, R = 190, Tp = 40, B = 62, w = W - L - R, h = H - Tp - B, days = d.days || 31;
    const ymax = d.ymax || Math.max(...d.series.map(s => Math.max(...s.values))) * 1.08, step = d.ystep || Math.ceil(ymax / 5 / 50) * 50;
    const x = i => L + (i / (days - 1)) * w, y = v => Tp + h - v / ymax * h;
    let g = '';
    for (let v = 0; v <= ymax; v += step) g += `<line x1="${L}" x2="${L + w}" y1="${y(v)}" y2="${y(v)}" stroke="${C.line}" stroke-width="1.5"/>` + T(L - 14, y(v) + 7, nf(v), { a: 'end', fs: 18, fw: 600, c: C.mute });
    for (let i = 0; i < days; i += 1) if (i === 0 || (i + 1) % 5 === 0) g += T(x(i), Tp + h + 34, i + 1, { a: 'middle', fs: 18, fw: 600, c: C.mute });
    g += T(L + w / 2, Tp + h + 60, d.xlab || 'Día del mes', { a: 'middle', fs: 17, fw: 700, c: C.mute });
    if (d.hoy) g += `<line class="vz-hoy" x1="${x(d.hoy - 1)}" x2="${x(d.hoy - 1)}" y1="${Tp - 10}" y2="${Tp + h}" stroke="${C.ink}" stroke-width="2" stroke-dasharray="6 6"/>` + T(x(d.hoy - 1), Tp - 18, d.hoyLabel || 'Hoy', { a: 'middle', fs: 18, fw: 800, cls: 'vz-hoy' });
    g += `<defs><linearGradient id="vzg-${host.id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${d.series[d.series.length - 1].c}" stop-opacity=".28"/><stop offset="1" stop-color="${d.series[d.series.length - 1].c}" stop-opacity="0"/></linearGradient></defs>`;
    d.series.forEach((s, k) => {
      const pts = s.values.map((v, i) => [x(i), y(v)]), p = 'M' + pts.map(q => q.join(',')).join(' L');
      if (k === d.series.length - 1) g += `<path class="vz-area" d="${p} L${pts[pts.length - 1][0]},${y(0)} L${pts[0][0]},${y(0)} Z" fill="url(#vzg-${host.id})"/>`;
      g += `<path class="vz-ln" d="${p}" pathLength="1" fill="none" stroke="${s.c}" stroke-width="${s.wd || 6}" stroke-linecap="round" stroke-linejoin="round" ${s.dash ? 'stroke-dasharray="1"' : ''} opacity="${s.op || 1}"/>`;
      const e = pts[pts.length - 1], lv = s.values[s.values.length - 1];
      g += `<g class="vz-end" data-k="${k}">${k === d.series.length - 1 ? `<circle class="vz-halo" cx="${e[0]}" cy="${e[1]}" r="12" fill="${s.c}"/>` : ''}<circle cx="${e[0]}" cy="${e[1]}" r="11" fill="${s.c}" stroke="#fff" stroke-width="4"/>${T(e[0] + 18, e[1] + 2, '', { fs: 30, fw: 900, c: s.c, db: 'middle', at: `data-to="${lv}"` })}${T(e[0] + 18, e[1] + 30, s.name, { fs: 17, fw: 700, c: C.mute, db: 'middle' })}</g>`;
      if (s.mark) { const i = s.mark - 1, v = s.values[i]; g += `<g class="vz-mk"><circle cx="${x(i)}" cy="${y(v)}" r="9" fill="#fff" stroke="${s.c}" stroke-width="4"/>${T(x(i) + 14, y(v) + 40, `${nf(v)} al día ${s.mark}`, { fs: 18, fw: 800, c: s.c })}</g>`; }
    });
    host.innerHTML = svg(W, H, g);
    const tl = gsap.timeline({ paused: true }), lns = host.querySelectorAll('.vz-ln');
    tl.from(host.querySelectorAll('line,text:not([data-to])'), { opacity: 0, duration: .5, stagger: .004 }, 0);
    lns.forEach((l, i) => { const dash = d.series[i].dash; tl.fromTo(l, { strokeDasharray: '1 1', strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 2.2, ease: 'power1.inOut', onComplete: dash ? () => l.style.strokeDasharray = '.012 .012' : null }, .3); if (dash) tl.set(l, { strokeDasharray: '.012 .012', strokeDashoffset: 0 }, 2.55); });
    tl.from(host.querySelectorAll('.vz-area'), { opacity: 0, duration: 1 }, 1.6);
    tl.from(host.querySelectorAll('.vz-end'), { scale: 0, transformOrigin: 'left center', opacity: 0, duration: .5, stagger: .15, ease: 'back.out(2)' }, 2.3);
    counters(tl, host, 2.35, .15);
    tl.from(host.querySelectorAll('.vz-mk'), { opacity: 0, y: 12, duration: .5 }, 2.8);
    tl.from(host.querySelectorAll('.vz-hoy'), { opacity: 0, duration: .6 }, 2.6);
    return tl;
  };
  /* ---------- marcador mes anterior → mes actual → meta ---------- */
  K.score = (host, d, W, H) => {
    const n = d.rows.length, LW = d.lw || 560, RW = 210, x0 = LW + 30, x1 = W - RW - 20, rh = (H - 40) / n, sx = v => x0 + v / 100 * (x1 - x0);
    let g = T(sx(0), 22, '0 %', { a: 'middle', fs: 16, fw: 600, c: C.mute }) + T(sx(50), 22, '50 %', { a: 'middle', fs: 16, fw: 600, c: C.mute }) + T(sx(100), 22, '100 %', { a: 'middle', fs: 16, fw: 600, c: C.mute });
    g += T(W - RW / 2, 22, d.deltaLab || 'Cambio', { a: 'middle', fs: 16, fw: 800, c: C.mute });
    d.rows.forEach((r, i) => {
      const cy = 40 + rh * i + rh / 2, better = r.inv ? r.b < r.a : r.b > r.a, same = r.b === r.a, col = same ? C.mute : better ? C.green : C.red, dl = r.b - r.a;
      g += `<g class="vz-row">`;
      g += T(0, cy - 6, r.label, { fs: 25, fw: 800, db: 'middle' }) + T(0, cy + 24, r.sub || (r.inv ? 'menor es mejor' : ''), { fs: 17, fw: 600, c: C.mute, db: 'middle' });
      g += `<rect x="${sx(0)}" y="${cy - 9}" width="${sx(100) - sx(0)}" height="18" rx="9" fill="${C.soft}"/>`;
      g += `<rect class="vz-fill" x="${sx(0)}" y="${cy - 9}" width="${Math.max(0, sx(r.b) - sx(0))}" height="18" rx="9" fill="${col}" opacity=".22"/>`;
      if (r.meta != null) g += `<g class="vz-meta"><line x1="${sx(r.meta)}" x2="${sx(r.meta)}" y1="${cy - 30}" y2="${cy + 20}" stroke="${C.gold}" stroke-width="4"/><path d="M${sx(r.meta)},${cy - 30} l22,7 l-22,7 Z" fill="${C.gold}"/>${T(sx(r.meta) + (r.meta > 88 || r.inv ? -8 : 26), cy - 18, `Meta ${r.inv ? '≤' : ''}${r.meta}%`, { fs: 16, fw: 800, c: '#9a7420', a: r.meta > 88 || r.inv ? 'end' : 'start' })}</g>`;
      g += `<g class="vz-a"><circle cx="${sx(r.a)}" cy="${cy}" r="13" fill="#fff" stroke="#9c978d" stroke-width="4"/>${T(sx(r.a), cy + 42, `${d.aLab || 'Oct'} ${r.a}%`, { a: 'middle', fs: 17, fw: 700, c: '#8a857b' })}</g>`;
      g += `<g class="vz-b" data-dx="${sx(r.b) - sx(r.a)}"><circle cx="${sx(r.a)}" cy="${cy}" r="17" fill="${col}" stroke="#fff" stroke-width="4"/>${T(sx(r.a), cy - 28, '', { a: 'middle', fs: 24, fw: 900, c: col, at: `data-to="${r.b}"` })}</g>`;
      g += `<g class="vz-chip"><rect class="${!better && !same ? 'vz-pulse' : ''}" x="${W - RW + 10}" y="${cy - 26}" width="${RW - 20}" height="52" rx="26" fill="${col}"/>${T(W - RW / 2, cy + 2, same ? '= igual' : `${better ? 'Mejoró' : 'Empeoró'} ${Math.abs(dl)} pts`, { a: 'middle', fs: 20, fw: 900, c: '#fff', db: 'middle' })}</g>`;
      g += `</g>`;
    });
    host.innerHTML = svg(W, H, g);
    host.querySelectorAll('.vz-b text').forEach(t => t.textContent = '');
    const tl = gsap.timeline({ paused: true });
    tl.from(host.querySelectorAll('.vz-row'), { opacity: 0, x: -30, duration: .5, stagger: .1 }, .1);
    tl.from(host.querySelectorAll('.vz-meta'), { opacity: 0, y: -16, duration: .4, stagger: .08 }, .6);
    host.querySelectorAll('.vz-b').forEach((b, i) => { const dx = +b.dataset.dx, t = b.querySelector('text'); tl.fromTo(b, { x: 0 }, { x: dx, duration: 1.4, ease: 'power3.inOut' }, 1 + i * .12); counter(tl, t, +t.dataset.to, 0, 1 + i * .12, 1.4); });
    host.querySelectorAll('.vz-fill').forEach((f, i) => tl.from(f, { attr: { width: 0 }, duration: 1.4, ease: 'power3.inOut' }, 1 + i * .12));
    tl.from(host.querySelectorAll('.vz-chip'), { scale: 0, transformOrigin: '50% 50%', opacity: 0, duration: .45, stagger: .1, ease: 'back.out(2.2)' }, 2.3);
    tl.set(host.querySelectorAll('.vz-b text'), { attr: { 'text-anchor': 'middle' } }, 0);
    return tl;
  };
  /* ---------- mapa de calor (filas × días) ---------- */
  K.heat = (host, d, W, H) => {
    const LW = d.lw || 200, RW = 110, top = 64, nc = d.cols.length, nr = d.rows.length, gap = 6;
    const cw = (W - LW - RW - gap * (nc - 1)) / nc, ch = Math.min(110, (H - top - 10 - gap * (nr - 1)) / nr), max = Math.max(...d.values.flat());
    let g = '';
    if (d.mark) d.mark.forEach(m => { const cx = LW + m.col * (cw + gap); g += `<g class="vz-mark"><rect x="${cx - 5}" y="${top - 12}" width="${cw + 10}" height="${nr * (ch + gap) + 16}" rx="12" fill="${m.c || C.gold}" fill-opacity=".08" class="vz-glow"/><rect class="vz-march" x="${cx - 5}" y="${top - 12}" width="${cw + 10}" height="${nr * (ch + gap) + 16}" rx="12" fill="none" stroke="${m.c || C.gold}" stroke-width="4" stroke-dasharray="10 6"/>${T(cx + cw / 2, top - 22, m.label, { a: 'middle', fs: 17, fw: 900, c: m.c || '#9a7420' })}</g>`; });
    d.cols.forEach((c, j) => { g += T(LW + j * (cw + gap) + cw / 2, top - (d.mark && d.mark.some(m => m.col === j) ? 46 : 18), c, { a: 'middle', fs: 17, fw: 700, c: d.we && d.we.includes(j) ? C.red : C.mute }); });
    g += T(W - RW / 2 + 10, top - 18, 'Total', { a: 'middle', fs: 17, fw: 800, c: C.mute });
    d.rows.forEach((r, i) => {
      const y = top + i * (ch + gap), base = (d.colors && d.colors[i]) || C.gold, tot = d.values[i].reduce((a, b) => a + b, 0);
      g += T(LW - 18, y + ch / 2, r, { a: 'end', fs: 24, fw: 800, db: 'middle' });
      d.values[i].forEach((v, j) => {
        const x = LW + j * (cw + gap), a = v ? .18 + .82 * Math.pow(v / max, .8) : 0;
        g += `<g class="vz-cell" data-j="${j}"><rect x="${x}" y="${y}" width="${cw}" height="${ch}" rx="10" fill="${v ? base : '#fff'}" fill-opacity="${v ? a : 1}" stroke="${v ? 'none' : '#e8a3a3'}" stroke-width="${v ? 0 : 2}" ${v ? '' : 'stroke-dasharray="5 5"'}/>${T(x + cw / 2, y + ch / 2 + 1, v ? v : '0', { a: 'middle', db: 'middle', fs: Math.min(26, cw * .5), fw: 900, c: v ? (a > .55 ? '#fff' : C.ink) : '#d9a0a0' })}</g>`;
      });
      g += `<g class="vz-tot">${T(W - RW / 2 + 10, y + ch / 2, '', { a: 'middle', db: 'middle', fs: 32, fw: 900, c: base, at: `data-to="${tot}"` })}</g>`;
    });
    host.innerHTML = svg(W, H, g);
    const tl = gsap.timeline({ paused: true }), cells = [...host.querySelectorAll('.vz-cell')];
    tl.from(host.querySelectorAll('text:not([data-to])'), { opacity: 0, duration: .4 }, 0);
    cells.forEach(c => tl.from(c, { scale: 0, transformOrigin: '50% 50%', opacity: 0, duration: .45, ease: 'back.out(2)' }, .2 + +c.dataset.j * .07 + Math.random() * .05));
    tl.from(host.querySelectorAll('.vz-mark'), { opacity: 0, scale: 1.15, transformOrigin: '50% 50%', duration: .6, ease: 'back.out(2)' }, .3 + nc * .07);
    counters(tl, host, .3 + nc * .07, .12);
    return tl;
  };
  /* ---------- flujo (sankey de 3 columnas) ---------- */
  K.sankey = (host, d, W, H) => {
    const nw = 30, padT = 10, gapN = 22, cols = d.cols, xs = cols.map((_, i) => (d.lw || 0) + i / (cols.length - 1) * (W - nw - (d.rw || 230) - (d.lw || 0)));
    const val = {}; d.links.forEach(([a, b, v]) => { val[a] = val[a] || { o: 0, i: 0 }; val[b] = val[b] || { o: 0, i: 0 }; val[a].o += v; val[b].i += v; });
    const nv = k => Math.max(val[k].o, val[k].i), tot = Math.max(...cols.map(c => c.reduce((s, k) => s + nv(k), 0)));
    const sc = Math.min(...cols.map(c => (H - padT - 40 - gapN * (c.length - 1)) / tot)), pos = {};
    cols.forEach((c, ci) => { let y = padT; c.forEach(k => { pos[k] = { x: xs[ci], y, h: nv(k) * sc, oy: y, iy: y }; y += nv(k) * sc + gapN; }); });
    const col = k => (d.colors || {})[k] || C.gold;
    let g = `<defs><clipPath id="vzc-${host.id}"><rect class="vz-clip" x="0" y="-20" width="${W}" height="${H + 40}"/></clipPath></defs><g clip-path="url(#vzc-${host.id})">`;
    d.links.forEach(([a, b, v]) => {
      const s = pos[a], t = pos[b], hh = v * sc, x0 = s.x + nw, x1 = t.x, xm = (x0 + x1) / 2, sy = s.oy, ty = t.iy; s.oy += hh; t.iy += hh;
      g += `<path d="M${x0},${sy} C${xm},${sy} ${xm},${ty} ${x1},${ty} L${x1},${ty + hh} C${xm},${ty + hh} ${xm},${sy + hh} ${x0},${sy + hh} Z" fill="${col((d.linkBy || 'src') === 'src' ? a : b)}" fill-opacity="${(d.hl || []).includes(a) || (d.hl || []).includes(b) ? .62 : .3}"/>`;
      if (hh > 26 && d.linkVals !== false) g += T(x1 - 10, ty + hh / 2, v, { a: 'end', db: 'middle', fs: 17, fw: 800, c: '#fff', at: 'paint-order="stroke" stroke="rgba(0,0,0,.25)" stroke-width="3"' });
    });
    g += '</g>';
    cols.forEach((c, ci) => c.forEach(k => { const p = pos[k], last = ci === cols.length - 1, first = ci === 0;
      g += `<g class="vz-node"><rect x="${p.x}" y="${p.y}" width="${nw}" height="${Math.max(3, p.h)}" rx="6" fill="${col(k)}"/>`;
      const tx = last ? p.x + nw + 14 : first ? p.x - 14 : p.x + nw + 12, an = first ? 'end' : 'start', cy = p.y + p.h / 2;
      const halo = !first && !last ? 'paint-order="stroke" stroke="#fff" stroke-width="6"' : '';
      if (p.h > 44) g += T(tx, cy - 10, k, { a: an, db: 'middle', fs: 24, fw: 800, at: halo }) + T(tx, cy + 18, `${nv(k)} · ${Math.round(nv(k) / tot * 100)} %`, { a: an, db: 'middle', fs: 18, fw: 700, c: C.mute, at: halo });
      else g += T(tx, cy, `${k} · ${nv(k)}`, { a: an, db: 'middle', fs: 18, fw: 800, at: halo });
      g += '</g>'; }));
    if (d.heads) d.heads.forEach((h, i) => { g += T(xs[i] + nw / 2, H - 4, h, { a: 'middle', fs: 17, fw: 900, c: C.mute, at: 'letter-spacing="2"' }); });
    host.innerHTML = svg(W, H, g);
    const tl = gsap.timeline({ paused: true });
    tl.from(host.querySelectorAll('.vz-node'), { opacity: 0, scaleY: 0, transformOrigin: '50% 50%', duration: .6, stagger: .05, ease: 'power3.out' }, .1);
    tl.fromTo(host.querySelector('.vz-clip'), { attr: { width: 0 } }, { attr: { width: W }, duration: 2.2, ease: 'power2.inOut' }, .5);
    return tl;
  };
  /* ---------- burbujas (dispersión con cuadrantes) ---------- */
  K.bubble = (host, d, W, H) => {
    const L = 90, R = 30, Tp = 20, B = 70, w = W - L - R, h = H - Tp - B, y0 = d.ymin || 0, X = v => L + v / d.xmax * w, Y = v => Tp + h - (v - y0) / (d.ymax - y0) * h, rmax = Math.max(...d.pts.map(p => p.r));
    let g = '';
    (d.quads || []).forEach(q => { g += `<g class="vz-q"><rect x="${X(q.x0)}" y="${Y(q.y1)}" width="${X(q.x1) - X(q.x0)}" height="${Y(q.y0) - Y(q.y1)}" fill="${q.c}" fill-opacity=".08"/>${T(q.ax === 'end' ? X(q.x1) - 14 : X(q.x0) + 14, q.ay === 'bottom' ? Y(q.y0) - 14 : Y(q.y1) + 28, q.label, { a: q.ax || 'start', fs: 19, fw: 900, c: q.c, at: 'letter-spacing=".5"' })}</g>`; });
    for (let v = 0; v <= d.ymax; v += d.ystep || 25) g += `<line x1="${L}" x2="${L + w}" y1="${Y(v)}" y2="${Y(v)}" stroke="${C.line}" stroke-width="1.5"/>` + T(L - 12, Y(v) + 6, v + (d.ysuf || ''), { a: 'end', fs: 17, fw: 600, c: C.mute });
    for (let v = 0; v <= d.xmax; v += d.xstep || 2) g += T(X(v), Tp + h + 30, v, { a: 'middle', fs: 17, fw: 600, c: C.mute });
    g += `<line x1="${L}" x2="${L + w}" y1="${Tp + h}" y2="${Tp + h}" stroke="#cfc6b5" stroke-width="2"/>` + T(L + w / 2, H - 6, d.xlab, { a: 'middle', fs: 18, fw: 800, c: C.mute }) + `<text transform="translate(18 ${Tp + h / 2}) rotate(-90)" text-anchor="middle" font-size="18" font-weight="800" fill="${C.mute}">${esc(d.ylab)}</text>`;
    d.pts.forEach(p => { const r = 12 + 26 * Math.sqrt(p.r / rmax), cx = X(p.x), cy = Y(p.y), right = p.lab !== 'l';
      g += `<g class="vz-pt">${p.c === C.red ? `<circle class="vz-halo" cx="${cx}" cy="${cy}" r="${r}" fill="${p.c}"/>` : ''}<circle cx="${cx}" cy="${cy}" r="${r}" fill="${p.c}" fill-opacity=".85" stroke="#fff" stroke-width="3"/>${T(cx, cy + 1, p.x, { a: 'middle', db: 'middle', fs: Math.max(14, r * .7), fw: 900, c: '#fff' })}${T(right ? cx + r + 8 : cx - r - 8, cy - (p.dy || 0), p.name, { a: right ? 'start' : 'end', db: 'middle', fs: 18, fw: 800, at: 'paint-order="stroke" stroke="#fff" stroke-width="5"' })}${p.note ? T(right ? cx + r + 8 : cx - r - 8, cy - (p.dy || 0) + 21, p.note, { a: right ? 'start' : 'end', db: 'middle', fs: 15, fw: 700, c: p.c, at: 'paint-order="stroke" stroke="#fff" stroke-width="5"' }) : ''}</g>`; });
    host.innerHTML = svg(W, H, g);
    const tl = gsap.timeline({ paused: true });
    tl.from(host.querySelectorAll('line,svg > text'), { opacity: 0, duration: .4 }, 0);
    tl.from(host.querySelectorAll('.vz-q'), { opacity: 0, duration: .6, stagger: .12 }, .2);
    tl.from(host.querySelectorAll('.vz-pt'), { scale: 0, transformOrigin: '50% 50%', opacity: 0, duration: .55, stagger: .07, ease: 'back.out(2.4)' }, .6);
    host.querySelectorAll('.vz-pt').forEach(p => { const c = p.querySelector('circle'); p.style.transformOrigin = `${c.getAttribute('cx')}px ${c.getAttribute('cy')}px`; p.style.transformBox = 'view-box'; });
    return tl;
  };
  /* ---------- mapa de rectángulos (treemap) ---------- */
  K.treemap = (host, d, W, H) => {
    const items = d.items.slice().sort((a, b) => b.v - a.v), tot = items.reduce((s, i) => s + i.v, 0), out = [];
    const worst = (row, w, k) => { const s = row.reduce((a, b) => a + b.v * k, 0), mx = Math.max(...row.map(r => r.v * k)), mn = Math.min(...row.map(r => r.v * k)); return Math.max(w * w * mx / (s * s), s * s / (w * w * mn)); };
    (function sq(list, x, y, w, h) { if (!list.length) return; const k = (w * h) / list.reduce((s, i) => s + i.v, 0), side = Math.min(w, h); let row = [list[0]], i = 1;
      while (i < list.length && worst(row.concat(list[i]), side, k) <= worst(row, side, k)) row.push(list[i++]);
      const s = row.reduce((a, b) => a + b.v * k, 0), t = s / side; let o = 0;
      row.forEach(r => { const l = r.v * k / t; if (w >= h) out.push([r, x, y + o, t, l]); else out.push([r, x + o, y, l, t]); o += l; });
      if (w >= h) sq(list.slice(i), x + t, y, w - t, h); else sq(list.slice(i), x, y + t, w, h - t); })(items, 0, 0, W, H);
    let g = '';
    out.forEach(([r, x, y, w, h]) => { const big = w > 230 && h > 140, fs = big ? 30 : w > 150 && h > 80 ? 21 : 16;
      g += `<g class="vz-tile"><rect x="${x + 3}" y="${y + 3}" width="${Math.max(0, w - 6)}" height="${Math.max(0, h - 6)}" rx="14" fill="${r.c || C.gold}"/>`;
      if (w > 90 && h > 54) { g += T(x + 18, y + 18 + fs, r.v, { fs: fs * 1.5, fw: 900, c: '#fff' }); g += `<foreignObject x="${x + 16}" y="${y + 24 + fs * 1.6}" width="${Math.max(10, w - 30)}" height="${Math.max(10, h - fs * 1.6 - 30)}"><div xmlns="http://www.w3.org/1999/xhtml" style="font:800 ${fs * .72}px/1.15 Montserrat,sans-serif;color:#fff">${esc(r.name)}${r.sub && h > 120 ? `<div style="font-weight:600;font-size:${Math.max(14, fs * .55)}px;opacity:.9;margin-top:6px">${esc(r.sub)}</div>` : ''}</div></foreignObject>`; }
      else g += T(x + w / 2, y + h / 2, r.v, { a: 'middle', db: 'middle', fs: 18, fw: 900, c: '#fff' });
      g += '</g>'; });
    host.innerHTML = svg(W, H, g);
    const tl = gsap.timeline({ paused: true });
    host.querySelectorAll('.vz-tile').forEach((t, i) => { const r = t.querySelector('rect'); t.style.transformBox = 'view-box'; t.style.transformOrigin = `${+r.getAttribute('x') + r.getAttribute('width') / 2}px ${+r.getAttribute('y') + r.getAttribute('height') / 2}px`; tl.from(t, { scale: .2, opacity: 0, duration: .6, ease: 'back.out(1.7)' }, .15 + i * .09); });
    return tl;
  };
  /* ---------- puntos por fila (cada punto es un caso) ---------- */
  K.dots = (host, d, W, H) => {
    const LW = d.lw || 300, RW = 90, top = 20, B = 60, nr = d.rows.length, rh = (H - top - B) / nr, X = v => LW + v / d.xmax * (W - LW - RW), r = Math.min(d.r || 10.5, rh / 6);
    let g = '';
    for (let v = 0; v <= d.xmax; v += d.xstep || 2) g += `<line x1="${X(v)}" x2="${X(v)}" y1="${top}" y2="${top + nr * rh}" stroke="${C.line}" stroke-width="1.5"/>` + T(X(v), top + nr * rh + 30, v, { a: 'middle', fs: 17, fw: 600, c: C.mute });
    g += T((LW + W - RW) / 2, H - 4, d.xlab, { a: 'middle', fs: 18, fw: 800, c: C.mute });
    if (d.ref) g += `<g class="vz-ref"><rect x="${X(d.ref.v)}" y="${top}" width="${X(d.xmax) - X(d.ref.v)}" height="${nr * rh}" fill="${C.red}" fill-opacity=".06"/><line x1="${X(d.ref.v)}" x2="${X(d.ref.v)}" y1="${top - 6}" y2="${top + nr * rh}" stroke="${C.red}" stroke-width="3" stroke-dasharray="8 6"/>${T(X(d.ref.v) + 10, top + 16, d.ref.label, { fs: 17, fw: 900, c: C.red })}</g>`;
    d.rows.forEach((row, i) => { const cy = top + i * rh + rh / 2, cnt = {};
      g += `<line x1="${LW}" x2="${W - RW}" y1="${top + (i + 1) * rh}" y2="${top + (i + 1) * rh}" stroke="${C.line}" stroke-width="1"/>`;
      g += T(LW - 18, cy - 8, row.name, { a: 'end', db: 'middle', fs: 22, fw: 800 }) + T(LW - 18, cy + 18, row.sub || '', { a: 'end', db: 'middle', fs: 16, fw: 600, c: C.mute });
      const per = Math.max(1, Math.floor((rh - 10) / (r * 2.15))), groups = {};
      row.pts.slice().sort((a, b) => (a.o || 0) - (b.o || 0)).forEach(p => (groups[p.v] = groups[p.v] || []).push(p));
      Object.entries(groups).forEach(([v, ps]) => { const ncol = Math.ceil(ps.length / per);
        ps.forEach((p, k) => { const c = Math.floor(k / per), j = k % per, inCol = Math.min(per, ps.length - c * per), dx = (c - (ncol - 1) / 2) * r * 2.1, dy = (j - (inCol - 1) / 2) * r * 2.15;
          g += `<circle class="vz-dot" cx="${X(+v) + dx}" cy="${cy + dy}" r="${r}" fill="${p.c}" stroke="#fff" stroke-width="2"/>`; }); });
      g += T(W - RW / 2, cy, row.pts.length, { a: 'middle', db: 'middle', fs: 30, fw: 900, c: C.ink });
    });
    host.innerHTML = svg(W, H, g);
    const tl = gsap.timeline({ paused: true });
    tl.from(host.querySelectorAll('svg > text, svg > line'), { opacity: 0, duration: .4 }, 0);
    tl.from(host.querySelectorAll('.vz-dot'), { y: -60, opacity: 0, duration: .5, stagger: .022, ease: 'bounce.out' }, .3);
    tl.from(host.querySelectorAll('.vz-ref'), { opacity: 0, duration: .6 }, 1.4);
    return tl;
  };
  /* ---------- pictograma (un ícono por caso) ---------- */
  const HELMET = 'M-30,10 C-30,-14 -16,-30 0,-30 C16,-30 30,-14 30,10 L38,10 C40,10 40,18 38,18 L-38,18 C-40,18 -40,10 -38,10 Z M-4,-30 L4,-30 L4,-8 L-4,-8 Z';
  K.picto = (host, d, W, H) => {
    const n = d.items.length, per = d.per || Math.min(n, 8), rows = Math.ceil(n / per), cell = Math.min((W - 20) / per, (H - 90) / rows), s = cell / 100;
    let g = '';
    d.items.forEach((it, i) => { const cx = 10 + (i % per) * cell + cell / 2, cy = 10 + Math.floor(i / per) * cell + cell / 2;
      g += `<g class="vz-ic" transform="translate(${cx} ${cy}) scale(${s})"><circle r="46" fill="${it.c}" fill-opacity=".12"/><path d="${HELMET}" fill="${it.c}" transform="translate(0 6)"/>${it.mk ? `<text y="44" text-anchor="middle" font-size="24" font-weight="900" fill="${it.c}">${esc(it.mk)}</text>` : ''}</g>`; });
    let lx = 10; (d.legend || []).forEach(l => { g += `<g class="vz-lg"><rect x="${lx}" y="${H - 44}" width="26" height="26" rx="7" fill="${l.c}"/>${T(lx + 36, H - 23, `${l.n} ${l.label}`, { fs: 21, fw: 800 })}</g>`; lx += 36 + (String(l.n).length + l.label.length + 1) * 12.5 + 40; });
    host.innerHTML = svg(W, H, g);
    const tl = gsap.timeline({ paused: true });
    host.querySelectorAll('.vz-ic').forEach((ic, i) => tl.from(ic, { opacity: 0, y: -40, duration: .45, ease: 'back.out(2.5)' }, .2 + i * .09));
    tl.from(host.querySelectorAll('.vz-lg'), { opacity: 0, x: -20, duration: .4, stagger: .1 }, .3 + n * .09);
    return tl;
  };
  /* ---------- pesas (antes → ahora por fila) ---------- */
  K.dumbbell = (host, d, W, H) => {
    const LW = d.lw || 240, RW = 200, top = 46, nr = d.rows.length, rh = (H - top) / nr, X = v => LW + 20 + v / d.max * (W - LW - RW - 50);
    let g = `<g>${T(X(0), 20, d.aLab, { fs: 18, fw: 800, c: '#8a857b' })}<circle cx="${X(0) - 14}" cy="14" r="8" fill="#fff" stroke="#9c978d" stroke-width="3"/>${T(X(0) + 160, 20, d.bLab, { fs: 18, fw: 800, c: C.ink })}<circle cx="${X(0) + 146}" cy="14" r="8" fill="${C.ink}"/></g>`;
    d.rows.forEach((r, i) => { const cy = top + i * rh + rh / 2, up = r.b > r.a, col = r.c || (up ? C.green : C.red), pc = Math.round((r.b - r.a) / r.a * 100);
      g += `<g class="vz-db">${T(LW, cy, r.label, { a: 'end', db: 'middle', fs: 24, fw: 800 })}<line x1="${X(0)}" x2="${X(d.max)}" y1="${cy}" y2="${cy}" stroke="${C.soft}" stroke-width="16" stroke-linecap="round"/>`;
      g += `<line class="vz-bar" x1="${X(r.a)}" x2="${X(r.b)}" y1="${cy}" y2="${cy}" stroke="${col}" stroke-width="16" stroke-linecap="round" stroke-opacity=".35"/>`;
      g += `<circle cx="${X(r.a)}" cy="${cy}" r="15" fill="#fff" stroke="#9c978d" stroke-width="4"/>${T(X(r.a), cy + (r.b < r.a ? -28 : 40), nf(r.a, d.dec || 0), { a: 'middle', fs: 19, fw: 800, c: '#8a857b' })}`;
      g += `<g class="vz-bd" data-dx="${X(r.b) - X(r.a)}"><circle cx="${X(r.a)}" cy="${cy}" r="19" fill="${col}" stroke="#fff" stroke-width="4"/>${T(X(r.a), cy + (r.b < r.a ? 44 : -30), nf(r.b, d.dec || 0), { a: 'middle', fs: 24, fw: 900, c: col })}</g>`;
      g += `<g class="vz-chip"><rect x="${W - RW + 20}" y="${cy - 26}" width="${RW - 30}" height="52" rx="26" fill="${col}"/>${T(W - RW / 2 + 5, cy + 1, `${pc > 0 ? '▲ +' : '▼ '}${pc} %`, { a: 'middle', db: 'middle', fs: 23, fw: 900, c: '#fff' })}</g></g>`; });
    host.innerHTML = svg(W, H, g);
    const tl = gsap.timeline({ paused: true });
    tl.from(host.querySelectorAll('.vz-db'), { opacity: 0, x: -20, duration: .5, stagger: .12 }, .1);
    host.querySelectorAll('.vz-bd').forEach((b, i) => tl.fromTo(b, { x: 0 }, { x: +b.dataset.dx, duration: 1.3, ease: 'power3.inOut' }, .8 + i * .15));
    host.querySelectorAll('.vz-bar').forEach((b, i) => tl.from(b, { attr: { x2: b.getAttribute('x1') }, duration: 1.3, ease: 'power3.inOut' }, .8 + i * .15));
    tl.from(host.querySelectorAll('.vz-chip'), { scale: 0, transformOrigin: '50% 50%', opacity: 0, duration: .45, stagger: .1, ease: 'back.out(2.2)' }, 2);
    return tl;
  };


  /* ---------- tarjetas por zona: reparto por nivel + anillo de abiertos ---------- */
  K.zones = (host, d, W, H) => {
    const n = d.rows.length, gap = 26, rh = (H - gap * (n - 1)) / n, LW = 330, RW = 270, bx = LW + 20, bw = W - LW - RW - 50, bh = Math.min(64, rh * .3);
    let g = `<defs><filter id="vzs-${host.id}" x="-5%" y="-10%" width="110%" height="130%"><feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#281e0a" flood-opacity=".12"/></filter></defs>`;
    d.rows.forEach((r, i) => {
      const y = i * (rh + gap), tot = r.seg.reduce((a, b) => a + b.v, 0), cy = y + rh / 2, R = Math.min(70, rh * .32), CC = 2 * Math.PI * R, po = r.open / r.total;
      g += `<g class="vz-zone"><rect x="0" y="${y}" width="${W}" height="${rh}" rx="22" fill="#fff" filter="url(#vzs-${host.id})"/><rect x="0" y="${y}" width="12" height="${rh}" rx="6" fill="${r.c}"/>`;
      if (r.hot) g += `<rect class="vz-glow" x="2" y="${y + 2}" width="${W - 4}" height="${rh - 4}" rx="21" fill="none" stroke="${C.red}" stroke-width="4"/>`;
      g += T(40, cy - 22, r.name, { fs: r.name.length > 12 ? 27 : 32, fw: 900, c: r.c }) + T(40, cy + 30, '', { fs: 46, fw: 900, at: `data-to="${r.total}"` }) + T(40 + String(r.total).length * 30 + 12, cy + 30, 'reportes', { fs: 20, fw: 700, c: C.mute });
      g += T(bx, cy - bh / 2 - 16, d.barLab || 'Nivel de riesgo de sus reportes', { fs: 17, fw: 800, c: C.mute });
      g += `<rect x="${bx}" y="${cy - bh / 2}" width="${bw}" height="${bh}" rx="${bh / 2}" fill="${C.soft}"/>`;
      g += `<clipPath id="vzz-${host.id}-${i}"><rect x="${bx}" y="${cy - bh / 2}" width="${bw}" height="${bh}" rx="${bh / 2}"/></clipPath>`;
      let x = bx; r.seg.forEach((sg, k) => { const w = sg.v / tot * bw; if (w <= 0) return;
        g += `<g class="vz-seg" data-i="${i}"><rect x="${x}" y="${cy - bh / 2}" width="${w}" height="${bh}" fill="${sg.c}" clip-path="url(#vzz-${host.id}-${i})"/>`;
        if (w <= 34) g += T(x + w / 2, cy + bh / 2 + 22, `${sg.v} ${sg.label}`, { a: 'middle', fs: 16, fw: 900, c: sg.c === '#cfc8bb' ? C.mute : sg.c });
        if (w > (String(sg.v).length + sg.label.length + 1) * 13 + 16) g += T(x + w / 2, cy + 1, `${sg.v} ${sg.label}`, { a: 'middle', db: 'middle', fs: 22, fw: 900, c: sg.dark ? C.ink : '#fff' });
        else if (w > 34) g += T(x + w / 2, cy + 1, sg.v, { a: 'middle', db: 'middle', fs: 20, fw: 900, c: sg.dark ? C.ink : '#fff' });
        g += '</g>'; x += w; });
      g += `<rect x="${bx}" y="${cy - bh / 2}" width="${bw}" height="${bh}" rx="${bh / 2}" fill="none" stroke="#fff" stroke-width="3"/>`;
      if (r.note) g += `<g class="vz-note">${T(bx, cy + bh / 2 + 52, '', { fs: 21, fw: 700, c: r.hot ? C.red : C.mute, at: '' }).replace('></text>', `>${esc(r.note)}</text>`)}</g>`;
      const rx = W - RW / 2 - 10;
      g += `<circle cx="${rx}" cy="${cy}" r="${R}" fill="none" stroke="${C.soft}" stroke-width="18"/><circle class="vz-arc" data-c="${CC}" data-p="${po}" cx="${rx}" cy="${cy}" r="${R}" fill="none" stroke="${r.hot ? C.red : r.c}" stroke-width="18" stroke-linecap="round" stroke-dasharray="0 ${CC}" transform="rotate(-90 ${rx} ${cy})"/>`;
      g += T(rx, cy - 4, '', { a: 'middle', fs: 40, fw: 900, c: r.hot ? C.red : C.ink, at: `data-to="${r.open}"` }) + T(rx, cy + 24, 'abiertos', { a: 'middle', fs: 17, fw: 800, c: C.mute }) + T(rx, cy + R + 32, `${Math.round(po * 100)} % · ${r.openMA} de riesgo Medio`, { a: 'middle', fs: 17, fw: 800, c: r.hot ? C.red : C.mute });
      g += '</g>';
    });
    host.innerHTML = svg(W, H, g);
    const tl = gsap.timeline({ paused: true });
    tl.from(host.querySelectorAll('.vz-zone'), { opacity: 0, x: -60, duration: .6, stagger: .15, ease: 'power3.out' }, .1);
    host.querySelectorAll('.vz-seg').forEach((sg, k) => { const r = sg.querySelector('rect'); tl.from(r, { attr: { width: 0 }, duration: .7, ease: 'power2.out' }, .6 + +sg.dataset.i * .25 + (k % 4) * .18); const t = sg.querySelector('text'); if (t) tl.from(t, { opacity: 0, duration: .3 }, 1 + +sg.dataset.i * .25 + (k % 4) * .18); });
    host.querySelectorAll('.vz-arc').forEach((a, i) => tl.to(a, { attr: { 'stroke-dasharray': `${a.dataset.c * a.dataset.p} ${a.dataset.c}` }, duration: 1.3, ease: 'power3.out' }, 1 + i * .25));
    counters(tl, host, .5, .2);
    tl.from(host.querySelectorAll('.vz-note'), { opacity: 0, y: 10, duration: .5, stagger: .2 }, 1.8);
    return tl;
  };
  /* ---------- barras apiladas por antigüedad (semáforo) ---------- */
  K.agebars = (host, d, W, H) => {
    const LW = d.lw || 300, RW = 230, top = 80, nr = d.rows.length, rh = (H - top) / nr, bh = Math.min(60, rh * .55), max = d.max || Math.max(...d.rows.map(r => r.vals.reduce((a, b) => a + b, 0))), X = v => v / max * (W - LW - RW - 30);
    let g = '', lx = LW;
    d.buckets.forEach(b => { g += `<g class="vz-lg"><rect x="${lx}" y="10" width="30" height="30" rx="8" fill="${b.c}"/>${T(lx + 40, 32, b.label, { fs: 20, fw: 800 })}</g>`; lx += 50 + b.label.length * 12 + 34; });
    d.rows.forEach((r, i) => { const cy = top + i * rh + rh / 2, tot = r.vals.reduce((a, b) => a + b, 0);
      g += `<g class="vz-ar">${T(LW - 20, cy - 2, r.name, { a: 'end', db: 'middle', fs: 25, fw: 800 })}<rect x="${LW}" y="${cy - bh / 2}" width="${X(max)}" height="${bh}" rx="12" fill="${C.soft}"/></g>`;
      let x = LW; r.vals.forEach((v, k) => { if (!v) return; const w = X(v), b = d.buckets[k];
        g += `<g class="vz-ag" data-i="${i}" data-k="${k}"><rect class="${b.hot ? 'vz-pulse' : ''}" x="${x}" y="${cy - bh / 2}" width="${w}" height="${bh}" rx="${w > 24 ? 10 : 4}" fill="${b.c}" stroke="#fff" stroke-width="3"/>${w > 18 ? T(x + w / 2, cy + 1, v, { a: 'middle', db: 'middle', fs: w > 30 ? 24 : 18, fw: 900, c: b.dark ? C.ink : '#fff' }) : ''}</g>`; x += w; });
      g += `<g class="vz-tt">${T(x + 16, cy + 2, '', { db: 'middle', fs: 34, fw: 900, at: `data-to="${tot}"` })}${r.ma ? `<rect x="${x + 16 + String(tot).length * 22 + 14}" y="${cy - 17}" width="${118}" height="34" rx="17" fill="${C.amber}"/>${T(x + 16 + String(tot).length * 22 + 14 + 59, cy + 1, `${r.ma} Medio`, { a: 'middle', db: 'middle', fs: 18, fw: 900, c: C.ink })}` : ''}</g>`;
    });
    host.innerHTML = svg(W, H, g);
    const tl = gsap.timeline({ paused: true });
    tl.from(host.querySelectorAll('.vz-lg'), { opacity: 0, y: -14, duration: .4, stagger: .08 }, 0);
    tl.from(host.querySelectorAll('.vz-ar'), { opacity: 0, x: -30, duration: .5, stagger: .1 }, .2);
    host.querySelectorAll('.vz-ag').forEach(a => { const r = a.querySelector('rect'), t = a.querySelector('text'), at = .7 + +a.dataset.i * .2 + +a.dataset.k * .22; tl.from(r, { attr: { width: 0 }, duration: .55, ease: 'power2.out' }, at); if (t) tl.from(t, { opacity: 0, scale: .5, transformOrigin: '50% 50%', duration: .3 }, at + .35); });
    tl.from(host.querySelectorAll('.vz-tt'), { opacity: 0, x: -16, duration: .4, stagger: .1 }, 1.9);
    counters(tl, host, 1.9, .1);
    return tl;
  };


  /* ---------- panel de totales: dona por nivel + barra cerrados/abiertos ---------- */
  K.totals = (host, d, W, H) => {
    const cx = W / 2, R = Math.min(W * .3, 120), cy = 120 + R, CC = 2 * Math.PI * R, tot = d.levels.reduce((a, b) => a + b.v, 0);
    let g = `<rect x="0" y="0" width="${W}" height="${H}" rx="26" fill="#1a1917"/>`;
    g += T(cx, 52, d.title || 'Total del mes', { a: 'middle', fs: 24, fw: 900, c: '#e8c97f' }) + T(cx, 82, d.sub || '', { a: 'middle', fs: 17, fw: 600, c: '#bdb6a8' });
    g += `<circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="#2c2a26" stroke-width="34"/>`;
    let acc = 0; d.levels.forEach((l, i) => { const len = l.v / tot * CC;
      g += `<circle class="vz-don" data-len="${len}" data-off="${-acc}" cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="${l.c}" stroke-width="34" stroke-dasharray="0 ${CC}" stroke-dashoffset="${-acc}" transform="rotate(-90 ${cx} ${cy})"/>`; acc += len; });
    g += T(cx, cy + 8, '', { a: 'middle', fs: 54, fw: 900, c: '#fff', at: `data-to="${tot}"` }) + T(cx, cy + 38, 'reportes', { a: 'middle', fs: 18, fw: 700, c: '#bdb6a8' });
    let y = cy + R + 60;
    d.levels.forEach(l => { g += `<g class="vz-lv"><rect x="34" y="${y - 20}" width="26" height="26" rx="7" fill="${l.c}"/>${T(72, y, l.label, { fs: 23, fw: 800, c: '#fff' })}${T(W - 34, y, '', { a: 'end', fs: 28, fw: 900, c: l.c === '#9aa7b6' || l.c === '#7d8fa6' ? '#c9d3e0' : l.c, at: `data-to="${l.v}"` })}${T(W - 108, y, `${Math.round(l.v / tot * 100)} %`, { a: 'end', fs: 17, fw: 700, c: '#bdb6a8' })}</g>`; y += 42; });
    y += 18; g += T(34, y, d.stLab || 'Estado', { fs: 20, fw: 900, c: '#e8c97f' }); y += 18;
    const bw = W - 68, st = d.status, sTot = st.reduce((a, b) => a + b.v, 0); let x = 34;
    g += `<clipPath id="vzt-${host.id}"><rect x="34" y="${y}" width="${bw}" height="54" rx="27"/></clipPath>`;
    st.forEach((sv, i) => { const w = sv.v / sTot * bw; g += `<g class="vz-st"><rect x="${x}" y="${y}" width="${w}" height="54" fill="${sv.c}" clip-path="url(#vzt-${host.id})"/>${T(x + w / 2, y + 28, `${sv.v} ${sv.label}`, { a: 'middle', db: 'middle', fs: w > 150 ? 22 : 18, fw: 900, c: '#fff' })}</g>`; x += w; });
    y += 84; g += T(cx, y, d.note || '', { a: 'middle', fs: 18, fw: 700, c: '#bdb6a8' });
    host.innerHTML = svg(W, H, g);
    const tl = gsap.timeline({ paused: true });
    host.querySelectorAll('.vz-don').forEach((c, i) => tl.to(c, { attr: { 'stroke-dasharray': `${c.dataset.len} ${CC}` }, duration: .7, ease: 'power2.out' }, .3 + i * .45));
    counters(tl, host, .3, .15);
    tl.from(host.querySelectorAll('.vz-lv'), { opacity: 0, x: 30, duration: .45, stagger: .12 }, .5);
    host.querySelectorAll('.vz-st rect').forEach((r, i) => tl.from(r, { attr: { width: 0 }, duration: .8, ease: 'power2.out' }, 1.6 + i * .5));
    tl.from(host.querySelectorAll('.vz-st text'), { opacity: 0, duration: .4, stagger: .3 }, 2.1);
    return tl;
  };


  /* ---------- columnas (simples o apiladas) con línea de promedio ---------- */
  K.cols = (host, d, W, H) => {
    const L = d.l || 56, R = d.r || 20, Tp = d.legend ? 70 : 40, B = d.xlab ? 70 : 46, w = W - L - R, h = H - Tp - B, n = d.labels.length, ser = d.series;
    const tots = d.labels.map((_, i) => d.grouped ? Math.max(...ser.map(s => s.values[i] || 0)) : ser.reduce((a, s) => a + (s.values[i] || 0), 0)), max = d.max || Math.max(...tots, ...(d.avg || []).map(a => a.v)) * 1.15;
    const bw = w / n, gw = Math.min(bw * .72, d.bmax || 90), Y = v => Tp + h - v / max * h;
    let g = '';
    if (d.legend) { let lx = L; ser.forEach(s => { g += `<rect x="${lx}" y="12" width="22" height="22" rx="6" fill="${s.c}"/>` + T(lx + 30, 30, s.name, { fs: 19, fw: 800 }); lx += 60 + s.name.length * 11; }); }
    const step = d.ystep || Math.max(1, Math.ceil(max / 5));
    for (let v = 0; v <= max; v += step) g += `<line x1="${L}" x2="${L + w}" y1="${Y(v)}" y2="${Y(v)}" stroke="${C.line}" stroke-width="1.4"/>` + T(L - 10, Y(v) + 6, v, { a: 'end', fs: 16, fw: 600, c: C.mute });
    if (d.grouped) d.labels.forEach((lb, i) => { const cx = L + bw * i + bw / 2, gw2 = Math.min(bw * .8 / ser.length, d.bmax || 90);
      ser.forEach((s, k) => { const v = s.values[i] || 0, x = cx - gw2 * ser.length / 2 + gw2 * k + 4, y1 = Y(v);
        g += `<g class="vz-col" data-i="${i}"><rect x="${x}" y="${y1}" width="${gw2 - 8}" height="${Tp + h - y1}" rx="8" fill="${s.c}"/></g><g class="vz-ctop" data-i="${i}">${T(x + (gw2 - 8) / 2, y1 - 10, v, { a: 'middle', fs: 24, fw: 900, c: s.c })}</g>`; });
      g += T(cx, Tp + h + 30, lb, { a: 'middle', fs: d.fsx || 20, fw: 800, c: C.ink }); });
    if (!d.grouped) d.labels.forEach((lb, i) => { const cx = L + bw * i + bw / 2; let acc = 0;
      ser.forEach((s, k) => { const v = s.values[i] || 0; if (!v) return; const col = (s.colors && s.colors[i]) || s.c, y1 = Y(acc + v), hh = Y(acc) - y1;
        g += `<g class="vz-col" data-i="${i}"><rect x="${cx - gw / 2}" y="${y1}" width="${gw}" height="${hh}" rx="${ser.length > 1 ? 3 : 8}" fill="${col}"/>${ser.length > 1 && hh > 26 ? T(cx, y1 + hh / 2 + 1, v, { a: 'middle', db: 'middle', fs: Math.min(18, gw * .45), fw: 900, c: '#fff' }) : ''}</g>`; acc += v; });
      g += `<g class="vz-ctop" data-i="${i}">${T(cx, Y(tots[i]) - 10, tots[i], { a: 'middle', fs: d.fsv || Math.min(22, gw * .5 + 6), fw: 900, c: (d.topC && d.topC[i]) || C.ink })}</g>`;
      if (!d.every || i % d.every === 0 || i === n - 1) g += T(cx, Tp + h + 28, lb, { a: 'middle', fs: d.fsx || 17, fw: 700, c: (d.xC && d.xC[i]) || C.mute });
      if (d.marks && d.marks[i]) g += `<g class="vz-cm">${T(cx, Y(tots[i]) - 40, d.marks[i], { a: 'middle', fs: 16, fw: 900, c: C.red })}</g>`;
    });
    (d.avg || []).forEach(a => { g += `<g class="vz-avg"><line x1="${L}" x2="${L + w}" y1="${Y(a.v)}" y2="${Y(a.v)}" stroke="${a.c || C.ink}" stroke-width="3" stroke-dasharray="10 7" class="vz-march"/><rect x="${L + w - 230}" y="${Y(a.v) - 34}" width="230" height="28" rx="14" fill="${a.c || C.ink}"/>${T(L + w - 115, Y(a.v) - 15, a.label, { a: 'middle', fs: 16, fw: 900, c: '#fff' })}</g>`; });
    if (d.xlab) g += T(L + w / 2, H - 6, d.xlab, { a: 'middle', fs: 17, fw: 800, c: C.mute });
    host.innerHTML = svg(W, H, g);
    const tl = gsap.timeline({ paused: true }), base = Tp + h;
    tl.from(host.querySelectorAll('svg > line, svg > text, svg > rect'), { opacity: 0, duration: .4 }, 0);
    host.querySelectorAll('.vz-col rect').forEach(r => { const i = +r.parentNode.dataset.i; tl.from(r, { attr: { y: base, height: 0 }, duration: .7, ease: 'back.out(1.4)' }, .2 + i * (1.2 / n)); });
    host.querySelectorAll('.vz-col text').forEach(t => tl.from(t, { opacity: 0, duration: .3 }, 1.4));
    host.querySelectorAll('.vz-ctop').forEach(t => tl.from(t, { opacity: 0, y: 14, duration: .4 }, .5 + +t.dataset.i * (1.2 / n)));
    tl.from(host.querySelectorAll('.vz-avg'), { opacity: 0, duration: .6 }, 1.6);
    shine(tl, host, '.vz-col rect', 'y', 1.9);
    tl.from(host.querySelectorAll('.vz-cm'), { opacity: 0, y: -10, duration: .5, ease: 'back.out(3)' }, 1.8);
    return tl;
  };
  /* ---------- barras horizontales (simples o apiladas) ---------- */
  K.hbars = (host, d, W, H) => {
    const LW = d.lw || 260, RW = d.rw || 90, top = d.legend ? 50 : 6, n = d.labels.length, rh = (H - top) / n, bh = Math.min(d.bh || 40, rh * .66), ser = d.series;
    const tots = d.labels.map((_, i) => ser.reduce((a, s) => a + (s.values[i] || 0), 0)), max = d.max || Math.max(...tots), X = v => v / max * (W - LW - RW);
    let g = '';
    if (d.legend) { let lx = LW; ser.forEach(s => { g += `<rect x="${lx}" y="6" width="22" height="22" rx="6" fill="${s.c}"/>` + T(lx + 30, 24, s.name, { fs: 18, fw: 800 }); lx += 60 + s.name.length * 10.5; }); }
    d.labels.forEach((lb, i) => { const cy = top + i * rh + rh / 2; let x = LW;
      g += T(LW - 14, cy, lb, { a: 'end', db: 'middle', fs: d.fs || 20, fw: 800 });
      ser.forEach((s, k) => { const v = s.values[i] || 0; if (!v) return; const w = X(v), col = (s.colors && s.colors[i]) || s.c;
        g += `<g class="vz-hb" data-i="${i}"><rect x="${x}" y="${cy - bh / 2}" width="${w}" height="${bh}" rx="${ser.length > 1 ? 4 : bh / 2.6}" fill="${col}"/>${ser.length > 1 && w > 28 ? T(x + w / 2, cy + 1, v, { a: 'middle', db: 'middle', fs: 17, fw: 900, c: '#fff' }) : ''}</g>`; x += w; });
      g += `<g class="vz-hv" data-i="${i}">${T(x + 12, cy + 1, '', { db: 'middle', fs: d.fsv || 24, fw: 900, c: (d.valC && d.valC[i]) || C.ink, at: `data-to="${tots[i]}" data-dec="${d.dec || 0}"` })}${d.suf ? T(x + 12 + String(Math.round(tots[i])).length * 15 + 4, cy + 1, d.suf, { db: 'middle', fs: 18, fw: 800, c: C.mute }) : ''}${d.notes && d.notes[i] ? T(x + 12 + String(Math.round(tots[i])).length * 15 + (d.suf ? 30 : 6), cy + 1, d.notes[i], { db: 'middle', fs: 16, fw: 700, c: C.mute }) : ''}</g>`; });
    host.innerHTML = svg(W, H, g);
    const tl = gsap.timeline({ paused: true });
    tl.from(host.querySelectorAll('svg > text, svg > rect'), { opacity: 0, duration: .4 }, 0);
    host.querySelectorAll('.vz-hb rect').forEach((r, k) => { const i = +r.parentNode.dataset.i; tl.from(r, { attr: { width: 0 }, duration: .7, ease: 'power3.out' }, .25 + i * .1 + k * .02); });
    tl.from(host.querySelectorAll('.vz-hb text'), { opacity: 0, duration: .3 }, 1.1);
    tl.from(host.querySelectorAll('.vz-hv'), { opacity: 0, x: -10, duration: .4, stagger: .08 }, .6);
    shine(tl, host, '.vz-hb rect', 'x', 1.5);
    if (d.hot != null) host.querySelectorAll(`.vz-hb[data-i="${d.hot}"] rect`).forEach(r => r.classList.add('vz-pulse'));
    counters(tl, host, .6, .08);
    return tl;
  };
  /* ---------- dona con leyenda ---------- */
  K.donut = (host, d, W, H) => {
    const side = d.legend === 'bottom', R = side ? Math.min(W * .3, (H - 40 - d.items.length * 40) / 2.4) : Math.min(H * .38, W * .22), cx = side ? W / 2 : R + 30, cy = side ? R + 24 : H / 2, CC = 2 * Math.PI * R, sw = R * .38, tot = d.items.reduce((a, b) => a + b.v, 0);
    let g = `<circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="${C.soft}" stroke-width="${sw}"/><g class="vz-dg">`, acc = 0;
    d.items.forEach(it => { const len = it.v / tot * CC; g += `<circle class="vz-don" data-len="${len}" cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="${it.c}" stroke-width="${sw}" stroke-dasharray="0 ${CC}" stroke-dashoffset="${-acc}" transform="rotate(-90 ${cx} ${cy})"/>`; acc += len; });
    g += '</g>' + T(cx, cy + 6, '', { a: 'middle', fs: R * .42, fw: 900, at: `data-to="${d.center != null ? d.center : tot}" class="vz-dc"` }) + T(cx, cy + R * .3, d.centerSub || '', { a: 'middle', fs: Math.max(14, R * .14), fw: 700, c: C.mute });
    let lx = side ? 20 : cx + R + sw / 2 + 36, ly = side ? cy + R + sw / 2 + 40 : cy - (d.items.length - 1) * 26;
    if (!side) ly = cy - (d.items.length - 1) * 38;
    d.items.forEach(it => { g += `<g class="vz-dl"><rect x="${lx}" y="${ly - 18}" width="24" height="24" rx="6" fill="${it.c}"/>${T(lx + 34, ly, it.label, { fs: 20, fw: 800 })}${side ? T(W - 20, ly, `${it.v} · ${Math.round(it.v / tot * 100)} %`, { a: 'end', fs: 20, fw: 900, c: it.c === '#b3ada2' ? C.mute : it.c }) : T(lx + 34, ly + 28, `${it.v} · ${Math.round(it.v / tot * 100)} %`, { fs: 22, fw: 900, c: it.c === '#b3ada2' ? C.mute : it.c })}</g>`; ly += side ? 38 : 76; });
    host.innerHTML = svg(W, H, g);
    const tl = gsap.timeline({ paused: true });
    host.querySelectorAll('.vz-don').forEach((c, i) => tl.to(c, { attr: { 'stroke-dasharray': `${c.dataset.len} ${CC}` }, duration: .8, ease: 'power2.out' }, .2 + i * .5));
    counters(tl, host, .2, .1);
    tl.from(host.querySelectorAll('.vz-dl'), { opacity: 0, x: 20, duration: .4, stagger: .12 }, .5);
    const dg = host.querySelector('.vz-dg'); dg.style.transformBox = 'view-box'; dg.style.transformOrigin = `${cx}px ${cy}px`; tl.from(dg, { rotation: -150, scale: .7, duration: 1.8, ease: 'power3.out' }, .1);
    const dc = host.querySelector('.vz-dc'); dc.style.transformBox = 'fill-box'; dc.style.transformOrigin = 'center'; tl.from(dc, { scale: .3, opacity: 0, duration: .7, ease: 'back.out(2.5)' }, .3);
    return tl;
  };


  /* ---------- «de cada 10»: fila de 10 íconos por grupo ---------- */
  const DOC = 'M-14,-20 h20 l10,10 v30 h-30 Z M6,-20 v10 h10';
  K.tenths = (host, d, W, H) => {
    const n = d.rows.length, rh = H / n, LW = 28, RW = d.rw || 250, cell = Math.min((W - LW - RW) / 10, rh * .42), sc = cell / 42;
    let g = '';
    d.rows.forEach((r, i) => { const cy = i * rh + rh / 2, k = Math.round(r.p / 10);
      if (r.hot) g += `<rect class="vz-glow" x="0" y="${i * rh + 6}" width="${W}" height="${rh - 12}" rx="20" fill="${C.red}" fill-opacity=".07" stroke="${C.red}" stroke-width="3"/>`;
      g += T(28, cy - rh * .22, r.name, { fs: 26, fw: 900, c: r.c || C.ink }) + T(28 + r.name.length * 15.5 + 14, cy - rh * .22, r.sub || '', { fs: 18, fw: 700, c: C.mute });
      for (let j = 0; j < 10; j++) { const x = LW + j * cell + cell / 2, on = j < k;
        g += `<g class="vz-ten" data-i="${i}" data-j="${j}" transform="translate(${x} ${cy + rh * .14}) scale(${sc})"><path d="${DOC}" fill="${on ? (r.c || C.green) : '#fff'}" stroke="${on ? (r.c || C.green) : '#d9a0a0'}" stroke-width="3" stroke-linejoin="round" ${on ? '' : 'stroke-dasharray="5 4"'}/>${on ? '<path d="M-8,2 l5,6 l10,-12" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round"/>' : ''}</g>`; }
      g += `<g class="vz-tp">${T(W - RW + 26, cy - 4, '', { fs: 46, fw: 900, c: r.hot ? C.red : (r.c || C.ink), at: `data-to="${k}"` })}${T(W - RW + 26 + 40, cy - 4, 'de cada 10', { fs: 21, fw: 800, c: C.ink })}${T(W - RW + 26, cy + 28, r.note || '', { fs: 18, fw: 700, c: C.mute })}</g>`; });
    host.innerHTML = svg(W, H, g);
    const tl = gsap.timeline({ paused: true });
    tl.from(host.querySelectorAll('svg > text, svg > rect'), { opacity: 0, x: -20, duration: .5, stagger: .05 }, 0);
    host.querySelectorAll('.vz-ten').forEach(t => { const tr = t.getAttribute('transform'); tl.fromTo(t, { opacity: 0, attr: { transform: tr.replace(/scale\([^)]*\)/, 'scale(0.01)') } }, { opacity: 1, attr: { transform: tr }, duration: .35, ease: 'back.out(3)' }, .4 + +t.dataset.i * .45 + +t.dataset.j * .06); });
    tl.from(host.querySelectorAll('.vz-tp'), { opacity: 0, x: 20, duration: .4, stagger: .45 }, 1);
    counters(tl, host, 1, .45);
    return tl;
  };
  /* ---------- ranking con puntaje (mejores arriba, por mejorar abajo) ---------- */
  K.rank = (host, d, W, H) => {
    const n = d.rows.length, top = 46, rh = (H - top) / n, LW = d.lw || 330, RW = d.rw || 330, bw = W - LW - RW - 70, TC = { top: C.green, mid: '#b3ada2', low: C.red };
    let g = T(LW, 26, d.barLab || 'Puntaje de calidad (0 a 100)', { fs: 17, fw: 800, c: C.mute }) + T(W - RW + 10, 26, d.noteLab || 'Por qué', { fs: 17, fw: 800, c: C.mute });
    d.rows.forEach((r, i) => { const cy = top + i * rh + rh / 2, col = TC[r.tier] || C.mute, bh = Math.min(30, rh * .6);
      if (r.tier !== 'mid') g += `<rect class="vz-rbg" x="0" y="${cy - rh / 2 + 2}" width="${W}" height="${rh - 4}" rx="12" fill="${col}" fill-opacity=".07"/>`;
      g += `<g class="vz-rk" data-i="${i}">`;
      g += `<circle cx="22" cy="${cy}" r="17" fill="${col}"/>${T(22, cy + 1, i + 1, { a: 'middle', db: 'middle', fs: 17, fw: 900, c: '#fff' })}`;
      g += T(50, cy - 6, r.name, { db: 'middle', fs: 20, fw: 800 }) + T(50, cy + 15, r.sub || '', { db: 'middle', fs: 14, fw: 700, c: C.mute });
      g += `<rect x="${LW}" y="${cy - bh / 2}" width="${bw}" height="${bh}" rx="${bh / 2}" fill="${C.soft}"/><rect class="vz-rb" x="${LW}" y="${cy - bh / 2}" width="${Math.max(bh, r.score / 100 * bw)}" height="${bh}" rx="${bh / 2}" fill="${col}"/>`;
      g += T(LW + bw + 12, cy + 1, '', { db: 'middle', fs: 24, fw: 900, c: col, at: `data-to="${r.score}"` });
      g += T(W - RW + 10, cy + 1, r.note || '', { db: 'middle', fs: 16, fw: 700, c: r.tier === 'low' ? C.red : r.tier === 'top' ? '#16733f' : C.mute });
      g += '</g>'; });
    host.innerHTML = svg(W, H, g);
    const tl = gsap.timeline({ paused: true });
    tl.from(host.querySelectorAll('.vz-rbg'), { opacity: 0, duration: .5, stagger: .05 }, .1);
    tl.from(host.querySelectorAll('.vz-rk'), { opacity: 0, x: -40, duration: .45, stagger: .07, ease: 'power3.out' }, .1);
    host.querySelectorAll('.vz-rb').forEach((b, i) => tl.from(b, { attr: { width: 0 }, duration: .8, ease: 'power3.out' }, .4 + i * .07));
    counters(tl, host, .4, .07);
    shine(tl, host, '.vz-rb', 'x', 1.6);
    return tl;
  };

  const live = {};
  const VIZ = window.VIZ = {
    kinds: K,
    mount(slideId, host, kind, def) {
      if (!K[kind] || !def || !window.gsap) { host.innerHTML = `<div style="padding:20px;font:700 20px Montserrat;color:#a33">Gráfico no disponible (${esc(kind)})</div>`; return; }
      const W = def.w || host.clientWidth || 1000, H = def.h || host.clientHeight || 600;
      let tl; try { tl = K[kind](host, def, W, H); } catch (e) { console.error('viz', kind, e); host.innerHTML = ''; return; }
      const sl = document.getElementById(slideId), id = host.id;
      if (live[id]) live[id].kill(); live[id] = tl;
      const play = () => { tl.pause(0); requestAnimationFrame(() => tl.play(0)); };
      if (!host._vzBound && window.DECK) { host._vzBound = 1;
        DECK.on(slideId, 'enter', () => live[id] && (DECK.editing && DECK.editing() ? live[id].progress(1).pause() : (live[id].pause(0), requestAnimationFrame(() => live[id].play(0)))));
        DECK.on(slideId, 'leave', () => live[id] && setTimeout(() => live[id].pause(0), 650));
        DECK.on(slideId, 'print', () => live[id] && live[id].progress(1).pause());
        DECK.on(slideId, 'edit', () => live[id] && live[id].progress(1).pause()); }
      if (sl && sl.classList.contains('active')) play(); else tl.pause(0);
      if (matchMedia('print').matches || document.body.classList.contains('printing')) tl.progress(1).pause();
    },
    finish() { Object.values(live).forEach(t => t.progress(1).pause()); }
  };
})();
