// 枠色・馬場・天候・適性など、レースの基本ルール表
'use strict';

/* ============ DATA ============ */
const WAKU = [['#f7f7f7','#1a1a1a'],['#1c1c24','#ffffff'],['#e53a2f','#ffffff'],['#2f6fe4','#ffffff'],['#f6d31e','#1a1a1a'],['#27ae4f','#ffffff'],['#f58a1f','#ffffff'],['#f48fb8','#ffffff']];
const SURF = { turf: '芝', dirt: 'ダート', snow: '雪', sand: '砂', asphalt: '舗装' };
const STYLE = { nige: '逃げ', senko: '先行', sashi: '差し', oikomi: '追込' };
const COND = ['▲', '△', '○', '◎'];
const GOING = ['良', '稍重', '重', '不良'];
const WX = { sunny: '晴', cloudy: '曇', drizzle: '小雨', rain: '雨', flurry: '小雪', snow: '雪' };
const WX_TABLE = {
  sakura: { sunny: 45, cloudy: 25, drizzle: 15, rain: 15 }, neon: { sunny: 35, cloudy: 30, drizzle: 15, rain: 20 },
  aurora: { sunny: 35, cloudy: 30, flurry: 20, snow: 15 }, dune: { sunny: 75, cloudy: 25 },
  skyGarden: { sunny: 75, cloudy: 25 }, candy: { sunny: 80, cloudy: 20 },
  moonForest: { sunny: 50, cloudy: 35, drizzle: 15 }, dragonCrater: { sunny: 1 },
  pearlOcean: { sunny: 1 }, clockwork: { sunny: 70, cloudy: 30 },
  hakone: { sunny: 55, cloudy: 30, drizzle: 15 },
  boxHill: { sunny: 60, cloudy: 30, drizzle: 10 },
  tokyo: { sunny: 45, cloudy: 25, drizzle: 15, rain: 15 }, nakayama: { sunny: 45, cloudy: 30, flurry: 15, rain: 10 },
  hanshin: { sunny: 45, cloudy: 25, drizzle: 15, rain: 15 }, chukyo: { sunny: 45, cloudy: 25, drizzle: 15, rain: 15 },
  sapporo: { sunny: 55, cloudy: 30, drizzle: 10, rain: 5 },
  kasamatsu: { sunny: 50, cloudy: 25, drizzle: 15, rain: 10 },
  yamanote: { sunny: 55, cloudy: 25, drizzle: 10, rain: 10 },
  osakaLoop: { sunny: 60, cloudy: 25, drizzle: 8, rain: 7 },
  meydan: { sunny: 85, cloudy: 13, drizzle: 2 }, shatin: { sunny: 45, cloudy: 30, drizzle: 15, rain: 10 },
  kyoto: { sunny: 50, cloudy: 25, drizzle: 15, rain: 10 }, niigata: { sunny: 50, cloudy: 20, drizzle: 10, rain: 20 },
  longchamp: { sunny: 30, cloudy: 35, drizzle: 20, rain: 15 }, churchill: { sunny: 50, cloudy: 25, drizzle: 10, rain: 15 },
};
// going distribution [良, 稍重, 重, 不良] by weather
const GOING_TABLE = { sunny: [70, 25, 5, 0], cloudy: [55, 30, 15, 0], drizzle: [10, 50, 35, 5], rain: [0, 10, 45, 45], flurry: [20, 50, 30, 0], snow: [0, 20, 50, 30] };
function pickW(tab) { let t = 0; for (const k in tab) t += tab[k]; let r = Math.random() * t; for (const k in tab) { r -= tab[k]; if (r < 0) return k; } return Object.keys(tab)[0]; }
function rollWeather(def) {
  const w = pickW(WX_TABLE[def.theme] || { sunny: 1 });
  const gt = GOING_TABLE[w]; let g = +pickW({ 0: gt[0], 1: gt[1], 2: gt[2], 3: gt[3] });
  if (def.surf === 'sand') g = Math.min(g, 1);
  if (def.theme === 'longchamp' && Math.random() < 0.35) g = Math.min(3, g + 1);   // パリの秋は馬場が渋りやすい
  return { w, g };
}
// 道悪適性 -2..2: パワーから決まり、種類ごとの個性で上書き
function mudOf(d) { return d.mud != null ? d.mud : clamp(Math.round((d.st.pow - 6) / 2), -1, 1); }

const AFFM = { '-2': '✕', '-1': '△', '0': '−', '1': '○', '2': '◎' };
function affinityOf(d, surf) { return d.aff[surf] ?? (surf === 'asphalt' ? -1 : 0); }
