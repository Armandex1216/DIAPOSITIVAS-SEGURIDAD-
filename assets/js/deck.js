/* ==========================================================
   Motor de presentaciones (sin dependencias de red)
   Requiere gsap.min.js. Uso: <body data-deck="csst-2026-11" data-transition="push">
   Todo lo editable se guarda en: localStorage (este equipo) y, para llevarlo a otra PC,
   en el archivo data/<deck>-cambios.js que genera el botón «Guardar cambios».
   ========================================================== */
(function () {
  'use strict';
  const W = 1920, H = 1080;
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const qs = new URLSearchParams(location.search);
  const body = document.body, deckId = (qs.get('d') || body.dataset.deck || 'deck').replace(/[^\w\-]/g, ''), LSK = 'deck:' + deckId;
  const stage = $('.stage'); let slides = [];
  const hooks = {};

  /* ---------- almacén de cambios ---------- */
  const blank = () => ({ text: {}, charts: {}, images: {}, hidden: {}, layout: {}, slides: {}, free: {}, tables: {}, meta: {} });
  const merge = (a, b) => { const o = blank(); for (const k of Object.keys(o)) o[k] = Object.assign({}, (a || {})[k], (b || {})[k]); return o; };
  let fileEdits = (window.DECK_EDITS && window.DECK_EDITS[deckId]) || null;
  let local = null; try { local = JSON.parse(localStorage.getItem(LSK) || 'null'); } catch (e) { }
  const store = merge(fileEdits, local);
  /* ---------- láminas creadas por el usuario (en blanco o duplicadas) ---------- */
  const esc = t => String(t == null ? '' : t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const BLANK = (t, k) => `<div class="hexbg"></div><div class="topbar" data-a="grow"></div><img class="mark" src="assets/img/logo-mark.png?v=2" alt=""><div class="sh"><div class="kick" data-a="left">${esc(k || 'Sección')}</div><h2 data-a="up">${esc(t || 'Título de la lámina')}</h2></div>`;
  (function buildExtraSlides() {
    const base = {}; $$('.slide', stage).forEach(sl => base[sl.id] = sl.cloneNode(true));
    const list = Object.entries(store.slides).filter(([, v]) => v && !v.removed).sort((a, b) => (a[1].n || 0) - (b[1].n || 0));
    list.forEach(([id, v]) => {
      let sl;
      if (v.base && base[v.base]) { sl = base[v.base].cloneNode(true); sl.querySelectorAll('[id]').forEach(e => e.removeAttribute('id')); sl.querySelectorAll('[data-slot]').forEach(e => e.dataset.slot = e.dataset.slot + '@' + id); sl.removeAttribute('data-hidden'); }
      else { sl = document.createElement('section'); sl.className = 'slide ' + (v.dark ? 'dark' : 'light'); sl.innerHTML = BLANK(v.title, v.kick); }
      sl.id = id; sl.dataset.title = v.title || (v.base ? 'Copia' : 'Lámina nueva'); sl.dataset.extra = '1';
      const after = v.after && document.getElementById(v.after);
      if (after && after.parentNode === stage) after.after(sl); else stage.appendChild(sl);
    });
  })();
  /* ---------- orden de las láminas elegido por el usuario (meta.orden) ---------- */
  // Las láminas que no están en la lista (nuevas) quedan justo después de la que tenían antes.
  function applyOrder() {
    const cur = $$('.slide', stage), orden = (store.meta && Array.isArray(store.meta.orden)) ? store.meta.orden : null; if (!orden) return cur;
    const byId = Object.fromEntries(cur.map(s => [s.id, s])), out = orden.filter(id => byId[id]).filter((id, i, a) => a.indexOf(id) === i);
    cur.forEach((s, i) => { if (out.includes(s.id)) return; let j = i - 1; while (j >= 0 && !out.includes(cur[j].id)) j--; out.splice(j < 0 ? 0 : out.indexOf(cur[j].id) + 1, 0, s.id); });
    out.forEach(id => stage.appendChild(byId[id])); return out.map(id => byId[id]);
  }
  slides = applyOrder();

  const persist = () => { try { localStorage.setItem(LSK, JSON.stringify(store)); } catch (e) { toast('No hay espacio en el navegador: use «Guardar cambios» para no perderlos'); } if (D.onPersist) try { D.onPersist(); } catch (e) { console.error(e); } };

  const D = window.DECK = {
    i: 0, slides, busy: false, frags: [], store, deckId, LSK, $, $$,
    on(id, ev, fn) { (hooks[id + ':' + ev] = hooks[id + ':' + ev] || []).push(fn); },
    fire(sl, ev) { (hooks[sl.id + ':' + ev] || []).forEach(f => { try { f(sl); } catch (e) { console.error(e); } }); },
    go, next, prev, persist, editing: () => body.classList.contains('editing'),
    move: (from, to) => moveSlide(from, to),
    num(el) { return parseNum(el ? el.textContent : '0'); }
  };

  /* ---------- escala ---------- */
  // al editar, la lámina se achica para no quedar tapada por la barra de formato (arriba) ni por los controles (a la derecha)
  function fit() { const ed = body.classList.contains('editing') || body.classList.contains('moving'), R = ed ? 128 : 0, T = ed ? 124 : 0, Bm = ed ? 14 : 0, Lm = ed ? 14 : 0;
    const s = Math.min((innerWidth - R - Lm) / W, (innerHeight - T - Bm) / H), dx = (Lm - R) / 2, dy = (T - Bm) / 2;
    stage.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(${s})`; D.scale = s; if (D.drawSel) D.drawSel(); }
  new MutationObserver(() => { const k = body.classList.contains('editing') + ':' + body.classList.contains('moving'); if (k !== fit._k) { fit._k = k; fit(); } }).observe(body, { attributes: true, attributeFilter: ['class'] });
  addEventListener('resize', fit); fit();

  /* ---------- UI ---------- */
  const ui = document.createElement('div'); ui.className = 'ui';
  ui.innerHTML = `<button data-k="prev" title="Anterior (←)">◀</button><span class="num"></span><button data-k="next" title="Siguiente (→)">▶</button>
  <button data-k="ov" title="Ver, ir u ocultar láminas (O)">▦ Láminas</button><button data-k="edit" title="Editar textos, cifras, gráficos e imágenes (E)">✎ Editar</button><button data-k="move" title="Mover y cambiar tamaño de los elementos, como en Canva (M)">✥ Mover</button>
  <button data-k="save" title="Descargar los cambios para llevarlos a otra PC">💾 Guardar cambios</button><button data-k="load" title="Cargar un archivo de cambios">📂 Abrir</button>
  <button data-k="fs" title="Pantalla completa (F)">⛶</button><button data-k="pdf" title="Guardar PDF (P)">PDF</button>`;
  document.body.appendChild(ui);
  const prog = document.createElement('div'); prog.className = 'progress'; document.body.appendChild(prog);
  const hint = document.createElement('div'); hint.className = 'hint'; hint.textContent = 'clic o → para el siguiente punto'; document.body.appendChild(hint);
  const badge = document.createElement('div'); badge.className = 'edit-badge'; badge.innerHTML = 'MODO EDICIÓN · clic en un texto o cifra para cambiarlo · «✎ Datos» en los gráficos · E para salir'; document.body.appendChild(badge);
  const tst = document.createElement('div'); tst.className = 'toast'; document.body.appendChild(tst);
  function toast(m, t = 2600) { tst.textContent = m; tst.classList.add('on'); clearTimeout(tst._t); tst._t = setTimeout(() => tst.classList.remove('on'), t); }
  D.toast = toast;
  if (!body.dataset.nohome) { const h = document.createElement('a'); h.className = 'home'; h.href = 'index.html'; h.textContent = '← Presentaciones'; document.body.appendChild(h); }
  const ov = document.createElement('div'); ov.className = 'overview'; document.body.appendChild(ov);
  const lb = document.createElement('div'); lb.className = 'lightbox'; lb.innerHTML = '<img alt="">'; document.body.appendChild(lb);
  const fileIn = document.createElement('input'); fileIn.type = 'file'; fileIn.accept = '.js,.json'; fileIn.hidden = true; document.body.appendChild(fileIn);
  lb.onclick = () => lb.classList.remove('on');
  document.addEventListener('click', e => { const z = e.target.closest('.zoomable'); if (z && !D.editing()) { e.stopPropagation(); const im = z.tagName === 'IMG' ? z : z.querySelector('img'); if (!im || !im.src) return; $('img', lb).src = im.src; lb.classList.add('on'); } }, true);
  let uiT; const wake = () => { body.classList.add('ui-on'); clearTimeout(uiT); uiT = setTimeout(() => body.classList.remove('ui-on'), 2200); };
  addEventListener('mousemove', wake);
  ui.onclick = e => { const b = e.target.closest('button'); if (!b) return; e.stopPropagation(); const f = ({ prev, next, ov: toggleOv, edit: toggleEdit, move: () => toggleMove(), fs: toggleFs, pdf: () => printDeck(), save: exportEdits, load: () => fileIn.click() })[b.dataset.k]; if (typeof f === 'function') f(); };

  /* ---------- números ---------- */
  function parseNum(t) {
    let s = String(t || '').replace(/[^\d.,\-]/g, '');
    if (!s) return { v: 0, dec: 0 };
    if (s.includes(',') && s.includes('.')) s = s.replace(/,/g, '');
    else if (s.includes(',')) s = /^\-?\d{1,3}(,\d{3})+$/.test(s) ? s.replace(/,/g, '') : s.replace(',', '.');
    else if (/^\-?\d{1,3}(\.\d{3}){2,}$/.test(s)) s = s.replace(/\./g, '');
    const v = parseFloat(s); const dec = (s.split('.')[1] || '').length;
    return { v: isFinite(v) ? v : 0, dec };
  }
  function fmtNum(v, el) { const dec = +(el.dataset.dec || 0); const s = v.toLocaleString('es-PE', { minimumFractionDigits: dec, maximumFractionDigits: dec }); return (el.dataset.pre || '') + (el.dataset.pad && Math.abs(v) < 10 && !dec ? '0' : '') + s + (el.dataset.suf || ''); }
  function syncCount(el) { // la cifra escrita pasa a ser el valor animado
    const raw = el.textContent; const { v, dec } = parseNum(raw); el.dataset.count = v; el.dataset.dec = dec;
    const m = raw.match(/^([^\d\-]*)[\-\d.,]+(.*)$/); if (m) { el.dataset.pre = m[1]; el.dataset.suf = m[2]; }
  }

  /* ---------- animaciones de entrada ---------- */
  const FROM = {
    up: { y: 60, opacity: 0 }, down: { y: -50, opacity: 0 }, left: { x: -80, opacity: 0 }, right: { x: 80, opacity: 0 },
    zoom: { scale: .82, opacity: 0 }, pop: { scale: .3, opacity: 0, ease: 'back.out(2)' }, fade: { opacity: 0 },
    flip: { rotationX: -90, opacity: 0, transformOrigin: '50% 0%' }, grow: { scaleX: 0, transformOrigin: '0% 50%' },
    rise: { y: 140, opacity: 0, scale: .96 }, blur: { opacity: 0, filter: 'blur(14px)', scale: 1.06 }
  };
  const animTargets = sl => $$('[data-a]', sl).filter(el => !el.closest('[data-frag]'));
  // Los elementos animados guardan su posición de «Mover» dentro de GSAP (x/y): si se usara la propiedad CSS «translate»,
  // GSAP la absorbe al animar y el elemento vuelve a su lugar original.
  const ANIM_SEL = '[data-a],[data-frag],[data-tbl] tbody tr,.rich li,ul.cmb li,.rings .r,.gpct,.cm,.side-txt,.fl';
  const bx = el => (el._lay && el._lay.x) || 0, by = el => (el._lay && el._lay.y) || 0;
  function resetSlide(sl) {
    if (D.editing()) return;
    animTargets(sl).forEach(el => { gsap.killTweensOf(el); const f = FROM[el.dataset.a] || FROM.up; const { ease, ...st } = f; st.x = (st.x || 0) + bx(el); st.y = (st.y || 0) + by(el); gsap.set(el, st); });
    $$('[data-frag]', sl).forEach(el => { gsap.set(el, { opacity: 0, x: bx(el), y: by(el) + 30 }); el.classList.remove('shown'); });
    $$('[data-draw]', sl).forEach(p => { const L = p.getTotalLength ? p.getTotalLength() : 1000; gsap.set(p, { strokeDasharray: L, strokeDashoffset: L }); });
    $$('[data-count]', sl).forEach(el => { el.textContent = fmtNum(0, el); });
  }
  function showAll(sl) {
    animTargets(sl).forEach(el => { gsap.killTweensOf(el); gsap.set(el, { opacity: 1, x: bx(el), y: by(el), scale: 1, scaleX: 1, rotationX: 0, filter: 'none' }); });
    $$('[data-frag]', sl).forEach(el => { gsap.set(el, { opacity: 1, x: bx(el), y: by(el) }); el.classList.add('shown'); });
    $$('[data-draw]', sl).forEach(p => gsap.set(p, { strokeDashoffset: 0 }));
    $$('[data-count]', sl).forEach(el => { gsap.killTweensOf(el._o || {}); el.textContent = fmtNum(parseFloat(el.dataset.count), el); });
  }
  function enterSlide(sl, base = 0) {
    if (D.editing()) { showAll(sl); D.fire(sl, 'enter'); return; }
    const tl = gsap.timeline({ delay: base }); let t = 0;
    animTargets(sl).forEach(el => {
      const f = FROM[el.dataset.a] || FROM.up; const d = parseFloat(el.dataset.d || 0);
      const to = { x: bx(el), y: by(el), scale: 1, scaleX: 1, rotationX: 0, opacity: 1, duration: parseFloat(el.dataset.dur || .8), ease: f.ease || 'power3.out' };
      if (el.dataset.a === 'blur') { to.filter = 'blur(0px)'; to.clearProps = 'filter'; }
      const at = el.dataset.at != null ? parseFloat(el.dataset.at) : t + d;
      tl.to(el, to, at); t = at + parseFloat(el.dataset.gap || .09);
    });
    $$('[data-draw]', sl).forEach(p => tl.to(p, { strokeDashoffset: 0, duration: parseFloat(p.dataset.dur || 1.4), ease: 'power2.inOut' }, parseFloat(p.dataset.draw || .3)));
    $$('[data-count]', sl).filter(el => !el.closest('[data-frag]')).forEach(el => countUp(el, base + parseFloat(el.dataset.cd || .4)));
    D.frags = $$('[data-frag]', sl).sort((a, b) => (+a.dataset.frag || 0) - (+b.dataset.frag || 0));
    hint.classList.toggle('on', D.frags.length > 0);
    D.fire(sl, 'enter');
  }
  function countUp(el, delay) { const target = parseFloat(el.dataset.count); const o = el._o = { v: 0 }; gsap.to(o, { v: target, duration: parseFloat(el.dataset.cdur || 1.6), delay, ease: 'power2.out', onUpdate: () => { el.textContent = fmtNum(o.v, el); } }); }
  function showFrag(el) { el.classList.add('shown'); gsap.to(el, { opacity: 1, y: by(el), duration: .55, ease: 'power3.out' }); $$('[data-count]', el).forEach(c => countUp(c, .1)); D.fire(slides[D.i], 'frag'); }

  /* ---------- láminas ocultas ---------- */
  const isHidden = sl => store.hidden[sl.id] != null ? store.hidden[sl.id] : sl.hasAttribute('data-hidden');
  const visibleIdx = () => slides.map((s, i) => isHidden(s) ? -1 : i).filter(i => i >= 0);
  function applyHidden() { slides.forEach(s => s.classList.toggle('is-hidden', isHidden(s))); }

  /* ---------- transiciones ---------- */
  const TR = {
    push: (a, b, d) => [[a, { xPercent: -100 * d, duration: .9, ease: 'power3.inOut' }], [b, { xPercent: 100 * d }, { xPercent: 0, duration: .9, ease: 'power3.inOut' }]],
    cube: (a, b, d) => [[a, { rotationY: -90 * d, transformOrigin: d > 0 ? '100% 50%' : '0% 50%', duration: 1, ease: 'power2.inOut' }], [b, { rotationY: 90 * d, transformOrigin: d > 0 ? '0% 50%' : '100% 50%' }, { rotationY: 0, duration: 1, ease: 'power2.inOut' }]],
    zoom: (a, b) => [[a, { scale: .85, opacity: 0, duration: .7, ease: 'power2.in' }], [b, { scale: 1.18, opacity: 0 }, { scale: 1, opacity: 1, duration: .9, ease: 'power3.out', delay: .25 }]],
    fade: (a, b) => [[a, { opacity: 0, duration: .6 }], [b, { opacity: 0 }, { opacity: 1, duration: .8, delay: .2 }]],
    rise: (a, b, d) => [[a, { yPercent: -30 * d, opacity: 0, duration: .8, ease: 'power3.in' }], [b, { yPercent: 40 * d, opacity: 0 }, { yPercent: 0, opacity: 1, duration: .9, ease: 'power3.out', delay: .2 }]],
    flip: (a, b, d) => [[a, { rotationX: 90 * d, opacity: 0, transformOrigin: '50% 100%', duration: .8, ease: 'power2.in' }], [b, { rotationX: -90 * d, opacity: 0, transformOrigin: '50% 0%' }, { rotationX: 0, opacity: 1, duration: .9, ease: 'power3.out', delay: .3 }]]
  };
  function go(n, dir) {
    if (n < 0 || n >= slides.length || n === D.i || D.busy) return;
    dir = dir || (n > D.i ? 1 : -1);
    const a = slides[D.i], b = slides[n];
    const ed = D.editing();
    const type = 'push'; // única transición: deslizar la lámina
    D.busy = true; D.fire(a, 'leave'); if (ed) commitEdits(a);
    resetSlide(b); b.classList.add('active'); a.classList.add('leaving');
    const [[ea, ta], [eb, fb, tb]] = (TR[type] || TR.push)(a, b, dir);
    gsap.set(b, { xPercent: 0, yPercent: 0, rotationY: 0, rotationX: 0, scale: 1, opacity: 1, ...fb });
    gsap.to(ea, ta);
    gsap.to(eb, { ...tb, onComplete: () => { a.classList.remove('active', 'leaving'); gsap.set(a, { clearProps: 'all' }); D.busy = false; } });
    D.i = n; update();
    enterSlide(b, type === 'push' || type === 'cube' ? .55 : .45);
  }
  function step(d) { const v = visibleIdx(); const cur = v.indexOf(D.i); let n; if (cur < 0) n = v.find(i => d > 0 ? i > D.i : false) ?? [...v].reverse().find(i => i < D.i); else n = v[cur + d]; if (n != null) go(n, d); }
  function next() {
    if (!D.editing() && D.frags.some(f => !f.classList.contains('shown'))) { const f = D.frags.find(f => !f.classList.contains('shown')); showFrag(f); hint.classList.toggle('on', D.frags.some(f => !f.classList.contains('shown'))); return; }
    step(1);
  }
  function prev() { step(-1); }
  function update() {
    const v = visibleIdx(); const pos = v.indexOf(D.i);
    $('.num', ui).textContent = (pos >= 0 ? pos + 1 : '–') + ' / ' + v.length; prog.style.width = ((pos + 1) / v.length * 100) + '%';
    history.replaceState(null, '', '#' + (D.i + 1));
  }

  /* ---------- teclado, clic, gestos ---------- */
  addEventListener('keydown', e => {
    if (e.target.isContentEditable || /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) { if (e.key === 'Escape') e.target.blur(); return; }
    if ($('.modal.on')) return;
    const k = e.key;
    if (['ArrowRight', 'PageDown', ' ', 'Enter'].includes(k)) { e.preventDefault(); next(); }
    else if (['ArrowLeft', 'PageUp', 'Backspace'].includes(k)) { e.preventDefault(); prev(); }
    else if (k === 'Home') go(visibleIdx()[0]); else if (k === 'End') go(visibleIdx().slice(-1)[0]);
    else if (k === 'o' || k === 'O') toggleOv(); else if (k === 'f' || k === 'F') toggleFs();
    else if (k === 'e' || k === 'E') toggleEdit(); else if (k === 'm' || k === 'M') toggleMove(); else if (k === 'p' || k === 'P') printDeck();
    else if (k === 'Escape') { ov.classList.remove('on'); lb.classList.remove('on'); if (D.moving()) toggleMove(); else if (D.editing()) toggleEdit(); }
  });
  stage.parentElement.addEventListener('click', e => {
    if (D.editing() || e.target.closest('a,button,[data-go],.zoomable,.miner,canvas,[data-noclick],.slot')) return;
    (e.clientX < innerWidth * .25 ? prev : next)();
  });
  let tx = null; addEventListener('touchstart', e => { tx = e.touches[0].clientX; }, { passive: true });
  addEventListener('touchend', e => { if (tx == null) return; const dx = e.changedTouches[0].clientX - tx; if (Math.abs(dx) > 50) (dx < 0 ? next : prev)(); tx = null; });
  document.addEventListener('click', e => { const g = e.target.closest('[data-go]'); if (g && !D.editing()) { e.stopPropagation(); const t = g.dataset.go; const n = /^\d+$/.test(t) ? +t - 1 : slides.findIndex(s => s.id === t); if (n >= 0) go(n); } });

  /* ---------- mover láminas (vista «Láminas» y editor) ---------- */
  function moveSlide(from, to) {
    if (from === to || from < 0 || to < 0 || from >= slides.length || to >= slides.length) return false;
    const curEl = slides[D.i], [el] = slides.splice(from, 1); slides.splice(to, 0, el);
    slides.forEach(sl => stage.appendChild(sl)); store.meta.orden = slides.map(sl => sl.id);
    D.i = Math.max(0, slides.indexOf(curEl)); persist(); update(); return true;
  }
  /* ---------- vista general (ir / ocultar) ---------- */
  function toggleOv() {
    if (ov.classList.toggle('on')) renderOv();
  }
  function renderOv() {
    ov.innerHTML = `<h4>${document.title} · ${visibleIdx().length} de ${slides.length} láminas visibles</h4><p class="ovp">Clic en una lámina para ir a ella. Arrástrela (o use ◀ ▶) para cambiar el orden. «Ocultar» la saca de la presentación y del PDF.</p><div class="ov-grid">${slides.map((s, i) => `<div class="ov ${i === D.i ? 'cur' : ''} ${isHidden(s) ? 'off' : ''}" data-n="${i}"><b>${String(i + 1).padStart(2, '0')}</b>${(s.dataset.title || ($('h2,h1', s) || {}).textContent || 'Lámina').trim()}<button class="eye" data-h="${s.id}">${isHidden(s) ? '👁 Mostrar' : '🚫 Ocultar'}</button><span class="mv"><button data-mv="-1" title="Mover antes">◀</button><button data-mv="1" title="Mover después">▶</button></span></div>`).join('')}</div>`;
    $$('.ov', ov).forEach(c => c.onclick = e => { if (e.target.closest('.eye')) return; ov.classList.remove('on'); go(+c.dataset.n); });
    $$('.ov', ov).forEach(c => { c.draggable = true;
      c.ondragstart = e => { c.classList.add('drag'); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', c.dataset.n); };
      c.ondragend = () => c.classList.remove('drag');
      c.ondragover = e => { e.preventDefault(); c.classList.add('over'); }; c.ondragleave = () => c.classList.remove('over');
      c.ondrop = e => { e.preventDefault(); c.classList.remove('over'); const f = +e.dataTransfer.getData('text/plain'), t = +c.dataset.n; if (moveSlide(f, t)) renderOv(); }; });
    $$('[data-mv]', ov).forEach(b => b.onclick = e => { e.stopPropagation(); const n = +b.closest('.ov').dataset.n; if (moveSlide(n, n + +b.dataset.mv)) renderOv(); });
    $$('.eye', ov).forEach(b => b.onclick = e => { e.stopPropagation(); const s = $('#' + b.dataset.h); store.hidden[s.id] = !isHidden(s); persist(); applyHidden(); update(); renderOv(); });
  }
  function toggleFs() { if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => { }); else document.exitFullscreen(); }

  /* ---------- edición de textos y cifras ---------- */
  const EDIT_SEL = 'h1,h2,h3,h4,p,li,td,th,dt,dd,.edit,.lead,.kick,.pill,.sub,.lbl,.rich,[data-count],[data-ed]';
  const editablesIn = sl => $$(EDIT_SEL, sl).filter(el => !el.closest('[data-noedit]') && (el.classList.contains('rich') || !el.querySelector(EDIT_SEL)) && !(el.parentElement && el.parentElement.closest('.rich')) && !el.closest('.chartbox') && !el.closest('[data-tbl]') && !el.closest('.free-layer'));
  const keyOf = (sl, el, list) => sl.id + ':' + list.indexOf(el);
  function loadEdits() {
    slides.forEach(sl => { const list = editablesIn(sl); list.forEach(el => { const k = keyOf(sl, el, list); if (store.text[k] != null) { el.innerHTML = store.text[k]; if (el.classList.contains('rich')) $$('[data-count]', el).forEach(syncCount); } if (el.hasAttribute('data-count')) { if (store.text[k] != null) syncCount(el); el.dataset.orig0 = el.dataset.count; } }); });
  }
  function commitEdits(scope) {
    const sls = scope ? [scope] : slides;
    sls.forEach(sl => { const list = editablesIn(sl); list.forEach(el => { if (el.dataset.orig == null) return; if (el.hasAttribute('data-count')) syncCount(el); if (el.classList.contains('rich')) $$('[data-count]', el).forEach(syncCount); const k = keyOf(sl, el, list); if (el.innerHTML !== el.dataset.orig) store.text[k] = el.innerHTML; el.dataset.orig = el.innerHTML; }); });
    persist();
  }
  function toggleEdit() {
    const on = !D.editing(); if (!on && D.moving && D.moving()) toggleMove();
    if (on) { slides.forEach(s => showAll(s)); }
    body.classList.toggle('editing', on); $('[data-k=edit]', ui).classList.toggle('on', on);
    slides.forEach(sl => editablesIn(sl).forEach(el => { if (on) { el.dataset.orig = el.innerHTML; el.setAttribute('data-editable', ''); el.contentEditable = 'true'; } else { el.removeAttribute('data-editable'); el.contentEditable = 'false'; } }));
    if (!on) { commitEdits(); toast('Cambios guardados en este equipo. Para llevarlos a otra PC: «💾 Guardar cambios»'); }
    D.fire(slides[D.i], on ? 'edit' : 'enter');
    if (!on) { resetSlide(slides[D.i]); enterSlide(slides[D.i], .1); }
  }
  document.addEventListener('paste', e => { if (!e.target.isContentEditable) return; e.preventDefault(); const t = (e.clipboardData || window.clipboardData).getData('text'); document.execCommand('insertText', false, t); });
  document.addEventListener('blur', e => { if (e.target.isContentEditable) { const sl = e.target.closest('.slide'); if (sl) { if (e.target.hasAttribute('data-count')) syncCount(e.target); commitEdits(sl); D.fire(sl, 'edited'); } } }, true);

  /* ---------- casillas de imagen (pegar / soltar / elegir) ---------- */
  function compress(file, cb) {
    const r = new FileReader(); r.onload = () => { const img = new Image(); img.onload = () => { const max = 1700, sc = Math.min(1, max / Math.max(img.width, img.height)); const c = document.createElement('canvas'); c.width = Math.round(img.width * sc); c.height = Math.round(img.height * sc); const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.drawImage(img, 0, 0, c.width, c.height); cb(c.toDataURL('image/jpeg', .85)); }; img.src = r.result; }; r.readAsDataURL(file);
  }
  function setSlot(slot, src) { const im = $('img', slot); delete slot.dataset.ref;
    if (src && src.startsWith('dbimg:')) { slot.dataset.ref = src; slot.classList.add('has'); if (D.resolveImg) D.resolveImg(src).then(u => { if (u && slot.dataset.ref === src) im.src = u; }); return; } // imagen guardada en la nube
    if (src) { im.src = src; slot.classList.add('has'); } else { im.removeAttribute('src'); slot.classList.remove('has'); } }
  function initSlots() {
    $$('.slot').forEach(initSlot);
    document.addEventListener('paste', e => { if (!D.editing() || e.target.isContentEditable) return; const it = [...(e.clipboardData || {}).items || []].find(i => i.type.startsWith('image/')); if (!it) return; const sl = slides[D.i]; const slot = $('.slot:not(.has)', sl) || $('.slot', sl); if (slot) { e.preventDefault(); slot._put(it.getAsFile()); } });
  }
  function initSlot(slot) {
    if (slot._put) return; {
      const key = slot.dataset.slot; if (!$('img', slot)) slot.insertAdjacentHTML('afterbegin', '<img alt="">');
      if (!$('.slot-ui', slot)) slot.insertAdjacentHTML('beforeend', `<div class="slot-ui"><b>${slot.dataset.ph || 'Pegue aquí una imagen'}</b><span>Modo edición: clic para elegir archivo, arrastre la imagen o péguela con Ctrl+V</span><div class="slot-btns"><button data-s="pick">Elegir imagen</button><button data-s="clear">Quitar</button></div></div>`);
      const def = slot.dataset.src || '';
      setSlot(slot, store.images[key] !== undefined ? store.images[key] : def);
      const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/*'; inp.hidden = true; slot.appendChild(inp);
      const put = f => { if (!f || !/^image\//.test(f.type)) return; compress(f, url => { store.images[key] = url; persist(); setSlot(slot, url); toast('Imagen colocada'); }); };
      inp.onchange = () => { put(inp.files[0]); inp.value = ''; };
      slot.addEventListener('click', e => { if (!D.editing()) return; e.stopPropagation(); const b = e.target.closest('[data-s]'); if (b && b.dataset.s === 'clear') { store.images[key] = ''; persist(); setSlot(slot, ''); return; } inp.click(); });
      slot.addEventListener('dragover', e => { if (D.editing()) { e.preventDefault(); slot.classList.add('drag'); } });
      slot.addEventListener('dragleave', () => slot.classList.remove('drag'));
      slot.addEventListener('drop', e => { if (!D.editing()) return; e.preventDefault(); slot.classList.remove('drag'); put(e.dataTransfer.files[0]); });
      slot._put = put;
    }
  }
  D.initSlot = initSlot;

  /* ---------- exportar / importar cambios ---------- */
  function exportEdits() {
    if (D.editing()) commitEdits();
    const all = Object.assign({}, window.DECK_EDITS || {}); all[deckId] = store;
    const txt = '/* Cambios de las presentaciones. Generado ' + new Date().toLocaleString('es-PE') + ' */\nwindow.DECK_EDITS = ' + JSON.stringify(all) + ';\n';
    const fname = (body.dataset.editsFile || (deckId + '-cambios.js'));
    const a = document.createElement('a'); a.download = fname; a.href = URL.createObjectURL(new Blob([txt], { type: 'text/javascript' })); document.body.appendChild(a); a.click(); setTimeout(() => a.remove(), 200);
    toast(`Se descargó «${fname}». Cópielo en la carpeta «data» de la presentación (reemplazando el anterior) y pase la carpeta por USB.`, 7000);
  }
  fileIn.onchange = () => { const f = fileIn.files[0]; if (!f) return; f.text().then(t => { try { const j = t.trim().startsWith('{') ? JSON.parse(t) : JSON.parse(t.slice(t.indexOf('{'), t.lastIndexOf('}') + 1)); const d = j[deckId] || j; localStorage.setItem(LSK, JSON.stringify(merge(d, null))); location.reload(); } catch (e) { toast('Archivo no válido'); } }); fileIn.value = ''; };
  D.reset = () => { localStorage.removeItem(LSK); location.reload(); };

  /* ---------- PDF ---------- */
  function printDeck(noReload) {
    if (D.editing()) toggleEdit();
    body.classList.add('printing');
    slides.forEach(s => showAll(s));
    setTimeout(() => {
      slides.forEach(s => D.fire(s, 'print'));
      $$('.miner').forEach(m => { if (m._miner && m._miner.snap) { const fb = $('.fallback', m); try { fb.style.backgroundImage = `url(${m._miner.snap()})`; fb.style.backgroundSize = '100% 100%'; } catch (e) { } } });
      setTimeout(() => { if (noReload === true) return; window.print(); setTimeout(() => location.reload(), 400); }, 600);
    }, 250);
  }
  D.print = printDeck;

  /* ---------- arranque ---------- */
  /* ---------- comentarios oscuros (.insight): ocultar / mostrar en modo edición ---------- */
  function initBoxes() {
    slides.forEach(sl => $$('.insight', sl).forEach((bx, i) => {
      const k = 'box:' + sl.id + ':' + i, b = document.createElement('button');
      b.className = 'box-tg'; b.setAttribute('contenteditable', 'false'); b.setAttribute('data-noedit', '');
      const paint = () => { const off = !!store.hidden[k]; bx.classList.toggle('box-off', off); b.textContent = off ? '👁 Mostrar comentario' : '🚫 Ocultar comentario'; };
      b.onclick = e => { e.stopPropagation(); e.preventDefault(); store.hidden[k] = !store.hidden[k]; persist(); paint(); toast(store.hidden[k] ? 'Comentario oculto (no sale al presentar)' : 'Comentario visible'); };
      bx.appendChild(b); paint();
    }));
  }
  /* ---------- mover y cambiar tamaño (como Canva) ---------- */
  const MOVE_SEL = '.free,.card,.insight,.chartbox,.slot,.sh,.gauge,.mo,.ac,.ag,.ag-hub,.photos,.lab,.hx,.slogan,.ttl,.logo,.lg,.q,.donut,.kv,.months,.units,.unit,.mark,.tags,.hht,.big,.date,.kick,h1,h2,h3,dl,ul,table,.pill,.evd>*,.ins>*,.passo>*';
  const movables = sl => $$(MOVE_SEL, sl).filter(el => (!el.closest('.chartbox') || el.classList.contains('chartbox')) && !el.closest('.free-layer'));
  const mkey = (sl, el) => el.dataset.fid ? 'free:' + el.dataset.fid : sl.id + ':' + movables(sl).indexOf(el);
  function applyLayout(el, L) {
    const x = (L && L.x) || 0, y = (L && L.y) || 0;
    if (window.gsap && el.matches(ANIM_SEL)) { el._lay = { x, y }; el.style.translate = ''; gsap.set(el, { x, y }); }
    else el.style.translate = x || y ? `${x}px ${y}px` : ''; el.style.width = L && L.w ? L.w + 'px' : ''; el.style.height = L && L.h ? L.h + 'px' : ''; if (L && (L.w || L.h)) el.style.maxWidth = 'none'; el.style.zIndex = L && L.z ? L.z : ''; if (L && L.z && getComputedStyle(el).position === 'static') el.style.position = 'relative'; }
  function loadLayout() { slides.forEach(sl => movables(sl).forEach((el, i) => { const L = store.layout[sl.id + ':' + i]; if (L) applyLayout(el, L); })); }
  let selEl = null; const selBox = document.createElement('div'); selBox.className = 'sel-box'; selBox.innerHTML = '<i class="rz" title="Arrastre para cambiar el tamaño"></i><div class="sel-bar"><button data-mv="up" title="Traer al frente">⬆ Frente</button><button data-mv="reset" title="Volver a la posición y tamaño originales">↺ Original</button><button data-mv="del" class="mv-del" title="Eliminar este elemento">🗑 Eliminar</button></div>';
  D.moving = () => body.classList.contains('moving');
  function drawSel() { if (!selEl || !D.moving()) { selBox.remove(); return; } selBox.classList.toggle('is-free', !!selEl.dataset.fid); const sl = selEl.closest('.slide'); if (selBox.parentNode !== sl) sl.appendChild(selBox); const a = sl.getBoundingClientRect(), r = selEl.getBoundingClientRect(), k = D.scale;
    Object.assign(selBox.style, { left: (r.left - a.left) / k + 'px', top: (r.top - a.top) / k + 'px', width: r.width / k + 'px', height: r.height / k + 'px' }); }
  const lay = el => { const sl = el.closest('.slide'), k = mkey(sl, el); return [k, store.layout[k] || (store.layout[k] = {})]; };
  function toggleMove() {
    const on = !D.moving(); if (on && !D.editing()) toggleEdit();
    body.classList.toggle('moving', on); $('[data-k=move]', ui).classList.toggle('on', on);
    slides.forEach(sl => editablesIn(sl).forEach(el => el.contentEditable = on ? 'false' : 'true'));
    badge.innerHTML = on ? 'MODO MOVER · arrastre un elemento para moverlo · esquina dorada = tamaño · flechas para ajustar · Alt+clic elige el bloque mayor · M para terminar' : 'MODO EDICIÓN · clic en un texto o cifra para cambiarlo · «✎ Datos» en los gráficos · E para salir';
    if (!on) { selEl = null; drawSel(); persist(); toast('Posiciones guardadas'); }
  }
  const ev0Shift = e => !!e.shiftKey;
  stage.addEventListener('pointerdown', e => {
    if (!D.moving()) return; if (e.target.closest('.sel-bar')) return; e.preventDefault(); e.stopPropagation();
    const sl = slides[D.i]; const rz = e.target.closest('.rz');
    if (!rz) { let el = e.target.closest(MOVE_SEL); if (el && el.closest('.chartbox') && !el.classList.contains('chartbox')) el = el.closest('.chartbox'); if (e.altKey && el) el = el.parentElement.closest(MOVE_SEL) || el; const fr = e.target.closest('.free'); if (fr) el = fr;
      if (!el || !sl.contains(el)) { selEl = null; drawSel(); return; } selEl = el; drawSel(); }
    if (!selEl) return; const [k, L] = lay(selEl), x0 = e.clientX, y0 = e.clientY, sx = L.x || 0, sy = L.y || 0, w0 = selEl.offsetWidth, h0 = selEl.offsetHeight, sc = D.scale;
    const ratio = !!(rz && !ev0Shift(e) && (selEl.classList.contains('fimg') || selEl.matches('img,.slot') || (selEl.querySelector('.slot,img') && !selEl.querySelector('canvas,[data-tbl],.ftx'))));
    const mv = ev => { const dx = (ev.clientX - x0) / sc, dy = (ev.clientY - y0) / sc; if (rz && ratio) { const q = Math.max((w0 + dx) / w0, (h0 + dy) / h0, 40 / w0); L.w = Math.round(w0 * q); L.h = Math.round(h0 * q); } else if (rz) { L.w = Math.max(40, Math.round(w0 + dx)); L.h = Math.max(30, Math.round(h0 + dy)); } else { L.x = Math.round(sx + dx); L.y = Math.round(sy + dy); } applyLayout(selEl, L); drawSel(); };
    const up = () => { removeEventListener('pointermove', mv); removeEventListener('pointerup', up); persist(); const s2 = selEl && selEl.closest('.slide'); if (rz && s2) D.fire(s2, 'edited'); };
    addEventListener('pointermove', mv); addEventListener('pointerup', up);
  }, true);
  stage.addEventListener('click', e => { if (D.moving() && !e.target.closest('.sel-bar')) { e.preventDefault(); e.stopPropagation(); } }, true);
  selBox.addEventListener('click', e => { const b = e.target.closest('[data-mv]'); if (!b || !selEl) return; e.stopPropagation(); const [k, L] = lay(selEl);
    if (b.dataset.mv === 'del') { const f = selEl.dataset.fid; if (f && D.onFreeDelete) { D.onFreeDelete(f); selEl = null; drawSel(); } return; }
    if (b.dataset.mv === 'reset') { delete store.layout[k]; applyLayout(selEl, null); } else { L.z = (L.z || 1) + 5; applyLayout(selEl, L); } persist(); drawSel(); D.fire(selEl.closest('.slide'), 'edited'); });
  document.addEventListener('keydown', e => { if (!D.moving() || !selEl || !/^Arrow/.test(e.key)) return; e.preventDefault(); e.stopImmediatePropagation(); const [k, L] = lay(selEl), d = e.shiftKey ? 10 : 1;
    if (e.key === 'ArrowLeft') L.x = (L.x || 0) - d; if (e.key === 'ArrowRight') L.x = (L.x || 0) + d; if (e.key === 'ArrowUp') L.y = (L.y || 0) - d; if (e.key === 'ArrowDown') L.y = (L.y || 0) + d; applyLayout(selEl, L); drawSel(); persist(); }, true);
  addEventListener('resize', drawSel);
  D.toggleMove = toggleMove; D.applyLayout = applyLayout; D.ANIM_SEL = ANIM_SEL; D.base = el => ({ x: bx(el), y: by(el) }); D.drawSel = drawSel; D.select = el => { selEl = el; drawSel(); }; D.textKey = el => { const sl = el.closest('.slide'), list = editablesIn(sl); return keyOf(sl, el, list); };

  /* ---------- seguro para proyector (HDMI) ---------- */
  // pantalla negra / blanca: B o . (control remoto) · W o ,
  const curtain = document.createElement('div'); curtain.className = 'curtain'; document.body.appendChild(curtain);
  curtain.onclick = () => curtain.className = 'curtain';
  addEventListener('keydown', e => {
    if (e.target.isContentEditable || /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
    if (e.key === 'F5' || (e.shiftKey && e.key === 'F5')) { e.preventDefault(); toggleFs(); return; } // F5 de los controles remotos: no recargar
    if (curtain.className !== 'curtain' && !['b', 'B', '.', 'w', 'W', ','].includes(e.key)) { curtain.className = 'curtain'; e.stopImmediatePropagation(); e.preventDefault(); return; }
    if (['b', 'B', '.'].includes(e.key)) { curtain.className = curtain.classList.contains('black') ? 'curtain' : 'curtain on black'; }
    else if (['w', 'W', ','].includes(e.key)) { curtain.className = curtain.classList.contains('white') ? 'curtain' : 'curtain on white'; }
  }, true);
  // que la pantalla no se apague ni entre el protector mientras se presenta
  let lock = null; const keepAwake = async () => { try { if ('wakeLock' in navigator && document.visibilityState === 'visible') lock = await navigator.wakeLock.request('screen'); } catch (e) { } };
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') keepAwake(); });
  addEventListener('pointerdown', () => { if (!lock || lock.released) keepAwake(); }, { once: false, passive: true }); addEventListener('keydown', () => { if (!lock || lock.released) keepAwake(); }, { passive: true }); keepAwake();
  // al conectar el proyector o cambiar a pantalla completa, reajustar escala y gráficos
  const refit = () => { fit(); setTimeout(() => { fit(); if (window.HC) Object.values(HC.charts).forEach(c => { try { c.resize(); } catch (e) { } }); }, 120); };
  document.addEventListener('fullscreenchange', refit); if (window.matchMedia) { try { matchMedia('(resolution: ' + devicePixelRatio + 'dppx)').addEventListener('change', refit); } catch (e) { } }
  if (screen.orientation) screen.orientation.addEventListener && screen.orientation.addEventListener('change', refit);

  loadEdits(); loadLayout(); applyHidden(); initSlots(); initBoxes();
  slides.forEach(s => resetSlide(s));
  let start = Math.min(slides.length - 1, Math.max(0, (parseInt(location.hash.slice(1)) || 1) - 1));
  if (isHidden(slides[start])) start = visibleIdx()[0] || 0;
  D.i = start; slides[start].classList.add('active'); update();
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => enterSlide(slides[start], .2));
  wake();
})();
