// 共有ジオメトリ・マテリアル・テクスチャとパーティクル
'use strict';

/* ============ SHARED ASSETS ============ */
const GRAD = (() => { const t = new THREE.DataTexture(new Uint8Array([70, 150, 215, 255]), 4, 1, THREE.RedFormat); t.minFilter = t.magFilter = THREE.NearestFilter; t.needsUpdate = true; return t; })();
const keep = o => { o.userData.keep = true; return o; };
const SPH = keep(new THREE.SphereGeometry(1, 24, 16));
const SPH_LO = keep(new THREE.SphereGeometry(1, 12, 8));
const BOX = keep(new THREE.BoxGeometry(1, 1, 1));
const CONE = keep(new THREE.ConeGeometry(1, 1, 12));
const LEG = keep(new THREE.CylinderGeometry(0.13, 0.105, 0.72, 12));
const HOOF = keep(new THREE.CylinderGeometry(0.115, 0.14, 0.16, 12));
const CIRC = keep(new THREE.CircleGeometry(1, 20));
const OUT = keep(new THREE.MeshBasicMaterial({ color: C('#2a1438'), side: THREE.BackSide }));
function toon(color, extra) { return new THREE.MeshToonMaterial(Object.assign({ color: C(color), gradientMap: GRAD }, extra || {})); }
function glowMat(color, k) { return new THREE.MeshBasicMaterial({ color: C(color).multiplyScalar(k || 2) }); }
// 文字入りの看板：両面表示だと裏から鏡文字になるので、片面の板を背中合わせに2枚貼る
function signPanel(w, h, map, extra) {
  const g = new THREE.Group(), geo = new THREE.PlaneGeometry(w, h), mat = new THREE.MeshBasicMaterial(Object.assign({ map }, extra || {}));
  g.add(new THREE.Mesh(geo, mat));
  const back = new THREE.Mesh(geo, mat); back.rotation.y = Math.PI; g.add(back);
  return g;
}

