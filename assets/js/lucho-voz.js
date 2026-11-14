/* ==========================================================
   Lucho explica el decreto con voz natural (gratis, sin cuentas; queda guardada para usarla sin internet y no gasta la nube).
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
    // 1) Voz NATURAL (neural, la misma «Alex Perú» de Edge) generada en /api/tts: suena fluida en cualquier navegador.
    //    Se guarda en el equipo (IndexedDB) y dentro del archivo descargado: después funciona sin internet.
    // 2) Si no hay internet ni audio guardado, usa la voz del navegador / Windows.
    const NEURAL = [['es-PE-AlexNeural', 'Alex · Perú'], ['es-PE-CamilaNeural', 'Camila · Perú'], ['es-MX-JorgeNeural', 'Jorge · México'], ['es-CO-GonzaloNeural', 'Gonzalo · Colombia'], ['es-US-AlonsoNeural', 'Alonso · Latino'], ['es-ES-AlvaroNeural', 'Álvaro · España']];
    const useNeural = () => { const v = cfg().voz || ''; return !v || v.startsWith('n:'); };
    const nVoice = () => { const v = cfg().voz || ''; return v.startsWith('n:') ? v.slice(2) : 'es-PE-AlexNeural'; };
    let voices = [];
    const loadVoices = () => { voices = SS ? SS.getVoices().filter(v => /^es(-|_|$)/i.test(v.lang)) : []; };
    if (SS) { loadVoices(); SS.addEventListener && SS.addEventListener('voiceschanged', () => { loadVoices(); paintVoices(); }); }
    const MALE = /(raul|raúl|jorge|pablo|alvaro|álvaro|enrique|diego|tomas|tomás|gonzalo|lorenzo|mateo|alex|carlos|andr[eé]s|emilio|gerardo|francisco|liam|dario|darío|google español)/i;
    const PREF = ['es-PE', 'es-419', 'es-MX', 'es-US', 'es-CO', 'es-AR', 'es-CL', 'es-ES'];
    const score = v => (/es[-_]PE/i.test(v.lang) ? 100 : 0) + (MALE.test(v.name) ? 40 : 0) + (/natural|online|neural/i.test(v.name) ? 30 : 0) + (10 - Math.max(0, PREF.indexOf(v.lang.replace('_', '-')) < 0 ? 9 : PREF.indexOf(v.lang.replace('_', '-')))) + (v.localService ? 3 : 0);
    const pickVoice = () => { const want = cfg().voz; return voices.find(v => v.name === want) || voices.slice().sort((a, b) => score(b) - score(a))[0] || null; };

    /* ---------- audio natural: pedir, guardar y reutilizar ---------- */
    const MEM = window.LUCHO_AUDIO = window.LUCHO_AUDIO || {}; // en el archivo descargado ya viene lleno
    const API = []; if (/^https?:$/.test(location.protocol) && !/github\.io$/.test(location.hostname)) API.push((D.root || '') + 'api/tts'); API.push('https://diapositivas-seguridad.vercel.app/api/tts');
    let idb = null; const db = () => idb || (idb = new Promise(ok => { try { const r = indexedDB.open('lucho-voz', 1); r.onupgradeneeded = () => r.result.createObjectStore('a'); r.onsuccess = () => ok(r.result); r.onerror = () => ok(null); } catch (e) { ok(null); } }));
    const idbGet = async k => { const d = await db(); if (!d) return null; return new Promise(ok => { try { const q = d.transaction('a').objectStore('a').get(k); q.onsuccess = () => ok(q.result || null); q.onerror = () => ok(null); } catch (e) { ok(null); } }); };
    const idbPut = async (k, v) => { const d = await db(); if (!d) return; try { d.transaction('a', 'readwrite').objectStore('a').put(v, k); } catch (e) { } };
    let downUntil = 0; const pend = {};
    const pct = x => (x >= 0 ? '+' : '') + Math.round(x) + '%', hz = x => (x >= 0 ? '+' : '') + Math.round(x) + 'Hz';
    const nParams = c => ({ v: nVoice(), r: pct(Math.max(-30, Math.min(45, ((1 + c.nr / 100) * (+cfg().vel || 1) - 1) * 100))), p: hz(c.np), t: c.t });
    const keyOf = q => q.v + '|' + q.r + '|' + q.p + '|' + q.t;
    function getAudio(c) {
      const q = nParams(c), k = keyOf(q); if (MEM[k]) return Promise.resolve(MEM[k]); if (pend[k]) return pend[k];
      return pend[k] = (async () => {
        const hit = await idbGet(k); if (hit) return MEM[k] = hit;
        if (Date.now() < downUntil || navigator.onLine === false) throw new Error('sin internet');
        let err; for (const base of API) for (let n = 0; n < 2; n++) {
          try { const ac = new AbortController(), to = setTimeout(() => ac.abort(), 25000); const r = await fetch(`${base}?t=${encodeURIComponent(q.t)}&v=${q.v}&r=${encodeURIComponent(q.r)}&p=${encodeURIComponent(q.p)}`, { signal: ac.signal }).finally(() => clearTimeout(to)); if (r.status === 404) break;
            if (!r.ok) throw new Error('voz ' + r.status); const j = await r.json(); if (!j.a) throw new Error('sin audio');
            const o = { a: 'data:audio/mpeg;base64,' + j.a, w: j.w || [] }; MEM[k] = o; idbPut(k, o); return o; } catch (e) { err = e; } }
        downUntil = Date.now() + 45000; throw err || new Error('voz no disponible');
      })().finally(() => { delete pend[k]; });
    }
    // deja listo todo el guion (al entrar a la lámina, al cerrar el panel y antes de descargar)
    const allChunks = () => cfg().esc.flatMap(e => (e.t || '').trim() ? chunks(e.t, e.tono) : []);
    async function prefetch(list = allChunks()) { if (!useNeural()) return 0; let ok = 0, i = 0;
      await Promise.all([0, 1, 2, 3].map(async () => { while (i < list.length) { const c = list[i++]; try { await getAudio(c); ok++; } catch (e) { } } })); return ok; }

    /* ---------- reproducción ---------- */
    const miner = sl => { const m = sl.querySelector('.miner'); return m && m._miner; };
    let run = null; // { sl, i, token }
    const au = new Audio(); au.preload = 'auto';
    // tonos: velocidad y tono de voz (natural: nr % / np Hz · navegador: r / p) y gesto de Lucho
    const TONOS = { normal: { n: 'Normal', nr: 8, np: 0, r: 1.06, p: .95, g: 'point' }, emocionado: { n: '🔥 Emocionado', nr: 15, np: 4, r: 1.16, p: 1.12, g: 'explain' },
      serio: { n: '⚠️ Serio / advertencia', nr: 2, np: -4, r: .98, p: .84, g: 'point' }, charla: { n: '😄 Charla', nr: 12, np: 2, r: 1.12, p: 1, g: 'explain' }, calma: { n: '🙂 Calmado', nr: 3, np: -2, r: 1, p: .92, g: 'listen' } };
    // marcas: *palabra* = énfasis · [pausa] = pausa corta · ¡…! más energía · ¿…? pregunta. Solo se corta en [pausa]: así suena de corrido.
    const chunks = (txt, tono) => { const T = TONOS[tono] || TONOS.normal, out = [];
      String(txt || '').replace(/\s+/g, ' ').split(/\[pausa\]/i).forEach((blk, bi, arr) => {
        const t = blk.replace(/\*([^*]+)\*/g, '$1').replace(/^[,;:\s]+/, '').trim(); if (!t) return;
        const ex = /[¡!]/.test(t) ? 1.04 : 1;
        const ps = (t.match(/[^.!?]+[.!?]*\s*/g) || [t]).reduce((a, x) => { if (a.length && (a[a.length - 1] + x).length < 900) a[a.length - 1] += x; else a.push(x); return a; }, []);
        ps.forEach((x, k) => out.push({ t: x.trim(), nr: T.nr, np: T.np, r: T.r * (ex > 1 ? 1.03 : 1), p: T.p * ex, pause: k === ps.length - 1 && bi < arr.length - 1 ? 220 : 0 })); });
      return out; };

    // las ilustraciones .svg se ponen DENTRO de la página: así la animación arranca justo cuando empieza esa parte
    const svgCache = {};
    async function svgText(src) {
      if (src in svgCache) return svgCache[src]; let t = '';
      try { if (/^data:image\/svg/i.test(src)) { const [h, b] = [src.slice(0, src.indexOf(',')), src.slice(src.indexOf(',') + 1)]; t = /;base64/i.test(h) ? new TextDecoder().decode(Uint8Array.from(atob(b), c => c.charCodeAt(0))) : decodeURIComponent(b); }
        else if (/\.svg(\?|#|$)/i.test(src)) { const r = await fetch(src); if (r.ok) t = await r.text(); } } catch (e) { }
      return svgCache[src] = /<svg[\s>]/i.test(t) ? t.replace(/<\?xml[^>]*>/, '').replace(/<script[\s\S]*?<\/script>/gi, '').replace(/\son\w+="[^"]*"/gi, '') : '';
    }
    async function showScene(sl, i, restart) {
      const lv = sl.querySelector('.lv'), esc = cfg().esc[i]; if (!lv) return;
      lv.querySelector('.lv-n').textContent = cfg().esc.length ? `${i + 1} / ${cfg().esc.length}` : '';
      const stage = lv.querySelector('.lv-stage'), cur = stage.querySelector('.lv-img.on');
      const src = esc ? await resolve(imgSrc(esc.id)) : '';
      if (!src) { if (!cur) lv.classList.remove('has-img'); return; }
      if (cur && cur.dataset.src === src && !restart) return;
      const sv = await svgText(src); let el;
      if (sv) { el = document.createElement('div'); el.className = 'lv-img lv-vec'; el.innerHTML = sv; }
      else { el = new Image(); el.className = 'lv-img'; el.alt = ''; el.src = src; await (el.decode ? el.decode().catch(() => { }) : 0); }
      el.dataset.src = src; stage.insertBefore(el, stage.querySelector('.lv-empty'));
      const g = el.querySelector && el.querySelector('svg'); if (g && g.setCurrentTime) { try { g.setCurrentTime(0); g.unpauseAnimations(); } catch (e) { } }
      void el.offsetWidth; el.classList.add('on'); lv.classList.add('has-img');
      stage.querySelectorAll('.lv-img').forEach(x => { if (x !== el) { x.classList.remove('on'); setTimeout(() => x.remove(), 900); } });
    }
    function setSub(sl, html) { const s = sl.querySelector('.lv-sub'); if (s) s.innerHTML = html; }
    const esc = x => String(x).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

    function stop(keepUI) {
      if (!run) return; const { sl } = run; run = null; if (tapBtn) { tapBtn.remove(); tapBtn = null; } try { SS && SS.cancel(); } catch (e) { } try { au.pause(); au.onended && au.onended(); } catch (e) { }
      const m = miner(sl); m && m.talk && m.talk(false);
      const lv = sl.querySelector('.lv'); if (lv) { lv.classList.remove('playing', 'paused'); lv.querySelector('.lv-play').textContent = '▶ Escuchar al Ingeniero'; }
      if (!keepUI) setSub(sl, '');
    }
    const voicesReady = () => new Promise(ok => { if (!SS) return ok(); loadVoices(); if (voices.length) return ok(); let n = 0; const iv = setInterval(() => { loadVoices(); if (voices.length || ++n > 30) { clearInterval(iv); ok(); } }, 100); });
    async function play(sl, from = 0) {
      stop(true); const list = cfg().esc.filter(e => (e.t || '').trim()); if (!list.length) { D.toast && D.toast('Primero escriba el guion del Ingeniero (✎ Editar → 🎙 Escribir el guion)'); return; }
      const token = {}; run = { sl, i: from, token };
      const lv = sl.querySelector('.lv'); lv.classList.add('playing'); lv.classList.remove('paused'); lv.querySelector('.lv-play').textContent = '⏸ Pausa';
      const m = miner(sl); m && m.talk && m.talk(true, 'point');
      const rest = cfg().esc.slice(from).flatMap(e => (e.t || '').trim() ? chunks(e.t, e.tono) : []);
      if (useNeural()) { const first = rest[0] && getAudio(rest[0]).catch(() => null); setSub(sl, '<i>El Ing. Pallancón se está preparando…</i>'); prefetch(rest); await first; }
      else await voicesReady();
      for (let i = from; i < cfg().esc.length; i++) {
        if (!run || run.token !== token) return; run.i = i;
        const e = cfg().esc[i]; if (!(e.t || '').trim()) continue;
        await showScene(sl, i, true); m && m.gesture && m.gesture((TONOS[e.tono] || TONOS.normal).g || (i % 2 ? 'explain' : 'point'));
        for (const c of chunks(e.t, e.tono)) { if (!run || run.token !== token) return; await say(sl, c, token); if (c.pause) await wait(c.pause); }
        await wait(80);
      }
      if (run && run.token === token) { stop(true); setSub(sl, '<i>Fin de la explicación · ▶ para escucharla de nuevo</i>'); }
    }
    const wait = ms => new Promise(r => { const t0 = Date.now(), tick = () => (run && run.paused) ? setTimeout(tick, 100) : Date.now() - t0 >= ms ? r() : setTimeout(tick, 30); tick(); });
    const norm = w => String(w).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9ñ]/g, '');
    async function say(sl, c, token) {
      const frase = c.t, words = frase.split(' ');
      // subtítulos por renglones (~13 palabras o fin de frase): se ve solo el renglón que Lucho está diciendo
      const grp = []; { let g = 0, n = 0; words.forEach(w => { grp.push(g); n++; if (n >= 11 || (n >= 4 && /[.!?…]$/.test(w))) { g++; n = 0; } }); }
      const paint = () => setSub(sl, words.map((w, k) => `<span data-w="${k}" class="${grp[k] ? 'off' : ''}">${esc(w)}</span>`).join(' '));
      const mark = k => { const g = grp[Math.max(0, Math.min(words.length - 1, k))]; sl.querySelectorAll('.lv-sub span').forEach((x, j) => { x.classList.toggle('dicho', j <= k); x.classList.toggle('now', j === k && k < words.length); x.classList.toggle('off', grp[j] !== g); }); };
      const m = miner(sl);
      if (useNeural()) { let o = null; try { o = await getAudio(c); } catch (e) { }
        if (o && run && run.token === token) { paint(); return sayAudio(o, words, mark, m, token); } }
      paint(); return sayBrowser(frase, words, mark, m, token, c);
    }
    // voz natural: un solo audio por bloque (fluido); subtítulos y boca siguen las palabras que marca el audio
    function sayAudio(o, words, mark, m, token) {
      return new Promise(done => {
        // emparejar cada palabra del audio con la palabra escrita
        const at = []; let j = 0; o.w.forEach(([t, , txt]) => { const n = norm(txt); let f = -1; for (let s = j; s < Math.min(words.length, j + 4); s++) if (n && norm(words[s]).includes(n)) { f = s; break; } if (f < 0) f = Math.min(words.length - 1, j); at.push([t, f]); j = f + 1; });
        let raf = 0, last = -1, fin = false;
        const tick = () => { if (fin) return; const ms = au.currentTime * 1000; let k = -1; for (const [t, f] of at) { if (t <= ms + 40) k = f; else break; } if (k !== last) { last = k; mark(k); m && m.word && m.word(); } raf = requestAnimationFrame(tick); };
        const end = () => { if (fin) return; fin = true; cancelAnimationFrame(raf); au.onended = au.onerror = null; mark(words.length); done(); };
        au.onended = end; au.onerror = end; au.src = o.a; au.playbackRate = 1;
        if (!run || run.token !== token) return end();
        const p = au.play(); p && p.catch(err => { if (fin) return;
          if (err && err.name === 'NotAllowedError') { askTap(() => { if (!fin && run && run.token === token) au.play().catch(end); else end(); }); }
          else end(); });
        raf = requestAnimationFrame(tick);
      });
    }
    // el navegador no deja sonar audio hasta que la persona toque la página una vez: se muestra un botón grande
    let tapBtn = null;
    function askTap(go) {
      if (tapBtn) tapBtn.remove(); const lv = run && run.sl.querySelector('.lv'); if (!lv) return go();
      tapBtn = document.createElement('button'); tapBtn.className = 'lv-tap'; tapBtn.innerHTML = '🔊 Toque aquí para escuchar al Ingeniero';
      tapBtn.onclick = e => { e.stopPropagation(); tapBtn.remove(); tapBtn = null; go(); };
      lv.querySelector('.lv-stage').appendChild(tapBtn);
      const any = () => { removeEventListener('keydown', any, true); removeEventListener('pointerdown', any, true); if (tapBtn) { tapBtn.remove(); tapBtn = null; setTimeout(go, 30); } };
      addEventListener('keydown', any, true); addEventListener('pointerdown', any, true);
    }
    function sayBrowser(frase, words, mark, m, token, opt) {
      return new Promise(done => {
        if (!SS || !voices.length && !SS.getVoices().length) { // sin voz en este equipo: subtítulos al ritmo de lectura
          let k = 0; const iv = setInterval(() => { if (!run || run.token !== token) { clearInterval(iv); return done(); } if (run.paused) return; mark(k++); m && m.word && m.word(); if (k > words.length) { clearInterval(iv); setTimeout(done, 250); } }, 300); return;
        }
        const u = new SpeechSynthesisUtterance(frase); const v = useNeural() ? voices.slice().sort((a, b) => score(b) - score(a))[0] : pickVoice(); if (v) { u.voice = v; u.lang = v.lang; } else u.lang = 'es-PE';
        u.rate = Math.max(.5, Math.min(2, (+cfg().vel || 1) * (opt.r || 1))); u.pitch = Math.max(.4, Math.min(1.8, opt.p || .92));
        let guard = setTimeout(fin, 1500 + frase.length * 120);
        const offs = []; { let c = 0; words.forEach(w => { offs.push(c); c += w.length + 1; }); }
        u.onboundary = ev => { if (ev.name && ev.name !== 'word') return; let k = 0; while (k + 1 < offs.length && offs[k + 1] <= ev.charIndex) k++; mark(k); m && m.word && m.word(); };
        u.onstart = () => { m && m.word && m.word(); };
        function fin() { clearTimeout(guard); mark(words.length); done(); }
        u.onend = fin; u.onerror = fin;
        try { SS.speak(u); } catch (e) { fin(); }
      });
    }
    function togglePause(sl) {
      if (!run) return play(sl, 0); const lv = sl.querySelector('.lv'), m = miner(sl);
      if (lv.classList.toggle('paused')) { run.paused = true; try { SS && SS.pause(); } catch (e) { } try { au.pause(); } catch (e) { } m && m.pause && m.pause(true); lv.querySelector('.lv-play').textContent = '▶ Continuar'; }
      else { run.paused = false; try { SS && SS.resume(); } catch (e) { } if (au.src && au.paused && au.onended) au.play().catch(() => { }); m && m.pause && m.pause(false); lv.querySelector('.lv-play').textContent = '⏸ Pausa'; }
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
      lv.classList.toggle('vacio', !n); if (!run || run.sl !== sl) { showScene(sl, 0); setSub(sl, n ? '<i>Presione ▶ y el Ing. Pallancón Selenio explicará el decreto</i>' : ''); } });
    refresh();
    setTimeout(() => { if (cfg().esc.some(e => (e.t || '').trim())) prefetch(); }, 2500);
    // al entrar a la lámina Lucho empieza a hablar solo; al salir se calla
    let last = -1, autoT = 0;
    setInterval(() => { const i = D.i; if (i === last) return; last = i; clearTimeout(autoT); const sl = D.slides[i];
      if (run && run.sl !== sl) stop(); if (slides.includes(sl) && cfg().esc.some(e => (e.t || '').trim())) prefetch();
      if (slides.includes(sl) && !D.editing() && cfg().esc.some(e => (e.t || '').trim())) autoT = setTimeout(() => { if (D.slides[D.i] === sl && !D.editing() && !run) play(sl, 0); }, 1600); }, 250);
    new MutationObserver(() => { if (D.editing() && run) stop(); }).observe(document.body, { attributes: true, attributeFilter: ['class'] });
    addEventListener('beforeprint', () => stop());

    /* ---------- panel del guion (modo edición) ---------- */
    let panel = null;
    function paintVoices() { if (!panel) return; const sel = panel.querySelector('.lp-voz'), want = cfg().voz || 'n:es-PE-AlexNeural';
      sel.innerHTML = `<optgroup label="🎙 Voz natural (recomendada, fluida)">${NEURAL.map(([id, n]) => `<option value="n:${id}" ${want === 'n:' + id ? 'selected' : ''}>${n} · natural</option>`).join('')}</optgroup>` +
        (voices.length ? `<optgroup label="Voces de este equipo (más robóticas, sin internet)">${voices.map(v => `<option value="${esc(v.name)}" ${v.name === want ? 'selected' : ''}>${esc(v.name)} · ${v.lang}</option>`).join('')}</optgroup>` : ''); }
    function openPanel(sl) {
      if (panel) panel.remove(); stop();
      panel = document.createElement('div'); panel.className = 'lp'; panel.setAttribute('data-noedit', '');
      panel.innerHTML = `<div class="lp-box"><div class="lp-hd"><b>🎙 Guion del Ing. Pallancón Selenio</b><span>Escriba lo que el Ingeniero dirá, por partes. A cada parte puede ponerle una imagen (pegar con Ctrl+V, arrastrar o elegir): aparece mientras el Ingeniero la explica.</span><button class="lp-x" title="Cerrar">✕</button></div>
        <div class="lp-cfg"><label>Voz <select class="lp-voz"></select></label><label>Velocidad <input class="lp-vel" type="range" min=".7" max="1.3" step=".05"><em class="lp-velv"></em></label><button class="lp-test">🔊 Probar voz</button></div>
        <div class="lp-warn"></div><div class="lp-list"></div><div class="lp-ft"><button class="lp-add">＋ Agregar parte</button><button class="lp-play">▶ Escuchar todo</button><button class="lp-ok">Listo</button></div>
        <p class="lp-tip">Marcas: <b>*palabra*</b> = la dice con énfasis · <b>[pausa]</b> o <b>…</b> = pausa dramática · <b>¡…!</b> = más energía. Consejo: frases cortas y claras. Escriba los números como se leen si hace falta (por ejemplo «artículo cien»). La <b>voz natural</b> se descarga una vez y queda guardada: luego el Ingeniero habla aunque no haya señal (también en el archivo descargado).</p></div>`;
      document.body.appendChild(panel);
      const C = cfg(), list = panel.querySelector('.lp-list');
      if (!C.esc.length) C.esc.push({ id: uid(), t: '' });
      const vel = panel.querySelector('.lp-vel'); vel.value = C.vel || 1; panel.querySelector('.lp-velv').textContent = (+vel.value).toFixed(2) + '×';
      vel.oninput = () => { C.vel = +vel.value; panel.querySelector('.lp-velv').textContent = C.vel.toFixed(2) + '×'; save(); };
      const warn = () => { const w = panel && panel.querySelector('.lp-warn'); if (!w) return; w.style.display = 'none'; };
      voicesReady().then(() => { paintVoices(); warn(); });
      paintVoices(); panel.querySelector('.lp-voz').onchange = e => { C.voz = e.target.value; save(); };
      panel.querySelector('.lp-test').onclick = async () => { const t = '¡Hola, equipo! Soy el ingeniero Pallancón Selenio, su compañero de seguridad. Hoy les explico el reglamento, al toque y bien clarito.';
        try { SS && SS.cancel(); au.pause(); } catch (e) { }
        if (useNeural()) { const b = panel.querySelector('.lp-test'); b.textContent = '⏳ Cargando voz…'; try { const o = await getAudio(chunks(t, 'charla')[0]); au.onended = null; au.src = o.a; au.play(); }
          catch (e) { D.toast('No se pudo cargar la voz natural (¿sin internet?). Se usará la voz del equipo.', 5000); } b.textContent = '🔊 Probar voz'; return; }
        if (!SS) return D.toast('Este navegador no tiene voz'); const u = new SpeechSynthesisUtterance(t); const v = pickVoice(); if (v) { u.voice = v; u.lang = v.lang; } u.rate = (+C.vel || 1) * 1.1; u.pitch = 1; SS.speak(u); };
      const draw = () => { list.innerHTML = C.esc.map((e, i) => `<div class="lp-row" data-i="${i}"><div class="lp-num">${i + 1}</div><div class="lp-tx"><select class="lp-tono" title="Cómo lo dice el Ingeniero">${Object.entries(TONOS).map(([k, t]) => `<option value="${k}" ${(e.tono || 'normal') === k ? 'selected' : ''}>${t.n}</option>`).join('')}</select><textarea placeholder="Lo que el Ingeniero dirá en esta parte… (use *palabra* para resaltar, [pausa] para una pausa)">${esc(e.t || '')}</textarea></div>
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
      const close = () => { D.persist(); refresh(); panel.remove(); panel = null; prefetch(); };
      panel.querySelector('.lp-x').onclick = close; panel.querySelector('.lp-ok').onclick = close;
      panel.querySelector('.lp-play').onclick = () => { close(); setTimeout(() => play(sl, 0), 300); };
      panel.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Escape') close(); }, true);
      panel.addEventListener('pointerdown', e => e.stopPropagation());
      setTimeout(() => { const ta = list.querySelector('textarea'); ta && ta.focus(); }, 50);
    }
    // para la descarga: deja todo el audio del guion dentro del archivo (Lucho habla sin internet)
    async function bundle() { const list = allChunks(); await prefetch(list); const out = {}; list.forEach(c => { const k = keyOf(nParams(c)); if (MEM[k]) out[k] = MEM[k]; }); return out; }
    D.lucho = { play: () => play(slides[0], 0), stop, open: () => openPanel(slides[0]), prefetch: () => prefetch(), bundle };
  }
})();
