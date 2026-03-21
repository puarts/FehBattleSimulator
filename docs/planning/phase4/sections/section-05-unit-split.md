Now I have all the context needed. Let me write the section.

# Section 5: Unit.js の責務別分割

## Overview

Unit.js は約 7,450 行のファイルで、`Unit` クラスとその関連クラス・関数を含む。現在このファイルは Layer 3（Entities）の責務と Layer 5（DSL）の責務が混在しており、`SkillEffectHooks.js`、`SkillEffect.js`、`SkillEffectEnv.js` への import が循環依存の原因となっている。

本セクションでは Unit.js を 3 ファイルに責務分割し、Layer 5 への逆依存を解消する。

## Dependencies

- **Section 03 (StatusConstants)** が完了していること: `StatusIndex`/`StatusEffectType` が `StatusConstants.js` に抽出済みであること
- Section 04 (Skill split) と並行実施可能

## Background

### 現在の Unit.js の構造

Unit.js は以下を含む:

- **imports**: `SkillEffectEnv.js`（`NodeEnv`）、`SkillEffectHooks.js`（4 つの HOOKS 定数）、`SkillEffect.js`（`getSkillLogLevel`）への参照がある。これらは Layer 5 のファイルであり、Layer 3 の Unit.js から参照すると循環依存が生じる
- **クラス定義**: `Unit`（extends `BattleMapElement`）、`AttackableUnitInfo`、`AttackEvaluationContext`、`AssistableUnitInfo`、`ActionContext`、`PrecombatContext`、`UnitUtil`
- **スタンドアロン関数**: `isThief`、`calcArenaBaseStatusScore`、`calcArenaTotalSpScore`、`calcBuffAmount`、`calcHealAmount`、`isDebufferTier1`、`isDebufferTier2`、`isAfflictor`、`canRefreshTo`
- **exports**: 上記のクラスと関数すべて

### Layer 5 参照箇所の特定

Unit.js から Layer 5 への参照は以下の 3 つの import に集約される:

```javascript
import { NodeEnv } from './SkillEffectEnv.js';          // Layer 5
import { IS_DEBUFFER_TIER_1_HOOKS, IS_DEBUFFER_TIER_2_HOOKS, IS_AFFLICTOR_HOOKS, CALC_HEAL_AMOUNT_HOOKS } from './SkillEffectHooks.js';  // Layer 5
import { getSkillLogLevel } from './SkillEffect.js';    // Layer 5
```

これらは Unit クラスの約 40 メソッドと 4 つのスタンドアロン関数（`calcHealAmount`、`isDebufferTier1`、`isDebufferTier2`、`isAfflictor`）で使用されている。

### 分割パターン: 明示的 init 関数

トップレベルの副作用 import（`import './UnitSkillEffect.js'` で prototype 拡張が自動実行される方式）は ESM の評価順序に依存するため TDZ リスクがある。代わりに、**明示的な初期化関数**をエントリーポイントから呼び出すパターンを採用する:

```javascript
// UnitSkillEffect.js の構造（概念）
export function initUnitSkillEffects(UnitClass) {
    UnitClass.prototype.someSkillMethod = function(...) { ... };
}
```

```javascript
// エントリーポイント（例: ArenaSimulatorMain.js）
import { Unit } from './UnitCore.js';
import { initUnitSkillEffects } from './UnitSkillEffect.js';
initUnitSkillEffects(Unit);
```

## Actual File Changes

### New Files

| File | Lines | Layer | Purpose |
|------|-------|-------|---------|
| `Sources/UnitCore.js` | 5,900 | 3 | Unit クラス（498メソッド）+ 補助クラス + スタンドアロン関数。Layer 5 参照なし |
| `Sources/UnitBattle.js` | 838 | 3 | 102 戦闘関連メソッド（prototype 拡張）。Layer 5 参照なし |
| `Sources/UnitSkillEffect.js` | 711 | 5 (末尾) | 21 Layer5 依存メソッド + 4 スタンドアロン関数。`initUnitSkillEffects(Unit)` で prototype に追加 |
| `Tests/UnitSplit.test.js` | - | - | 分割検証テスト（13テスト） |
| `scripts/split-unit.mjs` | - | - | 分割スクリプト（再現性のため保存） |

