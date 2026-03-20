# Code Review Interview: section-01-build-filter

## Auto-fixes (applied without asking)

1. **grep exit code risk** — Added `|| true` to `grep -v` in create_tests.sh
2. **Cross-reference comments** — Added sync comments in both build.mjs and BuildFilter.test.js
3. **Missing JSDoc** — Added JSDoc to filterImportExport in build.mjs per plan spec

## User decisions

4. **Integration test** — User chose to add. Added test for import+code+export mixed pattern.

## Let go (no action)

5. Empty input test — trivial edge case
6. Inline export warning — future concern
7. Test loop asymmetry — intentional per plan
