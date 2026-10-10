// 夕陽デザート記念
'use strict';

/* ---- 夕陽デザート記念：モロッコのサハラ砂漠の入口（世界遺産「アイット－ベン－ハドゥの集落」）を下敷きにした夕暮れの砂漠 ---- */
// 見立て：アトラス山脈の南、ワルザザートからメルズーガのシェビ砂丘へ続く「カスバ街道」を、夕陽の砂漠をひと回りするコースに。
// 区間の役割：0 カスバのスタンドのホーム直線／1 アイット・ベン・ハドゥ：オウニラ川の涸れ川の向こうの土の城塞（クサル）と映画の撮影隊／
// 2 大砂丘の上り：砂よけの柵、ラクダのキャラバン、砂丘のバギー／3 砂丘のてっぺん（最高地点）：ベルベルの砂漠キャンプと、シェビ砂丘の大砂丘の稜線を行くキャラバン／
// 4 砂丘の滑り下り：大砂丘のサンドボード、フェネック／5 オアシスのヤシ林：ナツメヤシと畑、地下水路ハッターラ、井戸、アルガンの木に登るヤギ、「トンブクトゥまで52日」の道しるべ／
// 6 カスバの路地（S字）：走路をまたぐカスバの門と土の壁、タウリルトのカスバ／7 リッサニのスーク：屋台、香辛料の山、ロバの駐車場、水売り／
// 8 ハムリアのグナワの楽団。内馬場はダヤト・スルジの湖とフラミンゴ、夕陽の大砂時計（ファンタジー）。空には熱気球
function decorDune(th) {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const { shuffle, roadDist, occupied, taken, clearAt, groundAt, onGround, local, at, label, site, PRISM, CYL, CYL_T, addInst, beam, route } = sceneryKit();
  const n0 = world.children.length, updates = [];
  // 案内板は素焼きの赤土色の地に、生成りの文字
  const signAt = (g, text, y, w = 14) => { const sp = label(text, w, w / 4, '#7a2f1f', '#ffe9c2'); sp.position.set(0, y, 0); sp.scale.set(w, w / 4, 1); g.add(sp); return sp; };
  const pick = a => a[(Math.random() * a.length) | 0];
  const rot = (x, z, yaw) => [x * Math.cos(yaw) + z * Math.sin(yaw), -x * Math.sin(yaw) + z * Math.cos(yaw)];
  const yawAt = s => -tp(s, W / 2).h;
  // 材質：土を突き固めた壁（ピゼ）の赤土色、ヤシの幹、真鍮
  const pise = toon('#c98a55'), piseDark = toon('#a8673e'), wood = toon('#8a6244'), darkWood = toon('#4a3326'), brass = toon('#c9a046'), steel = toon('#6f7480');
  const warm = toon('#ffd27a', { emissive: C('#ffb347'), emissiveIntensity: 1.1 });   // 窓明かり・焚き火
  const roof4 = new THREE.ConeGeometry(1, 1, 4); roof4.rotateY(Math.PI / 4);   // 屋上の角の飾り（狭間）
  const TOWER = new THREE.CylinderGeometry(0.72, 1, 1, 4); TOWER.rotateY(Math.PI / 4);   // 上すぼまりの四角い塔
  let celebration = 0;

  /* ---- 型と道具：テクスチャ、人、動物、ヤシ、ランタン、帯、道筋 ---- */
  // カスバの塔の壁：上のほうに日干し煉瓦を刻んだ菱形と山形の模様、細い窓。塔の4面に同じ模様が回るよう64pxごとに繰り返す
  const towerTex = ctex(256, 256, g => {
    g.fillStyle = '#c98a55'; g.fillRect(0, 0, 256, 256); speck(g, 256, 256, 900, ['#b97b48', '#d69a62', '#a86e40'], 1, 3, 0.6);
    for (let x = 0; x < 256; x += 64) {
      g.fillStyle = '#8f5532';
      for (let k = 0; k < 3; k++) { const cx = x + 12 + k * 20; g.beginPath(); g.moveTo(cx, 16); g.lineTo(cx + 8, 28); g.lineTo(cx, 40); g.lineTo(cx - 8, 28); g.closePath(); g.fill(); }
      g.strokeStyle = '#8f5532'; g.lineWidth = 4; g.beginPath(); for (let k = 0; k <= 8; k++) g.lineTo(x + k * 8, 54 + (k % 2) * 9); g.stroke();
      g.fillStyle = '#3a2418'; g.fillRect(x + 29, 96, 6, 22); g.fillRect(x + 29, 170, 6, 18);
    }
  });
  const towerM = toon('#ffffff', { map: towerTex });
  // 家の壁：赤土に小さな窓と、軒の濃い帯
  const houseM = toon('#ffffff', { map: ctex(128, 128, g => {
    g.fillStyle = '#c98a55'; g.fillRect(0, 0, 128, 128); speck(g, 128, 128, 300, ['#b97b48', '#d69a62'], 1, 3, 0.6);
    g.fillStyle = '#a8673e'; g.fillRect(0, 0, 128, 10); g.fillStyle = '#3a2418'; g.fillRect(28, 44, 10, 14); g.fillRect(84, 44, 10, 14); g.fillRect(56, 88, 14, 40);
  }) });
  // ゼリージュ（色タイルのモザイク）：八芒星を敷き詰める
  const zelligeTex = ctex(256, 128, g => {
    g.fillStyle = '#f4ecdc'; g.fillRect(0, 0, 256, 128);
    const cols = ['#1f7a5a', '#2b4fa8', '#d9a03a', '#1f2a44'];
    for (let y = 0; y < 128; y += 32) for (let x = 0; x < 256; x += 32) {
      g.fillStyle = cols[((x + y) / 32) % 4];
      for (const a of [0, Math.PI / 4]) { g.save(); g.translate(x + 16, y + 16); g.rotate(a); g.fillRect(-9, -9, 18, 18); g.restore(); }
      g.fillStyle = '#f4ecdc'; g.beginPath(); g.arc(x + 16, y + 16, 4, 0, Math.PI * 2); g.fill();
    }
  }, true);
  const zellige = (u, v) => { const t = zelligeTex.clone(); t.needsUpdate = true; t.repeat.set(u, v); return toon('#ffffff', { map: t }); };
  // 絨毯：縁取りと菱形のメダリオン、両端の房
  const carpetMats = ['#9e2a2b', '#2b3f7a', '#c46a1d', '#6a2b5e'].map((bg, i) => toon('#ffffff', { side: THREE.DoubleSide, map: ctex(128, 192, g => {
    g.fillStyle = bg; g.fillRect(0, 0, 128, 192);
    g.strokeStyle = '#f2dfb4'; g.lineWidth = 6; g.strokeRect(8, 8, 112, 176);
    g.strokeStyle = ['#f2c230', '#e8d6b0', '#2b3f7a', '#f2c230'][i]; g.lineWidth = 3; g.strokeRect(17, 17, 94, 158);
    for (let k = 0; k < 3; k++) { const cy = 46 + k * 50; g.fillStyle = k % 2 ? '#f2dfb4' : ['#1f2a44', '#c8302c', '#2f5a3a', '#e8a33a'][i]; g.beginPath(); g.moveTo(64, cy - 20); g.lineTo(90, cy); g.lineTo(64, cy + 20); g.lineTo(38, cy); g.closePath(); g.fill(); }
    g.fillStyle = '#f2e6c8'; for (let x = 4; x < 128; x += 6) { g.fillRect(x, 0, 2, 6); g.fillRect(x, 186, 2, 6); }
  }) }));

  // 型の部品を、向き yaw・倍率 sc で置いた群れにまとめて描く（ラクダ・ロバ・ヤギ・フラミンゴなど）
  const stamp = (tpl, spots, shadow = true) => {
    if (!spots.length) return;
    tpl.updateMatrixWorld(true);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
    tpl.traverse(o => {
      if (!o.isMesh) return;
      addInst(o.geometry, o.material, spots.map(({ p, yaw, sc = 1 }) => {
        m4.compose(p, q.setFromEuler(e.set(0, yaw, 0)), new V3(sc, sc, sc)).multiply(o.matrixWorld);
        const pp = new V3(), qq = new THREE.Quaternion(), ss = new V3(); m4.decompose(pp, qq, ss);
        const ee = new THREE.Euler().setFromQuaternion(qq); return { p: pp, s: ss, r: [ee.x, ee.y, ee.z] };
      }), shadow);
    });
  };
  // ヒトコブラクダ（局所 +x が前）：長い脚、ひとつのこぶ、前へ伸びる首。saddle で鞍の布、sit で脚を折って座る
  const camelTpl = (legs = [], saddle = null, sit = false) => {
    const g = new THREE.Group(), fur = toon(pick(['#c99a63', '#b8875a', '#d6a873'])), dark = toon('#8a6444'), y0 = sit ? -1.25 : 0;
    part(g, SPH_LO, fur, [0, 2.0 + y0, 0], [1.15, 0.55, 0.5], null, 0); part(g, SPH_LO, fur, [-0.05, 2.45 + y0, 0], [0.6, 0.55, 0.42], null, 0);
    part(g, CYL, fur, [1.25, 2.45 + y0, 0], [0.2, 1.0, 0.2], [0, 0, -0.75], 0); part(g, SPH_LO, fur, [1.75, 2.95 + y0, 0], [0.42, 0.22, 0.2], null, 0);
    for (const z of [-0.12, 0.12]) part(g, SPH_LO, dark, [1.55, 3.12 + y0, z], [0.06, 0.1, 0.05], null, 0);
    part(g, BOX, dark, [-1.15, 1.85 + y0, 0], [0.08, 0.6, 0.08], [0, 0, -0.3], 0);
    if (!sit) for (const [x, z] of [[0.7, 0.25], [0.7, -0.25], [-0.7, 0.25], [-0.7, -0.25]]) {
      const l = new THREE.Group(); l.position.set(x, 1.75, z); g.add(l); legs.push(l);
      part(l, CYL, fur, [0, -0.87, 0], [0.1, 1.75, 0.1], null, 0); part(l, SPH_LO, dark, [0, -1.72, 0], [0.17, 0.06, 0.17], null, 0);
    }
    else for (const z of [-0.45, 0.45]) part(g, SPH_LO, fur, [0, 0.32, z], [1.0, 0.3, 0.18], null, 0);
    if (saddle) {
      const m = toon(saddle); part(g, BOX, m, [-0.05, 2.95 + y0, 0], [1.0, 0.14, 1.15], null, 0);
      for (const z of [-0.58, 0.58]) part(g, BOX, m, [-0.05, 2.55 + y0, z], [0.9, 0.8, 0.04], null, 0);
    }
    return g;
  };
  // ロバ：長い耳と、背の両脇の荷かご
  const donkeyTpl = () => {
    const g = new THREE.Group(), fur = toon('#8f8a84'), pale = toon('#d9d4cc'), dark = toon('#4a4643'), basket = toon('#b08a4a');
    part(g, SPH_LO, fur, [0, 1.1, 0], [0.75, 0.38, 0.3], null, 0); part(g, CYL, fur, [0.72, 1.4, 0], [0.13, 0.6, 0.13], [0, 0, -0.6], 0);
    part(g, SPH_LO, fur, [1.0, 1.62, 0], [0.32, 0.16, 0.14], [0, 0, -0.4], 0); part(g, SPH_LO, pale, [1.25, 1.52, 0], [0.12, 0.1, 0.11], null, 0);
    for (const z of [-0.08, 0.08]) part(g, SPH_LO, fur, [0.92, 1.95, z], [0.05, 0.25, 0.06], [z * 2, 0, 0.2], 0);
    for (const [x, z] of [[0.45, 0.15], [0.45, -0.15], [-0.45, 0.15], [-0.45, -0.15]]) part(g, CYL, dark, [x, 0.42, z], [0.06, 0.85, 0.06], null, 0);
    for (const z of [-0.42, 0.42]) part(g, BOX, basket, [0, 1.05, z], [0.7, 0.5, 0.25], null, 0);
    part(g, BOX, toon(pick(['#c8302c', '#2b4fa8', '#f2c230'])), [0, 1.48, 0], [0.8, 0.06, 0.75], null, 0);
    return g;
  };
  // ヤギ：小さな角とあごひげ
  const goatTpl = col => {
    const g = new THREE.Group(), fur = toon(col), dark = toon('#3a332e');
    part(g, SPH_LO, fur, [0, 0.65, 0], [0.45, 0.25, 0.2], null, 0); part(g, SPH_LO, fur, [0.45, 0.88, 0], [0.18, 0.13, 0.11], [0, 0, -0.4], 0);
    for (const z of [-0.05, 0.05]) part(g, CONE, dark, [0.4, 1.05, z], [0.03, 0.18, 0.03], [0, 0, 0.6], 0);
    part(g, CONE, dark, [0.55, 0.72, 0], [0.03, 0.12, 0.03], [Math.PI, 0, 0], 0);
    for (const [x, z] of [[0.28, 0.1], [0.28, -0.1], [-0.28, 0.1], [-0.28, -0.1]]) part(g, CYL, dark, [x, 0.22, z], [0.04, 0.45, 0.04], null, 0);
    return g;
  };
  // フラミンゴ：片脚立ちもいる細い脚、S字の首、先の黒いくちばし
  const flamingoTpl = (oneLeg = false) => {
    const g = new THREE.Group(), pink = toon('#ff8fa8'), deep = toon('#e86a8c'), blk = toon('#1a1a1a');
    part(g, SPH_LO, pink, [0, 1.55, 0], [0.45, 0.28, 0.24], null, 0); part(g, SPH_LO, deep, [-0.35, 1.6, 0], [0.22, 0.12, 0.2], null, 0);
    part(g, CYL, pink, [0.32, 1.85, 0], [0.05, 0.55, 0.05], [0, 0, -0.5], 0); part(g, CYL, pink, [0.42, 2.25, 0], [0.05, 0.45, 0.05], [0, 0, 0.35], 0);
    part(g, SPH_LO, pink, [0.38, 2.48, 0], [0.11, 0.1, 0.09], null, 0); part(g, CONE, blk, [0.52, 2.42, 0], [0.04, 0.16, 0.04], [0, 0, -2.2], 0);
    part(g, CYL, deep, [0, 0.66, 0.06], [0.025, 1.32, 0.025], null, 0);
    if (!oneLeg) part(g, CYL, deep, [0, 0.66, -0.06], [0.025, 1.32, 0.025], null, 0); else part(g, CYL, deep, [-0.05, 1.18, -0.06], [0.025, 0.5, 0.025], [0, 0, 1.2], 0);
    return g;
  };
  // フェネック：体より大きな耳と、ふさふさの尾
  const fennecTpl = () => {
    const g = new THREE.Group(), fur = toon('#ecc995'), pale = toon('#fbeedb'), dark = toon('#3a2a20');
    part(g, SPH_LO, fur, [0, 0.32, 0], [0.32, 0.18, 0.15], null, 0); part(g, SPH_LO, fur, [0.32, 0.48, 0], [0.13, 0.12, 0.12], null, 0);
    part(g, CONE, fur, [0.42, 0.47, 0], [0.04, 0.12, 0.04], [0, 0, -Math.PI / 2], 0); part(g, SPH_LO, dark, [0.48, 0.47, 0], [0.025, 0.025, 0.025], null, 0);
    for (const z of [-0.09, 0.09]) { part(g, CONE, fur, [0.28, 0.72, z * 1.4], [0.09, 0.32, 0.04], [z * 3, 0, 0], 0); part(g, CONE, pale, [0.29, 0.71, z * 1.4], [0.06, 0.24, 0.03], [z * 3, 0, 0], 0); }
    part(g, SPH_LO, fur, [-0.36, 0.3, 0], [0.22, 0.09, 0.09], [0, 0, 0.4], 0); part(g, SPH_LO, dark, [-0.55, 0.2, 0], [0.06, 0.05, 0.05], null, 0);
    for (const [x, z] of [[0.18, 0.07], [0.18, -0.07], [-0.18, 0.07], [-0.18, -0.07]]) part(g, CYL, fur, [x, 0.12, z], [0.03, 0.24, 0.03], null, 0);
    return g;
  };

  // 立っている人・座っている人。頭には布を巻く（ターバン・頭布）
  const people = [], heads = [], wraps = [];
  const robe = ['#f2ece0', '#2b3f8a', '#7a4a2a', '#c8302c', '#e0b25a', '#3d6a8a', '#5a3f6a', '#d8d0c0', '#1f2a4a', '#a8673e', '#2f7a5a'].map(C);
  const skin = ['#e9c4a4', '#c99a72', '#a8754f', '#8a5a3c'].map(C);
  const addPerson = (p, sit = false, col) => {
    people.push({ p: p.clone().add(new V3(0, sit ? 0.55 : 0.95, 0)), s: new V3(1.12, sit ? 0.62 : 1, 1.12), c: col ? C(col) : pick(robe) });
    heads.push({ p: p.clone().add(new V3(0, sit ? 1.3 : 1.95, 0)), s: new V3(0.26, 0.28, 0.26), c: pick(skin) });
    wraps.push({ p: p.clone().add(new V3(0, sit ? 1.44 : 2.09, 0)), s: new V3(0.31, 0.18, 0.31), c: pick(robe) });
  };
  // 動く人（群れとは別に、ひとりずつ）。トゥアレグの藍色の頭布など、布の色を選べる
  const figure = (g, x, y, z, col, sc = 1, wrap) => {
    part(g, new THREE.CapsuleGeometry(0.3 * sc, 0.75 * sc, 3, 8), toon(col), [x, y + 0.95 * sc, z], null, null, 0.03);
    part(g, SPH_LO, toon(pick(['#e9c4a4', '#c99a72', '#a8754f'])), [x, y + 1.95 * sc, z], [0.26 * sc, 0.28 * sc, 0.26 * sc], null, 0);
    part(g, SPH_LO, toon(wrap || pick(['#f2ece0', '#2b3f8a', '#c8302c', '#e0b25a'])), [x, y + 2.09 * sc, z], [0.31 * sc, 0.18 * sc, 0.31 * sc], null, 0);
  };

  // ナツメヤシ：少し傾いた幹の先に、弧を描いて垂れる葉と、橙色の実の房。木ごとに部品をまとめ、低画質では前半の木だけ描く
  const palms = [], leafCols = ['#4f8a3a', '#5c9a40', '#3f7a34', '#6a9a3e'].map(C);
  const addPalm = (p, sc = 1) => {
    const t = { trunk: null, leaves: [], dates: [] }, h = rand(7, 12) * sc, lean = rand(0, 0.16), la = rand(0, Math.PI * 2);
    const top = p.clone().add(new V3(Math.cos(la) * h * lean, h, Math.sin(la) * h * lean));
    t.trunk = { p: p.clone().lerp(top, 0.5), s: new V3(0.32 * sc, h, 0.32 * sc), r: [Math.sin(la) * lean, 0, -Math.cos(la) * lean] };
    for (let k = 0; k < 11; k++) {
      const yaw = k / 11 * Math.PI * 2 + rand(-0.2, 0.2), L1 = rand(1.6, 2.2) * sc, L2 = rand(1.8, 2.5) * sc, up = rand(0.15, 0.45), dn = -rand(0.5, 0.9);
      const dir = new V3(Math.cos(yaw), 0, -Math.sin(yaw)), c = pick(leafCols);
      const e1 = top.clone().addScaledVector(dir, L1 * Math.cos(up)).add(new V3(0, L1 * Math.sin(up), 0));
      t.leaves.push({ p: top.clone().lerp(e1, 0.5), s: new V3(L1, 0.08 * sc, 0.55 * sc), r: [0, yaw, up], c });
      t.leaves.push({ p: e1.clone().addScaledVector(dir, L2 / 2 * Math.cos(dn)).add(new V3(0, L2 / 2 * Math.sin(dn), 0)), s: new V3(L2, 0.08 * sc, 0.48 * sc), r: [0, yaw, dn], c });
    }
    for (let k = 0; k < 3; k++) { const a = rand(0, Math.PI * 2); t.dates.push({ p: top.clone().add(new V3(Math.cos(a) * 0.5 * sc, -0.6 * sc, Math.sin(a) * 0.5 * sc)), s: new V3(0.35, 0.5, 0.35).multiplyScalar(sc) }); }
    palms.push(t);
  };
  // モロッコのランタン：真鍮の笠をかぶった色ガラスの灯り（まとめて描き、ゴールで明るくする）
  const lanternCols = ['#ffb347', '#ff6a4a', '#7fe0a0', '#7fb8ff', '#ffd27a', '#ff8fd0'].map(c => C(c));
  const lanterns = [], lanternCaps = [];
  const lantern = (p, sc = 1, col) => {
    lanterns.push({ p: p.clone(), s: new V3(0.3 * sc, 0.45 * sc, 0.3 * sc), c: col || pick(lanternCols) });
    lanternCaps.push({ p: p.clone().add(new V3(0, 0.52 * sc, 0)), s: new V3(0.26 * sc, 0.3 * sc, 0.26 * sc) });
  };
  // 文字入りの板（屋台の看板）。同じ文字は1枚の材質を共有する
  const boardMats = new Map(), boardLists = new Map();
  const putBoard = (text, c, yaw, w) => {
    if (!boardMats.has(text)) {
      boardMats.set(text, toon('#ffffff', { map: ctex(512, 128, g => {
        g.fillStyle = '#2b3f7a'; g.fillRect(0, 0, 512, 128); g.strokeStyle = '#e8c06a'; g.lineWidth = 8; g.strokeRect(6, 6, 500, 116);
        g.fillStyle = '#fff3d6'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = '900 64px "Dela Gothic One", sans-serif'; g.fillText(text, 256, 68, 470);
      }) }));
      boardLists.set(text, []);
    }
    boardLists.get(text).push({ p: c.clone(), s: new V3(w, w / 4, 1), r: [0, yaw, 0] });
  };
  // 地面に沿う、テクスチャを貼れる帯（涸れ川・畑の水路）。u は幅方向、v は長さ方向（vScale mごとに1回）
  const ribbon = (pts, width, lift, mat, vScale, margin = W / 2 + 4) => {
    const positions = [], uvs = [], indices = []; let k = 0, prevOk = false, acc = 0;
    for (let i = 0; i < pts.length; i++) {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)], p = pts[i];
      if (i) acc += p.distanceTo(pts[i - 1]);
      const tx = b.x - a.x, tz = b.z - a.z, tl = Math.hypot(tx, tz) || 1, sx = -tz / tl * width / 2, sz = tx / tl * width / 2;
      const ok = roadDist(p.x, p.z, margin + 2) >= margin, l = new V3(p.x + sx, 0, p.z + sz), r = new V3(p.x - sx, 0, p.z - sz);
      positions.push(l.x, groundAt(l) + lift, l.z, r.x, groundAt(r) + lift, r.z); uvs.push(0, acc / vScale, 1, acc / vScale);
      if (ok && prevOk) indices.push(k - 2, k - 1, k, k - 1, k + 1, k);
      prevOk = ok; k += 2;
    }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(indices); geo.computeVertexNormals();
    const mesh = new THREE.Mesh(geo, mat); mesh.receiveShadow = true; world.add(mesh); return mesh;
  };
  // 走路から外へ V の道筋（涸れ川・キャラバンの道）。両端は ext 本（10mずつ）走路から遠ざかる向きへ伸ばして均す
  const outerPath = (s0, s1, V, ext = 40, step = 6) => {
    const pts = []; for (let s = s0; s <= s1; s += step) pts.push(local(s, 0, V));
    const head = pts[0], d0 = head.clone().sub(pts[1]).setY(0).normalize(), tail = pts[pts.length - 1], d1 = tail.clone().sub(pts[pts.length - 2]).setY(0).normalize();
    const f0 = tp(s0, W / 2).n.multiplyScalar(Math.sign(V)), f1 = tp(s1, W / 2).n.multiplyScalar(Math.sign(V));
    for (let k = 1; k <= ext; k++) pts.unshift(head.clone().addScaledVector(d0.clone().lerp(f0, Math.min(1, k / 20)).normalize(), k * 10));
    for (let k = 1; k <= ext; k++) pts.push(tail.clone().addScaledVector(d1.clone().lerp(f1, Math.min(1, k / 20)).normalize(), k * 10));
    for (let pass = 0; pass < 10; pass++) for (let i = 1; i < pts.length - 1; i++) pts[i] = pts[i - 1].clone().add(pts[i + 1]).multiplyScalar(0.5).lerp(pts[i], 0.5);
    return pts;
  };
  // カスバの塔をまとめて描く：上すぼまりの塔と、屋上の四隅の狭間
  const towerL = [], merlonL = [], houseL = [];
  const towerAt = (p, side, h, yaw) => {
    const r = side / 1.414;
    towerL.push({ p: p.clone().add(new V3(0, h / 2, 0)), s: new V3(r, h, r), r: [0, yaw, 0] });
    const top = side * 0.72 / 2 - 0.2;
    for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const [ox, oz] = rot(a * top, b * top, yaw); merlonL.push({ p: p.clone().add(new V3(ox, h + 0.45, oz)), s: new V3(0.32, 0.9, 0.32), r: [0, yaw, 0] }); }
  };
  // 平屋根の家：屋上の四隅に小さな狭間
  const houseAt = (p, w, h, d, yaw) => {
    houseL.push({ p: p.clone().add(new V3(0, h / 2, 0)), s: new V3(w, h, d), r: [0, yaw, 0] });
    for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const [ox, oz] = rot(a * (w / 2 - 0.3), b * (d / 2 - 0.3), yaw); merlonL.push({ p: p.clone().add(new V3(ox, h + 0.3, oz)), s: new V3(0.25, 0.6, 0.25), r: [0, yaw, 0] }); }
  };
  // 煙・火の粉の出どころ（毎フレーム少しずつ出す）
  const smokes = [], fires = [];

  /* ---- 座標の準備：内馬場の判定、区間の案内板とスタンドの敷地は空けておく ---- */
  const poly = []; for (let i = 0; i < track.N; i += 8) poly.push([track.xs[i], track.zs[i]]);
  const inPoly = (pl, x, z) => { let c = false; for (let i = 0, j = pl.length - 1; i < pl.length; j = i++) { const [xi, zi] = pl[i], [xj, zj] = pl[j]; if ((zi > z) !== (zj > z) && x < (xj - xi) * (z - zi) / (zj - zi) + xi) c = !c; } return c; };
  const inLoop = (x, z) => inPoly(poly, x, z);
  for (const z of track.zones) { const q = tp((z.start + z.end) / 2, W + 9).v; occupied.push({ x: q.x, z: q.z, r: 11 }); }
  for (let s = track.homeS0 - 10; s <= track.homeS1 + 10; s += 10) { const p = local(s, 0, W / 2 + 30); occupied.push({ x: p.x, z: p.z, r: 23 }); }
  occupied.push({ x: boardPos.x, z: boardPos.z, r: 24 });
  let cx0 = 0, cz0 = 0; for (let i = 0; i < track.N; i++) { cx0 += track.xs[i] / track.N; cz0 += track.zs[i] / track.N; }
  const center = new V3(cx0, 0, cz0);
  // 区間 s0〜s1、外向き v0〜v1 の範囲で、空いている地点を探す（見つからなければ null）
  const findSpot = (s0, s1, v0, v1, margin, r) => {
    for (let k = 0; k < 80; k++) { const s = rand(s0, s1), p = local(s, 0, rand(v0, v1)); if (clearAt(p.x, p.z, margin, r)) return { s, p: onGround(p) }; }
    return null;
  };

  /* ---- 内馬場の場所取り：いちばん広いところにダヤト・スルジの湖、次に広いところに夕陽の大砂時計 ---- */
  const spots = [];
  for (let k = 0; k < 900; k++) {
    const i = (Math.random() * track.N) | 0, p = new V3(track.xs[i], 0, track.zs[i]).lerp(center, rand(0.15, 1));
    if (!inLoop(p.x, p.z) || p.distanceTo(boardPos) < 50) continue;
    spots.push({ p, d: roadDist(p.x, p.z, 200) });
  }
  spots.sort((a, b) => b.d - a.d);
  const lakeSpot = spots[0] || { p: center.clone(), d: 80 };
  const lake = { c: onGround(lakeSpot.p.clone()), rx: clamp(lakeSpot.d - W / 2 - 34, 18, 58), rz: 0 };
  lake.rz = lake.rx * 0.68;
  const onLake = (x, z, m = 1) => ((x - lake.c.x) / (lake.rx * m)) ** 2 + ((z - lake.c.z) / (lake.rz * m)) ** 2 < 1;
  occupied.push({ x: lake.c.x, z: lake.c.z, r: lake.rx + 6 });
  const glassSpot = spots.find(o => o.p.distanceTo(lake.c) > lake.rx + 42 && o.d > W / 2 + 22) || { p: lake.c.clone().add(new V3(lake.rx + 50, 0, 0)) };
  const glassC = onGround(glassSpot.p.clone());
  occupied.push({ x: glassC.x, z: glassC.z, r: 16 });

  /* ---- 外ラチ沿い：ヤシの幹の杭に縄を渡し、ところどころにランタンの柱。手を振る観客（アイット・ベン・ハドゥ、キャンプ、スーク、グナワ） ---- */
  {
    const posts = [], ropes = [], poles = []; let prev = null;
    for (let s = 0; s < track.L; s += 6) {
      if (s > track.homeS0 - 4 && s < track.homeS1 + 4) { prev = null; continue; }   // ホーム直線はカスバのスタンド
      const p = onGround(local(s, 0, W / 2 + 3.4));
      if (taken(p.x, p.z, 1)) { prev = null; continue; }
      posts.push({ p: p.clone().add(new V3(0, 0.6, 0)), s: new V3(0.12, 1.2, 0.12) });
      if (prev) ropes.push(beam(prev.clone().add(new V3(0, 1.0, 0)), p.clone().add(new V3(0, 1.0, 0)), 0.06));
      prev = p;
      if (Math.round(s / 6) % 5 === 0) { const q = onGround(local(s + 3, 0, W / 2 + 4.6)); poles.push({ p: q.clone().add(new V3(0, 1.4, 0)), s: new V3(0.07, 2.8, 0.07) }); lantern(q.clone().add(new V3(0, 3.1, 0)), 1.2); }
    }
    addInst(CYL, toon('#7d5f40'), posts, false); addInst(BOX, toon('#c9a46a'), ropes, false); addInst(CYL, darkWood, poles, false);
    const crowdAt = (s0, s1, n) => {
      for (let k = 0; k < n; k++) {
        const p = onGround(local(rand(s0, s1), 0, W / 2 + rand(5.5, 10)));
        if (taken(p.x, p.z, 0.4)) continue;
        addPerson(p); occupied.push({ x: p.x, z: p.z, r: 0.6 });
      }
      for (let s = s0; s < s1; s += 9) { const p = local(s, 0, W / 2 + 7.5); occupied.push({ x: p.x, z: p.z, r: 4 }); }
    };
    crowdAt(at(1, 0.15), at(1, 0.4), 35); crowdAt(at(3, 0.2), at(3, 0.42), 30); crowdAt(at(7, 0.05), at(7, 0.3), 30); crowdAt(at(8, 0.1), at(8, 0.85), 55);
  }

  /* ---- 第1区間の外：オウニラ川の涸れ川（夕陽を映す細い流れ）と、対岸の丘に重なるアイット・ベン・ハドゥの集落（クサル） ---- */
  const riverPts = outerPath(at(1, 0.08), at(1, 0.94), W / 2 + 50, 50);
  {
    riverPts.forEach(p => { onGround(p); occupied.push({ x: p.x, z: p.z, r: 17 }); });
    const bedTex = ctex(256, 256, g => {
      g.fillStyle = '#ad8a60'; g.fillRect(0, 0, 256, 256);
      speck(g, 256, 256, 1400, ['#93764f', '#c9a878', '#7a6448', '#bf9c6c'], 2, 6, 0.8);
      g.strokeStyle = 'rgba(120,90,60,.25)'; g.lineWidth = 2; for (let i = 0; i < 10; i++) { g.beginPath(); let x = rand(0, 256), y = 0; g.moveTo(x, y); for (; y < 256; y += 16) g.lineTo(x += rand(-8, 8), y); g.stroke(); }
    }, true);
    ribbon(riverPts, 28, 0.04, toon('#ffffff', { map: bedTex, side: THREE.DoubleSide }), 28, W / 2 + 10);
    ribbon(riverPts, 6, 0.1, toon('#6fa8c8', { emissive: C('#ff9a5a'), emissiveIntensity: 0.3, side: THREE.DoubleSide }), 20, W / 2 + 14);
    // 川岸のナツメヤシ
    for (let i = 1; i < riverPts.length - 1; i += 2) {
      const p = riverPts[i], d = riverPts[i + 1].clone().sub(riverPts[i - 1]).setY(0).normalize();
      for (const sd of [-1, 1]) {
        const q = p.clone().add(new V3(-d.z * sd * rand(19, 26), 0, d.x * sd * rand(19, 26)));
        if (!clearAt(q.x, q.z, W / 2 + 12, 2.5) || inLoop(q.x, q.z) || Math.random() < 0.35) continue;
        onGround(q); addPalm(q, rand(0.9, 1.2)); occupied.push({ x: q.x, z: q.z, r: 2.4 });
      }
    }
    // 涸れ川に渡した歩道橋と、流れに置いた土のうの飛び石
    const s = at(1, 0.5), a = onGround(local(s, 0, W / 2 + 50 - 20)), b = onGround(local(s, 0, W / 2 + 50 + 20)), deck = beam(a.clone().add(new V3(0, 1.2, 0)), b.clone().add(new V3(0, 1.2, 0)), 0.4);
    addInst(BOX, toon('#d8c4a0'), [{ ...deck, s: new V3(deck.s.x, 0.4, 2.6) }], true);
    const rails2 = []; for (const sd of [-1.2, 1.2]) { const n = new V3(-(b.z - a.z), 0, b.x - a.x).normalize().multiplyScalar(sd); rails2.push(beam(a.clone().add(n).add(new V3(0, 2.1, 0)), b.clone().add(n).add(new V3(0, 2.1, 0)), 0.12)); }
    addInst(BOX, steel, rails2, false);
    const bags = []; for (let k = -2; k <= 2; k++) { const q = onGround(local(s + 8, 0, W / 2 + 50 + k * 1.4)); bags.push({ p: q.clone().add(new V3(0, 0.15, 0)), s: new V3(0.55, 0.3, 0.45), r: [0, rand(0, 3), 0] }); }
    addInst(SPH_LO, toon('#b89a6a'), bags, false);
  }
  {
    // アイット・ベン・ハドゥ：丘の斜面に土の家が重なり、カスバの塔が立ち、頂に穀物倉（アガディール）
    const s = at(1, 0.5), c = onGround(local(s, 0, W / 2 + 140)), rx = 46, ry = 24, y0 = c.y - 6;
    const hillY = p => { const a = (p.x - c.x) / rx, b = (p.z - c.z) / rx, q = 1 - a * a - b * b; return q > 0 ? y0 + ry * Math.sqrt(q) : -1e9; };
    part(world, SPH, toon('#a8774a'), [c.x, y0, c.z], [rx, ry, rx], null, 0);
    occupied.push({ x: c.x, z: c.z, r: rx + 4 });
    for (let ring = 0; ring < 7; ring++) {
      const f = 0.92 - ring * 0.13, n = Math.round(44 * f);
      for (let k = 0; k < n; k++) {
        const a = k / n * Math.PI * 2 + ring * 0.4 + rand(-0.05, 0.05), p = new V3(c.x + Math.cos(a) * rx * f, 0, c.z + Math.sin(a) * rx * f); p.y = hillY(p) - 1.2;
        if (Math.random() < 0.18 && ring > 0) towerAt(p, rand(3.4, 4.2), rand(10, 14), -a);
        else houseAt(p, rand(5, 8), rand(4, 6.5) + ring * 0.3, rand(5, 8), -a + rand(-0.2, 0.2));
      }
    }
    // 麓をめぐる城壁と見張りの塔（走路の側の半分）
    const toT = local(s, 0, 0).sub(c).setY(0).normalize(), a0 = Math.atan2(toT.z, toT.x);
    for (let k = -9; k <= 9; k++) {
      const a = a0 + k * 0.14, p = new V3(c.x + Math.cos(a) * (rx + 1), 0, c.z + Math.sin(a) * (rx + 1)); p.y = groundAt(p) - 0.5;
      if (k % 4 === 0) towerAt(p, 4.4, 11, -a); else houseAt(p, 7.6, 4.2, 1.4, -a + Math.PI / 2);
    }
    const top = new V3(c.x, y0 + ry - 1, c.z), g = registerLandmark(fantasyGroup(top), 'アイット・ベン・ハドゥの集落（クサル）');
    g.rotation.y = -a0 + Math.PI / 2;
    addBox(g, [16, 8, 12], [0, 4, 0], houseM, null, 0.02); addBox(g, [16.4, 0.6, 12.4], [0, 8.1, 0], piseDark);
    g.updateMatrixWorld(true);
    for (const [x, z] of [[-8, -6], [8, -6], [-8, 6], [8, 6]]) towerAt(g.localToWorld(new V3(x, 0, z)), 3.6, 13, g.rotation.y);
    for (let k = 0; k < 14; k++) addBox(g, [0.8, 0.5, 0.2], [rand(-6, 6), rand(2, 6), -6.05], warm);
    signAt(g, 'アイット・ベン・ハドゥ（世界遺産）', 22, 20);
    // 夕暮れの窓明かり
    const lit = []; for (const h of houseL.slice(-140)) if (Math.random() < 0.3) { const ax = Math.atan2(h.p.z - c.z, h.p.x - c.x); lit.push({ p: h.p.clone().add(new V3(Math.cos(ax) * h.s.x * 0.5, 0, Math.sin(ax) * h.s.x * 0.5)), s: new V3(0.5, 0.7, 0.5) }); }
    addInst(BOX, warm, lit, false);
  }
  {
    // 映画の撮影隊：多くの映画の舞台になった集落を、川のこちらから撮る
    const spot = findSpot(at(1, 0.15), at(1, 0.55), W / 2 + 18, W / 2 + 30, W / 2 + 16, 5);
    if (spot) {
      const { s, p } = spot;
      const g = registerLandmark(fantasyGroup(p), '映画の撮影隊'); g.rotation.y = yawAt(s);   // カメラ（局所 +z）を集落へ向ける
      const blk = toon('#24242a');
      addBox(g, [0.9, 0.7, 0.6], [0, 2.0, 0], blk); part(g, CYL, blk, [0, 2.0, 0.55], [0.2, 0.5, 0.2], [Math.PI / 2, 0, 0], 0);
      for (let k = 0; k < 3; k++) { const a = k / 3 * Math.PI * 2; addBox(g, [0.06, 1.9, 0.06], [Math.cos(a) * 0.45, 0.85, Math.sin(a) * 0.45], blk, [Math.sin(a) * 0.25, 0, -Math.cos(a) * 0.25]); }
      // 監督の椅子と、レフ板、ブームマイク、カチンコ
      addBox(g, [0.7, 0.08, 0.6], [-2.4, 0.9, -1], toon('#2b3f7a')); addBox(g, [0.7, 0.6, 0.06], [-2.4, 1.3, -1.3], toon('#2b3f7a')); for (const [x, z] of [[-2.7, -0.75], [-2.1, -0.75], [-2.7, -1.25], [-2.1, -1.25]]) addBox(g, [0.06, 0.9, 0.06], [x, 0.45, z], wood);
      part(g, new THREE.CircleGeometry(1, 20), toon('#f2f2f2', { side: THREE.DoubleSide, emissive: C('#ffffff'), emissiveIntensity: 0.3 }), [2.6, 1.6, -0.6], [1.1, 1.1, 1], [0, 0.6, 0], 0);
      addBox(g, [0.05, 0.05, 3.6], [1.0, 3.2, 0.8], steel, [0.4, 0, 0]); part(g, SPH_LO, toon('#5a5a60'), [1.0, 3.9, 2.4], [0.18, 0.18, 0.4], null, 0);
      addBox(g, [0.5, 0.4, 0.05], [-1.2, 1.5, 0.9], toon('#1a1a1a'));
      figure(g, -2.4, 0.3, -1, '#d8d0c0', 0.9); figure(g, -0.6, 0, -0.4, '#1f2a4a'); figure(g, 1.6, 0, -0.2, '#7a4a2a'); figure(g, -1.2, 0, 1.4, '#c8302c');
      signAt(g, '映画の撮影隊', 6.5, 9);
      occupied.push({ x: p.x, z: p.z, r: 5 });
    }
  }

  /* ---- 第2区間：大砂丘の上り。斜面にヤシの葉の砂よけの柵、ラクダのキャラバン、輪を描く砂丘のバギー ---- */
  {
    const sticks = [];
    for (let k = 0; k < 9; k++) {
      const s = at(2, 0.08 + k * 0.1), v = W / 2 + rand(16, 46), yaw = yawAt(s) + rand(-0.3, 0.3);
      const c0 = local(s, 0, v); if (!clearAt(c0.x, c0.z, W / 2 + 12, 10)) continue;
      for (let u = -9; u <= 9; u += 0.32) {
        const [ox, oz] = rot(u, 0, yaw), p = onGround(new V3(c0.x + ox, 0, c0.z + oz)), h = rand(0.7, 1.3);
        sticks.push({ p: p.clone().add(new V3(0, h / 2 - 0.1, 0)), s: new V3(0.1, h, 0.06), r: [0, yaw, rand(-0.12, 0.12)], c: C(pick(['#8a6a40', '#a8844e', '#6f5434'])) });
      }
      occupied.push({ x: c0.x, z: c0.z, r: 10 });
    }
    addInst(BOX, toon('#ffffff'), sticks, false);
    if (sticks.length) registerLandmark(fantasyGroup(sticks[(sticks.length / 2) | 0].p.clone()), '砂よけの柵（ヤシの葉）');
  }
  // キャラバン：先導する藍色の頭布の男と、荷を載せて綱でつながったラクダの列が行き来する
  const caravan = (pts, n, name, speed = 1.2) => {
    const r = route(pts, false), walkers = [];
    const lead = fantasyGroup(); lead.userData.droneIgnore = true; figure(lead, 0, 0, 0, '#2b3f8a', 1, '#1f2a6a'); walkers.push({ g: lead, off: 0, legs: [] });
    for (let i = 0; i < n; i++) {
      const g = fantasyGroup(); g.userData.droneIgnore = true; const legs = [];
      g.add(camelTpl(legs, pick(['#c8302c', '#2b4fa8', '#e0b25a', '#2f7a5a', '#6a2b5e'])));
      if (i % 2 === 0) for (const z of [-0.75, 0.75]) part(g, BOX, toon(pick(['#d8c4a0', '#8a6244', '#e8dcc0'])), [-0.1, 2.6, z], [0.7, 0.6, 0.35], null, 0);
      addBox(g, [2.2, 0.03, 0.03], [1.9, 2.4, 0], darkWood, [0, 0, -0.5]);
      walkers.push({ g, off: 2.6 + i * 4.3, legs });
    }
    updates.push(t => {
      const m = reduced.matches ? 0 : t, M = n * 4.3 + 6, span = Math.max(10, r.L - M * 2);
      for (const w of walkers) {
        const k = mod(m * speed + 30, span * 2), back = k > span, u = (back ? span * 2 - k : k) + M + (back ? w.off : -w.off), { p, yaw } = r.at(u);
        w.g.position.set(p.x, p.y, p.z); w.g.rotation.y = yaw + (back ? Math.PI : 0);
        w.legs.forEach((l, i) => { l.rotation.z = Math.sin(m * 4.2 + (i % 2 ? Math.PI : 0) + (i > 1 ? Math.PI : 0)) * 0.3; });
      }
    });
    registerLandmark(fantasyGroup(pts[(pts.length / 2) | 0].clone()), name);
  };
  {
    const pts = outerPath(at(2, 0.02), at(3, 0.3), W / 2 + 26, 10, 6).map(p => onGround(p));
    pts.forEach(p => occupied.push({ x: p.x, z: p.z, r: 3 }));
    caravan(pts, 6, 'ラクダのキャラバン');
  }
  {
    // 砂丘のバギー：砂の上で大きな輪を描き、後ろに砂けむり
    const buggies = [];
    for (let i = 0; i < 3; i++) {
      const cc = onGround(local(at(2, 0.25 + i * 0.25), 0, W / 2 + 92 + i * 14)), rr = rand(16, 24);
      if (taken(cc.x, cc.z, rr) || roadDist(cc.x, cc.z, 80) < W / 2 + rr + 14) continue;
      occupied.push({ x: cc.x, z: cc.z, r: rr + 4 });
      const g = fantasyGroup(); g.userData.droneIgnore = true;
      addBox(g, [1.9, 0.6, 1.1], [0, 0.75, 0], toon(['#f2c230', '#d8343a', '#2f8fe0'][i]), null, 0.02); addBox(g, [0.7, 0.3, 0.9], [-0.4, 1.2, 0], toon('#24242a'));
      for (const [x, z] of [[0.7, 0.62], [0.7, -0.62], [-0.7, 0.62], [-0.7, -0.62]]) part(g, CYL, toon('#222428'), [x, 0.42, z], [0.42, 0.35, 0.42], [Math.PI / 2, 0, 0], 0);
      addBox(g, [0.08, 0.5, 1.0], [0.7, 1.25, 0], steel); figure(g, -0.3, 0.75, 0, pick(['#f2ece0', '#c8302c', '#1f2a4a']), 0.8);
      buggies.push({ g, c: cc, r: rr, ph: rand(0, 6), v: rand(0.35, 0.5) * (i % 2 ? 1 : -1) });
    }
    const spray = C('#e9b47a');
    updates.push((t, dt) => {
      const m = reduced.matches ? 0 : t;
      for (const b of buggies) {
        const a = m * b.v + b.ph, x = b.c.x + Math.cos(a) * b.r, z = b.c.z + Math.sin(a) * b.r * 0.7, p = new V3(x, 0, z);
        b.g.position.set(x, groundAt(p) + 0.05, z);
        const dx = -Math.sin(a) * b.v, dz = Math.cos(a) * 0.7 * b.v; b.g.rotation.y = -Math.atan2(dz, dx);
        if (!reduced.matches && Math.random() < dt * 18) dustP.emit(x - dx * 4, b.g.position.y + 0.4, z - dz * 4, rand(-0.5, 0.5), rand(0.4, 1.2), rand(-0.5, 0.5), 1.4, rand(0.8, 1.4), spray, 0.3, 1.2);
      }
    });
    if (buggies.length) registerLandmark(fantasyGroup(buggies[0].c.clone()), '砂丘のバギー');
  }

  /* ---- 第3区間：砂丘のてっぺん。ベルベルの砂漠キャンプ（ハイマの天幕、絨毯、ミントティー、焚き火と太鼓、座ったラクダ、四駆） ---- */
  {
    const s = at(3, 0.45), g = site('ベルベルの砂漠キャンプ（シェビ砂丘）', s, W / 2 + 30, 48, 32, '#e0a866', W / 2 + 22);
    g.updateMatrixWorld(true);
    const Wp = (x, z) => g.localToWorld(new V3(x, 0, z));
    // ハイマ：ヤギやラクダの毛で織った黒褐色の天幕。前に絨毯を敷く
    const tent = (x, z, w, d, h, yaw) => {
      const t = new THREE.Group(); t.position.set(x, 0, z); t.rotation.y = yaw; g.add(t);
      part(t, PRISM, toon(pick(['#3e2c22', '#4a3529', '#5a4030'])), [0, 0, 0], [w, h, d], null, 0.02);
      addBox(t, [w + 0.1, 0.25, d * 0.6], [0, h * 0.42, 0], toon(pick(['#c8302c', '#e0b25a', '#f2ece0'])));
      addBox(t, [w * 0.8, 0.05, 2.6], [0, 0.03, -d / 2 - 1.3], pick(carpetMats));
      for (const sx of [-w / 2 + 0.3, 0, w / 2 - 0.3]) addBox(t, [0.12, h + 0.3, 0.12], [sx, (h + 0.3) / 2, 0], wood);
    };
    tent(-15, 4, 7, 5, 2.8, 0.15); tent(-5, 9, 8, 5.5, 3, 0); tent(6, 9, 7, 5, 2.8, -0.1); tent(16, 3, 7, 5, 2.8, -0.3); tent(-19, -7, 6, 4.5, 2.6, 0.9);
    // 中庭：絨毯を敷き、低い丸卓に真鍮のティーポット（ミントティー）
    for (const [x, z, i] of [[-6, -2, 0], [2, -1, 1], [9, -4, 2], [-1, -8, 3]]) {
      part(g, new THREE.PlaneGeometry(4.2, 6), carpetMats[i], [x, 0.04, z], null, [-Math.PI / 2, 0, 0.3 * i], 0);
      part(g, CYL, wood, [x, 0.25, z], [0.7, 0.5, 0.7], null, 0); part(g, SPH_LO, brass, [x, 0.66, z], [0.18, 0.16, 0.18], null, 0);
      part(g, CONE, brass, [x, 0.86, z], [0.1, 0.2, 0.1], null, 0); part(g, CYL, brass, [x + 0.22, 0.7, z], [0.03, 0.25, 0.03], [0, 0, -0.9], 0);
      for (let k = 0; k < 4; k++) { const a = k / 4 * Math.PI * 2 + 0.4; addPerson(Wp(x + Math.cos(a) * 1.6, z + Math.sin(a) * 1.6), true); }
    }
    // 焚き火を囲む太鼓の輪
    const fireP0 = Wp(4, -11); fires.push(fireP0.clone().setY(g.position.y + 0.6));
    part(g, new THREE.ConeGeometry(0.6, 1.4, 8), warm, [4, 0.7, -11], null, null, 0);
    for (let k = 0; k < 4; k++) addBox(g, [1.6, 0.2, 0.2], [4, 0.15, -11], darkWood, [0, k * 0.8, 0]);
    smokes.push(fireP0.clone().setY(g.position.y + 2));
    for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2; addPerson(Wp(4 + Math.cos(a) * 2.8, -11 + Math.sin(a) * 2.8), true); if (k % 2 === 0) part(g, CYL, toon('#8a6244'), [4 + Math.cos(a) * 2.1, 0.45, -11 + Math.sin(a) * 2.1], [0.35, 0.5, 0.35], null, 0); }
    // 座ったラクダと四駆
    stamp(camelTpl([], '#c8302c', true), [[-20, 10], [-17, 13], [20, 11], [22, 7]].map(([x, z]) => ({ p: Wp(x, z).setY(g.position.y), yaw: g.rotation.y + rand(-1, 1) })));
    for (const [x, z, col] of [[-12, 14, '#e8dcc0'], [12, 15, '#f2f2f2']]) {
      const j = new THREE.Group(); j.position.set(x, 0, z); j.rotation.y = 0.3; g.add(j);
      addBox(j, [4.4, 1.3, 2], [0, 1.2, 0], toon(col), null, 0.02); addBox(j, [2.6, 0.9, 1.9], [-0.5, 2.3, 0], toon(col)); addBox(j, [2.5, 0.75, 1.95], [-0.5, 2.3, 0], toon('#6a8aa0'));
      addBox(j, [2.4, 0.15, 1.8], [-0.5, 2.85, 0], toon('#2a2a2a')); addBox(j, [1.2, 0.5, 1.4], [-0.7, 3.15, 0], toon('#8a6244'));
      for (const [wx, wz] of [[1.4, 1], [1.4, -1], [-1.4, 1], [-1.4, -1]]) part(j, CYL, toon('#222428'), [wx, 0.5, wz], [0.5, 0.35, 0.5], [Math.PI / 2, 0, 0], 0);
    }
    for (const [x, z] of [[-23, -12], [-23, 14], [23, -12], [23, 15], [0, 14]]) { addBox(g, [0.1, 2.6, 0.1], [x, 1.3, z], darkWood); lantern(Wp(x, z).setY(g.position.y + 2.9)); }
    signAt(g, 'ベルベルの砂漠キャンプ', 9, 15);
  }

  /* ---- 砂丘：蛇行する稜線の風上はなだらかに、風下の滑り面は急に落ちる。シェビ砂丘の大砂丘は滑り面を走路へ向ける ---- */
  // 型（長さ・幅・高さ 1）：局所 +z が風下
  const crestZ = x => 0.2 + 0.035 * Math.sin(x * 9 + 1);
  const duneH = (x, z) => {
    const a = 1 - (2 * x) ** 2; if (a <= 0 || z <= -0.5 || z >= 0.5) return 0;
    const hc = Math.pow(a, 0.55), zc = crestZ(x);
    if (z < zc) { const u = (zc - z) / (zc + 0.5); return hc * Math.pow(1 - Math.pow(u, 1.4), 1.3); }
    return hc * (1 - (z - zc) / (0.5 - zc));
  };
  // 頂点の色：風上は明るい橙、稜線は夕陽に光り、風下の滑り面は影で濃い
  const duneGeo = (nx, nz) => {
    const g = new THREE.PlaneGeometry(1, 1, nx, nz); g.rotateX(-Math.PI / 2);
    const p = g.attributes.position, col = [], lee = C('#bd7446'), wind = C('#e2a462'), crest = C('#f4c784'), c = new THREE.Color();
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), z = p.getZ(i), zc = crestZ(x);
      p.setY(i, duneH(x, z));
      if (z > zc + 0.005) c.copy(lee).lerp(wind, 0.12); else c.copy(wind).lerp(crest, Math.max(0, 1 - (zc - z) / 0.12) * 0.7);
      col.push(c.r, c.g, c.b);
    }
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.computeVertexNormals(); return g;
  };
  const duneMat = toon('#ffffff', { vertexColors: true });
  const duneList = [];
  const duneFoot = (c, yaw, len, wid) => [[-0.4, -0.4], [0.4, -0.4], [-0.4, 0.4], [0.4, 0.4], [0, 0], [0, -0.45], [0, 0.45], [-0.45, 0], [0.45, 0], [-0.25, 0.3], [0.25, 0.3]]
    .map(([a, b]) => { const [ox, oz] = rot(a * len, b * wid, yaw); return new V3(c.x + ox, 0, c.z + oz); });
  // 砂丘の表面の高さ（どの砂丘にも載っていなければ -1e9）
  const duneTop = (x, z) => {
    let best = -1e9;
    for (const d of duneList) {
      const dx = x - d.c.x, dz = z - d.c.z; if (Math.abs(dx) > d.R || Math.abs(dz) > d.R) continue;
      const h = duneH((dx * Math.cos(d.yaw) - dz * Math.sin(d.yaw)) / d.len, (dx * Math.sin(d.yaw) + dz * Math.cos(d.yaw)) / d.wid);
      if (h > 0) best = Math.max(best, d.c.y + h * d.H);
    }
    return best;
  };
  const onSand = (x, z) => duneTop(x, z) > groundAt({ x, z }) + 0.3;
  const windYaw = Math.atan2(-th.sun[0], -th.sun[2]);   // 風下の滑り面は、どの砂丘もおおむね夕陽と反対を向く
  let erg = null;
  {
    // シェビ砂丘の大砂丘：キャンプの向こうに、滑り面を走路へ向けて
    const s = at(3, 0.8), len = 320, wid = 150, H = 46;
    for (let v = W / 2 + 95; v < W / 2 + 420 && !erg; v += 8) {
      const c = local(s, 0, v), d = local(s, 0, 0).sub(c).setY(0).normalize(), yaw = Math.atan2(d.x, d.z), foot = duneFoot(c, yaw, len, wid);
      if (foot.some(p => roadDist(p.x, p.z, W / 2 + 40) < W / 2 + 38 || taken(p.x, p.z, 0) || inLoop(p.x, p.z))) continue;
      c.y = Math.min(...foot.map(groundAt)) - 1;
      erg = { c, yaw, len, wid, H, R: Math.max(len, wid) / 2 };
    }
  }
  const ergAt = (lx, lz) => { const [ox, oz] = rot(lx * erg.len, lz * erg.wid, erg.yaw); return new V3(erg.c.x + ox, erg.c.y + duneH(lx, lz) * erg.H, erg.c.z + oz); };
  if (erg) {
    const m = new THREE.Mesh(duneGeo(96, 120), duneMat); m.position.copy(erg.c); m.rotation.y = erg.yaw; m.scale.set(erg.len, erg.H, erg.wid); m.receiveShadow = true; m.castShadow = true; world.add(m);
    duneList.push(erg); occupied.push({ x: erg.c.x, z: erg.c.z, r: erg.wid * 0.5 });
    const top = registerLandmark(fantasyGroup(ergAt(0, crestZ(0))), 'シェビ砂丘の大砂丘（メルズーガ）'); signAt(top, 'シェビ砂丘の大砂丘', 12, 15);
    // 稜線を行くキャラバン（夕陽に影絵になる）
    const crest = []; for (let lx = -0.36; lx <= 0.36; lx += 0.015) crest.push(ergAt(lx, crestZ(lx)).add(new V3(0, -0.15, 0)));
    caravan(crest, 5, '大砂丘の稜線を行くキャラバン', 1.0);
    // サンドボード：稜線から滑り面を滑り降り、板をかついで登り返す
    const boarders = [], spray = C('#f0b26c');
    for (let i = 0; i < 5; i++) {
      const lx = -0.22 + i * 0.11 + rand(-0.02, 0.02), g = fantasyGroup(); g.userData.droneIgnore = true;
      figure(g, 0, 0.12, 0, pick(['#c8302c', '#2f8fe0', '#f2c230', '#2f7a5a', '#f2ece0']));
      const bm = toon(pick(['#ff6a4a', '#2f8fe0', '#f2c230', '#46c08a'])), board = addBox(g, [1.5, 0.08, 0.42], [0, 0.07, 0], bm), carried = addBox(g, [0.42, 1.5, 0.08], [-0.15, 1.3, 0.42], bm);
      boarders.push({ g, board, carried, lx, z0: crestZ(lx) + 0.012, z1: 0.44, ph: rand(0, 1) });
    }
    updates.push((t, dt) => {
      const m = reduced.matches ? 0 : t;
      for (const b of boarders) {
        const k = mod(m / 28 + b.ph, 1), slide = k < 0.22, u = slide ? (k / 0.22) ** 1.6 : 1 - (k - 0.22) / 0.78;
        const p = ergAt(b.lx, lerp(b.z0, b.z1, u)); b.g.position.copy(p);
        b.g.rotation.y = erg.yaw - Math.PI / 2 + (slide ? 0 : Math.PI); b.g.rotation.z = slide ? -0.25 : 0;
        b.board.visible = slide; b.carried.visible = !slide;
        if (slide && !reduced.matches && Math.random() < dt * 14) dustP.emit(p.x, p.y + 0.2, p.z, rand(-0.6, 0.6), rand(0.4, 1.2), rand(-0.6, 0.6), 1.2, rand(0.5, 0.9), spray, 0.3, 1.2);
      }
    });
    registerLandmark(fantasyGroup(ergAt(0, 0.35)), 'サンドボード');
  }

  /* ---- 第4〜5区間の外：砂丘の陰からのぞくフェネック ---- */
  {
    const fen = [];
    for (let k = 0; k < 14 && fen.length < 7; k++) {
      const p = onGround(local(rand(at(4, 0.1), at(5, 0.3)), 0, W / 2 + rand(12, 34)));
      if (!clearAt(p.x, p.z, W / 2 + 10, 1.5)) continue;
      fen.push({ p, yaw: rand(0, Math.PI * 2), sc: rand(1.1, 1.4) }); occupied.push({ x: p.x, z: p.z, r: 1.5 });
    }
    stamp(fennecTpl(), fen);
    if (fen.length) registerLandmark(fantasyGroup(fen[0].p.clone()), 'フェネック');
  }

  /* ---- 第5区間：オアシスのヤシ林。「トンブクトゥまで52日」の道しるべ、畑と水路、地下水路ハッターラ、井戸、アルガンの木に登るヤギ ---- */
  {
    // ザゴラの道しるべ：ラクダのキャラバンの絵と「TOMBOUCTOU 52 JOURS」
    const g = site('「トンブクトゥまで52日」の道しるべ（ザゴラ）', at(5, 0.15), W / 2 + 20, 12, 5, '#d9a066', W / 2 + 13);
    addBox(g, [11, 6.5, 1.2], [0, 3.25, 0.4], pise, null, 0.02); addBox(g, [11.4, 0.5, 1.5], [0, 6.7, 0.4], piseDark);
    for (let x = -5; x <= 5; x += 2) part(g, roof4, piseDark, [x, 7.3, 0.4], [0.35, 0.8, 0.35], null, 0);
    const tex = ctex(512, 300, c => {
      c.fillStyle = '#ecd2a0'; c.fillRect(0, 0, 512, 300); c.strokeStyle = '#6a3a1e'; c.lineWidth = 10; c.strokeRect(8, 8, 496, 284);
      c.fillStyle = '#6a3a1e'; c.textAlign = 'center'; c.font = '900 66px sans-serif'; c.fillText('TOMBOUCTOU', 256, 82, 470);
      c.font = '900 50px sans-serif'; c.fillText('52 JOURS', 330, 158, 300);
      // ラクダと乗り手の影絵
      c.beginPath(); c.ellipse(120, 170, 46, 20, 0, 0, Math.PI * 2); c.fill(); c.beginPath(); c.ellipse(112, 150, 22, 18, 0, 0, Math.PI * 2); c.fill();
      c.lineWidth = 9; c.strokeStyle = '#6a3a1e'; c.beginPath(); c.moveTo(160, 165); c.lineTo(182, 128); c.lineTo(198, 130); c.stroke();
      for (const x of [88, 100, 140, 152]) { c.beginPath(); c.moveTo(x, 180); c.lineTo(x + (x % 3) - 1, 228); c.stroke(); }
      c.beginPath(); c.ellipse(112, 118, 9, 16, 0, 0, Math.PI * 2); c.fill();
      c.font = 'bold 32px sans-serif'; c.fillText('トンブクトゥまで ラクダで52日', 256, 272, 470);
    });
    const bd = new THREE.Mesh(new THREE.PlaneGeometry(9.6, 5.6), new THREE.MeshBasicMaterial({ map: tex })); bd.position.set(0, 3.3, -0.22); bd.rotation.y = Math.PI; g.add(bd);
    g.updateMatrixWorld(true); for (let k = 0; k < 6; k++) addPerson(g.localToWorld(new V3(rand(-5, 5), 0, rand(-4.5, -2.5))));
  }
  {
    // 畑：ヤシの木陰に小さな区画。小麦・アルファルファ・ミントを、細い水路でつなぐ
    const plots = [], ditches = [];
    for (let k = 0, n = 0; k < 120 && n < 22; k++) {
      const s = rand(at(4, 0.85), at(6, 0.05)), v = (Math.random() < 0.7 ? 1 : -1) * (W / 2 + rand(16, 80)), p = local(s, 0, v);
      if (!clearAt(p.x, p.z, W / 2 + 12, 5) || onLake(p.x, p.z, 1.4) || (v > 0 && inLoop(p.x, p.z))) continue;
      onGround(p); const yaw = yawAt(s) + rand(-0.15, 0.15);
      plots.push({ p: p.clone().add(new V3(0, 0.25, 0)), s: new V3(8, 0.5, 5.5), r: [0, yaw, 0], c: C(pick(['#6aa84f', '#c9b04a', '#3f9a5a', '#8ab84a'])) });
      const [ox, oz] = rot(0, 3.3, yaw); ditches.push({ p: new V3(p.x + ox, p.y + 0.06, p.z + oz), s: new V3(8, 0.08, 0.6), r: [0, yaw, 0] });
      occupied.push({ x: p.x, z: p.z, r: 5 }); n++;
    }
    addInst(BOX, toon('#ffffff'), shuffle(plots)); addInst(BOX, toon('#5f9ac0', { emissive: C('#ff9a5a'), emissiveIntensity: 0.25 }), ditches, false);
    if (plots.length) registerLandmark(fantasyGroup(plots[0].p.clone()), 'オアシスの畑');
    // ハッターラ：地下水路の縦穴が、砂漠から畑へ点々と続く
    const holes = [], mounds = [];
    for (let k = 0; k < 16; k++) {
      const p = onGround(local(at(5, 0.55), 0, W / 2 + 90 + k * 13));
      if (taken(p.x, p.z, 2.5)) continue;
      mounds.push({ p: p.clone().add(new V3(0, 0.2, 0)), s: new V3(1, 1, 1), r: [Math.PI / 2, 0, 0] }); holes.push({ p: p.clone().add(new V3(0, 0.45, 0)), s: new V3(0.6, 1, 0.6) });
      occupied.push({ x: p.x, z: p.z, r: 3 });
    }
    addInst(new THREE.TorusGeometry(1.4, 0.75, 8, 16), toon('#b9874f'), mounds, false); addInst(new THREE.CircleGeometry(1, 12).rotateX(-Math.PI / 2), toon('#2a1a12'), holes, false);
    if (mounds.length) registerLandmark(fantasyGroup(mounds[(mounds.length / 2) | 0].p.clone()), '地下水路ハッターラの縦穴');
    // 井戸：石積みの井筒と、滑車をかけた木の枠
    const wp = onGround(local(at(5, 0.4), 0, W / 2 + 30));
    if (clearAt(wp.x, wp.z, W / 2 + 18, 4)) {
      const g = registerLandmark(fantasyGroup(wp), 'オアシスの井戸');
      part(g, new THREE.CylinderGeometry(1.4, 1.5, 1.1, 14), toon('#a99a86'), [0, 0.55, 0], null, null, 0.04);
      for (const x of [-1.2, 1.2]) addBox(g, [0.2, 2.8, 0.2], [x, 1.4, 0], wood); addBox(g, [2.8, 0.2, 0.2], [0, 2.8, 0], wood);
      part(g, CYL, darkWood, [0, 2.6, 0], [0.3, 0.2, 0.3], [Math.PI / 2, 0, 0], 0); addBox(g, [0.03, 1.6, 0.03], [0, 1.8, 0], toon('#c9a46a')); part(g, CYL, wood, [0, 0.95, 0], [0.25, 0.4, 0.25], null, 0);
      figure(g, 1.8, 0, 0.6, '#2b3f8a'); stamp(donkeyTpl(), [{ p: wp.clone().add(new V3(-2.6, 0, 1)), yaw: 0.6 }]);
      occupied.push({ x: wp.x, z: wp.z, r: 4 });
    }
    // アルガンの木：低く枝を広げた木の上に、ヤギが登って実を食べる
    const ap = onGround(local(at(5, 0.72), 0, W / 2 + 34));
    if (clearAt(ap.x, ap.z, W / 2 + 18, 7)) {
      const g = registerLandmark(fantasyGroup(ap), 'アルガンの木に登るヤギ'), bark = toon('#5e4a36');
      part(g, CYL_T, bark, [0, 1.2, 0], [0.5, 2.4, 0.5], [0.1, 0, 0.1], 0.03);
      for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2; part(g, CYL_T, bark, [Math.cos(a) * 1.3, 2.6, Math.sin(a) * 1.3], [0.22, 2.4, 0.22], [Math.sin(a) * 0.9, 0, -Math.cos(a) * 0.9], 0); }
      for (let k = 0; k < 7; k++) { const a = k / 7 * Math.PI * 2; part(g, SPH_LO, toon(pick(['#4f7a3a', '#5a8a42', '#46703a'])), [Math.cos(a) * 2.6, 3.4 + rand(-0.3, 0.4), Math.sin(a) * 2.6], [2.2, 0.9, 2.2], null, 0.03); }
      part(g, SPH_LO, toon('#4f7a3a'), [0, 3.9, 0], [2.6, 1.1, 2.6], null, 0.03);
      const goats = [[0, 4.9, 0], [2.4, 4.2, 1], [-2.3, 4.25, -0.8], [1, 4.3, -2.6], [-1.2, 4.4, 2.4]].map(([x, y, z]) => ({ p: ap.clone().add(new V3(x, y, z)), yaw: rand(0, Math.PI * 2) }));
      const cols = ['#f2ece0', '#3a332e', '#8a6244'];
      cols.forEach((c, i) => stamp(goatTpl(c), goats.filter((_, k) => k % 3 === i)));
      stamp(goatTpl('#d8d0c0'), [{ p: ap.clone().add(new V3(3.6, 0, -1)), yaw: 2 }, { p: ap.clone().add(new V3(-3.4, 0, 1.8)), yaw: 4 }]);
      figure(g, 4.2, 0, 2.2, '#7a4a2a');
      occupied.push({ x: ap.x, z: ap.z, r: 6 });
    }
  }

  /* ---- 第6区間：カスバの路地（S字）。入口で走路をまたぐカスバの門、両側の土の壁、タウリルトのカスバ ---- */
  {
    const s = at(6, 0.1), f = tp(s, W / 2), gate = registerLandmark(fantasyGroup(f.v.clone()), 'カスバの門'), R = W / 2 + 5;
    gate.rotation.y = -f.h;
    gate.updateMatrixWorld(true);
    for (const z of [-R, R]) {
      part(gate, TOWER, towerM, [0, 9, z], [3.2, 22, 3.2], null, 0.02);
      for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) part(gate, roof4, piseDark, [a * 1.3, 20.5, z + b * 1.3], [0.35, 1, 0.35], null, 0);
      lantern(gate.localToWorld(new V3(-2.6, 8, z * 0.86)), 1.6); lantern(gate.localToWorld(new V3(2.6, 8, z * 0.86)), 1.6);
    }
    // 馬蹄形のアーチ（ゼリージュの帯）と、その上の狭間のついた壁
    part(gate, new THREE.TorusGeometry(R - 1.6, 0.7, 8, 40, Math.PI * 1.15), zellige(10, 1), [0, 3.5, 0], null, [0, Math.PI / 2, -Math.PI * 0.075], 0.03);
    const zm = zellige(6, 1);
    part(gate, BOX, [zm, zm, pise, pise, pise, pise], [0, 16.3, 0], [2.6, 4.6, 2 * R], null, 0.02);
    for (let z = -R + 1; z <= R - 1; z += 1.8) part(gate, roof4, piseDark, [0, 19, z], [0.4, 0.9, 0.4], null, 0);
    signAt(gate, 'カスバの門', 23, 10);
    occupied.push({ x: f.v.x, z: f.v.z, r: R + 4 });
    // 路地の両側の土の壁：ところどころに戸口
    const walls = [], doors = [];
    for (let s2 = at(6, 0.16); s2 < at(6, 0.95); s2 += 9) for (const sd of [-1, 1]) {
      const p = onGround(local(s2, 0, sd * (W / 2 + 9))); if (!clearAt(p.x, p.z, W / 2 + 8, 2)) continue;
      const yaw = yawAt(s2), h = rand(4, 5.5);
      houseAt(p.clone().add(new V3(0, -0.4, 0)), 8.4, h, 1.4, yaw); occupied.push({ x: p.x, z: p.z, r: 4.6 });
      if (Math.random() < 0.35) { const [ox, oz] = rot(rand(-2, 2), -sd * 0.72, yaw); doors.push({ p: new V3(p.x + ox, p.y + 1.1, p.z + oz), s: new V3(1.3, 2.2, 0.1), r: [0, yaw, 0], c: C(pick(['#2b4fa8', '#1f7a5a', '#8a2a22', '#4a3326'])) }); }
      if (Math.random() < 0.5) { const [ox, oz] = rot(rand(-3, 3), -sd * 0.9, yaw); lantern(new V3(p.x + ox, p.y + h - 1, p.z + oz)); }
    }
    addInst(BOX, toon('#ffffff'), doors, false);
  }
  {
    // タウリルトのカスバ：模様を刻んだ塔の群れと、中庭のヤシ
    const g = site('タウリルトのカスバ（ワルザザート）', at(6, 0.55), W / 2 + 36, 44, 32, '#d9a066', W / 2 + 24);
    addBox(g, [30, 9, 18], [0, 4.5, 2], houseM, null, 0.02); addBox(g, [16, 13, 10], [-4, 6.5, 4], houseM, null, 0.02); addBox(g, [10, 11, 8], [9, 5.5, 8], houseM, null, 0.02);
    g.updateMatrixWorld(true);
    for (const [x, z, h] of [[-17, -8, 17], [17, -8, 17], [-17, 12, 15], [17, 12, 15], [-4, -2, 20], [6, 2, 18]]) towerAt(g.localToWorld(new V3(x, 0, z)), x === -4 || x === 6 ? 4.6 : 5.2, h, g.rotation.y);
    for (let k = 0; k < 18; k++) addBox(g, [0.7, 1, 0.2], [rand(-13, 13), rand(2, 8), -7.05], warm);
    addBox(g, [4, 5, 0.3], [0, 2.5, -7.1], toon('#4a3326'));
    part(g, new THREE.TorusGeometry(2.2, 0.35, 6, 20, Math.PI * 1.15), zellige(3, 1), [0, 4.6, -7.3], null, [0, 0, -Math.PI * 0.075], 0);
    for (let k = 0; k < 8; k++) addPerson(g.localToWorld(new V3(rand(-12, 12), 0, rand(-14, -10))));
    addPalm(g.localToWorld(new V3(-20, 0, -12)), 1); addPalm(g.localToWorld(new V3(20, 0, -12)), 1.1);
    signAt(g, 'タウリルトのカスバ', 26, 14);
  }

  /* ---- 第7区間の外：リッサニのスーク。日よけの布の屋台に、香辛料の山・タジン鍋・絨毯・ランプ。ロバの駐車場と水売り ---- */
  {
    const names = ['香辛料', 'タジン鍋', '絨毯', 'ランプ', 'バブーシュ', 'ナツメヤシ', 'ミントティー', '化石', '銀の装身具', 'オリーブ'];
    const stripeTex = ctex(128, 64, g => { for (let x = 0; x < 128; x += 16) { g.fillStyle = (x / 16) % 2 ? '#ffffff' : '#c9c0b0'; g.fillRect(x, 0, 16, 64); } });
    const posts = [], awnings = [], counters = [], cones = [], pots = [], potLids = [], hung = [], slippers = [];
    let si = 0;
    for (let s = at(7, 0.06); s < at(7, 0.96) && si < names.length; s += 11) {
      const v = W / 2 + 17, c2 = onGround(local(s, 0, v)), yaw = yawAt(s);
      if (!clearAt(c2.x, c2.z, W / 2 + 12, 4)) continue;
      // 局所 -z が走路の側。売り台は走路の側を向く
      const L = (x, y, z) => { const [ox, oz] = rot(x, z, yaw); return new V3(c2.x + ox, c2.y + y, c2.z + oz); }, kind = names[si];
      for (const [x, z] of [[-3, -2], [3, -2], [-3, 2], [3, 2]]) posts.push({ p: L(x, 1.6, z), s: new V3(0.1, 3.2, 0.1) });
      awnings.push({ p: L(0, 3.3, -0.6), s: new V3(6.6, 0.12, 5.6), r: [0, yaw, 0], c: C(pick(['#c8302c', '#2b4fa8', '#e0b25a', '#2f7a5a', '#d86a2a'])) });
      counters.push({ p: L(0, 0.5, -1.5), s: new V3(5.6, 1, 1.2), r: [0, yaw, 0], c: C(pick(['#8a6244', '#6b4a33', '#a07a52'])) });
      if (kind === '香辛料') for (let k = 0; k < 7; k++) cones.push({ p: L(-2.4 + k * 0.8, 1.35, -1.5), s: new V3(0.32, 0.7, 0.32), c: C(['#c8302c', '#f2c230', '#8a5a2a', '#2f7a3a', '#e07a2a', '#a82a2a', '#d9b24c'][k]) });
      else if (kind === 'タジン鍋') for (let k = 0; k < 6; k++) { const col = C(pick(['#c8302c', '#2b4fa8', '#e0b25a', '#2f7a5a', '#c98a55'])); pots.push({ p: L(-2.2 + k * 0.9, 1.06, -1.5), s: new V3(0.4, 0.12, 0.4), c: col }); potLids.push({ p: L(-2.2 + k * 0.9, 1.4, -1.5), s: new V3(0.34, 0.6, 0.34), c: col }); }
      else if (kind === '絨毯') for (let k = 0; k < 3; k++) hung.push({ p: L(-2 + k * 2, 1.8, 1.8), s: new V3(1.8, 2.6, 1), r: [0, yaw, 0], m: k % 4 });
      else if (kind === 'ランプ') for (let k = 0; k < 7; k++) lantern(L(-2.6 + k * 0.85, 2.5 - (k % 2) * 0.4, -1.4), 0.9);
      else if (kind === 'バブーシュ') for (let k = 0; k < 10; k++) slippers.push({ p: L(-2.4 + (k % 5) * 1.1, 1.08, -1.8 + Math.floor(k / 5) * 0.5), s: new V3(0.5, 0.14, 0.2), r: [0, yaw, 0], c: C(pick(['#f2c230', '#c8302c', '#2b4fa8', '#f2ece0', '#2f7a5a'])) });
      else for (let k = 0; k < 8; k++) cones.push({ p: L(rand(-2.4, 2.4), 1.15, rand(-1.8, -1.2)), s: new V3(0.3, 0.3, 0.3), c: C(pick(['#7a3a1e', '#4a5a2a', '#c9c0b0', '#d9b24c', '#5a3f2a'])) });
      putBoard(kind, L(0, 3.9, -3.2), yaw + Math.PI, 4.2);
      for (let k = 0; k < 3; k++) addPerson(onGround(L(rand(-2.6, 2.6), 0, rand(-3.4, -5))));
      occupied.push({ x: c2.x, z: c2.z, r: 4.6 }); si++;
    }
    addInst(CYL, darkWood, posts, false); addInst(BOX, toon('#ffffff', { map: stripeTex }), awnings); addInst(BOX, toon('#ffffff'), counters);
    addInst(CONE, toon('#ffffff'), shuffle(cones), false); addInst(CYL, toon('#ffffff'), pots, false); addInst(CONE, toon('#ffffff'), potLids, false); addInst(BOX, toon('#ffffff'), slippers, false);
    carpetMats.forEach((mat, i) => addInst(new THREE.PlaneGeometry(1, 1), mat, hung.filter(o => o.m === i), false));
    registerLandmark(fantasyGroup(onGround(local(at(7, 0.5), 0, W / 2 + 17))), 'リッサニのスーク（市場）');
    // ロバの駐車場：市場の裏の柵に、荷かごを積んだロバがずらりとつながれる
    const s = at(7, 0.45), c = onGround(local(s, 0, W / 2 + 34)), yaw = yawAt(s);
    if (clearAt(c.x, c.z, W / 2 + 26, 10)) {
      const [ax, az] = rot(-9, 0, yaw), [bx, bz] = rot(9, 0, yaw), a = onGround(new V3(c.x + ax, 0, c.z + az)), b = onGround(new V3(c.x + bx, 0, c.z + bz));
      addInst(BOX, wood, [beam(a.clone().add(new V3(0, 1.1, 0)), b.clone().add(new V3(0, 1.1, 0)), 0.15)], false);
      addInst(CYL, wood, [-9, -3, 3, 9].map(x => { const [ox, oz] = rot(x, 0, yaw); const p = onGround(new V3(c.x + ox, 0, c.z + oz)); return { p: p.add(new V3(0, 0.6, 0)), s: new V3(0.12, 1.2, 0.12) }; }), false);
      const ds = []; for (let k = 0; k < 9; k++) { const [ox, oz] = rot(-8 + k * 2, -1.6, yaw); ds.push({ p: onGround(new V3(c.x + ox, 0, c.z + oz)), yaw: yaw - Math.PI / 2 + rand(-0.15, 0.15) }); }
      stamp(donkeyTpl(), ds);
      const g = registerLandmark(fantasyGroup(c), 'ロバの駐車場（リッサニのスーク）'); signAt(g, 'ロバの駐車場', 5, 9);
      occupied.push({ x: c.x, z: c.z, r: 11 });
    }
    // 水売り（ゲッラブ）：赤い服に房のついた大きな帽子、真鍮の杯と鈴。屋台の前を行き来する
    const wg = fantasyGroup(); wg.userData.droneIgnore = true; figure(wg, 0, 0, 0, '#c8302c', 1, '#c8302c');
    part(wg, CYL, toon('#d8343a'), [0, 2.35, 0], [0.75, 0.12, 0.75], null, 0); part(wg, CONE, toon('#d8343a'), [0, 2.7, 0], [0.32, 0.6, 0.32], null, 0);
    const fr = []; for (let k = 0; k < 16; k++) { const a = k / 16 * Math.PI * 2; fr.push({ p: new V3(Math.cos(a) * 0.72, 2.12, Math.sin(a) * 0.72), s: new V3(0.06, 0.35, 0.06), c: C(pick(['#f2c230', '#2b4fa8', '#2f7a5a', '#f2ece0'])) }); }
    wg.add(inst(SPH_LO, toon('#ffffff'), fr, false));
    part(wg, SPH_LO, toon('#5a3f2a'), [-0.3, 1.2, 0.25], [0.32, 0.45, 0.28], null, 0); for (const z of [-0.36, 0.36]) part(wg, CYL, brass, [0.15, 1.5, z], [0.12, 0.1, 0.12], null, 0);
    const wpts = []; for (let s2 = at(7, 0.1); s2 <= at(7, 0.9); s2 += 6) wpts.push(onGround(local(s2, 0, W / 2 + 11)));
    const wr = route(wpts, false);
    updates.push(t => {
      const m = reduced.matches ? 0 : t, k = mod(m * 0.9, wr.L * 2), back = k > wr.L, { p, yaw } = wr.at(back ? wr.L * 2 - k : k);
      wg.position.set(p.x, p.y + Math.abs(Math.sin(m * 5)) * 0.06, p.z); wg.rotation.y = yaw + (back ? Math.PI : 0);
    });
    registerLandmark(fantasyGroup(wr.at(wr.L / 2).p.clone()), '水売り（ゲッラブ）');
  }

  /* ---- 第8区間の外：ハムリアのグナワの楽団。鉄のカスタネット（カルカベ）と弦楽器ゲンブリ、太鼓、房のついた帽子を回して踊る ---- */
  let gnawa = null;
  {
    const spot = findSpot(at(8, 0.2), at(8, 0.8), W / 2 + 21, W / 2 + 30, W / 2 + 14, 8);
    if (spot) {
      const { s, p: c } = spot;
      const g = registerLandmark(fantasyGroup(c), 'ハムリアのグナワの楽団'); g.rotation.y = yawAt(s) + Math.PI; g.updateMatrixWorld(true);
      part(g, new THREE.PlaneGeometry(9, 6), carpetMats[0], [0, 0.04, 0], null, [-Math.PI / 2, 0, 0], 0);
      const players = [];
      for (let k = 0; k < 5; k++) {
        const pg = new THREE.Group(); pg.position.set(-3.6 + k * 1.8, 0, 1.6); g.add(pg);
        figure(pg, 0, 0, 0, '#f2ece0', 1, k % 2 ? '#c8302c' : '#2b4fa8');
        for (let j = 0; j < 6; j++) part(pg, SPH_LO, toon('#f6f0e0'), [Math.cos(j) * 0.28, 2.15, Math.sin(j) * 0.28], [0.05, 0.05, 0.05], null, 0);   // 帽子の子安貝
        if (k === 2) { part(pg, BOX, toon('#8a6244'), [0.2, 1.1, -0.4], [0.7, 0.35, 0.3], [0, 0, 0.4], 0); part(pg, BOX, darkWood, [0.75, 1.5, -0.4], [0.8, 0.06, 0.06], [0, 0, 0.4], 0); }
        else for (const sd of [-1, 1]) part(pg, BOX, steel, [0.35, 1.3, sd * 0.3], [0.2, 0.06, 0.1], null, 0);
        players.push({ g: pg, ph: k * 0.7 });
      }
      part(g, CYL, toon('#8a6244'), [-2.4, 0.45, -1.4], [0.5, 0.9, 0.5], null, 0.03); figure(g, -3.2, 0, -1.4, '#2b3f8a');
      // 踊り手：子安貝の帽子の房を振り回してまわる
      const dancer = new THREE.Group(); dancer.position.set(1.2, 0, -1); g.add(dancer); figure(dancer, 0, 0, 0, '#2b4fa8', 1, '#f2ece0');
      const tassel = new THREE.Group(); tassel.position.set(0, 2.25, 0); dancer.add(tassel); addBox(tassel, [0.6, 0.03, 0.03], [0.3, 0, 0], toon('#1a1a1a')); part(tassel, SPH_LO, toon('#1a1a1a'), [0.62, 0, 0], [0.09, 0.09, 0.09], null, 0);
      for (let k = 0; k < 4; k++) { addBox(g, [0.1, 2.4, 0.1], [-4.6 + k * 3.1, 1.2, 3.2], darkWood); lantern(g.localToWorld(new V3(-4.6 + k * 3.1, 2.6, 3.2))); }
      for (let k = 0; k < 14; k++) { const a = rand(-1.2, 1.2) + Math.PI * 1.5, r = rand(5.5, 7.5); addPerson(g.localToWorld(new V3(Math.cos(a) * r, 0, Math.sin(a) * r * 0.7 - 1))); }
      signAt(g, 'ハムリアのグナワの楽団', 6.5, 13);
      occupied.push({ x: c.x, z: c.z, r: 8 });
      gnawa = { players, dancer, tassel, speed: 1 };
      updates.push((t, dt) => {
        if (reduced.matches) return;
        gnawa.ph = (gnawa.ph || 0) + dt * gnawa.speed;
        const m = gnawa.ph;
        for (const p of players) p.g.position.y = Math.abs(Math.sin(m * 5 + p.ph)) * 0.08;
        dancer.rotation.y = m * 2.2; tassel.rotation.y = m * 7; dancer.position.y = Math.abs(Math.sin(m * 4.4)) * 0.15;
      });
    }
  }

  /* ---- 内馬場：ダヤト・スルジの湖とフラミンゴ ---- */
  {
    const shore = new THREE.Mesh(new THREE.CircleGeometry(1, 48), toon('#b8865a')); shore.rotation.x = -Math.PI / 2; shore.scale.set(lake.rx * 1.12, lake.rz * 1.12, 1); shore.position.set(lake.c.x, lake.c.y + 0.04, lake.c.z); shore.receiveShadow = true; world.add(shore);
    const water = new THREE.Mesh(new THREE.CircleGeometry(1, 48), toon('#3a8fd8', { emissive: C('#2f6fb0'), emissiveIntensity: 0.5 })); water.rotation.x = -Math.PI / 2; water.scale.set(lake.rx, lake.rz, 1); water.position.set(lake.c.x, lake.c.y + 0.08, lake.c.z); world.add(water);
    const reeds = [];
    for (let k = 0; k < 140; k++) { const a = rand(0, Math.PI * 2), r = rand(0.95, 1.1); reeds.push({ p: new V3(lake.c.x + Math.cos(a) * lake.rx * r, lake.c.y + 0.6, lake.c.z + Math.sin(a) * lake.rz * r), s: new V3(0.12, rand(1, 1.8), 0.12), r: [rand(-0.2, 0.2), 0, rand(-0.2, 0.2)], c: C(pick(['#6a7a3a', '#8a8a4a', '#5a6a32'])) }); }
    addInst(CONE, toon('#ffffff'), reeds, false);
    const flock = [];
    for (let k = 0; k < 30; k++) { const a = rand(0, Math.PI * 2), r = Math.sqrt(rand(0.3, 0.85)); flock.push({ p: new V3(lake.c.x + Math.cos(a) * lake.rx * r, lake.c.y + 0.08, lake.c.z + Math.sin(a) * lake.rz * r), yaw: rand(0, Math.PI * 2), sc: rand(1.1, 1.4) }); }
    stamp(flamingoTpl(false), flock.filter((_, i) => i % 3)); stamp(flamingoTpl(true), flock.filter((_, i) => i % 3 === 0));
    const g = registerLandmark(fantasyGroup(lake.c.clone()), 'ダヤト・スルジの湖とフラミンゴ'); signAt(g, 'ダヤト・スルジの湖', 9, 12);
  }

  /* ---- 内馬場：夕陽の大砂時計（ファンタジー）。上の玉から砂が落ち続け、ゴールで光る ---- */
  let hourglass = null;
  {
    const g = registerLandmark(fantasyGroup(glassC), '夕陽の大砂時計'), frame = toon('#6b4a33'), sandC = toon('#e8a965');
    for (const y of [0.6, 23.4]) part(g, new THREE.CylinderGeometry(7, 7.4, 1.2, 8), frame, [0, y, 0], null, null, 0.03);
    for (let k = 0; k < 4; k++) { const a = k / 4 * Math.PI * 2 + Math.PI / 4; part(g, CYL, frame, [Math.cos(a) * 6, 12, Math.sin(a) * 6], [0.5, 22, 0.5], null, 0.03); part(g, SPH_LO, brass, [Math.cos(a) * 6, 24.4, Math.sin(a) * 6], [0.8, 0.8, 0.8], null, 0); }
    part(g, CONE, sandC, [0, 3.0, 0], [4.4, 3.6, 4.4], null, 0); part(g, CONE, sandC, [0, 16.6, 0], [3.6, 3.4, 3.6], [Math.PI, 0, 0], 0);
    const glass = toon('#fff2d8', { transparent: true, opacity: 0.3, emissive: C('#ffb060'), emissiveIntensity: 0.2, depthWrite: false });
    for (const y of [6.6, 17.4]) part(g, SPH, glass, [0, y, 0], [5.2, 5.6, 5.2], null, 0);
    const streamM = toon('#ffd08a', { emissive: C('#ffb050'), emissiveIntensity: 0.5 }); part(g, CYL, streamM, [0, 9, 0], [0.12, 6, 0.12], null, 0);
    const lp = [];
    for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2, q = onGround(glassC.clone().add(new V3(Math.cos(a) * 10, 0, Math.sin(a) * 10))); lp.push({ p: q.clone().add(new V3(0, 0.7, 0)), s: new V3(0.08, 1.4, 0.08) }); lantern(q.clone().add(new V3(0, 1.7, 0)), 1.3); }
    addInst(CYL, darkWood, lp, false);
    signAt(g, '夕陽の大砂時計', 28, 10);
    hourglass = { glass, streamM, c: glassC };
  }

  /* ---- 砂丘を並べる：コースの外の砂の海と、地平まで続くシェビ砂丘の連なり。遠くにアトラス山脈 ---- */
  {
    const near = [];
    for (let k = 0, n = 0; k < 900 && n < 70; k++) {
      const s = rand(0, track.L), v = W / 2 + 40 + 260 * Math.random() ** 1.3, c = local(s, 0, v);
      if (inLoop(c.x, c.z)) continue;
      const len = rand(40, 110), wid = len * rand(0.45, 0.6), H = len * rand(0.1, 0.18), yaw = windYaw + rand(-0.35, 0.35), foot = duneFoot(c, yaw, len, wid);
      if (foot.some(p => roadDist(p.x, p.z, W / 2 + 22) < W / 2 + 20 || taken(p.x, p.z, 0) || inLoop(p.x, p.z))) continue;
      c.y = Math.min(...foot.map(groundAt)) - 0.6;
      const d = { c, yaw, len, wid, H, R: Math.max(len, wid) / 2 }; duneList.push(d);
      near.push({ p: c, s: new V3(len, H, wid), r: [0, yaw, 0] }); occupied.push({ x: c.x, z: c.z, r: wid * 0.45 }); n++;
    }
    addInst(duneGeo(40, 24), duneMat, shuffle(near));
    const base = Math.max(640, track.extent + 330), far = [];
    for (let i = 0; i < 46; i++) {
      const a = i / 46 * Math.PI * 2 + rand(-0.04, 0.04), r = base + rand(0, 320), len = rand(240, 460);
      far.push({ p: new V3(center.x + Math.cos(a) * r, -2, center.z + Math.sin(a) * r), s: new V3(len, len * rand(0.16, 0.26), len * rand(0.45, 0.6)), r: [0, windYaw + rand(-0.3, 0.3), 0] });
    }
    const farMesh = inst(duneGeo(32, 20), toon('#ffffff', { vertexColors: true }), far, false); farMesh.userData.backdrop = true;
    // アトラス山脈：雪をいただく高い峰が、砂丘の向こうにかすむ（夕陽と反対の側）
    // 横に長くつらなる山なみ：なだらかな山塊を重ね、ところどころにとがった峰
    const atlas = [], caps = [], peaks = [], coneG = new THREE.ConeGeometry(1, 1, 7); coneG.translate(0, 0.5, 0);
    for (let i = 0; i < 16; i++) {
      const a = -Math.PI / 2 - 1.0 + i * 0.13 + rand(-0.03, 0.03), r = base + 560 + rand(0, 120), rr = rand(150, 230), h = rand(90, 150), yaw = a + Math.PI / 2;
      const p = new V3(center.x + Math.cos(a) * r, -20, center.z + Math.sin(a) * r);
      atlas.push({ p, s: new V3(rr, h, rr * 0.6), r: [0, -yaw, 0], c: C(pick(['#8a6070', '#7a5a6a', '#94687a'])) });
      caps.push({ p: new V3(p.x, p.y + h * 0.72, p.z), s: new V3(rr * 0.42, h * 0.32, rr * 0.28), r: [0, -yaw, 0] });
      if (i % 3 === 1) { const ph = h * rand(1.15, 1.35); peaks.push({ p: p.clone(), s: new V3(rr * 0.55, ph, rr * 0.45), r: [0, rand(0, 3), 0] }); caps.push({ p: new V3(p.x, p.y + ph * 0.62, p.z), s: new V3(rr * 0.22, ph * 0.38, rr * 0.18), r: [0, 0, 0], cone: true }); }
    }
    for (const m of [inst(SPH_LO, toon('#ffffff', { fog: true }), atlas, false), inst(coneG, toon('#86606e', { fog: true }), peaks, false),
      inst(SPH_LO, toon('#fff0e6', { fog: true }), caps.filter(o => !o.cone), false), inst(coneG, toon('#fff0e6', { fog: true }), caps.filter(o => o.cone), false)]) m.userData.backdrop = true;
  }

  /* ---- 木と草：オアシス（第4〜6区間）と涸れ川のほとりはナツメヤシの林、砂の上にはタマリスクの茂みとアカシア、礫の石 ---- */
  {
    const oasisS0 = at(4, 0.75), oasisS1 = at(6, 0.2);
    for (let k = 0, n = 0; k < 4000 && n < 300; k++) {
      const s = rand(oasisS0, oasisS1), v = (Math.random() < 0.65 ? 1 : -1) * (W / 2 + 10 + 110 * Math.random() ** 1.4), p = local(s, 0, v);
      if (!clearAt(p.x, p.z, W / 2 + 9, 2.4) || onLake(p.x, p.z, 1.3) || onSand(p.x, p.z)) continue;
      onGround(p); addPalm(p, rand(0.85, 1.25)); occupied.push({ x: p.x, z: p.z, r: 2.2 }); n++;
    }
    // 湖のまわりと内馬場の木立
    for (let k = 0, n = 0; k < 1200 && n < 70; k++) {
      const a = rand(0, Math.PI * 2), r = rand(1.2, 2.2), p = new V3(lake.c.x + Math.cos(a) * lake.rx * r, 0, lake.c.z + Math.sin(a) * lake.rz * r);
      if (!inLoop(p.x, p.z) || !clearAt(p.x, p.z, W / 2 + 10, 2.4) || p.distanceTo(boardPos) < 26) continue;
      onGround(p); addPalm(p, rand(0.8, 1.15)); occupied.push({ x: p.x, z: p.z, r: 2.2 }); n++;
    }
    for (let k = 0, n = 0; k < 2000 && n < 40; k++) {
      const i = (Math.random() * track.N) | 0, p = new V3(track.xs[i], 0, track.zs[i]).lerp(center, rand(0.1, 1));
      if (!inLoop(p.x, p.z) || !clearAt(p.x, p.z, W / 2 + 10, 3) || p.distanceTo(boardPos) < 26) continue;
      onGround(p); addPalm(p, rand(0.8, 1.1)); occupied.push({ x: p.x, z: p.z, r: 2.4 }); n++;
    }
    // 砂の上のヤシ（ところどころ）と、タマリスクの茂み・アカシア・礫
    const bushes = [], acTrunk = [], acTop = [], stones = [];
    for (let k = 0, n = 0; k < 5000 && n < 420; k++) {
      const s = rand(0, track.L), v = (Math.random() < 0.8 ? 1 : -1) * (W / 2 + 8 + 240 * Math.random() ** 1.6), p = local(s, 0, v);
      if (!clearAt(p.x, p.z, W / 2 + 7, 1.2) || onLake(p.x, p.z, 1.3) || onSand(p.x, p.z)) continue;
      onGround(p); const r = Math.random();
      if (r < 0.08) { addPalm(p, rand(0.8, 1.1)); occupied.push({ x: p.x, z: p.z, r: 2.2 }); }
      else if (r < 0.16) {
        const h = rand(2.4, 3.6); acTrunk.push({ p: p.clone().add(new V3(0, h / 2, 0)), s: new V3(0.18, h, 0.18), r: [rand(-0.15, 0.15), 0, rand(-0.15, 0.15)] });
        acTop.push({ p: p.clone().add(new V3(0, h + 0.2, 0)), s: new V3(rand(2.4, 3.4), 0.55, rand(2.4, 3.4)), c: C(pick(['#7a8a3a', '#6a7a34', '#8a9446'])) }); occupied.push({ x: p.x, z: p.z, r: 3 });
      } else if (r < 0.55) { const sc = rand(0.6, 1.4); bushes.push({ p: p.clone().add(new V3(0, 0.3 * sc, 0)), s: new V3(1.1 * sc, 0.7 * sc, 1.1 * sc), c: C(pick(['#8a8f5a', '#9a9a62', '#7a7a4e', '#a39a6a'])) }); occupied.push({ x: p.x, z: p.z, r: 1.2 }); }
      else stones.push({ p: p.clone().add(new V3(0, 0.05, 0)), s: new V3(rand(0.3, 0.9), rand(0.15, 0.4), rand(0.3, 0.9)), r: [0, rand(0, 3), 0], c: C(pick(['#5a3f2e', '#7a5a42', '#3e2e24'])) });
      n++;
    }
    addInst(SPH_LO, toon('#ffffff'), shuffle(bushes)); addInst(CYL_T, toon('#5e4a36'), acTrunk); addInst(SPH_LO, toon('#ffffff'), acTop); addInst(SPH_LO, toon('#ffffff'), shuffle(stones), false);
    shuffle(palms);
    addInst(CYL_T, toon('#7d5f40'), palms.map(t => t.trunk)); addInst(BOX, toon('#ffffff'), palms.flatMap(t => t.leaves)); addInst(SPH_LO, toon('#d9822b'), palms.flatMap(t => t.dates), false);
  }

  /* ---- 内馬場：草を食むラクダの群れ ---- */
  {
    const herd = [];
    for (let k = 0; k < 300 && herd.length < 7; k++) {
      const p = lake.c.clone().add(new V3(rand(-1, 1) * lake.rx * 2, 0, rand(-1, 1) * lake.rz * 2.4));
      if (!inLoop(p.x, p.z) || !clearAt(p.x, p.z, W / 2 + 12, 3) || onLake(p.x, p.z, 1.15)) continue;
      herd.push({ p: onGround(p), yaw: rand(0, Math.PI * 2) }); occupied.push({ x: p.x, z: p.z, r: 3 });
    }
    stamp(camelTpl(), herd);
  }

  /* ---- 空：夕陽の砂漠の上をゆっくり漂う熱気球 ---- */
  const balloons = [];
  {
    const sets = [['#c8302c', '#f2c230'], ['#2b4fa8', '#f2ece0'], ['#2f7a5a', '#e0b25a'], ['#6a2b5e', '#ff8a3a']];
    sets.forEach(([a, b], i) => {
      const tex = ctex(256, 64, c => { for (let x = 0; x < 256; x += 16) { c.fillStyle = (x / 16) % 2 ? a : b; c.fillRect(x, 0, 16, 64); } });
      const g = fantasyGroup(); g.userData.droneIgnore = true;
      const env = toon('#ffffff', { map: tex });
      part(g, SPH, env, [0, 9, 0], [6, 7.2, 6], null, 0.02); part(g, new THREE.ConeGeometry(1, 1, 16, 1, true), toon('#ffffff', { map: tex, side: THREE.DoubleSide }), [0, 2.9, 0], [3.4, 2.6, 3.4], [Math.PI, 0, 0], 0);
      addBox(g, [1.6, 1.1, 1.6], [0, 0.55, 0], toon('#8a6244'));
      for (const [x, z] of [[-0.7, -0.7], [0.7, -0.7], [-0.7, 0.7], [0.7, 0.7]]) addBox(g, [0.04, 1.6, 0.04], [x, 1.9, z], darkWood);
      const flame = part(g, SPH_LO, glowMat('#ffb040', 3), [0, 2.0, 0], [0.25, 0.45, 0.25], null, 0);
      figure(g, -0.35, 0.3, 0, pick(['#f2ece0', '#2b3f8a']), 0.6); figure(g, 0.35, 0.3, 0, pick(['#c8302c', '#e0b25a']), 0.6);
      balloons.push({ g, flame, r: rand(260, 420), h: rand(70, 130), ph: i * 1.6 + rand(0, 0.5), v: rand(0.012, 0.02) * (i % 2 ? 1 : -1) });
    });
    updates.push(t => {
      const m = reduced.matches ? 0 : t, flare = celebration > 0 ? 1 : 0;
      for (const b of balloons) {
        const a = m * b.v + b.ph; b.g.position.set(center.x + Math.cos(a) * b.r, b.h + Math.sin(m * 0.2 + b.ph) * 4, center.z + Math.sin(a) * b.r);
        const f = (Math.sin(m * 3 + b.ph * 5) > 0.6 ? 1.6 : 0.9) + flare * 1.2; b.flame.scale.set(0.25 * f, 0.45 * f, 0.25 * f);
      }
    });
  }

  // まとめて描く：人々、頭布、文字の板、ランタン、塔と家
  let lanternMesh = null;
  {
    const order = shuffle(people.map((_, i) => i));
    addInst(new THREE.CapsuleGeometry(0.3, 0.75, 3, 8), toon('#ffffff'), order.map(i => people[i]), false); addInst(SPH_LO, toon('#ffffff'), order.map(i => heads[i]), false); addInst(SPH_LO, toon('#ffffff'), order.map(i => wraps[i]), false);
    for (const [key, list] of boardLists) addInst(new THREE.PlaneGeometry(1, 1), boardMats.get(key), list, false);
    const lo = shuffle(lanterns.map((_, i) => i));
    lanternMesh = addInst(SPH_LO, new THREE.MeshBasicMaterial({ color: C('#ffffff').multiplyScalar(1.5) }), lo.map(i => lanterns[i]), false); addInst(CONE, brass, lo.map(i => lanternCaps[i]), false);
    addInst(TOWER, towerM, towerL); addInst(BOX, houseM, houseL); addInst(roof4, piseDark, merlonL, false);
  }

  /* ---- 煙と火の粉、風に流れる砂 ---- */
  const smokeC = C('#d9c2a8'), ember = C('#ffb050').multiplyScalar(1.6), sandC = C('#f3c98f');
  {
    let acc = 0, acc2 = 0;
    updates.push((t, dt) => {
      if (reduced.matches) return;
      const lq = lightQuality();
      acc += dt * smokes.length * (lq ? 1 : 2.5);
      while (acc >= 1 && smokes.length) { acc--; const p = pick(smokes); dustP.emit(p.x + rand(-0.2, 0.2), p.y, p.z + rand(-0.2, 0.2), rand(-0.3, 0.3) + 0.4, rand(1, 1.8), rand(-0.3, 0.3), rand(3, 5), rand(1, 2), smokeC, -0.05, 0.3); }
      acc2 += dt * fires.length * (lq ? 3 : 8);
      while (acc2 >= 1 && fires.length) { acc2--; const p = pick(fires); sparkP.emit(p.x + rand(-0.3, 0.3), p.y + 0.4, p.z + rand(-0.3, 0.3), rand(-0.4, 0.4), rand(2, 4), rand(-0.4, 0.4), rand(0.6, 1.2), rand(0.15, 0.3), ember, -0.5, 0.5); }
    });
  }

  /* ---- ゴール：ランタンが一斉に明るく灯り、大砂時計が金色に輝いて砂が光の粒になって舞い上がる。夕空に花火 ---- */
  themeFinish = () => { celebration = 9; }; themeReset = () => { celebration = 0; };
  let burst = 0;
  const lanternBase = C('#ffffff').multiplyScalar(1.5), fw = ['#ffb347', '#ff5a5a', '#7fe0a0', '#ffd27a', '#7fb8ff', '#ff8fd0'].map(c => C(c).multiplyScalar(1.6)), gold = C('#ffd27a').multiplyScalar(1.6);
  updates.push((t, dt) => {
    const glow = celebration > 0 ? Math.min(1, celebration / 2) : 0, m = reduced.matches ? 0 : t;
    if (lanternMesh) lanternMesh.material.color.copy(lanternBase).multiplyScalar(1 + glow * 1.2 + 0.08 * Math.sin(m * 3));
    if (hourglass) { hourglass.glass.emissiveIntensity = 0.2 + glow * 1.4; hourglass.streamM.emissiveIntensity = 0.5 + glow * 2 + 0.2 * Math.sin(m * 9); }
    if (gnawa) gnawa.speed = 1 + glow * 1.5;
    if (celebration <= 0) return;
    celebration = Math.max(0, celebration - dt);
    if (reduced.matches) return;
    burst += dt * (lightQuality() ? 2 : 4);
    for (; burst >= 1; burst--) {
      const s = track.finishS + rand(-120, 60), f = tp(s, W + rand(30, 90)), y = rand(45, 75), col = pick(fw);
      for (let i = 0; i < 46; i++) { const a = rand(0, Math.PI * 2), b = Math.acos(rand(-1, 1)), sp = rand(9, 13); sparkP.emit(f.v.x, y, f.v.z, Math.sin(b) * Math.cos(a) * sp, Math.cos(b) * sp, Math.sin(b) * Math.sin(a) * sp, rand(1.3, 1.9), rand(0.5, 0.9), col, 3, 1.2); }
    }
    if (hourglass && Math.random() < 0.6) { const c = hourglass.c; sparkP.emit(c.x + rand(-5, 5), c.y + rand(2, 22), c.z + rand(-5, 5), rand(-1, 1), rand(1, 3), rand(-1, 1), rand(1, 1.8), rand(0.8, 1.4), gold, 0.5, 0.5); }
  });

  // 風に流れる砂けむり（地面すれすれを風下へ）
  const wx = Math.sin(windYaw), wz = Math.cos(windYaw);
  ambient(TEX_SOFT, false, 50, (a, c) => a.emit(c.x + rand(-60, 60) - wx * 30, groundAt(c) + rand(0.2, 5), c.z + rand(-60, 60) - wz * 30, wx * rand(5, 10) + rand(-1, 1), rand(-0.2, 0.3), wz * rand(5, 10) + rand(-1, 1), 5, rand(0.4, 0.9), sandC, 0, 0.2));
  // 広い範囲に散らばるインスタンスは、原点の境界球で切り捨てられないようにする
  for (const o of world.children.slice(n0)) if (o.isInstancedMesh) o.frustumCulled = false;
  themeUpd.push((t, dt) => { for (const f of updates) f(t, dt); });
}
// スタンド：カスバのような土の城のスタンド。段の前に幾何学模様の腰壁と掛けた絨毯、両端に模様を刻んだ塔、屋根の縁に狭間、
// 屋上に馬蹄形のアーチの「夕陽デザート」の看板、軒にモロッコのランタン
function decorDuneStand(stand, len, z0, roof) {
  const g = new THREE.Group(); stand.add(g); registerLandmark(g, 'dune-stand');
  const pise = toon('#c98a55'), piseDark = toon('#a8673e');
  // 腰壁：赤土に、白と藍のベルベルの菱形の帯（局所 -z が走路の側）
  const band = ctex(256, 64, c => {
    c.fillStyle = '#c98a55'; c.fillRect(0, 0, 256, 64);
    c.fillStyle = '#f4ecdc'; c.fillRect(0, 22, 256, 20);
    for (let x = 0; x < 256; x += 32) { c.fillStyle = '#2b3f7a'; c.beginPath(); c.moveTo(x + 16, 22); c.lineTo(x + 26, 32); c.lineTo(x + 16, 42); c.lineTo(x + 6, 32); c.closePath(); c.fill(); }
    c.fillStyle = '#8f5532'; for (let x = 0; x < 256; x += 8) { c.fillRect(x, 8, 4, 6); c.fillRect(x + 4, 50, 4, 6); }
  }, true);
  band.repeat.set(len / 8, 1);
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(len, 1.6), toon('#ffffff', { map: band, side: THREE.DoubleSide })); wall.position.set(0, 0.85, z0 - 0.05); g.add(wall);
  // 腰壁に掛けた絨毯
  const rugCols = [['#9e2a2b', '#f2dfb4'], ['#2b3f7a', '#e8d6b0'], ['#c46a1d', '#2b3f7a'], ['#6a2b5e', '#f2c230']];
  const rugs = rugCols.map(([bg, fg]) => toon('#ffffff', { side: THREE.DoubleSide, map: ctex(64, 96, c => {
    c.fillStyle = bg; c.fillRect(0, 0, 64, 96); c.strokeStyle = fg; c.lineWidth = 4; c.strokeRect(5, 5, 54, 86);
    c.fillStyle = fg; for (const y of [30, 66]) { c.beginPath(); c.moveTo(32, y - 12); c.lineTo(46, y); c.lineTo(32, y + 12); c.lineTo(18, y); c.closePath(); c.fill(); }
  }) }));
  for (let x = -len / 2 + 4, i = 0; x <= len / 2 - 4; x += 7, i++) { const r = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 2.4), rugs[i % 4]); r.position.set(x, 0.6, z0 - 0.12); g.add(r); }
  // 屋根の前の縁の狭間と、軒に下がるランタン
  const mer = [], lamps = [], cols = ['#ffb347', '#ff6a4a', '#7fe0a0', '#7fb8ff', '#ffd27a'].map(C);
  const merG = new THREE.ConeGeometry(1, 1, 4); merG.rotateY(Math.PI / 4);
  for (let x = -len / 2; x <= len / 2; x += 1.6) mer.push({ p: new V3(x, 14.1, z0 - 2.2), s: new V3(0.4, 1, 0.4) });
  for (let x = -len / 2 + 1.5; x <= len / 2 - 1.5; x += 3) lamps.push({ p: new V3(x, 11.4, z0 - 2.2), s: new V3(0.3, 0.45, 0.3), c: cols[Math.round(x / 3 + 100) % cols.length] });
  g.add(inst(merG, piseDark, mer, false), inst(SPH_LO, new THREE.MeshBasicMaterial({ color: C('#ffffff').multiplyScalar(1.6) }), lamps, false));
  // 屋根に載る土の胸壁
  addBox(g, [len + 6, 1.2, 0.8], [0, 13.6, z0 - 2.4], pise);
  // 両端の塔：上すぼまりで、上のほうに刻んだ模様
  const tex = ctex(128, 256, c => {
    c.fillStyle = '#c98a55'; c.fillRect(0, 0, 128, 256);
    c.fillStyle = '#8f5532'; for (let x = 0; x < 128; x += 32) { for (const y of [24, 48]) { c.beginPath(); c.moveTo(x + 16, y - 10); c.lineTo(x + 26, y); c.lineTo(x + 16, y + 10); c.lineTo(x + 6, y); c.closePath(); c.fill(); } c.fillStyle = '#3a2418'; c.fillRect(x + 13, 110, 6, 20); c.fillStyle = '#8f5532'; }
  });
  const tg = new THREE.CylinderGeometry(0.72, 1, 1, 4); tg.rotateY(Math.PI / 4);
  for (const x of [-len / 2 - 3, len / 2 + 3]) {
    part(g, tg, toon('#ffffff', { map: tex }), [x, 11, z0 + 3], [3.4, 22, 3.4], null, 0.02);
    for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) part(g, merG, piseDark, [x + a * 1.4, 22.6, z0 + 3 + b * 1.4], [0.45, 1.2, 0.45], null, 0);
  }
  // 屋上の看板：馬蹄形のアーチに縁取った「夕陽デザート」
  const sign = ctex(512, 320, c => {
    c.clearRect(0, 0, 512, 320);
    const arch = () => { c.beginPath(); c.moveTo(70, 320); c.lineTo(70, 241); c.arc(256, 200, 190, Math.PI * 0.93, Math.PI * 2.07); c.lineTo(441, 320); c.closePath(); };
    arch(); c.fillStyle = '#1f7a5a'; c.fill();
    c.save(); c.translate(256, 320); c.scale(0.9, 0.92); c.translate(-256, -320); arch(); c.fillStyle = '#2b1f4a'; c.fill(); c.restore();
    c.fillStyle = '#ffd27a'; c.shadowColor = '#ff8a3a'; c.shadowBlur = 16; c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = '900 64px "Dela Gothic One", sans-serif'; c.fillText('夕陽デザート', 256, 215, 330);
  });
  const w = Math.min(30, len * 0.3), h = w * 320 / 512;
  for (const sx of [-w * 0.3, w * 0.3]) addBox(g, [0.6, 3.4, 0.6], [sx, 15.4, z0 + 6], piseDark);
  const bm = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: sign, transparent: true, color: C('#ffffff').multiplyScalar(1.25) })); bm.position.set(0, 16.6 + h / 2, z0 + 5.98); bm.rotation.y = Math.PI; g.add(bm);
  const back = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: sign, transparent: true })); back.position.set(0, 16.6 + h / 2, z0 + 6.02); g.add(back);
  // スタンドの前の植木鉢のナツメヤシ
  for (const x of [-len / 2 + 1, len / 2 - 1]) {
    part(g, new THREE.CylinderGeometry(0.9, 0.7, 1.2, 10), toon('#2b4fa8'), [x, 0.6, z0 - 2], null, null, 0.04);
    part(g, new THREE.CylinderGeometry(0.7, 1, 1, 7), toon('#7d5f40'), [x, 3.6, z0 - 2], [0.25, 5, 0.25], null, 0);
    for (let k = 0; k < 9; k++) { const a = k / 9 * Math.PI * 2; part(g, BOX, toon('#4f8a3a'), [x + Math.cos(a) * 1.2, 6.1, z0 - 2 - Math.sin(a) * 1.2], [2.6, 0.06, 0.45], [0, a, -0.45], 0); }
  }
}
