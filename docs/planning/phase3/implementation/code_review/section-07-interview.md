# Section 7: Pinia Migration — Code Review Interview

## Triage Summary

| # | Finding | Severity | Action |
|---|---------|----------|--------|
| 1 | HeroStatusClustererMain.js missing Pinia | High | Auto-fix (user approved) |
| 2 | Bare globals in store.js | Medium | Let go — existing pattern |
| 3 | Test mapState value retrieval weak | Medium | Auto-fix |
| 4 | No Vuex grep test | Medium | Let go — manual verification done |
| 5 | Missing space in mapState calls | Low | Auto-fix |
| 6 | create_tests.sh not updated | Low | Let go — Jest retired |
| 7 | Non-serializable state | Low | Let go — inherited, out of scope |

## User Interview

**Q: HeroStatusClustererMain.js に Pinia 未設定の問題を自動修正してよいか？**
A: 自動修正する（推奨）を選択

## Applied Fixes

### Fix 1: HeroStatusClustererMain.js — Pinia 追加
- Added `import { createPinia } from 'pinia'`
- Replaced `$store` stub with `app.use(createPinia())`

### Fix 2: Formatting — mapState 呼び出しのスペース修正
- All 16 `mapState(useMainStore,[` → `mapState(useMainStore, [` with proper spacing

### Fix 3: Test strengthening — mapState 値の検証追加
- Added assertions that mapState getter functions return correct values when called

## Verification
- All 389 tests pass (25 test files)
- No `$store.dispatch`, `mapStateShim`, or `Vuex` references remain in Sources/
