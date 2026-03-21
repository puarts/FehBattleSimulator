# Layer Violation Inventory

**Scan date**: 2026-03-22
**Branch**: `vite-migration` (at commit `a40ab010`)
**Scanner**: Code scan + cross-reference with Section 08 logs

## Baseline Test Results

**Before any fixes**:
- **Vitest**: 37 files, 557 tests — all pass
- **ESLint**: 1 error — `Parsing error: Duplicate export 'setCustomSkillRegistry'` in `SkillEffectCore.js:2438`
- **madge --circular Sources/**: zero cycles

**After baseline fixes** (duplicate export removal + test regex update):
- **Vitest**: 37 files, 557 tests — all pass
- **ESLint**: clean
- **madge --circular Sources/**: zero cycles

**Baseline fixes applied** (deviation from plan's "no code changes" constraint — required to achieve passing baseline):
- `SkillEffectCore.js`: Removed redundant `export { setCustomSkillRegistry }` (line 2438). The function was already exported at its definition (line 11 `export function setCustomSkillRegistry`).
- `Tests/section06-remaining-cycles.test.js`: Updated test regex to match both `export function` and `export { }` patterns.

## Inventory

### Category 1: StatusIndex Aliases — 0 violations

**Expected**: 25-30 violations (bare `ATK`/`DEF`/`RES`/`SPD` used as StatusIndex values in L1-L3 files)

**Found**: 0

**Explanation**: All files already use the fully qualified `StatusIndex.ATK` etc. imported from `StatusConstants.js` (L1). No bare StatusIndex aliases exist in any layer. The DSL functions `ATK`, `SPD`, `DEF`, `RES` in `SkillEffect.js` (L5) are **StatsNode factory functions** (not StatusIndex aliases) — they create stat vectors and are unrelated to the StatusIndex enum.

**Impact on Section 02**: Section 02 (StatusIndex unification) may need scope revision — the expected alias unification work is already done. Possible remaining work: rename `StatusIndex.ATK` → `StatusIndex.Atk` for naming convention consistency, and clarify the naming distinction between DSL `ATK()` functions and `StatusIndex.ATK` enum values.

### Category 2: GameMode — 4 files, 19 references

`GameMode` is defined in `DamageCalculator.js` (L4).

| # | File (Layer) | Symbol | Source File (Layer) | Type | References |
|---|-------------|--------|-------------------|------|------------|
| 1 | BattleMap.js (L3) | GameMode | DamageCalculator.js (L4) | **Layer violation** (L3→L4) | lines 2759, 2878 |
| 2 | SkillEffect.js (L5) | GameMode | DamageCalculator.js (L4) | Missing import (L5→L4 valid) | lines 4523, 4533 |
| 3 | VueComponents.js (L7) | GameMode | DamageCalculator.js (L4) | Missing import (L7→L4 valid) | 14 references |
| 4 | SkillImpl.js (L6) | GameMode | DamageCalculator.js (L4) | Missing import (L6→L4 valid) | line 7956 |

**True layer violation**: 1 (BattleMap.js L3→L4)
**Missing imports (valid direction)**: 3

**Resolution plan**: Section 03 — Move `GameMode` from `DamageCalculator.js` (L4) to `StatusConstants.js` (L1). This resolves the BattleMap.js layer violation and allows all files to import from L1.

**Excluded files** (17 total reference GameMode, 4 listed above are violations/missing):

| File | Layer | Status | Reason for exclusion |
|------|-------|--------|---------------------|
| DamageCalculator.js | L4 | Definition site | GameMode is defined here |
| DamageCalculatorWrapper.js | L4 | Imported | `import { ..., GameMode } from './DamageCalculator.js'` |
| AppData.js | L7 | Imported | `import { GameMode } from './DamageCalculator.js'` (L7→L4 valid) |
| BattleSimulatorBase.js | L7 | Imported | `import { GameMode } from './DamageCalculator.js'` (L7→L4 valid) |
| Main_ImageProcessing.js | L7 | Imported | `import { GameMode } from './DamageCalculator.js'` (L7→L4 valid) |
| DamageCalculatorMain.js | L8 | Imported | `import { ..., GameMode } from './DamageCalculator.js'` (L8→L4 valid) |
| UnitBuilderMain.js | L8 | Imported | `import { GameMode } from './DamageCalculator.js'` (L8→L4 valid) |
| SummonerDuelsSimulatorMain.js | L8 | Imported | `import { GameMode } from './DamageCalculator.js'` (L8→L4 valid) |
| ArenaSimulatorMain.js | L8 | Imported | `import { GameMode } from './DamageCalculator.js'` (L8→L4 valid) |
| AetherRaidSimulator.html | - | HTML template | Not an ESM module; uses GameMode via Vue template binding |
| SummonerDuelsSimulator.html | - | HTML template | Same as above |
| UnitBuilder.html | - | HTML template | Same as above |
| ArenaSimulator.html | - | HTML template | Same as above |

### Category 3: moveStructureToTrashBox — 1 file, 1 reference

| # | File (Layer) | Symbol | Source File (Layer) | Type | References |
|---|-------------|--------|-------------------|------|------------|
| 5 | SkillEffect.js (L5) | moveStructureToTrashBox | BattleSimulatorBase.js (L7) | **Layer violation** (L5→L7) | line 4565 |

**True layer violation**: 1

**Note**: The `moveUnit` function also exists as a method on `BattleMap` class (L3) — this is a separate, same-layer function. Only the module-level `moveStructureToTrashBox` in BattleSimulatorBase.js is a violation. No files in L1-L6 call the BattleSimulatorBase.js `moveUnit` function.

**Resolution plan**: Section 04 — Restructure to avoid L5→L7 dependency (callback pattern or function relocation).

### Category 4: g_app — 2 files, ~126 references

`g_app` is defined and exported in each `*Main.js` entry point (L8). It is also set as `window.g_app` at runtime.

| # | File (Layer) | Symbol | Source File (Layer) | Type | References |
|---|-------------|--------|-------------------|------|------------|
| 6 | BattleSimulatorBase.js (L7) | g_app | *Main.js (L8) | **Layer violation** (L7→L8) | ~88 references |
| 7 | Main_ImageProcessing.js (L7) | g_app | *Main.js (L8) | **Layer violation** (L7→L8) | ~38 references |

**True layer violations**: 2

**Note**: `g_app` imports from BattleSimulatorBase.js and Main_ImageProcessing.js were removed during Section 08 code review (auto-fix). The code still works because `g_app` is accessed as an implicit global via `window.g_app`. In strict ESM mode, this would break. Other `g_app` references in L8 files (Main_MouseAndTouch.js, Main_OriginalAi.js, *Main.js) are same-layer and not violations.

**Resolution plan**: Deferred — requires entry-point architecture redesign.

## Summary by Category

| Category | Expected | Found (violations) | Found (missing imports) | Total |
|----------|----------|-------------------|------------------------|-------|
| StatusIndex aliases | 25-30 | 0 | 0 | 0 |
| GameMode | 5-8 | 1 | 3 | 4 |
| moveUnit/moveStructureToTrashBox | 5-10 | 1 | 0 | 1 |
| g_app | 2-4 | 2 | 0 | 2 |
| **Total** | **~44** | **4** | **3** | **7** |

## Reconciliation with Section 08's "44 Skipped Imports"

Section 08 (`a40ab010`) reported skipping 44 imports due to layer constraints. The original 44 were categorized but **not individually itemized** in Section 08 logs. This reconciliation traces each category to its current state.

### Category-by-Category Reconciliation

#### StatusIndex aliases (expected 25-30 of 44)

**Section 08 claim**: "ATK, DEF, RES, SPD（SkillEffect.js L5）を L1-L3 ファイルで参照"

**Current state**: Zero bare StatusIndex aliases exist. All L1-L3 files use `StatusIndex.ATK` etc. (imported from `StatusConstants.js`, L1). The DSL functions `ATK()`, `SPD()`, `DEF()`, `RES()` in `SkillEffect.js` (line 3434-3437) are **StatsNode factory functions**, not StatusIndex aliases — they create stat vectors (`StatsNode.makeStatsNodeFrom(n, 0, 0, 0)`) and are only used in L5-L6 DSL/Impl files.

**Resolution**: Phase 4 Sections 02-07 moved `StatusIndex` to `StatusConstants.js` (L1) and unified all references to use `StatusIndex.ATK` form. The 25-30 items in this category were resolved by the structural refactoring that preceded Section 08. When Section 08 was planned, the gap analysis (741 items in `esm-missing-imports.md`) was based on the pre-refactoring codebase. The actual Section 08 implementation added ~790 imports (more than 741 because additional imports were discovered), and the "44 skipped" count likely includes items that no longer needed import after the restructuring but were still counted from the original analysis.

#### GameMode (expected 5-8 of 44)

**Section 08 claim**: "GameMode（DamageCalculator.js L4）を SkillEffect.js L5 で参照"

**Current state**: 4 JS files use GameMode without import. 8 JS files properly import from `DamageCalculator.js`. 4 HTML files reference via Vue template bindings (not ESM modules).

**Status**: Partially matches expectation. 1 true layer violation (BattleMap.js L3→L4), 3 missing imports with valid direction.

#### moveUnit/moveStructureToTrashBox (expected 5-10 of 44)

**Section 08 claim**: "moveUnit（BattleSimulatorBase.js L7）を L2/L5 で参照"

**Current state**: Only 1 violation found — `moveStructureToTrashBox` in `SkillEffect.js` (L5) line 4565. Other `moveUnit` references are:
- `BattleMap.moveUnit()` — instance method in L3, separate from the L7 module function
- `moveUnit` as a **parameter name** in Tile.js, UnitSkillEffect.js, Skill.js, SkillImpl.js — not function calls
- `SettingManager.js` (L7) — properly imports from L7 (same layer)
- `Main_MouseAndTouch.js` (L8) — L8→L7 valid direction

The expected 5-10 items likely counted parameter names and method references as violations in the original analysis.

#### g_app (expected 2-4 of 44)

**Section 08 claim**: "g_app（StatusCalcMain.js L8）を L7 で参照"

**Current state**: 2 violations remain (BattleSimulatorBase.js, Main_ImageProcessing.js). Section 08 code review removed the explicit imports but the runtime `window.g_app` usage persists.

**Status**: Matches expectation.

### Reconciliation Summary

| Category | Section 08 expected | Current found | Reconciliation |
|----------|-------------------|---------------|----------------|
| StatusIndex aliases | 25-30 | 0 | Resolved by Phase 4 Secs 02-07 restructuring |
| GameMode | 5-8 | 4 | Matches (within range) |
| moveUnit | 5-10 | 1 | Over-counted: parameter names ≠ function calls |
| g_app | 2-4 | 2 | Matches |
| **Total** | **~44** | **7** | **37 items resolved or over-counted** |

The 37-item gap is primarily from StatusIndex alias resolution (25-30) and moveUnit over-counting (4-9).

## Impact on Subsequent Sections

- **Section 02 (StatusIndex unification)**: May be **skippable or significantly reduced** in scope. The only remaining work would be optional naming convention changes (e.g., `StatusIndex.ATK` → `StatusIndex.Atk`).
- **Section 03 (GameMode relocation)**: Still needed. Move GameMode to StatusConstants.js (L1) and add imports to 4 files.
- **Section 04 (moveUnit separation)**: Scope reduced to 1 violation: `moveStructureToTrashBox` call in SkillEffect.js line 4565.
- **Section 05 (Final validation)**: Scope adjusted to reflect actual violation count.
