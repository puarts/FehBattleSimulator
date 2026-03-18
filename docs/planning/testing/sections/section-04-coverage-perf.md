# Section 04: Coverage and Performance

## Overview

This section covers two independent infrastructure improvements:
1. **Coverage measurement** -- configuring Jest to collect code coverage, integrating with CI, and managing the `coverage/` output directory.
2. **Performance regression tests** -- creating `Tests/Performance.test.js` with benchmarks for key operations, using warmup runs and environment-aware thresholds.

**Dependencies**: Section 01 (test split architecture) must be completed first. Specifically, `Performance.test.js` must be registered in `create_tests.sh`'s `TEST_FILE_NAMES` array and placed in the `infra` category.

---

## Files to Create or Modify

| File | Action | Description |
|------|--------|-------------|
| `/Users/studio/Documents/GitHub/FehBattleSimulator/jest.config.js` | Modify | Add coverage configuration |
| `/Users/studio/Documents/GitHub/FehBattleSimulator/.gitignore` | Modify | Add `coverage/` entry |
| `/Users/studio/Documents/GitHub/FehBattleSimulator/.github/workflows/jekyll.yml` | Modify | Add `--coverage` flag to CI test command |
| `/Users/studio/Documents/GitHub/FehBattleSimulator/Tests/Performance.test.js` | Create | Performance benchmark tests |

---

## Part 1: Coverage Measurement

### Background: Constraints of the Concatenation Approach

This project uses `create_tests.sh` to concatenate all source files and test files into a single `All.test.js`, which Jest then executes. This means Jest's standard file-level coverage tracking (`collectCoverageFrom`) is ineffective -- Jest only sees the single concatenated file. Coverage will therefore be measured as line coverage of `All.test.js` as a whole. File-level granularity will only become possible if/when the project migrates to a module-based architecture.

### Tests (Verification Items)

Coverage configuration is settings-only (no test code needed). Verify manually:

- Running `npx jest --coverage` produces a `coverage/` directory containing reports.
- In CI (where `CI=true` is set by GitHub Actions), coverage is collected automatically.
- In local development, coverage is **not** collected by default (only when `--coverage` is explicitly passed).

### Implementation: jest.config.js Changes

Modify `/Users/studio/Documents/GitHub/FehBattleSimulator/jest.config.js` to add three properties to the exported config object:

```javascript
// Collect coverage only in CI (GitHub Actions sets CI=true)
collectCoverage: !!process.env.CI,

// Output directory for coverage reports
coverageDirectory: "coverage",

// Reporter formats: summary for terminal, lcov for HTML, json-summary for tooling
coverageReporters: ['text-summary', 'lcov', 'json-summary'],
```

The existing `coverageProvider: "v8"` line is already present (currently commented-out in the default template but active in the config). Keep it as-is.

**Do NOT set** `collectCoverageFrom` -- it is ineffective with the concatenated file approach.

**Do NOT set** `coverageThreshold` initially. The plan is to measure a baseline after all Phase 1 tests are in place, then set thresholds at 90% of that baseline. This will be revisited in a later phase.

### Implementation: .gitignore Update

Add `coverage/` to `/Users/studio/Documents/GitHub/FehBattleSimulator/.gitignore` in the "Generated files" section:

```
# Generated files
All.test.js
coverage/
```

### Implementation: GitHub Actions CI Workflow

Modify `/Users/studio/Documents/GitHub/FehBattleSimulator/.github/workflows/jekyll.yml`. The current workflow runs:

```yaml
- name: Create Test
  run: ./create_tests.sh
- name: Run Test and Lint
  run: ./run_tests.sh
```

Since `run_tests.sh` calls `create_tests.sh` internally, the separate "Create Test" step is redundant but harmless. The key change is that `CI=true` is already set by GitHub Actions, so the `collectCoverage: !!process.env.CI` setting in `jest.config.js` will automatically enable coverage in CI without any workflow file changes.

**No changes to the workflow file are needed at this stage.** Coverage collection is triggered by the `jest.config.js` configuration detecting the `CI` environment variable. If a future phase wants to add coverage report comments on PRs, that can be added later after verifying compatibility with the concatenation approach.

