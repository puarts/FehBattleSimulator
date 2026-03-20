# Phase 3: Vite ビルド + Vitest + Vue 3 移行

## 背景

FEH Battle Simulator の Vite + Vue 3 移行プロジェクトの Phase 3。

### 完了済み（Phase 0〜2）

- **Phase 0**: テスト整備（スモークテスト、グローバル変数チェック、スキル登録整合性）— 315テスト
- **Phase 1**: `scripts/build.mjs` でファイル結合ビルド（Deploy.bat 置き換え）
- **Phase 2**: 全61 JSソースファイルを ESM 化（import/export 文追加）
  - `build.mjs`, `create_tests.sh`, HTML の `createScriptElement` に import/export 除去フィルタを実装
  - 循環依存（Unit ↔ DamageCalculator）を解消
  - TDZ 検証スクリプト、ESM カバレッジチェッカーを追加

### 現在の構成

- **ブランチ**: `vite-migration`（`master` にはまだマージしない）
- **モジュール**: 全ファイルに import/export 文あり（ただしビルド・テスト・ローカル開発ではフィルタで除去してグローバルスコープで動作）
- **ビルド**: `scripts/build.mjs`（Node.js でファイル結合、import/export 除去フィルタ付き）
- **テスト**: `create_tests.sh` で全ファイル結合 → Jest（jsdom）実行、315テスト
- **ローカル開発**: HTML の `createScriptElement` が fetch + フィルタ + Blob URL で JS を読み込み
- **フレームワーク**: Vue 2.5.13（CDN）、jQuery 3.7.0（CDN）、Vuex 3.6.2（CDN）、Select2（CDN）
- **デプロイ制約**: HTML ごとに1つの結合 JS ファイルを出力する必要がある

### 参考資料（リポジトリ内）

- `docs/planning/vite-migration-plan.md` — 全体移行計画（Phase 0〜3）
- `docs/planning/phase2/claude-plan.md` — Phase 2 の詳細計画と完了状況
- `scripts/build.mjs` — 現在のビルドスクリプト（ファイルリスト・結合順序の定義）
- `Sources/Local.js` — ローカル開発用のファイルリスト定義
- `Sources/AetherRaidSimulator.html` — HTML の構造（loadScripts, createScriptElement）
- `create_tests.sh` — テスト結合スクリプト

## 目的

Phase 2 で追加した import/export 文を活用し、以下を実現する:

1. **Vite ビルドへの切り替え** — `build.mjs` の手動結合を Vite（Rollup）バンドルに置き換え
2. **Vitest への移行** — `create_tests.sh` + Jest から Vitest（ESM ネイティブ）に移行
3. **ローカル開発の Vite dev server 化** — HTML の loadScripts 方式を Vite dev server に置き換え
4. **Vue 2 → Vue 3 移行** — CDN の Vue 2 を npm の Vue 3 + Pinia に移行
5. **jQuery / jQuery-UI の置き換え** — jQuery 依存をゼロにする

## デプロイ要件

- 各シミュレーター HTML ごとに1つの JS ファイルを出力（現行と同じ）
- 出力先: `dist/` ディレクトリ
- 7つのシミュレーター: FehBattleSimulator, FehArenaSimulator, FehSummonerDuelsSimulator, FehStatusCalculator, FehUnitBuilder, FehDamageCalculator, FehHeroIconLister

## スコープ外

- TypeScript 移行（将来の Phase 4 で検討）
- アプリケーションのリデザインや機能追加
- SFC 化（.vue ファイル化）は任意・段階的に

## 制約・注意点

- `update_skills` ブランチでスキル実装が並行して進むため、SkillImpl ファイルへの変更はコンフリクトリスクがある
- 本番サイト（fire-emblem.fun）のデプロイフローとの互換性を維持する必要がある
- 全シミュレーターが動作確認できた段階で `master` に取り込む
