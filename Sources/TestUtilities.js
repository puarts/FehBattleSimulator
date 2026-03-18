function test_createDefaultSkillInfo() {
    return new SkillInfo(
        "", "", 16, 2, 0, 0, 0, 0, 0, [], [], 0, 1, 1, false, false,
        16, false, false, AssistType.None, true, 0, WeaponType.Sword,
        300, true, [], [], false, false
    );
}
/**
 * @param  {UnitGroupType} groupId=UnitGroupType.Ally
 * @returns {Unit}
 */
function test_createDefaultUnit(groupId = UnitGroupType.Ally) {
    let unit = new Unit("", "テストユニット", groupId);
    unit.placedTile = new Tile(0, 0);
    unit.maxHpWithSkills = 40;
    unit.hp = unit.maxHpWithSkills;
    unit.weapon = Weapon.SilverSwordPlus;
    unit.weaponInfo = test_createDefaultSkillInfo();
    unit.weaponType = WeaponType.Sword;
    unit.moveType = MoveType.Infantry;
    unit.atkWithSkills = 40;
    unit.spdWithSkills = 40;
    unit.defWithSkills = 30;
    unit.resWithSkills = 30;
    unit.saveCurrentHpAndSpecialCount();
    return unit;
}

class test_HeroDatabase extends HeroDatabase {
    constructor(inputHeroInfos, weapons, supports, specials, passiveAs, passiveBs, passiveCs, passiveSs, passiveXs) {
        super(inputHeroInfos);
        this.skillDatabase = new SkillDatabase();
        this.skillDatabase.registerSkillOptions(weapons, supports, specials, passiveAs, passiveBs, passiveCs, passiveSs, passiveXs);
    }
    /**
     * @param  {String} heroName
     * @param  {UnitGroupType} groupId=UnitGroupType.Ally
     * @returns {Unit}
     */
    createUnit(heroName, groupId = UnitGroupType.Ally) {
        let unit = test_createDefaultUnit(groupId);
        this.initUnit(unit, heroName);
        return unit;
    }
    /**
     * @param  {Unit} unit
     * @param  {string} heroName
     */
    initUnit(unit, heroName) {
        let heroInfo = this.findInfo(heroName);
        unit.initByHeroInfo(heroInfo);

        unit.level = 40;
        unit.merge = 0;
        unit.dragonflower = 0;
        unit.initializeSkillsToDefault();
        this.skillDatabase.updateUnitSkillInfo(unit);
        unit.setMoveCountFromMoveType();
        unit.isBonusChar = false;
        if (!unit.heroInfo.isResplendent) {
            unit.isResplendent = true;
        }

        unit.updateStatusBySkillsAndMerges(true);

        unit.resetMaxSpecialCount();
        unit.specialCount = unit.maxSpecialCount;
        unit.hp = unit.maxHpWithSkills;
    }

    updateUnitSkillInfo(unit) {
        this.skillDatabase.updateUnitSkillInfo(unit);
        unit.resetMaxSpecialCount();
        unit.specialCount = unit.maxSpecialCount;
    }
}

class test_BeginningOfTurnSkillHandler {
    constructor() {
        this.unitManager = new UnitManager();
        this.map = new BattleMap("");
        this.battleContext = new GlobalBattleContext();
        this._beginningOfTurnSkillHandler = new BeginningOfTurnSkillHandler(
            this.unitManager,
            this.map,
            this.battleContext,
            new SimpleLogger(),
            st => { }
        );
    }

    /**
     * @param {Unit} unit
     */
    applySkillsForBeginningOfTurn(unit) {
        this._beginningOfTurnSkillHandler.applySkillsForBeginningOfTurn(unit);
        this._beginningOfTurnSkillHandler.applyHpSkillsForBeginningOfTurn(unit);
        unit.applyReservedState(true);
        this._beginningOfTurnSkillHandler.applyReservedStateForAllUnitsOnMap();
        this._beginningOfTurnSkillHandler.applyReservedHpForAllUnitsOnMap();
    }
}

/// テスト用のダメージ計算機です。
class test_DamageCalculator {
    constructor() {
        this.unitManager = new UnitManager();
        this.map = new BattleMap("");
        this.battleContext = new GlobalBattleContext();
        this.damageCalc = new DamageCalculatorWrapper(
            this.unitManager,
            this.map,
            this.battleContext,
            new SimpleLogger()
        );
    }

