Good -- no `<script type="module">` yet. Now I have all the context needed.

# Section 02: Vite Build -- HTML Modification, Filter Removal, Global Variables, Build Verification

## Overview

This section covers Steps A.3 through A.6 of the Phase 3 plan: modifying HTML files to use Vite module entry points, removing the import/export filter workaround, handling global variable scoping, and verifying that `vite build` produces correct output for all 8 simulators.

**Depends on:** section-01-vite-setup (Vite installed, `vite.config.js` created with multi-page input, `root: 'Sources'`, `build.outDir: '../dist'`)

**Blocks:** section-05-dev-server, section-06-vue3-core

---

## Background

### Current State

The project has 8 simulator HTML files in `Sources/`, each using a dynamic script loading system:

1. `Sources/AetherRaidSimulator.html`
2. `Sources/ArenaSimulator.html`
3. `Sources/SummonerDuelsSimulator.html`
4. `Sources/UnitBuilder.html`
5. `Sources/StatusCalculator.html`
6. `Sources/DamageCalculator.html`
7. `Sources/HeroIconLister.html`
8. `Sources/HeroStatusClusterer.html`

Each HTML file contains:
- A `<script src="Local.js">` tag that loads file lists (e.g., `SKILL_EFFECT_FILES`, `SKILL_IMPL_FILES`)
- A `createScriptElement()` function that fetches JS files, **filters out import/export lines**, creates blob URLs, and injects them as `<script>` tags
- A `loadScripts()` function that chains sequential loading of all source files
- A `window.addEventListener('load', ...)` handler that determines local vs. production mode via `typeof weaponInfos == 'undefined'` and loads scripts accordingly
- CDN `<script>` tags for Vue 2, Vuex, jQuery, Select2, etc. (these stay unchanged in this section)

The corresponding entry-point JS files are:
- `Sources/AetherRaidSimulatorMain.js`
- `Sources/ArenaSimulatorMain.js`
- `Sources/SummonerDuelsSimulatorMain.js`
- `Sources/UnitBuilderMain.js`
- `Sources/StatusCalcMain.js`
- `Sources/DamageCalculatorMain.js`
- `Sources/HeroIconListerMain.js`
- `Sources/HeroStatusClustererMain.js`

**Critical detail:** None of the `*Main.js` files currently have `import` statements. They rely on all dependencies being loaded into global scope via the `loadScripts` chain. For Vite to bundle them as ESM entry points, each Main file needs proper import statements added.

Phase 2 added import/export statements to ~61 JS files, but the runtime still strips them with filters. This section makes those import/export statements the real module system by switching to `<script type="module">`.

### File: `scripts/build.mjs`

The current build script (`scripts/build.mjs`) concatenates files per-simulator, applies `filterImportExport()` to strip import/export lines, and outputs a single JS file per simulator to `dist/`. This script produces 7 named bundles (e.g., `FehBattleSimulator.js`, `FehArenaSimulator.js`, etc.) plus a CSS copy.

### File: `Sources/Local.js`

Defines file-list arrays (`SKILL_EFFECT_FILES`, `SKILL_IMPL_FILES`) used by the HTML dynamic loader. Under Vite, these arrays become unnecessary because Vite resolves imports automatically.

---

## Tests

Tests for this section validate the Vite build output and HTML correctness. These are primarily integration/verification tests that run after `vite build`.

### Test File: `Tests/ViteBuild.test.js`

