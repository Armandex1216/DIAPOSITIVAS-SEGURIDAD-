/* ==========================================================
   Guardado en la nube (Supabase)
   - Cualquiera que abra la presentación ve la última versión guardada.
   - Edición libre: cualquier cambio se guarda en la nube para todos (sin iniciar sesión).
   - Historial: cada guardado deja la versión anterior en diapo_historial (botón ☁ → Versiones).
   - Sin internet sigue funcionando con lo guardado en el equipo.
   Configuración: data/nube.js  →  window.NUBE = { url, key }
   Tabla: public.diapo_cambios (deck_id, data, updated_at, updated_by)
   Imágenes: bucket «diapositivas»
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
  const paint = st => { btn.textContent = st === 'sync' ? '☁ Guardando…' : st === 'err' ? '☁ Sin conexión' : '☁ Guardado'; btn.classList.toggle('on', st !== 'err'); };
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
  const toBlob = url => fetch(url).then(r => r.blob());
  async function uploadImages() {
    const imgs = D.store.images;
    for (const k of Object.keys(imgs)) {
      const v = imgs[k]; if (!v || !v.startsWith('data:')) continue;
      const path = `${id}/${k}-${Date.now()}.jpg`, blob = await toBlob(v);
      const { error } = await sb.storage.from(BUCKET).upload(path, blob, { contentType: 'image/jpeg', upsert: true });
      if (error) throw error;
      if (imgs[k] === v) imgs[k] = sb.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
    }
  }
  let t = null, busy = false, again = false;
  async function push() {
    if (!user) return; if (busy) { again = true; return; } busy = true; paint('sync');
    try {
      await uploadImages();
      localStorage.setItem(D.LSK, JSON.stringify(D.store));
      const now = new Date().toISOString();
      const { error } = await sb.from(TABLE).upsert({ deck_id: id, data: D.store, updated_at: now, updated_by: 'web' });
      if (error) throw error;
      localStorage.removeItem(DIRTY); localStorage.setItem(STAMP, now); paint();
    } catch (e) { console.error(e); paint('err'); D.toast('No se pudo guardar en la nube; queda guardado en este equipo y se reintentará', 3800); setTimeout(push, 15000); }
    busy = false; if (again) { again = false; push(); }
  }
  D.onPersist = () => { localStorage.setItem(DIRTY, '1'); if (!user) return; clearTimeout(t); t = setTimeout(push, 1200); };
  addEventListener('online', () => { if (user && localStorage.getItem(DIRTY)) push(); });

  /* ---------- bajar: al abrir, traer la última versión ---------- */
  const done = () => document.documentElement.classList.remove('nube-cargando');
  setTimeout(done, 3500);
  (async () => {
    paint();
    try {
      const { data, error } = await sb.from(TABLE).select('data,updated_at').eq('deck_id', id).maybeSingle();
      if (error) throw error;
      if (!data) { done(); if (user && localStorage.getItem(DIRTY)) push(); return; }
      const mine = localStorage.getItem(STAMP);
      if (localStorage.getItem(DIRTY) && user) { done(); if (!mine || mine >= data.updated_at) { push(); return; } }
      if (mine === data.updated_at && !localStorage.getItem(DIRTY)) { done(); return; }
      const remote = JSON.stringify(data.data);
      if (canon(data.data) !== canon(D.store) && sessionStorage.getItem(STAMP) !== data.updated_at) {
        localStorage.setItem(D.LSK, remote); localStorage.setItem(STAMP, data.updated_at); localStorage.removeItem(DIRTY);
        sessionStorage.setItem(STAMP, data.updated_at); location.reload(); return;
      }
      localStorage.setItem(STAMP, data.updated_at); done();
    } catch (e) { console.warn('Nube no disponible, se usa lo guardado en el equipo', e); done(); }
  })();
})();
