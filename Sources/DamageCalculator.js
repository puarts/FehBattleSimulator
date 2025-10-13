/// @file
/// @brief DamageCalculator クラスとそれに関連するクラスや関数等の定義です。


const GameMode = {
    AetherRaid: 0,
    Arena: 1,
    AllegianceBattles: 2,
    ResonantBattles: 3,
    TempestTrials: 4,
    PawnsOfLoki: 5,
    SummonerDuels: 6, // 英雄決闘
};

const DamageType = {
    ActualDamage: 0,
    EstimatedDamage: 1,
    PotentialDamage: 2,
};

/**
 * @abstract
 */
class DamageCalcResult {
    constructor() {
        this.atkUnit = null;
        this.defUnit = null;
        /** @type {GroupLogger<NodeEnv.SkillLogContent>} */
        this.skillLogger = new GroupLogger();
    }

    setUnits(atkUnit, defUnit) {
        this.atkUnit = atkUnit;
        this.defUnit = defUnit;
        this.atkRestHp = atkUnit.restHp;
        this.defRestHp = defUnit.restHp;
        this.atkMaxHp = atkUnit.maxHpWithSkills;
        this.defMaxHp = defUnit.maxHpWithSkills;
        return this;
    }

    setIsAlreadyDead(atkUnit, defUnit) {
        // atkUnit.isDeadでは戦闘中の死亡は判定できない
        this.isAlreadyDead = atkUnit.restHp <= 0 || defUnit.restHp <= 0;
        return this;
    }
}

/**
 * ダメージ計算結果を表すクラスです。
 */
class CombatResult extends DamageCalcResult {
    constructor() {
        super();

        /** @type {StrikeResult[]} */
        this.damageHistory = [];
        /** @type {AttackResult[]} */
        this.attackHistory = [];

        this.atkUnit_totalAttackCount = 0;
        this.defUnit_totalAttackCount = 0;

        this.atkUnit_actualTotalAttackCount = 0;
        this.defUnit_actualTotalAttackCount = 0;

        this.atkUnit_normalAttackDamage = 0;
        this.defUnit_normalAttackDamage = 0;

        this.atkUnit_specialAttackDamage = 0;
        this.defUnit_specialAttackDamage = 0;

        this.atkUnit_specialCount = 0;
        this.defUnit_specialCount = 0;

        this.atkUnit_atk = 0;
        this.atkUnit_spd = 0;
        this.atkUnit_def = 0;
        this.atkUnit_res = 0;

        this.defUnit_atk = 0;
        this.defUnit_spd = 0;
        this.defUnit_def = 0;
        this.defUnit_res = 0;

        this.atkUnitFollowUpPriorityInc = 0;
        this.atkUnitFollowUpPriorityDec = 0;
        this.defUnitFollowUpPriorityInc = 0;
        this.defUnitFollowUpPriorityDec = 0;

        this.preCombatDamage = 0;
        this.preCombatDamageWithOverkill = 0;
        this.wasPrecombatSpecialActivated = false;

        this.atkUnitDamageToEnemyAfterBeginningOfCombat = 0;
        this.defUnitDamageToEnemyAfterBeginningOfCombat = 0;

        // 護り手ユニットかそうでないかを後で区別できるよう結果に戦ったユニットを記録しておく
        this.defUnit = null;

        this.atkTile = null;
        this.defTile = null;

        this.damageCalcEnv = null;

        /** @type {AttackResult[]} */
        this.attackResults = [];

        /** @type {StrikeResult[]} */
        this.strikeResults = [];

        /** @type {GroupLogger<NodeEnv.SkillLogContent>} */
        this.beforeCombatSkillLogger = new GroupLogger();

        /** @type {GroupLogger<NodeEnv.SkillLogContent>} */
        this.skillLogger = new GroupLogger();

        /** @type {GroupLogger<NodeEnv.SkillLogContent>} */
        this.afterCombatSkillLogger = new GroupLogger();
    }

    setPreCombatDamage(damage) {
        this.preCombatDamage = damage;
        return this;
    }

    setWasPrecombatSpecialActivated(activated) {
        this.wasPrecombatSpecialActivated = activated;
        return this;
    }

    setPreCombatDamageWithOverkill(damage) {
        this.preCombatDamageWithOverkill = damage;
        return this;
    }

    setDefUnit(defUnit) {
        this.defUnit = defUnit;
        return this;
    }

    setTiles(atkUnit, defUnit) {
        this.atkTile = atkUnit.placedTile;
        this.defTile = defUnit.placedTile;
        return this;
    }

    setDamageToEnemyAfterBeginningOfCombat(targetUnit, damage) {
        if (targetUnit === this.atkUnit) {
            this.atkUnitDamageToEnemyAfterBeginningOfCombat = damage;
        } else {
            this.defUnitDamageToEnemyAfterBeginningOfCombat = damage;
        }
        return this;
    }

    setHealAfterBeginningOfCombat(targetUnit, healAmount) {
        if (targetUnit === this.atkUnit) {
            this.atkUnitHealAfterBeginningOfCombat = healAmount;
        } else {
            this.defUnitHealAfterBeginningOfCombat = healAmount;
        }
        return this;
    }

    setHpAfterBeginningOfCombat(targetUnit, hp) {
        if (targetUnit === this.atkUnit) {
            this.atkUniHpAfterBeginningOfCombat = hp;
        } else {
            this.defUnitHpAfterBeginningOfCombat = hp;
        }
        return this;
    }

    setSpecialCounts(atkUnit, defUnit) {
        this.atkUnit_specialCount = atkUnit.tmpSpecialCount;
        this.defUnit_specialCount = defUnit.tmpSpecialCount;
        return this;
    }

    initStats(atkUnit, defUnit) {
        this.atkUnit_atk = atkUnit.getAtkInCombat(defUnit);
        this.atkUnit_spd = atkUnit.getSpdInCombat(defUnit);
        this.atkUnit_def = atkUnit.getDefInCombat(defUnit);
        this.atkUnit_res = atkUnit.getResInCombat(defUnit);

        this.atkUnit_specialCount = atkUnit.specialCount;

        this.defUnit_atk = defUnit.getAtkInCombat(atkUnit);
        this.defUnit_spd = defUnit.getSpdInCombat(atkUnit);
        this.defUnit_def = defUnit.getDefInCombat(atkUnit);
        this.defUnit_res = defUnit.getResInCombat(atkUnit);

        this.defUnit_specialCount = defUnit.specialCount;
        return this;
    }

    setBuffDebuffs(atkUnit, defUnit) {
        this.atkUnitBuffDebuffs = ArrayUtil.add(atkUnit.getBuffsInCombat(defUnit), atkUnit.getDebuffsInCombat(defUnit));
        this.defUnitBuffDebuffs = ArrayUtil.add(defUnit.getBuffsInCombat(atkUnit), defUnit.getDebuffsInCombat(atkUnit));
        return this;
    }

    setSpurs(atkUnit, defUnit) {
        this.atkUnitSpurs = atkUnit.getSpurs();
        this.defSpurs = defUnit.getSpurs();
        return this;
    }

    setBuffInvalidations(atkUnit, defUnit) {
        this.atkUnitBuffInvalidations = atkUnit.battleContext.getBuffInvalidations();
        this.defUnitBuffInvalidations = defUnit.battleContext.getBuffInvalidations();
        return this;
    }

    setDebuffInvalidations(atkUnit, defUnit) {
        this.atkUnitDebuffInvalidations = atkUnit.battleContext.getDebuffInvalidations();
        this.defUnitDebuffInvalidations = defUnit.battleContext.getDebuffInvalidations();
        return this;
    }

    createAttackResult() {
        let attackResult = new AttackResult();
        this.attackResults.push(attackResult);
        return attackResult;
    }

    /**
     * @returns {AttackResult}
     */
    getCurrentAttackResult() {
        return this.attackResults[this.attackResults.length - 1];
    }

    createStrikeResult() {
        let strikeResult = new StrikeResult();
        this.strikeResults.push(strikeResult);
        let attackResult = this.getCurrentAttackResult();
        attackResult.strikeResults.push(strikeResult);
        strikeResult.attackResult = attackResult;
        strikeResult.setUnits(attackResult.atkUnit, attackResult.defUnit)
            .setIsAlreadyDead(attackResult.atkUnit, attackResult.defUnit);
        return strikeResult;
    }

    /**
     * @returns {StrikeResult}
     */
    getCurrentStrikeResult() {
        return this.strikeResults[this.strikeResults.length - 1];
    }

    hasAttacked(atkUnit) {
        return this.damageHistory.some(log => log.atkUnit === atkUnit);
    }
}

class AttackResult extends DamageCalcResult {
    constructor() {
        super();
        /** @type {StrikeResult[]} */
        this.strikeResults = [];
        this.damageReductionRatios = [];
        /**
         * 奥義ダメージ
         */
        this.specialAddDamage = 0;
        this.specialMultDamage = 1;

        /** @type {GroupLogger<NodeEnv.SkillLogContent>} */
        this.skillLogger = new GroupLogger();
    }

    /**
     * @param {DamageCalcContext} context
     * @returns {AttackResult}
     */
    setAttackType(context) {
        this.isCounterattack = context.isCounterattack;
        this.isFollowupAttack = context.isFollowupAttack;
        this.isPotentFollowupAttack = context.isPotentFollowupAttack;
        return this;
    }

    setAtk(atk, specialAtk) {
        this.atk = atk;
        this.specialAtk = specialAtk;
        return this;
    }

    setAdvantage(advantageRatio, atkAdvantageAddition, specialAtkAdvantageAddition) {
        this.advantageRatio = advantageRatio;
        this.atkAdvantageAddition = atkAdvantageAddition;
        this.specialAtkAdvantageAddition = specialAtkAdvantageAddition;
        return this;
    }

    setFinalAtk(finalAtk, specialFinalAtk) {
        this.finalAtk = finalAtk;
        this.specialFinalAtk = specialFinalAtk;
        return this;
    }

    getFinalAtk(isAttackerSpecialActive) {
        return isAttackerSpecialActive ? this.specialFinalAtk : this.finalAtk;
    }

    setSpecialAtkStat(atkStat) {
        this.specialAtkStat = atkStat;
        return this;
    }

    setAttackCount(count) {
        this.attackCount = count;
        return this;
    }

    setDefRes(def, res) {
        this.def = def;
        this.res = res;
        return this;
    }

    setMit(mit, specialMit) {
        this.mit = mit;
        this.specialMit = specialMit;
        return this;
    }

    setSpecialSufferRatio(specialSufferRatio) {
        this.specialSufferRatio = specialSufferRatio;
        return this;
    }

    setFinalMit(finalMit, specialFinalMit) {
        this.finalMit = Math.max(finalMit, 0);
        this.specialFinalMit = Math.max(specialFinalMit, 0);
        return this;
    }

    getFinalMit(isAttackerSpecialActive) {
        return isAttackerSpecialActive ? this.specialFinalMit : this.finalMit;
    }

    setAdditionalDamage(additionalDamage, specialAdditionalDamage) {
        this.additionalDamage = additionalDamage;
        this.specialAdditionalDamage = specialAdditionalDamage;
        return this;
    }

    getTotalAdditionalDamage(isAttackerSpecialActive) {
        let additionalDamage = this.additionalDamage;
        if (isAttackerSpecialActive) {
            additionalDamage += this.specialAdditionalDamage;
        }
        return additionalDamage;
    }

    setNeutralizesNonSpecialDamageReduction(
        // when Special triggers, neutralizes foe's "reduces damage by X%" effects from foe's non-Special skills
        neutralizesNonSpecialDamageReduction,
        neutralizesNonSpecialDamageReductionWhenSpecial) {
        this.neutralizesNonSpecialDamageReduction = neutralizesNonSpecialDamageReduction;
        this.neutralizesNonSpecialDamageReductionWhenSpecial = neutralizesNonSpecialDamageReductionWhenSpecial;
        return this;
    }

    setDamage(damage, specialDamage) {
        this.damage = damage;
        this.specialDamage = specialDamage;
        return this;
    }

    getDamage(isAttackerSpecialActive) {
        return isAttackerSpecialActive ? this.specialDamage : this.damage;
    }

    setDamageBeforeAdditionalDamage(damage, specialDamage) {
        this.damageBeforeAdditionalDamage = damage;
        this.specialDamageBeforeAdditionalDamage = specialDamage;
        return this;
    }

    getDamageBeforeAdditionalDamage(isAttackerSpecialActive) {
        return isAttackerSpecialActive ? this.specialDamageBeforeAdditionalDamage : this.damageBeforeAdditionalDamage;
    }

    setTotalDamage(totalDamage) {
        this.totalDamage = totalDamage;
        return this;
    }

    calcDamageReductionRatio() {
        let damageReductionRatio = 1;
        for (let ratio of this.damageReductionRatios) {
            damageReductionRatio *= ratio;
        }
        return damageReductionRatio;
    }
}

/**
 * ダメージ計算時の1回攻撃分の結果です。
 */
class StrikeResult extends DamageCalcResult {
    constructor() {
        super();
        /** @type {AttackResult} */
        this.attackResult = null;
        this.canActivateAttackerSpecial = false;
        this.isAttackerSpecialReady = false;
        this.isDefenderSpecialReady = false;
        this.isAttackerSpecialActive = false;
        this.isDefenderSpecialActive = false;
        this.damageRatio = 0;
        this.damageReductionRatio = 0;
        this.damageReductionRatios = [];
        this.specialDamageReductionRatios = [];
        this.damageReductionRatiosAfterNeutralization = [];
        this.specialDamageReductionRatiosAfterNeutralization = [];
        this.damageReductionValue = 0;
        this.damageReductionValues = [];
        this.specialDamageReductionValues = [];
        this.invalidatesDamageReduction = false;
        this.damageReductionRatiosByDefenderSpecial = [];
        this.damageReductionRatiosByNonDefenderSpecial = [];
        this.reducedDamage = 0;
        this.isMiracleActivated = false;
        this.reducedDamageIncludingMiracle = 0;
        this.potentRatio = 1;
        this.reducesDamageFromFoeToZeroDuringCombat = false;
        this.damageAfterReductionValue = 0;
        this.selfDamageReductionRatios = [];
        this.actualDamage = 0;
    }

    /**
     * 2回攻撃の何回目か（1回目が1）
     * @param strikeCount
     * @returns {StrikeResult}
     */
    setCurrentStrikeCount(strikeCount) {
        this.currentStrikeCount = strikeCount;
        return this;
    }

    setDamage(damage, specialDamage) {
        this.damage = damage;
        this.specialDamage = specialDamage;
        return this;
    }

    getDamage() {
        return this.isAttackerSpecialActive ? this.specialDamage : this.damage;
    }

    setAdditionalDamage(additionalDamage, specialAdditionalDamage) {
        this.additionalDamage = additionalDamage;
        this.specialAdditionalDamage = specialAdditionalDamage;
        return this;
    }

    getAdditionalDamageWhenNormal() {
        return this.additionalDamage;
    }

    getAdditionalDamageWhenSpecial() {
        return this.additionalDamage + this.specialAdditionalDamage;
    }

    getAdditionalDamage() {
        return this.isAttackerSpecialActive ? this.getAdditionalDamageWhenSpecial() : this.getAdditionalDamageWhenNormal();
    }

    /**
     * 固定ダメージ。奥義の場合は奥義の固定ダメージも加算される。
     * @returns {number}
     */
    getTotalAdditionalDamage() {
        let additionalDamage = this.additionalDamage;
        if (this.isAttackerSpecialActive) {
            additionalDamage += this.specialAdditionalDamage;
        }
        return additionalDamage;
    }

    setDamageDealt(damageDealt) {
        this.damageDealt = damageDealt;
        return this;
    }

    setDamageReductionRatios(ratios, specialRatios = ratios) {
        this.damageReductionRatios = ratios;
        this.specialDamageReductionRatios = specialRatios;
        return this;
    }

    setDamageReductionRatiosAfterNeutralization(ratios, specialRatios = ratios) {
        this.damageReductionRatiosAfterNeutralization = ratios;
        this.specialDamageReductionRatiosAfterNeutralization = specialRatios;
        return this;
    }

    setDamageReductionValues(values, specialValues = values) {
        this.damageReductionValues = values;
        this.specialDamageReductionValues = specialValues;
        return this;
    }

    toJSON() {
        const {attackResult, ...rest} = this;
        return rest;
    }
}

/// ダメージ計算時に一時的に使用するコンテキストです。
class DamageCalcContext {
    constructor(damageCalcEnv) {
        /** @type {DamageCalcEnv} */
        this.damageCalcEnv = damageCalcEnv;

        // isFollowupAttackはisPotentFollowupAttackを含む(isPotentFollowupAttackであれば常にisFollowupAttackも満たす)
        this.isCounterattack = false;
        this.isFollowupAttack = false;
        this.isPotentFollowupAttack = false;

        this.attackCount = 0;
    }

