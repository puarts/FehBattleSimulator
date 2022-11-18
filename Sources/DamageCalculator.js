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
        this.isCounterattack = false;
        this.isFollowupAttack = false;
        this.damageHistory = []; // 攻撃ダメージの履歴
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
        this.damageHistory = [];
        this.atkUnit_totalAttackCount = 0;
        this.defUnit_totalAttackCount = 0;
        this.atkUnit_actualTotalAttackCount = 0;
        this.defUnit_actualTotalAttackCount = 0;
        this.atkUnit_normalAttackDamage = 0;
        this.defUnit_normalAttackDamage = 0;
        this.atkUnit_specialAttackDamage = 0;
        this.defUNit_specialAttackDamage = 0;

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

        // 護り手ユニットかそうでないかを後で区別できるよう結果に戦ったユニットを記録しておく
        this.defUnit = null;
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
        let result = new DamageCalcResult();
        result.defUnit = defUnit;
        result.atkUnit_atk = atkUnit.getAtkInCombat(defUnit);
        result.atkUnit_spd = atkUnit.getSpdInCombat(defUnit);
        result.atkUnit_def = atkUnit.getDefInCombat(defUnit);
        result.atkUnit_res = atkUnit.getResInCombat(defUnit);

        result.defUnit_atk = defUnit.getAtkInCombat(atkUnit);
        result.defUnit_spd = defUnit.getSpdInCombat(atkUnit);
        result.defUnit_def = defUnit.getDefInCombat(atkUnit);
        result.defUnit_res = defUnit.getResInCombat(atkUnit);

        // 戦闘中ダメージ計算
        if (this.isLogEnabled) this.writeDebugLog("戦闘中ダメージ計算..");

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

        result.damageHistory = context.damageHistory;
        return result;
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
            // 反撃
            yield () => self.__counterattack(atkUnit, defUnit, result, context);

            if (defUnit.battleContext.isDefDesperationActivated) {
                // 反撃の追撃
                yield () => self.__followupCounterattack(atkUnit, defUnit, result, context);

                // 攻撃
                yield () => self.__attack(atkUnit, defUnit, result, context);

                // 攻撃の追撃
                yield () => self.__followupAttack(atkUnit, defUnit, result, context);
            }
            else {
                // 攻撃
                yield () => self.__attack(atkUnit, defUnit, result, context);

                if (atkUnit.battleContext.isDesperationActivated) {
                    // 攻撃の追撃
                    yield () => self.__followupAttack(atkUnit, defUnit, result, context);

                    // 反撃の追撃
                    yield () => self.__followupCounterattack(atkUnit, defUnit, result, context);
                }
                else {
                    // 反撃の追撃
                    yield () => self.__followupCounterattack(atkUnit, defUnit, result, context);

                    // 攻撃の追撃
                    yield () => self.__followupAttack(atkUnit, defUnit, result, context);
                }
            }
        }
        else {
            // 攻撃
            yield () => self.__attack(atkUnit, defUnit, result, context);

            if (atkUnit.battleContext.isDesperationActivated) {
                // 攻撃の追撃
                yield () => self.__followupAttack(atkUnit, defUnit, result, context);

                // 反撃
                yield () => self.__counterattack(atkUnit, defUnit, result, context);

                // 反撃の追撃
                yield () => self.__followupCounterattack(atkUnit, defUnit, result, context);
            } else {
                // 反撃
                yield () => self.__counterattack(atkUnit, defUnit, result, context);

                if (defUnit.battleContext.isDefDesperationActivated) {
                    // 反撃の追撃
                    yield () => self.__followupCounterattack(atkUnit, defUnit, result, context);

                    // 攻撃の追撃
                    yield () => self.__followupAttack(atkUnit, defUnit, result, context);
                }
                else {
                    // 攻撃の追撃
                    yield () => self.__followupAttack(atkUnit, defUnit, result, context);

                    // 反撃の追撃
                    yield () => self.__followupCounterattack(atkUnit, defUnit, result, context);
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
            let combatResult = this.__calcCombatDamage(defUnit, atkUnit, context);
            result.defUnit_totalAttackCount += combatResult.attackCount;
            if (defUnit.restHp > 0) {
                result.defUnit_actualTotalAttackCount += combatResult.attackCount;
            }
        }
    }

    __calcFixedAddDamage(atkUnit, defUnit, isPrecombat) {
        let fixedAddDamage = 0;

        for (let skillId of atkUnit.enumerateSkills()) {
            switch (skillId) {
                case Weapon.ArcaneGrima:
                    if (atkUnit.battleContext.restHpPercentage >= 25) {
                        let atk = isPrecombat ? atkUnit.getAtkInPrecombat() : atkUnit.getAtkInCombat(defUnit);
                        atkUnit.atkSpur += Math.trunc(atk * 0.15);
                    }
                    break;
                case Weapon.HurricaneDagger:
                    if (atkUnit.isWeaponSpecialRefined) {
                        if (atkUnit.battleContext.restHpPercentage >= 25) {
                            if (DamageCalculatorWrapper.__getSpd(atkUnit, defUnit, isPrecombat) >
                                DamageCalculatorWrapper.__getSpd(defUnit, atkUnit, isPrecombat)) {
                                atkUnit.battleContext.additionalDamage += 5;
                            }
                        }
                    }
                    break;
                case Weapon.Misteruthin:
                    if (atkUnit.isWeaponSpecialRefined) {
                        atkUnit.battleContext.additionalDamageOfSpecial += Math.min(30, atkUnit.maxHpWithSkills - atkUnit.restHp);
                    }
                    break;
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
        if (!this.__isDead(atkUnit)) {
            this.writeDebugLog("----");
            if (context.isCounterattack) {
                this.writeLog(atkUnit.getNameWithGroup() + "が" + defUnit.getNameWithGroup() + "に反撃");
            }
            else {
                if (context.isFollowupAttack) {
                    this.writeLog(atkUnit.getNameWithGroup() + "が" + defUnit.getNameWithGroup() + "に追撃");
                }
                else {
                    this.writeLog(atkUnit.getNameWithGroup() + "が" + defUnit.getNameWithGroup() + "を攻撃");
                }
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
        if (this.isLogEnabled) this.__logAttackerAndAttackee(atkUnit, defUnit, context);

        this.__calcAndSetCooldownCount(atkUnit, defUnit);
        // 奥義発動可能状態の時に固定ダメージ(秘奥)などの効果があるので攻撃ダメージ処理の最初の方で奥義カウント変動処理を行う
        if (context.isFirstAttack(atkUnit)) {
            let totalCount =
                atkUnit.tmpSpecialCount
                - atkUnit.battleContext.specialCountReductionBeforeFirstAttack
                + atkUnit.battleContext.specialCountIncreaseBeforeFirstAttack;
            atkUnit.tmpSpecialCount = Math.min(Math.max(0, totalCount), atkUnit.maxSpecialCount);
        }

        let totalAtk = atkUnit.getAtkInCombat(defUnit);

        let atkCountPerOneAttack = context.isCounterattack ? atkUnit.battleContext.counterattackCount : atkUnit.battleContext.attackCount;
        let specialMultDamage = atkUnit.battleContext.specialMultDamage;
        let specialAddDamage = atkUnit.battleContext.specialAddDamage;

        let mitHp = defUnit.restHp;
        let defInCombat = defUnit.getDefInCombat(atkUnit);
        let resInCombat = defUnit.getResInCombat(atkUnit);

        let totalMit = atkUnit.battleContext.refersRes ? resInCombat : defInCombat;
        let specialTotalMit = atkUnit.battleContext.refersResForSpecial ? resInCombat : defInCombat; // 攻撃側の奥義発動時の防御力

        let fixedAddDamage = this.__calcFixedAddDamage(atkUnit, defUnit, false);
        fixedAddDamage += atkUnit.battleContext.additionalDamageOfNextAttack;
        fixedAddDamage += atkUnit.battleContext.additionalDamagePerAttack;
        atkUnit.battleContext.additionalDamageOfNextAttack = 0;
        if (context.isFirstAttack(atkUnit)) {
            fixedAddDamage += atkUnit.battleContext.additionalDamageOfFirstAttack;
        }
        let fixedSpecialAddDamage = atkUnit.battleContext.additionalDamageOfSpecial;
        let invalidatesDamageReductionExceptSpecialOnSpecialActivation = atkUnit.battleContext.invalidatesDamageReductionExceptSpecialOnSpecialActivation;
        let invalidatesDamageReductionExceptSpecial = atkUnit.battleContext.invalidatesDamageReductionExceptSpecial;
        specialAddDamage += floorNumberWithFloatError((atkUnit.maxHpWithSkills - atkUnit.restHp) * atkUnit.battleContext.selfDamageDealtRateToAddSpecialDamage);
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
        let damage = truncNumberWithFloatError((finalAtk - finalMit) * damageReduceRatio);
        if (damage < 0) {
            damage = 0;
        }
        damage += fixedAddDamage;

        let specialSuffer = atkUnit.battleContext.specialSufferPercentage;
        let specialSufferRatio = (specialSuffer / 100.0);
        let specialFinalMit = floorNumberWithFloatError((specialTotalMit - floorNumberWithFloatError(specialTotalMit * specialSufferRatio)) + floorNumberWithFloatError(specialTotalMit * mitAdvRatio));
        let specialDamage = truncNumberWithFloatError((finalAtk - specialFinalMit) * damageReduceRatio * specialMultDamage) + specialAddDamage;
        if (specialDamage < 0) {
            specialDamage = 0;
        }
        specialDamage += fixedAddDamage;
        specialDamage += fixedSpecialAddDamage;
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
            if (atkUnit.battleContext.refersRes != atkUnit.battleContext.refersResForSpecial) {
                if (atkUnit.battleContext.refersResForSpecial) {
                    this.writeDebugLog("奥義発動時は魔防参照")
                }
                else {
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
            this.writeSimpleLog(`範囲奥義によるダメージ${totalDamageWithOverkill}(HP: → ${defUnit.restHp})`);
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

        let rangedSpecialDamage = floorNumberWithFloatError(
            Math.max(0, atkUnit.getAtkInPrecombat() - tmpMit) * atkUnit.battleContext.precombatSpecialDamageMult);

        let addDamage = this.__calcFixedAddDamage(atkUnit, defUnit, true);
        let specialAddDamage = atkUnit.battleContext.additionalDamageOfSpecial;
        let damage = rangedSpecialDamage + addDamage + specialAddDamage;

        let damageReductionRatio = defUnit.battleContext.damageReductionRatioForPrecombat;

        let reducedDamage = floorNumberWithFloatError(damage * damageReductionRatio);
        let currentDamage = Math.max(damage - reducedDamage, 0);

        if (this.isLogEnabled) {
            if (atkUnit.battleContext.refersRes) {
                this.writeDebugLog(`魔防参照:魔防=${tmpMit}`);
            }
            else {
                this.writeDebugLog(`守備参照:守備=${tmpMit}`);
            }

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
            this.__applySkillEffectsPerAttack(atkUnit, defUnit);
            this.__applySkillEffectsPerAttack(defUnit, atkUnit);
            let activatesAttackerSpecial = hasAtkUnitSpecial && atkUnit.tmpSpecialCount === 0;
            let activatesDefenderSpecial = hasDefUnitSpecial && defUnit.tmpSpecialCount === 0 &&
                !defUnit.battleContext.preventedDefenderSpecial && this.__isSatisfiedDefenderSpecialCond(defUnit, atkUnit);
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

                if (context.isFollowupAttack) {
                    // 追撃
                    damageReductionRatio *= 1.0 - defUnit.battleContext.damageReductionRatioOfFollowupAttack;
                }
            }

            let invalidatesOnSpecialActivation =
                activatesAttackerSpecial && invalidatesDamageReductionExceptSpecialOnSpecialActivation;
            if (invalidatesOnSpecialActivation || invalidatesDamageReductionExceptSpecial) {
                if (this.isLogEnabled) this.writeDebugLog("奥義以外のダメージ軽減を無効化");
                damageReductionRatio = 1.0;
            }

            // 奥義によるダメージ軽減
            let isDefenderSpecialActivated = false;
            // 奥義の次の攻撃のダメージ軽減
            for (let ratio of defUnit.battleContext.damageReductionRatiosBySpecialOfNextAttack) {
                damageReductionRatio *= 1.0 - ratio;
            }
            defUnit.battleContext.damageReductionRatiosBySpecialOfNextAttack = [];

            if (activatesDefenderSpecial) {
                if (defUnit.battleContext.damageReductionRatioBySpecial > 0) {
                    damageReductionRatio *= 1.0 - defUnit.battleContext.damageReductionRatioBySpecial;
                    if (defUnit.passiveB === PassiveB.HardyFighter3) {
                        damageReductionRatio *= 1.0 - defUnit.battleContext.damageReductionRatioBySpecial;
                    }
                    isDefenderSpecialActivated = true;
                }

                if (isDefenderSpecialActivated) {
                    defUnit.battleContext.isSpecialActivated = true;
                    if (defUnit.passiveB === PassiveB.TateNoKodo3 ||
                        defUnit.passiveB === PassiveB.HardyFighter3) {
                        damageReductionValue += 5;
                    } else if (defUnit.weapon === Weapon.MoonlightStone) {
                        damageReductionValue += 8;
                    }
                    this.__restoreMaxSpecialCount(defUnit);
                }
            }

            damageReductionRatio = 1.0 - damageReductionRatio;
            damageReductionValue += defUnit.battleContext.damageReductionValue;

            let currentDamage = 0;
            if (activatesAttackerSpecial) {
                atkUnit.battleContext.isSpecialActivated = true;
                switch (atkUnit.special) {
                    case Special.DevinePulse: {
                        atkUnit.battleContext.damageReductionRatiosBySpecialOfNextAttack.push(0.75);
                        let spd = atkUnit.getSpdInCombat(defUnit);
                        atkUnit.battleContext.additionalDamageOfNextAttack += Math.trunc(spd * 0.2);
                    }
                        break;
                }
                // 奥義発動
                currentDamage = this.__calcUnitAttackDamage(defUnit, atkUnit, specialDamage, damageReductionRatio, damageReductionValue, activatesDefenderSpecial, context);
                if (this.isLogEnabled) this.writeLog("奥義によるダメージ" + currentDamage);
                this.writeSimpleLog(" " + atkUnit.getNameWithGroup() + "→" + defUnit.getNameWithGroup() + "<br/>奥義ダメージ" + currentDamage);
                this.__restoreMaxSpecialCount(atkUnit);

                // 奥義発動時の回復
                {
                    let actualDamage = currentDamage;
                    if (defUnit.restHp < currentDamage) {
                        actualDamage = defUnit.restHp;
                    }

                    let healedHp = floorNumberWithFloatError(actualDamage * atkUnit.battleContext.specialDamageRatioToHeal);
                    healedHp += floorNumberWithFloatError(atkUnit.maxHpWithSkills * atkUnit.battleContext.maxHpRatioToHealBySpecial);

                    if (atkUnit.passiveB === PassiveB.TaiyoNoUdewa) {
                        healedHp += floorNumberWithFloatError(actualDamage * 0.3);
                    }

                    this.__heal(atkUnit, healedHp, defUnit);
                }
            }
            else {
                // 通常攻撃
                currentDamage = this.__calcUnitAttackDamage(defUnit, atkUnit, normalDamage, damageReductionRatio, damageReductionValue, activatesDefenderSpecial, context);
                if (this.isLogEnabled) this.writeLog("通常攻撃によるダメージ" + currentDamage);
                this.writeSimpleLog(atkUnit.getNameWithGroup() + "→" + defUnit.getNameWithGroup() + "<br/>通常攻撃ダメージ" + currentDamage);
                this.__reduceSpecialCount(atkUnit, atkReduceSpCount);
            }

            {
                let healHpAmount = this.__getHealAmountByAttack(atkUnit, defUnit, currentDamage);
                if (healHpAmount > 0) {
                    if (this.isLogEnabled) this.writeDebugLog(`${atkUnit.getNameWithGroup()}は${healHpAmount}回復`);
                    this.__heal(atkUnit, healHpAmount, defUnit);
                }
            }

            let canActivateMiracle = this.__canActivateMiracle(defUnit, atkUnit);
            let canActivateSpecialMiracle = this.__canActivateSpecialMiracle(defUnit, atkUnit);
            if (canActivateMiracle &&
                (defUnit.restHp - totalDamage > 1) &&
                (defUnit.restHp - totalDamage - currentDamage <= 0)) {
                if (this.isLogEnabled) this.writeLog("祈り効果発動、" + defUnit.getNameWithGroup() + "はHP1残る");
                // @TODO: 現在の実装だとフィヨルムの氷の聖鏡に将来祈りが外付け出来るようになった場合も祈り軽減がダメージに加算されるのでその時にこの挙動が正しいのか検証する
                if (defUnit.battleContext.nextAttackAddReducedDamageActivated) {
                    let currentHp = defUnit.restHp - totalDamage;
                    let miracleDamage = currentHp - 1;
                    let miracleReducedDamage = currentDamage - miracleDamage;
                    defUnit.battleContext.reducedDamageForNextAttack += miracleReducedDamage;
                }
                totalDamage = defUnit.restHp - 1;
                if (canActivateSpecialMiracle) {
                    if (defUnit.special === Special.Miracle ||
                        defUnit.special === Special.LifeUnending) {
                        defUnit.battleContext.isSpecialActivated = true;
                        this.__restoreMaxSpecialCount(defUnit);
                    }
                } else {
                    defUnit.battleContext.isMiracleWithoutSpecialActivated = true;
                    if (defUnit.special === Special.CircletOfBalance) {
                        defUnit.battleContext.isOncePerMapSpecialActivated = true;
                    }
                }
            }
            else {
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

    __initContextPerAttack(unit) {
        unit.battleContext.additionalDamagePerAttack = 0;
        unit.battleContext.healedHpByAttackPerAttack = 0;
    }

    __applySkillEffectsPerAttack(atkUnit, defUnit) {
        for (let skillId of atkUnit.enumerateSkills()) {
            switch (skillId) {
                case PassiveA.AtkSpdFinish4:
                case PassiveA.AtkResFinish4:
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
                        if (isSpecialCharged || atkUnit.isSpecialActivated) {
                            atkUnit.battleContext.additionalDamagePerAttack += Math.trunc(atkUnit.getSpdInCombat(defUnit) * 0.15);
                        }
                    }
                    break;
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

    __getHealAmountByAttack(targetUnit, defUnit, currentDamage) {
        let healedHp = targetUnit.battleContext.healedHpByAttack + targetUnit.battleContext.healedHpByAttackPerAttack;
        healedHp += floorNumberWithFloatError(currentDamage * targetUnit.battleContext.damageRatioToHeal);
        return healedHp;
    }

    __canActivateMiracle(unit, atkUnit) {
        let threshold = unit.battleContext.inCombatMiracleHpPercentageThreshold;
        if (threshold !== Number.MAX_SAFE_INTEGER) {
            if (unit.restHpPercentage >= threshold) {
                return true;
            }
        }
        for (let skillId of unit.enumerateSkills()) {
            switch (skillId) {
                case Weapon.YmirEverliving:
                    if (unit.battleContext.initiatesCombat || isRangedWeaponType(atkUnit.weaponType) &&
                        unit.battleContext.restHpPercentage >= 25) {
                        return true;
                    }
                    break;
                case Special.CircletOfBalance: {
                    let condA =
                        (unit.isSpecialCharged || atkUnit.isSpecialCharged) ||
                        (unit.isSpecialActivated || atkUnit.isSpecialActivated);
                    let condB = unit.battleContext.initiatesCombat || isRangedWeaponType(atkUnit.weaponType);
                    // 1回発動したかどうかはコンテキストかユニットの両方を見る必要がある
                    // ユニットが保持する値はリアルタイムに保持されずにDamageTypeがActualDamageの時に戦闘後にユニットにコピーされる
                    let isOncePerMapSpecialActivated =
                        unit.isOncePerMapSpecialActivated ||
                        unit.battleContext.isOncePerMapSpecialActivated;
                    if ((condA || condB) && !isOncePerMapSpecialActivated) {
                        return true;
                    }
                }
                    break;
                case Weapon.HolytideTyrfing:
                    if (Unit.calcAttackerMoveDistance(unit, atkUnit) !== 0 &&
                        unit.battleContext.restHpPercentage >= 25 &&
                        !unit.battleContext.isMiracleWithoutSpecialActivated) {
                        return true;
                    }
                    break;
                case Weapon.MilasTestament:
                    if (unit.battleContext.weaponSkillCondSatisfied &&
                        unit.battleContext.restHpPercentage >= 25 &&
                        !unit.battleContext.isMiracleWithoutSpecialActivated) {
                        return true;
                    }
                    break;
                case Weapon.BowOfTwelve:
                    if (unit.battleContext.initiatesCombat ||
                        (unit.battleContext.restHpPercentage >= 75 &&
                            (atkUnit.isTome || atkUnit.weaponType === WeaponType.Staff))) {
                        return true;
                    }
                    break;
                case Weapon.Thirufingu:
                    if (unit.battleContext.restHpPercentage >= 50) return true;
                    break;
                case Weapon.HelsReaper:
                    if (!isWeaponTypeTome(atkUnit.weaponType) && atkUnit.weaponType != WeaponType.Staff) {
                        return true;
                    }
                    break;
            }
        }
        if (this.__canActivateSpecialMiracle(unit, atkUnit)) {
            return true;
        }
        return false;
    }

    __canActivateSpecialMiracle(unit, atkUnit) {
        switch (unit.special) {
            case Special.LifeUnending:
            case Special.Miracle:
                if (unit.battleContext.preventedDefenderSpecial) return false;
                if (unit.tmpSpecialCount === 0) return true;
                break;
        }
        return false;
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
            this.writeDebugLog(`${unit.getNameWithGroup()}は${healedHp}回復: HP=${unit.restHp}/${unit.maxHpWithSkills}`);
        }
    }

    __calcUnitAttackDamage(defUnit, atkUnit, damage, damageReductionRatio, damageReductionValue, activatesDefenderSpecial, context) {
        let reducedDamage = floorNumberWithFloatError(damage * damageReductionRatio) + damageReductionValue;
        let currentDamage = Math.max(damage - reducedDamage, 0);
        if (damageReductionRatio > 0.0) {
            if (this.isLogEnabled) this.writeDebugLog("ダメージ軽減率" + floorNumberWithFloatError(damageReductionRatio * 100) + "%");
            if (this.isLogEnabled) this.writeDebugLog("固定ダメージ軽減値-" + damageReductionValue);
            if (this.isLogEnabled) this.writeDebugLog("ダメージ変化:" + damage + "→" + currentDamage);
        }

        if (activatesDefenderSpecial) {
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
        switch (defUnit.special) {
            case Special.IceMirror:
                if (activatesDefenderSpecial) {
                    if (atkUnit.getActualAttackRange(defUnit) !== 2) break;
                    defUnit.battleContext.nextAttackAddReducedDamageActivated = true;
                    defUnit.battleContext.reducedDamageForNextAttack = damage - currentDamage;
                }
                break;
        }

        for (let skillId of defUnit.enumerateSkills()) {
            switch (skillId) {
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
