// ロビー・馬券・カメラ切替などの画面UI
'use strict';

/* ============ UI ============ */
const fmtTime = t => { const m = Math.floor(t / 60), s = t - m * 60; return `${m}:${s < 10 ? '0' : ''}${s.toFixed(1)}`; };
function gapTxt(L) { return L < 0.25 ? 'ハナ' : L < 0.4 ? 'アタマ' : L < 0.6 ? 'クビ' : `${L.toFixed(1)}馬身`; }
function marginTxt(L) {
  if (L < 0.2) return 'ハナ'; if (L < 0.35) return 'アタマ'; if (L < 0.55) return 'クビ'; if (L < 0.8) return '1/2'; if (L < 1.1) return '3/4'; if (L >= 10) return '大差';
  const q = Math.round(L * 4) / 4, w = Math.floor(q), fr = q - w; return `${w}${fr === 0.25 ? ' 1/4' : fr === 0.5 ? ' 1/2' : fr === 0.75 ? ' 3/4' : ''}`;
}
function setCoins() {
  store.set('crashAccount', { coins: S.coins, pending: !!S.crash && !S.crash.settled });
  $('#coins').textContent = fmt(S.coins); store.set('coins', S.coins);
  const st = $('#streak'); st.hidden = S.playType === 'crash' || S.streak < 1;
  st.textContent = `${S.streak}連勝中 ×${(1 + 0.1 * S.streak).toFixed(1)}`; store.set('streak', S.streak);
}
const ICON_ON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H2v6h4l5 4V5z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14"/></svg>';
const ICON_OFF = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H2v6h4l5 4V5z"/><path d="m23 9-6 6M17 9l6 6"/></svg>';
function setMuteIcon() { $('#mute').innerHTML = S.muted ? ICON_OFF : ICON_ON; }
$('#mute').onclick = () => { S.muted = !S.muted; store.set('muted', S.muted); setMuteIcon(); AU.init(); AU.setMute(S.muted); if (S.muted) VO.stop(); };

