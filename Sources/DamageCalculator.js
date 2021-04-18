/// @file
/// @brief DamageCalculator クラスとそれに関連するクラスや関数等の定義です。

var TriangleAdvantage = {
    None: 0,
    Advantageous: 1,
    Disadvantageous: 2,
};

/// ダメージ計算時に一時的に使用するコンテキストです。
class DamageCalcContext {
    constructor() {
        this.isCounterattack = false;
        this.isFollowupAttack = false;
        this.attackedUnitHistory = []; // 攻撃したユニットの履歴
    }

    isFirstAttack(atkUnit) {
        for (let unit of this.attackedUnitHistory) {
            if (unit == atkUnit) {
                return false;
            }
        }

        return true;
    }

    isConsecutiveAttack(atkUnit) {
        return this.attackedUnitHistory[this.attackedUnitHistory.length - 1] == atkUnit;
    }
}

/// ダメージ計算結果を表すクラスです。
class DamageCalcResult {
    constructor() {
        this.atkUnit_totalAttackCount = 0;
        this.defUnit_totalAttackCount = 0;
        this.atkUnit_actualTotalAttackCount = 0;
        this.defUnit_actualTotalAttackCount = 0;
        this.atkUnit_normalAttackDamage = 0;
        this.defUnit_normalAttackDamage = 0;

        this.preCombatDamage = 0;

        // 護り手ユニットかそうでないかを後で区別できるよう結果に戦ったユニットを記録しておく
        this.defUnit = null;
    }
}

/// ダメージ計算を行うためのクラスです。
class DamageCalculator {
    constructor() {
        this._log = "";
        this._simpleLog = "";
        this.isLogEnabled = true;
    }

    get log() {
        return this._log;
    }
    get simpleLog() {
        return this._simpleLog.substring(0, this._simpleLog.length - "<br/>".length);
    }

    writeSimpleLog(log) {
        if (!this.isLogEnabled) {
            return;
        }
        this._simpleLog += log + "<br/>";
    }

    writeLog(log) {
        if (!this.isLogEnabled) {
            return;
        }
        this._log += log + "<br/>";
    }
    writeDebugLog(log) {
        if (!this.isLogEnabled) {
            return;
        }
        this._log += "<span style='font-size:10px; color:#666666'>" + log + "</span><br/>";
    }
    writeRestHpLog(unit) {
        if (!this.isLogEnabled) {
            return;
        }
        this.writeLog(unit.name + "の残りHP " + unit.restHp + "/" + unit.maxHpWithSkills);
    }

    clearLog() {
        this._log = "";
        this._simpleLog = "";
    }

    /// ダメージ計算を行います。
    /// @param {Unit} atkUnit 攻撃をするユニットです。
    /// @param {Unit} defUnit 攻撃を受けるユニットです。
    calc(atkUnit, defUnit) {
        // 初期化
        var context = new DamageCalcContext();
        var result = new DamageCalcResult();
        result.defUnit = defUnit;

        // 戦闘中ダメージ計算
        this.writeDebugLog("戦闘中ダメージ計算..");

        this.__setSkillEffetToContext(atkUnit, defUnit);

        if (defUnit.battleContext.isVantageActivated) {
            // 反撃
            this.__counterattack(atkUnit, defUnit, result, context);
            // if (this.__isAnyoneDead(atkUnit, defUnit)) { return result; }

            if (defUnit.battleContext.isDefDesperationActivated) {
                // 反撃の追撃
                this.__followupCounterattack(atkUnit, defUnit, result, context);
                // if (this.__isAnyoneDead(atkUnit, defUnit)) { return result; }

                // 攻撃
                this.__attack(atkUnit, defUnit, result, context);
                // if (this.__isAnyoneDead(atkUnit, defUnit)) { return result; }

                // 攻撃の追撃
                this.__followupAttack(atkUnit, defUnit, result, context);
                // if (this.__isAnyoneDead(atkUnit, defUnit)) { return result; }
            }
            else {
                // 攻撃
                this.__attack(atkUnit, defUnit, result, context);
                // if (this.__isAnyoneDead(atkUnit, defUnit)) { return result; }

                if (atkUnit.battleContext.isDesperationActivated) {
                    // 攻撃の追撃
                    this.__followupAttack(atkUnit, defUnit, result, context);
                    // if (this.__isAnyoneDead(atkUnit, defUnit)) { return result; }

                    // 反撃の追撃
                    this.__followupCounterattack(atkUnit, defUnit, result, context);
                    // if (this.__isAnyoneDead(atkUnit, defUnit)) { return result; }
                }
                else {
                    // 反撃の追撃
                    this.__followupCounterattack(atkUnit, defUnit, result, context);
                    // if (this.__isAnyoneDead(atkUnit, defUnit)) { return result; }

                    // 攻撃の追撃
                    this.__followupAttack(atkUnit, defUnit, result, context);
                    // if (this.__isAnyoneDead(atkUnit, defUnit)) { return result; }
                }
            }
        }
        else {
            // 攻撃
            this.__attack(atkUnit, defUnit, result, context);
            // if (this.__isAnyoneDead(atkUnit, defUnit)) { return result; }

            if (atkUnit.battleContext.isDesperationActivated) {
                // 攻撃の追撃
                this.__followupAttack(atkUnit, defUnit, result, context);
                // if (this.__isAnyoneDead(atkUnit, defUnit)) { return result; }

                // 反撃
                this.__counterattack(atkUnit, defUnit, result, context);
                // if (this.__isAnyoneDead(atkUnit, defUnit)) { return result; }

                // 反撃の追撃
                this.__followupCounterattack(atkUnit, defUnit, result, context);
                // if (this.__isAnyoneDead(atkUnit, defUnit)) { return result; }
            } else {
                // 反撃
                this.__counterattack(atkUnit, defUnit, result, context);
                // if (this.__isAnyoneDead(atkUnit, defUnit)) { return result; }

                if (defUnit.battleContext.isDefDesperationActivated) {
                    // 反撃の追撃
                    this.__followupCounterattack(atkUnit, defUnit, result, context);

                    // 攻撃の追撃
                    this.__followupAttack(atkUnit, defUnit, result, context);
                    // if (this.__isAnyoneDead(atkUnit, defUnit)) { return result; }
                }
                else {
                    // 攻撃の追撃
                    this.__followupAttack(atkUnit, defUnit, result, context);
                    // if (this.__isAnyoneDead(atkUnit, defUnit)) { return result; }

                    // 反撃の追撃
                    this.__followupCounterattack(atkUnit, defUnit, result, context);
                    // if (this.__isAnyoneDead(atkUnit, defUnit)) { return result; }
                }
            }
        }

        return result;
    }

    __setBothOfAtkDefSkillEffetToContextForEnemyUnit(atkUnit, defUnit) {
        if (atkUnit.hasPassiveSkill(PassiveB.Cancel3)) {
            if (atkUnit.snapshot.restHpPercentage >= 80) {
                defUnit.battleContext.cooldownCount = 1;
            }
        }
    }

    __multiplyDamageReductionRatio(sourceRatio, ratio, enemyUnit) {
        let modifiedRatio = this.__calcDamageReductionRatio(ratio, enemyUnit);
        return 1 - (1 - sourceRatio) * (1 - modifiedRatio);
    }

