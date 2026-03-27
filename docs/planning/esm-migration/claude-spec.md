# FEH Battle Simulator — Vite/ESM移行 統合仕様書

## 1. プロジェクト概要

FEH Battle Simulatorの64個のJSファイル（約15万行）をグローバルスコープ＋スクリプト結合方式から、Vite/ESモジュール（ESM）ベースのモダンなモジュールシステムへ段階的に移行する。

### 移行の動機

- 依存関係が暗黙的（ロード順序に依存）で新規ファイル追加時にバグが発生しやすい
- ファイル構成にモジュール境界が不明確
- テストが全ソース結合方式で個別実行不可能
- 将来的な機能追加・リファクタリングの障壁

## 2. 現状の詳細分析

### アーキテクチャ

- **64個のJSファイル**: すべてグローバルスコープ、import/export一切なし
- **857クラス**: コア25クラス、SkillEffectノード140+クラス
- **ロード方式**: `loadScripts()`による逐次動的ロード（並列化なし）
- **HTMLエントリポイント**: 8個（AetherRaid, Arena, SummonerDuels, DamageCalculator, UnitBuilder, StatusCalculator, HeroIconLister, HeroStatusClusterer）

### 外部依存

- **Vue 2.5.13**（CDN）+ **Vuex 3.6.2** — EOLだがスコープ外（移行後に別プロジェクト）
- **jQuery 3.7.0 + jQuery UI 1.12.1** — スコープ外（移行後に別途除去）
- **Select2, SortableJS, Vue.Draggable, LZ-String, Tesseract.js**（CDN）

### デプロイ構成（重要）

Deploy.batでページごとに異なるファイルセットを結合・圧縮してデプロイ:

| 出力ファイル | 説明 |
|-------------|------|
| FehBattleSimulator.js | 飛空城シミュレーター |
| FehArenaSimulator.js | 闘技場シミュレーター |
| FehSummonerDuelsSimulator.js | 英雄決闘シミュレーター |
| FehStatusCalculator.js | ステータス計算機 |
| FehUnitBuilder.js | ユニットビルダー |
| FehDamageCalculator.js | ダメージ計算機 |
| FehHeroIconLister.js | 英雄アイコンリスト |

**制約**: デプロイ担当者が本番用の別リポジトリのHTMLからこれらの結合JSを読み込む構成。移行中もDeploy.bat方式でのデプロイを維持する必要がある。

### テスト基盤

- Jest + jsdom、`create_tests.sh`で全ソースを結合して`All.test.js`として実行
- 16テストスイート
- テストユーティリティ: UnitBuilder, BattleScenarioBuilder, RegressionTestHelper

### グローバル変数

- パス定数（`g_siteRootPath`等）: GlobalDefinitions.js
- **`g_appData`（最重要シングルトン）**: AppData.js — アプリ全体から参照
- `g_idGenerator`, `g_deffenceStructureContainer`, `g_offenceStructureContainer`: AppData.js
- `g_keyboardManager`: Main_MouseAndTouch.js

### 循環依存

- AppData ↔ BattleSimulatorBase（シングルトンで緩和）
- Unit ↔ BattleContext ↔ BattleMap（参照渡しで緩和）
- DamageCalculator ↔ PostCombatSkillHandler（Wrapperパターンで緩和）

### 巨大ファイル（God Object問題）

- **BattleSimulatorBase.js**（12,307行）: Vue生成、バトルロジック、移動、コマンドキュー、設定保存、AI連携 — **Phase 2で分割**
- **DamageCalculatorWrapper.js**（17,193行）: PerformanceProfile + ラッパーメソッド + ユーティリティ
- **SkillImpl202501.js**（21,875行）: 700+スキルハンドラ（分割は後回し可）
- **SkillEffect.js**（9,632行）: 140+ノードクラス + Mixin

## 3. 移行フェーズ

### Phase 1: 依存関係の可視化

- グローバル変数・クラスの定義/参照関係の解析
- 循環依存の検出と対処方針の策定
- 依存グラフの作成（テキストまたは図）
- create_tests.shとHTMLロード順序の整合性確認

### Phase 2: モジュール設計 + ファイル再構成

- **Phase 1の分析結果に基づいて**最適なディレクトリ構成を設計（一般的なパターンではなく、実際の依存関係に基づく）
- 各モジュールの責務と公開API定義
- **巨大ファイルの分割**: BattleSimulatorBase.js等を責務ごとに分割
- ファイル移動（ロジック変更は同時にやらない）
- create_tests.sh、HTML、Deploy.batのパス更新
- **グローバルスコープの今だからこそ移動コストが低い**

### Phase 3: export/import追加（ESM化）

- 依存ツリーの葉ノードから段階的にESM化
- 互換レイヤー（`export`しつつ`globalThis.xxx`にも代入）で未移行ファイルとの共存
- 循環依存の解消
- ファイル単位での段階的移行（1ファイルずつテスト確認）

### Phase 4: テスト基盤の移行

- vitest導入（Viteとの統合が自然）
- テストファイルのimport文追加
- create_tests.shの段階的廃止
- CIパイプラインの更新

### Phase 5: Vite導入

- vite.config.jsの作成（マルチページ構成、8エントリポイント）
- 開発サーバー設定（`vite dev`）
- ビルド設定（`vite build`でページごとの単一JS出力も可能に — Deploy.bat互換）
- Vue.js/jQuery等の外部ライブラリはCDN読み込みのまま維持（Viteのexternals設定）
- HTMLの`<script type="module">`への書き換え
- `loadScripts()`ベースのローダー除去

## 4. スコープ外（別プロジェクト）

- Vue 2 → Vue 3 移行
- jQuery/jQuery UI除去
- 外部ライブラリのCDN→npmパッケージ移行

## 5. ブランチ戦略

- `update_skills`ブランチから新しい移行用ブランチを作成
- スキル実装の追加は`update_skills`ブランチで並行継続
- 各フェーズ完了時にマージまたはリベース

## 6. 検証方針

各フェーズ完了時:
1. 自動テスト（Jest/Vitest）がすべてパス
2. 手動ブラウザ確認（主要ページの動作確認）
3. Deploy.batでの結合JSが正常に生成されること

## 7. 成功基準

- すべてのJSファイルがES modulesのimport/exportを使用
- `vite dev`で開発サーバーが起動し全ページが正常動作
- `vite build`で本番ビルドが生成可能
- Deploy.bat方式での結合JSも引き続き生成可能
- 既存のテストがすべてパス
- セーブデータ・URLパラメータの後方互換性維持
- CIが正常動作

## 8. リスクと緩和策

| リスク | 緩和策 |
|-------|--------|
| 循環依存のESM化時の問題 | Phase 1で特定し、Phase 2で構造を事前整理 |
| Deploy.batとの互換性破損 | 各フェーズでDeploy.bat出力を検証 |
| スキル実装ブランチとのコンフリクト | 定期的なリベース、ファイル移動とロジック変更の分離 |
| vite-plugin-legacy-js-concatの安定性 | プラグインの評価を行い、不安定なら自前の互換レイヤーで対応 |
| BattleSimulatorBase分割による回帰 | 分割前に十分なテストカバレッジを確保 |
