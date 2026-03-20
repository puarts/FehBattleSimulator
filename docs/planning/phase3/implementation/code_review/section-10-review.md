# Section 10 Code Review: Draggable Replacement

## Critical Issues

### 1. $refs.container may not resolve to DOM element
Low risk — current usage always passes `tag="div"`.

### 2. SortableJS vs Vue 3 DOM reconciliation conflict
SortableJS mutates DOM directly. If Vue re-renders the v-for, it may revert the drag order. The old Vue.Draggable handled this by syncing the source array.

### 3. enemyUnitSorted may crash on Vue 3 comment nodes
Vue 3 inserts comment nodes (v-for anchors) in childNodes. Handler iterates ALL childNodes and calls `elem.classList[0]` which crashes on non-element nodes.

## Moderate Issues

### 4. create_tests.sh not updated
Test file uses ESM imports, incompatible with Jest concatenation pipeline.

### 5. Tests are static analysis only
No behavioral tests implemented.

### 6. No SortableJS options exposed
Hardcoded `animation: 150`, no extension point.

### 7. vuedraggable CDN already removed
Was not present in current branch — no action needed.
