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
        this._unit._hasExplicitPosition = true;
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

    // ---- ゴールデンマスター用のフルスナップショット ----
    // 既存の extractCombatSnapshot（9フィールド）はそのまま残し、
    // 言語非依存の正解データ用に戦闘結果＋撃ごとの中間値まで広く取り出す。

    /**
     * 1撃分（StrikeResult）からプリミティブのみを抽出する。
     * atkUnit はオブジェクト参照なので含めず、攻撃側かどうかのフラグに正規化する。
     * @param {StrikeResult} strike
     * @param {Unit} atkUnit 戦闘の攻撃側ユニット
     */
    static extractStrikeSnapshot(strike, atkUnit) {
        return {
            strikeCount: strike.currentStrikeCount ?? null,
            byAttacker: strike.atkUnit === atkUnit,
            damage: strike.damage ?? null,
            specialDamage: strike.specialDamage ?? null,
            damageDealt: strike.damageDealt ?? null,
            actualDamage: strike.actualDamage ?? null,
            additionalDamage: strike.additionalDamage ?? null,
            specialAdditionalDamage: strike.specialAdditionalDamage ?? null,
            isAttackerSpecialActive: strike.isAttackerSpecialActive ?? null,
            isDefenderSpecialActive: strike.isDefenderSpecialActive ?? null,
            isAttackerSpecialReady: strike.isAttackerSpecialReady ?? null,
            isDefenderSpecialReady: strike.isDefenderSpecialReady ?? null,
            damageRatio: strike.damageRatio ?? null,
            potentRatio: strike.potentRatio ?? null,
            damageReductionRatio: strike.damageReductionRatio ?? null,
            damageReductionRatios: Array.isArray(strike.damageReductionRatios)
                ? [...strike.damageReductionRatios] : [],
            damageReductionValue: strike.damageReductionValue ?? null,
            reducedDamage: strike.reducedDamage ?? null,
            isMiracleActivated: strike.isMiracleActivated ?? null,
            reducesDamageFromFoeToZeroDuringCombat:
                strike.reducesDamageFromFoeToZeroDuringCombat ?? null,
        };
    }

    /**
     * 戦闘1回（CombatResult）から、言語非依存の正解データを抽出する。
     * combatSummary（最終結果）＋ strikes[]（撃ごとの順序つき中間値）の2層。
     * オブジェクト参照（atkTile / skillLogger / damageCalcEnv 等）は含めない。
     * @param {CombatResult} result
     */
    static extractFullCombatSnapshot(result) {
        const atkUnit = result.atkUnit;
        const strikeSource = result.damageHistory || [];
        const strikes = strikeSource.map(
            s => RegressionTestHelper.extractStrikeSnapshot(s, atkUnit));
        return {
            combatSummary: {
                atkUnit_totalAttackCount: result.atkUnit_totalAttackCount,
                defUnit_totalAttackCount: result.defUnit_totalAttackCount,
                atkUnit_actualTotalAttackCount: result.atkUnit_actualTotalAttackCount,
                defUnit_actualTotalAttackCount: result.defUnit_actualTotalAttackCount,
                atkUnit_normalAttackDamage: result.atkUnit_normalAttackDamage,
                defUnit_normalAttackDamage: result.defUnit_normalAttackDamage,
                atkUnit_specialAttackDamage: result.atkUnit_specialAttackDamage,
                defUnit_specialAttackDamage: result.defUnit_specialAttackDamage,
                atkUnit_specialCount: result.atkUnit_specialCount,
                defUnit_specialCount: result.defUnit_specialCount,
                atkUnit_atk: result.atkUnit_atk,
                atkUnit_spd: result.atkUnit_spd,
                atkUnit_def: result.atkUnit_def,
                atkUnit_res: result.atkUnit_res,
                defUnit_atk: result.defUnit_atk,
                defUnit_spd: result.defUnit_spd,
                defUnit_def: result.defUnit_def,
                defUnit_res: result.defUnit_res,
                atkUnitFollowUpPriorityInc: result.atkUnitFollowUpPriorityInc,
                atkUnitFollowUpPriorityDec: result.atkUnitFollowUpPriorityDec,
                defUnitFollowUpPriorityInc: result.defUnitFollowUpPriorityInc,
                defUnitFollowUpPriorityDec: result.defUnitFollowUpPriorityDec,
                preCombatDamage: result.preCombatDamage,
                preCombatDamageWithOverkill: result.preCombatDamageWithOverkill,
                wasPrecombatSpecialActivated: result.wasPrecombatSpecialActivated,
                atkUnitDamageToEnemyAfterBeginningOfCombat:
                    result.atkUnitDamageToEnemyAfterBeginningOfCombat,
                defUnitDamageToEnemyAfterBeginningOfCombat:
                    result.defUnitDamageToEnemyAfterBeginningOfCombat,
                atkRestHp: result.atkRestHp,
                defRestHp: result.defRestHp,
                atkMaxHp: result.atkMaxHp ?? null,
                defMaxHp: result.defMaxHp ?? null,
                isAlreadyDead: result.isAlreadyDead ?? null,
            },
            strikes,
        };
    }
}

