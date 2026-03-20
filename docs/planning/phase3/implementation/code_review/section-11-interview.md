# Section 11 Code Review Interview

## Auto-fixes applied
1. **CropperJS v2→v1**: Pinned to ^1.6.2 (v2 has incompatible API)
2. **Font Awesome 7→6**: Pinned to ^6.4.2 (match old CDN version)
3. **Removed dead overlay CSS**: .sim-dialog-overlay was defined but unused
4. **Added Escape key support**: DialogUtil.js now closes topmost dialog on Escape

## User decisions
- **Modal overlay**: Skipped. Most dialogs were modal:false originally. Not needed.

## Let go
- Native `<dialog>` vs CSS class toggle: working approach, can improve later
- Code duplication across HTML files: pre-existing pattern
- document.execCommand deprecation: pre-existing, out of scope
- DialogUtil.js unit tests: static tests sufficient for now
