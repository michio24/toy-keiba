// 阪神
'use strict';

// 阪神の地図座標（実寸m）をワールド座標へ変換する。x：4コーナー出口から直線の向き（西北西）、z：コースの内側（北北東）を正（コースの区間segsと同じ座標）
function hanshinAt(x, z) { const k = track.def.scale; return new V3(track.xs[0] + x * k, 0, track.zs[0] + z * k * track.turn); }
function decorHanshin(th) {
  // 配置はOpenStreetMapの柵・建物・水辺・線路の位置と、JRAの場内案内を参考にしたデフォルメ
  const at = hanshinAt, k = track.def.scale, mat = decorTurfMat(), v = (x, z) => new V3(x, 0, z);
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
  const white = toon('#f1eee6'), stone = toon('#cfc8b8'), steel = toon('#9aa3a8');

  // ---- 飾りのコース（レースは芝外回りの周回上で行う） ----
  // 内回り：向正面の3コーナー手前で外回りから分かれて小さく回り、直線の残り356.5mで合流する（1周1689m。地図の内柵の位置）
  const inner = route([[208, 371], [178, 375], [155, 373], [136, 368], [120, 363], [100, 352], [81, 338], [63, 316], [47, 295], [36, 278], [26, 259], [16, 238], [9, 218], [3, 201],
    [-2, 178], [-5, 161], [-5, 144], [-4, 129], [-2, 112], [2, 93], [10, 73], [20, 56], [35, 38], [52, 28], [65, 20], [79, 13], [93, 8], [115, 4], [137, 1], [180, 0]]);
  decorCourseLane(inner, 'turf', 0, inner.L, { lanes: [-1.6, W + 1.6], cols: 18, step: 1.5, onGround: true, mat, hide: onMainTurf });
  // 内回りの1周（直線の合流点→1〜2コーナー→向正面→分岐→内回りの3〜4コーナー）。ダート・障害コースはこの内側に並走させる
  const nearestS = p => { let best = Infinity, s = 0; for (let i = 0; i <= track.N; i++) { const d = (track.xs[i] - p.x) ** 2 + (track.zs[i] - p.z) ** 2; if (d < best) { best = d; s = i * track.ds; } } return s; };
  const sa = nearestS(inner.pts[0]), sb = nearestS(inner.pts[inner.pts.length - 1]), loopPts = [];
  for (let s = sb; s < sa; s += 1.5) { const q = track.pos(s, W / 2); loopPts.push(v(q.x, q.z)); }
  loopPts.push(...inner.pts, loopPts[0].clone());
  const loop = decorPath(loopPts);
  // 内回りの内側のダートコース。1周は約1/2縮尺で実物の1517.6mに近い
  decorCourseLane(loop, 'dirt', 0, loop.L, { lanes: [-2.5, -13], cols: 4, step: 1.5, onGround: true, lift: 0.25 });
  decorInnerRail(-13.8, th.rail, loop);
  // 障害コース：ダートの内側の周回路（1周1366.7m）と、ゴール前の内側から向正面の1コーナー寄りへ内馬場を斜めに横切る襷コース。生垣の障害を置く
  const jumpMat = decorTurfMat(); jumpMat.color = C('#c9e6a6');
  decorCourseLane(loop, 'turf', 0, loop.L, { lanes: [-24, -16], cols: 6, step: 1.5, onGround: true, lift: 0.3, mat: jumpMat });
  const loopS = p => { let best = Infinity, s = 0; for (let i = 0; i < loop.pts.length; i += 2) { const q = loop.pos(i * 1.5, -20), d = (q.x - p.x) ** 2 + (q.z - p.z) ** 2; if (d < best) { best = d; s = i * 1.5; } } return s; };
  const ta = loop.pos(loopS(at(455, 60)), -20), tb = loop.pos(loopS(at(263, 294)), -20);
  const cross = decorPath(new THREE.LineCurve3(v(ta.x, ta.z), v(tb.x, tb.z)).getSpacedPoints(Math.ceil(Math.hypot(tb.x - ta.x, tb.z - ta.z) / 2)));
  decorCourseLane(cross, 'turf', 0, cross.L, { lanes: [W / 2 - 4, W / 2 + 4], cols: 6, step: 1.5, onGround: true, lift: 0.32, mat: jumpMat });
  const hedge = toon('#3f6b34'), hedgeTop = toon('#4f8040');
  const jump = (path, s, lane) => {
    const q = path.pos(s, lane), g = new THREE.Group(); g.position.set(q.x, track.groundH(q.x, q.z), q.z); g.rotation.y = -q.h; world.add(g);
    addBox(g, [1.6, 1.3, 8.5], [0, 0.65, 0], hedge, null, 0); addBox(g, [1.9, 0.4, 8.8], [0, 1.45, 0], hedgeTop, null, 0);
  };
  for (const f of [0.35, 0.65]) jump(cross, cross.L * f, W / 2);
  for (const f of [0.3, 0.45, 0.6, 0.78, 0.9]) jump(loop, loop.L * f, -20);
  // 発走ポケット：2コーナー奥へ向正面をまっすぐ延ばした引き込み線（1800m）と、4コーナー奥へ直線を延ばした引き込み線（2200m）
  const pocket = (path, half) => decorCourseLane(path, 'turf', 0, path.L, { lanes: [W / 2 - half, W / 2 + half], cols: 12, step: 1.5, onGround: true, mat, hide: onMainTurf });
  const chute = route([[600, 237], [758, 182]]), chute2 = route([[-78, 0], [4, 0]]);
  pocket(chute, 14 * k); pocket(chute2, 14 * k);

  // ---- 水辺：内馬場の東を流れる水路、スタンドの裏の小仁川と仁川、東の武庫川、西の弁天池 ----
  const water = toon('#6fa9c8', { side: THREE.DoubleSide }), bankMat = toon('#9fc27a', { side: THREE.DoubleSide });
  const courses = [loop.pts, inner.pts, chute.pts, chute2.pts];
  const onCourse = p => onMainTurf(p) || courses.some(pts => near(p, pts, W / 2 + 2));
  const stream = (pts, half, bank = 0) => {
    const r = route(pts.map(([x, z]) => [x, z]));
    decorCourseLane(r, 'water', 0, r.L, { lanes: [W / 2 - half * k, W / 2 + half * k], cols: 2, step: 3, onGround: true, lift: 0.08, mat: water, hide: onCourse });
    for (const sgn of bank ? [-1, 1] : []) decorCourseLane(r, 'turf', 0, r.L, { lanes: [W / 2 + sgn * half * k, W / 2 + sgn * (half + bank) * k], cols: 2, step: 3, onGround: true, lift: 0.1, mat: bankMat, hide: onCourse });
    return r;
  };
  // 向正面の外を西から東へ流れ、向正面の下をくぐって内回りと外回りの間を南へ。4コーナーの下を抜けて百間樋川へ
  const streams = [
    stream([[771, 226], [576, 287], [508, 308], [457, 325], [301, 390], [225, 422], [176, 427], [131, 433], [83, 451], [76, 449], [53, 413], [-97, 60], [-115, 14], [-164, -96], [-366, -68], [-389, -95], [-383, -329], [-394, -416], [-423, -529], [-454, -655]], 3),
    stream([[-58, 547], [-95, 491], [-124, 448], [-162, 393], [-197, 344], [-249, 266], [-303, 183], [-337, 131]], 2.5),
    // 小仁川：スタンドの裏の遊歩道沿いを流れる細い川
    stream([[794, -490], [761, -468], [670, -492], [617, -503], [526, -459], [428, -415], [327, -383], [285, -383], [225, -377], [170, -367], [148, -372]], 3, 4),
    // 仁川：西の甲山のふもとから流れてきて、スタンドの裏から4コーナーの外を回り武庫川へ注ぐ。両岸に芝の土手
    stream([[732, -917], [686, -846], [656, -800], [612, -734], [575, -695], [534, -663], [481, -627], [431, -595], [378, -561], [329, -526], [266, -477], [217, -432], [148, -372], [96, -328],
      [49, -300], [6, -283], [-109, -249], [-169, -240], [-233, -238], [-315, -242], [-375, -246], [-454, -256], [-502, -270], [-582, -317], [-641, -353], [-726, -412], [-765, -427], [-806, -439]], 9, 12),
    // 武庫川：3〜4コーナーの向こうを北から南へ流れる大きな川。広い河川敷は芝の公園
    stream([[39, 1444], [-44, 1328], [-133, 1208], [-181, 1119], [-228, 1027], [-247, 951], [-303, 846], [-336, 777], [-389, 667], [-438, 609], [-522, 470], [-674, 331], [-793, 97], [-800, -150],
      [-790, -450], [-760, -800], [-740, -1200]], 32, 70)];
  // 弁天池：仁川駅の西のため池
  { const line = new THREE.CatmullRomCurve3([[805, -477], [772, -517], [757, -550], [771, -583], [795, -550], [832, -582], [828, -630], [833, -675], [856, -701], [870, -662], [885, -608], [894, -565], [920, -534],
      [932, -498], [956, -498], [953, -460], [942, -426], [900, -438], [861, -459], [819, -474]].map(([x, z]) => at(x, z)), true, 'centripetal').getSpacedPoints(120);
    line.pop();
    const geo = new THREE.ShapeGeometry(new THREE.Shape(line.map(p => new THREE.Vector2(p.x, p.z)))), pp = geo.attributes.position;
    for (let i = 0; i < pp.count; i++) { const x = pp.getX(i), z = pp.getY(i); pp.setXYZ(i, x, track.groundH(x, z) + 0.1, z); }
    geo.computeVertexNormals(); const pond = new THREE.Mesh(geo, toon('#5f93b8', { side: THREE.DoubleSide })); pond.receiveShadow = true; world.add(pond); }

  // ---- 場内：塀、4コーナーの外の建物、正門とサンライトウォーク ----
  // 競馬場を囲む塀（地図の敷地の境界）
  const wallLine = [[-137, -46], [-111, 11], [-139, 33], [-165, 71], [-210, 96], [-312, 159], [-288, 196], [-248, 256], [-220, 299], [-196, 336], [-148, 401], [-55, 544], [58, 497], [80, 488], [69, 457],
      [149, 430], [193, 428], [225, 424], [380, 356], [457, 325], [508, 305], [610, 275], [721, 241], [708, 209], [791, 182], [749, 30], [671, -262], [656, -318], [497, -286], [387, -264], [340, -265],
      [303, -272], [261, -293], [145, -263], [-39, -190], [-188, -161], [-162, -102], [-137, -46]].map(([x, z]) => at(x, z));
  const inWall = p => { let c = false; for (let i = 0, j = wallLine.length - 1; i < wallLine.length; j = i++) { const a = wallLine[i], b = wallLine[j]; if ((a.z > p.z) !== (b.z > p.z) && p.x < (b.x - a.x) * (p.z - a.z) / (b.z - a.z) + a.x) c = !c; } return c; };
  { const list = [];
    for (let i = 0; i < wallLine.length - 1; i++) {
      const a = wallLine[i], b = wallLine[i + 1], L = a.distanceTo(b), h = Math.atan2(b.z - a.z, b.x - a.x);
      for (let d = 0; d < L; d += 6) { const t = Math.min(6, L - d), p = a.clone().lerp(b, (d + t / 2) / L); list.push({ p: new V3(p.x, track.groundH(p.x, p.z) + 0.9, p.z), s: new V3(t + 0.1, 1.8, 0.4), r: [0, -h, 0] }); }
    }
    inst(BOX, toon('#d9d3c6'), list, false); }
  // 4コーナーの外の場内の低い建物（地図の建物の輪郭）
  { const blocks = [];
    for (const poly of [[[-140, 21], [-170, 38], [-233, -73], [-219, -81], [-210, -65], [-182, -81], [-133, 6]], [[-232, -43], [-285, -14], [-301, -42], [-247, -71]], [[-295, -18], [-345, 10], [-356, -7], [-306, -36]],
      [[-190, 40], [-295, 98], [-339, 19], [-234, -39]], [[-310, 116], [-331, 128], [-357, 82], [-336, 70]], [[-337, 142], [-357, 154], [-378, 118], [-357, 107]], [[-247, 142], [-282, 162], [-290, 148], [-255, 128]]]) {
      const ps = poly.map(([x, z]) => at(x, z)), c = ps.reduce((a, p) => a.add(p), v(0, 0)).multiplyScalar(1 / ps.length);
      // 外接する向きつきの箱：最も長い辺の向きに合わせる
      let best = 0, ang = 0; for (let i = 0; i < ps.length; i++) { const a = ps[i], b = ps[(i + 1) % ps.length], L = a.distanceTo(b); if (L > best) { best = L; ang = Math.atan2(b.z - a.z, b.x - a.x); } }
      const ux = Math.cos(ang), uz = Math.sin(ang); let w0 = Infinity, w1 = -Infinity, d0 = Infinity, d1 = -Infinity;
      for (const p of ps) { const a = (p.x - c.x) * ux + (p.z - c.z) * uz, b = -(p.x - c.x) * uz + (p.z - c.z) * ux; w0 = Math.min(w0, a); w1 = Math.max(w1, a); d0 = Math.min(d0, b); d1 = Math.max(d1, b); }
      const cx = c.x + ux * (w0 + w1) / 2 - uz * (d0 + d1) / 2, cz = c.z + uz * (w0 + w1) / 2 + ux * (d0 + d1) / 2, y = track.groundH(cx, cz);
      blocks.push({ p: new V3(cx, y + 2.4, cz), s: new V3(w1 - w0, 4.8, d1 - d0), r: [0, -ang, 0] });
    }
    inst(BOX, toon('#e6e0d2'), blocks); inst(BOX, toon('#8c6f5a'), blocks.map(b => ({ p: b.p.clone().setY(b.p.y + 2.5), s: new V3(b.s.x + 0.6, 0.4, b.s.z + 0.6), r: b.r })), false); }
  // 正門：スタンドの裏の西寄り。白い門柱と庇
  { const g = group('正門', 497, -286, Math.atan2(-22, -150)); landmarkFoundation(g, 30, 10, '#cfc8b8');
    addBox(g, [28, 0.8, 8], [0, 7, 0], white, null, 0); addBox(g, [26, 1.6, 0.4], [0, 5.8, -3.6], toon('#6b1f2a'), null, 0);
    for (const x of [-13, -4.5, 4.5, 13]) addBox(g, [1.2, 6.6, 1.2], [x, 3.3, 0], white, null, 0); }
  // サンライトウォーク：スタンドの裏から仁川駅の方へ延びる、屋根付きの歩道橋
  const walkLine = [[405, -288], [628, -352], [612, -420], [598, -490], [700, -508]];
  const walkPath = route(walkLine);
  { const deckY = 6, w = walkPath, slab = [], roofs = [], posts = [], glass = [];
    for (let i = 0; i < w.pts.length - 1; i += 2) {
      const a = w.pts[i], b = w.pts[Math.min(i + 2, w.pts.length - 1)], m = a.clone().add(b).multiplyScalar(0.5), h = Math.atan2(b.z - a.z, b.x - a.x), L = a.distanceTo(b) + 0.2, nx = -Math.sin(h), nz = Math.cos(h);
      const y = track.groundH(m.x, m.z);
      slab.push({ p: new V3(m.x, y + deckY, m.z), s: new V3(L, 0.6, 6), r: [0, -h, 0] });
      roofs.push({ p: new V3(m.x, y + deckY + 4.2, m.z), s: new V3(L, 0.35, 7.4), r: [0, -h, 0] });
      for (const o of [-2.9, 2.9]) glass.push({ p: new V3(m.x + nx * o, y + deckY + 1, m.z + nz * o), s: new V3(L, 1.4, 0.15), r: [0, -h, 0] });
      if (i % 8 === 0) for (const o of [-2.8, 2.8]) posts.push({ p: new V3(m.x + nx * o, y + (deckY + 4) / 2, m.z + nz * o), s: new V3(0.5, deckY + 4, 0.5), r: [0, -h, 0] });
    }
    // 図鑑の全景に含めるよう、橋の部品をまとめて代表物として登録する
    const g = registerLandmark(new THREE.Group(), 'サンライトウォーク'); world.add(g);
    g.add(inst(BOX, toon('#d8d2c4'), slab, false), inst(BOX, toon('#f2efe8'), roofs, false), inst(BOX, steel, posts, false), inst(BOX, toon('#9cc1d1'), glass, false)); }

  // ---- 阪急今津線と仁川駅：1コーナーの先を南北に走る線路。駅は場外の南西、マルーン色の電車が行き来する ----
  const railCurve = new THREE.CatmullRomCurve3([[116, -1484], [127, -1417], [144, -1321], [159, -1262], [188, -1186], [225, -1118], [271, -1059], [398, -910], [521, -773], [576, -712], [631, -655], [709, -568],
    [745, -535], [785, -490], [880, -360], [1000, -160], [1130, 90], [1260, 400], [1400, 750]].map(([x, z]) => at(x, z)), false, 'centripetal');
  const railLine = railCurve.getSpacedPoints(Math.ceil(railCurve.getLength() / 2));
  { const bed = [], rails = [], sleepers = [];
    for (let i = 0; i < railLine.length - 1; i++) {
      const a = railLine[i], b = railLine[i + 1], m = a.clone().add(b).multiplyScalar(0.5), h = Math.atan2(b.z - a.z, b.x - a.x), L = a.distanceTo(b) + 0.2, nx = -Math.sin(h), nz = Math.cos(h), y = track.groundH(m.x, m.z);
      bed.push({ p: new V3(m.x, y + 0.3, m.z), s: new V3(L, 0.6, 8), r: [0, -h, 0] });
      for (const o of [-2.2, -0.8, 0.8, 2.2]) rails.push({ p: new V3(m.x + nx * o, y + 0.7, m.z + nz * o), s: new V3(L, 0.2, 0.22), r: [0, -h, 0] });
    }
    inst(BOX, toon('#b5aa98'), bed, false); inst(BOX, toon('#5d5a57'), rails, false); }
  // 仁川駅：相対式の2面2線のホームと屋根、東口の駅舎と駅前広場
  { const p0 = at(654, -626), p1 = at(690, -588), ang = Math.atan2(p1.z - p0.z, p1.x - p0.x), g = new THREE.Group(); g.position.copy(ground(at(660, -620))); g.rotation.y = -ang; world.add(registerLandmark(g, '仁川駅（阪急今津線）'));
    const cream = toon('#ece5d4');
    for (const z of [-5.2, 5.2]) { addBox(g, [62, 1.2, 3.4], [0, 0.6, z], toon('#d8d2c4'), null, 0); addBox(g, [54, 0.5, 4.2], [0, 5.4, z], toon('#7f6a5a'), null, 0); for (let x = -24; x <= 24; x += 8) addBox(g, [0.4, 4.6, 0.4], [x, 3.1, z + Math.sign(z) * 1.2], steel, null, 0); }
    addBox(g, [16, 6, 9], [4, 3, -13], cream, null, 0); addBox(g, [18, 0.6, 11], [4, 6.2, -13], toon('#7f6a5a'), null, 0);
    addBox(g, [6, 0.12, 3], [4, 3.4, -17.6], toon('#6b1f2a'), null, 0); }
  // 駅前のマンション（さらら仁川）：駅の東に建つ12〜13階建ての2棟
  for (const [x, z, w, d, h, a] of [[638, -534, 62, 34, 18, 0.05], [582, -625, 73, 30, 20, -0.68]]) {
    const p = ground(at(x, z)), b = new THREE.Group(); b.position.copy(p); b.rotation.y = -a * track.turn; world.add(b);
    addBox(b, [w * k, h, d * k], [0, h / 2, 0], toon('#e9e3d6'), null, 0.02);
    for (let y = 2; y < h - 1; y += 1.6) addBox(b, [w * k + 0.1, 0.25, d * k + 0.1], [0, y, 0], toon('#c9c0ae'), null, 0);
  }
  { const RL = railCurve.getLength(), cars = [], maroon = toon('#6b1f2a'), ivory = toon('#efe6cf'), pane = toon('#3f4b55');
    for (let i = 0; i < 6; i++) {
      const c = new THREE.Group(); world.add(c);
      addBox(c, [9, 3.4, 3.2], [0, 1.9, 0], maroon, null, 0.03); addBox(c, [9.05, 0.45, 3.25], [0, 3.55, 0], ivory, null, 0);
      for (const z of [-1.62, 1.62]) for (let j = 0; j < 3; j++) addBox(c, [1.8, 1.1, 0.1], [-3 + j * 3, 2.4, z], pane, null, 0);
      cars.push(c);
    }
    // 線路の端から端まで、仁川駅で止まりながら行って戻ってくる
    const station = (() => { let best = Infinity, u = 0; const sp = at(660, -620); for (let i = 0; i <= 400; i++) { const d = railCurve.getPointAt(i / 400).distanceTo(sp); if (d < best) { best = d; u = i / 400; } } return u; })();
    themeUpd.push(t => {
      const c = (t * 0.025) % 2, u = c < 1 ? c : 2 - c, run = THREE.MathUtils.smootherstep(u, 0.05, 0.95);
      // 駅の前後でゆっくりにして止まる
      const s0 = 6 + (run < station ? THREE.MathUtils.smootherstep(run / station, 0, 1) * station : station + THREE.MathUtils.smootherstep((run - station) / (1 - station), 0.15, 1) * (1 - station)) * (RL - 70);
      cars.forEach((car, i) => { const s = (s0 + i * 9.6) / RL, p = railCurve.getPointAt(s), tg = railCurve.getTangentAt(s); car.userData.droneIgnore = true; car.position.set(p.x, track.groundH(p.x, p.z) + 0.8, p.z); car.rotation.y = -Math.atan2(tg.z, tg.x); });
    }); }

  // ---- スタンドの4コーナー寄りの裏：セントウルガーデン、噴水広場、キッズガーデン ----
  // セントウルガーデン：レース名の由来のケンタウロス（セントウル）の像と噴水、花壇
  { const g = group('セントウルガーデン', 150, -170); landmarkFoundation(g, 42, 30, '#93aa79');
    landmarkHorse(g, [-9, 0, 0], 'walk', '#718978', 2.2, true);
    const basin = part(g, new THREE.CylinderGeometry(6.5, 7, 1, 32), toon('#ddd3bf'), [10, 0.5, 0], null, null, 0); basin.receiveShadow = true;
    part(g, new THREE.CircleGeometry(6, 32), toon('#6bbdcf', { polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }), [10, 1.05, 0], null, [-Math.PI / 2, 0, 0], 0);
    const jets = new THREE.Group(); g.add(jets); themeDetails.push(jets);
    for (let i = 0; i < 6; i++) {
      const a = i / 6 * Math.PI * 2, dir = new V3(Math.cos(a), 0, Math.sin(a));
      const curve = new THREE.QuadraticBezierCurve3(new V3(10, 1.2, 0), new V3(10 + dir.x * 2, 9, dir.z * 2), new V3(10 + dir.x * 4, 1.2, dir.z * 4));
      jets.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 12, 0.12, 4), toon('#a7e5ed')));
    }
    landmarkFlowers(g, 19, 13, '#df92ae'); }
  // 噴水広場：石畳の地面から数分おきに水が噴き出す、水遊びのできる広場
  { const g = group('噴水広場', 72, -165); landmarkFoundation(g, 26, 20, '#ddd5c4');
    const sprays = [], spray = new THREE.CylinderGeometry(0.12, 0.3, 1, 6); spray.translate(0, 0.5, 0);
    for (let i = 0; i < 5; i++) for (let j = 0; j < 4; j++) sprays.push({ x: -9 + i * 4.5, z: -6 + j * 4, ph: (i * 3 + j * 5) % 7 });
    const mesh = new THREE.InstancedMesh(spray, toon('#bfeaf2'), sprays.length); g.add(mesh); const m4 = new THREE.Matrix4(), q = new THREE.Quaternion();
    mesh.userData.droneIgnore = true;
    themeUpd.push(t => { sprays.forEach((o, i) => { const h = Math.max(0.01, Math.sin(t * 0.9 + o.ph) * 3.2 + 0.4); m4.compose(new V3(o.x, 0, o.z), q, new V3(1, h, 1)); mesh.setMatrixAt(i, m4); }); mesh.instanceMatrix.needsUpdate = true; }); }
  // キッズガーデン：跳んで遊べるふわふわドーム、長いすべり台つきの大型アスレチック、砂場
  { const g = group('キッズガーデン', 185, -255, 0.25); landmarkFoundation(g, 60, 26, '#b9c98a');
    const dome = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 10, 0, Math.PI * 2, 0, Math.PI / 2), toon('#f4f1ea')); dome.scale.set(11, 3.2, 7); dome.position.set(-16, 0, 0); g.add(dome);
    const tower = toon('#e8a33a'), deck = toon('#6c9bd2');
    for (const [x, z] of [[4, -4], [12, -4], [4, 4], [12, 4]]) addBox(g, [0.6, 7, 0.6], [x, 3.5, z], tower, null, 0);
    addBox(g, [9, 0.5, 9], [8, 6, 0], deck, null, 0); part(g, new THREE.ConeGeometry(6.5, 3, 4), toon('#d9574a'), [8, 8.3, 0], null, [0, Math.PI / 4, 0], 0);
    // 長いすべり台：塔から地面まで大きく弧を描いて下りる
    const slide = new THREE.CatmullRomCurve3([new V3(12.5, 6, 0), new V3(19, 4.5, -3), new V3(24, 2.5, 2), new V3(27, 0.6, 7)]);
    g.add(new THREE.Mesh(new THREE.TubeGeometry(slide, 32, 0.9, 8, false), toon('#f0c24d')));
    part(g, BOX, toon('#e8d9a8'), [-2, 0.08, 7], [8, 0.16, 6], null, 0); }

  // ---- スタンドの裏のパドック：鳥の翼のような大屋根の下の楕円の周回路。パドックを歩く馬 ----
  { const g = group('パドック', 385, -190); landmarkFoundation(g, 44, 28, '#cdbf9f');
    const oval = (rx, rz, y) => { const pts = []; for (let i = 0; i < 64; i++) { const a = i / 64 * Math.PI * 2; pts.push(new V3(Math.cos(a) * rx, y, Math.sin(a) * rz)); } return new THREE.CatmullRomCurve3(pts, true); };
    part(g, new THREE.CircleGeometry(1, 48), toon('#6fbf5c'), [0, 0.06, 0], [11, 5, 1], [-Math.PI / 2, 0, 0], 0);
    part(g, new THREE.RingGeometry(0.7, 1, 48), toon('#d9c7a0'), [0, 0.08, 0], [15, 7.6, 1], [-Math.PI / 2, 0, 0], 0);
    g.add(new THREE.Mesh(new THREE.TubeGeometry(oval(15.3, 7.9, 1.1), 128, 0.12, 4, true), toon('#f4f2ea')));
    // 周りの観覧の段
    const steps = [];
    for (let j = 0; j < 3; j++) for (let i = 0; i < 40; i++) {
      const a0 = i / 40 * Math.PI * 2, a1 = (i + 1) / 40 * Math.PI * 2, rx = 17 + j * 1.4, rz = 9.5 + j * 1.4, h = 0.6 + j * 0.6;
      const p0 = [Math.cos(a0) * rx, Math.sin(a0) * rz], p1 = [Math.cos(a1) * rx, Math.sin(a1) * rz];
      steps.push({ p: new V3((p0[0] + p1[0]) / 2, h / 2, (p0[1] + p1[1]) / 2), s: new V3(Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) + 0.3, h, 1.5), r: [0, -Math.atan2(p1[1] - p0[1], p1[0] - p0[0]), 0] });
    }
    g.add(inst(BOX, toon('#d8d2c4'), steps, false));
    // 大屋根：中央の背骨から左右へ反り上がる2枚の白い膜屋根（鳥の羽ばたき）
    const membrane = toon('#f6f4ef', { side: THREE.DoubleSide });
    for (const sd of [-1, 1]) {
      // 内側はゆるく、外側ほど急に反り上がる
      addBox(g, [48, 0.5, 9], [0, 14.6 + 9 / 2 * Math.sin(0.25), sd * 9 / 2 * Math.cos(0.25)], membrane, [-sd * 0.25, 0, 0], 0);
      addBox(g, [46, 0.5, 9], [0, 14.6 + 9 * Math.sin(0.25) + 4.5 * Math.sin(0.7), sd * (9 * Math.cos(0.25) + 4.5 * Math.cos(0.7))], membrane, [-sd * 0.7, 0, 0], 0);
    }
    addBox(g, [50, 1.2, 1.6], [0, 14.6, 0], steel, null, 0);
    for (const x of [-22, 0, 22]) addBox(g, [0.9, 15, 0.9], [x, 7.5, 0], steel, null, 0);
    for (const x of [-22, 22]) for (const z of [-8, 8]) addBox(g, [0.7, 16, 0.7], [x, 8, z], steel, null, 0);
    // パドックを周回する馬
    const walkers = [];
    for (let i = 0; i < 6; i++) { const h = landmarkHorse(g, [0, 0.15, 0], 'walk', ['#6b4a35', '#3b2a20', '#8a5a3a'][i % 3], 0.45); h.children[0].visible = false; walkers.push(h); }
    walkers.forEach(h => { h.userData.droneIgnore = true; });
    themeUpd.push(t => walkers.forEach((h, i) => { const a = t * 0.08 + i * Math.PI * 2 / 6, x = Math.cos(a) * 13, z = Math.sin(a) * 6.3; h.position.set(x, 0.15, z); h.rotation.y = -Math.atan2(Math.cos(a) * 6.3, -Math.sin(a) * 13); })); }

  // ---- 木（春の桜）：本線・建物・線路・川を避けて置く ----
  const ring = []; for (let i = 0; i < track.N; i += 6) ring.push(v(track.xs[i], track.zs[i]));
  const gap = p => { let d = 1e18; for (const q of ring) d = Math.min(d, (q.x - p.x) ** 2 + (q.z - p.z) ** 2); return Math.sqrt(d); };
  const inside = p => { let c = false; for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) { const a = ring[i], b = ring[j]; if ((a.z > p.z) !== (b.z > p.z) && p.x < (b.x - a.x) * (p.z - a.z) / (b.z - a.z) + a.x) c = !c; } return c; };
  // スタンド・パドック・正門・広場・駅前の範囲（地図の実寸）
  const busy = (x, z) => (x > 240 && x < 600 && z < -40 && z > -300) || (x > 30 && x < 280 && z < -95 && z > -300) || (x > 380 && x < 700 && z < -270 && z > -660);
  const nearWater = p => streams.some((r, i) => near(p, r.pts, [3, 2.5, 7, 21, 102][i] * k + 4));
  const sakura = ['#f7b8d4', '#ffd5e7', '#ed99c1', '#ffc6de', '#70a851'], spots = [];
  // 外側は中継カメラ（走路の外24m）の通り道をあけ、走路から44m以上離す
  for (let n = 0; n < 2600 && spots.length < 260; n++) {
    const x = rand(-420, 900), z = rand(-420, 620), p = at(x, z);
    if (busy(x, z) || inside(p) || gap(p) < 44 || gap(p) > 200 || near(p, railLine, 10) || nearWater(p) || near(p, chute.pts, 20)) continue;
    spots.push({ p: ground(p) });
  }
  // スタンドの裏の小仁川沿いの桜並木
  { const r = streams[2]; for (let s = 6; s < r.L - 6; s += 7) for (const lane of [W / 2 - 9, W / 2 + 9]) { const q = r.pos(s, lane), p = v(q.x, q.z); if (gap(p) > 30 && !near(p, railLine, 10)) spots.push({ p: ground(p), s: rand(1.1, 1.4) }); } }
  // 内馬場：障害コースの内側にまばらに。襷コース・ターフビジョンを避ける
  for (let n = 0; n < 300 && spots.length < 330; n++) {
    const q = loop.pos(Math.random() * loop.L, -rand(28, 60)), p = v(q.x, q.z);
    if (near(p, loop.pts, 26) || near(p, cross.pts, 9) || p.distanceTo(boardPos) < 34) continue;
    spots.push({ p: ground(p) });
  }
  // 内回りと外回りの間の芝地：水路沿いに
  for (let n = 0; n < 70; n++) { const q = streams[0].pos(rand(0.42, 0.62) * streams[0].L, W / 2 + rand(-12, 12)), p = v(q.x, q.z); if (!onCourse(p) && !near(p, streams[0].pts, 4) && gap(p) > 14) spots.push({ p: ground(p) }); }
  roundTrees(spots, sakura);

  // ---- 遠景（図鑑の全景では隠す）：仁川・宝塚の住宅地、西の甲山と六甲の山並み、北の長尾山の山並み ----
  const backdrop = o => { o.userData.backdrop = true; return o; };
  { const walls = [], roofs = [], blocks = [];
    const wallCol = ['#efe8da', '#e6dccb', '#f3efe6', '#d9d2c4'].map(C), roofCol = ['#5a5f66', '#4f555c', '#6b6f73', '#7a5b4a'].map(C);
    for (let n = 0; n < 3200 && walls.length + blocks.length < 560; n++) {
      const x = rand(-1100, 1500), z = rand(-1300, 1200), p = at(x, z), ry = rand(-0.2, 0.2) + 0.3;
      if (inside(p) || gap(p) < 120 || busy(x, z) || near(p, railLine, 14) || nearWater(p)) continue;
      // 敷地の塀の内側（場内）と歩道橋の下には建てない
      if (inWall(p) || near(p, walkPath.pts, 10)) continue;
      if (n % 9 === 0) { const w = rand(16, 26), h = rand(10, 16); blocks.push({ p: new V3(p.x, h / 2 - 1, p.z), s: new V3(w, h, w * 0.5), r: [0, ry, 0], c: wallCol[n % 4] }); continue; }
      const w = rand(6, 9), h = rand(4.5, 7);
      walls.push({ p: new V3(p.x, h / 2 - 1, p.z), s: new V3(w, h, w * 0.8), r: [0, ry, 0], c: wallCol[n % 4] });
      roofs.push({ p: new V3(p.x, h - 1, p.z), s: new V3(w * 0.55, 3, w * 0.45), r: [0, ry, 0], c: roofCol[n % 4] });
    }
    // 四角すいの角を箱の角に合わせる（45度回して底面を±1の正方形にする）
    const roofG = new THREE.ConeGeometry(Math.SQRT2, 1, 4); roofG.rotateY(Math.PI / 4); roofG.translate(0, 0.5, 0);
    for (const m of [inst(BOX, toon('#ffffff'), walls, false), inst(roofG, toon('#ffffff'), roofs, false), inst(BOX, toon('#ffffff'), blocks, false)]) backdrop(m); }
  // 山並み：西の六甲山系（六甲山は西へ約9km）、その手前の甲山（西南西へ約3km）、北の長尾山から中山連山。東と南は大阪平野へ開けている
  { const base = at(300, 150), toward = (a, dist) => base.clone().add(new V3(Math.cos(a), 0, Math.sin(a) * track.turn).multiplyScalar(dist));
    const cone = new THREE.ConeGeometry(1, 1, 8); cone.translate(0, 0.5, 0);
    const deg = d => d * Math.PI / 180, ridge = [];
    const range = (a0, a1, dist, n, h0, h1) => { for (let i = 0; i < n; i++) { const p = toward(deg(lerp(a0, a1, i / (n - 1))), dist + rand(-60, 80)); p.y = -6; ridge.push({ p, s: new V3(rand(140, 200), rand(h0, h1), rand(110, 160)), r: [0, rand(0, 3), 0] }); } };
    range(-52, 30, 1350, 11, 110, 170);   // 六甲山系（摩耶山〜六甲山〜宝塚の北）
    range(42, 112, 1250, 9, 60, 110);     // 長尾山〜中山連山
    backdrop(inst(cone, toon(th.mount, { fog: true }), ridge, false));
    // 甲山：六甲の手前に、お椀を伏せたような丸い姿で立つ
    const kabuto = toward(deg(-29), 820), dome = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), toon('#6f8f78', { fog: true }));
    dome.position.set(kabuto.x, -6, kabuto.z); dome.scale.set(150, 95, 130); world.add(backdrop(dome)); }
  fallingLeaves(TEX_PETAL, ['#ffd5e7', '#f5add0'], 35);
}