    updateAllUnitSpur() {
        this.damageCalc.updateAllUnitSpur();
    }

    get isLogEnabled() {
        return this.damageCalc.isLogEnabled;
    }

    set isLogEnabled(value) {
        this.damageCalc.isLogEnabled = value;
    }

    disableProfile() {
        this.damageCalc.profiler.isEnabled = false;
    }

    getProfileLog() {
        let log = "";
        for (let name in this.damageCalc.profiler.elaspedMilliseconds) {
            let ms = this.damageCalc.profiler.elaspedMilliseconds[name];
            log += `${name}: ${ms} ms\n`;
        }
        return log;
    }

    calcDamage(atkUnit, defUnit, applyResultToHp = true) {
        this.damageCalc.isLogEnabled = this.isLogEnabled;
        this.damageCalc.updateUnitSpur(atkUnit, defUnit);
        this.damageCalc.updateUnitSpur(defUnit, atkUnit);
        let result = this.damageCalc.calcDamage(atkUnit, defUnit, null, DamageType.EstimatedDamage);
        if (this.isLogEnabled) {
            console.log(this.damageCalc.log);
        }
        this.damageCalc.clearLog();
        if (applyResultToHp) {
            atkUnit.hp = atkUnit.restHp;
            defUnit.hp = defUnit.restHp;
        }
        return result;
    }
}

function test_calcDamageWithUnits(atkUnit, defUnit, additionalUnits, isLogEnabled = false) {
    let calclator = new test_DamageCalculator();
    calclator.unitManager.units = [atkUnit, defUnit, ...additionalUnits];
    calclator.isLogEnabled = isLogEnabled;
    return calclator.calcDamage(atkUnit, defUnit);
}

function test_calcDamage(atkUnit, defUnit, isLogEnabled = false) {
    let calclator = new test_DamageCalculator();
    g_appData = calclator.unitManager;
    calclator.isLogEnabled = isLogEnabled;
    return calclator.calcDamage(atkUnit, defUnit);
}

class UnitBuilder {
    constructor() {
        this._unit = null;
    }

    static fromHero(heroName, groupId = UnitGroupType.Ally) {
        let builder = new UnitBuilder();
        builder._unit = g_testHeroDatabase.createUnit(heroName, groupId);
        return builder;
    }

    static default(groupId = UnitGroupType.Ally) {
        let builder = new UnitBuilder();
        builder._unit = test_createDefaultUnit(groupId);
        return builder;
    }

    static createDummy(groupId = UnitGroupType.Ally, { hp = 50, atk = 50, spd = 50, def = 50, res = 50 } = {}) {
        let builder = new UnitBuilder();
        builder._unit = test_createDefaultUnit(groupId);
        builder._unit.maxHpWithSkills = hp;
        builder._unit.hp = hp;
        builder._unit.atkWithSkills = atk;
        builder._unit.spdWithSkills = spd;
        builder._unit.defWithSkills = def;
        builder._unit.resWithSkills = res;
        builder._unit.saveCurrentHpAndSpecialCount();
        return builder;
    }

    withStats({ hp, atk, spd, def, res } = {}) {
        if (hp !== undefined) { this._unit.maxHpWithSkills = hp; this._unit.hp = hp; }
        if (atk !== undefined) { this._unit.atkWithSkills = atk; }
        if (spd !== undefined) { this._unit.spdWithSkills = spd; }
        if (def !== undefined) { this._unit.defWithSkills = def; }
        if (res !== undefined) { this._unit.resWithSkills = res; }
        return this;
    }

    withHp(value) { this._unit.maxHpWithSkills = value; this._unit.hp = value; return this; }
    withAtk(value) { this._unit.atkWithSkills = value; return this; }
    withSpd(value) { this._unit.spdWithSkills = value; return this; }
    withDef(value) { this._unit.defWithSkills = value; return this; }
    withRes(value) { this._unit.resWithSkills = value; return this; }

    withWeapon(weaponId) {
        this._unit.weapon = weaponId;
        g_testHeroDatabase.updateUnitSkillInfo(this._unit);
        return this;
    }

    withSupport(supportId) {
        this._unit.support = supportId;
        g_testHeroDatabase.updateUnitSkillInfo(this._unit);
        return this;
    }

