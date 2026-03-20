Now I have enough context. Let me produce the section content.

# Section 3: Vitest Setup

## Overview

This section covers the installation and configuration of Vitest as the new test runner for the project. It corresponds to **Step B.1 and B.4** of the Phase 3 plan. The goal is to create a working Vitest configuration that can discover and run test files, while preserving the existing Jest setup during the transition period.

After this section is complete, the next section (section-04-vitest-migration) will handle the actual migration of the 18 test files from the Jest/`create_tests.sh` concatenation approach to independent Vitest test files with proper imports.

## Dependencies

- **section-01-vite-setup**: Must be completed first. Vitest shares the Vite configuration (`vite.config.js`) and requires Vite to be installed as a dependency. The `vite.config.js` created in section-01 will be extended with a `test` block in this section.

## Background

### Current Test Infrastructure

The project currently uses Jest 29.7.0 with jsdom. Tests are not run directly -- instead, `create_tests.sh` concatenates all 44 source files and 18 test files (plus 1 test utility file) into a single `All.test.js`, stripping import/export statements via `grep -v`. Jest then runs this monolithic file.

Key files in the current setup:
- `/Users/studio/Documents/GitHub/FehBattleSimulator/jest.config.js` -- Jest configuration (jsdom environment, `testMatch: ["**/All.test.js"]`, `setupFiles: ["./jest.setup.js"]`)
- `/Users/studio/Documents/GitHub/FehBattleSimulator/jest.setup.js` -- Polyfills for `performance`, `TextEncoder`, `TextDecoder`
- `/Users/studio/Documents/GitHub/FehBattleSimulator/create_tests.sh` -- Concatenation script
- `/Users/studio/Documents/GitHub/FehBattleSimulator/Tests/TestGlobals.js` -- Test utility globals (creates `g_testHeroDatabase`, defines `test_UnitManager`)
- `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/TestUtilities.js` -- Test helper classes (`UnitBuilder`, `BattleScenarioBuilder`, `resetGlobalTestState`, etc.)

### jest.setup.js Contents

The current setup file provides three polyfills:
```javascript
globalThis.performance = require('perf_hooks').performance;
const { TextEncoder, TextDecoder } = require('util');
globalThis.TextEncoder = TextEncoder;
globalThis.TextDecoder = TextDecoder;
```

In Vitest with `environment: 'jsdom'`, these are likely already available. The setup file must be migrated but each polyfill's necessity should be verified.

### Test File Count

There are 18 test files in `/Users/studio/Documents/GitHub/FehBattleSimulator/Tests/`:
`BeginningOfTurnSkillHandler.test.js`, `BuildFilter.test.js`, `CombatFlow.test.js`, `DamageCalculator.test.js`, `DamageReduction.test.js`, `DslNode.test.js`, `EsmValidation.test.js`, `FollowUpAttack.test.js`, `GetRequirements.test.js`, `Performance.test.js`, `SimpleUtility.test.js`, `SkillEffect.test.js`, `SkillRegression.test.js`, `SmokeTest.test.js`, `SpecialCount.test.js`, `StatusEffect.test.js`, `TestHelper.test.js`, `UnitManager.test.js`.

No test files currently use `jest.fn()`, `jest.mock()`, or `jest.spyOn()` -- a grep confirmed zero matches for `jest.` across the test directory. This means the jest-to-vi API migration (section-04) will be minimal.

---

## Tests FIRST

These tests validate that the Vitest setup is correct and functional. They should be written before or alongside the configuration work.

### Test: Vitest configuration smoke test

**File**: `/Users/studio/Documents/GitHub/FehBattleSimulator/Tests/VitestSetup.test.js`

This is a minimal test file to verify the Vitest environment is properly configured. It does NOT need to be added to `create_tests.sh` (it is Vitest-only).

