// 環状線コース（山手線・大阪環状線）と路線設定（RAIL_LINES）
'use strict';

/* ---- 環状線コース：線路・ホーム・駅名標・電車・街並みは共通で組み立て、駅舎と名所は路線ごとの設定で作る ---- */
function decorYamanote() { decorRailLoop(RAIL_LINES.yamanote); }
function decorOsakaLoop() { decorRailLoop(RAIL_LINES.osakaLoop); }
function decorRailLoop(line) {
  const wood = toon('#665c4d'), steel = toon('#c5ced0', { side: THREE.DoubleSide }), green = toon(line.color);
  const cream = toon('#e8e5dc'), glass = toon('#7eb2c8'), dark = toon('#586875');
  // ホームの外側に、飾りの電車が走る2線（外回り・内回り）を走路とは別に敷く
  const TRAIN_LANES = [W + 13, W + 17];
  const sleepers = [];
  for (const lane of [2, 6, 10, 14, ...TRAIN_LANES]) {
    for (const side of [-0.65, 0.65]) courseRibbon(0, track.L, lane + side - 0.09, lane + side + 0.09, 0.15, steel);
    for (let s = 0; s < track.L; s += 2.5) {
      const p = track.pos(s, lane);
      sleepers.push({ p: new V3(p.x, p.y + 0.07, p.z), s: new V3(0.35, 0.08, 2), r: [0, -p.h, 0] });
    }
  }
  // Rail appearance stays present at both quality levels and has no collision shape.
  inst(BOX, wood, sleepers, false).name = `${line.name}・枕木`;
  const atStation = (station, name, lane, shift = 0) => {
    const p = tp(mod(station.s + shift, track.L), lane), g = new THREE.Group();
    g.position.set(p.v.x, track.groundH(p.v.x, p.v.z), p.v.z);
    g.rotation.y = -p.h; g.scale.z = track.sgn;
    // 線路から離れる向き（外側の展示は外向き、内側の展示は内向き）
    g.userData.away = p.n.clone().multiplyScalar(lane < 0 ? -1 : 1);
    g.userData.station = station.name; world.add(g); return registerLandmark(g, name);
  };
  // 直線の建物（駅舎・展示）は曲げず、カーブで線路側へはみ出さないよう、
  // 土台の縁が線路中心からminDist以上離れるまで線路から離れる向きへ押し出す
  const TRAIN_CLEAR = W / 2 + 21, INFIELD_CLEAR = 50;
  const keepClear = (g, s, width, depth, minDist) => {
    const pts = [];
    for (let d = -300; d <= 300; d += 2) { const q = track.pos(mod(s + d, track.L), W / 2); pts.push(q.x, q.z); }
    const edge = [];
    for (let x = -width / 2; x <= width / 2 + 0.01; x += width / Math.ceil(width / 3)) edge.push([x, -depth / 2], [x, depth / 2]);
    for (let z = -depth / 2; z <= depth / 2 + 0.01; z += depth / Math.ceil(depth / 3)) edge.push([-width / 2, z], [width / 2, z]);
    for (let k = 0; k < 10; k++) {
      g.updateMatrixWorld(true);
      let worst = Infinity;
      for (const [x, z] of edge) {
        const p = g.localToWorld(new V3(x, 0, z));
        for (let i = 0; i < pts.length; i += 2) worst = Math.min(worst, Math.hypot(pts[i] - p.x, pts[i + 1] - p.z));
      }
      if (worst >= minDist) return;
      g.position.addScaledVector(g.userData.away, minDist - worst + 0.5);
    }
  };
  // 走路に沿って曲がる箱：s方向にs0〜s1、レーン方向にa〜b、高さy0〜y1。材質ごとに1つのメッシュへまとめる
  const slabs = new Map(), posts = [];
  const curved = Object.fromEntries([['cream', '#e8e5dc'], ['yellow', '#f2c230'], ['green', line.color], ['roof', '#9aa3a6']].map(([k, c]) => [k, toon(c, { side: THREE.DoubleSide })]));
  const curvedSlab = (s0, s1, a, b, y0, y1, mat) => {
    if (!slabs.has(mat)) slabs.set(mat, []);
    const out = slabs.get(mat), P = (s, lane, y) => { const q = track.pos(mod(s, track.L), lane); return [q.x, q.y + y, q.z]; };
    const quad = (p0, p1, p2, p3) => out.push(...p0, ...p1, ...p2, ...p0, ...p2, ...p3);
    const n = Math.max(1, Math.ceil((s1 - s0) / 2));
    for (let i = 0; i < n; i++) {
      const sa = lerp(s0, s1, i / n), sb = lerp(s0, s1, (i + 1) / n);
      quad(P(sa, a, y1), P(sb, a, y1), P(sb, b, y1), P(sa, b, y1));
      quad(P(sa, a, y0), P(sb, a, y0), P(sb, a, y1), P(sa, a, y1));
      quad(P(sa, b, y0), P(sb, b, y0), P(sb, b, y1), P(sa, b, y1));
      if (y0 > 0.01) quad(P(sa, a, y0), P(sb, a, y0), P(sb, b, y0), P(sa, b, y0));
    }
    for (const s of [s0, s1]) quad(P(s, a, y0), P(s, b, y0), P(s, b, y1), P(s, a, y1));
  };
  const block = (g, width, height, depth, x = 0, z = 0, color = cream) => {
    addBox(g, [width, height, depth], [x, height / 2, z], color, null, 0);
    const windows = [];
    for (let y = 3; y < height - 1; y += 4) for (let j = 0; j < 6; j++) {
      windows.push({ p: new V3(x + (j - 2.5) * width / 7, y, z - depth / 2 - 0.05), s: new V3(width / 10, 1.4, 0.15) });
    }
    if (windows.length) {
      const mesh = inst(BOX, glass, windows, false); g.add(mesh);
      mesh.userData.fullCount = windows.length; themeDetails.push(mesh);
    }
  };
  const forest = (g, n, rx, rz, avoid = () => false, cols = ['#3f7d42', '#4e9450', '#5aa55a', '#386f3a']) => {
    const blobs = [], cs = cols.map(C);
    for (let i = 0; i < n * 4 && blobs.length < n; i++) {
      const x = rand(-rx, rx), z = rand(-rz, rz), s = rand(3.5, 6.5);
      if (!avoid(x, z)) blobs.push({ p: new V3(x, s * 0.9, z), s: new V3(s, s * 0.9, s), c: cs[(Math.random() * cs.length) | 0] });
    }
    const mesh = inst(SPH_LO, toon('#ffffff'), blobs, false); g.add(mesh);
    mesh.userData.fullCount = blobs.length; themeDetails.push(mesh);
  };
  // 駅に付く名所：土台ごと置き、線路から一定の距離を保つ（内側の展示は+Z、外側の展示は-Zが線路側）
  const landmark = (station, name, lane, width, depth, shift = 0) => {
    const exhibit = atStation(station, name, lane, shift);
    keepClear(exhibit, station.s + shift, width, depth, lane < 0 ? INFIELD_CLEAR : TRAIN_CLEAR);
    landmarkFoundation(exhibit, width, depth); return exhibit;
  };
  const stations = track.stations, named = Object.fromEntries(stations.map(s => [s.name, s]));
  const ctx = { cream, glass, dark, green, block, forest, landmark, atStation, keepClear, named, TRAIN_CLEAR, INFIELD_CLEAR };
  const people = [];
  for (const station of stations) {
    // 発着駅はゴール板・写真判定カメラ・発走前カメラ（ゲート後方の外側）と重ならないよう、ホームと駅舎をゴールの先へずらす
    const shift = line.shift[station.name] || 0, len = station.major ? 90 : 60;
    // ホームは外側の柵のすぐ外（走路と電車線の間）に置き、中継カメラから馬越しに見せる
    const g = atStation(station, `${station.name}駅`, W + 6.5, shift), c = station.s + shift;
    g.position.y = 0.25;
    // ホーム・点字ブロック・屋根は、カーブでも電車線へはみ出さないよう走路に沿って曲げる
    curvedSlab(c - len / 2, c + len / 2, W + 3, W + 10, 0, 1.05, curved.cream);
    for (const a of [W + 3.4, W + 9.2]) curvedSlab(c - len / 2, c + len / 2, a, a + 0.4, 1.05, 1.08, curved.yellow);
    curvedSlab(c - len * 0.375, c + len * 0.375, W + 3.45, W + 9.55, 4.4, 4.9, curved.green);
    curvedSlab(c - len * 0.375, c + len * 0.375, W + 3.5, W + 9.5, 4.9, 5.2, curved.roof);
    for (let i = 0; i <= 6; i++) {
      const q = tp(mod(c - len * 0.35 + i * len * 0.7 / 6, track.L), W + 6.5);
      posts.push({ p: new V3(q.v.x, 2.85, q.v.z), s: new V3(0.35, 3.6, 0.35), r: [0, -q.h, 0] });
    }
    // 駅名標：中継カメラ（内側）から見て右が進行方向なので、次の駅を右、前の駅を左に書く
    const prev = stations[(station.index + stations.length - 1) % stations.length].name, next = stations[(station.index + 1) % stations.length].name;
    const label = ctex(512, 160, ctx2 => {
      ctx2.fillStyle = '#f8faf3'; ctx2.fillRect(0, 0, 512, 160);
      ctx2.fillStyle = line.color; ctx2.fillRect(0, 104, 512, 56);
      ctx2.fillStyle = '#25342a'; ctx2.font = 'bold 60px sans-serif'; ctx2.textAlign = 'center'; ctx2.textBaseline = 'middle';
      ctx2.fillText(station.name, 256, 54, 490);
      ctx2.fillStyle = '#ffffff'; ctx2.font = 'bold 26px sans-serif';
      ctx2.textAlign = 'left'; ctx2.fillText('◀ ' + prev, 12, 133, 230);
      ctx2.textAlign = 'right'; ctx2.fillText(next + ' ▶', 500, 133, 230);
    });
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(18, 5.6), new THREE.MeshBasicMaterial({ map: label, side: THREE.DoubleSide }));
    sign.position.set(0, 7.9, 0); g.add(sign); sign.name = '駅名標';
    for (const x of [-7, 7]) addBox(g, [0.3, 1.4, 0.3], [x, 5.3, 0], dark, null, 0);
    // ホームで待つ乗客（観客の代わりに、レースが盛り上がると跳ねる）
    for (let i = 0; i < (station.major ? 18 : 9); i++) {
      people.push(tp(mod(c + rand(-len * 0.42, len * 0.42), track.L), W + 6.5 + rand(-2.2, 2.2), 1.47).v);
    }
    if (!station.major) {
      // 小さな駅は、電車線の外側に小ぶりな駅舎を置く
      const small = atStation(station, `${station.name}駅舎`, W + 26, shift);
      keepClear(small, c, 16.6, 9.6, TRAIN_CLEAR);
      addBox(small, [16, 6, 9], [0, 3, 0], cream, null, 0);
      addBox(small, [16.6, 0.8, 9.6], [0, 5.65, 0], green, null, 0);
      continue;
    }
    // 大きな駅舎は電車線の外側に、独立した土台ごと置く
    const house = atStation(station, `${station.name}駅舎`, W + 40, shift * 0.75);
    keepClear(house, station.s + shift * 0.75, 72, 30, TRAIN_CLEAR);
    landmarkFoundation(house, 72, 30, '#bbbdb3');
    if (!line.house(station, house, ctx)) {
      block(house, 50, 14, 20, 0, 0, cream);
      addBox(house, [54, 1.5, 23], [0, 14, 0], green, null, 0);
    }
    line.landmark(station, ctx);
  }
  for (const [mat, list] of slabs) {
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(list, 3)); geo.computeVertexNormals();
    const mesh = new THREE.Mesh(geo, mat); mesh.castShadow = mesh.receiveShadow = true; mesh.name = `${line.name}・ホーム`; world.add(mesh);
  }
  inst(BOX, dark, posts, false).name = `${line.name}・ホームの柱`;
  // 電車線の道床
  courseRibbon(0, track.L, W + 11, W + 19, 0.03, toon('#8f948b', { side: THREE.DoubleSide }));
  // ホームの乗客をまとめて1つのインスタンスにし、共通の観客アニメーション（updCrowd）で跳ねさせる
  crowd.dispose(); world.remove(crowd);
  crowd = new THREE.InstancedMesh(new THREE.CapsuleGeometry(0.24, 0.34, 3, 8), toon('#ffffff'), people.length);
  const coats = ['#2f3542', '#57606f', '#e9ecef', '#c8d6e5', '#3d5a80', '#7a6c5d', '#ff7eb6', '#ffd166'].map(C), m4 = new THREE.Matrix4();
  crowd.userData.base = people.map((p, i) => {
    m4.makeTranslation(p.x, p.y, p.z); crowd.setMatrixAt(i, m4); crowd.setColorAt(i, coats[(Math.random() * coats.length) | 0]);
    return [p.x, p.y, p.z, Math.random() * 6, rand(4, 9)];
  });
  crowd.userData.exc = 0.2; world.add(crowd);

  // 電車（外回り・内回り）。走路とは別の線を一定速度で回り続ける飾りで、レースには関わらない
  const spec = line.train;
  const body = toon(spec.body), band = toon(spec.band), door = toon(spec.door), win = toon('#2f3d47'), roofM = toon('#a9b0b4'), under = toon('#40464c'), face = toon('#1d2226');
  const lamp = glowMat('#fff3cf', 2.5), tailLamp = glowMat('#ff4a3a', 2), CAR = 14, GAP = 0.8, CARS = spec.cars;
  const trains = TRAIN_LANES.map((lane, k) => {
    const cars = [];
    for (let i = 0; i < CARS; i++) {
      const car = new THREE.Group(); car.name = `${line.name}・電車`; world.add(car); cars.push(car);
      addBox(car, [CAR, 2.6, 3], [0, 2.1, 0], body, null, 0.02);
      addBox(car, [CAR + 0.04, 0.95, 3.04], [0, 2.85, 0], win, null, 0);
      addBox(car, [CAR + 0.06, 0.3, 3.06], [0, 2.15, 0], band, null, 0);
      // 路線の色のドアを片側に並べる
      for (const x of spec.doors) addBox(car, [1.4, 2.2, 3.08], [x, 2.0, 0], door, null, 0);
      addBox(car, [CAR - 0.2, 0.35, 2.7], [0, 3.55, 0], roofM, null, 0);
      addBox(car, [CAR - 3, 0.7, 2.5], [0, 0.6, 0], under, null, 0);
      // 先頭車と最後尾車だけ、黒い前面と前照灯・尾灯を付ける（車両の+Xが進行方向）
      for (const end of [1, -1]) {
        if (!(end > 0 ? i === 0 : i === CARS - 1)) continue;
        addBox(car, [0.15, 2.3, 2.8], [end * (CAR / 2 + 0.05), 2.35, 0], face, null, 0);
        addBox(car, [0.17, 0.25, 2.9], [end * (CAR / 2 + 0.06), 1.45, 0], band, null, 0);
        for (const z of [-0.95, 0.95]) addBox(car, [0.2, 0.25, 0.45], [end * (CAR / 2 + 0.08), 1.75, z], end > 0 ? lamp : tailLamp, null, 0);
      }
    }
    // 外回りは馬と同じ向き、内回りは逆向き
    return { lane, dir: k ? -1 : 1, cars, s: rand(0, track.L), v: 23 };
  });
  const moveTrains = dt => {
    for (const tr of trains) {
      tr.s = mod(tr.s + tr.v * tr.dir * Math.min(dt, 0.1), track.L);
      tr.cars.forEach((car, i) => {
        const q = track.pos(mod(tr.s - i * (CAR + GAP) * tr.dir, track.L), tr.lane);
        car.userData.droneIgnore = true; car.position.set(q.x, q.y + 0.25, q.z); car.rotation.y = -q.h + (tr.dir < 0 ? Math.PI : 0);
      });
    }
  };
  moveTrains(0); themeUpd.push((t, dt) => moveTrains(dt));
  line.extras(ctx);
  railLoopCity(line);
}
// 遠景の山（コース図鑑の全景の範囲には含めない）
function railBackdropPeak(x, z, radius, height, color, snow = 0) {
  const g = new THREE.ConeGeometry(1, 1, 48); g.translate(0, 0.5, 0);
  const peak = new THREE.Mesh(g, toon(color, { fog: false })); peak.position.set(x, -10, z); peak.scale.set(radius, height, radius); world.add(peak);
  peak.userData.backdrop = true;
  if (snow) {
    const cap = new THREE.Mesh(g, toon('#ffffff', { fog: false })); cap.position.set(x, -10 + height * (1 - snow), z); cap.scale.set(radius * snow, height * snow, radius * snow); world.add(cap);
    cap.userData.backdrop = true;
  }
}
/* ---- 山手線：東京駅・高輪ゲートウェイの駅舎と、東京の名所 ---- */
function yamanoteHouse(station, house, { cream, green, block }) {
  if (station.name === '東京') {
    const brick = toon('#ad5948'), roof = toon('#485f66');
    block(house, 62, 13, 15, 0, 0, brick);
    for (const x of [-23, 0, 23]) {
      block(house, 13, 18, 17, x, 0, brick);
      part(house, SPH_LO, roof, [x, 19, 0], [7, 5, 9], null, 0);
    }
    addBox(house, [63, 0.6, 15.5], [0, 13.3, 0], cream, null, 0);
  } else if (station.name === '高輪ゲートウェイ') {
    block(house, 58, 9, 22, 0, 0);
    for (let i = 0; i < 5; i++) for (const side of [-1, 1]) {
      addBox(house, [6.8, 0.7, 27], [(i - 2) * 12 + side * 3, 13.8, 0], cream, [0, 0, side * 0.4], 0);
    }
  } else {
    const col = station.name === '秋葉原' ? toon('#e0a444') : cream;
    block(house, station.name === '新宿' || station.name === '品川' ? 62 : 50, 14, 20, 0, 0, col);
    addBox(house, [54, 1.5, 23], [0, 14, 0], green, null, 0);
  }
  return true;
}
function yamanoteLandmark(station, { cream, glass, dark, green, block, landmark }) {
  switch (station.name) {
    case '浜松町': {
      const tower = landmark(station, '東京タワー', -110, 46, 46), red = toon('#e76342'), white = toon('#f4efdb');
      for (let tier = 0; tier < 6; tier++) {
        const bottom = 18 - tier * 2.8, top = bottom - 2.8, y = tier * 17;
        for (const x of [-1, 1]) for (const z of [-1, 1]) {
          const a = new V3(x * bottom, y, z * bottom), b = new V3(x * top, y + 17, z * top);
          const beam = new THREE.Mesh(BOX, tier === 3 || tier === 5 ? white : red);
          beam.position.copy(a).add(b).multiplyScalar(0.5); beam.scale.set(1.5, a.distanceTo(b), 1.5);
          beam.quaternion.setFromUnitVectors(new V3(0, 1, 0), b.clone().sub(a).normalize()); tower.add(beam);
        }
        addBox(tower, [bottom * 2, 1.8, bottom * 2], [0, y + 8, 0], tier % 3 === 0 ? white : red, null, 0);
      }
      addBox(tower, [24, 6, 24], [0, 53, 0], white, null, 0);
      addBox(tower, [1.6, 18, 1.6], [0, 109, 0], red, null, 0); break;
    }
    case '品川': {
      const city = landmark(station, '品川・高層ビル群', W + 120, 90, 38);
      for (let i = 0; i < 3; i++) block(city, 24, 44 + i * 12, 26, (i - 1) * 30, 0, dark); break;
    }
    case '恵比寿': {
      const garden = landmark(station, '恵比寿ガーデンプレイス', -115, 80, 52);
      block(garden, 23, 72, 22, -22, 0, toon('#b19b8b'));
      block(garden, 34, 16, 26, 21, 0, toon('#d4b19a'));
      for (const x of [11, 31]) part(garden, CONE, dark, [x, 20, 0], [10, 10, 12], null, 0);
      landmarkFlowers(garden, 30, 20); break;
    }
    case '渋谷': {
      const square = landmark(station, '渋谷・ハチ公とスクランブル交差点', W + 112, 62, 46);
      addBox(square, [58, 0.15, 42], [0, 0.1, 0], dark, null, 0);
      const markings = new THREE.Group(); square.add(markings); themeDetails.push(markings);
      for (const angle of [0, Math.PI / 2, Math.PI / 4]) for (let i = -4; i <= 4; i++) {
        addBox(markings, [1.7, 0.06, 32], [i * 3 * Math.cos(angle), 0.22, i * 3 * Math.sin(angle)], cream, [0, -angle, 0], 0);
      }
      const bronze = toon('#648c75');
      addBox(square, [8, 2, 8], [19, 1.2, 12], cream, null, 0);
      part(square, SPH_LO, bronze, [19, 5, 12], [2.5, 3.5, 1.8], null, 0);
      part(square, SPH_LO, bronze, [19, 9, 11.3], [2.2, 2.2, 1.8], null, 0);
      for (const x of [-1, 1]) {
        part(square, CONE, bronze, [19 + x * 1.4, 11, 11.3], [0.9, 2.2, 0.8], null, 0);
        addBox(square, [1, 3.8, 1], [19 + x * 1.4, 4, 10.7], bronze, null, 0);
      }
      break;
    }
    case '新宿': {
      const city = landmark(station, '東京都庁', W + 130, 78, 42);
      block(city, 68, 34, 29, 0, 0, dark);
      for (const x of [-22, 22]) {
        block(city, 23, 89, 29, x, 0);
        addBox(city, [15, 12, 21], [x, 95, 0], dark, null, 0);
      }
      break;
    }
    case '池袋': {
      const city = landmark(station, 'サンシャイン60', -120, 50, 42);
      block(city, 34, 102, 26, 0, 0, toon('#c9c0ac'));
      addBox(city, [35, 4, 27], [0, 103, 0], glass, null, 0); break;
    }
    case '上野': {
      const park = landmark(station, '上野公園・東京国立博物館', -120, 104, 64);
      addBox(park, [102, 0.15, 62], [0, 0.1, 0], green, null, 0);
      block(park, 76, 16, 28, 0, 8);
      addBox(park, [82, 2.4, 34], [0, 18, 8], dark, null, 0);
      for (const x of [-22, -11, 0, 11, 22]) addBox(park, [2, 12, 2], [x, 6, -7], cream, null, 0);
      const trees = [];
      for (let i = 0; i < 16; i++) trees.push({ p: new V3((i % 8 - 3.5) * 12, 5.3, i < 8 ? -24 : 25), s: new V3(3.2, 5, 3.2) });
      const leaves = inst(SPH_LO, toon('#4e975b'), trees, false); park.add(leaves);
      leaves.userData.fullCount = trees.length; themeDetails.push(leaves); break;
    }
    case '秋葉原': {
      const city = landmark(station, '秋葉原・電気街', W + 110, 88, 38);
      for (let i = 0; i < 4; i++) {
        const col = toon(['#e76c68', '#519cc9', '#e6bf46', '#9f7bc6'][i]);
        block(city, 18, 25 + i * 8, 23, (i - 1.5) * 21, 0, col);
        addBox(city, [13, 7, 0.5], [(i - 1.5) * 21, 19 + i * 8, -12], green, null, 0);
      }
      break;
    }
  }
}
function yamanoteExtras({ named, atStation, keepClear, forest, TRAIN_CLEAR, INFIELD_CLEAR }) {
  // 皇居：東京駅の内側に、お濠と石垣に囲まれた緑の島と櫓を置く（内側の展示は+Zが線路側）
  {
    const palace = atStation(named['東京'], '皇居', -230, -40);
    keepClear(palace, named['東京'].s - 40, 230, 170, INFIELD_CLEAR);
    landmarkFoundation(palace, 230, 170, '#9fb3b8');
    addBox(palace, [226, 0.2, 166], [0, 0.1, 0], toon('#4b8fb0'), null, 0);
    addBox(palace, [190, 2.4, 130], [0, 1.2, 0], toon('#a49f92'), null, 0);
    addBox(palace, [186, 0.3, 126], [0, 2.5, 0], toon('#69a35c'), null, 0);
    const white = toon('#f3f0e6'), tile = toon('#55616a');
    addBox(palace, [16, 7, 10], [45, 6.1, 45], white, null, 0);
    addBox(palace, [19, 1.2, 13], [45, 10.2, 45], tile, null, 0);
    addBox(palace, [11, 4.5, 7], [45, 13, 45], white, null, 0);
    addBox(palace, [14, 1, 9.5], [45, 15.6, 45], tile, null, 0);
    // 二重橋
    addBox(palace, [9, 1.4, 20], [-20, 2.2, 74], toon('#c9c3b3'), null, 0);
    forest(palace, 70, 88, 58, (x, z) => Math.abs(x - 45) < 14 && Math.abs(z - 45) < 11);
  }
  // 明治神宮：原宿駅の外側に、杜と木の大鳥居（外側の展示は-Zが線路側）
  {
    const shrine = atStation(named['原宿'], '明治神宮', W + 125);
    keepClear(shrine, named['原宿'].s, 150, 110, TRAIN_CLEAR);
    landmarkFoundation(shrine, 150, 110, '#7f9a6d');
    const cedar = toon('#8b6b4a');
    addBox(shrine, [8, 0.1, 70], [0, 0.06, -20], toon('#ddd6c3'), null, 0);
    for (const x of [-7, 7]) part(shrine, new THREE.CylinderGeometry(0.85, 0.95, 12, 12), cedar, [x, 6, -45], null, null, 0);
    addBox(shrine, [21, 1.3, 1.8], [0, 12.6, -45], cedar, null, 0);
    addBox(shrine, [17, 0.8, 1.1], [0, 10.2, -45], cedar, null, 0);
    addBox(shrine, [30, 6, 16], [0, 3, 30], toon('#7a5a3a'), null, 0);
    addBox(shrine, [36, 2, 22], [0, 7, 30], toon('#4f6f5f'), null, 0);
    forest(shrine, 80, 70, 50, (x, z) => Math.abs(x) < 9 && z < 10 || Math.abs(x) < 22 && Math.abs(z - 30) < 15);
  }
  // 遠景：上野の外側に東京スカイツリー、西南西に富士山（コース図鑑の全景の範囲には含めない）
  {
    const q = tp(named['上野'].s, W + 520), tree = new THREE.Group();
    tree.position.set(q.v.x, 0, q.v.z); tree.name = '東京スカイツリー'; world.add(tree);
    const steelWhite = toon('#dfe8ef'), deck = toon('#7f98a8');
    part(tree, new THREE.CylinderGeometry(5, 15, 140, 8), steelWhite, [0, 70, 0], null, null, 0);
    part(tree, new THREE.CylinderGeometry(10, 9, 7, 16), deck, [0, 140, 0], null, null, 0);
    part(tree, new THREE.CylinderGeometry(3, 5, 50, 8), steelWhite, [0, 168, 0], null, null, 0);
    part(tree, new THREE.CylinderGeometry(6, 6, 4, 16), deck, [0, 180, 0], null, null, 0);
    part(tree, new THREE.CylinderGeometry(0.8, 1.6, 40, 6), steelWhite, [0, 213, 0], null, null, 0);
    const west = tp(named['新宿'].s, 0).v.sub(tp(named['東京'].s, 0).v).setY(0).normalize();
    const south = tp(named['品川'].s, 0).v.sub(tp(named['池袋'].s, 0).v).setY(0).normalize();
    const f = west.multiplyScalar(0.9).add(south.multiplyScalar(0.45)).normalize().multiplyScalar(1750);
    railBackdropPeak(f.x, f.z, 560, 300, '#7088b5', 0.38);
  }
}
/* ---- 大阪環状線：大阪駅の大屋根と、大阪の名所 ---- */
function osakaLoopHouse(station, house, { block }) {
  if (station.name !== '大阪') return false;
  // ガラスの駅ビルの上に、ホームを覆う大屋根（かまぼこ形）を架ける
  block(house, 66, 12, 22, 0, 0, toon('#a9c0cb'));
  part(house, new THREE.CylinderGeometry(1, 1, 1, 24, 1, true, 0, Math.PI), toon('#d9e2e6', { side: THREE.DoubleSide }), [0, 12, 0], [12, 70, 12], [0, 0, Math.PI / 2], 0);
  for (const x of [-34, 34]) addBox(house, [1.2, 12, 24], [x, 6, 0], toon('#8e9aa1'), null, 0);
  return true;
}
function osakaLoopLandmark(station, { cream, glass, dark, block, forest, landmark }) {
  switch (station.name) {
    case '大阪': {
      // 2棟を最上部の展望台でつないだ高層ビル（展望台の中央に丸い吹き抜け）
      const sky = landmark(station, '梅田スカイビル', W + 130, 70, 40), wall = toon('#a9bfcc');
      for (const x of [-18, 18]) block(sky, 16, 70, 22, x, 0, wall);
      addBox(sky, [52, 7, 22], [0, 73.5, 0], wall, null, 0);
      part(sky, new THREE.TorusGeometry(9, 1.6, 8, 32), dark, [0, 66, -11.2], null, null, 0);
      addBox(sky, [20, 3, 8], [0, 44, 0], glass, null, 0); break;
    }
    case '京橋': {
      const city = landmark(station, '大阪ビジネスパーク・ツインタワー', -110, 70, 40), wall = toon('#c7c9c4');
      for (const x of [-17, 17]) {
        block(city, 22, 72, 24, x, 0, wall);
        addBox(city, [23, 3, 25], [x, 73.5, 0], dark, null, 0);
      }
      break;
    }
    case '大阪城公園': {
      // お濠と石垣の上に、白壁と緑の屋根を重ねた天守閣（内側の展示は+Zが線路側）
      const castle = landmark(station, '大阪城', -190, 210, 210, -30);
      const stone = toon('#a49f92'), white = toon('#f3f0e6'), roofG = toon('#3f8f7d'), gold = toon('#d6ad42');
      addBox(castle, [206, 0.2, 206], [0, 0.1, 0], toon('#4b8fb0'), null, 0);
      addBox(castle, [170, 3, 170], [0, 1.5, 0], stone, null, 0);
      addBox(castle, [166, 0.3, 166], [0, 3.15, 0], toon('#69a35c'), null, 0);
      addBox(castle, [32, 8, 28], [0, 7.3, 0], stone, null, 0);
      for (let i = 0; i < 5; i++) {
        const w = 24 - i * 3.6, d = 20 - i * 3, y = 11.3 + i * 6.2;
        addBox(castle, [w, 5, d], [0, y + 2.5, 0], white, null, 0);
        addBox(castle, [w + 3.2, 0.3, d + 3.2], [0, y + 4.9, 0], gold, null, 0);
        addBox(castle, [w + 3, 1.2, d + 3], [0, y + 5.6, 0], roofG, null, 0);
      }
      // 金の鯱
      for (const x of [-3, 3]) part(castle, SPH_LO, gold, [x, 43.2, 0], [0.9, 1.4, 0.9], null, 0);
      // 大手門へ続く橋
      addBox(castle, [10, 1.4, 22], [-40, 2.2, 92], stone, null, 0);
      forest(castle, 70, 78, 78, (x, z) => Math.abs(x) < 24 && Math.abs(z) < 22 || Math.abs(x + 40) < 8 && z > 60);
      break;
    }
    case '鶴橋': {
      // 焼肉の店が並ぶ商店街：色とりどりの低い店と赤い提灯
      const town = landmark(station, '鶴橋・焼肉の街', W + 105, 72, 34);
      ['#d7b28a', '#c98b6b', '#e2cfa8', '#b9a08a', '#d8a774'].forEach((c, i) => {
        const x = (i - 2) * 14;
        block(town, 12, 8, 14, x, 0, toon(c));
        addBox(town, [12.4, 0.5, 3], [x, 5.2, -8.2], toon(i % 2 ? '#c8332b' : '#e8e2d2'), [-0.3, 0, 0], 0);
        for (const dx of [-3.5, 3.5]) part(town, SPH_LO, glowMat('#ff5a3a', 1.8), [x + dx, 4.2, -8.6], [0.8, 1.1, 0.8], null, 0);
      });
      break;
    }
    case '天王寺': {
      // 段々に細くなる超高層ビル（このコースでいちばん高い建物）
      const tower = landmark(station, 'あべのハルカス', W + 125, 56, 46), wall = toon('#bfcbd2');
      block(tower, 46, 60, 38, 0, 0, wall);
      // 壁や窓が重ならないよう、上の段ほど少しずつ奥・左へ下げる
      block(tower, 38, 105, 30, -3, -2, wall);
      block(tower, 28, 140, 22, -6, -4, wall);
      addBox(tower, [29, 3, 23], [-6, 141.5, -4], glass, null, 0); break;
    }
    case '新今宮': {
      // 鉄骨の4本脚の上に塔と八角形の展望台。展望台の下の帯がゆっくり色を変える
      const tower = landmark(station, '通天閣', -100, 40, 40), steelM = toon('#c9c4b8'), deck = toon('#e8e3d4');
      for (const x of [-1, 1]) for (const z of [-1, 1]) {
        const a = new V3(x * 13, 0, z * 13), b = new V3(x * 5, 22, z * 5);
        const leg = new THREE.Mesh(BOX, steelM);
        leg.position.copy(a).add(b).multiplyScalar(0.5); leg.scale.set(1.8, a.distanceTo(b), 1.8);
        leg.quaternion.setFromUnitVectors(new V3(0, 1, 0), b.clone().sub(a).normalize()); tower.add(leg);
      }
      addBox(tower, [16, 3, 16], [0, 23.5, 0], deck, null, 0);
      addBox(tower, [9, 38, 9], [0, 44, 0], steelM, null, 0);
      part(tower, new THREE.CylinderGeometry(9, 9, 8, 8), deck, [0, 67, 0], null, null, 0);
      const neon = glowMat('#ffd36b', 1.6);
      part(tower, new THREE.CylinderGeometry(9.3, 9.3, 1.4, 8), neon, [0, 62.5, 0], null, null, 0);
      for (const z of [-4.6, 4.6]) addBox(tower, [7, 18, 0.3], [0, 42, z], glowMat('#7fd3ff', 1.4), null, 0);
      addBox(tower, [1, 12, 1], [0, 77, 0], steelM, null, 0);
      themeUpd.push(t => neon.color.setHSL((t * 0.04) % 1, 0.85, 0.6).multiplyScalar(1.6));
      break;
    }
    case '大正': {
      // 銀色の円盤を重ねたドーム球場
      const dome = landmark(station, '大阪ドーム', -125, 110, 110);
      addBox(dome, [108, 0.2, 108], [0, 0.1, 0], toon('#b5b8b3'), null, 0);
      for (let i = 0; i < 5; i++) {
        const r = 48 - i * 8;
        part(dome, new THREE.CylinderGeometry(r - 3, r, 5, 40), toon(i % 2 ? '#aeb6bd' : '#d3d9de'), [0, i * 5 + 2.5, 0], null, null, 0);
      }
      part(dome, SPH_LO, toon('#d3d9de'), [0, 25, 0], [14, 5, 14], null, 0); break;
    }
    case '弁天町': {
      // 港の大観覧車：輪だけがゆっくり回り、ゴンドラは水平を保つ（外側の展示は-Zが線路側）
      const park = landmark(station, '港の大観覧車', W + 120, 70, 30), frame = toon('#e6e8ea');
      for (const z of [-3, 3]) for (const x of [-1, 1]) {
        const a = new V3(x * 15, 0, z), b = new V3(0, 32, z);
        const leg = new THREE.Mesh(BOX, frame);
        leg.position.copy(a).add(b).multiplyScalar(0.5); leg.scale.set(1.2, a.distanceTo(b), 1.2);
        leg.quaternion.setFromUnitVectors(new V3(0, 1, 0), b.clone().sub(a).normalize()); park.add(leg);
      }
      const wheel = new THREE.Group(); wheel.userData.droneIgnore = true; wheel.position.set(0, 32, 0); park.add(wheel);
      part(wheel, new THREE.TorusGeometry(26, 0.8, 8, 48), frame, [0, 0, 0], null, null, 0);
      for (let i = 0; i < 12; i++) addBox(wheel, [0.4, 52, 0.4], [0, 0, 0], frame, [0, 0, i * Math.PI / 12], 0);
      const gondolas = [];
      for (let i = 0; i < 16; i++) {
        const a = i * Math.PI / 8, gon = addBox(wheel, [2.4, 2.6, 2.4], [Math.cos(a) * 26, Math.sin(a) * 26 - 1.6, 0], toon(['#e5584f', '#4f9de5', '#f2c230', '#6cc06a'][i % 4]), null, 0);
        gondolas.push(gon);
      }
      themeUpd.push((t, dt) => {
        wheel.rotation.z += Math.min(dt, 0.1) * 0.06;
        for (const gon of gondolas) gon.rotation.z = -wheel.rotation.z;
      });
      break;
    }
  }
}
function osakaLoopExtras({ named, atStation, keepClear, TRAIN_CLEAR }) {
  // 桜ノ宮：外側に大川と、両岸の桜並木（外側の展示は-Zが線路側）
  {
    const river = atStation(named['桜ノ宮'], '大川の桜並木', W + 70);
    keepClear(river, named['桜ノ宮'].s, 120, 44, TRAIN_CLEAR);
    landmarkFoundation(river, 120, 44, '#9fb39a');
    addBox(river, [118, 0.2, 18], [0, 0.1, 0], toon('#4b8fb0'), null, 0);
    const blossoms = [], cols = ['#f6b9cf', '#f9cfdd', '#eea3bf'].map(C);
    for (const z of [-14, 14]) for (let x = -54; x <= 54; x += 6) {
      const s = rand(3, 4.2);
      blossoms.push({ p: new V3(x + rand(-1, 1), s + 1.5, z + rand(-1.5, 1.5)), s: new V3(s, s * 0.85, s), c: cols[(Math.random() * cols.length) | 0] });
    }
    const mesh = inst(SPH_LO, toon('#ffffff'), blossoms, false); river.add(mesh);
    mesh.userData.fullCount = blossoms.length; themeDetails.push(mesh);
  }
  // 遠景：東に生駒の山並み（コース図鑑の全景の範囲には含めない）
  {
    const east = tp(named['鶴橋'].s, 0).v.sub(tp(named['弁天町'].s, 0).v).setY(0).normalize();
    const side = new V3(-east.z, 0, east.x);
    [[-760, 380, 150], [-330, 440, 190], [80, 420, 175], [480, 400, 160], [860, 360, 135]].forEach(([o, r, h]) => {
      const p = east.clone().multiplyScalar(1700).addScaledVector(side, o);
      railBackdropPeak(p.x, p.z, r, h, '#6d8794');
    });
  }
}
// 線路・駅・名所を避けて、格子状にビルと小さな公園を敷き詰める。主要駅の近くほど高層にする
function railLoopCity(line) {
  const samples = [];
  for (let s = 0; s < track.L; s += 8) samples.push(tp(s, W / 2));
  world.updateMatrixWorld(true);
  const keepOut = (world.userData.landmarks || []).map(g => new THREE.Box3().setFromObject(g).expandByScalar(6));
  const hubs = track.stations.filter(s => s.major).map(st => ({ v: tp(st.s, W + 40).v, k: line.hub[st.name] || 0.35 }));
  // 高さの段ごとにUVの繰り返し数を変え、窓の大きさがどの高さでもそろうようにする
  const HEIGHTS = [8, 14, 22, 34, 50, 75, 105], lists = HEIGHTS.map(() => []), parks = [], trees = [];
  const tones = ['#e7e3da', '#d5d8d6', '#c9ced3', '#e2d6c4', '#bfc9cf', '#d9cdbd', '#aeb8bf', '#f0ede6'].map(C);
  const glassy = ['#9fb6c6', '#b8c7d1', '#8fa3b3', '#c3ccd3'].map(C);
  const STEP = 30, R0 = track.extent + 260;
  for (let x = -R0; x <= R0; x += STEP) for (let z = -R0; z <= R0; z += STEP) {
    const px = x + rand(-4, 4), pz = z + rand(-4, 4);
    let best = Infinity, near = null;
    for (const q of samples) { const d = (q.v.x - px) ** 2 + (q.v.z - pz) ** 2; if (d < best) { best = d; near = q; } }
    const d = Math.sqrt(best), outside = (px - near.v.x) * near.n.x + (pz - near.v.z) * near.n.z > 0;
    // 内側は中継カメラ（線路から36m）より奥だけに建て、外側は電車線の先から260mまで
    if (d < (outside ? 34 : 62) || (outside && d > 260)) continue;
    const w = rand(13, 22), dp = rand(13, 22);
    if (keepOut.some(b => px + w / 2 > b.min.x && px - w / 2 < b.max.x && pz + dp / 2 > b.min.z && pz - dp / 2 < b.max.z)) continue;
    if (Math.random() < 0.05) {
      parks.push({ p: new V3(px, 0.05, pz), s: new V3(STEP - 6, 0.1, STEP - 6) });
      for (let i = 0; i < 4; i++) { const s = rand(2.5, 4); trees.push({ p: new V3(px + rand(-9, 9), s, pz + rand(-9, 9)), s: new V3(s, s, s) }); }
      continue;
    }
    let h = rand(6, 16);
    for (const hub of hubs) {
      const dd = Math.hypot(hub.v.x - px, hub.v.z - pz);
      if (dd < 320) h += hub.k * 85 * (1 - dd / 320) ** 2 * rand(0.5, 1.2);
    }
    if (d < 62) h = Math.min(h, 12);
    let k = 0; for (let i = 1; i < HEIGHTS.length; i++) if (Math.abs(Math.log(HEIGHTS[i] / h)) < Math.abs(Math.log(HEIGHTS[k] / h))) k = i;
    const hh = HEIGHTS[k] * rand(0.92, 1.08), palette = k >= 4 ? glassy : tones;
    lists[k].push({ p: new V3(px, 0, pz), s: new V3(w, hh, dp), c: palette[(Math.random() * palette.length) | 0] });
  }
  const winTex = ctex(64, 64, g => {
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, 64, 64);
    g.fillStyle = '#7d8f9c'; g.fillRect(9, 16, 46, 32);
    g.fillStyle = '#d4d6d4'; g.fillRect(0, 58, 64, 6);
  }, true);
  const side = toon('#ffffff', { map: winTex }), roof = toon('#c9c9c4');
  // 低画質では先頭の半分だけ描くので、並びを混ぜて間引いても街全体に散らばるようにする
  const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };
  HEIGHTS.forEach((height, k) => {
    if (!lists[k].length) return;
    const geo = new THREE.BoxGeometry(1, 1, 1); geo.translate(0, 0.5, 0);
    const uv = geo.attributes.uv, floors = Math.max(2, Math.round(height / 3.6));
    for (let i = 0; i < uv.count; i++) {
      const face = Math.floor(i / 4);
      if (face !== 2 && face !== 3) uv.setXY(i, uv.getX(i) * 5, uv.getY(i) * floors);
    }
    const mesh = new THREE.InstancedMesh(geo, [side, side, roof, roof, side, side], lists[k].length), m = new THREE.Matrix4(), q = new THREE.Quaternion();
    shuffle(lists[k]).forEach((b, i) => { m.compose(b.p, q, b.s); mesh.setMatrixAt(i, m); mesh.setColorAt(i, b.c); });
    mesh.name = `${line.name}・街並み`; mesh.userData.fullCount = lists[k].length; themeDetails.push(mesh); world.add(mesh);
  });
  if (parks.length) {
    inst(BOX, toon('#78a865'), parks, false).name = `${line.name}・公園`;
    const leaves = inst(SPH_LO, toon('#4f9450'), shuffle(trees), false);
    leaves.userData.fullCount = trees.length; themeDetails.push(leaves);
  }
}
// 環状線コースの路線設定：色・発着駅のずらし・電車・高層化する駅・発車メロディと、駅舎／名所の組み立て
const RAIL_LINES = {
  yamanote: { name: '山手線', color: '#78b844', shift: { 東京: 60, 神田: 10 },
    train: { body: '#d9dee1', band: '#5fb636', door: '#5fb636', doors: [-4.8, -1.6, 1.6, 4.8], cars: 6 },
    hub: { 新宿: 1, 東京: 0.9, 渋谷: 0.8, 池袋: 0.8, 品川: 0.75, 浜松町: 0.5 }, melody: [784, 988, 1175, 988, 1568],
    house: yamanoteHouse, landmark: yamanoteLandmark, extras: yamanoteExtras },
  // 323系らしい、ステンレスの車体にオレンジの帯とドア（片側3か所）の8両編成
  osakaLoop: { name: '大阪環状線', color: '#f0832a', shift: { 大阪: 60 },
    train: { body: '#d3d8dc', band: '#f0832a', door: '#f0832a', doors: [-4.2, 0, 4.2], cars: 8 },
    hub: { 大阪: 1, 天王寺: 0.85, 京橋: 0.6, 新今宮: 0.45, 鶴橋: 0.4 }, melody: [659, 880, 1047, 1319, 1175, 1047],
    house: osakaLoopHouse, landmark: osakaLoopLandmark, extras: osakaLoopExtras },
};
