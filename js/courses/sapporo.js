// 札幌
'use strict';

// 札幌の地図座標（実寸m）をワールド座標へ変換する。x：4コーナー出口から直線の向き（ほぼ北）、z：コースの内側（ほぼ東）が正（コースの区間segsと同じ座標）
function sapporoAt(x, z) { const k = track.def.scale; return new V3(track.xs[0] + x * k, 0, track.zs[0] + z * k * track.turn); }
function decorSapporo(th) {
  // 配置はOpenStreetMapのコース・建物・線路・道路の位置と、国土地理院の空中写真、JRAの場内マップを参考にしたデフォルメ
  const at = sapporoAt, k = track.def.scale, mat = decorTurfMat(), v = (x, z) => new V3(x, 0, z);
  const route = (pts, closed = false) => {
    const ps = pts.map(([x, z]) => at(x, z)), curve = ps.length > 2 ? new THREE.CatmullRomCurve3(ps, closed, 'centripetal') : new THREE.LineCurve3(ps[0], ps[1]);
    const sp = curve.getSpacedPoints(Math.ceil(curve.getLength() / 1.5)); if (closed) sp.push(sp[0].clone());
    return decorPath(sp);
  };
  const near = (p, pts, d) => pts.some(q => (q.x - p.x) ** 2 + (q.z - p.z) ** 2 < d * d);
  const ground = p => { p.y = track.groundH(p.x, p.z); return p; };
  // 地図の向きにそろえた飾りのグループ：ローカルのxは地図のx（直線の向き）からangだけ内側へ回した向き、+zはコースの外側
  const group = (name, x, z, ang = 0) => {
    const g = new THREE.Group(); g.position.copy(ground(at(x, z))); g.rotation.y = -ang * track.turn; g.scale.z = track.sgn; world.add(g);
    return name ? registerLandmark(g, name) : g;
  };
  // 地図の多角形の内外判定と、平らな面（ShapeGeometryを地面に沿わせる）
  const inPoly = (poly, p) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const a = poly[i], b = poly[j]; if ((a.z > p.z) !== (b.z > p.z) && p.x < (b.x - a.x) * (p.z - a.z) / (b.z - a.z) + a.x) c = !c; } return c; };
  const flat = (poly, color, lift = 0.1) => {
    const geo = new THREE.ShapeGeometry(new THREE.Shape(poly.map(p => new THREE.Vector2(p.x, p.z)))), pp = geo.attributes.position;
    for (let i = 0; i < pp.count; i++) { const x = pp.getX(i), z = pp.getY(i); pp.setXYZ(i, x, track.groundH(x, z) + lift, z); }
    geo.computeVertexNormals();
    const m = new THREE.Mesh(geo, toon(color, { side: THREE.DoubleSide })); m.receiveShadow = true; world.add(m); return m;
  };
  const poly = pts => pts.map(([x, z]) => at(x, z));
  const deg = d => d * Math.PI / 180, white = toon('#f1eee6'), steel = toon('#9aa3a8'), wood = toon('#b98a5a');
  const backdrop = o => { o.userData.backdrop = true; return o; };

  // ---- 飾りのコース（レースは芝の周回上で行う） ----
  // 芝の内側のダートコース（1周1487m・直線264.3m）。内柵を挟んで並走し、1周は約1/2縮尺で実物に近い
  decorCourseLane(track, 'dirt', 0, track.L, { lanes: [-2.5, -13], cols: 4, step: 1.5, onGround: true, lift: 0.25 });
  decorInnerRail(-13.8, th.rail);
  // 芝の発走ポケット：4コーナー奥（2000m、直線の延長）、1コーナー奥（1500m、直線の先）、2コーナー奥（1200m、向正面の延長）
  decorTurfPocket(0, 130 * k, false, mat); decorTurfPocket(track.segStart[1], 214 * k, true, mat); decorTurfPocket(track.segStart[4], 150 * k, false, mat);
  // ダートの引き込み線（1000m）：2コーナーの内側から向正面へ斜めに合流する
  const dchute = route([[357, 266], [230, 293], [104, 310]]);
  decorCourseLane(dchute, 'dirt', 0, dchute.L, { lanes: [W / 2 - 4.5, W / 2 + 4.5], cols: 2, step: 1.5, onGround: true, lift: 0.2 });

  // ---- 馬場内の北側：2本の楕円の周回路（外は砂、内はウッドチップ）と、その内側の砂の広場 ----
  const ringA = route([[213, 164], [229, 151], [244, 141], [259, 132], [274, 122], [288, 113], [303, 103], [319, 94], [342, 89], [367, 96], [384, 115], [390, 139], [383, 163], [367, 180], [352, 190], [336, 199],
    [321, 209], [306, 219], [291, 228], [276, 238], [252, 246], [224, 238], [205, 218], [201, 190]], true);
  const ringB = route([[229, 167], [242, 158], [254, 150], [266, 142], [278, 134], [290, 126], [302, 118], [315, 110], [333, 104], [354, 110], [369, 126], [372, 147], [362, 167], [349, 177], [337, 185], [325, 192],
    [313, 200], [301, 208], [289, 216], [277, 224], [260, 231], [238, 226], [222, 210], [219, 188]], true);
  decorCourseLane(ringA, 'dirt', 0, ringA.L, { lanes: [W / 2 - 2.8, W / 2 + 2.8], cols: 2, step: 1.5, onGround: true, lift: 0.14, mat: toon('#d8c39a', { side: THREE.DoubleSide }) });
  decorCourseLane(ringB, 'dirt', 0, ringB.L, { lanes: [W / 2 - 2.7, W / 2 + 2.7], cols: 2, step: 1.5, onGround: true, lift: 0.14, mat: toon('#9a7a58', { side: THREE.DoubleSide }) });
  flat(poly([[323, 114], [345, 113], [362, 128], [365, 146], [354, 165], [267, 222], [245, 222], [228, 206], [227, 184], [237, 170]]), '#c9b48e', 0.12);

  // ---- ターフパーク（馬場内）：直線の向かいの遊び場 ----
  // セイテンスタンド：2階建ての観覧棟。コース側の壁に描かれた馬の絵「セイテンダイチ」が名前の由来で、2階から最後の直線が一望できる
  { const g = group('セイテンスタンド', 176, 59); landmarkFoundation(g, 15, 7, '#cdbf9f');
    addBox(g, [13.4, 0.8, 5.6], [0, 0.4, 0], toon('#a5523f'), null, 0);
    addBox(g, [13, 6.6, 5], [0, 4, 0], toon('#ddd2bf'), null, 0);
    for (const z of [-2.5, 2.5]) addBox(g, [13, 1, 0.12], [0, 7.8, z], toon('#2f3a4f'), null, 0);
    for (const x of [-6.5, 6.5]) addBox(g, [0.12, 1, 5], [x, 7.8, 0], toon('#2f3a4f'), null, 0);
    ['#4f9a6a', '#d9a441', '#6aa0c8'].forEach((c, i) => {
      const h = landmarkHorse(g, [-4 + i * 4, 1.6, 2.6], 'gallop', c, 0.42); h.scale.z = 0.05; h.children[0].visible = false; if (h.children[2]) h.children[2].visible = false;
    }); }
  // テラステーブル：JRA初の馬場内の指定席。大屋根の下に4人掛けのテーブルが並ぶ
  for (const [x, len, name] of [[139.5, 31, 'テラステーブル'], [208, 24, null]]) {
    const g = group(name, x, 57.5), L = len * k;
    addBox(g, [L + 1, 0.4, 5.4], [0, 4.6, 0], white, null, 0); addBox(g, [L + 1.1, 0.6, 5.5], [0, 4.2, 0], toon('#2f7a4f'), null, 0);
    for (let x2 = -L / 2 + 1; x2 <= L / 2 - 0.9; x2 += L / 4 - 0.5) for (const z of [-2, 2]) addBox(g, [0.5, 4, 0.5], [x2, 2, z], toon('#c8743a'), null, 0);
    for (let x2 = -L / 2 + 2; x2 <= L / 2 - 1.9; x2 += 3) addBox(g, [1.2, 0.8, 1.2], [x2, 0.4, 0], wood, null, 0);
  }
  // 売店の棟（赤い屋根）と、遊び場の奥の休憩所
  { const g = group(null, 38.5, 68.5); addBox(g, [15, 3.4, 3.4], [0, 1.7, 0], toon('#ece5d4'), null, 0); addBox(g, [15.6, 0.6, 4], [0, 3.7, 0], toon('#b8473a'), null, 0); }
  { const g = group(null, 180, 101.5); addBox(g, [9, 5, 25], [0, 2.5, 0], toon('#ece8de'), null, 0); addBox(g, [9.6, 0.6, 25.6], [0, 5.3, 0], white, null, 0); }
  // ふわふわドーム：白い大きなトランポリンのドーム
  { const g = group('ふわふわドーム', 136, 101); landmarkFoundation(g, 12, 12, '#c9c3b5');
    part(g, new THREE.SphereGeometry(1, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), toon('#fbf7ff'), [0, 0, 0], [5, 4, 5], null, 0.03); }
  // じゃぶじゃぶ池：夏の開催の子どもの水遊び場。豆の形の浅い池
  { const g = group('じゃぶじゃぶ池', 89, 96); landmarkFoundation(g, 14, 10, '#d9d2c2');
    for (const [x, z, r] of [[-2.4, 0.6, 3.4], [2.6, -0.4, 4]]) {
      part(g, new THREE.CylinderGeometry(r + 0.5, r + 0.5, 0.3, 28), toon('#c9c3b5'), [x, 0.15, z], null, null, 0);
      part(g, new THREE.CircleGeometry(r, 28), toon('#8fd3f0'), [x, 0.32, z], null, [-Math.PI / 2, 0, 0], 0);
    } }
  // ターフパークステージ：キャラクターショーなどのイベントの舞台と、半円の段々の客席
  { const g = group('ターフパークステージ', 99, 146);
    addBox(g, [8, 1, 4.5], [0, 0.5, -5], toon('#d8d2c4'), null, 0); addBox(g, [9, 0.4, 5.5], [0, 5.4, -5], white, null, 0); addBox(g, [8, 4.4, 0.3], [0, 3.2, -7.3], toon('#2f6a8f'), null, 0);
    for (const x of [-4.2, 4.2]) addBox(g, [0.4, 4.6, 0.4], [x, 3, -2.8], steel, null, 0);
    const steps = [];
    for (let j = 0; j < 4; j++) for (let i = 0; i < 12; i++) {
      const a0 = i / 12 * Math.PI, a1 = (i + 1) / 12 * Math.PI, r = 4.5 + j * 1.3, h = 0.3 + j * 0.3;
      const p0 = [Math.cos(a0) * r, Math.sin(a0) * r - 4], p1 = [Math.cos(a1) * r, Math.sin(a1) * r - 4];
      steps.push({ p: new V3((p0[0] + p1[0]) / 2, h / 2, (p0[1] + p1[1]) / 2), s: new V3(Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) + 0.2, h, 1.1), r: [0, -Math.atan2(p1[1] - p0[1], p1[0] - p0[0]), 0] });
    }
    g.add(inst(BOX, toon('#c98a5a'), steps, false)); }
  // 円い花壇
  { const g = group(null, 147, 127); part(g, new THREE.CircleGeometry(6, 32), toon('#7fbf62'), [0, 0.1, 0], null, [-Math.PI / 2, 0, 0], 0); landmarkFlowers(g, 5, 5, '#f2a33a'); landmarkFlowers(g, 2.6, 2.6, '#e8534a'); }
  // 大型遊具
  { const g = group('大型遊具', 80, 181), cols = ['#e8534a', '#f2b33d', '#4fa3d9', '#7cc36a'];
    for (const [x, z, c] of [[-2.5, -1.5, 0], [2.5, 1.5, 2]]) {
      for (const dx of [-1.4, 1.4]) for (const dz of [-1.4, 1.4]) addBox(g, [0.3, 4, 0.3], [x + dx, 2, z + dz], steel, null, 0);
      addBox(g, [3.4, 0.4, 3.4], [x, 3, z], toon(cols[c]), null, 0); part(g, CONE, toon(cols[c + 1]), [x, 5.1, z], [2.7, 2, 2.7], null, 0);
    }
    addBox(g, [4.6, 0.25, 1.3], [0.3, 1.6, -3.4], toon(cols[3]), [0, 0, -0.5], 0); addBox(g, [5, 0.3, 0.9], [0, 3.1, 0], wood, [0, 0.6, 0], 0); }
  // ミニ新幹線：遊び場の4コーナー寄りの楕円の線路を回る。内側には赤い屋根の小屋を囲む砂の周回路
  { const g = group('ミニ新幹線', 11, 112), rx = 18, rz = 22.5;
    part(g, new THREE.RingGeometry(0.94, 1, 64), toon('#6d6a66', { side: THREE.DoubleSide }), [0, 0.18, 0], [rx, rz, 1], [-Math.PI / 2, 0, 0], 0);
    part(g, new THREE.RingGeometry(0.7, 1, 48), toon('#c9925a', { side: THREE.DoubleSide }), [-6 * k, 0.16, 12 * k], [8.5, 14.5, 1], [-Math.PI / 2, 0, 0], 0);
    addBox(g, [5, 3, 6], [-5 * k, 1.5, 14 * k], toon('#ece5d4'), null, 0); addBox(g, [5.6, 0.6, 6.6], [-5 * k, 3.3, 14 * k], toon('#b8473a'), null, 0);
    const cars = [];
    for (let i = 0; i < 3; i++) {
      const c = new THREE.Group(); g.add(c); cars.push(c);
      addBox(c, [3, 1.1, 1.1], [0, 0.9, 0], toon('#f5f5f2'), null, 0.03); addBox(c, [3.02, 0.3, 1.12], [0, 0.65, 0], toon('#2b6cb0'), null, 0);
    }
    part(cars[0], CONE, toon('#f5f5f2'), [2.1, 0.9, 0], [0.55, 1.4, 0.55], [0, 0, -Math.PI / 2], 0.03);
    cars.forEach(c => { c.userData.droneIgnore = true; });
    themeUpd.push(t => cars.forEach((c, i) => { const a = t * 0.4 - i * 0.18, r = 0.97; c.position.set(Math.cos(a) * rx * r, 0, Math.sin(a) * rz * r); c.rotation.y = -Math.atan2(Math.cos(a) * rz, -Math.sin(a) * rx); })); }

  // ---- スタンドの4コーナー側 ----
  // まきばガーデン：緑に囲まれた放牧地。柵の中で馬がのんびり草を食む
  const garden = poly([[-8, -40], [-8, -100], [-20, -110], [-39, -110], [-53, -102], [-64, -89], [-75, -66], [-80, -40]]);
  { flat(garden, '#8cc46a', 0.14);
    const fence = garden.map(p => ground(p.clone()).add(new V3(0, 1.1, 0)));
    world.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(fence, true, 'catmullrom', 0.1), 120, 0.12, 4, true), toon('#f4f2ea')));
    const g = group('まきばガーデン', -40, -72), herd = [];
    for (let i = 0; i < 3; i++) { const h = landmarkHorse(g, [0, 0.2, 0], 'walk', ['#8a5a3a', '#3b2a20', '#c9a27a'][i], 0.45); h.children[0].visible = false; herd.push(h); }
    // 放牧地の中をゆっくり歩き回る
    herd.forEach(h => { h.userData.droneIgnore = true; });
    themeUpd.push(t => herd.forEach((h, i) => { const a = t * 0.05 + i * 2.1, x = Math.cos(a) * 9 + Math.sin(a * 2.3) * 2, z = Math.sin(a) * 5; h.position.set(x, 0.2, z); h.rotation.y = -Math.atan2(Math.cos(a) * 5, -Math.sin(a) * 9); }));
    addBox(g, [5, 3, 3.4], [-12, 1.5, 9], toon('#b8473a'), null, 0); addBox(g, [5.6, 0.5, 4], [-12, 3.2, 9], toon('#5f6f7a'), null, 0); }
  // スタンドから南西の道路へ延びる屋根付きの連絡通路
  { const c = new THREE.CatmullRomCurve3(poly([[-52, -117], [-4, -128], [15, -180]]), false, 'centripetal'), pts = c.getSpacedPoints(Math.ceil(c.getLength() / 2)), roofs = [], posts = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], b = pts[i + 1], m = a.clone().add(b).multiplyScalar(0.5), h = Math.atan2(b.z - a.z, b.x - a.x), y = track.groundH(m.x, m.z);
      roofs.push({ p: new V3(m.x, y + 4.2, m.z), s: new V3(a.distanceTo(b) + 0.2, 0.4, 3.6), r: [0, -h, 0] });
      if (i % 3 === 0) for (const o of [-1.5, 1.5]) posts.push({ p: new V3(m.x - Math.sin(h) * o, y + 2, m.z + Math.cos(h) * o), s: new V3(0.3, 4, 0.3) });
    }
    inst(BOX, white, roofs, false); inst(BOX, steel, posts, false); }
  // 駐車場（スタンドの裏と4コーナーの外）
  const lots = [[[-56, -226], [-83, -234], [-100, -225], [-119, -207], [-184, -112], [-134, -82], [-93, -144], [-77, -168], [-59, -210]],
    [[102, -171], [62, -178], [17, -195], [-35, -219], [-14, -273], [18, -292], [53, -304], [77, -266], [103, -234], [126, -214], [136, -202], [128, -183], [158, -187], [163, -177], [129, -169]],
    [[278, -168], [275, -151], [234, -157], [197, -168], [167, -155], [144, -144], [125, -138], [101, -138], [100, -152], [131, -156], [161, -171], [182, -180], [216, -175]],
    [[-133, -259], [-209, -131], [-262, -161], [-183, -289]]].map(poly);
  { const cars = [], carCol = ['#f4f4f2', '#2f3438', '#c8302c', '#9aa3ab', '#3b5f8f', '#e9e2cf'].map(C);
    for (const lot of lots) {
      flat(lot, '#8c8f93', 0.08);
      const xs = lot.map(p => p.x), zs = lot.map(p => p.z);
      for (let n = 0; n < 400; n++) {
        const p = v(rand(Math.min(...xs), Math.max(...xs)), Math.round(rand(Math.min(...zs), Math.max(...zs)) / 3.5) * 3.5);
        if (!inPoly(lot, p) || Math.random() < 0.4) continue;
        const q = ground(p); cars.push({ p: new V3(q.x, q.y + 0.55, q.z), s: new V3(2.2, 0.8, 1.1), c: carCol[n % 6] });
      }
    }
    inst(BOX, toon('#ffffff'), cars, false); }

  // ---- 厩舎：1コーナーの奥から2コーナーの外へ、細長い平屋の馬房が並ぶ（赤い屋根と青い屋根） ----
  const ring = []; for (let i = 0; i < track.N; i += 6) ring.push(v(track.xs[i], track.zs[i]));
  const gap = p => { let d = 1e18; for (const q of ring) d = Math.min(d, (q.x - p.x) ** 2 + (q.z - p.z) ** 2); return Math.sqrt(d); };
  const inside = p => inPoly(ring, p);
  { const barns = [[402, -70, 9, 52], [420, -70, 9, 51], [436, -70, 9, 51], [453, -70, 9, 52], [471, -70, 8, 51], [489, -66, 9, 46], [406, -125, 31, 41], [435, -125, 22, 45], [507, -7, 9, 46], [523, -7, 8, 46], [542, -7, 10, 45],
      [559, -2, 9, 36], [500, 39, 12, 29], [534, 40, 31, 27], [562, 40, 9, 30], [583, 49, 8, 32], [495, 83, 10, 41], [513, 83, 9, 41], [530, 84, 10, 43], [546, 83, 10, 41], [564, 83, 9, 42],
      [495, 134, 9, 41], [512, 134, 9, 41], [529, 133, 10, 41], [546, 132, 9, 41], [564, 131, 9, 36], [493, 195, 9, 41], [512, 196, 9, 41], [529, 196, 9, 41], [546, 195, 11, 42],
      [479, 244, 9, 41], [497, 246, 9, 41], [514, 245, 10, 42], [531, 245, 10, 41], [547, 246, 10, 42], [459, 297, 10, 42], [476, 295, 10, 41], [493, 296, 10, 41], [510, 296, 10, 41], [527, 296, 10, 41],
      [546, 294, 10, 36], [424, 318, 17, 52], [461, 345, 8, 35], [477, 345, 10, 35], [494, 344, 9, 35], [520, 346, 10, 29], [538, 346, 10, 30], [384, -234, 11, 51], [386, -294, 10, 52], [403, -294, 10, 52]];
    const walls = [], roofs = [], red = C('#b8473a'), blue = C('#4f78a8');
    for (const [x, z, dx, dz] of barns) {
      const p = ground(at(x, z)), h = dx > 20 ? 6 : 4.2;
      // 中継カメラ（走路の外24m）の通り道にかかる棟は置かない
      if (gap(p) < 40) continue;
      walls.push({ p: new V3(p.x, p.y + h / 2 - 0.5, p.z), s: new V3(dx * k, h, dz * k) });
      roofs.push({ p: new V3(p.x, p.y + h, p.z), s: new V3(dx * k + 0.8, 0.8, dz * k + 0.6), c: z < 215 ? red : blue });
    }
    inst(BOX, toon('#ece6d6'), walls, false); inst(BOX, toon('#ffffff'), roofs, false); }

  // ---- 場外：環状通・石山通・鉄工団地通と、JR函館本線・札沼線（学園都市線）の高架 ----
  const roads = [[[24, -404], [42, -382], [74, -303], [98, -259], [127, -229], [175, -202], [203, -192], [420, -164], [464, -142], [609, -19], [585, 180], [567, 423], [444, 454], [343, 482], [138, 540], [8, 576], [-42, 596], [-195, 699], [-357, 812]],
    [[24, -404], [18, -390], [-21, -288], [-44, -226], [-71, -160], [-122, -80], [-131, -65], [-344, 275], [-409, 379], [-505, 533]], [[-131, -65], [-274, -154], [-405, -138], [-660, -95]]].map(r => route(r));
  for (const r of roads) {
    decorCourseLane(r, 'dirt', 0, r.L, { lanes: [W / 2 - 5, W / 2 + 5], cols: 2, step: 3, onGround: true, lift: 0.1, mat: toon('#6f7275', { side: THREE.DoubleSide }) });
    decorCourseLane(r, 'dirt', 0, r.L, { lanes: [W / 2 - 0.2, W / 2 + 0.2], cols: 1, step: 3, onGround: true, lift: 0.14, mat: toon('#f2f0e6', { side: THREE.DoubleSide }) });
  }
  // 札幌市中央卸売市場：南西の大きな平たい建物
  { const lot = poly([[-22, -417], [-112, -447], [-328, -484], [-470, -476], [-399, -149], [-275, -165]]), h = 7, walls = [];
    flat(lot, '#8f949a', h);
    for (let i = 0; i < lot.length; i++) { const a = lot[i], b = lot[(i + 1) % lot.length], m = a.clone().add(b).multiplyScalar(0.5); walls.push({ p: new V3(m.x, h / 2 - 0.5, m.z), s: new V3(a.distanceTo(b), h + 1, 0.6), r: [0, -Math.atan2(b.z - a.z, b.x - a.x), 0] }); }
    inst(BOX, toon('#c9c4b8'), walls, false); }
  const rails = [];
  const viaduct = (pts, y, width, tracks) => {
    const curve = new THREE.CatmullRomCurve3(poly(pts), false, 'centripetal'), line = curve.getSpacedPoints(Math.ceil(curve.getLength() / 2)), slab = [], piers = [], bars = [], walls = [];
    for (let i = 0; i < line.length - 1; i++) {
      const a = line[i], b = line[i + 1], m = a.clone().add(b).multiplyScalar(0.5), h = Math.atan2(b.z - a.z, b.x - a.x), L = a.distanceTo(b) + 0.2, nx = -Math.sin(h), nz = Math.cos(h);
      slab.push({ p: new V3(m.x, y - 0.6, m.z), s: new V3(L, 1.2, width), r: [0, -h, 0] });
      for (const t of tracks) for (const o of [-0.7, 0.7]) bars.push({ p: new V3(m.x + nx * (t + o), y + 0.1, m.z + nz * (t + o)), s: new V3(L, 0.2, 0.25), r: [0, -h, 0] });
      for (const o of [-width / 2 + 0.2, width / 2 - 0.2]) walls.push({ p: new V3(m.x + nx * o, y + 0.5, m.z + nz * o), s: new V3(L, 1, 0.35), r: [0, -h, 0] });
      if (i % 7 === 0) piers.push({ p: new V3(m.x, (y - 1.2) / 2, m.z), s: new V3(1.6, y - 1.2, width - 2), r: [0, -h, 0] });
    }
    inst(BOX, toon('#cfccc4'), slab, false); inst(BOX, toon('#b9b6ae'), piers, false); inst(BOX, toon('#5d5a57'), bars, false); inst(BOX, toon('#e2dfd8'), walls, false);
    rails.push({ curve, y, line }); return line;
  };
  const hakodate = viaduct([[410, -1100], [-145, -201], [-296, 47], [-419, 237], [-518, 398], [-571, 491], [-622, 578], [-646, 621], [-678, 675], [-734, 766], [-790, 849]], 7, 9, [-2.2, 2.2]);
  const sassho = viaduct([[965, -424], [119, -334], [64, -323], [22, -309], [-18, -291], [-70, -258], [-117, -218], [-144, -187], [-179, -139], [-232, -46], [-376, 182], [-493, 373], [-531, 447], [-559, 498]], 7.4, 5, [0]);
  // JR北海道の電車：銀色の車体に緑の帯。線路の端から端まで、ゆっくり行って戻ってくる
  { const body = toon('#d9dde0'), band = toon('#2f9a4f'), band2 = toon('#a8d86a'), pane = toon('#3f4b55');
    rails.forEach(({ curve, y }, n) => {
      const RL = curve.getLength(), cars = [];
      for (let i = 0; i < 3; i++) {
        const c = new THREE.Group(); world.add(c); cars.push(c);
        addBox(c, [9, 3.4, 3.2], [0, 1.9, 0], body, null, 0.03);
        for (const z of [-1.62, 1.62]) { addBox(c, [9.05, 0.35, 0.1], [0, 1.2, z], band, null, 0); addBox(c, [9.05, 0.15, 0.1], [0, 1.5, z], band2, null, 0); for (let j = 0; j < 3; j++) addBox(c, [1.8, 1.1, 0.1], [-3 + j * 3, 2.5, z], pane, null, 0); }
      }
      themeUpd.push(t => {
        const c = (t * 0.025 + n * 0.7) % 2, u = c < 1 ? c : 2 - c, s0 = 6 + THREE.MathUtils.smootherstep(u, 0.08, 0.92) * (RL - 40);
        cars.forEach((car, i) => { const s = (s0 + i * 9.6) / RL, p = curve.getPointAt(s), tg = curve.getTangentAt(s); car.userData.droneIgnore = true; car.position.set(p.x, y + 0.2, p.z); car.rotation.y = -Math.atan2(tg.z, tg.x); });
      });
    }); }
  // 桑園駅：南東の高架駅（競馬場から約700m。遠景として扱う）
  { const g = backdrop(group(null, -614, 570, Math.atan2(130, -75)));
    addBox(g, [70, 7 - 1.2, 18], [0, (7 - 1.2) / 2, 0], toon('#ece5d4'), null, 0);
    addBox(g, [60, 0.8, 20], [0, 12.5, 0], toon('#7f8f9c'), null, 0);
    for (let x = -26; x <= 26; x += 13) addBox(g, [0.6, 5.4, 0.6], [x, 9.6, 0], steel, null, 0); }

  // ---- 木：本線・建物・線路・道路を避けて置く ----
  // スタンド・パドック・駐車場・まきばガーデン・厩舎・市場の範囲（地図の実寸）
  const busy = (x, z) => (x > -270 && x < 300 && z < -28 && z > -320) || (x > 370 && x < 620 && z > -140 && z < 370) || (x > -480 && x < 0 && z < -140 && z > -500);
  const greens = ['#3f8f3a', '#4fa546', '#5fb853', '#377d34', '#6aa84f'], spots = [];
  const lines = [hakodate, sassho, ...roads.map(r => r.pts)];
  // 外側は中継カメラ（走路の外24m）の通り道をあけ、走路から44m以上離す
  for (let n = 0; n < 2600 && spots.length < 300; n++) {
    const x = rand(-520, 800), z = rand(-560, 760), p = at(x, z);
    if (busy(x, z) || inside(p) || gap(p) < 44 || gap(p) > 260 || lines.some(l => near(p, l, 9))) continue;
    spots.push({ p: ground(p) });
  }
  // 林（スタンドの裏の木立）
  { const wood2 = poly([[95, -168], [87, -154], [63, -153], [40, -153], [31, -149], [31, -140], [6, -138], [22, -188], [48, -178], [90, -169]]);
    for (let n = 0; n < 60; n++) { const p = at(rand(6, 95), rand(-188, -138)); if (inPoly(wood2, p)) spots.push({ p: ground(p), s: rand(0.9, 1.3) }); } }
  // まきばガーデンの木
  for (const [x, z] of [[-70, -48], [-62, -80], [-15, -50], [-30, -104]]) spots.push({ p: ground(at(x, z)), s: rand(1.1, 1.4) });
  // 内馬場：ダートコースの内側に、遊び場・周回路・ターフビジョンを避けてまばらに
  const park = [[11, 112, 60], [89, 96, 22], [136, 101, 22], [99, 146, 28], [147, 127, 16], [80, 181, 20], [180, 101, 34], [176, 59, 22], [139, 57, 24], [208, 57, 20], [38, 68, 22], [298, 170, 118]];
  for (let n = 0; n < 700 && spots.length < 380; n++) {
    const x = rand(-170, 420), z = rand(30, 320), p = at(x, z);
    if (!inside(p) || gap(p) < 30 || park.some(([px, pz, r]) => p.distanceTo(at(px, pz)) < r * k) || near(p, dchute.pts, 10) || p.distanceTo(boardPos) < 34) continue;
    spots.push({ p: ground(p) });
  }
  roundTrees(spots, greens);

  // ---- 遠景（図鑑の全景では隠す）：札幌の住宅地（色とりどりの金属屋根）と中層の集合住宅、南東の都心の高層ビル群、南から西の山並み ----
  { const walls = [], roofs = [], blocks = [], bands = [];
    const wallCol = ['#efe8da', '#e6dccb', '#f3efe6', '#d9d2c4'].map(C), roofCol = ['#b8473a', '#3f6fa8', '#3f8f5a', '#7a5b4a', '#5a5f66', '#8a3f3a'].map(C);
    for (let n = 0; n < 3400 && walls.length + blocks.length < 680; n++) {
      const x = rand(-1400, 1600), z = rand(-1400, 1500), p = at(x, z), ry = rand(-0.08, 0.08);
      if (inside(p) || gap(p) < 90 || busy(x, z) || lines.some(l => near(p, l, 14))) continue;
      // ところどころに中層の集合住宅（各階の窓の帯つき）
      if (n % 6 === 0 && gap(p) > 140) { const h = rand(12, 30), w = rand(18, 30); blocks.push({ p: new V3(p.x, h / 2 - 1, p.z), s: new V3(w, h, 9), r: [0, ry, 0], c: wallCol[n % 4] });
        for (let y = 2.4; y < h - 2; y += 3) bands.push({ p: new V3(p.x, y, p.z), s: new V3(w - 2, 1.1, 9.3), r: [0, ry, 0] }); continue; }
      // 北海道の家：雪を落とさない平たい屋根や、ゆるい勾配の金属屋根
      const w = rand(6, 9), h = rand(5, 7.5);
      walls.push({ p: new V3(p.x, h / 2 - 1, p.z), s: new V3(w, h, w * 0.8), r: [0, ry, 0], c: wallCol[n % 4] });
      roofs.push({ p: new V3(p.x, h - 0.8, p.z), s: new V3(w + 0.6, 0.6, w * 0.8 + 0.6), r: [n % 3 ? 0 : 0.12, ry, 0], c: roofCol[n % 6] });
    }
    for (const m of [inst(BOX, toon('#ffffff'), walls, false), inst(BOX, toon('#ffffff'), roofs, false), inst(BOX, toon('#ffffff'), blocks, false), inst(BOX, toon('#8fa3b3', { fog: true }), bands, false)]) backdrop(m); }
  { const base = at(130, 170), toward = (a, dist) => base.clone().add(new V3(Math.cos(a), 0, Math.sin(a) * track.turn).multiplyScalar(dist));
    const cone = new THREE.ConeGeometry(1, 1, 8); cone.translate(0, 0.5, 0);
    const dome = (b, dist, s, color) => { const p = toward(deg(b), dist), m = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), toon(color, { fog: true })); m.position.set(p.x, -6, p.z); m.scale.set(...s); world.add(backdrop(m)); return p; };
    // 山並み：南の藻岩山から南西の円山・三角山・大倉山、西の手稲山へ。北（石狩平野）と東は開けている
    const ridge = [];
    const range = (a0, a1, dist, n, h0, h1) => { for (let i = 0; i < n; i++) { const p = toward(deg(lerp(a0, a1, i / (n - 1))), dist + rand(-60, 80)); p.y = -6; ridge.push({ p, s: new V3(rand(150, 210), rand(h0, h1), rand(120, 170)), r: [0, rand(0, 3), 0] }); } };
    range(190, 262, 1450, 10, 80, 150);   // 砥石山から奥三角山へ続く山並み
    range(276, 302, 1700, 5, 90, 160);    // 手稲山の北の山すそ
    backdrop(inst(cone, toon(th.mount, { fog: true }), ridge, false));
    // 藻岩山（531m）：真南の近く。山頂に電波塔が並ぶ、もいわテラスの名前の由来の山
    const moiwa = dome(183, 1150, [230, 135, 200], '#6f8f6a');
    for (const [dx, dz, h] of [[-12, 4, 30], [6, -8, 24], [16, 10, 20]]) backdrop(part(world, new THREE.CylinderGeometry(0.8, 1.6, h, 6), toon('#e8e4da', { fog: true }), [moiwa.x + dx, 127 + h / 2, moiwa.z + dz], null, null, 0));
    // 円山・三角山：都心の西の小さな丸い山
    dome(203, 900, [120, 55, 110], '#6f8f6a'); dome(248, 950, [110, 60, 100], '#73926c');
    // 大倉山：南西の山の東の斜面に、白いジャンプ台のランディングバーンが延びる
    { const p = dome(224, 1050, [150, 85, 130], '#6a8a66'), g = backdrop(new THREE.Group()); g.position.set(p.x, -6, p.z); g.lookAt(base.x, -6, base.z); world.add(g);
      // 斜面に沿わせて、山頂寄りの緩い区間と下のきつい区間に分ける
      const snow = toon('#f4f2ec', { fog: true });
      addBox(g, [10, 1, 52], [0, 81.5, 45], snow, [0.19, 0, 0], 0); addBox(g, [10, 1, 67], [0, 58, 97], snow, [0.59, 0, 0], 0);
      addBox(g, [5, 16, 5], [0, 90, 8], toon('#d8d2c4', { fog: true }), null, 0); }
    // 手稲山（1023m）：西の遠く。山頂の電波塔
    { const p = toward(deg(271), 1700); backdrop(part(world, cone, toon('#7f96a8', { fog: true }), [p.x, -8, p.z], [380, 230, 320], null, 0));
      for (const dx of [-10, 10]) backdrop(part(world, new THREE.CylinderGeometry(1, 2, 34, 6), toon('#e8e4da', { fog: true }), [p.x + dx, 222 - 8 + 17, p.z], null, null, 0)); }
    // 都心の高層ビル群：南東。ひときわ高いJRタワーと、赤い鉄塔に大時計のさっぽろテレビ塔
    const city = new THREE.Group(), cp = toward(deg(122), 900); city.position.set(cp.x, 0, cp.z); city.lookAt(base.x, 0, base.z); world.add(backdrop(city));
    const tower = toon('#c9d3db', { fog: true }), tower2 = toon('#9fb0bf', { fog: true });
    addBox(city, [26, 30, 22], [-40, 15, 30], tower, null, 0); addBox(city, [18, 120, 16], [-40, 60, 30], tower2, null, 0); addBox(city, [12, 10, 10], [-40, 125, 30], tower, null, 0);
    for (const [x, z, h, w] of [[-75, 50, 60, 18], [-10, 60, 48, 22], [20, -20, 70, 16], [55, -10, 52, 20], [-100, 10, 40, 24], [90, 30, 44, 18], [-60, -30, 56, 16], [35, 70, 36, 26], [110, -40, 34, 20]]) addBox(city, [w, h, w * 0.8], [x, h / 2, z], x % 2 ? tower : tower2, null, 0);
    { const tv = new THREE.Group(); tv.position.set(70, 0, -90); city.add(tv); const red = toon('#d2553a', { fog: true });
      for (const dx of [-1, 1]) for (const dz of [-1, 1]) tv.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.LineCurve3(new V3(dx * 9, 0, dz * 9), new V3(dx * 2.5, 70, dz * 2.5)), 1, 0.7, 4), red));
      for (let y = 10; y <= 60; y += 10) { const r = 9 - 6.5 * y / 70; addBox(tv, [r * 2, 0.6, r * 2], [0, y, 0], red, null, 0); }
      addBox(tv, [10, 6, 10], [0, 50, 0], toon('#e8e4da', { fog: true }), null, 0);
      part(tv, new THREE.CircleGeometry(3, 20), toon('#ffffff', { fog: true }), [0, 40, 6.6], null, null, 0);
      part(tv, new THREE.CylinderGeometry(0.4, 0.8, 26, 6), red, [0, 83, 0], null, null, 0); } }
}
// 中山競馬場の周辺地図（OpenStreetMapのデータから作成した実寸m。建物は最長辺の向きにそろえた外接長方形）。座標はnakayamaAtと同じ直線基準
// buildings：[x, z, 長辺, 短辺, 長辺の向き(度), 階数, 種類(0住宅 1集合住宅 2学校 3店舗 4駅 5寺社)] の7つずつ、trees：雑木林の木 [x, z]
// roads：[幅, x, z, ...]、rail：[種類(1高架 2切通し 3トンネル), x, z, ...]、train：武蔵野線の電車の経路 [種類, x, z] の3つずつ
// farms・parking・water：多角形の頂点 [x, z, ...]、shrines：[名前, 種類, x, z]
