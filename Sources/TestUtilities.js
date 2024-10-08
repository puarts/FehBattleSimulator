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
        let result = this.damageCalc.calcDamage(atkUnit, defUnit, null);
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