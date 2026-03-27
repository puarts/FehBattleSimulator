# Code Review: Section 04 - UnitUtility

The implementation is a clean, faithful execution of the plan. All 7 symbols (UnitUtil, calcBuffAmount, calcHealAmount, isDebufferTier1, isDebufferTier2, isAfflictor, canRefreshTo) were moved verbatim from Unit.js to UnitUtility.js with no logic changes. The code in the new file is character-identical to the deleted code. All required registration points are updated correctly:

1. Deploy.bat: All 4 lines containing unit\Unit now include unit\UnitUtility immediately after, matching the plan.
2. HTML files: All 7 specified HTML files have the script entry added in the correct position.
3. create_tests.sh: Both SOURCE_FILE_NAMES and TEST_FILE_NAMES arrays updated correctly.
4. Load order: UnitContext -> Unit -> UnitUtility -> UnitManager is consistent across all 3 systems.
5. ESLint globals: The /* global */ comment in UnitUtility.js covers all 20 symbols listed in the plan.
6. Tests: UnitUtility.test.js contains all 7 global scope availability checks as specified.

Minor observations (not blocking):

- The `.call(this, ...)` pattern in calcHealAmount and isAfflictor is a known pre-existing issue where `this` is meaningless in a standalone function. Correctly left unchanged per the plan's 'no logic changes' rule, but remains technical debt.

- Tests are purely existence checks. Existing tests in DamageCalculator.test.js etc. serve as regression coverage. Acceptable for a pure move refactor.

Overall: The implementation matches the plan precisely. No issues found.
