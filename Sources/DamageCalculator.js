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

/// ダメージ計算時の1回攻撃分のログです。
class DamageLog {
    constructor(attackUnit, attackedUnit, damageDealt) {
        this.attackUnit = attackUnit;
        this.attackedUnit = attackedUnit;
        this.damageDealt = damageDealt;
    }

    /**
     *
     * @param {DamageCalcContext} context
     * @returns {DamageLog}
     */
    setAttackType(context) {
        this.isCounterattack = context.isCounterattack;
        this.isFollowupAttack = context.isFollowupAttack;
        this.isPotentFollowupAttack = context.isPotentFollowupAttack;
        return this;
    }
}

/// ダメージ計算時に一時的に使用するコンテキストです。
class DamageCalcContext {
    constructor() {
        // isFollowupAttackはisPotentFollowupAttackを含む(isPotentFollowupAttackであれば常にisFollowupAttackも満たす)
        this.isCounterattack = false;
        this.isFollowupAttack = false;
        this.isPotentFollowupAttack = false;
        /** @type {DamageLog[]} */
        this.damageHistory = []; // 攻撃ダメージの履歴
        this.damageType = DamageType.ActualDamage;
    }

    /**
     * 引数のユニットが攻撃したログを取得。
     * @params {Unit} attackUnit
     * @returns {DamageLog[]}
     */
    getAttackLogs(attackUnit) {
        return this.damageHistory.filter(log => log.attackUnit === attackUnit);
    }

    isFirstAttack(atkUnit) {
        for (let log of this.damageHistory) {
            if (log.attackUnit === atkUnit) {
                return false;
            }
        }

        return true;
    }

    isConsecutiveAttack(atkUnit) {
        let lastLog = this.damageHistory[this.damageHistory.length - 1];
        return lastLog ? lastLog.attackUnit === atkUnit : false;
    }

    isFollowupOrPotentFollowupAttack() {
        return this.isFollowupAttack || this.isPotentFollowupAttack;
    }

