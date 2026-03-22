import { UnitGroupType } from '../Sources/UnitConstants.js';
import { PassiveB, Special } from '../Sources/SkillConstants.js';
import { StatusEffectType } from '../Sources/StatusConstants.js';

describe('Status effects', () => {
    beforeEach(() => {
        resetGlobalTestState();
    });

    describe('Panic', () => {
        test('Panic inverts visible buffs (bonus becomes penalty)', () => {
            // Unit with Panic and +6 Atk buff → Atk bonus treated as -6
            const attacker = UnitBuilder.createDummy(UnitGroupType.Ally)
                .withStats({ atk: 50, spd: 30 })
                .build();
            // Apply Panic status to defender, who has Atk buff
            const defender = UnitBuilder.createDummy(UnitGroupType.Enemy)
                .withStats({ def: 30, spd: 30 })
                .withBonuses({ atk: 6 })
                .build();
            defender.addStatusEffect(StatusEffectType.Panic);

            const resultPanic = new BattleScenarioBuilder()
                .withAttacker(attacker)
                .withDefender(defender)
                .execute();

            // Compare with same setup without Panic
            const attacker2 = UnitBuilder.createDummy(UnitGroupType.Ally)
                .withStats({ atk: 50, spd: 30 })
                .build();
            const defenderNoPanic = UnitBuilder.createDummy(UnitGroupType.Enemy)
                .withStats({ def: 30, spd: 30 })
                .withBonuses({ atk: 6 })
                .build();
            const resultNoPanic = new BattleScenarioBuilder()
                .withAttacker(attacker2)
                .withDefender(defenderNoPanic)
                .execute();

            // Without Panic: defender counter-atk uses atk bonus +6
            // With Panic: defender counter-atk treats +6 as -6 (total -12 swing)
            // So defender's counter damage should be less with Panic
            expect(resultPanic.defUnit_normalAttackDamage).toBeLessThan(resultNoPanic.defUnit_normalAttackDamage);
        });

        test('Panic on defender Def bonus helps attacker damage', () => {
            const attacker = UnitBuilder.createDummy(UnitGroupType.Ally)
                .withStats({ atk: 50, spd: 30 })
                .build();
            const defender = UnitBuilder.createDummy(UnitGroupType.Enemy)
                .withStats({ def: 30, spd: 30 })
                .withBonuses({ def: 6 })
                .build();
            defender.addStatusEffect(StatusEffectType.Panic);

            const resultPanic = new BattleScenarioBuilder()
                .withAttacker(attacker)
                .withDefender(defender)
                .execute();

            // With Panic: def bonus +6 becomes -6 → effective def = 30 - 6 = 24
            // Attacker damage = 50 - 24 = 26
            const attacker2 = UnitBuilder.createDummy(UnitGroupType.Ally)
                .withStats({ atk: 50, spd: 30 })
                .build();
            const defenderNoPanic = UnitBuilder.createDummy(UnitGroupType.Enemy)
                .withStats({ def: 30, spd: 30 })
                .withBonuses({ def: 6 })
                .build();
            const resultNoPanic = new BattleScenarioBuilder()
                .withAttacker(attacker2)
                .withDefender(defenderNoPanic)
                .execute();

            // Panic makes defender's def bonus negative → more damage taken
            expect(resultPanic.atkUnit_normalAttackDamage).toBeGreaterThan(resultNoPanic.atkUnit_normalAttackDamage);
        });
    });

    describe('Guard status effect', () => {
        test('Guard status slows special charge compared to no Guard', () => {
            // Without Guard: after 1 atk + 1 def counter, Moonbow count 2→1→0
            const attacker1 = UnitBuilder.createDummy(UnitGroupType.Ally)
                .withSpecial(Special.Moonbow)
                .withStats({ atk: 60, spd: 30 })
                .build();
            const defender1 = UnitBuilder.createDummy(UnitGroupType.Enemy)
                .withStats({ def: 30, spd: 30 })
                .build();
            const resultNoGuard = new BattleScenarioBuilder()
                .withAttacker(attacker1)
                .withDefender(defender1)
                .execute();

            // With Guard B skill: charge deceleration
            const attacker2 = UnitBuilder.createDummy(UnitGroupType.Ally)
                .withSpecial(Special.Moonbow)
                .withStats({ atk: 60, spd: 30 })
                .build();
            const defender2 = UnitBuilder.createDummy(UnitGroupType.Enemy)
                .withPassiveB(PassiveB.Guard4)
                .withStats({ def: 30, spd: 30 })
                .build();
            const resultGuard = new BattleScenarioBuilder()
                .withAttacker(attacker2)
                .withDefender(defender2)
                .execute();

            // Guard should result in higher (less charged) special count
            expect(resultGuard.atkUnit_specialCount).toBeGreaterThan(resultNoGuard.atkUnit_specialCount);
        });
    });

    describe('Deep Wounds', () => {
        test('Deep Wounds status is applied to unit', () => {
            const unit = UnitBuilder.createDummy(UnitGroupType.Ally)
                .build();
            unit.addStatusEffect(StatusEffectType.DeepWounds);
            expect(unit.hasStatusEffect(StatusEffectType.DeepWounds)).toBe(true);
        });
    });

    describe('Buff and debuff interaction', () => {
        test('Buffs and debuffs stack independently', () => {
            const attacker = UnitBuilder.createDummy(UnitGroupType.Ally)
                .withStats({ atk: 50, spd: 30 })
                .withBonuses({ atk: 6 })
                .withPenalties({ atk: -7 })
                .build();
            const defender = UnitBuilder.createDummy(UnitGroupType.Enemy)
                .withStats({ def: 30, spd: 30 })
                .build();
            const result = new BattleScenarioBuilder()
                .withAttacker(attacker)
                .withDefender(defender)
                .execute();
            // Effective atk = 50 + 6 - 7 = 49
            // Damage = 49 - 30 = 19
            expect(result.atkUnit_normalAttackDamage).toBe(19);
        });
    });
});
