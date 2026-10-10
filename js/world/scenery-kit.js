// 沿道の名所づくりの共通道具
'use strict';

/* ---- 沿道の名所づくりの共通道具：走路からの距離、敷地の確保、区間上の位置、散らし置き、看板、群れ、地面に沿う帯 ---- */
function sceneryKit() {
  const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };
  // 走路中心までの距離：32m格子に標本を登録し、近くのセルだけを調べる
  const CELL = 32, cells = new Map(), cellKey = (cx, cz) => cx * 4096 + cz;
  for (let i = 0; i <= track.N; i += 4) {
    const key = cellKey(Math.floor(track.xs[i] / CELL), Math.floor(track.zs[i] / CELL));
    if (!cells.has(key)) cells.set(key, []);
    cells.get(key).push(i);
  }
  const roadDist = (x, z, r = 64) => {
    let best = r * r;
    for (let cx = Math.floor((x - r) / CELL); cx <= Math.floor((x + r) / CELL); cx++)
      for (let cz = Math.floor((z - r) / CELL); cz <= Math.floor((z + r) / CELL); cz++)
        for (const i of cells.get(cellKey(cx, cz)) || []) best = Math.min(best, (track.xs[i] - x) ** 2 + (track.zs[i] - z) ** 2);
    return Math.sqrt(best);
  };
  const occupied = [];
  const taken = (x, z, r) => occupied.some(o => Math.hypot(x - o.x, z - o.z) < o.r + r);
  // 走路中心から margin 以上離れ、建物の敷地とも重ならない地点か
  const clearAt = (x, z, margin, r = 0) => roadDist(x, z, margin + 2) >= margin && !taken(x, z, r);
  const groundAt = p => track.groundH(p.x, p.z);
  const onGround = (p, lift = 0) => { p.y = groundAt(p) + lift; return p; };
  // コース上の距離 s の地点から、進行方向に u、外向き（内馬場はマイナス）に v（走路中心から）
  const local = (s, u, v) => { const f = tp(s, W / 2); return new V3(f.v.x + f.dir.x * u + f.n.x * v, 0, f.v.z + f.dir.z * u + f.n.z * v); };
  // 区間 seg の割合 t の位置（コース上の距離）
  const at = (seg, t) => track.segStart[seg] + track.segs[seg].len2 * t;
  const scatter = (n, s0, s1, v0, v1, margin, r = 0) => {
    const out = [];
    for (let k = 0; k < n * 4 && out.length < n; k++) {
      const p = local(rand(s0, s1), 0, rand(v0, v1));
      if (clearAt(p.x, p.z, margin, r) && p.distanceTo(boardPos) > 26) out.push(onGround(p));
    }
    return out;
  };
  const label = (text, w, h, bg, fg) => new THREE.Sprite(new THREE.SpriteMaterial({ map: ctex(512, Math.round(512 * h / w), c => {
    c.fillStyle = bg; c.fillRect(0, 0, 512, 512 * h / w); c.strokeStyle = fg; c.lineWidth = 6; c.strokeRect(5, 5, 502, 512 * h / w - 10);
    c.fillStyle = fg; c.font = 'bold 56px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(text, 256, 256 * h / w + 4, 480);
  }) }));
  // 建物の土台：長方形の角と辺の中点が走路から十分離れるまで外へずらし、斜面では台座で水平にする（-Zが走路側）
  const footprint = (g, w, d) => {
    g.updateMatrixWorld(true);
    return [[-1, -1], [1, -1], [1, 1], [-1, 1], [0, -1], [0, 1], [-1, 0], [1, 0], [0, 0]].map(([a, b]) => g.localToWorld(new V3(a * w / 2, 0, b * d / 2)));
  };
  const site = (name, s, v, w, d, color = '#cfc8b2', clear = W / 2 + 6) => {
    const out = v > 0 ? 1 : -1, g = new THREE.Group();
    for (let k = 0, vv = v; k < 40; k++, vv += out * 2) {
      const f = tp(s, W / 2 + vv); g.position.set(f.v.x, 0, f.v.z);
      g.rotation.y = -f.h + (out < 0 ? Math.PI : 0);
      if (footprint(g, w, d).every(p => roadDist(p.x, p.z) >= clear && !taken(p.x, p.z, 0))) break;
    }
    world.add(g); landmarkFoundation(g, w, d, color); g.updateMatrixWorld(true);
    occupied.push({ x: g.position.x, z: g.position.z, r: Math.hypot(w, d) / 2 + 3 });
    return registerLandmark(g, name);
  };
  const PRISM = (() => {
    const geo = new THREE.ExtrudeGeometry(new THREE.Shape([new THREE.Vector2(-0.5, 0), new THREE.Vector2(0.5, 0), new THREE.Vector2(0, 1)]), { depth: 1, bevelEnabled: false });
    geo.translate(0, 0, -0.5); geo.rotateY(Math.PI / 2); return geo;
  })();
  const CYL = new THREE.CylinderGeometry(1, 1, 1, 10), CYL_T = new THREE.CylinderGeometry(0.7, 1, 1, 7);
  // 低画質ではインスタンスの前半だけを描くので、単独の配列は呼び出し側でシャッフルしておく
  const addInst = (geo, mat, list, shadow = true) => list.length ? fantasyInst(geo, mat, list, shadow) : null;
  // 局所座標の部品を、向き yaw で置いた群れ（牛・羊など）に展開する
  const herd = (spots, parts) => parts.forEach(({ geo, mat, off, s }) => spots.length && inst(geo, mat, spots.map(({ p, yaw }) => {
    const c = Math.cos(yaw), sn = Math.sin(yaw);
    return { p: new V3(p.x + off[0] * c + off[2] * sn, p.y + off[1], p.z - off[0] * sn + off[2] * c), s: new V3(...s), r: [0, yaw, 0] };
  })));
  // 地面に沿う帯（散策路・車道）。走路に近すぎる標本は落とす
  const pathRibbon = (pts, width, lift, mat, margin = W / 2 + 4) => {
    const positions = [], indices = [];
    let k = 0, prevOk = false;
    for (let i = 0; i < pts.length; i++) {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)], p = pts[i];
      const tx = b.x - a.x, tz = b.z - a.z, tl = Math.hypot(tx, tz) || 1, sx = -tz / tl * width / 2, sz = tx / tl * width / 2;
      const ok = roadDist(p.x, p.z, margin + 2) >= margin;
      const l = new V3(p.x + sx, 0, p.z + sz), r = new V3(p.x - sx, 0, p.z - sz);
      positions.push(l.x, groundAt(l) + lift, l.z, r.x, groundAt(r) + lift, r.z);
      if (ok && prevOk) indices.push(k - 2, k - 1, k, k - 1, k + 1, k);
      prevOk = ok; k += 2;
    }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3)); geo.setIndex(indices); geo.computeVertexNormals();
    const mesh = new THREE.Mesh(geo, mat); mesh.receiveShadow = true; world.add(mesh); return mesh;
  };
  // 箱を2点の間に渡す（梁・手すり）。inst 用の { p, s, r }
  const beam = (a, b, th, c) => { const d = b.clone().sub(a), hz = Math.hypot(d.x, d.z); return { p: a.clone().lerp(b, 0.5), s: new V3(d.length(), th, th), r: [0, -Math.atan2(d.z, d.x), Math.atan2(d.y, hz)], c }; };
  // 地面に沿う道筋：弧長で位置と向きを返す（closed で一周）
  const route = (pts, closed) => {
    const cum = [0]; for (let i = 1; i < pts.length + (closed ? 1 : 0); i++) cum.push(cum[i - 1] + pts[i % pts.length].distanceTo(pts[i - 1]));
    const L = cum[cum.length - 1];
    return { L, pts, at(u, out = new V3()) {
      u = closed ? mod(u, L) : clamp(u, 0, L); let i = 1; while (i < cum.length - 1 && cum[i] < u) i++;
      const a = pts[(i - 1) % pts.length], b = pts[i % pts.length], t = (u - cum[i - 1]) / Math.max(1e-6, cum[i] - cum[i - 1]);
      out.copy(a).lerp(b, t); return { p: out, yaw: -Math.atan2(b.z - a.z, b.x - a.x) };
    } };
  };
  return { shuffle, roadDist, occupied, taken, clearAt, groundAt, onGround, local, at, scatter, label, footprint, site, PRISM, CYL, CYL_T, addInst, herd, pathRibbon, beam, route };
}
