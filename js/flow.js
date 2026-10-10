// 画面遷移・出走・結果・クラッシュの精算
'use strict';

const cam = { tgt: new V3(), pos: new V3(0, 60, 180), fov: 50, base: 0, yaw: 0.8, pitch: 0.25, dist: 7.5, drag: -10 };
let timeScale = 1, timeTarget = 1, slowUntil = 0, clock = 0, realClock = 0;
let hud = { t: 0 }, flags = {};

function setMode(m) {
  S.mode = m;
  $('#lobby').hidden = m !== 'lobby';
  $('#hud').hidden = !(m === 'intro' || m === 'countdown' || m === 'race' || m === 'finish');
  $('#result').hidden = m !== 'result';
  drawBoard();
}
function enterLobby(rebuild) {
  if (R) { R.finishPhoto = null; R.finishPhotoPending = false; }
  VO.stop();
  clearCrashPressure();
  S.crash = null;
  if (S.playType === 'crash' && TRACKS[S.ti].closed === false) {
    S.ti = 0; store.set('track', S.ti); rebuild = true;
  }
  if (rebuild || !world) buildWorld(S.ti);
  if (themeReset) themeReset();
  setField();
  S.conds = HORSES.map(() => [-1, 0, 0, 1, 1, 2][(Math.random() * 6) | 0]);
  S.wx = rollWeather(track.def);
  S.odds = calcOdds(track, S.conds, S.wx);
  R = makeRace(track, S.conds, S.wx);
  applyWeather();
  R.runners.forEach(r => { r.s = -14; });
  gate.g.visible = true; gate.open = 0; gate.slide = 0; gate.t = 0; gate.g.position.copy(gate.base); gate.doors.forEach(d => d.pv.rotation.y = 0);
  setCam('broadcast'); timeTarget = 1; slowUntil = 0; FX.lines = 0; FU.uAb.value = 0; $('#hot').classList.remove('on');
  let bail = false; if (S.coins < 100) { S.coins += 500; bail = true; }
  setCoins();
  setMode('lobby');
  renderLobby();
  setLobbyTab(lobbyTab);
  selectHorse(S.sel, true);
  $('#hint').textContent = bail ? '救済ボーナス！コインが足りなかったので 500 コインを追加しました。' : S.playType === 'crash' ? 'Enterで確定／Spaceで応援／1〜6でカメラ切替' : 'レース中：1〜6でカメラ切替／Spaceで応援ブースト';
  $('#hint').classList.toggle('bail', bail);
  AU.crowdLvl(0.12);
}
function startRace() {
  if (S.mode !== 'lobby') return;
  if (S.playType === 'crash' && $('#autoEnabled').checked && !validCrashAuto($('#autoMultiplier').value)) return;
  R.continuous = S.playType === 'crash';
  raceCheers = 0;
  $('#guideNote').hidden = !guiding;
  $('#guideNote').textContent = '応援が100%になったら、右下の応援ボタンを押そう！';
  const amt = betAmt(); if (amt <= 0) return;
  if (S.playType === 'crash') {
    S.crash = { point: sampleCrashPoint(), multiplier: 1, displayed: 1, auto: $('#autoEnabled').checked ? Number($('#autoMultiplier').value) : null, settled: false, wallAcc: 0 };
    S.interrupted = false;
    $('#guideNote').textContent = '応援で順位アップ！疾走終了前にEnterかボタンで確定しよう。';
  }
  VO.stop();
  RC.reset(R);
  AU.init();
  S.coins -= amt; setCoins();
  S.myBet = { h: S.sel, type: S.playType === 'crash' ? 'crash' : S.betType, amt, odds: S.betType === 'win' ? S.odds.win[S.sel] : S.odds.place[S.sel], streak: S.streak };
  setMode('intro'); S.introT = 0; cam.spr = null; cam.bf = null; flags = {}; S.photoDone = false; S.photoEnd = false; S.cheer = 30; S.photo = false;
  S.camTarget = S.playType === 'crash' ? S.myBet.h : null;
  buildHud();
  setCam('broadcast');
  say(RC.line('intro', {T: track.def.name, WX: WX[S.wx.w], GOING: GOING[S.wx.g], F: HORSES[S.odds.pop.indexOf(1)].name}, {tr: track}));
  AU.fanfare(); AU.crowdLvl(0.35);
  R.onSkill = onSkill; R.onFail = r => { if (r.i === S.myBet.h) toast(`<b>${r.def.name}</b> ジャックポットはハズレ…まだ終わってない！`, '#8a8aa8'); else toast(`<b>${r.def.name}</b> の抽選はハズレ`, '#8a8aa8'); };
  R.onFinish = S.playType === 'crash' ? null : onFinish;
  R.onNote = (r, txt, good) => { toast(`<b>${r.def.name}</b> ${txt}`, good ? r.def.skill.color : '#8a8aa8'); say(`${r.def.name}、${txt}`); if (r.i === S.myBet.h && !good) AU.sad(); };
  R.onStation = (r, station) => { if (r.i === S.myBet.h) { R.onNote(r, `${station.name}駅：スタミナ30％回復！`, true); AU.station(RAIL_LINES[track.def.theme]?.melody); } };
  R.onZone = (r, zone) => { if (r.i === S.myBet.h) { toast(`<b>${zone.name}</b>に突入！`, zone.color); say(`${r.def.name}、${zone.name}の区間へ！`); } };
}
function buildHud() {
  $('#crashHud').hidden = S.playType !== 'crash';
  if (S.crash) renderCrashHud();
  $('#myName').textContent = `${S.myBet.h + 1}番 ${HORSES[S.myBet.h].name}`;
  $('#myRank').textContent = '—';
  $('#remain').previousElementSibling.textContent = R.continuous ? '走行距離' : '残り';
  $('#rname').textContent = `${track.def.name}　${SURF[track.def.surf]}${track.def.D}m・${WX[S.wx.w]}・${GOING[S.wx.g]}`;
  $('#stand').innerHTML = R.runners.map(r => `<button type="button" class="srow ${r.i === S.myBet.h ? 'me' : ''}" id="sr${r.i}" data-runner="${r.i}" aria-label="${r.i + 1}番 ${r.def.name}を観戦" aria-pressed="false"><span class="spos">${r.i + 1}</span><span class="num" style="background:${WAKU[r.i][0]};color:${WAKU[r.i][1]}">${r.i + 1}</span><span class="sname">${r.i === S.myBet.h ? '<small>あなたの馬</small>' : ''}${r.def.name}</span><span class="sgap"></span></button>`).join('');
  updateCamTargetUI();
  $('#pbar').innerHTML = R.runners.map(r => `<i id="pd${r.i}" class="${r.i === S.myBet.h ? 'me' : ''}" style="background:${WAKU[r.i][0]};left:0%"></i>`).join('') + '<b class="flag"></b>';
  $('#feed').innerHTML = '';
}
function onSkill(r) {
  const H = horses[r.i]; H.glow = 1.6;
  const q = track.pos(R.s0 + r.s, r.lane); ringBurst(new V3(q.x, q.y + 1.2, q.z), r.def.skill.color);
  const col = C(r.def.skill.color).multiplyScalar(3);
  for (let i = 0; i < 70; i++) sparkP.emit(q.x, 1.2, q.z, rand(-8, 8), rand(2, 10), rand(-8, 8), rand(0.6, 1.2), rand(0.8, 1.6), col, 9, 1.5);
  const mine = r.i === S.myBet.h;
  if (mine) { cutin(r); AU.whoosh(); AU.chime(); timeTarget = 0.3; slowUntil = realClock + 1.1; FX.flash = 0.5; FX.lines = 1.4; FX.ab = 1; }
  else { toast(`<b>${r.def.name}</b>「${r.def.skill.name}」発動！`, r.def.skill.color); AU.chime(); }
  if (r.def.kind === 'banei') FX.shake = Math.max(FX.shake, 0.6);
  if (r.def.sk === 'maroon') AU.horn();
  if (r.def.kind === 'gold' || r.def.sk === 'urara') { cutin(r); FX.flash = 0.7; AU.jackpot(); if (!mine) { timeTarget = 0.4; slowUntil = realClock + 0.8; } }
  if (r.i === S.myBet.h || R.t - tickT >= 3) RC.emit('skill', {M: r.def.name, SK: r.def.skill.name}, false, {horse: r.def});
}
function onFinish(r) {
  if (S.playType === 'race' && r.i === S.myBet.h) R.finishPhotoPending = true;
  if (r.place === 1) {
    if (S.playType === 'race' && !R.themeCelebrated) { R.themeCelebrated = true; if (themeFinish) themeFinish(); }
    say(RC.finish(R, r, track), true);
    big('GOAL!!', '', 1300); FX.flash = 0.6; AU.jackpot(); crowd.userData.exc = 1.4;
    for (let i = 0; i < 4; i++) setTimeout(() => firework(new V3(boardPos.x + rand(-60, 60), rand(40, 70), boardPos.z - rand(20, 70))), i * 350);
    R.firstFinT = realClock;
  }
  if (r.i === S.myBet.h) toast(`<b>${r.def.name}</b> ${r.place}着でゴール！`, '#ffcf3f');
}
function showResult() {
  if (S.mode === 'result') return;
  $('#guideNote').hidden = true;
  setMode('result');
  const b = S.myBet, me = R.runners[b.h];
  const hit = b.type === 'win' ? me.place === 1 : me.place <= 3;
  const bonus = 1 + 0.1 * b.streak;
  const pay = hit ? Math.floor(b.amt * b.odds * bonus) : 0;
  if (hit) S.streak++; else S.streak = 0;
  const unlocked = completeProgress(me);
  const reward = unlocked.reduce((n,g) => n + g.reward, 0);
  S.coins += pay + reward; setCoins();
  const settledCoins = S.coins;
  const ord = R.runners.slice().sort((a, c) => a.place - c.place);
  const rows = ord.map((r, k) => {
    const m = k === 0 ? '' : marginTxt((r.finT - ord[k - 1].finT) * Math.max(8, ord[k - 1].v) / 2.4);
    return `<tr class="${r.i === b.h ? 'me' : ''}"><td class="p">${r.place}</td><td><span class="num" style="background:${WAKU[r.i][0]};color:${WAKU[r.i][1]}">${r.i + 1}</span></td><td>${r.def.name}</td><td class="t">${fmtTime(r.finT)}</td><td class="m">${m}</td></tr>`;
  }).join('');
  const big10 = b.odds >= 10;
  $('#result').innerHTML = `<div class="panel">
    <div id="resTitle" class="${hit ? 'win' : ''}">${hit ? (big10 ? '大穴的中！！' : '的中！！') : 'ざんねん…'}</div>
    <div class="resultHero"><strong>${me.place}着</strong><div><small>あなたの馬</small><b>${b.h + 1}番 ${me.def.name}</b></div></div>
    <div class="podium">${ord.slice(0, 3).map(r => `<article><strong>${r.place === 1 ? '★ ' : ''}${r.place}位</strong><span class="num" style="background:${WAKU[r.i][0]};color:${WAKU[r.i][1]}">${r.i + 1}</span><b>${r.def.name}</b><small>${fmtTime(r.finT)}</small></article>`).join('')}</div>
    <div id="resSub">${track.def.name}（${WX[S.wx.w]}・${SURF[track.def.surf]}${GOING[S.wx.g]}）　勝ちタイム ${fmtTime(ord[0].finT)}</div>
    <div style="overflow-x:auto"><table><thead><tr><th>着</th><th>馬番</th><th>馬名</th><th>タイム</th><th>着差</th></tr></thead><tbody>${rows}</tbody></table></div>
    <div id="payout" class="${hit ? '' : 'miss'}"><div class="l"><b>${b.h + 1}番 ${HORSES[b.h].name}</b><br>${b.type === 'win' ? '単勝' : '複勝'} ${b.odds.toFixed(1)}倍 × ${fmt(b.amt)}コイン${hit && b.streak ? `<br>連勝ボーナス ×${bonus.toFixed(1)}` : ''}${!hit ? `<br>結果は${me.place}着でした` : ''}</div><div class="r" id="payNum">${hit ? '+0' : '0'}</div></div>
    <p id="rewardNote">${unlocked.length ? unlocked.map(g => `🏅 ${g.title} +${g.reward}コイン`).join(' ／ ') : `完走記録：${progress.races}レース。実績の進み具合はロビーで確認できます。`}</p>
    <details><summary>結果カードを保存・共有</summary><canvas id="shareCard" width="840" height="720" aria-label="応援した馬のゴール写真付きレース結果カード"></canvas><div class="shareActions"><button id="saveCard">画像を保存</button><button id="shareResult">結果を共有</button></div><p id="shareStatus" role="status"></p></details>
    <div class="rbtns"><button id="again" class="pri">次のレースへ</button><button id="other">次のコースへ</button></div>
  </div>`;
  setupShare(me, pay, reward);
  // レース後は出走馬・オッズが入れ替わるので、出走馬タブから再開する
  $('#again').onclick = () => { AU.pop(); setLobbyTab('horses'); enterLobby(false); };
  $('#other').onclick = () => { AU.pop(); S.ti = nextTrackIndex(S.ti, S.playType); store.set('track', S.ti); setLobbyTab('horses'); enterLobby(true); };
  if (hit) {
    big(big10 ? '大穴的中!!' : '的中!!', big10 ? 'rainbow' : '', big10 ? 1900 : 1300);
    AU.jackpot(); FX.flash = 0.8; confetti(big10 ? 320 : 180); coinShower(big10 ? 150 : 90);
    for (let i = 0; i < (big10 ? 10 : 5); i++) setTimeout(() => firework(new V3(boardPos.x + rand(-70, 70), rand(35, 75), boardPos.z - rand(10, 80)), 180), 200 + i * 260);
    crowd.userData.exc = 1.6;
    const t0 = performance.now(), dur = 1600 + Math.min(1600, pay / 20);
    const tick = () => {
      const k = Math.min(1, (performance.now() - t0) / dur), e = 1 - Math.pow(1 - k, 3), v = Math.floor(pay * e);
      const el = $('#payNum'); if (!el || S.mode !== 'result' || S.myBet !== b) return; el.textContent = '+' + fmt(v); $('#coins').textContent = fmt(settledCoins - pay + v);
      if (Math.random() < 0.5) AU.coin();
      if (k < 1) requestAnimationFrame(tick); else { setCoins(); }
    };
    requestAnimationFrame(tick);
  } else {
    setCoins();
    big('ざんねん…', 'sad', 1300); AU.sad();
  }
}