    __setBothOfAtkDefSkillEffetToContext(unit, enemyUnit) {
        switch (unit.weapon) {
            case Weapon.LoyalistAxe:
                if ((enemyUnit.battleContext.initiatesCombat || enemyUnit.snapshot.restHpPercentage >= 75) &&
                    enemyUnit.battleContext.canFollowupAttack) {
                    unit.battleContext.damageReductionRatioOfFirstAttack =
                        this.__multiplyDamageReductionRatio(unit.battleContext.damageReductionRatioOfFirstAttack, 0.75, enemyUnit);
                }
                break;
            case Weapon.Hrist:
                if (unit.snapshot.restHpPercentage <= 99) {
                    unit.battleContext.damageReductionRatioOfFirstAttack =
                        this.__multiplyDamageReductionRatio(unit.battleContext.damageReductionRatioOfFirstAttack, 0.3, enemyUnit);
                }
                break;
            case Weapon.CourtlyMaskPlus:
            case Weapon.CourtlyBowPlus:
            case Weapon.CourtlyCandlePlus:
                if (unit.snapshot.restHpPercentage >= 50 && enemyUnit.battleContext.canFollowupAttack) {
                    unit.battleContext.damageReductionRatioOfFirstAttack =
                        this.__multiplyDamageReductionRatio(unit.battleContext.damageReductionRatioOfFirstAttack, 0.5, enemyUnit);
                }
                break;
            case Weapon.SummerStrikers:
                if (unit.battleContext.initiatesCombat && unit.snapshot.restHpPercentage >= 25) {
                    unit.battleContext.damageReductionRatioOfFirstAttack =
                        this.__multiplyDamageReductionRatio(unit.battleContext.damageReductionRatioOfFirstAttack, 0.75, enemyUnit);
                }
                break;
            case Weapon.Urvan:
                {
                    unit.battleContext.damageReductionRatioOfConsecutiveAttacks =
                        this.__multiplyDamageReductionRatio(unit.battleContext.damageReductionRatioOfConsecutiveAttacks, 0.8, enemyUnit);
                    if (unit.isWeaponSpecialRefined) {
                        unit.battleContext.damageReductionRatioOfFirstAttack =
                            this.__multiplyDamageReductionRatio(unit.battleContext.damageReductionRatioOfFirstAttack, 0.4, enemyUnit);
                    }
                }
                break;
            case Weapon.SplashyBucketPlus:
                {
                    unit.battleContext.invalidatesReferenceLowerMit = true;
                }
                break;
        }
        for (let skillId of unit.enumeratePassiveSkills()) {
            switch (skillId) {
                case PassiveB.BlackEagleRule:
                    if (!unit.battleContext.initiatesCombat && unit.snapshot.restHpPercentage >= 25) {
                        unit.battleContext.damageReductionRatioOfFollowupAttack =
                            this.__multiplyDamageReductionRatio(unit.battleContext.damageReductionRatioOfFollowupAttack, 0.8, enemyUnit);
                    }
                    break;
                case PassiveB.SeikishiNoKago:
                    if (isRangedWeaponType(enemyUnit.weaponType)) {
                        unit.battleContext.damageReductionRatioOfConsecutiveAttacks =
                            this.__multiplyDamageReductionRatio(unit.battleContext.damageReductionRatioOfConsecutiveAttacks, 0.8, enemyUnit);
                    }
                    break;
                case PassiveS.RengekiBogyoKenYariOno3:
                    if (enemyUnit.weaponType == WeaponType.Sword
                        || enemyUnit.weaponType == WeaponType.Lance
                        || enemyUnit.weaponType == WeaponType.Axe
                    ) {
                        unit.battleContext.damageReductionRatioOfConsecutiveAttacks =
                            this.__multiplyDamageReductionRatio(unit.battleContext.damageReductionRatioOfConsecutiveAttacks, 0.8, enemyUnit);
                    }
                    break;
                case PassiveS.RengekiBogyoYumiAnki3:
                    if (isWeaponTypeBow(enemyUnit.weaponType)
                        || isWeaponTypeDagger(enemyUnit.weaponType)
                    ) {
                        unit.battleContext.damageReductionRatioOfConsecutiveAttacks =
                            this.__multiplyDamageReductionRatio(unit.battleContext.damageReductionRatioOfConsecutiveAttacks, 0.8, enemyUnit);
                    }
                    break;
                case PassiveS.RengekiBogyoMado3:
                    if (isWeaponTypeTome(enemyUnit.weaponType)
                    ) {
                        unit.battleContext.damageReductionRatioOfConsecutiveAttacks =
                            this.__multiplyDamageReductionRatio(unit.battleContext.damageReductionRatioOfConsecutiveAttacks, 0.8, enemyUnit);
                    }
                    break;
            }
        }
    }

    __setSkillEffetToContext(atkUnit, defUnit) {
        this.__setBothOfAtkDefSkillEffetToContext(atkUnit, defUnit);
        this.__setBothOfAtkDefSkillEffetToContext(defUnit, atkUnit);
        this.__setBothOfAtkDefSkillEffetToContextForEnemyUnit(atkUnit, defUnit);
        this.__setBothOfAtkDefSkillEffetToContextForEnemyUnit(defUnit, atkUnit);

        if (!canDisableAttackOrderSwapSkill(atkUnit, atkUnit.snapshot.restHpPercentage)
            && !canDisableAttackOrderSwapSkill(defUnit, defUnit.snapshot.restHpPercentage)
        ) {
            if (atkUnit.hasStatusEffect(StatusEffectType.Desperation)) {
                atkUnit.battleContext.isDesperationActivated = true;
            }
            if (defUnit.hasStatusEffect(StatusEffectType.Vantage)) {
                defUnit.battleContext.isVantageActivated = true;
            }

            // 攻撃順入替えスキル
            for (let skillId of defUnit.enumerateSkills()) {
                switch (skillId) {
                    case PassiveB.HolyWarsEnd:
                        if (defUnit.snapshot.restHpPercentage >= 50) {
                            this.writeDebugLog("HP：" + defUnit.snapshot.restHpPercentage + "%で最後の聖戦発動、" + defUnit.getNameWithGroup() + "は攻撃の直後に追撃");
                            defUnit.battleContext.isDefDesperationActivated = true;
                        }
                        break;
                    case Weapon.Urvan:
                        {
                            if (defUnit.isWeaponSpecialRefined) {
                                // 攻め立て強制
                                this.writeDebugLog(`ウルヴァンにより${defUnit.getNameWithGroup()}は攻め立て強制`);
                                atkUnit.battleContext.isDesperationActivated = true;
                            }
                        }
                        break;
                    case Weapon.Reipia:
                    case PassiveB.Vantage3: // 待ち伏せ3
                        {
                            this.writeDebugLog("待ち伏せ評価: hpPercentage=" + defUnit.snapshot.restHpPercentage);
                            if (defUnit.snapshot.restHpPercentage <= 75) {
                                this.writeDebugLog("HP" + defUnit.snapshot.restHpPercentage + "%で待ち伏せ発動、" + defUnit.getNameWithGroup() + "は先制攻撃");
                                defUnit.battleContext.isVantageActivated = true;
                            }
                        }
                        break;
                    case Weapon.AsameiNoTanken:
                        if (!atkUnit.snapshot.isFullHp) {
                            defUnit.battleContext.isVantageActivated = true;
                        }
                        break;
                    case Weapon.FeatherSword:
                        {
                            if (defUnit.snapshot.restHpPercentage <= 75
                                || atkUnit.weaponType == WeaponType.Sword
                                || atkUnit.weaponType == WeaponType.Lance
                                || atkUnit.weaponType == WeaponType.Axe
                                || atkUnit.weaponType == WeaponType.ColorlessBow
                                || atkUnit.moveType == MoveType.Armor
                            ) {
                                this.writeDebugLog("待ち伏せ発動、" + defUnit.getNameWithGroup() + "は先制攻撃");
                                defUnit.battleContext.isVantageActivated = true;
                            }
                        }
                        break;
                }
            }

            for (let skillId of atkUnit.enumerateSkills()) {
                switch (skillId) {
                    case Weapon.Thunderbrand:
                        if (defUnit.snapshot.restHpPercentage >= 50) {
                            atkUnit.battleContext.isDesperationActivated = true;
                        }
                        break;
                    case Weapon.TalreganAxe:
                        atkUnit.battleContext.isDesperationActivated = true;
                        break;
                    case Weapon.DarkSpikesT:
                        if (atkUnit.snapshot.restHpPercentage <= 99) {
                            this.writeDebugLog("HP" + atkUnit.snapshot.restHpPercentage + "%でダークスパイクτの攻め立て効果発動、" + atkUnit.getNameWithGroup() + "は自分の攻撃の直後に追撃");
                            atkUnit.battleContext.isDesperationActivated = true;
                        }
                        break;
                    case Weapon.Forusethi:
                        if (atkUnit.isWeaponRefined) {
                            if (atkUnit.snapshot.restHpPercentage >= 25) {
                                atkUnit.battleContext.isDesperationActivated = true;
                            }
                        }
                        else {
                            if (atkUnit.snapshot.restHpPercentage >= 50) {
                                atkUnit.battleContext.isDesperationActivated = true;
                            }
                        }
                        break;
                    case Weapon.YonkaiNoSaiki:
                    case Weapon.AnkokuNoKen:
                        if (atkUnit.snapshot.restHpPercentage >= 50) {
                            atkUnit.battleContext.isDesperationActivated = true;
                        }
                        break;
                    case PassiveB.KyusyuTaikei3:
                        if (atkUnit.snapshot.restHpPercentage <= 80) {
                            this.writeDebugLog("HP" + atkUnit.snapshot.restHpPercentage + "%で急襲隊形発動、" + atkUnit.getNameWithGroup() + "は自分の攻撃の直後に追撃");
                            atkUnit.battleContext.isDesperationActivated = true;
                        }
                        break;
                    case Weapon.SoulCaty:
                        if (atkUnit.isWeaponSpecialRefined) {
                            if (atkUnit.snapshot.restHpPercentage <= 75) {
                                atkUnit.battleContext.isDesperationActivated = true;
                            }
                        }
                        else {
                            if (atkUnit.snapshot.restHpPercentage <= 50) {
                                atkUnit.battleContext.isDesperationActivated = true;
                            }
                        }
                        break;
                    case PassiveB.DiveBomb3:
                        if (atkUnit.snapshot.restHpPercentage >= 80 && defUnit.snapshot.restHpPercentage >= 80) {
                            this.writeDebugLog("空からの急襲3発動、" + atkUnit.getNameWithGroup() + "は自分の攻撃の直後に追撃");
                            atkUnit.battleContext.isDesperationActivated = true;
                        }
                        break;
                    case Weapon.Hitode:
                    case Weapon.HitodePlus:
                    case Weapon.NangokuJuice:
                    case Weapon.NangokuJuicePlus:
                    case Weapon.SakanaNoYumi:
                    case Weapon.SakanaNoYumiPlus:
                    case PassiveB.SphiasSoul:
                    case PassiveB.Desperation3: // 攻め立て3
                        if (atkUnit.snapshot.restHpPercentage <= 75) {
                            this.writeDebugLog("HP" + atkUnit.snapshot.restHpPercentage + "%で攻め立て発動、" + atkUnit.getNameWithGroup() + "は自分の攻撃の直後に追撃");
                            atkUnit.battleContext.isDesperationActivated = true;
                        }
                        break;
                    case Weapon.IhoNoHIken:
                        if (atkUnit.isWeaponSpecialRefined) {
                            if (atkUnit.snapshot.restHpPercentage <= 75) {
                                this.writeDebugLog("HP" + atkUnit.snapshot.restHpPercentage + "%で攻め立て発動、" + atkUnit.getNameWithGroup() + "は自分の攻撃の直後に追撃");
                                atkUnit.battleContext.isDesperationActivated = true;
                            }
                        }
                        break;
                    case PassiveB.KillingIntent:
                        {
                            if (defUnit.snapshot.restHpPercentage < 100 || defUnit.hasNegativeStatusEffect()) {
                                this.writeDebugLog("死んでほしいの発動、" + atkUnit.getNameWithGroup() + "は自分の攻撃の直後に追撃");
                                atkUnit.battleContext.isDesperationActivated = true;
                            }
                        }
                        break;
                    case Weapon.HigaimosoNoYumi:
                        if (atkUnit.hasNegativeStatusEffect()
                            || !atkUnit.snapshot.isRestHpFull
                        ) {
                            atkUnit.battleContext.isDesperationActivated = true;
                        }
                        break;
                }
            }
        }
        else {
            atkUnit.battleContext.isDesperationActivated = false;
            defUnit.battleContext.isVantageActivated = false;
        }
    }

