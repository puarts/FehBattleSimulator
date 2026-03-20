# Section 11: jQuery Removal and CDN-to-npm Migration

## Status: COMPLETE

## Overview

This section covers the final removal of jQuery/jQuery UI from all HTML files and JS source code, and the migration of remaining CDN-loaded libraries (LZ-String, CropperJS, Font Awesome) to npm packages. After sections 09 (Select2 replacement) and 10 (Draggable replacement) are complete, jQuery's only remaining consumers are direct `$()` calls in application code. This section eliminates those and removes all jQuery CDN script tags.

## Implementation Notes

### Deviations from plan
- **Dialog approach**: Used custom `DialogUtil.js` with CSS class toggling instead of native `<dialog>` element. This avoided the need to convert all `<div id="xxxDialog">` elements to `<dialog>` tags (which would have required finding matching closing tags across deeply nested HTML). The CSS-based approach maintains identical functionality.
- **CropperJS version**: Plan didn't specify version. npm installed v2.x initially (incompatible API). Fixed to `^1.6.2` to match the old CDN v1.5.6 API.
- **Font Awesome version**: Pinned to `^6.4.2` to match old CDN version (npm defaulted to v7.x).

### Files created
- `Sources/DialogUtil.js` — jQuery UI dialog replacement (openDialogById, closeDialogById, initSimDialog)
- `Tests/JqueryRemoval.test.js` — 43 tests verifying jQuery removal

### Files modified
- `Sources/SettingManager.js` — jQuery $() → native DOM, added LZString import
- `Sources/UnitBuilderMain.js` — jQuery $() → native DOM, added LZString import
- `Sources/BattleSimulatorBase.js` — $(".draggable-elem") → querySelectorAll, progressbar → native progress
- `Sources/Main_ImageProcessing.js` — progressbar → native progress, added Cropper import
- `Sources/VueComponents.js` — dialog() → openDialogById(), added DialogUtil import
- `Sources/AppData.js` — added LZString import
- `Sources/Unit.js` — added LZString import
- `Sources/ArenaSimulator.html` — all jQuery calls replaced, CDN tags removed
- `Sources/AetherRaidSimulator.html` — all jQuery calls replaced, CDN tags removed
- `Sources/SummonerDuelsSimulator.html` — all jQuery calls replaced, CDN tags removed
- `Sources/UnitBuilder.html` — CDN tags removed
- `Sources/DamageCalculator.html` — CDN tags removed
- `Sources/HeroStatusClusterer.html` — CDN tags removed
- `Sources/ArenaSimulatorMain.js` — DialogUtil + Font Awesome imports, window globals
- `Sources/AetherRaidSimulatorMain.js` — DialogUtil + Font Awesome imports, window globals
- `Sources/SummonerDuelsSimulatorMain.js` — DialogUtil + Font Awesome imports, window globals
- `Sources/feh-battle-simulator.css` — dialog styling CSS
- `package.json` — added lz-string, cropperjs@^1.6.2, @fortawesome/fontawesome-free@^6.4.2

### Test results
- 487 tests pass (29 test files)
- 43 new jQuery removal tests all pass

## Dependencies

- **Section 09 (Select2 Replacement)**: Must be complete. The `select2` Vue component in `VueComponents.js` is the heaviest jQuery consumer; it must already be replaced with a jQuery-free alternative.
- **Section 10 (Draggable Replacement)**: Must be complete. jQuery UI draggable/sortable usage in `BattleSimulatorBase.js` must already be replaced.

## Affected Files

### HTML files (all 8 simulators) -- CDN tag removal

- `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/AetherRaidSimulator.html`
- `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/ArenaSimulator.html`
- `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/SummonerDuelsSimulator.html`
- `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/UnitBuilder.html`
- `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/DamageCalculator.html`
- `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/StatusCalculator.html`
- `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/HeroIconLister.html`
- `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/HeroStatusClusterer.html`

### JS files -- jQuery API replacement

- `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/BattleSimulatorBase.js`
- `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/VueComponents.js`
- `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/SettingManager.js`
- `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/UnitBuilderMain.js`
- `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/Main_ImageProcessing.js`
- `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/AppData.js`
- `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/Unit.js`

---

## Tests

Tests should be written FIRST, before implementation. Create a new test file at `/Users/studio/Documents/GitHub/FehBattleSimulator/Tests/JqueryRemoval.test.js`.

### E.3 jQuery Removal Tests

