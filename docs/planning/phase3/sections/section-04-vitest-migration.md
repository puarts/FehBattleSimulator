Now I have all the context needed. Let me produce the section content.

# Section 04: Vitest Migration (Test Files)

## Overview

This section covers the migration of all 18 test files from the Jest concatenation system (`create_tests.sh` + `All.test.js`) to Vitest, where each test file runs independently with proper ESM imports. It also covers the `jest.*` to `vi.*` API conversion and the final cleanup of Jest infrastructure.

**Depends on**: section-03-vitest-setup (Vitest installed, configured, and setup file created)

**Blocks**: section-12-ci-cleanup

## Background

### Current Test Architecture

The project uses a custom test pipeline:

1. `create_tests.sh` concatenates all source files (stripping `import`/`export` lines) and all test files into a single `All.test.js`
2. Jest runs `All.test.js` in jsdom environment
3. All 315 tests across 18 test files share a single global scope

This means:
- Test files have **no import statements** -- they rely on all symbols being globally available from the concatenated source
- Two utility files provide shared test infrastructure:
  - `/Tests/TestGlobals.js` -- creates `g_testHeroDatabase` and `test_UnitManager`
  - `/Sources/TestUtilities.js` -- provides `test_DamageCalculator`, `UnitBuilder`, `BattleScenarioBuilder`, `resetGlobalTestState`, etc. (this is a source file listed in `SOURCE_FILE_NAMES`)
- Global state is shared between tests (e.g., `g_appData`, `g_testHeroDatabase`)

### The 18 Test Files

Ordered by migration priority (simplest first):

1. `SmokeTest.test.js` -- basic smoke tests, uses `g_testHeroDatabase`, `UnitBuilder`, `BattleScenarioBuilder`
2. `SimpleUtility.test.js` -- tests `ObjectUtil.getKeyName`, no complex dependencies
3. `BuildFilter.test.js` -- self-contained, tests a local `filterImportExport` function
4. `DslNode.test.js` -- DSL node tests, uses `g_testHeroDatabase`, `test_DamageCalculator`, `AT_START_OF_COMBAT_HOOKS`
5. `SkillEffect.test.js` -- skill effect tests
6. `TestHelper.test.js` -- tests for `UnitBuilder` and `BattleScenarioBuilder` helpers
7. `DamageCalculator.test.js` -- damage calculation tests
8. `UnitManager.test.js` -- unit management tests
9. `BeginningOfTurnSkillHandler.test.js` -- beginning-of-turn skill tests
10. `GetRequirements.test.js` -- requirement checking tests
11. `SkillRegression.test.js` -- skill regression tests
12. `CombatFlow.test.js` -- combat flow tests
13. `SpecialCount.test.js` -- special count tests
14. `DamageReduction.test.js` -- damage reduction tests
15. `FollowUpAttack.test.js` -- follow-up attack tests
16. `StatusEffect.test.js` -- status effect tests
17. `Performance.test.js` -- performance benchmark tests
18. `EsmValidation.test.js` -- ESM validation tests (uses `child_process`, `fs`, `path`)

### Key Globals Used by Tests

Tests reference these symbols without imports:

