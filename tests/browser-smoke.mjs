// ブラウザでの起動確認（手動実行）。Chrome をヘッドレスで起動して index.html を開き、
// 全コースの組み立て・馬図鑑・コース図鑑とドローン・クラッシュ・レース1回を動かして、例外が出ないかを調べる。
// js ファイルの読み込み順の誤り（後のファイルの定義を読み込み時に使う等）は node --test では見つからないため、
// ファイルを分けたり移動したりしたときに実行する。
//
//   node tests/browser-smoke.mjs            … レースは途中まで
//   node tests/browser-smoke.mjs --race     … レースを結果画面まで走らせる（数分かかる）
//
// Chrome の場所は環境変数 CHROME で指定できる。GPU が使えない環境では GL=sw（ソフトウェア描画、とても遅い）。
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const fullRace = process.argv.includes('--race');
const chrome = [process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'].find(p => p && existsSync(p));
if (!chrome) { console.error('Chrome が見つかりません。環境変数 CHROME でパスを指定してください。'); process.exit(2); }

const sleep = ms => new Promise(r => setTimeout(r, ms));
const port = 9300 + Math.floor(Math.random() * 500);
const profile = mkdtempSync(path.join(tmpdir(), 'toy-keiba-smoke-'));
const gl = process.env.GL === 'sw' ? ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] : ['--enable-gpu', '--ignore-gpu-blocklist'];
const browser = spawn(chrome, ['--headless=new', `--remote-debugging-port=${port}`, ...gl, '--no-first-run',
  '--window-size=1280,800', `--user-data-dir=${profile}`, 'about:blank'], { stdio: 'ignore' });

const errors = [];
let ws, seq = 0;
const pending = new Map();
function finish(code) {
  try { ws?.close(); } catch {}
  browser.kill();
  setTimeout(() => { try { rmSync(profile, { recursive: true, force: true }); } catch {} process.exit(code); }, 500);
}
try {
  // DevTools プロトコルに接続する
  for (let i = 0; i < 50 && !ws; i++) {
    try {
      const page = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find(t => t.type === 'page');
      if (page) ws = new WebSocket(page.webSocketDebuggerUrl);
    } catch {}
    if (!ws) await sleep(200);
  }
  if (!ws) throw new Error('Chrome に接続できませんでした');
  await new Promise(r => { ws.onopen = r; });
  ws.onmessage = e => {
    const m = JSON.parse(e.data);
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
    if (m.method === 'Runtime.exceptionThrown') {
      const d = m.params.exceptionDetails;
      errors.push(`例外: ${d.exception?.description?.split('\n').slice(0, 3).join(' | ') || d.text} (${d.url?.split('/').slice(-2).join('/')}:${d.lineNumber + 1})`);
    }
    if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') errors.push(`console.error: ${m.params.args.map(a => a.value ?? a.description).join(' ')}`);
    if (m.method === 'Log.entryAdded' && m.params.entry.level === 'error' && !/fonts\.(googleapis|gstatic)/.test(m.params.entry.url || '')) errors.push(`読み込みエラー: ${m.params.entry.text} ${m.params.entry.url || ''}`);
  };
  const send = (method, params = {}) => new Promise(r => { const id = ++seq; pending.set(id, r); ws.send(JSON.stringify({ id, method, params })); });
  const evaluate = async expr => {
    const m = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
    if (m.result?.exceptionDetails) throw new Error(m.result.exceptionDetails.exception?.description || m.result.exceptionDetails.text);
    return m.result?.result?.value;
  };
  await send('Runtime.enable'); await send('Log.enable'); await send('Page.enable');
  await send('Page.navigate', { url: pathToFileURL(path.join(ROOT, 'index.html')).href });

  // 起動：ローディング画面が消えてロビーが出るまで
  let booted = false;
  for (let i = 0; i < 120 && !booted; i++) { await sleep(500); booted = await evaluate(`!document.getElementById('loading') && typeof S !== 'undefined' && S.mode === 'lobby'`); }
  if (!booted) throw new Error(`ロビーが表示されません（${await evaluate(`document.getElementById('loadMsg')?.textContent`)}）`);
  console.log('✔ 起動してロビーを表示');

  // 全コース・図鑑・ドローン・クラッシュを順に動かす
  const flows = JSON.parse(await evaluate(`(async () => {
    const wait = ms => new Promise(r => setTimeout(r, ms)), done = [];
    for (let i = 0; i < TRACKS.length; i++) { buildWorld(i); await wait(100); }
    done.push('全' + TRACKS.length + 'コースを組み立て');
    S.ti = 0; enterLobby(true); await wait(300);
    openCatalog(); await wait(300);
    for (let i = 0; i < ROSTER.length; i++) { catalogSelect(i); catalogMotion('skill'); await wait(60); }
    closeCatalog(); await wait(200);
    done.push('馬図鑑で全' + ROSTER.length + '頭のスキル演出');
    openCourseCatalog(); await wait(400); courseCatalogSelect(1); await wait(400);
    startCourseDrone(); courseCatalog.drone.keys.add('KeyW'); await wait(800); courseCatalog.drone.keys.clear();
    closeCourseCatalog(); await wait(300);
    done.push('コース図鑑とドローン');
    localStorage.setItem('dopa_guideDone', 'true'); localStorage.setItem('dopa_crashGuideDone', 'true');
    document.querySelector('[data-play="crash"]').click(); await wait(400);
    startRace(); await wait(8000);
    if (S.crash && !S.crash.settled) cashOutCrash();
    await wait(1000);
    if (S.mode !== 'result') throw new Error('クラッシュが結果画面になりません: ' + S.mode);
    done.push('クラッシュを確定して結果画面へ');
    enterLobby(false); document.querySelector('[data-play="race"]').click(); await wait(400);
    return JSON.stringify(done);
  })()`));
  flows.forEach(f => console.log(`✔ ${f}`));

  // 競馬モードで出走
  await evaluate(`guiding = false; startRace(); true`);
  const limit = fullRace ? 300 : 20;
  let mode = '';
  for (let i = 0; i < limit; i++) { await sleep(1000); mode = await evaluate('S.mode'); if (mode === 'result') break; }
  if (fullRace && mode !== 'result') throw new Error(`レースが${limit}秒で終わりません（${mode}）`);
  console.log(`✔ 競馬モードで出走（${mode === 'result' ? '結果画面まで' : `${limit}秒走行・${mode}`}）`);
} catch (e) {
  errors.push(`失敗: ${e.message}`);
}
if (errors.length) { console.error(errors.map(e => `✖ ${e}`).join('\n')); finish(1); }
else { console.log('問題は見つかりませんでした'); finish(0); }
