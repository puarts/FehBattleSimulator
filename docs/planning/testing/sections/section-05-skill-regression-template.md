# Section 05: Skill Regression Test Template Pattern

## Overview

This section establishes the standardized template pattern for skill regression tests. It defines how to structure tests using `createDummy` (from UnitBuilder) and `BattleScenarioBuilder`, validates the template with a few known skills, and documents the regression verification approach. Once this template is validated, section-06 will use it to generate tests for all skills in SkillImpl202601.js and SkillImpl202501.js.

## Dependencies

- **section-02-unit-builder**: `UnitBuilder` class with `createDummy()`, `fromHero()`, fluent API methods (`withWeapon`, `withStats`, etc.), and `build()` must be implemented in `Sources/TestUtilities.js`
- **section-03-battle-scenario-builder**: `BattleScenarioBuilder` class with `withAttacker()`, `withDefender()`, `addAlly()`, `addFoe()`, `onTurn()`, `execute()`, and `executeBeginningOfTurn()` must be implemented in `Sources/TestUtilities.js`

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `Tests/SkillRegression.test.js` | Modified (was placeholder) | Skill regression test file with template pattern validation (11 tests) |
| `create_tests.sh` | Already done in section-01 | `SkillRegression.test.js` already in `TEST_FILE_NAMES` |

## Implementation Notes

### Actual Implementation Deviations

1. **`getSkillName` helper added**: Plan referenced `getSkillName(skillId)` but no such function existed. Created a helper using `g_testHeroDatabase.skillDatabase.findSkillInfoByDict(skillId)?.name` at the top of the test file. All skill validation test names use this for dynamic naming.

2. **Skill selection**: Plan left skill selection open. Actual choices:
   - **Weapon.ChosenLance** (氷の救世の槍) — unconditional, from SkillImpl202601.js, TRUE_NODE
   - **PassiveA.SwiftSpecter** (攻速無欠・鬼没) — conditional (HP >= 25% or within 3 spaces of ally)
   - **PassiveA.AtkSpdAirspace** (攻撃速さの領空) — positional (initiates combat or within 3 spaces of ally)
   - **PassiveB.WildAtHeart** (真獅子連斬) — added during review for PassiveB slot coverage

3. **`resetGlobalTestState()` required**: Each describe block needs `beforeEach(() => { resetGlobalTestState(); })` because `g_appData` is not initialized in the test bundle (AppData.js is not in SOURCE_FILE_NAMES).

4. **`weaponType` not updated by `withWeapon`**: `withWeapon` changes the weapon ID and updates `weaponInfo`, but doesn't change the unit's `weaponType` property (remains from default SilverSwordPlus). Tests verify `weapon` and `weaponInfo.id` instead.

5. **Test count**: 11 tests total (5 template validation + 4 known skill validation + 2 multi-unit scenarios).

## Tests First

The following tests go in `Tests/SkillRegression.test.js`. They validate that the template pattern itself works correctly before mass-generating skill tests in section-06.

### Template Pattern Validation Tests

These tests verify that the `createDummy` + `withWeapon` + `BattleScenarioBuilder.execute()` pipeline produces correct, deterministic combat results for known skills.

```javascript
describe('Skill regression test template validation', () => {
    // Validate the basic template pattern works with a simple weapon
    test('Template: createDummy + withWeapon + execute produces valid combat result', () => {
        // Use a well-known weapon with simple, verifiable effects
        // The specific weapon chosen should have straightforward stat bonuses
        // that can be verified against expected damage values
        const attacker = UnitBuilder.createDummy(UnitGroupType.Ally)
            .withWeapon(/* a known weapon with simple stat effects */)
            .build();
        const defender = UnitBuilder.createDummy(UnitGroupType.Enemy)
            .build();
        const result = new BattleScenarioBuilder()
            .withAttacker(attacker)
            .withDefender(defender)
            .execute();
        // Verify result object has expected properties
        expect(result).toBeDefined();
        expect(result.atkUnit_normalAttackDamage).toBeDefined();
    });

    // Validate that createDummy with default stats (all 50) produces predictable baseline
    test('Template: baseline damage with no skills is predictable', () => {
        const attacker = UnitBuilder.createDummy(UnitGroupType.Ally).build();
        const defender = UnitBuilder.createDummy(UnitGroupType.Enemy).build();
        const result = new BattleScenarioBuilder()
            .withAttacker(attacker)
            .withDefender(defender)
            .execute();
        // With equal stats (50 atk vs 50 def), damage should be deterministic
        // Record actual value as regression baseline
    });

    // Validate that custom stats in createDummy work correctly
    test('Template: createDummy with custom stats affects combat result', () => {
        const attacker = UnitBuilder.createDummy(UnitGroupType.Ally, {
            hp: 99, atk: 60, spd: 40, def: 30, res: 20
        }).build();
        const defender = UnitBuilder.createDummy(UnitGroupType.Enemy).build();
        const result = new BattleScenarioBuilder()
            .withAttacker(attacker)
            .withDefender(defender)
            .execute();
        // Higher atk (60) vs default def (50) should produce different damage than baseline
    });

    // Validate that withWeapon properly recalculates stats
    test('Template: withWeapon triggers stat recalculation', () => {
        const attacker = UnitBuilder.createDummy(UnitGroupType.Ally)
            .withWeapon(/* weapon with known Mt */)
            .build();
        // attacker's effective atk should reflect weapon Mt
    });
});
```

