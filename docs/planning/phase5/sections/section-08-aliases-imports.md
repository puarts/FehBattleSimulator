I now have all the context needed. Let me produce the section content.

# Section 08: SkillEffectAliases.js の ESM import 追加

## 概要

SkillEffectAliases.js（1,774行）は現在 **import文がゼロ** のファイルであり、1,000以上の外部シンボルを暗黙的に参照している。`vitest.setup.js` の `vm.runInThisContext` 連結方式でのみ動作しており、ESM モジュールとして単独評価するとすべての外部シンボルが `ReferenceError` になる。

このセクションでは、SkillEffectAliases.js の先頭に必要な全 import 文を追加し、ESM モジュールとして自立できるようにする。

## 前提条件

- **Section 05（未エクスポートシンボルの対処）** が完了していること。SkillEffectAliases.js が参照するシンボルが定義元ファイルで全て export 済みであること。
- **Section 02-04（SkillEffectUnit.js / SkillEffectField.js の統合と検証）** が完了していること。統合後の SkillEffect.js から必要シンボルが export されていること。

## 対象ファイル

- `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/SkillEffectAliases.js` -- import 文を追加

## テスト (Tests First)

テストファイル: `/Users/studio/Documents/GitHub/FehBattleSimulator/Tests/SkillEffectAliases.test.js`

### テスト1: 動的 import が成功すること

SkillEffectAliases.js を ESM として動的 import し、`ReferenceError` や `SyntaxError` が発生しないことを確認する。1,000以上のシンボルの依存が全て解決されていることの包括的検証となる。

```javascript
import { describe, test, expect } from 'vitest';

describe('SkillEffectAliases ESM import', () => {
    test('dynamic import succeeds without errors', async () => {
        // ReferenceError が出なければ全依存シンボルが解決されている
        const module = await import('../Sources/SkillEffectAliases.js');
        expect(module).toBeDefined();
    });
});
```

### テスト2: 主要な alias 定数が export され import 可能であること

```javascript
test('key alias constants are exported and importable', async () => {
    const { UNITS_ATK_NODE, UNITS_SPD_NODE, FOES_ATK_NODE, FOES_SPD_NODE } =
        await import('../Sources/SkillEffectAliases.js');
    expect(UNITS_ATK_NODE).toBeDefined();
    expect(UNITS_SPD_NODE).toBeDefined();
    expect(FOES_ATK_NODE).toBeDefined();
    expect(FOES_SPD_NODE).toBeDefined();
});
```

### テスト3: alias 定数が undefined でないこと（評価順問題の検出）

モジュール評価時にシンボルが TDZ（Temporal Dead Zone）にかかって `undefined` になっていないことを確認する。

```javascript
test('alias constants are not undefined (detects evaluation order issues)', async () => {
    const mod = await import('../Sources/SkillEffectAliases.js');
    // UNITS_ATK_NODE は StatusIndex.ATK を使って初期化される
    // undefined ならば評価順依存の問題がある
    expect(mod.UNITS_ATK_NODE).not.toBeUndefined();
    expect(mod.UNITS_STAT_NODE).not.toBeUndefined();
    expect(mod.SPD_DIFF_NODE).not.toBeUndefined();
    expect(mod.PERCENTAGE_NODE).not.toBeUndefined();
});
```

## 実装手順

### ステップ1: 使用シンボルの全数調査

SkillEffectAliases.js 内で参照されている全ての外部シンボルを特定し、定義元ファイルにマップする。主要な依存先は以下のとおり:

