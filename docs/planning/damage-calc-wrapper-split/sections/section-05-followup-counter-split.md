# Section 5: Followup and Counter Split

## Overview

This section implements Phase 5 of the DamageCalculatorWrapper.js split plan. It creates `DamageCalculatorWrapper_FollowupAndCounter.js` to hold all followup attack, counter attack, damage reduction, and fixed damage methods. These are extracted from the core `DamageCalculatorWrapper.js` using the `definePrototypeMethods` pattern established in Section 1.

**Depends on**: Sections 01 through 04 must be completed first. Section 01 adds the `definePrototypeMethods` helper and test infrastructure. Sections 02-04 have already removed other method groups from the core file, so line numbers in the current file will differ from those in the original plan.

**Actual lines moved**: ~1379 lines (new file). Note: `__calcFixedAddDamage` and `#calcFixedAddDamageForSkill` (~590 lines) remain in core due to `#` private constraints.

**Implementation status**: Complete. All 341 tests pass.

---

## Note: Fixed Damage Methods Staying in Core

`__calcFixedAddDamage` calls `this.#calcFixedAddDamageForSkill`, which is a `#` private class method. JavaScript `#` private fields are lexically scoped to the class body and **cannot** be accessed from prototype extensions. Renaming `#` to `__` would violate the "ロジック変更ゼロ" principle.

**Resolution**: `__calcFixedAddDamage` and `#calcFixedAddDamageForSkill` both remain in the core file. They are NOT moved to this split file. This reduces the estimated lines moved by ~590 lines.

---

## Tests

Add the following tests to `Tests/DamageCalculatorWrapperSplit.test.js` (the test file created in Section 01).

### Test: Method existence for followup and counter

```javascript
describe('Phase 5: FollowupAndCounter split', () => {
    test('canCounterAttack exists as instance method (public API)', () => {
        expect(typeof DamageCalculatorWrapper.prototype.canCounterAttack).toBe('function');
    });

    test('getFollowupAttackPriorityForBoth exists as instance method (public API)', () => {
        expect(typeof DamageCalculatorWrapper.prototype.getFollowupAttackPriorityForBoth).toBe('function');
    });

    test('followup/counter private methods exist on prototype', () => {
        const privateMethodNames = [
            '__examinesCanFollowupAttack',
            '__examinesCanFollowupAttackForAttacker',
            '__examinesCanFollowupAttackForDefender',
            '__examinesCanCounterattackBasically',
            '__canDisableCounterAttack',
            '__applyDamageReductionRatio',
            '__getDamageReductionRatio',
            '__applyDamageReductionRatioBySpecial',
            '__calcFixedSpecialAddDamage',
        ];
        for (const name of privateMethodNames) {
            expect(typeof DamageCalculatorWrapper.prototype[name]).toBe('function');
        }
    });
});
```

### Test: Existing tests pass

All existing tests in `DamageCalculator.test.js` and `CombatFlow.test.js` must continue to pass. No new integration tests are needed beyond the method existence checks above -- the existing test suite exercises these methods indirectly through `calcCombatResult`.

### Test: Full suite

Run `./run_tests.sh` to confirm all tests and ESLint pass.

---

## Implementation Steps

### Step 1: Create the new file

Create `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/combat/DamageCalculatorWrapper_FollowupAndCounter.js` with the following structure:

```javascript
if (typeof DamageCalculatorWrapper === "undefined") {
    throw new Error("DamageCalculatorWrapper.js must be loaded before this file");
}

DamageCalculatorWrapper.definePrototypeMethods({
    // Methods moved from DamageCalculatorWrapper.js
    // (paste each method body here, removing the leading indentation level)
});
```

### Step 2: Move methods into the new file

Move the following methods from `DamageCalculatorWrapper.js` into `definePrototypeMethods({...})` in the new file. Remove them from the core file after pasting. The method bodies are unchanged -- only the wrapping structure changes.

**Followup judgment methods:**

| Method | Approximate current line | Lines |
|--------|------------------------|-------|
| `__examinesCanFollowupAttack` | 13695 | 16 |
| `__examinesCanFollowupAttackForAttacker` | 13724 | 88 |
| `__examinesCanFollowupAttackForDefender` | 13820 | 167 |
| `getFollowupAttackPriorityForBoth` | 14288 | 196 |

**Counter attack judgment methods:**

| Method | Approximate current line | Lines |
|--------|------------------------|-------|
| `canCounterAttack` | 13987 | 4 |
| `__canDisableCounterAttack` | 13993 | 194 |
| `__examinesCanCounterattackBasically` | 14197 | 84 |

**Damage reduction methods:**

| Method | Approximate current line | Lines |
|--------|------------------------|-------|
| `__getDamageReductionRatio` | 12696 | 332 |
| `__applyDamageReductionRatio` | 13028 | 25 |
| `__applyDamageReductionRatioBySpecial` | 14492 | 57 |

**Fixed damage methods:**

| Method | Approximate current line | Lines |
|--------|------------------------|-------|
| `__calcFixedSpecialAddDamage` | 9434 | ~180 |

**Note**: `__calcFixedAddDamage` and `#calcFixedAddDamageForSkill` remain in core because `#calcFixedAddDamageForSkill` uses `#` private syntax which cannot be accessed from prototype extensions.

**Important notes on what stays in the core file:**

- `__calcFixedAddDamage` + `#calcFixedAddDamageForSkill` -- stay in core due to `#` private constraint
- `__logSpdInCombat` (line 13712, 4 lines) -- core logging utility, resolves via prototype chain
- `static canActivateBreakerSkill` (line 14484) -- static method, stays in core
- `static __getAtk`, `__getSpd`, `__getDef`, `__getRes`, `__calcAddDamageForDiffOfNPercent` -- static methods stay in core
- `__applySkillEffectForPrecombatAndCombat` (line 13053) -- stays in core (skill effect hub method)

