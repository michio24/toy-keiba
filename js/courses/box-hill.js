// 妖精の丘クロスカントリー
'use strict';

/* ---- 妖精の丘：英国サリー州のボックス・ヒル（ナショナル・トラストの散策路）を下敷きにした沿道 ---- */
// 見立て：頂上の展望台から見て南（+x）にウィールドの平野とサウス・ダウンズ、西の谷（第6区間）にモール川。
// 区間の役割：1 ジグザグ・ロードの上り／2 頂上（サロモンズ記念碑）／3 イチイの森の下り（275段・ブロードウッドの塔）／
// 4 砦とぶどう畑の丘／5 妖精の森の小径／6 モール川の谷（飛び石・ホワイツ）／0 バーフォードの牧草地のホーム直線
function decorBoxHill(th) {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const { shuffle, roadDist, occupied, clearAt, groundAt, onGround, local, at, scatter, label, site, PRISM, CYL, CYL_T, addInst, herd, pathRibbon } = sceneryKit();
  // 案内板はナショナル・トラストの散策路の道標に似せた深緑と生成り
  const signAt = (g, text, y, w = 14) => { const sp = label(text, w, w / 4, '#2f5640', '#f6efd2'); sp.position.set(0, y, 0); sp.scale.set(w, w / 4, 1); g.add(sp); return sp; };
  const wood = toon('#7a5b3e'), darkWood = toon('#4f3b2a'), chalkMat = toon('#f1ecdc'), flint = toon('#8e8a82'), brick = toon('#a5583f');
  const ntGreen = toon('#3f6447'), cream = toon('#f3ead2'), slate = toon('#4c5551'), glass = toon('#5a7d8a');
  const updates = [];

  /* ---- 遠景：ウィールドの畑、サウス・ダウンズの稜線、ドーキングの尖塔、リース・ヒルの塔、熱気球 ---- */
  {
    // 円錐の山の代わりに、低くなだらかな丘（サリーの丘陵は尖らない）
    const hills = [];
    for (let i = 0; i < 18; i++) {
      const a = -1.2 + i / 18 * 4.4, r = rand(760, 980);
      hills.push({ p: new V3(Math.cos(a) * r - 120, -30, Math.sin(a) * r), s: new V3(rand(160, 260), rand(55, 90), rand(160, 260)), c: C(['#7f9c70', '#89a676', '#7a9568'][i % 3]) });
    }
    // サウス・ダウンズ：南（+x）の遠くに長く連なる白亜の稜線
    for (let i = 0; i < 9; i++) hills.push({ p: new V3(1250 + rand(-40, 40), -40, -1000 + i * 250), s: new V3(160, rand(75, 105), 230), c: C('#9cb385') });
    const hillMesh = inst(SPH_LO, toon('#ffffff'), hills, false); hillMesh.userData.backdrop = true;
    // ウィールド：生け垣で区切られたパッチワークの畑（菜の花の黄色を混ぜる）
    const fields = ctex(1024, 1024, c => {
      c.fillStyle = '#7fae62'; c.fillRect(0, 0, 1024, 1024);
      for (let y = 0; y < 1024; y += 64) for (let x = 0; x < 1024; x += 64) {
        const w = 64 * (1 + (Math.random() * 2 | 0)), h = 64 * (1 + (Math.random() * 2 | 0));
        c.fillStyle = ['#8dbb68', '#a6c86f', '#6f9f55', '#e8d65a', '#c5b878', '#9ac27a', '#7fae62'][(Math.random() * 7) | 0];
        c.fillRect(x + 3, y + 3, w - 6, h - 6);
      }
      c.strokeStyle = '#41673a'; c.lineWidth = 5;
      for (let y = 0; y <= 1024; y += 64) { c.beginPath(); c.moveTo(0, y + rand(-4, 4)); c.lineTo(1024, y + rand(-4, 4)); c.stroke(); }
      for (let x = 0; x <= 1024; x += 64) { c.beginPath(); c.moveTo(x + rand(-4, 4), 0); c.lineTo(x + rand(-4, 4), 1024); c.stroke(); }
    });
    const weald = new THREE.Mesh(new THREE.PlaneGeometry(800, 1800), toon('#ffffff', { map: fields, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2 }));
    weald.rotation.x = -Math.PI / 2; weald.position.set(450 + 400, Math.min(-0.2, ...track.ys) - 0.75, 0); weald.receiveShadow = true; world.add(weald);
    const hedgeTrees = [];
    for (let i = 0; i < 90; i++) hedgeTrees.push({ p: new V3(rand(470, 1150), -1, rand(-850, 850)), s: new V3(rand(5, 8), rand(6, 9), rand(5, 8)), c: C(['#3f6a3a', '#4c7a42', '#5a8648'][i % 3]) });
    fantasyInst(SPH_LO, toon('#ffffff'), shuffle(hedgeTrees), false);
    // ドーキングの町：赤い瓦の家並みと、聖マーティン教会の高い尖塔（ボックス・ヒルからよく見える）
    const town = new V3(620, -1, 430), houses = [], roofs = [];
    for (let i = 0; i < 46; i++) {
      const p = town.clone().add(new V3(rand(-90, 90), 0, rand(-70, 70))); if (p.distanceTo(town) < 16) continue;
      const w = rand(6, 10), h = rand(5, 8), yaw = rand(0, Math.PI);
      houses.push({ p: new V3(p.x, p.y + h / 2, p.z), s: new V3(w, h, 6), r: [0, yaw, 0], c: C(['#efe6d4', '#d9c2a2', '#c98f6d'][i % 3]) });
      roofs.push({ p: new V3(p.x, p.y + h, p.z), s: new V3(w + 1, 3.2, 7), r: [0, yaw, 0], c: C(['#a24e3a', '#8f4a3b', '#5a5f60'][i % 3]) });
    }
    inst(BOX, toon('#ffffff'), houses, false); inst(PRISM, toon('#ffffff'), roofs, false);
    const church = fantasyGroup(town);
    addBox(church, [24, 12, 11], [0, 6, 0], toon('#cfc6b4')); part(church, PRISM, slate, [0, 12, 0], [25, 6, 12], null, 0);
    addBox(church, [9, 26, 9], [12, 13, 0], toon('#cfc6b4'));
    part(church, new THREE.ConeGeometry(1, 1, 8), slate, [12, 26 + 22, 0], [5.5, 44, 5.5], null, 0);
    // リース・ヒルの塔：南西の稜線に立つ胸壁つきの塔
    const leith = new V3(980, 0, 760);
    const lh = inst(SPH_LO, toon('#6f8c62'), [{ p: new V3(leith.x, -40, leith.z), s: new V3(240, 110, 200) }], false); lh.userData.backdrop = true;
    const tower = fantasyGroup(new V3(leith.x, 62, leith.z)); tower.userData.backdrop = true;
    addBox(tower, [12, 40, 12], [0, 20, 0], toon('#9a8f80')); addBox(tower, [5, 46, 5], [7, 23, 7], toon('#9a8f80'));
    for (let j = 0; j < 4; j++) for (const s of [-1, 1]) addBox(tower, [2.4, 3, 2.4], [j % 2 ? s * 5 : (j - 1.5) * 3.6, 41.5, j % 2 ? (j - 1.5) * 3.6 : s * 5], toon('#9a8f80'));
    // 熱気球：ウィールドの上空をゆっくり流れる
    const balloons = [];
    [['#e9555f', '#ffd166'], ['#4f8fd6', '#f3f0e6'], ['#7cc576', '#f7a14a']].forEach(([a, b], i) => {
      const g = fantasyGroup(), stripes = ctex(256, 128, c => { for (let x = 0; x < 256; x += 32) { c.fillStyle = (x / 32) % 2 ? a : b; c.fillRect(x, 0, 32, 128); } });
      part(g, new THREE.SphereGeometry(1, 16, 12), toon('#ffffff', { map: stripes }), [0, 0, 0], [9, 11, 9], null, 0);
      part(g, new THREE.ConeGeometry(1, 1, 16), toon(a), [0, -10.5, 0], [6, 6, 6], [Math.PI, 0, 0], 0);
      addBox(g, [2.2, 1.8, 2.2], [0, -16.5, 0], darkWood);
      balloons.push({ g, x: 380 + i * 170, y: 95 + i * 22, z: -300 + i * 260, k: i });
      if (i) themeDetails.push(g);
    });
    balloons.forEach(b => { b.g.userData.droneIgnore = true; });
    updates.push(t => balloons.forEach(b => {
      const m = reduced.matches ? 0 : t;
      b.g.position.set(b.x + Math.sin(m * 0.012 + b.k) * 120, b.y + Math.sin(m * 0.2 + b.k * 2) * 4, b.z + Math.cos(m * 0.009 + b.k) * 90);
    }));
  }

  /* ---- 頂上（第2区間）：サロモンズ記念碑の展望台、案内所とカフェ、ラベリエール少佐の墓、ピクニック ---- */
  const summitS = at(2, 0.7);
  {
    // 1920年、丘を寄贈したレオポルド・サロモンズを記念する展望台。半円の石の台と、遠くの地名を示す方位盤
    const g = site('サロモンズ記念碑', summitS, W / 2 + 15, 18, 13, '#94c46e');
    const stone = toon('#ddd5bf');
    part(g, new THREE.CylinderGeometry(8, 8, 0.8, 28, 1, false, -Math.PI / 2, Math.PI), stone, [0, 0.4, -2.5], null, null, 0);
    for (let i = 0; i <= 12; i++) {
      const a = -Math.PI / 2 + i / 12 * Math.PI;
      addBox(g, [2.2, 1.1, 0.7], [Math.sin(a) * 7.6, 1.35, -2.5 + Math.cos(a) * 7.6], stone, [0, a, 0]);
    }
    addBox(g, [1.8, 1.4, 1.8], [0, 1.5, -1.5], stone, null, 0.04);
    const dial = ctex(256, 256, c => {
      c.fillStyle = '#b48a4a'; c.fillRect(0, 0, 256, 256); c.strokeStyle = '#5e4221'; c.lineWidth = 5; c.beginPath(); c.arc(128, 128, 118, 0, Math.PI * 2); c.stroke();
      c.fillStyle = '#4a3218'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = 'bold 30px sans-serif';
      [['S', 0], ['W', 1], ['N', 2], ['E', 3]].forEach(([t, k]) => { const a = k * Math.PI / 2; c.fillText(t, 128 + Math.sin(a) * 96, 128 + Math.cos(a) * 96); });
      for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2; c.beginPath(); c.moveTo(128, 128); c.lineTo(128 + Math.sin(a) * (i % 4 ? 50 : 80), 128 + Math.cos(a) * (i % 4 ? 50 : 80)); c.stroke(); }
    });
    part(g, new THREE.CylinderGeometry(1.1, 1.1, 0.2, 24), [toon('#8b6a3a'), toon('#ffffff', { map: dial }), toon('#8b6a3a')], [0, 2.3, -1.5], null, null, 0);
    addBox(g, [2.6, 1.6, 0.4], [0, 1.6, -7.2], stone);
    const plaque = signPanel(2.2, 1.1, ctex(256, 128, c => {
      c.fillStyle = '#7e5f34'; c.fillRect(0, 0, 256, 128); c.fillStyle = '#f2dfb4'; c.textAlign = 'center'; c.font = 'bold 26px serif';
      c.fillText('LEOPOLD SALOMONS', 128, 52, 240); c.font = '22px serif'; c.fillText('1920', 128, 92);
    }));
    plaque.position.set(0, 1.7, -7.42); g.add(plaque);
    for (const x of [-5, 5]) { addBox(g, [3.2, 0.25, 0.8], [x, 1.3, 2.2], wood); for (const dx of [-1.3, 1.3]) addBox(g, [0.2, 0.9, 0.7], [x + dx, 0.6, 2.2], darkWood); }
    // 展望台で景色を眺める人たち
    const visitors = [];
    for (let i = 0; i < 9; i++) { const a = -1.2 + i * 0.3; visitors.push({ p: g.localToWorld(new V3(Math.sin(a) * 6.2, 1.55, -2.5 + Math.cos(a) * 6.2)), s: new V3(1, 1, 1), c: C(['#d9574a', '#3d6fa6', '#f0c24d', '#6e9a5b', '#f3f0e8'][i % 5]) }); }
    inst(new THREE.CapsuleGeometry(0.3, 0.9, 3, 8), toon('#ffffff'), visitors, false);
    signAt(g, 'サロモンズ記念碑（展望台）', 9, 17);
  }
  {
    // 案内所とカフェ：焦げ茶の板張りに深緑の屋根、外にはピクニックテーブル
    const g = site('ボックス・ヒルの案内所とカフェ', at(2, 0.4), W / 2 + 18, 18, 11, '#94c46e');
    addBox(g, [12, 4.2, 7], [-2, 2.1, 0.5], toon('#5e4532'), null, 0.03);
    part(g, PRISM, ntGreen, [-2, 4.2, 0.5], [13.2, 2.8, 8.4], null, 0.03);
    const win = [];
    for (let i = 0; i < 4; i++) win.push({ p: g.localToWorld(new V3(-6.5 + i * 3, 2.3, -3.06)), s: new V3(1.8, 1.4, 0.1), r: [0, g.rotation.y, 0] });
    inst(BOX, glass, win, false);
    addBox(g, [1.4, 2.6, 0.12], [3, 1.3, -3.06], cream);
    for (const x of [6, 8.2]) {
      addBox(g, [1.8, 0.15, 1.1], [x, 1, -2.5], wood); addBox(g, [1.8, 0.12, 0.35], [x, 0.55, -3.4], wood); addBox(g, [1.8, 0.12, 0.35], [x, 0.55, -1.6], wood);
      part(g, CYL, cream, [x, 2.6, -2.5], [0.05, 3.2, 0.05], null, 0); part(g, new THREE.ConeGeometry(1, 1, 8), toon(x > 7 ? '#2f5640' : '#d9c58e'), [x, 3.9, -2.5], [1.6, 0.7, 1.6], null, 0);
    }
    signAt(g, '案内所・カフェ', 8.5, 12);
  }
  {
    // ラベリエール少佐（1800年没）：遺言で頭を下にして丘に葬られた。墓石だけがぽつんと残る
    const g = site('ラベリエール少佐の墓', at(2, 0.18), W / 2 + 12, 4, 4, '#a9b98a');
    addBox(g, [1.2, 1.5, 0.35], [0, 0.75, 0], toon('#b9b4a6'), null, 0.05);
    part(g, CYL, toon('#b9b4a6'), [0, 1.5, 0], [0.6, 0.35, 0.6], [Math.PI / 2, 0, 0], 0);
    const flowers = []; for (let i = 0; i < 8; i++) flowers.push({ p: g.localToWorld(new V3(rand(-1.5, 1.5), 0.25, rand(0.6, 1.6))), s: new V3(0.3, 0.3, 0.3), c: C(i % 2 ? '#f4d24e' : '#ffffff') });
    inst(SPH_LO, toon('#ffffff'), flowers, false);
    signAt(g, 'ラベリエール少佐の墓（逆さまに眠る）', 5.5, 18);
  }
  {
    // ピクニック：小説『エマ』の舞台にもなった丘の上の定番。赤白チェックの敷物とバスケット
    const check = toon('#ffffff', { map: ctex(64, 64, c => { for (let y = 0; y < 64; y += 16) for (let x = 0; x < 64; x += 16) { c.fillStyle = (x + y) / 16 % 2 ? '#d94a48' : '#f8f1e3'; c.fillRect(x, y, 16, 16); } }) });
    const rugs = [], baskets = [];
    for (const p of scatter(8, at(2, 0.45), at(2, 0.95), W / 2 + 22, W / 2 + 46, W / 2 + 18, 3)) {
      const yaw = rand(0, Math.PI); rugs.push({ p: p.clone().add(new V3(0, 0.08, 0)), s: new V3(3, 0.08, 2.2), r: [0, yaw, 0] });
      baskets.push({ p: p.clone().add(new V3(0.8, 0.45, 0.4)), s: new V3(0.8, 0.6, 0.55), r: [0, yaw, 0] });
    }
    if (rugs.length) { inst(BOX, check, rugs, false); inst(BOX, toon('#b5864d'), baskets); }
  }

  /* ---- 第1区間：ジグザグ・ロード（2012年ロンドン五輪の自転車ロードレースが周回した九十九折り） ---- */
  {
    const s = at(1, 0.55), lanes = [[-42, 23], [30, 28], [37, 34], [-30, 40], [-38, 46], [28, 52], [36, 58], [-26, 64], [-34, 70], [30, 76], [62, 84]];
    const ctrl = lanes.map(([u, v]) => local(s, u, W / 2 + v));
    const curve = new THREE.CatmullRomCurve3(ctrl, false, 'centripetal');
    const pts = curve.getSpacedPoints(260);
    const road = pathRibbon(pts, 5, 0.18, toon('#6b6f73', { side: THREE.DoubleSide }), W / 2 + 6);
    registerLandmark(road, 'ジグザグ・ロード');
    const dashes = [];
    for (let i = 2; i < pts.length - 2; i += 3) {
      const p = pts[i], q = pts[i + 1];
      if (roadDist(p.x, p.z) < W / 2 + 8) continue;
      dashes.push({ p: onGround(p.clone(), 0.22), s: new V3(1.2, 0.04, 0.18), r: [0, -Math.atan2(q.z - p.z, q.x - p.x), 0] });
    }
    addInst(BOX, toon('#f2f0e6'), shuffle(dashes), false);
    for (let i = 0; i < pts.length; i += 8) occupied.push({ x: pts[i].x, z: pts[i].z, r: 5 });
    const g = fantasyGroup(onGround(local(s, -6, W / 2 + 44))); registerLandmark(g, 'ジグザグ・ロードの標識'); signAt(g, 'ジグザグ・ロード', 10, 13);
    // 坂を上る自転車：ジャージの色違い3台
    const riders = ['#e8443a', '#2f6fd1', '#f2c230'].map((col, i) => {
      const r = fantasyGroup(), tire = new THREE.TorusGeometry(0.42, 0.07, 6, 16), dark = toon('#22252a');
      for (const x of [-0.65, 0.65]) part(r, tire, dark, [x, 0.5, 0], null, null, 0);
      addBox(r, [1.3, 0.1, 0.1], [0, 0.85, 0], toon('#c9ccd0'), [0, 0, 0.35]);
      part(r, new THREE.CapsuleGeometry(0.22, 0.6, 3, 8), toon(col), [0, 1.35, 0], null, [0, 0, -0.9], 0);
      part(r, SPH_LO, toon('#f5f5f5'), [0.45, 1.65, 0], [0.22, 0.2, 0.22], null, 0);
      r.scale.setScalar(1.6); if (i) themeDetails.push(r);
      return { r, k: i / 3 };
    });
    const tmp = new V3();
    riders.forEach(o => { o.r.userData.droneIgnore = true; });
    updates.push(t => riders.forEach(({ r, k }) => {
      const u = reduced.matches ? 0.3 + k * 0.25 : mod(t * 0.006 + k, 1);
      curve.getPointAt(u, r.position); onGround(r.position, 0.18); curve.getTangentAt(u, tmp);
      r.rotation.y = -Math.atan2(tmp.z, tmp.x);
    }));
  }

  /* ---- 第3区間：イチイの森を下る275段の階段と、ブロードウッドの塔 ---- */
  {
    const s0 = at(3, 0.08), s1 = at(3, 0.92), stepV = W / 2 + 11, steps = [], posts = [];
    for (let i = 0; i < 275; i++) {
      const f = tp(lerp(s0, s1, i / 274), W / 2 + stepV), p = onGround(f.v.clone(), 0.12);
      steps.push({ p, s: new V3(0.5, 0.28, 2.3), r: [0, -f.h, 0] });
      if (i % 11 === 0) for (const dv of [-1.4, 1.4]) { const q = onGround(local(lerp(s0, s1, i / 274), 0, stepV + dv), 0.6); posts.push({ p: q, s: new V3(0.14, 1.2, 0.14) }); }
    }
    const stepMesh = inst(BOX, toon('#a98c66'), steps, false); registerLandmark(stepMesh, 'イチイの森の275段');
    inst(BOX, darkWood, posts, false);
    const g = fantasyGroup(onGround(local(s0 + 6, 0, stepV + 4))); registerLandmark(g, '275段の道標');
    addBox(g, [0.3, 3.4, 0.3], [0, 1.7, 0], wood); addBox(g, [2.2, 0.45, 0.12], [0.9, 3, 0], cream, [0, 0, -0.08]); signAt(g, 'イチイの森の275段', 6.5, 13);
  }
  {
    // ブロードウッドの塔：19世紀の地主が建てた火打石積みの小さな塔。森の中に崩れかけた姿で残る
    const g = site('ブロードウッドの塔', at(3, 0.55), W / 2 + 32, 8, 8, '#8f8c79');
    part(g, new THREE.CylinderGeometry(2.6, 2.9, 11, 14), flint, [0, 5.5, 0], null, null, 0.04);
    for (let j = 0; j < 10; j++) { if (j === 3) continue; const a = j / 10 * Math.PI * 2; addBox(g, [1.1, 1.3, 0.8], [Math.sin(a) * 2.5, 11.6, Math.cos(a) * 2.5], flint, [0, a, 0]); }
    addBox(g, [1.3, 2.4, 0.3], [0, 1.2, -2.8], darkWood); part(g, CYL, darkWood, [0, 2.4, -2.8], [0.65, 0.3, 0.65], [Math.PI / 2, 0, 0], 0);
    for (const y of [5, 8]) addBox(g, [0.5, 1, 0.3], [0, y, -2.75], toon('#2b2a28'));
    const ivy = []; for (let i = 0; i < 10; i++) { const a = rand(-0.8, 2.4), y = rand(1, 8); ivy.push({ p: g.localToWorld(new V3(Math.sin(a) * 2.8, y, Math.cos(a) * 2.8)), s: new V3(1.2, 1.4, 0.8), c: C(i % 2 ? '#3f6d3a' : '#557f45') }); }
    inst(SPH_LO, toon('#ffffff'), ivy, false);
    signAt(g, 'ブロードウッドの塔', 15, 13);
  }

  /* ---- 第4区間：ボックス・ヒル砦（19世紀末のロンドン防衛の拠点）と、斜面のぶどう畑 ---- */
  {
    const g = site('ボックス・ヒル砦', at(4, 0.72), -(W / 2 + 30), 20, 14, '#8da06d');
    // 土塁で覆われた弾薬庫：草の盛り土の正面に、れんがの壁と鉄の扉
    part(g, SPH_LO, toon('#7fa25f'), [0, 0, 2], [10, 5.5, 7], null, 0);
    addBox(g, [12, 3.6, 1.2], [0, 1.8, -4.4], brick, null, 0.03);
    for (const x of [-2.6, 2.6]) { addBox(g, [1.8, 2.4, 0.2], [x, 1.2, -5.1], toon('#3b4146')); part(g, CYL, toon('#3b4146'), [x, 2.4, -5.1], [0.9, 0.2, 0.9], [Math.PI / 2, 0, 0], 0); }
    addBox(g, [12.6, 0.4, 1.6], [0, 3.8, -4.4], toon('#c9b79a'));
    for (const x of [-9, 9]) addBox(g, [1.2, 2.2, 7], [x, 1.1, -1], brick);
    signAt(g, 'ボックス・ヒル砦', 10, 12);
  }
  {
    // ぶどう畑：谷の向こうのデンビーズのぶどう園のように、斜面へ等高線状に畝を並べる
    const vines = [], posts = [], s0 = at(4, 0.08), s1 = at(4, 0.92);
    for (let v = W / 2 + 22; v <= W / 2 + 86; v += 4.5) {
      for (let s = s0; s < s1; s += 3.2) {
        const f = tp(s, W / 2 + v), p = f.v.clone();
        if (!clearAt(p.x, p.z, W / 2 + 18, 1)) continue;
        vines.push({ p: onGround(p, 0.7), s: new V3(3, 1.4, 0.7), r: [0, -f.h, 0], c: C(['#5f8f42', '#6f9c49', '#577f3c'][(Math.random() * 3) | 0]) });
        if (Math.round((s - s0) / 3.2) % 4 === 0) posts.push({ p: onGround(p.clone(), 0.9), s: new V3(0.12, 1.8, 0.12) });
      }
    }
    const vineMesh = addInst(BOX, toon('#ffffff'), shuffle(vines)); addInst(BOX, wood, shuffle(posts), false);
    if (vineMesh) registerLandmark(vineMesh, 'ぶどう畑');
    const g = fantasyGroup(onGround(local(at(4, 0.5), 0, W / 2 + 54))); registerLandmark(g, 'ぶどう畑の標識'); signAt(g, 'ぶどう畑', 7, 9);
  }

  /* ---- 第5区間：妖精の森の小径（ツゲの茂み、妖精の扉の大木、ランタン、花の門） ---- */
  const forestS0 = track.zones[1] ? track.zones[1].start : at(5, 0.15), forestS1 = track.zones[1] ? track.zones[1].end : at(5, 0.8);
  {
    const lanterns = [], posts = [];
    for (let s = forestS0; s <= forestS1; s += 16) for (const lane of [-3.6, W + 3.6]) {
      const p = track.pos(s, lane); posts.push({ p: new V3(p.x, p.y + 1.4, p.z), s: new V3(0.16, 2.8, 0.16) }); lanterns.push({ p: new V3(p.x, p.y + 3, p.z), s: new V3(0.45, 0.55, 0.45) });
    }
    inst(BOX, darkWood, posts, false);
    const lanternMesh = inst(SPH_LO, glowMat('#e8ffc0', 1.6), lanterns, false);
    updates.push(t => { lanternMesh.material.color.setScalar(reduced.matches ? 1.6 : 1.5 + Math.sin(t * 1.6) * 0.25); lanternMesh.material.color.multiply(C('#e8ffc0')); });
    // 妖精の門：小径の入口にかかる、枝を編んだアーチと花
    const f = tp(forestS0 - 4, W / 2), arch = registerLandmark(fantasyGroup(f.v), '妖精の門'); arch.rotation.y = -f.h;
    const R = W / 2 + 5;
    for (const z of [-R, R]) part(arch, new THREE.CylinderGeometry(0.9, 1.3, 9, 8), toon('#6a4f35'), [0, 4.5, z], null, null, 0.05);
    part(arch, new THREE.TorusGeometry(R, 0.8, 8, 32, Math.PI), toon('#6a4f35'), [0, 9, 0], [1, 0.45, 1], [0, Math.PI / 2, 0], 0.05);
    const blooms = [];
    for (let i = 0; i <= 24; i++) { const a = i / 24 * Math.PI; blooms.push({ p: new V3(0.4, 9 + Math.sin(a) * R * 0.45, Math.cos(a) * R), s: new V3(0.8, 0.8, 0.8), c: C(['#ffd6ec', '#fff3a8', '#d8c4ff', '#ffffff'][i % 4]) }); }
    const bloomMesh = inst(SPH_LO, toon('#ffffff', { emissive: C('#806070'), emissiveIntensity: 0.25 }), blooms, false); arch.add(bloomMesh);
    // 妖精の扉：太い木の根元に、色違いの小さな扉と灯る窓
    const doors = ['#d8574f', '#4f86c6', '#e9b949', '#6cae6a', '#b47fd0', '#e57fa8'];
    for (let i = 0; i < 6; i++) {
      const s = lerp(forestS0 + 10, forestS1 - 10, i / 5), side = i % 2 ? 1 : -1, v = side * (W / 2 + 13 + (i % 3) * 3);
      const p = local(s, 0, v); if (!clearAt(p.x, p.z, W / 2 + 9, 4)) continue;
      const tf = tp(s, W / 2), g = fantasyGroup(onGround(p)); g.rotation.y = -tf.h + (side < 0 ? Math.PI : 0);
      occupied.push({ x: p.x, z: p.z, r: 5 });
      part(g, CYL_T, toon('#6a4b33'), [0, 5, 0], [2, 10, 2], null, 0.04);
      for (const a of [0.6, 2.2, 3.8, 5.2]) part(g, CYL_T, toon('#6a4b33'), [Math.cos(a) * 1.6, 0.5, Math.sin(a) * 1.6], [0.6, 1.4, 0.6], [Math.sin(a) * 0.9, 0, -Math.cos(a) * 0.9], 0);
      part(g, SPH_LO, toon(['#3f6d3a', '#4f7d41', '#5d8a46'][i % 3]), [0, 13, 0], [8, 6, 8]);
      part(g, SPH_LO, toon('#4c7b40'), [3, 10.5, 2], [5, 4, 5]);
      addBox(g, [1, 1.3, 0.15], [0, 0.75, -1.95], toon(doors[i]));
      part(g, CYL, toon(doors[i]), [0, 1.4, -1.95], [0.5, 0.15, 0.5], [Math.PI / 2, 0, 0], 0);
      part(g, SPH_LO, glowMat('#ffe7a0', 2), [0, 2.4, -1.9], [0.25, 0.25, 0.1], null, 0);
      part(g, SPH_LO, toon('#e2b449'), [0.3, 0.75, -2.05], [0.07, 0.07, 0.07], null, 0);
      if (i > 3) themeDetails.push(g);
    }
  }

  /* ---- 第6区間：モール川の谷（飛び石、歩道橋、対岸の白亜の崖「ホワイツ」、カワセミと白鳥） ---- */
  const riverS0 = at(6, 0.05), riverS1 = track.L - 12, riverA = -(W / 2 + 22), riverB = -(W / 2 + 40);
  const crossS = lerp(riverS0, riverS1, 0.42), bridgeS = lerp(riverS0, riverS1, 0.68);
  {
    const water = new THREE.MeshStandardMaterial({ color: '#6fbcc4', roughness: 0.25, metalness: 0.15, side: THREE.DoubleSide });
    courseRibbon(riverS0, riverS1, W / 2 + riverB, W / 2 + riverA, 0.1, water);
    courseRibbon(riverS0, riverS1, W / 2 + riverA + 0.2, W / 2 + riverA + 1.6, 0.13, toon('#b9a882', { side: THREE.DoubleSide }));
    courseRibbon(riverS0, riverS1, W / 2 + riverB - 1.6, W / 2 + riverB - 0.2, 0.13, toon('#b9a882', { side: THREE.DoubleSide }));
    occupied.push(...Array.from({ length: 12 }, (_, i) => { const p = local(lerp(riverS0, riverS1, i / 11), 0, (riverA + riverB) / 2); return { x: p.x, z: p.z, r: 14 }; }));
    // 飛び石：川幅いっぱいに並ぶ角ばった石（戦時中に一度撤去され、のちに据え直された）
    const stones = [];
    for (let v = riverA - 1; v >= riverB + 1; v -= 1.35) {
      const p = local(crossS + rand(-0.25, 0.25), 0, v), f = tp(crossS, W / 2);
      stones.push({ p: new V3(p.x, track.pos(crossS, W / 2).y + 0.35, p.z), s: new V3(1.1, 0.75, 1.15), r: [0, -f.h + rand(-0.15, 0.15), 0] });
    }
    const stoneMesh = inst(BOX, toon('#d7d2c4'), stones); registerLandmark(stoneMesh, '飛び石（モール川）');
    const sg = fantasyGroup(onGround(local(crossS + 6, 0, riverA + 4))); registerLandmark(sg, '飛び石の道標'); signAt(sg, '飛び石（モール川）', 6, 13);
    addBox(sg, [0.3, 3, 0.3], [0, 1.5, 0], wood);
    // 歩道橋：飛び石の少し下流
    const a = local(bridgeS, 0, riverA + 3), b = local(bridgeS, 0, riverB - 3), mid = a.clone().lerp(b, 0.5), len = a.distanceTo(b);
    const bridge = registerLandmark(fantasyGroup(new V3(mid.x, track.pos(bridgeS, W / 2).y, mid.z)), 'モール川の歩道橋');
    bridge.rotation.y = -Math.atan2(b.z - a.z, b.x - a.x);
    addBox(bridge, [len, 0.35, 2.4], [0, 1.4, 0], wood, null, 0.03);
    for (const z of [-1.1, 1.1]) { addBox(bridge, [len, 0.12, 0.12], [0, 2.5, z], wood); for (let x = -len / 2; x <= len / 2 + 0.1; x += len / 8) addBox(bridge, [0.14, 1.1, 0.14], [x, 1.95, z], darkWood); }
    for (const x of [-len / 2 + 3, 0, len / 2 - 3]) for (const z of [-1, 1]) addBox(bridge, [0.3, 1.5, 0.3], [x, 0.6, z], darkWood);
    // 葦と柳：両岸に
    const reeds = [], willows = [];
    for (let i = 0; i < 160; i++) {
      const s = rand(riverS0, riverS1), v = Math.random() < 0.5 ? riverA + rand(0.5, 2.5) : riverB - rand(0.5, 2.5);
      if (Math.abs(s - crossS) < 4 || Math.abs(s - bridgeS) < 4) continue;
      const p = local(s, 0, v); reeds.push({ p: onGround(p, 0.8), s: new V3(0.18, 1.6, 0.18), r: [rand(-0.15, 0.15), 0, rand(-0.15, 0.15)], c: C(i % 3 ? '#7c9a4b' : '#a3a95a') });
    }
    for (let i = 0; i < 9; i++) {
      const s = lerp(riverS0 + 8, riverS1 - 8, i / 8), v = i % 2 ? riverA + 6 : riverB - 6, p = local(s, 0, v);
      if (!clearAt(p.x, p.z, W / 2 + 6) || Math.abs(s - crossS) < 8 || Math.abs(s - bridgeS) < 8) continue;
      onGround(p); willows.push({ p: p.clone().add(new V3(0, 3, 0)), s: new V3(0.6, 6, 0.6), t: 1 }, { p: p.clone().add(new V3(0, 7, 0)), s: new V3(5.5, 6.5, 5.5), t: 0 });
    }
    addInst(new THREE.ConeGeometry(1, 1, 5), toon('#ffffff'), shuffle(reeds), false);
    if (willows.length) { inst(CYL_T, toon('#6d5640'), willows.filter(w => w.t)); inst(SPH_LO, toon('#9cba67'), willows.filter(w => !w.t)); }
    // ホワイツ：対岸の森に削られた白亜の崖
    const cliffs = [], tops = [];
    for (let s = riverS0 + 6; s < riverS1 - 6; s += 5.5) {
      const p = local(s, 0, riverB - 8 - rand(0, 2)), h = rand(6, 11), f = tp(s, W / 2);
      if (!clearAt(p.x, p.z, W / 2 + 10)) continue;
      onGround(p); cliffs.push({ p: new V3(p.x, p.y + h / 2 - 0.5, p.z), s: new V3(6.5, h, 4), r: [rand(-0.08, 0.08), -f.h + rand(-0.2, 0.2), rand(-0.06, 0.06)], c: C(['#f2eee2', '#e7e1cf', '#faf7ee'][(Math.random() * 3) | 0]) });
      tops.push({ p: new V3(p.x, p.y + h + 1.5, p.z), s: new V3(5, 3.5, 4.5), c: C(['#3e6a3c', '#4a7843'][(Math.random() * 2) | 0]) });
    }
    const cliffMesh = cliffs.length ? inst(BOX, toon('#ffffff'), cliffs) : null; if (tops.length) inst(SPH_LO, toon('#ffffff'), tops);
    if (cliffMesh) registerLandmark(cliffMesh, 'ホワイツ（白亜の崖）');
    const wg = fantasyGroup(onGround(local(lerp(riverS0, riverS1, 0.2), 0, riverB - 9))); registerLandmark(wg, 'ホワイツの標識'); wg.position.y += 12; signAt(wg, 'ホワイツ（白亜の崖）', 2, 14);
    // カワセミ：川面すれすれを行き来する青い小鳥。白鳥はゆっくり流れる
    const bird = fantasyGroup(); part(bird, SPH_LO, toon('#1f8fc9'), [0, 0, 0], [0.5, 0.28, 0.28], null, 0); part(bird, SPH_LO, toon('#f08a3c'), [0.05, -0.12, 0], [0.38, 0.16, 0.22], null, 0); part(bird, CONE, toon('#222'), [0.6, 0.02, 0], [0.06, 0.35, 0.06], [0, 0, -Math.PI / 2], 0);
    bird.scale.setScalar(1.8);
    const swans = [0, 1].map(i => { const g = fantasyGroup(); part(g, SPH_LO, toon('#fbfbf6'), [0, 0.4, 0], [1.3, 0.6, 0.7]); part(g, CYL, toon('#fbfbf6'), [0.9, 1.1, 0], [0.12, 1.2, 0.12], [0, 0, -0.2], 0); part(g, SPH_LO, toon('#fbfbf6'), [1.05, 1.75, 0], [0.25, 0.22, 0.2], null, 0); part(g, CONE, toon('#f08a3c'), [1.35, 1.72, 0], [0.08, 0.3, 0.08], [0, 0, -Math.PI / 2], 0); return g; });
    const riverY = track.pos(crossS, W / 2).y, mid0 = (riverA + riverB) / 2;
    updates.push(t => {
      const m = reduced.matches ? 4 : t, u = (Math.sin(m * 0.35) + 1) / 2, s = lerp(riverS0 + 10, riverS1 - 10, u), dir = Math.cos(m * 0.35) >= 0 ? 0 : Math.PI;
      const p = local(s, 0, mid0 + Math.sin(m * 1.3) * 3), f = tp(s, W / 2);
      bird.userData.droneIgnore = true; swans.forEach(g => { g.userData.droneIgnore = true; });
      bird.position.set(p.x, riverY + 1.2 + Math.abs(Math.sin(m * 3)) * 0.8, p.z); bird.rotation.y = -f.h + dir;
      swans.forEach((g, i) => { const ss = lerp(riverS0 + 20, riverS1 - 20, mod(m * 0.004 + i * 0.37, 1)), q = local(ss, 0, mid0 + (i ? 4 : -3)), ff = tp(ss, W / 2); g.position.set(q.x, riverY, q.z); g.rotation.y = -ff.h; });
    });
  }

  /* ---- 植生：白亜の草原（第0〜2区間）、イチイとツゲの森（第3・5区間）、谷の牧草地 ---- */
  {
    const trunks = [], crowns = [], yewTrunks = [], yews = [], boxes = [], flowers = [], chalk = [], lights = [];
    const plants = [];
    const broadleaf = (p, h, cols) => plants.push(() => { trunks.push({ p: new V3(p.x, p.y + h * 0.3, p.z), s: new V3(0.6, h * 0.6, 0.6) }); crowns.push({ p: new V3(p.x, p.y + h * 0.75, p.z), s: new V3(h * 0.33, h * 0.42, h * 0.33), c: C(cols[(Math.random() * cols.length) | 0]) }); });
    const yew = p => plants.push(() => { const h = rand(7, 11); yewTrunks.push({ p: new V3(p.x, p.y + 1.2, p.z), s: new V3(0.9, 2.4, 0.9) }); yews.push({ p: new V3(p.x, p.y + 1.6, p.z), s: new V3(h * 0.5, h, h * 0.5), c: C(['#2c4a33', '#35553a', '#3d5f3f'][(Math.random() * 3) | 0]) }); });
    const boxBush = p => plants.push(() => { const r = rand(1.4, 2.6); for (let k = 0; k < 3; k++) boxes.push({ p: new V3(p.x + rand(-1.2, 1.2), p.y + r * 0.7 + k * 0.4, p.z + rand(-1.2, 1.2)), s: new V3(r, r * 0.8, r), c: C(['#3c6a3a', '#467543', '#2f5c33'][k]) }); });
    // 草原：まばらなブナと、ツゲの茂み
    for (const p of scatter(70, 0, at(3, 0.05), -90, 95, W / 2 + 20, 3)) Math.random() < 0.55 ? broadleaf(p, rand(9, 15), ['#5f8f4f', '#79a35a', '#95b76a']) : boxBush(p);
    // イチイの森（第3区間）は暗く密に。階段の通り道は空ける
    for (const p of scatter(150, at(3, 0), at(4, 0.1), -80, 85, W / 2 + 13, 2.5)) {
      const v = (() => { let best = 1e9, bv = 0; for (let s = at(3, 0); s <= at(3, 1); s += 6) { const q = track.pos(s, W / 2); const d = Math.hypot(q.x - p.x, q.z - p.z); if (d < best) { best = d; bv = d; } } return bv; })();
      if (Math.abs(v - (W / 2 + 11)) < 3.5) continue;
      Math.random() < 0.7 ? yew(p) : broadleaf(p, rand(11, 17), ['#4c7d52', '#5a8a55']);
    }
    // 第4区間の内側と砦のまわり：ブナとツゲ
    for (const p of scatter(40, at(4, 0), at(5, 0), -85, -18, W / 2 + 10, 3)) Math.random() < 0.5 ? broadleaf(p, rand(10, 16), ['#557f45', '#6e9655']) : boxBush(p);
    // 妖精の森（第5区間）：ツゲの茂みを密に、ところどころにイチイと妖精の光
    for (const p of scatter(120, at(5, 0), at(6, 0.05), -75, 80, W / 2 + 10, 2)) {
      const r = Math.random(); r < 0.55 ? boxBush(p) : r < 0.8 ? yew(p) : broadleaf(p, rand(12, 18), ['#3f6d3a', '#4f7d41']);
      if (Math.random() < 0.35) lights.push({ p: new V3(p.x + rand(-2, 2), p.y + rand(2, 5), p.z + rand(-2, 2)), s: new V3(0.3, 0.3, 0.3) });
    }
    // 谷とホーム直線のまわり：牧草地の木立
    for (const p of scatter(45, at(6, 0), track.L + at(0, 1) - 1, -110, 110, W / 2 + 22, 4)) broadleaf(p, rand(9, 14), ['#6a9a52', '#83ab5f']);
    // 白亜の草原の野の花（ラン、マツムシソウ、キンポウゲ）と、白い地肌
    for (let i = 0; i < 700; i++) {
      const s = Math.random() < 0.7 ? rand(0, at(3, 0.2)) : rand(at(6, 0), track.L), v = (Math.random() < 0.5 ? -1 : 1) * rand(W / 2 + 4, W / 2 + 40), p = local(s, 0, v);
      if (!clearAt(p.x, p.z, W / 2 + 3)) continue;
      flowers.push({ p: onGround(p, 0.25), s: new V3(0.2, 0.14, 0.2), c: C(['#a57de8', '#ffe066', '#ffffff', '#ee7fb0', '#7f9cf0', '#f4c430'][i % 6]) });
    }
    for (const p of scatter(26, at(1, 0.3), at(3, 0.3), -60, 70, W / 2 + 10, 2)) chalk.push({ p: p.clone().add(new V3(0, 0.6, 0)), s: new V3(rand(2.5, 4.5), rand(1.2, 2.2), rand(2, 3.5)), r: [0, rand(0, 6), 0] });
    shuffle(plants).forEach(f => f());
    addInst(CYL_T, toon('#776044'), trunks); addInst(SPH_LO, toon('#ffffff'), crowns);
    addInst(CYL_T, toon('#6b3f2e'), yewTrunks); addInst(new THREE.ConeGeometry(1, 1, 8), toon('#ffffff'), yews);
    addInst(SPH_LO, toon('#ffffff'), boxes); addInst(SPH_LO, toon('#ffffff'), shuffle(flowers), false);
    addInst(new THREE.IcosahedronGeometry(1, 0), chalkMat, shuffle(chalk));
    const fairies = addInst(SPH_LO, glowMat('#dcffb2', 1.8), shuffle(lights), false);
    if (fairies) updates.push(t => { fairies.material.color.set('#dcffb2').multiplyScalar(reduced.matches ? 1.8 : 1.8 + Math.sin(t * 1.4) * 0.4); });
    // 妖精の輪：草地に輪になって生えるキノコ
    const stems = [], caps = [];
    for (const c of [...scatter(3, 0, at(2, 0.3), -70, -24, W / 2 + 18, 6), ...scatter(2, at(6, 0.1), track.L, W / 2 + 18, W / 2 + 50, W / 2 + 14, 6), ...scatter(2, at(5, 0.1), at(5, 0.9), -40, -20, W / 2 + 14, 5)]) {
      const r = rand(2.5, 4); occupied.push({ x: c.x, z: c.z, r: r + 1 });
      for (let k = 0; k < 14; k++) {
        const a = k / 14 * Math.PI * 2, p = onGround(new V3(c.x + Math.cos(a) * r, 0, c.z + Math.sin(a) * r));
        stems.push({ p: p.clone().add(new V3(0, 0.25, 0)), s: new V3(0.12, 0.5, 0.12) }); caps.push({ p: p.clone().add(new V3(0, 0.55, 0)), s: new V3(0.38, 0.22, 0.38), c: C(k % 3 ? '#f2e6cf' : '#e0574d') });
      }
    }
    if (stems.length) { inst(CYL, cream, stems, false); inst(SPH_LO, toon('#ffffff'), caps, false); }
  }

  /* ---- 生きもの：白亜の草原を手入れするベルテッド・ギャロウェイ牛と羊、チョークヒルブルーの蝶 ---- */
  {
    const cows = scatter(10, at(1, 0), at(2, 0.9), -70, 75, W / 2 + 16, 4).map(p => ({ p, yaw: rand(0, Math.PI * 2) }));
    cows.forEach(c => occupied.push({ x: c.p.x, z: c.p.z, r: 3 }));
    const black = toon('#26221f'), belt = toon('#f3efe6');
    herd(cows, [
      { geo: SPH_LO, mat: black, off: [0, 1.5, 0], s: [1.6, 0.85, 0.8] }, { geo: SPH_LO, mat: belt, off: [0, 1.5, 0], s: [0.55, 0.9, 0.85] },
      { geo: SPH_LO, mat: black, off: [1.55, 1.55, 0], s: [0.5, 0.42, 0.4] }, { geo: SPH_LO, mat: black, off: [1.9, 1.45, 0], s: [0.3, 0.28, 0.3] },
      ...[[0.9, 0.4], [0.9, -0.4], [-0.9, 0.4], [-0.9, -0.4]].map(([x, z]) => ({ geo: BOX, mat: black, off: [x, 0.5, z], s: [0.25, 1, 0.25] }))
    ]);
    const sheep = scatter(14, at(6, 0), track.L + at(0, 1) - 1, -95, 100, W / 2 + 18, 3).map(p => ({ p, yaw: rand(0, Math.PI * 2) }));
    const wool = toon('#f4f1e8'), face = toon('#2f2a28');
    herd(sheep, [
      { geo: SPH_LO, mat: wool, off: [0, 1, 0], s: [1, 0.7, 0.65] }, { geo: SPH_LO, mat: face, off: [0.95, 1.1, 0], s: [0.32, 0.3, 0.26] },
      ...[[0.5, 0.3], [0.5, -0.3], [-0.5, 0.3], [-0.5, -0.3]].map(([x, z]) => ({ geo: BOX, mat: face, off: [x, 0.3, z], s: [0.14, 0.6, 0.14] }))
    ]);
    // チョークヒルブルー：白亜の草原だけに棲む淡い青の蝶。羽ばたきながら花の上を漂う
    const wingGeo = new THREE.BufferGeometry();
    wingGeo.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, -0.25, 0, 0.55, 0.3, 0, 0.5, 0, 0, 0, 0.3, 0, -0.5, -0.25, 0, -0.55], 3)); wingGeo.computeVertexNormals();
    const spots = scatter(40, 0, at(3, 0.2), -45, 50, W / 2 + 3);
    const flies = spots.map(p => ({ p, ph: rand(0, 6), r: rand(1, 3) }));
    const fly = fantasyInst(wingGeo, new THREE.MeshBasicMaterial({ color: C('#a9d2ff'), side: THREE.DoubleSide }), flies.map(() => ({ p: new V3(), s: new V3(1, 1, 1) })), false);
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), sc = new V3(), ps = new V3();
    updates.push(t => {
      const tt = reduced.matches ? 0 : t;
      fly.userData.droneIgnore = true;
      for (let i = 0; i < fly.count; i++) {
        const f = flies[i], a = tt * 0.5 + f.ph;
        ps.set(f.p.x + Math.cos(a) * f.r, f.p.y + 1 + Math.sin(tt * 1.7 + f.ph) * 0.4, f.p.z + Math.sin(a) * f.r);
        sc.set(1.4, 1.4, 1.4 * (0.25 + Math.abs(Math.sin(tt * 14 + f.ph)) * 0.75));
        m.compose(ps, q.setFromEuler(e.set(0, -a, 0)), sc); fly.setMatrixAt(i, m);
      }
      fly.instanceMatrix.needsUpdate = true;
    });
  }

  /* ---- 道標：ナショナル・トラストの散策路のような木の指道標 ---- */
  {
    const posts = [], arms = [];
    for (const [s, v] of [[at(0, 0.1), W / 2 + 12], [at(1, 0.2), W / 2 + 12], [at(2, 0.05), -(W / 2 + 10)], [at(3, 0.95), W / 2 + 14], [at(5, 0.05), -(W / 2 + 10)], [at(6, 0.3), W / 2 + 12]]) {
      const p = local(s, 0, v); if (!clearAt(p.x, p.z, W / 2 + 6)) continue; onGround(p);
      posts.push({ p: p.clone().add(new V3(0, 1.6, 0)), s: new V3(0.25, 3.2, 0.25) });
      for (const [y, yaw] of [[2.8, rand(0, 3)], [2.3, rand(0, 3)]]) arms.push({ p: p.clone().add(new V3(Math.cos(yaw) * 0.7, y, -Math.sin(yaw) * 0.7)), s: new V3(1.5, 0.3, 0.1), r: [0, yaw, 0] });
    }
    if (posts.length) { inst(BOX, wood, posts); inst(BOX, cream, arms, false); }
  }

  // 妖精の光が舞う：ふだんは森の近くでほのかに、ゴールの瞬間はゴール板のまわりに一斉に
  ambient(TEX_STAR, true, 3, (a, c) => a.emit(c.x + rand(-40, 40), c.y + rand(-6, 4), c.z + rand(-40, 40), rand(-0.3, 0.3), rand(0.1, 0.5), rand(-0.3, 0.3), 5, rand(0.1, 0.22), C('#e9ffc8').multiplyScalar(1.6), 0, 0), true);
  const finish = tp(track.finishS, W / 2).v; let burst = -1;
  themeFinish = () => { burst = 0; }; themeReset = () => { burst = -1; };
  const burstCols = ['#ffd6ec', '#fff3a8', '#c8f7ff', '#d8c4ff', '#dcffb2'].map(c => C(c).multiplyScalar(2));
  updates.push((t, dt) => {
    if (burst < 0) return; burst += dt; if (burst > 2.5) { burst = -1; return; }
    const n = reduced.matches ? 1 : lightQuality() ? 3 : 6;
    for (let i = 0; i < n; i++) sparkP.emit(finish.x + rand(-W / 2, W / 2), finish.y + rand(2, 9), finish.z + rand(-W / 2, W / 2), rand(-2, 2), rand(0.5, 3), rand(-2, 2), rand(1.2, 2.2), rand(0.4, 0.9), burstCols[i % burstCols.length], -0.4, 0.8);
  });
  themeUpd.push((t, dt) => { for (const f of updates) f(t, dt); });
}
// 妖精の丘のスタンド：白い共通スタンドを、木の柱と深緑の切妻屋根のピクニック観覧席に。軒には三角旗
function decorBoxHillStand(stand, len, z0, roof) {
  const g = new THREE.Group(); stand.add(g); registerLandmark(g, 'boxHill-stand');
  roof.visible = false;
  const recolor = { [C('#f2eef8').getHex()]: '#e7d6b4', [C('#e3dcef').getHex()]: '#d2bb8f', [C('#d9d3e6').getHex()]: '#6a4d33' };
  stand.children.forEach(o => { if (o.isMesh && !o.isInstancedMesh && o.material.color && recolor[o.material.color.getHex()]) o.material.color.set(recolor[o.material.color.getHex()]); });
  const PRISM = new THREE.ExtrudeGeometry(new THREE.Shape([new THREE.Vector2(-0.5, 0), new THREE.Vector2(0.5, 0), new THREE.Vector2(0, 1)]), { depth: 1, bevelEnabled: false });
  PRISM.translate(0, 0, -0.5); PRISM.rotateY(Math.PI / 2);
  // 棟は直線方向（切妻の三角は両端に見える）
  part(g, PRISM, toon('#3f6447'), [0, 13, z0 + 8.5], [len + 6, 4.5, 24], null, 0.02);
  addBox(g, [len + 6.4, 0.6, 0.6], [0, 13, z0 - 2.6], toon('#6a4d33'));
  const flags = [], cols = ['#d9574a', '#f3ead2', '#3d6fa6', '#f0c24d', '#6e9a5b'].map(C), tri = new THREE.BufferGeometry();
  tri.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, 0, 0, 0.5, 0, 0, 0, -1, 0], 3)); tri.computeVertexNormals();
  for (let x = -len / 2 - 2; x <= len / 2 + 2; x += 1.6) flags.push({ p: new V3(x, 12.6 - Math.abs(Math.sin((x + len / 2) / 8 * Math.PI)) * 0.6, z0 - 2.7), s: new V3(1, 1, 1), c: cols[(Math.round(x / 1.6) % 5 + 5) % 5] });
  const flagMesh = inst(tri, toon('#ffffff', { side: THREE.DoubleSide }), flags, false); g.add(flagMesh);
}
