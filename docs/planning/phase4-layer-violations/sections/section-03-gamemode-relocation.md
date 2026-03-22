I now have complete context. Here is the section content:

# Section 03: GameMode Relocation

## Overview

This section moves the `GameMode` constant object from `DamageCalculator.js` (Layer 4) to `StatusConstants.js` (Layer 1), then updates all consumers to import from the new location. This resolves layer violations where Layer 3 (`BattleMap.js`) and Layer 5/6 (`SkillEffect.js`, `SkillImpl.js`) reference `GameMode` without valid imports.

## Background

`GameMode` is a simple frozen-style enum object defined at the top of `DamageCalculator.js` (Layer 4):

```javascript
const GameMode = {
    AetherRaid: 0,
    Arena: 1,
    AllegianceBattles: 2,
    ResonantBattles: 3,
    TempestTrials: 4,
    PawnsOfLoki: 5,
    SummonerDuels: 6, // 英雄決闘
};
```

It has no dependencies on any other module -- it is purely a set of numeric constants. Its current placement in Layer 4 means files in Layers 1-3 and Layer 5 cannot legally import it. Two files currently reference `GameMode` as a global (without importing it), which would cause `ReferenceError` in strict ESM:

- `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/BattleMap.js` (Layer 3) -- lines 2759, 2878
- `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/SkillImpl.js` (Layer 6) -- line 7956
- `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/SkillEffect.js` (Layer 5) -- lines 4523, 4533

The natural home for `GameMode` is `StatusConstants.js` (Layer 1), which already holds similar enum constants (`StatusIndex`, `StatusEffectType`).

## Dependencies

- **Depends on**: Section 01 (baseline-inventory) -- the violation inventory should be complete before starting
- **Blocked by**: None in terms of code conflicts, but sequential execution after Section 02 is recommended to avoid simultaneous edits to shared files

## Layer Architecture Reference

```
Layer 0 (Base):      GlobalDefinitions, Utilities, Logger, AppDataGlobal
Layer 1 (Constants): SkillConstants, HeroInfoConstants, UnitConstants, StatusConstants
Layer 2 (Models):    Skill, HeroInfo, Tile, Cell, BattleMapElement, Structures, Table
Layer 3 (Entities):  UnitCore, UnitBattle, BattleContext, UnitManager, BattleMap, GlobalBattleContext
Layer 4 (Logic):     DamageCalculator, DamageCalculatorWrapper, Handlers, Databases
Layer 5 (DSL):       SkillEffectCore, SkillEffect, SkillEffectField, SkillEffectUnit, etc.
Layer 6 (Impl):      SkillImpl群, CustomSkill
Layer 7 (App):       AppData, BattleSimulatorBase, VueComponents, DialogUtil, store
Layer 8 (Entry):     ArenaSimulatorMain, StatusCalcMain, 各Main.js
```

---

## Tests (Write First)

Create the following test file before making any code changes.

### File: `/Users/studio/Documents/GitHub/FehBattleSimulator/Tests/GameModeRelocation.test.js`

```javascript
import { describe, it, expect } from 'vitest';

describe('GameMode relocation to StatusConstants.js', () => {
    it('GameMode が StatusConstants.js から正しく export される', async () => {
        const { GameMode } = await import('../Sources/StatusConstants.js');
        expect(GameMode).toBeDefined();
        expect(typeof GameMode).toBe('object');
    });

    it('GameMode の全値が正しい（移動前後で値が一致）', async () => {
        const { GameMode } = await import('../Sources/StatusConstants.js');
        expect(GameMode.AetherRaid).toBe(0);
        expect(GameMode.Arena).toBe(1);
        expect(GameMode.AllegianceBattles).toBe(2);
        expect(GameMode.ResonantBattles).toBe(3);
        expect(GameMode.TempestTrials).toBe(4);
        expect(GameMode.PawnsOfLoki).toBe(5);
        expect(GameMode.SummonerDuels).toBe(6);
    });

    it('DamageCalculator.js が引き続き GameMode を export する（後方互換 re-export）', async () => {
        const { GameMode } = await import('../Sources/DamageCalculator.js');
        expect(GameMode).toBeDefined();
        expect(GameMode.AetherRaid).toBe(0);
        expect(GameMode.SummonerDuels).toBe(6);
    });

    it('GameMode が DamageCalculator.js からの export と StatusConstants.js からの export で同一オブジェクト', async () => {
        const sc = await import('../Sources/StatusConstants.js');
        const dc = await import('../Sources/DamageCalculator.js');
        expect(dc.GameMode).toBe(sc.GameMode);
    });

    it('DamageCalculator.js 内で GameMode が定義されていない（StatusConstants.js からの import のみ）', async () => {
        const fs = await import('fs');
        const path = await import('path');
        const content = fs.readFileSync(
            path.resolve(process.cwd(), 'Sources/DamageCalculator.js'), 'utf-8'
        );
        // GameMode の定義（const GameMode = {）が存在しないことを確認
        const defMatch = content.match(/^\s*const\s+GameMode\s*=/m);
        expect(defMatch).toBeNull();
    });
});
```

