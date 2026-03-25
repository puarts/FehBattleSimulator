Now let me check what the note in the plan says about Section 6 in the index mapping. The plan calls this "Section 6" but the index.md calls it `section-07-hooks-registrar-imports`. The plan's Section 6 maps to the index's section-07. Let me verify the mapping by re-reading the index.

From the index:
- `section-06-battlecontext-imports` = Plan Section 5 (SkillEffectBattleContext)
- `section-07-hooks-registrar-imports` = Plan Section 6 (SkillEffectHooks + SkillEffectRegistrar)

The plan's Section 6 content is what I need. Now I have all the information needed. Let me write the section.

# Section 07: SkillEffectHooks.js and SkillEffectRegistrar.js -- Add Missing ESM Imports

## Overview

This section adds any missing ESM imports to two files:
- `Sources/SkillEffectHooks.js` (594 lines) -- hook constant definitions
- `Sources/SkillEffectRegistrar.js` (244 lines) -- skill registration utility class

These files are part of the SkillEffect DSL module group. Currently, some symbols used at runtime may rely on the `vitest.setup.js` concatenation mechanism (`vm.runInThisContext`) rather than proper ESM imports. This section ensures both files are fully self-contained ESM modules.

## Dependencies

- **section-05-unexported-symbols** must be completed first (any symbols these files need to import must already be exported from their definition files)
- Sections 06 through 10 (in the index) are parallelizable after section-05

## Background

The `vitest.setup.js` concatenation loads all source files into a single global scope via `vm.runInThisContext`, masking missing imports. When this concatenation is removed (section-12), any file with missing imports will throw `ReferenceError`. This section proactively adds all missing imports so these files work as standalone ESM modules.

## Current State of Each File

### SkillEffectHooks.js

**Existing import (line 1):**
```javascript
import { SkillEffectHooks, MultiValueMap } from './SkillEffectCore.js';
```

**Runtime symbol usage analysis:**
- All 80+ `const XXX_HOOKS = new SkillEffectHooks()` use `SkillEffectHooks` -- already imported
- Two `const XXX_MAP = new MultiValueMap()` use `MultiValueMap` -- already imported
- Lines 563-575: `DURING_COMBAT_INCLUDING_AOE_HOOKS` and `DURING_COMBAT_USING_STATS_INCLUDING_AOE_HOOKS` reference other hooks constants defined **in the same file** (e.g., `AT_START_OF_COMBAT_HOOKS`, `BEFORE_AOE_SPECIAL_HOOKS`, `NON_STATS_SKILL_USING_STATS_HOOKS`) -- no import needed
- JSDoc `@type` annotations reference type names (`SkillEffectNode`, `BoolNode`, `NumberNode`, `DamageCalculatorWrapperEnv`, etc.) but these are **comments only** and not runtime dependencies

**Conclusion: SkillEffectHooks.js likely needs zero additional imports.** All runtime dependencies are already covered. Verification via dynamic import test is still required.

### SkillEffectRegistrar.js

**Existing imports (lines 1-5):**
```javascript
import { AND_NODE, IF_NODE, LTE_NODE, NODE_FUNC, NumberNode, SKILL_EFFECT_NODE, SkillEffectHooks, SkillEffectNode, SkillRequirement } from './SkillEffectCore.js';
import { DISTANCE_BETWEEN_UNITS_NODE, FILTER_UNITS_NODE, FOE_NODE, FOR_EACH_UNIT_NODE, SKILL_OWNER_NODE, TARGET_NODE, UNITE_UNITS_NODE, UnitsNode } from './SkillEffect.js';
import { SKILL_OWNERS_ALLIES_ON_MAP_NODE } from './SkillEffectAliases.js';
import { AT_START_OF_COMBAT_HOOKS, FOR_ALLIES_AT_START_OF_COMBAT_HOOKS, ... } from './SkillEffectHooks.js';
import { NULL_OBJECT } from './Utilities.js';
```

