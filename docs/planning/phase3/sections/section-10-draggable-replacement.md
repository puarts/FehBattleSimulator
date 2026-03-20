Good. UnitBuilder.html loads vuedraggable CDN but doesn't use `<draggable>` tags. Now I have all the information needed.

# Section 10: Vue.Draggable Replacement

## Overview

This section covers the migration of Vue.Draggable 2.x (CDN) to a Vue 3-compatible draggable solution. Vue.Draggable 2.23.2 with SortableJS 1.8.4 is currently loaded from CDN in 4 HTML files and used as a `<draggable>` Vue component for unit list reordering.

**Dependencies**: Section 08 (Vue 3 Components) must be completed first. This section can be done in parallel with Section 09 (Select2 Replacement).

**Blocks**: Section 11 (jQuery Removal) depends on this section's completion.

---

## Current Usage Analysis

### Two distinct drag-and-drop patterns exist in the codebase

**Pattern 1: Vue.Draggable `<draggable>` component** (requires migration)

Used in 3 HTML files for team unit reordering:
- `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/ArenaSimulator.html` (lines 377-401, 422-445)
- `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/AetherRaidSimulator.html` (lines 428-453, 471-493)
- `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/SummonerDuelsSimulator.html` (lines 441-467, 474-497)

Each file has 2 `<draggable>` instances: one for ally units and one for enemy units. All use the same pattern:

```html
<draggable tag="div" @end="enemyUnitSorted">
    <button type="button" @click="..." v-for="unit in allyUnits" ...>
        <!-- unit icon content -->
    </button>
</draggable>
```

The `enemyUnitSorted` method in `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/BattleSimulatorBase.js` (line 821) reads `event.to.childNodes` to determine the new order and updates `unit.slotOrder`.

**Pattern 2: Native HTML5 drag-and-drop in VueComponents.js** (no migration needed)

`/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/VueComponents.js` (lines 2250-2254) already uses native HTML5 `draggable` attribute with `@dragstart`/`@drop` events for table row reordering. This is NOT Vue.Draggable and requires no changes.

**Pattern 3: Native HTML5 drag for battle map elements** (no migration needed)

`/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/BattleMap.js` and `Utilities.js` use native `draggable='true'` with `ondragstart='f_dragstart(event)'` for map tile dragging. This is NOT Vue.Draggable.

### CDN scripts to remove

4 HTML files load SortableJS and Vue.Draggable from CDN:

```html
<script async src="https://cdn.jsdelivr.net/npm/sortablejs@1.8.4/Sortable.min.js"></script>
<script async src="https://cdnjs.cloudflare.com/ajax/libs/Vue.Draggable/2.23.2/vuedraggable.umd.min.js"></script>
```

Files:
- `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/ArenaSimulator.html` (lines 1366-1370)
- `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/AetherRaidSimulator.html` (lines 1392-1396)
- `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/SummonerDuelsSimulator.html` (lines 1458-1462)
- `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/UnitBuilder.html` (lines 1186-1190) -- loads CDN but does NOT use `<draggable>` component

---

## Replacement Strategy

Two viable approaches:

### Option A: vuedraggable-plus (vue-draggable-plus)

Install `vue-draggable-plus` (Vue 3 + SortableJS based). Register as a global `draggable` component. Minimal template changes needed since the component API is similar.

### Option B: SortableJS direct usage with a thin Vue 3 wrapper

Install `sortablejs` as an npm dependency. Create a minimal Vue 3 `<draggable>` wrapper component in `VueComponents.js` that initializes `Sortable.create()` on `mounted()` and emits `end` events. This avoids adding a vuedraggable dependency and keeps the codebase simple given the limited usage (only 6 `<draggable>` instances with a single `@end` event).

**Recommended: Option B** -- The usage is very simple (only `tag="div"` and `@end` event), so a thin wrapper is more maintainable than adding a full library.

---

## Tests

Tests should be written FIRST, before implementation.

### Test file: `/Users/studio/Documents/GitHub/FehBattleSimulator/Tests/DraggableReplacement.test.js`

