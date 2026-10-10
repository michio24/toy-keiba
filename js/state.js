// ゲーム全体の状態（S）
'use strict';

/* ============ STATE ============ */
// One atomic snapshot keeps the shared balance and an unfinished crash bet together.
const crashAccount = store.get('crashAccount', null);
const S = {
  mode: 'loading', ti: clamp(store.get('track', 0) | 0, 0, TRACKS.length - 1), sel: clamp(store.get('sel', 0) | 0, 0, 7),
  betType: 'win', bet: 100, coins: store.get('coins', 1000), streak: store.get('streak', 0),
  cam: 'broadcast', camTarget: null, cheer: 0, muted: store.get('muted', false), odds: null, conds: null, myBet: null,
  playType: store.get('playType', 'race') === 'crash' ? 'crash' : 'race', crash: null,
  interrupted: !!crashAccount?.pending
};
// Special courses must be explicitly selected from the course list in this session.
if (TRACKS[S.ti].manualOnly) S.ti = 0;
if (Number.isSafeInteger(crashAccount?.coins) && crashAccount.coins >= 0) S.coins = crashAccount.coins;
if (typeof S.coins !== 'number' || !isFinite(S.coins)) S.coins = 1000;
