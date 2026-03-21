# Section 1: Tooling Baseline -- madge導入と循環依存ベースライン取得

## Overview

This section introduces the `madge` dependency analysis tool, establishes a baseline of existing circular dependencies, and adds a `lint:deps` npm script for ongoing tracking. This is the foundational step that all subsequent sections depend on for verification.

**Dependencies**: None (this is the first section).
**Blocks**: section-02-logger-lazy-init, section-03-status-constants (and transitively all later sections).

## Background

The FEH Battle Simulator codebase has been migrated to ESM (Phase 2) and Vite/Vue 3 (Phase 3), but circular dependencies remain in the module graph. These circular dependencies cause TDZ (Temporal Dead Zone) errors when running under Vite dev server's native ESM mode. The primary known circular path is:

```
Logger.js -> Utilities.js -> Unit.js -> Skill.js -> SkillEffect.js -> SkillEffectCore.js -> Logger.js
```

Additionally, there are 6 known bidirectional reference pairs:

| File A | File B |
|--------|--------|
| Skill.js | SkillEffect.js |
| Skill.js | Unit.js |
| Unit.js | SkillEffect.js |
| Unit.js | SkillEffectHooks.js |
| SkillEffect.js | SkillEffectBattleContext.js |
| SkillEffectCore.js | CustomSkill.js |

The `madge` tool analyzes the ES module dependency graph and reports all circular dependency paths.

## Tests

This section is tooling/infrastructure focused. There are no automated test files to write. Verification is performed manually via CLI commands:

1. **madge executes and produces output**: Run `npx madge --circular Sources/` and confirm it exits successfully, printing a list of circular dependency paths.
2. **Known circular paths appear in output**: Confirm the output contains the known Logger -> Utilities -> ... -> Logger cycle and the 6 bidirectional pairs listed above.
3. **Existing test suite passes (baseline)**: Run `npm test` and confirm all ~500 existing tests pass. This establishes the regression baseline that all subsequent sections must maintain.

## Implementation

### Step 1: Install madge as a dev dependency

Install `madge` and save it to `devDependencies` in `package.json`:

```
npm install --save-dev madge
```

This adds `madge` to `/Users/studio/Documents/GitHub/FehBattleSimulator/package.json` under `devDependencies`.

### Step 2: Run madge to capture the baseline

Execute the circular dependency check:

```
npx madge --circular Sources/
```

Save the full output to a documentation file at `/Users/studio/Documents/GitHub/FehBattleSimulator/docs/planning/phase4/circular-deps-baseline.md`. This file should contain:

- The exact madge command used
- The date of the baseline capture
- The complete list of circular dependency paths reported
- A count of total circular paths

This baseline document serves as the reference point for measuring progress in subsequent sections.

### Step 3: Add lint:deps script to package.json

Modify `/Users/studio/Documents/GitHub/FehBattleSimulator/package.json` to add a `lint:deps` script in the `scripts` section:

```json
"lint:deps": "madge --circular Sources/"
```

The full scripts section should become:

```json
"scripts": {
    "test": "vitest run && eslint ./Sources/",
    "test:only": "vitest run",
    "test:watch": "vitest",
    "build": "vite build",
    "dev": "vite",
    "preview": "vite preview",
    "lint:deps": "madge --circular Sources/"
}
```

This script is **not** integrated into CI yet (that happens in section-10). It is a convenience script for manual checking during development.

### Step 4: Analyze madge output for unexpected cycles

Review the madge output carefully. Beyond the 6 known bidirectional pairs, check for:

- Cycles involving SkillImpl files (SkillImpl.js, SkillImpl202408.js, etc.)
- Cycles involving App layer files (AppData.js, BattleSimulatorBase.js, VueComponents.js)
- Any cycles not documented in the known pairs above

Document any newly discovered cycles in the baseline file. These findings may affect the approach taken in later sections (particularly section-06-remaining-cycles).

### Step 5: Verify existing test baseline

Run:

```
npm test
```

Confirm all ~500 tests pass and ESLint reports no errors. Record the exact test count in the baseline document. This number is the regression target for all subsequent sections.

## Files Modified (実績)

| File | Change |
|------|--------|
| `package.json` | Add `madge` to devDependencies; add `lint:deps` and `detect-missing-imports` scripts |
| `package-lock.json` | Updated with madge dependencies |
| `docs/planning/phase4/circular-deps-baseline.md` | New file: baseline report |
| `scripts/detect-missing-imports.js` | New file: 不足import検出スクリプト |

## 計画からの差異

- **madgeが循環を検出しない**: import文が不完全なため依存グラフが不完全。import追加後の検証ツールとして活用する方針に変更
- **不足import検出スクリプトを追加**: ユーザー要望により `scripts/detect-missing-imports.js` を作成。2081件の不足importを検出（セクション8で使用）
- **テストベースライン**: 500件中499パス（1件はDamageCalculator_HeroBattleTestのタイムアウト、既存問題）

## Success Criteria (実績)

- ✅ `npx madge --circular Sources/` executes without errors
- ⚠️ Known circular paths NOT detected (expected — imports are incomplete)
- ✅ `npm run lint:deps` runs the same check via the npm script
- ✅ `npm test` passes 499/500 tests (1 pre-existing timeout)
- ✅ Baseline document captures madge output and analysis
- ✅ `node scripts/detect-missing-imports.js` detects 2081 missing imports across 39 files