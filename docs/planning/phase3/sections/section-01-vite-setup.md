Now I have enough context. Let me generate the section content.

# Section 01: Vite Setup

## Overview

This section covers the initial Vite build tool setup for the FEH Battle Simulator project. It corresponds to **Step A.1 and A.2** of the Phase 3 migration plan. The goal is to install Vite, create `vite.config.js` with correct settings, and verify the configuration is valid -- without yet modifying HTML files or running a full build (those are covered in Section 02).

## Background

The project is a Fire Emblem Heroes battle simulator with 8 HTML-based simulators located in `Sources/`. Currently it uses no bundler -- `scripts/build.mjs` manually concatenates JS files and outputs them to `dist/`. Phase 2 added ESM `import`/`export` statements to all 61 JS files, but these are filtered out at build time by `filterImportExport()`. Vite will use these import/export statements directly.

### Current Project State

- **Package manager**: npm with Node.js >= 22
- **Build**: `scripts/build.mjs` -- manual file concatenation with import/export filtering
- **Test**: Jest 29.7.0 + `create_tests.sh` concatenation
- **Framework**: Vue 2.5.13 + Vuex 3.6.2 + jQuery (all via CDN)
- **Source location**: All JS/HTML/CSS in `Sources/`
- **HTML files** (8 simulators):
  - `Sources/AetherRaidSimulator.html`
  - `Sources/ArenaSimulator.html`
  - `Sources/SummonerDuelsSimulator.html`
  - `Sources/UnitBuilder.html`
  - `Sources/StatusCalculator.html`
  - `Sources/DamageCalculator.html`
  - `Sources/HeroIconLister.html`
  - `Sources/HeroStatusClusterer.html`
- **Entry point JS files** (one per simulator):
  - `Sources/AetherRaidSimulatorMain.js`
  - `Sources/ArenaSimulatorMain.js`
  - `Sources/SummonerDuelsSimulatorMain.js`
  - `Sources/UnitBuilderMain.js`
  - `Sources/StatusCalcMain.js`
  - `Sources/DamageCalculatorMain.js`
  - `Sources/HeroIconListerMain.js`
  - `Sources/HeroStatusClustererMain.js`

### Key Constraint

SkillImpl files (`SkillImpl.js`, `SkillImpl202408.js`, `SkillImpl202501.js`, `SkillImpl202601.js`) must not have their import/export statements changed, to avoid conflicts with the parallel `update_skills` branch.

## Dependencies

- **None** -- this is the first section with no prerequisites.
- **Blocks**: Section 02 (Vite Build), Section 03 (Vitest Setup), Section 05 (Dev Server).

---

## Tests

Write these tests first. They validate that the Vite configuration is correctly created and the package dependencies are properly installed.

### Test File: `Tests/ViteSetup.test.js`

