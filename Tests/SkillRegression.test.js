// スキルIDからスキル名を取得するヘルパー
function getSkillName(skillId) {
    let info = g_testHeroDatabase.skillDatabase.findSkillInfoByDict(skillId);
    return info ? info.name : `Unknown(${skillId})`;
}

describe('Skill regression test template validation', () => {
    beforeEach(() => {
        resetGlobalTestState();
    });

    test('Template: createDummy + withWeapon + execute produces valid combat result', () => {
        const attacker = UnitBuilder.createDummy(UnitGroupType.Ally)
            .withWeapon(Weapon.ChosenLance)
            .build();
        const defender = UnitBuilder.createDummy(UnitGroupType.Enemy)
            .build();
        const result = new BattleScenarioBuilder()
            .withAttacker(attacker)
            .withDefender(defender)
            .execute();
        expect(result).toBeDefined();
        expect(result.atkUnit_normalAttackDamage).toBeDefined();
        expect(result.defUnit_normalAttackDamage).toBeDefined();
    });

    test('Template: baseline damage with no skills is predictable', () => {
        const attacker = UnitBuilder.createDummy(UnitGroupType.Ally).build();
        const defender = UnitBuilder.createDummy(UnitGroupType.Enemy).build();
        const result = new BattleScenarioBuilder()
            .withAttacker(attacker)
            .withDefender(defender)
            .execute();
        // Default dummy (atk 50) vs default dummy (def 50) = 0 damage
        expect(result.atkUnit_normalAttackDamage).toBe(0);
        expect(result.defUnit_normalAttackDamage).toBe(0);
        expect(result.atkUnit_totalAttackCount).toBe(1);
        expect(result.defUnit_totalAttackCount).toBe(1);
    });

    test('Template: createDummy with custom stats affects combat result', () => {
        const attacker = UnitBuilder.createDummy(UnitGroupType.Ally, {
            hp: 99, atk: 60, spd: 40, def: 30, res: 20
        }).build();
        const defender = UnitBuilder.createDummy(UnitGroupType.Enemy).build();
        const result = new BattleScenarioBuilder()
            .withAttacker(attacker)
            .withDefender(defender)
            .execute();
        // atk 60 - def 50 = 10
        expect(result.atkUnit_normalAttackDamage).toBe(10);
    });

    test('Template: withWeapon sets weapon and updates weaponInfo', () => {
        const attacker = UnitBuilder.createDummy(UnitGroupType.Ally)
            .withWeapon(Weapon.ChosenLance)
            .build();
        expect(attacker.weapon).toBe(Weapon.ChosenLance);
        expect(attacker.weaponInfo).toBeDefined();
        expect(attacker.weaponInfo.id).toBe(Weapon.ChosenLance);
    });

    test('Template: getSkillName returns skill display name', () => {
        expect(getSkillName(Weapon.ChosenLance)).not.toBe(`Unknown(${Weapon.ChosenLance})`);
        expect(typeof getSkillName(Weapon.ChosenLance)).toBe('string');
    });
});

