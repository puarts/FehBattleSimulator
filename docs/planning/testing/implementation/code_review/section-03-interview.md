# Code Review Interview: Section 03 - BattleScenarioBuilder

**Date:** 2026-03-19

## Interview Items

### 1. Cleanup semantics (High) — DISCUSSED
**Issue:** Plan specifies `g_appData = null` but implementation uses `resetGlobalTestState()` due to SkillInfo constructor crash.
**Decision:** User chose to keep `resetGlobalTestState()`. Plan documentation will be updated to reflect this.
**Action:** KEEP (update plan docs)

## Auto-Fixes

### 2. executeBeginningOfTurn() test is too weak — AUTO-FIX
The test only checks "should not throw" but doesn't verify any skill effect. Will improve to actually verify a beginning-of-turn effect is applied.
**Action:** FIX

### 3. No validation in executeBeginningOfTurn() — AUTO-FIX
`_autoPlaceUnits()` will crash if `_attacker` is null. Will add null guard.
**Action:** FIX

### 4. Attacker placement comment misleading — AUTO-FIX
Comment says "Auto-place attacker at (0,1)" but code uses `_findFreePosition` which finds first free row.
**Action:** FIX

## Let Go

- Spur adjacency fragile (deterministic auto-placement, test works correctly)
- onTurn test checks internal state (verifying via turn-dependent skill would be overengineering)
- _findFreePosition fallback (100 units unrealistic)
- No reuse test (not mandated by plan, units not designed for cross-scenario reuse)