```javascript
/**
 * Section 01: Vite Setup verification tests
 *
 * These tests verify that Vite is properly installed and configured.
 * Run with: node --test Tests/ViteSetup.test.js
 * (Uses Node.js built-in test runner since Vitest is not yet configured)
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const ROOT = join(import.meta.dirname, '..');

describe('A.1 package.json dependencies', () => {
    const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf-8'));

    it('should have vite in devDependencies', () => {
        assert.ok(pkg.devDependencies.vite, 'vite should be in devDependencies');
    });

    it('should have @vitejs/plugin-vue in devDependencies', () => {
        assert.ok(pkg.devDependencies['@vitejs/plugin-vue'],
            '@vitejs/plugin-vue should be in devDependencies');
    });
});

describe('A.2 vite.config.js', () => {
    it('should exist at project root', () => {
        assert.ok(existsSync(join(ROOT, 'vite.config.js')),
            'vite.config.js should exist at project root');
    });

    it('should set root to Sources', async () => {
        const content = readFileSync(join(ROOT, 'vite.config.js'), 'utf-8');
        assert.ok(content.includes("root:") && content.includes("Sources"),
            'vite.config.js should set root to Sources directory');
    });

    it('should configure build.outDir to ../dist', async () => {
        const content = readFileSync(join(ROOT, 'vite.config.js'), 'utf-8');
        assert.ok(content.includes("outDir") && content.includes("../dist"),
            'vite.config.js should set outDir to ../dist');
    });

    it('should list all 8 HTML entry points in rollupOptions.input', async () => {
        const content = readFileSync(join(ROOT, 'vite.config.js'), 'utf-8');
        const expectedHtmlFiles = [
            'AetherRaidSimulator',
            'ArenaSimulator',
            'SummonerDuelsSimulator',
            'UnitBuilder',
            'StatusCalculator',
            'DamageCalculator',
            'HeroIconLister',
            'HeroStatusClusterer',
        ];
        for (const name of expectedHtmlFiles) {
            assert.ok(content.includes(name),
                `vite.config.js should reference ${name}`);
        }
    });

    it('should set build.target to es2015', async () => {
        const content = readFileSync(join(ROOT, 'vite.config.js'), 'utf-8');
        assert.ok(content.includes('es2015'),
            'vite.config.js should set build target to es2015');
    });

    it('should include comment or placeholder for Vue 3 runtime compiler alias', async () => {
        // Vue 3 esm-bundler alias will be enabled in Section 06, but should be
        // present as a commented-out placeholder now
        const content = readFileSync(join(ROOT, 'vite.config.js'), 'utf-8');
        assert.ok(content.includes('vue/dist/vue.esm-bundler') || content.includes('esm-bundler'),
            'vite.config.js should have a placeholder for Vue 3 runtime compiler alias');
    });
});
```

These tests use the Node.js built-in test runner (`node:test`) because Vitest is not yet configured at this point. Run with:

```bash
node --test Tests/ViteSetup.test.js
```

---

## Implementation

### A.1 Install Dependencies

Add Vite and the Vue plugin to `devDependencies` in `/Users/studio/Documents/GitHub/FehBattleSimulator/package.json`:

```bash
npm install --save-dev vite @vitejs/plugin-vue
```

This adds two packages:
- `vite` -- the build tool itself (includes Rollup)
- `@vitejs/plugin-vue` -- Vue SFC support (needed later for Vue 3; install now to avoid a separate install step)

Do NOT remove any existing devDependencies (Jest, ESLint remain for now).

### A.2 Create vite.config.js

Create `/Users/studio/Documents/GitHub/FehBattleSimulator/vite.config.js` with the following configuration.

Key design decisions:

1. **`root: 'Sources'`** -- HTML files live in `Sources/`, so Vite's root must point there. This means all relative paths in HTML (CSS, images) resolve correctly without changes.

2. **`build.outDir: '../dist'`** -- Output goes to `dist/` at the project root (same as current `build.mjs`), relative to the `root` setting.

3. **Multi-page entry points** -- All 8 HTML files are listed in `build.rollupOptions.input`. The keys map simulator names to their HTML files:
   - `AetherRaidSimulator: 'AetherRaidSimulator.html'`
   - `ArenaSimulator: 'ArenaSimulator.html'`
   - `SummonerDuelsSimulator: 'SummonerDuelsSimulator.html'`
   - `UnitBuilder: 'UnitBuilder.html'`
   - `StatusCalculator: 'StatusCalculator.html'`
   - `DamageCalculator: 'DamageCalculator.html'`
   - `HeroIconLister: 'HeroIconLister.html'`
   - `HeroStatusClusterer: 'HeroStatusClusterer.html'`

4. **Single-chunk output** -- The deploy process expects one JS file per simulator. Use `build.rollupOptions.output.manualChunks` to force all modules into a single chunk per entry point. If this proves difficult with Vite's multi-page mode, the fallback strategy is 8 individual builds (one per HTML). Document this fallback in a comment.

5. **`build.target: 'es2015'`** -- Match current browser compatibility expectations.

6. **Vue 3 runtime compiler alias (commented out)** -- Add a commented-out `resolve.alias` entry mapping `vue` to `vue/dist/vue.esm-bundler.js`. This is needed because the project uses in-HTML templates (not SFCs), which require Vue's runtime compiler. It will be enabled in Section 06 (Vue 3 Core) when Vue 3 is actually installed.

