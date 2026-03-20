# Phase 3 TDD 計画: Vite ビルド + Vitest + Vue 3 移行

本ドキュメントは `claude-plan.md` の各セクションに対応するテスト方針を定義する。各ステップで「まずテストを書き、次に実装する」TDD サイクルを適用する。

## テスト環境

- **移行前**: Jest 29.7.0 (jsdom) — `create_tests.sh` で結合 → `All.test.js`
- **移行後**: Vitest (jsdom) — 各テストファイルが independent に import で依存解決
- **既存テスト**: 18ファイル、315テスト（すべて移行後も動作すること）

---

## Step A: Vite ビルド基盤構築

### A.2 vite.config.js — ビルド設定テスト

- Test: `vite build` が正常終了し、exit code 0 を返すこと
- Test: `dist/` に各シミュレーターの HTML ファイルが出力されること（8ファイル）
- Test: 各 HTML に対応する JS バンドルファイルが1つだけ存在すること（コード分割なし）
- Test: 出力された JS ファイルに `import` / `export` 文が含まれないこと（バンドル済み）
- Test: 出力ファイルサイズが現行 `build.mjs` 出力と比較して ±50% 以内であること

### A.3 HTML 修正 — エントリポイントテスト

- Test: 各 HTML に `<script type="module">` タグが存在すること
- Test: `loadScripts` / `createScriptElement` が HTML 内に残っていないこと（Vite ビルド版）
- Test: `dist/` の HTML をブラウザで開いてコンソールエラーが出ないこと（手動 or Playwright）

### A.5 グローバル変数 — モジュールスコープテスト

- Test: Vite ビルド後の JS で `g_app` が正しくエクスポート/参照可能であること
- Test: `window` に設定されるべきグローバル変数が正しく設定されていること

---

## Step B: Vitest 移行

### B.1 Vitest 設定 — 基本動作テスト

- Test: `vitest run` が正常に起動し、テストファイルを検出すること
- Test: `globals: true` により `describe`, `it`, `expect` がインポートなしで使用可能であること
- Test: `environment: 'jsdom'` により `document`, `window` が利用可能であること
- Test: `singleThread: true` により直列実行されること（並列実行による state 汚染防止）

### B.2 テストファイル移行 — 各テストの独立動作

移行対象の18テストファイルそれぞれについて:
- Test: 単体で `vitest run Tests/XxxTest.test.js` が成功すること
- Test: import 文で必要なモジュールが正しく解決されること
- Test: テスト結果が Jest 版と同一であること（テスト数、pass/fail）

**優先順位（シンプルなものから）**:
1. `SmokeTest.test.js` — 最もシンプル、基本的なインポートの検証に最適
2. `SimpleUtility.test.js` — ユーティリティ関数テスト
3. `BuildFilter.test.js` — ビルドフィルタテスト
4. `DslNode.test.js` — DSL ノードテスト
5. `SkillEffect.test.js` — スキル効果テスト
6. 残りのテストファイル

### B.3 API 差分 — jest → vi 変換テスト

- Test: コードベース内に `jest.fn()`, `jest.mock()`, `jest.spyOn()` が残っていないこと
- Test: `vi.fn()`, `vi.mock()`, `vi.spyOn()` が正しく動作すること

### B.5 全テスト移行完了

- Test: `vitest run` で全315テストがパスすること
- Test: Jest (`npx jest`) と Vitest (`vitest run`) の両方で全テストがパスすること（移行期間中）

---

## Step C: Vite Dev Server 化

### C.1 データ読み込み統一 — 環境変数テスト

- Test: `import.meta.env.MODE === 'development'` がローカルで `true` を返すこと
- Test: `.env.development` の環境変数が `import.meta.env` で参照可能であること
- Test: データ読み込みロジックが環境変数に基づいて正しいソースからデータを取得すること
- Test: 本番ビルドにローカル開発用のモックデータが含まれないこと

### C.2 HTML 整理 — dev server 動作テスト

- Test: `vite` コマンドで dev server が起動すること
- Test: 各シミュレーター HTML にブラウザでアクセスできること（8ページ）
- Test: `loadScripts`, `createScriptElement` が HTML 内に残っていないこと
- Test: `Local.js` のファイルリストに依存するコードが残っていないこと

### C.4 HMR テスト

- Test: JS ファイルの変更後、ブラウザが自動リロード/更新されること（手動確認）

---

## Step D: Vue 2 → Vue 3 + Pinia 移行

### D.1 Vue 3 インストール — 基本動作テスト

- Test: `import { createApp } from 'vue'` が正常にインポートされること
- Test: Vue 3 のコンパイラ込みビルド（`vue.esm-bundler.js`）が使用されていること
- Test: CDN の Vue 2 / Vuex の `<script>` タグが HTML に残っていないこと