    get damageType() {
        return this.damageCalcEnv?.damageType;
    }

    /**
     * @returns {StrikeResult[]}
     */
    get damageHistory() {
        return this.combatResult?.damageHistory;
    }

    /**
     * @returns {AttackResult[]}
     */
    get attackHistory() {
        return this.combatResult?.attackHistory;
    }

    get combatResult() {
        return this.damageCalcEnv?.combatResult;
    }

    /**
     * 引数のユニットが攻撃したログを取得。
     * @params {Unit} attackUnit
     * @returns {StrikeResult[]}
     */
    getAttackLogs(attackUnit) {
        return this.damageHistory.filter(log => log.atkUnit === attackUnit);
    }

    isFirstStrike(atkUnit) {
        return this.combatResult.damageHistory.filter(result => result.atkUnit === atkUnit).length === 0;
    }

    isFirstAttack(atkUnit) {
        return this.combatResult.attackHistory.filter(result => result.atkUnit === atkUnit).length === 0;
    }

    isConsecutiveAttack(atkUnit) {
        let lastLog = this.damageHistory[this.damageHistory.length - 1];
        return lastLog ? lastLog.atkUnit === atkUnit : false;
    }

    isFollowupOrPotentFollowupAttack() {
        return this.isFollowupAttack || this.isPotentFollowupAttack;
    }

    isFirstFollowupAttack(atkUnit) {
        let isFollowupAttacked =
            this.damageHistory.some(log => log.atkUnit === atkUnit && log.isFollowupAttack);
        return this.isFollowupAttack && !isFollowupAttacked;
    }

    getAttackTypeString() {
        let result = "";
        if (!this.isCounterattack) {
            result += "攻撃";
        } else {
            result += "反撃";
        }
        if (this.isFollowupAttack) {
            result = `追撃${result}`;
        }
        if (this.isPotentFollowupAttack) {
            result = `神速${result}`;
        }
        return result;
    }
}

class DamageCalcEnv {
    constructor() {
        this.atkUnit = null;
        this.defUnit = null;
        this.origDefUnit = null;
        this.saverUnit = null;
        /** @type {CombatResult} */
        this.combatResult = new CombatResult();
        this.battleMap = null;
    }

    /**
     * @returns {GroupLogger<NodeEnv.SkillLogContent>}
     */
    getBeforeCombatLogger() {
        return this.combatResult.beforeCombatSkillLogger;
    }

    /**
     * @returns {GroupLogger<NodeEnv.SkillLogContent>}
     */
    getCombatLogger() {
        return this.combatResult.skillLogger;
    }

    /**
     * @returns {GroupLogger<NodeEnv.SkillLogContent>}
     */
    getAfterCombatLogger() {
        return this.combatResult.afterCombatSkillLogger;
    }

    withBeforeCombatPhaseGroup(name, fn) {
        this.getBeforeCombatLogger().withGroup(
            LoggerBase.LogLevel.NOTICE, new NodeEnv.SkillLogContent('', '', name), () => {
                return fn();
            }
        );
    }

    withCombatPhaseGroup(name, fn) {
        this.getCombatLogger().withGroup(
            LoggerBase.LogLevel.NOTICE, new NodeEnv.SkillLogContent('', '', name), () => {
                return fn();
            }
        );
    }

    withAttackPhaseGroup(name, fn) {
        this.getCurrentAttackLogger().withGroup(
            LoggerBase.LogLevel.NOTICE, new NodeEnv.SkillLogContent('', '', name), () => {
                return fn();
            }
        );
    }

    withStrikePhaseGroup(name, fn) {
        this.getCurrentStrikeLogger().withGroup(
            LoggerBase.LogLevel.NOTICE, new NodeEnv.SkillLogContent('', '', name), () => {
                return fn();
            }
        );
    }

    withAfterCombatPhaseGroup(name, fn) {
        this.getAfterCombatLogger().withGroup(
            LoggerBase.LogLevel.NOTICE, new NodeEnv.SkillLogContent('', '', name), () => {
                return fn();
            }
        );
    }

    applyBeforeCombatSkill(name, atkUnit, defUnit, fn, thisArg) {
        this.withBeforeCombatPhaseGroup(name, () => {
            fn.call(thisArg, atkUnit, defUnit, this);
            fn.call(thisArg, defUnit, atkUnit, this);
        });
    }

    applySkill(name, atkUnit, defUnit, fn, thisArg) {
        this.withCombatPhaseGroup(name, () => {
            fn.call(thisArg, atkUnit, defUnit, this);
            fn.call(thisArg, defUnit, atkUnit, this);
        });
    }

    /**
     * @returns {GroupLogger<NodeEnv.SkillLogContent>}
     */
    getCurrentAttackLogger() {
        return this.combatResult.getCurrentAttackResult().skillLogger;
    }

    /**
     * @returns {GroupLogger<NodeEnv.SkillLogContent>}
     */
    getCurrentStrikeLogger() {
        return this.combatResult.getCurrentStrikeResult().skillLogger;
    }

    setUnits(atkUnit, defUnit) {
        this.atkUnit = atkUnit;
        this.defUnit = defUnit;
        this.origDefUnit = defUnit;
        return this;
    }

    setDamageType(damageType) {
        this.damageType = damageType;
        return this;
    }

    setSaverUnit(saverUnit) {
        if (saverUnit) {
            this.defUnit = saverUnit;
            this.saverUnit = saverUnit;
        }
        return this;
    }

    setTileToAttack(tileToAttack) {
        this.tileToAttack = tileToAttack;
        return this;
    }

    setGameMode(gameMode) {
        this.gameMode = gameMode;
        return this;
    }

    setBattleMap(battleMap) {
        this.battleMap = battleMap;
        return this;
    }

    get calcPotentialDamage() {
        return this.damageType === DamageType.PotentialDamage;
    }

    get isActualDamage() {
        return this.damageType === DamageType.ActualDamage;
    }
}

class OneAttackResult {
    constructor(damage, specialDamage, atkCountPerOneAttack) {
        this.damagePerAttack = damage;
        this.specialDamagePerAttack = specialDamage;
        this.attackCount = atkCountPerOneAttack;
    }
}

/**
 * ダメージ計算を行うためのクラスです。
 */
class DamageCalculator {
    /**
     * @param {LoggerBase} logger
     * @param {UnitManager} unitManager
     */
    constructor(logger, unitManager) {
        this._logger = logger;
        this.unitManager = unitManager;
    }

    get isLogEnabled() {
        return this._logger.isLogEnabled;
    }

    set isLogEnabled(value) {
        this._logger.isLogEnabled = value;
    }

    get log() {
        return this._logger.log;
    }

    get simpleLog() {
        return this._logger.simpleLog;
    }

    examinesCanFollowupAttack(atkUnit, defUnit) {
        let totalSpdAtk = atkUnit.getSpdInCombat(defUnit);
        let totalSpdDef = defUnit.getSpdInCombat(atkUnit);
        return totalSpdAtk >= totalSpdDef + 5;
    }

    writeSimpleLog(log) {
        this._logger.writeSimpleLog(log);
    }

    writeLog(log) {
        this._logger.writeLog(log);
    }

    writeDebugLog(log) {
        this._logger.writeDebugLog(log);
    }

    clearLog() {
        this._logger.clearLog();
    }

    /**
     * ダメージ計算を行います。
     * @param {DamageCalcEnv} damageCalcEnv
     */
    calcCombatResult(damageCalcEnv) {
        let atkUnit = damageCalcEnv.atkUnit;
        let defUnit = damageCalcEnv.defUnit;

        // 初期化
        let context = new DamageCalcContext(damageCalcEnv);

        let result = damageCalcEnv.combatResult.initStats(atkUnit, defUnit)
            .setSpurs(atkUnit, defUnit).setBuffDebuffs(atkUnit, defUnit)
            .setBuffInvalidations(atkUnit, defUnit).setDebuffInvalidations(atkUnit, defUnit)
            .setUnits(atkUnit, defUnit).setDefUnit(defUnit).setTiles(atkUnit, defUnit);
        // TODO: 攻撃回数、追撃、待ち伏せ、攻め立て、反撃不可

        // 戦闘中ダメージ計算
        if (this.isLogEnabled) this.writeDebugLog("戦闘中ダメージ計算..");

        // 戦闘開始後効果 (ex) 戦闘後ダメージなど
        this.__activateEffectAfterBeginningOfCombat(atkUnit, defUnit, context);
        this.__activateEffectAfterBeginningOfCombat(defUnit, atkUnit, context);

        // 戦闘開始後ダメージの後のスキル効果
        this.__activateEffectAfterAfterBeginningOfCombatSkills(atkUnit, defUnit, context);
        this.__activateEffectAfterAfterBeginningOfCombatSkills(defUnit, atkUnit, context);

        for (let func of this.__enumerateCombatFuncs(atkUnit, defUnit, result, context)) {
            func();
            if (damageCalcEnv.isActualDamage &&
                this.__isAnyoneDead(atkUnit, defUnit)) {
                break;
            }
        }

        // 1マップ1回の効果が発動したかどうかをBattleContextからUnitに保存する
        if (damageCalcEnv.isActualDamage) {
            atkUnit.hasOncePerMapSpecialActivated |= atkUnit.battleContext.hasOncePerMapSpecialActivated;
            defUnit.hasOncePerMapSpecialActivated |= defUnit.battleContext.hasOncePerMapSpecialActivated;
        }

        result.setSpecialCounts(atkUnit, defUnit);
        // TODO: 削除
        if (damageCalcEnv.isActualDamage) {
            // console.log(`damage calc result: ${JSON.stringify(damageCalcEnv.combatResult, null, 2)}`);
        }
        return result;
    }

    /**
     * 戦闘開始後の効果
     * @param {Unit} targetUnit
     * @param {Unit} enemyUnit
     * @param {DamageCalcContext} context
     */
    __activateEffectAfterBeginningOfCombat(targetUnit, enemyUnit, context) {
        // 戦闘開始後ダメージ
        let damageToTargetAfterBeginningOfCombat = targetUnit.battleContext.getMaxDamageAfterBeginningOfCombat();
        // ターゲットが受けるダメージは敵が与えるダメージ
        context.combatResult.setDamageToEnemyAfterBeginningOfCombat(enemyUnit, damageToTargetAfterBeginningOfCombat);
        if (damageToTargetAfterBeginningOfCombat > 0) {
            targetUnit.takeDamageInCombat(damageToTargetAfterBeginningOfCombat, true);

            // ログ
            let logMessage =
                `<div class="log-damage-line">
                   <span class="log-damage">${damageToTargetAfterBeginningOfCombat}</span>（戦闘開始後(${targetUnit.groupChar})）: HP=${targetUnit.restHp}/${targetUnit.maxHpWithSkills}
                 </div>`;
            this.writeDebugLog(logMessage);
            this.writeSimpleLog(logMessage);
            let debugMessage = `重複しない戦闘開始後ダメージ: [${targetUnit.battleContext.getDamagesAfterBeginningOfCombatNotStack()}]`;
            this.writeDebugLog(debugMessage);
        }
    }

    /**
     * 戦闘開始後の後の効果
     * @param {Unit} targetUnit
     * @param {Unit} enemyUnit
     * @param {DamageCalcContext} context
     */
    __activateEffectAfterAfterBeginningOfCombatSkills(targetUnit, enemyUnit, context) {
        // 戦闘開始後ダメージ後の回復
        let maxHealAmount = targetUnit.battleContext.maxHealAmountAfterAfterBeginningOfCombatSkills;
        let [restHp, healAmount] = targetUnit.healInCombat(maxHealAmount);
        context.combatResult
            .setHealAfterBeginningOfCombat(targetUnit, healAmount)
            .setHpAfterBeginningOfCombat(targetUnit, restHp);

        // ログ
        if (maxHealAmount !== 0 || healAmount !== 0) {
            let message = `<div class="log-heal-line"><span class="log-heal">${healAmount}回復</span>(-${maxHealAmount - healAmount})
                                  (${targetUnit.groupChar}): HP=${restHp}/${targetUnit.maxHpWithSkills}</div>`;
            this.writeDebugLog(message);
            this.writeSimpleLog(message);
        }
    }

    /**
     * @param  {Unit} atkUnit
     * @param  {Unit} defUnit
     * @param  {CombatResult} result
     * @param  {DamageCalcContext} context
     */
    * __enumerateCombatFuncs(atkUnit, defUnit, result, context) {
        let self = this;
        if (defUnit.battleContext.isVantageActivated) {
            let message = `【待ち伏せ】${HtmlLogUtil.groupNameSpan(defUnit)}`;
            this.writeDebugLog(message);
            this.writeSimpleLog(message);

            // 反撃
            yield () => self.__counterattack(atkUnit, defUnit, result, context);

            if (defUnit.battleContext.isDefDesperationActivated) {
                let message = `【攻め立て】${HtmlLogUtil.groupNameSpan(defUnit)}`;
                this.writeDebugLog(message);
                this.writeSimpleLog(message);

                // 反撃の追撃
                yield () => self.__followupCounterattack(atkUnit, defUnit, result, context);

                // 反撃の神速追撃
                yield () => self.__potentFollowupCounterattack(atkUnit, defUnit, result, context);

                // 攻撃
                yield () => self.__attack(atkUnit, defUnit, result, context);

                // 攻撃の追撃
                yield () => self.__followupAttack(atkUnit, defUnit, result, context);

                // 攻撃の神速追撃
                yield () => self.__potentFollowupAttack(atkUnit, defUnit, result, context);
            } else {
                // 攻撃
                yield () => self.__attack(atkUnit, defUnit, result, context);

                if (atkUnit.battleContext.isDesperationActivated) {
                    let message = `【攻め立て】${HtmlLogUtil.groupNameSpan(atkUnit)}`;
                    this.writeDebugLog(message);
                    this.writeSimpleLog(message);

                    // 攻撃の追撃
                    yield () => self.__followupAttack(atkUnit, defUnit, result, context);

                    // 攻撃の神速追撃
                    yield () => self.__potentFollowupAttack(atkUnit, defUnit, result, context);

                    // 反撃の追撃
                    yield () => self.__followupCounterattack(atkUnit, defUnit, result, context);

                    // 反撃の神速追撃
                    yield () => self.__potentFollowupCounterattack(atkUnit, defUnit, result, context);
                } else {
                    // 反撃の追撃
                    yield () => self.__followupCounterattack(atkUnit, defUnit, result, context);

                    // 反撃の神速追撃
                    yield () => self.__potentFollowupCounterattack(atkUnit, defUnit, result, context);

                    // 攻撃の追撃
                    yield () => self.__followupAttack(atkUnit, defUnit, result, context);

                    // 攻撃の神速追撃
                    yield () => self.__potentFollowupAttack(atkUnit, defUnit, result, context);
                }
            }
        } else {
            // 攻撃
            yield () => self.__attack(atkUnit, defUnit, result, context);

            if (atkUnit.battleContext.isDesperationActivated) { // 攻め立て
                let message = `【攻め立て】${HtmlLogUtil.groupNameSpan(atkUnit)}`;
                this.writeDebugLog(message);
                this.writeSimpleLog(message);

                // 攻撃の追撃
                yield () => self.__followupAttack(atkUnit, defUnit, result, context);

                // 攻撃の神速追撃
                yield () => self.__potentFollowupAttack(atkUnit, defUnit, result, context);

                // 反撃
                yield () => self.__counterattack(atkUnit, defUnit, result, context);

                // 反撃の追撃
                yield () => self.__followupCounterattack(atkUnit, defUnit, result, context);

                // 反撃の神速追撃
                yield () => self.__potentFollowupCounterattack(atkUnit, defUnit, result, context);
            } else {
                // 反撃
                yield () => self.__counterattack(atkUnit, defUnit, result, context);

                if (defUnit.battleContext.isDefDesperationActivated) {
                    let message = `【攻め立て】${HtmlLogUtil.groupNameSpan(defUnit)}`;
                    this.writeDebugLog(message);
                    this.writeSimpleLog(message);

                    // 反撃の追撃
                    yield () => self.__followupCounterattack(atkUnit, defUnit, result, context);

                    // 反撃の神速追撃
                    yield () => self.__potentFollowupCounterattack(atkUnit, defUnit, result, context);

                    // 攻撃の追撃
                    yield () => self.__followupAttack(atkUnit, defUnit, result, context);

                    // 攻撃の神速追撃
                    yield () => self.__potentFollowupAttack(atkUnit, defUnit, result, context);
                } else {
                    // 攻撃の追撃
                    yield () => self.__followupAttack(atkUnit, defUnit, result, context);

                    // 攻撃の神速追撃
                    yield () => self.__potentFollowupAttack(atkUnit, defUnit, result, context);

                    // 反撃の追撃
                    yield () => self.__followupCounterattack(atkUnit, defUnit, result, context);

                    // 反撃の神速追撃
                    yield () => self.__potentFollowupCounterattack(atkUnit, defUnit, result, context);
                }
            }
        }
    }

