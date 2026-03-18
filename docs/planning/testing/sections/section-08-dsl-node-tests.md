# Section 08: DSL Node Tests

## Overview

This section covers the creation of `Tests/DslNode.test.js`, a new test file that expands DSL node unit test coverage beyond what exists in `Tests/SkillEffect.test.js`. The focus is on **effect nodes used in skill registration** (GRANTS_BONUS, INFLICTS_PENALTY, etc.), **condition nodes with combat context**, **composite node evaluation with combat integration**, **target node resolution within combat**, and **hook-based skill registration and evaluation**.

The existing `SkillEffect.test.js` already tests low-level node primitives (AndNode, OrNode, IfNode, NumberNode, CollectionNode, spatial queries, status effect application via `do`/`doEffects`, and DEALS_DAMAGE). The new `DslNode.test.js` focuses on **higher-level DSL patterns that correspond to actual skill text**, particularly those evaluated through the combat pipeline via `SkillEffectRegistrar` and hook mechanisms.

## Dependencies

- **section-01-test-split**: `DslNode.test.js` must be registered in `create_tests.sh`'s `TEST_FILE_NAMES` array and mapped to the `dsl` category in the case statement. The file will be runnable via `./run_tests.sh dsl`.

## File to Create

**`/Users/studio/Documents/GitHub/FehBattleSimulator/Tests/DslNode.test.js`**

## File to Modify

**`/Users/studio/Documents/GitHub/FehBattleSimulator/create_tests.sh`** -- Add `DslNode.test.js` to `TEST_FILE_NAMES` and to the `dsl` category mapping (if section-01 has not already done this).

## Test Design Principles

1. **Black-box behavioral testing via combat results**: Most tests register a skill via hooks or `SkillEffectRegistrar`, run a combat calculation with `test_DamageCalculator`, and assert on the combat result or unit `battleContext` properties. This matches how skills are actually evaluated in the simulator.

2. **Use existing test patterns**: The existing `SkillEffect.test.js` establishes the pattern of creating units via `g_testHeroDatabase.createUnit('アルフォンス')`, setting up a `test_DamageCalculator`, and calling `calcDamage`. New tests follow this same pattern.

3. **Avoid duplicating existing coverage**: `SkillEffect.test.js` already covers `AndNode`, `OrNode`, `IfNode`, `MultNode`, `MultTruncNode`, `CollectionNode`, spatial queries (`ALLIES_WITHIN`, `FOES_WITHIN`, `CLOSEST_FOES`), status effect application (`GRANTS_STATUS_EFFECTS`, `INFLICTS_STATUS_EFFECTS`), and basic `DEALS_DAMAGE`. The new file tests what is NOT yet covered.

4. **Temporary skill IDs**: Tests register skills using string-based temporary skill IDs (e.g., `'test-grants-bonus'`) assigned to a unit's `passiveS` slot, following the pattern already used in `SkillEffect.test.js`.

## Tests (Stubs)

Below are the test stubs for `DslNode.test.js`. Each `describe` block groups related functionality. The `beforeEach` setup pattern mirrors the existing `SkillEffect.test.js` combat tests.

### Common Setup

Every `describe` block that tests combat-integrated behavior needs this setup:

```javascript
/** @type {Unit} */
let atkUnit;
/** @type {Unit} */
let defUnit;
let calculator;

beforeEach(() => {
    heroDatabase = g_testHeroDatabase;
    atkUnit = heroDatabase.createUnit('アルフォンス');
    defUnit = heroDatabase.createUnit('アルフォンス');
    calculator = new test_DamageCalculator();
    calculator.unitManager.units = [atkUnit, defUnit];
    calculator.isLogEnabled = false;
    g_appData = calculator.unitManager;
});
```

### Effect Nodes

These tests verify that the high-level DSL functions for stat bonuses, stat penalties, and damage reduction integrate correctly through the combat pipeline when registered via hooks.