| 定義元ファイル | 主なシンボル例 | 推定数 |
|---|---|---|
| `SkillEffectCore.js` | `COND_OP`, `IF_NODE`, `IF_ELSE_NODE`, `AND_NODE`, `OR_NODE`, `NOT_NODE`, `GT_NODE`, `GTE_NODE`, `EQ_NODE`, `SUB_NODE`, `ADD_NODE`, `MULT_TRUNC_NODE`, `MULT_CEIL_NODE`, `MULT_NODE`, `SUM_NODE`, `MAX_NODE`, `MIN_NODE`, `INT_PERCENTAGE_NUMBER_NODE`, `APPLY_X_NODE`, `READ_NUM_NODE`, `IF_EXPRESSION_NODE`, `TRUE_NODE`, `SkillEffectNode`, `SKILL_EFFECT_NODE` 等 | 30-50 |
| `SkillEffect.js` | `UnitsNode`, `FILTER_UNITS_NODE`, `COUNT_UNITS_NODE`, `COUNT_IF_UNITS_NODE`, `MAP_UNITS_TO_NUM_NODE`, `MAX_UNITS_NODE`, `MIN_UNITS_NODE`, `FILTER_MAP_UNITS_NODE`, `TARGETS_ALLIES_ON_MAP_NODE`, `TARGETS_CLOSEST_FOES_NODE`, `TargetsClosestFoesWithinNSpacesNode`, `TargetsAndThoseAlliesWithinNSpacesNode`, `FoesMaxHpNode`, `FoesHpDuringCombatNode`, `TARGETS_MAX_HP_NODE`, `TARGETS_HP_DURING_COMBAT_NODE`, `FOR_FOE_NODE`, `FOR_TARGET_NODE`, `ASSIST_TARGETING_NODE`, `ASSIST_TARGET_NODE`, `IS_IN_COMBAT_PHASE_NODE`, `IsTargetMoveTypeNode`, `IsTargetBeastOrDragonTypeNode`, `DOES_TARGET_INITIATE_COMBAT_NODE`, `DOES_FOE_INITIATE_COMBAT_NODE`, `HAS_TARGET_ATTACKED_NODE`, `HAS_TARGET_BEEN_ATTACKED_NODE`, `SKILL_OWNERS_ALLIES_ON_MAP_NODE`, `SKILL_OWNERS_FOES_ON_MAP_NODE`, `FOE_AND_FOES_ALLIES_ON_MAP_NODE`, `SKILL_OWNER_AND_SKILL_OWNERS_ALLIES_ON_MAP_NODE`, `ARE_TARGET_AND_SKILL_OWNER_PARTNERS_NODE` 等 | 200+ |
| `SkillEffectBattleContext.js` | `UNITS_STAT_DURING_COMBAT_NODE`, `UNITS_STAT_AT_START_OF_COMBAT_NODE`, `FOES_STAT_DURING_COMBAT_NODE`, `FOES_STAT_AT_START_OF_COMBAT_NODE`, `UNITS_EVAL_SPD_DURING_COMBAT_NODE`, `REDUCES_DAMAGE_EXCLUDING_AOE_SPECIALS_NODE`, `REDUCES_DAMAGE_BEFORE_COMBAT_NODE`, `FOE_CANNOT_TRIGGER_ATTACKER_SPECIAL`, `FOE_CANNOT_TRIGGER_DEFENDER_SPECIAL`, `UNIT_CANNOT_TRIGGER_ATTACKER_SPECIAL`, `UNIT_CANNOT_TRIGGER_DEFENDER_SPECIAL`, `UNITS_CURRENT_SPECIAL_COOLDOWN_COUNT_DURING_COMBAT`, `TargetsSpecialCountAtStartOfTurnNode`, `TargetsMaxSpecialCountNode`, `GrantsSpecialCooldownCountMinusOnTargetAtStartOfTurnNode`, `FoesRangeNode`, `IsTargetWithinNSpacesOfAssistTargetingNode`, `IsTargetWithinNSpacesOfAssistTargetNode` 等 | 100+ |
| `SkillEffectHooks.js` | `FOR_ALLIES_GRANTS_STATS_PLUS_TO_ALLIES_DURING_COMBAT_HOOKS`, `FOR_ALLIES_AT_START_OF_COMBAT_HOOKS`, その他のフック定数 | 20-50 |
| `StatusConstants.js` | `StatusIndex`, `StatusEffectType` | 2-5 |
| `Tile.js` | `DivineVeinType` | 1 |
| `HeroInfoConstants.js` | `MoveType` | 1 |
| `SkillConstants.js` | `SKILL_ID_TO_STYLE_TYPE` | 1 |
| `SkillEffectEnv.js` | 必要に応じて | 少数 |

**調査方法**: ファイル内で使用されているが `const`/`let`/`var`/`function`/`class` で定義されていないシンボルを全て列挙する。grep や AST 解析で網羅的に特定する。

### ステップ2: import 文の追加

SkillEffectAliases.js の先頭（1行目の前）に、定義元ファイルごとにグループ化した import 文を追加する。import ブロックは 50-100行程度になることが予想される。

import 文の構成例（実際のシンボル名は調査結果に基づく）:

```javascript
import { COND_OP, IF_NODE, IF_ELSE_NODE, AND_NODE, OR_NODE, NOT_NODE,
         GT_NODE, GTE_NODE, EQ_NODE, SUB_NODE, ADD_NODE, /* ... */
         SKILL_EFFECT_NODE, TRUE_NODE, IF_EXPRESSION_NODE,
} from './SkillEffectCore.js';

import { UnitsNode, FILTER_UNITS_NODE, COUNT_UNITS_NODE,
         /* ... 多数のシンボル ... */
         IS_IN_COMBAT_PHASE_NODE, IsTargetMoveTypeNode,
} from './SkillEffect.js';

import { UNITS_STAT_DURING_COMBAT_NODE, UNITS_STAT_AT_START_OF_COMBAT_NODE,
         /* ... */
         FOE_CANNOT_TRIGGER_ATTACKER_SPECIAL,
} from './SkillEffectBattleContext.js';

import { FOR_ALLIES_GRANTS_STATS_PLUS_TO_ALLIES_DURING_COMBAT_HOOKS,
         FOR_ALLIES_AT_START_OF_COMBAT_HOOKS,
         /* ... */
} from './SkillEffectHooks.js';

import { StatusIndex } from './StatusConstants.js';
import { DivineVeinType } from './Tile.js';
import { MoveType } from './HeroInfoConstants.js';
import { SKILL_ID_TO_STYLE_TYPE } from './SkillConstants.js';
```