```js
/**
 * Tests for jQuery removal (Section 11, Step E.3)
 *
 * Verifies that all jQuery and jQuery UI CDN references have been removed
 * from HTML files, and that no jQuery API calls remain in JS source code.
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const SOURCES_DIR = path.resolve(__dirname, '../Sources');

const HTML_FILES = [
    'AetherRaidSimulator.html',
    'ArenaSimulator.html',
    'SummonerDuelsSimulator.html',
    'UnitBuilder.html',
    'DamageCalculator.html',
    'StatusCalculator.html',
    'HeroIconLister.html',
    'HeroStatusClusterer.html',
];

const JS_FILES = fs.readdirSync(SOURCES_DIR).filter(f => f.endsWith('.js'));

describe('jQuery CDN removal', () => {
    HTML_FILES.forEach(file => {
        it(`${file} should not contain jQuery CDN script tags`, () => {
            // Read file, check no active (non-commented) <script> tags reference jquery
        });

        it(`${file} should not contain jQuery UI CDN script/link tags`, () => {
            // Read file, check no active tags reference jquery-ui or jqueryui
        });
    });
});

describe('jQuery API removal from JS', () => {
    it('should have no $() or jQuery() calls in any JS file', () => {
        // Grep all JS files for $( and jQuery( patterns (excluding comments)
    });

    it('should have no $.fn or $.ajax references in any JS file', () => {
        // Grep for jQuery utility patterns
    });

    it('should have no .dialog() calls in JS files', () => {
        // .dialog() is jQuery UI -- must be replaced with native <dialog> or Vue modal
    });

    it('should have no .progressbar() calls in JS files', () => {
        // .progressbar() is jQuery UI -- must be replaced with <progress> or CSS
    });
});

describe('jQuery API removal from HTML inline scripts', () => {
    HTML_FILES.forEach(file => {
        it(`${file} should not contain $() calls in inline scripts`, () => {
            // Check inline <script> blocks and @click handlers for $() calls
        });
    });
});
```

### E.4 CDN-to-npm Migration Tests

```js
/**
 * Tests for CDN → npm migration (Section 11, Step E.4)
 *
 * Verifies that LZ-String, CropperJS, and Font Awesome are loaded from
 * npm packages instead of CDN, and that their functionality works.
 */

describe('LZ-String npm migration', () => {
    it('should not have LZ-String CDN script tags in any HTML file', () => {
        // Check all HTML for lz-string CDN references
    });

    it('should import LZString from npm package in source files', () => {
        // Verify import statement exists in files that use LZString
    });

    it('should compress and decompress data correctly', () => {
        // Functional test: LZString.compressToEncodedURIComponent / decompressFromEncodedURIComponent roundtrip
    });

    it('should compress and decompress Base64 data correctly', () => {
        // Functional test: LZString.compressToBase64 / decompressFromBase64 roundtrip
    });

    it('should compress and decompress UTF16 data correctly', () => {
        // Functional test: LZString.compressToUTF16 / decompressFromUTF16 roundtrip
    });
});

describe('CropperJS npm migration', () => {
    it('should not have CropperJS CDN script/link tags in any HTML file', () => {
        // Check all HTML for cropperjs CDN references
    });

    it('should import Cropper from npm package in Main_ImageProcessing.js', () => {
        // Verify import statement
    });
});

describe('Font Awesome migration', () => {
    it('should not have Font Awesome CDN link tags in any HTML file', () => {
        // Check all HTML for font-awesome CDN references
    });

    // Font Awesome can stay on CDN or move to npm -- either is acceptable
    // If npm: verify import of @fortawesome/fontawesome-free CSS
});
```

---

## Implementation Details

### Sub-task 1: Replace jQuery `$()` selector calls with native DOM APIs

jQuery is used in several JS files for simple DOM selection and manipulation. Each usage pattern has a direct native replacement.

#### Pattern A: `$('#id')[0]` -- Element by ID

Found in `UnitBuilderMain.js`:
```
var textarea = $("#urlTextArea")[0];
```
Replace with:
```
var textarea = document.getElementById("urlTextArea");
```

#### Pattern B: `$('#id').attr('src', ...)` -- Setting attributes

Found in `SettingManager.js`:
```
$('.weaponIcon').attr('src', g_imageRootPath + "Weapon.png");
$('.supportIcon').attr('src', g_imageRootPath + "Support.png");
```
Replace with:
```
document.querySelectorAll('.weaponIcon').forEach(el => el.src = g_imageRootPath + "Weapon.png");
document.querySelectorAll('.supportIcon').forEach(el => el.src = g_imageRootPath + "Support.png");
```

