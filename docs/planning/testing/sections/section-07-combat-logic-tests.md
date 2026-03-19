# Section 7: Combat Logic Tests

## Overview

This section covers the creation of five combat logic test files that verify core FEH battle mechanics independently of specific skill IDs. Tests use `createDummy` units with controlled stats to isolate and verify combat mechanics.

**Dependencies**: section-02 (UnitBuilder), section-03 (BattleScenarioBuilder).

**Category**: `combat` category for `./run_tests.sh combat`.

---

## Implementation Status

**Total tests: 39** (plan estimated ~105; reduced scope per code review — core mechanics covered, edge cases deferred)

## Actual Files

| File | Purpose | Actual Tests |
|------|---------|--------------|
| `Tests/SpecialCount.test.js` | Special charge, acceleration, deceleration, offensive specials | 8 |
| `Tests/FollowUpAttack.test.js` | Speed-based follow-up, QR, Wary Fighter, interactions | 8 |
| `Tests/DamageReduction.test.js` | Basic damage, buffs/debuffs, follow-up damage, weapon triangle | 7 |
| `Tests/CombatFlow.test.js` | Combat flow, Miracle, Sweep, AoE, Vantage, Desperation | 11 |
| `Tests/StatusEffect.test.js` | Panic, Guard, Deep Wounds, buff/debuff interaction | 5 |

## Files Modified

| File | Change |
|------|--------|
| `create_tests.sh` | Already registered in section-01 (test files + combat category) |

---

## Test Infrastructure Pattern

All combat logic tests follow the same structural pattern established by the existing `DamageCalculator.test.js`. Each file uses the existing test helpers (`test_DamageCalculator`, `test_createDefaultUnit`, `g_testHeroDatabase`) along with the new `UnitBuilder` and `BattleScenarioBuilder` from sections 02/03.

### Common Test Structure

Each test file should follow this pattern:

```javascript
describe('DescriptiveName', () => {
    beforeEach(() => {
        // Reset global state to prevent cross-test contamination
        resetGlobalTestState();
    });

    describe('sub-category', () => {
        test('specific behavior', () => {
            const attacker = UnitBuilder.createDummy(UnitGroupType.Ally)
                .withWeapon(someWeaponId)
                .withStats({ atk: 50, spd: 45 })
                .build();
            const defender = UnitBuilder.createDummy(UnitGroupType.Enemy)
                .withStats({ def: 30, spd: 35 })
                .build();
            const result = new BattleScenarioBuilder()
                .withAttacker(attacker)
                .withDefender(defender)
                .execute();
            // Assertions on result properties
        });
    });
});
```

### Key Result Properties

The `calcDamage` result object (returned by `test_DamageCalculator.calcDamage()`) exposes these properties used for assertions:

- `result.atkUnit_normalAttackDamage` -- attacker's normal attack damage
- `result.defUnit_normalAttackDamage` -- defender's counter-attack damage
- Unit properties after combat: `unit.hp`, `unit.restHp`, `unit.specialCount`
- Spur values: `unit.atkSpur`, `unit.spdSpur`, `unit.defSpur`, `unit.resSpur`

For follow-up/attack count assertions, check the combat result's attack sequence or HP after combat to infer whether follow-ups occurred.

---

## Tests: SpecialCount.test.js

File path: `/Users/studio/Documents/GitHub/FehBattleSimulator/Tests/SpecialCount.test.js`

This file tests special charge mechanics -- how the special cooldown counter changes during combat.

### Test Stubs

```javascript
describe('Special count mechanics', () => {
    beforeEach(() => {
        resetGlobalTestState();
    });

    describe('Basic charge', () => {
        test('Special count decreases by 1 on attack', () => {
            // Setup: attacker with a special (e.g., Moonbow, cooldown 2)
            // Execute combat
            // Assert: special count decreased appropriately after attacks
        });

        test('Special triggers at count 0', () => {
            // Setup: attacker with special count pre-set to 0
            // Execute combat
            // Assert: special activates (visible in damage output)
        });

        test('Special count resets to max after activation', () => {
            // Setup: attacker with special count 0
            // Execute combat where special triggers
            // Assert: post-combat special count equals max cooldown
        });
    });

    describe('Charge acceleration (Heavy Blade etc.)', () => {
        test('Heavy Blade grants extra charge when Atk condition met', () => {
            // Setup: attacker with Heavy Blade, higher Atk than defender
            // Assert: count decreases by 2 per attack instead of 1
        });

        test('Heavy Blade does not grant extra charge when Atk condition not met', () => {
            // Setup: attacker with Heavy Blade, lower Atk than defender
            // Assert: count decreases by 1 per attack (normal)
        });
    });

    describe('Charge deceleration (Guard)', () => {
        test('Guard delays special charge by 1', () => {
            // Setup: defender has Guard-type skill
            // Execute combat
            // Assert: attacker's special charge per attack is 0 (1 - 1)
        });

        test('Charge acceleration and deceleration cancel out', () => {
            // Setup: attacker has Heavy Blade (condition met), defender has Guard
            // Assert: net charge per attack is 1 (2 - 1 = normal)
        });
    });

    describe('Beginning-of-turn Pulse', () => {
        test('Pulse skill reduces special count at turn start', () => {
            // Setup: unit with a Pulse-type skill (e.g., Infantry Pulse)
            // Execute beginning of turn
            // Assert: special count decreased
        });
    });

    describe('Defensive special', () => {
        test('Defensive special activates on enemy attack when count is 0', () => {
            // Setup: defender with a defensive special (e.g., Pavise) at count 0
            // Execute combat
            // Assert: damage to defender is reduced by defensive special
        });
    });
});
```

