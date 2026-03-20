Good -- the options format is `{ id, text }` which is Select2's standard format. Now I have everything I need to write the section.

# Section 9: Select2 Replacement

## Overview

This section replaces the jQuery-based Select2 library with a Vue 3-native dropdown component. Select2 (v4.0.6-rc.0) is loaded via CDN and used extensively across 6 HTML files for hero/skill selection dropdowns. The current `select2` Vue component in `VueComponents.js` wraps the jQuery Select2 plugin, but after Vue 3 migration (Section 08), jQuery-based DOM manipulation conflicts with Vue 3's Proxy-based reactivity system. This section creates a drop-in replacement component that preserves the same `<select2>` tag interface.

**Depends on**: Section 08 (Vue 3 components migration complete)
**Blocks**: Section 11 (jQuery removal -- Select2 is a primary jQuery dependency)
**Parallelizable with**: Section 10 (draggable replacement)

---

## Current State

### Select2 Vue Component (`Sources/VueComponents.js`, lines 717-836)

The existing component:
- Registered as `Vue.component('select2', { ... })`
- Template: `<select></select>` (bare select element, Select2 jQuery plugin enhances it)
- **Props**:
  - `options` (Array, required) -- items in `{ id, text }` format
  - `value` (Number|String, optional) -- currently selected value
  - `fallbackValue` (Number|String, default: -1) -- value to use when selected option is absent from new options
  - `isDebugMode` (Boolean, default: false) -- when true, shows invalid values with red styling instead of falling back
- **Events**: emits `input` with parsed value (parseInt if numeric, else raw string)
- **Features**:
  - Multi-word search (`matchMultiWords`) -- splits query by spaces (including fullwidth), matches all keywords against option text
  - Invalid value detection in debug mode -- adds a disabled dummy option showing the invalid value
  - `invalid-value` CSS class on the Select2 container when value is not in options
  - Watches `value` prop to sync jQuery Select2 UI state
  - Watches `options` prop to rebuild the dropdown when options change
  - Cleanup in `beforeDestroy` (Vue 2 lifecycle, needs `beforeUnmount` in Vue 3)

### Usage Pattern

Approximately 37 `<select2>` tag usages across 6 files:
- `VueComponents.js` (unit-detail component template): 12 usages
- `UnitBuilder.html`: 10 usages
- `DamageCalculator.html`: 9 usages
- `ArenaSimulator.html`: 2 usages
- `SummonerDuelsSimulator.html`: 2 usages
- `AetherRaidSimulator.html`: 2 usages

Typical usage pattern:
```html
<select2 :options="someOptions" v-model="someValue" class="skill"
         @input="someHandler">
</select2>
```

Some usages bind `:value` instead of `v-model` with a separate `@input` handler.

### CDN Resources (to be removed)

Present in 6 HTML files:
- CSS: `https://cdnjs.cloudflare.com/ajax/libs/select2/4.0.6-rc.0/css/select2.min.css`
- JS: `https://cdnjs.cloudflare.com/ajax/libs/select2/4.0.6-rc.0/js/select2.min.js`

### Custom CSS (`Sources/feh-battle-simulator.css`)

Lines 1482-1518 contain Select2-specific styles:
- `.invalid-value` -- red text for invalid values
- `.select2-container--default` overrides
- `.select2-results__options` and `.select2-selection__rendered` -- font-size: 12px

---

## Tests

Write tests **before** implementation. Tests go in a new file `Tests/Select2Replacement.test.js`.

### Test 1: Same props interface as old component

Verify the new component accepts `options`, `value`, `fallbackValue`, and `isDebugMode` props with the same types and defaults.

```javascript
// Tests/Select2Replacement.test.js
describe('Select2 Replacement Component', () => {
    it('should accept options, value, fallbackValue, and isDebugMode props');
    it('should render a searchable dropdown with the provided options');
    it('should emit update:modelValue when selection changes');
    it('should support { id, text } option format');
});
```

### Test 2: Search/filter functionality

```javascript
describe('Search filtering', () => {
    it('should filter options by search text');
    it('should support multi-word search (space-separated keywords all match)');
    it('should treat fullwidth spaces as delimiters');
    it('should be case-insensitive');
});
```

### Test 3: Large option list performance

```javascript
describe('Performance', () => {
    it('should handle 500+ options without noticeable lag');
});
```

### Test 4: Value change and event emission

```javascript
describe('Value reactivity', () => {
    it('should emit the correct event when selection changes');
    it('should parse numeric string values to integers before emitting');
    it('should update displayed value when value prop changes externally');
});
```

