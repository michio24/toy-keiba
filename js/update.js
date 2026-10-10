// 毎フレームの馬・観客・レース進行の更新
'use strict';

/* ============ MAIN UPDATE ============ */
const dustCol = new THREE.Color(), tmpC = new THREE.Color();
function updHorses(dt, rdt) {
  const th = THEMES[track.def.theme]; dustCol.set(th.dust); const wetG = S.wx ? S.wx.g : 0; if (wetG >= 2 && track.def.surf !== 'sand') dustCol.lerp(C(track.def.surf === 'dirt' ? '#4a3222' : '#5f6a3c'), 0.75);
  for (const r of R.runners) {
    const H = horses[r.i], q = track.pos(R.s0 + r.s, r.lane), gy = q.y;
    H.root.position.set(q.x, gy + r.fly * (r.flyH || 1.8) + H.hopY, q.z);
    H.root.rotation.z = damp(H.root.rotation.z, Math.atan(track.visGrade(R.s0 + r.s)) * 0.8, 6, rdt);
    const lv = r.pl === undefined ? 0 : (r.lane - r.pl) / Math.max(dt, 1e-4); r.pl = r.lane;
    H.yaw = damp(H.yaw, clamp(-lv * 0.07, -0.35, 0.35), 6, rdt);
    const drifting = r.fx.some(e => e.drift) && track.onCurve(R.s0 + r.s);
    if (H.kind === 'car' || H.kind === 'train') H.drift = damp(H.drift, drifting ? -track.sgn * 0.5 : 0, 7, rdt);
    let face = -q.h + H.yaw + (H.drift || 0);
    if (S.mode === 'lobby' && r.i === S.sel) face += Math.sin(clock * 0.8) * 0.15;
    H.root.rotation.order = 'YZX'; H.root.rotation.y = face;
    animHorse(H, r.v, dt, clock, r.fx.some(e => e.skill));
    if (H.kind === 'bath' && r.v > 0.4 && dt > 0) {
      r.ba = (r.ba || 0) + dt * 8;
      tmpC.set('#c9f4ff');
      while (r.ba >= 1) { r.ba--; dustP.emit(q.x + rand(-0.6, 0.6), gy + H.scale * 1.4, q.z + rand(-0.5, 0.5), -Math.cos(q.h) * 0.6, 0.8, -Math.sin(q.h) * 0.6, 1.2, 0.13, tmpC, 0, 0); }
    }
    if (r.v > 4 && r.fly < 0.5 && dt > 0) {
      r.da = (r.da || 0) + dt * r.v * 0.9;
      const dx = Math.cos(q.h), dz = Math.sin(q.h);
      while (r.da >= 1) { r.da--; if (wetG >= 2) dustP.emit(q.x - dx * 0.9 + rand(-0.3, 0.3), gy + 0.2, q.z - dz * 0.9 + rand(-0.3, 0.3), -dx * r.v * 0.18 + rand(-1, 1), rand(2.5, 4.5), -dz * r.v * 0.18 + rand(-1, 1), rand(0.4, 0.7), rand(0.25, 0.45) * H.scale, dustCol, 14, 0.5); else dustP.emit(q.x - dx * 0.9 + rand(-0.3, 0.3), gy + 0.15, q.z - dz * 0.9 + rand(-0.3, 0.3), -dx * r.v * 0.08 + rand(-0.6, 0.6), rand(0.8, 2.2), -dz * r.v * 0.08 + rand(-0.6, 0.6), rand(0.5, 0.9), rand(0.7, 1.3) * H.scale, dustCol, 3, 2); }
    }
    const act = r.fx.find(e => e.skill || e.cheer);
    if (act && dt > 0) {
      tmpC.set(act.cheer ? '#ffcf3f' : r.def.skill.color).multiplyScalar(3);
      r.sa = (r.sa || 0) + dt * 50;
      while (r.sa >= 1) { r.sa--; sparkP.emit(q.x + rand(-0.6, 0.6), gy + rand(0.5, 2) + r.fly * 1.8, q.z + rand(-0.6, 0.6), -Math.cos(q.h) * 4 + rand(-1, 1), rand(0, 2), -Math.sin(q.h) * 4 + rand(-1, 1), rand(0.4, 0.8), rand(0.5, 1.1), tmpC, -1, 1); }
      if (r.def.kind === 'thoro' && act.skill && Math.random() < dt * 30) dustP.emit(q.x, gy + 2.5, q.z, rand(-3, 3), rand(1, 3), rand(-3, 3), 2, 0.5, C('#ffc2dc'), 1, 0.5);
    }
    if (r.warp) { r.warp = 0; for (let k = 1; k <= 6; k++) { const qq = track.pos(R.s0 + r.s - k, r.lane); for (let j = 0; j < 8; j++) sparkP.emit(qq.x + rand(-0.4, 0.4), qq.y + rand(0.4, 2), qq.z + rand(-0.4, 0.4), 0, 0.5, 0, 0.6, 1.2, C('#7dffcf').multiplyScalar(3), 0, 0); } FX.shake = Math.max(FX.shake, 0.25); }
    if (r.def.kind === 'bullet' && r.v > 8 && Math.random() < rdt * 40) sparkP.emit(q.x - Math.cos(q.h) * 1.2 + rand(-0.2, 0.2), gy + rand(1, 1.5) * H.scale + r.fly * 1.8, q.z - Math.sin(q.h) * 1.2 + rand(-0.2, 0.2), -Math.cos(q.h) * 3, 0, -Math.sin(q.h) * 3, 0.45, 0.5, C('#cfe0ff').multiplyScalar(2.5), 0, 0);
    if (r.def.kind === 'gold' && Math.random() < rdt * 5) sparkP.emit(q.x + rand(-0.8, 0.8), gy + rand(1, 2.2) + r.fly * 1.8, q.z + rand(-0.8, 0.8), 0, rand(0.5, 1.5), 0, 0.9, rand(0.4, 0.8), C('#ffd23f').multiplyScalar(3), 0, 0);
    if (r.def.kind === 'unicorn' && Math.random() < rdt * 3) sparkP.emit(q.x + Math.cos(q.h) * 1.1, gy + 2.6 * H.scale + r.fly * 1.8, q.z + Math.sin(q.h) * 1.1, 0, 0.6, 0, 0.8, 0.5, C('#fff0a0').multiplyScalar(3), 0, 0);
  }
}
function updCrowd(t, rdt) {
  if (!crowd) return;
  const u = crowd.userData, m4 = new THREE.Matrix4();
  const target = S.mode === 'race' ? 0.35 + 0.9 * clamp((raceSectionDistance(R.order[0], R) / R.D - 0.6) / 0.4, 0, 1) : S.mode === 'lobby' ? 0.15 : 0.5;
  u.exc = damp(u.exc, target, 0.7, rdt);
  for (let i = 0; i < u.base.length; i++) { const b = u.base[i]; const j = Math.max(0, Math.sin(t * b[4] + b[3])) * 0.35 * u.exc; m4.makeTranslation(b[0], b[1] + j, b[2]); crowd.setMatrixAt(i, m4); }
  crowd.instanceMatrix.needsUpdate = true;
}
function updRace(dt, rdt) {
  if (S.playType !== 'crash' || !S.crash || S.crash.settled) { updRaceFrame(dt, rdt); return; }
  // The wall-clock accumulator also advances slow-motion at fixed intervals.
  const c = S.crash;
  c.wallAcc += rdt;
  while (c.wallAcc + 1e-10 >= CRASH_STEP && !c.settled) {
    c.wallAcc -= CRASH_STEP;
    timeScale = damp(timeScale, timeTarget, 8, CRASH_STEP);
    const simDt = CRASH_STEP * timeScale;
    clock += simDt; realClock += CRASH_STEP;
    updRaceFrame(simDt, CRASH_STEP);
  }
}
function updRaceFrame(dt, rdt) {
  if (S.mode === 'intro') {
    S.introT += rdt;
    R.runners.forEach(r => { r.v = r.s < -1.35 ? 3.7 : 0; r.s = Math.min(-1.3, r.s + r.v * rdt); });
    if (S.introT >= 3.5) { setMode('countdown'); S.cdT = 0; S.cdN = 3; big('3', '', 900); AU.beep(false); say('ゲートイン完了…'); }
  } else if (S.mode === 'countdown') {
    R.runners.forEach(r => r.v = 0);
    S.cdT += rdt;
    const n = 3 - Math.floor(S.cdT);
    if (n !== S.cdN && n > 0) { S.cdN = n; big(String(n), '', 900); AU.beep(false); }
    if (S.cdT >= 3) {
      setMode('race'); R.running = true; big('GO!!', '', 1000); AU.beep(true); FX.flash = 0.45; FX.shake = 0.5; crowd.userData.exc = 1;
      RC.emit('start', {}, true);
      if (S.crash && S.crash.point <= 1) { settleCrash('crash', 1); return; }
    }
  }
  if (R.running) {
    R.acc += dt; const h = 1 / 60; let n = 0;
    while (R.acc + 1e-10 >= h && n < 15 && R.running) {
      if (S.playType === 'crash') {
        const positions = R.runners.map(r => r.s), before = R.t;
        const rank = R.runners.slice().sort((a, b) => b.s - a.s || a.i - b.i).findIndex(r => r.i === S.myBet.h) + 1;
        stepRace(R, h, true);
        const event = advanceCrash(S.crash, rank, h);
        S.crash.multiplier = event.multiplier;
        if (event.reason) {
          R.runners.forEach((r, i) => { r.s = lerp(positions[i], r.s, clamp(event.elapsed / h, 0, 1)); });
          R.t = before + event.elapsed;
          settleCrash(event.reason, event.multiplier); return;
        }
      } else {
        stepRace(R, h, true);
        if (R.finishPhotoPending) {
          R.finishPhotoPending = false;
          R.finishPhoto = captureFinishPhoto(R.runners[S.myBet.h]);
        }
      }
      R.acc -= h; n++;
    }
    if (n === 15) R.acc = 0;
    gate.open = Math.min(1, gate.open + rdt * 6); gate.t += dt;
    if (gate.t > 3) { gate.slide = Math.min(1, gate.slide + dt * 0.35); gate.g.position.copy(gate.base).addScaledVector(gate.n, gate.slide * gate.slide * 45); if (gate.slide >= 1) gate.g.visible = false; }
    gate.doors.forEach(d => d.pv.rotation.y = d.s * gate.open * 1.5);
    const me = R.runners[S.myBet.h];
    if (S.mode === 'race') {
      if (!me.fin) S.cheer = Math.min(100, S.cheer + dt * 8.5 * (me.def.sk === 'urara' ? 2 : 1) + (me.rank < (me.pr || 9) ? 6 : 0));
      me.pr = me.rank;
      commentary();
      const lead = R.order[0], second = R.order[1];
      if (S.camTarget === null && !R.continuous && !S.photoDone && !lead.fin && R.D - lead.s < 16 && (lead.s - second.s) < 3.2) { S.photoDone = true; S.photo = true; timeTarget = 0.28; slowUntil = realClock + 99; }
      if (S.photoDone && !S.photoEnd && lead.fin && realClock - (R.firstFinT || realClock) > 0.9) { S.photoEnd = true; S.photo = false; timeTarget = 1; slowUntil = 0; }
      const hotNow = !R.continuous && !me.fin && me.s / R.D > 0.8 && me.rank <= 3 && (R.order[0].s - me.s) < 3.6;
      const hel = $('#hot');
      if (hotNow && !flags.hot) { flags.hot = true; hel.classList.add('on'); AU.heart(); FX.shake = Math.max(FX.shake, 0.2); }
      if (!hotNow && flags.hot) { flags.hot = false; hel.classList.remove('on'); }
      if (hotNow && Math.random() < rdt * 1.4) AU.heart();
      if (!R.continuous && (R.finished >= 8 || (R.firstFinT && realClock - R.firstFinT > 14))) { setMode('finish'); S.finT = realClock; hel.classList.remove('on'); }
    }
    if (S.mode === 'finish' && realClock - S.finT > 1.6) { timeTarget = 1; showResult(); }
  }
  if (slowUntil && realClock > slowUntil && !S.photo) { timeTarget = 1; slowUntil = 0; }
}