---

## Tests: FollowUpAttack.test.js

File path: `/Users/studio/Documents/GitHub/FehBattleSimulator/Tests/FollowUpAttack.test.js`

This file tests follow-up attack determination logic.

### Test Stubs

```javascript
describe('Follow-up attack determination', () => {
    beforeEach(() => {
        resetGlobalTestState();
    });

    describe('Speed-based follow-up', () => {
        test('Follow-up occurs when Spd difference >= 5', () => {
            // Setup: attacker Spd 45, defender Spd 40
            // Assert: attacker performs follow-up (check HP difference or attack count)
        });

        test('No follow-up when Spd difference < 5', () => {
            // Setup: attacker Spd 44, defender Spd 40
            // Assert: attacker does not perform follow-up
        });

        test('Spd difference exactly 5 triggers follow-up (boundary)', () => {
            // Setup: attacker Spd 45, defender Spd 40 (difference = 5)
            // Assert: follow-up occurs
        });

        test('Spd difference exactly 4 does not trigger follow-up (boundary)', () => {
            // Setup: attacker Spd 44, defender Spd 40 (difference = 4)
            // Assert: no follow-up
        });
    });

    describe('Guaranteed follow-up (Quick Riposte, Bold Fighter)', () => {
        test('Guaranteed follow-up ignores Spd comparison', () => {
            // Setup: defender with Quick Riposte, lower Spd than attacker
            // Assert: defender performs follow-up counter-attack
        });
    });

    describe('Follow-up prevention (Wary Fighter)', () => {
        test('Follow-up prevention blocks speed-based follow-up', () => {
            // Setup: unit with Wary Fighter, high enough Spd for follow-up
            // Assert: no follow-up occurs
        });
    });

    describe('Guaranteed vs Prevention interaction', () => {
        test('Guaranteed follow-up and prevention cancel each other', () => {
            // Setup: unit has both guaranteed follow-up and follow-up prevention
            // Assert: reverts to Spd-based check
        });

        test('Multiple guaranteed follow-ups vs single prevention', () => {
            // Setup: unit has 2 sources of guaranteed follow-up and 1 prevention
            // Assert: behavior based on FEH rules (they cancel 1:1, excess remains)
        });
    });
});
```

---

## Tests: DamageReduction.test.js

File path: `/Users/studio/Documents/GitHub/FehBattleSimulator/Tests/DamageReduction.test.js`

This file tests damage reduction mechanics including percentage-based, fixed, stacking, and piercing.

### Test Stubs

```javascript
describe('Damage reduction mechanics', () => {
    beforeEach(() => {
        resetGlobalTestState();
    });

    describe('Percentage-based reduction', () => {
        test('40% reduction correctly reduces damage', () => {
            // Setup: defender with a 40% damage reduction skill
            // Execute combat, compare damage with/without the skill
            // Assert: damage is 60% of unreduced value (floored)
        });
    });

    describe('Fixed value reduction', () => {
        test('Fixed reduction subtracts flat amount from damage', () => {
            // Setup: defender with fixed damage reduction (e.g., -N)
            // Assert: damage reduced by exactly N
        });
    });

    describe('Multiple reduction stacking', () => {
        test('Multiple percentage reductions stack multiplicatively', () => {
            // Setup: defender with two reduction sources (40% and 30%)
            // Expected: 1 - (0.6 * 0.7) = 58% total reduction
            // Assert: damage is 42% of unreduced value
        });
    });

    describe('Damage reduction piercing', () => {
        test('Piercing skill ignores percentage reduction', () => {
            // Setup: attacker with reduction-piercing skill, defender with reduction
            // Assert: damage is as if defender had no reduction
        });
    });

    describe('Defensive special reduction', () => {
        test('Defensive special reduces damage at correct timing', () => {
            // Setup: defender with defensive special (e.g., Pavise) at count 0
            // Assert: first hit damage is reduced by special's percentage
        });
    });
});
```

