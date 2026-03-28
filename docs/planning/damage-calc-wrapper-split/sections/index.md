<!-- PROJECT_CONFIG
runtime: typescript-npm
test_command: ./run_tests.sh
END_PROJECT_CONFIG -->

<!-- SECTION_MANIFEST
section-01-preparation
section-02-init-dict-split
section-03-apply-skill-effects-split
section-04-spur-split
section-05-followup-counter-split
section-06-final-verification
END_MANIFEST -->

# Implementation Sections Index

## Dependency Graph

| Section | Depends On | Blocks | Parallelizable |
|---------|------------|--------|----------------|
| section-01-preparation | - | 02, 03, 04, 05 | Yes |
| section-02-init-dict-split | 01 | 06 | No |
| section-03-apply-skill-effects-split | 02 | 06 | No |
| section-04-spur-split | 03 | 06 | No |
| section-05-followup-counter-split | 04 | 06 | No |
| section-06-final-verification | 02, 03, 04, 05 | - | No |

## Execution Order

1. section-01-preparation (no dependencies)
2. section-02-init-dict-split (after 01)
3. section-03-apply-skill-effects-split (after 02)
4. section-04-spur-split (after 03)
5. section-05-followup-counter-split (after 04)
6. section-06-final-verification (after all splits complete)

Note: Sections 02-05 are sequential because each modifies DamageCalculatorWrapper.js (removing methods from it), so they must be applied in order to avoid conflicts.

## Section Summaries

### section-01-preparation
Phase 1 of the plan. Run baseline tests, perform preflight checks (file-scope variables, `#` private fields, instantiation timing, reference audit), create `definePrototypeMethods` helper in core file, create new test file with constructor smoke test, public API names assertion, and definePrototypeMethods unit tests.

### section-02-init-dict-split
Phase 2 of the plan. Create `DamageCalculatorWrapper_InitSkillEffectDict_AtkDef.js` and `DamageCalculatorWrapper_InitSkillEffectDict_Unit.js`. Move the 4 init methods, wrap with `definePrototypeMethods`, add load guards. Update all 3 load order systems. Verify tests pass.

### section-03-apply-skill-effects-split
Phase 3 of the plan. Create `DamageCalculatorWrapper_ApplySkillEffects.js`. Move skill effect application methods, wrap with `definePrototypeMethods`, add load guards. Update load order. Verify tests pass.

### section-04-spur-split
Phase 4 of the plan. Create `DamageCalculatorWrapper_Spur.js`. Move all Spur-related methods (update, application, helpers, bonus/debuff utilities), wrap with `definePrototypeMethods`, add load guards. Update load order. Verify tests pass.

### section-05-followup-counter-split
Phase 5 of the plan. Create `DamageCalculatorWrapper_FollowupAndCounter.js`. Move followup attack, counter attack, damage reduction, and fixed damage methods. Wrap with `definePrototypeMethods`, add load guards. Update load order. Verify tests pass.

### section-06-final-verification
Phase 6 of the plan. Run full test suite, ESLint, browser verification. Confirm all files are within size targets. Run public API names assertion. Document final file sizes and structure.
