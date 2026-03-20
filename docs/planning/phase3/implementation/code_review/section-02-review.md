# Code Review: Section 02 - Vite Build

## Critical Issues

### 1. BattleSimulatorBase.js and VueComponents.js have ZERO import statements
The plan explicitly states they need imports. Both have export statements but no imports. Under ESM, referenced symbols will be undefined. However, the vite build succeeds because Rollup doesn't validate runtime references - only import resolution.

### 2. Loader/spinner hide logic dropped
The old HTML init code hid the loader and showed the app element. This was removed but not moved to Main files. Users may see an infinite loading screen.

### 3. loadLazyImages() call dropped
The old code called loadLazyImages() in 5 HTML files. None of the new Main files call it.

### 4. DamageCalculatorMain.js missing initialization steps
Old init had: g_appData.skillDatabase, g_appData.map assignments, and addKeyRepeatEvents(). These were dropped.

### 5. Dev skill registration loop dropped for AetherRaidSimulator
Large dev skill creation loop removed and not moved to Main file.

## Medium Issues

### 6. Duplicated side-effect imports across all 8 Main files
### 7. createDialogs/importUrl guarded with typeof but defined in non-module script scope
### 8. Production CSS loading dropped
### 9. StatusCalcMain.js initialization differs from original
### 10. Test file uses node:test instead of vitest
### 11. window.onerror handler removed from AetherRaidSimulator
### 12. Scroll-to-app behavior removed
