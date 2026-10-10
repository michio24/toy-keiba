// 京都
'use strict';

// 京都の地図座標（実寸m）をワールド座標へ変換する。x：4コーナー出口から直線の向き、z：コースの内側を正（コースの区間segsと同じ座標）
function kyotoAt(x, z) { const k = track.def.scale; return new V3(track.xs[0] + x * k, 0, track.zs[0] + z * k * track.turn); }
function decorKyoto(th) {
  // 配置はOpenStreetMapの柵・建物・水辺・馬像の位置と、JRAの場内マップを参考にしたデフォルメ
  const at = kyotoAt, k = track.def.scale, mat = decorTurfMat(), v = (x, z) => new V3(x, 0, z);
  const route = pts => {
    const ps = pts.map(([x, z]) => at(x, z)), curve = ps.length > 2 ? new THREE.CatmullRomCurve3(ps, false, 'centripetal') : new THREE.LineCurve3(ps[0], ps[1]);
    return decorPath(curve.getSpacedPoints(Math.ceil(curve.getLength() / 1.5)));
  };
  const near = (p, pts, d) => pts.some(q => (q.x - p.x) ** 2 + (q.z - p.z) ** 2 < d * d);
  const ground = p => { p.y = track.groundH(p.x, p.z); return p; };
  // 地図の向きにそろえた飾りのグループ：ローカルのxは地図のx（直線の向き）からangだけ内側へ回した向き、+zはコースの外側
  const group = (name, x, z, ang = 0) => {
    const g = new THREE.Group(); g.position.copy(ground(at(x, z))); g.rotation.y = -ang * track.turn; g.scale.z = track.sgn; world.add(g);
    return name ? registerLandmark(g, name) : g;
  };
  const white = toon('#f1eee6'), stone = toon('#cfc8b8');

  // ---- 飾りのコース（レースは芝外回りの周回上で行う） ----
  // 内回り：3コーナー手前で外回りから分かれて小さく回り、直線の残り328.4mで合流する（1周1782.8m）
  const inner = route([[138, 330], [118, 333], [98, 333], [78, 329], [59, 324], [41, 316], [23, 306], [7, 295], [-8, 282], [-21, 267], [-33, 251], [-43, 234], [-51, 215], [-57, 196],
    [-61, 177], [-64, 157], [-64, 137], [-61, 117], [-56, 98], [-48, 79], [-38, 62], [-26, 46], [-12, 32], [4, 20], [22, 11], [41, 5], [60, 1.5], [80, 0]]);
  decorCourseLane(inner, 'turf', 0, inner.L, { lanes: [-1.6, W + 1.6], cols: 18, step: 1.5, onGround: true, mat, hide: onMainTurf });
  // 内回りの1周（直線の合流点→1〜2コーナー→向正面→分岐→内回りの3〜4コーナー）。ダート・障害コースはこの内側に並走させる
  const nearestS = p => { let best = Infinity, s = 0; for (let i = 0; i <= track.N; i++) { const d = (track.xs[i] - p.x) ** 2 + (track.zs[i] - p.z) ** 2; if (d < best) { best = d; s = i * track.ds; } } return s; };
  const sa = nearestS(inner.pts[0]), sb = nearestS(inner.pts[inner.pts.length - 1]), loopPts = [];
  for (let s = sb; s < sa; s += 1.5) { const q = track.pos(s, W / 2); loopPts.push(v(q.x, q.z)); }
  loopPts.push(...inner.pts, loopPts[0].clone());
  const loop = decorPath(loopPts);
  // 内回りの内側のダートコース。1周は約1/2縮尺で実物の1607.6mに近い
  decorCourseLane(loop, 'dirt', 0, loop.L, { lanes: [-2.5, -13], cols: 4, step: 1.5, onGround: true, lift: 0.25 });
  decorInnerRail(-13.8, th.rail, loop);
  // 障害コース：ダートの内側の周回路（1周1413.8m）に生垣の障害を置く
  const jumpMat = decorTurfMat(); jumpMat.color = C('#c9e6a6');
  decorCourseLane(loop, 'turf', 0, loop.L, { lanes: [-24, -16], cols: 6, step: 1.5, onGround: true, lift: 0.3, mat: jumpMat });
  const hedge = toon('#3f6b34'), hedgeTop = toon('#4f8040');
  for (const f of [0.28, 0.45, 0.6, 0.75, 0.88]) {
    const q = loop.pos(loop.L * f, -20), g = new THREE.Group(); g.position.set(q.x, track.groundH(q.x, q.z), q.z); g.rotation.y = -q.h; world.add(g);
    addBox(g, [1.6, 1.3, 8.5], [0, 0.65, 0], hedge, null, 0); addBox(g, [1.9, 0.4, 8.8], [0, 1.45, 0], hedgeTop, null, 0);
  }
  // 発走ポケット：4コーナー奥（2400m・2200m）、2コーナー奥の長い引き込み線（1800m）と、その内側の短い引き込み線
  const pocket = (path, half, hide = onMainTurf) => decorCourseLane(path, 'turf', 0, path.L, { lanes: [W / 2 - half, W / 2 + half], cols: 12, step: 1.5, onGround: true, mat, hide });
  const chute = route([[545, 267], [957, 192]]);
  pocket(route([[-114, -19], [6, -19]]), 14.5 * k);
  pocket(chute, 14 * k);
  pocket(route([[652, 230], [786, 201]]), 14 * k, p => onMainTurf(p) || near(p, chute.pts, 14 * k + 1.8));

  // ---- 内馬場の池（白鳥の池）：内馬場の大部分を占め、中ほどに小さな島がある ----
  const pondLine = new THREE.CatmullRomCurve3([[117, 200], [154, 197], [178, 203], [280, 204], [367, 206], [479, 203], [552, 178], [564, 143], [562, 117], [546, 100], [527, 91],
    [445, 98], [421, 93], [99, 89], [80, 100], [70, 111], [65, 130], [66, 153], [77, 175], [89, 187]].map(([x, z]) => at(x, z)), true, 'centripetal').getSpacedPoints(160);
  pondLine.pop();
  const pondGeo = new THREE.ShapeGeometry(new THREE.Shape(pondLine.map(p => new THREE.Vector2(p.x, p.z)))), pp = pondGeo.attributes.position;
  for (let i = 0; i < pp.count; i++) { const x = pp.getX(i), z = pp.getY(i); pp.setXYZ(i, x, track.groundH(x, z) + 0.12, z); }
  pondGeo.computeVertexNormals();
  const pond = new THREE.Mesh(pondGeo, new THREE.MeshStandardMaterial({ color: C('#3f7fb8'), roughness: 0.08, metalness: 0.2, envMapIntensity: 1.5, side: THREE.DoubleSide }));
  pond.receiveShadow = true; world.add(pond);
  const inPond = p => { let c = false; for (let i = 0, j = pondLine.length - 1; i < pondLine.length; j = i++) { const a = pondLine[i], b = pondLine[j]; if ((a.z > p.z) !== (b.z > p.z) && p.x < (b.x - a.x) * (p.z - a.z) / (b.z - a.z) + a.x) c = !c; } return c; };
  const island = ground(at(304, 137));
  part(world, SPH_LO, toon('#7f9a52'), [island.x, island.y - 0.5, island.z], [7, 2, 4.5], null, 0);
  roundTrees([[-2.5, -1], [2, 1], [3.5, -1.5]].map(([dx, dz]) => ({ p: new V3(island.x + dx, island.y + 0.8, island.z + dz), s: rand(0.7, 0.9) })), ['#c7322a', '#ef6a2a', '#4f8f3a']);
  // 池の白鳥：ゆっくり向きを変えながら浮かぶ
  { const sw = toon('#ffffff'), bk = toon('#ff9a3a'), swans = [];
    for (let n = 0; n < 300 && swans.length < 10; n++) {
      const p = at(rand(80, 550), rand(90, 200));
      if (!inPond(p) || p.distanceTo(island) < 8) continue;
      const g = new THREE.Group(); g.position.set(p.x, track.groundH(p.x, p.z) + 0.12, p.z); g.rotation.y = rand(0, 6); g.scale.setScalar(1.5); world.add(g);
      part(g, SPH, sw, [0, 0.35, 0], [0.9, 0.45, 0.55]); part(g, LEG, sw, [0.5, 0.9, 0], [1.1, 1.2, 1.1], [0, 0, -0.25]); part(g, SPH, sw, [0.62, 1.35, 0], [0.22, 0.2, 0.2]); part(g, CONE, bk, [0.85, 1.32, 0], [0.07, 0.25, 0.07], [0, 0, -Math.PI / 2], 0);
      g.userData.y = g.position.y; swans.push(g);
    }
    swans.forEach(g => { g.userData.droneIgnore = true; });
    themeUpd.push(t => swans.forEach((g, i) => { g.rotation.y += 0.002 * (i % 2 ? 1 : -1); g.position.y = g.userData.y + Math.sin(t * 1.5 + i) * 0.05; })); }

  // ---- スタンドの裏 ----
  // パドック（2023年に円形から楕円形へ）：ゴールサイドの裏。2階にはパドックを360度取り囲むパドックリング、外側にパドックビジョン
  { const g = group('パドック', 350, -178); landmarkFoundation(g, 40, 24, '#cdbf9f');
    const oval = (rx, rz, y) => { const pts = []; for (let i = 0; i < 64; i++) { const a = i / 64 * Math.PI * 2; pts.push(new V3(Math.cos(a) * rx, y, Math.sin(a) * rz)); } return new THREE.CatmullRomCurve3(pts, true); };
    part(g, new THREE.CircleGeometry(1, 48), toon('#6fbf5c'), [0, 0.06, 0], [10, 4.5, 1], [-Math.PI / 2, 0, 0], 0);
    part(g, new THREE.RingGeometry(0.68, 1, 48), toon('#d9c7a0'), [0, 0.08, 0], [14, 7, 1], [-Math.PI / 2, 0, 0], 0);
    g.add(new THREE.Mesh(new THREE.TubeGeometry(oval(14.3, 7.3, 1.1), 128, 0.12, 4, true), toon('#f4f2ea')));
    part(g, new THREE.RingGeometry(0.8, 1, 64), toon('#ece8de', { side: THREE.DoubleSide }), [0, 4.6, 0], [19, 10.5, 1], [-Math.PI / 2, 0, 0], 0);
    g.add(new THREE.Mesh(new THREE.TubeGeometry(oval(15.6, 8.6, 5.7), 128, 0.1, 4, true), toon('#8f9aa2')));
    for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2; addBox(g, [0.6, 4.6, 0.6], [Math.cos(a) * 17.5, 2.3, Math.sin(a) * 9.6], toon('#d8d3c8'), null, 0); }
    const frame = toon('#231a3d');
    addBox(g, [16, 6.4, 0.8], [0, 10, 12.4], frame, null, 0);
    for (const x of [-5, 5]) addBox(g, [0.9, 7, 0.9], [x, 3.5, 12.6], frame, null, 0);
    const scr = new THREE.Mesh(new THREE.PlaneGeometry(15, 5.4), glowMat('#8fd0ff', 1.1)); scr.position.set(0, 10, 11.95); scr.rotation.y = Math.PI; g.add(scr); }
  // コントレイル像（2023年）：パドックの横の円い芝生の広場に立つ、2020年の無敗の三冠馬
  { const g = group('コントレイル像', 263, -195); landmarkFoundation(g, 20, 20, '#cfc8b8');
    part(g, new THREE.CircleGeometry(9, 40), toon('#7fbf62'), [0, 0.06, 0], null, [-Math.PI / 2, 0, 0], 0);
    landmarkHorse(g, [3, 0, 0], 'walk', '#526358', 1.6); landmarkFlowers(g, 8.5, 8.5, '#f2a33a'); }
  // 三冠馬メモリアルロード：パドックビジョンの裏の小径に、牡馬三冠8頭と牝馬三冠7頭の小さな馬像が並ぶ。三冠ゲート寄りに五冠馬シンザンの像
  { const x0 = 368, z0 = -229, ang = Math.atan2(31, 97), g = group('三冠馬メモリアルロード', x0, z0);
    const road = route([[318, -241], [370, -226], [418, -210]]);
    decorCourseLane(road, 'dirt', 0, road.L, { lanes: [W / 2 - 3, W / 2 + 3], cols: 2, step: 1.5, onGround: true, lift: 0.1, mat: toon('#ddd5c4', { side: THREE.DoubleSide }) });
    const bronze = ['#71664f', '#6a5d48', '#7a6c52'];
    [[322.3, -234.5], [324.9, -238], [325.3, -228.9], [328.2, -240.5], [345.7, -228.8], [348.8, -240.4], [349.3, -233.9], [355.8, -226.7], [370.6, -231.1], [386.2, -228.2],
      [387.6, -216.1], [397.4, -224.4], [400.3, -205.5], [402.8, -222.3], [409.2, -211.1]].forEach(([x, z], i) => {
      const h = landmarkHorse(g, [(x - x0) * k, 0, -(z - z0) * k], 'walk', bronze[i % 3], 0.4); h.rotation.y = ang;
      addBox(h, [5.6, 1.6, 3], [0, -0.45, 0], stone, null, 0);
    });
    const sz = landmarkHorse(g, [(414 - x0) * k, 0.6, -(-207 - z0) * k], 'walk', '#5d5340', 0.75); sz.rotation.y = ang; addBox(sz, [5.6, 1.6, 3], [0, -0.45, 0], stone, null, 0);
    roundTrees([[335, -258], [360, -250], [385, -241], [410, -233]].map(([x, z]) => ({ p: ground(at(x, z)), s: rand(0.9, 1.1) })), ['#c7322a', '#d9412b', '#ef6a2a']); }
  // ライスシャワー碑：1995年の宝塚記念（震災のため京都で開催）で3コーナーの坂の下りで故障し、世を去った「淀の刺客」をしのぶ碑
  { const g = group('ライスシャワー碑', 239, -257); landmarkFoundation(g, 10, 8, '#cfc8b8');
    addBox(g, [4.4, 0.6, 1.8], [0, 0.3, 0], toon('#9a9c96'), null, 0); addBox(g, [3.6, 3, 0.9], [0, 2.1, 0], toon('#7d7f7a'), null, 0); landmarkFlowers(g, 3.4, 2.8, '#f7f1e6'); }
  // 三冠ゲート（北側の正門）と、スタンドへ渡る屋根付きの連絡通路
  { const g = group('三冠ゲート', 438, -200, Math.atan2(16.2, 37.8)); landmarkFoundation(g, 28, 9, '#cfc8b8');
    addBox(g, [27, 0.8, 7], [0, 6.6, 0], white, null, 0);
    for (let i = 0; i < 4; i++) addBox(g, [1, 6.2, 1], [-12 + i * 8, 3.1, 0], white, null, 0);
    for (let i = 0; i < 3; i++) part(g, new THREE.TorusGeometry(1.2, 0.18, 6, 20), toon('#c9a24a'), [-8 + i * 8, 8.6, 0], null, null, 0);
    const w = group(null, 424, -170, Math.atan2(50, -12)), len = Math.hypot(50, 12) * k;
    addBox(w, [len, 0.5, 5.5], [0, 5.4, 0], toon('#c9c3b5'), null, 0);
    for (let x = -len / 2 + 1; x <= len / 2; x += 6) for (const z of [-2.4, 2.4]) addBox(w, [0.4, 5.2, 0.4], [x, 2.6, z], toon('#9aa3a8'), null, 0); }
  // ステーションゲート：淀駅寄りの入場門
  { const g = group('ステーションゲート', 183, -236); landmarkFoundation(g, 22, 9, '#cfc8b8');
    addBox(g, [20, 0.7, 7], [0, 6, 0], white, null, 0); addBox(g, [18, 4.2, 0.3], [0, 3.2, -2.6], toon('#7ca6b9'), null, 0);
    for (const x of [-9, 9]) addBox(g, [1.2, 6, 1.2], [x, 3, 0], white, null, 0); }
  // 4コーナー寄りの広場（みどりの広場・陽だまり広場）の芝生と、半円の屋根のイベントステージ
  for (const [x0, z0, x1, z1] of [[-118, -75, 4, -236], [16, -140, 136, -244]]) {
    const c = ground(at((x0 + x1) / 2, (z0 + z1) / 2));
    part(world, BOX, toon('#8cc46a'), [c.x, c.y + 0.03, c.z], [(x1 - x0) * k, 0.1, (z0 - z1) * k], null, 0);
  }
  { const g = group('イベントステージ', -68, -114);
    part(g, new THREE.CylinderGeometry(13, 13, 0.6, 24, 1, false, Math.PI / 2, Math.PI), white, [0, 6.5, 0], null, null, 0);
    for (const x of [-11, 0, 11]) addBox(g, [0.6, 6.4, 0.6], [x, 3.2, x ? 4 : 11], toon('#9aa3a8'), null, 0);
    addBox(g, [24, 0.8, 9], [0, 0.4, 4], stone, null, 0); }

  // ---- 京阪本線の高架と淀駅：スタンドの裏を直線とほぼ平行に走り、4コーナー寄りに高架の淀駅。白と緑の電車が行き来する ----
  const railCurve = new THREE.CatmullRomCurve3([[-620, -238], [-420, -262], [-262, -271], [-19, -290], [75, -295], [170, -298], [240, -295], [302, -285], [360, -269], [431, -241],
    [493, -210], [606, -144], [760, -52], [900, 40]].map(([x, z]) => at(x, z)), false, 'centripetal');
  const railLine = railCurve.getSpacedPoints(Math.ceil(railCurve.getLength() / 2)), deckY = 6;
  { const slab = [], piers = [], rails = [], walls = [];
    for (let i = 0; i < railLine.length - 1; i++) {
      const a = railLine[i], b = railLine[i + 1], m = a.clone().add(b).multiplyScalar(0.5), h = Math.atan2(b.z - a.z, b.x - a.x), L = a.distanceTo(b) + 0.2, nx = -Math.sin(h), nz = Math.cos(h);
      slab.push({ p: new V3(m.x, deckY - 0.6, m.z), s: new V3(L, 1.2, 9), r: [0, -h, 0] });
      for (const o of [-2.2, -0.8, 0.8, 2.2]) rails.push({ p: new V3(m.x + nx * o, deckY + 0.1, m.z + nz * o), s: new V3(L, 0.2, 0.25), r: [0, -h, 0] });
      for (const o of [-4.4, 4.4]) walls.push({ p: new V3(m.x + nx * o, deckY + 0.5, m.z + nz * o), s: new V3(L, 1, 0.35), r: [0, -h, 0] });
      if (i % 7 === 0) piers.push({ p: new V3(m.x, (deckY - 1.2) / 2, m.z), s: new V3(1.6, deckY - 1.2, 6), r: [0, -h, 0] });
    }
    inst(BOX, toon('#cfccc4'), slab, false); inst(BOX, toon('#b9b6ae'), piers, false); inst(BOX, toon('#5d5a57'), rails, false); inst(BOX, toon('#e2dfd8'), walls, false); }
  { const g = group('淀駅（京阪本線）', -140, -281, Math.atan2(-19, 243)), cream = toon('#ece5d4');
    addBox(g, [118, deckY - 1.2, 16], [0, (deckY - 1.2) / 2, 0], cream, null, 0);
    addBox(g, [110, 0.8, 18], [0, 12, 0], toon('#7f8f9c'), null, 0);
    for (const z of [-8.4, 8.4]) addBox(g, [110, 3.6, 0.3], [0, 8.6, z], toon('#9cc1d1'), null, 0);
    for (let x = -50; x <= 50; x += 12.5) addBox(g, [0.6, 5.4, 0.6], [x, 9, 0], toon('#9aa3a8'), null, 0); }
  { const RL = railCurve.getLength(), cars = [], body = toon('#f3f4ef'), dark = toon('#2f7f4a'), light = toon('#9fd16a'), pane = toon('#3f4b55');
    for (let i = 0; i < 4; i++) {
      const c = new THREE.Group(); world.add(c);
      addBox(c, [9, 3.4, 3.2], [0, 1.9, 0], body, null, 0.03);
      for (const z of [-1.62, 1.62]) { addBox(c, [9.05, 0.4, 0.1], [0, 1.1, z], dark, null, 0); addBox(c, [9.05, 0.2, 0.1], [0, 1.45, z], light, null, 0); for (let j = 0; j < 3; j++) addBox(c, [1.8, 1.1, 0.1], [-3 + j * 3, 2.5, z], pane, null, 0); }
      cars.push(c);
    }
    // 線路の端から端まで、ゆっくり行って戻ってくる
    themeUpd.push(t => {
      const c = (t * 0.03) % 2, u = c < 1 ? c : 2 - c, s0 = 6 + THREE.MathUtils.smootherstep(u, 0.08, 0.92) * (RL - 50);
      cars.forEach((car, i) => { const s = (s0 + i * 9.6) / RL, p = railCurve.getPointAt(s), tg = railCurve.getTangentAt(s); car.userData.droneIgnore = true; car.position.set(p.x, deckY + 0.2, p.z); car.rotation.y = -Math.atan2(tg.z, tg.x); });
    }); }

  // ---- 宇治川：向正面の向こうを南西へ流れる。両岸に芝の堤防 ----
  const riverPts = [[1700, 63], [1367, 200], [995, 334], [832, 391], [701, 446], [607, 485], [510, 498], [362, 522], [220, 538], [62, 556], [-36, 567], [-300, 600], [-650, 640]];
  const river = route(riverPts);
  decorCourseLane(river, 'water', 0, river.L, { lanes: [W / 2 - 27, W / 2 + 27], cols: 4, step: 4, onGround: true, lift: 0.08, mat: toon('#5f93b8', { side: THREE.DoubleSide }) });
  for (const s of [-1, 1]) decorCourseLane(river, 'turf', 0, river.L, { lanes: [W / 2 + s * 27, W / 2 + s * 40], cols: 2, step: 4, onGround: true, lift: 0.12, mat: toon('#9fbf6a', { side: THREE.DoubleSide }) });
  // 川の中心線のz（地図の実寸、xで補間）。これより外側は川向こう。川面と堤防は中心線から約80m
  const riverZ = x => { for (let i = 0; i < riverPts.length - 1; i++) { const [ax, az] = riverPts[i], [bx, bz] = riverPts[i + 1]; if (x <= ax && x >= bx) return lerp(az, bz, (ax - x) / (ax - bx)); } return x > riverPts[0][0] ? riverPts[0][1] : riverPts[riverPts.length - 1][1]; };

  // ---- 木（秋の紅葉）：本線・建物・線路・川を避けて置く ----
  const ring = []; for (let i = 0; i < track.N; i += 6) ring.push(v(track.xs[i], track.zs[i]));
  const gap = p => { let d = 1e18; for (const q of ring) d = Math.min(d, (q.x - p.x) ** 2 + (q.z - p.z) ** 2); return Math.sqrt(d); };
  const inside = p => { let c = false; for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) { const a = ring[i], b = ring[j]; if ((a.z > p.z) !== (b.z > p.z) && p.x < (b.x - a.x) * (p.z - a.z) / (b.z - a.z) + a.x) c = !c; } return c; };
  // スタンド・パドック・ゲート・淀駅・広場の範囲（地図の実寸）
  const busy = (x, z) => (x > 100 && x < 520 && z < -40 && z > -262) || (x > -130 && x < 150 && z < -40 && z > -250) || (x > -275 && x < -5 && z < -245 && z > -315);
  const autumn = ['#d9412b', '#ef6a2a', '#f2a33a', '#c7322a', '#4f8f3a', '#7f9a3a'], spots = [];
  // 外側は中継カメラ（走路の外24m）の通り道をあけ、走路から44m以上離す
  for (let n = 0; n < 2400 && spots.length < 300; n++) {
    const x = rand(-600, 1100), z = rand(-430, 700), p = at(x, z);
    if (busy(x, z) || inside(p) || gap(p) < 44 || gap(p) > 260 || near(p, railLine, 10) || Math.abs(z - riverZ(x)) < 85 || near(p, chute.pts, 20)) continue;
    spots.push({ p: ground(p) });
  }
  // 広場の外れの木立
  for (let n = 0; n < 60; n++) { const x = rand(-118, 136), z = rand(-205, -245), p = at(x, z); if (gap(p) > 44) spots.push({ p: ground(p) }); }
  // 内馬場：障害コースの内側から池のほとりまで、まばらに
  for (let n = 0; n < 300 && spots.length < 360; n++) {
    const q = loop.pos(Math.random() * loop.L, -rand(28, 40)), p = v(q.x, q.z);
    if (inPond(p) || near(p, loop.pts, 26) || p.distanceTo(boardPos) < 34) continue;
    spots.push({ p: ground(p) });
  }
  roundTrees(spots, autumn);

  // ---- 遠景（図鑑の全景では隠す）：淀の町並み、宇治川の向こうの田畑と倉庫、京都盆地を囲む山並み ----
  const backdrop = o => { o.userData.backdrop = true; return o; };
  { const walls = [], roofs = [], sheds = [], fields = [];
    const wallCol = ['#efe8da', '#e6dccb', '#f3efe6', '#d9d2c4'].map(C), roofCol = ['#5a5f66', '#4f555c', '#6b6f73', '#7a5b4a'].map(C), fieldCol = ['#9fbf6a', '#b9c77a', '#c9b27a', '#8fb35f'].map(C);
    for (let n = 0; n < 2600 && walls.length + fields.length < 520; n++) {
      const x = rand(-1300, 1500), z = rand(-1200, 1300), p = at(x, z), ry = rand(-0.2, 0.2);
      if (inside(p) || gap(p) < 80 || busy(x, z) || near(p, railLine, 12) || Math.abs(z - riverZ(x)) < 90) continue;
      if (z > riverZ(x)) {
        // 川向こう（久御山）：田畑が広がり、ところどころに大きな倉庫
        if (n % 5 === 0) { const w = rand(18, 30), h = rand(6, 10); sheds.push({ p: new V3(p.x, h / 2 - 0.5, p.z), s: new V3(w, h, w * 0.6), r: [0, ry, 0] }); }
        else fields.push({ p: new V3(p.x, 0.05, p.z), s: new V3(rand(18, 34), 0.1, rand(14, 26)), r: [0, ry + 0.6, 0], c: fieldCol[n % 4] });
        continue;
      }
      const w = rand(6, 9), h = rand(4.5, 7);
      walls.push({ p: new V3(p.x, h / 2 - 1, p.z), s: new V3(w, h, w * 0.8), r: [0, ry, 0], c: wallCol[n % 4] });
      roofs.push({ p: new V3(p.x, h - 1, p.z), s: new V3(w * 0.55, 3, w * 0.45), r: [0, ry, 0], c: roofCol[n % 4] });
    }
    // 四角すいの角を箱の角に合わせる（45度回して底面を±1の正方形にする）
    const roofG = new THREE.ConeGeometry(Math.SQRT2, 1, 4); roofG.rotateY(Math.PI / 4); roofG.translate(0, 0.5, 0);
    for (const m of [inst(BOX, toon('#ffffff'), walls, false), inst(roofG, toon('#ffffff'), roofs, false), inst(BOX, toon('#c9ccd0'), sheds, false), inst(BOX, toon('#ffffff'), fields, false)]) backdrop(m); }
  // 山並み：西の天王山からポンポン山へ続く西山、南西の男山、北西の愛宕山から北山、北東の東山と比叡山。南（巨椋池の干拓地の方角）は開けている
  { const base = at(300, 150), toward = (a, dist) => base.clone().add(new V3(Math.cos(a), 0, Math.sin(a) * track.turn).multiplyScalar(dist));
    const cone = new THREE.ConeGeometry(1, 1, 8); cone.translate(0, 0.5, 0);
    const deg = d => d * Math.PI / 180, ridge = [];
    const range = (a0, a1, dist, n, h0, h1) => { for (let i = 0; i < n; i++) { const p = toward(deg(lerp(a0, a1, i / (n - 1))), dist + rand(-60, 80)); p.y = -6; ridge.push({ p, s: new V3(rand(130, 190), rand(h0, h1), rand(110, 160)), r: [0, rand(0, 3), 0] }); } };
    range(-150, -112, 1150, 8, 90, 150);   // 西山（天王山〜ポンポン山）
    range(-108, -62, 1350, 7, 70, 120);    // 愛宕山から北山
    range(-58, -10, 1250, 9, 70, 130);     // 東山（稲荷山〜大文字山）
    backdrop(inst(cone, toon(th.mount, { fog: true }), ridge, false));
    // 比叡山：東山の向こうにひときわ高くそびえる
    const hiei = toward(deg(-24), 1500); backdrop(part(world, cone, toon('#8aa0b0', { fog: true }), [hiei.x, -8, hiei.z], [300, 270, 260], null, 0));
    // 男山（石清水八幡宮）：南西のすぐ近く、お椀を伏せたような丸い山
    const otoko = toward(deg(167), 980), dome = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), toon('#6f8f6a', { fog: true }));
    dome.position.set(otoko.x, -6, otoko.z); dome.scale.set(130, 70, 110); world.add(backdrop(dome));
    // 京都タワー：北北東の遠く、京都駅前の白い灯台のような塔
    const tw = toward(deg(-35), 1150), tower = new THREE.Group(); tower.position.set(tw.x, 0, tw.z); world.add(backdrop(tower));
    addBox(tower, [22, 18, 14], [0, 9, 0], toon('#e8e4da', { fog: true }), null, 0);
    part(tower, new THREE.CylinderGeometry(2.2, 3.4, 48, 12), toon('#f4f2ec', { fog: true }), [0, 42, 0], null, null, 0);
    part(tower, new THREE.CylinderGeometry(4.2, 3.2, 5, 12), toon('#f4f2ec', { fog: true }), [0, 67, 0], null, null, 0);
    part(tower, new THREE.CylinderGeometry(0.6, 1.4, 10, 8), toon('#d9412b', { fog: true }), [0, 74, 0], null, null, 0); }
  fallingLeaves(TEX_PETAL, ['#ff6a3d', '#ffb03a', '#e8402a'], 45);
}
