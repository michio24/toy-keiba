// モナコ市街地コース
'use strict';

/* ---- Monaco streets, harbor and covered tunnel ---- */
// 静的な景観は材質ごとに1つのInstancedMeshへまとめ、点光源も使わずに描画呼び出しを数十回に抑える
function decorMonaco() {
  const sAt = name => track.corners.find(c => c.name === name).s;
  const [ta, tb] = track.tunnelRange;
  const smooth = THREE.MathUtils.smoothstep;
  // 走路中心までの距離：32m格子に走路の標本を登録し、近くのセルだけを調べる
  const CELL = 32, roadCells = new Map(), cellKey = (cx, cz) => cx * 4096 + cz;
  for (let i = 0; i <= track.N; i += 4) {
    const key = cellKey(Math.floor(track.xs[i] / CELL), Math.floor(track.zs[i] / CELL));
    if (!roadCells.has(key)) roadCells.set(key, []);
    roadCells.get(key).push(i);
  }
  const roadDist = (x, z, r = 96) => {
    let best = r * r;
    for (let cx = Math.floor((x - r) / CELL); cx <= Math.floor((x + r) / CELL); cx++) {
      for (let cz = Math.floor((z - r) / CELL); cz <= Math.floor((z + r) / CELL); cz++) {
        for (const i of roadCells.get(cellKey(cx, cz)) || []) best = Math.min(best, (track.xs[i] - x) ** 2 + (track.zs[i] - z) ** 2);
      }
    }
    return Math.sqrt(best);
  };
  // 回転した長方形の角と辺の中点を、走路・海・既存の建物と照合する
  const rectPoints = (x, z, yaw, w, d) => {
    const c = Math.cos(yaw), s = Math.sin(yaw), pts = [];
    for (const [lx, lz] of [[-1, -1], [1, -1], [1, 1], [-1, 1], [0, -1], [0, 1], [-1, 0], [1, 0], [0, 0]]) {
      const px = lx * w / 2, pz = lz * d / 2;
      pts.push([x + px * c + pz * s, z - px * s + pz * c]);
    }
    return pts;
  };
  const rectClear = (x, z, yaw, w, d, min) => rectPoints(x, z, yaw, w, d).every(([px, pz]) => roadDist(px, pz) >= min && !inSea(px, pz));
  const occupied = [];
  const free = (x, z, r) => occupied.every(o => (o.x - x) ** 2 + (o.z - z) ** 2 > (o.r + r) ** 2);
  const baseY = (x, z, yaw, w, d) => Math.min(...rectPoints(x, z, yaw, w, d).map(([px, pz]) => track.groundH(px, pz)));
  // 走路の外側（lane>W）や内側へ押し出し、指定の余白が取れる位置を探す
  const findSpot = (s, lane, w, d, min, step) => {
    for (let k = 0; k < 40; k++) {
      const f = tp(s, lane + k * step);
      if (rectClear(f.v.x, f.v.z, -f.h, w, d, min) && free(f.v.x, f.v.z, Math.hypot(w, d) / 2)) return { x: f.v.x, z: f.v.z, yaw: -f.h, f };
    }
    return null;
  };

  // ---- 海と港：ポルティエからアントニー・ノーグまでの海側を海岸線とし、プール区間は岸壁を広く取る ----
  const pool0 = sAt('タバック') + 40, pool1 = sAt('ラスカス') - 20;
  const coastLane = s => W + 16 + 30 * smooth(s, pool0 - 40, pool0) * (1 - smooth(s, pool1, pool1 + 40));
  const coast = [];
  for (let s = sAt('ポルティエ') + 25; s <= sAt('アントニー・ノーグ') + 45; s += 6) {
    const lane = coastLane(s), q = track.pos(s, lane);
    // 別区間の走路に食い込む点は捨て、単純な多角形に保つ
    if (roadDist(q.x, q.z) > lane - W / 2 - 3) coast.push([q.x, q.z]);
  }
  const last = coast[coast.length - 1];
  // 直線の南端から西へ海岸線を延ばし、旧市街の岩山を海側に収める
  const seaPoly = [...coast, [last[0] - 50, last[1] + 45], [-1600, last[1] + 130], [-1600, 1600], [1600, 1600], [1600, coast[0][1] - 40], [coast[0][0] + 30, coast[0][1] - 20]];
  function inSea(x, z) {
    let inside = false;
    for (let i = 0, j = seaPoly.length - 1; i < seaPoly.length; j = i++) {
      const [xi, zi] = seaPoly[i], [xj, zj] = seaPoly[j];
      if ((zi > z) !== (zj > z) && x < (xj - xi) * (z - zi) / (zj - zi) + xi) inside = !inside;
    }
    return inside;
  }
  const waveTex = ctex(128, 128, g => {
    g.fillStyle = '#2591bd'; g.fillRect(0, 0, 128, 128);
    g.strokeStyle = 'rgba(190,240,255,.35)'; g.lineWidth = 2;
    for (let i = 0; i < 9; i++) { const x = rand(0, 128), y = rand(0, 128); g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 9, y - 4, x + 18, y); g.stroke(); }
  }, true);
  waveTex.repeat.set(1 / 26, 1 / 26);
  const sea = new THREE.Mesh(new THREE.ShapeGeometry(new THREE.Shape(seaPoly.map(([x, z]) => new THREE.Vector2(x, -z)))), toon('#ffffff', { map: waveTex }));
  sea.geometry.rotateX(-Math.PI / 2); sea.position.y = 0.05; sea.receiveShadow = true; world.add(sea);
  themeUpd.push(t => { waveTex.offset.set(t * 0.012, t * 0.007); });
  // 岸壁：海岸線に沿った石積みの壁
  const stone = toon('#d9ceb5', { side: THREE.DoubleSide });
  {
    const pts = [], idx = [];
    coast.forEach(([x, z], i) => {
      pts.push(x, -1.5, z, x, Math.max(0.7, track.groundH(x, z) + 0.25), z);
      if (i) { const k = (i - 1) * 2; idx.push(k, k + 2, k + 1, k + 1, k + 2, k + 3); }
    });
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3)); geo.setIndex(idx); geo.computeVertexNormals();
    world.add(new THREE.Mesh(geo, stone));
  }
  // 防波堤と灯台：港の口を左右から挟む
  const nearestCoast = (x, z) => coast.reduce((b, p) => (p[0] - x) ** 2 + (p[1] - z) ** 2 < (b[0] - x) ** 2 + (b[1] - z) ** 2 ? p : b);
  const quay = [], nearQuay = (x, z, r) => quay.some(q => Math.hypot(q.p.x - x, q.p.z - z) < r);
  const jetty = pts => {
    for (let i = 0; i < pts.length - 1; i++) {
      const [x0, z0] = pts[i], [x1, z1] = pts[i + 1], len = Math.hypot(x1 - x0, z1 - z0), n = Math.ceil(len / 10);
      for (let k = 0; k < n; k++) {
        const u = (k + 0.5) / n, yaw = -Math.atan2(z1 - z0, x1 - x0);
        quay.push({ p: new V3(lerp(x0, x1, u), 0.4, lerp(z0, z1, u)), s: new V3(len / n + 2, 3.2, 9), r: [0, yaw, 0] });
      }
    }
    return pts[pts.length - 1];
  };
  const eastRoot = nearestCoast(330, 0), westRoot = nearestCoast(-520, 300);
  const eastTip = jetty([eastRoot, [eastRoot[0] + 25, 120], [300, 230], [160, 290], [50, 300]]);
  const westTip = jetty([westRoot, [-400, 330], [-310, 335], [-230, 322]]);
  inst(BOX, stone, quay, false);
  [[eastTip, '#e44b4d'], [westTip, '#3fa860']].forEach(([[x, z], color]) => {
    const g = fantasyGroup(new V3(x, 2, z));
    part(g, new THREE.CylinderGeometry(2, 2.6, 13, 12), toon('#fff5df'), [0, 6.5, 0], null, null, 0.04);
    part(g, new THREE.CylinderGeometry(2.1, 2.1, 3, 12), toon(color), [0, 9, 0], null, null, 0);
    part(g, SPH_LO, glowMat('#fff1bf', 2.5), [0, 14, 0], [1.4, 1.4, 1.4], null, 0);
  });

  // ---- 港のヨット：桟橋の両側へ直角に係留し、まとめてゆっくり揺らす ----
  const fleet = fantasyGroup(), hulls = [], cabins = [], glass = [], bridges = [], masts = [], piers = [];
  for (const pz of [55, 135, 215]) {
    let x0 = null;
    for (let x = -420; x <= 300; x += 4) {
      const ok = inSea(x, pz) && roadDist(x, pz) > 40 && !nearQuay(x, pz, 22);
      if (ok && x0 == null) x0 = x;
      if ((!ok || x >= 300) && x0 != null) {
        if (x - x0 > 30) {
          piers.push({ p: new V3((x0 + x) / 2, 0.45, pz), s: new V3(x - x0 - 6, 0.5, 3) });
          for (let bx = x0 + 6; bx < x - 8; bx += rand(10, 15)) for (const side of [-1, 1]) {
            const len = rand(12, 24), beam = len * 0.3, z = pz + side * (len / 2 + 2.5), sail = Math.random() < 0.25;
            if (!inSea(bx, pz + side * (len + 3)) || nearQuay(bx, pz + side * (len + 3), 12)) continue;
            // 船尾を桟橋へ付け、船首を沖へ向ける
            const r = [0, (side > 0 ? Math.PI : 0) + rand(-0.04, 0.04), 0];
            hulls.push({ p: new V3(bx, 0.9, z), s: new V3(beam, 2.2, len), r, c: C(Math.random() < 0.2 ? '#1f3554' : '#fbf8f0') });
            cabins.push({ p: new V3(bx, 2.7, z - side * len * 0.08), s: new V3(beam * 0.78, sail ? 1.3 : 2.2, len * (sail ? 0.3 : 0.5)), r });
            glass.push({ p: new V3(bx, sail ? 2.8 : 3.0, z - side * len * 0.08), s: new V3(beam * 0.8, 0.8, len * (sail ? 0.24 : 0.44)), r });
            if (sail) masts.push({ p: new V3(bx, 9, z), s: new V3(0.18, 15, 0.18) });
            else bridges.push({ p: new V3(bx, 4.1, z - side * len * 0.02), s: new V3(beam * 0.6, 1.2, len * 0.26), r });
          }
        }
        x0 = null;
      }
    }
  }
  const white = toon('#fbf8f0');
  // 船体：船首を尖らせた五角形の柱（-z側が船首）
  const hullGeo = new THREE.ExtrudeGeometry(new THREE.Shape([[-0.5, -0.5], [0.5, -0.5], [0.5, 0.15], [0, 0.5], [-0.5, 0.15]].map(([x, y]) => new THREE.Vector2(x, y))), { depth: 1, bevelEnabled: false });
  hullGeo.rotateX(-Math.PI / 2); hullGeo.translate(0, -0.5, 0);
  [[hullGeo, toon('#ffffff'), hulls], [BOX, white, cabins], [BOX, toon('#3d6584'), glass], [BOX, white, bridges], [new THREE.CylinderGeometry(1, 1, 1, 5), toon('#e8e3d6'), masts], [BOX, toon('#9b7b5c'), piers]]
    .forEach(([geo, mat, list]) => { if (list.length) fleet.add(inst(geo, mat, list, false)); });
  fleet.userData.droneIgnore = true;
  themeUpd.push(t => { fleet.position.y = Math.sin(t * 0.9) * 0.12; });

  // ---- 走路の装備：赤白のバリア、外周の金網、コーナーの縁石（すべてインスタンス化） ----
  const barriers = [], posts = [], kerbs = [];
  // 急カーブでは短いブロックにして、直方体が走路の内側へはみ出さないようにする
  for (let s = 0, i = 0; s < track.L; i++) {
    const k = Math.max(track.curv(s), track.curv(s + 4)), len = k > 0.03 ? 2.5 : k > 0.012 ? 4 : 8, mid = Math.min(s + len / 2, track.L);
    for (const lane of [-1.3, W + 1.3]) {
      const q = track.pos(mid, lane);
      barriers.push({ p: new V3(q.x, q.y + 0.65, q.z), s: new V3(len - 0.3, 1.25, 0.8), r: [0, -q.h, 0], c: C(i % 2 ? '#fff5df' : '#e44b4d') });
    }
    s += len;
  }
  inst(BOX, toon('#ffffff'), barriers, false);
  const fenceTex = ctex(64, 64, g => {
    g.strokeStyle = '#8f999e'; g.lineWidth = 3;
    g.beginPath(); g.moveTo(0, 0); g.lineTo(64, 64); g.moveTo(64, 0); g.lineTo(0, 64); g.stroke();
    g.fillStyle = '#8f999e'; g.fillRect(0, 0, 64, 3);
  }, true);
  const fenceMat = toon('#ffffff', { map: fenceTex, alphaTest: 0.4, side: THREE.DoubleSide });
  const wallRibbon = (s0, s1, lane, y0, y1, mat) => {
    const n = Math.max(1, Math.ceil((s1 - s0) / 3)), pts = [], uv = [], idx = [];
    for (let i = 0; i <= n; i++) {
      const s = lerp(s0, s1, i / n), q = track.pos(s, lane);
      pts.push(q.x, q.y + y0, q.z, q.x, q.y + y1, q.z); uv.push((s - s0) / 1.6, 0, (s - s0) / 1.6, (y1 - y0) / 1.6);
      if (i < n) { const k = i * 2; idx.push(k, k + 2, k + 1, k + 1, k + 2, k + 3); }
    }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    geo.setIndex(idx); geo.computeVertexNormals();
    const mesh = new THREE.Mesh(geo, mat); world.add(mesh); return mesh;
  };
  // 金網はトンネルの外だけ。アルファテストで半透明の並べ替えを避ける
  wallRibbon(tb + 4, track.L + ta - 4, W + 1.9, 1.2, 4.4, fenceMat);
  for (let s = tb + 4; s < track.L + ta - 4; s += 8) { const q = track.pos(s, W + 1.9); posts.push({ p: new V3(q.x, q.y + 2.4, q.z), s: new V3(0.16, 4.4, 0.16) }); }
  inst(BOX, toon('#7d878c'), posts, false);
  for (let s = 0, k = 0; s < track.L; s += 1.6) {
    if (track.curv(s) < 0.012) continue;
    for (const lane of [-0.35, W + 0.35]) {
      const q = track.pos(s, lane);
      kerbs.push({ p: new V3(q.x, q.y + 0.06, q.z), s: new V3(1.6, 0.1, 0.9), r: [0, -q.h, 0], c: C(k % 2 ? '#fff5df' : '#e44b4d') });
    }
    k++;
  }
  inst(BOX, toon('#ffffff'), kerbs, false);

  // ---- トンネル：連続した壁と天井を1枚ずつの帯で作り、照明は発光板のみ（点光源なし） ----
  const concrete = toon('#9d968a', { side: THREE.DoubleSide }), roofMat = toon('#b8ae9c', { transparent: true, side: THREE.DoubleSide });
  const walls = [wallRibbon(ta, tb, -2.8, 2.2, 9.6, concrete), wallRibbon(ta, tb, W + 2.8, 2.2, 9.6, concrete)];
  // 腰壁は外から見ても常に表示し、上の壁だけをカメラ位置で出し入れする
  wallRibbon(ta, tb, -2.8, -0.3, 2.2, concrete); wallRibbon(ta, tb, W + 2.8, -0.3, 2.2, concrete);
  const roof = courseRibbon(ta, tb, -3.4, W + 3.4, 9.6, roofMat);
  const lamps = [];
  for (let s = ta + 3; s < tb; s += 6) {
    const q = track.pos(s, W / 2);
    lamps.push({ p: new V3(q.x, q.y + 9.3, q.z), s: new V3(3.4, 0.16, 0.7), r: [0, -q.h, 0] });
    for (const lane of [-2.6, W + 2.6]) { const w = track.pos(s + 3, lane); lamps.push({ p: new V3(w.x, w.y + 6.5, w.z), s: new V3(1.6, 0.3, 0.3), r: [0, -w.h, 0] }); }
  }
  // 照明も上の壁と一緒に出し入れし、外から見て宙に浮かないようにする
  walls.push(inst(BOX, glowMat('#ffd48a', 2.6), lamps, false));
  for (const s of [ta, tb]) {
    const f = tp(s, W / 2), g = fantasyGroup(f.v); g.rotation.y = -f.h;
    addBox(g, [3, 4.6, W + 9], [0, 11.9, 0], toon('#d7cdb7'), null, 0.02);
    for (const z of [-W / 2 - 3.6, W / 2 + 3.6]) addBox(g, [3, 9.6, 1.6], [0, 4.8, z], toon('#d7cdb7'));
  }
  world.userData.tunnel = { a: ta, b: tb, roofs: [roof], walls, roofMat };

  // ---- 名所：カジノ、トンネル脇のホテル、プール ----
  const cream = toon('#f3e6c8'), copper = toon('#79a891'), creamDark = toon('#e5d3ac');
  {
    // 正面の広場ぶん走路から離して置き、正面（アーチと噴水）を走路側へ向ける
    const w = 46, d = 26, spot = findSpot((sAt('マスネ') + sAt('カジノ')) / 2, W + 34, w, d, W / 2 + 24, 4), front = -track.sgn;
    if (spot) {
      const g = registerLandmark(fantasyGroup(new V3(spot.x, 0, spot.z)), 'カジノ');
      g.rotation.y = spot.yaw; occupied.push({ x: spot.x, z: spot.z, r: Math.hypot(w, d) / 2 + 20 });
      // 坂の途中でも広場が埋もれないよう、芝生の土台ごと水平に据える
      landmarkFoundation(g, w + 20, d + 24, '#7fb267');
      part(g, new THREE.CylinderGeometry(4, 4.4, 1.2, 16), toon('#e9e2d0'), [0, 0.8, front * (d / 2 + 7)], null, null, 0);
      part(g, new THREE.CylinderGeometry(3.4, 3.4, 0.3, 16), glowMat('#7fd6ef', 1.1), [0, 1.3, front * (d / 2 + 7)], null, null, 0);
      addBox(g, [w, 16, d], [0, 7, 0], cream, null, 0.02);
      addBox(g, [w + 1, 1.2, d + 1], [0, 15.4, 0], creamDark);
      for (const x of [-w / 2 + 4, w / 2 - 4]) {
        addBox(g, [8, 24, 8], [x, 11, front * (d / 2 - 4)], cream, null, 0.02);
        part(g, new THREE.ConeGeometry(5.6, 7, 4), copper, [x, 26.5, front * (d / 2 - 4)], null, [0, Math.PI / 4, 0], 0.03);
      }
      part(g, new THREE.SphereGeometry(7, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), copper, [0, 16, 0], null, null, 0.03);
      const arches = [];
      for (let k = 0; k < 7; k++) arches.push({ p: new V3((k - 3) * 5, 6, front * (d / 2 + 0.1)), s: new V3(2.6, 6, 0.3) });
      g.add(inst(BOX, toon('#5d7287'), arches, false));
    }
  }
  {
    const w = 120, d = 26, spot = findSpot(ta + 75, -18, w, d, W / 2 + 8, -4);
    if (spot) {
      const y = baseY(spot.x, spot.z, spot.yaw, w, d), g = registerLandmark(fantasyGroup(new V3(spot.x, y, spot.z)), 'グランドホテル');
      g.rotation.y = spot.yaw; occupied.push({ x: spot.x, z: spot.z, r: w / 2 + 4 });
      addBox(g, [w, 26, d], [0, 12, 0], toon('#f1ede2'), null, 0.02);
      const bands = [];
      for (let fy = 3; fy < 24; fy += 3.2) bands.push({ p: new V3(0, fy, 0), s: new V3(w + 0.2, 1.4, d + 0.2) }, { p: new V3(0, fy - 1.2, 0), s: new V3(w + 1.2, 0.3, d + 1.2) });
      g.add(inst(BOX, toon('#ffffff'), bands.map((b, i) => ({ ...b, c: C(i % 2 ? '#fbf8f0' : '#86a9c4') })), false));
      addBox(g, [w + 2, 1, d + 2], [0, 25.3, 0], toon('#c9b99a'));
    }
  }
  {
    const s = (pool0 + pool1) / 2, f = tp(s, W + 27), g = registerLandmark(fantasyGroup(new V3(f.v.x, track.groundH(f.v.x, f.v.z), f.v.z)), 'プール');
    g.rotation.y = -f.h; occupied.push({ x: f.v.x, z: f.v.z, r: 34 });
    addBox(g, [62, 0.9, 28], [0, 0.35, 0], toon('#f4efe4'));
    addBox(g, [50, 0.2, 18], [0, 0.82, 0], glowMat('#5fd2ef', 1.15));
    const ropes = [];
    for (let k = -3; k <= 3; k++) ropes.push({ p: new V3(0, 0.95, k * 2.4), s: new V3(50, 0.12, 0.18), c: C(k % 2 ? '#ffffff' : '#e44b4d') });
    g.add(inst(BOX, toon('#ffffff'), ropes, false));
    addBox(g, [2, 6, 2], [28, 3, 10], toon('#f4efe4')); addBox(g, [4, 0.4, 1.2], [26.5, 6, 10], toon('#e44b4d'));
  }

  // ---- 街並み：パステルの集合住宅を走路の両側へ段々に並べる。窓とバルコニーは外周を巻く帯 ----
  // スタンドと大型ビジョンの場所は先に確保する
  for (let s = 0; s <= 270; s += 15) { const q = track.pos(s, W + 26); occupied.push({ x: q.x, z: q.z, r: 20 }); }
  { const q = track.pos(track.finishS - 70, -26); occupied.push({ x: q.x, z: q.z, r: 26 }); }
  const facades = ['#f3dcc0', '#efc4a6', '#f6e7cf', '#e8d6bb', '#f4f0e6', '#dcc7a3', '#f1b9a0', '#e3e6dc', '#f7d9a8'].map(C);
  const roofs = ['#c57963', '#b7aca0', '#d08a6a'].map(C);
  const B = { body: [], roof: [], win: [], balc: [] };
  const building = (x, y, z, yaw, w, d, h) => {
    const r = [0, yaw, 0];
    B.body.push({ p: new V3(x, y + h / 2 - 1, z), s: new V3(w, h + 2, d), r, c: facades[(Math.random() * facades.length) | 0] });
    B.roof.push({ p: new V3(x, y + h + 0.4, z), s: new V3(w + 0.8, 0.9, d + 0.8), r, c: roofs[(Math.random() * roofs.length) | 0] });
    for (let fy = 3.4; fy < h - 1.2; fy += 3.4) {
      B.win.push({ p: new V3(x, y + fy, z), s: new V3(w + 0.16, 1.1, d + 0.16), r });
      B.balc.push({ p: new V3(x, y + fy - 1.1, z), s: new V3(w + 1, 0.28, d + 1), r });
    }
    occupied.push({ x, z, r: Math.hypot(w, d) / 2 });
  };
  for (let s = 0; s < track.L; s += 13) for (const side of [1, -1]) for (let row = 0; row < 4; row++) {
    const lane = side > 0 ? W + 24 + row * 25 + rand(-4, 4) : -16 - row * 25 + rand(-4, 4);
    const f = tp(s + rand(-4, 4), lane), w = rand(14, 22), d = rand(11, 17), yaw = -f.h;
    const { x, z } = f.v;
    if (!free(x, z, Math.hypot(w, d) / 2 + 1) || !rectClear(x, z, yaw, w, d, W / 2 + 9)) continue;
    // 丘の上と奥の列ほど高い塔にする（モンテカルロの斜面に建つ高層住宅）
    const y = baseY(x, z, yaw, w, d), h = rand(10, 20) + row * rand(3, 8) + y * 1.2 + (Math.random() < 0.08 ? rand(15, 30) : 0);
    building(x, y, z, yaw, w, d, h);
  }
  // モナコ・ヴィル：海へ突き出した岩山の上の宮殿と旧市街
  const rock = new V3(last[0] - 210, 0, last[1] + 300);
  {
    const g = fantasyGroup(rock);
    part(g, new THREE.CylinderGeometry(1, 1.3, 1, 11), toon('#9c968a'), [0, 22, 0], [140, 46, 95], null, 0);
    part(g, new THREE.CylinderGeometry(1, 1, 1, 11), toon('#7ea463'), [0, 45.5, 0], [139, 1.4, 94], null, 0);
    addBox(g, [70, 14, 34], [-25, 52, 10], cream, null, 0.02);
    addBox(g, [9, 26, 9], [-55, 58, 22], cream, null, 0.02);
    const crenels = [];
    for (let k = 0; k < 18; k++) crenels.push({ p: new V3(-58 + k * 3.8, 59.6, -7.2), s: new V3(1.8, 1.4, 1.2) }, { p: new V3(-58 + k * 3.8, 59.6, 27.2), s: new V3(1.8, 1.4, 1.2) });
    g.add(inst(BOX, cream, crenels, false));
    addBox(g, [18, 13, 30], [32, 51.5, -20], creamDark, null, 0.02);
    part(g, new THREE.SphereGeometry(6, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), toon('#c9c2b3'), [32, 58, -12], null, null, 0.03);
    for (let k = 0; k < 26; k++) {
      const a = rand(0, Math.PI * 2), rr = rand(0.35, 0.82), x = rock.x + Math.cos(a) * 130 * rr, z = rock.z + Math.sin(a) * 88 * rr;
      if (!free(x, z, 9)) continue;
      building(x, 45, z, rand(0, 3), rand(9, 15), rand(8, 12), rand(6, 13));
    }
  }
  occupied.push({ x: rock.x - 25, z: rock.z + 10, r: 45 });
  inst(BOX, toon('#ffffff'), B.body).receiveShadow = true;
  inst(BOX, toon('#ffffff'), B.roof, false);
  inst(BOX, toon('#86a9c4'), B.win, false);
  fantasyInst(BOX, toon('#fbf6ea'), B.balc, false);

  // ---- 緑：港と直線のヤシ並木、街の街路樹、背後の山並み ----
  const palmTrunks = [], fronds = [];
  const addPalm = (x, z) => {
    if (!free(x, z, 2) || inSea(x, z) || roadDist(x, z) < W / 2 + 4) return;
    const y = track.groundH(x, z), h = rand(7, 11);
    palmTrunks.push({ p: new V3(x, y, z), s: new V3(1, h, 1), r: [rand(-0.08, 0.08), 0, rand(-0.08, 0.08)] });
    for (let k = 0; k < 7; k++) {
      const yaw = k / 7 * Math.PI * 2 + rand(-0.2, 0.2);
      fronds.push({ p: new V3(x, y + h, z), s: new V3(rand(3.8, 5), 0.14, 1.1), r: [0, yaw, -rand(0.35, 0.6)], c: C(['#3f8f4a', '#4fa04e', '#5aa858'][k % 3]) });
    }
    occupied.push({ x, z, r: 2 });
  };
  const along = (s0, s1, lane, step) => { for (let s = s0; s < s1; s += step) { const q = track.pos(s, lane); addPalm(q.x, q.z); } };
  along(sAt('アントニー・ノーグ') + 40, track.L, -6.5, 16); along(0, sAt('サント・デボーテ') - 30, -6.5, 16);
  along(sAt('アントニー・ノーグ') + 40, track.L, W + 6.5, 22); along(0, sAt('サント・デボーテ') - 30, W + 6.5, 22);
  along(sAt('タバック') + 20, sAt('ラスカス'), W + 7, 14);
  along(sAt('ヌーヴェル・シケイン') + 30, sAt('タバック') - 20, W + 7, 18);
  along(sAt('サント・デボーテ') + 40, sAt('マスネ') - 30, W + 6.5, 20);
  const trunkGeo = new THREE.CylinderGeometry(0.28, 0.45, 1, 6); trunkGeo.translate(0, 0.5, 0);
  const frondGeo = new THREE.BoxGeometry(1, 1, 1); frondGeo.translate(0.5, 0, 0);
  fantasyInst(trunkGeo, toon('#9a7a55'), palmTrunks);
  fantasyInst(frondGeo, toon('#ffffff'), fronds, false);
  const crowns = [], trunks = [], greens = ['#4f8f4c', '#5f9e52', '#6caa58', '#47804a'].map(C);
  for (let i = 0; i < 700 && crowns.length < 260; i++) {
    const s = rand(0, track.L), f = tp(s, Math.random() < 0.5 ? -rand(12, 110) : W + rand(12, 110)), { x, z } = f.v;
    if (!free(x, z, 3) || inSea(x, z) || roadDist(x, z) < W / 2 + 6) continue;
    const y = track.groundH(x, z), sc = rand(2.4, 3.6);
    trunks.push({ p: new V3(x, y + 1.2, z), s: new V3(0.4, 2.4, 0.4) });
    crowns.push({ p: new V3(x, y + 2.4 + sc * 0.8, z), s: new V3(sc, sc * 0.9, sc), c: greens[i % 4] });
    occupied.push({ x, z, r: 3 });
  }
  fantasyInst(new THREE.CylinderGeometry(1, 1, 1, 5), toon('#7a5c42'), trunks, false);
  fantasyInst(SPH_LO, toon('#ffffff'), crowns);
  // 山並みは陸側（北）にだけ置き、海側の水平線を空ける
  const hills = [], hillGeo = new THREE.ConeGeometry(1, 1, 7); hillGeo.translate(0, 0.5, 0);
  for (let i = 0; i < 16; i++) {
    const a = Math.PI * (1.08 + i / 15 * 0.84) + rand(-0.04, 0.04), r = rand(1000, 1200), rr = rand(160, 260);
    hills.push({ p: new V3(Math.cos(a) * r * 1.2, -5, Math.sin(a) * r), s: new V3(rr, rand(160, 300), rr), r: [0, rand(0, 3), 0], c: C(['#7f9c84', '#8aa58b', '#93a990'][i % 3]) });
  }
  // 手前の丘：街並みの奥の平地を緑の斜面で埋める
  for (let i = 0; i < 60 && hills.length < 30; i++) {
    const a = Math.PI * rand(0.95, 2.05), r = rand(700, 950), x = Math.cos(a) * r * 1.25, z = Math.sin(a) * r, rr = rand(160, 260);
    if (inSea(x, z) || roadDist(x, z, 400) < rr + 110) continue;
    hills.push({ p: new V3(x, -3, z), s: new V3(rr, rand(60, 130), rr), r: [0, rand(0, 3), 0], c: C(['#88a777', '#7c9d70', '#94b07f'][i % 3]) });
  }
  inst(hillGeo, toon('#ffffff', { fog: true }), hills, false);

  // ---- コーナー名の看板 ----
  const signPosts = [];
  for (const c of track.corners) {
    const f = tp(c.s - 30, W + 5);
    if (roadDist(f.v.x, f.v.z) < W / 2 + 3) continue;
    const tex = ctex(256, 64, g => {
      g.fillStyle = '#16325c'; g.fillRect(0, 0, 256, 64); g.fillStyle = '#e44b4d'; g.fillRect(0, 54, 256, 10);
      g.fillStyle = '#ffffff'; g.font = 'bold 30px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(c.name, 128, 28, 240);
    });
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex }));
    sp.position.copy(f.v).add(new V3(0, 6.2, 0)); sp.scale.set(9, 2.25, 1); world.add(sp);
    signPosts.push({ p: new V3(f.v.x, f.v.y + 2.6, f.v.z), s: new V3(0.25, 5.2, 0.25) });
  }
  inst(BOX, toon('#d9d3c4'), signPosts, false);
}
