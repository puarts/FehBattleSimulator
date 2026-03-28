# Section 04: Spur系の分離 (`DamageCalculatorWrapper_Spur.js`)

## Overview

This section covers Phase 4 of the DamageCalculatorWrapper split plan. A new file `Sources/combat/DamageCalculatorWrapper_Spur.js` is created, and all Spur-related methods are moved from `DamageCalculatorWrapper.js` into it using the `definePrototypeMethods` prototype extension pattern.

**Prerequisite**: Section 03 (ApplySkillEffects split) must be completed first, as this section modifies the same files (DamageCalculatorWrapper.js, create_tests.sh, Deploy.bat).

## Background

The Spur system in FEH handles combat-time stat buffs from allies, enemies, and various skill effects. These methods are called from `calcCombatResult` in the core file at several points during combat calculation:

- Line 569-570: `updateUnitSpur` (Spur update for both units)
- Line 585-587: `__applySpursFromAllies` / `__applySpursFromEnemies`
- Line 628-645: `__applySpurForUnitAfterCombatStatusFixed` / `__applySpursFromAlliesAfterCombatStatusFixedSkills`
- Line 695-697: `__applyPotentSkillEffect` / `__applyPotentSkillEffectFromAllies`

All these call sites remain in the core file. The methods themselves are moved to the new file and resolved at runtime through the prototype chain.

## Tests

All tests go in `Tests/DamageCalculatorWrapperSplit.test.js` (created in Section 01, registered in `create_tests.sh`).

### Test: Method existence confirmation

```javascript
describe('Phase 4: Spur split', () => {
    test('updateAllUnitSpur がインスタンスメソッドとして存在し呼び出せること', () => {
        // Verify updateAllUnitSpur exists on DamageCalculatorWrapper.prototype
        expect(typeof DamageCalculatorWrapper.prototype.updateAllUnitSpur).toBe('function');
    });

    test('updateUnitSpur がインスタンスメソッドとして存在し呼び出せること', () => {
        expect(typeof DamageCalculatorWrapper.prototype.updateUnitSpur).toBe('function');
    });

    test('__updateUnitSpur がインスタンスメソッドとして存在すること', () => {
        expect(typeof DamageCalculatorWrapper.prototype.__updateUnitSpur).toBe('function');
    });
});
```

### Test: Existing tests pass

After completing this section, run `./run_tests.sh` and confirm all existing tests (including `DamageCalculator.test.js` and `CombatFlow.test.js`) pass with zero failures. ESLint must also pass.

## Implementation Steps

### Step 1: Create `Sources/combat/DamageCalculatorWrapper_Spur.js`

Create the new file with the load guard and `definePrototypeMethods` wrapper:

```javascript
if (typeof DamageCalculatorWrapper === "undefined") {
    throw new Error("DamageCalculatorWrapper.js must be loaded before this file");
}

DamageCalculatorWrapper.definePrototypeMethods({
    // All Spur methods moved here (see Step 2)
});
```

### Step 2: Move methods from `DamageCalculatorWrapper.js`

Move the following methods (cut from core, paste into `definePrototypeMethods({...})` block). Methods should be listed as comma-separated entries in the object literal. Each method keeps its original body unchanged.

**Spur application methods** (called from `calcCombatResult`):

| Method | Approx. line in original | Size |
|--------|--------------------------|------|
| `__applySpursFromAllies` | 9864 | ~20 lines |
| `__applySpursFromEnemies` | 9891 | ~24 lines |
| `__applySpursFromAlliesAfterCombatStatusFixedSkills` | 9922 | ~880 lines |
| `__applySpurForUnitAfterCombatStatusFixed` | 10806 | ~786 lines |

**Bonus/debuff utility methods**:

| Method | Approx. line in original | Size |
|--------|--------------------------|------|
| `__applyBonusReversals` | 11594 | ~13 lines |
| `__applyPotent` | 11609 | ~15 lines |
| `__getHighestBuffs` | 11628 | ~17 lines |
| `__getHighestTotalBuff` | 11647 | ~10 lines |
| `__applyBuffAbsorption` | 11658 | ~8 lines |
| `__applyDebuffReverse` | 11667 | ~8 lines |
| `__applySabotage` | 11676 | ~4 lines |
| `__maxDebuffsFromAlliesWithinSpecificSpaces` | 11683 | ~14 lines |

**Potent skill effect methods**:

| Method | Approx. line in original | Size |
|--------|--------------------------|------|
| `__applyPotentSkillEffect` | 14549 | ~8 lines |
| `__applyPotentSkillEffectFromAllies` | 14565 | ~20 lines |

**Spur update methods**:

| Method | Approx. line in original | Size |
|--------|--------------------------|------|
| `updateAllUnitSpur` | 15843 | ~5 lines |
| `updateUnitSpur` | 15855 | ~6 lines |
| `__updateUnitSpur` | 15868 | ~90+ lines (core dispatch) |
| `__updateUnitSpurFromAllies` | 16827 | ~200 lines |
| `__updateUnitSpurFromEnemyAllies` | 16556 | ~270 lines |

**Spur helper methods**:

| Method | Approx. line in original | Size |
|--------|--------------------------|------|
| `__addSpurInRange2` | 15419 | ~260 lines |
| `__addSpurInRange1` | 15679 | ~83 lines |
| `__addSelfSpurInRange1` | 15762 | ~70 lines |
| `__applyFormSkill` | 15831 | ~11 lines |
| `__applyPreUpdateUnitSpurSkillEffects` | 17028 | ~47 lines |

**Total estimated lines moved**: ~2,500 lines

### Step 3: Syntax conversion for `definePrototypeMethods`

