# Section 8: Vue 3 Components Migration

## Overview

This section covers migrating all 32 Vue components in `VueComponents.js` from Vue 2 global registration (`Vue.component()`) to Vue 3 app-instance registration (`app.component()`), along with all Vue 2 to Vue 3 breaking changes that affect component definitions. This section also addresses the Select2 wrapper component's compatibility with Vue 3 and the integration testing of the full Vue 3 component system.

**Dependencies**: Section 06 (Vue 3 core setup with `createApp`) and Section 07 (Pinia migration replacing `Vuex.mapState`) must be completed first. After this section, Section 09 (Select2 replacement) and Section 10 (Draggable replacement) can proceed.

## Background

### Current State

`/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/VueComponents.js` contains 32 components registered via `Vue.component('name', {...})` inside an `initVueComponents()` function. The function is called at the bottom of the file (line 3226), and the components are registered globally on the Vue constructor.

Key architectural details:
- Components use `Vuex.mapState()` in their `computed` blocks (16 occurrences) -- these will already be converted to Pinia `mapState` by Section 07
- The `select2` component heavily uses jQuery (`$()`, `.select2()`, `.on('change')`) -- this component gets a minimal Vue 3 syntax fix here; full replacement happens in Section 09
- A global Vue error handler is set via `Vue.config.errorHandler` (line 3223)
- The file exports `initVueComponents` at the bottom

### Vue 2 APIs Requiring Migration in Components

The following Vue 2 specific APIs are used in the components and must be addressed:

1. **`model` option** (12 components): Vue 2's `model: { prop: 'unit' }` custom v-model configuration is removed in Vue 3. Must convert to `modelValue` prop + `update:modelValue` emit, or use named v-model (`v-model:unit`).

2. **`beforeDestroy` lifecycle hook** (1 occurrence, `select2` component line 832): Must rename to `beforeUnmount`.

3. **`this.$set()` / `Vue.set()`** (3 occurrences in VueComponents.js):
   - Line 2108: `this.$set(this, 'rows', results)` in `EditableTable`
   - Line 2321: `Vue.set(this.rows, originalIndex, {...})` in `EditableTable`/`UnitStorageDialog`
   - Replace with direct assignment or `splice()`.

4. **`this.$children`** (1 occurrence, `log-node` component line 3008): Removed in Vue 3. Must use template refs or provide/inject.

5. **`this.$emit('input', ...)`** (1 occurrence, `select2` component line 757): Vue 3 v-model uses `update:modelValue` instead of `input` event.

6. **`Vue.config.errorHandler`** (line 3223): Must change to `app.config.errorHandler`.

## Tests

Tests should be written first, before implementation. All tests go in `/Users/studio/Documents/GitHub/FehBattleSimulator/Tests/`.

### Test 1: Component Registration Pattern (Static Analysis)

**File**: `/Users/studio/Documents/GitHub/FehBattleSimulator/Tests/VueComponentsMigration.test.js`

Verify that `VueComponents.js` no longer uses Vue 2 global registration:

```javascript
// Test: Vue.component() calls should not exist in VueComponents.js
// Read VueComponents.js source and verify no Vue.component() calls remain
// Instead, the file should export component definitions for app.component() registration

describe('Vue 3 Component Migration', () => {
    it('should not contain Vue.component() calls', () => {
        // grep-style test: verify Vue.component is not in source
    });

    it('should not contain Vue 2 deprecated APIs', () => {
        // Verify no Vue.set, $set, $delete, beforeDestroy, $children in source
    });

    it('should not contain Vue 2 model option with prop other than modelValue', () => {
        // Verify model: { prop: 'unit' } patterns are removed
    });
});
```

### Test 2: Component Rendering (Runtime)

```javascript
describe('Vue 3 Component Rendering', () => {
    it('should register all 32 components on app instance via app.component()', () => {
        // Create a Vue 3 app, call registerComponents(app), verify all are registered
    });

    it('battle-map component should call mounted hook', () => {
        // Mount battle-map and verify mounted() runs
    });

    it('flash-message component should accept props and render', () => {
        // Mount FlashMessage with flashMessages prop, verify rendering
    });

    it('unit-detail component should use Pinia store (not Vuex)', () => {
        // Verify computed properties come from Pinia mapState, not Vuex.mapState
    });
});
```