const coursePreviews = new Map();
function coursePreview(t) {
  if (coursePreviews.has(t)) return coursePreviews.get(t);
  const tr = new Track(t), pts = [];
  for (let n = 0; n <= 96; n++) pts.push(tr.pos(tr.L * n / 96, W / 2));
  const xs = pts.map(p => p.x), zs = pts.map(p => p.z);
  const x0 = Math.min(...xs), z0 = Math.min(...zs), dx = Math.max(...xs) - x0, dz = Math.max(...zs) - z0;
  const scale = Math.min(124 / Math.max(dx, 1), 40 / Math.max(dz, 1));
  const xy = p => `${(18 + (124 - dx * scale) / 2 + (p.x - x0) * scale).toFixed(1)},${(9 + (40 - dz * scale) / 2 + (p.z - z0) * scale).toFixed(1)}`;
  const path = pts.map((p, n) => (n ? 'L' : 'M') + xy(p)).join(' ') + (tr.closed ? ' Z' : '');
  const fin = xy(tr.pos(tr.finishS, W / 2)).split(',');
  const svg = `<svg viewBox="0 0 160 58" aria-hidden="true"><path d="${path}" fill="none" stroke="#24183d" stroke-width="9" stroke-linejoin="round"/><path d="${path}" fill="none" stroke="#fff4d5" stroke-width="4" stroke-linejoin="round"/><circle cx="${fin[0]}" cy="${fin[1]}" r="4" fill="#ff4f9a" stroke="#fff" stroke-width="1.5"/></svg>`;
  coursePreviews.set(t, svg); return svg;
}
$('#lobbyToggle').onclick = () => {
  const collapsed = $('#lobby').classList.toggle('collapsed');
  $('#lobbyToggle').setAttribute('aria-expanded', String(!collapsed));
  $('#lobbyToggle').textContent = collapsed ? '▲ 馬・コース・馬券を選ぶ' : '▼ パネルをたたんでコースを見る';
  $('#lobbyScroll').scrollTop = 0;
};
/* ロビーのタブ（PCは出走馬／コース、スマホは馬券も含む3タブ）とコースの絞り込み */
const LOBBY_TABS = ['horses', 'tracks', 'slip'];
const TRACK_DOMESTIC = ['sapporo', 'niigata', 'nakayama', 'tokyo', 'kasamatsu', 'chukyo', 'kyoto', 'hanshin'];
const TRACK_OVERSEAS = ['shatin', 'meydan', 'longchamp', 'churchill'];
const trackGroupOf = t => !t.real ? 'fantasy' : TRACK_DOMESTIC.includes(t.theme) ? 'domestic' : 'overseas';
const TRACK_GROUPS = [
  ['fantasy', 'ファンタジー', 'ファンタジーコース（距離順）', (a, b) => a.t.D - b.t.D],
  ['domestic', '国内', '名コース　国内（北から順）', (a, b) => TRACK_DOMESTIC.indexOf(a.t.theme) - TRACK_DOMESTIC.indexOf(b.t.theme)],
  ['overseas', '海外', '名コース　海外', (a, b) => { const o = t => TRACK_OVERSEAS.includes(t.theme) ? TRACK_OVERSEAS.indexOf(t.theme) : TRACK_OVERSEAS.length; return o(a.t) - o(b.t) || a.t.name.localeCompare(b.t.name, 'ja'); }]
];
const isNarrow = matchMedia('(max-width:760px)');
let lobbyTab = LOBBY_TABS.includes(store.get('lobbyTab')) ? store.get('lobbyTab') : 'horses';
let trackGroup = store.get('trackGroup', null);
function setLobbyTab(tab, focus) {
  // PC幅では馬券パネルが常に見えているので「馬券」タブは出走馬タブとして扱う
  if (tab === 'slip' && !isNarrow.matches) tab = 'horses';
  const changed = $('#lobby').dataset.tab !== tab;
  lobbyTab = tab; store.set('lobbyTab', tab);
  $('#lobby').dataset.tab = tab;
  $('#lobbyTabs').querySelectorAll('[role=tab]').forEach(b => { const on = b.dataset.tab === tab; b.setAttribute('aria-selected', String(on)); b.tabIndex = on ? 0 : -1; if (on && focus) b.focus(); });
  $('#paneHorses').hidden = tab !== 'horses';
  $('#paneTracks').hidden = tab !== 'tracks';
  if (!changed) return;
  $('#lobbyScroll').scrollTop = 0; $('#rail').scrollTop = 0;
  // コースタブを開いたら選択中のコースが見える位置まで送る
  if (tab === 'tracks') $('#tracks .tcard.on')?.scrollIntoView({ block: 'nearest' });
}
isNarrow.addEventListener?.('change', () => setLobbyTab(lobbyTab));
// PCでは馬券パネルを出走バーのすぐ上に積むため、出走バーの高さをCSS変数に渡す
new ResizeObserver(() => $('#lobby').style.setProperty('--goH', $('#goBar').offsetHeight + 'px')).observe($('#goBar'));
$('#lobbyTabs').addEventListener('click', e => { const b = e.target.closest('[role=tab]'); if (!b) return; AU.init(); AU.pop(); setLobbyTab(b.dataset.tab); });
$('#lobbyTabs').addEventListener('keydown', e => {
  // 左右キーでタブ移動（表示中のタブだけを対象にする）
  if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
  const tabs = [...$('#lobbyTabs').querySelectorAll('[role=tab]')].filter(b => b.offsetParent);
  const k = tabs.findIndex(b => b.dataset.tab === lobbyTab);
  e.preventDefault(); setLobbyTab(tabs[(k + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length].dataset.tab, true);
});
$('#raceTrack').addEventListener('click', () => { AU.init(); AU.pop(); setLobbyTab('tracks'); });
$('#tgroups').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; trackGroup = b.dataset.g; store.set('trackGroup', trackGroup); AU.init(); AU.pop(); renderTracks(); $('#rail').scrollTop = 0; });
function renderTracks() {
  const courses = availableTracks(S.playType);
  if (trackGroup !== 'all' && !TRACK_GROUPS.some(([g]) => g === trackGroup)) trackGroup = trackGroupOf(TRACKS[S.ti]);
  $('#tgroups').innerHTML = [['all', 'すべて'], ...TRACK_GROUPS].map(([g, label]) => `<button data-g="${g}" aria-pressed="${g === trackGroup}">${label}<small>${g === 'all' ? courses.length : courses.filter(({t}) => trackGroupOf(t) === g).length}</small></button>`).join('');
  const tcard = (t, i) => `<button class="tcard ${i === S.ti ? 'on' : ''}" data-i="${i}" aria-pressed="${i === S.ti}" style="--g:${t.grad}"><span class="tsw">${coursePreview(t)}${t.real ? '<i class="meiba">名コース</i>' : ''}</span><span class="tname">${t.name}</span><span class="tmeta"><b>${SURF[t.surf]}</b>${t.D}m・${t.time}</span></button>`;
  $('#tracks').innerHTML = TRACK_GROUPS.filter(([g]) => trackGroup === 'all' || trackGroup === g).map(([g, , label, sort]) =>
    `<span class="tgrp">${label}</span>` + courses.filter(({t}) => trackGroupOf(t) === g).sort(sort).map(({t, i}) => tcard(t, i)).join('')).join('');
}
function renderLobby() {
  document.body.dataset.play = S.playType;
  $('#playTypes').querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.play === S.playType)));
  $('#recoveryNote').hidden = !S.interrupted;
  $('#recoveryNote').textContent = '前回の未確定クラッシュは終了しました。賭けたコインの払戻はありません。';
  renderJourney();
  renderTracks();
  $('#trackCount').textContent = `${availableTracks(S.playType).length}`;
  { const t = TRACKS[S.ti];
    $('#raceTrack').style.setProperty('--g', t.grad);
    $('#raceTrack').innerHTML = `<span class="tsw">${coursePreview(t)}</span><span class="rtx"><small>今日のレース${t.real ? '<i class="meiba">名コース</i>' : ''}</small><b>${t.name}</b><span class="tmeta"><b>${SURF[t.surf]}</b>${t.D}m・${t.time}</span></span><span class="chg">変更</span>`; }
  $('#tdesc').textContent = TRACKS[S.ti].desc;
  { const t = TRACKS[S.ti], el = $('#tmotif'); el.hidden = !t.motif; if (t.motif) el.innerHTML = `<b>モチーフ　${t.motif}</b>${t.motifNote}<small>${t.points ? '馬が走れる幅と曲がり具合に調整したモチーフコースです。' : t.scale === 1 ? `距離は実寸です。${t.elev?.length ? `起伏の高さは見やすいように約${t.elevEx || ELEV_EX}倍に誇張しています。` : ''}` : `公式コース図を参考に形状を近似し、距離は約1/2に縮めています。${t.elev?.length ? `坂の位置を反映し、高さは見やすいように約${t.elevEx || ELEV_EX}倍に誇張しています。` : '景観は特徴が伝わるように強調しています。'}`}</small>`; }
  $('#poolNote').textContent = `全${ROSTER.length}頭からランダムに8頭`;
  { const b = $('#wxBox'), wc = { sunny: '#ffcf3f', cloudy: '#c9d2e0', drizzle: '#9cc3ff', rain: '#6fa8ff', flurry: '#e6f0ff', snow: '#ffffff' }[S.wx.w];
    const gc = ['rgba(70,240,198,.2)', 'rgba(255,207,63,.2)', 'rgba(255,150,70,.25)', 'rgba(255,80,110,.28)'][S.wx.g];
    b.style.setProperty('--wc', wc); b.style.setProperty('--gc', gc);
    b.innerHTML = `<span class="ic">${WX_ICON[S.wx.w]}</span><div class="wl"><span><small>天候</small>${WX[S.wx.w]}</span><span><small>馬場</small><span class="gd">${SURF[track.def.surf]}・${GOING[S.wx.g]}</span></span></div><p>${goingNote()}</p>`; }
  $('#horses').innerHTML = HORSES.map((h, i) => `<button class="hrow ${i === S.sel ? 'on' : ''}" data-i="${i}"><span class="num" style="background:${WAKU[i][0]};color:${WAKU[i][1]}">${i + 1}</span><span class="hn"><b>${h.tags?.includes('歴史') ? '<i class="meiba history">歴史</i>' : h.motif ? '<i class="meiba">名馬</i>' : ''}${h.name}</b><small>${h.type}・${STYLE[h.style]}・調子${COND[S.conds[i] + 1]}</small></span><span class="od">${S.odds.win[i].toFixed(1)}<small>単勝・${S.odds.pop[i]}番人気</small></span></button>`).join('');
  if (S.playType === 'crash') $('#horses').querySelectorAll('.od').forEach(el => { el.innerHTML = '↑<small>上位で倍率加速</small>'; });
  renderSlip();
}
function renderSlip() {
  const crash = S.playType === 'crash';
  $('#btype').hidden = crash; $('#crashSettings').hidden = !crash;
  $('#go').textContent = crash ? 'クラッシュ出走！' : '出走！';
  $('#tabSlip').firstChild.textContent = crash ? 'ベット' : '馬券';
  const i = S.sel, h = HORSES[i], t = TRACKS[S.ti];
  $('#slipHead').innerHTML = `<span class="num" style="background:${WAKU[i][0]};color:${WAKU[i][1]}">${i + 1}</span><div><div class="nm">${h.name}</div><div class="tp">${h.type}・${STYLE[h.style]}・調子 ${COND[S.conds[i] + 1]}・${S.odds.pop[i]}番人気</div></div>`;
  const mo = $('#motif'); mo.hidden = !h.motif; if (h.motif) mo.innerHTML = `<b>名馬モチーフ</b>${h.motifNote}`;
  $('#blurb').textContent = h.blurb;
  const labs = [['spd', 'スピード'], ['sta', 'スタミナ'], ['acc', '加速'], ['pow', '根性'], ['agi', '器用さ']];
  $('#stats').innerHTML = labs.map(([k, l]) => `<span>${l}</span><i style="--w:${h.st[k] * 10}%"></i><em>${h.st[k]}</em>`).join('');
  $('#aff').innerHTML = Object.keys(SURF).map(s => { const a = affinityOf(h, s); return `<span class="${s === t.surf ? (a > 0 ? 'hot' : a < 0 ? 'cold' : '') : ''}">${SURF[s]} ${AFFM[a]}${s === t.surf ? '（このコース）' : ''}</span>`; }).join('')
    + (() => { const m = mudOf(h); return `<span class="${S.wx.g >= 1 ? (m > 0 ? 'hot' : m < 0 ? 'cold' : '') : ''}">道悪 ${AFFM[m]}${S.wx.g >= 1 ? `（今日は${GOING[S.wx.g]}）` : ''}</span>`; })();
  const sk = $('#skill'); sk.style.setProperty('--sc', h.skill.color); sk.innerHTML = `<b>スキル「${h.skill.name}」</b><p>${h.skill.desc}</p>`;
  $('#btype').innerHTML = `<button data-t="win" class="${S.betType === 'win' ? 'on' : ''}">単勝（1着）<small>${S.odds.win[i].toFixed(1)}倍</small></button><button data-t="place" class="${S.betType === 'place' ? 'on' : ''}">複勝（3着以内）<small>${S.odds.place[i].toFixed(1)}倍</small></button>`;
  const amounts = [100, 500, 1000, 'ALL'];
  if (S.bet !== 'ALL' && S.bet > S.coins) S.bet = S.coins >= 100 ? 100 : S.coins;
  $('#chips').innerHTML = amounts.map(a => `<button data-a="${a}" class="${S.bet === a ? 'on' : ''}" ${a !== 'ALL' && a > S.coins ? 'disabled' : ''}>${a === 'ALL' ? 'ALL IN' : fmt(a)}</button>`).join('');
  const amt = betAmt(), odds = S.betType === 'win' ? S.odds.win[i] : S.odds.place[i];
  if (crash) {
    const auto = $('#autoEnabled').checked, value = $('#autoMultiplier').value;
    $('#preview').innerHTML = `<span class="pv1"><span class="num" style="background:${WAKU[i][0]};color:${WAKU[i][1]}">${i + 1}</span><b class="pvn">${h.name}</b></span><span class="pv2">${fmt(amt)}コイン ／ ${auto && validCrashAuto(value) ? `自動確定 ${Number(value).toFixed(2)}x` : auto ? '倍率を1.01〜100.00で入力' : '手動でキャッシュアウト'}</span>`;
    $('#slipTabNote').textContent = `${i + 1}番・クラッシュ`;
    $('#go').disabled = amt <= 0 || (auto && !validCrashAuto(value));
    $('#hint').textContent = 'Enterで確定／Spaceで応援／1〜6でカメラ切替';
    return;
  }
  const bonus = 1 + 0.1 * S.streak;
  // 出走バーには「どの馬に・何を・いくら」賭けたかを常に表示する（スマホで別タブにいても確認できるように）
  const bt = S.betType === 'win' ? '単勝' : '複勝';
  $('#preview').innerHTML = `<span class="pv1"><span class="num" style="background:${WAKU[i][0]};color:${WAKU[i][1]}">${i + 1}</span><b class="pvn">${h.name}</b></span><span class="pv2"><span class="pvt">${bt} ${odds.toFixed(1)}倍 × ${fmt(amt)}</span> → 的中で <b>${fmt(Math.floor(amt * odds * bonus))}</b>${S.streak ? `<small>（連勝×${bonus.toFixed(1)}込み）</small>` : ''}</span>`;
  $('#slipTabNote').textContent = `${i + 1}番・${bt}`;
  $('#go').disabled = amt <= 0;
}
const betAmt = () => S.bet === 'ALL' ? S.coins : Math.min(S.bet, S.coins);
$('#playTypes').addEventListener('click', e => {
  const b = e.target.closest('[data-play]');
  if (!b || S.mode !== 'lobby' || S.playType === b.dataset.play) return;
  S.playType = b.dataset.play; store.set('playType', S.playType);
  guiding = !store.get(S.playType === 'crash' ? 'crashGuideDone' : 'guideDone', false);
  AU.init(); AU.pop(); enterLobby(false);
});
$('#autoEnabled').onchange = () => { $('#autoMultiplier').disabled = !$('#autoEnabled').checked; renderSlip(); };
$('#autoMultiplier').oninput = renderSlip;
$('#cashOut').onclick = () => cashOutCrash();
$('#tracks').addEventListener('click', e => { const b = e.target.closest('.tcard'); if (!b) return; const i = +b.dataset.i; if (i === S.ti) return; S.ti = i; store.set('track', i); AU.init(); AU.pop(); enterLobby(true); });
$('#horses').addEventListener('click', e => { const b = e.target.closest('.hrow'); if (!b) return; selectHorse(+b.dataset.i); });
$('#btype').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; S.betType = b.dataset.t; AU.init(); AU.pop(); renderSlip(); });
$('#chips').addEventListener('click', e => { const b = e.target.closest('button'); if (!b || b.disabled) return; S.bet = b.dataset.a === 'ALL' ? 'ALL' : +b.dataset.a; AU.init(); AU.coin(); renderSlip(); });
$('#go').addEventListener('click', () => startRace());
function selectHorse(i, quiet) {
  S.sel = i; store.set('sel', i); if (!quiet) { AU.init(); AU.pop(); }
  horses[i].hop = 1;
  $('#horses').querySelectorAll('.hrow').forEach((b, k) => b.classList.toggle('on', k === i));
  renderSlip(); drawBoard();
  const f = tp(R.s0 - 14, R.runners[i].lane); cam.base = Math.atan2(f.dir.z, f.dir.x); cam.yaw = cam.base + 0.5; cam.pitch = 0.2; cam.dist = 7.5; cam.drag = -10;
}

