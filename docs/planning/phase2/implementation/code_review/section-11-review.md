# Code Review: Section 11 - ESM Validation

## HIGH

### 1. validate-esm.mjs overwrites Node.js built-ins with Proxy stubs
The `browserGlobals` array includes `setTimeout`, `setInterval`, `clearTimeout`, `clearInterval`, `URL`, `URLSearchParams` which already exist in Node.js. The guard `if (!(name in globalThis))` prevents most overwrites, but `document` and `window` are unconditionally overwritten. Timer/URL stubs could break if applied.

### 2. All non-TDZ errors silently exit 0 (false negatives)
The catch block treats ANY non-TDZ error as acceptable. A circular dependency can cause an imported binding to be `undefined` (not TDZ) which throws `TypeError: X is not a constructor` — a real ESM issue that would be missed.

### 3. Test for TDZ detection swallows failures
The Jest test catches execFileSync errors and only checks stderr for `/TDZ ERROR/`. A process crash or non-standard error format would pass silently.

### 4. Hardcoded file list in check-esm-coverage.mjs
The plan says to read from create_tests.sh/build.mjs. Implementation uses hardcoded arrays that can drift out of sync.

### 5. Missing 3 source files from coverage check
`GlobalDefinitions_Debug.js`, `Local.js`, `HeroStatusClustererMain.js` are in Sources/ but not in either list.

### 6. Plan Test 2 (circular dependency specific test) not implemented
No focused test for Unit.js ↔ DamageCalculator.js circular dependency.

### 7. Plan Test 3 (run_tests.sh regression count assertion) not implemented

### 8. Build runs inside Jest as side effect
`execFileSync('node', ['scripts/build.mjs'])` writes to dist/ inside a test. Test order not guaranteed.

### 9. Import line regex too narrow
`/^import /` misses `import{`, `import*`, or indented imports.

### 10. Security: execFileSync usage is safe (no concern)
