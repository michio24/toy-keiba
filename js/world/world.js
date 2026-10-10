// ワールド（競馬場）の組み立てと、ファンタジーコースの共通部品
'use strict';

/* ============ WORLD ============ */
let WR = null;
let world = null, track = null, R = null, sun = null, sunDir = new V3(0, 1, 0), sky = null, amb = null, board = null, gate = null, crowd = null, themeUpd = [], boardPos = new V3();
let themeFinish = null, themeReset = null, themeDetails = [];
function lightQuality() { const q = $('#quality').value; return q === 'low' || (q === 'auto' && matchMedia('(max-width:760px)').matches); }
function applyThemeQuality() {
  const low = lightQuality();
  themeDetails.forEach(o => { if (o.isInstancedMesh) o.count = low ? Math.ceil(o.userData.fullCount / 2) : o.userData.fullCount; else o.visible = !low; });
}
function disposeWorld() {
  if (!world) return;
  scene.remove(world);
  const disposed = new Set();
  const release = o => { if (o && !o.userData.keep && !disposed.has(o)) { disposed.add(o); o.dispose(); } };
  world.traverse(o => {
    if (o.isInstancedMesh || (o.isLight && o.shadow)) o.dispose();
    release(o.geometry);
    if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => { if (m.userData.keep) return; ['map', 'emissiveMap'].forEach(k => release(m[k])); release(m); });
  });
  if (amb) amb.mat.dispose();
  world = null;
  amb = null; themeFinish = themeReset = null; themeDetails = []; themeUpd = [];
}
function drawBiscuit(g) {
  g.fillStyle = '#e7b66e'; g.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 256; y += 64) for (let x = 0; x < 256; x += 64) {
    g.strokeStyle = '#b88443'; g.lineWidth = 3; g.strokeRect(x + 3, y + 3, 58, 58);
    g.strokeStyle = '#ffdfa0'; g.lineWidth = 2; g.strokeRect(x + 7, y + 7, 50, 50);
    g.fillStyle = '#b98748'; for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(x + 17 + i * 15, y + 17 + j * 15, 2, 0, Math.PI * 2); g.fill(); }
  }
}
function drawBasalt(g) {
  g.fillStyle = '#494247'; g.fillRect(0, 0, 256, 256);
  speck(g, 256, 256, 1800, ['#332e38', '#63565a', '#796865'], 1, 4, 0.7);
  g.strokeStyle = '#2d2931'; g.lineWidth = 2;
  for (let y = 0; y < 256; y += 64) { g.beginPath(); g.moveTo(0, y); for (let x = 0; x <= 256; x += 32) g.lineTo(x, y + Math.sin(x * 0.1 + y) * 12); g.stroke(); }
}
function addBox(parent, size, pos, mat, rot, ol = 0) { return part(parent, BOX, mat, pos, size, rot, ol); }
function skyMat(th) {
  return new THREE.ShaderMaterial({
    uniforms: { top: { value: C(th.sky[0]) }, hor: { value: C(th.sky[1]) }, bot: { value: C(th.sky[2]) }, sunDir: { value: new V3(...th.sun).normalize() }, sunCol: { value: C(th.sunCol) }, sunSize: { value: th.sunSize } },
    vertexShader: 'varying vec3 vDir;void main(){vDir=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
    fragmentShader: 'uniform vec3 top,hor,bot,sunDir,sunCol;uniform float sunSize;varying vec3 vDir;void main(){vec3 d=normalize(vDir);float h=d.y;vec3 c=h>0.0?mix(hor,top,pow(clamp(h,0.0,1.0),0.55)):mix(hor,bot,pow(clamp(-h*3.0,0.0,1.0),0.7));float s=max(dot(d,normalize(sunDir)),0.0);c+=sunCol*(pow(s,sunSize)*7.0+pow(s,7.0)*0.35+pow(s,48.0)*0.7);gl_FragColor=vec4(c,1.0);}',
    side: THREE.BackSide, depthWrite: false
  });
}
function spotOutside(minL, maxL, avoidHome) {
  for (let tries = 0; tries < 20; tries++) {
    const s = Math.random() * track.L; let lane = W + rand(minL, maxL);
    if (avoidHome && s > track.homeS0 - 6 && s < track.homeS1 + 6) lane = W + rand(Math.max(minL, 52), maxL + 40);
    const q = track.pos(s, lane);
    return new V3(q.x, track.groundH(q.x, q.z), q.z);
  }
}
function spotInfield() {
  for (let tries = 0; tries < 30; tries++) {
    const s = Math.random() * track.L; const q = track.pos(s, -rand(8, Math.max(12, track.R - 14)));
    const p = new V3(q.x, track.groundH(q.x, q.z), q.z);
    if (p.distanceTo(boardPos) > 26) return p;
  }
  const q = track.pos(track.L * 0.5, -30); return new V3(q.x, track.groundH(q.x, q.z), q.z);
}
function buildWorld(ti) {
  disposeWorld(); themeUpd = [];
  const def = TRACKS[ti], th = THEMES[def.theme];
  track = new Track(def);
  world = new THREE.Group(); scene.add(world);
  dustP.clear(); sparkP.clear(); fireP.clear();

  sky = new THREE.Mesh(new THREE.SphereGeometry(1000, 48, 24), skyMat(th)); sky.renderOrder = -10; sky.frustumCulled = false; world.add(sky);
  if (th.stars) {
    const n = 1400, a = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { const u = Math.random() * Math.PI * 2, v = Math.acos(rand(0.05, 1)); a[i * 3] = Math.sin(v) * Math.cos(u) * 900; a[i * 3 + 1] = Math.cos(v) * 900; a[i * 3 + 2] = Math.sin(v) * Math.sin(u) * 900; }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(a, 3));
    const st = new THREE.Points(g, new THREE.PointsMaterial({ color: C('#ffffff').multiplyScalar(1.6), size: 1.7 * PR, sizeAttenuation: false, fog: false, transparent: true, opacity: 0.9, depthWrite: false }));
    st.frustumCulled = false; sky.add(st);
  }
  scene.fog = new THREE.Fog(C(th.fog[0]), th.fog[1], th.fog[2]);
  const hemi = new THREE.HemisphereLight(C(th.hemi[0]), C(th.hemi[1]), th.hemi[2] * (th.stars ? 1 : 1.15)); world.add(hemi);
  sun = new THREE.DirectionalLight(C(th.dir[0]), th.dir[1]);
  sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
  const sc = sun.shadow.camera; sc.left = -75; sc.right = 75; sc.top = 75; sc.bottom = -75; sc.near = 1; sc.far = 420;
  sun.shadow.bias = -0.0005; sun.shadow.normalBias = 0.04;
  world.add(sun, sun.target);
  sunDir = new V3(...th.light).normalize();

  // ground
  const gt = {
    biscuit: drawBiscuit, basalt: drawBasalt,
    grass: g => { g.fillStyle = '#6cbf5c'; g.fillRect(0, 0, 256, 256); speck(g, 256, 256, 2600, ['#5aa84c', '#7fd06b', '#8fdc78', '#4f9a44'], 1, 3, 0.8); },
    // 屋久島の森の床：厚い苔に、落ち葉と杉の葉が散る
    moss: g => {
      g.fillStyle = '#3d6e45'; g.fillRect(0, 0, 256, 256);
      for (let i = 0; i < 90; i++) { g.fillStyle = `rgba(${Math.random() < 0.5 ? '96,150,80' : '40,84,52'},${rand(0.25, 0.5)})`; g.beginPath(); g.ellipse(rand(0, 256), rand(0, 256), rand(6, 18), rand(4, 12), rand(0, 3), 0, Math.PI * 2); g.fill(); }
      speck(g, 256, 256, 2200, ['#4f8a4c', '#355f3e', '#5c964f', '#2f5638'], 1, 3, 0.8); speck(g, 256, 256, 120, ['#7a5a3e', '#8a6a48', '#5e4632'], 1, 2.4, 0.7);
    },
    // 散った花びらの積もる春の草地
    petalGrass: g => { g.fillStyle = '#74c260'; g.fillRect(0, 0, 256, 256); speck(g, 256, 256, 2400, ['#62ae50', '#86d26f', '#97dc7e', '#58a149'], 1, 3, 0.8); speck(g, 256, 256, 260, ['#ffd3e5', '#fff0f6', '#ffbcd6'], 1, 2.2, 0.85); },
    // 夜の街のアスファルト：濡れた路面にネオンが小さく映る
    nightCity: g => { g.fillStyle = '#17141f'; g.fillRect(0, 0, 256, 256); speck(g, 256, 256, 2200, ['#1f1b29', '#110f18', '#24202e', '#1a1722'], 1, 3, 0.8); },
    // 市街地：アスファルトと舗装の灰色
    city: g => { g.fillStyle = '#a3a69f'; g.fillRect(0, 0, 256, 256); speck(g, 256, 256, 2600, ['#979a93', '#b1b3ac', '#8d918b', '#aaa79c'], 1, 3, 0.8); },
    winter: g => { g.fillStyle = '#9fa36a'; g.fillRect(0, 0, 256, 256); speck(g, 256, 256, 2600, ['#8e935a', '#b7b77c', '#7f8a52', '#a8a070'], 1, 3, 0.8); },
    snow: g => { g.fillStyle = '#dfe9f6'; g.fillRect(0, 0, 256, 256); speck(g, 256, 256, 1600, ['#dce9fa', '#ffffff', '#cfe0f5'], 1, 4, 0.8); },
    // 薄明の雪原：青い影を帯びた雪に、風が刻んだ波（サスツルギ）と、雪から顔を出す低木
    snowField: g => {
      g.fillStyle = '#c9d8ea'; g.fillRect(0, 0, 256, 256);
      for (let y = 0; y < 256; y += 12) { g.strokeStyle = `rgba(255,255,255,${rand(0.25, 0.5)})`; g.lineWidth = rand(2, 4); g.beginPath(); for (let x = 0; x <= 256; x += 8) g.lineTo(x, y + Math.sin(x * 0.045 + y) * 4); g.stroke(); }
      speck(g, 256, 256, 1400, ['#bccde3', '#dbe6f3', '#b2c4dc'], 1, 3, 0.8); speck(g, 256, 256, 40, ['#6f6a62', '#5d6b5a'], 0.6, 1.4, 0.6);
    },
    // お菓子の国の草原：ミントの芝に、色とりどりのスプリンクルと粉砂糖
    sugarMeadow: g => {
      g.fillStyle = '#9fd9a8'; g.fillRect(0, 0, 256, 256);
      speck(g, 256, 256, 2200, ['#8fcf9a', '#b4e6b8', '#a6dcae', '#c3ecc0'], 1, 3, 0.8);
      for (let i = 0; i < 70; i++) { g.save(); g.translate(rand(0, 256), rand(0, 256)); g.rotate(rand(0, Math.PI)); g.fillStyle = ['#ff7fab', '#ffe27a', '#7fc4ff', '#b99cff', '#ffffff'][i % 5]; g.fillRect(-3, -1, 6, 2.2); g.restore(); }
      speck(g, 256, 256, 260, ['#ffffff'], 1, 2, 0.7);
    },
    // 火山砂：ブロモ山のまわりの灰色の砂の海。風が刻む細かな筋と、黒い溶岩の粒
    ash: g => { g.fillStyle = '#9a938e'; g.fillRect(0, 0, 256, 256); for (let y = 0; y < 256; y += 9) { g.strokeStyle = 'rgba(70,62,62,.16)'; g.lineWidth = 2; g.beginPath(); for (let x = 0; x <= 256; x += 8) g.lineTo(x, y + Math.sin(x * 0.05 + y * 0.7) * 3); g.stroke(); } speck(g, 256, 256, 1500, ['#7d7572', '#b0a9a2', '#5f5858', '#a69b8c'], 1, 3, 0.7); },
    seabed: g => { g.fillStyle = '#b9ad88'; g.fillRect(0, 0, 256, 256); for (let y = 0; y < 256; y += 11) { g.strokeStyle = 'rgba(120,105,70,.2)'; g.lineWidth = 2; g.beginPath(); for (let x = 0; x <= 256; x += 8) g.lineTo(x, y + Math.sin(x * 0.06 + y * 0.4) * 3); g.stroke(); } speck(g, 256, 256, 900, ['#d3c8a6', '#a49874', '#e2d9bd'], 1, 2, 0.7); speck(g, 256, 256, 120, ['#7e9a6a', '#a0897a'], 1, 3, 0.6); },
    sand: g => { g.fillStyle = '#e4b271'; g.fillRect(0, 0, 256, 256); for (let y = 0; y < 256; y += 9) { g.strokeStyle = 'rgba(160,100,40,.18)'; g.beginPath(); for (let x = 0; x <= 256; x += 8) g.lineTo(x, y + Math.sin(x * 0.05 + y) * 3); g.stroke(); } speck(g, 256, 256, 900, ['#f0c488', '#d29c5a'], 1, 2, 0.7); },
    // サハラの砂の海：夕陽に染まる橙の砂に、風が刻んだ風紋と、ところどころに黒い礫（ハマダ）
    erg: g => {
      g.fillStyle = '#d99a5a'; g.fillRect(0, 0, 256, 256);
      for (let y = 0; y < 256; y += 8) { g.strokeStyle = `rgba(${Math.random() < 0.5 ? '150,80,35' : '255,214,150'},${rand(0.14, 0.28)})`; g.lineWidth = rand(1.5, 2.5); g.beginPath(); for (let x = 0; x <= 256; x += 8) g.lineTo(x, y + Math.sin(x * 0.045 + y * 0.6) * 3.5); g.stroke(); }
      speck(g, 256, 256, 900, ['#f0bc7c', '#cf8f50', '#e9ad6a'], 1, 2, 0.7); speck(g, 256, 256, 50, ['#5a3f2e', '#3e2e24'], 1, 2.4, 0.7);
    }
  }[th.ground];
  const gTex = ctex(256, 256, gt, true); gTex.repeat.set(260, 260);
  let gMat;
  if (th.ground === 'nightCity') {
    const em = ctex(256, 256, g => { g.fillStyle = '#000'; g.fillRect(0, 0, 256, 256); for (let i = 0; i < 26; i++) { g.fillStyle = ['#ff3fd0', '#39f3ff', '#ffcf3f', '#8b5cff'][i % 4]; g.globalAlpha = rand(0.12, 0.35); g.fillRect(rand(0, 256), rand(0, 256), rand(1, 3), rand(6, 20)); } g.globalAlpha = 1; }, true);
    em.repeat.set(260, 260);
    gMat = toon('#ffffff', { map: gTex, emissive: C('#ffffff'), emissiveMap: em, emissiveIntensity: 1 });
  } else gMat = toon('#ffffff', { map: gTex });
  // Keep near-coplanar harbor water and asphalt clear of terrain at long distances.
  const groundDepthOffset = def.theme === 'monaco' || RAIL_LINES[def.theme] ? { polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 2 } : {};
  Object.assign(gMat, groundDepthOffset);
  // 海の底：海面の揺らぎが落とす光の網（コースティクス）
  if (def.theme === 'pearlOcean') seaCaustics(gMat);
  if (def.theme === 'skyGarden') {
    // A finite floating island; no infinite ground plane beneath the clouds.
    const stone = toon('#a8a6bc'), top = new THREE.Mesh(new THREE.CircleGeometry(1, 64), gMat);
    const rx = track.halfX + 110, rz = track.halfZ + 100;
    top.rotation.x = -Math.PI / 2; top.scale.set(rx, rz, 1); top.position.y = -0.04; top.receiveShadow = true; world.add(top);
    // Open undersides avoid overlapping caps on low-precision WebGL depth buffers.
    part(world, new THREE.CylinderGeometry(1, 1, 6, 64, 1, true), stone, [0, -3.04, 0], [rx, 1, rz], null, 0);
    part(world, new THREE.ConeGeometry(1, 1, 48, 1, true), stone, [0, -24.04, 0], [rx, 36, rz], [Math.PI, 0, 0], 0);
  } else if (track.hasElev && def.theme !== 'neon') {
    // 竜の火口は外の斜面が長いので、砂の海まで下り切る広さを取る
    const sz = Math.ceil(track.extent + (def.theme === 'dragonCrater' ? 230 : 120)) * 2, seg = Math.min(260, Math.ceil(sz / (def.theme === 'dragonCrater' ? 4 : 6)));
    const g = new THREE.PlaneGeometry(sz, sz, seg, seg); g.rotateX(-Math.PI / 2);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) p.setY(i, track.groundH(p.getX(i), p.getZ(i)));
    g.computeVertexNormals();
    if (def.theme === 'dragonCrater') craterTint(g);
    const tex2 = gTex.clone(); tex2.needsUpdate = true; tex2.repeat.set(sz / 10, sz / 10);
    const hill = new THREE.Mesh(g, toon('#ffffff', { map: tex2, vertexColors: def.theme === 'dragonCrater', ...groundDepthOffset })); hill.receiveShadow = true; world.add(hill);
    if (def.theme === 'pearlOcean') seaCaustics(hill.material);
    // 竜の火口は火口の底が地平より深いので、火口の上に穴をあけた輪にする
    const crater = def.theme === 'dragonCrater', ground = new THREE.Mesh(crater ? new THREE.RingGeometry(380, 1900, 96, 1) : new THREE.PlaneGeometry(2600, 2600), gMat);
    ground.rotation.x = -Math.PI / 2; ground.position.y = Math.min(-0.2, ...track.ys) - (def.zones ? 1 : 0); ground.receiveShadow = true; world.add(ground);
    if (crater) ground.position.set(track.crater.x, ground.position.y, track.crater.z);
  } else {
    const size = Math.max(2600, (track.extent + 200) * 2);
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(size, size), gMat); ground.rotation.x = -Math.PI / 2; ground.position.y = -0.03; ground.receiveShadow = true; world.add(ground);
  }

  // track surface
  const surfDraw = {
    biscuit: drawBiscuit, basalt: drawBasalt,
    railway: g => { g.fillStyle = '#92988e'; g.fillRect(0, 0, 256, 256); speck(g, 256, 256, 2800, ['#677369', '#b8bcb0', '#d0cbb9'], 1, 3, 0.8); },
    whiteDirt: g => { g.fillStyle = '#d9cdb4'; g.fillRect(0, 0, 256, 256); speck(g, 256, 256, 2200, ['#f0e6d0', '#c6b99c', '#e5d8bd'], 1, 3, 0.55); },
    asphalt: g => { g.fillStyle = '#555e68'; g.fillRect(0, 0, 256, 256); speck(g, 256, 256, 2400, ['#68717b', '#454d57', '#7c858c'], 1, 2, 0.6); },
    turf: g => { for (let x = 0; x < 256; x += 64) { g.fillStyle = (x / 64) % 2 ? '#55b556' : '#63c761'; g.fillRect(x, 0, 64, 256); } speck(g, 256, 256, 2200, ['#4aa04a', '#79d672', '#8ee383'], 1, 3, 0.55); },
    dirt: g => { g.fillStyle = '#9b6a45'; g.fillRect(0, 0, 256, 256); for (let y = 0; y < 256; y += 6) { g.fillStyle = `rgba(${Math.random() < 0.5 ? '60,35,20' : '190,140,100'},${rand(0.05, 0.14)})`; g.fillRect(0, y, 256, rand(1, 3)); } speck(g, 256, 256, 1600, ['#7a4e30', '#b98559', '#5e3a22'], 1, 3, 0.7); },
    snow: g => { g.fillStyle = '#e6eef9'; g.fillRect(0, 0, 256, 256); for (let y = 0; y < 256; y += 7) { g.fillStyle = `rgba(150,180,220,${rand(0.05, 0.14)})`; g.fillRect(0, y, 256, rand(1, 2.5)); } speck(g, 256, 256, 900, ['#ffffff', '#d6e4f7'], 1, 3, 0.8); },
    sand: g => { g.fillStyle = '#e8b673'; g.fillRect(0, 0, 256, 256); for (let y = 0; y < 256; y += 10) { g.strokeStyle = 'rgba(150,90,35,.22)'; g.lineWidth = 2; g.beginPath(); for (let x = 0; x <= 256; x += 8) g.lineTo(x, y + Math.sin(x * 0.07 + y * 0.3) * 2.5); g.stroke(); } speck(g, 256, 256, 1000, ['#f3cc92', '#c98f50'], 1, 2, 0.7); }
  }[def.surfaceLook || def.surf];
  const sTex = ctex(256, 256, surfDraw, true);
  const N = Math.ceil(track.L / 2), pos = [], uv = [], idx = [];
  for (let i = 0; i <= N; i++) {
    const s = i / N * track.L, a = track.pos(s, -1.6), b = track.pos(s, W + 1.6);
    pos.push(a.x, a.y + 0.02, a.z, b.x, b.y + 0.02, b.z); uv.push(s / 16, 0, s / 16, 1);
    if (i < N) { const k = i * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
  }
  const tg = new THREE.BufferGeometry(); tg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); tg.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); tg.setIndex(idx); tg.computeVertexNormals(); if (track.sgn < 0) { const nm = tg.attributes.normal; for (let i = 0; i < nm.count; i++) nm.setXYZ(i, -nm.getX(i), -nm.getY(i), -nm.getZ(i)); tg.index.array.reverse(); }
  const tMesh = new THREE.Mesh(tg, toon('#ffffff', { map: sTex })); tMesh.receiveShadow = true; world.add(tMesh);
  if (def.theme === 'pearlOcean') seaCaustics(tMesh.material, 0.7);
  WR = { hemi, tMat: tMesh.material, th, puddles: null };

  // rails
  const railMat = th.railGlow ? glowMat(th.rail, th.railGlow) : toon(th.rail);
  const railMat2 = def.theme === 'neon' ? glowMat('#ff4fd8', 3) : railMat;
  [[-0.9, railMat, def.innerRailGaps], [W + 0.9, railMat2]].forEach(([ln, m, gaps]) => {
    // gaps: 柵を切る区間 [s0, s1]（一本道のみ。他コースが合流する場所）
    const runs = []; let from = 0;
    for (const [g0, g1] of gaps || []) { if (g0 > from) runs.push([from, g0]); from = Math.max(from, g1); }
    if (from < track.L) runs.push([from, track.L]);
    const loop = track.closed && !gaps;
    for (const [a, b] of runs) {
      const np = Math.ceil((b - a) / 3), pts = []; for (let i = 0; i < np + (loop ? 0 : 1); i++) { const q = track.pos(a + i / np * (b - a), ln); pts.push(new V3(q.x, q.y + 1.0, q.z)); }
      const rail = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, loop), np * 2, 0.09, 6, loop), m); rail.castShadow = true; world.add(rail);
    }
    const postS = []; for (let i = 0, s = 0; i < Math.floor(track.L / 4.5); s = ++i * 4.5) if (!(gaps || []).some(([g0, g1]) => s > g0 && s < g1)) postS.push(s);
    const n = postS.length; const posts = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.06, 0.07, 1, 6), toon(def.theme === 'neon' ? '#2a2240' : '#f4f4f4'), n);
    const m4 = new THREE.Matrix4();
    for (let i = 0; i < n; i++) { const q = track.pos(postS[i], ln); m4.makeTranslation(q.x, q.y + 0.5, q.z); posts.setMatrixAt(i, m4); }
    posts.castShadow = true; world.add(posts);
    if (def.theme === 'candy') {
      const caps = [], stripes = [];
      for (let i = 0; i < n; i += 3) { const q = track.pos(i * 4.5, ln); caps.push({ p: new V3(q.x, q.y + 1.6, q.z), s: new V3(0.52, 0.52, 0.52), c: C(i % 2 ? '#ff80ab' : '#7fdfd7') }); stripes.push({ p: new V3(q.x, q.y + 0.7, q.z), s: new V3(0.16, 0.7, 0.16) }); }
      fantasyInst(SPH_LO, toon('#ffffff'), caps); fantasyInst(new THREE.CylinderGeometry(1, 1, 1, 8), toon('#fff2d2'), stripes);
    }
  });

  // furlong poles (every 200m from the finish)
  const poleTex = ctex(32, 128, g => { for (let y = 0; y < 128; y += 16) { g.fillStyle = (y / 16) % 2 ? '#ffffff' : '#e53a2f'; g.fillRect(0, y, 32, 16); } });
  const poleMat = toon('#ffffff', { map: poleTex });
  for (let k = 1; k * 200 < def.D; k++) {
    const q = track.pos(track.finishS - k * 200, -2.2);
    const pole = part(world, new THREE.CylinderGeometry(0.12, 0.12, 3.4, 8), poleMat, [q.x, q.y + 1.7, q.z], null, null, 0);
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: ctex(128, 64, g => { g.fillStyle = '#fff'; g.beginPath(); g.roundRect ? g.roundRect(4, 4, 120, 56, 12) : g.rect(4, 4, 120, 56); g.fill(); g.fillStyle = '#e53a2f'; g.font = '800 40px "Oxanium", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(String(k * 200), 64, 34); }), depthWrite: false }));
    sp.position.set(q.x, q.y + 4.1, q.z); sp.scale.set(2.4, 1.2, 1); world.add(sp);
  }

  // finish line + goal arch
  {
    const f = tp(track.finishS, W / 2);
    const chk = ctex(64, 256, g => { for (let y = 0; y < 256; y += 16) for (let x = 0; x < 64; x += 16) { g.fillStyle = ((x + y) / 16) % 2 ? '#111' : '#fff'; g.fillRect(x, y, 16, 16); } });
    const line = new THREE.Mesh(new THREE.PlaneGeometry(1.2, W + 3.2), toon('#ffffff', { map: chk }));
    line.rotation.x = -Math.PI / 2; line.rotation.z = -f.h; line.position.set(f.v.x, f.v.y + 0.04, f.v.z); line.receiveShadow = true; world.add(line);
    const arch = new THREE.Group(); arch.position.copy(f.v); arch.rotation.y = -f.h; world.add(arch);
    const pm = toon('#ffffff'), am = toon('#ff4f9a');
    const negativePost = addBox(arch, [0.6, 8, 0.6], [0, 4, -W / 2 - 2.6], pm, null, 0.04);
    const positivePost = addBox(arch, [0.6, 8, 0.6], [0, 4, W / 2 + 2.6], pm, null, 0.04);
    world.userData.photoPost = track.sgn > 0 ? positivePost : negativePost;
    world.userData.finishPosts = [negativePost, positivePost];
    addBox(arch, [0.9, 1.8, W + 6.2], [0, 8.2, 0], am, null, 0.03);
    const goalTex = ctex(1024, 128, g => {
      const gr = g.createLinearGradient(0, 0, 1024, 0); gr.addColorStop(0, '#ff4f9a'); gr.addColorStop(0.5, '#ffcf3f'); gr.addColorStop(1, '#ff4f9a');
      g.fillStyle = '#1a0830'; g.fillRect(0, 0, 1024, 128); g.fillStyle = gr; g.font = '92px "Dela Gothic One", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('★ GOAL ★ ゴール ★ GOAL ★', 512, 68);
    });
    for (const s of [1, -1]) { const p = new THREE.Mesh(new THREE.PlaneGeometry(W + 5.6, 1.4), new THREE.MeshBasicMaterial({ map: goalTex, color: C('#ffffff').multiplyScalar(1.8) })); p.position.set(0.46 * s, 8.2, 0); p.rotation.y = s > 0 ? Math.PI / 2 : -Math.PI / 2; arch.add(p); }
    const bulbs = new THREE.InstancedMesh(SPH_LO, glowMat('#fff2c0', 3.2), 40); const m4 = new THREE.Matrix4();
    for (let i = 0; i < 40; i++) { const z = -W / 2 - 2.8 + (i / 39) * (W + 5.6); m4.compose(new V3(0.5, 9.2, z), new THREE.Quaternion(), new V3(0.12, 0.12, 0.12)); bulbs.setMatrixAt(i, m4); }
    arch.add(bulbs);
    themeUpd.push(t => { bulbs.material.color.setScalar(2.2 + Math.sin(t * 8) * 1.2); });
  }

  // Railway platforms replace the common grandstand on the city loop.
  // 箱根の下りもスタンドを置かず、沿道の観客（decorHakone）で盛り上げる
  if (!RAIL_LINES[def.theme] && def.theme !== 'hakone') {
    // standAt・standLen（実寸m）があれば、地図のスタンドの位置と長さに合わせる
    const k0 = def.scale || 1, len = def.standLen ? def.standLen * k0 : Math.min(track.S - 20, def.stand === 'meydan' ? 420 : 250);
    const sc0 = def.standAt != null ? def.standAt * k0 : clamp(track.finishS - len * 0.35, track.homeS0 + len / 2 + 6, track.homeS1 - len / 2 - 6);
    // standGap：外ラチからスタンドまでの離れ（メイダンは外側の芝コースのさらに外に建つ）
    const x0 = -len / 2, z0 = W / 2 + (def.standGap ?? (def.stand === 'meydan' ? 42 : 18));
    let ymin = 1e9; for (let s2 = sc0 - len / 2; s2 <= sc0 + len / 2; s2 += 4) ymin = Math.min(ymin, track.pos(s2, W / 2).y);
    const sf = tp(sc0, W / 2); const stand = new THREE.Group(); stand.position.set(sf.v.x, ymin - 0.3, sf.v.z); stand.rotation.y = -sf.h; stand.scale.z = track.sgn; world.add(stand);
    const tall = def.stand === 'meydan' ? 1.65 : def.stand === 'big' ? 1.35 : 1;
    const tierA = toon(def.theme === 'candy' ? '#ffb9d4' : def.theme === 'neon' ? '#2c2448' : '#f2eef8'), tierB = toon(def.theme === 'candy' ? '#e8c38e' : def.theme === 'neon' ? '#3a2f5c' : '#e3dcef');
    for (let k = 0; k < 8; k++) { const m = addBox(stand, [len, 0.9 * (k + 1) + 0.3, 2.2], [x0 + len / 2, 0.45 * (k + 1) + 0.15, z0 + k * 2.2 + 1.1], k % 2 ? tierA : tierB); m.receiveShadow = true; }
    if (tall > 1) { addBox(stand, [len * 0.8, 9, 16], [x0 + len / 2, 18, z0 + 16], tierA, null, 0.02); for (let j = 0; j < 12; j++) addBox(stand, [len * 0.8 / 12 - 1, 1.2, 0.2], [x0 + len * 0.1 + (j + 0.5) * len * 0.8 / 12, 18, z0 + 7.9], glowMat('#bfe3ff', 1.4)); }
    addBox(stand, [len + 2, 10, 1], [x0 + len / 2, 5, z0 + 18.2], tierA);
    const roof = addBox(stand, [len + 6, 0.8, 22], [x0 + len / 2, 13.2, z0 + 8.5], toon(def.theme === 'neon' ? '#1e1836' : '#ffffff'), [0.08, 0, 0], 0.02);
    roof.receiveShadow = true;
    if (def.stand === 'meydan') {
      // An upturned crescent canopy, enlarged for the toy skyline.
      const pts = [], indices = [], steps = 24;
      for (let i = 0; i <= steps; i++) {
        const u = i / steps * 2 - 1, depth = 42 - 10 * u * u;
        for (let j = 0; j <= 4; j++) {
          const v = j / 4;
          pts.push(u * (len / 2 + 12), 26 + 7 * u * u + 5 * v * v - 3 * v, z0 - 12 + v * depth);
          if (i < steps && j < 4) { const k = i * 5 + j; indices.push(k, k + 5, k + 1, k + 1, k + 5, k + 6); }
        }
      }
      const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3)); geo.setIndex(indices); geo.computeVertexNormals();
      const canopy = new THREE.Mesh(geo, toon('#b7d4df', { side: THREE.DoubleSide })); canopy.castShadow = true; stand.add(canopy);
      for (let j = 0; j < 9; j++) addBox(stand, [len / 9 - 1.5, 0.45, 0.3], [x0 + (j + 0.5) * len / 9, 23, z0 + 7.7], glowMat('#f9d992', 3));
    }
    const strip = addBox(stand, [len + 4, 0.25, 0.5], [x0 + len / 2, 12.3, z0 - 1.6], glowMat(def.theme === 'neon' ? '#ff4fd8' : '#fff4d6', 3));
    for (let x = 0; x <= len; x += len / 5) addBox(stand, [0.5, 13, 0.5], [x0 + x, 6.5, z0 - 1], toon('#d9d3e6'));
    const perRow = Math.floor(len / 0.95), n = perRow * 8;
    crowd = new THREE.InstancedMesh(new THREE.CapsuleGeometry(0.24, 0.34, 3, 8), toon('#ffffff'), n);
    crowd.userData.base = []; const m4 = new THREE.Matrix4(); const cols = ['#ff7eb6', '#ffd166', '#7ce0ff', '#b69cff', '#ffffff', '#ff9f68', '#8ef0a8', '#ff5e7e'].map(C);
    let c = 0;
    for (let k = 0; k < 8; k++) for (let j = 0; j < perRow; j++) {
      const p = new V3(x0 + j * 0.95 + rand(-0.15, 0.15), 0.9 * (k + 1) + 0.46, z0 + k * 2.2 + 1.1 + rand(-0.3, 0.3));
      crowd.userData.base.push([p.x, p.y, p.z, Math.random() * 6, rand(4, 9)]);
      m4.makeTranslation(p.x, p.y, p.z); crowd.setMatrixAt(c, m4); crowd.setColorAt(c, cols[(Math.random() * cols.length) | 0]); c++;
    }
    crowd.userData.exc = 0.2;
    stand.add(crowd);
    if (def.theme === 'clockwork') {
      for (let i = 0; i < n; i++) crowd.setColorAt(i, C(i % 3 ? '#b9cbd1' : '#d6af68'));
      crowd.instanceColor.needsUpdate = true;
    }
    decorLandmarkStand(stand, len, z0, roof, sc0);
  } else {
    crowd = inst(SPH_LO, toon('#ffffff'), [], false);
    crowd.userData.base = []; crowd.userData.exc = 0.2;
  }

  // jumbotron in the infield facing the stands
  {
    // boardLane があればそのレーンへ（峠道は内側が狭いので外側の山側に立てる）。boardAt（実寸m）があれば地図の位置に合わせる
    const bs = def.boardAt != null ? def.boardAt * (def.scale || 1) : clamp(track.finishS - 70, track.homeS0 + 20, track.homeS1 - 20);
    const bf = tp(bs, def.boardLane ?? -Math.min(30, track.R * 0.55));
    boardPos.set(bf.v.x, track.groundH(bf.v.x, bf.v.z), bf.v.z);
    const g = new THREE.Group(); g.position.copy(boardPos); g.rotation.y = -bf.h + (track.sgn < 0 ? Math.PI : 0) + (def.boardLane > W / 2 ? Math.PI : 0); world.add(g);
    if (def.stand === 'big') g.scale.setScalar(1.35);
    const frameM = toon('#231a3d');
    if (def.theme === 'tokyo' || def.theme === 'nakayama' || def.theme === 'kyoto' || def.theme === 'hanshin') {
      // 東京・中山・阪神のマルチ画面ターフビジョン、京都の横長のマルチビジョン（幅64m）：中央の大画面の左右に横長の画面が続く、幅の広い構え
      for (const x of [-27, 27]) {
        addBox(g, [18, 11, 1.4], [x, 11, -0.8], frameM, null, 0.02); addBox(g, [1.2, 5.5, 1.2], [x, 2.75, -0.8], frameM);
        const side = new THREE.Mesh(new THREE.PlaneGeometry(16.6, 9.6), glowMat(x < 0 ? '#7cc7ff' : '#9fe38a', 1.1)); side.position.set(x, 11, 0.01); g.add(side);
      }
    }
    addBox(g, [36, 17, 1.4], [0, 12.5, -0.8], frameM, null, 0.02);
    addBox(g, [1.2, 5, 1.2], [-10, 2.5, -0.8], frameM); addBox(g, [1.2, 5, 1.2], [10, 2.5, -0.8], frameM);
    const tex = ctex(1024, 480, () => {}, false);
    const scr = new THREE.Mesh(new THREE.PlaneGeometry(34, 15.9), new THREE.MeshBasicMaterial({ map: tex, color: C('#ffffff').multiplyScalar(1.5) }));
    scr.position.set(0, 12.5, 0.01); g.add(scr);
    board = { tex, g: tex.userData.g, t: 0 };
  }

  // starting gate
  buildGate();

  // theme decor
  ({ boxHill: decorBoxHill, hakone: decorHakone, skyGarden: decorSkyGarden, candy: decorCandy, moonForest: decorMoonForest, dragonCrater: decorDragonCrater, pearlOcean: decorPearlOcean, clockwork: decorClockwork, sakura: decorSakura, neon: decorNeon, aurora: decorAurora, dune: decorDune, tokyo: decorTokyo, nakayama: decorNakayama, kyoto: decorKyoto, niigata: decorNiigata, longchamp: decorLongchamp, churchill: decorChurchill, hanshin: decorHanshin, chukyo: decorChukyo, kasamatsu: decorKasamatsu, sapporo: decorSapporo, meydan: decorMeydan, shatin: decorShatin, monaco: decorMonaco, yamanote: decorYamanote, osakaLoop: decorOsakaLoop })[def.theme](th);
  if (def.real) decorRacecourseLandmarks();
  if (track.zones.length) decorCourseZones();
  applyThemeQuality();

  FU.uExp.value = th.exposure; bloom.strength = th.bloom[0]; bloom.radius = th.bloom[1]; bloom.threshold = th.bloom[2];
  FU.uHeat.value = def.theme === 'dune' ? 0.0011 : 0;
}

