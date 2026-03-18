describe('UnitBuilder', () => {
    test('fromHero creates a valid unit from hero name', () => {
        let unit = UnitBuilder.fromHero('マルス').build();
        expect(unit).not.toBeNull();
        expect(unit.heroInfo).not.toBeNull();
        expect(unit.weapon).not.toBe(0);
    });

    test('default creates a default unit', () => {
        let unit = UnitBuilder.default().build();
        expect(unit).not.toBeNull();
        expect(unit.maxHpWithSkills).toBe(40);
        expect(unit.atkWithSkills).toBe(40);
        expect(unit.spdWithSkills).toBe(40);
        expect(unit.defWithSkills).toBe(30);
        expect(unit.resWithSkills).toBe(30);
    });

    test('createDummy creates a unit with all stats at 50', () => {
        let unit = UnitBuilder.createDummy(UnitGroupType.Ally).build();
        expect(unit.maxHpWithSkills).toBe(50);
        expect(unit.hp).toBe(50);
        expect(unit.atkWithSkills).toBe(50);
        expect(unit.spdWithSkills).toBe(50);
        expect(unit.defWithSkills).toBe(50);
        expect(unit.resWithSkills).toBe(50);
    });

    test('createDummy with custom stats', () => {
        let unit = UnitBuilder.createDummy(UnitGroupType.Ally, { hp: 99, atk: 60, spd: 40, def: 30, res: 20 }).build();
        expect(unit.maxHpWithSkills).toBe(99);
        expect(unit.hp).toBe(99);
        expect(unit.atkWithSkills).toBe(60);
        expect(unit.spdWithSkills).toBe(40);
        expect(unit.defWithSkills).toBe(30);
        expect(unit.resWithSkills).toBe(20);
    });

    test('withWeapon recalculates stats after setting skill', () => {
        let unit = UnitBuilder.fromHero('マルス').withWeapon(Weapon.SilverSwordPlus).build();
        expect(unit.weapon).toBe(Weapon.SilverSwordPlus);
    });

    test('withStats overrides stats', () => {
        let unit = UnitBuilder.default().withStats({ atk: 99 }).build();
        expect(unit.atkWithSkills).toBe(99);
        // 未指定のステータスは変更されない
        expect(unit.spdWithSkills).toBe(40);
    });

    test('withHpPercent sets HP to percentage of max HP', () => {
        let unit = UnitBuilder.createDummy(UnitGroupType.Ally, { hp: 40 }).withHpPercent(50).build();
        expect(unit.hp).toBe(Math.floor(unit.maxHpWithSkills * 50 / 100));
    });

    test('withSpecialCount sets special count', () => {
        let unit = UnitBuilder.fromHero('マルス').withSpecialCount(0).build();
        expect(unit.specialCount).toBe(0);
    });

    test('withBonuses applies buffs', () => {
        let unit = UnitBuilder.createDummy().withBonuses({ atk: 6 }).build();
        expect(unit.atkBuff).toBe(6);
    });

    test('withPenalties applies debuffs', () => {
        let unit = UnitBuilder.createDummy().withPenalties({ spd: -7 }).build();
        expect(unit.spdDebuff).toBe(-7);
    });

    test('atPosition sets tile position', () => {
        let unit = UnitBuilder.createDummy().atPosition(3, 4).build();
        expect(unit.placedTile.posX).toBe(3);
        expect(unit.placedTile.posY).toBe(4);
    });

    test('method chaining works correctly', () => {
        let unit = UnitBuilder.fromHero('マルス')
            .withWeapon(Weapon.SilverSwordPlus)
            .withStats({ atk: 50 })
            .atPosition(1, 2)
            .build();
        expect(unit.weapon).toBe(Weapon.SilverSwordPlus);
        expect(unit.atkWithSkills).toBe(50);
        expect(unit.placedTile.posX).toBe(1);
        expect(unit.placedTile.posY).toBe(2);
    });
});

describe('Global state management', () => {
    test('resetGlobalTestState resets g_appData to clean UnitManager', () => {
        g_appData = { dummy: true };
        resetGlobalTestState();
        expect(g_appData).toBeInstanceOf(UnitManager);
    });

    test('separate execute calls do not leak state', () => {
        let atk = UnitBuilder.createDummy(UnitGroupType.Ally).build();
        let def = UnitBuilder.createDummy(UnitGroupType.Enemy).build();
        let prevAppData = g_appData;
        test_calcDamage(atk, def);
        // test_calcDamage sets g_appData to its own UnitManager
        expect(g_appData).not.toBe(prevAppData);
        resetGlobalTestState();
        // After reset, g_appData is a fresh UnitManager (not the one from calcDamage)
        expect(g_appData).not.toBe(prevAppData);
        expect(g_appData).toBeInstanceOf(UnitManager);
    });
});

describe('RegressionTestHelper', () => {
    test('extractCombatSnapshot extracts key values from combat result', () => {
        let atk = UnitBuilder.createDummy(UnitGroupType.Ally).build();
        let def = UnitBuilder.createDummy(UnitGroupType.Enemy).build();
        let result = test_calcDamage(atk, def);
        let snapshot = RegressionTestHelper.extractCombatSnapshot(result);
        expect(snapshot).toHaveProperty('atkUnit_normalAttackDamage');
        expect(snapshot).toHaveProperty('defUnit_normalAttackDamage');
        expect(snapshot).toHaveProperty('atkRestHp');
        expect(snapshot).toHaveProperty('defRestHp');
    });

    test('extractUnitSnapshot extracts unit status', () => {
        let unit = UnitBuilder.createDummy().withBonuses({ atk: 6 }).build();
        let snapshot = RegressionTestHelper.extractUnitSnapshot(unit);
        expect(snapshot).toHaveProperty('hp');
        expect(snapshot).toHaveProperty('maxHpWithSkills');
        expect(snapshot).toHaveProperty('atkWithSkills');
        expect(snapshot).toHaveProperty('spdWithSkills');
        expect(snapshot).toHaveProperty('defWithSkills');
        expect(snapshot).toHaveProperty('resWithSkills');
        expect(snapshot).toHaveProperty('atkBuff');
        expect(snapshot.atkBuff).toBe(6);
        expect(snapshot).toHaveProperty('specialCount');
    });
});
