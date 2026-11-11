/* ==========================================================
   Minero 3D (Three.js r149, sin red). Uso:
   <div class="miner" data-miner="wave|point|thumbs|idle" style="..."></div>
   ========================================================== */
(function () {
  'use strict';
  if (!window.THREE) return;
  const T = THREE;
  if (T.ColorManagement) T.ColorManagement.legacyMode = false;
  const C = { suit: 0xc6d800, suit2: 0xaebf00, reflect: 0xe9ecef, helmet: 0xf6c400, skin: 0xe6b089, boot: 0x1c1c1c, glove: 0xe2cf22, belt: 0x232323, glass: 0x1b2a33, hair: 0x2a1d16, gold: 0xc39531 };
  const M = {
    suit: new T.MeshStandardMaterial({ color: C.suit, roughness: .62, metalness: .02 }),
    suit2: new T.MeshStandardMaterial({ color: C.suit2, roughness: .7 }),
    reflect: new T.MeshStandardMaterial({ color: C.reflect, roughness: .25, metalness: .55, emissive: 0x6d7073, emissiveIntensity: .35 }),
    helmet: new T.MeshStandardMaterial({ color: C.helmet, roughness: .28, metalness: .05 }),
    skin: new T.MeshStandardMaterial({ color: C.skin, roughness: .6 }),
    boot: new T.MeshStandardMaterial({ color: C.boot, roughness: .45 }),
    glove: new T.MeshStandardMaterial({ color: C.glove, roughness: .7 }),
    belt: new T.MeshStandardMaterial({ color: C.belt, roughness: .5 }),
    glass: new T.MeshStandardMaterial({ color: C.glass, roughness: .05, metalness: .6, transparent: true, opacity: .82 }),
    white: new T.MeshStandardMaterial({ color: 0xffffff, roughness: .3 }),
    black: new T.MeshStandardMaterial({ color: 0x111111, roughness: .3 }),
    lens: new T.MeshStandardMaterial({ color: 0xfffbe6, emissive: 0xfff3c4, emissiveIntensity: 2.2 }),
    gold: new T.MeshStandardMaterial({ color: C.gold, roughness: .3, metalness: .6 }),
    hair: new T.MeshStandardMaterial({ color: C.hair, roughness: .8 }),
    mouth: new T.MeshStandardMaterial({ color: 0x8a2e2e, roughness: .6 })
  };
  const cap = (r, l, m, s = 10) => new T.Mesh(new T.CapsuleGeometry(r, l, 6, s), m);
  const cyl = (rt, rb, h, m, s = 20) => new T.Mesh(new T.CylinderGeometry(rt, rb, h, s), m);
  const box = (w, h, d, m) => new T.Mesh(new T.BoxGeometry(w, h, d), m);
  const sph = (r, m, ws = 24, hs = 18) => new T.Mesh(new T.SphereGeometry(r, ws, hs), m);
  const ring = (r, t, m) => { const g = new T.TorusGeometry(r, t, 8, 32); const o = new T.Mesh(g, m); o.rotation.x = Math.PI / 2; return o; };

  function buildMiner() {
    const root = new T.Group(), hips = new T.Group(); root.add(hips);
    // piernas
    const legs = [];
    [-1, 1].forEach(s => {
      const leg = new T.Group(); leg.position.set(.28 * s, 2.25, 0); hips.add(leg);
      const thigh = cap(.27, .9, M.suit); thigh.position.y = -.55; leg.add(thigh);
      const shin = cap(.25, .85, M.suit); shin.position.y = -1.35; leg.add(shin);
      [-.95, -1.55].forEach(y => { const r = ring(.262, .045, M.reflect); r.position.y = y; leg.add(r); });
      const shaft = cyl(.28, .29, .62, M.boot); shaft.position.y = -1.86; leg.add(shaft);
      const toe = sph(.29, M.boot); toe.scale.set(1, .62, 1.25); toe.position.set(0, -2.1, .2); leg.add(toe);
      const sole = box(.56, .08, .98, M.black); sole.position.set(0, -2.22, .12); leg.add(sole);
      const cuff = ring(.29, .04, M.reflect); cuff.position.y = -1.58; leg.add(cuff);
      legs.push(leg);
    });
    // torso
    const torso = new T.Group(); torso.position.y = 2.25; hips.add(torso);
    const belly = cap(.68, .95, M.suit, 16); belly.scale.set(1, 1, .72); belly.position.y = .82; torso.add(belly);
    const belt = cyl(.69, .69, .16, M.belt, 28); belt.scale.z = .74; belt.position.y = .3; torso.add(belt);
    const buckle = box(.22, .14, .05, M.gold); buckle.position.set(0, .3, .52); torso.add(buckle);
    [.85, 1.25].forEach(y => { const r = cyl(.705, .705, .09, M.reflect, 28); r.scale.z = .74; r.position.y = y; torso.add(r); });
    [-1, 1].forEach(s => { const strap = box(.1, 1.15, .02, M.reflect); strap.position.set(.28 * s, 1.0, .5); strap.rotation.z = .05 * s; torso.add(strap); });
    const collar = cyl(.38, .5, .2, M.suit2); collar.position.y = 1.62; torso.add(collar);
    const pocket = box(.24, .2, .03, M.suit2); pocket.position.set(-.33, 1.08, .5); torso.add(pocket);
    const badge = box(.2, .12, .02, M.gold); badge.position.set(.33, 1.08, .515); torso.add(badge);
    // brazos (pivote en hombro)
    const arms = {};
    [-1, 1].forEach(s => {
      const sh = new T.Group(); sh.position.set(.72 * s, 1.42, 0); torso.add(sh);
      const shoulder = sph(.26, M.suit); sh.add(shoulder);
      const upper = cap(.2, .6, M.suit); upper.position.y = -.42; sh.add(upper);
      const elbow = new T.Group(); elbow.position.y = -.82; sh.add(elbow);
      const fore = cap(.18, .52, M.suit); fore.position.y = -.36; elbow.add(fore);
      const band = ring(.19, .04, M.reflect); band.position.y = -.42; elbow.add(band);
      const hand = new T.Group(); hand.position.y = -.78; elbow.add(hand);
      const palm = sph(.2, M.glove); palm.scale.set(1, 1.1, .8); hand.add(palm);
      const thumb = cap(.07, .14, M.glove); thumb.position.set(-.16 * s, .05, .08); thumb.rotation.z = .9 * s; hand.add(thumb);
      const fingers = cap(.075, .16, M.glove); fingers.position.set(0, -.2, .02); hand.add(fingers);
      sh.rotation.z = .18 * s;
      arms[s > 0 ? 'L' : 'R'] = { sh, elbow, hand, thumb, fingers };
    });
    // cabeza
    const head = new T.Group(); head.position.y = 1.95; torso.add(head);
    const neck = cyl(.2, .22, .3, M.skin); neck.position.y = -.12; head.add(neck);
    const face = sph(.56, M.skin, 32, 24); face.position.y = .42; face.scale.set(1, 1.06, .98); head.add(face);
    [-1, 1].forEach(s => { const ear = sph(.11, M.skin); ear.position.set(.55 * s, .4, 0); ear.scale.set(.6, 1, .8); head.add(ear); });
    const hair = sph(.57, M.hair, 32, 16); hair.scale.set(1.01, .55, 1.01); hair.position.set(0, .48, -.08); head.add(hair);
    const eyes = [];
    [-1, 1].forEach(s => {
      const w = sph(.1, M.white); w.position.set(.2 * s, .5, .48); w.scale.z = .5; head.add(w);
      const p = sph(.058, M.black); p.position.set(.2 * s, .5, .53); head.add(p); eyes.push(p, w);
    });
    const glasses = box(.86, .2, .08, M.glass); glasses.position.set(0, .51, .5); head.add(glasses);
    const glassFrame = box(.9, .04, .09, M.black); glassFrame.position.set(0, .62, .5); head.add(glassFrame);
    const nose = sph(.08, M.skin); nose.position.set(0, .36, .56); head.add(nose);
    const smile = new T.Mesh(new T.TorusGeometry(.14, .028, 8, 20, Math.PI), M.mouth); smile.position.set(0, .22, .5); smile.rotation.z = Math.PI; head.add(smile);
    [-1, 1].forEach(s => { const ch = sph(.07, new T.MeshStandardMaterial({ color: 0xf09a8a, roughness: .9, transparent: true, opacity: .55 })); ch.position.set(.33 * s, .3, .44); ch.scale.z = .3; head.add(ch); });
    // casco
    const helmet = new T.Group(); helmet.position.y = .62; head.add(helmet);
    const dome = new T.Mesh(new T.SphereGeometry(.64, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), M.helmet); dome.scale.set(1, .92, 1.08); helmet.add(dome);
    const brim = cyl(.78, .8, .06, M.helmet, 40); brim.scale.z = 1.12; brim.position.set(0, .02, .07); helmet.add(brim);
    const ridge = box(.12, .1, 1.2, M.helmet); ridge.position.set(0, .56, 0); ridge.scale.y = .8; helmet.add(ridge);
    const stripe = cyl(.645, .645, .07, M.reflect, 40); stripe.scale.z = 1.08; stripe.position.y = .12; helmet.add(stripe);
    const lampBase = box(.3, .24, .12, M.black); lampBase.position.set(0, .3, .66); helmet.add(lampBase);
    const lamp = cyl(.11, .11, .1, M.lens, 20); lamp.rotation.x = Math.PI / 2; lamp.position.set(0, .3, .73); helmet.add(lamp);
    const logo = box(.2, .12, .02, M.gold); logo.position.set(0, .45, .58); logo.rotation.x = -.5; helmet.add(logo);
    // haz de luz
    const beamMat = new T.MeshBasicMaterial({ color: 0xfff1b8, transparent: true, opacity: .1, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide });
    const beam = new T.Mesh(new T.ConeGeometry(.9, 3.2, 24, 1, true), beamMat); beam.rotation.x = -Math.PI / 2 - .12; beam.position.set(0, .14, 2.35); helmet.add(beam);
    const lampLight = new T.PointLight(0xfff1c8, .6, 6); lampLight.position.set(0, .3, .95); helmet.add(lampLight);
    root.userData = { hips, torso, head, helmet, legs, arms, eyes, beam, lampLight };
    return root;
  }

  function shadowDisc() {
    const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d');
    const g = x.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, 'rgba(0,0,0,.45)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128);
    const m = new T.Mesh(new T.PlaneGeometry(3.4, 3.4), new T.MeshBasicMaterial({ map: new T.CanvasTexture(c), transparent: true, depthWrite: false }));
    m.rotation.x = -Math.PI / 2; m.position.y = .01; return m;
  }

  function mount(el) {
    if (el._miner) return el._miner;
    if (el.dataset.model === 'ref') return window.MinerRef ? MinerRef.mount(el) : null;
    const fb = document.createElement('div'); fb.className = 'fallback'; if (el.dataset.fallback) fb.style.backgroundImage = `url(${el.dataset.fallback})`; el.appendChild(fb);
    let renderer;
    try { renderer = new T.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true }); } catch (e) { el.classList.add('nogl'); return null; }
    renderer.outputEncoding = T.sRGBEncoding; renderer.toneMapping = T.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0;
    el.appendChild(renderer.domElement);
    const scene = new T.Scene();
    const cam = new T.PerspectiveCamera(28, 1, .1, 100);
    const pose = el.dataset.miner || 'wave', dark = !!el.closest('.dark');
    scene.add(new T.HemisphereLight(0xfff6e0, dark ? 0x2a2620 : 0x6f6a60, dark ? .75 : .7));
    const key = new T.DirectionalLight(0xffffff, 1.9); key.position.set(4, 8, 6); scene.add(key);
    const rim = new T.DirectionalLight(0xe8c97f, dark ? 1.6 : .9); rim.position.set(-5, 4, -4); scene.add(rim);
    const fill = new T.DirectionalLight(0xffffff, .35); fill.position.set(-3, 2, 6); scene.add(fill);
    const miner = buildMiner(); scene.add(miner); scene.add(shadowDisc());
    const U = miner.userData; U.beam.visible = dark; if (!dark) U.lampLight.intensity = .25;
    const face = parseFloat(el.dataset.face || 0); miner.rotation.y = face;
    let W = 0, H = 0;
    function size() {
      const w = el.clientWidth, h = el.clientHeight; if (!w || !h || (w === W && h === H)) return; W = w; H = h;
      renderer.setPixelRatio(Math.min(2, (window.devicePixelRatio || 1) * ((window.DECK && DECK.scale) || 1) * 1.15 + .3));
      renderer.setSize(w, h, false); cam.aspect = w / h;
      const zoom = parseFloat(el.dataset.zoom || 1);
      cam.position.set(0, 3.9, 15.5 / zoom); cam.lookAt(0, 3.05, 0); cam.updateProjectionMatrix();
    }
    // interacción
    let drag = null, spin = 0, look = { x: 0, y: 0 }, burst = 0;
    const cv = renderer.domElement;
    cv.addEventListener('pointerdown', e => { drag = { x: e.clientX, r: miner.rotation.y, t: performance.now() }; cv.setPointerCapture(e.pointerId); e.stopPropagation(); });
    cv.addEventListener('pointermove', e => { if (drag) miner.rotation.y = drag.r + (e.clientX - drag.x) * .012; });
    cv.addEventListener('pointerup', e => { if (drag && performance.now() - drag.t < 220 && Math.abs(e.clientX - drag.x) < 6) burst = 1.6; drag = null; e.stopPropagation(); });
    cv.addEventListener('click', e => e.stopPropagation());
    addEventListener('mousemove', e => { const r = el.getBoundingClientRect(); look.x = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / (innerWidth / 2))); look.y = Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height * .3)) / (innerHeight / 2))); });
    const clock = new T.Clock(); let blinkT = 2 + Math.random() * 2;
    function frame() {
      const dt = Math.min(.05, clock.getDelta()), t = clock.elapsedTime;
      size();
      const { hips, torso, head, legs, arms, eyes, beam } = U;
      // respiración / rebote
      hips.position.y = Math.sin(t * 2.2) * .03 + (burst > 0 ? Math.max(0, Math.sin((1.6 - burst) * Math.PI / .55)) * .35 * (burst > 1.05 ? 1 : 0) : 0);
      torso.rotation.z = Math.sin(t * 1.1) * .02; torso.rotation.x = Math.sin(t * 2.2) * .01;
      head.rotation.y += ((look.x * .45) - head.rotation.y) * .08; head.rotation.x += ((look.y * .18) - head.rotation.x) * .08;
      if (!drag) miner.rotation.y += (face + look.x * .18 - miner.rotation.y) * .02;
      // brazos
      const R = arms.R, L = arms.L; const wv = burst > 0 || pose === 'wave';
      if (false) { R.sh.rotation.z = -.95 + Math.sin(t * 1.3) * .04; R.sh.rotation.x = -.2; R.elbow.rotation.z = -2.05 + Math.sin(t * (burst > 0 ? 12 : 6)) * .38; R.elbow.rotation.x = -.15; R.hand.rotation.y = .25; }
      else if (wv) { R.sh.rotation.z = -2.55 + Math.sin(t * 1.3) * .05; R.sh.rotation.x = -.15; R.elbow.rotation.z = -.35 + Math.sin(t * (burst > 0 ? 12 : 7)) * .45; }
      else if (pose === 'point') { R.sh.rotation.z = -1.35 + Math.sin(t * 1.5) * .04; R.sh.rotation.x = -.55; R.elbow.rotation.z = -.15; R.fingers.scale.y = 1.6; }
      else if (pose === 'thumbs') { R.sh.rotation.z = -.35; R.sh.rotation.x = -1.2 + Math.sin(t * 2) * .05; R.elbow.rotation.x = -1.2; R.elbow.rotation.z = 0; R.thumb.rotation.set(0, 0, 0); R.thumb.position.set(0, .22, .06); R.thumb.scale.set(1.2, 1.6, 1.2); }
      else { R.sh.rotation.z = -.18 + Math.sin(t * 1.6) * .05; R.elbow.rotation.z = -.1; }
      L.sh.rotation.z = .2 + Math.sin(t * 1.6 + 1) * .05; L.sh.rotation.x = Math.sin(t * 1.6) * .06; L.elbow.rotation.z = .12;
      legs[0].rotation.x = Math.sin(t * 1.6) * .02; legs[1].rotation.x = -Math.sin(t * 1.6) * .02;
      // parpadeo
      blinkT -= dt; const bl = blinkT < 0 ? (blinkT < -.14 ? (blinkT = 2.5 + Math.random() * 3, 1) : .1) : 1; eyes.forEach(e => e.scale.y = bl);
      beam.material.opacity = .085 + Math.sin(t * 3) * .02;
      if (burst > 0) burst -= dt;
      renderer.render(scene, cam);
    }
    let running = false, raf = 0;
    const loop = () => { if (!running) return; frame(); raf = requestAnimationFrame(loop); };
    const visible = () => { const sl = el.closest('.slide'); return !document.hidden && (!sl || sl.classList.contains('active')); };
    const tick = () => { const v = visible(); if (v && !running) { running = true; clock.getDelta(); loop(); } else if (!v && running) { running = false; cancelAnimationFrame(raf); } };
    setInterval(tick, 300); document.addEventListener('visibilitychange', tick); tick(); frame();
    el._miner = { wave() { burst = 1.6; }, renderer, snap() { W = 0; size(); frame(); return renderer.domElement.toDataURL('image/png'); } };
    return el._miner;
  }
  window.Miner3D = { mount };
  const init = () => document.querySelectorAll('[data-miner]').forEach(mount);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