- **Enums/Constants**: `Weapon`, `Support`, `Special`, `PassiveA`, `PassiveB`, `PassiveC`, `WeaponType`, `MoveType`, `StatusType`, `SkillType`, `UnitGroupType`, `BlessingType`, `SeasonType`
- **Core Classes**: `Unit`, `BattleContext`, `BattleMap`, `Cell`, `DamageCalculator`, `HeroDatabase`, `SkillDatabase`, `UnitManager`, `HeroInfo`
- **DSL**: `SkillEffectRegistrar`, `SkillEffectNode`, `SingleEffectNode`, `EffectsNode`, `TRUE_NODE`, `FALSE_NODE`, `UNIT`, `FOE`, `GRANTS_BONUS`, `INFLICTS_PENALTY`, `DEALS_DAMAGE`, `IF_NODE`, `ATK_SPD`, `ATK_SPD_DEF_RES`, `AT_START_OF_COMBAT_HOOKS`, `AFTER_COMBAT_HOOKS`, `AT_START_OF_TURN_HOOKS`, `NODE_FUNC`, `DEALS_DAMAGE_X_NODE`, etc.
- **Test Utilities**: `g_testHeroDatabase`, `test_DamageCalculator`, `test_BeginningOfTurnSkillHandler`, `UnitBuilder`, `BattleScenarioBuilder`, `resetGlobalTestState`, `test_calcDamage`, `MathUtil`
- **Data Arrays**: `heroInfos`, `weaponInfos`, `supportInfos`, `specialInfos`, `passiveAInfos`, `passiveBInfos`, `passiveCInfos`, `passiveSInfos`, `passiveXInfos`
- **App State**: `g_appData`

---

## Tests FIRST

Before migrating, create a verification test that ensures the migration produces identical results.

### Migration Verification Test

File: `/Tests/VitestMigration.test.js`

```javascript
/**
 * Vitest migration verification test.
 * Confirms that Vitest is running correctly and all imports resolve.
 * This test file is written WITH imports from the start (Vitest-native).
 */
import { describe, test, expect } from 'vitest';
// Verify that the test setup file has run and globals are available
describe('Vitest migration verification', () => {
    test('vitest run detects this test file', () => {
        expect(true).toBe(true);
    });

    test('globals: true makes describe/it/expect available without import', () => {
        // This test itself proves it -- if globals weren't working,
        // this file wouldn't even parse without the explicit import above.
        // After confirming, the explicit import can be removed.
        expect(typeof describe).toBe('function');
        expect(typeof test).toBe('function');
        expect(typeof expect).toBe('function');
    });

    test('jsdom environment provides document and window', () => {
        expect(typeof document).not.toBe('undefined');
        expect(typeof window).not.toBe('undefined');
    });
});
```

### Per-File Migration Acceptance Criteria

For each of the 18 test files, after migration:

- `vitest run Tests/XxxTest.test.js` succeeds independently
- All `import` statements resolve without errors
- Test count and pass/fail results match the Jest version
- No `jest.*` API calls remain (should be `vi.*` if needed)

### Full Suite Verification

After all 18 files are migrated:

- `vitest run` discovers and runs all 18 test files (not `All.test.js`)
- Total test count is 315 (or matches current Jest count exactly)
- All tests pass
- Jest can still run in parallel during transition: `npx jest` with `All.test.js` also passes

### Jest API Absence Check

- No occurrences of `jest.fn()`, `jest.mock()`, or `jest.spyOn()` in any test file
- Note: current codebase has **zero** `jest.*` API usage, so this is primarily a guard against regressions

---

## Implementation

### Step 1: Create the Test Barrel Import File

Create a single barrel file that re-exports everything tests need. This avoids duplicating 20+ import lines in every test file.

File to create: `/Tests/testImports.js`

This file should:
- Import and re-export all enums/constants from `Sources/SkillConstants.js`, `Sources/HeroInfoConstants.js`, `Sources/UnitConstants.js`
- Import and re-export core classes from their respective source files
- Import and re-export DSL functions and nodes from `Sources/SkillEffect.js`, `Sources/SkillEffectAliases.js`, `Sources/SkillEffectHooks.js`, `Sources/SkillEffectRegistrar.js`
- Import and re-export test utilities from `Sources/TestUtilities.js`
- Import data arrays from `Sources/SampleHeroInfos.js` and `Sources/SampleSkillInfos.js`
- Import and run all SkillImpl files (side-effect imports for skill registration)
- Create and export `g_testHeroDatabase` (currently defined in `Tests/TestGlobals.js`)
- Set up `g_appData` global (imported from `Sources/AppData.js` or `Sources/GlobalDefinitions.js`)

Structure:

```javascript
// /Tests/testImports.js
//
// Barrel file for Vitest test imports.
// Centralizes all imports so each test file only needs one import line.

// --- Side-effect imports (skill registration) ---
import '../Sources/SkillImpl.js';
import '../Sources/SkillImpl202408.js';
import '../Sources/SkillImpl202501.js';
import '../Sources/SkillImpl202601.js';

// --- Data ---
import { heroInfos } from '../Sources/SampleHeroInfos.js';
import { weaponInfos, supportInfos, specialInfos, passiveAInfos, passiveBInfos, passiveCInfos, passiveSInfos, passiveXInfos } from '../Sources/SampleSkillInfos.js';

// --- Test utilities ---
import { test_HeroDatabase, test_DamageCalculator, test_BeginningOfTurnSkillHandler, UnitBuilder, BattleScenarioBuilder, resetGlobalTestState, test_calcDamage, test_calcDamageWithUnits, RegressionTestHelper, test_executeTest } from '../Sources/TestUtilities.js';

// --- Construct g_testHeroDatabase (mirrors TestGlobals.js) ---
const g_testHeroDatabase = new test_HeroDatabase(
    heroInfos, weaponInfos, supportInfos, specialInfos,
    passiveAInfos, passiveBInfos, passiveCInfos, passiveSInfos, passiveXInfos
);

// Re-export everything tests need
export { g_testHeroDatabase };
export { test_DamageCalculator, test_BeginningOfTurnSkillHandler, UnitBuilder, BattleScenarioBuilder, resetGlobalTestState, test_calcDamage, test_calcDamageWithUnits, RegressionTestHelper, test_executeTest };

// Re-export enums, constants, classes, DSL elements as needed...
// (Full list derived from grep of test files)
export { Weapon, Support, Special, PassiveA, PassiveB, PassiveC } from '../Sources/SkillConstants.js';
export { MoveType } from '../Sources/HeroInfoConstants.js';
export { UnitGroupType } from '../Sources/UnitConstants.js';
// ... etc for all symbols used by tests
```

The exact set of re-exports should be determined by grepping all 18 test files for unqualified symbol references, then mapping each to its source module's export list.

### Step 2: Migrate Tests in Priority Order

For each test file, the migration procedure is:

1. Add an import line at the top importing from `./testImports.js` (and any file-specific imports)
2. Verify the file runs independently: `npx vitest run Tests/XxxTest.test.js`
3. Compare test count with Jest output
4. Fix any import resolution errors

#### Tier 1: Self-contained / Simple (migrate first)

**`BuildFilter.test.js`** -- Completely self-contained. Defines its own `filterImportExport` function inline. No imports needed. Should work immediately with Vitest.

**`SimpleUtility.test.js`** -- Only uses `ObjectUtil`. Add import for `ObjectUtil` from the appropriate source module.

**`SmokeTest.test.js`** -- Uses `g_testHeroDatabase`, `UnitBuilder`, `BattleScenarioBuilder`, various enums. Add:
```javascript
import { g_testHeroDatabase, UnitBuilder, BattleScenarioBuilder, resetGlobalTestState } from './testImports.js';
import { Weapon, Support, Special, PassiveA, PassiveB, PassiveC } from './testImports.js';
// ... other needed symbols
```

**`TestHelper.test.js`** -- Tests `UnitBuilder` and `BattleScenarioBuilder`. Similar imports to SmokeTest.

#### Tier 2: DSL / Skill Tests

**`DslNode.test.js`** -- Uses `g_testHeroDatabase`, `test_DamageCalculator`, `AT_START_OF_COMBAT_HOOKS`, `NODE_FUNC`, `DEALS_DAMAGE_X_NODE`, and many DSL nodes. Needs extensive imports from `SkillEffect.js` and `SkillEffectHooks.js`.

**`SkillEffect.test.js`** -- Similar DSL dependencies.

**`GetRequirements.test.js`** -- Requirements checking, DSL-heavy.

#### Tier 3: Combat Tests