```javascript
describe('Effect nodes via combat', () => {
    // Setup as above

    test('GRANTS_BONUS(ATK_SPD(5)).to(UNIT) grants Atk/Spd+5 during combat', () => {
        // Register skill via AT_START_OF_COMBAT_HOOKS using GRANTS_BONUS
        // Assign to atkUnit.passiveS
        // Run calcDamage, verify atkUnit.battleContext spur values include +5 atk and +5 spd
    });

    test('INFLICTS_PENALTY(DEF_RES(5)).on(FOE) inflicts Def/Res-5 on foe during combat', () => {
        // Register skill via registerSkillsForFoesDuringCombat or AT_START_OF_COMBAT_HOOKS
        // Run calcDamage, verify defUnit.battleContext has -5 def and -5 res from penalties
    });

    test('DEALS_DAMAGE(10).excludingAoe() adds +10 damage excluding AoE', () => {
        // Register skill that uses DEALS_DAMAGE(10).excludingAoe()
        // Run calcDamage, verify atkUnit.battleContext.additionalDamage == 10
        // Also verify additionalDamageInPrecombat is NOT affected
    });

    test('REDUCES_DAMAGE_FROM_FOES_ATTACKS_BY(N) reduces damage by fixed N', () => {
        // Register skill with REDUCES_DAMAGE_FROM_FOES_ATTACKS_BY(N)
        // Run calcDamage, verify the damage reduction is applied in combat result
    });
});
```

### Condition Nodes

These tests verify that condition nodes correctly gate effect application based on unit state during combat.

```javascript
describe('Condition nodes', () => {
    // Setup as above

    test('HP threshold condition: skill activates when HP >= 25%', () => {
        // Register skill with IS_UNITS_HP_GTE_25_PERCENT_AT_START_OF_COMBAT_NODE condition
        // Set atkUnit HP to 25% of max -> skill should activate
        // Set atkUnit HP to 24% of max -> skill should NOT activate (boundary)
    });

    test('HP threshold condition: boundary at exactly 25%', () => {
        // Verify that exactly 25% HP passes the >= 25% check
    });

    test('Stat comparison: unit Atk > foe Atk activates effect', () => {
        // Register skill with stat comparison condition (e.g., Heavy Blade pattern)
        // Set atkUnit.atkWithSkills higher than defUnit -> activates
        // Set equal -> does not activate (strictly greater)
    });

    test('Weapon type condition matches specific weapon type only', () => {
        // Register conditional skill that checks weapon type
        // Verify it activates for matching type, does not for non-matching
    });

    test('Movement type condition matches specific movement type only', () => {
        // Register conditional skill that checks movement type
        // Verify activation/non-activation based on unit's movement type
    });
});
```

### Composite Nodes

These tests verify that IF_NODE, AND_NODE, OR_NODE compose correctly when used in combat skill registration contexts. Note: Basic AndNode/OrNode/IfNode evaluate() tests already exist in `SkillEffect.test.js`. These tests focus on integration with combat.

```javascript
describe('Composite nodes in combat context', () => {
    // Setup as above

    test('IF_NODE applies effects only when condition is true', () => {
        // Register skill: IF_NODE(TRUE_NODE, DEALS_DAMAGE_X_NODE(10))
        // Run calcDamage -> additionalDamage should be 10
    });

    test('IF_NODE does not apply effects when condition is false', () => {
        // Register skill: IF_NODE(FALSE_NODE, DEALS_DAMAGE_X_NODE(10))
        // Run calcDamage -> additionalDamage should be 0
    });

    test('AND_NODE gates effect: both conditions must be true', () => {
        // Register skill: IF_NODE(AND_NODE(cond_true, cond_true), effect) -> activates
        // Register skill: IF_NODE(AND_NODE(cond_true, cond_false), effect) -> does not activate
    });

    test('OR_NODE gates effect: either condition suffices', () => {
        // Register skill: IF_NODE(OR_NODE(cond_false, cond_true), effect) -> activates
        // Register skill: IF_NODE(OR_NODE(cond_false, cond_false), effect) -> does not activate
    });

    test('Nested IF_NODE(AND_NODE(...), IF_NODE(...)) evaluates correctly', () => {
        // Register skill with nested composite structure
        // Verify correct evaluation through combat pipeline
    });
});
```

