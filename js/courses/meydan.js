// メイダン
'use strict';

function decorMeydan() {
  const otherDef = TRACKS.find(t => t.theme === 'meydan' && t.surf !== track.def.surf);
  const other = new Track(otherDef), turf = track.def.surf === 'turf' ? track : other;
  decorCourseLane(other, otherDef.surf);
  // Non-racing straight chutes, as shown in Dubai Racing Club's course diagram.
  const chute = (s, length) => {
    const q = turf.pos(s, W / 2), tr = new Track({ surf: 'turf', dir: 'left', closed: false, segs: [{ len: length }], finish: [0, length], D: length });
    const start = tr.pos(tr.L, W / 2);
    for (let i = 0; i <= tr.N; i++) {
      const x = tr.xs[i] - start.x, z = tr.zs[i] - start.z;
      tr.xs[i] = q.x + x * Math.cos(q.h) - z * Math.sin(q.h); tr.zs[i] = q.z + x * Math.sin(q.h) + z * Math.cos(q.h); tr.hs[i] = q.h;
    }
    decorCourseLane(tr, 'turf');
  };
  chute(0, 375); chute(turf.segStart[2], 160);
  const trunks = [], leaves = [];
  for (let i = 0; i < 26; i++) {
    const q = turf.pos(turf.L * (i + 0.5) / 26, W + 65), h = rand(10, 16), p = new V3(q.x, 0, q.z);
    trunks.push({ p, s: new V3(0.55, h, 0.55) });
    for (let j = 0; j < 6; j++) { const a = j * Math.PI / 3; leaves.push({ p: new V3(p.x + Math.cos(a) * 2.5, h, p.z + Math.sin(a) * 2.5), s: new V3(4.5, 0.4, 0.9), r: [0, -a, 0.16] }); }
  }
  inst(new THREE.CylinderGeometry(1, 0.7, 1, 7).translate(0, 0.5, 0), toon('#9b7045'), trunks);
  inst(SPH_LO, toon('#4d8d5c'), leaves);
  floodTowers(12, W + 55);
  // An illustrative Dubai skyline, beyond the oval and its straight chutes.
  const city = new THREE.Group(), f = farPoint(1050, true); city.position.copy(f); world.add(city);
  const wall = toon('#343f59'), glass = glowMat('#f3ce89', 1.8);
  for (let i = 0; i < 20; i++) {
    const x = (i - 9.5) * 32, h = 35 + (i % 5) * 13;
    addBox(city, [22, h, 20], [x, h / 2, 0], wall);
    for (let y = 8; y < h; y += 9) addBox(city, [17, 1.2, 20.2], [x, y, 0], glass);
  }
  for (let i = 0; i < 6; i++) addBox(city, [18 - i * 2.5, 28, 18 - i * 2.5], [30, 14 + i * 28, 30], wall);
  part(city, CONE, glass, [30, 198, 30], [1.2, 60, 1.2], null, 0);
}