    __isDead(unit) {
        if (unit.restHp == 0) {
            return true;
        }
        return false;
    }

    __isAnyoneDead(atkUnit, defUnit) {
        if (this.__isDead(atkUnit)) {
            return true;
        }
        if (this.__isDead(defUnit)) {
            return true;
        }
        return false;
    }

    __attack(atkUnit, defUnit, result, context) {
        context.isCounterattack = false;
        context.isFollowupAttack = false;
        var combatResult = this.__calcCombatDamage(atkUnit, defUnit, context);
        result.atkUnit_normalAttackDamage = combatResult.damagePerAttack;
        result.atkUnit_totalAttackCount += combatResult.attackCount;
        if (atkUnit.restHp > 0) {
            result.atkUnit_actualTotalAttackCount += combatResult.attackCount;
        }
    }

    __followupAttack(atkUnit, defUnit, result, context) {
        if (atkUnit.battleContext.canFollowupAttack) {
            context.isCounterattack = false;
            context.isFollowupAttack = true;
            var combatResult = this.__calcCombatDamage(atkUnit, defUnit, context);
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
            var combatResult = this.__calcCombatDamage(defUnit, atkUnit, context);
            result.defUnit_normalAttackDamage = combatResult.damagePerAttack;
            result.defUnit_totalAttackCount += combatResult.attackCount;
            if (defUnit.restHp > 0) {
                result.defUnit_actualTotalAttackCount += combatResult.attackCount;
            }

            if (atkUnit.restHp == 0) {
                this.writeLog(atkUnit.getNameWithGroup() + "は戦闘不能");
                return result;
            }
        }
    }

    __followupCounterattack(atkUnit, defUnit, result, context) {
        if (defUnit.battleContext.canCounterattack && defUnit.battleContext.canFollowupAttack) {
            context.isCounterattack = true;
            context.isFollowupAttack = true;
            var combatResult = this.__calcCombatDamage(defUnit, atkUnit, context);
            result.defUnit_totalAttackCount += combatResult.attackCount;
            if (defUnit.restHp > 0) {
                result.defUnit_actualTotalAttackCount += combatResult.attackCount;
            }
        }
    }

    __calcFixedSpecialAddDamage(atkUnit, defUnit, isPrecombat) {
        let fixedSpecialAddDamage = 0;
        if (atkUnit.passiveB == PassiveB.RunaBracelet) {
            fixedSpecialAddDamage += Math.trunc(defUnit.getDefInCombat(atkUnit) * 0.5);
        }

        for (let skillId of atkUnit.enumerateSkills()) {
            switch (skillId) {
                case Weapon.ResolvedFang:
                case Weapon.RenewedFang:
                case Weapon.JinroMusumeNoTsumekiba:
                case Weapon.TrasenshiNoTsumekiba:
                case Weapon.JinroOuNoTsumekiba:
                case Weapon.OkamijoouNoKiba:
                case Weapon.BridesFang:
                case Weapon.GroomsWings:
                    if (atkUnit.isTransformed) {
                        fixedSpecialAddDamage += 10;
                    }
                    break;
                case PassiveB.Bushido:
                case Weapon.Watou:
                case Weapon.WatouPlus:
                case Weapon.Wabo:
                case Weapon.WaboPlus:
                case Weapon.BigSpoon:
                case Weapon.BigSpoonPlus:
                case Weapon.Wakon:
                case Weapon.WakonPlus:
                case Weapon.TankyuPlus:
                case Weapon.BabyCarrot:
                case Weapon.BabyCarrotPlus:
                case Weapon.KyoufuArmars:
                case Weapon.KieiWayuNoKen:
                case Weapon.Toron:
                case Weapon.IhoNoHIken:
                case Weapon.DarkExcalibur:
                    fixedSpecialAddDamage += 10;
                    break;
                case Weapon.Shamsir:
                    fixedSpecialAddDamage += 7;
                    break;
                case Weapon.RunaNoEiken:
                case Weapon.Otokureru:
                case Weapon.MumeiNoIchimonNoKen:
                case Weapon.SyaniNoSeisou:
                case Weapon.DevilAxe:
                    if (atkUnit.isWeaponSpecialRefined) {
                        fixedSpecialAddDamage += 10;
                    }
                    break;
                case PassiveB.Ikari3:
                    if (atkUnit.restHpPercentage <= 75) {
                        this.writeDebugLog("怒りにより奥義ダメージ+10");
                        fixedSpecialAddDamage += 10;
                    }
                    break;
                case PassiveB.Spurn3:
                    if (atkUnit.restHpPercentage <= 75) {
                        this.writeDebugLog("回避・怒りにより奥義ダメージ+5");
                        fixedSpecialAddDamage += 5;
                    }
                    break;
            }
        }

        return fixedSpecialAddDamage;
    }