const CAMS = [['broadcast', '中継'], ['chase', '追走'], ['aerial', '空撮'], ['front', '正面'], ['pov', '馬目線'], ['free', 'フリー']];
$('#cams').innerHTML = CAMS.map(([k, l], i) => `<button data-c="${k}"><kbd>${i + 1}</kbd>${l}</button>`).join('');
$('#cams').addEventListener('click', e => { const b = e.target.closest('button'); if (b) setCam(b.dataset.c); });
$('#stand').addEventListener('click', e => { const b = e.target.closest('button[data-runner]'); if (!b) return; const i = Number(b.dataset.runner); setCamTarget(S.camTarget === i ? null : i); });
function setCam(k) {
  if (k === 'free' && S.cam !== 'free') { const d = camera.position.clone().sub(cam.tgt); cam.dist = clamp(d.length(), 8, 120); cam.yaw = Math.atan2(d.z, d.x); cam.pitch = clamp(Math.asin(d.y / Math.max(d.length(), 0.01)), 0.05, 1.4); }
  S.cam = k; S.photo = false;
  $('#cams').querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.c === k));
}
function setCamTarget(i) {
  if (i !== null && !R.runners.some(r => r.i === i)) return;
  S.camTarget = i; cam.spr = null; cam.bf = null;
  if (i !== null && (S.photo || (S.photoDone && !S.photoEnd))) { S.photo = false; S.photoEnd = true; timeTarget = 1; slowUntil = 0; }
  updateCamTargetUI();
}
function updateCamTargetUI() {
  $('#stand').querySelectorAll('button[data-runner]').forEach(b => {
    const watching = Number(b.dataset.runner) === S.camTarget;
    b.classList.toggle('watching', watching); b.setAttribute('aria-pressed', String(watching));
  });
}
function toast(html, color) { const el = document.createElement('div'); el.style.setProperty('--c', color); el.innerHTML = html; const f = $('#feed'); f.prepend(el); while (f.children.length > 4) f.lastChild.remove(); setTimeout(() => el.remove(), 4200); }
let tickT = 0;
function say(txt, priority = false) { const el = $('#tickTxt'); el.textContent = txt; el.classList.remove('in'); void el.offsetWidth; el.classList.add('in'); tickT = R ? R.t : 0; VO.say(txt, priority); }
function big(text, cls = '', dur = 1200) { const el = $('#big'); el.className = ''; void el.offsetWidth; el.textContent = text; el.className = 'show ' + cls; clearTimeout(big.t); big.t = setTimeout(() => { el.className = ''; }, dur); }
function cutin(r) {
  const el = $('#cutin'); el.style.setProperty('--c', r.def.skill.color);
  el.innerHTML = `<div class="band"><span class="num" style="background:${WAKU[r.i][0]};color:${WAKU[r.i][1]}">${r.i + 1}</span><div class="txt"><small>${r.def.name}</small><b>${r.def.skill.name}</b></div></div>`;
  el.hidden = false; el.classList.remove('go'); void el.offsetWidth; el.classList.add('go'); clearTimeout(cutin.t); cutin.t = setTimeout(() => { el.hidden = true; }, 1600);
}