```javascript
/**
 * Tests for Vue.Draggable replacement (Section 10)
 * 
 * Validates that the draggable component works correctly with Vue 3
 * and that the CDN scripts have been removed.
 */

// E.2 Vue.Draggable replacement tests

describe('Vue.Draggable Replacement', () => {
    describe('CDN removal', () => {
        // Test: SortableJS CDN script tag removed from all HTML files
        it('should not have SortableJS CDN script in any HTML');

        // Test: Vue.Draggable CDN script tag removed from all HTML files
        it('should not have Vue.Draggable CDN script in any HTML');
    });

    describe('draggable component registration', () => {
        // Test: <draggable> component is registered on the Vue app
        it('should register draggable component via app.component()');
    });

    describe('drag-and-drop reordering', () => {
        // Test: Unit list reordering works after drag end
        it('should update unit.slotOrder after drag reorder');

        // Test: The reordered list reflects in Vue reactive data
        it('should reflect new order in Vue data after sort');

        // Test: Visual feedback during drag (element has expected CSS)
        it('should provide visual feedback during drag');
    });

    describe('enemyUnitSorted handler', () => {
        // Test: enemyUnitSorted reads event.to.childNodes correctly
        it('should read childNodes from the end event target');

        // Test: slotOrder is assigned sequentially after sort
        it('should assign sequential slotOrder values');
    });
});
```

These tests validate the three requirements from the TDD plan:
1. Unit list drag reordering works
2. Reordered list order reflects in Vue data
3. Visual feedback during drag is present

---

## Implementation (Actual)

### Approach: vue-draggable-plus (Deviation from Plan)

The plan recommended a thin SortableJS wrapper (Option B). During code review, the DOM reconciliation issue was identified: SortableJS mutates DOM directly, but Vue 3's reactivity system expects to own the DOM. Without array synchronization, re-renders would revert drag order.

**Decision: Use `vue-draggable-plus`** — the Vue 3 successor to Vue.Draggable. It wraps SortableJS and provides built-in array synchronization, solving the DOM/Vue reactivity conflict.

### What Was Built

**`Sources/VueComponents.js`**:
- `import { VueDraggable } from 'vue-draggable-plus'`
- `app.component('draggable', VueDraggable)` — registered as global component
- No custom wrapper needed; VueDraggable is fully compatible with `<draggable tag="div" @end="...">` templates

**`Sources/BattleSimulatorBase.js`**:
- Updated `enemyUnitSorted` handler to filter non-element nodes (`nodeType !== Node.ELEMENT_NODE`)
- Added null check for `findUnitById` result
- Prevents crash from Vue 3 comment anchor nodes in `childNodes`

**CDN Removal** (4 HTML files):
- Removed `<script async src="...sortablejs@1.8.4/Sortable.min.js">` from:
  - `ArenaSimulator.html`
  - `AetherRaidSimulator.html`
  - `SummonerDuelsSimulator.html`
  - `UnitBuilder.html` (was loaded but unused)
- Note: vuedraggable CDN was already absent from the branch

**`package.json`**:
- Added `vue-draggable-plus` dependency (replaces CDN sortablejs)

**`Tests/VueComponentsMigration.test.js`**:
- Updated component count from 32 to 33

### Tests

**New file**: `Tests/DraggableReplacement.test.js` (14 tests)

Static analysis tests verifying:
- CDN removal (SortableJS and Vue.Draggable CDN absent from 4 HTML files)
- Component registration (`app.component('draggable', VueDraggable)`)
- Import from vue-draggable-plus
- package.json dependencies
- enemyUnitSorted handler safety (nodeType filter)

---

## Key Files

| File | Change |
|------|--------|
| `package.json` | Add `vue-draggable-plus` dependency |
| `Sources/VueComponents.js` | Import VueDraggable, register as `draggable` component |
| `Sources/BattleSimulatorBase.js` | Fix `enemyUnitSorted` for Vue 3 comment nodes |
| `Sources/ArenaSimulator.html` | Remove SortableJS CDN |
| `Sources/AetherRaidSimulator.html` | Remove SortableJS CDN |
| `Sources/SummonerDuelsSimulator.html` | Remove SortableJS CDN |
| `Sources/UnitBuilder.html` | Remove SortableJS CDN (was unused) |
| `Tests/DraggableReplacement.test.js` | New test file (14 tests) |
| `Tests/VueComponentsMigration.test.js` | Component count 32 → 33 |