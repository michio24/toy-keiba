// 天候（雨・雪・雷）の演出
'use strict';

/* ============ WEATHER ============ */
const RAIN_N = 1800;
const rain = (() => {
  const g = new THREE.BufferGeometry(), pos = new Float32Array(RAIN_N * 6);
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage));
  const m = new THREE.LineBasicMaterial({ color: C('#e4ecf8').multiplyScalar(1.4), transparent: true, opacity: 0.62, depthWrite: false });
  const L = new THREE.LineSegments(g, m); L.frustumCulled = false; L.visible = false; scene.add(L);
  const d = []; for (let i = 0; i < RAIN_N; i++) d.push([rand(-45, 45), rand(-4, 36), rand(-45, 45)]);
  return { L, pos, d, n: 0 };
})();
const snowP = new Particles(2200, TEX_SOFT, false); scene.add(snowP.points);
const wxState = { rainN: 0, snowRate: 0, thunderT: 8, wind: 0.25 };
function wxPalette(w) {
  return { sunny: { grey: 0, sun: 1, hemi: 1, fogFar: 1, rain: 0, snow: 0, sunGlow: 1, exp: 1, sat: 1 }, cloudy: { grey: 0.5, sun: 0.45, hemi: 0.85, fogFar: 0.8, rain: 0, snow: 0, sunGlow: 0.25, exp: 0.93, sat: 0.85 },
    drizzle: { grey: 0.65, sun: 0.32, hemi: 0.75, fogFar: 0.62, rain: 900, snow: 0, sunGlow: 0.1, exp: 0.88, sat: 0.75 }, rain: { grey: 0.85, sun: 0.18, hemi: 0.62, fogFar: 0.45, rain: 1800, snow: 0, sunGlow: 0.03, exp: 0.8, sat: 0.62 },
    flurry: { grey: 0.55, sun: 0.4, hemi: 0.9, fogFar: 0.62, rain: 0, snow: 110, sunGlow: 0.15, exp: 0.95, sat: 0.8, white: 0.25 }, snow: { grey: 0.78, sun: 0.28, hemi: 0.95, fogFar: 0.42, rain: 0, snow: 320, sunGlow: 0.03, exp: 0.92, sat: 0.7, white: 0.55 } }[w];
}
function applyWeather() {
  if (!WR) return;
  const th = WR.th, wx = S.wx, P = wxPalette(wx.w), night = !!track.def.night || track.def.theme === 'neon';
  const grey = C(wx.w === 'snow' || wx.w === 'flurry' ? '#cfd8e2' : night ? '#241c38' : '#8e98a6'), greyTop = C(night ? '#0b0816' : wx.w === 'snow' || wx.w === 'flurry' ? '#9aa6b6' : '#5a6474');
  const u = sky.material.uniforms;
  u.top.value.set(th.sky[0]).lerp(greyTop, P.grey); u.hor.value.set(th.sky[1]).lerp(grey, P.grey); u.bot.value.set(th.sky[2]).lerp(grey, P.grey * 0.7);
  u.sunCol.value.set(th.sunCol).multiplyScalar(P.sunGlow);
  scene.fog.color.set(th.fog[0]).lerp(grey, P.grey); scene.fog.far = th.fog[2] * P.fogFar; scene.fog.near = th.fog[1] * Math.min(1, P.fogFar + 0.1);
  sun.intensity = th.dir[1] * P.sun; WR.hemi.intensity = th.hemi[2] * P.hemi;
  FU.uExp.value = th.exposure * P.exp; wxState.sat = P.sat;
  // wet track: darker surface + puddles
  const dirt = track.def.surf === 'dirt', wet = wx.g;
  WR.tMat.color.setScalar(1 - wet * (dirt ? 0.11 : 0.05));
  if (P.white) WR.tMat.color.lerp(C('#ffffff').multiplyScalar(1.6), P.white * 0.5);
  if (WR.puddles) { world.remove(WR.puddles); WR.puddles.traverse(o => { if (o.geometry) o.geometry.dispose(); }); WR.puddles = null; }
  if (wet >= 2 && track.def.surf !== 'sand') {
    const g = new THREE.Group(), pm = new THREE.MeshStandardMaterial({ color: C(dirt ? '#6f5a4a' : '#8fa3b8'), metalness: 0.85, roughness: 0.06, transparent: true, opacity: 0.6, envMapIntensity: 1.6, depthWrite: false });
    const cg = new THREE.CircleGeometry(1, 20); cg.rotateX(-Math.PI / 2);
    const n = wet === 3 ? 140 : 70, im = new THREE.InstancedMesh(cg, pm, n), m4 = new THREE.Matrix4(), qq = new THREE.Quaternion(), e = new THREE.Euler();
    for (let i = 0; i < n; i++) { const q = track.pos(Math.random() * track.L, rand(0.5, W - 0.5)); m4.compose(new V3(q.x, q.y + 0.04, q.z), qq.setFromEuler(e.set(0, rand(0, 6), 0)), new V3(rand(0.8, 2.6), 1, rand(0.5, 1.4))); im.setMatrixAt(i, m4); }
    im.renderOrder = 2; g.add(im); world.add(g); WR.puddles = g;
  }
  wxState.rainN = P.rain; wxState.snowRate = P.snow; wxState.thunderT = rand(6, 14);
  rain.L.visible = P.rain > 0; rain.L.geometry.setDrawRange(0, P.rain * 2);
  snowP.clear();
  AU.rainLvl(P.rain ? (P.rain > 1000 ? 0.09 : 0.045) : 0);
}
function updWeather(rdt) {
  if (!WR) return;
  const cp = camera.position;
  if (wxState.rainN) {
    const n = wxState.rainN, pos = rain.pos, sp = 34 * rdt, wd = wxState.wind;
    for (let i = 0; i < n; i++) {
      const d = rain.d[i]; d[1] -= sp; d[0] += sp * wd;
      if (d[1] < -6) { d[0] = rand(-45, 45); d[1] = rand(26, 36); d[2] = rand(-45, 45); }
      if (d[0] > 45) d[0] -= 90;
      const x = cp.x + d[0], y = cp.y + d[1], z = cp.z + d[2], j = i * 6;
      pos[j] = x; pos[j + 1] = y; pos[j + 2] = z; pos[j + 3] = x - wd * 1.6; pos[j + 4] = y + 2.2; pos[j + 5] = z;
    }
    rain.L.geometry.attributes.position.needsUpdate = true;
    // splashes around the action
    const t = cam.tgt, k = Math.random() < 0.5 ? 1 : 0, sc = C('#dfeaff').multiplyScalar(1.6);
    for (let i = 0; i < n / 180; i++) { const x = t.x + rand(-25, 25), z = t.z + rand(-25, 25); sparkP.emit(x, t.y - 1.1, z, rand(-0.8, 0.8), rand(1.2, 2.4), rand(-0.8, 0.8), 0.25, 0.25, sc, 9, 0); }
    if (wxState.rainN > 1000 && track.def.theme !== 'dune') {
      wxState.thunderT -= rdt;
      if (wxState.thunderT <= 0) { wxState.thunderT = rand(9, 20); FX.flash = Math.max(FX.flash, 0.45); setTimeout(() => AU.thunder(), 500 + Math.random() * 900); }
    }
  }
  if (wxState.snowRate) {
    wxState.sa = (wxState.sa || 0) + rdt * wxState.snowRate; const c = C('#ffffff');
    while (wxState.sa >= 1) { wxState.sa--; snowP.emit(cp.x + rand(-45, 45), cp.y + rand(2, 26), cp.z + rand(-45, 45), rand(-0.6, 1.2), rand(-2.4, -1.4), rand(-0.6, 0.6), 10, rand(0.7, 1.3), c, 0, 0); }
  }
  snowP.update(rdt);
}
const WX_ICON = {
  sunny: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4.5" fill="currentColor"/><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8"/></svg>',
  cloudy: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 18.5a4.5 4.5 0 0 1-.6-9 6 6 0 0 1 11.4 1.6A3.8 3.8 0 0 1 17.5 18.5z"/></svg>',
  drizzle: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path fill="currentColor" stroke="none" d="M7 14.5a4.5 4.5 0 0 1-.6-9 6 6 0 0 1 11.4 1.6A3.8 3.8 0 0 1 17.5 14.5z"/><path d="M9 18l-.8 2.5M15 18l-.8 2.5"/></svg>',
  rain: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path fill="currentColor" stroke="none" d="M7 13.5a4.5 4.5 0 0 1-.6-9 6 6 0 0 1 11.4 1.6A3.8 3.8 0 0 1 17.5 13.5z"/><path d="M8 16.5l-1.3 4M12.5 16.5l-1.3 4M17 16.5l-1.3 4"/></svg>',
  flurry: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path fill="currentColor" stroke="none" d="M7 13.5a4.5 4.5 0 0 1-.6-9 6 6 0 0 1 11.4 1.6A3.8 3.8 0 0 1 17.5 13.5z"/><circle cx="9" cy="18.5" r="1.1" fill="currentColor"/><circle cx="15" cy="19.5" r="1.1" fill="currentColor"/></svg>',
  snow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9"/></svg>',
};
const GOING_NOTE = {
  turf: ['乾いた走りやすい馬場。時計が速い。', '少し水分を含んだ馬場。わずかに時計がかかる。', '水を含んで重い馬場。時計がかかり、パワー型と道悪の得意な馬が浮上。', 'ぬかるんだ極悪馬場。道悪巧者の出番、苦手な馬は大苦戦。'],
  dirt: ['乾いたダート。砂が深くパワーが要る。', '湿って脚抜きがよくなり、少し時計が速い。', '水を含んで締まり、時計が速い。前に行く馬が有利。', '水が浮くほどの不良馬場。高速決着で逃げ・先行が有利。'],
};
function goingNote() { const sf = track.def.surf; return (sf === 'dirt' ? GOING_NOTE.dirt : GOING_NOTE.turf)[S.wx.g]; }
