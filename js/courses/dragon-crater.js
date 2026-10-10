// 竜の火口ダービー
'use strict';

/* ---- 竜の火口ダービー：インドネシア・ジャワ島のブロモ山（ブロモ・テンゲル・スメル国立公園）を下敷きにした火口の縁 ---- */
// 見立て：内馬場は噴煙を上げるブロモ山の火口、外は灰色の砂の海（テンゲル・カルデラの底）。遠くをカルデラの壁が囲む。
// 区間の役割：0 火口縁の台地のホーム直線（溶岩石の観覧席と割れ門、ペンジョール）／1 上り（砂の海を行き交うジープ、彼方にサバンナの丘とプナンジャカンの展望台）／
// 2 最高地点（竜の息吹・硫黄の噴煙、彼方にスメル山）／3 下り（バトック山）／4 いちばん低い鞍部（砂の海からの階段と馬方、火口の内のカサダの祭り）／
// 5 上り返しの最後のコーナー（眼下のポテン寺院と、寺院と階段を行き来する馬）。カルデラの壁の上にチュモロ・ラワンの村。
// 火口の底は溶岩の湖で、竜（ジャワの影絵芝居の地底の竜神アンタボガに想を得たファンタジー）が棲む
// 地面の色：火口の壁は硫黄の黄と赤茶の帯、縁と斜面は灰で斜面の筋（ガリー）は濃く、砂の海は地平の板と同じ明るさ
function craterTint(g) {
  const p = g.attributes.position, col = new Float32Array(p.count * 3), c = new THREE.Color(), band = new THREE.Color(), cr = track.crater;
  const sand = C('#f4f0ec'), rim = C('#c4bcba'), dark = C('#8a8086'), sulfur = C('#e2d08a'), ochre = C('#b98e72'), floor = C('#8a7a76');
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i); track.craterAt = null; track.groundH(x, z); const k = track.craterAt;
    if (!k) c.copy(sand);
    else if (k.inside) {
      const a = Math.atan2(z - cr.z, x - cr.x), w = Math.sin(a * 9 + k.t * 7) * 0.5 + 0.5;
      band.copy(ochre).lerp(sulfur, THREE.MathUtils.smoothstep(w, 0.45, 0.8)); c.copy(rim).lerp(band, Math.sin(k.t * Math.PI) * 0.75).lerp(floor, THREE.MathUtils.smoothstep(k.t, 0.82, 1));
    } else {
      c.copy(rim).lerp(sand, k.t);
      if (k.gully < 0) c.lerp(dark, Math.min(1, -k.gully / 3) * 0.75);
    }
    col.set([c.r, c.g, c.b], i * 3);
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
}
// 割れ門（チャンディ・ブンタル）：一つの塔を縦に二つに割ったような門。g の局所 z=0 を通り道にして左右へ置く（x：厚み、z：幅）
function candiBentar(g, gap, h, mat, trim, depth = 4) {
  const tiers = 7, hh = h / tiers;
  for (const sd of [-1, 1]) {
    for (let k = 0; k < tiers; k++) {
      const w = h * 0.5 * (1 - k * 0.1);
      addBox(g, [depth * (1 - k * 0.07), hh * 0.94, w], [0, k * hh + hh / 2, sd * (gap / 2 + w / 2)], k % 2 ? trim : mat, null, 0.02);
    }
    // 割れた面はまっすぐで、外側の段に小さな飾りの尖塔
    const w0 = h * 0.5 * (1 - (tiers - 1) * 0.1);
    part(g, CONE, trim, [0, h + hh * 0.6, sd * (gap / 2 + w0 / 2)], [depth * 0.3, hh * 1.2, w0 * 0.3], null, 0);
    for (let k = 1; k < tiers; k += 2) { const w = h * 0.5 * (1 - k * 0.1); part(g, CONE, trim, [0, (k + 1) * hh + hh * 0.3, sd * (gap / 2 + w - 0.4)], [0.5, hh * 0.6, 0.5], null, 0); }
  }
}
function decorDragonCrater() {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const { shuffle, roadDist, clearAt, groundAt, onGround, local, at, scatter, label, site, CYL, CYL_T, addInst, pathRibbon, beam, route } = sceneryKit();
  // 案内板は溶岩石の黒に朝焼けの橙の文字
  const signAt = (g, text, y, w = 14) => { const sp = label(text, w, w / 4, '#3a2a2e', '#ffd9a0'); sp.position.set(0, y, 0); sp.scale.set(w, w / 4, 1); g.add(sp); return sp; };
  const cr = track.crater, C0 = new V3(cr.x, cr.floor, cr.z), updates = [];
  const angOf = p => Math.atan2(p.z - cr.z, p.x - cr.x), angDiff = (a, b) => Math.atan2(Math.sin(a - b), Math.cos(a - b));
  const lavaStone = toon('#3f3739'), lavaStone2 = toon('#5c5052'), thatch = toon('#2a2426'), gold = toon('#d6aa4a'), bambooMat = toon('#d9c27a');
  const skinMat = toon('#9a6a48'), sarongCols = ['#3f5f8f', '#8f3a3a', '#5a7a3f', '#c7883a', '#6a4a8a', '#2f6f6f', '#a0523f'];
  // テンゲルの人々：サルン（腰布）を肩から巻き、毛糸の帽子をかぶる。足を交互に出して歩く
  const person = (parent, col, cap = '#2a2a2a') => {
    const g = new THREE.Group(); parent.add(g);
    part(g, new THREE.CapsuleGeometry(0.34, 0.9, 3, 8), toon(col), [0, 1.35, 0], null, null, 0.04);
    part(g, SPH_LO, skinMat, [0, 2.3, 0], [0.27, 0.3, 0.27], null, 0.04); part(g, SPH_LO, toon(cap), [0, 2.48, 0], [0.29, 0.2, 0.29], null, 0);
    const legs = [-1, 1].map(x => { const l = new THREE.Group(); l.position.set(x * 0.15, 0.85, 0); g.add(l); addBox(l, [0.18, 0.85, 0.18], [0, -0.42, 0], toon('#3a3434')); return l; });
    return { g, legs };
  };
  // テンゲルの馬：小柄でたくましい山の馬。局所 +x が頭、脚は前後に振る
  const horse = (parent, col) => {
    const g = new THREE.Group(); parent.add(g); const m = toon(col), dark = toon('#2c2422');
    part(g, SPH_LO, m, [0, 1.75, 0], [1.25, 0.6, 0.5], null, 0.04);
    part(g, SPH_LO, m, [1.15, 2.3, 0], [0.5, 0.75, 0.32], [0, 0, -0.6], 0.04); part(g, SPH_LO, m, [1.65, 2.75, 0], [0.55, 0.26, 0.24], [0, 0, -0.35], 0.04);
    addBox(g, [0.7, 0.35, 0.12], [1.05, 2.65, 0], dark, [0, 0, -0.9]);
    part(g, CONE, dark, [-1.3, 1.4, 0], [0.18, 1.1, 0.18], [0, 0, -0.35], 0);
    addBox(g, [0.9, 0.12, 1.05], [0, 2.32, 0], toon(sarongCols[(Math.random() * sarongCols.length) | 0]));
    const legs = [[0.75, -0.25], [0.75, 0.25], [-0.75, -0.25], [-0.75, 0.25]].map(([x, z]) => { const l = new THREE.Group(); l.position.set(x, 1.35, z); g.add(l); addBox(l, [0.18, 1.35, 0.18], [0, -0.67, 0], m); return l; });
    return { g, legs };
  };

  /* ---- 内馬場：ブロモ山の火口。底は溶岩の湖（ファンタジー）で、噴煙が竜の息吹の区間へ流れる ---- */
  const wind = tp(at(2, 0.5), W / 2).v.sub(C0).setY(0).normalize();
  let lake, lakeLight;
  {
    // 溶岩の湖：黒い溶岩の殻の割れ目から赤く光る（ボロノイの境目を明るく、端でつながる繰り返し模様）
    const lavaTex = ctex(128, 128, c => {
      const pts = Array.from({ length: 18 }, () => [rand(0, 128), rand(0, 128)]), img = c.createImageData(128, 128);
      for (let y = 0; y < 128; y++) for (let x = 0; x < 128; x++) {
        let f1 = 1e9, f2 = 1e9;
        for (const [px, py] of pts) { const dx = Math.min(Math.abs(x - px), 128 - Math.abs(x - px)), dy = Math.min(Math.abs(y - py), 128 - Math.abs(y - py)), d = Math.hypot(dx, dy); if (d < f1) { f2 = f1; f1 = d; } else if (d < f2) f2 = d; }
        const k = Math.max(0, 1 - (f2 - f1) / 7) ** 1.5, i = (y * 128 + x) * 4;
        img.data[i] = 70 + k * 185; img.data[i + 1] = 22 + k * 150; img.data[i + 2] = 18 + k * 40; img.data[i + 3] = 255;
      }
      c.putImageData(img, 0, 0);
    }, true);
    lavaTex.repeat.set(4, 4);
    const y = groundAt(C0);
    lake = new THREE.Mesh(new THREE.CircleGeometry(26, 48), new THREE.MeshBasicMaterial({ map: lavaTex, color: C('#ffffff').multiplyScalar(1.8) }));
    lake.rotation.x = -Math.PI / 2; lake.position.set(C0.x, y + 0.3, C0.z); world.add(lake);
    registerLandmark(lake, '溶岩の湖');
    // 湖の縁の黒い溶岩の土手と、湖を照らす赤い光
    part(world, new THREE.TorusGeometry(26.5, 2.2, 6, 48), lavaStone, [C0.x, y + 0.2, C0.z], [1, 1, 0.45], [-Math.PI / 2, 0, 0], 0);
    lakeLight = new THREE.PointLight(C('#ff7a3a'), 2.2, 240, 1.4); lakeLight.position.set(C0.x, y + 14, C0.z); world.add(lakeLight);
    // 火口の壁の噴気孔：硫黄の帯（地面の色）の中から細く昇る白い噴気
    const fumes = scatter(14, 0, track.L, -(W / 2 + 50), -(W / 2 + 100), W / 2 + 40);
    let acc = 0, bubble = 0;
    const plumeCol = C('#ddd6cf'), fumeCol = C('#f4f1e8'), lavaCols = ['#ffb35a', '#ff7a32', '#ffd27a'].map(c => C(c).multiplyScalar(2));
    updates.push((t, dt) => {
      const m = reduced.matches ? 0 : t;
      lavaTex.offset.set(m * 0.004, m * 0.0027);
      lake.material.color.setScalar(1.6 + Math.sin(m * 0.9) * 0.18 + Math.sin(m * 2.3) * 0.08);
      lakeLight.intensity = 2 + Math.sin(m * 1.3) * 0.35;
      if (reduced.matches) return;
      // 噴煙：火口の底から湧き、風に流されて竜の息吹の区間の上を越えていく
      acc += dt * (lightQuality() ? 2.5 : 6);
      while (acc >= 1) {
        acc--; const a = rand(0, Math.PI * 2), r = rand(0, 18), wv = rand(5, 7.5);
        dustP.emit(C0.x + Math.cos(a) * r, y + rand(1, 5), C0.z + Math.sin(a) * r, wind.x * wv + rand(-1, 1), rand(4.5, 6.5), wind.z * wv + rand(-1, 1), rand(14, 18), rand(12, 20), plumeCol, -0.05, 0.02);
        if (fumes.length && Math.random() < 0.6) { const f = fumes[(Math.random() * fumes.length) | 0]; dustP.emit(f.x, f.y + 0.5, f.z, wind.x * 1.5, rand(2, 3), wind.z * 1.5, rand(4, 6), rand(2, 4), fumeCol, 0, 0.1); }
      }
      // 溶岩の泡がはじけ、火の粉が跳ねる
      bubble -= dt;
      if (bubble <= 0) {
        bubble = rand(0.3, 0.9); const a = rand(0, Math.PI * 2), r = Math.sqrt(Math.random()) * 23, bx = C0.x + Math.cos(a) * r, bz = C0.z + Math.sin(a) * r;
        for (let i = 0; i < (lightQuality() ? 4 : 9); i++) fireP.emit(bx, y + 0.6, bz, rand(-2, 2), rand(5, 10), rand(-2, 2), rand(0.8, 1.5), rand(0.8, 1.6), lavaCols[i % 3], 9, 0.3);
      }
    });
  }

  /* ---- 火口に棲む竜（ジャワの影絵芝居の地底の竜神アンタボガに想を得たファンタジー）：冠をいただく大蛇の竜が火口の中を泳ぐ ---- */
  let dragonLift = 0, celebration = 0, roar = 0;
  {
    const NB = 72, bodyCols = ['#2f6a52', '#35745a', '#3d7f62', '#35745a', '#2f6a52', '#d8b04a'].map(C);
    const body = new THREE.InstancedMesh(SPH_LO, toon('#ffffff'), NB), spikes = new THREE.InstancedMesh(CONE, toon('#d9542e'), Math.ceil(NB / 2));
    for (let i = 0; i < NB; i++) body.setColorAt(i, bodyCols[i % 6]);
    [body, spikes].forEach(o => { o.frustumCulled = false; o.castShadow = true; o.userData.droneIgnore = true; world.add(o); });
    // 頭（局所 +z が前）：角と冠（マクタ）、光る目、開け閉めするあご、ひげ
    const head = fantasyGroup(); head.userData.droneIgnore = true;
    const scale = toon('#3f7a5a'), belly = toon('#e3c88a');
    part(head, SPH_LO, scale, [0, 0, 0.4], [2.5, 2.1, 3.1], null, 0.04); part(head, SPH_LO, scale, [0, -0.2, 3.2], [1.7, 1.2, 2.5], null, 0.04);
    const jaw = new THREE.Group(); jaw.position.set(0, -1, 1.3); head.add(jaw); part(jaw, SPH_LO, belly, [0, -0.2, 1.9], [1.45, 0.55, 2.4], null, 0.04);
    for (const sd of [-1, 1]) {
      part(head, SPH_LO, glowMat('#ffe36a', 2.4), [sd * 1.35, 0.85, 2.1], [0.45, 0.45, 0.45], null, 0);
      part(head, CONE, gold, [sd * 1.1, 2, -0.9], [0.4, 3, 0.4], [-0.9, 0, sd * 0.25], 0);
      part(head, CYL, gold, [sd * 1.5, -0.5, 4.4], [0.07, 3.2, 0.07], [0.9, 0, sd * 0.6], 0);
    }
    part(head, CYL, gold, [0, 2.1, 0.4], [1.55, 0.8, 1.55], null, 0.03);
    for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2; part(head, CONE, gold, [Math.cos(a) * 1.25, 3, 0.4 + Math.sin(a) * 1.25], [0.35, 1.3, 0.35], null, 0); }
    part(head, SPH_LO, toon('#e04a3a'), [0, 2.8, 0.4], [0.45, 0.45, 0.45], null, 0);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), one = new V3(), up = new V3(0, 1, 0), pts = Array.from({ length: NB + 2 }, () => new V3());
    const swim = (u, lift, out) => { const a = u * 0.16, r = 58 + Math.sin(u * 0.13) * 8; return out.set(C0.x + Math.cos(a) * r, C0.y + 24 + lift + Math.sin(u * 0.41) * 8, C0.z + Math.sin(a) * r); };
    const mouth = new V3(), fireCols = ['#ffd27a', '#ff8a3a', '#ff5a2a'].map(c => C(c).multiplyScalar(2));
    updates.push((t, dt) => {
      const m = reduced.matches ? 0 : t;
      // ゴールでは頭をもたげて火口の上へ伸び上がり、空へ火を噴く
      dragonLift += ((celebration > 0 ? 62 : 0) - dragonLift) * Math.min(1, dt * 1.2);
      for (let i = 0; i < NB + 2; i++) {
        const k = Math.max(0, i - 1) / NB;
        swim(m - (i - 1) * 0.15, dragonLift * Math.pow(1 - k, 1.4), pts[i]).y += Math.sin(m * 2 - i * 0.45) * 1.2 * k;
      }
      for (let i = 0; i < NB; i++) {
        const r = 2.4 * (1 - i / NB * 0.72), p = pts[i + 1];
        m4.compose(p, q.identity(), one.set(r, r * 0.92, r)); body.setMatrixAt(i, m4);
        if (i % 2 === 0) { m4.compose(new V3(p.x, p.y + r * 0.95, p.z), q.identity(), one.set(0.35 * r, 1.4 * r, 0.35 * r)); spikes.setMatrixAt(i / 2, m4); }
      }
      body.instanceMatrix.needsUpdate = spikes.instanceMatrix.needsUpdate = true;
      head.position.copy(pts[0]); head.up.copy(up); head.lookAt(pts[0].clone().multiplyScalar(2).sub(pts[2]).add(new V3(0, dragonLift * 0.02, 0)));
      // ときどき吠えて空へ火を噴く。ゴールでは噴き続ける
      roar -= dt; const breath = celebration > 0 || (roar < 1.4 && roar > 0);
      if (roar <= 0) roar = rand(16, 24);
      jaw.rotation.x = breath ? 0.55 + Math.sin(m * 9) * 0.08 : 0.08 + Math.sin(m * 1.3) * 0.05;
      if (breath && !reduced.matches) {
        head.localToWorld(mouth.set(0, -0.6, 5.2)); const dir = mouth.clone().sub(head.position).normalize();
        for (let i = 0; i < (lightQuality() ? 3 : 7); i++) fireP.emit(mouth.x, mouth.y, mouth.z, dir.x * 18 + rand(-2, 2), dir.y * 18 + rand(4, 9), dir.z * 18 + rand(-2, 2), rand(0.7, 1.2), rand(1.6, 3), fireCols[i % 3], -2, 0.8);
      }
    });
  }

  /* ---- 第4区間の火口の内側：カサダの祭り。テンゲルの人々が火口へ供物を投げ入れ、網を張った人々が斜面で受け止める ---- */
  const sSt = at(4, 0.35);
  {
    const g = registerLandmark(fantasyGroup(), 'カサダの祭り'), bodies = [], heads = [], nets = [], poles = [], baskets = [];
    for (let i = 0; i < 34; i++) {
      const p = onGround(local(sSt + rand(-30, 30), 0, -rand(W / 2 + 10, W / 2 + 46)));
      if (roadDist(p.x, p.z) < W / 2 + 8 || p.distanceTo(boardPos) < 26) continue;
      const col = C(sarongCols[i % sarongCols.length]);
      bodies.push({ p: p.clone().add(new V3(0, 1.3, 0)), s: new V3(1, 1, 1), c: col }); heads.push({ p: p.clone().add(new V3(0, 2.3, 0)), s: new V3(0.28, 0.3, 0.28) });
      if (i % 3 === 0) {
        // 網：竹竿の先に輪を付け、斜面の下で供物を受ける
        const top = p.clone().add(new V3(rand(-1, 1), 4.2, rand(-1, 1)));
        poles.push(beam(p.clone().add(new V3(0, 1.2, 0)), top, 0.09)); nets.push({ p: top, s: new V3(0.8, 0.3, 0.8), r: [rand(-0.4, 0.4), 0, rand(-0.4, 0.4)] });
      } else if (i % 5 === 1) {
        // 供物を吊るした竹の天秤（オンケック）：野菜と果物
        const b = p.clone().add(new V3(1.2, 0, 0)); poles.push(beam(b.clone().add(new V3(-1, 1.6, 0)), b.clone().add(new V3(1, 1.6, 0)), 0.1));
        for (const sd of [-1, 1]) for (let k = 0; k < 4; k++) baskets.push({ p: b.clone().add(new V3(sd + rand(-0.3, 0.3), 0.6 + k * 0.25, rand(-0.3, 0.3))), s: new V3(0.3, 0.3, 0.3), c: C(['#e85a3a', '#f2c040', '#6aa84a', '#f0f0e0'][k]) });
      }
    }
    const capsule = new THREE.CapsuleGeometry(0.34, 0.9, 3, 8);
    g.add(inst(capsule, toon('#ffffff'), bodies), inst(SPH_LO, skinMat, heads), inst(BOX, bambooMat, poles, false), inst(SPH_LO, toon('#cfc6ac', { transparent: true, opacity: 0.5 }), nets, false), inst(SPH_LO, toon('#ffffff'), baskets, false));
    // 投げ入れられる供物：縁から火口の底へ弧を描いて落ちる
    const items = Array.from({ length: 8 }, (_, i) => {
      const a = onGround(local(sSt + rand(-25, 25), 0, -(W / 2 + rand(12, 26))), 2.2), b = onGround(local(sSt + rand(-30, 30), 0, -(W / 2 + rand(70, 95))), 0.4);
      const mesh = part(world, SPH_LO, toon(['#e85a3a', '#f2c040', '#6aa84a', '#f0f0e0'][i % 4]), [a.x, a.y, a.z], [0.35, 0.35, 0.35], null, 0); mesh.userData.droneIgnore = true;
      return { mesh, a, b, ph: i / 8 };
    });
    updates.push(t => {
      const m = reduced.matches ? 0 : t;
      for (const it of items) { const u = mod(m / 6 + it.ph, 1); it.mesh.visible = u < 0.5; if (!it.mesh.visible) continue; const k = u / 0.5; it.mesh.position.lerpVectors(it.a, it.b, k).y += Math.sin(k * Math.PI) * 9 - k * k * 2; }
    });
    const sign = site('カサダの祭り', sSt, -(W / 2 + 30), 6, 4, '#5c5052', W / 2 + 6);
    signAt(sign, 'カサダの祭り（火口へ供物を捧げる）', 6, 17);
  }

  /* ---- ホーム直線：火口縁の台地。ゴールの先に溶岩石の割れ門、沿道に祭りの竹飾りペンジョール ---- */
  {
    const sGate = track.finishS + 18, f = tp(sGate, W / 2), arch = fantasyGroup(f.v); arch.rotation.y = -f.h; registerLandmark(arch, '割れ門');
    candiBentar(arch, W + 8, 17, lavaStone, lavaStone2);
    // ペンジョール：しなる竹の先に飾りを垂らす。スタンドの前に、外へしならせて立てる
    const curve = new THREE.QuadraticBezierCurve3(new V3(0, 0, 0), new V3(0, 13, 0), new V3(5, 11, 0));
    const pole = new THREE.TubeGeometry(curve, 16, 0.14, 5, false), list = [], tips = [], cloths = [];
    for (let s = track.homeS0 + 10; s < track.homeS1 - 4; s += 24) {
      if (Math.abs(s - sGate) < 14 || Math.abs(s - track.finishS) < 8) continue;
      for (const sd of [1]) {
        const v = sd * (W / 2 + 5), q = tp(s, W / 2 + v), base = onGround(q.v.clone()), n = q.n.clone().multiplyScalar(sd), yaw = -Math.atan2(n.z, n.x);
        list.push({ p: base, s: new V3(1, 1, 1), r: [0, yaw, 0] });
        tips.push({ p: base.clone().add(n.clone().multiplyScalar(5)).add(new V3(0, 9.6, 0)), s: new V3(0.45, 1.6, 0.45), r: [Math.PI, 0, 0], c: C(['#f2d24e', '#f6f0e0'][(s / 24 | 0) % 2]) });
        cloths.push({ p: base.clone().add(new V3(0, 3.2, 0)), s: new V3(0.2, 1.2, 0.2), c: C(['#f6f0e0', '#e9c04a'][(s / 24 | 0) % 2]) });
      }
    }
    addInst(pole, bambooMat, list); addInst(CONE, toon('#ffffff'), tips, false); addInst(CYL, toon('#ffffff'), cloths, false);
  }

  /* ---- 第1区間の外：砂の海を行き交うジープと、その轍（わだち） ---- */
  const aBatok = angOf(tp(at(3, 0.5), W / 2).v), aSemeru = angOf(tp(at(2, 0.5), W / 2).v), aHome = angOf(tp((track.homeS0 + track.homeS1) / 2, W / 2).v);
  const aPen = angOf(tp(at(1, 0.4), W / 2).v) - 0.35, aSav = angOf(tp(at(1, 0.9), W / 2).v);
  {
    const pts = [];
    for (let i = 0; i < 96; i++) { const a = i / 96 * Math.PI * 2, r = 440 + Math.sin(a * 3) * 18 + 250 * Math.exp(-((angDiff(a, aBatok) / 0.45) ** 2)); pts.push(onGround(new V3(cr.x + Math.cos(a) * r, 0, cr.z + Math.sin(a) * r))); }
    const road = route(pts, true);
    pathRibbon(pts.concat([pts[0]]), 5, 0.06, toon('#7d746f'), W / 2 + 20);
    const jeeps = ['#2f6b4a', '#c2332f', '#e9e6dc', '#2f5f9a', '#e0a92e', '#4a4a4a'].map((col, i) => {
      const g = fantasyGroup(); g.userData.droneIgnore = true; const body = toon(col), dark = toon('#252224'), glass = toon('#7aa0b0');
      addBox(g, [4.4, 1.3, 2], [0, 1.15, 0], body, null, 0.03); addBox(g, [2.6, 1.15, 1.9], [-0.5, 2.35, 0], body, null, 0.03);
      addBox(g, [2.7, 0.15, 2], [-0.5, 3, 0], toon('#f2f0ea')); addBox(g, [0.1, 0.8, 1.6], [0.82, 2.4, 0], glass);
      for (const [x, z] of [[1.4, -1], [1.4, 1], [-1.4, -1], [-1.4, 1]]) part(g, CYL, dark, [x, 0.55, z], [0.55, 0.35, 0.55], [Math.PI / 2, 0, 0], 0);
      part(g, CYL, dark, [-2.35, 1.4, 0], [0.55, 0.3, 0.55], [0, 0, Math.PI / 2], 0);
      for (const z of [-0.65, 0.65]) part(g, SPH_LO, glowMat('#fff2c8', 1.6), [2.2, 1.3, z], [0.18, 0.18, 0.18], null, 0);
      return { g, u: i / 6 * road.L, v: rand(9, 12) };
    });
    const dust = C('#a8a09a');
    updates.push((t, dt) => {
      for (const j of jeeps) {
        if (!reduced.matches) j.u += j.v * dt;
        const { p, yaw } = road.at(j.u); j.g.position.copy(p); j.g.position.y = groundAt(p); j.g.rotation.y = yaw;
        if (!reduced.matches && Math.random() < dt * (lightQuality() ? 2 : 5)) dustP.emit(p.x - Math.cos(-yaw) * 2.5, j.g.position.y + 0.5, p.z - Math.sin(-yaw) * 2.5, rand(-0.5, 0.5), rand(0.4, 1), rand(-0.5, 0.5), rand(2, 3), rand(2.5, 4), dust, 0, 0.6);
      }
    });
  }

  /* ---- 彼方：テンゲル・カルデラの壁。上にチュモロ・ラワンの村とプナンジャカンの展望台、壁ぎわに緑のサバンナの丘 ---- */
  const R0 = 760;
  const wallH = a => (125 + Math.sin(a * 3 + 1) * 28 + Math.sin(a * 7 + 2) * 12 + Math.sin(a * 17) * 5 + 45 * Math.exp(-((angDiff(a, aPen) / 0.08) ** 2))) * (1 - 0.35 * Math.exp(-((angDiff(a, aSemeru) / 0.4) ** 2)));
  {
    // 内側の崖：麓の崩れた斜面、浸食の筋が入った緑の崖、平らな上面（段々の畑）
    const M = 240, prof = [[-30, -0.01], [0, 0.02], [35, 0.38], [70, 0.86], [95, 1], [300, 0.92]], pos = [], col = [], idx = [], c = new THREE.Color();
    const talus = C('#8f8781'), cliff = C('#5f7a4a'), rockC = C('#8a8278'), top = C('#4f7340'), field1 = C('#93b35e'), field2 = C('#6f9448');
    for (let i = 0; i <= M; i++) {
      const a = i / M * Math.PI * 2, h = wallH(a), wob = Math.sin(a * 13) * 12 + Math.sin(a * 29) * 5;
      const farm = Math.exp(-((angDiff(a, aHome) / 0.5) ** 2)) + Math.exp(-((angDiff(a, aPen) / 0.3) ** 2));
      prof.forEach(([dr, f], j) => {
        const r = R0 + dr + wob; pos.push(cr.x + Math.cos(a) * r, j === 0 ? -1.3 : f * h, cr.z + Math.sin(a) * r);
        if (j < 2) c.copy(talus); else if (j < 4) c.copy(Math.sin(a * 80) > 0.35 ? rockC : cliff).lerp(talus, j === 2 ? 0.3 : 0);
        else c.copy(top).lerp(Math.sin(a * 140) > 0 ? field1 : field2, Math.min(1, farm) * 0.8);
        col.push(c.r, c.g, c.b);
        if (i < M && j < prof.length - 1) { const k = i * prof.length + j, n = prof.length; idx.push(k, k + n, k + 1, k + 1, k + n, k + n + 1); }
      });
    }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); geo.setIndex(idx); geo.computeVertexNormals();
    const wall = new THREE.Mesh(geo, toon('#ffffff', { vertexColors: true, side: THREE.DoubleSide })); wall.receiveShadow = true; world.add(wall); registerLandmark(wall, 'テンゲル・カルデラの壁');
    const topAt = (a, dr) => new V3(cr.x + Math.cos(a) * (R0 + dr), wallH(a) * (1 - 0.08 * clamp((dr - 95) / 205, 0, 1)), cr.z + Math.sin(a) * (R0 + dr));
    // カルデラの壁の上のモクマオウ（チュマラ）の林
    const trees = [];
    for (let i = 0; i < 260; i++) { const a = rand(0, Math.PI * 2); if (Math.abs(angDiff(a, aHome)) < 0.22) continue; const p = topAt(a, rand(100, 290)), h = rand(14, 26); trees.push({ p: p.add(new V3(0, h / 2, 0)), s: new V3(h * 0.22, h, h * 0.22), c: C(['#2f5a3a', '#3a6a40', '#2a4f34'][i % 3]) }); }
    addInst(CONE, toon('#ffffff'), trees, false);
    // チュモロ・ラワンの村：色とりどりの壁とトタン屋根の家が、カルデラの縁に並ぶ
    const houses = [], roofs = [], roofGeo = new THREE.ConeGeometry(1, 1, 4); roofGeo.rotateY(Math.PI / 4);
    for (let i = 0; i < 80; i++) {
      const a = aHome + rand(-0.2, 0.2), p = topAt(a, rand(105, 200)), w = rand(9, 14), h = rand(6, 10), yaw = rand(0, 3);
      houses.push({ p: p.clone().add(new V3(0, h / 2, 0)), s: new V3(w, h, w * 0.8), r: [0, yaw, 0], c: C(['#e98aa6', '#7fc49a', '#79a8d9', '#f0d36a', '#f2efe6', '#c99ad9'][i % 6]) });
      roofs.push({ p: p.clone().add(new V3(0, h + 2, 0)), s: new V3(w * 0.78, 4, w * 0.62), r: [0, yaw, 0], c: C(['#b5452f', '#4f6f9a', '#8a8f94'][i % 3]) });
    }
    addInst(BOX, toon('#ffffff'), houses); addInst(roofGeo, toon('#ffffff'), roofs, false);
    const village = fantasyGroup(topAt(aHome, 150).add(new V3(0, 30, 0))); signAt(village, 'チュモロ・ラワンの村', 0, 90);
    // プナンジャカンの展望台：日の出を待つ人々が並ぶ、カルデラの縁でいちばん高い所
    const pen = registerLandmark(fantasyGroup(topAt(aPen, 105)), 'プナンジャカンの展望台'); pen.rotation.y = -aPen;
    addBox(pen, [30, 3, 46], [0, 1.5, 0], toon('#c9c0b2'), null, 0.02); addBox(pen, [10, 8, 12], [8, 7, 0], toon('#e8e2d6'), null, 0.02);
    part(pen, new THREE.ConeGeometry(1, 1, 4), toon('#b5452f'), [8, 13, 0], [9, 4, 9], [0, Math.PI / 4, 0], 0);
    pen.updateMatrixWorld(true);
    const watchers = []; for (let i = 0; i < 40; i++) watchers.push({ p: pen.localToWorld(new V3(rand(-14, -4), 4.4, rand(-21, 21))), s: new V3(1.4, 2.4, 1.4), c: C(sarongCols[i % sarongCols.length]) });
    addInst(SPH_LO, toon('#ffffff'), watchers, false);
    signAt(pen, 'プナンジャカンの展望台', 40, 70);
    // サバンナの丘（「テレタビーズの丘」）：カルデラの底の、草におおわれたまるい丘
    const hills = [], grass = [];
    for (let i = 0; i < 26; i++) {
      const a = aSav + rand(-0.45, 0.45), r = rand(560, 720), p = new V3(cr.x + Math.cos(a) * r, 0, cr.z + Math.sin(a) * r), w = rand(35, 70);
      hills.push({ p: p.clone().add(new V3(0, -2, 0)), s: new V3(w, rand(14, 30), w * rand(0.7, 1.1)), r: [0, rand(0, 3), 0], c: C(['#7fa652', '#8db65c', '#6f9a48'][i % 3]) });
      for (let k = 0; k < 6; k++) grass.push({ p: p.clone().add(new V3(rand(-w, w) * 1.2, 0.6, rand(-w, w) * 1.2)), s: new V3(rand(3, 6), 1.2, rand(3, 6)), c: C('#8db65c') });
    }
    addInst(SPH_LO, toon('#ffffff'), hills, false); addInst(SPH_LO, toon('#ffffff'), grass, false);
    const sav = fantasyGroup(new V3(cr.x + Math.cos(aSav) * 620, 50, cr.z + Math.sin(aSav) * 620)); signAt(sav, 'サバンナの丘', 0, 56);
  }

  /* ---- 第2区間の彼方：ジャワ島最高峰スメル山（マハメル）。数十分おきに噴煙を上げる（ここでは少し早回し） ---- */
  {
    const H = 600, base = new V3(cr.x + Math.cos(aSemeru) * 1250, -1, cr.z + Math.sin(aSemeru) * 1250);
    const prof = [[400, 0], [280, H * 0.18], [170, H * 0.5], [75, H * 0.84], [26, H - 6], [0, H]].map(([r, y]) => new THREE.Vector2(r, y));
    const geo = new THREE.LatheGeometry(prof, 48), cols = [], c = new THREE.Color(), lowC = C('#5d6a6c'), highC = C('#8a7f7a'), streak = C('#a59a92');
    const pp = geo.attributes.position;
    for (let i = 0; i < pp.count; i++) { const y = pp.getY(i), a = Math.atan2(pp.getZ(i), pp.getX(i)); c.copy(lowC).lerp(highC, clamp(y / H * 1.6, 0, 1)); if (y > H * 0.35 && Math.sin(a * 20) > 0.6) c.lerp(streak, 0.6); cols.push(c.r, c.g, c.b); }
    geo.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
    const semeru = new THREE.Mesh(geo, toon('#ffffff', { vertexColors: true, side: THREE.DoubleSide })); semeru.position.copy(base); world.add(semeru); registerLandmark(semeru, 'スメル山');
    const sg = fantasyGroup(base.clone().add(new V3(0, H + 70, 0))); signAt(sg, 'スメル山（マハメル）', 0, 120);
    const ashMat = toon('#bdb4ad', { transparent: true, opacity: 0.85 }), puffs = Array.from({ length: 5 }, (_, k) => {
      const m = part(world, SPH_LO, ashMat, [base.x, base.y + H, base.z], [1, 1, 1], null, 0); m.userData.droneIgnore = true; m.castShadow = false;
      return { m, ox: rand(-25, 25), oz: rand(-25, 25), k };
    });
    updates.push(t => {
      const m = reduced.matches ? 5 : t, u = mod(m / 26, 1), p = Math.min(1, u / 0.7);
      ashMat.opacity = 0.85 * (1 - p);
      for (const o of puffs) { const s = 18 + p * (70 + o.k * 18); o.m.visible = u < 0.7; o.m.scale.set(s, s * 0.8, s); o.m.position.set(base.x + o.ox * p * 2 + wind.x * p * 60, base.y + H + 10 + p * (150 + o.k * 45), base.z + o.oz * p * 2 + wind.z * p * 60); }
    });
  }

  /* ---- 第3区間の外：バトック山。火口のない円い頂と、裾まで刻まれた放射状の深い溝 ---- */
  {
    const p0 = tp(at(3, 0.5), W / 2).v.sub(C0).setY(0).normalize().multiplyScalar(480).add(new V3(cr.x, -1, cr.z));
    const geo = new THREE.CylinderGeometry(1, 1, 1, 96, 14, false), pp = geo.attributes.position, cols = [], c = new THREE.Color(), green = C('#6d7f4e'), grey = C('#a39890');
    for (let i = 0; i < pp.count; i++) {
      const x = pp.getX(i), y = pp.getY(i), z = pp.getZ(i), f = y + 0.5, a = Math.atan2(z, x), rr = Math.hypot(x, z);
      const groove = Math.cos(a * 26), r = rr < 1e-3 ? 0 : lerp(1, 0.16, Math.pow(f, 0.7)) * (1 + 0.07 * groove * (1 - f * 0.6));
      pp.setXYZ(i, Math.cos(a) * r, f, Math.sin(a) * r);
      c.copy(grey).lerp(green, groove < -0.2 ? 0.8 : f > 0.85 ? 0.5 : 0.15); cols.push(c.r, c.g, c.b);
    }
    geo.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3)); geo.computeVertexNormals();
    const batok = new THREE.Mesh(geo, toon('#ffffff', { vertexColors: true })); batok.position.copy(p0); batok.scale.set(118, 96, 118); batok.castShadow = batok.receiveShadow = true; world.add(batok);
    registerLandmark(batok, 'バトック山');
    const sg = fantasyGroup(p0.clone().add(new V3(0, 112, 0))); signAt(sg, 'バトック山', 0, 40);
  }

  /* ---- 第4区間の外：砂の海から火口の縁へ上がる約250段の階段と手すり、麓で客を待つ馬方の馬 ---- */
  let walkers = [];
  {
    const f = tp(sSt, W / 2), steps = [], posts = [], rails = [[], []], railBeams = [];
    const along = v => onGround(local(sSt, 0, v));
    for (let v = W / 2 + 4, k = 0; v < W / 2 + 84; v += 0.42, k++) {
      const p = along(v); steps.push({ p: p.clone().add(new V3(0, 0.12, 0)), s: new V3(5.2, 0.34, 0.6), r: [0, -f.h, 0] });
      if (k % 5 === 0) for (const [j, sd] of [[0, -1], [1, 1]]) { const q = p.clone().add(f.dir.clone().multiplyScalar(sd * 2.7)); q.y = p.y; posts.push({ p: q.clone().add(new V3(0, 0.55, 0)), s: new V3(0.09, 1.1, 0.09) }); rails[j].push(q.clone().add(new V3(0, 1.1, 0))); }
    }
    for (const r of rails) for (let i = 1; i < r.length; i++) railBeams.push(beam(r[i - 1], r[i], 0.1));
    world.add(inst(BOX, toon('#b3aca3'), steps), inst(CYL, toon('#4f78a8'), posts, false), inst(BOX, toon('#4f78a8'), railBeams, false));
    const top = registerLandmark(fantasyGroup(along(W / 2 + 6)), 'ブロモ山の階段'); signAt(top, 'ブロモ山の階段（約250段）', 7, 16);
    // 階段を上り下りする人々
    const path = []; for (let v = W / 2 + 4; v < W / 2 + 84; v += 2) path.push(along(v));
    const stair = route(path, false);
    walkers = Array.from({ length: 12 }, (_, i) => { const o = person(world, ['#e85a3a', '#3a8ad9', '#f2c040', '#6aa84a', '#c94aa0', '#f2f0ea'][i % 6], '#f2f0ea'); o.g.userData.droneIgnore = true; return { ...o, u: rand(0, stair.L), up: i % 2 ? 1 : -1, lane: rand(-1.8, 1.8) }; });
    updates.push((t, dt) => {
      const m = reduced.matches ? 0 : t;
      for (const w of walkers) {
        if (!reduced.matches) { w.u += w.up * dt * 0.9; if (w.u > stair.L || w.u < 0) { w.up *= -1; w.u = clamp(w.u, 0, stair.L); } }
        const { p, yaw } = stair.at(w.u); w.g.position.copy(p).add(f.dir.clone().multiplyScalar(w.lane)); w.g.position.y = groundAt(w.g.position) + 0.2; w.g.rotation.y = yaw + (w.up > 0 ? Math.PI : 0) + Math.PI / 2;
        w.legs.forEach((l, i) => { l.rotation.x = Math.sin(m * 6 + w.u + i * Math.PI) * 0.45; });
      }
    });
    // 麓：客を待つ馬と馬方、土産の屋台
    const foot = along(W / 2 + 96), g = registerLandmark(fantasyGroup(foot), '馬方の溜まり'); g.rotation.y = -f.h; g.updateMatrixWorld(true);
    for (let i = 0; i < 6; i++) {
      const h = horse(g, ['#6a4a34', '#3a2c26', '#d9d2c4', '#8a5a3a', '#5a5654', '#a87a4a'][i]); h.g.position.set(-10 + i * 4, 0, rand(-6, -2)); h.g.rotation.y = rand(-0.4, 0.4) + Math.PI / 2;
      const p = person(g, sarongCols[i]); p.g.position.set(-9 + i * 4, 0, rand(-9, -7));
    }
    for (let i = 0; i < 3; i++) {
      const x = -6 + i * 8; for (const [dx, dz] of [[-2.5, 2], [2.5, 2], [-2.5, 6], [2.5, 6]]) addBox(g, [0.2, 3, 0.2], [x + dx, 1.5, dz], toon('#7a5536'));
      addBox(g, [6, 0.2, 5], [x, 3.1, 4], toon(['#3a8ad9', '#e85a3a', '#f2c040'][i]), [0.12, 0, 0]); addBox(g, [5, 1, 1.4], [x, 0.9, 2.5], toon('#a8875a'));
      const goods = []; for (let k = 0; k < 10; k++) goods.push({ p: g.localToWorld(new V3(x + rand(-2.2, 2.2), 1.55, 2.5 + rand(-0.5, 0.5))), s: new V3(0.3, 0.3, 0.3), c: C(['#f2f0ea', '#e98aa6', '#c94aa0', '#f2c040'][k % 4]) });
      addInst(SPH_LO, toon('#ffffff'), goods, false);
    }
  }

  /* ---- 第5区間の外：ポテン寺院（プラ・ルフール・ポテン）。砂の海の中のテンゲルの人々のヒンドゥー寺院 ---- */
  {
    const sP = at(5, 0.35), g = site('ポテン寺院', sP, W / 2 + 118, 46, 36, '#5a5052');
    // 溶岩石の塀：表（走路側 -z）の真ん中に割れ門、奥の中庭との間に屋根付きの門（コリ・アグン）
    for (const [x, z, w, d] of [[-14, -18, 18, 1.4], [14, -18, 18, 1.4], [0, 18, 46, 1.4], [-23, 0, 1.4, 36], [23, 0, 1.4, 36], [-14, 2, 18, 1], [14, 2, 18, 1]]) {
      addBox(g, [w, 3, d], [x, 1.5, z], lavaStone, null, 0.02); addBox(g, [w + 0.3, 0.4, d + 0.3], [x, 3.2, z], lavaStone2);
    }
    const gate = new THREE.Group(); gate.position.set(0, 0, -18); gate.rotation.y = Math.PI / 2; g.add(gate); candiBentar(gate, 4, 11, lavaStone, lavaStone2, 3);
    const roof4 = new THREE.ConeGeometry(1, 1, 4); roof4.rotateY(Math.PI / 4);
    addBox(g, [7, 9, 3], [0, 4.5, 2], lavaStone2, null, 0.02); addBox(g, [2.4, 4, 0.2], [0, 2, 0.4], toon('#6a3a22'));
    part(g, roof4, thatch, [0, 10.6, 2], [6, 3.4, 4], null, 0.03);
    // メル（屋根を奇数段重ねた塔）：黒いシュロの毛（イジュク）葺き
    const meru = (x, z, n) => {
      addBox(g, [4, 3, 4], [x, 1.5, z], lavaStone2, null, 0.02); part(g, CYL, toon('#6a3a22'), [x, 3 + n * 0.75, z], [0.3, n * 1.5 + 1, 0.3], null, 0);
      for (let k = 0; k < n; k++) part(g, roof4, thatch, [x, 3.8 + k * 1.45, z], [5.2 * (1 - k * 0.085), 1.2, 5.2 * (1 - k * 0.085)], null, 0.03);
      part(g, CONE, gold, [x, 4.6 + n * 1.45, z], [0.35, 1.2, 0.35], null, 0);
    };
    meru(-15, 11, 7); meru(-7, 12, 5); meru(16, 11, 3);
    // パドマサナ（空の玉座の石の塔）と、休み処の東屋（バレ）
    for (let k = 0; k < 6; k++) addBox(g, [5 - k * 0.6, 1.4, 5 - k * 0.6], [7, 0.7 + k * 1.4, 12], k % 2 ? lavaStone2 : lavaStone, null, 0.02);
    addBox(g, [2.2, 2.6, 0.4], [7, 9.6, 13.2], gold);
    for (const [dx, dz] of [[-3, -2.5], [3, -2.5], [-3, 2.5], [3, 2.5]]) addBox(g, [0.35, 3.6, 0.35], [12 + dx, 2.4, -9 + dz], toon('#7a5536'));
    addBox(g, [7, 0.6, 6], [12, 0.6, -9], lavaStone2); part(g, roof4, thatch, [12, 5.6, -9], [6, 2.4, 5], null, 0.03);
    signAt(g, 'ポテン寺院（プラ・ルフール・ポテン）', 22, 22);
    // 寺院と階段の麓を行き来する、客を乗せた馬と、手綱を引く馬方
    const a = onGround(local(sP, 0, W / 2 + 96)), b = onGround(local(sSt, 0, W / 2 + 100)), mid = onGround(local((sP + sSt) / 2, 0, W / 2 + 112));
    const pts = []; for (let i = 0; i <= 24; i++) { const k = i / 24; pts.push(onGround(new V3().copy(a).multiplyScalar((1 - k) ** 2).add(mid.clone().multiplyScalar(2 * k * (1 - k))).add(b.clone().multiplyScalar(k * k)))); }
    const trail = route(pts, false);
    pathRibbon(pts, 3, 0.05, toon('#867c76'), W / 2 + 20);
    const riders = Array.from({ length: 6 }, (_, i) => {
      const root = fantasyGroup(); root.userData.droneIgnore = true;
      const h = horse(root, ['#6a4a34', '#d9d2c4', '#3a2c26', '#8a5a3a', '#5a5654', '#a87a4a'][i]);
      const rider = person(h.g, ['#e85a3a', '#3a8ad9', '#f2c040', '#6aa84a', '#c94aa0', '#f2f0ea'][i], '#f2f0ea'); rider.g.position.set(0, 1.45, 0); rider.legs.forEach((l, k) => { l.rotation.x = k ? -1.2 : 1.2; });
      const guide = person(root, sarongCols[(i + 3) % sarongCols.length]); guide.g.position.set(1.2, 0, 1.3);
      return { root, h, guide, u: i / 6 * trail.L * 2, v: rand(1.6, 2.1) };
    });
    updates.push((t, dt) => {
      const m = reduced.matches ? 0 : t;
      for (const r of riders) {
        if (!reduced.matches) r.u += r.v * dt;
        const k = mod(r.u, trail.L * 2), back = k > trail.L, { p, yaw } = trail.at(back ? trail.L * 2 - k : k);
        r.root.position.copy(p); r.root.position.y = groundAt(p); r.root.rotation.y = yaw + (back ? Math.PI : 0);
        r.h.legs.forEach((l, i) => { l.rotation.z = Math.sin(m * 5 + r.u + (i === 0 || i === 3 ? 0 : Math.PI)) * 0.4; });
        r.guide.legs.forEach((l, i) => { l.rotation.z = Math.sin(m * 5 + r.u + i * Math.PI) * 0.45; });
      }
    });
  }

  /* ---- 外の斜面のふもと：ジャワのエーデルワイスの株と、点在するモクマオウ ---- */
  {
    const shrubs = [], flowers = [], trees = [];
    for (const p of scatter(120, 0, track.L, W / 2 + 70, W / 2 + 190, W / 2 + 60)) {
      if (Math.abs(angDiff(angOf(p), aBatok)) < 0.3) continue;
      shrubs.push({ p: p.clone().add(new V3(0, 0.5, 0)), s: new V3(rand(1, 1.8), rand(0.7, 1.2), rand(1, 1.8)), c: C(['#8a9a7a', '#9aa58a', '#7f8f70'][(Math.random() * 3) | 0]) });
      for (let k = 0; k < 4; k++) flowers.push({ p: p.clone().add(new V3(rand(-1.2, 1.2), rand(1, 1.5), rand(-1.2, 1.2))), s: new V3(0.22, 0.12, 0.22) });
    }
    for (const p of scatter(40, 0, track.L, W / 2 + 120, W / 2 + 220, W / 2 + 90)) { if (Math.abs(angDiff(angOf(p), aBatok)) < 0.35) continue; const h = rand(9, 16); trees.push({ p: p.clone().add(new V3(0, h / 2, 0)), s: new V3(h * 0.22, h, h * 0.22), c: C(['#2f5a3a', '#3a6a40'][trees.length % 2]) }); }
    addInst(SPH_LO, toon('#ffffff'), shuffle(shrubs), false); addInst(SPH_LO, toon('#f4f1e6', { emissive: C('#3a3a30'), emissiveIntensity: 0.3 }), shuffle(flowers), false);
    addInst(CONE, toon('#ffffff'), shuffle(trees), false); addInst(CYL, toon('#5a4636'), trees.map(o => ({ p: o.p.clone().setY(o.p.y - o.s.y / 2 + 1), s: new V3(0.35, 2, 0.35) })), false);
  }

  // 漂う火山灰と火の粉、砂の海をささやくように流れる砂（パシール・ブルビシク）
  const ashCol = C('#cfc8c2'), emberCol = C('#ffae66').multiplyScalar(2), sandCol = C('#b9b0a8');
  ambient(TEX_SOFT, false, 14, (a, c) => {
    const k = Math.random();
    if (k < 0.35) a.emit(c.x + rand(-60, 60), c.y + rand(-4, 18), c.z + rand(-60, 60), wind.x * 2 + rand(-0.4, 0.4), rand(-0.3, 0.2), wind.z * 2 + rand(-0.4, 0.4), 7, rand(0.12, 0.25), ashCol, 0, 0);
    else if (k < 0.6) a.emit(c.x + rand(-50, 50), c.y + rand(-6, 8), c.z + rand(-50, 50), rand(-0.4, 0.4), rand(0.4, 1.4), rand(-0.4, 0.4), 4, rand(0.1, 0.2), emberCol, 0, 0);
    else { const p = new V3(c.x + rand(-70, 70), 0, c.z + rand(-70, 70)); a.emit(p.x, groundAt(p) + rand(0.2, 1.2), p.z, wind.x * 7 + rand(-1, 1), 0, wind.z * 7 + rand(-1, 1), 3, rand(0.3, 0.6), sandCol, 0, 0); }
  }, true);

  // ゴール：竜が火口の上へ伸び上がって空へ火を噴き、溶岩の湖から火柱が上がる
  themeFinish = () => { celebration = 8; }; themeReset = () => { celebration = 0; dragonLift = 0; };
  const burstCols = ['#ffd27a', '#ff8a3a', '#ffe9b0'].map(c => C(c).multiplyScalar(2.2));
  updates.push((t, dt) => {
    if (celebration <= 0) return;
    celebration = Math.max(0, celebration - dt);
    if (reduced.matches) return;
    const y = lake.position.y, n = lightQuality() ? 4 : 10;
    for (let i = 0; i < n; i++) {
      const a = rand(0, Math.PI * 2), r = rand(0, 14);
      fireP.emit(C0.x + Math.cos(a) * r, y + 1, C0.z + Math.sin(a) * r, rand(-3, 3), rand(22, 38), rand(-3, 3), rand(1.4, 2.4), rand(2, 4), burstCols[i % 3], 14, 0.2);
      if (i < 3) sparkP.emit(C0.x + rand(-20, 20), y + rand(30, 60), C0.z + rand(-20, 20), rand(-4, 4), rand(2, 6), rand(-4, 4), rand(1.5, 2.5), rand(0.6, 1.2), burstCols[i % 3], 2, 0.4);
    }
  });
  themeUpd.push((t, dt) => { for (const f of updates) f(t, dt); });
}
// 観覧席：テンゲルの人々の寺院を思わせる、黒い溶岩石の壁と、黒いシュロの毛葺きの重ね屋根。屋上に祭りの吹き流し（ウンブル・ウンブル）
function decorDragonCraterStand(stand, len, z0, roof) {
  const g = new THREE.Group(); stand.add(g); registerLandmark(g, 'dragonCrater-stand');
  roof.visible = false;
  const recolor = { [C('#f2eef8').getHex()]: '#5a4f50', [C('#e3dcef').getHex()]: '#6c5f5e', [C('#d9d3e6').getHex()]: '#3a3133' };
  stand.children.forEach(o => { if (o.isMesh && !o.isInstancedMesh && o.material.color && recolor[o.material.color.getHex()]) o.material.color.set(recolor[o.material.color.getHex()]); });
  const stone = toon('#3f3739'), thatch = toon('#2a2426'), gold = toon('#d6aa4a');
  // 浮き彫りの帯：溶岩石に、花と渦の文様
  const relief = ctex(256, 64, c => {
    c.fillStyle = '#4a4042'; c.fillRect(0, 0, 256, 64); c.strokeStyle = '#8a7a70'; c.lineWidth = 3;
    for (let x = 16; x < 256; x += 32) { c.beginPath(); c.arc(x, 32, 11, 0, Math.PI * 2); c.stroke(); c.beginPath(); c.arc(x, 32, 4, 0, Math.PI * 2); c.stroke(); c.beginPath(); c.moveTo(x + 16, 8); c.lineTo(x + 16, 56); c.stroke(); }
    c.strokeRect(2, 2, 252, 60);
  }, true);
  relief.repeat.set(len / 12, 1);
  addBox(g, [len + 4, 2, 0.5], [0, 12.2, z0 - 1.6], toon('#ffffff', { map: relief }));
  addBox(g, [len + 6, 0.8, 22], [0, 13.3, z0 + 8.5], stone, null, 0.02);
  // 重ね屋根：5棟の東屋が並ぶように、黒い四角錐の屋根を2段ずつ
  const roof4 = new THREE.ConeGeometry(1, 1, 4); roof4.rotateY(Math.PI / 4);
  for (let i = 0; i < 5; i++) {
    const x = -len / 2 + (i + 0.5) * len / 5, w = len / 5 * 0.62;
    part(g, roof4, thatch, [x, 16.2, z0 + 8.5], [w, 5, 15], null, 0.02); part(g, roof4, thatch, [x, 20.4, z0 + 8.5], [w * 0.55, 3.4, 8], null, 0.02);
    part(g, CONE, gold, [x, 22.8, z0 + 8.5], [0.5, 1.6, 0.5], null, 0);
  }
  // 吹き流し：しなる竹竿に、白・黄・赤・黒の細長い旗
  const cols = ['#f6f0e0', '#e9c04a', '#c23a2a', '#2a2426'];
  for (let i = 0; i <= 10; i++) {
    const x = -len / 2 + i * len / 10;
    addBox(g, [0.25, 14, 0.25], [x, 20, z0 + 19], toon('#d9c27a'));
    const flag = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 8), toon(cols[i % 4], { side: THREE.DoubleSide })); flag.position.set(x + 0.8, 22.5, z0 + 19); g.add(flag);
  }
}
