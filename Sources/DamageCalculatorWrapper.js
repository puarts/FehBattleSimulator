
class DamageCalculatorWrapper {
    constructor() {
        this._damageCalc = new DamageCalculator();
    }

    // ログ関連のAPIがとっ散らかってるので、Logger的なものを作って一元管理したい
    get log() {
        return this._damageCalc.log;
    }

    get simpleLog() {
        return this._damageCalc.simpleLog;
    }

    get rawLog() {
        return this._damageCalc.rawLog;
    }

    set isLogEnabled(value) {
        this._damageCalc.isLogEnabled = value;
    }

    clearLog() {
        this._damageCalc.clearLog();
    }

    writeDebugLog(message) {
        this._damageCalc.writeDebugLog(message);
    }

    calcPrecombatSpecialDamage(atkUnit, defUnit) {
        return this._damageCalc.calcPrecombatSpecialDamage(atkUnit, defUnit);
    }

    calcPrecombatSpecialResult(atkUnit, defUnit) {
        return this._damageCalc.calcPrecombatSpecialResult(atkUnit, defUnit);
    }

    calcCombatResult(atkUnit, defUnit, calcPotentialDamage) {
        // ダメージ軽減率の計算(ダメージ軽減効果を軽減する効果の後に実行する必要がある)
        {
            this.__applyDamageReductionRatio(atkUnit, defUnit);
            this.__applyDamageReductionRatio(defUnit, atkUnit);
        }

        DamageCalculatorWrapper.__applySkillEffectForPrecombatAndCombat(atkUnit, defUnit, calcPotentialDamage);
        DamageCalculatorWrapper.__applySkillEffectForPrecombatAndCombat(defUnit, atkUnit, calcPotentialDamage);

        DamageCalculatorWrapper.__calcFixedAddDamage(atkUnit, defUnit, false);

        // 敵が反撃可能か判定
        defUnit.battleContext.canCounterattack = DamageCalculatorWrapper.canCounterAttack(atkUnit, defUnit);
        // this.writeDebugLogLine(defUnit.getNameWithGroup() + "の反撃可否:" + defUnit.battleContext.canCounterattack);

        // 追撃可能か判定
        atkUnit.battleContext.canFollowupAttack = this.__examinesCanFollowupAttackForAttacker(atkUnit, defUnit, calcPotentialDamage);
        if (defUnit.battleContext.canCounterattack) {
            defUnit.battleContext.canFollowupAttack = this.__examinesCanFollowupAttackForDefender(atkUnit, defUnit, calcPotentialDamage);
        }

        // 防御系奥義発動時のダメージ軽減率設定
        this.__applyDamageReductionRatioBySpecial(atkUnit, defUnit);
        this.__applyDamageReductionRatioBySpecial(defUnit, atkUnit);

        // 追撃可能かどうかが条件として必要なスキル効果の適用
        {
            this.__applySkillEffectRelatedToFollowupAttackPossibility(atkUnit, defUnit);
            this.__applySkillEffectRelatedToFollowupAttackPossibility(defUnit, atkUnit);
        }

        // 効果を無効化するスキル
        {
            this.__applyInvalidationSkillEffect(atkUnit, defUnit);
            this.__applyInvalidationSkillEffect(defUnit, atkUnit);
        }

        // 奥義
        {
            this.__applySpecialSkillEffect(atkUnit, defUnit);
            this.__applySpecialSkillEffect(defUnit, atkUnit);
        }

        // 間接的な設定から実際に戦闘で利用する値を評価して戦闘コンテキストに設定
        this.__setSkillEffetToContext(atkUnit, defUnit);

        return this._damageCalc.calcCombatResult(atkUnit, defUnit);
    }

    static __applyBonusDoubler(targetUnit, enemyUnit) {
        if (targetUnit.hasPanic) {
            return;
        }

        targetUnit.atkSpur += targetUnit.getAtkBuffInCombat(enemyUnit);
        targetUnit.spdSpur += targetUnit.getSpdBuffInCombat(enemyUnit);
        targetUnit.defSpur += targetUnit.getDefBuffInCombat(enemyUnit);
        targetUnit.resSpur += targetUnit.getResBuffInCombat(enemyUnit);
    }

    static __applyHeavyBladeSkill(atkUnit, defUnit) {
        if (atkUnit.getEvalAtkInCombat(defUnit) > defUnit.getEvalAtkInCombat(atkUnit)) {
            atkUnit.battleContext.increaseCooldownCountForAttack = true;
        }
    }

    static __applyFlashingBladeSkill(atkUnit, defUnit) {
        if (atkUnit.getEvalSpdInCombat(defUnit) > defUnit.getEvalSpdInCombat(atkUnit)) {
            atkUnit.battleContext.increaseCooldownCountForAttack = true;
        }
    }

