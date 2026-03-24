Now I have enough context. Let me write the section content.

# Section 05: Unexported Symbols -- Export Additions for Unexported Symbols

## Overview

This section addresses symbols defined in SkillEffect-related source files that are NOT currently listed in `export { ... }` statements but ARE used by other files in the codebase. Under the concatenation system (`vm.runInThisContext` in `vitest.setup.js`), all symbols are available globally regardless of export status. When sections 06-10 add explicit ESM `import` statements to consuming files, any symbol that is not exported from its definition file will cause a runtime error.

This section MUST be completed before sections 06-10 begin, as those sections depend on all referenced symbols being importable.

## Dependencies

- **Depends on**: section-04-post-merge-verify (SkillEffectUnit.js and SkillEffectField.js merged into SkillEffect.js; re-export files created)
- **Blocks**: section-06 through section-10 (all import addition work)

## Background

The spec identifies approximately 6 symbols that are defined in source files but not included in any `export` statement. These symbols work in the concatenation system because `filterImportExport` strips `export` lines and `vm.runInThisContext` places everything in global scope. In proper ESM, a symbol must be explicitly exported to be importable.

The `filterImportExport` function in `vitest.setup.js` handles exports as follows:
- Lines matching `^export \{` are stripped entirely
- Lines matching `^export (function|class|const|let|var)` have the `export` keyword removed

This means any symbol defined with a bare `const`, `class`, or `function` (no `export` prefix) that is also NOT listed in an `export { ... }` block at the bottom of the file is effectively unexported in ESM but globally available in the concatenation system.

## Tests

Create test file: `/Users/studio/Documents/GitHub/FehBattleSimulator/Tests/UnexportedSymbols.test.js`

```javascript
import { describe, it, expect } from 'vitest';

describe('Unexported symbols verification', () => {
    // Strategy: dynamically import each SkillEffect file and verify that
    // all symbols used by consuming files are actually exported.

    it('all symbols needed by SkillEffectAliases.js are exported from their source files', async () => {
        // After export additions, dynamic import of SkillEffectAliases.js should succeed
        // without ReferenceError for any symbol.
        const mod = await import('../Sources/SkillEffectAliases.js');
        expect(mod).toBeDefined();
    });

    it('all symbols needed by SkillEffectBattleContext.js are exported from their source files', async () => {
        const mod = await import('../Sources/SkillEffectBattleContext.js');
        expect(mod).toBeDefined();
    });

    it('all symbols needed by SkillEffectUnit.js (re-export) are importable', async () => {
        const mod = await import('../Sources/SkillEffectUnit.js');
        expect(mod.UNIT).toBeDefined();
        expect(mod.FOE).toBeDefined();
    });

    it('all symbols needed by SkillEffectField.js (re-export) are importable', async () => {
        const mod = await import('../Sources/SkillEffectField.js');
        expect(mod.SkillEffectField).toBeDefined();
    });

    it('identified unexported symbols are now exported from their definition files', async () => {
        // This test should enumerate the specific ~6 symbols found during investigation
        // and verify each is exported from the correct file.
        // Example pattern (actual symbols to be determined during investigation):
        //
        // const se = await import('../Sources/SkillEffect.js');
        // expect(se.SOME_SYMBOL).toBeDefined();
        //
        // Fill in with actual symbols discovered in Step 1.
    });
});
```

These tests will initially fail if unexported symbols exist. After adding exports, they should pass. Note that these tests use dynamic `import()` which exercises the full ESM module evaluation including all dependency resolution.

## Implementation Steps

### Step 1: Identify Unexported Symbols

Run a systematic comparison of defined-but-not-exported symbols across all SkillEffect-related files. The approach:

1. For each file in the SkillEffect module family, extract all top-level `const`, `class`, and `function` declarations
2. Extract all symbols listed in `export { ... }` blocks and `export function/class/const` declarations
3. Compute the difference: symbols that are defined but not exported
4. Cross-reference with usage in OTHER files to find the subset that actually needs to be exported

**Files to check** (in concatenation order from `vitest.setup.js`):
- `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/SkillEffectCore.js`
- `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/SkillEffectEnv.js`
- `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/SkillEffect.js` (post-merge, ~10,000 lines)
- `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/SkillEffectBattleContext.js`
- `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/SkillEffectHooks.js`
- `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/UnitSkillEffect.js`
- `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/SkillEffectRegistrar.js`
- `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/SkillEffectAliases.js`
- `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/CustomSkill.js`