    isFirstFollowupAttack(atkUnit) {
        let isFollowupAttacked =
            this.damageHistory.some(log => log.attackUnit === atkUnit && log.isFollowupAttack);
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

class OneAttackResult {
    constructor(damage, specialDamage, atkCountPerOneAttack) {
        this.damagePerAttack = damage;
        this.specialDamagePerAttack = specialDamage;
        this.attackCount = atkCountPerOneAttack;
    }
}

/// ダメージ計算結果を表すクラスです。
class DamageCalcResult {
    constructor() {
        /** @type {DamageLog[]} */
        this.damageHistory = [];
        this.atkUnit_totalAttackCount = 0;
        this.defUnit_totalAttackCount = 0;
        this.atkUnit_actualTotalAttackCount = 0;
        this.defUnit_actualTotalAttackCount = 0;
        this.atkUnit_normalAttackDamage = 0;
        this.defUnit_normalAttackDamage = 0;
        this.atkUnit_specialAttackDamage = 0;
        this.defUNit_specialAttackDamage = 0;
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

        this.preCombatDamage = 0;
        this.preCombatDamageWithOverkill = 0;

        this.atkUnitDamageAfterBeginningOfCombat = 0;
        this.defUnitDamageAfterBeginningOfCombat = 0;

        // 護り手ユニットかそうでないかを後で区別できるよう結果に戦ったユニットを記録しておく
        this.defUnit = null;

        this.atkTile = null;
        this.defTile = null;
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
     * @param  {Unit} atkUnit 攻撃をするユニットです。
     * @param  {Unit} defUnit 攻撃を受けるユニットです。
     * @param  {number} damageType 潜在ダメージ計算かどうかを指定します。
     */
    calcCombatResult(atkUnit, defUnit, damageType) {
        // 初期化
        let context = new DamageCalcContext();
        context.damageType = damageType;
        let result = new DamageCalcResult();
        result.defUnit = defUnit;
        result.atkUnit_atk = atkUnit.getAtkInCombat(defUnit);
        result.atkUnit_spd = atkUnit.getSpdInCombat(defUnit);
        result.atkUnit_def = atkUnit.getDefInCombat(defUnit);
        result.atkUnit_res = atkUnit.getResInCombat(defUnit);
        result.atkUnit_specialCount = atkUnit.specialCount;
        result.defUnit_specialCount = defUnit.specialCount;

        result.defUnit_atk = defUnit.getAtkInCombat(atkUnit);
        result.defUnit_spd = defUnit.getSpdInCombat(atkUnit);
        result.defUnit_def = defUnit.getDefInCombat(atkUnit);
        result.defUnit_res = defUnit.getResInCombat(atkUnit);

        // 戦闘中ダメージ計算
        if (this.isLogEnabled) this.writeDebugLog("戦闘中ダメージ計算..");

        // 戦闘開始後効果 (ex) 戦闘後ダメージなど
        this.__activateEffectAfterBeginningOfCombat(atkUnit, defUnit);
        this.__activateEffectAfterBeginningOfCombat(defUnit, atkUnit);

        // 戦闘開始後ダメージの後のスキル効果
        this.__activateEffectAfterAfterBeginningOfCombatSkills(atkUnit, defUnit);
        this.__activateEffectAfterAfterBeginningOfCombatSkills(defUnit, atkUnit);

        // atkUnitが受けるダメージはdefUnitが与えるダメージとして表示する
        result.atkUnitDamageAfterBeginningOfCombat = defUnit.battleContext.getMaxDamageAfterBeginningOfCombat();
        result.defUnitDamageAfterBeginningOfCombat = atkUnit.battleContext.getMaxDamageAfterBeginningOfCombat();
        result.atkTile = atkUnit.placedTile;
        result.defTile = defUnit.placedTile;

        for (let func of this.__enumerateCombatFuncs(atkUnit, defUnit, result, context)) {
            func();
            if (damageType === DamageType.ActualDamage &&
                this.__isAnyoneDead(atkUnit, defUnit)) {
                break;
            }
        }

        // 1マップ1回の効果が発動したかどうかをBattleContextからUnitに保存する
        if (damageType === DamageType.ActualDamage) {
            atkUnit.hasOncePerMapSpecialActivated |= atkUnit.battleContext.hasOncePerMapSpecialActivated;
            defUnit.hasOncePerMapSpecialActivated |= defUnit.battleContext.hasOncePerMapSpecialActivated;
        }

        result.atkUnit_specialCount = atkUnit.tmpSpecialCount;
        result.defUnit_specialCount = defUnit.tmpSpecialCount;
        result.damageHistory = context.damageHistory;
        return result;
    }

    /**
     * 戦闘開始後の効果
     * @param {Unit} targetUnit
     * @param {Unit} enemyUnit
     */
    __activateEffectAfterBeginningOfCombat(targetUnit, enemyUnit) {
        // 戦闘開始後ダメージ
        let damageAfterBeginningOfCombat = targetUnit.battleContext.getMaxDamageAfterBeginningOfCombat();
        if (damageAfterBeginningOfCombat > 0) {
            targetUnit.takeDamageInCombat(damageAfterBeginningOfCombat, true);

            // ログ
            let logMessage =
                `<div class="log-damage-line">
                   <span class="log-damage">${damageAfterBeginningOfCombat}</span>（戦闘開始後(${targetUnit.groupChar})）: HP=${targetUnit.restHp}/${targetUnit.maxHpWithSkills}
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
     */
    __activateEffectAfterAfterBeginningOfCombatSkills(targetUnit, enemyUnit) {
        // 戦闘開始後ダメージ後の回復
        let maxHealAmount = targetUnit.battleContext.maxHealAmountAfterAfterBeginningOfCombatSkills;
        let [restHp, healAmount] = targetUnit.healInCombat(maxHealAmount);

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
     * @param  {DamageCalcResult} result
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

    __attack(atkUnit, defUnit, result, context) {
        context.isCounterattack = false;
        context.isFollowupAttack = false;
        context.isPotentFollowupAttack = false;
        let combatResult = this.__calcCombatDamage(atkUnit, defUnit, context);
        result.atkUnit_normalAttackDamage = combatResult.damagePerAttack;
        result.atkUnit_totalAttackCount += combatResult.attackCount;
        result.atkUnit_specialAttackDamage = combatResult.specialDamagePerAttack;
        if (atkUnit.restHp > 0) {
            result.atkUnit_actualTotalAttackCount += combatResult.attackCount;
        }
    }

    __followupAttack(atkUnit, defUnit, result, context) {
        if (atkUnit.battleContext.canFollowupAttackWithoutPotent) {
            context.isCounterattack = false;
            context.isFollowupAttack = true;
            context.isPotentFollowupAttack = false;
            let combatResult = this.__calcCombatDamage(atkUnit, defUnit, context);
            result.atkUnit_totalAttackCount += combatResult.attackCount;
            if (atkUnit.restHp > 0) {
                result.atkUnit_actualTotalAttackCount += combatResult.attackCount;
            }
        }
    }

    __potentFollowupAttack(atkUnit, defUnit, result, context) {
        if (atkUnit.battleContext.canPotentFollowupAttack()) {
            context.isCounterattack = false;
            context.isFollowupAttack = true;
            context.isPotentFollowupAttack = true;
            let combatResult = this.__calcCombatDamage(atkUnit, defUnit, context);
            result.atkUnit_totalAttackCount += combatResult.attackCount;
            if (atkUnit.restHp > 0) {
                result.atkUnit_actualTotalAttackCount += combatResult.attackCount;
            }
        }
    }

    __counterattack(atkUnit, defUnit, result, context) {
        if (defUnit.battleContext.canCounterattack) {
            context.isCounterattack = true;
            context.isFollowupAttack = false;
            context.isPotentFollowupAttack = false;
            let combatResult = this.__calcCombatDamage(defUnit, atkUnit, context);
            result.defUnit_normalAttackDamage = combatResult.damagePerAttack;
            result.defUnit_totalAttackCount += combatResult.attackCount;
            result.defUnit_specialAttackDamage = combatResult.specialDamagePerAttack;
            if (defUnit.restHp > 0) {
                result.defUnit_actualTotalAttackCount += combatResult.attackCount;
            }

            if (atkUnit.restHp === 0) {
                if (this.isLogEnabled) this.writeLog(atkUnit.getNameWithGroup() + "は戦闘不能");
                return result;
            }
        } else {
            if (this.isLogEnabled) this.writeLog(defUnit.getNameWithGroup() + "は反撃不可");
        }
    }

    __followupCounterattack(atkUnit, defUnit, result, context) {
        if (defUnit.battleContext.canCounterattack &&
            defUnit.battleContext.canFollowupAttackWithoutPotent) {
            context.isCounterattack = true;
            context.isFollowupAttack = true;
            context.isPotentFollowupAttack = false;
            let combatResult = this.__calcCombatDamage(defUnit, atkUnit, context);
            result.defUnit_totalAttackCount += combatResult.attackCount;
            if (defUnit.restHp > 0) {
                result.defUnit_actualTotalAttackCount += combatResult.attackCount;
            }
        }
    }

    __potentFollowupCounterattack(atkUnit, defUnit, result, context) {
        if (defUnit.battleContext.canCounterattack && defUnit.battleContext.canPotentFollowupAttack()) {
            context.isCounterattack = true;
            context.isFollowupAttack = true;
            context.isPotentFollowupAttack = true;
            let combatResult = this.__calcCombatDamage(defUnit, atkUnit, context);
            result.defUnit_totalAttackCount += combatResult.attackCount;
            if (defUnit.restHp > 0) {
                result.defUnit_actualTotalAttackCount += combatResult.attackCount;
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

        if (atkUnit.battleContext.additionalDamageOfNextAttackByDamageRatio > 0) {
            fixedAddDamage += atkUnit.battleContext.additionalDamageOfNextAttackByDamageRatio;
            atkUnit.battleContext.additionalDamageOfNextAttackByDamageRatio = 0;
        }

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
     */
    __calcCombatDamage(atkUnit, defUnit, context) {
        if (this.isLogEnabled) {
            this.__logAttackerAndAttackee(atkUnit, defUnit, context);
            let className = atkUnit.groupId === UnitGroupType.Ally ? 'log-ally-header' : 'log-enemy-header';
            let message = `<div class="${className}">【${context.getAttackTypeString()}】</div>`;
            this.writeSimpleLog("");
            this.writeSimpleLog(message);
            this.writeDebugLog(`【${context.getAttackTypeString()}】`);
        }

        this.__applySkillEffectsPerCombat(atkUnit, defUnit, context);
        this.__applySkillEffectsPerCombat(defUnit, atkUnit, context);

        this.__calcAndSetCooldownCount(atkUnit, defUnit);

        // 奥義発動可能状態の時に固定ダメージ(秘奥)などの効果があるので攻撃ダメージ処理の最初の方で奥義カウント変動処理を行う
        this.#applySpecialCountChangesBeforeAttack(atkUnit, defUnit, context);

        let totalAtk = atkUnit.getAtkInCombat(defUnit);
        let specialTotalAtk = atkUnit.getAtkInCombat(defUnit);
        let statusIndexWhenSpecial = atkUnit.battleContext.statIndexInsteadOfAtkWhenSpecial;
        if (statusIndexWhenSpecial !== STATUS_INDEX.None) {
            // calculates damage using 150% of unit's Def instead of the value of unit's Atk when Special triggers.
            let ratio = atkUnit.battleContext.ratioForUsingAnotherStatWhenSpecial;
            specialTotalAtk = Math.trunc(atkUnit.getStatusesInCombat(defUnit)[statusIndexWhenSpecial] * ratio);
        }

        let atkCountPerCombat = atkUnit.battleContext.getAttackCount(context.isCounterattack);
        // 神速追撃の場合は2回攻撃は発動しない
        if (context.isPotentFollowupAttack) {
            this.writeDebugLog(`神速追撃により2回攻撃は発動しない: ${atkCountPerCombat} → ${1}`);
            atkCountPerCombat = 1;
        }
        let specialMultDamage = atkUnit.battleContext.specialMultDamage;
        let specialAddDamage = atkUnit.battleContext.getSpecialAddDamage();

        let mitHp = defUnit.restHp;
        let defInCombat = defUnit.getDefInCombat(atkUnit);
        let resInCombat = defUnit.getResInCombat(atkUnit);

        let totalMit = atkUnit.battleContext.refersRes ? resInCombat : defInCombat;
        let specialTotalMit = atkUnit.battleContext.refersResForSpecial ? resInCombat : defInCombat; // 攻撃側の奥義発動時の防御力

        let fixedAddDamage = this.__calcFixedAddDamage(atkUnit, defUnit, false);

        let fixedSpecialAddDamage = atkUnit.battleContext.additionalDamageOfSpecial;

        // 戦闘中に変動し得る奥義の追加ダメージ
        for (let skillId of atkUnit.enumerateSkills()) {
            switch (skillId) {
                case Weapon.Misteruthin:
                    if (atkUnit.isWeaponSpecialRefined && atkUnit.battleContext.weaponSkillCondSatisfied) {
                        fixedSpecialAddDamage += Math.min(30, atkUnit.maxHpWithSkills - atkUnit.restHp);
                    }
                    break;
            }
        }

        let invalidatesDamageReductionExceptSpecialOnSpecialActivation = atkUnit.battleContext.invalidatesDamageReductionExceptSpecialOnSpecialActivation;
        let invalidatesDamageReductionExceptSpecial =
            atkUnit.battleContext.invalidatesDamageReductionExceptSpecial ||
            atkUnit.battleContext.invalidatesDamageReductionExceptSpecialForNextAttack;
        if (context.isFollowupOrPotentFollowupAttack()) {
            invalidatesDamageReductionExceptSpecial |=
                atkUnit.battleContext.invalidatesDamageReductionExceptSpecialForFollowupAttack;
        }
        atkUnit.battleContext.invalidatesDamageReductionExceptSpecialForNextAttack = false;
        specialAddDamage += floorNumberWithFloatError((atkUnit.maxHpWithSkills - atkUnit.restHp) * atkUnit.battleContext.selfDamageDealtRateToAddSpecialDamage);

        let mitAdvRatio = 0.0;
        if (defUnit.battleContext.isOnDefensiveTile) {
            mitAdvRatio = 0.3;
        }

        let damageReduceRatio = 1.0;

        // 神罰の杖
        if (atkUnit.weaponType === WeaponType.Staff) {
            if (!atkUnit.battleContext.canActivateWrathfulStaff()) {
                damageReduceRatio *= 0.5;
            }
        }

        let finalAtk = totalAtk;
        let specialFinalAtk = specialTotalAtk;
        if (atkUnit.battleContext.isEffectiveToOpponent) {
            // 特効
            finalAtk = floorNumberWithFloatError(finalAtk * 1.5);
            specialFinalAtk = floorNumberWithFloatError(specialFinalAtk * 1.5);
        }

        let attackAdvRatio = this.#getAttackAdvRatio(atkUnit, defUnit);
        let addAdjustAtk = truncNumberWithFloatError(finalAtk * attackAdvRatio);
        let addAdjustAtkBySpecial = truncNumberWithFloatError(specialFinalAtk * attackAdvRatio);
        finalAtk += addAdjustAtk;
        specialFinalAtk += addAdjustAtkBySpecial;

        let finalMit = floorNumberWithFloatError(totalMit + totalMit * mitAdvRatio);
        let damage = truncNumberWithFloatError((finalAtk - finalMit));
        if (damage < 0) {
            damage = 0;
        }
        damage += fixedAddDamage;

        // 杖の半減は加算ダメージ後に計算
        damage = truncNumberWithFloatError(damage * damageReduceRatio);

        let specialSuffer = atkUnit.battleContext.specialSufferPercentage;
        let specialSufferRatio = (specialSuffer / 100.0);
        let specialFinalMit = floorNumberWithFloatError((specialTotalMit - floorNumberWithFloatError(specialTotalMit * specialSufferRatio)) + floorNumberWithFloatError(specialTotalMit * mitAdvRatio));
        let specialDamage = truncNumberWithFloatError((specialFinalAtk - specialFinalMit) * specialMultDamage) + specialAddDamage;
        if (specialDamage < 0) {
            specialDamage = 0;
        }
        specialDamage += fixedAddDamage;
        specialDamage += fixedSpecialAddDamage;

        // 杖の半減は加算ダメージ後に計算
        specialDamage = truncNumberWithFloatError(specialDamage * damageReduceRatio);

        let totalDamage = this.__calcAttackTotalDamage(
            context,
            atkUnit,
            defUnit,
            atkCountPerCombat,
            damage,
            specialDamage,
            invalidatesDamageReductionExceptSpecialOnSpecialActivation,
            invalidatesDamageReductionExceptSpecial
        );

        if (this.isLogEnabled) {
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
            this.writeDebugLog(`相性による攻撃補正値: ${attackAdvRatio.toFixed(2)}`);
            if (defUnit.battleContext.isOnDefensiveTile) {
                this.writeDebugLog(`${defUnit.getNameWithGroup()}は防御地形補正 1.3`);
            }
            this.writeDebugLog(`補正前の攻撃:${totalAtk}(${this.__getAtkInCombatDetail(atkUnit, defUnit)})`);
            if (atkUnit.battleContext.isEffectiveToOpponent) {
                this.writeDebugLog("特効補正値: 1.5");
            }
            this.writeDebugLog(`相性による攻撃加算: ${addAdjustAtk}(${(finalAtk * attackAdvRatio).toFixed(2)})`);
            this.writeDebugLog(`相性による攻撃加算(奥義): ${addAdjustAtkBySpecial}(${(specialFinalAtk * attackAdvRatio).toFixed(2)})`);
            this.writeDebugLog(`補正前の耐久:${totalMit}(${totalMitDetailLog})`);
            if (totalMit !== specialTotalMit) {
                this.writeDebugLog(`奥義発動時の補正前の耐久:${specialTotalMit}(${specialTotalMitDetailLog})`);
            }
            this.writeDebugLog(`補正後の攻撃:${finalAtk}、耐久:${finalMit}`);
            this.writeDebugLog(`補正後の攻撃(奥義):${specialFinalAtk}、耐久:${specialFinalMit}`);
            this.writeDebugLog(`加算ダメージ:${fixedAddDamage}`);
            if (specialSufferRatio > 0) {
                this.writeDebugLog(`奥義発動時、守備、魔防－${floorNumberWithFloatError(specialSufferRatio * 100)}%扱い`);
            }
            this.writeDebugLog(`奥義加算ダメージ:${fixedSpecialAddDamage}`);
            this.writeDebugLog(`通常ダメージ=${damage}, 奥義ダメージ=${specialDamage}, 攻撃回数=${atkCountPerCombat}`);
            this.writeDebugLog(`合計ダメージ:${totalDamage}`);
        }

        if (!this.__isDead(atkUnit)) {
            // 攻撃側が倒されていたらダメージを反映しない(潜在ダメージ計算のためにダメージ計算は必要)
            defUnit.restHp = Math.max(0, mitHp - totalDamage);
            if (this.isLogEnabled) {
                this.writeLog(`${defUnit.getNameWithGroup()}の残りHP ${defUnit.restHp}/${defUnit.maxHpWithSkills}`);
                this.writeLog(`${atkUnit.getNameWithGroup()}の残りHP ${atkUnit.restHp}/${atkUnit.maxHpWithSkills}`);
                if (this.__isDead(defUnit)) {
                    this.writeLog(`${defUnit.getNameWithGroup()}は戦闘不能`);
                }
            }
        }

        return new OneAttackResult(damage, specialAddDamage, atkCountPerCombat);
    }

    applySkillEffectsAfterAttack(targetUnit, enemyUnit, context) {
        let env = new DamageCalculatorEnv(this, targetUnit, enemyUnit, false, context);
        env.setName('攻撃後').setLogLevel(getSkillLogLevel()).setDamageType(context.damageType);
        AFTER_ATTACK_HOOKS.evaluateWithUnit(targetUnit, env);
    }

    /**
     * @param {number} fixedAddDamage
     * @param {Unit} atkUnit
     * @param {Unit} defUnit
     * @param {DamageCalcContext} context
     */
    #getFixedAddDamagePerAttack(atkUnit, defUnit, context) {
        let fixedAddDamage = 0;
        fixedAddDamage += atkUnit.battleContext.additionalDamageOfNextAttack;
        atkUnit.battleContext.additionalDamageOfNextAttack = 0;
        // TODO: 戦闘開始のタイミングに移動させる
        if (context.isFirstAttack(atkUnit)) {
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
     */
    #getAttackAdvRatio(atkUnit, defUnit) {
        let attackTriangleAdv = DamageCalculationUtility.calcAttackerTriangleAdvantage(atkUnit, defUnit);
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
        if (unit.isAdvantageForColorless()) {
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
     * @param {DamageCalcContext} context
     * @param {Unit} atkUnit
     * @param {Unit} defUnit
     * @param {number} attackCount
     * @param {number} normalDamage
     * @param {number} specialDamage
     * @param {boolean} invalidatesDamageReductionExceptSpecialOnSpecialActivation
     * @param {boolean} invalidatesDamageReductionExceptSpecial
     */
    __calcAttackTotalDamage(
        context, atkUnit, defUnit, attackCount, normalDamage, specialDamage,
        invalidatesDamageReductionExceptSpecialOnSpecialActivation,
        invalidatesDamageReductionExceptSpecial) {
        let hasAtkUnitSpecial = atkUnit.hasSpecial && isNormalAttackSpecial(atkUnit.special);
        let hasDefUnitSpecial = defUnit.hasSpecial && isDefenseSpecial(defUnit.special);

        let atkReduceSpCount = atkUnit.battleContext.cooldownCountForAttack;
        let defReduceSpCount = defUnit.battleContext.cooldownCountForDefense;

        // ダメカを半分無効
        let neutralizationRatiosOfDamageReduction = atkUnit.battleContext.reductionRatiosOfDamageReductionRatioExceptSpecial;

        let isFirstAttack = context.isFirstAttack(atkUnit);
        let totalDamage = 0;
        for (let i = 0; i < attackCount; ++i) {
            let isDefUnitAlreadyDead = defUnit.restHp <= totalDamage;
            if (isDefUnitAlreadyDead) {
                return totalDamage;
            }
            let isAtkUnitAlreadyDead = atkUnit.restHp === 0;
            if (isAtkUnitAlreadyDead) {
                return totalDamage;
            }

            atkUnit.battleContext.initContextPerAttack();
            defUnit.battleContext.initContextPerAttack();

            let isSecondStrike = i === 1; // FirstStrike: i === 0
            if (isFirstAttack && isSecondStrike) {
                this.applySpecialCountChangeAmountBeforeSecondStrike(atkUnit);
                this.applySpecialCountChangeAmountBeforeSecondStrike(defUnit);
            }

            // 攻撃奥義発動可能状態で実際に奥義が発動できる
            let canActivateAttackerSpecial = hasAtkUnitSpecial && atkUnit.tmpSpecialCount === 0 &&
                !atkUnit.battleContext.preventedAttackerSpecial;
            this.__applySkillEffectsPerAttack(atkUnit, defUnit, canActivateAttackerSpecial, context);
            this.__applySkillEffectsPerAttack(defUnit, atkUnit, canActivateAttackerSpecial, context);
            // 奥義発動可能状態（実際に奥義が発動できるかは問わない）
            let activatesAttackerSpecial = hasAtkUnitSpecial && atkUnit.tmpSpecialCount === 0;
            let activatesDefenderSpecial = hasDefUnitSpecial && defUnit.tmpSpecialCount === 0 &&
                this.__isSatisfiedDefenderSpecialCond(defUnit, atkUnit);

            // 奥義以外のダメージ軽減
            let damageReductionRatios = this.#getDamageReductionRatios(atkUnit, defUnit, context);
            let damageReductionValues = [];

            let invalidatesDamageReductionExceptSpecialOnSpecialActivationInThisAttack =
                invalidatesDamageReductionExceptSpecialOnSpecialActivation ||
                atkUnit.battleContext.invalidatesDamageReductionExceptSpecialOnSpecialActivationPerAttack;
            let invalidatesOnSpecialActivation =
                activatesAttackerSpecial &&
                invalidatesDamageReductionExceptSpecialOnSpecialActivationInThisAttack &&
                !atkUnit.battleContext.preventedAttackerSpecial;

            // ダメージ軽減無効
            let invalidatesDamageReduction = invalidatesOnSpecialActivation || invalidatesDamageReductionExceptSpecial;
            let damageReductionRatiosAfterNeutralization =
                this.#getNeutralizationOfDamageReduction(
                    damageReductionRatios,
                    invalidatesDamageReduction,
                    neutralizationRatiosOfDamageReduction,
                    atkUnit,
                    canActivateAttackerSpecial);

            // 奥義によるダメージ軽減
            // 攻撃を受けた際に発動する奥義によるダメージ軽減
            let damageReductionRatiosByDefenderSpecial = [];
            // それ以外の奥義扱いのダメージ軽減
            let damageReductionRatiosByNonDefenderSpecial = [];

            this.#getDamageReductionRatiosBySpecial(damageReductionRatiosByNonDefenderSpecial, defUnit, context);

            // 攻撃ごとに変化する可能性がある奥義によるダメージ軽減
            this.#applySpecialDamageReductionPerAttack(defUnit, atkUnit, context);

            // 重装の聖炎など攻撃奥義スキルに内蔵されているダメージカット(心流星は除く)
            this.#applyDamageReductionByNoneDefenderSpecial(damageReductionRatiosByNonDefenderSpecial, atkUnit, defUnit, canActivateAttackerSpecial, context);

            // 防御系奥義によるダメージ軽減
            let isDefenderSpecialActivated =
                this.#applyDamageReductionByDefenderSpecial(
                    damageReductionRatiosByDefenderSpecial,
                    damageReductionValues,
                    activatesDefenderSpecial,
                    atkUnit,
                    defUnit,
                    context
                );

            // 神速追撃によるダメージ軽減
            let potentRatio = this.#getDamageReductionRatioByPotent(atkUnit, context);

            // 受けるダメージマイナス(固定値軽減)
            DamageCalculator.#applyDamageReductionValues(damageReductionValues, defUnit, context);

            let currentDamage = 0;
            let reducedDamage = 0;
            let additionalDamagePerAttack =
                atkUnit.battleContext.additionalDamagePerAttack +
                this.#getFixedAddDamagePerAttack(atkUnit, defUnit, context);
            let normalDamageOfThisAttack = normalDamage + additionalDamagePerAttack;
            let specialDamageOfThisAttack =
                specialDamage +
                additionalDamagePerAttack +
                atkUnit.battleContext.getSpecialAddDamagePerAttack() +
                atkUnit.battleContext.additionalDamageOfSpecialPerAttackInCombat;
            if (activatesAttackerSpecial && !atkUnit.battleContext.preventedAttackerSpecial) {
                atkUnit.battleContext.hasSpecialActivated = true;
                atkUnit.battleContext.specialActivatedCount++;

                DamageCalculator.#applySkillEffectsOnSpecial(atkUnit, defUnit);

                // 奥義発動
                damageReductionValues.push(defUnit.battleContext.damageReductionValueOfSpecialAttack);
                damageReductionValues.push(defUnit.battleContext.damageReductionValueOfSpecialAttackPerAttack);
                if (atkUnit.battleContext.isBaneSpecial || atkUnit.battleContext.isBanePerAttack) {
                    // 奥義発動時、軽減効果の計算前のダメージが「敵のHP-1」より低い時、そのダメージを「敵のHP-1」とする(巨影など一部の敵を除く)
                    if (specialDamageOfThisAttack < defUnit.restHp - 1) {
                        if (this.isLogEnabled) {
                            let message = `${atkUnit.nameWithGroup}の瞬殺効果が発動`;
                            this.writeDebugLog(message);
                            this.writeSimpleLog(message);
                        }
                        specialDamageOfThisAttack = defUnit.restHp - 1;
                    }
                }
                let atkSpecialCountBefore = atkUnit.tmpSpecialCount;
                let defSpecialCountBefore = defUnit.tmpSpecialCount;
                [currentDamage, reducedDamage] = this.__calcUnitAttackDamage(
                    defUnit, atkUnit,
                    specialDamageOfThisAttack,
                    additionalDamagePerAttack,
                    damageReductionRatiosAfterNeutralization,
                    damageReductionRatiosByDefenderSpecial,
                    damageReductionRatiosByNonDefenderSpecial,
                    damageReductionValues,
                    potentRatio,
                    atkUnit.battleContext.damageCalculationRatios,
                    activatesDefenderSpecial, context
                );
                this.__restoreMaxSpecialCount(atkUnit);
                // 奥義発動直後のスキル効果（奥義カウント変動など）
                this.applySkillEffectAfterSpecialActivated(atkUnit, defUnit, context);
                if (!isDefenderSpecialActivated) {
                    this.__reduceSpecialCount(defUnit, defReduceSpCount);
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
                    if (normalDamageOfThisAttack < defUnit.restHp - 1) {
                        if (this.isLogEnabled) {
                            let message = `${atkUnit.nameWithGroup}の瞬殺効果が発動`;
                            this.writeDebugLog(message);
                            this.writeSimpleLog(message);
                        }
                        normalDamageOfThisAttack = defUnit.restHp - 1;
                    }
                }
                [currentDamage, reducedDamage] = this.__calcUnitAttackDamage(
                    defUnit, atkUnit,
                    normalDamageOfThisAttack,
                    additionalDamagePerAttack,
                    damageReductionRatiosAfterNeutralization,
                    damageReductionRatiosByDefenderSpecial,
                    damageReductionRatiosByNonDefenderSpecial,
                    damageReductionValues,
                    potentRatio,
                    atkUnit.battleContext.damageCalculationRatios,
                    activatesDefenderSpecial, context
                );
                this.__reduceSpecialCount(atkUnit, atkReduceSpCount);
                if (!isDefenderSpecialActivated) {
                    this.__reduceSpecialCount(defUnit, defReduceSpCount);
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
            [totalDamage, reducedDamageByMiracle] = this.#activateMiracle(atkUnit, defUnit, currentDamage, totalDamage);
            this.#applyReducedDamageForNextAttack(
                atkUnit, defUnit,
                reducedDamage + reducedDamageByMiracle,
                activatesDefenderSpecial, context
            );

            context.damageHistory.push(new DamageLog(atkUnit, defUnit, currentDamage).setAttackType(context));

            this.applySkillEffectsAfterAttack(atkUnit, defUnit, context);
            this.applySkillEffectsAfterAttack(defUnit, atkUnit, context);

            if (this.isLogEnabled) {
                this.writeDebugLog(defUnit.getNameWithGroup() + "の残りHP" + Math.max(0, defUnit.restHp - totalDamage) + "/" + defUnit.maxHpWithSkills);
            }
        }

        return totalDamage;
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

    #activateMiracle(atkUnit, defUnit, currentDamage, totalDamage) {
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

    static #applyDamageReductionValues(damageReductionValues, defUnit, context) {
        damageReductionValues.push(defUnit.battleContext.damageReductionValue);
        damageReductionValues.push(defUnit.battleContext.damageReductionValuePerAttack);
        if (context.isFollowupOrPotentFollowupAttack()) {
            damageReductionValues.push(defUnit.battleContext.damageReductionValueOfFollowupAttack);
        } else {
            damageReductionValues.push(defUnit.battleContext.damageReductionValueOfFirstAttacks);
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

    #applyDamageReductionByDefenderSpecial(damageReductionRatiosByDefenderSpecial, damageReductionValues, activatesDefenderSpecial, atkUnit, defUnit, context) {
        let isDefenderSpecialActivated = false;
        let preventedDefenderSpecial =
            defUnit.battleContext.preventedDefenderSpecial ||
            defUnit.battleContext.preventedDefenderSpecialPerAttack;
        if (activatesDefenderSpecial && !preventedDefenderSpecial) {
            if (defUnit.battleContext.damageReductionRatioBySpecial > 0) {
                damageReductionRatiosByDefenderSpecial.push(defUnit.battleContext.damageReductionRatioBySpecial);
                if (defUnit.battleContext.canDamageReductionSpecialTriggerTwice) {
                    damageReductionRatiosByDefenderSpecial.push(defUnit.battleContext.damageReductionRatioBySpecial);
                }
                isDefenderSpecialActivated = true;
            }

            // 攻撃を受ける際に発動する奥義発動可能時に奥義を発動する処理
            if (isDefenderSpecialActivated) {
                defUnit.battleContext.hasSpecialActivated = true;
                defUnit.battleContext.specialActivatedCount++;
                damageReductionValues.push(defUnit.battleContext.damageReductionValueAfterSpecialTriggerTwice);
                // ダメージ軽減
                if (defUnit.passiveB === PassiveB.TateNoKodo3) {
                    damageReductionValues.push(5);
                } else if (defUnit.weapon === Weapon.MoonlightStone) {
                    if (atkUnit.battleContext.initiatesCombat ||
                        atkUnit.battleContext.restHpPercentage >= 75) {
                        damageReductionValues.push(8);
                    }
                } else if (defUnit.weapon === Weapon.IceBoundBrand) {
                    if (atkUnit.battleContext.initiatesCombat ||
                        atkUnit.battleContext.restHpPercentage >= 75) {
                        damageReductionValues.push(5);
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

    #applyDamageReductionByNoneDefenderSpecial(damageReductionRatiosByNonDefenderSpecial, atkUnit, defUnit, canActivateAttackerSpecial ,context) {
        let env = new DamageCalculatorEnv(this, defUnit, atkUnit, canActivateAttackerSpecial, context);
        env.setName('1戦闘に1回の奥義による軽減効果').setLogLevel(getSkillLogLevel()).setDamageType(context.damageType);
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

        if (context.isFirstAttack(atkUnit)) {
            // 初回攻撃
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

    #getNeutralizationOfDamageReduction(damageReductionRatios,
                                        invalidatesDamageReduction,
                                        neutralizationRatiosOfDamageReduction,
                                        atkUnit,
                                        canActivateAttackerSpecial) {
        let damageReductionRatiosAfterNeutralization = [];
        // ダメージ軽減をN%無効
        // 奥義発動時のダメージ軽減無効
        if (canActivateAttackerSpecial) {
            let ratios = atkUnit.battleContext.reductionRatiosOfDamageReductionRatioExceptSpecialOnSpecialActivation;
            neutralizationRatiosOfDamageReduction.push(...ratios);
        }

        let reductionRatiosPerAttack = atkUnit.battleContext.reductionRatiosOfDamageReductionRatioExceptSpecialPerAttack;
        neutralizationRatiosOfDamageReduction.push(...reductionRatiosPerAttack);

        let neutralizeOne = (accum, current) => accum - MathUtil.truncByPercentage(accum * current);
        let neutralizeAll = r => neutralizationRatiosOfDamageReduction.reduce(neutralizeOne, r);
        damageReductionRatiosAfterNeutralization.push(...damageReductionRatios.map(neutralizeAll));
        // ダメージ軽減を無効
        if (invalidatesDamageReduction) {
            if (this.isLogEnabled) this.writeDebugLog("奥義以外のダメージ軽減を無効化");
            damageReductionRatiosAfterNeutralization.fill(0);
        }
        this.writeDebugLog(`ダメージ軽減: [${damageReductionRatios}]`);
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
     * @param {boolean} canActivateAttackerSpecial
     * @param {DamageCalcContext} context
     */
    __applySkillEffectsPerAttack(targetUnit, enemyUnit, canActivateAttackerSpecial, context) {
        let env = new DamageCalculatorEnv(this, targetUnit, enemyUnit, canActivateAttackerSpecial, context);
        env.setName('攻撃開始時').setLogLevel(getSkillLogLevel()).setDamageType(context.damageType);
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
            }
        }
    }

    /**
     * @param {Unit} targetUnit
     * @param {Unit} enemyUnit
     * @param {DamageCalcContext} context
     */
    __applySkillEffectsPerCombat(targetUnit, enemyUnit, context) {
        if (targetUnit.hasStatusEffect(StatusEffectType.RallySpectrum)) {
            if (isNormalAttackSpecial(targetUnit.special)) {
                let n = 2;
                if (targetUnit.battleContext.isTwiceAttackActivating() ||
                    targetUnit.isReducedMaxSpecialCount()) {
                    n = 1;
                }
                targetUnit.battleContext.specialCountReductionBeforeFirstAttackPerAttack += n;
            }
        }
        for (let skillId of targetUnit.enumerateSkills()) {
            getSkillFunc(skillId, applySkillEffectsPerCombatFuncMap)?.call(this, targetUnit, enemyUnit, context);
        }
    }

    __isSatisfiedDefenderSpecialCond(defUnit, atkUnit) {
        for (let skillId of defUnit.enumerateSkills()) {
            switch (skillId) {
                case Special.GodlikeReflexes:
                    if (defUnit.getEvalSpdInCombat(atkUnit) >= atkUnit.getEvalSpdInCombat(defUnit) - 4) {
                        return true;
                    } else {
                        return false;
                    }
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
     * @param {Unit} defUnit
     * @param {Unit} atkUnit
     * @param {number} damage
     * @param {number} additionalDamage
     * @param {number[]} damageReductionRatiosAfterNeutralization
     * @param {number[]} damageReductionRatiosByDefenderSpecial
     * @param {number[]} damageReductionRatiosByNonDefenderSpecial
     * @param {number[]} damageReductionValues
     * @param {number} potentRatio
     * @param {number[]} damageCalculationRatios
     * @param {boolean} activatesDefenderSpecial
     * @param {DamageCalcContext} context
     */
    __calcUnitAttackDamage(defUnit, atkUnit,
                           damage,
                           additionalDamage,
                           damageReductionRatiosAfterNeutralization,
                           damageReductionRatiosByDefenderSpecial,
                           damageReductionRatiosByNonDefenderSpecial,
                           damageReductionValues,
                           potentRatio,
                           damageCalculationRatios,
                           activatesDefenderSpecial, context) {
        // 軽減効果の計算前のダメージが「敵のHP-1」より低い時、そのダメージを「敵のHP-1」とする
        // （巨影など一部の敵を除く）
        let damageReductionValue = damageReductionValues.reduce((a, c) => a + c, 0);
        let reductionRatios = [];
        reductionRatios.push(...damageReductionRatiosAfterNeutralization);
        reductionRatios.push(...damageReductionRatiosByDefenderSpecial);
        reductionRatios.push(...damageReductionRatiosByNonDefenderSpecial);
        // 【検証】回避・盾奥義・連撃防御が重なった時の端数計算
        // https://www.mattari-feh.com/entry/2020/06/22/201217
        // > m.（回避×盾奥義×連撃防御）
        // > という事で、実用上はmのケースで理解しておけば良さそうです。
        let damageRatio = reductionRatios.reduce((a, c) => a * (1 - c), 1);
        let reduceRatio = 1 - damageRatio;
        // let reducedDamage = Math.trunc(damage * (1 - ratio)) + damageReductionValue;
        let reducedDamage = Math.trunc(damage * reduceRatio) + damageReductionValue;
        let currentDamage = Math.trunc(Math.max(damage - reducedDamage, 0) * potentRatio);
        for (let ratio of damageCalculationRatios) {
            currentDamage = Math.trunc(currentDamage * ratio);
        }
        if (defUnit.battleContext.reducesDamageFromFoeToZeroDuringCombat) {
            currentDamage = 0;
        }
        if (this.isLogEnabled) {
            this.writeDebugLog(`ダメージ軽減計算開始`);
            this.writeDebugLog(`軽減前ダメージ: ${damage}`);
            this.writeDebugLog(`固定ダメージ: ${additionalDamage}`);
            this.writeDebugLog(`ダメージ軽減率(奥義以外): [${damageReductionRatiosAfterNeutralization}]`);
            this.writeDebugLog(`ダメージ軽減率(守備奥義): [${damageReductionRatiosByDefenderSpecial}]`);
            this.writeDebugLog(`ダメージ軽減率(奥義扱い): [${damageReductionRatiosByNonDefenderSpecial}]`);
            this.writeDebugLog(`最終ダメージ率: ${floorNumberWithFloatError(damageRatio * 100)}%`);
            this.writeDebugLog(`最終ダメージ軽減率: ${floorNumberWithFloatError(reduceRatio * 100)}%`);
            this.writeDebugLog(`固定ダメージ軽減値: -${damageReductionValue} ([${damageReductionValues}])`);
            this.writeDebugLog(`神速追撃ダメージ倍率: ${floorNumberWithFloatError(potentRatio * 100)}%`);
            this.writeDebugLog(`ダメージ計算: (${damage} - trunc(${damage} * ${roundFloat(reduceRatio)})) - ${damageReductionValue}) * ${potentRatio} = ${currentDamage}`);
            this.writeDebugLog(`ダメージ計算2: ((${damage} - ${Math.trunc(damage * reduceRatio)}) - ${damageReductionValue}) * ${potentRatio} = ${currentDamage}`);
            this.writeDebugLog(`ダメージ計算3: (${damage - Math.trunc(damage * reduceRatio)} - ${damageReductionValue}) * ${potentRatio} = ${currentDamage}`);
            this.writeDebugLog(`実質ダメージ軽減値: ${damageReductionValue} * ${1/damageRatio} = ${Math.trunc(damageReductionValue / damageRatio)}`);
            this.writeDebugLog(`0ダメージに軽減: ${defUnit.battleContext.reducesDamageFromFoeToZeroDuringCombat}`);
            this.writeDebugLog(`ダメージ変化: ${damage}→${currentDamage} (${damage - currentDamage}軽減)`);
            if (defUnit.battleContext.reducesDamageFromFoeToZeroDuringCombat) {
                this.writeSimpleLog(`【ダメージを0に】`);
            }
        }

        if (activatesDefenderSpecial && !defUnit.battleContext.preventedDefenderSpecial) {
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
            if (context.isFirstAttack(atkUnit)) {
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
        if (context.isFirstAttack(atkUnit)) {
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
