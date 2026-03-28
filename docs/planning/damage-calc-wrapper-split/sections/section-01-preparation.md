# Section 01: Preparation and Verification Infrastructure

## Overview

This section covers Phase 1 of the DamageCalculatorWrapper.js split refactoring. The goal is to establish the verification infrastructure before any code is moved: run baseline tests, perform preflight checks, add the `definePrototypeMethods` helper to the core file, and create a new test file with smoke tests and assertions that will guard correctness throughout the remaining phases.

**No methods are moved in this section.** This is purely preparation work.

## Background

`Sources/combat/DamageCalculatorWrapper.js` is a 17,141-line single-class file containing ~170 methods. The refactoring will split it into a core file plus 5 satellite files using prototype extension. This section creates the foundation that all subsequent sections depend on.

### Key Technical Facts (from preflight analysis)

1. **No file-scope variables**: The file contains only `class DamageCalculatorWrapper { ... }` (line 2 to line 17141). No `const`, `let`, `var`, or standalone functions exist outside the class body. This means satellite files will not need access to file-local variables.

2. **`#` private fields/methods exist**: The following private members use `#` syntax and MUST remain in the core file (they cannot be accessed from prototype extensions):
   - `#initBattleContext` (line 412) — called at lines 125, 241, 291
   - `#applySkillEffectsBeforePrecombatSpecial` (line 525) — called at line 522
   - `#calcFixedAddDamageForSkill` (line 13086) — called at line 13082

3. **Instantiation sites**: `new DamageCalculatorWrapper(...)` appears in:
   - `Sources/TestUtilities.js` (line 110) — `test_DamageCalculator` constructor
   - `Sources/pages/DamageCalculatorMain.js`
   - `Sources/app/BattleSimulatorBase.js`
   All instantiation occurs after all scripts are loaded, so prototype extensions will be available.

4. **Load order systems** (3 systems to update in later sections):
   - `create_tests.sh` — `SOURCE_FILE_NAMES` array (line 29: `combat/DamageCalculatorWrapper`)
   - `Deploy.bat` — file concatenation list (line 21)
   - 5 HTML files: `ArenaSimulator.html`, `AetherRaidSimulator.html`, `DamageCalculator.html`, `UnitBuilder.html`, `SummonerDuelsSimulator.html`

5. **Public methods** (25 non-underscore, non-accessor methods, excluding constructor):
   - `clearLog`, `writeLog`, `writeDebugLog`
   - `updateDamageCalculation`, `calcDamageTemporary`, `calcDamage`
   - `calcPreCombatResult`, `calcPrecombatSpecialDamage`, `calcPrecombatSpecialResult`, `calcCombatResult`
   - `applyBeastCavalryRefinedSkillEffect`
   - `addFixedDamageByStatus`, `applyFixedValueSkill`, `applyDamageReductionByOwnStatus`
   - `canCounterAttack`, `getFollowupAttackPriorityForBoth`
   - `enumerateUnitsInTheSameGroupWithinSpecifiedSpaces`, `enumerateUnitsInDifferentGroupWithinSpecifiedSpaces`, `enumerateUnitsInTheSameGroupOnMap`, `enumerateUnitsInDifferentGroupOnMap`
   - `updateAllUnitSpur`, `updateUnitSpur`
   - `applySkillEffectsAfterAfterBeginningOfCombat`, `applySkillEffectsAfterAfterBeginningOfCombatFromAllies`, `applySkillEffectAfterConditionDetermined`

6. **Property accessors** (7 getters, 1 setter):
   - Getters: `log`, `simpleLog`, `currentTurn`, `isOddTurn`, `isEvenTurn`, `isLogEnabled`, `unitManager`
   - Setter: `isLogEnabled`

## Dependencies

- None. This is the first section and has no prerequisites.

## Outputs

This section produces two changes:

1. **Modified file**: `Sources/combat/DamageCalculatorWrapper.js` — add `definePrototypeMethods` static method after the class closing brace
2. **New file**: `Tests/DamageCalculatorWrapperSplit.test.js` — test file for split verification
3. **Modified file**: `create_tests.sh` — add test file to `TEST_FILE_NAMES`

---

## Step 1: Tests FIRST

Create `/Users/studio/Documents/GitHub/FehBattleSimulator/Tests/DamageCalculatorWrapperSplit.test.js` with the following test structure.

### Test File Structure