#### Pattern C: `$('#id > selector > child')` -- Tab selection

Found in `SettingManager.js`:
```
let $tabs = $('#unitSettings > ul.contents > li');
```
Replace with:
```
let tabs = document.querySelectorAll('#unitSettings > ul.contents > li');
```

#### Pattern D: `$('.jquery .tabs li').click(...)` -- Tab click handlers

Found inline in `ArenaSimulator.html`, `AetherRaidSimulator.html`, `SummonerDuelsSimulator.html`:
```js
$('.jquery .tabs li').click(function () {
    var index = $('.jquery .tabs li').index(this);
    ...
});
```
Replace with native `addEventListener` and `Array.from(...).indexOf(this)` or a Vue-based approach (preferred since these are inside Vue-managed templates).

### Sub-task 2: Replace jQuery UI `.dialog()` calls

jQuery UI's `.dialog()` is used extensively for modal dialogs. There are two approaches:

**Approach A (Recommended): Native `<dialog>` element**

The HTML `<dialog>` element supports `.showModal()` and `.close()` natively. Replace:
```js
$('#settingDialog').dialog('open');
```
with:
```js
document.getElementById('settingDialog').showModal();
```

And for closing:
```js
$(this).dialog("close");
```
with:
```js
document.getElementById('settingDialog').close();
```

The dialog initialization code (setting width, title, buttons) must be converted to CSS styling and native button event handlers.

**Files with `.dialog()` calls that need conversion:**
- `VueComponents.js` -- 6 dialog open calls (teamFormationDialog, aetherRaidDefensePresetDialog, itemDialog, durabilityTestDialog, editMapDialog, setupResonantBattleEnemyDialog)
- `ArenaSimulator.html` -- dialog initialization and open/close calls for settingDialog, exportDialog, importDialog, mjolnirsStrikeSettingDialog, ocrSettingDialog, autoClearDialog, itemDialog
- `AetherRaidSimulator.html` -- similar dialog patterns
- `SummonerDuelsSimulator.html` -- similar dialog patterns

Each dialog HTML element should be converted from `<div id="xxxDialog">` to `<dialog id="xxxDialog">` with appropriate CSS for styling (backdrop, centering, width).

### Sub-task 3: Replace jQuery UI `.progressbar()` calls

Found in `BattleSimulatorBase.js` and `Main_ImageProcessing.js`. The progressbar is used during mass evaluation operations.

Replace with native `<progress>` element:
```js
// Before (jQuery UI)
$("#progress").progressbar({ max: totalCount, value: currentCount });
$("#progress").progressbar({ disabled: true });

// After (native)
const progress = document.getElementById("progress");
progress.max = totalCount;
progress.value = currentCount;
// To "disable" / hide:
progress.style.display = 'none';  // or progress.removeAttribute('value')
```

The `#progress` element in HTML should be changed from `<div id="progress">` to `<progress id="progress">`.

### Sub-task 4: Replace jQuery `.draggable()` in BattleSimulatorBase.js

Found in `BattleSimulatorBase.js`:
```js
let draggableItems = $(".draggable-elem");
```
This should already be handled by Section 10 (Draggable Replacement). Verify no remaining jQuery draggable code exists.

### Sub-task 5: Remove Select2 jQuery wrapper remnants from VueComponents.js

The `select2` component in `VueComponents.js` uses extensive jQuery for Select2 initialization:
```js
$(this.$el).select2({...})
$(this.$el).off().select2('destroy')
$(this.$el).val()
```
This should already be handled by Section 09 (Select2 Replacement). Verify the entire old select2 component wrapper is replaced.

### Sub-task 6: Remove jQuery/jQuery UI CDN tags from all HTML files

After all jQuery API calls are replaced, remove these CDN references from each HTML file:

**jQuery script tags to remove** (varies by file):
- `<script src="https://fire-emblem.fun/js/jquery-3.7.0.min.js"></script>`
- `<script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/1.7.2/jquery.min.js"></script>`
- All commented-out jQuery script tags

**jQuery UI tags to remove:**
- `<script src/async src="https://ajax.googleapis.com/ajax/libs/jqueryui/1.12.1/jquery-ui.min.js"></script>`
- `<link rel="stylesheet" href="https://code.jquery.com/ui/1.12.1/themes/smoothness/jquery-ui.min.css" ...>`

**jQuery preconnect hints to remove:**
- `<link rel="preconnect" href="//code.jquery.com">`