describe('Skill regression template - known skill validation', () => {
    beforeEach(() => {
        resetGlobalTestState();
    });

    // Weapon.ChosenLance: unconditional, Grants Atk/Spd/Def/Res+15, deals +25 damage, reduces damage by 15
    {
        const skillId = Weapon.ChosenLance;
        test(`${getSkillName(skillId)}: Grants Atk/Spd/Def/Res+15, deals +25 damage, reduces damage by 15`, () => {
            const attacker = UnitBuilder.createDummy(UnitGroupType.Ally)
                .withWeapon(skillId)
                .build();
            const defender = UnitBuilder.createDummy(UnitGroupType.Enemy)
                .build();
            const result = new BattleScenarioBuilder()
                .withAttacker(attacker)
                .withDefender(defender)
                .execute();
            const snapshot = RegressionTestHelper.extractCombatSnapshot(result);
            expect(snapshot.atkUnit_normalAttackDamage).toBe(40);
            expect(snapshot.defUnit_normalAttackDamage).toBe(0);
            expect(snapshot.atkUnit_totalAttackCount).toBe(2);
            expect(snapshot.defUnit_totalAttackCount).toBe(1);
            expect(snapshot.atkRestHp).toBe(50);
            expect(snapshot.defRestHp).toBe(50);
        });
    }

    // PassiveA.SwiftSpecter: HP >= 25% or within 3 spaces of ally → Atk/Spd+9 and additional effects
    {
        const skillId = PassiveA.SwiftSpecter;
        test(`${getSkillName(skillId)}: condition met (HP >= 25%) grants combat bonuses`, () => {
            const attacker = UnitBuilder.createDummy(UnitGroupType.Ally)
                .withPassiveA(skillId)
                .build();
            const defender = UnitBuilder.createDummy(UnitGroupType.Enemy)
                .build();
            const result = new BattleScenarioBuilder()
                .withAttacker(attacker)
                .withDefender(defender)
                .execute();
            const snapshot = RegressionTestHelper.extractCombatSnapshot(result);
            expect(snapshot.atkUnit_normalAttackDamage).toBe(16);
            expect(snapshot.defUnit_normalAttackDamage).toBe(0);
            expect(snapshot.atkUnit_totalAttackCount).toBe(2);
            expect(snapshot.atkRestHp).toBe(50);
            expect(snapshot.defRestHp).toBe(50);
        });

        test(`${getSkillName(skillId)}: condition NOT met (HP < 25%, no allies)`, () => {
            const attacker = UnitBuilder.createDummy(UnitGroupType.Ally)
                .withPassiveA(skillId)
                .withHpPercent(10)
                .build();
            const defender = UnitBuilder.createDummy(UnitGroupType.Enemy)
                .build();
            const result = new BattleScenarioBuilder()
                .withAttacker(attacker)
                .withDefender(defender)
                .execute();
            const snapshot = RegressionTestHelper.extractCombatSnapshot(result);
            expect(snapshot.atkUnit_normalAttackDamage).toBe(0);
            expect(snapshot.defUnit_normalAttackDamage).toBe(0);
            expect(snapshot.atkUnit_totalAttackCount).toBe(1);
            expect(snapshot.atkRestHp).toBe(5);
            expect(snapshot.defRestHp).toBe(50);
        });
    }

    // PassiveB.WildAtHeart: unconditional attacks twice, inflicts Atk/Spd/Def-5
    {
        const skillId = PassiveB.WildAtHeart;
        test(`${getSkillName(skillId)}: attacks twice and inflicts penalties`, () => {
            const attacker = UnitBuilder.createDummy(UnitGroupType.Ally)
                .withPassiveB(skillId)
                .build();
            const defender = UnitBuilder.createDummy(UnitGroupType.Enemy)
                .build();
            const result = new BattleScenarioBuilder()
                .withAttacker(attacker)
                .withDefender(defender)
                .execute();
            const snapshot = RegressionTestHelper.extractCombatSnapshot(result);
            // Inflicts Atk/Spd/Def-5: foe def 50-5=45, damage = 50-45=5 + percentage damage
            expect(snapshot.atkUnit_normalAttackDamage).toBe(15);
            expect(snapshot.defUnit_normalAttackDamage).toBe(0);
            // Attacks twice (both phases)
            expect(snapshot.atkUnit_totalAttackCount).toBe(4);
            expect(snapshot.atkRestHp).toBe(50);
            expect(snapshot.defRestHp).toBe(50);
        });
    }
});

describe('Skill regression template - multi-unit scenarios', () => {
    beforeEach(() => {
        resetGlobalTestState();
    });

    test(`${getSkillName(PassiveA.AtkSpdAirspace)}: ally within 3 spaces enables skill`, () => {
        const attacker = UnitBuilder.createDummy(UnitGroupType.Ally)
            .withPassiveA(PassiveA.AtkSpdAirspace)
            .build();
        const ally = UnitBuilder.createDummy(UnitGroupType.Ally)
            .atPosition(1, 0)
            .build();
        const defender = UnitBuilder.createDummy(UnitGroupType.Enemy)
            .build();
        const result = new BattleScenarioBuilder()
            .withAttacker(attacker)
            .withDefender(defender)
            .addAlly(ally)
            .execute();
        const snapshot = RegressionTestHelper.extractCombatSnapshot(result);
        expect(snapshot.atkUnit_normalAttackDamage).toBe(17);
        expect(snapshot.defUnit_normalAttackDamage).toBe(0);
        expect(snapshot.atkUnit_totalAttackCount).toBe(2);
        expect(snapshot.atkRestHp).toBe(50);
        expect(snapshot.defRestHp).toBe(50);
    });

    test(`${getSkillName(PassiveA.AtkSpdAirspace)}: no ally nearby and foe initiates - skill does NOT activate`, () => {
        const unit = UnitBuilder.createDummy(UnitGroupType.Enemy)
            .withPassiveA(PassiveA.AtkSpdAirspace)
            .build();
        const attacker = UnitBuilder.createDummy(UnitGroupType.Ally)
            .build();
        const result = new BattleScenarioBuilder()
            .withAttacker(attacker)
            .withDefender(unit)
            .execute();
        const snapshot = RegressionTestHelper.extractCombatSnapshot(result);
        expect(snapshot.atkUnit_normalAttackDamage).toBe(0);
        expect(snapshot.defUnit_normalAttackDamage).toBe(0);
        expect(snapshot.atkUnit_totalAttackCount).toBe(1);
        expect(snapshot.atkRestHp).toBe(50);
        expect(snapshot.defRestHp).toBe(50);
    });
});
