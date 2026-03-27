# FEH Battle Simulator — Vite/ESMモジュールシステム移行計画 Spec

## 概要

FEH Battle Simulatorのコードベースをグローバルスコープ＋スクリプト結合方式から、Vite/ESモジュール（ESM）ベースのモダンなモジュールシステムへ段階的に移行する。

## 背景・動機

- 64個のJSファイル（約15万行）がすべてグローバルスコープで動作しており、依存関係が暗黙的
- ファイル間の依存がロード順序に依存しており、新規ファイル追加時にバグが発生しやすい
- ファイル構成が「なんとなくこのクラスはこのファイル」という状態で、モジュール境界が不明確
- テストは`create_tests.sh`で全ソースを結合して`All.test.js`として実行しており、個別テストの実行やツリーシェイキングが不可能
- 将来的な機能追加・リファクタリングの障壁となっている

## 現状

- **ファイル数**: Sources/配下に64個のJSファイル
- **総行数**: 約149,198行
- **モジュールシステム**: なし（ES modules未使用、import/export一切なし）
- **依存管理**: HTMLからの動的スクリプトロード（`loadScripts()`で順序依存の逐次読み込み）
- **テスト基盤**: Jest + jsdom、`create_tests.sh`で全ソースを結合して`All.test.js`として実行
- **CI**: GitHub Actions（Jekyll build + Jest + ESLint）
- **フレームワーク**: Vue.js（CDN読み込み）、jQuery
- **開発スタイル**: HTMLファイルをブラウザで直接開く（ビルドツールなし）
- **巨大ファイル**: SkillImpl202501.js（21,875行）、DamageCalculatorWrapper.js（17,193行）、BattleSimulatorBase.js（12,307行）

### 現在の依存チェーン（概略）

```
GlobalDefinitions → Utilities → Logger → 定数群
  → コアクラス（Unit, HeroInfo, Skill, Tile, Cell, BattleContext）
    → マネージャ（UnitManager, SkillDatabase, HeroDatabase）
      → 計算（DamageCalculator, BeginningOfTurnSkillHandler）
        → SkillEffectシステム（Core → Effect → Field/Unit/BattleContext/Hooks → Registrar → Aliases）
          → スキル実装（SkillImpl → SkillImpl202408 → SkillImpl202501 → SkillImpl202601）
            → UIエントリポイント（DamageCalculatorMain, ArenaSimulatorMain等）
```

## 対象領域

### Phase 1: 依存関係の可視化

現状のグローバル変数・クラスの定義/参照関係を解析し、依存グラフを作成する。

- グローバル変数（`g_`プレフィクス等）の定義元と参照先の特定
- クラス定義の所在と利用箇所のマッピング
- 循環依存の検出
- HTMLファイルごとのスクリプトロード順序の整理
- `create_tests.sh`のSOURCE_FILE_NAMESとの整合性確認
- 依存グラフの可視化（テキストまたは図）

### Phase 2: モジュール設計とファイル再構成

機能ドメインごとにディレクトリ構造を設計し、ファイルを再配置する。**グローバルスコープの今だからこそファイル移動のコストが低い**（ESM化後はimportパスの書き換えが必要になる）。

- 機能ドメインの分類とディレクトリ構造の設計
  - 例: core/, constants/, model/, combat/, skill/, database/, map/, ui/, app/
- 各モジュールの責務と公開API（将来のexport対象）の定義
- ファイル移動（ロジック変更は同時にやらない）
- `create_tests.sh`のパス更新
- HTMLファイルのスクリプトパス更新
- 巨大ファイルの分割検討（DamageCalculatorWrapper, BattleSimulatorBase等）

### Phase 3: export/import追加（ESM化）

依存ツリーの葉ノード（他に依存しないファイル）から段階的にESM化する。

- 各ファイルにnamed exportを追加
- 参照側にimportを追加
- 移行中の互換レイヤー（`export`しつつ`window.xxx`にも代入）で未移行ファイルとの共存を維持
- 循環依存の解消
- ファイル単位での段階的移行（1ファイルずつテスト確認）

### Phase 4: テスト基盤の移行

`create_tests.sh`の結合方式からモジュール対応のテストランナーへ移行する。

- vitest導入の検討（Viteとの統合が自然）
- または Jest のESM対応設定（`transform`設定等）
- テストファイルのimport文追加
- `create_tests.sh`の段階的廃止
- CIパイプラインの更新

### Phase 5: Vite導入

Viteをビルドツールとして導入し、開発サーバーとビルドパイプラインを整備する。

- `vite.config.js`の作成（マルチページ構成）
  - ArenaSimulator.html
  - SummonerDuelsSimulator.html
  - UnitBuilder.html
  - StatusCalculator.html
  - DamageCalculator.html
- 開発サーバー設定（`vite dev`）
- ビルド設定（`vite build`）
- Vue.jsのCDN読み込みからnpmパッケージへの移行
- HTMLファイルの`<script type="module">`への書き換え
- 既存の`loadScripts()`ベースのローダー除去

## 成功基準

- すべてのJSファイルがES modulesのimport/exportを使用している
- `vite dev`で開発サーバーが起動し、全ページが正常に動作する
- `vite build`で本番ビルドが生成できる
- 既存のテストがすべてパスする
- 既存のセーブデータ・URLパラメータが引き続き動作する
- CIが正常に動作する（テスト＋リント）
- グローバルスコープへの依存がゼロ（window.xxxへの直接代入なし）

## 制約・考慮事項

- **後方互換性**: 既存のセーブデータ（ローカルストレージ）・URLパラメータが引き続き動作すること
- **Vue.js統合**: 現在CDNで読み込んでいるVue.jsをViteのモジュールシステムに統合する必要がある
- **巨大ファイル**: SkillImpl系ファイル（2万行超）はファイル分割よりもESM化を優先する
- **CI整合性**: GitHub ActionsのJest+ESLint構成との整合性を維持（vitestへの移行を含む可能性）
- **段階的移行**: 各フェーズ完了時点でアプリが動作することを保証する（ビッグバンリリースを避ける）
- **ファイル移動とロジック変更の分離**: Phase 2ではファイル配置のみ変更し、コード内容は変更しない
- **移行中の二重動作**: Phase 3ではexportしつつグローバルにも代入する互換レイヤーにより、未移行ファイルとの共存を維持する
- **開発スタイルの変更**: HTMLファイルを直接開く方式から`vite dev`サーバー経由に変わることへの移行サポート