**Select2 CDN tags to remove** (should already be done in Section 09, verify):
- `<link href="https://cdnjs.cloudflare.com/ajax/libs/select2/4.0.6-rc.0/css/select2.min.css" ...>`
- `<script src="https://cdnjs.cloudflare.com/ajax/libs/select2/4.0.6-rc.0/js/select2.min.js"></script>`

### Sub-task 7: Migrate LZ-String from CDN to npm

Install: `npm install lz-string`

**Files that use `LZString`:**
- `Sources/AppData.js` -- compressToUTF16, compressToBase64, compressToEncodedURIComponent, and their decompress counterparts
- `Sources/Unit.js` -- compressToEncodedURIComponent, decompressFromEncodedURIComponent
- `Sources/UnitBuilderMain.js` -- decompressFromEncodedURIComponent, compressToEncodedURIComponent
- `Sources/SettingManager.js` -- compressToBase64, decompressFromBase64

Add to each file:
```js
import LZString from 'lz-string';
```

Remove `<script>` CDN tags for lz-string from all 5 HTML files that include it:
- `DamageCalculator.html`
- `ArenaSimulator.html`
- `AetherRaidSimulator.html`
- `SummonerDuelsSimulator.html`
- `UnitBuilder.html`

**Critical**: Backward compatibility of save data compression/decompression must be maintained. Existing URL parameters and saved settings use LZ-String's encoding -- the npm version must produce identical output. Write a roundtrip test to verify.

### Sub-task 8: Migrate CropperJS from CDN to npm

Install: `npm install cropperjs`

**File that uses Cropper:**
- `Sources/Main_ImageProcessing.js` -- `new Cropper(canvas, { ... })`

Add import:
```js
import Cropper from 'cropperjs';
import 'cropperjs/dist/cropper.min.css';
```

Remove CDN tags from HTML files:
- `ArenaSimulator.html` -- both `<link>` (CSS) and `<script>` (JS)
- `AetherRaidSimulator.html` -- both
- `SummonerDuelsSimulator.html` -- both
- `UnitBuilder.html` -- already commented out, remove the comments

### Sub-task 9: Migrate Font Awesome from CDN to npm (or keep CDN)

Font Awesome is used in 3 HTML files via CDN:
- `ArenaSimulator.html`
- `AetherRaidSimulator.html`
- `SummonerDuelsSimulator.html`

**Option A (Recommended): npm migration**

Install: `npm install @fortawesome/fontawesome-free`

Import CSS in main entry JS files:
```js
import '@fortawesome/fontawesome-free/css/all.min.css';
```

Remove `<link>` CDN tags from the 3 HTML files.

**Option B: Keep CDN**

Font Awesome CSS-only CDN is lightweight and does not depend on jQuery. It can remain on CDN if preferred, as it does not block the jQuery removal goal. This is acceptable if the project wants to minimize npm dependency count.

### Sub-task 10: Clean up CSS class `.jquery`

Several HTML files use a `.jquery` CSS class (e.g., `<div class="jquery" id="unitSettings">`) and have CSS rules for `.jquery .contents li`. These class names are confusingly named but are purely CSS identifiers, not jQuery functionality. They should be renamed to something like `.tab-container` to avoid confusion, but this is optional and cosmetic.

---

## Verification Checklist

After all sub-tasks are complete, run these verification steps:

1. **Grep verification**: No active (non-commented) jQuery/jQuery UI references remain:
   - `grep -r 'jquery' Sources/*.html` returns only CSS class references or HTML comments
   - `grep -rn '\$(' Sources/*.js` returns zero results
   - `grep -rn '\.dialog(' Sources/*.js Sources/*.html` returns zero results (outside comments)
   - `grep -rn '\.progressbar(' Sources/*.js` returns zero results (outside comments)

2. **CDN verification**: No CDN tags remain for migrated libraries:
   - No `lz-string` CDN `<script>` tags
   - No `cropperjs` CDN `<script>` or `<link>` tags
   - No `select2` CDN tags (verified from Section 09)

3. **Functional verification**:
   - `vite build` succeeds
   - `vitest run` passes all tests including the new jQuery removal tests
   - All 8 simulators load without console errors in browser
   - Save/load functionality works (LZ-String roundtrip)
   - Image cropping works (CropperJS)
   - Tab switching works (previously jQuery-driven)
   - Dialog open/close works (previously jQuery UI)
   - Progress bars display during mass evaluation (previously jQuery UI)

4. **Bundle size check**: Verify that LZ-String and CropperJS are included in the Vite bundle output and the total bundle size is reasonable.