function buildGate() {
  const g = new THREE.Group(); const R0 = track.closed ? mod(track.finishS - track.def.D, track.L) : track.finishS - track.def.D;
  const q = tp(R0, W / 2); g.position.copy(q.v); g.rotation.y = -q.h; world.add(g);
  const white = toon('#f3f4f8'), green = toon('#2f8f66');
  const sw = 1.95 * track.sgn, z0 = (1 - W / 2) * track.sgn - sw / 2;
  for (let j = 0; j <= 8; j++) addBox(g, [2.6, 2.5, 0.14], [-1.3, 1.25, z0 + j * sw], green, null, 0.04);
  addBox(g, [3.0, 0.55, 8 * Math.abs(sw) + 0.4], [-1.3, 2.78, z0 + 4 * sw], white, null, 0.03);
  addBox(g, [0.4, 3.6, 0.4], [-1.3, 1.8, z0 - 0.5 * track.sgn], green); addBox(g, [0.4, 3.6, 0.4], [-1.3, 1.8, z0 + 8 * sw + 0.5 * track.sgn], green);
  const doors = [];
  for (let i = 0; i < 8; i++) {
    const zc = z0 + (i + 0.5) * sw, dm = toon(WAKU[i][0]);
    const pl = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.5), toon('#ffffff', { map: numberTex(i) })); pl.position.set(0.21, 2.78, zc); pl.rotation.y = Math.PI / 2; g.add(pl);
    for (const s of [1, -1]) {
      const hw = Math.abs(sw) / 2; const pv = new THREE.Group(); pv.position.set(0.02, 0, zc - s * (hw - 0.08)); g.add(pv);
      addBox(pv, [0.08, 1.6, hw - 0.1], [0, 1.15, s * (hw - 0.1) / 2], dm, null, 0.05);
      doors.push({ pv, s });
    }
  }
  gate = { g, doors, base: q.v.clone(), n: q.n.clone(), open: 0, slide: 0, t: 0 };
}

