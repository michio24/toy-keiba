// チャーチルダウンズ
'use strict';

// 楕円の中心(652.4, 459.7)から長軸（北東向き）をu、短軸（向正面側の南東向き）をvとし、ホームの内柵上の4コーナー出口(u, v) = (212, -119)をコースの起点に合わせる
function churchillUV(u, v) {
  const k = track.def.scale, along = (212 - u) * 1.034, inward = (v + 119) * 1.034;
  return new V3(track.xs[0] + along * k, 0, track.zs[0] + inward * k * track.turn);
}
function churchillAt(px, py) {
  const dx = px - 652.4, dy = py - 459.7;
  return churchillUV(dx * 0.86305 - dy * 0.50512, dx * 0.50512 + dy * 0.86305);
}
function decorChurchill(th) {
  // 配置は航空写真の柵・建物・道路の位置を参考にしたデフォルメ
  const at = churchillAt, uv = churchillUV, k = track.def.scale, v = (x, z) => new V3(x, 0, z);
  const route = pts => {
    const ps = pts.map(([x, y]) => at(x, y)), curve = ps.length > 2 ? new THREE.CatmullRomCurve3(ps, false, 'centripetal') : new THREE.LineCurve3(ps[0], ps[1]);
    return decorPath(curve.getSpacedPoints(Math.ceil(curve.getLength() / 1.5)));
  };
  // 本線からの距離と、周回の内側かどうか（建物や木の置き場所の判定）
  const loop = []; for (let i = 0; i < track.N; i += 6) loop.push(v(track.xs[i], track.zs[i]));
  const gap = p => { let d = 1e18; for (const q of loop) d = Math.min(d, (q.x - p.x) ** 2 + (q.z - p.z) ** 2); return Math.sqrt(d); };
  const inside = p => { let c = false; for (let i = 0, j = loop.length - 1; i < loop.length; j = i++) { const a = loop[i], b = loop[j]; if ((a.z > p.z) !== (b.z > p.z) && p.x < (b.x - a.x) * (p.z - a.z) / (b.z - a.z) + a.x) c = !c; } return c; };
  // 写真の点(px, py)での向き（写真の向きdx, dyがワールドで向く角度。ローカルの+xをその向きへ）
  const heading = (x, y, dx, dy) => { const a = at(x, y), b = at(x + dx, y + dy); return Math.atan2(-(b.z - a.z), b.x - a.x); };
  // 写真の多角形を地面に貼る（駐車場・広場）
  const slab = (pts, mat, lift = 0.08) => {
    const shape = new THREE.Shape(pts.map(([x, y]) => { const p = at(x, y); return new THREE.Vector2(p.x, -p.z); }));
    const m = new THREE.Mesh(new THREE.ShapeGeometry(shape), mat); m.rotation.x = -Math.PI / 2; m.position.y = lift; m.receiveShadow = true; world.add(m); return m;
  };

  // 内側の芝コース（マット・ウィン・ターフコース、1周7ハロン）：ダートの内柵のすぐ内側
  decorCourseLane(track, 'turf', 0, track.L, { lanes: [-2.5, -14], cols: 4, step: 1.5, onGround: true, lift: 0.25 });
  // 向正面の引き込み線（2ハロンのシュート）：1コーナーの先から向正面の延長線上へまっすぐ延び、1マイルまでのワンターンの競走が発走する
  decorTurfPocket(track.segStart[2], 402 * k, false, decorTurfMat());

  // 駐車場：スタンドの西に広がる大きな駐車場と、北西のセントラル通り沿いの駐車場。止まっている車も置く
  const asphalt = toon('#8d8f8c', { side: THREE.DoubleSide });
  const lots = [[[140, 140], [330, 175], [345, 300], [265, 430], [135, 440]], [[150, 452], [262, 452], [262, 590], [222, 660], [300, 830], [150, 835]], [[25, 590], [108, 590], [108, 905], [25, 905]]];
  const cars = [], carCols = ['#f2f2f2', '#2b2b2b', '#b8bec4', '#9b2f2f', '#2f4f8f', '#d8d2c0'].map(C);
  for (const poly of lots) {
    slab(poly, asphalt);
    const xs = poly.map(q => q[0]), ys = poly.map(q => q[1]), ang = heading(0, 0, 0, 1);
    for (let y = Math.min(...ys) + 8; y < Math.max(...ys) - 6; y += 9) for (let x = Math.min(...xs) + 6; x < Math.max(...xs) - 6; x += 3.2) {
      if (Math.random() < 0.45) continue;
      const pt = [x, y], inPoly = (() => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const a = poly[i], b = poly[j]; if ((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) c = !c; } return c; })();
      if (!inPoly) continue;
      const p = at(...pt); cars.push({ p: new V3(p.x, 0.75, p.z), s: new V3(2.3, 0.75, 1), r: [0, ang, 0], c: carCols[(Math.random() * carCols.length) | 0] });
    }
  }
  const carMesh = inst(BOX, toon('#ffffff'), cars, false); carMesh.userData.fullCount = cars.length; themeDetails.push(carMesh);

  // 厩舎（バックサイド）：向正面の外と引き込み線の南に、緑の屋根の長屋がずらりと並ぶ。中継カメラ（走路の外24m）の通り道にかかる棟は置かない
  { const walls = [], roofs = [], ridge = [], shed = (p, ang, len, wid) => {
      if (gap(p) < 36 || inside(p)) return;
      walls.push({ p: new V3(p.x, 1.6, p.z), s: new V3(len * k, 3.2, wid * k), r: [0, ang, 0] });
      roofs.push({ p: new V3(p.x, 3.5, p.z), s: new V3(len * k + 0.8, 0.7, wid * k + 1.2), r: [0, ang, 0] });
      ridge.push({ p: new V3(p.x, 4.1, p.z), s: new V3(len * k + 0.8, 0.5, wid * k * 0.35), r: [0, ang, 0] });
    };
    const across = heading(652.4, 459.7, 0.50512, 0.86305), lengthwise = heading(652.4, 459.7, 0.86305, -0.50512), east = heading(650, 800, 1, 0);
    // 向正面の外：向正面に直交する向きの長屋が斜めの列をなす（外側の道路の輪まで）
    for (let u = -20; u <= 245; u += 21) for (const v0 of [205, 262]) { if (v0 + 25 > 330 - Math.abs(u - 110) * 0.5) continue; shed(uv(u, v0), across, 52, 12); }
    // 南の碁盤目：東西に長い長屋が道路をはさんで並ぶ
    for (const x of [548, 621, 694, 767]) for (let y = 742; y <= 884; y += 21) shed(at(x, y), east, 58, 12);
    // 引き込み線の南：シュートと平行な長屋が2列
    for (let u = -560; u <= -360; u += 66) for (const v0 of [158, 186]) shed(uv(u + (v0 > 170 ? 30 : 0), v0), lengthwise, 60, 12);
    inst(BOX, toon('#efe9dc'), walls, false); inst(BOX, toon('#4f7a6a'), roofs, false); inst(BOX, toon('#3f6557'), ridge, false); }

  // ファーストターン・クラブ（2023年）：1コーナーの外の、白い大屋根の観覧席（約5100席）とその下のクラブ。中継カメラの通り道をあけて少し外へ置く
  { const p = uv(-400, 5), aim = uv(-189, 0), g = registerLandmark(new THREE.Group(), 'ファーストターン・クラブ');
    g.position.set(p.x, 0, p.z); g.rotation.y = Math.atan2(aim.x - p.x, aim.z - p.z); world.add(g);
    const white = toon('#f4f2ec'), glass = toon('#7fa3b5'), seatA = toon('#2f6a4f'), seatB = toon('#e8e2d2');
    addBox(g, [62, 6, 14], [0, 3, -12], glass, null, 0.02); addBox(g, [63, 0.8, 15], [0, 6.2, -12], white, null, 0);
    for (let j = 0; j < 8; j++) addBox(g, [60 - j * 0.6, 1.2 + j * 1.5, 2.4], [0, 0.6 + j * 0.75, 9 - j * 2.4], j % 2 ? seatA : seatB, null, 0);
    addBox(g, [64, 16, 1], [0, 8, -19.5], white, null, 0.02);
    addBox(g, [68, 1, 32], [0, 16.5, -3], white, [-0.06, 0, 0], 0.02);
    for (let x = -30; x <= 30; x += 12) addBox(g, [0.7, 16, 0.7], [x, 8, -18.5], toon('#c5c9cc'), null, 0); }
  // 1コーナーの観覧席：クラブハウスからファーストターン・クラブまで、コーナーに沿って段々の席が続く
  { const steps = [];
    for (let s = track.homeS1 + 2; s < track.homeS1 + 34; s += 2) for (let j = 0; j < 6; j++) {
      const q = tp(s, W + 18 + j * 2.4); steps.push({ p: new V3(q.v.x, 0.5 + j * 0.5, q.v.z), s: new V3(2.3, 1 + j * 1, 2.3), r: [0, -q.h, 0] });
    }
    inst(BOX, toon('#d8d3c6'), steps, false); }

  // 内馬場：ダービーの日に観客が集まる広場。通路が斜めに横切り、赤い舗装の広場と白いテント、青い屋根の棟が建つ
  { const path = toon('#d6d2c4', { side: THREE.DoubleSide });
    for (const [a, b] of [[[-175, -40], [175, -40]], [[-150, -80], [-60, 60]], [[60, -80], [160, 60]], [[-60, 60], [60, -80]]]) {
      const r = decorPath([uv(...a), uv(...b)]);
      decorCourseLane(r, 'dirt', 0, r.L, { lanes: [W / 2 - 1.5, W / 2 + 1.5], cols: 1, step: 4, onGround: true, lift: 0.12, mat: path });
    }
    const plaza = (u0, v0, du, dv, mat) => slab([[u0 - du, v0 - dv], [u0 + du, v0 - dv], [u0 + du, v0 + dv], [u0 - du, v0 + dv]].map(([u, w]) => [652.4 + u * 0.86305 + w * 0.50512, 459.7 - u * 0.50512 + w * 0.86305]), mat, 0.14);
    plaza(0, -5, 46, 26, toon('#c9675a', { side: THREE.DoubleSide }));
    const along = heading(652.4, 459.7, 0.86305, -0.50512), white = toon('#f4f2ec');
    for (const [u, w] of [[40, -12], [40, 20]]) { const p = uv(u, w); part(world, new THREE.SphereGeometry(1, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), white, [p.x, 0, p.z], [5, 4, 5], null, 0.03); }
    for (const [u, w, du, dv, col] of [[-94, 27, 24, 12, '#4f7fa8'], [124, 1, 22, 10, '#4f7fa8'], [116, -72, 30, 6, '#e8e4da'], [-168, -28, 38, 20, '#cfc8b8']]) {
      const p = uv(u, w); addBox(world, [du * 1.034 * k, 4, dv * 1.034 * k], [p.x, 2, p.z], toon('#ece6d8'), [0, along, 0], 0.02);
      addBox(world, [du * 1.034 * k + 0.6, 0.6, dv * 1.034 * k + 0.6], [p.x, 4.3, p.z], toon(col), [0, along, 0], 0);
    }
    const spots = [];
    for (let n = 0; n < 300 && spots.length < 26; n++) {
      const p = uv(rand(-200, 230), rand(-80, 80));
      if (!inside(p) || gap(p) < 30 || p.distanceTo(boardPos) < 26 || Math.abs(p.z - uv(0, -5).z) < 20 && Math.abs(p.x - uv(0, -5).x) < 30) continue;
      spots.push({ p, s: rand(0.9, 1.3) });
    }
    roundTrees(spots, ['#3f8f3a', '#4fa546', '#58ad4a']); }
  // バラの花壇：ゴール前の外ラチ沿い
  { const rose = [], leaf = [], rg = new THREE.IcosahedronGeometry(1, 0);
    for (let i = 0; i < 260; i++) { const q = tp(track.finishS + rand(-90, 20), W + rand(3, 7)); q.v.y = track.groundH(q.v.x, q.v.z);
      rose.push({ p: new V3(q.v.x, q.v.y + 0.55, q.v.z), s: new V3(0.32, 0.32, 0.32), c: C(['#d9203a', '#ff3355', '#b01030'][i % 3]) }); leaf.push({ p: new V3(q.v.x, q.v.y + 0.25, q.v.z), s: new V3(0.5, 0.35, 0.5) }); }
    const rm = inst(rg, toon('#ffffff'), rose, false), lm = inst(rg, toon('#2f6e2c'), leaf, false);
    for (const m of [rm, lm]) { m.userData.fullCount = rose.length; themeDetails.push(m); } }

  // 場外の道路：北のセントラル通り、南のロングフィールド通り、東の南3丁目通り（州道1020号）、北西のテイラー大通り、西のウォーレン通り、東のオークデール通り
  const roadPts = [[[-200, 62], [300, 120], [620, 155], [830, 195], [1040, 230], [1450, 318]], [[-200, 930], [400, 935], [800, 938], [1450, 948]],
    [[1240, -200], [1225, 0], [1205, 200], [1170, 420], [1120, 600], [1050, 740], [970, 840], [935, 1008], [910, 1200]], [[300, -100], [225, 0], [140, 90], [40, 200], [-120, 370]],
    [[118, 440], [120, 1008], [122, 1200]], [[1045, 240], [1062, 600], [1080, 1008], [1090, 1200]]];
  const roads = roadPts.map(route);
  for (const r of roads) {
    decorCourseLane(r, 'dirt', 0, r.L, { lanes: [W / 2 - 5, W / 2 + 5], cols: 2, step: 3, onGround: true, lift: 0.1, mat: toon('#6f7275', { side: THREE.DoubleSide }) });
    decorCourseLane(r, 'dirt', 0, r.L, { lanes: [W / 2 - 0.2, W / 2 + 0.2], cols: 1, step: 3, onGround: true, lift: 0.14, mat: toon('#f2f0e6', { side: THREE.DoubleSide }) });
  }
  const nearRoad = (p, d) => roads.some(r => r.pts.some(q => (q.x - p.x) ** 2 + (q.z - p.z) ** 2 < d * d));

  // 周りの住宅地：南北の通りに沿って、間口の狭い奥に長い家（ショットガンハウス）が並ぶ。競馬場の敷地と駐車場は空ける
  const facility = [[125, 92], [640, 158], [1040, 232], [1050, 500], [1010, 760], [945, 905], [945, 948], [15, 948], [15, 445], [125, 445]];
  const inFacility = (x, y) => { let c = false; for (let i = 0, j = facility.length - 1; i < facility.length; j = i++) { const a = facility[i], b = facility[j]; if ((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) c = !c; } return c; };
  { const walls = [], roofs = [], trees = [], wallCols = ['#efe6d2', '#d9c7a6', '#c8d4dc', '#e8d8c8', '#b9c8b0', '#f2efe8', '#c99a7a'].map(C), roofCols = ['#4a4f57', '#6b5a4c', '#3f4a5a', '#7a6f66', '#5a5f52'].map(C);
    const ang = heading(650, 460, 0, 1);
    for (let gx = -380; gx <= 1700; gx += 15) for (let gy = -330; gy <= 1360; gy += 26) {
      if ((gy + 330) % 104 === 78 || (gx + 380) % 150 === 135 || Math.random() < 0.3) continue;
      const x = gx + rand(-1.5, 1.5), y = gy + rand(-2, 2), d = Math.hypot(x - 650, y - 480);
      if (d > 900 || inFacility(x, y)) continue;
      const p = at(x, y);
      if (nearRoad(p, 9) || gap(p) < 60) continue;
      const w = rand(6, 8) * k, l = rand(11, 16) * k, h = rand(3.4, 5.2), roofC = roofCols[(Math.random() * roofCols.length) | 0];
      walls.push({ p: new V3(p.x, h / 2, p.z), s: new V3(l, h, w), r: [0, ang, 0], c: wallCols[(Math.random() * wallCols.length) | 0] });
      roofs.push({ p: new V3(p.x, h + 0.5, p.z), s: new V3(l + 0.4, 1, w + 0.5), r: [0, ang, 0], c: roofC });
      if (Math.random() < 0.18) { const t = at(x + 7, y + rand(-8, 8)); trees.push({ p: new V3(t.x, 0, t.z), s: rand(1, 1.5) }); }
    }
    for (const m of [inst(BOX, toon('#ffffff'), walls, false), inst(BOX, toon('#ffffff'), roofs, false)]) { m.userData.fullCount = walls.length; themeDetails.push(m); }
    // セントラル通りの並木と、競馬場の敷地のふちの木立
    for (const r of [roads[0], roads[1]]) for (let i = 0; i < r.pts.length; i += 14) { const q = r.pts[i]; for (const s of [-1, 1]) { const p = v(q.x + s * 6, q.z + s * 6); if (gap(p) > 44 && !nearRoad(p, 5)) trees.push({ p, s: rand(1, 1.4) }); } }
    roundTrees(trees, ['#3f8f3a', '#4fa546', '#58ad4a', '#2f7a34']); }

  // 遠景（図鑑の全景では隠す）：北北東のルイビル中心街の高層ビル群、東のルイビル大学のフットボールスタジアム
  const base = at(652, 460), toward = (dx, dy, dist) => { const d = at(652 + dx * 100, 460 + dy * 100).sub(base).setY(0).normalize(); return base.clone().addScaledVector(d, dist).setY(0); };
  const backdrop = o => { o.userData.backdrop = true; return o; };
  { const c = toward(0.25, -1, 1300), dir = c.clone().sub(base).normalize(), g = new THREE.Group(); g.position.copy(c); g.rotation.y = Math.atan2(dir.x, dir.z); world.add(backdrop(g));
    const glassC = ['#8fa0b0', '#a9b4bd', '#c9b9a6', '#6f8296', '#d6cfc2'];
    for (let i = 0; i < 18; i++) { const x = (i - 8.5) * 22 + rand(-6, 6), z = rand(-50, 50), h = rand(40, 120) * (1 - Math.abs(i - 8.5) / 14), w = rand(14, 24); addBox(g, [w, h, w], [x, h / 2, z], toon(glassC[i % 5], { fog: true })); }
    // 中心街でいちばん高いビル（頂上に丸いドーム）と、ピンクの花崗岩のビル
    addBox(g, [22, 170, 22], [6, 85, 0], toon('#9aa8b6', { fog: true })); part(g, SPH_LO, toon('#b9c4cf', { fog: true }), [6, 172, 0], [10, 10, 10], null, 0);
    addBox(g, [24, 130, 20], [-30, 65, 20], toon('#c99a8a', { fog: true })); addBox(g, [14, 12, 14], [-30, 136, 20], toon('#c99a8a', { fog: true })); }
  { const c = toward(1, 0.12, 760), g = new THREE.Group(); g.position.copy(c); world.add(backdrop(g));
    const bowl = toon('#d9d6cf', { fog: true });
    part(g, new THREE.CylinderGeometry(70, 60, 26, 28, 1, true), bowl, [0, 13, 0], [1, 1, 0.75], null, 0);
    part(g, new THREE.CircleGeometry(58, 28), toon('#5f9a4a', { fog: true }), [0, 0.5, 0], [1, 0.75, 1], [-Math.PI / 2, 0, 0], 0);
    addBox(g, [90, 30, 14], [0, 15, -50], toon('#b42a2f', { fog: true })); }
  fallingLeaves(TEX_PETAL, ['#ff3355', '#d9203a'], 25);
}
