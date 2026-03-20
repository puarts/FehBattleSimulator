# Section 09: Stage H -- 戦闘計算の ESM 化

> **実装済み** — 全5ファイルのimport/export追加完了、全310テストパス

## 概要

このセクションでは、戦闘計算に関わる5つのファイルに `import` / `export` 文を追加して ES Modules 化する。これらのファイルはシミュレータの中核であるダメージ計算・戦闘後処理・ターン開始時処理を担っている。

**対象ファイル:**

| ファイル | 主要定義 | 主要依存 |
|---------|---------|---------|
| `Sources/DamageCalculationUtility.js` | TriangleAdvantage, ColorToTriangleAdvantageTable, EffectiveFuncTable, DamageCalculationUtility | Unit, BattleContext, SkillConstants (EffectiveType, MoveType, WeaponType, Weapon, ColorType), SkillEffectHooks (CALC_TRIANGLE_ADVANTAGE_HOOKS) |
| `Sources/DamageCalculator.js` | GameMode, DamageType, DamageCalcResult, CombatResult, AttackResult, StrikeResult, DamageCalcContext, DamageCalcEnv, OneAttackResult, DamageCalculator | Unit, BattleContext, SkillConstants, Logger, SkillEffectHooks, DamageCalculationUtility |
| `Sources/PostCombatSkillHander.js` | PostCombatSkillHander | Unit, DamageCalculator, BattleMap, UnitManager, GlobalBattleContext, SkillConstants |
| `Sources/DamageCalculatorWrapper.js` | PerformanceProfile, ScopedTileChanger, DamageCalculatorWrapper | DamageCalculator, PostCombatSkillHander, Unit, BattleMap, UnitManager, GlobalBattleContext, SkillConstants, SkillEffectHooks |
| `Sources/BeginningOfTurnSkillHandler.js` | BeginningOfTurnSkillHandler | Unit, BattleMap, UnitManager, GlobalBattleContext, SkillConstants, SkillEffectHooks |

**依存セクション:** section-07 (Stage F: コアゲームクラス), section-08 (Stage G: スキル実装)

---

## テスト

Stage H の変換が正しく行われたことを検証するテスト。既存テストスイートの回帰確認が中心。

### テスト 1: DamageCalculator 変換後、全 combat カテゴリテストがパス

```
# Test: DamageCalculator 変換後、全 combat カテゴリテストがパス
# 検証方法: ./run_tests.sh を実行し、既存の combat カテゴリテスト
# (DamageCalculator, BeginningOfTurnSkillHandler, CombatFlow, SpecialCount,
#  DamageReduction, FollowUpAttack, StatusEffect) が全てパスすることを確認。
# 新規テストの追加は不要 -- 既存テストが回帰検出を担う。
```

### テスト 2: BeginningOfTurnSkillHandler 変換後、ターン開始処理テストがパス

```
# Test: BeginningOfTurnSkillHandler 変換後、ターン開始処理テストがパス
# 検証方法: ./run_tests.sh を実行し、BeginningOfTurnSkillHandler テストファイルの
# 全テストがパスすることを確認。
```

### テスト 3: 全テストスイートの回帰確認

```
# Test: Stage H の全5ファイル変換完了後、全テストスイート (305+テスト) がパス
# 検証方法: ./run_tests.sh で全テスト実行。
# npm run build でビルド出力が正常なことも確認。
```

---

## 実装手順

### 前提条件

- section-07 (Stage F) が完了していること: Unit, BattleContext, BattleMap, UnitManager, GlobalBattleContext が ESM 化済み
- section-08 (Stage G) が完了していること: SkillImpl ファイル群が ESM 化済み
- section-01 (ビルドフィルタ) が完了していること: build.mjs と create_tests.sh に import/export 除去フィルタが導入済み

### コーディング規約（全ファイル共通）

- `import` 文と `export` 文は必ず1行で記述する（複数行にまたがる記述は禁止）
- `export` は末尾まとめ `export { ... };` に統一（インライン export は禁止）
- バレルファイルは作らず、直接 import を使用

