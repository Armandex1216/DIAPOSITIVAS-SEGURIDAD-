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

  /* Minero «de la unidad»: igual a la ilustración de referencia del reporte diario
     (mameluco verde limón con cintas reflectivas, correa negra, casco amarillo con lámpara, lentes claros, botas de jebe) */
  function buildMinerRef() {
    const K = {
      suit: new T.MeshStandardMaterial({ color: 0xaac200, roughness: .74 }),
      suitD: new T.MeshStandardMaterial({ color: 0x8ea500, roughness: .75 }),
      refl: new T.MeshStandardMaterial({ color: 0xd2d5d3, roughness: .4, metalness: .2 }),
      boot: new T.MeshStandardMaterial({ color: 0x1d1f21, roughness: .35 }),
      sole: new T.MeshStandardMaterial({ color: 0x4a4d50, roughness: .6 }),
      black: new T.MeshStandardMaterial({ color: 0x18191b, roughness: .5 }),
      metal: new T.MeshStandardMaterial({ color: 0xb8bcc0, roughness: .25, metalness: .8 }),
      glove: new T.MeshStandardMaterial({ color: 0xd0bd00, roughness: .7 }),
      skin: new T.MeshStandardMaterial({ color: 0xe3a878, roughness: .62 }),
      hair: new T.MeshStandardMaterial({ color: 0x6b3f22, roughness: .85 }),
      helmet: new T.MeshStandardMaterial({ color: 0xf5b800, roughness: .32 }),
      lens: new T.MeshStandardMaterial({ color: 0xdfeff5, roughness: .05, metalness: .1, transparent: true, opacity: .35 }),
      frame: new T.MeshStandardMaterial({ color: 0xb9c2c6, roughness: .3, metalness: .4 }),
      eye: new T.MeshStandardMaterial({ color: 0x2a2320, roughness: .4 }),
      white: new T.MeshStandardMaterial({ color: 0xffffff, roughness: .3 }),
      mouth: new T.MeshStandardMaterial({ color: 0x8a3b2e, roughness: .6 }),
      screen: new T.MeshStandardMaterial({ color: 0x9fd8a0, emissive: 0x3d7a42, emissiveIntensity: .6 }),
      lampW: new T.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff6d8, emissiveIntensity: 1.4 })
    };
    const root = new T.Group(), hips = new T.Group(); root.add(hips); root.scale.setScalar(.9);
    const ellipCyl = (r, h, m, y, zs = .72) => { const c = cyl(r, r, h, m, 32); c.scale.z = zs; c.position.y = y; return c; };
    // piernas
    const legs = [];
    [-1, 1].forEach(s => {
      const leg = new T.Group(); leg.position.set(.27 * s, 3.15, 0); hips.add(leg);
      const thigh = cap(.31, .8, K.suit, 14); thigh.position.y = -.55; leg.add(thigh);
      const shin = cap(.29, .62, K.suit, 14); shin.position.y = -1.5; leg.add(shin);
      const knee = sph(.255, K.suitD); knee.scale.set(1.18, .55, 1.2); knee.position.y = -1.08; leg.add(knee);
      const cuff = cyl(.29, .36, .42, K.suit, 24); cuff.position.y = -1.92; leg.add(cuff); // pantalón holgado sobre la bota
      [-1.78, -2.0].forEach(y => { const rr = .335 + (-1.8 - y) * .12, r = cyl(rr, rr, .13, K.refl, 24); r.position.y = y; leg.add(r); });
      const shaft = cyl(.26, .27, .8, K.boot, 24); shaft.position.y = -2.5; leg.add(shaft);
      const top = cyl(.255, .255, .05, K.boot, 24); top.position.y = -2.12; leg.add(top);
      const foot = sph(.27, K.boot); foot.scale.set(1.05, .55, 1.55); foot.position.set(0, -2.9, .16); leg.add(foot);
      const sole = cyl(.29, .29, .07, K.black, 24); sole.scale.z = 1.6; sole.position.set(0, -3.09, .14); leg.add(sole);
      legs.push(leg);
    });
    // tronco
    const torso = new T.Group(); torso.position.y = 3.2; hips.add(torso);
    const pelvis = sph(.62, K.suit, 28, 18); pelvis.scale.set(1, .62, .74); pelvis.position.y = .02; torso.add(pelvis);
    const body = cap(.66, .85, K.suit, 18); body.scale.set(1, 1, .7); body.position.y = .8; torso.add(body);
    torso.add(ellipCyl(.672, .2, K.black, .17, .7));                                   // correa
    const buckle = box(.24, .17, .04, K.metal); buckle.position.set(0, .17, .47); torso.add(buckle);
    const bk2 = box(.15, .09, .045, K.black); bk2.position.set(0, .17, .475); torso.add(bk2);
    torso.add(ellipCyl(.678, .3, K.refl, 1.0, .7));                                     // cinta del pecho
    [-1, 1].forEach(s => {                                                          // tirantes reflectivos
      const st = box(.2, .66, .03, K.refl); st.position.set(.3 * s, 1.38, .43); st.rotation.x = -.12; torso.add(st);
      const ov = box(.2, .04, .62, K.refl); ov.position.set(.32 * s, 1.76, 0); torso.add(ov);
      const sb = box(.2, .66, .03, K.refl); sb.position.set(.3 * s, 1.38, -.43); sb.rotation.x = .12; torso.add(sb);
      const seam = box(.02, .7, .02, K.suitD); seam.position.set(.03 * s, .55, .46); torso.add(seam);
    });
    const tag = box(.28, .08, .02, K.black); tag.position.set(-.3, 1.33, .45); tag.rotation.y = -.1; torso.add(tag); // portanombre
    const radio = box(.14, .2, .05, K.black); radio.position.set(.3, 1.3, .45); radio.rotation.y = .12; torso.add(radio);
    const scr = box(.09, .07, .01, K.screen); scr.position.set(.3, 1.34, .48); scr.rotation.y = .12; torso.add(scr);
    const collar = cyl(.2, .27, .2, K.black, 20); collar.position.y = 1.86; torso.add(collar);       // cuello negro
    [-1, 1].forEach(s => { const lap = box(.3, .24, .06, K.suit); lap.position.set(.2 * s, 1.82, .3); lap.rotation.set(-.55, .25 * s, -.75 * s); torso.add(lap); });
    // brazos
    const arms = {};
    [-1, 1].forEach(s => {
      const sh = new T.Group(); sh.position.set(.74 * s, 1.52, 0); torso.add(sh);
      const shp = sph(.25, K.suit); shp.position.x = -.03 * s; sh.add(shp);
      const up = cap(.215, .56, K.suit, 14); up.position.y = -.42; sh.add(up);
      const b = cyl(.225, .225, .18, K.refl, 20); b.position.y = -.48; sh.add(b);
      const elbow = new T.Group(); elbow.position.y = -.85; sh.add(elbow);
      elbow.add(sph(.205, K.suit));
      const fore = cap(.19, .48, K.suit, 14); fore.position.y = -.35; elbow.add(fore);
      const cuffB = cyl(.165, .165, .14, K.black, 20); cuffB.position.y = -.72; elbow.add(cuffB); // puño negro del guante
      const hand = new T.Group(); hand.position.y = -.84; elbow.add(hand);
      const palm = sph(.17, K.glove); palm.scale.set(1, 1.05, .65); palm.position.y = -.06; hand.add(palm);
      const fingers = new T.Group(); hand.add(fingers);
      [-.09, -.03, .03, .09].forEach((x, i) => { const f = cap(.042, .12 + (i === 1 || i === 2 ? .03 : 0), K.glove, 8); f.position.set(x * s, -.24, 0); fingers.add(f); });
      const thumb = cap(.04, .1, K.glove, 8); thumb.position.set(-.14 * s, -.06, .05); thumb.rotation.z = .8 * s; hand.add(thumb);
      sh.rotation.z = .12 * s;
      arms[s > 0 ? 'L' : 'R'] = { sh, elbow, hand, thumb, fingers };
    });
    // cabeza
    const head = new T.Group(); head.position.y = 1.86; head.scale.setScalar(1.18); torso.add(head);
    const neck = cyl(.14, .16, .3, K.skin); neck.position.y = .02; head.add(neck);
    const face = sph(.37, K.skin, 40, 30); face.scale.set(.88, 1.16, .95); face.position.y = .43; head.add(face);
    
    [-1, 1].forEach(s => { const ear = sph(.08, K.skin); ear.scale.set(.5, 1, .8); ear.position.set(.33 * s, .45, 0); head.add(ear);
      const sb = box(.06, .16, .14, K.hair); sb.position.set(.31 * s, .56, -.02); head.add(sb); });
    const hair = sph(.375, K.hair, 32, 16); hair.scale.set(.94, .78, 1); hair.position.set(0, .56, -.05); head.add(hair);
    const eyes = [];
    [-1, 1].forEach(s => {
      const w = sph(.05, K.white); w.scale.set(1.15, .8, .4); w.position.set(.125 * s, .49, .325); head.add(w);
      const e = sph(.032, K.eye); e.scale.z = .5; e.position.set(.125 * s, .49, .343); head.add(e); eyes.push(e, w);
      const brow = box(.13, .025, .03, K.hair); brow.position.set(.13 * s, .6, .33); brow.rotation.z = -.12 * s; head.add(brow);
      const ln = box(.19, .12, .015, K.lens); ln.position.set(.13 * s, .5, .378); ln.rotation.y = .18 * s; head.add(ln);
      const fr = box(.2, .022, .022, K.frame); fr.position.set(.13 * s, .565, .38); fr.rotation.y = .18 * s; head.add(fr);
      const arm = box(.018, .018, .3, K.frame); arm.position.set(.215 * s, .54, .23); head.add(arm);
    });
    const bridge = box(.06, .015, .02, K.frame); bridge.position.set(0, .53, .38); head.add(bridge);
    const nose = sph(.05, K.skin); nose.scale.set(1, 1.2, 1); nose.position.set(0, .41, .36); head.add(nose);
    const smile = new T.Mesh(new T.TorusGeometry(.085, .016, 8, 20, Math.PI), K.mouth); smile.scale.y = .55; smile.position.set(0, .3, .335); smile.rotation.z = Math.PI; head.add(smile);
    
    // casco
    const helmet = new T.Group(); helmet.position.y = .7; head.add(helmet);
    const dome = new T.Mesh(new T.SphereGeometry(.43, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), K.helmet); dome.scale.set(1.05, 1.05, 1.12); helmet.add(dome);
    const brim = cyl(.5, .53, .06, K.helmet, 40); brim.scale.z = 1.2; brim.position.set(0, .0, .04); helmet.add(brim);
    const ridge = box(.09, .07, .85, K.helmet); ridge.position.set(0, .44, 0); helmet.add(ridge);
    const band = cyl(.452, .445, .13, K.black, 40); band.scale.z = 1.12; band.position.y = .1; helmet.add(band); // banda negra
    const lampBase = box(.2, .16, .08, K.black); lampBase.position.set(0, .18, .48); helmet.add(lampBase);
    const lampRim = cyl(.12, .12, .07, K.black, 24); lampRim.rotation.x = Math.PI / 2; lampRim.position.set(0, .2, .52); helmet.add(lampRim);
    const lamp = cyl(.095, .095, .08, K.lampW, 24); lamp.rotation.x = Math.PI / 2; lamp.position.set(0, .2, .53); helmet.add(lamp);
    const beamMat = new T.MeshBasicMaterial({ color: 0xfff1b8, transparent: true, opacity: .1, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide });
    const beam = new T.Mesh(new T.ConeGeometry(.7, 2.6, 24, 1, true), beamMat); beam.rotation.x = -Math.PI / 2 - .12; beam.position.set(0, .05, 1.85); helmet.add(beam);
    const lampLight = new T.PointLight(0xfff1c8, .4, 5); lampLight.position.set(0, .17, .7); helmet.add(lampLight);
    root.userData = { hips, torso, head, helmet, legs, arms, eyes, beam, lampLight, ref: true };
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
    const isRef = el.dataset.model === 'ref', miner = isRef ? buildMinerRef() : buildMiner(); if (isRef) { renderer.toneMapping = T.NoToneMapping; } scene.add(miner); scene.add(shadowDisc());
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
      if (wv && U.ref) { R.sh.rotation.z = -.95 + Math.sin(t * 1.3) * .04; R.sh.rotation.x = -.2; R.elbow.rotation.z = -2.05 + Math.sin(t * (burst > 0 ? 12 : 6)) * .38; R.elbow.rotation.x = -.15; R.hand.rotation.y = .25; }
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
