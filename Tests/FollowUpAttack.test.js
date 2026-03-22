import { UnitGroupType } from '../Sources/UnitConstants.js';
import { PassiveB, PassiveS } from '../Sources/SkillConstants.js';

describe('Follow-up attack determination', () => {
    beforeEach(() => {
        resetGlobalTestState();
    });

    describe('Speed-based follow-up', () => {
        test('Follow-up occurs when Spd difference >= 5', () => {
            const attacker = UnitBuilder.createDummy(UnitGroupType.Ally)
                .withStats({ atk: 50, spd: 45 })
                .build();
            const defender = UnitBuilder.createDummy(UnitGroupType.Enemy)
                .withStats({ def: 30, spd: 40 })
                .build();
            const result = new BattleScenarioBuilder()
                .withAttacker(attacker)
                .withDefender(defender)
                .execute();
            // Spd diff = 5, follow-up occurs → attacker attacks twice
            expect(result.atkUnit_totalAttackCount).toBe(2);
        });

        test('No follow-up when Spd difference < 5', () => {
            const attacker = UnitBuilder.createDummy(UnitGroupType.Ally)
                .withStats({ atk: 50, spd: 44 })
                .build();
            const defender = UnitBuilder.createDummy(UnitGroupType.Enemy)
                .withStats({ def: 30, spd: 40 })
                .build();
            const result = new BattleScenarioBuilder()
                .withAttacker(attacker)
                .withDefender(defender)
                .execute();
            // Spd diff = 4, no follow-up → attacker attacks once
            expect(result.atkUnit_totalAttackCount).toBe(1);
        });

        test('Spd difference exactly 5 triggers follow-up (boundary)', () => {
            const attacker = UnitBuilder.createDummy(UnitGroupType.Ally)
                .withStats({ atk: 50, spd: 35 })
                .build();
            const defender = UnitBuilder.createDummy(UnitGroupType.Enemy)
                .withStats({ def: 30, spd: 30 })
                .build();
            const result = new BattleScenarioBuilder()
                .withAttacker(attacker)
                .withDefender(defender)
                .execute();
            expect(result.atkUnit_totalAttackCount).toBe(2);
        });

        test('Spd difference exactly 4 does not trigger follow-up (boundary)', () => {
            const attacker = UnitBuilder.createDummy(UnitGroupType.Ally)
                .withStats({ atk: 50, spd: 34 })
                .build();
            const defender = UnitBuilder.createDummy(UnitGroupType.Enemy)
                .withStats({ def: 30, spd: 30 })
                .build();
            const result = new BattleScenarioBuilder()
                .withAttacker(attacker)
                .withDefender(defender)
                .execute();
            expect(result.atkUnit_totalAttackCount).toBe(1);
        });

        test('Defender follow-up when defender Spd >= attacker Spd + 5', () => {
            const attacker = UnitBuilder.createDummy(UnitGroupType.Ally)
                .withStats({ atk: 50, spd: 30 })
                .build();
            const defender = UnitBuilder.createDummy(UnitGroupType.Enemy)
                .withStats({ def: 30, spd: 35 })
                .build();
            const result = new BattleScenarioBuilder()
                .withAttacker(attacker)
                .withDefender(defender)
                .execute();
            expect(result.defUnit_totalAttackCount).toBe(2);
        });
    });

    describe('Guaranteed follow-up (Quick Riposte)', () => {
        test('Quick Riposte grants guaranteed follow-up on defense', () => {
            const attacker = UnitBuilder.createDummy(UnitGroupType.Ally)
                .withStats({ atk: 50, spd: 50 })
                .build();
            const defender = UnitBuilder.createDummy(UnitGroupType.Enemy)
                .withPassiveB(PassiveB.QuickRiposte3)
                .withStats({ def: 30, spd: 20 })
                .build();
            const result = new BattleScenarioBuilder()
                .withAttacker(attacker)
                .withDefender(defender)
                .execute();
            // Quick Riposte: guaranteed follow-up when defending at HP >= 70%
            // Defender spd 20 vs attacker spd 50, but QR grants follow-up
            expect(result.defUnit_totalAttackCount).toBe(2);
            expect(result.defUnitFollowUpPriorityInc).toBeGreaterThanOrEqual(1);
        });
    });

    describe('Follow-up prevention (Wary Fighter)', () => {
        test('Wary Fighter prevents both units follow-up', () => {
            const attacker = UnitBuilder.createDummy(UnitGroupType.Ally)
                .withStats({ atk: 50, spd: 50 })
                .build();
            const defender = UnitBuilder.createDummy(UnitGroupType.Enemy)
                .withPassiveB(PassiveB.WaryFighter3)
                .withStats({ def: 30, spd: 20 })
                .build();
            const result = new BattleScenarioBuilder()
                .withAttacker(attacker)
                .withDefender(defender)
                .execute();
            // Wary Fighter: prevents follow-up for both units
            expect(result.atkUnit_totalAttackCount).toBe(1);
            expect(result.defUnit_totalAttackCount).toBe(1);
        });
    });

    describe('Guaranteed vs Prevention interaction', () => {
        test('Guaranteed follow-up and prevention cancel each other, revert to Spd check', () => {
            // Attacker has guaranteed follow-up (from Quick Riposte on seal as defender scenario)
            // But let's test: defender has both QR (guaranteed) and attacker has high spd
            // Use Wary Fighter on defender + Quick Riposte on defender
            // WF prevents defender follow-up, QR grants it → cancel out → Spd check
            const attacker = UnitBuilder.createDummy(UnitGroupType.Ally)
                .withStats({ atk: 50, spd: 50 })
                .build();
            const defender = UnitBuilder.createDummy(UnitGroupType.Enemy)
                .withPassiveB(PassiveB.WaryFighter3)
                .withPassiveS(PassiveS.QuickRiposte3)
                .withStats({ def: 30, spd: 20 })
                .build();
            const result = new BattleScenarioBuilder()
                .withAttacker(attacker)
                .withDefender(defender)
                .execute();
            // Wary Fighter prevents both follow-ups
            // QR grants defender follow-up
            // Net for defender: prevention + guarantee = cancel → Spd check (spd 20 vs 50, no follow-up)
            // Net for attacker: Wary Fighter prevents → no follow-up (unless spd check after cancel)
            // Actually WF prevents follow-up attacks by unit AND foe
            // So attacker: WF prevention, no guarantee → prevented
            // Defender: WF gives guaranteed prevention to self too? Let's check the result
            expect(result.atkUnit_totalAttackCount).toBe(1);
            // Defender: QR +1, WF -1 → cancel → spd check → 20 vs 50, no follow-up
            expect(result.defUnit_totalAttackCount).toBe(1);
        });
    });
});
