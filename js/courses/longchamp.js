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

  // ムーラン・ド・ロンシャン：1〜2コーナーの外、凱旋門賞の発走地点の脇に残る、かつての修道院の石造りの風車（高さ約19m）。羽根がゆっくり回る。
  // 中継カメラ（走路の外側）が通り抜けないよう、実際の位置（地図の(127, 695)）より少しコースから離して置く
  { const p = at(122, 745), aim = at(100, 600), g = registerLandmark(new THREE.Group(), 'ムーラン・ド・ロンシャン（風車）');
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

  // 内馬場のゴルフ場（ゴルフ・パリロンシャン）：グリーンと旗、砂のバンカー
  const greens = [[-60, -110], [-30, 90], [35, 190]];
  for (const [x, y] of greens) {
    const p = at(x, y), g = new THREE.Group(); g.position.set(p.x, track.groundH(p.x, p.z) + 0.1, p.z); world.add(g);
    part(g, new THREE.CircleGeometry(1, 28), toon('#86cf6c'), [0, 0, 0], [7, 5, 1], [-Math.PI / 2, 0, 0], 0);
    part(g, new THREE.CircleGeometry(1, 20), toon('#e8d9a8'), [5.5, 0.02, 4.5], [2.6, 1.6, 1], [-Math.PI / 2, 0, 0.4], 0);
    addBox(g, [0.15, 4.2, 0.15], [1, 2.1, -1], toon('#f4f2ea'), null, 0); addBox(g, [1.4, 0.9, 0.05], [1.7, 3.7, -1], toon('#d9302e'), null, 0);
  }

  // 森の木（秋のブローニュの森）：場内の外側を囲む。スタンド・パドック・正門と池のある西側の直線の裏は空ける
  const autumn = ['#c9772a', '#e0a53a', '#9aa83a', '#d9902e', '#7f9a3a', '#b5562a', '#e8c24a'];
  const homeSide = (x, y) => { const fx = (x + 207) * 0.28 + (y + 33) * 0.96, fz = (x + 207) * 0.96 - (y + 33) * 0.28; return fz < -8 && fz > -430 && fx > -80 && fx < 720; };
  const spots = [];
  // 外側は中継カメラ（走路の外24m）の通り道をあけ、走路から44m以上離す
  for (let n = 0; n < 1800 && spots.length < 340; n++) {
    const x = rand(-480, 1000), y = rand(-950, 1100), p = at(x, y);
    if (homeSide(x, y) || wet(x, y) || inside(p) || gap(p) < 44 || !clearOfCourses(p) || near(p, seine.pts, 54) || gap(p) > 230) continue;
    p.y = track.groundH(p.x, p.z); spots.push({ p });
  }
  // 風車のそばの小さな林
  for (let n = 0; n < 40; n++) { const p = at(rand(-50, 95), rand(664, 760)); if (gap(p) > 44 && p.distanceTo(at(122, 745)) > 10) { p.y = track.groundH(p.x, p.z); spots.push({ p }); } }
  // 内馬場はゴルフ場の芝が広がり、木はまばら
  for (let n = 0; n < 200 && spots.length < 370; n++) {
    const x = rand(-200, 260), y = rand(-450, 620), p = at(x, y);
    if (!inside(p) || !clearOfCourses(p) || p.distanceTo(boardPos) < 30 || greens.some(([gx, gy]) => Math.hypot(x - gx, y - gy) < 24)) continue;
    p.y = track.groundH(p.x, p.z); spots.push({ p });
  }
  roundTrees(spots, autumn);
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
    for (let n = 0; n < 900 && walls.length < 280; n++) {
      const x = rand(-2600, 2600), y = rand(-2400, 2800), p = at(x, y), d = Math.hypot(x - 20, y - 40);
      if (d < 1300 || d > 3000 || near(p, seine.pts, 60)) continue;
      // 東から南東はブローニュの森が続くので、木立の固まりを置く
      if (x > 250 && x < 2200 && y > -1300 && y < 1400) { woods.push({ p: new V3(p.x, -2, p.z), s: new V3(rand(22, 40), rand(10, 18), rand(22, 40)), r: [0, rand(0, 3), 0] }); continue; }
      const w = rand(14, 24), h = rand(9, 15), ry = rand(0, 3);
      walls.push({ p: new V3(p.x, h / 2 - 1, p.z), s: new V3(w, h, w * 0.7), r: [0, ry, 0], c: cream[n % 4] });
      roofs.push({ p: new V3(p.x, h - 1, p.z), s: new V3(w * 0.96, 2.4, w * 0.62), r: [0, ry, 0] });
    }
    backdrop(inst(BOX, toon('#ffffff'), walls, false)); backdrop(inst(BOX, toon('#6f7d8f'), roofs, false)); backdrop(inst(SPH_LO, toon('#8a7a3e', { fog: true }), woods, false)); }
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
