So `ATK`, `SPD`, `DEF`, `RES` are used as DSL factory functions in CustomSkill.js (L6 importing from L5) -- this is valid. These are **not** StatusIndex aliases; they are `StatsNode` factories.

Now I truly understand the situation: The plan's assumption that `ATK = StatusIndex.Atk` aliases exist is **wrong**. The `ATK`/`SPD`/`DEF`/`RES` in SkillEffect.js are DSL functions, not numeric aliases. The plan was written based on the interview where the user said to "unify to StatusIndex.Atk," but the actual codebase doesn't have the problem described.

However, I need to write the section content as specified in the plan, since the section-01 (baseline inventory) will reveal the actual violations. The section should document both what the plan says AND flag the important distinction. The implementer needs to know that Step 1 is to verify the actual violations before making changes.

Now I'll write the section.

# Section 02: StatusIndex Alias Unification

## Overview

This section resolves Priority 1 layer violations by unifying all `ATK`/`DEF`/`RES`/`SPD` StatusIndex alias references across the codebase to use the canonical `StatusIndex.ATK` (etc.) form from `StatusConstants.js` (Layer 1). The goal is to eliminate any bare `ATK`/`DEF`/`RES`/`SPD` identifiers that represent numeric status indices, ensuring that lower-layer files (Layers 1-3) never need to import from Layer 5 (`SkillEffect.js`) just to get a numeric constant.

## Dependencies

- **section-01-baseline-inventory**: Must be completed first. That section produces the definitive list of all 44 layer violations and confirms baseline (`npm test` passes, `npx madge --circular Sources/` reports zero cycles). The output of section 01 determines exactly which files and symbols are affected.

## Background

### Layer Architecture

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

The strict rule: **Layer N may only import from Layers 0 through N-1.**

### The Problem

`SkillEffect.js` (Layer 5) exports shorthand identifiers `ATK`, `SPD`, `DEF`, `RES`. If any file in Layers 1-4 references these identifiers (whether as imported symbols or unresolved globals), it creates a layer violation because `SkillEffect.js` is in Layer 5.

### Critical Distinction: StatusIndex Aliases vs DSL StatsNode Functions

There are **two separate naming conventions** that share the same short names. Confusing them will cause incorrect changes:

1. **StatusIndex enum properties** (Layer 1, `StatusConstants.js`):
   ```javascript
   // Sources/StatusConstants.js, line 319
   const StatusIndex = Object.freeze({
       NONE: -1,
       ATK: 0,   // accessed as StatusIndex.ATK
       SPD: 1,   // accessed as StatusIndex.SPD
       DEF: 2,   // accessed as StatusIndex.DEF
       RES: 3,   // accessed as StatusIndex.RES
   });
   ```
   These are simple numeric values. Any layer can import `StatusIndex` from `StatusConstants.js`.

2. **DSL StatsNode factory functions** (Layer 5, `SkillEffect.js`):
   ```javascript
   // Sources/SkillEffect.js, lines 3434-3437
   const ATK = n => StatsNode.makeStatsNodeFrom(n, 0, 0, 0);
   const SPD = n => StatsNode.makeStatsNodeFrom(0, n, 0, 0);
   const DEF = n => StatsNode.makeStatsNodeFrom(0, 0, n, 0);
   const RES = n => StatsNode.makeStatsNodeFrom(0, 0, 0, n);
   ```
   These are **functions** that create `StatsNode` objects for the skill DSL. They are exported on line 9337 of `SkillEffect.js` and legitimately imported by Layer 5+ files (e.g., `CustomSkill.js` at Layer 6).

**The DSL functions (`ATK(5)`, `ATK_SPD(5)`, etc.) are NOT targets of this section's changes.** Only bare references to `ATK`/`SPD`/`DEF`/`RES` used as **numeric status index values** (not function calls) are in scope.

### Current State of the Codebase

Most Layer 1-4 files already use `StatusIndex.ATK` correctly. For example:
- `HeroInfoConstants.js` (L1): `case StatusIndex.ATK:` with `import { StatusIndex } from './StatusConstants.js'`
- `UnitCore.js` (L3): `this.getGreatTalent(StatusIndex.ATK)` with proper import
- `UnitBattle.js` (L3): `this.__getEvalStatsAdd()[StatusIndex.ATK]` with proper import
- `BattleContext.js` (L3): imports `StatusIndex` from `StatusConstants.js`

The violations to fix are specific files where `ATK`/`SPD`/`DEF`/`RES` are used as bare globals (numeric aliases) without a proper import, or where they are imported from Layer 5 when they should come from Layer 1.

### Plan's Naming Convention Note

The original plan references `StatusIndex.Atk` (PascalCase), but the actual codebase uses `StatusIndex.ATK` (UPPER_CASE). The existing convention (`UPPER_SNAKE_CASE` for enum constants) is consistent across the project. **Use the existing `StatusIndex.ATK` form, not `StatusIndex.Atk`.** The implementer should follow the actual code, not the plan's notation.

