// オーロラ雪原カップ
'use strict';

/* ---- オーロラ雪原カップ：スウェーデン北部ラップランド（世界遺産「ラポニア地域」）を下敷きにした冬の雪原 ---- */
// 見立て：キルナのまわりのラップランドを、オーロラの下の雪原をひと回りするコースに。
// 区間の役割：0 氷のスタンドのホーム直線／1 ユッカスヤルヴィ：凍ったトルネ川の氷のホテルと木造教会、川を走る犬ぞり／
// 2 深雪の上り：キルナの鉄鉱山と、町の移転で引っ越すキルナ教会、鉄鉱石列車／3 アビスコ（最高地点）：ヌオリャ山のオーロラ観測所とリフト、山樺の林／
// 4 ラポニアの台地：サーミの冬の宿営（ラヴヴ・高床の倉ニャッラ・芝土の小屋）とトナカイの囲い、トナカイ橇の列／
// 5 トナカイ橇の下り：赤い十字の道しるべ、山小屋、ヘラジカ／6 凍ったトーネトレスク湖：氷上の穴釣りとスノーモービル、湖の向こうのラップランドの門／
// 7 キルナ雪祭りの雪像。内馬場はヨックモックの冬の市（屋台とトナカイレース）と、氷の大トナカイ像（ファンタジー）
function decorAurora(th) {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const { shuffle, roadDist, occupied, taken, clearAt, groundAt, onGround, local, at, label, site, PRISM, CYL, addInst, beam, route } = sceneryKit();
  const n0 = world.children.length, updates = [];
  // 案内板は雪の白地に、夜空の紺の文字
  const signAt = (g, text, y, w = 14) => { const sp = label(text, w, w / 4, '#f4f8ff', '#1d3566'); sp.position.set(0, y, 0); sp.scale.set(w, w / 4, 1); g.add(sp); return sp; };
  const pick = a => a[(Math.random() * a.length) | 0];
  const rot = (x, z, yaw) => [x * Math.cos(yaw) + z * Math.sin(yaw), -x * Math.sin(yaw) + z * Math.cos(yaw)];
  const yawAt = s => -tp(s, W / 2).h;
  const snowM = toon('#f4f9ff'), falu = toon('#9b3328'), trim = toon('#f2efe6'), wood = toon('#8a6244'), darkWood = toon('#3e2f26'), steel = toon('#6f7480'), rockM = toon('#7d889c');
  const iceM = toon('#c4ebff', { emissive: C('#4fb6ff'), emissiveIntensity: 0.3 }), iceDeep = toon('#9ad8fa', { emissive: C('#2f8fe0'), emissiveIntensity: 0.55 });
  const warm = toon('#ffd27a', { emissive: C('#ffb347'), emissiveIntensity: 1.1 });   // 窓明かり・焚き火
  const roof4 = new THREE.ConeGeometry(1, 1, 4); roof4.rotateY(Math.PI / 4);
  const HALF = new THREE.SphereGeometry(1, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);
  let celebration = 0;

  // 型の部品を、向き yaw・倍率 sc で置いた群れにまとめて描く（トナカイ・ヘラジカなど）
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
  // トナカイ（局所 +x が前）：灰褐色の体、白いたてがみとお尻、枝分かれした角。mat を渡すと全身をその材質に（氷の像・雪像）
  const reindeerTpl = (mat, legs = []) => {
    const g = new THREE.Group(), m = c => mat || toon(c);
    const body = m('#7a6a5a'), pale = m('#e8e2d6'), dark = m('#4a3f36'), antler = m('#c9b79a');
    part(g, SPH_LO, body, [0, 1.15, 0], [0.95, 0.48, 0.4], null, 0); part(g, SPH_LO, pale, [-0.82, 1.18, 0], [0.24, 0.34, 0.3], null, 0);
    part(g, SPH_LO, pale, [0.72, 1.42, 0], [0.38, 0.36, 0.28], [0, 0, 0.5], 0); part(g, SPH_LO, body, [1.08, 1.72, 0], [0.34, 0.19, 0.17], [0, 0, -0.3], 0);
    for (const [x, z] of [[0.55, 0.18], [0.55, -0.18], [-0.55, 0.18], [-0.55, -0.18]]) { const l = new THREE.Group(); l.position.set(x, 0.95, z); g.add(l); legs.push(l); part(l, CYL, dark, [0, -0.47, 0], [0.07, 0.95, 0.07], null, 0); }
    for (const sd of [-1, 1]) {
      // 角：後ろへ反る主枝と、前に出る枝、先の掌状の枝
      part(g, BOX, antler, [0.85, 2.25, sd * 0.28], [0.08, 0.95, 0.08], [sd * 0.45, 0, 0.35], 0);
      part(g, BOX, antler, [0.66, 2.75, sd * 0.5], [0.07, 0.6, 0.07], [sd * 0.3, 0, -0.5], 0);
      part(g, BOX, antler, [1.15, 2.2, sd * 0.2], [0.06, 0.45, 0.06], [sd * 0.2, 0, -0.9], 0);
      part(g, BOX, antler, [0.55, 3.05, sd * 0.6], [0.3, 0.06, 0.14], [0, 0, 0.3], 0);
    }
    return g;
  };
  // ヘラジカ：脚が長く、肩が盛り上がり、平たい掌状の角
  const mooseTpl = () => {
    const g = new THREE.Group(), body = toon('#4a3528'), dark = toon('#2e231c'), antler = toon('#cdb894');
    part(g, SPH_LO, body, [0, 2.1, 0], [1.4, 0.75, 0.6], null, 0); part(g, SPH_LO, body, [0.75, 2.55, 0], [0.6, 0.6, 0.55], null, 0);
    part(g, SPH_LO, body, [1.55, 2.45, 0], [0.62, 0.3, 0.26], [0, 0, -0.5], 0); part(g, SPH_LO, dark, [1.45, 2.05, 0], [0.12, 0.3, 0.1], null, 0);
    for (const [x, z] of [[0.85, 0.3], [0.85, -0.3], [-0.9, 0.3], [-0.9, -0.3]]) part(g, CYL, dark, [x, 0.85, z], [0.1, 1.7, 0.1], null, 0);
    for (const sd of [-1, 1]) part(g, BOX, antler, [1.15, 2.95, sd * 0.75], [0.9, 0.08, 0.7], [sd * 0.35, 0, 0.15], 0);
    return g;
  };

  // 立っている人・座っている人。毛糸の帽子をかぶる
  const people = [], heads = [], hats = [], parka = ['#d8343a', '#2f5fa8', '#f2c230', '#2f8a4a', '#f4f1ea', '#5a3f7a', '#ff8a3a', '#1f2a44', '#7ab8e8', '#c8302c'].map(C);
  const addPerson = (p, sit = false, col) => {
    const c = col ? C(col) : pick(parka);
    people.push({ p: p.clone().add(new V3(0, sit ? 0.55 : 0.95, 0)), s: new V3(1.12, sit ? 0.62 : 1, 1.12), c });
    heads.push({ p: p.clone().add(new V3(0, sit ? 1.3 : 1.95, 0)), s: new V3(0.26, 0.28, 0.26) });
    hats.push({ p: p.clone().add(new V3(0, sit ? 1.46 : 2.11, 0)), s: new V3(0.28, 0.2, 0.28), c: pick(parka) });
  };
  // 動く人（群れとは別に、ひとりずつ）
  const figure = (g, x, y, z, col, sc = 1) => {
    part(g, new THREE.CapsuleGeometry(0.3 * sc, 0.75 * sc, 3, 8), toon(col), [x, y + 0.95 * sc, z], null, null, 0.03);
    part(g, SPH_LO, toon('#e9c4a4'), [x, y + 1.95 * sc, z], [0.26 * sc, 0.28 * sc, 0.26 * sc], null, 0);
    part(g, SPH_LO, toon(pick(['#d8343a', '#f2c230', '#2f5fa8'])), [x, y + 2.11 * sc, z], [0.28 * sc, 0.2 * sc, 0.28 * sc], null, 0);
  };

  // 雪をかぶったトウヒと、白い幹の山樺（フィェルビョーク）。木ごとに部品をまとめ、低画質では前半の木だけ描く
  const coneG = new THREE.ConeGeometry(1, 1, 8); coneG.translate(0, 0.5, 0);
  const spruces = [], birches = [];
  const addSpruce = (p, sc) => {
    const t = { trunk: { p: p.clone().add(new V3(0, 0.7 * sc, 0)), s: new V3(0.35 * sc, 1.4 * sc, 0.35 * sc) }, green: [], snow: [] };
    for (const [r, h, y] of [[2.6, 3.2, 1.0], [2.0, 2.8, 2.8], [1.3, 2.4, 4.4]]) {
      const ry = rand(0, 3);
      t.green.push({ p: p.clone().add(new V3(0, y * sc, 0)), s: new V3(r * sc, h * sc, r * sc), r: [0, ry, 0], c: C(pick(['#2f6b5b', '#2a6052', '#35745f'])) });
      t.snow.push({ p: p.clone().add(new V3(0, (y + h * 0.5) * sc, 0)), s: new V3(r * sc * 0.72, h * sc * 0.52, r * sc * 0.72), r: [0, ry, 0] });
    }
    spruces.push(t);
  };
  const addBirch = (p, sc) => {
    const b = { trunks: [], twigs: [], frost: [] }, n = 2, yaw = rand(0, 6);   // 軽量画質で前半だけ描いても幹と枝がそろうよう、幹は2本に固定
    for (let k = 0; k < n; k++) {
      // 曲がって斜めに伸びる白い幹（株立ち）と、霧氷をまとった細い枝
      const a = yaw + k * 2.1, l = rand(0.12, 0.32), h = rand(3.2, 5.2) * sc * (k ? rand(0.6, 0.9) : 1);
      const top = p.clone().add(new V3(Math.cos(a) * l * h, h, Math.sin(a) * l * h));
      b.trunks.push({ p: p.clone().lerp(top, 0.5), s: new V3(0.15 * sc, h, 0.15 * sc), r: [Math.sin(a) * l, 0, -Math.cos(a) * l] });
      for (let j = 0; j < 4; j++) {
        const from = p.clone().lerp(top, rand(0.55, 1)), d = new V3(Math.cos(a + rand(-1.6, 1.6)), rand(0.4, 1.1), Math.sin(a + rand(-1.6, 1.6))).normalize();
        const to = from.clone().addScaledVector(d, rand(0.9, 1.8) * sc);
        b.twigs.push(beam(from, to, 0.06 * sc)); b.frost.push({ p: to, s: new V3(0.5, 0.4, 0.5).multiplyScalar(sc * rand(0.8, 1.3)) });
      }
    }
    birches.push(b);
  };
  // 雪玉を積んだランタン（スノーリュクタ）。中の灯りは発光する球
  const lanternBalls = [], lanternGlow = [];
  const snowLantern = (p, sc = 1) => {
    for (const [n, r, y] of [[7, 0.36, 0.16], [6, 0.29, 0.44], [4, 0.2, 0.7], [1, 0, 0.92]]) for (let k = 0; k < n; k++) { const a = k / n * Math.PI * 2 + y * 3; lanternBalls.push({ p: p.clone().add(new V3(Math.cos(a) * r * sc, y * sc, Math.sin(a) * r * sc)), s: new V3(0.15 * sc, 0.15 * sc, 0.15 * sc) }); }
    lanternGlow.push({ p: p.clone().add(new V3(0, 0.42 * sc, 0)), s: new V3(0.22 * sc, 0.22 * sc, 0.22 * sc) });
  };
  // 文字入りの板（屋台の看板など）。同じ文字は1枚の材質を共有する
  const boardMats = new Map(), boardLists = new Map();
  const putBoard = (text, c, yaw, w) => {
    if (!boardMats.has(text)) {
      boardMats.set(text, toon('#ffffff', { map: ctex(512, 128, g => {
        g.fillStyle = '#4a3326'; g.fillRect(0, 0, 512, 128); g.strokeStyle = '#d9c27a'; g.lineWidth = 8; g.strokeRect(6, 6, 500, 116);
        g.fillStyle = '#fff6e4'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = '900 64px "Dela Gothic One", sans-serif'; g.fillText(text, 256, 68, 470);
      }) }));
      boardLists.set(text, []);
    }
    boardLists.get(text).push({ p: c.clone(), s: new V3(w, w / 4, 1), r: [0, yaw, 0] });
  };
  // 地面に沿う、テクスチャを貼れる帯（川・線路）。u は幅方向、v は長さ方向（vScale mごとに1回）
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
  // 走路から外へ V の道筋（川・線路・散策路）。両端は ext 本（10mずつ）走路から遠ざかる向きへ伸ばして均す
  const outerPath = (s0, s1, V, ext = 40, step = 6) => {
    const pts = []; for (let s = s0; s <= s1; s += step) pts.push(local(s, 0, V));
    const head = pts[0], d0 = head.clone().sub(pts[1]).setY(0).normalize(), tail = pts[pts.length - 1], d1 = tail.clone().sub(pts[pts.length - 2]).setY(0).normalize();
    const f0 = tp(s0, W / 2).n.multiplyScalar(Math.sign(V)), f1 = tp(s1, W / 2).n.multiplyScalar(Math.sign(V));
    for (let k = 1; k <= ext; k++) pts.unshift(head.clone().addScaledVector(d0.clone().lerp(f0, Math.min(1, k / 20)).normalize(), k * 10));
    for (let k = 1; k <= ext; k++) pts.push(tail.clone().addScaledVector(d1.clone().lerp(f1, Math.min(1, k / 20)).normalize(), k * 10));
    for (let pass = 0; pass < 10; pass++) for (let i = 1; i < pts.length - 1; i++) pts[i] = pts[i - 1].clone().add(pts[i + 1]).multiplyScalar(0.5).lerp(pts[i], 0.5);
    return pts;
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
  // 凍った湖（第6区間の外）の輪郭：岸は走路から24m、沖は330m
  const lakeShore = []; for (let s = at(5, 0.92); s <= at(7, 0.22); s += 8) lakeShore.push(local(s, 0, W / 2 + 24));
  const lakeFar = []; for (let s = at(7, 0.22); s >= at(5, 0.92); s -= 8) lakeFar.push(local(s, 0, W / 2 + 330));
  const lakePts = lakeShore.concat(lakeFar), lakePoly = lakePts.map(p => [p.x, p.z]);
  const onLake = (x, z) => inPoly(lakePoly, x, z);

  /* ---- 外ラチ沿い：赤白の雪のポールと雪玉のランタン、手を振る観客（ユッカスヤルヴィ、アビスコ、雪祭り） ---- */
  {
    const poles = [], tips = [];
    for (let s = 0; s < track.L; s += 12) {
      if (s > track.homeS0 - 4 && s < track.homeS1 + 4) continue;   // ホーム直線は氷のスタンド
      const p = onGround(local(s, 0, W / 2 + 3.4));
      if (taken(p.x, p.z, 1)) continue;
      poles.push({ p: p.clone().add(new V3(0, 1.1, 0)), s: new V3(0.07, 2.2, 0.07) }); tips.push({ p: p.clone().add(new V3(0, 1.95, 0)), s: new V3(0.08, 0.5, 0.08) });
      if (Math.round(s / 12) % 2 === 0) snowLantern(onGround(local(s + 6, 0, W / 2 + 4.4)));
    }
    addInst(CYL, toon('#f4f4f0'), poles, false); addInst(CYL, toon('#d8343a'), tips, false);
    const crowdAt = (s0, s1, n) => {
      for (let k = 0; k < n; k++) {
        const p = onGround(local(rand(s0, s1), 0, W / 2 + rand(5.5, 10)));
        if (taken(p.x, p.z, 0.4)) continue;
        addPerson(p); occupied.push({ x: p.x, z: p.z, r: 0.6 });
      }
      for (let s = s0; s < s1; s += 9) { const p = local(s, 0, W / 2 + 7.5); occupied.push({ x: p.x, z: p.z, r: 4 }); }
    };
    crowdAt(at(1, 0.05), at(1, 0.25), 40); crowdAt(at(3, 0.15), at(3, 0.4), 35); crowdAt(at(7, 0.1), at(7, 0.9), 70);
  }

  /* ---- 遠景：雪をかぶった丸いラップランドの山（フィェル）、湖の向こうのラップランドの門、国内最高峰ケブネカイセ ---- */
  {
    const base = Math.max(640, track.extent + 330), domes = [], rocks = [];
    const hill = (p, rr, h, c) => {
      domes.push({ p, s: new V3(rr, h, rr), c: C(c) });
      for (let k = 0; k < 9; k++) { const hf = rand(0.2, 0.75), b = rand(0, Math.PI * 2), q = Math.sqrt(1 - hf * hf); rocks.push({ p: new V3(p.x + Math.cos(b) * rr * q, p.y + h * hf, p.z + Math.sin(b) * rr * q), s: new V3(rand(12, 30), rand(4, 10), rand(12, 30)), r: [0, -b, 0] }); }
    };
    for (let i = 0; i < 22; i++) { const a = i / 22 * Math.PI * 2 + rand(-0.08, 0.08), r = base + rand(0, 220); hill(new V3(Math.cos(a) * r, -14, Math.sin(a) * r), rand(160, 250), rand(70, 130), pick(['#e9f1fb', '#dfe9f6', '#f2f7fd'])); }
    // ラップランドの門（ラップポルテン）：U字の谷をはさむ2つの峰。湖（第6区間）の向こうに
    const dir6 = tp(at(6, 0.55), W / 2).n, side6 = new V3(-dir6.z, 0, dir6.x), c6 = dir6.clone().multiplyScalar(base + 120).setY(-20);
    for (const sd of [-1, 1]) hill(c6.clone().addScaledVector(side6, sd * 120), 125, 190, '#eef4fc');
    // ケブネカイセ：とがった最高峰（第5区間の向こう）
    const dir5 = tp(at(5, 0.4), W / 2).n, c5 = dir5.clone().multiplyScalar(base + 260).setY(-20), peak = [];
    peak.push({ p: c5, s: new V3(230, 300, 230), r: [0, 0.4, 0] }, { p: c5.clone().add(new V3(70, 0, 40)), s: new V3(160, 210, 160), r: [0, 1.1, 0] });
    for (const m of [
      inst(SPH_LO, toon('#ffffff', { fog: true }), domes, false), inst(SPH_LO, toon('#8592a8', { fog: true }), rocks, false),
      inst(coneG, toon('#f2f7fe', { fog: true }), peak, false), inst(coneG, toon('#7d8aa0', { fog: true }), peak.map(o => ({ p: o.p.clone().add(new V3(0, o.s.y * 0.25, 0)), s: new V3(o.s.x * 0.62, o.s.y * 0.35, o.s.z * 0.62), r: [0, o.r[1] + 0.3, 0] })), false)
    ]) m.userData.backdrop = true;
  }

  /* ---- 第1区間の外：凍ったトルネ川。氷のホテル、氷の礼拝堂、切り出した氷のブロック、ユッカスヤルヴィ教会、川を走る犬ぞり ---- */
  const riverPts = outerPath(at(1, 0.02), at(1, 0.98), W / 2 + 66, 50);
  {
    riverPts.forEach(p => { onGround(p); occupied.push({ x: p.x, z: p.z, r: 19 }); });
    ribbon(riverPts, 42, 0.04, toon('#e3edf8', { side: THREE.DoubleSide }), 40, W / 2 + 10);
    const iceTex = ctex(256, 256, g => {
      g.fillStyle = '#b3d8f0'; g.fillRect(0, 0, 256, 256);
      // 吹き寄せた雪の筋と、氷のひび、犬ぞりの跡
      for (let i = 0; i < 70; i++) { g.fillStyle = `rgba(255,255,255,${rand(0.12, 0.3)})`; g.beginPath(); g.ellipse(rand(0, 256), rand(0, 256), rand(3, 8), rand(10, 30), rand(-0.2, 0.2), 0, Math.PI * 2); g.fill(); }
      g.strokeStyle = 'rgba(60,120,185,.22)'; g.lineWidth = 1;
      for (let i = 0; i < 16; i++) { g.beginPath(); let x = rand(0, 256), y = rand(0, 256); g.moveTo(x, y); for (let k = 0; k < 5; k++) { x += rand(-22, 22); y += rand(-22, 22); g.lineTo(x, y); } g.stroke(); }
      g.strokeStyle = 'rgba(140,170,205,.5)'; g.lineWidth = 2; for (const x of [92, 104, 150, 162]) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 256); g.stroke(); }
    }, true);
    ribbon(riverPts, 32, 0.1, toon('#ffffff', { map: iceTex, side: THREE.DoubleSide }), 32, W / 2 + 12);

    // 氷のホテル：川の氷のブロックと雪で毎冬建て直す、かまぼこ形の長いホール。正面に氷の柱の入口とトナカイの毛皮の扉
    const g = site('氷のホテル（ユッカスヤルヴィ）', at(1, 0.3), W / 2 + 30, 38, 20, '#e8f0fa', W / 2 + 22);
    const vault = new THREE.CylinderGeometry(1, 1, 1, 20, 1, false, 0, Math.PI); vault.rotateZ(Math.PI / 2);
    addBox(g, [32, 2.6, 14], [0, 1.3, 1], snowM, null, 0.02); part(g, vault, snowM, [0, 2.6, 1], [32, 4.2, 7], null, 0.02);
    for (const x of [-11, 11]) { addBox(g, [7, 2.2, 9], [x, 1.1, -9.5], snowM, null, 0.02); part(g, vault, snowM, [x, 2.2, -9.5], [7, 3, 4.5], null, 0.02); }
    for (const x of [-2.6, 2.6]) addBox(g, [1.4, 5.6, 1.4], [x, 2.8, -6.4], iceM, null, 0.02);
    addBox(g, [7, 1.2, 1.6], [0, 6.2, -6.4], iceM, null, 0.02); addBox(g, [3.6, 4.6, 0.25], [0, 2.3, -6.1], toon('#6b5240'));
    for (let x = -14; x <= 14; x += 3.5) if (Math.abs(x) > 4) addBox(g, [1.2, 1.4, 0.2], [x, 1.7, -6.05], iceDeep);
    for (const x of [-11, 11]) addBox(g, [2.4, 1.6, 0.2], [x, 1.2, -14.05], iceDeep);
    // 切り出した氷のブロックの山（川側）
    for (let i = 0; i < 18; i++) addBox(g, [1.6, 1.2, 1.6], [-12 + (i % 6) * 1.8, 0.6 + Math.floor(i / 12) * 1.2, 7.5 + (Math.floor(i / 6) % 2) * 1.8], iceM);
    g.updateMatrixWorld(true);
    stamp(reindeerTpl(iceM), [{ p: g.localToWorld(new V3(-6, 0.3, -9)), yaw: g.rotation.y + Math.PI / 2, sc: 1.2 }, { p: g.localToWorld(new V3(6, 0.3, -9)), yaw: g.rotation.y + Math.PI / 2, sc: 1.2 }], false);
    for (let i = 0; i < 8; i++) addPerson(g.localToWorld(new V3(rand(-8, 8), 0, rand(-13, -8))));
    signAt(g, '氷のホテル（ユッカスヤルヴィ）', 12, 17);

    // 氷の礼拝堂：雪の壁にとがった氷の切妻と、氷の鐘楼
    const ch = site('氷の礼拝堂', at(1, 0.56), W / 2 + 28, 14, 14, '#e8f0fa', W / 2 + 22);
    addBox(ch, [10, 4, 7], [0, 2, 1], snowM, null, 0.02); part(ch, PRISM, iceM, [0, 4, 1], [10.6, 3.6, 7.6], null, 0.02);
    addBox(ch, [2.2, 7, 2.2], [0, 3.5, -3.5], iceM, null, 0.02); part(ch, roof4, iceM, [0, 8.5, -3.5], [1.9, 3, 1.9], null, 0.02);
    addBox(ch, [1.6, 2.6, 0.2], [0, 1.3, -4.65], iceDeep);
    signAt(ch, '氷の礼拝堂', 13, 9);

    // ユッカスヤルヴィ教会：赤い板張りの木造教会と、離れて建つ鐘楼
    const k = site('ユッカスヤルヴィ教会', at(1, 0.8), W / 2 + 30, 22, 16, '#e8f0fa', W / 2 + 22);
    addBox(k, [14, 5, 8], [-2, 2.5, 2], falu, null, 0.02); part(k, PRISM, toon('#3a3434'), [-2, 5, 2], [14.6, 4.2, 9], null, 0.02);
    part(k, PRISM, snowM, [-2, 5.25, 2], [14.4, 4.1, 8.6], null, 0);
    for (const [x, z] of [[-9, -2], [5, -2], [-9, 6], [5, 6]]) addBox(k, [0.3, 5, 0.3], [x, 2.5, z], trim);
    for (let x = -7; x <= 3; x += 3.3) addBox(k, [1, 1.8, 0.2], [x, 2.8, -2.05], warm);
    addBox(k, [3, 3, 3], [-9.6, 6.2, 2], falu, null, 0.02); part(k, roof4, toon('#3a3434'), [-9.6, 9.3, 2], [2.5, 3.2, 2.5], null, 0.02); part(k, CYL, toon('#d9b24c'), [-9.6, 11.4, 2], [0.06, 1.4, 0.06], null, 0);
    addBox(k, [3, 5.5, 3], [8, 2.75, -3], falu, null, 0.02); part(k, roof4, toon('#3a3434'), [8, 7.2, -3], [2.6, 3.4, 2.6], null, 0.02);
    signAt(k, 'ユッカスヤルヴィ教会', 13, 13);

    // 犬ぞり：6頭のハスキーが引くそりと、後ろに立つ御者。凍った川の上を行き来する
    const r = route(riverPts.slice(36, riverPts.length - 36), false), teams = [];
    for (let i = 0; i < 2; i++) {
      const tg = fantasyGroup(); tg.userData.droneIgnore = true; const dogs = [];
      for (let k2 = 0; k2 < 3; k2++) for (const z of [-0.35, 0.35]) {
        const d = new THREE.Group(); d.position.set(2.4 + k2 * 1.15, 0, z); tg.add(d); dogs.push(d);
        part(d, SPH_LO, toon(k2 % 2 ? '#8e98a3' : '#5f6670'), [0, 0.55, 0], [0.45, 0.22, 0.18], null, 0); part(d, SPH_LO, toon('#f2f2f2'), [0.42, 0.72, 0], [0.17, 0.14, 0.13], null, 0);
        for (const e of [-0.06, 0.06]) part(d, CONE, toon('#4f565e'), [0.4, 0.88, e], [0.04, 0.1, 0.04], null, 0);
        part(d, SPH_LO, toon('#f2f2f2'), [-0.48, 0.68, 0], [0.12, 0.08, 0.08], [0, 0, 0.8], 0);
        for (const [x, zz] of [[0.25, 0.08], [0.25, -0.08], [-0.25, 0.08], [-0.25, -0.08]]) addBox(d, [0.06, 0.4, 0.06], [x, 0.2, zz], toon('#4a4f55'));
      }
      addBox(tg, [3.6, 0.03, 0.03], [3.6, 0.5, 0], darkWood);
      addBox(tg, [1.8, 0.15, 0.7], [0, 0.45, 0], wood); for (const z of [-0.32, 0.32]) addBox(tg, [2.3, 0.06, 0.06], [-0.1, 0.08, z], darkWood);
      addBox(tg, [0.08, 1, 0.8], [-0.85, 1.0, 0], darkWood); addBox(tg, [1.2, 0.5, 0.6], [0.2, 0.75, 0], toon(i ? '#2f5fa8' : '#c8302c'));
      figure(tg, -1.15, 0.15, 0, i ? '#d8343a' : '#1f2a44');
      teams.push({ g: tg, dogs, off: i * r.L * 0.6, v: 5.5 + i });
    }
    updates.push(t => {
      const m = reduced.matches ? 0 : t, span = r.L - 10;
      for (const tm of teams) {
        const k2 = mod(m * tm.v + tm.off, span * 2), back = k2 > span, { p, yaw } = r.at((back ? span * 2 - k2 : k2) + 5);
        tm.g.position.set(p.x, p.y + 0.12, p.z); tm.g.rotation.y = yaw + (back ? Math.PI : 0);
        tm.dogs.forEach((d, i) => { d.position.y = Math.abs(Math.sin(m * 9 + i * 1.3)) * 0.12; });
      }
    });
  }

  /* ---- 第2区間：深雪の上り。外にキルナの鉄鉱山（キールナヴァーラ）、引っ越すキルナ教会、鉄鉱石を運ぶ長い列車 ---- */
  {
    // 鉄鉱山：段々に削られた山。頂には選鉱場の建物と、立坑の櫓
    const s = at(2, 0.6), c = onGround(local(s, 0, W / 2 + 185)), g = registerLandmark(fantasyGroup(c), 'キルナの鉄鉱山（キールナヴァーラ）'); g.rotation.y = yawAt(s);
    for (let k = 0; k < 6; k++) {
      const w = 190 - k * 24, d = 70 - k * 9;
      addBox(g, [w, 9, d], [0, k * 9 + 4.5 - 6, 0], toon(k % 2 ? '#5e6675' : '#687183'), null, 0.01);
      addBox(g, [w - 3, 0.8, d - 3], [0, k * 9 + 3, 0], snowM);
    }
    addBox(g, [26, 12, 16], [-14, 54, 0], toon('#8a8f99'), null, 0.02); addBox(g, [12, 22, 10], [8, 59, 2], toon('#7d828c'), null, 0.02);
    addBox(g, [5, 34, 5], [24, 65, -4], toon('#9a9fa8'), null, 0.02); addBox(g, [8, 5, 8], [24, 84, -4], toon('#6f747e'), null, 0.02);
    for (let i = 0; i < 26; i++) addBox(g, [1.2, 0.8, 0.2], [rand(-24, 12), rand(50, 66), -8.15], warm);
    for (let i = 0; i < 40; i++) { const k = (Math.random() * 6) | 0; addBox(g, [0.8, 0.8, 0.8], [rand(-(190 - k * 24) / 2, (190 - k * 24) / 2), k * 9 + 3.8, -(70 - k * 9) / 2 + 1], warm); }
    signAt(g, 'キルナの鉄鉱山', 95, 18);
    occupied.push({ x: c.x, z: c.z, r: 100 });
  }
  const railPts = outerPath(at(2, 0.05), at(3, 0.7), W / 2 + 100, 45, 6);
  {
    // 鉄鉱石の線路（マルムバーナン）：砂利の道床と枕木
    railPts.forEach(p => { onGround(p); occupied.push({ x: p.x, z: p.z, r: 5 }); });
    const sleeperTex = ctex(64, 128, g => { g.fillStyle = '#8b8d92'; g.fillRect(0, 0, 64, 128); for (let y = 4; y < 128; y += 16) { g.fillStyle = '#5a4434'; g.fillRect(6, y, 52, 7); } g.fillStyle = '#c9ccd2'; g.fillRect(17, 0, 4, 128); g.fillRect(43, 0, 4, 128); }, true);
    ribbon(railPts, 4.4, 0.18, toon('#ffffff', { map: sleeperTex, side: THREE.DoubleSide }), 4, W / 2 + 12);
    // 架線柱
    const masts = [];
    for (let i = 4; i < railPts.length - 1; i += 6) { const p = railPts[i], d = railPts[i + 1].clone().sub(p).setY(0).normalize(), q = p.clone().add(new V3(-d.z * 3.2, 0, d.x * 3.2)); masts.push({ p: q.clone().setY(groundAt(q) + 3.5), s: new V3(0.18, 7, 0.18) }); }
    addInst(CYL, steel, masts, false);
    const r = route(railPts, false), cars = [];
    const car = loco => {
      const g = fantasyGroup(); g.userData.droneIgnore = true;
      if (loco) {
        addBox(g, [19, 3.6, 3.2], [0, 2.6, 0], toon('#2c3e5c'), null, 0.02); addBox(g, [19.1, 0.4, 3.3], [0, 1.6, 0], toon('#f2c230'));
        for (const x of [-8.6, 8.6]) addBox(g, [0.8, 1.4, 3.0], [x, 3.6, 0], toon('#bfe0f2'));
        addBox(g, [0.3, 0.3, 0.3], [9.6, 2.4, 1.1], warm); addBox(g, [0.3, 0.3, 0.3], [9.6, 2.4, -1.1], warm);
      } else {
        addBox(g, [10, 2.6, 3], [0, 2.1, 0], toon('#4f3a2e'), null, 0.02); addBox(g, [9.4, 0.5, 2.6], [0, 3.5, 0], toon('#7a3a28'));
        for (let x = -4; x <= 4; x += 2) addBox(g, [0.25, 2.6, 3.05], [x, 2.1, 0], toon('#3e2d24'));
      }
      for (const x of loco ? [-6, -3.5, 3.5, 6] : [-3.6, 3.6]) for (const z of [-1.1, 1.1]) part(g, CYL, toon('#222428'), [x, 0.6, z], [0.45, 0.25, 0.45], [Math.PI / 2, 0, 0], 0);
      return g;
    };
    for (let i = 0; i < 20; i++) { const loco = i < 2; cars.push({ g: car(loco), off: i < 2 ? i * 19.5 : 39 + (i - 2) * 10.6 + 5.3 - 9.75 }); }
    updates.push(t => {
      const m = reduced.matches ? 30 : t, head = mod(m * 14, r.L + 260) - 30;
      for (const c of cars) {
        const u = head - c.off; c.g.visible = u > 2 && u < r.L - 2; if (!c.g.visible) continue;
        const a = r.at(u - 4).p.clone(), b = r.at(u + 4).p.clone(), p = a.clone().lerp(b, 0.5);
        c.g.position.set(p.x, p.y + 0.15, p.z); c.g.rotation.set(0, -Math.atan2(b.z - a.z, b.x - a.x), 0); c.g.rotateZ(Math.atan2(b.y - a.y, Math.hypot(b.x - a.x, b.z - a.z)));
      }
    });
    registerLandmark(fantasyGroup(railPts[(railPts.length / 2) | 0].clone()), '鉄鉱石列車（マルムバーナン）');
  }
  {
    // キルナ教会：サーミの小屋の形を写した、大きな赤い木造の教会。町の移転に合わせて、運搬車に載って新しい町の中心へ引っ越す
    const g = site('キルナ教会（引っ越し中）', at(2, 0.42), W / 2 + 36, 30, 26, '#e8f0fa', W / 2 + 26);
    addBox(g, [26, 1.2, 20], [0, 1.1, 0], toon('#f0a020'), null, 0.02);
    for (let x = -11; x <= 11; x += 2.75) for (const z of [-8.6, -4, 4, 8.6]) part(g, CYL, toon('#222428'), [x, 0.5, z], [0.5, 0.45, 0.5], [Math.PI / 2, 0, 0], 0);
    const red = toon('#8a2a22'), roofR = toon('#5e1d18');
    addBox(g, [20, 3.6, 14], [0, 3.5, 0], red, null, 0.02);
    part(g, roof4, roofR, [0, 12.3, 0], [17, 14, 12.8], null, 0.02);
    for (let x = -8; x <= 8; x += 4) addBox(g, [1.2, 2, 0.2], [x, 3.6, -7.05], warm);
    addBox(g, [3.4, 6, 3.4], [0, 17, 0], red, null, 0.02); part(g, roof4, roofR, [0, 22.5, 0], [3, 5, 3], null, 0.02); part(g, CYL, toon('#d9b24c'), [0, 26, 0], [0.12, 2.4, 0.12], null, 0);
    g.updateMatrixWorld(true);
    for (let i = 0; i < 12; i++) addPerson(g.localToWorld(new V3(rand(-13, 13), 0, rand(-16, -12))));
    // 運搬車を先導する人と、離れて待つ鐘楼
    const b = g.localToWorld(new V3(17, 0, 4));
    const bt = registerLandmark(fantasyGroup(onGround(b)), 'キルナ教会の鐘楼'); bt.rotation.y = g.rotation.y;
    addBox(bt, [4, 7, 4], [0, 3.5, 0], red, null, 0.02); part(bt, roof4, roofR, [0, 9.5, 0], [3.4, 5, 3.4], null, 0.02); part(bt, CYL, toon('#d9b24c'), [0, 12.6, 0], [0.08, 1.4, 0.08], null, 0);
    signAt(g, 'キルナ教会（2025年に引っ越し）', 30, 18);
  }

  /* ---- 第3区間：アビスコ。ヌオリャ山の頂のオーロラ観測所へ、山麓駅からリフトが上る（コースのいちばん高いところ） ---- */
  const nuolja = { c: onGround(local(at(3, 0.45), 0, W / 2 + 215)), rx: 100, ry: 78, rz: 100, y0: 0 };
  nuolja.y0 = nuolja.c.y - 10;
  const domeY = p => { const a = (p.x - nuolja.c.x) / nuolja.rx, b = (p.z - nuolja.c.z) / nuolja.rz, q = 1 - a * a - b * b; return q > 0 ? nuolja.y0 + nuolja.ry * Math.sqrt(q) : -1e9; };
  {
    const { c, rx, ry, rz, y0 } = nuolja;
    part(world, SPH, snowM, [c.x, y0, c.z], [rx, ry, rz], null, 0);
    const away = c.clone().sub(local(at(3, 0.45), 0, 0)).setY(0).normalize(), sideN = new V3(-away.z, 0, away.x);
    for (const [k, f, h] of [[-1, 0.55, 0.62], [1, 0.6, 0.5]]) { const q = c.clone().addScaledVector(sideN, k * rx * 0.85).addScaledVector(away, rx * 0.35); part(world, SPH, snowM, [q.x, y0, q.z], [rx * f, ry * h, rz * f], null, 0); }
    const rocks = [];
    for (let k = 0; k < 34; k++) { const b = rand(0, Math.PI * 2), hf = rand(0.45, 0.92), q = Math.sqrt(1 - hf * hf) * 1.005; rocks.push({ p: new V3(c.x + Math.cos(b) * rx * q, y0 + ry * hf, c.z + Math.sin(b) * rz * q), s: new V3(rand(5, 9), rand(0.6, 1.2), rand(1, 2)), r: [0, -b, 0] }); }
    addInst(SPH_LO, toon('#9aa5b6'), rocks, false);
    occupied.push({ x: c.x, z: c.z, r: rx * 0.98 });
    // 頂の観測所：ガラス張りの展望室と、空を見上げる展望デッキ
    const top = new V3(c.x, y0 + ry, c.z), toTrack = local(at(3, 0.45), 0, 0).sub(top).setY(0).normalize();
    const g = registerLandmark(fantasyGroup(top.clone().add(new V3(0, -0.6, 0))), 'オーロラ観測所（ヌオリャ山）'); g.rotation.y = -Math.atan2(toTrack.z, toTrack.x) + Math.PI / 2;
    addBox(g, [16, 5, 9], [0, 2.5, 2], toon('#4a3a30'), null, 0.02); addBox(g, [16.1, 2, 9.1], [0, 3, 2], toon('#9fd4ff', { emissive: C('#6fb8ff'), emissiveIntensity: 0.6 }));
    addBox(g, [17, 0.6, 10], [0, 5.3, 2], snowM); addBox(g, [12, 0.4, 6], [0, 1.6, -5], wood);
    for (const x of [-6, 6]) addBox(g, [0.15, 1.2, 6], [x, 2.2, -5], darkWood); addBox(g, [12, 1.2, 0.15], [0, 2.2, -8], darkWood);
    part(g, CYL, steel, [5, 8, 4], [0.15, 6, 0.15], null, 0);
    for (let i = 0; i < 5; i++) figure(g, rand(-5, 5), 1.8, rand(-7, -3), pick(['#d8343a', '#2f5fa8', '#f2c230', '#2f8a4a']));
    signAt(g, 'オーロラ観測所（ヌオリャ山）', 12, 18);
    // 山麓駅とリフト
    const foot = onGround(local(at(3, 0.45), 0, W / 2 + 34)), sumP = top.clone().addScaledVector(toTrack, 9).setY(top.y + 4.5);
    const dir = sumP.clone().sub(foot).setY(0).normalize(), side = new V3(-dir.z, 0, dir.x), yaw = -Math.atan2(dir.z, dir.x);
    const st = registerLandmark(fantasyGroup(foot), 'リフトの山麓駅（アビスコ）'); st.rotation.y = yaw;
    landmarkFoundation(st, 12, 10, '#e8f0fa');
    addBox(st, [8, 4, 8], [-3, 2, 0], wood, null, 0.02); part(st, PRISM, toon('#3a3434'), [-3, 4, 0], [8.6, 2.4, 8.8], null, 0.02); part(st, PRISM, snowM, [-3, 4.2, 0], [8.4, 2.3, 8.4], null, 0);
    for (const z of [-2, 2]) addBox(st, [0.6, 7, 0.6], [2, 3.5, z], steel); part(st, CYL, toon('#c33a32'), [2, 7, 0], [2.4, 0.4, 2.4], null, 0);
    signAt(st, 'リフトの山麓駅', 10.5, 10);
    const A = foot.clone().addScaledVector(dir, 2).setY(st.position.y + 7), B = sumP.clone(), Lline = A.distanceTo(B);
    const cables = [], towers = [];
    for (const sd of [-1.4, 1.4]) cables.push(beam(A.clone().addScaledVector(side, sd), B.clone().addScaledVector(side, sd), 0.06));
    for (let k = 1; k < 8; k++) {
      const p = A.clone().lerp(B, k / 8), base = Math.max(groundAt(p), domeY(p));
      if (p.y - base < 4) continue;
      towers.push({ p: new V3(p.x, (base + p.y + 0.6) / 2, p.z), s: new V3(0.35, p.y + 0.6 - base, 0.35) });
      cables.push(beam(p.clone().addScaledVector(side, -1.8).setY(p.y + 0.6), p.clone().addScaledVector(side, 1.8).setY(p.y + 0.6), 0.3));
      occupied.push({ x: p.x, z: p.z, r: 3 });
    }
    addInst(BOX, toon('#2a2a30'), cables, false); addInst(CYL, steel, towers, false);
    for (let k = 0; k <= 8; k++) { const p = foot.clone().lerp(sumP, k / 8); occupied.push({ x: p.x, z: p.z, r: 5 }); }
    occupied.push({ x: foot.x, z: foot.z, r: 9 });
    const chairs = [];
    for (let i = 0; i < 16; i++) {
      const cg = fantasyGroup(); cg.userData.droneIgnore = true; cg.rotation.y = yaw + Math.PI / 2;
      addBox(cg, [0.08, 2.2, 0.08], [0, -1.1, 0], steel); addBox(cg, [1.6, 0.15, 0.7], [0, -2.3, 0], toon('#c33a32')); addBox(cg, [1.6, 0.8, 0.1], [0, -1.9, 0.35], toon('#c33a32'));
      if (Math.random() < 0.7) figure(cg, -0.35, -3.25, 0.1, pick(['#d8343a', '#2f5fa8', '#f2c230', '#1f2a44']), 0.8);
      if (Math.random() < 0.5) figure(cg, 0.35, -3.25, 0.1, pick(['#d8343a', '#2f5fa8', '#f2c230', '#1f2a44']), 0.8);
      chairs.push({ g: cg, u: i / 16 * Lline * 2 });
    }
    updates.push(t => {
      const m = reduced.matches ? 0 : t;
      for (const c2 of chairs) {
        const u = mod(c2.u + m * 2.2, Lline * 2), up = u < Lline, k = up ? u / Lline : 2 - u / Lline;
        c2.g.position.lerpVectors(A, B, k).addScaledVector(side, up ? -1.4 : 1.4); c2.g.rotation.z = Math.sin(m * 1.1 + c2.u) * 0.04;
      }
    });
  }

  /* ---- 第4区間：ラポニアの台地。サーミの冬の宿営（ラヴヴ、芝土の小屋ゴアフティ、高床の倉ニャッラ、焚き火）とトナカイの囲い ---- */
  {
    const s = at(4, 0.45), g = site('サーミの冬の宿営（世界遺産ラポニア地域）', s, W / 2 + 36, 46, 34, '#e8f0fa', W / 2 + 22);
    g.updateMatrixWorld(true);
    const W2 = (x, z) => g.localToWorld(new V3(x, 0, z));
    // ラヴヴ：布張りの円錐の天幕。頂から支柱が突き出す
    const lavvu = (x, z, sc, col) => {
      part(g, new THREE.ConeGeometry(1, 1, 14, 1, true).translate(0, 0.5, 0), toon(col, { side: THREE.DoubleSide }), [x, 0, z], [2.6 * sc, 4.6 * sc, 2.6 * sc], null, 0.02);
      part(g, new THREE.CylinderGeometry(0.93, 1, 1, 14, 1, true).translate(0, 0.5, 0), toon('#6b5a48', { side: THREE.DoubleSide }), [x, 0, z], [2.62 * sc, 0.5 * sc, 2.62 * sc], null, 0);
      for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2, b = new V3(x + Math.cos(a) * 2.4 * sc, 0, z + Math.sin(a) * 2.4 * sc), tip = new V3(x - Math.cos(a) * 0.5 * sc, 5.6 * sc, z - Math.sin(a) * 0.5 * sc); const bm = beam(b, tip, 0.1); part(g, BOX, darkWood, [bm.p.x, bm.p.y, bm.p.z], [bm.s.x, bm.s.y, bm.s.z], bm.r, 0); }
      addBox(g, [0.1, 2.2 * sc, 1.2 * sc], [x - 2.02 * sc, 1.1 * sc, z], toon('#8e2f2a'), [0, 0, -0.5]);
      smokes.push(g.localToWorld(new V3(x, 5 * sc, z)));
    };
    lavvu(-14, 4, 1.15, '#ddd2bb'); lavvu(-4, 10, 1, '#d2c6ad'); lavvu(8, 9, 0.9, '#e2d8c4'); lavvu(16, 2, 1, '#d8ccb2');
    // ゴアフティ：芝土で覆った丸い小屋に雪が積もる
    part(g, HALF, toon('#7a6a52'), [-15, 0, -8], [4, 3.2, 4], null, 0.02); part(g, HALF, snowM, [-15, 0.35, -8], [3.85, 3.05, 3.85], null, 0);
    addBox(g, [1.4, 2, 0.4], [-15, 1, -11.9], darkWood); part(g, CYL, steel, [-14, 3.6, -7.5], [0.15, 1.6, 0.15], null, 0); smokes.push(g.localToWorld(new V3(-14, 4.5, -7.5)));
    // ニャッラ：1本の柱に載せた高床の倉と、刻みを入れた丸太のはしご
    part(g, CYL, wood, [20, 1.7, -10], [0.3, 3.4, 0.3], null, 0); addBox(g, [2.2, 1.8, 2.2], [20, 4.3, -10], wood, null, 0.02);
    part(g, PRISM, darkWood, [20, 5.2, -10], [2.8, 1.3, 2.8], null, 0.02); part(g, PRISM, snowM, [20, 5.35, -10], [2.7, 1.2, 2.6], null, 0);
    addBox(g, [0.25, 4, 0.25], [20, 2, -11.8], wood, [0.45, 0, 0]);
    // 焚き火（アーラン）：トナカイの毛皮を敷いて囲む
    const fireP0 = W2(2, -6); fires.push(fireP0.clone().setY(g.position.y + 0.6));
    part(g, new THREE.ConeGeometry(0.6, 1.4, 8), warm, [2, 0.7, -6], null, null, 0);
    for (let k = 0; k < 4; k++) addBox(g, [1.6, 0.2, 0.2], [2, 0.15, -6], darkWood, [0, k * 0.8, 0]);
    for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2; addBox(g, [1.4, 0.06, 0.9], [2 + Math.cos(a) * 2.6, 0.05, -6 + Math.sin(a) * 2.6], toon(pick(['#8a7a68', '#5f5245', '#c9bfae'])), [0, -a, 0]); }
    for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2 + 0.3; addPerson(W2(2 + Math.cos(a) * 2.6, -6 + Math.sin(a) * 2.6), true, pick(['#2b4fa8', '#2b4fa8', '#c8302c'])); }
    for (let k = 0; k < 4; k++) addPerson(W2(rand(-18, 18), rand(-14, 14)), false, '#2b4fa8');
    // トナカイの囲い：杭と横木の輪の中にトナカイの群れ
    const pc = W2(4, 30), pr = 13, posts = [], rails = [];
    if (!taken(pc.x, pc.z, 12) && roadDist(pc.x, pc.z, 60) > W / 2 + 22) {
      for (let k = 0; k < 28; k++) {
        const a = k / 28 * Math.PI * 2, a2 = (k + 1) / 28 * Math.PI * 2, p = onGround(new V3(pc.x + Math.cos(a) * pr, 0, pc.z + Math.sin(a) * pr)), q = onGround(new V3(pc.x + Math.cos(a2) * pr, 0, pc.z + Math.sin(a2) * pr));
        posts.push({ p: p.clone().add(new V3(0, 0.8, 0)), s: new V3(0.1, 1.6, 0.1) });
        for (const y of [0.7, 1.3]) rails.push(beam(p.clone().add(new V3(0, y, 0)), q.clone().add(new V3(0, y, 0)), 0.08));
      }
      addInst(CYL, wood, posts, false); addInst(BOX, wood, rails, false);
      const herd = []; for (let k = 0; k < 16; k++) { const a = rand(0, Math.PI * 2), r = Math.sqrt(Math.random()) * (pr - 2.5); herd.push({ p: onGround(new V3(pc.x + Math.cos(a) * r, 0, pc.z + Math.sin(a) * r)), yaw: rand(0, Math.PI * 2), sc: rand(0.9, 1.1) }); }
      stamp(reindeerTpl(), herd);
      occupied.push({ x: pc.x, z: pc.z, r: pr + 2 });
    }
    signAt(g, 'サーミの冬の宿営（ラポニア）', 11, 17);
  }
  {
    // トナカイ橇の列（ライド）：スキーの先導役が、橇（アキヤ）を引くトナカイを数珠つなぎに導く
    const pts = outerPath(at(4, 0.05), at(5, 0.35), W / 2 + 24, 8, 6).map(p => onGround(p));
    pts.forEach(p => occupied.push({ x: p.x, z: p.z, r: 3 }));
    const r = route(pts, false), walkers = [];
    const lead = fantasyGroup(); lead.userData.droneIgnore = true; figure(lead, 0, 0.1, 0, '#2b4fa8');
    for (const z of [-0.18, 0.18]) addBox(lead, [2, 0.05, 0.12], [0, 0.05, z], toon('#c9a46a'));
    walkers.push({ g: lead, off: 0, legs: [] });
    for (let i = 0; i < 4; i++) {
      const g = fantasyGroup(); g.userData.droneIgnore = true; const legs = [];
      g.add(reindeerTpl(null, legs));
      part(g, SPH_LO, toon('#5a3f2c'), [-2.2, 0.35, 0], [1, 0.3, 0.45], null, 0.02); addBox(g, [1.6, 0.03, 0.03], [-1.2, 0.8, 0], darkWood);
      if (i % 2) part(g, SPH_LO, toon('#c8302c'), [-2.2, 0.7, 0], [0.6, 0.3, 0.35], null, 0);
      walkers.push({ g, off: 3.2 + i * 4.4, legs });
    }
    updates.push(t => {
      const m = reduced.matches ? 0 : t, span = r.L - 30;
      for (const w of walkers) {
        const k = mod(m * 1.6 + 40, span * 2), back = k > span, u = (back ? span * 2 - k : k) + 22 + (back ? w.off : -w.off), { p, yaw } = r.at(u);
        w.g.position.set(p.x, p.y, p.z); w.g.rotation.y = yaw + (back ? Math.PI : 0);
        w.legs.forEach((l, i) => { l.rotation.z = Math.sin(m * 6 + (i % 2 ? Math.PI : 0) + (i > 1 ? Math.PI : 0)) * 0.35; });
      }
    });
    registerLandmark(fantasyGroup(pts[(pts.length / 2) | 0].clone()), 'トナカイ橇の列（ライド）');
  }

  /* ---- 第5区間：トナカイ橇の下り。赤い十字の冬道の道しるべ、ファールンレッドの山小屋、林のヘラジカ ---- */
  {
    const pts = outerPath(at(4, 0.95), at(5, 0.8), W / 2 + 30, 20, 6).filter(p => !onLake(p.x, p.z)).map(p => onGround(p));
    ribbon(pts, 2.6, 0.06, toon('#d4e0ee', { side: THREE.DoubleSide }), 10, W / 2 + 14);
    const poles = [], crosses = [];
    for (let i = 3; i < pts.length - 1; i += 3) {
      const p = pts[i], d = pts[i + 1].clone().sub(p).setY(0).normalize(), q = p.clone().add(new V3(-d.z * 2.2, 0, d.x * 2.2)), yaw = -Math.atan2(d.z, d.x) + Math.PI / 2;
      if (roadDist(q.x, q.z, W) < W / 2 + 8) continue;
      onGround(q); poles.push({ p: q.clone().add(new V3(0, 1.2, 0)), s: new V3(0.06, 2.4, 0.06) });
      for (const a of [Math.PI / 4, -Math.PI / 4]) crosses.push({ p: q.clone().add(new V3(0, 2.2, 0)), s: new V3(0.9, 0.16, 0.05), r: [0, yaw, a] });
      occupied.push({ x: q.x, z: q.z, r: 1.2 });
    }
    pts.forEach(p => occupied.push({ x: p.x, z: p.z, r: 2.4 }));
    addInst(CYL, toon('#7a6a5a'), poles, false); addInst(BOX, toon('#d8343a'), crosses, false);
    registerLandmark(fantasyGroup(pts[(pts.length / 2) | 0].clone()), '赤い十字の道しるべ');
    // 山小屋（フィェルストゥーガ）：赤い板壁に白い窓枠、煙突から煙
    const g = site('ラップランドの山小屋', at(5, 0.55), W / 2 + 46, 16, 12, '#e8f0fa', W / 2 + 36);
    addBox(g, [9, 3.6, 6], [0, 1.8, 1], falu, null, 0.02); part(g, PRISM, toon('#3a3434'), [0, 3.6, 1], [9.8, 2.6, 7], null, 0.02); part(g, PRISM, snowM, [0, 3.8, 1], [9.6, 2.5, 6.6], null, 0);
    for (const x of [-4.5, 4.5]) for (const z of [-2, 4]) addBox(g, [0.25, 3.6, 0.25], [x, 1.8, z], trim);
    for (const x of [-2.4, 2.4]) { addBox(g, [1.4, 1.2, 0.15], [x, 2, -2.05], trim); addBox(g, [1.1, 0.9, 0.18], [x, 2, -2.06], warm); }
    addBox(g, [1.2, 2.4, 0.15], [0, 1.2, -2.05], toon('#f2efe6')); part(g, CYL, toon('#5a5a60'), [2.6, 5.4, 2], [0.3, 1.6, 0.3], null, 0); smokes.push(g.localToWorld(new V3(2.6, 6.3, 2)));
    for (let k = 0; k < 6; k++) addBox(g, [0.12, 1.9, 0.08], [-4 + k * 0.3, 0.95, -2.6], toon(pick(['#d8343a', '#2f5fa8', '#f2c230'])), [0.2, 0, 0]);
    for (let k = 0; k < 10; k++) part(g, CYL, wood, [5.5, 0.3 + (k % 3) * 0.6, -1 + Math.floor(k / 3) * 0.6], [0.28, 2.4, 0.28], [Math.PI / 2, 0, 0], 0);
    signAt(g, 'ラップランドの山小屋', 9, 12);
    // ヘラジカ
    const moose = [];
    for (let k = 0; k < 3; k++) { const p = onGround(local(at(5, 0.2 + k * 0.28), 0, W / 2 + rand(62, 80))); if (!taken(p.x, p.z, 3)) { moose.push({ p, yaw: rand(0, Math.PI * 2), sc: 1 }); occupied.push({ x: p.x, z: p.z, r: 4 }); } }
    stamp(mooseTpl(), moose);
    if (moose.length) registerLandmark(fantasyGroup(moose[0].p.clone()), 'ヘラジカ');
  }

  /* ---- 第6区間の外：凍ったトーネトレスク湖。氷上の穴釣り、スノーモービル、トウヒの枝で印をつけた氷の道 ---- */
  {
    const shape = new THREE.Shape(lakePts.map(p => new THREE.Vector2(p.x, -p.z)));
    const geo = new THREE.ShapeGeometry(shape, 4); geo.rotateX(-Math.PI / 2);
    const lakeTex = ctex(256, 256, g => {
      g.fillStyle = '#b7d9f0'; g.fillRect(0, 0, 256, 256);
      for (let i = 0; i < 90; i++) { g.fillStyle = `rgba(255,255,255,${rand(0.12, 0.32)})`; g.beginPath(); g.ellipse(rand(0, 256), rand(0, 256), rand(8, 26), rand(3, 8), rand(-0.3, 0.3), 0, Math.PI * 2); g.fill(); }
      g.strokeStyle = 'rgba(70,130,190,.22)'; g.lineWidth = 1;
      for (let i = 0; i < 12; i++) { g.beginPath(); let x = rand(0, 256), y = rand(0, 256); g.moveTo(x, y); for (let k = 0; k < 6; k++) { x += rand(-24, 24); y += rand(-24, 24); g.lineTo(x, y); } g.stroke(); }
    }, true);
    lakeTex.repeat.set(1 / 70, 1 / 70);
    const lake = new THREE.Mesh(geo, toon('#ffffff', { map: lakeTex, side: THREE.DoubleSide })); lake.position.y = 0.05; lake.receiveShadow = true; world.add(lake);
    registerLandmark(fantasyGroup(local(at(6, 0.5), 0, W / 2 + 90)), 'トーネトレスク湖（凍った湖）');
    { const q = onGround(local(at(6, 0.5), 0, W / 2 + 16)), g = fantasyGroup(q); signAt(g, 'トーネトレスク湖（凍った湖）', 5, 15); occupied.push({ x: q.x, z: q.z, r: 4 }); }
    // 氷上の穴釣り：小さな穴の脇に座る釣り人と、ところどころに風よけの小さな天幕
    const holes = [], rods = [], tents = [];
    const lakeAt = (s, v) => { const p = local(s, 0, v); p.y = 0.05; return p; };
    for (let k = 0; k < 16; k++) {
      const p = lakeAt(rand(at(6, 0.1), at(6, 0.95)), W / 2 + rand(40, 120)), a = rand(0, Math.PI * 2);
      holes.push({ p: p.clone().add(new V3(0, 0.02, 0)), s: new V3(0.45, 1, 0.45) });
      const sitP = p.clone().add(new V3(Math.cos(a) * 0.9, 0, Math.sin(a) * 0.9)); addPerson(sitP, true);
      rods.push(beam(sitP.clone().add(new V3(0, 0.9, 0)), p.clone().add(new V3(0, 0.25, 0)), 0.03));
      if (k % 4 === 0) tents.push({ p: p.clone().add(new V3(-Math.cos(a) * 2.2, 0.9, -Math.sin(a) * 2.2)), s: new V3(1.4, 1.8, 1.4), r: [0, a, 0], c: C(pick(['#d8343a', '#ff8a3a', '#2f5fa8'])) });
    }
    addInst(new THREE.CircleGeometry(1, 14).rotateX(-Math.PI / 2), toon('#2f5f8a'), holes, false); addInst(BOX, darkWood, rods, false); addInst(roof4, toon('#ffffff'), tents);
    registerLandmark(fantasyGroup(lakeAt(at(6, 0.5), W / 2 + 80)), '氷上の穴釣り');
    // 氷の道：トウヒの枝を立てて印にした、湖を渡る道
    const twigs = []; for (let v = W / 2 + 30; v < W / 2 + 300; v += 9) { const p = lakeAt(at(6, 0.75) + Math.sin(v * 0.02) * 8, v); twigs.push({ p: p.clone().add(new V3(0, 0.6, 0)), s: new V3(0.3, 1.2, 0.3), c: C('#2a5a40') }); }
    addInst(coneG, toon('#ffffff'), twigs, false);
    // スノーモービル：湖の上で大きな輪を描く。後ろに雪煙
    const sleds = [];
    for (let i = 0; i < 3; i++) {
      const g = fantasyGroup(); g.userData.droneIgnore = true;
      addBox(g, [2.4, 0.7, 1.0], [0, 0.6, 0], toon(['#f2c230', '#d8343a', '#2f5fa8'][i]), null, 0.02); addBox(g, [0.5, 0.6, 0.9], [0.9, 1.15, 0], toon('#bfe0f2'), [0, 0, -0.4]);
      for (const z of [-0.45, 0.45]) addBox(g, [1.4, 0.06, 0.18], [1.1, 0.12, z], steel); addBox(g, [1.6, 0.3, 0.7], [-0.6, 0.2, 0], toon('#222428'));
      figure(g, -0.3, 0.3, 0, pick(['#1f2a44', '#d8343a', '#2f8a4a']), 0.85);
      const c = lakeAt(at(6, 0.25 + i * 0.3), W / 2 + 90 + i * 30);
      sleds.push({ g, c, r: rand(28, 45), ph: rand(0, 6), v: rand(0.25, 0.35) * (i % 2 ? 1 : -1) });
    }
    const spray = C('#ffffff');
    updates.push((t, dt) => {
      const m = reduced.matches ? 0 : t;
      for (const sl of sleds) {
        const a = m * sl.v + sl.ph; sl.g.position.set(sl.c.x + Math.cos(a) * sl.r, 0.05, sl.c.z + Math.sin(a) * sl.r * 0.6);
        const dx = -Math.sin(a) * sl.v, dz = Math.cos(a) * sl.r * 0.6 * sl.v / sl.r; sl.g.rotation.y = -Math.atan2(dz, dx);
        if (!reduced.matches && Math.random() < dt * 20) { const b = sl.g.position; dustP.emit(b.x - dx * 4, 0.4, b.z - dz * 4, rand(-0.5, 0.5), rand(0.5, 1.4), rand(-0.5, 0.5), 1.2, rand(0.6, 1.1), spray, 0.4, 1.5); }
      }
    });
  }

  /* ---- 第7区間の外：キルナ雪祭りの雪像。雪の台座に、トナカイ・フクロウ・馬・雪の城・オーロラの波 ---- */
  {
    let first = null; const glowDiscs = [];
    const sculpt = (k, s) => {
      const c = onGround(local(s, 0, W / 2 + 24)); if (taken(c.x, c.z, 5) || onLake(c.x, c.z)) return;
      const g = fantasyGroup(c); g.rotation.y = yawAt(s) + Math.PI / 2; if (!first) first = g;
      addBox(g, [7, 1.2, 7], [0, 0.6, 0], snowM, null, 0.02);
      glowDiscs.push({ p: c.clone().add(new V3(0, 0.08, 0)), s: new V3(5.5, 1, 5.5), c: C(['#7fb8ff', '#b48cff', '#7dffcf', '#ff8fd0', '#ffd27a'][k]) });
      if (k === 0) { const r = reindeerTpl(snowM); r.scale.setScalar(2.4); r.position.y = 1.2; r.rotation.y = -Math.PI / 2; g.add(r); }
      else if (k === 1) {
        part(g, SPH, snowM, [0, 3.6, 0], [2, 2.6, 1.8], null, 0.02); part(g, SPH, snowM, [0, 6.4, 0], [1.6, 1.4, 1.5], null, 0.02);
        for (const x of [-0.6, 0.6]) { part(g, SPH_LO, toon('#f2c230'), [x, 6.6, -1.3], [0.38, 0.38, 0.2], null, 0); part(g, SPH_LO, toon('#1a1a1a'), [x, 6.6, -1.45], [0.18, 0.18, 0.1], null, 0); part(g, CONE, snowM, [x * 1.6, 7.7, 0], [0.3, 0.8, 0.3], null, 0); }
      } else if (k === 2) {
        part(g, SPH, snowM, [0, 4.2, 0.6], [1.4, 3, 1.6], [0.35, 0, 0], 0.02); part(g, SPH, snowM, [0, 6.6, -1.6], [1.2, 1.1, 2.4], [-0.25, 0, 0], 0.02);
        for (const x of [-0.6, 0.6]) part(g, CONE, snowM, [x, 7.8, -0.9], [0.3, 0.9, 0.3], null, 0);
        for (let i = 0; i < 6; i++) part(g, SPH_LO, snowM, [0, 7.2 - i * 0.7, 1.4 + i * 0.25], [0.35, 0.6, 0.5], null, 0);
      } else if (k === 3) {
        addBox(g, [5, 3, 4], [0, 2.7, 0], snowM, null, 0.02);
        for (const [x, z] of [[-2.4, -1.9], [2.4, -1.9], [-2.4, 1.9], [2.4, 1.9]]) { part(g, CYL, snowM, [x, 3.6, z], [0.9, 4.8, 0.9], null, 0.02); part(g, CONE, iceM, [x, 6.7, z], [1.1, 1.6, 1.1], null, 0); }
        addBox(g, [1.4, 1.8, 0.2], [0, 2.1, -2.05], iceDeep);
      } else {
        for (let i = 0; i < 4; i++) part(g, SPH, i % 2 ? snowM : iceM, [-2.4 + i * 1.6, 3.2 + Math.sin(i * 1.4) * 1.2, 0], [1.2, 2.2, 0.6], [0, 0, 0.5], 0.02);
      }
      occupied.push({ x: c.x, z: c.z, r: 8 });
    };
    for (let k = 0; k < 5; k++) sculpt(k, at(7, 0.26 + k * 0.13));
    for (let s = at(7, 0.22); s < at(7, 0.98); s += 7) { const p = local(s, 0, W / 2 + 26); occupied.push({ x: p.x, z: p.z, r: 11 }); }
    addInst(new THREE.CircleGeometry(1, 20).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: C('#ffffff'), transparent: true, opacity: 0.45, depthWrite: false }), glowDiscs, false);
    if (first) { registerLandmark(first, 'キルナ雪祭りの雪像'); signAt(first, 'キルナ雪祭りの雪像', 11, 14); }
  }

  /* ---- 内馬場：ヨックモックの冬の市（屋台・焚き火・トナカイレース）と、氷の大トナカイ像（ファンタジー） ---- */
  let statue = null;
  {
    // 氷の大トナカイ像は内馬場のいちばん広いところ
    let best = null, bestD = 0;
    for (let k = 0; k < 600; k++) {
      const i = (Math.random() * track.N) | 0, p = new V3(track.xs[i], 0, track.zs[i]).lerp(new V3(0, 0, 0), rand(0.2, 1));
      if (!inLoop(p.x, p.z) || p.distanceTo(boardPos) < 45) continue;
      const d = roadDist(p.x, p.z, 160); if (d > bestD) { bestD = d; best = p; }
    }
    const c = onGround(best || new V3(0, 0, 0)), g = registerLandmark(fantasyGroup(c), '氷の大トナカイ像');
    addBox(g, [12, 2, 7], [0, 1, 0], snowM, null, 0.02); addBox(g, [10, 0.8, 5], [0, 2.4, 0], iceM, null, 0.02);
    const mat = toon('#c4ebff', { emissive: C('#6fc8ff'), emissiveIntensity: 0.3, transparent: true, opacity: 0.92 });
    const r = reindeerTpl(mat); r.scale.setScalar(4.2); r.position.y = 2.8; g.add(r);
    for (let k = 0; k < 18; k++) { const a = k / 18 * Math.PI * 2; snowLantern(onGround(c.clone().add(new V3(Math.cos(a) * 11, 0, Math.sin(a) * 9))), 1.2); }
    statue = { c, mat, g };
    occupied.push({ x: c.x, z: c.z, r: 22 });
    signAt(g, '氷の大トナカイ像', 19, 11);
  }
  {
    // トナカイレース：向正面（第3区間）の内側の直線。トナカイに引かれたスキーの乗り手が競う
    const s0 = at(3, 0.18), s1 = at(3, 0.82), v = -(W / 2 + 26);
    const A = onGround(local(s0, 0, v)), B = onGround(local(s1, 0, v)), lane = [];
    for (let k = 0; k <= 30; k++) lane.push(onGround(local(lerp(s0, s1, k / 30), 0, v)));
    const ok = lane.every(p => inLoop(p.x, p.z) && !taken(p.x, p.z, 6));
    if (ok) {
      const posts = [], ropes = [];
      for (const off of [-6, 6]) {
        const side = lane.map((p, k) => { const q = local(lerp(s0, s1, k / 30), 0, v + off); return onGround(q); });
        side.forEach((p, k) => { if (k % 2 === 0) posts.push({ p: p.clone().add(new V3(0, 0.6, 0)), s: new V3(0.08, 1.2, 0.08) }); if (k) ropes.push(beam(side[k - 1].clone().add(new V3(0, 1, 0)), p.clone().add(new V3(0, 1, 0)), 0.05)); });
        for (let k = 1; k < 30; k += 1) if (Math.random() < 0.6) { const q = side[k], d = off > 0 ? 1 : -1, nq = local(lerp(s0, s1, k / 30), 0, v + off + d * rand(1.2, 3)); addPerson(onGround(nq)); }
      }
      addInst(CYL, wood, posts, false); addInst(BOX, toon('#d8343a'), ropes, false);
      lane.forEach(p => occupied.push({ x: p.x, z: p.z, r: 10 }));
      const r = route(lane, false), racers = [];
      for (let i = 0; i < 3; i++) {
        const g = fantasyGroup(); g.userData.droneIgnore = true; const legs = [];
        const rd = reindeerTpl(null, legs); g.add(rd);
        addBox(g, [2.4, 0.03, 0.03], [-1.6, 0.9, 0], darkWood);
        figure(g, -3.2, 0.1, 0, ['#d8343a', '#2f5fa8', '#f2c230'][i], 0.9); for (const z of [-0.16, 0.16]) addBox(g, [2, 0.05, 0.12], [-3.2, 0.05, z], toon('#c9a46a'));
        racers.push({ g, legs, z: (i - 1) * 3.4, v: rand(0.9, 1.1) });
      }
      let heat = -1;
      updates.push(t => {
        const m = reduced.matches ? 0 : t, cyc = 22, k = mod(m, cyc), h = Math.floor(m / cyc);
        if (h !== heat) { heat = h; racers.forEach(rc => { rc.v = rand(0.85, 1.12); }); }
        for (const rc of racers) {
          const u = clamp(k * 9.5 * rc.v - 6, 0, r.L), { p, yaw } = r.at(u), nx = Math.sin(yaw), nz = Math.cos(yaw);
          rc.g.position.set(p.x + nx * rc.z, p.y, p.z + nz * rc.z); rc.g.rotation.y = yaw;
          const run = u > 0 && u < r.L; rc.legs.forEach((l, i) => { l.rotation.z = run ? Math.sin(m * 14 + (i % 2 ? Math.PI : 0) + (i > 1 ? Math.PI / 2 : 0)) * 0.5 : 0; });
        }
      });
      const sg = registerLandmark(fantasyGroup(A.clone().lerp(B, 0.5)), 'トナカイレース（ヨックモックの冬の市）');
      signAt(sg, 'トナカイレース', 7, 10);
    }
  }
  {
    // 冬の市の屋台：ホーム直線の内側に一列。板屋根の小屋に、トナカイの毛皮と手工芸、温かい飲み物
    const stallNames = ['トナカイの毛皮', 'サーミの手工芸', 'トナカイの干し肉', 'クラウドベリー', 'シナモンロール', '焚き火コーヒー', '手編みの手袋', 'ライ麦パン'];
    const posts = [], roofs = [], roofSnow = [], counters = [], goods = [], hides = [];
    let si = 0;
    for (let s = track.homeS0 + 24; s < track.homeS1 - 8 && si < stallNames.length; s += 10) {
      const v = -(W / 2 + 15), c2 = onGround(local(s, 0, v)), yaw = yawAt(s);
      if (!clearAt(c2.x, c2.z, W / 2 + 10, 3) || c2.distanceTo(boardPos) < 24) continue;
      // 局所 +z が走路の側。売り台は内馬場の客の側を向く
      const L = (x, y, z) => { const [ox, oz] = rot(x, z, yaw); return new V3(c2.x + ox, c2.y + y, c2.z + oz); };
      for (const [x, z] of [[-2.8, -1.8], [2.8, -1.8], [-2.8, 1.8], [2.8, 1.8]]) posts.push({ p: L(x, 1.5, z), s: new V3(0.12, 3, 0.12) });
      roofs.push({ p: L(0, 3.2, 0), s: new V3(6.6, 1.2, 4.8), r: [0, yaw, 0] }); roofSnow.push({ p: L(0, 3.35, 0), s: new V3(6.4, 1.15, 4.4), r: [0, yaw, 0] });
      counters.push({ p: L(0, 0.55, -1.4), s: new V3(5.4, 1.1, 1.2), r: [0, yaw, 0], c: C(pick(['#8a6244', '#6b4a33', '#a07a52'])) });
      for (let k = 0; k < 6; k++) goods.push({ p: L(rand(-2.3, 2.3), 1.25, rand(-1.8, -1)), s: new V3(0.32, 0.26, 0.32), c: C(pick(['#d8343a', '#f2c230', '#2f5fa8', '#f4f1ea', '#ff9a4a', '#2f8a4a'])) });
      for (const x of [-2.9, 2.9]) hides.push({ p: L(x, 1.7, 0), s: new V3(0.06, 1.8, 1.4), r: [0, yaw, 0], c: C(pick(['#8a7a68', '#5f5245', '#c9bfae'])) });
      putBoard(stallNames[si], L(0, 4.2, 2.3), yaw, 4.4); putBoard(stallNames[si++], L(0, 4.2, -2.3), yaw + Math.PI, 4.4);
      for (let k = 0; k < 3; k++) addPerson(onGround(L(rand(-2.6, 2.6), 0, rand(-3, -5.5))));
      occupied.push({ x: c2.x, z: c2.z, r: 4.4 });
    }
    addInst(CYL, darkWood, posts, false); addInst(PRISM, toon('#4a3a30'), roofs); addInst(PRISM, snowM, roofSnow, false);
    addInst(BOX, toon('#ffffff'), counters); addInst(SPH_LO, toon('#ffffff'), shuffle(goods), false); addInst(BOX, toon('#ffffff'), hides, false);
    // 市の焚き火と、まわりで暖を取る人
    for (let k = 0, n = 0; k < 300 && n < 4; k++) {
      const i = (Math.random() * track.N) | 0, p = new V3(track.xs[i], 0, track.zs[i]).lerp(new V3(0, 0, 0), rand(0.2, 0.8));
      if (!inLoop(p.x, p.z) || !clearAt(p.x, p.z, W / 2 + 18, 6)) continue;
      onGround(p); fires.push(p.clone().add(new V3(0, 0.6, 0)));
      const g = fantasyGroup(p); part(g, new THREE.ConeGeometry(0.5, 1.2, 8), warm, [0, 0.6, 0], null, null, 0);
      for (let j = 0; j < 8; j++) { const a = j / 8 * Math.PI * 2; part(g, SPH_LO, rockM, [Math.cos(a) * 1, 0.15, Math.sin(a) * 1], [0.3, 0.22, 0.3], null, 0); }
      for (let j = 0; j < 5; j++) { const a = j / 5 * Math.PI * 2 + 0.4; addPerson(p.clone().add(new V3(Math.cos(a) * 2.4, 0, Math.sin(a) * 2.4))); }
      occupied.push({ x: p.x, z: p.z, r: 4 }); n++;
    }
    registerLandmark(fantasyGroup(onGround(local(track.homeS0 + 60, 0, -(W / 2 + 15)))), 'ヨックモックの冬の市');
  }

  /* ---- 雪だるま：ラチ沿いにところどころ（マフラーの色はさまざま） ---- */
  {
    const sw = toon('#ffffff'), carrot = toon('#ff8a2a'), blk = new THREE.MeshBasicMaterial({ color: C('#222') });
    for (let i = 0; i < 10; i++) {
      const s = track.L * i / 10 + 20; if (mod(s, track.L) > track.homeS0 - 10 && mod(s, track.L) < track.homeS1 + 10) continue;
      const f = tp(s, W + rand(6, 9)); if (taken(f.v.x, f.v.z, 1.5) || onLake(f.v.x, f.v.z)) continue;
      const g = fantasyGroup(onGround(f.v.clone())); g.rotation.y = -f.h - Math.PI / 2;
      part(g, SPH, sw, [0, 1, 0], [1.1, 1.0, 1.1]); part(g, SPH, sw, [0, 2.35, 0], [0.8, 0.75, 0.8]); part(g, SPH, sw, [0, 3.4, 0], [0.55, 0.55, 0.55]);
      part(g, CONE, carrot, [0, 3.4, 0.62], [0.09, 0.4, 0.09], [Math.PI / 2, 0, 0], 0.1);
      for (const sd of [1, -1]) part(g, SPH_LO, blk, [0.2 * sd, 3.55, 0.48], [0.07, 0.08, 0.05], null, 0);
      part(g, new THREE.TorusGeometry(0.62, 0.14, 8, 20), toon(['#ff4f9a', '#46f0c6', '#ffcf3f', '#6fb3ff'][i % 4]), [0, 2.85, 0], [1, 1, 1], [Math.PI / 2, 0, 0], 0.05);
      occupied.push({ x: f.v.x, z: f.v.z, r: 1.6 });
    }
  }

  /* ---- 森：雪をかぶったトウヒの森。アビスコからラポニアの台地（第3〜5区間）とヌオリャ山の麓は山樺の林 ---- */
  {
    const birchS0 = at(2, 0.85), birchS1 = at(5, 0.4);
    for (let k = 0, n = 0; k < 7000 && n < 950; k++) {
      const s = rand(0, track.L), v = W / 2 + 10 + 210 * Math.random() ** 1.8, p = local(s, 0, v);
      if (!clearAt(p.x, p.z, W / 2 + 9, 2.4) || inLoop(p.x, p.z) || onLake(p.x, p.z)) continue;
      onGround(p);
      if (s > birchS0 && s < birchS1 && Math.random() < 0.75) addBirch(p, rand(0.9, 1.3)); else addSpruce(p, rand(0.9, 1.9) * (1 + (v - W / 2) / 300));
      occupied.push({ x: p.x, z: p.z, r: 1.8 }); n++;
    }
    // ヌオリャ山の麓の斜面の山樺（森林限界より下）
    for (let k = 0, n = 0; k < 900 && n < 90; k++) {
      const a = rand(0, Math.PI * 2), r = rand(0.7, 0.97), p = new V3(nuolja.c.x + Math.cos(a) * nuolja.rx * r, 0, nuolja.c.z + Math.sin(a) * nuolja.rz * r);
      const y = domeY(p); if (y < groundAt(p)) continue;
      if (roadDist(p.x, p.z, W) < W / 2 + 12) continue;
      p.y = y - 0.3; addBirch(p, rand(0.9, 1.3)); n++;
    }
    for (let k = 0, n = 0; k < 2500 && n < 55; k++) {
      const i = (Math.random() * track.N) | 0, p = new V3(track.xs[i], 0, track.zs[i]).lerp(new V3(0, 0, 0), rand(0.05, 1));
      if (!inLoop(p.x, p.z) || !clearAt(p.x, p.z, W / 2 + 9, 2.6)) continue;
      onGround(p); addSpruce(p, rand(0.9, 1.6)); occupied.push({ x: p.x, z: p.z, r: 2 }); n++;
    }
    shuffle(spruces); shuffle(birches);
    addInst(new THREE.CylinderGeometry(1, 1, 1, 6), toon('#5a3b2c'), spruces.map(t => t.trunk)); addInst(coneG, toon('#ffffff'), spruces.flatMap(t => t.green)); addInst(coneG, toon('#f6fbff'), spruces.flatMap(t => t.snow), false);
    addInst(CYL, toon('#ece8de'), birches.flatMap(b => b.trunks)); addInst(BOX, toon('#6b4f4a'), birches.flatMap(b => b.twigs), false); addInst(SPH_LO, toon('#eef6ff'), birches.flatMap(b => b.frost), false);
  }

  /* ---- 空：ラポニアの台地の上を輪を描くシロフクロウ ---- */
  {
    const center = tp(at(4, 0.5), W / 2).v, owls = [];
    for (let i = 0; i < 2; i++) {
      const g = fantasyGroup(); g.userData.droneIgnore = true; const white = toon('#f6f6f2');
      part(g, SPH_LO, white, [0, 0, 0], [0.8, 0.45, 0.45], null, 0); part(g, SPH_LO, white, [0.6, 0.15, 0], [0.32, 0.3, 0.3], null, 0);
      for (const z of [-0.1, 0.1]) part(g, SPH_LO, toon('#f2c230'), [0.86, 0.2, z], [0.06, 0.06, 0.06], null, 0);
      const wings = [-1, 1].map(sd => { const w = new THREE.Group(); w.position.set(0, 0.1, sd * 0.25); g.add(w); addBox(w, [0.9, 0.08, 2], [0, 0, sd * 1], white); return w; });
      owls.push({ g, wings, r: rand(40, 70), h: rand(35, 55), ph: i * 3, v: rand(0.16, 0.22) });
    }
    updates.push(t => {
      const m = reduced.matches ? 0 : t;
      for (const o of owls) {
        const a = m * o.v + o.ph; o.g.position.set(center.x + Math.cos(a) * o.r, center.y + o.h + Math.sin(m * 0.4 + o.ph) * 3, center.z + Math.sin(a) * o.r);
        o.g.rotation.y = -a - Math.PI / 2; o.wings.forEach((w, i) => { w.rotation.x = (i ? 1 : -1) * Math.sin(m * 3 + o.ph) * 0.35; });
      }
    });
  }

  /* ---- オーロラ：空にゆらめく光のカーテン。ゴールでは真上に光の冠（コロナ）が開く ---- */
  const aur = [];
  {
    const vs = 'uniform float uT;varying vec2 vUv;void main(){vUv=uv;vec3 p=position;p.z+=sin(uv.x*11.0+uT*0.5)*30.0*uv.y;p.x+=cos(uv.x*7.0-uT*0.3)*14.0;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0);}';
    const fs = 'uniform float uT,uI;uniform vec3 c1,c2;varying vec2 vUv;void main(){float band=0.5+0.5*sin(vUv.x*26.0+uT*0.8+sin(vUv.x*6.0-uT*0.4)*2.5);float a=smoothstep(0.0,0.22,vUv.y)*smoothstep(1.0,0.3,vUv.y);float streak=0.55+0.45*sin(vUv.x*170.0+uT*1.7);vec3 col=mix(c1,c2,vUv.y*1.2);gl_FragColor=vec4(col*band*streak*a*1.7*uI,1.0);}';
    const R0 = Math.max(560, track.extent + 260);
    [[C('#3dffb0'), C('#8b5cff'), 0, 0], [C('#46f0c6'), C('#ff5fd2'), 1, 0], [C('#7dffcf'), C('#5aa8ff'), 2, 0], [C('#4dffa0'), C('#c05cff'), 1, Math.PI * 0.9]].forEach(([c1, c2, k, a0]) => {
      const g = new THREE.PlaneGeometry(1, 1, 90, 1); const p = g.attributes.position, u = g.attributes.uv;
      for (let i = 0; i < p.count; i++) { const a = (u.getX(i) - 0.5) * 1.9 + (k - 1) * 0.35 + a0, rr = R0 + k * 60; p.setXYZ(i, Math.sin(a) * rr, 70 + k * 18 + u.getY(i) * (130 - k * 20), -Math.cos(a) * rr + 60); }
      const m = new THREE.ShaderMaterial({ uniforms: { uT: { value: 0 }, uI: { value: 1 }, c1: { value: c1 }, c2: { value: c2 } }, vertexShader: vs, fragmentShader: fs, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
      const mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false; mesh.userData.droneIgnore = true; world.add(mesh); aur.push(m);
    });
  }
  // コロナ：真上の一点へ集まる光の筋（ゴールのときだけ）
  const corona = new THREE.ShaderMaterial({
    uniforms: { uT: { value: 0 }, uA: { value: 0 } },
    vertexShader: 'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
    fragmentShader: 'uniform float uT,uA;varying vec2 vUv;void main(){float r=0.5+0.5*sin(vUv.x*90.0+sin(vUv.x*13.0+uT*0.7)*3.0+uT*0.6);r*=0.6+0.4*sin(vUv.x*31.0-uT*1.3);float a=smoothstep(0.0,0.35,vUv.y)*smoothstep(1.0,0.55,vUv.y);vec3 col=mix(vec3(0.25,1.0,0.65),vec3(0.75,0.35,1.0),vUv.y);gl_FragColor=vec4(col*r*a*uA*1.6,1.0);}',
    transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide
  });
  {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(20, 300, 220, 64, 1, true), corona); m.position.set(0, 190, 0); m.frustumCulled = false; m.userData.droneIgnore = true; m.visible = false; world.add(m);
    corona.userData.mesh = m;
  }

  // まとめて描く：人々、帽子、文字の板、雪玉のランタン
  {
    const order = shuffle(people.map((_, i) => i));
    addInst(new THREE.CapsuleGeometry(0.3, 0.75, 3, 8), toon('#ffffff'), order.map(i => people[i]), false); addInst(SPH_LO, toon('#e9c4a4'), order.map(i => heads[i]), false); addInst(SPH_LO, toon('#ffffff'), order.map(i => hats[i]), false);
    for (const [key, list] of boardLists) addInst(new THREE.PlaneGeometry(1, 1), boardMats.get(key), list, false);
    addInst(SPH_LO, snowM, lanternBalls, false);
    const glow = addInst(SPH_LO, toon('#ffe0a0', { emissive: C('#ffa040'), emissiveIntensity: 1.2 }), lanternGlow, false);
    if (statue) statue.lanterns = glow;
  }

  /* ---- 煙と火の粉、細氷（ダイヤモンドダスト） ---- */
  const smokeC = C('#c9d2de'), ember = C('#ffb050').multiplyScalar(1.6), diamond = C('#dff4ff').multiplyScalar(1.4);
  {
    let acc = 0, acc2 = 0, acc3 = 0;
    updates.push((t, dt) => {
      if (reduced.matches) return;
      const lq = lightQuality();
      acc += dt * smokes.length * (lq ? 1 : 2.5);
      while (acc >= 1) { acc--; const p = pick(smokes); dustP.emit(p.x + rand(-0.2, 0.2), p.y, p.z + rand(-0.2, 0.2), rand(-0.3, 0.3) + 0.4, rand(1, 1.8), rand(-0.3, 0.3), rand(3, 5), rand(1, 2), smokeC, -0.05, 0.3); }
      acc2 += dt * fires.length * (lq ? 3 : 8);
      while (acc2 >= 1 && fires.length) { acc2--; const p = pick(fires); sparkP.emit(p.x + rand(-0.3, 0.3), p.y + 0.4, p.z + rand(-0.3, 0.3), rand(-0.4, 0.4), rand(2, 4), rand(-0.4, 0.4), rand(0.6, 1.2), rand(0.15, 0.3), ember, -0.5, 0.5); }
      acc3 += dt * (lq ? 6 : 18);
      while (acc3 >= 1) { acc3--; const c = camera.position; sparkP.emit(c.x + rand(-25, 25), c.y + rand(-6, 12), c.z + rand(-25, 25), rand(-0.3, 0.3), rand(-0.4, -0.1), rand(-0.3, 0.3), rand(1.5, 3), rand(0.08, 0.16), diamond, 0, 0); }
    });
  }

  /* ---- ゴール：オーロラが一気に明るく揺れ動き（ブレイクアップ）、真上に光の冠が開き、氷の大トナカイ像が光る ---- */
  themeFinish = () => { celebration = 9; }; themeReset = () => { celebration = 0; };
  let burst = 0, phase = 0;
  const fw = ['#5dffb0', '#9a6bff', '#ff6fd8', '#7fd8ff'].map(c => C(c).multiplyScalar(1.6));
  updates.push((t, dt) => {
    const glow = celebration > 0 ? Math.min(1, celebration / 2) : 0, m = reduced.matches ? 0 : t;
    // ブレイクアップ：明るさとゆらめきの速さを上げる（位相は積み上げて、速さが変わっても飛ばない）
    if (!reduced.matches) phase += dt * (1 + glow * 1.5);
    aur.forEach(a => { a.uniforms.uT.value = phase; a.uniforms.uI.value = 1 + glow * 1.6; });
    corona.uniforms.uT.value = phase; corona.uniforms.uA.value = glow; corona.userData.mesh.visible = glow > 0;
    if (statue) { statue.mat.emissiveIntensity = 0.3 + glow * (0.9 + 0.3 * Math.sin(m * 4)); if (statue.lanterns) statue.lanterns.material.emissiveIntensity = 1.2 + glow * 1.5; }
    if (celebration <= 0) return;
    celebration = Math.max(0, celebration - dt);
    if (reduced.matches) return;
    burst += dt * (lightQuality() ? 2 : 4);
    for (; burst >= 1; burst--) {
      // 雪原の花火：オーロラの色の光が開く
      const s = track.finishS + rand(-120, 60), f = tp(s, W + rand(30, 90)), y = rand(45, 75), col = pick(fw);
      for (let i = 0; i < 46; i++) { const a = rand(0, Math.PI * 2), b = Math.acos(rand(-1, 1)), sp = rand(9, 13); sparkP.emit(f.v.x, y, f.v.z, Math.sin(b) * Math.cos(a) * sp, Math.cos(b) * sp, Math.sin(b) * Math.sin(a) * sp, rand(1.3, 1.9), rand(0.5, 0.9), col, 3, 1.2); }
    }
    if (statue && Math.random() < 0.5) { const c = statue.c; sparkP.emit(c.x + rand(-6, 6), c.y + rand(4, 16), c.z + rand(-6, 6), rand(-1, 1), rand(1, 3), rand(-1, 1), rand(1, 1.8), rand(1, 1.6), diamond, 0.5, 0.5); }
  });

  floodTowers(4);
  const sc = C('#ffffff');
  ambient(TEX_SOFT, false, 120, (a, c) => a.emit(c.x + rand(-60, 60), c.y + rand(8, 35), c.z + rand(-60, 60), rand(-0.8, 0.8), rand(-2.2, -1.2), rand(-0.8, 0.8), 9, rand(0.2, 0.42), sc, 0, 0));
  // 広い範囲に散らばるインスタンスは、原点の境界球で切り捨てられないようにする
  for (const o of world.children.slice(n0)) if (o.isInstancedMesh) o.frustumCulled = false;
  themeUpd.push((t, dt) => { for (const f of updates) f(t, dt); });
}
// スタンド：氷のホテルのような氷と雪のスタンド。段の前に氷のブロックの壁、軒につらら、屋根の上に氷の「オーロラ雪原」の看板、前に屋外のろうそく（マーシャル）
function decorAuroraStand(stand, len, z0, roof) {
  const g = new THREE.Group(); stand.add(g); registerLandmark(g, 'aurora-stand');
  // 氷のブロックの腰壁（局所 -z が走路の側）
  const bricks = ctex(256, 128, c => {
    c.fillStyle = '#eaf6ff'; c.fillRect(0, 0, 256, 128);
    for (let y = 0; y < 128; y += 32) for (let x = (y / 32) % 2 ? -32 : 0; x < 256; x += 64) { c.fillStyle = `rgb(${150 + rand(-12, 12)},${206 + rand(-10, 10)},${240})`; c.fillRect(x + 3, y + 3, 58, 26); }
  }, true);
  bricks.repeat.set(len / 8, 1);
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(len, 1.6), toon('#ffffff', { map: bricks, emissive: C('#5fb8ff'), emissiveIntensity: 0.25, side: THREE.DoubleSide })); wall.position.set(0, 0.85, z0 - 0.05); g.add(wall);
  // つらら：屋根の前の縁から下がる
  const ic = [];
  for (let x = -len / 2; x <= len / 2; x += 0.9) ic.push({ p: new V3(x + rand(-0.2, 0.2), 12.4, z0 - 2.3 + rand(-0.2, 0.2)), s: new V3(0.14, rand(0.6, 1.8), 0.14), r: [Math.PI, 0, 0] });
  g.add(inst(CONE, toon('#d8f1ff', { emissive: C('#7fc8ff'), emissiveIntensity: 0.35 }), ic, false));
  // 屋根の上の氷の看板
  const sign = ctex(512, 160, c => {
    c.fillStyle = '#16325e'; c.fillRect(0, 0, 512, 160); c.strokeStyle = '#bfe8ff'; c.lineWidth = 10; c.strokeRect(8, 8, 496, 144);
    c.fillStyle = '#e8f8ff'; c.shadowColor = '#7fe0ff'; c.shadowBlur = 18; c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = '900 84px "Dela Gothic One", sans-serif'; c.fillText('オーロラ雪原', 256, 86, 470);
  });
  const w = Math.min(36, len * 0.3), h = w * 160 / 512;
  for (const sx of [-w * 0.3, w * 0.3]) addBox(g, [0.6, 3.4, 0.6], [sx, 15.4, z0 + 6], toon('#bfe8ff'));
  addBox(g, [w + 1.2, h + 1.2, 0.8], [0, 17 + h / 2, z0 + 6.4], toon('#c4ebff', { emissive: C('#4fb6ff'), emissiveIntensity: 0.4 }));
  const bm = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: sign, color: C('#ffffff').multiplyScalar(1.3) })); bm.position.set(0, 17 + h / 2, z0 + 5.98); bm.rotation.y = Math.PI; g.add(bm);
  // 屋根に積もった雪
  addBox(g, [len + 6, 0.7, 21], [0, 14, z0 + 8.5], toon('#f6fbff'), [0.08, 0, 0]);
  // 屋外のろうそく（マーシャル）：スタンドの前に並べる
  const can = [], flames = [];
  for (let x = -len / 2 + 2; x <= len / 2 - 2; x += 4) { can.push({ p: new V3(x, 0.3, z0 - 3.2), s: new V3(0.18, 0.6, 0.18) }); flames.push({ p: new V3(x, 0.75, z0 - 3.2), s: new V3(0.16, 0.3, 0.16) }); }
  g.add(inst(new THREE.CylinderGeometry(1, 1, 1, 8), toon('#5a4a3a'), can, false), inst(SPH_LO, glowMat('#ffb347', 2.6), flames, false));
  // 両端の氷の柱
  for (const x of [-len / 2 - 1.5, len / 2 + 1.5]) addBox(g, [2, 14, 2], [x, 7, z0 + 1], toon('#c4ebff', { emissive: C('#4fb6ff'), emissiveIntensity: 0.35 }), null, 0.02);
}
