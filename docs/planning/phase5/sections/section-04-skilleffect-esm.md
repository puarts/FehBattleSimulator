I now have all the information needed. Let me generate the section content.

# Section 04: SkillEffect.test.js の完全ESM化

## 概要

Section 11 で「条件付き完了」とされた `Tests/SkillEffect.test.js` の未移行参照を全て解消し、連結方式（`vitest.setup.js` 経由の `vm.runInThisContext`）が廃止された後でも正常に動作するようESM importのみで完結させる。

## 前提条件

- Section 01 (filterImportExport退避) が完了していること
- Section 02 (連結方式廃止: vitest.setup.js 削除、vite.config.js から setupFiles 除去) が完了していること
- `Tests/TestGlobals.js` がESM化済みで `g_testHeroDatabase` を named export していること
- `Sources/TestUtilities.js` が `test_DamageCalculator` 等を named export していること

## 対象ファイル

| ファイル | 変更内容 |
|---------|---------|
| `Tests/SkillEffect.test.js` | 未移行の暗黙グローバル参照を全てESM importに置換 |

## テスト方針

### テスト: 未移行参照の解消

```
# Test: SkillEffect.test.js に ReferenceError（未定義変数）が発生しないこと
# Test: g_testHeroDatabase が TestGlobals.js の named import で正しく取得できること
# Test: test_DamageCalculator が TestUtilities.js から正しく import されること
# Test: globalThis.g_appData の使用が適切に処理されていること
```

### テスト: 既存テストケースの維持

```
# Test: SkillEffect.test.js 内の全テストケースが引き続きパスすること
```

### 検証コマンド

```bash
# SkillEffect.test.js 単体実行
npx vitest run Tests/SkillEffect.test.js

# 全テスト実行（最終確認）
npm run test:only
```

## 現在の状態分析

### 現在のimport文（2行のみ）

ファイル先頭には以下の2行しかない:

```javascript
import { NumberNode, CONSTANT_NUMBER_NODE, MultiValueMap, SkillEffectHooks } from '../Sources/SkillEffectCore.js';
import { NodeEnv } from '../Sources/SkillEffectEnv.js';
```

残りの全シンボルは、連結方式（`vitest.setup.js` が `vm.runInThisContext` でファイルをグローバルスコープに注入）による暗黙参照で解決されていた。

### 未移行の暗黙参照シンボル一覧

以下のシンボルがファイル内で使用されているが、ESM importされていない。

#### TestGlobals / TestUtilities 関連

| シンボル | import元 | 使用箇所 |
|---------|---------|---------|
| `g_testHeroDatabase` | `Tests/TestGlobals.js` | 行222, 294, 438, 513, 700, 1028, 1231 |
| `test_DamageCalculator` | `Sources/TestUtilities.js` | 行300, 441, 519, 728 |

#### `globalThis.g_appData` の使用

行302, 444, 522 で `globalThis.g_appData = calculator.unitManager` として代入されている。これはテスト固有の状態設定であり、テスト内でのグローバル状態のモック的な使用のため、ESM import への置換ではなくそのまま維持する。

#### SkillEffectCore.js からの追加シンボル

| シンボル | 用途 |
|---------|------|
| `ConstantNumberNode` | ノード生成（行66等） |
| `SkillEffectNode` | ノード生成・テスト（行77等） |
| `AndNode` | 論理AND（行98等） |
| `OrNode` | 論理OR（行115等） |
| `CannotAnyNode` | 否定ノード（行132等） |
| `TRUE_NODE`, `FALSE_NODE` | 定数ノード（行101等） |
| `IfNode` | 条件ノード（行142等） |
| `MultNode` | 乗算ノード（行164等） |
| `MultTruncNode` | 切り捨て乗算ノード（行171等） |
| `CollectionNode`, `COLLECTION_NODE` | コレクション（行178等） |
| `COUNT_COLLECTION` | コレクション数え上げ（行181） |
| `IntersectCollectionNode` | 共通集合（行204） |
| `EXISTS` | 存在チェック（行191等） |
| `THERE_IS` | 存在チェック（行959） |
| `NUM_OF` | 数え上げ（行964） |
| `NODE_FUNC` | ノード関数ラッパー（行474等） |

