# Usage Guide — FEH Battle Simulator Test Infrastructure

## Quick Start

Run all tests:
```bash
./run_tests.sh
```

Run tests by category:
```bash
./run_tests.sh combat    # Combat logic tests
./run_tests.sh skill     # Skill regression tests
./run_tests.sh dsl       # DSL node tests
./run_tests.sh infra     # Infrastructure tests (UnitBuilder, Performance, etc.)
```

## Test Helpers

### UnitBuilder
```javascript
// Create dummy unit with controlled stats
const unit = UnitBuilder.createDummy(UnitGroupType.Ally)
    .withStats({ hp: 50, atk: 60, spd: 45, def: 30, res: 25 })
    .withWeapon(Weapon.SomeWeapon)
    .withSpecial(Special.Moonbow)
    .withPassiveA(PassiveA.HeavyBlade4)
    .withSpecialCount(0)
    .withHpPercent(75)
    .withBonuses({ atk: 6 })
    .withPenalties({ def: -4 })
    .atPosition(3, 2)
    .build();

// Create unit from hero data
const hero = UnitBuilder.fromHero('アルフォンス', UnitGroupType.Ally)
    .withPassiveS(PassiveS.QuickRiposte3)
    .build();
```

### BattleScenarioBuilder
```javascript
const result = new BattleScenarioBuilder()
    .withAttacker(attacker)
    .withDefender(defender)
    .addAlly(supportUnit)
    .addFoe(enemySupport)
    .onTurn(3)
    .execute();

// Key result properties:
result.atkUnit_normalAttackDamage  // Normal attack damage
result.atkUnit_specialAttackDamage // Special attack damage
result.atkUnit_totalAttackCount    // 1 or 2 (with follow-up)
result.defUnit_totalAttackCount    // 0 if prevented, 1-2 otherwise
result.preCombatDamage             // AoE special damage
result.atkUnit_specialCount        // Post-combat special count
// NOTE: defRestHp/atkRestHp = pre-combat HP, NOT post-combat
```

### RegressionTestHelper
```javascript
const snapshot = RegressionTestHelper.extractCombatSnapshot(result);
// Returns: { atkUnit_normalAttackDamage, defUnit_normalAttackDamage,
//            atkUnit_atk, defUnit_def, atkRestHp, defRestHp,
//            atkUnit_totalAttackCount, defUnit_totalAttackCount, preCombatDamage }
```

## Test Files Summary

| File | Tests | Category |
|------|-------|----------|
| DamageCalculator.test.js | existing | combat |
| BeginningOfTurnSkillHandler.test.js | existing | combat |
| CombatFlow.test.js | 11 | combat |
| SpecialCount.test.js | 8 | combat |
| DamageReduction.test.js | 7 | combat |
| FollowUpAttack.test.js | 8 | combat |
| StatusEffect.test.js | 5 | combat |
| SkillRegression.test.js | varies | skill |
| DslNode.test.js | 17 | dsl |
| SkillEffect.test.js | existing | dsl |
| GetRequirements.test.js | existing | dsl |
| Performance.test.js | 1 | infra |
| TestHelper.test.js | 11 | infra |
| UnitManager.test.js | existing | infra |
| SimpleUtility.test.js | existing | infra |
