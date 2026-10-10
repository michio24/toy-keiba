// ゲーム本体のスクリプトを決まった順番で読み込む。
// index.html を file:// で直接開けるよう ES modules は使わず、通常の <script> を追加する。
// 各ファイルのトップレベルの const / let / function / class は全ファイルで共有されるため、
// 後のファイルは前のファイルの定義を使える。読み込み時に後ろのファイルの定義を使わないこと
// （関数の中から参照するのは問題ない）。ファイルを追加するときはこの一覧にも追加する。
'use strict';
(() => {
  // フォント読み込み前に実行する（データ・状態・倍率計算。描画には触らない）
  const BEFORE_FONTS = [
    'js/core.js',
    'js/data/rules.js',
    'js/data/horses.js',
    'js/data/tracks.js',
    'js/progress.js',
    'js/state.js',
    'js/crash.js',
  ];
  // フォント読み込み後に実行する（看板や番号のテクスチャを文字入りで描くため）
  const AFTER_FONTS = [
    'js/render/renderer.js',
    'js/render/assets.js',
    'js/race/track.js',
    'js/race/race.js',
    'js/render/horse-models.js',
    'js/world/world.js',
    'js/courses/sky-garden.js',
    'js/courses/candy.js',
    'js/courses/moon-forest.js',
    'js/courses/dragon-crater.js',
    'js/courses/pearl-ocean.js',
    'js/courses/clockwork.js',
    'js/world/scenery-kit.js',
    'js/courses/box-hill.js',
    'js/courses/hakone.js',
    'js/courses/monaco.js',
    'js/world/real-course-kit.js',
    'js/courses/rail-loop.js',
    'js/world/landmarks.js',
    'js/courses/tokyo.js',
    'js/courses/meydan.js',
    'js/courses/shatin.js',
    'js/courses/hanshin.js',
    'js/courses/chukyo.js',
    'js/courses/kasamatsu.js',
    'js/courses/sapporo.js',
    'js/courses/nakayama.js',
    'js/courses/kyoto.js',
    'js/courses/niigata.js',
    'js/courses/longchamp.js',
    'js/courses/churchill.js',
    'js/courses/sakura.js',
    'js/courses/neon.js',
    'js/courses/aurora.js',
    'js/courses/dune.js',
    'js/render/weather.js',
    'js/render/jumbotron.js',
    'js/audio.js',
    'js/render/fx.js',
    'js/ui/lobby.js',
    'js/ui/catalog.js',
    'js/world/drone.js',
    'js/ui/course-catalog.js',
    'js/flow.js',
    'js/input.js',
    'js/render/camera.js',
    'js/update.js',
    'js/commentary.js',
    'js/main.js',
  ];

  const loadMsg = text => { document.getElementById('loadMsg').textContent = text; };
  // async=false で並行に取得しつつ、追加した順に実行させる
  const load = list => Promise.all(list.map(src => new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src; s.async = false;
    s.onload = resolve; s.onerror = () => reject(new Error(src));
    document.body.appendChild(s);
  })));

  if (!window.THREE || !THREE.EffectComposer || !THREE.UnrealBloomPass) {
    loadMsg('3Dエンジンを読み込めませんでした。ページを再読み込みしてください。');
    return;
  }
  (async () => {
    try {
      await load(BEFORE_FONTS);
      // フォントは最大3秒だけ待ち、オフラインなどで届かなければ端末のフォントで続行する
      try {
        await Promise.race([
          Promise.all([
            document.fonts.load('40px "Dela Gothic One"', ROSTER.map(h => h.name + h.skill.name).join('') + TRACKS.map(t => t.name).join('') + 'トイ競馬ゴールオッズ実況着先頭RESULTLIVE0123456789'),
            document.fonts.load('700 20px "Oxanium"', '0123456789.'),
            document.fonts.load('900 16px "Zen Maru Gothic"', 'あいう'),
          ]),
          new Promise(r => setTimeout(r, 3000))
        ]);
      } catch (e) {}
      await load(AFTER_FONTS);
    } catch (e) {
      loadMsg(`ゲームのファイル（${e.message}）を読み込めませんでした。js フォルダが index.html と同じ場所にあるか確認してください。`);
    }
  })();
})();
