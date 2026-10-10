// ロンシャン
'use strict';

// コースの起点（最後の直線の入口、地図の(-207, -33)）から直線の向き（北北東）を+x、コースの内側（東）を+zとして縮尺をかける
function longchampAt(mx, my) {
  const k = track.def.scale, dx = mx + 207, dy = my + 33;
  return new V3(track.xs[0] + (dx * 0.28 + dy * 0.96) * k, 0, track.zs[0] + (dx * 0.96 - dy * 0.28) * k * track.turn);
}
function decorLongchamp(th) {
  // 配置はOpenStreetMapの柵・建物・水辺の位置と、France Galopのコース図を参考にしたデフォルメ
  const at = longchampAt, k = track.def.scale, mat = decorTurfMat(), v = (x, z) => new V3(x, 0, z);
  const route = pts => {
    const ps = pts.map(([x, y]) => at(x, y)), curve = ps.length > 2 ? new THREE.CatmullRomCurve3(ps, false, 'centripetal') : new THREE.LineCurve3(ps[0], ps[1]);
    return decorPath(curve.getSpacedPoints(Math.ceil(curve.getLength() / 1.5)));
  };
  const near = (p, pts, d) => pts.some(q => (q.x - p.x) ** 2 + (q.z - p.z) ** 2 < d * d);
  // 飾りのコースどうしが重なる所は先に描いたほうに任せて沈める（重なりのちらつき防止）
  const drawn = [];
  const lane = path => {
    const others = drawn.slice();
    decorCourseLane(path, 'turf', 0, path.L, { lanes: [-1.6, W + 1.6], cols: 18, step: 1.5, onGround: true, mat, hide: p => onMainTurf(p) || others.some(o => near(p, o.pts, W / 2 + 1.8)) });
    drawn.push(path);
  };
  // 飾りのコース（レースはグランド・ピストの周回上で行う）
  // 凱旋門賞の発走地点：風車の脇から向正面へまっすぐ延びる引き込み線
  decorTurfPocket(track.segStart[2], 135 * k, false, mat);
  // 内馬場を斜めに横切る直線コース（1000m）：南端の引き込み線から北北東へ延び、向正面に合流する
  const straight = route([[-35, -601], [212, 285]]); lane(straight);
  // プティット・ピスト（小コース）：直線コースを向正面に使い、内側の小さなカーブを回って最後の直線へ
  const petite = route([[91, -150], [72, -215], [45, -250], [5, -272], [-40, -283], [-85, -281], [-125, -268], [-160, -238], [-184, -195], [-196, -140], [-203, -80], [-203, -30]]); lane(petite);
  // モワイエンヌ・ピスト（中コース）：3コーナーの内側を小さく回り、フォルスストレートで合流する
  const moyenne = route([[255, -130], [246, -215], [222, -290], [180, -355], [125, -405], [65, -438], [5, -452], [-50, -440], [-100, -410], [-140, -368], [-168, -322], [-180, -280]]); lane(moyenne);
  // ヌーヴェル・ピストの引き込み線：3〜4コーナーの間から東南東へ延びる
  const nouvelle = route([[30, -566], [198, -630]]); lane(nouvelle);

  // 本線からの距離と、周回の内側かどうか（木や飾りの置き場所の判定）
  const loop = []; for (let i = 0; i < track.N; i += 6) loop.push(v(track.xs[i], track.zs[i]));
  const gap = p => { let d = 1e18; for (const q of loop) d = Math.min(d, (q.x - p.x) ** 2 + (q.z - p.z) ** 2); return Math.sqrt(d); };
  const inside = p => { let c = false; for (let i = 0, j = loop.length - 1; i < loop.length; j = i++) { const a = loop[i], b = loop[j]; if ((a.z > p.z) !== (b.z > p.z) && p.x < (b.x - a.x) * (p.z - a.z) / (b.z - a.z) + a.x) c = !c; } return c; };
  const clearOfCourses = p => gap(p) > W / 2 + 7 && !drawn.some(o => near(p, o.pts, W / 2 + 6));

  // ムーラン・ド・ロンシャン：1〜2コーナーの外、凱旋門賞の発走地点の脇に残る、かつての修道院の石造りの風車（高さ約19m）。羽根がゆっくり回る
  { const p = at(127, 695), aim = at(100, 600), g = registerLandmark(new THREE.Group(), 'ムーラン・ド・ロンシャン（風車）');
    g.position.set(p.x, track.groundH(p.x, p.z), p.z); g.rotation.y = Math.atan2(aim.x - p.x, aim.z - p.z); world.add(g);
    part(g, new THREE.CylinderGeometry(3.4, 4.4, 14, 16), toon('#e6dccb'), [0, 7, 0], null, null, 0.03);
    for (const y of [4.5, 9.5]) part(g, new THREE.CylinderGeometry(0.9, 0.9, 0.2, 12), toon('#4a3a30'), [0, y, 4.1], null, [Math.PI / 2, 0, 0], 0);
    part(g, new THREE.ConeGeometry(4.2, 4.6, 16), toon('#6b4a35'), [0, 16.3, 0], null, null, 0.03);
    const hub = new THREE.Group(); hub.position.set(0, 14.4, 4.3); g.add(hub);
    for (let i = 0; i < 4; i++) { const arm = new THREE.Group(); arm.rotation.z = i * Math.PI / 2; hub.add(arm); addBox(arm, [0.45, 11, 0.25], [0, 5.6, 0], toon('#6b4a35'), null, 0.04); addBox(arm, [2.3, 8.4, 0.1], [1.2, 6.4, 0.06], toon('#f7f1e6'), null, 0.03); }
    hub.userData.droneIgnore = true;
    themeUpd.push((t, dt) => { hub.rotation.z -= dt * 0.6; }); }

  // 池：スタンドの裏のエタン・デ・トリビューン（観客席の池）と、フォルスストレートの外の池
  const water = toon('#5f9fc4'), ponds = [[-360, 200, 42, 140, 0.25], [-228, -345, 28, 115, 0.12]];
  const wet = (x, y) => ponds.some(([px, py, rx, ry]) => ((x - px) / (rx + 12)) ** 2 + ((y - py) / (ry + 12)) ** 2 < 1);
  for (const [x, y, rx, ry, rot] of ponds) {
    const p = at(x, y), pond = part(world, new THREE.CircleGeometry(1, 40), water, [p.x, track.groundH(p.x, p.z) + 0.12, p.z], [ry * k, rx * k, 1], [-Math.PI / 2, 0, rot - 0.28], 0);
    pond.receiveShadow = true;
  }
  // セーヌ川：場内の西を北北東へ流れる（幅約170m）。東岸にはペニッシュ（住居船）が並ぶ
  const seine = route([[-640, -900], [-680, -500], [-685, -280], [-660, -140], [-630, 10], [-591, 156], [-520, 370], [-462, 538], [-420, 700], [-383, 849], [-320, 980], [-222, 1145], [-60, 1300]]);
  decorCourseLane(seine, 'water', 0, seine.L, { lanes: [W / 2 - 42, W / 2 + 42], cols: 4, step: 4, onGround: true, lift: 0.08, mat: toon('#5b8fb4', { side: THREE.DoubleSide }) });
  { const hull = toon('#34434f'), cabin = toon('#efe5d0'), roofC = toon('#7a4b3a');
    for (const [x, y] of [[-439, 359], [-424, 407], [-378, 552], [-365, 630], [-352, 710], [-336, 762]]) {
      const p = at(x, y), g = new THREE.Group(); g.position.set(p.x, 0.1, p.z); g.rotation.y = rand(-0.06, 0.06); world.add(g);
      addBox(g, [19, 1.6, 4.4], [0, 0.8, 0], hull, null, 0.03); addBox(g, [9, 2.2, 3.4], [-2, 2.7, 0], cabin, null, 0.03); addBox(g, [9.6, 0.4, 3.8], [-2, 3.9, 0], roofC, null, 0);
      for (let j = 0; j < 3; j++) part(g, SPH_LO, toon(['#d9493a', '#f2b53a', '#4f9a44'][j]), [3.5 + j * 1.6, 2, 1.4], [0.6, 0.6, 0.6], null, 0);
    } }

  // ---- 地面の塗り分け・道路・駐車場（位置はOpenStreetMapの道路・施設の外形） ----
  const TAU = Math.PI * 2, white = toon('#f4f2ea');
  // 地図上の向き（東から反時計回りの角度a）を、ワールドの回転（ローカルxをその向きへ）に
  const yaw = a => (a + 0.284 - Math.PI / 2) * track.turn;
  const inPolyMap = (poly, x, y) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [ax, ay] = poly[i], [bx, by] = poly[j]; if ((ay > y) !== (by > y) && x < (bx - ax) * (y - ay) / (by - ay) + ax) c = !c; } return c; };
  // 回転した長方形（地図の中心・幅・奥行・向き）の角
  const rect = (cx, cy, w, d, a) => [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([i, j]) => [cx + Math.cos(a) * w / 2 * i - Math.sin(a) * d / 2 * j, cy + Math.sin(a) * w / 2 * i + Math.cos(a) * d / 2 * j]);
  // 地図の多角形を細かい格子で敷く面（起伏のある地面に沿わせる）
  const patch = (poly, color, lift = 0.06, step = 4) => {
    const xs = poly.map(p => p[0]), ys = poly.map(p => p[1]), pos = [];
    const corner = (x, y) => { const p = at(x, y); pos.push(p.x, track.groundH(p.x, p.z) + lift, p.z); };
    for (let x = Math.min(...xs); x < Math.max(...xs); x += step) for (let y = Math.min(...ys); y < Math.max(...ys); y += step) {
      if (!inPolyMap(poly, x + step / 2, y + step / 2)) continue;
      corner(x, y); corner(x + step, y); corner(x + step, y + step); corner(x, y); corner(x + step, y + step); corner(x, y + step);
    }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.computeVertexNormals();
    const m = new THREE.Mesh(geo, toon(color, { side: THREE.DoubleSide })); m.receiveShadow = true; world.add(m); return m;
  };
  // 細い帯（道路・通路）：本線の芝や飾りのコースと交わる所は芝に任せる
  const ribbon = (path, wid, m, lift = 0.07) => decorCourseLane(path, 'dirt', 0, path.L, { lanes: [W / 2 - wid / 2, W / 2 + wid / 2], cols: 1, step: 2, onGround: true, lift, mat: m, hide: p => onMainTurf(p) || drawn.some(o => near(p, o.pts, W / 2)) });
  // 道路・建物の上に木を置かないための格子（ワールド座標で8単位ごと）
  const taken = new Set(), key = (x, z) => Math.floor(x / 8) + ',' + Math.floor(z / 8);
  const take = (p, r) => { for (let dx = -r; dx <= r; dx += 4) for (let dz = -r; dz <= r; dz += 4) taken.add(key(p.x + dx, p.z + dz)); };
  const takePath = (path, r) => path.pts.forEach(q => take(q, r));
  const asphalt = toon('#5e6269', { side: THREE.DoubleSide }), gravel = toon('#cdbf9f', { side: THREE.DoubleSide });
  // 自転車周回路（アノー・シクラブル・ド・ロンシャン）：場内をぐるりと囲む約3.6kmの道。スタンド側はトリビューン通り
  const ring = route([[325, 478], [285, 377], [257, 272], [252, 207], [255, 151], [292, -103], [296, -235], [286, -351], [249, -507], [241, -555], [247, -616], [236, -650], [208, -669], [151, -673], [108, -669], [61, -660], [7, -647], [-45, -630], [-97, -610], [-149, -585], [-207, -542], [-231, -513], [-261, -472], [-301, -407], [-335, -324], [-354, -239], [-364, -169], [-365, -135], [-354, -20], [-336, 69], [-313, 156], [-288, 249], [-265, 349], [-246, 411], [-217, 493], [-197, 547], [-151, 610], [-124, 638], [-72, 677], [-4, 706], [40, 715], [88, 722], [135, 724], [166, 721], [225, 696], [267, 664], [295, 624], [327, 562], [325, 478]]);
  ribbon(ring, 4.5, asphalt); takePath(ring, 4);
  // 自動車の通る道：セーヌ河岸のボール・ド・ロー通り、北のシュレーヌ通り（N185）とロンシャン通り、南のアナトール・フランス通り、
  // 森を南北に貫くレーヌ・マルグリット通り、カスケードへ向かう道
  const roads = [
    [[-131, 999], [-149, 959], [-198, 837], [-221, 770], [-258, 666], [-282, 596], [-303, 521], [-325, 458], [-390, 298], [-440, 146], [-497, -50], [-527, -207], [-531, -308], [-528, -373], [-523, -446], [-525, -504], [-530, -620], [-560, -760]],
    [[-205, 1000], [-128, 968], [-19, 903], [65, 828], [130, 784], [170, 754], [260, 732], [390, 718], [479, 695], [572, 741], [829, 881], [1127, 1042], [1274, 1124]],
    [[-510, -517], [-459, -534], [-219, -614], [-15, -682], [74, -711], [265, -775], [313, -791], [440, -833], [499, -892], [549, -959], [598, -1024]],
    [[627, -1008], [617, -806], [587, -448], [610, -391], [739, -95], [833, 118], [934, 348], [1070, 658], [1150, 843], [1274, 1124]],
    [[331, 548], [361, 556], [399, 626], [432, 661], [454, 718], [502, 818], [585, 965], [667, 1096]],
    [[394, 481], [536, 336], [650, 236], [724, 180], [833, 118]]
  ].map(r => { const p = route(r); ribbon(p, 8, asphalt); takePath(p, 6); return p; });
  // 道を行き交う車（2車線を逆向きに）
  { const cols = ['#e9e6df', '#2f3a4a', '#b8352e', '#7f8c93', '#1f5f8b', '#d9b23a', '#3d3d3d'].map(C), cars = [];
    roads.forEach((path, ri) => { for (let i = 0; i < Math.round(path.L / 70); i++) cars.push({ path, s: rand(0, path.L), dir: i % 2 ? 1 : -1, sp: rand(9, 14) }); });
    const body = new THREE.InstancedMesh(BOX, toon('#ffffff'), cars.length), cab = new THREE.InstancedMesh(BOX, toon('#3b4650'), cars.length);
    cars.forEach((c, i) => body.setColorAt(i, cols[i % cols.length]));
    for (const m of [body, cab]) { m.frustumCulled = false; m.userData.droneIgnore = true; world.add(m); }
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new V3(0, 1, 0), p = new V3(), sb = new V3(2.4, 0.8, 1.15), sc = new V3(1.3, 0.6, 1);
    themeUpd.push(t => { cars.forEach((c, i) => {
      const s = mod(c.s + c.dir * c.sp * t, c.path.L), f = c.path.pos(s, W / 2 + c.dir * 1.8);
      q.setFromAxisAngle(up, -f.h + (c.dir < 0 ? Math.PI : 0)); p.set(f.x, track.groundH(f.x, f.z) + 0.55, f.z);
      m4.compose(p, q, sb); body.setMatrixAt(i, m4); p.y += 0.65; m4.compose(p, q, sc); cab.setMatrixAt(i, m4);
    }); body.instanceMatrix.needsUpdate = cab.instanceMatrix.needsUpdate = true; }); }
  // 周回路を走る自転車：車輪2つと、色とりどりのジャージの乗り手
  { const n = 26, riders = [], jersey = ['#e8473a', '#2d6fd2', '#f2c230', '#2f9e5a', '#f4f2ea', '#8a4fc2', '#f08a2a'].map(C);
    for (let i = 0; i < n; i++) riders.push({ s: rand(0, ring.L), sp: rand(4.5, 7.5), lane: W / 2 + rand(-1.4, 1.4) });
    const wheel = new THREE.InstancedMesh(new THREE.TorusGeometry(0.42, 0.06, 5, 14), toon('#2b2b2b'), n * 2), torso = new THREE.InstancedMesh(BOX, toon('#ffffff'), n), head = new THREE.InstancedMesh(SPH_LO, toon('#f0f0f0'), n);
    riders.forEach((r, i) => torso.setColorAt(i, jersey[i % jersey.length]));
    for (const m of [wheel, torso, head]) { m.frustumCulled = false; m.userData.droneIgnore = true; world.add(m); }
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new V3(0, 1, 0), p = new V3(), d = new V3(), sw = new V3(1, 1, 1), st = new V3(0.7, 0.75, 0.35), sh = new V3(0.22, 0.24, 0.22);
    themeUpd.push(t => { riders.forEach((r, i) => {
      const f = ring.pos(mod(r.s + r.sp * t, ring.L), r.lane), y = track.groundH(f.x, f.z);
      q.setFromAxisAngle(up, -f.h); d.set(Math.cos(f.h), 0, Math.sin(f.h));
      for (const k of [-1, 1]) { p.set(f.x + d.x * 0.55 * k, y + 0.45, f.z + d.z * 0.55 * k); m4.compose(p, q, sw); wheel.setMatrixAt(i * 2 + (k > 0 ? 1 : 0), m4); }
      p.set(f.x - d.x * 0.1, y + 1.25, f.z - d.z * 0.1); m4.compose(p, q, st); torso.setMatrixAt(i, m4);
      p.set(f.x + d.x * 0.25, y + 1.75, f.z + d.z * 0.25); m4.compose(p, q, sh); head.setMatrixAt(i, m4);
    }); wheel.instanceMatrix.needsUpdate = torso.instanceMatrix.needsUpdate = head.instanceMatrix.needsUpdate = true; }); }
  // 橋：北のシュレーヌ橋（N185）と、南の歩行者橋アヴル橋。セーヌ川の上に橋脚と欄干
  for (const [[x0, y0], [x1, y1], wid] of [[[-205, 1000], [-470, 1075], 9], [[-545, -522], [-815, -566], 3.5]]) {
    const a = at(x0, y0), b = at(x1, y1), len = a.distanceTo(b), g = new THREE.Group(); g.position.copy(a).lerp(b, 0.5); g.rotation.y = -Math.atan2(b.z - a.z, b.x - a.x); world.add(g);
    addBox(g, [len, 1, wid], [0, 4.5, 0], toon('#d8d2c4'), null, 0.03);
    for (const z of [-wid / 2, wid / 2]) addBox(g, [len, 0.9, 0.3], [0, 5.4, z], toon(wid > 5 ? '#6f7c86' : '#8fa3ae'), null, 0);
    for (let i = 1; i < 4; i++) addBox(g, [2, 4.2, wid * 0.7], [-len / 2 + len * i / 4, 2.1, 0], toon('#cbc3b2'), null, 0);
    take(g.position, len / 2);
  }
  // 駐車場：スタンドの裏とセーヌ河岸、内馬場、カスケードの前。整然と並ぶ車
  { const parked = [], cols = ['#e9e6df', '#2f3a4a', '#b8352e', '#7f8c93', '#1f5f8b', '#d9b23a'].map(C);
    const keepOut = [tp(lerp(track.homeS0, track.homeS1, 0.75), W + 112).v, tp(lerp(track.homeS0, track.homeS1, 0.93), W + 80).v];
    for (const [cx, cy, w, d, a] of [[478, 615, 44, 52, 0.55], [-349, 533, 191, 49, 1.21], [-565, -371, 24, 42, -1.53], [-557, -516, 31, 22, -1.53], [-520, -29, 118, 23, -1.8], [-504, 40, 34, 16, 2.87], [-567, -230, 45, 27, -0.08], [-420, 305, 33, 41, -0.35], [-457, 191, 22, 28, 1.29], [-301, 654, 45, 49, -1.84], [-67, 164, 54, 72, -0.3]]) {
      if (keepOut.some(o => o.distanceTo(at(cx, cy)) < 30 + Math.max(w, d) * k / 2)) continue;
      patch(rect(cx, cy, w, d, a), '#9a9a96', 0.05, 3);
      for (let i = -w / 2 + 3; i < w / 2 - 2; i += 3) for (let j = -d / 2 + 4; j < d / 2 - 3; j += 7) {
        if (Math.random() < 0.35) continue;
        const x = cx + Math.cos(a) * i - Math.sin(a) * j, y = cy + Math.sin(a) * i + Math.cos(a) * j, p = at(x, y);
        p.y = track.groundH(p.x, p.z) + 0.55; parked.push({ p, s: new V3(1.15, 0.8, 2.3), r: [0, yaw(a), 0], c: cols[(Math.random() * cols.length) | 0] });
      }
      take(at(cx, cy), Math.max(w, d) * k / 2 + 4);
    }
    inst(BOX, toon('#ffffff'), parked, false); }

  // ---- 内馬場：場内の通路、催しの建物、ゴルフ場（ゴルフ・パリロンシャン）と打ちっぱなし ----
  for (const r of [[[128, 604], [108, 583], [95, 555], [82, 505]], [[136, 601], [106, 569], [100, 552], [92, 544]], [[89, 606], [90, 589], [64, 511]], [[82, 505], [163, 460]], [[-100, 136], [-27, 418], [15, 446], [82, 505]], [[82, 505], [157, 513]], [[-14, 32], [33, 197], [152, 164]], [[-29, -19], [-14, 32], [106, -2]], [[157, 181], [37, 214], [33, 197]], [[37, 214], [10, 491], [32, 548]], [[6, 100], [-100, 136], [-131, 19]]]) {
    const p = route(r); ribbon(p, 3, gravel, 0.05); takePath(p, 3);
  }
  // 打ちっぱなし：南の内馬場いっぱいの練習場。屋根付きの打席と、距離の目印の旗と円
  const range = [[-114, 1], [61, -98], [48, -146], [31, -193], [29, -228], [4, -249], [-40, -263], [-89, -258], [-117, -246], [-150, -217], [-166, -186], [-172, -125], [-149, -74], [-134, -16]];
  patch(range, '#93cf6e', 0.04, 5);
  { const a = at(-114, 1), b = at(61, -98), g = new THREE.Group(); g.position.copy(a).lerp(b, 0.5); g.position.y = track.groundH(g.position.x, g.position.z); g.rotation.y = -Math.atan2(b.z - a.z, b.x - a.x); world.add(g);
    const len = a.distanceTo(b) * 0.7;
    addBox(g, [len, 0.4, 6], [0, 3.6, 2], toon('#e6dfcf'), null, 0.03); addBox(g, [len, 3.6, 0.4], [0, 1.8, -0.8], toon('#7a5b45'), null, 0);
    for (let x = -len / 2; x <= len / 2; x += len / 8) addBox(g, [0.3, 3.6, 0.3], [x, 1.8, 4.8], white, null, 0);
    take(g.position, len / 2); }
  for (const [x, y, c] of [[-50, -70, '#d9302e'], [-10, -120, '#f2c230'], [-90, -140, '#2d6fd2'], [-40, -190, '#d9302e'], [-120, -200, '#f2c230']]) {
    const p = at(x, y), y0 = track.groundH(p.x, p.z);
    part(world, new THREE.RingGeometry(3.4, 4.2, 24), toon(c, { side: THREE.DoubleSide }), [p.x, y0 + 0.08, p.z], null, [-Math.PI / 2, 0, 0], 0);
    addBox(world, [0.15, 3.6, 0.15], [p.x, y0 + 1.8, p.z], white); addBox(world, [1.2, 0.8, 0.05], [p.x + 0.6, y0 + 3.2, p.z], toon(c));
  }
  // ゴルフのグリーン（旗つき）とバンカー、クラブハウス
  const greens = [[[-36, 12], [-40, 16], [-41, 19], [-40, 22], [-36, 22], [-34, 19], [-30, 17], [-28, 15], [-30, 13], [-32, 11]], [[-101, 6], [-97, 9], [-81, 54], [-84, 56], [-87, 57], [-92, 58], [-99, 56], [-103, 39], [-107, 23], [-108, 16], [-109, 10], [-104, 6]], [[-45, 44], [-48, 51], [-46, 57], [-44, 62], [-40, 64], [-34, 66], [-27, 66], [-22, 62], [-22, 55], [-25, 52], [-32, 51], [-39, 51], [-40, 47], [-41, 43], [-44, 43]]];
  for (const g of greens) {
    patch(g, '#7fd66a', 0.09, 2);
    const cx = g.reduce((s, p) => s + p[0], 0) / g.length, cy = g.reduce((s, p) => s + p[1], 0) / g.length, p = at(cx, cy), y0 = track.groundH(p.x, p.z);
    addBox(world, [0.15, 4.2, 0.15], [p.x, y0 + 2.1, p.z], white); addBox(world, [1.4, 0.9, 0.05], [p.x + 0.7, y0 + 3.7, p.z], toon('#d9302e'));
  }
  for (const g of [[[-50, 37], [-56, 44], [-56, 51], [-54, 52], [-51, 49], [-49, 42], [-46, 39], [-47, 37], [-48, 35], [-49, 36]], [[-44, 11], [-47, 15], [-50, 21], [-48, 25], [-43, 27], [-40, 25], [-41, 23], [-43, 20], [-43, 16], [-40, 14], [-39, 12], [-42, 10]]]) patch(g, '#eadbab', 0.1, 1.5);
  // 場内の建物（OpenStreetMapの外形を回転した箱に）：内馬場の催し・ゴルフの建物、周回路沿いの小屋
  { const walls = [], roofs = [], cols = ['#efe9dc', '#e6dccb', '#f4f2ea'].map(C);
    for (const [cx, cy, w, d, a, infield] of [[188, -7, 35, 10, 1.49, 1], [-14, 143, 27, 8, 1.23, 1], [-32, 85, 22, 16, -1.93, 1], [-14, 281, 29, 13, -0.35, 1], [-23, 124, 8, 7, 1.17, 1], [-84, 32, 48, 7, 1.22, 1], [164, 681, 12, 12, -2.09, 0], [333, 736, 8, 7, 1.05, 0], [380, -690, 7, 10, -0.46, 0], [-324, -443, 59, 27, -1.11, 0], [-157, -509, 7, 7, -0.93, 0], [-353, 711, 47, 7, -1.8, 0]]) {
      const p = at(cx, cy); if (gap(p) < W / 2 + 10) continue;
      const h = infield ? 4 : 5, y0 = track.groundH(p.x, p.z), r = [0, yaw(a), 0];
      walls.push({ p: new V3(p.x, y0 + h / 2, p.z), s: new V3(w * k, h, d * k), r, c: cols[walls.length % 3] });
      roofs.push({ p: new V3(p.x, y0 + h + 0.3, p.z), s: new V3(w * k + 0.6, 0.6, d * k + 0.6), r });
      take(p, Math.max(w, d) * k / 2 + 3);
    }
    inst(BOX, toon('#ffffff'), walls); inst(BOX, toon('#6f7d8f'), roofs); }

  // ---- スタッド・クリストフ・ドミニシ：セーヌ河岸のラグビー場とサッカー場。白いライン、H型のゴールポスト、小さなスタンド ----
  { const rugby = [[-401, -428], [-332, -406], [-374, -274], [-444, -296]], soccer = [[-432, -282], [-444, -192], [-385, -184], [-373, -274]];
    patch(rugby, '#5fbf55', 0.06, 3); patch(soccer, '#6cc95e', 0.06, 3);
    const field = (poly, posts) => {
      const [a, b, c, d] = poly.map(([x, y]) => at(x, y)), mid = (p, q) => p.clone().lerp(q, 0.5);
      // 長い辺の向きをxとするグループ
      const long = a.distanceTo(d) > a.distanceTo(b), e0 = long ? mid(a, b) : mid(a, d), e1 = long ? mid(d, c) : mid(b, c), len = e0.distanceTo(e1), wid = long ? a.distanceTo(b) : a.distanceTo(d);
      const g = new THREE.Group(); g.position.copy(mid(e0, e1)); g.position.y = track.groundH(g.position.x, g.position.z) + 0.1; g.rotation.y = -Math.atan2(e1.z - e0.z, e1.x - e0.x); world.add(g);
      for (const x of [-len / 2, 0, len / 2]) addBox(g, [0.3, 0.05, wid], [x, 0, 0], white, null, 0);
      for (const z of [-wid / 2, wid / 2]) addBox(g, [len, 0.05, 0.3], [0, 0, z], white, null, 0);
      for (const s of [-1, 1]) {
        if (posts) { for (const z of [-1.4, 1.4]) addBox(g, [0.2, 7, 0.2], [s * len / 2, 3.5, z], white, null, 0); addBox(g, [0.2, 0.2, 2.8], [s * len / 2, 1.6, 0], white, null, 0); }
        else { for (const z of [-1.8, 1.8]) addBox(g, [0.2, 1.2, 0.2], [s * len / 2, 0.6, z], white, null, 0); addBox(g, [0.2, 0.2, 3.8], [s * len / 2, 1.2, 0], white, null, 0); }
      }
      return { g, len, wid };
    };
    const { g, len, wid } = field(rugby, true); field(soccer, false);
    // ラグビー場の東側（コース寄り）の観覧席
    for (let i = 0; i < 4; i++) addBox(g, [len * 0.6, 0.6 + i * 0.7, 1.6], [0, (0.6 + i * 0.7) / 2, wid / 2 + 2 + i * 1.6], toon(i % 2 ? '#d93a3a' : '#e8e2d4'), null, 0);
    addBox(g, [len * 0.62, 0.4, 7], [0, 4.6, wid / 2 + 4.4], toon('#e8e2d4'), null, 0.02);
    for (const p of [...rugby, ...soccer]) take(at(...p), 20);
    take(at(-388, -351), 40); take(at(-408, -233), 30); }

  // ---- ラ・グランド・カスケード：森の北東の岩山から落ちる人工の滝と、ナポレオン3世時代の館のレストラン（ガラスのひさし） ----
  { const p = at(540, 667), g = registerLandmark(new THREE.Group(), 'ラ・グランド・カスケード'); g.position.set(p.x, track.groundH(p.x, p.z), p.z); world.add(g);
    const rock = toon('#8e8577'), rockD = toon('#6f675c');
    for (const [x, y, z, s] of [[0, 3, 6, 9], [-8, 2.5, 4, 7], [8, 2.5, 5, 7], [-4, 6.5, 7, 6], [5, 7, 8, 5.5], [0, 9.5, 9, 4.5], [-12, 1.5, 0, 5], [12, 1.5, 1, 5]]) part(g, SPH_LO, x % 2 ? rockD : rock, [x, y, z], [s, s * 0.8, s * 0.9], null, 0.04);
    const fall = part(g, new THREE.PlaneGeometry(3.2, 9), new THREE.MeshBasicMaterial({ color: C('#d8f0ff').multiplyScalar(1.3), transparent: true, opacity: 0.85 }), [0, 5.5, 0.6], null, null, 0);
    part(g, new THREE.CircleGeometry(1, 32), toon('#5f9fc4'), [0, 0.15, -6], [12, 6, 1], [-Math.PI / 2, 0, 0], 0);
    themeUpd.push(t => { fall.material.opacity = 0.75 + 0.15 * Math.sin(t * 6); });
    take(g.position, 22);
    const r = at(508, 568), h = registerLandmark(new THREE.Group(), 'レストラン「ラ・グランド・カスケード」'); h.position.set(r.x, track.groundH(r.x, r.z), r.z); h.rotation.y = g.rotation.y + 0.6; world.add(h);
    addBox(h, [18, 6, 10], [0, 3, 0], toon('#efe6d2'), null, 0.03); addBox(h, [19, 3, 11], [0, 7.5, 0], toon('#5f6b78'), null, 0.03);
    for (let i = 0; i < 6; i++) addBox(h, [1.6, 2.4, 0.1], [-6.5 + i * 2.6, 3.2, 5.06], toon('#7ca6b9'), null, 0);
    addBox(h, [16, 0.25, 4], [0, 4.6, 7], toon('#cfe3ea', { transparent: true, opacity: 0.7 }), [0.2, 0, 0], 0);
    // 前庭のテラス席：白いパラソルとテーブル
    for (let i = 0; i < 5; i++) { const x = -8 + i * 4; part(h, new THREE.ConeGeometry(1.6, 0.8, 10), white, [x, 3, 11], null, null, 0); addBox(h, [0.12, 2.6, 0.12], [x, 1.3, 11], toon('#7a5b45'), null, 0); addBox(h, [1.4, 0.15, 1.4], [x, 1, 11], toon('#e8e2d4'), null, 0); }
    take(h.position, 16); }

  // 道路・建物・駐車場・池と、エドモン・ド・ロチルド公園の外（町）には木を置かない
  const park = [[-445, -955], [-501, -685], [-518, -555], [-507, -529], [-201, -630], [-5, -713], [-45, -894], [30, -950], [12, -994], [-201, -974], [-321, -956], [-432, -954]];
  const blocked = (x, y, p) => taken.has(key(p.x, p.z));

  // 森の木（秋のブローニュの森）：場内の外側を囲む。スタンド・パドック・正門と池のある西側の直線の裏は空ける
  const autumn = ['#c9772a', '#e0a53a', '#9aa83a', '#d9902e', '#7f9a3a', '#b5562a', '#e8c24a'];
  const homeSide = (x, y) => { const fx = (x + 207) * 0.28 + (y + 33) * 0.96, fz = (x + 207) * 0.96 - (y + 33) * 0.28; return fz < -8 && fz > -430 && fx > -80 && fx < 720; };
  const spots = [];
  // 外側は中継カメラ（走路の外24m）の通り道をあけ、走路から44m以上離す
  for (let n = 0; n < 1800 && spots.length < 340; n++) {
    const x = rand(-480, 1000), y = rand(-950, 1100), p = at(x, y);
    if (homeSide(x, y) || wet(x, y) || inside(p) || gap(p) < 44 || blocked(x, y, p) || !clearOfCourses(p) || near(p, seine.pts, 54) || gap(p) > 230) continue;
    p.y = track.groundH(p.x, p.z); spots.push({ p });
  }
  // 風車のそばの小さな林
  for (let n = 0; n < 40; n++) { const x = rand(-50, 95), y = rand(664, 760), p = at(x, y); if (gap(p) > 44 && p.distanceTo(at(127, 695)) > 10 && !blocked(x, y, p)) { p.y = track.groundH(p.x, p.z); spots.push({ p }); } }
  // 内馬場はゴルフ場の芝が広がり、木はまばら
  for (let n = 0; n < 200 && spots.length < 370; n++) {
    const x = rand(-200, 260), y = rand(-450, 620), p = at(x, y);
    if (!inside(p) || !clearOfCourses(p) || blocked(x, y, p) || inPolyMap(range, x, y) || p.distanceTo(boardPos) < 30 || greens.some(g => Math.hypot(x - g[0][0], y - g[0][1]) < 30)) continue;
    p.y = track.groundH(p.x, p.z); spots.push({ p });
  }
  // エドモン・ド・ロチルド公園：アナトール・フランス通りの南に広がる、木立の多い公園
  for (let n = 0; n < 500 && spots.length < 520; n++) {
    const x = rand(-520, 30), y = rand(-994, -530), p = at(x, y);
    if (!inPolyMap(park, x, y) || blocked(x, y, p) || near(p, seine.pts, 54)) continue;
    p.y = track.groundH(p.x, p.z); spots.push({ p, s: rand(1.2, 1.9) });
  }
  roundTrees(spots, autumn);
  // ブローニュの森の木立：衛星写真のように、周回路の外の東・北・南東は木々がびっしり茂る（幹を省いた樹冠のかたまり。低画質では半分）
  { const crowns = [], cols = ['#b5562a', '#c9772a', '#e0a53a', '#9aa83a', '#7f9a3a', '#6f7f30', '#d9902e', '#5f7a35'].map(C);
    for (let x = -150; x < 1000; x += 13) for (let y = -950; y < 1100; y += 13) {
      const mx = x + rand(-5, 5), my = y + rand(-5, 5), p = at(mx, my);
      if (mx < 240 && my < 720) continue;                                  // 西と南西はスタンド・池・セーヌ河岸と公園
      if (my < -770 - Math.max(0, mx - 250) * 0.6) continue;               // 南はブローニュ＝ビヤンクールの町
      if (inside(p) || gap(p) < 50 || gap(p) > 420 || blocked(mx, my, p) || near(p, seine.pts, 60)) continue;
      const sc = rand(3.2, 5.6); p.y = track.groundH(p.x, p.z) + sc * 0.7 + rand(0.5, 2.5);
      crowns.push({ p, s: new V3(sc, sc * 0.75, sc), r: [0, rand(0, 6), 0], c: cols[(Math.random() * cols.length) | 0] });
    }
    for (let i = crowns.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [crowns[i], crowns[j]] = [crowns[j], crowns[i]]; }
    const m = inst(new THREE.IcosahedronGeometry(1, 0), toon('#ffffff'), crowns, false); m.userData.fullCount = crowns.length; themeDetails.push(m); }
  // プチ・ボワ（小さな森）：向正面の上り坂の内側、直線コースとの間にこんもり茂る小さな森
  { const grove = [];
    for (let n = 0; n < 120 && grove.length < 30; n++) {
      const a = rand(0, Math.PI * 2), r = Math.sqrt(Math.random()), x = 189 + Math.cos(a) * r * 26, y = 10 + Math.sin(a) * r * 62, p = at(x, y);
      if (!clearOfCourses(p)) continue;
      p.y = track.groundH(p.x, p.z); grove.push({ p, s: rand(1.6, 2.3) });
    }
    roundTrees(grove, ['#a8601f', '#c9772a', '#7f8a32', '#d08a2a', '#6f7f30']); }

  // 遠景（図鑑の全景では隠す）：川向こうの丘と町、ラ・デファンスの高層ビル、エッフェル塔
  const base = at(0, 0), toward = (x, y, dist) => { const d = at(x, y).sub(base).setY(0).normalize(); return base.clone().addScaledVector(d, dist).setY(0); };
  const backdrop = o => { o.userData.backdrop = true; return o; };
  // 東のパリの町並みと北のヌイイ、川向こうのサン＝クルー・シュレーヌ：クリーム色の壁と青灰色の屋根
  { const walls = [], roofs = [], woods = [], cream = ['#ece2cc', '#e4d6bb', '#f2ebdc', '#d9ccb2'].map(C);
    // セーヌ川の中心のx（地図のyから）：これより西は対岸のシュレーヌ・ピュトー・サン＝クルー
    const seineMap = [[-640, -900], [-680, -500], [-685, -280], [-660, -140], [-630, 10], [-591, 156], [-520, 370], [-462, 538], [-420, 700], [-383, 849], [-320, 980], [-222, 1145], [-60, 1300]];
    const seineX = y => { if (y <= seineMap[0][1]) return seineMap[0][0]; for (let i = 1; i < seineMap.length; i++) { const [x0, y0] = seineMap[i - 1], [x1, y1] = seineMap[i]; if (y <= y1) return lerp(x0, x1, (y - y0) / (y1 - y0)); } return 400; };
    for (let n = 0; n < 4200 && walls.length < 760; n++) {
      const x = rand(-2600, 2600), y = rand(-2400, 2800), p = at(x, y), d = Math.hypot(x - 20, y - 40);
      if (d < 700 || d > 3000 || near(p, seine.pts, 60) || inPolyMap(park, x, y) || taken.has(key(p.x, p.z))) continue;
      // 町になるのは、セーヌの対岸と、アナトール・フランス通りの南（ブローニュ＝ビヤンクール）。ほかはブローニュの森が続くので、遠くに木立の固まりを置く
      const town = x < seineX(y) - 70 || (x > -560 && x < 450 && y < -770 - Math.max(0, x - 250) * 0.6);
      if (!town) { if (d > 1150) woods.push({ p: new V3(p.x, -2, p.z), s: new V3(rand(22, 40), rand(10, 18), rand(22, 40)), r: [0, rand(0, 3), 0] }); continue; }
      // 街区の向きは川筋（直線の向き）にそろえ、縦横どちらかに少しだけ振る
      const w = rand(14, 24), h = d < 1300 ? rand(10, 18) : rand(9, 15), ry = (Math.random() < 0.5 ? 0 : Math.PI / 2) + rand(-0.12, 0.12);
      walls.push({ p: new V3(p.x, h / 2 - 1, p.z), s: new V3(w, h, w * 0.7), r: [0, ry, 0], c: cream[n % 4] });
      roofs.push({ p: new V3(p.x, h - 1, p.z), s: new V3(w * 0.96, 2.4, w * 0.62), r: [0, ry, 0] });
    }
    backdrop(inst(BOX, toon('#ffffff'), walls, false)); backdrop(inst(BOX, toon('#6f7d8f'), roofs, false)); woods.forEach(w => { w.c = C(['#8a6a32', '#7a7a38', '#9a6a2c', '#6a7434'][(Math.random() * 4) | 0]); w.s.y *= 0.7; });
    backdrop(inst(new THREE.IcosahedronGeometry(1, 1), toon('#ffffff', { fog: true }), woods, false)); }
  // 川向こうの丘：南西のサン＝クルーの丘（公園の森）と、北西のモン・ヴァレリアン（頂上に砦）
  { const hills = [];
    for (let i = 0; i < 7; i++) { const p = toward(-1500, -650 + i * 160, 980 + i * 30); hills.push({ p: new V3(p.x, -10, p.z), s: new V3(170, 46 + (i % 3) * 10, 130), r: [0, i * 0.4, 0] }); }
    const mv = toward(-1503, 1448, 1180); hills.push({ p: new V3(mv.x, -12, mv.z), s: new V3(230, 60, 190) });
    backdrop(inst(SPH_LO, toon('#7f8a5a', { fog: true }), hills, false));
    backdrop(addBox(world, [40, 8, 40], [mv.x, 50, mv.z], toon('#d8d2c4', { fog: true }))); }
  // ラ・デファンス：北の遠くに並ぶ高層ビル群と、四角い門のような新凱旋門（グランダルシュ）
  { const c = toward(183, 3924, 1350), dir = c.clone().sub(base).normalize(), g = new THREE.Group(); g.position.copy(c); g.rotation.y = Math.atan2(dir.x, dir.z); world.add(backdrop(g));
    const glassC = ['#8fa8c0', '#6f8aa6', '#a9bdcc', '#5f7690'];
    for (let i = 0; i < 16; i++) { const x = (i - 7.5) * 26 + rand(-6, 6), z = rand(-40, 40), h = rand(60, 190), w = rand(14, 24); addBox(g, [w, h, w], [x, h / 2, z], toon(glassC[i % 4], { fog: true })); }
    const arch = toon('#f4f2ea', { fog: true });
    addBox(g, [60, 8, 30], [-150, 56, -60], arch); addBox(g, [60, 6, 30], [-150, 3, -60], arch);
    for (const x of [-177, -123]) addBox(g, [6, 50, 30], [x, 30, -60], arch); }
  // エッフェル塔：東の遠く、ブローニュの森の向こう
  { const f = toward(4471, 99, 1200), g = new THREE.Group(); g.position.copy(f); world.add(backdrop(g)); const m = toon('#6b5a52', { fog: false });
    for (const [sx, sz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) part(g, BOX, m, [sx * 16, 45, sz * 16], [6, 100, 6], [sz * 0.3, 0, -sx * 0.3], 0);
    part(g, BOX, m, [0, 58, 0], [30, 4, 30], null, 0); part(g, BOX, m, [0, 115, 0], [9, 120, 9], null, 0); part(g, BOX, m, [0, 100, 0], [16, 3, 16], null, 0); part(g, CONE, m, [0, 180, 0], [3, 30, 3], null, 0); }
  fallingLeaves(TEX_PETAL, ['#f2b53a', '#e0852a', '#d9a33a'], 40);
}
// チャーチルダウンズの航空写真の座標（px。x：東、y：南、1px≒1.034m）をワールド座標へ変換する。