    __getAtk(atkUnit, defUnit, isPrecombat) {
        if (isPrecombat) {
            return atkUnit.getAtkInPrecombat();
        }
        else {
            return atkUnit.getAtkInCombat(defUnit);
        }
    }
    __getSpd(atkUnit, defUnit, isPrecombat) {
        if (isPrecombat) {
            return atkUnit.getSpdInPrecombat();
        }
        else {
            return atkUnit.getSpdInCombat(defUnit);
        }
    }
    __calcFixedAddDamage(atkUnit, defUnit, isPrecombat) {
        let fixedAddDamage = 0;
        if (atkUnit.hasStatusEffect(StatusEffectType.TotalPenaltyDamage)) {
            fixedAddDamage += -defUnit.debuffTotal;
        }

        fixedAddDamage += atkUnit.battleContext.additionalDamage;

        for (let skillId of atkUnit.enumeratePassiveSkills()) {
            switch (skillId) {
                case PassiveB.Atrocity:
                    if (defUnit.snapshot.restHpPercentage >= 50) {
                        fixedAddDamage += Math.trunc(atkUnit.getAtkInCombat() * 0.25);
                    }
                    break;
                case PassiveA.HeavyBlade4:
                    if (this.__getAtk(atkUnit, defUnit, isPrecombat) > this.__getAtk(defUnit, atkUnit, isPrecombat)) {
                        fixedAddDamage += 5;
                    }
                    break;
                case PassiveA.FlashingBlade4:
                    if (this.__getSpd(atkUnit, defUnit, isPrecombat) > this.__getSpd(defUnit, atkUnit, isPrecombat)) {
                        fixedAddDamage += 5;
                    }
                    break;
                case PassiveA.HashinDanryuKen:
                    {
                        let atk = this.__getAtk(atkUnit, defUnit, isPrecombat);
                        fixedAddDamage += Math.trunc(atk * 0.25);
                    }
                    break;
            }
        }
        switch (atkUnit.weapon) {
            case Weapon.SpySongBow:
            case Weapon.HikariNoKen:
            case Weapon.ShiningBow:
            case Weapon.ShiningBowPlus:
            case Weapon.ZeroNoGyakukyu:
                {
                    let def = 0;
                    let res = 0;
                    if (isPrecombat) {
                        def = defUnit.getDefInPrecombat();
                        res = defUnit.getResInPrecombat();
                    }
                    else {
                        def = defUnit.getDefInCombat(atkUnit);
                        res = defUnit.getResInCombat(atkUnit);
                    }
                    if (res <= def - 5) {
                        fixedAddDamage += 7;
                    }
                }
                break;
            case Weapon.TsubakiNoKinnagitou:
                if (atkUnit.isWeaponSpecialRefined) {
                    if (atkUnit.snapshot.restHpPercentage >= 70) {
                        fixedAddDamage += 7;
                    }
                }
                break;
            case Weapon.LevinDagger:
                {
                    if (!isPrecombat) {
                        let value = 0;
                        value = atkUnit.getResInCombat(defUnit);
                        fixedAddDamage += Math.trunc(value * 0.2);
                    }
                }
                break;
            case Weapon.SatougashiNoAnki:
                if (atkUnit.battleContext.initiatesCombat) {
                    let value = 0;
                    if (isPrecombat) {
                        value = atkUnit.getSpdInPrecombat();
                    }
                    else {
                        value = atkUnit.getSpdInCombat(defUnit);
                    }
                    fixedAddDamage += Math.trunc(value * 0.1);
                }
                if (atkUnit.isWeaponSpecialRefined) {
                    if (isPrecombat) {
                        if (defUnit.isRestHpFull) {
                            fixedAddDamage += 7;
                        }
                    }
                    else {
                        if (defUnit.snapshot.isRestHpFull) {
                            fixedAddDamage += 7;
                        }
                    }
                }
                break;
            case Weapon.LunaArc:
                if (atkUnit.battleContext.initiatesCombat) {
                    let value = 0;
                    if (isPrecombat) {
                        value = defUnit.getDefInPrecombat();
                    }
                    else {
                        value = defUnit.getDefInCombat(atkUnit);
                    }
                    fixedAddDamage += Math.trunc(value * 0.25);
                }
                break;
            case Weapon.TenseiAngel:
                if (atkUnit.battleContext.initiatesCombat) {
                    let value = 0;
                    if (isPrecombat) {
                        value = defUnit.getResInPrecombat();
                    }
                    else {
                        value = defUnit.getResInCombat(atkUnit);
                    }
                    fixedAddDamage += Math.trunc(value * 0.25);
                }
                break;
            case Weapon.AstraBlade:
                {
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
                        fixedAddDamage += Math.trunc((atk - value) * 0.5);
                    }
                }
                break;
            case Weapon.NewFoxkitFang:
                fixedAddDamage += this.__calcAddDamageForDiffOf70Percent(
                    atkUnit, defUnit, isPrecombat,
                    x => x.getEvalResInPrecombat(),
                    (x, y) => x.getEvalResInCombat(y));
                break;
            case Weapon.KarasuOuNoHashizume:
            case Weapon.NewBrazenCatFang:
            case Weapon.AkaiAhiruPlus:
            case Weapon.KenhimeNoKatana:
            case Weapon.GigaExcalibur:
                if (atkUnit.isWeaponRefined) {
                    fixedAddDamage += Math.trunc(atkUnit.getEvalSpdInCombat() * 0.2);
                } else {
                    fixedAddDamage += this.__calcAddDamageForDiffOf70Percent(
                        atkUnit, defUnit, isPrecombat,
                        x => x.getEvalSpdInPrecombat(),
                        (x, y) => x.getEvalSpdInCombat(y));
                }
                break;
            case Weapon.KieiWayuNoKen:
                if (atkUnit.isWeaponSpecialRefined) {
                    fixedAddDamage += this.__calcAddDamageForDiffOf70Percent(
                        atkUnit, defUnit, isPrecombat,
                        x => x.getEvalSpdInPrecombat(),
                        (x, y) => x.getEvalSpdInCombat(y));
                }
                break;
            case Weapon.RefreshedFang:
                if (defUnit.snapshot.restHpPercentage >= 75) {
                    fixedAddDamage += this.__calcAddDamageForDiffOf70Percent(
                        atkUnit, defUnit, isPrecombat,
                        x => x.getEvalSpdInPrecombat(),
                        (x, y) => x.getEvalSpdInCombat(y));
                }
                break;
            case Weapon.ResolvedFang:
                if (defUnit.snapshot.restHpPercentage >= 75) {
                    fixedAddDamage += this.__calcAddDamageForDiffOf70Percent(
                        atkUnit, defUnit, isPrecombat,
                        x => x.getEvalDefInPrecombat(),
                        (x, y) => x.getEvalDefInCombat(y));
                }
                break;
            default:
                break;
        }

        return fixedAddDamage;
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
            let addDamage = Math.trunc(diff * 0.7);
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

    __canInvalidateReferenceLowerMit(defUnit) {
        for (let skillId of defUnit.enumerateSkills()) {
            switch (skillId) {
                case PassiveB.SeimeiNoGofu3:
                case PassiveB.HikariToYamito:
                    return true;
            }
        }
        return defUnit.battleContext.invalidatesReferenceLowerMit;
    }

