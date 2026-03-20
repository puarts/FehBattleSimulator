Now I have all the context needed. Let me generate the section content.

# Section 12: CI Cleanup

## Status: COMPLETE

## Implementation Notes

### Files deleted
- `scripts/build.mjs`, `create_tests.sh`, `run_tests.sh`, `jest.config.js`, `jest.setup.js`
- `scripts/validate-esm.mjs`, `scripts/check-esm-coverage.mjs`

### Files modified
- `.github/workflows/jekyll.yml` — removed create_tests.sh step, replaced run_tests.sh with `npm test` + `npm run build`
- `package.json` — scripts updated (test→vitest, build→vite build), removed jest deps, added jsdom
- `CLAUDE.md` — updated project description, dev/test instructions
- `Dockerfile` — updated to use `npm test` directly
- `Tests/EsmValidation.test.js` — removed references to deleted validation scripts
- `Tests/CiCleanup.test.js` — 17 new CI cleanup verification tests

### Test results
- 500 tests pass (30 test files)

## Overview

This is the final section of the Phase 3 migration. It updates the CI/CD pipeline to use Vitest and Vite build, removes all obsolete files left over from the pre-migration setup, cleans up `package.json`, and performs final verification that everything works end-to-end.

**Dependencies**: This section requires completion of:
- **Section 04 (Vitest Migration)**: All 315 tests must already be running under Vitest
- **Section 11 (jQuery Removal)**: All CDN dependencies must already be replaced with npm packages

## Background

### Current CI Pipeline

The CI workflow is defined in `/Users/studio/Documents/GitHub/FehBattleSimulator/.github/workflows/jekyll.yml`. It currently:

1. Builds a Jekyll site (for GitHub Pages documentation)
2. Sets up Node.js (version from `package.json` engines field, `>=22`)
3. Runs `npm install`
4. Runs `./create_tests.sh` to concatenate all source and test files into `All.test.js`
5. Runs `./run_tests.sh` which executes `npm test` (Jest + ESLint)

### Current package.json Scripts

```json
{
  "scripts": {
    "test": "jest && eslint ./Sources/",
    "test:only": "jest",
    "build": "node scripts/build.mjs",
    "build:minify": "node scripts/build.mjs --minify",
    "deploy": "node scripts/build.mjs --minify --deploy",
    "validate:esm": "node scripts/validate-esm.mjs && node scripts/check-esm-coverage.mjs"
  },
  "devDependencies": {
    "@types/lz-string": "^1.5.0",
    "eslint": "^8.57.0",
    "jest": "^29.7.0",
    "jest-environment-jsdom": "^29.7.0"
  }
}
```

### Files to Delete

After all prior sections are complete, these files are obsolete:

| File | Reason |
|------|--------|
| `scripts/build.mjs` | Replaced by `vite build` |
| `create_tests.sh` | Replaced by Vitest's native ESM import resolution |
| `run_tests.sh` | Replaced by `npm test` (now Vitest) |
| `jest.config.js` | Replaced by vitest config in `vite.config.js` |
| `jest.setup.js` | Replaced by `vitest.setup.js` |
| `scripts/validate-esm.mjs` | Vite's module resolution makes this unnecessary |
| `scripts/check-esm-coverage.mjs` | Vite's module resolution makes this unnecessary |

---

## Tests

Write these tests FIRST before implementing. They verify the CI cleanup is correct.

### F.1 CI Pipeline Tests

**File**: `/Users/studio/Documents/GitHub/FehBattleSimulator/Tests/CiCleanup.test.js`

Tests to verify the CI workflow file has been properly updated:

- **Test**: The workflow file `.github/workflows/jekyll.yml` contains `vitest run` (or `npm test` which maps to vitest) instead of jest
- **Test**: The workflow file does not reference `create_tests.sh` or `run_tests.sh`
- **Test**: The workflow file contains a `vite build` step (or `npm run build` which maps to vite build)
- **Test**: ESLint continues to be executed in the CI pipeline

These can be implemented as file-content assertion tests: read the workflow YAML as a string and assert on its contents.

### F.2 Cleanup Verification Tests

Tests to verify obsolete files have been removed and package.json is correct:

- **Test**: The following files do NOT exist: `scripts/build.mjs`, `create_tests.sh`, `run_tests.sh`, `jest.config.js`, `jest.setup.js`
- **Test**: `package.json` does not contain `jest` or `jest-environment-jsdom` in devDependencies
- **Test**: `package.json` scripts.test contains `vitest` (not `jest`)
- **Test**: `package.json` scripts.build contains `vite build` (not `build.mjs`)

These tests use `fs.existsSync` and JSON parsing of `package.json`.

### F.4 Final Smoke Tests

These are integration-level verifications:

- **Test**: `vite build` exits with code 0 (run as a child process in test, or verify manually)
- **Test**: `vitest run` exits with code 0 and all tests pass
- **Test**: The `dist/` output contains HTML files for all 8 simulators
- **Test (Manual)**: `vite` dev server starts and each simulator page loads without console errors

---

## Implementation

### Step 1: Update CI Workflow

**File to modify**: `/Users/studio/Documents/GitHub/FehBattleSimulator/.github/workflows/jekyll.yml`

Replace the current test steps with Vite/Vitest equivalents. The updated workflow should:

1. Keep the Jekyll build step unchanged (it serves the documentation site)
2. Keep the Node.js setup step unchanged
3. Keep `npm install`
4. **Remove** the "Create Test" step (`./create_tests.sh`)
5. **Replace** the "Run Test and Lint" step (`./run_tests.sh`) with two explicit steps:
   - `npm test` (which will now run `vitest run && eslint ./Sources/`)
   - `npm run build` (which will now run `vite build`)