### Known Skill Validation Tests

Pick 2-3 well-understood skills from different categories to validate the template produces correct results. These serve as "canary" tests -- if the template is broken, these fail.

```javascript
describe('Skill regression template - known skill validation', () => {
    // Test a weapon skill with straightforward stat bonuses
    test('[Weapon] Known weapon grants expected stat bonuses during combat', () => {
        // Choose a weapon from SkillImpl202601.js with simple "Grants Atk/Spd+N" effect
        const skillId = Weapon./* known weapon */;
        const attacker = UnitBuilder.createDummy(UnitGroupType.Ally)
            .withWeapon(skillId)
            .build();
        const defender = UnitBuilder.createDummy(UnitGroupType.Enemy)
            .build();
        const result = new BattleScenarioBuilder()
            .withAttacker(attacker)
            .withDefender(defender)
            .execute();
        // Assert specific damage/HP values obtained from current simulator run
        // These values are the "regression baseline"
    });

    // Test a passive skill
    test('[PassiveA] Known passive A grants expected combat bonuses', () => {
        const attacker = UnitBuilder.createDummy(UnitGroupType.Ally)
            .withPassiveA(PassiveA./* known passive */)
            .build();
        const defender = UnitBuilder.createDummy(UnitGroupType.Enemy)
            .build();
        const result = new BattleScenarioBuilder()
            .withAttacker(attacker)
            .withDefender(defender)
            .execute();
        // Assert regression values
    });

    // Test a conditional skill (condition met vs not met)
    test('[Conditional] Skill with HP condition activates when condition is met', () => {
        const attacker = UnitBuilder.createDummy(UnitGroupType.Ally)
            .withWeapon(/* weapon with HP >= 25% condition */)
            .build();
        const defender = UnitBuilder.createDummy(UnitGroupType.Enemy)
            .build();
        const result = new BattleScenarioBuilder()
            .withAttacker(attacker)
            .withDefender(defender)
            .execute();
        // Assert effect is active
    });

    test('[Conditional] Skill with HP condition does NOT activate when condition is not met', () => {
        const attacker = UnitBuilder.createDummy(UnitGroupType.Ally)
            .withWeapon(/* same weapon */)
            .withHpPercent(10) // Below the HP threshold
            .build();
        const defender = UnitBuilder.createDummy(UnitGroupType.Enemy)
            .build();
        const result = new BattleScenarioBuilder()
            .withAttacker(attacker)
            .withDefender(defender)
            .execute();
        // Assert effect is NOT active (damage differs from above)
    });
});
```

### Ally/Foe Presence Tests

Some skills have conditions like "if allies are within 2 spaces." Validate the template handles multi-unit scenarios.

```javascript
describe('Skill regression template - multi-unit scenarios', () => {
    test('Template: addAlly positions unit and affects combat', () => {
        const attacker = UnitBuilder.createDummy(UnitGroupType.Ally)
            .withWeapon(/* weapon with "if allies within 2 spaces" condition */)
            .build();
        const ally = UnitBuilder.createDummy(UnitGroupType.Ally)
            .atPosition(1, 0) // Adjacent to attacker
            .build();
        const defender = UnitBuilder.createDummy(UnitGroupType.Enemy)
            .build();
        const result = new BattleScenarioBuilder()
            .withAttacker(attacker)
            .withDefender(defender)
            .addAlly(ally)
            .execute();
        // Verify ally presence enables skill condition
    });
});
```

## Implementation Details

### Test File Structure

`Tests/SkillRegression.test.js` should be organized with the following top-level describe blocks:

```
describe('Skill regression test template validation', () => { ... });
describe('Skill regression template - known skill validation', () => { ... });
describe('Skill regression template - multi-unit scenarios', () => { ... });
// Section 06 will add these:
// describe('Weapon skills', () => { ... });
// describe('Passive A skills', () => { ... });
// describe('Passive B skills', () => { ... });
// describe('Passive C skills', () => { ... });
// describe('Special skills', () => { ... });
```