    __getDamageReductionRatio(skillId, atkUnit, defUnit) {
        switch (skillId) {
            case Weapon.LilacJadeBreath:
                if (atkUnit.battleContext.initiatesCombat || atkUnit.snapshot.restHpPercentage === 100) {
                    return 0.4;
                }
                break;
            case Weapon.Areadbhar:
                {
                    let diff = defUnit.getEvalSpdInCombat(atkUnit) - atkUnit.getEvalSpdInCombat(defUnit);
                    if (diff > 0 && defUnit.snapshot.restHpPercentage >= 25) {
                        let percentage = Math.min(diff * 4, 40);
                        this.__writeDamageCalcDebugLog(`アラドヴァルによりダメージ${percentage}%軽減(速さの差 ${(defUnit.getEvalSpdInCombat(atkUnit))}-${(atkUnit.getEvalSpdInCombat(defUnit))}=${diff})`);
                        return percentage / 100.0;
                    }
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

                        this.__writeDamageCalcDebugLog("ダメージ" + percentage + "%軽減");
                        return percentage / 100.0;
                    }
                }
                break;
            case Weapon.BrightmareHorn: {
                if (defUnit.snapshot.restHpPercentage >= 25) {
                    {
                        let diff = defUnit.getEvalSpdInCombat(atkUnit) - atkUnit.getEvalSpdInCombat(defUnit);
                        if (diff > 0) {
                            let percentage = diff * 4;
                            if (percentage > 40) {
                                percentage = 40;
                            }

                            this.__writeDamageCalcDebugLog(`武器スキル(${defUnit.weaponInfo.name})によりダメージ${percentage}%軽減`);
                            return percentage / 100.0;
                        }
                    }
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

                        this.__writeDamageCalcDebugLog(`武器スキル(${defUnit.weaponInfo.name})によりダメージ${percentage}%軽減`);
                        return percentage / 100.0;
                    }
                }
                break;
            case PassiveB.MoonTwinWing:
                if (defUnit.snapshot.restHpPercentage >= 25) {
                    return DamageCalculationUtility.getDodgeDamageReductionRatio(atkUnit, defUnit);
                }
                break;
            case PassiveB.Bushido2:
            case PassiveB.Frenzy3:
            case PassiveB.Spurn3:
            case PassiveB.KaihiIchigekiridatsu3:
            case PassiveB.KaihiTatakikomi3:
                return DamageCalculationUtility.getDodgeDamageReductionRatio(atkUnit, defUnit);
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

                        this.__writeDamageCalcDebugLog(`蒼き獅子王によりダメージ${percentage}%軽減(守備の差 ${defUnitDef}-${atkUnitDef}=${diff})`);
                        return percentage / 100.0;
                    }
                }
                break;
        }

        return 0;
    }

    __applyDamageReductionRatio(atkUnit, defUnit) {
        for (let skillId of defUnit.enumerateSkills()) {
            let ratio = this.__getDamageReductionRatio(skillId, atkUnit, defUnit);
            if (ratio > 0) {
                defUnit.battleContext.multDamageReductionRatio(ratio, atkUnit);
            }
        }

        if (defUnit.hasStatusEffect(StatusEffectType.Dodge)) {
            let ratio = DamageCalculationUtility.getDodgeDamageReductionRatio(atkUnit, defUnit);
            if (ratio > 0) {
                defUnit.battleContext.multDamageReductionRatio(ratio, atkUnit);
            }
        }
    }


    /// 戦闘前奥義、戦闘のどちらでも同様の効果のスキルの実装
    static __applySkillEffectForPrecombatAndCombat(targetUnit, enemyUnit, calcPotentialDamage) {
        for (let skillId of targetUnit.enumerateSkills()) {
            switch (skillId) {
                case PassiveB.Bushido2:
                    targetUnit.battleContext.additionalDamage += 7;
                    break;
                case Weapon.DarkCreatorS:
                    if (!calcPotentialDamage && !targetUnit.isOneTimeActionActivatedForWeapon) {
                        let count = targetUnit.battleContext.countOfAlliesWith90PercentOrMoreHp;
                        let damageReductionRatio = Math.min(count * 15, 45) * 0.01;
                        targetUnit.battleContext.multDamageReductionRatio(damageReductionRatio, enemyUnit);
                    }
                    break;
            }
        }
    }

    static __calcFixedAddDamage(atkUnit, defUnit, isPrecombat) {
        for (let skillId of atkUnit.enumeratePassiveSkills()) {
            switch (skillId) {
                case PassiveB.Atrocity:
                    if (defUnit.snapshot.restHpPercentage >= 50) {
                        atkUnit.battleContext.additionalDamage += Math.trunc(atkUnit.getAtkInCombat() * 0.25);
                    }
                    break;
                case PassiveA.HeavyBlade4:
                    if (DamageCalculatorWrapper.__getAtk(atkUnit, defUnit, isPrecombat) > DamageCalculatorWrapper.__getAtk(defUnit, atkUnit, isPrecombat)) {
                        atkUnit.battleContext.additionalDamage += 5;
                    }
                    break;
                case PassiveA.FlashingBlade4:
                    if (DamageCalculatorWrapper.__getSpd(atkUnit, defUnit, isPrecombat) > DamageCalculatorWrapper.__getSpd(defUnit, atkUnit, isPrecombat)) {
                        atkUnit.battleContext.additionalDamage += 5;
                    }
                    break;
                case PassiveA.HashinDanryuKen:
                    {
                        let atk = DamageCalculatorWrapper.__getAtk(atkUnit, defUnit, isPrecombat);
                        atkUnit.battleContext.additionalDamage += Math.trunc(atk * 0.25);
                    }
                    break;
            }
        }
        switch (atkUnit.weapon) {
            case Weapon.MakenMistoruthin:
                if (atkUnit.isWeaponSpecialRefined) {
                    if (isPrecombat) {
                        if (defUnit.restHpPercentage >= 75) {
                            atkUnit.battleContext.additionalDamage += 7;
                        }
                    }
                }
                break;
            case Weapon.Ginnungagap:
                if (atkUnit.battleContext.nextAttackAddReducedDamageActivated) {
                    atkUnit.battleContext.nextAttackAddReducedDamageActivated = false;
                    atkUnit.battleContext.additionalDamage += atkUnit.battleContext.reducedDamageForNextAttack;
                    atkUnit.battleContext.reducedDamageForNextAttack = 0;
                }
                break;
            case Weapon.FairFuryAxe:
                if (atkUnit.battleContext.initiatesCombat || atkUnit.battleContext.isThereAllyIn2Spaces) {
                    atkUnit.battleContext.additionalDamage += Math.trunc(atkUnit.getEvalAtkInCombat() * 0.15);
                }
                break;
            case Weapon.RoseQuartsBow:
                if (atkUnit.battleContext.initiatesCombat || atkUnit.battleContext.isThereAllyIn2Spaces) {
                    atkUnit.battleContext.additionalDamage += Math.trunc(atkUnit.getEvalSpdInCombat() * 0.2);
                }
                break;
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
                        atkUnit.battleContext.additionalDamage += 7;
                    }
                }
                break;
            case Weapon.TsubakiNoKinnagitou:
                if (atkUnit.isWeaponSpecialRefined) {
                    if (atkUnit.snapshot.restHpPercentage >= 70) {
                        atkUnit.battleContext.additionalDamage += 7;
                    }
                }
                break;
            case Weapon.LevinDagger:
                {
                    if (!isPrecombat) {
                        let value = 0;
                        value = atkUnit.getResInCombat(defUnit);
                        atkUnit.battleContext.additionalDamage += Math.trunc(value * 0.2);
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
                    atkUnit.battleContext.additionalDamage += Math.trunc(value * 0.1);
                }
                if (atkUnit.isWeaponSpecialRefined) {
                    if (isPrecombat) {
                        if (defUnit.isRestHpFull) {
                            atkUnit.battleContext.additionalDamage += 7;
                        }
                    }
                    else {
                        if (defUnit.snapshot.isRestHpFull) {
                            atkUnit.battleContext.additionalDamage += 7;
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
                    atkUnit.battleContext.additionalDamage += Math.trunc(value * 0.25);
                }
                break;
            case Weapon.BladeOfRenais:
                if (atkUnit.battleContext.initiatesCombat
                    || atkUnit.battleContext.isThereAllyIn2Spaces
                ) {
                    if (atkUnit.hasPositiveStatusEffect(defUnit)
                        || atkUnit.hasNegativeStatusEffect()
                    ) {
                        let value = isPrecombat ? defUnit.getDefInPrecombat() : defUnit.getDefInCombat(atkUnit);
                        atkUnit.battleContext.additionalDamage += Math.trunc(0.2 * value);
                    }
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
                    atkUnit.battleContext.additionalDamage += Math.trunc(value * 0.25);
                }
                break;
            case Weapon.NewFoxkitFang:
                atkUnit.battleContext.additionalDamage += DamageCalculatorWrapper.__calcAddDamageForDiffOf70Percent(
                    atkUnit, defUnit, isPrecombat,
                    x => x.getEvalResInPrecombat(),
                    (x, y) => x.getEvalResInCombat(y));
                break;
            case Weapon.KenhimeNoKatana:
                if (atkUnit.isWeaponRefined) {
                    atkUnit.battleContext.additionalDamage += Math.trunc(atkUnit.getEvalSpdInCombat() * 0.15);
                } else {
                    atkUnit.battleContext.additionalDamage += DamageCalculatorWrapper.__calcAddDamageForDiffOf70Percent(
                        atkUnit, defUnit, isPrecombat,
                        x => x.getEvalSpdInPrecombat(),
                        (x, y) => x.getEvalSpdInCombat(y));
                }
                break;
            case Weapon.KarasuOuNoHashizume:
            case Weapon.NewBrazenCatFang:
            case Weapon.AkaiAhiruPlus:
            case Weapon.GigaExcalibur:
                if (atkUnit.isWeaponRefined) {
                    atkUnit.battleContext.additionalDamage += Math.trunc(atkUnit.getEvalSpdInCombat() * 0.2);
                } else {
                    atkUnit.battleContext.additionalDamage += DamageCalculatorWrapper.__calcAddDamageForDiffOf70Percent(
                        atkUnit, defUnit, isPrecombat,
                        x => x.getEvalSpdInPrecombat(),
                        (x, y) => x.getEvalSpdInCombat(y));
                }
                break;
            case Weapon.KieiWayuNoKen:
                if (atkUnit.isWeaponSpecialRefined) {
                    atkUnit.battleContext.additionalDamage += DamageCalculatorWrapper.__calcAddDamageForDiffOf70Percent(
                        atkUnit, defUnit, isPrecombat,
                        x => x.getEvalSpdInPrecombat(),
                        (x, y) => x.getEvalSpdInCombat(y));
                }
                break;
            case Weapon.RefreshedFang:
                if (defUnit.snapshot.restHpPercentage >= 75) {
                    atkUnit.battleContext.additionalDamage += DamageCalculatorWrapper.__calcAddDamageForDiffOf70Percent(
                        atkUnit, defUnit, isPrecombat,
                        x => x.getEvalSpdInPrecombat(),
                        (x, y) => x.getEvalSpdInCombat(y));
                }
                break;
            case Weapon.ResolvedFang:
                if (defUnit.snapshot.restHpPercentage >= 75) {
                    atkUnit.battleContext.additionalDamage += DamageCalculatorWrapper.__calcAddDamageForDiffOf70Percent(
                        atkUnit, defUnit, isPrecombat,
                        x => x.getEvalDefInPrecombat(),
                        (x, y) => x.getEvalDefInCombat(y));
                }
                break;
            default:
                break;
        }
    }


    static __getAtk(atkUnit, defUnit, isPrecombat) {
        if (isPrecombat) {
            return atkUnit.getAtkInPrecombat();
        }
        else {
            return atkUnit.getAtkInCombat(defUnit);
        }
    }
    static __getSpd(atkUnit, defUnit, isPrecombat) {
        if (isPrecombat) {
            return atkUnit.getSpdInPrecombat();
        }
        else {
            return atkUnit.getSpdInCombat(defUnit);
        }
    }

    static __calcAddDamageForDiffOf70Percent(atkUnit, defUnit, isPrecombat, getPrecombatFunc, getCombatFunc) {
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

    __examinesCanFollowupAttack(atkUnit, defUnit) {
        this.__writeDamageCalcDebugLog(`${atkUnit.getNameWithGroup()}の速さによる追撃評価:`);
        this.__logSpdInCombat(atkUnit, defUnit, TabChar);
        this.__logSpdInCombat(defUnit, atkUnit, TabChar);
        let result = DamageCalculationUtility.examinesCanFollowupAttack(atkUnit, defUnit);
        if (result) {
            this.__writeDamageCalcDebugLog(TabChar + atkUnit.getNameWithGroup() + "は速さが5以上高いので追撃可能");
        }
        else {
            this.__writeDamageCalcDebugLog(TabChar + atkUnit.getNameWithGroup() + "は速さが足りないので追撃不可");
        }
        return result;
    }

    __logSpdInCombat(unit, enemyUnit, tab = "") {
        this.__writeDamageCalcDebugLog(tab + unit.getNameWithGroup()
            + `の戦闘中速さ${unit.getSpdInCombat(enemyUnit)}(速さ${unit.spdWithSkills}、強化${unit.getSpdBuffInCombat(enemyUnit)}、弱化${unit.spdDebuff}、戦闘中強化${unit.spdSpur})`);
    }


    __examinesCanFollowupAttackForAttacker(atkUnit, defUnit, calcPotentialDamage) {
        this.__writeDamageCalcDebugLog(`${atkUnit.getNameWithGroup()}の追撃評価 ------`);
        let followupAttackPriority = DamageCalculatorWrapper.getFollowupAttackPriorityForBoth(atkUnit, defUnit, calcPotentialDamage);
        if (!defUnit.battleContext.invalidatesAbsoluteFollowupAttack) {
            for (let skillId of atkUnit.enumerateSkills()) {
                switch (skillId) {
                    case Weapon.DarkSpikesT:
                        if (atkUnit.snapshot.restHpPercentage <= 99) {
                            ++followupAttackPriority;
                        }
                        break;
                    case Weapon.WhitedownSpear:
                        if (atkUnit.battleContext.flyingAllyCount >= 3) {
                            ++followupAttackPriority;
                        }
                        break;
                    case Weapon.Jikumunt:
                        if (atkUnit.snapshot.restHpPercentage >= 90) {
                            ++followupAttackPriority;
                        }
                        break;
                    case Weapon.SeireiNoBreath:
                        if (atkUnit.getDefInPrecombat() >= defUnit.getDefInPrecombat() + 5) {
                            ++followupAttackPriority;
                        }
                        break;
                    case PassiveB.BoldFighter3: ++followupAttackPriority; break;
                    case Weapon.TakaouNoHashizume:
                        if (defUnit.snapshot.isRestHpFull) {
                            ++followupAttackPriority;
                        }
                        break;
                    case PassiveB.TsuigekiTaikeiKisu3:
                        if (atkUnit.battleContext.currentTurn % 2 == 1) {
                            ++followupAttackPriority;
                        }
                        break;
                    case PassiveB.EvenFollowUp3:
                        if (atkUnit.battleContext.currentTurn % 2 === 0) {
                            ++followupAttackPriority;
                        }
                        break;
                    case PassiveB.Sashitigae3:
                        if (atkUnit.snapshot.restHpPercentage <= 50 && DamageCalculatorWrapper.canCounterAttack(atkUnit, defUnit)) {
                            ++followupAttackPriority;
                        }
                        break;
                    case Weapon.SoulCaty:
                        if (atkUnit.isWeaponSpecialRefined) {
                            if (atkUnit.snapshot.restHpPercentage <= 75 && DamageCalculatorWrapper.canCounterAttack(atkUnit, defUnit)) {
                                ++followupAttackPriority;
                            }
                        }
                        break;
                    case Weapon.RohyouNoKnife:
                        if ((defUnit.isMeleeWeaponType() || atkUnit.isWeaponRefined) && DamageCalculatorWrapper.canCounterAttack(atkUnit, defUnit)) {
                            ++followupAttackPriority;
                        }
                        break;
                }
            }
        }

        if (!atkUnit.battleContext.invalidatesInvalidationOfFollowupAttack) {
            for (let skillId of atkUnit.enumerateSkills()) {
                switch (skillId) {
                    case PassiveB.Kazenagi3:
                        --followupAttackPriority;
                        break;
                    case PassiveB.Mizunagi3:
                        --followupAttackPriority;
                        break;
                }
            }
        }

        if (followupAttackPriority < 0) {
            // 追撃不可を受けた
            this.__writeDamageCalcDebugLog(atkUnit.getNameWithGroup() + "はスキル効果により追撃不可");
            return false;
        } else if (followupAttackPriority > 0) {
            // 絶対追撃発動
            this.__writeDamageCalcDebugLog(atkUnit.getNameWithGroup() + "はスキル効果により絶対追撃");
            return true;
        }
        else {
            // 速さ勝負
            if (this.__examinesCanFollowupAttack(atkUnit, defUnit)) {
                return true;
            }
            else {
                return false;
            }
        }
    }

    __examinesCanFollowupAttackForDefender(atkUnit, defUnit, calcPotentialDamage) {
        this.__writeDamageCalcDebugLog(`${defUnit.getNameWithGroup()}の追撃評価 ------`);
        let followupAttackPriority = DamageCalculatorWrapper.getFollowupAttackPriorityForBoth(defUnit, atkUnit, calcPotentialDamage);
        if (!atkUnit.battleContext.invalidatesAbsoluteFollowupAttack) {
            for (let skillId of defUnit.enumerateSkills()) {
                switch (skillId) {
                    case PassiveB.SlickFighter3:
                        if (defUnit.snapshot.restHpPercentage >= 25) {
                            ++followupAttackPriority;
                        }
                        break;
                    case Weapon.Marute:
                        if (defUnit.isWeaponRefined) {
                            if (defUnit.snapshot.restHpPercentage >= 25) {
                                ++followupAttackPriority;
                            }
                        }
                        else if (defUnit.snapshot.restHpPercentage >= 50) {
                            ++followupAttackPriority;
                        }
                        break;
                    case PassiveB.BlueLionRule:
                        ++followupAttackPriority;
                        break;
                    case PassiveB.HolyWarsEnd:
                        if (defUnit.snapshot.restHpPercentage >= 50) {
                            ++followupAttackPriority;
                        }
                        break;
                    case PassiveB.QuickRiposte1:
                        if (defUnit.snapshot.restHpPercentage >= 90) {
                            ++followupAttackPriority;
                        }
                        break;
                    case PassiveB.QuickRiposte2:
                        if (defUnit.snapshot.restHpPercentage >= 80) {
                            ++followupAttackPriority;
                        }
                        break;
                    case PassiveB.QuickRiposte3:
                        if (defUnit.snapshot.restHpPercentage >= 70) {
                            // this.writeDebugLogLine("HP" + defUnit.snapshot.restHpPercentage + "%で切り返し発動、" + defUnit.getNameWithGroup() + "は絶対追撃");
                            ++followupAttackPriority;
                        }
                        break;
                    case PassiveB.DragonsIre3:
                        if (defUnit.snapshot.restHpPercentage >= 50) {
                            ++followupAttackPriority;
                        }
                        break;
                    case PassiveB.VengefulFighter3:
                        if (defUnit.snapshot.restHpPercentage >= 50) {
                            ++followupAttackPriority;
                        }
                        break;
                    case Weapon.Arumazu:
                        if (defUnit.snapshot.restHpPercentage >= 80) {
                            ++followupAttackPriority;
                        }
                        break;
                    case Weapon.HuinNoKen:
                    case Weapon.MoumokuNoYumi:
                        if (defUnit.isWeaponSpecialRefined) {
                            if (defUnit.snapshot.restHpPercentage >= 50) {
                                ++followupAttackPriority;
                            }
                        }
                        break;
                }
            }
        }

        if (!defUnit.battleContext.invalidatesInvalidationOfFollowupAttack) {
            for (let skillId of atkUnit.enumerateSkills()) {
                switch (skillId) {
                    case Weapon.InstantLancePlus:
                        --followupAttackPriority;
                        break;
                    case Weapon.Rifia:
                        if (atkUnit.snapshot.restHpPercentage >= 50) {
                            --followupAttackPriority;
                        }
                        break;
                    case Weapon.HewnLance:
                        if (atkUnit.isWeaponSpecialRefined) {
                            --followupAttackPriority;
                        }
                        break;
                    case Weapon.JoyfulVows:
                        if (atkUnit.hasPositiveStatusEffect(defUnit)) {
                            --followupAttackPriority;
                        }
                        break;
                    case Weapon.KarenNoYumi:
                        if (atkUnit.isWeaponSpecialRefined) {
                            --followupAttackPriority;
                        }
                        break;
                    case Weapon.BlazingDurandal:
                        if (isWeaponSpecialRefined(atkUnit.weaponRefinement)) {
                            --followupAttackPriority;
                        }
                        break;
                    case Weapon.MasterBow:
                        if (atkUnit.groupId == UnitGroupType.Ally) {
                            --followupAttackPriority;
                        }
                        break;
                    case PassiveA.KishinKongoNoSyungeki:
                    case PassiveA.KishinMeikyoNoSyungeki:
                    case PassiveA.SteadyImpact:
                    case PassiveA.SwiftImpact:
                        --followupAttackPriority;
                        break;
                    case PassiveB.TsuigekiTaikeiKisu3:
                        if (atkUnit.battleContext.currentTurn % 2 == 1) {
                            --followupAttackPriority;
                        }
                        break;
                    case PassiveB.EvenFollowUp3:
                        if (atkUnit.battleContext.currentTurn % 2 === 0) {
                            --followupAttackPriority;
                        }
                        break;
                    case Weapon.AijouNoHanaNoYumiPlus:
                    case Weapon.BukeNoSteckPlus:
                        --followupAttackPriority;
                        break;
                }
            }
        }

        if (atkUnit.isTransformed) {
            switch (atkUnit.weapon) {
                case Weapon.RefreshedFang:
                case Weapon.RaydreamHorn:
                case Weapon.BrightmareHorn:
                case Weapon.NightmareHorn:
                case Weapon.BrazenCatFang:
                case Weapon.NewBrazenCatFang:
                case Weapon.NewFoxkitFang:
                case Weapon.FoxkitFang:
                case Weapon.TaguelFang:
                case Weapon.TaguelChildFang:
                case Weapon.YoukoohNoTsumekiba:
                case Weapon.JunaruSenekoNoTsumekiba:
                    --followupAttackPriority;
                    break;
            }
        }

        if (followupAttackPriority < 0) {
            // 追撃不可を受けた
            this.__writeDamageCalcDebugLog(defUnit.getNameWithGroup() + "はスキル効果により追撃不可");
            return false;
        } else if (followupAttackPriority > 0) {
            // 絶対追撃発動
            this.__writeDamageCalcDebugLog(defUnit.getNameWithGroup() + "はスキル効果により絶対追撃");
            return true;
        }
        else {
            // 速さ勝負
            if (this.__examinesCanFollowupAttack(defUnit, atkUnit)) {
                return true;
            }
            else {
                return false;
            }
        }
    }

    static canCounterAttack(atkUnit, defUnit) {
        return DamageCalculatorWrapper.__examinesCanCounterattackBasically(atkUnit, defUnit)
            && !DamageCalculatorWrapper.__canDisableCounterAttack(atkUnit, defUnit);
    }

    static __canDisableCounterAttack(atkUnit, defUnit) {
        if (defUnit.hasPassiveSkill(PassiveB.MikiriHangeki3)) {
            return false;
        }

        if (defUnit.hasStatusEffect(StatusEffectType.CounterattacksDisrupted)) {
            return true;
        }

        if (atkUnit.battleContext.invalidatesCounterattack) {
            return true;
        }

        switch (atkUnit.weapon) {
            case Weapon.SurvivalistBow:
                if (atkUnit.battleContext.isSolo && defUnit.snapshot.restHpPercentage >= 80) {
                    return true;
                }
                break;
            case Weapon.Nizuheggu:
                if (atkUnit.isWeaponSpecialRefined) {
                    if (isWeaponTypeTome(defUnit.weaponType) || isWeaponTypeBreath(defUnit.weaponType)) {
                        return true;
                    }
                }
                break;
            case Weapon.GeneiLongBow:
                if (atkUnit.getEvalSpdInCombat(defUnit) > defUnit.getEvalSpdInCombat(atkUnit)) {
                    return true;
                }
                break;
            case Weapon.SnipersBow:
                if (atkUnit.isWeaponSpecialRefined) {
                    if (atkUnit.snapshot.restHpPercentage >= 50
                        && atkUnit.battleContext.isTherePartnerIn2Spaces
                    ) {
                        return true;
                    }
                }
                break;
            case Weapon.EishinNoAnki:
                if (atkUnit.battleContext.isTherePartnerIn2Spaces) {
                    return true;
                }
                break;
            case Weapon.DeathlyDagger:
                if (atkUnit.isWeaponSpecialRefined) {
                    if (isWeaponTypeTome(defUnit.weaponType)) {
                        return true;
                    }
                }
                break;
        }

        switch (atkUnit.passiveA) {
            case PassiveA.LawsOfSacae2:
                if (atkUnit.battleContext.initiatesCombat || atkUnit.battleContext.isThereAllyIn2Spaces) {
                    if (defUnit.isMeleeWeaponType()) {
                        let atkUnitSpd = atkUnit.getSpdInCombat(defUnit);
                        let defUnitSpd = defUnit.getSpdInCombat(atkUnit);
                        if (atkUnitSpd >= defUnitSpd + 5) {
                            return true;
                        }
                    }
                }
                break;
        }

        // 反撃不可
        let atkWeaponInfo = atkUnit.weaponInfo;
        let passiveBInfo = atkUnit.passiveBInfo;
        if ((atkWeaponInfo != null && atkWeaponInfo.disableCounterattack)
            || (passiveBInfo != null && passiveBInfo.disableCounterattack)
            || (atkUnit.weaponRefinement == WeaponRefinementType.DazzlingStaff)
            || (atkUnit.passiveB == PassiveB.SacaesBlessing
                && (defUnit.weaponType == WeaponType.Sword || defUnit.weaponType == WeaponType.Lance || defUnit.weaponType == WeaponType.Axe))
            || (atkUnit.hasPassiveSkill(PassiveB.Kazenagi3)
                && atkUnit.getEvalSpdInCombat(defUnit) > defUnit.getEvalSpdInCombat(atkUnit)
                && isPhysicalWeaponType(defUnit.weaponType))
            || (atkUnit.hasPassiveSkill(PassiveB.Mizunagi3)
                && atkUnit.getEvalSpdInCombat(defUnit) > defUnit.getEvalSpdInCombat(atkUnit)
                && !isPhysicalWeaponType(defUnit.weaponType))
            || (atkUnit.passiveB == PassiveB.FuinNoTate && isWeaponTypeBreath(defUnit.weaponType))
        ) {
            return true;
        }
        return false;
    }

    static __examinesCanCounterattackBasically(atkUnit, defUnit) {
        if (!defUnit.hasWeapon) {
            return false;
        }

        if (defUnit.battleContext.canCounterattackToAllDistance) {
            return true;
        }

        if (atkUnit.attackRange == defUnit.attackRange) {
            return true;
        }

        if (atkUnit.isRangedWeaponType()) {
            switch (defUnit.passiveA) {
                case PassiveA.DistantCounter:
                case PassiveA.OstiasCounter:
                    return true;
                case PassiveA.DistantFoil:
                    if (isPhysicalWeaponType(atkUnit.weaponType)) {
                        return true;
                    }
                    break;
                case PassiveA.DistantWard:
                    if (atkUnit.weaponType == WeaponType.Staff
                        || isWeaponTypeBreath(atkUnit.weaponType)
                        || isWeaponTypeTome(atkUnit.weaponType)) {
                        return true;
                    }
                    break;
            }
        }
        else if (atkUnit.isMeleeWeaponType()) {
            switch (defUnit.passiveA) {
                case PassiveA.CloseCounter:
                    return true;
                case PassiveA.CloseFoil:
                    if (isPhysicalWeaponType(atkUnit.weaponType)) {
                        return true;
                    }
                    break;
                case PassiveA.CloseWard:
                    if (atkUnit.weaponType === WeaponType.Staff ||
                        isWeaponTypeBreath(atkUnit.weaponType) ||
                        isWeaponTypeTome(atkUnit.weaponType)) {
                        return true;
                    }
                    break;
            }
            switch (defUnit.weapon) {
                case Weapon.DoubleBow:
                    if (defUnit.battleContext.isSolo) {
                        return true;
                    }
                    break;
                case Weapon.KinsekiNoSyo:
                    if (defUnit.isWeaponSpecialRefined) {
                        if (atkUnit.weaponType == WeaponType.Sword
                            || atkUnit.weaponType == WeaponType.Lance
                            || atkUnit.weaponType == WeaponType.Axe
                            || isWeaponTypeBeast(atkUnit.weaponType)
                        ) {
                            return true;
                        }
                    }
                    break;
            }
        }

        return false;
    }

    static getFollowupAttackPriorityForBoth(atkUnit, defUnit, calcPotentialDamage) {
        let followupAttackPriority = 0;
        if (!defUnit.battleContext.invalidatesAbsoluteFollowupAttack) {
            followupAttackPriority += atkUnit.battleContext.followupAttackPriorityIncrement;

            if (DamageCalculatorWrapper.canActivateBreakerSkill(atkUnit, defUnit)) {
                ++followupAttackPriority;
            }

            if (atkUnit.hasStatusEffect(StatusEffectType.FollowUpAttackPlus)) {
                ++followupAttackPriority;
            }

            for (let skillId of atkUnit.enumerateSkills()) {
                switch (skillId) {
                    case PassiveB.BlackEagleRule:
                        if (atkUnit.snapshot.restHpPercentage >= 25) {
                            ++followupAttackPriority;
                        }
                        break;
                    case Weapon.GateAnchorAxe:
                        if (calcPotentialDamage || !atkUnit.battleContext.isThereAllyOnAdjacentTiles) {
                            ++followupAttackPriority;
                        }
                        break;
                    case Weapon.SkyPirateClaw:
                        if (calcPotentialDamage || !atkUnit.battleContext.isThereAllyOnAdjacentTiles) {
                            ++followupAttackPriority;
                        }
                        break;
                    case Weapon.DarkScripture:
                        if (!defUnit.hasEffective(EffectiveType.Dragon)) {
                            ++followupAttackPriority;
                        }
                        break;
                    case PassiveB.RagingStorm:
                        if (calcPotentialDamage ||
                            (isWeaponTypeBreathOrBeast(defUnit.weaponType)
                                && !atkUnit.battleContext.isThereAllyOnAdjacentTiles)
                        ) {
                            ++followupAttackPriority;
                        }
                        break;
                    case Weapon.VoidTome:
                        if (defUnit.getSpdInPrecombat() >= 35
                            || defUnit.hasNegativeStatusEffect()
                        ) {
                            ++followupAttackPriority;
                        }
                        break;
                    case PassiveB.DragonsIre3:
                        if (enemyUnit.battleContext.initiatesCombat && targetUnit.snapshot.restHpPercentage >= 50) {
                            targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                        }
                        break;
                    case Weapon.Garumu:
                        if (atkUnit.isWeaponRefined) {
                            if (atkUnit.hasPositiveStatusEffect()) {
                                ++followupAttackPriority;
                            }
                        }
                        else if (atkUnit.isBuffed || atkUnit.isMobilityIncreased) {
                            ++followupAttackPriority;
                        }
                        break;
                    case Weapon.AnkigoroshiNoYumi:
                    case Weapon.AnkigoroshiNoYumiPlus:
                        if (isWeaponTypeDagger(defUnit.weaponType)) {
                            ++followupAttackPriority;
                        }
                        break;
                    case Weapon.KouketsuNoSensou:
                        if ((atkUnit.snapshot.restHpPercentage == 100 && defUnit.snapshot.restHpPercentage == 100)
                            || (atkUnit.snapshot.restHpPercentage < 100 && defUnit.snapshot.restHpPercentage < 100)
                        ) {
                            ++followupAttackPriority;
                        }
                        break;
                    case Weapon.ReginRave:
                        if (atkUnit.getAtkInCombat(defUnit) > defUnit.getAtkInCombat(atkUnit) || atkUnit.isMobilityIncreased) {
                            ++followupAttackPriority;
                        }
                        break;
                    case Weapon.FlameSiegmund:
                    case Weapon.HadoNoSenfu:
                        if (atkUnit.battleContext.isEnemyCountIsGreaterThanOrEqualToAllyCountIn2Spaces) {
                            ++followupAttackPriority;
                        }
                        break;
                    case Weapon.Gyorru:
                    case Weapon.ChaosManifest:
                        if (defUnit.hasNegativeStatusEffect()) {
                            ++followupAttackPriority;
                        }
                        break;
                    case Weapon.Sekuvaveku:
                        if (calcPotentialDamage || atkUnit.battleContext.isThereAllyIn3Spaces) {
                            ++followupAttackPriority;
                        }
                        break;
                }
            }

            if (atkUnit.passiveB == PassiveB.FuinNoTate) {
                if (isWeaponTypeBreath(defUnit.weaponType)) {
                    ++followupAttackPriority;
                }
            }
            else if (atkUnit.passiveB == PassiveB.TsuigekiRing) {
                if (atkUnit.snapshot.restHpPercentage >= 50) {
                    ++followupAttackPriority;
                }
            }
        }

        if (!atkUnit.battleContext.invalidatesInvalidationOfFollowupAttack) {
            followupAttackPriority += atkUnit.battleContext.followupAttackPriorityDecrement;

            if (defUnit.hasStatusEffect(StatusEffectType.FollowUpAttackMinus)) {
                --followupAttackPriority;
            }

            if (defUnit.hasStatusEffect(StatusEffectType.ResonantShield) && defUnit.isOneTimeActionActivatedForShieldEffect == false) {
                --followupAttackPriority;
            }
            if (atkUnit.passiveB == PassiveB.WaryFighter3 && atkUnit.snapshot.restHpPercentage >= 50) {
                --followupAttackPriority;
            }
            if (DamageCalculatorWrapper.canActivateBreakerSkill(defUnit, atkUnit)) {
                --followupAttackPriority;
            }

            for (let skillId of defUnit.enumerateSkills()) {
                switch (skillId) {
                    case Weapon.Marute:
                        if (defUnit.isWeaponSpecialRefined) {
                            if (!defUnit.battleContext.initiatesCombat
                                || atkUnit.snapshot.restHpPercentage == 100) {
                                --followupAttackPriority;
                            }
                        }

                        break;
                    case Weapon.Aymr:
                        if (calcPotentialDamage || defUnit.battleContext.isSolo) {
                            --followupAttackPriority;
                        }
                        break;
                    case Weapon.HarukazeNoBreath:
                        if (defUnit.battleContext.isThereAllyIn2Spaces
                            || defUnit.isBuffed
                        ) {
                            --followupAttackPriority;
                        }
                        break;
                    case Weapon.TenraiArumazu:
                        if (defUnit.battleContext.isAllyCountIsGreaterThanEnemyCountIn2Spaces) {
                            --followupAttackPriority;
                        }
                        break;
                    case Weapon.AnkigoroshiNoYumi:
                    case Weapon.AnkigoroshiNoYumiPlus:
                        if (isWeaponTypeDagger(atkUnit.weaponType)) {
                            --followupAttackPriority;
                        }
                        break;
                    case Weapon.Buryunhirude:
                        if (defUnit.isWeaponSpecialRefined) {
                            if (atkUnit.isRangedWeaponType()) {
                                if (defUnit.getDefInCombat(atkUnit) > atkUnit.getDefInCombat(defUnit)) {
                                    --followupAttackPriority;
                                }
                            }
                        }
                        break;
                    case Weapon.Gyorru:
                        if (atkUnit.hasNegativeStatusEffect()) {
                            --followupAttackPriority;
                        }
                        break;
                    case Weapon.ShintakuNoBreath:
                        if (defUnit.isBuffed) {
                            --followupAttackPriority;
                        }
                        break;
                    case Weapon.SarieruNoOkama:
                        if (atkUnit.isBuffed || atkUnit.isMobilityIncreased) {
                            --followupAttackPriority;
                        }
                        break;
                    case Weapon.ImbuedKoma:
                        if (defUnit.isSpecialCharged) {
                            --followupAttackPriority;
                        }
                        break;
                    case Weapon.FellBreath:
                        if (atkUnit.snapshot.restHpPercentage < 100) {
                            --followupAttackPriority;
                        }
                        break;
                    case Weapon.ShinenNoBreath:
                        if (defUnit.getDefInCombat(atkUnit) >= atkUnit.getDefInCombat(defUnit) + 5) {
                            --followupAttackPriority;
                        }
                        break;
                    case Weapon.BaraNoYari:
                        if (defUnit.getAtkInPrecombat() > atkUnit.getAtkInPrecombat()) {
                            --followupAttackPriority;
                        }
                        break;
                    case Weapon.GeneiBattleAxe:
                        if (defUnit.battleContext.isThereAllyIn2Spaces) {
                            --followupAttackPriority;
                        }
                        break;


                    case PassiveB.WaryFighter3:
                        if (defUnit.snapshot.restHpPercentage >= 50) {
                            --followupAttackPriority;
                        }
                        break;
                    case PassiveB.FuinNoTate:
                        if (isWeaponTypeBreath(atkUnit.weaponType)) {
                            --followupAttackPriority;
                        }
                        break;
                }
            }

        }
        return followupAttackPriority;
    }

    /// 殺しスキルを発動できるならtrue、そうでなければfalseを返します。
    static canActivateBreakerSkill(breakerUnit, targetUnit) {
        // 殺し3の評価
        if (breakerUnit.snapshot.restHpPercentage < 50) { return false; }
        switch (breakerUnit.passiveB) {
            case PassiveB.Swordbreaker3: return targetUnit.weaponType == WeaponType.Sword;
            case PassiveB.Lancebreaker3: return targetUnit.weaponType == WeaponType.Lance;
            case PassiveB.Axebreaker3: return targetUnit.weaponType == WeaponType.Axe;
            case PassiveB.Bowbreaker3: return targetUnit.weaponType == WeaponType.ColorlessBow;
            case PassiveB.Daggerbreaker3: return targetUnit.weaponType == WeaponType.ColorlessDagger;
            case PassiveB.RedTomebreaker3: return targetUnit.weaponType == WeaponType.RedTome;
            case PassiveB.BlueTomebreaker3: return targetUnit.weaponType == WeaponType.BlueTome;
            case PassiveB.GreenTomebreaker3: return targetUnit.weaponType == WeaponType.GreenTome;
        }

        return false;
    }


    __applyDamageReductionRatioBySpecial(defUnit, atkUnit) {
        let attackRange = atkUnit.getActualAttackRange(defUnit);
        switch (defUnit.special) {
            case Special.NegatingFang:
                defUnit.battleContext.damageReductionRatioBySpecial = 0.3;
                break;
            case Special.Seikabuto:
            case Special.Seii:
            case Special.KoriNoSeikyo:
                if (attackRange == 2) {
                    defUnit.battleContext.damageReductionRatioBySpecial = 0.3;
                }
                break;
            case Special.IceMirror2:
                if (attackRange === 2) {
                    defUnit.battleContext.damageReductionRatioBySpecial = 0.4;
                }
                break;
            case Special.Seitate:
                if (attackRange == 2) {
                    defUnit.battleContext.damageReductionRatioBySpecial = 0.5;
                }
                break;
            case Special.Kotate:
            case Special.Nagatate:
                if (attackRange == 1) {
                    defUnit.battleContext.damageReductionRatioBySpecial = 0.3;
                }
                break;
            case Special.Otate:
                if (attackRange == 1) {
                    defUnit.battleContext.damageReductionRatioBySpecial = 0.5;
                }
                break;
        }
    }

    /// 追撃可能かどうかが条件として必要なスキル効果の適用
    __applySkillEffectRelatedToFollowupAttackPossibility(targetUnit, enemyUnit) {
        for (let skillId of targetUnit.enumerateSkills()) {
            switch (skillId) {
                case Weapon.VengefulLance:
                    {
                        if (!targetUnit.battleContext.isThereAllyOnAdjacentTiles
                            && !targetUnit.battleContext.canFollowupAttack
                        ) {
                            targetUnit.battleContext.rateOfAtkMinusDefForAdditionalDamage = 0.5;
                        }
                    }
                    break;
            }
        }
    }

    __applyInvalidationSkillEffect(atkUnit, defUnit) {
        for (let skillId of atkUnit.enumerateSkills()) {
            switch (skillId) {
                case PassiveB.MoonlightBangle:
                    defUnit.battleContext.reducesCooldownCount = false;
                    break;
                case Weapon.HolyYewfelle:
                    if (atkUnit.battleContext.initiatesCombat || defUnit.snapshot.restHpPercentage >= 75) {
                        defUnit.battleContext.reducesCooldownCount = false;
                    }
                    break;
                case Weapon.SyunsenAiraNoKen:
                    if (atkUnit.isWeaponRefined) {
                        defUnit.battleContext.increaseCooldownCountForAttack = false;
                        defUnit.battleContext.increaseCooldownCountForDefense = false;
                        defUnit.battleContext.reducesCooldownCount = false;
                    }
                    break;
                case Weapon.TenteiNoKen:
                    defUnit.battleContext.increaseCooldownCountForAttack = false;
                    defUnit.battleContext.increaseCooldownCountForDefense = false;
                    defUnit.battleContext.reducesCooldownCount = false;
                    break;
            }
        }
    }

    __applySpecialSkillEffect(targetUnit, enemyUnit) {
        switch (targetUnit.special) {
            case Special.Taiyo:
                targetUnit.battleContext.specialDamageRatioToHeal = 0.5;
                break;
            case Special.Youkage:
            case Special.Yuyo:
                targetUnit.battleContext.specialDamageRatioToHeal = 0.3;
                break;
            case Special.Kagetsuki:
            case Special.Moonbow:
                // 月虹
                targetUnit.battleContext.specialSufferPercentage = 30;
                break;
            case Special.Luna:
                // 月光
                targetUnit.battleContext.specialSufferPercentage = 50;
                break;
            case Special.KuroNoGekko:
                targetUnit.battleContext.specialSufferPercentage = 80;
                break;
            case Special.Aether:
            case Special.AoNoTenku:
            case Special.RadiantAether2:
            case Special.MayhemAether:
                // 天空
                targetUnit.battleContext.specialSufferPercentage = 50;
                targetUnit.battleContext.specialDamageRatioToHeal = 0.5;
                break;
            case Special.LunaFlash: {
                // 月光閃
                let totalSpd = targetUnit.getSpdInCombat(enemyUnit);
                targetUnit.battleContext.specialAddDamage = Math.trunc(totalSpd * 0.2);
                targetUnit.battleContext.specialSufferPercentage = 20;
                break;
            }

            case Special.Hoshikage:
            case Special.Glimmer:
                // 凶星
                targetUnit.battleContext.specialMultDamage = 1.5;
                break;
            case Special.Deadeye:
                targetUnit.battleContext.specialMultDamage = 2;
                targetUnit.battleContext.invalidatesDamageReductionExceptSpecialOnSpecialActivation = true;
                break;
            case Special.Astra: {
                // 流星
                targetUnit.battleContext.specialMultDamage = 2.5;
                break;
            }
            case Special.Hotarubi:
            case Special.Bonfire:
                // 緋炎
                {
                    let totalDef = targetUnit.getDefInCombat(enemyUnit);
                    targetUnit.battleContext.specialAddDamage = Math.trunc(totalDef * 0.5);
                }
                break;
            case Special.Ignis:
                // 華炎
                {
                    let totalDef = targetUnit.getDefInCombat(enemyUnit);
                    targetUnit.battleContext.specialAddDamage = Math.trunc(totalDef * 0.8);
                }
                break;
            case Special.Hyouten:
            case Special.Iceberg:
                // 氷蒼
                {
                    let totalRes = targetUnit.getResInCombat(enemyUnit);
                    targetUnit.battleContext.specialAddDamage = Math.trunc(totalRes * 0.5);
                }
                break;
            case Special.Glacies:
                // 氷華
                {
                    let totalRes = targetUnit.getResInCombat(enemyUnit);
                    targetUnit.battleContext.specialAddDamage = Math.trunc(totalRes * 0.8);
                }
                break;
            case Special.HolyKnightAura:
                // グランベルの聖騎士
                {
                    let totalAtk = targetUnit.getAtkInCombat(enemyUnit);
                    targetUnit.battleContext.specialAddDamage = Math.trunc(totalAtk * 0.25);
                }
                break;
            case Special.Fukuryu:
            case Special.DraconicAura:
                // 竜裂
                {
                    let totalAtk = targetUnit.getAtkInCombat(enemyUnit);
                    targetUnit.battleContext.specialAddDamage = Math.trunc(totalAtk * 0.3);
                }
                break;
            case Special.DragonFang: {
                // 竜穿
                let totalAtk = targetUnit.getAtkInCombat(enemyUnit);
                targetUnit.battleContext.specialAddDamage = Math.trunc(totalAtk * 0.5);
                break;
            }
            case Special.ShiningEmblem:
                {
                    let totalSpd = targetUnit.getSpdInCombat(enemyUnit);
                    targetUnit.battleContext.specialAddDamage = Math.trunc(totalSpd * 0.35);
                }
                break;
            case Special.HonoNoMonsyo:
            case Special.HerosBlood:
                {
                    let totalSpd = targetUnit.getSpdInCombat(enemyUnit);
                    targetUnit.battleContext.specialAddDamage = Math.trunc(totalSpd * 0.3);
                }
                break;
            case Special.RighteousWind:
                // 聖風
                {
                    let totalSpd = targetUnit.getSpdInCombat(enemyUnit);
                    targetUnit.battleContext.specialAddDamage = Math.trunc(totalSpd * 0.3);
                }
                break;
            case Special.Sirius:
                // 天狼
                {
                    let totalSpd = targetUnit.getSpdInCombat(enemyUnit);
                    targetUnit.battleContext.specialAddDamage = Math.trunc(totalSpd * 0.3);
                    targetUnit.battleContext.specialDamageRatioToHeal = 0.3;
                }
                break;
            case Special.TwinBlades: // 双刃
                {
                    let totalRes = targetUnit.getResInCombat(enemyUnit);
                    targetUnit.battleContext.specialAddDamage = Math.trunc(totalRes * 0.4);
                    targetUnit.battleContext.invalidatesDamageReductionExceptSpecialOnSpecialActivation = true;
                }
                break;
            case Special.RupturedSky: {
                if (isWeaponTypeBeast(enemyUnit.weaponType) || isWeaponTypeBreath(enemyUnit.weaponType)) {
                    targetUnit.battleContext.specialAddDamage = Math.trunc(enemyUnit.getAtkInCombat(targetUnit) * 0.4);
                }
                else {
                    targetUnit.battleContext.specialAddDamage = Math.trunc(enemyUnit.getAtkInCombat(targetUnit) * 0.2);
                }
                break;
            }
            case Special.SublimeHeaven:
                if (isWeaponTypeBeast(enemyUnit.weaponType) || isWeaponTypeBreath(enemyUnit.weaponType)) {
                    targetUnit.battleContext.specialAddDamage = Math.trunc(targetUnit.getAtkInCombat(enemyUnit) * 0.5);
                }
                else {
                    targetUnit.battleContext.specialAddDamage = Math.trunc(targetUnit.getAtkInCombat(enemyUnit) * 0.25);
                }
                targetUnit.battleContext.invalidatesDamageReductionExceptSpecialOnSpecialActivation = true;
                break;
            case Special.RegnalAstra:
            case Special.ImperialAstra:
                {
                    let totalSpd = targetUnit.getSpdInCombat(enemyUnit);
                    targetUnit.battleContext.specialAddDamage = Math.trunc(totalSpd * 0.4);
                }
                break;
            case Special.OpenTheFuture:
                {
                    let totalDef = targetUnit.getDefInCombat(enemyUnit);
                    targetUnit.battleContext.specialAddDamage = Math.trunc(totalDef * 0.5);
                    targetUnit.battleContext.specialDamageRatioToHeal = 0.25;
                }
                break;
            case Special.BlueFrame:
                targetUnit.battleContext.specialAddDamage = 10;
                if (targetUnit.battleContext.isThereAllyOnAdjacentTiles) {
                    targetUnit.battleContext.specialAddDamage += 15;
                }
                break;
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
            atkUnit.battleContext.isDesperationActivated = atkUnit.battleContext.isDesperationActivatable || atkUnit.hasStatusEffect(StatusEffectType.Desperation);
            defUnit.battleContext.isVantageActivated = defUnit.battleContext.isVantabeActivatable || defUnit.hasStatusEffect(StatusEffectType.Vantage);
            defUnit.battleContext.isDefDesperationActivated = defUnit.battleContext.isDefDesperationActivatable;

            if (defUnit.battleContext.isDefDesperationActivated) {
                this.__writeDamageCalcDebugLog(defUnit.getNameWithGroup() + "は攻撃の直後に追撃");
            }
            if (atkUnit.battleContext.isDesperationActivated) {
                this.__writeDamageCalcDebugLog(atkUnit.getNameWithGroup() + "は攻め立て効果発動、攻撃の直後に追撃");
            }
            if (defUnit.battleContext.isVantageActivated) {
                this.__writeDamageCalcDebugLog(defUnit.getNameWithGroup() + "は待ち伏せ効果発動、先制攻撃");
            }
        }
        else {
            atkUnit.battleContext.isDesperationActivated = false;
            defUnit.battleContext.isVantageActivated = false;
        }
    }

    __setBothOfAtkDefSkillEffetToContext(targetUnit, enemyUnit) {
        switch (targetUnit.weapon) {
            case Weapon.SeaSearLance:
            case Weapon.LoyalistAxe:
                if ((enemyUnit.battleContext.initiatesCombat || enemyUnit.snapshot.restHpPercentage >= 75) &&
                    enemyUnit.battleContext.canFollowupAttack) {
                    targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.75, enemyUnit);
                }
                break;
            case Weapon.Hrist:
                if (targetUnit.snapshot.restHpPercentage <= 99) {
                    targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.3, enemyUnit);
                }
                break;
            case Weapon.CourtlyMaskPlus:
            case Weapon.CourtlyBowPlus:
            case Weapon.CourtlyCandlePlus:
                if (targetUnit.snapshot.restHpPercentage >= 50 && enemyUnit.battleContext.canFollowupAttack) {
                    targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.5, enemyUnit);
                }
                break;
            case Weapon.SummerStrikers:
                if (targetUnit.battleContext.initiatesCombat && targetUnit.snapshot.restHpPercentage >= 25) {
                    targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.75, enemyUnit);
                }
                break;
            case Weapon.Urvan:
                {
                    targetUnit.battleContext.multDamageReductionRatioOfConsecutiveAttacks(0.8, enemyUnit);
                    if (targetUnit.isWeaponSpecialRefined) {
                        targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.4, enemyUnit);
                    }
                }
                break;
            case Weapon.SplashyBucketPlus:
                {
                    targetUnit.battleContext.invalidatesReferenceLowerMit = true;
                }
                break;
        }
        for (let skillId of targetUnit.enumeratePassiveSkills()) {
            switch (skillId) {
                case PassiveB.BlackEagleRule:
                    if (!targetUnit.battleContext.initiatesCombat && targetUnit.snapshot.restHpPercentage >= 25) {
                        targetUnit.battleContext.multDamageReductionRatioOfFollowupAttack(0.8, enemyUnit);
                    }
                    break;
                case PassiveB.SeikishiNoKago:
                    if (isRangedWeaponType(enemyUnit.weaponType)) {
                        targetUnit.battleContext.multDamageReductionRatioOfConsecutiveAttacks(0.8, enemyUnit);
                    }
                    break;
                case PassiveS.RengekiBogyoKenYariOno3:
                    if (enemyUnit.weaponType == WeaponType.Sword ||
                        enemyUnit.weaponType == WeaponType.Lance ||
                        enemyUnit.weaponType == WeaponType.Axe) {
                        targetUnit.battleContext.multDamageReductionRatioOfConsecutiveAttacks(0.8, enemyUnit);
                    }
                    break;
                case PassiveS.RengekiBogyoYumiAnki3:
                    if (isWeaponTypeBow(enemyUnit.weaponType) ||
                        isWeaponTypeDagger(enemyUnit.weaponType)) {
                        targetUnit.battleContext.multDamageReductionRatioOfConsecutiveAttacks(0.8, enemyUnit);
                    }
                    break;
                case PassiveS.RengekiBogyoMado3:
                    if (isWeaponTypeTome(enemyUnit.weaponType)) {
                        targetUnit.battleContext.multDamageReductionRatioOfConsecutiveAttacks(0.8, enemyUnit);
                    }
                    break;
            }
        }
    }

    __setBothOfAtkDefSkillEffetToContextForEnemyUnit(atkUnit, defUnit) {
        if (atkUnit.hasPassiveSkill(PassiveB.Cancel3)) {
            if (atkUnit.snapshot.restHpPercentage >= 80) {
                defUnit.battleContext.cooldownCount = 1;
            }
        }
    }

    /// 実装の移植を楽にするために暫定的に用意
    __writeDamageCalcDebugLog(message) {
        this.writeDebugLog(message);
    }
}
