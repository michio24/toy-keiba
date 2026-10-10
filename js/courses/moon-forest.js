// 月光きのこ森ステークス
'use strict';

/* ---- 月光きのこ森ステークス：鹿児島県の屋久島（世界遺産「屋久島」）を下敷きにした月夜の森 ---- */
// 見立て：「月に35日雨が降る」といわれる屋久島の苔むす森を、光るきのこ（シイノトモシビタケ）が灯る月夜の森をひと回りするコースに。
// 区間の役割：0 屋久杉の丸太と苔の屋根のスタンドのホーム直線／1 安房森林軌道のトロッコ道：丸太を運ぶトロッコと登山者、小杉谷の集落跡／
// 2 苔むす森の上り：白谷雲水峡の渓流と飛び石・さつき吊橋、弥生杉、丘の上の太鼓岩、ヤクシカ／
// 3 妖精の木漏れ日：ウィルソン株（中から見上げるとハートの形の空）、夫婦杉、大王杉、舞う妖精／4 最高地点：縄文杉と展望デッキ、彼方に宮之浦岳／
// 5 苔の下り坂：大川の滝、ヤクザルの群れ、紀元杉／6 光るきのこの谷：倒木に灯るシイノトモシビタケと観察会、永田いなか浜のウミガメの上陸と屋久島灯台。
// 内馬場は妖精の輪（きのこの輪）に囲まれた月光の大きのこと、妖精のきのこの家（ファンタジー）
function decorMoonForest() {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const { shuffle, roadDist, occupied, taken, clearAt, groundAt, onGround, local, at, label, site, PRISM, CYL, CYL_T, addInst, beam, route } = sceneryKit();
  const n0 = world.children.length, updates = [];
  // 案内板は苔の深緑の地に、生成りの文字（屋久島の登山道の木の道標に似せる）
  const signAt = (g, text, y, w = 14) => { const sp = label(text, w, w / 4, '#25402c', '#eaf3cf'); sp.position.set(0, y, 0); sp.scale.set(w, w / 4, 1); g.add(sp); return sp; };
  const pick = a => a[(Math.random() * a.length) | 0];
  const yawAt = s => -tp(s, W / 2).h;
  const bark = toon('#6e4c3a'), barkDark = toon('#4b3428'), leaf = toon('#2e5c46'), leafDeep = toon('#244a3a'), moss = toon('#4f8a4c'), mossLight = toon('#6aa257');
  const granite = toon('#8f8e88'), wood = toon('#8a6244'), darkWood = toon('#3e2f26'), steel = toon('#5f6470'), sandM = toon('#c9bb98');
  const warm = toon('#ffd27a', { emissive: C('#ffb347'), emissiveIntensity: 1.1 });   // 窓明かり
  const HALF = new THREE.SphereGeometry(1, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);
  const coneG = new THREE.ConeGeometry(1, 1, 8); coneG.translate(0, 0.5, 0);
  let celebration = 0;

  // 型の部品を、向き yaw・倍率 sc で置いた群れにまとめて描く（ヤクシカ・ヤクザルなど）
  const stamp = (tpl, spots, shadow = true) => {
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
  // ヤクシカ（局所 +x が前）：本土の鹿より小さく、茶色の体に白いお尻。牡鹿は短い角
  const deerTpl = antler => {
    const g = new THREE.Group(), body = toon('#8a5a3a'), pale = toon('#efe6d6'), dark = toon('#3e2c22');
    part(g, SPH_LO, body, [0, 0.85, 0], [0.62, 0.3, 0.25], null, 0); part(g, SPH_LO, pale, [-0.55, 0.88, 0], [0.12, 0.2, 0.18], null, 0);
    part(g, SPH_LO, body, [0.52, 1.12, 0], [0.16, 0.3, 0.14], [0, 0, -0.5], 0); part(g, SPH_LO, body, [0.72, 1.36, 0], [0.22, 0.13, 0.12], null, 0);
    for (const z of [-0.08, 0.08]) part(g, CONE, body, [0.62, 1.52, z * 1.6], [0.05, 0.14, 0.04], null, 0);
    for (const [x, z] of [[0.38, 0.12], [0.38, -0.12], [-0.38, 0.12], [-0.38, -0.12]]) part(g, CYL, dark, [x, 0.36, z], [0.04, 0.72, 0.04], null, 0);
    if (antler) for (const z of [-0.07, 0.07]) { part(g, BOX, toon('#d8c8a4'), [0.66, 1.66, z], [0.04, 0.34, 0.04], [z * 4, 0, -0.3], 0); part(g, BOX, toon('#d8c8a4'), [0.74, 1.66, z * 1.6], [0.03, 0.18, 0.03], [0, 0, -0.9], 0); }
    return g;
  };
  // ヤクザル：灰褐色の毛に赤い顔。座って毛づくろいをする
  const monkeyTpl = () => {
    const g = new THREE.Group(), fur = toon('#7d7266'), face = toon('#d9776a');
    part(g, SPH_LO, fur, [0, 0.42, 0], [0.32, 0.4, 0.3], null, 0); part(g, SPH_LO, fur, [0.1, 0.92, 0], [0.22, 0.21, 0.21], null, 0);
    part(g, SPH_LO, face, [0.28, 0.9, 0], [0.06, 0.13, 0.13], null, 0);
    for (const z of [-0.2, 0.2]) { part(g, SPH_LO, fur, [0.22, 0.2, z], [0.22, 0.12, 0.1], null, 0); part(g, SPH_LO, fur, [0.2, 0.55, z * 1.1], [0.08, 0.24, 0.08], [0, 0, -0.6], 0); }
    return g;
  };
  // アカウミガメ：甲羅と頭、前のひれ（浜に上がってくる）
  const turtle = () => {
    const g = fantasyGroup(); g.userData.droneIgnore = true; g.scale.setScalar(1.6);
    part(g, HALF, toon('#6a5238'), [0, 0.05, 0], [1.1, 0.42, 0.88], null, 0.02); part(g, SPH_LO, toon('#8a7a5e'), [1.15, 0.2, 0], [0.32, 0.22, 0.26], null, 0);
    const fl = [-1, 1].map(sd => { const f = new THREE.Group(); f.position.set(0.5, 0.1, sd * 0.75); g.add(f); addBox(f, [0.5, 0.06, 0.9], [0, 0, sd * 0.35], toon('#7a6a50'), [0, sd * 0.4, 0]); return f; });
    for (const sd of [-1, 1]) addBox(g, [0.4, 0.05, 0.5], [-0.8, 0.06, sd * 0.55], toon('#7a6a50'), [0, -sd * 0.5, 0]);
    return { g, fl };
  };

  // 登山者：レインウェアにザックとヘッドランプ（立っている人・座っている人）
  const people = [], heads = [], hats = [], packs = [], rain = ['#e4483a', '#2f6fb0', '#f2c230', '#3a9a5a', '#ff8a3a', '#7a4fa8', '#1f2a44', '#3fb7c8', '#e85a8a', '#f4f1ea'].map(C);
  const addPerson = (p, sit = false, col) => {
    const c = col ? C(col) : pick(rain);
    people.push({ p: p.clone().add(new V3(0, sit ? 0.55 : 0.95, 0)), s: new V3(1.12, sit ? 0.62 : 1, 1.12), c });
    heads.push({ p: p.clone().add(new V3(0, sit ? 1.3 : 1.95, 0)), s: new V3(0.26, 0.28, 0.26) });
    hats.push({ p: p.clone().add(new V3(0, sit ? 1.44 : 2.09, 0)), s: new V3(0.3, 0.16, 0.3), c: pick(rain) });
    if (!sit) packs.push({ p: p.clone().add(new V3(rand(-0.25, 0.25), 1.3, rand(-0.25, 0.25))), s: new V3(0.3, 0.42, 0.3), c: pick(rain) });
  };
  // 動く人（群れとは別に、ひとりずつ）。ヘッドランプが光る
  const figure = (g, x, y, z, col, sc = 1) => {
    part(g, new THREE.CapsuleGeometry(0.3 * sc, 0.75 * sc, 3, 8), toon(col), [x, y + 0.95 * sc, z], null, null, 0.03);
    part(g, SPH_LO, toon('#e9c4a4'), [x, y + 1.95 * sc, z], [0.26 * sc, 0.28 * sc, 0.26 * sc], null, 0);
    part(g, SPH_LO, toon(pick(['#e4483a', '#f2c230', '#2f6fb0'])), [x, y + 2.09 * sc, z], [0.3 * sc, 0.16 * sc, 0.3 * sc], null, 0);
    part(g, SPH_LO, glowMat('#fff6d0', 2.6), [x + 0.27 * sc, y + 2.02 * sc, z], [0.06 * sc, 0.06 * sc, 0.06 * sc], null, 0);
  };

  /* ---- 森の木々と、きのこ：まとめてインスタンスで描く。低画質では前半だけ描くので、木ごとに部品をそろえてシャッフルする ---- */
  // 屋久杉の森の杉（とがった樹冠を重ねる）・照葉樹（スダジイなどの丸い樹冠）・海辺のヘゴ（木生シダ）
  const sugis = [], broads = [], ferns = [];
  const addSugi = (p, sc) => {
    const t = { trunk: { p: p.clone().add(new V3(0, 3 * sc, 0)), s: new V3(0.5 * sc, 6 * sc, 0.5 * sc) }, crowns: [] };
    for (const [r, h, y] of [[2.6, 4.2, 3.2], [2.1, 3.8, 5.6], [1.4, 3.4, 8]]) t.crowns.push({ p: p.clone().add(new V3(rand(-0.2, 0.2), y * sc, rand(-0.2, 0.2))), s: new V3(r * sc, h * sc, r * sc), r: [0, rand(0, 3), 0], c: C(pick(['#2c5a45', '#28513f', '#33664c', '#2f5a4a'])) });
    sugis.push(t);
  };
  const addBroad = (p, sc) => {
    const t = { trunk: { p: p.clone().add(new V3(0, 1.6 * sc, 0)), s: new V3(0.35 * sc, 3.2 * sc, 0.35 * sc) }, clumps: [] };
    for (let k = 0; k < 3; k++) { const a = k * 2.1 + rand(0, 1); t.clumps.push({ p: p.clone().add(new V3(Math.cos(a) * 1.2 * sc, (3.6 + rand(0, 1.2)) * sc, Math.sin(a) * 1.2 * sc)), s: new V3(2.2 * sc, 1.7 * sc, 2.2 * sc), c: C(pick(['#3d6b45', '#46774a', '#36603f', '#4f7f4a'])) }); }
    broads.push(t);
  };
  const addFern = (p, sc) => {
    const h = rand(3, 5) * sc, t = { trunk: { p: p.clone().add(new V3(0, h / 2, 0)), s: new V3(0.22 * sc, h, 0.22 * sc) }, fronds: [] };
    for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2 + rand(-0.2, 0.2); t.fronds.push({ p: p.clone().add(new V3(Math.cos(a) * 1.3 * sc, h - 0.3 * sc, Math.sin(a) * 1.3 * sc)), s: new V3(2.8 * sc, 0.06, 0.6 * sc), r: [0, -a, -0.45] }); }
    ferns.push(t);
  };
  // 森のきのこ（ファンタジー）：背の高い柄にかさ。かさの裏のひだと、かさの水玉が光る
  const shrooms = [];
  const capCols = ['#8f7bff', '#4fd2cc', '#74dc8a', '#ff8fd2', '#6fb0ff', '#b48cff'].map(C);
  const addShroom = (p, h, r, tilt = 0) => {
    const a = rand(0, Math.PI * 2), lean = new V3(Math.cos(a) * tilt * h, 0, Math.sin(a) * tilt * h), top = p.clone().add(new V3(0, h, 0)).add(lean);
    const t = { stem: beam(p, top, 1), cap: { p: top.clone(), s: new V3(r, r * rand(0.45, 0.65), r), r: [0, rand(0, 3), 0], c: pick(capCols) }, gill: { p: top.clone().add(new V3(0, -0.05, 0)), s: new V3(r * 0.92, 1, r * 0.92) }, dots: [] };
    // 柄の太さはかさに合わせる（beam は局所 x 方向へ伸ばすので、太さは y・z に入れる）
    t.stem.s.set(t.stem.s.x, 0.12 * r + 0.2, 0.12 * r + 0.2);
    for (let k = 0; k < 5; k++) { const b = rand(0, Math.PI * 2), q = rand(0.25, 0.8); t.dots.push({ p: top.clone().add(new V3(Math.cos(b) * r * q, r * 0.55 * Math.sqrt(1 - q * q) * 0.95, Math.sin(b) * r * q)), s: new V3(0.12 * r, 0.06 * r, 0.12 * r) }); }
    shrooms.push(t);
  };
  // シイノトモシビタケ：倒木や切り株、木の根元に群れて生える、緑に光る小さなきのこ
  const glowCaps = [], glowStems = [];
  const glowCluster = (p, n = 7, spread = 0.6, lift = 0) => {
    for (let k = 0; k < n; k++) {
      const q = p.clone().add(new V3(rand(-spread, spread), lift + rand(0, 0.15), rand(-spread, spread))), r = rand(0.1, 0.24);
      glowStems.push({ p: q.clone().add(new V3(0, r * 0.4, 0)), s: new V3(r * 0.18, r * 0.8, r * 0.18) }); glowCaps.push({ p: q.clone().add(new V3(0, r * 0.8, 0)), s: new V3(r, r * 0.5, r) });
    }
  };
  // 苔むした岩・倒木
  const boulders = [], logs = [], logMoss = [];
  const addBoulder = (p, r) => boulders.push({ p: p.clone().add(new V3(0, r * 0.25, 0)), s: new V3(r, r * rand(0.55, 0.8), r * rand(0.8, 1.1)), r: [0, rand(0, 3), 0], c: C(pick(['#4f8a4c', '#5c964f', '#457d48', '#6aa257', '#3f7444'])) });
  const addLog = (p, len, yaw, glow = true) => {
    const r = rand(0.45, 0.75), d = new V3(Math.cos(yaw), 0, -Math.sin(yaw));
    logs.push({ p: p.clone().add(new V3(0, r, 0)), s: new V3(r, len, r), r: [0, yaw, Math.PI / 2] });
    for (let k = 0; k < 4; k++) logMoss.push({ p: p.clone().addScaledVector(d, rand(-len / 2.4, len / 2.4)).add(new V3(0, r * 1.75, 0)), s: new V3(rand(0.6, 1.1), 0.25, rand(0.5, 0.7)), r: [0, yaw, 0] });
    if (glow) for (let k = 0; k < 3; k++) glowCluster(p.clone().addScaledVector(d, rand(-len / 2.4, len / 2.4)).add(new V3(0, r * 1.9, 0)), rand(4, 8), 0.35);
  };
  // 文字入りの板。同じ文字は1枚の材質を共有する
  const boardMats = new Map(), boardLists = new Map();
  const putBoard = (text, c, yaw, w) => {
    if (!boardMats.has(text)) {
      boardMats.set(text, toon('#ffffff', { map: ctex(512, 128, g => {
        g.fillStyle = '#4a3326'; g.fillRect(0, 0, 512, 128); g.strokeStyle = '#c9b27a'; g.lineWidth = 8; g.strokeRect(6, 6, 500, 116);
        g.fillStyle = '#fff6e4'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = '900 60px "Dela Gothic One", sans-serif'; g.fillText(text, 256, 68, 470);
      }) }));
      boardLists.set(text, []);
    }
    boardLists.get(text).push({ p: c.clone(), s: new V3(w, w / 4, 1), r: [0, yaw, 0] });
  };
  // 地面に沿う、テクスチャを貼れる帯（渓流・トロッコの線路・浜）。u は幅方向、v は長さ方向（vScale mごとに1回）
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
  // 走路から外へ V の道筋（渓流・線路・浜）。両端は ext 本（10mずつ）走路から遠ざかる向きへ伸ばして均す
  const outerPath = (s0, s1, V, ext = 40, step = 6) => {
    const pts = []; for (let s = s0; s <= s1; s += step) pts.push(local(s, 0, V));
    const head = pts[0], d0 = head.clone().sub(pts[1]).setY(0).normalize(), tail = pts[pts.length - 1], d1 = tail.clone().sub(pts[pts.length - 2]).setY(0).normalize();
    const f0 = tp(s0, W / 2).n.multiplyScalar(Math.sign(V)), f1 = tp(s1, W / 2).n.multiplyScalar(Math.sign(V));
    for (let k = 1; k <= ext; k++) pts.unshift(head.clone().addScaledVector(d0.clone().lerp(f0, Math.min(1, k / 20)).normalize(), k * 10));
    for (let k = 1; k <= ext; k++) pts.push(tail.clone().addScaledVector(d1.clone().lerp(f1, Math.min(1, k / 20)).normalize(), k * 10));
    for (let pass = 0; pass < 10; pass++) for (let i = 1; i < pts.length - 1; i++) pts[i] = pts[i - 1].clone().add(pts[i + 1]).multiplyScalar(0.5).lerp(pts[i], 0.5);
    return pts;
  };
  // 流れる水のテクスチャ（渓流・滝・海）
  const waterTex = (base, foam, streak) => ctex(128, 256, g => {
    g.fillStyle = base; g.fillRect(0, 0, 128, 256);
    for (let i = 0; i < 60; i++) { g.fillStyle = foam.replace('A', rand(0.12, 0.4).toFixed(2)); g.beginPath(); g.ellipse(rand(0, 128), rand(0, 256), rand(2, 7) * (streak ? 0.4 : 1), rand(6, 22) * (streak ? 2.2 : 1), 0, 0, Math.PI * 2); g.fill(); }
  }, true);
  const flows = [];   // 毎フレーム流すテクスチャ：[tex, 速さ]
  const mists = [], sparkles = [];   // しぶき・きらめきの出どころ

  /* ---- 座標の準備：内馬場の判定、区間の案内板とスタンドの敷地は空けておく ---- */
  const poly = []; for (let i = 0; i < track.N; i += 8) poly.push([track.xs[i], track.zs[i]]);
  const inPoly = (pl, x, z) => { let c = false; for (let i = 0, j = pl.length - 1; i < pl.length; j = i++) { const [xi, zi] = pl[i], [xj, zj] = pl[j]; if ((zi > z) !== (zj > z) && x < (xj - xi) * (z - zi) / (zj - zi) + xi) c = !c; } return c; };
  const inLoop = (x, z) => inPoly(poly, x, z);
  for (const z of track.zones) { const q = tp((z.start + z.end) / 2, W + 9).v; occupied.push({ x: q.x, z: q.z, r: 11 }); }
  for (let s = track.homeS0 - 10; s <= track.homeS1 + 10; s += 10) { const p = local(s, 0, W / 2 + 30); occupied.push({ x: p.x, z: p.z, r: 23 }); }
  occupied.push({ x: boardPos.x, z: boardPos.z, r: 24 });
  // 海（第6区間の外）の輪郭：波打ち際は走路から96m、沖は700m
  const seaShore = []; for (let s = at(5, 0.75); s <= at(6, 1) + 30; s += 8) seaShore.push(local(s, 0, W / 2 + 96));
  const seaFar = []; for (let s = at(6, 1) + 30; s >= at(5, 0.75); s -= 8) seaFar.push(local(s, 0, W / 2 + 700));
  const seaPts = seaShore.concat(seaFar), seaPoly = seaPts.map(p => [p.x, p.z]);
  const onSea = (x, z) => inPoly(seaPoly, x, z);

  /* ---- 外ラチ沿い：杉の丸太の柵ときのこの灯り、苔むす岩、手を振る登山者（トロッコ道、縄文杉、光るきのこの谷） ---- */
  const lampCaps = [];
  {
    const posts = [], rails = [], lampStems = [];
    let prev = null;
    for (let s = 0; s < track.L; s += 5) {
      if (s > track.homeS0 - 4 && s < track.homeS1 + 4) { prev = null; continue; }   // ホーム直線はスタンド
      const p = onGround(local(s, 0, W / 2 + 3.2));
      if (taken(p.x, p.z, 0.8)) { prev = null; continue; }
      posts.push({ p: p.clone().add(new V3(0, 0.55, 0)), s: new V3(0.16, 1.1, 0.16) });
      if (prev) rails.push(beam(prev.clone().add(new V3(0, 0.9, 0)), p.clone().add(new V3(0, 0.9, 0)), 0.14));
      prev = p;
      if (Math.round(s / 5) % 3 === 0) {
        // きのこの灯り：柵の外に、背丈ほどの光るきのこ
        const q = onGround(local(s + 2.5, 0, W / 2 + 4.6));
        lampStems.push({ p: q.clone().add(new V3(0, 0.6, 0)), s: new V3(0.1, 1.2, 0.1) }); lampCaps.push({ p: q.clone().add(new V3(0, 1.15, 0)), s: new V3(0.45, 0.3, 0.45), c: pick(capCols) });
        glowCluster(q, 3, 0.5);
      }
    }
    addInst(CYL, wood, posts, false); addInst(BOX, wood, rails, false); addInst(CYL, toon('#e8e2f2'), lampStems, false);
    const crowdAt = (s0, s1, n) => {
      for (let k = 0; k < n; k++) {
        const p = onGround(local(rand(s0, s1), 0, W / 2 + rand(6, 10)));
        if (taken(p.x, p.z, 0.4)) continue;
        addPerson(p); occupied.push({ x: p.x, z: p.z, r: 0.6 });
      }
      for (let s = s0; s < s1; s += 9) { const p = local(s, 0, W / 2 + 7.5); occupied.push({ x: p.x, z: p.z, r: 4 }); }
    };
    crowdAt(at(1, 0.05), at(1, 0.22), 30); crowdAt(at(4, 0.2), at(4, 0.42), 30); crowdAt(at(6, 0.6), at(6, 0.95), 45);
  }

  /* ---- 遠景：花崗岩の峰が連なる「洋上アルプス」。いちばん奥に九州最高峰の宮之浦岳。海の側は水平線 ---- */
  {
    const base = Math.max(620, track.extent + 320), domes = [], rocks = [], peaks = [];
    const seaDir = tp(at(6, 0.45), W / 2).n;
    for (let i = 0; i < 24; i++) {
      const a = i / 24 * Math.PI * 2 + rand(-0.08, 0.08), d = new V3(Math.cos(a), 0, Math.sin(a));
      if (d.dot(seaDir) > 0.45) continue;   // 海の側は開けておく
      const r = base + rand(0, 240), p = new V3(d.x * r, -14, d.z * r), rr = rand(150, 240), h = rand(90, 170);
      domes.push({ p, s: new V3(rr, h, rr), c: C(pick(['#2f5a48', '#2a5242', '#355f4a'])) });
      // 稜線の花崗岩の岩峰（トウフ岩のような巨岩）
      for (let k = 0; k < 3; k++) { const b = rand(0, Math.PI * 2), q = rand(0, 0.35); rocks.push({ p: new V3(p.x + Math.cos(b) * rr * q, p.y + h * Math.sqrt(1 - q * q) - 6, p.z + Math.sin(b) * rr * q), s: new V3(rand(14, 26), rand(10, 22), rand(14, 26)), r: [0, rand(0, 3), 0] }); }
    }
    // 宮之浦岳・永田岳・黒味岳：縄文杉（第4区間）の向こう
    const dir4 = tp(at(4, 0.5), W / 2).n;
    for (const [off, rr, h] of [[0, 230, 270], [-0.32, 170, 210], [0.3, 160, 190]]) {
      const d = dir4.clone().applyAxisAngle(new V3(0, 1, 0), off), p = d.multiplyScalar(base + 300).setY(-20);
      peaks.push({ p, s: new V3(rr, h, rr), r: [0, rand(0, 3), 0] });
      for (let k = 0; k < 4; k++) rocks.push({ p: p.clone().add(new V3(rand(-30, 30), h * rand(0.75, 0.95), rand(-30, 30))), s: new V3(rand(18, 30), rand(14, 26), rand(18, 30)), r: [0, rand(0, 3), 0] });
    }
    for (const m of [
      inst(SPH_LO, toon('#ffffff', { fog: true }), domes, false), inst(SPH_LO, toon('#9a9a96', { fog: true }), rocks, false),
      inst(coneG, toon('#2c5244', { fog: true }), peaks, false)
    ]) m.userData.backdrop = true;
  }

  /* ---- 第1区間の外：安房森林軌道のトロッコ道。屋久杉の丸太を運ぶトロッコ、縄文杉へ歩く登山者、小杉谷の集落跡 ---- */
  const railPts = outerPath(at(1, 0.02), at(1, 0.95), W / 2 + 40, 14, 5);
  {
    railPts.forEach(p => { onGround(p); occupied.push({ x: p.x, z: p.z, r: 4 }); });
    const sleeperTex = ctex(64, 128, g => { g.fillStyle = '#5d5a4e'; g.fillRect(0, 0, 64, 128); for (let y = 4; y < 128; y += 16) { g.fillStyle = '#6b4a33'; g.fillRect(4, y, 56, 8); } g.fillStyle = '#b9bcc2'; g.fillRect(20, 0, 3, 128); g.fillRect(41, 0, 3, 128); }, true);
    ribbon(railPts, 2.6, 0.12, toon('#ffffff', { map: sleeperTex, side: THREE.DoubleSide }), 4, W / 2 + 12);
    // 歩道の板（登山者は線路の脇の板の上を歩く）
    const walkPts = railPts.map((p, i) => { const q = railPts[Math.min(railPts.length - 1, i + 1)], d = q.clone().sub(railPts[Math.max(0, i - 1)]).setY(0).normalize(); return onGround(p.clone().add(new V3(-d.z * 2.3, 0, d.x * 2.3))); });
    ribbon(walkPts, 1.4, 0.14, toon('#9a7a58', { side: THREE.DoubleSide }), 2, W / 2 + 12);
    const r = route(railPts, false), cars = [];
    // トロッコ：小さなディーゼル機関車と、屋久杉の丸太を積んだ台車
    const car = loco => {
      const g = fantasyGroup(); g.userData.droneIgnore = true;
      if (loco) {
        addBox(g, [3.4, 1.4, 1.5], [0, 1.0, 0], toon('#c8402e'), null, 0.02); addBox(g, [1.4, 1.1, 1.5], [-0.9, 2.2, 0], toon('#c8402e'), null, 0.02);
        addBox(g, [1.42, 0.5, 1.52], [-0.9, 2.3, 0], toon('#bfe0f2')); addBox(g, [1.7, 0.15, 1.7], [-0.9, 2.82, 0], toon('#3a3434'));
        addBox(g, [0.2, 0.2, 0.2], [1.75, 1.1, 0], glowMat('#fff2c0', 3));
      } else {
        addBox(g, [3.2, 0.3, 1.4], [0, 0.7, 0], darkWood);
        for (const z of [-0.45, 0, 0.45]) part(g, CYL, toon('#a57a56'), [0, 1.2, z], [0.32, 3.1, 0.32], [0, 0, Math.PI / 2], 0.02);
        part(g, CYL, toon('#8a6244'), [0, 1.75, 0], [0.34, 3.1, 0.34], [0, 0, Math.PI / 2], 0.02);
      }
      for (const x of [-1, 1]) for (const z of [-0.55, 0.55]) part(g, CYL, toon('#222428'), [x, 0.35, z], [0.3, 0.12, 0.3], [Math.PI / 2, 0, 0], 0);
      return g;
    };
    for (let i = 0; i < 6; i++) cars.push({ g: car(i === 0), off: i * 3.8 });
    updates.push(t => {
      const m = reduced.matches ? 30 : t, span = r.L - 30, k = mod(m * 4.5, span * 2), back = k > span, head = (back ? span * 2 - k : k) + 15;
      for (const c of cars) {
        const u = head + (back ? c.off : -c.off), a = r.at(u - 1.5).p.clone(), b = r.at(u + 1.5).p.clone(), p = a.clone().lerp(b, 0.5);
        c.g.position.set(p.x, p.y + 0.15, p.z); c.g.rotation.set(0, -Math.atan2(b.z - a.z, b.x - a.x) + (back ? Math.PI : 0), 0);
      }
    });
    registerLandmark(fantasyGroup(railPts[(railPts.length / 2) | 0].clone()), '安房森林軌道（トロッコ道）');
    // 縄文杉へ歩く登山者：ヘッドランプをつけて歩道の板の上を行き来する
    const wr = route(walkPts, false), walkers = [];
    for (let i = 0; i < 7; i++) {
      const g = fantasyGroup(); g.userData.droneIgnore = true; figure(g, 0, 0, 0, pick(['#e4483a', '#2f6fb0', '#f2c230', '#3a9a5a', '#7a4fa8']));
      addBox(g, [0.35, 0.55, 0.5], [-0.32, 1.4, 0], toon(pick(['#2f6fb0', '#e4483a', '#3a9a5a'])));
      walkers.push({ g, off: rand(0, wr.L * 2), v: rand(0.9, 1.3) });
    }
    updates.push(t => {
      const m = reduced.matches ? 0 : t, span = wr.L - 40;
      for (const w of walkers) {
        const k = mod(m * w.v + w.off, span * 2), back = k > span, { p, yaw } = wr.at((back ? span * 2 - k : k) + 20);
        w.g.position.set(p.x, p.y + 0.15 + Math.abs(Math.sin(m * 5 + w.off)) * 0.08, p.z); w.g.rotation.y = yaw + (back ? Math.PI : 0);
      }
    });
    // 小杉谷の集落跡：林業の村の小・中学校の石の門柱と石段
    const g = site('小杉谷の集落跡', at(1, 0.55), W / 2 + 60, 16, 12, '#4f6e48', W / 2 + 50);
    for (const x of [-2.4, 2.4]) { addBox(g, [1, 2.6, 1], [x, 1.3, -3], granite, null, 0.02); addBox(g, [1.2, 0.3, 1.2], [x, 2.75, -3], granite); }
    for (let k = 0; k < 5; k++) addBox(g, [4, 0.3, 1], [0, 0.15 + k * 0.3, -1.5 + k], granite);
    for (let x = -6; x <= 6; x += 1.5) addBox(g, [1.4, 0.9, 1], [x, 0.45, 4], x % 3 ? granite : moss);
    for (let k = 0; k < 6; k++) addBoulder(g.localToWorld(new V3(rand(-7, 7), 0, rand(-5, 5))), rand(0.6, 1.2));
    signAt(g, '小杉谷の集落跡', 7, 10);
  }

  /* ---- 第2区間：苔むす森の上り。白谷雲水峡の渓流と飛び石、さつき吊橋、弥生杉、丘の上の太鼓岩、ヤクシカ ---- */
  // 屋久杉（樹齢千年を超える杉）：太い幹にこぶ、根元に張り出す根、苔、横に広がる樹冠
  const bigCedar = (g, x, z, sc, crown = 1) => {
    const h = 13 * sc; g.updateMatrixWorld(true);
    part(g, CYL_T, bark, [x, h / 2, z], [2.1 * sc, h, 2.1 * sc], null, 0.02);
    for (let k = 0; k < 7; k++) { const a = k / 7 * Math.PI * 2 + rand(-0.2, 0.2); part(g, BOX, bark, [x + Math.cos(a) * 2 * sc, 0.7 * sc, z + Math.sin(a) * 2 * sc], [2.8 * sc, 1.3 * sc, 0.8 * sc], [0, -a, -0.45], 0.02); }
    for (let k = 0; k < 8; k++) { const a = rand(0, Math.PI * 2), y = rand(1.5, h * 0.85); part(g, SPH_LO, k % 3 ? barkDark : moss, [x + Math.cos(a) * 1.8 * sc * (1 - y / h * 0.3), y, z + Math.sin(a) * 1.8 * sc * (1 - y / h * 0.3)], [0.8 * sc, 1 * sc, 0.8 * sc], null, 0); }
    // 上で何本にも分かれる太い枝と、平たく広がる樹冠
    for (let k = 0; k < 4; k++) {
      const a = k * 1.6 + rand(0, 0.6), tip = new V3(x + Math.cos(a) * 4.5 * sc, h + rand(2, 4) * sc, z + Math.sin(a) * 4.5 * sc), bm = beam(new V3(x, h - 1 * sc, z), tip, 0.55 * sc);
      part(g, BOX, bark, [bm.p.x, bm.p.y, bm.p.z], [bm.s.x, bm.s.y, bm.s.z], bm.r, 0);
      part(g, SPH_LO, k % 2 ? leaf : leafDeep, [tip.x, tip.y + 1.2 * sc, tip.z], [3.4 * sc * crown, 2.8 * sc, 3.4 * sc * crown], null, 0.02);
      part(g, SPH_LO, k % 2 ? leafDeep : leaf, [tip.x * 0.6 + x * 0.4, tip.y + 2.6 * sc, tip.z * 0.6 + z * 0.4], [2.4 * sc * crown, 2.2 * sc, 2.4 * sc * crown], null, 0.02);
    }
    part(g, SPH_LO, leaf, [x, h + 5.5 * sc, z], [3.6 * sc * crown, 3.2 * sc, 3.6 * sc * crown], null, 0.02);
    glowCluster(g.localToWorld(new V3(x + 2.4 * sc, 0, z)), 8, 0.6);
  };
  const deer = [];
  {
    // 白谷川：苔むす岩の間を流れる渓流
    const pts = [];
    for (let k = 0; k <= 60; k++) { const u = k / 60; pts.push(onGround(local(lerp(at(2, 0.25), at(2, 0.62), u) + Math.sin(u * Math.PI * 3) * 10, 0, lerp(W / 2 + 260, W / 2 + 6, u)))); }
    pts.forEach(p => occupied.push({ x: p.x, z: p.z, r: 7 }));
    ribbon(pts, 14, 0.06, toon('#3d5a46', { side: THREE.DoubleSide }), 20, W / 2 + 12);
    const tex = waterTex('#2a6474', 'rgba(210,250,245,A)', true); flows.push([tex, 0.35]);
    ribbon(pts, 9, 0.14, toon('#ffffff', { map: tex, emissive: C('#123c48'), emissiveIntensity: 0.4, side: THREE.DoubleSide }), 14, W / 2 + 14);
    // 川の中と岸の苔むした岩、飛び石
    for (let i = 2; i < pts.length - 6; i += 2) {
      const p = pts[i], q = pts[i + 1], d = q.clone().sub(p).setY(0).normalize(), nx = -d.z, nz = d.x;
      for (const sd of [-1, 1]) if (Math.random() < 0.7) addBoulder(onGround(p.clone().add(new V3(nx * sd * rand(5, 8), 0, nz * sd * rand(5, 8)))), rand(0.8, 2.2));
      if (Math.random() < 0.35) addBoulder(p.clone().add(new V3(nx * rand(-3, 3), 0, nz * rand(-3, 3))), rand(0.5, 1));
    }
    const mid = 34, sp = pts[mid], sd2 = pts[mid + 1].clone().sub(sp).setY(0).normalize(), sn = new V3(-sd2.z, 0, sd2.x);
    for (let k = -4; k <= 4; k++) { const p = sp.clone().addScaledVector(sn, k * 1.6); addBoulder(p, 0.55); }
    registerLandmark(fantasyGroup(sp.clone()), '白谷雲水峡の渓流');
    // さつき吊橋：渓流をまたぐ吊橋（両岸の塔から床をワイヤーで吊る）
    const bp = pts[mid - 14], bd = pts[mid - 13].clone().sub(bp).setY(0).normalize(), bn = new V3(-bd.z, 0, bd.x), bridge = [];
    const A = bp.clone().addScaledVector(bn, -9).setY(bp.y + 2.4), B = bp.clone().addScaledVector(bn, 9).setY(bp.y + 2.4);
    for (const sd of [-0.8, 0.8]) {
      const a = A.clone().addScaledVector(bd, sd), b = B.clone().addScaledVector(bd, sd);
      bridge.push(beam(a, b, 0.08), beam(a.clone().add(new V3(0, 1.1, 0)), b.clone().add(new V3(0, 1.1, 0)), 0.06));
      for (const e of [a, b]) bridge.push({ p: e.clone().add(new V3(0, 0.2, 0)), s: new V3(0.3, 4.8, 0.3) });
    }
    const deck = beam(A, B, 0.15); deck.s.set(deck.s.x, 0.15, 1.6); bridge.push(deck);
    addInst(BOX, wood, bridge, false);
    { const g = registerLandmark(fantasyGroup(bp.clone().setY(bp.y + 2.4)), 'さつき吊橋'); signAt(g, 'さつき吊橋', 5.5, 9); }
    // 弥生杉：渓流の向こうの屋久杉
    const yc = onGround(local(at(2, 0.3), 0, W / 2 + 84)), yg = registerLandmark(fantasyGroup(yc), '弥生杉');
    bigCedar(yg, 0, 0, 1.0); signAt(yg, '弥生杉', 24, 7);
    occupied.push({ x: yc.x, z: yc.z, r: 10 });
    // 太鼓岩：丘の上に突き出した花崗岩の巨岩。てっぺんで登山者が手を振る
    const tc = onGround(local(at(2, 0.72), 0, W / 2 + 120)), tg = registerLandmark(fantasyGroup(tc), '太鼓岩');
    part(tg, HALF, leafDeep, [0, -2, 0], [30, 18, 26], null, 0.02);
    part(tg, SPH_LO, granite, [2, 17, 0], [9, 6, 7], [0, 0, 0.25], 0.02); part(tg, SPH_LO, toon('#a5a39c'), [-4, 15.5, 2], [6, 4, 5], [0, 0.5, 0], 0.02);
    for (let k = 0; k < 4; k++) figure(tg, rand(-1, 5), 21.5, rand(-2, 2), pick(['#e4483a', '#f2c230', '#2f6fb0']));
    signAt(tg, '太鼓岩', 30, 7);
    occupied.push({ x: tc.x, z: tc.z, r: 28 });
    // ヤクシカの群れ
    for (let k = 0; k < 9; k++) { const p = onGround(local(rand(at(2, 0.1), at(2, 0.9)), 0, W / 2 + rand(14, 34))); if (!taken(p.x, p.z, 1.5)) { deer.push({ p, yaw: rand(0, Math.PI * 2), sc: rand(0.9, 1.1), antler: k % 3 === 0 }); occupied.push({ x: p.x, z: p.z, r: 1.5 }); } }
  }

  /* ---- 第3区間：妖精の木漏れ日。ウィルソン株、夫婦杉、大王杉。月の光が木の間から差し、妖精が舞う ---- */
  let heart = null;
  {
    // ウィルソン株：豊臣秀吉の命で切られたといわれる大きな切り株。中は空洞で、湧き水と祠がある
    const g = site('ウィルソン株', at(3, 0.35), W / 2 + 32, 22, 22, '#3f6a44', W / 2 + 22);
    const n = 16, R0 = 6;
    for (let k = 0; k < n; k++) {
      const a = k / n * Math.PI * 2, h = 6 + Math.sin(k * 2.3) * 1.6 + rand(-0.5, 0.5);
      if (k === 12) continue;   // 走路側に入口のすき間
      part(g, BOX, k % 2 ? bark : barkDark, [Math.cos(a) * R0, h / 2, Math.sin(a) * R0], [2.6, h, 1.4], [0, -a + Math.PI / 2, 0], 0.02);
      part(g, SPH_LO, moss, [Math.cos(a) * R0, h + 0.1, Math.sin(a) * R0], [1.4, 0.4, 0.9], [0, -a + Math.PI / 2, 0], 0);
      part(g, BOX, bark, [Math.cos(a) * (R0 + 1.4), 0.6, Math.sin(a) * (R0 + 1.4)], [2.2, 1.2, 1], [0, -a, -0.4], 0);
    }
    part(g, new THREE.CircleGeometry(R0 - 0.6, 24).rotateX(-Math.PI / 2), toon('#2a3a2c'), [0, 0.05, 0], null, null, 0);
    // 祠と湧き水
    addBox(g, [1.4, 1.2, 1], [0, 0.6, 3], toon('#b5a27e'), null, 0.02); part(g, PRISM, darkWood, [0, 1.2, 3], [1.8, 0.6, 1.4], null, 0);
    part(g, new THREE.CircleGeometry(1.4, 18).rotateX(-Math.PI / 2), glowMat('#5fd6d0', 1.4), [-2.5, 0.08, 1.5], null, null, 0);
    for (let k = 0; k < 5; k++) glowCluster(g.localToWorld(new V3(Math.cos(k * 1.3) * 4.4, 0.2, Math.sin(k * 1.3) * 4.4)), 6, 0.5);
    // ハート：株の中から見上げると、切り口の空がハートの形に見える。上から光るハートで見せる
    const hs = new THREE.Shape(); hs.moveTo(0, -1); hs.bezierCurveTo(-0.3, -0.7, -1.2, -0.2, -1.1, 0.35); hs.bezierCurveTo(-1, 0.85, -0.35, 1.0, 0, 0.55); hs.bezierCurveTo(0.35, 1.0, 1, 0.85, 1.1, 0.35); hs.bezierCurveTo(1.2, -0.2, 0.3, -0.7, 0, -1);
    const hmat = new THREE.MeshBasicMaterial({ color: C('#bff8ff').multiplyScalar(1.4), side: THREE.DoubleSide, transparent: true, opacity: 0.8 });
    const hm = new THREE.Mesh(new THREE.ShapeGeometry(hs, 12), hmat); hm.rotation.x = -Math.PI / 2; hm.position.set(0, 6.4, 0); hm.scale.setScalar(3.4); g.add(hm);
    heart = { mat: hmat, g };
    const tm = g.localToWorld(new V3(0, 6.6, 0)); sparkles.push(tm);
    for (let k = 0; k < 5; k++) addPerson(g.localToWorld(new V3(rand(-4, 4), 0, rand(-11, -8))));
    signAt(g, 'ウィルソン株', 11, 9);
    // 夫婦杉：2本の杉が枝でつながる
    const fc = onGround(local(at(3, 0.7), 0, W / 2 + 40)), fg = registerLandmark(fantasyGroup(fc), '夫婦杉'); fg.rotation.y = yawAt(at(3, 0.7));
    bigCedar(fg, -5, 0, 0.75, 0.8); bigCedar(fg, 5, 0, 0.7, 0.8);
    const lk = beam(new V3(-4, 7.5, 0), new V3(4, 8.5, 0), 0.7); part(fg, BOX, bark, [lk.p.x, lk.p.y, lk.p.z], [lk.s.x, lk.s.y, lk.s.z], lk.r, 0.02);
    signAt(fg, '夫婦杉', 21, 7); occupied.push({ x: fc.x, z: fc.z, r: 14 });
    // 大王杉：縄文杉が見つかるまで最大とされた屋久杉
    const dc = onGround(local(at(3, 0.15), 0, W / 2 + 62)), dg = registerLandmark(fantasyGroup(dc), '大王杉');
    bigCedar(dg, 0, 0, 1.15); signAt(dg, '大王杉', 26, 7); occupied.push({ x: dc.x, z: dc.z, r: 11 });
  }
  // 木漏れ日：月の光が木の間から斜めに差し込む光の筋
  const shafts = [];
  {
    const mat = new THREE.MeshBasicMaterial({ color: C('#bfffe8'), transparent: true, opacity: 0.1, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
    const geo = new THREE.CylinderGeometry(1.2, 3.2, 1, 12, 1, true); geo.translate(0, -0.5, 0);
    for (let k = 0; k < 9; k++) {
      const s = rand(at(3, 0.1), at(3, 0.95)), v = k % 3 === 0 ? rand(-W / 2 + 2, W / 2 - 2) : W / 2 + rand(6, 30), p = onGround(local(s, 0, v));
      // 光の筋：月の側の上空から地面の p へ（円柱の局所 -y を向ける）
      const top = p.clone().add(new V3(6, 26, -4)), d = p.clone().sub(top), m = new THREE.Mesh(geo, mat);
      m.position.copy(top); m.quaternion.setFromUnitVectors(new V3(0, -1, 0), d.clone().normalize()); m.scale.set(1, d.length(), 1);
      m.userData.droneIgnore = true; m.frustumCulled = false; world.add(m); shafts.push(m);
    }
    updates.push(t => { mat.opacity = 0.08 + Math.sin((reduced.matches ? 0 : t) * 0.6) * 0.03 + (celebration > 0 ? 0.08 : 0); });
  }

  /* ---- 第4区間：いちばん高いところ。縄文杉と展望デッキ（樹齢は数千年とも） ---- */
  {
    const s = at(4, 0.5), g = site('縄文杉', s, W / 2 + 36, 30, 30, '#3f6a44', W / 2 + 24);
    bigCedar(g, 0, 4, 1.7, 1.15);
    // こぶだらけの幹：縄文杉らしく、太い幹に大きなこぶ
    for (let k = 0; k < 10; k++) { const a = rand(0, Math.PI * 2), y = rand(2, 16); part(g, SPH_LO, k % 4 ? bark : moss, [Math.cos(a) * 3.3, y, 4 + Math.sin(a) * 3.3], [1.6, 1.8, 1.6], null, 0.02); }
    // 展望デッキ：幹を囲む木の床と手すり（走路側）
    addBox(g, [19, 0.25, 4], [0, 1.6, -7], wood); addBox(g, [19, 0.15, 0.15], [0, 2.7, -9], darkWood); addBox(g, [19, 0.15, 0.15], [0, 2.7, -5], darkWood);
    for (let x = -9; x <= 9; x += 3) for (const z of [-9, -5]) addBox(g, [0.2, 2.7, 0.2], [x, 1.35, z], darkWood);
    for (let k = 0; k < 10; k++) addPerson(g.localToWorld(new V3(rand(-8, 8), 1.7, rand(-8.4, -5.6))));
    for (let k = 0; k < 6; k++) glowCluster(g.localToWorld(new V3(rand(-6, 6), 0.1, rand(0, 8))), 7, 0.6);
    signAt(g, '縄文杉', 36, 8);
    // ヤクシカ（縄文杉のまわり）
    for (let k = 0; k < 6; k++) { const p = onGround(local(rand(at(4, 0.1), at(4, 0.9)), 0, W / 2 + rand(26, 60))); if (!taken(p.x, p.z, 1.5)) { deer.push({ p, yaw: rand(0, Math.PI * 2), sc: rand(0.9, 1.1), antler: k % 2 === 0 }); occupied.push({ x: p.x, z: p.z, r: 1.5 }); } }
  }
  stamp(deerTpl(false), deer.filter(d => !d.antler)); stamp(deerTpl(true), deer.filter(d => d.antler));
  if (deer.length) registerLandmark(fantasyGroup(deer[0].p.clone()), 'ヤクシカ');

  /* ---- 第5区間：苔の下り坂。大川の滝、ヤクザルの群れ、紀元杉 ---- */
  {
    // 大川の滝（おおこのたき）：花崗岩の崖から落ちる滝と滝つぼ
    const g = site('大川の滝', at(5, 0.4), W / 2 + 50, 44, 30, '#3f6a44', W / 2 + 40);
    // 崖：丸く削られた花崗岩の一枚岩を弧に並べ、上に森をのせる（滝の左右ほど手前に出る）
    for (let k = 0; k < 9; k++) {
      if (k === 4) continue;   // 中央は滝が落ちる岩壁
      const x = -18 + k * 4.5, f = Math.abs(x) / 18, hh = 20 - f * 6 + rand(-1.5, 1.5), zc = 11 - f * 6;
      part(g, SPH_LO, k % 2 ? granite : toon('#7f7e78'), [x, hh * 0.45, zc], [3.6, hh * 0.55, 4.2], null, 0.02);
      part(g, SPH_LO, k % 3 ? leafDeep : leaf, [x, hh + 0.8, zc + 1], [3.8, 2.4, 3.8], null, 0);
      if (k % 2) part(g, SPH_LO, moss, [x + rand(-1, 1), hh * 0.5, zc - 3.2], [1.6, 2.4, 1], null, 0);
    }
    addBox(g, [10, 20, 4], [0, 10, 11.5], toon('#6f6e68'), null, 0.02);
    const fallTex = waterTex('#cfefff', 'rgba(255,255,255,A)', true); fallTex.repeat.set(1, 2); flows.push([fallTex, 1.4]);
    const fall = new THREE.Mesh(new THREE.PlaneGeometry(7, 20), new THREE.MeshBasicMaterial({ map: fallTex, color: C('#ffffff').multiplyScalar(1.15), transparent: true, opacity: 0.92 }));
    fall.position.set(0, 10.2, 9.4); fall.rotation.y = Math.PI; g.add(fall);
    const poolTex = waterTex('#2f7d8f', 'rgba(220,255,250,A)', false); flows.push([poolTex, 0.15]);
    part(g, new THREE.CircleGeometry(9, 28).rotateX(-Math.PI / 2), toon('#ffffff', { map: poolTex, emissive: C('#1f6a78'), emissiveIntensity: 0.5 }), [0, 0.08, 1.5], null, null, 0);
    for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2; part(g, SPH_LO, k % 3 ? granite : moss, [Math.cos(a) * 9.5, 0.4, 1.5 + Math.sin(a) * 9.5], [rand(1, 1.8), rand(0.6, 1), rand(1, 1.6)], null, 0); }
    for (let k = 0; k < 6; k++) mists.push(g.localToWorld(new V3(rand(-3, 3), 0.8, rand(2, 5))));
    for (let k = 0; k < 6; k++) addPerson(g.localToWorld(new V3(rand(-12, 12), 0, rand(-13, -10))));
    signAt(g, '大川の滝', 27, 8);
    // ヤクザル：道ばたに座る群れ
    const mk = [];
    for (let k = 0; k < 14; k++) { const p = onGround(local(rand(at(5, 0.05), at(5, 0.95)), 0, W / 2 + rand(5.5, 12))); if (!taken(p.x, p.z, 0.8)) { mk.push({ p, yaw: rand(0, Math.PI * 2), sc: rand(0.8, 1.1) }); occupied.push({ x: p.x, z: p.z, r: 0.8 }); } }
    stamp(monkeyTpl(), mk);
    if (mk.length) registerLandmark(fantasyGroup(mk[0].p.clone()), 'ヤクザルの群れ');
    // 紀元杉：道路沿いの屋久杉
    const kc = onGround(local(at(5, 0.78), 0, W / 2 + 30)), kg = registerLandmark(fantasyGroup(kc), '紀元杉');
    bigCedar(kg, 0, 0, 0.95); signAt(kg, '紀元杉', 23, 7); occupied.push({ x: kc.x, z: kc.z, r: 10 });
  }

  /* ---- 第6区間：光るきのこの谷。倒木に灯るシイノトモシビタケと観察会。外は永田いなか浜（ウミガメの上陸）と屋久島灯台 ---- */
  {
    // 倒木と光るきのこ：走路の外と内に並べる
    let first = null;
    for (let k = 0; k < 16; k++) {
      const s = rand(at(5, 0.85), at(6, 0.95)), v = k % 4 === 0 ? -(W / 2 + rand(8, 22)) : W / 2 + rand(10, 40), p = onGround(local(s, 0, v));
      if (taken(p.x, p.z, 4) || onSea(p.x, p.z)) continue;
      addLog(p, rand(6, 10), yawAt(s) + rand(-0.8, 0.8)); occupied.push({ x: p.x, z: p.z, r: 4 });
      if (!first) first = p;
    }
    // 観察会：赤い灯りで照らして、しゃがんで見入る人
    for (let k = 0; k < 10; k++) { const p = onGround(local(rand(at(6, 0.1), at(6, 0.6)), 0, W / 2 + rand(8, 14))); if (!taken(p.x, p.z, 0.5)) { addPerson(p, Math.random() < 0.5); occupied.push({ x: p.x, z: p.z, r: 0.6 }); sparkles.push(p.clone().add(new V3(0, 1, 0))); } }
    if (first) { const g = registerLandmark(fantasyGroup(first.clone()), '光るきのこの谷（シイノトモシビタケ）'); signAt(g, '光るきのこの谷', 6, 11); }
    // 永田いなか浜：砂浜と、海（ウミガメの産卵地）
    const beach = outerPath(at(5, 0.75), at(6, 1) + 20, W / 2 + 85, 3, 6);
    beach.forEach(p => { onGround(p); occupied.push({ x: p.x, z: p.z, r: 16 }); });
    ribbon(beach, 26, 0.1, toon('#ffffff', { map: ctex(64, 64, g => { g.fillStyle = '#b3a684'; g.fillRect(0, 0, 64, 64); speck(g, 64, 64, 300, ['#c4b794', '#9e9174', '#cfc4a4'], 0.5, 1.5, 0.7); }, true), side: THREE.DoubleSide }), 8, W / 2 + 40);
    const shape = new THREE.Shape(seaPts.map(p => new THREE.Vector2(p.x, -p.z)));
    const seaGeo = new THREE.ShapeGeometry(shape, 4); seaGeo.rotateX(-Math.PI / 2);
    const seaTex = ctex(256, 256, g => {
      g.fillStyle = '#163a5a'; g.fillRect(0, 0, 256, 256);
      for (let i = 0; i < 160; i++) { g.fillStyle = `rgba(${Math.random() < 0.3 ? '220,240,255' : '70,130,170'},${rand(0.15, 0.45)})`; g.fillRect(rand(0, 256), rand(0, 256), rand(6, 22), rand(1, 2)); }
    }, true);
    seaTex.repeat.set(1 / 40, 1 / 40); flows.push([seaTex, -0.004]);
    const sea = new THREE.Mesh(seaGeo, toon('#ffffff', { map: seaTex, emissive: C('#0e2a44'), emissiveIntensity: 0.6, side: THREE.DoubleSide })); sea.position.y = 0.16; sea.receiveShadow = true; world.add(sea);
    // 波打ち際の白い泡
    const foamPts = []; for (let s = at(5, 0.8); s <= at(6, 1) + 20; s += 6) foamPts.push(local(s, 0, W / 2 + 97));
    const foamM = new THREE.MeshBasicMaterial({ color: C('#e6f6ff'), transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false });
    const fm = ribbon(foamPts.map(p => p.setY(0)), 2.4, 0.2, foamM, 6, W / 2 + 40); fm.receiveShadow = false;
    updates.push(t => { foamM.opacity = 0.35 + Math.sin((reduced.matches ? 0 : t) * 0.9) * 0.2; });
    registerLandmark(fantasyGroup(local(at(6, 0.5), 0, W / 2 + 82)), '永田いなか浜');
    { const q = onGround(local(at(6, 0.5), 0, W / 2 + 64)), g = fantasyGroup(q); signAt(g, '永田いなか浜（ウミガメの産卵地）', 5, 17); occupied.push({ x: q.x, z: q.z, r: 4 }); }
    // ウミガメ：海から砂浜へ、ゆっくりはい上がってくる（見守る人は赤い灯り）
    const turtles = [];
    for (let i = 0; i < 4; i++) {
      const s = at(6, 0.2 + i * 0.2), from = local(s, 0, W / 2 + 100), to = onGround(local(s, 0, W / 2 + 72));
      turtles.push({ ...turtle(), from, to, ph: i * 7 + rand(0, 4) });
      if (i % 2 === 0) for (let k = 0; k < 3; k++) { const p = onGround(local(s + rand(-6, 6), 0, W / 2 + rand(66, 72))); addPerson(p, true); sparkles.push(p.clone().add(new V3(0, 0.8, 0))); }
    }
    updates.push(t => {
      const m = reduced.matches ? 12 : t;
      for (const tu of turtles) {
        const k = mod(m + tu.ph, 30) / 24, u = Math.min(1, k);
        tu.g.position.lerpVectors(tu.from, tu.to, u); tu.g.position.y = Math.max(0.16, groundAt(tu.g.position)) - 0.05;
        const d = tu.to.clone().sub(tu.from); tu.g.rotation.y = -Math.atan2(d.z, d.x);
        tu.fl.forEach((f, i) => { f.rotation.y = u < 1 ? Math.sin(m * 2.4 + i * Math.PI) * 0.5 : 0; });
      }
    });
    // 屋久島灯台：永田岬の白い灯台。光の帯がゆっくり回る
    const lc = onGround(local(at(5, 0.85), 0, W / 2 + 74)), lg = registerLandmark(fantasyGroup(lc), '屋久島灯台');
    part(lg, HALF, toon('#4c6a4a'), [0, -1, 0], [12, 6, 12], null, 0.02);
    part(lg, CYL_T, toon('#f4f4ee'), [0, 10, 0], [1.6, 12, 1.6], null, 0.02); addBox(lg, [3.4, 0.4, 3.4], [0, 16.2, 0], toon('#3a3a3a'));
    part(lg, CYL, glowMat('#fff6c8', 3), [0, 17.2, 0], [0.9, 1.6, 0.9], null, 0); part(lg, CONE, toon('#c8402e'), [0, 18.8, 0], [1.2, 1.6, 1.2], null, 0.02);
    addBox(lg, [5, 3, 4], [4, 2.5, 0], toon('#f4f4ee'), null, 0.02);
    const beamM = new THREE.MeshBasicMaterial({ color: C('#fff3c0'), transparent: true, opacity: 0.1, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
    const beamG = new THREE.ConeGeometry(4, 90, 16, 1, true); beamG.translate(0, -45, 0); beamG.rotateZ(Math.PI / 2);
    const rot = new THREE.Group(); rot.position.set(0, 17.2, 0); lg.add(rot);
    for (const a of [0, Math.PI]) { const bm = new THREE.Mesh(beamG, beamM); bm.rotation.y = a; bm.userData.droneIgnore = true; rot.add(bm); }
    updates.push(t => { rot.rotation.y = (reduced.matches ? 0 : t) * 0.5; });
    signAt(lg, '屋久島灯台', 23, 8); occupied.push({ x: lc.x, z: lc.z, r: 13 });
  }

  /* ---- 内馬場：月光の大きのこと妖精の輪（きのこの輪）、妖精のきのこの家（ファンタジー） ---- */
  let giant = null;
  {
    // 月光の大きのこは内馬場のいちばん広いところ
    let best = null, bestD = 0;
    for (let k = 0; k < 600; k++) {
      const i = (Math.random() * track.N) | 0, p = new V3(track.xs[i], 0, track.zs[i]).lerp(new V3(0, 0, 0), rand(0.2, 1));
      if (!inLoop(p.x, p.z) || p.distanceTo(boardPos) < 45) continue;
      const d = roadDist(p.x, p.z, 160); if (d > bestD) { bestD = d; best = p; }
    }
    const c = onGround(best || new V3(0, 0, 0)), g = registerLandmark(fantasyGroup(c), '月光の大きのこ');
    const capMat = toon('#9a7cff', { emissive: C('#5a3fd0'), emissiveIntensity: 0.45 }), gillMat = glowMat('#bff8ff', 1.6);
    part(g, new THREE.CylinderGeometry(2.6, 3.6, 18, 16), toon('#ece6f6'), [0, 9, 0], null, null, 0.02);
    part(g, new THREE.TorusGeometry(3.4, 0.6, 8, 24), toon('#ece6f6'), [0, 12, 0], null, [Math.PI / 2, 0, 0], 0.02);
    part(g, HALF, capMat, [0, 17.6, 0], [14, 8, 14], null, 0.02);
    part(g, new THREE.CircleGeometry(13.6, 32).rotateX(Math.PI / 2), gillMat, [0, 17.5, 0], null, null, 0);
    const dotMat = glowMat('#ffffff', 2.2);
    for (let k = 0; k < 22; k++) { const b = rand(0, Math.PI * 2), q = rand(0.15, 0.85); part(g, SPH_LO, dotMat, [Math.cos(b) * 14 * q, 17.6 + 8 * Math.sqrt(1 - q * q) * 0.97, Math.sin(b) * 14 * q], [1.1, 0.4, 1.1], null, 0); }
    // 柄の扉と丸窓（妖精の住まい）、根元の苔
    addBox(g, [1.8, 3, 0.4], [0, 1.5, -3.3], toon('#7a4a8a')); part(g, SPH_LO, warm, [0, 7, -2.9], [0.8, 0.8, 0.3], null, 0); part(g, SPH_LO, warm, [2.2, 10, -1.7], [0.6, 0.6, 0.3], null, 0);
    for (let k = 0; k < 10; k++) { const a = k / 10 * Math.PI * 2; part(g, SPH_LO, k % 2 ? moss : mossLight, [Math.cos(a) * 4, 0.3, Math.sin(a) * 4], [2, 0.8, 1.6], [0, -a, 0], 0); }
    // 妖精の輪：大きのこを囲む、きのこの輪
    for (let k = 0; k < 30; k++) { const a = k / 30 * Math.PI * 2, rr = 22 + rand(-1, 1); addShroom(onGround(c.clone().add(new V3(Math.cos(a) * rr, 0, Math.sin(a) * rr * 0.85))), rand(1, 2.2), rand(0.6, 1.1), 0.05); }
    giant = { c, capMat, gillMat, dotMat, g };
    occupied.push({ x: c.x, z: c.z, r: 26 });
    signAt(g, '月光の大きのこ', 30, 10);
    // 妖精のきのこの家：小さな扉と窓のあるきのこ
    const houses = []; let hn = 0;
    for (let k = 0; k < 300 && hn < 5; k++) {
      const i = (Math.random() * track.N) | 0, p = new V3(track.xs[i], 0, track.zs[i]).lerp(c, rand(0.25, 0.7));
      if (!inLoop(p.x, p.z) || !clearAt(p.x, p.z, W / 2 + 14, 5) || p.distanceTo(c) < 32 || p.distanceTo(boardPos) < 26) continue;
      onGround(p); const hg = fantasyGroup(p); hg.rotation.y = rand(0, Math.PI * 2);
      const col = pick(['#ff7f9e', '#ffb35a', '#8fc8ff', '#c8a6ff', '#7fe0b0']);
      part(hg, CYL_T, toon('#f2ead8'), [0, 1.6, 0], [1.8, 3.2, 1.8], null, 0.02); part(hg, HALF, toon(col, { emissive: C(col), emissiveIntensity: 0.25 }), [0, 3.1, 0], [3.2, 2.2, 3.2], null, 0.02);
      addBox(hg, [0.8, 1.4, 0.2], [0, 0.7, -1.62], toon('#6a4a3a')); part(hg, SPH_LO, warm, [0.9, 2, -1.45], [0.35, 0.35, 0.15], null, 0);
      for (let j = 0; j < 6; j++) { const b = rand(0, Math.PI * 2), q = rand(0.2, 0.8); part(hg, SPH_LO, toon('#ffffff'), [Math.cos(b) * 3.2 * q, 3.1 + 2.2 * Math.sqrt(1 - q * q) * 0.95, Math.sin(b) * 3.2 * q], [0.35, 0.15, 0.35], null, 0); }
      houses.push(hg); occupied.push({ x: p.x, z: p.z, r: 4.5 }); hn++;
    }
    if (houses.length) { registerLandmark(houses[0], '妖精のきのこの家'); signAt(houses[0], '妖精のきのこの家', 7.5, 11); }
  }

  /* ---- 森：屋久杉の森と照葉樹、海辺のヘゴ。その間に背の高い光るきのこと苔むした岩 ---- */
  {
    const coastS0 = at(5, 0.7), coastS1 = at(6, 1);
    for (let k = 0, n = 0; k < 7000 && n < 820; k++) {
      const s = rand(0, track.L), v = W / 2 + 9 + 220 * Math.random() ** 1.8, p = local(s, 0, v);
      if (!clearAt(p.x, p.z, W / 2 + 8, 2.2) || inLoop(p.x, p.z) || onSea(p.x, p.z)) continue;
      onGround(p);
      const coast = s > coastS0 && s < coastS1, r = Math.random();
      if (coast && r < 0.3) addFern(p, rand(0.9, 1.3));
      else if (r < 0.12) addShroom(p, rand(4, 11), rand(2.2, 5), rand(0, 0.12));
      else if (r < 0.55) addSugi(p, rand(1.0, 2.0) * (1 + (v - W / 2) / 260));
      else addBroad(p, rand(1, 1.6));
      if (Math.random() < 0.25) glowCluster(p.clone().add(new V3(rand(-1.2, 1.2), 0, rand(-1.2, 1.2))), rand(3, 7), 0.4);
      occupied.push({ x: p.x, z: p.z, r: 1.8 }); n++;
    }
    // 苔むした岩と倒木（森の床）
    for (let k = 0, n = 0; k < 3000 && n < 260; k++) {
      const s = rand(0, track.L), v = W / 2 + 6 + 120 * Math.random() ** 1.5, p = local(s, 0, v);
      if (!clearAt(p.x, p.z, W / 2 + 5.5, 1.4) || inLoop(p.x, p.z) || onSea(p.x, p.z)) continue;
      onGround(p); if (n % 9 === 0) addLog(p, rand(4, 8), rand(0, Math.PI), Math.random() < 0.6); else addBoulder(p, rand(0.6, 1.8));
      occupied.push({ x: p.x, z: p.z, r: 1.4 }); n++;
    }
    // 内馬場：杉と照葉樹、きのこ、苔むした岩
    for (let k = 0, n = 0; k < 3000 && n < 110; k++) {
      const i = (Math.random() * track.N) | 0, p = new V3(track.xs[i], 0, track.zs[i]).lerp(new V3(0, 0, 0), rand(0.05, 1));
      if (!inLoop(p.x, p.z) || !clearAt(p.x, p.z, W / 2 + 8, 2.4) || p.distanceTo(boardPos) < 26) continue;
      onGround(p); const r = Math.random();
      if (r < 0.3) addShroom(p, rand(3, 8), rand(1.8, 3.6), rand(0, 0.12)); else if (r < 0.6) addSugi(p, rand(0.9, 1.5)); else if (r < 0.8) addBroad(p, rand(0.9, 1.3)); else addBoulder(p, rand(0.7, 1.6));
      if (Math.random() < 0.4) glowCluster(p.clone().add(new V3(rand(-1, 1), 0, rand(-1, 1))), rand(3, 7), 0.4);
      occupied.push({ x: p.x, z: p.z, r: 2 }); n++;
    }
    shuffle(sugis); shuffle(broads); shuffle(ferns); shuffle(shrooms);
    addInst(CYL_T, barkDark, sugis.map(t => t.trunk)); addInst(coneG, toon('#ffffff'), sugis.flatMap(t => t.crowns));
    addInst(CYL_T, bark, broads.map(t => t.trunk)); addInst(SPH_LO, toon('#ffffff'), broads.flatMap(t => t.clumps));
    addInst(CYL, toon('#4a3a2e'), ferns.map(t => t.trunk)); addInst(BOX, toon('#3f7a44'), ferns.flatMap(t => t.fronds), false);
  }

  /* ---- 妖精：光る体と透ける羽。木漏れ日の区間と大きのこのまわりを舞う ---- */
  const fairies = [];
  {
    const wingM = new THREE.MeshBasicMaterial({ color: C('#d8fff4').multiplyScalar(1.3), transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending });
    const wingG = new THREE.CircleGeometry(0.5, 10); wingG.scale(1, 0.6, 1);
    const homes = [];
    for (let k = 0; k < 8; k++) homes.push(onGround(local(rand(at(3, 0.1), at(3, 0.95)), 0, rand(-W / 2, W / 2 + 26))));
    if (giant) for (let k = 0; k < 6; k++) homes.push(giant.c.clone().add(new V3(rand(-12, 12), 6, rand(-12, 12))));
    for (const [i, h] of homes.entries()) {
      const g = fantasyGroup(); g.userData.droneIgnore = true;
      const col = pick(['#c8ffd8', '#d8c8ff', '#ffd0f0', '#bff4ff']);
      part(g, SPH_LO, glowMat(col, 2.6), [0, 0, 0], [0.22, 0.32, 0.22], null, 0);
      const wings = [-1, 1].map(sd => { const w = new THREE.Group(); g.add(w); const m = new THREE.Mesh(wingG, wingM); m.position.set(0, 0.15, sd * 0.42); m.rotation.x = Math.PI / 2; w.add(m); return w; });
      fairies.push({ g, wings, h, r: rand(2, 6), y: rand(2.5, 7), ph: rand(0, 6), v: rand(0.5, 1.1) * (i % 2 ? 1 : -1), col: C(col).multiplyScalar(1.8) });
    }
    updates.push((t, dt) => {
      const m = reduced.matches ? 0 : t, lift = celebration > 0 ? Math.min(1, celebration / 3) * 10 : 0;
      for (const f of fairies) {
        const a = m * f.v + f.ph;
        f.g.position.set(f.h.x + Math.cos(a) * f.r, f.h.y + f.y + Math.sin(m * 1.7 + f.ph) * 0.8 + lift, f.h.z + Math.sin(a * 1.3) * f.r);
        f.g.rotation.y = -a - Math.PI / 2 * Math.sign(f.v);
        f.wings.forEach((w, i) => { w.rotation.x = (i ? 1 : -1) * Math.sin(m * 22 + f.ph) * 0.6; });
        if (!reduced.matches && Math.random() < dt * (lightQuality() ? 2 : 5)) { const p = f.g.position; sparkP.emit(p.x, p.y, p.z, rand(-0.2, 0.2), rand(-0.4, 0), rand(-0.2, 0.2), rand(0.8, 1.4), rand(0.15, 0.3), f.col, 0.2, 0.5); }
      }
    });
    registerLandmark(fantasyGroup(homes[0].clone()), '妖精の木漏れ日');
  }

  /* ---- 月：満月と、まわりの光の輪（月暈） ---- */
  {
    const moonP = new V3(-250, 220, -450);
    part(world, SPH_LO, glowMat('#eef6ff', 1.5), [moonP.x, moonP.y, moonP.z], [22, 22, 22], null, 0);
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX_SOFT, color: C('#9fd8ff'), transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
    halo.position.copy(moonP); halo.scale.set(150, 150, 1); halo.userData.droneIgnore = true; world.add(halo);
  }

  // まとめて描く：森のきのこ、光るきのこ、苔むした岩と倒木、人々、文字の板、きのこの灯り
  const shroomCap = toon('#ffffff', { emissive: C('#3d4f8a'), emissiveIntensity: 0.5 }), glowM = glowMat('#a6ff8f', 2.2), lampM = glowMat('#ffffff', 2.1), gillM = glowMat('#dff6ff', 1.4);
  {
    addInst(new THREE.CylinderGeometry(0.8, 1, 1, 8).rotateZ(Math.PI / 2), toon('#e4def0'), shrooms.map(t => t.stem)); addInst(HALF, shroomCap, shrooms.map(t => t.cap));
    addInst(new THREE.CircleGeometry(1, 16).rotateX(Math.PI / 2), gillM, shrooms.map(t => t.gill), false); addInst(SPH_LO, glowMat('#ffffff', 1.8), shrooms.flatMap(t => t.dots), false);
    const order = shuffle(glowCaps.map((_, i) => i));
    addInst(CYL, toon('#d8e8c8'), order.map(i => glowStems[i]), false); addInst(HALF, glowM, order.map(i => glowCaps[i]), false);
    addInst(SPH_LO, toon('#ffffff'), shuffle(boulders)); addInst(CYL, barkDark, logs); addInst(SPH_LO, moss, logMoss, false);
    const po = shuffle(people.map((_, i) => i));
    addInst(new THREE.CapsuleGeometry(0.3, 0.75, 3, 8), toon('#ffffff'), po.map(i => people[i]), false); addInst(SPH_LO, toon('#e9c4a4'), po.map(i => heads[i]), false); addInst(SPH_LO, toon('#ffffff'), po.map(i => hats[i]), false);
    addInst(BOX, toon('#ffffff'), packs, false);
    for (const [key, list] of boardLists) addInst(new THREE.PlaneGeometry(1, 1), boardMats.get(key), list, false);
    addInst(HALF, lampM, lampCaps, false);
  }

  /* ---- 霧・しぶき・きらめき：森にただよう夜霧、滝のしぶき、観察会の赤い灯りと妖精の光 ---- */
  {
    const mistC = C('#9fb8c8'), sprayC = C('#e6f6ff'), redC = C('#ff5a4a').multiplyScalar(1.6), glintC = C('#c8fff0').multiplyScalar(1.6);
    let acc = 0, acc2 = 0, acc3 = 0;
    updates.push((t, dt) => {
      for (const [tex, v] of flows) tex.offset.y += reduced.matches ? 0 : dt * v;
      if (reduced.matches) return;
      const lq = lightQuality(), c = camera.position;
      // 夜霧は走路の外の森だけにただよわせる（走路の上では馬が見えにくくなる）
      acc += dt * (lq ? 2 : 5);
      while (acc >= 1) { acc--; const x = c.x + rand(-70, 70), z = c.z + rand(-70, 70); if (roadDist(x, z, W) < W / 2 + 6) continue; dustP.emit(x, track.groundH(x, z) + rand(0.5, 2.5), z, rand(0.2, 0.6), rand(0, 0.15), rand(-0.2, 0.2), rand(6, 9), rand(4, 7), mistC, 0, 0.1); }
      acc2 += dt * mists.length * (lq ? 2 : 5);
      while (acc2 >= 1 && mists.length) { acc2--; const p = pick(mists); dustP.emit(p.x + rand(-1, 1), p.y, p.z + rand(-1, 1), rand(-1, 1), rand(0.8, 2), rand(-1, 1), rand(1.5, 2.5), rand(1.5, 3), sprayC, -0.2, 0.6); }
      acc3 += dt * sparkles.length * (lq ? 0.5 : 1.2);
      while (acc3 >= 1 && sparkles.length) { acc3--; const p = pick(sparkles); sparkP.emit(p.x + rand(-0.5, 0.5), p.y + rand(0, 1), p.z + rand(-0.5, 0.5), 0, rand(0.1, 0.4), 0, rand(0.6, 1.2), rand(0.18, 0.32), Math.random() < 0.5 ? redC : glintC, 0, 0.5); }
    });
  }

  /* ---- ゴール：月光の大きのこがまぶしく光って胞子の花火を打ち上げ、森じゅうのきのこが波のように明るく灯り、妖精が舞い上がる ---- */
  themeFinish = () => { celebration = 9; }; themeReset = () => { celebration = 0; };
  let burst = 0;
  const fw = ['#9cff9c', '#b48cff', '#7dffe8', '#ff9ce0', '#ffe27a'].map(c => C(c).multiplyScalar(1.7));
  updates.push((t, dt) => {
    const glow = celebration > 0 ? Math.min(1, celebration / 2) : 0, m = reduced.matches ? 0 : t;
    // きのこのかさの光は、ふだんはゆっくり息づき、ゴールでは明るく脈打つ
    shroomCap.emissiveIntensity = 0.5 + Math.sin(m * 0.7) * 0.15 + glow * (0.9 + 0.4 * Math.sin(m * 6));
    glowM.color.setRGB(0.65, 1, 0.56).multiplyScalar(2.2 + Math.sin(m * 1.3) * 0.25 + glow * 1.6);
    lampM.color.setScalar(2.1 + glow * (1.2 + Math.sin(m * 8) * 0.6));
    if (giant) { giant.capMat.emissiveIntensity = 0.45 + glow * 1.4; giant.gillMat.color.setRGB(0.75, 0.97, 1).multiplyScalar(1.6 + glow * 2); giant.dotMat.color.setScalar(2.2 + glow * 2 * (0.6 + 0.4 * Math.sin(m * 9))); }
    if (heart) heart.mat.color.setRGB(0.75, 0.97, 1).multiplyScalar(1.4 + glow * 2.5 + Math.sin(m * 1.1) * 0.2);
    if (celebration <= 0) return;
    celebration = Math.max(0, celebration - dt);
    if (reduced.matches) return;
    burst += dt * (lightQuality() ? 2 : 4);
    for (; burst >= 1; burst--) {
      // 胞子の花火：大きのこのかさから打ち上がり、ふわりと開いてゆっくり落ちる
      const c = giant ? giant.c : tp(track.finishS, -30).v, y = rand(40, 65), x = c.x + rand(-40, 40), z = c.z + rand(-40, 40), col = pick(fw);
      for (let i = 0; i < 46; i++) { const a = rand(0, Math.PI * 2), b = Math.acos(rand(-1, 1)), sp = rand(7, 11); sparkP.emit(x, y, z, Math.sin(b) * Math.cos(a) * sp, Math.cos(b) * sp, Math.sin(b) * Math.sin(a) * sp, rand(1.6, 2.4), rand(0.5, 0.9), col, 1.2, 1.4); }
    }
    if (giant && Math.random() < 0.7) { const c = giant.c; for (let i = 0; i < 3; i++) sparkP.emit(c.x + rand(-12, 12), c.y + 18 + rand(0, 4), c.z + rand(-12, 12), rand(-1, 1), rand(3, 7), rand(-1, 1), rand(1.5, 2.5), rand(0.4, 0.8), pick(fw), -0.3, 0.6); }
  });

  // 蛍：森を飛ぶ淡い緑の光
  ambient(TEX_STAR, true, 14, (a, c) => a.emit(c.x + rand(-45, 45), c.y - rand(0, 8) + rand(1, 10), c.z + rand(-45, 45), rand(-0.5, 0.5), rand(-0.2, 0.4), rand(-0.5, 0.5), 6, rand(0.12, 0.28), C('#c1ffd8').multiplyScalar(2), 0, 0), true);
  // 広い範囲に散らばるインスタンスは、原点の境界球で切り捨てられないようにする
  for (const o of world.children.slice(n0)) if (o.isInstancedMesh) o.frustumCulled = false;
  themeUpd.push((t, dt) => { for (const f of updates) f(t, dt); });
}
// スタンド：屋久杉の丸太の柱に、苔むした杉皮ぶきの屋根。軒にきのこの灯りを吊るし、屋根の上に「月光きのこ森」の看板
function decorMoonForestStand(stand, len, z0, roof) {
  const g = new THREE.Group(); stand.add(g); registerLandmark(g, 'moonForest-stand');
  const pick = a => a[(Math.random() * a.length) | 0];
  // 段は杉板の色に、屋根は杉皮の色に
  const recolor = { [C('#f2eef8').getHex()]: '#8a6a4e', [C('#e3dcef').getHex()]: '#6e5440', [C('#d9d3e6').getHex()]: '#5a4030', [C('#ffffff').getHex()]: '#5a4636' };
  // 発光の帯（MeshBasicMaterial）は白く飽和して見えるので、トゥーンの材質だけを塗り替える
  stand.children.forEach(o => { if (o.isMesh && !o.isInstancedMesh && o.material.isMeshToonMaterial && recolor[o.material.color.getHex()]) o.material.color.set(recolor[o.material.color.getHex()]); });
  // 屋根の苔：もこもことした苔の塊
  const mossL = [];
  for (let x = -len / 2 - 2; x <= len / 2 + 2; x += 2.2) for (let z = 0; z < 3; z++) mossL.push({ p: new V3(x + rand(-0.6, 0.6), 13.7 + z * 0.55, z0 - 1 + z * 6 + rand(-1, 1)), s: new V3(rand(1.4, 2.2), rand(0.4, 0.7), rand(1.6, 2.6)), c: C(pick(['#4f8a4c', '#5c964f', '#6aa257'])) });
  g.add(inst(SPH_LO, toon('#ffffff'), mossL, false));
  // 屋久杉の丸太の柱（前面）
  const logs = [];
  for (let x = -len / 2; x <= len / 2 + 0.1; x += len / 10) logs.push({ p: new V3(x, 6.5, z0 - 1.8), s: new V3(0.75, 13, 0.75) });
  g.add(inst(new THREE.CylinderGeometry(0.85, 1, 1, 9), toon('#6e4c3a'), logs, false));
  // 軒のきのこの灯り：吊るしたかさが光る
  const cords = [], caps = [], cols = ['#a496ff', '#78dedb', '#9cf2a8', '#ffb3e6', '#8fc8ff'].map(C);
  const HALF = new THREE.SphereGeometry(1, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2);
  for (let x = -len / 2 + 1.5, i = 0; x <= len / 2 - 1.5; x += 3, i++) {
    const y = 11.2 - (i % 2) * 0.6;
    cords.push({ p: new V3(x, (12.6 + y) / 2, z0 - 2.4), s: new V3(0.03, 12.6 - y, 0.03) }); caps.push({ p: new V3(x, y - 0.3, z0 - 2.4), s: new V3(0.6, 0.4, 0.6), c: cols[i % cols.length] });
  }
  g.add(inst(BOX, toon('#2a2a2a'), cords, false), inst(HALF, glowMat('#ffffff', 2.2), caps, false));
  // 屋根の上の看板：木の板に光る文字
  const sign = ctex(512, 160, c => {
    c.fillStyle = '#3a2a20'; c.fillRect(0, 0, 512, 160); c.strokeStyle = '#9cf2a8'; c.lineWidth = 8; c.strokeRect(8, 8, 496, 144);
    c.fillStyle = '#e8fff0'; c.shadowColor = '#7dffcf'; c.shadowBlur = 18; c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = '900 76px "Dela Gothic One", sans-serif'; c.fillText('月光きのこ森', 256, 86, 470);
  });
  const w = Math.min(36, len * 0.3), h = w * 160 / 512;
  for (const sx of [-w * 0.3, w * 0.3]) addBox(g, [0.6, 3.4, 0.6], [sx, 15.4, z0 + 6], toon('#5a4030'));
  addBox(g, [w + 1.2, h + 1.2, 0.8], [0, 17 + h / 2, z0 + 6.4], toon('#4a3528'));
  const bm = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: sign, color: C('#ffffff').multiplyScalar(1.3) })); bm.position.set(0, 17 + h / 2, z0 + 5.98); bm.rotation.y = Math.PI; g.add(bm);
  // 両端の大きなきのこ
  for (const [x, col] of [[-len / 2 - 4, '#a496ff'], [len / 2 + 4, '#78dedb']]) {
    part(g, new THREE.CylinderGeometry(0.9, 1.3, 9, 10), toon('#ece6f6'), [x, 4.5, z0 + 2], null, null, 0.02);
    part(g, HALF, toon(col, { emissive: C(col), emissiveIntensity: 0.5 }), [x, 8.8, z0 + 2], [4.5, 3, 4.5], null, 0.02);
    part(g, new THREE.CircleGeometry(4.3, 20).rotateX(Math.PI / 2), glowMat('#dff6ff', 1.6), [x, 8.75, z0 + 2], null, null, 0);
  }
}
