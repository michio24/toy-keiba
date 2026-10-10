// コース図鑑のドローン：移動量と衝突判定のテスト
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadGame } = require('./helpers/game.cjs');

const { get } = loadGame();
const THREE = get('THREE'), V3 = THREE.Vector3;
const DroneCollision = get('DroneCollision'), droneDisplacement = get('droneDisplacement');

// 原点から x 方向に 10m 先にある、厚さ size の箱（壁）を置いたシーン
function wallScene({ x = 10, size = [2, 20, 20], ...flags } = {}) {
  const root = new THREE.Group();
  const wall = new THREE.Mesh(new THREE.BoxGeometry(...size), new THREE.MeshBasicMaterial());
  wall.position.set(x, 0, 0);
  Object.assign(wall.userData, flags.userData || {});
  if (flags.visible === false) wall.visible = false;
  root.add(wall);
  return root;
}
const close = (a, b, eps = 1e-6) => Math.abs(a - b) < eps;

test('移動量：入力の向きと速度×時間で決まり、斜め入力でも速くならない', () => {
  const up = droneDisplacement(0, 0, 0, 1, 20, 0.5);
  assert.ok(close(up.x, 0) && close(up.y, 10) && close(up.z, 0));
  const fwd = droneDisplacement(0, 0, 1, 0, 20, 0.5);
  assert.ok(close(fwd.length(), 10));
  const diag = droneDisplacement(1.2, 1, 1, 0, 20, 0.5);
  assert.ok(close(diag.length(), 10), `斜め移動 ${diag.length()}`);
  assert.equal(droneDisplacement(0, 0, 0, 0, 20, 0.5).length(), 0);
});

test('衝突：壁に向かうと手前（半径ぶん）で止まり、離れる向きには動ける', () => {
  const col = new DroneCollision(wallScene());
  const start = new V3(0, 0, 0), radius = 0.5;
  const end = col.move(start, new V3(30, 0, 0), radius);
  // 壁の手前の面は x = 9。ドローンの中心は 9 - 半径 で止まる
  assert.ok(end.x < 9 - radius + 1e-3 && end.x > 9 - radius - 1e-2, `停止位置 ${end.x}`);
  const back = col.move(end, new V3(-5, 0, 0), radius);
  assert.ok(close(back.x, end.x - 5, 1e-6), '壁から離れる向きに動けない');
});

test('衝突：壁と平行な移動は妨げない', () => {
  const col = new DroneCollision(wallScene());
  const end = col.move(new V3(5, 0, 0), new V3(0, 0, 8), 0.5);
  assert.ok(close(end.x, 5) && close(end.z, 8));
});

test('衝突：薄い壁を高速で通り抜けない', () => {
  const col = new DroneCollision(wallScene({ size: [0.05, 20, 20] }));
  const end = col.move(new V3(0, 0, 0), new V3(1000, 0, 0), 0.5);
  assert.ok(end.x < 10, `壁を通り抜けた: ${end.x}`);
});

test('衝突：非表示・ドローン対象外・遠景の物体は無視する', () => {
  for (const flags of [{ visible: false }, { userData: { droneIgnore: true } }, { userData: { backdrop: true } }]) {
    const col = new DroneCollision(wallScene(flags));
    const end = col.move(new V3(0, 0, 0), new V3(30, 0, 0), 0.5);
    assert.ok(close(end.x, 30), `${JSON.stringify(flags)} に衝突した`);
  }
});

test('重なり判定：物体の表面付近と内部を検出し、離れた位置は通す', () => {
  const col = new DroneCollision(wallScene({ size: [10, 10, 10] }));
  assert.equal(col.overlaps(new V3(10, 0, 0), 0.5), true, '箱の中心（表面から離れた内部）');
  assert.equal(col.overlaps(new V3(4.8, 0, 0), 0.5), true, '表面のすぐ外');
  assert.equal(col.overlaps(new V3(0, 0, 0), 0.5), false, '離れた位置');
});
