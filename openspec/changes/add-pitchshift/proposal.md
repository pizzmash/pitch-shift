## Why
YouTubeでカラオケ練習するとき、歌いやすいキーと速度への変更、苦手なフレーズの巻き戻しを一つのパネルで操作したい。

## What Changes
- TypeScript / Manifest V3 のChrome拡張 PitchShift を追加する。
- キーを半音単位で−12〜+12、速度を0.25〜2倍で独立操作する。
- 1〜60秒の巻き戻しとプリセット、全リセットを用意する。
- 日本語、キーボード対応、状態とエラーが明確なミニマルUIにする。

## Capabilities
### New Capabilities
- `karaoke-controls`: YouTubeのキー・再生速度・巻き戻し操作。

### Modified Capabilities
なし。

## Impact
Chrome 116以降。activeTab / scripting / tabCapture / offscreen / storageを利用する。音声はローカル処理し保存・送信しない。