The updated steps section should look approximately like:

```yaml
    steps:
      - uses: actions/checkout@v3
      - name: Build the site in the jekyll/builder container
        run: |
          docker run \
          -v ${{ github.workspace }}:/srv/jekyll -v ${{ github.workspace }}/_site:/srv/jekyll/_site \
          jekyll/builder:latest /bin/bash -c "chmod 777 /srv/jekyll && jekyll build --future"
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version-file: 'package.json'
      - name: npm install
        run: npm install
      - name: Run Test and Lint
        run: npm test
      - name: Build
        run: npm run build
```

Consider also updating `actions/checkout` and `actions/setup-node` from `v3` to `v4` if appropriate, though this is optional and not strictly part of the migration.

### Step 2: Delete Obsolete Files

Remove the following files from the repository:

- `/Users/studio/Documents/GitHub/FehBattleSimulator/scripts/build.mjs`
- `/Users/studio/Documents/GitHub/FehBattleSimulator/create_tests.sh`
- `/Users/studio/Documents/GitHub/FehBattleSimulator/run_tests.sh`
- `/Users/studio/Documents/GitHub/FehBattleSimulator/jest.config.js`
- `/Users/studio/Documents/GitHub/FehBattleSimulator/jest.setup.js`
- `/Users/studio/Documents/GitHub/FehBattleSimulator/scripts/validate-esm.mjs`
- `/Users/studio/Documents/GitHub/FehBattleSimulator/scripts/check-esm-coverage.mjs`

Also check whether `Sources/Local.js` is still referenced anywhere. If Vite dev server has fully replaced its functionality (as done in Section 05), it should be deleted or reduced to a minimal stub.

Check if the `scripts/` directory is now empty after deletions. If so, remove the directory entirely.

### Step 3: Update package.json

**File to modify**: `/Users/studio/Documents/GitHub/FehBattleSimulator/package.json`

**Scripts** -- update to:

```json
{
  "scripts": {
    "test": "vitest run && eslint ./Sources/",
    "test:only": "vitest run",
    "test:watch": "vitest",
    "build": "vite build",
    "dev": "vite",
    "deploy": "<keep compatible with existing deploy flow, update to use vite build>"
  }
}
```

The `deploy` script needs careful handling. The current `deploy` script runs `node scripts/build.mjs --minify --deploy` which likely copies built files to a deploy location. Examine `scripts/build.mjs` before deleting it to understand what `--deploy` does, and replicate that behavior either as a separate deploy script or a post-build step.

The `validate:esm` script should be removed entirely since Vite handles module resolution natively.

**devDependencies** -- remove:

- `jest`
- `jest-environment-jsdom`

The `@types/lz-string` package can be kept if TypeScript type hints are still useful, or removed if not needed.

Ensure these packages are already present (added by prior sections):

- `vite`
- `vitest`
- `@vitejs/plugin-vue`
- `vue` (runtime dependency, may be in dependencies rather than devDependencies)
- `pinia`

### Step 4: Update CLAUDE.md

**File to modify**: `/Users/studio/Documents/GitHub/FehBattleSimulator/CLAUDE.md`

Update the "Running & Testing" section to reflect the new tooling:

- Replace references to `./run_tests.sh` and `create_tests.sh` with `npm test` / `vitest run`
- Remove the paragraph about `create_tests.sh` concatenating files into `All.test.js`
- Update the "How tests work" section to explain that each test file uses ESM imports directly
- Remove the note about adding new source files to `create_tests.sh`'s `SOURCE_FILE_NAMES` array
- Add instructions for `npm run dev` (Vite dev server)
- Update the "Local Development" section to mention `npm run dev` instead of opening HTML files directly

### Step 5: Update .dockerignore / Dockerfile (if present)

Check if `docker-compose.yml` or `Dockerfile` references `create_tests.sh`, `run_tests.sh`, or Jest. If so, update accordingly.

### Step 6: Final Verification Checklist

Perform these verifications (some automated via tests, some manual):

1. Run `npm test` locally -- all Vitest tests pass and ESLint passes
2. Run `npm run build` locally -- `dist/` is generated with all 8 simulator HTML files
3. Run `npm run dev` locally -- dev server starts, simulators load in browser
4. Push to a branch and verify CI passes on GitHub Actions
5. Open each of the 8 simulators in a browser from the `dist/` output and verify basic functionality:
   - ArenaSimulator.html
   - SummonerDuelsSimulator.html
   - UnitBuilder.html
   - StatusCalculator.html
   - AetherRaidSimulator.html (main simulator)
   - DamageCalculator.html
   - HeroIconOverview.html
   - HeroStatusClustering.html

---

## Key Risks and Mitigations

**Deploy script compatibility**: The `--deploy` flag in the old `build.mjs` may perform additional operations (file copying, path rewriting). Before deleting `build.mjs`, read through its deploy logic and ensure it is replicated or no longer needed.

**CI environment differences**: The CI runs on `ubuntu-latest` with Docker for Jekyll. Ensure Vite and Vitest work correctly in that environment. Node.js `>=22` is already specified, which supports ESM natively.

**ESLint configuration**: ESLint `^8.57.0` is kept. If ESLint config references Jest globals or plugins, those references need to be updated to Vitest equivalents (e.g., `eslint-plugin-jest` replaced with equivalent vitest config, or Jest globals removed from ESLint `env`).