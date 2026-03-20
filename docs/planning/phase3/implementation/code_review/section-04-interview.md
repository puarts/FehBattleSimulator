# Code Review: Section 04 - Vitest Migration

**Date:** 2026-03-20

## Auto-fixes

None required. The review findings are either inherent to the deviation from plan (which was approved by the user) or are acceptable during the transition period.

## Let Go

- **vm.runInThisContext hoisting**: All 333 tests pass. V8 script scope sharing works as expected in Vitest.
- **No barrel file**: Not viable with circular dependencies. Future work after source files are properly ESM-migrated.
- **Jest cleanup deferred**: Intentionally kept for section-12 (CI cleanup). Both test runners coexist during transition.
- **Duplicate file lists**: Acceptable during transition. Will be unified when Jest is removed.
- **Bug fixes bundled**: DamageCalculatorWrapper.js fix and DamageCalculator.test.js fix are latent bugs exposed by strict mode. Better to fix now than defer.
- **Performance timeout**: Vitest has 5s default vs Jest's longer timeout. 30s is appropriate for full hero combat benchmarks.
- **Lost failure messages**: Minor diagnostic quality loss. Tests still fail with clear stack traces.
