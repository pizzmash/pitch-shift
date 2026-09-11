## Context
空のリポジトリから拡張を作成する。YouTubeのクロスオリジン音声を直接MediaElementSourceに接続する方式は避ける。

## Goals / Non-Goals
Goals: 独立したピッチと速度変更、指定秒数巻き戻し、シンプルな日本語UI。
Non-goals: 録音、音源ダウンロード、ボーカル除去、公開ストアへの配布。

## Decisions
- esbuildで依存をバンドルし、外部コードを実行しないMV3拡張を作る。
- popup → service worker → offscreen document → AudioWorkletの構成。tabCaptureのストリームを取得し、可変ディレイの2窓クロスフェードでピッチ変換する。
- 再生速度はvideo.playbackRateとpreservesPitchで制御する。DOM操作はactiveTab権限で必要時だけ注入する。
- 音声処理は同時に1タブ。他タブからの操作で既存セッションを勝手に停止しない。キー0とリセットでキャプチャを停止し通常音声に戻す。
- 巻き戻し秒数のみ永続保存。速度は実動画、キーはoffscreenの実状態を表示する。

## Risks / Trade-offs
簡易リアルタイムDSPは原音との差や短い遅延を生む。特に大きなキー変更では音質が低下する。保護されたメディアやライブのシーク制約はブラウザ依存。

## Migration Plan
npm ci && npm run build後、distをChromeの「パッケージ化されていない拡張機能を読み込む」で導入する。

## Open Questions
実機でのYouTube音声の聴感確認は手動チェックとして記録する。
