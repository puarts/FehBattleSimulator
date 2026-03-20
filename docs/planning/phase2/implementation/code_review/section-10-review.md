# Section 10 Code Review

## Medium: Auto-fix
1. AppData.js: Missing `getItemTypeName` in export statement
2. TestUtilities.js: Unused `StatusEffectType` import — remove it

## Low: Auto-fix
3. UnitBuilderMain.js: Missing `initUnitBuilder` in exports
4. Missing trailing newlines in TestUtilities.js and UnitBuilderMain.js

## Low: Let go
5. `getPawnsOfLokiDifficalityScore` not exported from AppData.js — internal utility
6. No imports for non-test files — by design, deferred to Phase 3
7. BattleSimulatorBase.js missing some lower-priority exports — can add later

## Verdict
Auto-fix issues 1-4, document deviation from plan re: imports.