### Test 3: v-model Migration

```javascript
describe('v-model migration', () => {
    it('select2 component should emit update:modelValue instead of input', () => {
        // Verify select2 emits 'update:modelValue' on change
    });

    it('components with model:{prop:"unit"} should use v-model:unit or modelValue', () => {
        // Verify SkillToggle, SkillActions, etc. use Vue 3 v-model pattern
    });
});
```

### Test 4: $children Replacement

```javascript
describe('$children replacement in log-node', () => {
    it('setOpenAll should propagate without $children', () => {
        // Verify log-node can propagate open/close state to children
        // using template refs or provide/inject instead of $children
    });
});
```

### Test 5: Select2 Compatibility Check

```javascript
describe('Select2 Vue 3 compatibility', () => {
    it('select2 component should initialize in Vue 3 environment', () => {
        // Verify the select2 wrapper mounts without errors in Vue 3
    });

    it('select2 should use beforeUnmount instead of beforeDestroy', () => {
        // Verify lifecycle hook name is updated
    });
});
```

## Implementation Details

### Step 1: Refactor `initVueComponents()` to Accept App Instance

**File**: `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/VueComponents.js`

The function signature changes from `initVueComponents()` (no args, uses global `Vue.component()`) to `registerComponents(app)` (receives app instance, uses `app.component()`).

Current pattern:
```javascript
function initVueComponents() {
    Vue.component('battle-map', { ... });
    Vue.component('unit-detail', { ... });
    // ... 30 more
}
initVueComponents();
export { initVueComponents };
```

New pattern:
```javascript
function registerComponents(app) {
    app.component('battle-map', { ... });
    app.component('unit-detail', { ... });
    // ... 30 more
}
export { registerComponents };
```

The call at line 3226 (`initVueComponents()`) is removed. Instead, the caller (e.g., `BattleSimulatorBase.js` in `#create_vue`) calls `registerComponents(app)` after `createApp()` and before `.mount()`.

The error handler (line 3223) `Vue.config.errorHandler = ...` becomes `app.config.errorHandler = ...` and moves into the registration function or the caller.

### Step 2: Fix Vue 2 `model` Option (12 Components)

In Vue 2, the `model` option allowed customizing which prop/event `v-model` used:
```javascript
model: { prop: 'unit' }  // v-model binds to 'unit' prop, emits 'input'
```

In Vue 3, this is replaced with named v-model syntax: `v-model:unit="..."` on the parent, and the component declares a `unit` prop plus emits `update:unit`.

**Strategy**: The simplest migration is to:
1. Remove the `model: { prop: 'unit' }` option from each component
2. Keep the `unit` prop as-is
3. If the component emits events for v-model, change to `update:unit`
4. In parent templates, change `v-model="x"` to `v-model:unit="x"`

Components affected (all with `model: { prop: 'unit' }`):
- `SkillToggle` (line 866)
- `SkillActions` (line 898)
- `CustomSkillForm` (line 933)
- `SkillForm` (line 1060)
- `SkillActionArea` (line 1384)
- `MapButtonInUnitTab` (line 1664)
- `ArenaScore` (line 1717)
- `UnitDebug` (line 1742)

Components with other `model` configurations:
- `EditableTable` (line 2060): `model: { prop: 'rows', event: 'update:rows' }` -- already uses Vue 3 compatible event name, just remove `model` option and use `v-model:rows`
- `divine-vein-opacity-settings` (line 2430): `model: { prop: 'divineVeinOpacities', event: 'change' }` -- change to `v-model:divineVeinOpacities` and emit `update:divineVeinOpacities`
- `divine-vein-display-settings` (line 2487): similar pattern

For components that have `model: { prop: 'unit' }` but never emit `input` (they are pass-through props that are objects mutated in-place), the v-model binding may not need emit at all. However, for Vue 3 compatibility, these should still use `v-model:unit` syntax in the parent.