7. **`@vitejs/plugin-vue`** -- Import and include in the plugins array (commented out or conditional, since Vue 3 is not installed yet). This prepares the config for Section 06.

8. **`build.emptyOutDir: true`** -- Clean dist before each build.

The config file structure:

```javascript
import { defineConfig } from 'vite';
// import vue from '@vitejs/plugin-vue'; // Enable in Section 06

export default defineConfig({
    root: 'Sources',
    // plugins: [vue()], // Enable in Section 06
    build: {
        outDir: '../dist',
        emptyOutDir: true,
        target: 'es2015',
        rollupOptions: {
            input: {
                AetherRaidSimulator: 'AetherRaidSimulator.html',
                ArenaSimulator: 'ArenaSimulator.html',
                SummonerDuelsSimulator: 'SummonerDuelsSimulator.html',
                UnitBuilder: 'UnitBuilder.html',
                StatusCalculator: 'StatusCalculator.html',
                DamageCalculator: 'DamageCalculator.html',
                HeroIconLister: 'HeroIconLister.html',
                HeroStatusClusterer: 'HeroStatusClusterer.html',
            },
            output: {
                // Force single JS bundle per entry point for deploy compatibility.
                // Fallback: run 8 individual builds if manualChunks doesn't work.
                manualChunks: undefined, // Will be configured in Section 02 after testing
            },
        },
    },
    resolve: {
        alias: {
            // Enable in Section 06 (Vue 3 Core):
            // Vue 3 runtime compiler build needed for in-HTML templates
            // 'vue': 'vue/dist/vue.esm-bundler.js',
        },
    },
});
```

**Note on `manualChunks`**: The exact chunking strategy will be finalized in Section 02 when the HTML modifications are made and the first `vite build` is actually executed. The initial config sets `manualChunks: undefined` (Vite default) as a starting point. Section 02 will adjust this based on actual build output.

### A.2 Update .gitignore

Add `dist/` to `/Users/studio/Documents/GitHub/FehBattleSimulator/.gitignore` if not already present. Vite also generates a `.vite/` cache directory that should be ignored.

Entries to add (if missing):
```
dist/
node_modules/
.vite/
```

### A.2 Add build scripts to package.json

Add new npm scripts alongside the existing ones (do not replace yet):

```json
{
  "scripts": {
    "vite:build": "vite build",
    "vite:dev": "vite",
    "vite:preview": "vite preview"
  }
}
```

The existing `build`, `test`, and other scripts remain unchanged. The `vite:` prefix distinguishes the new commands during the transition period. These will replace the originals in Section 12 (CI Cleanup).

---

## Files Modified

| File | Action |
|------|--------|
| `package.json` | Add `vite@^8.0.1` and `@vitejs/plugin-vue@^6.0.5` to devDependencies; add `vite:build`, `vite:dev`, `vite:preview` scripts |
| `vite.config.js` | Created with root, entry points, and alias config |
| `.gitignore` | Added `.vite/` (dist/ already present) |
| `Tests/ViteSetup.test.js` | Created 8 tests using Node.js built-in test runner |

## Implementation Notes

### Deviations from Plan

- **Vite version**: Plan did not specify version. Installed Vite 8.0.1 (latest stable as of 2026-03) with @vitejs/plugin-vue 6.0.5.
- **manualChunks**: Removed `manualChunks: undefined` line per code review (dead code). Kept comment-only placeholder for Section 02.
- **Existing test regression check**: `npm run test:only` requires `All.test.js` generated by `create_tests.sh`, which is a pre-existing workflow issue unrelated to this section.

## Verification

All verifications passed:
- `node --test Tests/ViteSetup.test.js` — 8/8 tests pass
- `npx vite --help` — Vite 8.0.1 config parsed successfully

Do NOT run `vite build` yet -- the HTML files have not been modified to use `<script type="module">` entry points, which is Section 02's responsibility.