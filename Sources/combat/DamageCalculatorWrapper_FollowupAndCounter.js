if (typeof DamageCalculatorWrapper === "undefined") {
    throw new Error("DamageCalculatorWrapper.js must be loaded before this file");
}

DamageCalculatorWrapper.definePrototypeMethods({
    /**
     * @param {Unit} targetUnit
     * @param {Unit} enemyUnit
     * @param {boolean} isPrecombat
     */
    __calcFixedSpecialAddDamage(targetUnit, enemyUnit, isPrecombat = false) {
        {
            let damage = 0;
            for (let skillId of targetUnit.enumerateWeaponSkills()) {
                switch (BEAST_COMMON_SKILL_MAP.get(skillId)) {
                    case BeastCommonSkillType.Infantry2:
                        damage = 7;
                        break;
                    case BeastCommonSkillType.Infantry:
                        damage = 10;
                        break;
                    case BeastCommonSkillType.Infantry2IfRefined:
                        damage = targetUnit.isWeaponRefined ? 7 : 10;
                        break;
                }
            }
            if (targetUnit.isTransformed) {
                if (isPrecombat) {
                    targetUnit.battleContext.additionalDamageOfSpecial = damage;
                } else {
                    targetUnit.battleContext.additionalDamageOfSpecial += damage;
                }
            }
        }
        for (let skillId of targetUnit.enumerateSkills()) {
            switch (skillId) {
                case Weapon.HeiredForseti:
                    if (targetUnit.battleContext.restHpPercentage >= 25) {
                        let spd = DamageCalculatorWrapper.__getSpd(targetUnit, enemyUnit, isPrecombat);
                        let ratio = 0.2 + targetUnit.maxSpecialCount * 0.1;
                        if (isPrecombat) {
                            targetUnit.battleContext.additionalDamageOfSpecial = Math.trunc(spd * ratio);
                        } else {
                            targetUnit.battleContext.additionalDamageOfSpecial += Math.trunc(spd * ratio);
                        }
                    }
                    break;
                case Weapon.ImbuedKoma:
                    if (targetUnit.isWeaponSpecialRefined) {
                        let def = DamageCalculatorWrapper.__getDef(targetUnit, enemyUnit, isPrecombat);
                        if (isPrecombat) {
                            targetUnit.battleContext.additionalDamageOfSpecial = Math.trunc(def * 0.15);
                        } else {
                            targetUnit.battleContext.additionalDamageOfSpecial += Math.trunc(def * 0.15);
                        }
                    }
                    break;
                case PassiveB.SpecialSpiral4:
                    if (isPrecombat) {
                        targetUnit.battleContext.additionalDamageOfSpecial = 5;
                    } else {
                        targetUnit.battleContext.additionalDamageOfSpecial += 5;
                    }
                    break;
                case PassiveB.MoonlightBangle:
                case PassiveB.MoonlitBangleF: {
                    let ratio = 0.2 + targetUnit.maxSpecialCount * 0.1;
                    let def = isPrecombat ? enemyUnit.getDefInPrecombat() : enemyUnit.getDefInCombat();
                    if (isPrecombat) {
                        targetUnit.battleContext.additionalDamageOfSpecial = Math.trunc(def * ratio);
                    } else {
                        targetUnit.battleContext.additionalDamageOfSpecial += Math.trunc(def * ratio);
                    }
                }
                    break;
                case PassiveB.RunaBracelet: {
                    let def = isPrecombat ? enemyUnit.getDefInPrecombat() : enemyUnit.getDefInCombat();
                    if (isPrecombat) {
                        targetUnit.battleContext.additionalDamageOfSpecial = Math.trunc(def * 0.5);
                    } else {
                        targetUnit.battleContext.additionalDamageOfSpecial += Math.trunc(def * 0.5);
                    }
                }
                    break;
                case PassiveB.Bushido:
                    if (isPrecombat) {
                        targetUnit.battleContext.additionalDamageOfSpecial = 10;
                    } else {
                        targetUnit.battleContext.additionalDamageOfSpecial += 10;
                    }
                    break;
                case PassiveB.Ikari3:
                    if (targetUnit.restHpPercentage <= 75) {
                        if (isPrecombat) {
                            targetUnit.battleContext.additionalDamageOfSpecial = 10;
                        } else {
                            targetUnit.battleContext.additionalDamageOfSpecial += 10;
                        }
                    }
                    break;
                case PassiveB.Spurn3:
                case PassiveB.Spurn4:
                    if (targetUnit.restHpPercentage <= 75) {
                        if (isPrecombat) {
                            targetUnit.battleContext.additionalDamageOfSpecial = 5;
                        } else {
                            targetUnit.battleContext.additionalDamageOfSpecial += 5;
                        }
                    }
                    break;
                case Weapon.FumingFreikugel:
                    // 条件(weaponSkillCondSatisfied)は戦闘中以降に有効になるので必要はないが念の為範囲奥義を除くためにbreakする
                    if (isPrecombat) break;
                    if (targetUnit.battleContext.weaponSkillCondSatisfied) {
                        let spd = targetUnit.getSpdInCombat(enemyUnit);
                        let ratio = 0.2 + 0.1 * targetUnit.maxSpecialCount;
                        targetUnit.battleContext.additionalDamageOfSpecial += Math.trunc(spd * ratio);
                    }
                    break;
                case Weapon.SisterlyWarAxe:
                case Weapon.DrybladeLance:
                    if (targetUnit.battleContext.restHpPercentage >= 25) {
                        let ratio = 0.2 + targetUnit.maxSpecialCount * 0.1;
                        let spd = DamageCalculatorWrapper.__getSpd(targetUnit, enemyUnit, isPrecombat);
                        if (isPrecombat) {
                            targetUnit.battleContext.additionalDamageOfSpecial = Math.trunc(spd * ratio);
                        } else {
                            targetUnit.battleContext.additionalDamageOfSpecial += Math.trunc(spd * ratio);
                        }
                    }
                    break;
                case Weapon.ManatsuNoBreath:
                    if (targetUnit.isWeaponSpecialRefined) {
                        if (this.__isThereAllyInSpecifiedSpaces(targetUnit, 3)) {
                            let ratio = 0.2 + targetUnit.maxSpecialCount * 0.1;
                            let res = isPrecombat ? enemyUnit.getResInPrecombat() : enemyUnit.getResInCombat();
                            if (isPrecombat) {
                                targetUnit.battleContext.additionalDamageOfSpecial = Math.trunc(res * ratio);
                            } else {
                                targetUnit.battleContext.additionalDamageOfSpecial += Math.trunc(res * ratio);
                            }
                        }
                    }
                    break;
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
                    if (isPrecombat) {
                        targetUnit.battleContext.additionalDamageOfSpecial = 10;
                    } else {
                        targetUnit.battleContext.additionalDamageOfSpecial += 10;
                    }
                    break;
                case Weapon.Shamsir:
                    if (isPrecombat) {
                        targetUnit.battleContext.additionalDamageOfSpecial = 7;
                    } else {
                        targetUnit.battleContext.additionalDamageOfSpecial += 7;
                    }
                    break;
                case Weapon.RunaNoEiken:
                case Weapon.Otokureru:
                case Weapon.MumeiNoIchimonNoKen:
                case Weapon.SyaniNoSeisou:
                case Weapon.DevilAxe:
                    if (targetUnit.isWeaponSpecialRefined) {
                        if (isPrecombat) {
                            targetUnit.battleContext.additionalDamageOfSpecial = 10;
                        } else {
                            targetUnit.battleContext.additionalDamageOfSpecial += 10;
                        }
                    }
                    break;
            }
        }
    },

    __getDamageReductionRatio(skillId, atkUnit, defUnit) {
        switch (skillId) {
            case Weapon.DreamHorn:
                if (defUnit.battleContext.restHpPercentage >= 25) {
                    return 0.3;
                }
                break;
            case Weapon.HarukazeNoBreath:
                if (defUnit.isWeaponSpecialRefined) {
                    if (atkUnit.battleContext.initiatesCombat ||
                        atkUnit.battleContext.restHpPercentage >= 75) {
                        let resDiff = defUnit.getEvalResInCombat(atkUnit) - atkUnit.getEvalResInCombat(defUnit);
                        if (resDiff > 0) {
                            let percentage = resDiff * 4;
                            if (percentage > 40) {
                                percentage = 40;
                            }

                            if (this.isLogEnabled) this.__writeDamageCalcDebugLog("ダメージ" + percentage + "%軽減");
                            return percentage / 100.0;
                        }
                    }
                }
                break;
            case Weapon.VoidTome:
                if (defUnit.isWeaponSpecialRefined) {
                    if (atkUnit.getDefInPrecombat() >= 35 ||
                        atkUnit.getResInPrecombat() >= 35 ||
                        atkUnit.hasNegativeStatusEffect()) {
                        return Math.min(Math.max(atkUnit.getDefInPrecombat(), atkUnit.getResInPrecombat()), 50) / 100.0;
                    }
                }
                break;
            case Weapon.BaraNoYari:
                if (defUnit.isWeaponRefined) {
                    let diff = defUnit.getEvalAtkInCombat(atkUnit) - atkUnit.getEvalAtkInCombat(defUnit);
                    return Math.min(Math.max(diff * 0.02, 0), 0.4);
                }
                break;
            case Weapon.FreebladesEdge:
                return 0.3;
            case PassiveB.GuardBearing4:
                if (atkUnit.battleContext.initiatesCombat &&
                    !defUnit.isOneTimeActionActivatedForPassiveB) {
                    return 0.6;
                } else {
                    return 0.3;
                }
            case Weapon.LoneWolf:
                if (defUnit.battleContext.restHpPercentage >= 25) {
                    return 0.3;
                }
                break;
            case Weapon.MaskedLance:
                if (defUnit.isWeaponSpecialRefined) {
                    if (defUnit.battleContext.restHpPercentage >= 25) {
                        return DamageCalculationUtility.getResDodgeDamageReductionRatio(atkUnit, defUnit);
                    }
                }
                break;
            case Weapon.ValiantWarAxe:
                if (defUnit.battleContext.restHpPercentage >= 25) {
                    return 0.3;
                }
                break;
            case Weapon.Queensblade:
                if (defUnit.battleContext.restHpPercentage >= 25) {
                    return 0.3;
                }
                break;
            case Weapon.MonarchBlade:
                if (defUnit.battleContext.restHpPercentage >= 25) {
                    return DamageCalculationUtility.getDodgeDamageReductionRatio(atkUnit, defUnit);
                }
                break;
            case Weapon.Liberation:
                if (defUnit.battleContext.restHpPercentage >= 25) {
                    return DamageCalculationUtility.getDodgeDamageReductionRatio(atkUnit, defUnit);
                }
                break;
            case Weapon.JoyousTome: {
                let pred = unit => unit.hpPercentage >= 50;
                let count = this.__countAlliesWithinSpecifiedSpaces(defUnit, 3, pred);
                if (count > 0) {
                    let percentage = Math.min(count * 15, 45);
                    if (this.isLogEnabled) this.__writeDamageCalcDebugLog(`ダメージ${percentage}%軽減`);
                    return percentage / 100.0;
                }
            }
                break;
            case PassiveA.AsherasChosenPlus:
                if (this.__isThereAllyExceptDragonAndBeastWithin1Space(defUnit) === false ||
                    defUnit.battleContext.restHpPercentage >= 75) {
                    let resDiff = defUnit.getEvalResInCombat(atkUnit) - atkUnit.getEvalResInCombat(defUnit);
                    if (resDiff > 0) {
                        let percentage = Math.min(resDiff * 4, 40);
                        if (this.isLogEnabled) this.__writeDamageCalcDebugLog(`ダメージ${percentage}%軽減`);
                        return percentage / 100.0;
                    }
                }
                break;
            case Weapon.FangOfFinality: {
                let count = this.__countAlliesWithinSpecifiedSpaces(atkUnit, 3) + 1;
                let percentage = Math.min(count * 20, 60);
                return percentage / 100.0;
            }
            case Weapon.ShiseiNaga:
                if (defUnit.battleContext.weaponSkillCondSatisfied) {
                    let resDiff = defUnit.getEvalResInCombat(atkUnit) - atkUnit.getEvalResInCombat(defUnit);
                    if (resDiff > 0) {
                        let percentage = Math.min(resDiff * 4, 40);
                        if (this.isLogEnabled) this.__writeDamageCalcDebugLog(`ダメージ${percentage}%軽減`);
                        return percentage / 100.0;
                    }
                }
                break;
            case Weapon.WandererBlade:
                if (defUnit.isWeaponSpecialRefined && defUnit.battleContext.restHpPercentage >= 25) {
                    return DamageCalculationUtility.getDodgeDamageReductionRatio(atkUnit, defUnit);
                }
                break;
            case PassiveB.Chivalry:
                return atkUnit.battleContext.restHpPercentage * 0.5 / 100;
            case Weapon.Mafu:
                if (defUnit.isWeaponSpecialRefined) {
                    if (defUnit.battleContext.restHpPercentage >= 25 && !isWeaponTypeTome(atkUnit.weaponType)) {
                        return 0.3;
                    }
                }
                break;
            case PassiveB.AssuredRebirth: {
                let diff = defUnit.getEvalResInCombat(atkUnit) - atkUnit.getEvalResInCombat(defUnit);
                let percentage = 0;
                let count = 0;
                for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(defUnit, 3)) {
                    if (unit.weaponType === WeaponType.Staff || isWeaponTypeBreath(unit.weaponType)) {
                        count++;
                    }
                }
                percentage += count * 20;
                if (diff > 0) {
                    let p = Math.min(diff * 4, 40);
                    percentage += p;
                }
                percentage = Math.min(percentage, 60);
                return percentage / 100.0;
            }
            case Weapon.WindyWarTome:
                if (atkUnit.battleContext.initiatesCombat || atkUnit.battleContext.restHpPercentage >= 75) {
                    let diff = defUnit.getEvalResInCombat(atkUnit) - atkUnit.getEvalResInCombat(defUnit);
                    if (diff > 0) {
                        let percentage = diff * 4;
                        if (percentage > 40) {
                            percentage = 40;
                        }

                        if (this.isLogEnabled) this.__writeDamageCalcDebugLog("ダメージ" + percentage + "%軽減");
                        return percentage / 100.0;
                    }
                }
                break;
            case Special.VitalAstra:
                if (defUnit.isSpecialCharged) {
                    return DamageCalculationUtility.getDodgeDamageReductionRatio(atkUnit, defUnit, 3, 30);
                }
                break;
            case Weapon.HurricaneDagger:
                if (defUnit.isWeaponSpecialRefined) {
                    if (defUnit.battleContext.restHpPercentage >= 25) {
                        return DamageCalculationUtility.getDodgeDamageReductionRatio(atkUnit, defUnit, 3, 30);
                    }
                }
                break;
            case Weapon.RaikenJikurinde:
                if (defUnit.isWeaponSpecialRefined) {
                    if (defUnit.battleContext.restHpPercentage >= 25) {
                        return DamageCalculationUtility.getDodgeDamageReductionRatio(atkUnit, defUnit, 4, 40);
                    }
                }
                break;
            case Weapon.LilacJadeBreath:
                if (atkUnit.battleContext.initiatesCombat || atkUnit.battleContext.restHpPercentage === 100) {
                    return 0.4;
                }
                break;
            case Weapon.GiltGoblet:
                if ((atkUnit.battleContext.initiatesCombat || atkUnit.battleContext.restHpPercentage === 100) &&
                    isWeaponTypeTome(atkUnit.weaponType)) {
                    return 0.5;
                }
                break;
            case Weapon.Roputous:
                if (defUnit.isWeaponRefined) {
                    if (!atkUnit.isWeaponEffectiveAgainst(EffectiveType.Dragon)) {
                        let resDiff = defUnit.getEvalResInCombat(atkUnit) - atkUnit.getEvalResInCombat(defUnit);
                        if (resDiff > 0) {
                            let percentage = resDiff * 4;
                            if (percentage > 40) {
                                percentage = 40;
                            }

                            if (this.isLogEnabled) this.__writeDamageCalcDebugLog("ダメージ" + percentage + "%軽減");
                            return percentage / 100.0;
                        }
                    }
                }
                break;
            case PassiveB.TrueDragonWall: {
                let resDiff = defUnit.getEvalResInCombat(atkUnit) - atkUnit.getEvalResInCombat(defUnit);
                let r = 0;
                let maxPercentage = 0;
                if (!defUnit.isOneTimeActionActivatedForPassiveB) {
                    r = 6;
                    maxPercentage = 60;
                } else {
                    r = 4;
                    maxPercentage = 40;
                }
                if (resDiff > 0) {
                    let percentage = resDiff * r;
                    percentage = Math.min(percentage, maxPercentage);
                    if (this.isLogEnabled) this.__writeDamageCalcDebugLog("ダメージ" + percentage + "%軽減");
                    return percentage / 100.0;
                }
                break;
            }
            case Weapon.TwinDivinestone:
            case PassiveB.NewDivinity:
                if (defUnit.battleContext.restHpPercentage >= 25) {
                    let resDiff = defUnit.getEvalResInCombat(atkUnit) - atkUnit.getEvalResInCombat(defUnit);
                    if (resDiff > 0) {
                        let percentage = resDiff * 4;
                        if (percentage > 40) {
                            percentage = 40;
                        }

                        if (this.isLogEnabled) this.__writeDamageCalcDebugLog("ダメージ" + percentage + "%軽減");
                        return percentage / 100.0;
                    }
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

                        if (this.isLogEnabled) this.__writeDamageCalcDebugLog("ダメージ" + percentage + "%軽減");
                        return percentage / 100.0;
                    }
                }
                break;
            case Weapon.BrightmareHorn:
                if (defUnit.battleContext.restHpPercentage >= 25) {
                    {
                        let diff = defUnit.getEvalSpdInCombat(atkUnit) - atkUnit.getEvalSpdInCombat(defUnit);
                        if (diff > 0) {
                            let percentage = diff * 4;
                            if (percentage > 40) {
                                percentage = 40;
                            }

                            if (this.isLogEnabled) this.__writeDamageCalcDebugLog(`武器スキル(${defUnit.weaponInfo.name})によりダメージ${percentage}%軽減`);
                            return percentage / 100.0;
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

                        if (this.isLogEnabled) this.__writeDamageCalcDebugLog(`武器スキル(${defUnit.weaponInfo.name})によりダメージ${percentage}%軽減`);
                        return percentage / 100.0;
                    }
                }
                break;
            case PassiveB.MoonTwinWing:
                if (defUnit.battleContext.restHpPercentage >= 25) {
                    return DamageCalculationUtility.getDodgeDamageReductionRatio(atkUnit, defUnit, 4, 40);
                }
                break;
            case Weapon.NinissIceLance:
                if (defUnit.isWeaponSpecialRefined) {
                    if (defUnit.battleContext.initiatesCombat || this.__isThereAllyIn2Spaces(defUnit)) {
                        return DamageCalculationUtility.getDodgeDamageReductionRatio(atkUnit, defUnit, 4, 40);
                    }
                }
                break;
            case PassiveB.BeastSense4:
            case PassiveB.Bushido2:
            case PassiveB.Velocity3:
            case PassiveB.Frenzy3:
            case PassiveB.Spurn3:
            case PassiveB.KaihiIchigekiridatsu3:
            case PassiveB.KaihiTatakikomi3:
                return DamageCalculationUtility.getDodgeDamageReductionRatio(atkUnit, defUnit, 4, 40);
            case PassiveB.Spurn4:
            case PassiveB.Repel4:
            case PassiveB.CloseCall4:
                return DamageCalculationUtility.getDodgeDamageReductionRatio(atkUnit, defUnit, 5, 50);
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

                        if (this.isLogEnabled) this.__writeDamageCalcDebugLog(`蒼き獅子王によりダメージ${percentage}%軽減(守備の差 ${defUnitDef}-${atkUnitDef}=${diff})`);
                        return percentage / 100.0;
                    }
                }
                break;
        }

        return 0;
    },

    __applyDamageReductionRatio(atkUnit, defUnit) {
        for (let func of defUnit.battleContext.getDamageReductionRatioFuncs) {
            let ratio = func(atkUnit, defUnit);
            if (ratio > 0) {
                defUnit.battleContext.addDamageReductionRatio(ratio);
            }
        }

        for (let skillId of defUnit.enumerateSkills()) {
            let ratio = this.__getDamageReductionRatio(skillId, atkUnit, defUnit);
            if (ratio > 0) {
                defUnit.battleContext.addDamageReductionRatio(ratio);
            }
        }

        if (defUnit.hasStatusEffect(StatusEffectType.Dodge)) {
            let ratio = DamageCalculationUtility.getDodgeDamageReductionRatio(atkUnit, defUnit, 4, 40);
            if (ratio > 0) {
                defUnit.battleContext.addDamageReductionRatio(ratio);
            }
        }
    },

    __examinesCanFollowupAttack(atkUnit, defUnit) {
        if (this.isLogEnabled) this.__writeDamageCalcDebugLog(`${atkUnit.getNameWithGroup()}の速さによる追撃評価:`);
        this.__logSpdInCombat(atkUnit, defUnit, TabChar);
        this.__logSpdInCombat(defUnit, atkUnit, TabChar);
        if (this.isLogEnabled) {
            this.__writeDamageCalcDebugLog(`${TabChar}${atkUnit.nameWithGroup}の速さの追撃条件: ${atkUnit.battleContext.additionalSpdDifferenceNecessaryForFollowupAttack}`);
            this.__writeDamageCalcDebugLog(`${TabChar}${defUnit.nameWithGroup}の速さの追撃条件: ${defUnit.battleContext.additionalSpdDifferenceNecessaryForFollowupAttack}`);
        }
        let result = DamageCalculationUtility.examinesCanFollowupAttack(atkUnit, defUnit);
        if (result) {
            if (this.isLogEnabled) this.__writeDamageCalcDebugLog(TabChar + atkUnit.getNameWithGroup() + "は速さが5以上高いので追撃可能");
        } else {
            if (this.isLogEnabled) this.__writeDamageCalcDebugLog(TabChar + atkUnit.getNameWithGroup() + "は速さが足りないので追撃不可");
        }
        return result;
    },

    /**
     * @param {Unit} atkUnit
     * @param {Unit} defUnit
     * @param {DamageCalcEnv} damageCalcEnv
     * @returns {boolean}
     * @private
     */
    __examinesCanFollowupAttackForAttacker(atkUnit, defUnit, damageCalcEnv) {
        if (this.isLogEnabled) this.__writeDamageCalcDebugLog(`${atkUnit.getNameWithGroup()}の追撃評価 ------`);
        let [followUpInc, followUpDec] =
            this.getFollowupAttackPriorityForBoth(atkUnit, defUnit, damageCalcEnv);
        {
            for (let skillId of atkUnit.enumerateSkills()) {
                switch (skillId) {
                    case Weapon.DarkSpikesT:
                        if (atkUnit.battleContext.restHpPercentage <= 99) {
                            followUpInc++;
                        }
                        break;
                    case Weapon.Jikumunt:
                        if (atkUnit.battleContext.restHpPercentage >= 90) {
                            followUpInc++;
                        }
                        break;
                    case Weapon.SoulCaty:
                        if (atkUnit.isWeaponSpecialRefined) {
                            if (atkUnit.battleContext.restHpPercentage <= 75 && this.canCounterAttack(atkUnit, defUnit)) {
                                followUpInc++;
                            }
                        }
                        break;
                    case Weapon.RohyouNoKnife:
                        if ((defUnit.isMeleeWeaponType() || atkUnit.isWeaponRefined) && this.canCounterAttack(atkUnit, defUnit)) {
                            followUpInc++;
                        }
                        break;
                    case PassiveB.BoldFighter3:
                        followUpInc++; break;
                    case PassiveB.TsuigekiTaikeiKisu3:
                        if (this.isOddTurn) {
                            followUpInc++;
                        }
                        break;
                    case PassiveB.EvenFollowUp3:
                        if (this.isEvenTurn) {
                            followUpInc++;
                        }
                        break;
                    case PassiveB.Sashitigae3:
                        if (atkUnit.battleContext.restHpPercentage <= 50 && this.canCounterAttack(atkUnit, defUnit)) {
                            followUpInc++;
                        }
                        break;
                }
            }
        }

        {
            for (let skillId of atkUnit.enumerateSkills()) {
                switch (skillId) {
                    case PassiveB.Kazenagi3:
                        followUpDec--;
                        break;
                    case PassiveB.Mizunagi3:
                        followUpDec--;
                        break;
                }
            }
        }

        damageCalcEnv.combatResult.atkUnitFollowUpPriorityInc = followUpInc;
        damageCalcEnv.combatResult.atkUnitFollowUpPriorityDec = followUpDec;

        // 追撃無効の処理
        // TODO: 符号がわかりにくいので修正する(decも正の値に)
        if (defUnit.battleContext.invalidatesAbsoluteFollowupAttack) {
            followUpInc = 0;
        }
        if (atkUnit.battleContext.invalidatesInvalidationOfFollowupAttack) {
            followUpDec = 0;
        }
        let followupAttackPriority = followUpInc + followUpDec;
        if (followupAttackPriority < 0) {
            // 追撃不可を受けた
            if (this.isLogEnabled) this.__writeDamageCalcDebugLog(atkUnit.getNameWithGroup() + "はスキル効果により追撃不可");
            return false;
        } else if (followupAttackPriority > 0) {
            // 絶対追撃発動
            if (this.isLogEnabled) this.__writeDamageCalcDebugLog(atkUnit.getNameWithGroup() + "はスキル効果により絶対追撃");
            return true;
        } else {
            // 速さ勝負
            return this.__examinesCanFollowupAttack(atkUnit, defUnit);
        }
    },

    /**
     * @param {Unit} atkUnit
     * @param {Unit} defUnit
     * @param {DamageCalcEnv} damageCalcEnv
     * @returns {boolean}
     * @private
     */
    __examinesCanFollowupAttackForDefender(atkUnit, defUnit, damageCalcEnv) {
        if (this.isLogEnabled) this.__writeDamageCalcDebugLog(`${defUnit.getNameWithGroup()}の追撃評価 ------`);
        let [followUpInc, followUpDec] =
            this.getFollowupAttackPriorityForBoth(defUnit, atkUnit, damageCalcEnv);
        {
            for (let skillId of [defUnit.passiveB, defUnit.passiveS]) {
                switch (skillId) {
                    case PassiveB.SlickFighter3:
                        if (defUnit.battleContext.restHpPercentage >= 25) {
                            followUpInc++;
                        }
                        break;
                    case PassiveB.BlueLionRule:
                        followUpInc++;
                        break;
                    case PassiveB.HolyWarsEnd:
                        if (defUnit.battleContext.restHpPercentage >= 50) {
                            followUpInc++;
                        }
                        break;
                    case PassiveB.QuickRiposte1:
                        if (defUnit.battleContext.restHpPercentage >= 90) {
                            followUpInc++;
                        }
                        break;
                    case PassiveB.QuickRiposte2:
                        if (defUnit.battleContext.restHpPercentage >= 80) {
                            followUpInc++;
                        }
                        break;
                    case PassiveB.QuickRiposte3:
                        if (defUnit.battleContext.restHpPercentage >= 70) {
                            // this.writeDebugLogLine("HP" + defUnit.battleContext.restHpPercentage + "%で切り返し発動、" + defUnit.getNameWithGroup() + "は絶対追撃");
                            followUpInc++;
                        }
                        break;
                    case PassiveB.QuickRiposte4:
                        if (defUnit.battleContext.restHpPercentage >= 25) {
                            followUpInc++;
                        }
                        break;
                    case PassiveB.DragonsIre3:
                        if (defUnit.battleContext.restHpPercentage >= 50) {
                            followUpInc++;
                        }
                        break;
                    case PassiveB.VengefulFighter3:
                        if (defUnit.battleContext.restHpPercentage >= 50) {
                            followUpInc++;
                        }
                        break;
                }
            }
            switch (defUnit.weapon) {
                case Weapon.Marute:
                    if (defUnit.isWeaponRefined) {
                        if (defUnit.battleContext.restHpPercentage >= 25) {
                            followUpInc++;
                        }
                    }
                    else if (defUnit.battleContext.restHpPercentage >= 50) {
                        followUpInc++;
                    }
                    break;

                case Weapon.Arumazu:
                    if (defUnit.battleContext.restHpPercentage >= 80) {
                        followUpInc++;
                    }
                    break;
                case Weapon.HuinNoKen:
                case Weapon.MoumokuNoYumi:
                    if (defUnit.isWeaponSpecialRefined) {
                        if (defUnit.battleContext.restHpPercentage >= 50) {
                            followUpInc++;
                        }
                    }
                    break;
            }
        }

        {
            for (let skillId of atkUnit.enumerateSkills()) {
                switch (skillId) {
                    case Weapon.InstantBowPlus:
                    case Weapon.InstantSwordPlus:
                    case Weapon.InstantLancePlus:
                    case Weapon.InstantAxePlus:
                        followUpDec--;
                        break;
                    case Weapon.Rifia:
                        if (!atkUnit.isWeaponRefined) {
                            if (atkUnit.battleContext.restHpPercentage >= 50) {
                                followUpDec--;
                            }
                        }
                        break;
                    case Weapon.HewnLance:
                        if (atkUnit.isWeaponSpecialRefined) {
                            followUpDec--;
                        }
                        break;
                    case Weapon.KarenNoYumi:
                        if (atkUnit.isWeaponSpecialRefined) {
                            followUpDec--;
                        }
                        break;
                    case Weapon.BlazingDurandal:
                        if (isWeaponSpecialRefined(atkUnit.weaponRefinement)) {
                            followUpDec--;
                        }
                        break;
                    case Weapon.MasterBow:
                        if (atkUnit.groupId === UnitGroupType.Ally) {
                            followUpDec--;
                        }
                        break;
                    case Weapon.AijouNoHanaNoYumiPlus:
                    case Weapon.BukeNoSteckPlus:
                        followUpDec--;
                        break;
                    case PassiveA.KishinKongoNoSyungeki:
                    case PassiveA.KishinMeikyoNoSyungeki:
                    case PassiveA.SteadyImpact:
                    case PassiveA.SwiftImpact:
                        followUpDec--;
                        break;
                    case PassiveB.TsuigekiTaikeiKisu3:
                        if (this.isOddTurn) {
                            followUpDec--;
                        }
                        break;
                    case PassiveB.EvenFollowUp3:
                        if (this.isEvenTurn) {
                            followUpDec--;
                        }
                        break;
                }
            }
        }

        damageCalcEnv.combatResult.defUnitFollowUpPriorityInc = followUpInc;
        damageCalcEnv.combatResult.defUnitFollowUpPriorityDec = followUpDec;

        // 追撃無効の処理
        // TODO: 符号がわかりにくいので修正する(decも正の値に)
        if (atkUnit.battleContext.invalidatesAbsoluteFollowupAttack) {
            followUpInc = 0;
        }
        if (defUnit.battleContext.invalidatesInvalidationOfFollowupAttack) {
            followUpDec = 0;
        }
        let followupAttackPriority = followUpInc + followUpDec;
        if (followupAttackPriority < 0) {
            // 追撃不可を受けた
            if (this.isLogEnabled) this.__writeDamageCalcDebugLog(defUnit.getNameWithGroup() + "はスキル効果により追撃不可");
            return false;
        } else if (followupAttackPriority > 0) {
            // 絶対追撃発動
            if (this.isLogEnabled) this.__writeDamageCalcDebugLog(defUnit.getNameWithGroup() + "はスキル効果により絶対追撃");
            return true;
        } else {
            // 速さ勝負
            return this.__examinesCanFollowupAttack(defUnit, atkUnit);
        }
    },

    canCounterAttack(atkUnit, defUnit, calcPotentialDamage = true, damageType = DamageType.PotentialDamage) {
        return this.__examinesCanCounterattackBasically(atkUnit, defUnit, calcPotentialDamage, damageType)
            && !this.__canDisableCounterAttack(atkUnit, defUnit);
    },

    // 反撃不可ならばtrueを反撃不可を無効にするならfalseを返す
    __canDisableCounterAttack(atkUnit, defUnit) {
        // defUnitが見切り・反撃効果を持っている場合(falseを返す場合)
        if (defUnit.battleContext.nullCounterDisrupt) {
            return false;
        }
        for (let skillId of defUnit.enumerateSkills()) {
            switch (skillId) {
                case Weapon.IceBoundBrand:
                    if (isRangedWeaponType(atkUnit.weaponType)) {
                        return false;
                    }
                    break;
                case Weapon.Queensblade:
                    return false;
                case Weapon.BrilliantStarlight:
                    if (defUnit.battleContext.restHpPercentage >= 25) {
                        return false;
                    }
                    break;
                case PassiveB.MikiriHangeki3:
                case PassiveB.NullCDisrupt4:
                    return false;
                case PassiveB.MysticBoost4:
                    if (atkUnit.weaponType === WeaponType.Staff) {
                        return false;
                    }
                    break;
                case Weapon.NiflsBite:
                    if (this.__isThereAllyIn2Spaces(defUnit) && atkUnit.isRangedWeaponType()) {
                        return false;
                    }
                    break;
            }
        }
        for (let skillId of atkUnit.enumerateSkills()) {
            switch (skillId) {
                case Weapon.Queensblade:
                    return false;
            }
        }

        if (defUnit.hasStatusEffect(StatusEffectType.CounterattacksDisrupted)) {
            return true;
        }

        if (atkUnit.battleContext.invalidatesCounterattack) {
            return true;
        }

        for (let skillId of atkUnit.enumerateSkills()) {
            switch (skillId) {
                case Weapon.KnightlyManner:
                    if (!isWeaponTypeBow(defUnit.weaponType) &&
                        !isWeaponTypeDagger(defUnit.weaponType)) {
                        return true;
                    }
                    break;
                case Weapon.FujinRaijinYumi:
                    if (atkUnit.battleContext.restHpPercentage >= 25) {
                        if (DamageCalculationUtility.calcAttackerTriangleAdvantage(atkUnit, defUnit) === TriangleAdvantage.Advantageous ||
                            atkUnit.getEvalSpdInCombat(defUnit) > defUnit.getEvalSpdInCombat(atkUnit)) {
                            return true;
                        }
                    }
                    break;
                case Weapon.ZekkaiNoSoukyu:
                    if (atkUnit.isWeaponSpecialRefined) {
                        if (atkUnit.battleContext.restHpPercentage >= 25) {
                            if (defUnit.isMeleeWeaponType() &&
                                atkUnit.getEvalSpdInCombat(defUnit) >= defUnit.getEvalSpdInCombat(atkUnit) + 5) {
                                return true;
                            }
                        }
                    }
                    break;
                case Weapon.LunaArc:
                    if (atkUnit.isWeaponSpecialRefined) {
                        if (defUnit.isPhysicalAttacker() &&
                            atkUnit.getEvalSpdInCombat(defUnit) >= defUnit.getEvalSpdInCombat(atkUnit) + 5) {
                            return true;
                        }
                    }
                    break;
                case Weapon.SoothingScent:
                    if (atkUnit.battleContext.weaponSkillCondSatisfied) {
                        if (atkUnit.getEvalSpdInCombat(defUnit) >= defUnit.getEvalSpdInCombat(atkUnit) + 1) {
                            return true;
                        }
                    }
                    break;
                case Weapon.ChilledBreath:
                    if (atkUnit.battleContext.initiatesCombat || this.__isThereAllyIn2Spaces(atkUnit)) {
                        if (atkUnit.getEvalSpdInCombat(defUnit) >= defUnit.getEvalSpdInCombat(atkUnit) + 5) {
                            return true;
                        }
                    }
                    break;
                case Weapon.Mafu:
                    if (atkUnit.isWeaponSpecialRefined) {
                        if (atkUnit.battleContext.restHpPercentage >= 25 && !isWeaponTypeTome(defUnit.weaponType)) {
                            return true;
                        }
                    }
                    break;
                case Weapon.AdroitWarTome:
                    if (atkUnit.battleContext.restHpPercentage >= 25) {
                        if (atkUnit.getEvalResInCombat(defUnit) >= defUnit.getEvalResInCombat(atkUnit) + 5) {
                            if (isPhysicalWeaponType(defUnit.weaponType)) {
                                return true;
                            }
                        }
                    }
                    break;
                case Weapon.QuickMulagir:
                    if (atkUnit.getEvalSpdInCombat(defUnit) >= defUnit.getEvalSpdInCombat(atkUnit) + 5) {
                        return true;
                    }
                    break;
                case Weapon.BrightShellEgg:
                    if (atkUnit.hasPositiveStatusEffect(defUnit) || defUnit.hasNegativeStatusEffect()) {
                        let amount = atkUnit.getBuffTotalInCombat(defUnit) + Math.abs(defUnit.getDebuffTotalInCombat());
                        if (amount >= 18) {
                            return true;
                        }
                    }
                    break;
                case Weapon.BladeOfJehanna:
                    if (atkUnit.battleContext.restHpPercentage >= 25) {
                        const isCross = atkUnit.posX === defUnit.posX || atkUnit.posY === defUnit.posY;
                        if (isCross) {
                            return true;
                        }
                    }
                    break;
                case Weapon.RyukenFalcion:
                    if (atkUnit.isWeaponSpecialRefined) {
                        if (atkUnit.battleContext.restHpPercentage >= 25 && isPhysicalWeaponType(defUnit.weaponType)) {
                            if (atkUnit.getEvalSpdInCombat() >= defUnit.getSpdInCombat() + 1) {
                                return true;
                            }
                        }
                    }
                    break;
                case Weapon.Nizuheggu:
                    if (atkUnit.isWeaponSpecialRefined) {
                        if (isWeaponTypeTom(defUnit.weaponType) || isWeaponTypeBreath(defUnit.weaponType)) {
                            return true;
                        }
                    }
                    break;
                case Weapon.SnipersBow:
                    if (atkUnit.isWeaponSpecialRefined) {
                        if (atkUnit.battleContext.restHpPercentage >= 50
                            && this.__isTherePartnerInSpace2(atkUnit)
                        ) {
                            return true;
                        }
                    }
                    break;
                case Weapon.DeathlyDagger:
                    if (atkUnit.isWeaponSpecialRefined) {
                        if (isWeaponTypeTome(defUnit.weaponType)) {
                            return true;
                        }
                    }
                    break;
                case PassiveA.LawsOfSacae2:
                    if (atkUnit.battleContext.initiatesCombat || this.__isThereAllyInSpecifiedSpaces(atkUnit, 2)) {
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
        }

        // 反撃不可
        let atkWeaponInfo = atkUnit.weaponInfo;
        let passiveBInfo = atkUnit.passiveBInfo;
        if ((atkWeaponInfo != null && atkWeaponInfo.disableCounterattack)
            || (passiveBInfo != null && passiveBInfo.disableCounterattack)
            || (atkUnit.weaponRefinement === WeaponRefinementType.DazzlingStaff)
            || (atkUnit.passiveB === PassiveB.SacaesBlessing
                && (defUnit.weaponType === WeaponType.Sword || defUnit.weaponType === WeaponType.Lance || defUnit.weaponType === WeaponType.Axe))
            || (atkUnit.hasPassiveSkill(PassiveB.Kazenagi3)
                && atkUnit.getEvalSpdInCombat(defUnit) > defUnit.getEvalSpdInCombat(atkUnit)
                && isPhysicalWeaponType(defUnit.weaponType))
            || (atkUnit.hasPassiveSkill(PassiveB.Mizunagi3)
                && atkUnit.getEvalSpdInCombat(defUnit) > defUnit.getEvalSpdInCombat(atkUnit)
                && !isPhysicalWeaponType(defUnit.weaponType))
            || (atkUnit.passiveB === PassiveB.FuinNoTate && isWeaponTypeBreath(defUnit.weaponType))
            || (atkUnit.passiveB === PassiveB.BindingShield2 &&
                (isWeaponTypeBreath(defUnit.weaponType) ||
                    atkUnit.getEvalSpdInCombat() >= defUnit.getEvalSpdInCombat() + 5))
        ) {
            return true;
        }
        return false;
    },

    __examinesCanCounterattackBasically(atkUnit, defUnit, calcPotentialDamage, damageType) {
        if (!defUnit.hasWeapon) {
            return false;
        }

        for (let skillId of defUnit.enumerateSkills()) {
            if (defUnit.isTransformed &&
                BEAST_COMMON_SKILL_MAP.has(skillId) &&
                BEAST_COMMON_SKILL_MAP.get(skillId) === BeastCommonSkillType.Armor) {
                return true;
            }
        }

        if (defUnit.battleContext.canCounterattackToAllDistance) {
            return true;
        }

        if (atkUnit.isStyleActive) {
            let env = new DamageCalculatorWrapperEnv(this, atkUnit, defUnit, calcPotentialDamage);
            env.setName('スタイル時に反撃可能を受ける').setLogLevel(getSkillLogLevel()).setDamageType(damageType);
            if (SUFFERS_COUNTERATTACK_DURING_STYLE_HOOKS.evaluateSomeWithUnit(atkUnit, env)) {
                return true;
            }
        } else {
            if (atkUnit.attackRange === defUnit.attackRange) {
                return true;
            }
        }

        // 相手の武器種による全距離反撃
        if (atkUnit.isRangedWeaponType()) {
            for (let skillId of defUnit.enumerateSkills()) {
                switch (skillId) {
                    case PassiveA.DistantCounter:
                    case PassiveA.OstiasCounter:
                        return true;
                    case PassiveA.DistantFoil:
                        if (isPhysicalWeaponType(atkUnit.weaponType)) {
                            return true;
                        }
                        break;
                    case PassiveA.DistantWard:
                        if (atkUnit.weaponType === WeaponType.Staff
                            || isWeaponTypeBreath(atkUnit.weaponType)
                            || isWeaponTypeTome(atkUnit.weaponType)) {
                            return true;
                        }
                        break;
                }
            }
        } else if (atkUnit.isMeleeWeaponType()) {
            for (let skillId of defUnit.enumerateSkills()) {
                switch (skillId) {
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
                    case Weapon.KinsekiNoSyo:
                        if (defUnit.isWeaponSpecialRefined) {
                            if (atkUnit.weaponType === WeaponType.Sword
                                || atkUnit.weaponType === WeaponType.Lance
                                || atkUnit.weaponType === WeaponType.Axe
                                || isWeaponTypeBeast(atkUnit.weaponType)
                            ) {
                                return true;
                            }
                        }
                        break;
                }
            }
        }

        return false;
    },

    /**
     * @param {Unit} atkUnit
     * @param {Unit} defUnit
     * @param {DamageCalcEnv} damageCalcEnv
     * @returns {[number, number]} [inc, dec]: 絶対追撃値、追撃不可値(負の値)
     */
    getFollowupAttackPriorityForBoth(atkUnit, defUnit, damageCalcEnv) {
        let followupAttackPriorityInc = atkUnit.battleContext.followupAttackPriorityIncrement;
        let followupAttackPriorityDec = atkUnit.battleContext.followupAttackPriorityDecrement;
        {
            if (DamageCalculatorWrapper.canActivateBreakerSkill(atkUnit, defUnit)) {
                followupAttackPriorityInc++;
            }

            if (atkUnit.hasStatusEffect(StatusEffectType.FollowUpAttackPlus)) {
                if (atkUnit.battleContext.initiatesCombat) {
                    followupAttackPriorityInc++;
                }
            }

            for (let skillId of atkUnit.enumerateSkills()) {
                switch (skillId) {
                    case PassiveB.BlackEagleRule:
                        if (atkUnit.battleContext.restHpPercentage >= 25) {
                            followupAttackPriorityInc++;
                        }
                        break;
                    case PassiveB.RagingStorm:
                        if (damageCalcEnv.calcPotentialDamage ||
                            (isWeaponTypeBreathOrBeast(defUnit.weaponType)
                                && !this.__isThereAllyInSpecifiedSpaces(atkUnit, 1))
                        ) {
                            followupAttackPriorityInc++;
                        }
                        break;
                    case PassiveB.FuinNoTate:
                        if (isWeaponTypeBreath(defUnit.weaponType)) {
                            followupAttackPriorityInc++;
                        }
                        break;
                    case PassiveB.BindingShield2:
                        if (isWeaponTypeBreath(defUnit.weaponType) || atkUnit.getEvalSpdInCombat() >= defUnit.getEvalSpdInCombat() + 5) {
                            followupAttackPriorityInc++;
                        }
                        break;
                    case PassiveB.TsuigekiRing:
                        if (atkUnit.battleContext.restHpPercentage >= 50) {
                            followupAttackPriorityInc++;
                        }
                        break;
                    case Weapon.VoidTome:
                        if (defUnit.getSpdInPrecombat() >= 35
                            || defUnit.hasNegativeStatusEffect()
                        ) {
                            followupAttackPriorityInc++;
                        }
                        break;

                    case Weapon.Garumu:
                        if (atkUnit.isWeaponRefined) {
                            if (atkUnit.hasPositiveStatusEffect(defUnit)) {
                                followupAttackPriorityInc++;
                            }
                        }
                        else if (atkUnit.isBuffed || atkUnit.isMobilityIncreased) {
                            followupAttackPriorityInc++;
                        }
                        break;
                    case Weapon.AnkigoroshiNoYumi:
                    case Weapon.AnkigoroshiNoYumiPlus:
                        if (isWeaponTypeDagger(defUnit.weaponType)) {
                            followupAttackPriorityInc++;
                        }
                        break;
                    case Weapon.ReginRave:
                        if (!atkUnit.isWeaponRefined) {
                            if (atkUnit.getAtkInCombat(defUnit) > defUnit.getAtkInCombat(atkUnit) || atkUnit.isMobilityIncreased) {
                                followupAttackPriorityInc++;
                            }
                        }
                        break;
                    case Weapon.FlameSiegmund:
                        if (!atkUnit.isWeaponRefined) {
                            if (this.__isEnemyCountIsGreaterThanOrEqualToAllyCount(atkUnit, defUnit, damageCalcEnv.calcPotentialDamage)) {
                                followupAttackPriorityInc++;
                            }
                        }
                        break;
                    case Weapon.Gyorru:
                        if (defUnit.hasNegativeStatusEffect()) {
                            followupAttackPriorityInc++;
                        }
                        break;
                    case Weapon.ChaosManifest:
                        if (!atkUnit.isWeaponRefined) {
                            // <通常効果>
                            if (defUnit.hasNegativeStatusEffect()) {
                                followupAttackPriorityInc++;
                            }
                        }
                        break;
                }
            }
        }

        {
            if (defUnit.hasStatusEffect(StatusEffectType.FollowUpAttackMinus)) {
                followupAttackPriorityDec--;
            }

            if (defUnit.hasStatusEffect(StatusEffectType.ResonantShield) && defUnit.isOneTimeActionActivatedForShieldEffect === false) {
                followupAttackPriorityDec--;
            }
            if (atkUnit.passiveB === PassiveB.WaryFighter3 && atkUnit.battleContext.restHpPercentage >= 50) {
                followupAttackPriorityDec--;
            }
            if (DamageCalculatorWrapper.canActivateBreakerSkill(defUnit, atkUnit)) {
                followupAttackPriorityDec--;
            }

            for (let skillId of defUnit.enumerateSkills()) {
                switch (skillId) {
                    case Weapon.Marute:
                        if (defUnit.isWeaponSpecialRefined) {
                            if (!defUnit.battleContext.initiatesCombat
                                || atkUnit.battleContext.restHpPercentage === 100) {
                                followupAttackPriorityDec--;
                            }
                        }

                        break;
                    case Weapon.TenraiArumazu:
                        if (!defUnit.isWeaponRefined) {
                            if (this.__isAllyCountIsGreaterThanEnemyCount(defUnit, atkUnit, damageCalcEnv.calcPotentialDamage)) {
                                followupAttackPriorityDec--;
                            }
                        } else {
                            if (this.__isThereAllyInSpecifiedSpaces(defUnit, 3)) {
                                followupAttackPriorityDec--;
                            }
                        }
                        break;
                    case Weapon.AnkigoroshiNoYumi:
                    case Weapon.AnkigoroshiNoYumiPlus:
                        if (isWeaponTypeDagger(atkUnit.weaponType)) {
                            followupAttackPriorityDec--;
                        }
                        break;
                    case Weapon.Buryunhirude:
                        if (defUnit.isWeaponSpecialRefined) {
                            if (atkUnit.isRangedWeaponType()) {
                                if (defUnit.getDefInCombat(atkUnit) > atkUnit.getDefInCombat(defUnit)) {
                                    followupAttackPriorityDec--;
                                }
                            }
                        }
                        break;
                    case Weapon.Gyorru:
                        if (atkUnit.hasNegativeStatusEffect()) {
                            followupAttackPriorityDec--;
                        }
                        break;
                    case Weapon.SarieruNoOkama:
                        if (!atkUnit.isWeaponSpecialRefined) {
                            if (atkUnit.isBuffed || atkUnit.isMobilityIncreased) {
                                followupAttackPriorityDec--;
                            }
                        }
                        break;
                    case Weapon.FellBreath:
                        if (defUnit.isWeaponRefined) break;
                        if (atkUnit.battleContext.restHpPercentage < 100) {
                            followupAttackPriorityDec--;
                        }
                        break;
                    case Weapon.ShinenNoBreath:
                        if (defUnit.getDefInCombat(atkUnit) >= atkUnit.getDefInCombat(defUnit) + 5) {
                            followupAttackPriorityDec--;
                        }
                        break;
                    case PassiveB.WaryFighter3:
                        if (defUnit.battleContext.restHpPercentage >= 50) {
                            followupAttackPriorityDec--;
                        }
                        break;
                    case PassiveB.FuinNoTate:
                        if (isWeaponTypeBreath(atkUnit.weaponType)) {
                            followupAttackPriorityDec--;
                        }
                        break;
                    case PassiveB.BindingShield2:
                        if (isWeaponTypeBreath(atkUnit.weaponType) || defUnit.getEvalSpdInCombat() >= atkUnit.getEvalSpdInCombat() + 5) {
                            followupAttackPriorityDec--;
                        }
                        break;
                }
            }
        }
        return [followupAttackPriorityInc, followupAttackPriorityDec];
    },

    __applyDamageReductionRatioBySpecial(defUnit, atkUnit) {
        let attackRange = atkUnit.getAttackRangeDuringCombat(defUnit);
        for (let skillId of defUnit.enumerateSkills()) {
            let func = getSkillFunc(skillId, applyDamageReductionRatioBySpecialFuncMap);
            func?.call(this, defUnit, atkUnit, attackRange);
        }
        switch (defUnit.special) {
            case Special.GodlikeReflexes:
                defUnit.battleContext.damageReductionRatioBySpecial = 0.4;
                break;
            case Special.NegatingFang:
                defUnit.battleContext.damageReductionRatioBySpecial = 0.3;
                break;
            case Special.Seikabuto:
            case Special.Seii:
            case Special.IceMirror:
                if (attackRange === 2) {
                    defUnit.battleContext.damageReductionRatioBySpecial = 0.3;
                }
                break;
            case Special.IceMirror2:
                if (attackRange === 2) {
                    defUnit.battleContext.damageReductionRatioBySpecial = 0.4;
                }
                break;
            case Special.FrostbiteMirror:
                if (attackRange === 1) {
                    defUnit.battleContext.damageReductionRatioBySpecial = 0.1;
                } else if (attackRange === 2) {
                    defUnit.battleContext.damageReductionRatioBySpecial = 0.3;
                }
                break;
            case Special.Seitate:
                if (attackRange === 2) {
                    defUnit.battleContext.damageReductionRatioBySpecial = 0.5;
                }
                break;
            case Special.Kotate:
            case Special.Nagatate:
                if (attackRange === 1) {
                    defUnit.battleContext.damageReductionRatioBySpecial = 0.3;
                }
                break;
            case Special.Otate:
                if (attackRange === 1) {
                    defUnit.battleContext.damageReductionRatioBySpecial = 0.5;
                }
                break;
        }
    },
});
