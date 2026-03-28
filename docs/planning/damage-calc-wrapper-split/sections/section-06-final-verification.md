# Section 06: Final Verification

## Overview

This is the final phase of the DamageCalculatorWrapper.js split refactoring. After all five split files have been created (sections 02-05), this section performs comprehensive verification to confirm that the refactoring is complete and correct. No new source code is written in this section; it is purely a verification and documentation phase.

## Dependencies

- **section-01-preparation**: Provides `definePrototypeMethods` helper and the new test file `Tests/DamageCalculatorWrapperSplit.test.js`
- **section-02-init-dict-split**: Created `DamageCalculatorWrapper_InitSkillEffectDict_AtkDef.js` and `DamageCalculatorWrapper_InitSkillEffectDict_Unit.js`
- **section-03-apply-skill-effects-split**: Created `DamageCalculatorWrapper_ApplySkillEffects.js`
- **section-04-spur-split**: Created `DamageCalculatorWrapper_Spur.js`
- **section-05-followup-counter-split**: Created `DamageCalculatorWrapper_FollowupAndCounter.js`

All five preceding sections must be fully completed before this section begins.

## Expected File Structure After All Splits

After all sections are complete, the following files should exist under `Sources/combat/`:

| File | Approximate Lines | Content |
|------|-------------------|---------|
| `DamageCalculatorWrapper.js` (core) | ~2,500 | Class definition, constructor, public API entry points, calcCombatResult, cross-cutting utilities, definePrototypeMethods helper |
| `DamageCalculatorWrapper_InitSkillEffectDict_AtkDef.js` | ~1,000 | Atk/Def dict init + Special dict init |
| `DamageCalculatorWrapper_InitSkillEffectDict_Unit.js` | ~6,900 | Unit dict init (single large method, exception to 5,000-line guideline) |
| `DamageCalculatorWrapper_ApplySkillEffects.js` | ~3,000 | Skill effect application methods |
| `DamageCalculatorWrapper_Spur.js` | ~2,500 | Spur update/application/helpers |
| `DamageCalculatorWrapper_FollowupAndCounter.js` | ~900 | Followup/counter/damage reduction (`__calcFixedAddDamage` stays in core due to `#` private) |

## Tests

All tests in this section are verification of the final state. They are run, not written, in this phase. The tests were created in section-01-preparation and augmented through sections 02-05.

### Test 1: Public API Names Assertion (Re-run)

This test was created in section-01-preparation in `Tests/DamageCalculatorWrapperSplit.test.js`. It verifies that `DamageCalculatorWrapper.prototype` contains all 36 public method names and that the set of method names is identical before and after the split.

Run this test to confirm no methods were accidentally lost or duplicated across all the split phases:

```
./run_tests.sh --testNamePattern "public API"
```

### Test 2: Full Test Suite Pass

Run the complete test suite to confirm all existing tests pass:

```
./run_tests.sh
```

This executes both Jest tests and ESLint. Every test that passed before the refactoring must still pass. There should be zero test failures and zero ESLint errors.

### Test 3: ESLint Pass

ESLint runs as part of `./run_tests.sh` via `npm test`. Confirm there are no new lint errors introduced by the split files. Each split file should follow the same coding conventions as the original.

### Test 4: Browser Verification (Manual)

This is a manual test that cannot be automated in the Jest/jsdom environment. Open the following HTML files in a browser and verify no console errors appear:

1. **ArenaSimulator.html** (`Sources/ArenaSimulator.html`):
   - Open the file in a browser
   - Open browser DevTools console
   - Confirm no JavaScript errors on page load
   - Execute one combat scenario (any attacker vs any defender)
   - Confirm the combat result displays correctly with no console errors

2. **Combat scenarios to test**:
   - A standard combat (attacker hits, defender counters)
   - A combat involving a followup attack (attacker or defender doubles)
   - A combat involving a unit that cannot counterattack (e.g., ranged vs melee without distant counter)
   - A combat involving a precombat special (AOE special like Blazing Wind)

3. **Other simulator pages** (if they use DamageCalculatorWrapper):
   - `Sources/SummonerDuelsSimulator.html`
   - `Sources/AetherRaidSimulator.html`

## Implementation Steps

### Step 1: Run Full Test Suite

Execute `./run_tests.sh` from the project root `/Users/studio/Documents/GitHub/FehBattleSimulator/`. All tests must pass and ESLint must report no errors.

If any tests fail, investigate whether the failure is related to the split refactoring. Common causes:
- A method was not moved to the correct split file
- A method was accidentally left in both the core file and a split file (definePrototypeMethods will throw a "Duplicate prototype method" error in this case)
- Load order in `create_tests.sh` is incorrect (split files must come after `DamageCalculatorWrapper` and before `BeginningOfTurnSkillHandler`)

### Step 2: Verify File Sizes

Check the line count of each file to confirm they are within the target sizes. Run a line count on all DamageCalculatorWrapper files:

The target is that all files are under 5,000 lines, with the single exception of `DamageCalculatorWrapper_InitSkillEffectDict_Unit.js` which contains the single large method `__init__applySkillEffectForUnitFuncDict` (~6,900 lines). This exception is accepted because further splitting would require cutting inside a method body.

