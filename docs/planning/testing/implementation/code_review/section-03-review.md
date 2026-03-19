# Code Review: Section 03 - BattleScenarioBuilder

The implementation broadly matches the plan but has several issues ranging from contradictory test logic to missing validation.

## High Severity

### 1. Cleanup semantics contradict the plan (test line 275)
The plan explicitly states: 'Cleanup: Set g_appData = null' and the verification checklist says 'g_appData is null after execute() returns'. However, the implementation calls `resetGlobalTestState()` which sets `g_appData = new UnitManager()` (not null). The test at line 275 then asserts `expect(g_appData).toBeInstanceOf(UnitManager)` -- validating the wrong behavior. This is internally consistent but directly contradicts the plan's specification. Either the plan should be updated or the cleanup should set `g_appData = null` as specified. The test labeled 'execute() cleans up global state afterward' is essentially testing that `resetGlobalTestState()` works, not that execute() properly isolates state.

### 2. executeBeginningOfTurn() cleans up before caller can inspect results (TestUtilities.js line 469)
The `executeBeginningOfTurn()` method calls `resetGlobalTestState()` at the end, which resets `g_appData` to a fresh `UnitManager`. This means the caller cannot inspect unit state that depends on `g_appData` after the call. More critically, the test for `executeBeginningOfTurn()` (test line 234-241) only checks that it 'should not throw' -- it does not verify any actual beginning-of-turn skill effect was applied. The plan says: 'Assert that the skill effect was applied to the unit'.

## Medium Severity

### 3. Spur adjacency relies on fragile auto-placement assumptions (test lines 181-183)
The 'addAlly' test places the ally at position (0,0) and relies on the attacker being auto-placed at (0,1) via `_findFreePosition(0, occupied)`. Since (0,0) is occupied by the ally, the attacker gets (0,1). This makes the test pass only because spur skills require adjacency (1 tile). If the auto-placement algorithm changes, the spur test silently breaks.

### 4. No validation in executeBeginningOfTurn() for required units
The `execute()` method properly validates that both attacker and defender are set. However, `executeBeginningOfTurn()` has no validation. `_autoPlaceUnits()` will crash with a null pointer if `_attacker` is null since it accesses `this._attacker._hasExplicitPosition` unconditionally.

### 5. onTurn test only checks internal state, not observable behavior
The plan says: 'Assert that the battle context turn number was 3'. The test only asserts `builder._turn === 3` (internal field access) and that result is defined. Does not verify the turn number was actually propagated to the battle context.

## Low Severity

### 6. _findFreePosition fallback returns occupied position
If all 100 rows in a column are occupied, `_findFreePosition` returns `[col, 0]` which is already occupied. Should throw an error instead.

### 7. Attacker placement comment is misleading
The comment says 'Auto-place attacker at (0,1)' but the code calls `_findFreePosition(0, occupied)` which returns the first free row in column 0, not necessarily (0,1).

### 8. No test for reuse/immutability
The plan mentions: 'allows units to be built once and shared across multiple scenarios'. No test validates that executing a scenario does not corrupt the Unit objects for reuse.
