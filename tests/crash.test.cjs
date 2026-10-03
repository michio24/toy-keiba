'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
function between(start, end) {
  const a = html.indexOf(start), b = html.indexOf(end, a);
  assert.ok(a >= 0 && b > a, `Source block: ${start}`);
  return html.slice(a, b);
}
function game() {
  const nodes = new Map(), snapshots = [];
  const context = vm.createContext({
    crypto: require('node:crypto').webcrypto,
    clamp: (n, lo, hi) => Math.max(lo, Math.min(hi, n)),
    mod: (n, d) => ((n % d) + d) % d,
    damp: (a, b, rate, dt) => a + (b - a) * (1 - Math.exp(-rate * dt)),
    S: { playType: 'crash', mode: 'race', coins: 900, myBet: { h: 0, amt: 100 }, cheer: 50 },
    W: 16, affinityOf: d => d.aff.turf ?? 0, mudOf: () => 0,
    document: { hidden: false },
    $: id => { if (!nodes.has(id)) nodes.set(id, {classList: {remove() {}}, style: {setProperty() {}}, previousElementSibling: {}}); return nodes.get(id); },
    store: {set() {}}, setCoins() {snapshots.push(context.S.coins);},
    setMode: mode => {context.S.mode = mode;},
    clearCrashPressure() {}, VO: {stop() {}}, FX: {}, AU: {sad() {}, jackpot() {}, pop() {}},
    fmt: String, big() {}, confetti() {}, coinShower() {}, tickT: -10, say() {},
  });
  vm.runInContext(
    between('const ROSTER =', 'const THEMES =') +
    between('const CRASH_RTP =', '/* ============ RENDERER') +
    between('const TOP =', '/* ============ HORSE MODELS') +
    between('function cashOutCrash()', '/* ============ INPUT') +
    between('const CALLS =', 'function commentary()') +
    '\nObject.assign(globalThis, {ROSTER, TRACKS, RC, crashRate, crashPointFromUniform, crashDisplay, crashPayout, validCrashAuto, advanceCrash, raceSectionDistance, resetRaceSection, availableTracks, nextTrackIndex, makeRace, stepRace, trySkill, cashOutCrash, settleCrash});\n' +
    'globalThis.makeTestRace = (continuous, offset = 0) => { HORSES = ROSTER.slice(offset, offset + 8); const tr = { def: {D: 100, surf: "turf", theme: "sakura"}, L: 150, finishS: 100, closed: true, curv: () => 0, grade: () => 0, onCurve: () => false }; const race = makeRace(tr, HORSES.map(() => 0)); race.continuous = continuous; race.random = () => 0.5; return race; };', context);
  return {c: context, nodes, snapshots};
}

test('inline JavaScript parses', () => {
  for (const match of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)) new vm.Script(match[1]);
});

test('continuous simulation crosses multiple sections for every horse without finishing', () => {
  const {c} = game();
  for (let offset = 0; offset < c.ROSTER.length; offset += 8) {
    const race = c.makeTestRace(true, offset);
    let calls = 0; race.onSkill = () => {calls++;};
    for (let n = 0; n < 1800; n++) {
      const positions = race.runners.map(r => r.s);
      c.stepRace(race, 1 / 60, true);
      race.runners.forEach((r, i) => {
        assert.ok(r.s >= positions[i] && r.s - positions[i] < 7);
        assert.equal(r.fin, false);
        assert.ok(c.raceSectionDistance(r, race) >= 0 && c.raceSectionDistance(r, race) < race.D);
      });
    }
    assert.equal(race.finished, 0);
    assert.ok(race.runners.every(r => r.section >= 4));
    assert.ok(calls > race.runners.length, 'Skills should activate again in later sections');
  }
});

test('section reset restores abilities, preserves position and active cheer, and runs once', () => {
  const {c} = game(), race = c.makeTestRace(true), r = race.runners[0];
  const cheer = {cheer: true, t: 1.5, mult: 1.06};
  Object.assign(r, {s: 100.2, v: 22, lane: 4, st: 1, used: true, g1: true, pc: true, fx: [cheer, {skill: true, t: 4}, {wind: true, t: 99}]});
  c.resetRaceSection(r, race);
  assert.equal(r.section, 1); assert.equal(r.st, r.stMax); assert.equal(r.used, false); assert.equal(r.g1, false);
  assert.equal(r.s, 100.2); assert.equal(r.v, 22); assert.equal(r.lane, 4);
  assert.equal(r.fx.length, 1); assert.equal(r.fx[0], cheer); assert.equal(cheer.t, 1.5);
  r.st = 5; c.resetRaceSection(r, race); assert.equal(r.st, 5);
});

test('early-distance skill triggers use section distance rather than total distance', () => {
  const {c} = game(), race = c.makeTestRace(true), r = race.runners[0];
  r.def = {...r.def, sk: 'pony'}; r.s = 100.1; c.resetRaceSection(r, race);
  c.trySkill(r, race, 0.001, 1 / 60, false); assert.equal(r.used, false);
  r.s = 103; c.trySkill(r, race, 0.03, 1 / 60, false); assert.equal(r.used, true);
});

test('blocking skill checks cumulative relative positions in later sections', () => {
  const {c} = game(), race = c.makeTestRace(true), r = race.runners[0];
  r.def = {...r.def, sk: 'haou'}; r.s = 180; r.rank = 2; c.resetRaceSection(r, race);
  const other = race.runners[1]; other.s = 170; other.lane = r.lane;
  c.trySkill(r, race, 0.8, 1 / 60, false); assert.equal(r.used, false);
  other.s = 181; c.trySkill(r, race, 0.8, 1 / 60, false); assert.equal(r.used, true);
});

