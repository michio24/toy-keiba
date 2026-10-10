// テスト用：ブラウザなしで、ゲームのうち描画・DOMに依存しない部分を読み込む。
// ブラウザと同じく、同じコンテキストで実行したスクリプトのトップレベル定義は共有される。
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.join(__dirname, '..', '..');
// js/loader.js の読み込み順のうち、DOM・WebGL に触れないファイルだけを同じ順番で読む
const FILES = [
  'lib/three/build/three.min.js',
  'js/core.js',
  'js/data/rules.js',
  'js/data/horses.js',
  'js/data/tracks.js',
  'js/state.js',
  'js/crash.js',
  'js/race/track.js',
  'js/race/race.js',
  'js/world/drone.js',
];

function loadGame() {
  const context = vm.createContext({
    console,
    crypto: require('node:crypto').webcrypto,
    // core.js の $() は呼ばれない限り使わない。localStorage は未定義のままで、store は既定値を返す
    document: { querySelector: () => null },
  });
  for (const file of FILES) vm.runInContext(fs.readFileSync(path.join(ROOT, file), 'utf8'), context, { filename: file });
  // トップレベルの const / let はグローバルオブジェクトに載らないため、式として評価して取り出す
  const get = expr => vm.runInContext(expr, context);
  return { context, get };
}

module.exports = { loadGame, ROOT };
