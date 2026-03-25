`g_testHeroDatabase` is defined in `Tests/TestGlobals.js` and used in `Sources/TestUtilities.js`. This is a circular dependency between test helpers and source files. `TestGlobals.js` constructs a `test_HeroDatabase` using `test_HeroDatabase` from `TestUtilities.js`. This is a key design issue to address.

Now I have all the information needed. Let me write the section.

# Section 10: Remaining Imports -- CustomSkill.js, UnitSkillEffect.js, TestUtilities.js

## 実装結果

**ステータス**: 完了

### 実施内容
1. **CustomSkill.js**: 既存importが完備済み。変更不要
2. **UnitSkillEffect.js**: 既存importが完備済み。変更不要
3. **TestUtilities.js**: `g_testHeroDatabase`の依存注入リファクタリング
   - `_testHeroDatabase` モジュールレベル変数追加
   - `setTestHeroDatabase(db)` setter関数追加・export
   - 全9箇所の `g_testHeroDatabase` → `_testHeroDatabase` 置換
4. **TestGlobals.js**: `setTestHeroDatabase(g_testHeroDatabase)` 呼び出し追加

### テスト
- `Tests/RemainingImports.test.js`: 5テスト全パス
  - CustomSkill.js, UnitSkillEffect.js, TestUtilities.js の動的import成功
  - `initUnitSkillEffects` のUnit.jsからのre-export確認
  - `setTestHeroDatabase` のexport確認
- 全テストスイート: 638/639パス（1件は既知のDamageCalculatorタイムアウト）

## Overview

This section adds missing ESM imports to the three remaining SkillEffect-related files: `CustomSkill.js`, `UnitSkillEffect.js`, and `TestUtilities.js`. It also addresses the `initUnitSkillEffects` initialization pattern for the test environment. These three files are smaller and more specialized than the files handled in sections 06-09, but `TestUtilities.js` presents a unique challenge: it references `g_testHeroDatabase`, which is defined in `Tests/TestGlobals.js` -- creating a cross-boundary dependency between `Sources/` and `Tests/`.

## Dependencies

- **Depends on**: section-05-unexported-symbols (all needed symbols must be exported before they can be imported)
- **Blocks**: section-11-test-esm (test files need these source files to be valid ESM modules)
- **Parallel with**: section-06 through section-09 (these import addition sections are independent)

## Background

### Current State of Each File

**CustomSkill.js (~2,136 lines)**
Located at `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/CustomSkill.js`. This file already has comprehensive ESM imports (10 import statements spanning lines 1-10), importing from:
- `SkillConstants.js`
- `SkillEffectCore.js`
- `SkillEffectHooks.js`
- `SkillEffect.js`
- `StatusConstants.js`
- `Tile.js`
- `UnitConstants.js`
- `SkillEffectAliases.js`
- `SkillEffectBattleContext.js`
- `Skill.js`

Exports: `export { CustomSkill };` on line 2136. This file appears to already have all its ESM imports in place. The main task is to verify this and confirm no symbols are missing.

**UnitSkillEffect.js (~712 lines)**
Located at `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/UnitSkillEffect.js`. This file also has comprehensive imports (9 import statements, lines 1-9), importing from:
- `SkillEffectEnv.js`
- `SkillEffectHooks.js`
- `SkillEffect.js`
- `Logger.js`
- `Skill.js`
- `StatusConstants.js`
- `SkillConstants.js`
- `HeroInfoConstants.js`
- `AppDataGlobal.js`

Exports: `export function initUnitSkillEffects(UnitClass)` on line 16, plus `export { calcHealAmount, isDebufferTier1, isDebufferTier2, isAfflictor };` on line 712. This file appears to have all its ESM imports in place already, since it was created during Phase 4 with explicit attention to ESM correctness.

The `initUnitSkillEffects` function is the key concern: it adds methods to `Unit.prototype` and must be called once at startup. In the browser, all 8 `*Main.js` entry points already call it. In the test environment, `vitest.setup.js` currently handles this via concatenation (`concatenated += '\ninitUnitSkillEffects(Unit);\n';`). After section-12 removes the concatenation, the test environment will need an alternative initialization mechanism.