function ctex(w, h, draw, rep, srgb = true) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d'); draw(g, w, h);
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.encoding = THREE.sRGBEncoding;
  t.anisotropy = MAXANI;
  if (rep) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.userData.g = g; t.userData.c = c;
  return t;
}
function speck(g, w, h, n, cols, r0, r1, a) {
  for (let i = 0; i < n; i++) { g.globalAlpha = a * (0.3 + Math.random() * 0.7); g.fillStyle = cols[(Math.random() * cols.length) | 0]; const r = rand(r0, r1); g.fillRect(Math.random() * w, Math.random() * h, r, r); }
  g.globalAlpha = 1;
}
const TEX_SOFT = keep(ctex(64, 64, (g) => { const r = g.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.35, 'rgba(255,255,255,.55)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, 64, 64); }, false, false));
const TEX_STAR = keep(ctex(64, 64, (g) => {
  const r = g.createRadialGradient(32, 32, 0, 32, 32, 14); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, 64, 64);
  g.fillStyle = '#fff'; g.beginPath(); g.moveTo(32, 2); g.quadraticCurveTo(34, 30, 62, 32); g.quadraticCurveTo(34, 34, 32, 62); g.quadraticCurveTo(30, 34, 2, 32); g.quadraticCurveTo(30, 30, 32, 2); g.fill();
}, false, false));
const TEX_PETAL = keep(ctex(64, 64, (g) => {
  g.translate(32, 32); g.rotate(0.5); const r = g.createRadialGradient(0, -4, 2, 0, 0, 26); r.addColorStop(0, '#fff'); r.addColorStop(1, '#ffc2dc');
  g.fillStyle = r; g.beginPath(); g.moveTo(0, -26); g.bezierCurveTo(18, -14, 16, 16, 0, 26); g.bezierCurveTo(-16, 16, -18, -14, 0, -26); g.fill();
}, false, false));
const ZEBRA = keep(ctex(256, 256, (g, w, h) => {
  g.fillStyle = '#f7f7f7'; g.fillRect(0, 0, w, h); g.fillStyle = '#18181c';
  for (let i = 0; i < 12; i++) { const x = i * 22 + 4; g.beginPath(); g.moveTo(x, 0); for (let y = 0; y <= h; y += 16) g.lineTo(x + Math.sin(y * 0.05 + i) * 8, y); for (let y = h; y >= 0; y -= 16) g.lineTo(x + 9 + Math.sin(y * 0.05 + i) * 8 - (Math.abs(y - h / 2) / h) * 6, y); g.fill(); }
}, true));

/* ============ PARTICLES ============ */
class Particles {
  constructor(max, tex, additive) {
    this.max = max; this.cur = 0;
    const g = new THREE.BufferGeometry();
    this.pos = new Float32Array(max * 3); this.col = new Float32Array(max * 3); this.alpha = new Float32Array(max); this.size = new Float32Array(max);
    this.vel = new Float32Array(max * 3); this.life = new Float32Array(max); this.ml = new Float32Array(max); this.s0 = new Float32Array(max); this.gr = new Float32Array(max); this.dr = new Float32Array(max); this.spin = new Float32Array(max);
    g.setAttribute('position', new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('pcolor', new THREE.BufferAttribute(this.col, 3).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('alpha', new THREE.BufferAttribute(this.alpha, 1).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('psize', new THREE.BufferAttribute(this.size, 1).setUsage(THREE.DynamicDrawUsage));
    this.mat = new THREE.ShaderMaterial({
      uniforms: { map: { value: tex }, scale: { value: innerHeight * PR * 0.5 } },
      vertexShader: 'attribute float alpha;attribute float psize;attribute vec3 pcolor;varying float vA;varying vec3 vC;uniform float scale;void main(){vA=alpha;vC=pcolor;vec4 mv=modelViewMatrix*vec4(position,1.0);gl_PointSize=min(psize*scale/-mv.z,256.0);gl_Position=projectionMatrix*mv;}',
      fragmentShader: 'uniform sampler2D map;varying float vA;varying vec3 vC;void main(){vec4 t=texture2D(map,gl_PointCoord);float a=t.a*vA;if(a<0.01)discard;gl_FragColor=vec4(vC*t.rgb,a);}',
      transparent: true, depthWrite: false, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending
    });
    keep(this.mat);
    this.points = new THREE.Points(g, this.mat); this.points.frustumCulled = false;
  }
  emit(x, y, z, vx, vy, vz, life, size, col, grav = 0, drag = 0) {
    const i = this.cur; this.cur = (this.cur + 1) % this.max; const j = i * 3;
    this.pos[j] = x; this.pos[j + 1] = y; this.pos[j + 2] = z; this.vel[j] = vx; this.vel[j + 1] = vy; this.vel[j + 2] = vz;
    this.col[j] = col.r; this.col[j + 1] = col.g; this.col[j + 2] = col.b;
    this.life[i] = life; this.ml[i] = life; this.s0[i] = size; this.gr[i] = grav; this.dr[i] = drag;
  }
  update(dt) {
    const P = this.pos, Vv = this.vel;
    for (let i = 0; i < this.max; i++) {
      if (this.life[i] <= 0) { if (this.alpha[i] !== 0) { this.alpha[i] = 0; } continue; }
      this.life[i] -= dt; const j = i * 3;
      const k = Math.exp(-this.dr[i] * dt);
      Vv[j] *= k; Vv[j + 1] = Vv[j + 1] * k - this.gr[i] * dt; Vv[j + 2] *= k;
      P[j] += Vv[j] * dt; P[j + 1] += Vv[j + 1] * dt; P[j + 2] += Vv[j + 2] * dt;
      const t = Math.max(0, this.life[i] / this.ml[i]);
      this.alpha[i] = Math.min(1, (1 - t) * 8) * Math.min(1, t * 2.5);
      this.size[i] = this.s0[i] * (0.6 + 0.4 * t);
    }
    const a = this.points.geometry.attributes;
    a.position.needsUpdate = a.alpha.needsUpdate = a.psize.needsUpdate = a.pcolor.needsUpdate = true;
  }
  clear() { this.life.fill(0); this.alpha.fill(0); }
}
const dustP = new Particles(3000, TEX_SOFT, false);
const sparkP = new Particles(3000, TEX_STAR, true);
const fireP = new Particles(3500, TEX_SOFT, true);
scene.add(dustP.points, sparkP.points, fireP.points);
