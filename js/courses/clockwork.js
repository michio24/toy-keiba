// ゼンマイ王国トロフィ
'use strict';

/* ---- ゼンマイ王国：スイス・ジュラ山地の時計の町（ラ・ショー＝ド＝フォン／ル・ロックル）を下敷きにした沿道 ---- */
// 見立て：向正面の外（北）に碁盤目の時計の町、東の搬送路の外に時計職人の工房、西の歯車シケインにジャケ＝ドローのからくり人形。
// 区間の役割：1 メゾン・ブランシュの丘／2 ゼンマイ搬送路と時計職人の工房／3 国際時計博物館のカリヨン（最高地点）／
// 4 碁盤目の町並みと大時計台の下り／5 コル・デ・ロッシュの地下水車／6 歯車シケインとからくり人形／7・8 シャトー・デ・モンとジュラの牧草地／
// 0 レオポルド・ロベール大通りのホーム直線（記念噴水）。内馬場はジュラの放牧地と王国の大ゼンマイ
function decorClockwork(th) {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const { shuffle, roadDist, occupied, taken, clearAt, groundAt, onGround, local, at, scatter, label, site, PRISM, CYL, CYL_T, addInst, herd, pathRibbon } = sceneryKit();
  // 案内板は真鍮の縁取りに紺の地（時計の文字盤の色）
  const signAt = (g, text, y, w = 14) => { const sp = label(text, w, w / 4, '#22324f', '#f3d999'); sp.position.set(0, y, 0); sp.scale.set(w, w / 4, 1); g.add(sp); return sp; };
  const brass = toon('#c6a05c'), darkBrass = toon('#8a6a3a'), steel = toon('#b9c6cc'), dark = toon('#5b463c'), slate = toon('#4d5560');
  const cream = toon('#f1e8d4'), limestone = toon('#d9d2c1'), wood = toon('#7a5b3e'), darkWood = toon('#4f3b2a'), skin = toon('#f3d6bd');
  const updates = [];
  // 歯車：円板・歯・ハブ・スポーク。回転は group.rotation.z（軸は局所Z）
  const gear = (r, teeth, mat, thick = 1) => {
    const g = new THREE.Group();
    part(g, new THREE.CylinderGeometry(r, r, thick, 28), mat, [0, 0, 0], null, [Math.PI / 2, 0, 0], 0.03);
    for (let j = 0; j < teeth; j++) { const a = j / teeth * Math.PI * 2; addBox(g, [r * 0.16, r * 0.2, thick], [Math.sin(a) * r * 1.07, Math.cos(a) * r * 1.07, 0], mat, [0, 0, -a]); }
    part(g, CYL, darkBrass, [0, 0, 0], [r * 0.22, thick * 1.6, r * 0.22], [Math.PI / 2, 0, 0], 0);
    for (let j = 0; j < 3; j++) addBox(g, [r * 0.12, r * 1.6, thick * 1.2], [0, 0, 0], darkBrass, [0, 0, j * Math.PI / 3]);
    return g;
  };
  // 窓の並ぶ壁の模様：階数 floors、最上階を時計職人の横長の仕事窓（アトリエ）にするか
  const facade = (bg, floors, atelier) => ctex(256, 256, c => {
    c.fillStyle = bg; c.fillRect(0, 0, 256, 256);
    const fh = 256 / floors;
    for (let f = 0; f < floors; f++) {
      const y = f * fh + fh * 0.25;
      if (atelier && f === 0) { c.fillStyle = '#3d5466'; c.fillRect(14, y, 228, fh * 0.45); c.fillStyle = bg; for (let x = 14; x < 242; x += 19) c.fillRect(x, y, 3, fh * 0.45); continue; }
      for (let x = 0; x < 6; x++) { c.fillStyle = '#41586a'; c.fillRect(16 + x * 40, y, 20, fh * 0.5); c.fillStyle = '#d8cbb2'; c.fillRect(13 + x * 40, y + fh * 0.5, 26, 3); }
    }
  });
  const facadeMats = [['#efe2c6', 5, true], ['#e6d3b0', 4, false], ['#d9c9b8', 5, false], ['#f2ead9', 4, true], ['#e8c9a8', 5, false]].map(([bg, f, a]) => toon('#ffffff', { map: facade(bg, f, a) }));

  /* ---- 遠景：南西から北東へ平行に連なるジュラの山並みと、トウヒの森 ---- */
  {
    const ridges = [], yaw = -0.55;
    for (let k = 0; k < 6; k++) for (let i = 0; i < 9; i++) {
      // 褶曲が作った細長い稜線を、帯ごとに平行に並べる（帯の間が谷）
      const side = k < 3 ? -1 : 1, d = (k % 3) * 170 + 620, along = (i - 4) * 230 + rand(-40, 40);
      const p = new V3(Math.cos(yaw) * along - Math.sin(yaw) * d * side, -25, Math.sin(yaw) * along + Math.cos(yaw) * d * side);
      if (p.length() < 560) continue;
      ridges.push({ p, s: new V3(rand(170, 240), rand(60, 105) + (k % 3) * 18, rand(70, 100)), r: [0, -yaw, 0], c: C(['#4f6f4c', '#5d7d54', '#6c8a5c', '#56744f'][(k + i) % 4]) });
    }
    const ridgeMesh = inst(SPH_LO, toon('#ffffff', { fog: true }), ridges, false); ridgeMesh.userData.backdrop = true;
    // 山腹の牧草地の明るい斑
    const meadows = ridges.filter((_, i) => i % 3 === 0).map(r => ({ p: r.p.clone().add(new V3(0, r.s.y * 0.55, 0)), s: new V3(r.s.x * 0.45, r.s.y * 0.35, r.s.z * 0.5), r: r.r, c: C('#86a465') }));
    const meadowMesh = inst(SPH_LO, toon('#ffffff', { fog: true }), meadows, false); meadowMesh.userData.backdrop = true;
  }

  /* ---- 第3区間（最高地点）：国際時計博物館（MIH）の公園と、15分ごとに鳴る鋼のカリヨン ---- */
  let chime = 0;
  {
    const g = site('国際時計博物館のカリヨン', at(3, 0.5), W / 2 + 26, 20, 16, '#8fb06a');
    // カリヨン：ステンレスの骨組みに24本の管の鐘と12枚の動く羽根。演奏中は色の光が灯る
    for (const x of [-6, 6]) for (const z of [-3, 3]) addBox(g, [0.7, 16, 0.7], [x, 8, z], steel);
    addBox(g, [13.4, 0.8, 7.4], [0, 16.2, 0], steel); addBox(g, [13.4, 0.6, 0.6], [0, 9, -3], steel); addBox(g, [13.4, 0.6, 0.6], [0, 9, 3], steel);
    const bells = [];
    for (let i = 0; i < 24; i++) {
      const row = i < 12 ? -1.2 : 1.2, x = -5.2 + (i % 12) * 0.95, len = 2.2 + ((i * 7) % 12) * 0.32;
      const b = new THREE.Group(); b.position.set(x, 15.8, row); g.add(b);
      part(b, new THREE.CylinderGeometry(0.22, 0.22, len, 10), steel, [0, -len / 2, 0], null, null, 0.04);
      bells.push(b);
    }
    const blades = [];
    for (let i = 0; i < 12; i++) {
      const b = new THREE.Group(); b.position.set(-5.5 + i, 5, -3.6); g.add(b);
      addBox(b, [0.8, 3.4, 0.12], [0, 0, 0], toon(i % 2 ? '#dfe7ea' : '#c3cfd5'));
      blades.push(b);
    }
    const lamps = ['#ff7a6b', '#ffd36f', '#7fd1ff', '#9ff59a'].map((col, i) => part(g, SPH_LO, glowMat(col, 0.4), [-5 + i * 3.3, 0.8, -4.6], [0.6, 0.6, 0.6], null, 0));
    signAt(g, '国際時計博物館（MIH）のカリヨン', 20, 18);
    // 博物館：半地下の建物。芝の屋根と、公園に面したガラスの正面
    const mih = site('国際時計博物館', at(3, 0.15), W / 2 + 34, 26, 14, '#8fb06a');
    addBox(mih, [24, 4, 12], [0, 2, 0], toon('#8a8f93'));
    addBox(mih, [24.6, 0.8, 12.6], [0, 4.2, 0], toon('#7fae62'));
    addBox(mih, [20, 2.6, 0.2], [0, 1.8, -6.05], toon('#5f8597'));
    for (let x = -9; x <= 9; x += 3) addBox(mih, [0.25, 2.8, 0.3], [x, 1.8, -6.1], steel);
    signAt(mih, '国際時計博物館（MIH）', 8, 14);
    // 15秒ごと（実物は15分ごと）とゴールの瞬間に演奏：鐘が揺れ、羽根が回り、色の光が灯る
    let next = 6;
    updates.push((t, dt) => {
      if (t > next) { chime = 4; next = t + 15; }
      chime = Math.max(0, chime - dt);
      const k = reduced.matches ? 0 : chime;
      bells.forEach(b => { b.userData.droneIgnore = true; }); blades.forEach(b => { b.userData.droneIgnore = true; });
      bells.forEach((b, i) => { b.rotation.x = k ? Math.sin(t * 9 + i * 0.7) * 0.12 * Math.min(1, k) : 0; });
      blades.forEach((b, i) => { b.rotation.y = k ? t * 3 + i * 0.5 : i * 0.26; });
      lamps.forEach((l, i) => { l.material.color.set(['#ff7a6b', '#ffd36f', '#7fd1ff', '#9ff59a'][i]).multiplyScalar(chime ? 1.6 + Math.sin(t * 6 + i) * 0.5 : 0.4); });
    });
  }

  /* ---- 第4区間：碁盤目の時計の町（世界遺産）と、ゼンマイ王国の大時計台 ---- */
  // 町は向正面と平行な帯（通り）に並ぶ。南（走路側）に庭、北に通り。大きな建物の敷地を先に確保する
  const backS0 = at(4, 0), backS1 = at(4, 1);
  let clockTex, pendulum, keyHandle;
  {
    // 大時計台：王国の象徴。背中の大きなねじ巻き鍵がゆっくり回る
    const g = site('ゼンマイ王国の大時計台', at(4, 0.42), W / 2 + 44, 26, 16, '#c9b28a');
    for (const x of [-11, 11]) addBox(g, [4, 38, 14], [x, 19, 0], dark, null, 0.02);
    addBox(g, [26, 3, 14], [0, 38.5, 0], dark); addBox(g, [26, 3, 14], [0, 1.5, 0], dark);
    part(g, PRISM, slate, [0, 40, 0], [27, 9, 15], null, 0.02);
    function drawClock(c, t) {
      c.fillStyle = '#fff0c4'; c.fillRect(0, 0, 256, 256); c.strokeStyle = '#5b463c'; c.lineWidth = 5;
      for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; c.beginPath(); c.moveTo(128 + Math.sin(a) * 94, 128 - Math.cos(a) * 94); c.lineTo(128 + Math.sin(a) * 109, 128 - Math.cos(a) * 109); c.stroke(); }
      for (const [angle, len, width] of [[t * 0.025, 82, 7], [t * 0.025 / 12 + 1.2, 57, 10]]) { c.lineWidth = width; c.beginPath(); c.moveTo(128, 128); c.lineTo(128 + Math.sin(angle) * len, 128 - Math.cos(angle) * len); c.stroke(); }
      c.fillStyle = '#5b463c'; c.beginPath(); c.arc(128, 128, 9, 0, Math.PI * 2); c.fill();
    }
    clockTex = ctex(256, 256, c => drawClock(c, 0), false); clockTex.userData.draw = drawClock;
    const face = new THREE.MeshBasicMaterial({ map: clockTex });
    // 文字盤は走路側（-Z）に向ける
    part(g, new THREE.CylinderGeometry(9.5, 9.5, 2, 32), [brass, face, face], [0, 30, -7.2], null, [-Math.PI / 2, 0, 0], 0);
    pendulum = new THREE.Group(); pendulum.position.set(0, 19, -7.4); g.add(pendulum);
    addBox(pendulum, [0.6, 12, 0.6], [0, -6, 0], brass); part(pendulum, SPH_LO, brass, [0, -12.5, 0], [2.6, 2.6, 0.9]);
    keyHandle = new THREE.Group(); keyHandle.position.set(0, 28, 9); g.add(keyHandle);
    part(keyHandle, CYL, brass, [0, 0, 1.5], [0.7, 3, 0.7], [Math.PI / 2, 0, 0], 0);
    for (const x of [-2.6, 2.6]) part(keyHandle, new THREE.TorusGeometry(2.4, 0.7, 8, 20), brass, [x, 0, 3.2], null, [Math.PI / 2, 0, 0], 0.04);
    signAt(g, 'ゼンマイ王国の大時計台', 50, 16);
    // 大寺院（楕円形の教会）と、町いちばんの高層建築
    const temple = site('楕円形の大寺院', at(4, 0.75), W / 2 + 92, 26, 18, '#c9b28a');
    part(temple, CYL, cream, [0, 6, 0], [12, 12, 8], null, 0.02);
    part(temple, new THREE.ConeGeometry(1, 1, 24), toon('#7b4a3a'), [0, 15, 0], [13, 6, 9], null, 0.02);
    addBox(temple, [6, 26, 6], [0, 13, -9.5], cream, null, 0.02);
    part(temple, new THREE.ConeGeometry(1, 1, 4), toon('#4f7f6b'), [0, 29, -9.5], [4.5, 7, 4.5], [0, Math.PI / 4, 0], 0);
    signAt(temple, '楕円形の大寺院', 35, 12);
    const tower = site('町の高層塔', at(4, 0.18), W / 2 + 110, 12, 12, '#c9b28a');
    addBox(tower, [10, 54, 10], [0, 27, 0], toon('#ffffff', { map: facade('#cdd3d6', 14, false) }), null, 0.02);
    addBox(tower, [11, 1.5, 11], [0, 54.5, 0], steel);
  }
  {
    // 町と走路の間を走る、赤い2両の近郊電車（ラ・ショー＝ド＝フォン〜ル・ロックル）
    const s0 = at(4, 0.02), s1 = at(5, 0.3), lane = W + 22;
    courseRibbon(s0, s1, lane - 2.2, lane + 2.2, 0.08, toon('#9a8f80', { side: THREE.DoubleSide }));
    for (const dv of [-0.75, 0.75]) courseRibbon(s0, s1, lane + dv - 0.08, lane + dv + 0.08, 0.32, toon('#6f6a66', { side: THREE.DoubleSide }));
    const sleepers = []; for (let s = s0; s < s1; s += 1.2) { const f = tp(s, lane); sleepers.push({ p: f.v.clone().add(new V3(0, 0.18, 0)), s: new V3(0.35, 0.16, 2.6), r: [0, -f.h, 0] }); }
    addInst(BOX, darkWood, sleepers, false);
    for (let s = s0; s < s1; s += 6) { const p = tp(s, lane).v; occupied.push({ x: p.x, z: p.z, r: 4 }); }
    const train = fantasyGroup(); registerLandmark(train, '近郊電車');
    const red = toon('#d33a32'), white = toon('#f4f1ea'), win = toon('#3d5466');
    for (const x of [-7.6, 7.6]) {
      addBox(train, [14.8, 3.4, 3], [x, 2.3, 0], red, null, 0.03); addBox(train, [14.8, 0.5, 3.05], [x, 1.1, 0], white);
      addBox(train, [12.5, 1.1, 3.08], [x, 2.8, 0], win); part(train, CYL, toon('#c7c9cb'), [x, 4.05, 0], [1.4, 0.3, 1.4], null, 0);
    }
    addBox(train, [0.5, 2.5, 0.12], [8, 6, 0], toon('#3b3b3b'));
    const span = s1 - s0 - 30;
    updates.push(t => {
      const u = reduced.matches ? 0.5 : (Math.sin(t * 0.07) + 1) / 2, s = s0 + 15 + u * span, f = tp(s, lane);
      train.userData.droneIgnore = true; train.position.copy(f.v); train.position.y += 0.3; train.rotation.y = -f.h;
    });
  }

  /* ---- 第2区間：ゼンマイ搬送路（両脇の駆動歯車）と、時計職人の工房 ---- */
  const conveyor = track.zones[0];
  if (conveyor) {
    const drives = [];
    for (let s = conveyor.start + 10; s < conveyor.end - 4; s += 22) for (const lane of [-2.6, W + 2.6]) {
      const f = tp(s, lane), g = fantasyGroup(f.v.clone().add(new V3(0, 2.3, 0)));
      g.rotation.y = -f.h; const gr = gear(2.2, 12, lane < 0 ? brass : toon('#d6b16a'), 0.6); g.add(gr);
      drives.push({ gr, k: lane < 0 ? 1 : -1 }); if (drives.length % 3 === 2) themeDetails.push(g);
    }
    // 走路の縁の真鍮の枠
    courseRibbon(conveyor.start, conveyor.end, -1.6, -0.4, 0.5, toon('#b68e4c', { side: THREE.DoubleSide }));
    courseRibbon(conveyor.start, conveyor.end, W + 0.4, W + 1.6, 0.5, toon('#b68e4c', { side: THREE.DoubleSide }));
    drives.forEach(d => { d.gr.userData.droneIgnore = true; });
    updates.push(t => { const a = reduced.matches ? 0 : t * conveyor.motion / 2.2; drives.forEach(d => { d.gr.rotation.z = -a; }); });
  }
  {
    // 時計職人の家：最上階が横長の仕事窓。机を窓に向けて並べ、手元を明るくした
    const atelier = toon('#ffffff', { map: facade('#efe2c6', 3, true) });
    [0.15, 0.4, 0.65, 0.9].forEach((t, i) => {
      const g = site('時計職人の工房' + (i + 1), at(2, t), W / 2 + 24 + (i % 2) * 6, 14, 10, '#b7b39a');
      addBox(g, [13, 10, 9], [0, 5, 0], atelier, null, 0.02);
      part(g, PRISM, toon(i % 2 ? '#7b4a3a' : '#5a5f66'), [0, 10, 0], [13.6, 4.5, 10], null, 0.02);
      addBox(g, [1, 3, 1], [4, 12, 2], toon('#9b6b52'));
      if (i === 1) signAt(g, '時計職人の工房（横長の仕事窓）', 18, 18);
    });
    // 時計工場：窓の大きな20世紀初めの工場と煙突
    const g = site('時計工場', at(1, 0.85), W / 2 + 40, 30, 14, '#b7b39a');
    addBox(g, [28, 12, 12], [0, 6, 0], toon('#ffffff', { map: facade('#e9e0cf', 4, false) }), null, 0.02);
    addBox(g, [28.6, 1, 12.6], [0, 12.5, 0], toon('#5a5f66'));
    part(g, CYL_T, toon('#a5583f'), [11, 17, 4], [1.2, 12, 1.2], null, 0.03);
    signAt(g, '時計工場', 22, 9);
  }

  /* ---- 第1区間：メゾン・ブランシュ（ル・コルビュジエが両親のために設計した白い家） ---- */
  {
    const g = site('メゾン・ブランシュ', at(1, 0.4), W / 2 + 34, 14, 12, '#9dbb73');
    addBox(g, [10, 8, 9], [0, 4, 0], toon('#f6f4ee'), null, 0.02);
    part(g, CYL, toon('#f6f4ee'), [0, 3, 4.5], [3.2, 6, 3.2], null, 0.02);
    part(g, new THREE.ConeGeometry(1, 1, 4), toon('#5b4c45'), [0, 9.6, 0], [8.4, 3.4, 7.6], [0, Math.PI / 4, 0], 0.02);
    for (const x of [-3, 0, 3]) addBox(g, [1.6, 2, 0.1], [x, 5, -4.55], toon('#5f8597'));
    signAt(g, 'メゾン・ブランシュ（ル・コルビュジエの白い家）', 14, 20);
  }

  /* ---- 第5区間：コル・デ・ロッシュの地下水車（岩の洞窟に造られた水車小屋） ---- */
  let millWheel;
  {
    const g = site('コル・デ・ロッシュの地下水車', at(5, 0.5), W / 2 + 34, 34, 18, '#a8a290');
    // 石灰岩の崖。中ほどに洞窟の口
    const rocks = [[-11, 8, 4, 12, 16, 9], [11, 9, 4, 12, 18, 9], [0, 15, 5, 14, 10, 9], [-6, 21, 6, 16, 6, 8], [7, 22, 6, 14, 6, 8], [-15, 4, 0, 6, 8, 8], [15, 4, 0, 6, 8, 8]];
    rocks.forEach(([x, y, z, w, h, d], i) => addBox(g, [w, h, d], [x, y, z], toon(['#968d7b', '#887f6f', '#a39a87'][i % 3]), [0, 0, (i % 2 ? 1 : -1) * 0.04], 0.02));
    for (const [x, z, h] of [[-12, 4, 7], [-6, 6, 9], [5, 6, 8], [12, 4, 7], [0, 7, 6]]) { part(g, new THREE.ConeGeometry(1, 1, 8), toon('#2f5233'), [x, 24 + h / 2 - (Math.abs(x) > 10 ? 6 : 0), z], [h * 0.32, h, h * 0.32], null, 0.03); }
    addBox(g, [10, 10, 1], [0, 5, 0.2], toon('#2c2826'));
    part(g, CYL, toon('#2c2826'), [0, 10, 0.2], [5, 1, 5], [Math.PI / 2, 0, 0], 0);
    // 洞窟の前の石積みの水車小屋と、木の樋で水を受ける水車
    addBox(g, [9, 6, 6], [-9, 3, -4.5], limestone, null, 0.02);
    part(g, PRISM, toon('#7b4a3a'), [-9, 6, -4.5], [9.6, 3, 6.6], null, 0.02);
    for (const x of [-11, -7]) addBox(g, [1.4, 1.6, 0.1], [x, 3.6, -7.55], toon('#5f8597'));
    millWheel = new THREE.Group(); millWheel.position.set(4, 4.2, -6); millWheel.rotation.y = Math.PI / 2; g.add(millWheel);
    part(millWheel, new THREE.TorusGeometry(3.6, 0.3, 6, 24), wood, [0, 0, 0.6], null, null, 0.04); part(millWheel, new THREE.TorusGeometry(3.6, 0.3, 6, 24), wood, [0, 0, -0.6], null, null, 0.04);
    for (let j = 0; j < 12; j++) { const a = j / 12 * Math.PI * 2; addBox(millWheel, [0.25, 1.5, 1.4], [Math.sin(a) * 3.3, Math.cos(a) * 3.3, 0], darkWood, [0, 0, -a]); addBox(millWheel, [0.18, 3.4, 0.18], [Math.sin(a) * 1.7, Math.cos(a) * 1.7, 0], wood, [0, 0, -a]); }
    part(millWheel, CYL, darkWood, [0, 0, 0], [0.5, 2.4, 0.5], [Math.PI / 2, 0, 0], 0);
    addBox(g, [1.6, 0.6, 9], [4, 8.2, -1.5], wood); addBox(g, [1.2, 0.15, 9], [4, 8.5, -1.5], toon('#6fbcc4'));
    for (const z of [-5.5, 2]) addBox(g, [0.3, 8, 0.3], [4, 4, z], darkWood);
    // 洞窟から流れ出る小川
    addBox(g, [3, 0.12, 9], [4, 0.1, -10], toon('#6fbcc4'));
    signAt(g, 'コル・デ・ロッシュの地下水車', 30, 16);
  }

  /* ---- 第6区間：歯車シケインと、ジャケ＝ドローのからくり人形（書記・素描家・音楽家） ---- */
  const automata = [];
  {
    const coat = ['#2f4f8a', '#7a3b46', '#e6a3b5'], names = ['書記', '素描家', '音楽家'];
    [[0.18, 1], [0.5, -1], [0.84, 1]].forEach(([t, side], i) => {
      const g = site('ジャケ＝ドローのからくり人形（' + names[i] + '）', at(6, t), side * (W / 2 + 15), 10, 9, '#c9b28a', W / 2 + 7);
      // 台座：真鍮の縁取りの台と、ガラスのない小さな東屋
      addBox(g, [9, 1, 8], [0, 0.5, 0], toon('#6b4b3a')); addBox(g, [9.4, 0.3, 8.4], [0, 1.1, 0], brass);
      for (const x of [-4, 4]) for (const z of [-3.5, 3.5]) part(g, CYL, brass, [x, 5.5, z], [0.25, 9, 0.25], null, 0);
      part(g, new THREE.ConeGeometry(1, 1, 4), toon('#2c4a6a'), [0, 11.2, 0], [7.4, 3, 6.2], [0, Math.PI / 4, 0], 0.02);
      // 人形は走路（-Z）を向いて座る。机や楽器はその手前
      const doll = new THREE.Group(); doll.position.set(0, 1.25, 0.8); doll.scale.setScalar(2.2); g.add(doll);
      if (i === 2) {
        // 音楽家：オルガンの前で鍵盤を弾く少女。胸が息づき、首をかしげる
        part(doll, new THREE.ConeGeometry(1, 1, 16), toon(coat[i]), [0, 0.8, 0], [1.1, 1.6, 1.1], null, 0.04);
        addBox(doll, [2, 1.5, 0.9], [0, 0.75, -1.4], toon('#6b4b3a')); addBox(doll, [1.8, 0.12, 0.4], [0, 1.55, -1.2], toon('#f7f3e8'));
        for (let k = 0; k < 6; k++) part(doll, CYL, brass, [-0.75 + k * 0.3, 2.3, -1.7], [0.08, 1.1 + (k % 3) * 0.25, 0.08], null, 0);
      } else {
        // 書記・素描家：机に向かう少年
        part(doll, CYL, toon('#5b463c'), [0, 0.45, 0.2], [0.55, 0.9, 0.55], null, 0);
        addBox(doll, [1.8, 0.12, 1.1], [0, 1.15, -0.9], toon('#6b4b3a')); for (const x of [-0.8, 0.8]) addBox(doll, [0.1, 1.1, 0.9], [x, 0.58, -0.9], toon('#6b4b3a'));
        addBox(doll, [0.8, 0.02, 0.6], [0.15, 1.22, -0.9], toon('#f7f3e8'));
        if (i === 0) part(doll, CYL, toon('#222'), [-0.55, 1.3, -1.1], [0.12, 0.18, 0.12], null, 0);
      }
      const body = new THREE.Group(); body.position.set(0, i === 2 ? 1.6 : 1.1, 0); doll.add(body);
      part(body, new THREE.CapsuleGeometry(0.42, 0.6, 4, 10), toon(coat[i]), [0, 0.45, 0], null, null, 0.04);
      const head = new THREE.Group(); head.position.set(0, 1.25, 0); body.add(head);
      part(head, SPH_LO, skin, [0, 0, 0], [0.42, 0.46, 0.42], null, 0.04);
      part(head, SPH_LO, toon(i === 2 ? '#8a5a35' : '#b9965f'), [0, 0.12, 0.08], [0.45, 0.38, 0.42], null, 0);
      const arms = [-1, 1].map(s => {
        const arm = new THREE.Group(); arm.position.set(s * 0.45, 0.75, 0); body.add(arm);
        part(arm, new THREE.CapsuleGeometry(0.12, 0.6, 3, 8), toon(coat[i]), [0, -0.1, -0.35], null, [Math.PI / 2.4, 0, 0], 0);
        part(arm, SPH_LO, skin, [0, -0.25, -0.75], [0.12, 0.12, 0.12], null, 0);
        if (s > 0 && i < 2) part(arm, CYL, toon(i ? '#3b3b3b' : '#fbfbf6'), [0, -0.1, -0.85], [0.03, 0.55, 0.03], [0.3, 0, 0], 0);
        return arm;
      });
      automata.push({ i, body, head, arms });
      signAt(g, 'からくり人形・' + names[i], 14, 11);
      if (i) themeDetails.push(doll);
    });
    // シケインの頂点で噛み合う大歯車の組
    const chicane = track.zones[1];
    if (chicane) [0.3, 0.7].forEach((t, k) => {
      const s = lerp(chicane.start, chicane.end, t), side = k ? 1 : -1, p = local(s, 0, side * (W / 2 + 13));
      if (!clearAt(p.x, p.z, W / 2 + 8, 6)) return;
      const f = tp(s, W / 2), g = registerLandmark(fantasyGroup(onGround(p)), '歯車シケインの大歯車'); g.rotation.y = -f.h;
      occupied.push({ x: p.x, z: p.z, r: 10 });
      const a = gear(5, 16, brass, 1.2), b = gear(3.2, 10, toon('#d6b16a'), 1.2);
      a.position.set(-2.5, 6.5, 0); b.position.set(5.6, 3.6, 0); g.add(a, b);
      addBox(g, [12, 1, 2], [1, 0.5, 0], dark); addBox(g, [0.8, 6.5, 0.8], [-2.5, 3.2, -0.8], dark); addBox(g, [0.8, 3.6, 0.8], [5.6, 1.8, -0.8], dark);
      a.userData.droneIgnore = b.userData.droneIgnore = true;
      updates.push(t => { const r = reduced.matches ? 0 : t * 0.6; a.rotation.z = r; b.rotation.z = -r * 5 / 3.2 + 0.16; });
    });
  }

  /* ---- 第7区間：シャトー・デ・モン（18世紀の館を使ったル・ロックルの時計博物館） ---- */
  {
    const g = site('シャトー・デ・モン', at(7, 0.5), W / 2 + 40, 28, 16, '#9dbb73');
    const wall = toon('#ffffff', { map: facade('#f3ecdc', 2, false) });
    addBox(g, [24, 8, 11], [0, 4, 0], wall, null, 0.02);
    // マンサード屋根：急な下段と緩い上段
    addBox(g, [24.4, 3, 11.4], [0, 9.5, 0], slate, null, 0.02);
    part(g, PRISM, slate, [0, 11, 0], [23, 3, 10], null, 0.02);
    addBox(g, [7, 9.5, 0.6], [0, 4.75, -5.6], toon('#f7f1e3'));
    part(g, PRISM, toon('#f7f1e3'), [0, 9.5, -5.6], [0.6, 2.6, 7.4], [0, Math.PI / 2, 0], 0);
    for (const x of [-8, 8]) part(g, CYL, toon('#efe7d4'), [x, 13.5, 0], [0.6, 3, 0.6], null, 0);
    addBox(g, [2, 3, 0.1], [0, 1.5, -5.95], toon('#4f3b2a'));
    signAt(g, 'シャトー・デ・モン（ル・ロックル時計博物館）', 18, 20);
    // 館の庭の刈り込みと花壇
    const hedges = []; for (let i = 0; i < 10; i++) hedges.push({ p: g.localToWorld(new V3(-11 + i * 2.45, 0.6, -9)), s: new V3(1, 1, 1), c: C(i % 2 ? '#4f7d44' : '#5e8a4c') });
    inst(SPH_LO, toon('#ffffff'), hedges, false);
  }

  /* ---- ホーム直線（レオポルド・ロベール大通り）：水道の開通を祝う記念噴水と並木 ---- */
  {
    const g = site('記念噴水', at(0, 0.18), -(W / 2 + 20), 14, 14, '#bfb7a5');
    const water = new THREE.MeshStandardMaterial({ color: '#7fc6d6', roughness: 0.2, metalness: 0.1 });
    part(g, new THREE.CylinderGeometry(6.5, 6.8, 1.2, 8), limestone, [0, 0.6, 0], null, null, 0.03);
    part(g, new THREE.CylinderGeometry(6, 6, 0.3, 8), water, [0, 1.1, 0], null, null, 0);
    part(g, new THREE.CylinderGeometry(1.2, 1.6, 4, 8), toon('#5f6f68'), [0, 3, 0], null, null, 0.03);
    part(g, new THREE.CylinderGeometry(3, 1, 0.8, 12), toon('#5f6f68'), [0, 5.2, 0], null, null, 0.03);
    part(g, new THREE.CylinderGeometry(2.6, 2.6, 0.2, 12), water, [0, 5.55, 0], null, null, 0);
    part(g, new THREE.CylinderGeometry(0.5, 0.7, 2.4, 8), toon('#5f6f68'), [0, 6.8, 0], null, null, 0.03);
    for (let i = 0; i < 4; i++) { const a = i / 4 * Math.PI * 2 + Math.PI / 4; part(g, new THREE.CapsuleGeometry(0.45, 1.2, 3, 8), toon('#5f6f68'), [Math.sin(a) * 2.2, 2.6, Math.cos(a) * 2.2], null, null, 0.03); }
    signAt(g, '記念噴水（水道の開通記念）', 12, 14);
    const jet = g.localToWorld(new V3(0, 8.2, 0)), waterCol = C('#e3f6ff');
    let acc = 0;
    updates.push((t, dt) => { if (reduced.matches) return; acc += dt * (lightQuality() ? 6 : 16); while (acc >= 1) { acc--; const a = rand(0, Math.PI * 2); dustP.emit(jet.x, jet.y, jet.z, Math.cos(a) * rand(0.6, 1.4), rand(2.5, 4), Math.sin(a) * rand(0.6, 1.4), 1, rand(0.5, 0.8), waterCol, 6, 0); } });
    // 大通りの並木と、スイスと州の旗
    const trunks = [], crowns = [];
    for (let s = at(0, 0.02); s < at(0, 0.98); s += 14) {
      const p = onGround(local(s, 0, -(W / 2 + 6)));
      if (!clearAt(p.x, p.z, W / 2 + 4, 2) || p.distanceTo(boardPos) < 22) continue;
      trunks.push({ p: p.clone().add(new V3(0, 2, 0)), s: new V3(0.35, 4, 0.35) }); crowns.push({ p: p.clone().add(new V3(0, 5.2, 0)), s: new V3(2.6, 2.4, 2.6), c: C(['#5e8a4c', '#6e9a55'][(Math.random() * 2) | 0]) });
    }
    addInst(CYL_T, toon('#776044'), trunks); addInst(SPH_LO, toon('#ffffff'), crowns);
  }

  /* ---- 内馬場：王国の大ゼンマイと、ジュラの放牧地（石垣、フランシュ・モンターニュ馬、農家） ---- */
  let spring;
  {
    // 大ゼンマイ：渦巻きの板バネを立てた王国の心臓部。ゆっくり巻き上がる
    const c = new V3(-10, 0, -20), g = registerLandmark(fantasyGroup(onGround(c.clone())), '王国の大ゼンマイ');
    occupied.push({ x: c.x, z: c.z, r: 18 });
    part(g, new THREE.CylinderGeometry(9, 10, 2, 24), toon('#6b4b3a'), [0, 1, 0], null, null, 0.03);
    addBox(g, [2, 18, 2], [-9, 9, 0], dark); addBox(g, [2, 18, 2], [9, 9, 0], dark);
    const pts = []; for (let i = 0; i <= 160; i++) { const a = i / 160 * Math.PI * 2 * 4.5, r = 1.2 + i / 160 * 6.6; pts.push(new V3(Math.cos(a) * r, Math.sin(a) * r, 0)); }
    spring = new THREE.Group(); spring.position.set(0, 10.5, 0); g.add(spring);
    part(spring, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 320, 0.32, 6), brass, [0, 0, 0], [1, 1, 3], null, 0.03);
    part(spring, CYL, darkBrass, [0, 0, 0], [1.3, 3, 1.3], [Math.PI / 2, 0, 0], 0);
    const keyG = new THREE.Group(); keyG.position.set(0, 10.5, 2.5); g.add(keyG);
    part(keyG, CYL, brass, [0, 0, 1], [0.5, 2.5, 0.5], [Math.PI / 2, 0, 0], 0);
    for (const x of [-1.8, 1.8]) part(keyG, new THREE.TorusGeometry(1.7, 0.5, 8, 18), brass, [x, 0, 2.4], null, [Math.PI / 2, 0, 0], 0.04);
    spring.userData.key = keyG;
    signAt(g, '王国の大ゼンマイ', 22, 12);
    // ジュラの農家：低い石の壁に、大きく張り出した切妻屋根
    const farm = site('ジュラの農家', at(7, 0.3), -(W / 2 + 40), 22, 16, '#9dbb73');
    addBox(farm, [20, 5, 14], [0, 2.5, 0], toon('#efe7d4'), null, 0.02);
    part(farm, PRISM, toon('#6d5a4a'), [0, 5, 0], [22, 7, 16], null, 0.02);
    addBox(farm, [5, 4, 0.2], [-5, 2, -7.05], toon('#7a5b3e')); for (const x of [3, 6]) addBox(farm, [1.4, 1.4, 0.1], [x, 2.8, -7.05], toon('#5f8597'));
    signAt(farm, 'ジュラの農家', 15, 10);
    // 石垣（乾いた石積み）で区切った放牧地
    const walls = [], wallPts = [[-120, 40, 30, 40], [-60, 80, -100, 80], [20, 60, 110, 60], [60, -60, 120, -80], [-120, -60, -60, -100]];
    for (const [x0, z0, x1, z1] of wallPts) {
      const n = Math.ceil(Math.hypot(x1 - x0, z1 - z0) / 1.6), yaw = -Math.atan2(z1 - z0, x1 - x0);
      for (let i = 0; i <= n; i++) { const p = new V3(lerp(x0, x1, i / n), 0, lerp(z0, z1, i / n)); if (!clearAt(p.x, p.z, W / 2 + 6, 1) || p.distanceTo(boardPos) < 24) continue; walls.push({ p: onGround(p, 0.45), s: new V3(1.7, 0.9 + rand(-0.15, 0.15), 0.8), r: [0, yaw + rand(-0.06, 0.06), 0], c: C(['#8f8a7e', '#7f7a70', '#9c968a'][(Math.random() * 3) | 0]) }); }
    }
    addInst(BOX, toon('#ffffff'), shuffle(walls));
    // フランシュ・モンターニュ馬：ジュラ生まれの、鹿毛で脚の太い温和な馬
    const mares = scatter(12, at(7, 0), track.L, -(W / 2 + 70), -(W / 2 + 18), W / 2 + 14, 3).concat(scatter(6, at(1, 0), at(2, 1), -(W / 2 + 60), -(W / 2 + 20), W / 2 + 14, 3))
      .filter(p => p.distanceTo(boardPos) > 26 && !taken(p.x, p.z, 3)).map(p => ({ p, yaw: rand(0, Math.PI * 2) }));
    mares.forEach(m => occupied.push({ x: m.p.x, z: m.p.z, r: 3 }));
    const bay = toon('#8a5232'), mane = toon('#2a1d17');
    herd(mares, [
      { geo: SPH_LO, mat: bay, off: [0, 1.9, 0], s: [1.5, 0.8, 0.7] }, { geo: SPH_LO, mat: bay, off: [1.35, 2.35, 0], s: [0.55, 0.5, 0.35] },
      { geo: SPH_LO, mat: bay, off: [1.8, 1.9, 0], s: [0.5, 0.3, 0.3] }, { geo: BOX, mat: mane, off: [1.2, 2.75, 0], s: [0.9, 0.25, 0.12] }, { geo: BOX, mat: mane, off: [-1.5, 1.8, 0], s: [0.2, 1, 0.2] },
      ...[[0.95, 0.35], [0.95, -0.35], [-0.95, 0.35], [-0.95, -0.35]].map(([x, z]) => ({ geo: BOX, mat: mane, off: [x, 0.7, z], s: [0.28, 1.4, 0.28] }))
    ]);
  }

  /* ---- 碁盤目の町並み：名所の敷地を確保したあとで、残りを家並みで埋める ---- */
  {
    const f0 = tp(backS0, W / 2), f1 = tp(backS1, W / 2), dir = f1.v.clone().sub(f0.v).setY(0).normalize(), out = f0.n.clone();
    // 町並み：行ごとに通り・庭・建物の帯。最上階に横長の仕事窓を持つ家を混ぜる
    const houses = [], roofs = [], gardens = [], streets = [], trees = [];
    for (let row = 0; row < 6; row++) {
      const v = W / 2 + 48 + row * 30;
      for (let u = -150; u <= 420; u += rand(13, 17)) {
        const w = rand(10, 14), d = 11, h = rand(13, 19);
        const p = f0.v.clone().addScaledVector(dir, u - 60).addScaledVector(out, v); p.y = 0;
        if (!clearAt(p.x, p.z, W / 2 + 26, 7)) continue;
        const y = groundAt(p) - 2, yaw = -Math.atan2(dir.z, dir.x);
        occupied.push({ x: p.x, z: p.z, r: 8 });
        houses.push({ p: new V3(p.x, y + h / 2, p.z), s: new V3(w, h + 4, d), r: [0, yaw, 0], k: (Math.random() * facadeMats.length) | 0 });
        roofs.push({ p: new V3(p.x, y + h + 2, p.z), s: new V3(w + 0.8, 4, d + 1), r: [0, yaw, 0], c: C(['#7b4a3a', '#5a5f66', '#8f5a42', '#4f555c'][(Math.random() * 4) | 0]) });
        // 南側（走路側）の庭
        const gp = p.clone().addScaledVector(out, -9.5);
        gardens.push({ p: new V3(gp.x, groundAt(gp) + 0.05, gp.z), s: new V3(w, 0.1, 7), r: [0, yaw, 0] });
        if (Math.random() < 0.5) trees.push(onGround(gp.clone()));
      }
      // 建物の北側を東西に貫く通り
      streets.push(Array.from({ length: 141 }, (_, i) => f0.v.clone().addScaledVector(dir, -210 + i * 4).addScaledVector(out, v + 10.5).setY(0)));
    }
    const streetMat = toon('#8c8a86', { side: THREE.DoubleSide }); streets.forEach(pts => pathRibbon(pts, 6, 0.06, streetMat, W / 2 + 20));
    facadeMats.forEach((m, k) => { const list = houses.filter(h => h.k === k); addInst(BOX, m, shuffle(list)); });
    addInst(PRISM, toon('#ffffff'), shuffle(roofs)); addInst(BOX, toon('#86ad62'), gardens, false); 
    addInst(SPH_LO, toon('#ffffff'), shuffle(trees.map(p => ({ p: p.clone().add(new V3(0, 3.2, 0)), s: new V3(2.4, 3, 2.4), c: C(['#5e8a4c', '#6e9a55', '#4f7d44'][(Math.random() * 3) | 0]) }))));
  }

  /* ---- 植生：トウヒの森（ジュラの森の放牧地）と、牧草地の花 ---- */
  {
    const trunks = [], tiers = [], flowers = [];
    const spruce = p => { const h = rand(10, 18); trunks.push({ p: new V3(p.x, p.y + 1, p.z), s: new V3(0.5, 2, 0.5) }); for (let k = 0; k < 3; k++) tiers.push({ p: new V3(p.x, p.y + 1.5 + h * (0.12 + k * 0.26), p.z), s: new V3(h * (0.3 - k * 0.07), h * 0.42, h * (0.3 - k * 0.07)), c: C(['#2f5233', '#3a5f3b', '#2a4a30'][k]) }); };
    // 外周の森：町のない西・南・東を中心に（ホーム直線の外はスタンドなので空ける）
    for (const p of scatter(160, at(1, 0.15), at(8, 0.85), W / 2 + 22, W / 2 + 150, W / 2 + 20, 3)) spruce(p);
    // 内馬場の森の放牧地：まばらに立つトウヒ
    for (const p of scatter(45, 0, track.L, -(W / 2 + 90), -(W / 2 + 14), W / 2 + 12, 3)) if (p.distanceTo(boardPos) > 26) spruce(p);
    // リンドウと金鳳花の花
    for (let i = 0; i < 500; i++) {
      const s = rand(0, track.L), v = (Math.random() < 0.5 ? -1 : 1) * rand(W / 2 + 4, W / 2 + 40), p = local(s, 0, v);
      if (!clearAt(p.x, p.z, W / 2 + 3)) continue;
      flowers.push({ p: onGround(p, 0.25), s: new V3(0.2, 0.14, 0.2), c: C(['#3f5fd6', '#ffe066', '#ffffff', '#5a7be8', '#f4c430'][i % 5]) });
    }
    addInst(CYL_T, toon('#5b4434'), shuffle(trunks)); addInst(new THREE.ConeGeometry(1, 1, 8), toon('#ffffff'), shuffle(tiers)); addInst(SPH_LO, toon('#ffffff'), shuffle(flowers), false);
  }

  /* ---- 空：王国の上をゆっくり回る大歯車 ---- */
  const skyGears = [];
  for (let i = 0; i < 6; i++) {
    const a = i / 6 * Math.PI * 2 + 0.3, r = track.extent + 90 + (i % 2) * 60, g = fantasyGroup(new V3(Math.cos(a) * r, 55 + (i % 3) * 18, Math.sin(a) * r));
    g.lookAt(0, g.position.y, 0); const gr = gear(10 + (i % 2) * 4, 14 + (i % 2) * 4, i % 2 ? brass : toon('#d6b16a'), 2); g.add(gr);
    skyGears.push(gr); if (i > 2) themeDetails.push(g);
  }

  /* ---- ゴール：ゼンマイ仕掛けのからくり兵隊が祝福し、カリヨンが鳴る ---- */
  const robot = registerLandmark(fantasyGroup(tp(track.finishS - 10, W + 9).v), 'からくり兵隊');
    addBox(robot, [4, 5, 3], [0, 5, 0], toon('#c8473f'), null, 0.04); addBox(robot, [4.2, 0.6, 3.2], [0, 3.2, 0], brass);
  part(robot, SPH_LO, skin, [0, 8.9, 0], [2.1, 2, 2]); part(robot, CYL, toon('#22324f'), [0, 11.4, 0], [1.6, 2.6, 1.6], null, 0.04);
  for (const x of [-1.2, 1.2]) { addBox(robot, [1, 3, 1], [x, 1.5, 0], toon('#22324f')); part(robot, SPH_LO, toon('#243c50'), [x * 0.6, 9.2, 1.9], [0.28, 0.28, 0.28]); }
  const arms = [-1, 1].map(s => { const arm = new THREE.Group(); arm.position.set(s * 2.5, 7, 0); robot.add(arm); addBox(arm, [1, 4, 1], [0, -2, 0], toon('#c8473f')); return arm; });
  const robotKey = new THREE.Group(); robotKey.position.set(0, 5.5, -1.6); robot.add(robotKey);
  part(robotKey, CYL, brass, [0, 0, -0.5], [0.25, 1, 0.25], [Math.PI / 2, 0, 0], 0);
  for (const x of [-0.7, 0.7]) part(robotKey, new THREE.TorusGeometry(0.65, 0.2, 6, 14), brass, [x, 0, -1.1], null, [Math.PI / 2, 0, 0], 0);
  let celebration = 0, clockTick = -1;
  const finish = tp(track.finishS, W / 2).v, burstCols = ['#ffd36f', '#f7ad75', '#fff3c4', '#c6e2ff'].map(c => C(c).multiplyScalar(2));
  themeFinish = () => { celebration = 7; chime = 6; }; themeReset = () => { celebration = 0; robot.position.y = robot.userData.y; arms.forEach(a => { a.rotation.z = 0; }); };
  robot.userData.y = robot.position.y;
  updates.push((t, dt) => {
    const m = reduced.matches ? 0 : t;
    skyGears.forEach((g, i) => { g.rotation.z = m * 0.15 * (i % 2 ? 1 : -1); });
    pendulum.rotation.z = Math.sin(m * 1.7) * 0.3; keyHandle.rotation.z = m * 0.4; robotKey.rotation.z = m * (celebration ? 6 : 0.8);
    spring.rotation.z = -m * 0.12; spring.userData.key.rotation.z = -m * 0.12;
    if (millWheel) millWheel.rotation.z = -m * 0.8;
    // 書記はペン先を小さく、素描家は大きく動かし、音楽家は鍵盤の上で両手を交互に
    automata.forEach(({ i, body, head, arms: [l, r] }) => {
      if (i === 2) { l.rotation.z = Math.sin(m * 3) * 0.15; r.rotation.z = -Math.sin(m * 3 + 1.5) * 0.15; body.scale.y = 1 + Math.sin(m * 1.2) * 0.03; head.rotation.z = Math.sin(m * 0.6) * 0.15; return; }
      const k = i ? 0.35 : 0.15; r.rotation.x = Math.sin(m * (i ? 1.4 : 3)) * k; r.rotation.y = Math.cos(m * (i ? 1.4 : 3)) * k;
      head.rotation.y = Math.sin(m * 0.5 + i) * 0.25; head.rotation.x = 0.15;
    });
    if (Math.floor(t) !== clockTick) { clockTick = Math.floor(t); clockTex.userData.draw(clockTex.userData.g, t); clockTex.needsUpdate = true; }
    celebration = Math.max(0, celebration - dt);
    arms.forEach((a, i) => { a.rotation.z = celebration ? (i ? -1 : 1) * (2.3 + Math.sin(t * 7) * 0.4) : 0; });
    robot.position.y = robot.userData.y + (celebration ? Math.abs(Math.sin(t * 5)) * 0.7 : 0);
    // ゴールの瞬間：真鍮色の火花が舞う
    if (celebration > 4.5) { const n = reduced.matches ? 1 : lightQuality() ? 3 : 6; for (let i = 0; i < n; i++) sparkP.emit(finish.x + rand(-W / 2, W / 2), finish.y + rand(2, 9), finish.z + rand(-W / 2, W / 2), rand(-2, 2), rand(0.5, 3), rand(-2, 2), rand(1.2, 2.2), rand(0.4, 0.9), burstCols[i % burstCols.length], -0.4, 0.8); }
  });
  themeUpd.push((t, dt) => { for (const f of updates) f(t, dt); });
}
// ゼンマイ王国のスタンド：白い共通スタンドを、スレートのマンサード屋根と真鍮の梁、三つの時計を掲げた観覧席に
function decorClockworkStand(stand, len, z0, roof) {
  const g = new THREE.Group(); stand.add(g); registerLandmark(g, 'clockwork-stand');
  roof.visible = false;
  const recolor = { [C('#f2eef8').getHex()]: '#efe2c6', [C('#e3dcef').getHex()]: '#d8c39c', [C('#d9d3e6').getHex()]: '#5b463c' };
  stand.children.forEach(o => { if (o.isMesh && !o.isInstancedMesh && o.material.color && recolor[o.material.color.getHex()]) o.material.color.set(recolor[o.material.color.getHex()]); });
  const PRISM = new THREE.ExtrudeGeometry(new THREE.Shape([new THREE.Vector2(-0.5, 0), new THREE.Vector2(0.5, 0), new THREE.Vector2(0, 1)]), { depth: 1, bevelEnabled: false });
  PRISM.translate(0, 0, -0.5); PRISM.rotateY(Math.PI / 2);
  const brass = toon('#c6a05c');
  part(g, PRISM, toon('#4d5560'), [0, 13, z0 + 8.5], [len + 6, 4, 24], null, 0.02);
  addBox(g, [len + 6.4, 0.8, 0.8], [0, 13, z0 - 2.6], brass);
  // 梁の上の三つの時計（文字盤は描き込み）
  const dial = ctex(128, 128, c => {
    c.fillStyle = '#fff0c4'; c.beginPath(); c.arc(64, 64, 62, 0, Math.PI * 2); c.fill(); c.strokeStyle = '#5b463c'; c.lineWidth = 4;
    for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; c.beginPath(); c.moveTo(64 + Math.sin(a) * 48, 64 - Math.cos(a) * 48); c.lineTo(64 + Math.sin(a) * 56, 64 - Math.cos(a) * 56); c.stroke(); }
    c.lineWidth = 5; c.beginPath(); c.moveTo(64, 64); c.lineTo(64, 24); c.moveTo(64, 64); c.lineTo(92, 74); c.stroke();
  });
  for (const x of [-len / 3, 0, len / 3]) {
    part(g, new THREE.CylinderGeometry(2.4, 2.4, 0.5, 24), [brass, new THREE.MeshBasicMaterial({ map: dial }), brass], [x, 15.6, z0 - 2.8], null, [-Math.PI / 2, 0, 0], 0.03);
  }
  // 軒の旗：スイスの赤と、時計の町の州旗（緑・白・赤）
  const flags = [], cols = ['#d52b1e', '#f3ead2', '#2f8f4e', '#d52b1e', '#c6a05c'].map(C), tri = new THREE.BufferGeometry();
  tri.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, 0, 0, 0.5, 0, 0, 0, -1, 0], 3)); tri.computeVertexNormals();
  for (let x = -len / 2 - 2; x <= len / 2 + 2; x += 1.6) flags.push({ p: new V3(x, 12.6 - Math.abs(Math.sin((x + len / 2) / 8 * Math.PI)) * 0.6, z0 - 2.7), s: new V3(1, 1, 1), c: cols[(Math.round(x / 1.6) % 5 + 5) % 5] });
  const flagMesh = inst(tri, toon('#ffffff', { side: THREE.DoubleSide }), flags, false); g.add(flagMesh);
}
