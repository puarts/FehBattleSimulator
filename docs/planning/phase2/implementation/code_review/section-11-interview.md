# Section 11 Code Review Interview

## Auto-fixes applied

### Fix 1: Remove Node.js built-ins from browser stub list
- Removed `URL`, `URLSearchParams`, `setTimeout`, `setInterval`, `clearTimeout`, `clearInterval` from `browserGlobals` array in `validate-esm.mjs`
- These already exist in Node.js and should not be overwritten

### Fix 2: Add exit code assertion in TDZ test
- Updated `EsmValidation.test.js` to check `err.status === 1` for genuine TDZ failures
- Prevents silent pass when child process crashes for unexpected reasons

### Fix 3: Use `beforeAll` for build in test
- Moved `execFileSync('node', ['scripts/build.mjs'])` into `beforeAll` within a nested `describe`
- Ensures build runs once before both build-related tests

## User decisions

### Q1: Non-TDZ error handling (TypeError etc.)
**Decision: 現状維持**
- ブラウザ専用コードのため Node.js で TypeError/ReferenceError は避けられない
- 循環依存テストの追加でカバーする方が実用的

### Q2: Unit ↔ DamageCalculator 循環依存テスト
**Decision: 追加する**
- `scripts/validate-esm-circular.mjs` を新規作成（Unit.js を直接 import して検証）
- `EsmValidation.test.js` に専用テスト追加

## Let go (not addressed)

- #4 Hardcoded file list: Plan allows parallel list approach
- #5 Missing debug/local files: Not part of build pipeline
- #7 Test count assertion: Suite running IS the regression
- #9 Regex narrowness: Project convention ensures `import ` with space
