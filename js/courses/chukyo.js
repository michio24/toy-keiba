// 中京
'use strict';

function chukyoAt(x, z) { const k = track.def.scale; return new V3(track.xs[0] + x * k, 0, track.zs[0] + z * k * track.turn); }
function decorChukyo(th) {
  // 配置はOpenStreetMapのコース・建物・線路の位置と、JRAの場内マップを参考にしたデフォルメ
  const at = chukyoAt, k = track.def.scale, mat = decorTurfMat(), v = (x, z) => new V3(x, 0, z);
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
  // 地図の多角形の内外判定と、平らな面（ShapeGeometryを地面に沿わせる）
  const inPoly = (poly, p) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const a = poly[i], b = poly[j]; if ((a.z > p.z) !== (b.z > p.z) && p.x < (b.x - a.x) * (p.z - a.z) / (b.z - a.z) + a.x) c = !c; } return c; };
  const flat = (poly, color, lift = 0.1) => {
    const geo = new THREE.ShapeGeometry(new THREE.Shape(poly.map(p => new THREE.Vector2(p.x, p.z)))), pp = geo.attributes.position;
    for (let i = 0; i < pp.count; i++) { const x = pp.getX(i), z = pp.getY(i); pp.setXYZ(i, x, track.groundH(x, z) + lift, z); }
    geo.computeVertexNormals();
    const m = new THREE.Mesh(geo, toon(color, { side: THREE.DoubleSide })); m.receiveShadow = true; world.add(m); return m;
  };
  const deg = d => d * Math.PI / 180, white = toon('#f1eee6'), steel = toon('#9aa3a8');
  const DEG41 = deg(41), DEG19 = deg(-19);

  // ---- 飾りのコース（レースは芝の周回上で行う） ----
  // 芝の内側のダートコース（1周1530m・直線410.7m）。内柵を挟んで並走し、1周は約1/2縮尺で実物に近い
  decorCourseLane(track, 'dirt', 0, track.L, { lanes: [-2.5, -13], cols: 4, step: 1.5, onGround: true, lift: 0.25 });
  decorInnerRail(-13.8, th.rail);
  // 発走ポケット：4コーナー奥（芝2200m）、2コーナー奥（芝1400m・1600m）
  decorTurfPocket(0, 55, false, mat); decorTurfPocket(track.segStart[3], 60, false, mat);

  // ---- 内馬場 ----
  // 乗馬センター：柵で囲んだ砂の馬場と、丸い屋根のウォーキングマシン
  { const g = group('乗馬センター', 74, 132);
    flat([[13, 76], [134, 74], [136, 188], [14, 189]].map(([x, z]) => at(x, z)), '#d8c39a', 0.12);
    const fence = [], rail = toon('#f4f2ea');
    for (let x = -30; x <= 30; x += 4) for (const z of [-28, 28]) fence.push({ p: new V3(x, 0.7, z), s: new V3(0.3, 1.4, 0.3) });
    for (let z = -28; z <= 28; z += 4) for (const x of [-30, 30]) fence.push({ p: new V3(x, 0.7, z), s: new V3(0.3, 1.4, 0.3) });
    for (const y of [0.7, 1.3]) { fence.push({ p: new V3(0, y, -28), s: new V3(60, 0.15, 0.15) }, { p: new V3(0, y, 28), s: new V3(60, 0.15, 0.15) }, { p: new V3(-30, y, 0), s: new V3(0.15, 0.15, 56) }, { p: new V3(30, y, 0), s: new V3(0.15, 0.15, 56) }); }
    g.add(inst(BOX, rail, fence, false));
    const walker = new THREE.Group(); walker.position.set((59.5 - 74) * k, 0, -(88.5 - 132) * k); g.add(walker);
    part(walker, new THREE.CylinderGeometry(4.6, 4.6, 0.5, 24), toon('#4f6f5a'), [0, 3.4, 0], null, null, 0);
    for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; addBox(walker, [0.3, 3.2, 0.3], [Math.cos(a) * 4.2, 1.6, Math.sin(a) * 4.2], steel, null, 0); }
    const ride = []; for (let i = 0; i < 2; i++) { const h = landmarkHorse(g, [0, 0, 0], 'walk', i ? '#8a5a3a' : '#3b2a20', 0.45); h.children[0].visible = false; ride.push(h); }
    ride.forEach(h => { h.userData.droneIgnore = true; });
    themeUpd.push(t => ride.forEach((h, i) => { const a = t * 0.12 + i * Math.PI, x = Math.cos(a) * 20, z = Math.sin(a) * 16; h.position.set(x, 0, z); h.rotation.y = -Math.atan2(Math.cos(a) * 16, -Math.sin(a) * 20); })); }
  // 馬場内プレイランド：カラフルな遊具の塔と、ポニーに乗れる楕円の小さな馬場（ポニーリンク）
  { const g = group('馬場内プレイランド', 230, 150), cols = ['#e8534a', '#f2b33d', '#4fa3d9', '#7cc36a'];
    for (const [x, z, c] of [[175, 110, 0], [205, 175, 1], [250, 130, 2], [280, 180, 3]]) {
      const p = new V3((x - 230) * k, 0, -(z - 150) * k);
      for (const dx of [-1.6, 1.6]) for (const dz of [-1.6, 1.6]) addBox(g, [0.35, 4.2, 0.35], [p.x + dx, 2.1, p.z + dz], steel, null, 0);
      addBox(g, [3.8, 0.4, 3.8], [p.x, 3.2, p.z], toon(cols[c]), null, 0);
      part(g, CONE, toon(cols[(c + 1) % 4]), [p.x, 5.4, p.z], [3, 2.2, 3], null, 0);
      addBox(g, [5, 0.25, 1.4], [p.x + 3.6, 1.7, p.z], toon(cols[(c + 2) % 4]), [0, 0, -0.55], 0);
    }
    const pony = group('ポニーリンク', 317, 103);
    part(pony, new THREE.RingGeometry(0.72, 1, 40), toon('#d9c7a0', { side: THREE.DoubleSide }), [0, 0.15, 0], [9, 4.5, 1], [-Math.PI / 2, 0, 0], 0);
    part(pony, new THREE.CircleGeometry(1, 32), toon('#7fbf62'), [0, 0.12, 0], [6.4, 3.2, 1], [-Math.PI / 2, 0, 0], 0);
    const ponies = []; for (let i = 0; i < 3; i++) { const h = landmarkHorse(pony, [0, 0, 0], 'walk', ['#d9b98a', '#6b4a35', '#f0ece2'][i], 0.28); h.children[0].visible = false; ponies.push(h); }
    ponies.forEach(h => { h.userData.droneIgnore = true; });
    themeUpd.push(t => ponies.forEach((h, i) => { const a = -t * 0.2 + i * Math.PI * 2 / 3, x = Math.cos(a) * 7.7, z = Math.sin(a) * 3.85; h.position.set(x, 0.1, z); h.rotation.y = -Math.atan2(-Math.cos(a) * 3.85, Math.sin(a) * 7.7); })); }

  // ---- スタンドの裏（1コーナー側） ----
  // 木馬園：ツインハットの裏の子ども広場。木馬の回転木馬がゆっくり回る
  { const g = group('木馬園', 530, -172); landmarkFoundation(g, 30, 26, '#cfe0b0');
    part(g, new THREE.CylinderGeometry(6.5, 6.5, 0.6, 28), toon('#e7d6b5'), [0, 0.3, 0], null, null, 0);
    part(g, new THREE.ConeGeometry(7.4, 3.2, 16), toon('#e8534a'), [0, 7.4, 0], null, null, 0);
    part(g, new THREE.CylinderGeometry(7.2, 7.2, 0.8, 16), toon('#f6efe0'), [0, 5.6, 0], null, null, 0);
    part(g, new THREE.CylinderGeometry(0.9, 0.9, 5.4, 12), toon('#f2b33d'), [0, 3, 0], null, null, 0);
    const spin = new THREE.Group(); g.add(spin);
    for (let i = 0; i < 8; i++) {
      const a = i / 8 * Math.PI * 2, h = landmarkHorse(spin, [Math.cos(a) * 4.8, 0.8, Math.sin(a) * 4.8], 'gallop', i % 2 ? '#c9925a' : '#f4ead8', 0.32);
      h.rotation.y = Math.PI / 2 - a; h.children[0].visible = false;
      addBox(spin, [0.15, 4.6, 0.15], [Math.cos(a) * 4.8, 3.2, Math.sin(a) * 4.8], toon('#d9b24a'), null, 0);
    }
    spin.userData.droneIgnore = true;
    themeUpd.push(t => { spin.rotation.y = t * 0.35; });
    // 揺れる木馬の遊具
    for (const [x, z, c] of [[-10, -8, '#c9925a'], [-11, 7, '#a8744a'], [10, 9, '#d9b98a']]) {
      const h = landmarkHorse(g, [x, 0.6, z], 'walk', c, 0.5); h.rotation.y = 0.6; addBox(g, [0.3, 1.2, 0.3], [x, 0.6, z], steel, null, 0);
    } }
  // パノラマカー（名鉄7000系、1961〜2009年）：運転席を屋根の上に上げ、先頭を展望席にした赤い電車。スタンドの裏のパノラマステーションに保存されている
  { const g = group('パノラマステーション', 597, -176); landmarkFoundation(g, 30, 9, '#cfc8b8');
    const red = toon('#c8302c'), pane = toon('#4b6b7d'), dark = toon('#3a3a3e');
    for (const z of [-1.1, 1.1]) addBox(g, [30, 0.2, 0.25], [0, 0.35, z], toon('#5d5a57'), null, 0);
    for (const x of [-7.2, 7.2]) {
      addBox(g, [13.8, 3.2, 3.2], [x, 2.6, 0], red, null, 0.03);
      addBox(g, [13.9, 0.25, 3.25], [x, 4.3, 0], toon('#e7e0d4'), null, 0);
      for (let j = 0; j < 5; j++) for (const z of [-1.62, 1.62]) addBox(g, [1.7, 1.1, 0.1], [x - 4.4 + j * 2.2 + Math.sign(x) * 0.6, 3, z], pane, null, 0);
      for (const dx of [-4.5, 4.5]) for (const z of [-1, 1]) part(g, new THREE.CylinderGeometry(0.55, 0.55, 0.3, 10), dark, [x + dx, 0.8, z], null, [Math.PI / 2, 0, 0], 0);
      // 展望席の大きな前面窓と、屋根の上の運転席
      const s = Math.sign(x), fx = x + s * 6.9;
      addBox(g, [0.2, 1.6, 2.8], [fx + s * 0.05, 3, 0], pane, null, 0);
      addBox(g, [2.2, 1.3, 2.2], [fx - s * 1.4, 4.9, 0], red, null, 0);
      addBox(g, [0.15, 0.7, 1.8], [fx - s * 0.25, 5, 0], pane, null, 0);
    } }
  // 西入場門：名鉄の中京競馬場前駅から歩いて約10分。弓なりの白い大屋根の下にガラスの入口
  { const g = group('西入場門', 655, -122); landmarkFoundation(g, 34, 22, '#d8d2c4');
    for (let j = 0; j < 12; j++) {
      const a0 = Math.PI * (0.15 + j / 12 * 0.7), a1 = Math.PI * (0.15 + (j + 1) / 12 * 0.7);
      const p0 = [Math.cos(a0) * 16, Math.sin(a0) * 9], p1 = [Math.cos(a1) * 16, Math.sin(a1) * 9];
      addBox(g, [32, 0.6, Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) + 0.2], [0, (p0[1] + p1[1]) / 2, (p0[0] + p1[0]) / 2], white, [Math.atan2(p1[1] - p0[1], p1[0] - p0[0]), 0, 0], 0);
    }
    addBox(g, [26, 5, 0.3], [0, 2.6, -2], toon('#7ca6b9'), null, 0);
    for (const x of [-13, 13]) addBox(g, [1.2, 6, 14], [x, 3, 0], white, null, 0); }
  // 西入場門から名鉄の駅へ続く歩道
  const walkLine = route([[688, -120], [850, -112], [1050, -96], [1250, -78], [1350, -66]]);
  decorCourseLane(walkLine, 'dirt', 0, walkLine.L, { lanes: [W / 2 - 3.5, W / 2 + 3.5], cols: 2, step: 3, onGround: true, lift: 0.1, mat: toon('#d9d2c2', { side: THREE.DoubleSide }) });
  world.children[world.children.length - 1].userData.backdrop = true;

  // ---- スタンドの裏（4コーナー側）：2棟の立体駐車場、スタンドへ渡る連絡デッキ、広い平面駐車場 ----
  for (const [x, z, n] of [[125, -213, '立体駐車場'], [85, -168, null]]) {
    const g = group(n, x, z, DEG41);
    for (let i = 0; i < 4; i++) { addBox(g, [43, 0.8, 24], [0, 0.4 + i * 3.4, 0], toon('#d8d5cc'), null, 0); if (i) for (const zz of [-11.8, 11.8]) addBox(g, [43, 1, 0.3], [0, i * 3.4 + 1.1, zz], toon('#b9b5aa'), null, 0); }
    for (let x2 = -20; x2 <= 20; x2 += 8) for (const zz of [-11, 11]) addBox(g, [0.8, 10.6, 0.8], [x2, 5.3, zz], steel, null, 0);
    addBox(g, [5, 13, 5], [-19, 6.5, 9], white, null, 0);
  }
  { const deck = new THREE.CatmullRomCurve3([[96, -122], [200, -172], [232, -166], [262, -112], [300, -104]].map(([x, z]) => at(x, z)), false, 'centripetal'), slabs = [], posts = [], roofs = [];
    const pts = deck.getSpacedPoints(Math.ceil(deck.getLength() / 2));
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], b = pts[i + 1], m = a.clone().add(b).multiplyScalar(0.5), h = Math.atan2(b.z - a.z, b.x - a.x), L = a.distanceTo(b) + 0.2, y = track.groundH(m.x, m.z);
      slabs.push({ p: new V3(m.x, y + 6, m.z), s: new V3(L, 0.6, 4.5), r: [0, -h, 0] }); roofs.push({ p: new V3(m.x, y + 9.4, m.z), s: new V3(L, 0.3, 5.5), r: [0, -h, 0] });
      if (i % 4 === 0) posts.push({ p: new V3(m.x, y + 4.7, m.z), s: new V3(0.6, 9.4, 0.6), r: [0, -h, 0] });
    }
    inst(BOX, toon('#d3cfc5'), slabs, false); inst(BOX, white, roofs, false); inst(BOX, steel, posts, false); }
  const lot = [[94, -297], [183, -401], [248, -350], [304, -309], [347, -281], [384, -263], [391, -249], [385, -236], [240, -172], [192, -214], [186, -215]].map(([x, z]) => at(x, z));
  flat(lot, '#8c8f93', 0.08);
  { const cars = [], carCol = ['#f4f4f2', '#2f3438', '#c8302c', '#9aa3ab', '#3b5f8f', '#e9e2cf'].map(C);
    for (let n = 0; n < 1500 && cars.length < 160; n++) {
      const x = rand(94, 391), z = rand(-401, -172), row = Math.round(z / 7) * 7, p = at(x, row);
      if (!inPoly(lot, p) || Math.random() < 0.35) continue;
      const q = ground(p); cars.push({ p: new V3(q.x, q.y + 0.55, q.z), s: new V3(1.1, 0.8, 2.2), r: [0, 0, 0], c: carCol[n % 6] });
    }
    inst(BOX, toon('#ffffff'), cars, false); }
  // 厩舎：スタンドの1コーナー側の奥に、細長い平屋の馬房が並ぶ
  { const walls = [], roofs = [];
    const barns = [[532, -411, 42, 8, 4.9], [536, -399, 44, 6, 6.6], [540, -388, 42, 8, 4.5], [546, -370, 42, 8, 4.4], [550, -359, 44, 6, 6.2], [554, -348, 42, 8, 6], [557, -340, 42, 8, 6.8], [560, -329, 44, 6, 6.4],
      [564, -317, 43, 8, 5.3], [611, -393, 45, 8, 4.3], [615, -382, 44, 6, 6.1], [619, -371, 45, 8, 5.1], [622, -362, 45, 8, 5.9], [625, -351, 44, 6, 6.4], [629, -340, 45, 8, 5.3], [678, -415, 45, 10, 7.3],
      [687, -390, 45, 8, 4.9], [690, -378, 44, 6, 6.5], [694, -367, 45, 8, 5.2]];
    for (const [x, z, l, w, h] of barns) {
      const p = ground(at(x, z)), ry = -DEG19 * track.turn;
      walls.push({ p: new V3(p.x, p.y + h * 0.3 - 0.5, p.z), s: new V3(l * k, h * 0.6 + 1, w * k), r: [0, ry, 0] });
      roofs.push({ p: new V3(p.x, p.y + h * 0.6 + 0.4, p.z), s: new V3(l * k + 0.6, 0.9, w * k + 1.2), r: [0, ry, 0] });
    }
    inst(BOX, toon('#e8e2d2'), walls, false); inst(BOX, toon('#5f6f7a'), roofs, false); }

  // ---- 場外：名鉄名古屋本線と中京競馬場前駅、国道1号、桶狭間古戦場伝説地 ----
  const railCurve = new THREE.CatmullRomCurve3([[1653, -929], [1660, -801], [1689, -623], [1684, -549], [1663, -475], [1626, -406], [1545, -301], [1369, -63], [1308, 50], [1202, 268], [1113, 449], [1074, 550], [1046, 704], [985, 1125]]
    .map(([x, z]) => at(x, z)), false, 'centripetal');
  const railLine = railCurve.getSpacedPoints(Math.ceil(railCurve.getLength() / 2)), deckY = 0.9;
  // 競馬場から700m以上離れているので遠景と同じ扱いにする（図鑑の全景では隠し、ランドマークにも登録しない）
  const backdrop = o => { o.userData.backdrop = true; return o; }, lastAdded = () => backdrop(world.children[world.children.length - 1]);
  { const bed = [], rails = [];
    for (let i = 0; i < railLine.length - 1; i++) {
      const a = railLine[i], b = railLine[i + 1], m = a.clone().add(b).multiplyScalar(0.5), h = Math.atan2(b.z - a.z, b.x - a.x), L = a.distanceTo(b) + 0.2, nx = -Math.sin(h), nz = Math.cos(h);
      bed.push({ p: new V3(m.x, deckY / 2 - 0.4, m.z), s: new V3(L, deckY + 0.8, 8), r: [0, -h, 0] });
      for (const o of [-2.2, -0.8, 0.8, 2.2]) rails.push({ p: new V3(m.x + nx * o, deckY + 0.1, m.z + nz * o), s: new V3(L, 0.2, 0.25), r: [0, -h, 0] });
    }
    backdrop(inst(BOX, toon('#a59c8c'), bed, false)); backdrop(inst(BOX, toon('#5d5a57'), rails, false)); }
  // 中京競馬場前駅（名鉄名古屋本線）
  { const g = backdrop(group(null, 1346, -20, Math.atan2(88, -45)));
    for (const z of [-5.6, 5.6]) { addBox(g, [62, deckY + 0.4, 3.2], [0, (deckY + 0.4) / 2, z], toon('#d8d0c0'), null, 0); addBox(g, [44, 0.5, 3.8], [0, 5, z], toon('#7f8f9c'), null, 0);
      for (let x = -20; x <= 20; x += 8) addBox(g, [0.4, 4, 0.4], [x, 3, z], steel, null, 0); }
    addBox(g, [10, 6, 16], [26, 3, -13], toon('#ece5d4'), null, 0); }
  { const RL = railCurve.getLength(), cars = [], body = toon('#d22730'), pane = toon('#3f4b55'), skirt = toon('#9a1d22');
    for (let i = 0; i < 4; i++) {
      const c = backdrop(new THREE.Group()); world.add(c);
      addBox(c, [9, 3.4, 3.2], [0, 1.9, 0], body, null, 0.03);
      for (const z of [-1.62, 1.62]) { addBox(c, [9.05, 0.4, 0.1], [0, 0.4, z], skirt, null, 0); for (let j = 0; j < 3; j++) addBox(c, [1.8, 1.1, 0.1], [-3 + j * 3, 2.5, z], pane, null, 0); }
      cars.push(c);
    }
    // 名鉄の赤い電車：線路の端から端まで、ゆっくり行って戻ってくる
    themeUpd.push(t => {
      const c = (t * 0.03) % 2, u = c < 1 ? c : 2 - c, s0 = 6 + THREE.MathUtils.smootherstep(u, 0.08, 0.92) * (RL - 50);
      cars.forEach((car, i) => { const s = (s0 + i * 9.6) / RL, p = railCurve.getPointAt(s), tg = railCurve.getTangentAt(s); car.userData.droneIgnore = true; car.position.set(p.x, deckY + 0.2, p.z); car.rotation.y = -Math.atan2(tg.z, tg.x); });
    }); }
  const roadPts = [[1735, -590], [1662, -420], [1574, -274], [1454, -67], [1408, -12], [1294, 46], [1194, 105], [1112, 189], [1083, 240], [1016, 384], [967, 500], [925, 629], [893, 734], [850, 900]];
  const road = route(roadPts);
  decorCourseLane(road, 'dirt', 0, road.L, { lanes: [W / 2 - 5, W / 2 + 5], cols: 2, step: 3, onGround: true, lift: 0.1, mat: toon('#6f7275', { side: THREE.DoubleSide }) }); lastAdded();
  decorCourseLane(road, 'dirt', 0, road.L, { lanes: [W / 2 - 0.2, W / 2 + 0.2], cols: 1, step: 3, onGround: true, lift: 0.14, mat: toon('#f2f0e6', { side: THREE.DoubleSide }) }); lastAdded();
  // 桶狭間古戦場伝説地：1560年の桶狭間の戦いで今川義元が討たれたと伝わる地。石碑と松
  { const g = backdrop(group(null, 1150, 215)); landmarkFoundation(g, 16, 12, '#cbbf9f');
    addBox(g, [1.6, 5.6, 0.9], [0, 2.8, 0], toon('#8d8f88'), null, 0); addBox(g, [3.2, 0.7, 2.2], [0, 0.35, 0], toon('#a6a39a'), null, 0);
    const pine = new THREE.ConeGeometry(1, 1, 7); pine.translate(0, 0.5, 0);
    for (const [x, z] of [[-5, -3.5], [5.5, -3], [-4.5, 4], [4, 4.2]]) {
      part(g, new THREE.CylinderGeometry(0.3, 0.45, 3, 6), toon('#6b4a35'), [x, 1.5, z], null, null, 0);
      for (const [r, y] of [[2.6, 2.6], [1.8, 4.2]]) part(g, pine, toon('#2f6a3e'), [x, y, z], [r, 2, r], null, 0);
    } }

  // ---- 木：本線・建物・線路・道路を避けて置く ----
  const ring = []; for (let i = 0; i < track.N; i += 6) ring.push(v(track.xs[i], track.zs[i]));
  const gap = p => { let d = 1e18; for (const q of ring) d = Math.min(d, (q.x - p.x) ** 2 + (q.z - p.z) ** 2); return Math.sqrt(d); };
  const inside = p => inPoly(ring, p);
  // スタンド・パドック・駐車場・厩舎・西入場門の範囲（地図の実寸）
  const busy = (x, z) => x > 20 && x < 720 && z < -35 && z > -440;
  const greens = ['#3f8f3a', '#4fa546', '#5fb853', '#377d34', '#6aa84f'], spots = [];
  // 外側は中継カメラ（走路の外24m）の通り道をあけ、走路から44m以上離す。向正面の外の丘は雑木林
  for (let n = 0; n < 2600 && spots.length < 340; n++) {
    const x = rand(-450, 1050), z = rand(-650, 760), p = at(x, z);
    if (busy(x, z) || inside(p) || gap(p) < 44 || gap(p) > 270 || near(p, railLine, 10) || near(p, walkLine.pts, 8) || near(p, road.pts, 10)) continue;
    spots.push({ p: ground(p), s: z > 280 ? rand(1, 1.4) : rand(0.8, 1.1) });
  }
  // 内馬場：ダートコースの内側に、遊具とターフビジョンを避けてまばらに
  const infieldBusy = p => [[74, 132, 70], [230, 150, 85], [317, 103, 30]].some(([x, z, r]) => p.distanceTo(at(x, z)) < r * k);
  for (let n = 0; n < 600 && spots.length < 400; n++) {
    const p = at(rand(-90, 580), rand(40, 270));
    if (!inside(p) || gap(p) < 30 || infieldBusy(p) || p.distanceTo(boardPos) < 34) continue;
    spots.push({ p: ground(p) });
  }
  roundTrees(spots, greens);

  // ---- 遠景（図鑑の全景では隠す）：丘の上に広がる名古屋市緑区・豊明市の住宅地、尾張丘陵、猿投山、名古屋駅前の高層ビル群 ----
  { const walls = [], roofs = [], blocks = [], bands = [];
    const wallCol = ['#efe8da', '#e6dccb', '#f3efe6', '#d9d2c4'].map(C), roofCol = ['#5a5f66', '#4f555c', '#7a5b4a', '#6b6f73'].map(C);
    for (let n = 0; n < 3200 && walls.length + blocks.length < 640; n++) {
      const x = rand(-1400, 1900), z = rand(-1400, 1400), p = at(x, z), ry = rand(-0.2, 0.2) + deg(36);
      if (inside(p) || gap(p) < 90 || busy(x, z) || near(p, railLine, 14) || near(p, road.pts, 14) || near(p, walkLine.pts, 10)) continue;
      // ところどころに中層の集合住宅（各階の窓の帯つき）
      if (n % 11 === 0 && gap(p) > 150) { const h = rand(12, 24), w = rand(22, 34); blocks.push({ p: new V3(p.x, h / 2 - 1, p.z), s: new V3(w, h, 8), r: [0, ry, 0], c: wallCol[n % 4] });
        for (let y = 2.4; y < h - 2; y += 3) bands.push({ p: new V3(p.x, y, p.z), s: new V3(w - 2, 1.1, 8.3), r: [0, ry, 0] }); continue; }
      if (n % 11 === 0) continue;
      const w = rand(6, 9), h = rand(4.5, 7);
      walls.push({ p: new V3(p.x, h / 2 - 1, p.z), s: new V3(w, h, w * 0.8), r: [0, ry, 0], c: wallCol[n % 4] });
      roofs.push({ p: new V3(p.x, h - 1, p.z), s: new V3(w * 0.55, 3, w * 0.45), r: [0, ry, 0], c: roofCol[n % 4] });
    }
    // 四角すいの角を箱の角に合わせる（45度回して底面を±1の正方形にする）
    const roofG = new THREE.ConeGeometry(Math.SQRT2, 1, 4); roofG.rotateY(Math.PI / 4); roofG.translate(0, 0.5, 0);
    for (const m of [inst(BOX, toon('#ffffff'), walls, false), inst(roofG, toon('#ffffff'), roofs, false), inst(BOX, toon('#ffffff'), blocks, false), inst(BOX, toon('#8fa3b3', { fog: true }), bands, false)]) backdrop(m); }
  { const base = at(250, 140), toward = (a, dist) => base.clone().add(new V3(Math.cos(a), 0, Math.sin(a) * track.turn).multiplyScalar(dist));
    const cone = new THREE.ConeGeometry(1, 1, 8); cone.translate(0, 0.5, 0);
    // 尾張丘陵：なだらかな低い丘がぐるりと続く
    const hills = [];
    for (let i = 0; i < 26; i++) { const p = toward(deg(i / 26 * 360 + rand(-5, 5)), 1250 + rand(-80, 120)); p.y = -6; hills.push({ p, s: new V3(rand(170, 240), rand(28, 55), rand(140, 200)), r: [0, rand(0, 3), 0] }); }
    backdrop(inst(cone, toon(th.mount, { fog: true }), hills, false));
    // 猿投山：東の遠く、尾張と三河の境にそびえる
    const sanage = toward(deg(-168.5), 1500); backdrop(part(world, cone, toon('#7f96a8', { fog: true }), [sanage.x, -8, sanage.z], [300, 78, 260], null, 0));
    // 名古屋駅前の高層ビル群：北北西の遠く。2本の円筒のJRセントラルタワーズと、ひときわ高いミッドランドスクエア
    const city = new THREE.Group(), cp = toward(deg(-84.4), 1450); city.position.set(cp.x, 0, cp.z); world.add(backdrop(city));
    const tower = toon('#c9d3db', { fog: true }), tower2 = toon('#9fb0bf', { fog: true });
    for (const [x, r, h] of [[-8, 9, 112], [8, 8, 102]]) part(city, new THREE.CylinderGeometry(r, r, h, 20), tower, [x, h / 2, 0], null, null, 0);
    addBox(city, [40, 30, 26], [0, 15, 0], tower, null, 0);
    addBox(city, [20, 116, 20], [-38, 58, 18], tower2, null, 0); addBox(city, [18, 92, 18], [32, 46, 16], tower, null, 0);
    for (const [x, z, h] of [[-70, 10, 55], [-56, -24, 70], [54, -20, 64], [74, 22, 48], [-90, -10, 40], [92, -6, 38]]) addBox(city, [16, h, 16], [x, h / 2, z], tower2, null, 0); }
}