**Note on re-export test**: The plan states "re-export は不要（消費者が少ないため即座に全更新可能）". However, `DamageCalculator.js` has 8 direct importers, and `VueComponents.js` uses `GameMode` via Vue global properties set in `BattleSimulatorBase.js`. A temporary re-export from `DamageCalculator.js` is acceptable during transition but should be removed in the same commit once all consumers are updated. The test above verifies the re-export exists for safety; if you choose to skip the re-export entirely and update all consumers at once, remove the re-export tests and keep only the StatusConstants.js tests.

---

## Implementation Steps

### Step 1: Add GameMode to StatusConstants.js

**File**: `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/StatusConstants.js`

Add the `GameMode` object definition near the top of the file (after the existing `StatusIndex` definition is a natural location). Add `GameMode` to the file's export statement on line 356.

The definition to add:

```javascript
const GameMode = {
    AetherRaid: 0,
    Arena: 1,
    AllegianceBattles: 2,
    ResonantBattles: 3,
    TempestTrials: 4,
    PawnsOfLoki: 5,
    SummonerDuels: 6,
};
```

Update the export line (currently line 356) to include `GameMode`:

```javascript
export { StatusEffectType, ..., GameMode };
```

### Step 2: Remove GameMode definition from DamageCalculator.js

**File**: `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/DamageCalculator.js`

- Remove lines 16-24 (the `const GameMode = { ... };` block)
- Add `GameMode` to the imports from `StatusConstants.js`. DamageCalculator.js does not currently import from StatusConstants.js, so either add a new import line or import via `Skill.js` (Layer 2) which re-exports StatusConstants symbols. The cleanest approach is a direct import from StatusConstants.js:

```javascript
import { GameMode } from './StatusConstants.js';
```

