// カメラ
'use strict';

/* ============ CAMERA ============ */
function cameraRunner() {
  return (S.camTarget === null ? null : R.runners.find(r => r.i === S.camTarget)) || R.order[0];
}
function updateCameraVisibility() {
  // 馬目線では観戦対象の頭が視界をふさぐため、その馬だけを描かない。
  const povHorse = S.cam === 'pov' && !S.photo && (S.mode === 'race' || S.mode === 'finish') ? cameraRunner().i : -1;
  horses.forEach((H, k) => { H.root.visible = k !== povHorse; });
}
function cameraFocus() {
  if (S.camTarget !== null) { const r = cameraRunner(); return tp(R.s0 + r.s, r.lane); }
  const lead = R.order[0], third = R.order[Math.min(2, R.order.length - 1)];
  return tp(R.s0 + lead.s - Math.min(lead.s - third.s, 20) * 0.4, (lead.lane + third.lane) / 2);
}
function orbit(t, yaw, pitch, dist) { return t.clone().add(new V3(Math.cos(pitch) * Math.cos(yaw) * dist, Math.sin(pitch) * dist, Math.cos(pitch) * Math.sin(yaw) * dist)); }
function updCamera(dt, rdt) {
  let p, t, fov = 45, lam = 3.5, tl = 6;
  const mode = S.mode;
  // Clear the near-side goal post only during the close-finish camera shot.
  world.userData.photoPost.visible = !(S.photo && (mode === 'race' || mode === 'finish'));
  if (mode === 'lobby') {
    const r = R.runners[S.sel], q = track.pos(R.s0 + r.s, r.lane);
    t = new V3(q.x, q.y + 1.3 * horses[r.i].scale, q.z);
    if (realClock - cam.drag > 4) { const want = cam.base + Math.sin(realClock * 0.28) * 0.85; let d = mod(want - cam.yaw + Math.PI, Math.PI * 2) - Math.PI; cam.yaw += d * Math.min(1, rdt * 1.2); cam.pitch = damp(cam.pitch, 0.2, 1.2, rdt); cam.dist = damp(cam.dist, 7.5, 1.2, rdt); }
    p = orbit(t, cam.yaw, cam.pitch, cam.dist); fov = 42; lam = 2.6;
  } else if (mode === 'intro' || mode === 'countdown') {
    const k = mode === 'intro' ? Math.min(1, S.introT / 3.4) : 1, e = k * k * (3 - 2 * k);
    const g = tp(R.s0 - 4, W / 2), mid = tp(R.s0 - 40, W + 30, 60);
    const end = g.v.clone().addScaledVector(g.dir, -13).addScaledVector(g.n, 12).add(new V3(0, 4.5, 0));
    const start = new V3(0, 150, track.extent);
    p = e < 0.5 ? start.clone().lerp(mid.v, e * 2) : mid.v.clone().lerp(end, (e - 0.5) * 2);
    t = new V3(0, 0, 0).lerp(g.v.clone().addScaledVector(g.dir, 3).add(new V3(0, 1, 0)), Math.min(1, e * 1.3));
    if (mode === 'countdown') { const c = S.cdT || 0; p = end.clone().addScaledVector(g.dir, c * 0.8); }
    fov = 45; lam = 5; tl = 6;
  } else if (mode === 'result') {
    const lead = R.runners.find(r => r.place === 1) || R.order[0];
    const q = track.pos(R.s0 + lead.s, lead.lane); t = new V3(q.x, q.y + 1.5, q.z);
    cam.yaw += rdt * 0.35; p = orbit(t, cam.yaw, 0.25, 9); fov = 40; lam = 2.5;
  } else {
    const me = cameraRunner();
    const mq = tp(R.s0 + me.s, me.lane, 0), mpos = mq.v.clone().add(new V3(0, me.fly * 1.8, 0));
    let c = S.photo ? 'photo' : S.cam;
    if (c === 'broadcast') {
      // Follow the selected horse, or frame the leading pack in automatic mode.
      const lead = me, third = S.camTarget === null ? R.order[Math.min(2, R.order.length - 1)] : me;
      const spr = clamp(lead.s - third.s, 0, 45);
      cam.spr = cam.spr == null ? spr : damp(cam.spr, spr, 2.5, rdt);
      const railway = !!RAIL_LINES[track.def.theme];
      const d = railway ? 36 : 24, asp = Math.max(0.3, camera.aspect);
      // leader sits at +0.18 of the half-width (clear of the standings panel), pack fills toward the left edge
      const halfW = (cam.spr + 3) / 1.0;
      const fv = clamp(2 * Math.atan(halfW / (d * asp)) * 180 / Math.PI, railway ? 58 : 38, 62);
      cam.bf = cam.bf == null ? fv : damp(cam.bf, fv, 2.5, rdt);
      const off = 0.18 * Math.tan(cam.bf * Math.PI / 360) * asp * d;
      const F = tp(R.s0 + lead.s - off + lead.v * 0.08, (lead.lane + third.lane) / 2);
      // Film the railway from the infield, keeping the outer station platforms behind the horses.
      const side = railway ? -1 : track.def.broadcastSide || 1;
      p = F.v.clone().addScaledVector(F.n, d * side).add(new V3(0, 8, 0)); t = F.v.clone().add(new V3(0, 1.2, 0)); fov = cam.bf; lam = 9; tl = 14;
    }
    else if (c === 'chase') { p = mpos.clone().addScaledVector(mq.dir, -7.5).addScaledVector(mq.n, 1.2).add(new V3(0, 3.2, 0)); t = mpos.clone().addScaledVector(mq.dir, 6).add(new V3(0, 1.3, 0)); fov = 52; lam = 5; }
    else if (c === 'aerial') { const F = cameraFocus(); const a = realClock * 0.08; p = F.v.clone().add(new V3(Math.cos(a) * 22, 32, Math.sin(a) * 22)); t = F.v.clone(); fov = 50; lam = 2.5; }
    else if (c === 'front') { const L = tp(R.s0 + me.s, S.camTarget === null ? W / 2 : me.lane); p = L.v.clone().addScaledVector(L.dir, 16).add(new V3(0, 1.9, 0)); const F = cameraFocus(); t = F.v.clone().add(new V3(0, 1.1, 0)); fov = 36; lam = 5; }
    else if (c === 'pov') { const H = horses[me.i]; H.eye.updateWorldMatrix(true, false); p = new V3().setFromMatrixPosition(H.eye.matrixWorld).addScaledVector(mq.dir, 0.25); t = p.clone().addScaledVector(mq.dir, 12).add(new V3(0, -0.8, 0)); fov = 82; lam = 30; tl = 30; }
    else if (c === 'free') { const F = cameraFocus(); t = F.v.clone().add(new V3(0, 1, 0)); p = orbit(t, cam.yaw, cam.pitch, cam.dist); fov = 50; lam = 6; }
    else if (c === 'photo') { const f = tp(track.finishS, W + 7); p = f.v.clone().add(new V3(0, 2.2, 0)); t = tp(track.finishS - 3, W / 2, 1).v; fov = 30; lam = 8; }
    if (FX.lines > 0.3 && c !== 'photo') fov += 8 * Math.min(1, FX.lines);
  }
  cam.pos.set(damp(cam.pos.x, p.x, lam, rdt), damp(cam.pos.y, p.y, lam, rdt), damp(cam.pos.z, p.z, lam, rdt));
  cam.tgt.set(damp(cam.tgt.x, t.x, tl, rdt), damp(cam.tgt.y, t.y, tl, rdt), damp(cam.tgt.z, t.z, tl, rdt));
  cam.fov = damp(cam.fov, fov, 4, rdt);
  camera.position.copy(cam.pos);
  if (FX.shake > 0) { camera.position.x += rand(-1, 1) * FX.shake * 0.4; camera.position.y += rand(-1, 1) * FX.shake * 0.3; FX.shake = Math.max(0, FX.shake - rdt * 1.4); }
  camera.lookAt(cam.tgt);
  updateTunnelView();
  if (Math.abs(camera.fov - cam.fov) > 0.01) { camera.fov = cam.fov; camera.updateProjectionMatrix(); }
  sky.position.copy(camera.position);
  const sf = cam.tgt.clone(); sun.position.copy(sf).addScaledVector(sunDir, 160); sun.target.position.copy(sf);
}

// モナコのトンネル：カメラが中にいるときだけ上の壁と不透明な天井を出し、外からは走路を見通せるようにする
function updateTunnelView() {
  const tunnel = world.userData.tunnel;
  if (!tunnel) return;
  const q = track.pos((tunnel.a + tunnel.b) / 2, W / 2);
  const inside = camera.position.y < q.y + 8.5 && camera.position.y > q.y && (() => {
    let d = Infinity; for (let s = tunnel.a; s <= tunnel.b; s += 4) { const p = track.pos(s, W / 2); d = Math.min(d, Math.hypot(camera.position.x - p.x, camera.position.z - p.z)); } return d < W / 2 + 2.5;
  })();
  tunnel.roofMat.opacity = inside ? 1 : 0.16; tunnel.roofMat.depthWrite = inside;
  tunnel.walls.forEach(wall => { wall.visible = inside; });
}