### Test 5: fallbackValue behavior

```javascript
describe('fallbackValue', () => {
    it('should use fallbackValue when current value is not in options');
    it('should default fallbackValue to -1');
});
```

### Test 6: Debug mode

```javascript
describe('Debug mode', () => {
    it('should show invalid value marker when isDebugMode is true and value not in options');
    it('should not fall back to fallbackValue in debug mode');
});
```

### Test 7: CDN removal verification (grep-based)

```javascript
describe('CDN cleanup', () => {
    it('should not contain select2 CDN links in any HTML file');
    it('should not contain jQuery select2 initialization code in VueComponents.js');
});
```

---

## Implementation (Actual)

### Approach: Custom Vue 3 Component (Deviation from Plan)

The plan recommended `vue-select@beta`, but a **custom component** was built instead.

**Rationale**: The project uses a concatenation-based test setup (`vitest.setup.js` strips imports). Adding `vue-select` would complicate this and introduce a dependency that conflicts with the test architecture. A custom component provides full control, zero dependencies, and consistent behavior.

### What Was Built

**File modified**: `Sources/VueComponents.js` (lines 720-880)

Custom searchable dropdown component registered as `app.component('select2', {...})`:
- Template: `<div>` with click-to-open selection area, search `<input>`, and `<ul>` dropdown
- **Props**: `options` (Array, required), `modelValue` (Number|String), `value` (Number|String, alias), `fallbackValue` (default -1), `isDebugMode` (Boolean, default false)
- **Events**: emits both `update:modelValue` and `input` (backward compat for UnitBuilder.html `@input` handlers)
- **Search**: Multi-word search splitting by spaces (including fullwidth U+3000), case-insensitive, all keywords must match
- **Fallback**: When options change and current value is missing, emits `fallbackValue` (unless debug mode)
- **Debug mode**: Adds disabled dummy option with `（不正な値: ...）` text, applies `invalid-value` CSS class
- **Keyboard**: Arrow keys, Enter to select, Escape to close
- **Click-outside**: Closes dropdown via document click listener (cleaned up in `beforeUnmount`)

### CSS Changes

**File modified**: `Sources/feh-battle-simulator.css`

- Removed all `.select2-container`, `.select2-results`, `.select2-selection` CSS rules
- Added `.custom-select2` component styles (selection, dropdown, search, option states, invalid-value)
- Retained `.invalid-value` base class
- Font size: 12px (matching old Select2 styling)

### CDN Removal

Removed `<link>` and `<script>` tags for `select2.min.css` / `select2.min.js` from 6 HTML files:
- `ArenaSimulator.html`
- `AetherRaidSimulator.html`
- `SummonerDuelsSimulator.html`
- `UnitBuilder.html`
- `DamageCalculator.html`
- `HeroStatusClusterer.html`

### Tests

**New file**: `Tests/Select2Replacement.test.js` (27 tests)

Static analysis tests verifying:
- Props interface (options, modelValue, value, fallbackValue, isDebugMode)
- No jQuery dependency ($, .select2(), $.trim, $.extend)
- Template structure (not bare `<select>`, has search input)
- Search logic (split, every, fullwidth, toLowerCase)
- Value parsing (parseInt)
- Fallback and debug mode behavior
- Vue 3 lifecycle (beforeUnmount, not beforeDestroy)
- CDN cleanup (no select2 CDN links in any HTML file)
- CSS cleanup (no .select2-* rules, .invalid-value retained)
- Backward compatibility (value prop alias, input event emission)

### Deferred

- **Virtual scrolling**: Not implemented. Old Select2 also rendered all options. Will address if performance issues arise with 500+ hero options.

---

## Key Files

| File | Action |
|------|--------|
| `Sources/VueComponents.js` | Replaced `select2` component (lines 720-880, custom dropdown) |
| `Sources/feh-battle-simulator.css` | Removed `.select2-*` CSS, added `.custom-select2` styles |
| `Sources/ArenaSimulator.html` | Removed Select2 CDN tags |
| `Sources/AetherRaidSimulator.html` | Removed Select2 CDN tags |
| `Sources/SummonerDuelsSimulator.html` | Removed Select2 CDN tags |
| `Sources/UnitBuilder.html` | Removed Select2 CDN tags |
| `Sources/DamageCalculator.html` | Removed Select2 CDN tags |
| `Sources/HeroStatusClusterer.html` | Removed Select2 CDN tags |
| `Tests/Select2Replacement.test.js` | New test file (27 tests) |