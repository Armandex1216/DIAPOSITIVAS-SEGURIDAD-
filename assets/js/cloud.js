/* ==========================================================
   Guardado en la nube (Supabase)
   - Cualquiera que abra la presentación ve la última versión guardada.
   - Edición libre: cualquier cambio se guarda en la nube para todos (sin iniciar sesión).
   - Historial: cada guardado deja la versión anterior en diapo_historial (botón ☁ → Versiones).
   - Sin internet sigue funcionando con lo guardado en el equipo.
   Configuración: data/nube.js  →  window.NUBE = { url, key }
   Tabla: public.diapo_cambios (deck_id, data, updated_at, updated_by)
   Imágenes: tabla public.diapo_imagenes
   ========================================================== */
(function () {
  'use strict';
  const D = window.DECK, cfg = window.NUBE || {};
  if (!D || !cfg.url || !cfg.key || !window.supabase) { document.documentElement.classList.remove('nube-cargando'); return; }
  const sb = window.supabase.createClient(cfg.url, cfg.key, { auth: { persistSession: false } });
  const TABLE = 'diapo_cambios', BUCKET = 'diapositivas', id = D.deckId;
  const DIRTY = D.LSK + ':pendiente', STAMP = D.LSK + ':nube';
  const ui = document.querySelector('.ui'); const user = { email: 'libre' };

  /* ---------- botón de sesión ---------- */
  const btn = document.createElement('button'); btn.dataset.k = 'nube'; btn.title = 'Los cambios se guardan en la nube para todos · versiones anteriores';
  ui && ui.insertBefore(btn, ui.querySelector('[data-k=save]'));
  const paint = st => { btn.textContent = st === 'sync' ? '☁ Guardando…' : st === 'err' ? '☁ Sin internet · guardado en el equipo' : '☁ Guardado'; btn.classList.toggle('on', st !== 'err'); };
  btn.onclick = e => { e.stopPropagation(); versions(); };

  function modal(html) { let m = document.querySelector('.modal.nube'); if (!m) { m = document.createElement('div'); m.className = 'modal nube'; document.body.appendChild(m); } m.innerHTML = `<div class="mbox" style="width:min(460px,92vw)">${html}</div>`; m.classList.add('on'); m.onclick = ev => { if (ev.target === m) m.classList.remove('on'); }; return m; }
  const fmt = t => new Date(t).toLocaleString('es-PE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  async function versions() {
    const m = modal(`<h4>Guardado en la nube</h4><p>Todo lo que se edita aquí se guarda solo y lo ven todos. Si alguien borró algo por error, restaure una versión anterior.</p><div class="vers">Cargando versiones…</div><div class="macts"><button data-m="pull">Traer la última versión</button><span style="flex:1"></span><button class="ok" data-m="cancel">Listo</button></div>`);
    m.querySelector('[data-m=cancel]').onclick = () => m.classList.remove('on');
    m.querySelector('[data-m=pull]').onclick = () => { localStorage.removeItem(DIRTY); localStorage.removeItem(STAMP); sessionStorage.removeItem(STAMP); location.reload(); };
    const { data, error } = await sb.from('diapo_historial').select('id,guardado').eq('deck_id', id).order('id', { ascending: false }).limit(25);
    const box = m.querySelector('.vers');
    if (error || !data || !data.length) { box.textContent = error ? 'No se pudo cargar el historial.' : 'Aún no hay versiones anteriores.'; return; }
    box.innerHTML = data.map(v => `<div class="ver"><span>${fmt(v.guardado)}</span><button data-v="${v.id}">Restaurar</button></div>`).join('');
    box.onclick = async ev => { const b = ev.target.closest('[data-v]'); if (!b) return; b.textContent = 'Restaurando…';
      const r = await sb.from('diapo_historial').select('data').eq('id', +b.dataset.v).single();
      if (r.error) { b.textContent = 'Error'; return; }
      const now = new Date().toISOString(); const up = await sb.from(TABLE).upsert({ deck_id: id, data: r.data.data, updated_at: now, updated_by: 'restaurado' });
      if (up.error) { b.textContent = 'Error'; return; }
      localStorage.setItem(D.LSK, JSON.stringify(r.data.data)); localStorage.setItem(STAMP, now); localStorage.removeItem(DIRTY); sessionStorage.setItem(STAMP, now); location.reload(); };
  }

  /* ---------- subir: imágenes al bucket y cambios a la tabla ---------- */
  const canon = o => JSON.stringify(o, (k, v) => v && typeof v === 'object' && !Array.isArray(v) ? Object.keys(v).sort().reduce((a, x) => (a[x] = v[x], a), {}) : v);
  // imágenes: tabla diapo_imagenes (id → data URL); en los cambios solo queda la referencia «dbimg:<id>»
  async function uploadImages() {
    const imgs = D.store.images;
    for (const k of Object.keys(imgs)) {
      const v = imgs[k]; if (!v || !v.startsWith('data:')) continue;
      const iid = `${id}/${k}/${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
      const { error } = await sb.from('diapo_imagenes').insert({ id: iid, deck_id: id, data: v });
      if (error) throw error;
      cache.set('dbimg:' + iid, Promise.resolve(v));
      if (imgs[k] === v) imgs[k] = 'dbimg:' + iid;
    }
  }
  const cache = new Map();
  D.resolveImg = ref => { if (!cache.has(ref)) cache.set(ref, sb.from('diapo_imagenes').select('data').eq('id', ref.slice(6)).maybeSingle().then(r => r.data ? r.data.data : null, () => null)); return cache.get(ref); };
  document.querySelectorAll('.slot[data-ref]').forEach(slot => { const ref = slot.dataset.ref, im = slot.querySelector('img'); D.resolveImg(ref).then(u => { if (u && slot.dataset.ref === ref) im.src = u; }); });

  const clone = o => JSON.parse(JSON.stringify(o || {}));
  const BASE = D.LSK + ':base'; let base = null; try { base = JSON.parse(localStorage.getItem(BASE) || 'null'); } catch (e) { }
  const setBase = o => { base = clone(o); try { localStorage.setItem(BASE, JSON.stringify(base)); } catch (e) { } }; // versión de la nube sobre la que se edita
  function merge3(b, mine, theirs) {
    const out = clone(theirs);
    for (const sec of new Set([...Object.keys(mine || {}), ...Object.keys(b || {})])) {
      const M = (mine || {})[sec] || {}, B = (b || {})[sec] || {}, O = out[sec] = Object.assign({}, out[sec] || {});
      for (const k of new Set([...Object.keys(M), ...Object.keys(B)])) { if (canon(M[k]) === canon(B[k])) continue; if (M[k] === undefined) delete O[k]; else O[k] = clone(M[k]); }
    }
    return out;
  }
  let t = null, busy = false, again = false;
  async function push() {
    if (!user) return; if (busy) { again = true; return; } busy = true; paint('sync');
    try {
      await uploadImages();
      // si otro equipo (u otra pestaña) guardó mientras tanto, se juntan los cambios: lo editado aquí gana y lo demás se toma de la nube
      let out = D.store, merged = false;
      const cur = await sb.from(TABLE).select('data,updated_at').eq('deck_id', id).maybeSingle();
      if (!cur.error && cur.data && cur.data.updated_at !== localStorage.getItem(STAMP) && base) { out = merge3(base, D.store, cur.data.data || {}); merged = canon(out) !== canon(D.store); }
      localStorage.setItem(D.LSK, JSON.stringify(out));
      const now = new Date().toISOString();
      const { error } = await sb.from(TABLE).upsert({ deck_id: id, data: out, updated_at: now, updated_by: 'web' });
      if (error) throw error;
      localStorage.removeItem(DIRTY); localStorage.setItem(STAMP, now); sessionStorage.setItem(STAMP, now); setBase(out); paint();
      if (merged) { D.toast('Se juntaron tus cambios con los de otro equipo; actualizando…', 2500); setTimeout(() => location.reload(), 1200); }
    } catch (e) { console.warn(e); paint('err'); if (navigator.onLine) { D.toast('No se pudo guardar en la nube; queda guardado en este equipo y se reintentará', 3800); setTimeout(push, 15000); } else D.toast('Sin internet: los cambios quedan en este equipo y se suben solos al volver la conexión', 4000); }
    busy = false; if (again) { again = false; push(); }
  }
  D.onPersist = () => { localStorage.setItem(DIRTY, '1'); if (!user) return; clearTimeout(t); t = setTimeout(push, 1200); };
  addEventListener('online', () => { paint(); if (user && localStorage.getItem(DIRTY)) push(); });
  addEventListener('offline', () => paint('err')); if (!navigator.onLine) setTimeout(() => paint('err'), 0);

  // al volver a esta pestaña: si en la nube hay una versión más nueva y aquí no hay cambios pendientes, se actualiza
  document.addEventListener('visibilitychange', async () => { if (document.hidden || localStorage.getItem(DIRTY) || busy || D.editing()) return;
    const r = await sb.from(TABLE).select('updated_at').eq('deck_id', id).maybeSingle();
    if (!r.error && r.data && r.data.updated_at !== localStorage.getItem(STAMP)) { localStorage.removeItem(STAMP); sessionStorage.removeItem(STAMP); location.reload(); } });

  /* ---------- bajar: al abrir, traer la última versión ---------- */
  let listo; D.nubeLista = new Promise(r => { listo = r; }); // las importaciones esperan a tener la última versión
  const done = () => { document.documentElement.classList.remove('nube-cargando'); listo && listo(); };
  setTimeout(done, 3500);
  (async () => {
    paint();
    try {
      const { data, error } = await sb.from(TABLE).select('data,updated_at').eq('deck_id', id).maybeSingle();
      if (error) throw error;
      if (!data) { setBase(D.store); done(); if (user && localStorage.getItem(DIRTY)) push(); return; }
      const mine = localStorage.getItem(STAMP);
      // primera vez en este equipo (sin marca de la nube): manda la versión de la nube, aunque la página ya haya guardado algo (p. ej. la fecha)
      // con cambios pendientes: se suben juntándolos con la nube (si se conoce la versión de partida)
      if (localStorage.getItem(DIRTY) && user && mine && (mine >= data.updated_at || base)) { done(); push(); return; }
      if (mine === data.updated_at && !localStorage.getItem(DIRTY)) { if (!base) setBase(D.store); done(); return; }
      const remote = JSON.stringify(data.data);
      if (canon(data.data) !== canon(D.store) && sessionStorage.getItem(STAMP) !== data.updated_at) {
        localStorage.setItem(D.LSK, remote); localStorage.setItem(STAMP, data.updated_at); localStorage.removeItem(DIRTY); setBase(data.data);
        sessionStorage.setItem(STAMP, data.updated_at); location.reload(); return;
      }
      localStorage.setItem(STAMP, data.updated_at); setBase(D.store); done();
    } catch (e) { console.warn('Nube no disponible, se usa lo guardado en el equipo', e); done(); }
  })();
})();
