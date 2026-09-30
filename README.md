# トイ競馬

かわいい馬たちが走る3Dブラウザ競馬ゲームです。

## 遊び方

`index.html` をブラウザ（Chrome / Edge / Firefox / Safari の最新版）で開くだけで遊べます。
インストールやサーバーは不要です。

- コースと馬を選び、単勝か複勝に賭けて「出走！」
- レース中：数字キー 1〜6 でカメラ切り替え、Space で応援ブースト、M で音のオン／オフ
- マウスドラッグ・ホイール（スマホはスワイプ・ピンチ）で視点を自由に動かせます

## 中身

| ファイル | 内容 |
|---|---|
| `index.html` | ゲーム本体（HTML・CSS・JavaScript をこの1ファイルに収録） |
| `lib/three/` | 3D描画ライブラリ three.js r147（MIT License、`lib/three/LICENSE`） |

## 補足

- three.js は同梱しているので、オフラインでも動きます。
- 文字のフォント（Dela Gothic One / Zen Maru Gothic / Oxanium）は Google Fonts から読み込みます。オフラインのときはパソコンの標準フォントで表示されます。
- 所持コインや最後に選んだコースは、ブラウザの localStorage に保存されます。
- ブラウザによっては、ローカルファイル（file://）を開いたときに localStorage が使えず、コインが保存されないことがあります。その場合は、フォルダで `python -m http.server` などを実行し、http://localhost:8000/ から開いてください。