## Tests

Create the test file **before** making implementation changes.

### File: `/Users/studio/Documents/GitHub/FehBattleSimulator/Tests/StatusIndexUnification.test.js`

```javascript
// Tests/StatusIndexUnification.test.js
import { describe, it, expect } from 'vitest';
import { StatusIndex } from '../Sources/StatusConstants.js';

describe('StatusIndex Unification', () => {
    describe('StatusIndex values are correct', () => {
        // Verify StatusIndex enum values haven't changed during refactoring
        it('StatusIndex.ATK === 0', () => {
            expect(StatusIndex.ATK).toBe(0);
        });
        it('StatusIndex.SPD === 1', () => {
            expect(StatusIndex.SPD).toBe(1);
        });
        it('StatusIndex.DEF === 2', () => {
            expect(StatusIndex.DEF).toBe(2);
        });
        it('StatusIndex.RES === 3', () => {
            expect(StatusIndex.RES).toBe(3);
        });
    });

    describe('SkillEffect.js does not export StatusIndex numeric aliases', () => {
        // Verify that SkillEffect.js ATK/SPD/DEF/RES exports are functions (DSL), not numbers
        it('ATK/SPD/DEF/RES from SkillEffect.js are functions, not numbers', async () => {
            const se = await import('../Sources/SkillEffect.js');
            // These should be StatsNode factory functions, not numeric aliases
            expect(typeof se.ATK).toBe('function');
            expect(typeof se.SPD).toBe('function');
            expect(typeof se.DEF).toBe('function');
            expect(typeof se.RES).toBe('function');
        });
    });

    describe('Layer 1-3 files import StatusIndex from StatusConstants.js', () => {
        // Static analysis: verify no Layer 1-3 file imports ATK/SPD/DEF/RES from SkillEffect.js
        it('no Layer 1-3 source files import bare ATK/SPD/DEF/RES from SkillEffect.js', async () => {
            const fs = await import('fs');
            const path = await import('path');
            const sourcesDir = path.resolve(process.cwd(), 'Sources');

            // Layer 1-3 files that should NOT import from SkillEffect.js
            const layer1to3Files = [
                'StatusConstants.js', 'SkillConstants.js', 'HeroInfoConstants.js', 'UnitConstants.js', // L1
                'Skill.js', 'HeroInfo.js', 'Tile.js', 'Cell.js', 'Structures.js', 'Table.js',       // L2
                'UnitCore.js', 'UnitBattle.js', 'BattleContext.js', 'UnitManager.js', 'BattleMap.js', // L3
                'GlobalBattleContext.js',                                                               // L3
            ];

            for (const fileName of layer1to3Files) {
                const filePath = path.join(sourcesDir, fileName);
                if (!fs.existsSync(filePath)) continue;
                const content = fs.readFileSync(filePath, 'utf-8');
                // Check for imports of bare ATK/SPD/DEF/RES from SkillEffect.js
                const badImports = content.match(
                    /import\s+\{[^}]*\b(?:ATK|SPD|DEF|RES)\b[^}]*\}\s+from\s+['"]\.\/SkillEffect\.js['"]/g
                );
                expect(badImports, `${fileName} should not import ATK/SPD/DEF/RES from SkillEffect.js`).toBeNull();
            }
        });
    });

    describe('DSL functions remain functional after changes', () => {
        // Verify ATK_SPD and similar DSL stat functions still work
        it('ATK_SPD(5) returns a valid StatsNode', async () => {
            const { ATK_SPD } = await import('../Sources/SkillEffect.js');
            const node = ATK_SPD(5);
            expect(node).toBeDefined();
            // StatsNode should have atk/spd/def/res-like structure
            expect(node).toHaveProperty('evaluate');
        });
    });
});
```

### Existing Tests to Verify

After all changes, the following existing tests must continue to pass:

- `Tests/StatusConstants.test.js` -- validates `StatusIndex.ATK === 0` etc. and Skill.js re-export compatibility
- `Tests/MissingImports.test.js` -- validates `madge --circular Sources/` reports zero cycles
- All other tests via `npm test`

## Implementation Steps

### Step 1: Identify All StatusIndex Alias Violations

Using the inventory from section-01, extract all violations categorized as "StatusIndex alias." For each violation, confirm:

- **File path and layer**
- **Symbol used** (e.g., bare `ATK`, `SPD`, `DEF`, `RES`)
- **How it's used** (numeric index vs function call)
- **Current import source** (if any) vs required source