```javascript
// Vitest setup verification test
// This file validates the Vitest configuration works correctly.

describe('Vitest environment setup', () => {
    test('globals are available without import (globals: true)', () => {
        // describe, test, expect should be available without importing from vitest
        expect(true).toBe(true);
    });

    test('jsdom environment provides document and window', () => {
        expect(typeof document).toBe('object');
        expect(typeof window).toBe('object');
        expect(document.createElement).toBeDefined();
    });

    test('performance API is available', () => {
        expect(globalThis.performance).toBeDefined();
        expect(typeof performance.now).toBe('function');
    });

    test('TextEncoder and TextDecoder are available', () => {
        expect(globalThis.TextEncoder).toBeDefined();
        expect(globalThis.TextDecoder).toBeDefined();
    });
});
```

### Test: Configuration validation (manual verification checklist)

These are verification steps to run after configuration, not automated tests:

- `npx vitest run Tests/VitestSetup.test.js` exits with code 0 and reports all tests passing
- `npx vitest run` discovers test files matching `Tests/**/*.test.js` pattern (may fail until section-04 adds imports, but should at least discover files)
- The existing `npm test` (Jest) continues to work unchanged during the transition period

---

## Implementation

### 3.1 Install Vitest

Add `vitest` to devDependencies in `/Users/studio/Documents/GitHub/FehBattleSimulator/package.json`:

```
npm install --save-dev vitest
```

The `@vitejs/plugin-vue` package should already be installed from section-01. Vitest leverages the Vite configuration so no additional plugins are needed for the test runner itself.

### 3.2 Add Vitest Configuration to vite.config.js

**File to modify**: `/Users/studio/Documents/GitHub/FehBattleSimulator/vite.config.js`

Add a `test` block to the existing Vite configuration (created in section-01). The key settings:

- **`globals: true`** -- Makes `describe`, `it`, `test`, `expect` available without importing from `vitest`. This is essential for Jest compatibility since all 18 existing test files use these as globals.
- **`environment: 'jsdom'`** -- Matches the current Jest jsdom environment. Required because tests reference `document`, `window`, and DOM APIs.
- **`setupFiles`** -- Points to the new Vitest setup file (see 3.3 below).
- **`include: ['Tests/**/*.test.js']`** -- Discovers test files directly from the Tests directory. This replaces the `create_tests.sh` concatenation approach. Note: the existing Jest config uses `testMatch: ["**/All.test.js"]` which will remain unchanged.
- **`pool: 'threads'`** with **`poolOptions.threads.singleThread: true`** -- Forces single-threaded execution during the transition period. The existing tests were designed to run in a single concatenated file and likely share global state (e.g., `g_testHeroDatabase`). Parallel execution would cause flaky tests. This can be relaxed after all tests are confirmed independent.

The `test` block should be nested inside the `defineConfig` call alongside the existing `build`, `root`, and other settings from section-01.

### 3.3 Create Vitest Setup File

**File to create**: `/Users/studio/Documents/GitHub/FehBattleSimulator/vitest.setup.js`

This file replaces `jest.setup.js`. It serves as the `setupFiles` entry for Vitest.

The current `jest.setup.js` provides three polyfills using CommonJS `require()`:
1. `globalThis.performance` from `perf_hooks`
2. `globalThis.TextEncoder` from `util`
3. `globalThis.TextDecoder` from `util`

For the Vitest setup file:
- Use ESM syntax (`import`) instead of `require()`
- Verify which polyfills are actually needed in Vitest's jsdom environment. Vitest runs on Node.js where `performance`, `TextEncoder`, and `TextDecoder` are globally available in Node 18+. The jsdom environment also provides these. **It is likely that none of these polyfills are needed**, but they should be included conditionally (only set if not already defined) to be safe during the transition.
- The setup file should include a comment explaining it replaces `jest.setup.js` and which polyfills are retained/removed.

### 3.4 Add npm Script for Vitest

**File to modify**: `/Users/studio/Documents/GitHub/FehBattleSimulator/package.json`

