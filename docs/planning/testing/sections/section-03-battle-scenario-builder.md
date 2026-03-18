# Section 03: BattleScenarioBuilder

## Overview

This section implements `BattleScenarioBuilder`, a declarative helper class for constructing and executing battle scenarios in tests. It is added to `Sources/TestUtilities.js` alongside the existing `test_DamageCalculator` and `test_BeginningOfTurnSkillHandler` classes.

`BattleScenarioBuilder` wraps the low-level test infrastructure (`test_DamageCalculator`, `test_BeginningOfTurnSkillHandler`, `UnitManager`, `g_appData`) into a fluent API that handles unit registration, automatic position assignment, combat execution, and post-execution cleanup.

## Dependencies

- **section-02-unit-builder**: `UnitBuilder` must be implemented first. `BattleScenarioBuilder` receives already-built `Unit` objects (from `UnitBuilder.build()`).
- **section-01-test-split**: The test file `Tests/TestHelper.test.js` must be registered in `create_tests.sh`'s `TEST_FILE_NAMES` array and categorized under `infra`.

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `Sources/TestUtilities.js` | Modify | Add `BattleScenarioBuilder` class |
| `Tests/TestHelper.test.js` | Modify | Add BattleScenarioBuilder tests (this file is created in section-02) |

## Tests (Write First)

All tests go in `Tests/TestHelper.test.js` within a dedicated `describe` block. These tests validate the BattleScenarioBuilder API. Write these test stubs before implementing.

```javascript
describe('BattleScenarioBuilder', () => {
    beforeEach(() => {
        resetGlobalTestState();
    });

    test('withAttacker(unit).withDefender(unit).execute() returns a combat result', () => {
        // Create two units via UnitBuilder (from section-02)
        // Execute a battle scenario
        // Assert that result is defined and contains expected combat result properties
        // (e.g., result.atkUnit_normalAttackDamage is a number)
    });

    test('addAlly(unit) registers an ally unit in the battle', () => {
        // Create attacker, defender, and an ally unit
        // The ally should have a spur/drive skill (e.g., PassiveC.SpurAtk3 or similar)
        // Execute the battle
        // Assert that the ally's spur effect is reflected in attacker's combat stats
    });

    test('addFoe(unit) registers an enemy unit in the battle', () => {
        // Create attacker, defender, and a foe unit
        // The foe should have a spur/drive skill affecting the defender
        // Execute the battle
        // Assert that the foe's spur effect is reflected in defender's combat stats
    });

    test('onTurn(3) sets the turn number correctly', () => {
        // Create attacker and defender
        // Set onTurn(3)
        // Execute the battle
        // Assert that the battle context's turn number was 3
        // (May need to verify via a turn-dependent skill effect)
    });

    test('executeBeginningOfTurn() runs beginning-of-turn processing', () => {
        // Create a unit with a beginning-of-turn skill (e.g., a skill that grants bonus at turn start)
        // Execute beginning of turn
        // Assert that the skill effect was applied to the unit
    });

    test('units without explicit positions are auto-placed without overlap', () => {
        // Create attacker and defender without calling atPosition()
        // Add multiple allies and foes without positions
        // Execute the battle
        // Assert all units have distinct (posX, posY) pairs on their placedTile
    });

    test('execute() cleans up global state afterward', () => {
        // Execute a battle scenario
        // After execute(), verify g_appData is null (or reset)
        // Create and execute a second scenario
        // Verify the second result is not affected by the first
    });
});
```

## Implementation Details

### BattleScenarioBuilder Class

Add the following class to `Sources/TestUtilities.js`, after the existing `test_DamageCalculator` class.

```javascript
class BattleScenarioBuilder {
    constructor() {
        this._attacker = null;
        this._defender = null;
        this._allies = [];    // Additional ally units (not including attacker)
        this._foes = [];      // Additional foe units (not including defender)
        this._turn = 1;
    }

    /**
     * Set the attacking unit (must be a built Unit from UnitBuilder).
     * @param {Unit} unit
     * @returns {BattleScenarioBuilder}
     */
    withAttacker(unit) { /* store unit, return this */ }

    /**
     * Set the defending unit (must be a built Unit from UnitBuilder).
     * @param {Unit} unit
     * @returns {BattleScenarioBuilder}
     */
    withDefender(unit) { /* store unit, return this */ }

    /**
     * Add an ally unit (same group as attacker).
     * @param {Unit} unit
     * @returns {BattleScenarioBuilder}
     */
    addAlly(unit) { /* push to _allies, return this */ }

    /**
     * Add a foe unit (same group as defender).
     * @param {Unit} unit
     * @returns {BattleScenarioBuilder}
     */
    addFoe(unit) { /* push to _foes, return this */ }

    /**
     * Set the turn number for combat context.
     * @param {number} turnNumber
     * @returns {BattleScenarioBuilder}
     */
    onTurn(turnNumber) { /* store turn, return this */ }

    /**
     * Execute combat between attacker and defender.
     * Handles: unit registration, auto-placement, g_appData setup, spur calculation, damage calculation, cleanup.
     * @returns {Object} Combat result from calcDamage
     */
    execute() { /* see internal logic below */ }

    /**
     * Execute beginning-of-turn processing for all registered units.
     * @returns {void}
     */
    executeBeginningOfTurn() { /* see internal logic below */ }
}
```

### Internal Logic for `execute()`

The `execute()` method must perform these steps in order:

1. **Validate**: Ensure `_attacker` and `_defender` are set.
2. **Auto-place units**: For any unit whose `placedTile` has not been explicitly set (or has position 0,0 which is the default), assign non-overlapping positions. A simple strategy:
   - Ally group units: place along column 0 (posX=0, posY=0,1,2,...) 
   - Enemy group units: place along column 5 (posX=5, posY=0,1,2,...)
   - Skip any position already occupied by a unit with an explicit position.
   - The attacker and defender should be placed at positions suitable for combat (e.g., adjacent or within attack range).
