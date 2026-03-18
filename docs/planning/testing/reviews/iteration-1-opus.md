# Opus Review

**Model:** claude-opus-4
**Generated:** 2026-03-18

---

## Overall Assessment

The plan is well-structured and thoughtful, with clear phasing and a pragmatic approach (regression-first, not ground-truth-first). However, there are several concrete issues that will cause problems during implementation.

## Critical Issues

### 1. Coverage will not work with the concatenation approach

**Section 4 (Coverage)** proposes `collectCoverageFrom: 'Sources/**/*.js'`, but Jest coverage instruments files at the module/import level. Since all source files are concatenated into a single `All.test.js`, V8 coverage will report coverage only for `All.test.js` -- not for individual source files in `Sources/`. The `collectCoverageFrom` glob will match zero files because Jest never loads those files as modules.

Options include:
- Accept that coverage reports will be per-line within `All.test.js` (much less useful, no per-file breakdown)
- Switch to a module-based test architecture (large refactor, contradicts the constraint)
- Use a source-map approach: generate a source map during concatenation so V8 can map back to original files

### 2. `create_tests.sh` category design has a subtle correctness issue

`run_tests.sh` unconditionally calls `./create_tests.sh` on line 3 before running tests. If you add category support to `create_tests.sh`, you must also update `run_tests.sh` to pass the category argument through. The plan says this but the interaction is not explicit enough for an implementer.

### 3. Performance test flakiness in CI

GitHub Actions runners have highly variable performance -- shared runners can be 3-5x slower than local machines. A 2x multiplier is almost certainly too tight. Recommendations:
- Use 5x or higher multiplier for CI
- Or skip performance tests in CI
- Or use relative benchmarking (compare before/after in same CI run)

## Moderate Issues

### 4. BattleScenarioBuilder API mismatch

Section 3.2 shows `withAttacker(configFn)` taking a callback, but Section 6.3 shows `withAttacker(attacker)` taking a built Unit. Pick one pattern. The simpler approach (passing a built unit) is probably better.

### 5. Missing: global state cleanup between tests

`g_appData` is set as a global side effect. With 500+ tests, global state pollution will cause order-dependent failures. Need `beforeEach`/`afterEach` strategy for resetting globals.

### 6. Missing: skill registration side effects

The DSL registration system registers skills into global maps at load time. If tests dynamically register skills, those persist for subsequent tests.

### 7. `jest-coverage-report-action` compatibility concern

The action expects standard Jest output. This project's non-standard concatenation pipeline may not be compatible. Need `test-script` parameter or may not work.

### 8. Multi-unit scenario complexity

`addAlly`/`addFoe` in BattleScenarioBuilder needs to properly register units with the unit manager, set positions, and handle group IDs. Non-trivial and not addressed.

## Minor Issues

### 9. TestHelper.test.js is unnecessary overhead
Helpers are validated indirectly by tests that use them.

### 10. Category boundary clarity
The boundary between `skill` and `combat` categories is blurry. Clarify: `skill` is for specific skill IDs, `combat` for game mechanics regardless of skills.

### 11. 500+ test target is vague
No breakdown of how many tests per category.

### 12. New test file registration in create_tests.sh
9 new test files but no concrete list of additions to `TEST_FILE_NAMES` or how category mapping is stored.

### 13. ESLint for new test files
Ensure ESLint config covers new files.

## Suggestions

1. Address coverage architecture problem first
2. Add "Global State Management" section
3. Define BattleScenarioBuilder.execute() contract precisely
4. Include example of category mapping in create_tests.sh
5. Add a smoke test for concatenation pipeline