#### SkillEffect.js からのシンボル

| シンボル | export元 |
|---------|---------|
| `TARGET_NODE` | `SkillEffect.js` |
| `UNIT`, `FOE` | `SkillEffect.js` |
| `UNITS_NODE` | `SkillEffect.js` |
| `CLOSEST_FOES` | `SkillEffect.js` |
| `ALLIES_WITHIN`, `FOES_WITHIN` | `SkillEffect.js` |
| `ANY_SPACE`, `PLACED_SPACES` | `SkillEffect.js` |
| `HIGHEST` | `SkillEffect.js` |
| `FOR_UNIT` | `SkillEffect.js` |
| `EFFECTS` | `SkillEffect.js` |
| `X` | `SkillEffect.js` |
| `STATS` | `SkillEffect.js` |
| `DEF` | `SkillEffect.js` |
| `GRANTS_ALL_STATS_PLUS_5_TO_TARGET_DURING_COMBAT_NODE` | `SkillEffect.js` |
| `GRANTS_ATK_SPD_DEF_RES_TO_TARGET_DURING_COMBAT_NODE` | `SkillEffect.js` |
| `INFLICTS_ALL_STATS_MINUS_5_ON_FOE_DURING_COMBAT_NODE` | `SkillEffect.js` |
| `INFLICTS_ATK_SPD_DEF_RES_ON_FOE_DURING_COMBAT_NODE` | `SkillEffect.js` |
| `INFLICTS_ATK_SPD_DEF_RES_ON_TARGET_DURING_COMBAT_NODE` | `SkillEffect.js` |
| `CAN_DECREASING_SPD_TRIGGER_FOLLOW_UP_EXCLUDING_GUARANTEED_OR_PREVENTED_FOLLOW_UPS` | `SkillEffect.js` |
| `TARGETS_SPD_ON_MAP` | `SkillEffectAliases.js` |
| `TARGETS_EVAL_SPD_NODE` | `SkillEffect.js` |
| `TARGETS_ATK_ON_MAP` | `SkillEffectAliases.js` |

#### SkillEffectUnit.js / SkillEffectBattleContext.js からのシンボル

| シンボル | export元 |
|---------|---------|
| `GRANTS_BONUS` | `SkillEffectUnit.js` |
| `INFLICTS_PENALTY` | `SkillEffectUnit.js` |
| `GRANTS_STATUS_EFFECTS` | `SkillEffect.js` |
| `INFLICTS_STATUS_EFFECTS` | `SkillEffect.js` |
| `NEUTRALIZES_STAT_PENALTIES` | `SkillEffect.js` |
| `NEUTRALIZES_N_PENALTY_EFFECTS` | `SkillEffectUnit.js` |
| `DEALS_DAMAGE` | `SkillEffectBattleContext.js` |
| `DEALS_DAMAGE_X_NODE` | `SkillEffectAliases.js` |
| `AT_START_OF_COMBAT_HOOKS` | `SkillEffectHooks.js` |
| `AT_COMPARING_STATS_HOOKS` | `SkillEffectHooks.js` |
| 各種 `CANNOT_TRIGGER_PRECOMBAT_SPECIAL` 等のModSkillEffectField DSL | `SkillEffectBattleContext.js` |

#### その他のシンボル

| シンボル | export元 |
|---------|---------|
| `UnitGroupType` | `Sources/UnitConstants.js` |
| `PassiveS` | `Sources/SkillConstants.js` |
| `StatusEffectType` | `Sources/StatusConstants.js` |
| `POSITIVE_STATUS_EFFECT_ARRAY` | `Sources/StatusConstants.js` |
| `NEGATIVE_STATUS_EFFECT_ARRAY` | `Sources/StatusConstants.js` |
| `STATUS_EFFECT_INFO_MAP` | `Sources/UnitConstants.js` |
| `StatFlags` | `Sources/StatusConstants.js` |
| `BattleMap` | `Sources/BattleMap.js` |
| `ArrayUtil` | `Sources/Utilities.js` |
| `MathUtil` | `Sources/Utilities.js` |
| `SkillEffectField` | `Sources/SkillEffectField.js` |
| `SkillRequirement` | `Sources/SkillEffectCore.js` |
| `MULT_NODE` | `Sources/SkillEffectCore.js` |

