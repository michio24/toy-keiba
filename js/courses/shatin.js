// 沙田
'use strict';

function decorShatin(th) {
  roundTrees(treeSpots(115, 18), ['#3a8153', '#58a46c', '#79ba7c']);
  mountains(th.mount, 20, false);
  // A close ridge across the infield makes Sha Tin's mountain backdrop legible.
  const ridge = [], f = farPoint(650, true);
  for (let i = 0; i < 9; i++) ridge.push({ p: new V3(f.x + (i - 4) * 90, -5, f.z), s: new V3(110, 120 + (i % 3) * 45, 120), r: [0, i * 0.3, 0] });
  inst(new THREE.ConeGeometry(1, 1, 8).translate(0, 0.5, 0), toon(th.mount), ridge, false);
}
