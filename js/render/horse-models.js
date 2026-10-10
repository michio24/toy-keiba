// 馬・車・電車などの出走キャラクターの3Dモデルと走行アニメーション
'use strict';

/* ============ HORSE MODELS ============ */
function part(parent, geo, mat, pos, scl, rot, ol = 0.07) {
  const m = new THREE.Mesh(geo, mat);
  if (pos) m.position.set(pos[0], pos[1], pos[2]);
  if (scl) m.scale.set(scl[0], scl[1], scl[2]);
  if (rot) m.rotation.set(rot[0], rot[1], rot[2]);
  m.castShadow = true; parent.add(m);
  if (ol) { const o = new THREE.Mesh(geo, OUT); o.scale.setScalar(1 + ol); m.add(o); }
  return m;
}
// 角を丸めた箱：分割した箱の頂点を、内側の箱から半径rの位置へ寄せる
function roundedBox(w, h, d, r) {
  const geo = new THREE.BoxGeometry(w, h, d, 6, 6, 6), pos = geo.attributes.position, nrm = geo.attributes.normal, v = new V3(), inner = new V3();
  for (let j = 0; j < pos.count; j++) {
    v.fromBufferAttribute(pos, j);
    inner.set(clamp(v.x, -w / 2 + r, w / 2 - r), clamp(v.y, -h / 2 + r, h / 2 - r), clamp(v.z, -d / 2 + r, d / 2 - r));
    // 法線も内側の箱からの向きで決め、面の継ぎ目に陰影の段差を出さない
    v.sub(inner).normalize(); nrm.setXYZ(j, v.x, v.y, v.z);
    v.multiplyScalar(r).add(inner); pos.setXYZ(j, v.x, v.y, v.z);
  }
  return geo;
}
function numberTex(i) {
  return ctex(128, 96, (g) => {
    g.fillStyle = WAKU[i][0]; g.fillRect(0, 0, 128, 96);
    g.strokeStyle = 'rgba(255,255,255,.9)'; g.lineWidth = 5; g.strokeRect(6, 6, 116, 84);
    g.font = '64px "Dela Gothic One", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.lineWidth = 6; g.strokeStyle = WAKU[i][1] === '#ffffff' ? 'rgba(0,0,0,.35)' : 'rgba(255,255,255,.6)'; g.strokeText(String(i + 1), 64, 52);
    g.fillStyle = WAKU[i][1]; g.fillText(String(i + 1), 64, 52);
  });
}
const NUMPL = keep(new THREE.PlaneGeometry(0.62, 0.44));
const ROCKER = keep(new THREE.TorusGeometry(2.0, 0.07, 8, 40, 1.24));
const POLE = keep(new THREE.CylinderGeometry(0.055, 0.055, 4.4, 12));
const STRIPE = keep(new THREE.TorusGeometry(0.075, 0.018, 6, 16));
const HCUP = keep(new THREE.SphereGeometry(1, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2.2));
const WOOD = keep(ctex(128, 128, (g) => { g.fillStyle = '#ffffff'; g.fillRect(0, 0, 128, 128); for (let y = 0; y < 128; y += 3) { g.strokeStyle = `rgba(120,60,20,${rand(0.04, 0.16)})`; g.lineWidth = rand(0.6, 1.8); g.beginPath(); for (let x = 0; x <= 128; x += 8) g.lineTo(x, y + Math.sin(x * 0.06 + y * 0.2) * 2); g.stroke(); } }, true));
function hoodTex(col, check) {
  return ctex(128, 128, (g) => {
    g.fillStyle = col; g.fillRect(0, 0, 128, 128);
    if (check) { g.fillStyle = '#ffffff'; for (let y = 0; y < 128; y += 16) for (let x = 0; x < 128; x += 16) if (((x + y) / 16) % 2) g.fillRect(x, y, 16, 16); }
    else { g.fillStyle = 'rgba(255,255,255,.85)'; for (let j = 0; j < 10; j++) { g.beginPath(); g.arc(rand(0, 128), rand(0, 128), rand(5, 9), 0, 7); g.fill(); } }
  });
}
const RAINBOW = ['#ff6b9d', '#ffb86b', '#ffe66b', '#7dffa8', '#6bc8ff', '#b58cff'];
// 側面の輪郭を押し出し、中心を原点に寄せる（輪郭線のシェルが部品の中心から広がるように）
function carSlab(parent, points, width, mat, ol = 0.025) {
  const shape = new THREE.Shape(points.map(p => new THREE.Vector2(p[0], p[1])));
  const bevel = 0.03, geo = new THREE.ExtrudeGeometry(shape, { depth: width - bevel * 2, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 2, curveSegments: 4 });
  geo.computeBoundingBox(); const c = geo.boundingBox.getCenter(new V3()); geo.translate(-c.x, -c.y, -c.z);
  return part(parent, geo, mat, [c.x, c.y, 0], null, null, ol);
}
// フォント読み込み後に描けるよう、初めて車を作るときに用意して使い回す
let TOFU = null;
const tofuTex = () => TOFU || (TOFU = keep(ctex(128, 48, (g) => {
  g.fillStyle = '#ffffff'; g.fillRect(0, 0, 128, 48);
  g.font = '34px "Dela Gothic One", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillStyle = '#202127'; g.fillText('とうふ', 64, 26);
})));
function buildCar(d, i) {
  const root = new THREE.Group(), bob = new THREE.Group(); root.add(bob);
  const body = new THREE.MeshStandardMaterial({ color: C(d.body), roughness: 0.3, metalness: 0.25 });
  const black = toon('#202127'), glass = new THREE.MeshStandardMaterial({ color: C('#294459'), roughness: 0.18, metalness: 0.5 });
  const H = { root, bob, wheels: [], legs: [], wings: [], glowMats: [body], hopY: 0, hop: 0, phase: 0, yaw: 0, drift: 0, glow: 0, glowCol: C(d.skill.color), def: d, kind: d.kind, scale: 1 };
  // Front is +X, matching the horses.
  // 低く長いノーズから傾斜したハッチへ続く、くさび形のハッチバック。下半分を黒で包んでパンダカラーにする
  carSlab(bob, [[-1.4, 0.3], [1.36, 0.3], [1.44, 0.48], [1.42, 0.66], [0.62, 0.86], [-1.3, 0.9], [-1.42, 0.8], [-1.44, 0.48]], 1.24, body);
  carSlab(bob, [[-1.42, 0.27], [1.38, 0.27], [1.47, 0.48], [1.46, 0.6], [-1.47, 0.6], [-1.47, 0.48]], 1.27, black, 0);
  // 窓まわりの温室部分：フロントガラスとハッチのガラスを一体の傾斜で作り、白い屋根を載せる
  carSlab(bob, [[0.64, 0.84], [-0.02, 1.28], [-0.76, 1.28], [-1.32, 0.88]], 1.08, glass, 0);
  part(bob, roundedBox(0.82, 0.07, 1.12, 0.03), body, [-0.39, 1.3, 0], null, null, 0.03);
  for (const side of [-1, 1]) {
    part(bob, BOX, black, [-0.2, 1.06, 0.545 * side], [0.07, 0.44, 0.02], null, 0);
    part(bob, roundedBox(0.1, 0.07, 0.1, 0.02), black, [0.55, 0.95, 0.66 * side], null, null, 0);
  }
  // 小ぶりなリトラクタブルライト：車体色のふたを起こし、前面のレンズだけを光らせる
  for (const side of [-1, 1]) {
    part(bob, roundedBox(0.18, 0.13, 0.34, 0.03), body, [1.17, 0.79, 0.38 * side], null, [0, 0, 0.12], 0.04);
    part(bob, BOX, glowMat('#fff4cc', 1.5), [1.26, 0.8, 0.38 * side], [0.015, 0.08, 0.26], [0, 0, 0.12], 0);
    part(bob, BOX, toon('#ffa726'), [1.48, 0.47, 0.47 * side], [0.02, 0.06, 0.16], null, 0);
  }
  part(bob, BOX, black, [1.455, 0.58, 0], [0.02, 0.035, 0.62], null, 0);
  // 横一文字の黒いテールパネルと赤いランプ
  part(bob, BOX, black, [-1.455, 0.71, 0], [0.025, 0.15, 1.14], null, 0);
  for (const side of [-1, 1]) part(bob, BOX, toon('#e54638'), [-1.47, 0.71, 0.33 * side], [0.02, 0.1, 0.4], null, 0);
  part(bob, BOX, toon('#f2f2ea'), [-1.49, 0.44, 0], [0.015, 0.1, 0.28], null, 0);
  const rim = new THREE.MeshStandardMaterial({ color: C('#d8dce1'), metalness: 0.8, roughness: 0.25 });
  const tireGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.2, 20);
  const rimGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.21, 12);
  const archGeo = new THREE.TorusGeometry(0.34, 0.035, 6, 16, Math.PI);
  const numMat = toon('#ffffff', { map: numberTex(i) }), tofuMat = toon('#ffffff', { map: tofuTex() });
  for (const side of [-1, 1]) {
    for (const x of [-0.88, 0.88]) {
      const wheel = new THREE.Group(); wheel.position.set(x, 0.31, 0.61 * side); bob.add(wheel);
      part(wheel, tireGeo, black, [0, 0, 0], null, [Math.PI / 2, 0, 0], 0);
      part(wheel, rimGeo, rim, [0, 0, 0.015 * side], null, [Math.PI / 2, 0, 0], 0);
      // 回転が見えるよう、ホイールに切り欠きを付ける
      part(wheel, BOX, toon('#8b9097'), [0, 0, 0.12 * side], [0.24, 0.035, 0.01], null, 0);
      H.wheels.push(wheel);
      part(bob, archGeo, black, [x, 0.31, 0.635 * side], null, null, 0);
    }
    const plate = new THREE.Mesh(NUMPL, numMat); plate.position.set(0, 0.75, 0.652 * side); plate.scale.setScalar(0.65); plate.rotation.y = side > 0 ? 0 : Math.PI; bob.add(plate);
    const tofu = new THREE.Mesh(NUMPL, tofuMat); tofu.position.set(-0.86, 0.76, 0.652 * side); tofu.scale.set(0.6, 0.32, 1); tofu.rotation.y = side > 0 ? 0 : Math.PI; bob.add(tofu);
  }
  H.eye = new THREE.Object3D(); H.eye.position.set(0.1, 1.22, 0); bob.add(H.eye);
  return H;
}
// 行先表示の「特急」は共通なので、フォント読み込み後に初めて電車を作るときに用意して使い回す
let EXPRESS = null;
const expressTex = () => EXPRESS || (EXPRESS = keep(ctex(128, 40, (g) => {
  g.fillStyle = '#121316'; g.fillRect(0, 0, 128, 40);
  g.font = '28px "Dela Gothic One", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillStyle = '#ff9a2e'; g.fillText('特急', 64, 22);
})));
function buildTrain(d, i) {
  const root = new THREE.Group(), bob = new THREE.Group(); root.add(bob);
  const body = new THREE.MeshStandardMaterial({ color: C(d.body), roughness: 0.22, metalness: 0.2, envMapIntensity: 1.2 });
  const ivory = toon(d.mane), silver = new THREE.MeshStandardMaterial({ color: C(d.muzzle), metalness: 0.75, roughness: 0.3 });
  const black = toon('#1b1c20'), gray = toon('#3a3d42'), glass = new THREE.MeshStandardMaterial({ color: C('#1d2a35'), roughness: 0.12, metalness: 0.55 });
  const H = { root, bob, wheels: [], legs: [], wings: [], glowMats: [body], hopY: 0, hop: 0, phase: Math.random() * 6, yaw: 0, drift: 0, glow: 0, glowCol: C(d.skill.color), def: d, kind: d.kind, scale: 1 };
  // Front is +X, matching the horses.
  // マルーンの車体にアイボリーの屋根を重ねる。1両編成なので両端に同じ運転台を付ける
  part(bob, roundedBox(3.2, 1.22, 1.2, 0.08), body, [0, 1.03, 0], null, null, 0.02);
  part(bob, roundedBox(3.18, 0.26, 1.18, 0.12), ivory, [0, 1.7, 0], null, null, 0.02);
  // 屋根上のクーラーとシングルアームのパンタグラフ
  for (const x of [-0.25, 0.75]) part(bob, roundedBox(0.55, 0.12, 0.62, 0.04), toon('#d8d4c8'), [x, 1.86, 0], null, null, 0.04);
  const panto = new THREE.Group(); panto.position.set(-1.0, 1.84, 0); panto.scale.set(1, 0.7, 1); bob.add(panto);
  part(panto, BOX, gray, [0, 0.03, 0], [0.34, 0.05, 0.42], null, 0);
  for (const s of [-1, 1]) part(panto, CONE, toon('#e8e8e8'), [0, 0.03, 0.22 * s], [0.035, 0.08, 0.035], [Math.PI, 0, 0], 0);
  part(panto, BOX, gray, [0.1, 0.18, 0], [0.03, 0.34, 0.03], [0, 0, -0.6], 0);
  part(panto, BOX, gray, [0.06, 0.38, 0], [0.03, 0.34, 0.03], [0, 0, 0.75], 0);
  part(panto, BOX, gray, [-0.06, 0.5, 0], [0.06, 0.03, 0.62], null, 0);
  // 側面：銀枠の窓と、窓付きの両開き扉が3か所
  const pane = (x, y, w, h, side) => {
    part(bob, BOX, silver, [x, y, 0.603 * side], [w + 0.04, h + 0.04, 0.01], null, 0);
    part(bob, BOX, glass, [x, y, 0.609 * side], [w, h, 0.01], null, 0);
  };
  const numMat = toon('#ffffff', { map: numberTex(i) });
  for (const side of [-1, 1]) {
    for (const x of [-0.95, 0, 0.95]) {
      for (const s of [-1, 1]) part(bob, BOX, black, [x + 0.17 * s, 0.98, 0.604 * side], [0.012, 1.0, 0.01], null, 0);
      part(bob, BOX, black, [x, 0.98, 0.604 * side], [0.008, 1.0, 0.01], null, 0);
      for (const s of [-1, 1]) pane(x + 0.085 * s, 1.27, 0.1, 0.36, side);
    }
    for (const x of [-0.475, 0.475]) pane(x, 1.29, 0.52, 0.4, side);
    for (const x of [-1.36, 1.36]) pane(x, 1.29, 0.2, 0.4, side);
    const plate = new THREE.Mesh(NUMPL, numMat); plate.position.set(-0.475, 0.78, 0.612 * side); plate.scale.setScalar(0.65); plate.rotation.y = side > 0 ? 0 : Math.PI; bob.add(plate);
  }
  // 前面：窓3枚と行先表示、窓下に車番と前照灯（後ろ側は尾灯）、銀色のスカート
  const carNo = toon('#ffffff', { map: ctex(128, 40, (g) => {
    g.fillStyle = d.body; g.fillRect(0, 0, 128, 40);
    g.font = '26px "Dela Gothic One", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillStyle = '#e9e2cf'; g.fillText('1' + String(i + 1).padStart(3, '0'), 64, 22);
  }) });
  const express = toon('#ffffff', { map: expressTex() });
  for (const end of [1, -1]) {
    const x = 1.6 * end, out = (dx) => x + dx * end, turn = [0, end > 0 ? Math.PI / 2 : -Math.PI / 2, 0];
    part(bob, BOX, black, [out(0.003), 1.33, 0], [0.01, 0.5, 1.06], null, 0);
    for (const [z, w, h] of [[0.33, 0.34, 0.42], [0, 0.24, 0.46], [-0.33, 0.34, 0.42]]) part(bob, BOX, glass, [out(0.01), 1.33, z], [0.01, h, w], null, 0);
    for (const z of [-0.165, 0.165]) part(bob, BOX, body, [out(0.012), 1.33, z], [0.012, 0.5, 0.06], null, 0);
    for (const z of [0.33, -0.33]) { const sign = new THREE.Mesh(NUMPL, express); sign.position.set(out(0.018), 1.49, z); sign.rotation.set(...turn); sign.scale.set(0.5, 0.22, 1); bob.add(sign); }
    const no = new THREE.Mesh(NUMPL, carNo); no.position.set(out(0.012), 0.98, 0.3 * end); no.rotation.set(...turn); no.scale.set(0.4, 0.2, 1); bob.add(no);
    for (const z of [-0.4, 0.4]) {
      part(bob, BOX, black, [out(0.006), 0.84, z], [0.01, 0.1, 0.26], null, 0);
      part(bob, BOX, end > 0 ? glowMat('#fff6dc', 1.6) : glowMat('#ff3b30', 1.3), [out(0.012), 0.84, z], [0.01, 0.06, 0.22], null, 0);
    }
    part(bob, roundedBox(0.16, 0.3, 1.12, 0.04), silver, [out(-0.05), 0.42, 0], null, null, 0.03);
    part(bob, BOX, black, [out(0.06), 0.42, 0], [0.12, 0.08, 0.12], null, 0);
  }
  // 床下の機器箱と台車。片側から見える車輪を回して走りを見せる
  part(bob, BOX, black, [0, 0.34, 0], [2.1, 0.16, 0.96], null, 0);
  const wheelGeo = new THREE.CylinderGeometry(0.19, 0.19, 0.08, 18);
  for (const bx of [-1.05, 1.05]) {
    part(bob, BOX, gray, [bx, 0.26, 0], [0.82, 0.12, 1.0], null, 0.03);
    for (const side of [-1, 1]) for (const wx of [-0.27, 0.27]) {
      const wheel = new THREE.Group(); wheel.position.set(bx + wx, 0.19, 0.5 * side); bob.add(wheel);
      part(wheel, wheelGeo, black, [0, 0, 0], null, [Math.PI / 2, 0, 0], 0);
      part(wheel, BOX, silver, [0, 0, 0.045 * side], [0.24, 0.04, 0.01], null, 0);
      H.wheels.push(wheel);
    }
  }
  H.eye = new THREE.Object3D(); H.eye.position.set(1.3, 1.35, 0); bob.add(H.eye);
  return H;
}
function buildHorse(d, i) {
  if (d.kind === 'car') return buildCar(d, i);
  if (d.kind === 'train') return buildTrain(d, i);
  const root = new THREE.Group(), bob = new THREE.Group(); root.add(bob);
  const k = d.kind, L = d.look || {}; const H = { root, bob, legs: [], wings: [], glowMats: [], hopY: 0, hop: 0, phase: Math.random() * 6, yaw: 0, glow: 0, glowCol: C(d.skill.color), def: d, kind: k };
  let body;
  if (k === 'mech') body = new THREE.MeshStandardMaterial({ color: C('#56607e'), metalness: 0.85, roughness: 0.3, envMapIntensity: 1.2 });
  else if (k === 'gold') body = new THREE.MeshStandardMaterial({ color: C('#ffc42e'), metalness: 1, roughness: 0.22, emissive: C('#6b4300'), emissiveIntensity: 0.4, envMapIntensity: 1.5 });
  else if (k === 'zebra') body = toon('#ffffff', { map: ZEBRA });
  else if (k === 'tin') body = new THREE.MeshStandardMaterial({ color: C(d.body), metalness: 0.55, roughness: 0.32, envMapIntensity: 1.3 });
  else if (k === 'rocking') body = toon(d.body, { map: WOOD });
  else if (k === 'choco') body = new THREE.MeshStandardMaterial({ color: C(d.body), metalness: 0.05, roughness: 0.28, envMapIntensity: 1.1 });
  else if (k === 'bullet') body = new THREE.MeshStandardMaterial({ color: C(d.body), metalness: 1, roughness: 0.12, envMapIntensity: 1.8 });
  else if (L.dapple) {
    // 地色に白っぽい差し毛の斑を散らし、黒毛の中でも「騅」らしい毛色にする
    const coat = ctex(128, 128, (g) => {
      g.fillStyle = d.body; g.fillRect(0, 0, 128, 128);
      for (let j = 0; j < 60; j++) {
        const x = rand(0, 128), y = rand(14, 114), r = rand(2.5, 5.5);
        const grad = g.createRadialGradient(x, y, 0, x, y, r);
        grad.addColorStop(0, L.dapple); grad.addColorStop(1, d.body);
        g.fillStyle = grad; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
      }
    });
    body = new THREE.MeshStandardMaterial({ color: C('#ffffff'), map: coat, roughness: 0.48, metalness: 0.03, envMapIntensity: 0.65 });
  }
  // glossは手入れの行き届いた毛艶：映り込みを強めて黒い馬体の立体感を出す
  else body = new THREE.MeshStandardMaterial({ color: C(d.body), roughness: L.gloss ? 0.36 : 0.48, metalness: 0.03, envMapIntensity: L.gloss ? 0.9 : 0.65 });
  const mane = k === 'mech' ? glowMat('#39f3ff', 2.6) : k === 'choco' ? new THREE.MeshStandardMaterial({ color: C(d.mane), roughness: 0.3, metalness: 0.05 }) : k === 'bullet' ? new THREE.MeshStandardMaterial({ color: C(d.mane), metalness: 0.6, roughness: 0.2, emissive: C('#9fc4ff'), emissiveIntensity: 0.25 }) : toon(d.mane);
  const muzzle = (k === 'mech' || k === 'gold' || k === 'bullet') ? body : k === 'choco' ? new THREE.MeshStandardMaterial({ color: C(d.muzzle), roughness: 0.3 }) : toon(d.muzzle);
  const hoof = toon(k === 'gold' || k === 'carousel' ? '#ffd76b' : k === 'tin' ? '#2b2d3a' : '#3b2a33');
  H.glowMats.push(body); if (mane.isMeshToonMaterial) H.glowMats.push(mane);
  H.baseEm = body.emissive ? body.emissive.clone() : C('#000');
  H.baseEmI = body.emissiveIntensity || 1;

  const shape = k === 'cardboard' ? BOX : SPH;
  const shapeScale = k === 'cardboard' ? 1.65 : 1;
  part(bob, shape, body, [0, 1.08, 0], [0.95 * shapeScale, 0.46 * shapeScale, 0.44 * (L.barrel || 1) * shapeScale]);
  part(bob, shape, body, [0.42, 1.14, 0], [0.46 * shapeScale, 0.46 * (L.chest || 1) * shapeScale, 0.42 * (L.chest || 1) * shapeScale]);
  part(bob, shape, body, [0.64, 1.52, 0], [0.24 * shapeScale, 0.44 * shapeScale, 0.24 * shapeScale], [0, 0, -0.55]);
  const head = new THREE.Group(); head.position.set(0.95, 1.9, 0); bob.add(head); H.head = head;
  part(head, shape, body, [0, 0, 0], [0.44 * shapeScale, 0.4 * shapeScale, 0.38 * shapeScale]);
  part(head, shape, muzzle, [0.33, -0.13, 0], [0.3 * shapeScale, 0.24 * shapeScale, 0.27 * shapeScale]);
  const dark = new THREE.MeshBasicMaterial({ color: C('#2a1428') });
  const nostrilSize = L.nostrilSize || 1;
  for (const s of [1, -1]) part(head, SPH_LO, dark, [0.6, -0.1, 0.1 * s], [0.03 * nostrilSize, 0.045 * nostrilSize, 0.035 * nostrilSize], null, 0);
  if (k === 'mech') {
    part(head, BOX, glowMat('#39f3ff', 3), [0.2, 0.08, 0], [0.12, 0.09, 0.7], null, 0);
  } else {
    const eye = new THREE.MeshBasicMaterial({ color: C('#1e0f2e') }), hi = new THREE.MeshBasicMaterial({ color: C('#ffffff') });
    const blush = new THREE.MeshBasicMaterial({ color: C('#ff7fa8'), transparent: true, opacity: 0.55, depthWrite: false });
    for (const s of [1, -1]) {
      part(head, SPH, eye, [0.17, 0.08, 0.305 * s], [0.085, 0.125, 0.06], [0, -0.35 * s, 0], 0);
      part(head, SPH_LO, hi, [0.21, 0.135, 0.338 * s], [0.03, 0.036, 0.02], null, 0);
      part(head, SPH_LO, hi, [0.15, 0.035, 0.345 * s], [0.016, 0.018, 0.012], null, 0);
      const b = new THREE.Mesh(CIRC, blush); b.scale.setScalar(0.075); b.position.set(0.28, -0.08, 0.318 * s); b.rotation.y = s > 0 ? 0.35 : Math.PI - 0.35; head.add(b);
    }
  }
  const hoodMat = L.hood ? (L.hoodTrim ? toon(L.hood, { side: THREE.DoubleSide }) : toon('#ffffff', { map: hoodTex(L.hood, L.check), side: THREE.DoubleSide })) : null;
  if (hoodMat) {
    part(head, SPH, hoodMat, [-0.13, 0.14, 0], [0.36, 0.32, 0.39], null, 0.05);
    if (L.hoodTrim) {
      // A plain racing hood leaves the eyes uncovered; the padded version extends down the nose.
      const vertices = [], indices = [];
      for (let row = 0; row <= 8; row++) {
        const y = L.noseband ? 0.34 - row / 8 * 0.44 : 0.12 + row / 8 * 0.22;
        const halfWidth = L.noseband && y < 0.12 ? 0.095 : Math.min(0.23, 0.38 * Math.sqrt(1 - (y / 0.4) ** 2) * 0.9);
        for (let col = 0; col <= 12; col++) {
          const z = (col / 12 * 2 - 1) * halfWidth;
          const headX = 0.44 * Math.sqrt(Math.max(0, 1 - (y / 0.4) ** 2 - (z / 0.38) ** 2));
          const muzzleX = L.noseband && Math.abs(y + 0.13) < 0.24 ? 0.33 + 0.3 * Math.sqrt(Math.max(0, 1 - ((y + 0.13) / 0.24) ** 2 - (z / 0.27) ** 2)) : 0;
          vertices.push(Math.max(headX, muzzleX) + 0.012, y, z);
          if (row < 8 && col < 12) { const a = row * 13 + col; indices.push(a, a + 1, a + 13, a + 1, a + 14, a + 13); }
        }
      }
      const forehead = new THREE.BufferGeometry();
      forehead.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3)); forehead.setIndex(indices); forehead.computeVertexNormals();
      part(head, forehead, hoodMat, null, null, null, 0);
    } else for (const s of [1, -1]) {
      part(head, HCUP, hoodMat, [0.1, 0.08, 0.3 * s], [0.16, 0.12, 0.16], [s > 0 ? Math.PI / 2 : -Math.PI / 2, 0, 0], 0.08);
    }
  }
  const white = toon('#ffffff');
  if (L.noseband || L.shadowRoll) {
    // A soft continuous band follows the muzzle, without detailed straps or hardware.
    const points = [];
    for (let j = 0; j <= 16; j++) {
      const z = (j / 16 * 2 - 1) * 0.25;
      const headX = 0.44 * Math.sqrt(Math.max(0, 1 - (0.02 / 0.4) ** 2 - (z / 0.38) ** 2));
      const muzzleX = 0.33 + 0.3 * Math.sqrt(Math.max(0, 1 - (0.15 / 0.24) ** 2 - (z / 0.27) ** 2));
      points.push(new V3(Math.max(headX, muzzleX) + 0.025, 0.02, z));
    }
    if (L.shadowRoll) {
      // シャドーロール：ボアの鼻革を小さな毛玉の連なりで表し、遠目にも白くふくらんで見せる
      points.forEach((p, j) => part(head, SPH_LO, white, [p.x + 0.03, p.y + (j % 2) * 0.02, p.z * 1.12], [0.075, 0.085, 0.075], null, j % 4 ? 0 : 0.06));
    } else part(head, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 24, 0.055, 8, false), white, null, null, null, 0);
  }
  // Follow the exposed head/muzzle surface so facial markings do not sink into the mesh.
  const faceMark = (y, width, height) => {
    const headX = 0.44 * Math.sqrt(Math.max(0, 1 - (y / 0.4) ** 2)) + (L.hoodTrim && y >= 0.12 ? 0.014 : 0);
    const muzzleX = 0.33 + 0.3 * Math.sqrt(Math.max(0, 1 - ((y + 0.13) / 0.24) ** 2));
    const x = Math.abs(y + 0.13) < 0.24 ? Math.max(headX, muzzleX) : headX;
    part(head, SPH, white, [x + 0.005, y, 0], [0.018, height, width], null, 0);
  };
  if (L.blaze || L.stripe) {
    const width = L.blazeWidth || (L.stripe ? 0.03 : 0.065);
    // blazeTaperが負なら鼻先へ向かって太くなり、blazeLengthで鼻先まで伸ばせる
    for (let j = 0, n = L.blazeLength || 13; j < n; j++) faceMark(0.29 - j * 0.035, width * (1 - j * (L.blazeTaper ?? 0.025)), 0.042);
  }
  if (L.star) faceMark(0.24, 0.065, 0.075);
  if (L.snip) faceMark(-0.1, 0.065, 0.045);
  if (L.tiara) {
    const gm = new THREE.MeshStandardMaterial({ color: C('#ffe08a'), metalness: 1, roughness: 0.2, emissive: C('#ff9ad5'), emissiveIntensity: 0.35 });
    part(head, new THREE.TorusGeometry(0.16, 0.035, 8, 28), gm, [0.02, 0.47, 0], null, [Math.PI / 2, 0, 0], 0.08);
    for (let j = 0; j < 5; j++) { const a = -Math.PI / 2 + j * Math.PI / 4; part(head, CONE, gm, [0.02 + Math.cos(a + Math.PI / 2) * 0.16, 0.57, Math.sin(a + Math.PI / 2) * 0.16], [0.035, 0.18 - Math.abs(j - 2) * 0.03, 0.035], null, 0.1); }
    part(head, SPH_LO, glowMat('#ff7ad0', 2.6), [0.18, 0.49, 0], [0.05, 0.05, 0.05], null, 0);
  }
  if (L.crown) {
    const gm = new THREE.MeshStandardMaterial({ color: C('#ffd24a'), metalness: 1, roughness: 0.18, emissive: C('#7a4a00'), emissiveIntensity: 0.35, envMapIntensity: 1.6 });
    part(head, new THREE.CylinderGeometry(0.2, 0.18, 0.12, 20, 1, true), gm, [0.0, 0.46, 0], null, null, 0.06);
    for (let j = 0; j < 6; j++) { const a = j / 6 * Math.PI * 2; part(head, CONE, gm, [Math.cos(a) * 0.19, 0.6, Math.sin(a) * 0.19], [0.05, 0.17, 0.05], null, 0.1); part(head, SPH_LO, gm, [Math.cos(a) * 0.19, 0.7, Math.sin(a) * 0.19], [0.03, 0.03, 0.03], null, 0); }
    const jw = ['#ff3355', '#3aa0ff', '#3fe08a'];
    for (let j = 0; j < 3; j++) { const a = (j - 1) * 0.7; part(head, SPH_LO, glowMat(jw[j], 2.2), [Math.cos(a) * 0.2, 0.46, Math.sin(a) * 0.2], [0.035, 0.035, 0.035], null, 0); }
  }
  const pinkIn = toon(k === 'mech' ? '#39f3ff' : '#ffb3cc');
  for (const s of [1, -1]) {
    part(head, CONE, hoodMat || body, [-0.06, 0.38, 0.17 * s], [0.1, 0.28, 0.1], [0.25 * s, 0, 0.15]);
    part(head, CONE, L.hoodTrim ? hoodMat : pinkIn, [-0.03, 0.36, 0.175 * s], [0.055, 0.18, 0.05], [0.25 * s, 0, 0.15], 0);
  }
  const fore = L.forelock || (k === 'pony' ? 1.5 : 1);
  // 段ボール馬は、たてがみと尻尾もギザギザに切った板で作る
  const cutout = k === 'cardboard';
  if (cutout) {
    for (const [x, y, s] of [[0.12, 0.38, 0.16], [-0.05, 0.4, 0.14]]) part(head, BOX, mane, [x, y, 0], [s, s, 0.05], [0, 0, Math.PI / 4]);
  } else if (k !== 'sushi') {
  part(head, SPH, mane, [0.1, 0.36, 0], [0.14 * fore, 0.11 * fore, 0.15 * fore]);
  part(head, SPH, mane, [0.02, 0.4, 0.08], [0.1 * fore, 0.09 * fore, 0.1 * fore]);
  part(head, SPH, mane, [0.02, 0.4, -0.08], [0.1 * fore, 0.09 * fore, 0.1 * fore]);
  }
  for (let j = 0; j < 6; j++) {
    const t = j / 5; const m = k === 'unicorn' ? toon(RAINBOW[j]) : mane; const r = 0.15 - t * 0.04;
    if (cutout) part(bob, BOX, m, [0.71 - t * 0.5, 2.17 - t * 0.66, 0], [r * 1.5, r * 1.5, 0.06], [0, 0, Math.PI / 4]);
    else part(bob, SPH, m, [0.8 - t * 0.5, 2.12 - t * 0.66, 0], [r, r * 1.1, r * 0.85]);
  }
  if (k === 'unicorn') {
    const horn = new THREE.MeshStandardMaterial({ color: C('#ffe27a'), metalness: 0.6, roughness: 0.25, emissive: C('#ffcf3f'), emissiveIntensity: 0.8 });
    part(head, CONE, horn, [0.14, 0.52, 0], [0.07, 0.5, 0.07], [0, 0, -0.4]);
  }
  const tail = new THREE.Group(); tail.position.set(-0.9, 1.28, 0); bob.add(tail); H.tail = tail;
  const tf = k === 'pony' ? 1.25 : 1;
  [[-0.08, 0.02, 0.15], [-0.22, -0.1, 0.14], [-0.33, -0.28, 0.13], [-0.38, -0.48, 0.11]].forEach((q, j) => {
    if (cutout) part(tail, BOX, mane, [q[0], q[1], 0], [q[2] * 1.5, q[2] * 1.5, 0.06], [0, 0, Math.PI / 4]);
    else part(tail, SPH, k === 'unicorn' ? toon(RAINBOW[j + 1]) : mane, [q[0], q[1], 0], [q[2] * tf, q[2] * tf, q[2] * tf]);
  });
  const lowerLeg = L.legColor ? toon(L.legColor) : null;
  const sockMat = L.sockColor ? toon(L.sockColor) : white;
  // Leg indices: front left, front right, hind left, hind right (+Z is the horse's left).
  const legPos = [[0.5, 0.22], [0.5, -0.22], [-0.52, 0.22], [-0.52, -0.22]];
  legPos.forEach((lp, li) => {
    const pv = new THREE.Group(); pv.position.set(lp[0], 0.9, lp[1]); bob.add(pv);
    part(pv, k === 'cardboard' ? BOX : LEG, body, [0, -0.36, 0], k === 'cardboard' ? [0.22, 0.72, 0.22] : null);
    if (k !== 'rocking') part(pv, HOOF, hoof, [0, -0.8, 0]);
    if (lowerLeg) part(pv, LEG, lowerLeg, [0, -0.55, 0], [1.015, 0.47, 1.015], null, 0);
    if (L.socks && L.socks.includes(li)) {
      const height = L.sockHeights?.[li] || 0.24;
      part(pv, LEG, sockMat, [0, -0.72 + height / 2, 0], [1.04, height / 0.72, 1.04], null, 0);
      if (L.wrapBands) {
        const band = toon(L.wrapBands);
        for (let j = 0; j < 2; j++) part(pv, LEG, band, [0, -0.72 + height - 0.035 - j * 0.045, 0], [1.06, 0.02 / 0.72, 1.06], null, 0);
      }
    }
    if (k === 'rocking') pv.rotation.z = lp[0] > 0 ? 0.32 : -0.32;
    if (k === 'carousel') pv.rotation.z = lp[0] > 0 ? 1.0 : -0.35;
    if (k === 'banei') part(pv, SPH, white, [0, -0.68, 0], [0.18, 0.13, 0.18]);
    if (k === 'mech') part(pv, BOX, glowMat('#39f3ff', 2.4), [0.12, -0.4, 0], [0.02, 0.5, 0.05], null, 0);
    H.legs.push(pv);
  });
  const cloth = new THREE.MeshStandardMaterial({ color: C(WAKU[i][0]), roughness: 0.65, metalness: 0 });
  part(bob, BOX, cloth, [-0.05, 1.54, 0], [0.64, 0.06, 0.52], null, 0.04);
  const numMat = toon('#ffffff', { map: numberTex(i) });
  // Clear both the barrel and shoulder, including their 7% outline shells.
  const numberOffset = k === 'bath' ? 0.91 : Math.max(0.44 * (L.barrel || 1), 0.42 * (L.chest || 1)) * 1.07 + 0.015;
  for (const s of [1, -1]) {
    const pl = new THREE.Mesh(NUMPL, numMat); pl.position.set(-0.05, 1.22, numberOffset * s); pl.rotation.y = s > 0 ? 0 : Math.PI; bob.add(pl);
  }
  // 鞍：平たい楕円だけだと上から穴に見えるため、前橋と後橋で座面のくぼみを縁取る
  const leather = toon('#5b3326'), leatherRim = toon('#8c5636');
  part(bob, SPH, leather, [0.03, 1.585, 0], [0.3, 0.07, 0.25]);
  part(bob, SPH, leatherRim, [-0.21, 1.63, 0], [0.075, 0.075, 0.22], [0, 0, 0.35], 0.05);
  part(bob, SPH, leatherRim, [0.26, 1.63, 0], [0.06, 0.065, 0.14], null, 0.05);
  if (L.tassels) {
    // 厚総：胸がいと尻がいに大きな房を連ね、傾奇者らしい華やかな馬具にする
    const cord = toon(L.tassels.cord), fringe = L.tassels.colors.map(c => toon(c));
    const strap = (cx, rx, rz, from, to, y, n) => {
      const points = [];
      for (let j = 0; j <= 16; j++) { const a = from + (to - from) * j / 16; points.push(new V3(cx + Math.cos(a) * rx, y, Math.sin(a) * rz)); }
      part(bob, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 32, 0.035, 6, false), cord, null, null, null, 0.06);
      for (let j = 0; j < n; j++) {
        const a = from + (to - from) * (j + 0.5) / n, x = cx + Math.cos(a) * rx * 1.03, z = Math.sin(a) * rz * 1.03;
        part(bob, SPH_LO, cord, [x, y - 0.03, z], [0.04, 0.04, 0.04], null, 0);
        part(bob, CONE, fringe[j % fringe.length], [x, y - 0.13, z], [0.075, 0.2, 0.075], null, 0.06);
      }
    };
    strap(0.42, 0.49, 0.45 * (L.chest || 1), -1.25, 1.25, 1.2, 5);
    strap(0, 0.99, 0.47 * (L.barrel || 1), Math.PI - 1.05, Math.PI + 1.05, 1.22, 5);
  }
  if (L.backpack) {
    // 背中に立てた角丸の箱型リュック。後方カメラから見えるよう、ポケットは後ろ向きにする
    const pack = new THREE.Group(); pack.position.set(-0.12, 1.86, 0); pack.rotation.z = 0.1; pack.scale.setScalar(1.18); bob.add(pack);
    // 本体と雨ぶたは地色、ポケットは差し色、ベルト類は濃い色のテープでまとめる
    const fabric = toon(L.backpack.body), accent = toon(L.backpack.accent), webbing = toon(L.backpack.stripe), zipper = toon('#f5e5b7');
    const bag = roundedBox(0.36, 0.46, 0.46, 0.1);
    part(pack, bag, fabric, [0, 0, 0], null, null, 0.04);
    // 本体を薄く広げた帯で、角丸の側面にぴったり沿うラインを入れる
    part(pack, bag, webbing, [0, 0.03, 0], [1.03, 0.13, 1.03], null, 0);
    // 雨ぶたと、後ろへ垂らしたベルト・バックル
    part(pack, roundedBox(0.39, 0.12, 0.49, 0.05), fabric, [0, 0.2, 0], null, null, 0.04);
    part(pack, roundedBox(0.05, 0.2, 0.09, 0.02), webbing, [-0.19, 0.1, 0], null, null, 0.04);
    part(pack, BOX, zipper, [-0.218, 0.02, 0], [0.015, 0.045, 0.11], null, 0);
    part(pack, new THREE.TorusGeometry(0.07, 0.02, 6, 18, Math.PI), webbing, [0.04, 0.26, 0], null, [0, Math.PI / 2, 0], 0.08);
    // 後ろ向きのフロントポケットとファスナー
    part(pack, roundedBox(0.12, 0.2, 0.34, 0.05), accent, [-0.2, -0.1, 0], null, null, 0.04);
    part(pack, BOX, zipper, [-0.262, -0.03, 0], [0.012, 0.016, 0.28], null, 0);
    part(pack, BOX, zipper, [-0.266, -0.065, 0.11], [0.012, 0.06, 0.03], null, 0);
    for (const s of [-1, 1]) {
      part(pack, roundedBox(0.2, 0.2, 0.08, 0.035), fabric, [0, -0.08, 0.24 * s], null, null, 0.04);
      // 前面の肩ベルト
      part(pack, roundedBox(0.035, 0.38, 0.07, 0.015), webbing, [0.188, -0.01, 0.13 * s], null, null, 0);
    }
    // 胴に回したベルトは、ゼッケンの下へ潜り込ませて固定しているように見せる
    const barrel = [0, 1.08, 0, 0.95, 0.46, 0.44 * (L.barrel || 1)], chest = [0.42, 1.14, 0, 0.46, 0.46 * (L.chest || 1), 0.42 * (L.chest || 1)];
    const inside = (x, y, z) => [barrel, chest].some(e => ((x - e[0]) / e[3]) ** 2 + ((y - e[1]) / e[4]) ** 2 + ((z - e[2]) / e[5]) ** 2 < 1);
    for (const x of [0.02, -0.26]) {
      const points = [];
      for (let j = 0; j <= 18; j++) {
        const a = (j / 18 * 2 - 1) * 1.45; let t = 0;
        while (t < 1 && inside(x, 1.1 + Math.cos(a) * t, Math.sin(a) * t)) t += 0.005;
        points.push(new V3(x, 1.1 + Math.cos(a) * (t + 0.02), Math.sin(a) * (t + 0.02)));
      }
      part(bob, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 36, 0.03, 6, false), webbing, null, null, null, 0);
    }
  }
  if (k === 'pegasus') {
    for (const s of [1, -1]) {
      const wg = new THREE.Group(); wg.position.set(0.1, 1.55, 0.34 * s); bob.add(wg);
      for (let j = 0; j < 3; j++) part(wg, SPH, white, [-j * 0.11, j * 0.02, 0.3 * s], [0.13 - j * 0.015, 0.05, 0.34 - j * 0.05], [0, -s * j * 0.35, 0], 0.08);
      H.wings.push({ g: wg, s });
    }
  }
  if (k === 'mech') {
    for (const s of [1, -1]) { part(bob, BOX, glowMat('#39f3ff', 3), [0, 1.02, 0.44 * s], [1.3, 0.035, 0.02], null, 0); part(bob, BOX, glowMat('#ff4fd8', 3), [0.05, 0.9, 0.42 * s], [0.9, 0.025, 0.02], null, 0); }
  }
  if (k === 'rocking') {
    const rk = toon('#b5552e');
    for (const s of [1, -1]) {
      const m = part(bob, ROCKER, rk, [0, 2.04, 0.24 * s], null, [0, 0, -Math.PI / 2 - 0.62], 0.05);
    }
    for (const x of [-0.95, 0.95]) part(bob, BOX, rk, [x, 0.33, 0], [0.08, 0.06, 0.56], null, 0.05);
    const flower = toon('#ff6f91');
    for (const s of [1, -1]) for (const [x, y] of [[0.1, 1.05], [-0.4, 1.12]]) part(bob, SPH_LO, flower, [x, y, 0.43 * s], [0.07, 0.07, 0.03], null, 0);
  }
  if (k === 'carousel') {
    const gm = new THREE.MeshStandardMaterial({ color: C('#ffd46b'), metalness: 1, roughness: 0.18, envMapIntensity: 1.6 });
    part(bob, POLE, gm, [0.05, 1.6, 0], null, null, 0);
    part(bob, SPH, gm, [0.05, 3.9, 0], [0.12, 0.12, 0.12], null, 0);
    part(bob, SPH, gm, [0.05, -0.55, 0], [0.12, 0.12, 0.12], null, 0);
    const stripe = toon('#ff8ec7');
    for (let j = 0; j < 7; j++) part(bob, STRIPE, stripe, [0.05, 2.1 + j * 0.25, 0], [1, 1, 1], [Math.PI / 2 - 0.35, 0, 0], 0);
    part(H.head, SPH_LO, glowMat('#6be3ff', 2.4), [0.34, 0.24, 0], [0.055, 0.055, 0.055], null, 0);
    for (const s of [1, -1]) part(bob, new THREE.TorusGeometry(0.34, 0.03, 8, 30, Math.PI), gm, [-0.02, 1.2, 0.44 * s], [1, 0.6, 1], [0, 0, Math.PI], 0);
  }
  if (k === 'choco') {
    const dark = new THREE.MeshStandardMaterial({ color: C('#241008'), roughness: 0.35 }), milk = new THREE.MeshStandardMaterial({ color: C('#f1e2c8'), roughness: 0.4 });
    const up = new V3(0, 1, 0);
    const sprinkle = (parent, c, r, n, minY) => {
      for (let j = 0; j < n; j++) {
        const th = Math.random() * Math.PI * 2, cy = rand(minY, 1), sy = Math.sqrt(1 - cy * cy);
        const nrm = new V3(sy * Math.cos(th) / r[0], cy / r[1], sy * Math.sin(th) / r[2]).normalize();
        const m = new THREE.Mesh(CONE, j % 3 === 0 ? milk : dark); m.position.set(c[0] + sy * Math.cos(th) * r[0], c[1] + cy * r[1], c[2] + sy * Math.sin(th) * r[2]);
        m.quaternion.setFromUnitVectors(up, nrm); m.scale.set(0.08, 0.1, 0.08); m.castShadow = true; parent.add(m);
      }
    };
    sprinkle(bob, [0, 1.08, 0], [0.95, 0.46, 0.44], 46, -0.35);
    sprinkle(bob, [0.42, 1.14, 0], [0.46, 0.46, 0.42], 10, -0.2);
    sprinkle(H.head, [0, 0, 0], [0.44, 0.4, 0.38], 9, 0.15);
  }
  if (k === 'bullet') {
    const bl = glowMat('#9fd0ff', 2.6);
    for (const s of [1, -1]) { part(bob, BOX, bl, [0.1, 1.12, 0.445 * s], [1.2, 0.04, 0.02], [0, 0, -0.08], 0); part(bob, BOX, bl, [-0.1, 0.98, 0.43 * s], [0.8, 0.025, 0.02], [0, 0, -0.08], 0); }
    const vis = new THREE.MeshStandardMaterial({ color: C('#1b2a4a'), metalness: 0.9, roughness: 0.05, emissive: C('#3a6fd0'), emissiveIntensity: 0.4 });
    part(H.head, SPH, vis, [0.19, 0.1, 0], [0.18, 0.1, 0.36], [0, 0, -0.15], 0.06);
  }
  if (k === 'tin') {
    const km = new THREE.MeshStandardMaterial({ color: C('#e9c46a'), metalness: 1, roughness: 0.25, envMapIntensity: 1.5 });
    const key = new THREE.Group(); key.position.set(-0.66, 1.2, 0.3); bob.add(key); H.key = key;
    part(key, new THREE.CylinderGeometry(0.035, 0.035, 0.34, 8), km, [0, 0, 0.14], null, [Math.PI / 2, 0, 0], 0);
    for (const s of [1, -1]) part(key, new THREE.TorusGeometry(0.12, 0.035, 8, 20), km, [0.14 * s, 0, 0.31], null, null, 0.06);
    const st = toon('#f7f1e3');
    for (const x of [-0.45, 0.05]) part(bob, new THREE.CylinderGeometry(0.45, 0.45, 0.07, 24), st, [x, 1.1, 0], [1, 1, 1], [0, 0, Math.PI / 2], 0);
    for (const s of [1, -1]) for (let j = 0; j < 4; j++) part(bob, SPH_LO, km, [-0.6 + j * 0.35, 0.88, 0.4 * s], [0.035, 0.035, 0.035], null, 0);
  }
  if (L.legLength != null) {
    // Lower the whole body by the shortened leg span to keep the hooves grounded.
    const length = L.legLength;
    H.legs.forEach(leg => { leg.scale.y = length; });
    bob.children.forEach(child => { child.position.y -= 0.88 * (1 - length); });
  }
  if (k === 'segway' || k === 'hopping') {
    // Rear hooves rest on the deck; the raised front hooves meet the handlebar.
    const rider = new THREE.Group();
    [...bob.children].forEach(child => rider.add(child));
    rider.position.set(0.2, 0.96, 0); rider.rotation.z = 0.65; bob.add(rider); H.rider = rider;
    const mint = toon('#72e6be'), rubber = toon('#252b32');
    const metal = new THREE.MeshStandardMaterial({ color: C('#dce7e4'), metalness: 0.7, roughness: 0.3 });
    H.glowMats.push(mint); H.wheels = [];
    part(bob, BOX, mint, [-0.27, 0.68, 0], [0.9, 0.16, 0.85]);
    part(bob, BOX, rubber, [-0.27, 0.77, 0], [0.75, 0.025, 0.72], null, 0);
    part(bob, BOX, metal, [0.54, 1.035, 0], [0.065, 0.62, 0.065]);
    part(bob, BOX, rubber, [0.54, 1.34, 0], [0.11, 0.1, 0.7]);
    part(bob, BOX, mint, [0.54, 1.2, 0], [0.12, 0.16, 0.18]);
    if (k === 'hopping') {
      const hopper = new THREE.Group(); [...bob.children].forEach(child => hopper.add(child)); bob.add(hopper); H.hopper = hopper;
      const spring = new THREE.Group(); spring.position.set(-0.27, 0.08, 0); bob.add(spring); H.spring = spring;
      const points = [];
      for (let j = 0; j <= 96; j++) { const a = j / 96 * Math.PI * 12; points.push(new V3(Math.cos(a) * 0.14, j / 96 * 0.48, Math.sin(a) * 0.14)); }
      part(spring, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 96, 0.028, 6, false), metal, [0, 0, 0], null, null, 0);
      part(bob, BOX, rubber, [-0.27, 0.06, 0], [0.42, 0.12, 0.42]);
      part(hopper, BOX, mint, [-0.27, 0.58, 0], [0.12, 0.2, 0.12]);
    } else {
    const tireGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.22, 20);
    const rimGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.235, 12);
    for (const s of [1, -1]) {
      const wheel = new THREE.Group(); wheel.position.set(-0.27, 0.4, 0.56 * s); bob.add(wheel);
      part(wheel, tireGeo, rubber, [0, 0, 0], null, [Math.PI / 2, 0, 0], 0);
      part(wheel, rimGeo, metal, [0, 0, 0], null, [Math.PI / 2, 0, 0], 0);
      // Visible spokes make wheel rotation readable from either side.
      part(wheel, BOX, mint, [0, 0, 0.125 * s], [0.42, 0.055, 0.025], null, 0);
      part(wheel, BOX, mint, [0, 0, 0.125 * s], [0.055, 0.42, 0.025], null, 0);
      H.wheels.push(wheel);
    }
    }
  }
  addNoveltyParts(H);
  const sc = L.size || (k === 'pony' ? 0.82 : k === 'banei' ? 1.2 : k === 'tin' ? 0.9 : 1);
  bob.scale.set(sc, sc, k === 'banei' ? sc * 1.08 : sc);
  H.scale = sc;
  const eyeAnchor = new THREE.Object3D(); eyeAnchor.position.set(0.3, 0.42, 0); head.add(eyeAnchor); H.eye = eyeAnchor;
  root.traverse(o => { if (o.isMesh && o.material !== OUT) o.castShadow = true; });
  return H;
}
function addNoveltyParts(H) {
  const { bob, head, kind: k } = H;
  if (k === 'roller') {
    H.wheels = [];
    const boot = toon('#936fff'), tire = toon('#263348'), rim = toon('#ffbbd8'); H.glowMats.push(boot);
    const geo = new THREE.CylinderGeometry(0.1, 0.1, 0.065, 12);
    for (const leg of H.legs) {
      part(leg, BOX, boot, [0.02, -0.78, 0], [0.38, 0.18, 0.26]);
      for (const x of [-0.1, 0.14]) for (const s of [-1, 1]) {
        const wheel = new THREE.Group(); wheel.position.set(x, -0.91, 0.15 * s); leg.add(wheel);
        part(wheel, geo, tire, [0, 0, 0], null, [Math.PI / 2, 0, 0], 0);
        part(wheel, BOX, rim, [0, 0, 0.04 * s], [0.15, 0.03, 0.015], null, 0); H.wheels.push(wheel);
      }
    }
    bob.children.forEach(child => { child.position.y += 0.12; });
  }
  if (k === 'bath') {
    const duck = new THREE.Group(); duck.position.set(0, 1.0, 0); bob.add(duck); H.floatRing = duck;
    const yellow = toon('#ffdb49'); H.glowMats.push(yellow);
    part(duck, new THREE.TorusGeometry(0.67, 0.19, 10, 32), yellow, [0, 0, 0], [1.65, 1, 1], [Math.PI / 2, 0, 0]);
    part(duck, SPH, yellow, [1.08, 0.28, 0], [0.22, 0.27, 0.24]);
    part(duck, BOX, toon('#ff973e'), [1.3, 0.22, 0], [0.28, 0.09, 0.24]);
    for (const s of [-1, 1]) part(duck, SPH_LO, toon('#253041'), [1.18, 0.36, 0.2 * s], [0.035, 0.04, 0.025], null, 0);
    H.bubbles = [];
    const foam = new THREE.MeshStandardMaterial({ color: C('#e6faff'), transparent: true, opacity: 0.55, roughness: 0.2, depthWrite: false });
    for (let j = 0; j < 8; j++) { const a = j / 8 * Math.PI * 2; H.bubbles.push(part(bob, SPH_LO, foam, [Math.cos(a) * 0.9, 1.4 + j % 3 * 0.15, Math.sin(a) * 0.55], [0.09, 0.09, 0.09], null, 0)); }
  }
  if (k === 'balloon') {
    H.balloons = [];
    for (let j = 0; j < 3; j++) {
      const balloon = new THREE.Group(); balloon.position.set(-0.25 + j * 0.25, 1.5, (j - 1) * 0.24); bob.add(balloon);
      const col = toon(['#ffafcf', '#a9e6ff', '#ffe8a0'][j]); H.glowMats.push(col);
      const stringLength = 1.3 + j % 2 * 0.15;
      part(balloon, new THREE.CylinderGeometry(0.012, 0.012, stringLength, 6), toon('#efe6d8'), [0, stringLength / 2, 0], null, null, 0);
      part(balloon, SPH, col, [0, 1.7 + j % 2 * 0.15, 0], [0.3, 0.4, 0.3]);
      part(balloon, CONE, col, [0, 1.3 + j % 2 * 0.15, 0], [0.055, 0.08, 0.055]); H.balloons.push(balloon);
    }
  }
  if (k === 'sushi') {
    // A small, uneven mound of grated wasabi rests on the head instead of a forelock.
    const wasabi = new THREE.Group(); wasabi.position.set(0.07, 0.36, 0); head.add(wasabi);
    const paste = ['#b2c65a', '#cadb7a', '#92a549'].map(color => new THREE.MeshBasicMaterial({ color: C(color) }));
    part(wasabi, SPH_LO, paste[0], [0, 0.05, 0], [0.2, 0.11, 0.18], null, 0.025);
    part(wasabi, SPH_LO, paste[0], [-0.015, 0.17, 0], [0.14, 0.12, 0.13], null, 0);
    part(wasabi, SPH_LO, paste[1], [-0.025, 0.28, 0.01], [0.075, 0.09, 0.07], null, 0);
    for (let j = 0; j < 24; j++) {
      const t = j / 24, angle = j * 2.4, radius = 0.18 * (1 - t), grain = 0.03 + j % 3 * 0.006;
      part(wasabi, SPH_LO, paste[j % 3], [Math.cos(angle) * radius - t * 0.025, 0.04 + t * 0.29, Math.sin(angle) * radius], [grain, grain * 0.85, grain], [0, angle, angle * 0.4], 0);
    }
    const salmon = new THREE.MeshBasicMaterial({ color: C('#e982a0') }), fat = new THREE.MeshBasicMaterial({ color: C('#ffe0e8') }), rice = toon('#ffffff');
    const skinTex = ctex(128, 64, g => {
      g.fillStyle = '#74828b'; g.fillRect(0, 0, 128, 64);
      g.strokeStyle = '#b3bec4'; g.lineWidth = 1.5;
      for (let row = 0; row < 5; row++) for (let col = 0; col < 9; col++) {
        g.beginPath(); g.arc(col * 16 + row % 2 * 8, row * 14, 8, 0, Math.PI); g.stroke();
      }
    });
    const skin = new THREE.MeshStandardMaterial({ color: C('#b5bec4'), map: skinTex, roughness: 0.48, metalness: 0.3 });
    // A visible silver skin layer under the pink flesh makes the fillet readable from the sides.
    part(bob, BOX, skin, [-0.12, 1.565, 0], [1.66, 0.1, 0.87], null, 0.025);
    part(bob, BOX, salmon, [-0.12, 1.69, 0], [1.65, 0.22, 0.86]);
    for (let j = 0; j < 7; j++) {
      part(bob, BOX, fat, [-0.8 + j * 0.22, 1.805, 0], [0.035, 0.012, 0.85], [0, -0.25, 0], 0);
      for (const s of [-1, 1]) part(bob, BOX, fat, [-0.8 + j * 0.22 + 0.1 * s, 1.71, 0.436 * s], [0.026, 0.16, 0.012], [0, 0, -0.25], 0);
    }
    for (const s of [-1, 1]) for (let j = 0; j < 12; j++) part(bob, SPH_LO, rice, [-0.7 + j % 6 * 0.24, 0.99 + Math.floor(j / 6) * 0.19, 0.43 * s], [0.1, 0.055, 0.035], [0, 0, (j % 3 - 1) * 0.3], 0);
    H.tears = new THREE.Group(); head.add(H.tears); H.tears.visible = false;
    for (const s of [-1, 1]) part(H.tears, SPH_LO, toon('#80d9ff'), [0.17, -0.12, 0.36 * s], [0.045, 0.1, 0.025], null, 0);
  }
  if (k === 'cardboard') {
    const tape = toon('#e7c997'), fold = toon('#8a633e');
    part(bob, BOX, tape, [-0.18, 1.47, 0], [0.18, 0.025, 0.75], null, 0);
    for (const s of [-1, 1]) {
      part(bob, BOX, tape, [-0.6, 1.15, 0.378 * s], [0.18, 0.58, 0.02], null, 0);
      part(bob, BOX, fold, [0, 0.73, 0.378 * s], [1.4, 0.02, 0.02], null, 0);
      part(head, BOX, tape, [-0.25, 0, 0.327 * s], [0.12, 0.62, 0.025], null, 0);
    }
    // Box faces are flatter than the usual head; keep eyes and cheeks outside them.
    for (const child of head.children) if (Math.abs(child.position.z) >= 0.3) child.position.z = Math.sign(child.position.z) * Math.max(Math.abs(child.position.z), 0.35);
  }
}
function animHorse(H, v, dt, t, skillActive = false) {
  const k = Math.min(v / 22, 1.2);
  const toy = H.kind === 'rocking' || H.kind === 'carousel';
  const vehicle = H.kind === 'car' || H.kind === 'train';
  if (H.kind === 'car') {
    for (const wheel of H.wheels) wheel.rotation.z -= dt * v / 0.3;
    H.bob.position.y = v > 0.4 ? Math.sin(t * 18) * 0.012 : 0;
    H.bob.rotation.z = 0;
  } else if (H.kind === 'train') {
    // 車輪の回転に加え、走行中はレールの継ぎ目のような細かい振動と小さな横揺れを入れる
    for (const wheel of H.wheels) wheel.rotation.z -= dt * v / 0.2;
    H.bob.position.y = v > 0.4 ? Math.abs(Math.sin(t * 9)) * 0.012 : 0;
    H.bob.rotation.x = v > 0.4 ? Math.sin(t * 1.7 + H.phase) * 0.012 : 0;
  } else if (H.kind === 'hopping') {
    H.phase += dt * (v > 0.4 ? 3 + v * 0.25 : 1.5);
    const bounce = Math.max(0, Math.sin(H.phase)), compression = v > 0.4 ? Math.max(0, -Math.sin(H.phase)) * 0.35 : 0.04 + Math.sin(H.phase) * 0.02;
    H.spring.scale.y = 1 - compression; H.hopper.position.y = -0.48 * compression;
    H.bob.position.y = v > 0.4 ? bounce * 0.65 : 0;
    H.bob.rotation.z = Math.sin(H.phase) * 0.025;
    H.head.rotation.z = Math.sin(H.phase) * 0.025; H.head.rotation.y = 0;
    H.tail.rotation.y = Math.sin(H.phase) * 0.2;
  } else if (H.kind === 'roller') {
    H.phase += dt * (v > 0.4 ? 2 + v * 0.15 : 1);
    for (const wheel of H.wheels) wheel.rotation.z -= dt * v / (0.1 * H.scale);
    H.legs.forEach((leg, j) => { leg.rotation.z = v > 0.4 ? Math.sin(H.phase + j % 2 * Math.PI) * 0.18 : 0; });
    H.bob.position.y = 0; H.bob.rotation.z = v > 0.4 ? -0.04 : 0;
    H.head.rotation.z = Math.sin(t * 1.5) * 0.025; H.head.rotation.y = 0;
    H.tail.rotation.y = Math.sin(H.phase) * 0.2;
  } else if (H.kind === 'segway') {
    for (const wheel of H.wheels) wheel.rotation.z -= dt * v / (0.4 * H.scale);
    H.bob.position.y = 0;
    H.bob.rotation.z = damp(H.bob.rotation.z, v > 0.4 ? -0.035 * Math.min(k, 1) : Math.sin(t * 1.3 + H.phase) * 0.012, 6, dt);
    H.head.rotation.z = Math.sin(t * 1.6 + H.phase) * 0.025;
    H.head.rotation.y = v > 0.4 ? damp(H.head.rotation.y, 0, 5, dt) : Math.sin(t * 0.7 + H.phase) * 0.12;
    H.tail.rotation.z = 0.15; H.tail.rotation.y = Math.sin(t * 2 + H.phase) * 0.2;
  } else if (toy) {
    H.phase += dt * (v > 0.4 ? 2.2 + v * 0.3 : 1.2);
    const ph = H.phase, kk = Math.min(k, 1);
    if (H.kind === 'rocking') { H.bob.rotation.z = Math.sin(ph) * (0.05 + 0.2 * kk); H.bob.position.y = 0; }
    else { H.bob.position.y = 0.4 + Math.sin(ph * 0.55) * (0.12 + 0.28 * kk); H.bob.rotation.z = Math.sin(ph * 0.55 + 1.2) * 0.08; }
    H.head.rotation.z = Math.sin(ph + 1.6) * 0.06; H.head.rotation.y = v > 0.4 ? damp(H.head.rotation.y, 0, 5, dt) : Math.sin(t * 0.7 + H.phase) * 0.15;
    H.tail.rotation.z = 0.25 + 0.4 * kk; H.tail.rotation.y = Math.sin(ph * 1.3) * 0.35;
  } else if (v > 0.4) {
    // Deliberately exaggerated motif gaits, not measured joint angles.
    // Apply individual gaits only at a run; walking and race physics stay shared.
    const gait = v >= 4 ? H.def.gait : null;
    H.phase += dt * (3.2 + v * 0.36) * (gait?.cadence ?? 1);
    const ph = H.phase, amp = (v < 4 ? 0.35 : 0.3 + 0.55 * Math.min(k, 1)) * (gait?.reach ?? 1);
    const frontAmp = amp * (H.def.look?.frontLift || 1) * (gait?.frontReach ?? 1);
    const pairPhase = gait?.pairPhase ?? 0.5;
    const walk = v < 4, stiff = H.kind === 'tin' || (H.kind === 'cardboard' && !skillActive);
    if (stiff) { const a2 = 0.25 + 0.3 * Math.min(k, 1), ph2 = ph * 1.4; H.legs[0].rotation.z = H.legs[3].rotation.z = Math.sin(ph2) * a2; H.legs[1].rotation.z = H.legs[2].rotation.z = -Math.sin(ph2) * a2; H.bob.position.y = Math.abs(Math.sin(ph2)) * 0.08; H.bob.rotation.z = Math.sin(ph2 * 2) * 0.03; } else {
    H.legs[0].rotation.z = Math.sin(ph) * frontAmp; H.legs[1].rotation.z = Math.sin(ph + (walk ? Math.PI : pairPhase)) * frontAmp;
    H.legs[2].rotation.z = Math.sin(ph + (walk ? Math.PI * 0.5 : Math.PI)) * amp; H.legs[3].rotation.z = Math.sin(ph + (walk ? Math.PI * 1.5 : Math.PI + pairPhase)) * amp;
    H.bob.position.y = Math.abs(Math.sin(ph)) * (walk ? 0.04 : 0.24 * Math.min(k, 1)) * (gait?.bounce ?? 1);
    H.bob.rotation.z = Math.sin(ph + 0.8) * 0.07 * k * (gait?.pitch ?? 1); }
    H.head.rotation.z = Math.sin(ph + 1.6) * (0.06 + 0.1 * k) * (gait?.head ?? 1);
    H.tail.rotation.z = 0.35 + 0.5 * Math.min(k, 1) + Math.sin(ph * 0.5) * 0.12; H.tail.rotation.y = Math.sin(ph) * 0.3;
  } else {
    for (const l of H.legs) l.rotation.z = damp(l.rotation.z, 0, 8, dt);
    H.bob.position.y = damp(H.bob.position.y, 0, 8, dt);
    H.bob.rotation.z = Math.sin(t * 1.3 + H.phase) * 0.015;
    H.head.rotation.z = Math.sin(t * 1.6 + H.phase) * 0.06 - 0.03;
    H.head.rotation.y = Math.sin(t * 0.7 + H.phase * 2) * 0.18;
    H.tail.rotation.z = 0.15; H.tail.rotation.y = Math.sin(t * 2.2 + H.phase) * 0.45;
  }
  if (v > 0.4 && !toy && !vehicle) H.head.rotation.y = damp(H.head.rotation.y, 0, 5, dt);
  if (H.kind === 'balloon') {
    H.bob.position.y = Math.max(0, Math.sin(t * 2 + H.phase)) * 0.45;
    H.balloons.forEach((b, j) => { b.rotation.z = Math.sin(t * 1.4 + j) * 0.06; });
  }
  if (H.floatRing) {
    H.floatRing.rotation.x = Math.sin(t * 2.2 + H.phase) * 0.07;
    H.floatRing.rotation.z = Math.sin(t * 1.7 + H.phase) * 0.04;
    H.bubbles.forEach((b, j) => { b.position.y = 1.3 + ((t * 0.3 + j / 8) % 1) * 0.7; });
  }
  if (H.tears) H.tears.visible = skillActive;
  if (H.key) H.key.rotation.z -= dt * (1.5 + v * 0.5);
  if (H.hop > 0) { H.hop = Math.max(0, H.hop - dt); H.hopY = Math.abs(Math.sin((1 - H.hop) * Math.PI * 3)) * 0.7 * H.hop; } else H.hopY = 0;
  for (const w of H.wings) w.g.rotation.x = -w.s * (0.35 + Math.sin(t * (v > 1 ? 18 : 4) + H.phase) * (v > 1 ? 0.6 : 0.2));
  H.glow = Math.max(0, H.glow - dt * 0.9);
  for (const m of H.glowMats) {
    if (!m.emissive) continue;
    if (m === H.glowMats[0] && H.def.kind === 'gold') { m.emissive.copy(H.baseEm).lerp(H.glowCol, H.glow * 0.7); m.emissiveIntensity = H.baseEmI + H.glow * 0.8; }
    else { m.emissive.copy(H.glowCol).multiplyScalar(H.glow * 0.55); }
  }
}
let horses = [];
function disposeHorse(H) {
  H.root.removeFromParent();
  const disposed = new Set();
  const release = o => { if (o && !o.userData.keep && !disposed.has(o)) { disposed.add(o); o.dispose(); } };
  H.root.traverse(o => {
    release(o.geometry);
    for (const m of o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : []) {
      if (m.userData.keep) continue;
      release(m.map); release(m);
    }
  });
}
function setField() {
  horses.forEach(disposeHorse);
  HORSES = pickField();
  horses = HORSES.map((d, i) => { const H = buildHorse(d, i); scene.add(H.root); return H; });
}