**TestUtilities.js (~509 lines)**
Located at `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/TestUtilities.js`. This file has 17 import statements (lines 1-17) covering most of its dependencies. However, it uses `g_testHeroDatabase` (a `test_HeroDatabase` instance) in `UnitBuilder.fromHero()` and all `withWeapon/withSupport/withSpecial/withPassiveA/B/C/S/X` methods without importing it. Currently `g_testHeroDatabase` is defined in `/Users/studio/Documents/GitHub/FehBattleSimulator/Tests/TestGlobals.js`, which is concatenated after `TestUtilities.js` in `vitest.setup.js`. In the concatenation system, `g_testHeroDatabase` becomes a global variable accessible to the `UnitBuilder` class methods at call time (not at module evaluation time).

### The g_testHeroDatabase Circular Dependency Problem

The dependency chain is:
1. `Tests/TestGlobals.js` imports `test_HeroDatabase` from `Sources/TestUtilities.js`
2. `Sources/TestUtilities.js` uses `g_testHeroDatabase` which is defined in `Tests/TestGlobals.js`

This is a circular dependency between `Sources/` and `Tests/`. In the concatenation system, both files are evaluated in the same global scope, so `g_testHeroDatabase` is simply a global variable available at method call time. In ESM, this circularity must be broken.

**Resolution approach**: Refactor `TestUtilities.js` to accept the database instance via dependency injection rather than referencing a global. The `UnitBuilder` class should receive `g_testHeroDatabase` through a module-level setter or constructor parameter, or `TestGlobals.js` should set it after import. Specifically:

1. Add a `setTestHeroDatabase(db)` function in `TestUtilities.js` that stores the database in a module-level variable
2. Export this setter alongside the existing exports
3. `TestGlobals.js` (or its ESM successor) calls `setTestHeroDatabase(db)` after constructing the database
4. `UnitBuilder` methods reference the module-level variable instead of a global

This pattern mirrors the existing `setAppData()` pattern in `AppDataGlobal.js`.

### initUnitSkillEffects in the Test Environment

Currently, `vitest.setup.js` concatenation appends `initUnitSkillEffects(Unit);` at the end of the concatenated script. After section-12 removes the concatenation, test setup must ensure `initUnitSkillEffects(Unit)` is called once before any test that exercises Unit skill methods.

**Resolution approach**: The ESM-ified `TestGlobals.js` (handled in section-11) should import both `Unit` and `initUnitSkillEffects` and call it at module evaluation time. Since `TestGlobals.js` is the shared test setup module imported by all test files, this is the natural place for one-time initialization. The pattern:

```javascript
import { Unit } from '../Sources/Unit.js';
import { initUnitSkillEffects } from '../Sources/UnitSkillEffect.js';
initUnitSkillEffects(Unit);
```

This is not implemented in this section (it belongs to section-11), but the design is documented here because section-10 prepares the ground by ensuring `UnitSkillEffect.js` correctly exports `initUnitSkillEffects`.

## Tests

Create test file: `/Users/studio/Documents/GitHub/FehBattleSimulator/Tests/RemainingImports.test.js`

```javascript
import { describe, it, expect } from 'vitest';

describe('Remaining imports - dynamic import verification', () => {
    // Verify that CustomSkill.js can be loaded as a standalone ESM module.
    // A successful dynamic import means all import dependencies are resolved
    // and no ReferenceError occurs at module evaluation time.
    it('CustomSkill.js dynamic import succeeds', async () => {
        const mod = await import('../Sources/CustomSkill.js');
        expect(mod.CustomSkill).toBeDefined();
    });

    // Verify that UnitSkillEffect.js can be loaded as a standalone ESM module.
    it('UnitSkillEffect.js dynamic import succeeds', async () => {
        const mod = await import('../Sources/UnitSkillEffect.js');
        expect(mod.initUnitSkillEffects).toBeDefined();
        expect(typeof mod.initUnitSkillEffects).toBe('function');
    });

    // Verify that TestUtilities.js can be loaded as a standalone ESM module.
    // After refactoring g_testHeroDatabase to use dependency injection,
    // the module should evaluate without errors even when no database is set.
    it('TestUtilities.js dynamic import succeeds', async () => {
        const mod = await import('../Sources/TestUtilities.js');
        expect(mod.test_createDefaultUnit).toBeDefined();
        expect(mod.UnitBuilder).toBeDefined();
        expect(mod.BattleScenarioBuilder).toBeDefined();
        expect(mod.test_DamageCalculator).toBeDefined();
    });

    // Verify that initUnitSkillEffects is exported from UnitSkillEffect.js
    // and re-exported from Unit.js
    it('initUnitSkillEffects is re-exported from Unit.js', async () => {
        const mod = await import('../Sources/Unit.js');
        expect(mod.initUnitSkillEffects).toBeDefined();
        expect(typeof mod.initUnitSkillEffects).toBe('function');
    });

    // Verify the setTestHeroDatabase setter is exported after refactoring
    it('TestUtilities.js exports setTestHeroDatabase setter', async () => {
        const mod = await import('../Sources/TestUtilities.js');
        expect(mod.setTestHeroDatabase).toBeDefined();
        expect(typeof mod.setTestHeroDatabase).toBe('function');
    });
});
```