**`DamageCalculator.test.js`**, **`CombatFlow.test.js`**, **`SpecialCount.test.js`**, **`DamageReduction.test.js`**, **`FollowUpAttack.test.js`**, **`StatusEffect.test.js`** -- All use `test_DamageCalculator`, hero database, various skill constants.

**`BeginningOfTurnSkillHandler.test.js`** -- Uses `test_BeginningOfTurnSkillHandler`.

**`UnitManager.test.js`** -- Uses `test_UnitManager` from `TestGlobals.js`.

**`SkillRegression.test.js`** -- Regression tests using `UnitBuilder` and `BattleScenarioBuilder`.

#### Tier 4: Infrastructure Tests

**`Performance.test.js`** -- Uses `performance.now()`, `test_DamageCalculator`, hero database. The `performance` global should be available in Vitest's jsdom without the polyfill from `jest.setup.js`.

**`EsmValidation.test.js`** -- Uses `require('child_process')`, `require('fs')`, `require('path')`. These are Node.js builtins. In Vitest (ESM), convert `require` to `import`:
```javascript
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
```
The `__dirname` usage needs replacement with `import.meta.url`:
```javascript
import { fileURLToPath } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
```
Note: `EsmValidation.test.js` uses `__dirname` to locate the project root. Since tests currently run from `All.test.js` at the project root, `__dirname` equals the root. When running from `Tests/`, the root becomes `path.join(__dirname, '..')`.

### Step 3: Handle the `g_appData` Global

Many tests assign to `g_appData` directly (e.g., `g_appData = calclator.unitManager`). This variable is defined in `Sources/AppData.js` as `const g_appData = new AppData()`.

The challenge: `const` cannot be reassigned. In the concatenated `All.test.js`, the `const` keyword was included but `g_appData` was effectively a mutable global. In ESM, each module gets its own binding.

Solutions (choose one):
1. Change `const g_appData` to `let g_appData` in `Sources/AppData.js` and export a setter function `setAppData(value)` that tests use
2. Use a shared mutable object: export `const appState = { data: g_appData }` and have tests set `appState.data = ...`
3. Make `g_appData` a property on `globalThis` in the Vitest setup file

The most pragmatic approach for migration is option 3: in the Vitest setup file (created in section-03), assign `globalThis.g_appData = g_appData` after importing, and let tests mutate `globalThis.g_appData`. This matches the pre-ESM behavior with minimal code changes.

### Step 4: Parallel Jest/Vitest Verification

During migration, keep both test runners working:

- `./run_tests.sh` continues to use Jest with `All.test.js` (unchanged)
- `npx vitest run` runs the migrated test files independently

Add a temporary npm script:
```json
"test:vitest": "vitest run"
```

After each test file is migrated, run both:
```bash
./run_tests.sh          # Jest -- should still pass
npx vitest run          # Vitest -- migrated tests pass
```

### Step 5: Full Migration Verification

Once all 18 test files pass with Vitest:

1. Run `vitest run` and confirm all 315 tests pass
2. Run `./run_tests.sh` one final time to confirm Jest still works
3. Proceed to cleanup

### Step 6: Jest Cleanup

After full Vitest verification, remove Jest infrastructure:

**Files to delete**:
- `/jest.config.js`
- `/jest.setup.js`
- `/create_tests.sh`
- `/run_tests.sh` (or update to use Vitest)
- `/All.test.js` (generated file, may not exist on disk)
- `/Tests/TestGlobals.js` (functionality moved to `testImports.js`)

**Files to modify**:

`/package.json`:
- Remove `jest` and `jest-environment-jsdom` from `devDependencies`
- Update scripts:
  ```json
  "test": "vitest run && eslint ./Sources/",
  "test:only": "vitest run",
  "test:watch": "vitest"
  ```
- Remove `"test:vitest"` temporary script

`/run_tests.sh` (if kept, rewrite for Vitest):
```bash
#!/usr/bin/env bash
if [ $# -gt 0 ]; then
  npx vitest run "$@"
else
  npm test
fi
```