- Keep `GameMode` in the existing export statement on line 3001 (it will re-export the imported symbol, maintaining backward compatibility for any consumers you haven't updated yet)

### Step 3: Update all consumer import paths

Update every file that imports `GameMode` from `DamageCalculator.js` to import from `StatusConstants.js` instead. Here is the complete list of files to update:

| File | Layer | Current Import Source | New Import Source |
|------|-------|---------------------|-------------------|
| `Sources/AppData.js` | L7 | `DamageCalculator.js` | `StatusConstants.js` |
| `Sources/BattleSimulatorBase.js` | L7 | `DamageCalculator.js` | `StatusConstants.js` |
| `Sources/DamageCalculatorWrapper.js` | L4 | `DamageCalculator.js` | `StatusConstants.js` |
| `Sources/ArenaSimulatorMain.js` | L8 | `DamageCalculator.js` | `StatusConstants.js` |
| `Sources/SummonerDuelsSimulatorMain.js` | L8 | `DamageCalculator.js` | `StatusConstants.js` |
| `Sources/UnitBuilderMain.js` | L8 | `DamageCalculator.js` | `StatusConstants.js` |
| `Sources/Main_ImageProcessing.js` | L8 | `DamageCalculator.js` | `StatusConstants.js` |
| `Sources/DamageCalculatorMain.js` | L8 | `DamageCalculator.js` | `StatusConstants.js` |

For each file:
1. Remove `GameMode` from the `import { ... } from './DamageCalculator.js'` statement
2. Add `GameMode` to an existing `import { ... } from './StatusConstants.js'` statement, or create a new import line if no StatusConstants import exists

**Examples of typical changes**:

- `AppData.js` line 9: Change `import { GameMode } from './DamageCalculator.js'` to `import { GameMode } from './StatusConstants.js'`
- `DamageCalculatorWrapper.js` line 7: Remove `GameMode` from the DamageCalculator import and add a new line `import { GameMode } from './StatusConstants.js'`
- `DamageCalculatorMain.js` line 15: Remove `GameMode` from the destructured import and add a separate import from StatusConstants.js

### Step 4: Add missing GameMode imports to files that use it as a global

These files reference `GameMode` without any import statement -- they are the actual layer violations:

| File | Layer | Lines Using GameMode | Action |
|------|-------|---------------------|--------|
| `Sources/BattleMap.js` | L3 | 2759, 2878 | Add `import { GameMode } from './StatusConstants.js'` |
| `Sources/SkillEffect.js` | L5 | 4523, 4533 | Add `import { GameMode } from './StatusConstants.js'` (or add to existing StatusConstants import on line 13) |
| `Sources/SkillImpl.js` | L6 | 7956 | Add `import { GameMode } from './StatusConstants.js'` (or add to existing StatusConstants import on line 2) |

For `SkillEffect.js`, line 13 already imports from StatusConstants.js:
```javascript
import { NEGATIVE_STATUS_EFFECT_ORDER_MAP, POSITIVE_STATUS_EFFECT_ORDER_MAP, StatusEffectType, StatusIndex } from './StatusConstants.js';
```
Simply add `GameMode` to this existing import.

For `SkillImpl.js`, line 2 already imports from StatusConstants.js:
```javascript
import { StatusEffectType } from './StatusConstants.js';
```
Add `GameMode` to this existing import.

For `BattleMap.js`, line 9 already imports from StatusConstants.js:
```javascript
import { StatusEffectType } from './StatusConstants.js';
```
Add `GameMode` to this existing import.

### Step 5: Optionally remove re-export from DamageCalculator.js

After all consumers are updated in the same commit, you may remove `GameMode` from the `DamageCalculator.js` export statement (line 3001). This is optional -- keeping the re-export provides backward compatibility but is unnecessary if all consumers are confirmed updated.

If you remove it, also remove the `import { GameMode } from './StatusConstants.js'` added in Step 2, since DamageCalculator.js uses `GameMode` internally (in `setGameMode` method at line 740). Wait -- `DamageCalculator.js` itself uses `GameMode` internally? Let me verify: line 740 shows `setGameMode(gameMode)` which just assigns `this.gameMode = gameMode`, no direct `GameMode` enum reference. Check if DamageCalculator.js uses the `GameMode` constant anywhere in its logic beyond the definition.

Based on the grep results, `DamageCalculator.js` only defines `GameMode` and exports it -- it does not use `GameMode.AetherRaid` etc. internally in any logic. So after moving the definition out:
- If keeping re-export: add `import { GameMode } from './StatusConstants.js'` and keep it in the export
- If removing re-export: remove `GameMode` from the export line entirely and do not add an import for it

**Recommendation**: Remove the re-export entirely since all consumers are being updated in the same commit.

---

## Validation

After completing all steps, verify:

1. **`npm test`** -- all tests pass (including the new `GameModeRelocation.test.js`)
2. **`npx madge --circular Sources/`** -- zero circular dependencies
3. **Grep verification** -- confirm no file imports `GameMode` from `DamageCalculator.js`:
   ```
   grep -r "import.*GameMode.*from.*DamageCalculator" Sources/
   ```
   Should return no results (or only a re-export line if you kept it).
4. **Grep for unimported GameMode** -- confirm no file uses `GameMode` without importing it. Every `.js` file that contains `GameMode.` should also contain an `import` line that includes `GameMode`.

## Commit

All changes should be in a single commit:

```
refactor(phase4): GameModeをDamageCalculator.js(L4)からStatusConstants.js(L1)に移動
```

## Implementation Result

### Deviations from Plan

1. **Re-export removed entirely**: DamageCalculator.jsからの再exportは削除した。DamageCalculator.jsは内部でGameModeを使用していないことを確認済み。全consumerを同一コミットで更新するため、再exportは不要。
2. **テストは3件に削減**: 再exportを行わないため、再exportテスト2件（テスト3, 4）は除外。残り3件で移動の正確性を十分に検証。
3. **GameMode定義はStatusConstants.js末尾に配置**: プランでは「StatusIndex定義の後」を推奨していたが、export文の直前に配置した。機能的に同等。

### Known Coupling (documented for Section 05)

- `VueComponents.js` は Vue グローバルプロパティ経由で `GameMode` を参照（`BattleSimulatorBase.js` で注入）。ESM import ではないためこのセクションではスコープ外。
- HTML テンプレートファイルも同様の Vue グローバルプロパティ機構を使用。

### Validation Results

- `npm test`: 全テスト通過（timeout系の既存flaky testを除く）
- `npx madge --circular Sources/`: 循環依存なし
- `grep import.*GameMode.*DamageCalculator Sources/`: 0件（完全移行済み）

## Files Modified (Actual)

| File | Action |
|------|--------|
| `Sources/StatusConstants.js` | `GameMode` 定義追加、export に追加 |
| `Sources/DamageCalculator.js` | `GameMode` 定義削除、import 削除、export から削除 |
| `Sources/AppData.js` | import 元を StatusConstants.js に変更 |
| `Sources/BattleSimulatorBase.js` | import 元を StatusConstants.js に変更 |
| `Sources/DamageCalculatorWrapper.js` | DamageCalculator import から GameMode 削除、StatusConstants.js から import 追加 |
| `Sources/ArenaSimulatorMain.js` | import 元を StatusConstants.js に変更 |
| `Sources/SummonerDuelsSimulatorMain.js` | import 元を StatusConstants.js に変更 |
| `Sources/UnitBuilderMain.js` | import 元を StatusConstants.js に変更 |
| `Sources/Main_ImageProcessing.js` | import 元を StatusConstants.js に変更 |
| `Sources/DamageCalculatorMain.js` | DamageCalculator import から GameMode 削除、StatusConstants.js から import 追加 |
| `Sources/BattleMap.js` | 既存 StatusConstants import に `GameMode` 追加 |
| `Sources/SkillEffect.js` | 既存 StatusConstants import に `GameMode` 追加 |
| `Sources/SkillImpl.js` | 既存 StatusConstants import に `GameMode` 追加 |
| `Tests/GameModeRelocation.test.js` | 新規テストファイル（3テスト） |