Search commands to run:
- Grep for `\bATK\b` / `\bSPD\b` / `\bDEF\b` / `\bRES\b` in all `Sources/*.js` files
- For each match, determine if it's: (a) `StatusIndex.ATK` (already correct), (b) a DSL function call like `ATK(5)` (leave alone), (c) a bare numeric reference without import (fix needed), (d) a string literal `"ATK"` (leave alone), (e) part of a compound name like `ATK_SPD` (leave alone)

### Step 2: Replace Bare Alias References

For each identified violation, replace the bare `ATK`/`SPD`/`DEF`/`RES` with `StatusIndex.ATK`/`StatusIndex.SPD`/`StatusIndex.DEF`/`StatusIndex.RES`.

**Find/Replace Collision Risks** -- the following patterns must be distinguished:

| Pattern | Example | Action |
|---------|---------|--------|
| StatusIndex alias (numeric) | `stats[ATK]`, `index === ATK` | Replace with `StatusIndex.ATK` |
| DSL function call | `ATK(5)`, `ATK_SPD(5)` | Leave unchanged |
| Already qualified | `StatusIndex.ATK` | Leave unchanged |
| Object key | `{ ATK: 10 }` | Evaluate per context |
| String literal | `"ATK"` | Leave unchanged |
| Part of compound name | `ATK_SPD`, `FOES_ATK_NODE` | Leave unchanged |

Use word-boundary-aware regex: `\bATK\b` that does NOT match when followed by `_` or preceded by `.` or followed by `(`.

### Step 3: Ensure Proper Imports

For every file where replacements were made, ensure it has:

```javascript
import { StatusIndex } from './StatusConstants.js';
```

If the file is in Layer 2+ and already imports `StatusIndex` from `./Skill.js` (which re-exports it), that is also acceptable.

### Step 4: Remove Any Alias Definitions (If Found)

If any file defines `const ATK = StatusIndex.ATK` as a local alias used as a numeric index (distinct from the DSL function), remove that definition after updating all its references.

Check `SkillEffect.js` exports on line 9337 -- the `ATK`, `SPD`, `DEF`, `RES` in the export list are the DSL functions and should **remain exported**. Do not remove these.

### Step 5: Verify No Layer 1-3 File Imports from Layer 5

After all changes, confirm that no file in Layers 1-3 imports `ATK`, `SPD`, `DEF`, or `RES` from `SkillEffect.js` or any other Layer 5+ file. The test in `StatusIndexUnification.test.js` covers this statically.

## Validation Checklist

After completing all changes:

1. `npm test` -- all tests pass (including new `StatusIndexUnification.test.js`)
2. `npx madge --circular Sources/` -- zero cycles
3. Grep for remaining bare `ATK`/`DEF`/`RES`/`SPD` references in Layer 1-4 files (excluding DSL function names, string literals, and `StatusIndex.XXX` qualified references) -- should find zero
4. Existing `Tests/StatusConstants.test.js` passes (re-export compatibility maintained)

## Files to Create/Modify

| File | Action |
|------|--------|
| `Tests/StatusIndexUnification.test.js` | Create (new test file) |
| Various `Sources/*.js` files (per inventory) | Modify (replace bare aliases with `StatusIndex.XXX`) |
| Various `Sources/*.js` files (per inventory) | Modify (add `import { StatusIndex }` if missing) |

## Implementation Results

### Scope Reduction

Section 01 found **zero** StatusIndex alias violations. Per Risk Notes below, scope was reduced to:
- Writing the verification test (`StatusIndexUnification.test.js`)
- Confirming the clean state

No source files were modified — all L1-4 files already use `StatusIndex.ATK` correctly.

### Files Created

| File | Action |
|------|--------|
| `Tests/StatusIndexUnification.test.js` | Created — 3 tests: DSL function type check, L1-4 import guard, DSL functionality |

### Test Results

- All 564 tests pass (38 files, including new test)
- Zero circular dependencies

### Code Review Improvements

- Removed duplicate StatusIndex value assertions (already covered by StatusConstants.test.js)
- Extended check scope from L1-3 to L1-4 (added DamageCalculator.js etc.)
- Extended import source check to all Layer 5 files (7 files vs 1)
- Added multi-line import matching

## Commit

Single commit after all changes:

```
refactor(phase4): StatusIndexエイリアスをStatusIndex.ATK形式に統一
```

## Risk Notes

- **If section-01 reveals that no actual StatusIndex alias violations exist** (i.e., all Layer 1-3 files already use `StatusIndex.ATK` correctly), this section's scope reduces to writing the verification test and confirming the clean state. The DSL functions `ATK`/`SPD`/`DEF`/`RES` in `SkillEffect.js` are legitimate Layer 5 exports and should not be changed. ← **This case applied.**
- **If unexpected violations are found in files not listed in the inventory**, stop and report to the user before proceeding.
- **The plan references `StatusIndex.Atk` (PascalCase) but the actual codebase uses `StatusIndex.ATK` (UPPER_CASE).** Always follow the actual codebase convention. Do not rename StatusIndex properties.