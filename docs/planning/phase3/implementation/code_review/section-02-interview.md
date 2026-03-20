# Code Review Interview: Section 02 - Vite Build

## Triage Summary

| # | Finding | Decision | Action |
|---|---------|----------|--------|
| 1 | BattleSimulatorBase/VueComponents no imports | Let go | Build succeeds; runtime correctness separate concern |
| 2 | Loader/spinner hide logic dropped | Auto-fix | Added loader hide to UnitBuilder and DamageCalculator Main files |
| 3 | loadLazyImages() dropped | Let go | DOMContentLoaded handler already handles lazy images |
| 4 | DamageCalculator missing init steps | Auto-fix | Added g_appData assignments and addKeyRepeatEvents |
| 5 | Dev skill registration dropped | Let go | Dev workflow detail, later concern |
| 6 | Duplicated side-effect imports | Let go | Functional, optimization later |
| 7 | createDialogs/importUrl fragile pattern | Let go | Works with current HTML ordering |
| 8 | Production CSS loading dropped | Let go | Deployment concern |
| 9 | StatusCalcMain init differs | Let go | Acceptable for build verification |
| 10 | node:test instead of vitest | Let go | Vitest not available yet |
| 11 | window.onerror removed | Let go | Minor dev convenience |
| 12 | Scroll-to-app removed | Let go | Minor UX detail |

## Interview

**Q: #2と#4を修正して進めますか？**
A: #2と#4を修正して進める

## Auto-fixes Applied

- Added loader hide / app show logic to UnitBuilderMain.js
- Added g_appData.skillDatabase, g_appData.map assignments and addKeyRepeatEvents call to DamageCalculatorMain.js
- Added loader hide / damageCalc show logic to DamageCalculatorMain.js