Specifically verify:
- `DamageCalculatorWrapper.js` (core): approximately 2,500 lines (down from the original ~17,141)
- All other split files are within expected ranges per the table above

### Step 3: Verify Load Order in All Three Systems

Confirm that all three load-order systems have been correctly updated with the five new files in the correct order, placed immediately after `DamageCalculatorWrapper.js` and before `BeginningOfTurnSkillHandler.js`:

1. **`create_tests.sh`**: Check the `SOURCE_FILE_NAMES` array for the five new entries
2. **`Deploy.bat`**: `Deploy.bat` には3つの独立した結合リストがある。すべてに5ファイルが含まれていることを確認:
   - `battle_simulator_filenames` 共通リスト（`set BF=%BF%,...`）
   - `FehUnitBuilder` 個別リスト（`call ...MergeSourcesAndCompress.bat FehUnitBuilder ...`）
   - `FehDamageCalculator` 個別リスト（`call ...MergeSourcesAndCompress.bat FehDamageCalculator ...`）
3. **All HTML files**: Search for `DamageCalculatorWrapper` in all HTML files under `Sources/` to find which ones include it in their `loadScripts()` call, then verify each one has the five new files in the correct position

The correct load order for the combat module section is:
```
combat/DamageCalculatorWrapper
combat/DamageCalculatorWrapper_InitSkillEffectDict_AtkDef
combat/DamageCalculatorWrapper_InitSkillEffectDict_Unit
combat/DamageCalculatorWrapper_ApplySkillEffects
combat/DamageCalculatorWrapper_Spur
combat/DamageCalculatorWrapper_FollowupAndCounter
combat/BeginningOfTurnSkillHandler
```

### Step 4: Verify Each Split File Has Load Guard

Each of the five split files must begin with:

```javascript
if (typeof DamageCalculatorWrapper === "undefined") {
    throw new Error("DamageCalculatorWrapper.js must be loaded before this file");
}
```

This guard ensures that if load order is ever misconfigured, the error is caught immediately with a clear message rather than producing cryptic undefined errors.

### Step 5: Verify definePrototypeMethods Wrapping

Each split file should use `DamageCalculatorWrapper.definePrototypeMethods({...})` to attach its methods. Confirm that no split file directly assigns to `DamageCalculatorWrapper.prototype` using other patterns. The `definePrototypeMethods` helper provides duplicate detection, which is critical for safety.

### Step 6: Browser Verification

Perform the manual browser tests described in Test 4 above. This is the only verification step that cannot be automated and must be done by the implementer.

### Step 7: Document Final State

After all verifications pass, record the final file sizes and structure. This serves as a reference for future maintainers. The documentation should include:
- Final line counts for each file
- Confirmation that all tests pass
- Confirmation that browser verification passed
- Any notes about deviations from the original plan

## Checklist

Use this checklist to track completion:

- [ ] `./run_tests.sh` passes (all Jest tests green, ESLint clean)
- [ ] Public API names assertion test passes (36 public methods unchanged)
- [ ] Constructor smoke test passes
- [ ] definePrototypeMethods unit tests pass
- [ ] Core file (`DamageCalculatorWrapper.js`) is approximately 2,500 lines
- [ ] All split files are within expected size ranges
- [ ] `DamageCalculatorWrapper_InitSkillEffectDict_Unit.js` is the only file exceeding 5,000 lines
- [ ] Load order verified in `create_tests.sh`
- [ ] Load order verified in `Deploy.bat`
- [ ] Load order verified in all relevant HTML files
- [ ] All five split files have load guard at top
- [ ] All five split files use `definePrototypeMethods` for method attachment
- [ ] Browser test: ArenaSimulator.html loads without console errors
- [ ] Browser test: Standard combat executes correctly
- [ ] Browser test: Followup attack scenario works
- [ ] Browser test: Counter attack denial scenario works
- [ ] Browser test: Precombat special (AOE) scenario works
- [ ] Final file sizes and verification results documented

## Troubleshooting

If the full test suite fails at this stage, here are common issues and their resolutions:

**"Duplicate prototype method: X" error**: A method named X exists in both the core file and one of the split files. Remove it from one location (it should only exist in the split file, not the core).

**"DamageCalculatorWrapper.js must be loaded before this file" error**: The load order in `create_tests.sh` (or HTML/Deploy.bat) has a split file listed before the core `DamageCalculatorWrapper.js`. Fix the ordering.

**"X is not a function" error during tests**: A method was removed from the core file but not added to any split file. Check which split file should contain method X per the plan in sections 02-05, and ensure it was properly moved there.

**ESLint errors in split files**: The split files must follow the same coding conventions. Common issues include missing semicolons, unused variables (if a variable was only used by methods that stayed in core), or `no-undef` errors if a file-scoped constant from the original file is not accessible.

**Browser console errors but tests pass**: This could indicate a load order issue specific to HTML files that was not reflected in `create_tests.sh`. Compare the HTML load order against the `create_tests.sh` order.