Now I have all the context I need. Let me generate the section content.

# Section 03: DamageCalculator.test.js の完全ESM化

## 概要

このセクションでは、`Tests/DamageCalculator.test.js` を連結方式のグローバルスコープ依存から完全なESM importベースに移行する。これは連結方式廃止（Section 02）後にテストが動作するための必須作業である。

Section 01（filterImportExport退避）および Section 02（連結方式廃止）とは並行実施可能だが、最終的な動作確認は Section 02 の完了後に行う。

## 背景

### 現在の状態

`DamageCalculator.test.js` は52テストファイル中、唯一ESM化が完了していないファイルである。ファイル先頭には以下の2行のimportしかない:

```javascript
import { UnitGroupType } from '../Sources/UnitConstants.js';
import { PassiveA, PassiveC } from '../Sources/SkillConstants.js';
```

残りのシンボル（`g_testHeroDatabase`, `test_DamageCalculator`, `test_calcDamage`, `test_createDefaultUnit`, `test_executeTest`）は全て `vitest.setup.js` の連結実行によるグローバルスコープから暗黙的に参照されている。

### ESM/連結 二重世界問題

現在、`TestGlobals.js` が SkillImpl*.js をESM importする一方、`vitest.setup.js` が同じファイルを連結実行している。この結果、`SkillEffectNode` などのクラスが2つのコンテキストに別オブジェクトとして存在し、`instanceof` チェックの失敗や `TypeError: _targetNode.evaluate is not a function` が発生する。`DamageCalculator.test.js` のファイル先頭3〜5行目のコメントにもこの旨が記録されている。連結方式の廃止（Section 02）により二重世界は自動解消される。

## テスト計画

以下のテスト基準で移行の成否を判断する。

### import の完全性テスト

```
# Test: DamageCalculator.test.js に ReferenceError（未定義変数）が発生しないこと
# Test: g_testHeroDatabase が TestGlobals.js の named import で正しく取得できること
# Test: test_DamageCalculator, test_calcDamage, test_createDefaultUnit, test_executeTest が TestUtilities.js から正しく import されること
# Test: Unit クラスが Unit.js から正しく import されること
```

### HeroBattleTest の動作確認

```
# Test: DamageCalculator_HeroBattleTest の1391回全英雄戦闘テストがパスすること
# Test: instanceof チェックが正しく動作すること（二重世界問題の解消確認）
# Test: SkillEffectNode の evaluate メソッドが正常に呼び出されること
```

### 既存テストケースの維持

```
# Test: DamageCalculator.test.js 内の全47 describe/test ブロックが引き続きパスすること
# Test: ESM化により意味的な変更がないこと（テスト結果が同一であること）
```

## 実装手順

### 対象ファイル

- **変更:** `/Users/studio/Documents/GitHub/FehBattleSimulator/Tests/DamageCalculator.test.js`

### 手順 1: 不要コメントの削除

ファイル先頭3〜5行目にある以下のコメントを削除する。連結廃止後はこのコメントの前提が消滅するため不要。

```javascript
// Note: ESM TestUtilities/TestGlobals importなし。全英雄戦闘テスト(HeroBattleTest)で
// ESM/連結版ノード型混線が発生するため、連結版グローバルを使用する。
// Section 12で連結方式廃止後にESM化する。
```

### 手順 2: ESM import の追加

既存の2行のimportに加え、以下のimportを追加する。他のESM化済みテストファイル（例: `CombatFlow.test.js`）と同じパターンに従う。

追加すべきimport文:

1. **TestGlobals.js から `g_testHeroDatabase`**
   - `import { g_testHeroDatabase } from './TestGlobals.js';`
   - TestGlobals.js はESM評価時に初期化処理（SkillImpl*.js のスキル登録、`initUnitSkillEffects(Unit)` の実行、`g_testHeroDatabase` の生成）を行うため、このimportで初期化と値の取得を同時に行う

2. **TestUtilities.js から名前付きimport**
   - `import { test_DamageCalculator, test_calcDamage, test_createDefaultUnit, test_executeTest } from '../Sources/TestUtilities.js';`
   - TestUtilities.js の export 行に全て含まれていることは確認済み

既存のimport（`UnitGroupType`, `PassiveA`, `PassiveC`）はそのまま維持する。

### 手順 3: グローバル参照の機械的検証

目視でのコード走査に頼らず、実際にテストを実行して検証する:

1. ESM importを追加した状態で `npx vitest run Tests/DamageCalculator.test.js` を実行
2. `ReferenceError: xxx is not defined` が出た場合、不足importを追加
3. 全てのReferenceErrorが解消されるまで繰り返す

### 暗黙依存シンボル一覧（参考）

事前分析に基づく、連結グローバルから参照されている主要シンボルの一覧:

| シンボル | import元 | 備考 |
|---------|---------|------|
| `g_testHeroDatabase` | `Tests/TestGlobals.js` | named import |
| `test_DamageCalculator` | `Sources/TestUtilities.js` | named import |
| `test_calcDamage` | `Sources/TestUtilities.js` | named import |
| `test_createDefaultUnit` | `Sources/TestUtilities.js` | named import |
| `test_executeTest` | `Sources/TestUtilities.js` | named import |

この一覧は事前分析に基づく。手順3の機械的検証で追加のシンボルが判明した場合はそれも対応する。

## HeroBattleTest の重要性

`DamageCalculator_HeroBattleTest` は1391回の英雄別戦闘テストを実行する最重要テストケースである。このテストは以下の全てに依存する:

- **ノード同一性:** SkillEffectNode の `instanceof` チェックが正しく動作すること
- **side-effect登録の完全性:** SkillImpl*.js のスキル登録が全てESM版 SkillEffectRegistrar に反映されていること  
- **initUnitSkillEffects(Unit):** TestGlobals.js での呼び出しが全ての SkillImpl import の後に実行されていること

連結廃止により二重世界が解消されるため、ESM版のみのシングルワールドで全てが正しく動作するはずだが、失敗時は以下を疑う:

1. ESM版とグローバル版でクラスオブジェクトが別になっていないか
2. SkillImpl*.js の import 順序が期待通りか
3. TestGlobals.js での `initUnitSkillEffects(Unit)` 呼び出しが全 SkillImpl import の後に実行されているか

## 依存関係

- **Section 01 (filter-evacuation):** filterImportExport()の退避。本セクションとは独立して実施可能
- **Section 02 (concatenation-removal):** vitest.setup.js の削除と vite.config.js の更新。本セクションの変更は Section 02 と同時に適用して初めて動作する（連結が残っていると二重世界問題が継続する）
- **Section 04 (skilleffect-esm):** SkillEffect.test.js のESM化。本セクションとは独立して実施可能
- **Section 05 (verification):** 全セクション完了後の段階的検証

## 成功基準

1. `DamageCalculator.test.js` が ESM import のみで動作する（連結グローバルへの暗黙依存がない）
2. ファイル先頭の二重世界問題に関するコメントが削除されている
3. `DamageCalculator_HeroBattleTest`（1391回）がパスする
4. ファイル内の全47 describe/test ブロックがパスする
5. `ReferenceError` が発生しない