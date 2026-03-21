diff --git a/Sources/SkillEffectCore.js b/Sources/SkillEffectCore.js
index 198e2ca1..b1a76a87 100644
--- a/Sources/SkillEffectCore.js
+++ b/Sources/SkillEffectCore.js
@@ -2435,5 +2435,4 @@ export { WrapBoolNode, TO_BOOL, AndNode, AND_NODE, OrNode, OR_NODE, NotNode, NOT
 export { AddNode, ADD_NODE, SubNode, SUB_NODE, MultNode, MULT_NODE, MultTruncNode, MULT_TRUNC_NODE, MultCeilNode, MULT_CEIL_NODE, MULT_ADD_NODE, MULT_MAX_NODE, MULT_ADD_MAX_NODE, ADD_MULT_NODE, ADD_MULT_MAX_NODE, ADD_MAX_NODE, MAX_ADD_NODE, MinNode, MIN_NODE, MaxNode, MAX_NODE, GREATER, SumNode };
 export { SUM_NODE, IsOddNode, IS_ODD_NODE, IS_EVEN_NODE, SomeNode, SOME_NODE, CompareNode, GtNode, GT_NODE, GteNode, GTE_NODE, LtNode, LT_NODE, LteNode, LTE_NODE, EqNode, EQ_NODE, IfNode, IF_NODE, IF, UNLESS_NODE, IfElseNode, IF_ELSE_NODE, IF_ELSE, IfExpressionNode, IF_EXPRESSION_NODE };
 export { TernaryConditionalNumberNode, COND_OP, IF_VALUE_NODE, StoreNumNode, ReadNumNode, READ_NUM_NODE, READ_NUM_AT_NODE, NumThatIsNode, XNumNode, X_NUM_NODE, ApplyXNode, APPLY_X_NODE, USE_X_NODE, APPLY_X_NODES, CacheNode, CACHE_NODE, ReadCacheNode, READ_CACHE_NODE, SET_SKILL_FUNCS, makeArray };
-export { setCustomSkillRegistry };
 export { EffectNode, XNumberNode, X };
diff --git a/Tests/section06-remaining-cycles.test.js b/Tests/section06-remaining-cycles.test.js
index e099a61b..758ff574 100644
--- a/Tests/section06-remaining-cycles.test.js
+++ b/Tests/section06-remaining-cycles.test.js
@@ -53,7 +53,7 @@ describe('Section 6: Remaining cycle resolution', () => {
 
         it('SkillEffectCore.js exports setCustomSkillRegistry', () => {
             const content = readSource('SkillEffectCore.js');
-            expect(content).toMatch(/export\s*\{[^}]*setCustomSkillRegistry[^}]*\}/);
+            expect(content).toMatch(/export\s+(function\s+setCustomSkillRegistry|\{[^}]*setCustomSkillRegistry[^}]*\})/);
         });
 
         it('CustomSkill.js imports and calls setCustomSkillRegistry', () => {
diff --git a/docs/planning/phase4-layer-violations/layer-violation-inventory.md b/docs/planning/phase4-layer-violations/layer-violation-inventory.md
new file mode 100644
index 00000000..07f20290
--- /dev/null
+++ b/docs/planning/phase4-layer-violations/layer-violation-inventory.md
@@ -0,0 +1,99 @@
+# Layer Violation Inventory
+
+**Scan date**: 2026-03-22
+**Branch**: `vite-migration` (at commit `a40ab010`)
+**Scanner**: Code scan + cross-reference with Section 08 logs
+
+## Baseline Test Results
+
+- **Vitest**: 37 files, 557 tests — all pass
+- **ESLint**: clean (after fixing duplicate export in SkillEffectCore.js)
+- **madge --circular Sources/**: zero cycles
+
+## Inventory
+
+### Category 1: StatusIndex Aliases — 0 violations
+
+**Expected**: 25-30 violations (bare `ATK`/`DEF`/`RES`/`SPD` used as StatusIndex values in L1-L3 files)
+
+**Found**: 0
+
+**Explanation**: All files already use the fully qualified `StatusIndex.ATK` etc. imported from `StatusConstants.js` (L1). No bare StatusIndex aliases exist in any layer. The DSL functions `ATK`, `SPD`, `DEF`, `RES` in `SkillEffect.js` (L5) are **StatsNode factory functions** (not StatusIndex aliases) — they create stat vectors and are unrelated to the StatusIndex enum.
+
+**Impact on Section 02**: Section 02 (StatusIndex unification) may need scope revision — the expected alias unification work is already done. Possible remaining work: rename `StatusIndex.ATK` → `StatusIndex.Atk` for naming convention consistency, and clarify the naming distinction between DSL `ATK()` functions and `StatusIndex.ATK` enum values.
+
+### Category 2: GameMode — 4 files, 19 references
+
+`GameMode` is defined in `DamageCalculator.js` (L4).
+
+| # | File (Layer) | Symbol | Source File (Layer) | Type | References |
+|---|-------------|--------|-------------------|------|------------|
+| 1 | BattleMap.js (L3) | GameMode | DamageCalculator.js (L4) | **Layer violation** (L3→L4) | lines 2759, 2878 |
+| 2 | SkillEffect.js (L5) | GameMode | DamageCalculator.js (L4) | Missing import (L5→L4 valid) | lines 4523, 4533 |
+| 3 | VueComponents.js (L7) | GameMode | DamageCalculator.js (L4) | Missing import (L7→L4 valid) | 14 references |
+| 4 | SkillImpl.js (L6) | GameMode | DamageCalculator.js (L4) | Missing import (L6→L4 valid) | line 7956 |
+
+**True layer violation**: 1 (BattleMap.js L3→L4)
+**Missing imports (valid direction)**: 3
+
+**Resolution plan**: Section 03 — Move `GameMode` from `DamageCalculator.js` (L4) to `StatusConstants.js` (L1). This resolves the BattleMap.js layer violation and allows all files to import from L1.
+
+### Category 3: moveStructureToTrashBox — 1 file, 1 reference
+
+| # | File (Layer) | Symbol | Source File (Layer) | Type | References |
+|---|-------------|--------|-------------------|------|------------|
+| 5 | SkillEffect.js (L5) | moveStructureToTrashBox | BattleSimulatorBase.js (L7) | **Layer violation** (L5→L7) | line 4565 |
+
+**True layer violation**: 1
+
+**Note**: The `moveUnit` function also exists as a method on `BattleMap` class (L3) — this is a separate, same-layer function. Only the module-level `moveStructureToTrashBox` in BattleSimulatorBase.js is a violation. No files in L1-L6 call the BattleSimulatorBase.js `moveUnit` function.
+
+**Resolution plan**: Section 04 — Restructure to avoid L5→L7 dependency (callback pattern or function relocation).
+
+### Category 4: g_app — 2 files, ~126 references
+
+`g_app` is defined and exported in each `*Main.js` entry point (L8). It is also set as `window.g_app` at runtime.
+
+| # | File (Layer) | Symbol | Source File (Layer) | Type | References |
+|---|-------------|--------|-------------------|------|------------|
+| 6 | BattleSimulatorBase.js (L7) | g_app | *Main.js (L8) | **Layer violation** (L7→L8) | ~88 references |
+| 7 | Main_ImageProcessing.js (L7) | g_app | *Main.js (L8) | **Layer violation** (L7→L8) | ~38 references |
+
+**True layer violations**: 2
+
+**Note**: `g_app` imports from BattleSimulatorBase.js and Main_ImageProcessing.js were removed during Section 08 code review (auto-fix). The code still works because `g_app` is accessed as an implicit global via `window.g_app`. In strict ESM mode, this would break. Other `g_app` references in L8 files (Main_MouseAndTouch.js, Main_OriginalAi.js, *Main.js) are same-layer and not violations.
+
+**Resolution plan**: Deferred — requires entry-point architecture redesign.
+
+### Category 5: Baseline Fix (ESLint) — 1 issue
+
+| # | File (Layer) | Issue | Fix |
+|---|-------------|-------|-----|
+| 8 | SkillEffectCore.js (L5) | Duplicate export of `setCustomSkillRegistry` | Removed redundant `export { setCustomSkillRegistry }` (function already exported at definition) |
+| 9 | Tests/section06-remaining-cycles.test.js | Test regex only matched re-export pattern | Updated to also match `export function` pattern |
+
+## Summary by Category
+
+| Category | Expected | Found (violations) | Found (missing imports) | Total |
+|----------|----------|-------------------|------------------------|-------|
+| StatusIndex aliases | 25-30 | 0 | 0 | 0 |
+| GameMode | 5-8 | 1 | 3 | 4 |
+| moveUnit/moveStructureToTrashBox | 5-10 | 1 | 0 | 1 |
+| g_app | 2-4 | 2 | 0 | 2 |
+| Baseline fix (ESLint) | - | - | - | 2 |
+| **Total** | **~44** | **4** | **3** | **9** |
+
+## Deviation from Expected Count
+
+The actual violation count (7 code issues + 2 baseline fixes = 9) is **dramatically lower** than the expected 44. The primary reason:
+
+1. **StatusIndex aliases already resolved** (0 vs 25-30 expected): During Phase 4 Sections 02-07, all StatusIndex references were unified to the `StatusIndex.ATK` pattern with imports from `StatusConstants.js` (L1). No bare aliases remain.
+2. **moveUnit scope smaller than expected** (1 vs 5-10 expected): Only `moveStructureToTrashBox` is called cross-layer. Other `moveUnit` references are either BattleMap instance methods (L3, not the BattleSimulatorBase function) or parameter names.
+3. **g_app partially fixed** (2 vs 2-4 expected): Section 08 code review removed imports; remaining issues are runtime `window.g_app` access patterns.
+
+## Impact on Subsequent Sections
+
+- **Section 02 (StatusIndex unification)**: May be **skippable or significantly reduced** in scope. The only remaining work would be optional naming convention changes (e.g., `StatusIndex.ATK` → `StatusIndex.Atk`).
+- **Section 03 (GameMode relocation)**: Still needed. Move GameMode to StatusConstants.js (L1) and add imports to 4 files.
+- **Section 04 (moveUnit separation)**: Scope reduced to 1 violation: `moveStructureToTrashBox` call in SkillEffect.js line 4565.
+- **Section 05 (Final validation)**: Scope adjusted to reflect actual violation count.