## 実装手順

### Step 1: 不足している import 文の追加

ファイル先頭に、全ての暗黙参照シンボルのESM importを追加する。既存の2行のimportは維持しつつ、不足分を追加する。

追加すべきimportの構成:

1. **`Tests/TestGlobals.js`** -- `g_testHeroDatabase` の named import。TestGlobals.js はスキル登録等の初期化副作用も持つため必須。
2. **`Sources/TestUtilities.js`** -- `test_DamageCalculator` の named import。
3. **`Sources/SkillEffectCore.js`** -- 既存importに以下を追加: `ConstantNumberNode`, `SkillEffectNode`, `AndNode`, `OrNode`, `CannotAnyNode`, `IfNode`, `MultNode`, `MultTruncNode`, `CollectionNode`, `COLLECTION_NODE`, `COUNT_COLLECTION`, `IntersectCollectionNode`, `EXISTS`, `THERE_IS`, `NUM_OF`, `NODE_FUNC`, `SkillRequirement`, `MULT_NODE`
4. **`Sources/SkillEffect.js`** -- `TARGET_NODE`, `UNIT`, `FOE`, `UNITS_NODE`, `CLOSEST_FOES`, `ALLIES_WITHIN`, `FOES_WITHIN`, `ANY_SPACE`, `PLACED_SPACES`, `HIGHEST`, `FOR_UNIT`, `EFFECTS`, `X`, `STATS`, `DEF`, `GRANTS_ALL_STATS_PLUS_5_TO_TARGET_DURING_COMBAT_NODE`, `GRANTS_ATK_SPD_DEF_RES_TO_TARGET_DURING_COMBAT_NODE`, `INFLICTS_ALL_STATS_MINUS_5_ON_FOE_DURING_COMBAT_NODE`, `INFLICTS_ATK_SPD_DEF_RES_ON_FOE_DURING_COMBAT_NODE`, `INFLICTS_ATK_SPD_DEF_RES_ON_TARGET_DURING_COMBAT_NODE`, `CAN_DECREASING_SPD_TRIGGER_FOLLOW_UP_EXCLUDING_GUARANTEED_OR_PREVENTED_FOLLOW_UPS`, `TARGETS_EVAL_SPD_NODE`, `GRANTS_STATUS_EFFECTS`, `INFLICTS_STATUS_EFFECTS`, `NEUTRALIZES_STAT_PENALTIES`
5. **`Sources/SkillEffectUnit.js`** -- `GRANTS_BONUS`, `INFLICTS_PENALTY`, `NEUTRALIZES_N_PENALTY_EFFECTS`
6. **`Sources/SkillEffectAliases.js`** -- `TARGETS_SPD_ON_MAP`, `TARGETS_ATK_ON_MAP`, `DEALS_DAMAGE_X_NODE`
7. **`Sources/SkillEffectHooks.js`** -- `AT_START_OF_COMBAT_HOOKS`, `AT_COMPARING_STATS_HOOKS`
8. **`Sources/SkillEffectBattleContext.js`** -- `DEALS_DAMAGE`, `CANNOT_TRIGGER_PRECOMBAT_SPECIAL`, `DISABLES_DEFENSIVE_TERRAIN_EFFECTS`, `DISABLES_SUPPORT_EFFECTS`, `INVALIDATES_COUNTERATTACK`, `DISABLES_SKILLS_THAT_PREVENT_COUNTERATTACKS`, `PREVENTS_ATTACKER_SPECIAL`, `PREVENTS_DEFENDER_SPECIAL`, `PREVENTS_DEFENDER_SPECIAL_PER_ATTACK`, `DISABLES_SKILLS_THAT_CHANGE_ATTACK_PRIORITY`, `CAN_COUNTERATTACK_REGARDLESS_OF_RANGE`, `CALCULATES_DAMAGE_USING_LOWER_OF_FOES_DEF_OR_RES`, `INVALIDATES_FOES_NON_SPECIAL_DAMAGE_REDUCTION`, `IS_DESPERATION_ACTIVATABLE`, `IS_VANTAGE_ACTIVATABLE`, `HAS_DEEP_WOUNDS`, `DOES_NOT_TRIGGER_FOES_SAVIOR_EFFECTS`, `DEALS_DAMAGE_PER_ATTACK`, `DEALS_DAMAGE_OF_SPECIAL`, `RESTORES_HP_AFTER_COMBAT`, `REDUCES_DAMAGE_PER_ATTACK`, `INCREASES_SPD_DIFF_FOR_FOLLOWUP`, `FOLLOWUP_ATTACK_PRIORITY_INCREMENT`, `FOLLOWUP_ATTACK_PRIORITY_DECREMENT`, `SPECIAL_COUNT_REDUCTION_BEFORE_ATTACK`, `SETS_ATTACK_COUNT`, `SETS_COUNTERATTACK_COUNT`, `SETS_NON_SPECIAL_MIRACLE_HP_THRESHOLD`, `DISABLES_INCREASE_COOLDOWN_COUNT_FOR_ATTACK`, `DISABLES_INCREASE_COOLDOWN_COUNT_FOR_DEFENSE`
9. **`Sources/SkillEffectField.js`** -- `SkillEffectField`
10. **`Sources/UnitConstants.js`** -- `UnitGroupType`, `STATUS_EFFECT_INFO_MAP`
11. **`Sources/StatusConstants.js`** -- `StatusEffectType`, `POSITIVE_STATUS_EFFECT_ARRAY`, `NEGATIVE_STATUS_EFFECT_ARRAY`, `StatFlags`
12. **`Sources/SkillConstants.js`** -- `PassiveS`
13. **`Sources/BattleMap.js`** -- `BattleMap`
14. **`Sources/Utilities.js`** -- `ArrayUtil`, `MathUtil`

