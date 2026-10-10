// 沙田
'use strict';

// シャティンの地図座標（実寸m）：原点は4コーナー出口の中心線、x：スタンド前の直線の向き（ほぼ北東）、z：コースの内側（ほぼ南東、城門河の側）が正（コースの区間segsと同じ座標）。
// 直線500m・半径143.1mの半円のコーナーなので、楕円の中心は(250, 143.1)、向正面の中心線はz=286.2
function shatinAt(x, z) {
  const k = track.def.scale;
  return new V3(track.xs[0] + x * k, 0, track.zs[0] + z * k * track.turn);
}
function decorShatin(th) {
  // 配置はGoogleマップの衛星写真（芝の帯・城門河・建物の位置から縮尺を合わせた）とHKJCの場内図を参考にしたデフォルメ
  const at = shatinAt, k = track.def.scale, v = (x, z) => new V3(x, 0, z), TAU = Math.PI * 2;
  const route = (pts, closed = false) => {
    const ps = pts.map(([x, z]) => at(x, z)), curve = ps.length > 2 ? new THREE.CatmullRomCurve3(ps, closed, 'centripetal') : new THREE.LineCurve3(ps[0], ps[1]);
    const sp = curve.getSpacedPoints(Math.ceil(curve.getLength() / 1.5)); if (closed) sp.push(sp[0].clone());
    return decorPath(sp);
  };
  // 地図の向きにそろえた飾りのグループ：ローカルのxは地図のx（直線の向き）、+zはコースの外側（北西）
  const group = (name, x, z, ang = 0) => {
    const g = new THREE.Group(); g.position.copy(at(x, z)); g.rotation.y = -ang * track.turn; g.scale.z = track.sgn; world.add(g);
    return name ? registerLandmark(g, name) : g;
  };
  // 平らな面（穴あきも可）。芝生・池・道路などの地面の塗り分け
  const flat = (poly, color, lift = 0.03, holes = []) => {
    const shape = new THREE.Shape(poly.map(p => new THREE.Vector2(p.x, p.z)));
    for (const h of holes) shape.holes.push(new THREE.Path(h.map(p => new THREE.Vector2(p.x, p.z))));
    const geo = new THREE.ShapeGeometry(shape), pp = geo.attributes.position;
    for (let i = 0; i < pp.count; i++) pp.setXYZ(i, pp.getX(i), lift, pp.getY(i));
    geo.computeVertexNormals();
    const m = new THREE.Mesh(geo, toon(color, { side: THREE.DoubleSide })); m.receiveShadow = true; world.add(m); return m;
  };
  // 地図上の楕円（回転つき）：ワールドの点列と、地図の点列
  const ellMap = (cx, cz, rx, rz, rot = 0, n = 40) => Array.from({ length: n }, (_, i) => {
    const a = i / n * TAU, x = Math.cos(a) * rx, z = Math.sin(a) * rz;
    return [cx + x * Math.cos(rot) - z * Math.sin(rot), cz + x * Math.sin(rot) + z * Math.cos(rot)];
  });
  const ell = (...a) => ellMap(...a).map(([x, z]) => at(x, z));
  const poly3 = pts => pts.map(([x, z]) => at(x, z));
  // 細い帯（遊歩道・道路・線路）：地図の点列に沿って幅wid（ワールド単位）の帯を敷く
  const ribbon = (path, wid, mat, lift = 0.08) => decorCourseLane(path, 'dirt', 0, path.L, { lanes: [W / 2 - wid / 2, W / 2 + wid / 2], cols: 1, step: 2, onGround: true, lift, mat });
  const backdrop = o => { o.userData.backdrop = true; return o; };
  const dbl = c => toon(c, { side: THREE.DoubleSide });
  const white = toon('#f1f0ea'), steel = toon('#9aa3a8'), railMat = toon(th.rail);
  const railAlong = (path, lanes, s0 = 0, s1 = path.L) => {
    for (const ln of lanes) {
      const pts = []; for (let s = s0; s < s1; s += 3) { const q = path.pos(s, ln); pts.push(new V3(q.x, 1, q.z)); }
      const q = path.pos(s1, ln); pts.push(new V3(q.x, 1, q.z));
      world.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), pts.length * 2, 0.09, 6, false), railMat));
    }
  };

  // 地図の主な線：城門河の手前の岸と向こう岸（川は北東へ向かって少しずつコースから離れる）、東鉄線、吐露港公路と大埔公路
  const zN = x => 376 + 0.116 * x, zF = x => zN(x) + 235, RZ = -262, HZ = -338, HZ2 = x => zF(x) + 48;
  // 楕円の中心線からの符号つき距離（外側が正）
  const ovalD = (x, z) => x < 0 ? Math.hypot(x, z - 143.1) - 143.1 : x > 500 ? Math.hypot(x - 500, z - 143.1) - 143.1 : Math.max(-z, z - 286.2);

  // ---- 馬場内のオールウェザーコースと調教用の砂のコース、直線1000mの引き込み線 ----
  const awtMat = toon('#ffffff', { map: ctex(256, 256, g => { g.fillStyle = '#8c6a4c'; g.fillRect(0, 0, 256, 256); for (let y = 0; y < 256; y += 6) { g.fillStyle = `rgba(${Math.random() < 0.5 ? '60,40,25' : '170,130,95'},${rand(0.05, 0.14)})`; g.fillRect(0, y, 256, rand(1, 3)); } speck(g, 256, 256, 1600, ['#6e5038', '#a8805b', '#58402c'], 1, 3, 0.7); }, true), side: THREE.DoubleSide });
  const sandMat = toon('#ffffff', { map: ctex(256, 256, g => { g.fillStyle = '#c4a57c'; g.fillRect(0, 0, 256, 256); for (let y = 0; y < 256; y += 8) { g.fillStyle = `rgba(120,90,55,${rand(0.05, 0.12)})`; g.fillRect(0, y, 256, rand(1, 2)); } speck(g, 256, 256, 900, ['#d8bd94', '#a8885f'], 1, 2, 0.6); }, true), side: THREE.DoubleSide });
  decorCourseLane(track, 'dirt', 0, track.L, { lanes: [-2.4, -13.2], cols: 4, step: 1.5, onGround: true, lift: 0.03, mat: awtMat });
  decorCourseLane(track, 'dirt', 0, track.L, { lanes: [-14.8, -21.2], cols: 2, step: 1.5, onGround: true, lift: 0.03, mat: sandMat });
  for (const ln of [-1.9, -13.7, -14.3, -21.7]) decorInnerRail(ln, th.rail);
  // 直線1000mの引き込み線：スタンド前の直線を3〜4コーナーの奥（南西）へまっすぐ延ばす。ここから直線だけを走ってゴールへ
  const chute = route([[-570, 0], [0, 0]]);
  decorCourseLane(chute, 'turf', 0, chute.L, { lanes: [-1.6, W + 1.6], cols: 6, step: 1.5, onGround: true, lift: 0.1, mat: decorTurfMat(), hide: onMainTurf });
  railAlong(chute, [-0.9, W + 0.9], 0, chute.L - 2);
  // 引き込み線の先端の発走ゲート（直線1000mの発走地点）
  { const g = group('直線1000mの発走地点', -556, 0), frame = toon('#e8e6df'), green = toon('#2f7a4a');
    for (let i = 0; i <= 14; i++) addBox(g, [3.2, 2.6, 0.18], [0, 1.6, -W / 2 + i * W / 14], frame, null, 0);
    addBox(g, [3.6, 0.5, W + 1], [0, 3.1, 0], green, null, 0); addBox(g, [3.4, 0.25, W + 0.6], [0, 0.35, 0], green, null, 0);
    for (const z of [-W / 2 - 0.6, W / 2 + 0.6]) addBox(g, [3.4, 3.4, 0.6], [0, 1.7, z], green, null, 0); }

  // ---- 馬場内：ペンフォールド公園（池と湿地、遊歩道、涼亭）。レースのない日は市民の公園になる ----
  const lanePoly = (lane, step = 3) => { const a = []; for (let s = 0; s < track.L; s += step) { const q = track.pos(s, lane); a.push(v(q.x, q.z)); } return a; };
  flat(lanePoly(-21.8), '#6fae5c', 0.02);
  const ponds = [[118, 152, 46, 22, 0.25], [252, 168, 58, 22, -0.12], [350, 166, 24, 12, 0.15]];
  for (const [x, z, rx, rz, r] of ponds) { flat(ell(x, z, rx + 7, rz + 7, r), '#8ab86a', 0.04); flat(ell(x, z, rx, rz, r), '#4f93a4', 0.06); }
  const walk = toon('#e3d8c2', { side: THREE.DoubleSide });
  ribbon(route(ellMap(240, 143, 178, 60), true), 1.5, walk);
  ribbon(route([[70, 143], [150, 115], [215, 120], [300, 140], [410, 143]]), 1.2, walk);
  // 湿地のアシ：池の縁に細い葉の束
  { const reeds = [];
    for (const [x, z, rx, rz, r] of ponds) for (let i = 0; i < 46; i++) {
      const a = rand(0, TAU), f = rand(0.95, 1.18), px = Math.cos(a) * rx * f, pz = Math.sin(a) * rz * f, p = at(x + px * Math.cos(r) - pz * Math.sin(r), z + px * Math.sin(r) + pz * Math.cos(r));
      reeds.push({ p, s: new V3(0.18, rand(1.2, 2.2), 0.18), r: [rand(-0.2, 0.2), 0, rand(-0.2, 0.2)] });
    }
    inst(new THREE.CylinderGeometry(0.4, 1, 1, 4).translate(0, 0.5, 0), toon('#7d9a4a'), reeds, false); }
  // 涼亭：池のほとりの赤い柱と緑の瓦屋根のあずまや
  { const g = group('ペンフォールド公園', 178, 140); landmarkFoundation(g, 10, 10, '#d8cdb6');
    for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; part(g, new THREE.CylinderGeometry(0.22, 0.22, 3.4, 8), toon('#b8322a'), [Math.cos(a) * 3, 1.7, Math.sin(a) * 3], null, null, 0); }
    part(g, new THREE.CylinderGeometry(4.4, 4.4, 0.4, 6), toon('#2f6a4f'), [0, 3.6, 0], null, null, 0);
    part(g, new THREE.ConeGeometry(4.6, 2.6, 6), toon('#3b7d5a'), [0, 5.1, 0], null, null, 0);
    part(g, SPH_LO, toon('#d9a63c'), [0, 6.6, 0], [0.4, 0.4, 0.4], null, 0);
    landmarkFlowers(g, 7, 7, '#e86fa6'); }
  // 池に架かる石の橋
  { const g = group(null, 252, 168, Math.PI / 2); addBox(g, [30, 0.5, 2.4], [0, 0.9, 0], toon('#d8d0bf'), null, 0);
    for (const z of [-1.2, 1.2]) addBox(g, [30, 0.7, 0.2], [0, 1.4, z], toon('#c9c0aa'), null, 0); }
  // シラサギ：池の上を輪を描いて飛び、岸辺にもたたずむ
  const egrets = [];
  { const wm = toon('#ffffff'), bill = toon('#e2b13c');
    for (let i = 0; i < 9; i++) {
      const b = new THREE.Group(), [px, pz] = ponds[i % 3]; world.add(b); b.userData.droneIgnore = true;
      part(b, SPH_LO, wm, [0, 0, 0], [0.7, 0.32, 0.3], null, 0); part(b, SPH_LO, wm, [0.75, 0.2, 0], [0.18, 0.16, 0.16], null, 0);
      addBox(b, [0.35, 0.06, 0.06], [1.05, 0.2, 0], bill, null, 0);
      const wings = [-1, 1].map(s => { const w = new THREE.Group(); w.position.set(0, 0.1, 0.12 * s); b.add(w); addBox(w, [0.6, 0.05, 1.3], [0, 0, 0.65 * s], wm, null, 0); return w; });
      egrets.push({ b, wings, c: at(px, pz), r: rand(14, 26), h: rand(9, 16), sp: rand(0.25, 0.4) * (i % 2 ? 1 : -1), ph: rand(0, TAU) });
    }
    const stand = [];
    for (let i = 0; i < 8; i++) { const [x, z, rx, rz] = ponds[i % 3], a = rand(0, TAU), p = at(x + Math.cos(a) * rx * 0.96, z + Math.sin(a) * rz * 0.96);
      stand.push({ p: new V3(p.x, 1.1, p.z), s: new V3(0.32, 0.55, 0.3) }); stand.push({ p: new V3(p.x, 0.5, p.z), s: new V3(0.05, 0.5, 0.05) }); }
    inst(SPH_LO, wm, stand, false); }

  // ---- スタンドの裏：大屋根のパレードリング・沙田会所・東鉄線の馬場駅 ----
  // パレードリング：グランドスタンドの裏。楕円の周回路と芝、白い柵、段々の観覧席を大きな楕円の屋根が覆う
  { const g = group('パレードリング', 232, -198), rx = 22, rz = 13; landmarkFoundation(g, 62, 42, '#cfc6b4');
    part(g, new THREE.CircleGeometry(1, 48), toon('#b89b72'), [0, 0.05, 0], [rx, rz, 1], [-Math.PI / 2, 0, 0], 0);
    part(g, new THREE.CircleGeometry(1, 48), toon('#5fae5a'), [0, 0.1, 0], [rx - 3.5, rz - 3.5, 1], [-Math.PI / 2, 0, 0], 0);
    for (const r of [0, 3.6]) { const rail = []; for (let i = 0; i < 48; i++) { const a = i / 48 * TAU; rail.push(new V3(Math.cos(a) * (rx - r), 1.1, Math.sin(a) * (rz - r))); } g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(rail, true), 96, 0.1, 4, true), white)); }
    const steps = [];
    for (let j = 0; j < 5; j++) for (let i = 0; i < 44; i++) {
      const a = (i + 0.5) / 44 * TAU, ex = rx + 3 + j * 1.6, ez = rz + 3 + j * 1.6, h = 0.5 + j * 0.6;
      steps.push({ p: new V3(Math.cos(a) * ex, h / 2, Math.sin(a) * ez), s: new V3(TAU * (ex + ez) / 2 / 44 + 0.3, h, 1.5), r: [0, -Math.atan2(Math.cos(a) * ez, -Math.sin(a) * ex), 0] });
    }
    g.add(inst(BOX, toon('#e6e0d2'), steps, false));
    // 大屋根：周りの柱で支える楕円の輪。中央は明かり取りに開ける
    for (let i = 0; i < 14; i++) { const a = i / 14 * TAU; addBox(g, [0.7, 15, 0.7], [Math.cos(a) * (rx + 11), 7.5, Math.sin(a) * (rz + 9)], steel, null, 0); }
    part(g, new THREE.RingGeometry(0.45, 1, 64), dbl('#d5e3df'), [0, 15.2, 0], [rx + 13, rz + 10, 1], [-Math.PI / 2, 0, 0], 0.02);
    // 周回する出走馬
    const herd = [];
    for (let i = 0; i < 5; i++) { const h = landmarkHorse(g, [0, 0.2, 0], 'walk', ['#6b4a35', '#3b2a20', '#8a5a3a', '#c9a27a', '#4a3226'][i], 0.42); h.children[0].visible = false; h.userData.droneIgnore = true; herd.push(h); }
    themeUpd.push(t => herd.forEach((h, i) => { const a = t * 0.1 + i * TAU / 5; h.position.set(Math.cos(a) * (rx - 1.8), 0.2, Math.sin(a) * (rz - 1.8)); h.rotation.y = -Math.atan2(Math.cos(a) * (rz - 1.8), -Math.sin(a) * (rx - 1.8)); })); }
  // 沙田会所（クラブハウス）：1コーナー寄りの外。ガラスの帯が重なる会員用の建物
  { const g = group('沙田会所', 600, -128), wall = toon('#e9e5da'), glass = toon('#6f97a6');
    landmarkFoundation(g, 40, 28, '#cfc6b4');
    addBox(g, [36, 8, 24], [0, 4, 0], wall, null, 0);
    for (let i = 0; i < 5; i++) { addBox(g, [32 - i * 2, 3.4, 20 - i], [0, 9.7 + i * 3.8, 0], glass, null, 0); addBox(g, [34 - i * 2, 0.5, 22 - i], [0, 11.7 + i * 3.8, 0], wall, null, 0); }
    addBox(g, [30, 1, 22], [0, 28.4, 1], wall, null, 0); landmarkFlowers(g, 18, 13, '#e86fa6'); }
  // スタンド裏の屋根付きの連絡通路：馬場駅からスタンドへ
  for (const x of [60, 150]) { const g = group(null, x, -200, Math.PI / 2); addBox(g, [96 * k, 0.5, 5], [0, 5, 0], white, null, 0); for (let s = -20; s <= 20; s += 8) for (const z of [-2.2, 2.2]) addBox(g, [0.4, 5, 0.4], [s, 2.5, z], steel, null, 0); }

  // ---- 東鉄線（MTR East Rail Line）：スタンドの裏の複線と、競馬開催日だけ止まる馬場駅、行き交う9両編成の電車 ----
  { const line = [[-1500, RZ], [1800, RZ]];
    ribbon(route(line), 8, dbl('#9b958c'), 0.05);
    for (const dz of [-4, 4]) ribbon(route(line.map(([x, z]) => [x, z + dz])), 1.8, dbl('#5c5650'), 0.1);
    // 架線柱（駅の中は屋根が支える）
    const masts = [], arms = [];
    for (let x = -1500; x <= 1800; x += 50) { if (x > 20 && x < 240) continue; for (const dz of [-11, 11]) { const p = at(x, RZ + dz); masts.push({ p: new V3(p.x, 3.6, p.z), s: new V3(0.35, 7.2, 0.35) }); } const p = at(x, RZ); arms.push({ p: new V3(p.x, 7, p.z), s: new V3(0.3, 0.3, 11 * k * 2 + 0.4) }); }
    inst(BOX, steel, masts, false); inst(BOX, steel, arms, false);
    // 馬場駅：線路の両側の長いホームと、白い屋根
    const g = group('馬場駅', 130, RZ), plat = toon('#d6d1c6'), len = 210 * k;
    for (const z of [-5.6, 5.6]) { addBox(g, [len, 1.1, 4], [0, 0.55, z], plat, null, 0); addBox(g, [len, 0.12, 0.5], [0, 1.16, z - Math.sign(z) * 1.6], toon('#f2c641'), null, 0); }
    for (let x = -len / 2 + 3; x <= len / 2 - 3; x += 9) for (const z of [-7, 7]) addBox(g, [0.4, 6, 0.4], [x, 3, z], steel, null, 0);
    addBox(g, [len + 2, 0.5, 15], [0, 6.2, 0], white, [0, 0, 0], 0);
    addBox(g, [len + 2.4, 0.8, 0.4], [0, 6.2, 7.6], toon('#d4263c'), null, 0); addBox(g, [len + 2.4, 0.8, 0.4], [0, 6.2, -7.6], toon('#d4263c'), null, 0); }
  { // 9両編成の電車：白い車体に窓の帯、青と赤の線。2本が反対向きに行き交う
    const body = toon('#eef1f3'), win = toon('#2b3440'), blue = toon('#2a5caa'), red = toon('#d4263c'), carL = 11.5, n = 9;
    const trains = [0, 1].map(i => {
      const g = new THREE.Group(); world.add(g); g.userData.droneIgnore = true;
      for (let c = 0; c < n; c++) {
        const x = (c - (n - 1) / 2) * (carL + 0.4);
        addBox(g, [carL, 3.4, 2.8], [x, 2.1, 0], body, null, 0.03); addBox(g, [carL - 1.2, 0.9, 2.86], [x, 2.7, 0], win, null, 0);
        addBox(g, [carL, 0.32, 2.86], [x, 1.35, 0], blue, null, 0); addBox(g, [carL, 0.12, 2.86], [x, 1.7, 0], red, null, 0);
        addBox(g, [carL - 1, 0.3, 2.2], [x, 3.95, 0], steel, null, 0);
      }
      for (const s of [-1, 1]) addBox(g, [0.2, 2.2, 2.4], [s * (n * (carL + 0.4) / 2 - 0.1), 2.5, 0], win, null, 0);
      return { g, dir: i ? -1 : 1, z: RZ + (i ? 4 : -4), off: i * 900 };
    });
    // 線路の端から端まで走り、馬場駅に止まる（地図のmで1周3300m＋待ち時間）
    const x0 = -1500, x1 = 1800, stopX = 130, sp = 34, dwell = 8, Lr = x1 - x0;
    themeUpd.push(t => trains.forEach(tr => {
      const cyc = Lr / sp + dwell, u = mod(t + tr.off / sp, cyc), dStop = (tr.dir > 0 ? stopX - x0 : x1 - stopX) / sp;
      const d = u < dStop ? u * sp : u < dStop + dwell ? dStop * sp : (u - dwell) * sp, x = tr.dir > 0 ? x0 + d : x1 - d;
      tr.g.position.copy(at(x, tr.z)); tr.g.rotation.y = tr.dir > 0 ? 0 : Math.PI;
    })); }

  // ---- 道路と車の流れ：スタンド側の大埔公路（9号幹線）と、城門河の向こうの吐露港公路（2号幹線） ----
  const road = dbl('#5a5d63'), median = dbl('#6c9a58');
  const traffic = (pts, n, lanes) => {
    const a = at(...pts[0]), b = at(...pts[1]), dir = b.clone().sub(a), L = dir.length(); dir.normalize();
    const nrm = new V3(-dir.z, 0, dir.x), cols = ['#f4f4f2', '#2f3438', '#c8302c', '#c8302c', '#9aa3ab', '#3b5f8f', '#e9e2cf', '#2c6b4a'].map(C);
    const cars = [], mesh = new THREE.InstancedMesh(BOX, toon('#ffffff'), n), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), p = new V3();
    mesh.frustumCulled = false; mesh.userData.droneIgnore = true; world.add(mesh);
    for (let i = 0; i < n; i++) {
      const d = i % 2 ? 1 : -1, bus = i % 7 === 0;
      // 二階建てバス（クリーム色と赤）と、赤い車体の香港のタクシーを混ぜる
      cars.push({ s: rand(0, L), d, lane: d * rand(lanes[0], lanes[1]), sp: bus ? rand(9, 11) : rand(12, 17), sc: bus ? new V3(5.5, 4.2, 1.3) : new V3(2.4, 0.9, 1.1) });
      mesh.setColorAt(i, bus ? C('#e9dcb4') : cols[i % cols.length]);
    }
    q.setFromAxisAngle(new V3(0, 1, 0), -Math.atan2(dir.z, dir.x));
    themeUpd.push(t => { cars.forEach((c, i) => { const s = mod(c.s + c.d * c.sp * t, L); p.copy(a).addScaledVector(dir, s).addScaledVector(nrm, c.lane); p.y = c.sc.y / 2 + 0.15; m4.compose(p, q, c.sc); mesh.setMatrixAt(i, m4); }); mesh.instanceMatrix.needsUpdate = true; });
  };
  { const r9 = [[-1600, HZ], [1900, HZ]];
    ribbon(route(r9), 18, road, 0.06); ribbon(route(r9), 1.6, median, 0.1); traffic(r9, 70, [2.5, 8]);
    const posts = [];
    for (let x = -1600; x <= 1900; x += 60) for (const dz of [-20, 20]) { const p = at(x, HZ + dz); posts.push({ p: new V3(p.x, 4.5, p.z), s: new V3(0.3, 9, 0.3) }); }
    inst(BOX, steel, posts, false);
    const r2 = [[-1600, HZ2(-1600)], [2200, HZ2(2200)]];
    ribbon(route(r2), 18, road, 0.06); ribbon(route(r2), 1.6, median, 0.1); traffic(r2, 70, [2.5, 8]); }

  // ---- 城門河：向正面の外を流れる川。川沿いの遊歩道と自転車道、川面を進むドラゴンボート ----
  flat(poly3([[-1600, zN(-1600)], [2200, zN(2200)], [2200, zF(2200)], [-1600, zF(-1600)]]), '#3f7d93', 0.04);
  for (const off of [-3, 3]) { const z = off < 0 ? zN : zF; flat(poly3([[-1600, z(-1600) + off * 3], [2200, z(2200) + off * 3], [2200, z(2200)], [-1600, z(-1600)]]), '#c9c3b5', 0.05); }
  ribbon(route([[-1600, zN(-1600) - 16], [2200, zN(2200) - 16]]), 3, walk, 0.07);
  ribbon(route([[-1600, zN(-1600) - 22], [2200, zN(2200) - 22]]), 2, dbl('#c46a55'), 0.07);
  ribbon(route([[-1600, zF(-1600) + 16], [2200, zF(2200) + 16]]), 3, walk, 0.07);
  // ドラゴンボート訓練センター：向こう岸の艇庫と浮き桟橋
  { const g = group('ドラゴンボート訓練センター', 250, zF(250) + 26, -0.116), roof = toon('#2f6a8f');
    landmarkFoundation(g, 34, 16, '#cfc6b4');
    addBox(g, [30, 7, 12], [0, 3.5, 0], white, null, 0); addBox(g, [32, 0.8, 14], [0, 7.4, 0], roof, null, 0);
    for (let i = 0; i < 4; i++) addBox(g, [5.5, 4.5, 0.2], [-10.5 + i * 7, 2.25, -6.1], toon('#4f5c66'), null, 0);
    for (const x of [-8, 8]) addBox(g, [3, 0.4, 16], [x, 0.3, -16], toon('#cbbf9f'), null, 0); }
  { // ドラゴンボート：竜の頭と尾の細長い舟。太鼓打ちの合図で漕ぎ手が櫂をそろえ、川を行き来する
    const cols = ['#c8302c', '#e0a52a', '#2f8a5a', '#2a5caa'], skin = toon('#e2b48c'), shirt = ['#f4f4f2', '#ffd24a', '#ffffff', '#ff7a45'];
    const ang = Math.atan2(0.116 * track.turn, 1), boats = [];
    for (let i = 0; i < 4; i++) {
      const g = new THREE.Group(); world.add(g); g.userData.droneIgnore = true; const hull = toon(cols[i]);
      addBox(g, [12, 0.7, 1.3], [0, 0.35, 0], hull, null, 0.04); addBox(g, [12.2, 0.15, 1.4], [0, 0.75, 0], toon('#f2d27a'), null, 0);
      // 竜の頭と尾
      part(g, new THREE.ConeGeometry(0.45, 1.6, 6), hull, [6.6, 1.4, 0], null, [0, 0, -1.1], 0.04); part(g, SPH_LO, hull, [7.2, 1.9, 0], [0.55, 0.45, 0.4], null, 0.04);
      part(g, SPH_LO, toon('#ffffff'), [7.5, 2.05, 0.28], [0.12, 0.12, 0.12], null, 0); part(g, SPH_LO, toon('#ffffff'), [7.5, 2.05, -0.28], [0.12, 0.12, 0.12], null, 0);
      part(g, new THREE.ConeGeometry(0.3, 1.6, 5), hull, [-6.5, 1.2, 0], null, [0, 0, 0.9], 0.04);
      const paddles = [];
      for (let j = 0; j < 10; j++) for (const s of [-1, 1]) {
        const x = -4.8 + j * 1.0, p = new THREE.Group(); p.position.set(x, 0.8, s * 0.38); g.add(p);
        part(p, CAPS_SHATIN, toon(shirt[i]), [0, 0.45, 0], [0.22, 0.32, 0.22], null, 0); part(p, SPH_LO, skin, [0, 0.95, 0], [0.16, 0.16, 0.16], null, 0);
        const oar = addBox(p, [0.08, 1.3, 0.08], [0.15, 0.2, s * 0.45], toon('#8a6a45'), [0, 0, 0], 0); paddles.push({ p, oar, s });
      }
      // 舳先の太鼓打ちと艫の舵取り
      part(g, new THREE.CylinderGeometry(0.4, 0.4, 0.5, 10), toon('#b8322a'), [5.4, 1.05, 0], null, [0, 0, Math.PI / 2], 0);
      part(g, CAPS_SHATIN, toon('#ffffff'), [6, 1.2, 0], [0.22, 0.32, 0.22], null, 0); part(g, CAPS_SHATIN, toon('#ffffff'), [-5.8, 1.3, 0], [0.24, 0.38, 0.24], null, 0);
      boats.push({ g, paddles, d: i % 2 ? -1 : 1, lane: (i - 1.5) * 26, x: rand(-700, 1300), sp: rand(4.5, 6) / k, ph: rand(0, TAU) });
    }
    const bx0 = -900, bx1 = 1500;
    themeUpd.push(t => boats.forEach(b => {
      const x = b.d > 0 ? bx0 + mod(b.x - bx0 + b.sp * t, bx1 - bx0) : bx1 - mod(bx1 - b.x + b.sp * t, bx1 - bx0);
      b.g.position.copy(at(x, zN(x) + 117 + b.lane)); b.g.position.y = 0.05; b.g.rotation.y = -ang + (b.d > 0 ? 0 : Math.PI);
      const st = t * 5.2 + b.ph; b.paddles.forEach(o => { o.p.rotation.z = Math.sin(st) * 0.45; o.oar.rotation.x = o.s * (0.55 + Math.cos(st) * 0.25); });
    })); }

  // ---- 北東：香港賽馬会の厩舎（何階建ての馬房棟と丸い屋根のウォーキングマシン）、馬のプール、調教用の小さな楕円の馬場 ----
  { const g = group('香港賽馬会の厩舎', 900, -140), wall = toon('#ece4d2'), roof = toon('#5f8f6f'), win = toon('#6c5a48');
    landmarkFoundation(g, 150, 100, '#cfc6b4');
    for (const [x, z, w] of [[-45, 22, 50], [15, 30, 46], [55, -10, 36], [-30, -26, 44]]) {
      addBox(g, [w, 13, 11], [x, 6.5, z], wall, null, 0); addBox(g, [w + 1, 0.6, 12], [x, 13.3, z], roof, null, 0);
      for (let f = 0; f < 3; f++) for (let i = 0; i < Math.floor(w / 3.2); i++) addBox(g, [1.6, 1.6, 0.15], [x - w / 2 + 1.8 + i * 3.2, 2 + f * 4, z - 5.6], win, null, 0);
    }
    // ウォーキングマシン：丸い屋根の下を馬が輪になって歩く
    const walkers = [];
    for (const [x, z] of [[-55, -2], [-18, 0], [25, 4], [-5, -45], [45, -42]]) {
      for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; addBox(g, [0.4, 4.5, 0.4], [x + Math.cos(a) * 7, 2.25, z + Math.sin(a) * 7], steel, null, 0); }
      part(g, new THREE.ConeGeometry(8.6, 2.6, 16), roof, [x, 5.8, z], null, null, 0);
      part(g, new THREE.RingGeometry(3.2, 6.2, 24), toon('#c8a87c'), [x, 0.08, z], null, [-Math.PI / 2, 0, 0], 0);
      for (let i = 0; i < 3; i++) { const h = landmarkHorse(g, [x, 0.15, z], 'walk', ['#6b4a35', '#3b2a20', '#8a5a3a'][i], 0.36); h.children[0].visible = false; h.userData.droneIgnore = true; walkers.push({ h, x, z, a: i / 3 * TAU }); }
    }
    themeUpd.push(t => walkers.forEach(w => { const a = w.a + t * 0.35; w.h.position.set(w.x + Math.cos(a) * 4.7, 0.15, w.z + Math.sin(a) * 4.7); w.h.rotation.y = -Math.atan2(Math.cos(a), -Math.sin(a)); })); }
  // 馬のプール：丸い水槽を馬が泳いで回る（調教とリハビリ用）
  { const g = group('馬のプール', 735, 30), rp = 12; landmarkFoundation(g, 30, 30, '#cfc6b4');
    part(g, new THREE.CylinderGeometry(rp + 1, rp + 1, 1.2, 40), toon('#e4ded0'), [0, 0.6, 0], null, null, 0);
    const water = part(g, new THREE.CircleGeometry(rp, 40), toon('#57b7cf'), [0, 1.22, 0], null, [-Math.PI / 2, 0, 0], 0); water.receiveShadow = true;
    part(g, new THREE.CylinderGeometry(4, 4, 1.3, 24), toon('#d9d2c2'), [0, 0.65, 0], null, null, 0);
    part(g, new THREE.ConeGeometry(rp + 3, 3, 24, 1, true), dbl('#d5e3df'), [0, 9, 0], null, null, 0);
    for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; addBox(g, [0.4, 8, 0.4], [Math.cos(a) * (rp + 1.6), 4, Math.sin(a) * (rp + 1.6)], steel, null, 0); }
    const swim = [];
    for (let i = 0; i < 2; i++) { const h = landmarkHorse(g, [0, -0.2, 0], 'walk', ['#5a3b28', '#8a5a3a'][i], 0.45); h.children[0].visible = false; h.userData.droneIgnore = true; swim.push(h); }
    themeUpd.push(t => swim.forEach((h, i) => { const a = t * 0.18 + i * Math.PI, r = 8; h.position.set(Math.cos(a) * r, -0.35 + Math.sin(t * 3 + i) * 0.06, Math.sin(a) * r); h.rotation.y = -Math.atan2(Math.cos(a), -Math.sin(a)); })); }
  // 調教用の小さな楕円の馬場：砂の周回路の内側は芝生
  flat(ell(810, 205, 62, 40, 0.2), '#c4a57c', 0.05); flat(ell(810, 205, 48, 27, 0.2), '#79b465', 0.07);

  // ---- 高層住宅：スタンド側の駿景園と銀禧花園、川向こうの碧濤花園など。十字形の平面のタワーに窓の帯 ----
  const towers = [], bands = [], wallCol = ['#e9e3d6', '#d9d3c6', '#c9d4d8', '#e8d9c8', '#d5dccc'].map(C);
  const estate = (name, cx, cz, n, rr, h0, h1) => {
    const spots = [];
    for (let i = 0; i < n; i++) { const a = i / n * TAU + rand(-0.3, 0.3), r = i ? rand(0.45, 1) * rr : 0; spots.push([cx + Math.cos(a) * r, cz + Math.sin(a) * r * 0.7]); }
    spots.forEach(([x, z], i) => {
      const p = at(x, z), h = rand(h0, h1), w = rand(10, 13), c = wallCol[(i + n) % wallCol.length];
      for (const [sx, sz] of [[w, w * 0.45], [w * 0.45, w]]) towers.push({ p: new V3(p.x, h / 2, p.z), s: new V3(sx, h, sz), c });
      for (let y = 4; y < h - 2; y += 3.2) bands.push({ p: new V3(p.x, y, p.z), s: new V3(w + 0.15, 0.7, w * 0.45 + 0.15) }, { p: new V3(p.x, y, p.z), s: new V3(w * 0.45 + 0.15, 0.7, w + 0.15) });
    });
    if (name) { const g = new THREE.Group(); g.position.copy(at(cx, cz)); world.add(g); registerLandmark(g, name); }
  };
  estate('駿景園', -40, -520, 9, 95, 70, 92); estate('銀禧花園', -520, -480, 8, 85, 55, 72);
  estate(null, 420, -560, 7, 110, 60, 85); estate(null, -900, -520, 7, 100, 55, 80);
  estate('碧濤花園', -180, zF(-180) + 150, 8, 90, 50, 66); estate(null, -700, zF(-700) + 140, 7, 100, 55, 78);
  // 沙田医院：向こう岸の北東の白い病棟
  { const g = group('沙田医院', 760, zF(760) + 135, -0.116); landmarkFoundation(g, 46, 24, '#cfc6b4');
    for (const [x, h] of [[-12, 34], [10, 42]]) { addBox(g, [18, h, 16], [x, h / 2, 0], white, null, 0); for (let y = 4; y < h - 2; y += 3.4) addBox(g, [18.2, 1.2, 16.2], [x, y, 0], toon('#7fa2b2'), null, 0); }
    addBox(g, [5, 5, 0.3], [10, 36, -8.2], toon('#c8302c'), null, 0); addBox(g, [1.4, 3.8, 0.4], [10, 36, -8.3], white, null, 0); addBox(g, [3.8, 1.4, 0.4], [10, 36, -8.3], white, null, 0); }
  inst(BOX, toon('#ffffff'), towers, false); inst(BOX, toon('#6f7f8c'), bands, false);

  // ---- 植栽：コースのまわり・川沿いの並木（ピンクの花の洋紫荊を混ぜる）・馬場内の公園 ----
  const board = v(boardPos.x, boardPos.z);
  const busy = (x, z) => {
    const d = ovalD(x, z);
    return (d > -66 && d < 34) || (x < 10 && x > -600 && Math.abs(z) < 36) || (x > 50 && x < 660 && z < -20 && z > -250)
      || Math.abs(z - RZ) < 24 || Math.abs(z - HZ) < 30 || (z > zN(x) - 30 && z < HZ2(x) + 28)
      || (x > 640 && x < 1020 && z > -240 && z < 280) || Math.hypot(x + 40, z + 520) < 150 || Math.hypot(x + 520, z + 480) < 135
      || Math.hypot(x - 420, z + 560) < 160 || Math.hypot(x + 900, z + 520) < 150 || (z > zF(x) + 60 && Math.abs(x + 180) < 140) || (z > zF(x) + 60 && Math.abs(x + 700) < 150)
      || (Math.abs(x - 760) < 50 && z > zF(x) + 80 && z < zF(x) + 190);
  };
  const outside = [], parkTrees = [], bloom = [];
  for (let n = 0; n < 3000 && outside.length < 360; n++) {
    const x = rand(-1100, 1500), z = rand(-760, 960); if (busy(x, z) || ovalD(x, z) < 0) continue;
    outside.push({ p: at(x, z), s: rand(1, 1.8) });
  }
  for (let x = -1500; x <= 2100; x += 34) { bloom.push({ p: at(x, zN(x) - 28), s: rand(1, 1.3) }); bloom.push({ p: at(x + 17, zF(x + 17) + 26), s: rand(1, 1.3) }); }
  for (let n = 0; n < 1200 && parkTrees.length < 130; n++) {
    const x = rand(-60, 560), z = rand(60, 228), p = at(x, z); if (ovalD(x, z) > -66) continue;
    if (p.distanceTo(board) < 26 || (x > 270 && x < 520 && Math.abs(z - 76) < 16)) continue;
    if (ponds.some(([px, pz, rx, rz]) => ((x - px) / (rx + 9)) ** 2 + ((z - pz) / (rz + 9)) ** 2 < 1) || Math.hypot(x - 178, z - 140) < 16) continue;
    parkTrees.push({ p, s: rand(0.9, 1.5) });
  }
  roundTrees([...outside, ...parkTrees], ['#2f7447', '#3f8f55', '#5aa267', '#2b6640']);
  roundTrees(bloom, ['#d9579a', '#e98bbd', '#c9467f', '#4f8f55']);
  // 背後の緑の丘：スタンドの北西と、川向こうの東（阿公角の山）
  { const cone = new THREE.ConeGeometry(1, 1, 9); cone.translate(0, 0.5, 0); const hills = [];
    for (let i = 0; i < 22; i++) { const x = rand(-1600, 1800), z = rand(-1500, -1150); hills.push({ p: at(x, z), s: new V3(rand(100, 150), rand(60, 130), rand(90, 140)), r: [0, rand(0, 3), 0] }); }
    for (let i = 0; i < 14; i++) { const x = rand(300, 2000), z = zF(x) + rand(500, 800); hills.push({ p: at(x, z), s: new V3(rand(80, 125), rand(55, 115), rand(70, 120)), r: [0, rand(0, 3), 0] }); }
    hills.forEach(o => { o.p.y = -4; });
    backdrop(inst(cone, toon('#4d7f58', { fog: true }), hills, false)); }
  mountains(th.mount, 20, false);

  // ---- 遠景（図鑑の全景では隠す）：南の獅子山、東の馬鞍山、西の大帽山と気象レーダー、南西の山腹の萬佛寺の塔 ----
  const c0 = at(250, 143), far = (dx, dz, dist) => new V3(c0.x + dx * dist * k, 0, c0.z + dz * dist * k * track.turn);
  const face = (g, p, sc) => { g.position.copy(p); g.scale.setScalar(sc); g.rotation.y = Math.atan2(c0.x - p.x, c0.z - p.z); world.add(backdrop(g)); return g; };
  const rock = toon('#7b7a6e', { fog: true }), green = toon('#557e5d', { fog: true }), dark = toon('#476d50', { fog: true });
  { // 獅子山：うずくまる獅子の形の岩山。尾根の西の端に、切り立った岩の頭
    const g = face(new THREE.Group(), far(-0.857, 0.515, 1900), 1.9);
    part(g, CONE, green, [0, 50, 0], [420, 100, 140], null, 0); part(g, CONE, dark, [-160, 62, 0], [170, 124, 120], null, 0);
    part(g, SPH_LO, rock, [-40, 92, 0], [150, 26, 50], null, 0); part(g, SPH_LO, rock, [-165, 118, 0], [44, 40, 40], null, 0);
    part(g, SPH_LO, rock, [-196, 104, 0], [22, 24, 28], null, 0); }
  { // 馬鞍山：鞍のようにくぼんだ2つの峰
    const g = face(new THREE.Group(), far(0.906, 0.422, 1900), 1.7);
    part(g, CONE, dark, [-80, 80, 0], [210, 160, 150], null, 0); part(g, CONE, green, [90, 66, 0], [190, 132, 140], null, 0); part(g, CONE, green, [0, 30, 0], [420, 60, 160], null, 0); }
  { // 大帽山：香港でいちばん高い山。山頂に白い気象レーダーの球
    const g = face(new THREE.Group(), far(-0.616, -0.788, 2100), 1.6);
    part(g, CONE, green, [0, 90, 0], [520, 180, 300], null, 0); part(g, CONE, dark, [180, 55, 0], [260, 110, 200], null, 0);
    part(g, SPH_LO, toon('#ffffff', { fog: true }), [0, 182, 0], [9, 9, 9], null, 0); addBox(g, [8, 8, 8], [0, 176, 0], toon('#e6e6e6', { fog: true }), null, 0); }
  { // 萬佛寺の九重塔：南西の山腹に立つ桃色の塔
    const g = face(new THREE.Group(), far(-0.96, -0.28, 1700), 1.6), wall = toon('#e7a6a0', { fog: true }), roof = toon('#c9a35a', { fog: true });
    part(g, CONE, green, [0, 30, 0], [200, 60, 160], null, 0);
    for (let i = 0; i < 9; i++) { const w = 9 - i * 0.6; addBox(g, [w, 3.2, w], [0, 60 + i * 3.8 + 1.6, 0], wall, null, 0); addBox(g, [w + 2.2, 0.6, w + 2.2], [0, 60 + i * 3.8 + 3.4, 0], roof, null, 0); }
    part(g, CONE, roof, [0, 98, 0], [2, 6, 2], null, 0); }

  // 動く飾りの更新：シラサギの羽ばたき
  themeUpd.push(t => egrets.forEach(e => {
    const a = e.ph + t * e.sp; e.b.position.set(e.c.x + Math.cos(a) * e.r, e.h + Math.sin(t * 0.7 + e.ph) * 1.5, e.c.z + Math.sin(a) * e.r);
    const sg = Math.sign(e.sp); e.b.rotation.y = -Math.atan2(Math.cos(a) * sg, -Math.sin(a) * sg);
    const f = Math.sin(t * 6 + e.ph) * 0.6; e.wings[0].rotation.x = f; e.wings[1].rotation.x = -f;
  }));
}
// 漕ぎ手・太鼓打ちなどの小さな人形の胴
const CAPS_SHATIN = keep(new THREE.CapsuleGeometry(1, 1, 2, 6));
