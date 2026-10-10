// ドローンの移動と衝突判定（DOMに依存しない）
'use strict';

// Keep these helpers independent of the DOM so movement and continuous collision can be tested.
function droneTree(items) {
  if (!items.length) return null;
  const box = new THREE.Box3(); items.forEach(o => box.union(o.box));
  if (items.length <= 12) return { box, items };
  const size = box.getSize(new V3()), axis = size.x >= size.y && size.x >= size.z ? 'x' : size.y >= size.z ? 'y' : 'z';
  items.sort((a, b) => (a.box.min[axis] + a.box.max[axis]) - (b.box.min[axis] + b.box.max[axis]));
  const mid = items.length >> 1;
  return { box, left: droneTree(items.slice(0, mid)), right: droneTree(items.slice(mid)) };
}
function droneQuery(node, box, visit) {
  if (!node || !node.box.intersectsBox(box)) return;
  if (node.items) { for (const item of node.items) if (item.box.intersectsBox(box)) visit(item); }
  else { droneQuery(node.left, box, visit); droneQuery(node.right, box, visit); }
}
function droneTriangleSweep(start, delta, triangle, radius, limit = 1) {
  const p = new V3(), closest = new V3(), normal = new V3(); let t = 0;
  // The closest-point plane is a separating plane of the convex rounded triangle.
  // Advance only as far as that plane: thin surfaces cannot be skipped at any speed.
  for (let i = 0; i < 48; i++) {
    p.copy(start).addScaledVector(delta, t); triangle.closestPointToPoint(p, closest);
    normal.subVectors(p, closest); const distance = normal.length();
    if (distance < 1e-10) return t;
    normal.multiplyScalar(1 / distance);
    const closing = -normal.dot(delta);
    if (closing <= 1e-10) return limit;
    if (distance <= radius + 1e-6) return t;
    const next = t + (distance - radius) / closing;
    if (next >= limit) return limit;
    t = next;
  }
  return t; // Conservative stop if a grazing contact converges unusually slowly.
}
class DroneCollision {
  constructor(root) {
    const geometries = new Map(), entries = [], instance = new THREE.Matrix4();
    root.updateMatrixWorld(true);
    const walk = o => {
      if (!o.visible || o.userData.droneIgnore || o.userData.backdrop) return;
      if (o.isMesh && o.geometry?.attributes.position && !o.isSkinnedMesh) {
        const materials = Array.isArray(o.material) ? o.material : [o.material];
        if (materials.some(m => m.visible && m.depthWrite && m.side !== THREE.BackSide)) {
          const geo = o.geometry;
          let data = geometries.get(geo);
          if (!data) {
            const pos = geo.attributes.position, idx = geo.index, count = idx ? idx.count : pos.count, triangles = [];
            const begin = geo.drawRange.start, end = Math.min(count, begin + geo.drawRange.count);
            for (let i = begin; i + 2 < end; i += 3) {
              const vertices = [0, 1, 2].map(k => new V3().fromBufferAttribute(pos, idx ? idx.getX(i + k) : i + k));
              const tri = new THREE.Triangle(...vertices);
              if (tri.getArea() > 1e-12) triangles.push({ tri, box: new THREE.Box3().setFromPoints(vertices) });
            }
            data = { tree: droneTree(triangles), triangles }; geometries.set(geo, data);
          }
          if (data.tree) for (let i = 0, n = o.isInstancedMesh ? o.count : 1; i < n; i++) {
            const matrix = o.matrixWorld.clone();
            if (o.isInstancedMesh) { o.getMatrixAt(i, instance); matrix.multiply(instance); }
            if (Math.abs(matrix.determinant()) < 1e-12) continue;
            entries.push({ data, matrix, inverse: matrix.clone().invert(), box: data.tree.box.clone().applyMatrix4(matrix) });
          }
        }
      }
      o.children.forEach(walk);
    };
    walk(root); this.tree = droneTree(entries);
  }
  triangles(box, visit) {
    const tri = new THREE.Triangle();
    droneQuery(this.tree, box, entry => {
      const local = box.clone().applyMatrix4(entry.inverse);
      droneQuery(entry.data.tree, local, item => {
        tri.a.copy(item.tri.a).applyMatrix4(entry.matrix);
        tri.b.copy(item.tri.b).applyMatrix4(entry.matrix);
        tri.c.copy(item.tri.c).applyMatrix4(entry.matrix);
        visit(tri);
      });
    });
  }
  move(start, delta, radius = 0.5) {
    if (!delta.lengthSq()) return start.clone();
    const box = new THREE.Box3().setFromPoints([start, start.clone().add(delta)]).expandByScalar(radius + 0.001);
    let fraction = 1;
    this.triangles(box, tri => { fraction = Math.min(fraction, droneTriangleSweep(start, delta, tri, radius, fraction)); });
    // Leave a small clearance so the next input can move away from contact freely.
    if (fraction < 1) fraction = Math.max(0, fraction - 0.0001 / delta.length());
    return start.clone().addScaledVector(delta, fraction);
  }
  overlaps(point, radius = 0.5) {
    let overlap = false; const nearest = new V3();
    const box = new THREE.Box3(point.clone(), point.clone()).expandByScalar(radius);
    this.triangles(box, tri => { if (tri.closestPointToPoint(point, nearest).distanceToSquared(point) <= radius * radius) overlap = true; });
    // Also reject positions inside solid meshes, even when far from their surface.
    const ray = new THREE.Ray(point, new V3(0.9327, 0.2713, 0.2371).normalize()), hit = new V3();
    droneQuery(this.tree, box, entry => {
      if (overlap || !entry.box.containsPoint(point)) return;
      const localRay = ray.clone().applyMatrix4(entry.inverse), distances = [];
      for (const { tri } of entry.data.triangles) {
        if (localRay.intersectTriangle(tri.a, tri.b, tri.c, false, hit)) distances.push(hit.distanceTo(localRay.origin));
      }
      distances.sort((a, b) => a - b);
      const unique = distances.filter((d, i) => !i || d - distances[i - 1] > 1e-6);
      if (unique.length % 2) overlap = true;
    });
    return overlap;
  }
}
function droneDisplacement(yaw, right, forward, up, speed, dt) {
  const v = new V3(Math.sin(yaw) * right - Math.cos(yaw) * forward, up, -Math.cos(yaw) * right - Math.sin(yaw) * forward);
  if (v.lengthSq() > 1) v.normalize();
  return v.multiplyScalar(speed * dt);
}