### Step 2: globalThis.g_appData の対応

`globalThis.g_appData = calculator.unitManager` のパターン（行302, 444, 522）はテスト固有の状態設定である。テスト実行中に `g_appData` をグローバル状態として必要とするプロダクションコードがあるため、この代入はそのまま維持する。ESM import への置換は不要。

### Step 3: 機械的検証による不足import検出

上記の一覧は事前分析に基づくが、網羅性は保証されない。実装時は以下の機械的アプローチで検証する:

1. Step 1 の import を追加した状態で `npx vitest run Tests/SkillEffect.test.js` を実行
2. `ReferenceError: xxx is not defined` が出力された場合、該当シンボルのexport元を特定してimportを追加
3. エラーが出なくなるまで繰り返す

この手順により、事前分析で漏れたシンボルも確実に捕捉できる。

### Step 4: テスト実行と全体確認

```bash
# SkillEffect.test.js 単体の確認
npx vitest run Tests/SkillEffect.test.js

# 全テスト実行
npm run test:only
```

## 注意事項

### re-export の活用

`Sources/SkillEffect.js` は多くのシンボルを他モジュール（`SkillEffectUnit.js`, `SkillEffectBattleContext.js` 等）から re-export している。一部のシンボルは `SkillEffect.js` からも `SkillEffectUnit.js` からもimport可能だが、元のexport元から直接importする方が依存関係が明確になる。ただし、import行が膨大になる場合は re-export 元の `SkillEffect.js` からまとめてimportすることも許容される。

### import の順序

ESMの仕様上、import文の順序はモジュール評価順に影響しない（依存グラフで決定される）。ただし可読性のため、以下の順序で配置することを推奨する:

1. `Tests/` ディレクトリのファイル（TestGlobals.js）
2. `Sources/` ディレクトリのファイル（TestUtilities.js, 各種モジュール）

### Section 03 (DamageCalculator.test.js ESM化) との類似性

本セクションの作業は Section 03 と同じパターンに従う。Section 03 が先に完了している場合、そのimportパターンを参考にすることで効率的に作業できる。特に `TestGlobals.js` からの `g_testHeroDatabase` のimportと `TestUtilities.js` からの `test_DamageCalculator` のimportは同一パターンである。

## 成功基準

1. `SkillEffect.test.js` にある全ての暗黙グローバル参照がESM importに置換されていること
2. `npx vitest run Tests/SkillEffect.test.js` で全テストケースがパスすること
3. `ReferenceError` が一切発生しないこと
4. `globalThis.g_appData` の使用がテスト固有の状態設定として適切に維持されていること
5. `npm run test:only` で全体テストに影響がないこと