### Modified Files

| File | Changes |
|------|---------|
| `Sources/Unit.js` | facade 化: UnitCore/UnitBattle/UnitSkillEffect を re-export |
| `Sources/*Main.js` (全8エントリーポイント) | `initUnitSkillEffects(Unit)` の呼び出しを追加 |
| `vitest.setup.js` | UnitCore/UnitBattle/UnitSkillEffect を SOURCE_FILE_NAMES に追加、filterImportExport に `export function` 対応追加、`initUnitSkillEffects(Unit)` 呼び出し追加 |

### Plan からの変更点

- **UnitBattle.js**: init 関数パターンではなく副作用 import（prototype 拡張がトップレベルで実行）を採用。Layer 3 内参照のため TDZ リスクなし
- **calcBuffAmount**: レビュー指摘により UnitBattle.js → UnitCore.js に移動（UnitCore.js 内の AssistableUnitInfo が参照するため、Section 08 での循環依存リスク回避）
- **private フィールド対策**: `_addStatusEffectRaw()` を UnitCore.js に追加。`__createSnapshotImpl()` は private フィールドアクセスのため UnitCore.js に残留

## Tests

テストファイル: `Tests/UnitSplit.test.js`

以下のテストスタブを作成する。

### Test 1: UnitCore.js から Unit クラスを import でき、基本プロパティにアクセスできる

UnitCore.js から `Unit` を import し、インスタンスを作成して `name`、`hp`、`atk`、`spd`、`def`、`res` 等の基本プロパティにアクセスできることを検証する。`BattleMapElement` を正しく継承していることも確認する。

### Test 2: UnitCore.js が Layer 5 ファイルを一切 import していない

`madge` または手動のファイル内容確認で、`UnitCore.js` が `SkillEffectEnv.js`、`SkillEffectHooks.js`、`SkillEffect.js` などの Layer 5 ファイルを import していないことを検証する。これは grep ベースの検証でもよい。

### Test 3: UnitBattle.js の戦闘関連メソッドが Unit インスタンスで正常に動作する

UnitBattle.js を import した後、Unit インスタンスで `initBattleContext()`、`getAtkInCombat()` 等の戦闘関連メソッドが呼び出せることを検証する。

### Test 4: initUnitSkillEffects(Unit) 呼び出し後、スキル効果メソッドが使用可能

`initUnitSkillEffects(Unit)` を呼び出した後、`Unit.prototype` に `NodeEnv`/HOOKS を使用するメソッド（`canActivatePass()`、`endAction()` 等）が追加されていることを検証する。

### Test 5: initUnitSkillEffects 呼び出し前に作成したインスタンスでも init 後にメソッドが使用可能

prototype ベースの拡張であるため、init 前に作成したインスタンスでも init 後にメソッドが利用可能であることを検証する。

### Test 6: Unit.js（facade）からの import で Unit クラスが取得でき、instanceof が正常動作

`Unit.js` facade から `Unit` を import し、`new Unit()` の `instanceof Unit` が `true` を返すことを検証する。既存の `import { Unit } from './Unit.js'` が引き続き動作することの後方互換性チェック。

### Regression

- 既存テスト 500 件が全パス
- `madge --circular Sources/` で Unit 関連の循環が消えている

## Implementation Steps

### Step 1: Unit.js の責務分類

Unit.js 内の全メソッドを以下の 3 カテゴリに分類する:

**Category A - Core (UnitCore.js, Layer 3)**:
- `Unit` クラス定義、constructor（line 394-453 周辺）
- 基本プロパティの getter/setter（`name`, `hp`, `atk`, `spd`, `def`, `res`, `maxHp`, `moveType` 等）
- 状態管理メソッド（buff/debuff の apply/reserve/reset 系）
- シリアライズ（`toString`, `fromString`, `turnWideStatusToString`, `fromTurnWideStatusString` 等）
- ステータス計算（`updateBaseStatus`, `updateStatusByMergeAndDragonFlower` 等）
- スキル装備・列挙（`enumerateSkills`, `hasSkill`, `clearSkills` 等）
- アリーナスコア計算
- ステータスエフェクト管理（`addStatusEffect`, `hasStatusEffect`, `neutralizeStatusEffect` 等）
- 補助クラス: `AttackableUnitInfo`, `AttackEvaluationContext`, `AssistableUnitInfo`, `ActionContext`, `PrecombatContext`, `UnitUtil`
- スタンドアロン関数: `isThief`, `calcArenaBaseStatusScore`, `calcArenaTotalSpScore`, `canRefreshTo`

