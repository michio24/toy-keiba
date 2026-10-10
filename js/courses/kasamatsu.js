// 笠松
'use strict';

function decorKasamatsu(th) {
  roundTrees(treeSpots(60, 0, 18, 70), ['#608952', '#7ba066', '#94b978']);
  mountains(th.mount, 8, false);
  // An infield paddock and lattice towers are simplified landmarks, clear of the running lanes.
  const paddock = new THREE.Group(); paddock.position.set(-25, track.groundH(-25, -8), -8); world.add(paddock);
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.7, 1, 48), toon('#d7c6a6', { side: THREE.DoubleSide }));
  ring.rotation.x = -Math.PI / 2; ring.scale.set(29, 17, 1); ring.position.y = 0.18; paddock.add(ring);
  const fenceMat = toon('#f5f0df'), fence = [];
  for (let i = 0; i < 48; i++) {
    const a = i / 48 * Math.PI * 2, x = Math.cos(a) * 29, z = Math.sin(a) * 17;
    fence.push(new V3(x, 1.2, z)); addBox(paddock, [0.16, 1.2, 0.16], [x, 0.6, z], fenceMat, null, 0);
  }
  paddock.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(fence, true), 96, 0.1, 4, true), fenceMat));
  const steel = toon('#8b9398');
  for (const x of [-75, 65]) {
    const tower = new THREE.Group(); tower.position.set(x, track.groundH(x, 14), 14); world.add(tower);
    for (const dx of [-1, 1]) for (const dz of [-1, 1]) {
      const a = new V3(dx * 4, 0, dz * 4), b = new V3(dx * 1.3, 32, dz * 1.3);
      tower.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.LineCurve3(a, b), 1, 0.28, 4), steel));
    }
    for (let y = 4; y <= 28; y += 6) {
      const r = 4 - 2.7 * y / 32;
      for (const side of [-1, 1]) {
        addBox(tower, [r * 2, 0.22, 0.22], [0, y, side * r], steel, null, 0);
        addBox(tower, [0.22, 0.22, r * 2], [side * r, y, 0], steel, null, 0);
        const a = new V3(-r, y, side * r), b = new V3(r - 0.5, y + 6, side * (r - 0.5));
        tower.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.LineCurve3(a, b), 1, 0.12, 4), steel));
      }
    }
    for (const y of [26, 31]) addBox(tower, [13, 0.45, 0.5], [0, y, 0], steel, null, 0);
  }
}
