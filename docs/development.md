# 開発者向け

ビルドなしで、`index.html` を `file://` で直接開いて動く構成です。

## ファイル構成

| パス | 内容 |
|---|---|
| `index.html` | 画面のHTMLだけ。CSS と `js/loader.js` を読み込む |
| `css/style.css` | すべてのスタイル |
| `js/loader.js` | ゲーム本体の読み込み順を管理する（下記） |
| `js/core.js` | 共通ユーティリティ（`$`・`clamp`・`store` など） |
| `js/data/` | ルール表（`rules.js`）・馬の名簿（`horses.js`）・コース定義とテーマ（`tracks.js`） |
| `js/progress.js`・`js/state.js` | 実績と初回ガイド、ゲーム全体の状態 `S` |
| `js/crash.js` | クラッシュの倍率計算（描画・走行の乱数とは独立） |
| `js/race/` | コースの形状計算（`track.js`）、レースのシミュレーションとオッズ（`race.js`） |
| `js/render/` | レンダラー・共有アセット・馬のモデル・天候・ターフビジョン・演出・カメラ |
| `js/world/` | ワールドの組み立て（`world.js`）と、コース間で共有する部品・ドローンの衝突判定 |
| `js/courses/` | コースごとの景観（1コース1ファイル） |
| `js/ui/` | ロビー・馬図鑑・コース図鑑 |
| `js/flow.js` | 画面遷移・出走・結果・クラッシュの精算 |
| `js/input.js`・`js/update.js`・`js/commentary.js`・`js/main.js` | 入力、毎フレームの更新、実況、メインループと起動 |
| `lib/three/` | three.js r147 と関連スクリプト（MIT License） |
| `tests/` | 自動テスト（下記） |
| `docs/` | 資料 |

## 読み込み順のルール

`file://` で開けるように ES modules は使わず、`js/loader.js` が通常の `<script>` を決まった順番で追加します。

- 各ファイルのトップレベルの `const`・`let`・`function`・`class` は、全ファイルで共有されます。
- 関数の中から、後で読み込むファイルの定義を参照するのは問題ありません（呼ばれるのは全ファイルの読み込み後）。
- **読み込み時に実行されるコードで、後のファイルの定義を使ってはいけません。** たとえば `button.onclick = startRace;` は、`startRace` が後のファイルにあると `ReferenceError` になります。`button.onclick = () => startRace();` のように関数で包みます。
- `window` の既存のプロパティと同じ名前（`focus`・`open`・`close` など）をトップレベルで宣言しないでください。ブラウザの機能を上書きしてしまいます。
- フォントを使ってテクスチャを描くため、`js/render/renderer.js` 以降はフォントの読み込み後（最大3秒待つ）に実行します。
- ファイルを追加・移動したときは、`js/loader.js` の一覧も更新してください。一覧と実ファイルの食い違いはテストで検出します。

### コースを追加するとき

1. `js/data/tracks.js` の `TRACKS` にコース定義を、必要なら `THEMES` にテーマを追加します。
2. 景観は `js/courses/<名前>.js` に `decor<名前>()` として書き、`js/loader.js` の一覧に追加します。
3. `js/world/world.js` の `buildWorld()` にある、テーマ名と景観関数の対応表に追加します。

## テスト

Node.js 22 以降で実行します。依存パッケージのインストールは不要です。

```sh
node --test
```

| ファイル | 内容 |
|---|---|
| `tests/crash.test.cjs` | クラッシュの倍率抽選・到達確率と理論RTP・表示倍率・精算・自動確定の入力・時間経過の判定・演出段階 |
| `tests/race.test.cjs` | 出走馬の抽選・名簿の整合・天候・全コースの決着・周回モード・コース選択の制限・オッズの範囲と人気順 |
| `tests/drone.test.cjs` | ドローンの移動量・壁での停止・平行移動・薄い壁の貫通防止・対象外の物体・重なり判定 |
| `tests/loader.test.cjs` | ローダーの一覧と実ファイルの一致・構文・`'use strict'` |

`tests/helpers/game.cjs` は、DOM や WebGL を使わないファイル（データ・状態・倍率・コース形状・レース・ドローン）だけを Node.js の `vm` に読み込みます。

`race.test.cjs` の「着順が下の馬ほどタイムが遅い」は既知の不具合を示す `todo` テストです。同じステップ内で複数頭がゴールすると、着順とタイムが逆転することがあります。

### ブラウザでの確認

読み込み順の誤りは `node --test` では見つかりません。js ファイルを分けたり移したりしたときは、Chrome を使ったスモークテストも実行してください。

```sh
node tests/browser-smoke.mjs          # 起動・全コース・図鑑・ドローン・クラッシュ・レース途中まで
node tests/browser-smoke.mjs --race   # レースを結果画面まで走らせる
```

Chrome の場所は環境変数 `CHROME` で指定できます。GPU が使えない環境では `GL=sw` でソフトウェア描画にできますが、とても遅くなります。