function inst(geo, mat, list, shadow = true) {
  const im = new THREE.InstancedMesh(geo, mat, list.length); const m4 = new THREE.Matrix4(), qq = new THREE.Quaternion(), e = new THREE.Euler();
  list.forEach((it, i) => { m4.compose(it.p, qq.setFromEuler(e.set(it.r ? it.r[0] : 0, it.r ? it.r[1] : 0, it.r ? it.r[2] : 0)), it.s); im.setMatrixAt(i, m4); if (it.c) im.setColorAt(i, it.c); });
  im.castShadow = shadow; world.add(im); return im;
}
function mountains(color, n, cap) {
  const g = new THREE.ConeGeometry(1, 1, 7); g.translate(0, 0.5, 0);
  const list = [], caps = [];
  for (let i = 0; i < n; i++) {
    const base = Math.max(560, track.extent + 260), a = rand(0, Math.PI * 2), r = rand(base, base + 260), rr = rand(80, 170), h = rand(70, 170);
    const p = new V3(Math.cos(a) * r, -5, Math.sin(a) * r);
    list.push({ p, s: new V3(rr, h, rr), r: [0, rand(0, 3), 0] });
    if (cap) caps.push({ p: new V3(p.x, p.y + h * 0.68, p.z), s: new V3(rr * 0.33, h * 0.33, rr * 0.33), r: [0, rand(0, 3), 0] });
  }
  inst(g, toon(color, { fog: true }), list, false);
  if (cap) inst(g, toon('#ffffff'), caps, false);
}
function floodTowers(n, lane = W + 11) {
  for (let i = 0; i < n; i++) {
    const s = (i + 0.5) / n * track.L, f = tp(s, lane);
    const g = new THREE.Group(); g.position.copy(f.v); world.add(g);
    addBox(g, [0.8, 34, 0.8], [0, 17, 0], toon('#3b3552'));
    const head = new THREE.Group(); head.position.y = 34; g.add(head); head.lookAt(new V3(f.v.x - f.n.x * 50, 0, f.v.z - f.n.z * 50));
    addBox(head, [7, 3.4, 0.8], [0, 0, 0], toon('#2b2640'));
    addBox(head, [6.4, 2.8, 0.1], [0, 0, 0.46], glowMat('#fffbe8', 5));
  }
}
function ambient(tex, additive, rate, fn, scaleQuality = false) {
  amb = new Particles(1800, tex, additive); world.add(amb.points);
  let acc = 0;
  themeUpd.push((t, dt) => { acc += dt * rate * (scaleQuality && lightQuality() ? 0.4 : 1); while (acc >= 1) { acc--; fn(amb, camera.position); } amb.update(dt); });
}
/* ---- Fantasy scenery: shared primitives, bounded updates and quality controls ---- */
function fantasyInst(geo, mat, list, shadow = true) {
  const mesh = inst(geo, mat, list, shadow); mesh.userData.fullCount = list.length; themeDetails.push(mesh); return mesh;
}
function fantasyGroup(p) { const g = new THREE.Group(); if (p) g.position.copy(p); world.add(g); return g; }
function courseRibbon(start, end, left, right, lift, mat, parent = world) {
  const n = Math.ceil((end - start) / 2), points = [], indices = [];
  for (let i = 0; i <= n; i++) {
    const s = lerp(start, end, i / n), a = track.pos(s, left), b = track.pos(s, right);
    points.push(a.x, a.y + lift, a.z, b.x, b.y + lift, b.z);
    if (i < n) { const k = i * 2; indices.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
  }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(points, 3)); geo.setIndex(indices); geo.computeVertexNormals();
  const mesh = new THREE.Mesh(geo, mat); mesh.receiveShadow = true; parent.add(mesh); return mesh;
}
function decorCourseZones() {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  for (const z of track.zones) {
    const group = fantasyGroup(); group.userData.courseZone = z.id;
    const stripe = new THREE.MeshBasicMaterial({ color: C(z.color), side: THREE.DoubleSide, transparent: true, opacity: 0.8, depthWrite: false });
    courseRibbon(z.start, z.end, 0.4, 1.2, 0.15, stripe, group); courseRibbon(z.start, z.end, W - 1.2, W - 0.4, 0.15, stripe, group);
    const q = tp((z.start + z.end) / 2, W + 9);
    const tex = ctex(512, 160, g => {
      g.fillStyle = '#241b38'; g.fillRect(0, 0, 512, 160); g.strokeStyle = z.color; g.lineWidth = 8; g.strokeRect(4, 4, 504, 152);
      g.textAlign = 'center'; g.fillStyle = z.color; g.font = 'bold 40px sans-serif'; g.fillText(z.name, 256, 65, 480);
      g.fillStyle = '#fff6eb'; g.font = '28px sans-serif';
      g.fillText(z.drain > 0 ? '消耗増・パワーで軽減' : z.recover ? '回復' + (z.agility ? '・器用さが有利' : '・加速') : z.agility ? '器用さが有利' : '加速・消耗軽減', 256, 120, 480);
    }, false);
    const sign = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex })); sign.position.copy(q.v).add(new V3(0, 6, 0)); sign.scale.set(18, 5.6, 1); group.add(sign);
    if (z.drain > 0) {
      const vents = [];
      for (let s = z.start + 8; s < z.end; s += 25) { const p = tp(s, W + 5).v; vents.push({ p: p.clone().add(new V3(0, 1.5, 0)), s: new V3(0.8, 3, 0.8) }); }
      fantasyInst(new THREE.CylinderGeometry(1, 1.4, 1, 8), toon('#674b48'), vents);
      let acc = 0;
      themeUpd.push((t, dt) => { if (reduced.matches || !vents.length) return; acc += dt * (lightQuality() ? 4 : 10); while (acc >= 1) { acc--; const p = vents[(Math.random() * vents.length) | 0].p; fireP.emit(p.x, p.y + 1.5, p.z, rand(-0.4, 0.4), rand(2, 4), rand(-0.4, 0.4), 2, 0.7, C(z.color), 0, 0.1); } });
    } else {
      const arrowGeo = new THREE.BufferGeometry(); arrowGeo.setAttribute('position', new THREE.Float32BufferAttribute([2.5, 0, 0, -1.5, 0, 1.6, -1.5, 0, -1.6], 3)); arrowGeo.computeVertexNormals();
      const n = Math.max(3, Math.floor((z.end - z.start) / 14)), arrows = fantasyInst(arrowGeo, stripe, Array.from({ length: n }, () => ({ p: new V3(), s: new V3(1, 1, 1) })), false);
      const m = new THREE.Matrix4(), rotation = new THREE.Quaternion(), e = new THREE.Euler();
      arrows.userData.droneIgnore = true;
      const update = t => {
        for (let i = 0; i < arrows.count; i++) {
          const s = z.start + mod(i / arrows.count * (z.end - z.start) + (reduced.matches ? 0 : t * z.motion), z.end - z.start), p = track.pos(s, W / 2);
          m.compose(new V3(p.x, p.y + 0.2, p.z), rotation.setFromEuler(e.set(0, -p.h, 0)), new V3(1, 1, 1)); arrows.setMatrixAt(i, m);
        }
        arrows.instanceMatrix.needsUpdate = true;
      };
      update(0); themeUpd.push(update);
    }
  }
}
// インカの石組み：大きさの揃わない花崗岩の切石を、目地の細い段に積む
function incaMasonry(base, shades) {
  return ctex(256, 256, c => {
    c.fillStyle = base; c.fillRect(0, 0, 256, 256);
    for (let y = 0; y < 256;) {
      const h = rand(22, 40), hh = Math.min(h, 256 - y);
      for (let x = -rand(0, 40); x < 256;) { const w = rand(26, 64); c.fillStyle = shades[(Math.random() * shades.length) | 0]; c.fillRect(x + 2, y + 2, w - 4, hh - 4); x += w; }
      y += h;
    }
    speck(c, 256, 256, 900, ['#6f6a62', '#d8d2c4'], 1, 2, 0.35);
  }, true);
}