    __isDead(unit) {
        return unit.restHp === 0;
    }

    __isAnyoneDead(atkUnit, defUnit) {
        return this.__isDead(atkUnit) || this.__isDead(defUnit);
    }

    /**
     * @param {Unit} atkUnit
     * @param {Unit} defUnit
     * @param {CombatResult} result
     * @param {DamageCalcContext} context
     * @private
     */
    __attack(atkUnit, defUnit, result, context) {
        context.isCounterattack = false;
        context.isFollowupAttack = false;
        context.isPotentFollowupAttack = false;
        let attackResult = this.__calcAttackDamage(atkUnit, defUnit, context);
        result.atkUnit_normalAttackDamage = attackResult.damage;
        result.atkUnit_totalAttackCount += attackResult.attackCount;
        result.atkUnit_specialAttackDamage = attackResult.specialDamage;
        if (atkUnit.restHp > 0) {
            result.atkUnit_actualTotalAttackCount += attackResult.attackCount;
        }
    }

    /**
     * @param {Unit} atkUnit
     * @param {Unit} defUnit
     * @param {CombatResult} result
     * @param {DamageCalcContext} context
     * @private
     */
    __followupAttack(atkUnit, defUnit, result, context) {
        if (atkUnit.battleContext.canFollowupAttackWithoutPotent) {
            context.isCounterattack = false;
            context.isFollowupAttack = true;
            context.isPotentFollowupAttack = false;
            let attackResult = this.__calcAttackDamage(atkUnit, defUnit, context);
            result.atkUnit_totalAttackCount += attackResult.attackCount;
            if (atkUnit.restHp > 0) {
                result.atkUnit_actualTotalAttackCount += attackResult.attackCount;
            }
        }
    }

    /**
     * @param {Unit} atkUnit
     * @param {Unit} defUnit
     * @param {CombatResult} result
     * @param {DamageCalcContext} context
     * @private
     */
    __potentFollowupAttack(atkUnit, defUnit, result, context) {
        if (atkUnit.battleContext.canPotentFollowupAttack()) {
            context.isCounterattack = false;
            context.isFollowupAttack = true;
            context.isPotentFollowupAttack = true;
            let attackResult = this.__calcAttackDamage(atkUnit, defUnit, context);
            result.atkUnit_totalAttackCount += attackResult.attackCount;
            if (atkUnit.restHp > 0) {
                result.atkUnit_actualTotalAttackCount += attackResult.attackCount;
            }
        }
    }

    /**
     * @param {Unit} atkUnit
     * @param {Unit} defUnit
     * @param {CombatResult} result
     * @param {DamageCalcContext} context
     * @private
     */
    __counterattack(atkUnit, defUnit, result, context) {
        if (defUnit.battleContext.canCounterattack) {
            context.isCounterattack = true;
            context.isFollowupAttack = false;
            context.isPotentFollowupAttack = false;
            let attackResult = this.__calcAttackDamage(defUnit, atkUnit, context);
            result.defUnit_normalAttackDamage = attackResult.damage;
            result.defUnit_totalAttackCount += attackResult.attackCount;
            result.defUnit_specialAttackDamage = attackResult.specialDamage;
            if (defUnit.restHp > 0) {
                result.defUnit_actualTotalAttackCount += attackResult.attackCount;
            }

            if (atkUnit.restHp === 0) {
                if (this.isLogEnabled) this.writeLog(atkUnit.getNameWithGroup() + "は戦闘不能");
                return result;
            }
        } else {
            if (this.isLogEnabled) this.writeLog(defUnit.getNameWithGroup() + "は反撃不可");
        }
    }

    /**
     * @param {Unit} atkUnit
     * @param {Unit} defUnit
     * @param {CombatResult} result
     * @param {DamageCalcContext} context
     * @private
     */
    __followupCounterattack(atkUnit, defUnit, result, context) {
        if (defUnit.battleContext.canCounterattack &&
            defUnit.battleContext.canFollowupAttackWithoutPotent) {
            context.isCounterattack = true;
            context.isFollowupAttack = true;
            context.isPotentFollowupAttack = false;
            let attackResult = this.__calcAttackDamage(defUnit, atkUnit, context);
            result.defUnit_totalAttackCount += attackResult.attackCount;
            if (defUnit.restHp > 0) {
                result.defUnit_actualTotalAttackCount += attackResult.attackCount;
            }
        }
    }

    /**
     * @param {Unit} atkUnit
     * @param {Unit} defUnit
     * @param {CombatResult} result
     * @param {DamageCalcContext} context
     * @private
     */
    __potentFollowupCounterattack(atkUnit, defUnit, result, context) {
        if (defUnit.battleContext.canCounterattack && defUnit.battleContext.canPotentFollowupAttack()) {
            context.isCounterattack = true;
            context.isFollowupAttack = true;
            context.isPotentFollowupAttack = true;
            let attackResult = this.__calcAttackDamage(defUnit, atkUnit, context);
            result.defUnit_totalAttackCount += attackResult.attackCount;
            if (defUnit.restHp > 0) {
                result.defUnit_actualTotalAttackCount += attackResult.attackCount;
            }
        }
    }

    // 1回ごとの攻撃で呼ばれる。
    // 攻撃ごとに変化がない場合はDamageCalculatorWrapper.jsにある方で実装すること。
    /**
     * @param  {Unit} atkUnit
     * @param  {Unit} defUnit
     * @param  {Boolean} isPrecombat
     */
    __calcFixedAddDamage(atkUnit, defUnit, isPrecombat) {
        let fixedAddDamage = 0;

        for (let skillId of atkUnit.enumerateSkills()) {
            switch (skillId) {
                case Weapon.ArcaneGrima:
                    if (atkUnit.battleContext.restHpPercentage >= 25) {
                        let atk = isPrecombat ? atkUnit.getAtkInPrecombat() : atkUnit.getAtkInCombat(defUnit);
                        atkUnit.battleContext.additionalDamage += Math.trunc(atk * 0.15);
                    }
                    break;
            }
        }

        if (atkUnit.hasStatusEffect(StatusEffectType.TotalPenaltyDamage)) {
            fixedAddDamage += -defUnit.debuffTotal;
        }

        fixedAddDamage += atkUnit.battleContext.additionalDamage;
        fixedAddDamage += this.__getAtkMinusDefAdditionalDamage(
            atkUnit,
            defUnit,
            atkUnit.battleContext.rateOfAtkMinusDefForAdditionalDamage,
            isPrecombat
        );

        if (isPrecombat) {
            fixedAddDamage += atkUnit.battleContext.additionalDamageInPrecombat;
        }
        return fixedAddDamage;
    }

    __getAtkMinusDefAdditionalDamage(atkUnit, defUnit, rate, isPrecombat) {
        let atk = 0;
        let value = 0;
        if (isPrecombat) {
            atk = atkUnit.getAtkInPrecombat();
            value = defUnit.getDefInPrecombat();
        } else {
            atk = atkUnit.getAtkInCombat(defUnit);
            value = defUnit.getDefInCombat(atkUnit);
        }

        if (atk > value) {
            return floorNumberWithFloatError((atk - value) * rate);
        }
        return 0;
    }

    __calcAddDamageForDiffOf70Percent(atkUnit, defUnit, isPrecombat, getPrecombatFunc, getCombatFunc) {
        let diff = 0;
        if (isPrecombat) {
            diff = getPrecombatFunc(atkUnit) - getPrecombatFunc(defUnit);
        } else {
            diff = getCombatFunc(atkUnit, defUnit) - getCombatFunc(defUnit, atkUnit);
        }
        if (diff > 0) {
            let addDamage = floorNumberWithFloatError(diff * 0.7);
            if (addDamage > 7) {
                addDamage = 7;
            }
            return addDamage;
        }
        return 0;
    }

    __getAtkInCombatDetail(unit, enemyUnit) {
        return `攻撃${unit.atkWithSkills}、強化${unit.getAtkBuffInCombat(enemyUnit)}、弱化${unit.getAtkDebuffInCombat()}、戦闘中強化${Number(unit.atkSpur)}`;
    }

    __getDefInCombatDetail(unit, enemyUnit) {
        return `守備${unit.defWithSkills}、強化${unit.getDefBuffInCombat(enemyUnit)}、弱化${unit.getDefDebuffInCombat()}、戦闘中強化${unit.defSpur}`;
    }

    __getResInCombatDetail(unit, enemyUnit) {
        return `魔防${unit.resWithSkills}、強化${unit.getResBuffInCombat(enemyUnit)}、弱化${unit.getResDebuffInCombat()}、戦闘中強化${unit.resSpur}`;
    }

    /**
     * @param {Unit} atkUnit
     * @param {Unit} defUnit
     * @param {DamageCalcContext} context
     * @private
     */
    __logAttackerAndAttackee(atkUnit, defUnit, context) {
        // TODO: 修正する
        if (this.__isDead(atkUnit)) {
            return;
        }
        this.writeDebugLog("----");
        if (!context.isCounterattack) {
            if (!context.isFollowupOrPotentFollowupAttack()) {
                this.writeLog(`${atkUnit.getNameWithGroup()}が${defUnit.getNameWithGroup()}を攻撃`);
            } else if (context.isFirstFollowupAttack(atkUnit)) {
                this.writeLog(`${atkUnit.getNameWithGroup()}が${defUnit.getNameWithGroup()}に追撃`);
            } else {
                this.writeLog(`${atkUnit.getNameWithGroup()}が${defUnit.getNameWithGroup()}に神速追撃`);
            }
        } else {
            if (!context.isFollowupOrPotentFollowupAttack()) {
                this.writeLog(`${atkUnit.getNameWithGroup()}が${defUnit.getNameWithGroup()}に反撃`);
            } else if (context.isFirstFollowupAttack(atkUnit)) {
                this.writeLog(`${atkUnit.getNameWithGroup()}が${defUnit.getNameWithGroup()}に反撃追撃`);
            } else {
                this.writeLog(`${atkUnit.getNameWithGroup()}が${defUnit.getNameWithGroup()}に反撃神速追撃`);
            }
        }
    }

    /**
     * 一回分の攻撃ダメージを計算します。2回攻撃の場合は2回。
     * @param  {Unit} atkUnit
     * @param  {Unit} defUnit
     * @param  {DamageCalcContext} context
     * @returns {AttackResult}
     */
    __calcAttackDamage(atkUnit, defUnit, context) {
        let attackResult = context.combatResult.createAttackResult()
            .setUnits(atkUnit, defUnit).setAttackType(context).setIsAlreadyDead(atkUnit, defUnit);

        this.writeAttackStartLog(atkUnit, defUnit, context);

        // 戦闘中の奥義カウント変動量を計算（キャンセル、拍節などから計算）
        this.__calcAndSetCooldownCount(atkUnit, defUnit);

        // 奥義発動可能状態の時に固定ダメージ(秘奥)などの効果があるので攻撃ダメージ処理の最初の方で奥義カウント変動処理を行う
        this.#applySpecialCountChangesBeforeAttack(atkUnit, defUnit, context);

        // 参照するステータスから攻撃値を計算
        this.calcAtkInAttack(atkUnit, defUnit, attackResult);

        // 攻撃回数を計算（神速追撃の特別処理など)
        this.calcAttackCountInAttack(atkUnit, attackResult, context);

        // 守備、魔防から防御値を計算
        this.calcMitInAttack(defUnit, atkUnit, attackResult);

        // 固定ダメージ（ダメージ+）
        this.calcAdditionalDamageInAttack(atkUnit, defUnit, attackResult);

        // ダメージ軽減
        this.calcSkillEffectThatNeutralizesNonSpecialDamageReductionInAttack(atkUnit, attackResult, context);

        // 特効、色相性から最終的な攻撃力を計算する
        this.calcFinalAtkInAttack(atkUnit, defUnit, attackResult, context.damageCalcEnv);

        // 防御床、奥義効果から最終的な防御を計算する
        this.calcFinalMitInAttack(atkUnit, defUnit, attackResult);

        // 最終的な攻撃、防御からダメージを計算
        this.calcDamageInAttack(atkUnit, attackResult);

        attackResult.setTotalDamage(this.__calcAttackTotalDamage(attackResult, context));

        this.writeLogInAttack(atkUnit, defUnit, attackResult);

        this.applyDamageInAttack(atkUnit, defUnit, attackResult);

        context.attackHistory.push(attackResult);

        return attackResult;
    }

    applyDamageInAttack(atkUnit, defUnit, attackResult) {
        if (!this.__isDead(atkUnit)) {
            // 攻撃側が倒されていたらダメージを反映しない(潜在ダメージ計算のためにダメージ計算は必要)
            defUnit.restHp = Math.max(0, defUnit.restHp - attackResult.totalDamage);
            if (this.isLogEnabled) {
                this.writeLog(`${defUnit.getNameWithGroup()}の残りHP ${defUnit.restHp}/${defUnit.maxHpWithSkills}`);
                this.writeLog(`${atkUnit.getNameWithGroup()}の残りHP ${atkUnit.restHp}/${atkUnit.maxHpWithSkills}`);
                if (this.__isDead(defUnit)) {
                    this.writeLog(`${defUnit.getNameWithGroup()}は戦闘不能`);
                }
            }
        }
    }

    writeAttackStartLog(atkUnit, defUnit, context) {
        if (this.isLogEnabled) {
            this.__logAttackerAndAttackee(atkUnit, defUnit, context);
            let className = atkUnit.groupId === UnitGroupType.Ally ? 'log-ally-header' : 'log-enemy-header';
            let message = `<div class="${className}">【${context.getAttackTypeString()}】</div>`;
            this.writeSimpleLog("");
            this.writeSimpleLog(message);
            this.writeDebugLog(`【${context.getAttackTypeString()}】`);
        }
    }

    writeLogInAttack(atkUnit, defUnit, attackResult) {
        if (!this.isLogEnabled) {
            return;
        }
        let resInCombatDetail = this.__getResInCombatDetail(defUnit, atkUnit);
        let defInCombatDetail = this.__getDefInCombatDetail(defUnit, atkUnit);
        let totalMitDetailLog = atkUnit.battleContext.refersRes ? resInCombatDetail : defInCombatDetail;
        if (atkUnit.battleContext.refersRes) {
            this.writeDebugLog("通常攻撃時は魔防参照")
        } else {
            this.writeDebugLog("通常攻撃時は守備参照");
        }
        let specialTotalMitDetailLog = atkUnit.battleContext.refersResForSpecial ? resInCombatDetail : defInCombatDetail;
        if (atkUnit.battleContext.refersRes !== atkUnit.battleContext.refersResForSpecial) {
            if (atkUnit.battleContext.refersResForSpecial) {
                this.writeDebugLog("奥義発動時は魔防参照")
            } else {
                this.writeDebugLog("奥義発動時は守備参照");
            }
        }
        this.writeDebugLog(`[相性判定] 攻撃属性:${this.getUnitColorLog(atkUnit)}、防御属性:${this.getUnitColorLog(defUnit)}`);
        this.writeDebugLog(`相性による攻撃補正値: ${attackResult.advantageRatio.toFixed(2)}`);
        if (defUnit.battleContext.isOnDefensiveTile) {
            this.writeDebugLog(`${defUnit.getNameWithGroup()}は防御地形補正 1.3`);
        }
        this.writeDebugLog(`補正前の攻撃:${attackResult.atk}(${this.__getAtkInCombatDetail(atkUnit, defUnit)})`);
        if (atkUnit.battleContext.isEffectiveToOpponent) {
            this.writeDebugLog("特効補正値: 1.5");
        }
        this.writeDebugLog(`相性による攻撃加算: ${attackResult.atkAdvantageAddition}(${(attackResult.finalAtk * attackResult.advantageRatio).toFixed(2)})`);
        this.writeDebugLog(`相性による攻撃加算(奥義): ${attackResult.specialAtkAdvantageAddition}(${(attackResult.specialFinalAtk * attackResult.advantageRatio).toFixed(2)})`);
        this.writeDebugLog(`補正前の耐久:${attackResult.mit}(${totalMitDetailLog})`);
        if (attackResult.mit !== attackResult.specialMit) {
            this.writeDebugLog(`奥義発動時の補正前の耐久:${attackResult.specialMit}(${specialTotalMitDetailLog})`);
        }
        this.writeDebugLog(`補正後の攻撃:${attackResult.finalAtk}、耐久:${attackResult.finalMit}`);
        this.writeDebugLog(`補正後の攻撃(奥義):${attackResult.specialFinalAtk}、耐久:${attackResult.specialFinalMit}`);
        this.writeDebugLog(`加算ダメージ:${attackResult.additionalDamage}`);
        if (attackResult.specialSufferRatio > 0) {
            this.writeDebugLog(`奥義発動時、守備、魔防－${floorNumberWithFloatError(attackResult.specialSufferRatio * 100)}%扱い`);
        }
        this.writeDebugLog(`奥義加算ダメージ:${attackResult.specialAdditionalDamage}`);
        this.writeDebugLog(`通常ダメージ=${attackResult.damage}, 奥義ダメージ=${attackResult.specialDamage}, 攻撃回数=${attackResult.attackCount}`);
        this.writeDebugLog(`合計ダメージ:${attackResult.totalDamage}`);
    }

