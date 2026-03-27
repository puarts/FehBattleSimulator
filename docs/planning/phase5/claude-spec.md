# Section 12: vitest.setup.js 連結方式廃止 — 統合スペック

## 目的

`vitest.setup.js` の `vm.runInThisContext` による連結実行方式を完全に廃止し、全52テストファイルがESM importのみで動作する状態を実現する。

## 背景

Phase 5のSection 01〜11で以下が完了済み:
- 循環依存の解消（madge検証: 0件）
- 全ソースファイルのESM export完備
- 52テストファイル中51ファイルのESM import化
- `Tests/TestGlobals.js` のESM化（依存注入パターン）

### 現在の連結方式（廃止対象）

`vitest.setup.js` が以下の処理を実行:
1. 33個のSourceファイル（`SOURCE_FILE_NAMES`配列）+ `Tests/TestGlobals.js` を `fs.readFileSync` で読み込み
2. `filterImportExport()` で import/export 文をストリップ
3. `vm.Script` + `vm.runInThisContext()` でグローバルスコープに連結実行
4. 連結後に `initUnitSkillEffects(Unit)` を呼び出し

### ESM/連結 二重世界問題

- TestGlobals.js がESM importで SkillImpl*.js を読み込む
- vitest.setup.js が同じファイルを連結実行する
- SkillEffectNode クラスが2つのコンテキストに存在
- `instanceof` チェックが失敗
- DamageCalculator.test.js は連結版グローバルを使用して回避中

**連結方式を廃止すれば二重世界は自動解消される。**

## 対象ファイルの詳細

### vitest.setup.js

**現在の構造:**
- `SOURCE_FILE_NAMES` 配列: 33+αのファイル名を定義
- `TEST_UTIL_FILE_NAMES` 配列: `['TestGlobals']`
- `filterImportExport(content)` 関数: import/export文をストリップ
- メイン処理: ファイル読み込み → フィルタ → vm.runInThisContext → initUnitSkillEffects(Unit)

**変更方針:**
- 連結処理（SOURCE_FILE_NAMES, TEST_UTIL_FILE_NAMES, vm.Script, vm.runInThisContext）を完全削除
- `filterImportExport()` 関数は残す（ユーザー要望）
- setup ファイル自体は完全削除（vite.config.js の `setupFiles` も除去）
  - 理由: 現在非連結のsetup処理が存在せず、jsdom環境設定は vite.config.js で完結している

### Tests/DamageCalculator.test.js（唯一の未ESM化テスト）

**現在のimport（2行のみ）:**
```javascript
import { UnitGroupType } from '../Sources/UnitConstants.js';
import { PassiveA, PassiveC } from '../Sources/SkillConstants.js';
```

**追加が必要なimport:**
```javascript
import './TestGlobals.js';  // Side-effect import
import { test_DamageCalculator, test_calcDamage, test_createDefaultUnit, test_executeTest } from '../Sources/TestUtilities.js';
import { Unit } from '../Sources/Unit.js';
```

**テスト構造:** 約1016行、約47 describe/test ブロック、DamageCalculator_HeroBattleTest（1391回の全英雄戦闘テスト）

### Tests/TestGlobals.js（変更不要、参照のみ）

ESM化済みハブ。以下を提供:
- SkillImpl*.js の side-effect import
- `g_testHeroDatabase` の生成と export
- `setTestHeroDatabase()` による依存注入
- `initUnitSkillEffects(Unit)` の呼び出し

### Sources/TestUtilities.js（変更不要、参照のみ）

必要なシンボルを全て export 済み。DamageCalculator.test.js が使う:
- `test_DamageCalculator`, `test_calcDamage`, `test_createDefaultUnit`, `test_executeTest`

## 作業方針

### 同時変更アプローチ（ユーザー指定）

vitest.setup.js と DamageCalculator.test.js は強く結合しているため、**1つの変更セットで同時に変更する**:
1. vitest.setup.js の連結廃止（ファイル自体を削除）
2. vite.config.js から setupFiles を除去
3. DamageCalculator.test.js のESM化

### 検証優先順位
1. DamageCalculator.test.js（特に HeroBattleTest 1391回）を最優先で再検証
2. SkillEffect.test.js の動作確認
3. `npm run test:only` で全体テスト
4. WARN: Non-TDZ ReferenceError が出ないことを確認

### HeroBattleTest 失敗時の切り分け

失敗する場合は「ESM化の失敗」ではなく、以下を疑う:
- ノード同一性依存
- side-effect 登録順
- initUnitSkillEffects(Unit) の適用順

## 成功基準

1. `vitest.setup.js` が削除されている
2. `vite.config.js` から `setupFiles` 設定が除去されている
3. `filterImportExport` 関数は vitest.setup.js 削除に伴い消滅（ただし必要なら別ファイルに移動可）
4. `DamageCalculator.test.js` がESM importのみで動作する
5. `npm run test:only` で全テストが通過する（Performance.test.jsの環境依存閾値を除く）
6. `WARN: Non-TDZ ReferenceError` 警告が出ない
7. `DamageCalculator_HeroBattleTest`（1391回の全英雄戦闘テスト）がパスする

## 技術的制約

1. 循環依存なし（madge検証済み）
2. export漏れなし（Section 05完了済み）
3. TestGlobals.js の初期化順序はESM module evaluation orderに依存（現在正常動作中）
4. テスト実行は `singleThread: true` で共有グローバル状態を使用

## リスク

- **低リスク**: 51ファイルがESM化済みのため、残り1ファイルの移行リスクは最小
- **低リスク**: initUnitSkillEffects(Unit) はTestGlobals.jsで既に対応済み
- **注意**: filterImportExport()はvitest.setup.js削除で消滅するが、ユーザーは「残す」と回答 → 必要なら別ファイルに退避を検討
