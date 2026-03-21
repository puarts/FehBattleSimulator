# Section 02 Code Review Interview

## Issue #1: Duplicated test coverage (medium)
- **Triage**: Auto-fix — Removed duplicated StatusIndex value tests (already in StatusConstants.test.js). Added comment referencing existing tests.

## Issue #2: Hardcoded file list (medium)
- **Triage**: Let go — The static list is acceptable for a regression guard. Dynamic discovery would add complexity without proportionate benefit.

## Issue #3: Regex doesn't catch all patterns (low-medium)
- **Triage**: Auto-fix — Extended regex to use `'gs'` flag for multi-line matching. Added all Layer 5 files (SkillEffectCore, SkillEffectField, etc.) to the import source check.

## Issue #4: Missing Layer 4 files (low)
- **Triage**: Auto-fix — Added L4 files (DamageCalculator.js, DamageCalculatorWrapper.js, BeginningOfTurnSkillHandler.js, HeroDatabase.js, SkillDatabase.js) to the checked file list. Test name updated to "Layer 1-4".

## Applied Fixes
- Removed duplicate StatusIndex value assertions (4 tests)
- Extended file check from L1-3 to L1-4 (added 5 files)
- Extended import source check from SkillEffect.js only to all Layer 5 files (7 files)
- Added multi-line import matching via `'gs'` regex flag
