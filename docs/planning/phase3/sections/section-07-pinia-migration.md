Now I have all the information needed. Let me generate the section content.

# Section 7: Pinia Migration (Vuex to Pinia)

## Overview

This section covers the migration from Vuex 3.6.2 to Pinia for state management. The existing Vuex store is simple -- it has 3 state properties, no mutations, and 7 actions that delegate to existing global functions. Pinia replaces Vuex as the official Vue 3 state management solution.

## Dependencies

- **Section 06 (Vue 3 Core)** must be completed first. `createApp` must be available and the Vue 3 runtime must be installed. The app creation logic in `BattleSimulatorBase.js` should already use `createApp` instead of `new Vue`.

## Background: Current Vuex Store

The entire Vuex store is defined in `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/BattleSimulatorBase.js`, inside the `#create_vue()` method (around line 1028-1069):

```javascript
Vue.use(Vuex);
const store = new Vuex.Store({
    state: {
        appData: appData,
        battleSimulator: this,
        imageRootPath: g_imageRootPath,
    },
    mutations: {
        // empty
    },
    actions: {
        updateMap({state}, payload) { return updateMap(); },
        saveSettings({state}, payload) { return saveSettings(); },
        showSettingDialog({state}, payload) { return showSettingDialog(); },
        showImportDialog({state}, payload) { return showImportDialog(); },
        showExportDialog({state}, payload) { return showExportDialog(); },
        loadLazyImages({state}, payload) { return loadLazyImages(); },
        resetPlacement({state}, payload) { return resetPlacement(); },
    }
});
return new Vue({ el: "#app", store, data: appData, methods: this.methods });
```

Key observations:
- **State**: 3 properties (`appData`, `battleSimulator`, `imageRootPath`)
- **Mutations**: None
- **Actions**: 7 actions, each simply delegates to a global function with no store-specific logic

### Vuex Usage in Components

All Vuex usage is in `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/VueComponents.js`:

**`Vuex.mapState` usage** (16 occurrences across various components):
- `...Vuex.mapState(['battleSimulator', 'appData', 'imageRootPath'])` -- used in `select2`, and a few other components
- `...Vuex.mapState(['battleSimulator'])` -- used in multiple components
- `...Vuex.mapState(['battleSimulator', 'appData'])` -- most common pattern

**`$store.dispatch` usage** (9 occurrences):
- `this.$store.dispatch('loadLazyImages')` -- 3 occurrences
- `this.$store.dispatch('updateMap')` -- 1 occurrence
- `this.$store.dispatch('saveSettings')` -- 1 occurrence
- `$store.dispatch('showSettingDialog')` -- 1 occurrence (in template)
- `$store.dispatch('showImportDialog')` -- 1 occurrence (in template)
- `$store.dispatch('showExportDialog')` -- 1 occurrence (in template)
- `this.$store.dispatch('resetPlacement')` -- 1 occurrence

---

## Tests

Write tests first in `/Users/studio/Documents/GitHub/FehBattleSimulator/Tests/PiniaStore.test.js`.

### Test 1: Pinia store definition is valid

Verify that `defineStore` produces a working store with the expected state properties (`appData`, `battleSimulator`, `imageRootPath`) that are readable.

### Test 2: Pinia store actions execute without error

Verify that each action (`updateMap`, `saveSettings`, `showSettingDialog`, `showImportDialog`, `showExportDialog`, `loadLazyImages`, `resetPlacement`) can be called on the store instance. Since these delegate to global functions, mock or stub the global functions and confirm the actions invoke them.

### Test 3: mapState from Pinia works in component computed properties

Verify that the Pinia `mapState` helper can be spread into a component's `computed` object and that the resulting computed properties return the correct store state values.

### Test 4: No Vuex references remain in source

A grep-based verification (can be a test or manual check) that confirms:
- `Vuex.Store` does not appear in any source file
- `Vuex.mapState` does not appear in any source file
- `Vue.use(Vuex)` does not appear in any source file
- The `vuex` package is not in `package.json` dependencies

### Test stubs

```javascript
// Tests/PiniaStore.test.js
import { describe, it, expect, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';

describe('Pinia Store Migration', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it('should define a store with expected state properties', () => {
        // Import the store definition and verify state keys
    });

    it('should have actions that delegate to global functions', () => {
        // Mock global functions, call store actions, verify delegation
    });

    it('should provide mapState-compatible computed properties', () => {
        // Verify Pinia mapState produces correct computed properties
    });
});
```

---

## Implementation Steps

### Step 1: Install Pinia

Add `pinia` to the project dependencies (it may already have been installed alongside Vue 3 in Section 06; if not, install it now).

```
npm install pinia
```

### Step 2: Create the Pinia store definition

Create a new file `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/store.js` that defines the main store using Pinia's `defineStore`:

```javascript
// Sources/store.js
import { defineStore } from 'pinia';

/**
 * Main application store, replacing the Vuex store.
 * State holds references to appData, battleSimulator instance, and imageRootPath.
 * Actions delegate to existing global functions.
 */
export const useMainStore = defineStore('main', {
    state: () => ({
        appData: null,
        battleSimulator: null,
        imageRootPath: '',
    }),
    actions: {
        updateMap() { /* delegates to global updateMap() */ },
        saveSettings() { /* delegates to global saveSettings() */ },
        showSettingDialog() { /* delegates to global showSettingDialog() */ },
        showImportDialog() { /* delegates to global showImportDialog() */ },
        showExportDialog() { /* delegates to global showExportDialog() */ },
        loadLazyImages() { /* delegates to global loadLazyImages() */ },
        resetPlacement() { /* delegates to global resetPlacement() */ },
    }
});
```

