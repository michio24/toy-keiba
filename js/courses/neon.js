// ネオンシティ・ナイター
'use strict';

/* ---- ネオンシティ・ナイター：香港のネオン街と、摩天楼に囲まれたハッピーバレー（跑馬地）のナイター競馬を下敷きにした夜の街 ---- */
// 見立て：ホーム直線は摩天楼の谷間のハッピーバレー競馬場、外回りは九龍の繁華街、高架の外はビクトリア・ハーバー。
// 区間の役割：0 跑馬地のホーム直線（スタンドの裏を二階建てトラムが走る）／1 1コーナー：竹の足場を組んだ工事中のビル／
// 2〜3 海沿いの高架道路（高さ5m）とビクトリア・ハーバー（スターフェリー・赤い帆のジャンク船、尖沙咀の時計台、
// 対岸の摩天楼と光のショー「シンフォニー・オブ・ライツ」、ヴィクトリア・ピーク）／4 彌敦道（ネイザン・ロード）のネオン回廊／
// 5〜6 廟街の牌楼とナイトマーケットのS字／7 九龍城砦と、屋上すれすれに降りていく旅客機（かつての啓徳空港への着陸）／
// 8 天后廟の渦巻き線香。内馬場はハッピーバレーの運動場、街の外周を二階建てバスとタクシーが行き交う
const NEON_U = { time: { value: 0 } };
// ビルの窓明かり：世界座標の格子で窓を切り、ビルごと（インスタンスの位置）に点灯の割合と色味を変える。地上階は店先の明かり
function neonFacade(mat, lit = 0.5) {
  mat.onBeforeCompile = sh => {
    sh.uniforms.uNfTime = NEON_U.time; sh.uniforms.uNfLit = { value: lit };
    sh.vertexShader = 'varying vec3 vNfPos, vNfN, vNfSeed;\n' + sh.vertexShader.replace('#include <project_vertex>', `#include <project_vertex>
vec4 nfP = vec4(transformed, 1.0); vec3 nfN = objectNormal; vNfSeed = vec3(0.0);
#ifdef USE_INSTANCING
  nfP = instanceMatrix * nfP; nfN = mat3(instanceMatrix) * nfN; vNfSeed = instanceMatrix[3].xyz;
#endif
vNfPos = (modelMatrix * nfP).xyz; vNfN = normalize(mat3(modelMatrix) * nfN); vNfSeed = (modelMatrix * vec4(vNfSeed, 1.0)).xyz;`);
    sh.fragmentShader = 'uniform float uNfTime, uNfLit;\nvarying vec3 vNfPos, vNfN, vNfSeed;\n' +
      'float nfHash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }\n' +
      'vec3 nfWindows() {\n' +
      '  if (abs(vNfN.y) > 0.5) return vec3(0.0);\n' +
      // 壁の横方向の座標：面の向きに沿って測る（斜めに建つビルでも窓の幅がそろう）。ビルごとの乱数は、画素ごとにぶれる補間値を整数に丸めて作る
      '  vec2 t = normalize(vec2(-vNfN.z, vNfN.x)); float u = dot(vNfPos.xz, t), b = nfHash(floor(vNfSeed.xz + 0.5) * 0.0731 + 3.1);\n' +
      '  if (vNfPos.y < 3.4) { float h = nfHash(vec2(floor(u / 5.0), b * 91.0));\n' +
      '    vec3 shop = h < 0.3 ? vec3(1.0, 0.35, 0.8) : h < 0.6 ? vec3(0.3, 0.9, 1.0) : h < 0.85 ? vec3(1.0, 0.78, 0.4) : vec3(0.9, 0.95, 1.0);\n' +
      '    return shop * step(0.5, vNfPos.y) * step(0.12, fract(u / 5.0)) * 0.55; }\n' +
      // 窓の縁は画素の幅でぼかし、遠くで格子が画素より細かくなったら平均の明るさへ溶かす（ちらつき防止）
      '  vec2 cs = vec2(2.3 + b * 1.3, 3.2), q = vec2(u, vNfPos.y) / cs, c = floor(q), f = fract(q), aa = fwidth(q) + 1e-4;\n' +
      '  float w = smoothstep(0.2 - aa.x, 0.2 + aa.x, f.x) * smoothstep(0.8 + aa.x, 0.8 - aa.x, f.x) * smoothstep(0.28 - aa.y, 0.28 + aa.y, f.y) * smoothstep(0.78 + aa.y, 0.78 - aa.y, f.y);\n' +
      '  float r = nfHash(c + b * 57.0), far = clamp(max(aa.x, aa.y) * 2.0 - 0.4, 0.0, 1.0);\n' +
      '  float on = step(r, uNfLit * (0.55 + b * 0.7));\n' +
      // ごくまれに、点いたり消えたりする窓
      '  if (r > 0.985) on = step(0.5, fract(uNfTime * 0.07 + r * 13.0));\n' +
      '  float tone = nfHash(c * 1.7 + b * 13.0);\n' +
      '  vec3 col = tone < 0.45 ? vec3(1.0, 0.82, 0.55) : tone < 0.8 ? vec3(0.72, 0.95, 1.0) : tone < 0.92 ? vec3(1.0, 0.5, 0.85) : vec3(0.5, 1.0, 0.72);\n' +
      '  vec3 sharp = col * w * on * (0.55 + 0.6 * nfHash(c + 7.0));\n' +
      '  return mix(sharp, vec3(0.9, 0.82, 0.72) * uNfLit * (0.55 + b * 0.7) * 0.22, far);\n}\n' +
      sh.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance += nfWindows() * 0.85;');
  };
  mat.customProgramCacheKey = () => 'neonFacade' + lit;
  return mat;
}
// ネオン管の看板：黒地に、光のにじむ管で文字と縁取りを描く（加算合成で黒は透ける）。縦書きは1文字ごとに正方形のます
function neonSignTex(text, col, vertical) {
  const chars = [...text], w = vertical ? 128 : 512, h = vertical ? 128 * chars.length : 160;
  return ctex(w, h, g => {
    g.fillStyle = '#000'; g.fillRect(0, 0, w, h);
    g.lineJoin = 'round'; g.shadowColor = col; g.shadowBlur = 14;
    g.strokeStyle = col; g.lineWidth = 6; g.beginPath(); g.roundRect ? g.roundRect(9, 9, w - 18, h - 18, 18) : g.rect(9, 9, w - 18, h - 18); g.stroke();
    g.textAlign = 'center'; g.textBaseline = 'middle';
    const draw = (s, x, y, size, max) => {
      g.font = `900 ${size}px "Dela Gothic One", sans-serif`;
      g.shadowBlur = 14; g.lineWidth = 7; g.strokeStyle = col; g.strokeText(s, x, y, max);
      g.shadowBlur = 0; g.lineWidth = 2; g.strokeStyle = '#ffffff'; g.strokeText(s, x, y, max);
    };
    if (vertical) chars.forEach((ch, i) => draw(ch, 64, 66 + i * 128, 84, 100));
    else draw(text, 256, 84, Math.min(104, 880 / Math.max(1, chars.length)), 460);
  });
}
function decorNeon() {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const { shuffle, roadDist, occupied, taken, clearAt, onGround, local, at, label, site, CYL, addInst, pathRibbon, beam, route } = sceneryKit();
  const updates = [];
  // 大きく広がるインスタンスは原点の境界球で切り捨てられないようにする
  const wide = m => { if (m) m.frustumCulled = false; return m; };
  // 案内板は夜の紺に、ネオンの桃色の文字
  const signAt = (g, text, y, w = 14) => { const sp = label(text, w, w / 4, '#1a1030', '#ff9be6'); sp.position.set(0, y, 0); sp.scale.set(w, w / 4, 1); g.add(sp); return sp; };
  const NEON = ['#ff3fd0', '#39f3ff', '#ffcf3f', '#8b5cff', '#46f0c6', '#ff5a3c', '#5aff6a'];
  const glowCols = NEON.map(c => C(c).multiplyScalar(2.2));
  const roof4 = new THREE.ConeGeometry(1, 1, 4); roof4.rotateY(Math.PI / 4);
  const glowD = (c, k) => { const m = glowMat(c, k); m.side = THREE.DoubleSide; return m; };
  const dark = toon('#1c1828'), steel = toon('#4a4658'), concrete = toon('#5f5c6c', { side: THREE.DoubleSide }), white = toon('#ffffff');
  const people = [], heads = [], peopleCols = ['#e85a7a', '#3a8ad9', '#f2c040', '#6aa84a', '#c94aa0', '#f2f0ea', '#2a2a36', '#ff8a3a'].map(C);
  const addPerson = p => { people.push({ p: p.clone().add(new V3(0, 0.95, 0)), s: new V3(1, 1, 1), c: peopleCols[(Math.random() * peopleCols.length) | 0] }); heads.push({ p: p.clone().add(new V3(0, 1.95, 0)), s: new V3(0.26, 0.28, 0.26) }); };
  let celebration = 0;

  /* ---- 座標の枠組み：ホーム直線を基準に、u は進行方向、v は外向き（スタンドの側） ---- */
  const fH = tp(track.homeS0, W / 2), O = fH.v.clone().setY(0), U = fH.dir, VN = fH.n, hU = Math.atan2(U.z, U.x);
  const toUV = p => { const dx = p.x - O.x, dz = p.z - O.z; return [dx * U.x + dz * U.z, dx * VN.x + dz * VN.z]; };
  const fromUV = (u, v, y = 0) => new V3(O.x + U.x * u + VN.x * v, y, O.z + U.z * u + VN.z * v);
  let uMin = 1e9, uMax = -1e9, vMin = 1e9;
  for (let i = 0; i <= track.N; i += 4) { const [u, v] = toUV({ x: track.xs[i], z: track.zs[i] }); uMin = Math.min(uMin, u); uMax = Math.max(uMax, u); vMin = Math.min(vMin, v); }
  // 内馬場：走路の中心線を多角形にして内外を判定する
  const poly = []; for (let i = 0; i < track.N; i += 8) poly.push([track.xs[i], track.zs[i]]);
  const inLoop = (x, z) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, zi] = poly[i], [xj, zj] = poly[j]; if ((zi > z) !== (zj > z) && x < (xj - xi) * (z - zi) / (zj - zi) + xi) c = !c; } return c; };
  // 海岸線（第2区間の高架の外）。手前に外周道路と遊歩道、その先がビクトリア・ハーバー
  const HB = uMax + W / 2 + 80, ringU0 = uMin - 95, ringU1 = uMax + 64, ringV0 = vMin - 95, ringV1 = 112;
  const ringPts = [[ringU0, ringV1], [ringU1, ringV1], [ringU1, ringV0], [ringU0, ringV0]];
  const ringDist = (u, v) => { let d = 1e9; for (let i = 0; i < 4; i++) { const [a0, b0] = ringPts[i], [a1, b1] = ringPts[(i + 1) % 4]; d = Math.min(d, Math.hypot(u - clamp(u, Math.min(a0, a1), Math.max(a0, a1)), v - clamp(v, Math.min(b0, b1), Math.max(b0, b1)))); } return d; };
  // スタンドと、その裏のトラムの敷地
  const inHomeLot = (u, v) => u > uMin - 10 && u < track.S + 50 && v > 0 && v < 72;
  // 建物を建てられる陸地：高架より海側（ヤシ並木・外周道路・遊歩道）と道路の上、スタンドの敷地を除く
  const landOK = p => { const [u, v] = toUV(p); return u < uMax + 4 && ringDist(u, v) > 9 && !inHomeLot(u, v); };

  /* ---- 摩天楼：窓明かりの灯るビル本体と、屋上の給水塔・アンテナ・航空障害灯。走路沿いのビルにはネオン看板と室外機 ---- */
  const towers = [], tanks = [], antennas = [], roofBoxes = [], redLights = [], acUnits = [];
  const bCols = ['#211c32', '#1c2030', '#292135', '#1f2932', '#2b2431', '#181b29', '#25222e'].map(C);
  const rot = (x, z, yaw) => [x * Math.cos(yaw) + z * Math.sin(yaw), -x * Math.sin(yaw) + z * Math.cos(yaw)];
  const roofStuff = (p, w, d, h, yaw) => {
    const at2 = (x, z, y) => { const [ox, oz] = rot(x, z, yaw); return new V3(p.x + ox, y, p.z + oz); };
    if (Math.random() < 0.5) tanks.push({ p: at2(rand(-w, w) * 0.3, rand(-d, d) * 0.3, h + 1.3), s: new V3(1.4, 2.6, 1.4) });
    if (Math.random() < 0.35) roofBoxes.push({ p: at2(rand(-w, w) * 0.25, rand(-d, d) * 0.25, h + 1.6), s: new V3(3.4, 3.2, 3.4), r: [0, yaw, 0] });
    if (Math.random() < 0.45 || h > 80) { const ah = rand(5, 14) + (h > 80 ? 10 : 0), q = at2(rand(-w, w) * 0.3, rand(-d, d) * 0.3, h + ah / 2); antennas.push({ p: q, s: new V3(0.14, ah, 0.14) }); if (h > 55) redLights.push({ p: q.clone().setY(h + ah + 0.3), s: new V3(0.55, 0.55, 0.55) }); }
  };
  const addTower = (p, w, d, h, yaw, c) => {
    towers.push({ p: new V3(p.x, h / 2, p.z), s: new V3(w, h, d), r: [0, yaw, 0], c: c || bCols[(Math.random() * bCols.length) | 0] });
    occupied.push({ x: p.x, z: p.z, r: Math.min(w, d) / 2 + 1 }); roofStuff(p, w, d, h, yaw);
  };

  /* ---- ネオン看板：文字ごとに1枚の材質をもつ板のインスタンス。縦書き（店の看板）と横書き（屋上・張り出し） ---- */
  const VSIGNS = [['押', '#ff5a3c'], ['大藥房', '#46f0c6'], ['金行', '#ffcf3f'], ['酒家', '#ff3fd0'], ['茶餐廳', '#39f3ff'], ['麻雀', '#5aff6a'], ['海鮮', '#39f3ff'], ['旅館', '#ff3fd0'],
    ['涼茶', '#ffcf3f'], ['跌打', '#ff5a3c'], ['燒味', '#ffcf3f'], ['粥麵', '#46f0c6'], ['馬會', '#39f3ff'], ['眼鏡', '#8b5cff'], ['占卜', '#ff3fd0'], ['當舖', '#ff5a3c']];
  const HSIGNS = [['HOTEL', '#ff3fd0'], ['BAR', '#39f3ff'], ['跑馬地', '#ffcf3f'], ['KARAOKE', '#8b5cff'], ['夜市', '#ff5a3c'], ['NOODLE', '#46f0c6'], ['トイ競馬', '#ff3fd0'],
    ['雀館', '#5aff6a'], ['洋服', '#39f3ff'], ['LUCKY', '#ffcf3f'], ['九龍', '#39f3ff'], ['廟街', '#ff5a3c'], ['STAR FERRY', '#e8fff4'], ['天后廟', '#ffcf3f']];
  const LANDMARK_SIGNS = ['廟街', 'STAR FERRY', '天后廟'];
  const signMats = [], signLists = [];
  const mkSign = ([text, col], vertical) => {
    signMats.push(new THREE.MeshBasicMaterial({ map: neonSignTex(text, col, vertical), color: C('#ffffff').multiplyScalar(1.6), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
    signLists.push([]); return { i: signLists.length - 1, n: [...text].length, vertical };
  };
  const vSigns = VSIGNS.map(s => mkSign(s, true)), hSigns = HSIGNS.map(s => mkSign(s, false));
  const hByText = t => hSigns[HSIGNS.findIndex(s => s[0] === t)];
  // 名所の看板（と占いの天幕の看板）は、店の看板の抽選から外す
  const vShop = vSigns.filter((_, i) => VSIGNS[i][0] !== '占卜'), hShop = hSigns.filter((_, i) => !LANDMARK_SIGNS.includes(HSIGNS[i][0]));
  const frames = [];
  // 看板1枚：中心 c、面の向き（法線の水平角）yaw、幅 w。両面に貼る（裏の文字が鏡写しにならないよう、背中合わせに2枚）
  const putSign = (sg, c, yaw, w, thick = 0.4) => {
    const h = sg.vertical ? w * sg.n : w * 160 / 512, nx = Math.sin(yaw), nz = Math.cos(yaw);
    for (const sd of [1, -1]) signLists[sg.i].push({ p: new V3(c.x + nx * sd * (thick / 2 + 0.03), c.y, c.z + nz * sd * (thick / 2 + 0.03)), s: new V3(w, h, 1), r: [0, yaw + (sd > 0 ? 0 : Math.PI), 0] });
    frames.push({ p: c.clone(), s: new V3(w + 0.4, h + 0.4, thick), r: [0, yaw, 0] });
    return h;
  };
  const pick = a => a[(Math.random() * a.length) | 0];

  // 走路沿いにビルを隙間なく並べる。side は外（+1）か内馬場（-1）、gap は走路の端から建物の正面まで。
  // ext は張り出し看板の長さ（建物の正面から走路の側へ）。回廊では走路の上まで張り出す
  const row = (s0, s1, side, gap, hMin, hMax, ext = [2.5, 4.5], signsPer = 1.5, vertP = 0.6) => {
    for (let s = s0; s < s1;) {
      const w = rand(9, 16), d = rand(12, 18), h = rand(hMin, hMax), sc = s + w / 2;
      s += w + rand(0.4, 2.2);
      const f = tp(sc, W / 2), p = local(sc, 0, side * (W / 2 + gap + d / 2));
      const ok = [[-1, -1], [1, -1], [1, 1], [-1, 1]].every(([a, b]) => {
        const q = p.clone().addScaledVector(f.dir, a * w / 2).addScaledVector(f.n, b * d / 2);
        return roadDist(q.x, q.z, W / 2 + gap) >= W / 2 + gap - 0.8 && landOK(q);
      });
      if (!ok || taken(p.x, p.z, Math.min(w, d) / 2)) continue;
      addTower(p, w, d, h, -f.h);
      // 正面（走路の側）の点：建物の局所座標で、横 a・高さ y
      const front = (a, y, out = 0) => p.clone().addScaledVector(f.dir, a).addScaledVector(f.n, -side * (d / 2 + out)).setY(y);
      // 室外機：香港のビルの壁を埋める四角い箱
      for (let k = 0; k < 8; k++) acUnits.push({ p: front(rand(-w / 2 + 1, w / 2 - 1), rand(6, h - 2), 0.35), s: new V3(0.9, 0.6, 0.7), r: [0, -f.h, 0] });
      // 張り出し看板：正面から走路の側へ突き出す（面は走路の進行方向を向く）
      for (let k = 0, n = Math.floor(signsPer + Math.random()); k < n; k++) {
        const vert = Math.random() < vertP, sg = vert ? pick(vShop) : pick(hShop), len = rand(ext[0], ext[1]);
        const sw = vert ? Math.min(3.2, len) : len, sh = vert ? sw * sg.n : sw * 160 / 512, y = rand(8 + sh / 2, Math.max(9 + sh / 2, Math.min(h - 2, 34) - sh / 2));
        if (y + sh / 2 > h) continue;
        putSign(sg, front(rand(-w / 2 + 1, w / 2 - 1), y, sw / 2 + 0.1), Math.PI / 2 - f.h, sw, 0.35);
      }
      // 正面の壁に貼る横長の看板（ビルの上のほう、走路を向く）
      if (h > 30 && Math.random() < 0.45) { const sg = pick(hShop), sw = Math.min(w * 0.85, 14), c = front(0, h - 4 - sw * 0.16, 0.25); putSign(sg, c, Math.atan2(-side * f.n.x, -side * f.n.z), sw, 0.2); }
    }
  };

  /* ---- ホーム直線：跑馬地。スタンドの裏を二階建てトラム（ディンディン）が走る ---- */
  {
    const s0 = at(8, 0.2), s1 = track.L + at(1, 0.75), V0 = W / 2 + 50, pts = [], rail = [[], []];
    for (let s = s0; s <= s1; s += 3) { const p = onGround(local(s, 0, V0)); pts.push(p); rail[0].push(local(s, 0, V0 - 0.75)); rail[1].push(local(s, 0, V0 + 0.75)); occupied.push({ x: p.x, z: p.z, r: 5 }); }
    pathRibbon(pts, 3.2, 0.03, toon('#2a2733'), W / 2 + 20); rail.forEach(r => pathRibbon(r, 0.22, 0.06, toon('#b9b6c4'), W / 2 + 20));
    // 架線の柱と腕木、架線
    const poles = [], arms = [], wires = []; let prev = null;
    for (let s = s0; s <= s1; s += 24) {
      const f = tp(s, W / 2), b = onGround(local(s, 0, V0 + 2.8)), top = b.clone().setY(6.6), tip = local(s, 0, V0).setY(6.2);
      poles.push({ p: b.clone().setY(3.3), s: new V3(0.18, 6.6, 0.18) }); arms.push(beam(top, tip.clone().setY(6.4), 0.12));
      if (prev) wires.push(beam(prev, tip, 0.05)); prev = tip;
    }
    addInst(CYL, steel, poles); addInst(BOX, steel, arms, false); addInst(BOX, toon('#15131c'), wires, false);
    // 終点の電停と案内
    const stop = registerLandmark(fantasyGroup(onGround(local(track.homeS0 + 30, 0, V0 - 3.2))), '跑馬地のトラム電停'); stop.rotation.y = -tp(track.homeS0 + 30, W / 2).h;
    addBox(stop, [16, 0.4, 2.4], [0, 0.2, 0], toon('#8e8a98')); for (const x of [-7, 7]) addBox(stop, [0.2, 3, 0.2], [x, 1.7, 0], steel); addBox(stop, [17, 0.25, 2.8], [0, 3.3, 0], toon('#2f8f4e'));
    signAt(stop, '跑馬地 終點（トラム電停）', 6.5, 14);
    const tram = route(pts, false), liv = ['#2f8f4e', '#d23c3c', '#2f6fbf', '#f2b632', '#8b5cff'];
    const trams = Array.from({ length: 3 }, (_, i) => {
      const g = fantasyGroup(); g.userData.droneIgnore = true; const body = toon(liv[i % liv.length]);
      addBox(g, [11, 2.1, 2.4], [0, 1.35, 0], body, null, 0.03); addBox(g, [11, 1.9, 2.4], [0, 3.4, 0], body, null, 0.03);
      addBox(g, [11.1, 0.35, 2.45], [0, 2.4, 0], toon('#f2ead6')); addBox(g, [10.8, 0.3, 2.2], [0, 4.45, 0], toon('#f2ead6'));
      // 2階建ての窓明かり（両側と前後）
      for (const y of [1.65, 3.55]) { addBox(g, [10.2, 0.9, 2.5], [0, y, 0], glowMat('#ffe7b0', 1.3)); addBox(g, [11.12, 0.9, 1.8], [0, y, 0], glowMat('#ffe7b0', 1.3)); }
      for (const z of [-0.7, 0.7]) part(g, SPH_LO, glowMat('#fff6d0', 2.2), [5.6, 0.8, z], [0.16, 0.16, 0.16], null, 0);
      addBox(g, [4.4, 0.08, 0.08], [-1.6, 5.3, 0], toon('#15131c'), [0, 0, 0.35]);
      for (const x of [-3.5, 3.5]) part(g, CYL, toon('#1a1a22'), [x, 0.35, 0], [0.4, 2.4, 0.4], [Math.PI / 2, 0, 0], 0);
      return { g, u: rand(0, tram.L * 2), v: rand(5.5, 7) };
    });
    updates.push((t, dt) => {
      for (const r of trams) {
        if (!reduced.matches) r.u += r.v * dt;
        const k = mod(r.u, tram.L * 2), back = k > tram.L, { p, yaw } = tram.at(back ? tram.L * 2 - k : k);
        r.g.position.copy(p).setY(0); r.g.rotation.y = yaw + (back ? Math.PI : 0);
      }
    });
  }

  /* ---- 第1区間の外：竹の足場を組んだ工事中のビル（緑の防護ネット） ---- */
  {
    const g = site('竹の足場', at(1, 0.45), W / 2 + 74, 26, 18, '#3a3644', W / 2 + 60), H = 58;
    addBox(g, [24, H, 16], [0, H / 2, 0], toon('#3d3a46'), null, 0.01); addBox(g, [6, 8, 6], [5, H + 4, 2], toon('#d9c27a'));
    // 竹の足場：縦横に組んだ細い竹と、上半分を覆う緑のネット。局所 -z が走路の側
    const bamboo = [], z = -9.2;
    for (let x = -12; x <= 12.01; x += 1.6) bamboo.push({ p: new V3(x, H / 2 + 1, z), s: new V3(0.09, H + 2, 0.09) });
    const horiz = []; for (let y = 1; y < H + 1; y += 2) horiz.push({ p: new V3(0, y, z - 0.15), s: new V3(25, 0.08, 0.08) });
    const toWorld = l => l.map(o => ({ p: g.localToWorld(o.p.clone()), s: o.s, r: [0, g.rotation.y, 0] }));
    addInst(CYL, toon('#d9c27a'), toWorld(bamboo), false); addInst(BOX, toon('#c9b06a'), toWorld(horiz), false);
    const net = new THREE.Mesh(new THREE.PlaneGeometry(24.5, H * 0.45), toon('#3fa66a', { transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false }));
    net.position.set(0, H * 0.74, z - 0.4); net.rotation.y = Math.PI; g.add(net);
    signAt(g, '竹の足場（工事中のビル）', H + 14, 18);
  }

  /* ---- 第2〜3区間：海沿いの高架道路。コンクリートの欄干にネオンの線、T字の橋脚 ---- */
  {
    let sA = 0, sB = 0;
    for (let s = at(1, 0.5); s < at(5, 0); s += 1) { const y = track.pos(s, W / 2).y; if (y > 0.04 && !sA) sA = s - 2; if (y > 0.04) sB = s + 2; }
    const strip = (lane, top, bottom, mat) => {
      const pts = [], idx = []; let n = 0;
      for (let s = sA; s <= sB + 0.01; s += 2) {
        const p = track.pos(Math.min(s, sB), lane); pts.push(p.x, top(p.y), p.z, p.x, bottom(p.y), p.z);
        if (n) idx.push(n - 2, n - 1, n, n - 1, n + 1, n); n += 2;
      }
      const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3)); geo.setIndex(idx); geo.computeVertexNormals();
      const m = new THREE.Mesh(geo, mat); m.receiveShadow = true; world.add(m); return m;
    };
    // 低いところは盛り土の擁壁、高いところは桁の側面
    const low = y => y > 2.2 ? y - 1.5 : -0.1;
    for (const lane of [-2.3, W + 2.3]) strip(lane, y => y + 1.3, low, concrete);
    strip(-2.4, y => y + 1.0, y => y + 0.82, glowD('#39f3ff', 2.4)); strip(W + 2.4, y => y + 1.0, y => y + 0.82, glowD('#ff4fd8', 2.4));
    strip(-2.4, y => y - 0.2, y => y - 0.35, glowD('#8b5cff', 1.8)); strip(W + 2.4, y => y - 0.2, y => y - 0.35, glowD('#8b5cff', 1.8));
    courseRibbon(sA, sB, -2.3, -1.5, 0.01, concrete); courseRibbon(sA, sB, W + 1.5, W + 2.3, 0.01, concrete); courseRibbon(sA, sB, -2.3, W + 2.3, -1.5, concrete);
    const cols = [], heads = [];
    for (let s = sA + 12; s < sB - 6; s += 24) {
      const c = track.pos(s, W / 2), y = c.y - 1.5; if (y < 1.2) continue;
      cols.push({ p: new V3(c.x, y / 2, c.z), s: new V3(1.5, y, 1.5) }); heads.push({ p: new V3(c.x, y - 0.6, c.z), s: new V3(2.4, 1.2, W + 5), r: [0, -c.h, 0] });
    }
    addInst(CYL, concrete, cols); addInst(BOX, concrete, heads);
    registerLandmark(fantasyGroup(tp(at(3, 0.3), W + 2).v), '海沿いの高架道路');
  }

  /* ---- 外周道路：二階建てバス・タクシー・ミニバスが行き交い、オレンジの街灯が並ぶ ---- */
  {
    // 角を丸めた長方形（ホーム直線の座標で、角ごとに1/4円）
    const pts = [], R = 24;
    const cornerArc = (cu, cv, a0) => { for (let i = 0; i <= 6; i++) { const a = a0 - i / 6 * Math.PI / 2; pts.push(fromUV(cu + Math.cos(a) * R, cv + Math.sin(a) * R)); } };
    cornerArc(ringU1 - R, ringV1 - R, Math.PI / 2); cornerArc(ringU1 - R, ringV0 + R, 0); cornerArc(ringU0 + R, ringV0 + R, -Math.PI / 2); cornerArc(ringU0 + R, ringV1 - R, Math.PI);
    const dense = []; for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length], n = Math.max(1, Math.ceil(a.distanceTo(b) / 6)); for (let k = 0; k < n; k++) dense.push(a.clone().lerp(b, k / n)); }
    const ring = route(dense, true);
    pathRibbon(dense.concat([dense[0]]), 14, 0.04, toon('#14121b'), W / 2 + 4);
    const dashes = [], lamps = [], lampHeads = [];
    for (let u = 0; u < ring.L; u += 6) { const { p, yaw } = ring.at(u); dashes.push({ p: p.clone().setY(0.08), s: new V3(2.6, 0.04, 0.22), r: [0, yaw, 0] }); }
    for (let u = 0; u < ring.L; u += 28) for (const sd of [-1, 1]) {
      const { p, yaw } = ring.at(u), nx = Math.sin(yaw), nz = Math.cos(yaw), b = new V3(p.x + nx * sd * 8.2, 0, p.z + nz * sd * 8.2);
      lamps.push({ p: b.clone().setY(4.5), s: new V3(0.14, 9, 0.14) }); lampHeads.push({ p: new V3(p.x + nx * sd * 6.4, 8.9, p.z + nz * sd * 6.4), s: new V3(1.4, 0.3, 0.6), r: [0, yaw + Math.PI / 2, 0] });
    }
    wide(addInst(BOX, toon('#d9b23a'), dashes, false)); wide(addInst(CYL, steel, lamps, false)); wide(addInst(BOX, glowMat('#ffb45a', 2.6), lampHeads, false));
    // 車両：局所 +x が前。ヘッドライトと赤いテールライト
    const lights = (g, L, y, z) => { for (const sd of [-1, 1]) { part(g, SPH_LO, glowMat('#fff6d8', 2.4), [L / 2, y, sd * z], [0.18, 0.18, 0.18], null, 0); part(g, SPH_LO, glowMat('#ff3030', 2.2), [-L / 2, y, sd * z], [0.15, 0.15, 0.15], null, 0); } };
    const bus = col => {
      const g = fantasyGroup(), b = toon(col);
      addBox(g, [11, 4.2, 2.5], [0, 2.5, 0], b, null, 0.03); addBox(g, [11.05, 0.5, 2.55], [0, 1.0, 0], toon('#d23c3c'));
      for (const y of [2.0, 3.8]) addBox(g, [10, 0.9, 2.58], [0, y, 0], glowMat('#fff0c8', 1.2));
      addBox(g, [0.05, 0.5, 2], [5.53, 4.35, 0], glowMat('#ffcf3f', 1.8));
      for (const x of [-3.4, 3.4]) part(g, CYL, toon('#15131c'), [x, 0.5, 0], [0.5, 2.6, 0.5], [Math.PI / 2, 0, 0], 0);
      lights(g, 11, 0.9, 0.9); return g;
    };
    const taxi = () => {
      const g = fantasyGroup();
      addBox(g, [4.4, 0.9, 1.8], [0, 0.85, 0], toon('#d42b2b'), null, 0.03); addBox(g, [2.4, 0.7, 1.7], [-0.2, 1.6, 0], toon('#cfd3d8'), null, 0.03);
      addBox(g, [0.6, 0.3, 0.5], [-0.2, 2.1, 0], glowMat('#ffe7a0', 2)); addBox(g, [2.3, 0.45, 1.75], [-0.2, 1.62, 0], glowMat('#b9d8ff', 0.6));
      for (const x of [-1.4, 1.4]) part(g, CYL, toon('#15131c'), [x, 0.4, 0], [0.4, 1.9, 0.4], [Math.PI / 2, 0, 0], 0);
      lights(g, 4.4, 0.85, 0.6); return g;
    };
    const minibus = () => {
      const g = fantasyGroup();
      addBox(g, [6.6, 2.4, 2.1], [0, 1.6, 0], toon('#efe6cf'), null, 0.03); addBox(g, [6.62, 0.5, 2.12], [0, 2.75, 0], toon(Math.random() < 0.5 ? '#2f8f4e' : '#d23c3c'));
      addBox(g, [5.6, 0.7, 2.14], [0, 1.95, 0], glowMat('#fff0c8', 1.1));
      for (const x of [-2.2, 2.2]) part(g, CYL, toon('#15131c'), [x, 0.45, 0], [0.45, 2.2, 0.45], [Math.PI / 2, 0, 0], 0);
      lights(g, 6.6, 0.9, 0.75); return g;
    };
    const fleet = [];
    const kinds = [() => bus('#efe6cf'), () => bus('#f2c640'), taxi, taxi, taxi, minibus, () => bus('#efe6cf'), taxi, taxi, minibus, taxi, () => bus('#f2c640'), taxi, taxi];
    kinds.forEach((mk, i) => { const g = mk(); g.userData.droneIgnore = true; fleet.push({ g, u: i / kinds.length * ring.L + rand(-8, 8), dir: i % 2 ? 1 : -1, v: rand(9, 13) }); });
    updates.push((t, dt) => {
      for (const c of fleet) {
        if (!reduced.matches) c.u += c.v * c.dir * dt;
        const { p, yaw } = ring.at(c.u), nx = Math.sin(yaw), nz = Math.cos(yaw);
        // 香港は左側通行：進行方向の左の車線を走る
        c.g.position.set(p.x - nx * 3.4 * c.dir, 0, p.z - nz * 3.4 * c.dir); c.g.rotation.y = yaw + (c.dir < 0 ? Math.PI : 0);
      }
    });
  }

  /* ---- 第2区間の外：ビクトリア・ハーバー。遊歩道、スターフェリーの桟橋と尖沙咀の時計台、行き交うフェリーと赤い帆のジャンク船 ---- */
  const vF = (vMin + 0) / 2 + 40;   // フェリー航路の位置（ホーム直線の座標で v）
  const farU = HB + 560;            // 対岸（香港島）の海岸線
  {
    const water = new THREE.Group(); water.position.copy(fromUV(0, 0, 0.06)); water.rotation.y = -hU; world.add(water);
    const wTex = ctex(256, 256, g => {
      g.fillStyle = '#060a1a'; g.fillRect(0, 0, 256, 256);
      for (let i = 0; i < 180; i++) { g.fillStyle = `rgba(${pick(['120,160,255', '255,90,210', '90,240,255', '255,210,120'])},${rand(0.08, 0.3)})`; g.fillRect(rand(0, 256), rand(0, 256), 1.4, rand(6, 26)); }
    }, true);
    wTex.repeat.set(40, 60);
    const wMat = new THREE.MeshBasicMaterial({ map: wTex, color: C('#ffffff').multiplyScalar(1.3) });
    const sea = new THREE.Mesh(new THREE.PlaneGeometry(farU - HB, 2600), wMat); sea.rotation.x = -Math.PI / 2; sea.position.set((HB + farU) / 2, 0, 0); sea.receiveShadow = true; water.add(sea);
    // 護岸：手前と対岸
    for (const u of [HB, farU]) addBox(water, [3, 1.6, 2600], [u, 0.2, 0], toon('#77747f'));
    // 遊歩道（星光大道）：石畳と手すり、街灯、夜景を眺める人々
    addBox(water, [HB - ringU1 - 7, 0.18, 2600], [(HB + ringU1 + 7) / 2, 0.06, 0], toon('#4b4757'));
    const rails = [], plamps = [], pheads = [];
    for (let v = -1200; v < 1200; v += 2.4) rails.push({ p: fromUV(HB - 1.2, v, 0.6), s: new V3(0.1, 1.2, 0.1) });
    for (let v = -1200; v < 1200; v += 22) { plamps.push({ p: fromUV(HB - 3, v, 2.6), s: new V3(0.12, 5.2, 0.12) }); pheads.push({ p: fromUV(HB - 3, v, 5.4), s: new V3(0.5, 0.5, 0.5) }); }
    wide(addInst(CYL, steel, rails, false)); wide(addInst(CYL, steel, plamps, false)); wide(addInst(SPH_LO, glowMat('#fff0d0', 2.6), pheads, false));
    addBox(water, [0.12, 0.12, 2600], [HB - 1.2, 1.2, 0], steel);
    for (let i = 0; i < 40; i++) addPerson(fromUV(HB - rand(3, 8), vF + rand(-180, 180)));
    // 高架と外周道路のあいだのヤシ並木
    const palms = [], fronds = [];
    for (let v = ringV0 + 30; v < ringV1 - 30; v += 16) {
      const p = fromUV(rand(uMax + 24, ringU1 - 14), v + rand(-3, 3)), h = rand(8, 11);
      if (roadDist(p.x, p.z, W / 2 + 14) < W / 2 + 12 || taken(p.x, p.z, 2)) continue;
      palms.push({ p: p.clone().setY(h / 2), s: new V3(0.35, h, 0.35), r: [rand(-0.08, 0.08), 0, rand(-0.08, 0.08)] });
      for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2; fronds.push({ p: p.clone().add(new V3(Math.cos(a) * 1.8, h - 0.4, Math.sin(a) * 1.8)), s: new V3(2.4, 0.18, 0.7), r: [0, -a, -0.35] }); }
    }
    addInst(CYL, toon('#5a4636'), palms); addInst(BOX, toon('#2f6a4a'), fronds, false);
    // スターフェリーの桟橋：緑の屋根の待合と、海へ延びる浮き桟橋
    const pier = registerLandmark(fantasyGroup(fromUV(HB + 6, vF)), 'スターフェリーの桟橋'); pier.rotation.y = -hU;
    addBox(pier, [12, 5, 26], [0, 2.5, 0], toon('#e9e3d3'), null, 0.02); addBox(pier, [14, 1, 28], [0, 5.5, 0], toon('#2f7a4a'), null, 0.02);
    addBox(pier, [24, 0.8, 8], [18, 0.4, 0], toon('#6f6a78')); addBox(pier, [12.2, 1.6, 22], [0, 3.2, 0], glowMat('#fff0c8', 1.1));
    { const sg = hByText('STAR FERRY'); putSign(sg, pier.localToWorld(new V3(-6.4, 7.6, 0)), -hU - Math.PI / 2, 12, 0.3); }
    // 尖沙咀の時計台：赤れんがと白い花崗岩の帯、四面の時計
    const clock = registerLandmark(fantasyGroup(fromUV(HB - 14, vF - 32)), '尖沙咀の時計台'); clock.rotation.y = -hU;
    landmarkFoundation(clock, 9, 9, '#8e8a98');
    for (let k = 0; k < 5; k++) { addBox(clock, [7, 6.6, 7], [0, k * 7 + 3.3, 0], toon('#b2553e'), null, 0.02); addBox(clock, [7.4, 0.5, 7.4], [0, k * 7 + 6.8, 0], toon('#e8e2d6')); }
    addBox(clock, [5.6, 4, 5.6], [0, 37, 0], toon('#e8e2d6'), null, 0.02);
    for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2, f = part(clock, new THREE.CircleGeometry(1.7, 24), glowMat('#fff6dc', 1.8), [Math.sin(a) * 2.85, 37, Math.cos(a) * 2.85], null, [0, a, 0], 0); f.castShadow = false; }
    part(clock, new THREE.CylinderGeometry(1.6, 2.6, 3, 8), toon('#e8e2d6'), [0, 40.5, 0], null, null, 0.02); part(clock, CONE, toon('#4a4658'), [0, 44, 0], [0.8, 4.6, 0.8], null, 0);
    signAt(clock, '尖沙咀の時計台', 50, 14);
    // スターフェリー：緑と白の両頭船。桟橋と対岸を行き来する
    const ferry = () => {
      const g = fantasyGroup(); g.userData.droneIgnore = true;
      addBox(g, [22, 2, 7], [0, 0.6, 0], toon('#2f7a4a'), null, 0.03); addBox(g, [19, 2.2, 6.4], [0, 2.7, 0], toon('#f2efe6'), null, 0.03);
      addBox(g, [18, 0.9, 6.5], [0, 2.8, 0], glowMat('#fff0c0', 1.2)); addBox(g, [20, 0.4, 7], [0, 3.95, 0], toon('#2f7a4a'));
      for (const x of [-7, 7]) addBox(g, [2.6, 1.6, 3], [x, 4.9, 0], toon('#f2efe6'));
      part(g, CYL, toon('#2f7a4a'), [0, 5.4, 0], [0.5, 3, 0.5], null, 0);
      for (const x of [-10.8, 10.8]) part(g, SPH_LO, glowMat('#ffffff', 2.4), [x, 3.2, 0], [0.25, 0.25, 0.25], null, 0);
      return g;
    };
    const ferries = [0, 0.5].map(ph => ({ g: ferry(), ph }));
    const fa = fromUV(HB + 40, vF), fb = fromUV(farU - 40, vF + 140);
    updates.push(t => {
      const m = reduced.matches ? 6 : t;
      for (const f of ferries) {
        const k = mod(m / 70 + f.ph, 1), tri = k < 0.5 ? k * 2 : 2 - k * 2, e = tri * tri * (3 - 2 * tri);
        f.g.position.lerpVectors(fa, fb, e).setY(0.1 + Math.sin(m * 1.3 + f.ph * 7) * 0.12);
        f.g.rotation.y = Math.atan2(-(fb.z - fa.z), fb.x - fa.x); f.g.rotation.z = Math.sin(m * 0.9 + f.ph) * 0.015;
      }
    });
    // 赤い帆のジャンク船：夜は帆を照らしてハーバーを横切る
    const junk = fantasyGroup(); junk.userData.droneIgnore = true;
    addBox(junk, [16, 1.8, 4.6], [0, 0.5, 0], toon('#6a3f24'), null, 0.03); addBox(junk, [4, 2, 4.8], [-7, 1.6, 0], toon('#6a3f24'), null, 0.03);
    const sail = toon('#d8343a', { emissive: C('#ff3a3a'), emissiveIntensity: 0.55, side: THREE.DoubleSide });
    // 帆：マストの根元を要にした扇形（船の長さの向きの面）と、帆を張る横の竹（バテン）
    [[4, 11], [-1.5, 14], [-6, 9]].forEach(([x, h]) => {
      part(junk, CYL, toon('#3a2a1c'), [x, h / 2 + 1, 0], [0.14, h + 2, 0.14], null, 0);
      const s = new THREE.Mesh(new THREE.CircleGeometry(h * 0.62, 12, Math.PI * 0.32, Math.PI * 0.5), sail); s.position.set(x - 0.3, 1.8, 0); s.rotation.y = 0.2; junk.add(s);
      for (let k = 1; k < 5; k++) addBox(junk, [h * 0.45, 0.12, 0.12], [x - 0.3 - h * 0.12, 1.8 + k * h * 0.12, 0.05], toon('#3a2a1c'), [0, 0.2, 0]);
    });
    updates.push((t, dt) => {
      const m = reduced.matches ? 30 : t, v = mod(m * 4, 1800) - 900;
      junk.position.copy(fromUV(HB + 150, vF + v, 0.1 + Math.sin(m) * 0.1)); junk.rotation.y = -hU - Math.PI / 2;
    });
    // 海に映る対岸の明かり：縦に揺れる光の帯
    const streak = ctex(64, 256, g => { const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, '#fff'); gr.addColorStop(1, '#000'); g.fillStyle = gr; g.fillRect(0, 0, 64, 256); g.fillStyle = '#000'; for (let y = 0; y < 256; y += 6) g.fillRect(rand(0, 32), y, rand(10, 40), rand(1, 3)); }, true);
    // 板は対岸の側（+u）が明るく、手前へ消えていく
    for (let i = 0; i < 18; i++) {
      const col = NEON[i % NEON.length], len = rand(260, 420), wd = rand(6, 16);
      const m = new THREE.Mesh(new THREE.PlaneGeometry(wd, len), new THREE.MeshBasicMaterial({ color: C(col).multiplyScalar(1.4), alphaMap: streak, transparent: true, depthWrite: false, opacity: 0.55 }));
      m.rotation.set(-Math.PI / 2, 0, -Math.PI / 2); m.position.set(farU - len / 2 - 4, 0.12, vF + rand(-500, 500)); water.add(m);
    }
    updates.push(t => { const m = reduced.matches ? 0 : t; wTex.offset.set(m * 0.004, m * 0.01); streak.offset.y = m * 0.05; });
  }

  /* ---- 対岸：香港島の摩天楼（国際金融中心、中国銀行タワー、セントラル・プラザ）とヴィクトリア・ピーク。夜8時の光のショー ---- */
  const lasers = [], washes = [];
  let cpTop = null;
  {
    const skyU0 = farU + 30, skyU1 = farU + 230;
    const facadeMat = neonFacade(toon('#232838'), 0.62);
    const far = [];
    for (let v = vF - 900; v < vF + 900; v += rand(24, 38)) {
      for (let k = 0; k < 3; k++) {
        const u = skyU0 + k * 60 + rand(-8, 8), w = rand(18, 30), d = rand(18, 30), mid = 1 - Math.min(1, Math.abs(v - vF) / 900);
        const h = rand(60, 120) + mid * rand(40, 110) - k * 10;
        far.push({ p: fromUV(u, v + rand(-6, 6), h / 2), s: new V3(w, h, d), r: [0, -hU + rand(-0.1, 0.1), 0], c: bCols[(Math.random() * bCols.length) | 0] });
        if (k === 0 && Math.random() < 0.3) { const c = NEON[(Math.random() * NEON.length) | 0]; washes.push({ p: fromUV(u, v, h + 1.5), w, d, h, c }); }
      }
    }
    wide(inst(BOX, facadeMat, far, false)).userData.backdrop = true;
    // 屋上の色の変わる光の帯（光のショーの外壁の照明）
    const washMat = glowMat('#ffffff', 2);
    const washMesh = wide(inst(BOX, washMat, washes.map(o => ({ p: o.p, s: new V3(o.w + 0.4, 3, o.d + 0.4), r: [0, -hU, 0], c: C(o.c) })), false)); washMesh.userData.backdrop = true;
    const backdrop = g => { g.userData.backdrop = true; g.rotation.y = -hU; return g; };
    // 国際金融中心（第2期）：段を重ねて細る塔と、冠の4本の爪
    const ifc = backdrop(fantasyGroup(fromUV(skyU0 - 4, vF + 120)));
    [[30, 150], [27, 40], [24, 30], [20, 22]].reduce((y, [w, h]) => { const m = new THREE.Mesh(BOX, facadeMat); m.scale.set(w, h, w); m.position.y = y + h / 2; ifc.add(m); return y + h; }, 0);
    for (const [x, z] of [[-8, -8], [8, -8], [8, 8], [-8, 8]]) addBox(ifc, [2.2, 30, 2.2], [x, 254, z], toon('#c9d2e0'));
    addBox(ifc, [16, 2, 16], [0, 244, 0], glowMat('#bfe3ff', 2.2));
    // 中国銀行タワー：正方形を対角線で4つの三角柱に分け、高さを変えて重ねる。外壁に光る「X」の筋かい
    const boc = backdrop(fantasyGroup(fromUV(skyU0 + 10, vF - 70)));
    const xTex = ctex(128, 128, g => { g.fillStyle = '#10141f'; g.fillRect(0, 0, 128, 128); g.strokeStyle = '#ffffff'; g.lineWidth = 5; g.beginPath(); g.moveTo(0, 0); g.lineTo(128, 128); g.moveTo(128, 0); g.lineTo(0, 128); g.stroke(); g.strokeRect(0, 0, 128, 128); }, true);
    xTex.repeat.set(1 / 26, 1 / 26);
    const bocMat = toon('#ffffff', { map: xTex, emissive: C('#ffffff'), emissiveMap: xTex, emissiveIntensity: 1.1 });
    const S = 28;
    [[[-S, -S], [S, -S]], [[S, -S], [S, S]], [[S, S], [-S, S]], [[-S, S], [-S, -S]]].forEach(([a, b], k) => {
      const shape = new THREE.Shape([new THREE.Vector2(0, 0), new THREE.Vector2(a[0], a[1]), new THREE.Vector2(b[0], b[1])]);
      const geo = new THREE.ExtrudeGeometry(shape, { depth: [150, 175, 200, 225][k], bevelEnabled: false }); geo.rotateX(-Math.PI / 2);
      const m = new THREE.Mesh(geo, bocMat); boc.add(m);
    });
    for (const x of [-4, 4]) addBox(boc, [0.8, 40, 0.8], [x, 245, -10], toon('#c9d2e0'));
    // セントラル・プラザ：三角の塔と、色を変えて時を知らせる頂部の光
    const cp = backdrop(fantasyGroup(fromUV(skyU0 + 30, vF - 260)));
    const cpb = new THREE.Mesh(new THREE.CylinderGeometry(22, 24, 180, 3), facadeMat); cpb.position.y = 90; cp.add(cpb);
    cpTop = glowMat('#ff3fd0', 2.2); part(cp, new THREE.ConeGeometry(18, 22, 3), cpTop, [0, 191, 0], null, null, 0); addBox(cp, [1, 40, 1], [0, 220, 0], toon('#c9d2e0'));
    // 光のショーのレーザー：対岸のビルの屋上から夜空へ
    const tops = [fromUV(skyU0 - 4, vF + 120, 265), fromUV(skyU0 + 10, vF - 70, 265), fromUV(skyU0 + 30, vF - 260, 210)];
    for (let i = 0; i < 6; i++) { const o = far[(Math.random() * far.length) | 0]; tops.push(o.p.clone().setY(o.s.y + 1)); }
    tops.forEach((p, i) => {
      const geo = new THREE.CylinderGeometry(0.45, 0.45, 900, 6, 1, true); geo.translate(0, 450, 0);
      const l = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: C(NEON[i % 5]).multiplyScalar(2.5), transparent: true, opacity: 0.38, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
      l.position.copy(p); l.userData.droneIgnore = l.userData.backdrop = true; l.frustumCulled = false; world.add(l); lasers.push(l);
    });
    // ヴィクトリア・ピークの稜線と、頂上のピーク・タワー
    const ridge = [];
    for (let k = 0; k < 14; k++) { const v = vF - 1000 + k * 150 + rand(-40, 40), h = 330 + Math.sin(k * 0.7) * 60 + (Math.abs(v - vF - 60) < 160 ? 110 : 0) + rand(0, 40); ridge.push({ p: fromUV(farU + 520 + rand(-40, 60), v, -2), s: new V3(rand(220, 300), h, rand(220, 300)), r: [0, rand(0, 3), 0] }); }
    const peakGeo = new THREE.ConeGeometry(1, 1, 9); peakGeo.translate(0, 0.5, 0);
    wide(inst(peakGeo, toon('#1f1438', { fog: false }), ridge, false)).userData.backdrop = true;
    const top = ridge.reduce((a, b) => (b.s.y > a.s.y ? b : a));
    const peak = fantasyGroup(top.p.clone().setY(top.p.y + top.s.y - 6)); peak.userData.backdrop = true;
    const noFog = m => { m.fog = false; return m; };
    part(peak, new THREE.CylinderGeometry(22, 12, 8, 16), toon('#d9d6e2', { fog: false }), [0, 10, 0], null, null, 0);
    part(peak, new THREE.CylinderGeometry(22.2, 22.2, 1.4, 16), noFog(glowMat('#fff0c8', 2.2)), [0, 13.5, 0], null, null, 0);
    // 山腹の家々の明かり：円錐の表面に点々と
    const houses = [];
    for (const o of ridge) for (let k = 0; k < 26; k++) { const hf = rand(0.03, 0.5), a = rand(0, Math.PI * 2), r = o.s.x * (1 - hf) * 0.99; houses.push({ p: o.p.clone().add(new V3(Math.cos(a) * r, o.s.y * hf, Math.sin(a) * r)), s: new V3(1.3, 1.3, 1.3) }); }
    wide(inst(SPH_LO, noFog(glowMat('#ffdca0', 2)), houses, false)).userData.backdrop = true;
  }

  /* ---- 第4区間：彌敦道（ネイザン・ロード）のネオン回廊。両側のビルから看板が走路の上まで張り出す ---- */
  {
    const s0 = at(4, 0.05), s1 = at(5, 0.15);
    row(s0, s1, 1, 11, 34, 78, [6, 13], 3.2, 0.35); row(s0, s1, -1, 11, 30, 70, [6, 13], 3.2, 0.35);
    // 通りを照らす桃色の光
    const light = new THREE.PointLight(C('#ff4fd8'), 1.1, 170, 1.5); light.position.copy(tp(at(4, 0.6), W / 2).v).setY(20); world.add(light);
    updates.push(t => { light.intensity = (celebration > 0 ? 1.8 : 1.0) + Math.sin((reduced.matches ? 0 : t) * 3.1) * 0.1; });
    registerLandmark(fantasyGroup(tp(at(4, 0.6), W + 11).v), '彌敦道のネオン回廊');
  }

  /* ---- 第5〜6区間：廟街のナイトマーケット。入口の牌楼、紅白藍の幌の屋台、裸電球の列、占いの天幕 ---- */
  {
    const sIn = at(6, 0.04), f = tp(sIn, W / 2);
    // 牌楼：走路をまたぐ門。正面に「廟街」の横書きネオン
    const gate = registerLandmark(fantasyGroup(f.v.clone().setY(0)), '廟街の牌楼'); gate.rotation.y = -f.h;
    const red = toon('#c2332f'), green = toon('#2f7a4a'), gold = toon('#e0b04a');
    for (const z of [-(W / 2 + 3), W / 2 + 3]) { addBox(gate, [1.4, 13, 1.4], [0, 6.5, z], red, null, 0.03); addBox(gate, [2.2, 1.2, 2.2], [0, 0.6, z], toon('#8e8a98')); }
    addBox(gate, [1.6, 2.6, W + 10], [0, 12.4, 0], red, null, 0.03); addBox(gate, [3.6, 0.6, W + 14], [0, 14.1, 0], green, null, 0.03);
    part(gate, roof4, green, [0, 15.4, 0], [2.6, 2.4, (W + 14) / 2], null, 0.02);
    for (const z of [-(W / 2 + 6), W / 2 + 6]) part(gate, CONE, gold, [0, 17.2, z], [0.4, 1.4, 0.4], null, 0);
    gate.updateMatrixWorld(true);
    { const sg = hByText('廟街'); putSign(sg, gate.localToWorld(new V3(0, 12.4, 0)), Math.PI / 2 - f.h, 10, 1.7); }
    const posts = [], tarps = [], tarpsB = [], counters = [], goods = [], bulbs = [], steam = [];
    const tarpTex = ctex(128, 64, g => { ['#d23c3c', '#f2f0ea', '#2f5fbf'].forEach((c, k) => { for (let x = k * 14; x < 128; x += 42) { g.fillStyle = c; g.fillRect(x, 0, 14, 64); } }); }, true);
    const s0 = at(5, 0.85), s1 = at(6, 0.96), zoneMid = at(6, 0.5);
    for (let s = s0; s < s1; s += 7.2) for (const side of [1, -1]) {
      if (side > 0 && Math.abs(s - zoneMid) < 9) continue;   // 区間の案内板の前は空ける
      const v = side * (W / 2 + 6), c = local(s, 0, v), fs = tp(s, W / 2);
      if (!clearAt(c.x, c.z, W / 2 + 4)) continue;
      const yaw = -fs.h, L = (x, y, z) => { const [ox, oz] = rot(x, z * side, yaw); return new V3(c.x + ox, y, c.z + oz); };
      for (const [x, z] of [[-2.7, -1.6], [2.7, -1.6], [-2.7, 1.6], [2.7, 1.6]]) posts.push({ p: L(x, 1.4, z), s: new V3(0.07, 2.8, 0.07) });
      (Math.random() < 0.65 ? tarps : tarpsB).push({ p: L(0, 2.95, 0), s: new V3(6, 0.12, 4), r: [0, yaw, 0], c: C(pick(['#d23c3c', '#f2b632', '#2f8f4e', '#ffffff', '#2f6fbf'])) });
      // 売り台は客の側（走路と反対の路地）を向く
      counters.push({ p: L(0, 0.55, 0.8), s: new V3(5.4, 1.1, 1.6), r: [0, yaw, 0], c: C(pick(['#6a4a34', '#4a4658', '#8a5a3a'])) });
      for (let k = 0; k < 7; k++) goods.push({ p: L(rand(-2.4, 2.4), 1.25, rand(0.2, 1.4)), s: new V3(0.32, 0.26, 0.32), c: C(pick(['#ff5a7a', '#ffd34a', '#7ad0ff', '#7aff9a', '#ffffff', '#ff9a4a'])) });
      for (const x of [-1.5, 1.5]) bulbs.push({ p: L(x, 2.5, 0), s: new V3(0.22, 0.22, 0.22) });
      if (Math.random() < 0.3) steam.push(L(rand(-1.5, 1.5), 1.4, -0.4));
      // 屋台の奥で品定めをする人々
      for (let k = 0; k < 3; k++) addPerson(onGround(L(rand(-2.5, 2.5), 0, rand(2.6, 5.5))));
      occupied.push({ x: c.x, z: c.z, r: 3.5 });
    }
    addInst(CYL, steel, posts, false); addInst(BOX, toon('#ffffff', { map: tarpTex }), shuffle(tarps), false); addInst(BOX, toon('#ffffff'), shuffle(tarpsB), false);
    addInst(BOX, toon('#ffffff'), counters); addInst(SPH_LO, toon('#ffffff'), shuffle(goods), false); addInst(SPH_LO, glowMat('#ffd890', 3), bulbs, false);
    // 通りの上に渡した電球の列：走路をまたいで弧を描く
    const lineBulbs = [];
    for (let s = s0 + 6; s < s1; s += 16) for (let k = 0; k <= 14; k++) { const t = k / 14, q = local(s + (t - 0.5) * 4, 0, lerp(-(W / 2 + 6), W / 2 + 6, t)); lineBulbs.push({ p: q.setY(12.5 - Math.sin(t * Math.PI) * 1.8), s: new V3(0.26, 0.26, 0.26), c: C(NEON[k % 5]).multiplyScalar(2) }); }
    const lb = addInst(SPH_LO, glowMat('#ffffff', 1), lineBulbs, false); if (lb) lb.userData.droneIgnore = true;
    // 占いの天幕：赤い灯籠と「占卜」の縦看板
    for (let i = 0; i < 4; i++) {
      const s = lerp(s0, s1, (i + 0.5) / 4), c = onGround(local(s, 0, -(W / 2 + 15 + (i % 2) * 4))), fs = tp(s, W / 2);
      if (!clearAt(c.x, c.z, W / 2 + 11, 3)) continue;
      const g = fantasyGroup(c); g.rotation.y = -fs.h;
      part(g, new THREE.ConeGeometry(2.6, 3.4, 4, 1, true), toon('#7a2a6a', { side: THREE.DoubleSide }), [0, 3.9, 0], null, [0, Math.PI / 4, 0], 0.02);
      for (const [x, z] of [[-1.8, -1.8], [1.8, -1.8], [-1.8, 1.8], [1.8, 1.8]]) addBox(g, [0.12, 2.3, 0.12], [x, 1.15, z], steel);
      addBox(g, [1.6, 0.9, 1], [0, 0.45, 0], toon('#c2332f')); part(g, SPH_LO, glowMat('#ff5a3c', 2.2), [0, 2.2, -2.3], [0.5, 0.6, 0.5], null, 0);
      addPerson(c.clone().add(new V3(0.3, 0, 0.6)));
      g.updateMatrixWorld(true); putSign(vSigns[VSIGNS.findIndex(s => s[0] === '占卜')], g.localToWorld(new V3(0, 4.2, -2.6)), Math.atan2(fs.n.x, fs.n.z), 1.4, 0.2);
    }
    registerLandmark(fantasyGroup(local(at(6, 0.5), 0, W / 2 + 6)), '廟街のナイトマーケット');
    const light = new THREE.PointLight(C('#ffb050'), 1.1, 120, 1.5); light.position.copy(tp(at(6, 0.5), W / 2).v).setY(14); world.add(light);
    // 屋台の湯気（煲仔飯・魚蛋）
    let acc = 0; const stCol = C('#d8d2e2');
    updates.push((t, dt) => { if (reduced.matches || !steam.length) return; acc += dt * (lightQuality() ? 2 : 5); while (acc >= 1) { acc--; const p = steam[(Math.random() * steam.length) | 0]; dustP.emit(p.x, p.y, p.z, rand(-0.2, 0.2), rand(0.8, 1.4), rand(-0.2, 0.2), rand(2, 3), rand(0.8, 1.6), stCol, -0.05, 0.3); } });
    // 店の並び（屋台の奥）
    row(at(5, 0.1), at(6, 0.98), 1, 20, 26, 54, [3, 6], 2);
  }

  /* ---- 第7区間の外：九龍城砦。継ぎ足しの建物がひとかたまりの壁になり、屋上にアンテナの林。屋上すれすれに旅客機が降りていく ---- */
  {
    const g = site('九龍城砦', at(7, 0.5), W / 2 + 48, 64, 44, '#2a2630', W / 2 + 18);
    const blocks = [], ants = [], laundry = [];
    for (let x = -28; x <= 28.01; x += 8) for (let z = -18; z <= 18.01; z += 9) {
      const h = rand(30, 44), w = rand(7.5, 10), d = rand(8.5, 11);
      blocks.push({ p: new V3(x + rand(-0.8, 0.8), h / 2, z + rand(-0.8, 0.8)), s: new V3(w, h, d), c: bCols[(Math.random() * bCols.length) | 0] });
      for (let k = 0; k < 3; k++) ants.push({ p: new V3(x + rand(-3.5, 3.5), h + 2.5, z + rand(-3.5, 3.5)), s: new V3(0.1, rand(3, 7), 0.1) });
      if (z < -10) for (let k = 0; k < 3; k++) laundry.push({ p: new V3(x + rand(-3, 3), rand(6, h - 3), z - d / 2 - 0.6), s: new V3(2.4, 0.9, 0.06), c: C(pick(['#f2f0ea', '#7ad0ff', '#ff9ab0', '#ffd34a'])) });
    }
    g.updateMatrixWorld(true);
    const toWorld = l => l.map(o => ({ ...o, p: g.localToWorld(o.p.clone()), r: [0, g.rotation.y, 0] }));
    const wc = inst(BOX, neonFacade(toon('#ffffff'), 0.72), toWorld(blocks)); wc.frustumCulled = false;
    addInst(CYL, steel, toWorld(ants), false); addInst(BOX, toon('#ffffff'), toWorld(laundry), false);
    signAt(g, '九龍城砦', 58, 16);
    // 旅客機：海の側から街の上を低く降りてくる（約36秒ごと）
    const plane = fantasyGroup(); plane.userData.droneIgnore = true;
    const body = toon('#eef0f4'), tail = toon('#2f6fbf');
    part(plane, new THREE.CapsuleGeometry(2.2, 26, 4, 12), body, [0, 0, 0], null, [0, 0, Math.PI / 2], 0.02);
    addBox(plane, [7, 0.5, 34], [-1, -0.6, 0], body, null, 0.02); addBox(plane, [3.6, 0.4, 12], [-13.4, 0.6, 0], body, null, 0.02);
    addBox(plane, [4.4, 7, 0.5], [-13.2, 4, 0], tail, [0, 0, -0.35], 0.02);
    for (const z of [-7, 7]) part(plane, CYL, toon('#c9ccd4'), [0.4, -2, z], [1.1, 4, 1.1], [0, 0, Math.PI / 2], 0.02);
    for (const z of [-2.25, 2.25]) addBox(plane, [20, 0.45, 0.1], [0, 0.4, z], glowMat('#fff0c0', 1.4));
    part(plane, SPH_LO, glowMat('#ffffff', 3), [15.2, -0.8, 0], [0.4, 0.4, 0.4], null, 0);
    const navL = part(plane, SPH_LO, glowMat('#ff2a2a', 3), [-1, -0.6, -17.2], [0.35, 0.35, 0.35], null, 0), navR = part(plane, SPH_LO, glowMat('#2aff6a', 3), [-1, -0.6, 17.2], [0.35, 0.35, 0.35], null, 0);
    const beacon = part(plane, SPH_LO, glowMat('#ff3030', 3), [0, 2.6, 0], [0.35, 0.35, 0.35], null, 0);
    const wcP = g.position.clone(), dirP = wcP.clone().sub(tp(at(7, 0.5), W / 2).v).setY(0).normalize().applyAxisAngle(new V3(0, 1, 0), 0.5);
    const pa = wcP.clone().addScaledVector(dirP, 1100).setY(240), pb = wcP.clone().addScaledVector(dirP, -900).setY(20), pm = wcP.clone().setY(88);
    plane.rotation.y = -Math.atan2(-dirP.z, -dirP.x);
    updates.push(t => {
      const m = reduced.matches ? 12 : t, k = mod(m / 36, 1), u = k / 0.55;
      plane.visible = u < 1; if (!plane.visible) return;
      // 2次ベジェで降りてくる（中間点が城砦の上）
      plane.position.set(0, 0, 0).addScaledVector(pa, (1 - u) ** 2).addScaledVector(pm, 2 * u * (1 - u)).addScaledVector(pb, u * u);
      plane.rotation.z = -0.06 - u * 0.04;
      const blink = mod(m, 1.2) < 0.12; beacon.visible = blink; navL.visible = navR.visible = mod(m + 0.6, 1.2) > 0.1;
    });
  }

  /* ---- 第8区間の外：天后廟。緑の瓦の重ね屋根、朱の柱、軒下に吊るした渦巻き線香と灯籠 ---- */
  {
    const g = site('天后廟', at(8, 0.45), W / 2 + 26, 26, 16, '#4a3a3a', W / 2 + 12);
    const red = toon('#b8352d'), tile = toon('#2f7a5a'), gold = toon('#e0b04a'), stone = toon('#8e8a98');
    addBox(g, [24, 1, 14], [0, 0.5, 0], stone, null, 0.02); addBox(g, [20, 6, 10], [0, 4, 1.5], toon('#9a8a7a'), null, 0.02);
    for (let x = -8; x <= 8.01; x += 4) part(g, CYL, red, [x, 3.6, -4.2], [0.35, 6, 0.35], null, 0.03);
    part(g, roof4, tile, [0, 8.4, 0.5], [16, 3, 9.5], null, 0.02); part(g, roof4, tile, [0, 10.6, 1], [11, 2.4, 6.5], null, 0.02);
    addBox(g, [17, 0.6, 0.6], [0, 9.9, 0.5], gold);
    for (const x of [-7.5, 7.5]) part(g, SPH_LO, toon('#f2c040'), [x, 10.4, 0.5], [0.5, 0.9, 0.5], null, 0);
    addBox(g, [5, 3.6, 0.2], [0, 2.8, -3.45], glowMat('#ffb050', 1.4));
    // 灯籠と渦巻き線香（先が赤く光る）
    for (const x of [-5, 5]) { part(g, SPH_LO, glowMat('#ff3a2a', 2.2), [x, 6.2, -5], [0.8, 1, 0.8], null, 0); addBox(g, [0.05, 1, 0.05], [x, 7.2, -5], steel); }
    const coils = [], tips = [];
    for (let x = -7; x <= 7.01; x += 2) { coils.push({ p: g.localToWorld(new V3(x, 6.4, -6.2)), s: new V3(0.8, 1.6, 0.8), r: [Math.PI, 0, 0] }); tips.push({ p: g.localToWorld(new V3(x, 5.55, -6.2)), s: new V3(0.12, 0.12, 0.12) }); }
    addInst(CONE, toon('#c9a070', { transparent: true, opacity: 0.85 }), coils, false); addInst(SPH_LO, glowMat('#ff5a2a', 3), tips, false);
    for (let i = 0; i < 6; i++) addPerson(g.localToWorld(new V3(rand(-8, 8), 1, rand(-9, -7))));
    g.updateMatrixWorld(true); { const sg = hByText('天后廟'); putSign(sg, g.localToWorld(new V3(0, 7.2, -4.9)), g.rotation.y + Math.PI, 6, 0.2); }
    signAt(g, '天后廟（渦巻き線香）', 16, 14);
    let acc = 0; const smoke = C('#c8c2d6');
    updates.push((t, dt) => { if (reduced.matches) return; acc += dt * (lightQuality() ? 1.5 : 4); while (acc >= 1) { acc--; const p = tips[(Math.random() * tips.length) | 0].p; dustP.emit(p.x, p.y + 0.3, p.z, rand(-0.15, 0.15), rand(0.5, 0.9), rand(-0.15, 0.15), rand(3, 4.5), rand(0.6, 1.2), smoke, -0.03, 0.2); } });
  }

  /* ---- 内馬場：ハッピーバレーの運動場。サッカー場とバスケットコート、照明塔と木立 ---- */
  {
    const pitchTex = ctex(512, 320, g => {
      for (let x = 0; x < 512; x += 64) { g.fillStyle = (x / 64) % 2 ? '#2f7a3e' : '#358a46'; g.fillRect(x, 0, 64, 320); }
      g.strokeStyle = '#f2f0ea'; g.lineWidth = 4; g.strokeRect(12, 12, 488, 296); g.beginPath(); g.moveTo(256, 12); g.lineTo(256, 308); g.stroke();
      g.beginPath(); g.arc(256, 160, 46, 0, Math.PI * 2); g.stroke(); g.strokeRect(12, 90, 70, 140); g.strokeRect(430, 90, 70, 140);
    });
    const courtTex = ctex(256, 144, g => {
      g.fillStyle = '#2a5a9a'; g.fillRect(0, 0, 256, 144); g.fillStyle = '#d9763a'; g.fillRect(0, 50, 46, 44); g.fillRect(210, 50, 46, 44);
      g.strokeStyle = '#f2f0ea'; g.lineWidth = 3; g.strokeRect(4, 4, 248, 136); g.beginPath(); g.moveTo(128, 4); g.lineTo(128, 140); g.stroke(); g.beginPath(); g.arc(128, 72, 20, 0, Math.PI * 2); g.stroke();
    });
    const fits = (c, w, d) => [[-1, -1], [1, -1], [1, 1], [-1, 1], [0, 0]].every(([a, b]) => { const q = c.clone().addScaledVector(U, a * w / 2).addScaledVector(VN, b * d / 2); return inLoop(q.x, q.z) && roadDist(q.x, q.z, W / 2 + 14) >= W / 2 + 12; })
      && c.distanceTo(boardPos) > Math.hypot(w, d) / 2 + 26 && !taken(c.x, c.z, Math.hypot(w, d) / 2);
    const lights = [], lightHeads = [];
    const field = (tex, w, d, n, post) => {
      for (let k = 0, placed = 0; k < 400 && placed < n; k++) {
        const c = fromUV(rand(uMin + 20, uMax - 20), rand(vMin + 20, -20));
        if (!fits(c, w + 8, d + 8)) continue;
        const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), toon('#ffffff', { map: tex })); m.rotation.set(-Math.PI / 2, 0, -hU); m.position.copy(c).setY(0.05); m.receiveShadow = true; world.add(m);
        occupied.push({ x: c.x, z: c.z, r: Math.hypot(w, d) / 2 + 4 }); placed++;
        if (post) for (const [a, b] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { const q = c.clone().addScaledVector(U, a * (w / 2 + 3)).addScaledVector(VN, b * (d / 2 + 3)); lights.push({ p: q.clone().setY(post / 2), s: new V3(0.3, post, 0.3) }); lightHeads.push({ p: q.clone().setY(post + 0.6), s: new V3(2.4, 1.4, 0.5), r: [0, -hU + Math.atan2(b, a), 0] }); }
      }
    };
    field(pitchTex, 64, 40, 2, 18); field(courtTex, 28, 15, 4, 0);
    addInst(CYL, steel, lights); addInst(BOX, glowMat('#fffbe8', 4), lightHeads, false);
    const trees = [];
    for (let k = 0; k < 300 && trees.length < 50; k++) { const c = fromUV(rand(uMin, uMax), rand(vMin, 0)); if (!inLoop(c.x, c.z) || roadDist(c.x, c.z, W / 2 + 10) < W / 2 + 8 || taken(c.x, c.z, 3) || c.distanceTo(boardPos) < 26) continue; const r = rand(2.2, 3.6); trees.push({ p: c.setY(r + 2), s: new V3(r, r * 1.1, r), c: C(pick(['#2a5a3a', '#2f6a40', '#244f34'])) }); }
    addInst(SPH_LO, toon('#ffffff'), trees); addInst(CYL, toon('#4a3a2c'), trees.map(o => ({ p: o.p.clone().setY(1.2), s: new V3(0.3, 2.4, 0.3) })), false);
    registerLandmark(fantasyGroup(fromUV((uMin + uMax) / 2, vMin / 2)), 'ハッピーバレーの運動場');
  }

  // 屋上に「トイ競馬」の大きなネオン（ホーム直線の向こう、外周道路の先のビル）
  {
    const c = fromUV(track.S * 0.5, ringV1 + 40), h = 64;
    addTower(c, 46, 22, h, -hU, C('#1a1626'));
    const sg = hByText('トイ競馬'); addBox(world, [0.6, 10, 0.6], [c.x, h + 5, c.z], steel); putSign(sg, c.clone().setY(h + 9 + 8), Math.atan2(-VN.x, -VN.z), 52, 0.6);
  }

  /* ---- 走路沿いの街並み（第1・3・5・8区間）と、その奥の碁盤目の街区 ---- */
  row(at(1, 0.0), at(1, 1), 1, 62, 30, 64);
  row(at(3, 0.0), at(4, 0.05), 1, 12, 28, 60);
  row(at(7, 0.05), at(7, 0.95), -1, 12, 24, 50);
  row(at(8, 0.0), at(8, 1), 1, 62, 30, 64);
  {
    const PITCH = 44;
    for (let gu = Math.floor((uMin - 620) / PITCH); gu <= Math.ceil(HB / PITCH); gu++) for (let gv = Math.floor((vMin - 620) / PITCH); gv <= Math.ceil(640 / PITCH); gv++) {
      const u = gu * PITCH + rand(-5, 5), v = gv * PITCH + rand(-5, 5), p = fromUV(u, v);
      const w = rand(14, 28), d = rand(14, 28), r = Math.hypot(w, d) / 2;
      if (u + r > uMax + 4) continue;   // 高架より海側は、ヤシ並木と外周道路・遊歩道・海
      if (ringDist(u, v) < r + 9 || inHomeLot(u, v) || inLoop(p.x, p.z)) continue;
      if (!clearAt(p.x, p.z, W / 2 + 36 + r, r)) continue;
      const far = Math.max(0, Math.hypot(Math.max(0, ringU0 - u, u - ringU1), Math.max(0, ringV0 - v, v - ringV1)));
      const h = rand(32, 72) + Math.random() * Math.min(110, 30 + far * 0.25);
      addTower(p, w, d, h, -hU + (Math.random() < 0.2 ? rand(-0.3, 0.3) : 0));
    }
  }
  // まとめて描く：ビル（窓明かりのシェーダー）、屋上の設備、看板
  const tm = wide(inst(BOX, neonFacade(toon('#ffffff'), 0.5), towers)); tm.receiveShadow = true;
  wide(addInst(CYL, toon('#6f6a78'), tanks)); wide(addInst(BOX, toon('#3a3644'), roofBoxes)); wide(addInst(CYL, steel, antennas, false));
  const red = wide(addInst(SPH_LO, glowMat('#ff2a2a', 3), redLights, false));
  wide(addInst(BOX, toon('#8d8a99'), shuffle(acUnits), false)); if (frames.length) wide(inst(BOX, toon('#0e0c14'), frames, false));
  const signMeshes = signLists.map((l, i) => { if (!l.length) return null; const m = wide(inst(new THREE.PlaneGeometry(1, 1), signMats[i], l, false)); m.userData.droneIgnore = true; return m; });
  // 低画質で前半だけ描くとき、体と頭がそろって消えるように同じ順に並べ替える
  const order = shuffle(people.map((_, i) => i));
  wide(addInst(new THREE.CapsuleGeometry(0.3, 0.75, 3, 8), toon('#ffffff'), order.map(i => people[i]), false)); wide(addInst(SPH_LO, toon('#e9c4a4'), order.map(i => heads[i]), false));

  /* ---- 動き：看板の点滅とちらつき、窓明かり、光のショー、航空障害灯 ---- */
  updates.push((t, dt) => {
    const m = reduced.matches ? 0 : t;
    NEON_U.time.value = m;
    signMats.forEach((mat, i) => {
      let k = 1.5 + Math.sin(m * 2 + i) * 0.15;
      if (celebration > 0 && !reduced.matches) k = Math.sin(m * 12 + i * 1.7) > 0 ? 2.8 : 0.5;
      else if (reduced.matches) k = 1.6;
      else if (i % 5 === 0) k = mod(m * 0.7 + i * 0.13, 1) < 0.78 ? 1.7 : 0.12;        // 点いたり消えたり
      else if (i % 7 === 3) k = Math.random() < 0.05 ? 0.3 : 1.6;                         // 古いネオン管のちらつき
      mat.color.setScalar(k);
    });
    if (red) red.material.color.setScalar(mod(m, 2) < 1 ? 3 : 0.6);
    // 夜8時の光のショー（ここでは45秒ごとに16秒間）。ゴールでも始まる
    const show = celebration > 0 || mod(m, 45) < 16;
    lasers.forEach((l, i) => {
      l.visible = show && S.mode !== 'courseCatalog';   // 図鑑では対岸の遠景ごと隠す
      l.rotation.z = Math.sin(m * 0.6 + i) * 0.55; l.rotation.x = Math.cos(m * 0.45 + i * 1.3) * 0.35 - 0.2;
    });
    if (cpTop) cpTop.color.setHSL(mod(Math.floor(m / 4) * 0.17, 1), 0.9, 0.55).multiplyScalar(2.2);
  });

  /* ---- ゴール：ハーバーに花火が上がり、街じゅうのネオンが瞬く ---- */
  themeFinish = () => { celebration = 9; }; themeReset = () => { celebration = 0; };
  let fw = 0;
  updates.push((t, dt) => {
    if (celebration <= 0) return;
    celebration = Math.max(0, celebration - dt);
    if (reduced.matches) return;
    fw -= dt;
    if (fw > 0) return;
    fw = rand(0.25, 0.55);
    const c = fromUV(HB + rand(120, 380), vF + rand(-260, 260), rand(110, 170)), col = glowCols[(Math.random() * glowCols.length) | 0], col2 = glowCols[(Math.random() * glowCols.length) | 0], n = lightQuality() ? 28 : 64;
    for (let i = 0; i < n; i++) {
      const a = rand(0, Math.PI * 2), z = rand(-1, 1), r = Math.sqrt(1 - z * z), sp = rand(26, 34);
      sparkP.emit(c.x, c.y, c.z, Math.cos(a) * r * sp, z * sp, Math.sin(a) * r * sp, rand(1.6, 2.4), rand(3, 4.5), i % 3 ? col : col2, 7, 0.9);
    }
  });

  // 夜の街のもや：桃色と水色の光の粒が漂う
  const mc = [C('#ff3fd0').multiplyScalar(2), C('#39f3ff').multiplyScalar(2)];
  ambient(TEX_SOFT, true, 24, (a, c) => a.emit(c.x + rand(-70, 70), rand(0.5, 14), c.z + rand(-70, 70), rand(-0.3, 0.3), rand(0.4, 1.2), rand(-0.3, 0.3), 7, rand(0.25, 0.5), mc[(Math.random() * 2) | 0], 0, 0), true);
  themeUpd.push((t, dt) => { for (const f of updates) f(t, dt); });
}
// スタンド：跑馬地の夜。濃紺の段にネオン管の縁取り、屋上に「跑馬地」と「トイ競馬」の大きなネオン、柱に縦書きの看板
function decorNeonStand(stand, len, z0, roof) {
  const g = new THREE.Group(); stand.add(g); registerLandmark(g, 'neon-stand');
  const sign = (text, col, vertical, w, pos, yaw) => {
    const mat = new THREE.MeshBasicMaterial({ map: neonSignTex(text, col, vertical), color: C('#ffffff').multiplyScalar(2), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
    const h = vertical ? w * [...text].length : w * 160 / 512, m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat); m.position.set(...pos); m.rotation.y = yaw; g.add(m);
    addBox(g, [w + 0.6, h + 0.6, 0.4], [pos[0], pos[1], pos[2] + 0.25], toon('#0e0c14'));
    return h;
  };
  // 段の縁のネオン管（交互に水色と桃色）
  for (let k = 0; k < 8; k += 2) addBox(g, [len, 0.12, 0.12], [0, 0.9 * (k + 1) + 0.32, z0 + k * 2.2 + 0.05], glowMat(k % 4 ? '#ff4fd8' : '#39f3ff', 2.6));
  // 屋上の大看板：走路を向く（局所 -z が走路の側）
  for (const [x, text, col] of [[-len * 0.22, '跑馬地', '#ffcf3f'], [len * 0.22, 'トイ競馬', '#ff3fd0']]) {
    const w = Math.min(46, len * 0.36), h = w * 160 / 512;
    for (const sx of [-w * 0.35, w * 0.35]) addBox(g, [0.4, 4, 0.4], [x + sx, 15.6, z0 + 6], toon('#2a2240'));
    sign(text, col, false, w, [x, 17.6 + h / 2, z0 + 6], Math.PI);
  }
  // 柱の縦書き看板
  [['馬會', '#39f3ff'], ['金行', '#ffcf3f'], ['酒家', '#ff3fd0'], ['海鮮', '#46f0c6']].forEach(([text, col], i) => sign(text, col, true, 1.6, [-len / 2 + (i + 1) * len / 5, 8.4, z0 - 1.6], Math.PI));
}