### 変換順序

`create_tests.sh` の `SOURCE_FILE_NAMES` 配列での順序に従い、依存関係の上流から変換する:

1. **DamageCalculationUtility.js** (依存: Unit, BattleContext, SkillConstants 等)
2. **DamageCalculator.js** (依存: DamageCalculationUtility, Unit, BattleContext 等)
3. **PostCombatSkillHander.js** (依存: DamageCalculator, Unit, BattleMap 等)
4. **DamageCalculatorWrapper.js** (依存: DamageCalculator, PostCombatSkillHander 等)
5. **BeginningOfTurnSkillHandler.js** (依存: Unit, BattleMap, SkillEffectHooks 等)

各ファイル変換後に `./run_tests.sh` を実行して回帰がないことを確認する。

---

### ファイル 1: `Sources/DamageCalculationUtility.js`

**定義されるトップレベルシンボル:**
- `TriangleAdvantage` (const オブジェクト)
- `ColorToTriangleAdvantageTable` (const 配列)
- `EffectiveFuncTable` (const オブジェクト)
- `DamageCalculationUtility` (class)

**依存する外部シンボル:**
- `EffectiveType`, `MoveType`, `WeaponType`, `Weapon`, `ColorType` -- SkillConstants.js から
- `isWeaponTypeBreath`, `isWeaponTypeBeast`, `isWeaponTypeTome` -- SkillConstants.js から
- `NodeEnv` -- SkillEffectEnv.js から
- `LoggerBase` -- Logger.js から
- `getSkillLogLevel` -- グローバル関数（SkillImpl 系またはアプリ層で定義）
- `CALC_TRIANGLE_ADVANTAGE_HOOKS` -- SkillEffectHooks.js から

**作業:**

1. ファイル先頭に import 文を追加:

```javascript
// 実際の実装:
import { EffectiveType, WeaponType, Weapon, ColorType } from './SkillConstants.js';
import { MoveType } from './HeroInfoConstants.js';
import { isWeaponTypeBreath, isWeaponTypeBeast, isWeaponTypeTome } from './Skill.js';
import { LoggerBase } from './Logger.js';
import { NodeEnv } from './SkillEffectEnv.js';
import { getSkillLogLevel } from './SkillEffect.js';
import { CALC_TRIANGLE_ADVANTAGE_HOOKS } from './SkillEffectHooks.js';
```

**計画との差異:**
- `MoveType` は SkillConstants.js ではなく HeroInfoConstants.js から import（実際の export 元）
- `isWeaponTypeBreath` 等は SkillConstants.js ではなく Skill.js から import（実際の export 元）
- `getSkillLogLevel` は SkillEffect.js から import を追加（グローバル関数ではなく明示的 export あり）

2. ファイル末尾に export 文を追加:

```javascript
export { TriangleAdvantage, ColorToTriangleAdvantageTable, EffectiveFuncTable, DamageCalculationUtility };
```

3. `./run_tests.sh` を実行して全テストがパスすることを確認

**注意:** `getSkillLogLevel` はグローバル関数として複数箇所で定義・使用されている可能性がある。結合モードではグローバルスコープで参照されるため、import が不要な場合は追加しない。依存解析で定義元を特定し、import が必要かどうか判断する。結合時にフィルタで import が除去されるため、グローバルに残っている関数は import 不要の場合がある。

---

### ファイル 2: `Sources/DamageCalculator.js`

**定義されるトップレベルシンボル:**
- `GameMode` (const オブジェクト)
- `DamageType` (const オブジェクト)
- `DamageCalcResult` (class -- abstract)
- `CombatResult` (class extends DamageCalcResult)
- `AttackResult` (class extends DamageCalcResult)
- `StrikeResult` (class extends DamageCalcResult)
- `DamageCalcContext` (class)
- `DamageCalcEnv` (class)
- `OneAttackResult` (class)
- `DamageCalculator` (class)

このファイルは約2989行と大きいが、全てのクラスはこの1ファイル内で完結している。