**Category B - Battle (UnitBattle.js, Layer 3)**:
- `initBattleContext`
- 戦闘中ステータス取得メソッド群（`getAtkInCombat`, `getSpdInCombat`, `getDefInCombat`, `getResInCombat` 等）
- 戦闘中バフ/デバフ計算（`getAtkBuffInCombat`, `getBuffsInCombat` 等）
- 武器の三すくみ関連（`getTriangleAdeptAdditionalRatio`, `neutralizesSelfTriangleAdvantage`, `reversesTriangleAdvantage`）
- `canCounterAttackToAllDistance`, `canInvalidateSpecifiedEffectiveAttack`, `canInvalidateWrathfulStaff`
- `hasPrecombatSpecial`, `canActivatePrecombatSpecial`
- HP 関連の戦闘メソッド（`takeDamageInCombat`, `healInCombat`, `calculateReducedHealAmountInCombat`）
- スナップショット管理（`createSnapshot`, `deleteSnapshot`, `copySpursToSnapshot`）
- Spur 関連メソッド

**Category C - Skill Effect (UnitSkillEffect.js, Layer 5)**:
`NodeEnv`, HOOKS 定数, `getSkillLogLevel` を使用する全メソッド。具体的には:
- `canActivatePass()` — `NodeEnv` を使用
- `canActivateObstructToAdjacentTiles()` — `NodeEnv` を使用
- `canActivateObstructToTilesWithin2Spaces()` — `NodeEnv` を使用
- `cannotMoveThroughSpacesWithin2SpacesOfUnit()` — `NodeEnv` を使用
- `cannotMoveThroughSpacesWithin3SpacesOfUnit()` — `NodeEnv` を使用
- `endAction()` / `endActionBySkillEffect()` / `endActionByStatusEffect()` — `NodeEnv`, `getSkillLogLevel` を使用
- `applyEndActionSkills()` — `NodeEnv`, `getSkillLogLevel` を使用
- `activateCantoIfPossible()` — `NodeEnv`, `getSkillLogLevel` を使用
- `addStatusEffect()` — `NodeEnv`, `getSkillLogLevel` を使用
- `getColorWhenDeterminingWeaponTriangle()` — `NodeEnv` を使用
- `attackRangeOnMap` getter — `NodeEnv` を使用
- `getAttackRangeDuringCombat()` — `NodeEnv` を使用
- `__getEvalStatsAdd()` — `NodeEnv`, `getSkillLogLevel` を使用
- `calcMoveCountForCanto()` — `NodeEnv`, `getSkillLogLevel` を使用
- `grantsAnotherAction*()` 系メソッド群 — `NodeEnv` を使用
- `activateStyle()` / `deactivateStyleAfterAction()` / `canActivateStyle()` — `NodeEnv`, `getSkillLogLevel` を使用
- スタンドアロン関数: `calcHealAmount`（`CALC_HEAL_AMOUNT_HOOKS`）、`isDebufferTier1`（`IS_DEBUFFER_TIER_1_HOOKS`）、`isDebufferTier2`（`IS_DEBUFFER_TIER_2_HOOKS`）、`isAfflictor`（`IS_AFFLICTOR_HOOKS`）

### Step 2: UnitCore.js の作成

1. Unit.js から Category A のコードを `Sources/UnitCore.js` に移動する
2. import 文から Layer 5 への参照（`NodeEnv`, HOOKS, `getSkillLogLevel`）を除外する
3. 保持する import: `LZString`, `ObjectUtil`/`MathUtil`/`ArrayUtil`, `BattleMapElement`, `BattleContext`, `SkillConstants` の定数群, `HeroInfoConstants` の定数群, `UnitConstants` の定数群, `CanNotReachTile`, `DefenceStructureBase`/`OffenceStructureBase`, `Skill.js` の関数群, `LoggerBase`, `GlobalDefinitions`, `ValueDelimiter`
4. すべてのクラスと関数を export する
5. `g_appData` への参照が Category A のメソッドにある場合は、そのまま残す（`g_appData` の ESM モジュール化は Section 07 で対応）