    calcDamageInAttack(atkUnit, attackResult) {
        // 攻撃 - 守備 を計算
        let damage = truncNumberWithFloatError((attackResult.finalAtk - attackResult.finalMit));
        if (damage < 0) {
            damage = 0;
        }

        let specialMultDamage = atkUnit.battleContext.specialMultDamage;
        attackResult.specialMultDamage = specialMultDamage;
        let specialAddDamage = atkUnit.battleContext.getSpecialAddDamage();
        specialAddDamage += floorNumberWithFloatError((atkUnit.maxHpWithSkills - atkUnit.restHp) * atkUnit.battleContext.selfDamageDealtRateToAddSpecialDamage);
        attackResult.specialAddDamage = specialAddDamage;
        let specialDamage = truncNumberWithFloatError((attackResult.specialFinalAtk - attackResult.specialFinalMit) * specialMultDamage) + specialAddDamage;
        if (specialDamage < 0) {
            specialDamage = 0;
        }
        attackResult.setDamageBeforeAdditionalDamage(damage, specialDamage);

        // 固定ダメージ
        damage += attackResult.additionalDamage;
        specialDamage += attackResult.additionalDamage + attackResult.specialAdditionalDamage;

        // 神罰の杖
        if (atkUnit.weaponType === WeaponType.Staff) {
            if (!atkUnit.battleContext.canActivateWrathfulStaff()) {
                attackResult.damageReductionRatios.push(0.5);
            }
        }
        // 杖の半減は加算ダメージ後に計算
        damage = truncNumberWithFloatError(damage * attackResult.calcDamageReductionRatio());
        specialDamage = truncNumberWithFloatError(specialDamage * attackResult.calcDamageReductionRatio());

        attackResult.setDamage(damage, specialDamage);
    }

    calcFinalMitInAttack(atkUnit, defUnit, attackResult) {
        attackResult.mitAdvRatio = 0.0;
        if (defUnit.battleContext.isOnDefensiveTile) {
            attackResult.mitAdvRatio = 0.3;
        }
        let finalMit = floorNumberWithFloatError(
            // 防御床分を加算
            attackResult.mit + attackResult.mit * attackResult.mitAdvRatio
        );

        attackResult.setSpecialSufferRatio(atkUnit.battleContext.specialSufferPercentage / 100.0);
        let specialFinalMit =
            floorNumberWithFloatError(
                // 守備、魔防-n%扱い
                (
                    attackResult.specialMit -
                    floorNumberWithFloatError(attackResult.specialMit * attackResult.specialSufferRatio)
                )
                +
                // 防御床
                floorNumberWithFloatError(attackResult.specialMit * attackResult.mitAdvRatio)
            );
        attackResult.setFinalMit(finalMit, specialFinalMit);
    }

    /**
     * @param {Unit} atkUnit
     * @param {Unit} defUnit
     * @param {AttackResult} attackResult
     * @param {DamageCalcEnv} damageCalcEnv
     */
    calcFinalAtkInAttack(atkUnit, defUnit, attackResult, damageCalcEnv) {
        let finalAtk = attackResult.atk;
        let specialFinalAtk = attackResult.specialAtk;
        if (atkUnit.battleContext.isEffectiveToOpponent) {
            // 特効
            finalAtk = floorNumberWithFloatError(finalAtk * 1.5);
            specialFinalAtk = floorNumberWithFloatError(specialFinalAtk * 1.5);
        }

        damageCalcEnv.withCombatPhaseGroup('3すくみダメージ判定時', () => {
            let attackAdvRatio = this.#getAttackAdvRatio(atkUnit, defUnit, damageCalcEnv);
            attackResult.setAdvantage(
                attackAdvRatio,
                truncNumberWithFloatError(finalAtk * attackAdvRatio),
                truncNumberWithFloatError(specialFinalAtk * attackAdvRatio)
            );
        });
        finalAtk += attackResult.atkAdvantageAddition;
        specialFinalAtk += attackResult.specialAtkAdvantageAddition;
        attackResult.setFinalAtk(finalAtk, specialFinalAtk);
    }

    calcSkillEffectThatNeutralizesNonSpecialDamageReductionInAttack(atkUnit, attackResult, context) {
        let invalidatesDamageReductionExceptSpecialOnSpecialActivation = atkUnit.battleContext.invalidatesDamageReductionExceptSpecialOnSpecialActivation;
        let invalidatesDamageReductionExceptSpecial =
            atkUnit.battleContext.invalidatesDamageReductionExceptSpecial ||
            atkUnit.battleContext.invalidatesDamageReductionExceptSpecialForNextAttack;
        if (context.isFollowupOrPotentFollowupAttack()) {
            invalidatesDamageReductionExceptSpecial |=
                atkUnit.battleContext.invalidatesDamageReductionExceptSpecialForFollowupAttack;
        }
        attackResult.setNeutralizesNonSpecialDamageReduction(
            invalidatesDamageReductionExceptSpecial,
            invalidatesDamageReductionExceptSpecialOnSpecialActivation
        );
        atkUnit.battleContext.invalidatesDamageReductionExceptSpecialForNextAttack = false;
    }

    calcAdditionalDamageInAttack(atkUnit, defUnit, attackResult) {
        let fixedAddDamage = this.__calcFixedAddDamage(atkUnit, defUnit, false);
        let fixedSpecialAddDamage = atkUnit.battleContext.additionalDamageOfSpecial;
        attackResult.setAdditionalDamage(fixedAddDamage, fixedSpecialAddDamage);
    }

    calcMitInAttack(defUnit, atkUnit, attackResult) {
        let defInCombat = defUnit.getDefInCombat(atkUnit);
        let resInCombat = defUnit.getResInCombat(atkUnit);

        let totalMit = atkUnit.battleContext.refersRes ? resInCombat : defInCombat;
        let specialTotalMit = atkUnit.battleContext.refersResForSpecial ? resInCombat : defInCombat; // 攻撃側の奥義発動時の防御力
        attackResult.setDefRes(defInCombat, resInCombat).setMit(totalMit, specialTotalMit);
    }

    calcAttackCountInAttack(atkUnit, attackResult, context) {
        let atkCountPerAttack = atkUnit.battleContext.getAttackCount(context.isCounterattack);
        // 神速追撃の場合は2回攻撃は発動しない
        if (context.isPotentFollowupAttack) {
            this.writeDebugLog(`神速追撃により2回攻撃は発動しない: ${atkCountPerAttack} → ${1}`);
            atkCountPerAttack = 1;
        }
        attackResult.setAttackCount(atkCountPerAttack);
    }

    calcAtkInAttack(atkUnit, defUnit, attackResult) {
        let totalAtk = atkUnit.getAtkInCombat(defUnit);
        let specialTotalAtk = atkUnit.getAtkInCombat(defUnit);
        let statusIndexWhenSpecial = atkUnit.battleContext.statIndexInsteadOfAtkWhenSpecial;
        attackResult.statIndexInsteadOfAtkWhenSpecial = atkUnit.battleContext.statIndexInsteadOfAtkWhenSpecial;
        if (statusIndexWhenSpecial !== StatusIndex.NONE) {
            // calculates damage using 150% of unit's DEF instead of the value of unit's ATK when Special triggers.
            let ratio = atkUnit.battleContext.ratioForUsingAnotherStatWhenSpecial;
            specialTotalAtk = Math.trunc(atkUnit.getStatusesInCombat(defUnit)[statusIndexWhenSpecial] * ratio);
        }
        attackResult.setAtk(totalAtk, specialTotalAtk).setSpecialAtkStat(statusIndexWhenSpecial);
    }

    applySkillEffectsAfterAttack(targetUnit, enemyUnit, context) {
        let env = new DamageCalculatorEnv(this, targetUnit, enemyUnit, false, context);
        env.setName('攻撃後').setLogLevel(getSkillLogLevel()).setDamageType(context.damageType);
        AFTER_ATTACK_HOOKS.evaluateWithUnit(targetUnit, env);
    }

    /**
     * @param {Unit} atkUnit
     * @param {Unit} defUnit
     * @param {DamageCalcContext} context
     */
    #getFixedAddDamagePerStrike(atkUnit, defUnit, context) {
        let fixedAddDamage = 0;
        fixedAddDamage += atkUnit.battleContext.additionalDamageOfNextAttack;
        atkUnit.battleContext.additionalDamageOfNextAttack = 0;
        // TODO: 戦闘開始のタイミングに移動させる
        if (context.isFirstStrike(atkUnit)) {
            fixedAddDamage += atkUnit.battleContext.additionalDamageOfFirstAttack;
        }
        for (let skillId of atkUnit.enumerateSkills()) {
            let func = getSkillFunc(skillId, addSpecialDamageAfterDefenderSpecialActivatedFuncMap);
            fixedAddDamage += func?.call(this, atkUnit, defUnit) ?? 0;
        }
        // 通常ダメージに加算
        for (let [damage, rate] of atkUnit.battleContext.reflexDamagesAndRatesForNextAttack) {
            fixedAddDamage += Math.trunc(damage * rate);
        }
        atkUnit.battleContext.reflexDamagesAndRatesForNextAttack = [];

        if (atkUnit.battleContext.additionalDamageOfNextAttackByDamageRatio > 0) {
            fixedAddDamage += atkUnit.battleContext.additionalDamageOfNextAttackByDamageRatio;
            atkUnit.battleContext.additionalDamageOfNextAttackByDamageRatio = 0;
        }