When moving methods from the class body into the `definePrototypeMethods({...})` object literal, apply these changes:

1. **Method syntax stays the same**: `methodName(args) { ... }` works in both class body and object literal.
2. **Add commas**: Each method definition must be followed by a comma (object literal entries are comma-separated).
3. **JSDoc comments**: Keep all existing JSDoc comments above each method.
4. **`this` references**: No changes needed. All `this.xxx()` calls resolve via prototype chain at runtime.
5. **`let self = this` in `updateUnitSpur`**: This pattern works correctly -- when the method is called as `instance.updateUnitSpur(...)`, `this` refers to the instance, so `self` captures the correct reference.

### Step 4: Update load order in `create_tests.sh`

In the `SOURCE_FILE_NAMES` array, add `combat/DamageCalculatorWrapper_Spur` after the previously added split files and before `combat/BeginningOfTurnSkillHandler`:

```
combat/DamageCalculatorWrapper
combat/DamageCalculatorWrapper_InitSkillEffectDict_AtkDef   (added in Section 02)
combat/DamageCalculatorWrapper_InitSkillEffectDict_Unit      (added in Section 02)
combat/DamageCalculatorWrapper_ApplySkillEffects             (added in Section 03)
combat/DamageCalculatorWrapper_Spur                          <-- NEW
combat/BeginningOfTurnSkillHandler
```

### Step 5: Update load order in `Deploy.bat`

On line 21 of `Deploy.bat`, the combat files are listed as a comma-separated string. Append `,combat\DamageCalculatorWrapper_Spur` after the previously added split files and before the line break (before `combat\BeginningOfTurnSkillHandler` on the next line):

```
set BF=%BF%,combat\DamageCalculationUtility,combat\DamageCalculator,combat\PostCombatSkillHander,combat\PerformanceProfile,combat\ScopedTileChanger,combat\DamageCalculatorWrapper,combat\DamageCalculatorWrapper_InitSkillEffectDict_AtkDef,combat\DamageCalculatorWrapper_InitSkillEffectDict_Unit,combat\DamageCalculatorWrapper_ApplySkillEffects,combat\DamageCalculatorWrapper_Spur
```

**重要**: `Deploy.bat` には複数の独立した結合リストがある。以下の3箇所すべてに `combat\DamageCalculatorWrapper_Spur` を追加すること:
1. `battle_simulator_filenames` 共通リスト（line 21付近の `set BF=%BF%,...`）
2. `FehUnitBuilder` 個別リスト（line 46付近の `call ...MergeSourcesAndCompress.bat FehUnitBuilder ...`）
3. `FehDamageCalculator` 個別リスト（line 49付近の `call ...MergeSourcesAndCompress.bat FehDamageCalculator ...`）

Section 02 で共通リストのみ更新し個別リストを漏らした経緯があるため、必ず3箇所を確認すること。

### Step 6: Update load order in HTML files

Search for all HTML files that load `DamageCalculatorWrapper` via `loadScripts()` or `<script>` tags. Add `combat/DamageCalculatorWrapper_Spur` in the same position as in the other load systems. Use `Grep` to find all references:

```
grep -r "DamageCalculatorWrapper" Sources/*.html
```

If HTML files use a `loadScripts()` pattern with an array, insert the new file after the previously added split files.

**Note**: Based on the current codebase search, HTML files may not directly reference `DamageCalculatorWrapper` by filename (they may use a different loading mechanism). Verify during implementation.

### Step 7: Verify

1. Run `./run_tests.sh` -- all tests must pass including ESLint.
2. Confirm the new file `Sources/combat/DamageCalculatorWrapper_Spur.js` exists and contains all moved methods.
3. Confirm `DamageCalculatorWrapper.js` no longer contains any of the moved methods.
4. Confirm the Phase 4 method existence tests pass.

## Key Files

| File | Action |
|------|--------|
| `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/combat/DamageCalculatorWrapper_Spur.js` | **Create** -- new file with all Spur methods |
| `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/combat/DamageCalculatorWrapper.js` | **Modify** -- remove Spur methods |
| `/Users/studio/Documents/GitHub/FehBattleSimulator/create_tests.sh` | **Modify** -- add to `SOURCE_FILE_NAMES` |
| `/Users/studio/Documents/GitHub/FehBattleSimulator/Deploy.bat` | **Modify** -- add to file list |
| `/Users/studio/Documents/GitHub/FehBattleSimulator/Tests/DamageCalculatorWrapperSplit.test.js` | **Modify** -- add Phase 4 tests |

## Important Notes

- **Do not move utility methods**: Methods like `__isThereAllyInSpecifiedSpaces`, `__isNear`, `__isInCross`, `__canDisableSkillsFrom`, `enumerateUnitsInTheSameGroupOnMap`, `__countUnit` etc. remain in the core file. Spur methods call these via `this.xxx()` which resolves through the prototype chain.
- **Do not move `applySkillEffectsAfterAfterBeginningOfCombat` or `applySkillEffectsAfterAfterBeginningOfCombatFromAllies`**: These are at lines 17082-17129 and appear adjacent to Spur methods in the file but belong to a different responsibility group (they are combat event hooks, not Spur). They should remain in the core file.
- **Do not move `applySkillEffectAfterConditionDetermined`**: This is at line 17131 and also remains in core.
- **Method boundary verification**: Before cutting methods, verify the exact start and end lines. The line numbers above are approximate and may shift after Sections 02 and 03 have removed earlier methods.
- **Commit**: This entire phase should be a single commit following the convention: `refactor(combat): Spur系メソッドをDamageCalculatorWrapper_Spur.jsに分離`