```javascript
// DamageCalculatorWrapper 分割リファクタリング検証テスト

describe('DamageCalculatorWrapper split verification', () => {

    // --- definePrototypeMethods ヘルパー ---

    describe('definePrototypeMethods helper', () => {
        test('definePrototypeMethods でメソッドを追加するとインスタンスから呼び出せる', () => {
            // Add a test method via definePrototypeMethods, create instance, call it
            // Use a unique name to avoid collision (e.g., '__test_defineProto_callable')
            // Clean up after test with delete DamageCalculatorWrapper.prototype[name]
        });

        test('追加されたメソッドが non-enumerable である', () => {
            // Add method, verify Object.keys(DamageCalculatorWrapper.prototype) does not include it
            // Clean up after test
        });

        test('同名メソッドを二重に追加すると Error がスローされる', () => {
            // Add method once, then expect(() => add again).toThrow('Duplicate prototype method')
            // Clean up after test
        });
    });

    // --- constructor smoke test ---

    describe('constructor smoke test', () => {
        test('DamageCalculatorWrapper がエラーなくインスタンス化できる', () => {
            // Use test_DamageCalculator pattern (already sets up dependencies)
            // Verify instance is created without throwing
        });

        test('インスタンスが内部オブジェクトを保持している', () => {
            // Verify _damageCalc, _combatHander, profiler exist on instance
        });
    });

    // --- public API names assertion ---

    describe('public API names assertion', () => {
        test('DamageCalculatorWrapper.prototype が全 public メソッド名を持つ', () => {
            // Define the expected list of 25 public method names + 7 getters + 1 setter
            // For each, verify typeof instance[name] === 'function' or property exists
            const expectedPublicMethods = [
                'clearLog', 'writeLog', 'writeDebugLog',
                'updateDamageCalculation', 'calcDamageTemporary', 'calcDamage',
                'calcPreCombatResult', 'calcPrecombatSpecialDamage',
                'calcPrecombatSpecialResult', 'calcCombatResult',
                'applyBeastCavalryRefinedSkillEffect',
                'addFixedDamageByStatus', 'applyFixedValueSkill',
                'applyDamageReductionByOwnStatus',
                'canCounterAttack', 'getFollowupAttackPriorityForBoth',
                'enumerateUnitsInTheSameGroupWithinSpecifiedSpaces',
                'enumerateUnitsInDifferentGroupWithinSpecifiedSpaces',
                'enumerateUnitsInTheSameGroupOnMap',
                'enumerateUnitsInDifferentGroupOnMap',
                'updateAllUnitSpur', 'updateUnitSpur',
                'applySkillEffectsAfterAfterBeginningOfCombat',
                'applySkillEffectsAfterAfterBeginningOfCombatFromAllies',
                'applySkillEffectAfterConditionDetermined',
            ];
            // For each name: expect(typeof DamageCalculatorWrapper.prototype[name]).toBe('function');
        });
    });
});
```

**Notes on test implementation**:
- The `definePrototypeMethods` tests should add methods with unique names and clean up with `delete` after each test to avoid polluting the prototype.
- The constructor smoke test can reuse the existing `test_DamageCalculator` helper class from `Sources/TestUtilities.js` which already handles all dependency setup.
- The public API names list is the authoritative reference and will be used in Phase 6 final verification to ensure no methods were lost.

### Register the test file

In `/Users/studio/Documents/GitHub/FehBattleSimulator/create_tests.sh`, add `DamageCalculatorWrapperSplit` to the `TEST_FILE_NAMES` array (after `UnitUtility` or at the end of the list).

---

## Step 2: Add `definePrototypeMethods` Helper

In `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/combat/DamageCalculatorWrapper.js`, add the following static method **immediately after** the class closing brace (line 17141 `}`):

```javascript
DamageCalculatorWrapper.definePrototypeMethods = function(methods) {
    for (const [name, fn] of Object.entries(methods)) {
        if (Object.prototype.hasOwnProperty.call(DamageCalculatorWrapper.prototype, name)) {
            throw new Error(`Duplicate prototype method: ${name}`);
        }
        Object.defineProperty(DamageCalculatorWrapper.prototype, name, {
            value: fn,
            writable: true,
            configurable: true,
            enumerable: false,
        });
    }
};
```

This helper:
- Takes an object of `{ methodName: function }` entries
- Adds each as a non-enumerable property on `DamageCalculatorWrapper.prototype` (matching class body behavior)
- Throws on duplicate method names to catch copy-paste errors during later phases
- Is defined as a static method on the constructor function (not on prototype)

---

## Step 3: Verify

1. Run `./run_tests.sh` and confirm all existing tests pass (baseline).
2. Run the new `DamageCalculatorWrapperSplit.test.js` tests and confirm they pass.
3. Confirm ESLint passes.

---

## Commit

All changes in this section (test file creation, `definePrototypeMethods` addition, `create_tests.sh` update) should be committed as a single commit following the project's Conventional Commits format.

---

## Files Modified/Created

| File | Action |
|------|--------|
| `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/combat/DamageCalculatorWrapper.js` | Append `definePrototypeMethods` after class closing brace |
| `/Users/studio/Documents/GitHub/FehBattleSimulator/Tests/DamageCalculatorWrapperSplit.test.js` | Create new test file |
| `/Users/studio/Documents/GitHub/FehBattleSimulator/create_tests.sh` | Add `DamageCalculatorWrapperSplit` to `TEST_FILE_NAMES` |

## Implementation Notes

- All 3 planned files were created/modified as specified.
- Code review identified missing getter/setter verification in public API test — added test for 7 getters + 1 setter using `Object.getOwnPropertyDescriptor`.
- Final test count: 7 new tests (3 definePrototypeMethods + 2 constructor smoke + 1 method assertion + 1 getter/setter assertion), total 319 passing.

## Preflight Findings Summary

These findings are documented here for use by subsequent sections:

| Finding | Impact |
|---------|--------|
| No file-scope variables | Safe to split — satellite files need no local variable access |
| 3 `#` private methods exist (`#initBattleContext`, `#applySkillEffectsBeforePrecombatSpecial`, `#calcFixedAddDamageForSkill`) | These MUST stay in core file; cannot be moved to prototype extensions |
| All instantiation happens after full script load | Prototype extensions will be registered before any constructor call |
| 5 HTML files + Deploy.bat + create_tests.sh need load order updates | Sections 02-05 must update all 7 locations when adding satellite files |