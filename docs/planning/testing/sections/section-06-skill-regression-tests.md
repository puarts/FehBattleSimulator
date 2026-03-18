# Section 06: Skill Regression Tests

## Overview

This section covers the creation of comprehensive skill regression tests in `Tests/SkillRegression.test.js`. The tests verify that each skill's combat effects (stat bonuses, damage modifiers, damage reduction, etc.) produce expected results. This section focuses on writing the actual test cases using the template pattern established in section-05.

**Dependencies**: section-05 (skill regression template) must be completed first, which provides `UnitBuilder`, `BattleScenarioBuilder`, and the standardized test structure.

## Target File

- `/Users/studio/Documents/GitHub/FehBattleSimulator/Tests/SkillRegression.test.js`

This file was created in section-05 with template validation tests. This section adds the bulk of skill-specific regression tests.

## Test Registration

This file is already registered in `create_tests.sh` under `TEST_FILE_NAMES` (done in section-01) and mapped to the `skill` category. Run with:

```
./run_tests.sh skill
```

## Skill Coverage Priority

### Priority 1: SkillImpl202601.js (all skills)

The latest and most complex skill implementations. Each skill below needs at least one regression test verifying its primary combat effects.

**Weapon skills**:
- `Weapon.HeroicMaltet` -- Atk/Spd/Def/Res+10, deals +25 damage, reduces damage by 15, reduces foe's damage reduction by 50%
- `Weapon.SistersBlade` -- Atk/Spd/Def/Res+15 (unit) / +5 (allies), deals +25 damage, reduces damage by 15
- `Weapon.ChosenLance` -- Atk/Spd/Def/Res+15, deals +25 damage, reduces damage by 15
- `Weapon.GiftOfLove` -- Atk/Spd/Def/Res+15, deals +25 damage, follow-up manipulation
- `Weapon.SweetStaff` -- Atk/Spd/Def/Res+15, deals +25 damage, reduces damage by 15, heals on damage

**Special skills**:
- `Special.ArmoredFlare` -- Boosts damage by Def, reduces damage by 40% (twice per combat)
- `Special.FrozenMirror` -- Boosts damage by 60% of Spd, reduces damage by 40%
- `Special.DelugeCharm` -- Boosts damage by 70% of greater Atk, reduces first attack damage by 40%

**Passive A skills**:
- `PassiveA.OstianBackbone` -- Counterattack regardless of range, deals +7 damage, reduces damage by 7
- `PassiveA.SwiftSpecter` -- Atk/Spd+9, deals +7 damage, follow-up neutralization

**Passive B skills**:
- `PassiveB.WildAtHeart` -- Attacks twice, Atk/Spd/Def-5 on foe, percentage-based damage and reduction
- `PassiveB.SRDetectAerial` -- Spd/Res-4 on foe, deals +8 damage
- `PassiveB.ARDetectAerial` -- Atk/Res-4 on foe, deals +8 damage

**Passive C skills**:
- `PassiveC.SpdResFaith` -- Spd/Res+4 conditional on Bulwark, reduces first attack damage by 5
- `PassiveC.TrulyInspired` -- Atk/Res+4 during combat

**Support skills**:
- `Support.GuardianPlus` -- Rally-type heal with status effect grants

**Style skills**:
- `StyleType.SCENDSCALE` -- Deals +10 damage during style
- `StyleType.CHOSEN_LANCE` -- Decreases follow-up Spd threshold by 10

### Priority 2: SkillImpl202501.js (key skills)

Pick representative skills from this file to test. Focus on skills with unique mechanics not covered by 202601 tests.

### Priority 3: Older files

Only if specific regression risks are identified.

## Test Structure

All tests follow the template pattern from section-05. The file is organized by skill type:

```javascript
describe('Skill Regression Tests', () => {
    describe('Weapon skills', () => {
        describe('SkillImpl202601 weapons', () => {
            // Individual weapon tests
        });
    });
    describe('Special skills', () => {
        describe('SkillImpl202601 specials', () => {
            // Individual special tests
        });
    });
    describe('Passive A skills', () => { ... });
    describe('Passive B skills', () => { ... });
    describe('Passive C skills', () => { ... });
    describe('Passive S skills', () => { ... });
});
```

## Test Stubs

Each test uses `UnitBuilder.createDummy()` to avoid dependency on hero base stat changes. The pattern is:

1. Create attacker dummy with the skill under test
2. Create defender dummy (plain or with specific skills if testing interactions)
3. Execute combat via `BattleScenarioBuilder`
4. Assert on combat result properties

### Weapon Skill Tests

