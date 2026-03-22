# Section 09 Code Review Interview

## Context

Section 09 was originally planned to fully remove the `vm.runInThisContext` concatenation approach in `vitest.setup.js` and switch all test files to ESM imports. During implementation, **deep circular dependencies** were discovered in the SkillEffect* module group:

1. `SkillEffect.js ↔ SkillEffectUnit.js` — class hierarchy cycle at module evaluation time
2. `SkillEffect.js ↔ SkillEffectField.js` — `SingleEffectNode` cross-reference cycle
3. Additional potential cycles in SkillImpl files (hundreds of missing imports)

These cycles were not caught in sections 1-6 because those focused on the main module layer structure, not the internal SkillEffect DSL module group. The cycles manifest at ESM module evaluation time (not just runtime), making them impossible to resolve with simple import reordering.

**User decision**: Proceed with **hybrid approach** — maintain concatenation, add ESM imports to test files for explicit dependency documentation.

## Review Findings Triage

### Auto-fixed
- Fixed misleading test name in EsmImportSanity.test.js
- Added TODO comment in vitest.setup.js explaining why concatenation is maintained

### Let go (accepted scope reduction)
- vitest.setup.js concatenation retained (blocked by circular deps)
- vite.config.js unchanged (depends on concatenation)
- TestGlobals.js not ESM-ized (depends on concatenation)
- g_appData isolation not implemented (depends on full ESM)
- Only enum/constant imports added (class imports trigger broken ESM chains)

### Deferred (needs separate deep-plan)
- Full SkillEffect* circular dependency resolution
- Complete vm.runInThisContext removal
- TestGlobals.js ESM-ification