**Runtime symbol usage analysis:**
- `SkillEffectRegistrar` class methods use: `AND_NODE`, `IF_NODE`, `LTE_NODE`, `NODE_FUNC`, `NumberNode`, `SKILL_EFFECT_NODE`, `SkillEffectHooks`, `SkillEffectNode`, `SkillRequirement` -- all imported from SkillEffectCore.js
- DSL node references: `DISTANCE_BETWEEN_UNITS_NODE`, `FILTER_UNITS_NODE`, `FOE_NODE`, `FOR_EACH_UNIT_NODE`, `SKILL_OWNER_NODE`, `TARGET_NODE`, `UNITE_UNITS_NODE`, `UnitsNode` -- all imported from SkillEffect.js
- Alias: `SKILL_OWNERS_ALLIES_ON_MAP_NODE` -- imported from SkillEffectAliases.js
- Hook constants: `AT_START_OF_COMBAT_HOOKS`, `FOR_ALLIES_AT_START_OF_COMBAT_HOOKS`, `FOR_ALLIES_GRANTS_STATS_PLUS_TO_ALLIES_DURING_COMBAT_HOOKS`, `FOR_ALLIES_NON_STATS_SKILL_USING_STATS_HOOKS`, `FOR_ALLIES_STATS_SKILLS_USING_STATS_HOOKS`, `FOR_ALLIES_WHEN_APPLIES_POTENT_EFFECTS_HOOKS`, `FOR_FOES_AT_START_OF_COMBAT_HOOKS`, `FOR_FOES_INFLICTS_STATS_MINUS_HOOKS`, `FOR_FOE_NON_STATS_SKILL_USING_STATS_HOOKS`, `FOR_FOE_STATS_SKILLS_USING_STATS_HOOKS`, `NON_STATS_SKILL_USING_STATS_HOOKS`, `STATS_SKILL_USING_STATS_HOOKS`, `WHEN_APPLIES_POTENT_EFFECTS_HOOKS` -- all imported from SkillEffectHooks.js
- Utility: `NULL_OBJECT` -- imported from Utilities.js

**Conclusion: SkillEffectRegistrar.js also likely needs zero additional imports.** All runtime dependencies appear to be covered by existing import statements.

## Tests

Create test file: `Tests/Phase5HooksRegistrarImports.test.js`

The tests verify that both files can be loaded as standalone ESM modules (dynamic import succeeds without `ReferenceError`) and that their key exports are functional.

### Test 1: SkillEffectHooks.js dynamic import succeeds

Dynamically import `../Sources/SkillEffectHooks.js` and verify no error is thrown. This confirms all runtime dependencies are resolved via ESM imports (not concatenation).

```javascript
import { describe, test, expect } from 'vitest';

describe('SkillEffectHooks.js ESM imports', () => {
    test('dynamic import succeeds without ReferenceError', async () => {
        const module = await import('../Sources/SkillEffectHooks.js');
        expect(module).toBeDefined();
    });

    test('hook constants are importable and defined', async () => {
        const { AT_START_OF_COMBAT_HOOKS, AFTER_COMBAT_HOOKS, AT_START_OF_TURN_HOOKS } =
            await import('../Sources/SkillEffectHooks.js');
        expect(AT_START_OF_COMBAT_HOOKS).toBeDefined();
        expect(AFTER_COMBAT_HOOKS).toBeDefined();
        expect(AT_START_OF_TURN_HOOKS).toBeDefined();
    });

    test('SkillEffectRegistrar.registerSkillsDuringCombat is a function', async () => {
        const { SkillEffectRegistrar } = await import('../Sources/SkillEffectRegistrar.js');
        expect(typeof SkillEffectRegistrar.registerSkillsDuringCombat).toBe('function');
    });
});
```

### Test 2: SkillEffectRegistrar.js dynamic import succeeds

Dynamically import `../Sources/SkillEffectRegistrar.js` and verify no error is thrown.

```javascript
describe('SkillEffectRegistrar.js ESM imports', () => {
    test('dynamic import succeeds without ReferenceError', async () => {
        const module = await import('../Sources/SkillEffectRegistrar.js');
        expect(module).toBeDefined();
    });

    test('SkillEffectRegistrar class is exported', async () => {
        const { SkillEffectRegistrar } = await import('../Sources/SkillEffectRegistrar.js');
        expect(SkillEffectRegistrar).toBeDefined();
        expect(typeof SkillEffectRegistrar.registerSkillsDuringCombat).toBe('function');
        expect(typeof SkillEffectRegistrar.registerSkillsForFoesDuringCombat).toBe('function');
        expect(typeof SkillEffectRegistrar.registerSkillsForAlliesDuringCombat).toBe('function');
    });
});
```