```javascript
describe('SkillImpl202601 weapons', () => {
    test(`HeroicMaltet: grants Atk/Spd/Def/Res+10, deals +25 damage, reduces damage by 15`, () => {
        // Arrange: createDummy with HeroicMaltet
        // Act: execute combat
        // Assert: verify stat bonuses, damage dealt includes +25, damage taken reduced by 15
    });

    test(`HeroicMaltet: inflicts Atk/Spd/Def/Res-5 on foes within 3 rows/columns`, () => {
        // Arrange: createDummy with HeroicMaltet, position foe within range
        // Act: execute combat
        // Assert: verify penalty applied to foe
    });

    test(`SistersBlade: grants Atk/Spd/Def/Res+15 to unit, +5 to allies`, () => {
        // Arrange: createDummy with SistersBlade, add ally in range
        // Act: execute combat with ally present
        // Assert: verify different bonus levels for unit vs ally
    });

    test(`ChosenLance: grants Atk/Spd/Def/Res+15, deals +25, reduces damage by 15`, () => {
        // Arrange: createDummy with ChosenLance
        // Act: execute combat
        // Assert: stat bonuses, damage, reduction
    });

    test(`GiftOfLove: grants Atk/Spd/Def/Res+15, deals +25 damage`, () => {
        // Arrange: createDummy with GiftOfLove
        // Act: execute combat
        // Assert: stat bonuses, extra damage
    });

    test(`SweetStaff: grants Atk/Spd/Def/Res+15, deals +25, reduces damage by 15`, () => {
        // Arrange: createDummy with SweetStaff
        // Act: execute combat
        // Assert: stat bonuses, damage, reduction
    });
});
```

### Special Skill Tests