**Methodology**: For each file, grep for `^(const|let|class|function) (\w+)` to get all defined symbols, then grep for those symbols in the `export { ... }` lines at the bottom of the same file. Any symbol that appears in the first list but not the second is a candidate. Then check if that symbol is referenced by any other file using a cross-file grep.

An alternative, faster methodology: attempt to dynamically import each file in a Vitest test. If the import chain fails due to missing exports, the error message will identify the exact missing symbol. This is more reliable because it catches symbols that are only indirectly needed (e.g., a constant used to initialize another constant that IS exported).

### Step 2: Add `export` to Definition Files

For each identified unexported symbol, add it to the appropriate `export { ... }` block at the bottom of its definition file.

**Pattern**:
```javascript
// Before (end of file):
export { existingSymbol1, existingSymbol2 };

// After:
export { existingSymbol1, existingSymbol2, newlyExportedSymbol };
```

Alternatively, if the symbol is defined on a single line, add `export` as a prefix:
```javascript
// Before:
const MY_SYMBOL = new SomeNode();

// After:
export const MY_SYMBOL = new SomeNode();
```

The preferred approach is to add to the existing `export { ... }` block at the end of the file, since that is the pattern used consistently throughout the codebase.

### Step 3: Verify No Additional Unexported Symbols Exist

After adding exports for the initially identified symbols, re-run the dynamic import tests. If new failures emerge (because exporting one symbol exposed a dependency on another unexported symbol), add those exports as well.

Repeat until all dynamic imports succeed without errors.

### Step 4: Verify Concatenation Compatibility

After adding exports, run `npm test` to confirm that the concatenation system (`vitest.setup.js`) still works. The `filterImportExport` function handles `export { ... }` lines by stripping them entirely, so adding symbols to existing export blocks should not break anything. However, if a new `export { ... }` line is added (rather than extending an existing one), verify it matches the `^export \{` pattern that `filterImportExport` uses.

### Step 5: Verify Browser Compatibility

Adding `export` statements to files loaded via `<script type="module">` is safe -- the browser's ESM loader uses them directly. For files loaded via `<script>` (non-module), `export` at the top level would cause a SyntaxError. However, all HTML pages in this project already use `<script type="module">`, so this is not a concern.

## Important Notes

- The exact list of ~6 unexported symbols will be determined during Step 1. The spec identifies the count as approximately 6 based on preliminary analysis, but the actual count may differ slightly.
- Symbols that are defined and used only WITHIN the same file do not need to be exported.
- Some symbols may be intentionally private (not used outside their file). Only export symbols that are actually referenced by other files.
- During sections 06-10 (import addition), additional unexported symbols may be discovered. When that happens, the same pattern applies: add the symbol to the definition file's export block. This section establishes the methodology; later sections may need to apply it incrementally.
- The `filterImportExport` regex `^export \{` matches only lines that START with `export {`. Multi-line export blocks or indented exports would not be stripped. All current export statements in the codebase use the single-line `export { ... };` pattern at file end, so new additions should follow this same pattern.

## Files Modified (Actual)

- `Sources/Skill.js` — Added `const` keyword to `PATHFINDER_SKILL_SET` bare assignment (was implicit global), added to export block
- `Sources/SkillEffect.js` — Added 2 symbols to export block: `DOES_IT_COUNT_AS_DIFFICULT_TERRAIN_EXCLUDING_IMPASSABLE_TERRAIN`, `NUM_OF_TARGETS_FOES_DEFEATED_BY_TARGET_TEAM_ON_CURRENT_TURN_NODE`
- `Sources/SkillEffectBattleContext.js` — Added 9 symbols to export blocks (various damage reduction, follow-up, and combat effect nodes)
- `Sources/SkillEffectAliases.js` — Added 1 symbol to export block: `HIGHEST_HP_AMONG_SKILL_OWNERS_ALLIES`
- `Tests/UnexportedSymbols.test.js` — New test file (8 tests: 2 broad dynamic-import smoke tests + 6 specific symbol verification tests)

**Deviation from plan**: 13 unexported symbols found (vs ~6 estimated). Also included `Skill.js` (not a SkillEffect file) because `PATHFINDER_SKILL_SET` blocked the entire import chain. `SkillEffectHooks.js` did not need changes (all symbols already exported).

## Success Criteria

1. ~~All ~6~~ All 13 previously unexported symbols are now listed in `export { ... }` blocks of their respective definition files
2. Dynamic import of each SkillEffect-related file succeeds in Vitest without ReferenceError or missing export errors
3. `npm test` passes (concatenation system still works) — 2 pre-existing timeout failures unrelated to exports
4. No new circular dependencies introduced (`npx madge --circular Sources/` remains at 0) — verified via Phase5Baseline.test.js