3. **Create `test_DamageCalculator`** instance.
4. **Register all units** into `calculator.unitManager.units` array: `[attacker, defender, ...allies, ...foes]`.
5. **Set `g_appData`** to `calculator.unitManager`.
6. **Set turn number** on `calculator.battleContext.currentTurn` (or equivalent property).
7. **Call `calculator.updateAllUnitSpur()`** to calculate spur/drive effects.
8. **Call `calculator.calcDamage(attacker, defender)`** and capture result.
9. **Cleanup**: Call `resetGlobalTestState()` (sets `g_appData` to a fresh `UnitManager` instead of `null` to avoid SkillInfo constructor crash).
10. **Return** the combat result.

### Internal Logic for `executeBeginningOfTurn()`

1. **Create `test_BeginningOfTurnSkillHandler`** instance.
2. **Register all units** into the handler's `unitManager.units`.
3. **Set `g_appData`** to handler's `unitManager`.
4. **Set turn number** on handler's `battleContext`.
5. **Call `applySkillsForBeginningOfTurn()`** for each unit.
6. **Cleanup**: Call `resetGlobalTestState()`.

### Auto-Placement Strategy

The auto-placement must ensure no two units share the same tile. The key insight from existing test code (e.g., `DamageCalculator.test.js`) is that positions are set via `unit.placedTile.posX` and `unit.placedTile.posY`.

A practical approach:
- Track all positions already assigned (units where `atPosition()` was called on the `UnitBuilder`).
- For unpositioned ally-group units: assign positions starting from (0, 0), incrementing Y, skipping occupied tiles.
- For unpositioned enemy-group units: assign positions starting from (5, 0), incrementing Y, skipping occupied tiles.
- The attacker should be near the defender for melee combat. A default arrangement: attacker at (0, 1), defender at (1, 0) if no positions were explicitly set.

**Detection of explicit positioning**: Since `UnitBuilder.atPosition()` sets `unit.placedTile.posX/posY`, and `test_createDefaultUnit` initializes the tile at (0, 0), the builder could mark units that had `atPosition()` called. One approach: add a flag property (e.g., `unit._hasExplicitPosition = true`) in `UnitBuilder.atPosition()`, or track positioned units in `BattleScenarioBuilder`. The simpler approach is to have `BattleScenarioBuilder` maintain a `Set` of units that were given positions via `atPosition()` before being passed in -- but since it receives already-built units, it needs a convention. The recommended approach is to add a `_hasExplicitPosition` boolean flag on the Unit in `UnitBuilder.atPosition()`.

### Relationship to Existing Helpers

`BattleScenarioBuilder` wraps the same primitives used in existing tests:
- `test_DamageCalculator` (defined in `Sources/TestUtilities.js` lines 105-158) -- creates `UnitManager`, `BattleMap`, `GlobalBattleContext`, `DamageCalculatorWrapper`
- `test_BeginningOfTurnSkillHandler` (lines 78-101) -- creates `BeginningOfTurnSkillHandler`
- `g_appData` global variable -- must be set to `unitManager` for skill effect lookups during combat

The existing `test_calcDamage` function (line 167) shows the minimal pattern: create calculator, set `g_appData`, call `calcDamage`. `BattleScenarioBuilder.execute()` extends this pattern with multi-unit support and auto-placement.

### Usage Example

After both section-02 and section-03 are implemented, a typical test looks like:

```javascript
test('Example: weapon skill grants Atk/Spd+5', () => {
    const attacker = UnitBuilder.createDummy(UnitGroupType.Ally)
        .withWeapon(Weapon.SomeWeapon)
        .build();
    const defender = UnitBuilder.createDummy(UnitGroupType.Enemy)
        .build();
    const result = new BattleScenarioBuilder()
        .withAttacker(attacker)
        .withDefender(defender)
        .execute();
    expect(result.atkUnit_normalAttackDamage).toBe(/* expected value */);
});
```

## Key Design Decisions

1. **Receives built Units, not UnitBuilders**: `BattleScenarioBuilder` takes `Unit` objects, not `UnitBuilder` instances. This keeps the two classes loosely coupled and allows units to be built once and shared across multiple scenarios if needed.

2. **Cleanup after execute()**: `resetGlobalTestState()` is called after each `execute()` call to prevent state leakage between tests. Using `null` was avoided because SkillInfo constructor accesses `g_appData.isDebugMenuEnabled` and crashes on null.

3. **Auto-placement is a convenience, not a requirement**: Units with explicit positions (set via `UnitBuilder.atPosition()`) keep their positions. Only unpositioned units get auto-placed. This allows tests to control positioning when it matters (e.g., testing spur ranges) while keeping simple tests concise.

4. **Turn number defaults to 1**: Most tests do not need a specific turn number. The `onTurn()` method is optional.

## Verification Checklist

After implementation, verify:
- [x] `BattleScenarioBuilder` can execute a basic 1v1 combat and return a result
- [x] Additional allies/foes are registered and their spur effects apply
- [x] `onTurn()` correctly sets the turn number in the battle context
- [x] `executeBeginningOfTurn()` triggers beginning-of-turn skill processing (verified with 伝承リリーナ special count)
- [x] Auto-placed units have no position overlaps
- [x] `g_appData` is reset to fresh UnitManager after `execute()` returns (not null — see design decisions)
- [x] Two consecutive `execute()` calls produce independent results
- [x] All 7 tests in `Tests/TestHelper.test.js` for the BattleScenarioBuilder block pass