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

    isFirstAttack(atkUnit) {
        for (let log of this.damageHistory) {
            if (log.attackUnit === atkUnit) {
                return false;
            }
        }

        return true;
    }

    isConsecutiveAttack(atkUnit) {
        return this.damageHistory[this.damageHistory.length - 1].attackUnit === atkUnit;
    }

    isFollowupOrPotentFollowupAttack() {
        return this.isFollowupAttack || this.isPotentFollowupAttack;
    }

    isFirstFollowupAttack() {
        return this.isFollowupAttack && !this.isPotentFollowupAttack;
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

/// ダメージ計算を行うためのクラスです。
class DamageCalculator {
    /**
     * @param  {LoggerBase} logger
     */
    constructor(logger) {
        this._logger = logger;
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
     * @param  {DamageType} 潜在ダメージ計算かどうかを指定します。
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
        // atkUnitが受けるダメージはdefUnitが与えるダメージとして表示する
        result.atkUnitDamageAfterBeginningOfCombat = defUnit.battleContext.getMaxDamageAfterBeginningOfCombat();
        result.defUnitDamageAfterBeginningOfCombat = atkUnit.battleContext.getMaxDamageAfterBeginningOfCombat();
        result.atkTile = atkUnit.placedTile;
        result.defTile = defUnit.placedTile;

        for (let func of this.__enumerateCombatFuncs(atkUnit, defUnit, result, context)) {
            func();
            if (damageType == DamageType.ActualDamage
                && this.__isAnyoneDead(atkUnit, defUnit)
            ) {
                break;
            }
        }

        // 1マップ1回の効果が発動したかどうかをBattleContextからUnitに保存する
        if (damageType === DamageType.ActualDamage) {
            atkUnit.isOncePerMapSpecialActivated |= atkUnit.battleContext.isOncePerMapSpecialActivated;
            defUnit.isOncePerMapSpecialActivated |= defUnit.battleContext.isOncePerMapSpecialActivated;
        }

        result.atkUnit_specialCount = atkUnit.tmpSpecialCount;
        result.defUnit_specialCount = defUnit.tmpSpecialCount;
        result.damageHistory = context.damageHistory;
        return result;
    }

    __activateEffectAfterBeginningOfCombat(targetUnit, enemyUnit) {
        // 戦闘開始後ダメージ
        let damageAfterBeginningOfCombat = targetUnit.battleContext.getMaxDamageAfterBeginningOfCombat();
        if (damageAfterBeginningOfCombat > 0) {
            targetUnit.restHp -= damageAfterBeginningOfCombat;
            let logMessage = `${targetUnit.getNameWithGroup()}に合計<span style="color: #ff0000">${damageAfterBeginningOfCombat}</span>の戦闘開始後ダメージ`;
            this.writeDebugLog(logMessage);
            this.writeSimpleLog(logMessage);
            let debugMessage = `重複しない戦闘開始後ダメージ: [${targetUnit.battleContext.getDamagesAfterBeginningOfCombatNotStack()}]`;
            this.writeDebugLog(debugMessage);
            if (targetUnit.restHp <= 0) {
                targetUnit.restHp = 1;
            }
        }
    }

    /**
     * @param  {Unit} atkUnit
     * @param  {Unit} defUnit
     * @param  {DamageCalcResult} result
     * @param  {DamageCalcContext} context
     */
    *__enumerateCombatFuncs(atkUnit, defUnit, result, context) {
        let self = this;
        if (defUnit.battleContext.isVantageActivated) {
            let message = `${defUnit.nameWithGroup}の待ち伏せが発動`;
            this.writeDebugLog(message);
            this.writeSimpleLog(message);

            // 反撃
            yield () => self.__counterattack(atkUnit, defUnit, result, context);

            if (defUnit.battleContext.isDefDesperationActivated) {
                let message = `${defUnit.nameWithGroup}の受けの攻め立てが発動`;
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
                    let message = `${atkUnit.nameWithGroup}の攻め立てが発動`;
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
                let message = `${atkUnit.nameWithGroup}の攻め立てが発動`;
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
                    let message = `${defUnit.nameWithGroup}の受けの攻め立てが発動`;
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
        if (atkUnit.battleContext.canFollowupAttack) {
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
        }
        else {
            if (this.isLogEnabled) this.writeLog(defUnit.getNameWithGroup() + "は反撃不可");
        }
    }

    __followupCounterattack(atkUnit, defUnit, result, context) {
        if (defUnit.battleContext.canCounterattack && defUnit.battleContext.canFollowupAttack) {
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

        for (let func of atkUnit.battleContext.calcFixedAddDamagePerAttackFuncs) {
            fixedAddDamage += func(atkUnit, defUnit, isPrecombat);
        }
        for (let skillId of atkUnit.enumerateSkills()) {
            switch (skillId) {
                case PassiveB.FruitOfLife:
                    if (atkUnit.battleContext.restHpPercentage >= 25) {
                        if (atkUnit.battleContext.nextAttackAddReducedDamageActivated) {
                            atkUnit.battleContext.nextAttackAddReducedDamageActivated = false;
                            fixedAddDamage += atkUnit.battleContext.reducedDamageForNextAttack;
                            atkUnit.battleContext.reducedDamageForNextAttack = 0;
                        }
                    }
                    break;
                case Weapon.ArcaneGrima:
                    if (atkUnit.battleContext.restHpPercentage >= 25) {
                        let atk = isPrecombat ? atkUnit.getAtkInPrecombat() : atkUnit.getAtkInCombat(defUnit);
                        atkUnit.battleContext.additionalDamage += Math.trunc(atk * 0.15);
                    }
                    break;
                case Weapon.Aurgelmir:
                case PassiveB.DivineRecreation:
                case Weapon.Ginnungagap:
                    if (atkUnit.battleContext.nextAttackAddReducedDamageActivated) {
                        atkUnit.battleContext.nextAttackAddReducedDamageActivated = false;
                        fixedAddDamage += atkUnit.battleContext.reducedDamageForNextAttack;
                        atkUnit.battleContext.reducedDamageForNextAttack = 0;
                    }
                    break;
            }
        }

        if (atkUnit.hasStatusEffect(StatusEffectType.TotalPenaltyDamage)) {
            fixedAddDamage += -defUnit.debuffTotal;
        }

        fixedAddDamage += atkUnit.battleContext.additionalDamage;
        fixedAddDamage += this.__getAtkMinusDefAdditionalDamage(
            atkUnit, defUnit, atkUnit.battleContext.rateOfAtkMinusDefForAdditionalDamage, isPrecombat);
        return fixedAddDamage;
    }

    __getAtkMinusDefAdditionalDamage(atkUnit, defUnit, rate, isPrecombat) {
        let atk = 0;
        let value = 0;
        if (isPrecombat) {
            atk = atkUnit.getAtkInPrecombat();
            value = defUnit.getDefInPrecombat();
        }
        else {
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
        }
        else {
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
            } else if (context.isFirstFollowupAttack()) {
                this.writeLog(`${atkUnit.getNameWithGroup()}が${defUnit.getNameWithGroup()}に追撃`);
            } else {
                this.writeLog(`${atkUnit.getNameWithGroup()}が${defUnit.getNameWithGroup()}に神速追撃`);
            }
        } else {
            if (!context.isFollowupOrPotentFollowupAttack()) {
                this.writeLog(`${atkUnit.getNameWithGroup()}が${defUnit.getNameWithGroup()}に反撃`);
            } else if (context.isFirstFollowupAttack()) {
                this.writeLog(`${atkUnit.getNameWithGroup()}が${defUnit.getNameWithGroup()}に反撃追撃`);
            } else {
                this.writeLog(`${atkUnit.getNameWithGroup()}が${defUnit.getNameWithGroup()}に反撃神速追撃`);
            }
        }
    }

    /**
     * 一回分の攻撃ダメージを計算します。
     * @param  {Unit} atkUnit
     * @param  {Unit} defUnit
     * @param  {DamageCalcContext} context
     */
    __calcCombatDamage(atkUnit, defUnit, context) {
        if (this.isLogEnabled) {
            this.__logAttackerAndAttackee(atkUnit, defUnit, context);
            let message = `[${context.getAttackTypeString()}]`;
            this.writeSimpleLog("");
            this.writeSimpleLog(message);
            this.writeDebugLog(message);
        }

        this.__calcAndSetCooldownCount(atkUnit, defUnit);
        this.__applySkillEffectsPerCombat(atkUnit, defUnit, context);
        this.__applySkillEffectsPerCombat(defUnit, atkUnit, context);
        // 奥義発動可能状態の時に固定ダメージ(秘奥)などの効果があるので攻撃ダメージ処理の最初の方で奥義カウント変動処理を行う
        if (context.isFirstAttack(atkUnit)) {
            let totalCount =
                atkUnit.tmpSpecialCount
                - atkUnit.battleContext.specialCountReductionBeforeFirstAttack
                - atkUnit.battleContext.specialCountReductionBeforeFirstAttackPerAttack
                + atkUnit.battleContext.specialCountIncreaseBeforeFirstAttack;
            this.writeSimpleLog(`${atkUnit.nameWithGroup}の最初の攻撃の前の奥義カウント: <span style="color: #ff00ff">${totalCount}</span> = ${atkUnit.tmpSpecialCount} -
            ${atkUnit.battleContext.specialCountReductionBeforeFirstAttack} -
            ${atkUnit.battleContext.specialCountReductionBeforeFirstAttackPerAttack} +
            ${atkUnit.battleContext.specialCountIncreaseBeforeFirstAttack}`);
            atkUnit.tmpSpecialCount = Math.min(Math.max(0, totalCount), atkUnit.maxSpecialCount);
        }
        // 最初の追撃前の効果
        if (context.isFirstFollowupAttack()) {
            let totalCount =
                atkUnit.tmpSpecialCount
                - atkUnit.battleContext.specialCountReductionBeforeFollowupAttack;
            this.writeSimpleLog(`${atkUnit.nameWithGroup}の最初の追撃の前の奥義カウント: <span style="color: #ff00ff">${totalCount}</span> = ${atkUnit.tmpSpecialCount} -
            ${atkUnit.battleContext.specialCountReductionBeforeFollowupAttack}`);
            atkUnit.tmpSpecialCount = Math.min(Math.max(0, totalCount), atkUnit.maxSpecialCount);
        }

        let totalAtk = atkUnit.getAtkInCombat(defUnit);

        let atkCountPerOneAttack = context.isCounterattack ? atkUnit.battleContext.counterattackCount : atkUnit.battleContext.attackCount;
        // 神速追撃の場合は2回攻撃は発動しない
        if (context.isPotentFollowupAttack) {
            this.writeDebugLog(`神速追撃により2回攻撃は発動しない: ${atkCountPerOneAttack} → ${1}`);
            atkCountPerOneAttack = 1;
        }
        let specialMultDamage = atkUnit.battleContext.specialMultDamage;
        let specialAddDamage = atkUnit.battleContext.specialAddDamage;

        let mitHp = defUnit.restHp;
        let defInCombat = defUnit.getDefInCombat(atkUnit);
        let resInCombat = defUnit.getResInCombat(atkUnit);

        let totalMit = atkUnit.battleContext.refersRes ? resInCombat : defInCombat;
        let specialTotalMit = atkUnit.battleContext.refersResForSpecial ? resInCombat : defInCombat; // 攻撃側の奥義発動時の防御力

        let fixedAddDamage = this.__calcFixedAddDamage(atkUnit, defUnit, false);
        fixedAddDamage += atkUnit.battleContext.additionalDamageOfNextAttack;
        atkUnit.battleContext.additionalDamageOfNextAttack = 0;
        if (context.isFirstAttack(atkUnit)) {
            fixedAddDamage += atkUnit.battleContext.additionalDamageOfFirstAttack;
        }

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
        for (let skillId of atkUnit.enumerateSkills()) {
            let funcMap = addSpecialDamageAfterDefenderSpecialActivatedFuncMap;
            if (funcMap.has(skillId)) {
                let func = funcMap.get(skillId);
                if (typeof func === "function") {
                    fixedAddDamage += func.call(this, atkUnit, defUnit);
                } else {
                    console.warn(`登録された関数が間違っています。key: ${skillId}, value: ${func}, type: ${typeof func}`);
                }
            }
        }
        switch (atkUnit.special) {
            case Special.IceMirror:
                // 通常ダメージに加算
                if (atkUnit.battleContext.nextAttackAddReducedDamageActivated) {
                    fixedAddDamage += atkUnit.battleContext.reducedDamageForNextAttack;
                    atkUnit.battleContext.reducedDamageForNextAttack = 0;
                    atkUnit.battleContext.nextAttackAddReducedDamageActivated = false;
                }
                break;
            case Special.IceMirror2:
                if (atkUnit.battleContext.nextAttackEffectAfterSpecialActivated) {
                    fixedAddDamage += floorNumberWithFloatError(atkUnit.getResInCombat(defUnit) * 0.4);
                    atkUnit.battleContext.nextAttackEffectAfterSpecialActivated = false;
                }
                break;
            case Special.FrostbiteMirror:
                // 通常ダメージに加算
                if (atkUnit.battleContext.nextAttackAddReducedDamageActivated) {
                    fixedAddDamage += atkUnit.battleContext.reducedDamageForNextAttack;
                    atkUnit.battleContext.reducedDamageForNextAttack = 0;
                    atkUnit.battleContext.nextAttackAddReducedDamageActivated = false;
                }
                break;
            case Special.NegatingFang:
                if (atkUnit.battleContext.nextAttackEffectAfterSpecialActivated) {
                    fixedAddDamage += floorNumberWithFloatError(atkUnit.getAtkInCombat(defUnit) * 0.3);
                    atkUnit.battleContext.nextAttackEffectAfterSpecialActivated = false;
                }
                break;
            default:
                break;
        }

        let attackAdvRatio = 0;
        {
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
            attackAdvRatio = triangleMult * triangleReviseRate;

        }

        let mitAdvRatio = 0.0;
        if (defUnit.battleContext.isOnDefensiveTile) {
            mitAdvRatio = 0.3;
        }

        let damageReduceRatio = 1.0;
        let reduceDamageHalf = !atkUnit.battleContext.wrathfulStaff && atkUnit.weaponType === WeaponType.Staff;
        if (reduceDamageHalf) {
            damageReduceRatio *= 0.5;
        }

        let finalAtk = totalAtk;
        if (atkUnit.battleContext.isEffectiveToOpponent) {
            // 特効
            finalAtk = floorNumberWithFloatError(finalAtk * 1.5);
        }

        let addAdjustAtk = truncNumberWithFloatError(finalAtk * attackAdvRatio);
        finalAtk = finalAtk + addAdjustAtk;

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
        let specialDamage = truncNumberWithFloatError((finalAtk - specialFinalMit) * specialMultDamage) + specialAddDamage;
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
            atkCountPerOneAttack,
            damage,
            specialDamage,
            invalidatesDamageReductionExceptSpecialOnSpecialActivation,
            invalidatesDamageReductionExceptSpecial
        );

        if (this.isLogEnabled) {
            let resInCombatDetail = this.__getResInCombatDetail(defUnit, atkUnit);
            let defInCombatDetail = this.__getDefInCombatDetail(defUnit, atkUnit);
            let totalMitDefailLog = atkUnit.battleContext.refersRes ? resInCombatDetail : defInCombatDetail;
            if (atkUnit.battleContext.refersRes) {
                this.writeDebugLog("通常攻撃時は魔防参照")
            }
            else {
                this.writeDebugLog("通常攻撃時は守備参照");
            }

            let specialTotalMitDefailLog = atkUnit.battleContext.refersResForSpecial ? resInCombatDetail : defInCombatDetail;
            if (atkUnit.battleContext.refersRes !== atkUnit.battleContext.refersResForSpecial) {
                if (atkUnit.battleContext.refersResForSpecial) {
                    this.writeDebugLog("奥義発動時は魔防参照")
                } else {
                    this.writeDebugLog("奥義発動時は守備参照");
                }
            }

            this.writeDebugLog(`[相性判定] 攻撃属性:${this.getUnitColorLog(atkUnit)}、防御属性:${this.getUnitColorLog(defUnit)}`);
            this.writeDebugLog("相性による攻撃補正値: " + attackAdvRatio.toFixed(2));
            if (defUnit.battleContext.isOnDefensiveTile) {
                this.writeDebugLog(defUnit.getNameWithGroup() + "は防御地形補正 1.3");
            }
            this.writeDebugLog("補正前の攻撃:" + totalAtk + `(${this.__getAtkInCombatDetail(atkUnit, defUnit)})`);
            if (atkUnit.battleContext.isEffectiveToOpponent) {
                this.writeDebugLog("特効補正値: 1.5");
            }
            this.writeDebugLog(`相性による攻撃加算: ${addAdjustAtk}(${(finalAtk * attackAdvRatio).toFixed(2)})`);
            this.writeDebugLog("補正前の耐久:" + totalMit + `(${totalMitDefailLog})`);
            if (totalMit != specialTotalMit) {
                this.writeDebugLog("奥義発動時の補正前の耐久:" + specialTotalMit + `(${specialTotalMitDefailLog})`);
            }
            this.writeDebugLog("補正後の攻撃:" + finalAtk + "、耐久:" + finalMit);
            this.writeDebugLog("加算ダメージ:" + fixedAddDamage);
            if (specialSufferRatio > 0) {
                this.writeDebugLog(`奥義発動時、守備、魔防－${floorNumberWithFloatError(specialSufferRatio * 100)}%扱い`);
            }
            this.writeDebugLog("奥義加算ダメージ:" + fixedSpecialAddDamage);
            this.writeDebugLog(
                `通常ダメージ=${damage}, 奥義ダメージ=${specialDamage}, 攻撃回数=${atkCountPerOneAttack}`);
            this.writeDebugLog(`合計ダメージ:${totalDamage}`);
        }

        if (!this.__isDead(atkUnit)) {
            // 攻撃側が倒されていたらダメージを反映しない(潜在ダメージ計算のためにダメージ計算は必要)
            let restHp = Math.max(0, mitHp - totalDamage);
            defUnit.restHp = restHp;
            if (this.isLogEnabled) {
                this.writeLog(defUnit.getNameWithGroup() + "の残りHP " + defUnit.restHp + "/" + defUnit.maxHpWithSkills);
                this.writeLog(atkUnit.getNameWithGroup() + "の残りHP " + atkUnit.restHp + "/" + atkUnit.maxHpWithSkills);
                if (this.__isDead(defUnit)) {
                    this.writeLog(defUnit.getNameWithGroup() + "は戦闘不能");
                }
            }
        }

        return new OneAttackResult(damage, specialAddDamage, atkCountPerOneAttack);
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

        atkUnit.battleContext.isSpecialActivated = true;
        let totalDamageWithOverkill = this.calcPrecombatSpecialDamage(atkUnit, defUnit);
        let totalDamage = Math.min(totalDamageWithOverkill, defUnit.restHp - 1);

        this.__restoreMaxSpecialCount(atkUnit);

        defUnit.restHp = defUnit.restHp - totalDamage;

        if (this.isLogEnabled) {
            this.writeDebugLog("戦闘前ダメージ計算..");
            this.writeLog(`範囲奥義によるダメージ${totalDamageWithOverkill}(HP: → ${defUnit.restHp})`);
            this.writeSimpleLog(atkUnit.getNameWithGroup() + "→" + defUnit.getNameWithGroup());
            this.writeSimpleLog(`範囲奥義によるダメージ<span style="color: #ff0000">${totalDamageWithOverkill}</span>(HP: → ${defUnit.restHp})`);
            this.writeLog(defUnit.name + "の残りHP " + defUnit.restHp + "/" + defUnit.maxHpWithSkills);
        }
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
            }
            else {
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

    __calcAttackTotalDamage(
        context, atkUnit, defUnit, attackCount, normalDamage, specialDamage,
        invalidatesDamageReductionExceptSpecialOnSpecialActivation,
        invalidatesDamageReductionExceptSpecial) {
        let hasAtkUnitSpecial = atkUnit.hasSpecial && isNormalAttackSpecial(atkUnit.special);
        let hasDefUnitSpecial = defUnit.hasSpecial && isDefenseSpecial(defUnit.special);

        let atkReduceSpCount = atkUnit.battleContext.cooldownCountForAttack;
        let defReduceSpCount = defUnit.battleContext.cooldownCountForDefense;

        // ダメカを半分無効
        let reductionRatios = atkUnit.battleContext.reductionRatiosOfDamageReductionRatioExceptSpecial;
        if (atkUnit.hasStatusEffect(StatusEffectType.ReducesPercentageOfFoesNonSpecialReduceDamageSkillsBy50Percent)) {
            reductionRatios.push(0.5);
        }

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

            this.__initContextPerAttack(atkUnit);
            this.__initContextPerAttack(defUnit);
            // 攻撃奥義発動可能状態で実際に奥義が発動できる
            let canActivateAttackerSpecial = hasAtkUnitSpecial && atkUnit.tmpSpecialCount === 0 &&
                !atkUnit.battleContext.preventedAttackerSpecial;
            this.__applySkillEffectsPerAttack(atkUnit, defUnit, canActivateAttackerSpecial);
            this.__applySkillEffectsPerAttack(defUnit, atkUnit, canActivateAttackerSpecial);
            // 奥義発動可能状態（実際に奥義が発動できるかは問わない）
            let activatesAttackerSpecial = hasAtkUnitSpecial && atkUnit.tmpSpecialCount === 0;
            let activatesDefenderSpecial = hasDefUnitSpecial && defUnit.tmpSpecialCount === 0 &&
                this.__isSatisfiedDefenderSpecialCond(defUnit, atkUnit);
            let damageReductionRatio = 1.0;
            let damageReductionValue = 0;

            // 奥義以外のダメージ軽減
            {
                // 計算機の外側で設定されたダメージ軽減率
                damageReductionRatio *= 1.0 - defUnit.battleContext.damageReductionRatio;

                if (context.isFirstAttack(atkUnit)) {
                    // 初回攻撃
                    damageReductionRatio *= 1.0 - defUnit.battleContext.damageReductionRatioOfFirstAttack;
                } else if (context.isConsecutiveAttack(atkUnit)) {
                    // 連続した攻撃
                    damageReductionRatio *= 1.0 - defUnit.battleContext.damageReductionRatioOfConsecutiveAttacks;
                }

                if (context.isFollowupOrPotentFollowupAttack()) {
                    // 追撃
                    damageReductionRatio *= 1.0 - defUnit.battleContext.damageReductionRatioOfFollowupAttack;
                } else {
                    damageReductionRatio *= 1.0 - defUnit.battleContext.damageReductionRatioOfFirstAttacks;
                }

                // 戦闘中1回の軽減効果
                // 奥義による攻撃でダメージを与えた時、次の敵の攻撃のダメージを50%軽減(その戦闘中のみ)
                if (defUnit.battleContext.damageReductionRatiosOfNextAttackWhenSpecialActivated !== null) {
                    for (let ratio of defUnit.battleContext.damageReductionRatiosOfNextAttackWhenSpecialActivated) {
                        damageReductionRatio *= 1.0 - ratio;
                    }
                    // 1戦闘に1回しか発動しないので発動後はnullをいれる（初期値は[]）
                    defUnit.battleContext.damageReductionRatiosOfNextAttackWhenSpecialActivated = null;
                }

                // チェインガード
                for (let [unit, ratio] of defUnit.battleContext.damageReductionRatiosByChainGuard) {
                    if (this.isLogEnabled) {
                        this.writeDebugLog(`${unit.nameWithGroup}によるチェインガードによるダメージ軽減。ratio: [${ratio}]`);
                    }
                    damageReductionRatio *= 1.0 - ratio;
                    unit.battleContext.isChainGuardActivated = true;
                }
            }

            let invalidatesDamageReductionExceptSpecialOnSpecialActivationInThisAttack =
                invalidatesDamageReductionExceptSpecialOnSpecialActivation ||
                atkUnit.battleContext.invalidatesDamageReductionExceptSpecialOnSpecialActivationPerAttack;
            let invalidatesOnSpecialActivation =
                activatesAttackerSpecial &&
                invalidatesDamageReductionExceptSpecialOnSpecialActivationInThisAttack &&
                !atkUnit.battleContext.preventedAttackerSpecial;

            // ダメージ軽減をN%無効
            if (reductionRatios.length >= 1) {
                let reducedRatio = 1 - damageReductionRatio;
                if (this.isLogEnabled) {
                    this.writeDebugLog(`奥義以外のダメージ軽減をN%無効: [${reductionRatios}]`);
                }
                for (let ratio of reductionRatios) {
                    let tmpRatio = reducedRatio;
                    reducedRatio -= Math.trunc(reducedRatio * 100 * ratio) * 0.01;
                    reducedRatio = Math.min(reducedRatio, 1);
                    if (this.isLogEnabled) {
                        this.writeDebugLog(`奥義以外のダメージ軽減を${floorNumberWithFloatError(ratio * 100)}%無効。軽減率: ${floorNumberWithFloatError(tmpRatio * 100)}% → ${floorNumberWithFloatError(reducedRatio * 100)}%`);
                    }
                }
                damageReductionRatio = 1 - reducedRatio;
            }

            // ダメージ軽減を無効
            if (invalidatesOnSpecialActivation || invalidatesDamageReductionExceptSpecial) {
                if (this.isLogEnabled) this.writeDebugLog("奥義以外のダメージ軽減を無効化");
                damageReductionRatio = 1.0;
            }

            // 重装の聖炎など攻撃奥義スキルに内蔵されているダメージカット(心流星は除く)
            if (defUnit.battleContext.damageReductionRatiosWhenCondSatisfied !== null) {
                for (let skillId of defUnit.enumerateSkills()) {
                    let funcMap = applyDamageReductionRatiosWhenCondSatisfiedFuncMap;
                    if (funcMap.has(skillId)) {
                        let func = funcMap.get(skillId);
                        if (typeof func === "function") {
                            func.call(this, atkUnit, defUnit);
                        } else {
                            console.warn(`登録された関数が間違っています。key: ${skillId}, value: ${func}, type: ${typeof func}`);
                        }
                    }
                    switch (skillId) {
                        case Special.DragonBlast:
                            if (defUnit.tmpSpecialCount === 0 ||
                                atkUnit.tmpSpecialCount === 0 ||
                                defUnit.battleContext.isSpecialActivated ||
                                atkUnit.battleContext.isSpecialActivated) {
                                if (defUnit.battleContext.specialSkillCondSatisfied) {
                                    defUnit.battleContext.damageReductionRatiosWhenCondSatisfied.push(0.4);
                                }
                            }
                            break;
                        case Special.ArmoredFloe:
                        case Special.ArmoredBeacon:
                            if (defUnit.tmpSpecialCount === 0 ||
                                atkUnit.tmpSpecialCount === 0 ||
                                defUnit.battleContext.isSpecialActivated ||
                                atkUnit.battleContext.isSpecialActivated) {
                                if (isRangedWeaponType(atkUnit.weaponType)) {
                                    defUnit.battleContext.damageReductionRatiosWhenCondSatisfied.push(0.4);
                                }
                            }
                            break;
                    }
                }
                // 1戦闘に1回しか発動しないので発動後はnullをいれる（初期値は[]）
                if (defUnit.battleContext.damageReductionRatiosWhenCondSatisfied.length > 0) {
                    for (let ratio of defUnit.battleContext.damageReductionRatiosWhenCondSatisfied) {
                        let oldRatio = damageReductionRatio;
                        damageReductionRatio *= 1.0 - ratio;
                        this.writeDebugLog(`1戦闘1回の奥義によるダメージ軽減。ratio: ${ratio}, damage ratio: ${oldRatio} → ${damageReductionRatio}`);
                    }
                    defUnit.battleContext.damageReductionRatiosWhenCondSatisfied = null;
                }
                // 防御系奥義以外によるダメージ軽減
                let reductionRatios = defUnit.battleContext.damageReductionRatiosByNonDefenderSpecial;
                if (reductionRatios.length > 0) {
                    for (let ratio of reductionRatios) {
                        let oldRatio = damageReductionRatio;
                        damageReductionRatio *= 1.0 - ratio;
                        this.writeDebugLog(`防御系奥義以外の奥義によるダメージ軽減。ratio: ${ratio}, damage ratio: ${oldRatio} → ${damageReductionRatio}`);
                    }
                }
            }

            // 防御系奥義によるダメージ軽減
            let isDefenderSpecialActivated = false;
            // 奥義の次の攻撃のダメージ軽減
            for (let ratio of defUnit.battleContext.damageReductionRatiosBySpecialOfNextAttack) {
                damageReductionRatio *= 1.0 - ratio;
            }
            defUnit.battleContext.damageReductionRatiosBySpecialOfNextAttack = [];

            let preventedDefenderSpecial =
                defUnit.battleContext.preventedDefenderSpecial ||
                defUnit.battleContext.preventedDefenderSpecialPerAttack;
            if (activatesDefenderSpecial && !preventedDefenderSpecial) {
                if (defUnit.battleContext.damageReductionRatioBySpecial > 0) {
                    damageReductionRatio *= 1.0 - defUnit.battleContext.damageReductionRatioBySpecial;
                    if (defUnit.passiveB === PassiveB.HardyFighter3) {
                        damageReductionRatio *= 1.0 - defUnit.battleContext.damageReductionRatioBySpecial;
                    }
                    isDefenderSpecialActivated = true;
                }

                // 攻撃を受ける際に発動する奥義発動可能時に奥義を発動する処理
                if (isDefenderSpecialActivated) {
                    defUnit.battleContext.isSpecialActivated = true;
                    defUnit.battleContext.specialActivatedCount++;
                    // ダメージ軽減
                    if (defUnit.passiveB === PassiveB.TateNoKodo3 ||
                        defUnit.passiveB === PassiveB.HardyFighter3) {
                        damageReductionValue += 5;
                    } else if (defUnit.weapon === Weapon.MoonlightStone) {
                        if (atkUnit.battleContext.initiatesCombat ||
                            atkUnit.battleContext.restHpPercentage >= 75) {
                            damageReductionValue += 8;
                        }
                    } else if (defUnit.weapon === Weapon.IceBoundBrand) {
                        if (atkUnit.battleContext.initiatesCombat ||
                            atkUnit.battleContext.restHpPercentage >= 75) {
                            damageReductionValue += 5;
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

            // 神速追撃によるダメージ軽減
            if (context.isPotentFollowupAttack) {
                if (atkUnit.battleContext.potentOverwriteRatio === null) {
                    for (let ratio of atkUnit.battleContext.potentRatios) {
                        let oldRatio = damageReductionRatio;
                        damageReductionRatio *= ratio;
                        this.writeDebugLog(`神速追撃による軽減。ratio: ${ratio}, damage ratio: ${oldRatio} → ${damageReductionRatio}`);
                        this.writeSimpleLog(`神速追撃:ダメージ${ratio * 100}%`)
                    }
                } else {
                    let ratio = atkUnit.battleContext.potentOverwriteRatio;
                    this.writeDebugLog(`神速追撃上書き値による軽減。ratios: ${atkUnit.battleContext.potentRatios} → ratio: ${ratio}`);
                    let oldRatio = damageReductionRatio;
                    damageReductionRatio *= ratio;
                    this.writeDebugLog(`神速追撃による軽減。ratio: ${ratio}, damage ratio: ${oldRatio} → ${damageReductionRatio}`);
                    this.writeSimpleLog(`神速追撃:ダメージ${ratio * 100}%`)
                }
            }

            damageReductionRatio = 1.0 - damageReductionRatio;
            damageReductionValue += defUnit.battleContext.damageReductionValue;
            damageReductionValue += defUnit.battleContext.damageReductionValuePerAttack;
            if (context.isFollowupOrPotentFollowupAttack()) {
                damageReductionValue += defUnit.battleContext.damageReductionValueOfFollowupAttack;
            } else {
                damageReductionValue += defUnit.battleContext.damageReductionValueOfFirstAttacks;
            }

            let currentDamage = 0;
            normalDamage += atkUnit.battleContext.additionalDamagePerAttack;
            specialDamage += atkUnit.battleContext.additionalDamagePerAttack;
            if (activatesAttackerSpecial && !atkUnit.battleContext.preventedAttackerSpecial) {
                atkUnit.battleContext.isSpecialActivated = true;
                atkUnit.battleContext.specialActivatedCount++;
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
                // 奥義発動
                damageReductionValue += defUnit.battleContext.damageReductionValueOfSpecialAttack;
                damageReductionValue += defUnit.battleContext.damageReductionValueOfSpecialAttackPerAttack;
                currentDamage = this.__calcUnitAttackDamage(defUnit, atkUnit, specialDamage, damageReductionRatio, damageReductionValue, activatesDefenderSpecial, context);
                if (this.isLogEnabled) this.writeLog(`奥義によるダメージ${currentDamage}`);
                let atkColor = atkUnit.groupId === UnitGroupType.Ally ? "blue" : "red";
                let defColor = defUnit.groupId === UnitGroupType.Ally ? "blue" : "red";
                this.writeSimpleLog(`<span style="color: ${atkColor};">${atkUnit.getNameWithGroup()}</span>→<span style="color: ${defColor};">${defUnit.getNameWithGroup()}</span><br/><span style="color: #ff00ff">奥義</span>ダメージ<span style="color: #ff0000;">${currentDamage}</span>`);
                this.__restoreMaxSpecialCount(atkUnit);
                // 奥義発動直後のスキル効果（奥義カウント変動など）
                this.applySkillEffectAfterSpecialActivated(atkUnit, defUnit, context);

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
            }
            else {
                // 通常攻撃
                currentDamage = this.__calcUnitAttackDamage(defUnit, atkUnit, normalDamage, damageReductionRatio, damageReductionValue, activatesDefenderSpecial, context);
                if (this.isLogEnabled) this.writeLog(`通常攻撃によるダメージ${currentDamage}`);
                let atkColor = atkUnit.groupId === UnitGroupType.Ally ? "blue" : "red";
                let defColor = defUnit.groupId === UnitGroupType.Ally ? "blue" : "red";
                this.writeSimpleLog(`<span style="color: ${atkColor};">${atkUnit.getNameWithGroup()}</span>→<span style="color: ${defColor};">${defUnit.getNameWithGroup()}</span><br/>通常攻撃ダメージ<span style="color: #ff0000;">${currentDamage}</span>`);
                this.__reduceSpecialCount(atkUnit, atkReduceSpCount);
            }

            {
                let healHpAmount = this.__getHealAmountByAttack(atkUnit, defUnit, currentDamage, context);
                if (healHpAmount > 0) {
                    if (this.isLogEnabled) this.writeDebugLog(`${atkUnit.getNameWithGroup()}は${healHpAmount}回復`);
                    this.__heal(atkUnit, healHpAmount, defUnit);
                }
            }

            // 祈り処理開始
            // 奥義による祈り
            let canActivateSpecialMiracle = this.__canActivateSpecialMiracle(defUnit, atkUnit);
            // 奥義以外による祈り
            let canActivateNonSpecialMiracle = this.__canActivateNonSpecialMiracle(defUnit, atkUnit);
            // 奥義による祈り(1マップ1回)
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
            if (atkUnit.battleContext.neutralizesNonSpecialMiracle) {
                let message = `${atkUnit.nameWithGroup}のスキル効果により${defUnit.nameWithGroup}の奥義以外の祈りを無効`;
                neutralizesNoneSpecialMiracle(message);
            }
            if (defUnit.hasStatusEffect(StatusEffectType.NeutralizeUnitSurvivesWith1HP)) {
                let message = `ステータス効果(${name})により${defUnit.nameWithGroup}の奥義以外の祈りを無効`;
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

            // 奥義/奥義以外による祈りの判定(ナンナなどの防御奥義不可はこの時点で既に考慮されている)
            if (canActivateAnyMiracles &&
                isRestHpGreaterOne &&
                isDeadWithoutMiracle) {
                // どの祈りが発動するのか判定する
                let logMiracle = message => {
                    if (this.isLogEnabled) {
                        this.writeLog(message);
                        this.writeSimpleLog(message);
                    }
                }
                if (canActivateNonSpecialMiracleAndHeal) {
                    logMiracle(`奥義以外の祈り+戦闘後99回復効果発動、${defUnit.getNameWithGroup()}はHP1残る`);
                    defUnit.battleContext.isNonSpecialMiracleAndHealAcitivated = true;
                } else if (canActivateNonSpecialMiracle) {
                    logMiracle(`奥義以外の祈り発動、${defUnit.getNameWithGroup()}はHP1残る`);
                    defUnit.battleContext.isNonSpecialMiracleActivated = true;
                } else if (canActivateNonSpecialOneTimePerMapMiracle) {
                    logMiracle(`奥義以外の祈り発動(1マップ1回)、${defUnit.getNameWithGroup()}はHP1残る`);
                    // TODO: リファクタリング(現状使用していない)
                    defUnit.battleContext.isNonSpecialOneTimePerMapMiracleAcitivated = true;
                    // TODO: リファクタリング
                    defUnit.battleContext.isOncePerMapSpecialActivated = true;
                    // 1マップ1回でない奥義以外の祈りも発動したとみなす
                    defUnit.battleContext.isNonSpecialMiracleActivated = true;
                } else if (canActivateSpecialMiracleAndHeal) {
                    logMiracle(`奥義による祈り+戦闘後99回復効果発動、${defUnit.getNameWithGroup()}はHP1残る`);
                    defUnit.battleContext.isSpecialMiracleAndHealAcitivated = true;
                } else if (canActivateSpecialMiracle) {
                    logMiracle(`奥義による祈り発動、${defUnit.getNameWithGroup()}はHP1残る`);
                    defUnit.battleContext.isSpecialMiracleActivated = true;
                } else if (canActivateSpecialOneTimePerMapMiracle) {
                    logMiracle(`奥義による祈り発動(1マップ1回)、${defUnit.getNameWithGroup()}はHP1残る`);
                    defUnit.battleContext.isSpecialOneTimePerMapMiracleAcitivated = true;
                }

                // 祈りの軽減分も軽減ダメージに含める
                // @TODO: 現在の実装だとフィヨルムの氷の聖鏡に将来祈りが外付け出来るようになった場合も祈り軽減がダメージに加算されるのでその時にこの挙動が正しいのか検証する
                if (defUnit.battleContext.nextAttackAddReducedDamageActivated) {
                    let currentHp = defUnit.restHp - totalDamage;
                    let miracleDamage = currentHp - 1;
                    let miracleReducedDamage = currentDamage - miracleDamage;
                    defUnit.battleContext.reducedDamageForNextAttack += miracleReducedDamage;
                }

                totalDamage += defUnit.restHp - totalDamage - 1;

                let isActivatedAnySpecialMiracles =
                    defUnit.battleContext.isSpecialMiracleActivated ||
                    defUnit.battleContext.isSpecialOneTimePerMapMiracleAcitivated ||
                    defUnit.battleContext.isSpecialMiracleAndHealAcitivated;
                if (isActivatedAnySpecialMiracles) {
                    defUnit.battleContext.isSpecialActivated = true;
                    this.__restoreMaxSpecialCount(defUnit);
                }
            } else {
                totalDamage += currentDamage;
            }

            if (!isDefenderSpecialActivated) {
                this.__reduceSpecialCount(defUnit, defReduceSpCount);
            }
            context.damageHistory.push(new DamageLog(atkUnit, defUnit, currentDamage));

            if (this.isLogEnabled) {
                this.writeDebugLog(defUnit.getNameWithGroup() + "の残りHP" + Math.max(0, defUnit.restHp - totalDamage) + "/" + defUnit.maxHpWithSkills);
            }
        }

        return totalDamage;
    }

    applySkillEffectAfterSpecialActivated(targetUnit, enemyUnit, context) {
        for (let skillId of targetUnit.enumerateSkills()) {
            let funcMap = applySkillEffectAfterSpecialActivatedFuncMap;
            if (funcMap.has(skillId)) {
                let func = funcMap.get(skillId);
                if (typeof func === "function") {
                    func.call(this, targetUnit, enemyUnit, context);
                } else {
                    console.warn(`登録された関数が間違っています。key: ${skillId}, value: ${func}, type: ${typeof func}`);
                }
            }
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

    __initContextPerAttack(unit) {
        /** @type {BattleContext} */
        let context = unit.battleContext;
        context.additionalDamagePerAttack = 0;
        context.healedHpByAttackPerAttack = 0;
        context.preventedDefenderSpecialPerAttack = false;
        context.invalidatesDamageReductionExceptSpecialOnSpecialActivationPerAttack = false;
        context.maxHpRatioToHealBySpecialPerAttack = 0;
        context.specialCountReductionBeforeFirstAttackPerAttack = 0;
        context.damageReductionValuePerAttack = 0;
        context.damageReductionValueOfSpecialAttackPerAttack = 0;
    }

    __applySkillEffectsPerAttack(atkUnit, defUnit, canActivateAttackerSpecial) {
        for (let skillId of atkUnit.enumerateSkills()) {
            let funcMap = applySkillEffectsPerAttackFuncMap;
            if (funcMap.has(skillId)) {
                let func = funcMap.get(skillId);
                if (typeof func === "function") {
                    func.call(this, atkUnit, defUnit, canActivateAttackerSpecial);
                } else {
                    console.warn(`登録された関数が間違っています。key: ${skillId}, value: ${func}, type: ${typeof func}`);
                }
            }
            switch (skillId) {
                case Weapon.GustyWarBow:
                    if (atkUnit.battleContext.weaponSkillCondSatisfied) {
                        let isSpecialCharged = atkUnit.hasSpecial && atkUnit.tmpSpecialCount === 0;
                        if (isSpecialCharged || atkUnit.battleContext.isSpecialActivated) {
                            atkUnit.battleContext.additionalDamagePerAttack += 7;
                        }
                    }
                    break;
                case Weapon.SisterlyWarAxe:
                    if (atkUnit.battleContext.weaponSkillCondSatisfied && canActivateAttackerSpecial) {
                        defUnit.battleContext.preventedDefenderSpecialPerAttack = true;
                        atkUnit.battleContext.invalidatesDamageReductionExceptSpecialOnSpecialActivationPerAttack = true;
                    }
                    break;
                // 秘奥3共通効果(固定ダメージ)
                case PassiveA.AtkSpdFinish3:
                case PassiveA.AtkDefFinish3:
                case PassiveA.AtkResFinish3:
                case PassiveA.SpdResFinish3:
                case PassiveA.DefResFinish3:
                    if (atkUnit.battleContext.passiveASkillCondSatisfied) {
                        let isSpecialCharged = atkUnit.hasSpecial && atkUnit.tmpSpecialCount === 0;
                        if (isSpecialCharged || atkUnit.battleContext.isSpecialActivated) {
                            atkUnit.battleContext.additionalDamagePerAttack += 5;
                        }
                    }
                    break;
                case Weapon.Sekuvaveku:
                    if (atkUnit.isWeaponRefined && atkUnit.battleContext.weaponSkillCondSatisfied) {
                        let isSpecialCharged = atkUnit.hasSpecial && atkUnit.tmpSpecialCount === 0;
                        if (isSpecialCharged || atkUnit.battleContext.isSpecialActivated) {
                            atkUnit.battleContext.additionalDamagePerAttack += 5;
                            atkUnit.battleContext.healedHpByAttackPerAttack += 7;
                        }
                    }
                    break;
                // 秘奥4共通効果(固定ダメージ、固定回復)
                case PassiveA.AtkSpdFinish4:
                case PassiveA.AtkDefFinish4:
                case PassiveA.AtkResFinish4:
                case PassiveA.SpdResFinish4:
                case PassiveA.DefResFinish4:
                case PassiveA.VerdictOfSacae:
                    if (atkUnit.battleContext.passiveASkillCondSatisfied) {
                        let isSpecialCharged = atkUnit.hasSpecial && atkUnit.tmpSpecialCount === 0;
                        if (isSpecialCharged || atkUnit.battleContext.isSpecialActivated) {
                            atkUnit.battleContext.additionalDamagePerAttack += 5;
                            atkUnit.battleContext.healedHpByAttackPerAttack += 7;
                        }
                    }
                    break;
                case Special.GodlikeReflexes:
                    if (atkUnit.getEvalSpdInCombat(defUnit) >= defUnit.getEvalSpdInCombat(atkUnit) - 4) {
                        let isSpecialCharged = atkUnit.hasSpecial && atkUnit.tmpSpecialCount === 0;
                        if (isSpecialCharged || atkUnit.battleContext.isSpecialActivated) {
                            atkUnit.battleContext.additionalDamagePerAttack += Math.trunc(atkUnit.getSpdInCombat(defUnit) * 0.15);
                        }
                    }
                    break;
            }
        }
    }

    __applySkillEffectsPerCombat(targetUnit, enemyUnit, context) {
        for (let skillId of targetUnit.enumerateSkills()) {
            let funcMap = applySkillEffectsPerCombatFuncMap;
            if (funcMap.has(skillId)) {
                let func = funcMap.get(skillId);
                if (typeof func === "function") {
                    func.call(this, targetUnit, enemyUnit, context);
                } else {
                    console.warn(`登録された関数が間違っています。key: ${skillId}, value: ${func}, type: ${typeof func}`);
                }
            }
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
        switch (unit.special) {
            case Special.LifeUnending:
                if (unit.battleContext.preventedDefenderSpecial) return false;
                if (unit.tmpSpecialCount === 0) return true;
                break;
        }
        return false;
    }

    /**
     * 奥義以外による祈り+99回復が発動可能か調べる。
     * 祈り無効は考慮されない。
     * @param {Unit} unit 祈りが発動するか調べる対象
     * @param {Unit} atkUnit
     * @return {boolean}
     */
    __canActivateNonSpecialMiracleAndHeal(unit, atkUnit) {
        return unit.battleContext.canActivateNonSpecialMiracleAndHeal;
    }

    __heal(unit, healedHp, enemyUnit) {
        if (enemyUnit.battleContext.invalidatesHeal || unit.hasStatusEffect(StatusEffectType.DeepWounds)) {
            healedHp = Math.trunc(healedHp * unit.battleContext.nullInvalidatesHealRatio);
            if (this.isLogEnabled) {
                this.writeDebugLog(`${unit.getNameWithGroup()}は[回復不可]を${unit.battleContext.nullInvalidatesHealRatio}無効`);
            }
        }

        unit.restHp += healedHp;
        if (unit.restHp > unit.maxHpWithSkills) {
            unit.restHp = unit.maxHpWithSkills;
        }
        if (this.isLogEnabled) {
            let message = `${unit.getNameWithGroup()}は<span style="color: #008800;">${healedHp}回復</span>: HP=${unit.restHp}/${unit.maxHpWithSkills}`;
            this.writeDebugLog(message);
            if (healedHp > 0) {
                this.writeSimpleLog(message);
            }
        }
    }

    __calcUnitAttackDamage(defUnit, atkUnit, damage, damageReductionRatio, damageReductionValue, activatesDefenderSpecial, context) {
        let reducedDamage = floorNumberWithFloatError(damage * damageReductionRatio) + damageReductionValue;
        let currentDamage = Math.max(damage - reducedDamage, 0);
        if (damageReductionRatio > 0.0) {
            if (this.isLogEnabled) this.writeDebugLog("ダメージ軽減率" + floorNumberWithFloatError(damageReductionRatio * 100) + "%");
            if (this.isLogEnabled) this.writeDebugLog("固定ダメージ軽減値-" + damageReductionValue);
            if (this.isLogEnabled) this.writeDebugLog("ダメージ変化:" + damage + "→" + currentDamage);
        } else if (damageReductionValue > 0) {
            if (this.isLogEnabled) this.writeDebugLog("固定ダメージ軽減値-" + damageReductionValue);
            if (this.isLogEnabled) this.writeDebugLog("ダメージ変化:" + damage + "→" + currentDamage);
        }

        if (activatesDefenderSpecial && !defUnit.battleContext.preventedDefenderSpecial) {
            for (let skillId of defUnit.enumerateSkills()) {
                let funcMap = activatesNextAttackSkillEffectAfterSpecialActivatedFuncMap;
                if (funcMap.has(skillId)) {
                    let func = funcMap.get(skillId);
                    if (typeof func === "function") {
                        func.call(this, defUnit, atkUnit);
                    } else {
                        console.warn(`登録された関数が間違っています。key: ${skillId}, value: ${func}, type: ${typeof func}`);
                    }
                }
            }
            switch (defUnit.special) {
                case Special.IceMirror2:
                    if (atkUnit.getActualAttackRange(defUnit) !== 2) break;
                    defUnit.battleContext.nextAttackEffectAfterSpecialActivated = true;
                    break;
                case Special.NegatingFang:
                    defUnit.battleContext.nextAttackEffectAfterSpecialActivated = true;
                    break;
            }
        }

        // 自分の次の攻撃の時にダメージ軽減加算をするための処理
        if (defUnit.battleContext.reducedRatioForNextAttack > 0) {
            if (context.isFirstAttack(atkUnit)) {
                defUnit.battleContext.additionalDamageOfNextAttackByDamageRatio =
                    Math.trunc(damage * defUnit.battleContext.reducedRatioForNextAttack);
            }
        }

        for (let func of defUnit.battleContext.addReducedDamageForNextAttackFuncs) {
            func(defUnit, atkUnit, damage, currentDamage, activatesDefenderSpecial, context);
        }
        switch (defUnit.special) {
            case Special.IceMirror:
                if (activatesDefenderSpecial && !defUnit.battleContext.preventedDefenderSpecial) {
                    if (atkUnit.getActualAttackRange(defUnit) !== 2) break;
                    defUnit.battleContext.nextAttackAddReducedDamageActivated = true;
                    defUnit.battleContext.reducedDamageForNextAttack = damage - currentDamage;
                }
                break;
            case Special.FrostbiteMirror:
                if (activatesDefenderSpecial && !defUnit.battleContext.preventedDefenderSpecial) {
                    defUnit.battleContext.nextAttackAddReducedDamageActivated = true;
                    defUnit.battleContext.reducedDamageForNextAttack = damage - currentDamage;
                }
                break;
        }

        for (let skillId of defUnit.enumerateSkills()) {
            switch (skillId) {
                case PassiveB.FruitOfLife:
                    if (atkUnit.battleContext.restHpPercentage >= 25) {
                        if (!context.isFirstAttack(atkUnit)) break;
                        defUnit.battleContext.nextAttackAddReducedDamageActivated = true;
                        defUnit.battleContext.reducedDamageForNextAttack = damage - currentDamage;
                    }
                    break;
                case Weapon.Aurgelmir:
                    if (!context.isFirstAttack(atkUnit)) break;
                    if (defUnit.battleContext.weaponSkillCondSatisfied) {
                        defUnit.battleContext.nextAttackAddReducedDamageActivated = true;
                        defUnit.battleContext.reducedDamageForNextAttack = damage - currentDamage;
                    }
                    break;
                case Weapon.Ginnungagap:
                    // @TODO: ギンヌンガガプ発動条件についてきちんと検証する
                    if (!context.isFirstAttack(atkUnit)) break;
                    if (defUnit.battleContext.restHpPercentage >= 25) {
                        let isTomeOrStaff = atkUnit.isTome || (atkUnit.weaponType === WeaponType.Staff);
                        if (defUnit.battleContext.initiatesCombat ||
                            (atkUnit.battleContext.initiatesCombat && isTomeOrStaff)) {
                            defUnit.battleContext.nextAttackAddReducedDamageActivated = true;
                            defUnit.battleContext.reducedDamageForNextAttack = damage - currentDamage;
                        }
                    }
                    break;
                case PassiveB.DivineRecreation:
                    if (!context.isFirstAttack(atkUnit)) break;
                    if (atkUnit.battleContext.restHpPercentage >= 50) {
                        defUnit.battleContext.nextAttackAddReducedDamageActivated = true;
                        defUnit.battleContext.reducedDamageForNextAttack = damage - currentDamage;
                    }
                    break;
            }
        }
        return currentDamage;
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
