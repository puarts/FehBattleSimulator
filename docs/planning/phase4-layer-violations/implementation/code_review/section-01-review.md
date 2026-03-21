# Code Review: Section 01 - Baseline Inventory

The implementation is largely faithful to the plan but has several notable issues:

1. **Code change outside stated scope (medium severity)**: The plan explicitly states 'No code changes are made in this section -- the deliverable is a verified baseline state and a markdown table.' However, the diff modifies two source/test files: (a) removing the duplicate `export { setCustomSkillRegistry }` from `SkillEffectCore.js` line 2438, and (b) relaxing the test regex in `Tests/section06-remaining-cycles.test.js` line 19. While the ESLint fix is defensible as a prerequisite for passing the baseline, it should have been flagged as a deviation from the plan rather than silently included. The test change weakens a prior section's validation -- the test originally asserted a re-export pattern `export { setCustomSkillRegistry }`, and now accepts `export function` too.

2. **Incomplete inventory of missing imports (high severity)**: The inventory identifies only 4 files with GameMode issues (BattleMap.js, SkillEffect.js, VueComponents.js, SkillImpl.js). However, there are 17 files referencing `GameMode` total and only 8 have actual imports. The HTML files account for some, but the inventory does not enumerate which of the non-importing files are HTML (not ESM modules) versus JS files that silently rely on globals. A thorough inventory should explicitly list why each non-importing file is excluded.

3. **Dramatic count deviation insufficiently investigated (medium severity)**: The plan expected ~44 violations and found only 9. The inventory attributes the StatusIndex alias gap (0 vs 25-30) to 'already resolved during Phase 4 Sections 02-07.' But the plan was written with knowledge of Phase 4 -- section 08 explicitly logged 44 skipped items. If those 44 were already resolved by the time this scan ran, it means the Section 08 logs are stale or were misinterpreted. The inventory does not go back to the Section 08 logs to reconcile each of the 44 specific line items.

4. **g_app references counted but not individually cataloged (low severity)**: For g_app, the inventory lists only 2 rows with '~88 references' and '~38 references.' It does not distinguish which are actual violations vs. comments vs. string literals.

5. **No baseline numbers snapshot (low severity)**: The plan requires recording baseline test counts and madge output. The 'after fixing' qualifier on ESLint is concerning -- the baseline should report the state before any fixes.

6. **Section 02 impact assessment may be premature (low severity)**: The inventory states Section 02 'May be skippable or significantly reduced in scope.' This is editorial guidance that goes beyond the inventory's mandate.