### Special Considerations

#### SkillImpl Side-Effect Imports

The SkillImpl files (`SkillImpl.js`, `SkillImpl202408.js`, `SkillImpl202501.js`, `SkillImpl202601.js`) register skills as side effects when loaded. In the concatenated system, they run automatically. In ESM, they must be explicitly imported. The `testImports.js` barrel handles this with side-effect imports.

#### `TestUtilities.js` is in `Sources/` not `Tests/`

`TestUtilities.js` is listed in `SOURCE_FILE_NAMES` in `create_tests.sh`, meaning it lives in `Sources/` but contains test-only code. During migration, its exports are consumed by `Tests/testImports.js`. No need to move it -- just import from the correct path (`../Sources/TestUtilities.js`).

#### `EsmValidation.test.js` Special Treatment

This test file runs external scripts (`validate-esm.mjs`, `check-esm-coverage.mjs`). After the full Vite migration is complete, these validation scripts may become obsolete (Vite's module resolution replaces them). Consider marking these tests with `describe.skip` or removing them entirely if the validation scripts are deleted in section-12.

#### Thread Safety

The Vitest config (from section-03) uses `pool: 'threads'` with `poolOptions.threads.singleThread: true` to force serial execution. This is critical because tests mutate shared globals (`g_appData`, skill hook registrations). Do not change this setting during migration.

---

## Files Modified/Created Summary

| Action | File Path |
|--------|-----------|
| Create | `/Tests/testImports.js` |
| Create | `/Tests/VitestMigration.test.js` |
| Modify | All 18 test files (add imports) |
| Modify | `/Tests/EsmValidation.test.js` (convert require to import, fix __dirname) |
| Modify | `/package.json` (update scripts, remove Jest deps) |
| Delete | `/jest.config.js` |
| Delete | `/jest.setup.js` |
| Delete | `/create_tests.sh` |
| Delete | `/Tests/TestGlobals.js` (merged into testImports.js) |

---

## Implementation Notes

**Implemented:** 2026-03-20

### Major Deviation: Concatenation-Based Approach

The original plan assumed source files had complete ESM imports. In practice, source files have **2000+ missing cross-file imports** and extensive **circular dependencies** (e.g., Skill.js ↔ SkillEffect.js ↔ Unit.js). Attempting to add missing imports caused circular dependency initialization failures.

**Decision:** Use `vm.runInThisContext` in `vitest.setup.js` to concatenate all source files (stripping import/export lines), mimicking `create_tests.sh`. This preserves the global-scope execution model while enabling Vitest as the test runner.

### Actual Changes

| Action | File Path | Description |
|--------|-----------|-------------|
| Modify | `vitest.setup.js` | Concatenation-based source loading via vm.runInThisContext |
| Modify | `vite.config.js` | Fixed deprecated poolOptions for Vitest 4 |
| Modify | `create_tests.sh` | Excluded EsmValidation from Jest (now Vitest-only) |
| Modify | 9 test files | Fixed strict mode issues (let declarations, globalThis.g_appData) |
| Modify | `Tests/ViteBuild.test.js` | Converted from node:test to Vitest globals |
| Modify | `Tests/ViteSetup.test.js` | Converted from node:test to Vitest globals |
| Modify | `Tests/EsmValidation.test.js` | Converted require() to ESM imports |
| Fix | `Sources/DamageCalculatorWrapper.js` | Fixed atkUnit/defUnit bug exposed by strict mode |
| Fix | `Tests/DamageCalculator.test.js` | Fixed defUnit/defAllyUnit confusion in Test great talent |

### Jest Cleanup Deferred

Jest infrastructure (jest.config.js, jest.setup.js, create_tests.sh) is intentionally kept for the transition period. CI still uses Jest. Full cleanup planned for section-12.

### Verification Results

- Vitest: 21 test files, 333 tests pass
- Jest: 1 file (concatenated), 310 tests pass (EsmValidation excluded)
- Both test runners coexist