**重要な注意点**:
- import するシンボルは定義元ファイルの export 文に存在することを確認する。存在しない場合は Section 05 の対処漏れであり、定義元に export を追加する。
- 1行あたりの import シンボル数が多い場合は可読性のため複数行に分割する。
- import 元は必ず `.js` 拡張子を付ける（ESM 準拠）。

### ステップ3: 循環依存チェック

import 追加後に新たな循環依存が発生しないことを確認する:

```bash
npx madge --circular /Users/studio/Documents/GitHub/FehBattleSimulator/Sources/
```

SkillEffectAliases.js は SkillEffect* モジュール群の中で「最も上流」に位置するファイル（他の多くのファイルに依存する）であるため、逆方向の依存（SkillEffectCore.js や SkillEffect.js が SkillEffectAliases.js に依存）がないことを確認する。

現状、以下のファイルが SkillEffectAliases.js から import している:
- `SkillEffectRegistrar.js` -- `SKILL_OWNERS_ALLIES_ON_MAP_NODE`
- `SkillEffectBattleContext.js` -- `PERCENTAGE_NODE`
- `CustomSkill.js` -- 複数シンボル

これらの依存方向は「SkillEffectAliases.js を上流として参照する」方向であり、SkillEffectAliases.js 自体がこれらのファイルに依存しなければ循環は発生しない。ただし `SkillEffectBattleContext.js` については SkillEffectAliases.js もシンボルを参照しているため、双方向依存（循環）になる可能性がある。

**循環が発生した場合の対策**:
- `PERCENTAGE_NODE` が SkillEffectBattleContext.js から SkillEffectAliases.js に import されている一方、SkillEffectAliases.js が SkillEffectBattleContext.js のシンボルを使用している場合、循環が発生する。
- 対策: `PERCENTAGE_NODE` を SkillEffectAliases.js から SkillEffect.js 等のより下層のファイルに移動するか、ESM の循環 import が実行時に問題を起こさないか確認する（ESM は循環自体は許容するが、初期化順に注意が必要）。
- madge で検出された循環が既存のものか新規のものかを確認し、新規の場合のみ対処する。

### ステップ4: 動作確認

テストを実行して import 追加が正しいことを確認する:

```bash
cd /Users/studio/Documents/GitHub/FehBattleSimulator && npm test
```

## 作業量の見積もり

SkillEffectAliases.js は 1,774行のファイルで import がゼロであるため、Phase 5 の import 追加作業の中で最大のタスクとなる。推定 import 行数は 50-100行、参照シンボル数は数百に上る。

実装のアプローチとしては:
1. ファイル全体をスキャンして使用されている外部シンボルのユニークリストを作成する
2. 各シンボルの定義元ファイルを特定する（`export` 文を grep で検索）
3. 定義元ファイルごとに import 文をまとめて記述する
4. テストで動的 import が成功することを確認する

## 実装結果

### 追加変更（プランからの逸脱）

1. **vitest.setup.js の filterImportExport を更新**: 複数行 import ブロックに対応するよう修正。元の実装は `^import ` で始まる単一行のみをフィルタしていたため、複数行 import を追加すると SyntaxError が発生した。
2. **PERCENTAGE_NODE を SkillEffect.js に移動**: SkillEffectAliases.js ↔ SkillEffectBattleContext.js の循環依存を解消するため。プランのステップ3で予告されていた対策を実施。
3. **g_appData を AppDataGlobal.js からインポート**: AppData.js → BattleSimulatorBase.js → CustomSkill.js → SkillEffectAliases.js の循環を回避。AppDataGlobal.js は依存ゼロの Layer 0 モジュール。
4. **StatusIndex / StatusEffectType を StatusConstants.js からインポート**: プランでは Skill.js（再エクスポート元）と記載されていたが、レビューにより正規の定義元である StatusConstants.js に変更。

### 実装済みファイル

- `Sources/SkillEffectAliases.js` — 240行の import ブロックを追加（12ソースファイルから約350シンボル）
- `Sources/SkillEffect.js` — PERCENTAGE_NODE の定義を追加（循環依存解消）
- `Sources/SkillEffectBattleContext.js` — PERCENTAGE_NODE のインポート元を SkillEffect.js に変更
- `vitest.setup.js` — filterImportExport を複数行 import 対応に更新
- `Tests/SkillEffectAliases.test.js` — 3テスト（動的インポート、主要エクスポート、評価順検証）

### テスト結果

- 48/49 テストファイル合格（唯一の失敗は既存の DamageCalculator タイムアウト）
- 循環依存 0（madge 検出）

## vitest.setup.js との過渡期の互換性

import 追加後も、Section 12（連結方式廃止）までは `vitest.setup.js` の `filterImportExport` が動作している。`filterImportExport` は `import` 文と `export` 文を除去してからコードを評価するため、import 追加自体は過渡期の動作を壊さない。filterImportExport は複数行 import にも対応済み。