---

## Part 2: Performance Regression Tests

### Background

The project's main performance-sensitive operation is "all-hero battle calculation." The local baseline is approximately 238ms. CI environments (GitHub Actions shared runners) can be 3-5x slower, so thresholds must account for this variance.

The test file uses warmup iterations before measurement to allow V8's JIT compiler to optimize hot paths, preventing flaky failures from cold-start overhead.

### Tests

Create `/Users/studio/Documents/GitHub/FehBattleSimulator/Tests/Performance.test.js` with the following test stubs:

```javascript
describe('Performance benchmarks', () => {
    const isCI = !!process.env.CI;

    test('全英雄戦闘計算がCI閾値(1200ms)/ローカル閾値(480ms)以内で完了する', () => {
        // 1. Warmup: run the calculation 5 times to trigger V8 JIT optimization
        // 2. Measure: run once more, recording elapsed time with performance.now()
        // 3. Assert: expect(duration).toBeLessThan(isCI ? 1200 : 480)
    });

    test('ターン開始スキル適用（全英雄）が閾値以内で完了する', () => {
        // Similar warmup + measure pattern
        // Use test_BeginningOfTurnSkillHandler or equivalent
        // CI threshold: 1000ms, Local threshold: 400ms (adjust after baseline measurement)
    });

    test('ユニット初期化（test_HeroDatabase全英雄生成）が閾値以内で完了する', () => {
        // Measure g_testHeroDatabase-based unit creation for all heroes
        // CI threshold: 500ms, Local threshold: 200ms (adjust after baseline measurement)
    });
});
```

### Implementation Details

**Warmup pattern**: Each benchmark must run the target operation 5 times before the measured run. This is critical because V8's JIT compiler optimizes frequently-called functions, and the first few executions are interpreted (much slower). Without warmup, tests become flaky in CI.

```javascript
// Pattern for each benchmark
function runBenchmark(operation, ciThreshold, localThreshold) {
    const threshold = isCI ? ciThreshold : localThreshold;

    // Warmup (5 iterations)
    for (let i = 0; i < 5; i++) {
        operation();
    }

    // Measured run
    const start = performance.now();
    operation();
    const duration = performance.now() - start;

    expect(duration).toBeLessThan(threshold);
}
```

**Threshold values**:

| Benchmark | Local Threshold | CI Threshold | Rationale |
|-----------|----------------|--------------|-----------|
| All-hero battle calculation | 480ms | 1200ms | Baseline 238ms x2 (local), x5 (CI) |
| Beginning-of-turn skills | 400ms | 1000ms | Estimate, adjust after baseline |
| Unit initialization | 200ms | 500ms | Estimate, adjust after baseline |

**Environment detection**: Use `process.env.CI` which GitHub Actions sets to `"true"` automatically. The `isCI` constant should be defined at the `describe` block level.

**Existing test infrastructure to leverage**: The test globals already provide `g_testHeroDatabase` and `test_DamageCalculator`. The "all-hero battle calculation" benchmark should mirror what the existing `test_executeTest` function does -- creating a `test_DamageCalculator`, registering all heroes, and running `calcDamage` across combinations.

### Registration in create_tests.sh

This file must be registered in `create_tests.sh`'s `TEST_FILE_NAMES` array. This is handled by Section 01 (test split architecture), which adds `Performance.test.js` to both the `TEST_FILE_NAMES` array and the `infra` category mapping.

After Section 01 is complete, verify that `./run_tests.sh infra` includes and runs the performance tests.

---

## Implementation Checklist

1. Modify `jest.config.js`: add `collectCoverage`, `coverageDirectory`, `coverageReporters`
2. Modify `.gitignore`: add `coverage/`
3. Create `Tests/Performance.test.js` with three benchmark tests (all-hero battle, beginning-of-turn, unit initialization)
4. Verify locally: `npx jest --coverage` produces `coverage/` directory
5. Verify locally: `npx jest` (without flag) does NOT produce coverage
6. Verify performance tests pass: `./run_tests.sh infra` (requires Section 01 completion)
7. Adjust threshold values based on actual measured baselines if initial estimates are off