Add Vitest-specific scripts alongside the existing Jest scripts (do NOT replace them yet -- both must coexist during the transition):

```json
{
  "scripts": {
    "test": "jest && eslint ./Sources/",
    "test:only": "jest",
    "test:vitest": "vitest run",
    "test:vitest:watch": "vitest",
    ...existing scripts...
  }
}
```

The `test:vitest` script allows running Vitest independently. The main `test` script remains Jest-based until section-04 completes the full migration.

### 3.5 TypeScript Configuration for Vitest Globals (Optional)

If the project uses any editor tooling that benefits from type hints, add a `/// <reference types="vitest/globals" />` comment to test files or create a `tsconfig.json` with `"types": ["vitest/globals"]`. This is optional since the project uses plain JavaScript, but it can improve IDE autocompletion for `describe`, `test`, `expect`, `vi`, etc.

### 3.6 Verify Setup with Smoke Test

Run the verification test created in the Tests FIRST section:

```bash
npx vitest run Tests/VitestSetup.test.js
```

This should pass all 4 tests, confirming:
- Vitest discovers and runs the test file
- `globals: true` works (no import needed for `describe`/`test`/`expect`)
- jsdom provides `document` and `window`
- Polyfills (if needed) are correctly applied

### 3.7 Verify Jest Still Works

Confirm the existing test pipeline is unaffected:

```bash
npm run test:only
```

This should continue to run `create_tests.sh` + `All.test.js` through Jest with all 315 tests passing. The two test runners coexist without interference.

---

## Files Summary

| File | Action | Description |
|------|--------|-------------|
| `/Users/studio/Documents/GitHub/FehBattleSimulator/package.json` | Modify | Add `vitest` to devDependencies, add `test:vitest` scripts |
| `/Users/studio/Documents/GitHub/FehBattleSimulator/vite.config.js` | Modify | Add `test` block with globals, jsdom, setupFiles, include, singleThread |
| `/Users/studio/Documents/GitHub/FehBattleSimulator/vitest.setup.js` | Create | ESM setup file replacing jest.setup.js polyfills |
| `/Users/studio/Documents/GitHub/FehBattleSimulator/Tests/VitestSetup.test.js` | Create | Smoke test validating Vitest environment configuration |

## Completion Criteria

1. `npx vitest run Tests/VitestSetup.test.js` passes all tests (exit code 0)
2. `npm run test:only` (Jest) continues to pass all 315 existing tests
3. `vite.config.js` contains a `test` section with `globals: true`, `environment: 'jsdom'`, `setupFiles`, `include`, and `singleThread: true`
4. `vitest.setup.js` exists and provides any necessary polyfills
5. Both `jest` and `vitest` commands are available via npm scripts

---

## Implementation Notes

**Implemented:** 2026-03-20

### Deviations from Plan

1. **No polyfills in `vitest.setup.js`**: The plan recommended conditional polyfills for safety. All three APIs (`performance`, `TextEncoder`, `TextDecoder`) are natively available in Node 22+ (required by `engines` field) and Vitest's jsdom environment. The smoke test confirmed this, so polyfills were omitted entirely. The setup file is kept as a placeholder.

2. **Added `test.root: './'` override**: The plan did not call out that the top-level `root: 'Sources'` would cause Vitest to resolve `Tests/**/*.test.js` relative to `Sources/`. A `test.root` override to `'./'` was necessary for correct test discovery. A comment was added to prevent accidental removal.

3. **Added `exclude: ['**/All.test.js', '**/node_modules/**']`**: Not in the original plan, but necessary to prevent Vitest from picking up the concatenated `All.test.js` generated by `create_tests.sh` during the Jest coexistence period.

### Verification Results

- Vitest smoke test: 4/4 tests pass
- Jest existing tests: 315/315 tests pass (after running `create_tests.sh`)
- Vitest version installed: 4.1.0