function renderCrashHud() {
  const c = S.crash; if (!c) return;
  c.displayed = crashDisplay(c.multiplier);
  const rank = R.runners[S.myBet.h].rank;
  $('#crashMultiplier').textContent = c.displayed.toFixed(2) + 'x';
  $('#crashSpeed').textContent = `${rank}位 ／ 上昇速度 ${(crashRate(rank) * 100).toFixed(1)}%/秒（複利）`;
  $('#cashOut').disabled = S.mode !== 'race' || c.settled;
  $('#cashOut').textContent = `確定 ${fmt(crashPayout(S.myBet.amt, c.displayed))} コイン`;
  $('#crashAutoNote').textContent = c.auto == null ? 'Enterで確定 ／ Spaceで応援' : `自動確定 ${c.auto.toFixed(2)}x ／ 手動確定も可能`;
  updateCrashPressure();
}
function clearCrashPressure() {
  $('#crashTension').hidden = true;
  $('#crashHud').removeAttribute('data-pressure');
  $('#crashPressureText').textContent = ''; $('#crashAtStake').textContent = '';
}
function updateCrashPressure() {
  const c = S.crash;
  if (!c || c.settled || S.mode !== 'race') { clearCrashPressure(); return; }
  const pressure = crashPressure(c.displayed);
  const colors = ['#46f0c6', '#ffcf3f', '#ff963f', '#ff4f9a', '#ff6262'];
  $('#crashHud').dataset.pressure = pressure.level;
  const edge = $('#crashTension'); edge.hidden = false;
  edge.style.setProperty('--tension-color', colors[pressure.level]);
  edge.style.setProperty('--tension-opacity', pressure.level * 0.10);
  const gain = crashPayout(S.myBet.amt, c.displayed) - S.myBet.amt;
  $('#crashAtStake').textContent = `未確定の利益 +${fmt(gain)} コイン`;
  if (pressure.milestone > (c.pressureMilestone ?? -1)) {
    c.pressureMilestone = pressure.milestone;
    c.pressureMessage = CRASH_PRESSURE_STEPS[pressure.milestone][1];
    c.pressureUntil = R.t + 5;
    say(c.pressureMessage, true);
    if (!S.muted) { if (pressure.level >= 3) AU.chime(); else AU.coin(); }
  }
  const prompts = ['どこで確定する？', '伸びる倍率、迫る決断。', '迷っている間も倍率は上がる！', 'この払戻、手放せる？', '高倍率！守るか、伸ばすか！'];
  const message = R.t < (c.pressureUntil || 0) ? c.pressureMessage : prompts[pressure.level];
  if ($('#crashPressureText').textContent !== message) $('#crashPressureText').textContent = message;
  if (pressure.level > 0 && R.t >= (c.nextPressureBeat || 0)) {
    c.nextPressureBeat = R.t + [0, 1.8, 1.3, 0.9, 0.65][pressure.level];
    if (!S.muted) {
      const t = AU.now(), vol = 0.04 + pressure.level * 0.02;
      AU.tone(65, t, 0.12, 'sine', vol, 40);
      AU.tone(60, t + 0.17, 0.1, 'sine', vol * 0.7, 40);
    }
  }
}
function cashOutCrash() {
  if (S.mode !== 'race' || !S.crash || S.crash.settled || document.hidden) return;
  settleCrash('manual', S.crash.displayed);
}
function settleCrash(reason, multiplier) {
  const c = S.crash; if (!c || c.settled) return;
  c.settled = true; R.running = false;
  const b = S.myBet, lost = reason === 'crash';
  const confirmed = lost ? null : reason === 'auto' || reason === 'limit' ? multiplier : crashDisplay(multiplier);
  const pay = lost ? 0 : crashPayout(b.amt, confirmed);
  c.reason = reason; c.confirmed = confirmed; c.pay = pay;
  clearCrashPressure();
  S.coins += pay; setCoins();
  guiding = false; store.set('crashGuideDone', true);
  timeTarget = timeScale = 1; slowUntil = 0; S.photo = false; FX.lines = 0;
  $('#hot').classList.remove('on'); $('#guideNote').hidden = true; VO.stop();
  const ordered = R.runners.slice().sort((a, d) => d.s - a.s || a.i - d.i);
  const rank = ordered.findIndex(r => r.i === b.h) + 1;
  const labels = { crash: 'クラッシュ — 疾走終了', manual: 'キャッシュアウト成功！', auto: '設定倍率で自動確定！', limit: '100.00x到達で自動確定！' };
  const net = pay - b.amt;
  setMode('result');
  $('#result').innerHTML = `<div class="panel"><div id="resTitle" class="${lost ? '' : 'win'}">${labels[reason]}</div><div class="resultHero"><strong>${lost ? '終了' : confirmed.toFixed(2) + 'x'}</strong><div><small>終了時点 ${rank}位</small><b>${b.h + 1}番 ${HORSES[b.h].name}</b></div></div><p id="resSub">${track.def.name} ／ ${lost ? `終了倍率 ${Math.max(1, multiplier).toFixed(2)}x` : `確定倍率 ${confirmed.toFixed(2)}x`}</p><div id="payout" class="${lost ? 'miss' : ''}"><div class="l"><b>ベット ${fmt(b.amt)} コイン</b><br>払戻（賭け分を含む）<br>差引収支 ${net > 0 ? '+' : ''}${fmt(net)} コイン</div><div class="r">${fmt(pay)}</div></div><p id="rewardNote">理論RTP 96.5%。整数丸めにより実際の期待払戻はわずかに下がります。無料補充は対象外。競馬の連勝・実績は更新されません。</p><div class="rbtns"><button id="again" class="pri">次のクラッシュへ</button><button id="other">次のコースへ</button></div></div>`;
  $('#again').onclick = () => { AU.pop(); enterLobby(false); };
  $('#other').onclick = () => { AU.pop(); S.ti = nextTrackIndex(S.ti, S.playType); store.set('track', S.ti); enterLobby(true); };
  if (lost) { big('疾走終了', 'sad', 1300); AU.sad(); }
  else { big('確定！', '', 1300); AU.jackpot(); confetti(120); coinShower(60); }
}
