// クラッシュモードの倍率計算（走行・描画の乱数とは独立）
'use strict';

/* ============ CRASH MATH (independent of horse / visual randomness) ============ */
const CRASH_RTP = 0.965, CRASH_MAX = 100, CRASH_STEP = 1 / 60;
function sampleCrashPoint() {
  const bits = new Uint32Array(1);
  crypto.getRandomValues(bits);
  return crashPointFromUniform((bits[0] + 0.5) / 4294967296);
}
function createCrashRaceRandom() {
  const bits = new Uint32Array(1); crypto.getRandomValues(bits);
  let state = bits[0] || 1;
  return () => { state ^= state << 13; state ^= state >>> 17; state ^= state << 5; return (state >>> 0) / 4294967296; };
}
function crashPointFromUniform(u) {
  if (!(u > 0 && u < 1)) throw new RangeError('Crash uniform must be between 0 and 1');
  return CRASH_RTP / u;
}
function crashRate(rank) { return (0.08 + 0.005 * (8 - clamp(rank, 1, 8))) / 3; }
function crashDisplay(multiplier) { return Math.floor((Math.min(CRASH_MAX, multiplier) + 1e-10) * 100) / 100; }
function crashPayout(amount, multiplier) { return Math.floor((amount * Math.round(multiplier * 100)) / 100); }
function validCrashAuto(value) {
  const n = Number(value);
  return Number.isFinite(n) && n >= 1.01 && n <= CRASH_MAX && Math.abs(n * 100 - Math.round(n * 100)) < 1e-8;
}
// Pressure depends only on the visible multiplier, never on the hidden crash point.
const CRASH_PRESSURE_STEPS = [
  [1.10, '伸びてきた！どこで確定する？'],
  [1.25, 'もうひと伸び？それとも今、確定？'],
  [1.50, '1.5倍突破！迷っている間も倍率は上がる！'],
  [2, '2倍！ここで確定？まだ走る？'],
  [3, '3倍突破！この払戻、手放せる？'],
  [5, '5倍！守るか、さらに伸ばすか！'],
  [10, '10倍到達！決断の瞬間！'],
  [20, '20倍！確定ボタンに指を置け！'],
  [50, '50倍突破！この一瞬、どうする！？']
];
function crashPressure(multiplier) {
  const level = multiplier >= 5 ? 4 : multiplier >= 3 ? 3 : multiplier >= 2 ? 2 : multiplier >= 1.5 ? 1 : 0;
  let milestone = -1;
  for (let i = 0; i < CRASH_PRESSURE_STEPS.length; i++) if (multiplier >= CRASH_PRESSURE_STEPS[i][0]) milestone = i;
  return { level, milestone };
}
// Resolve crossings by simulated time, rather than by the order of frame callbacks.
function advanceCrash(round, rank, dt) {
  const rate = crashRate(rank), start = round.multiplier;
  const crossing = value => Math.max(0, Math.log(value / start) / rate);
  const events = [
    { reason: 'crash', time: crossing(round.point), value: Math.max(1, round.point), priority: 0 },
    { reason: 'auto', time: round.auto == null ? Infinity : crossing(round.auto), value: round.auto, priority: 1 },
    { reason: 'limit', time: crossing(CRASH_MAX), value: CRASH_MAX, priority: 2 }
  ];
  events.sort((a, b) => Math.abs(a.time - b.time) < 1e-10 ? a.priority - b.priority : a.time - b.time);
  const event = events[0];
  if (event.time <= dt + 1e-10) {
    const multiplier = event.value;
    return { reason: event.reason, elapsed: event.time, multiplier };
  }
  return { reason: null, elapsed: dt, multiplier: start * Math.exp(rate * dt) };
}