**依存する外部シンボル:**
- `GroupLogger` -- Logger.js から
- `NodeEnv` -- SkillEffectEnv.js から
- `LoggerBase` -- Logger.js から
- `DamageCalculationUtility`, `TriangleAdvantage` -- DamageCalculationUtility.js から
- `Unit` 関連の型参照 -- Unit.js から（実行時にインスタンスメソッド呼び出し）
- `Special`, `Weapon`, `PassiveA`, `PassiveB` 等 -- SkillConstants.js から
- 各種フック -- SkillEffectHooks.js から
- 各種グローバルマップ（`applySkillEffectForUnitFuncMap` 等）-- SkillImpl.js から

**作業:**

1. ファイル先頭に import 文を追加（実際に使用されているシンボルを依存解析で特定して列挙）
2. ファイル末尾に export 文を追加:

```javascript
export { GameMode, DamageType, DamageCalcResult, CombatResult, AttackResult, StrikeResult, DamageCalcContext, DamageCalcEnv, OneAttackResult, DamageCalculator };
```

3. `./run_tests.sh` を実行して全テストがパスすることを確認

**循環依存に関する注意:** DamageCalculator は Unit のインスタンスメソッドを多用し、Unit 側も DamageCalculator の型を参照する可能性がある。ただし、この循環は「実行時の相互呼び出し」であり、ESM では初期化完了後のアクセスなので問題にならない。import は通常通り追加してよい。

---

### ファイル 3: `Sources/PostCombatSkillHander.js`

**定義されるトップレベルシンボル:**
- `PostCombatSkillHander` (class)

**依存する外部シンボル:**
- `UnitManager` -- UnitManager.js から
- `Unit` 関連 -- Unit.js から
- `BattleMap` 関連 -- BattleMap.js から
- `GlobalBattleContext` -- GlobalBattleContext.js から
- `LoggerBase` -- Logger.js から
- `DamageCalculator` -- DamageCalculator.js から
- `OwnerType` -- UnitConstants.js から
- 各種スキル定数 -- SkillConstants.js から
- 各種グローバルマップ（`applyPostCombatAllySkillFuncMap` 等）-- SkillImpl.js から
- `getSkillFunc` -- グローバル関数

**作業:**

1. ファイル先頭に import 文を追加
2. ファイル末尾に export 文を追加:

```javascript
export { PostCombatSkillHander };
```

3. `./run_tests.sh` を実行して全テストがパスすることを確認

---

### ファイル 4: `Sources/DamageCalculatorWrapper.js`

**定義されるトップレベルシンボル:**
- `PerformanceProfile` (class)
- `ScopedTileChanger` (class)
- `DamageCalculatorWrapper` (class)

このファイルは約17194行と非常に大きい。DamageCalculatorWrapper はスキル効果適用の中心的なクラスで、多数のスキル定数・フック・グローバルマップを参照する。

**依存する外部シンボル:**
- `DamageCalculator`, `DamageCalcEnv`, `CombatResult`, `GameMode`, `DamageType` -- DamageCalculator.js から
- `PostCombatSkillHander` -- PostCombatSkillHander.js から
- `UnitManager` -- UnitManager.js から
- `Unit` 関連 -- Unit.js から
- `BattleMap` 関連 -- BattleMap.js から
- `GlobalBattleContext` -- GlobalBattleContext.js から
- `LoggerBase` -- Logger.js から
- 多数のスキル定数 (`Weapon`, `PassiveA`, `PassiveB`, `PassiveC`, `Special`, `Support` 等) -- SkillConstants.js から
- 多数のフック -- SkillEffectHooks.js から
- 多数のグローバルマップ (`applySkillEffectForUnitFuncMap` 等) -- SkillImpl.js から
- `setUnitToTile` -- グローバル関数（ScopedTileChanger の dispose で使用）
- `NodeEnv` -- SkillEffectEnv.js から
- `StatusEffectType` -- SkillConstants.js から

**作業:**

