# Code Review: section-06-vue3-core

## Critical Issues Found

1. **`app.mount()` return value not captured** — StatusCalcMain.js accesses `g_app.totalSp` but `g_app` is set to the app object, not the component proxy.
2. **`model` component option removed in Vue 3** — Components with `model: { prop: 'unit' }` need migration.
3. **`@input` on `<select2>` won't fire** — Changed from `$emit('input')` to `$emit('update:modelValue')` but `@input` handlers still exist.
4. **Global variables in templates** — `UnitRarity`, `GameMode`, etc. not registered on `app.config.globalProperties`.
5. **Vue feature flags not defined** — Need `__VUE_OPTIONS_API__` etc.
6. **`$store` not on non-BattleSimulator entry points** — HeroStatusClusterer calls `initVueComponents(app)` but has no `$store`.