### Target Nodes

These tests verify UNIT and FOE resolve to correct units within the combat context when used in `SkillEffectRegistrar` registrations.

```javascript
describe('Target nodes in combat', () => {
    // Setup as above

    test('UNIT refers to the skill owner (attacker) in registerSkillsDuringCombat', () => {
        // Register via registerSkillsDuringCombat with GRANTS_BONUS(...).to(UNIT)
        // Run calcDamage where atkUnit has the skill
        // Verify bonus applied to atkUnit, not defUnit
    });

    test('FOE refers to the opponent in registerSkillsDuringCombat', () => {
        // Register via registerSkillsDuringCombat with INFLICTS_PENALTY(...).on(FOE)
        // Run calcDamage where atkUnit has the skill
        // Verify penalty applied to defUnit, not atkUnit
    });
});
```

### Hook Timing

These tests verify that skills registered on different hooks are evaluated at the correct combat phase.

```javascript
describe('Hook timing', () => {
    // Setup as above

    test('AT_START_OF_COMBAT_HOOKS: skill evaluated at start of combat', () => {
        // Register effect via AT_START_OF_COMBAT_HOOKS.addSkillIfAbsent
        // Run calcDamage, verify effect is applied
    });

    test('AFTER_COMBAT_HOOKS: skill evaluated after combat completes', () => {
        // Register effect via AFTER_COMBAT_HOOKS (e.g., post-combat damage/healing)
        // Run calcDamage, verify post-combat effects are applied
    });

    test('registerSkillsDuringCombat: registered skill evaluated during combat', () => {
        // Use SkillEffectRegistrar.registerSkillsDuringCombat(skillId, TRUE_NODE, effect)
        // Assign skillId to unit, run calcDamage
        // Verify effect is applied during combat
    });
});
```

## Implementation Notes

### Registering Test Skills on Hooks

The existing tests in `SkillEffect.test.js` show two approaches for registering test skills:

1. **Direct hook registration** -- `AT_START_OF_COMBAT_HOOKS.addSkillIfAbsent(skillId, NODE_FUNC(...))` with the skill ID assigned to a unit's passive slot (e.g., `atkUnit.passiveS = skillId`).

2. **SkillEffectRegistrar** -- `SkillEffectRegistrar.registerSkillsDuringCombat(skillId, condition, ...effects)` which is the standard pattern used in actual skill implementations. The skill ID must be assigned to the unit.

For hook-based tests, use approach 1 (direct hook registration) to keep tests focused on the DSL node behavior rather than the registrar machinery. For the hook timing tests and target node tests, use approach 2 to verify the full registration path.

### Cleanup Considerations

When registering skills on global hooks (like `AT_START_OF_COMBAT_HOOKS`), the registration persists across tests. Use unique skill IDs per test (or per describe block) to avoid interference. The `addSkillIfAbsent` method prevents duplicate registration of the same ID, which is useful when the same test runs in isolation vs as part of a suite.

### What NOT to Test Here

- Basic `AndNode.evaluate()`, `OrNode.evaluate()`, `IfNode.evaluate()` with simple boolean inputs -- already covered in `SkillEffect.test.js`
- `DEALS_DAMAGE` basic variants (constant, X parameter, mult, max) -- already covered in `SkillEffect.test.js`
- Status effect application via `do()`/`doEffects()`/`and()`/`andEffects()` chains -- already covered in `SkillEffect.test.js`
- Spatial queries (`ALLIES_WITHIN`, `FOES_WITHIN`, `CLOSEST_FOES`, etc.) -- already covered in `SkillEffect.test.js`
- `CollectionNode` operations (count, exists, intersect) -- already covered in `SkillEffect.test.js`

### Expected Test Count

Approximately 15-20 tests across the describe blocks above, contributing to the overall target of ~50 DSL tests (combined with the existing ~30+ in `SkillEffect.test.js`).

### Running Tests

After implementation:

```bash
# Run DSL tests only (includes both SkillEffect.test.js and DslNode.test.js)
./run_tests.sh dsl

# Run all tests
./run_tests.sh
```