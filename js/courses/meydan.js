// メイダン
'use strict';

// メイダンの地図座標（実寸m）：原点はダートの4コーナー出口、x：スタンド前の直線の向き（ほぼ南西）、z：コースの内側（ほぼ南東）が正（ダートのコースの区間segsと同じ座標）。
// 芝の楕円はダートより約50m 1コーナー側に寄り、芝の4コーナー出口は地図の(-50, -38)。ゴール板は芝・ダート共通（ダートの直線400m＝芝の直線450m）
const MEYDAN_TURF_ORIGIN = [-50, -38];
function meydanAt(x, z) {
  const [ox, oz] = track.def.surf === 'turf' ? MEYDAN_TURF_ORIGIN : [0, 0], k = track.def.scale;
  return new V3(track.xs[0] + (x - ox) * k, 0, track.zs[0] + (z - oz) * k * track.turn);
}
function decorMeydan(th) {
  // 配置はGoogleマップの衛星写真（砂の帯・芝の帯・建物の位置から縮尺を合わせた）とDubai Racing Clubの場内案内を参考にしたデフォルメ
  const at = meydanAt, k = track.def.scale, v = (x, z) => new V3(x, 0, z), TAU = Math.PI * 2;
  const [mox, moz] = track.def.surf === 'turf' ? MEYDAN_TURF_ORIGIN : [0, 0];
  const toMap = p => ({ x: (p.x - track.xs[0]) / k + mox, z: (p.z - track.zs[0]) / (k * track.turn) + moz });
  const route = (pts, closed = false) => {
    const ps = pts.map(([x, z]) => at(x, z)), curve = ps.length > 2 ? new THREE.CatmullRomCurve3(ps, closed, 'centripetal') : new THREE.LineCurve3(ps[0], ps[1]);
    const sp = curve.getSpacedPoints(Math.ceil(curve.getLength() / 1.5)); if (closed) sp.push(sp[0].clone());
    return decorPath(sp);
  };
  // 地図の向きにそろえた飾りのグループ：ローカルのxは地図のx（直線の向き）からangだけ内側へ回した向き、+zはコースの外側
  const group = (name, x, z, ang = 0) => {
    const g = new THREE.Group(); g.position.copy(at(x, z)); g.rotation.y = -ang * track.turn; g.scale.z = track.sgn; world.add(g);
    return name ? registerLandmark(g, name) : g;
  };
  const inPoly = (poly, p) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const a = poly[i], b = poly[j]; if ((a.z > p.z) !== (b.z > p.z) && p.x < (b.x - a.x) * (p.z - a.z) / (b.z - a.z) + a.x) c = !c; } return c; };
  // 平らな面（穴あきも可）。芝生・池・駐車場などの地面の塗り分け
  const flat = (poly, color, lift = 0.03, holes = []) => {
    const shape = new THREE.Shape(poly.map(p => new THREE.Vector2(p.x, p.z)));
    for (const h of holes) shape.holes.push(new THREE.Path(h.map(p => new THREE.Vector2(p.x, p.z))));
    const geo = new THREE.ShapeGeometry(shape), pp = geo.attributes.position;
    for (let i = 0; i < pp.count; i++) pp.setXYZ(i, pp.getX(i), lift, pp.getY(i));
    geo.computeVertexNormals();
    const m = new THREE.Mesh(geo, toon(color, { side: THREE.DoubleSide })); m.receiveShadow = true; world.add(m); return m;
  };
  // 地図上の楕円（回転つき）をワールドの点列に
  const ell = (cx, cz, rx, rz, rot = 0, n = 40) => Array.from({ length: n }, (_, i) => {
    const a = i / n * TAU, x = Math.cos(a) * rx, z = Math.sin(a) * rz;
    return at(cx + x * Math.cos(rot) - z * Math.sin(rot), cz + x * Math.sin(rot) + z * Math.cos(rot));
  });
  const ellMap = (cx, cz, rx, rz, rot = 0, n = 40) => Array.from({ length: n }, (_, i) => {
    const a = i / n * TAU, x = Math.cos(a) * rx, z = Math.sin(a) * rz;
    return [cx + x * Math.cos(rot) - z * Math.sin(rot), cz + x * Math.sin(rot) + z * Math.cos(rot)];
  });
  // 細い帯（遊歩道・道路）：地図の点列に沿って幅wid（ワールド単位）の帯を敷く
  const ribbon = (path, wid, mat, lift = 0.08) => decorCourseLane(path, 'dirt', 0, path.L, { lanes: [W / 2 - wid / 2, W / 2 + wid / 2], cols: 1, step: 2, onGround: true, lift, mat });
  const backdrop = o => { o.userData.backdrop = true; return o; };
  const white = toon('#f1eee6'), steel = toon('#9aa3a8');
  const poly3 = pts => pts.map(([x, z]) => at(x, z));

  // ---- 2本の周回コース：レースをしない方の楕円を地図の位置へ動かして描く ----
  const otherDef = TRACKS.find(t => t.theme === 'meydan' && t.surf !== track.def.surf), other = new Track(otherDef);
  { const [ox, oz] = otherDef.surf === 'turf' ? MEYDAN_TURF_ORIGIN : [0, 0], p = at(ox, oz), dx = p.x - other.xs[0], dz = p.z - other.zs[0];
    for (let i = 0; i <= other.N; i++) { other.xs[i] += dx; other.zs[i] += dz; } }
  const turf = track.def.surf === 'turf' ? track : other, dirt = turf === track ? other : track;
  // 走路の見た目：レース中の馬場と同じ面は本線の材質を共有（雨の色変化もそろう）、もう一方は同じ模様の材質を作る
  const surfMat = surf => {
    if (surf === track.def.surf) { const m = WR.tMat.clone(); m.color = WR.tMat.color; m.side = THREE.DoubleSide; return m; }
    const tex = ctex(256, 256, surf === 'turf'
      ? g => { for (let x = 0; x < 256; x += 64) { g.fillStyle = (x / 64) % 2 ? '#55b556' : '#63c761'; g.fillRect(x, 0, 64, 256); } speck(g, 256, 256, 2200, ['#4aa04a', '#79d672', '#8ee383'], 1, 3, 0.55); }
      : g => { g.fillStyle = '#9b6a45'; g.fillRect(0, 0, 256, 256); for (let y = 0; y < 256; y += 6) { g.fillStyle = `rgba(${Math.random() < 0.5 ? '60,35,20' : '190,140,100'},${rand(0.05, 0.14)})`; g.fillRect(0, y, 256, rand(1, 3)); } speck(g, 256, 256, 1600, ['#7a4e30', '#b98559', '#5e3a22'], 1, 3, 0.7); }, true);
    return toon('#ffffff', { map: tex, side: THREE.DoubleSide });
  };
  const turfMat = surfMat('turf'), dirtMat = surfMat('dirt'), railMat = toon(th.rail);
  decorCourseLane(other, otherDef.surf, 0, other.L, { lanes: [-1.6, W + 1.6], cols: 6, step: 1.5, onGround: true, lift: 0.03, mat: otherDef.surf === 'turf' ? turfMat : dirtMat });
  decorInnerRail(-0.9, th.rail, other); decorInnerRail(W + 0.9, th.rail, other);
  const ringPts = tr => { const a = []; for (let i = 0; i < tr.N; i += 4) a.push(v(tr.xs[i], tr.zs[i])); return a; };
  const turfRing = ringPts(turf), dirtRing = ringPts(dirt);
  const gap = (pts, p) => { let d = 1e18; for (const q of pts) d = Math.min(d, (q.x - p.x) ** 2 + (q.z - p.z) ** 2); return Math.sqrt(d); };
  const onTurf = p => gap(turfRing, p) < W / 2 + 1.8;
  const railAlong = (path, lanes, s0 = 0, s1 = path.L) => {
    for (const ln of lanes) {
      const pts = []; for (let s = s0; s < s1; s += 3) { const q = path.pos(s, ln); pts.push(new V3(q.x, 1, q.z)); }
      const q = path.pos(s1, ln); pts.push(new V3(q.x, 1, q.z));
      world.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), pts.length * 2, 0.09, 6, false), railMat));
    }
  };

  // ---- 引き込み線と直線の帯 ----
  // 芝の直線コース（1200m）の引き込み線：芝の直線を4コーナーの奥（北東）へ約760mまっすぐ延ばす。ここから直線だけを走ってゴールへ
  const straight = route([[-810, -38], [-50, -38]]);
  decorCourseLane(straight, 'turf', 0, straight.L, { lanes: [-1.6, W + 1.6], cols: 6, step: 1.5, onGround: true, lift: 0.1, mat: turfMat, hide: p => gap(turfRing, p) < 2 });
  railAlong(straight, [-0.9, W + 0.9], 0, straight.L - 4);
  // ダートの1600mの引き込み線：向正面を2コーナーの奥（南西）へ延ばし、芝の1〜2コーナーを横切る。芝と重なる所は芝に任せる
  const mile = route([[745, 292], [416.3, 292]]);
  decorCourseLane(mile, 'dirt', 0, mile.L, { lanes: [-1.6, W + 1.6], cols: 6, step: 1.5, onGround: true, lift: 0.1, mat: dirtMat, hide: onTurf });
  // 柵は芝の内ラチ（引き込み線の先端から約90m）から先だけ
  railAlong(mile, [-0.9, W + 0.9], 47, mile.L - 1);
  // 衛星写真に見える、向正面の外を並走する長い直線の芝の帯（幅約26m）
  const strip = route([[1100, 364], [-186, 364]]);
  decorCourseLane(strip, 'turf', 0, strip.L, { lanes: [W / 2 - 6.5, W / 2 + 6.5], cols: 2, step: 2, onGround: true, lift: 0.1, mat: turfMat });
  railAlong(strip, [W / 2 - 7, W / 2 + 7]);

  // ---- 地面：コースのまわりと馬場内の芝生（その外はドバイの砂漠） ----
  const lanePoly = (tr, lane, step = 3) => { const a = []; for (let s = 0; s < tr.L; s += step) { const q = tr.pos(s, lane); a.push(v(q.x, q.z)); } return a; };
  const outerLawn = lanePoly(turf, W + 44);
  flat(lanePoly(dirt, -1.6), '#2f5a37'); flat(lanePoly(turf, -1.6), '#2f5a37', 0.03, [lanePoly(dirt, W + 1.6)]); flat(outerLawn, '#335d3a', 0.03, [lanePoly(turf, W + 1.6)]);

  // ---- 馬場内：芝生の中の遊歩道の庭園（大小の円の小径と、葉を連ねたような曲線の小径）と、大きな砂の三角 ----
  const path = toon('#d8d0bf', { side: THREE.DoubleSide });
  ribbon(route(ellMap(-3.5, 107, 66, 66), true), 1.6, path); ribbon(route(ellMap(59, 99, 37, 37), true), 1.6, path);
  [[110, 150, 0.4], [165, 150, -0.4], [220, 152, 0.4], [275, 150, -0.4], [330, 148, 0.4]].forEach(([x, z, r]) => ribbon(route(ellMap(x, z, 38, 18, r), true), 1.2, path));
  decorCourseLane(dirt, 'dirt', 0, dirt.L, { lanes: [-12.6, -11.4], cols: 1, step: 3, onGround: true, lift: 0.08, mat: path });
  flat(poly3([[200, 82], [305, 96], [252, 134]]), '#d7b98a', 0.06);
  // 小さな円の中心の噴水広場：花の輪と、光る噴水
  const fount = [];
  { const g = group('内馬場の庭園', 59, 99); landmarkFoundation(g, 14, 14, '#d8d0bf');
    part(g, new THREE.CylinderGeometry(4.5, 4.8, 0.8, 28), toon('#cfc6b4'), [0, 0.4, 0], null, null, 0);
    part(g, new THREE.CircleGeometry(4, 28), toon('#2c6f8f'), [0, 0.82, 0], null, [-Math.PI / 2, 0, 0], 0);
    landmarkFlowers(g, 6.4, 6.4, '#f2c25a');
    for (let i = 0; i < 7; i++) {
      const a = i / 6 * TAU, r = i ? 2.4 : 0, j = part(g, new THREE.CylinderGeometry(0.12, 0.3, 1, 6), glowMat('#bfefff', 1.8), [Math.cos(a) * r, 0.8, Math.sin(a) * r], [1, i ? 3 : 6, 1], null, 0);
      j.geometry.translate(0, 0.5, 0); j.position.y = 0.8; j.userData.h = i ? 3 : 6; fount.push(j);
    } }

  // ---- スタンドの裏と1コーナー側：メイダンホテル・パレードリング・立体駐車場・ヤシの葉の形の駐車場 ----
  // ザ・メイダンホテル：スタンドの1コーナー寄りの端に続く横長の5つ星ホテル。コースを向いた全面ガラスの客室と、屋上のインフィニティプール
  { const g = group('ザ・メイダンホテル', 650, -130), wall = toon('#c9d6dc'), glass = glowMat('#ffd9a0', 1.4), dim = toon('#4f6378');
    addBox(g, [84, 6, 30], [0, 3, 2], toon('#b9c4c8'), null, 0);
    for (let i = 0; i < 8; i++) {
      const x = -36.75 + i * 10.5, z = Math.pow((x / 42), 2) * 4, h = 22 - Math.abs(i - 3.5) * 0.9;
      addBox(g, [10.6, h - 6, 18], [x, 6 + (h - 6) / 2, z], wall, null, 0);
      for (let y = 8; y < h - 1; y += 2.8) addBox(g, [9.8, 1.5, 0.25], [x, y, z - 9.1], (i + y) % 3 < 1 ? dim : glass, null, 0);
      addBox(g, [11, 0.6, 19], [x, h + 0.3, z], toon('#e8eef0'), null, 0);
      // 屋上のインフィニティプール：コース側の縁いっぱいに青く光る水面
      addBox(g, [10.4, 0.35, 5], [x, h + 0.75, z - 6], glowMat('#46d2e6', 1.6), null, 0);
      for (let j = -1; j <= 1; j++) addBox(g, [1.6, 0.3, 0.7], [x + j * 3, h + 0.75, z - 1.5], white, null, 0);
    }
    addBox(g, [16, 0.5, 6], [0, 5, 18], white, null, 0); for (const x of [-7, 7]) addBox(g, [0.4, 5, 0.4], [x, 2.5, 20.5], steel, null, 0); }
  // パレードリング：スタンドの4コーナー寄りの裏。楕円の周回路と芝、白い柵、まわりを囲む段々の観覧席
  { const g = group('パレードリング', 110, -185), rx = 20, rz = 12; landmarkFoundation(g, 54, 36, '#cfc6b4');
    part(g, new THREE.CircleGeometry(1, 48), toon('#c9a77a'), [0, 0.05, 0], [rx, rz, 1], [-Math.PI / 2, 0, 0], 0);
    part(g, new THREE.CircleGeometry(1, 48), toon('#5fae5a'), [0, 0.1, 0], [rx - 3.5, rz - 3.5, 1], [-Math.PI / 2, 0, 0], 0);
    for (const r of [0, 3.6]) { const rail = []; for (let i = 0; i < 48; i++) { const a = i / 48 * TAU; rail.push(new V3(Math.cos(a) * (rx - r), 1.1, Math.sin(a) * (rz - r))); } g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(rail, true), 96, 0.1, 4, true), white)); }
    const steps = [];
    for (let j = 0; j < 4; j++) for (let i = 0; i < 40; i++) {
      const a = (i + 0.5) / 40 * TAU; if (Math.sin(a) < -0.55) continue;
      const ex = rx + 3 + j * 1.6, ez = rz + 3 + j * 1.6, h = 0.5 + j * 0.5;
      steps.push({ p: new V3(Math.cos(a) * ex, h / 2, Math.sin(a) * ez), s: new V3(TAU * (ex + ez) / 2 / 40 + 0.3, h, 1.5), r: [0, -Math.atan2(Math.cos(a) * ez, -Math.sin(a) * ex), 0] });
    }
    g.add(inst(BOX, toon('#e6e0d2'), steps, false));
    // 周回する馬（下見所を歩く出走馬）
    const herd = [];
    for (let i = 0; i < 4; i++) { const h = landmarkHorse(g, [0, 0.2, 0], 'walk', ['#6b4a35', '#3b2a20', '#8a5a3a', '#c9a27a'][i], 0.4); h.children[0].visible = false; h.userData.droneIgnore = true; herd.push(h); }
    themeUpd.push(t => herd.forEach((h, i) => { const a = t * 0.12 + i * TAU / 4, r = 0.9; h.position.set(Math.cos(a) * (rx - 1.8) * r, 0.2, Math.sin(a) * (rz - 1.8) * r); h.rotation.y = -Math.atan2(Math.cos(a) * rz, -Math.sin(a) * rx); })); }
  // スタンド裏の立体駐車場：屋上に白黒のジグザグ模様
  { const g = group(null, 420, -205), L = 130, D = 24;
    for (let f = 0; f < 3; f++) { addBox(g, [L, 0.6, D], [0, 3 + f * 3, 0], toon('#bfbab0'), null, 0); }
    for (let x = -L / 2 + 2; x <= L / 2 - 2; x += 8) for (const z of [-D / 2 + 1, D / 2 - 1]) addBox(g, [0.8, 9, 0.8], [x, 4.5, z], steel, null, 0);
    const zig = []; for (let i = 0; i < 32; i++) zig.push({ p: new V3(-L / 2 + 2 + i * (L - 4) / 31, 9.4, 0), s: new V3(0.9, 0.2, D * 1.35), r: [0, i % 2 ? 0.75 : -0.75, 0], c: C(i % 4 < 2 ? '#f4f2ea' : '#2b2d33') });
    g.add(inst(BOX, toon('#ffffff'), zig, false)); }
  // ヤシの葉の形の駐車場：スタンドの北西に、中心のロータリーから葉のように広がる
  const hub = [426, -564], leaves = [];
  { const cars = [], ribs = [], carCol = ['#f4f4f2', '#2f3438', '#c8302c', '#9aa3ab', '#3b5f8f', '#e9e2cf'].map(C);
    for (let n = 0; n < 9; n++) {
      const a = n / 9 * TAU + 0.2, dx = Math.cos(a), dz = Math.sin(a), wd = 26;
      // スタンドの方へ伸びる葉は立体駐車場にかからないよう短くする
      const len = dz > 0.6 ? 110 : 150, ccx = hub[0] + dx * (len / 2 + 20), ccz = hub[1] + dz * (len / 2 + 20);
      const leaf = [];
      for (let i = 0; i <= 16; i++) { const t = i / 16 * 2 - 1, w = wd * Math.pow(1 - t * t, 0.7); leaf.push([ccx + dx * t * len / 2 - dz * w, ccz + dz * t * len / 2 + dx * w]); }
      for (let i = 15; i > 0; i--) { const t = i / 16 * 2 - 1, w = wd * Math.pow(1 - t * t, 0.7); leaf.push([ccx + dx * t * len / 2 + dz * w, ccz + dz * t * len / 2 - dx * w]); }
      flat(leaf.map(([x, z]) => at(x, z)), '#5b5e64', 0.05); leaves.push({ cx: ccx, cz: ccz, r: len / 2 + 10 });
      // 葉の中央の植え込み（葉脈）と、葉脈から左右に並ぶ車
      const c0 = at(ccx, ccz), h = -Math.atan2(dz * track.turn, dx);
      ribs.push({ p: new V3(c0.x, 0.3, c0.z), s: new V3(len * k * 0.92, 0.5, 2.2), r: [0, h, 0] });
      for (let t = -0.85; t <= 0.85; t += 0.034) for (const side of [-1, 1]) {
        const wmax = wd * Math.pow(1 - t * t, 0.7) - 4; if (wmax < 5) continue;
        for (let o = 5; o < wmax; o += 9) { if (Math.random() < 0.3) continue; const p = at(ccx + dx * t * len / 2 - dz * o * side, ccz + dz * t * len / 2 + dx * o * side); cars.push({ p: new V3(p.x, 0.55, p.z), s: new V3(1.1, 0.8, 2.2), r: [0, h, 0], c: carCol[(cars.length * 7) % 6] }); }
      }
    }
    inst(BOX, toon('#3e7a42'), ribs, false); inst(BOX, toon('#ffffff'), cars, false);
    flat(ell(hub[0], hub[1], 22, 22), '#3e7a42', 0.06); }

  // ---- 北東：スタンドの先の池（噴水が上がる）と、池のあるゴルフコース ----
  flat(ell(-215, -163, 87, 50, 0.1), '#173248', 0.06);
  { const lake = at(-215, -163);
    for (let i = 0; i < 9; i++) { const a = i / 9 * TAU, r = i ? 9 : 0, j = part(world, new THREE.CylinderGeometry(0.2, 0.5, 1, 6), glowMat('#cfeeff', 1.6), [lake.x + Math.cos(a) * r, 0, lake.z + Math.sin(a) * r], [1, 1, 1], null, 0);
      j.geometry.translate(0, 0.5, 0); j.userData.h = i ? 9 : 16; fount.push(j); } }
  // ザ・トラック メイダンゴルフ：ナイター照明のゴルフ場。明るい緑のフェアウェイ、グリーンと旗、バンカー、池
  { flat(poly3([[-330, 10], [-320, 420], [-560, 450], [-860, 360], [-900, 80], [-700, 10]]), '#3c6e3f', 0.04);
    for (const [x, z, rx, rz, r] of [[-430, 90, 70, 22, 0.3], [-560, 210, 85, 24, -0.5], [-690, 110, 80, 22, 0.15], [-700, 300, 75, 24, 0.9], [-430, 300, 70, 22, -0.2]]) {
      flat(ell(x, z, rx, rz, r), '#5e9a4f', 0.06);
      const gx = x + Math.cos(r) * (rx - 10), gz = z + Math.sin(r) * (rx - 10), green = at(gx, gz);
      flat(ell(gx, gz, 14, 12), '#79c06a', 0.08); flat(ell(gx - 22, gz + 16, 9, 6, r), '#d9c08f', 0.08);
      part(world, new THREE.CylinderGeometry(0.08, 0.08, 4, 5), white, [green.x, 2, green.z], null, null, 0);
      addBox(world, [1.4, 0.9, 0.06], [green.x + 0.7, 3.5, green.z], glowMat('#ff6a5a', 1.6), null, 0);
    }
    flat(ell(-822, 184, 45, 70, 0.3), '#173248', 0.07); flat(ell(-520, 370, 60, 32, -0.2), '#173248', 0.07);
    for (const [x, z] of [[-360, 40], [-360, 380], [-620, 430], [-860, 300], [-880, 100], [-640, 30], [-560, 150], [-640, 260]]) {
      const p = at(x, z), g = new THREE.Group(); g.position.copy(p); world.add(g);
      addBox(g, [0.6, 22, 0.6], [0, 11, 0], toon('#3b3552'), null, 0); addBox(g, [4, 1.6, 1.6], [0, 22, 0], toon('#2b2640'), null, 0);
      addBox(g, [3.6, 0.2, 1.3], [0, 21.1, 0], glowMat('#fffbe8', 4), null, 0);
    } }

  // ---- 南西〜南東：砂漠の中の幹線道路（アル・メイダン通り）と、砂漠の低木 ----
  const hwA = at(-1000, -700), hwB = at(1400, -918), hwDir = hwB.clone().sub(hwA), hwL = hwDir.length(); hwDir.normalize();
  const hwN = new V3(-hwDir.z, 0, hwDir.x);
  ribbon(route([[-1000, -700], [1400, -918]]), 22, toon('#4a4d55', { side: THREE.DoubleSide }), 0.06);
  ribbon(route([[-1000, -700], [1400, -918]]), 2.2, toon('#3e7a42', { side: THREE.DoubleSide }), 0.1);
  { const posts = [], heads = [];
    for (let s = 10; s < hwL; s += 26) for (const o of [-10.5, 10.5]) { const p = hwA.clone().addScaledVector(hwDir, s).addScaledVector(hwN, o); posts.push({ p: new V3(p.x, 5, p.z), s: new V3(0.35, 10, 0.35) }); heads.push({ p: new V3(p.x - hwN.x * Math.sign(o) * 1.2, 10, p.z - hwN.z * Math.sign(o) * 1.2), s: new V3(1.6, 0.35, 0.7) }); }
    inst(BOX, steel, posts, false); inst(BOX, glowMat('#ffd9a0', 2.5), heads, false); }
  // 夜の車の流れ：ヘッドライトの白と、テールランプの赤
  { const n = 80, cars = [], m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new V3(2.4, 0.7, 1.1), p = new V3();
    const mesh = new THREE.InstancedMesh(BOX, new THREE.MeshBasicMaterial({ color: 0xffffff }), n); mesh.frustumCulled = false; mesh.userData.droneIgnore = true; world.add(mesh);
    for (let i = 0; i < n; i++) { const dir = i % 2 ? 1 : -1; cars.push({ s: rand(0, hwL), dir, lane: dir * rand(3, 8.5), sp: rand(14, 20) }); mesh.setColorAt(i, C(dir > 0 ? '#fff1c8' : '#ff4a3a').multiplyScalar(2.2)); }
    q.setFromAxisAngle(new V3(0, 1, 0), -Math.atan2(hwDir.z, hwDir.x));
    themeUpd.push(t => { cars.forEach((c, i) => { const s = mod(c.s + c.dir * c.sp * t, hwL); p.copy(hwA).addScaledVector(hwDir, s).addScaledVector(hwN, c.lane); p.y = 0.7; m4.compose(p, q, sc); mesh.setMatrixAt(i, m4); }); mesh.instanceMatrix.needsUpdate = true; }); }

  // ---- 照明塔：芝コースのまわり（スタンドの前は大屋根の照明に任せる） ----
  const busy = (x, z) => (x > 60 && x < 770 && z < -55 && z > -275) || (x > -900 && x < -300 && z > -20 && z < 460) || ((x + 215) / 100) ** 2 + ((z + 163) / 62) ** 2 < 1
    || (x < -30 && x > -830 && z > -66 && z < -10) || (z > 340 && z < 390 && x > -200 && x < 1110) || (x > 400 && x < 760 && z > 266 && z < 318)
    || leaves.some(l => (x - l.cx) ** 2 + (z - l.cz) ** 2 < l.r ** 2) || (x - hub[0]) ** 2 + (z - hub[1]) ** 2 < 40 ** 2;
  for (let i = 0; i < 18; i++) {
    const q = turf.pos((i + 0.5) / 18 * turf.L, W + 34), m = toMap(q); if (busy(m.x, m.z)) continue;
    const g = new THREE.Group(); g.position.set(q.x, 0, q.z); world.add(g);
    addBox(g, [0.8, 34, 0.8], [0, 17, 0], toon('#3b3552'));
    const head = new THREE.Group(); head.position.y = 34; g.add(head); const c = at(208, 146); head.lookAt(new V3(c.x, 0, c.z));
    addBox(head, [7, 3.4, 0.8], [0, 0, 0], toon('#2b2640')); addBox(head, [6.4, 2.8, 0.1], [0, 0, 0.46], glowMat('#fffbe8', 5));
  }

  // ---- 植栽：ナツメヤシ（コースのまわり・駐車場・道路の中央分離帯・馬場内）と、砂漠の低木 ----
  const palms = [], board = v(boardPos.x, boardPos.z), inTurf = p => inPoly(outerLawn, p);
  for (let n = 0; n < 900 && palms.length < 150; n++) {
    const q = turf.pos(rand(0, turf.L), W + rand(40, 70)), m = toMap(q), p = v(q.x, q.z);
    if (busy(m.x, m.z) || gap(turfRing, p) < W / 2 + 36) continue; palms.push(p);
  }
  for (let s = 20; s < hwL; s += 22) palms.push(hwA.clone().addScaledVector(hwDir, s));
  for (let i = 0; i < 18; i++) { const a = i / 18 * TAU, p = at(hub[0] + Math.cos(a) * 16, hub[1] + Math.sin(a) * 16); palms.push(p); }
  for (let x = 120; x <= 760; x += 16) palms.push(at(x, -282));
  // 馬場内：小径の円の脇と、内柵沿いにまばらに（ビジョンの前はあける）
  for (let n = 0; n < 400 && palms.length < 260; n++) {
    const x = rand(-120, 520), z = rand(30, 270), p = at(x, z);
    if (!inPoly(dirtRing, p) || gap(dirtRing, p) < W / 2 + 10 || p.distanceTo(board) < 34 || Math.hypot(x - 59, z - 99) < 45 || Math.random() < 0.5) continue;
    palms.push(p);
  }
  { const trunks = [], fronds = [];
    for (const p of palms) {
      const h = rand(9, 14), lean = [rand(-0.05, 0.05), 0, rand(-0.05, 0.05)];
      trunks.push({ p: new V3(p.x, 0, p.z), s: new V3(0.55, h, 0.55), r: lean });
      for (let j = 0; j < 7; j++) { const a = j / 7 * TAU + rand(0, 0.4); fronds.push({ p: new V3(p.x + Math.cos(a) * 2.4, h, p.z + Math.sin(a) * 2.4), s: new V3(4.4, 0.35, 0.9), r: [0, -a, -0.28] }); }
    }
    inst(new THREE.CylinderGeometry(1, 0.7, 1, 7).translate(0, 0.5, 0), toon('#9b7045'), trunks);
    inst(SPH_LO, toon('#4d8d5c'), fronds); }
  { const spots = [];
    for (let n = 0; n < 2400 && spots.length < 320; n++) {
      const x = rand(-1100, 1500), z = rand(-1000, 1100), p = at(x, z), m = { x, z };
      if (inTurf(p) || busy(m.x, m.z) || Math.abs(z - (-700 - (x + 1000) * 0.0908)) < 30) continue;
      spots.push({ p, s: rand(0.45, 0.9) });
    }
    roundTrees(spots, ['#5c6e3a', '#6f7f45', '#4f6234', '#7d8a4e'], '#6e5a42'); }

  // ---- 遠景（図鑑の全景では隠す）：北西のダウンタウン・ドバイとブルジュ・ハリファ、北のドバイフレーム、南東の砂丘 ----
  const far = (dx, dz, dist) => { const c = at(208, 146); return new V3(c.x + dx * dist * k, 0, c.z + dz * dist * k * track.turn); };
  { // ダウンタウン：ブルジュ・ハリファを囲む高層ビル群。窓の帯が光る
    const base = far(-0.267, -0.964, 2000), c = at(208, 146), city = new THREE.Group(); city.position.copy(base); world.add(backdrop(city));
    city.rotation.y = Math.atan2(c.x - base.x, c.z - base.z);
    const walls = [], bands = [], wallCol = ['#3a4560', '#46506b', '#2f3a52', '#55607a'].map(C);
    for (let i = 0; i < 46; i++) {
      const a = rand(0, TAU), r = rand(45, 230), x = Math.cos(a) * r, z = Math.sin(a) * r * 0.55, h = rand(35, 150) * (1 - r / 420), w = rand(12, 22);
      walls.push({ p: new V3(x, h / 2, z), s: new V3(w, h, w * 0.9), c: wallCol[i % 4] });
      for (let y = 6; y < h - 2; y += 7) bands.push({ p: new V3(x, y, z), s: new V3(w + 0.2, 1.1, w * 0.9 + 0.2) });
    }
    for (const m of [inst(BOX, toon('#ffffff', { fog: true }), walls, false), inst(BOX, glowMat('#f3ce89', 1.5), bands, false)]) { m.removeFromParent(); city.add(m); }
    // ブルジュ・ハリファ：3枚の翼が段ごとに短くなりながら、らせん状に細くなる。頂上の尖塔に赤い航空障害灯
    const burj = new THREE.Group(); city.add(burj); const body = toon('#9fb3c8', { fog: true }), lit = glowMat('#d6ecff', 1.5);
    let y = 0;
    for (let i = 0; i < 14; i++) {
      const h = 20 - i * 0.7;
      for (let j = 0; j < 3; j++) {
        const a = j * TAU / 3, len = Math.max(4, 40 * (1 - (i * 3 + j) / 44)), wing = addBox(burj, [len, h, 9 - i * 0.4], [Math.cos(a) * len / 2, y + h / 2, Math.sin(a) * len / 2], body, [0, -a, 0], 0);
        addBox(burj, [0.6, h * 0.9, 0.6], [Math.cos(a) * len, y + h / 2, Math.sin(a) * len], lit, null, 0); wing.castShadow = false;
      }
      addBox(burj, [8 - i * 0.3, 0.6, 8 - i * 0.3], [0, y + h, 0], lit, null, 0);
      y += h;
    }
    part(burj, new THREE.CylinderGeometry(0.8, 4, 64, 8), body, [0, y + 32, 0], null, null, 0);
    const beacon = part(burj, SPH_LO, glowMat('#ff4040', 3), [0, y + 66, 0], [1.6, 1.6, 1.6], null, 0);
    themeUpd.push(t => { beacon.visible = (t % 1.6) < 0.8; }); }
  { // ドバイフレーム：ザビール公園に立つ高さ150mの金色の額縁
    const p = far(-0.737, -0.676, 2300), c = at(208, 146), g = backdrop(new THREE.Group()); g.position.copy(p); g.rotation.y = Math.atan2(c.x - p.x, c.z - p.z); world.add(g);
    const gold = toon('#d9a63c', { fog: true }), edge = glowMat('#ffd77a', 1.6);
    for (const x of [-26, 26]) { addBox(g, [10, 76, 10], [x, 38, 0], gold, null, 0); addBox(g, [0.5, 72, 0.5], [x + (x < 0 ? 5.3 : -5.3), 38, -5.3], edge, null, 0); }
    addBox(g, [62, 10, 10], [0, 79, 0], gold, null, 0); addBox(g, [52, 0.5, 0.5], [0, 73.8, -5.3], edge, null, 0); }
  { // 砂丘：南東の遠く
    const cone = new THREE.ConeGeometry(1, 1, 9); cone.translate(0, 0.5, 0); const dunes = [];
    for (let i = 0; i < 14; i++) { const p = far(0.25 + rand(-0.5, 0.5), 1, rand(2400, 3000)); dunes.push({ p: new V3(p.x, -4, p.z), s: new V3(rand(160, 260), rand(18, 40), rand(110, 180)), r: [0, rand(0, 3), 0] }); }
    backdrop(inst(cone, toon('#a77c4e', { fog: true }), dunes, false)); }

  // ---- ドローンショー：ドバイワールドカップの夜空に、光の点が三日月と星・八芒星・駆ける馬を順に描く ----
  { const n = 180;
    // 折れ線の集まりの上に、n個の点を等間隔に並べる
    const sample = lines => {
      const segs = []; let total = 0;
      for (const l of lines) for (let i = 0; i < l.length - 1; i++) { const a = l[i], b = l[i + 1], d = Math.hypot(b[0] - a[0], b[1] - a[1]); segs.push([a, b, total, d]); total += d; }
      return Array.from({ length: n }, (_, i) => { const d = (i + 0.5) / n * total, sg = segs.find(s => d <= s[2] + s[3]) || segs[segs.length - 1], t = (d - sg[2]) / sg[3]; return [lerp(sg[0][0], sg[1][0], t), lerp(sg[0][1], sg[1][1], t)]; });
    };
    const arc = (cx, cy, r, a0, a1, m = 28) => Array.from({ length: m + 1 }, (_, i) => { const a = lerp(a0, a1, i / m); return [cx + Math.cos(a) * r, cy + Math.sin(a) * r]; });
    const star = (cx, cy, r1, r2, p) => Array.from({ length: p * 2 + 1 }, (_, i) => { const a = Math.PI / 2 + i * Math.PI / p, r = i % 2 ? r2 : r1; return [cx + Math.cos(a) * r, cy + Math.sin(a) * r]; });
    const horse = [[-38, 8], [-30, 14], [-18, 16], [0, 16], [14, 18], [22, 26], [30, 34], [36, 37], [46, 30], [42, 25], [33, 23], [28, 14], [27, 4], [36, -6], [44, -18], [38, -21], [27, -9], [18, -3], [6, -3], [-8, -3], [-18, -7], [-28, -19], [-37, -22], [-34, -13], [-26, -5], [-30, 2], [-44, 0], [-52, -8], [-48, 4], [-38, 8]];
    const shapes = [sample([arc(-8, 0, 36, 0.9, TAU - 0.9), arc(6, 0, 30, 0.95, TAU - 0.95), star(30, 4, 11, 4.5, 5)]),
      sample([[[-30, -30], [30, -30], [30, 30], [-30, 30], [-30, -30]], [[0, -42], [42, 0], [0, 42], [-42, 0], [0, -42]], arc(0, 0, 13, 0, TAU)]),
      sample([horse.map(([x, y]) => [x * 1.1, y * 1.1])])];
    const cols = ['#ffd36b', '#9fd8ff', '#ffffff'].map(c => C(c).multiplyScalar(2.6));
    const mesh = new THREE.InstancedMesh(SPH_LO, new THREE.MeshBasicMaterial({ color: 0xffffff }), n); mesh.frustumCulled = false; mesh.userData.droneIgnore = true; world.add(mesh);
    const c = at(208, 150), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new V3(0.75, 0.75, 0.75), p = new V3();
    themeUpd.push(t => {
      const cyc = t / 9, i0 = Math.floor(cyc) % 3, i1 = (i0 + 1) % 3, f = THREE.MathUtils.smootherstep(cyc % 1, 0.72, 1);
      mesh.material.color.copy(cols[i0]).lerp(cols[i1], f);
      for (let i = 0; i < n; i++) {
        const a = shapes[i0][i], b = shapes[i1][i], swirl = Math.sin(f * Math.PI) * 6;
        p.set(c.x + lerp(a[0], b[0], f) + Math.cos(i * 2.4) * swirl, 95 + lerp(a[1], b[1], f) + Math.sin(t * 2 + i) * 0.35 + Math.sin(i * 2.4) * swirl, c.z);
        m4.compose(p, q, sc); mesh.setMatrixAt(i, m4);
      }
      mesh.instanceMatrix.needsUpdate = true;
    }); }

  // 噴水：水柱がゆらゆらと高さを変える
  themeUpd.push(t => fount.forEach((j, i) => { j.scale.y = j.userData.h * (0.75 + 0.25 * Math.sin(t * 2.2 + i * 1.3)); }));
}
