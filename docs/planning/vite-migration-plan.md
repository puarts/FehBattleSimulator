# Vite + Vue 3 移行計画

## 概要

FEH Battle Simulator を現在の構成（グローバルスコープ + Vue 2 + jQuery + 手動結合デプロイ）から Vite + Vue 3 ベースに移行する。

### 現状の構成

- **JSファイル**: 65ファイル（約12MB）、モジュールシステムなし
- **フレームワーク**: Vue 2.5.13（CDN）、jQuery 3.7.0（CDN）、Vuex 3.6.2
- **ビルド**: なし（Deploy.bat でファイル結合 + JSMin で圧縮）
- **テスト**: create_tests.sh で全ファイル結合 → Jest 実行
- **デプロイ制約**: HTMLごとに1つのJSファイルに結合して出力する必要がある

### 移行後の構成

- **モジュール**: ES Modules（import/export）
- **フレームワーク**: Vue 3 + Pinia
- **ビルド**: Vite（HTMLごとに1ファイル出力）
- **テスト**: Vitest（ESMネイティブ）

---

## 移行戦略

### 基本方針

- **段階的移行**: 一括移行は行わない。フェーズごとに動作確認しながら進める
- **デプロイ互換性の維持**: 全フェーズを通じて「HTMLごとに1つのJSファイル出力」を維持
- **既存テストを安全網にする**: 移行前にスモークテストを追加し、各フェーズで回帰を検知

### 過去の失敗から学んだこと

- `webpack` ブランチ: Webpack での移行を試みて断念（設定の複雑さ）
- `module` ブランチ: ESモジュール化を試みて断念（循環依存・グローバルスコープ依存）
- **教訓**: ESM化とビルドツール導入を同時にやらない。コード変更なしでビルドツールだけ先に差し替える

---

## Phase 0: 移行前テスト整備

**目的**: 移行中の回帰を検知する安全網を構築する

### 0-1. スモークテスト

アプリが起動して基本動作できることを確認するテスト。

- g_appData の初期化確認
- 英雄データベース・スキルデータベースのデータ存在確認
- ユニット作成 → 戦闘実行の最小フロー

### 0-2. グローバル変数の存在チェック

ESM化で消えやすいグローバル変数のスナップショット。

- 主要クラス（Unit, DamageCalculator, BattleMap 等）
- 定数・列挙型（Weapon, Support, Special, PassiveA/B/C 等）
- シングルトン（g_appData, SkillEffectRegistrar 等）

### 0-3. スキル登録の整合性チェック

各 SkillImpl ファイルから代表的なスキルが登録されていることを確認。

### 0-4. ビルド出力の一致テスト

Phase 1 で使用。旧ビルド（Deploy.bat の結合）と新ビルド（Node.js スクリプト）の出力が一致することを検証するスクリプト。

---

## Phase 1: ビルドツール差し替え（コード変更なし）

**目的**: Deploy.bat の結合 + JSMin を Node.js スクリプトに置き換える

### 制約

- ソースコードは一切変更しない
- 出力ファイルが従来と同一であることを保証する

### 作業内容

#### 1-1. Node.js ビルドスクリプトの作成

`scripts/build.js` を作成。Deploy.bat と同じファイルリスト・結合順序で、HTML別に1ファイルを出力する。

```
入力:  Sources/*.js（Deploy.bat と同じリスト・順序）
出力:  dist/ArenaSimulator.js
       dist/AetherRaidSimulator.js
       dist/SummonerDuelsSimulator.js
       dist/StatusCalculator.js
       dist/UnitBuilder.js
       dist/DamageCalculator.js
       dist/HeroIconLister.js
```

- 圧縮は Terser を使用（JSMin の代替）
- npm script として `npm run build` で実行可能にする

#### 1-2. ビルド出力の一致確認

Phase 0-4 のテストで旧ビルドと新ビルドの出力を比較し、一致を確認する。

#### 1-3. Deploy.bat の更新

結合 + 圧縮部分を `npm run build` の呼び出しに置き換え、dist/ からコピーする形に変更する。

### 完了条件

- `npm run build` で全シミュレータのJSファイルが生成される
- 既存テストがすべてパスする
- ビルド出力が従来と同等（minify差は許容）

---

