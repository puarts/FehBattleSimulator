# Section 09 Code Review: Select2 Replacement

## Critical Issues

### 1. Missing `@options-changed` event emission (FUNCTIONAL BREAKAGE)
SkillForm component template listens to `@options-changed` on `<select2>` elements. The new component never emits this event.

### 2. `:value` prop not supported (FUNCTIONAL BREAKAGE)
Multiple `<select2>` usages bind `:value` instead of `v-model`. The new component only declares `modelValue` — `:value` binds to a prop named `value`, not `modelValue`.

### 3. Plan specified vue-select; implementation is custom
Custom implementation avoids a dependency but lacks virtual scrolling for 500+ options lists and has no ARIA accessibility attributes.

## High Severity

### 4. No virtualized/lazy rendering for large option lists
All options rendered as DOM nodes. With 500-1000+ heroes x 37 instances, this creates many DOM nodes.

### 5. Dropdown positioning
No flip logic when near bottom of viewport. `min-width: 200px` hardcoded.

### 6. Width CSS variable mismatch
New `.custom-select2` sets `min-width: 100px` but doesn't reference existing CSS variables.

## Medium Severity

### 7. Tests are static analysis only, not behavioral
All tests read source as text and do regex matching. No component mounting or behavioral tests.

### 8. No `name` attribute support
Several usages pass `:name` to select2. New component doesn't declare `name` prop.

### 9. Click-outside handling race condition
Possible DOM removal timing issue between mousedown.prevent on options and document click handler.

### 10. Missing `input` event backward compatibility
Plan says emit `input` as alias. Component only emits `update:modelValue`.

### 11. Test file not registered in create_tests.sh
New test file won't be included in CI (Jest) test run.

## Low Severity

### 12. Hardcoded Japanese text ("該当なし")
Not localizable, but consistent with rest of codebase which uses Japanese.

### 13. selectedValue internal state can drift from modelValue
Maintains duplicate state instead of deriving from modelValue directly.

### 14. parseInt conversion may corrupt non-numeric string IDs
Carried forward from old component. Latent bug.
