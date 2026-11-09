/* ==========================================================
   Guardado en la nube (Supabase)
   - Cualquiera que abra la presentación ve la última versión guardada.
   - Solo los usuarios con cuenta (☁ Ingresar) guardan cambios en la nube.
   - Sin internet sigue funcionando con lo guardado en el equipo.
   Configuración: data/nube.js  →  window.NUBE = { url, key }
   Tabla: public.diapo_cambios (deck_id, data, updated_at, updated_by)
   Imágenes: bucket «diapositivas»
   ========================================================== */
(function () {
  'use strict';
  const D = window.DECK, cfg = window.NUBE || {};
  if (!D || !cfg.url || !cfg.key || !window.supabase) { document.documentElement.classList.remove('nube-cargando'); return; }
  const sb = window.supabase.createClient(cfg.url, cfg.key, { auth: { persistSession: true, storageKey: 'diapo-auth' } });
  const TABLE = 'diapo_cambios', BUCKET = 'diapositivas', id = D.deckId;
  const DIRTY = D.LSK + ':pendiente', STAMP = D.LSK + ':nube';
  const ui = document.querySelector('.ui'); let user = null;

  /* ---------- botón de sesión ---------- */
  const btn = document.createElement('button'); btn.dataset.k = 'nube'; btn.title = 'Guardar los cambios en la nube para todos';
  ui && ui.insertBefore(btn, ui.querySelector('[data-k=save]'));
  const paint = st => { btn.textContent = user ? (st === 'sync' ? '☁ Guardando…' : st === 'err' ? '☁ Sin conexión' : '☁ En la nube') : '🔑 Ingresar'; btn.classList.toggle('on', !!user && st !== 'err'); };
  ui && ui.addEventListener('click', e => { const b = e.target.closest('[data-k=edit],[data-k=move]'); if (b && !user && !D.editing()) setTimeout(() => D.toast('Para que sus cambios se guarden en la nube para todos: «🔑 Ingresar»', 4200), 2700); });
  btn.onclick = e => { e.stopPropagation(); user ? askLogout() : login(); };

  function modal(html) { let m = document.querySelector('.modal.nube'); if (!m) { m = document.createElement('div'); m.className = 'modal nube'; document.body.appendChild(m); } m.innerHTML = `<div class="mbox" style="width:min(420px,92vw)">${html}</div>`; m.classList.add('on'); m.onclick = ev => { if (ev.target === m) m.classList.remove('on'); }; return m; }
  function login() {
    const m = modal(`<h4>Ingresar para editar</h4><p>Con su cuenta, lo que edite (textos, cifras, gráficos, imágenes, posiciones) queda guardado en la nube y todos lo ven.</p>
      <form class="lg-f"><input name="e" type="email" placeholder="Correo" autocomplete="username" required><input name="p" type="password" placeholder="Contraseña" autocomplete="current-password" required><div class="lg-err"></div>
      <div class="macts"><span style="flex:1"></span><button type="button" data-m="cancel">Cancelar</button><button class="ok" type="submit">Ingresar</button></div></form>`);
    const f = m.querySelector('form'); f.e.focus();
    m.querySelector('[data-m=cancel]').onclick = () => m.classList.remove('on');
    f.onsubmit = async ev => { ev.preventDefault(); const err = m.querySelector('.lg-err'); err.textContent = 'Ingresando…';
      const { data, error } = await sb.auth.signInWithPassword({ email: f.e.value.trim(), password: f.p.value });
      if (error) { err.textContent = 'No se pudo ingresar: revise correo y contraseña.'; return; }
      user = data.user; m.classList.remove('on'); paint(); D.toast('Sesión iniciada: sus cambios se guardan en la nube'); if (localStorage.getItem(DIRTY)) push(); };
  }
  function askLogout() {
    const m = modal(`<h4>Sesión iniciada</h4><p>${(user.email || '').replace(/</g, '&lt;')}<br>Los cambios se guardan en la nube automáticamente.</p><div class="macts"><button data-m="pull">Traer la última versión</button><span style="flex:1"></span><button data-m="out">Cerrar sesión</button><button class="ok" data-m="cancel">Listo</button></div>`);
    m.querySelector('[data-m=cancel]').onclick = () => m.classList.remove('on');
    m.querySelector('[data-m=pull]').onclick = () => { localStorage.removeItem(DIRTY); localStorage.removeItem(STAMP); sessionStorage.removeItem(STAMP); location.reload(); };
    m.querySelector('[data-m=out]').onclick = async () => { await sb.auth.signOut(); user = null; paint(); m.classList.remove('on'); D.toast('Sesión cerrada'); };
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
      const { error } = await sb.from(TABLE).upsert({ deck_id: id, data: D.store, updated_at: now, updated_by: user.email });
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
    try { const { data } = await sb.auth.getSession(); user = data.session ? data.session.user : null; } catch (e) { }
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
