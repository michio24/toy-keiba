// お菓子の国カップ
'use strict';

/* ---- お菓子の国カップ：ポーランドのジンジャーブレッドの町トルン（世界遺産「中世都市トルン」）を下敷きにしたお菓子の国 ---- */
// 見立て：ゴシックのれんがの町並みをジンジャーブレッドの家に、ヴィスワ川をチョコレートの川に。
// 区間の役割：0 ジンジャーブレッドの家並みのスタンドのホーム直線／1 チョコレートのヴィスワ川：穀物倉、橋の門、鉄のアーチ橋、遊覧船／
// 2 生クリームの上り：ケーキの丘（いちごのショートケーキ）とカップケーキ、いちご畑／3 頂：ジンジャーブレッドの工房と、ドイツ騎士団の城跡・ダンスカー塔／
// 4〜5 旧市街の路地（S字）：パステルの家並み、城壁と斜塔、船乗りの門、コペルニクスの家／6 シュガーダッシュの下り：キャンディの森とキャンディケインの門、グミのくま／
// 7 聖ヨハネ大聖堂（鐘トゥバ・デイ）と筏師の噴水、ロバの像／8 ジンジャーブレッドの博物館。
// 内馬場は旧市街の広場：旧市庁舎とコペルニクス像、ジンジャーブレッドの市、回転木馬、行進するジンジャーブレッドマン、巨大カタジンカ（ファンタジー）
function decorCandy(th) {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const { shuffle, roadDist, occupied, taken, clearAt, groundAt, onGround, local, at, label, site, PRISM, CYL, addInst, beam, route } = sceneryKit();
  const n0 = world.children.length, updates = [];
  // 案内板はジンジャーブレッドの茶の地に、白いアイシングの文字
  const signAt = (g, text, y, w = 14) => { const sp = label(text, w, w / 4, '#7a4626', '#fff6fa'); sp.position.set(0, y, 0); sp.scale.set(w, w / 4, 1); g.add(sp); return sp; };
  const pick = a => a[(Math.random() * a.length) | 0];
  const rot = (x, z, yaw) => [x * Math.cos(yaw) + z * Math.sin(yaw), -x * Math.sin(yaw) + z * Math.cos(yaw)];
  const yawAt = s => -tp(s, W / 2).h;
  const HALF = new THREE.SphereGeometry(1, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);
  let celebration = 0;

  // お菓子の材質
  const ginger = toon('#b8733a'), gingerDark = toon('#8a5228'), icing = toon('#fffaf4'), choco = toon('#5a3222'), chocoMilk = toon('#7d4b2e');
  const cream = toon('#fff3dc'), sponge = toon('#f2cf86'), berry = toon('#e8384f'), leaf = toon('#4fae5a'), wood = toon('#8a6244'), darkWood = toon('#4a3324');
  const pinkM = toon('#ff9cc2'), mintM = toon('#9fe6d8'), lemonM = toon('#ffe58a'), lilacM = toon('#c9b2ff');
  const warm = toon('#ffd27a', { emissive: C('#ffb347'), emissiveIntensity: 1.1 });   // 窓明かり・ろうそくの火
  // 屋根：三角柱の屋根の上の方に、白いアイシングをかぶせる（相似の三角柱を少し浮かせる）
  const iceRoof = (g, mat, pos, scl, rotY = 0, k = 0.55) => {
    part(g, PRISM, mat, pos, scl, [0, rotY, 0], 0.02);
    part(g, PRISM, icing, [pos[0], pos[1] + scl[1] * (1 - k) + 0.15, pos[2]], [scl[0] + 0.3, scl[1] * k, scl[2] * k], [0, rotY, 0], 0);
  };
  const candyCols = ['#ff7fab', '#7fe0d0', '#ffe27a', '#b99cff', '#ff9f68', '#8ee39a', '#7fc4ff'];
  // れんが：ジンジャーブレッドの茶に、白いアイシングの目地
  const brickTex = (base, mortar, rows = 16) => ctex(256, 256, c => {
    c.fillStyle = mortar; c.fillRect(0, 0, 256, 256);
    const h = 256 / rows;
    for (let y = 0, r = 0; y < 256; y += h, r++) for (let x = r % 2 ? -16 : 0; x < 256; x += 32) {
      const k = rand(-14, 14), b = C(base); c.fillStyle = `rgb(${b.r * 255 + k | 0},${b.g * 255 + k * 0.7 | 0},${b.b * 255 + k * 0.5 | 0})`; c.fillRect(x + 2, y + 2, 28, h - 4);
    }
  }, true);
  const gingerBrick = toon('#ffffff', { map: brickTex('#b06a34', '#fff4e8') }), chocoBrick = toon('#ffffff', { map: brickTex('#6a3a26', '#e8c9a8') });
  // 縞模様（キャンディケイン）：斜めの赤白
  const stripeTex = (a, b) => ctex(64, 64, c => { c.fillStyle = a; c.fillRect(0, 0, 64, 64); c.fillStyle = b; for (let k = -64; k < 128; k += 32) { c.beginPath(); c.moveTo(k, 0); c.lineTo(k + 16, 0); c.lineTo(k + 16 - 64, 64); c.lineTo(k - 64, 64); c.closePath(); c.fill(); } }, true);
  const caneTex = stripeTex('#ffffff', '#e8384f'); caneTex.repeat.set(1, 3);
  const caneM = toon('#ffffff', { map: caneTex }), caneMintTex = stripeTex('#ffffff', '#3fbfa8'); caneMintTex.repeat.set(1, 3);
  const caneMint = toon('#ffffff', { map: caneMintTex });
  // 渦巻きの棒つきキャンディ：面だけに渦巻き、縁は白
  const swirl = (a, b) => toon('#ffffff', { map: ctex(128, 128, c => {
    c.fillStyle = b; c.fillRect(0, 0, 128, 128); c.strokeStyle = a; c.lineWidth = 9; c.beginPath();
    for (let t = 0; t < 26; t += 0.08) { const r = t * 2.4; c.lineTo(64 + Math.cos(t) * r, 64 + Math.sin(t) * r); } c.stroke();
  }) });
  const lollyMats = [[swirl('#ff5f9a', '#fff4f8'), '#ffd0e2'], [swirl('#2fbfa8', '#f4fffb'), '#c8f4ea'], [swirl('#ffb12f', '#fffbe8'), '#ffe9b0'], [swirl('#8a5cff', '#f8f4ff'), '#e0d4ff']];
  const DISC = new THREE.CylinderGeometry(1, 1, 0.3, 28); DISC.rotateX(Math.PI / 2);

  // 人々：パステルの服と毛糸の帽子
  const people = [], heads = [], hats = [], cloth = ['#ff7fab', '#7fc4ff', '#ffe27a', '#8ee39a', '#f4f1ea', '#b99cff', '#ff9f68', '#e8384f', '#3f6fbf', '#5a3f7a'].map(C);
  const addPerson = (p, sit = false, col) => {
    const c = col ? C(col) : pick(cloth);
    people.push({ p: p.clone().add(new V3(0, sit ? 0.55 : 0.95, 0)), s: new V3(1.12, sit ? 0.62 : 1, 1.12), c });
    heads.push({ p: p.clone().add(new V3(0, sit ? 1.3 : 1.95, 0)), s: new V3(0.26, 0.28, 0.26) });
    hats.push({ p: p.clone().add(new V3(0, sit ? 1.46 : 2.11, 0)), s: new V3(0.27, 0.16, 0.27), c: pick(cloth) });
  };
  const figure = (g, x, y, z, col, sc = 1, hat = '#ff7fab') => {
    part(g, new THREE.CapsuleGeometry(0.3 * sc, 0.75 * sc, 3, 8), toon(col), [x, y + 0.95 * sc, z], null, null, 0.03);
    part(g, SPH_LO, toon('#f1c9a8'), [x, y + 1.95 * sc, z], [0.26 * sc, 0.28 * sc, 0.26 * sc], null, 0);
    part(g, SPH_LO, toon(hat), [x, y + 2.11 * sc, z], [0.27 * sc, 0.16 * sc, 0.27 * sc], null, 0);
  };
  // ジンジャーブレッドマン：平たい茶色の人形に、白いアイシングの縁と、ボタンと笑顔
  const gingerMan = (parent, sc = 1) => {
    const g = new THREE.Group(); g.scale.setScalar(sc); parent.add(g);
    const flat = [1, 1, 0.45];
    part(g, SPH_LO, ginger, [0, 1.25, 0], [0.55 * flat[0], 0.62, 0.55 * flat[2]], null, 0.04); part(g, SPH_LO, ginger, [0, 2.2, 0], [0.45, 0.45, 0.45 * flat[2]], null, 0.04);
    const arms = [-1, 1].map(sd => { const a = new THREE.Group(); a.position.set(0, 1.6, sd * 0.45); g.add(a); part(a, SPH_LO, ginger, [0, -0.15, sd * 0.35], [0.2, 0.45, 0.2], [sd * 0.9, 0, 0], 0.04); return a; });
    const legs = [-1, 1].map(sd => { const l = new THREE.Group(); l.position.set(0, 0.85, sd * 0.25); g.add(l); part(l, SPH_LO, ginger, [0, -0.4, 0], [0.24, 0.5, 0.22], null, 0.04); return l; });
    for (const y of [1.0, 1.3, 1.6]) part(g, SPH_LO, toon(pick(['#ff5f9a', '#3fbfa8', '#ffb12f'])), [0.26, y, 0], [0.08, 0.08, 0.08], null, 0);
    for (const z of [-0.15, 0.15]) part(g, SPH_LO, icing, [0.21, 2.3, z], [0.06, 0.07, 0.06], null, 0);
    part(g, new THREE.TorusGeometry(0.14, 0.03, 6, 12, Math.PI), icing, [0.22, 2.1, 0], null, [0, Math.PI / 2, Math.PI], 0);
    return { g, arms, legs };
  };

  // 文字入りの板（屋台・店の看板）。同じ文字は1枚の材質を共有する
  const boardMats = new Map(), boardLists = new Map();
  const putBoard = (text, c, yaw, w) => {
    if (!boardMats.has(text)) {
      boardMats.set(text, toon('#ffffff', { map: ctex(512, 128, g => {
        g.fillStyle = '#8a5228'; g.fillRect(0, 0, 512, 128); g.strokeStyle = '#fff4f8'; g.lineWidth = 8; g.setLineDash([18, 10]); g.strokeRect(8, 8, 496, 112);
        g.fillStyle = '#fff6fa'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = '900 60px "Dela Gothic One", sans-serif'; g.fillText(text, 256, 68, 460);
      }) }));
      boardLists.set(text, []);
    }
    boardLists.get(text).push({ p: c.clone(), s: new V3(w, w / 4, 1), r: [0, yaw, 0] });
  };
  // 地面に沿う、テクスチャを貼れる帯（川・岸）。u は幅方向、v は長さ方向（vScale mごとに1回）
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
  // 走路から外へ V の道筋（川）。両端は ext 本（10mずつ）走路から遠ざかる向きへ伸ばして均す
  const outerPath = (s0, s1, V, ext = 40, step = 6) => {
    const pts = []; for (let s = s0; s <= s1; s += step) pts.push(local(s, 0, V));
    const head = pts[0], d0 = head.clone().sub(pts[1]).setY(0).normalize(), tail = pts[pts.length - 1], d1 = tail.clone().sub(pts[pts.length - 2]).setY(0).normalize();
    const f0 = tp(s0, W / 2).n.multiplyScalar(Math.sign(V)), f1 = tp(s1, W / 2).n.multiplyScalar(Math.sign(V));
    for (let k = 1; k <= ext; k++) pts.unshift(head.clone().addScaledVector(d0.clone().lerp(f0, Math.min(1, k / 20)).normalize(), k * 10));
    for (let k = 1; k <= ext; k++) pts.push(tail.clone().addScaledVector(d1.clone().lerp(f1, Math.min(1, k / 20)).normalize(), k * 10));
    for (let pass = 0; pass < 10; pass++) for (let i = 1; i < pts.length - 1; i++) pts[i] = pts[i - 1].clone().add(pts[i + 1]).multiplyScalar(0.5).lerp(pts[i], 0.5);
    return pts;
  };
  // 煙の出どころ（毎フレーム少しずつ出す）
  const smokes = [];

  /* ---- 座標の準備：内馬場の判定、区間の案内板とスタンドの敷地は空けておく ---- */
  const poly = []; for (let i = 0; i < track.N; i += 8) poly.push([track.xs[i], track.zs[i]]);
  const inLoop = (x, z) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, zi] = poly[i], [xj, zj] = poly[j]; if ((zi > z) !== (zj > z) && x < (xj - xi) * (z - zi) / (zj - zi) + xi) c = !c; } return c; };
  for (const z of track.zones) { const q = tp((z.start + z.end) / 2, W + 9).v; occupied.push({ x: q.x, z: q.z, r: 11 }); }
  for (let s = track.homeS0 - 10; s <= track.homeS1 + 10; s += 10) { const p = local(s, 0, W / 2 + 30); occupied.push({ x: p.x, z: p.z, r: 23 }); }
  occupied.push({ x: boardPos.x, z: boardPos.z, r: 24 });

  /* ---- 外ラチ沿い：キャンディケインと棒つきキャンディ、手を振る観客 ---- */
  const lollies = lollyMats.map(() => ({ sticks: [], heads: [] }));
  const lolly = (p, h, r, k = (Math.random() * 4) | 0, yaw = rand(0, Math.PI * 2)) => {
    const L = lollies[k]; L.sticks.push({ p: p.clone().add(new V3(0, h / 2, 0)), s: new V3(0.12 * r, h, 0.12 * r) });
    L.heads.push({ p: p.clone().add(new V3(0, h + r * 0.9, 0)), s: new V3(r, r, r), r: [0, yaw, 0] });
  };
  const canes = [], caneHooks = [], canesMint = [], caneHooksMint = [];
  const HOOK = new THREE.TorusGeometry(1, 0.22, 8, 16, Math.PI);
  const cane = (p, h, sc, yaw, mint = Math.random() < 0.35) => {
    (mint ? canesMint : canes).push({ p: p.clone().add(new V3(0, h / 2, 0)), s: new V3(0.22 * sc, h, 0.22 * sc) });
    const [ox, oz] = rot(sc, 0, yaw); (mint ? caneHooksMint : caneHooks).push({ p: p.clone().add(new V3(ox, h, oz)), s: new V3(sc, sc, sc), r: [0, yaw, 0] });
  };
  {
    for (let s = 0; s < track.L; s += 12) {
      if (s > track.homeS0 - 4 && s < track.homeS1 + 4) continue;   // ホーム直線はジンジャーブレッドのスタンド
      if (Math.abs(s - at(6, 0.12)) < 4 || Math.abs(s - at(6, 0.88)) < 4) continue;   // キャンディケインの門の柱
      const p = onGround(local(s, 0, W / 2 + 3.6));
      if (taken(p.x, p.z, 1)) continue;
      if (Math.round(s / 12) % 2) lolly(p, 2.2, 0.7, Math.round(s / 24) % 4, yawAt(s) + Math.PI / 2);
      else cane(p, 2.4, 0.42, yawAt(s) + Math.PI / 2, Math.round(s / 24) % 2 === 0);
    }
    const crowdAt = (s0, s1, n) => {
      for (let k = 0; k < n; k++) {
        const p = onGround(local(rand(s0, s1), 0, W / 2 + rand(5.5, 10)));
        if (taken(p.x, p.z, 0.4)) continue;
        addPerson(p); occupied.push({ x: p.x, z: p.z, r: 0.6 });
      }
      for (let s = s0; s < s1; s += 9) { const p = local(s, 0, W / 2 + 7.5); occupied.push({ x: p.x, z: p.z, r: 4 }); }
    };
    crowdAt(at(1, 0.05), at(1, 0.3), 40); crowdAt(at(3, 0.08), at(3, 0.22), 25); crowdAt(at(7, 0.55), at(7, 0.95), 45); crowdAt(at(8, 0.1), at(8, 0.3), 25);
  }

  /* ---- 遠景：パステルのアイスクリームの丘（生クリームをかけた丸い丘）と、空の虹 ---- */
  {
    const base = Math.max(620, track.extent + 320), domes = [], caps = [], drips = [];
    for (let i = 0; i < 26; i++) {
      const a = i / 26 * Math.PI * 2 + rand(-0.06, 0.06), r = base + rand(0, 230), rr = rand(130, 220), h = rand(60, 120), p = new V3(Math.cos(a) * r, -12, Math.sin(a) * r);
      domes.push({ p, s: new V3(rr, h, rr), c: C(pick(['#ffc6dc', '#bdeee2', '#fff0b3', '#d8ccff', '#ffd6b8'])) });
      caps.push({ p: p.clone().add(new V3(0, h * 0.5, 0)), s: new V3(rr * 0.8, h * 0.55, rr * 0.8) });
      for (let k = 0; k < 7; k++) { const b = rand(0, Math.PI * 2); drips.push({ p: new V3(p.x + Math.cos(b) * rr * 0.72, p.y + h * 0.62, p.z + Math.sin(b) * rr * 0.72), s: new V3(rand(10, 18), rand(16, 30), rand(10, 18)) }); }
    }
    for (const m of [inst(SPH_LO, toon('#ffffff', { fog: true }), domes, false), inst(HALF, toon('#fffaf2', { fog: true }), caps, false), inst(SPH_LO, toon('#fffaf2', { fog: true }), drips, false)]) m.userData.backdrop = true;
    // 虹：ケーキの丘（第2区間）の向こうに架かる
    const dir = tp(at(2, 0.5), W / 2).n, c = dir.clone().multiplyScalar(base + 160).setY(-30), g = fantasyGroup(c); g.rotation.y = -Math.atan2(dir.z, dir.x) + Math.PI / 2; g.userData.backdrop = true;
    ['#ff5f6a', '#ff9f4a', '#ffe14a', '#6fdc7a', '#5ab8ff', '#7a7cff', '#c27aff'].forEach((col, k) => {
      const m = new THREE.Mesh(new THREE.TorusGeometry(330 - k * 9, 4.6, 6, 64, Math.PI), new THREE.MeshBasicMaterial({ color: C(col), transparent: true, opacity: 0.55, depthWrite: false, fog: true }));
      g.add(m);
    });
  }

  /* ---- 第1区間の外：チョコレートのヴィスワ川。岸の穀物倉、橋の門、鉄のアーチ橋（ピウスツキ橋）、遊覧船 ---- */
  const riverPts = outerPath(at(1, 0.02), at(1, 0.98), W / 2 + 74, 50);
  {
    riverPts.forEach(p => { onGround(p); occupied.push({ x: p.x, z: p.z, r: 21 }); });
    ribbon(riverPts, 48, 0.04, toon('#f0d6a4', { side: THREE.DoubleSide }), 40, W / 2 + 10);
    // 溶けたチョコレートの流れ：渦を巻く明るい筋が下流へ流れる
    const chocoTex = ctex(256, 256, g => {
      g.fillStyle = '#6a3a24'; g.fillRect(0, 0, 256, 256);
      for (let i = 0; i < 40; i++) { g.strokeStyle = `rgba(${Math.random() < 0.5 ? '160,100,60' : '60,30,18'},${rand(0.25, 0.5)})`; g.lineWidth = rand(2, 5); g.beginPath(); const x0 = rand(0, 256), y0 = rand(0, 256); for (let k = 0; k < 10; k++) g.lineTo(x0 + Math.sin(k * 0.7 + i) * 18, y0 + k * 12); g.stroke(); }
      for (let i = 0; i < 30; i++) { g.fillStyle = 'rgba(255,230,200,.18)'; g.beginPath(); g.ellipse(rand(0, 256), rand(0, 256), rand(2, 5), rand(8, 20), 0, 0, Math.PI * 2); g.fill(); }
    }, true);
    const river = ribbon(riverPts, 36, 0.12, toon('#ffffff', { map: chocoTex, side: THREE.DoubleSide }), 36, W / 2 + 12);
    river.material.emissive = C('#3a1a0a'); river.material.emissiveIntensity = 0.2;
    updates.push(t => { chocoTex.offset.y = -(reduced.matches ? 0 : t) * 0.06; });
    registerLandmark(fantasyGroup(riverPts[(riverPts.length / 2) | 0].clone()), 'チョコレートのヴィスワ川');

    // 穀物倉（スピフレシュ）：川岸に並ぶ、急な切妻屋根のゴシックのれんがの倉。屋根の縁にアイシング
    const gr = site('ヴィスワ川の穀物倉', at(1, 0.22), W / 2 + 30, 34, 14, '#f0d6a4', W / 2 + 22);
    for (let k = 0; k < 3; k++) {
      const x = -11 + k * 11, h = 13 + k % 2 * 3;
      addBox(gr, [9.4, h, 11], [x, h / 2, 0], k === 1 ? chocoBrick : gingerBrick, null, 0.02);
      iceRoof(gr, k === 1 ? pinkM : choco, [x, h, 0], [11.4, 9, 9.8], Math.PI / 2);
      for (let f = 0; f < 3; f++) for (const xx of [-2.4, 0, 2.4]) addBox(gr, [1, 1.6, 0.2], [x + xx, 3 + f * 3.6, -5.55], toon('#4a2a1e'));
      addBox(gr, [1.4, 1.4, 0.3], [x, h + 3, -4.6], toon('#4a2a1e'));
    }
    signAt(gr, 'ヴィスワ川の穀物倉', 25, 13);
    // 橋の門（ブラマ・モストヴァ）：川へ下りる門の塔
    const bg = site('橋の門（ブラマ・モストヴァ）', at(1, 0.55), W / 2 + 28, 14, 10, '#f0d6a4', W / 2 + 22);
    addBox(bg, [12, 14, 8], [0, 7, 0], gingerBrick, null, 0.02); addBox(bg, [5, 7, 8.2], [0, 3.5, 0], toon('#3a2218'));
    iceRoof(bg, choco, [0, 14, 0], [12.6, 6, 8.6]);
    for (const x of [-4, 4]) addBox(bg, [1.2, 2.4, 0.2], [x, 10, -4.15], toon('#4a2a1e'));
    for (const x of [-6, 6]) part(bg, CONE, pinkM, [x, 16, -4], [0.5, 2.4, 0.5], null, 0);
    signAt(bg, '橋の門', 23, 8);
    // 川岸の散歩道（フィラデルフィア遊歩道）の街灯と、散歩する人
    const posts = [], lamps = [];
    for (let s = at(1, 0.05); s < at(1, 0.95); s += 10) {
      const p = onGround(local(s, 0, W / 2 + 48)); if (taken(p.x, p.z, 0.5)) continue;
      posts.push({ p: p.clone().add(new V3(0, 2, 0)), s: new V3(0.1, 4, 0.1) }); lamps.push({ p: p.clone().add(new V3(0, 4.2, 0)), s: new V3(0.4, 0.5, 0.4) });
      if (Math.random() < 0.6) addPerson(onGround(local(s + rand(-3, 3), 0, W / 2 + rand(44, 52))));
    }
    addInst(CYL, toon('#3a2a2a'), posts, false); addInst(SPH_LO, toon('#fff0c8', { emissive: C('#ffcf7a'), emissiveIntensity: 0.8 }), lamps, false);

    // 鉄のアーチ橋（ピウスツキ橋）：川を渡る、アーチを連ねた鉄の橋。キャンディの縞に塗る
    const mid = (riverPts.length / 2) | 0, c = riverPts[mid].clone(), d = riverPts[mid + 1].clone().sub(riverPts[mid - 1]).setY(0).normalize(), a = new V3(-d.z, 0, d.x);
    if (a.dot(c.clone().sub(local(at(1, 0.5), 0, 0))) < 0) a.negate();
    const bridge = registerLandmark(fantasyGroup(c.clone().setY(0)), '鉄のアーチ橋（ピウスツキ橋）'); bridge.rotation.y = -Math.atan2(a.z, a.x);
    for (let k = -4; k <= 4; k++) { const q = c.clone().addScaledVector(a, k * 9); occupied.push({ x: q.x, z: q.z, r: 6 }); }
    const deckY = 4.5, span = 22;
    addBox(bridge, [74, 0.8, 9], [6, deckY, 0], toon('#c9a27a'), null, 0.02);
    for (const z of [-4.6, 4.6]) addBox(bridge, [74, 0.6, 0.3], [6, deckY + 0.8, z], icing);
    const arc = new THREE.TorusGeometry(1, 0.06, 6, 24, Math.PI), hangers = [];
    for (let k = -1; k <= 1; k++) {
      const x0 = 6 + k * span;
      for (const z of [-4.3, 4.3]) {
        part(bridge, arc, k ? pinkM : mintM, [x0, deckY + 0.4, z], [span / 2, 7, 6], null, 0);
        for (let j = 1; j < 8; j++) { const u = j / 8, x = x0 - span / 2 + u * span, h = Math.sin(u * Math.PI) * 7; hangers.push({ p: new V3(x, deckY + 0.4 + h / 2, z), s: new V3(0.12, h, 0.12) }); }
      }
      if (k < 1) addBox(bridge, [3, deckY + 2, 8], [x0 + span / 2, (deckY - 2) / 2, 0], gingerBrick);
    }
    bridge.add(inst(BOX, icing, hangers, false));
    for (let k = 0; k < 6; k++) figure(bridge, rand(-14, 26), deckY + 0.4, rand(-3, 3), pick(['#ff7fab', '#7fc4ff', '#ffe27a', '#8ee39a']), 1, pick(['#e8384f', '#3fbfa8']));

    // 遊覧船：外輪の付いた白い船と、ジンジャーブレッドを積んだはしけ。川を行き来する
    const r = route(riverPts.slice(30, riverPts.length - 30), false), boats = [];
    for (let i = 0; i < 2; i++) {
      const g = fantasyGroup(); g.userData.droneIgnore = true;
      if (i === 0) {
        addBox(g, [14, 1.6, 4.4], [0, 0.6, 0], toon('#fffaf4'), null, 0.02); addBox(g, [9, 2, 3.6], [-0.5, 2.4, 0], toon('#ff9cc2'), null, 0.02);
        addBox(g, [9.2, 0.3, 4], [-0.5, 3.5, 0], icing); part(g, CYL, toon('#e8384f'), [2.5, 4.6, 0], [0.45, 2, 0.45], null, 0);
        for (const z of [-2.5, 2.5]) part(g, CYL, toon('#c8302c'), [-4.5, 1.2, z], [1.4, 0.5, 1.4], [Math.PI / 2, 0, 0], 0);
        for (let k = 0; k < 6; k++) addBox(g, [0.9, 0.9, 0.1], [-4 + k * 1.4, 2.6, -1.85], toon('#bfe8ff'));
        for (let k = 0; k < 4; k++) figure(g, rand(-5, 3), 3.6, rand(-1.3, 1.3), pick(['#ff7fab', '#7fc4ff', '#ffe27a']), 0.8);
      } else {
        addBox(g, [12, 1.2, 4], [0, 0.4, 0], darkWood, null, 0.02);
        for (let k = 0; k < 10; k++) part(g, DISC, ginger, [-4.5 + (k % 5) * 2.2, 1.5 + Math.floor(k / 5) * 0.2, (k % 2 ? 0.8 : -0.8)], [0.9, 0.9, 1], [0, rand(0, 3), 0], 0);
        figure(g, 5, 1, 0, '#3f6fbf', 1, '#e8384f');
      }
      boats.push({ g, off: i * r.L * 0.55, v: 3 + i });
    }
    updates.push(t => {
      const m = reduced.matches ? 0 : t, sp = r.L - 10;
      for (const b of boats) {
        const k = mod(m * b.v + b.off, sp * 2), back = k > sp, { p, yaw } = r.at((back ? sp * 2 - k : k) + 5);
        b.g.position.set(p.x, 0.25 + Math.sin(m * 1.3 + b.off) * 0.08, p.z); b.g.rotation.y = yaw + (back ? Math.PI : 0);
      }
    });
  }

  /* ---- 第2区間の外：ケーキの丘。いちごのショートケーキ、カップケーキ、立てたドーナツ、マカロンの塔、いちご畑 ---- */
  const cake = { candles: [], flames: null };
  {
    const s = at(2, 0.5), c = onGround(local(s, 0, W / 2 + 112)), g = registerLandmark(fantasyGroup(c), 'ケーキの丘（いちごのショートケーキ）');
    g.position.y = c.y - 1; g.rotation.y = yawAt(s);
    const layers = [[0, 9, sponge], [9, 3, cream], [12, 9, sponge], [21, 3.4, cream]];
    for (const [y, h, m] of layers) part(g, new THREE.CylinderGeometry(42, 42, h, 48), m, [0, y + h / 2, 0], null, null, 0.01);
    // 側面に垂れる生クリームと、上の縁のクリームといちご
    const drips = [], dollops = [], berries = [], tops = [];
    for (let k = 0; k < 40; k++) { const a = k / 40 * Math.PI * 2; drips.push({ p: new V3(Math.cos(a) * 42, 22 - rand(1, 4), Math.sin(a) * 42), s: new V3(1.6, rand(2.5, 5), 1.6) }); }
    for (let k = 0; k < 24; k++) {
      const a = k / 24 * Math.PI * 2;
      dollops.push({ p: new V3(Math.cos(a) * 37, 25, Math.sin(a) * 37), s: new V3(3, 2.4, 3) });
      berries.push({ p: new V3(Math.cos(a) * 37, 27.8, Math.sin(a) * 37), s: new V3(1.8, 2.2, 1.8), r: [Math.PI, 0, 0] });
      tops.push({ p: new V3(Math.cos(a) * 37, 29, Math.sin(a) * 37), s: new V3(1.2, 0.3, 1.2) });
    }
    g.add(inst(SPH_LO, cream, drips, false), inst(SPH_LO, cream, dollops), inst(new THREE.ConeGeometry(1, 1, 10), berry, berries), inst(SPH_LO, leaf, tops, false));
    // 中央の大きないちごと、ろうそく（ゴールで炎が大きくなる）
    part(g, new THREE.ConeGeometry(7, 10, 14), berry, [0, 30, 0], null, [Math.PI, 0, 0], 0.02); part(g, SPH_LO, berry, [0, 32, 0], [7, 4, 7], null, 0.02); part(g, SPH_LO, leaf, [0, 36.2, 0], [4, 1, 4], null, 0);
    const candleL = [], flameL = [];
    for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2 + 0.2, x = Math.cos(a) * 22, z = Math.sin(a) * 22; candleL.push({ p: new V3(x, 29, z), s: new V3(0.7, 8, 0.7), c: C(candyCols[k % candyCols.length]) }); flameL.push({ p: new V3(x, 33.8, z), s: new V3(0.6, 1.1, 0.6) }); }
    g.add(inst(CYL, toon('#ffffff', { map: caneTex }), candleL, false));
    cake.flames = inst(SPH_LO, new THREE.MeshBasicMaterial({ color: C('#ffcf5a').multiplyScalar(2.4) }), flameL, false); g.add(cake.flames);
    g.updateMatrixWorld(true); cake.flamePts = flameL.map(o => g.localToWorld(o.p.clone()));
    signAt(g, 'ケーキの丘', 44, 12);
    occupied.push({ x: c.x, z: c.z, r: 48 });
    // カップケーキ：ひだのある紙の型に、渦巻きのクリームとさくらんぼ
    const liner = toon('#ffffff', { map: ctex(64, 32, c2 => { for (let x = 0; x < 64; x += 8) { c2.fillStyle = (x / 8) % 2 ? '#ff9cc2' : '#ffd0e2'; c2.fillRect(x, 0, 8, 32); } }, true) });
    const cupG = new THREE.CylinderGeometry(1, 0.78, 1, 16, 1, true);
    for (let k = 0; k < 5; k++) {
      const s2 = at(2, 0.1 + k * 0.2), v = W / 2 + rand(48, 62) + (k % 2) * 70, p = onGround(local(s2, 0, v));
      if (taken(p.x, p.z, 8)) continue;
      const cg = registerLandmark(fantasyGroup(p), k ? 'カップケーキ' : 'カップケーキの丘'); const sc = rand(3.2, 4.6);
      part(cg, cupG, liner, [0, 2 * sc / 2, 0], [2 * sc, 2 * sc, 2 * sc], null, 0.02); part(cg, CYL, sponge, [0, 2 * sc, 0], [2 * sc, 0.2, 2 * sc], null, 0);
      const fc = pick([pinkM, mintM, lemonM, lilacM, cream]);
      for (let j = 0; j < 4; j++) part(cg, new THREE.TorusGeometry(1, 0.45, 8, 20), fc, [0, 2 * sc + 0.4 * sc + j * 0.7 * sc, 0], [(1.8 - j * 0.4) * sc, (1.8 - j * 0.4) * sc, sc], [Math.PI / 2, 0, j], 0.02);
      part(cg, SPH_LO, berry, [0, 5.4 * sc, 0], [0.55 * sc, 0.55 * sc, 0.55 * sc], null, 0.03);
      const sprinkles = []; for (let j = 0; j < 30; j++) { const a = rand(0, Math.PI * 2), rr = rand(0.4, 1.6) * sc; sprinkles.push({ p: new V3(Math.cos(a) * rr, 2.6 * sc + rand(0, 2) * sc, Math.sin(a) * rr), s: new V3(0.08 * sc, 0.08 * sc, 0.3 * sc), r: [rand(0, 3), rand(0, 3), 0], c: C(pick(candyCols)) }); }
      cg.add(inst(BOX, toon('#ffffff'), sprinkles, false));
      occupied.push({ x: p.x, z: p.z, r: 2.4 * sc });
    }
    // 立てたドーナツ（ピンクのアイシングにスプリンクル）と、マカロンの塔
    {
      const p = onGround(local(at(2, 0.85), 0, W / 2 + 60));
      if (!taken(p.x, p.z, 10)) {
        const dg = registerLandmark(fantasyGroup(p), '大きなドーナツ'); dg.rotation.y = yawAt(at(2, 0.85));
        part(dg, new THREE.TorusGeometry(6, 3, 14, 32), toon('#e2a25e'), [0, 9.6, 0], null, null, 0.02);
        part(dg, new THREE.TorusGeometry(6, 3.05, 14, 32, Math.PI * 2), pinkM, [0, 9.6, 0.5], [1, 1, 0.6], null, 0);
        const sp = []; for (let j = 0; j < 50; j++) { const a = rand(0, Math.PI * 2), rr = 6 + rand(-2.2, 2.2); sp.push({ p: new V3(Math.cos(a) * rr, 9.6 + Math.sin(a) * rr, 2.4), s: new V3(0.15, 0.6, 0.15), r: [0, 0, rand(0, 3)], c: C(pick(candyCols)) }); }
        dg.add(inst(BOX, toon('#ffffff'), sp, false));
        addBox(dg, [10, 0.6, 4], [0, 0.3, 0], toon('#fff3dc'));
        occupied.push({ x: p.x, z: p.z, r: 11 });
      }
      const q = onGround(local(at(2, 0.3), 0, W / 2 + 30));
      if (!taken(q.x, q.z, 5)) {
        const mg = registerLandmark(fantasyGroup(q), 'マカロンの塔');
        for (let j = 0; j < 7; j++) {
          const r2 = 3.6 - j * 0.4, col = pick([pinkM, mintM, lemonM, lilacM, toon('#ffb38a')]);
          part(mg, SPH_LO, col, [0, 0.9 + j * 1.9, 0], [r2, 0.6, r2], null, 0.03); part(mg, SPH_LO, col, [0, 1.9 + j * 1.9, 0], [r2, 0.6, r2], null, 0.03);
          part(mg, CYL, cream, [0, 1.4 + j * 1.9, 0], [r2 * 0.92, 0.5, r2 * 0.92], null, 0);
        }
        occupied.push({ x: q.x, z: q.z, r: 5 });
      }
    }
    // いちご畑：緑の畝に赤い実
    const rows = [], fruit = [];
    for (let s2 = at(2, 0.05); s2 < at(3, 0.05); s2 += 3.2) for (let v = W / 2 + 14; v < W / 2 + 26; v += 2.6) {
      const p = onGround(local(s2, 0, v)); if (taken(p.x, p.z, 1)) continue;
      rows.push({ p: p.clone().add(new V3(0, 0.3, 0)), s: new V3(1.1, 0.6, 1.1) });
      for (let k = 0; k < 3; k++) fruit.push({ p: p.clone().add(new V3(rand(-0.8, 0.8), 0.45, rand(-0.8, 0.8))), s: new V3(0.22, 0.28, 0.22) });
    }
    addInst(SPH_LO, leaf, rows, false); addInst(SPH_LO, berry, shuffle(fruit), false);
    if (rows.length) { registerLandmark(fantasyGroup(rows[(rows.length / 2) | 0].p.clone()), 'いちご畑'); for (const o of rows) occupied.push({ x: o.p.x, z: o.p.z, r: 1.2 }); }
  }

  /* ---- 第3区間：頂のジンジャーブレッドの工房（焼き窯の煙突、木の焼き型、焼きたてのカタジンカ）と、ドイツ騎士団の城跡・ダンスカー塔 ---- */
  // カタジンカ：6つの円をつないだトルンのジンジャーブレッド（局所 xy 面に立てる。幅は約 3.6r）
  const katarzynka = (parent, r, mat, edge, pos, rotY = 0) => {
    const g = new THREE.Group(); g.position.set(...pos); g.rotation.y = rotY; parent.add(g);
    for (const [x, y] of [[-1.2, 0.55], [0, 0.75], [1.2, 0.55], [-1.2, -0.55], [0, -0.75], [1.2, -0.55]]) {
      part(g, new THREE.CylinderGeometry(r, r, r * 0.3, 24), mat, [x * r, y * r, 0], null, [Math.PI / 2, 0, 0], 0.02);
      part(g, new THREE.TorusGeometry(r * 0.78, r * 0.05, 6, 24), edge, [x * r, y * r, r * 0.16], null, null, 0);
    }
    return g;
  };
  {
    const g = site('ジンジャーブレッドの工房', at(3, 0.42), W / 2 + 30, 30, 20, '#f0d6a4', W / 2 + 24);
    addBox(g, [20, 7, 12], [-3, 3.5, 2], gingerBrick, null, 0.02);
    iceRoof(g, choco, [-3, 7, 2], [21, 6, 13.2]);
    for (let k = 0; k < 7; k++) part(g, SPH_LO, toon(candyCols[k % candyCols.length]), [-12 + k * 3, 13.2, 2], [0.7, 0.7, 0.7], null, 0);   // 棟のグミ
    for (let x = -11; x <= 5; x += 4) { addBox(g, [2, 2.4, 0.2], [x, 3.4, -4.05], warm); addBox(g, [2.4, 0.3, 0.3], [x, 4.75, -4.1], icing); }
    addBox(g, [2.6, 4, 0.2], [-3, 2, -4.06], toon('#5a3a26'));
    // 焼き窯の大きな煙突
    addBox(g, [3.4, 14, 3.4], [7.6, 7, 4], chocoBrick, null, 0.02); addBox(g, [4, 0.8, 4], [7.6, 14.2, 4], icing); smokes.push(g.localToWorld(new V3(7.6, 15, 4)));
    // 木の焼き型：騎士や馬車を彫り込んだ大きな板
    const mold = toon('#ffffff', { map: ctex(128, 192, c => {
      c.fillStyle = '#8a5a34'; c.fillRect(0, 0, 128, 192); c.strokeStyle = '#4a2c18'; c.lineWidth = 5; c.strokeRect(8, 8, 112, 176);
      c.lineWidth = 4; c.beginPath(); c.ellipse(64, 70, 30, 22, 0, 0, Math.PI * 2); c.stroke();
      c.beginPath(); c.moveTo(30, 140); c.lineTo(50, 112); c.lineTo(80, 112); c.lineTo(98, 140); c.moveTo(42, 140); c.lineTo(42, 160); c.moveTo(86, 140); c.lineTo(86, 160); c.stroke();
      c.beginPath(); c.arc(64, 70, 10, 0, Math.PI * 2); c.stroke(); for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2; c.beginPath(); c.moveTo(64 + Math.cos(a) * 14, 70 + Math.sin(a) * 14); c.lineTo(64 + Math.cos(a) * 26, 70 + Math.sin(a) * 18); c.stroke(); }
    }) });
    addBox(g, [4, 6, 0.5], [-14.4, 3, -3], mold, [0.18, 0, 0]);
    // 焼きたての棚：カタジンカとハート形
    for (const x of [-9, 1]) {
      addBox(g, [6, 1, 2.4], [x, 0.5, -6.5], wood); addBox(g, [6.2, 0.15, 2.6], [x, 1.05, -6.5], icing);
      for (let k = 0; k < 3; k++) katarzynka(g, 0.42, ginger, icing, [x - 2 + k * 2, 1.7, -6.5], 0);
    }
    // パン職人（白い服に高い帽子）と、はちみつの樽
    for (let k = 0; k < 4; k++) { const x = rand(-12, 4), z = rand(-9, -7.5); figure(g, x, 0, z, '#fffaf4', 1, '#ffffff'); part(g, CYL, toon('#ffffff'), [x, 2.45, z], [0.26, 0.5, 0.26], null, 0); }
    for (let k = 0; k < 4; k++) part(g, new THREE.CylinderGeometry(0.75, 0.75, 1.4, 12), toon('#b07a3a'), [10 + (k % 2) * 1.7, 0.7 + Math.floor(k / 2) * 1.4, -4 + (k % 2) * 0.4], null, null, 0.03);
    g.updateMatrixWorld(true);
    for (let k = 0; k < 10; k++) addPerson(g.localToWorld(new V3(rand(-12, 8), 0, rand(-12, -10))));
    signAt(g, 'ジンジャーブレッドの工房', 19, 15);
  }
  {
    // ドイツ騎士団の城跡：崩れたれんがの壁と、川へ張り出したアーチの回廊の先のダンスカー塔（グダニスコ）
    const s = at(3, 0.75), c = onGround(local(s, 0, W / 2 + 70));
    if (!taken(c.x, c.z, 22)) {
      const g = registerLandmark(fantasyGroup(c), 'ドイツ騎士団の城跡とダンスカー塔'); g.rotation.y = yawAt(s);
      landmarkFoundation(g, 40, 30, '#e7c99a');
      const walls = [[-14, 0, 0.8, 22], [14, 0, 0.8, 22], [0, -10, 28, 0.8], [0, 10, 28, 0.8]];
      for (const [x, z, w, d] of walls) {
        const n = Math.max(w, d) / 4;
        for (let k = 0; k < n; k++) { const h = rand(2, 9), f = (k + 0.5) / n - 0.5; addBox(g, [w > 1 ? 4 : 1.6, h, d > 1 ? 4 : 1.6], [x + (w > 1 ? f * w : 0), h / 2, z + (d > 1 ? f * d : 0)], chocoBrick, null, 0.02); }
      }
      // 回廊のアーチ（下に通り抜けの穴）と、先端の四角い塔
      for (let k = 0; k < 4; k++) { addBox(g, [1.6, 9, 2.6], [-3 + k * 5, 4.5, 16], chocoBrick, null, 0.02); }
      addBox(g, [16, 2.4, 3], [4.5, 10.2, 16], chocoBrick, null, 0.02); addBox(g, [16.4, 0.4, 3.4], [4.5, 11.6, 16], icing);
      addBox(g, [8, 22, 8], [15, 11, 16], chocoBrick, null, 0.02); iceRoof(g, choco, [15, 22, 16], [8.6, 5, 8.6]);
      for (const y of [8, 14, 19]) addBox(g, [1, 2, 0.2], [15, y, 11.95], toon('#3a2218'));
      signAt(g, 'ドイツ騎士団の城跡', 28, 13);
      occupied.push({ x: c.x, z: c.z, r: 26 });
    }
  }

  /* ---- 第4〜5区間：旧市街の路地。パステルの家並み、城壁と斜塔、船乗りの門、コペルニクスの家 ---- */
  // 家並みの壁：白地に窓（チョコの窓と白い枠、花の窓辺）。色はインスタンスごとに塗る
  const facade = ctex(128, 128, c => {
    c.fillStyle = '#ffffff'; c.fillRect(0, 0, 128, 128);
    for (let y = 0; y < 3; y++) for (let x = 0; x < 3; x++) {
      const px = 14 + x * 38, py = 12 + y * 40;
      c.fillStyle = '#f2f2f2'; c.fillRect(px - 3, py - 3, 26, 32); c.fillStyle = '#5a3424'; c.fillRect(px, py, 20, 26);
      c.fillStyle = '#ffffff'; c.fillRect(px + 9, py, 2, 26); c.fillRect(px, py + 11, 20, 2);
      c.fillStyle = ['#ff6f9a', '#ffd34a', '#ff9f68'][(x + y) % 3]; c.fillRect(px - 2, py + 26, 24, 4);
    }
    c.fillStyle = '#e6e0d8'; c.fillRect(0, 124, 128, 4);
  });
  const facadeM = toon('#ffffff', { map: facade }), plainM = toon('#ffffff');
  const houses = [], roofs = [], roofIcing = [], ridges = [];
  const house = (p, yaw, w, d, h) => {
    const col = C(pick(['#ffa8c8', '#9fe3d2', '#ffe58a', '#c6b4ff', '#ffc49a', '#a8d4ff', '#ffc2d8', '#f6efe2']));
    houses.push({ p: p.clone().add(new V3(0, h / 2, 0)), s: new V3(w, h, d), r: [0, yaw, 0], c: col });
    // 切妻を通りへ向ける（棟は奥行きの向き）
    const rh = w * rand(0.7, 1.0), rc = C(pick(['#7d4b2e', '#5a3222', '#e86a8a', '#c98a55', '#9a5a3a']));
    roofs.push({ p: p.clone().add(new V3(0, h, 0)), s: new V3(d + 0.6, rh, w + 0.5), r: [0, yaw + Math.PI / 2, 0], c: rc });
    roofIcing.push({ p: p.clone().add(new V3(0, h + rh * 0.45 + 0.15, 0)), s: new V3(d + 0.9, rh * 0.55, (w + 0.5) * 0.55), r: [0, yaw + Math.PI / 2, 0] });
    if (Math.random() < 0.6) ridges.push({ p: p.clone().add(new V3(0, h + rh + 0.25, 0)), s: new V3(0.45, 0.45, 0.45), c: C(pick(candyCols)) });
  };
  // 通りの片側に家を並べる（side: 1 外、-1 内馬場）
  const street = (s0, s1, side, v0, opts = {}) => {
    for (let s = s0; s < s1;) {
      const w = rand(6.5, 9), d = rand(9, 12), h = rand(9, 14), v = side * (v0 + d / 2), p = onGround(local(s + w / 2, 0, v)), yaw = yawAt(s + w / 2);
      s += w + rand(0.3, 1.2);
      if (!clearAt(p.x, p.z, W / 2 + 7, Math.max(w, d) / 2) || (side < 0 && !inLoop(p.x, p.z)) || (opts.outside && inLoop(p.x, p.z))) continue;
      house(p, yaw, w, d, h); occupied.push({ x: p.x, z: p.z, r: Math.max(w, d) / 2 + 0.5 });
    }
  };
  {
    // 城壁と斜塔（クシヴァ・ヴィエジャ）：家並みの外を城壁が囲み、斜塔は傾いたまま立つ
    const s = at(4, 0.5), lt = site('斜塔（クシヴァ・ヴィエジャ）', s, W / 2 + 40, 10, 10, '#f0d6a4', W / 2 + 30);
    const tower = new THREE.Group(); tower.rotation.z = 0.12; lt.add(tower);
    addBox(tower, [7, 16, 7], [0, 8, 0], chocoBrick, null, 0.02); iceRoof(tower, choco, [0, 16, 0], [7.6, 5, 7.6]);
    for (const y of [5, 10]) addBox(tower, [1.2, 2, 0.2], [0, y, -3.55], toon('#3a2218'));
    signAt(lt, '斜塔', 25, 6);
    // 城壁：斜塔の両側へ続く、胸壁の付いたれんがの壁
    const wall = [], crenel = [];
    for (let s2 = at(3, 0.95); s2 < at(5, 0.9); s2 += 4) {
      const p = onGround(local(s2, 0, W / 2 + 40)), q = onGround(local(s2 + 4, 0, W / 2 + 40));
      if (taken(p.x, p.z, 1.5) && p.distanceTo(lt.position) > 6) continue;
      if (p.distanceTo(lt.position) < 6) continue;
      const b = beam(p.clone().add(new V3(0, 3, 0)), q.clone().add(new V3(0, 3, 0)), 6); b.s.z = 1.6; wall.push(b);
      crenel.push({ p: p.clone().add(new V3(0, 6.5, 0)), s: new V3(1.4, 1.2, 1.8), r: [0, yawAt(s2), 0] });
      occupied.push({ x: p.x, z: p.z, r: 2.5 });
    }
    addInst(BOX, chocoBrick, wall); addInst(BOX, chocoBrick, crenel, false);
    // 船乗りの門（ブラマ・ジェグラルスカ）
    const sg = site('船乗りの門（ブラマ・ジェグラルスカ）', at(5, 0.25), W / 2 + 42, 12, 8, '#f0d6a4', W / 2 + 32);
    addBox(sg, [10, 12, 6], [0, 6, 0], gingerBrick, null, 0.02); addBox(sg, [4, 6, 6.2], [0, 3, 0], toon('#3a2218'));
    iceRoof(sg, pinkM, [0, 12, 0], [10.6, 5, 6.6]);
    signAt(sg, '船乗りの門', 20, 9);
    // コペルニクスの家：段々の破風（ステップ・ゲーブル）を二つ並べたゴシックの家。1473年にコペルニクスが生まれた町の家
    const ck = site('コペルニクスの家', at(5, 0.62), W / 2 + 16, 14, 11, '#f0d6a4', W / 2 + 11);
    for (const x of [-3.4, 3.4]) {
      addBox(ck, [6.6, 12, 10], [x, 6, 0], gingerBrick, null, 0.02);
      for (let k = 0; k < 5; k++) addBox(ck, [6.6 - k * 1.3, 1.6, 0.8], [x, 12.8 + k * 1.6, -4.6], gingerBrick, null, 0.02);
      for (let k = 0; k < 5; k++) part(ck, CONE, icing, [x + (k % 2 ? 1 : -1) * (3.3 - k * 0.65), 13.9 + k * 1.6, -4.6], [0.3, 1, 0.3], null, 0);
      part(ck, PRISM, choco, [x, 12, 0.8], [8.6, 8, 6.6], [0, Math.PI / 2, 0], 0.02);
      for (let f = 0; f < 3; f++) for (const xx of [-1.6, 1.6]) { addBox(ck, [1.2, 2, 0.2], [x + xx, 2.6 + f * 3.4, -5.05], toon('#4a2a1e')); addBox(ck, [1.6, 0.25, 0.3], [x + xx, 3.7 + f * 3.4, -5.1], icing); }
      for (const y of [14, 17]) addBox(ck, [1, 1.6, 0.2], [x, y, -5.05], toon('#4a2a1e'));
    }
    addBox(ck, [2.2, 3.4, 0.2], [-3.4, 1.7, -5.06], toon('#6a4228'));
    signAt(ck, 'コペルニクスの家', 24, 11);
    // 家並み：路地の両側と城壁の内側
    street(at(3, 0.92), at(5, 0.95), 1, W / 2 + 9, { outside: true });
    street(at(3, 0.92), at(5, 0.95), 1, W / 2 + 23, { outside: true });
    street(at(4, 0.0), at(5, 0.9), -1, W / 2 + 10);
    registerLandmark(fantasyGroup(onGround(local(at(4, 0.5), 0, W / 2 + 14))), '旧市街の路地');
  }

  /* ---- 第6区間：シュガーダッシュの下り。キャンディの森、キャンディケインの門、グミのくま ---- */
  {
    // キャンディケインの門：走路をまたぐ縞の柱とアーチ。坂の入口と出口に
    for (const t of [0.12, 0.88]) {
      const s = at(6, t), f = tp(s, W / 2), g = registerLandmark(fantasyGroup(f.v.clone()), t < 0.5 ? 'キャンディケインの門' : 'キャンディケインの門（出口）'); g.rotation.y = -f.h;
      const R = W / 2 + 2.5;
      for (const z of [-R, R]) { part(g, CYL, caneM, [0, 4, z], [0.6, 8, 0.6], null, 0.03); part(g, SPH_LO, toon('#ff5f9a'), [0, 8.3, z], [0.9, 0.9, 0.9], null, 0); }
      part(g, new THREE.TorusGeometry(R, 0.55, 10, 40, Math.PI), caneM, [0, 8, 0], null, [0, Math.PI / 2, 0], 0.03);
      // アーチの頂の大きな棒つきキャンディ
      part(g, DISC, lollyMats[t < 0.5 ? 0 : 1][0], [0, 8 + R + 2.2, 0], [2.2, 2.2, 1], [0, Math.PI / 2, 0], 0.03);
      const p0 = local(s, 0, -R), p1 = local(s, 0, R); occupied.push({ x: p0.x, z: p0.z, r: 2 }, { x: p1.x, z: p1.z, r: 2 });
    }
    // グミのくま：半透明の色とりどりのくまが並んで見送る
    const bears = [];
    for (let k = 0; k < 7; k++) {
      const s = at(6, 0.25 + k * 0.08), p = onGround(local(s, 0, W / 2 + 16 + (k % 2) * 4));
      if (taken(p.x, p.z, 4)) continue;
      const g = fantasyGroup(p); g.rotation.y = yawAt(s) - Math.PI / 2; g.scale.setScalar(2.1); const m = toon(candyCols[k % candyCols.length], { transparent: true, opacity: 0.82, emissive: C(candyCols[k % candyCols.length]), emissiveIntensity: 0.15 });
      part(g, SPH_LO, m, [0, 1.6, 0], [1.2, 1.5, 1], null, 0.03); part(g, SPH_LO, m, [0, 3.4, 0], [1, 0.9, 0.9], null, 0.03);
      for (const x of [-0.7, 0.7]) { part(g, SPH_LO, m, [x, 4.2, 0], [0.35, 0.35, 0.3], null, 0); part(g, SPH_LO, m, [x * 1.5, 2.3, 0.2], [0.4, 0.7, 0.4], [0, 0, x], 0); part(g, SPH_LO, m, [x * 0.8, 0.45, 0.2], [0.45, 0.5, 0.5], null, 0); }
      const arm = new THREE.Group(); arm.position.set(-1.1, 2.6, 0); g.add(arm); part(arm, SPH_LO, m, [-0.3, 0.5, 0], [0.38, 0.75, 0.38], [0, 0, 0.5], 0);
      bears.push({ arm, ph: k });
      occupied.push({ x: p.x, z: p.z, r: 4.6 });
      if (!k) registerLandmark(g, 'グミのくま');
    }
    updates.push(t => { const m = reduced.matches ? 0 : t; for (const b of bears) b.arm.rotation.z = 0.4 + Math.sin(m * 3 + b.ph) * 0.45 * (celebration > 0 ? 1.6 : 1); });
    registerLandmark(fantasyGroup(onGround(local(at(6, 0.5), 0, W / 2 + 60))), 'キャンディの森');
  }

  /* ---- 第7区間：聖ヨハネ大聖堂（大きな鐘トゥバ・デイ）と、筏師の噴水（バイオリンを弾く筏師とカエル）、ロバの像 ---- */
  let bell = null;
  {
    const g = site('聖ヨハネ大聖堂', at(7, 0.5), W / 2 + 46, 46, 22, '#f0d6a4', W / 2 + 34);
    addBox(g, [32, 14, 18], [-6, 7, 1], gingerBrick, null, 0.02);
    iceRoof(g, choco, [-6, 14, 1], [32.6, 13, 18.8]);
    // ステンドグラスの尖頭窓（色とりどりのキャンディガラス）
    for (let x = -20; x <= 8; x += 5) { addBox(g, [2, 7, 0.2], [x, 6.5, -8.05], toon(candyCols[((x + 20) / 5) % candyCols.length], { emissive: C(candyCols[((x + 20) / 5) % candyCols.length]), emissiveIntensity: 0.55 })); part(g, CONE, icing, [x, 10.6, -8.1], [1.1, 1.4, 0.2], null, 0); }
    // 塔：どっしりとした四角い塔と、低い四角錐の屋根。鐘の開口部にトゥバ・デイ
    addBox(g, [12, 34, 12], [16, 17, 1], gingerBrick, null, 0.02);
    const roof4 = new THREE.ConeGeometry(1, 1, 4); roof4.rotateY(Math.PI / 4);
    part(g, roof4, choco, [16, 37, 1], [9.4, 6, 9.4], null, 0.02); part(g, roof4, icing, [16, 37 + 6 * 0.45 / 2 + 0.15, 1], [9.4 * 0.55, 6 * 0.55, 9.4 * 0.55], null, 0);
    part(g, SPH_LO, toon('#ffd34a'), [16, 41, 1], [0.7, 0.7, 0.7], null, 0);
    addBox(g, [6, 8, 0.4], [16, 26, -5.05], toon('#3a2218'));
    bell = new THREE.Group(); bell.position.set(16, 29.5, -4.4); g.add(bell);
    part(bell, new THREE.CylinderGeometry(1.2, 2.4, 3.6, 16), toon('#e0b94a'), [0, -2, 0], null, null, 0.04); part(bell, SPH_LO, toon('#e0b94a'), [0, -0.2, 0], [1.2, 0.8, 1.2], null, 0);
    for (let k = 0; k < 4; k++) addBox(g, [1.4, 3.2, 0.2], [12.5 + k * 2.3, 14, -5.05], toon('#4a2a1e'));
    g.updateMatrixWorld(true);
    for (let k = 0; k < 10; k++) addPerson(g.localToWorld(new V3(rand(-18, 10), 0, rand(-12, -10))));
    signAt(g, '聖ヨハネ大聖堂（鐘トゥバ・デイ）', 46, 18);
  }
  const fountain = { jets: [] };
  {
    const s = at(7, 0.22), c = onGround(local(s, 0, W / 2 + 22));
    if (!taken(c.x, c.z, 8)) {
      const g = registerLandmark(fantasyGroup(c), '筏師の噴水（フリサク）'); g.rotation.y = yawAt(s);
      part(g, new THREE.CylinderGeometry(6.5, 6.8, 1.2, 28), toon('#e8dccb'), [0, 0.6, 0], null, null, 0.02);
      part(g, new THREE.CircleGeometry(6, 28), toon('#a8e4ff', { emissive: C('#6fc8ff'), emissiveIntensity: 0.25 }), [0, 1.15, 0], null, [-Math.PI / 2, 0, 0], 0);
      part(g, CYL, toon('#d8ccbb'), [0, 2.4, 0], [1.4, 2.6, 1.4], null, 0.02);
      // 筏師：帽子をかぶり、バイオリンを弾く（カエルを町から連れ出した伝説）
      const bronze = toon('#6f8a6a');
      part(g, new THREE.CapsuleGeometry(0.55, 1.6, 3, 8), bronze, [0, 5.2, 0], null, null, 0.03); part(g, SPH_LO, bronze, [0, 6.8, 0], [0.45, 0.5, 0.45], null, 0.03);
      part(g, CYL, bronze, [0, 7.3, 0], [0.75, 0.12, 0.75], null, 0); part(g, CYL, bronze, [0, 7.55, 0], [0.4, 0.45, 0.4], null, 0);
      addBox(g, [1.2, 0.35, 0.5], [0.5, 6.1, 0.5], toon('#8a5a2a'), [0, 0.6, 0.6]); addBox(g, [1.6, 0.05, 0.05], [0.2, 6.4, -0.2], bronze, [0, -0.5, -0.4]);
      // 縁のカエル：口から水を吹く
      for (let k = 0; k < 8; k++) {
        const a = k / 8 * Math.PI * 2, x = Math.cos(a) * 6.2, z = Math.sin(a) * 6.2, fm = toon('#6fbf4a');
        part(g, SPH_LO, fm, [x, 1.6, z], [0.7, 0.45, 0.6], [0, -a, 0], 0.03);
        for (const e of [-0.25, 0.25]) part(g, SPH_LO, toon('#ffffff'), [x - Math.cos(a) * 0.4 - Math.sin(a) * e, 2.05, z - Math.sin(a) * 0.4 + Math.cos(a) * e], [0.16, 0.16, 0.16], null, 0);
        g.updateMatrixWorld(true);
        fountain.jets.push({ p: g.localToWorld(new V3(x * 0.92, 1.9, z * 0.92)), d: g.localToWorld(new V3(-Math.cos(a), 0, -Math.sin(a))).sub(g.localToWorld(new V3())).normalize() });
      }
      signAt(g, '筏師の噴水', 10, 9);
      occupied.push({ x: c.x, z: c.z, r: 8 });
    }
    // ロバの像：背のとがった木のロバ（かつての罰の道具を再現した像）
    const q = onGround(local(at(7, 0.85), 0, W / 2 + 16));
    if (!taken(q.x, q.z, 3)) {
      const g = registerLandmark(fantasyGroup(q), 'ロバの像'); g.rotation.y = yawAt(at(7, 0.85));
      const dw = toon('#9a6a44');
      addBox(g, [3, 0.6, 1.6], [0, 0.3, 0], toon('#d8ccbb')); part(g, PRISM, dw, [0, 1.9, 0], [2.4, 1.1, 0.9], null, 0.03);
      for (const [x, z] of [[-0.9, -0.3], [-0.9, 0.3], [0.9, -0.3], [0.9, 0.3]]) addBox(g, [0.18, 1.4, 0.18], [x, 1.2, z], dw);
      part(g, SPH_LO, dw, [1.5, 2.6, 0], [0.5, 0.35, 0.3], [0, 0, -0.5], 0.03); for (const z of [-0.15, 0.15]) part(g, CONE, dw, [1.4, 3.1, z], [0.1, 0.5, 0.1], null, 0);
      occupied.push({ x: q.x, z: q.z, r: 3 });
    }
  }

  /* ---- 第8区間の外：ジンジャーブレッドの博物館（れんがの工場の建物と煙突） ---- */
  {
    const g = site('ジンジャーブレッドの博物館', at(8, 0.5), W / 2 + 30, 26, 16, '#f0d6a4', W / 2 + 24);
    addBox(g, [22, 9, 12], [0, 4.5, 1], chocoBrick, null, 0.02);
    for (let k = 0; k < 3; k++) { iceRoof(g, choco, [-7.3 + k * 7.3, 9, 1], [12.6, 3.4, 7.3], Math.PI / 2); }
    addBox(g, [2.4, 18, 2.4], [9, 9, 5], gingerBrick, null, 0.02); addBox(g, [3, 0.8, 3], [9, 18.2, 5], icing);
    for (let x = -9; x <= 7; x += 4) { addBox(g, [2, 3, 0.2], [x, 5, -5.05], warm); addBox(g, [2.4, 0.3, 0.3], [x, 6.65, -5.1], icing); }
    putBoard('ジンジャーブレッドの博物館', g.localToWorld(new V3(0, 10.6, -6.2)), g.rotation.y + Math.PI, 12);
    katarzynka(g, 1.2, ginger, icing, [-8, 3, -6.6]);
    g.updateMatrixWorld(true);
    for (let k = 0; k < 8; k++) addPerson(g.localToWorld(new V3(rand(-10, 10), 0, rand(-11, -8))));
    signAt(g, 'ジンジャーブレッドの博物館', 23, 16);
  }

  /* ---- 内馬場：旧市街の広場。旧市庁舎を中心に、石畳の広場（コペルニクス像、巨大カタジンカ、チョコレートの噴水、回転木馬、行進するジンジャーブレッドマン）、
     そのまわりをお菓子の汽車が走り、外にジンジャーブレッドの家の村。ホーム直線の内側にジンジャーブレッドの市 ---- */
  let hall = null, giant = null, carouselAt = null;
  {
    // 旧市庁舎は内馬場のいちばん広いところ
    let best = null, bestD = 0;
    for (let k = 0; k < 600; k++) {
      const i = (Math.random() * track.N) | 0, p = new V3(track.xs[i], 0, track.zs[i]).lerp(new V3(0, 0, 0), rand(0.2, 1));
      if (!inLoop(p.x, p.z) || p.distanceTo(boardPos) < 50) continue;
      const d = roadDist(p.x, p.z, 200); if (d > bestD) { bestD = d; best = p; }
    }
    const c = onGround(best || new V3(0, 0, 0)), g = registerLandmark(fantasyGroup(c), '旧市庁舎');
    g.rotation.y = yawAt(track.finishS);
    hall = { c };
    g.updateMatrixWorld(true);
    const H = (x, z) => onGround(g.localToWorld(new V3(x, 0, z)));
    // 石畳の広場：ビスケット色といちご色の丸い敷石。地面に沿わせた楕円
    {
      const plazaTex = ctex(256, 256, c2 => {
        c2.fillStyle = '#d9bf98'; c2.fillRect(0, 0, 256, 256);
        for (let y = 0; y < 256; y += 16) for (let x = (y / 16) % 2 ? -8 : 0; x < 256; x += 16) { c2.fillStyle = pick(['#f6e4c8', '#f2d6b8', '#ffd2e0', '#f8ecd8', '#e8c9a0']); c2.beginPath(); if (c2.roundRect) c2.roundRect(x + 1.5, y + 1.5, 13, 13, 4); else c2.rect(x + 1.5, y + 1.5, 13, 13); c2.fill(); }
      }, true);
      // 同心の輪と放射の格子で、縁のなめらかな楕円にする
      const PX = 54, PZ = 50, nr = 14, na = 72, pos = [], uv = [], ix = [];
      for (let i = 0; i <= nr; i++) for (let j = 0; j <= na; j++) {
        const a = j / na * Math.PI * 2, lx = Math.cos(a) * PX * i / nr, lz = Math.sin(a) * PZ * i / nr, w = g.localToWorld(new V3(lx, 0, lz));
        pos.push(w.x, groundAt(w) + 0.07, w.z); uv.push(lx / 8, lz / 8);
      }
      for (let i = 0; i < nr; i++) for (let j = 0; j < na; j++) { const a = i * (na + 1) + j; ix.push(a, a + 1, a + na + 1, a + 1, a + na + 2, a + na + 1); }
      const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geo.setIndex(ix); geo.computeVertexNormals();
      const plaza = new THREE.Mesh(geo, toon('#ffffff', { map: plazaTex, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2 })); plaza.receiveShadow = true; world.add(plaza);
      // 広場の縁の街灯と、広場を歩く人
      const lp = [], lh = [];
      for (let k = 0; k < 20; k++) { const a = k / 20 * Math.PI * 2, q = H(Math.cos(a) * (PX - 1.5), Math.sin(a) * (PZ - 1.5)); lp.push({ p: q.clone().add(new V3(0, 2, 0)), s: new V3(0.1, 4, 0.1) }); lh.push({ p: q.clone().add(new V3(0, 4.2, 0)), s: new V3(0.4, 0.5, 0.4) }); }
      addInst(CYL, toon('#3a2a2a'), lp, false); addInst(SPH_LO, toon('#fff0c8', { emissive: C('#ffcf7a'), emissiveIntensity: 0.8 }), lh, false);
      for (let k = 0; k < 40; k++) { const a = rand(0, Math.PI * 2), rr = rand(30, 50); addPerson(H(Math.cos(a) * rr, Math.sin(a) * rr * 0.92)); }
      // 広場の上には木を植えない
      for (let k = 0; k < 24; k++) { const a = k / 24 * Math.PI * 2; for (const f of [0, 0.5, 0.85]) { const q = H(Math.cos(a) * PX * f, Math.sin(a) * PZ * f); occupied.push({ x: q.x, z: q.z, r: 12 }); } }
    }
    // 中庭を囲む四角い建物：パステルのアイシングで縁取ったジンジャーブレッドのれんが
    for (const [x, z, w, d] of [[0, -11, 30, 6], [0, 11, 30, 6], [-12, 0, 6, 16], [12, 0, 6, 16]]) addBox(g, [w, 11, d], [x, 5.5, z], gingerBrick, null, 0.02);
    for (const [x, z, w, d, ry] of [[0, -11, 30, 6, 0], [0, 11, 30, 6, 0], [-12, 0, 16, 6, Math.PI / 2], [12, 0, 16, 6, Math.PI / 2]]) { iceRoof(g, choco, [x, 11, z], [w + 0.6, 4, d + 0.8], ry); }
    for (let x = -12; x <= 12; x += 3) for (const z of [-14.05, 14.05]) { addBox(g, [1.2, 2.4, 0.2], [x, 3, z], toon('#4a2a1e')); addBox(g, [1.2, 2.4, 0.2], [x, 7.4, z], toon('#4a2a1e')); }
    // 四隅の小塔と、北側の高い塔
    for (const [x, z] of [[-15, -14], [15, -14], [-15, 14], [15, 14]]) { part(g, CYL, gingerBrick, [x, 8, z], [1.5, 16, 1.5], null, 0.02); part(g, CONE, pinkM, [x, 18, z], [1.9, 4, 1.9], null, 0.02); }
    addBox(g, [8, 28, 8], [0, 14, 11], gingerBrick, null, 0.02);
    part(g, CYL, choco, [0, 30, 11], [3.6, 4, 3.6], null, 0.02); part(g, CONE, choco, [0, 35, 11], [3.8, 6, 3.8], null, 0.02); part(g, SPH_LO, toon('#ffd34a'), [0, 38.6, 11], [0.6, 0.6, 0.6], null, 0);
    // 塔の時計
    part(g, CYL, icing, [0, 22, 6.9], [2.2, 0.3, 2.2], [Math.PI / 2, 0, 0], 0); part(g, CYL, icing, [0, 22, 15.1], [2.2, 0.3, 2.2], [Math.PI / 2, 0, 0], 0);
    signAt(g, '旧市庁舎', 44, 9);
    occupied.push({ x: c.x, z: c.z, r: 22 });
    // コペルニクス像：天球儀（アストロラーベ）を掲げて立つ。台座は市庁舎の前
    g.updateMatrixWorld(true);
    const cp = H(0, -29);
    const cg = registerLandmark(fantasyGroup(cp), 'コペルニクス像'); cg.rotation.y = g.rotation.y;
    const bronze = toon('#6f8a6a');
    addBox(cg, [3, 3.4, 3], [0, 1.7, 0], toon('#e8dccb'), null, 0.02); addBox(cg, [3.4, 0.4, 3.4], [0, 3.6, 0], toon('#d8ccbb'));
    part(cg, new THREE.CylinderGeometry(0.5, 0.9, 3, 10), bronze, [0, 5.3, 0], null, null, 0.03); part(cg, SPH_LO, bronze, [0, 7.2, 0], [0.42, 0.48, 0.42], null, 0.03);
    part(cg, CYL, bronze, [0.6, 7.6, -0.3], [0.08, 1.6, 0.08], [0.5, 0, -0.4], 0);
    for (const ry of [0, Math.PI / 2, Math.PI / 4]) part(cg, new THREE.TorusGeometry(0.55, 0.05, 6, 20), toon('#d9b24c'), [1, 8.6, -0.6], null, [Math.PI / 2, ry, 0], 0);
    signAt(cg, 'コペルニクス像', 10.5, 8);
    occupied.push({ x: cp.x, z: cp.z, r: 4 });
    // 巨大カタジンカ：市庁舎の脇に立てた、6つの円のジンジャーブレッド（ゴールで光る）
    const kp = H(-36, 0);
    if (inLoop(kp.x, kp.z) && clearAt(kp.x, kp.z, W / 2 + 14, 8)) {
      const kg = registerLandmark(fantasyGroup(kp), '巨大カタジンカ'); kg.rotation.y = g.rotation.y;
      addBox(kg, [12, 1, 4], [0, 0.5, 0], toon('#fff3dc'), null, 0.02);
      const gm = toon('#c07a3c', { emissive: C('#ff9a3a'), emissiveIntensity: 0 }), em = toon('#fff6fa', { emissive: C('#ffffff'), emissiveIntensity: 0 });
      katarzynka(kg, 2.2, gm, em, [0, 5.2, 0]);
      for (const x of [-3.5, 3.5]) addBox(kg, [0.5, 3, 0.5], [x, 2, 1.2], darkWood, [0.3, 0, 0]);
      giant = { gm, em, c: kp };
      signAt(kg, '巨大カタジンカ', 12, 9);
      occupied.push({ x: kp.x, z: kp.z, r: 8 });
    }
    // 広場を行進するジンジャーブレッドマン：市庁舎のまわりをぐるりと
    const ring = []; for (let k = 0; k < 48; k++) { const a = k / 48 * Math.PI * 2; ring.push(H(Math.cos(a) * 25, Math.sin(a) * 22)); }
    if (ring.every(p => inLoop(p.x, p.z) && roadDist(p.x, p.z, 40) > W / 2 + 6)) {
      const r = route(ring, true), men = [];
      for (let i = 0; i < 9; i++) { const gm2 = fantasyGroup(); gm2.userData.droneIgnore = true; const man = gingerMan(gm2, i === 0 ? 1.4 : 1); men.push({ ...man, root: gm2, off: i * 3.2 }); }
      // 先頭はドラムをたたく
      part(men[0].g, CYL, toon('#e8384f'), [0.6, 1.3, 0], [0.5, 0.45, 0.5], [0, 0, Math.PI / 2], 0.03);
      updates.push(t => {
        const m = reduced.matches ? 0 : t;
        for (const mm of men) {
          const { p, yaw } = r.at(m * 1.4 - mm.off); mm.root.position.set(p.x, p.y + Math.abs(Math.sin(m * 6 + mm.off)) * 0.15, p.z); mm.root.rotation.y = yaw;
          mm.legs.forEach((l, i) => { l.rotation.z = Math.sin(m * 6 + mm.off + i * Math.PI) * 0.45; });
          // ゴールでは両手を上げて喜ぶ
          mm.arms.forEach((a, i) => { a.rotation.z = Math.sin(m * 6 + mm.off + i * Math.PI + Math.PI) * 0.5; a.rotation.x = celebration > 0 ? (i ? -1 : 1) * 1.2 : 0; });
        }
      });
      registerLandmark(fantasyGroup(ring[0].clone()), 'ジンジャーブレッドマンの行進');
      ring.forEach(p => occupied.push({ x: p.x, z: p.z, r: 2 }));
    }
    carouselAt = H(0, 40);
    if (!inLoop(carouselAt.x, carouselAt.z) || !clearAt(carouselAt.x, carouselAt.z, W / 2 + 16, 11)) carouselAt = null;
    // チョコレートの噴水：3段の受け皿から、溶けたチョコレートが幕のように流れ落ちる
    {
      const fq = H(36, 0), fg = registerLandmark(fantasyGroup(fq), 'チョコレートの噴水');
      const fallTex = ctex(64, 128, c2 => { c2.fillStyle = '#6a3a24'; c2.fillRect(0, 0, 64, 128); for (let x = 0; x < 64; x += 4) { c2.fillStyle = `rgba(${Math.random() < 0.5 ? '170,110,70' : '50,24,14'},${rand(0.3, 0.6)})`; c2.fillRect(x, 0, 2, 128); } for (let i = 0; i < 20; i++) { c2.fillStyle = 'rgba(255,220,190,.25)'; c2.fillRect(rand(0, 64), rand(0, 128), 1.5, rand(6, 18)); } }, true);
      fallTex.repeat.set(6, 1);
      const fall = toon('#ffffff', { map: fallTex, side: THREE.DoubleSide, emissive: C('#3a1a0a'), emissiveIntensity: 0.2 });
      part(fg, new THREE.CylinderGeometry(6.4, 6.8, 1.4, 28), toon('#fff3dc'), [0, 0.7, 0], null, null, 0.02);
      part(fg, new THREE.CircleGeometry(5.9, 28), fall, [0, 1.42, 0], null, [-Math.PI / 2, 0, 0], 0);
      // 受け皿の高さ（下から）。幕は各段の縁から、ひとつ下の段（いちばん下は池）まで
      const tiers = [3.4, 6.0, 8.6];
      tiers.forEach((y, k) => {
        const r = 4 - k * 1.2, below = k ? tiers[k - 1] : 1.4;
        part(fg, CYL, toon('#fff3dc'), [0, y - 1.3, 0], [0.5, 2.6, 0.5], null, 0);
        part(fg, new THREE.CylinderGeometry(r, r * 0.55, 0.8, 24), k % 2 ? pinkM : toon('#f6e7cc'), [0, y, 0], null, null, 0.03);
        part(fg, new THREE.CylinderGeometry(r, r * 1.06, y + 0.4 - below, 24, 1, true), fall, [0, (y + 0.4 + below) / 2, 0], null, null, 0);
      });
      part(fg, SPH_LO, toon('#6a3a24'), [0, 9.4, 0], [0.8, 0.8, 0.8], null, 0);
      // まわりのいちごとマシュマロの串
      for (let k = 0; k < 10; k++) {
        const a = k / 10 * Math.PI * 2, x = Math.cos(a) * 7.6, z = Math.sin(a) * 7.6;
        part(fg, CYL, toon('#e8d8b8'), [x, 1.2, z], [0.06, 2.4, 0.06], null, 0);
        part(fg, SPH_LO, k % 2 ? berry : toon('#fffaf4'), [x, 2.3, z], [0.45, k % 2 ? 0.55 : 0.4, 0.45], null, 0.03);
      }
      updates.push(t => { fallTex.offset.y = (reduced.matches ? 0 : t) * 0.35; });
      signAt(fg, 'チョコレートの噴水', 13, 11);
      occupied.push({ x: fq.x, z: fq.z, r: 9 });
    }
    // お菓子の汽車：広場のまわりを、ウエハースの枕木の線路でぐるりと回る
    {
      const TX = 70, TZ = 63, tpts = [];
      for (let k = 0; k < 140; k++) { const a = k / 140 * Math.PI * 2; tpts.push(H(Math.cos(a) * TX, Math.sin(a) * TZ)); }
      if (tpts.every(p => inLoop(p.x, p.z) && roadDist(p.x, p.z, 60) > W / 2 + 14 && p.distanceTo(boardPos) > 24)) {
        const sleeper = ctex(64, 128, c2 => { c2.fillStyle = '#9fd9a8'; c2.fillRect(0, 0, 64, 128); for (let y = 4; y < 128; y += 16) { c2.fillStyle = '#e8c08a'; c2.fillRect(4, y, 56, 8); c2.fillStyle = '#c99a62'; c2.fillRect(4, y + 3, 56, 1.5); } c2.fillStyle = '#ff7fab'; c2.fillRect(16, 0, 5, 128); c2.fillRect(43, 0, 5, 128); }, true);
        ribbon(tpts.concat([tpts[0]]), 3.4, 0.1, toon('#ffffff', { map: sleeper, side: THREE.DoubleSide }), 3.4, W / 2 + 4);
        tpts.forEach(p => occupied.push({ x: p.x, z: p.z, r: 3.2 }));
        const r = route(tpts, true), cars = [], wheels = [];
        const wheelAt = (cg, x, z, rad) => { const wg = new THREE.Group(); wg.position.set(x, rad, z); cg.add(wg); part(wg, DISC, toon('#5a3222'), [0, 0, 0], [rad, rad, 0.8], null, 0.03); part(wg, BOX, icing, [0, 0, z > 0 ? 0.13 : -0.13], [rad * 1.6, 0.18, 0.05], null, 0); wheels.push({ wg, rad }); };
        // 機関車：ジンジャーブレッドのボイラーに、キャンディケインの煙突
        const loco = fantasyGroup(); loco.userData.droneIgnore = true;
        part(loco, new THREE.CylinderGeometry(1.1, 1.1, 4.4, 16), ginger, [0.6, 1.9, 0], null, [0, 0, Math.PI / 2], 0.03);
        for (const x of [-0.6, 0.8, 2.2]) part(loco, new THREE.TorusGeometry(1.12, 0.1, 6, 18), icing, [x, 1.9, 0], null, [0, Math.PI / 2, 0], 0);
        addBox(loco, [2, 2.8, 2.4], [-2.4, 2.4, 0], pinkM, null, 0.03); iceRoof(loco, choco, [-2.4, 3.8, 0], [2.6, 0.9, 2.8], Math.PI / 2);
        addBox(loco, [1, 0.9, 0.1], [-2.4, 2.9, -1.22], toon('#bfe8ff')); addBox(loco, [1, 0.9, 0.1], [-2.4, 2.9, 1.22], toon('#bfe8ff'));
        part(loco, CYL, caneM, [2, 3.6, 0], [0.4, 1.8, 0.4], null, 0.03); part(loco, SPH_LO, toon('#ffd34a'), [2.9, 1.9, 0], [0.3, 0.3, 0.3], null, 0);
        addBox(loco, [6.6, 0.5, 2.2], [-0.2, 0.75, 0], toon('#5a3222'));
        for (const x of [-2.4, -0.6, 1.4]) for (const z of [-1.15, 1.15]) wheelAt(loco, x, z, 0.55);
        figure(loco, -2.4, 0.9, 0, '#3f6fbf', 0.8, '#3f6fbf');
        cars.push({ g: loco, off: 0 });
        // 貨車：キャンディ、カタジンカ、ケーキ、わたあめを積む
        const loads = [
          g2 => { for (let k = 0; k < 14; k++) part(g2, SPH_LO, toon(pick(candyCols)), [rand(-1.4, 1.4), 1.9 + rand(0, 0.6), rand(-0.7, 0.7)], [0.4, 0.4, 0.4], null, 0); },
          g2 => { for (let k = 0; k < 3; k++) katarzynka(g2, 0.5, ginger, icing, [-1.1 + k * 1.1, 2.4, 0], Math.PI / 2); },
          g2 => { part(g2, new THREE.CylinderGeometry(1.1, 1.1, 1, 20), sponge, [0, 2.1, 0], null, null, 0.03); part(g2, new THREE.CylinderGeometry(1.15, 1.15, 0.3, 20), cream, [0, 2.7, 0], null, null, 0); part(g2, SPH_LO, berry, [0, 3.1, 0], [0.35, 0.4, 0.35], null, 0); },
          g2 => { for (let k = 0; k < 3; k++) part(g2, SPH_LO, toon(['#ff9cc6', '#8fe0cf', '#bba4ff'][k]), [-1.1 + k * 1.1, 2.4, 0], [0.8, 0.8, 0.8], null, 0); }
        ];
        loads.forEach((load, i) => {
          const cg = fantasyGroup(); cg.userData.droneIgnore = true;
          addBox(cg, [3.8, 1.2, 2], [0, 1.4, 0], toon(['#9fe6d8', '#ffe58a', '#c9b2ff', '#ffb38a'][i]), null, 0.03); addBox(cg, [3.9, 0.2, 2.1], [0, 2.05, 0], icing);
          addBox(cg, [3.8, 0.4, 1.8], [0, 0.65, 0], toon('#5a3222'));
          for (const x of [-1.2, 1.2]) for (const z of [-1.05, 1.05]) wheelAt(cg, x, z, 0.45);
          load(cg); cars.push({ g: cg, off: 6.6 + i * 4.4 });
        });
        const steam = ['#ffd6e8', '#fffaf4', '#d6f4ff'].map(C), stack = new V3();
        updates.push((t, dt) => {
          const m = reduced.matches ? 0 : t, head = m * 6;
          for (const c2 of cars) { const { p, yaw } = r.at(head - c2.off); c2.g.position.set(p.x, p.y + 0.12, p.z); c2.g.rotation.y = yaw; }
          for (const w of wheels) w.wg.rotation.z = -m * 6 / w.rad;
          // 煙突からパステルの湯気
          if (!reduced.matches && Math.random() < dt * (lightQuality() ? 4 : 10)) { loco.localToWorld(stack.set(2, 4.6, 0)); dustP.emit(stack.x, stack.y, stack.z, rand(-0.3, 0.3), rand(1.5, 2.4), rand(-0.3, 0.3), rand(2, 3), rand(0.8, 1.4), pick(steam), -0.05, 0.4); }
        });
        registerLandmark(fantasyGroup(tpts[0].clone()), 'お菓子の汽車');
      }
    }
    // ジンジャーブレッドの家の村：汽車の線路の外に、アイシングで飾った小さな家が点々と
    {
      const vb = [], vr = [], vri = [], doors = [], wins = [], gums = [];
      for (let k = 0, n = 0; k < 900 && n < 30; k++) {
        const a = rand(0, Math.PI * 2), rr = rand(82, 130), p = H(Math.cos(a) * rr, Math.sin(a) * rr * 0.92);
        if (!inLoop(p.x, p.z) || !clearAt(p.x, p.z, W / 2 + 18, 6) || p.distanceTo(boardPos) < 28) continue;
        const yaw = rand(0, Math.PI * 2), w = rand(5, 7), d = rand(5, 6.5), h = rand(3.5, 4.8), rh = rand(2.6, 3.6);
        const L = (x, y, z) => { const [ox, oz] = rot(x, z, yaw); return new V3(p.x + ox, p.y + y, p.z + oz); };
        vb.push({ p: L(0, h / 2, 0), s: new V3(w, h, d), r: [0, yaw, 0] });
        vr.push({ p: L(0, h, 0), s: new V3(w + 0.8, rh, d + 1), r: [0, yaw, 0], c: C(pick(['#5a3222', '#ff9cc2', '#7d4b2e', '#9fe6d8', '#c9b2ff'])) });
        vri.push({ p: L(0, h + rh * 0.45 + 0.15, 0), s: new V3(w + 1.1, rh * 0.55, (d + 1) * 0.55), r: [0, yaw, 0] });
        doors.push({ p: L(0, 1.1, -d / 2 - 0.05), s: new V3(1.3, 2.2, 0.15), r: [0, yaw, 0] });
        for (const x of [-w / 4 - 0.4, w / 4 + 0.4]) wins.push({ p: L(x, h * 0.58, -d / 2 - 0.05), s: new V3(1, 1, 0.12), r: [0, yaw, 0] });
        for (let j = 0; j < 3; j++) gums.push({ p: L(-w / 3 + j * w / 3, h + rh + 0.2, 0), s: new V3(0.35, 0.35, 0.35), c: C(pick(candyCols)) });
        lolly(L(-w / 2 - 0.9, 0, -d / 2 - 0.8), 2, 0.6); lolly(L(w / 2 + 0.9, 0, -d / 2 - 0.8), 2, 0.6);
        if (Math.random() < 0.5) addPerson(onGround(L(rand(-2, 2), 0, -d / 2 - rand(2, 4))));
        occupied.push({ x: p.x, z: p.z, r: Math.max(w, d) / 2 + 2.5 }); n++;
      }
      addInst(BOX, gingerBrick, vb); addInst(PRISM, toon('#ffffff'), vr); addInst(PRISM, icing, vri, false);
      addInst(BOX, toon('#6a4228'), doors, false); addInst(BOX, warm, wins, false); addInst(SPH_LO, toon('#ffffff'), gums, false);
      if (vb.length) registerLandmark(fantasyGroup(vb[0].p.clone()), 'ジンジャーブレッドの家の村');
    }
  }
  let carousel = null;
  {
    // 回転木馬：ストライプの屋根に、上下する木馬（この国の競走馬の練習台）
    let c = carouselAt;
    for (let k = 0; k < 400 && !c; k++) {
      const i = (Math.random() * track.N) | 0, p = new V3(track.xs[i], 0, track.zs[i]).lerp(new V3(0, 0, 0), rand(0.25, 0.8));
      if (inLoop(p.x, p.z) && clearAt(p.x, p.z, W / 2 + 16, 11) && p.distanceTo(boardPos) > 30) c = onGround(p);
    }
    if (c) {
      const g = registerLandmark(fantasyGroup(c), '回転木馬');
      part(g, CYL, toon('#fff3dc'), [0, 0.4, 0], [8, 0.8, 8], null, 0.02); part(g, CYL, toon('#ffd34a'), [0, 4, 0], [0.8, 8, 0.8], null, 0);
      const roofTex = ctex(256, 64, c2 => { for (let x = 0; x < 256; x += 32) { c2.fillStyle = (x / 32) % 2 ? '#ff7fab' : '#fffaf4'; c2.fillRect(x, 0, 32, 64); } }, true);
      part(g, new THREE.ConeGeometry(9, 4, 16, 1), toon('#ffffff', { map: roofTex }), [0, 9.6, 0], null, null, 0.02); part(g, SPH_LO, berry, [0, 11.9, 0], [0.7, 0.7, 0.7], null, 0);
      const spin = new THREE.Group(); spin.position.y = 0.8; g.add(spin); const horses = [];
      for (let k = 0; k < 8; k++) {
        const a = k / 8 * Math.PI * 2, hg = new THREE.Group(); hg.position.set(Math.cos(a) * 6, 0, Math.sin(a) * 6); hg.rotation.y = -a; spin.add(hg);
        part(hg, CYL, toon('#ffd34a'), [0, 4, 0], [0.1, 8, 0.1], null, 0);
        const body = new THREE.Group(); hg.add(body); const col = toon(['#ffffff', '#ffc6dc', '#bdeee2', '#fff0b3'][k % 4]);
        part(body, SPH_LO, col, [0, 2.4, 0], [0.4, 0.45, 1.1], null, 0.03); part(body, SPH_LO, col, [0, 3.1, 0.95], [0.25, 0.45, 0.25], [0.5, 0, 0], 0.03); part(body, SPH_LO, col, [0, 3.45, 1.25], [0.22, 0.22, 0.4], null, 0.03);
        for (const [x, z] of [[-0.25, 0.6], [0.25, 0.6], [-0.25, -0.6], [0.25, -0.6]]) addBox(body, [0.12, 0.9, 0.12], [x, 1.8, z], col, [z > 0 ? -0.5 : 0.5, 0, 0]);
        addBox(body, [0.5, 0.2, 0.6], [0, 2.85, 0], toon(candyCols[k % candyCols.length]));
        horses.push({ body, ph: k * 0.8 });
      }
      for (let k = 0; k < 16; k++) { const a = k / 16 * Math.PI * 2; part(g, SPH_LO, glowMat('#fff2c0', 2), [Math.cos(a) * 8.6, 7.6, Math.sin(a) * 8.6], [0.25, 0.25, 0.25], null, 0); }
      carousel = { spin, horses };
      occupied.push({ x: c.x, z: c.z, r: 11 });
      signAt(g, '回転木馬', 15, 7);
      updates.push((t, dt) => {
        if (reduced.matches) return;
        spin.rotation.y += dt * (celebration > 0 ? 1.1 : 0.45);
        for (const h of horses) h.body.position.y = Math.sin(t * 2.4 + h.ph) * 0.45;
      });
    }
  }
  {
    // ジンジャーブレッドの市：ホーム直線の内側に一列。屋根にアイシングの縁、売り台にお菓子
    const stallNames = ['カタジンカ', 'はちみつのピェルニク', 'チョコがけピェルニク', 'わたあめ', '棒つきキャンディ', 'ホットチョコレート', '木の焼き型', 'アイシングクッキー'];
    const posts = [], roofsS = [], roofIce = [], counters = [], goods = [];
    let si = 0;
    for (let s = track.homeS0 + 22; s < track.homeS1 - 8 && si < stallNames.length; s += 11) {
      const v = -(W / 2 + 15), c2 = onGround(local(s, 0, v)), yaw = yawAt(s);
      if (!clearAt(c2.x, c2.z, W / 2 + 10, 3) || c2.distanceTo(boardPos) < 24) continue;
      const L = (x, y, z) => { const [ox, oz] = rot(x, z, yaw); return new V3(c2.x + ox, c2.y + y, c2.z + oz); };
      for (const [x, z] of [[-2.8, -1.8], [2.8, -1.8], [-2.8, 1.8], [2.8, 1.8]]) posts.push({ p: L(x, 1.5, z), s: new V3(0.12, 3, 0.12), c: C('#ffffff') });
      roofsS.push({ p: L(0, 3.2, 0), s: new V3(6.6, 1.3, 4.8), r: [0, yaw, 0], c: C(pick(['#ff9cc2', '#9fe6d8', '#ffe58a', '#c9b2ff', '#ffb38a'])) });
      roofIce.push({ p: L(0, 3.2 + 1.3 * 0.45 + 0.1, 0), s: new V3(6.9, 1.3 * 0.55, 4.8 * 0.55), r: [0, yaw, 0] });
      counters.push({ p: L(0, 0.55, -1.4), s: new V3(5.4, 1.1, 1.2), r: [0, yaw, 0], c: C(pick(['#8a6244', '#a07a52', '#c98a55'])) });
      for (let k = 0; k < 8; k++) goods.push({ p: L(rand(-2.3, 2.3), 1.25, rand(-1.8, -1)), s: new V3(0.36, 0.14, 0.36), c: C(pick(['#c07a3c', '#8a5228', '#ff7fab', '#7fe0d0', '#ffe27a', '#fffaf4'])) });
      putBoard(stallNames[si], L(0, 4.3, 2.3), yaw, 4.4); putBoard(stallNames[si++], L(0, 4.3, -2.3), yaw + Math.PI, 4.4);
      for (let k = 0; k < 3; k++) addPerson(onGround(L(rand(-2.6, 2.6), 0, rand(-3, -5.5))));
      occupied.push({ x: c2.x, z: c2.z, r: 4.4 });
    }
    addInst(CYL, toon('#ffffff', { map: caneTex }), posts, false); addInst(PRISM, toon('#ffffff'), roofsS); addInst(PRISM, icing, roofIce, false);
    addInst(BOX, toon('#ffffff'), counters); addInst(CYL, toon('#ffffff'), shuffle(goods), false);
    registerLandmark(fantasyGroup(onGround(local(track.homeS0 + 60, 0, -(W / 2 + 15)))), 'ジンジャーブレッドの市');
  }

  /* ---- キャンディの森：沿道と内馬場に棒つきキャンディの木、わたあめの木、キャンディケイン、ガムドロップの茂み ---- */
  {
    const flossTrees = [], drops = [];
    // わたあめの木：白い幹に、ふわふわのパステルの綿
    const flossTree = (p, h, col = C(pick(['#ff9cc6', '#8fe0cf', '#bba4ff', '#ffe27a', '#ffb0d4']))) => {
      const t = { stick: { p: p.clone().add(new V3(0, h / 2, 0)), s: new V3(0.25 * h / 4.5, h, 0.25 * h / 4.5) }, balls: [] };
      for (let j = 0; j < 3; j++) t.balls.push({ p: p.clone().add(new V3(rand(-1, 1) * h / 4.5, h + rand(0.6, 2.2) * h / 4.5, rand(-1, 1) * h / 4.5)), s: new V3(1, 1, 1).multiplyScalar(rand(1.6, 2.6) * h / 4.5), c: col });
      flossTrees.push(t);
    };
    // ガムドロップの茂み：砂糖をまぶした半球
    const gumdrop = (p, sc) => drops.push({ body: { p: p.clone(), s: new V3(sc, sc * 1.1, sc), c: C(pick(candyCols)) }, sugar: { p: p.clone().add(new V3(0, sc * 1.05, 0)), s: new V3(sc * 0.3, sc * 0.12, sc * 0.3) } });
    // シュガーダッシュの坂の外：大きなキャンディが密に並ぶ森
    const forest0 = at(5, 0.85), forest1 = at(7, 0.12);
    for (let k = 0, n = 0; k < 4000 && n < 300; k++) {
      const s = rand(forest0, forest1), v = W / 2 + 9 + 130 * Math.random() ** 1.4, p = local(s, 0, v);
      if (!clearAt(p.x, p.z, W / 2 + 8, 2.6) || inLoop(p.x, p.z)) continue;
      onGround(p);
      const r = Math.random(), grow = 1 + (v - W / 2) / 120;
      if (r < 0.38) lolly(p, rand(4, 7) * grow, rand(1.6, 2.6) * grow);
      else if (r < 0.6) cane(p, rand(5, 9) * grow, rand(1, 1.5) * grow, rand(0, Math.PI * 2));
      else if (r < 0.85) flossTree(p, rand(5, 8) * grow);
      else gumdrop(p, rand(1.4, 2.4));
      occupied.push({ x: p.x, z: p.z, r: 2.6 }); n++;
    }
    for (let k = 0, n = 0; k < 6000 && n < 650; k++) {
      const s = rand(0, track.L), v = W / 2 + 10 + 190 * Math.random() ** 1.7, p = local(s, 0, v);
      if (!clearAt(p.x, p.z, W / 2 + 9, 2.2) || inLoop(p.x, p.z)) continue;
      onGround(p);
      const r = Math.random();
      if (r < 0.12) lolly(p, rand(3, 6), rand(1.2, 2.2));
      else if (r < 0.2) cane(p, rand(4, 7), rand(0.7, 1.1), rand(0, Math.PI * 2));
      else if (r < 0.78) flossTree(p, rand(3, 6) * (1 + (v - W / 2) / 260));
      else gumdrop(p, rand(0.9, 1.8));
      occupied.push({ x: p.x, z: p.z, r: 1.8 }); n++;
    }
    for (let k = 0, n = 0; k < 4000 && n < 160; k++) {
      const i = (Math.random() * track.N) | 0, p = new V3(track.xs[i], 0, track.zs[i]).lerp(new V3(0, 0, 0), rand(0.05, 1));
      if (!inLoop(p.x, p.z) || !clearAt(p.x, p.z, W / 2 + 9, 2.6)) continue;
      onGround(p);
      const r = Math.random();
      if (r < 0.6) flossTree(p, rand(3, 5.5)); else if (r < 0.8) lolly(p, rand(3, 5), rand(1.1, 1.8)); else gumdrop(p, rand(0.9, 1.6));
      occupied.push({ x: p.x, z: p.z, r: 2 }); n++;
    }
    shuffle(flossTrees); shuffle(drops);
    addInst(CYL, toon('#fffaf4'), flossTrees.map(t => t.stick)); addInst(SPH_LO, toon('#ffffff'), flossTrees.flatMap(t => t.balls));
    addInst(HALF, toon('#ffffff', { emissive: C('#ffffff'), emissiveIntensity: 0.08 }), drops.map(d => d.body)); addInst(SPH_LO, toon('#ffffff'), drops.map(d => d.sugar), false);
  }
  // まとめて描く：棒つきキャンディ、キャンディケイン
  lollies.forEach((L, k) => {
    const order = shuffle(L.heads.map((_, i) => i));
    addInst(CYL, toon('#fffaf4'), order.map(i => L.sticks[i]), false);
    addInst(DISC, [toon(lollyMats[k][1]), lollyMats[k][0], lollyMats[k][0]], order.map(i => L.heads[i]));
  });
  {
    const o1 = shuffle(canes.map((_, i) => i)), o2 = shuffle(canesMint.map((_, i) => i));
    addInst(CYL, caneM, o1.map(i => canes[i])); addInst(HOOK, toon('#e8384f'), o1.map(i => caneHooks[i]));
    addInst(CYL, caneMint, o2.map(i => canesMint[i])); addInst(HOOK, toon('#3fbfa8'), o2.map(i => caneHooksMint[i]));
  }

  /* ---- 空：わたあめの雲と、ジンジャーブレッド色の熱気球 ---- */
  {
    const clouds = [];
    for (let i = 0; i < 9; i++) {
      const g = fantasyGroup(); g.userData.droneIgnore = true; const col = toon(pick(['#ffd6e8', '#d6f4ff', '#fff3d6', '#e8dcff']), { emissive: C('#ffffff'), emissiveIntensity: 0.25 });
      for (let k = 0; k < 6; k++) part(g, SPH_LO, col, [rand(-14, 14), rand(-2, 4), rand(-6, 6)], [rand(6, 10), rand(4, 7), rand(6, 9)], null, 0);
      const a = rand(0, Math.PI * 2), r = rand(120, track.extent + 260);
      clouds.push({ g, x: Math.cos(a) * r, z: Math.sin(a) * r, y: rand(70, 120), v: rand(1.2, 2.6) });
    }
    const balloons = [];
    [['#c07a3c', '#fff6fa'], ['#ff7fab', '#fffaf4'], ['#7fe0d0', '#ffe27a']].forEach(([a, b], i) => {
      const g = fantasyGroup(); g.userData.droneIgnore = true;
      const tex = ctex(256, 128, c => { for (let x = 0; x < 256; x += 32) { c.fillStyle = (x / 32) % 2 ? a : b; c.fillRect(x, 0, 32, 128); } c.fillStyle = b; for (let x = 16; x < 256; x += 32) { c.beginPath(); c.arc(x, 64, 5, 0, Math.PI * 2); c.fill(); } });
      part(g, new THREE.SphereGeometry(1, 16, 12), toon('#ffffff', { map: tex }), [0, 0, 0], [8, 10, 8], null, 0);
      part(g, new THREE.ConeGeometry(1, 1, 16), toon(a), [0, -9.5, 0], [5, 5, 5], [Math.PI, 0, 0], 0);
      addBox(g, [2, 1.6, 2], [0, -13.5, 0], toon('#8a6244'));
      const ang = i * 2.1, r = track.extent + 60 + i * 50;
      balloons.push({ g, x: Math.cos(ang) * r, z: Math.sin(ang) * r, y: 70 + i * 18, ph: i * 2 });
    });
    updates.push(t => {
      const m = reduced.matches ? 0 : t, lim = track.extent + 320;
      for (const c of clouds) { c.g.position.set(mod(c.x + m * c.v + lim, lim * 2) - lim, c.y + Math.sin(m * 0.2 + c.v) * 2, c.z); }
      for (const b of balloons) b.g.position.set(b.x + Math.sin(m * 0.05 + b.ph) * 30, b.y + Math.sin(m * 0.3 + b.ph) * 4, b.z + Math.cos(m * 0.04 + b.ph) * 30);
    });
  }

  // まとめて描く：人々、帽子、家並み、文字の板
  {
    const order = shuffle(people.map((_, i) => i));
    addInst(new THREE.CapsuleGeometry(0.3, 0.75, 3, 8), toon('#ffffff'), order.map(i => people[i]), false); addInst(SPH_LO, toon('#f1c9a8'), order.map(i => heads[i]), false); addInst(SPH_LO, toon('#ffffff'), order.map(i => hats[i]), false);
    const ho = shuffle(houses.map((_, i) => i));
    addInst(BOX, [facadeM, facadeM, plainM, plainM, facadeM, facadeM], ho.map(i => houses[i])); addInst(PRISM, toon('#ffffff'), ho.map(i => roofs[i])); addInst(PRISM, icing, ho.map(i => roofIcing[i]), false);
    addInst(SPH_LO, toon('#ffffff'), ridges, false);
    for (const [key, list] of boardLists) addInst(new THREE.PlaneGeometry(1, 1), boardMats.get(key), list, false);
  }

  /* ---- 煙（工房の焼き窯）、噴水のカエルの水、ろうそくの火、粉砂糖のきらめき ---- */
  const smokeC = C('#fff4ea'), waterC = C('#cfefff').multiplyScalar(1.3), sugarC = C('#ffffff').multiplyScalar(1.4);
  {
    let acc = 0, acc2 = 0, acc3 = 0;
    updates.push((t, dt) => {
      if (reduced.matches) return;
      const lq = lightQuality();
      acc += dt * smokes.length * (lq ? 1.5 : 4);
      while (acc >= 1 && smokes.length) { acc--; const p = pick(smokes); dustP.emit(p.x + rand(-0.3, 0.3), p.y, p.z + rand(-0.3, 0.3), rand(-0.3, 0.3) + 0.4, rand(1.2, 2), rand(-0.3, 0.3), rand(3, 5), rand(1.4, 2.6), smokeC, -0.05, 0.3); }
      acc2 += dt * fountain.jets.length * (lq ? 3 : 8);
      while (acc2 >= 1 && fountain.jets.length) { acc2--; const j = pick(fountain.jets); sparkP.emit(j.p.x, j.p.y, j.p.z, j.d.x * 2.4, rand(2, 2.8), j.d.z * 2.4, rand(0.6, 0.8), rand(0.18, 0.3), waterC, 9, 0); }
      acc3 += dt * (lq ? 5 : 14);
      while (acc3 >= 1) { acc3--; const c = camera.position; sparkP.emit(c.x + rand(-25, 25), c.y + rand(-6, 12), c.z + rand(-25, 25), rand(-0.3, 0.3), rand(-0.4, -0.1), rand(-0.3, 0.3), rand(1.5, 3), rand(0.07, 0.14), sugarC, 0, 0); }
    });
  }

  /* ---- ゴール：紙吹雪とスプリンクルの花火、聖ヨハネ大聖堂の鐘トゥバ・デイが鳴り、巨大カタジンカとケーキのろうそくが輝く ---- */
  // 紙吹雪は使い回し、ロビーに戻るとすぐ消す
  const confetti = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.5, 0.8), toon('#ffffff', { side: THREE.DoubleSide }), 100), m4 = new THREE.Matrix4(), q4 = new THREE.Quaternion(), e4 = new THREE.Euler();
  world.add(confetti); confetti.visible = false; confetti.frustumCulled = false; confetti.userData.droneIgnore = true;
  const bits = Array.from({ length: 100 }, (_, i) => { confetti.setColorAt(i, C(['#ff7fab', '#ffe182', '#7ae1d3', '#af99ff'][i % 4])); return { x: rand(-14, 14), y: rand(12, 24), z: rand(-12, 12), v: rand(-5, 5), phase: rand(0, 6) }; });
  const finish = tp(track.finishS, W / 2).v; let age = -1;
  themeFinish = () => { age = 0; celebration = 9; }; themeReset = () => { age = -1; confetti.visible = false; celebration = 0; };
  let burst = 0;
  const fw = candyCols.map(c => C(c).multiplyScalar(1.6));
  updates.push((t, dt) => {
    const glow = celebration > 0 ? Math.min(1, celebration / 2) : 0, m = reduced.matches ? 0 : t;
    if (giant) { giant.gm.emissiveIntensity = glow * (0.6 + 0.25 * Math.sin(m * 5)); giant.em.emissiveIntensity = glow * 0.9; }
    if (cake.flames) { const k = 1 + glow * 0.8 + Math.sin(m * 9) * 0.06; cake.flames.scale.set(1, k, 1); }
    if (bell) bell.rotation.x = glow * Math.sin(m * 3.2) * 0.7;
    if (age >= 0) {
      age += dt; confetti.visible = age < 5;
      if (!confetti.visible) age = -1;
      else {
        confetti.count = lightQuality() ? 40 : 100;
        bits.forEach((b, i) => { m4.compose(new V3(finish.x + b.x + Math.sin(age + b.phase) * 2, finish.y + b.y - age * 4, finish.z + b.z + b.v * age), q4.setFromEuler(e4.set(age * 2, b.phase, age + b.phase)), new V3(1, 1, 1)); confetti.setMatrixAt(i, m4); }); confetti.instanceMatrix.needsUpdate = true;
      }
    }
    if (celebration <= 0) return;
    celebration = Math.max(0, celebration - dt);
    if (reduced.matches) return;
    burst += dt * (lightQuality() ? 2 : 4);
    for (; burst >= 1; burst--) {
      // スプリンクルの花火：色とりどりの粒が開いて、ゆっくり落ちる
      const s = track.finishS + rand(-120, 60), f = tp(s, W + rand(30, 90)), y = rand(40, 70), col = pick(fw);
      for (let i = 0; i < 46; i++) { const a = rand(0, Math.PI * 2), b = Math.acos(rand(-1, 1)), sp = rand(9, 13); sparkP.emit(f.v.x, y, f.v.z, Math.sin(b) * Math.cos(a) * sp, Math.cos(b) * sp, Math.sin(b) * Math.sin(a) * sp, rand(1.3, 1.9), rand(0.5, 0.9), col, 3, 1.2); }
    }
    if (cake.flamePts && Math.random() < 0.6) { const p = pick(cake.flamePts); sparkP.emit(p.x, p.y + 0.8, p.z, rand(-0.5, 0.5), rand(2, 4), rand(-0.5, 0.5), rand(0.6, 1), rand(0.3, 0.5), C('#ffcf5a').multiplyScalar(2), -0.5, 0.5); }
    if (giant && Math.random() < 0.5) { const c = giant.c; sparkP.emit(c.x + rand(-5, 5), c.y + rand(3, 10), c.z + rand(-5, 5), rand(-1, 1), rand(1, 3), rand(-1, 1), rand(1, 1.8), rand(0.8, 1.4), pick(fw), 0.5, 0.5); }
  });

  // 広い範囲に散らばるインスタンスは、原点の境界球で切り捨てられないようにする
  for (const o of world.children.slice(n0)) o.traverse(x => { if (x.isInstancedMesh) x.frustumCulled = false; });
  themeUpd.push((t, dt) => { for (const f of updates) f(t, dt); });
}
// スタンド：トルンのジンジャーブレッドの家並み。段の前にアイシングの腰壁、屋根の縁に生クリームとさくらんぼ、屋根の上にパステルの破風の家並みと「お菓子の国」の看板
function decorCandyStand(stand, len, z0, roof) {
  const g = new THREE.Group(); stand.add(g); registerLandmark(g, 'candy-stand');
  // 腰壁：ジンジャーブレッドに、白いアイシングの波線と水玉（局所 -z が走路の側）
  const band = ctex(256, 64, c => {
    c.fillStyle = '#b8733a'; c.fillRect(0, 0, 256, 64);
    c.strokeStyle = '#fff6fa'; c.lineWidth = 5; c.beginPath(); for (let x = 0; x <= 256; x += 4) c.lineTo(x, 20 + Math.sin(x / 256 * Math.PI * 8) * 7); c.stroke();
    c.fillStyle = '#ff7fab'; for (let x = 16; x < 256; x += 32) { c.beginPath(); c.arc(x, 46, 5, 0, Math.PI * 2); c.fill(); }
    c.fillStyle = '#fff6fa'; c.fillRect(0, 0, 256, 4); c.fillRect(0, 60, 256, 4);
  }, true);
  band.repeat.set(len / 8, 1);
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(len, 1.6), toon('#ffffff', { map: band, side: THREE.DoubleSide })); wall.position.set(0, 0.85, z0 - 0.05); g.add(wall);
  // 屋根の前の縁：生クリームの絞りと、さくらんぼ
  const dol = [], cher = [];
  for (let x = -len / 2; x <= len / 2; x += 2.2) { dol.push({ p: new V3(x, 13.2, z0 - 2.4), s: new V3(1.1, 0.9, 1.1) }); if (Math.round(x / 2.2) % 3 === 0) cher.push({ p: new V3(x, 14.1, z0 - 2.4), s: new V3(0.5, 0.5, 0.5) }); }
  g.add(inst(SPH_LO, toon('#fff3dc'), dol, false), inst(SPH_LO, toon('#e8384f'), cher, false));
  // 屋根の上：パステルの家並みの破風（トルンの旧市街の切妻の並び）
  const facades = [], gables = [], trims = [], wins = [];
  for (let x = -len / 2 + 4, i = 0; x <= len / 2 - 4; x += 7.4, i++) {
    const h = rand(4, 7), col = C(['#ffc6dc', '#bdeee2', '#fff0b3', '#d8ccff', '#ffd6b8', '#c8e6ff'][i % 6]);
    facades.push({ p: new V3(x, 13 + h / 2, z0 + 14), s: new V3(6.8, h, 6), c: col });
    gables.push({ p: new V3(x, 13 + h, z0 + 14), s: new V3(6.2, rand(3, 5), 7.4), r: [0, Math.PI / 2, 0], c: col });
    trims.push({ p: new V3(x, 13 + h + 0.05, z0 + 10.9), s: new V3(7, 0.3, 0.3) });
    for (const xx of [-1.6, 1.6]) wins.push({ p: new V3(x + xx, 13 + h * 0.55, z0 + 10.95), s: new V3(1.1, 1.6, 0.1) });
  }
  const PRISM = new THREE.ExtrudeGeometry(new THREE.Shape([new THREE.Vector2(-0.5, 0), new THREE.Vector2(0.5, 0), new THREE.Vector2(0, 1)]), { depth: 1, bevelEnabled: false });
  PRISM.translate(0, 0, -0.5); PRISM.rotateY(Math.PI / 2);
  g.add(inst(BOX, toon('#ffffff'), facades), inst(PRISM, toon('#ffffff'), gables), inst(BOX, toon('#fffaf4'), trims, false), inst(BOX, toon('#5a3424'), wins, false));
  // 屋上の看板：ジンジャーブレッドの板に、アイシングで「お菓子の国」
  const sign = ctex(512, 200, c => {
    c.fillStyle = '#b8733a'; c.beginPath(); c.roundRect ? c.roundRect(6, 6, 500, 188, 40) : c.rect(6, 6, 500, 188); c.fill();
    c.strokeStyle = '#fff6fa'; c.lineWidth = 8; c.setLineDash([16, 10]); c.beginPath(); c.roundRect ? c.roundRect(22, 22, 468, 156, 30) : c.rect(22, 22, 468, 156); c.stroke(); c.setLineDash([]);
    c.fillStyle = '#fff6fa'; c.shadowColor = '#ff7fab'; c.shadowBlur = 12; c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = '900 84px "Dela Gothic One", sans-serif'; c.fillText('お菓子の国', 256, 104, 440);
  });
  const w = Math.min(30, len * 0.3), h = w * 200 / 512;
  for (const sx of [-w * 0.3, w * 0.3]) addBox(g, [0.6, 3.4, 0.6], [sx, 15.4, z0 + 6], toon('#8a5228'));
  const bm = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: sign, transparent: true, color: C('#ffffff').multiplyScalar(1.15) })); bm.position.set(0, 17 + h / 2, z0 + 5.98); bm.rotation.y = Math.PI; g.add(bm);
  const back = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: sign, transparent: true })); back.position.set(0, 17 + h / 2, z0 + 6.02); g.add(back);
  // 両端のキャンディケインの柱と、スタンドの前の大きな棒つきキャンディ
  const caneTex = ctex(64, 64, c => { c.fillStyle = '#ffffff'; c.fillRect(0, 0, 64, 64); c.fillStyle = '#e8384f'; for (let k = -64; k < 128; k += 32) { c.beginPath(); c.moveTo(k, 0); c.lineTo(k + 16, 0); c.lineTo(k - 48, 64); c.lineTo(k - 64, 64); c.closePath(); c.fill(); } }, true);
  caneTex.repeat.set(1, 6);
  for (const x of [-len / 2 - 1.8, len / 2 + 1.8]) {
    part(g, new THREE.CylinderGeometry(1, 1, 1, 12), toon('#ffffff', { map: caneTex }), [x, 8, z0 + 1], [0.9, 16, 0.9], null, 0.03);
    part(g, new THREE.TorusGeometry(1.6, 0.9, 10, 20, Math.PI), toon('#e8384f'), [x + Math.sign(x) * 1.6, 16, z0 + 1], null, null, 0.03);
  }
}