---

## Tests: CombatFlow.test.js

File path: `/Users/studio/Documents/GitHub/FehBattleSimulator/Tests/CombatFlow.test.js`

This file tests the overall combat flow including pre-combat, during-combat, and post-combat phases.

### Test Stubs

```javascript
describe('Combat flow', () => {
    beforeEach(() => {
        resetGlobalTestState();
    });

    describe('Miracle (survive at 1 HP)', () => {
        test('Miracle keeps unit alive at 1 HP', () => {
            // Setup: defender with Miracle special at count 0, enough incoming damage to KO
            // Assert: defender HP is 1 after combat
        });

        test('Miracle does not activate twice in same combat', () => {
            // Setup: defender with Miracle at count 0, attacker with follow-up
            // Assert: second hit can KO (Miracle only activates once)
        });
    });

    describe('Counter-attack prevention (Sweep)', () => {
        test('Sweep skill prevents enemy counter-attack', () => {
            // Setup: attacker with Sweep-type skill (e.g., Firesweep or Windsweep)
            // Assert: defender deals 0 damage / no counter-attack occurs
        });
    });

    describe('Distant Counter', () => {
        test('Distant Counter enables counter-attack regardless of range', () => {
            // Setup: ranged attacker vs melee defender with Distant Counter
            // Assert: defender counter-attacks
        });
    });

    describe('AoE special', () => {
        test('AoE special deals pre-combat damage', () => {
            // Setup: attacker with AoE special (e.g., Blazing Flame) at count 0
            // Assert: defender takes AoE damage before main combat
        });
    });

    describe('Post-combat effects', () => {
        test('Post-combat healing activates after combat', () => {
            // Setup: attacker with post-combat healing skill
            // Execute combat that deals damage to attacker
            // Assert: attacker HP is healed after combat
        });

        test('Post-combat debuff is applied after combat', () => {
            // Setup: attacker with post-combat debuff skill (e.g., Seal Atk)
            // Assert: defender has debuff applied after combat
        });
    });

    describe('Deep Wounds (healing prevention)', () => {
        test('Deep Wounds prevents healing', () => {
            // Setup: apply Deep Wounds status to a unit
            // Execute scenario where healing would occur
            // Assert: no healing applied
        });
    });

    describe('Canto (post-combat movement)', () => {
        test('Canto enables post-combat movement', () => {
            // Setup: attacker with Canto skill
            // Execute combat
            // Assert: Canto movement is available (check cantoAllowsRemainigCount or similar)
        });
    });
});
```

---

## Tests: StatusEffect.test.js

File path: `/Users/studio/Documents/GitHub/FehBattleSimulator/Tests/StatusEffect.test.js`

This file tests status effect mechanics. Note: Some Feud tests already exist in `DamageCalculator.test.js`; this file covers additional status effects and edge cases.

### Test Stubs

```javascript
describe('Status effects', () => {
    beforeEach(() => {
        resetGlobalTestState();
    });

    describe('Feud skills', () => {
        test('Feud skill nullifies visible buffs from allies', () => {
            // Setup: attacker with Feud, defender with ally providing buffs
            // Assert: defender's spur bonuses from allies are 0
            // Note: extends existing DamageCalculator.test.js Feud tests
        });
    });

    describe('Style effects', () => {
        test('Style effect is correctly applied', () => {
            // Setup: unit with a Style status effect
            // Execute combat
            // Assert: style-specific effect is reflected in combat result
        });
    });

    describe('Panic', () => {
        test('Panic inverts visible buffs (bonus becomes penalty)', () => {
            // Setup: unit with Panic status and +6 Atk buff
            // Execute combat
            // Assert: Atk bonus acts as -6 instead of +6
        });
    });

    describe('Cancel (special charge prevention)', () => {
        test('Cancel suppresses special activation', () => {
            // Setup: unit under Cancel status with special at count 0
            // Execute combat
            // Assert: special does not activate despite count being 0
        });
    });
});
```

---

## FEH-Specific Edge Case Tests

These edge case tests should be distributed across the relevant test files above, or grouped within the file where they are most relevant.

### In SpecialCount.test.js or CombatFlow.test.js

```javascript
describe('FEH edge cases - HP condition timing', () => {
    test('AoE damage affects HP-conditional skills (Vantage)', () => {
        // Setup: defender with Vantage (HP <= 75%) and AoE attacker
        // AoE damage puts defender below 75% HP
        // Assert: Vantage activates (defender attacks first)
    });

    test('Desperation HP condition uses combat-start HP', () => {
        // Setup: attacker with Desperation, HP at threshold at combat start
        // Assert: Desperation condition is checked at combat start, not affected by mid-combat damage
    });
});
```

