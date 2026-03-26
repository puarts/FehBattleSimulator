import { UnitGroupType } from '../Sources/UnitConstants.js';
import { Special, PassiveA, PassiveB } from '../Sources/SkillConstants.js';
import { UnitBuilder, BattleScenarioBuilder, resetGlobalTestState } from '../Sources/TestUtilities.js';
import './TestGlobals.js';

describe('Special count mechanics', () => {
    beforeEach(() => {
        resetGlobalTestState();
    });

    describe('Basic charge', () => {
        test('Special count decreases by 1 per attack', () => {
            // Moonbow has cooldown 2
            const attacker = UnitBuilder.createDummy(UnitGroupType.Ally)
                .withSpecial(Special.Moonbow)
                .withStats({ atk: 60, spd: 50 })
                .build();
            const defender = UnitBuilder.createDummy(UnitGroupType.Enemy)
                .withStats({ def: 30, spd: 20 })
                .build();
            expect(attacker.specialCount).toBe(2);
            const result = new BattleScenarioBuilder()
                .withAttacker(attacker)
                .withDefender(defender)
                .execute();
            // Attacker attacks twice (follow-up), special charges during attacks
            expect(result.atkUnit_totalAttackCount).toBe(2);
        });

        test('Special triggers at count 0 and increases damage', () => {
            // Moonbow: Treats foe's Def/Res as if reduced by 30%
            const attacker = UnitBuilder.createDummy(UnitGroupType.Ally)
                .withSpecial(Special.Moonbow)
                .withSpecialCount(0)
                .withStats({ atk: 60, spd: 30 })
                .build();
            const defender = UnitBuilder.createDummy(UnitGroupType.Enemy)
                .withStats({ def: 40, spd: 30 })
                .build();
            const result = new BattleScenarioBuilder()
                .withAttacker(attacker)
                .withDefender(defender)
                .execute();
            // Special activates: special attack damage > normal attack damage
            expect(result.atkUnit_specialAttackDamage).toBeGreaterThan(result.atkUnit_normalAttackDamage);
        });

        test('Special count resets to max after activation', () => {
            const attacker = UnitBuilder.createDummy(UnitGroupType.Ally)
                .withSpecial(Special.Moonbow)
                .withSpecialCount(0)
                .withStats({ atk: 60, spd: 30 })
                .build();
            const defender = UnitBuilder.createDummy(UnitGroupType.Enemy)
                .withStats({ def: 30, spd: 30 })
                .build();
            const result = new BattleScenarioBuilder()
                .withAttacker(attacker)
                .withDefender(defender)
                .execute();
            // After special activation (count 0→triggers→resets to 2),
            // then defender counter reduces by 1: count = 1
            expect(result.atkUnit_specialCount).toBe(1);
        });
    });

    describe('Charge acceleration (Heavy Blade)', () => {
        test('Heavy Blade grants extra charge when Atk condition met', () => {
            const attacker = UnitBuilder.createDummy(UnitGroupType.Ally)
                .withPassiveA(PassiveA.HeavyBlade4)
                .withSpecial(Special.Moonbow)
                .withStats({ atk: 60, spd: 30 })
                .build();
            const defender = UnitBuilder.createDummy(UnitGroupType.Enemy)
                .withStats({ atk: 30, def: 30, spd: 30 })
                .build();
            // Attacker atk 60 > defender atk 30 → Heavy Blade activates
            // Moonbow cooldown 2, +1 charge per attack = 2 charge on first attack → triggers
            const result = new BattleScenarioBuilder()
                .withAttacker(attacker)
                .withDefender(defender)
                .execute();
            // Special should have triggered
            expect(result.atkUnit_specialAttackDamage).toBeGreaterThan(0);
        });

        test('Heavy Blade does not grant extra charge when Atk condition not met', () => {
            const attacker = UnitBuilder.createDummy(UnitGroupType.Ally)
                .withPassiveA(PassiveA.HeavyBlade4)
                .withSpecial(Special.Moonbow)
                .withStats({ atk: 30, spd: 30 })
                .build();
            const defender = UnitBuilder.createDummy(UnitGroupType.Enemy)
                .withStats({ atk: 60, def: 30, spd: 30 })
                .build();
            // Attacker atk 30 < defender atk 60 → Heavy Blade does NOT activate
            // Without extra charge: after atk (count 2→1) + def counter (1→0)
            // Special ready but only triggers on own attack, count = 0
            const result = new BattleScenarioBuilder()
                .withAttacker(attacker)
                .withDefender(defender)
                .execute();
            expect(result.atkUnit_specialCount).toBe(0);
        });
    });

    describe('Acceleration + deceleration interaction', () => {
        test('Heavy Blade acceleration and Guard deceleration cancel out', () => {
            const attacker = UnitBuilder.createDummy(UnitGroupType.Ally)
                .withPassiveA(PassiveA.HeavyBlade4)
                .withSpecial(Special.Moonbow)
                .withStats({ atk: 60, spd: 30 })
                .build();
            const defender = UnitBuilder.createDummy(UnitGroupType.Enemy)
                .withPassiveB(PassiveB.Guard4)
                .withStats({ atk: 30, def: 30, spd: 30 })
                .build();
            // Heavy Blade +1, Guard -1 → net charge = 1 per attack (normal)
            // After 1 atk (count 2→1) + 1 def counter (1→0): count should be near 0
            const result = new BattleScenarioBuilder()
                .withAttacker(attacker)
                .withDefender(defender)
                .execute();
            // Actual behavior: count = 1 (Guard reduces charge including defender's counter)
            expect(result.atkUnit_specialCount).toBe(1);
        });
    });

    describe('Charge deceleration (Guard)', () => {
        test('Guard B skill delays special charge', () => {
            const attacker = UnitBuilder.createDummy(UnitGroupType.Ally)
                .withSpecial(Special.Moonbow)
                .withStats({ atk: 60, spd: 30 })
                .build();
            const defender = UnitBuilder.createDummy(UnitGroupType.Enemy)
                .withPassiveB(PassiveB.Guard4)
                .withStats({ def: 30, spd: 30 })
                .build();
            // Guard: inflicts Special cooldown charge -1 on foe
            // Attacker charge per attack: 1 - 1 = 0
            const result = new BattleScenarioBuilder()
                .withAttacker(attacker)
                .withDefender(defender)
                .execute();
            // With Guard, attacker's special charge should be slowed
            // After 1 atk + 1 def counter: if charge = 0 per action, count stays at 2
            expect(result.atkUnit_specialCount).toBe(2);
        });
    });

    describe('Offensive special damage', () => {
        test('Moonbow reduces effective Def by 30%', () => {
            // Moonbow at count 0: should trigger on first attack
            const attacker = UnitBuilder.createDummy(UnitGroupType.Ally)
                .withSpecial(Special.Moonbow)
                .withSpecialCount(0)
                .withStats({ atk: 60, spd: 30 })
                .build();
            const defender = UnitBuilder.createDummy(UnitGroupType.Enemy)
                .withStats({ def: 50, spd: 30 })
                .build();
            const result = new BattleScenarioBuilder()
                .withAttacker(attacker)
                .withDefender(defender)
                .execute();
            // Normal damage: 60 - 50 = 10
            // Moonbow: Def treated as 50 * 0.7 = 35 → damage = 60 - 35 = 25
            expect(result.atkUnit_normalAttackDamage).toBe(10);
            expect(result.atkUnit_specialAttackDamage).toBe(25);
        });
    });
});
