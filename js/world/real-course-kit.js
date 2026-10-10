// 実在コース用の植栽などの共通道具
'use strict';

/* ---- decor for the real-course motifs ---- */
function roundTrees(spots, greens, trunkCol = '#6b4a35') {
  const trunkG = new THREE.CylinderGeometry(0.35, 0.55, 3.4, 7); trunkG.translate(0, 1.7, 0);
  const blobG = new THREE.IcosahedronGeometry(1, 1), cols = greens.map(C);
  const trunks = [], blobs = [];
  for (const it of spots) {
    const p = it.p, sc = it.s || rand(1, 1.7);
    trunks.push({ p, s: new V3(sc, sc, sc), r: [0, rand(0, 6), 0] });
    for (let j = 0; j < 5; j++) { const br = rand(1.4, 2.2) * sc; blobs.push({ p: new V3(p.x + rand(-1.5, 1.5) * sc, p.y + (3.5 + rand(0, 1.8)) * sc, p.z + rand(-1.5, 1.5) * sc), s: new V3(br, br * 0.85, br), c: cols[(Math.random() * cols.length) | 0] }); }
  }
  inst(trunkG, toon(trunkCol), trunks); inst(blobG, toon('#ffffff'), blobs);
}
function treeSpots(nOut, nIn, minL = 12, maxL = 110) {
  const a = [];
  for (let i = 0; i < nOut; i++) a.push({ p: spotOutside(minL, maxL, true) });
  for (let i = 0; i < nIn; i++) a.push({ p: spotInfield() });
  return a;
}
function farPoint(dist, inward = true, along = 0.5) {
  const f = tp(lerp(track.homeS0, track.homeS1, along), W / 2), d = f.n.clone().multiplyScalar(inward ? -1 : 1);
  return new V3(f.v.x + d.x * dist, 0, f.v.z + d.z * dist);
}
function fallingLeaves(tex, cols, rate) {
  const cs = cols.map(c => C(c));
  ambient(tex, false, rate, (a, c) => a.emit(c.x + rand(-60, 60), c.y + rand(6, 28), c.z + rand(-60, 60), rand(-1.5, 2), rand(-1.5, -0.7), rand(-1, 1), 9, rand(0.35, 0.6), cs[(Math.random() * cs.length) | 0], 0, 0));
}