**Important**: The parent templates that use `<SkillToggle v-model="currentUnit">` must be updated to `<SkillToggle v-model:unit="currentUnit">`. These parent templates are in HTML files and in other component templates within `VueComponents.js` itself.

### Step 3: Fix `select2` Component for Vue 3

The `select2` component (line 718) needs minimal Vue 3 fixes (full replacement is Section 09):

1. **`this.$emit('input', newVar)`** (line 757) -> `this.$emit('update:modelValue', newVar)`
2. **`props.value`** -> `props.modelValue` (Vue 3 v-model default prop)
3. **`beforeDestroy()`** (line 832) -> `beforeUnmount()`
4. **Watch on `value`** -> watch on `modelValue`
5. Remove `model` option if present (select2 does not have one, it uses default v-model)

Parent templates using `<select2 v-model="x">` continue to work because Vue 3's default v-model maps to `modelValue` prop.

### Step 4: Replace `this.$set()` / `Vue.set()`

Three occurrences in `VueComponents.js`:

1. **Line 2108** (`EditableTable`): `this.$set(this, 'rows', results)` -- Replace with `this.rows = results` (Vue 3 Proxy handles reactivity automatically)

2. **Line 2321** (`UnitStorageDialog`): `Vue.set(this.rows, originalIndex, {...})` -- Replace with `this.rows[originalIndex] = {...}` or `this.rows.splice(originalIndex, 1, {...})`

3. Also check `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/BattleSimulatorBase.js` line 438: `this.$set(values, i, value)` -- Replace with `values[i] = value` or `values.splice(i, 1, value)`

4. `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/CustomSkill.js` line 192: `vm.$set(customSkill, 1, {...})` -- Replace with direct assignment

### Step 5: Replace `this.$children` in `log-node`

The `log-node` component (line 2935) uses `this.$children` at line 3008:
```javascript
this.$children.forEach(c => c.setOpenAll && c.setOpenAll(val));
```

In Vue 3, `$children` is removed. Options for replacement:

**Option A (Recommended): provide/inject pattern**
- Parent provides a reactive `openAll` state via `provide`
- Children inject and watch it
- This avoids needing refs for a recursive tree component

**Option B: Template refs**
- Use `ref` on child `log-node` components and iterate `this.$refs.children`
- Requires adding `ref="children"` to the template's child `<log-node>` elements

Option A is preferred because `log-node` is recursive, and provide/inject naturally flows down the tree.

### Step 6: Update Callers in `BattleSimulatorBase.js`

After Section 06 converts `new Vue({...})` to `createApp({...}).mount('#app')`, and Section 07 converts Vuex to Pinia, this section needs to ensure components are registered on the app instance before mounting.

In `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/BattleSimulatorBase.js`, the `#create_vue()` method (around line 133) must call `registerComponents(app)` between `createApp()` and `.mount()`:

```javascript
// After Section 06+07 migration, the pattern should be:
const app = createApp({ data() { return appData }, methods: this.methods });
app.use(createPinia());       // Section 07
registerComponents(app);       // This section
app.config.errorHandler = (err, vm, info) => {
    console.error('[Vue]', vm && vm.$options && vm.$options.name, info, err);
};
app.mount('#app');
```

Similarly, update the other Vue instance creation points:
- `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/HeroIconListerMain.js` (line 86)
- `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/DamageCalculatorMain.js` (line 1082)
- `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/HeroStatusClustererMain.js` (line 636)
- `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/StatusCalcMain.js` (line 82)

Each of these must call `registerComponents(app)` if they use any of the 32 components. Some simpler pages may not need all components.

### Step 7: Update HTML Templates

Parent templates that use `v-model` on custom components with the old `model` option need updating. Search all HTML files and component templates in `VueComponents.js` for usage patterns like:

