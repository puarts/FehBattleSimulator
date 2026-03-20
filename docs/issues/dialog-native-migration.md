# TODO: DialogUtil.js をネイティブ `<dialog>` 要素に移行

## 背景

Phase 3 の jQuery 削除（section-11）で、jQuery UI `.dialog()` の代替として `Sources/DialogUtil.js` を作成した。このユーティリティは CSS クラス切り替え（`.dialog-open`）で `<div>` 要素の表示/非表示を制御している。

計画では HTML の `<dialog>` 要素 + `.showModal()` / `.close()` を使う方針だったが、全ダイアログの `<div>` → `<dialog>` 変換（対応する閉じタグの特定）が困難だったため、現在の方式を採用した。

## 現状の問題点

- フォーカストラップがない（Tab キーがダイアログ外に移動する）
- `::backdrop` 疑似要素によるスタイリングが使えない
- ARIA セマンティクスが不足（スクリーンリーダー対応）
- Escape キーハンドリングは独自実装（ネイティブ `<dialog>` なら自動）

## 対応方針

HTML 側の大規模リファクタリング時に合わせて対応する：

1. 各ダイアログの `<div id="xxxDialog">` を `<dialog id="xxxDialog">` に変換
2. `DialogUtil.js` の `openDialogById()` を `.showModal()` に置換
3. `closeDialogById()` を `.close()` に置換
4. `initSimDialog()` のタイトルバー/ボタン生成を簡素化（`<dialog>` のネイティブ機能を活用）
5. CSS の `.sim-dialog` 関連スタイルを `dialog` セレクタに移行

## 対象ファイル

- `Sources/DialogUtil.js`
- `Sources/feh-battle-simulator.css`（`.sim-dialog` 関連）
- `Sources/ArenaSimulator.html`（12 ダイアログ）
- `Sources/AetherRaidSimulator.html`（12 ダイアログ）
- `Sources/SummonerDuelsSimulator.html`（12 ダイアログ）
