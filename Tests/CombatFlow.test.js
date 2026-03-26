import { UnitGroupType } from '../Sources/UnitConstants.js';
import { Special, PassiveB, Weapon } from '../Sources/SkillConstants.js';
import { UnitBuilder, BattleScenarioBuilder, resetGlobalTestState } from '../Sources/TestUtilities.js';
import './TestGlobals.js';

describe('Combat flow', () => {
    beforeEach(() => {
        resetGlobalTestState();
    });

    describe('Basic combat flow', () => {
        test('Attacker attacks first, defender counter-attacks', () => {
            const attacker = UnitBuilder.createDummy(UnitGroupType.Ally)
                .withStats({ atk: 50, def: 30, spd: 30 })
                .build();
            const defender = UnitBuilder.createDummy(UnitGroupType.Enemy)
                .withStats({ atk: 50, def: 30, spd: 30 })
                .build();
            const result = new BattleScenarioBuilder()
                .withAttacker(attacker)
                .withDefender(defender)
                .execute();
            expect(result.atkUnit_totalAttackCount).toBe(1);
            expect(result.defUnit_totalAttackCount).toBe(1);
            // Both deal 50 - 30 = 20 damage
            expect(result.atkUnit_normalAttackDamage).toBe(20);
            expect(result.defUnit_normalAttackDamage).toBe(20);
        });

        test('Follow-up with high Spd deals two attacks', () => {
            const attacker = UnitBuilder.createDummy(UnitGroupType.Ally)
                .withStats({ atk: 50, spd: 50, def: 30 })
                .build();
            const defender = UnitBuilder.createDummy(UnitGroupType.Enemy)
                .withStats({ def: 30, spd: 20 })
                .build();
            const result = new BattleScenarioBuilder()
                .withAttacker(attacker)
                .withDefender(defender)
                .execute();
            expect(result.atkUnit_totalAttackCount).toBe(2);
            expect(result.atkUnit_normalAttackDamage).toBe(20);
        });
    });

    describe('Miracle (survive at 1 HP)', () => {
        test('Miracle allows defender to survive lethal damage and counter-attack', () => {
            // Without Miracle: 99-30=69 damage to 50 HP defender → KO, no counter
            // With Miracle at count 0: defender survives at 1 HP, can counter
            const attacker = UnitBuilder.createDummy(UnitGroupType.Ally)
                .withStats({ atk: 99, spd: 30 })
                .build();
            const defender = UnitBuilder.createDummy(UnitGroupType.Enemy)
                .withSpecial(Special.Miracle)
                .withSpecialCount(0)
                .withStats({ hp: 50, def: 30, spd: 30 })
                .build();
            const result = new BattleScenarioBuilder()
                .withAttacker(attacker)
                .withDefender(defender)
                .execute();
            // Key assertion: defender survives (counter-attacks)
            // Without Miracle, defender would be KO'd (69 > 50) and counter = 0
            expect(result.defUnit_totalAttackCount).toBe(1);
            expect(result.atkUnit_normalAttackDamage).toBe(69);
        });

        test('Without Miracle, defender still counter-attacks in estimated mode', () => {
            // EstimatedDamage mode continues combat even after KO
            const attacker = UnitBuilder.createDummy(UnitGroupType.Ally)
                .withStats({ atk: 99, spd: 30 })
                .build();
            const defender = UnitBuilder.createDummy(UnitGroupType.Enemy)
                .withStats({ hp: 50, def: 30, spd: 30 })
                .build();
            const result = new BattleScenarioBuilder()
                .withAttacker(attacker)
                .withDefender(defender)
                .execute();
            // In EstimatedDamage mode, combat continues regardless of KO
            expect(result.defUnit_totalAttackCount).toBe(1);
            expect(result.atkUnit_normalAttackDamage).toBe(69);
        });
    });

    describe('Counter-attack prevention (Sweep)', () => {
        test('Windsweep prevents enemy counter-attack', () => {
            const attacker = UnitBuilder.createDummy(UnitGroupType.Ally)
                .withPassiveB(PassiveB.Kazenagi3)
                .withStats({ atk: 50, spd: 40 })
                .build();
            const defender = UnitBuilder.createDummy(UnitGroupType.Enemy)
                .withStats({ atk: 50, def: 30, spd: 30 })
                .build();
            const result = new BattleScenarioBuilder()
                .withAttacker(attacker)
                .withDefender(defender)
                .execute();
            expect(result.defUnit_totalAttackCount).toBe(0);
            expect(result.atkUnit_normalAttackDamage).toBe(20);
        });

        test('Firesweep prevents all counter-attacks', () => {
            const attacker = UnitBuilder.createDummy(UnitGroupType.Ally)
                .withWeapon(Weapon.FiresweepSwordPlus)
                .withStats({ atk: 50, spd: 30 })
                .build();
            const defender = UnitBuilder.createDummy(UnitGroupType.Enemy)
                .withStats({ atk: 50, def: 30, spd: 30 })
                .build();
            const result = new BattleScenarioBuilder()
                .withAttacker(attacker)
                .withDefender(defender)
                .execute();
            expect(result.defUnit_totalAttackCount).toBe(0);
        });
    });

    describe('AoE special', () => {
        test('AoE special deals pre-combat damage', () => {
            const attacker = UnitBuilder.createDummy(UnitGroupType.Ally)
                .withSpecial(Special.BlazingFlame)
                .withSpecialCount(0)
                .withStats({ atk: 60, spd: 30 })
                .build();
            const defender = UnitBuilder.createDummy(UnitGroupType.Enemy)
                .withStats({ def: 30, res: 30, spd: 30 })
                .build();
            const result = new BattleScenarioBuilder()
                .withAttacker(attacker)
                .withDefender(defender)
                .execute();
            expect(result.preCombatDamage).toBeGreaterThan(0);
        });
    });

    describe('Vantage', () => {
        test('Vantage defender attacks and deals damage when HP <= 75%', () => {
            const attacker = UnitBuilder.createDummy(UnitGroupType.Ally)
                .withStats({ hp: 50, atk: 50, def: 30, spd: 30 })
                .build();
            const defender = UnitBuilder.createDummy(UnitGroupType.Enemy)
                .withPassiveB(PassiveB.Vantage3)
                .withStats({ hp: 40, atk: 60, def: 30, spd: 30 })
                .withHpPercent(50) // below 75% threshold
                .build();
            const result = new BattleScenarioBuilder()
                .withAttacker(attacker)
                .withDefender(defender)
                .execute();
            expect(result.atkUnit_totalAttackCount).toBe(1);
            expect(result.defUnit_totalAttackCount).toBe(1);
            expect(result.atkUnit_normalAttackDamage).toBe(20);
            expect(result.defUnit_normalAttackDamage).toBe(30);
        });
    });

    describe('Desperation', () => {
        test('Desperation attacker follows up before counter when HP <= 75%', () => {
            const attacker = UnitBuilder.createDummy(UnitGroupType.Ally)
                .withPassiveB(PassiveB.Desperation3)
                .withStats({ hp: 40, atk: 50, spd: 45 })
                .withHpPercent(50) // below 75% threshold
                .build();
            const defender = UnitBuilder.createDummy(UnitGroupType.Enemy)
                .withStats({ hp: 99, atk: 99, def: 30, spd: 30 })
                .build();
            const result = new BattleScenarioBuilder()
                .withAttacker(attacker)
                .withDefender(defender)
                .execute();
            // Spd diff = 15 >= 5, follow-up granted
            expect(result.atkUnit_totalAttackCount).toBe(2);
            expect(result.defUnit_totalAttackCount).toBe(1);
            expect(result.atkUnit_normalAttackDamage).toBe(20);
        });
    });
});
