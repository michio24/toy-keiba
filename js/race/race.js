// レースのシミュレーションとオッズ計算
'use strict';

/* ============ RACE SIM ============ */
function courseZoneEffect(tr, sa, horse) {
  const zone = tr.zoneAt(sa);
  if (!zone) return { zone: null, speed: 1, drain: 1, recover: 0 };
  const s = mod(sa, tr.L), fade = Math.max(2, (zone.end - zone.start) * 0.12);
  const strength = THREE.MathUtils.smoothstep(Math.min(s - zone.start, zone.end - s), 0, fade);
  const bonus = (zone.speed || 1) - 1 + (zone.power || 0) * (horse.st.pow - 5) + (zone.agility || 0) * (horse.st.agi - 5);
  return { zone, speed: 1 + clamp(bonus, -0.1, 0.12) * strength, drain: 1 + (zone.drain || 0) * strength, recover: (zone.recover || 0) * strength };
}
const TOP = d => 21.2 + d.st.spd * 0.18;
// Distance stays cumulative; only the ability cycle wraps at the configured distance.
function raceSectionDistance(r, R) { return R.continuous ? mod(Math.max(0, r.s), R.D) : r.s; }
function resetRaceSection(r, R) {
  const section = Math.floor(Math.max(0, r.s) / R.D);
  if (!R.continuous || section === (r.section || 0)) return;
  r.section = section; r.st = r.stMax; r.used = false; r.g1 = false; r.pc = false;
  r.fx = r.fx.filter(e => e.cheer);
  r.dec = 0; r.tLane = r.lane; r.warp = 0;
}
function availableTracks(playType) {
  return TRACKS.map((t, i) => ({t, i})).filter(({t}) => playType !== 'crash' || t.closed !== false);
}
function nextTrackIndex(index, playType) {
  for (let offset = 1; offset <= TRACKS.length; offset++) {
    const i = (index + offset) % TRACKS.length, t = TRACKS[i];
    if (!t.manualOnly && (playType !== 'crash' || t.closed !== false)) return i;
  }
  return 0;
}
function makeRace(tr, conds, wx) {
  wx = wx || { w: 'sunny', g: 0 };
  const R = { track: tr, wx, D: tr.def.D, t: 0, s0: tr.closed ? mod(tr.finishS - tr.def.D, tr.L) : tr.finishS - tr.def.D, runners: [], finished: 0, running: false, continuous: false, night: !!tr.def.night || tr.def.theme === 'neon', acc: 0, random: S.playType === 'crash' ? createCrashRaceRandom() : Math.random };
  HORSES.forEach((d, i) => {
    const stMax = 60 + d.st.sta * 9;
    R.runners.push({ def: d, i, s: 0, v: 0, stMax, st: stMax, lane: 1 + i * 1.95, tLane: 1 + i * 1.95, cond: 1 + conds[i] * 0.015, luck: 1 + (R.random() * 2 - 1) * 0.03,
      noise: 0, noiseT: 0, noiseTg: 0, fx: [], used: false, fin: false, place: 0, finT: 0, fly: 0, pc: false, dec: R.random() * 0.4, rank: i + 1 });
  });
  R.order = R.runners.slice();
  R.recoveryStations = tr.stations.filter(s => s.major).map(s => {
    const distance = mod(s.s - R.s0, tr.L);
    return { ...s, distance: distance < 1e-6 ? tr.L : distance };
  });
  return R;
}
function recoverAtStations(r, R, previousS, full) {
  if (r.fin || !R.track.def.stationRecovery) return;
  const end = R.continuous ? r.s : Math.min(r.s, R.D - 1e-6), length = R.track.L;
  for (const station of R.recoveryStations) {
    const first = Math.max(0, Math.floor((previousS - station.distance) / length) + 1);
    const last = Math.floor((end - station.distance) / length);
    for (let lap = first; lap <= last; lap++) {
      r.st = Math.min(r.stMax, r.st + r.stMax * R.track.def.stationRecovery);
      if (full && R.onStation) R.onStation(r, station);
    }
  }
}
function trySkill(r, R, p, dt, full) {
  const note = (txt, good) => { if (full && R.onNote) R.onNote(r, txt, good); };
  const sk = r.def.sk, distance = raceSectionDistance(r, R);
  if (sk === 'goldship' && !r.g1) { r.g1 = true; if (R.random() < 0.3) { r.fx.push({ mult: 0.5, t: 2.2 }); note('まさかの大出遅れ！', false); } }
  if (sk === 'windup' && !r.g1 && distance > 1) { r.g1 = true; r.fx.push({ mult: 1.1, t: 5, then: { mult: 0.965, t: 999, wind: true } }); }
  if (r.used) return;
  const fire = (mult, t, extra) => { r.used = true; r.fx.push(Object.assign({ mult, t, skill: true }, extra || {})); if (full && R.onSkill) R.onSkill(r); };
  switch (r.def.sk) {
    case 'thoro': if (p > 0.75 && r.rank >= 3) fire(1.08, 5); break;
    case 'pony': if (distance > 2.5) fire(1.2, 4); break;
    case 'shiro': if (p >= 0.75 && r.rank > 1) fire(1.1, 5); break;
    case 'unicorn': if (p >= 0.6) { r.st = Math.min(r.stMax, r.st + r.stMax * 0.3); fire(1.05, 6); } break;
    case 'banei': if (p >= 0.7) fire(1.08 + (R.track.def.surf === 'dirt' || R.track.def.surf === 'snow' ? 0.03 : 0), 7); break;
    case 'zebra': if (p > 0.35 && p < 0.85 && R.random() < 0.28 * dt) { r.warp = 1; r.s += 6; fire(1.04, 3); } break;
    case 'pegasus': { const oc = R.track.onCurve(R.s0 + r.s); if (r.pc && !oc && p > 0.45 && p < 0.92) fire(1.09, 4.2, { fly: true }); r.pc = oc; break; }
    case 'mech': if (p >= 0.5) fire(R.night ? 1.13 : 1.10, 4, { then: { mult: 0.97, t: 3 } }); break;
    case 'redhare': if (distance > 3) fire(1.1, 7); break;
    case 'wuzhui': if (p >= 0.75 && r.rank > 1) fire(1.1, 5); break;
    case 'buce': if (p >= 0.6) fire(1.09, 5); break;
    case 'marengo': if (p >= 0.6) { r.st = Math.min(r.stMax, r.st + r.stMax * 0.2); fire(1.05, 6); } break;
    case 'matsukaze': if (p >= 0.7) fire(1.08, 7); break;
    case 'rudolf': if (p >= 0.75) fire(1.07, 6); break;
    case 'brian': if (p >= 0.7 && r.rank > 1) fire(1.1, 5); break;
    case 'rice': if (p >= 0.75 && r.rank >= 2 && r.rank <= 4 && R.leadS - r.s < 10) fire(1.11, 5); break;
    case 'bakushin': if (distance > 3) fire(1.15, 4); break;
    case 'kurofune': if (p >= 0.6) fire(R.track.def.surf === 'dirt' ? 1.1 : 1.06, 6); break;
    case 'equinox': if (p >= 0.7) fire(1.08, 7); break;
    case 'deep': if (p >= 0.78 && r.rank > 1) fire(1.12, 4.5, { fly: true, lift: 0.7 }); break;
    case 'orfe': if (p >= 0.7) { if (R.random() < 0.5) { fire(1.14, 5); note('覚醒した！金色の暴君が爆走！', true); } else { r.tLane = W - 0.9; r.dec = 1.8; fire(0.86, 1.8, { then: { mult: 1.14, t: 4.5, skill: true } }); note('外へ逸走！？…いや、猛然と追ってくる！', false); } } break;
    case 'oguri': if (p >= 0.8 && r.rank >= 2 && r.rank <= 4 && R.leadS - r.s < 10) fire(1.1, 5); break;
    case 'suzuka': if (distance > 3) fire(1.1, 7); break;
    case 'goldship': if (p >= 0.5) fire(1.07, 12); break;
    case 'matsuri': if (p >= 0.7 && r.rank === 1) { r.st = Math.min(r.stMax, r.st + r.stMax * 0.25); fire(1.06, 5); } break;
    case 'urara': if (p >= 0.75) { if (R.random() < 0.2) { fire(1.38, 6, { jackpot: true }); note('奇跡の一勝へ！みんなの声援が届いた！', true); } else r.used = true; } break;
    case 'big31': if (p >= 0.6 && r.rank === 1) fire(1.1, 7); break;
    case 'queen': if (p >= 0.8) { r.v += 2; fire(1.1, 4); } break;
    case 'unbeaten': if (p >= 0.65) { for (const o of R.runners) if (o !== r && !o.fin && Math.abs(o.s - r.s) < 8) o.fx.push({ mult: 0.97, t: 4 }); fire(1.03, 4); } break;
    case 'teio': if (p >= 0.78 && r.rank >= 4) fire(1.12, 5); break;
    case 'haou': if (p >= 0.78 && r.rank >= 2 && R.runners.some(o => o !== r && !o.fin && o.s - r.s > 0 && o.s - r.s < 3.5 && Math.abs(o.lane - r.lane) < 1.6)) { fire(1.08, 4, { thru: true }); note('前は壁！…いや、隙間を突き抜けた！', true); } break;
    case 'choco': if (p >= 0.7) fire(1.08 + (R.track.def.surf === 'snow' ? 0.03 : 0) - (R.track.def.surf === 'sand' ? 0.04 : 0), 5); break;
    case 'bullet': if (p >= 0.7 && !R.track.onCurve(R.s0 + r.s)) fire(1.16, 3); break;
    case 'rock': if (p >= 0.55) fire(1.09, 5); break;
    case 'drift': if (p >= 0.35 && R.track.onCurve(R.s0 + r.s)) fire(1.14, 4, { drift: true }); break;
    case 'maroon': if (p >= 0.5 && R.track.onCurve(R.s0 + r.s)) {
      // 内側の線路へ乗り移る。実際の横移動はレーンAIのsafePathで衝突を確かめながら進む
      r.tLane = 0.9; r.dec = 5;
      fire(1.13, 5, { drift: true });
      note(R.runners.some(o => o.def.sk === 'drift') ? 'ハチロクに負けじと複線ドリフト！' : '電車がドリフト！？隣の線路へ乗り移った！', true);
    } break;
    case 'segway': if (p >= 0.5 && !R.track.onCurve(R.s0 + r.s)) fire(1.1, 5); break;
    case 'hopping': if (p >= 0.55) fire(1.1, 4, { fly: true }); break;
    case 'roller': if (p >= 0.6 && !R.track.onCurve(R.s0 + r.s)) fire(1.12, 5); break;
    case 'bath': if (p >= 0.5) { r.st = Math.min(r.stMax, r.st + r.stMax * 0.2); fire(R.wx.w === 'rain' || R.wx.w === 'drizzle' ? 1.12 : 1.05, 5); } break;
    case 'balloon': if ((p >= 0.4 && R.track.grade(R.s0 + r.s) > 0) || (!R.track.hasElev && p >= 0.75)) fire(1.08, 6, { fly: true }); break;
    case 'sushi': if (p >= 0.75) fire(1.13, 4); break;
    case 'cardboard': if (p >= 0.6) fire(1.1, 6); break;
    case 'waltz': if (p >= 0.45 && R.track.onCurve(R.s0 + r.s)) fire(1.1, 4); break;
    case 'windup': if (p >= 0.6) { r.fx = r.fx.filter(e => !e.wind); fire(1.12, 5); } break;
    case 'gold': if (p >= 0.8) { if (R.random() < 0.35) fire(1.26, 6, { jackpot: true }); else { r.used = true; if (full && R.onFail) R.onFail(r); } } break;
  }
}
function stepRace(R, dt, full) {
  R.t += dt;
  const rs = R.runners;
  const traffic = full ? rs.map(r => ({ i: r.i, s: r.s, v: r.v, lane: r.lane, fin: r.fin, fly: r.fly })) : null;
  const ord = rs.slice().sort((a, b) => { if (a.fin && b.fin) return a.place - b.place; if (a.fin) return -1; if (b.fin) return 1; return b.s - a.s; });
  for (let k = 0; k < ord.length; k++) ord[k].rank = k + 1;
  R.order = ord;
  let leadS = -1e9; for (const r of rs) if (!r.fin && r.s > leadS) leadS = r.s;
  R.leadS = leadS;
  for (const r of rs) {
    const previousS = r.s;
    const d = r.def;
    r.noiseT -= dt; if (r.noiseT <= 0) { r.noiseTg = R.random() * 2 - 1; r.noiseT = 0.8 + R.random() * 1.6; }
    r.noise += (r.noiseTg - r.noise) * Math.min(1, dt * 1.3);
    for (const e of r.fx) { e.t -= dt; if (e.t <= 0 && e.then) { const n = e.then; e.then = null; e.mult = n.mult; e.t = n.t; e.skill = !!n.skill; e.fly = false; e.wind = !!n.wind; } }
    r.fx = r.fx.filter(e => e.t > 0);
    let tgt;
    if (r.fin) tgt = Math.max(7, r.v - 5);
    else {
      const p = raceSectionDistance(r, R) / R.D;
      trySkill(r, R, p, dt, full);
      let f;
      switch (d.style) {
        case 'nige': f = p < 0.65 ? 1 : 0.975; break;
        case 'senko': f = p < 0.4 ? 0.965 : (p < 0.75 ? 0.99 : 1.02); break;
        case 'sashi': f = p < 0.5 ? 0.94 : (p < 0.72 ? 0.975 : 1.055); break;
        default: f = p < 0.55 ? 0.92 : (p < 0.75 ? 0.965 : 1.1);
      }
      if (p >= 0.72) { const kk = R.track.def.kick || 1; f = f > 1 ? 1 + (f - 1) * kk : 1 - (1 - f) / kk; }
      if (p > 0.75) f *= 1 + (d.st.pow - 5) * 0.004;
      f *= 1 + affinityOf(d, R.track.def.surf) * 0.012;
      const ku = R.track.curv(R.s0 + r.s);
      if (ku > 1e-4) f *= 1 - 56 * ku * (0.06 - d.st.agi * 0.005);
      const gr = R.track.grade(R.s0 + r.s);
      if (gr > 0) f *= 1 - gr * (1.5 - d.st.pow * 0.1); else if (gr < 0) f *= 1 - gr * 0.5;
      const zone = courseZoneEffect(R.track, R.s0 + r.s, d);
      f *= zone.speed;
      const zoneId = zone.zone ? zone.zone.id : -1;
      if (full && zone.zone && r.zoneId !== zoneId && R.onZone) R.onZone(r, zone.zone);
      r.zoneId = zoneId;
      const low = r.stMax * 0.15;
      if (r.st <= 0) f *= 0.86; else if (r.st < low) f *= 0.93 + 0.07 * r.st / low;
      f *= r.cond * r.luck * (1 + r.noise * 0.04);
      const gl = R.wx.g;
      if (gl) {
        const dirt = R.track.def.surf === 'dirt', m = mudOf(d);
        if (dirt) { f *= 1 + 0.004 * gl + (d.style === 'nige' || d.style === 'senko' ? 0.004 * gl : 0) + m * 0.002 * gl; }
        else f *= 1 - 0.012 * gl + m * 0.0038 * gl;
      }
      const gap = leadS - r.s; if (gap > 40) f *= 1.04; else if (gap > 20) f *= 1.02;
      for (const e of r.fx) f *= e.mult;
      tgt = TOP(d) * f;
      r.st = clamp(r.st - dt * 2.2 * (1 + R.wx.g * (R.track.def.surf === 'dirt' ? 0.03 : 0.06)) * Math.pow(r.v / TOP(d), 2) * zone.drain + dt * zone.recover, 0, r.stMax);
    }
    const acc = 0.35 + d.st.acc * 0.07;
    r.v += (tgt - r.v) * Math.min(1, acc * dt * (r.v < tgt ? 1 : 1.6));
    const fe = r.fx.find(e => e.fly); const flying = !!fe; if (fe) r.flyH = fe.lift || 1.8;
    r.fly += ((flying ? 1 : 0) - r.fly) * Math.min(1, dt * 3);
    if (full && !r.fin) {
      const start = traffic.find(o => o.i === r.i);
      const ghost = r.fly >= 0.3 || r.fx.some(e => e.thru);
      let blk = null, bd = 1e9;
      for (const o of traffic) { if (o.i === r.i || o.fin || o.fly >= 0.3) continue; const ds = o.s - start.s; if (ds > 0 && ds < 2.8 && Math.abs(o.lane - start.lane) < 1.3 && ds < bd) { bd = ds; blk = o; } }
      if (blk && !ghost && r.v > blk.v) r.v = Math.min(damp(r.v, blk.v, 6, dt), blk.v + Math.max(0, bd - 2.2) / dt);
      // Recheck a short movement horizon; following speed allows a safe pull-out.
      const safePath = lane => {
        const shift = lane - start.lane;
        if (Math.abs(shift) < 1e-6 || ghost) return true;
        const duration = Math.min(0.5, Math.abs(shift) / 2.2), lateralV = Math.sign(shift) * 2.2;
        for (const o of traffic) {
          if (o.i === r.i || o.fin || o.fly >= 0.3) continue;
          const margin = 1.3 + 2.2 * dt;
          const a = (o.lane - margin - start.lane) / lateralV;
          const b = (o.lane + margin - start.lane) / lateralV;
          const enter = Math.max(0, Math.min(a, b)), leave = Math.min(duration, Math.max(a, b));
          if (enter > leave) continue;
          const ds = o.s - start.s, dv = o.v - (blk ? Math.min(r.v, blk.v) : r.v);
          const first = ds + dv * enter, last = ds + dv * leave;
          const pullingAway = Math.abs(o.lane - start.lane) < margin && (start.lane - o.lane) * lateralV >= 0;
          if (pullingAway && Math.min(first, last) >= 2.2) continue;
          if (Math.min(first, last) < 2.8 && Math.max(first, last) > -2.8) return false;
        }
        return true;
      };
      r.dec -= dt;
      const approaching = !ghost && traffic.some(o => o.i !== r.i && !o.fin && o.fly < 0.3 && o.s > start.s && o.s - start.s < 12 && Math.abs(o.lane - start.lane) < 1.4 && start.v - o.v > 0.5);
      const excursion = (r.def.sk === 'orfe' && r.fx.some(e => e.skill && e.then)) || (r.def.sk === 'maroon' && r.fx.some(e => e.drift));
      if (!excursion && r.dec <= 0.6 && (approaching || !safePath(r.tLane))) r.dec = 0;
      if (r.dec <= 0) {
        r.dec = 0.35 + R.random() * 0.25;
        let best = r.lane, bc = 1e9;
        const candidates = [r.tLane, r.lane, 0.9, W - 0.9];
        for (let l = 0.9; l <= W - 0.9; l += 0.7) candidates.push(l);
        const nearby = traffic.filter(o => o.i !== r.i && !o.fin && Math.abs(o.s - start.s) < 12).sort((a, b) => a.lane - b.lane);
        for (let k = 0; k < nearby.length; k++) {
          candidates.push(nearby[k].lane - 1.5, nearby[k].lane + 1.5);
          if (k) candidates.push((nearby[k - 1].lane + nearby[k].lane) / 2);
        }
        // 少し先の理想ライン（先のカーブの内側）に寄せる。新潟千直などは外ラチ沿い
        const ideal = R.track.def.preferOuter ? W - 0.9 : R.track.idealLane(R.s0 + start.s + 10);
        candidates.push(ideal);
        for (const l0 of candidates) {
          const l = clamp(l0, 0.9, W - 0.9);
          if (!safePath(l)) continue;
          let c = Math.abs(l - ideal) * (nearby.length ? 0.09 : 0.18) + Math.abs(l - r.lane) * 0.045;
          if (Math.abs(l - r.tLane) > 0.3) c += 0.12;
          for (const o of traffic) {
            if (o.i === r.i || o.fin || o.fly >= 0.3) continue; const ds = o.s - start.s, dl = Math.abs(o.lane - l);
            if (!ghost && ds > 0 && ds < 10 && dl < 1.4 && o.v < start.v + 1) c += 5 * (1 - ds / 10) + 2;
            if (!ghost && ds > 0 && ds < 12 && Math.abs(o.lane - start.lane) < 1.4 && start.v - o.v > 0.5) {
              const escape = Math.max(0, Math.abs(l - o.lane) - Math.abs(start.lane - o.lane));
              c += Math.max(0, 1.5 - escape) * Math.min(2, start.v - o.v) * (1 - ds / 12);
            }
          }
          if (c < bc) { bc = c; best = l; }
        }
        r.tLane = best;
      }
      const nextLane = clamp(r.lane + clamp(r.tLane - r.lane, -2.2 * dt, 2.2 * dt), 0.9, W - 0.9);
      if (safePath(nextLane)) r.lane = nextLane;
    }
    r.s += r.v * dt;
    recoverAtStations(r, R, previousS, full);
    resetRaceSection(r, R);
    if (!R.continuous && !r.fin && r.s >= R.D) { r.fin = true; r.place = ++R.finished; r.finT = R.t - (r.s - R.D) / Math.max(1, r.v); if (full && R.onFinish) R.onFinish(r); }
  }
}
function oddsWeights(tr, conds, wx) {
  const long = clamp((tr.def.D - 1000) / 3000, 0, 1), short = clamp(1 - tr.def.D / 1000, 0, 1);
  const scores = HORSES.map((d, i) => {
    const st = d.st;
    return st.spd * 0.45 + st.sta * 0.25 + st.acc * 0.15 + st.pow * 0.1 + st.agi * 0.05
      + (st.sta - 5) * long * 0.15 + (st.acc - 5) * short * 0.1
      + affinityOf(d, tr.def.surf) * 0.6 + conds[i] * 0.4 + mudOf(d) * wx.g * 0.15;
  });
  const max = Math.max(...scores), weights = scores.map(s => Math.exp((s - max) / 1.5));
  const total = weights.reduce((a, b) => a + b, 0);
  return weights.map(w => w / total);
}
function calcOdds(tr, conds, wx) {
  wx = wx || { w: 'sunny', g: 0 };
  // Blend eight race samples with a 24-sample ability prior to keep rare results stable.
  const N = 8, prior = 24, weights = oddsWeights(tr, conds, wx);
  const win = weights.map(p => p * prior), plc = new Array(HORSES.length).fill(0);
  // Weighted selection without replacement gives coherent top-three probabilities.
  for (let a = 0; a < weights.length; a++) for (let b = 0; b < weights.length; b++) {
    if (a === b) continue;
    for (let c = 0; c < weights.length; c++) {
      if (c === a || c === b) continue;
      const p = weights[a] * weights[b] / (1 - weights[a]) * weights[c] / (1 - weights[a] - weights[b]) * prior;
      plc[a] += p; plc[b] += p; plc[c] += p;
    }
  }
  for (let n = 0; n < N; n++) {
    const R = makeRace(tr, conds, wx);
    let guard = 0;
    while (R.finished < 3 && guard++ < 2000) stepRace(R, 0.2, false);
    for (const r of R.runners) { if (r.place === 1) win[r.i]++; if (r.place >= 1 && r.place <= 3) plc[r.i]++; }
  }
  const w = win.map(c => clamp(Math.round(0.8 / Math.max(c / (N + prior), 0.004) * 10) / 10, 1.2, 199.9));
  const p = plc.map(c => clamp(Math.round(0.8 / Math.max(c / (N + prior), 0.012) * 10) / 10, 1.0, 60));
  const pop = w.map((o, i) => [o, i]).sort((a, b) => a[0] - b[0]).map(x => x[1]);
  const rank = new Array(8); pop.forEach((i, k) => rank[i] = k + 1);
  return { win: w, place: p, pop: rank };
}