### Step 3: Verify method syntax in the new file

Inside `definePrototypeMethods({...})`, methods use object method shorthand:

```javascript
DamageCalculatorWrapper.definePrototypeMethods({
    __examinesCanFollowupAttack(atkUnit, defUnit) {
        // ... method body unchanged ...
    },

    canCounterAttack(atkUnit, defUnit, calcPotentialDamage = true, damageType = DamageType.PotentialDamage) {
        // ... method body unchanged ...
    },

    // ... etc ...
});
```

Each method is separated by a comma. JSDoc comments and inline comments should be preserved as-is.

### Step 4: Update load order in all 3 systems

The new file must be loaded **after** `DamageCalculatorWrapper.js` (and after the other split files from sections 02-04) but **before** `BeginningOfTurnSkillHandler.js`.

The fixed load order for all split files is:

```
combat/DamageCalculatorWrapper
combat/DamageCalculatorWrapper_InitSkillEffectDict_AtkDef
combat/DamageCalculatorWrapper_InitSkillEffectDict_Unit
combat/DamageCalculatorWrapper_ApplySkillEffects
combat/DamageCalculatorWrapper_Spur
combat/DamageCalculatorWrapper_FollowupAndCounter          ← ADD THIS
```

**Files to update:**

1. **`/Users/studio/Documents/GitHub/FehBattleSimulator/create_tests.sh`**: Add `combat/DamageCalculatorWrapper_FollowupAndCounter` to the `SOURCE_FILE_NAMES` array, immediately after `combat/DamageCalculatorWrapper_Spur` (which was added in section 04).

2. **`/Users/studio/Documents/GitHub/FehBattleSimulator/Deploy.bat`**: Add the file to the concatenation list in the same relative position. **重要**: `Deploy.bat` には複数の独立した結合リストがある。以下の3箇所すべてに追加すること:
   - `battle_simulator_filenames` 共通リスト（line 21付近の `set BF=%BF%,...`）
   - `FehUnitBuilder` 個別リスト（line 46付近の `call ...MergeSourcesAndCompress.bat FehUnitBuilder ...`）
   - `FehDamageCalculator` 個別リスト（line 49付近の `call ...MergeSourcesAndCompress.bat FehDamageCalculator ...`）

3. **All HTML files** that load scripts. Use `Grep` to find all HTML files referencing `DamageCalculatorWrapper`:
   - `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/ArenaSimulator.html`
   - `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/AetherRaidSimulator.html`
   - `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/SummonerDuelsSimulator.html`
   - `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/UnitBuilder.html`
   - `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/DamageCalculator.html`

   In each HTML file, add the new script entry after `DamageCalculatorWrapper_Spur` in the `loadScripts()` call or script list.

4. **Other files updated**: `run_simple_test.sh` and `MergeTests.bat` were updated with all split files from sections 02-05. These had been missed in prior sections; updated here per code review feedback to keep all test entry points in sync.

### Step 5: Run tests

```bash
cd /Users/studio/Documents/GitHub/FehBattleSimulator && ./run_tests.sh
```

All tests must pass, including:
- The new Phase 5 method existence tests
- All existing `DamageCalculator.test.js` tests (exercises `calcCombatResult` which calls followup/counter/damage reduction)
- All existing `CombatFlow.test.js` tests
- ESLint

---

## Cross-cutting Dependencies

Methods in this file call the following methods that remain in the core file or other split files. All resolve at runtime via the prototype chain:

- **Core utilities**: `__isThereAllyInSpecifiedSpaces`, `__isThereAllyIn2Spaces`, `__isSolo`, `enumerateUnitsInTheSameGroupOnMap`, `__canDisableSkillsFrom`
- **Core logging**: `__writeDamageCalcDebugLog`, `__logSpdInCombat`, `isLogEnabled` (property)
- **Core statics**: `DamageCalculatorWrapper.__getAtk/Spd/Def/Res`, `DamageCalculatorWrapper.__calcAddDamageForDiffOfNPercent`, `DamageCalculatorWrapper.canActivateBreakerSkill`
- **Core properties**: `isOddTurn`, `isEvenTurn`, `combatPhase`

Methods in the core file (especially `calcCombatResult`) call the following methods from this new file:
- `canCounterAttack` (line 674 of calcCombatResult)
- `__examinesCanFollowupAttackForAttacker` (line 680)
- `__examinesCanFollowupAttackForDefender` (line 683)
- `__applyDamageReductionRatio` (line 658-659)
- `__applyDamageReductionRatioBySpecial` (line 688-689)
- `__calcFixedAddDamage` (lines 514, 664-665)
- `__calcFixedSpecialAddDamage` (lines 515, 667-668)

All these cross-file calls resolve through the prototype chain at runtime, so no import or forward-declaration is needed.

---

## Commit

After all tests pass, commit with:

```
refactor(combat): 追撃/反撃/ダメージ軽減メソッドをDamageCalculatorWrapper_FollowupAndCounter.jsに分離
```

This commit includes:
- New file: `Sources/combat/DamageCalculatorWrapper_FollowupAndCounter.js`
- Modified: `Sources/combat/DamageCalculatorWrapper.js` (methods removed; `__calcFixedAddDamage` and `#calcFixedAddDamageForSkill` remain in core)
- Modified: `create_tests.sh`, `Deploy.bat`, all HTML files (load order updated)
- Modified: `run_simple_test.sh`, `MergeTests.bat` (all split files from sections 02-05 added)
- Modified: `Tests/DamageCalculatorWrapperSplit.test.js` (Phase 5 tests added)