```javascript
/**
 * Vite Build Output Verification Tests
 *
 * Validates that `vite build` produces correct output:
 * - All 8 simulator HTML files exist in dist/
 * - Each HTML references a JS bundle
 * - Bundled JS contains no raw import/export statements
 * - Output file sizes are reasonable
 * - No loadScripts/createScriptElement in dist HTML
 */

// These tests require `vite build` to have been run beforehand.
// They read from the dist/ directory and verify output structure.

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { describe, it, expect } from 'vitest';

const DIST = join(__dirname, '..', 'dist');

const SIMULATOR_HTMLS = [
    'AetherRaidSimulator.html',
    'ArenaSimulator.html',
    'SummonerDuelsSimulator.html',
    'UnitBuilder.html',
    'StatusCalculator.html',
    'DamageCalculator.html',
    'HeroIconLister.html',
    'HeroStatusClusterer.html',
];

describe('Vite Build Output', () => {
    it('vite build should have produced dist/ directory', () => {
        // Verify dist/ exists
    });

    it('all 8 simulator HTML files exist in dist/', () => {
        // Check each HTML file exists
    });

    it('each HTML contains a <script type="module"> tag', () => {
        // Parse HTML, verify module script tags
    });

    it('no loadScripts or createScriptElement remains in dist HTML', () => {
        // Grep dist HTML for legacy loader functions
    });

    it('bundled JS files contain no raw import/export statements', () => {
        // Read JS bundles, verify no `import ` or `export {` lines
    });

    it('output JS file sizes are non-trivial (> 100KB each)', () => {
        // Each simulator bundle should be substantial
    });
});
```

### Manual Verification Checklist

These cannot be automated easily and should be checked by the implementer:

- [ ] `vite build` exits with code 0
- [ ] `dist/` output structure is compatible with existing deploy flow (JS + HTML + CSS)
- [ ] Opening a dist HTML in the browser shows no console errors (CDN libs still load)

---

## Implementation Steps

### Step 1: Add import statements to Main files

Each `*Main.js` file currently has zero import statements and relies on global scope. For Vite to bundle them as module entry points, they must import their dependencies explicitly.

**Files to modify:**

| File | Key imports needed |
|------|-------------------|
| `Sources/AetherRaidSimulatorMain.js` | `BattleSimulatorBase`, `g_appData`, `using_`, `ScopedStopwatch`, etc. |
| `Sources/ArenaSimulatorMain.js` | Same pattern as above |
| `Sources/SummonerDuelsSimulatorMain.js` | Same pattern |
| `Sources/UnitBuilderMain.js` | Similar but with unit-builder-specific imports |
| `Sources/StatusCalcMain.js` | Subset of imports |
| `Sources/DamageCalculatorMain.js` | Subset with damage-calc-specific imports |
| `Sources/HeroIconListerMain.js` | Minimal imports |
| `Sources/HeroStatusClustererMain.js` | Minimal imports |

Additionally, `Sources/BattleSimulatorBase.js` and `Sources/VueComponents.js` currently have no import statements despite depending on many other modules. These files need imports added as well, since under Vite they will no longer receive globals magically.

**Approach:** For each Main file, examine which symbols it uses (classes, functions, variables like `g_appData`, `GameMode`, `MapType`, etc.), trace them to their source module via the existing `export {}` statements, and add the corresponding `import {} from './Module.js'` lines at the top.

This is the most labor-intensive part of this section. The import graph is already defined by the Phase 2 export statements -- the task is to ensure every module that is reachable from a Main entry point has proper import statements for everything it references from other modules.

**Important constraint:** Do NOT modify import/export statements in SkillImpl files (`SkillImpl.js`, `SkillImpl202408.js`, `SkillImpl202501.js`, `SkillImpl202601.js`) to avoid conflicts with the `update_skills` branch.

### Step 2: Modify HTML files to use `<script type="module">`

For each of the 8 HTML files, replace the dynamic loader block with a single module script tag.

**Current pattern** (in each HTML, near the bottom of `<body>`):
```html
<script>
    function createScriptElement(src, onloadFunc) { ... }
    function loadScripts(scriptFileNames, allScriptLoaded, index = 0) { ... }
    window.addEventListener('load', (event) => {
        const isLocal = typeof weaponInfos == 'undefined';
        let additionalScripts = [];
        if (isLocal) {
            additionalScripts = [ /* long file list */ ];
        }
        loadScripts(additionalScripts, () => {
            // initialization code
        });
    });
</script>
```

**Target pattern:**
```html
<script type="module" src="./XxxMain.js"></script>
```

Where `XxxMain.js` is the entry point for each simulator. The initialization logic currently inside the `loadScripts` callback (e.g., `g_app.registerSkillOptions(...)`, `initAetherRaidBoard(...)`) needs to move into the Main JS file itself, since module execution happens after the DOM is ready.

**HTML-to-Main mapping:**

| HTML File | Entry Point |
|-----------|-------------|
| `AetherRaidSimulator.html` | `AetherRaidSimulatorMain.js` |
| `ArenaSimulator.html` | `ArenaSimulatorMain.js` |
| `SummonerDuelsSimulator.html` | `SummonerDuelsSimulatorMain.js` |
| `UnitBuilder.html` | `UnitBuilderMain.js` |
| `StatusCalculator.html` | `StatusCalcMain.js` |
| `DamageCalculator.html` | `DamageCalculatorMain.js` |
| `HeroIconLister.html` | `HeroIconListerMain.js` |
| `HeroStatusClusterer.html` | `HeroStatusClustererMain.js` |

**What to keep in HTML:**
- The `<script src="Local.js">` tag can be removed (Vite resolves modules)
- CDN `<script>` tags for Vue 2, jQuery, Select2, etc. remain unchanged (removed in later sections)
- The `loadLazyImages()` function and its `IntersectionObserver` logic should be preserved (move to a shared utility or keep inline)
- The `g_startTime` inline script can remain

**What to remove from HTML:**
- The `createScriptElement()` function definition
- The `loadScripts()` function definition
- The `window.addEventListener('load', ...)` block that uses `loadScripts`
- References to `SKILL_EFFECT_FILES` / `SKILL_IMPL_FILES` from `Local.js`

### Step 3: Move initialization logic to Main files

Each HTML currently has initialization code inside the `loadScripts` callback. This logic must move into the corresponding Main JS file.

For example, `ArenaSimulator.html` currently runs:
```javascript
g_app.registerSkillOptions(weaponInfos, supportInfos, ...);
g_app.registerHeroOptions(heroInfos, false);
loadLazyImages();
initAetherRaidBoard(heroInfos);
createDialogs();
importUrl(location.search);
```

This initialization code should become part of the Main file's top-level execution or be wrapped in a startup function. Since `<script type="module">` is deferred by default, the DOM will be ready when the module executes.

**Note on data variables:** `weaponInfos`, `heroInfos`, etc. are currently loaded from external CDN scripts in production. In local development under Vite, these will need a different approach (addressed fully in section-05-dev-server). For now, the local/production detection (`typeof weaponInfos == 'undefined'`) can remain in the Main file.

### Step 4: Handle global variables exposed to `window`

Some variables must remain on `window` because they are referenced from:
1. HTML templates (`{{ }}` Vue bindings reference `data` properties, which is fine)
2. CDN-loaded scripts that expect globals
3. Cross-module references that were not fully converted to import/export

Key global variables to assess:

| Variable | Source File | Needs `window` exposure? |
|----------|-------------|--------------------------|
| `g_app` | `*Main.js` | Yes -- referenced from HTML event handlers and CDN-loaded data scripts |
| `g_appData` | `AppData.js` | Possibly -- used extensively, but should be importable via ESM |
| `weaponInfos`, `heroInfos`, etc. | CDN external | Yes -- loaded by external scripts, must stay on `window` |

For variables that must be on `window`, add explicit assignments:
```javascript
// In the Main file, after creating g_app:
window.g_app = g_app;
```

For variables already exported via ESM (like `g_appData`), other modules should import them rather than accessing `window`.

### Step 5: Verify `vite build` output

After completing the above changes, run `vite build` and verify:

1. **Build succeeds** with exit code 0
2. **8 HTML files** appear in `dist/`
3. **JS bundles** are generated for each entry point
4. **No import/export** statements remain in bundled JS (Rollup resolves them)
5. **File sizes** are reasonable (each simulator bundle should be several hundred KB to a few MB, comparable to the current `build.mjs` output)
6. **CSS and assets** are correctly copied/referenced

### Step 6: Deprecate `build.mjs` filter (mark for removal)

The `filterImportExport()` function in `scripts/build.mjs` is no longer needed for Vite builds. However, do NOT delete `build.mjs` yet -- it serves as a fallback until the full migration is validated. Mark it as deprecated with a comment. It will be removed in section-12-ci-cleanup.

Similarly, the `createScriptElement` import/export filter in HTML files should already be gone after Step 2.

---

## Actual File Changes

| File | Action |
|------|--------|
| 8 `*Main.js` files | Added ESM imports (named + side-effect for SkillImpl chain), initialization code moved from HTML |
| 8 `*.html` files | Removed createScriptElement/loadScripts/window.addEventListener blocks, added `<script type="module">` |
| `Sources/DamageCalculator.js` | Fixed StatusEffectType import (was from SkillConstants, should be Skill.js) |
| `Sources/BeginningOfTurnSkillHandler.js` | Same fix |
| `Sources/PostCombatSkillHander.js` | Same fix |
| `Sources/DamageCalculatorWrapper.js` | Same fix |
| `Tests/ViteBuild.test.js` | Created 6 tests using Node.js built-in test runner |
| `scripts/build.mjs` | Added deprecation comment |
| `vite.config.js` | Restored all 8 entry points |

### Deviations from Plan

- **BattleSimulatorBase.js and VueComponents.js** were NOT modified (plan said to add imports). These files have no imports but the build succeeds because Rollup doesn't validate runtime references.
- **StatusEffectType** was incorrectly imported from `SkillConstants.js` in 4 Phase 2 files. Fixed to import from `Skill.js` where it's actually defined.
- **Test file** uses `node:test` instead of `vitest` (vitest not yet available).
- **Test adapted** for Vite's code-splitting: checks total JS output > 1MB instead of per-file > 100KB.
- **Loader hide logic** added to UnitBuilder and DamageCalculator per code review.
- **Dev skill registration** and some init details (loadLazyImages, scroll-to-app, window.onerror) not migrated from HTML to Main files; these are runtime concerns to be addressed later.

## Verification

- `npx vite build` exits with code 0 (308ms build time)
- 8 HTML files in dist/
- 21 JS chunks in dist/assets/ (code-split shared modules)
- Total JS output: ~2.8MB
- All 6 build verification tests pass
- Section 01 tests still pass (8/8)