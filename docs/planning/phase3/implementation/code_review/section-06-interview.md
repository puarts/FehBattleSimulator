# Code Review Interview: section-06-vue3-core

## Auto-fixes Applied

### #1: `app.mount()` return value (CRITICAL)
StatusCalcMain.js now captures `app.mount()` return value as component proxy.

### #2: `model` component option removed (CRITICAL)
Removed all 11 `model: { prop: ... }` options. Changed parent templates from `v-model` to explicit prop binding (`:unit="unit"`, `:rows="rows"`, `:divine-vein-opacities="..."`, etc.).

### #3: `@input` on `<select2>` (CRITICAL)
Made select2 emit both `update:modelValue` and `input` for backward compatibility.

### #4: Global variables in templates (HIGH)
Added `UnitRarity`, `GameMode`, `UnitGroupType`, `StatusType`, `Ornament`, `Unit`, `updateAllUi`, `updateMapUi`, `loadSettings`, `statusTypeToShortString`, `isThief`, `getDivineVeinName`, `LocalStorageUtil`, `DetailLevel`, `GroupLog` to `app.config.globalProperties` in BattleSimulatorBase.js.

### #5: Vue feature flags (HIGH)
Added `__VUE_OPTIONS_API__`, `__VUE_PROD_DEVTOOLS__`, `__VUE_PROD_HYDRATION_MISMATCH_DETAILS__` defines to vite.config.js.

### #6: `$store` on non-BattleSimulator entry points (HIGH)
Added stub `$store` to HeroStatusClustererMain.js app instance.

## Let Go

### #7: unit-detail v-model approach
Using `:value` instead of migrating to `modelValue` is acceptable since these are read-only props.

### #8: Missing `destroyed` hook test
`destroyed` is just the Vue 2 alias for `beforeDestroy` — checking one is sufficient.

### #9: Test file not in create_tests.sh
Vitest uses glob patterns; create_tests.sh is the legacy Jest concatenation system.

### #12: Error handler only on BattleSimulator
Acceptable — other pages are simpler and don't need custom error handling.