    withSpecial(specialId) {
        this._unit.special = specialId;
        g_testHeroDatabase.updateUnitSkillInfo(this._unit);
        return this;
    }

    withPassiveA(passiveAId) {
        this._unit.passiveA = passiveAId;
        g_testHeroDatabase.updateUnitSkillInfo(this._unit);
        return this;
    }

    withPassiveB(passiveBId) {
        this._unit.passiveB = passiveBId;
        g_testHeroDatabase.updateUnitSkillInfo(this._unit);
        return this;
    }

    withPassiveC(passiveCId) {
        this._unit.passiveC = passiveCId;
        g_testHeroDatabase.updateUnitSkillInfo(this._unit);
        return this;
    }

    withPassiveS(passiveSId) {
        this._unit.passiveS = passiveSId;
        g_testHeroDatabase.updateUnitSkillInfo(this._unit);
        return this;
    }

    withPassiveX(passiveXId) {
        this._unit.passiveX = passiveXId;
        g_testHeroDatabase.updateUnitSkillInfo(this._unit);
        return this;
    }

    atPosition(x, y) {
        this._unit.placedTile.posX = x;
        this._unit.placedTile.posY = y;
        return this;
    }

    withHpPercent(percent) {
        this._unit.hp = Math.floor(this._unit.maxHpWithSkills * percent / 100);
        return this;
    }

    withSpecialCount(count) {
        this._unit.specialCount = count;
        return this;
    }

    withBonuses({ atk, spd, def, res } = {}) {
        if (atk !== undefined) { this._unit.atkBuff = atk; }
        if (spd !== undefined) { this._unit.spdBuff = spd; }
        if (def !== undefined) { this._unit.defBuff = def; }
        if (res !== undefined) { this._unit.resBuff = res; }
        return this;
    }

    withPenalties({ atk, spd, def, res } = {}) {
        if (atk !== undefined) { this._unit.atkDebuff = atk; }
        if (spd !== undefined) { this._unit.spdDebuff = spd; }
        if (def !== undefined) { this._unit.defDebuff = def; }
        if (res !== undefined) { this._unit.resDebuff = res; }
        return this;
    }

    build() {
        this._unit.saveCurrentHpAndSpecialCount();
        return this._unit;
    }
}

function resetGlobalTestState() {
    g_appData = new UnitManager();
}

class RegressionTestHelper {
    static extractCombatSnapshot(combatResult) {
        return {
            atkUnit_normalAttackDamage: combatResult.atkUnit_normalAttackDamage,
            defUnit_normalAttackDamage: combatResult.defUnit_normalAttackDamage,
            atkUnit_atk: combatResult.atkUnit_atk,
            defUnit_def: combatResult.defUnit_def,
            atkRestHp: combatResult.atkRestHp,
            defRestHp: combatResult.defRestHp,
            atkUnit_totalAttackCount: combatResult.atkUnit_totalAttackCount,
            defUnit_totalAttackCount: combatResult.defUnit_totalAttackCount,
            preCombatDamage: combatResult.preCombatDamage,
        };
    }

    static extractUnitSnapshot(unit) {
        return {
            hp: unit.hp,
            maxHpWithSkills: unit.maxHpWithSkills,
            atkWithSkills: unit.atkWithSkills,
            spdWithSkills: unit.spdWithSkills,
            defWithSkills: unit.defWithSkills,
            resWithSkills: unit.resWithSkills,
            atkBuff: unit.atkBuff,
            spdBuff: unit.spdBuff,
            defBuff: unit.defBuff,
            resBuff: unit.resBuff,
            atkDebuff: unit.atkDebuff,
            spdDebuff: unit.spdDebuff,
            defDebuff: unit.defDebuff,
            resDebuff: unit.resDebuff,
            specialCount: unit.specialCount,
            posX: unit.placedTile ? unit.placedTile.posX : null,
            posY: unit.placedTile ? unit.placedTile.posY : null,
        };
    }
}

function test_executeTest(testFunc, isTestTimeLogEnabled = false) {
    let log = "";
    using_(new ScopedStopwatch(x => {
        if (isTestTimeLogEnabled) {
            console.log(`${expect.getState().currentTestName}の実行時間: ${x} ms`);
        }
    }), () => {
        let testLog = testFunc();
        if (testLog != null) {
            log += testLog;
        }
    });
    if (log != "") {
        console.log(log);
    }
}