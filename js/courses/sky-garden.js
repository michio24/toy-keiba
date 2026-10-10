// 天空庭園グランプリ
'use strict';

/* ---- 天空庭園：ペルー・アンデスの天空都市マチュ・ピチュを下敷きにした浮島 ---- */
// 見立て：雲海に浮かぶ浮島そのものを尾根の上の遺跡に、ホーム直線のスタンドを段々畑（アンデネス）の観覧席に。
// 区間の役割：0 段々畑のホーム直線／1 見張り小屋の段々畑と太陽の神殿（16の水汲み場の水路は浮島の縁から滝になって落ちる）／
// 2 虹橋（高さ12m）と最高地点の太陽の門インティプンク／3 三つの窓の神殿とインティワタナの丘の下り／4 コンドルの神殿／
// 5 聖なる岩と段々畑。内馬場は中央広場（リャマとアルパカ）。雲海からワイナ・ピチュ、雪のサルカンタイ、虹色の山ビニクンカがそびえる
function decorSkyGarden() {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const { shuffle, roadDist, occupied, clearAt, local, at, scatter, label, site, PRISM, CYL, addInst, herd, pathRibbon } = sceneryKit();
  // 案内板は赤土色の地に金の文字（インカの太陽神インティの金）
  const signAt = (g, text, y, w = 14) => { const sp = label(text, w, w / 4, '#7a3b22', '#f6d77a'); sp.position.set(0, y, 0); sp.scale.set(w, w / 4, 1); g.add(sp); return sp; };
  const updates = [];
  // 浮島の縁（楕円）。名所や群れは縁から margin 以上内側に置く
  const rx = track.halfX + 110, rz = track.halfZ + 100;
  const onIsland = (p, m = 10) => (p.x / (rx - m)) ** 2 + (p.z / (rz - m)) ** 2 <= 1;
  const rimPoint = p => { const k = 1 / Math.hypot(p.x / rx, p.z / rz); return new V3(p.x * k, 0, p.z * k); };
  const spread = (n, ...a) => shuffle(scatter(n * 2, ...a).filter(p => onIsland(p))).slice(0, n);

  const masonry = incaMasonry;
  const granite = toon('#ffffff', { map: masonry('#5e5a54', ['#b9b2a4', '#aaa395', '#c4beb1', '#a19a8c']) });
  const fineStone = toon('#ffffff', { map: masonry('#6d6559', ['#d6cdb9', '#cbc2ad', '#dfd7c5']) });
  // 面ごとに UV を実寸（tile m で1枚）にそろえた箱。大きな壁でも石が伸びない
  const stoneGeo = (w, h, d, tile = 5) => {
    const geo = new THREE.BoxGeometry(w, h, d), uv = geo.attributes.uv, dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
    for (let i = 0; i < uv.count; i++) { const f = dims[(i / 4) | 0]; uv.setXY(i, uv.getX(i) * f[0] / tile, uv.getY(i) * f[1] / tile); }
    return geo;
  };
  const wall = (g, size, pos, mat = granite, rot = null) => part(g, stoneGeo(...size), mat, pos, null, rot, 0.015);
  // インカの台形の窓・扉（上がすぼまる）。壁の面の少し手前に暗い板を貼る
  const trapGeo = (wb, wt, h) => new THREE.ShapeGeometry(new THREE.Shape([new THREE.Vector2(-wb / 2, 0), new THREE.Vector2(wb / 2, 0), new THREE.Vector2(wt / 2, h), new THREE.Vector2(-wt / 2, h)]));
  const opening = new THREE.MeshBasicMaterial({ color: C('#2a2420'), side: THREE.DoubleSide });
  const trap = (g, wb, wt, h, pos, yaw = 0) => { const m = new THREE.Mesh(trapGeo(wb, wt, h), opening); m.position.set(...pos); m.rotation.y = yaw; g.add(m); return m; };
  const straw = toon('#caa45a'), strawDark = toon('#a8823f'), grass = toon('#7fbe5c'), gold = toon('#f2c14e'), wood = toon('#6e4f35');
  // 石の家：切妻の妻壁まで石で積み、イチュ草の茅葺き屋根をかける（-Zが正面）
  const house = (g, x, z, w, d, h, yaw = 0, door = true) => {
    const hg = new THREE.Group(); hg.position.set(x, 0, z); hg.rotation.y = yaw; g.add(hg);
    wall(hg, [w, h, d], [0, h / 2, 0]);
    part(hg, PRISM, granite, [0, h, 0], [w, d * 0.45, d], null, 0.02);
    part(hg, PRISM, straw, [0, h + 0.15, 0], [w + 0.8, d * 0.62, d + 1.2], null, 0.02);
    for (const sx of [-1, 1]) addBox(hg, [0.4, 0.3, d + 1.3], [sx * (w / 2 + 0.3), h + 0.05, 0], strawDark);
    if (door) trap(hg, 1.3, 0.9, 2.1, [0, 0, -d / 2 - 0.03], Math.PI);
    return hg;
  };

  /* ---- 浮島の縁：雲海の上に切り立つ岩の縁と、低い石垣 ---- */
  {
    // 石垣は隙間なく続け、ところどころ崩れて低くなる。内側の根元にはイチュ草の株
    const posts = [], n = 300;
    for (let i = 0; i < n; i++) {
      const a = (i + 0.5) / n * Math.PI * 2, p = new V3(Math.cos(a) * (rx - 2.5), 0, Math.sin(a) * (rz - 2.5));
      const b = new V3(Math.cos(a + Math.PI * 2 / n) * (rx - 2.5), 0, Math.sin(a + Math.PI * 2 / n) * (rz - 2.5));
      if (!clearAt(p.x, p.z, W / 2 + 8)) continue;
      const h = i % 11 === 3 ? 0.5 : rand(1.1, 1.5), len = p.distanceTo(b) + 0.3;
      posts.push({ p: p.clone().setY(h / 2), s: new V3(len, h, 1.4), r: [0, -Math.atan2(b.z - p.z, b.x - p.x), 0] });
    }
    addInst(BOX, fineStone, posts);
    // 縁の下に垂れる岩の塊（浮島の底の円錐に凹凸をつける）
    const rocks = [];
    // 岩の上端は円盤の側面（厚さ6m）より下に収め、地表へ突き出さない
    for (let i = 0; i < 70; i++) { const a = rand(0, Math.PI * 2), k = rand(0.6, 0.97), sy = rand(10, 20); rocks.push({ p: new V3(Math.cos(a) * rx * k, -sy - 7 - (1 - k) * 40, Math.sin(a) * rz * k), s: new V3(rand(14, 26), sy, rand(14, 26)), r: [0, rand(0, 3), 0] }); }
    addInst(new THREE.DodecahedronGeometry(1, 0), toon('#9c958a'), rocks, false);
  }

  /* ---- 第2区間：虹橋。虹色の欄干の帯と、インカの石の橋脚 ---- */
  {
    const s0 = track.segStart[1], s1 = track.segStart[4], deck = 3.2;
    courseRibbon(s0, s1, -4, -1.8, -0.5, toon('#e9e3d3', { side: THREE.DoubleSide })); courseRibbon(s0, s1, W + 1.8, W + 4, -0.5, toon('#e9e3d3', { side: THREE.DoubleSide }));
    courseRibbon(s0, s1, -4, W + 4, -deck, toon('#d9d2c2', { side: THREE.DoubleSide }));
    // 橋の両側面を6色の帯で塗り分ける（上から赤・橙・黄・緑・青・紫）
    const rainbow = ['#ff7f8f', '#ffb36b', '#ffe27a', '#8fe39b', '#7fc8f4', '#b39cff'];
    rainbow.forEach((col, k) => {
      const pts = [], idx = []; let n = 0;
      for (const lane of [-4, W + 4]) {
        const base = n;
        for (let s = s0; s <= s1 + 0.1; s += 2) {
          const p = track.pos(Math.min(s, s1), lane), top = p.y - 0.5 - k * (deck - 0.5) / 6;
          pts.push(p.x, top, p.z, p.x, top - (deck - 0.5) / 6, p.z); n += 2;
        }
        for (let i = base; i < n - 2; i += 2) idx.push(i, i + 1, i + 2, i + 1, i + 3, i + 2);
      }
      const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3)); geo.setIndex(idx); geo.computeVertexNormals();
      world.add(new THREE.Mesh(geo, glowMat(col, 0.95).clone()));
    });
    // 橋脚：下が広がる四角い石の柱と、柱の頭をつなぐ梁
    const piers = [], beams = [], PIER = new THREE.CylinderGeometry(0.72, 1, 1, 4, 1); PIER.rotateY(Math.PI / 4);
    for (let s = s0 + 20; s < s1 - 10; s += 30) {
      const y = track.pos(s, W / 2).y - deck; if (y < 1.5) continue;
      for (const lane of [-2.5, W + 2.5]) { const p = track.pos(s, lane); piers.push({ p: new V3(p.x, y / 2, p.z), s: new V3(2.4, y, 2.4), r: [0, -p.h, 0] }); }
      const c = track.pos(s, W / 2); beams.push({ p: new V3(c.x, y - 0.4, c.z), s: new V3(2.2, 0.8, W + 7), r: [0, -c.h, 0] });
    }
    addInst(PIER, fineStone, piers); addInst(BOX, fineStone, beams);
  }

  /* ---- 第2区間（最高地点）：太陽の門インティプンク。インカ道の終点の石の門を、虹橋の上にまたがせる ---- */
  {
    const s = at(2, 0.75), f = tp(s, W / 2), top = f.v.y, g = registerLandmark(fantasyGroup(new V3(f.v.x, 0, f.v.z)), '太陽の門インティプンク');
    g.rotation.y = -f.h;
    const span = W + 14, h = top + 11;
    for (const z of [-span / 2, span / 2]) { wall(g, [4.2, h, 4.2], [0, h / 2, z], fineStone); wall(g, [5, 1.2, 5], [0, h + 0.6, z], fineStone); }
    wall(g, [4.6, 2.6, span + 4.2], [0, h - 1.3, 0], fineStone);
    // 太陽神インティの金の円盤（走ってくる馬を正面から迎える向き）
    const sunDisc = new THREE.Group(); sunDisc.position.set(-2.6, h - 1.3, 0); g.add(sunDisc);
    part(sunDisc, new THREE.CylinderGeometry(2.8, 2.8, 0.5, 28), glowMat('#ffcf4d', 1.25), [0, 0, 0], null, [0, 0, Math.PI / 2], 0.04);
    for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; addBox(sunDisc, [0.3, 1.6, 0.7], [0, Math.cos(a) * 3.9, Math.sin(a) * 3.9], gold, [a, 0, 0]); }
    sunDisc.userData.droneIgnore = true;
    updates.push(t => { sunDisc.rotation.x = reduced.matches ? 0 : t * 0.25; });
    const sign = new THREE.Group(); sign.position.set(0, h + 4.5, 0); g.add(sign); signAt(sign, '太陽の門 インティプンク', 0, 18);
  }

  /* ---- 第1区間：段々畑（アンデネス）と見張り小屋。第5区間の外にも段々畑 ---- */
  const andenes = (sa, sb, v0, steps, stepW = 5, stepH = 1.6) => {
    const tops = [], walls = [], uv = [], tIdx = [], wIdx = [];
    let n = 0;
    for (let k = 0; k < steps; k++) {
      const v = v0 + k * stepW, y = (k + 1) * stepH;
      let prev = false;
      for (let s = sa; s <= sb + 0.1; s += 3) {
        const a = local(Math.min(s, sb), 0, v), b = local(Math.min(s, sb), 0, v + stepW);
        const ok = onIsland(b, 6) && clearAt(a.x, a.z, v0 - 2);
        tops.push(a.x, y, a.z, b.x, y, b.z); walls.push(a.x, y - stepH - 0.05, a.z, a.x, y, a.z); uv.push(s / 5, 0, s / 5, stepH / 5);
        if (ok && prev) { const i = n - 2; tIdx.push(i, i + 2, i + 1, i + 1, i + 2, i + 3); wIdx.push(i, i + 1, i + 2, i + 1, i + 3, i + 2); }
        prev = ok; n += 2;
      }
    }
    const mk = (pos, idx, mat) => {
      const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geo.setIndex(idx); geo.computeVertexNormals();
      const m = new THREE.Mesh(geo, mat); m.receiveShadow = true; world.add(m); return m;
    };
    mk(tops, tIdx, toon('#86c463', { side: THREE.DoubleSide })); mk(walls, wIdx, toon('#ffffff', { map: granite.map, side: THREE.DoubleSide }));
    // 段ごとに作物を変えて畝を2列：とうもろこし（茎と穂）、赤や橙のキヌアの穂、紫の花のじゃがいも
    const stalks = [], heads = [], bushes = [];
    for (let k = 0; k < steps; k++) for (const row of [0.3, 0.7]) for (let s = sa + 3; s < sb - 2; s += 2.4) {
      const p = local(s + rand(-0.4, 0.4), 0, v0 + (k + row) * stepW); if (!onIsland(p, 8) || !clearAt(p.x, p.z, v0 - 2)) continue;
      const y = (k + 1) * stepH, crop = k % 3;
      if (crop === 0) { const h = rand(2, 2.6); stalks.push({ p: new V3(p.x, y + h / 2, p.z), s: new V3(0.12, h, 0.12), c: C('#5d9a3e') }); heads.push({ p: new V3(p.x, y + h + 0.2, p.z), s: new V3(0.18, 0.45, 0.18), c: C('#e9cf6a') }); }
      else if (crop === 1) { const h = rand(1.2, 1.6); stalks.push({ p: new V3(p.x, y + h / 2, p.z), s: new V3(0.1, h, 0.1), c: C('#6f9a44') }); heads.push({ p: new V3(p.x, y + h + 0.25, p.z), s: new V3(0.35, 0.6, 0.35), c: C(['#c2452f', '#e0822f', '#b8326a'][(s | 0) % 3]) }); }
      else bushes.push({ p: new V3(p.x, y + 0.35, p.z), s: new V3(0.8, 0.5, 0.8), c: C(Math.random() < 0.35 ? '#b28ad8' : '#5f9a45') });
    }
    addInst(CYL, toon('#ffffff'), shuffle(stalks), false); addInst(SPH_LO, toon('#ffffff'), shuffle(heads), false); addInst(SPH_LO, toon('#ffffff'), shuffle(bushes), false);
    occupied.push(...[0.2, 0.5, 0.8].map(t => { const p = local(lerp(sa, sb, t), 0, v0 + steps * stepW / 2); return { x: p.x, z: p.z, r: steps * stepW / 2 + 4 }; }));
    return steps * stepH;
  };
  {
    const sa = at(1, 0.04), sb = at(1, 0.48), v0 = W / 2 + 14, steps = 5, topY = andenes(sa, sb, v0, steps);
    // 見張り小屋（ワイナ・ピチュを一望する段々畑の上の茅葺きの小屋）と葬祭の石
    const p = local(lerp(sa, sb, 0.55), 0, v0 + steps * 5 + 6);
    if (onIsland(p, 12)) {
      // 段々畑の最上段より一段高い岩の丘。3段の石垣を重ね、走路側に石段をつける
      const f = tp(lerp(sa, sb, 0.55), W / 2), g = registerLandmark(fantasyGroup(new V3(p.x, 0, p.z)), '見張り小屋');
      g.rotation.y = -f.h;
      const tiers = [[18, 14], [14.5, 11], [11, 8.5]], th = (topY + 0.6) / 3;
      tiers.forEach(([w, d], k) => { wall(g, [w, th, d], [0, th * (k + 0.5), 0], granite); part(g, BOX, grass, [0, th * (k + 1) + 0.05, 0], [w - 0.6, 0.1, d - 0.6], null, 0); });
      for (let k = 0; k < 6; k++) wall(g, [2.2, th * 3 * (k + 1) / 6, 1.2], [6.5, th * 3 * (k + 1) / 12, -7.6 + k * 1.15], fineStone);
      const top = new THREE.Group(); top.position.y = th * 3; g.add(top);
      house(top, 0, 1, 6, 4.2, 3, Math.PI);
      // 葬祭の石：段を彫り込んだ平たい岩と、小さな輪
      part(top, new THREE.DodecahedronGeometry(1, 0), toon('#9a9284'), [-3.5, 0.5, -2.6], [2.4, 0.9, 1.6], [0, 0.4, 0], 0.03);
      wall(top, [0.8, 0.5, 0.8], [-2.6, 1.2, -2.6], fineStone);
      signAt(top, '見張り小屋', 8, 10);
      occupied.push({ x: p.x, z: p.z, r: 12 });
    }
    andenes(at(5, 0.4), at(5, 0.95), W / 2 + 14, 4);
  }

  /* ---- 第1区間：太陽の神殿（トレオン）。岩盤の上に弧を描く切石の塔と、16の水汲み場の水路 ---- */
  let fallFrom = null;
  {
    const g = site('太陽の神殿', at(1, 0.78), W / 2 + 24, 26, 22, '#b3ab9a');
    // 岩盤
    part(g, new THREE.DodecahedronGeometry(1, 0), toon('#8f877a'), [0, 1.2, 1], [10, 3.2, 8], [0, 0.4, 0], 0.03);
    // 弧を描く壁の塔：半円筒の石壁と、台形の窓
    const tower = new THREE.Mesh(new THREE.CylinderGeometry(6, 6.4, 8, 24, 1, true, -Math.PI * 0.15, Math.PI * 1.3), toon('#ffffff', { map: fineStone.map, side: THREE.DoubleSide }));
    tower.material.map = fineStone.map.clone(); tower.material.map.needsUpdate = true; tower.material.map.repeat.set(5, 2);
    tower.position.set(0, 7.2, 1); tower.castShadow = true; g.add(tower);
    for (const a of [-0.1, 0.55]) trap(g, 1.1, 0.75, 1.5, [Math.sin(a * Math.PI) * 6.45, 7.4, 1 + Math.cos(a * Math.PI) * 6.45], a * Math.PI);
    wall(g, [9, 7, 1.2], [-3, 6.7, -5.2], fineStone, [0, 0.35, 0]);
    // 隣の石の家（王女の宮殿）
    house(g, -9, 4, 6, 7, 3.4, 0.2);
    signAt(g, '太陽の神殿（トレオン）', 16, 15);
    // 16の水汲み場：神殿の脇から外へ、段ごとに水を受ける石の水盤を連ねた水路
    const fountains = [], water = [];
    for (let i = 0; i < 16; i++) {
      const z = 9 + i * 0.95, y = Math.max(0.3, 1.8 - i * 0.1);
      fountains.push({ p: new V3(8, y / 2, z), s: new V3(1.6, y, 0.9) });
      water.push({ p: new V3(8, y + 0.02, z), s: new V3(1.1, 0.06, 0.6) });
    }
    g.updateMatrixWorld(true);
    const toWorld = l => l.map(o => ({ ...o, p: g.localToWorld(o.p.clone()), r: [0, g.rotation.y, 0] }));
    addInst(BOX, fineStone, toWorld(fountains)); addInst(BOX, glowMat('#9fdcff', 1.05), toWorld(water), false);
    fallFrom = g.localToWorld(new V3(8, 0, 24));
  }

  /* ---- 浮島の縁からこぼれ落ちる滝（水路の先と、浮島の反対側の2か所） ---- */
  {
    const fallTex = ctex(64, 256, c => {
      c.fillStyle = '#d9f1ff'; c.fillRect(0, 0, 64, 256);
      for (let i = 0; i < 70; i++) { c.fillStyle = `rgba(${Math.random() < 0.5 ? '255,255,255' : '150,205,240'},${rand(0.3, 0.8)})`; c.fillRect(rand(0, 64), rand(0, 256), rand(1.5, 4), rand(20, 70)); }
    }, true);
    const fallMat = new THREE.MeshBasicMaterial({ map: fallTex, transparent: true, opacity: 0.82, side: THREE.DoubleSide, depthWrite: false });
    const channel = toon('#a39b8c'), stream = glowMat('#9fdcff', 1.05);
    const starts = [fallFrom, local(at(2, 0.3), 0, W / 2 + 22), local(at(4, 0.85), 0, W / 2 + 26)].filter(Boolean);
    starts.forEach((from, i) => {
      // 水路は浮島の中心から外向きに縁まで延ばす
      const edge = rimPoint(from), len = Math.hypot(edge.x - from.x, edge.z - from.z), yaw = Math.atan2(edge.x - from.x, edge.z - from.z);
      if (len > 1) {
        const mid = from.clone().lerp(edge, 0.5);
        inst(BOX, channel, [{ p: new V3(mid.x, 0.25, mid.z), s: new V3(2.2, 0.5, len), r: [0, yaw, 0] }]); inst(BOX, stream, [{ p: new V3(mid.x, 0.52, mid.z), s: new V3(1.2, 0.06, len), r: [0, yaw, 0] }], false);
      }
      const fall = new THREE.Mesh(new THREE.PlaneGeometry(7, 90), fallMat.clone());
      fall.material.map = fallTex.clone(); fall.material.map.needsUpdate = true; fall.material.map.repeat.set(1, 2.5);
      fall.position.set(edge.x * 1.012, -44, edge.z * 1.012); fall.rotation.y = yaw; world.add(fall);
      // 滝つぼの代わりに、落ちる先で湧く霧
      const mist = inst(SPH_LO, toon('#ffffff', { transparent: true, opacity: 0.75 }), Array.from({ length: 5 }, (_, k) => ({ p: new V3(edge.x * 1.02 + rand(-5, 5), -86 + k * 2, edge.z * 1.02 + rand(-5, 5)), s: new V3(rand(8, 13), rand(4, 6), rand(8, 13)) })), false);
      if (i) themeDetails.push(mist);
      updates.push(t => { fall.material.map.offset.y = reduced.matches ? 0 : t * 0.6 + i * 0.3; });
    });
  }

  /* ---- 第3区間：三つの窓の神殿と主神殿（聖なる広場）、内馬場側にインティワタナの丘 ---- */
  {
    const g = site('三つの窓の神殿', at(3, 0.3), W / 2 + 22, 30, 18, '#b3ab9a');
    // 三つの窓の神殿：走路に向いて台形の大窓が3つ開いた切石の壁と、左右の袖壁
    wall(g, [16, 7, 1.6], [-6, 3.5, 2], fineStone);
    for (const x of [-11, -6, -1]) trap(g, 2.2, 1.6, 3, [x, 2.6, 1.15], Math.PI);
    for (const x of [-14, 2]) wall(g, [1.6, 6.2, 9], [x, 3.1, 6], fineStone);
    // 主神殿：三方を壁で囲み、正面を開けた大きな切石の祭殿。奥の壁に台形の壁がん
    wall(g, [12, 6.5, 1.6], [8, 3.25, 7], fineStone);
    for (const x of [2.8, 13.2]) wall(g, [1.6, 6.5, 8], [x, 3.25, 3], fineStone);
    for (const x of [5, 8, 11]) trap(g, 1, 0.7, 1.5, [x, 2.8, 6.15], Math.PI);
    wall(g, [6, 1, 2.2], [8, 0.5, 3], granite);
    signAt(g, '三つの窓の神殿・主神殿', 11, 16);
  }
  {
    // インティワタナ：段を重ねた丘の頂の、太陽をつなぎとめる石。影の向きで季節を知る
    const g = site('インティワタナ', at(3, 0.55), -(W / 2 + 34), 30, 30, '#8fc06a');
    for (let k = 0; k < 4; k++) {
      const r = 13 - k * 3;
      part(g, new THREE.CylinderGeometry(r, r, 2.2, 28), toon('#ffffff', { map: granite.map }), [0, k * 2.2 + 1.1, 0], null, null, 0.01);
      part(g, new THREE.CylinderGeometry(r - 0.4, r - 0.4, 0.2, 28), grass, [0, k * 2.2 + 2.25, 0], null, null, 0);
    }
    const stone = new THREE.Group(); stone.position.y = 8.9; g.add(stone);
    wall(stone, [4, 1.4, 3], [0, 0.7, 0], fineStone);
    wall(stone, [1.1, 2.6, 1.1], [0.6, 2.7, 0], fineStone, [0, 0.4, 0]);
    // 影：太陽の動きにつれてゆっくり回る
    const shadow = new THREE.Mesh(new THREE.PlaneGeometry(5, 1.1), new THREE.MeshBasicMaterial({ color: C('#000000'), transparent: true, opacity: 0.28, depthWrite: false }));
    shadow.rotation.x = -Math.PI / 2;
    const pivot = new THREE.Group(); stone.add(pivot); pivot.add(shadow); shadow.position.set(2.8, 1.45, 0); pivot.position.set(0.6, 0, 0);
    updates.push(t => { pivot.rotation.y = reduced.matches ? 0.6 : t * 0.05; });
    // 丘へ上る石段
    for (let k = 0; k < 4; k++) wall(g, [2.4, 2.2 * (k + 1), 2], [0, 1.1 * (k + 1), -12.5 + k * 3], granite);
    signAt(g, 'インティワタナ', 15, 11);
  }

  /* ---- 第4区間：コンドルの神殿。天然の岩を広げた翼に、床の石を頭に見立てた祭壇 ---- */
  {
    const g = site('コンドルの神殿', at(4, 0.5), W / 2 + 24, 26, 20, '#b3ab9a');
    // 翼：風切羽のぎざぎざを刻んだ板状の岩を、背中側から斜め上へ V 字に広げる。根元は切石の壁で受ける
    const rock = toon('#8a8276');
    const wingShape = new THREE.Shape([[0, 0], [11, 1.5], [12.5, 4.2], [11, 4.6], [11.6, 6.4], [9.6, 6.2], [9.8, 8], [7.6, 7.2], [7.2, 8.6], [5, 7.2], [2.2, 5.6], [0, 3.4]].map(([x, y]) => new THREE.Vector2(x, y)));
    const wingGeo = new THREE.ExtrudeGeometry(wingShape, { depth: 1.8, bevelEnabled: true, bevelSize: 0.35, bevelThickness: 0.35, bevelSegments: 1 }); wingGeo.translate(0, 0, -0.9);
    for (const sx of [-1, 1]) {
      const wing = new THREE.Group(); wing.position.set(sx * 1.2, 0.2, 6); wing.rotation.set(0, sx > 0 ? -0.3 : Math.PI + 0.3, 0.32); g.add(wing);
      part(wing, wingGeo, rock, [0, 0, 0], null, null, 0.02);
      wall(g, [7, 2.4, 1.6], [sx * 6, 1.2, 8.6], fineStone, [0, sx * 0.3, 0]);
    }
    // 床：くちばしと頭を彫った三角の石と、白い襟の帯（祭壇の前の石畳）
    wall(g, [7, 0.3, 9], [0, 0.15, 0], granite);
    const head = new THREE.Shape([[-1.6, 0], [1.6, 0], [0, -4.2]].map(([x, y]) => new THREE.Vector2(x, y)));
    part(g, new THREE.ExtrudeGeometry(head, { depth: 0.5, bevelEnabled: false }), toon('#cfc7b4'), [0, 0.3, -1.4], null, [Math.PI / 2, 0, 0], 0.03);
    part(g, BOX, toon('#f3efe6'), [0, 0.42, -0.8], [3.6, 0.12, 1], null, 0);
    signAt(g, 'コンドルの神殿', 13, 12);
  }

  /* ---- 第5区間：聖なる岩。背後の山の稜線をなぞるように立てた一枚岩 ---- */
  {
    const g = site('聖なる岩', at(5, 0.2), W / 2 + 22, 22, 14, '#b3ab9a');
    const shape = new THREE.Shape([[-8, 0], [8, 0], [7.5, 3], [5, 4.8], [3, 4.2], [0.5, 6.8], [-2.5, 5.2], [-5, 5.6], [-7.5, 2.5]].map(([x, y]) => new THREE.Vector2(x, y)));
    const geo = new THREE.ExtrudeGeometry(shape, { depth: 1.6, bevelEnabled: true, bevelSize: 0.4, bevelThickness: 0.4, bevelSegments: 1 }); geo.translate(0, 0, -0.8);
    part(g, geo, toon('#9a9284'), [0, 0.3, 2], null, null, 0.02);
    for (const x of [-9, 9]) house(g, x, 4, 3.6, 3.2, 2.4, 0, false);
    signAt(g, '聖なる岩', 11, 10);
  }

  /* ---- 内馬場：中央広場の芝生と、遺跡の住居群 ---- */
  // 中央広場の中心は、走路が囲む多角形の重心。広さは走路と大型ビジョンにかからない大きさ
  let ax = 0, az = 0, area = 0;
  for (let i = 0; i < track.N; i += 4) { const j = Math.min(track.N, i + 4), cr = track.xs[i] * track.zs[j] - track.xs[j] * track.zs[i]; area += cr; ax += (track.xs[i] + track.xs[j]) * cr; az += (track.zs[i] + track.zs[j]) * cr; }
  const plazaC = new V3(ax / (3 * area), 0, az / (3 * area)), plazaR = Math.max(12, Math.min(roadDist(plazaC.x, plazaC.z, 400) - W / 2 - 10, plazaC.distanceTo(boardPos) - 14, 48));
  {
    const c = plazaC;
    const lawn = new THREE.Mesh(new THREE.CircleGeometry(1, 40), toon('#a5d977')); lawn.rotation.x = -Math.PI / 2; lawn.scale.set(plazaR, plazaR * 0.8, 1); lawn.position.set(c.x, 0.03, c.z); lawn.receiveShadow = true; world.add(lawn);
    // 住居群：内馬場の奥に、石の家をいくつか寄せて
    const g = registerLandmark(fantasyGroup(local(at(4, 0.3), 0, -(W / 2 + 26))), '住居群');
    const f = tp(at(4, 0.3), W / 2); g.rotation.y = -f.h + Math.PI;
    if (clearAt(g.position.x, g.position.z, W / 2 + 14)) {
      house(g, -7, 0, 6, 4.5, 3, 0); house(g, 1, 1, 5, 4.5, 3, 0.1); house(g, 9, -1, 6, 4.5, 3, -0.1); house(g, 2, 9, 7, 5, 3.2, Math.PI);
      wall(g, [26, 1.2, 1], [1, 0.6, -5], granite);
      themeDetails.push(g);
    } else g.visible = false;
  }

  /* ---- 天空の庭園：中央広場を囲む花壇、ケーニュアの木とイチュ草、崩れた石垣の遺構、インカ道の石畳、ハチドリ ---- */
  const beds = [];
  {
    const mark = name => (world.userData.landmarks || []).find(g => g.name === name);
    // 花壇：中央広場の縁に、石の縁取りの細長い花壇を輪に並べる。ペルーの国花カンツータ（赤・桃・黄の釣鐘の花）と青紫のルピナス
    const rims = [], soil = [], blooms = [], petals = ['#e2364f', '#f06a9a', '#f7c93f', '#7f6bd6', '#f39a3c'];
    for (let i = 0; i < 14; i++) {
      const a = i / 14 * Math.PI * 2, rr = plazaR + 5, p = new V3(plazaC.x + Math.cos(a) * rr, 0, plazaC.z + Math.sin(a) * rr * 0.8);
      if (!clearAt(p.x, p.z, W / 2 + 8, 4) || p.distanceTo(boardPos) < 22) continue;
      const yaw = -a + Math.PI / 2, c = Math.cos(yaw), sn = Math.sin(yaw);
      rims.push({ p: p.clone().setY(0.3), s: new V3(7.5, 0.6, 2.6), r: [0, yaw, 0] }); soil.push({ p: p.clone().setY(0.62), s: new V3(6.9, 0.06, 2), r: [0, yaw, 0] });
      for (let k = 0; k < 18; k++) { const u = rand(-3.2, 3.2), v = rand(-0.8, 0.8); blooms.push({ p: new V3(p.x + u * c + v * sn, 0.95, p.z - u * sn + v * c), s: new V3(0.38, 0.32, 0.38), c: C(petals[(i + (k % 3)) % petals.length]) }); }
      beds.push(p); occupied.push({ x: p.x, z: p.z, r: 4 });
    }
    addInst(BOX, fineStone, rims); addInst(BOX, toon('#6b4a35'), soil, false); addInst(SPH_LO, toon('#ffffff'), shuffle(blooms), false);
    // 野の花：草地にカンツータと黄色いアマンカイの小さな群れ
    const wild = [];
    for (const p of spread(46, 0, track.L, -90, 95, W / 2 + 8, 1.5)) for (let k = 0; k < 6; k++) wild.push({ p: new V3(p.x + rand(-1.6, 1.6), 0.3, p.z + rand(-1.6, 1.6)), s: new V3(0.3, 0.26, 0.3), c: C(['#e2364f', '#f7c93f', '#f06a9a', '#ffffff'][k % 4]) });
    addInst(SPH_LO, toon('#ffffff'), shuffle(wild), false);

    // ケーニュア（ポリレピス）：赤茶の樹皮がめくれた曲がった幹に、平たく重なる濃い緑の葉。アンデスの高地に育つ木
    const trunks = [], crowns = [];
    for (const p of spread(34, 0, track.L, -80, 90, W / 2 + 16, 4)) {
      const h = rand(4, 6.5), lean = rand(-0.25, 0.25), yaw = rand(0, 6);
      trunks.push({ p: new V3(p.x, h / 2, p.z), s: new V3(0.45, h, 0.45), r: [lean, yaw, rand(-0.2, 0.2)] });
      for (let k = 0; k < 3; k++) crowns.push({ p: new V3(p.x + rand(-1.4, 1.4), h * (0.75 + k * 0.14), p.z + rand(-1.4, 1.4)), s: new V3(rand(2.2, 3.2), rand(0.8, 1.1), rand(2.2, 3.2)), c: C(['#3f6f3d', '#4f7f45', '#5d8c4a'][k]) });
      occupied.push({ x: p.x, z: p.z, r: 3 });
    }
    addInst(CYL, toon('#9a5238'), trunks); addInst(SPH_LO, toon('#ffffff'), crowns);
    // イチュ草：高地の草原の、穂先の黄ばんだ細い草の株（浮島の縁と小島に多い）
    const tufts = [], TUFT = new THREE.ConeGeometry(1, 1, 5); TUFT.translate(0, 0.5, 0);
    for (let i = 0; i < 260; i++) {
      const a = rand(0, Math.PI * 2), k = Math.sqrt(rand(0.45, 0.93)), p = new V3(Math.cos(a) * rx * k, 0, Math.sin(a) * rz * k);
      if (!clearAt(p.x, p.z, W / 2 + 6, 1)) continue;
      for (let j = 0; j < 3; j++) tufts.push({ p: new V3(p.x + rand(-0.6, 0.6), 0, p.z + rand(-0.6, 0.6)), s: new V3(0.35, rand(0.9, 1.5), 0.35), r: [rand(-0.35, 0.35), 0, rand(-0.35, 0.35)], c: C(['#c8b25a', '#a9a84f', '#d7c26e'][j]) });
    }
    addInst(TUFT, toon('#ffffff'), shuffle(tufts), false);

    // 遺構：屋根の落ちた家の石垣。L字やコの字に低く残り、台形の壁がんがのぞく
    for (const p of spread(14, 0, track.L, -70, 85, W / 2 + 18, 8)) {
      const g = fantasyGroup(p); g.rotation.y = rand(0, Math.PI * 2);
      const w = rand(6, 9), d = rand(5, 7), h1 = rand(1.6, 2.8), h2 = rand(0.7, 1.6);
      wall(g, [w, h1, 0.9], [0, h1 / 2, -d / 2]); wall(g, [0.9, h2, d], [-w / 2, h2 / 2, 0]);
      if (Math.random() < 0.5) wall(g, [0.9, h1 * 0.8, d * 0.6], [w / 2, h1 * 0.4, -d * 0.2]);
      if (h1 > 2) trap(g, 0.7, 0.5, 0.9, [rand(-2, 2), 0.8, -d / 2 + 0.46], 0);
      for (let k = 0; k < 3; k++) part(g, BOX, granite, [rand(-w / 2, w / 2), 0.25, rand(-d / 2, d / 2)], [rand(0.7, 1.2), 0.5, rand(0.6, 1)], [0, rand(0, 3), 0], 0);
      occupied.push({ x: p.x, z: p.z, r: 7 }); themeDetails.push(g);
    }

    // インカ道の石畳：太陽の門から浮島の縁へ下る道（雲海の向こうから来た旅人の道）と、中央広場から神殿へ向かう小道
    const flag = toon('#b5ab95', { side: THREE.DoubleSide });
    const line = (a, b, n = 24) => Array.from({ length: n + 1 }, (_, k) => a.clone().lerp(b, k / n));
    const gateOut = local(at(2, 0.75), 0, W / 2 + 10);
    pathRibbon(line(gateOut, rimPoint(gateOut).multiplyScalar(0.985)), 3.2, 0.06, flag);
    for (const name of ['インティワタナ', '住居群']) {
      const g = mark(name); if (!g || !g.visible) continue;
      const a = plazaC.clone().lerp(g.position, plazaR / Math.max(1, plazaC.distanceTo(g.position)));
      pathRibbon(line(a, g.position.clone().lerp(a, 0.25)), 2.4, 0.06, flag);
    }
  }

  /* ---- 生きもの：リャマとアルパカの群れ、空を回るアンデスコンドル ---- */
  {
    const llamaParts = (body, face) => [
      { geo: SPH_LO, mat: body, off: [0, 1.75, 0], s: [1.15, 0.65, 0.6] }, { geo: BOX, mat: body, off: [0.95, 2.6, 0], s: [0.36, 1.4, 0.36] },
      { geo: SPH_LO, mat: face, off: [1.15, 3.35, 0], s: [0.45, 0.3, 0.28] }, { geo: BOX, mat: face, off: [0.95, 3.75, 0.13], s: [0.08, 0.35, 0.08] }, { geo: BOX, mat: face, off: [0.95, 3.75, -0.13], s: [0.08, 0.35, 0.08] },
      ...[[0.7, 0.3], [0.7, -0.3], [-0.7, 0.3], [-0.7, -0.3]].map(([x, z]) => ({ geo: BOX, mat: face, off: [x, 0.65, z], s: [0.18, 1.3, 0.18] }))
    ];
    const alpacaParts = body => [
      { geo: SPH_LO, mat: body, off: [0, 1.25, 0], s: [0.85, 0.6, 0.55] }, { geo: SPH_LO, mat: body, off: [0.7, 2, 0], s: [0.3, 0.7, 0.3] },
      { geo: SPH_LO, mat: body, off: [0.85, 2.6, 0], s: [0.38, 0.32, 0.3] },
      ...[[0.5, 0.25], [0.5, -0.25], [-0.5, 0.25], [-0.5, -0.25]].map(([x, z]) => ({ geo: BOX, mat: body, off: [x, 0.4, z], s: [0.18, 0.8, 0.18] }))
    ];
    const c = plazaC;
    const plaza = Array.from({ length: 18 }, () => { const a = rand(0, Math.PI * 2), r = Math.sqrt(Math.random()) * plazaR * 0.9; return new V3(c.x + Math.cos(a) * r, 0, c.z + Math.sin(a) * r * 0.8); }).filter(p => clearAt(p.x, p.z, W / 2 + 10, 2) && p.distanceTo(boardPos) > 20);
    // 中央広場に寄せすぎず、内馬場や段々畑の下の草地にも小さな群れで散らす
    const spots = shuffle([...plaza, ...spread(8, at(0, 0.05), at(0, 0.95), -60, -20, W / 2 + 12, 2), ...spread(8, at(4, 0.1), at(5, 0.4), W / 2 + 14, W / 2 + 60, W / 2 + 12, 2),
      ...spread(6, at(2, 0.1), at(3, 0.9), W / 2 + 30, W / 2 + 70, W / 2 + 14, 2), ...spread(6, at(1, 0.2), at(3, 0.2), -70, -25, W / 2 + 12, 2)]).map(p => ({ p, yaw: rand(0, Math.PI * 2) }));
    spots.forEach(s => occupied.push({ x: s.p.x, z: s.p.z, r: 2 }));
    const n = spots.length, k1 = Math.ceil(n * 0.35), k2 = Math.ceil(n * 0.6);
    herd(spots.slice(0, k1), llamaParts(toon('#f4efe4'), toon('#e6dccb')));
    herd(spots.slice(k1, k2), llamaParts(toon('#8a5a3a'), toon('#5c3b26')));
    herd(spots.slice(k2), alpacaParts(toon('#eadcc0')));
    // 色とりどりの房飾り（リャマの耳の飾り紐）
    addInst(SPH_LO, toon('#ffffff'), spots.slice(0, k2).map(({ p, yaw }, i) => ({ p: new V3(p.x + Math.cos(yaw) * 0.95, 3.75, p.z - Math.sin(yaw) * 0.95), s: new V3(0.18, 0.18, 0.18), c: C(['#ff5d73', '#ffd23f', '#35c2a0', '#a368ff'][i % 4]) })), false);

    // アンデスコンドル：黒い大きな翼に白い襟。浮島の上を大きく輪を描いて滑空する
    const condors = [], black = toon('#26232a'), white = toon('#f4f1ea');
    for (let i = 0; i < 3; i++) {
      const g = fantasyGroup(); g.scale.setScalar(1.6);
      part(g, SPH_LO, black, [0, 0, 0], [0.8, 0.6, 2], null, 0.05); part(g, SPH_LO, white, [0, 0.15, 1.5], [0.55, 0.45, 0.4], null, 0);
      part(g, SPH_LO, toon('#c97a6a'), [0, 0.3, 2.1], [0.32, 0.3, 0.42], null, 0);
      const wings = [-1, 1].map(s => { const w = new THREE.Group(); w.position.x = s * 0.6; g.add(w); part(w, SPH_LO, black, [s * 3.4, 0, 0], [3.6, 0.14, 1.1], null, 0.05); for (let j = 0; j < 4; j++) addBox(w, [0.25, 0.08, 1], [s * (6.6 + j * 0.2), 0, -0.3 + j * 0.35], black, [0, s * (0.3 - j * 0.2), 0]); return w; });
      condors.push({ g, wings, r: 150 + i * 70, y: 55 + i * 18, ph: i * 2.1, sp: 0.05 - i * 0.008 });
      if (i) themeDetails.push(g);
    }
    condors.forEach(o => { o.g.userData.droneIgnore = true; });
    // ハチドリ：花壇の花のまわりを、羽を震わせながら止まっては移る
    const birds = beds.slice(0, 8).map((p, i) => {
      const g = fantasyGroup(); g.userData.droneIgnore = true;
      part(g, SPH_LO, glowMat(i % 2 ? '#3fd6a0' : '#4fb8ff', 0.9), [0, 0, 0], [0.18, 0.16, 0.38], null, 0);
      addBox(g, [0.03, 0.03, 0.3], [0, 0.02, 0.45], toon('#222222'));
      const wings = [-1, 1].map(s => { const w = new THREE.Group(); w.position.x = s * 0.12; g.add(w); part(w, SPH_LO, toon('#d8f3ff'), [s * 0.28, 0, 0], [0.28, 0.03, 0.1], null, 0); return w; });
      if (i > 3) themeDetails.push(g);
      return { g, wings, p, ph: i * 1.7 };
    });
    updates.push(t => birds.forEach(({ g, wings, p, ph }) => {
      const m = reduced.matches ? 0 : t, a = Math.floor(m * 0.5 + ph) * 2.3 + ph, k = Math.min(1, (m * 0.5 + ph) % 1 * 3);
      const b = a - 2.3, x = lerp(Math.cos(b) * 3, Math.cos(a) * 3, k), z = lerp(Math.sin(b) * 1.2, Math.sin(a) * 1.2, k);
      g.position.set(p.x + x, 1.5 + Math.sin(m * 3 + ph) * 0.15, p.z + z); g.rotation.y = -a;
      wings.forEach((w, j) => { w.rotation.z = (reduced.matches ? 0.3 : Math.sin(t * 60 + j * Math.PI) * 0.9); });
    }));
    updates.push(t => condors.forEach(({ g, wings, r, y, ph, sp }) => {
      const a = (reduced.matches ? 0 : t) * sp + ph;
      g.position.set(Math.cos(a) * r, y + Math.sin(a * 3) * 4, Math.sin(a) * r * 0.75);
      g.rotation.set(0, -a, -0.25);
      wings.forEach((w, k) => { w.rotation.z = (reduced.matches ? 0 : Math.sin(t * 0.9 + ph) * 0.12) * (k ? -1 : 1); });
    }));
  }

  /* ---- 周りの浮島：段々畑の小島を、虹の橋とケスワチャカの草の吊り橋で結ぶ ---- */
  {
    const isles = [[-240, 8, -300], [-120, 20, -385], [0, 8, -300], [120, 20, -385], [240, 8, -300]].map(([x, y, z]) => new V3(x, y, z * (rz + 150) / 385));
    isles.forEach((p, i) => {
      const g = fantasyGroup(p);
      part(g, CONE, toon('#9c958a'), [0, -22, 0], [26, 40, 26], [Math.PI, 0, 0], 0);
      for (let k = 0; k < 3; k++) {
        const r = 26 - k * 6;
        part(g, new THREE.CylinderGeometry(r, r, 2.4, 24), toon('#ffffff', { map: granite.map }), [0, k * 2.4 - 1.2, 0], null, null, 0.01);
        part(g, new THREE.CylinderGeometry(r - 0.5, r - 0.5, 0.2, 24), toon(k === 2 ? '#7fbe5c' : '#93ca6a'), [0, k * 2.4 + 0.05, 0], null, null, 0);
      }
      if (i === 2) {
        // 中央の小島には、白い石の祭殿（ペガサスのねぐら）
        wall(g, [16, 1.4, 11], [0, 5.5, 0], fineStone);
        for (const x of [-6, -2, 2, 6]) for (const z of [-4, 4]) part(g, new THREE.CylinderGeometry(0.7, 0.85, 8, 10), toon('#f7f4ec'), [x, 10.2, z], null, null, 0);
        wall(g, [17, 0.8, 11.5], [0, 14.6, 0], toon('#f7f4ec'));
        part(g, PRISM, toon('#f7f4ec'), [0, 15, 0], [17, 3.5, 12], null, 0.02);
      } else house(g, 0, 0, 7, 5, 3.2, i * 0.8).position.y = 4.8;
      if (i % 2) themeDetails.push(g);
    });
    const rainbow = ['#ff7fa8', '#ffbd75', '#ffe591', '#a9edb3', '#87dcf1', '#bca8ff'];
    const top = p => p.clone().add(new V3(0, 4.8, 0));
    for (const [ia, ib] of [[0, 1], [3, 4]]) {
      const a = top(isles[ia]), b = top(isles[ib]), side = new V3(-(b.z - a.z), 0, b.x - a.x).normalize();
      rainbow.forEach((c, i) => {
        const pts = Array.from({ length: 25 }, (_, k) => { const t = k / 24, p = a.clone().lerp(b, t).addScaledVector(side, (i - 2.5) * 1.2); p.y += Math.sin(t * Math.PI) * 20; return p; });
        world.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 48, 0.65, 6, false), glowMat(c, 1.05)));
      });
    }
    // ケスワチャカ：イチュ草を編んだ綱の吊り橋（毎年架け替えられる）。床の綱と手すりの綱がたわむ
    for (const [ia, ib] of [[1, 2], [2, 3]]) {
      const a = top(isles[ia]), b = top(isles[ib]), side = new V3(-(b.z - a.z), 0, b.x - a.x).normalize();
      const sag = (t, d) => { const p = a.clone().lerp(b, t); p.y -= Math.sin(t * Math.PI) * d; return p; };
      for (const [off, dy, d] of [[-1.1, 0, 7], [1.1, 0, 7], [-1.3, 1.8, 6], [1.3, 1.8, 6]]) {
        const pts = Array.from({ length: 21 }, (_, k) => sag(k / 20, d).addScaledVector(side, off).add(new V3(0, dy, 0)));
        world.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, 0.18, 5, false), strawDark));
      }
      const planks = [], dir = b.clone().sub(a); dir.y = 0; const yaw = Math.atan2(dir.x, dir.z);
      for (let k = 1; k < 60; k++) { const p = sag(k / 60, 7); planks.push({ p, s: new V3(2.4, 0.15, 0.7), r: [0, yaw + Math.PI / 2, 0] }); }
      addInst(BOX, straw, planks, false);
    }
  }

  /* ---- 雲海と、雲の上にそびえるアンデスの山々 ---- */
  {
    const clouds = [];
    for (let i = 0; i < 90; i++) { const a = i * 2.399, r = 150 + i * 6; clouds.push({ p: new V3(Math.cos(a) * r, -48 - i % 5 * 5, Math.sin(a) * r), s: new V3(rand(25, 55), rand(8, 16), rand(20, 40)) }); }
    const cloudMesh = fantasyInst(SPH_LO, toon('#f7f5ff'), clouds, false);
    cloudMesh.userData.droneIgnore = true;
    updates.push(t => { cloudMesh.position.x = reduced.matches ? 0 : Math.sin(t * 0.035) * 10; });
    const fogMat = col => toon(col, { fog: true });
    // 浮島の向こう（虹橋の奥）に、ワイナ・ピチュの尖った緑の峰と、頂の段々畑
    // 熱帯の雲霧林に覆われた急な峰：細る柱を少しずつずらして積み、山肌に灰色の岩壁をのぞかせる
    const hp = new V3(40, 0, -(rz + 420)), slabs = [], cliffs = [], SLAB = new THREE.CylinderGeometry(0.8, 1, 1, 7);
    const peak = (x, z, r0, h, steep, greens) => {
      const n = 7, y0 = -90;
      for (let k = 0; k < n; k++) {
        const t = k / n, r = r0 * Math.pow(1 - t, steep) + 6, hh = h / n * 1.25;
        const p = new V3(x + rand(-0.06, 0.06) * r0 * t, y0 + h * t + hh / 2, z + rand(-0.06, 0.06) * r0 * t);
        slabs.push({ p, s: new V3(r, hh, r * rand(0.8, 0.95)), r: [0, rand(0, 3), 0], c: C(greens[k % greens.length]) });
        if (k > 1 && k < n - 1) for (let j = 0; j < 2; j++) { const a = rand(0, Math.PI * 2); cliffs.push({ p: new V3(p.x + Math.cos(a) * r * 0.82, p.y, p.z + Math.sin(a) * r * 0.82), s: new V3(r * 0.32, hh * 0.9, r * 0.22), r: [0, -a, 0] }); }
      }
      return new V3(x, y0 + h, z);
    };
    // ワイナ・ピチュ（遺跡の背後の尖った峰）と、肩に並ぶ小さな峰
    const hpTop = peak(hp.x, hp.z, 78, 300, 1.25, ['#3f7a45', '#4a8a4c', '#3c7442']);
    peak(hp.x - 110, hp.z + 50, 62, 190, 1.1, ['#4b8b4d', '#55964f']);
    // プトゥクシ（丸い緑の山）と、スタンドの裏のマチュ・ピチュ山
    peak(rx + 270, -110, 95, 210, 0.75, ['#55934f', '#5f9d55']);
    peak(-50, rz + 520, 120, 290, 0.95, ['#4d884b', '#58925a', '#4a8048']);
    const slabMesh = inst(SLAB, fogMat('#ffffff'), slabs, false), cliffMesh = inst(new THREE.DodecahedronGeometry(1, 0), fogMat('#8d8b84'), cliffs, false);
    slabMesh.userData.backdrop = cliffMesh.userData.backdrop = true;
    // ワイナ・ピチュの頂の段々畑と石の祭殿
    const ruins = []; for (let k = 0; k < 3; k++) ruins.push({ p: hpTop.clone().add(new V3(0, -14 + k * 4, 0)), s: new V3(14 - k * 3.5, 4, 12 - k * 3), r: [0, 0.4, 0] });
    const ruinMesh = inst(new THREE.CylinderGeometry(1, 1, 1, 10), fogMat('#a7a294'), ruins, false); ruinMesh.userData.backdrop = true;
    // 雪をいただくサルカンタイとベロニカ：主峰のまわりに肩の峰を寄せた山塊
    const snowy = [], caps = [], CONE7 = new THREE.ConeGeometry(1, 1, 7).translate(0, 0.5, 0);
    for (const [x, z, r, h] of [[-(rx + 520), -(rz + 380), 190, 330], [rx + 560, rz + 200, 170, 280], [-(rx + 640), rz + 260, 150, 240]]) {
      for (const [dx, dz, k] of [[0, 0, 1], [r * 0.75, r * 0.2, 0.7], [-r * 0.7, -r * 0.15, 0.62], [r * 0.25, -r * 0.6, 0.55]]) {
        const p = new V3(x + dx, -90, z + dz), rot = [0, rand(0, 3), 0];
        snowy.push({ p, s: new V3(r * k, h * k, r * k), r: rot });
        caps.push({ p: p.clone().setY(-90 + h * k * 0.55), s: new V3(r * k * 0.46, h * k * 0.46, r * k * 0.46), r: rot });
      }
    }
    const rockMesh = inst(CONE7, fogMat('#7d8794'), snowy, false), capMesh = inst(CONE7, fogMat('#f6f8ff'), caps, false);
    rockMesh.userData.backdrop = capMesh.userData.backdrop = true;
    // 虹の山ビニクンカ：鉱物の色が縞になった稜線
    const stripes = ctex(64, 256, c => { ['#b5523b', '#e0a35a', '#f0d07a', '#7fae8a', '#d98a8a', '#8e6aa8', '#c87a4a', '#e8c06a'].forEach((col, i) => { c.fillStyle = col; c.fillRect(0, i * 32, 64, 32); }); });
    const vini = inst(SPH_LO, toon('#ffffff', { map: stripes, fog: true }), [{ p: new V3(rx + 420, -70, -(rz + 260)), s: new V3(230, 150, 120), r: [0, 0.6, 0] }, { p: new V3(rx + 560, -80, -(rz + 120)), s: new V3(160, 120, 100), r: [0, 1.1, 0] }], false);
    vini.userData.backdrop = true;
    // 峰にかかる雲
    const wisps = [];
    for (const [x, y, z] of [[hp.x, 120, hp.z + 30], [hp.x - 60, 60, hp.z + 50], [rx + 260, 80, -90], [-50, 140, rz + 470]]) for (let k = 0; k < 3; k++) wisps.push({ p: new V3(x + rand(-40, 40), y + rand(-8, 8), z + rand(-15, 15)), s: new V3(rand(30, 50), rand(7, 11), rand(16, 26)) });
    const wispMesh = fantasyInst(SPH_LO, toon('#ffffff', { fog: true }), wisps, false); wispMesh.userData.backdrop = true;
    updates.push(t => { wispMesh.position.x = reduced.matches ? 0 : Math.sin(t * 0.05) * 14; });
  }

  /* ---- 天馬：中央の小島の祭殿から飛び立ち、浮島の上を周回する（ファンタジーの演出） ---- */
  {
    const flyer = fantasyGroup(), pearl = toon('#fff8ff'), blue = toon('#a9d5ff'), mane = toon('#f6d77a');
    part(flyer, SPH_LO, pearl, [0, 0, 0], [3, 2, 5]); part(flyer, SPH_LO, pearl, [0, 3, -4], [1.7, 2, 2.2]);
    addBox(flyer, [0.5, 2.6, 2.6], [0, 4, -2.6], mane, [0.4, 0, 0]);
    for (const x of [-1.5, 1.5]) for (const z of [-3, 3]) addBox(flyer, [0.6, 3, 0.6], [x, -2, z], pearl);
    const wings = [-1, 1].map(s => { const wing = new THREE.Group(); wing.position.x = s * 2; flyer.add(wing); part(wing, SPH_LO, blue, [s * 4, 1, 0], [5, 0.35, 3]); return wing; });
    updates.push(t => {
      const m = reduced.matches ? 0 : t;
      flyer.userData.droneIgnore = true;
      flyer.position.set(Math.cos(m * 0.09) * 220, 65 + Math.sin(m * 0.4) * 5, -(rz + 30) + Math.sin(m * 0.09) * 90); flyer.rotation.y = -m * 0.09;
      wings.forEach((w, i) => { w.rotation.z = (reduced.matches ? 0.2 : Math.sin(t * 2.5) * 0.3) * (i ? 1 : -1); });
    });
  }

  // 高地の澄んだ空気に漂う雲のかけら。ゴールの瞬間は虹色の光がはじける
  ambient(TEX_SOFT, false, 2, (a, c) => a.emit(c.x + rand(-70, 70), c.y + rand(-12, 4), c.z + rand(-70, 70), rand(0.6, 1.4), rand(-0.05, 0.1), rand(-0.3, 0.3), 9, rand(5, 9), C('#ffffff'), 0, 0), true);
  const finish = tp(track.finishS, W / 2).v; let burst = -1;
  themeFinish = () => { burst = 0; }; themeReset = () => { burst = -1; };
  const burstCols = ['#ff7f8f', '#ffb36b', '#ffe27a', '#8fe39b', '#7fc8f4', '#b39cff'].map(c => C(c).multiplyScalar(2));
  updates.push((t, dt) => {
    if (burst < 0) return; burst += dt; if (burst > 2.5) { burst = -1; return; }
    const n = reduced.matches ? 1 : lightQuality() ? 3 : 6;
    for (let i = 0; i < n; i++) sparkP.emit(finish.x + rand(-W / 2, W / 2), finish.y + rand(2, 9), finish.z + rand(-W / 2, W / 2), rand(-2, 2), rand(0.5, 3), rand(-2, 2), rand(1.2, 2.2), rand(0.4, 0.9), burstCols[i % burstCols.length], -0.4, 0.8);
  });
  themeUpd.push((t, dt) => { for (const f of updates) f(t, dt); });
}
// 天空庭園のスタンド：白い共通スタンドを、石垣と芝が交互に重なる段々畑の観覧席に。
// 屋根はイチュ草の茅葺きの切妻、両端は切石の妻壁、背面の壁には台形の壁がん。軒には虹色の三角旗
function decorSkyGardenStand(stand, len, z0, roof) {
  const g = new THREE.Group(); stand.add(g); registerLandmark(g, 'skyGarden-stand');
  roof.visible = false;
  const recolor = { [C('#f2eef8').getHex()]: '#b9ae9a', [C('#e3dcef').getHex()]: '#86c463', [C('#d9d3e6').getHex()]: '#6e4f35' };
  stand.children.forEach(o => { if (o.isMesh && !o.isInstancedMesh && o.material.color && recolor[o.material.color.getHex()]) o.material.color.set(recolor[o.material.color.getHex()]); });
  // 茅葺き：草の束の筋と、段に重ねた刈り込みの線
  const thatch = ctex(256, 256, c => {
    c.fillStyle = '#9a7a42'; c.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 900; i++) { c.strokeStyle = ['#b8964f', '#7d5f2e', '#a8873f', '#c4a462'][i % 4]; c.lineWidth = rand(1, 2.5); const x = rand(0, 256), y = rand(0, 256); c.beginPath(); c.moveTo(x, y); c.lineTo(x + rand(-3, 3), y + rand(14, 30)); c.stroke(); }
    for (let y = 0; y < 256; y += 64) { c.fillStyle = 'rgba(80,55,25,.35)'; c.fillRect(0, y, 256, 4); }
  }, true);
  thatch.repeat.set(len / 8, 2);
  const straw = toon('#ffffff', { map: thatch }), ridgeY = 18.2, zc = z0 + 8.5, half = 13, slope = 0.4;
  for (const sd of [-1, 1]) {
    const m = part(g, BOX, straw, [0, ridgeY - Math.sin(slope) * half / 2 - 0.3, zc + sd * Math.cos(slope) * half / 2], [len + 8, 0.9, half + 0.6], [sd * slope, 0, 0], 0);
    m.receiveShadow = true;
  }
  addBox(g, [len + 8.4, 0.9, 1.4], [0, ridgeY, zc], toon('#7a5a30'));
  for (let x = -len / 2 - 4; x <= len / 2 + 4; x += 6) addBox(g, [0.5, 0.5, 1.6], [x, ridgeY + 0.5, zc], toon('#7a5a30'));
  // 切石の壁：実寸でタイルした箱
  const stoneMat = toon('#ffffff', { map: incaMasonry('#6d6559', ['#d6cdb9', '#cbc2ad', '#dfd7c5']) });
  const stone = (size, pos) => {
    const geo = new THREE.BoxGeometry(...size), uv = geo.attributes.uv, [w, h, d] = size, dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
    for (let i = 0; i < uv.count; i++) { const f = dims[(i / 4) | 0]; uv.setXY(i, uv.getX(i) * f[0] / 5, uv.getY(i) * f[1] / 5); }
    // 輪郭線は大きさに比例して太るので、長い壁にはつけない
    return part(g, geo, stoneMat, pos, null, null, 0);
  };
  // 両端の妻壁（三角の破風まで石で積む）
  const PRISM = new THREE.ExtrudeGeometry(new THREE.Shape([new THREE.Vector2(-0.5, 0), new THREE.Vector2(0.5, 0), new THREE.Vector2(0, 1)]), { depth: 1, bevelEnabled: false });
  PRISM.translate(0, 0, -0.5); PRISM.rotateY(Math.PI / 2);
  for (const sx of [-1, 1]) {
    stone([1.4, 13.2, 20], [sx * (len / 2 + 1.2), 6.6, z0 + 8.4]);
    part(g, PRISM, stoneMat, [sx * (len / 2 + 1.2), 13.2, zc], [1.4, ridgeY - 13.4, 22], null, 0);
  }
  // 背面の壁：切石を張り、台形の壁がんを並べる
  stone([len + 2, 10.4, 0.6], [0, 5.2, z0 + 18.9]);
  const niche = new THREE.MeshBasicMaterial({ color: C('#3a302a') });
  const nicheGeo = new THREE.ShapeGeometry(new THREE.Shape([new THREE.Vector2(-0.8, 0), new THREE.Vector2(0.8, 0), new THREE.Vector2(0.55, 1.9), new THREE.Vector2(-0.55, 1.9)]));
  for (let x = -len / 2 + 5; x <= len / 2 - 5; x += 7) { const m = new THREE.Mesh(nicheGeo, niche); m.position.set(x, 4.2, z0 + 19.22); g.add(m); }
  // 軒の三角旗
  addBox(g, [len + 6.4, 0.6, 0.6], [0, 13, z0 - 2.6], toon('#6e4f35'));
  const flags = [], cols = ['#ff7f8f', '#ffb36b', '#ffe27a', '#8fe39b', '#7fc8f4', '#b39cff'].map(C), tri = new THREE.BufferGeometry();
  tri.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, 0, 0, 0.5, 0, 0, 0, -1, 0], 3)); tri.computeVertexNormals();
  for (let x = -len / 2 - 2; x <= len / 2 + 2; x += 1.6) flags.push({ p: new V3(x, 12.6 - Math.abs(Math.sin((x + len / 2) / 8 * Math.PI)) * 0.6, z0 - 2.7), s: new V3(1, 1, 1), c: cols[(Math.round(x / 1.6) % 6 + 6) % 6] });
  g.add(inst(tri, toon('#ffffff', { side: THREE.DoubleSide }), flags, false));
}