class BattleScenarioBuilder {
    constructor() {
        this._attacker = null;
        this._defender = null;
        this._allies = [];
        this._foes = [];
        this._turn = 1;
    }

    withAttacker(unit) {
        this._attacker = unit;
        return this;
    }

    withDefender(unit) {
        this._defender = unit;
        return this;
    }

    addAlly(unit) {
        this._allies.push(unit);
        return this;
    }

    addFoe(unit) {
        this._foes.push(unit);
        return this;
    }

    onTurn(turnNumber) {
        this._turn = turnNumber;
        return this;
    }

    _autoPlaceUnits() {
        let allyUnits = [this._attacker, ...this._allies];
        let enemyUnits = [this._defender, ...this._foes];
        let occupied = new Set();

        // Collect already-positioned units
        for (let unit of [...allyUnits, ...enemyUnits]) {
            if (unit._hasExplicitPosition) {
                occupied.add(`${unit.placedTile.posX},${unit.placedTile.posY}`);
            }
        }

        // Auto-place attacker in column 0 if not explicitly positioned
        if (this._attacker && !this._attacker._hasExplicitPosition) {
            let pos = this._findFreePosition(0, occupied);
            this._attacker.placedTile.posX = pos[0];
            this._attacker.placedTile.posY = pos[1];
            occupied.add(`${pos[0]},${pos[1]}`);
        }

        // Auto-place defender at attacker's attack range
        let defenderCol = this._attacker ? (this._attacker.attackRange || 1) : 1;
        if (this._defender && !this._defender._hasExplicitPosition) {
            let pos = this._findFreePosition(defenderCol, occupied);
            this._defender.placedTile.posX = pos[0];
            this._defender.placedTile.posY = pos[1];
            occupied.add(`${pos[0]},${pos[1]}`);
        }

        // Auto-place remaining allies along column 0
        for (let ally of this._allies) {
            if (!ally._hasExplicitPosition) {
                let pos = this._findFreePosition(0, occupied);
                ally.placedTile.posX = pos[0];
                ally.placedTile.posY = pos[1];
                occupied.add(`${pos[0]},${pos[1]}`);
            }
        }

        // Auto-place remaining foes along defender column
        for (let foe of this._foes) {
            if (!foe._hasExplicitPosition) {
                let pos = this._findFreePosition(defenderCol, occupied);
                foe.placedTile.posX = pos[0];
                foe.placedTile.posY = pos[1];
                occupied.add(`${pos[0]},${pos[1]}`);
            }
        }
    }

    _findFreePosition(col, occupied) {
        for (let row = 0; row < 100; row++) {
            let key = `${col},${row}`;
            if (!occupied.has(key)) {
                return [col, row];
            }
        }
        return [col, 0];
    }

    execute() {
        if (!this._attacker || !this._defender) {
            throw new Error('BattleScenarioBuilder requires both attacker and defender');
        }

        this._autoPlaceUnits();

        let calculator = new test_DamageCalculator();
        calculator.unitManager.units = [this._attacker, this._defender, ...this._allies, ...this._foes];
        g_appData = calculator.unitManager;
        calculator.battleContext.currentTurn = this._turn;
        calculator.updateAllUnitSpur();
        let result = calculator.calcDamage(this._attacker, this._defender);
        resetGlobalTestState();
        return result;
    }

