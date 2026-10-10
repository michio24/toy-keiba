// 実在競馬場の代表物（トイモデル）と、内柵・発走ポケットなどの共通部品
'use strict';

/* ---- Real racecourse landmarks: static toy models, separate from race physics ---- */
function registerLandmark(g, name) {
  g.name = name;
  (world.userData.landmarks || (world.userData.landmarks = [])).push(g);
  return g;
}
function landmarkGroup(name, fraction = 0.5, lane = W + 88) {
  const f = tp(lerp(track.homeS0, track.homeS1, fraction), lane), g = new THREE.Group();
  g.position.set(f.v.x, track.groundH(f.v.x, f.v.z), f.v.z); g.rotation.y = -f.h; g.scale.z = track.sgn;
  world.add(g); return registerLandmark(g, name);
}
function landmarkFoundation(g, width, depth, color = '#cec6b6') {
  // Level the exhibit on a solid plinth, rather than letting a hillside cut through it.
  g.updateWorldMatrix(true, false);
  let low = Infinity, high = -Infinity;
  for (let x = -width / 2; x <= width / 2 + 0.01; x += width / Math.ceil(width / 3)) {
    for (let z = -depth / 2; z <= depth / 2 + 0.01; z += depth / Math.ceil(depth / 3)) {
      const p = g.localToWorld(new V3(x, 0, z)), y = track.groundH(p.x, p.z);
      low = Math.min(low, y); high = Math.max(high, y);
    }
  }
  g.position.y = high + 0.25;
  const height = high - low + 0.5;
  const base = addBox(g, [width, height, depth], [0, -height / 2, 0], toon(color), null, 0);
  base.name = 'landmark-foundation';
}
function landmarkFlowers(g, rx, rz, color = '#df7d9c') {
  const flowers = [];
  for (let i = 0; i < 32; i++) {
    const a = i / 32 * Math.PI * 2;
    flowers.push({ p: new V3(Math.cos(a) * rx, 0.6, Math.sin(a) * rz), s: new V3(0.8, 0.5, 0.8) });
  }
  const mesh = inst(SPH_LO, toon(color), flowers, false); g.add(mesh);
  mesh.userData.fullCount = flowers.length; themeDetails.push(mesh);
}
function landmarkHorse(parent, position, pose = 'walk', color = '#57776b', scale = 2.5, centaur = false) {
  const g = new THREE.Group(); g.position.set(...position); g.scale.setScalar(scale); parent.add(g);
  const bronze = toon(color), stone = toon('#d8d0bc');
  addBox(g, [5.6, 0.7, 3], [0, 0.35, 0], stone, null, 0);
  const body = new THREE.Group(); body.position.y = 0.7; g.add(body);
  if (pose === 'rear') { body.position.y += 0.6; body.rotation.z = 0.5; }
  if (pose === 'gallop') addBox(g, [0.3, 2.4, 0.3], [0, 1.9, 0], bronze, null, 0);
  part(body, SPH_LO, bronze, [0, 2.3, 0], [2.1, 0.85, 0.75], null, 0);
  for (const x of [-1.25, 1.25]) for (const z of [-0.48, 0.48]) {
    const angle = pose === 'gallop' ? (x > 0 ? -0.8 : 0.8) : (z > 0 ? 0.2 : -0.2);
    part(body, BOX, bronze, [x, 1.1, z], [0.32, 2.2, 0.32], [0, 0, angle], 0);
  }
  part(body, CONE, bronze, [-2, 1.9, 0], [0.3, 1.8, 0.3], [0, 0, -0.45], 0);
  if (centaur) {
    part(body, SPH_LO, bronze, [1.25, 3.5, 0], [0.6, 1.2, 0.55], null, 0);
    part(body, SPH_LO, bronze, [1.35, 5, 0], [0.43, 0.5, 0.43], null, 0);
    for (const z of [-0.65, 0.65]) part(body, BOX, bronze, [1.8, 3.9, z], [1.5, 0.3, 0.3], [0, 0, 0.45], 0);
  } else {
    part(body, SPH_LO, bronze, [1.65, 3.15, 0], [0.65, 1.2, 0.6], [0, 0, 0.35], 0);
    part(body, SPH_LO, bronze, [2.15, 4, 0], [0.9, 0.42, 0.45], [0, 0, -0.15], 0);
    for (const z of [-0.25, 0.25]) part(body, CONE, bronze, [1.8, 4.6, z], [0.16, 0.5, 0.16], null, 0);
  }
  return g;
}
function landmarkStatue(name, fraction, pose, color) {
  const g = landmarkGroup(name, fraction);
  landmarkHorse(g, [0, 0, 0], pose, color); landmarkFoundation(g, 18, 12);
  return g;
}
function decorLandmarkStand(stand, len, z0, roof, sc0) {
  const theme = track.def.theme;
  if (theme === 'boxHill') return decorBoxHillStand(stand, len, z0, roof);
  if (theme === 'clockwork') return decorClockworkStand(stand, len, z0, roof);
  if (theme === 'skyGarden') return decorSkyGardenStand(stand, len, z0, roof);
  if (theme === 'pearlOcean') return decorPearlOceanStand(stand, len, z0, roof);
  if (theme === 'dragonCrater') return decorDragonCraterStand(stand, len, z0, roof);
  if (theme === 'neon') return decorNeonStand(stand, len, z0, roof);
  if (theme === 'sakura') return decorSakuraStand(stand, len, z0, roof);
  if (theme === 'aurora') return decorAuroraStand(stand, len, z0, roof);
  if (theme === 'candy') return decorCandyStand(stand, len, z0, roof);
  if (theme === 'dune') return decorDuneStand(stand, len, z0, roof);
  if (theme === 'moonForest') return decorMoonForestStand(stand, len, z0, roof);
  if (!['sapporo', 'niigata', 'tokyo', 'nakayama', 'kyoto', 'hanshin', 'chukyo', 'longchamp', 'churchill'].includes(theme)) return;
  const g = new THREE.Group(); stand.add(g); registerLandmark(g, theme + '-stand');
  const cream = theme === 'longchamp' ? null : toon('#eee8d8'), glass = theme === 'churchill' ? null : toon('#7ca6b9');
  const gold = theme === 'longchamp' || theme === 'churchill' ? toon('#ad8a51') : null;
  const box = (size, p, mat = cream, rot) => addBox(g, size, p, mat, rot, 0);
  if (theme === 'tokyo') {
    roof.visible = false;
    // フジビュースタンド：ゴール寄りの大きなスタンド。後ろへ下がりながら積み重なるガラス張りの階と、観覧席の上へ大きく張り出す屋根
    const mx = -len / 2 + len * 0.26, fw = len / 2 - mx, fc = (mx + len / 2) / 2;
    for (let i = 0; i < 5; i++) {
      box([fw - 2, 2.8, 15 - i], [fc, 12.6 + i * 3.4, z0 + 13 + i * 0.9], glass);
      box([fw + 2, 0.6, 17 - i], [fc, 14.3 + i * 3.4, z0 + 13 + i * 0.9]);
    }
    box([fw + 10, 1.2, 38], [fc, 30.5, z0 + 7]);
    for (let x = mx + 6; x <= len / 2 - 4; x += 16) box([0.8, 19, 0.8], [x, 21, z0 + 5.6]);
    // メモリアル60スタンド：4コーナー寄りに並ぶ、ひと回り低いスタンド
    const m = new THREE.Group(); g.add(m); registerLandmark(m, 'メモリアル60スタンド');
    const mw = mx + len / 2, mc = -len / 2 + mw / 2, wall = toon('#e6dfcf'), mglass = toon('#8fb3c2');
    for (let i = 0; i < 3; i++) {
      addBox(m, [mw - 4, 2.8, 14], [mc, 12.6 + i * 3.4, z0 + 13], mglass, null, 0);
      addBox(m, [mw, 0.6, 16], [mc, 14.3 + i * 3.4, z0 + 13], wall, null, 0);
    }
    addBox(m, [mw + 4, 1, 30], [mc, 23, z0 + 8], wall, [0.05, 0, 0], 0);
  } else if (theme === 'nakayama') {
    roof.visible = false;
    // 中山のメインスタンド：横に長いガラス張りの階が重なり、平らな大屋根が観覧席の上へ張り出す
    for (let i = 0; i < 4; i++) {
      box([len - 6, 2.8, 14], [0, 12.6 + i * 3.4, z0 + 14], glass);
      box([len + 2, 0.6, 16 + i * 0.5], [0, 14.3 + i * 3.4, z0 + 14 - i * 0.25]);
    }
    box([len + 8, 1.2, 36], [0, 27.4, z0 + 8]);
    for (let x = -len / 2 + 8; x <= len / 2 - 8; x += 20) box([0.8, 15, 0.8], [x, 19.5, z0 + 4]);
    // 大屋根の上一面に並ぶ太陽光パネル（衛星写真で青く見える）
    const solar = toon('#2f4f86');
    for (let x = -len / 2 + 4; x < len / 2 - 4; x += 9) for (const z of [-4, 4, 12, 20]) box([8, 0.25, 7], [x + 4, 28.15, z0 + z], solar);
  } else if (theme === 'kyoto') {
    roof.visible = false;
    // 地図の実寸（x：4コーナー出口から直線の向き）をスタンドの座標へ。奥行きはコースの中心線からの外向きの距離
    const k = track.def.scale, lx = x => x * k - sc0, white = toon('#f4f2ec'), steel = toon('#9aa3a8'), wood = toon('#b98a5a'), terrace = toon('#7fa65a');
    // 斜めの部材：p0からp1へ向けて伸ばした細い角材（スタンドのローカルのx-y面内）
    const strut = (x0, y0, x1, y1, z, t = 0.45) => box([t, Math.hypot(x1 - x0, y1 - y0), t], [(x0 + x1) / 2, (y0 + y1) / 2, z], steel, [0, 0, -Math.atan2(x1 - x0, y1 - y0)]);
    // ゴールサイド（2023年）：6階建て・高さ約35m。各階の床が白い水平の帯になって重なり、
    // 層間トラスで支えた屋根が観覧席の上へ大きく張り出す。ゴール板の前から1コーナー寄りの端まで
    const ga = lx(229), gb = lx(498), gw = gb - ga, gc = (ga + gb) / 2;
    box([gw, 9, 16], [gc, 4.5, 52], white);
    for (let i = 0; i < 6; i++) {
      const y = 9 + i * 3.6;
      box([gw - 4, 2.9, 20], [gc, y + 1.5, 46 - i * 0.4], glass);
      box([gw + 2, 0.7, 25 - i * 0.6], [gc, y + 3.2, 45], white);
    }
    const ry = 31.2;
    box([gw + 8, 1.4, 36], [gc, ry, 41], white);
    box([gw + 8, 0.4, 0.5], [gc, ry - 4.6, 23.2], steel);
    for (let x = ga - 2; x < gb + 2; x += 9) { strut(x, ry - 4.6, x + 4.5, ry - 0.7, 23.2); strut(x + 4.5, ry - 0.7, x + 9, ry - 4.6, 23.2); }
    for (let x = ga + 6; x <= gb - 6; x += (gw - 12) / 6) box([1, 22, 1], [x, 20, 57], steel);
    // スタンドの裏（パドック側）：天然木と鉄骨の大庇と、パドックへ下りていく弓なりの階段状の緑化テラス
    const pa = lx(290), pb = lx(410);
    box([pb - pa + 30, 0.9, 12], [(pa + pb) / 2, 17, 63], wood);
    for (let x = pa - 12; x <= pb + 12; x += 6) box([0.5, 8, 0.5], [x, 13, 68.5], wood);
    for (let j = 0; j < 5; j++) {
      const w = (pb - pa) * (1 - j * 0.12), h = 8.5 - j * 1.6, z = 60 + j * 3.2;
      box([w, h, 3.2], [(pa + pb) / 2 + j * 1.5, h / 2, z], white); box([w - 1, 0.5, 2.6], [(pa + pb) / 2 + j * 1.5, h + 0.2, z], terrace);
    }
    // ステーションサイド（旧ビッグスワン、1999年・2023年改修）：淀駅寄りの棟。白鳥が翼を広げたような、前へせり上がる弓なりの白い大屋根
    const sa = lx(116), sb = lx(229), sw = sb - sa, sx = (sa + sb) / 2;
    box([sw, 9, 14], [sx, 4.5, 52], white);
    for (let i = 0; i < 5; i++) {
      box([sw - 4, 2.8, 18], [sx, 10.4 + i * 3.4, 47], glass);
      box([sw, 0.6, 21], [sx, 12.1 + i * 3.4, 46.5], white);
    }
    let prev = null;
    for (let j = 0; j <= 12; j++) {
      const t = j / 12, p = [62 - t * 44, 25 + Math.sin(t * Math.PI * 0.62) * 7];
      if (prev) { const dz = p[0] - prev[0], dy = p[1] - prev[1]; box([sw + 6, 0.8, Math.hypot(dz, dy) + 0.4], [sx, (p[1] + prev[1]) / 2, (p[0] + prev[0]) / 2], white, [Math.atan2(-dy, dz), 0, 0]); }
      prev = p;
    }
    for (let x = sa + 6; x <= sb - 6; x += (sw - 12) / 3) box([1, 18, 1], [x, 16, 58], steel);
    // スタンド裏の円い階段塔（棟の裏につながる）
    box([sw * 0.5, 14, 18], [lx(178), 7, 68], white);
    for (const [x, z, r] of [[153, -160, 2.6], [178, -164, 4], [204, -160, 2.4]]) part(g, new THREE.CylinderGeometry(r, r, 17, 20), white, [lx(x), 8.5, -z * k], null, null, 0);
  } else if (theme === 'longchamp') {
    roof.visible = false;
    // パリロンシャンのメインスタンド（ドミニク・ペロー設計、2018年）：4層の階が左右に少しずつずれて傾きながら重なる。
    // 床の先端は金色の金属メッシュで包まれ、その奥にガラス張りの階。最上階の屋上はレストランのテラス
    const deck = toon('#f4efe4'), meshTex = ctex(256, 32, c => { c.fillStyle = '#6f5630'; c.fillRect(0, 0, 256, 32); c.fillStyle = '#e4c071'; for (let x = 0; x < 256; x += 8) c.fillRect(x, 0, 5, 32); }, true);
    meshTex.repeat.set(len / 12, 1);
    const mesh = toon('#ffffff', { map: meshTex });
    let top = null;
    for (let i = 0; i < 4; i++) {
      const w = len + 12 - i * 16, x = (i % 2 ? 7 : -7) - i * 2, y = 11 + i * 4.8, z = z0 + 9 + i * 2.4, tilt = (i % 2 ? -1 : 1) * 0.03;
      box([w, 0.7, 26], [x, y, z], deck, [tilt, 0, 0]);
      box([w - 8, 3.4, 16], [x, y + 2.1, z + 5], glass, [tilt, 0, 0]);
      for (const dz of [-13, 13]) box([w, 1.4, 0.5], [x, y + 0.1, z + dz], mesh, [tilt, 0, 0]);
      top = { w, x, y, z };
    }
    box([top.w - 8, 0.5, 16], [top.x, top.y + 4, top.z + 5], deck);
    for (let x = top.x - top.w / 2 + 14; x < top.x + top.w / 2 - 10; x += 22) {
      box([12, 1, 2.2], [x, top.y + 4.7, top.z + 11], toon('#5f8f4a'));
      part(g, new THREE.ConeGeometry(2.6, 1.2, 10), toon('#f7f3ea'), [x + 6, top.y + 7, top.z + 4], null, null, 0);
      box([0.2, 2.6, 0.2], [x + 6, top.y + 5.4, top.z + 4], gold);
    }
  } else if (theme === 'chukyo') {
    roof.visible = false;
    // 地図の実寸（x：4コーナー出口から直線の向き、z：コースの内側が正）をスタンドの座標へ。奥行きはコースの中心線からの外向きの距離
    const k = track.def.scale, lx = x => x * k - sc0, lz = z => -z * k, white = toon('#f4f3ee'), steel = toon('#9aa3a8'), seat = toon('#4f7fb5');
    // ペガサス（2012年）：ゴール前の4階建て。2階から上も屋外の観覧席が段々に重なり、翼を広げたような白い大屋根をのせる
    const pa = lx(365), pb = lx(486), pw = pb - pa, pc = (pa + pb) / 2;
    box([pw, 9, 8], [pc, 3.5, 48], white); box([pw, 10, 4], [pc, -5.5, 34], white);
    for (let i = 0; i < 3; i++) {
      const y = 9 + i * 4.4, zf = 33 + i * 2.4;
      box([pw + 2, 0.7, 50 - zf], [pc, y, (zf + 50) / 2], white);
      for (let j = 0; j < 3; j++) box([pw - 3, 0.5 + j * 0.5, 1.7], [pc, y + 0.5 + j * 0.25, zf + 1.6 + j * 1.7], seat);
      box([pw - 1, 1, 0.2], [pc, y + 0.9, zf + 0.2], glass);
      box([pw - 4, 3.6, 0.4], [pc, y + 2.2, zf + 7.4], glass);
    }
    // 翼の大屋根：中央からゴール側と1コーナー側へ、端ほど高く反り上がる2枚の屋根
    for (const s of [-1, 1]) box([pw / 2 + 4, 0.9, 26], [pc + s * (pw / 4 + 1), 25.5, 42], white, [-0.06, 0, -s * 0.09]);
    for (let x = pa + 4; x <= pb - 4; x += (pw - 8) / 5) box([0.9, 26, 0.9], [x, 12, 50.5], steel);
    // スタンドの裏で楕円のパドックを馬蹄形に囲む棟（1コーナー側だけ開いている）。内側は段々の観覧席
    { const pg = new THREE.Group(); pg.position.set(lx(419), 0, lz(-127)); pg.rotation.y = 0.47; g.add(pg); registerLandmark(pg, 'パドック');
      part(pg, new THREE.CircleGeometry(1, 48), toon('#6fbf5c'), [0, 0.12, 0], [12.5, 6.5, 1], [-Math.PI / 2, 0, 0], 0);
      part(pg, new THREE.RingGeometry(0.82, 1, 48), toon('#d9c7a0'), [0, 0.14, 0], [15, 8.5, 1], [-Math.PI / 2, 0, 0], 0);
      addBox(pg, [36, 0.3, 22], [0, -0.05, 0], toon('#cfc8b8'), null, 0); addBox(pg, [50, 10, 38], [0, -5.2, 0], white, null, 0);
      const steps = [], walls = [], bands = [];
      for (let j = 0; j < 4; j++) {
        const rx = 16 + j * 1.7, rz = 10 + j * 1.7, h = 1 + j * 1.1, n = 36;
        for (let i = 0; i < n; i++) {
          const a0 = 0.45 + (i / n) * (Math.PI * 2 - 0.9), a1 = 0.45 + ((i + 1) / n) * (Math.PI * 2 - 0.9);
          const p0 = [Math.cos(a0) * rx, Math.sin(a0) * rz], p1 = [Math.cos(a1) * rx, Math.sin(a1) * rz], dx = p1[0] - p0[0], dz = p1[1] - p0[1];
          steps.push({ p: new V3((p0[0] + p1[0]) / 2, h / 2, (p0[1] + p1[1]) / 2), s: new V3(Math.hypot(dx, dz) + 0.3, h, 1.8), r: [0, -Math.atan2(dz, dx), 0] });
          if (j === 3) { const q0 = [p0[0] * 1.12, p0[1] * 1.16], q1 = [p1[0] * 1.12, p1[1] * 1.16], m = [(q0[0] + q1[0]) / 2, (q0[1] + q1[1]) / 2], L = Math.hypot(q1[0] - q0[0], q1[1] - q0[1]) + 0.3, ry = -Math.atan2(q1[1] - q0[1], q1[0] - q0[0]);
            walls.push({ p: new V3(m[0], 5, m[1]), s: new V3(L, 14, 2), r: [0, ry, 0] });
            // 外壁の窓の帯（2階・3階）
            for (const y of [6.5, 10]) bands.push({ p: new V3(m[0], y, m[1]), s: new V3(L, 1.8, 2.3), r: [0, ry, 0] }); }
        }
      }
      pg.add(inst(BOX, seat, steps, false), inst(BOX, white, walls, false), inst(BOX, glass, bands, false));
      // 周回する出走馬：ゆっくりと楕円を歩く
      const walkers = [];
      for (let i = 0; i < 5; i++) { const h = landmarkHorse(pg, [0, 0.15, 0], 'walk', ['#6b4a35', '#3b2a20', '#8a5a3a'][i % 3], 0.45); h.children[0].visible = false; walkers.push(h); }
      walkers.forEach(h => { h.userData.droneIgnore = true; });
      themeUpd.push(t => walkers.forEach((h, i) => { const a = t * 0.08 + i * Math.PI * 2 / 5, x = Math.cos(a) * 13.6, z = Math.sin(a) * 7.6; h.position.set(x, 0.15, z); h.rotation.y = -Math.atan2(Math.cos(a) * 7.6, -Math.sin(a) * 13.6); })); }
    // ツインハット：1コーナー寄りの6階建ての屋内スタンド。2本の円筒の塔の上に、つばの広い帽子のような屋根がのる
    const ta = lx(487), tb = lx(567), tw = tb - ta, tc = (ta + tb) / 2;
    box([tw, 9, 12], [tc, 3.5, 50], white); box([tw, 10, 4], [tc, -5.5, 44], white);
    for (let i = 0; i < 5; i++) {
      const y = 9 + i * 3.7;
      box([tw - 3, 3, 13], [tc, y + 1.8, 47 - i * 0.5], glass);
      box([tw + 1, 0.6, 15], [tc, y + 3.5, 47 - i * 0.5], white);
    }
    box([tw + 2, 1.2, 18], [tc, 28.5, 48], white);
    const hat = toon('#3f6f86'), band = toon('#f4f3ee');
    for (const [x, z, r] of [[578, -98, 6.4], [503, -123, 6.8]]) {
      part(g, new THREE.CylinderGeometry(r, r, 38, 24), white, [lx(x), 13, lz(z)], null, null, 0);
      for (let y = 10; y <= 28; y += 3.7) part(g, new THREE.CylinderGeometry(r + 0.15, r + 0.15, 1.6, 24), glass, [lx(x), y, lz(z)], null, null, 0);
      part(g, new THREE.CylinderGeometry(r * 1.75, r * 1.8, 0.9, 32), hat, [lx(x), 32.4, lz(z)], null, null, 0);
      part(g, new THREE.CylinderGeometry(r * 0.85, r * 0.95, 4, 24), hat, [lx(x), 34.8, lz(z)], null, null, 0);
      part(g, new THREE.CylinderGeometry(r * 0.96, r * 0.96, 1, 24), band, [lx(x), 33.4, lz(z)], null, null, 0);
      part(g, new THREE.SphereGeometry(r * 0.85, 24, 8, 0, Math.PI * 2, 0, Math.PI / 2), hat, [lx(x), 36.8, lz(z)], [1, 0.45, 1], null, 0);
    }
  } else if (theme === 'niigata') {
    roof.visible = false;
    const white = toon('#f3f1ea'), steel = toon('#b9bec4');
    // アイビススタンド（4コーナー寄り）：横に長く低めの棟。ガラス張りの階が重なり、4コーナー側の端の屋上に丸い飾り
    const iw = len * 0.5, ix = -len / 2 + iw / 2;
    for (let i = 0; i < 4; i++) {
      box([iw - 4, 2.6, 14], [ix, 10.4 + i * 3.2, z0 + 15], glass);
      box([iw, 0.6, 16], [ix, 12 + i * 3.2, z0 + 15], white);
    }
    box([iw + 2, 1, 21], [ix, 23.4, z0 + 12], white);
    { const x = -len / 2 + 9, ring = new THREE.Group(); ring.position.set(x, 29.5, z0 + 16); g.add(ring);
      part(ring, new THREE.TorusGeometry(5, 0.45, 8, 36), white, [0, 0, 0], null, null, 0);
      part(ring, new THREE.CircleGeometry(4.6, 36), glass, [0, 0, -0.1], null, null, 0);
      for (let i = 0; i < 6; i++) addBox(ring, [0.25, 9.4, 0.25], [0, 0, 0.05], steel, [0, 0, i * Math.PI / 6], 0);
      box([4, 1.6, 4], [x, 24.6, z0 + 16], white); }
    // NiLS21スタンド（ゴール側、2001年築）：高い棟に観覧席の上へ大きく張り出す平らな屋根。「Niigata Long Straight」の略
    const nw = len * 0.46, nx = len / 2 - nw / 2;
    for (let i = 0; i < 5; i++) {
      box([nw - 6, 2.8, 15 - i * 0.6], [nx, 10.4 + i * 3.4, z0 + 14 + i * 0.3], glass);
      box([nw, 0.6, 17 - i * 0.6], [nx, 12.1 + i * 3.4, z0 + 14 + i * 0.3], white);
    }
    box([nw + 10, 1.4, 42], [nx, 30, z0 + 6], white, [0.05, 0, 0]);
    box([nw + 10, 0.5, 0.6], [nx, 30.9, z0 - 15], steel, [0.05, 0, 0]);
    for (let x = nx - nw / 2 + 6; x <= nx + nw / 2 - 6; x += (nw - 12) / 4) box([1.2, 12, 1.2], [x, 24, z0 + 24], steel);
  } else if (theme === 'hanshin') {
    roof.visible = false;
    // 地図の実寸（x：4コーナー出口から直線の向き、z：コースの内側が正）をスタンドの座標へ。奥行きはコースの中心線からの外向きの距離
    const k = track.def.scale, lx = x => x * k - sc0, lz = z => -z * k, white = toon('#f4f3ee'), steel = toon('#9aa3a8');
    // グランドスタンド（地下1階・地上7階、高さ39.9m）：1階の外の観覧席の上に、前面ガラス張りの2〜6階が少しずつ後ろへ下がりながら重なり、屋上に薄い屋根
    const ma = lx(253), mb = lx(579), mw = mb - ma, mc = (ma + mb) / 2, back = lz(-137);
    box([mw, 10, back - 44], [mc, 5, (44 + back) / 2], white);
    for (let i = 0; i < 5; i++) {
      const y = 10 + i * 3.8, zf = 44 + i * 1.5;
      box([mw + 1, 0.6, back - zf + 1], [mc, y, (zf + back) / 2], white);
      box([mw - 2, 3.1, 0.4], [mc, y + 1.9, zf], glass);
    }
    box([mw - 10, 4, back - 54], [mc, 31, (54 + back) / 2], white);
    box([mw + 6, 0.8, back - 38], [mc, 33.4, (38 + back) / 2], white, [-0.03, 0, 0]);
    for (let x = ma + 8; x <= mb - 7; x += (mw - 16) / 8) box([0.8, 23, 0.8], [x, 21.5, 43.4], steel);
    // 4コーナー寄りの端は1段低い棟、1コーナー寄りの端は正門側へ回り込む棟
    box([lx(272) - lx(253) + 2, 16, lz(-137) - lz(-66)], [(lx(253) + lx(272)) / 2, 8, (lz(-66) + lz(-137)) / 2], white);
    box([lx(579) - lx(540), 22, lz(-110) - lz(-60)], [(lx(540) + lx(579)) / 2, 11, (lz(-60) + lz(-110)) / 2], white);
  } else if (theme === 'sapporo') {
    roof.visible = false;
    // 地図の実寸（x：4コーナー出口から直線の向き、z：コースの内側が正）をスタンドの座標へ。奥行きはコースの中心線からの外向きの距離
    const k = track.def.scale, lx = x => x * k - sc0, lz = z => -z * k, white = toon('#f4f3ee'), steel = toon('#9aa3a8'), seat = toon('#3f6fa8'), wood = toon('#b98a5a');
    // 本館（2014年）：ゴール前の5階建て。1〜2階の外の観覧席の上へ、3階から上の観覧席が段々に張り出し、薄い大屋根をのせる
    const ma = lx(146), mb = lx(280), mw = mb - ma, mc = (ma + mb) / 2;
    box([mw, 10, 12], [mc, 5, 44], white);
    for (let i = 0; i < 3; i++) {
      const y = 10 + i * 4.4, zf = 29 + i * 2.6;
      box([mw + 1, 0.7, 50 - zf], [mc, y, (zf + 50) / 2], white);
      for (let j = 0; j < 2; j++) box([mw - 3, 0.5 + j * 0.5, 1.7], [mc, y + 0.5 + j * 0.25, zf + 1.6 + j * 1.7], seat);
      box([mw - 1, 1, 0.2], [mc, y + 0.9, zf + 0.2], glass);
      box([mw - 2, 3.6, 0.4], [mc, y + 2.2, zf + 5.6], glass);
    }
    box([mw + 4, 0.8, 30], [mc, 24.6, 37], white, [-0.04, 0, 0]);
    box([mw + 4, 0.5, 0.6], [mc, 25.2, 22.2], steel, [-0.04, 0, 0]);
    for (let x = ma + 6; x <= mb - 6; x += (mw - 12) / 6) box([0.9, 24, 0.9], [x, 12, 50.5], steel);
    // 4コーナー側の端の白い塔：コース側の角はガラス張り
    { const ta = lx(127), tw = ma - ta, tc = (ta + ma) / 2;
      box([tw, 30, 24], [tc, 15, 38], white);
      box([tw - 1, 22, 3], [tc + 0.5, 17, 26], glass);
      box([tw + 1, 0.8, 26], [tc, 30.2, 38], white); }
    // もいわテラス：4コーナー側の棟の2階の屋上。長さ120mのウッドデッキから藻岩山と札幌の街並み、コース全体を見渡す
    { const t = new THREE.Group(); g.add(t); registerLandmark(t, 'もいわテラス');
      const ta = lx(5), tb = lx(127), tw = tb - ta, tc = (ta + tb) / 2, tb2 = (s, p, m = white) => addBox(t, s, p, m, null, 0);
      tb2([tw, 8, 17], [tc, 4, 39.5]); tb2([tw - 2, 5, 0.4], [tc, 4, 30.9], glass);
      tb2([tw, 0.4, 16.6], [tc, 8.2, 39.5], wood);
      tb2([tw, 1.1, 0.15], [tc, 9, 31.2], glass); tb2([tw, 0.15, 0.3], [tc, 9.6, 31.2], steel);
      const pots = [], tables = [];
      for (let x = ta + 4; x <= tb - 4; x += 6) { pots.push({ p: new V3(x, 9, 33), s: new V3(1.4, 1.2, 1.4) }); if ((x - ta) % 12 < 6) tables.push({ p: new V3(x + 3, 9.1, 40), s: new V3(1.6, 0.8, 1.6) }); }
      t.add(inst(BOX, toon('#5d5a57'), pots, false), inst(SPH_LO, toon('#4f8f3a'), pots.map(o => ({ p: o.p.clone().setY(10.3), s: new V3(0.9, 0.9, 0.9) })), false), inst(BOX, wood, tables, false));
      // ファンファーレホール：テラスの奥の天井の高い屋内広場。弓なりの屋根の下に大きなガラス窓
      const hall = new THREE.Mesh(new THREE.CylinderGeometry(8, 8, tw - 6, 24, 1, false, 0, Math.PI), white);
      hall.rotation.z = Math.PI / 2; hall.position.set(tc, 7, 56); hall.castShadow = true; t.add(hall);
      tb2([tw - 6, 7, 16], [tc, 3.5, 56]); tb2([tw - 8, 5, 16.4], [tc, 3.8, 56], glass); }
    // ターフサイドシート：ゴール前の外ラチ沿い、走る馬を間近で見る低い観覧席
    { const t = new THREE.Group(); g.add(t); registerLandmark(t, 'ターフサイドシート');
      for (let j = 0; j < 3; j++) addBox(t, [56, 0.5 + j * 0.4, 1.2], [lx(200), 0.25 + j * 0.2, 15 + j * 1.3], seat, null, 0); }
    // パドック：本館の裏の楕円の周回路。観客は周りの段から見下ろし、低い視線のダッグアウトパドックもある。奥（1コーナー側）に電光掲示板
    { const pg = new THREE.Group(); pg.position.set(lx(193), 0, lz(-128)); g.add(pg); registerLandmark(pg, 'パドック');
      part(pg, new THREE.CircleGeometry(1, 48), toon('#6fbf5c'), [0, 0.12, 0], [10, 4.4, 1], [-Math.PI / 2, 0, 0], 0);
      part(pg, new THREE.RingGeometry(0.76, 1, 48), toon('#b9674a'), [0, 0.14, 0], [12.6, 6.6, 1], [-Math.PI / 2, 0, 0], 0);
      const rail = [];
      for (let i = 0; i < 48; i++) { const a = i / 48 * Math.PI * 2; rail.push(new V3(Math.cos(a) * 12.9, 1.1, Math.sin(a) * 6.9)); }
      pg.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(rail, true), 96, 0.12, 4, true), toon('#f4f2ea')));
      const steps = [];
      for (let j = 0; j < 3; j++) for (let i = 0; i < 40; i++) {
        const a0 = i / 40 * Math.PI * 2, a1 = (i + 1) / 40 * Math.PI * 2, rx = 14 + j * 1.4, rz = 8 + j * 1.4, h = 0.6 + j * 0.6;
        const p0 = [Math.cos(a0) * rx, Math.sin(a0) * rz], p1 = [Math.cos(a1) * rx, Math.sin(a1) * rz];
        steps.push({ p: new V3((p0[0] + p1[0]) / 2, h / 2, (p0[1] + p1[1]) / 2), s: new V3(Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) + 0.3, h, 1.5), r: [0, -Math.atan2(p1[1] - p0[1], p1[0] - p0[0]), 0] });
      }
      pg.add(inst(BOX, toon('#d8d2c4'), steps, false));
      const frame = toon('#231a3d');
      addBox(pg, [0.8, 6, 9], [19.5, 6, 0], frame, null, 0); for (const z of [-3, 3]) addBox(pg, [0.6, 4, 0.6], [19.5, 2, z], frame, null, 0);
      const scr = new THREE.Mesh(new THREE.PlaneGeometry(8.4, 5.4), glowMat('#ffd27a', 1.1)); scr.position.set(19.05, 6, 0); scr.rotation.y = -Math.PI / 2; pg.add(scr);
      const walkers = [];
      for (let i = 0; i < 5; i++) { const h = landmarkHorse(pg, [0, 0.15, 0], 'walk', ['#6b4a35', '#3b2a20', '#8a5a3a'][i % 3], 0.45); h.children[0].visible = false; walkers.push(h); }
      walkers.forEach(h => { h.userData.droneIgnore = true; });
      themeUpd.push(t => walkers.forEach((h, i) => { const a = t * 0.08 + i * Math.PI * 2 / 5, x = Math.cos(a) * 11.3, z = Math.sin(a) * 5.5; h.position.set(x, 0.15, z); h.rotation.y = -Math.atan2(Math.cos(a) * 5.5, -Math.sin(a) * 11.3); })); }
    // パドックの1コーナー側を囲む別棟
    box([lx(280) - lx(233), 9, lz(-152) - lz(-107)], [(lx(233) + lx(280)) / 2, 4.5, (lz(-107) + lz(-152)) / 2], white);
    box([lx(233) - lx(197), 6, 8], [(lx(197) + lx(233)) / 2, 3, lz(-158)], white);
  } else if (theme === 'churchill') {
    roof.visible = false;
    // 地図の実寸（x：4コーナー出口から直線の向き）をスタンドの座標へ
    const k = track.def.scale, lx = x => x * k - sc0, white = toon('#f4f0e4'), green = toon('#3f5f52'), slate = toon('#57625f'), suite = toon('#7fa3b5'), seat = toon('#2f6a4f');
    // グランドスタンドとクラブハウス：低い屋外席の上に、ガラス張りの特別席（ジョッキークラブ・スイートなど）の階が重なり、緑の鉄骨の大屋根がかかる
    for (let i = 0; i < 3; i++) {
      box([len - 8, 2.8, 13], [0, 12.6 + i * 3.4, z0 + 16 + i * 1.2], suite);
      box([len, 0.6, 16], [0, 14.3 + i * 3.4, z0 + 15 + i * 1.2], white);
    }
    box([len + 4, 1, 34], [0, 23, z0 + 12], toon('#e4e6e0'), [0.04, 0, 0]);
    box([len + 4, 1.6, 0.6], [0, 22.6, z0 - 4.6], green);
    // スタンドの裏（パドック側）：窓の並ぶ白い壁
    for (let i = 0; i < 3; i++) box([len - 10, 1.6, 0.3], [0, 13 + i * 3.4, z0 + 26.1], suite);
    box([len, 22, 1], [0, 11, z0 + 25.5]);
    for (let x = -len / 2 + 6; x <= len / 2 - 6; x += 15) box([0.7, 11, 0.7], [x, 17.5, z0 - 3]);
    // 4コーナー寄りの屋外席（緑の座席の段）
    for (let j = 0; j < 4; j++) box([lx(150) - lx(45), 0.6 + j * 0.6, 2.2], [(lx(45) + lx(150)) / 2, 8 + j * 0.3, z0 + 19 + j * 2.2], seat);
    // ツインスパイア（1895年）：ゴール前のスタンドの屋根に立つ2本の六角の尖塔。白い塔身に窓の帯、灰緑のスレートの尖り屋根と金色の頂華
    { const sp = new THREE.Group(); g.add(sp); registerLandmark(sp, 'ツインスパイア');
      const zc = z0 + 8, xs = [lx(342), lx(372)], gold = toon('#c9a45a'), dark = toon('#33413d');
      box([xs[1] - xs[0], 5, 6], [(xs[0] + xs[1]) / 2, 25.5, zc], white);
      part(sp, new THREE.ConeGeometry(5, 3, 4, 1), slate, [(xs[0] + xs[1]) / 2, 29.5, zc], [1.9, 1, 0.8], [0, Math.PI / 4, 0], 0);
      for (const x of xs) {
        part(sp, new THREE.CylinderGeometry(2.6, 2.9, 9, 6), white, [x, 28, zc], null, null, 0.03);
        part(sp, new THREE.CylinderGeometry(2.65, 2.65, 2.2, 6), dark, [x, 29.5, zc], null, null, 0);
        part(sp, new THREE.CylinderGeometry(2.7, 2.7, 0.5, 6), white, [x, 30.7, zc], null, null, 0);
        part(sp, new THREE.CylinderGeometry(3.3, 3.3, 0.6, 6), green, [x, 32.8, zc], null, null, 0);
        part(sp, new THREE.ConeGeometry(3, 15, 6), slate, [x, 40.6, zc], null, null, 0.03);
        for (let i = 0; i < 3; i++) { const a = i * Math.PI * 2 / 3 + Math.PI / 6; addBox(sp, [0.9, 1.6, 0.9], [x + Math.cos(a) * 2.1, 36.5, zc + Math.sin(a) * 2.1], white, [0, -a, 0], 0); }
        part(sp, BOX, gold, [x, 49.4, zc], [0.25, 3, 0.25], null, 0); part(sp, SPH_LO, gold, [x, 48.6, zc], [0.5, 0.5, 0.5], null, 0);
      } }
  } else {
    for (const x of [-len * 0.18, len * 0.18]) {
      box([6.5, 9, 6.5], [x, 17.7, z0 + 10]);
      part(g, new THREE.CylinderGeometry(2.2, 3.3, 3, 8), cream, [x, 23.5, z0 + 10], null, null, 0);
      part(g, new THREE.ConeGeometry(3.6, 9, 8), cream, [x, 29.5, z0 + 10], null, null, 0);
      part(g, SPH_LO, gold, [x, 34.2, z0 + 10], [0.45, 0.45, 0.45], null, 0);
    }
  }
}
function decorRacecourseLandmarks() {
  const theme = track.def.theme;
  if (theme === 'tokyo') {
    // 正門を入ってすぐ右、パドックの脇に立つ「幻の馬」トキノミノル像（待ち合わせの定番）
    landmarkStatue('トキノミノル像', 0.62, 'walk', '#5d6b5f');
    // スタンド裏のパドック：楕円の周回路と内側の芝、白い柵
    const pad = landmarkGroup('パドック', 0.42, W + 100); landmarkFoundation(pad, 62, 38, '#cdbf9f');
    part(pad, new THREE.CircleGeometry(1, 48), toon('#6fbf5c'), [0, 0.06, 0], [22, 11, 1], [-Math.PI / 2, 0, 0], 0);
    const rail = [];
    for (let i = 0; i < 48; i++) { const a = i / 48 * Math.PI * 2; rail.push(new V3(Math.cos(a) * 28, 1.1, Math.sin(a) * 16)); }
    pad.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(rail, true), 96, 0.12, 4, true), toon('#f4f2ea')));
    // JR府中本町駅と西門を結ぶ連絡通路：1コーナー寄りのスタンド端から外へ延びる屋根付きの橋と、武蔵野線の電車が止まる駅
    const jr = landmarkGroup('府中本町駅連絡通路', 1, W + 60), deck = toon('#d9d4c8'), steel = toon('#9aa3a8');
    addBox(jr, [7, 1, 120], [0, 8, 60], deck, null, 0); addBox(jr, [8, 0.5, 120], [0, 12.5, 60], toon('#7f97a6'), null, 0);
    for (let z = 4; z <= 116; z += 16) { addBox(jr, [1, 8, 1], [0, 4, z], steel, null, 0); for (const x of [-3.6, 3.6]) addBox(jr, [0.3, 4, 0.3], [x, 10.5, z], steel, null, 0); }
    addBox(jr, [90, 1.4, 8], [0, 0.7, 128], toon('#c9c3b5'), null, 0); addBox(jr, [90, 0.5, 9], [0, 6, 128], toon('#8c969c'), null, 0);
    addBox(jr, [16, 12, 10], [0, 6, 120], toon('#eee8d8'), null, 0);
    for (const z of [134, 138]) addBox(jr, [160, 0.25, 0.3], [0, 0.4, z], toon('#5d5a57'), null, 0);
    const train = new THREE.Group(); train.position.set(0, 0.5, 136); jr.add(train);
    const silver = toon('#d3d8dc'), orange = toon('#e8742c'), pane = toon('#3f4b55');
    for (let i = 0; i < 4; i++) {
      const x = (i - 1.5) * 19;
      addBox(train, [18, 3.6, 3.2], [x, 2.2, 0], silver, null, 0.03);
      for (const z of [-1.62, 1.62]) { addBox(train, [18.1, 0.45, 0.1], [x, 1.5, z], orange, null, 0); for (let j = 0; j < 4; j++) addBox(train, [2.6, 1.2, 0.1], [x - 6 + j * 4, 2.9, z], pane, null, 0); }
    }
    // 駅に止まってから線路の端まで行って戻ってくる
    train.userData.droneIgnore = true;
    themeUpd.push(t => { const c = (t * 0.05) % 2, u = c < 1 ? c : 2 - c; train.position.x = 40 * (2 * THREE.MathUtils.smootherstep(u, 0.15, 0.85) - 1); });
    // ここから下の配置は直線上の位置s（ゲーム内の長さ、ゴールは約263）と外側のレーンで決める。スタンドはs=24〜274、
    // メモリアル60スタンドが4コーナー寄り（東門側）、フジビュースタンドがゴール寄り。スタンドの裏（北側）に府中の街が広がる
    const grp = (name, s, lane) => landmarkGroup(name, (s - track.homeS0) / (track.homeS1 - track.homeS0), lane);
    const white = toon('#f4f2ea'), cream = toon('#eee8d8'), glassM = toon('#7ca6b9'), roofGray = toon('#8c969c');
    const label = (g, text, w, pos, rotY = 0, bg = '#2f4f7a') => {
      const tex = ctex(512, 96, c => { c.fillStyle = bg; c.fillRect(0, 0, 512, 96); c.fillStyle = '#ffffff'; c.font = '800 54px "Zen Maru Gothic", sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(text, 256, 50); });
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, w * 96 / 512), new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide })); m.position.set(...pos); m.rotation.y = rotY; g.add(m);
    };
    // 正門：けやき並木の突き当たり。門柱と大きな庇、「東京競馬場」の看板（トキノミノル像は門を入ってすぐ右）
    const gate = grp('正門', 174, W + 128);
    for (const x of [-14, -5, 5, 14]) addBox(gate, [1.6, 8, 1.6], [x, 4, 0], cream, null, 0.03);
    addBox(gate, [36, 1, 9], [0, 8.4, 0], white, null, 0.03); addBox(gate, [30, 2, 0.4], [0, 10, 4.2], toon('#2f4f7a'), null, 0);
    label(gate, '東京競馬場', 28, [0, 10, 4.45]);
    // 京王線 府中競馬正門前駅：正門の先にある競馬場線の終着駅（位置関係はデフォルメ）。駅と正門は3階分の高さを渡る専用歩道橋で結ばれる
    const kx = -64, kz = 72, dx = kx + 8 - (-6), dz = kz - 8 - 6, wl = Math.hypot(dx, dz);
    addBox(gate, [wl, 0.9, 6], [(-6 + kx + 8) / 2, 7, (6 + kz - 8) / 2], toon('#d9d4c8'), [0, Math.atan2(-dz, dx), 0], 0);
    for (let i = 1; i < 5; i++) addBox(gate, [1, 7, 1], [-6 + dx * i / 5, 3.5, 6 + dz * i / 5], toon('#9aa3a8'), null, 0);
    addBox(gate, [60, 1.4, 9], [kx, 0.7, kz], toon('#c9c3b5'), null, 0); addBox(gate, [60, 0.5, 10], [kx, 6, kz], roofGray, null, 0);
    addBox(gate, [14, 13, 10], [kx + 8, 6.5, kz - 9], cream, null, 0.02); label(gate, '府中競馬正門前', 13, [kx + 8, 10.5, kz - 14.05], Math.PI, '#c8006e');
    for (const z of [kz + 6, kz + 10]) addBox(gate, [150, 0.25, 0.3], [kx - 45, 0.4, z], toon('#5d5a57'), null, 0);
    const keio = new THREE.Group(); keio.position.set(kx, 0.5, kz + 8); gate.add(keio); keio.userData.droneIgnore = true;
    const kWhite = toon('#eef0f2'), kRed = toon('#d4006f'), kBlue = toon('#1f3a8f');
    for (let i = 0; i < 4; i++) {
      const x = (i - 1.5) * 15;
      addBox(keio, [14.5, 3.6, 3.2], [x, 2.2, 0], kWhite, null, 0.03);
      for (const z of [-1.62, 1.62]) { addBox(keio, [14.6, 0.3, 0.1], [x, 1.45, z], kRed, null, 0); addBox(keio, [14.6, 0.3, 0.1], [x, 1.1, z], kBlue, null, 0); for (let j = 0; j < 3; j++) addBox(keio, [2.6, 1.2, 0.1], [x - 4.5 + j * 4.5, 2.9, z], pane, null, 0); }
    }
    // 終着駅に止まってから、線路の先（東府中方面）へ出て戻ってくる
    themeUpd.push(t => { const c = (t * 0.045 + 0.4) % 2, u = c < 1 ? c : 2 - c; keio.position.x = kx - 70 * THREE.MathUtils.smootherstep(u, 0.2, 0.8); });
    // JRA競馬博物館：東門の近く、メモリアル60スタンドの裏。アーチ窓の並ぶ2階建てと玄関の列柱、隣にミニ新幹線が回る広場
    const mu = grp('JRA競馬博物館', 40, W + 100); landmarkFoundation(mu, 64, 34, '#d8d2c4');
    addBox(mu, [34, 11, 20], [-10, 5.5, 2], toon('#efe2c8'), null, 0.02); addBox(mu, [36, 1, 22], [-10, 11.5, 2], toon('#9a6a4f'), null, 0.02);
    for (let i = 0; i < 6; i++) for (const y of [3, 8]) addBox(mu, [2.6, 3, 0.2], [-23 + i * 5.2, y, -8.1], glassM, null, 0);
    for (const x of [-15, -10, -5]) part(mu, new THREE.CylinderGeometry(0.6, 0.6, 7, 10), white, [x, 3.5, -11], null, null, 0);
    addBox(mu, [14, 0.8, 5], [-10, 7.4, -10.5], white, null, 0.02);
    landmarkHorse(mu, [-10, 12, 2], 'gallop', '#7a6a4a', 0.9);
    label(mu, 'JRA競馬博物館', 16, [-10, 9.4, -8.25], Math.PI, '#5b3b2a');
    const loopRx = 11, loopRz = 7.5;
    { const pts = []; for (let i = 0; i < 48; i++) { const a = i / 48 * Math.PI * 2; pts.push(new V3(18 + Math.cos(a) * loopRx, 0.25, Math.sin(a) * loopRz)); }
      mu.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true), 96, 0.15, 4, true), toon('#6d6a66'))); }
    const mini = [];
    for (let i = 0; i < 3; i++) {
      const c = new THREE.Group(); mu.add(c); mini.push(c); c.userData.droneIgnore = true;
      addBox(c, [3, 1.1, 1.1], [0, 0.9, 0], toon('#f5f5f2'), null, 0.03); addBox(c, [3.02, 0.3, 1.12], [0, 0.65, 0], toon('#2b6cb0'), null, 0);
    }
    part(mini[0], CONE, toon('#f5f5f2'), [2.1, 0.9, 0], [0.55, 1.4, 0.55], [0, 0, -Math.PI / 2], 0.03);
    themeUpd.push(t => mini.forEach((c, i) => { const a = t * 0.5 - i * 0.3; c.position.set(18 + Math.cos(a) * loopRx, 0, Math.sin(a) * loopRz); c.rotation.y = -Math.atan2(Math.cos(a) * loopRz, -Math.sin(a) * loopRx); }));
    // 日吉が丘：東門を入ってすぐの芝生の丘。海賊船ダービー号の遊具と、馬シャ馬シャパークの噴水
    const hill = grp('日吉が丘', -35, W + 92); landmarkFoundation(hill, 60, 44, '#8fc46a');
    part(hill, new THREE.SphereGeometry(1, 24, 10, 0, Math.PI * 2, 0, Math.PI / 2), toon('#86c062'), [-8, 0, 4], [22, 5, 16], null, 0);
    { const ship = new THREE.Group(); ship.position.set(-8, 5, 4); ship.rotation.y = 0.4; hill.add(ship);
      const wood = toon('#8a5a3a');
      addBox(ship, [14, 3, 5], [0, 1.5, 0], wood, null, 0.03); addBox(ship, [4, 2.2, 5.2], [-6, 3.6, 0], wood, null, 0.03); part(ship, CONE, wood, [8, 1.5, 0], [1.8, 3.5, 1.8], [0, 0, -Math.PI / 2], 0.03);
      part(ship, new THREE.CylinderGeometry(0.3, 0.35, 11, 6), toon('#5a3e2b'), [1, 7.5, 0], null, null, 0);
      addBox(ship, [0.2, 5, 6], [1.3, 8.5, 0], white, null, 0.02); addBox(ship, [0.15, 1.6, 2.4], [1, 13.6, 0], toon('#222831'), null, 0); }
    part(hill, new THREE.CylinderGeometry(6, 6.5, 0.8, 32), toon('#ddd3bf'), [18, 0.4, -10], null, null, 0);
    part(hill, new THREE.CircleGeometry(5.4, 32), toon('#6bbdcf', { polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }), [18, 0.82, -10], null, [-Math.PI / 2, 0, 0], 0);
    { const jets = new THREE.Group(); hill.add(jets); themeDetails.push(jets);
      for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2, d = new V3(Math.cos(a), 0, Math.sin(a));
        jets.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(new V3(18, 0.9, -10), new V3(18 + d.x * 1.5, 5, -10 + d.z * 1.5), new V3(18 + d.x * 3.5, 0.9, -10 + d.z * 3.5)), 10, 0.1, 4), toon('#a7e5ed'))); } }
    // けやき並木を行き来する馬車（乗馬センターの馬車）
    const cart = new THREE.Group(), road = grp('けやき並木の馬車', 174, W + 150); road.add(cart); cart.userData.droneIgnore = true;
    { const h = landmarkHorse(cart, [0, 0, 6.5], 'walk', '#7a4a2a', 0.75); h.rotation.y = -Math.PI / 2; h.children[0].visible = false; }
    addBox(cart, [3.6, 2.4, 5], [0, 2.2, 0], toon('#f2efe6'), null, 0.03); addBox(cart, [4, 0.4, 5.6], [0, 3.6, 0], toon('#3d5a40'), null, 0.02);
    for (const x of [-1.9, 1.9]) for (const z of [-1.6, 1.6]) part(cart, new THREE.CylinderGeometry(0.9, 0.9, 0.25, 12), toon('#5a3e2b'), [x, 0.9, z], null, [0, 0, Math.PI / 2], 0);
    themeUpd.push(t => { const c = (t * 0.03) % 2, u = c < 1 ? c : 2 - c; cart.position.z = 6 + 96 * THREE.MathUtils.smootherstep(u, 0.05, 0.95); cart.rotation.y = c < 1 ? 0 : Math.PI; });
    // 乗馬センター：並木と府中本町側の線路の間。砂の馬場と厩舎
    const rc = grp('乗馬センター', 226, W + 236); landmarkFoundation(rc, 52, 34, '#cfc6b0');
    addBox(rc, [30, 0.2, 22], [-8, 0.1, 0], toon('#d8c49a'), null, 0);
    for (const [x, z, w, d] of [[-8, -11, 30, 0.2], [-8, 11, 30, 0.2], [-23, 0, 0.2, 22], [7, 0, 0.2, 22]]) addBox(rc, [w, 0.2, d], [x, 1.1, z], white, null, 0);
    addBox(rc, [12, 5, 22], [18, 2.5, 0], toon('#e8e2d4'), null, 0.02); addBox(rc, [13, 0.8, 23], [18, 5.4, 0], toon('#6b3d33'), null, 0);
    landmarkHorse(rc, [-8, 0.2, 0], 'walk', '#8a5a3a', 1.1);
    // 大國魂神社：けやき並木（馬場大門のケヤキ並木）の先にある府中の総社。鳥居と拝殿
    const jinja = grp('大國魂神社', 174, W + 266); landmarkFoundation(jinja, 44, 40, '#c9c3b5');
    const sumi = toon('#3d3a36');
    for (const x of [-4.5, 4.5]) part(jinja, new THREE.CylinderGeometry(0.55, 0.6, 9, 10), sumi, [x, 4.5, -14], null, null, 0);
    addBox(jinja, [13, 0.9, 1.2], [0, 9.2, -14], sumi, null, 0.02); addBox(jinja, [10.5, 0.6, 0.8], [0, 7.6, -14], sumi, null, 0);
    addBox(jinja, [18, 5, 10], [0, 2.5, 6], toon('#a8402e'), null, 0.02);
    for (const sx of [-1, 1]) addBox(jinja, [20, 0.7, 7.5], [0, 6.6, 6 + sx * 3], toon('#4a4f55'), [sx * 0.55, 0, 0], 0.02);
  }
  if (theme === 'nakayama') {
    // 配置は公式の場内マップとOpenStreetMap・衛星写真に合わせる（座標は実寸m、nakayamaAtの直線基準）。スタンドの裏はすぐ県道（松戸原木線）で、
    // その間にパドック・ハイセイコー号馬像・グランプリガーデンが並び、グランプリロード（はなみち）がスタンドの1コーナー寄りの端を回ってコースへ出る
    const fence = (g, rx, rz, y = 1.1) => {
      const pts = [];
      for (let i = 0; i < 48; i++) { const a = i / 48 * Math.PI * 2; pts.push(new V3(Math.cos(a) * rx, y, Math.sin(a) * rz)); }
      g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true), 96, 0.12, 4, true), toon('#f4f2ea')));
    };
    const white = toon('#f1eee6'), steel = toon('#9aa3a8');
    const pad = nakayamaGroup('パドック', 215, -138); landmarkFoundation(pad, 42, 24, '#cdbf9f');
    part(pad, new THREE.CircleGeometry(1, 48), toon('#6fbf5c'), [0, 0.06, 0], [15, 7.5, 1], [-Math.PI / 2, 0, 0], 0);
    fence(pad, 19, 10.5);
    // ハイセイコー号馬像：パドックと正門の間。ピンクの御影石の台座に立つ、歩く姿の銅像と赤い花壇
    const hs = nakayamaGroup('ハイセイコー号馬像', 285, -150); landmarkFoundation(hs, 20, 14);
    addBox(hs, [13, 2.2, 7.5], [0, 1.1, 0], toon('#a58884'), null, 0);
    landmarkHorse(hs, [0, 2.2, 0], 'walk', '#5f7a6d', 2.2); landmarkFlowers(hs, 9, 6, '#e04a3a');
    // 正門：県道に面した門柱と庇
    const gate = nakayamaGroup('正門', 300, -178);
    for (const x of [-6, 6]) addBox(gate, [1.4, 4.5, 1.4], [x, 2.25, 0], white, null, 0);
    addBox(gate, [15, 0.8, 3], [0, 4.9, 0], toon('#5d6b73'), null, 0);
    // グランプリロード（はなみち）：パドックからスタンドの裏を通り、1コーナー寄りの端でコースへ向かうレンガ敷きの通路
    const road = [[250, -118], [375, -118], [384, -22]].map(([x, z]) => nakayamaAt(x, z));
    const hanamichi = decorPath(road.flatMap((q, i, a) => i ? Array.from({ length: 16 }, (_, j) => a[i - 1].clone().lerp(q, (j + 1) / 16)) : [q]));
    decorCourseLane(hanamichi, 'dirt', 0, hanamichi.L, { lanes: [W / 2 - 2.5, W / 2 + 2.5], cols: 2, step: 1.5, onGround: true, lift: 0.2, mat: toon('#a07a68', { side: THREE.DoubleSide }) });
    // グランプリガーデン：はなみちの脇。レンガ敷きの広場に白い馬像の台、歴代優勝馬のプレートが並ぶ壁、松とベンチ
    const g = nakayamaGroup('グランプリガーデン', 338, -150); landmarkFoundation(g, 28, 18, '#a07e6c');
    part(g, new THREE.CylinderGeometry(3.6, 4, 1.4, 24), toon('#e8e2d4'), [0, 0.7, 0], null, null, 0);
    landmarkHorse(g, [0, 1.4, 0], 'rear', '#f2f0ea', 1.2); landmarkFlowers(g, 6, 5.5);
    addBox(g, [25, 3, 1], [0, 1.5, 7.8], toon('#c9a77a'), null, 0); addBox(g, [25.4, 0.5, 1.3], [0, 3.2, 7.8], toon('#2f6a3e'), null, 0);
    for (let i = 0; i < 9; i++) addBox(g, [2, 1.5, 0.15], [-10 + i * 2.5, 1.8, 7.25], toon('#5d5a4e'), null, 0);
    for (const x of [-8, 8]) addBox(g, [4, 0.8, 1.2], [x, 0.4, -6], toon('#8a6446'), null, 0);
    const pine = new THREE.ConeGeometry(1, 1, 7); pine.translate(0, 0.5, 0);
    for (const [x, z] of [[-11.5, 5], [11.5, 5], [-11.5, -6.5]]) {
      part(g, new THREE.CylinderGeometry(0.4, 0.6, 3, 6), toon('#6b4a35'), [x, 1.5, z], null, null, 0);
      for (const [r, y] of [[2.6, 2.5], [1.9, 4.4]]) part(g, pine, toon('#2f6a3e'), [x, y, z], [r, 2.4, r], null, 0);
    }
    // 芝スタンド：メインスタンドの4コーナー寄り（南門の近く）に続く、芝生の観戦斜面
    const sh = nakayamaGroup('芝スタンド', -55, -52); landmarkFoundation(sh, 32, 16, '#8fcf6a');
    for (let i = 0; i < 5; i++) addBox(sh, [30, 0.6 + i * 0.9, 3], [0, (0.6 + i * 0.9) / 2, -6 + i * 3], toon(i % 2 ? '#7fbf5f' : '#8fcf6a'), null, 0);
    // 中央門：県道を挟んでスタンドの反対側。けやき公苑の中に白い大きな屋根が架かる（バスで来場する人の門）
    const cg = nakayamaGroup('中央門', 62, -174, -15 * Math.PI / 180);
    for (let x = -30; x <= 30; x += 10) for (const z of [-8, 8]) addBox(cg, [0.8, 8, 0.8], [x, 4, z], steel, null, 0);
    addBox(cg, [69, 1, 20], [0, 8.6, 0], white, null, 0.02); addBox(cg, [67, 0.4, 18], [0, 9.2, 0], toon('#dfe4e6'), null, 0);
    addBox(cg, [10, 4, 6], [-26, 2, 0], toon('#d9d4c8'), null, 0);
    // JRAメモリアルゲート：県道の向こうに立つ記念の門
    const mg = nakayamaGroup('JRAメモリアルゲート', 269, -206);
    for (const x of [-4, 4]) addBox(mg, [1.6, 6, 1.6], [x, 3, 0], toon('#b9b0a0'), null, 0);
    addBox(mg, [11, 1.2, 2], [0, 6.4, 0], toon('#7a6a52'), null, 0);
    // 法典門：1コーナーの外、木下街道に面した門。JR船橋法典駅から地下道（動く歩道）で結ばれる
    const hg = nakayamaGroup('法典門', 445, -35, 0.8);
    for (const x of [-4, 4]) addBox(hg, [1.2, 4, 1.2], [x, 2, 0], white, null, 0);
    addBox(hg, [11, 0.7, 4], [0, 4.3, 0], toon('#5d6b73'), null, 0); addBox(hg, [4, 2.4, 3], [-8, 1.2, 2], toon('#d9d4c8'), null, 0);
    // 馬場内棟：内馬場の1コーナー寄りに広がる低い建物。屋上は見晴らしのよいテラス、コース側はガラス張り
    const ib = nakayamaGroup('馬場内棟', 260, 168, 7 * Math.PI / 180); landmarkFoundation(ib, 52, 32, '#b3ac9c');
    addBox(ib, [50, 6, 30], [0, 3, 0], toon('#5c6168'), null, 0.02);
    addBox(ib, [46, 2.2, 0.2], [0, 3.4, 15.05], toon('#9cc3d6'), null, 0);
    for (const z of [-15, 15]) addBox(ib, [50, 1, 0.2], [0, 6.5, z], toon('#e8e6e0'), null, 0);
    for (const x of [-25, 25]) addBox(ib, [0.2, 1, 30], [x, 6.5, 0], toon('#e8e6e0'), null, 0);
    // UMAMI PARKの小さな建物（内馬場の3〜4コーナー寄り）
    const up = nakayamaGroup(null, 34, 221, 92 * Math.PI / 180); landmarkFoundation(up, 22, 18, '#b3ac9c');
    addBox(up, [20, 4, 16], [0, 2, 0], toon('#e2dccf'), null, 0); addBox(up, [21, 0.5, 17], [0, 4.2, 0], toon('#8a6446'), null, 0);
    // ポニーリンク：馬場内の奥にある、ポニーとふれあえる楕円の馬場
    const pony = nakayamaGroup('ポニーリンク', 272, 225); landmarkFoundation(pony, 30, 20, '#9ab577');
    part(pony, new THREE.CircleGeometry(1, 40), toon('#c9a77a'), [0, 0.06, 0], [12, 7, 1], [-Math.PI / 2, 0, 0], 0);
    fence(pony, 12.5, 7.5, 0.9); addBox(pony, [6, 3.5, 4], [-11, 1.75, -7], toon('#a0644a'), null, 0);
  }
  if (theme === 'niigata') {
    // 配置は公式の場内マップに合わせる：千直の発走地点はスタンドから遥か西。パドックはスタンドの裏、ウイナーズサークルはスタンド前、
    // こども広場・ふわふわ広場・芝の広場はスタンドの4コーナー寄り、乗馬センターは外回りの3〜4コーナーの外
    const grp = (name, s, lane) => landmarkGroup(name, (s - track.homeS0) / (track.homeS1 - track.homeS0), lane);
    const G = track.finishS, green = toon('#2f7a4f'), white = toon('#f4f2ea');
    const fence = (g, rx, rz, y = 1.1, mat = white) => {
      const pts = [];
      for (let i = 0; i < 48; i++) { const a = i / 48 * Math.PI * 2; pts.push(new V3(Math.cos(a) * rx, y, Math.sin(a) * rz)); }
      g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true), 96, 0.12, 4, true), mat));
    };
    // 千直の発走地点：ゲートの後ろに、緑の枠に「NIIGATA」の看板を掲げた屋根付きの上屋がコースをふさいで建つ
    const sh = grp('千直スタート地点', G - track.def.D - 35, W / 2);
    for (const z of [-(W / 2 + 4), W / 2 + 4]) addBox(sh, [1.6, 7.2, 1.6], [0, 3.6, z], green, null, 0.03);
    addBox(sh, [2.2, 2, W + 10], [0, 7.8, 0], green, null, 0.03);
    addBox(sh, [9, 0.5, W + 12], [-3.6, 9, 0], toon('#1f5a3a'), null, 0);
    addBox(sh, [0.4, 6.6, W + 8], [-7.6, 3.3, 0], toon('#24352c'), null, 0);
    addBox(sh, [6, 4, 5], [-3.5, 2, -(W / 2 + 10)], green, null, 0.03);
    const sign = ctex(512, 64, g => { g.fillStyle = '#2f7a4f'; g.fillRect(0, 0, 512, 64); g.fillStyle = '#ffffff'; g.font = '700 40px "Oxanium", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('NIIGATA', 256, 34); });
    const plate = new THREE.Mesh(new THREE.PlaneGeometry(W + 4, 1.5), new THREE.MeshBasicMaterial({ map: sign })); plate.position.set(1.12, 7.8, 0); plate.rotation.y = Math.PI / 2; sh.add(plate);
    // パドック：スタンドの裏の楕円の周回路。周りに木
    const pad = grp('パドック', G - 85, W + 105); landmarkFoundation(pad, 58, 36, '#cdbf9f');
    part(pad, new THREE.CircleGeometry(1, 48), toon('#6fbf5c'), [0, 0.06, 0], [21, 10.5, 1], [-Math.PI / 2, 0, 0], 0);
    fence(pad, 26, 15);
    for (const [x, z] of [[-27, -16], [27, -16], [-27, 16], [27, 16], [0, 17]]) {
      part(pad, new THREE.CylinderGeometry(0.3, 0.45, 3, 6), toon('#6b4a35'), [x, 1.5, z], null, null, 0);
      part(pad, SPH_LO, toon('#4c9a44'), [x, 4.4, z], [2.6, 2.3, 2.6], null, 0);
    }
    // ウイナーズサークル：スタンド前、ゴール手前の表彰台
    const wc = grp('ウイナーズサークル', G - 80, W + 9); landmarkFoundation(wc, 12, 9, '#d8d2c4');
    part(wc, new THREE.CylinderGeometry(4, 4, 0.3, 32), toon('#3f8f4f'), [0, 0.15, 0], null, null, 0);
    addBox(wc, [9, 3.2, 0.4], [0, 1.6, 4], toon('#1f5a3a'), null, 0);
    // こども広場：楕円の線路を回るミニ新幹線（白い車体に青と銅色の帯）とアスレチック
    const kid = grp('こども広場（ミニ新幹線）', G - 250, W + 95); landmarkFoundation(kid, 50, 28, '#b9d08a');
    fence(kid, 19, 9, 0.2, toon('#6d6a66'));
    const cars = [];
    for (let i = 0; i < 3; i++) {
      const c = new THREE.Group(); kid.add(c); cars.push(c);
      addBox(c, [3, 1.1, 1.1], [0, 0.9, 0], toon('#f5f5f2'), null, 0.03); addBox(c, [3.02, 0.3, 1.12], [0, 0.65, 0], toon('#2b6cb0'), null, 0); addBox(c, [3.02, 0.08, 1.13], [0, 0.88, 0], toon('#c08a50'), null, 0);
    }
    part(cars[0], CONE, toon('#f5f5f2'), [2.1, 0.9, 0], [0.55, 1.4, 0.55], [0, 0, -Math.PI / 2], 0.03);
    cars.forEach(c => { c.userData.droneIgnore = true; });
    themeUpd.push(t => cars.forEach((c, i) => { const a = t * 0.5 - i * 0.24; c.position.set(Math.cos(a) * 19, 0, Math.sin(a) * 9); c.rotation.y = -Math.atan2(Math.cos(a) * 9, -Math.sin(a) * 19); }));
    for (const [x, z, col] of [[-21, 11, '#ff9f43'], [-15, 11.5, '#54a0ff'], [21, 11, '#ff6b6b']]) addBox(kid, [3.5, 2.6, 3.5], [x, 1.3, z], toon(col), null, 0.03);
    // ふわふわ広場：白いふわふわドーム
    const fd = grp('ふわふわドーム', G - 290, W + 50); landmarkFoundation(fd, 22, 22, '#c9c3b5');
    part(fd, new THREE.SphereGeometry(1, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), toon('#fbf7ff'), [0, 0, 0], [9, 5.5, 9], null, 0.03);
    // 芝の広場：芝スタンドにつながる広場と、屋根付きのイベントステージ
    const st = grp('芝の広場（イベントステージ）', G - 235, W + 32); landmarkFoundation(st, 30, 22, '#8fcf6a');
    addBox(st, [16, 1.2, 8], [0, 0.6, 6], toon('#d8d2c4'), null, 0); addBox(st, [17, 0.5, 9.5], [0, 7.2, 6], white, null, 0.03); addBox(st, [16, 6, 0.4], [0, 4, 10], toon('#2f6a8f'), null, 0);
    for (const x of [-8, 8]) addBox(st, [0.5, 6, 0.5], [x, 4.2, 1.8], white, null, 0);
    // 乗馬センター：外回りの3〜4コーナーの外。砂の馬場と厩舎
    const rc = grp('乗馬センター', 231, W / 2 - 150); landmarkFoundation(rc, 70, 40, '#cfc6b0');
    addBox(rc, [40, 0.2, 26], [-10, 0.1, 0], toon('#d8c49a'), null, 0);
    for (const [x, z, w, d] of [[-10, -13, 40, 0.2], [-10, 13, 40, 0.2], [-30, 0, 0.2, 26], [10, 0, 0.2, 26]]) addBox(rc, [w, 0.2, d], [x, 1.1, z], white, null, 0);
    addBox(rc, [18, 6, 24], [24, 3, 0], toon('#e8e2d4'), null, 0.02); addBox(rc, [19, 1, 25], [24, 6.5, 0], toon('#6b3d33'), null, 0);
    landmarkHorse(rc, [-10, 0.2, 0], 'walk', '#8a5a3a', 1.2);
  }
  if (theme === 'kasamatsu') landmarkStatue('オグリキャップ像', 0.8, 'walk', '#b6bcb4');
  if (theme === 'churchill') {
    // 航空写真の位置へ置き、aimの方へ正面（+z）を向けた展示の台
    const spot = (name, p, aim) => {
      const g = registerLandmark(new THREE.Group(), name); g.position.set(p.x, track.groundH(p.x, p.z), p.z);
      if (aim) g.rotation.y = Math.atan2(aim.x - p.x, aim.z - p.z);
      world.add(g); return g;
    };
    const white = toon('#f4f0e4'), brick = toon('#a8634a'), stone = toon('#d8d0bc');
    // ケンタッキーダービー博物館：セントラル通りに面した1号門の脇。れんがの壁と白いガラスの円い入口
    { const p = churchillUV(64, -268), g = spot('ケンタッキーダービー博物館', p, churchillUV(64, -119)); landmarkFoundation(g, 34, 22);
      addBox(g, [30, 9, 18], [0, 4.5, 0], brick, null, 0.02); addBox(g, [31, 0.8, 19], [0, 9.2, 0], white, null, 0);
      part(g, new THREE.CylinderGeometry(5, 5, 10, 20), toon('#9fc3cf'), [0, 5, 9], null, null, 0.02);
      part(g, new THREE.CylinderGeometry(5.6, 5.6, 0.8, 20), white, [0, 10.3, 9], null, null, 0); }
    // バルバロ像（2009年）：1号門の前の広場。2006年のダービー馬が疾走する姿で、台座の下に眠る
    { const p = churchillUV(110, -262), g = spot('バルバロ像', p, churchillUV(110, -119)); landmarkFoundation(g, 18, 14);
      addBox(g, [9, 3.4, 5], [0, 1.7, 0], stone, null, 0); addBox(g, [10, 0.5, 6], [0, 3.6, 0], toon('#c9c0aa'), null, 0);
      landmarkHorse(g, [0, 3.85, 0], 'gallop', '#746052', 1.5); landmarkFlowers(g, 8, 6, '#d9203a'); }
    // パドック（2024年に拡張）：スタンドの裏の楕円の周回路。周りを段々のテラスが囲み、観客が見下ろす
    { const p = churchillUV(-88, -289), g = spot('パドック', p, churchillUV(-88, -119)); landmarkFoundation(g, 50, 36, '#cdbf9f');
      part(g, new THREE.CircleGeometry(1, 48), toon('#6fbf5c'), [0, 0.06, 0], [14, 8, 1], [-Math.PI / 2, 0, 0], 0);
      part(g, new THREE.RingGeometry(0.74, 1, 48), toon('#c9a77a'), [0, 0.08, 0], [17.5, 11, 1], [-Math.PI / 2, 0, 0], 0);
      const steps = [];
      for (let j = 0; j < 3; j++) for (let i = 0; i < 36; i++) {
        const a0 = i / 36 * Math.PI * 2, a1 = (i + 1) / 36 * Math.PI * 2, rx = 19.5 + j * 1.6, rz = 13 + j * 1.6, h = 0.8 + j * 0.9;
        const p0 = [Math.cos(a0) * rx, Math.sin(a0) * rz], p1 = [Math.cos(a1) * rx, Math.sin(a1) * rz];
        steps.push({ p: new V3((p0[0] + p1[0]) / 2, h / 2, (p0[1] + p1[1]) / 2), s: new V3(Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) + 0.3, h, 1.7), r: [0, -Math.atan2(p1[1] - p0[1], p1[0] - p0[0]), 0] });
      }
      g.add(inst(BOX, toon('#e4ddcc'), steps, false));
      const walkers = [];
      for (let i = 0; i < 5; i++) { const h = landmarkHorse(g, [0, 0.1, 0], 'walk', ['#6b4a35', '#3b2a20', '#8a5a3a'][i % 3], 0.45); h.children[0].visible = false; h.userData.droneIgnore = true; walkers.push(h); }
      themeUpd.push(t => walkers.forEach((h, i) => { const a = t * 0.08 + i * Math.PI * 2 / 5, x = Math.cos(a) * 15.7, z = Math.sin(a) * 9.4; h.position.set(x, 0.1, z); h.rotation.y = -Math.atan2(Math.cos(a) * 9.4, -Math.sin(a) * 15.7); })); }
    // アリスタイディーズ像：パドックの脇の庭園に立つ、1875年の第1回ケンタッキーダービーの優勝馬の等身大のブロンズ像
    { const p = churchillUV(-20, -280), g = spot('アリスタイディーズ像', p, churchillUV(-88, -289)); landmarkFoundation(g, 14, 11, '#9fc58a');
      addBox(g, [6.5, 1.6, 3.6], [0, 0.8, 0], stone, null, 0); landmarkHorse(g, [0, 1.6, 0], 'walk', '#5f5444', 1.1); landmarkFlowers(g, 5.5, 4.5, '#ff3355'); }
    // ウイナーズサークル：ゴールの向かいの内馬場。ツインスパイアを背に、優勝馬がバラのレイをかけられる
    { const f = tp(track.finishS, -21), g = spot('ウイナーズサークル', f.v, tp(track.finishS, W).v); landmarkFoundation(g, 16, 13, '#d8d2c4');
      part(g, new THREE.CylinderGeometry(5.5, 5.5, 0.3, 32), toon('#3f8f4f'), [0, 0.15, 0], null, null, 0);
      part(g, new THREE.TorusGeometry(5.5, 0.45, 6, 40), toon('#d9203a'), [0, 0.4, 0], null, [Math.PI / 2, 0, 0], 0);
      addBox(g, [10, 3.2, 0.4], [0, 1.6, -5.6], toon('#1f4a3a'), null, 0); addBox(g, [10.4, 0.5, 0.6], [0, 3.3, -5.6], toon('#c9a45a'), null, 0); }
  }
  if (theme === 'longchamp') {
    // スタンドの裏の円いパドック（ロン・ド・プレザンタシオン）：スタンドの各階から見下ろせる。周りにマロニエの木
    const pad = landmarkGroup('パドック（ロン・ド・プレザンタシオン）', 0.75, W + 112); landmarkFoundation(pad, 46, 46, '#cdbf9f');
    part(pad, new THREE.CircleGeometry(15, 48), toon('#6fbf5c'), [0, 0.06, 0], null, [-Math.PI / 2, 0, 0], 0);
    const rail = [];
    for (let i = 0; i < 48; i++) { const a = i / 48 * Math.PI * 2; rail.push(new V3(Math.cos(a) * 17, 1.1, Math.sin(a) * 17)); }
    pad.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(rail, true), 96, 0.12, 4, true), toon('#f4f2ea')));
    for (let i = 0; i < 8; i++) {
      const a = (i + 0.5) / 8 * Math.PI * 2, x = Math.cos(a) * 20.5, z = Math.sin(a) * 20.5;
      part(pad, new THREE.CylinderGeometry(0.35, 0.5, 3.4, 6), toon('#6b4a35'), [x, 1.7, z], null, null, 0);
      part(pad, SPH_LO, toon(i % 2 ? '#c9772a' : '#d9a33a'), [x, 5.2, z], [2.4, 2.2, 2.4], null, 0);
    }
    // 正門の内側に立つグラディアトゥール像：1865年の英国三冠馬で「ワーテルローの復讐者」。イジドール・ボヌール作（1866年）
    const gl = landmarkGroup('グラディアトゥール像', 0.93, W + 80); landmarkFoundation(gl, 18, 14);
    addBox(gl, [10, 5, 5.5], [0, 2.5, 0], toon('#d8d0bc'), null, 0); addBox(gl, [11, 0.6, 6.5], [0, 5.3, 0], toon('#c9c0aa'), null, 0);
    landmarkHorse(gl, [0, 5.6, 0], 'walk', '#4f5a52', 1.6); landmarkFlowers(gl, 8, 6, '#d9493a');
  }
  if (theme === 'meydan') {
    const g = landmarkGroup('メイダンホテル', 1.18, W + 106); landmarkFoundation(g, 110, 32);
    const wall = toon('#abc5ce'), glass = toon('#536c8b');
    for (let i = 0; i < 6; i++) {
      const x = -45 + i * 18, h = 28 + (2.5 - Math.abs(i - 2.5)) * 3;
      addBox(g, [18, h, 28], [x, h / 2, 0], wall, null, 0);
      for (let y = 5; y < h; y += 5) addBox(g, [17.5, 2.5, 0.3], [x, y, -14.2], glass, null, 0);
      addBox(g, [19, 1.2, 30], [x, h, 0], toon('#d4e1e5'), null, 0);
    }
  }
  if (theme === 'shatin') {
    const g = landmarkGroup('屋根付きパドック', 0.5, W + 100); landmarkFoundation(g, 68, 42);
    const roof = toon('#cadbd5'), ground = toon('#b4b091');
    part(g, new THREE.RingGeometry(0.68, 1, 48), ground, [0, 0.3, 0], [31, 18, 1], [-Math.PI / 2, 0, 0], 0);
    for (let i = 0; i < 12; i++) {
      const a = i / 12 * Math.PI * 2;
      addBox(g, [0.6, 12, 0.6], [Math.cos(a) * 31, 6, Math.sin(a) * 18], roof, null, 0);
    }
    part(g, new THREE.RingGeometry(0.55, 1, 48), roof, [0, 12, 0], [33, 20, 1], [-Math.PI / 2, 0, 0], 0);
    const park = landmarkGroup('ペンフォールド公園', 0.65, -Math.max(35, track.R * 0.75));
    landmarkFoundation(park, 44, 28, '#7ca76b');
    for (const x of [-13, 13]) {
      part(park, new THREE.CylinderGeometry(0.4, 0.6, 6, 6), toon('#8a7155'), [x, 3, 0], null, null, 0);
      part(park, SPH_LO, toon('#5d9564'), [x, 8, 0], [5, 4, 5], null, 0);
    }
    const pond = part(park, new THREE.CircleGeometry(1, 32), toon('#78bdca'), [0, 0.3, 0], [9, 6, 1], [-Math.PI / 2, 0, 0], 0);
    pond.receiveShadow = true; landmarkFlowers(park, 19, 11, '#f0c67f');
  }
}
// 本線と並走する飾りの内柵（ダートコースの内側など）
function decorInnerRail(lane, color, path = track) {
  const np = Math.ceil(path.L / 3), pts = [];
  for (let i = 0; i < np; i++) { const q = path.pos(i / np * path.L, lane); pts.push(new V3(q.x, track.groundH(q.x, q.z) + 1, q.z)); }
  world.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true), np * 2, 0.09, 6, true), toon(color)));
}
// 飾りの芝を本線の芝と同じ見た目にする（雨の色変化も本線と共有）
function decorTurfMat() { const m = WR.tMat.clone(); m.color = WR.tMat.color; m.side = THREE.DoubleSide; return m; }
// 本線の芝の上にある頂点か。飾りの芝はここを沈めて、重なりのちらつきを防ぐ
function onMainTurf(p) { for (let i = 0; i <= track.N; i += 2) if ((track.xs[i] - p.x) ** 2 + (track.zs[i] - p.z) ** 2 < (W / 2 + 1.8) ** 2) return true; return false; }
// 本線の位置sから直線で延びる芝の発走ポケット（forward: 進行方向の先へ、false: 後ろへ）
function decorTurfPocket(s, length, forward, mat) {
  const q = track.pos(s, W / 2), tr = new Track({ surf: 'turf', dir: track.def.dir, closed: false, segs: [{ len: length }], finish: [0, length], D: length });
  const origin = tr.pos(forward ? 0 : tr.L, W / 2);
  for (let i = 0; i <= tr.N; i++) {
    const x = tr.xs[i] - origin.x, z = tr.zs[i] - origin.z;
    tr.xs[i] = q.x + x * Math.cos(q.h) - z * Math.sin(q.h); tr.zs[i] = q.z + x * Math.sin(q.h) + z * Math.cos(q.h); tr.hs[i] = q.h;
  }
  decorCourseLane(tr, 'turf', 0, tr.L, { lanes: [-1.6, W + 1.6], cols: 18, step: 1.5, onGround: true, mat, hide: onMainTurf });
}
// 点列を結んだ飾り用の経路。pos(s, lane)は本線のTrack.posと同じ向きでレーンをとる
function decorPath(pts) {
  const ss = [0];
  for (let i = 1; i < pts.length; i++) ss.push(ss[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].z - pts[i - 1].z));
  return { pts, L: ss[ss.length - 1], pos(s, lane) {
    let i = 0; while (i < pts.length - 2 && ss[i + 1] < s) i++;
    const a = pts[i], b = pts[i + 1], t = clamp((s - ss[i]) / Math.max(1e-6, ss[i + 1] - ss[i]), 0, 1);
    const h = Math.atan2(b.z - a.z, b.x - a.x), off = (lane - W / 2) * track.sgn, x = lerp(a.x, b.x, t), z = lerp(a.z, b.z, t);
    return { x: x - Math.sin(h) * off, z: z + Math.cos(h) * off, h, y: 0 };
  } };
}
// opts.cols: 横方向の分割数、opts.hide(p): trueの頂点は地面の下に沈めて隠す（本線と重なる部分を本線に任せる）、opts.lift: 地面からの浮かせ量
function decorCourseLane(tr, surf, from = 0, to = tr.L, opts = {}) {
  const [laneA, laneB] = opts.lanes || [2, W - 2], cols = opts.cols || 1;
  const n = Math.ceil((to - from) / (opts.step || 3)), pts = [], uv = [], indices = [];
  const y = p => opts.hide && opts.hide(p) ? track.groundH(p.x, p.z) - 0.6 : opts.onGround ? track.groundH(p.x, p.z) + (opts.lift || 0.1) : 0.005;
  for (let i = 0; i <= n; i++) {
    const s = lerp(from, to, i / n);
    for (let j = 0; j <= cols; j++) { const p = tr.pos(s, lerp(laneA, laneB, j / cols)); pts.push(p.x, y(p), p.z); uv.push(s / 16, j / cols); }
    if (i < n) for (let j = 0; j < cols; j++) { const k = i * (cols + 1) + j, k2 = k + cols + 1; indices.push(k, k + 1, k2, k + 1, k2 + 1, k2); }
  }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geo.setIndex(indices); geo.computeVertexNormals();
  const lane = new THREE.Mesh(geo, opts.mat || toon(surf === 'turf' ? '#438d57' : '#99734f', { side: THREE.DoubleSide })); lane.receiveShadow = true; world.add(lane);
}
