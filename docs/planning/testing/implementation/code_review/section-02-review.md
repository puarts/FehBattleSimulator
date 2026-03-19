# Code Review: Section 02 - UnitBuilder

1. SPEC DEVIATION: resetGlobalTestState sets g_appData to new UnitManager() instead of null. Reason: SkillInfo constructor accesses g_appData.isDebugMenuEnabled, causing NPE if null.

2. INCOMPLETE extractCombatSnapshot: Plan specifies extracting followup/special activation. Implementation only has 6 fields.

3. WEAK extractCombatSnapshot fields: Missing totalAttackCount for followup detection.

4. MISSING saveCurrentHpAndSpecialCount: withStats/withHpPercent don't call it, causing restHp snapshot to be stale.

5. PERFORMANCE: Every skill setter calls updateUnitSkillInfo individually. Chaining is wasteful.

6. MISSING atPosition null safety: No null check on placedTile.

7. TEST QUALITY - withWeapon test: Only checks weapon ID, not stats recalculation.

8. TEST QUALITY - extractCombatSnapshot test: Only checks property existence, not values.

9. MISSING withHp individual setter: withAtk/withSpd/withDef/withRes exist but no withHp.
