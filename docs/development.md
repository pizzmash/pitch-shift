# 開発ガイド

TypeScript / Manifest V3のChrome拡張です。ビルド成果物は `dist` に出力します。

## ビルドとテスト

```sh
npm ci
npm run check
npx playwright install chromium
npm run test:browser
npm run test:extension
npm run spec:validate
```

- `check`: 単体テスト、TypeScript型チェック、本番ビルド。
- `test:browser`: Chrome APIのテストダブルを用いたUI操作とレイアウトの検証。
- `test:extension`: 実拡張の読み込み、service worker / offscreen通信、AudioWorklet、実scripting APIを用いた動画操作の検証。動画はテスト用HTMLを使用し、一時コピーのmanifestにのみホスト権限を追加します。
- `spec:validate`: npm経由でNode 22とOpenSpec 1.13.0を実行し、仕様をstrict検証。

既存ブラウザを使う場合は、UIテストに `CHROME_PATH`、拡張テストに `CHROMIUM_PATH` を指定できます。拡張テストには拡張読み込みフラグをサポートするChromiumが必要です。

自動テストは実YouTube上のタブキャプチャや聴感を保証するものではありません。[手動確認項目](manual-test.md) も参照してください。

## READMEの画像を更新する

通常のUIテストでは `docs/popup.png` を上書きしません。Noto Sans CJK JP・游ゴシック・メイリオなどの日本語フォントを利用できる環境で、次を実行してください。

```sh
UPDATE_SCREENSHOT=1 npm run test:browser
```

PowerShellでは `$env:UPDATE_SCREENSHOT = "1"` を設定してから `npm run test:browser` を実行します。

撮影前にブラウザが実際に日本語フォントで描画していることを確認し、フォントが不足していれば画像を上書きせず失敗させます。画像はテスト用の動画タイトルを表示したパネルのみを切り出します。