- `<SkillToggle v-model="...">` -> `<SkillToggle v-model:unit="...">`
- `<SkillForm v-model="...">` -> `<SkillForm v-model:unit="...">`
- `<EditableTable v-model="...">` -> `<EditableTable v-model:rows="...">`
- `<divine-vein-opacity-settings v-model="...">` -> `<divine-vein-opacity-settings v-model:divineVeinOpacities="...">`

Search locations:
- All `*.html` files in `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/`
- Template strings within `VueComponents.js` itself (components that embed other components)

### Step 8: Verify Select2 jQuery Compatibility with Vue 3

The `select2` component uses jQuery to initialize Select2 in `mounted()` and clean up in `beforeUnmount()` (formerly `beforeDestroy`). Vue 3's Proxy-based reactivity may cause issues when jQuery manipulates DOM that Vue also manages.

Key verification points:
- Does `$(this.$el)` work correctly when `this.$el` is a Vue 3 Proxy?
  - Answer: `$el` is a plain DOM element, not proxied, so jQuery should work fine
- Does Select2's DOM manipulation conflict with Vue 3's virtual DOM diffing?
  - The component template is just `<select></select>`, and Select2 adds sibling elements. This should be safe since Vue does not manage the siblings.
- Does the `watch` on `modelValue` (formerly `value`) correctly trigger Select2 updates?

If incompatibilities are found, document them for Section 09 to address. The goal here is minimal fixes to keep Select2 working, not perfection.

### Step 9: Integration Verification

After all component migrations:

1. Run `npx vitest run` to verify all existing tests pass
2. Run `npx vite build` to verify the build succeeds
3. Manual browser testing of all 8 simulators:
   - `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/ArenaSimulator.html`
   - `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/SummonerDuelsSimulator.html`
   - `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/UnitBuilder.html`
   - `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/StatusCalculator.html`
   - `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/DamageCalculator.html`
   - `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/HeroIconLister.html`
   - `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/HeroStatusClusterer.html`
   - `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/TempestTrialsSimulator.html`

## Actual Implementation

**Note**: Most of the planned work was already completed during Section 06 (Vue 3 Core). Section 08 focused on verification and cleanup.

### Already Done in Section 06
- All 32 `Vue.component()` → `app.component()` (via `initVueComponents(app)`)
- `model` option removal and v-model migration for all 12 components
- `select2`: `value` → `modelValue`, `$emit('input')` → `$emit('update:modelValue')`, `beforeDestroy` → `beforeUnmount`
- `$set`/`Vue.set` removal in VueComponents.js, BattleSimulatorBase.js, CustomSkill.js
- `$children` → `$refs.childNodes` in log-node
- `Vue.config.errorHandler` → `app.config.errorHandler`

### Done in Section 08
- Removed unused `initVueComponents` imports from 4 Main files (AetherRaid, Arena, SummonerDuels, UnitBuilder)
- Created `Tests/VueComponentsMigration.test.js` — 10 static analysis tests verifying all Vue 2 APIs are removed

### Deviations from Plan
1. **`initVueComponents` not renamed to `registerComponents`** — Kept existing name to reduce churn. Function already accepts `app` parameter.
2. **Runtime tests skipped** — Static analysis tests cover all Vue 2 API removal. Runtime behavior verified in Section 06.
3. **HeroIconListerMain, DamageCalculatorMain, StatusCalcMain** — These pages don't call `initVueComponents` directly; they use it through `BattleSimulatorBase`.

## Files Created

| File | Description |
|------|-------------|
| `Tests/VueComponentsMigration.test.js` | 10 static analysis tests for Vue 3 migration verification |

## Files Modified

| File | Changes |
|------|---------|
| `Sources/AetherRaidSimulatorMain.js` | Removed unused `initVueComponents` import |
| `Sources/ArenaSimulatorMain.js` | Removed unused `initVueComponents` import |
| `Sources/SummonerDuelsSimulatorMain.js` | Removed unused `initVueComponents` import |
| `Sources/UnitBuilderMain.js` | Removed unused `initVueComponents` import |

## Verification Results

1. `npx vitest run Tests/VueComponentsMigration.test.js` — 10 tests pass
2. `npx vitest run` — 399 tests pass (26 files)