### In FollowUpAttack.test.js

```javascript
describe('FEH edge cases - Phantom stats', () => {
    test('Phantom Spd affects follow-up determination', () => {
        // Setup: unit with Phantom Spd seal, base Spd not enough for follow-up
        // Phantom Spd pushes effective Spd over threshold
        // Assert: follow-up occurs
    });

    test('Phantom Spd does NOT affect Spd-scaling damage', () => {
        // Setup: unit with Phantom Spd and a skill that adds Spd% to damage
        // Assert: damage calculation uses real Spd, not Phantom Spd
    });
});
```

### In DamageReduction.test.js or a separate section

```javascript
describe('FEH edge cases - Triangle Adept', () => {
    test('Triangle Adept increases advantage multiplier', () => {
        // Setup: attacker with Triangle Adept and weapon advantage
        // Assert: damage multiplier is increased beyond base 1.2
    });

    test('Cancel Affinity nullifies Triangle Adept', () => {
        // Setup: attacker with Triangle Adept, defender with Cancel Affinity
        // Assert: weapon triangle multiplier reverts to normal (or reverses)
    });
});
```

---

## Implementation Deviations

### Key discoveries during implementation

1. **`result.defRestHp` / `result.atkRestHp` capture pre-combat HP**, not post-combat. All HP-based assertions use damage values and attack counts instead.
2. **Defensive specials (Pavise/Otate) don't work with dummy units** — the internal mechanism requires proper special setup that dummies lack. Replaced with offensive special (Moonbow) tests.
3. **EstimatedDamage mode continues combat after KO** — units aren't removed from combat when HP reaches 0 in this mode, so both sides always get their attacks.
4. **Post-combat effects (Seal Atk debuffs) don't apply in EstimatedDamage mode** — removed Seal Atk test.
5. **Guard4 used instead of Guard3** — Guard3 doesn't exist in the codebase; Guard4 (PassiveB.Guard4) is the available version.

### Deferred tests (not implemented)
- Distant Counter (requires ranged weapon setup not feasible with dummy units)
- Canto / post-combat movement
- Beginning-of-turn Pulse
- Percentage damage reduction, stacking, piercing
- FEH edge cases (AoE+Vantage, Phantom Spd, Triangle Adept, Cancel Affinity)
- Feud skills, Style effects, Cancel status

---

## Implementation Notes

### Test Data Strategy

All tests should use `UnitBuilder.createDummy()` with explicit stat overrides rather than real hero names. This prevents tests from breaking when hero base stats or default skill kits are updated. The only exception is when testing a specific hero's interaction that cannot be replicated with dummies.

### Determining Expected Values

Since this project uses a regression testing approach ("current behavior is correct"), the implementer should:

1. Write the test with the scenario setup
2. Run the scenario once to observe the actual values
3. Record those values as the expected values in the test assertions
4. Future changes that alter these values will cause test failures, triggering investigation

### Skill IDs for Testing

Although these tests are about combat mechanics (not specific skills), some tests require specific skills to set up scenarios. Use well-established, stable skills:

- **Heavy Blade**: `PassiveA.HeavyBlade4` or `PassiveS.HeavyBlade3` (charge acceleration)
- **Guard**: `PassiveB.Guard3` (charge deceleration)
- **Quick Riposte**: `PassiveB.QuickRiposte3` or `PassiveS.QuickRiposte3` (guaranteed follow-up)
- **Wary Fighter**: `PassiveB.WaryFighter3` (follow-up prevention)
- **Miracle**: `Special.Miracle` (survive at 1 HP)
- **Moonbow**: `Special.Moonbow` (2-count offensive special)
- **Pavise**: `Special.Pavise` (defensive special)
- **Distant Counter**: `PassiveA.DistantCounter` (counter regardless of range)

Look up the actual enum values in `Sources/SkillConstants.js` before writing tests, as the exact enum names may differ slightly.

### Registration in create_tests.sh

The five new test files must be added to the `TEST_FILE_NAMES` array in `create_tests.sh` and included in the `combat)` case of the category mapping:

```bash
combat)
    TEST_FILES=("DamageCalculator.test.js" "BeginningOfTurnSkillHandler.test.js"
                "CombatFlow.test.js" "SpecialCount.test.js" "DamageReduction.test.js"
                "FollowUpAttack.test.js" "StatusEffect.test.js")
    ;;
```

### Running Tests

After implementing, verify with:

```bash
./run_tests.sh combat
```

This runs only combat-category tests with ESLint skipped for fast iteration.