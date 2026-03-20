# Section 09 Code Review Interview

## Auto-fixes Applied

### Fix 1: Added `value` prop alias (Critical #2)
- Added `value` prop (type: [Number, String]) as alias for `modelValue`
- SkillForm templates use `:value="unit.weapon"` etc. with `@update:model-value`
- Component now initializes `selectedValue` from whichever prop is provided
- Added watcher for `value` prop changes

### Fix 2: Added `input` event emission (Medium #10)
- Added `'input'` to `emits` array
- `selectOption()` now emits both `update:modelValue` and `input`
- UnitBuilder.html templates use `v-model` + `@input` pattern

## User Decisions

### Virtual scrolling (High #4)
**Decision: Deferred.** Old Select2 also rendered all options. Will address if performance issues arise.

## Dismissed (Not Real Issues)

### @options-changed (Critical #1) — FALSE ALARM
The old Select2 component never emitted `options-changed` either (emits array was `['update:modelValue']` only). This is a pre-existing non-functional listener, not a regression.

### Other dismissed items
- #3 (vue-select vs custom): Custom approach avoids dependency complexity with concatenation-based test setup
- #5 (dropdown positioning): Can iterate later
- #6 (CSS width variables): Can iterate later
- #7 (static-only tests): Consistent with project test patterns
- #8 (name attribute): Not used for form submission
- #9 (click-outside race): mousedown.prevent handles correctly
- #11 (create_tests.sh): For Jest only; vitest already picks up the file
- #12 (Japanese text): Consistent with codebase language
- #13 (selectedValue drift): Same pattern as old component
- #14 (parseInt): Carried from old component, not a regression
