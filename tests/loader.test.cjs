// js/loader.js の読み込み一覧と、js フォルダの実ファイルが食い違っていないかのテスト
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { ROOT } = require('./helpers/game.cjs');

const loader = fs.readFileSync(path.join(ROOT, 'js/loader.js'), 'utf8');
const listed = [...loader.matchAll(/'(js\/[^']+\.js)'/g)].map(m => m[1]);
function walk(dir) {
  return fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })
    .flatMap(e => e.isDirectory() ? walk(`${dir}/${e.name}`) : e.name.endsWith('.js') ? [`${dir}/${e.name}`] : []);
}
const actual = walk('js').filter(f => f !== 'js/loader.js');

test('js フォルダのファイルはすべてローダーに一度だけ載っている', () => {
  assert.equal(new Set(listed).size, listed.length, '重複して読み込むファイルがある');
  assert.deepEqual(actual.filter(f => !listed.includes(f)), [], 'ローダーに載っていないファイル');
  assert.deepEqual(listed.filter(f => !actual.includes(f)), [], '存在しないファイルがローダーに載っている');
});

test('index.html はローダーだけを読み込む', () => {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const scripts = [...html.matchAll(/<script\s+src="([^"]+)"/g)].map(m => m[1]).filter(s => !s.startsWith('lib/'));
  assert.deepEqual(scripts, ['js/loader.js']);
  assert.ok(!/<script>/.test(html), 'インラインスクリプトが残っている');
});

test('各ファイルは構文が正しく、strict モードで始まる', () => {
  for (const file of ['js/loader.js', ...listed]) {
    const src = fs.readFileSync(path.join(ROOT, file), 'utf8');
    assert.doesNotThrow(() => new vm.Script(src, { filename: file }), file);
    assert.match(src, /^(\/\/[^\n]*\n)+'use strict';/, `${file} の先頭に説明コメントと 'use strict' がない`);
  }
});
