// ターフビジョン（大型画面）の描画
'use strict';

/* ============ JUMBOTRON ============ */
function roundRect(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
function drawBoard() {
  if (!board) return;
  const g = board.g, Wd = 1024, Hd = 480;
  g.fillStyle = '#07051a'; g.fillRect(0, 0, Wd, Hd);
  const gr = g.createLinearGradient(0, 0, Wd, 0); gr.addColorStop(0, '#ff4f9a'); gr.addColorStop(1, '#ffcf3f');
  g.fillStyle = gr; g.fillRect(0, 0, Wd, 66);
  g.textBaseline = 'middle'; g.textAlign = 'left';
  g.fillStyle = '#1a0830'; g.font = '38px "Dela Gothic One", sans-serif'; g.fillText(track.def.name, 22, 35);
  g.textAlign = 'right'; g.font = '800 30px "Oxanium", sans-serif';
  const mode = S.mode;
  if (S.playType === 'crash' && mode === 'result') {
    g.fillText('CRASH RESULT', Wd - 22, 35);
    g.textAlign = 'center'; g.fillStyle = '#46f0c6'; g.font = '800 100px "Oxanium", sans-serif';
    g.fillText(S.crash.confirmed == null ? 'CRASH' : S.crash.confirmed.toFixed(2) + 'x', Wd / 2, 200);
    g.fillStyle = '#fff'; g.font = '36px "Dela Gothic One", sans-serif'; g.fillText(HORSES[S.myBet.h].name, Wd / 2, 310);
    g.font = '800 48px "Oxanium", sans-serif'; g.fillText(`${fmt(S.crash.pay)} COINS`, Wd / 2, 400);
  } else if (mode === 'lobby' || mode === 'intro' || mode === 'countdown') {
    g.fillText(S.playType === 'crash' ? 'CRASH RTP 96.5%' : 'ODDS 単勝', Wd - 22, 35);
    for (let i = 0; i < 8; i++) {
      const col = i < 4 ? 0 : 1, row = i % 4, x = 24 + col * 500, y = 96 + row * 94;
      g.fillStyle = 'rgba(255,255,255,.06)'; roundRect(g, x, y, 476, 80, 12); g.fill();
      g.fillStyle = WAKU[i][0]; roundRect(g, x + 10, y + 12, 56, 56, 10); g.fill();
      g.fillStyle = WAKU[i][1]; g.textAlign = 'center'; g.font = '800 38px "Oxanium", sans-serif'; g.fillText(String(i + 1), x + 38, y + 42);
      g.textAlign = 'left'; g.fillStyle = i === S.sel ? '#ffcf3f' : '#ffffff'; g.font = '30px "Dela Gothic One", sans-serif'; g.fillText(HORSES[i].name, x + 82, y + 42);
      g.textAlign = 'right'; g.fillStyle = '#ffcf3f'; g.font = '800 40px "Oxanium", sans-serif'; g.fillText(S.playType === 'crash' ? '↑' : S.odds ? S.odds.win[i].toFixed(1) : '--', x + 462, y + 42);
    }
  } else if (mode === 'race' || mode === 'finish') {
    g.fillStyle = '#e5243b'; g.beginPath(); g.arc(Wd - 150, 35, 11, 0, 7); g.fill(); g.fillStyle = '#1a0830'; g.fillText('LIVE', Wd - 22, 35);
    const ord = R.order;
    ord.forEach((r, k) => {
      const y = 82 + k * 49;
      g.fillStyle = k % 2 ? 'rgba(255,255,255,.03)' : 'rgba(255,255,255,.07)'; g.fillRect(20, y, 640, 44);
      g.textAlign = 'center'; g.fillStyle = '#ffcf3f'; g.font = '800 30px "Oxanium", sans-serif'; g.fillText(String(k + 1), 50, y + 23);
      g.fillStyle = WAKU[r.i][0]; roundRect(g, 82, y + 5, 36, 34, 7); g.fill(); g.fillStyle = WAKU[r.i][1]; g.font = '800 26px "Oxanium", sans-serif'; g.fillText(String(r.i + 1), 100, y + 23);
      g.textAlign = 'left'; g.fillStyle = S.myBet && r.i === S.myBet.h ? '#ffcf3f' : '#fff'; g.font = '26px "Dela Gothic One", sans-serif'; g.fillText(r.def.name, 134, y + 23);
    });
    const lead = ord[0]; const rem = Math.max(0, Math.ceil(R.D - lead.s));
    g.textAlign = 'center'; g.fillStyle = '#cbbfe6'; g.font = '30px "Dela Gothic One", sans-serif'; g.fillText(R.continuous ? '走行距離' : lead.fin ? 'GOAL' : '残り', 842, 150);
    g.fillStyle = '#ffffff'; g.font = '800 120px "Oxanium", sans-serif'; g.fillText(R.continuous ? String(Math.floor(Math.max(0, lead.s))) : lead.fin ? '★' : String(rem), 842, 250);
    g.fillStyle = '#cbbfe6'; g.font = '800 34px "Oxanium", sans-serif'; g.fillText(fmtTime(R.t), 842, 360);
  } else if (mode === 'result') {
    g.fillText('RESULT', Wd - 22, 35);
    const ord = R.runners.slice().sort((a, b) => a.place - b.place).slice(0, 3);
    ord.forEach((r, k) => {
      const y = 96 + k * 124;
      g.fillStyle = ['rgba(255,207,63,.25)', 'rgba(220,230,255,.14)', 'rgba(255,150,90,.14)'][k]; roundRect(g, 24, y, 976, 108, 16); g.fill();
      g.textAlign = 'center'; g.fillStyle = ['#ffcf3f', '#e6ecff', '#ffa56b'][k]; g.font = '64px "Dela Gothic One", sans-serif'; g.fillText(`${k + 1}着`, 110, y + 56);
      g.fillStyle = WAKU[r.i][0]; roundRect(g, 200, y + 22, 64, 64, 12); g.fill(); g.fillStyle = WAKU[r.i][1]; g.font = '800 44px "Oxanium", sans-serif'; g.fillText(String(r.i + 1), 232, y + 56);
      g.textAlign = 'left'; g.fillStyle = '#fff'; g.font = '48px "Dela Gothic One", sans-serif'; g.fillText(r.def.name, 290, y + 56);
      g.textAlign = 'right'; g.fillStyle = '#cbbfe6'; g.font = '800 34px "Oxanium", sans-serif'; g.fillText(fmtTime(r.finT), 980, y + 56);
    });
  }
  g.fillStyle = 'rgba(0,0,0,.2)'; for (let y = 0; y < Hd; y += 4) g.fillRect(0, y, Wd, 1.4);
  board.tex.needsUpdate = true;
}
