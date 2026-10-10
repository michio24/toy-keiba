// クラッシュモードの倍率計算（抽選・表示・精算・時間経過）のテスト
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadGame } = require('./helpers/game.cjs');

const { get } = loadGame();
const crashPointFromUniform = get('crashPointFromUniform'), sampleCrashPoint = get('sampleCrashPoint');
const crashRate = get('crashRate'), crashDisplay = get('crashDisplay'), crashPayout = get('crashPayout');
const validCrashAuto = get('validCrashAuto'), advanceCrash = get('advanceCrash'), crashPressure = get('crashPressure');
const RTP = get('CRASH_RTP'), MAX = get('CRASH_MAX');

test('理論RTPは96.5%、上限は100倍', () => {
  assert.equal(RTP, 0.965);
  assert.equal(MAX, 100);
});

test('クラッシュ倍率は 0.965 / U で、U は 0 と 1 を含まない', () => {
  assert.equal(crashPointFromUniform(0.5), 1.93);
  assert.equal(crashPointFromUniform(0.965), 1);
  for (const u of [0, 1, -0.1, 1.5, NaN]) assert.throws(() => crashPointFromUniform(u), { name: 'RangeError' });
});

test('固定倍率 m に到達する確率は 0.965 / m で、期待払戻は賭け額の約96.5%', () => {
  const N = 200000, m = 2, bet = 100;
  let reached = 0, paid = 0;
  for (let i = 0; i < N; i++) if (sampleCrashPoint() >= m) { reached++; paid += crashPayout(bet, m); }
  // 標準誤差は約0.0011（到達率）・約0.0022（RTP）なので、十分に広い許容幅をとる
  assert.ok(Math.abs(reached / N - RTP / m) < 0.006, `到達率 ${reached / N}`);
  assert.ok(Math.abs(paid / (N * bet) - RTP) < 0.012, `実測RTP ${paid / (N * bet)}`);
});

test('上昇速度は順位が上ほど速く、順位は1〜8に丸める', () => {
  assert.equal(crashRate(1), (0.08 + 0.005 * 7) / 3);
  assert.equal(crashRate(8), 0.08 / 3);
  assert.equal(crashRate(0), crashRate(1));
  assert.equal(crashRate(20), crashRate(8));
  for (let r = 1; r < 8; r++) assert.ok(crashRate(r) > crashRate(r + 1));
});

test('表示倍率は小数2桁に切り捨て、100倍で頭打ち', () => {
  assert.equal(crashDisplay(1.239999), 1.23);
  assert.equal(crashDisplay(1.23), 1.23);
  assert.equal(crashDisplay(2.0000000001), 2);
  assert.equal(crashDisplay(150), 100);
});

test('払戻は賭け額×倍率（小数2桁）を整数に切り捨てる', () => {
  assert.equal(crashPayout(100, 1.234), 123);
  assert.equal(crashPayout(333, 1.5), 499);
  assert.equal(crashPayout(100, 100), 10000);
  assert.equal(crashPayout(0, 5), 0);
});

test('自動確定は 1.01〜100.00 の小数2桁まで', () => {
  for (const v of ['1.01', '2', '2.5', '99.99', '100', 1.01]) assert.equal(validCrashAuto(v), true, String(v));
  for (const v of ['1', '1.00', '100.01', '1.005', 'abc', '', NaN, Infinity]) assert.equal(validCrashAuto(v), false, String(v));
});

test('時間経過：何も起きなければ連続複利で伸びる', () => {
  const r = advanceCrash({ multiplier: 1.5, point: 50, auto: null }, 3, 1 / 60);
  assert.equal(r.reason, null);
  assert.equal(r.elapsed, 1 / 60);
  assert.ok(Math.abs(r.multiplier - 1.5 * Math.exp(crashRate(3) / 60)) < 1e-12);
});

test('時間経過：区間内で到達した事象を、到達時刻の早い順に判定する', () => {
  const rate = crashRate(1);
  // クラッシュ点が先
  let r = advanceCrash({ multiplier: 1.99, point: 2, auto: 2.5 }, 1, 1);
  assert.equal(r.reason, 'crash'); assert.equal(r.multiplier, 2);
  assert.ok(Math.abs(r.elapsed - Math.log(2 / 1.99) / rate) < 1e-12);
  // 自動確定が先
  r = advanceCrash({ multiplier: 1.99, point: 3, auto: 2 }, 1, 1);
  assert.equal(r.reason, 'auto'); assert.equal(r.multiplier, 2);
  // 同時ならクラッシュを優先する
  r = advanceCrash({ multiplier: 1.99, point: 2, auto: 2 }, 1, 1);
  assert.equal(r.reason, 'crash');
  // 100倍の上限
  r = advanceCrash({ multiplier: 99.99, point: 500, auto: null }, 1, 1);
  assert.equal(r.reason, 'limit'); assert.equal(r.multiplier, 100);
});

test('時間経過：クラッシュ点が1倍以下なら開始直後に終了する', () => {
  const r = advanceCrash({ multiplier: 1, point: 0.97, auto: null }, 1, 1 / 60);
  assert.equal(r.reason, 'crash');
  assert.equal(r.elapsed, 0);
  assert.equal(r.multiplier, 1);
});

test('演出の段階は表示倍率だけで決まる', () => {
  assert.deepEqual({ ...crashPressure(1) }, { level: 0, milestone: -1 });
  assert.deepEqual({ ...crashPressure(1.1) }, { level: 0, milestone: 0 });
  assert.deepEqual({ ...crashPressure(1.5) }, { level: 1, milestone: 2 });
  assert.deepEqual({ ...crashPressure(5) }, { level: 4, milestone: 5 });
  assert.deepEqual({ ...crashPressure(60) }, { level: 4, milestone: 8 });
});
