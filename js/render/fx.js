// 2Dオーバーレイと3Dの演出（紙吹雪・花火・コイン）
'use strict';

/* ============ FX (2D overlay + 3D bursts) ============ */
const fxc = $('#fx'), fxg = fxc.getContext('2d');
const FX = { conf: [], lines: 0, flash: 0, shake: 0, ab: 0 };
function fxResize() { fxc.width = innerWidth * PR; fxc.height = innerHeight * PR; }
fxResize();
function confetti(n) {
  const cols = ['#ff4f9a', '#ffcf3f', '#46f0c6', '#6fb3ff', '#c08bff', '#ffffff'];
  for (let i = 0; i < n; i++) FX.conf.push({ x: rand(0, innerWidth), y: rand(-innerHeight * 0.6, -10), vx: rand(-60, 60), vy: rand(120, 320), r: rand(0, 6), vr: rand(-8, 8), w: rand(6, 12), h: rand(10, 18), c: cols[(Math.random() * cols.length) | 0], t: rand(0, 6) });
}
function fxDraw(dt) {
  const g = fxg; g.setTransform(PR, 0, 0, PR, 0, 0); g.clearRect(0, 0, innerWidth, innerHeight);
  if (FX.lines > 0.02) {
    const cx = innerWidth / 2, cy = innerHeight * 0.48, rr = Math.hypot(cx, cy);
    g.strokeStyle = '#fff';
    for (let i = 0; i < 70; i++) { const a = Math.random() * Math.PI * 2, r0 = rr * rand(0.35, 0.7); g.globalAlpha = FX.lines * rand(0.1, 0.45); g.lineWidth = rand(1, 3.5); g.beginPath(); g.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0); g.lineTo(cx + Math.cos(a) * rr * 1.1, cy + Math.sin(a) * rr * 1.1); g.stroke(); }
    g.globalAlpha = 1;
  }
  for (let i = FX.conf.length - 1; i >= 0; i--) {
    const p = FX.conf[i]; p.t += dt; p.x += (p.vx + Math.sin(p.t * 3) * 40) * dt; p.y += p.vy * dt; p.r += p.vr * dt;
    if (p.y > innerHeight + 30) { FX.conf.splice(i, 1); continue; }
    g.save(); g.translate(p.x, p.y); g.rotate(p.r); g.scale(1, Math.abs(Math.cos(p.t * 5)) + 0.1); g.fillStyle = p.c; g.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); g.restore();
  }
}
const rings = [];
function ringBurst(pos, color) {
  const m = new THREE.Mesh(keep(rings.geo || (rings.geo = keep(new THREE.TorusGeometry(1, 0.08, 8, 48)))), new THREE.MeshBasicMaterial({ color: C(color).multiplyScalar(3), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
  m.position.copy(pos); m.rotation.x = Math.PI / 2; scene.add(m); rings.push({ m, t: 0 });
}
function firework(p, n = 140) {
  const hue = Math.random(); const c = new THREE.Color().setHSL(hue, 0.9, 0.6).multiplyScalar(3); const c2 = new THREE.Color().setHSL((hue + 0.15) % 1, 0.9, 0.7).multiplyScalar(3);
  for (let i = 0; i < n; i++) { const u = Math.random() * 2 - 1, a = Math.random() * Math.PI * 2, sp = rand(14, 22), s = Math.sqrt(1 - u * u); fireP.emit(p.x, p.y, p.z, Math.cos(a) * s * sp, u * sp, Math.sin(a) * s * sp, rand(1.4, 2.2), rand(1.4, 2.2), i % 3 ? c : c2, 6, 1.6); }
}
const coins = { mesh: null, st: [] };
{
  const g = keep(new THREE.CylinderGeometry(0.35, 0.35, 0.07, 22)); g.rotateX(Math.PI / 2);
  coins.mesh = new THREE.InstancedMesh(g, keep(new THREE.MeshStandardMaterial({ color: C('#ffc933'), metalness: 1, roughness: 0.2, emissive: C('#7a4a00'), emissiveIntensity: 0.6 })), 160);
  coins.mesh.frustumCulled = false; scene.add(coins.mesh);
  const z = new THREE.Matrix4().makeScale(0, 0, 0); for (let i = 0; i < 160; i++) coins.mesh.setMatrixAt(i, z);
}
function coinShower(n) {
  const fwd = new V3(); camera.getWorldDirection(fwd); const right = new V3().crossVectors(fwd, camera.up).normalize(); const up = new V3().crossVectors(right, fwd);
  for (let i = 0; i < n; i++) {
    const p = camera.position.clone().addScaledVector(fwd, rand(6, 12)).addScaledVector(right, rand(-5, 5)).addScaledVector(up, rand(4, 8));
    coins.st.push({ p, v: right.clone().multiplyScalar(rand(-3, 3)).addScaledVector(up, rand(0, 4)).addScaledVector(fwd, rand(-2, 1)), r: new THREE.Euler(rand(0, 6), rand(0, 6), 0), vr: rand(6, 14), t: 3.2 + rand(0, 1) });
  }
  if (coins.st.length > 160) coins.st.splice(0, coins.st.length - 160);
}
function updCoins(dt) {
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), one = new V3(1, 1, 1);
  for (let i = 0; i < 160; i++) {
    const c = coins.st[i];
    if (!c) { m4.makeScale(0, 0, 0); coins.mesh.setMatrixAt(i, m4); continue; }
    c.t -= dt; c.v.y -= 9 * dt; c.p.addScaledVector(c.v, dt); c.r.x += c.vr * dt; c.r.y += c.vr * 0.5 * dt;
    m4.compose(c.p, q.setFromEuler(c.r), one.setScalar(c.t > 0.4 ? 1 : c.t / 0.4)); coins.mesh.setMatrixAt(i, m4);
  }
  coins.st = coins.st.filter(c => c.t > 0);
  coins.mesh.instanceMatrix.needsUpdate = true;
}
