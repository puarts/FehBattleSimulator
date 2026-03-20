# Section 7: Pinia Migration — Code Review

## Summary

The implementation is largely faithful to the plan and mechanically correct. The Pinia store is properly defined, all 16 mapState replacements and 9 $store.dispatch replacements are accounted for, tests cover the key scenarios, and package.json correctly adds pinia (with no lingering vuex dependency).

## High Severity

### 1. HeroStatusClustererMain.js still has a $store stub -- not migrated

File: Sources/HeroStatusClustererMain.js (lines 674-678)

This file contains a legacy `$store` shim that was introduced as a compatibility bridge. With VueComponents.js now importing `mapState` from Pinia (which reads from the Pinia store, not `$store.state`), any component mounted inside `HeroStatusClustererMain.js` via `initVueComponents(app)` will fail because that app instance never calls `app.use(pinia)` and never initializes the Pinia store. This is a runtime crash for the HeroStatusClusterer page.

## Medium Severity

### 2. store.js actions reference bare globals without imports or window prefix

All seven actions call global functions (`updateMap()`, `saveSettings()`, etc.) as bare identifiers. In the browser with Vite bundling, these will only resolve if they are attached to `window` at load time. The plan says: "Import these functions if they are exported, or reference them via `window` if they remain global." The implementation does neither.

### 3. Test for mapState does not verify actual value retrieval

The test sets store state, creates mapState computed getters, then only checks `typeof computed.appData === 'function'`. It never actually invokes the getter to verify it returns the correct value.

### 4. Test 4 from the plan (no Vuex references remain) is not implemented

The plan specifies a test or verification that greps for remaining Vuex references. No such test exists.

## Low Severity

### 5. Inconsistent formatting: missing space after comma in mapState calls

Every replacement uses `mapState(useMainStore,['...'])` with no space after the comma.

### 6. create_tests.sh not updated

The plan's Step 7 says to add `store.js` to `create_tests.sh` SOURCE_FILE_NAMES if still in use.

### 7. Pinia store state holds non-serializable objects

The store holds `battleSimulator` (a class instance) and `appData` (a complex object). Pinia devtools may attempt to serialize state.
