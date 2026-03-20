# Section 10 Code Review Interview

## User Decisions

### DOM reconciliation issue (#2)
**Decision: Switch to vue-draggable-plus.**
User asked about alternatives. Chose `vue-draggable-plus` (Vue 3 successor to Vue.Draggable) over custom SortableJS wrapper. vue-draggable-plus provides built-in Array synchronization, solving the DOM/Vue reactivity conflict.

## Auto-fixes Applied

### Fix 1: enemyUnitSorted comment node safety (#3)
- Added `elem.nodeType !== Node.ELEMENT_NODE` guard in `BattleSimulatorBase.js`
- Added null check for `findUnitById` result
- Prevents crash on Vue 3 comment anchors in childNodes

### Fix 2: Replaced sortablejs with vue-draggable-plus
- Uninstalled `sortablejs`, installed `vue-draggable-plus`
- Changed `import Sortable from 'sortablejs'` to `import { VueDraggable } from 'vue-draggable-plus'`
- Replaced custom draggable wrapper with `app.component('draggable', VueDraggable)`
- Simpler, safer, and fully compatible with existing `<draggable tag="div" @end="...">` templates

## Dismissed

- #1 ($refs.container): No longer applicable with vue-draggable-plus
- #4 (create_tests.sh): ESM test, incompatible with Jest concatenation
- #5 (behavioral tests): Static analysis consistent with project patterns
- #6 (animation prop): vue-draggable-plus supports all SortableJS options
- #7 (vuedraggable CDN): Already removed from branch