        if (atkUnit.battleContext.isNextAttackAddReducedDamageActivating) {
            fixedAddDamage += atkUnit.battleContext.reducedDamageForNextAttack;
            atkUnit.battleContext.reducedDamageForNextAttack = 0;
        }
        switch (atkUnit.special) {
            case Special.IceMirror2:
                if (atkUnit.battleContext.isNextAttackEffectAfterSpecialActivating) {
                    fixedAddDamage += floorNumberWithFloatError(atkUnit.getResInCombat(defUnit) * 0.4);
                    atkUnit.battleContext.isNextAttackEffectAfterSpecialActivating = false;
                }
                break;
            case Special.FrostbiteMirror:
                // 通常ダメージに加算
                if (atkUnit.battleContext.isNextAttackAddReducedDamageActivating) {
                    fixedAddDamage += atkUnit.battleContext.reducedDamageForNextAttack;
                    atkUnit.battleContext.reducedDamageForNextAttack = 0;
                }
                break;
            case Special.NegatingFang:
                if (atkUnit.battleContext.isNextAttackEffectAfterSpecialActivating) {
                    fixedAddDamage += floorNumberWithFloatError(atkUnit.getAtkInCombat(defUnit) * 0.3);
                    atkUnit.battleContext.isNextAttackEffectAfterSpecialActivating = false;
                }
                break;
            default:
                break;
        }
        atkUnit.battleContext.isNextAttackAddReducedDamageActivating = false;
        return fixedAddDamage;
    }

    /**
     * @param {Unit} atkUnit
     * @param {Unit} defUnit
     * @param {DamageCalcEnv} damageCalcEnv
     */
    #getAttackAdvRatio(atkUnit, defUnit, damageCalcEnv) {
        let attackTriangleAdv =
            DamageCalculationUtility.calcAttackerTriangleAdvantage(atkUnit, defUnit,
                damageCalcEnv, damageCalcEnv.getCurrentAttackLogger());
        let triangleAdeptRate = 0;
        let triangleMult = 0;
        switch (attackTriangleAdv) {
            case TriangleAdvantage.Advantageous:
                triangleAdeptRate = 0.2;
                triangleMult = 1;
                break;
            case TriangleAdvantage.Disadvantageous:
                triangleAdeptRate = 0.2;
                triangleMult = -1;
                break;
            case TriangleAdvantage.None:
            default:
                break;
        }

        // 相性激化
        let atkAdditionalRatio = atkUnit.getTriangleAdeptAdditionalRatio();
        let defAdditionalRatio = defUnit.getTriangleAdeptAdditionalRatio();
        // 相性相殺: 自分のスキルによる相性激化を無効
        if (atkUnit.neutralizesSelfTriangleAdvantage()) {
            atkAdditionalRatio = 0;
        }
        if (defUnit.neutralizesSelfTriangleAdvantage()) {
            defAdditionalRatio = 0;
        }
        if (triangleMult === 1 && atkUnit.battleContext.neutralizesBoostingTriangleAdvantage) {
            atkAdditionalRatio = 0;
        }
        if (triangleMult === -1 && atkUnit.battleContext.neutralizesReducingTriangleDisadvantage) {
            atkAdditionalRatio = 0;
        }
        if (triangleMult === 1 && defUnit.battleContext.neutralizesBoostingTriangleAdvantage) {
            defAdditionalRatio = 0;
        }
        if (triangleMult === -1 && defUnit.battleContext.neutralizesReducingTriangleDisadvantage) {
            defAdditionalRatio = 0;
        }
        let additionalRatio = Math.max(atkAdditionalRatio, defAdditionalRatio);
        // @TODO: 相性相殺1,2の実装
        // 相性相殺3: 相性不利の時、相手の相性激化を反転
        if (attackTriangleAdv === TriangleAdvantage.Disadvantageous) {
            if (atkUnit.reversesTriangleAdvantage()) {
                // 自分が相性不利で自分が相性相殺3を持っている時反転する
                additionalRatio = -defAdditionalRatio;
            }
        } else if (attackTriangleAdv === TriangleAdvantage.Advantageous) {
            if (defUnit.reversesTriangleAdvantage()) {
                // 相手が相性不利で相手が相性相殺3を持っている時反転する
                additionalRatio = -atkAdditionalRatio;
            }
        }
        let triangleReviseRate = triangleAdeptRate + additionalRatio;
        return triangleMult * triangleReviseRate;
    }

    /**
     * 攻撃前の奥義カウント変動を適用
     * @param {Unit} atkUnit
     * @param {Unit} defUnit
     * @param {DamageCalcContext} context
     */
    #applySpecialCountChangesBeforeAttack(atkUnit, defUnit, context) {
        let atkLogClass = atkUnit.groupId === UnitGroupType.Ally ? 'log-ally' : 'log-enemy';
        let defLogClass = defUnit.groupId === UnitGroupType.Ally ? 'log-ally' : 'log-enemy';
        // 最初のStrikeが始まる前なのでAttackだけの判定で良い
        if (context.isFirstAttack(atkUnit)) {
            // atkUnitの奥義カウント変動
            {
                let amount = atkUnit.battleContext.getSpecialCountChangeAmountBeforeFirstAttack();
                let atkCount = atkUnit.tmpSpecialCount + amount;
                if (atkUnit.battleContext.getSpecialCountChangeAmountAbsBeforeFirstAttack() > 0) {
                    this.writeSimpleLog(
                        `【<span class="${atkLogClass}">奥義カウント(${atkUnit.groupChar})</span>】<span class="log-special">${atkCount}</span> = ${atkUnit.tmpSpecialCount} -
                        ${atkUnit.battleContext.specialCountReductionBeforeFirstAttack} -
                        ${atkUnit.battleContext.specialCountReductionBeforeFirstAttackPerAttack} +
                        ${atkUnit.battleContext.specialCountIncreaseBeforeFirstAttack}
                        `
                    );
                }
                atkUnit.tmpSpecialCount = MathUtil.ensureMinMax(atkCount, 0, atkUnit.maxSpecialCount);
            }

            // defUnitの奥義カウント変動
            {
                let amount = defUnit.battleContext.getSpecialCountChangeAmountBeforeFirstAttackByEnemy();
                let defCount = defUnit.tmpSpecialCount + amount;
                if (defUnit.battleContext.getSpecialCountChangeAmountAbsBeforeFirstAttackByEnemy() > 0) {
                    this.writeSimpleLog(
                        `【<span class="${defLogClass}">奥義カウント(${defUnit.groupChar})</span>】<span class="log-special">${defCount}</span> = ${defUnit.tmpSpecialCount} -
                        ${defUnit.battleContext.specialCountReductionBeforeFirstAttackByEnemy} +
                        ${defUnit.battleContext.specialCountIncreaseBeforeFirstAttack}
                        `
                    );
                }
                defUnit.tmpSpecialCount = MathUtil.ensureMinMax(defCount, 0, defUnit.maxSpecialCount);
            }
        }
        // 最初の追撃前の効果
        // if (context.isFirstFollowupAttack(atkUnit)) {
        if (context.isFollowupOrPotentFollowupAttack()) {
            // atkUnitの奥義カウント変動
            let atkCount = atkUnit.tmpSpecialCount;
            let atkIncrease = 0;
            let atkReduction = 0;
            atkReduction += atkUnit.battleContext.specialCountReductionBeforeEachFollowupAttack;
            if (context.isFirstFollowupAttack(atkUnit)) {
                atkIncrease += atkUnit.battleContext.getSpecialCountIncreaseBeforeFirstFollowupAttack();
                atkReduction += atkUnit.battleContext.getSpecialCountReductionBeforeFirstFollowupAttack();
            }
            atkCount += atkIncrease;
            atkCount -= atkReduction;
            if (atkIncrease !== 0 || atkReduction !== 0) {
                this.writeSimpleLog(`【<span class="${atkLogClass}">奥義カウント(${atkUnit.groupChar})</span>】
                                    <span class="log-special">${atkCount}</span> = 
                                    ${atkUnit.tmpSpecialCount} - ${atkReduction} + ${atkIncrease}`
                );
            }
            atkUnit.tmpSpecialCount = Math.min(Math.max(0, atkCount), atkUnit.maxSpecialCount);

            // defUnitの奥義カウント変動
            let defCount = defUnit.tmpSpecialCount;
            let defIncrease = 0;
            let defReduction = 0;
            if (context.isFirstFollowupAttack(atkUnit)) {
                defReduction += defUnit.battleContext.getSpecialCountReductionBeforeFirstFollowUpAttackByEnemy();
            }
            defCount += defIncrease;
            defCount -= defReduction;
            if (defIncrease !== 0 || defReduction !== 0) {
                this.writeSimpleLog(`【<span class="${defLogClass}">奥義カウント(${defUnit.groupChar})</span>】
                                    <span class="log-special">${defCount}</span> = 
                                    ${defUnit.tmpSpecialCount} - ${defReduction} + ${defIncrease}`
                );
            }
            defUnit.tmpSpecialCount = MathUtil.ensureMinMax(defCount, 0, defUnit.maxSpecialCount);
        }
    }

    getUnitColorLog(unit) {
        let result = colorTypeToString(unit.color);
        if (unit.battleContext.isAdvantageForColorless) {
            return result + "(無属性有利)";
        }
        return result;
    }

    /**
     * @param  {Unit} atkUnit
     * @param  {Unit} defUnit
     */
    calcPrecombatSpecialResult(atkUnit, defUnit) {
        if (!atkUnit.canActivatePrecombatSpecial()) {
            return [0, 0];
        }
        if (this.isLogEnabled) {
            this.writeDebugLog("戦闘前ダメージ計算..");
        }

        atkUnit.battleContext.hasSpecialActivated = true;
        atkUnit.battleContext.isPreCombatSpecialActivated = true;
        let totalDamageWithOverkill = this.calcPrecombatSpecialDamage(atkUnit, defUnit);
        let totalDamage = Math.min(totalDamageWithOverkill, defUnit.restHp - 1);

        this.__restoreMaxSpecialCount(atkUnit);

        defUnit.restHp = defUnit.restHp - totalDamage;

        if (this.isLogEnabled) {
            this.writeDebugLog("戦闘前ダメージ計算..");
            this.writeLog(`${totalDamageWithOverkill}（範囲奥義: HP → ${defUnit.restHp}）`);
            this.writeSimpleLog(`<div class="log-damage-line"><span class="log-damage">${totalDamageWithOverkill}</span>（範囲奥義: HP → ${defUnit.restHp}）</div>`);
            this.writeLog(defUnit.name + "の残りHP " + defUnit.restHp + "/" + defUnit.maxHpWithSkills);
        }
        atkUnit.precombatContext.damageCountOfSpecialAtTheSameTime++;
        return [totalDamage, totalDamageWithOverkill];
    }

    /**
     * @param  {Unit} atkUnit
     * @param  {Unit} defUnit
     */
    calcPrecombatSpecialDamage(atkUnit, defUnit) {
        let tmpMit = atkUnit.battleContext.refersRes ? defUnit.getResInPrecombat() : defUnit.getDefInPrecombat();
        if (defUnit.battleContext.isOnDefensiveTile) {
            tmpMit = tmpMit + floorNumberWithFloatError(tmpMit * 0.3);
        }
        if (g_appData.gameMode === GameMode.SummonerDuels ||
            g_appData.isSummonerDualCalcEnabled) {
            if (atkUnit.attackRange === 2 && defUnit.attackRange === 1) {
                tmpMit += 7;
            }
        }

        let statusDiff = Math.max(0, atkUnit.getAtkInPrecombat() - tmpMit);
        let rangedSpecialDamage =
            floorNumberWithFloatError(statusDiff * atkUnit.battleContext.precombatSpecialDamageMult);

        let addDamage = this.__calcFixedAddDamage(atkUnit, defUnit, true);
        let specialAddDamage = atkUnit.battleContext.additionalDamageOfSpecial;
        let damage = rangedSpecialDamage + addDamage + specialAddDamage;

        let damageReductionRatio = defUnit.battleContext.damageReductionRatioForPrecombat;

        let reducedDamage = floorNumberWithFloatError(damage * damageReductionRatio);
        let damageReduction = defUnit.battleContext.damageReductionForPrecombat;
        let currentDamage = Math.max(damage - reducedDamage - damageReduction, 0);

        if (this.isLogEnabled) {
            this.writeDebugLog(`攻撃=${atkUnit.getAtkInPrecombat()}`);
            if (atkUnit.battleContext.refersRes) {
                this.writeDebugLog(`魔防参照:魔防=${tmpMit}`);
            } else {
                this.writeDebugLog(`守備参照:守備=${tmpMit}`);
            }
            this.writeDebugLog(`攻撃-守備or魔防=${statusDiff}`);
            this.writeDebugLog(`(攻撃-守備or魔防) * 倍率(${atkUnit.battleContext.precombatSpecialDamageMult})=${rangedSpecialDamage}`);
            this.writeDebugLog(`追加ダメージ: ${addDamage}, 奥義発動時の追加ダメージ: ${specialAddDamage}`);
            this.writeDebugLog(`軽減なしダメージ: ${damage} = ${rangedSpecialDamage} + ${addDamage} + ${specialAddDamage}`);

            if (damageReductionRatio > 0.0) {
                this.writeDebugLog("ダメージ軽減" + damageReductionRatio * 100 + "%");
                this.writeDebugLog("ダメージ:" + damage + "→" + currentDamage);
            }
        }

        return currentDamage;
    }

    /**
     * @param  {Unit} atkUnit
     * @param  {Unit} defUnit
     */
    __calcAndSetCooldownCount(atkUnit, defUnit) {
        atkUnit.battleContext.cooldownCountForAttack = 1;
        defUnit.battleContext.cooldownCountForAttack = 1;
        atkUnit.battleContext.cooldownCountForDefense = 1;
        defUnit.battleContext.cooldownCountForDefense = 1;
        if (atkUnit.battleContext.increaseCooldownCountForAttack && !defUnit.battleContext.invalidatesIncreaseCooldownCount) {
            atkUnit.battleContext.cooldownCountForAttack += 1;
        }
        if (atkUnit.battleContext.increaseCooldownCountForDefense && !defUnit.battleContext.invalidatesIncreaseCooldownCount) {
            atkUnit.battleContext.cooldownCountForDefense += 1;
        }
        if (defUnit.battleContext.increaseCooldownCountForAttack && !atkUnit.battleContext.invalidatesIncreaseCooldownCount) {
            defUnit.battleContext.cooldownCountForAttack += 1;
        }
        if (defUnit.battleContext.increaseCooldownCountForDefense && !atkUnit.battleContext.invalidatesIncreaseCooldownCount) {
            defUnit.battleContext.cooldownCountForDefense += 1;
        }

        if (defUnit.battleContext.reducesCooldownCount && !atkUnit.battleContext.invalidatesReduceCooldownCount) {
            atkUnit.battleContext.cooldownCountForAttack -= 1;
            atkUnit.battleContext.cooldownCountForDefense -= 1;
        }
        if (atkUnit.battleContext.reducesCooldownCount && !defUnit.battleContext.invalidatesReduceCooldownCount) {
            defUnit.battleContext.cooldownCountForAttack -= 1;
            defUnit.battleContext.cooldownCountForDefense -= 1;
        }
    }

    /**
     * @param {AttackResult} attackResult
     * @param {DamageCalcContext} context
     */
    __calcAttackTotalDamage(attackResult, context) {
        let totalDamage = 0;
        for (let i = 0; i < attackResult.attackCount; ++i) {
            // ユニットの生存判定
            let isDefUnitAlreadyDead = attackResult.defUnit.restHp <= totalDamage;
            if (isDefUnitAlreadyDead) {
                return totalDamage;
            }
            let isAtkUnitAlreadyDead = attackResult.atkUnit.restHp <= 0;
            if (isAtkUnitAlreadyDead) {
                return totalDamage;
            }

            totalDamage = this.calcStrikeTotalDamage(totalDamage, i + 1, attackResult, context);
        }

        return totalDamage;
    }

    /**
     * 1回の攻撃(Strike)とこの攻撃(Attack)での今までのトータルダメージを計算する。
     * @param {number} totalDamage
     * @param {number} currentAttackCount
     * @param {AttackResult} attackResult
     * @param {DamageCalcContext} context
     * @returns {number}
     */
    calcStrikeTotalDamage(totalDamage, currentAttackCount, attackResult, context) {
        let atkUnit = attackResult.atkUnit;
        let defUnit = attackResult.defUnit;
        context.attackCount = currentAttackCount;
        let combatResult = context.damageCalcEnv.combatResult;
        let strikeResult = combatResult.createStrikeResult().setCurrentStrikeCount(context.attackCount);

        atkUnit.battleContext.initContextPerStrike();
        defUnit.battleContext.initContextPerStrike();

        let isSecondStrike = currentAttackCount === 2;
        if (context.isFirstAttack(atkUnit) && isSecondStrike) {
            // TODO: 最初のAttackのSecond Strikeだということが明確になるようにrenameする
            this.applySpecialCountChangeAmountBeforeSecondStrike(atkUnit);
            this.applySpecialCountChangeAmountBeforeSecondStrike(defUnit);
        }

        // 攻撃奥義発動可能状態で実際に奥義が発動できる（奥義の発動が確定）
        strikeResult.canActivateAttackerSpecial =
            atkUnit.isAttackSpecialReady() &&
            !atkUnit.battleContext.preventedAttackerSpecial;
        context.damageCalcEnv.withStrikePhaseGroup('攻撃開始時', () => {
            this.__applySkillEffectsPerAttack(atkUnit, defUnit, strikeResult, context);
            this.__applySkillEffectsPerAttack(defUnit, atkUnit, strikeResult, context);
        });
        // 奥義発動可能状態（実際に奥義が発動できるかは問わない）
        strikeResult.isAttackerSpecialReady = atkUnit.isAttackSpecialReady();
        strikeResult.isDefenderSpecialReady =
            defUnit.isDefenseSpecialReady() &&
            this.__isSatisfiedDefenderSpecialCond(defUnit, atkUnit);
        strikeResult.isAttackerSpecialActive =
            strikeResult.isAttackerSpecialReady &&
            !atkUnit.battleContext.preventedAttackerSpecial;

        // 奥義以外のダメージ軽減
        strikeResult.setDamageReductionRatios(this.#getDamageReductionRatios(atkUnit, defUnit, context));

        this.setNeutralizesDamageReduction(atkUnit, attackResult, strikeResult);

        strikeResult.setDamageReductionRatiosAfterNeutralization(this.#getNeutralizationOfDamageReduction(strikeResult));

        // 奥義によるダメージ軽減
        this.#getDamageReductionRatiosBySpecial(strikeResult.damageReductionRatiosByNonDefenderSpecial, defUnit, context);

        // 攻撃ごとに変化する可能性がある奥義によるダメージ軽減
        this.#applySpecialDamageReductionPerAttack(defUnit, atkUnit, context);

        // 重装の聖炎など攻撃奥義スキルに内蔵されているダメージカット(心流星は除く)
        context.damageCalcEnv.withStrikePhaseGroup('1戦闘に1回の奥義による軽減効果', () => {
            this.#applyDamageReductionByNoneDefenderSpecial(
                strikeResult.damageReductionRatiosByNonDefenderSpecial,
                atkUnit, defUnit,
                strikeResult.canActivateAttackerSpecial, context
            );
        });

        // 防御系奥義によるダメージ軽減
        let isDefenderSpecialActivated = this.#applyDamageReductionByDefenderSpecial(strikeResult, context);

        // 神速追撃によるダメージ軽減
        strikeResult.potentRatio = this.#getDamageReductionRatioByPotent(atkUnit, context);

        // 受けるダメージマイナス(固定値軽減)
        DamageCalculator.#applyDamageReductionValues(strikeResult.damageReductionValues, defUnit, context);

        let currentDamage = 0;
        let reducedDamage = 0;

        let additionalDamagePerStrike =
            atkUnit.battleContext.additionalDamagePerAttack +
            this.#getFixedAddDamagePerStrike(atkUnit, defUnit, context);
        let specialAdditionalDamagePerStrike =
            atkUnit.battleContext.getSpecialAddDamagePerAttack() +
            atkUnit.battleContext.additionalDamageOfSpecialPerAttackInCombat;
        strikeResult.setAdditionalDamage(additionalDamagePerStrike, specialAdditionalDamagePerStrike);

        let normalDamageOfThisStrike = attackResult.damage + strikeResult.getAdditionalDamageWhenNormal();
        let specialDamageOfThisStrike = attackResult.specialDamage + strikeResult.getAdditionalDamageWhenSpecial();
        strikeResult.setDamage(normalDamageOfThisStrike, specialDamageOfThisStrike);

        strikeResult.reducesDamageFromFoeToZeroDuringCombat =
            defUnit.battleContext.reducesDamageFromFoeToZeroDuringCombat;

        if (strikeResult.isAttackerSpecialActive) {
            atkUnit.battleContext.hasSpecialActivated = true;
            atkUnit.battleContext.specialActivatedCount++;

            DamageCalculator.#applySkillEffectsOnSpecial(atkUnit, defUnit);

            // 奥義発動
            strikeResult.damageReductionValues.push(defUnit.battleContext.damageReductionValueOfSpecialAttack);
            strikeResult.damageReductionValues.push(defUnit.battleContext.damageReductionValueOfSpecialAttackPerAttack);
            if (atkUnit.battleContext.isBaneSpecial || atkUnit.battleContext.isBanePerAttack) {
                // 奥義発動時、軽減効果の計算前のダメージが「敵のHP-1」より低い時、そのダメージを「敵のHP-1」とする(巨影など一部の敵を除く)
                if (strikeResult.specialDamage < defUnit.restHp - 1) {
                    if (this.isLogEnabled) {
                        let message = `${atkUnit.nameWithGroup}の瞬殺効果が発動`;
                        this.writeDebugLog(message);
                        this.writeSimpleLog(message);
                    }
                    strikeResult.specialDamage = defUnit.restHp - 1;
                    strikeResult.isBaneStrike = true;
                }
            }
            let atkSpecialCountBefore = atkUnit.tmpSpecialCount;
            let defSpecialCountBefore = defUnit.tmpSpecialCount;
            [currentDamage, reducedDamage] = this.__calcUnitStrikeDamage(strikeResult, context);
            this.__restoreMaxSpecialCount(atkUnit);
            // 奥義発動直後のスキル効果（奥義カウント変動など）
            this.applySkillEffectAfterSpecialActivated(atkUnit, defUnit, context);
            if (!isDefenderSpecialActivated) {
                this.__reduceSpecialCount(defUnit, defUnit.battleContext.cooldownCountForDefense);
            }
            let atkSpecialCountAfter = atkUnit.tmpSpecialCount;
            let defSpecialCountAfter = defUnit.tmpSpecialCount;
            let specialSpan = n => `<span class='log-special'>${n}</span>`;
            let specialInfo =
                `${HtmlLogUtil.groupNameSpan(atkUnit)}: ${specialSpan(atkSpecialCountBefore)} → ${specialSpan(atkSpecialCountAfter)}, 
                     ${HtmlLogUtil.groupNameSpan(defUnit)}: ${specialSpan(defSpecialCountBefore)} → ${specialSpan(defSpecialCountAfter)}`;
            if (this.isLogEnabled) {
                this.writeLog(`${HtmlLogUtil.specialSpan('奥義')}によるダメージ${HtmlLogUtil.damageSpan(currentDamage)}`);
            }
            this.writeSimpleLog(`<div class="log-damage-line">${HtmlLogUtil.damageSpan(currentDamage)}
                （${HtmlLogUtil.specialSpan('奥義')}）${specialInfo}</div>`);

            // 奥義発動時の回復
            {
                let actualDamage = currentDamage;
                if (defUnit.restHp - totalDamage < currentDamage) {
                    actualDamage = defUnit.restHp - totalDamage;
                }

                let healedHp = floorNumberWithFloatError(actualDamage * atkUnit.battleContext.specialDamageRatioToHeal);
                let maxHpRatioToHealBySpecial =
                    atkUnit.battleContext.maxHpRatioToHealBySpecial +
                    atkUnit.battleContext.maxHpRatioToHealBySpecialPerAttack;
                healedHp += floorNumberWithFloatError(atkUnit.maxHpWithSkills * maxHpRatioToHealBySpecial);
                healedHp += atkUnit.battleContext.healedHpAfterAttackSpecialInCombat;

                if (atkUnit.passiveB === PassiveB.TaiyoNoUdewa) {
                    healedHp += floorNumberWithFloatError(actualDamage * 0.3);
                }

                this.__heal(atkUnit, healedHp, defUnit);
            }
        } else {
            // 通常攻撃
            let atkSpecialCountBefore = atkUnit.tmpSpecialCount
            let defSpecialCountBefore = defUnit.tmpSpecialCount
            if (atkUnit.battleContext.isBanePerAttack) {
                // 奥義発動時、軽減効果の計算前のダメージが「敵のHP-1」より低い時、そのダメージを「敵のHP-1」とする(巨影など一部の敵を除く)
                if (strikeResult.damage < defUnit.restHp - 1) {
                    if (this.isLogEnabled) {
                        let message = `${atkUnit.nameWithGroup}の瞬殺効果が発動`;
                        this.writeDebugLog(message);
                        this.writeSimpleLog(message);
                    }
                    strikeResult.damage = defUnit.restHp - 1;
                    strikeResult.isBaneStrike = true;
                }
            }
            [currentDamage, reducedDamage] = this.__calcUnitStrikeDamage(strikeResult, context);
            this.__reduceSpecialCount(atkUnit, atkUnit.battleContext.cooldownCountForAttack);
            if (!isDefenderSpecialActivated) {
                this.__reduceSpecialCount(defUnit, defUnit.battleContext.cooldownCountForDefense);
            }
            let atkSpecialCountAfter = atkUnit.tmpSpecialCount
            let defSpecialCountAfter = defUnit.tmpSpecialCount
            let specialSpan = n => `<span class='log-special'>${n}</span>`;
            let specialInfo = `${HtmlLogUtil.groupNameSpan(atkUnit)}: ${specialSpan(atkSpecialCountBefore)} → ${specialSpan(atkSpecialCountAfter)}, 
                                          ${HtmlLogUtil.groupNameSpan(defUnit)}: ${specialSpan(defSpecialCountBefore)} → ${specialSpan(defSpecialCountAfter)}`;
            if (this.isLogEnabled) this.writeLog(`通常攻撃によるダメージ<span class="log-damage">${currentDamage}</span>`);
            this.writeSimpleLog(`<div class="log-damage-line">${HtmlLogUtil.damageSpan(currentDamage)}（通常）${specialInfo}</div>`);
        }

        {
            let healHpAmount = this.__getHealAmountByAttack(atkUnit, defUnit, currentDamage, context);
            if (healHpAmount > 0) {
                if (this.isLogEnabled) this.writeDebugLog(`${atkUnit.getNameWithGroup()}は${healHpAmount}回復`);
                this.__heal(atkUnit, healHpAmount, defUnit);
            }
        }

        // 祈り処理
        // TODO: リファクタリング
        let reducedDamageByMiracle = 0;
        [totalDamage, reducedDamageByMiracle] = this.#activateMiracle(atkUnit, defUnit, currentDamage, totalDamage, strikeResult);
        this.#applyReducedDamageForNextAttack(
            atkUnit, defUnit,
            reducedDamage + reducedDamageByMiracle,
            strikeResult.isDefenderSpecialReady, context
        );
        strikeResult.reducedDamageIncludingMiracle = reducedDamage + reducedDamageByMiracle;

        // TODO: damageHistory.pushとapplySkillEffectsAfterAttackの順序について検討する
        combatResult.damageHistory.push(strikeResult.setDamageDealt(currentDamage));

        this.applySkillEffectsAfterAttack(atkUnit, defUnit, context);
        this.applySkillEffectsAfterAttack(defUnit, atkUnit, context);

        if (this.isLogEnabled) {
            this.writeDebugLog(defUnit.getNameWithGroup() + "の残りHP" + Math.max(0, defUnit.restHp - totalDamage) + "/" + defUnit.maxHpWithSkills);
        }

        return totalDamage;
    }

    setNeutralizesDamageReduction(atkUnit, attackResult, strikeResult) {
        let invalidatesDamageReductionExceptSpecialOnSpecialActivationInThisAttack =
            attackResult.neutralizesNonSpecialDamageReductionWhenSpecial ||
            atkUnit.battleContext.invalidatesDamageReductionExceptSpecialOnSpecialActivationPerAttack;
        let invalidatesOnSpecialActivation =
            strikeResult.isAttackerSpecialReady &&
            invalidatesDamageReductionExceptSpecialOnSpecialActivationInThisAttack &&
            !atkUnit.battleContext.preventedAttackerSpecial;
        // ダメージ軽減無効
        strikeResult.invalidatesDamageReduction =
            invalidatesOnSpecialActivation || attackResult.neutralizesNonSpecialDamageReduction;
    }

    applySpecialCountChangeAmountBeforeSecondStrike(unit) {
        let amount = unit.battleContext.getSpecialCountChangeAmountBeforeSecondStrikeAttack();
        let count = unit.tmpSpecialCount + amount;
        let isChanged = amount !== 0;
        if (isChanged) {
            let logClass = unit.groupId === UnitGroupType.Ally ? 'log-ally' : 'log-enemy';
            this.writeSimpleLog(`【<span class="${logClass}">奥義カウント(${unit.groupChar})</span>】
                                             <span class="log-special">${count}</span> = 
                                             ${unit.tmpSpecialCount} +
                                             ${unit.battleContext.specialCountIncreaseBeforeSecondStrike} -
                                             ${unit.battleContext.specialCountReductionBeforeSecondStrikeByEnemy}`);
        }
        unit.tmpSpecialCount = MathUtil.ensureMinMax(count, 0, unit.maxSpecialCount);
    }

    #getDamageReductionRatiosBySpecial(damageReductionRatiosByNonDefenderSpecial, defUnit, context) {
        if (context.isFollowupOrPotentFollowupAttack()) {
            // 追撃
            // damageReductionRatiosByNonDefenderSpecial.push(...defUnit.battleContext.getDamageReductionRatiosOfFollowupAttackBySpecial());
        } else {
            // 最初の攻撃と2回攻撃
            let ratios = defUnit.battleContext.getDamageReductionRatiosOfFirstAttacksBySpecial();
            damageReductionRatiosByNonDefenderSpecial.push(...ratios);
        }
    }

    static #applySkillEffectsOnSpecial(atkUnit, defUnit) {
        for (let skillId of atkUnit.enumerateSkills()) {
            switch (skillId) {
                case Weapon.ChildsCompass:
                    if (atkUnit.battleContext.restHpPercentage >= 25) {
                        // この戦闘中にすでにこの効果が発動済みの場合は[]ではなくnullが入るので処理を止める（1戦闘中1回まで）
                        if (atkUnit.battleContext.damageReductionRatiosOfNextAttackWhenSpecialActivated !== null) {
                            atkUnit.battleContext.damageReductionRatiosOfNextAttackWhenSpecialActivated.push(0.5);
                        }
                    }
                    break;
                case Special.DevinePulse: {
                    atkUnit.battleContext.damageReductionRatiosBySpecialOfNextAttack.push(0.75);
                    let spd = atkUnit.getSpdInCombat(defUnit);
                    atkUnit.battleContext.additionalDamageOfNextAttack += Math.trunc(spd * 0.2);
                }
                    break;
            }
        }
    }

    #activateMiracle(atkUnit, defUnit, currentDamage, totalDamage, strikeResult) {
        let reducedDamageByMiracle = 0;
        // 奥義による祈り
        let canActivateSpecialMiracle = this.__canActivateSpecialMiracle(defUnit, atkUnit);
        // 奥義以外による祈り
        let canActivateNonSpecialMiracle = this.__canActivateNonSpecialMiracle(defUnit, atkUnit);
        // 奥義による祈り(1マップ1回。現時点では存在しない)
        let canActivateSpecialOneTimePerMapMiracle = this.__canActivateSpecialOneTimePerMapMiracle(defUnit, atkUnit);
        // 奥義以外による祈り(1マップ1回)
        let canActivateNonSpecialOneTimePerMapMiracle = this.__canActivateNonSpecialOneTimePerMapMiracle(defUnit, atkUnit);
        // 奥義による祈り+99回復
        let canActivateSpecialMiracleAndHeal = this.__canActivateSpecialMiracleAndHeal(defUnit, atkUnit);
        // 奥義以外による祈り+99回復
        let canActivateNonSpecialMiracleAndHeal = this.__canActivateNonSpecialMiracleAndHeal(defUnit, atkUnit);

        // 祈りの消費優先順位
        // 1. 奥義以外の祈り+99回復
        // 2. 奥義以外の祈り
        // 3. 奥義以外の祈り(1マップ1回)
        // 4. 奥義による祈り(奥義祈り+99回復、奥義祈り、奥義祈り(1マップ1回)が同時に発動することはない)
        // TODO: 以下を検証する
        // 1戦闘で奥義以外の祈りの後に奥義の祈りを出すことは可能(奥義の祈りは戦闘中何回でも発動可能)
        // 1戦闘で奥義の祈りを出した後に奥義以外の祈りは発動可能か？

        // 奥義以外の祈り無効
        let neutralizesNoneSpecialMiracle = message => {
            if (this.isLogEnabled) {
                if (canActivateNonSpecialMiracle ||
                    canActivateNonSpecialOneTimePerMapMiracle ||
                    canActivateNonSpecialMiracleAndHeal) {
                    this.writeLog(message);
                    this.writeSimpleLog(message);
                }
            }
            canActivateNonSpecialMiracle = false;
            canActivateNonSpecialOneTimePerMapMiracle = false;
            canActivateNonSpecialMiracleAndHeal = false;
        }
        let groupClass = defUnit.groupId === UnitGroupType.Ally ? "log-ally" : "log-enemy";
        if (atkUnit.battleContext.neutralizesNonSpecialMiracle) {
            let message = `【祈り無効】<span class="${groupClass}">${defUnit.groupChar}</span>`;
            neutralizesNoneSpecialMiracle(message);
        }
        if (defUnit.hasStatusEffect(StatusEffectType.NeutralizeUnitSurvivesWith1HP)) {
            let name = getStatusEffectName(StatusEffectType.NeutralizeUnitSurvivesWith1HP);
            let message = `【祈り無効】<span class="${groupClass}">${defUnit.groupChar}</span>`;
            neutralizesNoneSpecialMiracle(message);
        }

        // 奥義/奥義以外による祈りの判定(ナンナなどの防御奥義不可はこの時点で既に考慮されている)
        let canActivateAnyMiracles =
            canActivateSpecialMiracle ||
            canActivateNonSpecialMiracle ||
            canActivateSpecialOneTimePerMapMiracle ||
            canActivateNonSpecialOneTimePerMapMiracle ||
            canActivateSpecialMiracleAndHeal ||
            canActivateNonSpecialMiracleAndHeal;
        let isRestHpGreaterOne = defUnit.restHp - totalDamage > 1;
        let isDeadWithoutMiracle = defUnit.restHp - totalDamage - currentDamage <= 0;

        if (canActivateAnyMiracles &&
            isRestHpGreaterOne &&
            isDeadWithoutMiracle) {
            strikeResult.isMiracleActivated = true;
            let logMiracle = message => {
                let result = `${message} ${HtmlLogUtil.groupNameSpan(defUnit)} ${currentDamage} → 
                ${HtmlLogUtil.damageSpan(defUnit.restHp - totalDamage - 1)}`;
                if (this.isLogEnabled) {
                    this.writeLog(result);
                    this.writeSimpleLog(result);
                }
            }
            // どの祈りが発動するのか判定する
            if (canActivateNonSpecialMiracleAndHeal) {
                logMiracle(`【奥義以外の祈り+99回復】 `);
                defUnit.battleContext.hasNonSpecialMiracleAndHealAcitivated = true;
            } else if (canActivateNonSpecialMiracle) {
                logMiracle(`【奥義以外の祈り】`);
                defUnit.battleContext.hasNonSpecialMiracleActivated = true;
            } else if (canActivateNonSpecialOneTimePerMapMiracle) {
                logMiracle(`【奥義以外の祈り(1マップ1回)】`);
                // TODO: リファクタリング(現状使用していない)
                defUnit.battleContext.hasNonSpecialOneTimePerMapMiracleAcitivated = true;
                // TODO: リファクタリング
                defUnit.battleContext.hasOncePerMapSpecialActivated = true;
                // 1マップ1回でない奥義以外の祈りも発動したとみなす
                defUnit.battleContext.hasNonSpecialMiracleActivated = true;
            } else if (canActivateSpecialMiracleAndHeal) {
                logMiracle(`【奥義による祈り+99回復】`);
                defUnit.battleContext.hasSpecialMiracleAndHealAcitivated = true;
            } else if (canActivateSpecialMiracle) {
                logMiracle(`【奥義による祈り】`);
                defUnit.battleContext.hasSpecialMiracleActivated = true;
            } else if (canActivateSpecialOneTimePerMapMiracle) {
                logMiracle(`【奥義による祈り(1マップ1回)】`);
                defUnit.battleContext.hasSpecialOneTimePerMapMiracleAcitivated = true;
            }

            // 祈りの軽減分も軽減ダメージに含める
            // @TODO: 現在の実装だとフィヨルムの氷の聖鏡に将来祈りが外付け出来るようになった場合も祈り軽減がダメージに加算されるのでその時にこの挙動が正しいのか検証する
            if (defUnit.battleContext.isNextAttackAddReducedDamageActivating) {
                let currentHp = defUnit.restHp - totalDamage;
                let miracleDamage = currentHp - 1;
                let miracleReducedDamage = currentDamage - miracleDamage;
                defUnit.battleContext.reducedDamageForNextAttack += miracleReducedDamage;
            }
            let currentHp = defUnit.restHp - totalDamage;
            reducedDamageByMiracle += currentDamage - (currentHp - 1);

            totalDamage += defUnit.restHp - totalDamage - 1;

            let hasActivatedAnySpecialMiracles =
                defUnit.battleContext.hasSpecialMiracleActivated ||
                defUnit.battleContext.hasSpecialOneTimePerMapMiracleAcitivated ||
                defUnit.battleContext.hasSpecialMiracleAndHealAcitivated;
            if (hasActivatedAnySpecialMiracles) {
                defUnit.battleContext.hasSpecialActivated = true;
                this.__restoreMaxSpecialCount(defUnit);
            }
        } else {
            totalDamage += currentDamage;
        }
        return [totalDamage, reducedDamageByMiracle];
    }

    /**
     * @param {number[]} damageReductionValues
     * @param {Unit} defUnit
     * @param {DamageCalcContext} context
     */
    static #applyDamageReductionValues(damageReductionValues, defUnit, context) {
        damageReductionValues.push(defUnit.battleContext.damageReductionValue);
        damageReductionValues.push(defUnit.battleContext.damageReductionValuePerAttack);
        if (context.isFollowupOrPotentFollowupAttack()) {
            // 追撃
            damageReductionValues.push(defUnit.battleContext.damageReductionValueOfFollowupAttack);
        } else {
            // 最初の攻撃
            damageReductionValues.push(defUnit.battleContext.damageReductionValueOfFirstAttacks);
            // 最初の攻撃の2回目
            if (context.attackCount === 2) {
                damageReductionValues.push(...defUnit.battleContext.damageReductionValueOfSecondStrikeOfFirstAttack);
            }
        }
    }

    #getDamageReductionRatioByPotent(atkUnit, context) {
        let potentRatio = 1;
        if (context.isPotentFollowupAttack) {
            if (!atkUnit.battleContext.overwritesPotentRatio()) {
                let ratio = atkUnit.battleContext.getMaxPotentRatio();
                let oldRatio = potentRatio;
                potentRatio *= ratio;
                this.writeDebugLog(`神速追撃による軽減。ratio: ${ratio}, damage ratio: ${oldRatio} → ${potentRatio}`);
                this.writeSimpleLog(`<div class="log-gray">【神速追撃:ダメージ${ratio * 100}%】</div>`)
            } else {
                let ratio = atkUnit.battleContext.getMaxPotentOverwriteRatio();
                this.writeDebugLog(`神速追撃上書き値による軽減。ratios: ${atkUnit.battleContext.potentRatios} → ratio: ${ratio}`);
                let oldRatio = potentRatio;
                potentRatio *= ratio;
                this.writeDebugLog(`神速追撃による軽減。ratio: ${ratio}, damage ratio: ${oldRatio} → ${potentRatio}`);
                this.writeSimpleLog(`<div class="log-gray">【神速追撃:ダメージ${ratio * 100}%】（上書き）</div>`)
            }
        }
        return potentRatio;
    }

    #applyDamageReductionByDefenderSpecial(strikeResult, context) {
        let attackResult = strikeResult.attackResult;
        let atkUnit = attackResult.atkUnit;
        let defUnit = attackResult.defUnit;
        let isDefenderSpecialActivated = false;
        let preventedDefenderSpecial =
            defUnit.battleContext.preventedDefenderSpecial ||
            defUnit.battleContext.preventedDefenderSpecialPerAttack;
        if (strikeResult.isDefenderSpecialReady && !preventedDefenderSpecial) {
            if (defUnit.battleContext.damageReductionRatioBySpecial > 0) {
                strikeResult.damageReductionRatiosByDefenderSpecial.push(defUnit.battleContext.damageReductionRatioBySpecial);
                if (defUnit.battleContext.canDamageReductionSpecialTriggerTwice) {
                    strikeResult.damageReductionRatiosByDefenderSpecial.push(defUnit.battleContext.damageReductionRatioBySpecial);
                }
                isDefenderSpecialActivated = true;
            }

            // 攻撃を受ける際に発動する奥義発動可能時に奥義を発動する処理
            if (isDefenderSpecialActivated) {
                strikeResult.isDefenderSpecialActive = true;
                defUnit.battleContext.hasSpecialActivated = true;
                defUnit.battleContext.specialActivatedCount++;
                strikeResult.damageReductionValues.push(defUnit.battleContext.damageReductionValueAfterSpecialTriggerTwice);
                // ダメージ軽減
                if (defUnit.passiveB === PassiveB.TateNoKodo3) {
                    strikeResult.damageReductionValues.push(5);
                } else if (defUnit.weapon === Weapon.MoonlightStone) {
                    if (atkUnit.battleContext.initiatesCombat ||
                        atkUnit.battleContext.restHpPercentage >= 75) {
                        strikeResult.damageReductionValues.push(8);
                    }
                } else if (defUnit.weapon === Weapon.IceBoundBrand) {
                    if (atkUnit.battleContext.initiatesCombat ||
                        atkUnit.battleContext.restHpPercentage >= 75) {
                        strikeResult.damageReductionValues.push(5);
                    }
                }
                // 次の攻撃のダメージ加算
                for (let skillId of defUnit.enumerateSkills()) {
                    switch (skillId) {
                        case PassiveB.Spurn4:
                            defUnit.battleContext.additionalDamageOfNextAttack += 5;
                            break;
                    }
                }
                // 奥義カウントを最大まで戻す
                this.__restoreMaxSpecialCount(defUnit);
                // 奥義発動直後のスキル効果（奥義カウント変動など）
                this.applySkillEffectAfterSpecialActivated(defUnit, atkUnit, context);

                if (defUnit.battleContext.invalidatesDamageReductionExceptSpecialForNextAttackAfterDefenderSpecial) {
                    defUnit.battleContext.invalidatesDamageReductionExceptSpecialForNextAttack = true;
                }
            }
        }
        return isDefenderSpecialActivated;
    }

    #applyDamageReductionByNoneDefenderSpecial(damageReductionRatiosByNonDefenderSpecial, atkUnit, defUnit,
                                               canActivateAttackerSpecial, context) {
        let env = new DamageCalculatorEnv(this, defUnit, atkUnit, canActivateAttackerSpecial, context);
        env.setBattleMap(context.damageCalcEnv.battleMap)
            .setGroupLogger(context.damageCalcEnv.getCurrentStrikeLogger())
            .setName('1戦闘に1回の奥義による軽減効果').setLogLevel(getSkillLogLevel()).setDamageType(context.damageType);
        AT_APPLYING_ONCE_PER_COMBAT_DAMAGE_REDUCTION_HOOKS.evaluateWithUnit(defUnit, env);
        for (let skillId of defUnit.enumerateSkills()) {
            let func = getSkillFunc(skillId, applyNTimesDamageReductionRatiosByNonDefenderSpecialFuncMap);
            func?.call(this, atkUnit, defUnit);
            switch (skillId) {
                case Special.DragonBlast:
                    if (Unit.canActivateOrActivatedSpecialEither(atkUnit, defUnit)) {
                        if (defUnit.battleContext.specialSkillCondSatisfied) {
                            defUnit.battleContext.nTimesDamageReductionRatiosByNonDefenderSpecial.push(0.4);
                        }
                    }
                    break;
                case Special.ArmoredFloe:
                case Special.ArmoredBeacon:
                    if (Unit.canActivateOrActivatedSpecialEither(atkUnit, defUnit)) {
                        if (isRangedWeaponType(atkUnit.weaponType)) {
                            defUnit.battleContext.nTimesDamageReductionRatiosByNonDefenderSpecial.push(0.4);
                        }
                    }
                    break;
            }
        }
        // 1戦闘に1回しか発動しない盾形でない奥義でのダメージ軽減
        let currentCount = defUnit.battleContext.nTimesDamageReductionRatiosByNonDefenderSpecialCount;
        let additionalCount = defUnit.battleContext.additionalNTimesDamageReductionRatiosByNonDefenderSpecialCount;
        if (currentCount < 1 + additionalCount) {
            if (defUnit.battleContext.nTimesDamageReductionRatiosByNonDefenderSpecial.length > 0) {
                this.writeDebugLog(`${defUnit.nameWithGroup}は1戦闘にN回しか発動しない奥義効果によるダメージ軽減を発動可能。軽減: [${defUnit.battleContext.nTimesDamageReductionRatiosByNonDefenderSpecial}], 発動回数: ${currentCount}, 追加発動: ${additionalCount}`);
                defUnit.battleContext.nTimesDamageReductionRatiosByNonDefenderSpecialCount++;
                for (let ratio of defUnit.battleContext.nTimesDamageReductionRatiosByNonDefenderSpecial) {
                    damageReductionRatiosByNonDefenderSpecial.push(ratio);
                    this.writeDebugLog(`1戦闘N回の奥義によるダメージ軽減。ratio: ${ratio}`);
                }
                defUnit.battleContext.nTimesDamageReductionRatiosByNonDefenderSpecial = [];
            }
        } else {
            defUnit.battleContext.nTimesDamageReductionRatiosByNonDefenderSpecial = [];
        }
        let engageCount = defUnit.battleContext.nTimesDamageReductionRatiosByEngageSpecialCount;
        if (engageCount < 1) {
            if (defUnit.battleContext.nTimesDamageReductionRatiosByEngageSpecial.length > 0) {
                this.writeDebugLog(`${defUnit.nameWithGroup}は1戦闘に1回しか発動しないエンゲージ効果によるダメージ軽減を発動可能。軽減: [${defUnit.battleContext.nTimesDamageReductionRatiosByEngageSpecial}], 発動回数: ${engageCount}`);
                defUnit.battleContext.nTimesDamageReductionRatiosByEngageSpecialCount++;
                for (let ratio of defUnit.battleContext.nTimesDamageReductionRatiosByEngageSpecial) {
                    damageReductionRatiosByNonDefenderSpecial.push(ratio);
                    this.writeDebugLog(`1戦闘1回のエンゲージによるダメージ軽減。ratio: ${ratio}`);
                }
                defUnit.battleContext.nTimesDamageReductionRatiosByEngageSpecial = [];
            }
        }
        // 防御系奥義以外によるダメージ軽減
        let reductionRatios = defUnit.battleContext.damageReductionRatiosByNonDefenderSpecial;
        if (reductionRatios.length > 0) {
            for (let ratio of reductionRatios) {
                damageReductionRatiosByNonDefenderSpecial.push(ratio);
                this.writeDebugLog(`防御系奥義以外の奥義によるダメージ軽減。ratio: ${ratio}`);
            }
        }

        // 攻撃ごとに変化する可能性のある奥義扱いのダメージ軽減
        damageReductionRatiosByNonDefenderSpecial.push(...defUnit.battleContext.damageReductionRatiosBySpecialPerAttack);

        // 奥義の次の攻撃のダメージ軽減
        damageReductionRatiosByNonDefenderSpecial.push(...defUnit.battleContext.damageReductionRatiosBySpecialOfNextAttack);
        defUnit.battleContext.damageReductionRatiosBySpecialOfNextAttack = [];
    }

    #getDamageReductionRatios(atkUnit, defUnit, context) {
        let damageReductionRatios = [];
        // 計算機の外側で設定されたダメージ軽減率
        damageReductionRatios.push(...defUnit.battleContext.getDamageReductionRatios());

        if (context.isFirstStrike(atkUnit)) {
            // 初回攻撃(2回攻撃の場合2回攻撃の最初の1回のみ)
            damageReductionRatios.push(...defUnit.battleContext.getDamageReductionRatiosOfFirstAttack());
        } else if (context.isConsecutiveAttack(atkUnit)) {
            // 連続した攻撃
            damageReductionRatios.push(...defUnit.battleContext.getDamageReductionRatiosOfConsecutiveAttacks());
        }

        if (context.isFollowupOrPotentFollowupAttack()) {
            // 追撃
            damageReductionRatios.push(...defUnit.battleContext.getDamageReductionRatiosOfFollowupAttack());
        } else {
            // 最初の攻撃と2回攻撃
            damageReductionRatios.push(...defUnit.battleContext.getDamageReductionRatiosOfFirstAttacks());
        }

        // 戦闘中1回の軽減効果
        // 奥義による攻撃でダメージを与えた時、次の敵の攻撃のダメージを50%軽減(その戦闘中のみ)
        if (defUnit.battleContext.damageReductionRatiosOfNextAttackWhenSpecialActivated !== null) {
            damageReductionRatios.push(
                ...defUnit.battleContext.damageReductionRatiosOfNextAttackWhenSpecialActivated
            );
            // 1戦闘に1回しか発動しないので発動後はnullをいれる（初期値は[]）
            defUnit.battleContext.damageReductionRatiosOfNextAttackWhenSpecialActivated = null;
        }

        // チェインガード
        for (let [unit, ratio] of defUnit.battleContext.damageReductionRatiosByChainGuard) {
            if (this.isLogEnabled) {
                this.writeDebugLog(`${unit.nameWithGroup}によるチェインガードによるダメージ軽減。ratio: [${ratio}]`);
            }
            damageReductionRatios.push(ratio);
            unit.battleContext.isChainGuardActivated = true;
        }
        return damageReductionRatios;
    }

    /**
     * @param {StrikeResult} strikeResult
     * @returns {number[]}
     */
    #getNeutralizationOfDamageReduction(strikeResult) {
        let atkUnit = strikeResult.attackResult.atkUnit;
        let neutralizationRatiosOfDamageReduction =
            atkUnit.battleContext.reductionRatiosOfDamageReductionRatioExceptSpecial;
        // ダメージ軽減をN%無効
        // 奥義発動時のダメージ軽減無効
        if (strikeResult.canActivateAttackerSpecial) {
            let ratios = atkUnit.battleContext.reductionRatiosOfDamageReductionRatioExceptSpecialOnSpecialActivation;
            neutralizationRatiosOfDamageReduction.push(...ratios);
        }

        let reductionRatiosPerAttack = atkUnit.battleContext.reductionRatiosOfDamageReductionRatioExceptSpecialPerAttack;
        neutralizationRatiosOfDamageReduction.push(...reductionRatiosPerAttack);

        let neutralizeOne = (accum, current) => accum - MathUtil.truncByPercentage(accum * current);
        let neutralizeAll = r => neutralizationRatiosOfDamageReduction.reduce(neutralizeOne, r);
        let damageReductionRatiosAfterNeutralization = [];
        damageReductionRatiosAfterNeutralization.push(...strikeResult.damageReductionRatios.map(neutralizeAll));
        // ダメージ軽減を無効
        if (strikeResult.invalidatesDamageReduction) {
            if (this.isLogEnabled) this.writeDebugLog("奥義以外のダメージ軽減を無効化");
            damageReductionRatiosAfterNeutralization.fill(0);
        }
        this.writeDebugLog(`ダメージ軽減: [${strikeResult.damageReductionRatios}]`);
        this.writeDebugLog(`ダメージ軽減をn%無効: [${neutralizationRatiosOfDamageReduction}]`)
        this.writeDebugLog(`軽減無効後のダメージ軽減: [${damageReductionRatiosAfterNeutralization}]`);
        return damageReductionRatiosAfterNeutralization;
    }

    /**
     * 戦闘ごとに変化する可能性がある奥義扱いのダメージ軽減
     * @param {Unit} targetUnit
     * @param {Unit} enemyUnit
     * @param {DamageCalcContext} context
     */
    #applySpecialDamageReductionPerAttack(targetUnit, enemyUnit, context) {
        for (let skillId of targetUnit.enumerateSkills()) {
            let func = getSkillFunc(skillId, applySpecialDamageReductionPerAttackFuncMap);
            func?.call(this, targetUnit, enemyUnit, context);
        }
    }

    /**
     * @param {Unit} targetUnit
     * @param {Unit} enemyUnit
     * @param {DamageCalcContext} context
     */
    applySkillEffectAfterSpecialActivated(targetUnit, enemyUnit, context) {
        if (targetUnit.battleContext.specialCountReductionAfterFirstSpecial > 0 &&
            targetUnit.battleContext.specialActivatedCount === 1) {
            this.writeDebugLog(`${targetUnit.nameWithGroup}の奥義発動直後の奥義カウントが${targetUnit.tmpSpecialCount}から1減少`);
            this.__reduceSpecialCount(targetUnit, targetUnit.battleContext.specialCountReductionAfterFirstSpecial);
        }
        for (let skillId of targetUnit.enumerateSkills()) {
            let func = getSkillFunc(skillId, applySkillEffectAfterSpecialActivatedFuncMap);
            func?.call(this, targetUnit, enemyUnit, context);
            switch (skillId) {
                case Special.SupremeAstra:
                    if (!targetUnit.isOneTimeActionActivatedForSpecial) {
                        if (context.damageType === DamageType.ActualDamage) {
                            targetUnit.isOneTimeActionActivatedForSpecial = true;
                        }
                        this.writeDebugLog(`${targetUnit.nameWithGroup}の奥義発動直後の奥義カウントが${targetUnit.tmpSpecialCount}から1減少`);
                        this.__reduceSpecialCount(targetUnit, 1);
                    }
                    break;
            }
        }
    }

    /**
     * @param {Unit} targetUnit
     * @param {Unit} enemyUnit
     * @param {StrikeResult} strikeResult
     * @param {DamageCalcContext} context
     */
    __applySkillEffectsPerAttack(targetUnit, enemyUnit, strikeResult, context) {
        let canActivateAttackerSpecial = strikeResult.canActivateAttackerSpecial;
        let env = new DamageCalculatorEnv(this, targetUnit, enemyUnit, canActivateAttackerSpecial, context);

        env.setName('攻撃開始時').setLogLevel(getSkillLogLevel()).setDamageType(context.damageType)
            .setGroupLogger(context.damageCalcEnv.getCurrentStrikeLogger());
        targetUnit.battleContext.applySkillEffectPerAttackNodes.map(node => node.evaluate(env));
        AT_START_OF_ATTACK_HOOKS.evaluateWithUnit(targetUnit, env);
        for (let skillId of targetUnit.enumerateSkills()) {
            let func = getSkillFunc(skillId, applySkillEffectsPerAttackFuncMap);
            func?.call(this, targetUnit, enemyUnit, canActivateAttackerSpecial, context);
            switch (skillId) {
                case Weapon.GustyWarBow:
                    if (targetUnit.battleContext.weaponSkillCondSatisfied) {
                        let isSpecialCharged = targetUnit.hasSpecial && targetUnit.tmpSpecialCount === 0;
                        if (isSpecialCharged || targetUnit.battleContext.hasSpecialActivated) {
                            targetUnit.battleContext.additionalDamagePerAttack += 7;
                        }
                    }
                    break;
                case Weapon.SisterlyWarAxe:
                    if (targetUnit.battleContext.weaponSkillCondSatisfied && canActivateAttackerSpecial) {
                        enemyUnit.battleContext.preventedDefenderSpecialPerAttack = true;
                        targetUnit.battleContext.invalidatesDamageReductionExceptSpecialOnSpecialActivationPerAttack = true;
                    }
                    break;
                case Weapon.Sekuvaveku:
                    if (targetUnit.isWeaponRefined && targetUnit.battleContext.weaponSkillCondSatisfied) {
                        let isSpecialCharged = targetUnit.hasSpecial && targetUnit.tmpSpecialCount === 0;
                        if (isSpecialCharged || targetUnit.battleContext.hasSpecialActivated) {
                            targetUnit.battleContext.additionalDamagePerAttack += 5;
                            targetUnit.battleContext.healedHpByAttackPerAttack += 7;
                        }
                    }
                    break;
                case Special.GodlikeReflexes:
                    if (targetUnit.getEvalSpdInCombat(enemyUnit) >= enemyUnit.getEvalSpdInCombat(targetUnit) - 4) {
                        let isSpecialCharged = targetUnit.hasSpecial && targetUnit.tmpSpecialCount === 0;
                        if (isSpecialCharged || targetUnit.battleContext.hasSpecialActivated) {
                            targetUnit.battleContext.additionalDamagePerAttack += Math.trunc(targetUnit.getSpdInCombat(enemyUnit) * 0.15);
                        }
                    }
                    break;
                case Weapon.Misteruthin:
                    if (targetUnit.isWeaponSpecialRefined && targetUnit.battleContext.weaponSkillCondSatisfied) {
                        targetUnit.battleContext.addSpecialAddDamagePerAttack(
                            MathUtil.ensureMax(targetUnit.maxHpWithSkills - targetUnit.restHp, 30)
                        );
                    }
                    break;
            }
        }
    }

    __isSatisfiedDefenderSpecialCond(defUnit, atkUnit) {
        for (let skillId of defUnit.enumerateSkills()) {
            switch (skillId) {
                case Special.GodlikeReflexes:
                    return defUnit.getEvalSpdInCombat(atkUnit) >= atkUnit.getEvalSpdInCombat(defUnit) - 4;
            }
        }
        return true;
    }

    __getHealAmountByAttack(targetUnit, defUnit, currentDamage, context) {
        let healedHp = targetUnit.battleContext.healedHpByAttack + targetUnit.battleContext.healedHpByAttackPerAttack;
        if (context.isFollowupOrPotentFollowupAttack()) {
            healedHp += targetUnit.battleContext.healedHpByFollowupAttack;
        }
        healedHp += floorNumberWithFloatError(currentDamage * targetUnit.battleContext.damageRatioToHeal);
        return healedHp;
    }

    /**
     * 奥義による祈りが発動可能か調べる。
     * 奥義カウント、奥義発動できない状態なども考慮される。
     * @param {Unit} unit 祈りが発動するか調べる対象
     * @param {Unit} atkUnit
     * @return {boolean}
     */
    __canActivateSpecialMiracle(unit, atkUnit) {
        if (unit.battleContext.isDefenderSpecialPrevented()) {
            return false;
        }
        switch (unit.special) {
            case Special.Miracle:
                if (unit.battleContext.preventedDefenderSpecial) return false;
                if (unit.tmpSpecialCount === 0) return true;
                break;
        }
        return false;
    }

    /**
     * 奥義以外による祈りが発動可能か調べる。
     * 祈り無効は考慮されない。
     * @param {Unit} unit 祈りが発動するか調べる対象
     * @param {Unit} atkUnit
     * @return {boolean}
     */
    __canActivateNonSpecialMiracle(unit, atkUnit) {
        if (unit.battleContext.hasAnyNonSpecialMiracleActivated()) return false;
        if (unit.battleContext.isNonSpecialMiracleNeutralized ||
            atkUnit.battleContext.neutralizesNonSpecialMiracle) {
            return false;
        }
        if (unit.battleContext.canActivateNonSpecialMiracle) {
            let threshold = unit.battleContext.nonSpecialMiracleHpPercentageThreshold;
            if (threshold !== Number.MAX_SAFE_INTEGER) {
                if (unit.restHpPercentage >= threshold) {
                    return true;
                }
            }
        }
        for (let func of unit.battleContext.canActivateNonSpecialMiracleFuncs) {
            if (func(unit, atkUnit)) {
                return true;
            }
        }
        return false;
    }

    /**
     * 奥義による1マップ1回の祈りが発動可能か調べる。
     * 奥義カウント、奥義発動できない状態なども考慮される。
     * @param {Unit} unit 祈りが発動するか調べる対象
     * @param {Unit} atkUnit
     * @return {boolean}
     */
    __canActivateSpecialOneTimePerMapMiracle(unit, atkUnit) {
        return false;
    }

    /**
     * 奥義以外による1マップ1回の祈りが発動可能か調べる。
     * 祈り無効は考慮されない。
     * @param {Unit} unit 祈りが発動するか調べる対象
     * @param {Unit} atkUnit
     * @return {boolean}
     */
    __canActivateNonSpecialOneTimePerMapMiracle(unit, atkUnit) {
        if (unit.battleContext.hasAnyNonSpecialMiracleActivated()) return false;
        for (let func of unit.battleContext.canActivateNonSpecialOneTimePerMapMiracleFuncs) {
            if (func(unit, atkUnit)) {
                return true;
            }
        }
        return false;
    }

    /**
     * 奥義による祈り+99回復が発動可能か調べる。
     * 奥義カウント、奥義発動できない状態なども考慮される。
     * @param {Unit} unit 祈りが発動するか調べる対象
     * @param {Unit} atkUnit
     * @return {boolean}
     */
    __canActivateSpecialMiracleAndHeal(unit, atkUnit) {
        if (unit.battleContext.isDefenderSpecialPrevented()) {
            return false;
        }
        if (unit.tmpSpecialCount !== 0) return false;
        return MIRACLE_AND_HEAL_SPECIAL_SET.has(unit.special);
    }

    /**
     * 奥義以外による祈り+99回復が発動可能か調べる。
     * 祈り無効は考慮されない。
     * @param {Unit} unit 祈りが発動するか調べる対象
     * @param {Unit} atkUnit
     * @return {boolean}
     */
    __canActivateNonSpecialMiracleAndHeal(unit, atkUnit) {
        if (unit.battleContext.hasAnyNonSpecialMiracleActivated()) return false;
        return unit.battleContext.canActivateNonSpecialMiracleAndHeal;
    }

    /**
     * 戦闘中の攻撃後の回復
     * @param {Unit} unit
     * @param {number} healedHp
     * @param {Unit} enemyUnit
     */
    __heal(unit, healedHp, enemyUnit) {
        let healAmount = healedHp;
        // 回復不可の場合、元の回復量分だけ回復量を減らす
        let reducedHeal = unit.calculateReducedHealAmountInCombat(healAmount);
        healAmount -= reducedHeal;

        unit.restHp += healAmount;
        if (unit.restHp > unit.maxHpWithSkills) {
            unit.restHp = unit.maxHpWithSkills;
        }
        if (this.isLogEnabled) {
            let healMessage = `<span class="log-heal">${healAmount}回復</span>(-${reducedHeal})(${unit.groupChar}): HP=${unit.restHp}/${unit.maxHpWithSkills}`;
            let message = `<div class="log-heal-line">${healMessage}</div>`;
            this.writeDebugLog(healMessage);
            if (healedHp > 0) {
                this.writeSimpleLog(message);
            }
        }
    }

    /**
     * @param {StrikeResult} strikeResult
     * @param {DamageCalcContext} context
     * @returns {[number, number]} current damage and reduced damage
     */
    __calcUnitStrikeDamage(strikeResult, context) {
        let atkUnit = strikeResult.atkUnit;
        let defUnit = strikeResult.defUnit;

        let damage = strikeResult.getDamage();

        // 軽減効果の計算前のダメージが「敵のHP-1」より低い時、そのダメージを「敵のHP-1」とする
        // （巨影など一部の敵を除く）
        strikeResult.damageReductionValue = strikeResult.damageReductionValues.reduce((a, c) => a + c, 0);
        strikeResult.damageReductionRatios = [
            ...strikeResult.damageReductionRatiosAfterNeutralization,
            ...strikeResult.damageReductionRatiosByDefenderSpecial,
            ...strikeResult.damageReductionRatiosByNonDefenderSpecial
        ];
        // TODO: 軽減が重なった場合の計算について調査する
        // 軽減の計算
        strikeResult.damageRatio = strikeResult.damageReductionRatios.reduce((a, c) => a * (1 - c), 1);
        strikeResult.damageReductionRatio = 1 - strikeResult.damageRatio;
        strikeResult.reducedDamage =
            Math.trunc(damage * strikeResult.damageReductionRatio) + strikeResult.damageReductionValue;
        // 別の計算方法
        let reduced = 0;
        let remaining = damage;
        for (const r of strikeResult.damageReductionRatios) {
            const reducedThisStep = Math.trunc(remaining * r); // この軽減で減る分
            reduced += reducedThisStep;
            remaining = Math.max(0, remaining - reducedThisStep);
        }
        let reducedDamage = reduced + strikeResult.damageReductionValue;
        // 2つの計算方法が異なる場合は警告を出す
        if (strikeResult.reducedDamage !== reducedDamage &&
            this.isLogEnabled &&
            context.damageType === DamageType.ActualDamage) {
            console.warn("strikeResult.reducedDamage !== reducedDamage");
            console.warn(`strikeResult.reducedDamage: ${strikeResult.reducedDamage}`);
            console.warn(`reducedDamage: ${reducedDamage}`);
            console.warn(`damage: ${damage}`);
            console.warn(`strikeResult.damageReductionRatios: ${strikeResult.damageReductionRatios}`);
            console.warn(`JSON.stringify(strikeResult, null, 2): ${JSON.stringify(strikeResult, null, 2)}`);
        }

        let potentRatio = strikeResult.potentRatio;
        strikeResult.damageAfterReductionValue = Math.max(damage - strikeResult.reducedDamage, 0);
        let currentDamage = Math.trunc(strikeResult.damageAfterReductionValue * potentRatio);
        strikeResult.selfDamageReductionRatios = atkUnit.battleContext.damageCalculationRatios;
        for (let ratio of atkUnit.battleContext.damageCalculationRatios) {
            currentDamage = Math.trunc(currentDamage * ratio);
        }
        if (strikeResult.reducesDamageFromFoeToZeroDuringCombat) {
            currentDamage = 0;
        }
        strikeResult.actualDamage = currentDamage;
        if (this.isLogEnabled) {
            this.writeDebugLog(`ダメージ軽減計算開始`);
            this.writeDebugLog(`軽減前ダメージ: ${damage}`);
            let attackResult = strikeResult.attackResult;
            this.writeDebugLog(`固定ダメージ(合計): ${attackResult.getTotalAdditionalDamage(strikeResult.isAttackerSpecialActive) + strikeResult.getTotalAdditionalDamage()}`);
            this.writeDebugLog(`固定ダメージ(通常): ${attackResult.additionalDamage}`);
            this.writeDebugLog(`固定ダメージ(奥義): ${attackResult.specialAdditionalDamage}`);
            this.writeDebugLog(`固定ダメージ(攻撃毎通常): ${strikeResult.additionalDamage}`);
            this.writeDebugLog(`固定ダメージ(攻撃毎奥義): ${strikeResult.specialAdditionalDamage}`);
            this.writeDebugLog(`ダメージ軽減率(奥義以外): [${strikeResult.damageReductionRatiosAfterNeutralization}]`);
            this.writeDebugLog(`ダメージ軽減率(守備奥義): [${strikeResult.damageReductionRatiosByDefenderSpecial}]`);
            this.writeDebugLog(`ダメージ軽減率(奥義扱い): [${strikeResult.damageReductionRatiosByNonDefenderSpecial}]`);
            this.writeDebugLog(`最終ダメージ率: ${floorNumberWithFloatError(strikeResult.damageRatio * 100)}%`);
            this.writeDebugLog(`最終ダメージ軽減率: ${floorNumberWithFloatError(strikeResult.damageReductionRatio * 100)}%`);
            this.writeDebugLog(`固定ダメージ軽減値: -${strikeResult.damageReductionValue} ([${strikeResult.damageReductionValues}])`);
            this.writeDebugLog(`神速追撃ダメージ倍率: ${floorNumberWithFloatError(potentRatio * 100)}%`);
            this.writeDebugLog(`ダメージ計算: (${damage} - trunc(${damage} * ${roundFloat(strikeResult.damageReductionRatio)})) - ${strikeResult.damageReductionValue}) * ${potentRatio} = ${currentDamage}`);
            this.writeDebugLog(`ダメージ計算2: ((${damage} - ${Math.trunc(damage * strikeResult.damageReductionRatio)}) - ${strikeResult.damageReductionValue}) * ${potentRatio} = ${currentDamage}`);
            this.writeDebugLog(`ダメージ計算3: (${damage - Math.trunc(damage * strikeResult.damageReductionRatio)} - ${strikeResult.damageReductionValue}) * ${potentRatio} = ${currentDamage}`);
            this.writeDebugLog(`実質ダメージ軽減値: ${strikeResult.damageReductionValue} * ${1 / strikeResult.damageRatio} = ${Math.trunc(strikeResult.damageReductionValue / strikeResult.damageRatio)}`);
            this.writeDebugLog(`0ダメージに軽減: ${defUnit.battleContext.reducesDamageFromFoeToZeroDuringCombat}`);
            this.writeDebugLog(`ダメージ変化: ${damage}→${currentDamage} (${damage - currentDamage}軽減)`);
            if (defUnit.battleContext.reducesDamageFromFoeToZeroDuringCombat) {
                this.writeSimpleLog(`【ダメージを0に】`);
            }
        }

        if (strikeResult.isDefenderSpecialReady && !defUnit.battleContext.preventedDefenderSpecial) {
            for (let skillId of defUnit.enumerateSkills()) {
                let func = getSkillFunc(skillId, activatesNextAttackSkillEffectAfterSpecialActivatedFuncMap);
                func?.call(this, defUnit, atkUnit);
            }
            switch (defUnit.special) {
                case Special.IceMirror2:
                    if (atkUnit.getActualAttackRange(defUnit) !== 2) break;
                    defUnit.battleContext.isNextAttackEffectAfterSpecialActivating = true;
                    break;
                case Special.NegatingFang:
                    defUnit.battleContext.isNextAttackEffectAfterSpecialActivating = true;
                    break;
            }
        }

        // 自分の次の攻撃の時にダメージ軽減加算をするための処理
        // 差し違え4などの相手のダメージだけで決まる軽減ダメージ追加はここで計算する
        // 祈りも考慮した軽減ダメージ追加は祈りの処理の時に行う
        if (defUnit.battleContext.reducedRatioForNextAttack > 0) {
            if (context.isFirstStrike(atkUnit)) {
                defUnit.battleContext.additionalDamageOfNextAttackByDamageRatio =
                    Math.trunc(damage * defUnit.battleContext.reducedRatioForNextAttack);
            }
        }

        return [currentDamage, damage - currentDamage];
    }

    /**
     * @param {Unit} atkUnit
     * @param {Unit} defUnit
     * @param {number} reducedDamage
     * @param {boolean} activatesDefenderSpecial
     * @param {DamageCalcContext} context
     */
    #applyReducedDamageForNextAttack(atkUnit, defUnit, reducedDamage, activatesDefenderSpecial, context) {
        // ダメージ反射
        if (context.isFirstStrike(atkUnit)) {
            for (let rate of defUnit.battleContext.firstAttackReflexDamageRates) {
                defUnit.battleContext.reflexDamagesAndRatesForNextAttack.push([reducedDamage, rate]);
            }
        }
        if (activatesDefenderSpecial && !defUnit.battleContext.preventedDefenderSpecial) {
            if (defUnit.battleContext.canAddDamageReductionToNextAttackAfterSpecial) {
                defUnit.battleContext.isNextAttackAddReducedDamageActivating = true;
                let addition = reducedDamage;
                addition = MathUtil.ensureMin(addition, defUnit.battleContext.nextAttackMinAdditionAfterSpecial);
                defUnit.battleContext.reducedDamageForNextAttack = addition;
            }
        }
        switch (defUnit.special) {
            case Special.FrostbiteMirror:
                if (activatesDefenderSpecial && !defUnit.battleContext.preventedDefenderSpecial) {
                    defUnit.battleContext.isNextAttackAddReducedDamageActivating = true;
                    defUnit.battleContext.reducedDamageForNextAttack = reducedDamage;
                }
                break;
        }
    }

    __restoreMaxSpecialCount(unit) {
        if (this.isLogEnabled) this.writeDebugLog(unit.getNameWithGroup() + "の奥義カウント" + unit.tmpSpecialCount + "→" + unit.maxSpecialCount);
        unit.tmpSpecialCount = unit.maxSpecialCount;
    }

    __reduceSpecialCount(unit, reduceSpCount) {
        if (!unit.hasSpecial) {
            return;
        }

        let currentSpCount = unit.tmpSpecialCount;
        unit.tmpSpecialCount -= reduceSpCount;
        if (unit.tmpSpecialCount < 0) {
            unit.tmpSpecialCount = 0;
        }
        if (this.isLogEnabled) this.writeDebugLog(unit.getNameWithGroup() + "の奥義カウント" + currentSpCount + "→" + unit.tmpSpecialCount);
    }
}
