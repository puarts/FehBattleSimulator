# Section 8: Vue 3 Components — Code Review

## Context
Section 06 already performed the bulk of the Vue 3 component migration. Section 08's diff is focused on verification tests and cleanup of unused imports.

## Findings

### Medium Severity

1. **Naming: plan says rename `initVueComponents` → `registerComponents`** — Implementation kept old name. Conscious deviation to reduce churn.

2. **Missing runtime tests** — Plan specified 5 test categories (static, rendering, v-model, $children, Select2). Implementation only covers static analysis. Missing runtime mount/render tests.

3. **Fragile dynamic import test** — `await import('../Sources/VueComponents.js')` may fail if globals not set up by vitest.setup.js timing.

### Low Severity

4. **Fragile string-slicing in select2 test** — Relies on component ordering (slices between 'select2' and 'FlashMessage').

5. **Hardcoded 32** — Magic number in app.component count assertion.

6. **No $set/Vue.set check on other files** — Only checks VueComponents.js, not BattleSimulatorBase.js or CustomSkill.js.