The action bodies should call the same global functions that the Vuex actions called (`updateMap()`, `saveSettings()`, etc.). Import these functions if they are exported, or reference them via `window` if they remain global.

**Important**: The state factory function `state: () => ({...})` returns default values. The actual `appData`, `battleSimulator`, and `imageRootPath` values are set during app initialization (see Step 3).

### Step 3: Modify BattleSimulatorBase.js -- Replace Vuex with Pinia

File: `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/BattleSimulatorBase.js`

In the `#create_vue()` method (around lines 1028-1069):

1. **Remove** `Vue.use(Vuex)` and the entire `new Vuex.Store({...})` block.
2. **Add** Pinia creation and store initialization:

The migration pattern:

```javascript
// Before (Vuex):
Vue.use(Vuex);
const store = new Vuex.Store({ state: {...}, mutations: {}, actions: {...} });
return new Vue({ el: "#app", store, data: appData, methods: this.methods });

// After (Pinia):
import { createPinia } from 'pinia';
import { useMainStore } from './store.js';

const pinia = createPinia();
const app = createApp({ data() { return appData; }, methods: this.methods });
app.use(pinia);
app.mount('#app');

// Initialize store state
const mainStore = useMainStore();
mainStore.appData = appData;
mainStore.battleSimulator = this;
mainStore.imageRootPath = g_imageRootPath;
```

Note: `createApp` should already be in use from Section 06. The key change here is replacing `store` with `pinia` in `app.use()` and initializing store state via direct property assignment (Pinia allows direct state mutation).

### Step 4: Migrate VueComponents.js -- Replace Vuex.mapState with Pinia mapState

File: `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/VueComponents.js`

There are 16 occurrences of `Vuex.mapState(...)` that need to change. Pinia provides `mapState` from `pinia` package:

```javascript
// Before:
import Vuex from 'vuex';  // or global Vuex
computed: {
    ...Vuex.mapState(['battleSimulator', 'appData', 'imageRootPath'])
}

// After:
import { mapState } from 'pinia';
import { useMainStore } from './store.js';
computed: {
    ...mapState(useMainStore, ['battleSimulator', 'appData', 'imageRootPath'])
}
```

The change is mechanical: replace `Vuex.mapState([...])` with `mapState(useMainStore, [...])` at all 16 locations.

### Step 5: Migrate VueComponents.js -- Replace $store.dispatch with store actions

There are 9 occurrences of `$store.dispatch('actionName')` that need to change.

**For JavaScript method bodies** (6 occurrences): Replace `this.$store.dispatch('actionName')` with a direct call to the store action:

```javascript
// Before:
this.$store.dispatch('loadLazyImages');

// After:
const store = useMainStore();
store.loadLazyImages();
```

Alternatively, use Pinia's `mapActions` helper in the component's `methods`:

```javascript
import { mapActions } from 'pinia';
import { useMainStore } from './store.js';

methods: {
    ...mapActions(useMainStore, ['loadLazyImages', 'updateMap', 'saveSettings', 'resetPlacement']),
    // existing methods...
}
```

**For template expressions** (3 occurrences at lines 1642, 1646, 1650): These use `$store.dispatch(...)` directly in `@click` handlers. The simplest approach is to add the action as a method via `mapActions` so the template can call it directly:

```html
<!-- Before: -->
@click="$store.dispatch('showSettingDialog');"

<!-- After (with mapActions in methods): -->
@click="showSettingDialog();"
```

### Step 6: Remove Vuex dependency

1. Remove `vuex` from `package.json` dependencies
2. Remove any Vuex CDN `<script>` tag from HTML files (if not already removed in Section 06)
3. Remove any `import Vuex` or `import { ... } from 'vuex'` statements

### Step 7: Register new source file

Add `Sources/store.js` to the test/build pipeline:
- If `create_tests.sh` is still in use, add `store.js` to `SOURCE_FILE_NAMES`
- If Vitest is already active (Section 04 completed), the import-based resolution handles this automatically

---

## Files Created

| File | Description |
|------|-------------|
| `Sources/store.js` | Pinia store definition (`useMainStore`) |
| `Tests/PiniaStore.test.js` | Pinia store tests (5 tests) |

## Files Modified

| File | Changes |
|------|---------|
| `Sources/BattleSimulatorBase.js` | Replaced temporary `$store` shim with `createPinia()` + `app.use(pinia)` + `useMainStore()` initialization |
| `Sources/VueComponents.js` | Replaced `mapStateShim` with `import { mapState, mapActions } from 'pinia'`; 16x `mapState(useMainStore, [...])`, 9x `$store.dispatch` → `mapActions` |
| `Sources/HeroStatusClustererMain.js` | Added `createPinia()` + `app.use()`, removed `$store` stub (code review fix — this page also calls `initVueComponents`) |
| `package.json` | Added `pinia ^3.0.4` (vuex was already removed in Section 06) |

## Deviations from Plan

1. **HeroStatusClustererMain.js**: Not in original plan but required Pinia setup because it calls `initVueComponents(app)`. Discovered during code review.
2. **Step 6 (Remove Vuex)**: `vuex` was already absent from `package.json` — removed in Section 06.
3. **Step 7 (create_tests.sh)**: Skipped — Jest/create_tests.sh retired in Section 04, Vitest handles imports automatically.

## Verification Results

1. `npx vitest run Tests/PiniaStore.test.js` — 5 tests pass
2. `npx vitest run` — 389 tests pass (25 files)
3. No `Vuex`, `mapStateShim`, or `$store.dispatch` references remain in `Sources/`