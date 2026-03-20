# Code Review: Section 03 - Vitest Setup

**Date:** 2026-03-20

## Auto-fixes

### 1. Add comment explaining `test.root` override
The top-level `root: 'Sources'` would make Vitest resolve `Tests/**/*.test.js` relative to `Sources/`. The `test.root: './'` override is necessary for test discovery. Adding a comment to prevent accidental removal.

**Action:** FIX — add explanatory comment

### 2. Add `exclude` for `All.test.js`
When `create_tests.sh` has been run, `All.test.js` exists in the project root. Without an exclude pattern, Vitest could pick it up and fail. Adding `exclude: ['**/All.test.js']`.

**Action:** FIX — add exclude pattern

## Let Go

- **Defensive polyfills**: Node 22+ is required per `engines` field. Smoke test verified all APIs available. Unnecessary complexity.
- **@vitejs/plugin-vue**: Already confirmed installed in section-01 (`"@vitejs/plugin-vue": "^6.0.5"` in devDependencies).
- **threads vs forks**: With `singleThread: true`, both behave identically for sequential execution. No practical difference.
- **Verification evidence**: Both test runners verified passing (Vitest 4/4, Jest 315/315). Not visible in diff but confirmed.