### D.2 Vue インスタンス移行テスト

- Test: `createApp()` で Vue アプリケーションが正常に作成されること
- Test: `.mount('#app')` で DOM にマウントされること
- Test: `data()` が関数形式で定義されていること
- Test: `methods` が正しくバインドされていること

### D.3 Pinia ストアテスト

- Test: `defineStore` で定義したストアが正常に動作すること
- Test: state (`appData`, `battleSimulator`, `imageRootPath`) が読み取り可能であること
- Test: actions (`updateMap`, `saveSettings` 等) が正常に実行されること
- Test: コンポーネントから `mapState` / `mapActions` でストアにアクセスできること

### D.4-D.5 コンポーネント移行テスト

- Test: `app.component()` でグローバル登録されたコンポーネントが正常に描画されること
- Test: `unit-detail` コンポーネントの v-model バインディングが双方向に動作すること
- Test: `battle-map` コンポーネントの `mounted()` フックが実行されること
- Test: `flash-message` コンポーネントが props を正しく受け取り表示すること

### D.6 破壊的変更対応テスト

- Test: `Vue.set`, `$set`, `$delete` がソースコード内に残っていないこと（grep）
- Test: `beforeDestroy` / `destroyed` がソースコード内に残っていないこと（grep）
- Test: `$on`, `$off`, `$once` がソースコード内に残っていないこと（grep）
- Test: filters (`|` パイプ構文) がテンプレート内に残っていないこと（grep）
- Test: `$children` がソースコード内に残っていないこと（grep）
- Test: グローバル変数がテンプレートから正しく参照できること

### D.7 Select2 互換性テスト

- Test: Select2 ラッパーコンポーネントが Vue 3 環境で初期化できること
- Test: ドロップダウンの開閉が正常に動作すること
- Test: 選択値の変更が Vue のリアクティビティシステムに反映されること

### D.8 統合動作テスト

- Test: 全8シミュレーターが Vue 3 で正常に描画されること（手動確認）
- Test: Vitest の全テストがパスすること
- Test: Pinia ストアの状態変更が UI に反映されること

---

## Step E: jQuery / Select2 / Vue.Draggable 置き換え

### E.1 Select2 置き換えテスト

- Test: 新しい選択コンポーネントが `<select2>` と同じ props インターフェースを提供すること
- Test: 英雄選択ドロップダウンで検索フィルタが動作すること
- Test: スキル選択ドロップダウンで大量オプション（500+）のパフォーマンスが問題ないこと
- Test: 選択変更時に Vue のイベントが正しく発火すること
- Test: `fallbackValue` prop が正しく動作すること

### E.2 Vue.Draggable 置き換えテスト

- Test: ユニットリストのドラッグ並び替えが動作すること
- Test: 並び替え後のリスト順序が Vue の data に正しく反映されること
- Test: ドラッグ中の視覚的フィードバックが表示されること

### E.3 jQuery 削除テスト

- Test: jQuery CDN の `<script>` タグが全 HTML から削除されていること
- Test: jQuery UI CDN の `<script>` タグが全 HTML から削除されていること
- Test: `$`, `jQuery`, `$.fn` がソースコード内に残っていないこと（grep）
- Test: 全シミュレーターがコンソールエラーなしで動作すること

### E.4 CDN → npm 移行テスト

- Test: `lz-string` が npm パッケージからインポートされていること
- Test: `cropperjs` が npm パッケージからインポートされていること
- Test: セーブデータの圧縮/展開が正常に動作すること（LZ-String）
- Test: 画像クロッピング機能が正常に動作すること（CropperJS）

---

## Step F: CI/CD 更新 + クリーンアップ

### F.1 CI パイプラインテスト

- Test: CI ワークフローで `vitest run` が正常に実行されること
- Test: CI ワークフローで `vite build` が正常に実行されること
- Test: ESLint が引き続き CI で実行されること

### F.2 クリーンアップテスト

- Test: 削除対象ファイルが存在しないこと（`build.mjs`, `create_tests.sh`, `jest.config.js`, `jest.setup.js`）
- Test: `package.json` から Jest 関連 devDependencies が削除されていること
- Test: `package.json` の scripts が正しく更新されていること（`test` → vitest, `build` → vite build）

### F.4 最終動作確認

- Test: `vite build` で全8シミュレーターのバンドルが正常生成
- Test: `vitest run` で全テストがパス
- Test: `vite` で dev server が起動し、ブラウザで各シミュレーターが動作
- Test: CI でテスト + ビルドが成功
- Test: ブラウザで全8シミュレーターの手動動作確認（リスト表示、ドラッグ、選択、計算等の主要操作）