test('finite race still finishes and does not reset stamina or skill', () => {
  const {c} = game(), race = c.makeTestRace(false);
  for (let i = 0; i < 900; i++) c.stepRace(race, 1 / 60, true);
  assert.equal(race.finished, race.runners.length);
  assert.ok(race.runners.every(r => r.fin && r.place > 0 && r.finT > 0 && !r.section));
});

test('course selection excludes straight tracks only in crash and next-course wraps', () => {
  const {c} = game(), straight = c.TRACKS.findIndex(t => t.closed === false);
  assert.ok(straight >= 0);
  assert.equal(c.availableTracks('race').length, c.TRACKS.length);
  assert.equal(c.availableTracks('crash').length, c.TRACKS.length - 1);
  assert.equal(c.nextTrackIndex(straight - 1, 'crash'), straight + 1);
  assert.equal(c.nextTrackIndex(c.TRACKS.length - 1, 'crash'), 0);
});

test('event timing: instant crash, auto, limit, tie priority, and continued growth', () => {
  const {c} = game();
  const advance = (point, auto, multiplier = 1, dt = 1000) => c.advanceCrash({point, auto, multiplier}, 1, dt);
  assert.equal(advance(0.99, null).reason, 'crash');
  assert.equal(advance(2, 2).reason, 'crash');
  assert.equal(advance(100, 100).reason, 'crash');
  assert.equal(advance(101, 100).reason, 'auto');
  assert.equal(advance(101, null).reason, 'limit');
  assert.equal(advance(3, 2).multiplier, 2);
  assert.equal(advance(3, 4).multiplier, 3);
  const event = advance(1000, null, 1, 60);
  assert.equal(event.reason, null); assert.ok(event.multiplier > 9);
});

test('manual settlement floors visible multiplier, guards duplicates and hidden tab', () => {
  const {c, snapshots} = game();
  c.R = c.makeTestRace(true); c.track = c.R.track; c.HORSES = c.R.runners.map(r => r.def);
  c.S.crash = {displayed: 2.34, settled: false};
  c.document.hidden = true; c.cashOutCrash(); assert.equal(c.S.coins, 900);
  c.document.hidden = false; c.cashOutCrash(); assert.equal(c.S.coins, 1134);
  c.settleCrash('manual', 99); assert.equal(c.S.coins, 1134); assert.equal(snapshots.length, 1);
  assert.equal(c.crashDisplay(2.349), 2.34); assert.equal(c.crashPayout(101, 2.34), 236);
});

test('crash pays zero, auto and limit settle at exact multiplier', () => {
  for (const [reason, multiplier, pay] of [['crash', 1, 0], ['auto', 2.37, 237], ['limit', 100, 10000]]) {
    const {c} = game(); c.R = c.makeTestRace(true); c.track = c.R.track; c.HORSES = c.R.runners.map(r => r.def);
    c.S.crash = {settled: false}; c.settleCrash(reason, multiplier);
    assert.equal(c.S.crash.pay, pay); assert.equal(c.S.coins, 900 + pay); assert.equal(c.R.running, false);
  }
});

test('RTP quadrature for fixed targets, changing rank paths, and payout rounding', () => {
  const {c} = game(); const count = 100000;
  for (const target of [1.01, 2, 10, 100]) {
    let payout = 0;
    for (let i = 0; i < count; i++) {
      const point = c.crashPointFromUniform((i + 0.5) / count);
      const event = c.advanceCrash({point, auto: target, multiplier: 1}, i % 8 + 1, 1000);
      if (event.reason !== 'crash') payout += event.multiplier;
    }
    assert.ok(Math.abs(payout / count - 0.965) < 0.001);
  }
  // Rank changes alter elapsed time, not the survival condition at a target.
  for (const ranks of [[1, 8, 3, 6], [8, 7, 2, 1]]) {
    let multiplier = 1;
    for (const rank of ranks) multiplier = c.advanceCrash({point: Infinity, auto: null, multiplier}, rank, 5).multiplier;
    const target = multiplier; let exact = 0, rounded = 0;
    for (let i = 0; i < count; i++) {
      const round = {point: c.crashPointFromUniform((i + 0.5) / count), auto: null, multiplier: 1};
      let reason = null;
      for (const rank of ranks) {
        const event = c.advanceCrash(round, rank, 5);
        round.multiplier = event.multiplier; reason = event.reason;
        if (reason) break;
      }
      if (reason !== 'crash') {
        exact += round.multiplier; rounded += c.crashPayout(101, c.crashDisplay(round.multiplier)) / 101;
      }
    }
    assert.ok(Math.abs(exact / count - 0.965) < 0.0001);
    assert.ok(rounded < exact && rounded / count > 0.95);
  }
  assert.equal(c.validCrashAuto(1), false); assert.equal(c.validCrashAuto(100.01), false);
  assert.equal(c.validCrashAuto(2.345), false); assert.equal(c.validCrashAuto(100), true);
});

test('continuous commentary avoids finish and distance announcements', () => {
  const {c} = game(), race = c.makeTestRace(true), calls = [];
  race.runners.forEach((r, i) => {r.s = 310 - i * 3;});
  c.RC.emit = key => {calls.push(key); c.RC.lastT = race.t;}; c.RC.reset(race);
  for (let t = 4; t < 70; t += 6) {race.t = t; c.RC.update(race, {def: {theme: 'sakura'}, finishS: 100, homeS0: 0});}
  assert.ok(calls.length > 5);
  assert.ok(calls.every(key => !/distance|straight|half|finish/.test(key)));
});