```javascript
describe('SkillImpl202601 specials', () => {
    test(`ArmoredFlare: boosts damage by unit's Def when Special triggers`, () => {
        // Arrange: createDummy with ArmoredFlare, set specialCount to 0, set known Def
        // Act: execute combat
        // Assert: damage includes Def-based bonus
    });

    test(`ArmoredFlare: reduces damage from foe's attacks by 40% (twice per combat)`, () => {
        // Arrange: createDummy with ArmoredFlare, set specialCount to 0
        // Act: execute combat where foe attacks multiple times
        // Assert: first two attacks reduced by 40%, third not reduced
    });

    test(`FrozenMirror: boosts damage by 60% of Spd when Special triggers`, () => {
        // Arrange: createDummy with FrozenMirror, set specialCount to 0, set known Spd
        // Act: execute combat
        // Assert: damage includes 60% Spd bonus
    });

    test(`FrozenMirror: reduces damage from foe's attacks by 40%`, () => {
        // Arrange: createDummy with FrozenMirror, set specialCount appropriately
        // Act: execute combat
        // Assert: damage reduced by 40% on special trigger
    });

    test(`DelugeCharm: boosts damage by 70% of greater of unit/foe Atk`, () => {
        // Arrange: createDummy with DelugeCharm, set specialCount to 0
        // Act: execute combat
        // Assert: damage includes 70% of max(unit Atk, foe Atk)
    });

    test(`DelugeCharm: reduces first attack damage by 40%`, () => {
        // Arrange: createDummy with DelugeCharm
        // Act: execute combat
        // Assert: first attack damage reduced by 40%
    });
});
```

### Passive Skill Tests

```javascript
describe('SkillImpl202601 passives', () => {
    test(`OstianBackbone: deals +7 damage, reduces damage by 7`, () => {
        // Arrange: createDummy with OstianBackbone
        // Act: execute combat
        // Assert: +7 damage dealt, -7 damage received
    });

    test(`SwiftSpecter: grants Atk/Spd+9 when HP >= 25%`, () => {
        // Arrange: createDummy with SwiftSpecter at full HP
        // Act: execute combat
        // Assert: Atk/Spd bonuses applied
    });

    test(`SwiftSpecter: does not grant bonus when HP < 25% and no ally nearby`, () => {
        // Arrange: createDummy with SwiftSpecter at low HP, no allies
        // Act: execute combat
        // Assert: no Atk/Spd bonus
    });

    test(`WildAtHeart: unit attacks twice`, () => {
        // Arrange: createDummy with WildAtHeart
        // Act: execute combat
        // Assert: unit attacks twice (check attack count or total damage)
    });

    test(`WildAtHeart: inflicts Atk/Spd/Def-5 on foe`, () => {
        // Arrange: createDummy with WildAtHeart
        // Act: execute combat
        // Assert: foe's stats reduced by 5
    });

    test(`SRDetectAerial: inflicts Spd/Res-4 on foe, deals +8 damage`, () => {
        // Arrange: createDummy with SRDetectAerial
        // Act: execute combat
        // Assert: Spd/Res penalty on foe, +8 extra damage
    });

    test(`ARDetectAerial: inflicts Atk/Res-4 on foe, deals +8 damage`, () => {
        // Arrange: createDummy with ARDetectAerial
        // Act: execute combat
        // Assert: Atk/Res penalty on foe, +8 extra damage
    });

    test(`TrulyInspired: grants Atk/Res+4 during combat`, () => {
        // Arrange: createDummy with TrulyInspired
        // Act: execute combat
        // Assert: Atk/Res+4 applied
    });
});
```

### Conditional Skill Tests

Each skill with conditions needs a negative test verifying the condition gate:

```javascript
describe('Conditional activation', () => {
    test(`SwiftSpecter: Spd > foe Spd neutralizes follow-up effects`, () => {
        // Arrange: createDummy with SwiftSpecter, unit Spd > foe Spd
        // Act: execute combat with foe having guaranteed follow-up
        // Assert: follow-up neutralized
    });

    test(`SwiftSpecter: Spd <= foe Spd does NOT neutralize follow-up effects`, () => {
        // Arrange: createDummy with SwiftSpecter, unit Spd <= foe Spd
        // Act: execute combat with foe having guaranteed follow-up
        // Assert: follow-up NOT neutralized
    });

    test(`SpdResFaith: Bulwark active grants Spd/Res+4 and first attack reduction`, () => {
        // Arrange: createDummy with SpdResFaith, apply Bulwark status
        // Act: execute combat
        // Assert: Spd/Res+4, first attack reduced by 5
    });

    test(`SpdResFaith: without Bulwark, no conditional bonuses`, () => {
        // Arrange: createDummy with SpdResFaith, no Bulwark
        // Act: execute combat
        // Assert: no Spd/Res+4 from conditional branch
    });
});
```

### Multiple Passive Interaction Tests

```javascript
describe('Multiple passive interactions', () => {
    test(`OstianBackbone + WildAtHeart: combined effects apply correctly`, () => {
        // Arrange: createDummy with both passives equipped
        // Act: execute combat
        // Assert: both effects active (attacks twice + damage/reduction from Backbone)
    });
});
```

## Regression Verification Approach

For each test, the implementer should:

1. Write the test with the expected assertion values initially left as comments or placeholders
2. Run the test once to capture the current simulator output
3. Fill in the actual values from the current output as the expected values
4. Verify the values make sense given the skill description
5. Commit the test with those values locked in

This "current behavior as truth" approach means:
- If a future code change causes a value to shift, the test fails
- The developer then decides if the change was intentional (update the test) or a regression (fix the code)

## Combat Result Properties to Assert

The main properties available on combat results (from `test_DamageCalculator.calcDamage()`) include:

- `atkUnit_normalAttackDamage` -- damage dealt by attacker's normal attack
- `defUnit_normalAttackDamage` -- damage dealt by defender's counterattack
- `atkUnit_totalAttackCount` -- number of attacks by attacker
- `defUnit_totalAttackCount` -- number of attacks by defender
- Unit stat spurs (`unit.atkSpur`, `unit.spdSpur`, etc.) after `updateAllUnitSpur()`

The implementer should inspect the actual `calcDamage()` return object to identify all available properties for assertion. Use `RegressionTestHelper.extractCombatSnapshot()` from section-05 to standardize which properties to check.

## Estimated Test Count

- Weapon skills: ~30 tests (5-6 tests per weapon, covering primary effects and conditions)
- Special skills: ~20 tests (6-7 tests per special)
- Passive A/B/C skills: ~40 tests (4-5 tests per passive)
- Conditional/negative tests: ~20 tests
- Interaction tests: ~10 tests
- SkillImpl202501 representative tests: ~30 tests

**Total estimate: ~150 tests** (expandable toward ~300 as more skills from 202501 and earlier files are added)

## Implementation Checklist

1. Open `Tests/SkillRegression.test.js` (created in section-05)
2. Add describe blocks for each skill type (Weapon, Special, Passive A/B/C)
3. For each skill in SkillImpl202601.js:
   a. Write a test for the primary combat effect (stat bonuses, extra damage, damage reduction)
   b. Write a test for conditional branches (HP conditions, stat comparisons)
   c. Write a negative test for conditions that should NOT trigger
4. Run `./run_tests.sh skill` to capture current values
5. Lock in expected values from current simulator output
6. Add representative tests for SkillImpl202501.js key skills
7. Verify all tests pass with `./run_tests.sh skill`