1. ファイル先頭に import 文を追加。このファイルは非常に多くの外部シンボルを参照するため、import 文の数が多くなる。全て1行ずつ記述する
2. ファイル末尾に export 文を追加:

```javascript
export { PerformanceProfile, ScopedTileChanger, DamageCalculatorWrapper };
```

3. `./run_tests.sh` を実行して全テストがパスすることを確認

**注意:** このファイルには多数のグローバルマップ参照（`applySkillEffectForUnitFuncMap` 等）がある。これらのマップは SkillImpl.js で定義されている。Stage G (section-08) で SkillImpl.js がこれらのマップを export している前提で import を追加する。もし SkillImpl.js が副作用モジュールとしてこれらをグローバルに残している場合は、import は不要（結合モードでグローバルアクセスが維持される）。

---

### ファイル 5: `Sources/BeginningOfTurnSkillHandler.js`

**定義されるトップレベルシンボル:**
- `BeginningOfTurnSkillHandler` (class)

このファイルは約3393行。ターン開始時のスキル効果処理を担当する。

**依存する外部シンボル:**
- `UnitManager` -- UnitManager.js から
- `Unit` 関連 -- Unit.js から
- `BattleMap` 関連 -- BattleMap.js から
- `GlobalBattleContext` -- GlobalBattleContext.js から
- `LoggerBase` -- Logger.js から
- 各種スキル定数 -- SkillConstants.js から
- `AT_START_OF_TURN_HOOKS`, `AT_START_OF_ENEMY_PHASE_HOOKS` 等 -- SkillEffectHooks.js から
- `AtStartOfTurnEnv` -- SkillEffectEnv.js または SkillEffectAliases.js から
- `UnitGroupType` -- UnitConstants.js から
- 各種グローバルマップ -- SkillImpl.js から
- `getSkillFunc`, `getSkillLogLevel`, `isNormalAttackSpecial`, `isPhysicalWeaponType` 等 -- グローバル関数

**作業:**

1. ファイル先頭に import 文を追加
2. ファイル末尾に export 文を追加:

```javascript
export { BeginningOfTurnSkillHandler };
```

3. `./run_tests.sh` を実行して全テストがパスすることを確認

---

## グローバル関数・マップの扱い

Stage H の各ファイルは多数のグローバル関数・グローバルマップを参照している:

- **グローバル関数**: `getSkillFunc`, `getSkillLogLevel`, `isNormalAttackSpecial`, `isPhysicalWeaponType`, `isWeaponTypeBreathOrBeast`, `setUnitToTile` 等
- **グローバルマップ**: `applySkillEffectForUnitFuncMap`, `applySkillEffectForAtkUnitFuncMap`, `applyPostCombatAllySkillFuncMap`, `applyHealSkillForBeginningOfTurnFuncMap` 等

これらは主に SkillImpl.js や CustomSkill.js、SkillConstants.js などで定義されている。各関数・マップの定義元を特定し、その定義元が Stage G 以前で export 済みであれば import を追加する。定義元が明確でない場合や、グローバルスコープに残っている場合は、結合モードでのグローバルアクセスに依存してよい（結合時に import 行は除去されるため）。

**実装時の判断基準:**
1. 定義元が特定でき、そのファイルが既に export しているなら import を追加
2. 定義元が複数ファイルにまたがる、または明確でない場合は import を追加せず、コメントで注記する
3. 将来の Phase 3 (Vite 移行) で改めて整理する

---

## 検証手順

各ファイルの変換後、以下を実行:

1. `./run_tests.sh` -- 全テストスイートがパスすることを確認
2. `npm run build` -- ビルド出力が正常なことを確認（import/export 行がフィルタで除去され、出力に残っていないことを確認）

全5ファイルの変換完了後:

3. combat カテゴリの全テストがパスすること: DamageCalculator, BeginningOfTurnSkillHandler, CombatFlow, SpecialCount, DamageReduction, FollowUpAttack, StatusEffect
4. SmokeTest がパスすること
5. 全テストスイート (305+ テスト) がパスすること