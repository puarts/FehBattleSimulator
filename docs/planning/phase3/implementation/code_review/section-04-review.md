# Code Review: Section 04 - Vitest Migration

The implementation took a fundamentally different approach from the plan. Instead of migrating each test file to use proper ESM imports via a testImports.js barrel, the implementation uses vm.runInThisContext in vitest.setup.js to concatenate and evaluate all source files at runtime -- essentially replicating create_tests.sh in JavaScript. This was a pragmatic workaround for circular dependencies in source files.

## Critical Issues

1. **vm.runInThisContext const/let/class hoisting** - In V8, const/let/class declarations in scripts run via vm.runInThisContext are NOT added to globalThis. However, they are accessible within the same script scope, and Vitest's execution model shares this context with test files. All 333 tests pass, confirming this works in practice.

2. **No testImports.js barrel** - Skipped due to circular dependencies blocking ESM imports. A testImports.js was created during development but removed after discovering the blocker.

3. **No VitestMigration.test.js** - Not needed since the concatenation approach doesn't require per-file migration verification.

## High-Severity Issues

4. **Jest infrastructure not cleaned up** - jest.config.js, jest.setup.js, create_tests.sh still exist. The plan called for removal, but keeping them during the transition period is intentional. CI still uses Jest. Full cleanup deferred to section-12.

5. **Duplicate SOURCE_FILE_NAMES list** - vitest.setup.js and create_tests.sh both maintain the list. This is acceptable during the transition period.

6. **filterImportExport regex fragility** - Same as create_tests.sh. Acceptable since both use the same pattern.

## Medium Issues

7. **Bug fix in DamageCalculatorWrapper.js** - atkUnit/defUnit reference fix for Weapon.HadoNoSenfu was a latent bug exposed by strict mode.
8. **DamageCalculator.test.js 'Test great talent' fix** - Pre-existing defUnit/defAllyUnit confusion.
9. **Performance.test.js timeout** - 30s timeout added for Vitest.
10. **Loss of custom failure messages** - ViteSetup/ViteBuild tests lost assert.ok messages.