## Phase 2: ESモジュール化

**目的**: 65ファイルのグローバルスコープ依存を ES Modules に変換する

### 基本方針

- **依存の葉（末端）から順に変換**: 他ファイルへの依存が少ないファイルから着手
- **1ファイルずつ変換 → テスト**: 一括変換しない
- **結合ビルドは維持**: Phase 1 のスクリプトを Rollup/Vite build に段階的に移行

### 変換順序（依存グラフに基づく）

#### Stage A: 依存なし・ユーティリティ層

依存されるが他への依存が少ないファイル群。

```
Utilities.js, Logger.js, Cell.js, Table.js
```

#### Stage B: 定数・列挙型

多くのファイルから参照される定数定義。循環依存の起点になりやすいため慎重に。

```
GlobalDefinitions_Debug.js, StatusType, WeaponType, MoveType 等
```

#### Stage C: コアモデル

```
Unit.js, BattleMap.js, AppData.js, BattleContext.js
```

#### Stage D: ビジネスロジック

```
DamageCalculator.js, DamageCalculatorWrapper.js
BeginningOfTurnSkillHandler.js
```

#### Stage E: スキルDSL・実装

```
SkillEffect*.js（DSL基盤）
SkillEffectAliases.js
SkillImpl.js, SkillImpl2024*.js, SkillImpl2025*.js, SkillImpl2026*.js
（副作用モジュール — import するだけで登録される形）
```

#### Stage F: UI層

```
VueComponents.js
BattleSimulatorBase.js
*Main.js（エントリポイント）
```

### ビルドの移行

Stage A〜C の変換が進んだ段階で、Phase 1 の結合スクリプトを Vite build（Rollup）に切り替える。`import`/`export` を辿ってバンドルし、IIFE 形式で1ファイル出力する。

### テスト基盤の移行

ESM化の進行に合わせて、create_tests.sh（結合方式）を段階的に Vitest（ESMネイティブ）に移行する。

### 完了条件

- 全ファイルが import/export を使用
- `vite build` で全シミュレータのJSファイルが生成される
- 既存テスト + スモークテストがすべてパスする
- create_tests.sh による結合が不要になっている

---

## Phase 3: Vue 3 移行

**目的**: Vue 2 → Vue 3、Vuex → Pinia に移行し、SFC化する

### 作業内容

#### 3-1. Vue 3 + Pinia 導入

- `new Vue()` → `createApp()`
- `Vue.component()` → `app.component()`
- Vuex Store → Pinia Store
- CDN読み込み → npm パッケージ + Vite プラグイン

#### 3-2. jQuery-UI 置き換え

- jQuery-UI ダイアログ → Vue 3 コンポーネント（dialog要素 or ライブラリ）
- Select2 → Vue 3 対応のセレクトコンポーネント

#### 3-3. SFC 化（任意）

- VueComponents.js のインラインテンプレート → `.vue` ファイル
- HTML内テンプレート → SFC に移行

### 完了条件

- Vue 3 + Pinia で全シミュレータが動作する
- jQuery / jQuery-UI への依存がゼロ
- 既存テストがすべてパスする

---

## リスクと対策

| リスク | 影響 | 対策 |
|--------|------|------|
| 循環依存の発生 | ビルドエラー・実行時エラー | 依存の葉から変換、1ファイルずつ確認 |
| グローバル変数の消失 | アプリ起動不可 | Phase 0 のグローバル変数チェックで検知 |
| スキル登録順序の変化 | スキル効果の未登録・誤動作 | スキル登録テストで検知 |
| 巨大ファイルのビルド性能 | HMR が遅い | 必要に応じてファイル分割（Phase 2 以降） |
| デプロイ出力の不一致 | 本番サイトの不具合 | ビルド出力テストで検知 |
| Vue 2 → 3 の破壊的変更 | テンプレート・コンポーネントの動作不良 | Phase 3 で Vue 移行に集中、段階的に対応 |

---

## ブランチ戦略

- `update_skills` を実質的な develop ブランチとして運用
- `vite-migration` は `update_skills` から分岐して作業
- 各 Phase 完了時に `update_skills` へマージ
- `update_skills` から `master` への PR は別途行う
- スキル実装は `update_skills` で並行して継続