### Standard Test Template

Every skill regression test follows this canonical pattern:

```javascript
{
    const skillId = Weapon.SkillName; // or PassiveA.SkillName, etc.
    test(`${getSkillName(skillId)}: [brief effect description]`, () => {
        // 1. Build attacker with the skill under test using createDummy
        const attacker = UnitBuilder.createDummy(UnitGroupType.Ally)
            .withWeapon(skillId)  // or .withPassiveA(), .withSpecial(), etc.
            .build();

        // 2. Build defender (plain dummy unless skill needs specific foe properties)
        const defender = UnitBuilder.createDummy(UnitGroupType.Enemy)
            .build();

        // 3. Execute combat
        const result = new BattleScenarioBuilder()
            .withAttacker(attacker)
            .withDefender(defender)
            .execute();

        // 4. Assert regression values (recorded from current simulator run)
        expect(result.atkUnit_normalAttackDamage).toBe(/* recorded value */);
        // Additional assertions as needed:
        // expect(attacker.hp).toBe(/* recorded value */);
        // expect(defender.hp).toBe(/* recorded value */);
    });
}
```

### Why `createDummy` Instead of `fromHero`

The key design decision is using `createDummy` (fixed stats, default all 50) instead of `fromHero` (hero-specific stats):

- **Stability**: Hero base stats can change with game updates (refines, stat corrections). `createDummy` stats never change, so tests never break due to external data changes.
- **Isolation**: Tests verify only the skill logic, not the interaction with specific hero stats.
- **Predictability**: Known stat values make it easy to manually verify expected damage calculations.
- **Exception**: Use `fromHero` only when testing a hero-specific weapon that requires the hero's unique properties (e.g., legendary/mythic effects tied to a specific hero).

### Regression Verification Approach

The regression testing methodology:

1. **Record phase**: When writing a test, run it once to obtain the actual combat result values from the current simulator.
2. **Baseline phase**: Record those values as `expect()` assertions in the test.
3. **Detection phase**: If a future code change alters these values, the test fails.
4. **Triage phase**: The developer determines whether the change is intentional (update the test) or a regression (fix the code).

This approach does NOT verify correctness against the official game -- it verifies consistency with the simulator's current behavior. If the current behavior is wrong, fix the bug AND update the test.

### Assertions to Include Per Skill

For each skill test, record and assert the following properties from the combat result:

- `result.atkUnit_normalAttackDamage` -- Attacker's normal attack damage
- `result.defUnit_normalAttackDamage` -- Defender's counter-attack damage (if applicable)
- `attacker.hp` after combat -- Attacker's remaining HP
- `defender.hp` after combat -- Defender's remaining HP

For skills with special effects, also check:
- `result.atkUnit_totalAttackCount` -- Number of attacks (for brave/guaranteed follow-up)
- Special trigger occurrences (via HP changes or damage patterns)
- Whether follow-up attacks occurred

### Registration in create_tests.sh

Ensure `SkillRegression.test.js` is in the `TEST_FILE_NAMES` array and mapped to the `skill` category:

```bash
# In the skill category case:
skill)
    TEST_FILES=("SkillRegression.test.js")
    ;;
```

### Selecting Validation Skills

When implementing the "known skill validation" tests, choose skills that:

1. Have simple, well-understood effects (e.g., "Grants Atk/Spd+5 during combat")
2. Are from SkillImpl202601.js (most recent, most actively maintained)
3. Cover different skill slots (weapon, passive A, passive B/C)
4. Include at least one conditional skill to validate the condition-met/not-met pattern

Look at existing tests in `Tests/DamageCalculator.test.js` for examples of how combat results are currently verified (e.g., `result.atkUnit_normalAttackDamage`, checking `atkUnit.atkSpur` values). The existing test patterns at `/Users/studio/Documents/GitHub/FehBattleSimulator/Tests/DamageCalculator.test.js` show how `test_DamageCalculator` is used -- `BattleScenarioBuilder` wraps this same logic in a more declarative API.

### Key Source Files for Reference

- `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/TestUtilities.js` -- Existing test helpers (`test_DamageCalculator`, `test_HeroDatabase`, `test_createDefaultUnit`)
- `/Users/studio/Documents/GitHub/FehBattleSimulator/Tests/DamageCalculator.test.js` -- Existing combat test patterns showing how results are asserted
- `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/SkillImpl202601.js` -- Latest skills to pick validation candidates from