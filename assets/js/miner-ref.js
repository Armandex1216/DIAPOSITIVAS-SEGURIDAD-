/* ==========================================================
   Minero 3D «de la unidad» (Three.js r149, sin red), estilo ilustración:
   sombreado por tonos (toon) + contorno, mameluco verde limón con cintas reflectivas,
   casco amarillo con banda negra y lámpara, lentes claros envolventes, guantes y botas de jebe.
   Hace varias acciones en bucle: saluda, explica señalando (como la ilustración), pulgar arriba,
   mira alrededor, revisa su radio, asiente y se acomoda el casco. Clic = saluda.
   Uso: <div class="miner" data-miner="wave" data-model="ref"></div>
   ========================================================== */
(function () {
  'use strict';
  if (!window.THREE) return;
  const T = THREE;
  if (T.ColorManagement) T.ColorManagement.legacyMode = false;

  /* ---------- materiales: tonos planos como la ilustración ---------- */
  const grad = (() => { const d = new Uint8Array([88, 168, 255]); const t = new T.DataTexture(d, 3, 1, T.RedFormat); t.minFilter = t.magFilter = T.NearestFilter; t.needsUpdate = true; return t; })();
  const toon = (c, o = {}) => new T.MeshToonMaterial(Object.assign({ color: c, gradientMap: grad }, o));
  const OUT = new T.ShaderMaterial({
    uniforms: { c: { value: new T.Color(0x3a3a1c) }, k: { value: .0023 } }, side: T.BackSide,
    vertexShader: 'uniform float k; void main(){ vec4 mv = modelViewMatrix * vec4(position,1.0); vec3 n = normalize(normalMatrix * normal); mv.xyz += n * k * max(1.0, -mv.z); gl_Position = projectionMatrix * mv; }',
    fragmentShader: 'uniform vec3 c; void main(){ gl_FragColor = vec4(c,1.0); }'
  });
  const K = {
    suit: toon(0xd4dc00), suitD: toon(0xa7b000), refl: toon(0xdfe2e0), black: toon(0x202124), boot: toon(0x26282b),
    sole: toon(0x3b3e42), metal: toon(0xc4c8cc), glove: toon(0xe2c900), cuff: toon(0x1d1e20), skin: toon(0xf0b27c),
    lip: toon(0xc77a5a), hair: toon(0x6a3b1c), brow: toon(0x4a2a14), helmet: toon(0xf7b500), white: toon(0xffffff), iris: toon(0x3b2a20),
    radio: toon(0x34373b), screen: new T.MeshBasicMaterial({ color: 0xa6dca8 }), lamp: new T.MeshBasicMaterial({ color: 0xffffff }),
    lens: new T.MeshBasicMaterial({ color: 0xcfe9f2, transparent: true, opacity: .28, depthWrite: false, side: T.DoubleSide }),
    frame: toon(0xc9d1d4), mouth: toon(0x5a1f18), blush: toon(0xf3a587)
  };

  /* ---------- geometría ---------- */
  const V2 = (r, y) => new T.Vector2(Math.max(.001, r), y);
  const prof = (pts, n = 56) => new T.SplineCurve(pts.map(p => V2(p[0], p[1]))).getPoints(n);
  const rAt = (P, y) => { for (let i = 1; i < P.length; i++) { const a = P[i - 1], b = P[i]; if ((a.y - y) * (b.y - y) <= 0 && a.y !== b.y) return a.x + (b.x - a.x) * (y - a.y) / (b.y - a.y); } return P[0].x; };
  const M = (g, m, outline) => { const o = new T.Mesh(g, m); if (outline !== false) { const l = new T.Mesh(g, OUT); o.add(l); } return o; };
  const lathe = (P, m, seg = 44, o) => M(new T.LatheGeometry(P, seg), m, o);
  // banda que sigue la superficie de un perfil (cintas, correa, puños) — también en franjas verticales con phi
  const band = (P, y0, y1, off, m, phiS = 0, phiL = Math.PI * 2, seg = 44) => { const pts = []; const n = 10;
    for (let i = 0; i <= n; i++) { const y = y0 + (y1 - y0) * i / n; pts.push(V2(rAt(P, y) + off, y)); }
    return M(new T.LatheGeometry(pts, seg, phiS, phiL), m, false); };
  const sph = (r, m, o) => M(new T.SphereGeometry(r, 32, 22), m, o);
  const cap = (r, l, m, o) => M(new T.CapsuleGeometry(r, l, 8, 16), m, o);
  const cyl = (rt, rb, h, m, o, s = 32) => M(new T.CylinderGeometry(rt, rb, h, s), m, o);
  const box = (w, h, d, m) => new T.Mesh(new T.BoxGeometry(w, h, d), m);
  const tube = (pts, r, m, o = false) => M(new T.TubeGeometry(new T.CatmullRomCurve3(pts.map(p => new T.Vector3(...p))), 24, r, 10, false), m, o);

  function buildHand(side) { // side: +1 izquierda del minero (x>0), −1 derecha
    const hand = new T.Group();
    const palm = sph(.13, K.glove); palm.scale.set(.6, 1.12, 1); palm.position.y = -.1; hand.add(palm);
    const back = sph(.12, K.glove, false); back.scale.set(.5, .9, .9); back.position.set(.02 * side, -.12, 0); hand.add(back);
    const fingers = [];
    [.08, .028, -.024, -.074].forEach((z, i) => {
      const f = new T.Group(); f.position.set(0, -.21, z); hand.add(f);
      const len = [.085, .095, .088, .07][i];
      const a = cap(.037, len, K.glove); a.position.y = -len / 2 - .02; f.add(a);
      const k2 = new T.Group(); k2.position.y = -len - .04; f.add(k2);
      const b = cap(.034, len * .75, K.glove); b.position.y = -len * .4 - .02; k2.add(b);
      fingers.push({ f, k2 });
    });
    const th = new T.Group(); th.position.set(-.035 * side, -.06, .1); hand.add(th);
    const t1 = cap(.04, .08, K.glove); t1.position.y = -.07; th.add(t1);
    const tk = new T.Group(); tk.position.y = -.14; th.add(tk);
    const t2 = cap(.036, .05, K.glove); t2.position.y = -.04; tk.add(t2);
    return { hand, fingers, th, tk };
  }

  function buildMiner() {
    const root = new T.Group(), hips = new T.Group(); root.add(hips);
    /* piernas: pantalón holgado que cae sobre botas de jebe */
    const PL = prof([[.0, -2.12], [.27, -2.1], [.35, -2.0], [.375, -1.84], [.34, -1.62], [.3, -1.4], [.33, -1.12], [.35, -.9], [.33, -.62], [.37, -.3], [.36, 0], [.2, .1], [0, .13]]);
    const PB = prof([[.0, -3.16], [.25, -3.16], [.28, -3.1], [.272, -2.86], [.25, -2.55], [.255, -2.25], [.272, -2.05], [.25, -1.98], [0, -1.97]]);
    const legs = [];
    [-1, 1].forEach(s => {
      const leg = new T.Group(); leg.position.set(.33 * s, 3.16, 0); hips.add(leg);
      leg.add(lathe(PB, K.boot));
      const toe = sph(.24, K.boot); toe.scale.set(1.05, .6, 1.55); toe.position.set(0, -3.0, .17); leg.add(toe);
      const sole = cyl(.27, .27, .07, K.sole, false); sole.scale.z = 1.7; sole.position.set(0, -3.13, .14); leg.add(sole);
      [-.09, .09].forEach(x => leg.add(tube([[x, -2.95, .265], [x * 1.1, -2.5, .262], [x, -2.1, .27]], .007, K.sole)));
      leg.add(lathe(PL, K.suit));
      leg.add(band(PL, -1.98, -1.86, .012, K.refl)); leg.add(band(PL, -1.76, -1.64, .012, K.refl));
      [-1.2, -.6].forEach(y => leg.add(band(PL, y, y + .03, .006, K.suitD))); // pliegues
      const pk = sph(.2, K.suitD); pk.scale.set(.18, 1.1, .9); pk.position.set(rAt(PL, -.55) * s - .01 * s, -.55, 0); leg.add(pk);
      const fl = band(PL, -.36, -.33, .008, K.suitD, s > 0 ? Math.PI * .32 : Math.PI * 1.18, Math.PI * .5, 12); leg.add(fl);
      leg.rotation.y = .1 * s; leg.userData.s = s;
      legs.push(leg);
    });
    /* tronco */
    const torso = new T.Group(); torso.position.y = 3.12; hips.add(torso);
    const body = new T.Group(); body.scale.z = .68; torso.add(body);
    const PT = prof([[.0, -.14], [.34, -.12], [.56, 0], [.64, .2], [.66, .42], [.62, .62], [.64, .84], [.69, 1.06], [.73, 1.3], [.75, 1.52], [.72, 1.71], [.58, 1.88], [.34, 1.98], [.2, 2.03], [0, 2.05]]);
    body.add(lathe(PT, K.suit, 56));
    body.add(band(PT, .54, .76, .022, K.black, 0, Math.PI * 2, 56));                 // correa
    body.add(band(PT, 1.06, 1.36, .014, K.refl, 0, Math.PI * 2, 56));                // cinta del pecho
    [-1, 1].forEach(s => { const a = Math.asin(.31 / .71);
      body.add(band(PT, 1.3, 1.84, .016, K.refl, s * a - .16, .32, 8));              // tirantes adelante
      body.add(band(PT, 1.3, 1.84, .016, K.refl, Math.PI - s * a - .16, .32, 8)); }); // y atrás
    [.32, .98].forEach(y => body.add(band(PT, y, y + .03, .006, K.suitD, 0, Math.PI * 2, 56)));
    const zz = []; for (let y = .78; y <= 1.9; y += .1) zz.push([0, y, rAt(PT, y) * .68 + .006]); torso.add(tube(zz, .009, K.suitD));
    // hebilla
    const bk = new T.Group(); bk.position.set(0, .65, rAt(PT, .65) * .68 + .03); torso.add(bk);
    [[.24, .035, 0, .075], [.24, .035, 0, -.075], [.035, .18, -.105, 0], [.035, .18, .105, 0], [.03, .15, 0, 0]].forEach(([w, h, x, y]) => { const b = box(w, h, .03, K.metal); b.position.set(x, y, 0); bk.add(b); });
    // portanombre y radio
    const zf = (x, y) => Math.sqrt(Math.max(0, rAt(PT, y) ** 2 - x * x)) * .68;
    const tc = document.createElement('canvas'); tc.width = 256; tc.height = 64; const tx = tc.getContext('2d'); tx.fillStyle = '#18191b'; tx.fillRect(0, 0, 256, 64);
    tx.strokeStyle = '#c39531'; tx.lineWidth = 4; tx.strokeRect(4, 4, 248, 56); tx.fillStyle = '#fff'; tx.font = '900 40px Montserrat, Arial, sans-serif'; tx.textAlign = 'center'; tx.textBaseline = 'middle'; tx.fillText('LUCHO', 128, 34);
    const tagTex = new T.CanvasTexture(tc); tagTex.encoding = T.sRGBEncoding; tagTex.anisotropy = 4;
    const tag = new T.Mesh(new T.BoxGeometry(.34, .085, .02), [K.black, K.black, K.black, K.black, new T.MeshBasicMaterial({ map: tagTex }), K.black]);
    tag.position.set(-.32, 1.58, zf(.32, 1.58) + .014); tag.rotation.set(-.08, -.42, .1); torso.add(tag);
    root.userData.redrawTag = () => { tx.fillStyle = '#18191b'; tx.fillRect(0, 0, 256, 64); tx.strokeRect(4, 4, 248, 56); tx.fillStyle = '#fff'; tx.fillText('LUCHO', 128, 34); tagTex.needsUpdate = true; };
    const rd = new T.Group(); rd.position.set(.33, 1.5, zf(.33, 1.5) + .035); rd.rotation.y = .45; torso.add(rd);
    const rb = box(.15, .22, .06, K.radio); rd.add(rb); const sc = box(.1, .075, .01, K.screen); sc.position.set(0, .04, .032); rd.add(sc);
    const ant = cyl(.012, .012, .1, K.black, false, 8); ant.position.set(-.05, .15, 0); rd.add(ant);
    // cuello: polo negro y cuello del mameluco levantado, abierto adelante
    const tn = cyl(.17, .2, .2, K.black); tn.position.y = 2.0; torso.add(tn);
    const col = M(new T.CylinderGeometry(.29, .22, .27, 32, 1, true, .62, Math.PI * 2 - 1.24), toon(0xc8d000, { side: T.DoubleSide }));
    col.position.y = 2.04; col.scale.z = .92; torso.add(col);
    [-1, 1].forEach(s => { const lap = M(new T.SphereGeometry(.2, 20, 12, 0, Math.PI), K.suit); lap.scale.set(.75, 1, .18); lap.position.set(.13 * s, 1.9, zf(.13, 1.9) - .03); lap.rotation.set(-.5, 0, s * .55); torso.add(lap); });
    /* brazos */
    const PU = prof([[.0, -.98], [.17, -.97], [.2, -.86], [.215, -.55], [.235, -.25], [.25, -.02], [0, .06]]);
    const PF = prof([[.0, -.84], [.15, -.82], [.172, -.72], [.2, -.45], [.205, -.2], [.19, 0], [0, .04]]);
    const arms = {};
    [-1, 1].forEach(s => {
      const sh = new T.Group(); sh.position.set(.74 * s, 1.68, 0); torso.add(sh);
      const ball = sph(.255, K.suit); ball.scale.set(1, .95, .85); sh.add(ball);
      sh.add(lathe(PU, K.suit, 32)); sh.add(band(PU, -.66, -.47, .012, K.refl, 0, Math.PI * 2, 32));
      const el = new T.Group(); el.position.y = -.93; sh.add(el);
      el.add(sph(.195, K.suit)); el.add(lathe(PF, K.suit, 32));
      el.add(band(PF, -.4, -.37, .006, K.suitD, 0, Math.PI * 2, 32));
      const cf = lathe(prof([[.0, -.9], [.15, -.89], [.172, -.84], [.178, -.72], [.17, -.66], [0, -.64]]), K.cuff, 28); el.add(cf);
      const wr = new T.Group(); wr.position.y = -.9; el.add(wr);
      const h = buildHand(s); wr.add(h.hand);
      arms[s > 0 ? 'L' : 'R'] = { s, sh, el, wr, ...h };
    });
    /* cabeza */
    const head = new T.Group(); head.position.y = 1.98; torso.add(head);
    const neck = cyl(.15, .17, .4, K.skin); neck.position.y = .14; head.add(neck);
    const face = new T.Group(); face.position.y = .6; face.scale.setScalar(1.14); head.add(face);
    const PH = prof([[.0, -.44], [.13, -.43], [.23, -.36], [.295, -.2], [.32, 0], [.33, .16], [.31, .31], [.24, .43], [.12, .49], [0, .5]]);
    const skull = lathe(PH, K.skin, 48); skull.scale.set(.94, 1, .98); face.add(skull);
    const fz = (x, y) => Math.sqrt(Math.max(0, (rAt(PH, y) * .96) ** 2 - x * x));
    [-1, 1].forEach(s => { const ear = sph(.075, K.skin); ear.scale.set(.45, 1, .75); ear.position.set(.305 * s, .0, -.02); face.add(ear); });
    const hair = band(PH, .16, .47, .014, K.hair, Math.PI * .5, Math.PI, 40); hair.scale.set(.94, 1, .98); face.add(hair);    // nuca y costados
    const hairF = band(PH, .26, .46, .014, K.hair, -Math.PI * .5, Math.PI, 40); hairF.scale.set(.94, 1, .98); face.add(hairF); // flequillo bajo el casco
    [-1, 1].forEach(s => { const sb = box(.05, .17, .12, K.hair); sb.position.set(.29 * s, .1, .03); face.add(sb); });
    // ojos, cejas, nariz, boca
    const eyes = [], brows = [], happy = [];
    [-1, 1].forEach(s => {
      const g = new T.Group(); g.position.set(.115 * s, .06, fz(.115, .06) - .025); face.add(g);
      const w = sph(.058, K.white, false); w.scale.set(1.25, .82, .45); g.add(w);
      const ir = sph(.034, K.iris, false); ir.scale.set(1, 1, .45); ir.position.z = .018; g.add(ir);
      const hl = new T.Mesh(new T.SphereGeometry(.009, 8, 6), K.lamp); hl.position.set(.01, .012, .033); g.add(hl);
      eyes.push(g);
      const bw = new T.Group(); face.add(bw); bw.userData.s = s; brows.push(bw);
      bw.add(tube([[.045 * s, .155, fz(.045, .155) + .004], [.115 * s, .178, fz(.115, .178) + .004], [.185 * s, .158, fz(.185, .158) + .004]], .017, K.brow));
      const hp = tube([[.07 * s, .05, fz(.07, .05) + .004], [.115 * s, .085, fz(.115, .085) + .006], [.16 * s, .05, fz(.16, .05) + .004]], .012, K.iris); hp.visible = false; face.add(hp); happy.push(hp);
      const ck = sph(.045, K.blush, false); ck.scale.set(1.3, .6, .3); ck.position.set(.19 * s, -.1, fz(.19, -.1) - .012); face.add(ck);
    });
    const nose = sph(.05, K.skin); nose.scale.set(.85, 1.05, .9); nose.position.set(0, -.05, fz(0, -.05) + .005); face.add(nose);
    const smile = tube([[-.1, -.17, fz(.1, -.17) - .004], [-.04, -.205, fz(.04, -.205) + .003], [.04, -.205, fz(.04, -.205) + .003], [.1, -.17, fz(.1, -.17) - .004]], .012, K.lip);
    face.add(smile);
    const mouth = sph(.05, K.mouth, false); mouth.scale.set(1.25, .05, .35); mouth.position.set(0, -.215, fz(0, -.215) - .01); face.add(mouth);
    const teeth = sph(.044, K.white, false); teeth.scale.set(1.0, .32, .3); teeth.position.set(0, .45, .25); mouth.add(teeth);
    face.add(tube([[-.045, -.3, fz(.045, -.3) + .002], [0, -.315, fz(0, -.315) + .004], [.045, -.3, fz(.045, -.3) + .002]], .006, toon(0xd89464))); // mentón
    // lentes envolventes transparentes
    const gl = new T.Mesh(new T.CylinderGeometry(.335, .325, .14, 40, 1, true, -1.05, 2.1), K.lens); gl.position.y = .07; gl.scale.z = 1.0; face.add(gl);
    const arc = (y, r, a0, a1) => { const p = []; for (let i = 0; i <= 12; i++) { const a = a0 + (a1 - a0) * i / 12; p.push([Math.sin(a) * r, y, Math.cos(a) * r]); } return p; };
    face.add(tube(arc(.14, .338, -1.05, 1.05), .014, K.frame));
    face.add(tube(arc(.0, .328, -1.05, 1.05), .006, K.frame));
    [-1, 1].forEach(s => face.add(tube([[Math.sin(1.05 * s) * .338, .13, Math.cos(1.05) * .338], [.3 * s, .12, -.05]], .01, K.frame)));
    /* casco */
    const helmet = new T.Group(); helmet.position.y = .3; face.add(helmet);
    const PD = prof([[.475, -.02], [.475, .12], [.44, .3], [.34, .45], [.18, .54], [0, .56]]);
    const dome = lathe(PD, K.helmet, 48); dome.scale.z = 1.1; helmet.add(dome);
    const bandH = band(PD, .03, .17, .008, K.black, 0, Math.PI * 2, 48); bandH.scale.z = 1.1; helmet.add(bandH);
    const brim = M(new T.TorusGeometry(.5, .05, 12, 48), K.helmet); brim.rotation.x = Math.PI / 2; brim.scale.set(1, 1.12, .55); brim.position.y = -.025; helmet.add(brim);
    const rp = []; for (let i = 0; i <= 14; i++) { const y = .17 + (.56 - .17) * Math.sin(Math.PI * i / 14); const z = (i < 7 ? 1 : -1) * Math.sqrt(Math.max(0, rAt(PD, y) ** 2)) * 1.1 * Math.cos(Math.PI * i / 14) * (i < 7 ? 1 : -1); rp.push([0, y + .02, (i <= 7 ? 1 : -1) * Math.abs(rAt(PD, y)) * 1.1 * Math.abs(Math.cos(Math.PI * i / 14))]); }
    helmet.add(tube(rp, .04, K.helmet, true));
    const lampG = new T.Group(); lampG.position.set(0, .11, .475 * 1.1 + .04); helmet.add(lampG);
    const hs = cyl(.125, .13, .1, K.black); hs.rotation.x = Math.PI / 2; lampG.add(hs);
    const ln = new T.Mesh(new T.CircleGeometry(.098, 32), K.lamp); ln.position.z = .052; lampG.add(ln);
    const br = box(.06, .12, .05, K.black); br.position.set(0, .1, -.03); lampG.add(br);
    const beam = new T.Mesh(new T.ConeGeometry(.65, 2.6, 24, 1, true), new T.MeshBasicMaterial({ color: 0xfff1b8, transparent: true, opacity: .08, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide }));
    beam.rotation.x = -Math.PI / 2 - .1; beam.position.set(0, -.05, 1.35); lampG.add(beam);
    Object.assign(root.userData, { hips, torso, head, face, legs, arms, eyes, mouth, smile, beam, brows, happy });
    return root;
  }

  /* ---------- poses y acciones ---------- */
  const REST = { hipX: 0, hipY: 0, torX: 0, torY: 0, torZ: 0, hdX: 0, hdY: 0, hdZ: 0, mouth: 0, brow: 0, happy: 0, wink: 0, hop: 0,
    R_shX: .04, R_shY: 0, R_shZ: .09, R_elX: -.18, R_elZ: 0, R_wrX: 0, R_wrY: 0, R_wrZ: 0, R_curl: .35, R_idx: .35, R_th: .4, R_thUp: 0,
    L_shX: .04, L_shY: 0, L_shZ: .09, L_elX: -.18, L_elZ: 0, L_wrX: 0, L_wrY: 0, L_wrZ: 0, L_curl: .35, L_idx: .35, L_th: .4, L_thUp: 0 };
  const sn = Math.sin, up = x => Math.max(0, x);
  const ACT = {
    idle: t => ({ hdY: sn(t * .9) * .08, brow: .1 }),
    wave: t => ({ R_shZ: 1.12, R_shX: -.3, R_elZ: 1.95 + sn(t * 9) * .42, R_elX: -.1, R_wrY: 1.35, R_wrZ: sn(t * 9 - .6) * .18, R_curl: 0, R_idx: 0, R_th: 1,
      L_shZ: .16, hdZ: .1 + sn(t * 4.5) * .03, hdY: -.15, torZ: .05, torY: -.06, hop: up(sn(t * 4.5)) * .05, brow: .6, mouth: t < 1.6 ? .45 + .35 * sn(t * 14) : .25 }),
    point: t => ({ R_shZ: .62, R_shX: -.42, R_elZ: 2.15 + sn(t * 3.2) * .12, R_elX: -.2, R_wrY: 1.25, R_wrX: -.15 + sn(t * 3.2) * .1, R_curl: 1, R_idx: 0, R_th: .15,
      L_shZ: .2, L_shX: -.25, L_elX: -.9 + sn(t * 2.4) * .15, L_elZ: -.2, L_wrY: -.6, L_curl: .2, L_idx: .2,
      hdY: -.12 + sn(t * 1.4) * .08, hdX: -.03 + sn(t * 3.2) * .03, torY: -.06 + sn(t * 1.4) * .03, brow: .35 + up(sn(t * 2.6)) * .5, mouth: .45 + .45 * sn(t * 13) * sn(t * 3.1) }),
    thumbs: t => ({ R_shX: -.95, R_shZ: .22, R_elX: -1.15 + sn(t * 5) * .05, R_curl: 1, R_idx: 1, R_th: 1, R_thUp: 1, hdZ: -.1, hdX: .02, torY: -.08, wink: t > .5 && t < 1.6 ? 1 : 0, brow: .3, mouth: .15 }),
    celebrate: t => ({ R_shZ: 2.55, L_shZ: 2.55, R_shX: -.15, L_shX: -.15, R_elZ: .35 + sn(t * 7) * .25, L_elZ: .35 - sn(t * 7) * .25, R_curl: 1, L_curl: 1, R_idx: 1, L_idx: 1, R_th: .2, L_th: .2,
      hop: up(sn(t * 7)) * .32, happy: 1, mouth: .8, hdX: -.12, brow: .8 }),
    laugh: t => ({ happy: 1, mouth: .55 + .3 * sn(t * 19), hdX: -.14 + sn(t * 19) * .03, torX: -.05, torZ: sn(t * 17) * .025, hop: up(sn(t * 19)) * .03,
      L_shX: -.35, L_elX: -1.1, L_elZ: -.5, L_curl: .5, L_idx: .5, R_shZ: .2, brow: .7 }),
    lookout: t => ({ L_shZ: 2.3, L_shX: -.35, L_elZ: 2.3, L_elX: -.2, L_wrY: 1.4, L_wrZ: -.2, L_curl: 0, L_idx: 0, L_th: .8, hdY: .15 + sn(t * 1.3) * .5, hdX: -.05, torY: sn(t * 1.3) * .12, brow: -.4 }),
    radio: t => ({ L_shX: -.58, L_shZ: -.12, L_elX: -1.95, L_elZ: -.25, L_wrX: .2, L_wrY: -.4, L_curl: .55, L_idx: .55, hdX: .32, hdY: .32, hdZ: .05, brow: -.2, mouth: t > .9 ? .4 + .4 * sn(t * 12) : 0 }),
    nod: t => ({ hdX: up(sn(t * 6.5)) * .22, torX: .02, R_shX: -.3, R_elX: -1.4, R_elZ: -.6, L_shX: -.3, L_elX: -1.4, L_elZ: -.6, R_curl: .6, L_curl: .6, R_idx: .6, L_idx: .6, brow: .4, mouth: .1 }),
    salute: t => ({ R_shZ: 2.35, R_shX: -.3, R_elZ: 2.3, R_elX: -.1, R_wrY: 1.4, R_curl: 0, R_idx: 0, R_th: .9, hdZ: -.06, hdX: -.04, torX: -.02, brow: .5, mouth: .15 })
  };
  // [acción, segundos, frase]
  const PLAN = [['wave', 3.4, '¡Hola, equipo! Soy Lucho 👋'], ['idle', 1.2], ['point', 4.4, 'Hoy aprendemos juntos: ¡atentos al reglamento! ☝️'], ['idle', 1.1],
    ['thumbs', 2.8, '¡La seguridad empieza por ti! 👍'], ['idle', 1], ['lookout', 3.4, 'Antes de empezar, identifica los peligros 👀'],
    ['radio', 3.4, 'Reporta todo acto y condición subestándar 📻'], ['idle', 1], ['celebrate', 2.8, '¡Vamos por cero accidentes! 🎉'], ['idle', 1.1],
    ['salute', 2.8, 'Casco, lentes y EPP siempre puestos ⛑️'], ['laugh', 2.4, '¡Trabajar seguro es trabajar feliz! 😄'], ['nod', 2.6, 'Cuídate tú y cuida a tu compañero 🤝'], ['idle', 1.6]];

  function shadowDisc() {
    const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d');
    const g = x.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, 'rgba(60,50,20,.42)'); g.addColorStop(1, 'rgba(60,50,20,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128);
    const m = new T.Mesh(new T.PlaneGeometry(3.4, 2.2), new T.MeshBasicMaterial({ map: new T.CanvasTexture(c), transparent: true, depthWrite: false }));
    m.rotation.x = -Math.PI / 2; m.position.y = .01; return m;
  }

  function mount(el) {
    if (el._miner) return el._miner;
    const fb = document.createElement('div'); fb.className = 'fallback'; if (el.dataset.fallback) fb.style.backgroundImage = `url(${el.dataset.fallback})`; el.appendChild(fb);
    let renderer;
    try { renderer = new T.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true }); } catch (e) { el.classList.add('nogl'); return null; }
    renderer.outputEncoding = T.sRGBEncoding; renderer.toneMapping = T.NoToneMapping;
    el.appendChild(renderer.domElement);
    const scene = new T.Scene(), cam = new T.PerspectiveCamera(24, 1, .1, 100);
    scene.add(new T.AmbientLight(0xffffff, .5));
    const key = new T.DirectionalLight(0xffffff, .64); key.position.set(-6, 5, 4.5); scene.add(key);
    const rim = new T.DirectionalLight(0xfff1cf, .22); rim.position.set(6, 4, -5); scene.add(rim);
    const miner = buildMiner(); scene.add(miner); scene.add(shadowDisc());
    const U = miner.userData; U.beam.visible = !!el.closest('.dark');
    const face0 = parseFloat(el.dataset.face || 0); miner.rotation.y = face0;
    let W = 0, H = 0;
    function size() {
      const w = el.clientWidth, h = el.clientHeight; if (!w || !h || (w === W && h === H)) return; W = w; H = h;
      renderer.setPixelRatio(Math.min(2.2, (window.devicePixelRatio || 1) * ((window.DECK && DECK.scale) || 1) * 1.2 + .4));
      renderer.setSize(w, h, false); cam.aspect = w / h;
      const zoom = parseFloat(el.dataset.zoom || 1); const ly = parseFloat(el.dataset.look || 3.35); cam.position.set(0, ly + .55, 19.5 / zoom); cam.lookAt(0, ly, 0); cam.updateProjectionMatrix();
    }
    // estado de la animación
    const P = Object.assign({}, REST); let step = 0, at = 0, forced = null;
    let drag = null, look = { x: 0, y: 0 };
    const cv = renderer.domElement;
    cv.addEventListener('pointerdown', e => { drag = { x: e.clientX, r: miner.rotation.y, t: performance.now() }; cv.setPointerCapture(e.pointerId); e.stopPropagation(); });
    cv.addEventListener('pointermove', e => { if (drag) miner.rotation.y = drag.r + (e.clientX - drag.x) * .012; });
    cv.addEventListener('pointerup', e => { if (drag && performance.now() - drag.t < 220 && Math.abs(e.clientX - drag.x) < 6) { forced = 'wave'; at = 0; say('¡Hola! Soy Lucho 👋'); } drag = null; e.stopPropagation(); });
    cv.addEventListener('click', e => e.stopPropagation());
    addEventListener('mousemove', e => { const r = el.getBoundingClientRect(); look.x = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / (innerWidth / 2))); look.y = Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height * .25)) / (innerHeight / 2))); });
    const sayB = document.createElement('div'); sayB.className = 'mn-say'; sayB.innerHTML = '<span></span>'; el.appendChild(sayB); const sayT = sayB.firstChild;
    const nm = document.createElement('div'); nm.className = 'mn-name'; nm.innerHTML = '<b>LUCHO</b><small>Tu compañero de seguridad</small>'; el.appendChild(nm);
    const frases = (el.dataset.frases || '').split('|').map(x => x.trim()).filter(Boolean); let fi = 0, typing = null;
    const say = txt => { if (!txt) { sayB.classList.remove('on'); return; } if (frases.length) txt = frases[fi++ % frases.length]; typing = { s: txt, n: 0 }; sayT.textContent = ''; sayB.classList.remove('on'); void sayB.offsetWidth; sayB.classList.add('on'); };
    const clock = new T.Clock(); let blinkT = 2.4;
    const ap = (a, side) => { const s = a.s, g = k => P[side + '_' + k];
      a.sh.rotation.set(g('shX'), g('shY') * s, g('shZ') * s);
      a.el.rotation.set(g('elX'), 0, g('elZ') * s);
      a.wr.rotation.set(g('wrX'), g('wrY') * s, g('wrZ') * s);
      const c = g('curl'), ix = g('idx');
      a.fingers.forEach((f, i) => { const v = i === 0 ? ix : c; f.f.rotation.z = -s * v * 1.45; f.k2.rotation.z = -s * v * 1.6; });
      const th = g('th'); a.th.rotation.set(-.55 + th * .1 - g('thUp') * 1.05, 0, -s * (1 - th) * 1.1 + s * th * .25); a.tk.rotation.z = -s * (1 - th) * .9; };
    function frame() {
      const dt = Math.min(.05, clock.getDelta()), t = clock.elapsedTime; size();
      at += dt; let name = forced || PLAN[step][0]; const dur = forced ? 3 : PLAN[step][1];
      if (at > dur) { at = 0; if (forced) forced = null; else step = (step + 1) % PLAN.length; name = forced || PLAN[step][0]; say(forced ? null : PLAN[step][2]); }
      if (typing) { typing.n += dt * 34; const n = Math.floor(typing.n); sayT.textContent = typing.s.slice(0, n); if (n >= typing.s.length) typing = null; }
      const talk = typing ? .35 + .35 * Math.sin(t * 15) : 0;
      const target = Object.assign({}, REST, ACT[name](at));
      const k = 1 - Math.exp(-dt * 5.5); for (const key in target) P[key] += (target[key] - P[key]) * k;
      const { hips, torso, head, legs, arms, eyes, mouth, smile, brows, happy } = U;
      // respiración y cambio de peso
      hips.position.y = Math.sin(t * 2.1) * .018 + P.hop; hips.position.x = Math.sin(t * .7) * .025; hips.rotation.z = Math.sin(t * .7) * .012;
      torso.rotation.set(P.torX + Math.sin(t * 2.1) * .008, P.torY, P.torZ - Math.sin(t * .7) * .015);
      head.rotation.set(P.hdX + look.y * .12, P.hdY + look.x * .3, P.hdZ);
      legs.forEach(l => l.rotation.z = .035 * l.userData.s - Math.sin(t * .7) * .012);
      ap(arms.R, 'R'); ap(arms.L, 'L');
      if (!drag) miner.rotation.y += (face0 + look.x * .12 - miner.rotation.y) * .02;
      blinkT -= dt; const bl = blinkT < 0 ? (blinkT < -.13 ? (blinkT = 2.2 + Math.random() * 3, 1) : .12) : 1; const hy = P.happy > .5; eyes.forEach((e, i) => { e.visible = !hy; e.scale.y = i === 1 ? Math.min(bl, 1 - P.wink * .9) : bl; }); happy.forEach(h => h.visible = hy);
      brows.forEach((b, i) => { b.position.y = P.brow * .03 + (i === 1 ? P.wink * -.02 : 0); b.rotation.z = -b.userData.s * P.brow * .06; });
      const mo = Math.max(0, P.mouth, talk); mouth.scale.y = .05 + mo * .6; smile.scale.y = 1 - mo * .3; smile.scale.x = 1 + P.happy * .15;
      U.beam.material.opacity = .07 + Math.sin(t * 3) * .015;
      renderer.render(scene, cam);
    }
    let running = false, raf = 0;
    const loop = () => { if (!running) return; frame(); raf = requestAnimationFrame(loop); };
    const visible = () => { const sl = el.closest('.slide'); return !document.hidden && (!sl || sl.classList.contains('active')); };
    const tick = () => { const v = visible(); if (v && !running) { running = true; clock.getDelta(); step = 0; at = 0; say(PLAN[0][2]); loop(); } else if (!v && running) { running = false; cancelAnimationFrame(raf); } };
    setInterval(tick, 300); document.addEventListener('visibilitychange', tick); tick(); frame();
    el._miner = { wave() { forced = 'wave'; at = 0; }, renderer, snap() { W = 0; size(); frame(); return renderer.domElement.toDataURL('image/png'); }, act(n) { if (typeof n === 'object') { const o = n; ACT._c = () => o; n = '_c'; } forced = n; at = 0; const e = PLAN.find(x => x[0] === n); if (e && e[2]) say(e[2]); }, say };
    return el._miner;
  }
  window.MinerRef = { mount };
  const init = () => document.querySelectorAll('[data-miner][data-model="ref"]').forEach(mount);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
