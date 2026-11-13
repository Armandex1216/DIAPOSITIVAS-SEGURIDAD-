/* ==========================================================
   Lucho explica el decreto con voz (gratis: la voz del propio navegador / Windows, sin internet y sin gastar la nube).
   Guion por partes: cada parte = texto que Lucho lee + (opcional) una imagen que aparece mientras lo dice.
   Se guarda en store.meta.lucho = { voz, vel, esc: [{ id, t }] } y las imágenes en store.images['lucho-<id>'].
   ========================================================== */
(function () {
  'use strict';
  const ready = fn => (window.DECK ? fn() : addEventListener('load', () => window.DECK && fn()));
  ready(() => setTimeout(init, 50));

  function init() {
    const D = window.DECK, SS = window.speechSynthesis;
    const slides = [...document.querySelectorAll('#d-aprendamos,[data-base="d-aprendamos"]')];
    if (!slides.length) return;
    const store = () => D.store;
    const cfg = () => { const m = store().meta = store().meta || {}; m.lucho = m.lucho || { voz: '', vel: 1, esc: [] }; m.lucho.esc = m.lucho.esc || []; return m.lucho; };
    const uid = () => 'e' + Math.random().toString(36).slice(2, 9);
    const imgSrc = id => { const v = (store().images || {})['lucho-' + id]; return typeof v === 'string' && v ? v : ''; };
    const resolve = async src => src.startsWith('dbimg:') ? (D.resolveImg ? await D.resolveImg(src) : '') : src;
    const save = (() => { let t; return () => { clearTimeout(t); t = setTimeout(() => D.persist(), 350); }; })();

    /* ---------- voces ---------- */
    let voices = [];
    const loadVoices = () => { voices = SS ? SS.getVoices().filter(v => /^es(-|_|$)/i.test(v.lang)) : []; };
    if (SS) { loadVoices(); SS.addEventListener && SS.addEventListener('voiceschanged', () => { loadVoices(); paintVoices(); }); }
    const MALE = /(raul|raúl|jorge|pablo|alvaro|álvaro|enrique|diego|tomas|tomás|gonzalo|lorenzo|mateo|alex|carlos|andr[eé]s|emilio|gerardo|francisco|liam|dario|darío|google español)/i;
    const PREF = ['es-PE', 'es-419', 'es-MX', 'es-US', 'es-CO', 'es-AR', 'es-CL', 'es-ES'];
    const score = v => (MALE.test(v.name) ? 40 : 0) + (/natural|online|neural/i.test(v.name) ? 30 : 0) + (10 - Math.max(0, PREF.indexOf(v.lang.replace('_', '-')) < 0 ? 9 : PREF.indexOf(v.lang.replace('_', '-')))) + (v.localService ? 3 : 0);
    const pickVoice = () => { const want = cfg().voz; return voices.find(v => v.name === want) || voices.slice().sort((a, b) => score(b) - score(a))[0] || null; };

    /* ---------- reproducción ---------- */
    const miner = sl => { const m = sl.querySelector('.miner'); return m && m._miner; };
    let run = null; // { sl, i, token }
    // tonos: cambian velocidad, tono de voz y gestos de Lucho (funciona con cualquier voz, sin cuentas)
    const TONOS = { normal: { n: 'Normal', r: 1, p: .92, g: 'point' }, emocionado: { n: '🔥 Emocionado', r: 1.12, p: 1.14, g: 'explain' }, serio: { n: '⚠️ Serio / advertencia', r: .86, p: .8, g: 'point' },
      charla: { n: '😄 Charla', r: 1.04, p: 1, g: 'explain' }, calma: { n: '🙂 Calmado', r: .9, p: .9, g: 'listen' } };
    // marcas en el texto: *palabra* = énfasis · [pausa] o … = pausa · ¡…! = más energía · ¿…? = tono de pregunta
    const chunks = (txt, tono) => { const T = TONOS[tono] || TONOS.normal, out = [];
      for (const fr of parts(String(txt || '').replace(/\.\.\.|…/g, ' [pausa] '))) {
        const ex = /¡|!/.test(fr) ? 1.08 : 1, q = /\?/.test(fr) ? 1.05 : 1;
        fr.split(/(\[pausa\]|\*[^*]+\*)/i).forEach(seg => { const t = seg.trim().replace(/^[,;:]\s*/, ''); if (!t) return;
          if (/^\[pausa\]$/i.test(t)) { if (out.length) out[out.length - 1].pause = (out[out.length - 1].pause || 0) + 650; return; }
          if (/^\*[^*]+\*$/.test(t)) { if (out.length) out[out.length - 1].pause = (out[out.length - 1].pause || 0) + 140; out.push({ t: t.slice(1, -1), r: T.r * .84, p: T.p * 1.12 * ex, pause: 160, emph: 1 }); return; }
          out.push({ t, r: T.r * (ex > 1 ? 1.04 : 1), p: T.p * ex * q }); }); }
      return out; };
    const parts = txt => (String(txt || '').replace(/\s+/g, ' ').trim().match(/[^.!?;:]+[.!?;:]*\s*/g) || []).map(x => x.trim()).filter(Boolean)
      .reduce((a, x) => { if (a.length && (a[a.length - 1].length < 40 || x.length < 12)) a[a.length - 1] += ' ' + x; else a.push(x); return a; }, []);

    async function showScene(sl, i) {
      const lv = sl.querySelector('.lv'), esc = cfg().esc[i]; if (!lv) return;
      lv.querySelector('.lv-n').textContent = cfg().esc.length ? `${i + 1} / ${cfg().esc.length}` : '';
      const src = esc ? await resolve(imgSrc(esc.id)) : '';
      const imgs = lv.querySelectorAll('.lv-img'), cur = lv.querySelector('.lv-img.on'), nxt = imgs[0] === cur ? imgs[1] : imgs[0];
      if (src) { if (!cur || cur.getAttribute('src') !== src) { nxt.src = src; await (nxt.decode ? nxt.decode().catch(() => { }) : 0); nxt.classList.add('on'); cur && cur.classList.remove('on'); } lv.classList.add('has-img'); }
      else if (!cur) lv.classList.remove('has-img');
    }
    function setSub(sl, html) { const s = sl.querySelector('.lv-sub'); if (s) s.innerHTML = html; }
    const esc = x => String(x).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

    function stop(keepUI) {
      if (!run) return; const { sl } = run; run = null; try { SS && SS.cancel(); } catch (e) { }
      const m = miner(sl); m && m.talk && m.talk(false);
      const lv = sl.querySelector('.lv'); if (lv) { lv.classList.remove('playing', 'paused'); lv.querySelector('.lv-play').textContent = '▶ Escuchar a Lucho'; }
      if (!keepUI) setSub(sl, '');
    }
    async function play(sl, from = 0) {
      stop(true); const list = cfg().esc.filter(e => (e.t || '').trim()); if (!list.length) { D.toast && D.toast('Primero escriba el guion de Lucho (✎ Editar → 🎙 Escribir el guion)'); return; }
      const token = {}; run = { sl, i: from, token };
      const lv = sl.querySelector('.lv'); lv.classList.add('playing'); lv.classList.remove('paused'); lv.querySelector('.lv-play').textContent = '⏸ Pausa';
      const m = miner(sl); m && m.talk && m.talk(true, 'point');
      for (let i = from; i < cfg().esc.length; i++) {
        if (!run || run.token !== token) return; run.i = i;
        const e = cfg().esc[i]; if (!(e.t || '').trim()) continue;
        await showScene(sl, i); m && m.gesture && m.gesture((TONOS[e.tono] || TONOS.normal).g || (i % 2 ? 'explain' : 'point'));
        for (const c of chunks(e.t, e.tono)) { if (!run || run.token !== token) return; await say(sl, c.t, token, c); if (c.pause) await wait(c.pause); }
        await wait(450);
      }
      if (run && run.token === token) { stop(true); setSub(sl, '<i>Fin de la explicación · ▶ para escucharla de nuevo</i>'); }
    }
    const wait = ms => new Promise(r => setTimeout(r, ms));
    function say(sl, frase, token, opt = {}) {
      return new Promise(done => {
        const words = frase.split(' '); setSub(sl, words.map((w, k) => `<span data-w="${k}">${esc(w)}</span>`).join(' '));
        const mark = k => { const s = sl.querySelectorAll('.lv-sub span'); s.forEach((x, j) => x.classList.toggle('dicho', j <= k)); };
        const m = miner(sl);
        if (!SS || !voices.length && !SS.getVoices().length) { // sin voz en este equipo: subtítulos al ritmo de lectura
          let k = 0; const iv = setInterval(() => { if (!run || run.token !== token) { clearInterval(iv); return done(); } mark(k++); m && m.word && m.word(); if (k > words.length) { clearInterval(iv); setTimeout(done, 250); } }, 330); return;
        }
        const u = new SpeechSynthesisUtterance(frase); const v = pickVoice(); if (v) { u.voice = v; u.lang = v.lang; } else u.lang = 'es-PE';
        u.rate = Math.max(.5, Math.min(2, (+cfg().vel || 1) * .97 * (opt.r || 1))); u.pitch = Math.max(.4, Math.min(1.8, opt.p || .92));
        let pos = 0, guard = setTimeout(fin, 1500 + frase.length * 120);
        const offs = []; { let c = 0; words.forEach(w => { offs.push(c); c += w.length + 1; }); }
        u.onboundary = ev => { if (ev.name && ev.name !== 'word') return; let k = 0; while (k + 1 < offs.length && offs[k + 1] <= ev.charIndex) k++; pos = k; mark(k); m && m.word && m.word(); };
        u.onstart = () => { m && m.word && m.word(); };
        function fin() { clearTimeout(guard); mark(words.length); done(); }
        u.onend = fin; u.onerror = fin;
        try { SS.speak(u); } catch (e) { fin(); }
      });
    }
    function togglePause(sl) {
      if (!run) return play(sl, 0); const lv = sl.querySelector('.lv'), m = miner(sl);
      if (lv.classList.toggle('paused')) { try { SS && SS.pause(); } catch (e) { } m && m.pause && m.pause(true); lv.querySelector('.lv-play').textContent = '▶ Continuar'; }
      else { try { SS && SS.resume(); } catch (e) { } m && m.pause && m.pause(false); lv.querySelector('.lv-play').textContent = '⏸ Pausa'; }
    }

    /* ---------- controles en la lámina ---------- */
    slides.forEach(sl => {
      const lv = sl.querySelector('.lv'); if (!lv) return;
      lv.addEventListener('click', e => { const b = e.target.closest('[data-lv]'); if (!b) return; e.stopPropagation(); e.preventDefault();
        const a = b.dataset.lv, cur = run && run.sl === sl ? run.i : -1;
        if (a === 'edit') return openPanel(sl);
        if (a === 'play') return run && run.sl === sl ? togglePause(sl) : play(sl, 0);
        if (a === 'next') return play(sl, Math.min(cfg().esc.length - 1, cur + 1));
        if (a === 'prev') return play(sl, Math.max(0, cur - 1)); });
      lv.addEventListener('pointerdown', e => { if (e.target.closest('[data-lv]')) e.stopPropagation(); });
      lv.addEventListener('keydown', e => e.stopPropagation());
    });
    const refresh = () => slides.forEach(sl => { const lv = sl.querySelector('.lv'); if (!lv) return; const n = cfg().esc.filter(e => (e.t || '').trim()).length;
      lv.classList.toggle('vacio', !n); if (!run || run.sl !== sl) { showScene(sl, 0); setSub(sl, n ? '<i>Presione ▶ y Lucho explicará el decreto</i>' : ''); } });
    refresh();
    // al entrar a la lámina Lucho empieza a hablar solo; al salir se calla
    let last = -1, autoT = 0;
    setInterval(() => { const i = D.i; if (i === last) return; last = i; clearTimeout(autoT); const sl = D.slides[i];
      if (run && run.sl !== sl) stop(); if (slides.includes(sl) && !D.editing() && cfg().esc.some(e => (e.t || '').trim())) autoT = setTimeout(() => { if (D.slides[D.i] === sl && !D.editing() && !run) play(sl, 0); }, 1600); }, 250);
    new MutationObserver(() => { if (D.editing() && run) stop(); }).observe(document.body, { attributes: true, attributeFilter: ['class'] });
    addEventListener('beforeprint', () => stop());

    /* ---------- panel del guion (modo edición) ---------- */
    let panel = null;
    function paintVoices() { if (!panel) return; const sel = panel.querySelector('.lp-voz'), want = cfg().voz, best = pickVoice();
      sel.innerHTML = voices.length ? voices.map(v => `<option value="${esc(v.name)}" ${(want ? v.name === want : best && v.name === best.name) ? 'selected' : ''}>${esc(v.name)} · ${v.lang}${v.localService ? '' : ' (con internet)'}</option>`).join('') : '<option value="">Este navegador no tiene voces en español</option>'; }
    function openPanel(sl) {
      if (panel) panel.remove(); stop();
      panel = document.createElement('div'); panel.className = 'lp'; panel.setAttribute('data-noedit', '');
      panel.innerHTML = `<div class="lp-box"><div class="lp-hd"><b>🎙 Guion de Lucho</b><span>Escriba lo que Lucho dirá, por partes. A cada parte puede ponerle una imagen (pegar con Ctrl+V, arrastrar o elegir): aparece mientras Lucho la explica.</span><button class="lp-x" title="Cerrar">✕</button></div>
        <div class="lp-cfg"><label>Voz <select class="lp-voz"></select></label><label>Velocidad <input class="lp-vel" type="range" min=".7" max="1.3" step=".05"><em class="lp-velv"></em></label><button class="lp-test">🔊 Probar voz</button></div>
        <div class="lp-list"></div><div class="lp-ft"><button class="lp-add">＋ Agregar parte</button><button class="lp-play">▶ Escuchar todo</button><button class="lp-ok">Listo</button></div>
        <p class="lp-tip">Marcas: <b>*palabra*</b> = la dice con énfasis · <b>[pausa]</b> o <b>…</b> = pausa dramática · <b>¡…!</b> = más energía. Consejo: frases cortas y claras. Escriba los números como se leen si hace falta (por ejemplo «artículo cien»). Las voces de <b>Microsoft Edge</b> («Online (Natural)») suenan más naturales; las de Windows funcionan sin internet.</p></div>`;
      document.body.appendChild(panel);
      const C = cfg(), list = panel.querySelector('.lp-list');
      if (!C.esc.length) C.esc.push({ id: uid(), t: '' });
      const vel = panel.querySelector('.lp-vel'); vel.value = C.vel || 1; panel.querySelector('.lp-velv').textContent = (+vel.value).toFixed(2) + '×';
      vel.oninput = () => { C.vel = +vel.value; panel.querySelector('.lp-velv').textContent = C.vel.toFixed(2) + '×'; save(); };
      paintVoices(); panel.querySelector('.lp-voz').onchange = e => { C.voz = e.target.value; save(); };
      panel.querySelector('.lp-test').onclick = () => { if (!SS) return D.toast('Este navegador no tiene voz'); SS.cancel(); const u = new SpeechSynthesisUtterance('Hola equipo, soy Lucho. Hoy les explico el reglamento.'); const v = pickVoice(); if (v) { u.voice = v; u.lang = v.lang; } u.rate = (+C.vel || 1) * .97; u.pitch = .92; SS.speak(u); };
      const draw = () => { list.innerHTML = C.esc.map((e, i) => `<div class="lp-row" data-i="${i}"><div class="lp-num">${i + 1}</div><div class="lp-tx"><select class="lp-tono" title="Cómo lo dice Lucho">${Object.entries(TONOS).map(([k, t]) => `<option value="${k}" ${(e.tono || 'normal') === k ? 'selected' : ''}>${t.n}</option>`).join('')}</select><textarea placeholder="Lo que Lucho dirá en esta parte… (use *palabra* para resaltar, [pausa] para una pausa)">${esc(e.t || '')}</textarea></div>
          <div class="lp-img" tabindex="0" title="Clic para elegir, Ctrl+V para pegar o arrastre una imagen">${imgSrc(e.id) ? '<img>' : '<span>🖼 Imagen<br><small>clic · Ctrl+V · arrastrar</small></span>'}</div>
          <div class="lp-acts"><button data-a="up" title="Subir">↑</button><button data-a="down" title="Bajar">↓</button><button data-a="noimg" title="Quitar imagen">🚫🖼</button><button data-a="play" title="Escuchar desde aquí">▶</button><button data-a="del" title="Borrar parte">✕</button></div></div>`).join('');
        list.querySelectorAll('.lp-row').forEach(row => { const i = +row.dataset.i, e = C.esc[i], im = row.querySelector('.lp-img img'); if (im) resolve(imgSrc(e.id)).then(u => { if (u) im.src = u; }); }); };
      draw();
      const putImg = (i, file) => { if (!file || !/^image\//.test(file.type)) return; D.compress(file, url => { store().images['lucho-' + C.esc[i].id] = url; D.persist(); draw(); refresh(); }); };
      const pick = document.createElement('input'); pick.type = 'file'; pick.accept = 'image/*'; pick.hidden = true; panel.appendChild(pick); let pickI = 0;
      pick.onchange = () => { putImg(pickI, pick.files[0]); pick.value = ''; };
      let focusI = 0;
      list.addEventListener('input', e => { const row = e.target.closest('.lp-row'); if (!row) return; const sc = C.esc[+row.dataset.i]; if (e.target.matches('.lp-tono')) sc.tono = e.target.value; else sc.t = e.target.value; save(); refresh(); });
      list.addEventListener('change', e => { if (!e.target.matches('.lp-tono')) return; const row = e.target.closest('.lp-row'); C.esc[+row.dataset.i].tono = e.target.value; D.persist(); });
      list.addEventListener('focusin', e => { const row = e.target.closest('.lp-row'); if (row) focusI = +row.dataset.i; });
      list.addEventListener('click', e => { const row = e.target.closest('.lp-row'); if (!row) return; const i = +row.dataset.i; focusI = i;
        if (e.target.closest('.lp-img')) { pickI = i; pick.click(); return; }
        const a = e.target.closest('[data-a]'); if (!a) return; const k = a.dataset.a;
        if (k === 'del') { if (C.esc.length > 1 || C.esc[0].t) { delete store().images['lucho-' + C.esc[i].id]; C.esc.splice(i, 1); if (!C.esc.length) C.esc.push({ id: uid(), t: '' }); } }
        if (k === 'up' && i > 0) [C.esc[i - 1], C.esc[i]] = [C.esc[i], C.esc[i - 1]];
        if (k === 'down' && i < C.esc.length - 1) [C.esc[i + 1], C.esc[i]] = [C.esc[i], C.esc[i + 1]];
        if (k === 'noimg') delete store().images['lucho-' + C.esc[i].id];
        if (k === 'play') { close(); setTimeout(() => play(sl, i), 300); return; }
        D.persist(); draw(); refresh(); });
      list.addEventListener('dragover', e => e.preventDefault());
      list.addEventListener('drop', e => { const row = e.target.closest('.lp-row'); if (!row) return; e.preventDefault(); e.stopPropagation(); putImg(+row.dataset.i, [...e.dataTransfer.files].find(f => /^image\//.test(f.type))); });
      panel.addEventListener('paste', e => { const it = [...(e.clipboardData || {}).items || []].find(x => x.type.startsWith('image/')); if (!it) return; e.preventDefault(); e.stopPropagation(); putImg(focusI, it.getAsFile()); }, true);
      panel.querySelector('.lp-add').onclick = () => { C.esc.push({ id: uid(), t: '' }); D.persist(); draw(); const ta = list.querySelectorAll('textarea'); ta[ta.length - 1].focus(); };
      const close = () => { D.persist(); refresh(); panel.remove(); panel = null; };
      panel.querySelector('.lp-x').onclick = close; panel.querySelector('.lp-ok').onclick = close;
      panel.querySelector('.lp-play').onclick = () => { close(); setTimeout(() => play(sl, 0), 300); };
      panel.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Escape') close(); }, true);
      panel.addEventListener('pointerdown', e => e.stopPropagation());
      setTimeout(() => { const ta = list.querySelector('textarea'); ta && ta.focus(); }, 50);
    }
    D.lucho = { play: () => play(slides[0], 0), stop, open: () => openPanel(slides[0]) };
  }
})();