### Test 3: Composite hooks work correctly

Verify that the composite hook objects (`DURING_COMBAT_INCLUDING_AOE_HOOKS`, `DURING_COMBAT_USING_STATS_INCLUDING_AOE_HOOKS`) which reference other hooks in the same file have a working `addSkill` method.

```javascript
describe('Composite hooks', () => {
    test('DURING_COMBAT_INCLUDING_AOE_HOOKS has addSkill method', async () => {
        const { DURING_COMBAT_INCLUDING_AOE_HOOKS } = await import('../Sources/SkillEffectHooks.js');
        expect(typeof DURING_COMBAT_INCLUDING_AOE_HOOKS.addSkill).toBe('function');
    });

    test('DURING_COMBAT_USING_STATS_INCLUDING_AOE_HOOKS has addSkill method', async () => {
        const { DURING_COMBAT_USING_STATS_INCLUDING_AOE_HOOKS } = await import('../Sources/SkillEffectHooks.js');
        expect(typeof DURING_COMBAT_USING_STATS_INCLUDING_AOE_HOOKS.addSkill).toBe('function');
    });
});
```

## Implementation Steps

### Step 1: Run tests first (expect pass)

Since both files already appear to have complete imports, the tests should pass immediately. Run:

```
npm test -- Tests/Phase5HooksRegistrarImports.test.js
```

If tests pass, this confirms no additional imports are needed. Proceed to Step 3.

If tests fail with `ReferenceError` for a specific symbol, proceed to Step 2.

### Step 2: Add missing imports (only if Step 1 fails)

If the dynamic import test reveals missing symbols:

1. Identify the `ReferenceError` symbol name from the test failure output
2. Find the symbol's definition file using grep: search for `export.*{.*SYMBOL_NAME` or `export (class|function|const) SYMBOL_NAME` across `Sources/`
3. Add the import statement to the appropriate file (`SkillEffectHooks.js` or `SkillEffectRegistrar.js`)
4. Re-run the test to verify the fix

**Import grouping convention** (follow existing style in SkillEffectRegistrar.js):
- Group imports by source file
- One import statement per source file
- Order: `SkillEffectCore.js`, `SkillEffect.js`, `SkillEffectAliases.js`, `SkillEffectHooks.js`, other files

### Step 3: Verify no circular dependencies introduced

Run madge to confirm no new circular dependencies:

```
npx madge --circular Sources/SkillEffectHooks.js Sources/SkillEffectRegistrar.js
```

Expected result: 0 circular dependencies.

### Step 4: Run full test suite

```
npm test
```

Confirm all existing tests still pass (regression check). The concatenation mechanism in `vitest.setup.js` is still active at this point, so existing tests should be unaffected.

## Files Modified

- `Sources/SkillEffectHooks.js` -- verify imports, add if needed (likely no changes)
- `Sources/SkillEffectRegistrar.js` -- verify imports, add if needed (likely no changes)

## Files Created

- `Tests/Phase5HooksRegistrarImports.test.js` -- new test file for ESM import verification

## Implementation Result

**Outcome**: Both files confirmed to have complete ESM imports. No source file modifications needed.

- `Tests/Phase5HooksRegistrarImports.test.js` created with 6 tests (3 describe blocks)
- All tests passed on first run: dynamic imports succeed, exports are functional
- Code review identified misplaced test in wrong describe block — auto-fixed
- No circular dependency concerns (no source changes made)

## Key Insight

Both `SkillEffectHooks.js` and `SkillEffectRegistrar.js` are already well-structured ESM modules with explicit imports. Unlike other files in the SkillEffect group (e.g., `SkillEffectAliases.js` which has zero imports), these files were likely written or updated more recently with ESM in mind. The primary value of this section is **verification** -- confirming via tests that the imports are complete, rather than adding new imports.