### Step 3: UnitBattle.js の作成

1. Category B のメソッドを `Sources/UnitBattle.js` に移動する
2. `Unit` クラスを `UnitCore.js` から import し、`Unit.prototype` にメソッドを追加する形式にする
3. Layer 5 への参照を含まないことを確認する

```javascript
// UnitBattle.js の構造（概念）
import { Unit } from './UnitCore.js';

// 戦闘関連メソッドを prototype に追加
Unit.prototype.initBattleContext = function(initiatesCombat) { ... };
Unit.prototype.getAtkInCombat = function(enemyUnit = null) { ... };
// ...
```

**注意**: UnitBattle.js は Layer 3 であり、UnitCore.js（同じく Layer 3）を import するのは同一レイヤー内参照として許可される。ただし循環は許可しないため、UnitCore.js は UnitBattle.js を import しない。

### Step 4: UnitSkillEffect.js の作成

1. Category C の全メソッド・関数を `Sources/UnitSkillEffect.js` に移動する
2. Layer 5 への import（`NodeEnv`, HOOKS, `getSkillLogLevel`）をこのファイルに配置する
3. **明示的 init 関数パターン**を採用する:

```javascript
// UnitSkillEffect.js の構造（概念）
import { NodeEnv } from './SkillEffectEnv.js';
import { IS_DEBUFFER_TIER_1_HOOKS, IS_DEBUFFER_TIER_2_HOOKS, IS_AFFLICTOR_HOOKS, CALC_HEAL_AMOUNT_HOOKS } from './SkillEffectHooks.js';
import { getSkillLogLevel } from './SkillEffect.js';
// ... 他の必要な import

/**
 * Unit.prototype にスキル効果関連メソッドを追加する初期化関数。
 * エントリーポイントから明示的に呼び出す必要がある。
 * @param {typeof Unit} UnitClass
 */
export function initUnitSkillEffects(UnitClass) {
    UnitClass.prototype.canActivatePass = function() { ... };
    UnitClass.prototype.endAction = function() { ... };
    // ... Category C の全メソッド
}

// スタンドアロン関数も export
export function calcHealAmount(assistUnit, targetUnit) { ... }
export function isDebufferTier1(attackUnit, targetUnit) { ... }
export function isDebufferTier2(attackUnit, targetUnit) { ... }
export function isAfflictor(attackUnit, lossesInCombat, result) { ... }
```

### Step 5: Unit.js を facade に変更

元の `Unit.js` を、UnitCore.js と UnitBattle.js を import/re-export する facade ファイルに変更する。これにより既存の `import { Unit } from './Unit.js'` が引き続き動作する。

```javascript
// Unit.js (facade)
// UnitCore のすべての export を re-export
export { Unit, AttackableUnitInfo, AttackEvaluationContext, AssistableUnitInfo,
         ActionContext, PrecombatContext, UnitUtil } from './UnitCore.js';
export { isThief, calcArenaBaseStatusScore, calcArenaTotalSpScore,
         canRefreshTo } from './UnitCore.js';

// UnitBattle は prototype 拡張のため import するだけでよい
// ただし副作用 import は避け、明示的な関数にする場合は initUnitBattle も export
import './UnitBattle.js';

// UnitSkillEffect の init 関数と関連関数を re-export
export { initUnitSkillEffects, calcHealAmount, isDebufferTier1,
         isDebufferTier2, isAfflictor } from './UnitSkillEffect.js';
```

**重要**: `UnitBattle.js` は `Unit.prototype` にメソッドを直接追加する形式（トップレベル副作用）を使うか、init 関数パターンを使うかの判断が必要。UnitBattle.js は Layer 3 内の参照のみであるため TDZ リスクは低い。ただし一貫性のため、init 関数パターンを推奨する。その場合:

