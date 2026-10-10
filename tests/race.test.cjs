// レース計算（出走馬の抽選・天候・コース形状・決着・周回モード）とオッズのテスト
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadGame } = require('./helpers/game.cjs');

const { get } = loadGame();
const ROSTER = get('ROSTER'), TRACKS = get('TRACKS'), WX = get('WX');
const Track = get('Track'), makeRace = get('makeRace'), stepRace = get('stepRace');
const calcOdds = get('calcOdds'), oddsWeights = get('oddsWeights'), rollWeather = get('rollWeather');
const pickField = get('pickField'), raceSectionDistance = get('raceSectionDistance');
const availableTracks = get('availableTracks'), nextTrackIndex = get('nextTrackIndex');
// HORSES は let なので、代入はコンテキスト内で行う
const setHorses = list => { get('(list => { HORSES = list; })')(list); };
const setPlayType = type => { get('S').playType = type; };

// 決着（または上限時間）までレースを進める
function runRace(def, dt = 0.1) {
  setHorses(pickField());
  const tr = new Track(def), conds = Array.from({ length: 8 }, () => [-1, 0, 0, 1, 1, 2][(Math.random() * 6) | 0]);
  const R = makeRace(tr, conds, rollWeather(def));
  for (let n = 0; n < 20000 && R.finished < 8; n++) stepRace(R, dt, false);
  return R;
}

test('出走馬は名簿から重複なく8頭、名馬モチーフは2〜4頭', () => {
  for (let k = 0; k < 200; k++) {
    const field = pickField();
    assert.equal(field.length, 8);
    assert.equal(new Set(field.map(h => h.name)).size, 8);
    const motif = field.filter(h => h.motif).length;
    assert.ok(motif >= 2 && motif <= 4, `名馬モチーフ ${motif}頭`);
  }
});

test('名簿：名前の重複がなく、能力・脚質・スキルがそろっている', () => {
  assert.equal(new Set(ROSTER.map(h => h.name)).size, ROSTER.length);
  for (const h of ROSTER) {
    for (const k of ['spd', 'sta', 'acc', 'pow', 'agi']) assert.equal(typeof h.st[k], 'number', `${h.name} の ${k}`);
    assert.ok(['nige', 'senko', 'sashi', 'oikomi'].includes(h.style), `${h.name} の脚質`);
    assert.ok(h.skill && h.skill.name, `${h.name} のスキル`);
  }
});

test('天候と馬場は定義済みの値から選ばれる', () => {
  for (const def of TRACKS) for (let k = 0; k < 30; k++) {
    const wx = rollWeather(def);
    assert.ok(wx.w in WX, `${def.name}: ${wx.w}`);
    assert.ok(Number.isInteger(wx.g) && wx.g >= 0 && wx.g <= 3, `${def.name}: 馬場 ${wx.g}`);
    if (def.surf === 'sand') assert.ok(wx.g <= 1);
  }
});

test('全コースで通常レースが決着し、全頭に1〜8着がつく', () => {
  setPlayType('race');
  for (const def of TRACKS) {
    const R = runRace(def);
    assert.equal(R.finished, 8, `${def.name}: ${R.finished}頭しかゴールしていない`);
    const order = R.runners.slice().sort((a, b) => a.place - b.place);
    assert.deepEqual([...order.map(r => r.place)], [1, 2, 3, 4, 5, 6, 7, 8], def.name);
    assert.ok(order[0].finT > 0 && Number.isFinite(order[7].finT), def.name);
  }
});

// 既知の不具合：同じステップ内で複数頭がゴールすると、着順は配列の処理順で決まる一方、
// タイムはゴール線の通過時刻を補間するため、下の着順の馬のほうが速いタイムになることがある
// （ゲームのステップ幅 1/60 秒でも数%のレースで発生）。修正したら todo を外す。
test('着順が下の馬ほどタイムが遅い', { todo: '同一ステップでゴールした馬の着順をタイム順にする' }, () => {
  setPlayType('race');
  for (let k = 0; k < 3; k++) for (const def of TRACKS) {
    const R = runRace(def, 1 / 60);
    const order = R.runners.slice().sort((a, b) => a.place - b.place);
    for (let i = 1; i < 8; i++) assert.ok(order[i].finT >= order[i - 1].finT - 1e-9, `${def.name}: ${i + 1}着のタイムが${i}着より速い`);
  }
});

test('周回（クラッシュ）モードではゴールせず、区間ごとに走り続ける', () => {
  setPlayType('crash');
  for (const { t: def } of availableTracks('crash').slice(0, 6)) {
    setHorses(pickField());
    const R = makeRace(new Track(def), Array(8).fill(0));
    R.continuous = true;
    let skills = 0; R.onSkill = () => { skills++; };
    // 3区間ぶん以上の距離を走らせる
    for (let n = 0; n < 20000 && !R.runners.every(r => (r.section || 0) >= 3); n++) {
      const before = R.runners.map(r => r.s);
      stepRace(R, 1 / 30, true);
      R.runners.forEach((r, i) => {
        assert.ok(r.s >= before[i], `${def.name}: 後退した`);
        const d = raceSectionDistance(r, R);
        assert.ok(d >= 0 && d < R.D, `${def.name}: 区間内距離 ${d}`);
      });
    }
    assert.equal(R.finished, 0, `${def.name}: 周回モードでゴールした`);
    assert.ok(R.runners.every(r => r.section >= 3), `${def.name}: 区間が進まない`);
    assert.ok(skills > 8, `${def.name}: 後の区間でスキルが再発動していない（${skills}回）`);
  }
  setPlayType('race');
});

test('クラッシュでは直線コースと手動専用コースを選ばない', () => {
  assert.ok(availableTracks('crash').every(({ t }) => t.closed !== false));
  for (let i = 0; i < TRACKS.length; i++) {
    const next = TRACKS[nextTrackIndex(i, 'crash')];
    assert.ok(next.closed !== false && !next.manualOnly, `${TRACKS[i].name} の次が ${next.name}`);
  }
});

test('オッズ：能力の重みは合計1、倍率は範囲内、人気は1〜8番の並び', () => {
  setPlayType('race');
  for (const def of TRACKS.slice(0, 10)) {
    setHorses(pickField());
    const tr = new Track(def), conds = Array(8).fill(0), wx = rollWeather(def);
    const w = oddsWeights(tr, conds, wx);
    assert.ok(Math.abs(w.reduce((a, b) => a + b, 0) - 1) < 1e-9);
    const o = calcOdds(tr, conds, wx);
    for (let i = 0; i < 8; i++) {
      assert.ok(o.win[i] >= 1.2 && o.win[i] <= 199.9, `${def.name}: 単勝 ${o.win[i]}`);
      assert.ok(o.place[i] >= 1.0 && o.place[i] <= 60, `${def.name}: 複勝 ${o.place[i]}`);
      assert.ok(o.place[i] <= o.win[i], `${def.name}: 複勝が単勝より高い`);
    }
    assert.deepEqual([...o.pop].sort((a, b) => a - b), [1, 2, 3, 4, 5, 6, 7, 8]);
    // 1番人気は単勝倍率が最も低い
    assert.equal(o.win[o.pop.indexOf(1)], Math.min(...o.win));
  }
});