    __calcCombatDamage(atkUnit, defUnit, context) {
        if (!this.__isDead(atkUnit)) {
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

        this.__calcAndSetCooldownCount(atkUnit, defUnit,
            [atkUnit.passiveA, atkUnit.passiveS],
            [defUnit.passiveA, defUnit.passiveS]);

        let totalAtk = atkUnit.getAtkInCombat(defUnit);
        var totalSpd = atkUnit.getSpdInCombat(defUnit);
        var totalDef = atkUnit.getDefInCombat(defUnit);
        var totalRes = atkUnit.getResInCombat(defUnit);

        let totalAtkDetailLog = this.__getAtkInCombatDetail(atkUnit, defUnit);

        var atkDamageAdd = 0;
        var atkCountPerOneAttack = 1;
        if (context.isCounterattack) {
            atkCountPerOneAttack = atkUnit.battleContext.counterattackCount;
        } else {
            atkCountPerOneAttack = atkUnit.battleContext.attackCount;
        }

        var atkCount = atkCountPerOneAttack;
        var specialSuffer = 0;
        var specialMultDamage = 1;
        // var specialSuffer = getInputValue("SpecialSuffer");
        // var specialMultDamage = getInputValue("SupecialMultDamage");
        var specialAddDamage = 0;
        var reduceAtkHalf = atkUnit.weaponType == WeaponType.Staff;
        if (atkUnit.battleContext.wrathfulStaff) {
            reduceAtkHalf = false;
        }

        var effectiveAtk = atkUnit.battleContext.isEffectiveToOpponent;
        var special = atkUnit.special;

        let mitHp = defUnit.restHp;
        let totalMit = 0;

        let totalMitDefailLog = "";
        let refersLowerMit = (atkUnit.battleContext.refersMinOfDefOrRes
            || (defUnit.attackRange == 2 && isWeaponTypeBreath(atkUnit.weaponType)));
        if (refersLowerMit && !this.__canInvalidateReferenceLowerMit(defUnit)) {
            this.writeDebugLog("守備魔防の低い方でダメージ計算");
            var defInCombat = defUnit.getDefInCombat(atkUnit);
            var resInCombat = defUnit.getResInCombat(atkUnit);
            totalMit = Math.min(defInCombat, resInCombat);
            if (resInCombat < defInCombat) {
                totalMitDefailLog = this.__getResInCombatDetail(defUnit, atkUnit);
            }
            else {
                totalMitDefailLog = this.__getDefInCombatDetail(defUnit, atkUnit);
            }
        }
        else if (atkUnit.weapon === Weapon.FlameLance) {
            if (atkUnit.snapshot.restHpPercentage >= 50) {
                this.writeDebugLog("魔防参照");
                totalMit = defUnit.getResInCombat(atkUnit);
                totalMitDefailLog = this.__getResInCombatDetail(defUnit, atkUnit);
            }
        }
        else if ((atkUnit.weapon == Weapon.HelsReaper)) {
            if (isWeaponTypeTome(defUnit.weaponType) || defUnit.weaponType == WeaponType.Staff) {
                this.writeDebugLog("守備参照");
                totalMit = defUnit.getDefInCombat(atkUnit);
                totalMitDefailLog = this.__getDefInCombatDetail(defUnit, atkUnit);
            }
            else {
                this.writeDebugLog("魔防参照");
                totalMit = defUnit.getResInCombat(atkUnit);
                totalMitDefailLog = this.__getResInCombatDetail(defUnit, atkUnit);
            }
        }
        else if (atkUnit.isPhysicalAttacker()) {
            this.writeDebugLog("守備参照");
            totalMit = defUnit.getDefInCombat(atkUnit);
            totalMitDefailLog = this.__getDefInCombatDetail(defUnit, atkUnit);
        }
        else {
            this.writeDebugLog("魔防参照");
            totalMit = defUnit.getResInCombat(atkUnit);
            totalMitDefailLog = this.__getResInCombatDetail(defUnit, atkUnit);
        }

        let specialTotalMit = totalMit; // 攻撃側の奥義発動時の防御力
        let specialTotalMitDefailLog = "";

        var fixedAddDamage = this.__calcFixedAddDamage(atkUnit, defUnit, false);
        var fixedSpecialAddDamage = 0;
        var invalidatesDamageReductionExceptSpecialOnSpecialActivation = false;
        switch (special) {
            case Special.None:
                break;
            case Special.Kagetsuki:
            case Special.Moonbow:
                // 月虹
                specialSuffer = 30;
                break;
            case Special.Luna:
                // 月光
                specialSuffer = 50;
                break;
            case Special.KuroNoGekko:
                specialSuffer = 80;
                break;
            case Special.Aether:
            case Special.AoNoTenku:
            case Special.RadiantAether2:
            case Special.MayhemAether:
                // 天空
                specialSuffer = 50;
                break;
            case Special.LunaFlash: {
                // 月光閃
                specialSuffer = 20;
                fixedSpecialAddDamage = Math.trunc(totalSpd * 0.2);
                break;
            }
            case Special.Hoshikage:
            case Special.Glimmer:
                // 凶星
                specialMultDamage = 1.5;
                break;
            case Special.Deadeye:
                specialMultDamage = 2;
                invalidatesDamageReductionExceptSpecialOnSpecialActivation = true;
                break;
            case Special.Astra: {
                // 流星
                specialMultDamage = 2.5;
                break;
            }
            case Special.Hotarubi:
            case Special.Bonfire:
                // 緋炎
                specialAddDamage = Math.trunc(totalDef * 0.5);
                break;
            case Special.Ignis: {
                // 華炎
                specialAddDamage = Math.trunc(totalDef * 0.8);
                break;
            }
            case Special.Hyouten:
            case Special.Iceberg:
                // 氷蒼
                specialAddDamage = Math.trunc(totalRes * 0.5);
                break;
            case Special.Glacies: {
                // 氷華
                specialAddDamage = Math.trunc(totalRes * 0.8);
                break;
            }
            case Special.Fukuryu:
            case Special.DraconicAura:
                // 竜裂
                specialAddDamage = Math.trunc(totalAtk * 0.3);
                break;
            case Special.DragonFang: {
                // 竜穿
                specialAddDamage = Math.trunc(totalAtk * 0.5);
                break;
            }
            case Special.HonoNoMonsyo:
            case Special.HerosBlood:
                specialAddDamage = Math.trunc(totalSpd * 0.3);
                break;
            case Special.RighteousWind:
            case Special.Sirius:
                // 聖風
                // 天狼
                specialAddDamage = Math.trunc(totalSpd * 0.3);
                break;
            case Special.TwinBlades: // 双刃
                {
                    specialAddDamage = Math.trunc(totalRes * 0.4);
                    invalidatesDamageReductionExceptSpecialOnSpecialActivation = true;
                }
                break;
            case Special.RupturedSky: {
                if (isWeaponTypeBeast(defUnit.weaponType) || isWeaponTypeBreath(defUnit.weaponType)) {
                    specialAddDamage = Math.trunc(defUnit.getAtkInCombat(atkUnit) * 0.4);
                }
                else {
                    specialAddDamage = Math.trunc(defUnit.getAtkInCombat(atkUnit) * 0.2);
                }
                break;
            }
            case Special.RegnalAstra:
            case Special.ImperialAstra:
                specialAddDamage = Math.trunc(totalSpd * 0.4);
                break;
            case Special.OpenTheFuture:
                specialAddDamage = Math.trunc(totalDef * 0.5);
                break;
            case Special.Fukusyu:
                specialAddDamage = Math.trunc((atkUnit.maxHpWithSkills - atkUnit.restHp) * 0.5);
                break;
            case Special.Setsujoku:
            case Special.Kessyu:
                specialAddDamage = Math.trunc((atkUnit.maxHpWithSkills - atkUnit.restHp) * 0.3);
                break;
            case Special.BlueFrame:
                specialAddDamage = 10;
                for (let tile of atkUnit.placedTile.neighbors) {
                    if (tile.placedUnit != null && tile.placedUnit.groupId == atkUnit.groupId) {
                        specialAddDamage += 15;
                        break;
                    }
                }
                break;
            case Special.KoriNoSeikyo:
                // 通常ダメージに加算
                if (atkUnit.battleContext.reducedDamageBySpecial > 0) {
                    fixedAddDamage += atkUnit.battleContext.reducedDamageBySpecial;
                    atkUnit.battleContext.reducedDamageBySpecial = 0;
                }
                break;
            case Special.IceMirror2:
                if (atkUnit.battleContext.reducedDamageBySpecial > 0) {
                    fixedAddDamage += Math.trunc(atkUnit.getResInCombat(defUnit) * 0.4);
                    atkUnit.battleContext.reducedDamageBySpecial = 0;
                }
                break;
            case Special.NegatingFang:
                if (atkUnit.battleContext.reducedDamageBySpecial > 0) {
                    fixedAddDamage += Math.trunc(atkUnit.getAtkInCombat(defUnit) * 0.3);
                    atkUnit.battleContext.reducedDamageBySpecial = 0;
                }
                break;
            case Special.SeidrShell:
                specialAddDamage = 15;
                if (!this.__canInvalidateReferenceLowerMit(defUnit)) {
                    this.writeDebugLog("魔弾の守備魔防の低い方でダメージ計算");
                    let defInCombat = defUnit.getDefInCombat(atkUnit);
                    let resInCombat = defUnit.getResInCombat(atkUnit);
                    specialTotalMit = Math.min(defInCombat, resInCombat);
                    if (resInCombat < defInCombat) {
                        specialTotalMitDefailLog = this.__getResInCombatDetail(defUnit, atkUnit);
                    }
                    else {
                        specialTotalMitDefailLog = this.__getDefInCombatDetail(defUnit, atkUnit);
                    }
                }
                break;
            default:
                break;
        }

        fixedSpecialAddDamage += this.__calcFixedSpecialAddDamage(atkUnit, defUnit, false);

        let attackAdvRatio = 0;
        {
            var attackTriangleAdv = this.calcAttackerTriangleAdvantage(atkUnit, defUnit);
            var triangleAdeptRate = 0;
            let triangleMult = 0;
            switch (attackTriangleAdv) {
                case TriangleAdvantage.Advantageous:
                    triangleAdeptRate = 0.2;
                    triangleMult = (Math.abs(triangleAdeptRate) / triangleAdeptRate);
                    break;
                case TriangleAdvantage.Disadvantageous:
                    triangleAdeptRate = -0.2;
                    triangleMult = (Math.abs(triangleAdeptRate) / triangleAdeptRate);
                    break;
                case TriangleAdvantage.None:
                default:
                    break;
            }

            let atkUnitGekika3 = atkUnit.hasTriangleAdeptSkill() && !atkUnit.hasPassiveSkill(PassiveB.AisyoSosatsu3);
            let defUnitGekika3 = defUnit.hasTriangleAdeptSkill() && !defUnit.hasPassiveSkill(PassiveB.AisyoSosatsu3);
            if (atkUnitGekika3 || defUnitGekika3) {
                let atkUnitGekikaRatio = atkUnit.getTriangleAdeptAdditionalRatio();
                let defUnitGekikaRatio = defUnit.getTriangleAdeptAdditionalRatio();
                let gekikaAdditionalRatio = Math.max(atkUnitGekikaRatio, defUnitGekikaRatio);
                triangleAdeptRate += gekikaAdditionalRatio * triangleMult;
            }

            if (atkUnitGekika3 && defUnit.hasPassiveSkill(PassiveB.AisyoSosatsu3)) {
                triangleAdeptRate *= -1;
            }

            if (defUnitGekika3 && atkUnit.hasPassiveSkill(PassiveB.AisyoSosatsu3)) {
                triangleAdeptRate *= -1;
            }

            attackAdvRatio += triangleAdeptRate;
            this.writeDebugLog("相性による攻撃補正値: " + attackAdvRatio);
        }

        var mitAdvRatio = 0.0;
        if (defUnit.placedTile.isDefensiveTile) {
            this.writeDebugLog(defUnit.getNameWithGroup() + "は防御地形補正 1.3");
            mitAdvRatio = 0.3;
        }

        var damageReduceRatio = 1.0;
        if (reduceAtkHalf) {
            damageReduceRatio *= 0.5;
        }


        this.writeDebugLog("補正前の攻撃:" + totalAtk + `(${totalAtkDetailLog})`);
        var finalAtk = totalAtk;
        if (effectiveAtk) {
            // 特効
            finalAtk = Math.trunc(finalAtk * 1.5);
            this.writeDebugLog("特効補正値: 1.5");
        }

        let addAdjustAtk = finalAtk * attackAdvRatio;
        this.writeDebugLog(`相性による攻撃加算: ${Math.trunc(addAdjustAtk)}(${addAdjustAtk})`);
        finalAtk = finalAtk + Math.trunc(addAdjustAtk);

        this.writeDebugLog("補正前の耐久:" + totalMit + `(${totalMitDefailLog})`);
        if (totalMit != specialTotalMit) {
            this.writeDebugLog("奥義発動時の補正前の耐久:" + specialTotalMit + `(${specialTotalMitDefailLog})`);
        }
        var finalMit = Math.trunc(totalMit + totalMit * mitAdvRatio);
        this.writeDebugLog("補正後の攻撃:" + finalAtk + "、耐久:" + finalMit);
        var damage = Math.trunc((finalAtk - finalMit) * damageReduceRatio) + atkDamageAdd;
        if (damage < 0) {
            damage = 0;
        }
        this.writeDebugLog("加算ダメージ:" + fixedAddDamage);
        damage += fixedAddDamage;

        var sufferRatio = (specialSuffer / 100.0);

        var specialFinalMit = Math.trunc((specialTotalMit - Math.trunc(specialTotalMit * sufferRatio)) + (specialTotalMit * mitAdvRatio));
        var specialDamage = Math.trunc((finalAtk - specialFinalMit) * damageReduceRatio * specialMultDamage) + specialAddDamage + atkDamageAdd;
        if (specialDamage < 0) {
            specialDamage = 0;
        }
        specialDamage += fixedAddDamage;
        specialDamage += fixedSpecialAddDamage;
        this.writeDebugLog("通常ダメージ=" + damage + ", 奥義ダメージ=" + specialDamage);

        let totalDamage = this.__calcAttackTotalDamage(
            context,
            atkUnit,
            defUnit,
            atkCount,
            damage,
            specialDamage,
            invalidatesDamageReductionExceptSpecialOnSpecialActivation
        );

        if (!this.__isDead(atkUnit)) {
            // 攻撃側が倒されていたらダメージを反映しない(潜在ダメージ計算のためにダメージ計算は必要)
            var restHp = Math.max(0, mitHp - totalDamage);
            defUnit.restHp = restHp;
            this.writeLog(defUnit.getNameWithGroup() + "の残りHP " + defUnit.restHp + "/" + defUnit.maxHpWithSkills);
            this.writeLog(atkUnit.getNameWithGroup() + "の残りHP " + atkUnit.restHp + "/" + atkUnit.maxHpWithSkills);
            if (this.__isDead(defUnit)) {
                this.writeLog(defUnit.getNameWithGroup() + "は戦闘不能");
            }
        }
        var result = new Object();
        result.damagePerAttack = damage;
        result.attackCount = atkCount;
        return result;
    }


    calcPreCombatDamage(atkUnit, defUnit) {
        this.writeDebugLog("戦闘前ダメージ計算..");
        if (isPrecombatSpecial(atkUnit.special) == false) {
            this.writeDebugLog(`${atkUnit.getNameWithGroup()}は範囲奥義を持たない`);
            return;
        }

        var isSpecialActivated = false;
        if (atkUnit.maxSpecialCount > 0) {
            if (atkUnit.tmpSpecialCount == 0) {
                isSpecialActivated = true;
            }
        }

        if (!isSpecialActivated) {
            this.writeDebugLog(`${atkUnit.getNameWithGroup()}は範囲奥義を発動できない(発動カウント${atkUnit.tmpSpecialCount})`);
            return false;
        }

        atkUnit.battleContext.isSpecialActivated = true;
        var totalDamage = this.calcPrecombatDamage(atkUnit, defUnit);
        if (defUnit.restHp - totalDamage < 1) {
            totalDamage = defUnit.restHp - 1;
        }

        this.writeLog("範囲奥義によるダメージ" + totalDamage);
        this.writeSimpleLog(atkUnit.getNameWithGroup() + "→" + defUnit.getNameWithGroup() + "<br/>範囲奥義によるダメージ" + totalDamage);
        this.__restoreMaxSpecialCount(atkUnit);

        defUnit.restHp = defUnit.restHp - totalDamage;
        this.writeRestHpLog(defUnit);
        return totalDamage;
    }

    calcPrecombatDamage(atkUnit, defUnit) {
        var precombatTotalMit = 0;
        if (atkUnit.isPhysicalAttacker()) {
            this.writeDebugLog("守備参照");
            precombatTotalMit = defUnit.getDefInPrecombat();
        }
        else {
            this.writeDebugLog("魔防参照");
            precombatTotalMit = defUnit.getResInPrecombat();
        }

        var tmpMit = precombatTotalMit;
        if (defUnit.placedTile.isDefensiveTile) {
            tmpMit *= 1.3;
        }

        var rangedSpecialDamage = -1;
        switch (atkUnit.special) {
            case Special.BlazingFlame:
            case Special.BlazingWind:
            case Special.BlazingLight:
            case Special.BlazingThunder:
                {
                    // 烈光など
                    rangedSpecialDamage = Math.trunc(Math.max(0, atkUnit.getAtkInPrecombat() - tmpMit) * 1.5);
                }
                break;
            case Special.RisingFrame:
            case Special.RisingLight:
            case Special.RisingWind:
            case Special.RisingThunder:
            case Special.GrowingFlame:
            case Special.GrowingWind:
            case Special.GrowingLight:
            case Special.GrowingThunder:
                {
                    // 爆光など
                    rangedSpecialDamage = Math.max(0, atkUnit.getAtkInPrecombat() - tmpMit);
                }
                break;
            case Special.GiftedMagic:
                {
                    rangedSpecialDamage = Math.trunc(Math.max(0, atkUnit.getAtkInPrecombat() - tmpMit) * 0.8);
                }
                break;
            default:
                break;
        }

        var addDamage = this.__calcFixedAddDamage(atkUnit, defUnit, true);
        let specialAddDamage = this.__calcFixedSpecialAddDamage(atkUnit, defUnit, true);
        let damage = rangedSpecialDamage + addDamage + specialAddDamage;

        let damageReductionRatio = 1.0 - defUnit.battleContext.damageReductionRatioForPrecombat;
        for (let skillId of defUnit.enumerateSkills()) {
            switch (skillId) {
                case Weapon.LilacJadeBreath:
                    if (atkUnit.battleContext.initiatesCombat || atkUnit.snapshot.restHpPercentage === 100) {
                        damageReductionRatio *= 1.0 - 0.4;
                    }
                    break;
                case Weapon.Areadbhar:
                    let diff = defUnit.getEvalSpdInPrecombat() - atkUnit.getEvalSpdInPrecombat();
                    if (diff > 0 && defUnit.snapshot.restHpPercentage >= 25) {
                        let percentage = Math.min(diff * 4, 40);
                        damageReductionRatio *= 1.0 - (percentage / 100.0);
                    }
                    break;
                case Weapon.GiltGoblet:
                    if (atkUnit.snapshot.restHpPercentage === 100 && isRangedWeaponType(atkUnit.weaponType)) {
                        damageReductionRatio *= 1.0 - 0.5;
                    }
                    break;
                case Weapon.BloodTome:
                    if (isRangedWeaponType(atkUnit.weaponType)) {
                        damageReductionRatio *= 1.0 - 0.8;
                    }
                    break;
                case Weapon.EtherealBreath:
                    {
                        damageReductionRatio *= 1.0 - 0.8;
                    }
                    break;
                case PassiveB.DragonWall3:
                case Weapon.NewFoxkitFang:
                    {
                        let resDiff = defUnit.getEvalResInPrecombat() - atkUnit.getEvalResInPrecombat();
                        if (resDiff > 0) {
                            let percentage = resDiff * 4;
                            if (percentage > 40) {
                                percentage = 40;
                            }

                            damageReductionRatio *= 1.0 - (percentage / 100.0);
                        }
                    }
                    break;
                case Weapon.NightmareHorn:
                case Weapon.NewBrazenCatFang:
                    {
                        let diff = defUnit.getEvalSpdInPrecombat() - atkUnit.getEvalSpdInPrecombat();
                        if (diff > 0) {
                            let percentage = diff * 4;
                            if (percentage > 40) {
                                percentage = 40;
                            }

                            damageReductionRatio *= 1.0 - (percentage / 100.0);
                        }
                    }
                    break;
                case PassiveB.Spurn3:
                case PassiveB.KaihiIchigekiridatsu3:
                case PassiveB.KaihiTatakikomi3:
                    {
                        let diff = defUnit.getEvalSpdInPrecombat() - atkUnit.getEvalSpdInPrecombat();
                        if (diff > 0) {
                            let percentage = diff * 4;
                            if (percentage > 40) {
                                percentage = 40;
                            }

                            damageReductionRatio *= 1.0 - (percentage / 100.0);
                        }
                    }
                    break;
                case PassiveB.BlueLionRule:
                    {
                        let diff = defUnit.getEvalDefInPrecombat() - atkUnit.getEvalDefInPrecombat();
                        if (diff > 0) {
                            let percentage = diff * 4;
                            if (percentage > 40) {
                                percentage = 40;
                            }

                            damageReductionRatio *= 1.0 - (percentage / 100.0);
                        }
                    }
                    break;
            }
        }

        damageReductionRatio = 1.0 - damageReductionRatio;
        let reducedDamage = Math.trunc(damage * damageReductionRatio);
        let currentDamage = Math.max(damage - reducedDamage, 0);

        if (damageReductionRatio > 0.0) {
            this.writeDebugLog("ダメージ軽減" + damageReductionRatio * 100 + "%");
            this.writeDebugLog("ダメージ:" + damage + "→" + currentDamage);
        }
        return currentDamage;
    }

    __calcAndSetCooldownCount(atkUnit, defUnit, atkUnitSkillIds, defUnitSkillIds) {
        atkUnit.battleContext.cooldownCountForAttack = 1;
        defUnit.battleContext.cooldownCountForAttack = 1;
        atkUnit.battleContext.cooldownCountForDefense = 1;
        defUnit.battleContext.cooldownCountForDefense = 1;
        if (atkUnit.battleContext.increaseCooldownCountForAttack) {
            atkUnit.battleContext.cooldownCountForAttack += 1;
        }
        if (atkUnit.battleContext.increaseCooldownCountForDefense) {
            atkUnit.battleContext.cooldownCountForDefense += 1;
        }
        if (defUnit.battleContext.increaseCooldownCountForAttack) {
            defUnit.battleContext.cooldownCountForAttack += 1;
        }
        if (defUnit.battleContext.increaseCooldownCountForDefense) {
            defUnit.battleContext.cooldownCountForDefense += 1;
        }

        if (defUnit.battleContext.reducesCooldownCount) {
            atkUnit.battleContext.cooldownCountForAttack -= 1;
            atkUnit.battleContext.cooldownCountForDefense -= 1;
        }
        if (atkUnit.battleContext.reducesCooldownCount) {
            defUnit.battleContext.cooldownCountForAttack -= 1;
            defUnit.battleContext.cooldownCountForDefense -= 1;
        }
    }

    calcAttackerTriangleAdvantage(atkUnit, defUnit) {
        var atkColor = atkUnit.color;
        var defColor = defUnit.color;
        this.writeDebugLog("[相性判定] 攻撃属性:" + colorTypeToString(atkColor) + "、防御属性:" + colorTypeToString(defColor));

        if (atkUnit.color == ColorType.Red) {
            if (defUnit.color == ColorType.Green) {
                return TriangleAdvantage.Advantageous;
            }
            if (defUnit.color == ColorType.Blue) {
                return TriangleAdvantage.Disadvantageous;
            }
        }

        if (atkUnit.color == ColorType.Blue) {
            if (defUnit.color == ColorType.Red) {
                return TriangleAdvantage.Advantageous;
            }
            else if (defUnit.color == ColorType.Green) {
                return TriangleAdvantage.Disadvantageous;
            }
        }

        if (atkUnit.color == ColorType.Green) {
            if (defUnit.color == ColorType.Blue) {
                return TriangleAdvantage.Advantageous;
            }
            else if (defUnit.color == ColorType.Red) {
                return TriangleAdvantage.Disadvantageous;
            }
        }

        if (atkUnit.isAdvantageForColorless(defUnit)) {
            this.writeDebugLog(atkUnit.getNameWithGroup() + "は無属性に有利");
            if (defUnit.color == ColorType.Colorless) {
                return TriangleAdvantage.Advantageous;
            }
        }

        if (defUnit.isAdvantageForColorless(atkUnit)) {
            this.writeDebugLog(defUnit.getNameWithGroup() + "は無属性に有利");
            if (atkUnit.color == ColorType.Colorless) {
                return TriangleAdvantage.Disadvantageous;
            }
        }

        this.writeDebugLog("相性補正なし");
        return TriangleAdvantage.None;
    }

    __getDamageReductionRatio(skillId, atkUnit, defUnit) {
        switch (skillId) {
            case Weapon.LilacJadeBreath:
                if (atkUnit.battleContext.initiatesCombat || atkUnit.snapshot.restHpPercentage === 100) {
                    return 0.4;
                }
                break;
            case Weapon.Areadbhar:
                let diff = defUnit.getEvalSpdInCombat(atkUnit) - atkUnit.getEvalSpdInCombat(defUnit);
                if (diff > 0 && defUnit.snapshot.restHpPercentage >= 25) {
                    let percentage = Math.min(diff * 4, 40);
                    this.writeDebugLog(`アラドヴァルによりダメージ${percentage}%軽減(速さの差 ${(defUnit.getEvalSpdInCombat(atkUnit))}-${(atkUnit.getEvalSpdInCombat(defUnit))}=${diff})`);
                    return percentage / 100.0;
                }
                break;
            case Weapon.GiltGoblet:
                if ((atkUnit.battleContext.initiatesCombat || atkUnit.snapshot.restHpPercentage === 100) &&
                    isWeaponTypeTome(atkUnit.weaponType)) {
                    return 0.5;
                }
                break;
            case Weapon.BloodTome:
                if (isRangedWeaponType(atkUnit.weaponType)) {
                    return 0.5;
                }
                break;
            case PassiveB.DragonWall3:
            case Weapon.NewFoxkitFang:
                {
                    let resDiff = defUnit.getEvalResInCombat(atkUnit) - atkUnit.getEvalResInCombat(defUnit);
                    if (resDiff > 0) {
                        let percentage = resDiff * 4;
                        if (percentage > 40) {
                            percentage = 40;
                        }

                        this.writeDebugLog("ダメージ" + percentage + "%軽減");
                        return percentage / 100.0;
                    }
                }
                break;
            case Weapon.NightmareHorn:
            case Weapon.NewBrazenCatFang:
                {
                    let diff = defUnit.getEvalSpdInCombat(atkUnit) - atkUnit.getEvalSpdInCombat(defUnit);
                    if (diff > 0) {
                        let percentage = diff * 4;
                        if (percentage > 40) {
                            percentage = 40;
                        }

                        this.writeDebugLog(`武器スキル(${defUnit.weaponInfo.name})によりダメージ${percentage}%軽減`);
                        return percentage / 100.0;
                    }
                }
                break;
            case PassiveB.Spurn3:
            case PassiveB.KaihiIchigekiridatsu3:
            case PassiveB.KaihiTatakikomi3:
                {
                    let defUnitSpd = defUnit.getEvalSpdInCombat(atkUnit);
                    let atkUnitSpd = atkUnit.getEvalSpdInCombat(defUnit);
                    let diff = defUnitSpd - atkUnitSpd;
                    if (diff > 0) {
                        let percentage = diff * 4;
                        if (percentage > 40) {
                            percentage = 40;
                        }

                        this.writeDebugLog(`回避スキルによりダメージ${percentage}%軽減(速さの差 ${defUnitSpd}-${atkUnitSpd}=${diff})`);
                        return percentage / 100.0;
                    }
                }
                break;
            case PassiveB.BlueLionRule:
                {
                    let defUnitDef = defUnit.getEvalDefInCombat(atkUnit);
                    let atkUnitDef = atkUnit.getEvalDefInCombat(defUnit);
                    let diff = defUnitDef - atkUnitDef;
                    if (diff > 0) {
                        let percentage = diff * 4;
                        if (percentage > 40) {
                            percentage = 40;
                        }

                        this.writeDebugLog(`蒼き獅子王によりダメージ${percentage}%軽減(守備の差 ${defUnitDef}-${atkUnitDef}=${diff})`);
                        return percentage / 100.0;
                    }
                }
                break;
        }

        return 0;
    }

    __calcDamageReductionRatio(damageReductionRatio, atkUnit) {
        return damageReductionRatio - Math.trunc(damageReductionRatio * 100 * atkUnit.battleContext.reductionRatioOfDamageReductionRatioExceptSpecial) * 0.01;
    }

    __calcAttackTotalDamage(
        context, atkUnit, defUnit, attackCount, normalDamage, specialDamage,
        invalidatesDamageReductionExceptSpecialOnSpecialActivation
    ) {
        let hasAtkUnitSpecial = atkUnit.maxSpecialCount != 0 && isNormalAttackSpecial(atkUnit.special);
        let hasDefUnitSpecial = defUnit.maxSpecialCount != 0 && isDefenseSpecial(defUnit.special);

        let atkReduceSpCount = atkUnit.battleContext.cooldownCountForAttack;
        let defReduceSpCount = defUnit.battleContext.cooldownCountForDefense;
        let totalDamage = 0;
        for (let i = 0; i < attackCount; ++i) {
            let isDefUnitAlreadyDead = defUnit.restHp <= totalDamage;
            if (isDefUnitAlreadyDead) {
                return totalDamage;
            }
            let isAtkUnitalreadyDead = atkUnit.restHp == 0;
            if (isAtkUnitalreadyDead) {
                return totalDamage;
            }

            let activatesAttackerSpecial = hasAtkUnitSpecial && atkUnit.tmpSpecialCount == 0;
            let activatesDefenderSpecial = hasDefUnitSpecial && defUnit.tmpSpecialCount == 0;
            let damageReductionRatio = 1.0;
            let damageReductionValue = 0;

            // 奥義以外のダメージ軽減
            {

                // 計算機の外側で設定されたダメージ軽減率
                {
                    damageReductionRatio *= 1.0 - this.__calcDamageReductionRatio(defUnit.battleContext.damageReductionRatio, atkUnit);
                }

                for (let skillId of defUnit.enumerateSkills()) {
                    let ratio = this.__getDamageReductionRatio(skillId, atkUnit, defUnit);
                    if (ratio > 0) {
                        damageReductionRatio *= 1.0 - this.__calcDamageReductionRatio(ratio, atkUnit);
                    }
                }

                {
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
            }

            let invalidatesDamageReductionExceptSpecial =
                activatesAttackerSpecial && invalidatesDamageReductionExceptSpecialOnSpecialActivation;
            if (invalidatesDamageReductionExceptSpecial) {
                this.writeDebugLog("奥義以外のダメージ軽減を無効化");
                damageReductionRatio = 1.0;
            }

            // 奥義によるダメージ軽減
            let isDefenderSpecialActivated = false;
            if (activatesDefenderSpecial) {
                let attackRange = atkUnit.getActualAttackRange(defUnit);
                switch (defUnit.special) {
                    case Special.NegatingFang:
                        damageReductionRatio *= 1.0 - 0.3;
                        isDefenderSpecialActivated = true;
                        break;
                    case Special.Seikabuto:
                    case Special.Seii:
                    case Special.KoriNoSeikyo:
                        if (attackRange == 2) {
                            damageReductionRatio *= 1.0 - 0.3;
                            isDefenderSpecialActivated = true;
                        }
                        break;
                    case Special.IceMirror2:
                        if (attackRange === 2) {
                            damageReductionRatio *= 1.0 - 0.4;
                            isDefenderSpecialActivated = true;
                        }
                        break;
                    case Special.Seitate:
                        if (attackRange == 2) {
                            damageReductionRatio *= 1.0 - 0.5;
                            isDefenderSpecialActivated = true;
                        }
                        break;
                    case Special.Kotate:
                    case Special.Nagatate:
                        if (attackRange == 1) {
                            damageReductionRatio *= 1.0 - 0.3;
                            isDefenderSpecialActivated = true;
                        }
                        break;
                    case Special.Otate:
                        if (attackRange == 1) {
                            damageReductionRatio *= 1.0 - 0.5;
                            isDefenderSpecialActivated = true;
                        }
                        break;
                }

                if (isDefenderSpecialActivated) {
                    if (defUnit.passiveB == PassiveB.TateNoKodo3) {
                        damageReductionValue = 5;
                    }
                    this.__restoreMaxSpecialCount(defUnit);
                }
            }

            damageReductionRatio = 1.0 - damageReductionRatio;

            let currentDamage = 0;
            if (activatesAttackerSpecial) {
                atkUnit.battleContext.isSpecialActivated = true;
                // 奥義発動
                currentDamage = this.__calcUnitAttackDamage(defUnit, specialDamage, damageReductionRatio, damageReductionValue, activatesDefenderSpecial);
                this.writeLog("奥義によるダメージ" + currentDamage);
                this.writeSimpleLog(" " + atkUnit.getNameWithGroup() + "→" + defUnit.getNameWithGroup() + "<br/>奥義ダメージ" + currentDamage);
                this.__restoreMaxSpecialCount(atkUnit);

                // 回復
                {
                    let actualDamage = currentDamage;
                    if (defUnit.restHp < currentDamage) {
                        actualDamage = defUnit.restHp;
                    }

                    let healedHp = 0;
                    switch (atkUnit.special) {
                        case Special.Aether:
                        case Special.AoNoTenku:
                        case Special.RadiantAether2:
                        case Special.MayhemAether:
                        case Special.Taiyo:
                            healedHp = Math.trunc(actualDamage * 0.5);
                            break;
                        case Special.Sirius:
                        case Special.Youkage:
                        case Special.Yuyo:
                            healedHp = Math.trunc(actualDamage * 0.3);
                            break;
                        case Special.OpenTheFuture:
                            healedHp = Math.trunc(actualDamage * 0.25);
                            break;
                    }

                    switch (atkUnit.weapon) {
                        case Weapon.KyoufuArmars:
                            if (atkUnit.isWeaponSpecialRefined) {
                                if (defUnit.battleContext.initiatesCombat || defUnit.snapshot.restHpPercentage === 100) {
                                    healedHp = Math.trunc(atkUnit.maxHpWithSkills * 0.3);
                                }
                            }
                            break;
                        case Weapon.WindParthia:
                            if (atkUnit.battleContext.initiatesCombat
                                || atkUnit.battleContext.isThereAnyUnitIn2Spaces
                            ) {
                                healedHp = Math.trunc(atkUnit.maxHpWithSkills * 0.5);
                            }
                            break;
                        case Weapon.MoonlessBreath:
                            if (atkUnit.battleContext.isThereAnyUnitIn2Spaces) {
                                healedHp = Math.trunc(atkUnit.maxHpWithSkills * 0.3);
                            }
                    }

                    if (atkUnit.passiveB == PassiveB.TaiyoNoUdewa) {
                        healedHp += Math.trunc(actualDamage * 0.3);
                    }

                    this.__heal(atkUnit, healedHp, defUnit);
                }
            }
            else {
                // 通常攻撃
                currentDamage = this.__calcUnitAttackDamage(defUnit, normalDamage, damageReductionRatio, damageReductionValue, activatesDefenderSpecial);
                this.writeLog("通常攻撃によるダメージ" + currentDamage);
                this.writeSimpleLog(atkUnit.getNameWithGroup() + "→" + defUnit.getNameWithGroup() + "<br/>通常攻撃ダメージ" + currentDamage);
                this.__reduceSpecialCount(atkUnit, atkReduceSpCount);
            }

            {
                let healHpAmount = this.__getHealAmountByAttack(atkUnit, defUnit, currentDamage);
                if (healHpAmount > 0) {
                    this.writeDebugLog(`${atkUnit.getNameWithGroup()}は${healHpAmount}回復`);
                    this.__heal(atkUnit, healHpAmount, defUnit);
                }
            }

            if (this.__canActivateMiracle(defUnit, atkUnit)
                && (defUnit.restHp - totalDamage > 1)
                && (defUnit.restHp - totalDamage - currentDamage <= 0)
            ) {
                this.writeLog("祈り効果発動、" + defUnit.getNameWithGroup() + "はHP1残る");
                totalDamage = defUnit.restHp - 1;
                if (defUnit.special == Special.Miracle) {
                    this.__restoreMaxSpecialCount(defUnit);
                }
            }
            else {
                totalDamage += currentDamage;
            }

            if (!isDefenderSpecialActivated) {
                this.__reduceSpecialCount(defUnit, defReduceSpCount);
            }
            context.attackedUnitHistory.push(atkUnit);

            this.writeDebugLog(defUnit.getNameWithGroup() + "の残りHP" + (defUnit.restHp - totalDamage) + "/" + defUnit.maxHpWithSkills);
        }

        return totalDamage;
    }

    __getHealAmountByAttack(atkUnit, defUnit, currentDamage) {
        let healedHp = atkUnit.battleContext.healedHpByAttack;
        switch (atkUnit.weapon) {
            case Weapon.SpySongBow:
                if (atkUnit.isWeaponSpecialRefined && atkUnit.battleContext.isThereAnyPartnerPairsIn3Spaces) {
                    healedHp += 5;
                }
                break;
            case Weapon.UnityBloomsPlus:
            case Weapon.AmityBloomsPlus:
            case Weapon.PactBloomsPlus:
                if (atkUnit.battleContext.isThereAnyUnitIn2Spaces) {
                    healedHp += 4;
                }
                break;
            case Weapon.Garumu:
                if (atkUnit.isWeaponSpecialRefined) {
                    if (atkUnit.snapshot.restHpPercentage >= 25) {
                        healedHp += 7;
                    }
                }
                break;
            case Weapon.HokenSophia:
                if (atkUnit.isWeaponSpecialRefined) {
                    if (!atkUnit.snapshot.isRestHpFull || !defUnit.snapshot.isRestHpFull) {
                        healedHp += 7;
                    }
                }
                break;
            case Weapon.VirtuousTyrfing:
                if (!atkUnit.battleContext.initiatesCombat
                    || atkUnit.snapshot.restHpPercentage <= 99
                ) {
                    healedHp += 7;
                }
                break;
            case Weapon.SeirinNoKenPlus:
            case Weapon.FuyumatsuriNoStickPlus:
            case Weapon.ChisanaSeijuPlus:
                healedHp += 5;
                break;
            case Weapon.RuneAxe:
                healedHp += 7;
                break;
            case Weapon.Taiyo:
                healedHp += 10;
                break;
            case Weapon.Absorb:
            case Weapon.AbsorbPlus:
                {
                    healedHp += Math.trunc(currentDamage * 0.5);
                }
                break;
        }
        return healedHp;
    }

    __canActivateMiracle(unit, atkUnit) {
        if (unit.special == Special.Miracle && unit.tmpSpecialCount == 0) {
            return true;
        }
        if (unit.weapon == Weapon.Thirufingu
            && unit.snapshot.restHpPercentage >= 50) {
            return true;
        }
        else if (unit.weapon == Weapon.HelsReaper) {
            if (!isWeaponTypeTome(atkUnit.weaponType) && atkUnit.weaponType != WeaponType.Staff) {
                return true;
            }
        }
        return false;
    }

    __heal(unit, healedHp, enemyUnit) {
        if (enemyUnit.battleContext.invalidatesHeal) {
            return;
        }
        if (unit.hasStatusEffect(StatusEffectType.DeepWounds)) {
            return;
        }

        unit.restHp += healedHp;
        if (unit.restHp > unit.maxHpWithSkills) {
            unit.restHp = unit.maxHpWithSkills;
        }
        this.writeDebugLog(unit.getNameWithGroup() + "は" + healedHp + "回復: HP=" + unit.restHp + "/" + unit.maxHpWithSkills);
    }

    __calcUnitAttackDamage(defUnit, damage, damageReductionRatio, damageReductionValue, activatesDefenderSpecial) {
        let reducedDamage = Math.trunc(damage * damageReductionRatio) + damageReductionValue;
        var currentDamage = Math.max(damage - reducedDamage, 0);
        if (damageReductionRatio > 0.0) {
            this.writeDebugLog("ダメージ軽減" + damageReductionRatio * 100 + "%");
            this.writeDebugLog("ダメージ-" + damageReductionValue);
            this.writeDebugLog("ダメージ:" + damage + "→" + currentDamage);
        }

        if (activatesDefenderSpecial) {
            switch (defUnit.special) {
                case Special.KoriNoSeikyo:
                    defUnit.battleContext.reducedDamageBySpecial = Math.trunc(damage * 0.3);
                    break;
                case Special.IceMirror2:
                    defUnit.battleContext.reducedDamageBySpecial = Math.trunc(damage * 0.4);
                    break;
                case Special.NegatingFang:
                    defUnit.battleContext.reducedDamageBySpecial = Math.trunc(damage * 0.3);
                    break;
            }
        }
        return currentDamage;
    }

    __restoreMaxSpecialCount(unit) {
        this.writeDebugLog(unit.getNameWithGroup() + "の奥義カウント" + unit.tmpSpecialCount + "→" + unit.maxSpecialCount);
        unit.tmpSpecialCount = unit.maxSpecialCount;
    }

    __reduceSpecialCount(unit, reduceSpCount) {
        var hasUnitSpecial = unit.maxSpecialCount != 0;
        if (hasUnitSpecial == false) {
            return;
        }

        var currentSpCount = unit.tmpSpecialCount;
        unit.tmpSpecialCount -= reduceSpCount;
        if (unit.tmpSpecialCount < 0) {
            unit.tmpSpecialCount = 0;
        }
        this.writeDebugLog(unit.getNameWithGroup() + "の奥義カウント" + currentSpCount + "→" + unit.tmpSpecialCount);
    }
}
