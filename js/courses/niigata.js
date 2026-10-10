// 新潟
'use strict';

function decorNiigata(th) {
  // 公式のコース平面図を実寸で再現する。千直はゴール後75.8mで1コーナーへ。外回りは直線658.7m・1周2223m、内回りは直線358.7m・1周1623m。
  // コーナーは半径120mの半円で近似（直線と向正面の間隔は平面図の比から約240m）。外回りの向正面は734.5m、内回りは434.5mになる
  const G = track.finishS, Rc = 120, sA = G + 75.8, sB = G - 658.7, sI = G - 358.7, band = W / 2 + 1.8, dIn = W / 2 + 0.9;
  const ri = Rc - dIn, ro = Rc + dIn, cut = Math.acos(ri / ro), cutLen = ro * Math.sin(cut);
  // (s, d)：千直の発走側の端からの距離sと、千直の中心線から内馬場側（北）への距離d。直線コースなので平面座標にそのまま対応する
  const at = (s, d) => new V3(track.xs[0] + s, 0, track.zs[0] - d), sd = p => [p.x - track.xs[0], track.zs[0] - p.z];
  const seg = (len, f) => { const n = Math.max(1, Math.ceil(Math.abs(len) / 1.5)); return Array.from({ length: n + 1 }, (_, i) => f(i / n)); };
  const line = (s0, s1, d0, d1 = d0) => seg(Math.hypot(s1 - s0, d1 - d0), t => at(lerp(s0, s1, t), lerp(d0, d1, t)));
  // 1〜2コーナー（中心(sA, Rc)、bは0で直線側・πで向正面側）と3〜4コーナー（中心(sc, Rc)、aは0で向正面側・πで直線側）
  const eastArc = (r, b0, b1) => seg(r * (b1 - b0), t => { const b = lerp(b0, b1, t); return at(sA + r * Math.sin(b), Rc - r * Math.cos(b)); });
  const westArc = (sc, r, a0, a1) => seg(r * (a1 - a0), t => { const a = lerp(a0, a1, t); return at(sc - r * Math.sin(a), Rc + r * Math.cos(a)); });
  const join = (...parts) => parts.flatMap((p, i) => i ? p.slice(1) : p);
  // 直線＋半円の周回の中心線からの距離（swは3〜4コーナーの中心）。飾りの芝の重なりと木の配置の判定に使う
  const fromOval = (s, d, sw) => s > sA ? Math.abs(Math.hypot(s - sA, d - Rc) - Rc) : s < sw ? Math.abs(Math.hypot(s - sw, d - Rc) - Rc) : Math.min(Math.abs(d), Math.abs(d - 2 * Rc));
  const onMain = p => { const [s, d] = sd(p); return s > -2 && s < track.L - 1.5 && Math.abs(d) < band; };
  const onOuter = p => fromOval(...sd(p), sB) < band;
  const mat = decorTurfMat(), turfLane = { lanes: [-1.6, W + 1.6], cols: 18, step: 1.5, onGround: true, mat };
  // 外回り（飾り）：ゴール後に1〜2コーナーを回り、向正面から大きな3〜4コーナーを経て残り658.7mで千直に合流する
  const outer = decorPath(join(line(track.L - 20, sA, 0), eastArc(Rc, 0, Math.PI), line(sA, sB, 2 * Rc), westArc(sB, Rc, 0, Math.PI)));
  decorCourseLane(outer, 'turf', 0, outer.L, { ...turfLane, hide: onMain });
  // 内回りの3〜4コーナー（飾り）：向正面の途中で分かれて内馬場を回り、残り358.7mで合流する
  const innerCorner = decorPath(westArc(sI, Rc, 0, Math.PI));
  decorCourseLane(innerCorner, 'turf', 0, innerCorner.L, { ...turfLane, hide: onOuter });
  // 向正面の2コーナー奥へ延びる芝の発走ポケット（内1400m・外2000m）
  const pocket = decorPath(line(sA, sA + 190, 2 * Rc));
  decorCourseLane(pocket, 'turf', 0, pocket.L, { ...turfLane, hide: onOuter });
  // 内回りの内側のダートコース（1周約1500m、実物は1472.5m）と、向正面から内馬場へ斜めに延びるダートの引き込み線
  const innerLoop = decorPath(join(line(sI, sA, 0), eastArc(Rc, 0, Math.PI), line(sA, sI, 2 * Rc), westArc(sI, Rc, 0, Math.PI)));
  decorCourseLane(innerLoop, 'dirt', 0, innerLoop.L, { lanes: [-3, -19], cols: 4, step: 1.5, onGround: true, lift: 0.25 });
  decorInnerRail(-19.8, th.rail, innerLoop);
  const spur0 = [G - 5, 2 * Rc - 24], spur1 = [G + 95, 55], spur = decorPath(line(spur0[0], spur1[0], spur0[1], spur1[1]));
  decorCourseLane(spur, 'dirt', 0, spur.L, { lanes: [W / 2 - 6, W / 2 + 6], cols: 2, step: 1.5, onGround: true, lift: 0.3 });
  // 飾りのコースのラチ。合流・分岐では外側のラチが相手のコースの内ラチに突き当たって終わる（千直側の内ラチは innerRailGaps で切ってある）
  const railMat = toon(th.rail);
  const rail = pts => {
    const curve = new THREE.CatmullRomCurve3(pts.map(p => new V3(p.x, track.groundH(p.x, p.z) + 1, p.z)));
    const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, Math.ceil(pts.length / 2), 0.09, 6, false), railMat); mesh.castShadow = true; world.add(mesh);
  };
  rail(join(line(track.L, sA, dIn), eastArc(ri, 0, Math.PI), line(sA, sI, 2 * Rc - dIn)));
  rail(join(line(sI - cutLen, sB, 2 * Rc - dIn), westArc(sB, ri, 0, Math.PI)));
  rail(join(line(track.L, sA, -dIn), eastArc(ro, 0, Math.PI - cut)));
  rail(line(sA + cutLen, sA + 190, 2 * Rc - dIn)); rail(line(sA + 190, sA + 190, 2 * Rc - dIn, 2 * Rc + dIn));
  rail(join(line(sA + 190, sB, 2 * Rc + dIn), westArc(sB, ro, 0, Math.PI - cut)));
  rail(westArc(sI, ri, 0, Math.PI)); rail(westArc(sI, ro, cut, Math.PI - cut));
  // 障害用の竹柵：使わないときは芝コースの内側に寄せてある
  const bamboo = toon('#d9c27c'), hedge = toon('#3f6b34'), cap = toon('#b0904c');
  const hurdle = (path, s) => {
    const q = path.pos(s, 3.5), g = new THREE.Group(); g.position.set(q.x, track.groundH(q.x, q.z) + 0.1, q.z); g.rotation.y = -q.h; world.add(g);
    addBox(g, [1.4, 0.5, 6], [0, 0.25, 0], hedge, null, 0); addBox(g, [0.8, 1.1, 5.6], [0, 1, 0], bamboo, null, 0); addBox(g, [0.9, 0.18, 5.8], [0, 1.6, 0], cap, null, 0);
  };
  const e0 = sA - (track.L - 20), arcL = Math.PI * Rc;
  for (const s of [e0 + arcL * 0.5, e0 + arcL + 117, e0 + arcL + 327, e0 + arcL + 590, e0 + arcL + (sA - sB) + arcL * 0.5]) hurdle(outer, s);
  hurdle(innerCorner, innerCorner.L * 0.5);
  // 千直の発走地点の「10」の標識（ハロン棒は残り200mごとの共通のものを使う）
  { const q = track.pos(track.finishS - track.def.D, -2.2), red = toon('#e53a2f'), white = toon('#ffffff');
    for (let i = 0; i < 6; i++) part(world, new THREE.CylinderGeometry(0.13, 0.13, 0.6, 8), i % 2 ? white : red, [q.x, q.y + 0.3 + i * 0.6, q.z], null, null, 0);
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: ctex(128, 128, g => { g.fillStyle = '#fff'; g.beginPath(); g.arc(64, 64, 58, 0, Math.PI * 2); g.fill(); g.strokeStyle = '#e53a2f'; g.lineWidth = 6; g.stroke(); g.fillStyle = '#e53a2f'; g.font = '800 64px "Oxanium", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('10', 64, 70); }), depthWrite: false }));
    sp.position.set(q.x, q.y + 4.6, q.z); sp.scale.set(1.8, 1.8, 1); world.add(sp); }

  // 新発田川：向正面の北を東西に流れ、西の端で北西へ折れる
  const river = decorPath(join(line(-380, -150, 2 * Rc + 230, 2 * Rc + 60), line(-150, sA + 700, 2 * Rc + 60)));
  decorCourseLane(river, 'water', 0, river.L, { lanes: [W / 2 - 7, W / 2 + 7], cols: 2, step: 3, onGround: true, lift: 0.12, mat: toon('#6aaecb', { side: THREE.DoubleSide }) });
  for (const s of [190, sA + 420]) { const c = at(s, 2 * Rc + 60); addBox(world, [7, 0.8, 22], [c.x, 1, c.z], toon('#cfcac0'), null, 0); }
  // 新新バイパス：川のさらに北を並走する高架の道路。車が東西に行き交う
  const hwD = 2 * Rc + 175, hw0 = -680, hw1 = sA + 680;
  { const c = at((hw0 + hw1) / 2, hwD), len = hw1 - hw0, deck = toon('#bdbab2');
    addBox(world, [len, 1.2, 22], [c.x, 6, c.z], deck, null, 0);
    for (const dz of [-10.8, 10.8]) addBox(world, [len, 1, 0.4], [c.x, 7.1, c.z + dz], toon('#e2e0d8'), null, 0);
    const piers = []; for (let s = hw0 + 20; s < hw1; s += 40) { const p = at(s, hwD); p.y = 3; piers.push({ p, s: new V3(2.2, 6, 7) }); }
    inst(BOX, deck, piers, false);
    const carCols = ['#f4f4f4', '#3b4a6b', '#c73c3c', '#2f2f35', '#d9d2c2', '#5e8fb8'];
    for (let i = 0; i < 14; i++) {
      const g = new THREE.Group(), east = i % 2 === 0, speed = rand(18, 26), phase = rand(0, len), truck = i % 5 === 0;
      addBox(g, truck ? [9, 3, 2.4] : [4.4, 1.3, 2], [0, truck ? 2.2 : 1.35, 0], toon(carCols[i % carCols.length]), null, 0.03);
      if (!truck) addBox(g, [2.4, 0.9, 1.8], [-0.3, 2.3, 0], toon('#4a5966'), null, 0);
      g.position.set(0, 6.6, c.z + (east ? 5 : -5)); g.rotation.y = east ? 0 : Math.PI; world.add(g);
      g.userData.droneIgnore = true;
      themeUpd.push(t => { const u = mod(phase + t * speed, len); g.position.x = track.xs[0] + (east ? hw0 + u : hw1 - u); });
    }
  }
  // 周りの田んぼ（夏の青田）と、屋敷林に囲まれた農家
  { const cols = ['#7cc350', '#86cc5a', '#6db347', '#93d264', '#78bd4e'].map(C), tiles = [];
    const nearRiver = (s, d) => river.pts.some(p => { const [ps, pd] = sd(p); return Math.abs(ps - s) < 60 && Math.abs(pd - d) < 50; });
    const field = (s0, s1, d0, d1) => { for (let s = s0; s + 90 <= s1; s += 94) for (let d = d0; d + 55 <= d1; d += 59) { const cs = s + 45, cd = d + 27.5; if (!nearRiver(cs, cd) && Math.abs(cd - hwD) > 45) tiles.push([cs, cd]); } };
    field(-700, sA + 700, 2 * Rc + 205, 1150); field(-700, sA + 700, -1100, -330); field(-700, 640, -330, -110); field(-700, -110, -110, 2 * Rc + 205); field(sA + 320, sA + 700, -330, 2 * Rc + 205);
    const houses = [], roofs = [], yard = [];
    for (let i = 0; i < 22 && tiles.length; i++) { const [s, d] = tiles.splice((Math.random() * tiles.length) | 0, 1)[0], p = at(s, d), ang = rand(-0.2, 0.2);
      houses.push({ p: new V3(p.x, 2.5, p.z), s: new V3(14, 5, 10), r: [0, ang, 0] }); roofs.push({ p: new V3(p.x, 5, p.z), s: new V3(10.6, 4, 7.8), r: [0, ang, 0] });
      for (let j = 0; j < 5; j++) { const a = rand(0.6, 2.6) + (j % 2) * Math.PI; yard.push({ p: new V3(p.x + Math.cos(a) * 16, 0, p.z + Math.sin(a) * 13) }); } }
    inst(BOX, toon('#ffffff'), tiles.map(([s, d]) => { const p = at(s, d); p.y = 0.08; return { p, s: new V3(90, 0.16, 55), c: cols[(Math.random() * cols.length) | 0] }; }), false);
    inst(BOX, toon('#e9e3d4'), houses); inst(new THREE.ConeGeometry(1, 1, 4).rotateY(Math.PI / 4).translate(0, 0.5, 0), toon('#4c525e'), roofs);
    roundTrees(yard, ['#3f7f3a', '#4c8f42', '#356f33']); }

  // 木：発走地点と千直沿いの松林、内馬場や2コーナーの外の木。コース・ラチ・ターフビジョン・乗馬センターの上には置かない
  const spurDist = (s, d) => { const [ax, az] = spur0, bx = spur1[0] - ax, bz = spur1[1] - az, t = clamp(((s - ax) * bx + (d - az) * bz) / (bx * bx + bz * bz), 0, 1); return Math.hypot(s - ax - bx * t, d - az - bz * t); };
  const clear = (s, d) => fromOval(s, d, sB) > band + 6 && fromOval(s, d, sI) > 32 && spurDist(s, d) > 12 && !(s > -10 && s < track.L + 10 && Math.abs(d) < 20)
    && !(s > sA - 10 && s < sA + 200 && Math.abs(d - 2 * Rc) < 20) && Math.hypot(s - 231, d - 150) > 40 && at(s, d).distanceTo(boardPos) > 28;
  const scatter = (n, s0, s1, d0, d1) => { const out = []; for (let i = 0; i < n * 6 && out.length < n; i++) { const s = rand(s0, s1), d = rand(d0, d1); if (clear(s, d)) { const p = at(s, d); p.y = track.groundH(p.x, p.z); out.push({ p }); } } return out; };
  { const trunks = [], crowns = [];
    for (const { p } of [...scatter(34, -80, 30, -75, 75), ...scatter(55, 0, 760, -62, -22), ...scatter(24, 0, sB - 140, 22, 130), ...scatter(14, -60, 300, 2 * Rc + 30, 2 * Rc + 50)]) {
      const sc = rand(0.9, 1.5);
      trunks.push({ p, s: new V3(0.35 * sc, 6 * sc, 0.35 * sc), r: [rand(-0.12, 0.12), rand(0, 6), rand(-0.12, 0.12)] });
      for (let j = 0; j < 4; j++) crowns.push({ p: new V3(p.x + rand(-1.6, 1.6) * sc, p.y + (4.8 + j * 0.8 + rand(0, 0.6)) * sc, p.z + rand(-1.6, 1.6) * sc), s: new V3(rand(1.8, 2.6) * sc, rand(0.7, 1) * sc, rand(1.8, 2.6) * sc) });
    }
    inst(new THREE.CylinderGeometry(1, 1.2, 1, 6).translate(0, 0.5, 0), toon('#6b5040'), trunks);
    inst(new THREE.IcosahedronGeometry(1, 1), toon('#2f5d3a'), crowns); }
  roundTrees([...scatter(26, sB - 110, sI - 20, 30, 2 * Rc - 30), ...scatter(16, sI - 90, sA + 90, 40, 2 * Rc - 40), ...scatter(18, sA + 140, sA + 280, -60, 2 * Rc - 30), ...scatter(14, G + 90, G + 330, -160, -30)],
    ['#3f9a3a', '#56b64a', '#6cc85a', '#2f8a34']);
  // 東に五頭連峰、南西に弥彦山・角田山。北の海岸の先は日本海
  { const cone = new THREE.ConeGeometry(1, 1, 8).translate(0, 0.5, 0), ridge = [];
    for (let i = 0; i < 12; i++) ridge.push({ p: new V3(rand(1350, 1550), -5, -500 + i * 120 + rand(-30, 30)), s: new V3(rand(150, 210), rand(110, 200), rand(130, 180)), r: [0, rand(0, 3), 0] });
    for (const [x, z, r, h] of [[-1250, 520, 150, 150], [-1150, 760, 120, 110], [-1350, 300, 110, 90]]) ridge.push({ p: new V3(x, -5, z), s: new V3(r, h, r), r: [0, rand(0, 3), 0] });
    inst(cone, toon(th.mount, { fog: true }), ridge, false);
    const sea = new THREE.Mesh(new THREE.PlaneGeometry(5200, 1400), toon('#4d8fc4')); sea.rotation.x = -Math.PI / 2; sea.position.set(0, 0.05, track.zs[0] - 1950); world.add(sea);
    const beach = new THREE.Mesh(new THREE.PlaneGeometry(5200, 90), toon('#e6d5a8')); beach.rotation.x = -Math.PI / 2; beach.position.set(0, 0.03, track.zs[0] - 1215); world.add(beach); }
  const cloud = toon('#ffffff', { fog: false }), cg = new THREE.IcosahedronGeometry(1, 2), list = [];
  for (let i = 0; i < 9; i++) { const a = rand(0, 6.28), r = rand(900, 1300), cx = Math.cos(a) * r, cz = Math.sin(a) * r, sz = rand(60, 110);
    for (let j = 0; j < 9; j++) list.push({ p: new V3(cx + rand(-1.2, 1.2) * sz, 60 + rand(0, 1.6) * sz * (j < 3 ? 0.6 : 1), cz + rand(-0.6, 0.6) * sz), s: new V3(sz * rand(0.6, 1), sz * rand(0.55, 0.9), sz * rand(0.6, 1)) }); }
  const cl = inst(cg, cloud, list, false); cl.castShadow = false;
}
// ロンシャンの地図座標（実寸m。x：東、y：北。場内中央付近が原点）をワールド座標へ変換する。
