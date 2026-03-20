# Section 11 Code Review

## Critical Issues
1. **CropperJS v2 API incompatibility** - npm installed v2.1.0 but code uses v1 API. Need to pin to ^1.6.2
2. **Font Awesome major version jump** - CDN was 6.4.2, npm installed 7.x. Pin to ^6.4.2
3. **Modal dialogs lost modal behavior** - overlay CSS defined but never used

## Medium Issues
4. Plan recommended native `<dialog>` but implementation uses CSS class toggle
5. No Escape key handling for dialogs
6. No focus management in dialog open/close
7. initSimDialog button callback receives id string instead of `this`
8. Dialog height parameter silently dropped
9. Code duplication across three HTML files
10. showDialog function inconsistency across HTML files

## Minor Issues
11. document.execCommand deprecated (pre-existing)
12. .sim-dialog-overlay CSS defined but never used
13. No tests for DialogUtil.js itself
14. stripJsLineComments regex edge cases
