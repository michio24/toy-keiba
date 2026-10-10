// 実績と初回ガイド
'use strict';

/* Local progress: rewards are granted once, including after a loss. */
const savedProgress = store.get('progress', {});
const progress = {
  races: Math.max(0, Number(savedProgress?.races) || 0),
  horses: Array.isArray(savedProgress?.horses) ? savedProgress.horses.filter(n => typeof n === 'string') : [],
  tracks: Array.isArray(savedProgress?.tracks) ? savedProgress.tracks.filter(n => typeof n === 'string') : [],
  cheers: Math.max(0, Number(savedProgress?.cheers) || 0),
  claimed: Array.isArray(savedProgress?.claimed) ? savedProgress.claimed.filter(n => typeof n === 'string') : []
};
const goals = [
  {id:'first', title:'はじめの一歩', desc:'1レース完走', value:() => progress.races, target:1, reward:100},
  {id:'horses', title:'みんなの応援団', desc:'異なる3頭で完走', value:() => progress.horses.length, target:3, reward:200},
  {id:'tracks', title:'コース探検家', desc:'異なる3コースで完走', value:() => progress.tracks.length, target:3, reward:200},
  {id:'cheer', title:'声援の達人', desc:'応援ブーストを3回使う', value:() => progress.cheers, target:3, reward:150},
  {id:'ten', title:'常連サポーター', desc:'10レース完走', value:() => progress.races, target:10, reward:300}
];
let guiding = !store.get('guideDone', false), raceCheers = 0;
function renderJourney() {
  // ガイドは初回（または「遊び方」押下時）だけ表示し、実績はメニュー行のボタンから開閉する
  const j = $('#journey'); j.hidden = !guiding; $('#showGuide').hidden = guiding;
  j.innerHTML = guiding ? '<b>はじめてのトイ競馬</b><p>①「出走馬」から好きな馬を選ぶ → ②「出走！」 → ③応援ボタンで後押し。コースは「コース」タブで変更できます。コインはゲーム内専用です。</p><div class="jbtns"><button id="easyStart">おまかせで初レース</button><button id="skipGuide">ガイドを終了</button></div>' : '';
  if (guiding && S.playType === 'crash') j.innerHTML = '<b>競馬クラッシュの遊び方</b><p>①馬と賭け額を選んで出走 → ②応援で順位を上げると倍率が速く上昇 → ③疾走終了前にボタンかEnterで確定。自動確定も設定できます。ゴールを通過して走り続けます。100.00xで自動確定します。開始直後に終了する場合もあります。未確定で再読み込みすると払戻はありません。</p><div class="jbtns"><button id="easyStart">100コインで初クラッシュ</button><button id="skipGuide">ガイドを終了</button></div>';
  $('#achCount').textContent = `${progress.claimed.length}/${goals.length}`;
  $('#achList').innerHTML = `<p>勝っても負けても、完走で記録が増えます。</p><ul>${goals.map(g => `<li class="${progress.claimed.includes(g.id) ? 'done' : ''}"><span>${progress.claimed.includes(g.id) ? '🏅' : '○'}</span><b>${g.title}</b><small>${g.desc}（${Math.min(g.value(),g.target)}/${g.target}）・${g.reward}コイン</small></li>`).join('')}</ul>`;
  if (guiding) {
    $('#easyStart').onclick = () => { S.betType = 'place'; S.bet = 100; if (S.playType === 'crash') { $('#autoEnabled').checked = false; $('#autoMultiplier').disabled = true; } if (S.ti !== 0) { S.ti = 0; store.set('track',0); enterLobby(true); } renderSlip(); startRace(); };
    $('#skipGuide').onclick = () => { guiding = false; store.set(S.playType === 'crash' ? 'crashGuideDone' : 'guideDone',true); renderJourney(); };
  }
}
$('#showGuide').onclick = () => { guiding = true; renderJourney(); $('#rail').scrollTop = 0; };
$('#achBtn').onclick = () => { const l = $('#achList'); l.hidden = !l.hidden; $('#achBtn').setAttribute('aria-expanded', String(!l.hidden)); };
function completeProgress(me) {
  progress.races++;
  if (!progress.horses.includes(me.def.name)) progress.horses.push(me.def.name);
  if (!progress.tracks.includes(track.def.name)) progress.tracks.push(track.def.name);
  progress.cheers += raceCheers;
  const unlocked = goals.filter(g => !progress.claimed.includes(g.id) && g.value() >= g.target);
  unlocked.forEach(g => progress.claimed.push(g.id));
  store.set('progress',progress);
  guiding = false; store.set('guideDone',true);
  return unlocked;
}
