// 箱根の下り
'use strict';

/* ---- 箱根の下り：国道1号の沿道（最高地点〜箱根湯本） ---- */
// 名所はコース上の距離 s と、制御点と同じ地図座標（走路の始点が原点・北が-z）で置く。
// この一本道は右回り扱いなので、レーン > W が進行方向の左、レーン < 0 が右になる
function decorHakone(th) {
  mountains(th.mount, 10, false);
  // 走路中心までの距離：32m格子に標本を登録し、近くのセルだけを調べる（skip の区間の標本は除く）
  const CELL = 32, cells = new Map(), cellKey = (cx, cz) => cx * 4096 + cz;
  for (let i = 0; i <= track.N; i += 4) {
    const key = cellKey(Math.floor(track.xs[i] / CELL), Math.floor(track.zs[i] / CELL));
    if (!cells.has(key)) cells.set(key, []);
    cells.get(key).push(i);
  }
  const roadDist = (x, z, r = 64, skip = null) => {
    let best = r * r;
    for (let cx = Math.floor((x - r) / CELL); cx <= Math.floor((x + r) / CELL); cx++) {
      for (let cz = Math.floor((z - r) / CELL); cz <= Math.floor((z + r) / CELL); cz++) {
        for (const i of cells.get(cellKey(cx, cz)) || []) {
          if (skip && i * track.ds > skip[0] && i * track.ds < skip[1]) continue;
          best = Math.min(best, (track.xs[i] - x) ** 2 + (track.zs[i] - z) ** 2);
        }
      }
    }
    return Math.sqrt(best);
  };
  const groundAt = p => track.groundH(p.x, p.z);
  const mapAt = (x, z) => new V3(track.xs[0] + x, 0, track.zs[0] + z);
  const label = (text, w, h, bg, fg, font = 'bold 60px sans-serif') => new THREE.Sprite(new THREE.SpriteMaterial({ map: ctex(512, Math.round(512 * h / w), c => {
    c.fillStyle = bg; c.fillRect(0, 0, 512, 512 * h / w); c.fillStyle = fg; c.font = font; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText(text, 256, 256 * h / w + 4, 490);
  }) }));
  const signAt = (g, text, y, w = 14, bg = '#2c4a3b', fg = '#fff3c4') => { const sp = label(text, w, w / 4, bg, fg); sp.position.set(0, y, 0); sp.scale.set(w, w / 4, 1); g.add(sp); return sp; };

  // 建物の土台：長方形の角と辺の中点が走路から十分離れるまで外へずらし、斜面では台座で水平にする。
  // 向きは「-Zが走路側、+Zが走路から離れる側」にそろえる
  const footprint = (g, w, d) => {
    g.updateMatrixWorld(true);
    return [[-1, -1], [1, -1], [1, 1], [-1, 1], [0, -1], [0, 1], [-1, 0], [1, 0], [0, 0]].map(([a, b]) => g.localToWorld(new V3(a * w / 2, 0, b * d / 2)));
  };
  const occupied = [];
  const site = (name, s, lane, w, d, color = '#c9c1ae', clear = W / 2 + 5) => {
    const out = lane > W / 2 ? 1 : -1, g = new THREE.Group();
    for (let k = 0, ln = lane; k < 40; k++, ln += out * 2) {
      const f = tp(s, ln); g.position.set(f.v.x, 0, f.v.z);
      g.rotation.y = -f.h + (track.sgn < 0 ? Math.PI : 0) + (out < 0 ? Math.PI : 0);
      if (footprint(g, w, d).every(p => roadDist(p.x, p.z) >= clear)) break;
    }
    world.add(g); landmarkFoundation(g, w, d, color); g.updateMatrixWorld(true);
    occupied.push({ x: g.position.x, z: g.position.z, r: Math.hypot(w, d) / 2 + 4 });
    return registerLandmark(g, name);
  };
  const PRISM = (() => {
    const geo = new THREE.ExtrudeGeometry(new THREE.Shape([new THREE.Vector2(-0.5, 0), new THREE.Vector2(0.5, 0), new THREE.Vector2(0, 1)]), { depth: 1, bevelEnabled: false });
    geo.translate(0, 0, -0.5); geo.rotateY(Math.PI / 2); return geo;
  })();
  // 切妻屋根の建物（棟は local x 方向）
  const house = (g, w, h, d, x, z, wall, roof, roofH = d * 0.35) => {
    addBox(g, [w, h, d], [x, h / 2, z], wall, null, 0);
    part(g, PRISM, roof, [x, h, z], [w + 1, roofH, d + 1.2], null, 0);
  };
  const windows = (g, w, h, d, x, z, mat, floors, perFloor, y0 = 2) => {
    const list = [];
    for (let f = 0; f < floors; f++) for (let j = 0; j < perFloor; j++) {
      list.push({ p: new V3(x + (j - (perFloor - 1) / 2) * w / perFloor, y0 + f * (h - y0) / floors, z - d / 2 - 0.06), s: new V3(w / perFloor * 0.55, 1.3, 0.12) });
    }
    const mesh = inst(BOX, mat, list, false); g.add(mesh); mesh.userData.fullCount = list.length; themeDetails.push(mesh);
  };
  const glass = toon('#4f6f7f'), darkWood = toon('#4d3a2c'), plaster = toon('#efe9da'), slate = toon('#4b5752'), stone = toon('#a9a493');

  // 路面：白い外側線と、はみ出し禁止の黄色い中央線
  const white = toon('#eeeee6', { side: THREE.DoubleSide }), yellow = toon('#f0c23a', { side: THREE.DoubleSide });
  courseRibbon(0, track.L, 0.3, 0.6, 0.12, white); courseRibbon(0, track.L, W - 0.6, W - 0.3, 0.12, white);
  courseRibbon(0, track.L, W / 2 - 0.32, W / 2 - 0.1, 0.13, yellow); courseRibbon(0, track.L, W / 2 + 0.1, W / 2 + 0.32, 0.13, yellow);

  // 実在の山：駒ヶ岳・神山（西）、二子山（最高地点の南東）、鷹巣山・浅間山（コースの内側）、明星ヶ岳（北）
  const peakGeo = new THREE.ConeGeometry(1, 1, 28); peakGeo.translate(0, 0.5, 0);
  const peak = (x, z, radius, height, color) => {
    const p = mapAt(x, z), r = Math.min(radius, roadDist(p.x, p.z, radius + 40) - 30);
    if (r < 20) return null;
    // 斜面に浮かないよう、裾の周りで一番低い地面に合わせる
    let base = groundAt(p);
    for (let k = 0; k < 8; k++) base = Math.min(base, track.groundH(p.x + Math.cos(k * Math.PI / 4) * r, p.z + Math.sin(k * Math.PI / 4) * r));
    const m = new THREE.Mesh(peakGeo, toon(color)); m.position.set(p.x, base - 2, p.z); m.scale.set(r, height * r / radius, r); world.add(m);
    return m;
  };
  peak(-249, -169, 170, 120, '#5f7d6c'); peak(-319, -359, 200, 150, '#577563');
  peak(150, 70, 60, 52, '#56795b'); peak(205, 52, 52, 40, '#5c8061');
  peak(285, -209, 55, 34, '#62855e'); peak(384, -359, 120, 60, '#5b7f5a');
  const myojo = peak(530, -864, 240, 130, '#668467');
  if (myojo) {
    // 明星ヶ岳の南斜面に浮かぶ「大」の字（大文字焼きの火床）
    const r = myojo.scale.x, h = myojo.scale.y, phi = Math.atan2(r, h), t = 0.5;
    const dai = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.MeshBasicMaterial({ map: ctex(256, 256, c => {
      c.clearRect(0, 0, 256, 256); c.fillStyle = '#f4f1e4'; c.font = 'bold 230px serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('大', 128, 136);
    }), transparent: true, depthWrite: false }));
    dai.position.set(myojo.position.x, myojo.position.y + h * t + Math.sin(phi) * 2, myojo.position.z + r * (1 - t) + Math.cos(phi) * 2);
    dai.rotation.x = -phi; world.add(dai);
  }

  // 最高地点：スタート横の標識と国道1号の標識、背後の精進池と石仏
  {
    const start = track.finishS - track.def.D;
    const g = site('国道1号最高地点', start + 6, W + 5, 4, 2, '#9b9784', W / 2 + 3);
    addBox(g, [0.3, 5, 0.3], [-1.2, 2.5, 0], toon('#7b857f')); addBox(g, [0.3, 5, 0.3], [1.2, 2.5, 0], toon('#7b857f'));
    const board = signPanel(6, 3, ctex(512, 256, c => {
      c.fillStyle = '#f6f3e6'; c.fillRect(0, 0, 512, 256); c.strokeStyle = '#2d5a8c'; c.lineWidth = 14; c.strokeRect(10, 10, 492, 236);
      c.fillStyle = '#20324a'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = 'bold 56px sans-serif'; c.fillText('国道1号 最高地点', 256, 92, 470);
      c.font = 'bold 64px sans-serif'; c.fillText('標高 874m', 256, 180, 470);
    }));
    board.position.set(0, 4.4, -0.2); g.add(board);
    // 国道の「おにぎり」標識（青い逆三角形に白い1）
    const shield = signPanel(2.2, 2.2, ctex(128, 128, c => {
      c.clearRect(0, 0, 128, 128); c.fillStyle = '#1f5fa8'; c.beginPath(); c.moveTo(8, 10); c.lineTo(120, 10); c.lineTo(64, 122); c.closePath(); c.fill();
      c.strokeStyle = '#fff'; c.lineWidth = 5; c.stroke(); c.fillStyle = '#fff'; c.font = 'bold 64px sans-serif'; c.textAlign = 'center'; c.fillText('1', 64, 72);
    }), { transparent: true });
    shield.position.set(0, 7, -0.2); g.add(shield);
    const marker = label('箱根 下り　最高地点 START', 24, 4, '#294b3c', '#fff1b7', 'bold 48px sans-serif');
    const sq = tp(start, W / 2); marker.position.copy(sq.v).add(new V3(0, 13, 0)); marker.scale.set(24, 4, 1); world.add(marker);
    const pond = mapAt(-56, 70), water = new THREE.Mesh(new THREE.CircleGeometry(1, 40), toon('#4d7f8c'));
    water.rotation.x = -Math.PI / 2; water.position.set(pond.x, groundAt(pond) + 0.08, pond.z); water.scale.set(26, 15, 1); world.add(water);
    const buddhas = [];
    for (let i = 0; i < 7; i++) {
      const a = 2.2 + i * 0.18, q = new V3(pond.x + Math.cos(a) * 31, 0, pond.z + Math.sin(a) * 19);
      buddhas.push({ p: new V3(q.x, groundAt(q) + 0.9, q.z), s: new V3(0.8, 1.8, 0.6) });
    }
    inst(new THREE.CapsuleGeometry(0.5, 0.6, 3, 8), stone, buddhas);
    const g2 = new THREE.Group(); g2.position.set(pond.x, groundAt(pond), pond.z); world.add(g2); signAt(g2, '精進池', 6, 10);
  }

  // 芦之湯：湯けむりの上がる温泉宿
  const steam = [];
  {
    const g = site('芦之湯', 110, W + 14, 26, 12);
    house(g, 13, 7, 10, -6, 0, plaster, slate); house(g, 10, 5.5, 9, 7.5, 0.5, toon('#e6dcc6'), toon('#5a4a3c'));
    windows(g, 13, 7, 10, -6, 0, glass, 2, 5); addBox(g, [13.2, 0.4, 0.3], [-6, 3.6, -5.1], darkWood);
    signAt(g, '芦之湯', 13, 12);
    for (const x of [-10, 2, 11]) steam.push({ p: g.localToWorld(new V3(x, 8, 4)), t: Math.random() * 4 });
  }

  // つつじの庭園：丸い植え込みと池（進行方向の左）。ホテルの庭園なので看板は出さない
  {
    const g = site('つつじの庭園', 590, W + 12, 30, 22, '#8fa06f');
    const bushes = [], cols = ['#e2557d', '#f088a8', '#f6f0f2', '#d9406a', '#ef9bb4'].map(C);
    for (let i = 0; i < 46; i++) {
      const x = rand(-13, 13), z = rand(-9, 9); if (Math.hypot(x - 6, z - 2) < 5) continue;
      const s = rand(1.2, 2.2); bushes.push({ p: new V3(x, s * 0.55, z), s: new V3(s, s * 0.7, s), c: cols[i % cols.length] });
    }
    const mesh = inst(SPH_LO, toon('#ffffff'), bushes, false); g.add(mesh); mesh.userData.fullCount = bushes.length; themeDetails.push(mesh);
    const pondG = new THREE.Mesh(new THREE.CircleGeometry(4.5, 24), toon('#5d8f9a')); pondG.rotation.x = -Math.PI / 2; pondG.position.set(6, 0.06, 2); g.add(pondG);
  }

  // 小涌谷の山あいのホテル（進行方向の左）。企業名の看板は出さない
  {
    const g = site('山あいのホテル', 647, W + 14, 44, 16);
    addBox(g, [40, 13, 12], [0, 6.5, 0], toon('#e8e2d2'), null, 0); addBox(g, [42, 0.8, 13.5], [0, 13.2, 0], slate, null, 0);
    addBox(g, [12, 6, 8], [-10, 3, -9], toon('#d8cfbb'), null, 0);
    windows(g, 40, 13, 12, 0, 0, glass, 3, 12, 3);
  }

  // 登山電車：赤い車体に白い帯。front は +X
  const trainRed = toon('#c7352c'), trainWin = toon('#2c3940'), trainRoof = toon('#9aa2a6'), trainUnder = toon('#33383c');
  const lamp = glowMat('#fff3cf', 2.4), tail = glowMat('#ff4a3a', 2);
  const tozan = (cars = 2) => {
    const g = new THREE.Group(), CAR = 14;
    for (let i = 0; i < cars; i++) {
      const x = -i * (CAR + 0.6);
      addBox(g, [CAR, 2.6, 2.7], [x, 2.0, 0], trainRed, null, 0.02);
      addBox(g, [CAR + 0.04, 0.95, 2.74], [x, 2.6, 0], trainWin, null, 0);
      addBox(g, [CAR + 0.06, 0.18, 2.76], [x, 1.6, 0], toon('#f4f1ea'), null, 0);
      addBox(g, [CAR - 0.4, 0.35, 2.4], [x, 3.45, 0], trainRoof, null, 0);
      addBox(g, [CAR - 3, 0.6, 2.2], [x, 0.55, 0], trainUnder, null, 0);
      for (const end of [1, -1]) {
        if (!(end > 0 ? i === 0 : i === cars - 1)) continue;
        for (const z of [-0.8, 0.8]) addBox(g, [0.2, 0.25, 0.4], [x + end * (CAR / 2 + 0.06), 1.3, z], end > 0 ? lamp : tail, null, 0);
      }
    }
    world.add(g); return g;
  };
  const railMats = { wood: toon('#5f5446'), steel: toon('#b8c0c2') };
  // 線路の通り道（森の木を生やさない帯）
  const corridors = [];
  const nearCorridor = p => corridors.some(([a, b, r]) => {
    const ab = b.clone().sub(a), t = clamp(((p.x - a.x) * ab.x + (p.z - a.z) * ab.z) / Math.max(1e-6, ab.x * ab.x + ab.z * ab.z), 0, 1);
    return Math.hypot(a.x + ab.x * t - p.x, a.z + ab.z * t - p.z) < r;
  });
  // a→b の直線に線路を敷く（y を省くと地面の高さに沿わせる）
  const railLine = (a, b, fixedY = null) => {
    corridors.push([a.clone(), b.clone(), 6]);
    const len = a.distanceTo(b), dir = b.clone().sub(a).normalize(), yaw = -Math.atan2(dir.z, dir.x), sleepers = [], rails = [];
    for (let u = 0; u <= len; u += 2.5) {
      const p = a.clone().addScaledVector(dir, u), y = fixedY ?? groundAt(p);
      sleepers.push({ p: new V3(p.x, y + 0.08, p.z), s: new V3(0.35, 0.1, 2.2), r: [0, yaw + Math.PI / 2, 0] });
      for (const off of [-0.6, 0.6]) rails.push({ p: new V3(p.x - dir.z * off, y + 0.2, p.z + dir.x * off), s: new V3(2.6, 0.12, 0.12), r: [0, yaw, 0] });
    }
    inst(BOX, railMats.wood, sleepers, false); inst(BOX, railMats.steel, rails, false);
  };

  // 小涌谷踏切：登山電車の線路が国道を横切る。ホームと電車は走路の左側に置き、電車は走路へ出ない
  {
    const s = 851, f = tp(s, W / 2), n = f.n.clone(), skip = [s - 45, s + 45];
    // 走路の外側へ、別の区間の走路に近づくまで線路を延ばす
    const arm = side => { let u = W / 2 + 2; while (u < 120) { const p = f.v.clone().addScaledVector(n, side * (u + 3)); if (roadDist(p.x, p.z, 40, skip) < 22) break; u += 3; } return u; };
    const left = arm(1), right = arm(-1);
    railLine(f.v.clone().addScaledVector(n, -right), f.v.clone().addScaledVector(n, left));
    const g = new THREE.Group(); g.position.copy(f.v); g.rotation.y = -f.h; world.add(g);
    // 踏切の警報機と遮断機（上げた状態）：踏切警標は黄と黒
    const crossbuck = ctex(128, 128, c => {
      c.clearRect(0, 0, 128, 128); c.lineWidth = 20; c.lineCap = 'butt';
      for (const [x0, y0, x1, y1] of [[14, 14, 114, 114], [114, 14, 14, 114]]) {
        const gr = c.createLinearGradient(x0, y0, x1, y1); for (let k = 0; k <= 8; k++) { gr.addColorStop(k / 8, k % 2 ? '#1b1b1b' : '#f2c62e'); if (k < 8) gr.addColorStop((k + 1) / 8 - 0.001, k % 2 ? '#1b1b1b' : '#f2c62e'); }
        c.strokeStyle = gr; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke();
      }
    });
    const lamps = [];
    for (const side of [1, -1]) for (const along of [-4.5, 4.5]) {
      if (Math.sign(along) !== side) continue;
      const z = side * (W / 2 + 2.6), x = along;
      addBox(g, [0.25, 4.6, 0.25], [x, 2.3, z], toon('#e9e9e2'));
      const cb = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.8), new THREE.MeshBasicMaterial({ map: crossbuck, transparent: true, side: THREE.DoubleSide }));
      cb.position.set(x, 4.3, z); cb.rotation.y = Math.PI / 2; g.add(cb);
      for (const dz of [-0.45, 0.45]) lamps.push(addBox(g, [0.3, 0.42, 0.42], [x, 3.2, z + dz], toon('#5a1612'), null, 0));
      // 遮断かんは縦に上げてある
      addBox(g, [0.6, 0.9, 0.6], [x + side * 1.1, 0.45, z], toon('#e9e9e2'));
      for (let k = 0; k < 6; k++) addBox(g, [0.14, 1, 0.14], [x + side * 1.1, 1.4 + k, z], toon(k % 2 ? '#1b1b1b' : '#f2c62e'), null, 0);
    }
    // 小涌谷駅のホーム（線路の左側の腕）
    const pa = Math.min(left - 4, W / 2 + 46), pb = W / 2 + 16;
    if (pa > pb + 10) {
      const mid = (pa + pb) / 2, p = f.v.clone().addScaledVector(n, mid), gp = new THREE.Group();
      gp.position.set(p.x - f.dir.x * 2.6, groundAt(p), p.z - f.dir.z * 2.6); gp.rotation.y = -Math.atan2(n.z, n.x); world.add(gp);
      addBox(gp, [pa - pb, 1.0, 2.6], [0, 0.5, 0], toon('#d6d1c3'), null, 0);
      addBox(gp, [(pa - pb) * 0.6, 0.3, 3.2], [0, 3.6, 0.2], slate, null, 0);
      for (const x of [-(pa - pb) * 0.25, (pa - pb) * 0.25]) addBox(gp, [0.25, 2.6, 0.25], [x, 2.3, 0.8], toon('#6b6f6c'));
      const sp = label('小涌谷', 10, 3, '#f7f6f0', '#1d2b33'); sp.position.set(0, 5.2, 0); sp.scale.set(8, 2.4, 1); gp.add(sp);
      registerLandmark(gp, '小涌谷駅');
      occupied.push({ x: p.x, z: p.z, r: (pa - pb) / 2 + 6 });
    }
    // 電車は左の腕の奥とホームの間を行き来し、ホームで停まる
    const train = tozan(2), near = W / 2 + 28, far = Math.max(near, left - 24);
    let clock = rand(0, 30);
    const move = dt => {
      clock += dt;
      const t = clock % 34, k = t < 10 ? 0 : t < 17 ? (t - 10) / 7 : t < 27 ? 1 : 1 - (t - 27) / 7;
      const u = lerp(near, far, (1 - Math.cos(k * Math.PI)) / 2), p = f.v.clone().addScaledVector(n, u);
      train.position.set(p.x, groundAt(p) + 0.25, p.z); train.rotation.y = -Math.atan2(-n.z, -n.x);
      const blink = t > 8 && t < 10 || t > 25 && t < 27;
      lamps.forEach((m, i) => m.material.color.set(blink && (Math.floor(clock * 3) + i) % 2 ? '#ff3b2a' : '#5a1612'));
    };
    train.userData.droneIgnore = true;
    move(0); themeUpd.push((t, dt) => move(Math.min(dt, 0.1)));
  }

  // 宮ノ下の老舗ホテル風の建物：白壁に木組み、寺社風の屋根を重ねた本館と、塔のような別館。企業名の看板は出さない
  {
    const g = site('宮ノ下のクラシックホテル', 993, W + 16, 46, 22, '#b9b29f');
    const roofG = toon('#3f524b'), red = toon('#a8432f');
    addBox(g, [30, 9, 12], [-6, 4.5, 2], plaster, null, 0);
    for (const y of [3.1, 6.2, 9]) addBox(g, [30.3, 0.35, 12.3], [-6, y, 2], darkWood, null, 0);
    for (let x = -20; x <= 8; x += 4) addBox(g, [0.35, 9, 12.3], [x, 4.5, 2], darkWood, null, 0);
    windows(g, 30, 9, 12, -6, 2, toon('#6d4b3a'), 2, 8, 2.2);
    part(g, PRISM, roofG, [-6, 9, 2], [32, 5, 14.5], null, 0);
    // 正面玄関の唐破風（反りのある小さな屋根）
    part(g, new THREE.CylinderGeometry(3.2, 3.2, 6, 16, 1, false, 0, Math.PI), roofG, [-6, 7.6, -5.4], [1, 0.5, 1], [0, 0, Math.PI / 2], 0);
    addBox(g, [5, 5.5, 3], [-6, 2.75, -5], red, null, 0);
    // 花御殿：三層の屋根を重ねた建物
    for (let k = 0; k < 3; k++) {
      addBox(g, [12 - k * 2, 4, 10 - k * 2], [15, 2 + k * 4.4, 3], plaster, null, 0);
      part(g, new THREE.ConeGeometry(1, 1, 4), roofG, [15, 4.4 + k * 4.4, 3], [(12 - k * 2) * 0.82, 1.6, (10 - k * 2) * 0.82], [0, Math.PI / 4, 0], 0);
    }
  }

  // 宮ノ下：国道沿いの小さな商店
  {
    const shops = [['宮ノ下', W + 12, 1046], ['骨董', W + 12, 1060], ['ベーカリー', W + 12, 1074], ['土産', W + 12, 1088]];
    const awnings = ['#2f6b5a', '#a33b33', '#365f8c', '#8c6a2f'];
    shops.forEach(([name, lane, s], i) => {
      const g = site(`宮ノ下・${name}`, s, lane, 9, 7, '#bdb6a6');
      house(g, 8, 6, 6, 0, 0, i % 2 ? plaster : toon('#e3d7bf'), slate, 2);
      addBox(g, [8.2, 0.3, 1.6], [0, 2.8, -3.6], toon(awnings[i]), [0.25, 0, 0], 0);
      windows(g, 8, 6, 6, 0, 0, glass, 1, 3, 4.3);
      if (!i) signAt(g, '宮ノ下', 10, 10);
    });
  }

  // 大平台：ヘアピン手前の黄色い警告板と、駅に停まる登山電車
  {
    const g = site('大平台ヘアピン標識', 1240, W + 5, 3, 1, '#8c8a7c', W / 2 + 2.5);
    addBox(g, [0.3, 4.5, 0.3], [0, 2.25, 0], toon('#7b857f'));
    const board = signPanel(6, 3, ctex(256, 128, c => {
      c.fillStyle = '#ffd23f'; c.fillRect(0, 0, 256, 128); c.strokeStyle = '#222'; c.lineWidth = 8; c.strokeRect(4, 4, 248, 120);
      c.fillStyle = '#222'; c.textAlign = 'center'; c.font = 'bold 46px sans-serif'; c.fillText('大平台', 128, 54); c.font = 'bold 34px sans-serif'; c.fillText('ヘアピンカーブ', 128, 102, 240);
    }));
    board.position.set(0, 5, -0.2); g.add(board);
    // ホーム（走路側）と屋根、その奥の線路に停まる電車
    const st = site('大平台駅', 1296, W + 18, 34, 10, '#b8b2a2');
    addBox(st, [32, 1, 3.4], [0, 0.5, -2.6], toon('#d6d1c3'), null, 0);
    addBox(st, [14, 0.3, 3.8], [0, 3.9, -2.6], toon('#7a3a2e'), null, 0);
    for (const x of [-6, 0, 6]) addBox(st, [0.25, 2.9, 0.25], [x, 2.45, -3.6], toon('#6b6f6c'));
    const sp = label('大平台', 10, 3, '#f7f6f0', '#1d2b33'); sp.position.set(0, 5.6, -2.6); sp.scale.set(8, 2.4, 1); st.add(sp);
    const a = st.localToWorld(new V3(-17, 0, 1.4)), b = st.localToWorld(new V3(17, 0, 1.4));
    railLine(a, b, st.position.y);
    const tr = tozan(2); tr.position.copy(st.localToWorld(new V3(7, 0.15, 1.4))); tr.rotation.y = st.rotation.y;
  }

  // 早川：大平台から湯本まで、走路の右側の谷を流れる川（走路から離した滑らかな線）
  const river = [];
  {
    const raw = [];
    for (let s = 1420; s <= track.L + 40; s += 6) { const q = tp(Math.min(s, track.L), -24); if (s > track.L) q.v.addScaledVector(q.dir, s - track.L); raw.push(q.v); }
    for (let i = 0; i < raw.length; i++) {
      const p = new V3(); let k = 0;
      for (let j = Math.max(0, i - 6); j <= Math.min(raw.length - 1, i + 6); j++) { p.add(raw[j]); k++; }
      p.multiplyScalar(1 / k);
      for (let tries = 0; tries < 20 && roadDist(p.x, p.z) < W / 2 + 13; tries++) {
        const q = tp(clamp(1420 + i * 6, 0, track.L), W / 2); p.add(q.n.clone().multiplyScalar(-1.5));
      }
      river.push(p);
    }
    // 上流側は走路から離れる向きへ延ばし、細い流れから始める
    const back = river[0].clone().sub(river[1]).normalize();
    for (let k = 0; k < 30; k++) {
      const p = river[0].clone().addScaledVector(back, 6);
      if (roadDist(p.x, p.z) < W / 2 + 13 || nearCorridor(p)) break;
      river.unshift(p);
    }
    const pts = [], idx = [];
    river.forEach((p, i) => {
      const nx = river[Math.min(i + 1, river.length - 1)], pv = river[Math.max(i - 1, 0)], d = nx.clone().sub(pv).normalize(), side = new V3(-d.z, 0, d.x);
      const half = 5 * Math.min(1, 0.2 + i / 12);
      for (const w of [-half, half]) { const q = p.clone().addScaledVector(side, w); pts.push(q.x, groundAt(q) + 0.06, q.z); }
      if (i < river.length - 1) { const k = i * 2; idx.push(k, k + 2, k + 1, k + 1, k + 2, k + 3); }
    });
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3)); geo.setIndex(idx); geo.computeVertexNormals();
    const water = new THREE.Mesh(geo, toon('#5e93a3', { side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 })); water.receiveShadow = true; world.add(water);
    const rocks = [];
    river.forEach((p, i) => { if (i % 2) return; for (const w of [-6, 6]) { const nx = river[Math.min(i + 1, river.length - 1)], d = nx.clone().sub(p).normalize(); const q = p.clone().add(new V3(-d.z * w, 0, d.x * w)); const s = rand(0.7, 1.6); rocks.push({ p: new V3(q.x, groundAt(q) + s * 0.3, q.z), s: new V3(s, s * 0.6, s), r: [0, rand(0, 3), 0] }); } });
    fantasyInst(SPH_LO, toon('#9b9a8f'), rocks);
  }

  // 出山の鉄橋（早川橋梁）：川の向こう岸の谷に架かる赤いトラス橋と、渡る登山電車
  {
    const s = 1700, len = 46, y = 13, truss = toon('#b04a33'), g = new THREE.Group();
    let f = tp(s, -50);
    for (let lane = -50; lane > -90; lane -= 5) {
      f = tp(s, lane);
      const ends = [-1, 1].map(k => f.v.clone().addScaledVector(f.dir, k * len / 2));
      if ([f.v, ...ends].every(p => roadDist(p.x, p.z) > W / 2 + 14)) break;
    }
    g.position.set(f.v.x, groundAt(f.v), f.v.z); g.rotation.y = -f.h; world.add(g);
    for (const x of [-len / 2, len / 2]) addBox(g, [4, y + 3, 4], [x, (y - 3) / 2, 0], stone, null, 0);
    addBox(g, [len + 4, 0.8, 3.4], [0, y, 0], truss, null, 0);
    for (const z of [-1.6, 1.6]) {
      addBox(g, [len, 0.4, 0.4], [0, y + 4.2, z], truss, null, 0);
      for (let k = 0; k <= 8; k++) addBox(g, [0.35, 4.4, 0.35], [-len / 2 + k * len / 8, y + 2.2, z], truss, null, 0);
      for (let k = 0; k < 8; k++) addBox(g, [Math.hypot(len / 8, 4.2), 0.3, 0.3], [-len / 2 + (k + 0.5) * len / 8, y + 2.2, z], truss, [0, 0, (k % 2 ? 1 : -1) * Math.atan2(4.2, len / 8)], 0);
    }
    const tr = tozan(2); tr.position.copy(g.localToWorld(new V3(8, y + 0.4, 0))); tr.rotation.y = g.rotation.y;
    registerLandmark(g, '出山の鉄橋');
  }

  // 塔ノ沢：早川の対岸に建つ木造の温泉旅館（進行方向の右、川の向こう）
  {
    const g = site('塔ノ沢温泉', 1839, -46, 22, 12, '#9f9786', W / 2 + 34);
    for (let k = 0; k < 4; k++) {
      addBox(g, [20 - k, 3.6, 11 - k * 0.5], [0, 1.8 + k * 3.6, 0], k % 2 ? plaster : toon('#e3d8c2'), null, 0);
      addBox(g, [20.6 - k, 0.35, 11.6 - k * 0.5], [0, 3.6 + k * 3.6, 0], darkWood, null, 0);
      windows(g, 20 - k, 3.6, 11 - k * 0.5, 0, 0, toon('#7a5a43'), 1, 6, 1.9 + k * 3.6);
    }
    part(g, PRISM, slate, [0, 14.4, 0], [19, 4, 11.5], null, 0);
    signAt(g, '塔ノ沢', 21, 10);
    for (const x of [-6, 6]) steam.push({ p: g.localToWorld(new V3(x, 15, 3)), t: Math.random() * 4 });
  }

  // 函嶺洞門：湯本の手前、山側（左）に残る昭和初期のコンクリート製の洞門
  {
    const s0 = 1880, s1 = 1935, a = W + 12, b = W + 21, conc = toon('#cfc5ab', { side: THREE.DoubleSide });
    courseRibbon(s0, s1, a, b, 6.2, conc);
    const posts = [];
    for (let s = s0; s <= s1; s += 5) {
      const q = tp(s, a + 0.6), y0 = groundAt(q.v);
      posts.push({ p: new V3(q.v.x, y0 + (q.v.y + 6.2 - y0) / 2, q.v.z), s: new V3(1.4, Math.max(1, q.v.y + 6.2 - y0), 1.2), r: [0, -q.h, 0] });
      const w = tp(s, b - 0.5), wy = groundAt(w.v);
      posts.push({ p: new V3(w.v.x, wy + (w.v.y + 6.2 - wy) / 2, w.v.z), s: new V3(5.2, Math.max(1, w.v.y + 6.2 - wy), 1.2), r: [0, -w.h, 0] });
    }
    inst(BOX, toon('#c3b99f'), posts);
    const g = new THREE.Group(), mid = tp((s0 + s1) / 2, a); g.position.copy(mid.v); world.add(g); signAt(g, '函嶺洞門', 11, 12, '#4f4a3c', '#f2ead2');
    registerLandmark(g, '函嶺洞門');
    occupied.push({ x: mid.v.x, z: mid.v.z, r: 32 });
  }

  // 箱根湯本駅：ゴールの先、左側の駅舎と、ホームに停まる登山電車
  {
    // 駅舎（走路側）と、奥のホームに停まる電車
    const st = site('箱根湯本駅', track.L - 10, W + 16, 44, 24, '#b9b4a6');
    addBox(st, [40, 9, 14], [0, 4.5, -4], toon('#f1eee6'), null, 0);
    for (let x = -18; x <= 18; x += 2) addBox(st, [0.5, 7, 0.3], [x, 4.8, -11.2], toon('#8a6a4a'), null, 0);
    addBox(st, [44, 0.8, 16], [0, 9.4, -4.5], slate, null, 0);
    addBox(st, [34, 1, 3], [0, 0.5, 5], toon('#d6d1c3'), null, 0);
    signAt(st, '箱根湯本駅', 13, 16, '#f7f6f0', '#1d2b33');
    railLine(st.localToWorld(new V3(-21, 0, 8.2)), st.localToWorld(new V3(21, 0, 8.2)), st.position.y);
    const tr = tozan(2); tr.position.copy(st.localToWorld(new V3(7, 0.15, 8.2))); tr.rotation.y = st.rotation.y;
    // 湯本の土産物店（ゴール前の両側）
    [[1996, W + 10], [2009, W + 10], [2022, W + 10], [2002, -44]].forEach(([s, lane], i) => {
      const g = site(`湯本の店${i + 1}`, s, lane, 10, 8, '#bdb6a6');
      house(g, 9, 6.5, 7, 0, 0, i % 2 ? plaster : toon('#eadfc8'), i % 2 ? slate : toon('#6d4433'), 2.2);
      addBox(g, [9.2, 0.3, 1.6], [0, 2.8, -4.1], toon(['#a33b33', '#2f6b5a', '#365f8c', '#8c6a2f'][i]), [0.25, 0, 0], 0);
    });
  }

  // 湯けむり：宿の屋根からゆっくり上がって消える
  if (steam.length) {
    const puffs = steam.flatMap(src => Array.from({ length: 4 }, (_, k) => {
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX_SOFT, color: C('#ffffff'), transparent: true, opacity: 0.5, depthWrite: false }));
      world.add(sp); return { sp, src, t: src.t + k };
    }));
    const drift = dt => puffs.forEach(o => {
      o.t = (o.t + dt) % 4; const k = o.t / 4;
      o.sp.position.set(o.src.p.x + Math.sin(o.t * 1.3) * 0.8, o.src.p.y + k * 9, o.src.p.z);
      o.sp.scale.setScalar(2.5 + k * 6); o.sp.material.opacity = 0.55 * Math.sin(k * Math.PI);
    });
    drift(0); themeUpd.push((t, dt) => drift(Math.min(dt, 0.1)));
  }

  // カーブの外側に、赤と黄の矢羽根（シェブロン）を並べる。向きが大きく変わるカーブだけ
  {
    const boards = [];
    let i = 0;
    while (i <= track.N) {
      if (track.ks[i] < 1 / 70) { i++; continue; }
      const i0 = i; while (i <= track.N && track.ks[i] >= 1 / 70) i++;
      const dh = track.hs[Math.min(i, track.N)] - track.hs[i0];
      if (Math.abs(dh) < 70 * Math.PI / 180) continue;
      const lane = Math.sign(dh) === track.sgn ? -3.2 : W + 3.2;
      for (let s = i0 * track.ds; s < i * track.ds; s += 6) {
        const p = track.pos(s, lane); boards.push({ p: new V3(p.x, p.y + 1.6, p.z), s: new V3(0.2, 1.6, 2.2), r: [0, -p.h, 0], c: C(boards.length % 2 ? '#ffd23f' : '#c8362c') });
      }
    }
    fantasyInst(BOX, toon('#ffffff'), boards);
  }

  // 沿道の観客：宮ノ下・大平台と、函嶺洞門からゴールまで（観客アニメーションで跳ねる）
  {
    const people = [];
    const lineUp = (s0, s1, lanes, step) => {
      for (let s = s0; s <= s1; s += step) for (const lane of lanes) {
        const q = track.pos(s + rand(-0.6, 0.6), lane + rand(-0.5, 0.5)), p = new V3(q.x, 0, q.z);
        if (occupied.some(o => (o.x - p.x) ** 2 + (o.z - p.z) ** 2 < o.r * o.r)) continue;
        people.push(new V3(p.x, Math.max(groundAt(p), q.y) + 0.5, p.z));
      }
    };
    lineUp(1040, 1100, [-2.6, W + 2.6], 2.2); lineUp(1280, 1300, [-2.6], 1.8);
    lineUp(1880, track.finishS + 10, [-2.4, -3.6, W + 2.4, W + 3.6], 1.3);
    crowd.dispose(); world.remove(crowd);
    crowd = new THREE.InstancedMesh(new THREE.CapsuleGeometry(0.24, 0.34, 3, 8), toon('#ffffff'), people.length);
    const coats = ['#2f3542', '#e9ecef', '#3d5a80', '#c0392b', '#ffd166', '#1f6f5c', '#7a6c5d', '#ff7eb6'].map(C), m4 = new THREE.Matrix4();
    crowd.userData.base = people.map((p, i) => {
      m4.makeTranslation(p.x, p.y, p.z); crowd.setMatrixAt(i, m4); crowd.setColorAt(i, coats[(Math.random() * coats.length) | 0]);
      return [p.x, p.y, p.z, Math.random() * 6, rand(4, 9)];
    });
    crowd.userData.exc = 0.2; world.add(crowd);
  }

  // 森：杉の木立と広葉樹。走路・川・線路・名所から離して置く。
  // 中継カメラのいる谷側（右）は、走路から34m以内を低い植え込みだけにして馬を隠さない
  {
    const keepOut = (world.userData.landmarks || []).map(g => new THREE.Box3().setFromObject(g).expandByScalar(4));
    const trunks = [], cedars = [], crowns = [], shrubs = [];
    const cedarCols = ['#2f5a43', '#376449', '#2a5240'].map(C), leafCols = ['#4f7d45', '#6b8f4c', '#5c8a52', '#86924f', '#a3753f'].map(C);
    for (let k = 0; k < 2800 && trunks.length < 900; k++) {
      const s = rand(0, track.L), side = Math.random() < 0.5 ? -1 : 1, off = rand(10, 110);
      const q = track.pos(s, side < 0 ? -off : W + off), p = new V3(q.x, 0, q.z), d = roadDist(p.x, p.z);
      if (d < W / 2 + 7) continue;
      if (river.some(r => (r.x - p.x) ** 2 + (r.z - p.z) ** 2 < 110) || nearCorridor(p)) continue;
      if (occupied.some(o => (o.x - p.x) ** 2 + (o.z - p.z) ** 2 < o.r * o.r)) continue;
      p.y = groundAt(p);
      if (keepOut.some(b => b.containsPoint(new V3(p.x, b.min.y + 0.1, p.z)))) continue;
      if (side < 0 && d < 34) {
        if (shrubs.length < 260) { const r = rand(1.2, 2.4); shrubs.push({ p: new V3(p.x, p.y + r * 0.45, p.z), s: new V3(r, r * 0.7, r), c: leafCols[k % 4] }); }
        continue;
      }
      const cedar = Math.random() < 0.55, h = cedar ? rand(14, 24) : rand(8, 13);
      trunks.push({ p: new V3(p.x, p.y + h * 0.25, p.z), s: new V3(0.6, h * 0.5, 0.6) });
      if (cedar) cedars.push({ p: new V3(p.x, p.y + h * 0.3, p.z), s: new V3(h * 0.17, h * 0.85, h * 0.17), c: cedarCols[k % 3] });
      else crowns.push({ p: new V3(p.x, p.y + h * 0.7, p.z), s: new V3(h * 0.38, h * 0.32, h * 0.38), c: leafCols[k % 5] });
    }
    fantasyInst(new THREE.CylinderGeometry(1, 1.15, 1, 6), toon('#5a4636'), trunks);
    fantasyInst(CONE, toon('#ffffff'), cedars);
    fantasyInst(SPH_LO, toon('#ffffff'), crowns);
    fantasyInst(SPH_LO, toon('#ffffff'), shrubs, false);
  }
}
