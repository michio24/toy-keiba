// 桜花ヶ丘ステークス
'use strict';

/* ---- 桜花ヶ丘ステークス：奈良・吉野山（世界遺産「紀伊山地の霊場と参詣道」）の千本桜を下敷きにした花の山 ---- */
// 見立て：山すそから下千本・中千本・上千本・奥千本と咲き上っていく吉野山を、花の山をひと回りするコースに。
// 区間の役割：0 花見の桟敷のホーム直線／1 下千本：吉野ロープウェイと黒門、門前町（葛・柿の葉寿司・陀羅尼助の店）／
// 2 銅の鳥居（発心門）をくぐって上り、金峯山寺の仁王門と蔵王堂（四本桜）／3 七曲り坂のくねりと吉水神社（一目千本）、内に竹林院／
// 4 上千本：花矢倉の展望台と吉野水分神社の楼門（最高地点）／5 奥千本：吉野杉の森、金峯神社、西行庵と苔清水／
// 6 花吹雪の下り：花見茶屋と如意輪寺の多宝塔／7 吉野川の花筏と柳の渡し。
// 内馬場は花見の宴と屋台、ぼんぼりの小径、千年の枝垂れ桜（ファンタジー）。門前町を花供会式の山伏の行列が練り歩く
function decorSakura(th) {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const { shuffle, roadDist, occupied, taken, clearAt, groundAt, onGround, local, at, label, site, PRISM, CYL, CYL_T, addInst, pathRibbon, beam, route } = sceneryKit();
  const n0 = world.children.length, updates = [];
  // 案内板は生成りの地に、桜の濃い紅の文字
  const signAt = (g, text, y, w = 14) => { const sp = label(text, w, w / 4, '#fff4f6', '#b02e5c'); sp.position.set(0, y, 0); sp.scale.set(w, w / 4, 1); g.add(sp); return sp; };
  const pick = a => a[(Math.random() * a.length) | 0];
  const rot = (x, z, yaw) => [x * Math.cos(yaw) + z * Math.sin(yaw), -x * Math.sin(yaw) + z * Math.cos(yaw)];
  const wood = toon('#8a5f40'), darkWood = toon('#4a3427'), plaster = toon('#f2ece0'), tile = toon('#5d626c'), hiwada = toon('#5b4335');
  const vermilion = toon('#d24a32'), gold = toon('#d9b24c'), stone = toon('#b9b3a6'), bronze = toon('#4f4a40'), steel = toon('#7d7a80');
  const roof4 = new THREE.ConeGeometry(1, 1, 4); roof4.rotateY(Math.PI / 4);
  const yawAt = s => -tp(s, W / 2).h;
  // 地面に沿う帯（参道・川・小径）：帯は下向きに張られるので両面で描く
  const flat = (c, extra) => toon(c, { side: THREE.DoubleSide, ...extra });
  let celebration = 0;

  // 立っている人・座っている人（体と頭はまとめて描く）
  const people = [], heads = [], kimono = ['#e8749a', '#f2b8cc', '#7aa6d9', '#f2d36b', '#9ad08a', '#f4f1ea', '#c86bb0', '#ff9f6b', '#5a6fa8', '#4f8f7a'].map(C);
  const addPerson = (p, sit = false) => {
    people.push({ p: p.clone().add(new V3(0, sit ? 0.55 : 0.95, 0)), s: new V3(1, sit ? 0.62 : 1, 1), c: pick(kimono) });
    heads.push({ p: p.clone().add(new V3(0, sit ? 1.3 : 1.95, 0)), s: new V3(0.26, 0.28, 0.26) });
  };
  // 桜の木：幹と、花の房（下千本は満開の濃い桃色、上ほど白い山桜に赤い若葉、奥千本は咲き始め）
  const trunkG = new THREE.CylinderGeometry(0.35, 0.55, 3.4, 7); trunkG.translate(0, 1.7, 0);
  const blobG = new THREE.IcosahedronGeometry(1, 1);
  const PAL = { full: ['#ffc4dc', '#ffd6e7', '#ffb3d1', '#ffe3ee', '#f7a8c8'], yama: ['#fbe5ee', '#fff1f6', '#f6d2e0', '#ffe2ec', '#fbe5ee', '#d9a596'], bud: ['#f7e9ee', '#e3edd2', '#fff6f8', '#d6e6c4'] };
  const palC = Object.fromEntries(Object.entries(PAL).map(([k, v]) => [k, v.map(C)]));
  const trees = [];
  const addTree = (p, sc, pal = 'full', blobs = 5) => {
    const tr = { t: { p: p.clone(), s: new V3(sc, sc, sc), r: [0, rand(0, 6), 0] }, b: [] }; trees.push(tr);
    for (let j = 0; j < blobs; j++) { const br = rand(1.4, 2.2) * sc; tr.b.push({ p: new V3(p.x + rand(-1.6, 1.6) * sc, p.y + (3.6 + rand(0, 1.8)) * sc, p.z + rand(-1.6, 1.6) * sc), s: new V3(br, br * 0.85, br), c: pick(palC[pal]) }); }
  };
  // 吉野杉：細く高い円錐を2段重ねる
  const cedarG = new THREE.ConeGeometry(1, 1, 8); cedarG.translate(0, 0.5, 0);
  const cedars = [], cedarTrunks = [];
  const addCedar = (p, h) => {
    cedarTrunks.push({ p: p.clone().add(new V3(0, h * 0.2, 0)), s: new V3(0.45, h * 0.4, 0.45) });
    cedars.push({ p: p.clone().add(new V3(0, h * 0.18, 0)), s: new V3(h * 0.17, h * 0.62, h * 0.17), r: [0, rand(0, 3), 0], c: C(pick(['#2f5a3a', '#34613f', '#2a5235'])) });
    cedars.push({ p: p.clone().add(new V3(0, h * 0.5, 0)), s: new V3(h * 0.12, h * 0.5, h * 0.12), r: [0, rand(0, 3), 0], c: C(pick(['#386845', '#2f5a3a'])) });
  };
  // 文字入りの板（木の看板・屋台ののれん）。同じ文字は1枚の材質を共有して、インスタンスでまとめて描く
  const boardMats = new Map(), boardLists = new Map();
  const boardTex = (text, bg, fg, rim) => ctex(512, 128, g => {
    g.fillStyle = bg; g.fillRect(0, 0, 512, 128); g.strokeStyle = rim; g.lineWidth = 8; g.strokeRect(6, 6, 500, 116);
    g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = '900 72px "Dela Gothic One", serif'; g.fillText(text, 256, 68, 470);
  });
  const putBoard = (text, c, yaw, w, style = 'wood') => {
    const key = style + text;
    if (!boardMats.has(key)) {
      const [bg, fg, rim] = style === 'wood' ? ['#4a2f20', '#f6e7c8', '#c9a04a'] : style === 'stall' ? ['#fff6ea', '#c8303a', '#c8303a'] : ['#f6efe0', '#3a2a20', '#7a5a3a'];
      boardMats.set(key, toon('#ffffff', { map: boardTex(text, bg, fg, rim) })); boardLists.set(key, []);
    }
    boardLists.get(key).push({ p: c.clone(), s: new V3(w, w / 4, 1), r: [0, yaw, 0] });
  };

  /* ---- 座標の準備：内馬場の判定、区間の案内板とスタンドの敷地は空けておく ---- */
  const poly = []; for (let i = 0; i < track.N; i += 8) poly.push([track.xs[i], track.zs[i]]);
  const inLoop = (x, z) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, zi] = poly[i], [xj, zj] = poly[j]; if ((zi > z) !== (zj > z) && x < (xj - xi) * (z - zi) / (zj - zi) + xi) c = !c; } return c; };
  for (const z of track.zones) { const q = tp((z.start + z.end) / 2, W + 9).v; occupied.push({ x: q.x, z: q.z, r: 11 }); }
  for (let s = track.homeS0 - 10; s <= track.homeS1 + 10; s += 10) { const p = local(s, 0, W / 2 + 30); occupied.push({ x: p.x, z: p.z, r: 23 }); }
  occupied.push({ x: boardPos.x, z: boardPos.z, r: 24 });

  /* ---- 外ラチ沿い：ぼんぼりの列と、手を振る花見客の人垣（下千本の発走地点、上千本、最後のコーナー） ---- */
  const railLanterns = [];
  {
    const poles = [];
    for (let s = 0; s < track.L; s += 14) {
      if (s > track.homeS0 - 4 && s < track.homeS1 + 4) continue;   // ホーム直線はスタンドの紅白幕と提灯
      const p = onGround(local(s, 0, W / 2 + 3.4));
      if (taken(p.x, p.z, 1)) continue;
      poles.push({ p: p.clone().add(new V3(0, 0.9, 0)), s: new V3(0.08, 1.8, 0.08) }); railLanterns.push({ p: p.clone().add(new V3(0, 2.1, 0)), s: new V3(0.32, 0.55, 0.32) });
    }
    addInst(new THREE.CylinderGeometry(1, 1, 1, 6), toon('#3a2a20'), poles, false);
    const crowdAt = (s0, s1, n) => {
      for (let k = 0; k < n; k++) {
        const s = rand(s0, s1), p = onGround(local(s, 0, W / 2 + rand(5, 9.5)));
        if (taken(p.x, p.z, 0.4)) continue;
        addPerson(p); occupied.push({ x: p.x, z: p.z, r: 0.6 });
      }
      for (let s = s0; s < s1; s += 9) { const p = local(s, 0, W / 2 + 7); occupied.push({ x: p.x, z: p.z, r: 4 }); }
    };
    crowdAt(at(1, 0.35), at(1, 0.95), 70); crowdAt(at(4, 0.1), at(4, 0.32), 30); crowdAt(at(7, 0.15), at(7, 0.85), 80);
  }

  /* ---- 遠景：千本桜に染まる吉野の山並み（下ほど満開、上ほど咲き始め）と、その奥の大峰山脈 ---- */
  {
    const base = Math.max(620, track.extent + 300), hills = [], dots = [], ridge = [];
    for (let i = 0; i < 26; i++) {
      const a = i / 26 * Math.PI * 2 + rand(-0.08, 0.08), r = base + rand(0, 160), rr = rand(150, 230), h = rand(70, 130);
      const p = new V3(Math.cos(a) * r, -12, Math.sin(a) * r);
      hills.push({ p, s: new V3(rr, h, rr), c: C(pick(['#6f9a62', '#7aa56a', '#668f5c'])) });
      for (let k = 0; k < 40; k++) {
        const hf = Math.random() ** 1.4 * 0.85, b = rand(0, Math.PI * 2), q = Math.sqrt(1 - hf * hf) * 1.01;
        dots.push({ p: new V3(p.x + Math.cos(b) * rr * q, p.y + h * hf, p.z + Math.sin(b) * rr * q), s: new V3(rand(9, 16), rand(6, 10), rand(9, 16)), c: C(hf < 0.45 ? pick(PAL.full) : pick(PAL.bud)) });
      }
    }
    const topDir = tp(at(5, 0.5), W / 2).v, a0 = Math.atan2(topDir.z, topDir.x);
    for (let i = 0; i < 15; i++) {
      const a = a0 - 1.1 + i / 14 * 2.2, r = base + rand(380, 470);
      ridge.push({ p: new V3(Math.cos(a) * r, -10, Math.sin(a) * r), s: new V3(rand(170, 240), rand(170, 250) + (i === 7 ? 80 : 0), rand(170, 240)), r: [0, rand(0, 3), 0] });
    }
    inst(SPH_LO, toon('#ffffff'), hills, false).userData.backdrop = true;
    inst(SPH_LO, toon('#ffffff'), dots, false).userData.backdrop = true;
    inst(cedarG, toon('#8ea4cc', { fog: true }), ridge, false).userData.backdrop = true;
  }

  /* ---- 下千本（第1区間の外）：吉野ロープウェイ。山すその千本口駅から吉野山駅へ、2台のゴンドラが行き違う（交走式） ---- */
  {
    const foot = onGround(local(at(1, 0.12), 0, W / 2 + 96)), top = onGround(local(at(1, 0.9), 0, W / 2 + 52));
    const dir = top.clone().sub(foot).setY(0).normalize(), side = new V3(-dir.z, 0, dir.x), yaw = -Math.atan2(dir.z, dir.x);
    // 架線の高さ：途中の地面（と走路）から十分に離れるまで持ち上げる
    let hA = 9, hB = 9;
    for (let k = 1; k < 24; k++) {
      const t = k / 24, p = foot.clone().lerp(top, t), y = lerp(foot.y + hA, top.y + hB, t);
      const need = Math.max(groundAt(p), roadDist(p.x, p.z, W) < W ? track.pos(at(1, 0.5), W / 2).y : 0) + 12;
      if (y < need) { hA += need - y; hB += need - y; }
    }
    const station = (p, h, name, flip) => {
      const g = registerLandmark(fantasyGroup(p), name); g.rotation.y = yaw + (flip ? Math.PI : 0);
      landmarkFoundation(g, 14, 12, '#b9b3a6');
      addBox(g, [12, 7, 10], [0, 3.5, 0], plaster, null, 0.02); part(g, PRISM, toon('#9a3a32'), [0, 7, 0], [13, 3, 11], null, 0.02);
      addBox(g, [12.1, 2.2, 10.1], [0, 4.4, 0], toon('#bfe0f2')); addBox(g, [3, 3, 0.2], [-6.05, 1.5, 0], darkWood, [0, Math.PI / 2, 0]);
      // 架線を受ける鉄の門形
      for (const z of [-2.4, 2.4]) addBox(g, [0.5, h, 0.5], [7, h / 2, z], steel);
      addBox(g, [0.6, 0.6, 6], [7, h, 0], steel); part(g, CYL, toon('#c33a32'), [7, h + 0.6, 0], [1.2, 0.5, 1.2], [Math.PI / 2, 0, 0], 0);
      return g;
    };
    const gA = station(foot, hA, '吉野ロープウェイ（千本口駅）', false), gB = station(top, hB, '吉野ロープウェイ（吉野山駅）', true);
    signAt(gA, '吉野ロープウェイ（千本口駅）', hA + 5, 18); signAt(gB, '吉野山駅', hB + 4, 9);
    const A = foot.clone().addScaledVector(dir, 7).setY(gA.position.y + hA), B = top.clone().addScaledVector(dir, -7).setY(gB.position.y + hB);
    const cables = [];
    for (const sd of [-1.6, 1.6]) cables.push(beam(A.clone().addScaledVector(side, sd), B.clone().addScaledVector(side, sd), 0.08));
    addInst(BOX, toon('#2a2a30'), cables, false);
    const cabin = col => {
      const g = fantasyGroup(); g.userData.droneIgnore = true; g.rotation.y = yaw;
      addBox(g, [3.6, 2.4, 2.4], [0, -4.6, 0], toon(col), null, 0.03); addBox(g, [3.62, 0.9, 2.42], [0, -4.2, 0], toon('#cfe8f4'));
      addBox(g, [3.8, 0.3, 2.6], [0, -3.3, 0], toon('#f2efe6')); addBox(g, [0.15, 3.1, 0.15], [0, -1.8, 0], steel); addBox(g, [1.8, 0.45, 0.45], [0, -0.2, 0], steel);
      return g;
    };
    const cabins = [cabin('#c8342c'), cabin('#e8a33c')];
    updates.push(t => {
      const m = reduced.matches ? 12 : t, k = mod(m / 46, 1), tri = k < 0.5 ? k * 2 : 2 - k * 2, e = tri * tri * (3 - 2 * tri);
      cabins[0].position.lerpVectors(A, B, e).addScaledVector(side, -1.6); cabins[1].position.lerpVectors(B, A, e).addScaledVector(side, 1.6);
      cabins.forEach((c, i) => { c.rotation.z = Math.sin(m * 1.3 + i * 2) * 0.03; });
    });
    occupied.push({ x: foot.x, z: foot.z, r: 11 }, { x: top.x, z: top.z, r: 11 });
    // 架線の下には木を植えない
    for (let k = 0; k <= 10; k++) { const p = foot.clone().lerp(top, k / 10); occupied.push({ x: p.x, z: p.z, r: 4 }); }
  }

  /* ---- 第1〜3区間の外：門前町。黒門から金峯山寺の参道に、葛・柿の葉寿司・陀羅尼助の店が並ぶ ---- */
  const SV = W / 2 + 22, streetS0 = at(1, 0.82), streetS1 = at(3, 0.95), streetPts = [];
  for (let s = streetS0; s <= streetS1; s += 3) streetPts.push(onGround(local(s, 0, SV)));
  pathRibbon(streetPts, 6, 0.06, flat('#d3c7b0'), W / 2 + 6);
  {
    // 黒門：金峯山寺の総門。参道をまたぐ黒い高麗門
    const s = streetS0 + 3, c = onGround(local(s, 0, SV)), g = registerLandmark(fantasyGroup(c), '黒門'); g.rotation.y = yawAt(s);
    const black = toon('#2a2626');
    for (const z of [-3.8, 3.8]) { addBox(g, [0.7, 6.4, 0.7], [0, 3.2, z], black, null, 0.03); addBox(g, [0.5, 4, 0.5], [-1.8, 2, z], black); part(g, PRISM, tile, [-1.8, 4.2, z], [1.6, 0.9, 2.2], [0, Math.PI / 2, 0], 0); }
    addBox(g, [0.6, 0.7, 8.6], [0, 6.1, 0], black); part(g, PRISM, tile, [0, 6.5, 0], [10.4, 1.8, 3.2], [0, Math.PI / 2, 0], 0.02);
    for (const z of [-1.9, 1.9]) addBox(g, [0.15, 5.4, 3.6], [0, 2.8, z], toon('#3a3434'));
    signAt(g, '黒門（金峯山寺の総門）', 11, 15); occupied.push({ x: c.x, z: c.z, r: 6 });
  }
  // 町家：参道の外側に、格子と暖簾の店。局所 -z が参道（走路）の側
  const shopNames = ['吉野葛', '柿の葉寿司', '陀羅尼助', '葛餅', '吉野杉の箸', '茶店', '旅館', '草餅', '吉野土産', '葛きり', '和紙', '宿坊'];
  const mBody = [], mRoof = [], mLattice = [], mNoren = [], mEave = [];
  const machiyaRow = (s0, s1) => {
    for (let s = s0; s < s1;) {
      const w = rand(8, 11), d = rand(8, 10), h = rand(5.5, 6.5), sc = s + w / 2; s += w + rand(0.3, 1.2);
      const p = local(sc, 0, SV + 3.4 + d / 2), yaw = yawAt(sc);
      const corners = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, b]) => { const [ox, oz] = rot(a * w / 2, b * d / 2, yaw); return new V3(p.x + ox, 0, p.z + oz); });
      if (corners.some(q => roadDist(q.x, q.z, SV + 4) < SV + 2.5) || taken(p.x, p.z, Math.min(w, d) / 2 - 0.5)) continue;
      const y0 = Math.max(...corners.map(q => groundAt(q))) - 0.05;
      const L = (x, y, z) => { const [ox, oz] = rot(x, z, yaw); return new V3(p.x + ox, y0 + y, p.z + oz); };
      // 坂の町家は、低い側を石垣の台で支える
      mBody.push({ p: L(0, (h - 1.2) / 2, 0), s: new V3(w, h + 1.2, d), r: [0, yaw, 0], c: C(pick(['#efe7d6', '#e6dcc6', '#8a5f40', '#f4efe4'])) });
      mRoof.push({ p: L(0, h, 0), s: new V3(w + 0.8, 2.4, d + 1.2), r: [0, yaw, 0] });
      mEave.push({ p: L(0, 3.3, -d / 2 - 0.7), s: new V3(w + 0.4, 0.25, 1.6), r: [0, yaw, 0] });
      mLattice.push({ p: L(0, 1.5, -d / 2 - 0.08), s: new V3(w - 1, 2.6, 0.2), r: [0, yaw, 0] });
      mNoren.push({ p: L(rand(-w / 4, w / 4), 2.45, -d / 2 - 0.25), s: new V3(w * 0.42, 1.1, 0.06), r: [0, yaw, 0], c: C(pick(['#2d3f6e', '#8e2f3a', '#2f5f46', '#f2ece0', '#6a3f7a'])) });
      putBoard(pick(shopNames), L(0, 4.55, -d / 2 - 0.12), yaw + Math.PI, Math.min(w - 1.4, 6.4));
      for (let k = 0; k < 2; k++) addPerson(onGround(L(rand(-w / 2, w / 2), 0, -d / 2 - rand(1.6, 4.6))));
      occupied.push({ x: p.x, z: p.z, r: Math.hypot(w, d) / 2 });
    }
  };

  /* ---- 第2区間：銅の鳥居（発心門）。走路をまたぐ青銅の大鳥居 ---- */
  {
    const s = at(2, 0.25), f = tp(s, W / 2), g = registerLandmark(fantasyGroup(f.v.clone().setY(track.pos(s, W / 2).y)), '銅の鳥居（発心門）');
    g.rotation.y = -f.h;
    const Z = W / 2 + 3;
    for (const z of [-Z, Z]) { part(g, CYL, bronze, [0, 5, z], [0.8, 14, 0.8], null, 0.03); part(g, CYL, stone, [0, 0.2, z], [1.4, 1.6, 1.4], null, 0); }
    addBox(g, [1.5, 1.1, 2 * Z + 7], [0, 12.6, 0], bronze, null, 0.03); addBox(g, [1.2, 0.8, 2 * Z + 4.5], [0, 11.6, 0], bronze);
    for (const z of [-1, 1]) addBox(g, [1.5, 0.9, 2], [0, 13, z * (Z + 3.6)], bronze, [z * 0.25, 0, 0]);
    addBox(g, [0.7, 0.9, 2 * Z + 2], [0, 9.3, 0], bronze); addBox(g, [0.6, 2.2, 1.4], [0, 10.4, 0], bronze);
    for (const sd of [-1, 1]) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 2.1), toon('#ffffff', { map: ctex(64, 128, c => { c.fillStyle = '#2e2a24'; c.fillRect(0, 0, 64, 128); c.fillStyle = '#e8d49a'; c.font = 'bold 34px serif'; c.textAlign = 'center'; ['発', '心', '門'].forEach((ch, i) => c.fillText(ch, 32, 36 + i * 38)); }) }));
      m.position.set(sd * 0.32, 10.4, 0); m.rotation.y = sd * Math.PI / 2; g.add(m);
    }
    signAt(g, '銅の鳥居（発心門）', 17.5, 15);
  }

  /* ---- 第2区間の外：金峯山寺。参道の仁王門と、その奥の蔵王堂（四本桜と銅燈籠） ---- */
  {
    // 仁王門：参道をまたぐ二重の門。両脇に朱の金剛力士
    const s = at(2, 0.5), c = onGround(local(s, 0, SV)), g = registerLandmark(fantasyGroup(c), '金峯山寺 仁王門'); g.rotation.y = yawAt(s);
    for (const z of [-4.6, 4.6]) {
      addBox(g, [6, 5.4, 3], [0, 2.7, z], darkWood, null, 0.02); addBox(g, [5.4, 4, 0.1], [-3.02, 2.6, z], toon('#3a2a20'), [0, Math.PI / 2, 0]);
      part(g, new THREE.CapsuleGeometry(0.6, 1.6, 3, 8), toon('#c84a3a'), [-1.2, 2.3, z], null, null, 0.03);
    }
    addBox(g, [6.4, 0.8, 12.4], [0, 5.8, 0], darkWood); addBox(g, [5.6, 3.4, 10.4], [0, 8, 0], darkWood, null, 0.02);
    addBox(g, [7.2, 0.3, 12.8], [0, 6.4, 0], wood);
    part(g, roof4, hiwada, [0, 6.6, 0], [9.6, 1.2, 17.4], null, 0.02); part(g, roof4, hiwada, [0, 11, 0], [8.8, 2.6, 15.6], null, 0.02);
    part(g, PRISM, hiwada, [0, 11.6, 0], [8.2, 1.8, 3.6], [0, Math.PI / 2, 0], 0);
    signAt(g, '仁王門', 17, 8); occupied.push({ x: c.x, z: c.z, r: 8 });
    // 蔵王堂：檜皮葺きの二重屋根の大堂。前庭の四本桜と銅燈籠
    const z = site('金峯山寺 蔵王堂', at(2, 0.85), W / 2 + 46, 36, 32, '#c9bfa8', W / 2 + 36);
    addBox(z, [30, 1.2, 24], [0, 0.6, 3], stone, null, 0.02); addBox(z, [28, 0.5, 22], [0, 1.45, 3], wood);
    addBox(z, [24, 9, 18], [0, 6, 3], darkWood, null, 0.02);
    for (let x = -10.5; x <= 10.51; x += 3.5) part(z, CYL, toon('#3a2a20'), [x, 5.5, -6.2], [0.35, 8, 0.35], null, 0);
    addBox(z, [22, 2.4, 0.2], [0, 9.2, -6.1], plaster);
    part(z, roof4, hiwada, [0, 12.2, 3], [24.5, 3.6, 19.8], null, 0.02);
    addBox(z, [16, 4.6, 11], [0, 15.6, 3], darkWood, null, 0.02);
    part(z, roof4, hiwada, [0, 20.2, 3], [20, 5.6, 15.6], null, 0.02); part(z, PRISM, hiwada, [0, 21.6, 3], [12.5, 3.8, 5.6], null, 0);
    addBox(z, [13, 0.5, 0.5], [0, 25.2, 3], hiwada);
    // 向拝（正面の階段の屋根）
    addBox(z, [8, 0.4, 4], [0, 7.6, -8.6], hiwada, [-0.25, 0, 0]); for (const x of [-3.6, 3.6]) addBox(z, [0.4, 6.6, 0.4], [x, 4.4, -10.2], darkWood);
    for (let k = 0; k < 4; k++) addBox(z, [7, 0.35, 0.8], [0, 1.2 + k * 0.35, -9 - k * 0.7], stone);
    // 銅燈籠
    addBox(z, [1.4, 0.6, 1.4], [0, 0.3, -13.5], stone); part(z, CYL, bronze, [0, 2, -13.5], [0.25, 3, 0.25], null, 0);
    addBox(z, [1.3, 1.2, 1.3], [0, 3.9, -13.5], bronze); part(z, roof4, bronze, [0, 4.9, -13.5], [1.9, 0.8, 1.9], null, 0);
    z.updateMatrixWorld(true);
    for (const [x, zz] of [[-8, -12], [-4, -14], [4, -14], [8, -12]]) addTree(z.localToWorld(new V3(x, 0, zz)), 0.8, 'full', 4);
    // 四本桜の玉垣
    for (const [x, zz] of [[-6, -13], [6, -13]]) addBox(z, [6.4, 0.7, 4.6], [x, 0.35, zz], toon('#e6dfd0'));
    for (let i = 0; i < 10; i++) addPerson(z.localToWorld(new V3(rand(-12, 12), 0, rand(-15, -11))));
    signAt(z, '金峯山寺 蔵王堂', 31, 16);
  }

  /* ---- 第3区間：七曲り坂の外に吉水神社（一目千本の眺め）、内に竹林院（群芳園） ---- */
  {
    const g = site('吉水神社（一目千本）', at(3, 0.62), W / 2 + 40, 22, 16, '#c9bfa8', W / 2 + 34);
    addBox(g, [15, 4.6, 9], [-2, 2.8, 2], plaster, null, 0.02); addBox(g, [15.2, 1.2, 9.2], [-2, 1.1, 2], darkWood);
    part(g, roof4, hiwada, [-2, 6.4, 2], [14.4, 2.6, 9.8], null, 0.02); part(g, PRISM, hiwada, [-2, 6.9, 2], [8, 1.8, 3.4], null, 0);
    // 一目千本の展望の縁台と、桜の山を眺める人たち
    addBox(g, [7, 0.4, 6], [7, 1.2, -3], wood); for (const [x, zz] of [[4, -5.6], [10, -5.6], [4, -0.4], [10, -0.4]]) addBox(g, [0.3, 1.2, 0.3], [x, 0.6, zz], darkWood);
    addBox(g, [7, 0.15, 0.15], [7, 2.2, -6], darkWood);
    g.updateMatrixWorld(true);
    for (let i = 0; i < 7; i++) addPerson(g.localToWorld(new V3(rand(4.5, 9.5), 1.4, rand(-5, -1))));
    signAt(g, '吉水神社（一目千本）', 12, 15);
    const k = site('竹林院（群芳園）', at(3, 0.4), -(W / 2 + 30), 26, 20, '#a8c28a', W / 2 + 24);
    addBox(k, [12, 4.4, 8], [-5, 2.2, 4], plaster, null, 0.02); part(k, roof4, tile, [-5, 5.6, 4], [12, 2.6, 8.8], null, 0.02);
    // 池泉回遊式の庭：池と中島、石と松
    const pond = new THREE.Mesh(new THREE.CircleGeometry(4.6, 24), toon('#6fb0c8')); pond.rotation.x = -Math.PI / 2; pond.scale.set(1.3, 0.8, 1); pond.position.set(6, 0.08, -2); k.add(pond);
    part(k, SPH_LO, toon('#7fa35e'), [6.5, 0, -2.3], [1.4, 0.6, 1.1], null, 0);
    for (let i = 0; i < 6; i++) part(k, SPH_LO, stone, [rand(1, 11), 0.2, rand(-6, 2)], [rand(0.4, 0.8), rand(0.3, 0.6), rand(0.4, 0.8)], null, 0);
    for (const [x, zz] of [[1, -6], [11, 2]]) { addBox(k, [0.5, 3, 0.5], [x, 1.5, zz], darkWood, [0, 0, 0.3]); part(k, SPH_LO, toon('#2f5f3a'), [x + 0.8, 3.4, zz], [2.2, 0.9, 1.6], null, 0); }
    signAt(k, '竹林院（群芳園）', 10, 13);
  }

  /* ---- 上千本（第4区間）：花矢倉の展望台と、吉野水分神社の朱の楼門。コースのいちばん高いところ ---- */
  {
    const g = site('花矢倉の展望台', at(4, 0.42), W / 2 + 20, 16, 12, '#a8c28a', W / 2 + 12);
    for (const [x, z] of [[-6, -4.5], [0, -4.5], [6, -4.5], [-6, 4.5], [0, 4.5], [6, 4.5]]) addBox(g, [0.5, 3, 0.5], [x, 1.5, z], darkWood);
    addBox(g, [14, 0.5, 10.4], [0, 3.2, 0], wood, null, 0.02);
    for (const [w, x, z, r] of [[14, 0, -5.1, 0], [14, 0, 5.1, 0], [10, -6.9, 0, Math.PI / 2], [10, 6.9, 0, Math.PI / 2]]) addBox(g, [w, 0.15, 0.15], [x, 4.4, z], darkWood, [0, r, 0]);
    for (const [x, z] of [[-3, 2], [3, 2], [-3, -1], [3, -1]]) addBox(g, [0.3, 3.4, 0.3], [x, 5.1, z], darkWood);
    part(g, roof4, hiwada, [0, 7.5, 0.5], [10, 1.8, 6.6], null, 0.02);
    g.updateMatrixWorld(true);
    for (let i = 0; i < 9; i++) addPerson(g.localToWorld(new V3(rand(-6, 6), 3.45, rand(-4.6, -2))));
    signAt(g, '花矢倉の展望台（上千本）', 12, 16);
    const m = site('吉野水分神社', at(4, 0.86), W / 2 + 28, 22, 22, '#c9bfa8', W / 2 + 20);
    // 楼門：朱塗りの二重の門
    for (const [x, z] of [[-3, -8], [3, -8], [-3, -5], [3, -5]]) addBox(m, [0.6, 5, 0.6], [x, 2.5, z], vermilion, null, 0.02);
    addBox(m, [7.4, 0.6, 4.2], [0, 5.2, -6.5], vermilion); addBox(m, [6.4, 2.8, 3.4], [0, 6.9, -6.5], vermilion, null, 0.02); addBox(m, [6.5, 1.2, 3.5], [0, 7.4, -6.5], plaster);
    part(m, roof4, hiwada, [0, 9.6, -6.5], [9.4, 2.8, 5.8], null, 0.02); part(m, PRISM, hiwada, [0, 10.2, -6.5], [5.4, 1.6, 2.6], null, 0);
    // 本殿：春日造の社を3つつないだ長い社殿
    addBox(m, [18, 1, 6], [0, 0.5, 5], stone); addBox(m, [16, 4, 5], [0, 3, 5], vermilion, null, 0.02);
    for (const x of [-5.4, 0, 5.4]) part(m, PRISM, hiwada, [x, 5, 5], [6, 2.6, 4.8], [0, Math.PI / 2, 0], 0.02);
    for (const x of [-5.4, 0, 5.4]) for (const sd of [-1, 1]) addBox(m, [0.15, 1.4, 0.15], [x + sd * 1.6, 8.1, 5], gold, [0, 0, sd * 0.5]);
    signAt(m, '吉野水分神社', 14, 12);
  }

  /* ---- 奥千本（第5区間）：吉野杉の森、金峯神社、西行庵と苔清水 ---- */
  let spring = null;
  {
    const k = site('金峯神社', at(5, 0.12), -(W / 2 + 22), 12, 12, '#a8b88a', W / 2 + 16);
    for (const x of [-2.6, 2.6]) part(k, CYL, toon('#b89a72'), [x, 2.8, -5], [0.35, 5.6, 0.35], null, 0.02);
    addBox(k, [7.6, 0.5, 0.6], [0, 5.6, -5], toon('#b89a72')); addBox(k, [6, 0.35, 0.4], [0, 4.7, -5], toon('#b89a72'));
    addBox(k, [5.4, 3.6, 4.6], [0, 2.4, 2], wood, null, 0.02); part(k, PRISM, hiwada, [0, 4.2, 2], [6.6, 2.4, 6], [0, Math.PI / 2, 0], 0.02);
    for (const sd of [-1, 1]) addBox(k, [0.12, 1.2, 0.12], [0, 6.6, 2 + sd * 1.4], gold, [sd * 0.5, 0, 0]);
    signAt(k, '金峯神社（奥千本）', 9, 12);
    // 西行庵：茅葺きの小さな庵と、岩の間から湧く苔清水
    const g = site('西行庵（苔清水）', at(5, 0.75), W / 2 + 26, 14, 12, '#7f9c6a', W / 2 + 18);
    addBox(g, [5, 2.8, 4], [-2.5, 1.6, 1.5], wood, null, 0.02); part(g, roof4, toon('#a2844e'), [-2.5, 4.6, 1.5], [7.2, 3.8, 6], null, 0.02);
    addBox(g, [2.6, 2, 0.1], [-2.5, 1.4, -0.55], toon('#3a2a20'));
    part(g, new THREE.CapsuleGeometry(0.35, 0.4, 3, 8), toon('#4a4a52'), [-2.5, 0.9, 0.4], null, null, 0.03); part(g, SPH_LO, toon('#e9c4a4'), [-2.5, 1.55, 0.4], [0.24, 0.26, 0.24], null, 0);
    for (let i = 0; i < 7; i++) part(g, SPH_LO, toon(pick(['#8a8f7a', '#6f7a66', '#7f8a70'])), [3 + rand(-1.6, 1.6), rand(0.3, 1.2), -1 + rand(-1.4, 1.4)], [rand(0.8, 1.4), rand(0.6, 1.1), rand(0.8, 1.4)], null, 0);
    part(g, new THREE.CylinderGeometry(1.2, 1, 0.6, 16), stone, [3.2, 0.3, -3.4], null, null, 0);
    const water = new THREE.Mesh(new THREE.CircleGeometry(1, 16), toon('#7fc8e0')); water.rotation.x = -Math.PI / 2; water.position.set(3.2, 0.62, -3.4); g.add(water);
    addBox(g, [0.18, 0.18, 2.6], [3.2, 1.7, -2.4], toon('#9ab86a'), [0.35, 0, 0]);
    g.updateMatrixWorld(true); spring = g.localToWorld(new V3(3.2, 1.3, -3.6));
    signAt(g, '西行庵（苔清水）', 9, 13);
  }

  /* ---- 花吹雪の下り（第6区間）：野点傘の花見茶屋と、如意輪寺の多宝塔 ---- */
  {
    const umb = new THREE.ConeGeometry(1.7, 0.8, 16, 1, true);
    const g = site('花見茶屋', at(6, 0.2), W / 2 + 15, 18, 10, '#c9bfa8', W / 2 + 10);
    addBox(g, [6, 3.4, 4.6], [5, 1.7, 2.2], wood, null, 0.02); part(g, PRISM, tile, [5, 3.4, 2.2], [7, 1.6, 5.6], null, 0.02);
    addBox(g, [3.6, 1, 0.08], [5, 2.6, -0.15], toon('#c8303a'));
    for (const x of [-6, -1.5]) {
      addBox(g, [3.6, 0.5, 1.2], [x, 0.5, -1.8], toon('#c8323a')); addBox(g, [3.6, 0.5, 1.2], [x, 0.5, 1.2], toon('#c8323a'));
      part(g, CYL, wood, [x, 1.8, -0.3], [0.08, 3.6, 0.08], null, 0); part(g, umb, toon('#d8343a', { side: THREE.DoubleSide }), [x, 3.6, -0.3], [1, 0.9, 1], null, 0.02);
    }
    g.updateMatrixWorld(true);
    for (const x of [-7, -5, -2.5, -0.5]) for (const zz of [-1.8, 1.2]) if (Math.random() < 0.75) addPerson(g.localToWorld(new V3(x, 0.15, zz)), true);
    putBoard('お茶処', g.localToWorld(new V3(5, 4.6, -0.2)), g.rotation.y + Math.PI, 3.6, 'paper');
    signAt(g, '花見茶屋', 8, 8);
    const t = site('如意輪寺（多宝塔）', at(6, 0.72), W / 2 + 32, 26, 20, '#c9bfa8', W / 2 + 22);
    addBox(t, [12, 4.6, 8], [-5, 3, 3], wood, null, 0.02); addBox(t, [12.4, 1, 8.4], [-5, 0.5, 3], stone);
    part(t, roof4, tile, [-5, 6.8, 3], [15, 3, 11], null, 0.02);
    // 多宝塔：方形の下層、白い亀腹、円い上層、相輪
    const T = new V3(7, 0, 0);
    addBox(t, [6, 1, 6], [T.x, 0.5, T.z], stone); addBox(t, [5, 4, 5], [T.x, 3, T.z], vermilion, null, 0.02);
    part(t, roof4, hiwada, [T.x, 5.6, T.z], [9.4, 1.4, 9.4], null, 0.02);
    part(t, new THREE.SphereGeometry(1, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), plaster, [T.x, 6.1, T.z], [2.4, 1.2, 2.4], null, 0);
    part(t, CYL, vermilion, [T.x, 8, T.z], [1.6, 2, 1.6], null, 0.02); part(t, roof4, hiwada, [T.x, 9.9, T.z], [7.6, 1.8, 7.6], null, 0.02);
    part(t, CYL, gold, [T.x, 13, T.z], [0.18, 5, 0.18], null, 0);
    for (let k = 0; k < 6; k++) part(t, new THREE.TorusGeometry(0.42, 0.08, 6, 14), gold, [T.x, 11.4 + k * 0.5, T.z], null, [Math.PI / 2, 0, 0], 0);
    signAt(t, '如意輪寺（多宝塔）', 19, 14);
  }

  /* ---- 第7区間の外：吉野川。花筏の流れる川面と、柳の渡しの舟、岸の柳 ---- */
  const riverPts = [];
  {
    const V = W / 2 + 70;
    for (let s = at(6, 0.6); s <= at(7, 1); s += 6) riverPts.push(local(s, 0, V));
    for (let s = 6; s <= 80; s += 6) riverPts.push(local(s, 0, V));
    // 両端は走路から遠ざかる向きに伸ばす
    const head = riverPts[0], d0 = head.clone().sub(riverPts[1]).setY(0).normalize(), tail = riverPts[riverPts.length - 1], d1 = tail.clone().sub(riverPts[riverPts.length - 2]).setY(0).normalize();
    const f0 = tp(at(6, 0.6), W / 2).n, f1 = tp(80, W / 2).n;
    for (let k = 1; k <= 60; k++) riverPts.unshift(head.clone().addScaledVector(d0.clone().lerp(f0, Math.min(1, k / 30)).normalize(), k * 10));
    for (let k = 1; k <= 60; k++) riverPts.push(tail.clone().addScaledVector(d1.clone().lerp(f1, Math.min(1, k / 12)).normalize(), k * 10));
    // 両端の折れを均す
    for (let pass = 0; pass < 10; pass++) for (let i = 1; i < riverPts.length - 1; i++) riverPts[i] = riverPts[i - 1].clone().add(riverPts[i + 1]).multiplyScalar(0.5).lerp(riverPts[i], 0.5);
    riverPts.forEach(p => { onGround(p); occupied.push({ x: p.x, z: p.z, r: 19 }); });
    pathRibbon(riverPts, 40, 0.05, flat('#cdbf9c'), W / 2 + 10);
    const wTex = ctex(256, 256, g => {
      g.fillStyle = '#5b9fd6'; g.fillRect(0, 0, 256, 256);
      for (let i = 0; i < 70; i++) { g.strokeStyle = `rgba(255,255,255,${rand(0.12, 0.3)})`; g.lineWidth = rand(1, 2.4); const x = rand(0, 256), y = rand(0, 256); g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 10, y + rand(-3, 3), x + rand(18, 34), y); g.stroke(); }
      // 散って流れる花びら
      for (let i = 0; i < 260; i++) { g.fillStyle = pick(['#ffd3e5', '#fff0f6', '#ffbcd6']); g.beginPath(); g.ellipse(rand(0, 256), rand(0, 256), rand(1, 2.2), rand(0.6, 1.4), rand(0, 3), 0, Math.PI * 2); g.fill(); }
    }, true);
    wTex.repeat.set(1, 30);
    pathRibbon(riverPts, 30, 0.22, flat('#ffffff', { map: wTex }), W / 2 + 12);
    updates.push(t => { wTex.offset.y = -(reduced.matches ? 0 : t) * 0.012; });
    // 花筏：川面に集まって流れる花びらの帯
    const river = route(riverPts, false), rafts = [];
    for (let i = 0; i < 90; i++) rafts.push({ u: rand(0, river.L), off: rand(-12, 12), sc: rand(0.9, 2.4), v: rand(2.2, 3.4) });
    const raftMesh = addInst(new THREE.CircleGeometry(1, 10).rotateX(-Math.PI / 2), toon('#ffc4dc'), rafts.map(() => ({ p: new V3(), s: new V3(1, 1, 1) })), false);
    raftMesh.userData.droneIgnore = true;
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), tmp = new V3();
    updates.push((t, dt) => {
      for (let i = 0; i < rafts.length; i++) {
        const r = rafts[i]; if (!reduced.matches) r.u = mod(r.u + r.v * dt, river.L);
        const { p, yaw } = river.at(r.u, tmp), nx = Math.sin(yaw), nz = Math.cos(yaw);
        m4.compose(new V3(p.x + nx * r.off, p.y + 0.3, p.z + nz * r.off), q.setFromEuler(e.set(0, yaw, 0)), new V3(r.sc * 1.6, 1, r.sc * 0.7)); raftMesh.setMatrixAt(i, m4);
      }
      raftMesh.instanceMatrix.needsUpdate = true;
    });
    // 柳の渡し：川をはさむ船着き場と、竿で漕ぎ渡る渡し舟
    const want = local(at(7, 0.45), 0, V); let ui = 1; riverPts.forEach((p, i) => { if (i && i < riverPts.length - 1 && p.distanceTo(want) < riverPts[ui].distanceTo(want)) ui = i; });
    const pc = riverPts[ui], pn = riverPts[ui + 1];
    const along = pn.clone().sub(pc).setY(0).normalize(), across = new V3(-along.z, 0, along.x);
    const bankA = pc.clone().addScaledVector(across, 17), bankB = pc.clone().addScaledVector(across, -17);
    for (const b of [bankA, bankB]) {
      const g = fantasyGroup(b.clone().setY(groundAt(b))); g.rotation.y = -Math.atan2(across.z, across.x);
      addBox(g, [7, 0.4, 3], [b === bankA ? -2.5 : 2.5, 0.6, 0], wood); for (const z of [-1.2, 1.2]) addBox(g, [0.3, 1.6, 0.3], [b === bankA ? -5.6 : 5.6, 0.4, z], darkWood);
    }
    registerLandmark(fantasyGroup(pc.clone().setY(groundAt(pc))), '柳の渡し');
    { const g = fantasyGroup(bankA.clone().addScaledVector(across, 4).setY(groundAt(bankA))); signAt(g, '柳の渡し（吉野川）', 6, 13); }
    const boat = fantasyGroup(); boat.userData.droneIgnore = true;
    addBox(boat, [6.4, 0.8, 2], [0, 0.3, 0], toon('#7a5638'), null, 0.03); addBox(boat, [6.6, 0.25, 2.2], [0, 0.75, 0], darkWood);
    part(boat, new THREE.CapsuleGeometry(0.3, 0.75, 3, 8), toon('#3d4f7a'), [2.2, 1.7, 0], null, null, 0.03); part(boat, SPH_LO, toon('#e9c4a4'), [2.2, 2.7, 0], [0.26, 0.28, 0.26], null, 0);
    part(boat, new THREE.ConeGeometry(0.6, 0.35, 12), toon('#d9c27a'), [2.2, 3.05, 0], null, null, 0);
    const pole = addBox(boat, [0.08, 6, 0.08], [2.6, 2.2, 0.4], toon('#c9b06a'), [0.35, 0, 0]);
    for (let i = 0; i < 3; i++) { part(boat, new THREE.CapsuleGeometry(0.28, 0.4, 3, 8), toon(pick(['#e8749a', '#7aa6d9', '#f2d36b'])), [-0.6 - i * 1.3, 1.25, 0], null, null, 0.03); part(boat, SPH_LO, toon('#e9c4a4'), [-0.6 - i * 1.3, 1.95, 0], [0.24, 0.26, 0.24], null, 0); }
    const bA = bankA.clone().addScaledVector(across, -5), bB = bankB.clone().addScaledVector(across, 5);
    updates.push(t => {
      const m = reduced.matches ? 10 : t, k = mod(m / 30, 1), tri = k < 0.5 ? k * 2 : 2 - k * 2, e2 = tri * tri * (3 - 2 * tri);
      boat.position.lerpVectors(bA, bB, e2); boat.position.y = groundAt(boat.position) + 0.25 + Math.sin(m * 1.4) * 0.06;
      boat.rotation.y = -Math.atan2(across.z, across.x) + (k < 0.5 ? Math.PI : 0); pole.rotation.x = 0.35 + Math.sin(m * 1.6) * 0.2;
    });
    // 岸の柳：枝垂れる細い枝
    const willowT = [], willowL = [];
    for (let i = 4; i < riverPts.length - 4; i += 7) for (const sd of [-1, 1]) {
      if (Math.random() < 0.45) continue;
      const p = riverPts[i], n2 = riverPts[i + 1].clone().sub(p).setY(0).normalize(), q2 = p.clone().addScaledVector(new V3(-n2.z, 0, n2.x), sd * 22);
      if (roadDist(q2.x, q2.z, W) < W / 2 + 8 || taken(q2.x, q2.z, 0)) continue;
      onGround(q2); willowT.push({ p: q2.clone().add(new V3(0, 3, 0)), s: new V3(0.4, 6, 0.4) });
      for (let k = 0; k < 14; k++) { const a = k / 14 * Math.PI * 2, r = rand(1.2, 3.2); willowL.push({ p: q2.clone().add(new V3(Math.cos(a) * r, 4.4, Math.sin(a) * r)), s: new V3(0.14, rand(3.5, 5.5), 0.14) }); }
      occupied.push({ x: q2.x, z: q2.z, r: 3 });
    }
    addInst(CYL, toon('#5a4636'), willowT); addInst(CYL, toon('#9ccf6a'), shuffle(willowL), false);
  }

  /* ---- 内馬場：花見の宴。緋毛氈と野点傘、重箱、ぼんぼりの小径、屋台、千年の枝垂れ桜（ファンタジー） ---- */
  let weeping = null;
  {
    // 枝垂れ桜は内馬場のいちばん広いところ（走路からいちばん遠い点）
    let best = null, bestD = 0;
    for (let k = 0; k < 600; k++) {
      const i = (Math.random() * track.N) | 0, p = new V3(track.xs[i], 0, track.zs[i]).lerp(new V3(0, 0, 0), rand(0.2, 1));
      if (!inLoop(p.x, p.z) || p.distanceTo(boardPos) < 45) continue;
      const d = roadDist(p.x, p.z, 160); if (d > bestD) { bestD = d; best = p; }
    }
    const c = onGround(best || new V3(0, 0, 0)), g = registerLandmark(fantasyGroup(c), '千年の枝垂れ桜');
    part(g, CYL_T, toon('#5a3a2c'), [0, 4, 0], [2.2, 8, 2.2], null, 0.04);
    for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2; addBox(g, [0.9, 0.9, 7], [Math.cos(a) * 2.8, 8.6, Math.sin(a) * 2.8], toon('#5a3a2c'), [0.6, -a + Math.PI / 2, 0]); }
    // 支柱と竹垣
    for (let k = 0; k < 4; k++) { const a = k / 4 * Math.PI * 2 + 0.4; addBox(g, [0.25, 7, 0.25], [Math.cos(a) * 7, 3.5, Math.sin(a) * 7], toon('#9a7a52')); }
    for (let k = 0; k < 36; k++) { const a = k / 36 * Math.PI * 2; addBox(g, [2.2, 0.9, 0.12], [Math.cos(a) * 12, 0.45, Math.sin(a) * 12], toon('#c9b070'), [0, -a + Math.PI / 2, 0]); }
    g.updateMatrixWorld(true);
    // 枝垂れる花：頂きのドームから、花の房を垂らした糸を四方へ
    const dome = [], strands = [], cols = ['#ffb0d0', '#ffc4dc', '#f79cc4', '#ffd0e4', '#f28bb8'].map(C);
    for (let k = 0; k < 26; k++) { const a = rand(0, Math.PI * 2), r = rand(0, 8); dome.push({ p: c.clone().add(new V3(Math.cos(a) * r, 13 + rand(0, 3) - r * 0.25, Math.sin(a) * r)), s: new V3(rand(2.6, 3.6), rand(2, 2.8), rand(2.6, 3.6)), c: pick(cols) }); }
    for (let k = 0; k < 190; k++) {
      const a = rand(0, Math.PI * 2), r0 = rand(4, 13), y0 = 15.5 - r0 * 0.4, len = rand(7, 12);
      for (let j = 0; j < 9; j++) { const t = j / 8, r = r0 + t * 1.6, y = y0 - t * len; strands.push({ p: c.clone().add(new V3(Math.cos(a) * r, y, Math.sin(a) * r)), s: new V3(0.85 - t * 0.35, 1.1, 0.85 - t * 0.35), c: pick(cols) }); }
    }
    const blossomMat = toon('#ffffff', { emissive: C('#ff8fc0'), emissiveIntensity: 0 });
    addInst(SPH_LO, blossomMat, shuffle(dome)); addInst(SPH_LO, blossomMat, shuffle(strands), false);
    weeping = { c, mat: blossomMat };
    occupied.push({ x: c.x, z: c.z, r: 16 });
    signAt(g, '千年の枝垂れ桜', 22, 13);
  }
  {
    // ぼんぼりの小径：枝垂れ桜をめぐる輪と、ホーム直線の内側へ延びる道
    const c = weeping.c, lantern = railLanterns, poles = [], path = [];
    for (let k = 0; k <= 48; k++) { const a = k / 48 * Math.PI * 2; path.push(onGround(c.clone().add(new V3(Math.cos(a) * 19, 0, Math.sin(a) * 19)))); }
    pathRibbon(path, 3, 0.05, flat('#e3d6b8'), W / 2 + 6);
    for (let k = 0; k < 48; k += 3) { const p = path[k], q = p.clone().lerp(c, -0.12).setY(p.y); poles.push({ p: q.clone().add(new V3(0, 0.9, 0)), s: new V3(0.08, 1.8, 0.08) }); lantern.push({ p: q.clone().add(new V3(0, 2.1, 0)), s: new V3(0.32, 0.55, 0.32) }); }
    const toHome = []; for (let k = 0; k <= 30; k++) toHome.push(onGround(c.clone().lerp(new V3(boardPos.x, 0, boardPos.z), k / 30 * 0.8)));
    pathRibbon(toHome, 3, 0.05, flat('#e3d6b8'), W / 2 + 6);
    for (let k = 2; k < toHome.length; k += 3) for (const sd of [-1, 1]) { const p = toHome[k], d = toHome[k - 1].clone().sub(p).setY(0).normalize(), q = p.clone().add(new V3(-d.z * 2.2 * sd, 0, d.x * 2.2 * sd)); poles.push({ p: q.clone().add(new V3(0, 0.9, 0)), s: new V3(0.08, 1.8, 0.08) }); lantern.push({ p: q.clone().add(new V3(0, 2.1, 0)), s: new V3(0.32, 0.55, 0.32) }); }
    path.concat(toHome).forEach(p => occupied.push({ x: p.x, z: p.z, r: 2.2 }));
    addInst(CYL, toon('#3a2a20'), poles, false);
    const bonbori = addInst(new THREE.CylinderGeometry(1, 0.85, 1, 10), toon('#fff4f0', { emissive: C('#ffb0c8'), emissiveIntensity: 0.25 }), lantern, false);
    weeping.lanterns = bonbori;
    // 花見の宴：緋毛氈（ござ）と重箱、輪になって座る人たち、ところどころに野点傘
    const mats = [], boxes = [], umbP = [], umbS = [];
    for (let k = 0, placed = 0; k < 500 && placed < 22; k++) {
      const i = (Math.random() * track.N) | 0, p = new V3(track.xs[i], 0, track.zs[i]).lerp(new V3(0, 0, 0), rand(0.15, 0.9));
      if (!inLoop(p.x, p.z) || roadDist(p.x, p.z, W / 2 + 16) < W / 2 + 13 || taken(p.x, p.z, 5)) continue;
      onGround(p); const yaw = rand(0, Math.PI), w = rand(4.4, 6), d = rand(3.4, 4.4);
      mats.push({ p: p.clone().add(new V3(0, 0.06, 0)), s: new V3(w, 0.08, d), r: [0, yaw, 0], c: C(pick(['#c8323a', '#c8323a', '#d9c58a', '#c8323a'])) });
      for (let j = 0; j < 3; j++) { const [ox, oz] = rot(rand(-0.8, 0.8), rand(-0.6, 0.6), yaw); boxes.push({ p: p.clone().add(new V3(ox, 0.3, oz)), s: new V3(0.7, 0.36 + j * 0.0, 0.7), r: [0, yaw, 0], c: C(pick(['#1f1a1a', '#a42a2a'])) }); }
      const n = 4 + ((Math.random() * 3) | 0);
      for (let j = 0; j < n; j++) { const a = j / n * Math.PI * 2, [ox, oz] = rot(Math.cos(a) * w * 0.36, Math.sin(a) * d * 0.36, yaw); addPerson(p.clone().add(new V3(ox, 0.08, oz)), true); }
      if (Math.random() < 0.4) { const [ox, oz] = rot(w / 2 + 0.6, 0, yaw); umbP.push({ p: p.clone().add(new V3(ox, 1.8, oz)), s: new V3(0.08, 3.6, 0.08) }); umbS.push({ p: p.clone().add(new V3(ox, 3.7, oz)), s: new V3(1, 0.9, 1), c: C(pick(['#d8343a', '#d8343a', '#d8343a', '#2f4f8a'])) }); }
      occupied.push({ x: p.x, z: p.z, r: 4.5 }); placed++;
    }
    addInst(BOX, toon('#ffffff'), mats, false); addInst(BOX, toon('#ffffff'), boxes, false);
    addInst(CYL, wood, umbP, false); addInst(new THREE.ConeGeometry(1.7, 0.8, 16, 1, true), toon('#ffffff', { side: THREE.DoubleSide }), umbS);
    // 屋台：ホーム直線の内側に一列。紅白の幕と、文字ののれん
    const stallNames = ['たこ焼き', 'わたあめ', 'りんご飴', '焼きそば', '金魚すくい', 'ラムネ', '桜餅', 'みたらし'];
    const posts = [], tarps = [], counters = [], goods = [];
    const tarpTex = ctex(128, 64, g => { for (let x = 0; x < 128; x += 16) { g.fillStyle = (x / 16) % 2 ? '#ffffff' : '#d23c4c'; g.fillRect(x, 0, 16, 64); } }, true);
    let si = 0;
    for (let s = track.homeS0 + 30; s < track.homeS1 - 10 && si < stallNames.length; s += 9) {
      const v = -(W / 2 + 15), c2 = onGround(local(s, 0, v)), yaw = yawAt(s);
      if (!clearAt(c2.x, c2.z, W / 2 + 10, 3) || c2.distanceTo(boardPos) < 24) continue;
      // 局所 +z が走路の側。売り台は内馬場の客の側を向く
      const L = (x, y, z) => { const [ox, oz] = rot(x, z, yaw); return new V3(c2.x + ox, c2.y + y, c2.z + oz); };
      for (const [x, z] of [[-2.8, -1.8], [2.8, -1.8], [-2.8, 1.8], [2.8, 1.8]]) posts.push({ p: L(x, 1.4, z), s: new V3(0.07, 2.8, 0.07) });
      tarps.push({ p: L(0, 2.95, 0), s: new V3(6.2, 0.14, 4.2), r: [0, yaw, 0] });
      counters.push({ p: L(0, 0.55, -1.4), s: new V3(5.4, 1.1, 1.4), r: [0, yaw, 0], c: C(pick(['#d9c27a', '#c8323a', '#f2ece0'])) });
      for (let k = 0; k < 6; k++) goods.push({ p: L(rand(-2.3, 2.3), 1.25, rand(-1.8, -1)), s: new V3(0.3, 0.26, 0.3), c: C(pick(['#ff5a7a', '#ffd34a', '#ffffff', '#ff9a4a', '#c8323a', '#ffb3d1'])) });
      putBoard(stallNames[si], L(0, 3.75, 1.9), yaw, 4.2, 'stall'); putBoard(stallNames[si++], L(0, 3.75, -1.9), yaw + Math.PI, 4.2, 'stall');
      for (let k = 0; k < 3; k++) addPerson(onGround(L(rand(-2.6, 2.6), 0, rand(-3, -5.5))));
      occupied.push({ x: c2.x, z: c2.z, r: 4.2 });
    }
    addInst(CYL, steel, posts, false); addInst(BOX, toon('#ffffff', { map: tarpTex }), tarps, false); addInst(BOX, toon('#ffffff'), counters); addInst(SPH_LO, toon('#ffffff'), shuffle(goods), false);
  }

  /* ---- 花供会式の山伏の行列：法螺貝を吹く先達、錫杖を突く山伏、稚児が門前町の参道を練り歩く ---- */
  {
    const r = route(streetPts, false), walkers = [];
    const white = toon('#f4f2ea'), black = toon('#1f1d22'), orange = toon('#e8742a'), skin = toon('#e9c4a4');
    for (let i = 0; i < 13; i++) {
      const child = i >= 10, g = fantasyGroup(); g.userData.droneIgnore = true;
      const col = child ? toon(pick(['#e8749a', '#f2d36b', '#7aa6d9'])) : white, sc = child ? 0.72 : 1;
      part(g, new THREE.CapsuleGeometry(0.34 * sc, 0.9 * sc, 3, 8), col, [0, 1.35 * sc, 0], null, null, 0.04);
      part(g, SPH_LO, skin, [0, 2.3 * sc, 0], [0.27 * sc, 0.3 * sc, 0.27 * sc], null, 0.03);
      if (child) part(g, new THREE.ConeGeometry(0.5, 0.4, 12), toon('#f2d36b'), [0, 2.75 * sc, 0], null, null, 0);
      else {
        addBox(g, [0.2, 0.18, 0.2], [0.1, 2.55, 0], black);
        // 結袈裟の房（胸の前に3つずつ）
        for (const z of [-0.18, 0.18]) for (let k = 0; k < 3; k++) part(g, SPH_LO, orange, [0.33, 1.95 - k * 0.3, z], [0.09, 0.09, 0.09], null, 0);
        if (i === 0) part(g, SPH_LO, toon('#f2e6d0'), [0.45, 2.35, 0.2], [0.32, 0.18, 0.18], [0, 0, 0.3], 0);
        else if (i % 2) { part(g, CYL, toon('#5a4a3a'), [0.3, 1.6, 0.42], [0.05, 3.2, 0.05], null, 0); part(g, new THREE.TorusGeometry(0.18, 0.03, 6, 12), gold, [0.3, 3.25, 0.42], null, null, 0); }
      }
      walkers.push({ g, k: i, off: i * 3.2 + (child ? 2 : 0) });
    }
    updates.push(t => {
      const m = reduced.matches ? 0 : t, span = r.L - 30;
      for (const w of walkers) {
        const k = mod(m * 1.2 - w.off + 60, span * 2), back = k > span, { p, yaw } = r.at((back ? span * 2 - k : k) + 15);
        w.g.position.set(p.x, p.y + Math.abs(Math.sin(m * 5 + w.k)) * 0.08, p.z); w.g.rotation.y = yaw + (back ? Math.PI : 0);
      }
    });
    registerLandmark(fantasyGroup(streetPts[(streetPts.length / 2) | 0].clone()), '花供会式の山伏の行列');
  }

  // 門前町の町家（名所の敷地のあと、空いたところへ）
  machiyaRow(streetS0 + 8, streetS1);
  streetPts.forEach(p => occupied.push({ x: p.x, z: p.z, r: 4.6 }));
  addInst(BOX, toon('#ffffff'), mBody); addInst(PRISM, tile, mRoof); addInst(BOX, tile, mEave, false);
  addInst(BOX, darkWood, mLattice, false); addInst(BOX, toon('#ffffff'), mNoren, false);

  /* ---- 千本桜：区間ごとに咲き方を変えて、山じゅうに植える。奥千本は吉野杉の森 ---- */
  {
    const okuS0 = at(4, 0.85), okuS1 = at(6, 0.12), kamiS0 = at(3, 0.6);
    const zoneOf = s => s > okuS0 && s < okuS1 ? 'oku' : s > kamiS0 && s <= okuS0 ? 'yama' : 'full';
    for (let k = 0, n = 0; k < 7000 && n < 1050; k++) {
      const s = rand(0, track.L), v = W / 2 + 9 + 190 * Math.random() ** 1.9, p = local(s, 0, v);
      if (!clearAt(p.x, p.z, W / 2 + 8, 2.4) || inLoop(p.x, p.z)) continue;
      onGround(p); const zn = zoneOf(s);
      if (zn === 'oku') { if (Math.random() < 0.72) addCedar(p, rand(14, 24)); else addTree(p, rand(0.8, 1.3), 'bud', 4); }
      else addTree(p, rand(1, 1.8) * (1 + (v - W / 2) / 260), zn === 'yama' && Math.random() < 0.7 ? 'yama' : 'full');
      occupied.push({ x: p.x, z: p.z, r: 1.8 }); n++;
    }
    for (let k = 0, n = 0; k < 2500 && n < 150; k++) {
      const i = (Math.random() * track.N) | 0, p = new V3(track.xs[i], 0, track.zs[i]).lerp(new V3(0, 0, 0), rand(0.05, 1));
      if (!inLoop(p.x, p.z) || !clearAt(p.x, p.z, W / 2 + 9, 2.6)) continue;
      onGround(p); addTree(p, rand(0.9, 1.6), 'full'); occupied.push({ x: p.x, z: p.z, r: 2 }); n++;
    }
    // 奥千本の杉は内側にも
    for (let k = 0, n = 0; k < 900 && n < 60; k++) {
      const s = rand(okuS0, okuS1), p = local(s, 0, -(W / 2 + 9 + rand(0, 40)));
      if (!clearAt(p.x, p.z, W / 2 + 8, 2.4)) continue;
      onGround(p); addCedar(p, rand(12, 20)); occupied.push({ x: p.x, z: p.z, r: 2 }); n++;
    }
    // 低画質で前半だけ描くとき、幹と花がそろって消えるよう、木ごとに同じ順で並べる
    shuffle(trees);
    addInst(trunkG, toon('#6b4535'), trees.map(tr => tr.t)); addInst(blobG, toon('#ffffff'), trees.flatMap(tr => tr.b));
    const co = shuffle(cedarTrunks.map((_, i) => i));
    addInst(CYL, toon('#5a4030'), co.map(i => cedarTrunks[i]), false); addInst(cedarG, toon('#ffffff'), co.flatMap(i => [cedars[i * 2], cedars[i * 2 + 1]]));
  }

  /* ---- 空：上千本の上を輪を描く鳶 ---- */
  {
    const center = tp(at(4, 0.5), W / 2).v, kites = [];
    for (let i = 0; i < 3; i++) {
      const g = fantasyGroup(); g.userData.droneIgnore = true; const brown = toon('#5a4232');
      part(g, SPH_LO, brown, [0, 0, 0], [1.1, 0.35, 0.35], null, 0);
      const wings = [-1, 1].map(sd => { const w = new THREE.Group(); w.position.set(0, 0.1, sd * 0.25); g.add(w); addBox(w, [1.1, 0.08, 2.6], [0, 0, sd * 1.3], brown); return w; });
      addBox(g, [0.9, 0.06, 0.7], [-1.3, 0, 0], brown);
      kites.push({ g, wings, r: rand(50, 90), h: rand(55, 80), ph: rand(0, 6), v: rand(0.12, 0.2) });
    }
    updates.push(t => {
      const m = reduced.matches ? 0 : t;
      for (const k of kites) {
        const a = m * k.v + k.ph; k.g.position.set(center.x + Math.cos(a) * k.r, center.y + k.h + Math.sin(m * 0.3 + k.ph) * 4, center.z + Math.sin(a) * k.r);
        k.g.rotation.y = -a - Math.PI / 2; k.g.rotation.x = -0.25;
        k.wings.forEach((w, i) => { w.rotation.x = (i ? 1 : -1) * Math.sin(m * 1.6 + k.ph) * 0.12; });
      }
    });
  }

  // まとめて描く：人々、文字の板
  {
    const order = shuffle(people.map((_, i) => i));
    addInst(new THREE.CapsuleGeometry(0.3, 0.75, 3, 8), toon('#ffffff'), order.map(i => people[i]), false); addInst(SPH_LO, toon('#e9c4a4'), order.map(i => heads[i]), false);
    for (const [key, list] of boardLists) addInst(new THREE.PlaneGeometry(1, 1), boardMats.get(key), list, false);
  }

  /* ---- 花吹雪：下りの区間では、桜の吹雪が走路に沿って坂を流れ下る。苔清水には細い水 ---- */
  const pc = C('#ffd0e4'), pw = C('#fff4f8'), pk = C('#ff9cc8'), drop = C('#bfe8ff');
  {
    const z = track.zones.find(z => z.name === '花吹雪の下り');
    let acc = 0, acc2 = 0;
    updates.push((t, dt) => {
      if (reduced.matches || !amb) return;
      acc += dt * (lightQuality() ? 22 : 60);
      while (acc >= 1 && z) {
        acc--; const s = rand(z.start, z.end), f = tp(s, rand(-6, W + 6)), d = f.dir;
        amb.emit(f.v.x, track.pos(s, W / 2).y + rand(1, 9), f.v.z, d.x * rand(4, 7), rand(-0.6, 0.4), d.z * rand(4, 7), 6, rand(0.5, 0.85), Math.random() < 0.5 ? pc : pw, 0.3, 0.2);
      }
      acc2 += dt * 6;
      while (acc2 >= 1 && spring) { acc2--; dustP.emit(spring.x, spring.y, spring.z, rand(-0.05, 0.05), -0.4, rand(-0.05, 0.05), 0.6, rand(0.12, 0.2), drop, 3, 0); }
    });
  }

  /* ---- ゴール：大きな花吹雪が舞い上がり、千年の枝垂れ桜が光り、ぼんぼりが灯る ---- */
  themeFinish = () => { celebration = 8; }; themeReset = () => { celebration = 0; };
  let burst = 0;
  updates.push((t, dt) => {
    const glow = celebration > 0 ? Math.min(1, celebration / 2) : 0;
    if (weeping) { weeping.mat.emissiveIntensity = glow * (0.35 + 0.15 * Math.sin((reduced.matches ? 0 : t) * 4)); if (weeping.lanterns) weeping.lanterns.material.emissiveIntensity = 0.25 + glow * 1.2; }
    if (celebration <= 0) return;
    celebration = Math.max(0, celebration - dt);
    if (reduced.matches || !amb) return;
    burst += dt * (lightQuality() ? 70 : 190);
    for (; burst >= 1; burst--) {
      const s = track.finishS + rand(-90, 40), f = tp(s, rand(-14, W + 14)), up = rand(5, 9), a = rand(0, Math.PI * 2);
      amb.emit(f.v.x, f.v.y + rand(0, 3), f.v.z, Math.cos(a) * rand(1, 3), up, Math.sin(a) * rand(1, 3), rand(5, 7), rand(1, 1.7), Math.random() < 0.6 ? pk : pw, 1.6, 0.6);
    }
    if (weeping && Math.random() < 0.5) { const c = weeping.c; sparkP.emit(c.x + rand(-10, 10), c.y + rand(6, 16), c.z + rand(-10, 10), rand(-1, 1), rand(1, 3), rand(-1, 1), rand(1, 1.8), rand(1.2, 2), C('#ffd6ea').multiplyScalar(1.6), 0.5, 0.5); }
  });

  ambient(TEX_PETAL, false, 80, (a, c) => a.emit(c.x + rand(-60, 60), c.y + rand(5, 30), c.z + rand(-60, 60), rand(-1.5, 2.5), rand(-1.6, -0.8), rand(-1, 1), 9, rand(0.35, 0.6), Math.random() < 0.7 ? pc : pw, 0, 0));
  // 広い範囲に散らばるインスタンスは、原点の境界球で切り捨てられないようにする
  for (const o of world.children.slice(n0)) if (o.isInstancedMesh) o.frustumCulled = false;
  themeUpd.push((t, dt) => { for (const f of updates) f(t, dt); });
}
// スタンド：花見の桟敷。段の前に紅白幕、軒に提灯の列、屋根の上に「桜花ヶ丘」の扁額と桜の飾り、柱ごとに幟
function decorSakuraStand(stand, len, z0, roof) {
  const g = new THREE.Group(); stand.add(g); registerLandmark(g, 'sakura-stand');
  // 紅白幕：段の前の腰壁に張る（局所 -z が走路の側）
  const maku = ctex(256, 64, c => { for (let x = 0; x < 256; x += 32) { c.fillStyle = (x / 32) % 2 ? '#ffffff' : '#d8343a'; c.fillRect(x, 0, 32, 64); } }, true);
  maku.repeat.set(len / 8, 1);
  const mk = new THREE.Mesh(new THREE.PlaneGeometry(len, 1.4), toon('#ffffff', { map: maku, side: THREE.DoubleSide })); mk.position.set(0, 0.75, z0 - 0.05); g.add(mk);
  // 提灯：軒先に吊るす紅白の提灯（上下に黒い枠）
  const lan = [], caps = [];
  for (let x = -len / 2 + 3; x <= len / 2 - 3; x += 5) { lan.push({ p: new V3(x, 10.9, z0 - 1.4), s: new V3(0.55, 0.85, 0.55), c: C(Math.round(x / 5) % 2 ? '#ffffff' : '#e8483a') }); for (const y of [10.1, 11.7]) caps.push({ p: new V3(x, y, z0 - 1.4), s: new V3(0.36, 0.12, 0.36) }); }
  const lm = inst(SPH_LO, toon('#ffffff', { emissive: C('#ffb070'), emissiveIntensity: 0.25 }), lan, false), cm = inst(new THREE.CylinderGeometry(1, 1, 1, 10), toon('#1f1a1a'), caps, false);
  g.add(lm, cm);
  // 屋根の上の扁額と、桜の造花の飾り
  const board = ctex(512, 160, c => {
    c.fillStyle = '#4a2f20'; c.fillRect(0, 0, 512, 160); c.strokeStyle = '#d9b24c'; c.lineWidth = 10; c.strokeRect(8, 8, 496, 144);
    c.fillStyle = '#f6e7c8'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = '900 92px "Dela Gothic One", serif'; c.fillText('桜花ヶ丘', 256, 86, 470);
  });
  const w = Math.min(34, len * 0.3), h = w * 160 / 512;
  for (const sx of [-w * 0.3, w * 0.3]) addBox(g, [0.5, 3.4, 0.5], [sx, 15.4, z0 + 6], toon('#3a2a20'));
  addBox(g, [w + 1, h + 1, 0.5], [0, 17 + h / 2, z0 + 6.3], toon('#3a2a20'));
  const bm = new THREE.Mesh(new THREE.PlaneGeometry(w, h), toon('#ffffff', { map: board })); bm.position.set(0, 17 + h / 2, z0 + 6.02); bm.rotation.y = Math.PI; g.add(bm);
  const flowers = [];
  for (let x = -len / 2; x <= len / 2; x += 2.2) flowers.push({ p: new V3(x, 13.9 + rand(-0.2, 0.3), z0 - 2.2 + rand(-0.4, 0.4)), s: new V3(rand(1, 1.5), rand(0.7, 1), rand(1, 1.5)), c: C(['#ffc4dc', '#ffe3ee', '#ffb3d1'][(Math.random() * 3) | 0]) });
  for (let k = 0; k < 24; k++) flowers.push({ p: new V3(rand(-w / 2 - 6, w / 2 + 6), 17 + rand(0, h + 1.5), z0 + 7 + rand(0, 1)), s: new V3(rand(0.9, 1.4), rand(0.7, 1), rand(0.9, 1.4)), c: C(['#ffc4dc', '#ffe3ee', '#ffb3d1'][k % 3]) });
  g.add(inst(SPH_LO, toon('#ffffff'), flowers, false));
  // 幟：柱の位置に、桜色と白の縦長の旗
  const nobori = ctex(64, 256, c => { c.fillStyle = '#ffd6e6'; c.fillRect(0, 0, 64, 256); c.fillStyle = '#c8304e'; c.fillRect(0, 0, 64, 18); c.font = 'bold 40px serif'; c.textAlign = 'center'; ['桜', '花', '賞'].forEach((ch, i) => c.fillText(ch, 32, 70 + i * 62)); });
  const nm = toon('#ffffff', { map: nobori, side: THREE.DoubleSide });
  for (let x = -len / 2 + len / 10; x < len / 2; x += len / 5) {
    addBox(g, [0.14, 7, 0.14], [x, 3.5, z0 - 3], toon('#3a2a20'));
    const f = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 5.4), nm); f.position.set(x + 0.75, 4, z0 - 3); f.rotation.y = Math.PI / 2; g.add(f);
  }
}