These tests use dynamic `import()` which exercises the full ESM module evaluation. They will fail if any imported symbol is missing from a dependency. The `setTestHeroDatabase` test validates the refactoring of the `g_testHeroDatabase` global dependency.

## Implementation Steps

### Step 1: Verify CustomSkill.js Imports

Verify that `CustomSkill.js` has all necessary ESM imports by attempting a dynamic import in a test. The file already has 10 import statements covering its major dependencies. Specifically check:

1. Run the `RemainingImports.test.js` dynamic import test for CustomSkill.js
2. If it passes, no action needed -- the file is already fully imported
3. If it fails with a ReferenceError, identify the missing symbol and its definition file, then add the import

**Expected outcome**: CustomSkill.js already has complete imports. No modifications expected.

**File**: `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/CustomSkill.js`

### Step 2: Verify UnitSkillEffect.js Imports

Verify that `UnitSkillEffect.js` has all necessary ESM imports. The file was created during Phase 4 with explicit import statements and appears to be complete.

1. Run the `RemainingImports.test.js` dynamic import test for UnitSkillEffect.js
2. If it passes, no action needed
3. If it fails, add the missing import

**Expected outcome**: UnitSkillEffect.js already has complete imports. No modifications expected.

**File**: `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/UnitSkillEffect.js`

### Step 3: Refactor TestUtilities.js -- g_testHeroDatabase Dependency Injection

This is the main implementation work of this section. `TestUtilities.js` uses `g_testHeroDatabase` (defined in `Tests/TestGlobals.js`) as a global variable in 9 places. This must be refactored to use dependency injection.

**Modifications to `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/TestUtilities.js`**:

1. Add a module-level variable at the top of the file (after the existing imports):
   ```javascript
   let _testHeroDatabase = null;
   ```

2. Add a setter function:
   ```javascript
   function setTestHeroDatabase(db) {
       _testHeroDatabase = db;
   }
   ```

3. Replace all 9 occurrences of `g_testHeroDatabase` with `_testHeroDatabase`

4. Add `setTestHeroDatabase` to the export statement at line 509:
   ```javascript
   export { test_createDefaultSkillInfo, test_createDefaultUnit, test_HeroDatabase,
            test_BeginningOfTurnSkillHandler, test_DamageCalculator,
            test_calcDamageWithUnits, test_calcDamage, UnitBuilder,
            BattleScenarioBuilder, RegressionTestHelper, resetGlobalTestState,
            test_executeTest, setTestHeroDatabase };
   ```

**Why this approach**: This mirrors the `setAppData()` / `g_appData` pattern already established in `AppDataGlobal.js`. The setter allows `TestGlobals.js` to inject the database after constructing it, breaking the circular dependency.

### Step 4: Update TestGlobals.js for Compatibility

`Tests/TestGlobals.js` currently defines `g_testHeroDatabase` as a bare `const` (no export, no import). During the concatenation phase (before section-12), it must continue to work as a concatenated file. However, the refactored `TestUtilities.js` now expects `_testHeroDatabase` to be set via `setTestHeroDatabase()`.

**For concatenation compatibility** (until section-12 removes concatenation):
- In the concatenation system, after `TestUtilities.js` is evaluated, `setTestHeroDatabase` becomes a global function
- `TestGlobals.js` is concatenated after `TestUtilities.js`, so it can call `setTestHeroDatabase(g_testHeroDatabase)` after constructing the database

**Modification to `/Users/studio/Documents/GitHub/FehBattleSimulator/Tests/TestGlobals.js`**:

Add a call to `setTestHeroDatabase` after the database construction:

```javascript
const g_testHeroDatabase = new test_HeroDatabase(
    heroInfos, weaponInfos, supportInfos, specialInfos, passiveAInfos,
    passiveBInfos, passiveCInfos, passiveSInfos, passiveXInfos);
setTestHeroDatabase(g_testHeroDatabase);
```

The `test_UnitManager` class defined in `TestGlobals.js` should also be preserved as-is for now.

**Note**: `filterImportExport` strips `import` lines and `export { ... }` lines. Since `TestGlobals.js` has neither (it is in `Tests/` and loaded without `filterImportExport`), no stripping occurs. The concatenation reads `TestGlobals.js` directly with `fs.readFileSync` (see `vitest.setup.js` line 52-55), so adding a `setTestHeroDatabase()` call is safe in the concatenation system because the function is already in scope from the earlier concatenated `TestUtilities.js`.

### Step 5: Verify Concatenation Compatibility

After all modifications, run `npm test` to confirm the concatenation system in `vitest.setup.js` still works correctly. Specifically:

1. `filterImportExport` must handle the new `setTestHeroDatabase` function export correctly (it will be stripped from the export line, and the function definition will remain)
2. The concatenation order places `TestUtilities.js` before `TestGlobals.js`, so `setTestHeroDatabase` is defined before it is called
3. All existing tests that use `UnitBuilder.fromHero()` and similar methods must continue to pass

### Step 6: Run Tests

Execute `npm test` and verify:
1. All existing tests pass
2. The new `Tests/RemainingImports.test.js` tests pass
3. No regressions in any SkillEffect-related tests

## Files Modified

| File | Change |
|------|--------|
| `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/TestUtilities.js` | Add `_testHeroDatabase` module variable, `setTestHeroDatabase()` setter, replace `g_testHeroDatabase` references, update export block |
| `/Users/studio/Documents/GitHub/FehBattleSimulator/Tests/TestGlobals.js` | Add `setTestHeroDatabase(g_testHeroDatabase)` call after database construction |
| `/Users/studio/Documents/GitHub/FehBattleSimulator/Tests/RemainingImports.test.js` | New test file for dynamic import verification |

Files that are NOT expected to need changes (already have complete imports):
- `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/CustomSkill.js`
- `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/UnitSkillEffect.js`

## Important Notes

- **CustomSkill.js and UnitSkillEffect.js already have comprehensive imports.** Both files were either created or significantly updated during Phase 4 with explicit ESM import statements. The primary work of this section is the `TestUtilities.js` refactoring.

- **The `g_testHeroDatabase` refactoring must maintain concatenation compatibility** until section-12 removes the concatenation system. The `setTestHeroDatabase()` approach works in both ESM and concatenation modes because: (a) in concatenation mode, the function is a global that `TestGlobals.js` can call directly; (b) in ESM mode, `TestGlobals.js` will import and call it.

- **initUnitSkillEffects is NOT called in this section.** The initialization call for the test environment belongs in section-11 (test ESM migration), where `TestGlobals.js` will be converted to a proper ESM module that imports and calls `initUnitSkillEffects(Unit)`. This section only ensures the function is properly exported, which it already is.

- **If dynamic import tests reveal unexpected missing imports**, add them to the appropriate file following the same pattern as sections 06-09. The most likely scenario is that all imports are already in place.

- **The `test_DamageCalculator` class in TestUtilities.js** is listed in the export block but is not prefixed with `export` in its class definition. The `filterImportExport` function handles this correctly because it strips `export { ... }` lines, and the class remains accessible in the concatenation global scope. In ESM, the `export { ... }` block at the end of the file handles the export. No change needed.

## Success Criteria

1. Dynamic import of `CustomSkill.js` succeeds without errors in Vitest
2. Dynamic import of `UnitSkillEffect.js` succeeds without errors in Vitest
3. Dynamic import of `TestUtilities.js` succeeds without errors in Vitest
4. `initUnitSkillEffects` is importable from both `UnitSkillEffect.js` and `Unit.js` (re-export)
5. `setTestHeroDatabase` is exported from `TestUtilities.js`
6. `g_testHeroDatabase` references in `TestUtilities.js` are replaced with the module-level `_testHeroDatabase` variable
7. `npm test` passes (all existing tests continue to work under the concatenation system)
8. No new circular dependencies introduced (`npx madge --circular Sources/` remains at 0)