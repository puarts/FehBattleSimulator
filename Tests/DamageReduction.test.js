import { UnitGroupType } from '../Sources/UnitConstants.js';
import { UnitBuilder, BattleScenarioBuilder, resetGlobalTestState } from '../Sources/TestUtilities.js';
import './TestGlobals.js';

describe('Damage reduction mechanics', () => {
    beforeEach(() => {
        resetGlobalTestState();
    });

    describe('Basic damage calculation', () => {
        test('Damage equals Atk minus Def (physical)', () => {
            const attacker = UnitBuilder.createDummy(UnitGroupType.Ally)
                .withStats({ atk: 60, spd: 30 })
                .build();
            const defender = UnitBuilder.createDummy(UnitGroupType.Enemy)
                .withStats({ def: 30, spd: 30 })
                .build();
            const result = new BattleScenarioBuilder()
                .withAttacker(attacker)
                .withDefender(defender)
                .execute();
            expect(result.atkUnit_normalAttackDamage).toBe(30);
        });

        test('Damage minimum is 0 when Def exceeds Atk', () => {
            const attacker = UnitBuilder.createDummy(UnitGroupType.Ally)
                .withStats({ atk: 20, spd: 30 })
                .build();
            const defender = UnitBuilder.createDummy(UnitGroupType.Enemy)
                .withStats({ def: 50, spd: 30 })
                .build();
            const result = new BattleScenarioBuilder()
                .withAttacker(attacker)
                .withDefender(defender)
                .execute();
            expect(result.atkUnit_normalAttackDamage).toBe(0);
        });
    });

    describe('Visible buff and debuff effects on damage', () => {
        test('Atk buff increases damage', () => {
            const attacker = UnitBuilder.createDummy(UnitGroupType.Ally)
                .withStats({ atk: 50, spd: 30 })
                .withBonuses({ atk: 6 })
                .build();
            const defender = UnitBuilder.createDummy(UnitGroupType.Enemy)
                .withStats({ def: 30, spd: 30 })
                .build();
            const result = new BattleScenarioBuilder()
                .withAttacker(attacker)
                .withDefender(defender)
                .execute();
            // Damage = (50 + 6) - 30 = 26
            expect(result.atkUnit_normalAttackDamage).toBe(26);
        });

        test('Def buff reduces incoming damage', () => {
            const attacker = UnitBuilder.createDummy(UnitGroupType.Ally)
                .withStats({ atk: 60, spd: 30 })
                .build();
            const defender = UnitBuilder.createDummy(UnitGroupType.Enemy)
                .withStats({ def: 30, spd: 30 })
                .withBonuses({ def: 6 })
                .build();
            const result = new BattleScenarioBuilder()
                .withAttacker(attacker)
                .withDefender(defender)
                .execute();
            // Damage = 60 - (30 + 6) = 24
            expect(result.atkUnit_normalAttackDamage).toBe(24);
        });

        test('Atk debuff reduces outgoing damage', () => {
            const attacker = UnitBuilder.createDummy(UnitGroupType.Ally)
                .withStats({ atk: 60, spd: 30 })
                .withPenalties({ atk: -6 })
                .build();
            const defender = UnitBuilder.createDummy(UnitGroupType.Enemy)
                .withStats({ def: 30, spd: 30 })
                .build();
            const result = new BattleScenarioBuilder()
                .withAttacker(attacker)
                .withDefender(defender)
                .execute();
            // Damage = (60 - 6) - 30 = 24
            expect(result.atkUnit_normalAttackDamage).toBe(24);
        });
    });

    describe('Follow-up multiplies total damage', () => {
        test('Two attacks deal double the per-hit damage to HP', () => {
            // Attacker with follow-up deals damage twice
            const attacker = UnitBuilder.createDummy(UnitGroupType.Ally)
                .withStats({ atk: 60, spd: 50 })
                .build();
            const defender = UnitBuilder.createDummy(UnitGroupType.Enemy)
                .withStats({ def: 30, spd: 20 })
                .build();
            const result = new BattleScenarioBuilder()
                .withAttacker(attacker)
                .withDefender(defender)
                .execute();
            // Per-hit damage = 60 - 30 = 30, attacks twice
            expect(result.atkUnit_normalAttackDamage).toBe(30);
            expect(result.atkUnit_totalAttackCount).toBe(2);
        });
    });

    describe('Weapon triangle', () => {
        test('Neutral matchup: no weapon triangle modifier', () => {
            // Sword vs Sword (same weapon type, both default dummies)
            const attacker = UnitBuilder.createDummy(UnitGroupType.Ally)
                .withStats({ atk: 50, spd: 30 })
                .build();
            const defender = UnitBuilder.createDummy(UnitGroupType.Enemy)
                .withStats({ def: 30, spd: 30 })
                .build();
            const result = new BattleScenarioBuilder()
                .withAttacker(attacker)
                .withDefender(defender)
                .execute();
            // Neutral: damage = 50 - 30 = 20
            expect(result.atkUnit_normalAttackDamage).toBe(20);
        });
    });

    describe('Buff and debuff combined', () => {
        test('Buffs and debuffs both affect damage', () => {
            const attacker = UnitBuilder.createDummy(UnitGroupType.Ally)
                .withStats({ atk: 50, spd: 30 })
                .withBonuses({ atk: 6 })
                .withPenalties({ atk: -4 })
                .build();
            const defender = UnitBuilder.createDummy(UnitGroupType.Enemy)
                .withStats({ def: 30, spd: 30 })
                .build();
            const result = new BattleScenarioBuilder()
                .withAttacker(attacker)
                .withDefender(defender)
                .execute();
            // Effective atk = 50 + 6 - 4 = 52
            // Damage = 52 - 30 = 22
            expect(result.atkUnit_normalAttackDamage).toBe(22);
        });
    });
});