    executeBeginningOfTurn() {
        this._autoPlaceUnits();

        let handler = new test_BeginningOfTurnSkillHandler();
        let allUnits = [this._attacker, this._defender, ...this._allies, ...this._foes].filter(u => u != null);
        handler.unitManager.units = allUnits;
        g_appData = handler.unitManager;
        handler.battleContext.currentTurn = this._turn;
        for (let unit of allUnits) {
            handler.applySkillsForBeginningOfTurn(unit);
        }
        resetGlobalTestState();
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

// ===== ゴールデンマスター: 機械可読シナリオの組み立て・実行・照合 =====
// 生成（GoldenMaster）と検証（GoldenConformance）で同一の組み立てを共有することで、
// 「保存済みベクタを現エンジンで再現できるか」を厳密に照合できるようにする。
class GoldenScenario {
    /**
     * 機械可読の unitSpec から Unit を組み立てる。
     * spec 形: { group:'ally'|'enemy', stats:{hp,atk,spd,def,res}, skills:{weapon,special,passiveA..X,support},
     *           bonuses, penalties, pos:[x,y], hpPercent, specialCount }
     */
    static buildUnit(spec) {
        const group = spec.group === 'enemy' ? UnitGroupType.Enemy : UnitGroupType.Ally;
        const s = spec.stats || {};
        let b = UnitBuilder.createDummy(group, {
            hp: s.hp ?? 50, atk: s.atk ?? 50, spd: s.spd ?? 50, def: s.def ?? 50, res: s.res ?? 50,
        });
        const sk = spec.skills || {};
        if (sk.weapon != null) b = b.withWeapon(sk.weapon);
        if (sk.support != null) b = b.withSupport(sk.support);
        if (sk.special != null) b = b.withSpecial(sk.special);
        if (sk.passiveA != null) b = b.withPassiveA(sk.passiveA);
        if (sk.passiveB != null) b = b.withPassiveB(sk.passiveB);
        if (sk.passiveC != null) b = b.withPassiveC(sk.passiveC);
        if (sk.passiveS != null) b = b.withPassiveS(sk.passiveS);
        if (sk.passiveX != null) b = b.withPassiveX(sk.passiveX);
        if (spec.bonuses) b = b.withBonuses(spec.bonuses);
        if (spec.penalties) b = b.withPenalties(spec.penalties);
        if (spec.pos) b = b.atPosition(spec.pos[0], spec.pos[1]);
        if (spec.hpPercent != null) b = b.withHpPercent(spec.hpPercent);
        if (spec.specialCount != null) b = b.withSpecialCount(spec.specialCount);
        return b.build();
    }

    /**
     * シナリオspec を実行し、フルスナップショットを返す。
     * spec 形: { attacker, defender, allies:[], foes:[], turn }
     */
    static run(spec) {
        resetGlobalTestState();
        const attacker = GoldenScenario.buildUnit(spec.attacker);
        const defender = GoldenScenario.buildUnit(spec.defender);
        const sb = new BattleScenarioBuilder().withAttacker(attacker).withDefender(defender);
        for (const a of (spec.allies || [])) sb.addAlly(GoldenScenario.buildUnit(a));
        for (const f of (spec.foes || [])) sb.addFoe(GoldenScenario.buildUnit(f));
        if (spec.turn != null) sb.onTurn(spec.turn);
        const result = sb.execute();
        return RegressionTestHelper.extractFullCombatSnapshot(result);
    }

    /**
     * 期待値と実測値を許容誤差つきで再帰比較し、差分の配列を返す（空なら一致）。
     * 数値は tol 以内で一致とみなす（Rust f64 等とのズレ対策）。
     */
    static compare(expected, actual, tol = 1e-9) {
        const diffs = [];
        GoldenScenario._cmp(expected, actual, '', tol, diffs);
        return diffs;
    }

    static _cmp(exp, act, p, tol, diffs) {
        if (exp === null || exp === undefined) {
            if (act !== exp) diffs.push({ path: p, expected: exp, actual: act });
            return;
        }
        if (typeof exp === 'number') {
            if (typeof act !== 'number' || Math.abs(exp - act) > tol) {
                diffs.push({ path: p, expected: exp, actual: act });
            }
            return;
        }
        if (typeof exp === 'boolean' || typeof exp === 'string') {
            if (exp !== act) diffs.push({ path: p, expected: exp, actual: act });
            return;
        }
        if (Array.isArray(exp)) {
            if (!Array.isArray(act) || act.length !== exp.length) {
                diffs.push({
                    path: p,
                    expected: `array(${exp.length})`,
                    actual: Array.isArray(act) ? `array(${act.length})` : typeof act,
                });
                return;
            }
            for (let i = 0; i < exp.length; i++) {
                GoldenScenario._cmp(exp[i], act[i], `${p}[${i}]`, tol, diffs);
            }
            return;
        }
        // object
        if (typeof act !== 'object' || act === null) {
            diffs.push({ path: p, expected: 'object', actual: act });
            return;
        }
        for (const k of Object.keys(exp)) {
            GoldenScenario._cmp(exp[k], act[k], p ? `${p}.${k}` : k, tol, diffs);
        }
    }
}