```javascript
// UnitBattle.js
import { Unit } from './UnitCore.js';

export function initUnitBattle(UnitClass) {
    UnitClass.prototype.initBattleContext = function(...) { ... };
    // ...
}
```

```javascript
// Unit.js (facade)
import { Unit } from './UnitCore.js';
import { initUnitBattle } from './UnitBattle.js';
import { initUnitSkillEffects } from './UnitSkillEffect.js';

initUnitBattle(Unit);
// initUnitSkillEffects は呼ばない - エントリーポイントから呼ぶ

export { Unit, ... } from './UnitCore.js';
export { initUnitSkillEffects, ... } from './UnitSkillEffect.js';
```

### Step 6: エントリーポイントの修正

各シミュレータの Main.js ファイルに `initUnitSkillEffects` の呼び出しを追加する。対象:

- `Sources/ArenaSimulatorMain.js`
- `Sources/AetherRaidSimulatorMain.js`
- `Sources/SummonerDuelsSimulatorMain.js`
- `Sources/UnitBuilderMain.js`
- `Sources/StatusCalcMain.js`
- `Sources/DamageCalculatorMain.js`
- その他のエントリーポイント

```javascript
// 各 Main.js に追加
import { initUnitSkillEffects } from './UnitSkillEffect.js';
import { Unit } from './Unit.js';
initUnitSkillEffects(Unit);
```

### Step 7: 検証

1. `npm test` で既存 500 テストが全パスすることを確認
2. `npx madge --circular Sources/` で Unit.js 関連の循環パスが消えていることを確認
3. UnitCore.js の import 文に Layer 5 ファイルが含まれていないことを確認

## Key Considerations

### g_appData への参照

Unit.js 内の多くのメソッド（約 15 箇所）が `g_appData` をグローバル変数として参照している。Section 07 (AppDataGlobal) が完了するまでは、`g_appData` は `window.g_appData` または既存のグローバル参照のままとする。分割時に `g_appData` を使用するメソッドがどのファイルに配置されるかを正確に把握し、後の Section 07 で import を追加する際に漏れがないようにする。

### private フィールド

Unit クラスは `#hpAddAfterEnteringBattle`、`#statusesAddAfterEnteringBattle`、`#statusEffects` の 3 つの private フィールドを持つ。これらは UnitCore.js に残す必要がある（private フィールドはクラス定義内でのみアクセス可能）。Category C のメソッドがこれらの private フィールドにアクセスする場合、public な accessor メソッドを UnitCore.js に追加するか、対象メソッドを Category A に移動する必要がある。

具体的に確認が必要なメソッド:
- `addStatusEffect()` は `#statusEffects` を操作する可能性が高い → accessor 経由にするか Category A に残す
- `addHpAfterEnteringBattle()` は `#hpAddAfterEnteringBattle` を操作 → 同上
- `addStatusesAfterEnteringBattle()` は `#statusesAddAfterEnteringBattle` を操作 → 同上

**対策**: private フィールドへのアクセスが必要なメソッドについては:
1. UnitCore.js に public accessor メソッド（getter/setter）を追加する
2. または、そのメソッドを Category A（UnitCore.js）に残し、Layer 5 参照部分だけを Category C に分離する

### メソッド間の依存関係

Category C のメソッドが Category A/B のメソッドを呼び出すケースは問題ない（prototype 上に存在する限り `this.someMethod()` で呼べる）。逆に Category A/B のメソッドが Category C のメソッドを呼び出すケースがある場合、init 関数による遅延追加であるため、init 前に呼ばれるとエラーになる。実行時にはエントリーポイントで init 済みであるため問題ないが、テスト時には `initUnitSkillEffects` を事前に呼ぶ必要がある。

## Success Criteria

- `UnitCore.js` が Layer 5（DSL）ファイルを一切 import しない
- `UnitBattle.js` が Layer 5（DSL）ファイルを一切 import しない
- `UnitSkillEffect.js` が Layer 5 末尾として DSL 参照を含むことが許可される
- `Unit` クラスのインスタンスが既存コードで正常に動作する
- `Unit.js`（facade）からの import が後方互換
- 既存テスト 500 件が全パス
- `madge --circular Sources/` で Unit 関連の循環パスが消えている