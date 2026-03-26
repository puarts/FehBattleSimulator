import { UnitGroupType } from '../Sources/UnitConstants.js';
import { Weapon, PassiveC } from '../Sources/SkillConstants.js';
import { UnitBuilder, BattleScenarioBuilder, RegressionTestHelper, resetGlobalTestState, test_calcDamage } from '../Sources/TestUtilities.js';
import { UnitManager } from '../Sources/UnitManager.js';
import { g_appData, setAppData } from '../Sources/AppDataGlobal.js';
import './TestGlobals.js';

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
        setAppData({ dummy: true });
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

describe('BattleScenarioBuilder', () => {
    beforeEach(() => {
        resetGlobalTestState();
    });

    test('withAttacker(unit).withDefender(unit).execute() returns a combat result', () => {
        let attacker = UnitBuilder.createDummy(UnitGroupType.Ally).build();
        let defender = UnitBuilder.createDummy(UnitGroupType.Enemy).build();
        let result = new BattleScenarioBuilder()
            .withAttacker(attacker)
            .withDefender(defender)
            .execute();
        expect(result).toBeDefined();
        expect(typeof result.atkUnit_normalAttackDamage).toBe('number');
    });

    test('addAlly(unit) registers an ally unit in the battle', () => {
        let attacker = UnitBuilder.createDummy(UnitGroupType.Ally, { atk: 55 }).build();
        let defender = UnitBuilder.createDummy(UnitGroupType.Enemy, { def: 30 }).build();
        let resultWithoutAlly = new BattleScenarioBuilder()
            .withAttacker(attacker)
            .withDefender(defender)
            .execute();

        // Reset units for second run
        attacker = UnitBuilder.createDummy(UnitGroupType.Ally, { atk: 55 }).build();
        defender = UnitBuilder.createDummy(UnitGroupType.Enemy, { def: 30 }).build();
        // SpurAtk3 adds +4 atk spur when adjacent
        let ally = UnitBuilder.createDummy(UnitGroupType.Ally)
            .withPassiveC(PassiveC.SpurAtk3)
            .atPosition(0, 0)
            .build();
        let resultWithAlly = new BattleScenarioBuilder()
            .withAttacker(attacker)
            .withDefender(defender)
            .addAlly(ally)
            .execute();
        // Spur Atk 3 should increase attacker's damage
        expect(resultWithAlly.atkUnit_normalAttackDamage).toBeGreaterThan(resultWithoutAlly.atkUnit_normalAttackDamage);
    });

    test('addFoe(unit) registers an enemy unit in the battle', () => {
        let attacker = UnitBuilder.createDummy(UnitGroupType.Ally).build();
        let defender = UnitBuilder.createDummy(UnitGroupType.Enemy, { def: 40 }).build();
        let foe = UnitBuilder.createDummy(UnitGroupType.Enemy)
            .withPassiveC(PassiveC.SpurDef3)
            .atPosition(5, 0)
            .build();
        let resultWithoutFoe = new BattleScenarioBuilder()
            .withAttacker(attacker)
            .withDefender(defender)
            .execute();

        attacker = UnitBuilder.createDummy(UnitGroupType.Ally).build();
        defender = UnitBuilder.createDummy(UnitGroupType.Enemy, { def: 40 }).build();
        foe = UnitBuilder.createDummy(UnitGroupType.Enemy)
            .withPassiveC(PassiveC.SpurDef3)
            .atPosition(5, 0)
            .build();
        let resultWithFoe = new BattleScenarioBuilder()
            .withAttacker(attacker)
            .withDefender(defender)
            .addFoe(foe)
            .execute();
        // Spur Def 3 should reduce attacker's damage to defender
        expect(resultWithFoe.atkUnit_normalAttackDamage).toBeLessThan(resultWithoutFoe.atkUnit_normalAttackDamage);
    });

    test('onTurn(3) sets the turn number correctly', () => {
        let attacker = UnitBuilder.createDummy(UnitGroupType.Ally).build();
        let defender = UnitBuilder.createDummy(UnitGroupType.Enemy).build();
        let builder = new BattleScenarioBuilder()
            .withAttacker(attacker)
            .withDefender(defender)
            .onTurn(3);
        // Access internal state to verify turn is stored
        expect(builder._turn).toBe(3);
        let result = builder.execute();
        expect(result).toBeDefined();
    });

    test('executeBeginningOfTurn() runs beginning-of-turn processing', () => {
        // 伝承リリーナの武器は、ターン開始時に奥義カウント-1の効果を持つ
        let unit = UnitBuilder.fromHero('伝承リリーナ').build();
        expect(unit.specialCount).toBe(1);
        let builder = new BattleScenarioBuilder()
            .withAttacker(unit)
            .withDefender(UnitBuilder.createDummy(UnitGroupType.Enemy).build());
        builder.executeBeginningOfTurn();
        expect(unit.specialCount).toBe(0);
    });

    test('units without explicit positions are auto-placed without overlap', () => {
        let attacker = UnitBuilder.createDummy(UnitGroupType.Ally).build();
        let defender = UnitBuilder.createDummy(UnitGroupType.Enemy).build();
        let ally1 = UnitBuilder.createDummy(UnitGroupType.Ally).build();
        let ally2 = UnitBuilder.createDummy(UnitGroupType.Ally).build();
        let foe1 = UnitBuilder.createDummy(UnitGroupType.Enemy).build();
        let foe2 = UnitBuilder.createDummy(UnitGroupType.Enemy).build();
        new BattleScenarioBuilder()
            .withAttacker(attacker)
            .withDefender(defender)
            .addAlly(ally1)
            .addAlly(ally2)
            .addFoe(foe1)
            .addFoe(foe2)
            .execute();
        // Collect all positions
        let positions = [attacker, defender, ally1, ally2, foe1, foe2].map(
            u => `${u.placedTile.posX},${u.placedTile.posY}`
        );
        let uniquePositions = new Set(positions);
        expect(uniquePositions.size).toBe(positions.length);
    });

    test('execute() cleans up global state afterward', () => {
        let atk1 = UnitBuilder.createDummy(UnitGroupType.Ally).build();
        let def1 = UnitBuilder.createDummy(UnitGroupType.Enemy).build();
        let prevAppData = g_appData;
        new BattleScenarioBuilder()
            .withAttacker(atk1)
            .withDefender(def1)
            .execute();
        // g_appData should be reset after execute (not the calculator's unitManager)
        expect(g_appData).toBeInstanceOf(UnitManager);
        expect(g_appData).not.toBe(prevAppData);

        // Second scenario should work independently
        let atk2 = UnitBuilder.createDummy(UnitGroupType.Ally).build();
        let def2 = UnitBuilder.createDummy(UnitGroupType.Enemy).build();
        let result = new BattleScenarioBuilder()
            .withAttacker(atk2)
            .withDefender(def2)
            .execute();
        expect(result).toBeDefined();
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
